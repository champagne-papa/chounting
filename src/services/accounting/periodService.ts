// src/services/accounting/periodService.ts
// Period open/locked check — replaces v0.4.0 Period Agent.

import { adminClient } from '@/db/adminClient';
import type { ServiceContext } from '@/services/middleware/serviceContext';
import { loggerWith } from '@/shared/logger/pino';

export const periodService = {
  /**
   * Checks whether the fiscal period covering `entryDate` in `orgId` is open.
   * Returns the period if open, or null if locked / not found.
   */
  async isOpen(
    input: { org_id: string; entry_date: string },
    ctx: ServiceContext,
  ) {
    const log = loggerWith({ trace_id: ctx.trace_id, user_id: ctx.caller.user_id });
    const db = adminClient();

    const { data: period, error } = await db
      .from('fiscal_periods')
      .select('period_id, name, start_date, end_date, is_locked')
      .eq('org_id', input.org_id)
      .lte('start_date', input.entry_date)
      .gte('end_date', input.entry_date)
      .maybeSingle();

    if (error) {
      log.error({ error }, 'Failed to query fiscal_periods');
      return null;
    }

    if (!period) {
      log.warn({ input }, 'No fiscal period found for date');
      return null;
    }

    if (period.is_locked) {
      log.info({ period_id: period.period_id }, 'Period is locked');
      return null;
    }

    return period;
  },
};
