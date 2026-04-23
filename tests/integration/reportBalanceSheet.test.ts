// tests/integration/reportBalanceSheet.test.ts
// Integration tests for reportService.balanceSheet + the
// get_balance_sheet RPC. Six tests:
//
//   1. 4-row return shape against fresh seed — all zeros; as_of_date
//      echo present; all four fields coerced to MoneyAmount.
//   2. Accounting equation balances against posted activity —
//      assets == liabilities + equity_base + current_earnings.
//   3. Current-earnings synthesis (the D8 in-RPC path) — revenue
//      minus expense lands in current_earnings, pre-flipped
//      positive when profitable.
//   4. Inclusive-of-day cutoff — baselines at each as_of_date the
//      query later uses; Step 6 test 4 baseline-and-filter
//      symmetry discipline.
//   5. Cross-org access denied — throws ORG_ACCESS_DENIED BEFORE
//      reaching the RPC.
//   6. Sign convention verification (D1 pin) — liability row
//      returns positive after a credit post, not negative. Locks
//      "RPC pre-flips per account type" against future
//      refactors.
//
// Per-test baseline discipline: each mutating test captures its
// own baseline at the top of the test body. No top-level beforeAll
// baseline — tests are order-independent.

import { describe, it, expect, beforeAll } from 'vitest';
import { adminClient, SEED } from '../setup/testDb';
import { withInvariants } from '@/services/middleware/withInvariants';
import { journalEntryService } from '@/services/accounting/journalEntryService';
import { reportService } from '@/services/reporting/reportService';
import {
  addMoney,
  subtractMoney,
  eqMoney,
} from '@/shared/schemas/accounting/money.schema';
import type { ServiceContext } from '@/services/middleware/serviceContext';

describe('reportService.balanceSheet', () => {
  const db = adminClient();

  let cashAccountId: string;              // 1000 — asset
  let accountsPayableAccountId: string;   // 2000 — liability
  let shareCapitalAccountId: string;      // 3000 — equity
  let dividendIncomeAccountId: string;    // 4000 — revenue
  let professionalFeesAccountId: string;  // 5000 — expense
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

  function freshRealEstateOnlyCtx(): ServiceContext {
    return {
      ...controllerCtx,
      trace_id: crypto.randomUUID(),
      caller: {
        ...controllerCtx.caller,
        org_ids: [SEED.ORG_REAL_ESTATE],
      },
    };
  }

  async function postEntry(
    lines: Array<{
      account_id: string;
      debit_amount: string;
      credit_amount: string;
    }>,
    entryDate?: string,
  ) {
    return withInvariants(
      journalEntryService.post,
      { action: 'journal_entry.post' },
    )(
      {
        org_id: SEED.ORG_HOLDING,
        fiscal_period_id: periodId,
        entry_date: entryDate ?? new Date().toISOString().slice(0, 10),
        description: 'reportBalanceSheet test entry',
        source: 'manual' as const,
        lines: lines.map((l) => {
          const nonZero = l.debit_amount === '0.0000' ? l.credit_amount : l.debit_amount;
          return {
            account_id: l.account_id,
            debit_amount: l.debit_amount,
            credit_amount: l.credit_amount,
            currency: 'CAD' as const,
            amount_original: nonZero,
            amount_cad: nonZero,
            fx_rate: '1.00000000',
          };
        }),
      },
      freshCtx(),
    );
  }

  beforeAll(async () => {
    const { data: cash } = await db
      .from('chart_of_accounts').select('account_id')
      .eq('org_id', SEED.ORG_HOLDING).eq('account_code', '1000').single();
    const { data: ap } = await db
      .from('chart_of_accounts').select('account_id')
      .eq('org_id', SEED.ORG_HOLDING).eq('account_code', '2000').single();
    const { data: shareCapital } = await db
      .from('chart_of_accounts').select('account_id')
      .eq('org_id', SEED.ORG_HOLDING).eq('account_code', '3000').single();
    const { data: dividend } = await db
      .from('chart_of_accounts').select('account_id')
      .eq('org_id', SEED.ORG_HOLDING).eq('account_code', '4000').single();
    const { data: profFees } = await db
      .from('chart_of_accounts').select('account_id')
      .eq('org_id', SEED.ORG_HOLDING).eq('account_code', '5000').single();
    const { data: period } = await db
      .from('fiscal_periods').select('period_id')
      .eq('org_id', SEED.ORG_HOLDING).eq('is_locked', false).single();

    cashAccountId = cash!.account_id;
    accountsPayableAccountId = ap!.account_id;
    shareCapitalAccountId = shareCapital!.account_id;
    dividendIncomeAccountId = dividend!.account_id;
    professionalFeesAccountId = profFees!.account_id;
    periodId = period!.period_id;
  });

  it('returns 4-row flattened shape against fresh seed (all zeros)', async () => {
    const result = await reportService.balanceSheet(
      { org_id: SEED.ORG_HOLDING },
      freshCtx(),
    );

    expect(result.assets).toBe('0.0000');
    expect(result.liabilities).toBe('0.0000');
    expect(result.equity_base).toBe('0.0000');
    expect(result.current_earnings).toBe('0.0000');
    expect(result.as_of_date).toBe(new Date().toISOString().slice(0, 10));
  });

  it('accounting equation balances after posted activity: assets == liabilities + equity_base + current_earnings', async () => {
    const baseline = await reportService.balanceSheet(
      { org_id: SEED.ORG_HOLDING },
      freshCtx(),
    );

    // DR Cash 1000 / CR Share Capital 1000 — pure balance-sheet
    // activity (asset + equity, no P&L).
    await postEntry([
      { account_id: cashAccountId, debit_amount: '1000.0000', credit_amount: '0.0000' },
      { account_id: shareCapitalAccountId, debit_amount: '0.0000', credit_amount: '1000.0000' },
    ]);

    const after = await reportService.balanceSheet(
      { org_id: SEED.ORG_HOLDING },
      freshCtx(),
    );

    // Deltas from baseline — isolates this test's post from any
    // prior-test activity in the shared DB.
    expect(subtractMoney(after.assets, baseline.assets)).toBe('1000.0000');
    expect(subtractMoney(after.equity_base, baseline.equity_base)).toBe('1000.0000');

    // Accounting equation holds end-to-end (on absolute values,
    // not deltas — the equation must hold at any point in time).
    const totalEquity = addMoney(after.equity_base, after.current_earnings);
    const rhs = addMoney(after.liabilities, totalEquity);
    expect(eqMoney(after.assets, rhs)).toBe(true);
  });

  it('synthesizes current_earnings as revenue minus expense (D8 path, pre-flipped positive when profitable)', async () => {
    const baseline = await reportService.balanceSheet(
      { org_id: SEED.ORG_HOLDING },
      freshCtx(),
    );

    // Revenue entry: DR Cash 500 / CR Dividend Income 500
    await postEntry([
      { account_id: cashAccountId, debit_amount: '500.0000', credit_amount: '0.0000' },
      { account_id: dividendIncomeAccountId, debit_amount: '0.0000', credit_amount: '500.0000' },
    ]);

    // Expense entry: DR Professional Fees 200 / CR Cash 200
    await postEntry([
      { account_id: professionalFeesAccountId, debit_amount: '200.0000', credit_amount: '0.0000' },
      { account_id: cashAccountId, debit_amount: '0.0000', credit_amount: '200.0000' },
    ]);

    const after = await reportService.balanceSheet(
      { org_id: SEED.ORG_HOLDING },
      freshCtx(),
    );

    // current_earnings delta = revenue 500 − expense 200 = 300
    expect(subtractMoney(after.current_earnings, baseline.current_earnings)).toBe('300.0000');

    // Accounting equation still holds end-to-end. Cash net delta
    // is +500 −200 = +300; current_earnings +300 matches — the
    // retained-earnings-effect of a profitable period is already
    // reflected in current_earnings without a closing entry.
    const totalEquity = addMoney(after.equity_base, after.current_earnings);
    const rhs = addMoney(after.liabilities, totalEquity);
    expect(eqMoney(after.assets, rhs)).toBe(true);
  });

  it('inclusive-of-day semantic: entries on/before as_of_date are included; entries strictly after are excluded', async () => {
    // Baselines captured at the SAME as_of_date as the later
    // query (per Step 6 test 4 baseline-and-filter symmetry
    // discipline). A baseline at "today" would include prior
    // tests' recent posts (entry_date = today) that the 2026-01-14
    // / 2026-01-15 queries exclude, producing a negative delta
    // that looks like a bug but is actually a baseline mismatch.
    const baselineAt14 = await reportService.balanceSheet(
      { org_id: SEED.ORG_HOLDING, as_of_date: '2026-01-14' },
      freshCtx(),
    );
    const baselineAt15 = await reportService.balanceSheet(
      { org_id: SEED.ORG_HOLDING, as_of_date: '2026-01-15' },
      freshCtx(),
    );

    // Post balance-sheet entry dated 2026-01-15.
    await postEntry(
      [
        { account_id: cashAccountId, debit_amount: '100.0000', credit_amount: '0.0000' },
        { account_id: shareCapitalAccountId, debit_amount: '0.0000', credit_amount: '100.0000' },
      ],
      '2026-01-15',
    );

    // Strict-before upper bound — 2026-01-14 excludes the
    // 2026-01-15 entry. Delta on assets is 0.
    const at14 = await reportService.balanceSheet(
      { org_id: SEED.ORG_HOLDING, as_of_date: '2026-01-14' },
      freshCtx(),
    );
    expect(subtractMoney(at14.assets, baselineAt14.assets)).toBe('0.0000');

    // Inclusive-of-day upper boundary — 2026-01-15 includes the
    // entry on that date.
    const at15 = await reportService.balanceSheet(
      { org_id: SEED.ORG_HOLDING, as_of_date: '2026-01-15' },
      freshCtx(),
    );
    expect(subtractMoney(at15.assets, baselineAt15.assets)).toBe('100.0000');
  });

  it('throws ORG_ACCESS_DENIED before touching the RPC when caller has no access to org', async () => {
    await expect(
      reportService.balanceSheet(
        { org_id: SEED.ORG_HOLDING },
        freshRealEstateOnlyCtx(),
      ),
    ).rejects.toThrow('ORG_ACCESS_DENIED');
  });

  it('pre-flips per account type: liability row is positive (not negative) after a credit post', async () => {
    // D1 pin: a future refactor that moves sign-flipping from
    // the RPC to the service or view would fail this assertion
    // (liability delta would come back negative since the post
    // is a pure credit on a liability account).
    const baseline = await reportService.balanceSheet(
      { org_id: SEED.ORG_HOLDING },
      freshCtx(),
    );

    // DR Cash 500 / CR Accounts Payable 500 — AP is a liability
    // with a normal credit balance.
    await postEntry([
      { account_id: cashAccountId, debit_amount: '500.0000', credit_amount: '0.0000' },
      { account_id: accountsPayableAccountId, debit_amount: '0.0000', credit_amount: '500.0000' },
    ]);

    const after = await reportService.balanceSheet(
      { org_id: SEED.ORG_HOLDING },
      freshCtx(),
    );

    // Both deltas positive — asset debit-positive, liability
    // credit-positive (pre-flipped by the RPC).
    expect(subtractMoney(after.assets, baseline.assets)).toBe('500.0000');
    expect(subtractMoney(after.liabilities, baseline.liabilities)).toBe('500.0000');
  });
});
