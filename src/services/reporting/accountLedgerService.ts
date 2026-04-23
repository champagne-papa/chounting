// src/services/reporting/accountLedgerService.ts
// Phase 0-1.1 Control Foundations Step 8a — canonical per-account
// ledger lookup. Wraps the get_account_ledger RPC
// (20240127000000_gl_account_detail_rpcs.sql) and bundles CoA
// metadata so consumers (AccountLedgerView) don't need a second
// fetch for the header rendering.
//
// Mirrors accountBalanceService (Step 6) as a "which function to
// call" canonical service: per-account, single-entity, distinct
// from reportService's per-aggregation methods. The {rows, account}
// return shape is the documented bundling — service does the CoA
// lookup once, view consumes both pieces.
//
// Sign convention: the RPC's running_balance is debit-positive
// (SUM(amount_cad * (debit ? +1 : -1)) as a window function).
// For asset/expense accounts the natural balance is positive; for
// liability/equity/revenue it is negative. Sign flipping per
// account type is the caller's responsibility — the RPC has one
// account_id but doesn't pre-flip ("entity that knows the
// polarity does the flip" — RPC only sees one account at a time
// and bundles it without applying type-aware logic; the view's
// header displays account.type so the user has the context).
//
// Reversing entries are included via aggregation (Q21 carry-
// forward from Steps 6/7). They show as their own rows; original
// + reversal pair nets to zero in the running balance.
//
// p_period_id NULL = all periods. The service exposes
// fiscal_period_id?: string | null on the input shape; passes
// `?? null` to the RPC.
//
// NOT_FOUND vs accountBalanceService's return-zero: the ledger
// view needs CoA metadata for its header ("Ledger for 1000 — Cash
// — asset") that doesn't exist for a phantom account. Different
// ergonomic category from "balance for nonexistent account =
// 0.0000."

import { adminClient } from '@/db/adminClient';
import type { ServiceContext } from '@/services/middleware/serviceContext';
import { ServiceError } from '@/services/errors/ServiceError';
import { loggerWith } from '@/shared/logger/pino';
import { toMoneyAmount, type MoneyAmount } from '@/shared/schemas/accounting/money.schema';

export interface AccountLedgerLine {
  journal_entry_id: string;
  entry_number: number;
  entry_date: string;
  description: string;
  debit_amount: MoneyAmount;
  credit_amount: MoneyAmount;
  amount_cad: MoneyAmount;
  running_balance: MoneyAmount;
}

export interface AccountLedgerAccountInfo {
  id: string;
  code: string;
  name: string;
  type: string;
}

export interface AccountLedgerResult {
  rows: AccountLedgerLine[];
  account: AccountLedgerAccountInfo;
}

interface AccountLedgerRpcRow {
  journal_entry_id: string;
  entry_number: number;
  entry_date: string;
  description: string;
  debit_amount: string | number;
  credit_amount: string | number;
  amount_cad: string | number;
  running_balance: string | number;
}

export const accountLedgerService = {
  async get(
    input: {
      org_id: string;
      account_id: string;
      fiscal_period_id?: string | null;
    },
    ctx: ServiceContext,
  ): Promise<AccountLedgerResult> {
    if (!ctx.caller.org_ids.includes(input.org_id)) {
      throw new ServiceError(
        'ORG_ACCESS_DENIED',
        `Caller does not have access to org_id=${input.org_id}`,
      );
    }

    const log = loggerWith({ trace_id: ctx.trace_id, user_id: ctx.caller.user_id });
    const db = adminClient();

    const { data: acctRow, error: acctError } = await db
      .from('chart_of_accounts')
      .select('account_id, account_code, account_name, account_type')
      .eq('account_id', input.account_id)
      .eq('org_id', input.org_id)
      .maybeSingle();

    if (acctError) {
      log.error({ error: acctError }, 'Failed to fetch CoA metadata');
      throw new ServiceError('READ_FAILED', acctError.message);
    }
    if (!acctRow) {
      throw new ServiceError('NOT_FOUND', `Account not found: ${input.account_id}`);
    }

    const { data, error } = await db.rpc('get_account_ledger', {
      p_org_id: input.org_id,
      p_account_id: input.account_id,
      p_period_id: input.fiscal_period_id ?? null,
    });

    if (error) {
      log.error({ error }, 'Failed to call get_account_ledger RPC');
      throw new ServiceError('READ_FAILED', error.message);
    }

    const rpcRows: AccountLedgerRpcRow[] = (data ?? []) as AccountLedgerRpcRow[];
    const rows: AccountLedgerLine[] = rpcRows.map((r) => ({
      journal_entry_id: r.journal_entry_id,
      entry_number: r.entry_number,
      entry_date: r.entry_date,
      description: r.description,
      debit_amount: toMoneyAmount(r.debit_amount),
      credit_amount: toMoneyAmount(r.credit_amount),
      amount_cad: toMoneyAmount(r.amount_cad),
      running_balance: toMoneyAmount(r.running_balance),
    }));

    return {
      rows,
      account: {
        id: acctRow.account_id,
        code: acctRow.account_code,
        name: acctRow.account_name,
        type: acctRow.account_type,
      },
    };
  },
};
