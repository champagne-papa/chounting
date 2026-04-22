// src/services/accounting/periodService.ts
// Period open/locked check — replaces v0.4.0 Period Agent.

import { adminClient } from '@/db/adminClient';
import type { ServiceContext } from '@/services/middleware/serviceContext';
import { loggerWith } from '@/shared/logger/pino';

import { ServiceError } from '@/services/errors/ServiceError';
import { recordMutation } from '@/services/audit/recordMutation';

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

  /**
   * Locks a fiscal period. Writes `is_locked=true`, stamps
   * `locked_at` and `locked_by_user_id`, and emits an audit_log
   * row with action='period.locked', the pre-mutation row as
   * `before_state`, and the caller-supplied `reason`.
   *
   * Concurrency: the UPDATE takes a row-level lock on
   * fiscal_periods; INV-LEDGER-002's `enforce_period_not_locked`
   * trigger takes `SELECT ... FOR UPDATE` on the same row when
   * journal_lines are inserted. The two paths serialize against
   * each other on the same row without deadlock (both acquire
   * the lock in the same order).
   */
  async lock(
    input: { org_id: string; period_id: string; reason: string },
    ctx: ServiceContext,
  ): Promise<{ period_id: string; locked_at: string }> {
    if (!ctx.caller.org_ids.includes(input.org_id)) {
      throw new ServiceError(
        'ORG_ACCESS_DENIED',
        `Caller does not have access to org_id=${input.org_id}`,
      );
    }

    if (input.reason.trim().length === 0) {
      throw new ServiceError(
        'PERIOD_REASON_REQUIRED',
        'reason must be a non-empty string',
      );
    }

    const log = loggerWith({ trace_id: ctx.trace_id, user_id: ctx.caller.user_id });
    const db = adminClient();

    const { data: before, error: beforeErr } = await db
      .from('fiscal_periods')
      .select('*')
      .eq('period_id', input.period_id)
      .eq('org_id', input.org_id)
      .maybeSingle();

    if (beforeErr) {
      throw new ServiceError('READ_FAILED', beforeErr.message);
    }
    if (!before) {
      throw new ServiceError(
        'NOT_FOUND',
        `fiscal_period period_id=${input.period_id} not found in org_id=${input.org_id}`,
      );
    }
    if ((before as { is_locked: boolean }).is_locked === true) {
      throw new ServiceError(
        'PERIOD_ALREADY_LOCKED',
        `period_id=${input.period_id} is already locked`,
      );
    }

    const { data: updated, error: updateErr } = await db
      .from('fiscal_periods')
      .update({
        is_locked: true,
        locked_at: new Date().toISOString(),
        locked_by_user_id: ctx.caller.user_id,
      })
      .eq('period_id', input.period_id)
      .eq('org_id', input.org_id)
      .select('locked_at')
      .single();

    if (updateErr) {
      throw new ServiceError('POST_FAILED', updateErr.message);
    }

    await recordMutation(db, ctx, {
      org_id: input.org_id,
      action: 'period.locked',
      entity_type: 'fiscal_period',
      entity_id: input.period_id,
      before_state: before as Record<string, unknown>,
      reason: input.reason,
    });

    log.info(
      { period_id: input.period_id, action: 'period.locked' },
      'Fiscal period locked',
    );

    return {
      period_id: input.period_id,
      locked_at: (updated as { locked_at: string }).locked_at,
    };
  },

  /**
   * Unlocks a fiscal period. Mirror of lock(): writes
   * `is_locked=false`, nulls `locked_at` and `locked_by_user_id`,
   * and emits an audit_log row with action='period.unlocked', the
   * pre-mutation row as `before_state`, and the caller-supplied
   * `reason`.
   */
  async unlock(
    input: { org_id: string; period_id: string; reason: string },
    ctx: ServiceContext,
  ): Promise<{ period_id: string }> {
    if (!ctx.caller.org_ids.includes(input.org_id)) {
      throw new ServiceError(
        'ORG_ACCESS_DENIED',
        `Caller does not have access to org_id=${input.org_id}`,
      );
    }

    if (input.reason.trim().length === 0) {
      throw new ServiceError(
        'PERIOD_REASON_REQUIRED',
        'reason must be a non-empty string',
      );
    }

    const log = loggerWith({ trace_id: ctx.trace_id, user_id: ctx.caller.user_id });
    const db = adminClient();

    const { data: before, error: beforeErr } = await db
      .from('fiscal_periods')
      .select('*')
      .eq('period_id', input.period_id)
      .eq('org_id', input.org_id)
      .maybeSingle();

    if (beforeErr) {
      throw new ServiceError('READ_FAILED', beforeErr.message);
    }
    if (!before) {
      throw new ServiceError(
        'NOT_FOUND',
        `fiscal_period period_id=${input.period_id} not found in org_id=${input.org_id}`,
      );
    }
    if ((before as { is_locked: boolean }).is_locked === false) {
      throw new ServiceError(
        'PERIOD_NOT_LOCKED',
        `period_id=${input.period_id} is not locked`,
      );
    }

    const { error: updateErr } = await db
      .from('fiscal_periods')
      .update({
        is_locked: false,
        locked_at: null,
        locked_by_user_id: null,
      })
      .eq('period_id', input.period_id)
      .eq('org_id', input.org_id);

    if (updateErr) {
      throw new ServiceError('POST_FAILED', updateErr.message);
    }

    await recordMutation(db, ctx, {
      org_id: input.org_id,
      action: 'period.unlocked',
      entity_type: 'fiscal_period',
      entity_id: input.period_id,
      before_state: before as Record<string, unknown>,
      reason: input.reason,
    });

    log.info(
      { period_id: input.period_id, action: 'period.unlocked' },
      'Fiscal period unlocked',
    );

    return { period_id: input.period_id };
  },
};
