// src/services/reporting/reportService.ts
// Read-only report aggregation functions. Calls RPC functions defined in
// migration 0007. No withInvariants wrapping — these are queries, not mutations.

import { adminClient } from '@/db/adminClient';
import type { ServiceContext } from '@/services/middleware/serviceContext';
import { ServiceError } from '@/services/errors/ServiceError';
import { loggerWith } from '@/shared/logger/pino';
import {
  addMoney,
  eqMoney,
  toMoneyAmount,
  zeroMoney,
  type MoneyAmount,
} from '@/shared/schemas/accounting/money.schema';

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

// -- Service -----------------------------------------------------------------

export const reportService = {
  /**
   * P&L aggregation grouped by account_type. Returns 5 rows
   * (asset, liability, equity, revenue, expense) with debit/credit
   * totals in CAD. Net income = revenue.credit - expense.debit,
   * computed by the caller.
   */
  async profitAndLoss(
    input: { org_id: string; fiscal_period_id?: string | null },
    ctx: ServiceContext,
  ): Promise<ProfitAndLossResult> {
    if (!ctx.caller.org_ids.includes(input.org_id)) {
      throw new ServiceError(
        'ORG_ACCESS_DENIED',
        `Caller does not have access to org_id=${input.org_id}`,
      );
    }

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
  },

  /**
   * Trial Balance: per-account debit/credit totals. Includes zero-balance
   * accounts (LEFT JOIN in the RPC). Footer totals (sum of all debits,
   * sum of all credits) must be equal — inequality is a bug signal.
   */
  async trialBalance(
    input: { org_id: string; fiscal_period_id?: string | null },
    ctx: ServiceContext,
  ): Promise<TrialBalanceResult> {
    if (!ctx.caller.org_ids.includes(input.org_id)) {
      throw new ServiceError(
        'ORG_ACCESS_DENIED',
        `Caller does not have access to org_id=${input.org_id}`,
      );
    }

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
    let totalDebit: MoneyAmount = zeroMoney();
    let totalCredit: MoneyAmount = zeroMoney();
    for (const row of rows) {
      totalDebit = addMoney(totalDebit, row.debit_total_cad);
      totalCredit = addMoney(totalCredit, row.credit_total_cad);
    }
    if (!eqMoney(totalDebit, totalCredit)) {
      log.error(
        {
          org_id: input.org_id,
          fiscal_period_id: input.fiscal_period_id ?? null,
          total_debit: totalDebit,
          total_credit: totalCredit,
        },
        'Trial balance backstop: debits != credits — INV-LEDGER-001 (Layer 1a) violated upstream',
      );
      throw new ServiceError(
        'UNBALANCED',
        `Trial balance totals do not match: debits=${totalDebit}, credits=${totalCredit}`,
      );
    }

    return { rows };
  },
};
