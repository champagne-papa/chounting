// tests/integration/billRecordPayment.test.ts
//
// Phase 5 chunk B5-2 substantive session #1 — per-mutation integration test
// for billService.recordPayment (record_bill_payment).
//
// Exercises: happy path full-payment (approved_for_payment → fully_paid;
// creates payment + bill_payment_allocations row; posts JE Dr ap_control /
// Cr cash; emits bill_payment_recorded audit at bill grain); happy path
// partial-payment (approved_for_payment → partially_paid; allocation <
// bill amount); subsequent partial → fully_paid (cumulative allocation =
// bill amount); INV-AP-001 over-allocation rejection (POST_FAILED +
// BILL_OVER_ALLOCATION message); INV-AP-002 wrong-state rejection (state
// not in {approved_for_payment, partially_paid}); Sub-L bill.currency != CAD
// rejection (POST_FAILED + BILL_MULTI_CURRENCY_NOT_SUPPORTED message).
//
// Item 20 dedicated test-accounts pattern (per
// .claude/skills/integration-test-rules/SKILL.md §3) applies: this test
// posts JEs via journalEntryService.post (through billService.recordPayment).
// Per-run unique account_codes derived from traceId for AP control + cash.

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { adminClient, SEED } from '../setup/testDb';
import { makeTestContext } from '../setup/makeTestContext';
import { billService } from '@/services/spend/billService';

describe('billService.recordPayment', () => {
  const db = adminClient();
  const traceId = crypto.randomUUID();
  const ctx = makeTestContext({ trace_id: traceId, org_ids: [SEED.ORG_HOLDING] });

  let vendorId: string;
  let billFullId: string;       // approved_for_payment, full-payment scenario
  let billPartialId: string;    // approved_for_payment → partially_paid → fully_paid
  let billOverAllocId: string;  // approved_for_payment, over-allocation rejection
  let billDraftId: string;      // draft (wrong state) rejection
  let billUsdId: string;        // currency=USD multi-currency rejection
  let apControlAccountId: string;
  let cashAccountId: string;
  let fiscalPeriodId: string;
  const createdJeIds: string[] = [];
  const createdPaymentIds: string[] = [];
  const createdAllocBillIds: string[] = [];

  beforeAll(async () => {
    vendorId = crypto.randomUUID();
    billFullId = crypto.randomUUID();
    billPartialId = crypto.randomUUID();
    billOverAllocId = crypto.randomUUID();
    billDraftId = crypto.randomUUID();
    billUsdId = crypto.randomUUID();

    // Item 20 dedicated test-accounts pattern.
    const apCode = `T${traceId.slice(0, 8)}_AP`;
    const cashCode = `T${traceId.slice(0, 8)}_CASH`;
    const { data: created, error: coaErr } = await db
      .from('chart_of_accounts')
      .insert([
        {
          org_id: SEED.ORG_HOLDING,
          account_code: apCode,
          account_name: 'TEST recordPayment AP control proxy',
          account_type: 'liability',
        },
        {
          org_id: SEED.ORG_HOLDING,
          account_code: cashCode,
          account_name: 'TEST recordPayment cash proxy',
          account_type: 'asset',
        },
      ])
      .select('account_id, account_code');
    if (coaErr || !created || created.length !== 2) {
      throw new Error(`COA seed failed: ${coaErr?.message ?? 'no data'}`);
    }
    apControlAccountId = created.find((c) => c.account_code === apCode)!.account_id;
    cashAccountId = created.find((c) => c.account_code === cashCode)!.account_id;

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
      name: 'TEST recordPayment vendor',
    });

    // Bills seeded in target lifecycle states. posted_journal_entry_id is
    // not required for record_bill_payment; mutation does not consume it.
    const { error: billsErr } = await db.from('bills').insert([
      {
        bill_id: billFullId,
        org_id: SEED.ORG_HOLDING,
        vendor_id: vendorId,
        issue_date: '2026-05-10',
        amount_original: '1000.0000',
        amount_cad: '1000.0000',
        currency: 'CAD',
        fx_rate: '1.00000000',
        lifecycle_state: 'approved_for_payment',
      },
      {
        bill_id: billPartialId,
        org_id: SEED.ORG_HOLDING,
        vendor_id: vendorId,
        issue_date: '2026-05-10',
        amount_original: '2000.0000',
        amount_cad: '2000.0000',
        currency: 'CAD',
        fx_rate: '1.00000000',
        lifecycle_state: 'approved_for_payment',
      },
      {
        bill_id: billOverAllocId,
        org_id: SEED.ORG_HOLDING,
        vendor_id: vendorId,
        issue_date: '2026-05-10',
        amount_original: '500.0000',
        amount_cad: '500.0000',
        currency: 'CAD',
        fx_rate: '1.00000000',
        lifecycle_state: 'approved_for_payment',
      },
      {
        bill_id: billDraftId,
        org_id: SEED.ORG_HOLDING,
        vendor_id: vendorId,
        issue_date: '2026-05-10',
        amount_original: '300.0000',
        amount_cad: '300.0000',
        currency: 'CAD',
        fx_rate: '1.00000000',
        lifecycle_state: 'draft',
      },
      {
        bill_id: billUsdId,
        org_id: SEED.ORG_HOLDING,
        vendor_id: vendorId,
        issue_date: '2026-05-10',
        amount_original: '400.0000',
        amount_cad: '550.0000',
        currency: 'USD',
        fx_rate: '1.37500000',
        lifecycle_state: 'approved_for_payment',
      },
    ]);
    if (billsErr) throw new Error(`bills seed failed: ${billsErr.message}`);
  });

  afterAll(async () => {
    // INV-LEDGER-001 Layer 1a (S26 / UF-001): journal_entries and journal_lines
    // are append-only (trg_journal_entries_no_delete from migration
    // 20240133000000_journal_immutability_triggers.sql). The service_role does
    // NOT bypass triggers; DELETE attempts silently fail. Per the RUN_SUFFIX
    // precedent at journalSourceExternalId.test.ts:32-40, JE/JL rows accumulate
    // across test runs; per-run unique T${traceId.slice(0,8)}_* account codes
    // (Item 20 dedicated test-accounts pattern) prevent unique-key collisions
    // on subsequent runs. chart_of_accounts cleanup is also blocked by the
    // orphan journal_lines.account_id FK; T-prefixed accounts accumulate.
    // Tests using trial-balance or account-count assertions must filter
    // T-prefixed account_codes (see reportTrialBalance.test.ts). Item 20
    // SKILL revision codification pending at arc-closure retrospective.
    //
    // The following cleanups DO work and are kept:
    //   - bill_payment_allocations DELETE at bill_id grain (no FK CASCADE)
    //   - bills DELETE at vendor_id grain (cascades to bill_lines)
    //   - payments DELETE at vendor_id grain
    //   - vendors DELETE
    // createdJeIds, createdPaymentIds, createdAllocBillIds preserved for
    // diagnostic purposes only.
    void createdJeIds;
    void createdPaymentIds;
    void createdAllocBillIds;

    // bill_payment_allocations DELETE at bill_id grain. bill_payment_allocations
    // has no CASCADE on bill_id or payment_id per chunk B5-2 migration; must
    // DELETE before bills/payments can be deleted.
    const { data: ownedBills } = await db
      .from('bills')
      .select('bill_id')
      .eq('org_id', SEED.ORG_HOLDING)
      .eq('vendor_id', vendorId);
    if (ownedBills && ownedBills.length > 0) {
      await db
        .from('bill_payment_allocations')
        .delete()
        .in('bill_id', ownedBills.map((b) => b.bill_id as string));
    }

    // bills DELETE at vendor_id grain — cascades to bill_lines via ON DELETE CASCADE.
    await db.from('bills').delete().eq('org_id', SEED.ORG_HOLDING).eq('vendor_id', vendorId);

    // payments DELETE at vendor_id grain.
    await db.from('payments').delete().eq('vendor_id', vendorId);

    // vendor DELETE.
    await db.from('vendors').delete().eq('vendor_id', vendorId);

    // chart_of_accounts cleanup INTENTIONALLY SKIPPED per substrate finding above.
    // T-prefixed accounts accumulate; trial-balance filter handles visibility.
  });

  function buildPaymentInput(billId: string, amount: string) {
    return {
      org_id: SEED.ORG_HOLDING,
      bill_id: billId,
      payment_method: 'eft' as const,
      payment_date: '2026-05-11',
      amount_cad: amount,
      reference_number: 'REF-TEST',
      fiscal_period_id: fiscalPeriodId,
      entry_date: '2026-05-11',
      ap_control_account_id: apControlAccountId,
      cash_account_id: cashAccountId,
    };
  }

  it('happy path full payment: approved_for_payment → fully_paid; creates payment + allocation; posts JE Dr AP / Cr cash', async () => {
    const result = await billService.recordPayment(
      buildPaymentInput(billFullId, '1000.0000'),
      ctx,
    );

    expect(result.bill_id).toBe(billFullId);
    expect(result.payment_id).toMatch(/^[0-9a-f-]{36}$/i);
    expect(result.journal_entry_id).toMatch(/^[0-9a-f-]{36}$/i);
    expect(result.new_lifecycle_state).toBe('fully_paid');
    createdJeIds.push(result.journal_entry_id);
    createdPaymentIds.push(result.payment_id);
    createdAllocBillIds.push(billFullId);

    // Bill state.
    const { data: bill } = await db
      .from('bills')
      .select('lifecycle_state')
      .eq('bill_id', billFullId)
      .single();
    expect(bill!.lifecycle_state).toBe('fully_paid');

    // Payment row.
    const { data: payment } = await db
      .from('payments')
      .select('*')
      .eq('payment_id', result.payment_id)
      .single();
    expect(payment).toBeTruthy();
    expect(Number(payment!.amount)).toBe(1000);
    expect(payment!.currency).toBe('CAD');
    expect(payment!.payment_method).toBe('eft');
    expect(payment!.payment_purpose).toBe('bill_payment');
    expect(payment!.payment_state).toBe('paid');
    expect(payment!.vendor_id).toBe(vendorId);
    expect(payment!.applied_to).toBe('bill');
    expect(payment!.reference_number).toBe('REF-TEST');

    // Allocation row.
    const { data: alloc } = await db
      .from('bill_payment_allocations')
      .select('*')
      .eq('bill_id', billFullId);
    expect(alloc).toHaveLength(1);
    expect(alloc![0].payment_id).toBe(result.payment_id);
    expect(Number(alloc![0].amount_cad)).toBe(1000);
    expect(alloc![0].trace_id).toBe(traceId);
    expect(alloc![0].created_by).toBe(ctx.caller.user_id);

    // JE balanced (Dr ap_control / Cr cash).
    const { data: jeLines } = await db
      .from('journal_lines')
      .select('*')
      .eq('journal_entry_id', result.journal_entry_id);
    expect(jeLines).toHaveLength(2);
    const drLine = jeLines!.find((l) => Number(l.debit_amount) > 0);
    const crLine = jeLines!.find((l) => Number(l.credit_amount) > 0);
    expect(drLine!.account_id).toBe(apControlAccountId);
    expect(crLine!.account_id).toBe(cashAccountId);
    expect(Number(drLine!.debit_amount)).toBe(1000);
    expect(Number(crLine!.credit_amount)).toBe(1000);

    // Bill-grain audit.
    const { data: audit } = await db
      .from('audit_log')
      .select('*')
      .eq('trace_id', traceId)
      .eq('action', 'bill_payment_recorded')
      .eq('entity_id', billFullId);
    expect(audit).toHaveLength(1);
    expect(audit![0].entity_type).toBe('bill');
    expect((audit![0].before_state as Record<string, unknown>).lifecycle_state).toBe(
      'approved_for_payment',
    );
  });

  it('happy path partial payment: approved_for_payment → partially_paid; subsequent partial → fully_paid', async () => {
    // First partial (800 of 2000): approved_for_payment → partially_paid.
    const r1 = await billService.recordPayment(
      buildPaymentInput(billPartialId, '800.0000'),
      ctx,
    );
    createdJeIds.push(r1.journal_entry_id);
    createdPaymentIds.push(r1.payment_id);
    if (!createdAllocBillIds.includes(billPartialId)) createdAllocBillIds.push(billPartialId);

    expect(r1.new_lifecycle_state).toBe('partially_paid');
    const { data: billAfter1 } = await db
      .from('bills')
      .select('lifecycle_state')
      .eq('bill_id', billPartialId)
      .single();
    expect(billAfter1!.lifecycle_state).toBe('partially_paid');

    // Second partial (1200 to total 2000): partially_paid → fully_paid.
    const r2 = await billService.recordPayment(
      buildPaymentInput(billPartialId, '1200.0000'),
      ctx,
    );
    createdJeIds.push(r2.journal_entry_id);
    createdPaymentIds.push(r2.payment_id);

    expect(r2.new_lifecycle_state).toBe('fully_paid');
    const { data: billAfter2 } = await db
      .from('bills')
      .select('lifecycle_state')
      .eq('bill_id', billPartialId)
      .single();
    expect(billAfter2!.lifecycle_state).toBe('fully_paid');

    // Two allocation rows summing to 2000.
    const { data: allocs } = await db
      .from('bill_payment_allocations')
      .select('amount_cad')
      .eq('bill_id', billPartialId);
    expect(allocs).toHaveLength(2);
    const sum = allocs!.reduce((s, a) => s + Number(a.amount_cad), 0);
    expect(sum).toBe(2000);
  });

  it('rejects over-allocation (INV-AP-001) with BILL_OVER_ALLOCATION message prefix', async () => {
    // Bill amount 500; attempt 600 → over-allocation.
    await expect(
      billService.recordPayment(buildPaymentInput(billOverAllocId, '600.0000'), ctx),
    ).rejects.toThrow(/BILL_OVER_ALLOCATION/);
  });

  it('rejects wrong-state (draft, INV-AP-002) with BILL_INVALID_STATE_TRANSITION message prefix', async () => {
    await expect(
      billService.recordPayment(buildPaymentInput(billDraftId, '300.0000'), ctx),
    ).rejects.toThrow(/BILL_INVALID_STATE_TRANSITION/);
  });

  it('rejects bill.currency != CAD (Sub-L) with BILL_MULTI_CURRENCY_NOT_SUPPORTED message prefix', async () => {
    await expect(
      billService.recordPayment(buildPaymentInput(billUsdId, '550.0000'), ctx),
    ).rejects.toThrow(/BILL_MULTI_CURRENCY_NOT_SUPPORTED/);
  });
});
