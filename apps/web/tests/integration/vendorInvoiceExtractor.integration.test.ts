// tests/integration/vendorInvoiceExtractor.integration.test.ts
//
// Phase 7 chunk 7.3a — Task 7.3a.5 vendorInvoiceExtractor unit + integration tests.
// Canonical test location per chunk 7.1a/7.1b/7.2 (ε) banking N=4.

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import type Anthropic from '@anthropic-ai/sdk';
import { adminClient, SEED } from '../setup/testDb';
import { __setMockFixtureQueue } from '@/agent/orchestrator/callClaude';
import { __resetCountersForTests } from '@/agent/orchestrator/extraction/aiFallbackBudget';
import { extractVendorInvoiceFields } from '@/agent/orchestrator/extraction/vendorInvoiceExtractor';
import type {
  DocumentArtifactRow,
  ExtractFieldsInput,
} from '@/agent/orchestrator/extraction/types';
import type { SystemActorServiceContext } from '@/services/middleware/serviceContext';

const db = adminClient();

function buildAnthropicFixture(jsonText: string): Anthropic.Messages.Message {
  return {
    id: `msg_${Math.random().toString(36).slice(2)}`,
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
    documentType: 'vendor_invoice',
    ocrArtifact: artifactWithLines(lines),
    source_document_id: crypto.randomUUID(),
    trace_id,
  };
}

describe('Phase 7 chunk 7.3a Task 7.3a.5.A — vendorInvoiceExtractor', () => {
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

  it('Tier A golden path: extracts all 3 required fields, no AI fallback invoked', async () => {
    const trace_id = crypto.randomUUID();
    traceIds.push(trace_id);

    const result = await extractVendorInvoiceFields(
      makeInput(trace_id, [
        'Invoice #INV-001',
        'Issue Date: 2026-01-15',
        'Due Date: 2026-02-15',
        'Total: $1,234.56',
      ]),
      makeCtx(trace_id),
    );

    expect(result.ai_fallback_invoked).toBe(false);
    expect(result.fields.vendor_invoice_number).toBe('INV-001');
    expect(result.fields.amount).toBe(1234.56);
    expect(result.fields.accounting_date).toBe('2026-01-15');
    // Parent 'extract_fields' trace_record only — no Tier C child.
    expect(result.trace_records).toHaveLength(1);
    expect(result.trace_records[0]!.stage_name).toBe('extract_fields');
  });

  it('Tier C fallback path: invokes AI when Tier A insufficient', async () => {
    const trace_id = crypto.randomUUID();
    traceIds.push(trace_id);

    __setMockFixtureQueue([
      buildAnthropicFixture(
        JSON.stringify({
          amount: 250.0,
          currency: 'CAD',
          vendor_invoice_number: 'INV-AI',
          accounting_date: '2026-03-01',
        }),
      ),
    ]);

    const result = await extractVendorInvoiceFields(
      makeInput(trace_id, ['No structured invoice data']),
      makeCtx(trace_id),
    );

    expect(result.ai_fallback_invoked).toBe(true);
    expect(result.fields.amount).toBe(250.0);
    expect(result.fields.vendor_invoice_number).toBe('INV-AI');
    // Parent 'extract_fields' + child 'ai_fallback_extract'.
    expect(result.trace_records).toHaveLength(2);
    expect(result.trace_records[1]!.stage_name).toBe('ai_fallback_extract');
  });

  it('Tier C Zod-validation failure: returns Tier A partial fields with ai_fallback_invoked=true', async () => {
    const trace_id = crypto.randomUUID();
    traceIds.push(trace_id);

    __setMockFixtureQueue([
      buildAnthropicFixture(JSON.stringify({ amount: 'not_a_number_break_zod' })),
    ]);

    const result = await extractVendorInvoiceFields(
      makeInput(trace_id, ['Total: $99.00']),
      makeCtx(trace_id),
    );

    expect(result.ai_fallback_invoked).toBe(true);
    // Tier A partial fields preserved.
    expect(result.fields.amount).toBe(99.0);
  });
});
