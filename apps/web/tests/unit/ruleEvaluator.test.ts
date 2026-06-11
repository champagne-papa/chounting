// apps/web/tests/unit/ruleEvaluator.test.ts
// Pure-core evaluator composition + determinism (ADR-0025 §4, §11).
// The determinism block is the INV-RULE-002 enforcement site.

import { describe, expect, it } from 'vitest';

import { evaluate } from '@/core/rules/evaluator';
import {
  amazonMatchContext,
  amazonRule,
  cond,
  costcoAlmostContext,
  costcoRule,
  ctx,
  makeBranch,
  makeRule,
  spotifyGuardrailContext,
  spotifyRule,
} from '../fixtures/rules';

describe('evaluate — canonical scenarios (ADR-0025 §11)', () => {
  it('primary match: Amazon under $500', () => {
    const result = evaluate([amazonRule], amazonMatchContext);
    expect(result.match_classification).toBe('primary_match');
    expect(result.winning_rule_id).toBe(amazonRule.id);
    expect(result.winning_branch_type).toBe('primary');
    expect(result.winning_branch).toBe('0');
    expect(result.winning_branch_max_action).toBe('auto_post_at_rung_2');
    expect(result.almost_match_rules).toEqual([]);
    // The pure core never emits effective_action (gate output, §6.1.1).
    expect('effective_action' in result).toBe(false);
  });

  it('guardrail match: Spotify $1,399 anomaly (otherwise_if → guardrail)', () => {
    const result = evaluate([spotifyRule], spotifyGuardrailContext);
    expect(result.match_classification).toBe('guardrail_match');
    expect(result.winning_rule_id).toBe(spotifyRule.id);
    expect(result.winning_branch_type).toBe('guardrail');
    expect(result.winning_branch).toBe('1');
    expect(result.winning_branch_max_action).toBe('route_to_exception_queue_with_reason');
  });

  it('almost match: trigger matched, no branch matched', () => {
    const result = evaluate([costcoRule], costcoAlmostContext);
    expect(result.match_classification).toBe('almost_match');
    expect(result.winning_rule_id).toBeNull();
    expect(result.also_matched_rules).toEqual([]);
    expect(result.almost_match_rules).toHaveLength(1);
    expect(result.almost_match_rules[0].rule_id).toBe(costcoRule.id);
    expect(result.almost_match_rules[0].closest_branch_id).toBe('0');
    expect(result.almost_match_rules[0].failed_conditions).toContain('field_in_range:amount');
  });

  it('also_matched: a lower-specificity matched rule loses but is recorded', () => {
    const high = makeRule({
      id: 'r-high',
      branches: [makeBranch({ conditions: [cond('field_equals', 'vendor', 'Amazon', 0), cond('field_in_range', 'amount', { min: 0, max: 500 }, 1)] })],
    });
    const low = makeRule({ id: 'r-low', branches: [makeBranch({ conditions: [cond('field_equals', 'vendor', 'Amazon', 0)] })] });
    const result = evaluate([low, high], ctx({ vendor: 'Amazon', amount: 250 }));
    expect(result.winning_rule_id).toBe('r-high');
    expect(result.also_matched_rules).toEqual(['r-low']);
  });
});

describe('evaluate — determinism (INV-RULE-002 enforcement site)', () => {
  const rules = [spotifyRule, amazonRule, costcoRule];
  const context = ctx({ vendor: 'Amazon', amount: 250 });

  it('same input yields byte-identical output', () => {
    const r1 = evaluate(rules, context);
    const r2 = evaluate(rules, context);
    expect(r2).toEqual(r1); // structural equality
    expect(JSON.stringify(r2)).toBe(JSON.stringify(r1)); // byte-identical serialization
  });

  it('output is invariant under candidate-input reordering (total ordering)', () => {
    const r1 = evaluate([amazonRule, spotifyRule, costcoRule], context);
    const r2 = evaluate([costcoRule, spotifyRule, amazonRule], context);
    expect(JSON.stringify(r2)).toBe(JSON.stringify(r1));
  });
});
