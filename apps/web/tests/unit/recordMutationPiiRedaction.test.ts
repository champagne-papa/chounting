// tests/unit/recordMutationPiiRedaction.test.ts
// CA-25 (S25 QW-07 / UF-010): PII redaction at audit_log write time.
// Pure-function test of redactPii(); no DB dependency.
//
// audit_log is append-only (INV-AUDIT-002 + migration 122). Once a
// row lands with PII in before_state, selective scrubbing is
// architecturally precluded — write-time redaction is the only
// safe insertion point. This test pins the redaction surface.

import { describe, it, expect, vi } from 'vitest';
import { redactPii, PII_FIELDS } from '@/services/audit/recordMutation';

describe('CA-25: redactPii — PII removal from audit_log before_state', () => {
  it('returns null for undefined input', () => {
    expect(redactPii(undefined)).toBeNull();
  });

  it('returns null for null input', () => {
    expect(redactPii(null)).toBeNull();
  });

  it('returns an empty object for an empty object', () => {
    expect(redactPii({})).toEqual({});
  });

  it('strips invited_email and preserves other fields', () => {
    expect(
      redactPii({ invited_email: 'x@y.z', other: 'keep', count: 7 }),
    ).toEqual({ other: 'keep', count: 7 });
  });

  it('strips all five PII fields in a single pass', () => {
    expect(
      redactPii({
        invited_email: 'leak@example.com',
        phone: '+1-416-555-1234',
        first_name: 'Alice',
        last_name: 'Smith',
        display_name: 'Alice S.',
        audit_field: 'keep',
        amount: 99.99,
      }),
    ).toEqual({ audit_field: 'keep', amount: 99.99 });
  });

  it('returns a NEW object (does not mutate the input)', () => {
    const input = { invited_email: 'x@y.z', other: 'keep' };
    const result = redactPii(input);
    expect(input).toEqual({ invited_email: 'x@y.z', other: 'keep' });
    expect(result).not.toBe(input);
  });

  it('does NOT strip fields whose names are similar but not exact (e.g., email)', () => {
    // Defense against over-redaction: only the exact PII_FIELDS are
    // stripped. A field named "email" (without the invited_ prefix)
    // is NOT in PII_FIELDS today; widening the set is a Phase 2
    // decision (also surfaced as the PII_FIELDS-vs-pino-paths
    // naming-asymmetry in S28 closeout NOTE category iv).
    expect(redactPii({ email: 'keep-for-now@example.com', invited_email: 'strip@example.com' })).toEqual({
      email: 'keep-for-now@example.com',
    });
  });

  it('PII_FIELDS exports the canonical list (pinned for cross-file consumers)', () => {
    expect([...PII_FIELDS]).toEqual([
      'invited_email',
      'phone',
      'first_name',
      'last_name',
      'display_name',
    ]);
  });

  // S28 MT-06 nested-recursion extension. redactPii now recurses
  // plain objects + arrays up to depth REDACT_DEPTH_LIMIT (8);
  // depth-exceeded emits log.warn and returns the partial-clone
  // (warn-and-continue per pre-decision 3). Five test cases.

  it('Case (i) — flat regression of S25 QW-07 (PII at top level still redacted)', () => {
    expect(
      redactPii({
        invited_email: 'strip@example.com',
        phone: '+1-416-555-1234',
        outer_keep: 'ok',
      }),
    ).toEqual({ outer_keep: 'ok' });
  });

  it('Case (ii) — nested PII at depth 2 (recursion into plain objects)', () => {
    expect(
      redactPii({
        user: { invited_email: 'strip@example.com', display_name: 'Nested', other: 'keep' },
        outer_keep: 'ok',
      }),
    ).toEqual({
      user: { other: 'keep' },
      outer_keep: 'ok',
    });
  });

  it('Case (iii) — nested PII at depth 4 (deep recursion)', () => {
    expect(
      redactPii({
        a: { b: { c: { phone: '+1-555-0000', other: 'keep' } } },
      }),
    ).toEqual({
      a: { b: { c: { other: 'keep' } } },
    });
  });

  it('Case (iv) — array of nested objects (each element traversed)', () => {
    expect(
      redactPii({
        users: [
          { invited_email: 'A@example.com', name: 'Alice' },
          { invited_email: 'B@example.com', name: 'Bob' },
        ],
      }),
    ).toEqual({
      users: [{ name: 'Alice' }, { name: 'Bob' }],
    });
  });

  it('Case (v) — depth-limit exceeded fires warn-and-continue (partial redaction)', async () => {
    // Construct a fixture that exceeds depth 8. Use a nested
    // chain `a -> a -> ... -> a -> phone` that places the PII
    // field below the REDACT_DEPTH_LIMIT.
    const fixture: Record<string, unknown> = {};
    let cursor: Record<string, unknown> = fixture;
    for (let i = 0; i < 9; i++) {
      cursor.next = {} as Record<string, unknown>;
      cursor = cursor.next as Record<string, unknown>;
    }
    cursor.phone = 'DEEP_PII_VALUE'; // PII at depth 10

    // Spy on the production logger's warn method to capture the
    // warn-and-continue signal.
    const { logger } = await import('@/shared/logger/pino');
    const warnSpy = vi.spyOn(logger, 'warn').mockImplementation(() => {});

    const result = redactPii(fixture) as Record<string, unknown>;

    // Warn message asserted verbatim per pre-decision 3 lock.
    expect(warnSpy).toHaveBeenCalledWith(
      expect.objectContaining({ depth_limit: 8 }),
      'redactPii: depth limit exceeded; partial redaction',
    );

    // Partial-redaction posture: the clone exists; redaction up to
    // the depth limit was performed; deeper subtree is preserved
    // as-is (warn-and-continue, not throw, not silent-truncate).
    expect(result).toBeDefined();
    expect(typeof result).toBe('object');

    warnSpy.mockRestore();
  });
});
