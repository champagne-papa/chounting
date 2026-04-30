// tests/integration/reversalReasonWhitespace.test.ts
//
// Phase 1.1 mutation-coverage gap 6 (Mutation 6 — whitespace-only reversal_reason).
//
// Three-layer defense regression coverage:
//   Layer 3 (Zod): ReversalInputSchema.reversal_reason: z.string().min(1)
//                  is length-only and accepts whitespace-only strings.
//   Layer 2 (service): INV-REVERSAL-001 step 1 rejects whitespace-only with
//                  ServiceError('REVERSAL_NOT_MIRROR', ...) — see
//                  docs/02_specs/ledger_truth_model.md lines 3006–3012.
//   Layer 1a (DB): CHECK reversal_reason_required_when_reversing
//                  uses length(trim(...)) > 0 — see
//                  supabase/migrations/20240102000000_add_reversal_reason.sql
//                  and INV-REVERSAL-002 lines 1273–1411.
//
// Per Q7 (operator-resolved): test pins the service-layer catcher, asserting
// REVERSAL_NOT_MIRROR. Reasoning: INV-REVERSAL-001 line 3010 says the service
// layer "gives the caller a cleaner error code upstream of the database," so
// a regression that moved the catch to the DB CHECK would change observable
// behavior, and this test catches that drift.
//
// Per Q8: assert on `code` only, not on message text.
//
// Per Q6: sibling file to reversalMirror.test.ts (not an extension), since
// this is regression coverage rather than Category A floor scope.

import { describe, it, expect, beforeAll } from 'vitest';
import { adminClient, SEED } from '../setup/testDb';
import { withInvariants } from '@/services/middleware/withInvariants';
import { journalEntryService } from '@/services/accounting/journalEntryService';
import { ServiceError } from '@/services/errors/ServiceError';
import type { ServiceContext } from '@/services/middleware/serviceContext';

describe('reversal whitespace-only reversal_reason rejected by service layer', () => {
  const db = adminClient();
  let originalEntryId: string;
  let cashAccountId: string;
  let feesAccountId: string;
  let periodId: string;

  const controllerCtx: ServiceContext = {
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
    return { ...controllerCtx, trace_id: crypto.randomUUID() };
  }

  beforeAll(async () => {
    const { data: cash } = await db
      .from('chart_of_accounts')
      .select('account_id')
      .eq('org_id', SEED.ORG_HOLDING)
      .eq('account_code', '1000')
      .single();
    const { data: fees } = await db
      .from('chart_of_accounts')
      .select('account_id')
      .eq('org_id', SEED.ORG_HOLDING)
      .eq('account_code', '4000')
      .single();
    const { data: period } = await db
      .from('fiscal_periods')
      .select('period_id')
      .eq('org_id', SEED.ORG_HOLDING)
      .eq('is_locked', false)
      .single();

    cashAccountId = cash!.account_id;
    feesAccountId = fees!.account_id;
    periodId = period!.period_id;

    const original = {
      org_id: SEED.ORG_HOLDING,
      fiscal_period_id: periodId,
      entry_date: new Date().toISOString().slice(0, 10),
      description: 'Whitespace-reason test: original entry',
      source: 'manual' as const,
      lines: [
        {
          account_id: cashAccountId,
          debit_amount: '400.0000',
          credit_amount: '0.0000',
          currency: 'CAD',
          amount_original: '400.0000',
          amount_cad: '400.0000',
          fx_rate: '1.00000000',
        },
        {
          account_id: feesAccountId,
          debit_amount: '0.0000',
          credit_amount: '400.0000',
          currency: 'CAD',
          amount_original: '400.0000',
          amount_cad: '400.0000',
          fx_rate: '1.00000000',
        },
      ],
    };

    const result = await withInvariants(
      journalEntryService.post,
      { action: 'journal_entry.post' },
    )(original, freshCtx());
    originalEntryId = result.journal_entry_id;
  });

  function buildMirroredReversalWithReason(reason: string) {
    return {
      org_id: SEED.ORG_HOLDING,
      fiscal_period_id: periodId,
      entry_date: new Date().toISOString().slice(0, 10),
      description: 'Reversal with whitespace-only reason',
      source: 'manual' as const,
      reverses_journal_entry_id: originalEntryId,
      reversal_reason: reason,
      lines: [
        {
          account_id: cashAccountId,
          debit_amount: '0.0000',       // SWAPPED — mirror shape
          credit_amount: '400.0000',    // SWAPPED
          currency: 'CAD',
          amount_original: '400.0000',
          amount_cad: '400.0000',
          fx_rate: '1.00000000',
        },
        {
          account_id: feesAccountId,
          debit_amount: '400.0000',     // SWAPPED
          credit_amount: '0.0000',      // SWAPPED
          currency: 'CAD',
          amount_original: '400.0000',
          amount_cad: '400.0000',
          fx_rate: '1.00000000',
        },
      ],
    };
  }

  // Each whitespace input has length >= 1 (so .min(1) Zod check passes)
  // but length(trim(...)) === 0 (so service-layer trim and DB CHECK reject).
  const whitespaceCases: Array<[string, string]> = [
    ['three spaces', '   '],
    ['tab', '\t'],
    ['newline', '\n'],
  ];

  for (const [label, reason] of whitespaceCases) {
    it(`rejects with REVERSAL_NOT_MIRROR when reversal_reason is whitespace-only (${label})`, async () => {
      const { count: beforeReversals } = await db
        .from('journal_entries')
        .select('*', { count: 'exact', head: true })
        .eq('reverses_journal_entry_id', originalEntryId);

      let caught: unknown;
      try {
        await withInvariants(
          journalEntryService.post,
          { action: 'journal_entry.post' },
        )(buildMirroredReversalWithReason(reason), freshCtx());
      } catch (e) {
        caught = e;
      }

      expect(caught).toBeInstanceOf(ServiceError);
      expect((caught as ServiceError).code).toBe('REVERSAL_NOT_MIRROR');

      const { count: afterReversals } = await db
        .from('journal_entries')
        .select('*', { count: 'exact', head: true })
        .eq('reverses_journal_entry_id', originalEntryId);
      expect(afterReversals).toBe(beforeReversals);
    });
  }

  it('original entry referenced by reverses_journal_entry_id is unchanged after rejections', async () => {
    const { data: row } = await db
      .from('journal_entries')
      .select('journal_entry_id, org_id')
      .eq('journal_entry_id', originalEntryId)
      .single();
    expect(row?.journal_entry_id).toBe(originalEntryId);
    expect(row?.org_id).toBe(SEED.ORG_HOLDING);
  });
});
