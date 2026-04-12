// src/services/accounting/chartOfAccountsService.ts
// List and get accounts for an org.

import { adminClient } from '@/db/adminClient';
import type { ServiceContext } from '@/services/middleware/serviceContext';
import { loggerWith } from '@/shared/logger/pino';

export const chartOfAccountsService = {
  /**
   * Lists all accounts in the chart of accounts for an org.
   */
  async list(
    input: { org_id: string },
    ctx: ServiceContext,
  ) {
    const log = loggerWith({ trace_id: ctx.trace_id, user_id: ctx.caller.user_id });
    const db = adminClient();

    const { data, error } = await db
      .from('chart_of_accounts')
      .select('account_id, account_code, account_name, account_type, is_intercompany_capable, is_active')
      .eq('org_id', input.org_id)
      .order('account_code');

    if (error) {
      log.error({ error }, 'Failed to list chart_of_accounts');
      throw error;
    }

    return data ?? [];
  },

  /**
   * Gets a single account by ID.
   */
  async get(
    input: { account_id: string },
    ctx: ServiceContext,
  ) {
    const log = loggerWith({ trace_id: ctx.trace_id, user_id: ctx.caller.user_id });
    const db = adminClient();

    const { data, error } = await db
      .from('chart_of_accounts')
      .select('account_id, org_id, account_code, account_name, account_type, is_intercompany_capable, is_active')
      .eq('account_id', input.account_id)
      .single();

    if (error) {
      log.error({ error }, 'Failed to get account');
      throw error;
    }

    return data;
  },
};
