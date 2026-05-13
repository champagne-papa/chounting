// tests/integration/billReverseRoute.test.ts
//
// Phase 5 chunk B5-3-D6 — route-layer integration test for
// POST /api/orgs/[orgId]/bills/[billId]/reverse.
//
// Pattern: vi.mock('@/services/middleware/serviceContext') + direct route
// handler import (parity with billApproveForPaymentRoute.test.ts and
// recordBillPaymentRoute.test.ts). No localhost URLs (§1 discipline).
//
// Category A floor tests (5):
//   1. 200 success — pending_approval bill → reverse → 200; verify
//      bills.lifecycle_state → voided; reversal JE produced with mirrored
//      lines (Dr ↔ Cr swap per INV-REVERSAL-001); audit row
//      ('bill_reversed') + before_state captured.
//   2. 401 — UNAUTHENTICATED.
//   3. 403 — wrong-org (ORG_ACCESS_DENIED at withInvariants).
//   4. 400 — missing reversal_reason in body → ZodError → 400.
//   5. 500 — bill in 'voided' state (terminal; not in 4-state allowed set)
//      → ServiceError('POST_FAILED', 'BILL_INVALID_STATE_TRANSITION') → 500.
//
// State-coverage tests:
//   - Reverse from approved_for_payment.
//   - Reverse from partially_paid.
//   - Reverse from fully_paid.
//
// Permission test:
//   - 403 — ap_specialist lacks bill.reverse → PERMISSION_DENIED.
//
// §3.1 per-run trace_id prefix for COA + bill_number isolation.
// §3.2 JE/JL/audit_log append-only — bills/payments/allocations DELETE only.

import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import { adminClient, SEED } from '../setup/testDb';
import { ServiceError } from '@/services/errors/ServiceError';
import { billService } from '@/services/spend/billService';
import { makeTestContext } from '../setup/makeTestContext';

// -----------------------------------------------------------------------
// §3.1 per-run isolation.
// -----------------------------------------------------------------------
const traceId = crypto.randomUUID();
const prefix = `T${traceId.slice(0, 8)}_`;

// -----------------------------------------------------------------------
// vi.mock: intercept buildServiceContext. Default returns controller for
// ORG_HOLDING. Individual tests override via mockImplementationOnce.
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

const { POST } = await import(
  '@/app/api/orgs/[orgId]/bills/[billId]/reverse/route'
);

describe('POST /api/orgs/[orgId]/bills/[billId]/reverse route integration', () => {
  const db = adminClient();

  let vendorId: string;
  let apControlAccountId: string;
  let expenseAccountId: string;
  let cashAccountId: string;
  let fiscalPeriodId: string;

  // Bills walked through real state transitions via billService for the
  // happy + state-coverage tests. Each test posts a fresh bill (the
  // 'before' state) and then exercises reverse via the route.
  let billVoidedId: string; // pre-seeded directly in voided state for test 5
  const createdBillIds: string[] = [];
  const createdJeIds: string[] = [];

  // Service context used to drive billService.post / approveForPayment /
  // recordPayment when arranging state-coverage cases. Same trace_id as
  // the route-layer mock so audit assertions remain comparable.
  const arrangeCtx = makeTestContext({
    trace_id: traceId,
    org_ids: [SEED.ORG_HOLDING],
  });

  // -----------------------------------------------------------------------
  // Setup: per-run COA + vendor + open fiscal period; one pre-seeded
  // bill in voided state for the wrong-state rejection test.
  // -----------------------------------------------------------------------
  beforeAll(async () => {
    vendorId = crypto.randomUUID();
    billVoidedId = crypto.randomUUID();

    const apCode = `${prefix}AP`;
    const expCode = `${prefix}EXP`;
    const cashCode = `${prefix}CASH`;
    const { data: created, error: coaErr } = await db
      .from('chart_of_accounts')
      .insert([
        {
          org_id: SEED.ORG_HOLDING,
          account_code: apCode,
          account_name: 'TEST billReverseRoute AP control proxy',
          account_type: 'liability',
        },
        {
          org_id: SEED.ORG_HOLDING,
          account_code: expCode,
          account_name: 'TEST billReverseRoute expense proxy',
          account_type: 'expense',
        },
        {
          org_id: SEED.ORG_HOLDING,
          account_code: cashCode,
          account_name: 'TEST billReverseRoute cash proxy',
          account_type: 'asset',
        },
      ])
      .select('account_id, account_code');
    if (coaErr || !created || created.length !== 3) {
      throw new Error(`COA seed failed: ${coaErr?.message ?? 'no data'}`);
    }
    apControlAccountId = created.find((c) => c.account_code === apCode)!.account_id;
    expenseAccountId = created.find((c) => c.account_code === expCode)!.account_id;
    cashAccountId = created.find((c) => c.account_code === cashCode)!.account_id;

    const { data: period } = await db
      .from('fiscal_periods')
      .select('period_id')
      .eq('org_id', SEED.ORG_HOLDING)
      .eq('is_locked', false)
      .order('start_date', { ascending: true })
      .limit(1)
      .single();
    if (!period) throw new Error('no open fiscal period for ORG_HOLDING');
    fiscalPeriodId = period.period_id;

    const { error: vendorErr } = await db.from('vendors').insert({
      vendor_id: vendorId,
      org_id: SEED.ORG_HOLDING,
      name: 'TEST billReverseRoute vendor',
    });
    if (vendorErr) throw new Error(`vendor seed failed: ${vendorErr.message}`);

    // Pre-seed a voided bill for the state-rejection (test 5).
    const { error: billsErr } = await db.from('bills').insert([
      {
        bill_id: billVoidedId,
        org_id: SEED.ORG_HOLDING,
        vendor_id: vendorId,
        bill_number: `${prefix}VOID`,
        issue_date: '2026-05-12',
        amount_original: '100.0000',
        amount_cad: '100.0000',
        currency: 'CAD',
        fx_rate: '1.00000000',
        lifecycle_state: 'voided',
      },
    ]);
    if (billsErr) throw new Error(`bills seed failed: ${billsErr.message}`);
    createdBillIds.push(billVoidedId);
  });

  afterAll(async () => {
    // JE/JL/audit_log append-only per §3.2; preserve for diagnostics only.
    void createdJeIds;
    void createdBillIds;

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
    await db.from('payments').delete().eq('vendor_id', vendorId);
    await db.from('bills').delete().eq('org_id', SEED.ORG_HOLDING).eq('vendor_id', vendorId);
    await db.from('vendors').delete().eq('vendor_id', vendorId);
    // COA: T-prefixed accounts accumulate per §3.2 finding (FK-blocked).
  });

  // -----------------------------------------------------------------------
  // Helpers
  // -----------------------------------------------------------------------

  let postCounter = 0;
  async function postFreshBill(amountCad: string): Promise<{
    billId: string;
    journalEntryId: string;
  }> {
    postCounter += 1;
    const billNumber = `${prefix}P${postCounter}`;
    const result = await billService.post(
      {
        org_id: SEED.ORG_HOLDING,
        vendor_id: vendorId,
        bill_number: billNumber,
        issue_date: '2026-05-12',
        due_date: '2026-06-12',
        payment_terms_days: 30,
        purchase_order_id: null,
        currency: 'CAD',
        amount_original: amountCad,
        amount_cad: amountCad,
        fx_rate: '1.00000000',
        tax_amount_total: '0.0000',
        bill_lines: [
          {
            account_id: expenseAccountId,
            description: `Test reverse line ${postCounter}`,
            amount: amountCad,
            amount_original: amountCad,
            amount_cad: amountCad,
            tax_code_id: null,
            line_number: 1,
          },
        ],
        fiscal_period_id: fiscalPeriodId,
        entry_date: '2026-05-12',
        ap_control_account_id: apControlAccountId,
      },
      arrangeCtx,
    );
    createdBillIds.push(result.bill_id);
    createdJeIds.push(result.journal_entry_id);
    return { billId: result.bill_id, journalEntryId: result.journal_entry_id };
  }

  async function approveBill(billId: string): Promise<void> {
    await billService.approveForPayment(
      { org_id: SEED.ORG_HOLDING, bill_id: billId },
      arrangeCtx,
    );
  }

  async function recordPayment(
    billId: string,
    amountCad: string,
  ): Promise<void> {
    const result = await billService.recordPayment(
      {
        org_id: SEED.ORG_HOLDING,
        bill_id: billId,
        payment_method: 'eft',
        payment_date: '2026-05-12',
        amount_cad: amountCad,
        reference_number: null,
        fiscal_period_id: fiscalPeriodId,
        entry_date: '2026-05-12',
        ap_control_account_id: apControlAccountId,
        cash_account_id: cashAccountId,
      },
      arrangeCtx,
    );
    createdJeIds.push(result.journal_entry_id);
  }

  function buildBody(overrides: Record<string, unknown> = {}): Record<string, unknown> {
    return {
      reversal_reason: 'route-integration test reversal',
      fiscal_period_id: fiscalPeriodId,
      entry_date: '2026-05-12',
      ...overrides,
    };
  }

  function makeRequest(
    urlOrgId: string,
    urlBillId: string,
    body: Record<string, unknown> = buildBody(),
  ): Request {
    return new Request(
      `http://test/api/orgs/${urlOrgId}/bills/${urlBillId}/reverse`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      },
    );
  }

  // -----------------------------------------------------------------------
  // Test 1 (Category A): 200 success — reverse from pending_approval.
  // Verifies state → voided, reversal JE produced with mirror lines,
  // audit_log row emitted with before_state captured.
  // -----------------------------------------------------------------------
  it('Category A-1: 200 success — reverse pending_approval bill; state → voided; mirror JE; bill_reversed audit', async () => {
    const { billId, journalEntryId } = await postFreshBill('500.0000');

    // Capture original JE lines for mirror-semantics verification.
    const { data: origLines } = await db
      .from('journal_lines')
      .select('*')
      .eq('journal_entry_id', journalEntryId)
      .order('account_id', { ascending: true });
    expect(origLines).toHaveLength(2);

    const req = makeRequest(SEED.ORG_HOLDING, billId);
    const resp = await POST(req, {
      params: Promise.resolve({ orgId: SEED.ORG_HOLDING, billId }),
    });

    expect(resp.status).toBe(200);
    const body = (await resp.json()) as {
      bill_id: string;
      reversal_journal_entry_id: string;
    };
    expect(body.bill_id).toBe(billId);
    expect(body.reversal_journal_entry_id).toMatch(/^[0-9a-f-]{36}$/i);
    expect(body.reversal_journal_entry_id).not.toBe(journalEntryId);
    createdJeIds.push(body.reversal_journal_entry_id);

    // bills.lifecycle_state → voided
    const { data: bill } = await db
      .from('bills')
      .select('lifecycle_state, posted_journal_entry_id')
      .eq('bill_id', billId)
      .single();
    expect(bill!.lifecycle_state).toBe('voided');
    expect(bill!.posted_journal_entry_id).toBe(journalEntryId);

    // Mirror semantics: Dr ↔ Cr swapped, same amounts/accounts.
    const { data: revLines } = await db
      .from('journal_lines')
      .select('*')
      .eq('journal_entry_id', body.reversal_journal_entry_id)
      .order('account_id', { ascending: true });
    expect(revLines).toHaveLength(2);
    for (let i = 0; i < origLines!.length; i++) {
      expect(revLines![i].account_id).toBe(origLines![i].account_id);
      expect(Number(revLines![i].debit_amount)).toBe(Number(origLines![i].credit_amount));
      expect(Number(revLines![i].credit_amount)).toBe(Number(origLines![i].debit_amount));
      expect(Number(revLines![i].amount_cad)).toBe(Number(origLines![i].amount_cad));
    }

    // audit_log: bill_reversed at bill grain, before_state.lifecycle_state.
    const { data: audit } = await db
      .from('audit_log')
      .select('*')
      .eq('trace_id', traceId)
      .eq('action', 'bill_reversed')
      .eq('entity_id', billId);
    expect(audit).toHaveLength(1);
    expect(audit![0].entity_type).toBe('bill');
    expect(audit![0].org_id).toBe(SEED.ORG_HOLDING);
    expect(audit![0].user_id).toBe(SEED.USER_CONTROLLER);
    expect(
      (audit![0].before_state as Record<string, unknown>).lifecycle_state,
    ).toBe('pending_approval');
  });

  // -----------------------------------------------------------------------
  // Test 2: 401 unauthenticated.
  // -----------------------------------------------------------------------
  it('Category A-2: 401 — UNAUTHENTICATED', async () => {
    const { billId } = await postFreshBill('100.0000');

    const { buildServiceContext } = await import(
      '@/services/middleware/serviceContext'
    );
    vi.mocked(buildServiceContext).mockImplementationOnce(async () => {
      throw new ServiceError('UNAUTHENTICATED', 'No valid session');
    });

    const req = makeRequest(SEED.ORG_HOLDING, billId);
    const resp = await POST(req, {
      params: Promise.resolve({ orgId: SEED.ORG_HOLDING, billId }),
    });

    expect(resp.status).toBe(401);
    const body = (await resp.json()) as Record<string, unknown>;
    expect(body.error).toBe('UNAUTHENTICATED');
  });

  // -----------------------------------------------------------------------
  // Test 3: 403 wrong-org (ORG_ACCESS_DENIED).
  // -----------------------------------------------------------------------
  it('Category A-3: 403 — wrong-org (ORG_ACCESS_DENIED at withInvariants)', async () => {
    const { billId } = await postFreshBill('100.0000');

    const req = makeRequest(SEED.ORG_REAL_ESTATE, billId);
    const resp = await POST(req, {
      params: Promise.resolve({ orgId: SEED.ORG_REAL_ESTATE, billId }),
    });

    expect(resp.status).toBe(403);
    const body = (await resp.json()) as Record<string, unknown>;
    expect(body.error).toBe('ORG_ACCESS_DENIED');
  });

  // -----------------------------------------------------------------------
  // Test 4: 400 Zod fail — missing reversal_reason.
  // -----------------------------------------------------------------------
  it('Category A-4: 400 — missing reversal_reason fails Zod min(1)', async () => {
    const { billId } = await postFreshBill('100.0000');

    const req = makeRequest(
      SEED.ORG_HOLDING,
      billId,
      buildBody({ reversal_reason: '' }),
    );
    const resp = await POST(req, {
      params: Promise.resolve({ orgId: SEED.ORG_HOLDING, billId }),
    });

    expect(resp.status).toBe(400);
    const body = (await resp.json()) as Record<string, unknown>;
    expect(body.error).toBe('Invalid request');
    expect(Array.isArray(body.details)).toBe(true);
  });

  // -----------------------------------------------------------------------
  // Test 5: 500 — bill in 'voided' state (terminal; cannot reverse twice).
  // -----------------------------------------------------------------------
  it('Category A-5: 500 — voided bill (BILL_INVALID_STATE_TRANSITION; POST_FAILED → 500)', async () => {
    const req = makeRequest(SEED.ORG_HOLDING, billVoidedId);
    const resp = await POST(req, {
      params: Promise.resolve({ orgId: SEED.ORG_HOLDING, billId: billVoidedId }),
    });

    expect(resp.status).toBe(500);
    const body = (await resp.json()) as Record<string, unknown>;
    expect(body.error).toBe('POST_FAILED');
    expect(typeof body.message).toBe('string');
    expect(body.message as string).toMatch(/BILL_INVALID_STATE_TRANSITION/);
  });

  // -----------------------------------------------------------------------
  // Permission test: ap_specialist lacks bill.reverse → PERMISSION_DENIED.
  // -----------------------------------------------------------------------
  it('403 — ap_specialist user denied (PERMISSION_DENIED; controller-only action)', async () => {
    const { billId } = await postFreshBill('100.0000');

    const { buildServiceContext } = await import(
      '@/services/middleware/serviceContext'
    );
    vi.mocked(buildServiceContext).mockImplementationOnce(async () => ({
      trace_id: traceId,
      caller: {
        user_id: SEED.USER_AP_SPECIALIST,
        email: 'ap@thebridge.local',
        verified: true as const,
        org_ids: [SEED.ORG_HOLDING],
      },
      locale: 'en' as const,
    }));

    const req = makeRequest(SEED.ORG_HOLDING, billId);
    const resp = await POST(req, {
      params: Promise.resolve({ orgId: SEED.ORG_HOLDING, billId }),
    });

    expect(resp.status).toBe(403);
    const body = (await resp.json()) as Record<string, unknown>;
    expect(body.error).toBe('PERMISSION_DENIED');
  });

  // -----------------------------------------------------------------------
  // State-coverage: reverse from approved_for_payment.
  // -----------------------------------------------------------------------
  it('state-coverage: reverse from approved_for_payment → voided', async () => {
    const { billId } = await postFreshBill('100.0000');
    await approveBill(billId);

    const req = makeRequest(SEED.ORG_HOLDING, billId);
    const resp = await POST(req, {
      params: Promise.resolve({ orgId: SEED.ORG_HOLDING, billId }),
    });

    expect(resp.status).toBe(200);
    const body = (await resp.json()) as { reversal_journal_entry_id: string };
    createdJeIds.push(body.reversal_journal_entry_id);

    const { data: bill } = await db
      .from('bills')
      .select('lifecycle_state')
      .eq('bill_id', billId)
      .single();
    expect(bill!.lifecycle_state).toBe('voided');
  });

  // -----------------------------------------------------------------------
  // State-coverage: reverse from partially_paid.
  // -----------------------------------------------------------------------
  it('state-coverage: reverse from partially_paid → voided', async () => {
    const { billId } = await postFreshBill('200.0000');
    await approveBill(billId);
    await recordPayment(billId, '50.0000'); // 50 of 200 → partially_paid

    // Confirm pre-state.
    const { data: pre } = await db
      .from('bills')
      .select('lifecycle_state')
      .eq('bill_id', billId)
      .single();
    expect(pre!.lifecycle_state).toBe('partially_paid');

    const req = makeRequest(SEED.ORG_HOLDING, billId);
    const resp = await POST(req, {
      params: Promise.resolve({ orgId: SEED.ORG_HOLDING, billId }),
    });

    expect(resp.status).toBe(200);
    const body = (await resp.json()) as { reversal_journal_entry_id: string };
    createdJeIds.push(body.reversal_journal_entry_id);

    const { data: bill } = await db
      .from('bills')
      .select('lifecycle_state')
      .eq('bill_id', billId)
      .single();
    expect(bill!.lifecycle_state).toBe('voided');
  });

  // -----------------------------------------------------------------------
  // State-coverage: reverse from fully_paid.
  // -----------------------------------------------------------------------
  it('state-coverage: reverse from fully_paid → voided', async () => {
    const { billId } = await postFreshBill('100.0000');
    await approveBill(billId);
    await recordPayment(billId, '100.0000'); // full payment → fully_paid

    const { data: pre } = await db
      .from('bills')
      .select('lifecycle_state')
      .eq('bill_id', billId)
      .single();
    expect(pre!.lifecycle_state).toBe('fully_paid');

    const req = makeRequest(SEED.ORG_HOLDING, billId);
    const resp = await POST(req, {
      params: Promise.resolve({ orgId: SEED.ORG_HOLDING, billId }),
    });

    expect(resp.status).toBe(200);
    const body = (await resp.json()) as { reversal_journal_entry_id: string };
    createdJeIds.push(body.reversal_journal_entry_id);

    const { data: bill } = await db
      .from('bills')
      .select('lifecycle_state')
      .eq('bill_id', billId)
      .single();
    expect(bill!.lifecycle_state).toBe('voided');
  });
});
