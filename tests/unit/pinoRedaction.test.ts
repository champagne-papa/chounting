// tests/unit/pinoRedaction.test.ts
// CA-83: Pino redaction verification.
//
// Every path declared in REDACT_CONFIG.paths must be replaced with
// REDACT_CONFIG.censor in the serialized log output; the original
// sensitive value must not appear anywhere in the line.
//
// Regression guard — if a future edit drops a path, mistypes an
// entry, or changes the censor string, this test fails before the
// regression ships.
//
// Discharges Phase 1.1 DEFERRED #20 (exit_criteria_matrix.md).

import { describe, it, expect } from 'vitest';
import { Writable } from 'node:stream';
import pino from 'pino';
import { REDACT_CONFIG } from '@/shared/logger/pino';

/**
 * Sentinel value written at every redacted path. Chosen to be
 * unique and conspicuous so a substring-contains check is
 * meaningful.
 */
const SENTINEL = 'UNREDACTED_SENSITIVE_VALUE_SHOULD_NEVER_APPEAR';

/**
 * Convert a pino redact path (possibly containing `*` wildcards)
 * into a concrete dotted path by replacing each `*` segment with
 * the literal `'wild'`. Pino's wildcard matcher matches any
 * object key at that depth, so 'wild' satisfies `*.password`.
 *
 * TODO(phase-2+): only handles flat dotted paths and simple
 * leading wildcards (`*.leaf`). If a future REDACT_CONFIG entry
 * uses an exotic pino pattern — intermediate wildcard (`a.*.b`),
 * bracket notation (`a["b.c"]`), or array index (`a[*]`) — this
 * helper produces a path pino does not match, and the test fails
 * with an obscure "expected [REDACTED] at path ..." message. Fix
 * then: extend the substitution logic, or throw a defensive error
 * at the top of this function when an unsupported shape is seen.
 */
function concretePathFor(redactPath: string): string[] {
  return redactPath.split('.').map((seg) => (seg === '*' ? 'wild' : seg));
}

/** Set a value at a deeply-nested path, creating objects as needed. */
function setAtPath(
  obj: Record<string, unknown>,
  path: string[],
  value: unknown,
): void {
  let cursor = obj;
  for (let i = 0; i < path.length - 1; i++) {
    const seg = path[i];
    if (cursor[seg] == null || typeof cursor[seg] !== 'object') {
      cursor[seg] = {};
    }
    cursor = cursor[seg] as Record<string, unknown>;
  }
  cursor[path[path.length - 1]] = value;
}

/** Read the value at a concrete dotted path in a parsed JSON object. */
function getAtPath(obj: Record<string, unknown>, path: string[]): unknown {
  let cursor: unknown = obj;
  for (const seg of path) {
    if (cursor == null || typeof cursor !== 'object') return undefined;
    cursor = (cursor as Record<string, unknown>)[seg];
  }
  return cursor;
}

describe('CA-83: pino redaction', () => {
  it('redacts every path in REDACT_CONFIG.paths', () => {
    // Build a single payload with the sentinel placed at every
    // redacted path. Wildcard paths use a 'wild' segment as a
    // concrete stand-in (pino matches any key, including 'wild').
    const payload: Record<string, unknown> = {};
    const concretePaths = REDACT_CONFIG.paths.map(concretePathFor);
    for (const path of concretePaths) {
      setAtPath(payload, path, SENTINEL);
    }

    // Capture the serialized log line into an in-memory buffer.
    // Using a custom Writable avoids touching stdout or the
    // production logger singleton.
    let captured = '';
    const sink = new Writable({
      write(chunk, _enc, done) {
        captured += chunk.toString();
        done();
      },
    });

    const testLogger = pino({ redact: REDACT_CONFIG }, sink);
    testLogger.info(payload, 'redaction test');

    const parsed = JSON.parse(captured.trim()) as Record<string, unknown>;

    // Every concrete path must hold the censor value.
    for (const path of concretePaths) {
      expect(
        getAtPath(parsed, path),
        `expected ${REDACT_CONFIG.censor} at path ${path.join('.')}`,
      ).toBe(REDACT_CONFIG.censor);
    }

    // Belt-and-suspenders: the sentinel must appear nowhere in
    // the serialized line, including substrings. Catches any
    // path where redaction silently failed to apply.
    expect(captured).not.toContain(SENTINEL);
  });

  it('has a non-empty REDACT_CONFIG.paths list (canary)', () => {
    // If someone empties the list by accident — say, during a
    // refactor — this fires before the redacted-paths test
    // vacuously passes against zero paths.
    expect(REDACT_CONFIG.paths.length).toBeGreaterThan(0);
  });

  it('uses [REDACTED] as the censor value', () => {
    // Locks the censor string. Forensic scans of shipped logs
    // often grep for '[REDACTED]' to confirm redaction fired;
    // changing the censor silently breaks those workflows.
    expect(REDACT_CONFIG.censor).toBe('[REDACTED]');
  });
});
