// tests/integration/billPostBill.test.ts
//
// Phase 5 chunk B5-2 substantive session #1 — per-mutation integration test
// for billService.post (post_bill).
//
// Exercises: happy path (creates bill row in 'pending_approval' + bill_lines
// rows + posts JE via journalEntryService.post() with Dr expense / Cr ap_control
// balanced + populates bills.posted_journal_entry_id per Sub-N (b) + emits
// bill_created audit at bill grain); rejects unknown vendor (NOT_FOUND);
// rejects malformed Zod input (READ_FAILED with validation message); rejects
// unknown ap_control_account_id (NOT_FOUND).
//
// Item 20 dedicated test-accounts pattern (per
// .claude/skills/integration-test-rules/SKILL.md §3): per-run unique
// account_codes derived from traceId (apCode for AP control; expCode for
// expense). Codes must be unique per run because chart_of_accounts has
// UNIQUE(org_id, account_code).

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { adminClient, SEED } from '../setup/testDb';
import { makeTestContext } from '../setup/makeTestContext';
import { billService } from '@/services/spend/billService';

describe('billService.post', () => {
  const db = adminClient();
  const traceId = crypto.randomUUID();
  const ctx = makeTestContext({ trace_id: traceId, org_ids: [SEED.ORG_HOLDING] });

  let vendorId: string;
  let apControlAccountId: string;
  let expenseAccountId: string;
  let fiscalPeriodId: string;
  const createdBillIds: string[] = [];
  const createdJeIds: string[] = [];

  beforeAll(async () => {
    vendorId = crypto.randomUUID();

    // Item 20 dedicated test-accounts pattern: per-run unique codes via traceId.
    const apCode = `T${traceId.slice(0, 8)}_AP`;
    const expCode = `T${traceId.slice(0, 8)}_EXP`;
    const { data: created, error: coaErr } = await db
      .from('chart_of_accounts')
      .insert([
        {
          org_id: SEED.ORG_HOLDING,
          account_code: apCode,
          account_name: 'TEST post_bill AP control proxy',
          account_type: 'liability',
        },
        {
          org_id: SEED.ORG_HOLDING,
          account_code: expCode,
          account_name: 'TEST post_bill expense proxy',
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
      .select('period_id, start_date, end_date')
      .eq('org_id', SEED.ORG_HOLDING)
      .eq('is_locked', false)
      .order('start_date', { ascending: true })
      .limit(1)
      .single();
    if (!period) throw new Error('no open fiscal period for ORG_HOLDING');
    fiscalPeriodId = period.period_id;

    const { error: vendorErr } = await db.from('vendors').insert({
      vendor_id: vendorId,
      org_id: SEED.ORG_HOLDING,
      name: 'TEST post_bill vendor',
    });
    if (vendorErr) throw new Error(`vendor seed failed: ${vendorErr.message}`);
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

  function buildPostInput(overrides: Partial<Record<string, unknown>> = {}) {
    return {
      org_id: SEED.ORG_HOLDING,
      vendor_id: vendorId,
      bill_number: 'TEST-001',
      issue_date: '2026-05-10',
      due_date: '2026-06-10',
      payment_terms_days: 30,
      purchase_order_id: null,
      currency: 'CAD' as const,
      amount_original: '1000.0000',
      amount_cad: '1000.0000',
      fx_rate: '1.00000000',
      tax_amount_total: '0.0000',
      bill_lines: [
        {
          account_id: expenseAccountId,
          description: 'Test expense line',
          amount: '1000.0000',
          amount_original: '1000.0000',
          amount_cad: '1000.0000',
          tax_code_id: null,
          line_number: 1,
        },
      ],
      fiscal_period_id: fiscalPeriodId,
      entry_date: '2026-05-10',
      ap_control_account_id: apControlAccountId,
      // INV-DOC-001 (Phase 5.1 chunk 5.1a) bypass per Sub-Q4-d override-as-
      // canonical-bypass discipline: test fixtures don't exercise evidence-
      // completeness enforcement; override flag preserves pre-Phase-5.1
      // posting semantics. See chunk 5.1a brief Task 7b.
      override_evidence_completeness: true,
      ...overrides,
    };
  }

  it('happy path: creates bill in pending_approval, posts balanced JE, populates posted_journal_entry_id, emits audit', async () => {
    const result = await billService.post(buildPostInput(), ctx);

    expect(result.bill_id).toMatch(/^[0-9a-f-]{36}$/i);
    expect(result.journal_entry_id).toMatch(/^[0-9a-f-]{36}$/i);
    createdBillIds.push(result.bill_id);
    createdJeIds.push(result.journal_entry_id);

    const { data: bill } = await db
      .from('bills')
      .select('*')
      .eq('bill_id', result.bill_id)
      .single();
    expect(bill).toBeTruthy();
    expect(bill!.lifecycle_state).toBe('pending_approval');
    expect(bill!.posted_journal_entry_id).toBe(result.journal_entry_id);
    expect(bill!.vendor_id).toBe(vendorId);
    expect(bill!.org_id).toBe(SEED.ORG_HOLDING);
    expect(bill!.bill_number).toBe('TEST-001');
    expect(Number(bill!.amount_cad)).toBe(1000);
    expect(Number(bill!.amount_original)).toBe(1000);
    expect(bill!.payment_terms_days).toBe(30);
    expect(Number(bill!.tax_amount_total)).toBe(0);

    const { data: lines } = await db
      .from('bill_lines')
      .select('*')
      .eq('bill_id', result.bill_id);
    expect(lines).toHaveLength(1);
    expect(lines![0].account_id).toBe(expenseAccountId);
    expect(lines![0].line_number).toBe(1);
    expect(Number(lines![0].amount)).toBe(1000);

    // JE balanced (Dr expense / Cr ap_control)
    const { data: jeLines } = await db
      .from('journal_lines')
      .select('*')
      .eq('journal_entry_id', result.journal_entry_id)
      .order('account_id');
    expect(jeLines).toHaveLength(2);
    const drLine = jeLines!.find((l) => Number(l.debit_amount) > 0);
    const crLine = jeLines!.find((l) => Number(l.credit_amount) > 0);
    expect(drLine).toBeTruthy();
    expect(crLine).toBeTruthy();
    expect(drLine!.account_id).toBe(expenseAccountId);
    expect(crLine!.account_id).toBe(apControlAccountId);
    expect(Number(drLine!.debit_amount)).toBe(1000);
    expect(Number(crLine!.credit_amount)).toBe(1000);

    // Bill-grain audit emission
    const { data: billAudit } = await db
      .from('audit_log')
      .select('*')
      .eq('trace_id', traceId)
      .eq('action', 'bill_created');
    expect(billAudit).toHaveLength(1);
    expect(billAudit![0].entity_type).toBe('bill');
    expect(billAudit![0].entity_id).toBe(result.bill_id);
    expect(billAudit![0].user_id).toBe(ctx.caller.user_id);

    // JE-grain audit (emitted atomically by journalEntryService.post)
    const { data: jeAudit } = await db
      .from('audit_log')
      .select('*')
      .eq('trace_id', traceId)
      .eq('action', 'journal_entry.post');
    expect(jeAudit!.length).toBeGreaterThanOrEqual(1);
  });

  it('rejects when vendor does not exist in the org (NOT_FOUND)', async () => {
    await expect(
      billService.post(
        buildPostInput({ vendor_id: '00000000-0000-0000-0000-deadbeef0000' }),
        ctx,
      ),
    ).rejects.toThrow(/vendor_id=.* not found/);
  });

  it('rejects when ap_control_account_id does not exist in the org (NOT_FOUND)', async () => {
    await expect(
      billService.post(
        buildPostInput({ ap_control_account_id: '00000000-0000-0000-0000-deadbeef0001' }),
        ctx,
      ),
    ).rejects.toThrow(/account_id=.* not found/);
  });

  it('rejects malformed Zod input (bad amount format) with READ_FAILED validation prefix', async () => {
    await expect(
      billService.post(
        buildPostInput({ amount_cad: 'not-a-number' }) as never,
        ctx,
      ),
    ).rejects.toThrow(/post_bill validation failed/);
  });
});
