// tests/integration/accountBalanceService.test.ts
// Integration tests for accountBalanceService.get + the
// get_account_balance RPC. Five tests:
//
//   1. Balanced happy path — balance-delta via baseline-then-post
//      pattern. Pins the basic "RPC + service + coercion" contract.
//   2. Zero-balance account — no seed activity on 2200 Accrued
//      Liabilities; confirms the LEFT JOIN + COALESCE zero-row path.
//   3. Cross-org access denied — query from a ctx that does not
//      include the target org; assert service throws
//      ORG_ACCESS_DENIED BEFORE reaching the RPC.
//   4. As-of-date cutoff — two entries on different dates, one
//      query with as_of_date in the middle (strict-before), one
//      with as_of_date ON the later date (inclusive-of-day upper
//      boundary). Pins the `entry_date <= p_as_of_date` semantic
//      for Step 7 / Step 8 to reference.
//   5. Multi-currency CAD coercion — USD entry with fx_rate ≠ 1.0;
//      assert balance delta is the CAD amount, not the USD face.
//      Pins the "RPC uses amount_cad, not amount_original" contract.
//
// Baseline pattern: each mutating test captures its own baseline
// at the top of the test body, immediately before posting the
// mutation. Tests are therefore order-independent and self-
// contained — no shared beforeAll baseline, no coupling to a
// vitest sequential-execution assumption.

import { describe, it, expect, beforeAll } from 'vitest';
import { adminClient, SEED } from '../setup/testDb';
import { withInvariants } from '@/services/middleware/withInvariants';
import { journalEntryService } from '@/services/accounting/journalEntryService';
import { accountBalanceService } from '@/services/accounting/accountBalanceService';
import { subtractMoney } from '@/shared/schemas/accounting/money.schema';
import type { ServiceContext } from '@/services/middleware/serviceContext';

describe('accountBalanceService.get', () => {
  const db = adminClient();

  let cashAccountId: string;        // 1000 — asset (HOLDING)
  let revenueAccountId: string;     // 4000 — revenue (HOLDING)
  let accruedLiabsAccountId: string; // 2200 — liability, no seed activity
  let periodId: string;             // open period in HOLDING

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

  /** Ctx where the caller's org_ids do NOT include HOLDING. Used
   * only by the cross-org access-denied test. */
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

  /**
   * Posts a balanced journal entry via the full service chain
   * (withInvariants + journalEntryService.post). Each line accepts
   * optional currency/amount_cad/fx_rate overrides for the
   * multi-currency test; CAD with fx_rate=1.00000000 is the
   * default. Optional entryDate overrides "today" for the
   * as-of-date cutoff test.
   */
  async function postEntry(
    lines: Array<{
      account_id: string;
      debit_amount: string;
      credit_amount: string;
      currency?: 'CAD' | 'USD';
      amount_cad?: string;
      fx_rate?: string;
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
        description: 'accountBalanceService test entry',
        source: 'manual' as const,
        lines: lines.map((l) => {
          const currency = l.currency ?? 'CAD';
          const nonZero = l.debit_amount === '0.0000' ? l.credit_amount : l.debit_amount;
          return {
            account_id: l.account_id,
            debit_amount: l.debit_amount,
            credit_amount: l.credit_amount,
            currency,
            amount_original: nonZero,
            amount_cad: l.amount_cad ?? nonZero,
            fx_rate: l.fx_rate ?? '1.00000000',
          };
        }),
      },
      freshCtx(),
    );
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

    const { data: accrued } = await db
      .from('chart_of_accounts')
      .select('account_id')
      .eq('org_id', SEED.ORG_HOLDING)
      .eq('account_code', '2200')
      .single();

    const { data: period } = await db
      .from('fiscal_periods')
      .select('period_id')
      .eq('org_id', SEED.ORG_HOLDING)
      .eq('is_locked', false)
      .single();

    cashAccountId = cash!.account_id;
    revenueAccountId = revenue!.account_id;
    accruedLiabsAccountId = accrued!.account_id;
    periodId = period!.period_id;
  });

  it('reflects a balanced entry as a positive delta on the debit-side account', async () => {
    const { balance_cad: baseline } = await accountBalanceService.get(
      { org_id: SEED.ORG_HOLDING, account_id: cashAccountId },
      freshCtx(),
    );

    await postEntry([
      { account_id: cashAccountId, debit_amount: '800.0000', credit_amount: '0.0000' },
      { account_id: revenueAccountId, debit_amount: '0.0000', credit_amount: '800.0000' },
    ]);

    const { balance_cad: after } = await accountBalanceService.get(
      { org_id: SEED.ORG_HOLDING, account_id: cashAccountId },
      freshCtx(),
    );

    expect(subtractMoney(after, baseline)).toBe('800.0000');
  });

  it('returns 0.0000 for an account with no journal activity', async () => {
    const { balance_cad } = await accountBalanceService.get(
      { org_id: SEED.ORG_HOLDING, account_id: accruedLiabsAccountId },
      freshCtx(),
    );

    expect(balance_cad).toBe('0.0000');
  });

  it('throws ORG_ACCESS_DENIED before touching the RPC when caller has no access to org', async () => {
    await expect(
      accountBalanceService.get(
        { org_id: SEED.ORG_HOLDING, account_id: cashAccountId },
        freshRealEstateOnlyCtx(),
      ),
    ).rejects.toThrow('ORG_ACCESS_DENIED');
  });

  it('inclusive-of-day semantic: entries on/before as_of_date are included; entries strictly after are excluded', async () => {
    // Baselines must be captured at the SAME as_of_date as the
    // later query. Capturing at "today" would include prior tests'
    // recent posts (entry_date = today) that are excluded by the
    // 2026-01-17 / 2026-01-20 queries, yielding a negative delta
    // that looks like a bug but is actually a baseline mismatch.
    // Same-date baseline + same-date query isolates the delta to
    // this test's two posted entries.
    const { balance_cad: baselineAt17 } = await accountBalanceService.get(
      { org_id: SEED.ORG_HOLDING, account_id: cashAccountId, as_of_date: '2026-01-17' },
      freshCtx(),
    );
    const { balance_cad: baselineAt20 } = await accountBalanceService.get(
      { org_id: SEED.ORG_HOLDING, account_id: cashAccountId, as_of_date: '2026-01-20' },
      freshCtx(),
    );

    // Entry A on 2026-01-15: DR Cash 100 / CR Revenue 100
    await postEntry(
      [
        { account_id: cashAccountId, debit_amount: '100.0000', credit_amount: '0.0000' },
        { account_id: revenueAccountId, debit_amount: '0.0000', credit_amount: '100.0000' },
      ],
      '2026-01-15',
    );

    // Entry B on 2026-01-20: DR Cash 200 / CR Revenue 200
    await postEntry(
      [
        { account_id: cashAccountId, debit_amount: '200.0000', credit_amount: '0.0000' },
        { account_id: revenueAccountId, debit_amount: '0.0000', credit_amount: '200.0000' },
      ],
      '2026-01-20',
    );

    // Strict-before upper bound — as_of_date 2026-01-17 includes
    // A (2026-01-15) but excludes B (2026-01-20).
    const { balance_cad: asOf17 } = await accountBalanceService.get(
      { org_id: SEED.ORG_HOLDING, account_id: cashAccountId, as_of_date: '2026-01-17' },
      freshCtx(),
    );
    expect(subtractMoney(asOf17, baselineAt17)).toBe('100.0000');

    // Inclusive-of-day upper boundary — as_of_date 2026-01-20
    // includes both A and B (entry_date <= p_as_of_date).
    const { balance_cad: asOf20 } = await accountBalanceService.get(
      { org_id: SEED.ORG_HOLDING, account_id: cashAccountId, as_of_date: '2026-01-20' },
      freshCtx(),
    );
    expect(subtractMoney(asOf20, baselineAt20)).toBe('300.0000');
  });

  it('uses amount_cad (not amount_original) for the sum — multi-currency correctness', async () => {
    const { balance_cad: baseline } = await accountBalanceService.get(
      { org_id: SEED.ORG_HOLDING, account_id: cashAccountId },
      freshCtx(),
    );

    // USD entry: $1000 USD @ 1.35 = $1350 CAD. DR Cash / CR Revenue.
    await postEntry([
      {
        account_id: cashAccountId,
        debit_amount: '1000.0000',
        credit_amount: '0.0000',
        currency: 'USD',
        amount_cad: '1350.0000',
        fx_rate: '1.35000000',
      },
      {
        account_id: revenueAccountId,
        debit_amount: '0.0000',
        credit_amount: '1000.0000',
        currency: 'USD',
        amount_cad: '1350.0000',
        fx_rate: '1.35000000',
      },
    ]);

    const { balance_cad: after } = await accountBalanceService.get(
      { org_id: SEED.ORG_HOLDING, account_id: cashAccountId },
      freshCtx(),
    );

    // Delta must be 1350 (CAD equivalent), not 1000 (USD face).
    expect(subtractMoney(after, baseline)).toBe('1350.0000');
  });
});
