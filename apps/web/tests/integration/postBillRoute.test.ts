// tests/integration/postBillRoute.test.ts
//
// Phase 5 chunk B5-3-D3 substantive session #1 — route-layer integration test
// for POST /api/orgs/[orgId]/bills.
//
// Pattern: vi.mock('@/services/middleware/serviceContext') + direct route handler
// import (parity with orgGetCrossOrg.test.ts). Route handler is invoked directly
// (not via HTTP); no localhost URLs anywhere (§1 integration-test-rules discipline).
//
// Category A floor tests (5):
//   1. 201 success — valid bill input → 201 + { bill_id, journal_entry_id };
//      verify bills row + bill_lines rows + journal_entries row + journal_lines
//      Dr expense / Cr ap_control + bills.posted_journal_entry_id back-ref +
//      recordMutation audit row (bill_created) + INV-AP-001 allocation sum.
//   2. 401 unauth — buildServiceContext throws UNAUTHENTICATED → 401.
//   3. 403 wrong-org — valid auth for ORG_HOLDING only; POST body + URL target
//      ORG_REAL_ESTATE → withInvariants ORG_ACCESS_DENIED → 403.
//      (URL/body match passes, org-access check fires at withInvariants grain.)
//   4. 400 Zod fail — invalid body (missing required field) → ZodError → 400.
//   5. 500 service-error mapping — valid input with non-existent vendor_id
//      → ServiceError('NOT_FOUND') → serviceErrorToStatus('NOT_FOUND') → 404.
//      (Proves the ServiceError catch branch maps to HTTP status via serviceErrorToStatus;
//      NOT_FOUND is the deterministic, no-write trigger. Task plan says "status from
//      serviceErrorToStatus" — 404 is the correct mapped status for NOT_FOUND.)
//
// §3.1 Per-run COA isolation: per-run unique account_codes from traceId prefix
// `T${traceId.slice(0,8)}_` to avoid UNIQUE(org_id, account_code) collision
// across runs. §3.2 JE/JL accumulation-acceptance: afterAll voids createdJeIds;
// NO DELETE on journal_entries / journal_lines / audit_log (append-only triggers
// reject all DELETE attempts including service_role).
//
// 403 ordering finding (verbatim): route.ts line 34 checks `parsed.org_id !== orgId`
// BEFORE buildServiceContext (line 41). If body org_id matches URL orgId (both
// ORG_REAL_ESTATE), the mismatch guard passes → buildServiceContext runs → withInvariants
// fires ORG_ACCESS_DENIED → 403. If body org_id differs from URL orgId, the mismatch
// guard fires first → 400. The 403 test uses body org_id = URL orgId = ORG_REAL_ESTATE
// with mock caller org_ids = [ORG_HOLDING] only; withInvariants fires first.
//
// Audit action finding (verbatim): billService.ts line 377 emits action: 'bill_created'.

import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import { adminClient, SEED } from '../setup/testDb';
import { ServiceError } from '@/services/errors/ServiceError';

// -----------------------------------------------------------------------
// §3.1: per-run trace_id prefix for COA isolation
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
const { POST } = await import('@/app/api/orgs/[orgId]/bills/route');

describe('POST /api/orgs/[orgId]/bills route integration', () => {
  const db = adminClient();

  let vendorId: string;
  let apControlAccountId: string;
  let expenseAccountId: string;
  let fiscalPeriodId: string;
  const createdJeIds: string[] = [];

  // -----------------------------------------------------------------------
  // Setup: seed vendor + per-run COA accounts + resolve open fiscal period.
  // §3.1 discipline: codes derived from traceId prefix.
  // -----------------------------------------------------------------------
  beforeAll(async () => {
    vendorId = crypto.randomUUID();

    // §3.1 per-run unique account_codes to avoid UNIQUE(org_id, account_code)
    // collision across runs. chart_of_accounts has no append-only trigger;
    // DELETE cleanup is permitted but skipped (journal_lines FK prevents it
    // after JEs are posted). T-prefix tags rows for aggregate-counting filter
    // per §3.2 read-side discipline.
    const apCode = `${prefix}AP`;
    const expCode = `${prefix}EXP`;
    const { data: created, error: coaErr } = await db
      .from('chart_of_accounts')
      .insert([
        {
          org_id: SEED.ORG_HOLDING,
          account_code: apCode,
          account_name: 'TEST postBillRoute AP control proxy',
          account_type: 'liability',
        },
        {
          org_id: SEED.ORG_HOLDING,
          account_code: expCode,
          account_name: 'TEST postBillRoute expense proxy',
          account_type: 'expense',
        },
      ])
      .select('account_id, account_code');
    if (coaErr || !created || created.length !== 2) {
      throw new Error(`COA seed failed: ${coaErr?.message ?? 'no data'}`);
    }
    apControlAccountId = created.find((c) => c.account_code === apCode)!.account_id;
    expenseAccountId = created.find((c) => c.account_code === expCode)!.account_id;

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

    // Seed vendor in ORG_HOLDING.
    const { error: vendorErr } = await db.from('vendors').insert({
      vendor_id: vendorId,
      org_id: SEED.ORG_HOLDING,
      name: 'TEST postBillRoute vendor',
    });
    if (vendorErr) throw new Error(`vendor seed failed: ${vendorErr.message}`);
  });

  // -----------------------------------------------------------------------
  // Cleanup: §3.2 discipline.
  // journal_entries / journal_lines: append-only (trg_journal_entries_no_delete
  // from migration 20240133000000). DELETE rejected even by service_role.
  // createdJeIds preserved for diagnostic purposes only; no cleanup attempted.
  // bills/vendors: not append-only → cleanup permitted.
  // chart_of_accounts: cleanup blocked by orphan journal_lines.account_id FK
  // after JEs posted; T-prefixed accounts accumulate across runs (§3.2).
  // -----------------------------------------------------------------------
  afterAll(async () => {
    // §3.2: journal_entries is append-only — DELETE cleanup rejected by
    // trg_journal_entries_no_delete. Rows accumulate canonically across runs.
    // The createdJeIds array is preserved for diagnostic purposes only;
    // no cleanup attempted.
    void createdJeIds;

    // bills DELETE at vendor_id grain — cascades to bill_lines via ON DELETE CASCADE.
    await db.from('bills').delete().eq('org_id', SEED.ORG_HOLDING).eq('vendor_id', vendorId);

    // vendor DELETE.
    await db.from('vendors').delete().eq('vendor_id', vendorId);

    // chart_of_accounts cleanup INTENTIONALLY SKIPPED per §3.2 finding.
    // T-prefixed accounts accumulate; trial-balance filter handles visibility.
  });

  // -----------------------------------------------------------------------
  // Helper: build a valid PostBillInput body for ORG_HOLDING.
  // -----------------------------------------------------------------------
  function buildValidBody(overrides: Record<string, unknown> = {}) {
    return {
      org_id: SEED.ORG_HOLDING,
      vendor_id: vendorId,
      bill_number: `${prefix}001`,
      issue_date: '2026-05-10',
      due_date: '2026-06-10',
      payment_terms_days: 30,
      purchase_order_id: null,
      currency: 'CAD',
      amount_original: '750.0000',
      amount_cad: '750.0000',
      fx_rate: '1.00000000',
      tax_amount_total: '0.0000',
      bill_lines: [
        {
          account_id: expenseAccountId,
          description: 'TEST route integration expense line',
          amount: '750.0000',
          amount_original: '750.0000',
          amount_cad: '750.0000',
          tax_code_id: null,
          line_number: 1,
        },
      ],
      fiscal_period_id: fiscalPeriodId,
      entry_date: '2026-05-10',
      ap_control_account_id: apControlAccountId,
      // INV-DOC-001 bypass per Sub-Q4-d (Phase 5.1 chunk 5.1a Task 7b).
      override_evidence_completeness: true,
      ...overrides,
    };
  }

  // -----------------------------------------------------------------------
  // Helper: construct a Request for the route handler.
  // -----------------------------------------------------------------------
  function makeRequest(body: unknown, urlOrgId: string = SEED.ORG_HOLDING): Request {
    return new Request(`http://test/api/orgs/${urlOrgId}/bills`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  }

  // -----------------------------------------------------------------------
  // Test 1 (Category A): 201 success path — full side-effect assertions.
  // -----------------------------------------------------------------------
  it('Category A-1: 201 success — creates bill, posts balanced JE, populates back-ref, emits bill_created audit', async () => {
    const req = makeRequest(buildValidBody());
    const resp = await POST(req, { params: Promise.resolve({ orgId: SEED.ORG_HOLDING }) });

    expect(resp.status).toBe(201);
    const body = await resp.json() as { bill_id: string; journal_entry_id: string };
    expect(body.bill_id).toMatch(/^[0-9a-f-]{36}$/i);
    expect(body.journal_entry_id).toMatch(/^[0-9a-f-]{36}$/i);
    createdJeIds.push(body.journal_entry_id);

    const { bill_id, journal_entry_id } = body;

    // -- bills row --
    const { data: bill } = await db
      .from('bills')
      .select('*')
      .eq('bill_id', bill_id)
      .single();
    expect(bill).toBeTruthy();
    expect(bill!.lifecycle_state).toBe('pending_approval');
    // Sub-N (b) back-reference
    expect(bill!.posted_journal_entry_id).toBe(journal_entry_id);
    expect(bill!.org_id).toBe(SEED.ORG_HOLDING);
    expect(bill!.vendor_id).toBe(vendorId);
    expect(Number(bill!.amount_cad)).toBe(750);

    // -- bill_lines rows --
    const { data: lines } = await db
      .from('bill_lines')
      .select('*')
      .eq('bill_id', bill_id);
    expect(lines).toHaveLength(1);
    expect(lines![0].account_id).toBe(expenseAccountId);
    expect(lines![0].line_number).toBe(1);
    expect(Number(lines![0].amount_cad)).toBe(750);

    // INV-AP-001: sum(bill_lines.amount_cad) === bill.amount_cad
    const lineSum = lines!.reduce((s, l) => s + Number(l.amount_cad), 0);
    expect(lineSum).toBe(Number(bill!.amount_cad));

    // -- journal_entries row --
    const { data: je } = await db
      .from('journal_entries')
      .select('*')
      .eq('journal_entry_id', journal_entry_id)
      .single();
    expect(je).toBeTruthy();
    expect(je!.org_id).toBe(SEED.ORG_HOLDING);
    expect(je!.entry_date).toBe('2026-05-10');
    // journal_entries has no 'posted' boolean column; adjustment_status
    // defaults to 'posted' (migration 20240129000000); entry_type = 'regular'
    // for a new bill posting.
    expect(je!.adjustment_status).toBe('posted');
    expect(je!.entry_type).toBe('regular');

    // -- journal_lines: Dr expense / Cr ap_control --
    const { data: jeLines } = await db
      .from('journal_lines')
      .select('*')
      .eq('journal_entry_id', journal_entry_id);
    expect(jeLines).toHaveLength(2);

    const drLine = jeLines!.find((l) => Number(l.debit_amount) > 0);
    const crLine = jeLines!.find((l) => Number(l.credit_amount) > 0);
    expect(drLine).toBeTruthy();
    expect(crLine).toBeTruthy();
    // Dr expense account (per bill_line.account_id)
    expect(drLine!.account_id).toBe(expenseAccountId);
    expect(Number(drLine!.debit_amount)).toBe(750);
    // Cr ap_control_account_id (aggregate)
    expect(crLine!.account_id).toBe(apControlAccountId);
    expect(Number(crLine!.credit_amount)).toBe(750);

    // Balanced: sum(Dr) === sum(Cr)
    const totalDr = jeLines!.reduce((s, l) => s + Number(l.debit_amount), 0);
    const totalCr = jeLines!.reduce((s, l) => s + Number(l.credit_amount), 0);
    expect(totalDr).toBe(totalCr);
    expect(totalDr).toBe(750);

    // -- recordMutation audit row: bill_created --
    // Audit action verbatim from billService.ts line 377: 'bill_created'.
    const { data: audit } = await db
      .from('audit_log')
      .select('*')
      .eq('entity_id', bill_id)
      .eq('action', 'bill_created');
    expect(audit).toHaveLength(1);
    expect(audit![0].entity_type).toBe('bill');
    expect(audit![0].org_id).toBe(SEED.ORG_HOLDING);
    expect(audit![0].user_id).toBe(SEED.USER_CONTROLLER);
  });

  // -----------------------------------------------------------------------
  // Test 2 (Category A): 401 unauthenticated.
  // buildServiceContext throws UNAUTHENTICATED → route catches as ServiceError
  // → serviceErrorToStatus('UNAUTHENTICATED') → 401.
  // -----------------------------------------------------------------------
  it('Category A-2: 401 — no valid session (UNAUTHENTICATED)', async () => {
    const { buildServiceContext } = await import('@/services/middleware/serviceContext');
    vi.mocked(buildServiceContext).mockImplementationOnce(async () => {
      throw new ServiceError('UNAUTHENTICATED', 'No valid session');
    });

    const req = makeRequest(buildValidBody());
    const resp = await POST(req, { params: Promise.resolve({ orgId: SEED.ORG_HOLDING }) });

    expect(resp.status).toBe(401);
    const body = await resp.json() as Record<string, unknown>;
    expect(body.error).toBe('UNAUTHENTICATED');
  });

  // -----------------------------------------------------------------------
  // Test 3 (Category A): 403 wrong-org.
  // Mock caller has org_ids: [ORG_HOLDING] only.
  // POST body org_id = ORG_REAL_ESTATE, URL orgId = ORG_REAL_ESTATE.
  // Route mismatch guard (line 34): parsed.org_id === orgId → passes (both ORG_REAL_ESTATE).
  // buildServiceContext runs → withInvariants checks claimedOrgId ORG_REAL_ESTATE
  // not in [ORG_HOLDING] → ORG_ACCESS_DENIED → serviceErrorToStatus → 403.
  //
  // Ordering finding: 403 fires at withInvariants grain (after buildServiceContext),
  // NOT at the URL/body mismatch guard (line 34 in route.ts fires first only when
  // parsed.org_id !== orgId, which is NOT the case in this test).
  // -----------------------------------------------------------------------
  it('Category A-3: 403 — valid auth for ORG_HOLDING only; POST targets ORG_REAL_ESTATE (ORG_ACCESS_DENIED at withInvariants)', async () => {
    // Bill body for ORG_REAL_ESTATE: use same vendor/accounts in ORG_HOLDING
    // but claim ORG_REAL_ESTATE org_id. The withInvariants org-access check
    // fires before any DB access, so no rows are written.
    const req = makeRequest(
      { ...buildValidBody(), org_id: SEED.ORG_REAL_ESTATE },
      SEED.ORG_REAL_ESTATE,
    );
    const resp = await POST(req, { params: Promise.resolve({ orgId: SEED.ORG_REAL_ESTATE }) });

    expect(resp.status).toBe(403);
    const body = await resp.json() as Record<string, unknown>;
    expect(body.error).toBe('ORG_ACCESS_DENIED');
  });

  // -----------------------------------------------------------------------
  // Test 4 (Category A): 400 Zod validation failure.
  // Send body with vendor_id missing (required field) → PostBillInputSchema.parse
  // throws ZodError → route catches → 400 + { error: 'Invalid request', details }.
  // -----------------------------------------------------------------------
  it('Category A-4: 400 — Zod validation fails on missing required field (vendor_id)', async () => {
    const { vendor_id: _removed, ...bodyWithoutVendorId } = buildValidBody() as { vendor_id: unknown } & Record<string, unknown>;
    const req = makeRequest(bodyWithoutVendorId);
    const resp = await POST(req, { params: Promise.resolve({ orgId: SEED.ORG_HOLDING }) });

    expect(resp.status).toBe(400);
    const body = await resp.json() as Record<string, unknown>;
    expect(body.error).toBe('Invalid request');
    expect(Array.isArray(body.details)).toBe(true);
  });

  // -----------------------------------------------------------------------
  // Test 5 (Category A): ServiceError → HTTP status mapping via serviceErrorToStatus.
  // Use a non-existent vendor_id (valid UUID format, no matching row) →
  // billService.post → loadVendorOrThrow → ServiceError('NOT_FOUND', ...) →
  // route catches → serviceErrorToStatus('NOT_FOUND') → 404.
  // This proves the ServiceError catch branch maps codes to HTTP status.
  // NOT_FOUND is deterministic and writes no rows (pre-DB check).
  // -----------------------------------------------------------------------
  it('Category A-5: ServiceError → serviceErrorToStatus mapping — NOT_FOUND vendor_id → 404', async () => {
    const bogusVendorId = '00000000-0000-0000-0000-deadbeef9999';
    const req = makeRequest(buildValidBody({ vendor_id: bogusVendorId }));
    const resp = await POST(req, { params: Promise.resolve({ orgId: SEED.ORG_HOLDING }) });

    // NOT_FOUND → serviceErrorToStatus → 404.
    expect(resp.status).toBe(404);
    const body = await resp.json() as Record<string, unknown>;
    // Route emits { error: err.code, message: err.message } for ServiceError.
    expect(body.error).toBe('NOT_FOUND');
    expect(typeof body.message).toBe('string');
  });
});
