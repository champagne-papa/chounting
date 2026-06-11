// apps/web/tests/unit/ruleBranchEvaluator.test.ts
// Branch evaluation (ADR-0025 §4 / §6.1 step 2).

import { describe, expect, it } from 'vitest';

import {
  branchMatches,
  conditionMatches,
  firstMatchingBranch,
} from '@/core/rules/branchEvaluator';
import { cond, ctx, makeBranch, makeRule } from '../fixtures/rules';

describe('branchMatches — condition AND + trigger filters', () => {
  it('matches when all conditions pass', () => {
    const branch = makeBranch({
      conditions: [cond('field_equals', 'vendor', 'Amazon', 0), cond('field_in_range', 'amount', { min: 0, max: 500 }, 1)],
    });
    expect(branchMatches(branch, ctx({ vendor: 'Amazon', amount: 250 }))).toBe(true);
  });

  it('fails when any condition fails (AND semantics)', () => {
    const branch = makeBranch({
      conditions: [cond('field_equals', 'vendor', 'Amazon', 0), cond('field_in_range', 'amount', { min: 0, max: 500 }, 1)],
    });
    expect(branchMatches(branch, ctx({ vendor: 'Amazon', amount: 750 }))).toBe(false);
  });

  it('filters by evaluation trigger', () => {
    const branch = makeBranch({ applies_to_evaluation_triggers: ['proposed_mutation_bundle_generated'], conditions: [] });
    // ctx default evaluation_trigger is proposed_mutation_generated.
    expect(branchMatches(branch, ctx({}))).toBe(false);
  });

  it('filters by source trigger when applies_to_source_triggers is set', () => {
    const branch = makeBranch({ applies_to_source_triggers: ['scheduled_time_occurs'], conditions: [] });
    expect(branchMatches(branch, ctx({}, { source_trigger: 'agent_proposal' }))).toBe(false);
    expect(branchMatches(branch, ctx({}, { source_trigger: 'scheduled_time_occurs' }))).toBe(true);
  });

  it('null source-trigger filter applies to any source', () => {
    const branch = makeBranch({ applies_to_source_triggers: null, conditions: [] });
    expect(branchMatches(branch, ctx({}, { source_trigger: 'external_event_ingested' }))).toBe(true);
  });

  it('source_trigger_equals condition reads the context source trigger', () => {
    const branch = makeBranch({
      conditions: [cond('source_trigger_equals', 'source_trigger', 'scheduled_time_occurs', 0)],
    });
    expect(branchMatches(branch, ctx({}, { source_trigger: 'scheduled_time_occurs' }))).toBe(true);
    expect(branchMatches(branch, ctx({}, { source_trigger: 'agent_proposal' }))).toBe(false);
  });
});

describe('firstMatchingBranch — first-match-wins in branch_order', () => {
  function spotifyShapedRule() {
    return makeRule({
      branches: [
        makeBranch({
          branch_order: 0,
          branch_type: 'primary',
          conditions: [cond('field_equals', 'vendor', 'Spotify', 0), cond('field_in_range', 'amount', { min: 0, max: 100 }, 1)],
        }),
        makeBranch({
          branch_order: 1,
          branch_type: 'otherwise_if',
          conditions: [cond('field_equals', 'vendor', 'Spotify', 0), cond('field_outside_range', 'amount', { min: 0, max: 100 }, 1)],
        }),
      ],
    });
  }

  it('returns the primary branch when it matches', () => {
    const b = firstMatchingBranch(spotifyShapedRule(), ctx({ vendor: 'Spotify', amount: 50 }));
    expect(b?.branch_order).toBe(0);
    expect(b?.branch_type).toBe('primary');
  });

  it('falls through to otherwise_if when primary fails', () => {
    const b = firstMatchingBranch(spotifyShapedRule(), ctx({ vendor: 'Spotify', amount: 1399 }));
    expect(b?.branch_order).toBe(1);
    expect(b?.branch_type).toBe('otherwise_if');
  });

  it('returns null when no branch matches', () => {
    const rule = makeRule({ branches: [makeBranch({ conditions: [cond('field_equals', 'vendor', 'Costco', 0)] })] });
    expect(firstMatchingBranch(rule, ctx({ vendor: 'Amazon' }))).toBeNull();
  });

  it('honors branch_order regardless of array order', () => {
    const rule = makeRule({
      branches: [
        makeBranch({ branch_order: 1, branch_type: 'otherwise_if', conditions: [] }),
        makeBranch({ branch_order: 0, branch_type: 'primary', conditions: [] }),
      ],
    });
    expect(firstMatchingBranch(rule, ctx({}))?.branch_order).toBe(0);
  });
});

describe('conditionMatches — unimplemented (Ring 2B) predicate', () => {
  it('throws for a temporal/inferential condition_type', () => {
    expect(() =>
      conditionMatches(cond('semantic_match_above_threshold', 'x', 0.5, 0), ctx({ x: 1 })),
    ).toThrow(/Ring 2B/);
  });
});
