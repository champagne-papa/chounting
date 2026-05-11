// tests/integration/paidBillsHistory.test.ts
//
// Phase 5 chunk B5-3-D1 substantive session #2 — per-view + per-criterion
// integration test for apReportService.paidBillsHistory (EC-A-7 paid bills
// history).
//
// Co-located shape per checkpoint #1 ratification: this file contains both the
// per-view happy-path test AND the per-criterion AC-EC-A-7-1 lifecycle_state
// filter correctness test.
//
// Per-view (Spend brief §11.4): paidBillsHistory() returns the list of bills
// with lifecycle_state === 'fully_paid' + total_amount_paid (= sum of
// bills.amount_cad for the filtered set; fully_paid means amount_due = 0
// by construction, so no per-bill subquery against
// bill_payment_allocations is required).
//
// Per-criterion AC-EC-A-7-1 (founder ratification (b)): 1 test with multi-
// assertion covering 6 boundary cases. Create bills in all 7 canonical
// lifecycle_state values; verify ONLY 'fully_paid' bills surface, and all 6
// other states (draft / pending_approval / approved_for_payment /
// partially_paid / voided / cancelled) are excluded.
//
// §3.1 + §3.2 test pollution disciplines per .claude/skills/integration-test-rules:
//   - This test does NOT post JEs (read-only service surface), so the JE/JL
//     accumulation discipline doesn't directly fire.
//   - This test does NOT create chart_of_accounts rows, so §3.1 T-prefix
//     per-run COA isolation doesn't fire either.
//   - vendors + bills + bill_payment_allocations are all non-append-only,
//     so afterAll DELETE is safe (mirrors openBills.test.ts session #1
//     disposition).

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { adminClient, SEED } from '../setup/testDb';
import { makeTestContext } from '../setup/makeTestContext';
import { apReportService } from '@/services/spend/reports/apReportService';

describe('apReportService.paidBillsHistory (EC-A-7 paid bills history)', () => {
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
      name: 'TEST paidBillsHistory vendor',
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

  it('paidBillsHistory() returns only fully_paid bills + correct total_amount_paid (happy path)', async () => {
    // Seed bills across a mix of lifecycle states; only 'fully_paid' should
    // appear in the result.
    const billFullyPaid1 = await seedBill({
      amount_cad: '400.0000',
      lifecycle_state: 'fully_paid',
      bill_number: 'PBH-HAPPY-1',
    });
    const billFullyPaid2 = await seedBill({
      amount_cad: '600.0000',
      lifecycle_state: 'fully_paid',
      bill_number: 'PBH-HAPPY-2',
    });
    const billApproved = await seedBill({
      amount_cad: '500.0000',
      lifecycle_state: 'approved_for_payment',
      bill_number: 'PBH-HAPPY-3',
    });
    const billPartiallyPaid = await seedBill({
      amount_cad: '800.0000',
      lifecycle_state: 'partially_paid',
      bill_number: 'PBH-HAPPY-4',
    });

    const result = await apReportService.paidBillsHistory(
      { org_id: SEED.ORG_HOLDING },
      ctx,
    );

    const ourScoped = [billFullyPaid1, billFullyPaid2, billApproved, billPartiallyPaid];
    const ourReturned = result.bills.filter((b) => ourScoped.includes(b.bill_id));

    // Only fully_paid bills should be present:
    expect(ourReturned.find((b) => b.bill_id === billFullyPaid1)).toBeTruthy();
    expect(ourReturned.find((b) => b.bill_id === billFullyPaid2)).toBeTruthy();
    expect(ourReturned.find((b) => b.bill_id === billApproved)).toBeUndefined();
    expect(ourReturned.find((b) => b.bill_id === billPartiallyPaid)).toBeUndefined();

    // Shape: each row carries the expected fields.
    const paidRow1 = ourReturned.find((b) => b.bill_id === billFullyPaid1)!;
    expect(paidRow1.vendor_id).toBe(vendorId);
    expect(paidRow1.bill_number).toBe('PBH-HAPPY-1');
    expect(paidRow1.due_date).toBe('2026-06-10');
    expect(Number(paidRow1.amount_cad)).toBe(400);

    const paidRow2 = ourReturned.find((b) => b.bill_id === billFullyPaid2)!;
    expect(Number(paidRow2.amount_cad)).toBe(600);

    // total_amount_paid is sum of all fully_paid bills in the org's result.
    // Floor comparison includes the 2 seeded fully_paid bills' amount_cad:
    expect(Number(result.total_amount_paid)).toBeGreaterThanOrEqual(400 + 600);
  });

  it('paid bills history filter excludes non-fully-paid lifecycle states (AC-EC-A-7-1)', async () => {
    // Per-test fresh vendor so bills in this test don't comingle with the
    // happy-path test (afterAll cleanup handles teardown for both).
    const filterVendorId = crypto.randomUUID();
    await db.from('vendors').insert({
      vendor_id: filterVendorId,
      org_id: SEED.ORG_HOLDING,
      name: 'TEST AC-EC-A-7-1 filter vendor',
    });

    // Create bills in all 7 canonical lifecycle states.
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
        bill_number: `PBH-${state}`,
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
      const result = await apReportService.paidBillsHistory(
        { org_id: SEED.ORG_HOLDING },
        ctx,
      );

      // Filter to bills in our scoped state set.
      const stateBillIdSet = new Set(stateBillIds.values());
      const ourReturned = result.bills.filter((b) => stateBillIdSet.has(b.bill_id));

      // Only fully_paid should be returned (the 1 included state); the other
      // 6 states must all be excluded.
      expect(ourReturned).toHaveLength(1);
      expect(ourReturned[0].bill_id).toBe(stateBillIds.get('fully_paid'));

      // Per-state sub-assertions: assert each forbidden state is absent.
      for (const state of [
        'draft',
        'pending_approval',
        'approved_for_payment',
        'partially_paid',
        'voided',
        'cancelled',
      ] as const) {
        const billId = stateBillIds.get(state)!;
        expect(ourReturned.find((b) => b.bill_id === billId)).toBeUndefined();
      }

      // Per-state sub-assertion: assert the allowed state IS present.
      const fullyPaidId = stateBillIds.get('fully_paid')!;
      expect(ourReturned.find((b) => b.bill_id === fullyPaidId)).toBeTruthy();
    } finally {
      // Clean up boundary scope.
      const ids = [...stateBillIds.values()];
      await db.from('bill_payment_allocations').delete().in('bill_id', ids);
      await db.from('bills').delete().in('bill_id', ids);
      await db.from('vendors').delete().eq('vendor_id', filterVendorId);
    }
  });
});
