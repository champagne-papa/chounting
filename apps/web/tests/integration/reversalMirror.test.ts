// tests/integration/reversalMirror.test.ts
// Category A Floor Test 5: reversal mirror check rejects non-mirror reversals.
// Exercises the service-layer mirror check per ADR-001 and PLAN.md §15e Layer 2.

import { describe, it, expect, beforeAll } from 'vitest';
import { adminClient, SEED } from '../setup/testDb';
import { withInvariants } from '@/services/middleware/withInvariants';
import { journalEntryService } from '@/services/accounting/journalEntryService';
import type { ServiceContext } from '@/services/middleware/serviceContext';

describe('Integration Test 5: reversal mirror check rejects non-mirror reversal', () => {
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
    // Look up accounts and period
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

    // Post a valid original entry we can attempt to reverse.
    const result = await withInvariants(
      journalEntryService.post,
      { action: 'journal_entry.post' },
    )(
      buildBalancedEntry(),
      freshCtx(),
    );
    originalEntryId = result.journal_entry_id;
  });

  function buildBalancedEntry() {
    return {
      org_id: SEED.ORG_HOLDING,
      fiscal_period_id: periodId,
      entry_date: new Date().toISOString().slice(0, 10),
      description: 'Test entry for reversal',
      source: 'manual' as const,
      lines: [
        {
          account_id: cashAccountId,
          debit_amount: '500.0000',
          credit_amount: '0.0000',
          currency: 'CAD',
          amount_original: '500.0000',
          amount_cad: '500.0000',
          fx_rate: '1.00000000',
        },
        {
          account_id: feesAccountId,
          debit_amount: '0.0000',
          credit_amount: '500.0000',
          currency: 'CAD',
          amount_original: '500.0000',
          amount_cad: '500.0000',
          fx_rate: '1.00000000',
        },
      ],
    };
  }

  function buildMirroredReversal() {
    return {
      org_id: SEED.ORG_HOLDING,
      fiscal_period_id: periodId,
      entry_date: new Date().toISOString().slice(0, 10),
      description: 'Reversal of test entry',
      source: 'manual' as const,
      reverses_journal_entry_id: originalEntryId,
      reversal_reason: 'vendor misclassified — correcting per controller review',
      lines: [
        {
          account_id: cashAccountId,
          debit_amount: '0.0000',       // SWAPPED from original
          credit_amount: '500.0000',    // SWAPPED from original
          currency: 'CAD',
          amount_original: '500.0000',
          amount_cad: '500.0000',
          fx_rate: '1.00000000',
        },
        {
          account_id: feesAccountId,
          debit_amount: '500.0000',     // SWAPPED from original
          credit_amount: '0.0000',      // SWAPPED from original
          currency: 'CAD',
          amount_original: '500.0000',
          amount_cad: '500.0000',
          fx_rate: '1.00000000',
        },
      ],
    };
  }

  it('rejects a reversal whose lines are NOT the debit/credit mirror of the original', async () => {
    // Lines copied verbatim from original — NOT swapped. Must reject.
    const nonMirrorReversal = {
      ...buildBalancedEntry(),
      reverses_journal_entry_id: originalEntryId,
      reversal_reason: 'deliberate non-mirror for test',
    };

    const { count: beforeCount } = await db
      .from('journal_entries')
      .select('*', { count: 'exact', head: true })
      .eq('reverses_journal_entry_id', originalEntryId);

    await expect(
      withInvariants(journalEntryService.post, { action: 'journal_entry.post' })(
        nonMirrorReversal, freshCtx()
      )
    ).rejects.toThrow(/REVERSAL_NOT_MIRROR/);

    const { count: afterCount } = await db
      .from('journal_entries')
      .select('*', { count: 'exact', head: true })
      .eq('reverses_journal_entry_id', originalEntryId);

    expect(afterCount).toBe(beforeCount);
  });

  it('rejects a reversal with empty reversal_reason even if the mirror holds', async () => {
    const mirroredButReasonless = {
      ...buildMirroredReversal(),
      reversal_reason: '', // empty — must be rejected
    };

    await expect(
      withInvariants(journalEntryService.post, { action: 'journal_entry.post' })(
        mirroredButReasonless, freshCtx()
      )
    ).rejects.toThrow();
  });

  it('accepts a correctly mirrored reversal with a non-empty reason (happy path)', async () => {
    const goodReversal = buildMirroredReversal();

    const result = await withInvariants(
      journalEntryService.post,
      { action: 'journal_entry.post' },
    )(goodReversal, freshCtx());

    expect(result.journal_entry_id).toBeDefined();

    // Verify the FK link and reason landed
    const { data: row } = await db
      .from('journal_entries')
      .select('reverses_journal_entry_id, reversal_reason')
      .eq('journal_entry_id', result.journal_entry_id)
      .single();

    expect(row?.reverses_journal_entry_id).toBe(originalEntryId);
    expect(row?.reversal_reason).toBe(
      'vendor misclassified — correcting per controller review'
    );
  });
});
