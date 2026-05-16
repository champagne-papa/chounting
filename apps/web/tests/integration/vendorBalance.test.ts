// tests/integration/vendorBalance.test.ts
//
// Phase 5 chunk B5-3-D1 substantive session #1 — per-view + per-criterion
// integration test for vendorReportService.balance (EC-A-5 vendor balance
// composition).
//
// Co-located shape per checkpoint #1 ratification: this file contains both the
// per-view happy-path test AND the per-criterion AC-EC-A-5-1 4-component
// composition correctness test.
//
// Per-view (ADR-0015 §5): balance() returns 4-component partial_balances +
// net_balance + as_of for a single vendor, computed at read time.
//
// Per-criterion AC-EC-A-5-1 (founder ratification (c)): 4-component
// composition correctness. Known-state vendor with:
//   - 1 bill at approved_for_payment, $1000, no payments → open_AP = $1000
//   - 1 vendor_prepayment at 'open', $500 → open_vendor_deposits_and_retainers = -$500
//   - unapplied_vendor_credits = 0 (vendor credits deferred per Spend brief §8.3)
//   - accrued_unbilled = 0 by construction (per catch #20 + ADR-0015 §5)
//   - net_balance = $1000 - $500 = $500
//
// §3.1 + §3.2 test pollution disciplines per .claude/skills/integration-test-rules:
//   - This test does NOT post JEs (read-only service surface; no JE writes
//     by vendorReportService.balance directly). The vendor_prepayment row
//     seeded for AC-EC-A-5-1 has 'open' status which means no JE was posted
//     for it (the JE posts at apply-time, not at prepayment-creation time).
//   - This test does NOT create chart_of_accounts rows, so §3.1 T-prefix
//     per-run COA isolation doesn't fire.
//   - vendors + bills + vendor_prepayments + payments are deletable in
//     afterAll. vendor_prepayment_applications + bill_payment_allocations
//     also deletable.

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { adminClient, SEED } from '../setup/testDb';
import { makeTestContext } from '../setup/makeTestContext';
import { vendorReportService } from '@/services/spend/reports/vendorReportService';

describe('vendorReportService.balance (EC-A-5 vendor balance composition)', () => {
  const db = adminClient();
  const traceId = crypto.randomUUID();
  const ctx = makeTestContext({ trace_id: traceId, org_ids: [SEED.ORG_HOLDING] });

  let happyVendorId: string;
  let happyBillId: string;
  let happyPaymentId: string;
  let happyVpId: string;

  let acVendorId: string;
  let acBillId: string;
  let acPaymentId: string;
  let acVpId: string;

  beforeAll(async () => {
    // -----------------------------------------------------------------
    // Happy path scope (per-view test).
    // -----------------------------------------------------------------
    happyVendorId = crypto.randomUUID();
    happyBillId = crypto.randomUUID();
    happyPaymentId = crypto.randomUUID();
    happyVpId = crypto.randomUUID();

    await db.from('vendors').insert({
      vendor_id: happyVendorId,
      org_id: SEED.ORG_HOLDING,
      name: 'TEST vendorBalance happy vendor',
    });

    await db.from('bills').insert({
      bill_id: happyBillId,
      org_id: SEED.ORG_HOLDING,
      vendor_id: happyVendorId,
      issue_date: '2026-05-10',
      due_date: '2026-06-10',
      amount_original: '2000.0000',
      amount_cad: '2000.0000',
      currency: 'CAD',
      fx_rate: '1.00000000',
      lifecycle_state: 'approved_for_payment',
    });

    // Seed a payment + vendor_prepayment (status 'open').
    await db.from('payments').insert({
      payment_id: happyPaymentId,
      org_id: SEED.ORG_HOLDING,
      payment_date: '2026-05-10',
      amount: '750.0000',
      currency: 'CAD',
      payment_purpose: 'vendor_prepayment',
      payment_state: 'paid',
    });
    await db.from('vendor_prepayments').insert({
      id: happyVpId,
      org_id: SEED.ORG_HOLDING,
      vendor_id: happyVendorId,
      payment_id: happyPaymentId,
      prepayment_type: 'retainer',
      status: 'open',
      amount_original: '750.0000',
      amount_cad: '750.0000',
      currency: 'CAD',
      recognized_at: '2026-05-10',
      tax_timing_choice: 'at_payment',
      created_by: ctx.caller.user_id,
      trace_id: traceId,
    });

    // -----------------------------------------------------------------
    // AC-EC-A-5-1 known-state scope (4-component composition test).
    // -----------------------------------------------------------------
    acVendorId = crypto.randomUUID();
    acBillId = crypto.randomUUID();
    acPaymentId = crypto.randomUUID();
    acVpId = crypto.randomUUID();

    await db.from('vendors').insert({
      vendor_id: acVendorId,
      org_id: SEED.ORG_HOLDING,
      name: 'TEST AC-EC-A-5-1 known-state vendor',
    });

    // Bill: 1 bill at approved_for_payment, $1000, no payments → open_AP = $1000
    await db.from('bills').insert({
      bill_id: acBillId,
      org_id: SEED.ORG_HOLDING,
      vendor_id: acVendorId,
      issue_date: '2026-05-10',
      due_date: '2026-06-10',
      amount_original: '1000.0000',
      amount_cad: '1000.0000',
      currency: 'CAD',
      fx_rate: '1.00000000',
      lifecycle_state: 'approved_for_payment',
    });

    // Vendor prepayment: 1 vendor_prepayment at 'open', $500 →
    // open_vendor_deposits_and_retainers = -$500.
    await db.from('payments').insert({
      payment_id: acPaymentId,
      org_id: SEED.ORG_HOLDING,
      payment_date: '2026-05-10',
      amount: '500.0000',
      currency: 'CAD',
      payment_purpose: 'vendor_prepayment',
      payment_state: 'paid',
    });
    await db.from('vendor_prepayments').insert({
      id: acVpId,
      org_id: SEED.ORG_HOLDING,
      vendor_id: acVendorId,
      payment_id: acPaymentId,
      prepayment_type: 'retainer',
      status: 'open',
      amount_original: '500.0000',
      amount_cad: '500.0000',
      currency: 'CAD',
      recognized_at: '2026-05-10',
      tax_timing_choice: 'at_payment',
      created_by: ctx.caller.user_id,
      trace_id: traceId,
    });
  });

  afterAll(async () => {
    // Read-only service surface; no JE/JL writes by this test directly.
    // The seed inserts (no apply mutation) don't post journal entries.
    // vendor_prepayment_applications + bill_payment_allocations also
    // deletable here for hygiene.
    await db
      .from('vendor_prepayment_applications')
      .delete()
      .in('vendor_prepayment_id', [happyVpId, acVpId]);
    await db
      .from('bill_payment_allocations')
      .delete()
      .in('bill_id', [happyBillId, acBillId]);
    await db.from('vendor_prepayments').delete().in('id', [happyVpId, acVpId]);
    await db.from('bills').delete().in('bill_id', [happyBillId, acBillId]);
    await db.from('payments').delete().in('payment_id', [happyPaymentId, acPaymentId]);
    await db.from('vendors').delete().in('vendor_id', [happyVendorId, acVendorId]);
  });

  it('balance() returns 4-component partial_balances + net_balance + as_of (happy path)', async () => {
    const result = await vendorReportService.balance(
      { org_id: SEED.ORG_HOLDING, vendor_id: happyVendorId },
      ctx,
    );

    // Shape assertions per ADR-0015 §5.
    expect(result.vendor_id).toBe(happyVendorId);
    expect(result.partial_balances).toBeTruthy();
    expect(result.partial_balances).toHaveProperty('open_AP');
    expect(result.partial_balances).toHaveProperty('unapplied_vendor_credits');
    expect(result.partial_balances).toHaveProperty('open_vendor_deposits_and_retainers');
    expect(result.partial_balances).toHaveProperty('accrued_unbilled');
    expect(result).toHaveProperty('net_balance');
    expect(result).toHaveProperty('as_of');

    // as_of is an ISO timestamp.
    expect(result.as_of).toMatch(/^\d{4}-\d{2}-\d{2}T/);

    // Values for the happy vendor: open_AP = $2000 (the one bill); deposits =
    // -$750 (the one prepayment); credits = 0; accrued = 0; net = $2000 -
    // $750 = $1250.
    expect(Number(result.partial_balances.open_AP)).toBe(2000);
    expect(Number(result.partial_balances.unapplied_vendor_credits)).toBe(0);
    expect(Number(result.partial_balances.open_vendor_deposits_and_retainers)).toBe(-750);
    expect(Number(result.partial_balances.accrued_unbilled)).toBe(0);
    expect(Number(result.net_balance)).toBe(1250);
  });

  it('balance() composition: open_AP positive + open_vendor_deposits negative + 2 components zero (AC-EC-A-5-1)', async () => {
    const result = await vendorReportService.balance(
      { org_id: SEED.ORG_HOLDING, vendor_id: acVendorId },
      ctx,
    );

    // 4-component sub-assertions per AC-EC-A-5-1.
    // - open_AP = $1000 (1 bill at approved_for_payment $1000, no payments)
    expect(Number(result.partial_balances.open_AP)).toBe(1000);

    // - unapplied_vendor_credits = 0 (vendor credits deferred per Spend brief §8.3)
    expect(Number(result.partial_balances.unapplied_vendor_credits)).toBe(0);

    // - open_vendor_deposits_and_retainers = -$500 (1 vendor_prepayment at
    //   'open' $500; negative contribution per ADR-0015 §5)
    expect(Number(result.partial_balances.open_vendor_deposits_and_retainers)).toBe(-500);

    // - accrued_unbilled = 0 by construction in v1 (per catch #20 + ADR-0015 §5)
    expect(Number(result.partial_balances.accrued_unbilled)).toBe(0);

    // - net_balance = $1000 - $500 = $500.
    expect(Number(result.net_balance)).toBe(500);
  });
});
