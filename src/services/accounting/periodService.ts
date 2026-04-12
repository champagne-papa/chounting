// src/services/accounting/periodService.ts
// Period open/locked check — replaces v0.4.0 Period Agent.

import { adminClient } from '@/db/adminClient';
import type { ServiceContext } from '@/services/middleware/serviceContext';
import { loggerWith } from '@/shared/logger/pino';

import { ServiceError } from '@/services/errors/ServiceError';

export type FiscalPeriodListItem = {
  period_id: string;
  name: string;
  start_date: string;
  end_date: string;
  is_locked: boolean;
};

export const periodService = {
  /**
   * Lists all open (unlocked) fiscal periods for an org.
   * Used by the journal entry form's period dropdown.
   */
  async listOpen(
    input: { org_id: string },
    ctx: ServiceContext,
  ): Promise<FiscalPeriodListItem[]> {
    // Authorization: caller must be a member of the requested org.
    if (!ctx.caller.org_ids.includes(input.org_id)) {
      throw new ServiceError(
        'ORG_ACCESS_DENIED',
        `Caller does not have access to org_id=${input.org_id}`,
      );
    }

    const db = adminClient();
    const { data, error } = await db
      .from('fiscal_periods')
      .select('period_id, name, start_date, end_date, is_locked')
      .eq('org_id', input.org_id)
      .eq('is_locked', false)
      .order('start_date', { ascending: true });

    if (error) throw new ServiceError('READ_FAILED', error.message);
    return (data ?? []) as FiscalPeriodListItem[];
  },

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
