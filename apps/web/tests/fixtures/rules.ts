// apps/web/tests/fixtures/rules.ts
//
// Canonical in-memory rule fixtures + builders for the pure-core evaluator unit
// suite (ADR-0025 §11 / Decision 11). No DB — typed Rule objects.

import type { Branch, Condition, EvaluationContext, Rule } from '@/core/rules/types';

const DEFAULT_ID = '00000000-0000-0000-0000-000000000000';

export function cond(
  condition_type: Condition['condition_type'],
  target_field: string,
  condition_value: unknown,
  condition_order = 0,
): Condition {
  return { condition_type, condition_order, target_field, condition_value };
}

export function makeBranch(overrides: Partial<Branch> = {}): Branch {
  return {
    branch_order: 0,
    branch_type: 'primary',
    applies_to_evaluation_triggers: ['proposed_mutation_generated'],
    applies_to_source_triggers: null,
    max_outcome_action: 'auto_post_at_rung_2',
    conditions: [],
    ...overrides,
  };
}

export function makeRule(overrides: Partial<Rule> = {}): Rule {
  return {
    id: DEFAULT_ID,
    org_id: '00000000-0000-0000-0000-000000000001',
    rule_type: 'pattern',
    current_rung: 'always_confirm',
    lifecycle_state: 'active',
    name: null,
    promoted_at: null,
    demoted_at: null,
    retired_at: null,
    created_at: '2026-04-01T00:00:00Z',
    branches: [makeBranch()],
    ...overrides,
  };
}

export function ctx(
  fields: Record<string, unknown>,
  overrides: Partial<EvaluationContext> = {},
): EvaluationContext {
  return {
    evaluation_trigger: 'proposed_mutation_generated',
    source_trigger: 'agent_proposal',
    fields,
    ...overrides,
  };
}

// --- Canonical scenarios (ADR-0025 §11) ---

// Amazon office supplies under $500 → categorize 5100 (primary-match exemplar).
export const amazonRule: Rule = makeRule({
  id: '10000000-0000-0000-0000-0000000000a1',
  name: 'Amazon office supplies under $500',
  promoted_at: '2026-05-01T00:00:00Z',
  branches: [
    makeBranch({
      branch_order: 0,
      branch_type: 'primary',
      max_outcome_action: 'auto_post_at_rung_2',
      conditions: [
        cond('field_equals', 'vendor', 'Amazon', 0),
        cond('field_in_range', 'amount', { min: 0, max: 500 }, 1),
      ],
    }),
  ],
});

// Spotify $1,399 anomaly → guardrail (otherwise_if outside the normal range).
export const spotifyRule: Rule = makeRule({
  id: '10000000-0000-0000-0000-0000000000b2',
  name: 'Spotify subscription',
  promoted_at: '2026-05-02T00:00:00Z',
  branches: [
    makeBranch({
      branch_order: 0,
      branch_type: 'primary',
      max_outcome_action: 'auto_post_at_rung_2',
      conditions: [
        cond('field_equals', 'vendor', 'Spotify', 0),
        cond('field_in_range', 'amount', { min: 0, max: 100 }, 1),
      ],
    }),
    makeBranch({
      branch_order: 1,
      branch_type: 'otherwise_if',
      max_outcome_action: 'route_to_exception_queue_with_reason',
      conditions: [
        cond('field_equals', 'vendor', 'Spotify', 0),
        cond('field_outside_range', 'amount', { min: 0, max: 100 }, 1),
      ],
    }),
  ],
});

// Costco rule whose range won't match the almost-match context (trigger matches, no branch).
export const costcoRule: Rule = makeRule({
  id: '10000000-0000-0000-0000-0000000000c3',
  name: 'Costco supplies under $500',
  created_at: '2026-04-03T00:00:00Z',
  branches: [
    makeBranch({
      conditions: [
        cond('field_equals', 'vendor', 'Costco', 0),
        cond('field_in_range', 'amount', { min: 0, max: 500 }, 1),
      ],
    }),
  ],
});

export const amazonMatchContext = ctx({ vendor: 'Amazon', amount: 250 });
export const spotifyGuardrailContext = ctx({ vendor: 'Spotify', amount: 1399 });
export const costcoAlmostContext = ctx({ vendor: 'Costco', amount: 750 });
