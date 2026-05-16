// tests/integration/accountLedgerService.test.ts
// Phase 0-1.1 Arc A Step 8a — integration tests for
// accountLedgerService.get + the get_account_ledger RPC.
//
// Six tests:
//
//   1. Shape + metadata pin — Cash account metadata survives
//      the JOIN; rows is an array. Order-independent; does
//      not assert row count or absolute-value state (post-
//      Step-12b rewrite).
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
// mutating test body. Order-independent across all tests, no
// shared beforeAll baseline.

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
    // The original assertion shape (delta-from-end-of-file-baseline)
    // conflated two properties: (a) the entry got posted, and
    // (b) the file-end running_balance shifted by the entry's
    // amount. (b) is only meaningful if this test owns the entire
    // ledger state, which it doesn't. running_balance is positional —
    // computed by a window function at query time, ordered by
    // entry_date — so past-dated entries from prior test-file runs
    // interleave at the same entry_date and shift the find()-by-
    // date-and-amount result's running_balance non-deterministically.
    //
    // The corrected assertion measures per-row CONTRIBUTION to
    // running_balance (this row's rb minus the previous row's rb in
    // the ordered result). Find by journal_entry_id (returned by the
    // post call) to identify THIS run's exact row, then measure its
    // contribution. Residue-immune by construction.
    //
    // The deeper fix — per-test disposable accounts so shared state
    // doesn't accumulate at all — is tracked as a Phase 2 retrospective
    // candidate. This change fixes the assertion's category error;
    // the refactor addresses the test-design level.

    const post1 = await postEntry([
      { account_id: investmentsAccountId, debit_amount: '500.0000', credit_amount: '0.0000' },
      { account_id: shareCapitalAccountId, debit_amount: '0.0000', credit_amount: '500.0000' },
    ], '2026-01-10');

    const post2 = await postEntry([
      { account_id: investmentsAccountId, debit_amount: '300.0000', credit_amount: '0.0000' },
      { account_id: shareCapitalAccountId, debit_amount: '0.0000', credit_amount: '300.0000' },
    ], '2026-01-15');

    const post3 = await postEntry([
      { account_id: professionalFeesAccountId, debit_amount: '200.0000', credit_amount: '0.0000' },
      { account_id: investmentsAccountId, debit_amount: '0.0000', credit_amount: '200.0000' },
    ], '2026-01-20');

    const result = await accountLedgerService.get(
      { org_id: SEED.ORG_HOLDING, account_id: investmentsAccountId, fiscal_period_id: currentPeriodId },
      freshCtx(),
    );

    const i1 = result.rows.findIndex((r) => r.journal_entry_id === post1.journal_entry_id);
    const i2 = result.rows.findIndex((r) => r.journal_entry_id === post2.journal_entry_id);
    const i3 = result.rows.findIndex((r) => r.journal_entry_id === post3.journal_entry_id);

    expect(i1).toBeGreaterThanOrEqual(0);
    expect(i2).toBeGreaterThanOrEqual(0);
    expect(i3).toBeGreaterThanOrEqual(0);

    // Per-row contribution: rb at this row minus rb at the previous
    // row in the ordered result (or 0 if this row is at position 0).
    const contrib = (idx: number) =>
      parseFloat(result.rows[idx].running_balance) -
      (idx > 0 ? parseFloat(result.rows[idx - 1].running_balance) : 0);

    expect(contrib(i1)).toBeCloseTo(500, 4);   // DR 500 → +500
    expect(contrib(i2)).toBeCloseTo(300, 4);   // DR 300 → +300
    expect(contrib(i3)).toBeCloseTo(-200, 4);  // CR 200 → -200
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
    // Same category-error correction as the Investments-in-Subsidiaries
    // test above (find-by-journal_entry_id + per-row contribution rather
    // than delta-from-end-of-file-baseline). See that comment for the
    // full rationale. Stopgap pending Phase 2 retrospective candidate
    // for disposable-accounts test isolation.

    const post = await postEntry([
      { account_id: cashAccountId, debit_amount: '500.0000', credit_amount: '0.0000' },
      { account_id: intercompanyReceivablesAccountId, debit_amount: '0.0000', credit_amount: '500.0000' },
    ]);

    const result = await accountLedgerService.get(
      { org_id: SEED.ORG_HOLDING, account_id: intercompanyReceivablesAccountId, fiscal_period_id: currentPeriodId },
      freshCtx(),
    );

    const i = result.rows.findIndex((r) => r.journal_entry_id === post.journal_entry_id);
    expect(i).toBeGreaterThanOrEqual(0);

    // Debit-positive: credit on any account subtracts from the
    // running balance (uniform convention across account types;
    // caller flips the sign for natural-balance presentation of
    // liabilities and contra-assets). Per-row contribution = this
    // row's rb minus the previous row's rb (or 0 if first in ledger).
    const contrib = parseFloat(result.rows[i].running_balance) -
      (i > 0 ? parseFloat(result.rows[i - 1].running_balance) : 0);
    expect(contrib).toBeCloseTo(-500, 4);
  });
});
