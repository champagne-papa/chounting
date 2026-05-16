// tests/integration/billApproveForPaymentRoute.test.ts
//
// Phase 5 chunk B5-3-D3 substantive session #2 — route-layer integration test
// for POST /api/orgs/[orgId]/bills/[billId]/approve-for-payment.
//
// Pattern: vi.mock('@/services/middleware/serviceContext') + direct route handler
// import (parity with postBillRoute.test.ts). Route handler is invoked directly
// (not via HTTP); no localhost URLs anywhere (§1 integration-test-rules discipline).
//
// Category A floor tests (5):
//   1. 200 success — bill in pending_approval → POST → 200 + { bill_id };
//      verify bills.lifecycle_state updated to 'approved_for_payment';
//      verify recordMutation audit row (bill_approved_for_payment) + before_state;
//      verify NO new journal_entries rows created (Reading B preserved by construction).
//   2. 401 unauth — buildServiceContext throws UNAUTHENTICATED → 401.
//   3. 403 wrong-org — valid auth for ORG_HOLDING only; POST URL targets ORG_REAL_ESTATE
//      → withInvariants ORG_ACCESS_DENIED → 403. (buildServiceContext runs before
//      withInvariants; org-access check fires at withInvariants grain.)
//   4. 400 Zod fail — invalid billId (not a UUID) in URL params → ZodError → 400.
//      Note: orgId and billId are both driven from URL params; passing a non-UUID
//      billId causes ApproveBillForPaymentInputSchema.parse to throw ZodError.
//   5. 500 state-transition fail — bill in 'approved_for_payment' (not 'pending_approval')
//      → ServiceError('POST_FAILED', 'BILL_INVALID_STATE_TRANSITION') →
//      serviceErrorToStatus('POST_FAILED') → 500 (default case in serviceErrorToStatus).
//
// §3.1 Per-run bill_number isolation: per-run unique bill_number from traceId prefix
// `T${traceId.slice(0,8)}_` to avoid UNIQUE(org_id, bill_number) collision across runs.
// §3.2 Approve is state-only — no JE/JL produced; no JE-cleanup mechanism needed.
// audit_log is append-only (no DELETE on audit_log). bills/vendors: not append-only →
// DELETE cleanup permitted.
//
// Disk-grounded findings:
//   - Audit action: 'bill_approved_for_payment' (billService.ts line 453)
//   - serviceErrorToStatus: NOT_FOUND → 404; POST_FAILED → 500 (default);
//     ORG_ACCESS_DENIED → 403; UNAUTHENTICATED → 401
//   - withInvariants action: 'bill.approve' (route.ts line 47)
//   - Route schema: ApproveBillForPaymentInputSchema({ org_id: orgId, bill_id: billId })
//     — Zod fires on non-UUID orgId or billId
//   - Reading B: approve produces NO journal_entries rows (state-only mutation)
//   - Bills can be seeded directly with lifecycle_state: 'pending_approval'
//     (no COA accounts needed; parity with billApproveForPayment.test.ts)

import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import { adminClient, SEED } from '../setup/testDb';
import { ServiceError } from '@/services/errors/ServiceError';

// -----------------------------------------------------------------------
// §3.1: per-run trace_id + bill_number prefix for isolation
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
  '@/app/api/orgs/[orgId]/bills/[billId]/approve-for-payment/route'
);

describe('POST /api/orgs/[orgId]/bills/[billId]/approve-for-payment route integration', () => {
  const db = adminClient();

  let vendorId: string;
  let billPendingId: string;
  let billAlreadyApprovedId: string;

  // -----------------------------------------------------------------------
  // Setup: seed vendor + two bills.
  //   billPendingId: lifecycle_state = 'pending_approval' (success path)
  //   billAlreadyApprovedId: lifecycle_state = 'approved_for_payment' (state-transition fail)
  // No COA accounts needed — approve is state-only.
  // §3.1 discipline: bill_number derived from traceId prefix.
  // -----------------------------------------------------------------------
  beforeAll(async () => {
    vendorId = crypto.randomUUID();
    billPendingId = crypto.randomUUID();
    billAlreadyApprovedId = crypto.randomUUID();

    const { error: vendorErr } = await db.from('vendors').insert({
      vendor_id: vendorId,
      org_id: SEED.ORG_HOLDING,
      name: 'TEST billApproveForPaymentRoute vendor',
    });
    if (vendorErr) throw new Error(`vendor seed failed: ${vendorErr.message}`);

    const { error: billsErr } = await db.from('bills').insert([
      {
        bill_id: billPendingId,
        org_id: SEED.ORG_HOLDING,
        vendor_id: vendorId,
        bill_number: `${prefix}001`,
        issue_date: '2026-05-10',
        amount_original: '500.0000',
        amount_cad: '500.0000',
        currency: 'CAD',
        fx_rate: '1.00000000',
        lifecycle_state: 'pending_approval',
      },
      {
        bill_id: billAlreadyApprovedId,
        org_id: SEED.ORG_HOLDING,
        vendor_id: vendorId,
        bill_number: `${prefix}002`,
        issue_date: '2026-05-10',
        amount_original: '500.0000',
        amount_cad: '500.0000',
        currency: 'CAD',
        fx_rate: '1.00000000',
        lifecycle_state: 'approved_for_payment',
      },
    ]);
    if (billsErr) throw new Error(`bills seed failed: ${billsErr.message}`);
  });

  // -----------------------------------------------------------------------
  // Cleanup: §3.2 discipline.
  // audit_log: append-only — no DELETE attempted.
  // bills/vendors: not append-only → cleanup permitted.
  // -----------------------------------------------------------------------
  afterAll(async () => {
    await db.from('bills').delete().eq('org_id', SEED.ORG_HOLDING).eq('vendor_id', vendorId);
    await db.from('vendors').delete().eq('vendor_id', vendorId);
  });

  // -----------------------------------------------------------------------
  // Helper: construct a Request for the approve-for-payment route handler.
  // Body is empty (route tolerates empty body; org_id + bill_id come from URL params).
  // -----------------------------------------------------------------------
  function makeRequest(urlOrgId: string, body: unknown = {}): Request {
    return new Request(
      `http://test/api/orgs/${urlOrgId}/bills/${billPendingId}/approve-for-payment`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      },
    );
  }

  // -----------------------------------------------------------------------
  // Test 1 (Category A): 200 success path — full side-effect assertions.
  // Bill in 'pending_approval' → POST → 200 + { bill_id };
  // verify lifecycle_state updated; audit row emitted; NO journal_entries created.
  // -----------------------------------------------------------------------
  it('Category A-1: 200 success — transitions pending_approval → approved_for_payment, emits bill_approved_for_payment audit, produces NO journal_entries (Reading B)', async () => {
    // Snapshot journal_entries count at trace_id grain BEFORE mutation.
    const { data: jeBefore } = await db
      .from('journal_entries')
      .select('journal_entry_id')
      .eq('org_id', SEED.ORG_HOLDING);
    const jeCountBefore = (jeBefore ?? []).length;

    const req = makeRequest(SEED.ORG_HOLDING);
    const resp = await POST(req, {
      params: Promise.resolve({ orgId: SEED.ORG_HOLDING, billId: billPendingId }),
    });

    expect(resp.status).toBe(200);
    const body = (await resp.json()) as { bill_id: string };
    expect(body.bill_id).toBe(billPendingId);

    // -- bills.lifecycle_state updated --
    const { data: bill } = await db
      .from('bills')
      .select('lifecycle_state')
      .eq('bill_id', billPendingId)
      .single();
    expect(bill).toBeTruthy();
    expect(bill!.lifecycle_state).toBe('approved_for_payment');

    // -- audit row: bill_approved_for_payment --
    // Action verbatim from billService.ts line 453: 'bill_approved_for_payment'.
    const { data: audit } = await db
      .from('audit_log')
      .select('*')
      .eq('trace_id', traceId)
      .eq('action', 'bill_approved_for_payment')
      .eq('entity_id', billPendingId);
    expect(audit).toHaveLength(1);
    expect(audit![0].entity_type).toBe('bill');
    expect(audit![0].org_id).toBe(SEED.ORG_HOLDING);
    expect(audit![0].user_id).toBe(SEED.USER_CONTROLLER);
    // before_state must capture lifecycle_state: 'pending_approval'
    expect(audit![0].before_state).toBeTruthy();
    expect(
      (audit![0].before_state as Record<string, unknown>).lifecycle_state,
    ).toBe('pending_approval');

    // -- Reading B preservation: NO new journal_entries rows --
    // Approve is state-only; journal_entries count must not increase.
    const { data: jeAfter } = await db
      .from('journal_entries')
      .select('journal_entry_id')
      .eq('org_id', SEED.ORG_HOLDING);
    const jeCountAfter = (jeAfter ?? []).length;
    expect(jeCountAfter).toBe(jeCountBefore);
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

    const req = makeRequest(SEED.ORG_HOLDING);
    const resp = await POST(req, {
      params: Promise.resolve({ orgId: SEED.ORG_HOLDING, billId: billPendingId }),
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
  // (Route schema parse succeeds; buildServiceContext runs; withInvariants fires.)
  // -----------------------------------------------------------------------
  it('Category A-3: 403 — valid auth for ORG_HOLDING only; POST targets ORG_REAL_ESTATE (ORG_ACCESS_DENIED at withInvariants)', async () => {
    const req = new Request(
      `http://test/api/orgs/${SEED.ORG_REAL_ESTATE}/bills/${billPendingId}/approve-for-payment`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      },
    );
    const resp = await POST(req, {
      params: Promise.resolve({ orgId: SEED.ORG_REAL_ESTATE, billId: billPendingId }),
    });

    expect(resp.status).toBe(403);
    const body = (await resp.json()) as Record<string, unknown>;
    expect(body.error).toBe('ORG_ACCESS_DENIED');
  });

  // -----------------------------------------------------------------------
  // Test 4 (Category A): 400 Zod validation failure.
  // Non-UUID billId in URL params → ApproveBillForPaymentInputSchema.parse throws
  // ZodError on bill_id field → route catches → 400 + { error: 'Invalid request' }.
  // -----------------------------------------------------------------------
  it('Category A-4: 400 — Zod validation fails on non-UUID billId in URL params', async () => {
    const bogusBillId = 'not-a-uuid';
    const req = new Request(
      `http://test/api/orgs/${SEED.ORG_HOLDING}/bills/${bogusBillId}/approve-for-payment`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      },
    );
    const resp = await POST(req, {
      params: Promise.resolve({ orgId: SEED.ORG_HOLDING, billId: bogusBillId }),
    });

    expect(resp.status).toBe(400);
    const body = (await resp.json()) as Record<string, unknown>;
    expect(body.error).toBe('Invalid request');
    expect(Array.isArray(body.details)).toBe(true);
  });

  // -----------------------------------------------------------------------
  // Test 5 (Category A): ServiceError(POST_FAILED) → serviceErrorToStatus → 500.
  // Bill in 'approved_for_payment' (not 'pending_approval') →
  // billService.approveForPayment → INV-AP-002 state check fails →
  // ServiceError('POST_FAILED', 'BILL_INVALID_STATE_TRANSITION...') →
  // serviceErrorToStatus('POST_FAILED') → 500 (default case).
  // INV-AP-002 state-transition enforcement verified at route layer.
  // -----------------------------------------------------------------------
  it('Category A-5: 500 — bill already in approved_for_payment (BILL_INVALID_STATE_TRANSITION; POST_FAILED → 500)', async () => {
    const req = new Request(
      `http://test/api/orgs/${SEED.ORG_HOLDING}/bills/${billAlreadyApprovedId}/approve-for-payment`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      },
    );
    const resp = await POST(req, {
      params: Promise.resolve({ orgId: SEED.ORG_HOLDING, billId: billAlreadyApprovedId }),
    });

    // POST_FAILED falls to default in serviceErrorToStatus → 500.
    expect(resp.status).toBe(500);
    const body = (await resp.json()) as Record<string, unknown>;
    expect(body.error).toBe('POST_FAILED');
    expect(typeof body.message).toBe('string');
    expect(body.message as string).toMatch(/BILL_INVALID_STATE_TRANSITION/);
  });
});
