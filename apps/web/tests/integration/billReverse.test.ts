// tests/integration/billReverse.test.ts
//
// Phase 5 chunk B5-2 substantive session #1 — per-mutation integration test
// for billService.reverse (reverse_bill).
//
// Exercises: happy path (pending_approval bill → voided; calls
// journalEntryService.post() with reverses_journal_entry_id (Sub-N (b)
// canonical back-reference); produces reversal JE with mirrored lines (Dr ↔ Cr
// swapped per INV-REVERSAL-001 / EC-A-2); emits bill_reversed audit at bill
// grain carrying reversal_reason; emits journal_entry.reverse audit at JE grain
// from journalEntryService.post via the RPC); INV-AP-002 wrong-state rejection
// (cannot reverse 'draft' / 'voided' / 'cancelled' bills with POST_FAILED +
// BILL_INVALID_STATE_TRANSITION message); empty reversal_reason Zod boundary
// rejection (READ_FAILED — Zod min(1) on the input); Sub-N (b) rejects when
// bill.posted_journal_entry_id is null (POST_FAILED + BILL_NO_POSTED_JE
// message).
//
// Item 20 dedicated test-accounts pattern (per
// .claude/skills/integration-test-rules/SKILL.md §3) applies: this test posts
// JEs via journalEntryService.post (through billService.post and through
// billService.reverse which posts the reversal). Per-run unique account_codes
// derived from traceId for AP control + expense.

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { adminClient, SEED } from '../setup/testDb';
import { makeTestContext } from '../setup/makeTestContext';
import { billService } from '@/services/spend/billService';

describe('billService.reverse', () => {
  const db = adminClient();
  const traceId = crypto.randomUUID();
  const ctx = makeTestContext({ trace_id: traceId, org_ids: [SEED.ORG_HOLDING] });

  let vendorId: string;
  let apControlAccountId: string;
  let expenseAccountId: string;
  let fiscalPeriodId: string;
  // For wrong-state + no-posted-JE rejections we use directly-seeded bills
  // (no JE) — but reverse() requires lifecycle_state to be in the
  // 4-state allowed set OR throw BILL_NO_POSTED_JE if posted_journal_entry_id
  // is null. We therefore seed:
  //   - billDraftId       (lifecycle_state='draft')   → BILL_INVALID_STATE_TRANSITION
  //   - billVoidedId      (lifecycle_state='voided')  → BILL_INVALID_STATE_TRANSITION
  //   - billNoPostedJeId  (lifecycle_state='pending_approval'; no posted_journal_entry_id) → BILL_NO_POSTED_JE
  let billDraftId: string;
  let billVoidedId: string;
  let billNoPostedJeId: string;
  // For happy path we post a real bill via billService.post (which populates
  // posted_journal_entry_id). createdBillIds tracked for cleanup.
  const createdBillIds: string[] = [];
  const createdJeIds: string[] = [];

  beforeAll(async () => {
    vendorId = crypto.randomUUID();
    billDraftId = crypto.randomUUID();
    billVoidedId = crypto.randomUUID();
    billNoPostedJeId = crypto.randomUUID();

    // Item 20 dedicated test-accounts pattern.
    const apCode = `T${traceId.slice(0, 8)}_AP`;
    const expCode = `T${traceId.slice(0, 8)}_EXP`;
    const { data: created, error: coaErr } = await db
      .from('chart_of_accounts')
      .insert([
        {
          org_id: SEED.ORG_HOLDING,
          account_code: apCode,
          account_name: 'TEST reverse_bill AP control proxy',
          account_type: 'liability',
        },
        {
          org_id: SEED.ORG_HOLDING,
          account_code: expCode,
          account_name: 'TEST reverse_bill expense proxy',
          account_type: 'expense',
        },
      ])
      .select('account_id, account_code');
    if (coaErr || !created || created.length !== 2) {
      throw new Error(`COA seed failed: ${coaErr?.message ?? 'no data'}`);
    }
    apControlAccountId = created.find((c) => c.account_code === apCode)!.account_id;
    expenseAccountId = created.find((c) => c.account_code === expCode)!.account_id;

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
      name: 'TEST reverse_bill vendor',
    });

    await db.from('bills').insert([
      {
        bill_id: billDraftId,
        org_id: SEED.ORG_HOLDING,
        vendor_id: vendorId,
        issue_date: '2026-05-10',
        amount_original: '100.0000',
        amount_cad: '100.0000',
        currency: 'CAD',
        fx_rate: '1.00000000',
        lifecycle_state: 'draft',
      },
      {
        bill_id: billVoidedId,
        org_id: SEED.ORG_HOLDING,
        vendor_id: vendorId,
        issue_date: '2026-05-10',
        amount_original: '100.0000',
        amount_cad: '100.0000',
        currency: 'CAD',
        fx_rate: '1.00000000',
        lifecycle_state: 'voided',
      },
      {
        bill_id: billNoPostedJeId,
        org_id: SEED.ORG_HOLDING,
        vendor_id: vendorId,
        issue_date: '2026-05-10',
        amount_original: '100.0000',
        amount_cad: '100.0000',
        currency: 'CAD',
        fx_rate: '1.00000000',
        lifecycle_state: 'pending_approval', // valid state but no posted_journal_entry_id
      },
    ]);
    createdBillIds.push(billDraftId, billVoidedId, billNoPostedJeId);
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
    //   - bills DELETE at vendor_id grain (cascades to bill_lines)
    //   - vendors DELETE
    // createdJeIds and createdBillIds preserved for diagnostic purposes only.
    void createdJeIds;
    void createdBillIds;

    // bills DELETE at vendor_id grain — cascades to bill_lines via ON DELETE CASCADE.
    await db.from('bills').delete().eq('org_id', SEED.ORG_HOLDING).eq('vendor_id', vendorId);

    // vendor DELETE.
    await db.from('vendors').delete().eq('vendor_id', vendorId);

    // chart_of_accounts cleanup INTENTIONALLY SKIPPED per substrate finding above.
    // T-prefixed accounts accumulate; trial-balance filter handles visibility.
  });

  function buildPostInput() {
    return {
      org_id: SEED.ORG_HOLDING,
      vendor_id: vendorId,
      bill_number: 'TEST-REV-001',
      issue_date: '2026-05-10',
      due_date: '2026-06-10',
      payment_terms_days: 30,
      purchase_order_id: null,
      currency: 'CAD' as const,
      amount_original: '750.0000',
      amount_cad: '750.0000',
      fx_rate: '1.00000000',
      tax_amount_total: '0.0000',
      bill_lines: [
        {
          account_id: expenseAccountId,
          description: 'Test reverse expense line',
          amount: '750.0000',
          amount_original: '750.0000',
          amount_cad: '750.0000',
          tax_code_id: null,
          line_number: 1,
        },
      ],
      fiscal_period_id: fiscalPeriodId,
      entry_date: '2026-05-10',
      ap_control_account_id: apControlAccountId,
      // INV-DOC-001 bypass per Sub-Q4-d (Phase 5.1 chunk 5.1a Task 7b).
      override_evidence_completeness: true,
    };
  }

  it('happy path: posts JE, reverses to voided, mirrors EC-A-2 invariants, emits bill_reversed + journal_entry.reverse audits', async () => {
    // Step 1: post a real bill so it has a posted_journal_entry_id.
    const posted = await billService.post(buildPostInput(), ctx);
    createdBillIds.push(posted.bill_id);
    createdJeIds.push(posted.journal_entry_id);

    // Capture the original JE lines to verify mirror semantics afterwards.
    const { data: origLines } = await db
      .from('journal_lines')
      .select('*')
      .eq('journal_entry_id', posted.journal_entry_id)
      .order('account_id', { ascending: true });
    expect(origLines).toHaveLength(2);

    // Step 2: reverse it.
    const reversal = await billService.reverse(
      {
        org_id: SEED.ORG_HOLDING,
        bill_id: posted.bill_id,
        reversal_reason: 'EC-A-2 verification: bill reversal exercised',
        fiscal_period_id: fiscalPeriodId,
        entry_date: '2026-05-11',
      },
      ctx,
    );
    expect(reversal.bill_id).toBe(posted.bill_id);
    expect(reversal.reversal_journal_entry_id).toMatch(/^[0-9a-f-]{36}$/i);
    expect(reversal.reversal_journal_entry_id).not.toBe(posted.journal_entry_id);
    createdJeIds.push(reversal.reversal_journal_entry_id);

    // Bill state is voided.
    const { data: bill } = await db
      .from('bills')
      .select('lifecycle_state, posted_journal_entry_id')
      .eq('bill_id', posted.bill_id)
      .single();
    expect(bill!.lifecycle_state).toBe('voided');
    // posted_journal_entry_id is preserved (canonical back-reference; no overwrite per Sub-N (b)).
    expect(bill!.posted_journal_entry_id).toBe(posted.journal_entry_id);

    // EC-A-2 mirror invariants exercised naturally on the reversal JE.
    const { data: revLines } = await db
      .from('journal_lines')
      .select('*')
      .eq('journal_entry_id', reversal.reversal_journal_entry_id)
      .order('account_id', { ascending: true });
    expect(revLines).toHaveLength(2);
    for (let i = 0; i < origLines!.length; i++) {
      expect(revLines![i].account_id).toBe(origLines![i].account_id);
      // INV-REVERSAL-001 mirror: Dr ↔ Cr swapped; same amounts.
      expect(Number(revLines![i].debit_amount)).toBe(Number(origLines![i].credit_amount));
      expect(Number(revLines![i].credit_amount)).toBe(Number(origLines![i].debit_amount));
      expect(Number(revLines![i].amount_cad)).toBe(Number(origLines![i].amount_cad));
      expect(Number(revLines![i].amount_original)).toBe(Number(origLines![i].amount_original));
    }

    // Bill-grain audit at bill grain (carries reversal_reason via recordMutation).
    const { data: billAudit } = await db
      .from('audit_log')
      .select('*')
      .eq('trace_id', traceId)
      .eq('action', 'bill_reversed')
      .eq('entity_id', posted.bill_id);
    expect(billAudit).toHaveLength(1);
    expect(billAudit![0].entity_type).toBe('bill');
    expect((billAudit![0].before_state as Record<string, unknown>).lifecycle_state).toBe(
      'pending_approval',
    );

    // JE-grain audit (journal_entry.reverse) — emitted atomically by
    // journalEntryService.post via the write_journal_entry_atomic RPC.
    const { data: jeAudit } = await db
      .from('audit_log')
      .select('*')
      .eq('trace_id', traceId)
      .eq('action', 'journal_entry.reverse');
    expect(jeAudit!.length).toBeGreaterThanOrEqual(1);
  });

  it('rejects empty reversal_reason at Zod boundary (READ_FAILED validation prefix)', async () => {
    // Post a bill so the BILL_NO_POSTED_JE precondition wouldn't fire first.
    const posted = await billService.post(buildPostInput(), ctx);
    createdBillIds.push(posted.bill_id);
    createdJeIds.push(posted.journal_entry_id);

    await expect(
      billService.reverse(
        {
          org_id: SEED.ORG_HOLDING,
          bill_id: posted.bill_id,
          reversal_reason: '', // INV-REVERSAL-002 boundary — Zod min(1)
          fiscal_period_id: fiscalPeriodId,
          entry_date: '2026-05-11',
        },
        ctx,
      ),
    ).rejects.toThrow(/reverse_bill validation failed/);
  });

  it('rejects reverse from draft state (BILL_INVALID_STATE_TRANSITION)', async () => {
    await expect(
      billService.reverse(
        {
          org_id: SEED.ORG_HOLDING,
          bill_id: billDraftId,
          reversal_reason: 'should-fail-on-state',
          fiscal_period_id: fiscalPeriodId,
          entry_date: '2026-05-11',
        },
        ctx,
      ),
    ).rejects.toThrow(/BILL_INVALID_STATE_TRANSITION/);
  });

  it('rejects reverse from voided state (BILL_INVALID_STATE_TRANSITION)', async () => {
    await expect(
      billService.reverse(
        {
          org_id: SEED.ORG_HOLDING,
          bill_id: billVoidedId,
          reversal_reason: 'should-fail-on-state',
          fiscal_period_id: fiscalPeriodId,
          entry_date: '2026-05-11',
        },
        ctx,
      ),
    ).rejects.toThrow(/BILL_INVALID_STATE_TRANSITION/);
  });

  it('rejects when bill.posted_journal_entry_id is null (Sub-N (b); BILL_NO_POSTED_JE)', async () => {
    await expect(
      billService.reverse(
        {
          org_id: SEED.ORG_HOLDING,
          bill_id: billNoPostedJeId,
          reversal_reason: 'should-fail-on-no-posted-je',
          fiscal_period_id: fiscalPeriodId,
          entry_date: '2026-05-11',
        },
        ctx,
      ),
    ).rejects.toThrow(/BILL_NO_POSTED_JE/);
  });
});
