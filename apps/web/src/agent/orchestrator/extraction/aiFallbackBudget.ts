// aiFallbackBudget.ts — Shared per-document AI fallback budget counter
// per Phase 7 chunk 7.3a brief Task 7.3a.2.a + Session 39 directive
// Iteration 2 Option α RATIFIED + ADR-0014 §8 verbatim.
//
// ADR-0014 §8: "Re-verification cost budget. Maximum 2 fallback calls
// per source document in v1 — one for classification and one for field
// extraction (the typical path)."
//
// Budget is PER-DOCUMENT, NOT per-stage. Shared across:
//   - Stage 3 classifier Tier C AI fallback (chunk 7.2 aiFallback.ts).
//   - Stage 4 extractor Tier C AI fallback (chunk 7.3a per-document-type
//     extractor modules).
//
// Phase B scope addition at chunk 7.3a per Iteration 2 Option α RATIFIED
// (parallel to Session 38 chunk 7.2 ON INSERT trigger pattern).
// Cross-stage budget enforcement preserved at module-grade counter Map
// keyed by source_document_id.
//
// Per ADR-0014 §8: budget enforcement at the orchestrator stage grade.
// Counter Map is in-memory module-grade; long-running processes
// accumulate counters; chunk 7.3a v1 surface accepts this (one
// orchestrator invocation per source document; Map grows unbounded per
// process lifetime but v1 process lifetimes are short).

const MAX_FALLBACK_CALLS_PER_DOCUMENT = 2;

// Module-grade counter: source_document_id → calls-consumed.
const callCounters = new Map<string, number>();

/**
 * Atomically check + increment counter. Returns true if budget was
 * available (and consumed); false if budget already exhausted.
 *
 * Idiom: caller checks return value; if true, proceeds with AI fallback;
 * if false, emits PIPELINE_TRANSIENT_EXHAUSTED (per ADR-0014 §12.1).
 */
export function tryConsumeCall(source_document_id: string): boolean {
  const current = callCounters.get(source_document_id) ?? 0;
  if (current >= MAX_FALLBACK_CALLS_PER_DOCUMENT) {
    return false;
  }
  callCounters.set(source_document_id, current + 1);
  return true;
}

/**
 * Read-only counter inspection. Returns the number of AI fallback calls
 * consumed against the budget for the given source_document_id.
 */
export function getCallCount(source_document_id: string): number {
  return callCounters.get(source_document_id) ?? 0;
}

/**
 * Test-only reset. Clears all per-document counters. Used in
 * beforeEach/afterEach hooks to start tests with a clean budget.
 * NOT exported for production use.
 */
export function __resetCountersForTests(): void {
  callCounters.clear();
}

/**
 * Maximum per-document budget per ADR-0014 §8. Exported for test
 * verification + downstream documentation.
 */
export const AI_FALLBACK_MAX_CALLS_PER_DOCUMENT = MAX_FALLBACK_CALLS_PER_DOCUMENT;
