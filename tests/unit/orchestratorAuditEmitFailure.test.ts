// tests/unit/orchestratorAuditEmitFailure.test.ts
// MT-05 / UF-008: audit-emit failure observability.
//
// Pure source-shape contract test. Verifies that each of the
// three catch blocks guarded by the unique swallow-message anchor
// emits a structured log line carrying `audit_emit_failure: true`.
// The flag is the grep-stable marker the alert pipeline filters
// on (1% / 15min rolling per pre-decision 2 of S28 brief).
//
// Why source-shape verification (not a runtime mock harness): the
// three sites live in deep orchestrator paths (loadOrCreateSession,
// emitMessageProcessedAudit, executeTool finally). A runtime test
// requires either real DB (violates "no DB dependency") or wide
// mocking of orchestrator internals (large surface, brittle).
// Source-shape verification reads the actual file contents and
// asserts the structural flag is present in each catch's log.error
// first-arg object — substrate-grounded, mechanical, fast, matches
// the brief's exit-criteria ("the structured-flag field appears in
// the captured log line"). The flag is grep-stable; if it ever
// drifts (renamed, removed, mistyped) this test fails.

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const SWALLOW_ANCHOR =
  "agent audit write failed; continuing (tx-atomicity gap per Clarification F)";

const FLAG = "audit_emit_failure: true";

function readSource(relativePath: string): string {
  return readFileSync(resolve(process.cwd(), relativePath), 'utf-8');
}

/**
 * Locate the catch block whose log.error invocation references
 * the swallow-anchor string. Returns the surrounding source
 * window (back to the most recent `} catch`, forward through the
 * closing parenthesis of the log.error call).
 *
 * If the source has multiple catch blocks with the anchor (e.g.,
 * orchestrator/index.ts has two), `occurrence` (0-indexed)
 * selects which one to return.
 */
function extractCatchBlock(source: string, occurrence = 0): string {
  const anchorIndex = (() => {
    let idx = -1;
    for (let i = 0; i <= occurrence; i++) {
      idx = source.indexOf(SWALLOW_ANCHOR, idx + 1);
      if (idx === -1) {
        throw new Error(
          `swallow anchor occurrence ${occurrence} not found in source`,
        );
      }
    }
    return idx;
  })();

  // Walk backward to find the most recent `catch`.
  const catchStart = source.lastIndexOf('catch', anchorIndex);
  if (catchStart === -1) {
    throw new Error('no catch block precedes the swallow anchor');
  }

  // Walk forward from anchor to find the closing `);` of the
  // log.error call.
  const closingIndex = source.indexOf(');', anchorIndex);
  if (closingIndex === -1) {
    throw new Error('no closing `);` follows the swallow anchor');
  }

  return source.slice(catchStart, closingIndex + 2);
}

describe('MT-05 / UF-008: audit-emit failure observability flag', () => {
  it('Site 1 (loadOrCreateSession.ts) — catch block carries audit_emit_failure: true', () => {
    const src = readSource('src/agent/orchestrator/loadOrCreateSession.ts');
    const block = extractCatchBlock(src, 0);

    expect(block).toContain(SWALLOW_ANCHOR);
    expect(block).toContain(FLAG);
    expect(block).toMatch(/action:\s*isOrgSwitch/);
  });

  it('Site 2 (orchestrator/index.ts emitMessageProcessedAudit) — catch block carries audit_emit_failure: true', () => {
    const src = readSource('src/agent/orchestrator/index.ts');
    // First occurrence in index.ts is emitMessageProcessedAudit
    // (around line 200); second is executeTool finally (around
    // line 1289). occurrence = 0 picks the first.
    const block = extractCatchBlock(src, 0);

    expect(block).toContain(SWALLOW_ANCHOR);
    expect(block).toContain(FLAG);
    expect(block).toContain("action: 'agent.message_processed'");
  });

  it('Site 3 (orchestrator/index.ts executeTool finally) — catch block carries audit_emit_failure: true', () => {
    const src = readSource('src/agent/orchestrator/index.ts');
    const block = extractCatchBlock(src, 1);

    expect(block).toContain(SWALLOW_ANCHOR);
    expect(block).toContain(FLAG);
    expect(block).toContain("action: 'agent.tool_executed'");
    expect(block).toContain('tool_name: toolName');
  });

  it('exactly three catch sites carry the audit_emit_failure flag (uniformity guard)', () => {
    // Across the orchestrator module, the flag appears exactly
    // three times — one per site. If a future edit adds a fourth
    // catch with the flag (or removes one), this test surfaces it.
    const loadOrCreate = readSource('src/agent/orchestrator/loadOrCreateSession.ts');
    const orchestrator = readSource('src/agent/orchestrator/index.ts');

    const countInLoadOrCreate = loadOrCreate.split(FLAG).length - 1;
    const countInOrchestrator = orchestrator.split(FLAG).length - 1;

    expect(countInLoadOrCreate).toBe(1);
    expect(countInOrchestrator).toBe(2);
    expect(countInLoadOrCreate + countInOrchestrator).toBe(3);
  });
});
