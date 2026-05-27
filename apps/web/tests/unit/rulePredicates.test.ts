// apps/web/tests/unit/rulePredicates.test.ts
// Pure-core predicate library (ADR-0025 §2 / Decision 2).

import { describe, expect, it } from 'vitest';

import {
  PREDICATES,
  SPECIFICITY_CLOSED_SET,
  SPECIFICITY_PATTERN,
  SPECIFICITY_RANGE,
} from '@/core/rules/predicates';

describe('predicate registry', () => {
  it('has exactly the six v1 pattern predicates (no Ring 2B types)', () => {
    expect(Object.keys(PREDICATES).sort()).toEqual(
      [
        'field_equals',
        'field_in_range',
        'field_in_set',
        'field_matches_pattern',
        'field_outside_range',
        'source_trigger_equals',
      ].sort(),
    );
  });

  it('assigns 3/2/1 specificity weights by tier (OQ-1)', () => {
    expect(SPECIFICITY_CLOSED_SET).toBe(3);
    expect(SPECIFICITY_RANGE).toBe(2);
    expect(SPECIFICITY_PATTERN).toBe(1);
    expect(PREDICATES.field_equals?.specificityWeight).toBe(SPECIFICITY_CLOSED_SET);
    expect(PREDICATES.field_in_set?.specificityWeight).toBe(SPECIFICITY_CLOSED_SET);
    expect(PREDICATES.source_trigger_equals?.specificityWeight).toBe(SPECIFICITY_CLOSED_SET);
    expect(PREDICATES.field_in_range?.specificityWeight).toBe(SPECIFICITY_RANGE);
    expect(PREDICATES.field_outside_range?.specificityWeight).toBe(SPECIFICITY_RANGE);
    expect(PREDICATES.field_matches_pattern?.specificityWeight).toBe(SPECIFICITY_PATTERN);
  });
});

describe('field_equals (strict equality)', () => {
  const e = PREDICATES.field_equals!.evaluate;
  it('matches equal values', () => expect(e('Amazon', 'Amazon')).toBe(true));
  it('rejects unequal values', () => expect(e('Amazon', 'Costco')).toBe(false));
  it('does not coerce types', () => expect(e(500, '500')).toBe(false));
  it('null === null is true; null vs undefined is false', () => {
    expect(e(null, null)).toBe(true);
    expect(e(null, undefined)).toBe(false);
  });
});

describe('field_in_set (membership)', () => {
  const e = PREDICATES.field_in_set!.evaluate;
  it('matches a member', () => expect(e(['a', 'b'], 'b')).toBe(true));
  it('rejects a non-member', () => expect(e(['a', 'b'], 'c')).toBe(false));
  it('false when condition value is not an array', () => expect(e('a', 'a')).toBe(false));
});

describe('field_in_range (inclusive bounds)', () => {
  const e = PREDICATES.field_in_range!.evaluate;
  it('matches a value within', () => expect(e({ min: 0, max: 500 }, 250)).toBe(true));
  it('matches the inclusive lower bound', () => expect(e({ min: 0, max: 500 }, 0)).toBe(true));
  it('matches the inclusive upper bound', () => expect(e({ min: 0, max: 500 }, 500)).toBe(true));
  it('rejects above max', () => expect(e({ min: 0, max: 500 }, 501)).toBe(false));
  it('rejects below min', () => expect(e({ min: 10, max: 500 }, 5)).toBe(false));
  it('null bound = unbounded on that side', () => {
    expect(e({ min: null, max: 100 }, -50)).toBe(true);
    expect(e({ min: 0, max: null }, 1_000_000_000)).toBe(true);
  });
  it('false for a non-number field value', () => expect(e({ min: 0, max: 500 }, '250')).toBe(false));
});

describe('field_outside_range', () => {
  const e = PREDICATES.field_outside_range!.evaluate;
  it('matches a value above the range', () => expect(e({ min: 0, max: 100 }, 1399)).toBe(true));
  it('matches a value below the range', () => expect(e({ min: 10, max: 100 }, 5)).toBe(true));
  it('rejects a value inside the range', () => expect(e({ min: 0, max: 100 }, 50)).toBe(false));
  it('false for a non-number field (neither in nor outside)', () => expect(e({ min: 0, max: 100 }, 'x')).toBe(false));
});

describe('field_matches_pattern (regex)', () => {
  const e = PREDICATES.field_matches_pattern!.evaluate;
  it('matches the pattern', () => expect(e('^INV-\\d+$', 'INV-2026')).toBe(true));
  it('rejects a non-match', () => expect(e('^INV-\\d+$', 'PO-2026')).toBe(false));
  it('false for a non-string field value', () => expect(e('^x$', 5)).toBe(false));
  it('returns false (never throws) on an invalid pattern', () => expect(e('(', 'anything')).toBe(false));
});

describe('source_trigger_equals', () => {
  const e = PREDICATES.source_trigger_equals!.evaluate;
  it('matches the source trigger', () => expect(e('scheduled_time_occurs', 'scheduled_time_occurs')).toBe(true));
  it('rejects a different source trigger', () => expect(e('scheduled_time_occurs', 'agent_proposal')).toBe(false));
});
