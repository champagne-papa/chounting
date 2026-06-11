// apps/web/src/core/rules/conflictResolver.ts
//
// Conflict resolution (ADR-0025 §4 / rule-type-core §6.1 step 4). Pure.
// Total ordering: (4a) specificity desc → (4b) conservatism of the capped
// tiebreak action → (4c) recency desc → (4d) stable UUID asc.

import { cap } from '@/shared/rules/capping';
import type { ActionType } from '@/shared/rules/types';
import { PREDICATES } from './predicates';
import type { Branch, Rule } from './types';

export type RuleMatch = {
  rule: Rule;
  branch: Branch;
  specificity: number;
  tiebreakEffectiveAction: ActionType;
};

// Most-conservative first (4b). Index = conservatism rank; lower rank wins.
const CONSERVATISM_ORDER: readonly ActionType[] = [
  'block_with_reason',
  'route_to_exception_queue_with_reason',
  'suggest_with_required_approval',
  'auto_post_at_rung_2',
  'auto_post_at_rung_3',
];

function conservatismRank(action: ActionType): number {
  return CONSERVATISM_ORDER.indexOf(action);
}

/** (4a) specificity = sum of the matched branch's condition specificity weights. */
export function branchSpecificity(branch: Branch): number {
  return branch.conditions.reduce((sum, condition) => {
    const predicate = PREDICATES[condition.condition_type];
    return sum + (predicate ? predicate.specificityWeight : 0);
  }, 0);
}

/** (4c) recency anchor = COALESCE(promoted_at, created_at); ISO strings sort chronologically. */
function recencyKey(rule: Rule): string {
  return rule.promoted_at ?? rule.created_at;
}

export function buildRuleMatch(rule: Rule, branch: Branch): RuleMatch {
  return {
    rule,
    branch,
    specificity: branchSpecificity(branch),
    tiebreakEffectiveAction: cap(branch.max_outcome_action, rule.current_rung),
  };
}

export function compareMatches(a: RuleMatch, b: RuleMatch): number {
  if (a.specificity !== b.specificity) return b.specificity - a.specificity; // 4a desc
  const ra = conservatismRank(a.tiebreakEffectiveAction);
  const rb = conservatismRank(b.tiebreakEffectiveAction);
  if (ra !== rb) return ra - rb; // 4b most-conservative wins (lower rank first)
  const ka = recencyKey(a.rule);
  const kb = recencyKey(b.rule);
  // 4c recency: the most-recent (later timestamp) wins, so this comparator is
  // intentionally INVERTED — `a` older ⇒ `a` sorts AFTER `b`. Do not "simplify"
  // to the natural ascending `-1 : 1`; that would break §6.1 step 4c semantics.
  if (ka !== kb) return ka < kb ? 1 : -1;
  if (a.rule.id !== b.rule.id) return a.rule.id < b.rule.id ? -1 : 1; // 4d stable UUID asc
  return 0;
}

/** Full conflict-resolution order; the winner is index 0. Pure / total / deterministic. */
export function sortMatches(matches: RuleMatch[]): RuleMatch[] {
  return [...matches].sort(compareMatches);
}
