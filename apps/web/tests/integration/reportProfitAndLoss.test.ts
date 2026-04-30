// tests/integration/reportProfitAndLoss.test.ts
// Integration tests for reportService.profitAndLoss with hand-calculated
// assertions. Verifies aggregation correctness against known posted entries.
// Phase 16A — this is the correctness backbone for P&L.
//
// Tests use a baseline-then-delta pattern: capture the P&L state before
// posting known entries, then assert that totals changed by exactly the
// expected amounts. This makes tests independent of entries posted by
// other integration tests sharing the same database.

import { describe, it, expect, beforeAll } from 'vitest';
import { adminClient, SEED } from '../setup/testDb';
import { withInvariants } from '@/services/middleware/withInvariants';
import { journalEntryService } from '@/services/accounting/journalEntryService';
import { reportService, type PLRow } from '@/services/reporting/reportService';
import type { ServiceContext } from '@/services/middleware/serviceContext';
import Decimal from 'decimal.js';

describe('P&L report aggregation', () => {
  const db = adminClient();

  // Account IDs looked up from seed CoA
  let cashAccountId: string;     // 1000 — asset
  let revenueAccountId: string;  // 4000 — revenue (Dividend Income)
  let expenseAccountId: string;  // 5000 — expense (Professional Fees)
  let periodId: string;

  // Baseline P&L captured before any of this test's entries are posted.
  let baseline: PLRow[];

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

  function getRow(rows: PLRow[], type: string): PLRow {
    return rows.find((r) => r.account_type === type)!;
  }

  /** Compute the delta between two MoneyAmount strings. */
  function delta(current: string, base: string): string {
    return new Decimal(current).minus(new Decimal(base)).toFixed(4);
  }

  beforeAll(async () => {
    const { data: cash } = await db
      .from('chart_of_accounts')
      .select('account_id')
      .eq('org_id', SEED.ORG_HOLDING)
      .eq('account_code', '1000')
      .single();

    const { data: revenue } = await db
      .from('chart_of_accounts')
      .select('account_id')
      .eq('org_id', SEED.ORG_HOLDING)
      .eq('account_code', '4000')
      .single();

    const { data: expense } = await db
      .from('chart_of_accounts')
      .select('account_id')
      .eq('org_id', SEED.ORG_HOLDING)
      .eq('account_code', '5000')
      .single();

    const { data: period } = await db
      .from('fiscal_periods')
      .select('period_id')
      .eq('org_id', SEED.ORG_HOLDING)
      .eq('is_locked', false)
      .single();

    cashAccountId = cash!.account_id;
    revenueAccountId = revenue!.account_id;
    expenseAccountId = expense!.account_id;
    periodId = period!.period_id;

    // Capture baseline before this test's entries
    const baseResult = await reportService.profitAndLoss(
      { org_id: SEED.ORG_HOLDING, fiscal_period_id: periodId },
      freshCtx(),
    );
    baseline = baseResult.rows;
  });

  // Helper: post a balanced journal entry
  async function postEntry(lines: Array<{
    account_id: string;
    debit_amount: string;
    credit_amount: string;
  }>) {
    return withInvariants(
      journalEntryService.post,
      { action: 'journal_entry.post' },
    )(
      {
        org_id: SEED.ORG_HOLDING,
        fiscal_period_id: periodId,
        entry_date: new Date().toISOString().slice(0, 10),
        description: 'P&L test entry',
        source: 'manual' as const,
        lines: lines.map((l) => ({
          ...l,
          currency: 'CAD',
          amount_original: l.debit_amount === '0.0000' ? l.credit_amount : l.debit_amount,
          amount_cad: l.debit_amount === '0.0000' ? l.credit_amount : l.debit_amount,
          fx_rate: '1.00000000',
        })),
      },
      freshCtx(),
    );
  }

  it('returns 5 rows with correct account types', async () => {
    const result = await reportService.profitAndLoss(
      { org_id: SEED.ORG_HOLDING, fiscal_period_id: periodId },
      freshCtx(),
    );

    expect(result.rows).toHaveLength(5);
    const types = result.rows.map((r) => r.account_type);
    expect(types).toEqual(['asset', 'liability', 'equity', 'revenue', 'expense']);
  });

  it('correctly aggregates a single revenue entry ($1000)', async () => {
    // Post: debit Cash $1000, credit Revenue $1000
    await postEntry([
      { account_id: cashAccountId, debit_amount: '1000.0000', credit_amount: '0.0000' },
      { account_id: revenueAccountId, debit_amount: '0.0000', credit_amount: '1000.0000' },
    ]);

    const result = await reportService.profitAndLoss(
      { org_id: SEED.ORG_HOLDING, fiscal_period_id: periodId },
      freshCtx(),
    );

    const revenueRow = getRow(result.rows, 'revenue');
    const assetRow = getRow(result.rows, 'asset');
    const baseRevenue = getRow(baseline, 'revenue');
    const baseAsset = getRow(baseline, 'asset');

    // Delta from baseline: revenue got +$1000 credit, asset got +$1000 debit
    expect(delta(revenueRow.credit_total_cad, baseRevenue.credit_total_cad)).toBe('1000.0000');
    expect(delta(assetRow.debit_total_cad, baseAsset.debit_total_cad)).toBe('1000.0000');
  });

  it('correctly aggregates revenue + expense (net income delta = $400)', async () => {
    // Post: debit Expense $600, credit Cash $600
    await postEntry([
      { account_id: expenseAccountId, debit_amount: '600.0000', credit_amount: '0.0000' },
      { account_id: cashAccountId, debit_amount: '0.0000', credit_amount: '600.0000' },
    ]);

    const result = await reportService.profitAndLoss(
      { org_id: SEED.ORG_HOLDING, fiscal_period_id: periodId },
      freshCtx(),
    );

    const revenueRow = getRow(result.rows, 'revenue');
    const expenseRow = getRow(result.rows, 'expense');
    const baseRevenue = getRow(baseline, 'revenue');
    const baseExpense = getRow(baseline, 'expense');

    // Cumulative delta: revenue credits +$1000 (from prior test), expense debits +$600
    // Net income delta = revenue credit delta - expense debit delta = 1000 - 600 = 400
    expect(delta(revenueRow.credit_total_cad, baseRevenue.credit_total_cad)).toBe('1000.0000');
    expect(delta(expenseRow.debit_total_cad, baseExpense.debit_total_cad)).toBe('600.0000');
  });

  it('reversals net to zero (Q21 decision: a)', async () => {
    // Post a $250 revenue entry, then reverse it.
    const original = await postEntry([
      { account_id: cashAccountId, debit_amount: '250.0000', credit_amount: '0.0000' },
      { account_id: revenueAccountId, debit_amount: '0.0000', credit_amount: '250.0000' },
    ]);

    // Post the reversal: mirror with debits/credits swapped
    await withInvariants(
      journalEntryService.post,
      { action: 'journal_entry.post' },
    )(
      {
        org_id: SEED.ORG_HOLDING,
        fiscal_period_id: periodId,
        entry_date: new Date().toISOString().slice(0, 10),
        description: 'Reversal of P&L test entry',
        source: 'manual' as const,
        reverses_journal_entry_id: original.journal_entry_id,
        reversal_reason: 'Testing Q21 reversal netting',
        lines: [
          {
            account_id: cashAccountId,
            debit_amount: '0.0000',
            credit_amount: '250.0000',
            currency: 'CAD',
            amount_original: '250.0000',
            amount_cad: '250.0000',
            fx_rate: '1.00000000',
          },
          {
            account_id: revenueAccountId,
            debit_amount: '250.0000',
            credit_amount: '0.0000',
            currency: 'CAD',
            amount_original: '250.0000',
            amount_cad: '250.0000',
            fx_rate: '1.00000000',
          },
        ],
      },
      freshCtx(),
    );

    const result = await reportService.profitAndLoss(
      { org_id: SEED.ORG_HOLDING, fiscal_period_id: periodId },
      freshCtx(),
    );

    const revenueRow = getRow(result.rows, 'revenue');
    const baseRevenue = getRow(baseline, 'revenue');

    // Hand-calculated cumulative deltas from all tests in this file:
    // Test 2: +$1000 credit to revenue
    // Test 4: +$250 credit (original) AND +$250 debit (reversal) — nets to zero
    // Total revenue credit delta = $1000 + $250 = $1250
    // Total revenue debit delta = $250
    // Effective revenue delta = $1250 - $250 = $1000 (reversal cancelled out)
    expect(delta(revenueRow.credit_total_cad, baseRevenue.credit_total_cad)).toBe('1250.0000');
    expect(delta(revenueRow.debit_total_cad, baseRevenue.debit_total_cad)).toBe('250.0000');
  });
});
