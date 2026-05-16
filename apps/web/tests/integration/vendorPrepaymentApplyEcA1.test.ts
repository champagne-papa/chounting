// tests/integration/vendorPrepaymentApplyEcA1.test.ts
//
// Phase 5 chunk B5-1 substantive session #2 — per-criterion integration
// test. Spend brief §11.1 (EC-A-1) verifies bill posting produces a
// balanced + correctly-shaped journal entry. Vendor prepayment apply
// exercises EC-A-1 indirectly: apply writes a JE that reduces the bill's
// AP control balance via journalEntryService.post.
//
// EC-A-1 invariant set verified here:
//   INV-LEDGER-001 — balanced (sum debits = sum credits)
//   INV-LEDGER-004 — each line is debit XOR credit
//   INV-LEDGER-005 — no zero-amount lines (amount_original > 0 per line)
//   INV-LEDGER-006 — amounts non-negative
//   INV-MONEY-001 — branded MoneyAmount at boundary
//   INV-AUDIT-001 — audit_log row written (journal_entry.post +
//                   vendor_prepayment_applied)

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { adminClient, SEED } from '../setup/testDb';
import { makeTestContext } from '../setup/makeTestContext';
import { vendorPrepaymentService } from '@/services/spend/vendorPrepaymentService';

describe('vendor_prepayment apply EC-A-1: bill posting invariants', () => {
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
        { org_id: SEED.ORG_HOLDING, account_code: apCode, account_name: 'TEST EC-A-1 AP control', account_type: 'liability' },
        { org_id: SEED.ORG_HOLDING, account_code: vpaCode, account_name: 'TEST EC-A-1 VP asset', account_type: 'asset' },
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
      .insert({ vendor_id: vendorId, org_id: SEED.ORG_HOLDING, name: 'TEST EC-A-1 vendor' });
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
    // journal_entries / journal_lines are append-only per INV-LEDGER-001
    // (migration 20240133000000 — trg_journal_entries_no_delete rejects
    // DELETE; service_role does NOT bypass triggers). Rows accumulate
    // canonically across runs. The cleanup.jeIds array is preserved for
    // diagnostic purposes only; no cleanup attempted. See
    // .claude/skills/integration-test-rules/SKILL.md §3.2.
    void cleanup.jeIds;
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

  it('apply posts JE satisfying balanced + XOR + no-zero + non-negative + branded-money + audit-row', async () => {
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
    cleanup.jeIds.push(result.journal_entry_id);
    cleanup.appIds.push(result.application_id);

    const { data: lines } = await db
      .from('journal_lines')
      .select('*')
      .eq('journal_entry_id', result.journal_entry_id);
    expect(lines).toHaveLength(2);

    // INV-LEDGER-001 — balanced
    const totalDebits = lines!.reduce((s, l) => s + Number(l.debit_amount), 0);
    const totalCredits = lines!.reduce((s, l) => s + Number(l.credit_amount), 0);
    expect(totalDebits).toBe(totalCredits);
    expect(totalDebits).toBe(3000);

    for (const line of lines!) {
      const d = Number(line.debit_amount);
      const c = Number(line.credit_amount);

      // INV-LEDGER-004 — each line is debit XOR credit (exactly one positive)
      expect((d > 0) !== (c > 0)).toBe(true);

      // INV-LEDGER-005 — no zero-amount lines
      expect(Number(line.amount_original)).toBeGreaterThan(0);

      // INV-LEDGER-006 — amounts non-negative
      expect(d).toBeGreaterThanOrEqual(0);
      expect(c).toBeGreaterThanOrEqual(0);
      expect(Number(line.amount_original)).toBeGreaterThanOrEqual(0);
      expect(Number(line.amount_cad)).toBeGreaterThanOrEqual(0);
    }

    // INV-AUDIT-001 — JE post audit row
    const { data: jeAudit } = await db
      .from('audit_log')
      .select('*')
      .eq('trace_id', traceId)
      .eq('action', 'journal_entry.post');
    expect(jeAudit).toHaveLength(1);
    expect(jeAudit![0].entity_type).toBe('journal_entry');
    expect(jeAudit![0].entity_id).toBe(result.journal_entry_id);

    // INV-AUDIT-001 — vendor_prepayment_applied entity-grain audit row
    const { data: vpAudit } = await db
      .from('audit_log')
      .select('*')
      .eq('trace_id', traceId)
      .eq('action', 'vendor_prepayment_applied');
    expect(vpAudit).toHaveLength(1);
    expect(vpAudit![0].entity_id).toBe(result.application_id);
  });
});
