// tests/integration/receiptExtractor.integration.test.ts
//
// Phase 7 chunk 7.3a — Task 7.3a.5.B receiptExtractor smoke tests.
// Pattern mirrors vendorInvoiceExtractor.integration.test.ts.

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { adminClient, SEED } from '../setup/testDb';
import { __setMockFixtureQueue } from '@/agent/orchestrator/callClaude';
import { __resetCountersForTests } from '@/agent/orchestrator/extraction/aiFallbackBudget';
import { extractReceiptFields } from '@/agent/orchestrator/extraction/receiptExtractor';
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
    documentType: 'receipt',
    ocrArtifact: artifactWithLines(lines),
    source_document_id: crypto.randomUUID(),
    trace_id,
  };
}

describe('Phase 7 chunk 7.3a Task 7.3a.5.B — receiptExtractor', () => {
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

  it('Tier A golden path: extracts total + date + payment_method', async () => {
    const trace_id = crypto.randomUUID();
    traceIds.push(trace_id);

    const result = await extractReceiptFields(
      makeInput(trace_id, [
        'Coffee Shop',
        '2026-02-15',
        'Total: $5.50',
        'Visa **** 1234',
      ]),
      makeCtx(trace_id),
    );

    expect(result.ai_fallback_invoked).toBe(false);
    expect(result.fields.total).toBe(5.5);
    expect(result.fields.date).toBe('2026-02-15');
    expect(result.fields.payment_method).toBe('visa');
    expect(result.trace_records).toHaveLength(1);
    expect(result.trace_records[0]!.stage_name).toBe('extract_fields');
  });
});
