// tests/integration/vendorPrepaymentApplyEcA2.test.ts
//
// Phase 5 chunk B5-1 substantive session #2 — per-criterion integration
// test. Spend brief §11.2 (EC-A-2) verifies bill reversal exercises the
// full reversal path per ADR-0001. Vendor prepayment apply exercises
// EC-A-2 indirectly: reversing the JE produced by apply runs through
// journalEntryService.post's reversal branch.
//
// EC-A-2 invariant set verified here:
//   INV-REVERSAL-001 — reversal lines mirror original (debit↔credit swap)
//   INV-REVERSAL-002 — reversal_reason required (non-empty)
//   All EC-A-1 invariants apply to the reversal entry itself (verified
//     implicitly: post() succeeds → DB CHECK / Zod refines passed).

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { adminClient, SEED } from '../setup/testDb';
import { makeTestContext } from '../setup/makeTestContext';
import { vendorPrepaymentService } from '@/services/spend/vendorPrepaymentService';
import { journalEntryService } from '@/services/accounting/journalEntryService';

// supabase-js returns numeric(20,4) and numeric(20,8) columns as JS numbers.
// Reversal lines passed to journalEntryService.post must be MoneyAmount /
// FxRate strings (4-decimal / 8-decimal). Re-format DB-numeric values back
// to the canonical string shape before posting the reversal.
const toAmount = (v: unknown): string => Number(v).toFixed(4);
const toRate = (v: unknown): string => Number(v).toFixed(8);

describe('vendor_prepayment apply EC-A-2: bill reversal invariants', () => {
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
        { org_id: SEED.ORG_HOLDING, account_code: apCode, account_name: 'TEST EC-A-2 AP control', account_type: 'liability' },
        { org_id: SEED.ORG_HOLDING, account_code: vpaCode, account_name: 'TEST EC-A-2 VP asset', account_type: 'asset' },
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
      .insert({ vendor_id: vendorId, org_id: SEED.ORG_HOLDING, name: 'TEST EC-A-2 vendor' });
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
      amount_original: '3000.0000',
      amount_cad: '3000.0000',
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

  it('reversing apply JE satisfies INV-REVERSAL-001 (mirror) + INV-REVERSAL-002 (reason)', async () => {
    // Step 1: apply produces JE A.
    const apply = await vendorPrepaymentService.apply(
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
    cleanup.jeIds.push(apply.journal_entry_id);
    cleanup.appIds.push(apply.application_id);

    // Step 2: read JE A's lines and mirror them (debit↔credit swap).
    const { data: origLines } = await db
      .from('journal_lines')
      .select('*')
      .eq('journal_entry_id', apply.journal_entry_id)
      .order('account_id', { ascending: true });
    expect(origLines).toHaveLength(2);

    const mirroredLines = origLines!.map((line) => ({
      account_id: line.account_id,
      description: line.description ?? undefined,
      debit_amount: toAmount(line.credit_amount),
      credit_amount: toAmount(line.debit_amount),
      currency: line.currency,
      amount_original: toAmount(line.amount_original),
      amount_cad: toAmount(line.amount_cad),
      fx_rate: toRate(line.fx_rate),
      tax_code_id: line.tax_code_id ?? null,
    }));

    // Step 3: post reversal JE B with valid reversal_reason.
    const reversal = await journalEntryService.post(
      {
        org_id: SEED.ORG_HOLDING,
        fiscal_period_id: fiscalPeriodId,
        entry_date: '2026-05-11',
        description: `Reverse vendor prepayment application ${apply.application_id}`,
        source: 'manual',
        lines: mirroredLines,
        reverses_journal_entry_id: apply.journal_entry_id,
        reversal_reason: 'EC-A-2 verification: reversal flow exercised',
      },
      ctx,
    );
    cleanup.jeIds.push(reversal.journal_entry_id);

    expect(reversal.journal_entry_id).toMatch(/^[0-9a-f-]{36}$/i);

    // Verify reversal lines exist + are mirrored.
    const { data: revLines } = await db
      .from('journal_lines')
      .select('*')
      .eq('journal_entry_id', reversal.journal_entry_id)
      .order('account_id', { ascending: true });
    expect(revLines).toHaveLength(2);
    for (let i = 0; i < origLines!.length; i++) {
      expect(revLines![i].account_id).toBe(origLines![i].account_id);
      // INV-REVERSAL-001: mirror — debit ↔ credit swapped
      expect(Number(revLines![i].debit_amount)).toBe(Number(origLines![i].credit_amount));
      expect(Number(revLines![i].credit_amount)).toBe(Number(origLines![i].debit_amount));
      // amount_original / amount_cad / fx_rate unchanged
      expect(revLines![i].amount_original).toBe(origLines![i].amount_original);
      expect(revLines![i].amount_cad).toBe(origLines![i].amount_cad);
    }
  });

  it('rejects reversal with empty reversal_reason (INV-REVERSAL-002)', async () => {
    const apply = await vendorPrepaymentService.apply(
      {
        org_id: SEED.ORG_HOLDING,
        vendor_prepayment_id: vendorPrepaymentId,
        bill_id: billId,
        amount_original: '500.0000',
        amount_cad: '500.0000',
        applied_at: '2026-05-10',
        fiscal_period_id: fiscalPeriodId,
        entry_date: '2026-05-10',
        ap_control_account_id: apControlAccountId,
        vendor_prepayment_account_id: vpAssetAccountId,
      },
      ctx,
    );
    cleanup.jeIds.push(apply.journal_entry_id);
    cleanup.appIds.push(apply.application_id);

    const { data: origLines } = await db
      .from('journal_lines')
      .select('*')
      .eq('journal_entry_id', apply.journal_entry_id);
    const mirroredLines = origLines!.map((line) => ({
      account_id: line.account_id,
      debit_amount: toAmount(line.credit_amount),
      credit_amount: toAmount(line.debit_amount),
      currency: line.currency,
      amount_original: toAmount(line.amount_original),
      amount_cad: toAmount(line.amount_cad),
      fx_rate: toRate(line.fx_rate),
      tax_code_id: line.tax_code_id ?? null,
    }));

    await expect(
      journalEntryService.post(
        {
          org_id: SEED.ORG_HOLDING,
          fiscal_period_id: fiscalPeriodId,
          entry_date: '2026-05-11',
          description: 'Empty reason reversal',
          source: 'manual',
          lines: mirroredLines,
          reverses_journal_entry_id: apply.journal_entry_id,
          reversal_reason: '', // INV-REVERSAL-002 violation
        },
        ctx,
      ),
    ).rejects.toThrow();
  });
});
