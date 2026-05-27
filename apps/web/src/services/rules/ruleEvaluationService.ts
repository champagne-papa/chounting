// apps/web/src/services/rules/ruleEvaluationService.ts
//
// Ring 2A-core Commit 3 (ADR-0025 §6 / Decision 6). Two-method shape (OQ-3c):
//   evaluate(...)         — read candidates + assemble Rule[] + run the pure core.
//                           NO log write.
//   recordEvaluation(...) — the SOLE append site for rule_evaluation_log
//                           (INV-RULE-003). Row-per-candidate-rule.
//
// The ownership split is load-bearing (ADR-0025 §7): the service owns the append
// operation; the ORCHESTRATOR owns *when* it fires (after the gate, because the
// row needs effective_action, which exists only post-gate). recordEvaluation
// must not collapse into evaluate.
//
// services → core is the legal edge (ADR-0020 Appendix A); evaluate composes the
// pure-core evaluator from core/rules/. services ↛ agent: the gate is not called
// here (the orchestrator, agent layer, calls it).

import { adminClient } from '@/db/adminClient';
import type { ServiceContext } from '@/services/middleware/serviceContext';
import { withInvariants } from '@/services/middleware/withInvariants';
import { ServiceError } from '@/services/errors/ServiceError';
import { loggerWith } from '@/shared/logger/pino';
import { evaluate as evaluateCore } from '@/core/rules/evaluator';
import type { Branch, EvaluationContext, Rule } from '@/core/rules/types';
import type {
  ActionType,
  EvaluationSkipped,
  EvaluationSkippedReason,
  MatchResult,
} from '@/shared/rules/types';
import type { Disposition } from '@/shared/rules/disposition';
import type { Database } from '@/db/types';
import type { ProposedMutation } from '@/shared/schemas/accounting/proposedMutation.schema';

type RuleRegistryFullRow = Database['public']['Tables']['rule_registry']['Row'];

// --- Assembly seam (locked decision Q1 / Option 1; ADR-0025 Decision 1 + 11) ---
//
// "Branch/Condition are typed fixtures / service-assembled objects" — there is no
// predicate-storage substrate this arc. assembleRules() maps rule_registry rows to
// core Rule[] and sources their branches from this seam. The v1 production default
// is a no-op (→ branchless rules → almost_match / no candidate triggers), so the
// evaluator's matching is structurally inert in production until Ring 2B lands the
// Branch substrate. Tests inject a fixture-backed branchSource (via input) to
// exercise real matching end-to-end. The orchestrator threads it through.
export type BranchSource = (registryRow: RuleRegistryFullRow) => Branch[];
const noBranchSource: BranchSource = () => [];

function assembleRules(rows: RuleRegistryFullRow[], branchSource: BranchSource): Rule[] {
  return rows.map((row) => ({
    id: row.id,
    org_id: row.org_id,
    rule_type: row.rule_type,
    current_rung: row.current_rung,
    lifecycle_state: row.lifecycle_state,
    name: row.name,
    promoted_at: row.promoted_at,
    demoted_at: row.demoted_at,
    retired_at: row.retired_at,
    created_at: row.created_at,
    branches: branchSource(row),
  }));
}

// JUDGMENT CALL (review): proposal → EvaluationContext field mapping. The
// proposal's params are flattened as-is into addressable fields (so a Condition's
// target_field reads e.g. 'vendor_id' / 'amount', the real param names). There is
// NO vendor-name resolution at v1 (vendor_id is a uuid, not 'Amazon') — that's a
// Ring 2B concern, and moot at v1 since production matching is branchless. The
// service e2e test therefore builds branches whose conditions reference the real
// param field names (vendor_id/amount), not the name-based pure-core unit fixtures.
function proposalToContext(proposal: ProposedMutation): EvaluationContext {
  return {
    // ProposedMutation (single) corresponds to the proposed_mutation_generated
    // evaluation trigger; agent_proposal is the source trigger.
    evaluation_trigger: 'proposed_mutation_generated',
    source_trigger: 'agent_proposal',
    fields: {
      proposal_type: proposal.proposal_type,
      ...(proposal.params as Record<string, unknown>),
    },
  };
}

// JUDGMENT CALL (review): §5.6 / §6.3 ceiling-class defensive guard. The v1
// ProposedMutation union (post_bill | record_bill_payment) carries NO ceiling /
// reversal marker, and neither type is system-ceiling-class — so this returns null
// for every v1 proposal and the EvaluationSkipped path is unreachable by
// construction. It is forward-safe scaffolding: when reversal / ceiling proposal
// types are added to the union, classifyCeiling extends to return
// 'system_ceiling_reversal' / 'system_ceiling_class' and the guard begins firing.
function classifyCeiling(_proposal: ProposedMutation): EvaluationSkippedReason | null {
  return null;
}

export const ruleEvaluationService = {
  /**
   * Read active rule_registry candidates for the org, assemble Rule[] (branches via
   * the seam), and run the pure-core evaluator. Returns a MatchResult, or
   * EvaluationSkipped for a ceiling/reversal-class proposal (no log write either way).
   *
   * JUDGMENT CALL (review): org_id is carried in `input` (not derived from ctx) per
   * the service-layer org-scoping convention — ServiceContext exposes caller.org_ids
   * (a list), not a single scope, so the ADR's evaluate(proposal, ctx) is realized as
   * evaluate({ proposal, org_id, branchSource? }, ctx).
   */
  evaluate: withInvariants(async (
    input: { proposal: ProposedMutation; org_id: string; branchSource?: BranchSource },
    ctx: ServiceContext,
  ): Promise<MatchResult | EvaluationSkipped> => {
    const log = loggerWith({ trace_id: ctx.trace_id, user_id: ctx.caller.user_id });

    const skipReason = classifyCeiling(input.proposal);
    if (skipReason) {
      return { skipped: true, reason: skipReason };
    }

    const context = proposalToContext(input.proposal);
    const db = adminClient();

    // §6.1 step-1 candidate set: active rules for the org. Branch-level trigger
    // filtering happens inside the pure core (branchEvaluator).
    const { data, error } = await db
      .from('rule_registry')
      .select('*')
      .eq('org_id', input.org_id)
      .eq('lifecycle_state', 'active');
    if (error) throw new ServiceError('READ_FAILED', error.message);
    const rows = (data ?? []) as RuleRegistryFullRow[];

    const rules = assembleRules(rows, input.branchSource ?? noBranchSource);
    const result = evaluateCore(rules, context);

    // Enrich track_record_snapshot for the winner (Decision 6: evaluate reads the
    // rule_track_records snapshot; the pure core leaves the field as {}).
    if (result.winning_rule_id) {
      const { data: tr, error: trErr } = await db
        .from('rule_track_records')
        .select('*')
        .eq('rule_id', result.winning_rule_id)
        .maybeSingle();
      if (trErr) throw new ServiceError('READ_FAILED', trErr.message);
      if (tr) result.track_record_snapshot = tr as Record<string, unknown>;
    }

    log.info(
      { org_id: input.org_id, candidates: rows.length, classification: result.match_classification },
      'rule evaluation complete',
    );
    return result;
  }),

  /**
   * SOLE append site for rule_evaluation_log (INV-RULE-003). Expands the MatchResult
   * into a row-per-candidate-rule set (winner + also_matched + almost_match) sharing
   * one trace_id; winner-attribute columns are populated on the winning row and null
   * on non-winners (ADR-0025 §6 logging semantics).
   *
   * JUDGMENT CALLS (review):
   *  - match_classification per row: the winner and also_matched rows carry the
   *    OVERALL result.match_classification (denormalized — MatchResult.also_matched_rules
   *    is a string[] with no per-rule type); almost_match rows carry 'almost_match'.
   *    The winner is distinguished by its non-null winner-attribute columns, not by
   *    match_classification.
   *  - evaluation_trace per row: the winner row stores result.evaluation_trace; an
   *    almost_match row stores { closest_branch_id, failed_conditions }; an also_matched
   *    row stores {}.
   *  - proposed_mutation_id: null at v1 (ProposedMutation is not a persisted
   *    proposed_mutations row in this flow; the column is nullable). Accepts an optional
   *    override for when the pipeline persists proposals.
   *  - zero candidate rows (no winner, no also_matched, no almost_match) → no insert,
   *    returns { ids: [] } (Decision 6: "no trigger match writes no row").
   */
  recordEvaluation: withInvariants(async (
    input: {
      org_id: string;
      matchResult: MatchResult;
      effectiveAction: ActionType | null;
      disposition: Disposition | null;
      proposedMutationId?: string | null;
      traceId?: string;
    },
    ctx: ServiceContext,
  ): Promise<{ ids: string[] }> => {
    const db = adminClient();
    const mr = input.matchResult;
    const trace_id = input.traceId ?? ctx.trace_id;
    const proposed_mutation_id = input.proposedMutationId ?? null;

    type LogInsert = Database['public']['Tables']['rule_evaluation_log']['Insert'];
    const rows: LogInsert[] = [];

    if (mr.winning_rule_id) {
      rows.push({
        org_id: input.org_id,
        rule_id: mr.winning_rule_id,
        trace_id,
        proposed_mutation_id,
        match_classification: mr.match_classification,
        winning_branch_type: mr.winning_branch_type,
        winning_branch_max_action: mr.winning_branch_max_action,
        effective_action: input.effectiveAction,
        disposition: input.disposition,
        evaluation_trace: mr.evaluation_trace as LogInsert['evaluation_trace'],
      });
    }

    for (const ruleId of mr.also_matched_rules) {
      rows.push({
        org_id: input.org_id,
        rule_id: ruleId,
        trace_id,
        proposed_mutation_id,
        match_classification: mr.match_classification,
        winning_branch_type: null,
        winning_branch_max_action: null,
        effective_action: null,
        disposition: null,
        evaluation_trace: {},
      });
    }

    for (const almost of mr.almost_match_rules) {
      rows.push({
        org_id: input.org_id,
        rule_id: almost.rule_id,
        trace_id,
        proposed_mutation_id,
        match_classification: 'almost_match',
        winning_branch_type: null,
        winning_branch_max_action: null,
        effective_action: null,
        disposition: null,
        evaluation_trace: {
          closest_branch_id: almost.closest_branch_id,
          failed_conditions: almost.failed_conditions,
        } as LogInsert['evaluation_trace'],
      });
    }

    if (rows.length === 0) {
      return { ids: [] };
    }

    const { data, error } = await db
      .from('rule_evaluation_log')
      .insert(rows)
      .select('id');
    if (error) throw new ServiceError('POST_FAILED', error.message);
    return { ids: (data ?? []).map((r) => (r as { id: string }).id) };
  }),
};
