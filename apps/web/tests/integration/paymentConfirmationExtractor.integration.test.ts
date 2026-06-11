// tests/integration/paymentConfirmationExtractor.integration.test.ts
//
// Phase 7 chunk 7.3a — Task 7.3a.5.C paymentConfirmationExtractor smoke tests.

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { adminClient, SEED } from '../setup/testDb';
import { __setMockFixtureQueue } from '@/agent/orchestrator/callClaude';
import { __resetCountersForTests } from '@/agent/orchestrator/extraction/aiFallbackBudget';
import { extractPaymentConfirmationFields } from '@/agent/orchestrator/extraction/paymentConfirmationExtractor';
import type {
  DocumentArtifactRow,
  ExtractFieldsInput,
} from '@/agent/orchestrator/extraction/types';
import type { SystemActorServiceContext } from '@/services/middleware/serviceContext';

const db = adminClient();

function artifactWithLines(lines: string[]): DocumentArtifactRow {
  return {
    engine: 'paddleocr',
    engine_version: 'mock-v1',
    pages: { count: 1 },
    lines: lines.map((text, idx) => ({
      text,
      bbox: [0, idx * 20, 100, (idx + 1) * 20],
      confidence: 0.95,
    })),
    words: { count: lines.length * 3 },
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

function makeInput(trace_id: string, lines: string[]): ExtractFieldsInput {
  return {
    documentType: 'payment_confirmation',
    ocrArtifact: artifactWithLines(lines),
    source_document_id: crypto.randomUUID(),
    trace_id,
  };
}

describe('Phase 7 chunk 7.3a Task 7.3a.5.C — paymentConfirmationExtractor', () => {
  let traceIds: string[] = [];

  beforeEach(() => {
    traceIds = [];
    __resetCountersForTests();
    __setMockFixtureQueue(null);
  });

  afterEach(async () => {
    __setMockFixtureQueue(null);
    for (const tid of traceIds) {
      await db.from('audit_log').delete().eq('trace_id', tid);
    }
  });

  it('Tier A golden path: extracts payment_amount + payment_date + payment_reference', async () => {
    const trace_id = crypto.randomUUID();
    traceIds.push(trace_id);

    const result = await extractPaymentConfirmationFields(
      makeInput(trace_id, [
        'Payment received',
        'Payment Amount: $250.00',
        'Payment Date: 2026-03-10',
        'Confirmation Number: TXN-ABC-123',
      ]),
      makeCtx(trace_id),
    );

    expect(result.ai_fallback_invoked).toBe(false);
    expect(result.fields.payment_amount).toBe(250.0);
    expect(result.fields.payment_date).toBe('2026-03-10');
    expect(result.fields.payment_reference).toBe('TXN-ABC-123');
    expect(result.trace_records).toHaveLength(1);
    expect(result.trace_records[0]!.stage_name).toBe('extract_fields');
  });
});
