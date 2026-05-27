// apps/web/src/shared/rules/disposition.ts
//
// Maps a gate-produced effective_action to the rule_evaluation_log.disposition
// value (ADR-0025 §6 logging semantics). Grounded against the
// rule_evaluation_30d_view disposition_* count columns (20240164 substrate).
//
// Pure; lives in shared/rules/ because the orchestrator (agent layer) computes
// the disposition and ruleEvaluationService (services layer) persists it — the
// agent ↛ services type-sharing routes through shared/, the same boundary
// resolution as capping.ts / types.ts (ADR-0020 / ADR-0025 §5 Decision 5).

import type { ActionType } from './types';

/** rule_evaluation_log.disposition value set (mirrors rule_evaluation_30d_view counts). */
export type Disposition = 'auto_posted' | 'blocked' | 'routed' | 'pending';

/**
 * effective_action → disposition. At v1 `current_rung` is only `always_confirm`,
 * so the gate's effective_action is always `suggest_with_required_approval`
 * → `'pending'`; the auto_post / block / route arms activate post-v1.
 */
export function dispositionForAction(action: ActionType): Disposition {
  switch (action) {
    case 'auto_post_at_rung_2':
    case 'auto_post_at_rung_3':
      return 'auto_posted';
    case 'block_with_reason':
      return 'blocked';
    case 'route_to_exception_queue_with_reason':
      return 'routed';
    case 'suggest_with_required_approval':
      return 'pending';
  }
}
