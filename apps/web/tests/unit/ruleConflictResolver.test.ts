// apps/web/tests/unit/ruleConflictResolver.test.ts
// Conflict resolution 4a–4d (ADR-0025 §4 / §6.1 step 4).

import { describe, expect, it } from 'vitest';

import { branchSpecificity, buildRuleMatch, sortMatches } from '@/core/rules/conflictResolver';
import { cond, makeBranch, makeRule } from '../fixtures/rules';

describe('branchSpecificity (4a) — sum of condition weights', () => {
  it('closed-set vendor (3) + range amount (2) = 5 (the §5.5 worked example)', () => {
    const branch = makeBranch({
      conditions: [cond('field_equals', 'vendor', 'Amazon', 0), cond('field_in_range', 'amount', { min: 0, max: 500 }, 1)],
    });
    expect(branchSpecificity(branch)).toBe(5);
  });
  it('closed-set vendor alone = 3', () => {
    expect(branchSpecificity(makeBranch({ conditions: [cond('field_equals', 'vendor', 'Amazon', 0)] }))).toBe(3);
  });
  it('pattern alone = 1', () => {
    expect(branchSpecificity(makeBranch({ conditions: [cond('field_matches_pattern', 'ref', '^INV', 0)] }))).toBe(1);
  });
});

describe('sortMatches — total ordering 4a → 4b → 4c → 4d', () => {
  it('4a: higher specificity wins (5 beats 3)', () => {
    const high = makeRule({
      id: 'r-high',
      branches: [makeBranch({ conditions: [cond('field_equals', 'vendor', 'Amazon', 0), cond('field_in_range', 'amount', { min: 0, max: 500 }, 1)] })],
    });
    const low = makeRule({ id: 'r-low', branches: [makeBranch({ conditions: [cond('field_equals', 'vendor', 'Amazon', 0)] })] });
    const sorted = sortMatches([buildRuleMatch(low, low.branches[0]), buildRuleMatch(high, high.branches[0])]);
    expect(sorted[0].rule.id).toBe('r-high');
  });

  it('4b: specificity tie → most-conservative tiebreak action wins', () => {
    // Both single field_equals (spec 3), rung always_confirm.
    // block_with_reason → block (rank 0); auto_post_at_rung_2 → suggest (rank 2).
    const blocky = makeRule({ id: 'r-block', branches: [makeBranch({ max_outcome_action: 'block_with_reason', conditions: [cond('field_equals', 'v', 'x', 0)] })] });
    const posty = makeRule({ id: 'r-post', branches: [makeBranch({ max_outcome_action: 'auto_post_at_rung_2', conditions: [cond('field_equals', 'v', 'x', 0)] })] });
    const sorted = sortMatches([buildRuleMatch(posty, posty.branches[0]), buildRuleMatch(blocky, blocky.branches[0])]);
    expect(sorted[0].rule.id).toBe('r-block');
  });

  it('4c: specificity + action tie → most recent COALESCE(promoted_at, created_at) wins', () => {
    const older = makeRule({
      id: 'r-older',
      promoted_at: null,
      created_at: '2026-01-01T00:00:00Z',
      branches: [makeBranch({ max_outcome_action: 'block_with_reason', conditions: [cond('field_equals', 'v', 'x', 0)] })],
    });
    const newer = makeRule({
      id: 'r-newer',
      promoted_at: '2026-06-01T00:00:00Z',
      created_at: '2026-01-01T00:00:00Z',
      branches: [makeBranch({ max_outcome_action: 'block_with_reason', conditions: [cond('field_equals', 'v', 'x', 0)] })],
    });
    const sorted = sortMatches([buildRuleMatch(older, older.branches[0]), buildRuleMatch(newer, newer.branches[0])]);
    expect(sorted[0].rule.id).toBe('r-newer');
  });

  it('4d: full tie → stable ascending UUID order', () => {
    const common = { promoted_at: null, created_at: '2026-01-01T00:00:00Z' };
    const a = makeRule({ id: 'aaaa', ...common, branches: [makeBranch({ max_outcome_action: 'block_with_reason', conditions: [cond('field_equals', 'v', 'x', 0)] })] });
    const b = makeRule({ id: 'bbbb', ...common, branches: [makeBranch({ max_outcome_action: 'block_with_reason', conditions: [cond('field_equals', 'v', 'x', 0)] })] });
    const sorted = sortMatches([buildRuleMatch(b, b.branches[0]), buildRuleMatch(a, a.branches[0])]);
    expect(sorted.map((m) => m.rule.id)).toEqual(['aaaa', 'bbbb']);
  });
});
