// tests/integration/reportTrialBalance.test.ts
// Integration tests for reportService.trialBalance with hand-calculated
// assertions. Verifies per-account aggregation, LEFT JOIN zero-balance
// inclusion, and footer balance equality.
// Phase 16A — correctness backbone for Trial Balance.

import { describe, it, expect, beforeAll } from 'vitest';
import { adminClient, SEED } from '../setup/testDb';
import { withInvariants } from '@/services/middleware/withInvariants';
import { journalEntryService } from '@/services/accounting/journalEntryService';
import {
  reportService,
  computeTrialBalanceFooter,
  buildUnbalancedLogFields,
  type TrialBalanceRow,
  type FooterTotals,
} from '@/services/reporting/reportService';
import type { MoneyAmount } from '@/shared/schemas/accounting/money.schema';
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

// Unit-style tests for the pure helpers extracted from reportService.trialBalance.
// These exercise the footer-check and log-shape-building logic directly with
// hand-crafted row arrays, without touching the database. Placed here rather
// than in tests/unit/ to keep the Step 5 file footprint at four files total
// and to keep helper tests adjacent to the integration tests for the service
// they support (per S8-0424-arc-A-step5 scope discipline). toEqual against
// exact expected objects is deliberate — alerting-contract tests must fail
// loudly on both missing and extra fields, not silently match a subset.

function mockRow(
  code: string,
  debit: string,
  credit: string,
): TrialBalanceRow {
  return {
    account_id: `id-${code}`,
    account_code: code,
    account_name: `Mock account ${code}`,
    account_type: 'asset',
    debit_total_cad: debit as MoneyAmount,
    credit_total_cad: credit as MoneyAmount,
  };
}

describe('computeTrialBalanceFooter (pure helper)', () => {
  it('balanced totals → balanced=true, delta=0', () => {
    const rows: TrialBalanceRow[] = [
      mockRow('1000', '100.0000', '0.0000'),
      mockRow('4000', '0.0000', '100.0000'),
    ];
    expect(computeTrialBalanceFooter(rows)).toEqual<FooterTotals>({
      totalDebit: '100.0000' as MoneyAmount,
      totalCredit: '100.0000' as MoneyAmount,
      delta: '0.0000' as MoneyAmount,
      balanced: true,
    });
  });

  it('debits > credits → balanced=false, positive delta (triage: debit side heavy)', () => {
    const rows: TrialBalanceRow[] = [
      mockRow('1000', '150.0000', '0.0000'),
      mockRow('4000', '0.0000', '100.0000'),
    ];
    expect(computeTrialBalanceFooter(rows)).toEqual<FooterTotals>({
      totalDebit: '150.0000' as MoneyAmount,
      totalCredit: '100.0000' as MoneyAmount,
      delta: '50.0000' as MoneyAmount,
      balanced: false,
    });
  });

  it('credits > debits → balanced=false, negative delta (triage: credit side heavy)', () => {
    const rows: TrialBalanceRow[] = [
      mockRow('1000', '100.0000', '0.0000'),
      mockRow('4000', '0.0000', '175.5000'),
    ];
    expect(computeTrialBalanceFooter(rows)).toEqual<FooterTotals>({
      totalDebit: '100.0000' as MoneyAmount,
      totalCredit: '175.5000' as MoneyAmount,
      delta: '-75.5000' as MoneyAmount,
      balanced: false,
    });
  });

  it('empty rows → balanced=true, both totals zero, delta=0', () => {
    expect(computeTrialBalanceFooter([])).toEqual<FooterTotals>({
      totalDebit: '0.0000' as MoneyAmount,
      totalCredit: '0.0000' as MoneyAmount,
      delta: '0.0000' as MoneyAmount,
      balanced: true,
    });
  });
});

describe('buildUnbalancedLogFields (pure helper)', () => {
  const footer: FooterTotals = {
    totalDebit: '150.0000' as MoneyAmount,
    totalCredit: '100.0000' as MoneyAmount,
    delta: '50.0000' as MoneyAmount,
    balanced: false,
  };

  it('populates every field of the alerting contract with fiscal_period_id present', () => {
    const input = {
      org_id: 'org-abc-123',
      fiscal_period_id: 'period-2026-Q2',
    };
    expect(buildUnbalancedLogFields(input, footer)).toEqual({
      incident_type: 'ledger_integrity',
      org_id: 'org-abc-123',
      fiscal_period_id: 'period-2026-Q2',
      total_debit: '150.0000' as MoneyAmount,
      total_credit: '100.0000' as MoneyAmount,
      delta: '50.0000' as MoneyAmount,
    });
  });

  it('coalesces missing fiscal_period_id to null (cross-period trial balance)', () => {
    const input = { org_id: 'org-abc-123' };
    expect(buildUnbalancedLogFields(input, footer)).toEqual({
      incident_type: 'ledger_integrity',
      org_id: 'org-abc-123',
      fiscal_period_id: null,
      total_debit: '150.0000' as MoneyAmount,
      total_credit: '100.0000' as MoneyAmount,
      delta: '50.0000' as MoneyAmount,
    });
  });
});
