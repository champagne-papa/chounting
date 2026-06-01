// tests/integration/classifier.integration.test.ts
//
// Phase 7 chunk 7.2 — Task 7.2.13: end-to-end Stage 3 classifier
// integration test per directive Iteration 3 §2.
//
// Verifies Tier A / Tier C / Tier D path coverage through the full
// orchestrator (ingestDocument) with synthetic OCR artifact emitted by
// chunk 7.1b mockSidecar + Claude Sonnet fixtures injected via
// callClaude.ts __mockFixture queue.
//
// Failure-class audit events verified per ADR-0014 §12 (ai_fallback_
// validation_failed + extraction_failed with failure_reason).

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { Mock } from 'vitest';
import type Anthropic from '@anthropic-ai/sdk';
import { adminClient, SEED } from '../setup/testDb';
import { createMockInvokeSidecar } from '../fixtures/sidecar/mockSidecar';
import { __setMockFixtureQueue } from '@/agent/orchestrator/callClaude';
import { __resetCallCountersForTests } from '@/agent/orchestrator/extraction/classifier/aiFallback';

vi.mock('@/services/storage/resolver', () => ({
  getStorageProvider: vi.fn(),
}));

vi.mock('@/agent/orchestrator/extraction/sidecar/client', () => ({
  invokeSidecar: vi.fn(),
}));

const { ingestDocument } = await import(
  '@/agent/orchestrator/extraction/ingestDocument'
);
const { getStorageProvider } = await import('@/services/storage/resolver');
const { invokeSidecar } = await import(
  '@/agent/orchestrator/extraction/sidecar/client'
);

const db = adminClient();

function randomHash(): string {
  const chars = '0123456789abcdef';
  let h = '';
  for (let i = 0; i < 64; i++) {
    h += chars[Math.floor(Math.random() * 16)];
  }
  return h;
}

async function seedSourceDocument(opts: { trace_id: string }): Promise<string> {
  const orgId = SEED.ORG_HOLDING;
  const batchId = crypto.randomUUID();
  const docId = crypto.randomUUID();
  const caseId = crypto.randomUUID();

  const batch = {
    id: batchId,
    org_id: orgId,
    ingest_channel: 'drag_drop_pdf',
    received_at: new Date().toISOString(),
    channel_metadata: {
      drop_session_id: crypto.randomUUID(),
      chat_session_id: crypto.randomUUID(),
      user_id: SEED.USER_CONTROLLER,
    },
    trace_id: opts.trace_id,
    created_at: new Date().toISOString(),
    created_by: SEED.USER_CONTROLLER,
  };

  const doc = {
    id: docId,
    org_id: orgId,
    legal_entity_id: orgId,
    storage_provider: 'supabase_storage',
    original_storage_key: `org_${orgId}/sources/classifier-test/${docId}.pdf`,
    original_content_hash: randomHash(),
    original_byte_size: 42,
    original_filename: 'classifier-test.pdf',
    mime_type: 'application/pdf',
    ingest_channel: 'drag_drop_pdf',
    storage_status: 'available',
    received_at: new Date().toISOString(),
    created_by: SEED.USER_CONTROLLER,
    ingest_batch_id: batchId,
  };

  const caseRow = {
    id: caseId,
    org_id: orgId,
    document_type: 'unknown',
    state: 'received',
    trace_id: opts.trace_id,
    created_by: SEED.USER_CONTROLLER,
  };

  const job = {
    id: crypto.randomUUID(),
    org_id: orgId,
    source_document_id: docId,
    document_case_id: caseId,
    state: 'queued',
    trace_id: opts.trace_id,
    created_by: SEED.USER_CONTROLLER,
  };

  const audit = {
    org_id: orgId,
    user_id: SEED.USER_CONTROLLER,
    trace_id: opts.trace_id,
    action: 'ingest_batch_created',
    entity_type: 'ingest_batch',
    before_state: null,
    after_state_id: null,
    tool_name: null,
    idempotency_key: null,
    reason: null,
  };

  const { error } = await db.rpc(
    'create_ingest_batch_with_documents_with_audit',
    {
      p_batch: batch,
      p_documents: [doc],
      p_cases: [caseRow],
      p_case_sources: [],
      p_jobs: [job],
      p_audit: audit,
    },
  );
  if (error) throw new Error(`seed RPC failed: ${error.message}`);
  return docId;
}

function makeFetchMock(): Mock {
  return vi.fn().mockResolvedValue({
    bytes: new TextEncoder().encode('synthetic'),
    content_hash: 'stub-hash',
    provider: 'supabase_storage',
  });
}

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

function configureSidecarWithOcr(textLines: string[]): void {
  vi.mocked(invokeSidecar).mockImplementation(
    createMockInvokeSidecar({
      failureMode: null,
      artifactOverride: {
        lines: textLines.map((text, idx) => ({
          text,
          bbox: [0, idx * 20, 100, (idx + 1) * 20],
          confidence: 0.95,
        })),
      },
    }),
  );
}

describe('Phase 7 chunk 7.2 Task 7.2.13 — classifier integration (Stage 3 end-to-end)', () => {
  let traceIds: string[] = [];

  beforeEach(() => {
    traceIds = [];
    __resetCallCountersForTests();
    __setMockFixtureQueue(null);
    (getStorageProvider as Mock).mockReturnValue({
      put: vi.fn(),
      fetch: makeFetchMock(),
    });
  });

  afterEach(async () => {
    __setMockFixtureQueue(null);
    for (const tid of traceIds) {
      await db.from('audit_log').delete().eq('trace_id', tid);
    }
  });

  it('Tier A path: vendor_invoice match emits parent stage_name only', async () => {
    const trace_id = crypto.randomUUID();
    traceIds.push(trace_id);
    configureSidecarWithOcr([
      'Invoice #INV-001',
      'Acme Vendor Co.',
      'Total $250.00',
    ]);

    const sourceDocId = await seedSourceDocument({ trace_id });
    const result = await ingestDocument({
      org_id: SEED.ORG_HOLDING,
      source_document_id: sourceDocId,
      trace_id,
    });

    // Bleed-stop (ADR-0007 §Tier 2 Q78 / de607fdb): a matched vendor_invoice
    // with no prior relationship match routes to proposed_entry_card, which
    // now parks (parked_unposted) instead of auto-posting; only
    // proposed_attachment_card (a matched-relationship route, not exercised
    // here) still commits.
    expect(result.status).toBe('parked_unposted');
    const stageNames = result.pipeline_trace.map((r) => r.stage_name);
    expect(stageNames).toContain('classify_document_type');
    // Tier A path: NO child sub-stage emitted.
    expect(stageNames).not.toContain('ai_fallback_classify');
  });

  it('Tier C path: classifier emits parent + child sub-stage when AI fallback validates above threshold', async () => {
    const trace_id = crypto.randomUUID();
    traceIds.push(trace_id);

    // Synthetic OCR with no Tier A patterns; force fallthrough to Tier C.
    configureSidecarWithOcr(['Generic unstructured text', 'with no document type signals']);

    // Seed two Claude fixtures: one for Stage 3 classifier Tier C, one
    // for Stage 4 receiptExtractor Tier C (per chunk 7.3a shared
    // aiFallbackBudget: max 2 calls per source_document across stages).
    __setMockFixtureQueue([
      buildAnthropicFixture(
        JSON.stringify({
          document_type: 'receipt',
          confidence: 0.85,
          rationale: 'AI fallback identified receipt-shape from text content',
          fields: { merchant_name: 'Test Merchant', total: 25.5 },
        }),
      ),
      buildAnthropicFixture(
        JSON.stringify({
          total: 25.5,
          merchant_text: 'Test Merchant',
          date: '2026-02-01',
        }),
      ),
    ]);

    const sourceDocId = await seedSourceDocument({ trace_id });
    const result = await ingestDocument({
      org_id: SEED.ORG_HOLDING,
      source_document_id: sourceDocId,
      trace_id,
    });

    // Status is 'parked_unposted': this Tier-C receipt has no prior
    // relationship match, so Stage 7 routes it to a parked branch
    // (proposed_entry_card / proposed_mutation_bundle), which the Wave-1
    // bleed-stop (ADR-0007 §Tier 2 Q78 / de607fdb) parks rather than
    // auto-posting. (Only proposed_attachment_card — a matched-relationship
    // route, not exercised here — still commits.) Deterministic for these
    // fixtures; the test's focus is the parent + child stage emission below.
    // ('deferred_chunk_7_3b_pending_activation' is a defined-but-not-emitted
    // status post-7.3b activation; not produced.)
    expect(result.status).toBe('parked_unposted');
    const stageNames = result.pipeline_trace.map((r) => r.stage_name);
    // Tier C path: parent + child sub-stage emitted per ADR-0014 §8 + §13.
    expect(stageNames).toContain('classify_document_type');
    expect(stageNames).toContain('ai_fallback_classify');
  });

  it('Tier D path (Zod-validation failure): emits ai_fallback_validation_failed + extraction_failed audit events', async () => {
    const trace_id = crypto.randomUUID();
    traceIds.push(trace_id);

    configureSidecarWithOcr(['Generic text', 'with no document signals']);

    // Seed Claude fixture: malformed JSON (discriminator value not in union).
    __setMockFixtureQueue([
      buildAnthropicFixture(
        JSON.stringify({
          document_type: 'totally_not_in_enum',
          confidence: 0.95,
          rationale: 'malformed',
          fields: {},
        }),
      ),
    ]);

    const sourceDocId = await seedSourceDocument({ trace_id });
    const result = await ingestDocument({
      org_id: SEED.ORG_HOLDING,
      source_document_id: sourceDocId,
      trace_id,
    });

    expect(result.status).toBe('committed');
    // Tier D fallthrough: classification.documentType should be 'unknown'.
    // The orchestrator's result.proposal_id is null at chunk 7.2; we
    // verify the audit events landed.

    // Verify ai_fallback_validation_failed audit event for this trace.
    const { data: auditRows, error } = await db
      .from('audit_log')
      .select('action, before_state')
      .eq('trace_id', trace_id);
    expect(error).toBeNull();

    const actionNames = (auditRows ?? []).map((r) => r.action);
    expect(actionNames).toContain('ai_fallback_validation_failed');
    expect(actionNames).toContain('extraction_failed');

    const extractionFailed = (auditRows ?? []).find(
      (r) => r.action === 'extraction_failed',
    );
    expect(extractionFailed).toBeDefined();
    expect(
      (extractionFailed?.before_state as { failure_reason?: string } | undefined)
        ?.failure_reason,
    ).toBe('ai_fallback_validation_failed');
  });

  it('Confidence-below-threshold path: emits extraction_failed with failure_reason=confidence_below_threshold', async () => {
    const trace_id = crypto.randomUUID();
    traceIds.push(trace_id);

    configureSidecarWithOcr(['Generic text', 'no Tier A signal']);

    // Seed Claude fixture: valid receipt classification but confidence
    // 0.50 (below 0.80 threshold).
    __setMockFixtureQueue([
      buildAnthropicFixture(
        JSON.stringify({
          document_type: 'receipt',
          confidence: 0.5,
          rationale: 'Low-confidence classification',
          fields: {},
        }),
      ),
    ]);

    const sourceDocId = await seedSourceDocument({ trace_id });
    const result = await ingestDocument({
      org_id: SEED.ORG_HOLDING,
      source_document_id: sourceDocId,
      trace_id,
    });

    expect(result.status).toBe('committed');

    // Verify extraction_failed with failure_reason=confidence_below_threshold.
    const { data: auditRows, error } = await db
      .from('audit_log')
      .select('action, before_state')
      .eq('trace_id', trace_id);
    expect(error).toBeNull();

    const extractionFailed = (auditRows ?? []).find(
      (r) =>
        r.action === 'extraction_failed' &&
        (r.before_state as { failure_reason?: string } | undefined)
          ?.failure_reason === 'confidence_below_threshold',
    );
    expect(extractionFailed).toBeDefined();
  });

  it('Adversarial counter-shape: invoice header + receipt footer rejects Tier A; falls through to Tier C', async () => {
    const trace_id = crypto.randomUUID();
    traceIds.push(trace_id);

    // Adversarial: Invoice header + receipt-shape footer. Tier A's
    // vendorInvoiceRules MUST reject per negative-pattern logic.
    configureSidecarWithOcr([
      'Invoice #99',
      'Total: $50.00',
      'Thank you for your purchase',
      'Auth code: 12345',
    ]);

    // Seed two Claude fixtures: Stage 3 Tier C classification +
    // Stage 4 Tier C extraction (per chunk 7.3a shared budget).
    __setMockFixtureQueue([
      buildAnthropicFixture(
        JSON.stringify({
          document_type: 'receipt',
          confidence: 0.85,
          rationale: 'Adversarial classified as receipt via AI',
          fields: {},
        }),
      ),
      buildAnthropicFixture(
        JSON.stringify({
          total: 50.0,
          date: '2026-02-01',
          payment_method: 'credit_card',
        }),
      ),
    ]);

    const sourceDocId = await seedSourceDocument({ trace_id });
    const result = await ingestDocument({
      org_id: SEED.ORG_HOLDING,
      source_document_id: sourceDocId,
      trace_id,
    });

    // Status is 'parked_unposted': the adversarial doc classifies as receipt
    // via Tier C, has no prior relationship match, and routes to a parked
    // branch — which the Wave-1 bleed-stop (ADR-0007 §Tier 2 Q78 / de607fdb)
    // parks rather than auto-posting. Deterministic for these fixtures.
    expect(result.status).toBe('parked_unposted');
    const stageNames = result.pipeline_trace.map((r) => r.stage_name);
    // Verify Tier A was bypassed: AI fallback child sub-stage emitted.
    expect(stageNames).toContain('ai_fallback_classify');
  });
});
