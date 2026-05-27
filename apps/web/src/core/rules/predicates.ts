// apps/web/src/core/rules/predicates.ts
//
// The closed predicate library (ADR-0025 §2 / Decision 2). Six v1 pattern
// condition types, each co-located with its deterministic specificity weight
// (rule-type-core §5.5). Pure; no I/O. Temporal/inferential condition types
// (schedule_matches, cadence_matches, semantic_match_above_threshold,
// category_classification_matches) defer to Ring 2B and are absent here.

import type { ConditionType } from '@/shared/rules/types';

// Specificity weights by tier (OQ-1, ratified). Closed-set > range/threshold >
// pattern. Ring 2B predicates extend this with weight constants honoring the tier
// ordering.
export const SPECIFICITY_CLOSED_SET = 3;
export const SPECIFICITY_RANGE = 2;
export const SPECIFICITY_PATTERN = 1;

export type PredicateEvaluator = (
  conditionValue: unknown,
  contextFieldValue: unknown,
) => boolean;

export type PredicateEntry = {
  evaluate: PredicateEvaluator;
  specificityWeight: number;
};

type RangeValue = { min: number | null; max: number | null };

function isRangeValue(value: unknown): value is RangeValue {
  return typeof value === 'object' && value !== null && 'min' in value && 'max' in value;
}

// Inclusive bounds on both ends (min ≤ v ≤ max); null bound = unbounded on that
// side. Non-numeric field values never satisfy a range.
function inRange(conditionValue: unknown, contextFieldValue: unknown): boolean {
  if (typeof contextFieldValue !== 'number') return false;
  if (!isRangeValue(conditionValue)) return false;
  const { min, max } = conditionValue;
  if (min !== null && contextFieldValue < min) return false;
  if (max !== null && contextFieldValue > max) return false;
  return true;
}

function matchesPattern(conditionValue: unknown, contextFieldValue: unknown): boolean {
  if (typeof conditionValue !== 'string' || typeof contextFieldValue !== 'string') {
    return false;
  }
  let regex: RegExp;
  try {
    regex = new RegExp(conditionValue);
  } catch {
    return false; // invalid pattern → no match (deterministic, never throws)
  }
  return regex.test(contextFieldValue);
}

/**
 * The v1 predicate registry. Six entries keyed by the pattern subset of
 * condition_type the pure core implements. Access via PREDICATES[type]; undefined
 * for the four Ring 2B types (branchEvaluator throws if a v1 rule references one).
 */
export const PREDICATES: Partial<Record<ConditionType, PredicateEntry>> = {
  field_equals: {
    evaluate: (conditionValue, contextFieldValue) => contextFieldValue === conditionValue,
    specificityWeight: SPECIFICITY_CLOSED_SET,
  },
  field_in_set: {
    evaluate: (conditionValue, contextFieldValue) =>
      Array.isArray(conditionValue) && conditionValue.includes(contextFieldValue),
    specificityWeight: SPECIFICITY_CLOSED_SET,
  },
  source_trigger_equals: {
    evaluate: (conditionValue, contextFieldValue) => contextFieldValue === conditionValue,
    specificityWeight: SPECIFICITY_CLOSED_SET,
  },
  field_in_range: {
    evaluate: inRange,
    specificityWeight: SPECIFICITY_RANGE,
  },
  field_outside_range: {
    evaluate: (conditionValue, contextFieldValue) =>
      typeof contextFieldValue === 'number' && !inRange(conditionValue, contextFieldValue),
    specificityWeight: SPECIFICITY_RANGE,
  },
  field_matches_pattern: {
    evaluate: matchesPattern,
    specificityWeight: SPECIFICITY_PATTERN,
  },
};
