// apps/web/src/services/rules/ruleTrackRecordService.ts
//
// Ring 2A-core Commit 3 (ADR-0025 §6 / Decision 6). Sole updater of
// rule_track_records: evaluation-time counter increments + last_*_at stamps,
// plus counter reads and the 30-day evaluation-view read (rule_evaluation_30d_view).
//
// The track-record snapshot read here feeds MatchResult.track_record_snapshot
// (ruleEvaluationService.evaluate) and, post-v1, the gate's checkTrackRecordHealth
// stub.

import { adminClient } from '@/db/adminClient';
import type { ServiceContext } from '@/services/middleware/serviceContext';
import { withInvariants } from '@/services/middleware/withInvariants';
import { ServiceError } from '@/services/errors/ServiceError';
import { loggerWith } from '@/shared/logger/pino';
import type { MatchClassification } from '@/shared/rules/types';
import type { Disposition } from '@/shared/rules/disposition';

type RuleTrackRecordRow = {
  rule_id: string;
  clean_approval_count: number;
  rejection_count: number;
  guardrail_fire_count: number;
  guardrail_confirmed_count: number;
  guardrail_resolved_into_primary_bounds_count: number;
  last_clean_approval_at: string | null;
  last_rejection_at: string | null;
  last_guardrail_fire_at: string | null;
  last_winning_match_at: string | null;
  model_version: string | null;
};

export const ruleTrackRecordService = {
  /**
   * Record the EVALUATION-time track-record effects for the winning rule.
   *
   * JUDGMENT CALL (review): at v1 this stamps last_winning_match_at (the rule
   * just won a match; Q-RC-AT-2 stored column) and, for a guardrail_match,
   * increments guardrail_fire_count + stamps last_guardrail_fire_at. The
   * APPROVAL-outcome counters (clean_approval_count / rejection_count /
   * guardrail_confirmed_count / guardrail_resolved_into_primary_bounds_count)
   * are NOT touched here: disposition is insert-time-only and does not carry the
   * terminal controller approve/reject outcome (ADR-0024 Decision 2); those
   * counters increment in a future approval-pipeline arc. The orchestrator calls
   * this only when there is a winner (primary_match | guardrail_match), never for
   * a pure almost_match.
   *
   * `disposition` is accepted per the ADR Decision 6 signature but is not used
   * for counter selection at v1 (always 'pending'); reserved for the post-v1
   * auto_posted-tracking path.
   *
   * Concurrency: read-modify-write on the counter. Functionally race-free under
   * the v1 single-controller-per-org model (same basis as write_journal_entry_atomic's
   * entry_number allocation, 20240134). FORWARD-FLAG: revisit if concurrent
   * evaluation against one rule becomes plausible (a SQL increment or RPC).
   */
  recordEvaluation: withInvariants(async (
    input: { rule_id: string; classification: MatchClassification; disposition: Disposition },
    ctx: ServiceContext,
  ): Promise<void> => {
    const log = loggerWith({ trace_id: ctx.trace_id, user_id: ctx.caller.user_id });
    const db = adminClient();
    const now = new Date().toISOString();

    const { data: tr, error: readErr } = await db
      .from('rule_track_records')
      .select('guardrail_fire_count')
      .eq('rule_id', input.rule_id)
      .maybeSingle();
    if (readErr) throw new ServiceError('READ_FAILED', readErr.message);
    if (!tr) {
      throw new ServiceError('RULE_NOT_FOUND', `rule_track_records rule_id=${input.rule_id} not found`);
    }

    const updates: Record<string, unknown> = { last_winning_match_at: now };
    if (input.classification === 'guardrail_match') {
      updates.guardrail_fire_count = ((tr as { guardrail_fire_count: number }).guardrail_fire_count ?? 0) + 1;
      updates.last_guardrail_fire_at = now;
    }

    const { error: updErr } = await db
      .from('rule_track_records')
      .update(updates)
      .eq('rule_id', input.rule_id);
    if (updErr) throw new ServiceError('POST_FAILED', updErr.message);

    log.info(
      { rule_id: input.rule_id, classification: input.classification },
      'rule_track_records evaluation effects recorded',
    );
  }),

  /** Read a rule's track-record counters (snapshot for evaluate + the gate). */
  getSnapshot: withInvariants(async (
    input: { rule_id: string },
    _ctx: ServiceContext,
  ): Promise<RuleTrackRecordRow | null> => {
    const db = adminClient();
    const { data, error } = await db
      .from('rule_track_records')
      .select('*')
      .eq('rule_id', input.rule_id)
      .maybeSingle();
    if (error) throw new ServiceError('READ_FAILED', error.message);
    return (data as RuleTrackRecordRow | null) ?? null;
  }),

  /** Read the trailing-30-day evaluation aggregates for an org (Stage 1 canvas). */
  get30dView: withInvariants(async (
    input: { org_id: string; rule_id?: string },
    _ctx: ServiceContext,
  ): Promise<Record<string, unknown>[]> => {
    const db = adminClient();
    let q = db.from('rule_evaluation_30d_view').select('*').eq('org_id', input.org_id);
    if (input.rule_id) q = q.eq('rule_id', input.rule_id);
    const { data, error } = await q;
    if (error) throw new ServiceError('READ_FAILED', error.message);
    return (data ?? []) as Record<string, unknown>[];
  }),
};
