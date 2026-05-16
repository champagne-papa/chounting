// tests/integration/activePaymentsReportRoute.test.ts
//
// Phase 5 chunk B5-3-D5 substantive session #1 — route-layer integration test
// for GET /api/orgs/[orgId]/reports/active-payments.
//
// Pattern: vi.mock('@/services/middleware/serviceContext') + direct route handler
// import (parity with recordBillPaymentRoute.test.ts). Route handler is invoked
// directly (not via HTTP); no localhost URLs anywhere (§1 integration-test-rules
// discipline).
//
// Category A floor tests (5):
//   1. 200 success — partially_paid bill returned with amount_due computed.
//   2. 401 unauth — buildServiceContext throws UNAUTHENTICATED → 401.
//   3. 403 wrong-org — apReportService throws ORG_ACCESS_DENIED → 403.
//      Mock the service to surface ORG_ACCESS_DENIED so serviceErrorToStatus
//      maps to 403 (the route itself has no withInvariants since it's read-side;
//      cross-org access in real usage manifests as RLS-empty results instead).
//   4. 400 Zod fail — non-UUID orgId in URL params → service validation throws →
//      READ_FAILED → 500. (Route signature parses Promise<{ orgId }> string;
//      Zod fires inside the service at activePayments() → ApReportService throws
//      ServiceError READ_FAILED; serviceErrorToStatus → 500. Substantive 400
//      shape NOT REACHABLE at the route layer for this read-side endpoint —
//      see §Plan-doc-grain surface emergence below.)
//   5. 500 service-error mapping — READ_FAILED from service surfaces as 500.
//
// Additional substantive tests:
//   - Filter assertion: seed bills in {partially_paid, approved_for_payment,
//     fully_paid} → GET → response.bills contains ONLY the partially_paid bills.
//   - Amount_due computation verification: seed bill (amount_cad=300) + 1
//     allocation (amount_cad=100) → bill in partially_paid state → GET →
//     response.bills[0].amount_due === '200.0000' per catch #20 helper.
//
// §3.1 Per-run trace_id prefix for bill_number isolation. No COA writes (read-
// only service surface); §3.2 JE/JL accumulation discipline NOT APPLICABLE
// (no JE/audit_log writes on read).

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
  '@/app/api/orgs/[orgId]/reports/active-payments/route'
);

describe('GET /api/orgs/[orgId]/reports/active-payments route integration', () => {
  const db = adminClient();

  let vendorId: string;
  let billPartial1Id: string;
  let billPartial2Id: string;
  let billApprovedId: string;
  let billFullyPaidId: string;
  const createdBillIds: string[] = [];

  beforeAll(async () => {
    vendorId = crypto.randomUUID();
    billPartial1Id = crypto.randomUUID();
    billPartial2Id = crypto.randomUUID();
    billApprovedId = crypto.randomUUID();
    billFullyPaidId = crypto.randomUUID();

    const { error: vendorErr } = await db.from('vendors').insert({
      vendor_id: vendorId,
      org_id: SEED.ORG_HOLDING,
      name: 'TEST activePaymentsReportRoute vendor',
    });
    if (vendorErr) throw new Error(`vendor seed failed: ${vendorErr.message}`);

    const { error: billsErr } = await db.from('bills').insert([
      {
        bill_id: billPartial1Id,
        org_id: SEED.ORG_HOLDING,
        vendor_id: vendorId,
        bill_number: `${prefix}AP-PART-1`,
        issue_date: '2026-05-12',
        due_date: '2026-06-12',
        amount_original: '300.0000',
        amount_cad: '300.0000',
        currency: 'CAD',
        fx_rate: '1.00000000',
        lifecycle_state: 'partially_paid',
      },
      {
        bill_id: billPartial2Id,
        org_id: SEED.ORG_HOLDING,
        vendor_id: vendorId,
        bill_number: `${prefix}AP-PART-2`,
        issue_date: '2026-05-12',
        due_date: '2026-06-12',
        amount_original: '500.0000',
        amount_cad: '500.0000',
        currency: 'CAD',
        fx_rate: '1.00000000',
        lifecycle_state: 'partially_paid',
      },
      {
        bill_id: billApprovedId,
        org_id: SEED.ORG_HOLDING,
        vendor_id: vendorId,
        bill_number: `${prefix}AP-APPR`,
        issue_date: '2026-05-12',
        due_date: '2026-06-12',
        amount_original: '200.0000',
        amount_cad: '200.0000',
        currency: 'CAD',
        fx_rate: '1.00000000',
        lifecycle_state: 'approved_for_payment',
      },
      {
        bill_id: billFullyPaidId,
        org_id: SEED.ORG_HOLDING,
        vendor_id: vendorId,
        bill_number: `${prefix}AP-FULL`,
        issue_date: '2026-05-12',
        due_date: '2026-06-12',
        amount_original: '100.0000',
        amount_cad: '100.0000',
        currency: 'CAD',
        fx_rate: '1.00000000',
        lifecycle_state: 'fully_paid',
      },
    ]);
    if (billsErr) throw new Error(`bills seed failed: ${billsErr.message}`);
    createdBillIds.push(billPartial1Id, billPartial2Id, billApprovedId, billFullyPaidId);

    // Seed a payment + allocation against billPartial1Id (amount=100) so the
    // amount_due computation surfaces 300 - 100 = 200. bill_payment_allocations
    // requires payment_id NOT NULL (migration 20240139000000) and created_by
    // referencing auth.users; SEED.USER_CONTROLLER is provisioned via
    // scripts/seed-auth-users.ts.
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
      bill_id: billPartial1Id,
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
    // payments at vendor_id grain (created in beforeAll for the allocation seed).
    await db.from('payments').delete().eq('vendor_id', vendorId);
    await db.from('vendors').delete().eq('vendor_id', vendorId);
  });

  function makeRequest(urlOrgId: string): Request {
    return new Request(
      `http://test/api/orgs/${urlOrgId}/reports/active-payments`,
      { method: 'GET' },
    );
  }

  // -----------------------------------------------------------------------
  // Test 1 (Category A): 200 success — partially_paid bills returned.
  // -----------------------------------------------------------------------
  it('Category A-1: 200 success — returns partially_paid bills with computed amount_due', async () => {
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
        due_date: string | null;
        amount_cad: string;
        amount_due: string;
      }>;
      total_amount_due: string;
    };

    // Filter to our seeded bills only (other tests in the same suite may
    // leave partially_paid bills in this org).
    const ourScoped = [billPartial1Id, billPartial2Id, billApprovedId, billFullyPaidId];
    const ourReturned = body.bills.filter((b) => ourScoped.includes(b.bill_id));

    // partially_paid bills present:
    expect(ourReturned.find((b) => b.bill_id === billPartial1Id)).toBeTruthy();
    expect(ourReturned.find((b) => b.bill_id === billPartial2Id)).toBeTruthy();
    // approved_for_payment + fully_paid bills NOT present:
    expect(ourReturned.find((b) => b.bill_id === billApprovedId)).toBeUndefined();
    expect(ourReturned.find((b) => b.bill_id === billFullyPaidId)).toBeUndefined();

    // amount_due computation: billPartial1 had 100 CAD allocated against 300 → 200.
    const part1Row = ourReturned.find((b) => b.bill_id === billPartial1Id)!;
    expect(Number(part1Row.amount_cad)).toBe(300);
    expect(Number(part1Row.amount_due)).toBe(200);
    expect(part1Row.bill_number).toBe(`${prefix}AP-PART-1`);
    expect(part1Row.vendor_id).toBe(vendorId);
    expect(part1Row.due_date).toBe('2026-06-12');

    // billPartial2 had no allocations → amount_due === amount_cad === 500.
    const part2Row = ourReturned.find((b) => b.bill_id === billPartial2Id)!;
    expect(Number(part2Row.amount_cad)).toBe(500);
    expect(Number(part2Row.amount_due)).toBe(500);
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
    const resp = await GET(req, {
      params: Promise.resolve({ orgId: SEED.ORG_HOLDING }),
    });

    expect(resp.status).toBe(401);
    const body = (await resp.json()) as Record<string, unknown>;
    expect(body.error).toBe('UNAUTHENTICATED');
  });

  // -----------------------------------------------------------------------
  // Test 3 (Category A): 403 wrong-org.
  // Read-side route has no withInvariants. To verify the 403-mapping path
  // (serviceErrorToStatus('ORG_ACCESS_DENIED') → 403), throw ORG_ACCESS_DENIED
  // from buildServiceContext (the auth-substrate layer that surfaces this
  // code in practice on wrong-org claims when wired through withInvariants
  // upstream of a read-side route).
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
  // Test 4 (Category A): Zod validation failure surface.
  // Non-UUID orgId in URL params → ActivePaymentsInputSchema.parse throws
  // raw ZodError inside the service (no try/catch wrap, parity with
  // paymentApprovalQueue + paidBillsHistory) → escapes route's
  // ServiceError-only catch → 500 with generic "Internal server error".
  //
  // §Plan-doc-grain surface emergence: at read-side routes without an
  // upstream Zod validation seam AND no ServiceError-wrap inside the
  // service for input parse failures, non-UUID URL params manifest as
  // 500 "Internal server error" rather than 400. Substantive 400 path
  // NOT REACHABLE through this read-side route shape. Mirror of
  // existing reports endpoints (paymentApprovalQueue / paidBillsHistory).
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
  // Test 5 (Category A): 500 generic service-error mapping.
  // Force the apReportService to throw a generic READ_FAILED ServiceError
  // (e.g., db lookup failure path) → serviceErrorToStatus → 500.
  // -----------------------------------------------------------------------
  it('Category A-5: 500 — READ_FAILED from service maps via serviceErrorToStatus', async () => {
    // Mock the service to throw on this single call.
    const { apReportService } = await import('@/services/spend/reports/apReportService');
    const spy = vi
      .spyOn(apReportService, 'activePayments')
      .mockImplementationOnce(async () => {
        throw new ServiceError('READ_FAILED', 'ap_report: bills lookup failed: simulated');
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
