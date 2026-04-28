// tests/unit/recordMutationPiiRedaction.test.ts
// CA-25 (S25 QW-07 / UF-010): PII redaction at audit_log write time.
// Pure-function test of redactPii(); no DB dependency.
//
// audit_log is append-only (INV-AUDIT-002 + migration 122). Once a
// row lands with PII in before_state, selective scrubbing is
// architecturally precluded — write-time redaction is the only
// safe insertion point. This test pins the redaction surface.

import { describe, it, expect } from 'vitest';
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

  it('does NOT recurse into nested objects (documents shallow-clone limit)', () => {
    // Phase 2 work (pino REDACT_CONFIG expansion + nested structured
    // support land together as MT-06). For now, callers that pass
    // nested user objects to recordMutation must flatten first or
    // accept the leak.
    expect(
      redactPii({
        user: { email: 'nested-leak@example.com', display_name: 'Nested' },
        outer_keep: 'ok',
      }),
    ).toEqual({
      user: { email: 'nested-leak@example.com', display_name: 'Nested' },
      outer_keep: 'ok',
    });
  });

  it('does NOT strip fields whose names are similar but not exact (e.g., email)', () => {
    // Defense against over-redaction: only the exact PII_FIELDS are
    // stripped. A field named "email" (without the invited_ prefix)
    // is NOT in PII_FIELDS today; widening the set is a Phase 2
    // decision.
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
});
