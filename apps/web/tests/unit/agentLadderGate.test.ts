// apps/web/tests/unit/agentLadderGate.test.ts
// Agent Ladder gate composition (ADR-0025 §5 / Decision 5).
//
// At v1 the three limit stubs are pass-through, so gate() output equals
// cap(winning_branch_max_action, current_rung). These tests mirror the structure
// of ruleCapping.test.ts (the §6.1 step-3 table) on the gate side — 6
// rung-sensitive rows + a 3×3 conservative pass-through loop + the v1-asymmetry
// block — plus the gate-specific defensive-throw and determinism cases.

import { describe, expect, it } from 'vitest';

import { gate } from '@/agent/policies/agent-ladder/gate';
import type { LimitContext } from '@/agent/policies/agent-ladder/stubs';
import type {
  ActionType,
  MatchResult,
  RuleAutonomyRung,
  RuleRegistryRow,
} from '@/shared/rules/types';

const emptyCtx: LimitContext = {};

/** Minimal MatchResult; the gate reads only winning_branch_max_action. */
function makeMatchResult(max: ActionType | null): MatchResult {
  return {
    winning_rule_id: max === null ? null : 'rule-1',
    winning_branch: max === null ? null : '1',
    winning_branch_type: max === null ? null : 'primary',
    winning_branch_max_action: max,
    match_classification: max === null ? 'almost_match' : 'primary_match',
    also_matched_rules: [],
    almost_match_rules: [],
    track_record_snapshot: {},
    four_questions_population: {},
    evaluation_trace: {},
  };
}

function makeRegistryRow(rung: RuleAutonomyRung): RuleRegistryRow {
  return { id: 'reg-1', current_rung: rung };
}

describe('gate — §6.1 step-7 composition (v1: stubs inert ⇒ output = cap)', () => {
  const rungSensitiveRows: Array<[ActionType, RuleAutonomyRung, ActionType]> = [
    ['auto_post_at_rung_3', 'silent_auto', 'auto_post_at_rung_3'],
    ['auto_post_at_rung_3', 'notify_and_auto_post', 'auto_post_at_rung_2'],
    ['auto_post_at_rung_3', 'always_confirm', 'suggest_with_required_approval'],
    ['auto_post_at_rung_2', 'silent_auto', 'auto_post_at_rung_2'],
    ['auto_post_at_rung_2', 'notify_and_auto_post', 'auto_post_at_rung_2'],
    ['auto_post_at_rung_2', 'always_confirm', 'suggest_with_required_approval'],
  ];

  it.each(rungSensitiveRows)('gate(max=%s, rung=%s) = %s', (maxAction, rung, expected) => {
    expect(gate(makeMatchResult(maxAction), makeRegistryRow(rung), emptyCtx)).toBe(expected);
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
        expect(gate(makeMatchResult(action), makeRegistryRow(rung), emptyCtx)).toBe(action);
      }
    }
  });

  it('v1 asymmetry: every auto_post_* caps to suggest at always_confirm', () => {
    expect(
      gate(makeMatchResult('auto_post_at_rung_2'), makeRegistryRow('always_confirm'), emptyCtx),
    ).toBe('suggest_with_required_approval');
    expect(
      gate(makeMatchResult('auto_post_at_rung_3'), makeRegistryRow('always_confirm'), emptyCtx),
    ).toBe('suggest_with_required_approval');
  });
});

describe('gate — defensive boundary + determinism', () => {
  it('throws on null winning_branch_max_action (almost_match has no gate output)', () => {
    expect(() =>
      gate(makeMatchResult(null), makeRegistryRow('always_confirm'), emptyCtx),
    ).toThrow(/winning_branch_max_action is null/);
  });

  it('is deterministic: identical inputs yield identical output', () => {
    const mr = makeMatchResult('auto_post_at_rung_3');
    const row = makeRegistryRow('notify_and_auto_post');
    const first = gate(mr, row, emptyCtx);
    const second = gate(mr, row, emptyCtx);
    expect(first).toBe(second);
    expect(first).toBe('auto_post_at_rung_2');
  });
});
