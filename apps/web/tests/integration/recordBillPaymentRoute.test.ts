// tests/integration/recordBillPaymentRoute.test.ts
//
// Phase 5 chunk B5-3-D4 substantive session #1 — route-layer integration test
// for POST /api/orgs/[orgId]/bills/[billId]/record-payment.
//
// Pattern: vi.mock('@/services/middleware/serviceContext') + direct route handler
// import (parity with postBillRoute.test.ts and billApproveForPaymentRoute.test.ts).
// Route handler is invoked directly (not via HTTP); no localhost URLs anywhere
// (§1 integration-test-rules discipline).
//
// Category A floor tests (5):
//   1. 200 success — partial payment (bill 200 CAD, pay 100 CAD) → 200 +
//      { payment_id, bill_id, journal_entry_id, new_lifecycle_state: 'partially_paid' };
//      verify: bills.lifecycle_state updated; bill_payment_allocations row inserted;
//      payments row inserted; journal_entries row inserted (entry_type='regular');
//      journal_lines Dr ap_control / Cr cash; audit_log row (bill_payment_recorded).
//   2. 401 unauth — buildServiceContext throws UNAUTHENTICATED → 401.
//   3. 403 wrong-org — valid auth for ORG_HOLDING only; POST URL targets ORG_REAL_ESTATE
//      → withInvariants ORG_ACCESS_DENIED → 403.
//   4. 400 Zod fail — non-UUID billId in URL params → ZodError → 400.
//   5. 500 state-precondition — bill in 'pending_approval' (not in allowed set) →
//      ServiceError('POST_FAILED', 'BILL_INVALID_STATE_TRANSITION') → 500.
//
// Additional substantive tests:
//   - INV-AP-001 over-allocation: bill 100 CAD, attempt 150 CAD → POST_FAILED +
//     BILL_OVER_ALLOCATION → 500.
//   - Full payment transition: bill 100 CAD, pay 100 CAD → new_lifecycle_state: 'fully_paid';
//     bills.lifecycle_state === 'fully_paid'.
//   - Sub-L CAD-only precondition: bill currency='USD' → POST_FAILED +
//     BILL_MULTI_CURRENCY_NOT_SUPPORTED → 500 (service layer; no DB CHECK on bills.currency).
//   - Multi-payment accumulation (3 POSTs): bill 300 CAD →
//     POST 100 (→ partially_paid) → POST 100 (→ partially_paid) → POST 100 (→ fully_paid);
//     verify INV-AP-001 cumulative-sum logic.
//
// §3.1 Per-run COA isolation: per-run unique account_codes from traceId prefix
// `T${traceId.slice(0,8)}_` to avoid UNIQUE(org_id, account_code) collision
// across runs. §3.2 JE/JL accumulation-acceptance: afterAll voids createdJeIds;
// NO DELETE on journal_entries / journal_lines / audit_log (append-only triggers
// reject all DELETE attempts including service_role).
//
// Disk-grounded findings:
//   - Audit action: 'bill_payment_recorded' (billService.ts line 667)
//   - serviceErrorToStatus: POST_FAILED → 500 (default case); NOT_FOUND → 404;
//     ORG_ACCESS_DENIED → 403; UNAUTHENTICATED → 401
//   - withInvariants action: 'bill.record_payment' (route.ts line 47)
//   - Route schema: RecordBillPaymentInputSchema from org_id/bill_id URL params +
//     JSON body (payment_method, payment_date, amount_cad, reference_number,
//     fiscal_period_id, entry_date, ap_control_account_id, cash_account_id)
//   - journal_entries: no 'posted' boolean column; adjustment_status defaults
//     to 'posted' (parity with postBillRoute.test.ts finding); entry_type='regular'
//   - bill_payment_allocations: primary key is bill_payment_allocation_id (NOT
//     allocation_id); amount_cad column name verbatim per migration 20240139000000
//   - bills.currency has no DB CHECK constraint → USD bills can be seeded directly
//   - bill_number is nullable in schema (initial_schema.sql:416)
//   - §3.2 cleanup: bill_payment_allocations + payments + bills + vendors CAN be
//     deleted (not append-only); journal_entries/journal_lines/audit_log cannot.

import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import { adminClient, SEED } from '../setup/testDb';
import { ServiceError } from '@/services/errors/ServiceError';

// -----------------------------------------------------------------------
// §3.1: per-run trace_id prefix for COA isolation + bill_number uniqueness
// -----------------------------------------------------------------------
const traceId = crypto.randomUUID();
const prefix = `T${traceId.slice(0, 8)}_`;

// -----------------------------------------------------------------------
// vi.mock: intercept buildServiceContext before route handler is imported.
// Default mock returns a valid controller context for ORG_HOLDING.
// Individual tests override via mockImplementationOnce for specific scenarios.
// -----------------------------------------------------------------------
vi.mock('@/services/middleware/serviceContext', async () => {
  const actual =
    await vi.importActual<typeof import('@/services/middleware/serviceContext')>(
      '@/services/middleware/serviceContext',
    );
  return {
    ...actual,
    buildServiceContext: vi.fn(async () => ({
      trace_id: traceId,
      caller: {
        user_id: SEED.USER_CONTROLLER,
        email: 'controller@thebridge.local',
        verified: true as const,
        org_ids: [SEED.ORG_HOLDING],
      },
      locale: 'en' as const,
    })),
  };
});

// Route handler import must come AFTER vi.mock to pick up the mock.
const { POST } = await import(
  '@/app/api/orgs/[orgId]/bills/[billId]/record-payment/route'
);

describe('POST /api/orgs/[orgId]/bills/[billId]/record-payment route integration', () => {
  const db = adminClient();

  let vendorId: string;
  let billPartialId: string;      // Category A-1: 200 CAD, partial payment test
  let billFullPayId: string;      // full-payment transition test (100 CAD)
  let billPendingId: string;      // Category A-5: state-transition fail (pending_approval)
  let billOverAllocId: string;    // INV-AP-001 over-allocation test (100 CAD)
  let billUsdId: string;          // Sub-L CAD-only precondition test
  let billMultiPayId: string;     // multi-payment accumulation test (300 CAD)
  let apControlAccountId: string;
  let cashAccountId: string;
  let fiscalPeriodId: string;
  const createdJeIds: string[] = [];

  // -----------------------------------------------------------------------
  // Setup: seed vendor + per-run COA accounts + fiscal period + bills.
  // §3.1 discipline: account_codes + bill_numbers derived from traceId prefix.
  // -----------------------------------------------------------------------
  beforeAll(async () => {
    vendorId = crypto.randomUUID();
    billPartialId = crypto.randomUUID();
    billFullPayId = crypto.randomUUID();
    billPendingId = crypto.randomUUID();
    billOverAllocId = crypto.randomUUID();
    billUsdId = crypto.randomUUID();
    billMultiPayId = crypto.randomUUID();

    // §3.1 per-run unique account_codes to avoid UNIQUE(org_id, account_code)
    // collision across runs. T-prefix tags rows for aggregate-counting filter.
    const apCode = `${prefix}AP`;
    const cashCode = `${prefix}CASH`;
    const { data: created, error: coaErr } = await db
      .from('chart_of_accounts')
      .insert([
        {
          org_id: SEED.ORG_HOLDING,
          account_code: apCode,
          account_name: 'TEST recordBillPaymentRoute AP control proxy',
          account_type: 'liability',
        },
        {
          org_id: SEED.ORG_HOLDING,
          account_code: cashCode,
          account_name: 'TEST recordBillPaymentRoute cash proxy',
          account_type: 'asset',
        },
      ])
      .select('account_id, account_code');
    if (coaErr || !created || created.length !== 2) {
      throw new Error(`COA seed failed: ${coaErr?.message ?? 'no data'}`);
    }
    apControlAccountId = created.find((c) => c.account_code === apCode)!.account_id;
    cashAccountId = created.find((c) => c.account_code === cashCode)!.account_id;

    // Open fiscal period for ORG_HOLDING.
    const { data: period } = await db
      .from('fiscal_periods')
      .select('period_id, start_date, end_date')
      .eq('org_id', SEED.ORG_HOLDING)
      .eq('is_locked', false)
      .order('start_date', { ascending: true })
      .limit(1)
      .single();
    if (!period) throw new Error('no open fiscal period for ORG_HOLDING');
    fiscalPeriodId = period.period_id;

    // Seed vendor.
    const { error: vendorErr } = await db.from('vendors').insert({
      vendor_id: vendorId,
      org_id: SEED.ORG_HOLDING,
      name: 'TEST recordBillPaymentRoute vendor',
    });
    if (vendorErr) throw new Error(`vendor seed failed: ${vendorErr.message}`);

    // Seed bills in target lifecycle states.
    // bill_number is nullable (initial_schema.sql:416) — use §3.1 prefix for
    // uniqueness on the UNIQUE(org_id, bill_number) constraint.
    const { error: billsErr } = await db.from('bills').insert([
      {
        bill_id: billPartialId,
        org_id: SEED.ORG_HOLDING,
        vendor_id: vendorId,
        bill_number: `${prefix}001`,
        issue_date: '2026-05-12',
        amount_original: '200.0000',
        amount_cad: '200.0000',
        currency: 'CAD',
        fx_rate: '1.00000000',
        lifecycle_state: 'approved_for_payment',
      },
      {
        bill_id: billFullPayId,
        org_id: SEED.ORG_HOLDING,
        vendor_id: vendorId,
        bill_number: `${prefix}002`,
        issue_date: '2026-05-12',
        amount_original: '100.0000',
        amount_cad: '100.0000',
        currency: 'CAD',
        fx_rate: '1.00000000',
        lifecycle_state: 'approved_for_payment',
      },
      {
        bill_id: billPendingId,
        org_id: SEED.ORG_HOLDING,
        vendor_id: vendorId,
        bill_number: `${prefix}003`,
        issue_date: '2026-05-12',
        amount_original: '500.0000',
        amount_cad: '500.0000',
        currency: 'CAD',
        fx_rate: '1.00000000',
        lifecycle_state: 'pending_approval',
      },
      {
        bill_id: billOverAllocId,
        org_id: SEED.ORG_HOLDING,
        vendor_id: vendorId,
        bill_number: `${prefix}004`,
        issue_date: '2026-05-12',
        amount_original: '100.0000',
        amount_cad: '100.0000',
        currency: 'CAD',
        fx_rate: '1.00000000',
        lifecycle_state: 'approved_for_payment',
      },
      {
        bill_id: billUsdId,
        org_id: SEED.ORG_HOLDING,
        vendor_id: vendorId,
        bill_number: `${prefix}005`,
        issue_date: '2026-05-12',
        amount_original: '200.0000',
        amount_cad: '275.0000',
        currency: 'USD',
        fx_rate: '1.37500000',
        lifecycle_state: 'approved_for_payment',
      },
      {
        bill_id: billMultiPayId,
        org_id: SEED.ORG_HOLDING,
        vendor_id: vendorId,
        bill_number: `${prefix}006`,
        issue_date: '2026-05-12',
        amount_original: '300.0000',
        amount_cad: '300.0000',
        currency: 'CAD',
        fx_rate: '1.00000000',
        lifecycle_state: 'approved_for_payment',
      },
    ]);
    if (billsErr) throw new Error(`bills seed failed: ${billsErr.message}`);
  });

  // -----------------------------------------------------------------------
  // Cleanup: §3.2 discipline.
  // journal_entries / journal_lines: append-only (trg_journal_entries_no_delete
  // from migration 20240133000000). DELETE rejected even by service_role.
  // audit_log: append-only (trg_audit_log_no_delete from migration 20240122000000).
  // createdJeIds preserved for diagnostic purposes only; no cleanup attempted.
  // bill_payment_allocations + payments + bills + vendors: NOT append-only →
  // cleanup permitted (order: allocs → payments → bills → vendors).
  // chart_of_accounts cleanup INTENTIONALLY SKIPPED: orphan journal_lines.account_id
  // FK blocks DELETE after JEs posted; T-prefixed accounts accumulate.
  // -----------------------------------------------------------------------
  afterAll(async () => {
    // §3.2: journal_entries is append-only. createdJeIds preserved for diagnostics.
    void createdJeIds;

    // bill_payment_allocations must be deleted before bills/payments (FK guards).
    const { data: ownedBills } = await db
      .from('bills')
      .select('bill_id')
      .eq('org_id', SEED.ORG_HOLDING)
      .eq('vendor_id', vendorId);
    if (ownedBills && ownedBills.length > 0) {
      await db
        .from('bill_payment_allocations')
        .delete()
        .in('bill_id', ownedBills.map((b) => b.bill_id as string));
    }

    // payments DELETE at vendor_id grain.
    await db.from('payments').delete().eq('vendor_id', vendorId);

    // bills DELETE at vendor_id grain — cascades to bill_lines.
    await db.from('bills').delete().eq('org_id', SEED.ORG_HOLDING).eq('vendor_id', vendorId);

    // vendor DELETE.
    await db.from('vendors').delete().eq('vendor_id', vendorId);

    // chart_of_accounts cleanup INTENTIONALLY SKIPPED per §3.2 finding.
  });

  // -----------------------------------------------------------------------
  // Helper: construct a valid JSON body for the record-payment route.
  // org_id + bill_id come from URL params (merged at parse time in route.ts).
  // -----------------------------------------------------------------------
  function buildBody(overrides: Record<string, unknown> = {}): Record<string, unknown> {
    return {
      payment_method: 'eft',
      payment_date: '2026-05-12',
      amount_cad: '100.0000',
      reference_number: `${prefix}REF`,
      fiscal_period_id: fiscalPeriodId,
      entry_date: '2026-05-12',
      ap_control_account_id: apControlAccountId,
      cash_account_id: cashAccountId,
      ...overrides,
    };
  }

  // -----------------------------------------------------------------------
  // Helper: construct a Request for the record-payment route handler.
  // -----------------------------------------------------------------------
  function makeRequest(
    urlOrgId: string,
    urlBillId: string,
    body: Record<string, unknown> = buildBody(),
  ): Request {
    return new Request(
      `http://test/api/orgs/${urlOrgId}/bills/${urlBillId}/record-payment`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      },
    );
  }

  // -----------------------------------------------------------------------
  // Test 1 (Category A): 200 success path — partial payment; full side-effect assertions.
  // Bill in 'approved_for_payment' (amount_cad=200) → POST with amount_cad=100 →
  // 200 + { payment_id, bill_id, journal_entry_id, new_lifecycle_state: 'partially_paid' };
  // verify all six side-effect surfaces.
  // -----------------------------------------------------------------------
  it('Category A-1: 200 success — partial payment (100 of 200 CAD); transitions to partially_paid; emits JE Dr AP/Cr cash; emits bill_payment_recorded audit', async () => {
    const req = makeRequest(SEED.ORG_HOLDING, billPartialId, buildBody({ amount_cad: '100.0000' }));
    const resp = await POST(req, {
      params: Promise.resolve({ orgId: SEED.ORG_HOLDING, billId: billPartialId }),
    });

    expect(resp.status).toBe(200);
    const body = (await resp.json()) as {
      payment_id: string;
      bill_id: string;
      journal_entry_id: string;
      new_lifecycle_state: string;
    };
    expect(body.payment_id).toMatch(/^[0-9a-f-]{36}$/i);
    expect(body.bill_id).toBe(billPartialId);
    expect(body.journal_entry_id).toMatch(/^[0-9a-f-]{36}$/i);
    expect(body.new_lifecycle_state).toBe('partially_paid');
    createdJeIds.push(body.journal_entry_id);

    const { payment_id, journal_entry_id } = body;

    // -- bills.lifecycle_state updated to 'partially_paid' --
    const { data: bill } = await db
      .from('bills')
      .select('lifecycle_state')
      .eq('bill_id', billPartialId)
      .single();
    expect(bill).toBeTruthy();
    expect(bill!.lifecycle_state).toBe('partially_paid');

    // -- bill_payment_allocations row inserted --
    const { data: alloc } = await db
      .from('bill_payment_allocations')
      .select('bill_payment_allocation_id, bill_id, amount_cad')
      .eq('bill_id', billPartialId);
    expect(alloc).toHaveLength(1);
    expect(alloc![0].bill_id).toBe(billPartialId);
    expect(Number(alloc![0].amount_cad)).toBe(100);

    // -- payments row inserted --
    const { data: payment } = await db
      .from('payments')
      .select('payment_id, payment_method, payment_date, reference_number, payment_purpose, payment_state')
      .eq('payment_id', payment_id)
      .single();
    expect(payment).toBeTruthy();
    expect(payment!.payment_method).toBe('eft');
    expect(payment!.payment_date).toBe('2026-05-12');
    expect(payment!.reference_number).toBe(`${prefix}REF`);
    expect(payment!.payment_purpose).toBe('bill_payment');
    expect(payment!.payment_state).toBe('paid');

    // -- journal_entries row inserted (entry_type='regular') --
    const { data: je } = await db
      .from('journal_entries')
      .select('journal_entry_id, entry_type, entry_date, description, adjustment_status')
      .eq('journal_entry_id', journal_entry_id)
      .single();
    expect(je).toBeTruthy();
    expect(je!.entry_type).toBe('regular');
    expect(je!.entry_date).toBe('2026-05-12');
    // Description verbatim from billService.ts line 599: 'Bill payment for {bill_id}'
    expect(je!.description).toBe(`Bill payment for ${billPartialId}`);
    expect(je!.adjustment_status).toBe('posted');

    // -- journal_lines: 1 Dr (ap_control) + 1 Cr (cash) --
    const { data: jeLines } = await db
      .from('journal_lines')
      .select('account_id, debit_amount, credit_amount, currency, fx_rate')
      .eq('journal_entry_id', journal_entry_id);
    expect(jeLines).toHaveLength(2);

    const drLine = jeLines!.find((l) => Number(l.debit_amount) > 0);
    const crLine = jeLines!.find((l) => Number(l.credit_amount) > 0);
    expect(drLine).toBeTruthy();
    expect(crLine).toBeTruthy();
    // Dr ap_control_account_id; debit=100; credit=0; CAD; fx_rate=1
    expect(drLine!.account_id).toBe(apControlAccountId);
    expect(Number(drLine!.debit_amount)).toBe(100);
    expect(Number(drLine!.credit_amount)).toBe(0);
    expect(drLine!.currency).toBe('CAD');
    expect(Number(drLine!.fx_rate)).toBe(1);
    // Cr cash_account_id; debit=0; credit=100; CAD; fx_rate=1
    expect(crLine!.account_id).toBe(cashAccountId);
    expect(Number(crLine!.debit_amount)).toBe(0);
    expect(Number(crLine!.credit_amount)).toBe(100);
    expect(crLine!.currency).toBe('CAD');
    expect(Number(crLine!.fx_rate)).toBe(1);

    // Balanced: sum(Dr) === sum(Cr)
    const totalDr = jeLines!.reduce((s, l) => s + Number(l.debit_amount), 0);
    const totalCr = jeLines!.reduce((s, l) => s + Number(l.credit_amount), 0);
    expect(totalDr).toBe(totalCr);
    expect(totalDr).toBe(100);

    // -- audit_log row: action='bill_payment_recorded' (verbatim from billService.ts:667) --
    // DISTINCT from route action 'bill.record_payment' (dot-notation for withInvariants).
    const { data: audit } = await db
      .from('audit_log')
      .select('*')
      .eq('trace_id', traceId)
      .eq('action', 'bill_payment_recorded')
      .eq('entity_id', billPartialId);
    expect(audit).toHaveLength(1);
    expect(audit![0].entity_type).toBe('bill');
    expect(audit![0].org_id).toBe(SEED.ORG_HOLDING);
    expect(audit![0].user_id).toBe(SEED.USER_CONTROLLER);
    // before_state.lifecycle_state must capture 'approved_for_payment'
    expect(audit![0].before_state).toBeTruthy();
    expect(
      (audit![0].before_state as Record<string, unknown>).lifecycle_state,
    ).toBe('approved_for_payment');
  });

  // -----------------------------------------------------------------------
  // Test 2 (Category A): 401 unauthenticated.
  // buildServiceContext throws UNAUTHENTICATED → serviceErrorToStatus → 401.
  // -----------------------------------------------------------------------
  it('Category A-2: 401 — no valid session (UNAUTHENTICATED)', async () => {
    const { buildServiceContext } = await import('@/services/middleware/serviceContext');
    vi.mocked(buildServiceContext).mockImplementationOnce(async () => {
      throw new ServiceError('UNAUTHENTICATED', 'No valid session');
    });

    const req = makeRequest(SEED.ORG_HOLDING, billPartialId);
    const resp = await POST(req, {
      params: Promise.resolve({ orgId: SEED.ORG_HOLDING, billId: billPartialId }),
    });

    expect(resp.status).toBe(401);
    const body = (await resp.json()) as Record<string, unknown>;
    expect(body.error).toBe('UNAUTHENTICATED');
  });

  // -----------------------------------------------------------------------
  // Test 3 (Category A): 403 wrong-org.
  // Mock caller has org_ids: [ORG_HOLDING] only.
  // URL targets ORG_REAL_ESTATE → withInvariants checks claimedOrgId ORG_REAL_ESTATE
  // not in [ORG_HOLDING] → ORG_ACCESS_DENIED → serviceErrorToStatus → 403.
  // (Route schema parse fires first; Zod passes because both orgId + billId are UUIDs.
  // buildServiceContext runs with default mock; withInvariants fires ORG_ACCESS_DENIED.)
  // -----------------------------------------------------------------------
  it('Category A-3: 403 — valid auth for ORG_HOLDING only; POST targets ORG_REAL_ESTATE (ORG_ACCESS_DENIED at withInvariants)', async () => {
    const req = makeRequest(SEED.ORG_REAL_ESTATE, billPartialId);
    const resp = await POST(req, {
      params: Promise.resolve({ orgId: SEED.ORG_REAL_ESTATE, billId: billPartialId }),
    });

    expect(resp.status).toBe(403);
    const body = (await resp.json()) as Record<string, unknown>;
    expect(body.error).toBe('ORG_ACCESS_DENIED');
  });

  // -----------------------------------------------------------------------
  // Test 4 (Category A): 400 Zod validation failure.
  // Non-UUID billId in URL params → RecordBillPaymentInputSchema.parse throws
  // ZodError on bill_id field → route catches → 400 + { error: 'Invalid request' }.
  // -----------------------------------------------------------------------
  it('Category A-4: 400 — Zod validation fails on non-UUID billId in URL params', async () => {
    const bogusBillId = 'not-a-uuid';
    const req = makeRequest(SEED.ORG_HOLDING, bogusBillId);
    const resp = await POST(req, {
      params: Promise.resolve({ orgId: SEED.ORG_HOLDING, billId: bogusBillId }),
    });

    expect(resp.status).toBe(400);
    const body = (await resp.json()) as Record<string, unknown>;
    expect(body.error).toBe('Invalid request');
    expect(Array.isArray(body.details)).toBe(true);
  });

  // -----------------------------------------------------------------------
  // Test 5 (Category A): ServiceError(POST_FAILED, BILL_INVALID_STATE_TRANSITION) → 500.
  // Bill in 'pending_approval' (not in {approved_for_payment, partially_paid}) →
  // billService.recordPayment → INV-AP-002 state check fails →
  // ServiceError('POST_FAILED', 'BILL_INVALID_STATE_TRANSITION...') →
  // serviceErrorToStatus('POST_FAILED') → 500 (default case).
  // INV-AP-002 state-transition enforcement verified at route layer.
  // -----------------------------------------------------------------------
  it('Category A-5: 500 — bill in pending_approval (invalid state for record_payment); BILL_INVALID_STATE_TRANSITION; POST_FAILED → 500', async () => {
    const req = makeRequest(SEED.ORG_HOLDING, billPendingId);
    const resp = await POST(req, {
      params: Promise.resolve({ orgId: SEED.ORG_HOLDING, billId: billPendingId }),
    });

    // POST_FAILED falls to default in serviceErrorToStatus → 500.
    expect(resp.status).toBe(500);
    const body = (await resp.json()) as Record<string, unknown>;
    expect(body.error).toBe('POST_FAILED');
    expect(typeof body.message).toBe('string');
    expect(body.message as string).toMatch(/BILL_INVALID_STATE_TRANSITION/);
  });

  // -----------------------------------------------------------------------
  // INV-AP-001 over-allocation test.
  // Bill amount_cad=100; POST with amount_cad=150 → cumulative (150) > bill (100) →
  // ServiceError('POST_FAILED', 'BILL_OVER_ALLOCATION') → 500.
  // -----------------------------------------------------------------------
  it('INV-AP-001: 500 — over-allocation (150 > 100 CAD bill); BILL_OVER_ALLOCATION; POST_FAILED → 500', async () => {
    const req = makeRequest(SEED.ORG_HOLDING, billOverAllocId, buildBody({ amount_cad: '150.0000' }));
    const resp = await POST(req, {
      params: Promise.resolve({ orgId: SEED.ORG_HOLDING, billId: billOverAllocId }),
    });

    expect(resp.status).toBe(500);
    const body = (await resp.json()) as Record<string, unknown>;
    expect(body.error).toBe('POST_FAILED');
    expect(typeof body.message).toBe('string');
    expect(body.message as string).toMatch(/BILL_OVER_ALLOCATION/);
  });

  // -----------------------------------------------------------------------
  // Full payment transition test (INV-AP-002 / state-transition verification).
  // Bill amount_cad=100; POST amount_cad=100 → cumulative (100) >= bill (100) →
  // new_lifecycle_state: 'fully_paid'; bills.lifecycle_state === 'fully_paid'.
  // -----------------------------------------------------------------------
  it('Full payment transition: approved_for_payment → fully_paid when amount_cad equals bill amount', async () => {
    const req = makeRequest(SEED.ORG_HOLDING, billFullPayId, buildBody({ amount_cad: '100.0000' }));
    const resp = await POST(req, {
      params: Promise.resolve({ orgId: SEED.ORG_HOLDING, billId: billFullPayId }),
    });

    expect(resp.status).toBe(200);
    const body = (await resp.json()) as { new_lifecycle_state: string; journal_entry_id: string };
    expect(body.new_lifecycle_state).toBe('fully_paid');
    createdJeIds.push(body.journal_entry_id);

    // DB state confirmation.
    const { data: bill } = await db
      .from('bills')
      .select('lifecycle_state')
      .eq('bill_id', billFullPayId)
      .single();
    expect(bill!.lifecycle_state).toBe('fully_paid');
  });

  // -----------------------------------------------------------------------
  // Sub-L CAD-only precondition test.
  // Bill currency='USD'; bills.currency has no DB CHECK → USD bills insertable.
  // Service layer enforces bill.currency === 'CAD' precondition (billService.ts:519-523).
  // POST → ServiceError('POST_FAILED', 'BILL_MULTI_CURRENCY_NOT_SUPPORTED') → 500.
  // -----------------------------------------------------------------------
  it('Sub-L: 500 — bill currency=USD rejects at service layer (BILL_MULTI_CURRENCY_NOT_SUPPORTED; POST_FAILED → 500)', async () => {
    const req = makeRequest(SEED.ORG_HOLDING, billUsdId);
    const resp = await POST(req, {
      params: Promise.resolve({ orgId: SEED.ORG_HOLDING, billId: billUsdId }),
    });

    expect(resp.status).toBe(500);
    const body = (await resp.json()) as Record<string, unknown>;
    expect(body.error).toBe('POST_FAILED');
    expect(typeof body.message).toBe('string');
    expect(body.message as string).toMatch(/BILL_MULTI_CURRENCY_NOT_SUPPORTED/);
  });

  // -----------------------------------------------------------------------
  // Multi-payment accumulation test (INV-AP-001 cumulative-sum logic).
  // Bill amount_cad=300; 3 consecutive POSTs of 100 each:
  //   POST 1: cumulative=100 < 300 → partially_paid
  //   POST 2: cumulative=200 < 300 → partially_paid
  //   POST 3: cumulative=300 >= 300 → fully_paid
  // Verifies INV-AP-001 cumulative-sum arithmetic at route layer.
  // -----------------------------------------------------------------------
  it('Multi-payment accumulation: 3 × 100 CAD payments against 300 CAD bill; partially_paid × 2 → fully_paid', async () => {
    // POST 1: 100 of 300 → partially_paid
    const req1 = makeRequest(SEED.ORG_HOLDING, billMultiPayId, buildBody({ amount_cad: '100.0000' }));
    const resp1 = await POST(req1, {
      params: Promise.resolve({ orgId: SEED.ORG_HOLDING, billId: billMultiPayId }),
    });
    expect(resp1.status).toBe(200);
    const body1 = (await resp1.json()) as { new_lifecycle_state: string; journal_entry_id: string };
    expect(body1.new_lifecycle_state).toBe('partially_paid');
    createdJeIds.push(body1.journal_entry_id);

    // DB state after POST 1.
    const { data: billAfter1 } = await db
      .from('bills')
      .select('lifecycle_state')
      .eq('bill_id', billMultiPayId)
      .single();
    expect(billAfter1!.lifecycle_state).toBe('partially_paid');

    // POST 2: 100 more → cumulative=200 < 300 → still partially_paid
    const req2 = makeRequest(SEED.ORG_HOLDING, billMultiPayId, buildBody({ amount_cad: '100.0000' }));
    const resp2 = await POST(req2, {
      params: Promise.resolve({ orgId: SEED.ORG_HOLDING, billId: billMultiPayId }),
    });
    expect(resp2.status).toBe(200);
    const body2 = (await resp2.json()) as { new_lifecycle_state: string; journal_entry_id: string };
    expect(body2.new_lifecycle_state).toBe('partially_paid');
    createdJeIds.push(body2.journal_entry_id);

    // DB state after POST 2.
    const { data: billAfter2 } = await db
      .from('bills')
      .select('lifecycle_state')
      .eq('bill_id', billMultiPayId)
      .single();
    expect(billAfter2!.lifecycle_state).toBe('partially_paid');

    // POST 3: 100 more → cumulative=300 >= 300 → fully_paid
    const req3 = makeRequest(SEED.ORG_HOLDING, billMultiPayId, buildBody({ amount_cad: '100.0000' }));
    const resp3 = await POST(req3, {
      params: Promise.resolve({ orgId: SEED.ORG_HOLDING, billId: billMultiPayId }),
    });
    expect(resp3.status).toBe(200);
    const body3 = (await resp3.json()) as { new_lifecycle_state: string; journal_entry_id: string };
    expect(body3.new_lifecycle_state).toBe('fully_paid');
    createdJeIds.push(body3.journal_entry_id);

    // DB state after POST 3.
    const { data: billAfter3 } = await db
      .from('bills')
      .select('lifecycle_state')
      .eq('bill_id', billMultiPayId)
      .single();
    expect(billAfter3!.lifecycle_state).toBe('fully_paid');

    // 3 allocation rows summing to 300.
    const { data: allocs } = await db
      .from('bill_payment_allocations')
      .select('amount_cad')
      .eq('bill_id', billMultiPayId);
    expect(allocs).toHaveLength(3);
    const sum = allocs!.reduce((s, a) => s + Number(a.amount_cad), 0);
    expect(sum).toBe(300);
  });
});
