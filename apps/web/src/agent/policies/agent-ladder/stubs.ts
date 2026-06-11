// apps/web/src/agent/policies/agent-ladder/stubs.ts
//
// Three downstream gate components (ADR-0025 §5 / Decision 5). All ship
// defined-but-inert at v1 — pass-through identity over ActionType with explicit
// `// activates post-v1` markers. Post-v1 activation is a single-file body
// replacement per stub; the gate's composition pipeline (gate.ts) is unchanged.
//
// LimitContext is the minimal shape these stubs need. It is agent-local (not a
// db Row): the orchestrator (Commit 3+) constructs it from the proposed_mutation
// amount + the org's daily-aggregate window + the rule_track_records health
// snapshot. It extends as the stubs activate.

import type { ActionType } from '@/shared/rules/types';

/**
 * Limit-evaluation context. Empty at v1 (the stubs are pass-through). Expressed
 * as `Record<string, never>` rather than `{}` for lint-cleanliness
 * (@typescript-eslint/no-empty-object-type). Extends post-v1 when the stubs
 * activate — e.g. proposed_mutation_amount, daily_aggregate_amount,
 * track_record_health_snapshot.
 */
export type LimitContext = Record<string, never>;

/**
 * Per-transaction $-limit check. // activates post-v1
 *
 * Post-v1: cap `action` further when the proposed_mutation amount exceeds the
 * rule's per-transaction limit (e.g. escalate an auto_post_* action to suggest).
 */
export function checkPerTransactionLimit(
  action: ActionType,
  _ctx: LimitContext,
): ActionType {
  return action;
}

/**
 * Daily-aggregate check. // activates post-v1
 *
 * Post-v1: cap `action` further when the org's daily auto-post aggregate already
 * exceeds the configured ceiling.
 */
export function checkDailyAggregate(
  action: ActionType,
  _ctx: LimitContext,
): ActionType {
  return action;
}

/**
 * Track-record health check. // activates post-v1
 *
 * Post-v1: cap `action` further when the rule's track-record health
 * (clean-approval rate, rejection rate, guardrail-fire rate over the recent
 * window) falls below thresholds.
 */
export function checkTrackRecordHealth(
  action: ActionType,
  _ctx: LimitContext,
): ActionType {
  return action;
}
