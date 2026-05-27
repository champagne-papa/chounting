// apps/web/src/core/rules/evaluator.ts
//
// Pure-core evaluator entry point (ADR-0025 §4 / rule-type-core §7). Pure,
// deterministic, reproducible byte-for-byte: the same (rules, context) yields an
// identical MatchResult on every call. That determinism is the INV-RULE-002
// property (asserted in the unit suite). Imports only ./ and shared/ — never
// db / services / agent.

import type {
  AlmostMatchRule,
  MatchClassification,
  MatchResult,
  WinningBranchType,
} from '@/shared/rules/types';
import { branchesInOrder, conditionMatches, firstMatchingBranch } from './branchEvaluator';
import { buildRuleMatch, sortMatches, type RuleMatch } from './conflictResolver';
import type { Branch, Condition, EvaluationContext, Rule } from './types';

function winningBranchType(branch: Branch): WinningBranchType {
  // §5.7: a winning `otherwise_if` branch classifies as `guardrail`.
  return branch.branch_type === 'primary' ? 'primary' : 'guardrail';
}

function classificationFor(branch: Branch): MatchClassification {
  return winningBranchType(branch) === 'primary' ? 'primary_match' : 'guardrail_match';
}

function conditionRef(condition: Condition): string {
  return `${condition.condition_type}:${condition.target_field}`;
}

/** Closest branch = most passing conditions; tiebreak lowest branch_order. Diagnostic only. */
function buildAlmostMatch(rule: Rule, context: EvaluationContext): AlmostMatchRule {
  let closest: Branch | null = null;
  let bestPassCount = -1;
  for (const branch of branchesInOrder(rule)) {
    let passCount = 0;
    for (const condition of branch.conditions) {
      if (conditionMatches(condition, context)) passCount += 1;
    }
    // Strict `>` keeps the lowest branch_order on ties (the walk is ascending).
    if (passCount > bestPassCount) {
      bestPassCount = passCount;
      closest = branch;
    }
  }
  const failed_conditions =
    closest === null
      ? []
      : [...closest.conditions]
          .sort((a, b) => a.condition_order - b.condition_order)
          .filter((condition) => !conditionMatches(condition, context))
          .map(conditionRef);
  return {
    rule_id: rule.id,
    closest_branch_id: closest === null ? '' : String(closest.branch_order),
    failed_conditions,
  };
}

function byRuleId(a: AlmostMatchRule, b: AlmostMatchRule): number {
  return a.rule_id < b.rule_id ? -1 : a.rule_id > b.rule_id ? 1 : 0;
}

/**
 * Evaluate the pre-filtered candidate `rules` against `context`. The service layer
 * has already restricted `rules` to those whose Trigger Set includes the evaluation
 * trigger (rule-type-core §6.1 step 1); the pure core does branch + conflict logic.
 *
 * INV-RULE-002 (determinism): identical (rules, context) yields a byte-identical
 * MatchResult on every call. Verified by tests/unit/ruleEvaluator.test.ts; leaf at
 * docs/02_specs/ledger_truth_model.md#inv-rule-002.
 */
export function evaluate(rules: Rule[], context: EvaluationContext): MatchResult {
  const matches: RuleMatch[] = [];
  const nonMatching: Rule[] = [];

  for (const rule of rules) {
    const branch = firstMatchingBranch(rule, context);
    if (branch) {
      matches.push(buildRuleMatch(rule, branch));
    } else {
      nonMatching.push(rule);
    }
  }

  const sorted = sortMatches(matches);
  const winner = sorted[0] ?? null;

  const almost_match_rules = nonMatching
    .map((rule) => buildAlmostMatch(rule, context))
    .sort(byRuleId);

  const match_classification: MatchClassification = winner
    ? classificationFor(winner.branch)
    : 'almost_match';

  // Deterministic trace: sorted candidate ids (input-order-independent), matched ids
  // in resolution order, the winner, and the classification.
  const evaluation_trace: Record<string, unknown> = {
    evaluation_trigger: context.evaluation_trigger,
    source_trigger: context.source_trigger,
    candidate_rule_ids: rules.map((rule) => rule.id).slice().sort(),
    matched_rule_ids: sorted.map((match) => match.rule.id),
    winning_rule_id: winner ? winner.rule.id : null,
    match_classification,
  };

  if (!winner) {
    return {
      winning_rule_id: null,
      winning_branch: null,
      winning_branch_type: null,
      winning_branch_max_action: null,
      match_classification: 'almost_match',
      also_matched_rules: [],
      almost_match_rules,
      track_record_snapshot: {},
      four_questions_population: {},
      evaluation_trace,
    };
  }

  return {
    winning_rule_id: winner.rule.id,
    winning_branch: String(winner.branch.branch_order),
    winning_branch_type: winningBranchType(winner.branch),
    winning_branch_max_action: winner.branch.max_outcome_action,
    match_classification,
    also_matched_rules: sorted.slice(1).map((match) => match.rule.id),
    almost_match_rules,
    track_record_snapshot: {},
    four_questions_population: {},
    evaluation_trace,
  };
}
