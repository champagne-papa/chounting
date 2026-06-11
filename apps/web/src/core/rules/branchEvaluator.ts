// apps/web/src/core/rules/branchEvaluator.ts
//
// Branch evaluation (ADR-0025 §4 / rule-type-core §6.1 step 2). Pure.

import { PREDICATES } from './predicates';
import type { Branch, Condition, EvaluationContext, Rule } from './types';

function resolveContextValue(condition: Condition, context: EvaluationContext): unknown {
  // source_trigger_equals matches the proposal's source trigger; every other
  // condition addresses EvaluationContext.fields by target_field.
  if (condition.condition_type === 'source_trigger_equals') {
    return context.source_trigger;
  }
  return context.fields[condition.target_field];
}

export function conditionMatches(condition: Condition, context: EvaluationContext): boolean {
  const predicate = PREDICATES[condition.condition_type];
  if (!predicate) {
    // A v1 rule must use only the six pattern predicates; temporal/inferential
    // types defer to Ring 2B. Fail loud on misuse (deterministic).
    throw new Error(
      `branchEvaluator: no v1 pure-core predicate for condition_type "${condition.condition_type}" (Ring 2B).`,
    );
  }
  return predicate.evaluate(condition.condition_value, resolveContextValue(condition, context));
}

function conditionsInOrder(branch: Branch): Condition[] {
  return [...branch.conditions].sort((a, b) => a.condition_order - b.condition_order);
}

/** A branch matches when its trigger filters admit the context and all conditions pass (AND). */
export function branchMatches(branch: Branch, context: EvaluationContext): boolean {
  if (!branch.applies_to_evaluation_triggers.includes(context.evaluation_trigger)) {
    return false;
  }
  if (
    branch.applies_to_source_triggers !== null &&
    !branch.applies_to_source_triggers.includes(context.source_trigger)
  ) {
    return false;
  }
  return conditionsInOrder(branch).every((condition) => conditionMatches(condition, context));
}

export function branchesInOrder(rule: Rule): Branch[] {
  return [...rule.branches].sort((a, b) => a.branch_order - b.branch_order);
}

/** First matching branch in branch_order (primary precedes otherwise_if by order), or null. */
export function firstMatchingBranch(rule: Rule, context: EvaluationContext): Branch | null {
  for (const branch of branchesInOrder(rule)) {
    if (branchMatches(branch, context)) return branch;
  }
  return null;
}
