// src/services/accounting/chartOfAccountsService.ts
// List and get accounts for an org.

import { adminClient } from '@/db/adminClient';
import type { ServiceContext } from '@/services/middleware/serviceContext';
import { loggerWith } from '@/shared/logger/pino';
import { ServiceError } from '@/services/errors/ServiceError';

export const chartOfAccountsService = {
  /**
   * Lists all accounts in the chart of accounts for an org.
   */
  async list(
    input: { org_id: string },
    ctx: ServiceContext,
  ) {
    // Authorization: caller must be a member of the requested org.
    // Matches Phase 12A pattern for read functions (writes use
    // withInvariants Invariant 3 instead).
    if (!ctx.caller.org_ids.includes(input.org_id)) {
      throw new ServiceError(
        'ORG_ACCESS_DENIED',
        `Caller does not have access to org_id=${input.org_id}`,
      );
    }

    const log = loggerWith({ trace_id: ctx.trace_id, user_id: ctx.caller.user_id });
    const db = adminClient();

    const { data, error } = await db
      .from('chart_of_accounts')
      .select('account_id, account_code, account_name, account_type, is_intercompany_capable, is_active')
      .eq('org_id', input.org_id)
      .order('account_code');

    if (error) {
      log.error({ error }, 'Failed to list chart_of_accounts');
      throw new ServiceError('READ_FAILED', error.message);
    }

    return data ?? [];
  },

  /**
   * Gets a single account by (account_id, org_id). Both fields are
   * required: org_id is checked against the caller's memberships
   * BEFORE the lookup (S25 QW-02 / UF-002), and the looked-up row's
   * org_id is verified against the supplied org_id post-fetch as
   * a defense-in-depth tenant boundary.
   */
  async get(
    input: { account_id: string; org_id: string },
    ctx: ServiceContext,
  ) {
    // Authorization: caller must be a member of the requested org.
    // Matches list() pattern at line 20-25.
    if (!ctx.caller.org_ids.includes(input.org_id)) {
      throw new ServiceError(
        'ORG_ACCESS_DENIED',
        `Caller does not have access to org_id=${input.org_id}`,
      );
    }

    const log = loggerWith({ trace_id: ctx.trace_id, user_id: ctx.caller.user_id });
    const db = adminClient();

    const { data, error } = await db
      .from('chart_of_accounts')
      .select('account_id, org_id, account_code, account_name, account_type, is_intercompany_capable, is_active')
      .eq('account_id', input.account_id)
      .eq('org_id', input.org_id)
      .maybeSingle();

    if (error) {
      log.error({ error }, 'Failed to get account');
      throw new ServiceError('READ_FAILED', error.message);
    }

    if (!data) {
      throw new ServiceError(
        'NOT_FOUND',
        `Account ${input.account_id} not found in org_id=${input.org_id}`,
      );
    }

    return data;
  },
};
