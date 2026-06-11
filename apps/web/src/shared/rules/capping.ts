// apps/web/src/shared/rules/capping.ts
//
// §6.1 step-3 capping table (rule-type-core.md, verbatim) as a pure function.
// ADR-0025 §3 / Decision 3. Pure; imports only from shared/.
//
// Used in two places: the pure-core conflict resolver (step-4b tiebreak) and the
// Agent Ladder gate (step-7 authoritative). Lives in shared/ because agent ↛ core
// (ADR-0020 Block 1) — the OQ-2 boundary resolution.

import type { ActionType, RuleAutonomyRung } from './types';

function assertNever(value: never): never {
  throw new Error(`cap: unhandled enum value "${String(value)}"`);
}

/**
 * Cap a rule branch's `max_outcome_action` against the registry's `current_rung`,
 * per the canonical 9-row table. The three conservative actions
 * (block / route / suggest) pass through unchanged at any rung; the two
 * `auto_post_at_rung_*` actions are rung-capped (a higher rung never elevates).
 *
 * v1 asymmetry: at v1, `current_rung` is only `always_confirm`, so every
 * `auto_post_at_rung_*` caps to `suggest_with_required_approval`.
 */
export function cap(
  maxOutcomeAction: ActionType,
  currentRung: RuleAutonomyRung,
): ActionType {
  switch (maxOutcomeAction) {
    // Conservative actions pass through at any rung.
    case 'block_with_reason':
    case 'route_to_exception_queue_with_reason':
    case 'suggest_with_required_approval':
      return maxOutcomeAction;
    case 'auto_post_at_rung_2':
      switch (currentRung) {
        case 'silent_auto':
        case 'notify_and_auto_post':
          return 'auto_post_at_rung_2';
        case 'always_confirm':
          return 'suggest_with_required_approval';
        default:
          return assertNever(currentRung);
      }
    case 'auto_post_at_rung_3':
      switch (currentRung) {
        case 'silent_auto':
          return 'auto_post_at_rung_3';
        case 'notify_and_auto_post':
          return 'auto_post_at_rung_2';
        case 'always_confirm':
          return 'suggest_with_required_approval';
        default:
          return assertNever(currentRung);
      }
    default:
      return assertNever(maxOutcomeAction);
  }
}
