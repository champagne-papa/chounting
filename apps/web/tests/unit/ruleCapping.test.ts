// apps/web/tests/unit/ruleCapping.test.ts
// §6.1 step-3 capping table (ADR-0025 §3 / Decision 3).

import { describe, expect, it } from 'vitest';

import { cap } from '@/shared/rules/capping';
import type { ActionType, RuleAutonomyRung } from '@/shared/rules/types';

describe('cap — the 9-row §6.1 step-3 table', () => {
  const rungSensitiveRows: Array<[ActionType, RuleAutonomyRung, ActionType]> = [
    ['auto_post_at_rung_3', 'silent_auto', 'auto_post_at_rung_3'],
    ['auto_post_at_rung_3', 'notify_and_auto_post', 'auto_post_at_rung_2'],
    ['auto_post_at_rung_3', 'always_confirm', 'suggest_with_required_approval'],
    ['auto_post_at_rung_2', 'silent_auto', 'auto_post_at_rung_2'],
    ['auto_post_at_rung_2', 'notify_and_auto_post', 'auto_post_at_rung_2'],
    ['auto_post_at_rung_2', 'always_confirm', 'suggest_with_required_approval'],
  ];

  it.each(rungSensitiveRows)('cap(%s, %s) = %s', (maxAction, rung, expected) => {
    expect(cap(maxAction, rung)).toBe(expected);
  });

  const allRungs: RuleAutonomyRung[] = ['silent_auto', 'notify_and_auto_post', 'always_confirm'];
  const conservativeActions: ActionType[] = [
    'suggest_with_required_approval',
    'route_to_exception_queue_with_reason',
    'block_with_reason',
  ];

  it('conservative actions pass through unchanged at any rung (rows 7–9)', () => {
    for (const action of conservativeActions) {
      for (const rung of allRungs) {
        expect(cap(action, rung)).toBe(action);
      }
    }
  });

  it('v1 asymmetry: every auto_post_* caps to suggest at always_confirm', () => {
    expect(cap('auto_post_at_rung_2', 'always_confirm')).toBe('suggest_with_required_approval');
    expect(cap('auto_post_at_rung_3', 'always_confirm')).toBe('suggest_with_required_approval');
  });
});
