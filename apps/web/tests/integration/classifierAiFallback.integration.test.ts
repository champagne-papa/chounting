// tests/integration/classifierAiFallback.integration.test.ts
//
// Phase 7 chunk 7.2 — Task 7.2.11.E: aiFallback unit tests.
// Canonical test location per chunk 7.1a/7.1b (ε) banking N=3.
//
// Covers golden path (Tier C valid above threshold) + confidence-below-
// threshold gate + Zod-validation failure + max 2 calls budget per
// source_document per ADR-0014 §8.

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { adminClient, SEED } from '../setup/testDb';
import {
  __setMockFixtureQueue,
} from '@/agent/orchestrator/callClaude';
import type Anthropic from '@anthropic-ai/sdk';
import {
  runAiFallback,
  __resetCallCountersForTests,
} from '@/agent/orchestrator/extraction/classifier/aiFallback';
import type {
  ClassificationInput,
  DocumentArtifactRow,
} from '@/agent/orchestrator/extraction/types';
import type { SystemActorServiceContext } from '@/services/middleware/serviceContext';

const db = adminClient();

function buildAnthropicFixture(jsonText: string): Anthropic.Messages.Message {
  return {
    id: `msg_mock_${Math.random().toString(36).slice(2)}`,
    type: 'message',
    role: 'assistant',
    model: 'claude-sonnet-4-5',
    stop_reason: 'end_turn',
    stop_sequence: null,
    content: [{ type: 'text', text: jsonText, citations: null }],
    usage: {
      input_tokens: 100,
      output_tokens: 50,
      cache_creation_input_tokens: null,
      cache_read_input_tokens: null,
      server_tool_use: null,
      service_tier: 'standard',
    },
  } as Anthropic.Messages.Message;
}

function artifact(): DocumentArtifactRow {
  return {
    engine: 'paddleocr',
    engine_version: 'mock-v1',
    pages: { count: 1 },
    lines: [{ text: 'Generic text', bbox: [0, 0, 100, 20], confidence: 0.95 }],
    words: { count: 2 },
    quality_flags: [],
    pipeline_trace: [],
    confidence: 0.95,
  };
}

function makeCtx(trace_id: string): SystemActorServiceContext {
  return {
    trace_id,
    caller: { user_id: null, system_actor: 'pipeline_orchestrator' },
    org_id: SEED.ORG_HOLDING,
  };
}

function makeInput(trace_id: string): ClassificationInput {
  return {
    ocrArtifact: artifact(),
    source_document_id: crypto.randomUUID(),
    trace_id,
  };
}

describe('Phase 7 chunk 7.2 Task 7.2.11.E — aiFallback', () => {
  let traceIds: string[] = [];

  beforeEach(() => {
    traceIds = [];
    __resetCallCountersForTests();
  });

  afterEach(async () => {
    __setMockFixtureQueue(null);
    for (const tid of traceIds) {
      await db.from('audit_log').delete().eq('trace_id', tid);
    }
  });

  it('golden path: returns valid Tier C output above threshold', async () => {
    const trace_id = crypto.randomUUID();
    traceIds.push(trace_id);

    __setMockFixtureQueue([
      buildAnthropicFixture(
        JSON.stringify({
          document_type: 'vendor_invoice',
          confidence: 0.92,
          rationale: 'Clear invoice document',
          fields: { vendor_name: 'Acme', invoice_number: 'INV-001' },
        }),
      ),
    ]);

    const result = await runAiFallback(makeInput(trace_id), makeCtx(trace_id));
    expect(result.output.valid).toBe(true);
    if (result.output.valid) {
      expect(result.output.documentType).toBe('vendor_invoice');
      expect(result.output.confidence).toBe(0.92);
      expect(result.output.confidenceAboveThreshold).toBe(true);
    }
    expect(result.trace_record.stage_name).toBe('ai_fallback_classify');
    expect(result.trace_record.model).toBe('claude-sonnet-4-5');
  });

  it('confidence-below-threshold gate: marks output as below threshold', async () => {
    const trace_id = crypto.randomUUID();
    traceIds.push(trace_id);

    __setMockFixtureQueue([
      buildAnthropicFixture(
        JSON.stringify({
          document_type: 'vendor_invoice',
          confidence: 0.7, // below 0.85 threshold
          rationale: 'Uncertain',
          fields: {},
        }),
      ),
    ]);

    const result = await runAiFallback(makeInput(trace_id), makeCtx(trace_id));
    expect(result.output.valid).toBe(true);
    if (result.output.valid) {
      expect(result.output.confidenceAboveThreshold).toBe(false);
    }
  });

  it('Zod-validation failure: returns invalid output', async () => {
    const trace_id = crypto.randomUUID();
    traceIds.push(trace_id);

    __setMockFixtureQueue([
      buildAnthropicFixture(
        JSON.stringify({
          document_type: 'totally_not_in_enum',
          confidence: 0.99,
          rationale: 'malformed',
          fields: {},
        }),
      ),
    ]);

    const result = await runAiFallback(makeInput(trace_id), makeCtx(trace_id));
    expect(result.output.valid).toBe(false);
    if (!result.output.valid) {
      expect(result.output.reason).toBe('zod_validation_failed');
    }
  });

  it('JSON parse failure: returns invalid output', async () => {
    const trace_id = crypto.randomUUID();
    traceIds.push(trace_id);

    __setMockFixtureQueue([buildAnthropicFixture('not valid json at all {{{')]);

    const result = await runAiFallback(makeInput(trace_id), makeCtx(trace_id));
    expect(result.output.valid).toBe(false);
    if (!result.output.valid) {
      expect(result.output.reason).toBe('zod_validation_failed');
    }
  });

  it('budget exhausted: returns invalid output on third call for same source_document', async () => {
    const trace_id = crypto.randomUUID();
    traceIds.push(trace_id);

    const input = makeInput(trace_id);

    // Seed 2 valid responses + a third (which should never be consumed).
    __setMockFixtureQueue([
      buildAnthropicFixture(
        JSON.stringify({
          document_type: 'receipt',
          confidence: 0.85,
          rationale: 'r1',
          fields: {},
        }),
      ),
      buildAnthropicFixture(
        JSON.stringify({
          document_type: 'receipt',
          confidence: 0.85,
          rationale: 'r2',
          fields: {},
        }),
      ),
    ]);

    // Call twice — both should succeed.
    const r1 = await runAiFallback(input, makeCtx(trace_id));
    const r2 = await runAiFallback(input, makeCtx(trace_id));
    expect(r1.output.valid).toBe(true);
    expect(r2.output.valid).toBe(true);

    // Third call exceeds budget → returns invalid without invoking Claude.
    const r3 = await runAiFallback(input, makeCtx(trace_id));
    expect(r3.output.valid).toBe(false);
    if (!r3.output.valid) {
      expect(r3.output.reason).toBe('budget_exhausted');
    }
  });

  it('UNKNOWN sentinel: returns valid Tier C output with document_type unknown', async () => {
    const trace_id = crypto.randomUUID();
    traceIds.push(trace_id);

    __setMockFixtureQueue([buildAnthropicFixture('UNKNOWN')]);

    const result = await runAiFallback(makeInput(trace_id), makeCtx(trace_id));
    expect(result.output.valid).toBe(true);
    if (result.output.valid) {
      expect(result.output.documentType).toBe('unknown');
      expect(result.output.confidenceAboveThreshold).toBe(false);
    }
  });
});
