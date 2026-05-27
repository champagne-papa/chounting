// apps/web/src/agent/policies/agent-ladder/gate.ts
//
// Agent Ladder gate (ADR-0025 §5 / Decision 5). Composes rule-type-core §6.1
// step 7's sequential capping + limit checks. Orchestrator-layer: it receives
// the pre-fetched MatchResult + RuleRegistryRow + LimitContext from the
// orchestrator (ruleEvaluationOrchestrator.ts, Commit 3+) and returns the gate's
// authoritative effective_action — the value the pure core deliberately does NOT
// produce (no effective_action on MatchResult; rule-type-core §6.1.1 / ADR-0025 §4).
//
// Imports only from shared/rules/ — agent ↛ core, agent ↛ db (ADR-0020 Block 1,
// enforced by eslint agent-first-import-boundaries at 'error').

import { cap } from '@/shared/rules/capping';
import type { ActionType, MatchResult, RuleRegistryRow } from '@/shared/rules/types';

import {
  checkDailyAggregate,
  checkPerTransactionLimit,
  checkTrackRecordHealth,
} from './stubs';
import type { LimitContext } from './stubs';

/**
 * rule-type-core §6.1 step 7 sequential composition:
 *   cap(max, current_rung) → checkPerTransactionLimit → checkDailyAggregate
 *   → checkTrackRecordHealth → effective_action.
 *
 * At v1 the three stubs pass through unchanged (`// activates post-v1` in
 * stubs.ts), so the gate's output equals `cap(max, current_rung)`.
 *
 * `winning_branch_max_action` being non-null is a precondition: an almost_match
 * has no winner and no max action, and the orchestrator does not call gate() in
 * that case. The defensive throw makes that misuse loud rather than letting a
 * misleading null-handling path live inside the gate.
 */
export function gate(
  matchResult: MatchResult,
  ruleRegistryRow: RuleRegistryRow,
  limitContext: LimitContext,
): ActionType {
  const max = matchResult.winning_branch_max_action;
  if (max === null) {
    throw new Error(
      'gate: winning_branch_max_action is null (almost_match has no gate output)',
    );
  }
  const capped = cap(max, ruleRegistryRow.current_rung);
  const afterLimit = checkPerTransactionLimit(capped, limitContext);
  const afterAggregate = checkDailyAggregate(afterLimit, limitContext);
  const afterHealth = checkTrackRecordHealth(afterAggregate, limitContext);
  return afterHealth;
}
