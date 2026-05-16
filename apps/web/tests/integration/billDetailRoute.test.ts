// tests/integration/billDetailRoute.test.ts
//
// Phase 5 chunk B5-3-D5 substrate-correction — route-layer integration test
// for GET /api/orgs/[orgId]/bills/[billId].
//
// Substrate-correction context: closes catch #69 (sibling-class to catch #57
// substrate-grain semantic drift at downstream-consumer grain). RecordPaymentCard
// previously consumed the payment-approval-queue endpoint which post-filters to
// `approved_for_payment` only — broke the partially_paid bill row-click flow
// surfaced from ActivePaymentsView. This per-bill endpoint is the additive-
// substrate solution returning the bill regardless of lifecycle_state.
//
// Pattern: vi.mock('@/services/middleware/serviceContext') + direct route handler
// import (parity with activePaymentsReportRoute.test.ts). Route handler is invoked
// directly (not via HTTP); no localhost URLs anywhere (§1 integration-test-rules
// discipline).
//
// Category A floor tests (5):
//   1. 200 success — bill returned with computed amount_due (300 − 100 = 200).
//   2. 401 unauth — buildServiceContext throws UNAUTHENTICATED → 401.
//   3. 403 wrong-org — buildServiceContext throws ORG_ACCESS_DENIED → 403
//      (per catch #68 lesson: read-side route has no withInvariants; cross-org
//      access in real usage manifests via RLS-empty OR mocked buildServiceContext
//      ORG_ACCESS_DENIED → 403; mirrors activePaymentsReportRoute.test.ts Test 3).
//   4. 500 — non-UUID URL params → BillDetailInputSchema.parse throws raw
//      ZodError inside the service (no try/catch wrap, parity with sibling
//      read-side methods activePayments + paymentApprovalQueue) → escapes
//      route's ServiceError-only catch → 500 with generic "Internal server
//      error" (per catch #67 lesson: substantive 400 path NOT REACHABLE
//      through this read-side route shape).
//   5. 500 service-error mapping — READ_FAILED from service surfaces as 500.
//
// Additional substantive test:
//   - amount_due computation: seed bill (amount_cad=300) + allocation (100) →
//     response.amount_due === '200.0000' per catch #20 helper logic.
//   - lifecycle_state independence: bill in partially_paid state still returns
//     (validates substrate-correction is independent of lifecycle filter).
//
// §3.1 Per-run trace_id prefix for bill_number isolation. No COA writes
// (read-only service surface); §3.2 JE/JL accumulation discipline NOT
// APPLICABLE (no JE/audit_log writes on read).

import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import { adminClient, SEED } from '../setup/testDb';
import { ServiceError } from '@/services/errors/ServiceError';

// -----------------------------------------------------------------------
// §3.1: per-run trace_id prefix for bill_number uniqueness
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
const { GET } = await import(
  '@/app/api/orgs/[orgId]/bills/[billId]/route'
);

describe('GET /api/orgs/[orgId]/bills/[billId] route integration', () => {
  const db = adminClient();

  let vendorId: string;
  let billPartialId: string;
  const createdBillIds: string[] = [];

  beforeAll(async () => {
    vendorId = crypto.randomUUID();
    billPartialId = crypto.randomUUID();

    const { error: vendorErr } = await db.from('vendors').insert({
      vendor_id: vendorId,
      org_id: SEED.ORG_HOLDING,
      name: 'TEST billDetailRoute vendor',
    });
    if (vendorErr) throw new Error(`vendor seed failed: ${vendorErr.message}`);

    const { error: billsErr } = await db.from('bills').insert([
      {
        bill_id: billPartialId,
        org_id: SEED.ORG_HOLDING,
        vendor_id: vendorId,
        bill_number: `${prefix}BD-PART`,
        issue_date: '2026-05-12',
        due_date: '2026-06-12',
        amount_original: '300.0000',
        amount_cad: '300.0000',
        currency: 'CAD',
        fx_rate: '1.00000000',
        lifecycle_state: 'partially_paid',
      },
    ]);
    if (billsErr) throw new Error(`bills seed failed: ${billsErr.message}`);
    createdBillIds.push(billPartialId);

    // Seed payment + allocation against billPartialId (amount=100) so the
    // amount_due computation surfaces 300 - 100 = 200.
    const paymentId = crypto.randomUUID();
    const { error: payErr } = await db.from('payments').insert({
      payment_id: paymentId,
      org_id: SEED.ORG_HOLDING,
      payment_date: '2026-05-12',
      amount: '100.0000',
      currency: 'CAD',
      payment_method: 'eft',
      payment_purpose: 'bill_payment',
      payment_state: 'paid',
      vendor_id: vendorId,
      reference_number: `${prefix}REF`,
    });
    if (payErr) throw new Error(`payment seed failed: ${payErr.message}`);

    const { error: allocErr } = await db.from('bill_payment_allocations').insert({
      bill_payment_allocation_id: crypto.randomUUID(),
      org_id: SEED.ORG_HOLDING,
      payment_id: paymentId,
      bill_id: billPartialId,
      amount_cad: '100.0000',
      created_by: SEED.USER_CONTROLLER,
      trace_id: traceId,
    });
    if (allocErr) throw new Error(`allocation seed failed: ${allocErr.message}`);
  });

  afterAll(async () => {
    if (createdBillIds.length > 0) {
      await db.from('bill_payment_allocations').delete().in('bill_id', createdBillIds);
      await db.from('bills').delete().in('bill_id', createdBillIds);
    }
    await db.from('payments').delete().eq('vendor_id', vendorId);
    await db.from('vendors').delete().eq('vendor_id', vendorId);
  });

  function makeRequest(urlOrgId: string, urlBillId: string): Request {
    return new Request(
      `http://test/api/orgs/${urlOrgId}/bills/${urlBillId}`,
      { method: 'GET' },
    );
  }

  // -----------------------------------------------------------------------
  // Test 1 (Category A): 200 success — bill returned with computed amount_due.
  // -----------------------------------------------------------------------
  it('Category A-1: 200 success — returns bill with computed amount_due', async () => {
    const req = makeRequest(SEED.ORG_HOLDING, billPartialId);
    const resp = await GET(req, {
      params: Promise.resolve({ orgId: SEED.ORG_HOLDING, billId: billPartialId }),
    });

    expect(resp.status).toBe(200);
    const body = (await resp.json()) as {
      bill_id: string;
      vendor_id: string;
      bill_number: string | null;
      due_date: string | null;
      amount_cad: string;
      amount_due: string;
      lifecycle_state: string;
    };

    expect(body.bill_id).toBe(billPartialId);
    expect(body.vendor_id).toBe(vendorId);
    expect(body.bill_number).toBe(`${prefix}BD-PART`);
    expect(body.due_date).toBe('2026-06-12');
    // amount_due computation: 300 - 100 (allocated) = 200.
    expect(Number(body.amount_cad)).toBe(300);
    expect(Number(body.amount_due)).toBe(200);
    // lifecycle_state independence: bill in partially_paid state is returned.
    expect(body.lifecycle_state).toBe('partially_paid');
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
    const resp = await GET(req, {
      params: Promise.resolve({ orgId: SEED.ORG_HOLDING, billId: billPartialId }),
    });

    expect(resp.status).toBe(401);
    const body = (await resp.json()) as Record<string, unknown>;
    expect(body.error).toBe('UNAUTHENTICATED');
  });

  // -----------------------------------------------------------------------
  // Test 3 (Category A): 403 wrong-org.
  // Read-side route has no withInvariants. To verify the 403-mapping path
  // (serviceErrorToStatus('ORG_ACCESS_DENIED') → 403), throw ORG_ACCESS_DENIED
  // from buildServiceContext (mirrors activePaymentsReportRoute.test.ts Test 3
  // per catch #68 lesson).
  // -----------------------------------------------------------------------
  it('Category A-3: 403 — ORG_ACCESS_DENIED surfaces as 403 from serviceErrorToStatus', async () => {
    const { buildServiceContext } = await import('@/services/middleware/serviceContext');
    vi.mocked(buildServiceContext).mockImplementationOnce(async () => {
      throw new ServiceError(
        'ORG_ACCESS_DENIED',
        `Caller not a member of org ${SEED.ORG_REAL_ESTATE}`,
      );
    });

    const req = makeRequest(SEED.ORG_REAL_ESTATE, billPartialId);
    const resp = await GET(req, {
      params: Promise.resolve({ orgId: SEED.ORG_REAL_ESTATE, billId: billPartialId }),
    });

    expect(resp.status).toBe(403);
    const body = (await resp.json()) as Record<string, unknown>;
    expect(body.error).toBe('ORG_ACCESS_DENIED');
  });

  // -----------------------------------------------------------------------
  // Test 4 (Category A): Zod validation failure surface.
  // Non-UUID billId in URL params → BillDetailInputSchema.parse throws
  // raw ZodError inside the service (no try/catch wrap, parity with
  // activePayments + paymentApprovalQueue) → escapes route's
  // ServiceError-only catch → 500 with generic "Internal server error".
  //
  // Per catch #67 lesson: at read-side routes without an upstream Zod
  // validation seam AND no ServiceError-wrap inside the service for input
  // parse failures, non-UUID URL params manifest as 500 "Internal server
  // error" rather than 400. Substantive 400 path NOT REACHABLE through
  // this read-side route shape.
  // -----------------------------------------------------------------------
  it('Category A-4: 500 — non-UUID billId; ZodError escapes ServiceError catch (Internal server error)', async () => {
    const bogusBillId = 'not-a-uuid';
    const req = makeRequest(SEED.ORG_HOLDING, bogusBillId);
    const resp = await GET(req, {
      params: Promise.resolve({ orgId: SEED.ORG_HOLDING, billId: bogusBillId }),
    });

    expect(resp.status).toBe(500);
    const body = (await resp.json()) as Record<string, unknown>;
    expect(body.error).toBe('Internal server error');
  });

  // -----------------------------------------------------------------------
  // Test 5 (Category A): 500 generic service-error mapping.
  // Force the apReportService to throw a generic READ_FAILED ServiceError
  // (e.g., db lookup failure path) → serviceErrorToStatus → 500.
  // -----------------------------------------------------------------------
  it('Category A-5: 500 — READ_FAILED from service maps via serviceErrorToStatus', async () => {
    const { apReportService } = await import('@/services/spend/reports/apReportService');
    const spy = vi
      .spyOn(apReportService, 'billDetail')
      .mockImplementationOnce(async () => {
        throw new ServiceError('READ_FAILED', 'bill_detail: bill lookup failed: simulated');
      });

    try {
      const req = makeRequest(SEED.ORG_HOLDING, billPartialId);
      const resp = await GET(req, {
        params: Promise.resolve({ orgId: SEED.ORG_HOLDING, billId: billPartialId }),
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
