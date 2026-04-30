// src/services/reporting/reportService.ts
// Read-only report aggregation functions. Calls RPC functions defined in
// migration 0007. All read functions wrap through withInvariants at their export sites (S29a).

import { adminClient } from '@/db/adminClient';
import type { ServiceContext } from '@/services/middleware/serviceContext';
import { ServiceError } from '@/services/errors/ServiceError';
import { loggerWith } from '@/shared/logger/pino';
import {
  addMoney,
  eqMoney,
  subtractMoney,
  toMoneyAmount,
  zeroMoney,
  type MoneyAmount,
} from '@/shared/schemas/accounting/money.schema';
import { withInvariants } from '@/services/middleware/withInvariants';

// -- P&L types ---------------------------------------------------------------

export interface PLRow {
  account_type: string;
  debit_total_cad: MoneyAmount;
  credit_total_cad: MoneyAmount;
}

export interface ProfitAndLossResult {
  rows: PLRow[];
}

// -- Trial Balance types -----------------------------------------------------

export interface TrialBalanceRow {
  account_id: string;
  account_code: string;
  account_name: string;
  account_type: string;
  debit_total_cad: MoneyAmount;
  credit_total_cad: MoneyAmount;
}

export interface TrialBalanceResult {
  rows: TrialBalanceRow[];
}

// -- Balance Sheet types -----------------------------------------------------

/**
 * Flattened shape of the 4-row Balance Sheet per brief §3.1. All
 * four amount fields are pre-flipped by the RPC per account type,
 * so they are naturally positive for normal-balance activity. Do
 * not apply a second sign flip at the caller.
 *
 * Equation check: assets == liabilities + equity_base + current_earnings.
 * Enforced at the view layer (red banner on mismatch) rather than
 * the service — Balance Sheet is not promoted to a discipline
 * backstop per brief §6.
 */
export interface BalanceSheetResult {
  assets: MoneyAmount;
  liabilities: MoneyAmount;
  equity_base: MoneyAmount;
  current_earnings: MoneyAmount;
  as_of_date: string; // echoed back for client display
}

// -- Accounts-by-type types --------------------------------------------------

/**
 * One row per account of the requested account_type, with debit
 * and credit totals across the period (or all periods when
 * fiscal_period_id is null). Shape mirrors TrialBalanceRow minus
 * account_type (already filtered by the query) and plus nothing.
 *
 * Sign convention: RPC returns debit_total_cad and credit_total_cad
 * as separate columns, NOT pre-flipped. The consumer
 * (AccountsByTypeView) renders both columns TB-style. This
 * asymmetry with get_balance_sheet's pre-flipped single-total shape
 * was ratified in Step 8a's migration header (brief §4 Step 8):
 * shape follows the consumer. AccountsByTypeView needs two columns;
 * BalanceSheetView needs four scalars.
 */
export interface AccountsByTypeRow {
  account_id: string;
  account_code: string;
  account_name: string;
  debit_total_cad: MoneyAmount;
  credit_total_cad: MoneyAmount;
}

export interface AccountsByTypeResult {
  rows: AccountsByTypeRow[];
}

// -- Pure helpers exported for unit-style tests ------------------------------
//
// Extracted from trialBalance()'s footer-check so the UNBALANCED contract is
// unit-testable without mocking the Supabase client or the pino logger. The
// glue between these helpers and the service (log.error + throw) is ~4 lines
// and is enforced by TypeScript plus code review; the helpers themselves
// carry the alerting-contract test guard.

export interface FooterTotals {
  totalDebit: MoneyAmount;
  totalCredit: MoneyAmount;
  delta: MoneyAmount; // signed: totalDebit - totalCredit
  balanced: boolean;  // eqMoney(totalDebit, totalCredit)
}

/**
 * Sums debit and credit totals across trial-balance rows and reports whether
 * they balance. Pure — no side effects, deterministic on the row array.
 *
 * `delta` is signed (`totalDebit - totalCredit`) so the direction of
 * imbalance survives into downstream log / error shapes as a triage signal
 * for on-call engineers. A positive delta means debits exceed credits; a
 * negative delta means credits exceed debits.
 */
export function computeTrialBalanceFooter(rows: TrialBalanceRow[]): FooterTotals {
  let totalDebit: MoneyAmount = zeroMoney();
  let totalCredit: MoneyAmount = zeroMoney();
  for (const row of rows) {
    totalDebit = addMoney(totalDebit, row.debit_total_cad);
    totalCredit = addMoney(totalCredit, row.credit_total_cad);
  }
  const delta = subtractMoney(totalDebit, totalCredit);
  return {
    totalDebit,
    totalCredit,
    delta,
    balanced: eqMoney(totalDebit, totalCredit),
  };
}

/**
 * Exact shape of the structured pino log fields emitted on the UNBALANCED
 * throw path. The `incident_type` literal is load-bearing for alerting
 * routing (pino consumers filter on it to separate integrity incidents from
 * normal 422 errors); TypeScript's literal type plus the unit test on
 * buildUnbalancedLogFields guard the contract against silent drift.
 *
 * See docs/09_briefs/phase-1.1/control-foundations-brief.md §9.
 */
export interface UnbalancedLogFields {
  incident_type: 'ledger_integrity';
  org_id: string;
  fiscal_period_id: string | null;
  total_debit: MoneyAmount;
  total_credit: MoneyAmount;
  delta: MoneyAmount;
}

export function buildUnbalancedLogFields(
  input: { org_id: string; fiscal_period_id?: string | null },
  footer: FooterTotals,
): UnbalancedLogFields {
  return {
    incident_type: 'ledger_integrity',
    org_id: input.org_id,
    fiscal_period_id: input.fiscal_period_id ?? null,
    total_debit: footer.totalDebit,
    total_credit: footer.totalCredit,
    delta: footer.delta,
  };
}

// -- Service -----------------------------------------------------------------

export const reportService = {
  /**
   * P&L aggregation grouped by account_type. Returns 5 rows
   * (asset, liability, equity, revenue, expense) with debit/credit
   * totals in CAD. Net income = revenue.credit - expense.debit,
   * computed by the caller.
   */
  profitAndLoss: withInvariants(async (
    input: { org_id: string; fiscal_period_id?: string | null },
    ctx: ServiceContext,
  ): Promise<ProfitAndLossResult> => {
    const log = loggerWith({ trace_id: ctx.trace_id, user_id: ctx.caller.user_id });
    const db = adminClient();

    const { data, error } = await db.rpc('get_profit_and_loss', {
      p_org_id: input.org_id,
      p_period_id: input.fiscal_period_id ?? null,
    });

    if (error) {
      log.error({ error }, 'Failed to call get_profit_and_loss RPC');
      throw new ServiceError('READ_FAILED', error.message);
    }

    // Coerce numeric values to MoneyAmount strings at the service boundary.
    // Postgres NUMERIC comes through as JS number via the Supabase driver
    // (Phase 15B lesson — never trust the driver to preserve string precision).
    const rows: PLRow[] = (data ?? []).map((row: Record<string, unknown>) => ({
      account_type: row.account_type as string,
      debit_total_cad: toMoneyAmount(row.debit_total_cad as string | number),
      credit_total_cad: toMoneyAmount(row.credit_total_cad as string | number),
    }));

    return { rows };
  }),

  /**
   * Trial Balance: per-account debit/credit totals. Includes zero-balance
   * accounts (LEFT JOIN in the RPC). Footer totals (sum of all debits,
   * sum of all credits) must be equal — inequality is a bug signal.
   */
  trialBalance: withInvariants(async (
    input: { org_id: string; fiscal_period_id?: string | null },
    ctx: ServiceContext,
  ): Promise<TrialBalanceResult> => {
    const log = loggerWith({ trace_id: ctx.trace_id, user_id: ctx.caller.user_id });
    const db = adminClient();

    const { data, error } = await db.rpc('get_trial_balance', {
      p_org_id: input.org_id,
      p_period_id: input.fiscal_period_id ?? null,
    });

    if (error) {
      log.error({ error }, 'Failed to call get_trial_balance RPC');
      throw new ServiceError('READ_FAILED', error.message);
    }

    const rows: TrialBalanceRow[] = (data ?? []).map((row: Record<string, unknown>) => ({
      account_id: row.account_id as string,
      account_code: row.account_code as string,
      account_name: row.account_name as string,
      account_type: row.account_type as string,
      debit_total_cad: toMoneyAmount(row.debit_total_cad as string | number),
      credit_total_cad: toMoneyAmount(row.credit_total_cad as string | number),
    }));

    // --- Trial-balance footer backstop ---
    //
    // Discipline backstop for INV-LEDGER-001 (Layer 1a), not an
    // invariant itself. Non-promoted to INV-ID: the rule the
    // codebase actually cares about is debit = credit *per journal
    // entry*, enforced by the deferred constraint trigger at COMMIT.
    // The trial-balance footer equality is a theorem of that rule —
    // if every entry balances, the sum across entries also balances.
    // A failure here does not indicate a bug in trialBalance(); it
    // indicates the invariant was violated upstream and the
    // violation reached the report boundary.
    //
    // BasicTrialBalanceView.tsx performs the same check visually
    // (footerTotals.balanced, rendered in red on mismatch). This
    // service-layer throw is the defense for non-UI consumers:
    // agents calling the service directly, export jobs, external
    // reconciliation integrations, future tests — any path that
    // would otherwise render wrong totals as if they were correct.
    //
    // See the INV-LEDGER-001 leaf's "Interaction with the service
    // layer" section in docs/02_specs/ledger_truth_model.md for
    // the broader "one enforcement point per rule" discipline, and
    // docs/02_specs/invariants.md "Discipline backstops (not
    // invariants)" section for the registration of this backstop.
    const footer = computeTrialBalanceFooter(rows);
    if (!footer.balanced) {
      log.error(
        buildUnbalancedLogFields(input, footer),
        'Trial balance backstop: debits != credits — INV-LEDGER-001 (Layer 1a) violated upstream',
      );
      throw new ServiceError(
        'UNBALANCED',
        `Trial balance totals do not match: debits=${footer.totalDebit}, credits=${footer.totalCredit}, delta=${footer.delta}`,
      );
    }

    return { rows };
  }),

  /**
   * Point-in-time Balance Sheet. Returns the 4-row shape per
   * brief §3.1 flattened to named scalar fields: assets,
   * liabilities, equity_base, current_earnings (synthesized from
   * revenue/expense activity through as_of_date).
   *
   * Sign convention: the RPC pre-flips per account type, so all
   * four returned values are naturally positive for normal-balance
   * activity. Do NOT apply a second flip here or at the caller.
   * This deviates from accountBalanceService.get (Step 6), which
   * returns debit-positive with caller-flip — "entity that knows
   * the polarity does the flip." get_balance_sheet knows the type
   * directly; accountBalanceService's RPC does not.
   *
   * Inclusive-of-day (entry_date <= as_of_date). Matches
   * accountBalanceService (Step 6) and get_accounts_by_type
   * (Step 8). See brief §3.1.
   *
   * Accounting-equation check (assets == liabilities + equity_base
   * + current_earnings) lives in BasicBalanceSheetView.tsx as a
   * red-banner render on mismatch. Balance Sheet does NOT promote
   * to a discipline backstop (no service-layer throw) per brief §6.
   */
  balanceSheet: withInvariants(async (
    input: { org_id: string; as_of_date?: string | null },
    ctx: ServiceContext,
  ): Promise<BalanceSheetResult> => {
    const log = loggerWith({ trace_id: ctx.trace_id, user_id: ctx.caller.user_id });
    const db = adminClient();

    // Service-side default matches accountBalanceService +
    // reportService.profitAndLoss's `?? null` pattern. RPC has
    // no DEFAULT; service is the single owner of "today" so
    // integration tests stay deterministic.
    const asOfDate = input.as_of_date ?? new Date().toISOString().slice(0, 10);

    const { data, error } = await db.rpc('get_balance_sheet', {
      p_org_id: input.org_id,
      p_as_of_date: asOfDate,
    });

    if (error) {
      log.error({ error }, 'Failed to call get_balance_sheet RPC');
      throw new ServiceError('READ_FAILED', error.message);
    }

    // RPC returns exactly 4 rows with account_type in
    // {'asset','liability','equity','current_earnings'}. Flatten
    // to named scalar fields. toMoneyAmount coerces NUMERIC
    // (Supabase driver returns as JS number — Phase 15B).
    const rows = (data ?? []) as Array<{ account_type: string; total_cad: string | number }>;
    const byType = (t: string): MoneyAmount => {
      const row = rows.find((r) => r.account_type === t);
      return toMoneyAmount(row?.total_cad ?? 0);
    };

    return {
      assets: byType('asset'),
      liabilities: byType('liability'),
      equity_base: byType('equity'),
      current_earnings: byType('current_earnings'),
      as_of_date: asOfDate,
    };
  }),

  /**
   * Per-account totals for one account type. Returns one row per
   * chart_of_accounts entry of the requested type that has any
   * journal activity, with debit and credit totals in CAD.
   *
   * Consumed by AccountsByTypeView (Step 8b) for the P&L drill-
   * down chain: P&L row-click → accounts-by-type → account-ledger.
   *
   * Sign convention: debit/credit returned separately, NOT pre-
   * flipped. Consumer renders TB-style two columns. See the type
   * docstring above for the sign-convention-follows-consumer
   * discipline ratified in Step 8a's migration header.
   *
   * Error translation: invalid account_type values surface as
   * READ_FAILED (not a domain error) because the RPC's
   * `::account_type` cast fails at the Postgres level with
   * invalid_text_representation. This matches the other
   * reportService methods' RPC-error path. Callers that need
   * pre-validation against the enum should gate at the route or
   * orchestrator layer, not expect NOT_FOUND semantics here.
   */
  accountsByType: withInvariants(async (
    input: { org_id: string; account_type: string; fiscal_period_id?: string | null },
    ctx: ServiceContext,
  ): Promise<AccountsByTypeResult> => {
    const log = loggerWith({ trace_id: ctx.trace_id, user_id: ctx.caller.user_id });
    const db = adminClient();

    const { data, error } = await db.rpc('get_accounts_by_type', {
      p_org_id: input.org_id,
      p_account_type: input.account_type,
      p_period_id: input.fiscal_period_id ?? null,
    });

    if (error) {
      log.error({ error }, 'Failed to call get_accounts_by_type RPC');
      throw new ServiceError('READ_FAILED', error.message);
    }

    const rows: AccountsByTypeRow[] = (data ?? []).map((row: Record<string, unknown>) => ({
      account_id: row.account_id as string,
      account_code: row.account_code as string,
      account_name: row.account_name as string,
      debit_total_cad: toMoneyAmount(row.debit_total_cad as string | number),
      credit_total_cad: toMoneyAmount(row.credit_total_cad as string | number),
    }));

    return { rows };
  }),
};
