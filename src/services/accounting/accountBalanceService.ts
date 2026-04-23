// src/services/accounting/accountBalanceService.ts
// Phase 0-1.1 Control Foundations Step 6 — canonical point-in-time
// account balance lookup. Wraps the get_account_balance RPC
// (20240125000000_account_balance_rpc.sql) and coerces the returned
// NUMERIC through toMoneyAmount at the service boundary.
//
// Registered as a discipline backstop in brief §6 ("Which function
// to call" convention, same category as INV-MONEY-001's decimal.js
// confinement). The invariants.md row for this backstop lands in
// Step 12's doc-sync pass, not here.

import { adminClient } from '@/db/adminClient';
import type { ServiceContext } from '@/services/middleware/serviceContext';
import { ServiceError } from '@/services/errors/ServiceError';
import { loggerWith } from '@/shared/logger/pino';
import { toMoneyAmount, type MoneyAmount } from '@/shared/schemas/accounting/money.schema';

export const accountBalanceService = {
  /**
   * Returns the point-in-time CAD balance for a single account as
   * of the given date. Inclusive-of-day semantic: entries with
   * `entry_date <= as_of_date` are included. Matches
   * `get_balance_sheet` (Step 7) and `get_accounts_by_type`
   * (Step 8). See brief §3.1.
   *
   * Debit-positive convention: the returned `balance_cad` is
   * `SUM(debit amount_cad) - SUM(credit amount_cad)`. For
   * asset/expense accounts the natural balance is positive; for
   * liability/equity/revenue accounts it is negative. Sign
   * flipping per account type is the caller's responsibility.
   *
   * Account-existence semantic: a nonexistent or cross-org
   * `account_id` returns `0.0000` via the RPC's LEFT JOIN +
   * COALESCE shape, not `NOT_FOUND`. Primary consumers
   * (Steps 7/8) drive `account_id` from a prior CoA query; the
   * typo-detection ergonomic is thin. A future session that
   * needs `NOT_FOUND` semantics can add a pre-check
   * non-breakingly.
   *
   * Reversing entries are included via aggregation (Q21 decision,
   * mirrors `get_trial_balance`). They net naturally against
   * their originals without needing an `entry_type` filter.
   *
   * @param input.as_of_date Optional. Defaults to today
   *   (UTC date via `toISOString().slice(0, 10)`). The service
   *   owns this default; the RPC has no DEFAULT so integration
   *   tests can pin deterministic dates.
   */
  async get(
    input: {
      org_id: string;
      account_id: string;
      as_of_date?: string | null;
    },
    ctx: ServiceContext,
  ): Promise<{ balance_cad: MoneyAmount }> {
    if (!ctx.caller.org_ids.includes(input.org_id)) {
      throw new ServiceError(
        'ORG_ACCESS_DENIED',
        `Caller does not have access to org_id=${input.org_id}`,
      );
    }

    const log = loggerWith({ trace_id: ctx.trace_id, user_id: ctx.caller.user_id });
    const db = adminClient();

    // Service-side default matches reportService.profitAndLoss's
    // `?? null` pattern. Keep this here — do NOT move to a DEFAULT
    // on the RPC; deterministic dates in integration tests depend
    // on the service being the single owner of "today."
    const asOfDate = input.as_of_date ?? new Date().toISOString().slice(0, 10);

    const { data, error } = await db.rpc('get_account_balance', {
      p_org_id: input.org_id,
      p_account_id: input.account_id,
      p_as_of_date: asOfDate,
    });

    if (error) {
      log.error({ error }, 'Failed to call get_account_balance RPC');
      throw new ServiceError('READ_FAILED', error.message);
    }

    // Supabase RPC on a RETURNS TABLE function returns an array of
    // rows. We always get exactly one row; read defensively. The
    // RPC's COALESCE prevents NULLs in `balance_cad`, so the `?? 0`
    // is belt-and-suspenders against an empty-array edge case.
    const raw = data?.[0]?.balance_cad ?? 0;
    return { balance_cad: toMoneyAmount(raw as string | number) };
  },
};
