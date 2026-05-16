// tests/integration/openBills.test.ts
//
// Phase 5 chunk B5-3-D1 substantive session #1 — per-view + per-criterion
// integration test for apReportService.openBills (EC-A-4 open bills).
//
// Co-located shape per checkpoint #1 ratification: this file contains both the
// per-view happy-path test AND the per-criterion AC-EC-A-4-1 lifecycle_state
// filter correctness test.
//
// Per-view (Spend brief §11.4): openBills() returns list of bills with
// amount_due > 0, filtered to lifecycle_state IN {approved_for_payment,
// partially_paid}. amount_due computed via subquery against
// bill_payment_allocations (bills.amount_due is NOT a column per catch #20).
//
// Per-criterion AC-EC-A-4-1: lifecycle_state filter excludes non-committed,
// fully_paid, and terminal states. Create bills in all 7 canonical states;
// verify openBills returns only approved_for_payment + partially_paid.
//
// §3.1 + §3.2 test pollution disciplines per .claude/skills/integration-test-rules:
//   - This test does NOT post JEs (read-only service surface), so the JE/JL
//     accumulation discipline doesn't directly fire.
//   - This test does NOT create chart_of_accounts rows, so §3.1 T-prefix
//     per-run COA isolation doesn't fire either.
//   - vendors + bills are deletable in afterAll.

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { adminClient, SEED } from '../setup/testDb';
import { makeTestContext } from '../setup/makeTestContext';
import { apReportService } from '@/services/spend/reports/apReportService';

describe('apReportService.openBills (EC-A-4 open bills)', () => {
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
      name: 'TEST openBills vendor',
    });
  });

  afterAll(async () => {
    // Read-only service surface; no JE/JL writes by this test. Cleanups for
    // direct seed inserts (bills + vendors) are safe.
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

  it('openBills() returns list of bills with amount_due > 0 (happy path)', async () => {
    // Seed bills across a few lifecycle states; happy-path verifies shape
    // and total computation.
    const billApproved = await seedBill({
      amount_cad: '500.0000',
      lifecycle_state: 'approved_for_payment',
      bill_number: 'OB-HAPPY-1',
    });
    const billPartiallyPaid = await seedBill({
      amount_cad: '800.0000',
      lifecycle_state: 'partially_paid',
      bill_number: 'OB-HAPPY-2',
    });
    const billFullyPaid = await seedBill({
      amount_cad: '300.0000',
      lifecycle_state: 'fully_paid',
      bill_number: 'OB-HAPPY-3',
    });
    const billDraft = await seedBill({
      amount_cad: '200.0000',
      lifecycle_state: 'draft',
      bill_number: 'OB-HAPPY-4',
    });

    const result = await apReportService.openBills(
      { org_id: SEED.ORG_HOLDING },
      ctx,
    );

    // Our scoped bills: confirm approved + partially_paid are present; draft
    // and fully_paid are NOT.
    const ourBills = result.bills.filter((b) =>
      [billApproved, billPartiallyPaid, billFullyPaid, billDraft].includes(b.bill_id),
    );

    expect(ourBills.find((b) => b.bill_id === billApproved)).toBeTruthy();
    expect(ourBills.find((b) => b.bill_id === billPartiallyPaid)).toBeTruthy();
    expect(ourBills.find((b) => b.bill_id === billFullyPaid)).toBeUndefined();
    expect(ourBills.find((b) => b.bill_id === billDraft)).toBeUndefined();

    // Shape: each row carries the expected fields.
    const approvedRow = ourBills.find((b) => b.bill_id === billApproved)!;
    expect(approvedRow.vendor_id).toBe(vendorId);
    expect(approvedRow.bill_number).toBe('OB-HAPPY-1');
    expect(approvedRow.due_date).toBe('2026-06-10');
    expect(Number(approvedRow.amount_due)).toBe(500);
    expect(approvedRow.lifecycle_state).toBe('approved_for_payment');

    const partialRow = ourBills.find((b) => b.bill_id === billPartiallyPaid)!;
    expect(Number(partialRow.amount_due)).toBe(800);
    expect(partialRow.lifecycle_state).toBe('partially_paid');

    // total_amount_due is sum of all bills in the result; check it includes
    // our 2 open bills' amounts at minimum.
    expect(Number(result.total_amount_due)).toBeGreaterThanOrEqual(500 + 800);
  });

  it('openBills filter excludes non-committed, fully_paid, and terminal states (AC-EC-A-4-1)', async () => {
    // Per-test fresh vendor so bills in this test don't comingle with the
    // happy-path test.
    const filterVendorId = crypto.randomUUID();
    await db.from('vendors').insert({
      vendor_id: filterVendorId,
      org_id: SEED.ORG_HOLDING,
      name: 'TEST AC-EC-A-4-1 filter vendor',
    });

    // Create bills in all 7 canonical states.
    const stateBillIds = new Map<string, string>();
    const states = [
      'draft',
      'pending_approval',
      'approved_for_payment',
      'partially_paid',
      'fully_paid',
      'voided',
      'cancelled',
    ] as const;
    for (const state of states) {
      const billId = crypto.randomUUID();
      const { error } = await db.from('bills').insert({
        bill_id: billId,
        org_id: SEED.ORG_HOLDING,
        vendor_id: filterVendorId,
        bill_number: `OB-${state}`,
        issue_date: '2026-05-10',
        due_date: '2026-06-10',
        amount_original: '100.0000',
        amount_cad: '100.0000',
        currency: 'CAD',
        fx_rate: '1.00000000',
        lifecycle_state: state,
      });
      if (error) throw new Error(`bill seed (${state}) failed: ${error.message}`);
      stateBillIds.set(state, billId);
    }

    try {
      const result = await apReportService.openBills(
        { org_id: SEED.ORG_HOLDING },
        ctx,
      );

      // Filter to bills in our scoped state set.
      const stateBillIdSet = new Set(stateBillIds.values());
      const ourReturned = result.bills.filter((b) => stateBillIdSet.has(b.bill_id));

      // Only the 2 open states should be returned: approved_for_payment +
      // partially_paid. The other 5 states must be excluded.
      const returnedStates = ourReturned.map((b) => b.lifecycle_state).sort();
      expect(returnedStates).toEqual(['approved_for_payment', 'partially_paid']);

      // Per-state sub-assertions: assert each forbidden state is absent.
      for (const state of [
        'draft',
        'pending_approval',
        'fully_paid',
        'voided',
        'cancelled',
      ] as const) {
        const billId = stateBillIds.get(state)!;
        expect(ourReturned.find((b) => b.bill_id === billId)).toBeUndefined();
      }

      // Per-state sub-assertions: assert each allowed state IS present.
      for (const state of ['approved_for_payment', 'partially_paid'] as const) {
        const billId = stateBillIds.get(state)!;
        expect(ourReturned.find((b) => b.bill_id === billId)).toBeTruthy();
      }
    } finally {
      // Clean up boundary scope.
      const ids = [...stateBillIds.values()];
      await db.from('bill_payment_allocations').delete().in('bill_id', ids);
      await db.from('bills').delete().in('bill_id', ids);
      await db.from('vendors').delete().eq('vendor_id', filterVendorId);
    }
  });
});
