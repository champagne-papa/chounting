// apps/web/tests/unit/agentLadderStubs.test.ts
// Agent Ladder limit stubs (ADR-0025 §5 / Decision 5).
//
// All three stubs ship defined-but-inert at v1 (`// activates post-v1`): each is
// a pass-through identity over ActionType. These tests pin the v1 contract —
// 5 ActionType values × 3 stubs = 15 assertions — so an accidental edit to a
// stub body before its activation arc fails loudly with a precise surface.

import { describe, expect, it } from 'vitest';

import {
  checkDailyAggregate,
  checkPerTransactionLimit,
  checkTrackRecordHealth,
} from '@/agent/policies/agent-ladder/stubs';
import type { LimitContext } from '@/agent/policies/agent-ladder/stubs';
import type { ActionType } from '@/shared/rules/types';

const emptyCtx: LimitContext = {};

const allActions: ActionType[] = [
  'auto_post_at_rung_2',
  'auto_post_at_rung_3',
  'suggest_with_required_approval',
  'route_to_exception_queue_with_reason',
  'block_with_reason',
];

const stubs: Array<[string, (action: ActionType, ctx: LimitContext) => ActionType]> = [
  ['checkPerTransactionLimit', checkPerTransactionLimit],
  ['checkDailyAggregate', checkDailyAggregate],
  ['checkTrackRecordHealth', checkTrackRecordHealth],
];

describe('agent-ladder limit stubs — v1 pass-through identity', () => {
  for (const [name, stub] of stubs) {
    it(`${name} returns the input action unchanged for all ActionType values`, () => {
      for (const action of allActions) {
        expect(stub(action, emptyCtx)).toBe(action);
      }
    });
  }
});
