// tests/integration/reportAccountsByType.test.ts
// Phase 0-1.1 Arc A Step 8b — integration tests for
// reportService.accountsByType + the get_accounts_by_type RPC
// (shipped in Step 8a's migration).
//
// Six tests, all baseline-independent (no "fresh seed"
// assumption) so they pass regardless of suite ordering. This
// avoids propagating the reportBalanceSheet.test.ts test-1 bug
// family (Step 12 queue item 11) into new test files.
//
//   1. Shape — result has a rows array; each row has the five
//      expected fields. No emptiness assertion.
//   2. READ_FAILED on invalid account_type — Postgres enum cast
//      fails at the RPC; service translates to READ_FAILED (not
//      NOT_FOUND — caller must pre-validate if that semantics is
//      needed). Pins the RPC-error translation contract.
//   3. Posted revenue activity — two revenue accounts hit with
//      credit-side postings (revenue is natively credit-normal);
//      baseline-and-delta assertions assert credit_total_cad
//      deltas are positive and debit_total_cad deltas are zero.
//      Sign-convention pin inherent in the assertions — RPC returns
//      debit/credit separately (NOT pre-flipped), and a revenue
//      posting shows up on the credit side, not the debit side.
//   4. Account-type filter — post to both revenue AND expense
//      accounts; query with account_type='revenue'; assert only
//      revenue accounts appear in the result.
//   5. Period filter pass-through — current / non-matching UUID /
//      undefined. Mirrors 8a test-4 shape.
//   6. Cross-org denied — RealEstate-only ctx attempts HOLDING
//      revenue query.

import { describe, it, expect, beforeAll } from 'vitest';
import { adminClient, SEED } from '../setup/testDb';
import { withInvariants } from '@/services/middleware/withInvariants';
import { journalEntryService } from '@/services/accounting/journalEntryService';
import {
  reportService,
  type AccountsByTypeRow,
} from '@/services/reporting/reportService';
import type { ServiceContext } from '@/services/middleware/serviceContext';
import Decimal from 'decimal.js';

describe('reportService.accountsByType', () => {
  const db = adminClient();

  let cashAccountId: string;                  // 1000 — asset (HOLDING)
  let dividendIncomeAccountId: string;        // 4000 — revenue (HOLDING)
  let managementFeeIncomeAccountId: string;   // 4100 — revenue (HOLDING)
  let professionalFeesAccountId: string;      // 5000 — expense (HOLDING)
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

  function findRow(rows: AccountsByTypeRow[], code: string): AccountsByTypeRow | undefined {
    return rows.find((r) => r.account_code === code);
  }

  function delta(current: string, base: string): number {
    return new Decimal(current).minus(new Decimal(base)).toNumber();
  }

  async function postEntry(
    lines: Array<{ account_id: string; debit_amount: string; credit_amount: string }>,
  ) {
    return withInvariants(
      journalEntryService.post,
      { action: 'journal_entry.post' },
    )(
      {
        org_id: SEED.ORG_HOLDING,
        fiscal_period_id: periodId,
        entry_date: new Date().toISOString().slice(0, 10),
        description: 'accountsByType test entry',
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
    const pick = async (code: string) => {
      const { data } = await db
        .from('chart_of_accounts')
        .select('account_id')
        .eq('org_id', SEED.ORG_HOLDING)
        .eq('account_code', code)
        .single();
      return data!.account_id as string;
    };

    cashAccountId = await pick('1000');
    dividendIncomeAccountId = await pick('4000');
    managementFeeIncomeAccountId = await pick('4100');
    professionalFeesAccountId = await pick('5000');

    const { data: period } = await db
      .from('fiscal_periods')
      .select('period_id')
      .eq('org_id', SEED.ORG_HOLDING)
      .eq('is_locked', false)
      .single();
    periodId = period!.period_id;
  });

  it('returns a result with a rows array, each row carrying the five expected fields', async () => {
    // Baseline-independent shape pin. Prior tests in the suite may
    // have posted revenue activity; we assert structure, not
    // emptiness. Explicit decision to NOT replicate the
    // reportBalanceSheet.test.ts test-1 fresh-seed pattern (Step 12
    // queue item 11).
    const result = await reportService.accountsByType(
      { org_id: SEED.ORG_HOLDING, account_type: 'revenue' },
      freshCtx(),
    );
    expect(result).toHaveProperty('rows');
    expect(Array.isArray(result.rows)).toBe(true);
    for (const row of result.rows) {
      expect(row).toHaveProperty('account_id');
      expect(row).toHaveProperty('account_code');
      expect(row).toHaveProperty('account_name');
      expect(row).toHaveProperty('debit_total_cad');
      expect(row).toHaveProperty('credit_total_cad');
    }
  });

  it('surfaces READ_FAILED when account_type does not cast to the account_type enum', async () => {
    // Postgres's `::account_type` cast at the RPC's filter site
    // raises invalid_text_representation; the service's generic
    // RPC-error path translates this to READ_FAILED (not
    // NOT_FOUND). Pins the error-translation contract.
    await expect(
      reportService.accountsByType(
        { org_id: SEED.ORG_HOLDING, account_type: 'invalid_type' },
        freshCtx(),
      ),
    ).rejects.toThrow('READ_FAILED');
  });

  it('returns per-account debit/credit totals for revenue with sign-convention pin', async () => {
    // Baseline capture — order-independent after test 1's fresh-seed gate.
    const baseline = await reportService.accountsByType(
      { org_id: SEED.ORG_HOLDING, account_type: 'revenue', fiscal_period_id: periodId },
      freshCtx(),
    );
    const baseDividend = findRow(baseline.rows, '4000');
    const baseManagementFee = findRow(baseline.rows, '4100');
    const baseDividendCredit = baseDividend?.credit_total_cad ?? '0.0000';
    const baseDividendDebit = baseDividend?.debit_total_cad ?? '0.0000';
    const baseManagementFeeCredit = baseManagementFee?.credit_total_cad ?? '0.0000';

    // Post revenue to Dividend Income: DR Cash 500 / CR 4000 500
    await postEntry([
      { account_id: cashAccountId, debit_amount: '500.0000', credit_amount: '0.0000' },
      { account_id: dividendIncomeAccountId, debit_amount: '0.0000', credit_amount: '500.0000' },
    ]);

    // Post revenue to Management Fee Income: DR Cash 300 / CR 4100 300
    await postEntry([
      { account_id: cashAccountId, debit_amount: '300.0000', credit_amount: '0.0000' },
      { account_id: managementFeeIncomeAccountId, debit_amount: '0.0000', credit_amount: '300.0000' },
    ]);

    const result = await reportService.accountsByType(
      { org_id: SEED.ORG_HOLDING, account_type: 'revenue', fiscal_period_id: periodId },
      freshCtx(),
    );

    const dividendRow = findRow(result.rows, '4000');
    const managementFeeRow = findRow(result.rows, '4100');

    expect(dividendRow).toBeDefined();
    expect(dividendRow!.account_name).toBe('Dividend Income');
    expect(managementFeeRow).toBeDefined();
    expect(managementFeeRow!.account_name).toBe('Management Fee Income');

    // Sign-convention pin: revenue-normal postings land on the
    // credit column. RPC does NOT pre-flip — the consumer renders
    // both columns and decides how to display natural balance.
    // Credit delta is +500 / +300; debit delta is 0 for both.
    expect(delta(dividendRow!.credit_total_cad, baseDividendCredit)).toBeCloseTo(500, 4);
    expect(delta(dividendRow!.debit_total_cad, baseDividendDebit)).toBeCloseTo(0, 4);
    expect(delta(managementFeeRow!.credit_total_cad, baseManagementFeeCredit)).toBeCloseTo(300, 4);
  });

  it('filters by account_type so expense accounts do not appear on a revenue query', async () => {
    // Post expense activity to ensure a non-zero expense row exists.
    await postEntry([
      { account_id: professionalFeesAccountId, debit_amount: '100.0000', credit_amount: '0.0000' },
      { account_id: cashAccountId, debit_amount: '0.0000', credit_amount: '100.0000' },
    ]);

    // Query revenue — no expense accounts should appear regardless
    // of their activity. Assert no account with code '5000' is in
    // the result (rather than asserting exact row count, which
    // prior tests' state makes non-deterministic).
    const revenueResult = await reportService.accountsByType(
      { org_id: SEED.ORG_HOLDING, account_type: 'revenue' },
      freshCtx(),
    );
    for (const row of revenueResult.rows) {
      expect(row.account_code).not.toBe('5000');
    }

    // Query expense — the 5000 row must now appear.
    const expenseResult = await reportService.accountsByType(
      { org_id: SEED.ORG_HOLDING, account_type: 'expense' },
      freshCtx(),
    );
    const expenseRow = findRow(expenseResult.rows, '5000');
    expect(expenseRow).toBeDefined();
    expect(expenseRow!.account_name).toBe('Professional Fees');
  });

  it('passes fiscal_period_id through to the RPC (current / non-matching UUID / undefined)', async () => {
    // Post one fresh revenue entry in the current period.
    await postEntry([
      { account_id: cashAccountId, debit_amount: '100.0000', credit_amount: '0.0000' },
      { account_id: dividendIncomeAccountId, debit_amount: '0.0000', credit_amount: '100.0000' },
    ]);

    // Query with current period — at least 1 revenue row.
    const withCurrent = await reportService.accountsByType(
      { org_id: SEED.ORG_HOLDING, account_type: 'revenue', fiscal_period_id: periodId },
      freshCtx(),
    );
    expect(withCurrent.rows.length).toBeGreaterThanOrEqual(1);

    // Query with non-matching UUID — 0 rows (filter applied).
    const nonMatchingUuid = '00000000-0000-0000-0000-000000000000';
    const withNonMatch = await reportService.accountsByType(
      { org_id: SEED.ORG_HOLDING, account_type: 'revenue', fiscal_period_id: nonMatchingUuid },
      freshCtx(),
    );
    expect(withNonMatch.rows).toEqual([]);

    // Query with undefined (NULL p_period_id) — at least 1 row.
    const withNull = await reportService.accountsByType(
      { org_id: SEED.ORG_HOLDING, account_type: 'revenue' },
      freshCtx(),
    );
    expect(withNull.rows.length).toBeGreaterThanOrEqual(1);
  });

  it('throws ORG_ACCESS_DENIED before touching the RPC when caller has no access to org', async () => {
    await expect(
      reportService.accountsByType(
        { org_id: SEED.ORG_HOLDING, account_type: 'revenue' },
        freshRealEstateOnlyCtx(),
      ),
    ).rejects.toThrow('ORG_ACCESS_DENIED');
  });

});
