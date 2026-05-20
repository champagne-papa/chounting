// tests/integration/sharedAiFallbackBudget.integration.test.ts
//
// Phase 7 chunk 7.3a — Task 7.3a.5 verification that the
// aiFallbackBudget shared module enforces max 2 calls per source
// document aggregate across Stages 3+4 per ADR-0014 §8 verbatim.

import { describe, it, expect, beforeEach } from 'vitest';
import {
  tryConsumeCall,
  getCallCount,
  __resetCountersForTests,
  AI_FALLBACK_MAX_CALLS_PER_DOCUMENT,
} from '@/agent/orchestrator/extraction/aiFallbackBudget';

describe('Phase 7 chunk 7.3a aiFallbackBudget shared module', () => {
  beforeEach(() => {
    __resetCountersForTests();
  });

  it('max budget is 2 per ADR-0014 §8 verbatim', () => {
    expect(AI_FALLBACK_MAX_CALLS_PER_DOCUMENT).toBe(2);
  });

  it('tryConsumeCall returns true for first call, increments counter', () => {
    const sourceDocId = crypto.randomUUID();
    expect(getCallCount(sourceDocId)).toBe(0);
    expect(tryConsumeCall(sourceDocId)).toBe(true);
    expect(getCallCount(sourceDocId)).toBe(1);
  });

  it('tryConsumeCall returns true for second call, false for third (budget exhausted)', () => {
    const sourceDocId = crypto.randomUUID();
    expect(tryConsumeCall(sourceDocId)).toBe(true);
    expect(tryConsumeCall(sourceDocId)).toBe(true);
    expect(tryConsumeCall(sourceDocId)).toBe(false);
    expect(getCallCount(sourceDocId)).toBe(2);
  });

  it('counters are isolated per source_document_id', () => {
    const docA = crypto.randomUUID();
    const docB = crypto.randomUUID();
    expect(tryConsumeCall(docA)).toBe(true);
    expect(tryConsumeCall(docA)).toBe(true);
    expect(tryConsumeCall(docA)).toBe(false);
    expect(tryConsumeCall(docB)).toBe(true);
    expect(tryConsumeCall(docB)).toBe(true);
    expect(tryConsumeCall(docB)).toBe(false);
  });

  it('budget enforcement spans simulated Stage 3 + Stage 4 invocations against the same source_document_id (cross-stage)', () => {
    const sourceDocId = crypto.randomUUID();
    // Simulate Stage 3 Tier C invocation.
    expect(tryConsumeCall(sourceDocId)).toBe(true);
    // Simulate Stage 4 Tier C invocation against same doc.
    expect(tryConsumeCall(sourceDocId)).toBe(true);
    // Third call across either stage exhausts the shared budget.
    expect(tryConsumeCall(sourceDocId)).toBe(false);
  });

  it('__resetCountersForTests clears all counters', () => {
    const sourceDocId = crypto.randomUUID();
    tryConsumeCall(sourceDocId);
    tryConsumeCall(sourceDocId);
    expect(getCallCount(sourceDocId)).toBe(2);
    __resetCountersForTests();
    expect(getCallCount(sourceDocId)).toBe(0);
  });
});
