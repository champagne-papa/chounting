// tests/integration/reversalCrossOrg.test.ts
// Phase 1.1 mutation-coverage gap 8 (Mutation 8 — cross-org reversal target).
// Pins INV-REVERSAL-001 step 3 (same-org check) per
// docs/02_specs/ledger_truth_model.md lines 3018–3023 and
// docs/07_governance/adr/0001-reversal-semantics.md (1) sub-step 2.
// The cross-org defense is single-layer (no DB CHECK or RLS backstop), so
// this test is the mechanical proof that step 3 fires before any DB write.
//
// Coverage scope note: this test asserts no-write at journal_entries/
// journal_lines/audit_log count level (dual-org for journal_entries
// and audit_log). The original org B entry's line *count* is verified
// unchanged; line *content* (account_id, amounts, etc.) is not asserted.
// A mutation that modified an existing entry's lines while preserving
// row count would not be caught here. That's the correct boundary for
// this test: cross-org rejection is an INV-REVERSAL-001 step 3 invariant;
// existing-entry immutability is a different invariant
// (journal_entries_no_update RLS policy + the immutability triggers in
// migration 20240133) covered by journalEntryImmutability.test.ts.

import { describe, it, expect, beforeAll } from 'vitest';
import { adminClient, SEED } from '../setup/testDb';
import { withInvariants } from '@/services/middleware/withInvariants';
import { journalEntryService } from '@/services/accounting/journalEntryService';
import { ServiceError } from '@/services/errors/ServiceError';
import type { ServiceContext } from '@/services/middleware/serviceContext';

describe('reversal cross-org defense (INV-REVERSAL-001 step 3)', () => {
  const db = adminClient();

  // ORG_REAL_ESTATE accounts/period (the original entry's home).
  let orgB_cashAccountId: string;
  let orgB_feesAccountId: string;
  let orgB_periodId: string;
  let orgB_entryId: string;
  let orgB_originalLineCount: number;

  // ORG_HOLDING accounts/period (the cross-org reversal's claimed home).
  let orgA_cashAccountId: string;
  let orgA_feesAccountId: string;
  let orgA_periodId: string;

  // Per Q1: dual-org caller (USER_CONTROLLER has membership in both orgs).
  // Per spec, INV-REVERSAL-001 step 3 checks original.org_id !== input.org_id —
  // not caller membership — so the caller is given every prerequisite except
  // a same-org target.
  const dualOrgCtx: ServiceContext = {
    trace_id: crypto.randomUUID(),
    caller: {
      verified: true,
      user_id: SEED.USER_CONTROLLER,
      email: 'controller@thebridge.local',
      org_ids: [SEED.ORG_HOLDING, SEED.ORG_REAL_ESTATE],
    },
    locale: 'en',
  };

  function freshCtx(): ServiceContext {
    return { ...dualOrgCtx, trace_id: crypto.randomUUID() };
  }

  beforeAll(async () => {
    const { data: bCash } = await db
      .from('chart_of_accounts')
      .select('account_id')
      .eq('org_id', SEED.ORG_REAL_ESTATE)
      .eq('account_code', '1000')
      .single();
    const { data: bFees } = await db
      .from('chart_of_accounts')
      .select('account_id')
      .eq('org_id', SEED.ORG_REAL_ESTATE)
      .eq('account_code', '4000')
      .single();
    const { data: bPeriod } = await db
      .from('fiscal_periods')
      .select('period_id')
      .eq('org_id', SEED.ORG_REAL_ESTATE)
      .eq('is_locked', false)
      .single();

    const { data: aCash } = await db
      .from('chart_of_accounts')
      .select('account_id')
      .eq('org_id', SEED.ORG_HOLDING)
      .eq('account_code', '1000')
      .single();
    const { data: aFees } = await db
      .from('chart_of_accounts')
      .select('account_id')
      .eq('org_id', SEED.ORG_HOLDING)
      .eq('account_code', '4000')
      .single();
    const { data: aPeriod } = await db
      .from('fiscal_periods')
      .select('period_id')
      .eq('org_id', SEED.ORG_HOLDING)
      .eq('is_locked', false)
      .single();

    orgB_cashAccountId = bCash!.account_id;
    orgB_feesAccountId = bFees!.account_id;
    orgB_periodId = bPeriod!.period_id;
    orgA_cashAccountId = aCash!.account_id;
    orgA_feesAccountId = aFees!.account_id;
    orgA_periodId = aPeriod!.period_id;

    // Seed a valid balanced original entry in ORG_REAL_ESTATE (org B).
    const original = {
      org_id: SEED.ORG_REAL_ESTATE,
      fiscal_period_id: orgB_periodId,
      entry_date: new Date().toISOString().slice(0, 10),
      description: 'Cross-org test: original entry in org B',
      source: 'manual' as const,
      lines: [
        {
          account_id: orgB_cashAccountId,
          debit_amount: '750.0000',
          credit_amount: '0.0000',
          currency: 'CAD',
          amount_original: '750.0000',
          amount_cad: '750.0000',
          fx_rate: '1.00000000',
        },
        {
          account_id: orgB_feesAccountId,
          debit_amount: '0.0000',
          credit_amount: '750.0000',
          currency: 'CAD',
          amount_original: '750.0000',
          amount_cad: '750.0000',
          fx_rate: '1.00000000',
        },
      ],
    };

    const result = await withInvariants(
      journalEntryService.post,
      { action: 'journal_entry.post' },
    )(original, freshCtx());
    orgB_entryId = result.journal_entry_id;
    orgB_originalLineCount = original.lines.length;
  });

  function buildCrossOrgReversal(opts: { mirrored: boolean }) {
    // Reversal claims org_id = ORG_HOLDING but reverses_journal_entry_id
    // points at the org B original. Lines use ORG_HOLDING accounts and
    // ORG_HOLDING period (a structurally legal entry in org A's frame).
    //
    // mirrored=true: debit/credit swapped (mirror shape).
    // mirrored=false: debit/credit verbatim from original direction
    //   (explicitly non-mirroring — proves step 3 wins over step 5).
    const debitFirst = opts.mirrored ? '0.0000' : '750.0000';
    const creditFirst = opts.mirrored ? '750.0000' : '0.0000';
    const debitSecond = opts.mirrored ? '750.0000' : '0.0000';
    const creditSecond = opts.mirrored ? '0.0000' : '750.0000';

    return {
      org_id: SEED.ORG_HOLDING,
      fiscal_period_id: orgA_periodId,
      entry_date: new Date().toISOString().slice(0, 10),
      description: 'Cross-org reversal attempt',
      source: 'manual' as const,
      reverses_journal_entry_id: orgB_entryId,
      reversal_reason: 'cross-org reversal attempt — should be rejected',
      lines: [
        {
          account_id: orgA_cashAccountId,
          debit_amount: debitFirst,
          credit_amount: creditFirst,
          currency: 'CAD',
          amount_original: '750.0000',
          amount_cad: '750.0000',
          fx_rate: '1.00000000',
        },
        {
          account_id: orgA_feesAccountId,
          debit_amount: debitSecond,
          credit_amount: creditSecond,
          currency: 'CAD',
          amount_original: '750.0000',
          amount_cad: '750.0000',
          fx_rate: '1.00000000',
        },
      ],
    };
  }

  async function snapshot() {
    const { count: reversalsAgainstOrgB } = await db
      .from('journal_entries')
      .select('*', { count: 'exact', head: true })
      .eq('reverses_journal_entry_id', orgB_entryId);
    const { count: orgAJournals } = await db
      .from('journal_entries')
      .select('*', { count: 'exact', head: true })
      .eq('org_id', SEED.ORG_HOLDING);
    const { count: orgBJournals } = await db
      .from('journal_entries')
      .select('*', { count: 'exact', head: true })
      .eq('org_id', SEED.ORG_REAL_ESTATE);
    const { count: orgAAudit } = await db
      .from('audit_log')
      .select('*', { count: 'exact', head: true })
      .eq('org_id', SEED.ORG_HOLDING);
    const { count: orgBAudit } = await db
      .from('audit_log')
      .select('*', { count: 'exact', head: true })
      .eq('org_id', SEED.ORG_REAL_ESTATE);
    return {
      reversalsAgainstOrgB,
      orgAJournals,
      orgBJournals,
      orgAAudit,
      orgBAudit,
    };
  }

  it('rejects with REVERSAL_CROSS_ORG when the referenced entry is in a different org', async () => {
    const before = await snapshot();

    let caught: unknown;
    try {
      await withInvariants(
        journalEntryService.post,
        { action: 'journal_entry.post' },
      )(buildCrossOrgReversal({ mirrored: true }), freshCtx());
    } catch (e) {
      caught = e;
    }

    expect(caught).toBeInstanceOf(ServiceError);
    expect((caught as ServiceError).code).toBe('REVERSAL_CROSS_ORG');
    expect((caught as Error).message).toMatch(/REVERSAL_CROSS_ORG/);

    const after = await snapshot();
    expect(after.reversalsAgainstOrgB).toBe(before.reversalsAgainstOrgB);
    expect(after.orgAJournals).toBe(before.orgAJournals);
    expect(after.orgBJournals).toBe(before.orgBJournals);
    expect(after.orgAAudit).toBe(before.orgAAudit);
    expect(after.orgBAudit).toBe(before.orgBAudit);

    // Original org B entry still exists with its line count.
    const { data: originalRow } = await db
      .from('journal_entries')
      .select('journal_entry_id, org_id')
      .eq('journal_entry_id', orgB_entryId)
      .single();
    expect(originalRow?.org_id).toBe(SEED.ORG_REAL_ESTATE);

    const { count: lineCount } = await db
      .from('journal_lines')
      .select('*', { count: 'exact', head: true })
      .eq('journal_entry_id', orgB_entryId);
    expect(lineCount).toBe(orgB_originalLineCount);
  });

  it('throws REVERSAL_CROSS_ORG (not REVERSAL_NOT_MIRROR) when the input is also non-mirroring (step 3 wins over step 5)', async () => {
    let caught: unknown;
    try {
      await withInvariants(
        journalEntryService.post,
        { action: 'journal_entry.post' },
      )(buildCrossOrgReversal({ mirrored: false }), freshCtx());
    } catch (e) {
      caught = e;
    }

    expect(caught).toBeInstanceOf(ServiceError);
    expect((caught as ServiceError).code).toBe('REVERSAL_CROSS_ORG');
  });
});
