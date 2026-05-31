// apps/web/src/agent/policies/agent-ladder/ruleEvaluationOrchestrator.ts
//
// Ring 2A-core Commit 3 (ADR-0025 §7 / Decision 7). The agent-layer coordinator
// of the full evaluation flow:
//
//   evaluate → (skip? return) → (winner? gate → effective_action) →
//   ruleEvaluationService.recordEvaluation (log append, AFTER the gate) →
//   ruleTrackRecordService.recordEvaluation (counter update, separate txn).
//
// This lives in agent/ — NOT services/ — because services ↛ agent (ADR-0020), so
// a service cannot call the gate. The orchestrator owns *sequencing* (when each
// step fires, and specifically that the log append happens after the gate); the
// services own their respective writes. The shape is forced, not chosen, by three
// constraints (ADR-0025 §7): MatchResult carries no effective_action, INV-RULE-001
// is append-only, and services ↛ agent.
//
// Imports only shared/ + services/ + the sibling gate (agent → {services, shared};
// agent ↛ core/db). The transaction boundary between the log append and the counter
// update is SEPARATE (OQ-3a): the log is source-of-truth, counters reconcilable from
// the log corpus.

import { gate } from './gate';
import type { LimitContext } from './stubs';
import { ruleEvaluationService, type BranchSource } from '@/services/rules/ruleEvaluationService';
import { ruleTrackRecordService } from '@/services/rules/ruleTrackRecordService';
import { ruleRegistryService } from '@/services/rules/ruleRegistryService';
import { dispositionForAction, type Disposition } from '@/shared/rules/disposition';
import type { ActionType, MatchResult, RuleRegistryRow } from '@/shared/rules/types';
import type { ServiceContext, SystemActorServiceContext } from '@/services/middleware/serviceContext';
import type { ProposedMutation } from '@/shared/schemas/accounting/proposedMutation.schema';

export type EvaluationDispatchResult =
  | { skipped: true; reason: string }
  | {
      skipped: false;
      matchResult: MatchResult;
      effective_action: ActionType | null;
      disposition: Disposition | null;
      logRowIds: string[];
    };

/**
 * Run the evaluate → gate → record flow for a single proposal.
 *
 * `branchSource` is the Ring 2B assembly seam (no-op default in production → the
 * evaluator is branchless → almost_match / no candidate triggers → no log rows);
 * tests inject fixture branches to exercise real matching end-to-end.
 *
 * Not withInvariants-wrapped: this is the agent-layer coordinator, not a service;
 * the services it calls are each individually wrapped.
 */
export async function evaluateAndDispatch(
  input: { proposal: ProposedMutation; org_id: string; branchSource?: BranchSource },
  // Ring 2B Seam-1: widened to admit the ingest pipeline's SystemActorServiceContext
  // (the auto-commit arc's system-actor flow). ctx is threaded to union-accepting
  // withInvariants services + read only for trace_id; no VerifiedCaller field is used.
  ctx: ServiceContext | SystemActorServiceContext,
): Promise<EvaluationDispatchResult> {
  // 1. Evaluate (the ceiling/reversal guard lives inside evaluate → EvaluationSkipped).
  const result = await ruleEvaluationService.evaluate(
    { proposal: input.proposal, org_id: input.org_id, branchSource: input.branchSource },
    ctx,
  );
  if ('skipped' in result) {
    // Ceiling/reversal class: no gate, no log, no counter (ADR-0025 §6 / §7).
    return { skipped: true, reason: result.reason };
  }
  const matchResult: MatchResult = result;

  // 2. Winner → the gate produces the authoritative effective_action. A pure
  //    almost_match has no winner and no gate (ADR-0025 §6.1.1 / Decision 5).
  let effective_action: ActionType | null = null;
  let disposition: Disposition | null = null;
  if (matchResult.winning_rule_id && matchResult.winning_branch_max_action !== null) {
    const row = await ruleRegistryService.get(
      { org_id: input.org_id, rule_id: matchResult.winning_rule_id },
      ctx,
    );
    if (!row) {
      throw new Error(
        `evaluateAndDispatch: winning rule ${matchResult.winning_rule_id} absent from rule_registry`,
      );
    }
    const ruleRegistryRow: RuleRegistryRow = { id: row.id, current_rung: row.current_rung };
    const limitContext: LimitContext = {};
    effective_action = gate(matchResult, ruleRegistryRow, limitContext);
    disposition = dispositionForAction(effective_action);
  }

  // 3. Append to rule_evaluation_log — AFTER the gate (the row needs effective_action).
  const { ids: logRowIds } = await ruleEvaluationService.recordEvaluation(
    {
      org_id: input.org_id,
      matchResult,
      effectiveAction: effective_action,
      disposition,
      traceId: ctx.trace_id,
    },
    ctx,
  );

  // 4. Counter update for the winner — a separate mutating call / transaction (OQ-3a).
  //    Skipped for a pure almost_match (no winner).
  if (matchResult.winning_rule_id) {
    await ruleTrackRecordService.recordEvaluation(
      {
        rule_id: matchResult.winning_rule_id,
        classification: matchResult.match_classification,
        disposition: disposition ?? 'pending',
      },
      ctx,
    );
  }

  return { skipped: false, matchResult, effective_action, disposition, logRowIds };
}
