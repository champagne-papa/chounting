// tests/integration/vendorPrepaymentApply.test.ts
//
// Phase 5 chunk B5-1 substantive session #2 — per-mutation integration test
// for vendorPrepaymentService.apply (apply_vendor_prepayment_to_bill).
//
// Exercises: happy path (posts JE Dr AP control / Cr Vendor prepayment asset
// + inserts vendor_prepayment_applications row + flips status to
// partially_applied + emits vendor_prepayment_applied audit); rejects when
// apply amount exceeds remaining balance (defensive guard from
// computeVendorPrepaymentStatus); rejects when bill is in fully_paid state.

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { adminClient, SEED } from '../setup/testDb';
import { makeTestContext } from '../setup/makeTestContext';
import { vendorPrepaymentService } from '@/services/spend/vendorPrepaymentService';

describe('vendorPrepaymentService.apply', () => {
  const db = adminClient();
  const traceId = crypto.randomUUID();
  const ctx = makeTestContext({ trace_id: traceId, org_ids: [SEED.ORG_HOLDING] });

  let vendorId: string;
  let paymentVpId: string;
  let vendorPrepaymentId: string;
  let billId: string;
  let billPaidId: string;
  let apControlAccountId: string;
  let vpAssetAccountId: string;
  let fiscalPeriodId: string;
  const createdAppIds: string[] = [];
  const createdJeIds: string[] = [];

  beforeAll(async () => {
    vendorId = crypto.randomUUID();
    paymentVpId = crypto.randomUUID();
    vendorPrepaymentId = crypto.randomUUID();
    billId = crypto.randomUUID();
    billPaidId = crypto.randomUUID();

    // Create dedicated test chart_of_accounts entries to avoid balance pollution
    // on seed accounts that other test files (e.g., reportTrialBalance) assert
    // specific zero-balance on. Codes are derived from traceId so each run is
    // unique (no UNIQUE(org_id, account_code) collision across runs).
    const apCode = `T${traceId.slice(0, 8)}_AP`;
    const vpaCode = `T${traceId.slice(0, 8)}_VPA`;
    const { data: created, error: coaErr } = await db
      .from('chart_of_accounts')
      .insert([
        { org_id: SEED.ORG_HOLDING, account_code: apCode, account_name: 'TEST AP control proxy', account_type: 'liability' },
        { org_id: SEED.ORG_HOLDING, account_code: vpaCode, account_name: 'TEST vendor prepayment asset proxy', account_type: 'asset' },
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
    if (!period) throw new Error('no open fiscal period for ORG_HOLDING');
    fiscalPeriodId = period.period_id;

    await db.from('vendors').insert({
      vendor_id: vendorId,
      org_id: SEED.ORG_HOLDING,
      name: 'TEST VP apply vendor',
    });
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
    await db.from('bills').insert([
      {
        bill_id: billId,
        org_id: SEED.ORG_HOLDING,
        vendor_id: vendorId,
        issue_date: '2026-05-10',
        amount_original: '3000.0000',
        amount_cad: '3000.0000',
        currency: 'CAD',
        lifecycle_state: 'approved_for_payment',
      },
      {
        bill_id: billPaidId,
        org_id: SEED.ORG_HOLDING,
        vendor_id: vendorId,
        issue_date: '2026-05-10',
        amount_original: '3000.0000',
        amount_cad: '3000.0000',
        currency: 'CAD',
        lifecycle_state: 'fully_paid',
      },
    ]);
  });

  afterAll(async () => {
    // journal_entries / journal_lines are append-only per INV-LEDGER-001
    // (migration 20240133000000 — trg_journal_entries_no_delete rejects
    // DELETE; service_role does NOT bypass triggers). Rows accumulate
    // canonically across runs. The createdJeIds array is preserved for
    // diagnostic purposes only; no cleanup attempted. See
    // .claude/skills/integration-test-rules/SKILL.md §3.2.
    void createdJeIds;
    if (createdAppIds.length > 0) {
      await db.from('vendor_prepayment_applications').delete().in('id', createdAppIds);
    }
    await db.from('vendor_prepayments').delete().eq('id', vendorPrepaymentId);
    await db.from('bills').delete().in('bill_id', [billId, billPaidId]);
    await db.from('payments').delete().eq('payment_id', paymentVpId);
    await db.from('vendors').delete().eq('vendor_id', vendorId);
    if (apControlAccountId && vpAssetAccountId) {
      await db
        .from('chart_of_accounts')
        .delete()
        .in('account_id', [apControlAccountId, vpAssetAccountId]);
    }
  });

  it('happy path: applies prepayment, posts balanced JE, inserts application, flips status', async () => {
    const result = await vendorPrepaymentService.apply(
      {
        org_id: SEED.ORG_HOLDING,
        vendor_prepayment_id: vendorPrepaymentId,
        bill_id: billId,
        amount_original: '3000.0000',
        amount_cad: '3000.0000',
        applied_at: '2026-05-10',
        fiscal_period_id: fiscalPeriodId,
        entry_date: '2026-05-10',
        ap_control_account_id: apControlAccountId,
        vendor_prepayment_account_id: vpAssetAccountId,
      },
      ctx,
    );

    expect(result.application_id).toMatch(/^[0-9a-f-]{36}$/i);
    expect(result.journal_entry_id).toMatch(/^[0-9a-f-]{36}$/i);
    expect(result.new_status).toBe('partially_applied');
    createdAppIds.push(result.application_id);
    createdJeIds.push(result.journal_entry_id);

    const { data: app } = await db
      .from('vendor_prepayment_applications')
      .select('*')
      .eq('id', result.application_id)
      .single();
    expect(app).toBeTruthy();
    expect(Number(app!.amount_original)).toBe(3000);
    expect(app!.bill_id).toBe(billId);
    expect(app!.vendor_prepayment_id).toBe(vendorPrepaymentId);
    expect(app!.created_by).toBe(ctx.caller.user_id);
    expect(app!.trace_id).toBe(traceId);

    const { data: vp } = await db
      .from('vendor_prepayments')
      .select('status')
      .eq('id', vendorPrepaymentId)
      .single();
    expect(vp!.status).toBe('partially_applied');

    const { data: audit } = await db
      .from('audit_log')
      .select('*')
      .eq('trace_id', traceId)
      .eq('action', 'vendor_prepayment_applied');
    expect(audit).toHaveLength(1);
    expect(audit![0].entity_type).toBe('vendor_prepayment_application');
    expect(audit![0].entity_id).toBe(result.application_id);

    const { data: jeLines } = await db
      .from('journal_lines')
      .select('*')
      .eq('journal_entry_id', result.journal_entry_id);
    expect(jeLines).toHaveLength(2);
    const debitLine = jeLines!.find((l) => Number(l.debit_amount) > 0);
    const creditLine = jeLines!.find((l) => Number(l.credit_amount) > 0);
    expect(debitLine).toBeTruthy();
    expect(creditLine).toBeTruthy();
    expect(debitLine!.account_id).toBe(apControlAccountId);
    expect(creditLine!.account_id).toBe(vpAssetAccountId);
    expect(Number(debitLine!.debit_amount)).toBe(3000);
    expect(Number(creditLine!.credit_amount)).toBe(3000);
  });

  it('rejects when apply amount exceeds remaining balance', async () => {
    // After test 1, remaining = 10000 - 3000 = 7000. Trying 8000 → over-application.
    await expect(
      vendorPrepaymentService.apply(
        {
          org_id: SEED.ORG_HOLDING,
          vendor_prepayment_id: vendorPrepaymentId,
          bill_id: billId,
          amount_original: '8000.0000',
          amount_cad: '8000.0000',
          applied_at: '2026-05-10',
          fiscal_period_id: fiscalPeriodId,
          entry_date: '2026-05-10',
          ap_control_account_id: apControlAccountId,
          vendor_prepayment_account_id: vpAssetAccountId,
        },
        ctx,
      ),
    ).rejects.toThrow(/exceeds amount_original/);
  });

  it('rejects when bill lifecycle_state is fully_paid', async () => {
    await expect(
      vendorPrepaymentService.apply(
        {
          org_id: SEED.ORG_HOLDING,
          vendor_prepayment_id: vendorPrepaymentId,
          bill_id: billPaidId,
          amount_original: '500.0000',
          amount_cad: '500.0000',
          applied_at: '2026-05-10',
          fiscal_period_id: fiscalPeriodId,
          entry_date: '2026-05-10',
          ap_control_account_id: apControlAccountId,
          vendor_prepayment_account_id: vpAssetAccountId,
        },
        ctx,
      ),
    ).rejects.toThrow(/lifecycle_state=fully_paid/);
  });
});
