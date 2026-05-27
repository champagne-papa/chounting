// apps/web/src/shared/rules/types.ts
//
// Boundary-crossing rule-evaluation types (ADR-0025 §5 / Decision 5).
//
// These live in shared/ — not core/ — because the Agent Ladder gate (agent/)
// imports them and ADR-0020 Block 1 forbids agent → core AND agent → db. The pure
// core (core/rules/) also cannot import db/ (Block 3: core may import shared only),
// so every db-origin enum alias the core needs is re-exported from here. This is
// the same boundary resolution as the capping table (OQ-2); see ADR-0025 §3 / §5.

import type { Database } from '@/db/types';

// --- db-origin enum aliases (single home; core + agent reach them via shared) ---
export type ActionType = Database['public']['Enums']['action_type'];
export type RuleAutonomyRung = Database['public']['Enums']['rule_autonomy_rung'];
export type RuleType = Database['public']['Enums']['rule_type'];
export type RuleLifecycleState = Database['public']['Enums']['rule_lifecycle_state'];
export type ConditionType = Database['public']['Enums']['condition_type'];
export type TriggerType = Database['public']['Enums']['trigger_type'];

// §5.4 trigger roles. Evaluation Triggers are what rule evaluation runs against;
// a Rule's Trigger Set contains only these two. The remaining trigger_type values
// are Proposal-Source triggers, filtered via a source_trigger_equals Condition —
// never via trigger lookup.
export type EvaluationTrigger = Extract<
  TriggerType,
  'proposed_mutation_generated' | 'proposed_mutation_bundle_generated'
>;
export type SourceTrigger = TriggerType;

// --- MatchResult (rule-type-core §5.7) ---
export type MatchClassification = 'primary_match' | 'guardrail_match' | 'almost_match';

// §5.7: a winning `otherwise_if` branch classifies as `guardrail` — so the
// MatchResult's winning_branch_type is `primary | guardrail`, NOT the stored
// `primary | otherwise_if` Branch.branch_type.
export type WinningBranchType = 'primary' | 'guardrail';

export type AlmostMatchRule = {
  rule_id: string;
  /** The branch with the most passing conditions (tiebreak: lowest branch_order). */
  closest_branch_id: string;
  /** Refs (`<condition_type>:<target_field>`) of the closest branch's failing conditions, in condition_order. */
  failed_conditions: string[];
};

export type MatchResult = {
  winning_rule_id: string | null;
  /** Reference to the winning branch by branch_order (string), or null. */
  winning_branch: string | null;
  winning_branch_type: WinningBranchType | null;
  winning_branch_max_action: ActionType | null;
  // NO effective_action — the gate's output, not the pure core's
  // (rule-type-core §6.1.1; ADR-0025 §4).
  match_classification: MatchClassification;
  /** Rules that matched a branch but lost conflict resolution, in full resolution order. */
  also_matched_rules: string[];
  /** Rules whose trigger matched but no branch matched, sorted by rule_id. */
  almost_match_rules: AlmostMatchRule[];
  // Shapes settled by downstream consumers (services / Ring 2A-authoring); jsonb at
  // the substrate (ADR-0024 rule_evaluation_log.evaluation_trace), so structurally open.
  track_record_snapshot: Record<string, unknown>;
  four_questions_population: Record<string, unknown>;
  evaluation_trace: Record<string, unknown>;
};

export type EvaluationSkippedReason =
  | 'system_ceiling_class'
  | 'system_ceiling_reversal';

// Defensive-guard return for ceiling-class proposals that should never reach the
// evaluator (rule-type-core §5.6 / §6.3). Not logged to rule_evaluation_log (ADR-0025 §6).
export type EvaluationSkipped = {
  skipped: true;
  reason: EvaluationSkippedReason;
};
