// tests/integration/paymentApprovalQueue.test.ts
//
// Phase 5 chunk B5-3-D1 substantive session #2 — per-view integration test for
// apReportService.paymentApprovalQueue (EC-A-6 payment approval queue).
//
// Per-view (Spend brief §11.4): paymentApprovalQueue() returns the list of
// bills with lifecycle_state === 'approved_for_payment' + per-bill
// amount_due (computed via subquery against bill_payment_allocations; catch
// #20: bills.amount_due is NOT a column) + total_amount_due.
//
// No per-criterion test for EC-A-6 per D1.2 ratification (only 4 of 5 views
// got per-criterion tests; EC-A-6 is the no-per-criterion view).
//
// §3.1 + §3.2 test pollution disciplines per .claude/skills/integration-test-rules:
//   - This test does NOT post JEs (read-only service surface), so the JE/JL
//     accumulation discipline doesn't directly fire.
//   - This test does NOT create chart_of_accounts rows, so §3.1 T-prefix
//     per-run COA isolation doesn't fire either.
//   - vendors + bills + bill_payment_allocations + payments are all
//     non-append-only, so afterAll DELETE is safe (mirrors openBills.test.ts
//     session #1 disposition).

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { adminClient, SEED } from '../setup/testDb';
import { makeTestContext } from '../setup/makeTestContext';
import { apReportService } from '@/services/spend/reports/apReportService';

describe('apReportService.paymentApprovalQueue (EC-A-6 payment approval queue)', () => {
  const db = adminClient();
  const traceId = crypto.randomUUID();
  const ctx = makeTestContext({ trace_id: traceId, org_ids: [SEED.ORG_HOLDING] });

  let vendorId: string;
  const createdBillIds: string[] = [];

  beforeAll(async () => {
    vendorId = crypto.randomUUID();
    await db.from('vendors').insert({
      vendor_id: vendorId,
      org_id: SEED.ORG_HOLDING,
      name: 'TEST paymentApprovalQueue vendor',
    });
  });

  afterAll(async () => {
    // Read-only service surface; no JE/JL writes by this test. Cleanups for
    // direct seed inserts (bills + bill_payment_allocations + vendors) are safe.
    if (createdBillIds.length > 0) {
      await db.from('bill_payment_allocations').delete().in('bill_id', createdBillIds);
      await db.from('bills').delete().in('bill_id', createdBillIds);
    }
    await db.from('vendors').delete().eq('vendor_id', vendorId);
  });

  async function seedBill(opts: {
    amount_cad: string;
    lifecycle_state:
      | 'draft'
      | 'pending_approval'
      | 'approved_for_payment'
      | 'partially_paid'
      | 'fully_paid'
      | 'voided'
      | 'cancelled';
    bill_number?: string;
  }): Promise<string> {
    const billId = crypto.randomUUID();
    const { error } = await db.from('bills').insert({
      bill_id: billId,
      org_id: SEED.ORG_HOLDING,
      vendor_id: vendorId,
      bill_number: opts.bill_number ?? null,
      issue_date: '2026-05-10',
      due_date: '2026-06-10',
      amount_original: opts.amount_cad,
      amount_cad: opts.amount_cad,
      currency: 'CAD',
      fx_rate: '1.00000000',
      lifecycle_state: opts.lifecycle_state,
    });
    if (error) throw new Error(`bill seed failed: ${error.message}`);
    createdBillIds.push(billId);
    return billId;
  }

  it('paymentApprovalQueue() returns only approved_for_payment bills + correct total_amount_due (happy path)', async () => {
    // Seed bills across a mix of lifecycle states; only 'approved_for_payment'
    // should appear in the queue. partially_paid is open but NOT approved-for-
    // payment by EC-A-6 semantics (it has progress past approval); the helper
    // returns both but the queue method post-filters to approved only.
    const billApproved1 = await seedBill({
      amount_cad: '500.0000',
      lifecycle_state: 'approved_for_payment',
      bill_number: 'PAQ-HAPPY-1',
    });
    const billApproved2 = await seedBill({
      amount_cad: '750.0000',
      lifecycle_state: 'approved_for_payment',
      bill_number: 'PAQ-HAPPY-2',
    });
    const billPartiallyPaid = await seedBill({
      amount_cad: '800.0000',
      lifecycle_state: 'partially_paid',
      bill_number: 'PAQ-HAPPY-3',
    });
    const billDraft = await seedBill({
      amount_cad: '200.0000',
      lifecycle_state: 'draft',
      bill_number: 'PAQ-HAPPY-4',
    });
    const billFullyPaid = await seedBill({
      amount_cad: '300.0000',
      lifecycle_state: 'fully_paid',
      bill_number: 'PAQ-HAPPY-5',
    });

    const result = await apReportService.paymentApprovalQueue(
      { org_id: SEED.ORG_HOLDING },
      ctx,
    );

    // Filter result to our scoped bills only (other tests in the same suite
    // may leave open bills in this org; we assert positive presence/absence
    // for our bills, and use floor comparisons for total_amount_due).
    const ourScoped = [billApproved1, billApproved2, billPartiallyPaid, billDraft, billFullyPaid];
    const ourReturned = result.bills.filter((b) => ourScoped.includes(b.bill_id));

    // Only approved_for_payment bills should be present:
    expect(ourReturned.find((b) => b.bill_id === billApproved1)).toBeTruthy();
    expect(ourReturned.find((b) => b.bill_id === billApproved2)).toBeTruthy();
    expect(ourReturned.find((b) => b.bill_id === billPartiallyPaid)).toBeUndefined();
    expect(ourReturned.find((b) => b.bill_id === billDraft)).toBeUndefined();
    expect(ourReturned.find((b) => b.bill_id === billFullyPaid)).toBeUndefined();

    // Shape: each row carries the expected fields.
    const approvedRow1 = ourReturned.find((b) => b.bill_id === billApproved1)!;
    expect(approvedRow1.vendor_id).toBe(vendorId);
    expect(approvedRow1.bill_number).toBe('PAQ-HAPPY-1');
    expect(approvedRow1.due_date).toBe('2026-06-10');
    expect(Number(approvedRow1.amount_cad)).toBe(500);
    expect(Number(approvedRow1.amount_due)).toBe(500);

    const approvedRow2 = ourReturned.find((b) => b.bill_id === billApproved2)!;
    expect(Number(approvedRow2.amount_cad)).toBe(750);
    expect(Number(approvedRow2.amount_due)).toBe(750);

    // total_amount_due is sum of all queue bills in the org's result. Floor
    // comparison includes the 2 seeded approved bills' amount_due:
    expect(Number(result.total_amount_due)).toBeGreaterThanOrEqual(500 + 750);

    // All returned bills must have lifecycle_state semantics of approved_for_payment;
    // we verified our bills above; for robustness assert the queue's bills carry
    // amount_due > 0 (approved bills haven't been paid yet).
    for (const row of ourReturned) {
      expect(Number(row.amount_due)).toBeGreaterThan(0);
    }
  });
});
