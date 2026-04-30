// tests/integration/periodLockUnlock.test.ts
// Service-layer coverage for periodService.lock() and
// periodService.unlock() — the first accounting-domain UPDATE
// mutations and the first sites to populate audit_log.reason.
//
// Covers: happy paths, state-mismatch rejections, empty-reason
// validation, permission rejection via withInvariants, cross-org
// rejection via the service's own org-membership pre-check, and a
// cross-layer drive-through that the service-layer lock and the
// trigger-layer INV-LEDGER-002 enforcement agree on state.

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { adminClient, SEED } from '../setup/testDb';
import { periodService } from '@/services/accounting/periodService';
import { withInvariants } from '@/services/middleware/withInvariants';
import { ServiceError } from '@/services/errors/ServiceError';
import type { ServiceContext } from '@/services/middleware/serviceContext';

describe('periodService.lock / periodService.unlock', () => {
  const db = adminClient();
  const holdingPeriodId = crypto.randomUUID();
  const realEstatePeriodId = crypto.randomUUID();
  let holdingCashAcct: string;
  let holdingRentAcct: string;

  const controllerCtx = (orgIds: string[] = [SEED.ORG_HOLDING]): ServiceContext => ({
    trace_id: crypto.randomUUID(),
    caller: {
      verified: true,
      user_id: SEED.USER_CONTROLLER,
      email: 'controller@thebridge.local',
      org_ids: orgIds,
    },
    locale: 'en',
  });

  const apCtx = (): ServiceContext => ({
    trace_id: crypto.randomUUID(),
    caller: {
      verified: true,
      user_id: SEED.USER_AP_SPECIALIST,
      email: 'ap@thebridge.local',
      org_ids: [SEED.ORG_REAL_ESTATE],
    },
    locale: 'en',
  });

  beforeAll(async () => {
    // Test-owned fiscal periods, distinct from seed rows so parallel
    // tests don't collide with the seeded FY Current periods.
    const yearAgo = new Date(Date.now() - 400 * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10);
    const twoYearsAgo = new Date(Date.now() - 800 * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10);

    await db.from('fiscal_periods').insert([
      {
        period_id: holdingPeriodId,
        org_id: SEED.ORG_HOLDING,
        name: 'Test FY Holding (lock/unlock)',
        start_date: twoYearsAgo,
        end_date: yearAgo,
        is_locked: false,
      },
      {
        period_id: realEstatePeriodId,
        org_id: SEED.ORG_REAL_ESTATE,
        name: 'Test FY RealEstate (lock/unlock)',
        start_date: twoYearsAgo,
        end_date: yearAgo,
        is_locked: false,
      },
    ]);

    // Accounts for the cross-layer post-rejection test.
    const { data: cash } = await db
      .from('chart_of_accounts')
      .select('account_id')
      .eq('org_id', SEED.ORG_HOLDING)
      .eq('account_code', '1000')
      .single();
    const { data: rent } = await db
      .from('chart_of_accounts')
      .select('account_id')
      .eq('org_id', SEED.ORG_HOLDING)
      .eq('account_code', '5000')
      .maybeSingle();
    // Holding has Accounting Fees at 5110 in the seed; fall back to
    // any expense account for the cross-layer test.
    const { data: anyExpense } = await db
      .from('chart_of_accounts')
      .select('account_id')
      .eq('org_id', SEED.ORG_HOLDING)
      .eq('account_type', 'expense')
      .limit(1)
      .maybeSingle();

    holdingCashAcct = cash!.account_id;
    holdingRentAcct = (rent?.account_id ?? anyExpense!.account_id) as string;
  });

  afterAll(async () => {
    // NOTE: audit_log rows from this test are NOT deleted — the
    // table is append-only per INV-AUDIT-002 (Layer 1a). The test
    // uses fresh crypto.randomUUID() trace_ids and fresh period_ids
    // per run, so orphan rows do not cause cross-run collisions.
    // fiscal_periods is the only table this test writes that needs
    // cleanup (no ON DELETE CASCADE from fiscal_periods to audit_log).
    await db.from('fiscal_periods').delete().in('period_id', [holdingPeriodId, realEstatePeriodId]);
  });

  it('lock_creates_audit_row_with_populated_before_state_and_reason', async () => {
    const ctx = controllerCtx();

    const result = await periodService.lock(
      {
        org_id: SEED.ORG_HOLDING,
        period_id: holdingPeriodId,
        reason: 'Year-end close — no further edits.',
      },
      ctx,
    );

    expect(result.period_id).toBe(holdingPeriodId);
    expect(typeof result.locked_at).toBe('string');

    const { data: row } = await db
      .from('fiscal_periods')
      .select('is_locked, locked_at, locked_by_user_id')
      .eq('period_id', holdingPeriodId)
      .single();
    expect(row!.is_locked).toBe(true);
    expect(row!.locked_at).not.toBeNull();
    expect(row!.locked_by_user_id).toBe(SEED.USER_CONTROLLER);

    const { data: audit } = await db
      .from('audit_log')
      .select('*')
      .eq('trace_id', ctx.trace_id)
      .eq('action', 'period.locked');
    expect(audit).toHaveLength(1);
    expect(audit![0].entity_type).toBe('fiscal_period');
    expect(audit![0].entity_id).toBe(holdingPeriodId);
    expect(audit![0].reason).toBe('Year-end close — no further edits.');
    const before = audit![0].before_state as Record<string, unknown>;
    expect(before.is_locked).toBe(false);
    expect(before.locked_at).toBeNull();
    expect(before.locked_by_user_id).toBeNull();
  });

  it('lock_rejects_already_locked_period_with_no_new_audit_row', async () => {
    // Snapshot audit count for this period before the second call.
    const { count: beforeCount } = await db
      .from('audit_log')
      .select('*', { count: 'exact', head: true })
      .eq('entity_id', holdingPeriodId)
      .eq('action', 'period.locked');

    await expect(
      periodService.lock(
        {
          org_id: SEED.ORG_HOLDING,
          period_id: holdingPeriodId,
          reason: 'Redundant lock.',
        },
        controllerCtx(),
      ),
    ).rejects.toMatchObject({
      code: 'PERIOD_ALREADY_LOCKED',
    });

    const { count: afterCount } = await db
      .from('audit_log')
      .select('*', { count: 'exact', head: true })
      .eq('entity_id', holdingPeriodId)
      .eq('action', 'period.locked');
    expect(afterCount).toBe(beforeCount);
  });

  it('locked_period_rejects_journal_post_at_trigger_layer', async () => {
    // Cross-layer drive-through: the service-layer lock and the
    // trigger-layer INV-LEDGER-002 agree on state. No journal entry
    // should post against a period that periodService.lock() locked.
    // S26 QW-03: pass an in-period date so the date-range trigger
    // doesn't fire before the lock trigger.
    const { data: period } = await db
      .from('fiscal_periods')
      .select('start_date')
      .eq('period_id', holdingPeriodId)
      .single();

    const { error } = await db.rpc('test_post_balanced_entry', {
      p_org_id: SEED.ORG_HOLDING,
      p_period_id: holdingPeriodId,
      p_debit_account: holdingCashAcct,
      p_credit_account: holdingRentAcct,
      p_amount: 250,
      p_entry_date: period!.start_date,
    });
    expect(error).not.toBeNull();
    expect(error?.message).toMatch(/locked fiscal period/i);
  });

  it('unlock_resets_lock_columns_and_writes_audit_row_with_reason', async () => {
    const ctx = controllerCtx();

    const result = await periodService.unlock(
      {
        org_id: SEED.ORG_HOLDING,
        period_id: holdingPeriodId,
        reason: 'Year-end adjustments discovered — reopening.',
      },
      ctx,
    );

    expect(result.period_id).toBe(holdingPeriodId);

    const { data: row } = await db
      .from('fiscal_periods')
      .select('is_locked, locked_at, locked_by_user_id')
      .eq('period_id', holdingPeriodId)
      .single();
    expect(row!.is_locked).toBe(false);
    expect(row!.locked_at).toBeNull();
    expect(row!.locked_by_user_id).toBeNull();

    const { data: audit } = await db
      .from('audit_log')
      .select('*')
      .eq('trace_id', ctx.trace_id)
      .eq('action', 'period.unlocked');
    expect(audit).toHaveLength(1);
    expect(audit![0].reason).toBe('Year-end adjustments discovered — reopening.');
    const before = audit![0].before_state as Record<string, unknown>;
    expect(before.is_locked).toBe(true);
    expect(before.locked_at).not.toBeNull();
    expect(before.locked_by_user_id).toBe(SEED.USER_CONTROLLER);
  });

  it('unlock_rejects_already_unlocked_period', async () => {
    await expect(
      periodService.unlock(
        {
          org_id: SEED.ORG_HOLDING,
          period_id: holdingPeriodId,
          reason: 'Redundant unlock.',
        },
        controllerCtx(),
      ),
    ).rejects.toMatchObject({ code: 'PERIOD_NOT_LOCKED' });
  });

  it('lock_rejects_empty_or_whitespace_reason', async () => {
    await expect(
      periodService.lock(
        {
          org_id: SEED.ORG_HOLDING,
          period_id: holdingPeriodId,
          reason: '',
        },
        controllerCtx(),
      ),
    ).rejects.toMatchObject({ code: 'PERIOD_REASON_REQUIRED' });

    await expect(
      periodService.lock(
        {
          org_id: SEED.ORG_HOLDING,
          period_id: holdingPeriodId,
          reason: '   \t\n ',
        },
        controllerCtx(),
      ),
    ).rejects.toBeInstanceOf(ServiceError);

    // Period should remain unlocked (no side effects from the
    // rejected calls).
    const { data: row } = await db
      .from('fiscal_periods')
      .select('is_locked')
      .eq('period_id', holdingPeriodId)
      .single();
    expect(row!.is_locked).toBe(false);
  });

  it('ap_specialist_cannot_lock_via_withInvariants', async () => {
    // AP Specialist is a member of ORG_REAL_ESTATE, but the
    // ap_specialist role does not have period.lock.
    // withInvariants() → canUserPerformAction() rejects before any
    // DB write, so no audit row is written.
    const ctx = apCtx();

    const { count: before } = await db
      .from('audit_log')
      .select('*', { count: 'exact', head: true })
      .eq('trace_id', ctx.trace_id);

    await expect(
      withInvariants(periodService.lock, { action: 'period.lock' })(
        {
          org_id: SEED.ORG_REAL_ESTATE,
          period_id: realEstatePeriodId,
          reason: 'AP trying to lock.',
        },
        ctx,
      ),
    ).rejects.toThrow(ServiceError);

    const { count: after } = await db
      .from('audit_log')
      .select('*', { count: 'exact', head: true })
      .eq('trace_id', ctx.trace_id);
    expect(after).toBe(before);

    const { data: row } = await db
      .from('fiscal_periods')
      .select('is_locked')
      .eq('period_id', realEstatePeriodId)
      .single();
    expect(row!.is_locked).toBe(false);
  });

  it('cross_org_lock_rejected_by_service_pre_check', async () => {
    // Controller ctx scoped to ORG_HOLDING only. Attempting to lock
    // a period that lives in ORG_REAL_ESTATE must be rejected by
    // the service's org-membership pre-check with ORG_ACCESS_DENIED,
    // before any DB read or write.
    const ctx = controllerCtx([SEED.ORG_HOLDING]);

    await expect(
      periodService.lock(
        {
          org_id: SEED.ORG_REAL_ESTATE,
          period_id: realEstatePeriodId,
          reason: 'Cross-org attempt.',
        },
        ctx,
      ),
    ).rejects.toMatchObject({ code: 'ORG_ACCESS_DENIED' });

    const { data: row } = await db
      .from('fiscal_periods')
      .select('is_locked')
      .eq('period_id', realEstatePeriodId)
      .single();
    expect(row!.is_locked).toBe(false);
  });
});
