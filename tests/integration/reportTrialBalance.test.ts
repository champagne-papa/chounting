// tests/integration/reportTrialBalance.test.ts
// Integration tests for reportService.trialBalance with hand-calculated
// assertions. Verifies per-account aggregation, LEFT JOIN zero-balance
// inclusion, and footer balance equality.
// Phase 16A — correctness backbone for Trial Balance.

import { describe, it, expect, beforeAll } from 'vitest';
import { adminClient, SEED } from '../setup/testDb';
import { withInvariants } from '@/services/middleware/withInvariants';
import { journalEntryService } from '@/services/accounting/journalEntryService';
import { reportService, type TrialBalanceRow } from '@/services/reporting/reportService';
import type { ServiceContext } from '@/services/middleware/serviceContext';
import Decimal from 'decimal.js';

describe('Trial Balance report aggregation', () => {
  const db = adminClient();

  let cashAccountId: string;     // 1000 — asset
  let revenueAccountId: string;  // 4000 — revenue (Dividend Income)
  let expenseAccountId: string;  // 5000 — expense (Professional Fees)
  let periodId: string;

  // Baseline Trial Balance captured before this test's entries
  let baseline: TrialBalanceRow[];

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

  function getAccountRow(rows: TrialBalanceRow[], code: string): TrialBalanceRow {
    return rows.find((r) => r.account_code === code)!;
  }

  function delta(current: string, base: string): string {
    return new Decimal(current).minus(new Decimal(base)).toFixed(4);
  }

  /** Sum a MoneyAmount field across all rows. */
  function sumField(rows: TrialBalanceRow[], field: 'debit_total_cad' | 'credit_total_cad'): string {
    return rows.reduce(
      (acc, row) => acc.plus(new Decimal(row[field])),
      new Decimal(0),
    ).toFixed(4);
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

    const baseResult = await reportService.trialBalance(
      { org_id: SEED.ORG_HOLDING, fiscal_period_id: periodId },
      freshCtx(),
    );
    baseline = baseResult.rows;
  });

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
        description: 'Trial Balance test entry',
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

  it('returns all 16 holding company accounts (including zero-balance)', async () => {
    const result = await reportService.trialBalance(
      { org_id: SEED.ORG_HOLDING, fiscal_period_id: periodId },
      freshCtx(),
    );

    // Holding company has 16 accounts in the seed CoA
    expect(result.rows).toHaveLength(16);

    // Ordered by account_code
    const codes = result.rows.map((r) => r.account_code);
    const sorted = [...codes].sort();
    expect(codes).toEqual(sorted);
  });

  it('footer totals balance (total debits = total credits)', async () => {
    const result = await reportService.trialBalance(
      { org_id: SEED.ORG_HOLDING, fiscal_period_id: periodId },
      freshCtx(),
    );

    const totalDebits = sumField(result.rows, 'debit_total_cad');
    const totalCredits = sumField(result.rows, 'credit_total_cad');

    expect(totalDebits).toBe(totalCredits);
  });

  it('correctly reflects a balanced entry in per-account totals', async () => {
    // Post: debit Cash $800, credit Revenue $800
    await postEntry([
      { account_id: cashAccountId, debit_amount: '800.0000', credit_amount: '0.0000' },
      { account_id: revenueAccountId, debit_amount: '0.0000', credit_amount: '800.0000' },
    ]);

    const result = await reportService.trialBalance(
      { org_id: SEED.ORG_HOLDING, fiscal_period_id: periodId },
      freshCtx(),
    );

    const cashRow = getAccountRow(result.rows, '1000');
    const revenueRow = getAccountRow(result.rows, '4000');
    const baseCash = getAccountRow(baseline, '1000');
    const baseRevenue = getAccountRow(baseline, '4000');

    // Cash (1000) got +$800 debit
    expect(delta(cashRow.debit_total_cad, baseCash.debit_total_cad)).toBe('800.0000');

    // Revenue (4000) got +$800 credit
    expect(delta(revenueRow.credit_total_cad, baseRevenue.credit_total_cad)).toBe('800.0000');

    // Footer must still balance
    const totalDebits = sumField(result.rows, 'debit_total_cad');
    const totalCredits = sumField(result.rows, 'credit_total_cad');
    expect(totalDebits).toBe(totalCredits);
  });

  it('zero-balance accounts appear with zero totals', async () => {
    const result = await reportService.trialBalance(
      { org_id: SEED.ORG_HOLDING, fiscal_period_id: periodId },
      freshCtx(),
    );

    // Account 2200 (Accrued Liabilities) has no entries posted to it
    const accruedRow = getAccountRow(result.rows, '2200');
    expect(accruedRow).toBeDefined();
    expect(accruedRow.debit_total_cad).toBe('0.0000');
    expect(accruedRow.credit_total_cad).toBe('0.0000');
  });
});
