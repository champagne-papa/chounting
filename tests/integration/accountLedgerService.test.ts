// tests/integration/accountLedgerService.test.ts
// Phase 0-1.1 Arc A Step 8a — integration tests for
// accountLedgerService.get + the get_account_ledger RPC.
//
// Six tests:
//
//   1. Shape + empty-seed behavior — Cash account, fresh seed,
//      0 rows + correct CoA metadata. Order-sensitive against
//      the suite (assumes test 1 runs first against a fresh
//      seed; tests 3-6 use baseline-and-delta to be order-
//      independent).
//   2. NOT_FOUND on bogus account_id (distinct ergonomic from
//      accountBalanceService's return-zero — ledger needs
//      metadata that doesn't exist for a phantom account).
//   3. Posted activity + running-balance correctness — three
//      ascending-date entries on Investments in Subsidiaries;
//      baseline-relative delta assertions.
//   4. Period filter (shape + pass-through only) — current
//      period / non-matching UUID / undefined. Multi-period
//      coverage deferred to 8b when accounts_by_type tests can
//      amortize the unlock/lock fixture.
//   5. Cross-org access denied — RealEstate-only ctx attempts
//      a HOLDING ledger query.
//   6. Sign-convention pin — credit-only entry on Intercompany
//      Receivables; running_balance delta must be -500 (debit-
//      positive convention; caller flips for natural balance
//      when presenting liabilities or contra-assets).
//
// Tests 3 and 6 migrated off Cash (1000) / Accounts Payable (2000)
// at Item 27 resolution. Those seed accounts are promiscuously
// shared across test files, and window-function-computed
// running_balance at historical dates interleaves with other
// files' posts under full-suite sequential execution. Tests 3/6
// now use 1100 Investments in Subsidiaries and 1200 Intercompany
// Receivables respectively — both HOLDING asset accounts with
// zero hits in other test files. Debit-positive running_balance
// semantics apply uniformly across account types, so test 6's
// sign-convention pin still exercises the same RPC behavior on
// an asset that a credit-on-liability would.
//
// Baseline pattern: per-test baseline capture at the top of each
// mutating test body. Order-independent for tests 3-6, no shared
// beforeAll baseline.

import { describe, it, expect, beforeAll } from 'vitest';
import { adminClient, SEED } from '../setup/testDb';
import { withInvariants } from '@/services/middleware/withInvariants';
import { journalEntryService } from '@/services/accounting/journalEntryService';
import { accountLedgerService } from '@/services/reporting/accountLedgerService';
import type { ServiceContext } from '@/services/middleware/serviceContext';

describe('accountLedgerService.get', () => {
  const db = adminClient();

  let cashAccountId: string;                    // 1000 — asset (HOLDING)
  let shareCapitalAccountId: string;            // 3000 — equity (HOLDING)
  let accountsPayableAccountId: string;         // 2000 — liability (HOLDING)
  let professionalFeesAccountId: string;        // 5000 — expense (HOLDING)
  let investmentsAccountId: string;             // 1100 — asset (HOLDING; clean — used only here)
  let intercompanyReceivablesAccountId: string; // 1200 — asset (HOLDING; clean — used only here)
  let currentPeriodId: string;                  // open period in HOLDING

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

  /** Ctx where the caller's org_ids do NOT include HOLDING. */
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
        fiscal_period_id: currentPeriodId,
        entry_date: entryDate ?? new Date().toISOString().slice(0, 10),
        description: 'accountLedgerService test entry',
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
      .from('chart_of_accounts')
      .select('account_id')
      .eq('org_id', SEED.ORG_HOLDING)
      .eq('account_code', '1000')
      .single();

    const { data: shareCapital } = await db
      .from('chart_of_accounts')
      .select('account_id')
      .eq('org_id', SEED.ORG_HOLDING)
      .eq('account_code', '3000')
      .single();

    const { data: ap } = await db
      .from('chart_of_accounts')
      .select('account_id')
      .eq('org_id', SEED.ORG_HOLDING)
      .eq('account_code', '2000')
      .single();

    const { data: profFees } = await db
      .from('chart_of_accounts')
      .select('account_id')
      .eq('org_id', SEED.ORG_HOLDING)
      .eq('account_code', '5000')
      .single();

    // Clean accounts for tests 3 and 6 — Item 27 migration. These
    // two codes have zero hits in other test files, so the
    // running_balance window function doesn't interleave with
    // historical-dated activity from other suites.
    const { data: investments } = await db
      .from('chart_of_accounts')
      .select('account_id')
      .eq('org_id', SEED.ORG_HOLDING)
      .eq('account_code', '1100')
      .single();

    const { data: intercompanyReceivables } = await db
      .from('chart_of_accounts')
      .select('account_id')
      .eq('org_id', SEED.ORG_HOLDING)
      .eq('account_code', '1200')
      .single();

    const { data: period } = await db
      .from('fiscal_periods')
      .select('period_id')
      .eq('org_id', SEED.ORG_HOLDING)
      .eq('is_locked', false)
      .single();

    cashAccountId = cash!.account_id;
    shareCapitalAccountId = shareCapital!.account_id;
    accountsPayableAccountId = ap!.account_id;
    professionalFeesAccountId = profFees!.account_id;
    investmentsAccountId = investments!.account_id;
    intercompanyReceivablesAccountId = intercompanyReceivables!.account_id;
    currentPeriodId = period!.period_id;
  });

  it('returns well-shaped result with correct CoA metadata for Cash', async () => {
    const result = await accountLedgerService.get(
      { org_id: SEED.ORG_HOLDING, account_id: cashAccountId },
      freshCtx(),
    );

    // Shape + metadata pin. Order-independent — prior suites may
    // post to Cash with today's dates, so row count is not
    // asserted. The load-bearing checks are: (a) rows is an
    // array (RPC returned a flattened list), (b) CoA metadata
    // survives the JOIN untouched. Tests 3-6 cover running-
    // balance behavior against specific row content via
    // baseline-and-delta assertions.
    expect(Array.isArray(result.rows)).toBe(true);
    expect(result.account.code).toBe('1000');
    expect(result.account.name).toBe('Cash and Cash Equivalents');
    expect(result.account.type).toBe('asset');
  });

  it('throws NOT_FOUND for a bogus account_id', async () => {
    const bogusId = '00000000-0000-0000-0000-deadbeefcafe';
    await expect(
      accountLedgerService.get(
        { org_id: SEED.ORG_HOLDING, account_id: bogusId },
        freshCtx(),
      ),
    ).rejects.toThrow('NOT_FOUND');
  });

  it('returns ordered rows with correct running-balance for three ascending-date entries on Investments in Subsidiaries', async () => {
    // Baseline: capture current Investments running balance
    // (expected 0 — no other test file posts to account 1100 —
    // but the baseline-and-delta shape is kept for robustness).
    // Assert deltas against baseline so the test is order-
    // independent.
    const baseline = await accountLedgerService.get(
      { org_id: SEED.ORG_HOLDING, account_id: investmentsAccountId, fiscal_period_id: currentPeriodId },
      freshCtx(),
    );
    const base = baseline.rows.length > 0
      ? parseFloat(baseline.rows[baseline.rows.length - 1].running_balance)
      : 0;

    // Entry 1 (2026-01-10): DR Investments 500 / CR Share Capital 500
    await postEntry([
      { account_id: investmentsAccountId, debit_amount: '500.0000', credit_amount: '0.0000' },
      { account_id: shareCapitalAccountId, debit_amount: '0.0000', credit_amount: '500.0000' },
    ], '2026-01-10');

    // Entry 2 (2026-01-15): DR Investments 300 / CR Share Capital 300
    await postEntry([
      { account_id: investmentsAccountId, debit_amount: '300.0000', credit_amount: '0.0000' },
      { account_id: shareCapitalAccountId, debit_amount: '0.0000', credit_amount: '300.0000' },
    ], '2026-01-15');

    // Entry 3 (2026-01-20): DR Professional Fees 200 / CR Investments 200
    await postEntry([
      { account_id: professionalFeesAccountId, debit_amount: '200.0000', credit_amount: '0.0000' },
      { account_id: investmentsAccountId, debit_amount: '0.0000', credit_amount: '200.0000' },
    ], '2026-01-20');

    const result = await accountLedgerService.get(
      { org_id: SEED.ORG_HOLDING, account_id: investmentsAccountId, fiscal_period_id: currentPeriodId },
      freshCtx(),
    );

    // Find the three new rows by date + amount. Other tests
    // posting "today" dates could interleave; filter to the
    // test-injected dates.
    const e1 = result.rows.find((r) => r.entry_date === '2026-01-10' && r.debit_amount === '500.0000');
    const e2 = result.rows.find((r) => r.entry_date === '2026-01-15' && r.debit_amount === '300.0000');
    const e3 = result.rows.find((r) => r.entry_date === '2026-01-20' && r.credit_amount === '200.0000');

    expect(e1).toBeDefined();
    expect(e2).toBeDefined();
    expect(e3).toBeDefined();

    // Running-balance deltas relative to baseline. Because the
    // three entries are dated 2026-01-10/15/20 and other entries
    // posted with "today" dates are 2026-04-XX, the three test
    // entries occupy positions ordered before today-dated
    // entries. The deltas at e1/e2/e3 are baseline + cumulative.
    expect(parseFloat(e1!.running_balance) - base).toBeCloseTo(500, 4);
    expect(parseFloat(e2!.running_balance) - base).toBeCloseTo(800, 4);
    expect(parseFloat(e3!.running_balance) - base).toBeCloseTo(600, 4);
  });

  it('period filter shape + pass-through (multi-period coverage deferred to 8b when accounts_by_type tests can amortize the unlock/lock fixture)', async () => {
    // Post 1 Cash entry within FY Current.
    await postEntry([
      { account_id: cashAccountId, debit_amount: '100.0000', credit_amount: '0.0000' },
      { account_id: shareCapitalAccountId, debit_amount: '0.0000', credit_amount: '100.0000' },
    ]);

    // Query with current period — at least 1 row.
    const withCurrent = await accountLedgerService.get(
      { org_id: SEED.ORG_HOLDING, account_id: cashAccountId, fiscal_period_id: currentPeriodId },
      freshCtx(),
    );
    expect(withCurrent.rows.length).toBeGreaterThanOrEqual(1);

    // Query with non-matching UUID — 0 rows (filter applied).
    const nonMatchingUuid = '00000000-0000-0000-0000-000000000000';
    const withNonMatch = await accountLedgerService.get(
      { org_id: SEED.ORG_HOLDING, account_id: cashAccountId, fiscal_period_id: nonMatchingUuid },
      freshCtx(),
    );
    expect(withNonMatch.rows).toEqual([]);

    // Query with undefined (NULL p_period_id) — at least 1 row.
    const withNull = await accountLedgerService.get(
      { org_id: SEED.ORG_HOLDING, account_id: cashAccountId },
      freshCtx(),
    );
    expect(withNull.rows.length).toBeGreaterThanOrEqual(1);
  });

  it('throws ORG_ACCESS_DENIED before touching the RPC when caller has no access to org', async () => {
    await expect(
      accountLedgerService.get(
        { org_id: SEED.ORG_HOLDING, account_id: cashAccountId },
        freshRealEstateOnlyCtx(),
      ),
    ).rejects.toThrow('ORG_ACCESS_DENIED');
  });

  it('running_balance is debit-positive: credit contribution on Intercompany Receivables yields negative delta', async () => {
    const baseline = await accountLedgerService.get(
      { org_id: SEED.ORG_HOLDING, account_id: intercompanyReceivablesAccountId, fiscal_period_id: currentPeriodId },
      freshCtx(),
    );
    const baseRb = baseline.rows.length > 0
      ? parseFloat(baseline.rows[baseline.rows.length - 1].running_balance)
      : 0;

    // DR Cash 500 / CR Intercompany Receivables 500 — single
    // credit row on the ledger-target account.
    await postEntry([
      { account_id: cashAccountId, debit_amount: '500.0000', credit_amount: '0.0000' },
      { account_id: intercompanyReceivablesAccountId, debit_amount: '0.0000', credit_amount: '500.0000' },
    ]);

    const result = await accountLedgerService.get(
      { org_id: SEED.ORG_HOLDING, account_id: intercompanyReceivablesAccountId, fiscal_period_id: currentPeriodId },
      freshCtx(),
    );

    // Find the new row (today's date, 500.0000 credit, 0.0000 debit).
    const today = new Date().toISOString().slice(0, 10);
    const newRow = result.rows.find(
      (r) => r.entry_date === today && r.credit_amount === '500.0000' && r.debit_amount === '0.0000',
    );

    expect(newRow).toBeDefined();
    // Debit-positive: credit on any account subtracts from the
    // running balance (uniform convention across account types;
    // caller flips the sign for natural-balance presentation of
    // liabilities and contra-assets). Delta from baseline must
    // be -500.
    expect(parseFloat(newRow!.running_balance) - baseRb).toBeCloseTo(-500, 4);
  });
});
