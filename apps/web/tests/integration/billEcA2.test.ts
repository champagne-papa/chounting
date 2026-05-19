// tests/integration/billEcA2.test.ts
//
// Phase 5 chunk B5-2 substantive session #1 — per-criterion integration test.
// Spend brief §11.2 (EC-A-2) verifies bill reversal exercises the full
// mirror-semantics path per ADR-0001 + INV-REVERSAL-001/002. EC-A-2 is
// exercised here directly via billService.reverse — the wrapper loads
// the original posted JE's lines and dispatches them (Dr ↔ Cr swapped)
// to journalEntryService.post(reverses_journal_entry_id=...).
//
// EC-A-2 invariant set (per Spend brief §11.2):
//   INV-REVERSAL-001 — reversal lines mirror original (Dr ↔ Cr swap;
//                      same accounts; same currency; same amounts;
//                      same fx_rate; same tax_code_id; same line count).
//   INV-REVERSAL-002 — reversal entries require non-empty reversal_reason
//                      (Zod min(1) at billService.reverse Layer-2 boundary).
//   Inherited EC-A-1 on the reversal JE itself:
//     INV-LEDGER-001 balanced (Dr↔Cr swap preserves sum equality)
//     INV-LEDGER-004 debit XOR credit (post-swap each line still
//                    has exactly one positive amount)
//     INV-LEDGER-005 non-zero
//     INV-LEDGER-006 non-negative
//
// Item 20 dedicated test-accounts pattern (per
// .claude/skills/integration-test-rules/SKILL.md §3) applies because
// this test posts JEs via billService.post (which routes through
// journalEntryService.post) and then reverses them.

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { adminClient, SEED } from '../setup/testDb';
import { makeTestContext } from '../setup/makeTestContext';
import { billService } from '@/services/spend/billService';

describe('bill EC-A-2: reverse_bill mirror + Layer-2 invariants', () => {
  const db = adminClient();
  const traceId = crypto.randomUUID();
  const ctx = makeTestContext({ trace_id: traceId, org_ids: [SEED.ORG_HOLDING] });

  let vendorId: string;
  let apControlAccountId: string;
  let expenseAccount1Id: string;
  let expenseAccount2Id: string;
  let fiscalPeriodId: string;
  let gstTaxCodeId: string;
  let pstTaxCodeId: string;
  const createdBillIds: string[] = [];
  const createdJeIds: string[] = [];

  beforeAll(async () => {
    vendorId = crypto.randomUUID();

    // Item 20 dedicated test-accounts pattern: per-run unique codes via traceId.
    const apCode = `T${traceId.slice(0, 8)}_AP`;
    const exp1Code = `T${traceId.slice(0, 8)}_EXP1`;
    const exp2Code = `T${traceId.slice(0, 8)}_EXP2`;
    const { data: created, error: coaErr } = await db
      .from('chart_of_accounts')
      .insert([
        {
          org_id: SEED.ORG_HOLDING,
          account_code: apCode,
          account_name: 'TEST EC-A-2 AP control proxy',
          account_type: 'liability',
        },
        {
          org_id: SEED.ORG_HOLDING,
          account_code: exp1Code,
          account_name: 'TEST EC-A-2 expense proxy 1',
          account_type: 'expense',
        },
        {
          org_id: SEED.ORG_HOLDING,
          account_code: exp2Code,
          account_name: 'TEST EC-A-2 expense proxy 2',
          account_type: 'expense',
        },
      ])
      .select('account_id, account_code');
    if (coaErr || !created || created.length !== 3) {
      throw new Error(`COA seed failed: ${coaErr?.message ?? 'no data'}`);
    }
    apControlAccountId = created.find((c) => c.account_code === apCode)!.account_id;
    expenseAccount1Id = created.find((c) => c.account_code === exp1Code)!.account_id;
    expenseAccount2Id = created.find((c) => c.account_code === exp2Code)!.account_id;

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

    // Resolve seeded shared tax codes (org_id IS NULL — visible to all orgs
    // per migration 20240103000000_seed_tax_codes.sql).
    const { data: taxCodes, error: tcErr } = await db
      .from('tax_codes')
      .select('tax_code_id, code')
      .is('org_id', null)
      .in('code', ['GST', 'PST_BC']);
    if (tcErr || !taxCodes || taxCodes.length !== 2) {
      throw new Error(`tax_codes lookup failed: ${tcErr?.message ?? 'expected 2 rows'}`);
    }
    gstTaxCodeId = taxCodes.find((t) => t.code === 'GST')!.tax_code_id;
    pstTaxCodeId = taxCodes.find((t) => t.code === 'PST_BC')!.tax_code_id;

    const { error: vendorErr } = await db.from('vendors').insert({
      vendor_id: vendorId,
      org_id: SEED.ORG_HOLDING,
      name: 'TEST EC-A-2 vendor',
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

  function buildMultiLinePostInput(billNumber: string) {
    // Multi-line bill — tax-coded — sets up a non-trivial mirror.
    return {
      org_id: SEED.ORG_HOLDING,
      vendor_id: vendorId,
      bill_number: billNumber,
      issue_date: '2026-05-10',
      due_date: '2026-06-10',
      payment_terms_days: 30,
      purchase_order_id: null,
      currency: 'CAD' as const,
      amount_original: '1500.0000',
      amount_cad: '1500.0000',
      fx_rate: '1.00000000',
      tax_amount_total: '180.0000',
      bill_lines: [
        {
          account_id: expenseAccount1Id,
          description: 'EC-A-2 expense line 1 (GST-coded)',
          amount: '1000.0000',
          amount_original: '1000.0000',
          amount_cad: '1000.0000',
          tax_code_id: gstTaxCodeId,
          line_number: 1,
        },
        {
          account_id: expenseAccount2Id,
          description: 'EC-A-2 expense line 2 (PST-coded)',
          amount: '500.0000',
          amount_original: '500.0000',
          amount_cad: '500.0000',
          tax_code_id: pstTaxCodeId,
          line_number: 2,
        },
      ],
      fiscal_period_id: fiscalPeriodId,
      entry_date: '2026-05-10',
      ap_control_account_id: apControlAccountId,
      // INV-DOC-001 bypass per Sub-Q4-d (Phase 5.1 chunk 5.1a Task 7b).
      override_evidence_completeness: true,
    };
  }

  it('reverse_bill produces mirror JE: Dr↔Cr swapped, same accounts/amounts/currency/fx/tax_code, same line count (INV-REVERSAL-001)', async () => {
    // Step 1: post a multi-line bill (Dr expense×2 / Cr ap_control).
    const posted = await billService.post(buildMultiLinePostInput('EC-A-2-MIRROR'), ctx);
    createdBillIds.push(posted.bill_id);
    createdJeIds.push(posted.journal_entry_id);

    // Capture original JE lines (Reading B preservation: SELECT only).
    const { data: origLines } = await db
      .from('journal_lines')
      .select('*')
      .eq('journal_entry_id', posted.journal_entry_id)
      .order('account_id', { ascending: true });
    expect(origLines).toHaveLength(3); // Dr exp1, Dr exp2, Cr ap_control

    // Step 2: reverse the bill — billService.reverse loads original lines,
    // swaps Dr ↔ Cr, dispatches to journalEntryService.post via the
    // reversal-input shape (reverses_journal_entry_id + reversal_reason).
    const reversal = await billService.reverse(
      {
        org_id: SEED.ORG_HOLDING,
        bill_id: posted.bill_id,
        reversal_reason: 'EC-A-2 verification: full mirror invariants',
        fiscal_period_id: fiscalPeriodId,
        entry_date: '2026-05-11',
      },
      ctx,
    );
    createdJeIds.push(reversal.reversal_journal_entry_id);

    expect(reversal.bill_id).toBe(posted.bill_id);
    expect(reversal.reversal_journal_entry_id).toMatch(/^[0-9a-f-]{36}$/i);
    expect(reversal.reversal_journal_entry_id).not.toBe(posted.journal_entry_id);

    // Bill state transitioned to voided per Sub-D.
    const { data: billRow } = await db
      .from('bills')
      .select('lifecycle_state, posted_journal_entry_id')
      .eq('bill_id', posted.bill_id)
      .single();
    expect(billRow!.lifecycle_state).toBe('voided');

    // INV-REVERSAL-001 mirror verification: per-account Dr↔Cr swap, same
    // accounts, same amounts, same currency, same fx_rate, same tax_code_id,
    // same line count.
    const { data: revLines } = await db
      .from('journal_lines')
      .select('*')
      .eq('journal_entry_id', reversal.reversal_journal_entry_id)
      .order('account_id', { ascending: true });
    expect(revLines).toHaveLength(origLines!.length); // same line count
    expect(revLines).toHaveLength(3);

    for (let i = 0; i < origLines!.length; i++) {
      const orig = origLines![i];
      const rev = revLines![i];

      // Same account
      expect(rev.account_id).toBe(orig.account_id);

      // INV-REVERSAL-001: Dr ↔ Cr swap
      expect(Number(rev.debit_amount)).toBe(Number(orig.credit_amount));
      expect(Number(rev.credit_amount)).toBe(Number(orig.debit_amount));

      // Same currency
      expect(rev.currency).toBe(orig.currency);
      expect(rev.currency).toBe('CAD');

      // Same amount_original / amount_cad
      expect(Number(rev.amount_original)).toBe(Number(orig.amount_original));
      expect(Number(rev.amount_cad)).toBe(Number(orig.amount_cad));

      // Same fx_rate
      expect(Number(rev.fx_rate)).toBe(Number(orig.fx_rate));

      // Same tax_code_id (preserved through mirror; Dr expense lines keep
      // their tax_code; Cr ap_control keeps null).
      expect(rev.tax_code_id).toBe(orig.tax_code_id);
    }
  });

  it('INV-REVERSAL-002 — rejects empty reversal_reason at Zod boundary (reverse_bill validation failed)', async () => {
    // Zod min(1) on reversal_reason at billService.reverse Layer-2 boundary
    // fires BEFORE bill load — bill_id can be any uuid format (the schema
    // never gets past the failing reason refine to load the bill).
    await expect(
      billService.reverse(
        {
          org_id: SEED.ORG_HOLDING,
          bill_id: '00000000-0000-0000-0000-000000000001',
          reversal_reason: '', // INV-REVERSAL-002 boundary violation
          fiscal_period_id: fiscalPeriodId,
          entry_date: '2026-05-11',
        },
        ctx,
      ),
    ).rejects.toThrow(/reverse_bill validation failed/);
  });

  it('reversal JE itself satisfies inherited EC-A-1 Layer-2 invariants (balanced + XOR + non-zero + non-negative)', async () => {
    // Post + reverse a fresh bill — verify the REVERSAL JE alone (not the
    // pair) satisfies the EC-A-1 set. The mirror semantics guarantee this
    // because Dr↔Cr swap preserves sum equality, line count, and
    // non-zero/non-negative amounts.
    const posted = await billService.post(buildMultiLinePostInput('EC-A-2-INHERIT'), ctx);
    createdBillIds.push(posted.bill_id);
    createdJeIds.push(posted.journal_entry_id);

    const reversal = await billService.reverse(
      {
        org_id: SEED.ORG_HOLDING,
        bill_id: posted.bill_id,
        reversal_reason: 'EC-A-2 inherit verification: Layer-2 invariants on reversal entry',
        fiscal_period_id: fiscalPeriodId,
        entry_date: '2026-05-11',
      },
      ctx,
    );
    createdJeIds.push(reversal.reversal_journal_entry_id);

    const { data: revLines } = await db
      .from('journal_lines')
      .select('*')
      .eq('journal_entry_id', reversal.reversal_journal_entry_id);
    expect(revLines).toHaveLength(3);

    // INV-LEDGER-001 — reversal entry balanced.
    const totalDebits = revLines!.reduce((s, l) => s + Number(l.debit_amount), 0);
    const totalCredits = revLines!.reduce((s, l) => s + Number(l.credit_amount), 0);
    expect(totalDebits).toBe(totalCredits);
    expect(totalDebits).toBe(1500);

    for (const line of revLines!) {
      const d = Number(line.debit_amount);
      const c = Number(line.credit_amount);

      // INV-LEDGER-004 — debit XOR credit on each reversal line.
      expect((d > 0) !== (c > 0)).toBe(true);

      // INV-LEDGER-005 — no all-zero lines.
      expect(Number(line.amount_original)).toBeGreaterThan(0);

      // INV-LEDGER-006 — non-negative.
      expect(d).toBeGreaterThanOrEqual(0);
      expect(c).toBeGreaterThanOrEqual(0);
      expect(Number(line.amount_original)).toBeGreaterThanOrEqual(0);
      expect(Number(line.amount_cad)).toBeGreaterThanOrEqual(0);
    }
  });
});
