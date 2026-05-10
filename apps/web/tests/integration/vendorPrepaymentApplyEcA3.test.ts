// tests/integration/vendorPrepaymentApplyEcA3.test.ts
//
// Phase 5 chunk B5-1 substantive session #2 — per-criterion integration
// test. Spend brief §11.3 (EC-A-3+) verifies bill state transitions
// follow the domain enum's allowed paths and respect bill-payment
// allocation invariants. Vendor prepayment apply exercises analogous
// state-transition discipline on vendor_prepayments.status (open →
// partially_applied → fully_applied) and applications-sum invariants
// on vendor_prepayment_applications.
//
// EC-A-3 invariant set verified here (with the AP-prefixed reservations
// adapted to the spend domain — see Spend brief §11.3 reservation
// language; ADR-0010 reserved-state discipline):
//   INV-AP-001-equiv (reserved) — applications sums never exceed
//     vendor_prepayment.amount_original (Layer-2 service-layer enforcement
//     via computeVendorPrepaymentStatus throw)
//   INV-AP-002-equiv (reserved) — vendor_prepayment.status transitions
//     follow the allowed path: open → partially_applied → fully_applied
//     (no skipping, no regression, no terminal-state exit)

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { adminClient, SEED } from '../setup/testDb';
import { makeTestContext } from '../setup/makeTestContext';
import { vendorPrepaymentService } from '@/services/spend/vendorPrepaymentService';

describe('vendor_prepayment apply EC-A-3: state transitions + sum invariants', () => {
  const db = adminClient();
  const traceId = crypto.randomUUID();
  const ctx = makeTestContext({ trace_id: traceId, org_ids: [SEED.ORG_HOLDING] });

  let vendorId: string;
  let paymentVpId: string;
  let vendorPrepaymentId: string;
  let billId: string;
  let apControlAccountId: string;
  let vpAssetAccountId: string;
  let fiscalPeriodId: string;
  const cleanup: { jeIds: string[]; appIds: string[] } = { jeIds: [], appIds: [] };

  beforeAll(async () => {
    vendorId = crypto.randomUUID();
    paymentVpId = crypto.randomUUID();
    vendorPrepaymentId = crypto.randomUUID();
    billId = crypto.randomUUID();

    // Dedicated test chart_of_accounts entries (avoid balance pollution on
    // seed accounts asserted by other test files).
    const apCode = `T${traceId.slice(0, 8)}_AP`;
    const vpaCode = `T${traceId.slice(0, 8)}_VPA`;
    const { data: created, error: coaErr } = await db
      .from('chart_of_accounts')
      .insert([
        { org_id: SEED.ORG_HOLDING, account_code: apCode, account_name: 'TEST EC-A-3 AP control', account_type: 'liability' },
        { org_id: SEED.ORG_HOLDING, account_code: vpaCode, account_name: 'TEST EC-A-3 VP asset', account_type: 'asset' },
      ])
      .select('account_id, account_code');
    if (coaErr || !created || created.length !== 2) {
      throw new Error(`COA seed failed: ${coaErr?.message ?? 'no data'}`);
    }
    apControlAccountId = created.find((c) => c.account_code === apCode)!.account_id;
    vpAssetAccountId = created.find((c) => c.account_code === vpaCode)!.account_id;

    const { data: period } = await db
      .from('fiscal_periods')
      .select('period_id')
      .eq('org_id', SEED.ORG_HOLDING)
      .eq('is_locked', false)
      .order('start_date', { ascending: true })
      .limit(1)
      .single();
    fiscalPeriodId = period!.period_id;

    await db
      .from('vendors')
      .insert({ vendor_id: vendorId, org_id: SEED.ORG_HOLDING, name: 'TEST EC-A-3 vendor' });
    await db.from('payments').insert({
      payment_id: paymentVpId,
      org_id: SEED.ORG_HOLDING,
      payment_date: '2026-05-10',
      amount: '10000.0000',
      currency: 'CAD',
      payment_purpose: 'vendor_prepayment',
      payment_state: 'paid',
    });
    await db.from('vendor_prepayments').insert({
      id: vendorPrepaymentId,
      org_id: SEED.ORG_HOLDING,
      vendor_id: vendorId,
      payment_id: paymentVpId,
      prepayment_type: 'retainer',
      status: 'open',
      amount_original: '10000.0000',
      amount_cad: '10000.0000',
      currency: 'CAD',
      recognized_at: '2026-05-10',
      tax_timing_choice: 'at_payment',
      created_by: ctx.caller.user_id,
      trace_id: traceId,
    });
    await db.from('bills').insert({
      bill_id: billId,
      org_id: SEED.ORG_HOLDING,
      vendor_id: vendorId,
      issue_date: '2026-05-10',
      amount_original: '15000.0000',
      amount_cad: '15000.0000',
      currency: 'CAD',
      lifecycle_state: 'approved_for_payment',
    });
  });

  afterAll(async () => {
    if (cleanup.jeIds.length) {
      await db.from('journal_lines').delete().in('journal_entry_id', cleanup.jeIds);
      await db.from('journal_entries').delete().in('journal_entry_id', cleanup.jeIds);
    }
    if (cleanup.appIds.length) {
      await db.from('vendor_prepayment_applications').delete().in('id', cleanup.appIds);
    }
    await db.from('vendor_prepayments').delete().eq('id', vendorPrepaymentId);
    await db.from('bills').delete().eq('bill_id', billId);
    await db.from('payments').delete().eq('payment_id', paymentVpId);
    await db.from('vendors').delete().eq('vendor_id', vendorId);
    if (apControlAccountId && vpAssetAccountId) {
      await db
        .from('chart_of_accounts')
        .delete()
        .in('account_id', [apControlAccountId, vpAssetAccountId]);
    }
  });

  it('open → partially_applied → fully_applied (state machine + sum invariants)', async () => {
    // Initial state: open.
    const { data: vp0 } = await db
      .from('vendor_prepayments')
      .select('status')
      .eq('id', vendorPrepaymentId)
      .single();
    expect(vp0!.status).toBe('open');

    // Apply 4000 of 10000 → partially_applied.
    const apply1 = await vendorPrepaymentService.apply(
      {
        org_id: SEED.ORG_HOLDING,
        vendor_prepayment_id: vendorPrepaymentId,
        bill_id: billId,
        amount_original: '4000.0000',
        amount_cad: '4000.0000',
        applied_at: '2026-05-10',
        fiscal_period_id: fiscalPeriodId,
        entry_date: '2026-05-10',
        ap_control_account_id: apControlAccountId,
        vendor_prepayment_account_id: vpAssetAccountId,
      },
      ctx,
    );
    cleanup.jeIds.push(apply1.journal_entry_id);
    cleanup.appIds.push(apply1.application_id);
    expect(apply1.new_status).toBe('partially_applied');

    const { data: vp1 } = await db
      .from('vendor_prepayments')
      .select('status')
      .eq('id', vendorPrepaymentId)
      .single();
    expect(vp1!.status).toBe('partially_applied');

    // Apply remaining 6000 → fully_applied.
    const apply2 = await vendorPrepaymentService.apply(
      {
        org_id: SEED.ORG_HOLDING,
        vendor_prepayment_id: vendorPrepaymentId,
        bill_id: billId,
        amount_original: '6000.0000',
        amount_cad: '6000.0000',
        applied_at: '2026-05-10',
        fiscal_period_id: fiscalPeriodId,
        entry_date: '2026-05-10',
        ap_control_account_id: apControlAccountId,
        vendor_prepayment_account_id: vpAssetAccountId,
      },
      ctx,
    );
    cleanup.jeIds.push(apply2.journal_entry_id);
    cleanup.appIds.push(apply2.application_id);
    expect(apply2.new_status).toBe('fully_applied');

    const { data: vp2 } = await db
      .from('vendor_prepayments')
      .select('status')
      .eq('id', vendorPrepaymentId)
      .single();
    expect(vp2!.status).toBe('fully_applied');

    // INV-AP-001-equiv: applications sum equals amount_original (10000 = 4000 + 6000).
    const { data: apps } = await db
      .from('vendor_prepayment_applications')
      .select('amount_original')
      .eq('vendor_prepayment_id', vendorPrepaymentId);
    const sum = apps!.reduce((s, a) => s + Number(a.amount_original), 0);
    expect(sum).toBe(10000);
  });

  it('rejects further apply on fully_applied vendor_prepayment (terminal-state exit)', async () => {
    // After previous test, vp is fully_applied. apply rejects status not in
    // {open, partially_applied}.
    await expect(
      vendorPrepaymentService.apply(
        {
          org_id: SEED.ORG_HOLDING,
          vendor_prepayment_id: vendorPrepaymentId,
          bill_id: billId,
          amount_original: '1.0000',
          amount_cad: '1.0000',
          applied_at: '2026-05-10',
          fiscal_period_id: fiscalPeriodId,
          entry_date: '2026-05-10',
          ap_control_account_id: apControlAccountId,
          vendor_prepayment_account_id: vpAssetAccountId,
        },
        ctx,
      ),
    ).rejects.toThrow(/status=fully_applied/);
  });
});
