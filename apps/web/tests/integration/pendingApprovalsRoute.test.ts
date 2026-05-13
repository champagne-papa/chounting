// tests/integration/pendingApprovalsRoute.test.ts
//
// Phase 5 arc-closure — route-layer integration test for
// GET /api/orgs/[orgId]/reports/pending-approvals.
//
// Pattern: vi.mock buildServiceContext + direct route handler import
// (parity with activePaymentsReportRoute.test.ts). No localhost URLs.
//
// Category A floor tests (5):
//   1. 200 success — pending_approval bills returned with days_pending shape.
//   2. 401 — UNAUTHENTICATED.
//   3. 403 — ORG_ACCESS_DENIED surfaces as 403 from serviceErrorToStatus.
//   4. 500 — non-UUID orgId; ZodError escapes ServiceError catch.
//   5. 500 — READ_FAILED from service mapping.
//
// Additional substantive tests:
//   - Filter assertion: seed bills across all 7 lifecycle states; response
//     contains ONLY the pending_approval bills.
//   - days_pending shape: returned value is a non-negative integer.

import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import { adminClient, SEED } from '../setup/testDb';
import { ServiceError } from '@/services/errors/ServiceError';

const traceId = crypto.randomUUID();
const prefix = `T${traceId.slice(0, 8)}_`;

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

const { GET } = await import(
  '@/app/api/orgs/[orgId]/reports/pending-approvals/route'
);

describe('GET /api/orgs/[orgId]/reports/pending-approvals route integration', () => {
  const db = adminClient();

  let vendorId: string;
  let billPending1Id: string;
  let billPending2Id: string;
  let billDraftId: string;
  let billApprovedId: string;
  let billPartialId: string;
  let billFullyPaidId: string;
  let billVoidedId: string;
  const createdBillIds: string[] = [];

  beforeAll(async () => {
    vendorId = crypto.randomUUID();
    billPending1Id = crypto.randomUUID();
    billPending2Id = crypto.randomUUID();
    billDraftId = crypto.randomUUID();
    billApprovedId = crypto.randomUUID();
    billPartialId = crypto.randomUUID();
    billFullyPaidId = crypto.randomUUID();
    billVoidedId = crypto.randomUUID();

    const { error: vendorErr } = await db.from('vendors').insert({
      vendor_id: vendorId,
      org_id: SEED.ORG_HOLDING,
      name: 'TEST pendingApprovalsRoute vendor',
    });
    if (vendorErr) throw new Error(`vendor seed failed: ${vendorErr.message}`);

    const baseBill = {
      org_id: SEED.ORG_HOLDING,
      vendor_id: vendorId,
      issue_date: '2026-05-12',
      due_date: '2026-06-12',
      amount_original: '300.0000',
      amount_cad: '300.0000',
      currency: 'CAD',
      fx_rate: '1.00000000',
    };

    const { error: billsErr } = await db.from('bills').insert([
      { ...baseBill, bill_id: billPending1Id,  bill_number: `${prefix}PA-PEND-1`, lifecycle_state: 'pending_approval' },
      { ...baseBill, bill_id: billPending2Id,  bill_number: `${prefix}PA-PEND-2`, lifecycle_state: 'pending_approval', amount_original: '500.0000', amount_cad: '500.0000' },
      { ...baseBill, bill_id: billDraftId,     bill_number: `${prefix}PA-DRAFT`,  lifecycle_state: 'draft' },
      { ...baseBill, bill_id: billApprovedId,  bill_number: `${prefix}PA-APPR`,   lifecycle_state: 'approved_for_payment' },
      { ...baseBill, bill_id: billPartialId,   bill_number: `${prefix}PA-PART`,   lifecycle_state: 'partially_paid' },
      { ...baseBill, bill_id: billFullyPaidId, bill_number: `${prefix}PA-FULL`,   lifecycle_state: 'fully_paid' },
      { ...baseBill, bill_id: billVoidedId,    bill_number: `${prefix}PA-VOID`,   lifecycle_state: 'voided' },
    ]);
    if (billsErr) throw new Error(`bills seed failed: ${billsErr.message}`);
    createdBillIds.push(
      billPending1Id, billPending2Id, billDraftId, billApprovedId,
      billPartialId, billFullyPaidId, billVoidedId,
    );
  });

  afterAll(async () => {
    if (createdBillIds.length > 0) {
      await db.from('bills').delete().in('bill_id', createdBillIds);
    }
    await db.from('vendors').delete().eq('vendor_id', vendorId);
  });

  function makeRequest(urlOrgId: string): Request {
    return new Request(
      `http://test/api/orgs/${urlOrgId}/reports/pending-approvals`,
      { method: 'GET' },
    );
  }

  // -----------------------------------------------------------------------
  // Test 1 (Category A): 200 success — pending_approval bills returned.
  // -----------------------------------------------------------------------
  it('Category A-1: 200 success — returns pending_approval bills with days_pending shape', async () => {
    const req = makeRequest(SEED.ORG_HOLDING);
    const resp = await GET(req, {
      params: Promise.resolve({ orgId: SEED.ORG_HOLDING }),
    });

    expect(resp.status).toBe(200);
    const body = (await resp.json()) as {
      bills: Array<{
        bill_id: string;
        vendor_id: string;
        bill_number: string | null;
        issue_date: string | null;
        due_date: string | null;
        amount_cad: string;
        days_pending: number;
      }>;
      total_amount: string;
    };

    const ourScoped = createdBillIds;
    const ourReturned = body.bills.filter((b) => ourScoped.includes(b.bill_id));

    // pending_approval bills present, others absent.
    expect(ourReturned.find((b) => b.bill_id === billPending1Id)).toBeTruthy();
    expect(ourReturned.find((b) => b.bill_id === billPending2Id)).toBeTruthy();
    expect(ourReturned.find((b) => b.bill_id === billDraftId)).toBeUndefined();
    expect(ourReturned.find((b) => b.bill_id === billApprovedId)).toBeUndefined();
    expect(ourReturned.find((b) => b.bill_id === billPartialId)).toBeUndefined();
    expect(ourReturned.find((b) => b.bill_id === billFullyPaidId)).toBeUndefined();
    expect(ourReturned.find((b) => b.bill_id === billVoidedId)).toBeUndefined();

    const p1 = ourReturned.find((b) => b.bill_id === billPending1Id)!;
    expect(p1.bill_number).toBe(`${prefix}PA-PEND-1`);
    expect(p1.vendor_id).toBe(vendorId);
    expect(p1.issue_date).toBe('2026-05-12');
    expect(p1.due_date).toBe('2026-06-12');
    expect(Number(p1.amount_cad)).toBe(300);
    // days_pending must be a non-negative integer (bill just seeded → likely 0).
    expect(Number.isInteger(p1.days_pending)).toBe(true);
    expect(p1.days_pending).toBeGreaterThanOrEqual(0);
  });

  // -----------------------------------------------------------------------
  // Test 2 (Category A): 401 unauthenticated.
  // -----------------------------------------------------------------------
  it('Category A-2: 401 — no valid session (UNAUTHENTICATED)', async () => {
    const { buildServiceContext } = await import('@/services/middleware/serviceContext');
    vi.mocked(buildServiceContext).mockImplementationOnce(async () => {
      throw new ServiceError('UNAUTHENTICATED', 'No valid session');
    });

    const req = makeRequest(SEED.ORG_HOLDING);
    const resp = await GET(req, {
      params: Promise.resolve({ orgId: SEED.ORG_HOLDING }),
    });

    expect(resp.status).toBe(401);
    const body = (await resp.json()) as Record<string, unknown>;
    expect(body.error).toBe('UNAUTHENTICATED');
  });

  // -----------------------------------------------------------------------
  // Test 3 (Category A): 403 ORG_ACCESS_DENIED maps to 403.
  // Read-side route has no withInvariants; surface via buildServiceContext throw.
  // -----------------------------------------------------------------------
  it('Category A-3: 403 — ORG_ACCESS_DENIED surfaces as 403 from serviceErrorToStatus', async () => {
    const { buildServiceContext } = await import('@/services/middleware/serviceContext');
    vi.mocked(buildServiceContext).mockImplementationOnce(async () => {
      throw new ServiceError(
        'ORG_ACCESS_DENIED',
        `Caller not a member of org ${SEED.ORG_REAL_ESTATE}`,
      );
    });

    const req = makeRequest(SEED.ORG_REAL_ESTATE);
    const resp = await GET(req, {
      params: Promise.resolve({ orgId: SEED.ORG_REAL_ESTATE }),
    });

    expect(resp.status).toBe(403);
    const body = (await resp.json()) as Record<string, unknown>;
    expect(body.error).toBe('ORG_ACCESS_DENIED');
  });

  // -----------------------------------------------------------------------
  // Test 4 (Category A): non-UUID orgId; ZodError escapes ServiceError catch.
  // Mirror of activePaymentsReportRoute Test 4: read-side routes have no
  // ZodError catch, so non-UUID URL params manifest as 500 generic error.
  // -----------------------------------------------------------------------
  it('Category A-4: 500 — non-UUID orgId; ZodError escapes ServiceError catch (Internal server error)', async () => {
    const bogusOrgId = 'not-a-uuid';
    const req = makeRequest(bogusOrgId);
    const resp = await GET(req, {
      params: Promise.resolve({ orgId: bogusOrgId }),
    });

    expect(resp.status).toBe(500);
    const body = (await resp.json()) as Record<string, unknown>;
    expect(body.error).toBe('Internal server error');
  });

  // -----------------------------------------------------------------------
  // Test 5 (Category A): 500 — READ_FAILED ServiceError maps via serviceErrorToStatus.
  // -----------------------------------------------------------------------
  it('Category A-5: 500 — READ_FAILED from service maps via serviceErrorToStatus', async () => {
    const { apReportService } = await import('@/services/spend/reports/apReportService');
    const spy = vi
      .spyOn(apReportService, 'pendingApprovals')
      .mockImplementationOnce(async () => {
        throw new ServiceError('READ_FAILED', 'pending_approvals: bills lookup failed: simulated');
      });

    try {
      const req = makeRequest(SEED.ORG_HOLDING);
      const resp = await GET(req, {
        params: Promise.resolve({ orgId: SEED.ORG_HOLDING }),
      });

      expect(resp.status).toBe(500);
      const body = (await resp.json()) as Record<string, unknown>;
      expect(body.error).toBe('READ_FAILED');
      expect(typeof body.message).toBe('string');
      expect(body.message as string).toMatch(/simulated/);
    } finally {
      spy.mockRestore();
    }
  });
});
