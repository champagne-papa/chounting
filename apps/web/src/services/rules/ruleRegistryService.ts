// apps/web/src/services/rules/ruleRegistryService.ts
//
// Ring 2A-core Commit 3 (ADR-0025 §6 / Decision 6). Sole writer of
// rule_registry for LIFECYCLE mutations (promote / demote / rename / retire):
// single-table UPDATEs that stamp the matching lineage anchor + actor column,
// each audited via recordMutation. Plus read methods for the Stage 1 canvas.
//
// Authorization note: the `rule.*` permission keys + controller route-gating
// land in Commit 4 (ADR-0025 §9 + Migration outline). These methods wrap
// withInvariants for ServiceContext validation but do NOT yet pass an `action`
// (no `rule.*` ActionName exists until Commit 4's permissions seed). There is
// no production route caller this arc; the service exists + is integration-
// testable (ADR-0025 Decision 6 / Non-decision).

import { adminClient } from '@/db/adminClient';
import type { ServiceContext } from '@/services/middleware/serviceContext';
import { withInvariants } from '@/services/middleware/withInvariants';
import { ServiceError } from '@/services/errors/ServiceError';
import { recordMutation } from '@/services/audit/recordMutation';
import { loggerWith } from '@/shared/logger/pino';
import type { RuleAutonomyRung, RuleLifecycleState } from '@/shared/rules/types';

type Db = ReturnType<typeof adminClient>;

// JUDGMENT CALL (review): promotable target rungs exclude always_confirm
// (promotion ascends the ladder). v1 asymmetry means production rules sit at
// always_confirm; promote() is the post-v1 ascent path, exercised + tested here.
type PromotableRung = Exclude<RuleAutonomyRung, 'always_confirm'>;

type RuleRegistryReadRow = {
  id: string;
  org_id: string;
  rule_type: string;
  lifecycle_state: string;
  current_rung: RuleAutonomyRung;
  name: string | null;
  created_at: string;
  promoted_at: string | null;
  demoted_at: string | null;
  retired_at: string | null;
};

// Filter value-sets for listForCanvas. An invalid value on an enum column would
// error at the DB, so filters apply only for recognized values. Grounded against
// the rule_autonomy_rung / rule_lifecycle_state enums (migration 20240163).
const RUNGS = ['always_confirm', 'notify_and_auto_post', 'silent_auto'] as const;
const LIFECYCLE_STATES = ['proposed', 'active', 'demoted', 'retired'] as const;

/** Enriched per-rule row for the Stage 1 canvas list (ADR-0025 §9). */
type RuleCanvasRow = {
  id: string;
  name: string | null;
  rule_type: string;
  current_rung: RuleAutonomyRung;
  lifecycle_state: RuleLifecycleState;
  created_at: string;
  /** Surfaced top-level (Q-RC-AT-2); also the default 'recent' sort key. From rule_track_records. */
  last_winning_match_at: string | null;
  /** Cumulative counters (rule_track_records) or null if the row is absent. */
  track_record: Record<string, unknown> | null;
  /** Trailing-30-day windowed indicators (rule_evaluation_30d_view) or null. */
  window_30d: Record<string, unknown> | null;
};

async function readRow(db: Db, rule_id: string, org_id: string): Promise<Record<string, unknown> & { lifecycle_state: string }> {
  const { data, error } = await db
    .from('rule_registry')
    .select('*')
    .eq('id', rule_id)
    .eq('org_id', org_id)
    .maybeSingle();
  if (error) throw new ServiceError('READ_FAILED', error.message);
  if (!data) {
    throw new ServiceError('RULE_NOT_FOUND', `rule_registry id=${rule_id} not found in org_id=${org_id}`);
  }
  return data as Record<string, unknown> & { lifecycle_state: string };
}

export const ruleRegistryService = {
  /**
   * Promote a rule to a higher autonomy rung (post-v1 ladder ascent). Stamps
   * current_rung + promoted_at/by and re-activates the rule (a demoted rule
   * returning to service).
   *
   * JUDGMENT CALL (review): promote sets lifecycle_state='active' (re-activation
   * of a demoted/proposed rule). Retired rules cannot be promoted.
   */
  promote: withInvariants(async (
    input: { org_id: string; rule_id: string; target_rung: PromotableRung },
    ctx: ServiceContext,
  ): Promise<{ rule_id: string; current_rung: RuleAutonomyRung; promoted_at: string }> => {
    const log = loggerWith({ trace_id: ctx.trace_id, user_id: ctx.caller.user_id });
    const db = adminClient();
    const before = await readRow(db, input.rule_id, input.org_id);
    if (before.lifecycle_state === 'retired') {
      throw new ServiceError('RULE_LIFECYCLE_INVALID', `cannot promote a retired rule (id=${input.rule_id})`);
    }
    const promoted_at = new Date().toISOString();
    const { data: updated, error } = await db
      .from('rule_registry')
      .update({
        current_rung: input.target_rung,
        lifecycle_state: 'active',
        promoted_at,
        promoted_by: ctx.caller.user_id,
      })
      .eq('id', input.rule_id)
      .eq('org_id', input.org_id)
      .select('current_rung, promoted_at')
      .single();
    if (error) throw new ServiceError('POST_FAILED', error.message);
    await recordMutation(db, ctx, {
      org_id: input.org_id,
      action: 'rule.promoted',
      entity_type: 'rule_registry',
      entity_id: input.rule_id,
      before_state: before,
    });
    log.info({ rule_id: input.rule_id, target_rung: input.target_rung }, 'Rule promoted');
    return {
      rule_id: input.rule_id,
      current_rung: (updated as { current_rung: RuleAutonomyRung }).current_rung,
      promoted_at: (updated as { promoted_at: string }).promoted_at,
    };
  }),

  /**
   * Demote a rule back to always_confirm. Stamps current_rung='always_confirm',
   * demoted_at/by, and lifecycle_state='demoted'.
   */
  demote: withInvariants(async (
    input: { org_id: string; rule_id: string },
    ctx: ServiceContext,
  ): Promise<{ rule_id: string }> => {
    const log = loggerWith({ trace_id: ctx.trace_id, user_id: ctx.caller.user_id });
    const db = adminClient();
    const before = await readRow(db, input.rule_id, input.org_id);
    if (before.lifecycle_state === 'retired') {
      throw new ServiceError('RULE_LIFECYCLE_INVALID', `cannot demote a retired rule (id=${input.rule_id})`);
    }
    const { error } = await db
      .from('rule_registry')
      .update({
        current_rung: 'always_confirm',
        lifecycle_state: 'demoted',
        demoted_at: new Date().toISOString(),
        demoted_by: ctx.caller.user_id,
      })
      .eq('id', input.rule_id)
      .eq('org_id', input.org_id);
    if (error) throw new ServiceError('POST_FAILED', error.message);
    await recordMutation(db, ctx, {
      org_id: input.org_id,
      action: 'rule.demoted',
      entity_type: 'rule_registry',
      entity_id: input.rule_id,
      before_state: before,
    });
    log.info({ rule_id: input.rule_id }, 'Rule demoted');
    return { rule_id: input.rule_id };
  }),

  /** Rename a rule's display name (§5.1 mutable metadata). */
  rename: withInvariants(async (
    input: { org_id: string; rule_id: string; name: string },
    ctx: ServiceContext,
  ): Promise<{ rule_id: string; name: string }> => {
    const log = loggerWith({ trace_id: ctx.trace_id, user_id: ctx.caller.user_id });
    const db = adminClient();
    const before = await readRow(db, input.rule_id, input.org_id);
    const { error } = await db
      .from('rule_registry')
      .update({ name: input.name })
      .eq('id', input.rule_id)
      .eq('org_id', input.org_id);
    if (error) throw new ServiceError('POST_FAILED', error.message);
    await recordMutation(db, ctx, {
      org_id: input.org_id,
      action: 'rule.renamed',
      entity_type: 'rule_registry',
      entity_id: input.rule_id,
      before_state: before,
    });
    log.info({ rule_id: input.rule_id }, 'Rule renamed');
    return { rule_id: input.rule_id, name: input.name };
  }),

  /** Retire a rule (terminal lifecycle state; §5.8 / §9.3 retire-and-create-new). */
  retire: withInvariants(async (
    input: { org_id: string; rule_id: string },
    ctx: ServiceContext,
  ): Promise<{ rule_id: string }> => {
    const log = loggerWith({ trace_id: ctx.trace_id, user_id: ctx.caller.user_id });
    const db = adminClient();
    const before = await readRow(db, input.rule_id, input.org_id);
    if (before.lifecycle_state === 'retired') {
      throw new ServiceError('RULE_LIFECYCLE_INVALID', `rule already retired (id=${input.rule_id})`);
    }
    const { error } = await db
      .from('rule_registry')
      .update({
        lifecycle_state: 'retired',
        retired_at: new Date().toISOString(),
        retired_by: ctx.caller.user_id,
      })
      .eq('id', input.rule_id)
      .eq('org_id', input.org_id);
    if (error) throw new ServiceError('POST_FAILED', error.message);
    await recordMutation(db, ctx, {
      org_id: input.org_id,
      action: 'rule.retired',
      entity_type: 'rule_registry',
      entity_id: input.rule_id,
      before_state: before,
    });
    log.info({ rule_id: input.rule_id }, 'Rule retired');
    return { rule_id: input.rule_id };
  }),

  /** Read a single registry row (canvas detail / service composition). */
  get: withInvariants(async (
    input: { org_id: string; rule_id: string },
    _ctx: ServiceContext,
  ): Promise<RuleRegistryReadRow | null> => {
    const db = adminClient();
    const { data, error } = await db
      .from('rule_registry')
      .select('id, org_id, rule_type, lifecycle_state, current_rung, name, created_at, promoted_at, demoted_at, retired_at')
      .eq('id', input.rule_id)
      .eq('org_id', input.org_id)
      .maybeSingle();
    if (error) throw new ServiceError('READ_FAILED', error.message);
    return (data as RuleRegistryReadRow | null) ?? null;
  }),

  /** List an org's registry rows (Stage 1 canvas). */
  listByOrg: withInvariants(async (
    input: { org_id: string },
    _ctx: ServiceContext,
  ): Promise<RuleRegistryReadRow[]> => {
    const db = adminClient();
    const { data, error } = await db
      .from('rule_registry')
      .select('id, org_id, rule_type, lifecycle_state, current_rung, name, created_at, promoted_at, demoted_at, retired_at')
      .eq('org_id', input.org_id)
      .order('created_at', { ascending: false });
    if (error) throw new ServiceError('READ_FAILED', error.message);
    return (data ?? []) as RuleRegistryReadRow[];
  }),

  /**
   * Enriched list for the Stage 1 canvas (ADR-0025 §9): rule_registry joined with
   * rule_track_records (cumulative counters) + rule_evaluation_30d_view (windowed
   * indicators), merged by rule_id. Read-path — withInvariants (no `action`)
   * supplies the org-access check via Invariant 3 (input.org_id ∈ caller.org_ids →
   * ORG_ACCESS_DENIED), mirroring journalEntryService.list. Filters (lifecycle/rung)
   * apply only for recognized enum values; sort is JS-side because the default order
   * key (last_winning_match_at) lives on rule_track_records, not the registry.
   */
  listForCanvas: withInvariants(async (
    input: { org_id: string; lifecycle?: string; rung?: string; sort?: string },
    _ctx: ServiceContext,
  ): Promise<RuleCanvasRow[]> => {
    const db = adminClient();

    let q = db
      .from('rule_registry')
      .select('id, rule_type, lifecycle_state, current_rung, name, created_at')
      .eq('org_id', input.org_id);
    if (input.lifecycle && (LIFECYCLE_STATES as readonly string[]).includes(input.lifecycle)) {
      q = q.eq('lifecycle_state', input.lifecycle);
    }
    if (input.rung && (RUNGS as readonly string[]).includes(input.rung)) {
      q = q.eq('current_rung', input.rung);
    }
    const { data: regRows, error: regErr } = await q;
    if (regErr) throw new ServiceError('READ_FAILED', regErr.message);
    const rules = (regRows ?? []) as Array<{
      id: string;
      rule_type: string;
      lifecycle_state: RuleLifecycleState;
      current_rung: RuleAutonomyRung;
      name: string | null;
      created_at: string;
    }>;
    if (rules.length === 0) return [];

    const ids = rules.map((r) => r.id);
    const { data: trRows, error: trErr } = await db
      .from('rule_track_records').select('*').in('rule_id', ids);
    if (trErr) throw new ServiceError('READ_FAILED', trErr.message);
    const trByRule = new Map(
      (trRows ?? []).map((t) => [(t as { rule_id: string }).rule_id, t as Record<string, unknown>]),
    );

    const { data: viewRows, error: viewErr } = await db
      .from('rule_evaluation_30d_view').select('*').eq('org_id', input.org_id).in('rule_id', ids);
    if (viewErr) throw new ServiceError('READ_FAILED', viewErr.message);
    const viewByRule = new Map(
      (viewRows ?? []).map((v) => [(v as { rule_id: string }).rule_id, v as Record<string, unknown>]),
    );

    const merged: RuleCanvasRow[] = rules.map((r) => {
      const tr = trByRule.get(r.id) ?? null;
      return {
        id: r.id,
        name: r.name,
        rule_type: r.rule_type,
        current_rung: r.current_rung,
        lifecycle_state: r.lifecycle_state,
        created_at: r.created_at,
        last_winning_match_at: (tr?.last_winning_match_at as string | null | undefined) ?? null,
        track_record: tr,
        window_30d: viewByRule.get(r.id) ?? null,
      };
    });

    const sort = input.sort ?? 'recent';
    if (sort === 'name') {
      merged.sort((a, b) => (a.name ?? '').localeCompare(b.name ?? ''));
    } else if (sort === 'created') {
      merged.sort((a, b) => (a.created_at < b.created_at ? 1 : a.created_at > b.created_at ? -1 : 0));
    } else {
      // 'recent' (default): last_winning_match_at DESC, nulls last.
      merged.sort((a, b) => {
        const av = a.last_winning_match_at;
        const bv = b.last_winning_match_at;
        if (av === bv) return 0;
        if (av === null) return 1;
        if (bv === null) return -1;
        return av < bv ? 1 : -1;
      });
    }
    return merged;
  }),
};
