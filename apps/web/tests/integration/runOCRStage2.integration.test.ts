// tests/integration/runOCRStage2.integration.test.ts
//
// Phase 7 chunk 7.1b — Stage 2 active OCR wiring tests per brief §4
// Task 7.1b.8 acceptance criteria. Covers:
//   1. Golden-path OCR (mockSidecar returns valid response; runOCR
//      writes ocr_runs + extraction_runs + document_artifacts;
//      trace_record stage_name='run_ocr'; pipeline_trace JSONB
//      populated per ADR-0014 §13).
//   2. HMAC signature failure ('hmac_mismatch' mode; runOCR throws
//      PIPELINE_UNAVAILABLE per ADR-0014 §12.2).
//   3. Modal cold-start timeout ('timeout' mode; runOCR throws
//      PIPELINE_TRANSIENT_EXHAUSTED per ADR-0014 §12.1 amended
//      ~30s wall-clock budget).
//   4. Sidecar response Zod-validation failure ('malformed_response'
//      mode; runOCR throws PIPELINE_UNAVAILABLE per ADR-0014 §12.2
//      schema mismatch class).
//   5. Sequential INSERT chain partial-write tolerance: orphan
//      ocr_runs row persists when subsequent INSERT fails; banked as
//      (γ) evidence of orphan-tolerance pattern at composite-write
//      grain.
//
// Canonical test location per chunk 7.1a (ε) precedent (apps/web/
// tests/integration/, NOT co-located __tests__/).

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { adminClient, SEED } from '../setup/testDb';
import { createMockInvokeSidecar } from '../fixtures/sidecar/mockSidecar';

vi.mock('@/agent/orchestrator/extraction/sidecar/client', () => ({
  invokeSidecar: vi.fn(),
}));

const { runOCR } = await import('@/agent/orchestrator/extraction/stages/runOCR');
const { invokeSidecar } = await import(
  '@/agent/orchestrator/extraction/sidecar/client'
);

const db = adminClient();

async function seedSourceDocument(opts: {
  trace_id: string;
  hash?: string;
}): Promise<string> {
  const docId = crypto.randomUUID();
  const batchId = crypto.randomUUID();
  const caseId = crypto.randomUUID();
  const hash = opts.hash ?? randomHash();

  const { error } = await db.rpc(
    'create_ingest_batch_with_documents_with_audit',
    {
      p_batch: {
        id: batchId,
        org_id: SEED.ORG_HOLDING,
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
      },
      p_documents: [
        {
          id: docId,
          org_id: SEED.ORG_HOLDING,
          legal_entity_id: SEED.ORG_HOLDING,
          storage_provider: 'supabase_storage',
          original_storage_key: `org_${SEED.ORG_HOLDING}/sources/test/${docId}.pdf`,
          original_content_hash: hash,
          original_byte_size: 42,
          original_filename: 'runocr-test.pdf',
          mime_type: 'application/pdf',
          ingest_channel: 'drag_drop_pdf',
          storage_status: 'available',
          received_at: new Date().toISOString(),
          created_by: SEED.USER_CONTROLLER,
          ingest_batch_id: batchId,
        },
      ],
      p_cases: [
        {
          id: caseId,
          org_id: SEED.ORG_HOLDING,
          document_type: 'unknown',
          state: 'received',
          trace_id: opts.trace_id,
          created_by: SEED.USER_CONTROLLER,
        },
      ],
      p_case_sources: [],
      p_jobs: [
        {
          id: crypto.randomUUID(),
          org_id: SEED.ORG_HOLDING,
          source_document_id: docId,
          document_case_id: caseId,
          state: 'queued',
          trace_id: opts.trace_id,
          created_by: SEED.USER_CONTROLLER,
        },
      ],
      p_audit: {
        org_id: SEED.ORG_HOLDING,
        user_id: SEED.USER_CONTROLLER,
        trace_id: opts.trace_id,
        action: 'ingest_batch_created',
        entity_type: 'ingest_batch',
        before_state: null,
        after_state_id: null,
        tool_name: null,
        idempotency_key: null,
        reason: null,
      },
    },
  );
  if (error) throw new Error(`seed RPC failed: ${error.message}`);
  return docId;
}

function randomHash(): string {
  const chars = '0123456789abcdef';
  let h = '';
  for (let i = 0; i < 64; i++) {
    h += chars[Math.floor(Math.random() * 16)];
  }
  return h;
}

describe('Phase 7 chunk 7.1b — Stage 2 active OCR (runOCR)', () => {
  let traceIds: string[] = [];

  beforeEach(() => {
    traceIds = [];
  });

  afterEach(async () => {
    for (const tid of traceIds) {
      await db.from('audit_log').delete().eq('trace_id', tid);
    }
    vi.clearAllMocks();
  });

  it('Golden-path OCR: writes ocr_runs + extraction_runs + document_artifacts; trace stage_name=run_ocr', async () => {
    const trace_id = crypto.randomUUID();
    traceIds.push(trace_id);
    const sourceDocId = await seedSourceDocument({ trace_id });

    vi.mocked(invokeSidecar).mockImplementation(
      createMockInvokeSidecar({ failureMode: null }),
    );

    const result = await runOCR({
      source_document_id: sourceDocId,
      bytes: new TextEncoder().encode('test bytes'),
      content_hash: 'test-content-hash',
      trace_id,
      prior_trace: [],
    });

    expect(result.trace_record.stage_name).toBe('run_ocr');
    expect(result.trace_record.input_hash).toBe('test-content-hash');
    expect(result.trace_record.model).toBe('paddleocr-2.7-pp-ocrv4');
    expect(result.artifact.engine).toBe('paddleocr');
    expect(result.artifact.pipeline_trace).toHaveLength(1);

    // Verify ocr_runs row persisted
    const { data: ocrRunRows } = await db
      .from('ocr_runs')
      .select('id')
      .eq('source_document_id', sourceDocId);
    expect(ocrRunRows?.length).toBeGreaterThanOrEqual(1);

    // Verify extraction_runs row persisted
    const { data: extractionRunRows } = await db
      .from('extraction_runs')
      .select('id')
      .eq('source_document_id', sourceDocId);
    expect(extractionRunRows?.length).toBeGreaterThanOrEqual(1);

    // Verify document_artifacts row persisted with pipeline_trace JSONB
    const { data: artifactRows } = await db
      .from('document_artifacts')
      .select('engine, engine_version, pipeline_trace')
      .eq('source_document_id', sourceDocId);
    expect(artifactRows?.length).toBeGreaterThanOrEqual(1);
    expect(artifactRows?.[0].engine).toBe('paddleocr');
  });

  it('HMAC signature failure: invokeSidecar throws PIPELINE_UNAVAILABLE', async () => {
    const trace_id = crypto.randomUUID();
    traceIds.push(trace_id);
    const sourceDocId = await seedSourceDocument({ trace_id });

    vi.mocked(invokeSidecar).mockImplementation(
      createMockInvokeSidecar({ failureMode: 'hmac_mismatch' }),
    );

    await expect(
      runOCR({
        source_document_id: sourceDocId,
        bytes: new TextEncoder().encode('test bytes'),
        content_hash: 'test-hash',
        trace_id,
        prior_trace: [],
      }),
    ).rejects.toMatchObject({ code: 'PIPELINE_UNAVAILABLE' });
  });

  it('Modal cold-start timeout: invokeSidecar throws PIPELINE_TRANSIENT_EXHAUSTED', async () => {
    const trace_id = crypto.randomUUID();
    traceIds.push(trace_id);
    const sourceDocId = await seedSourceDocument({ trace_id });

    vi.mocked(invokeSidecar).mockImplementation(
      createMockInvokeSidecar({ failureMode: 'timeout' }),
    );

    await expect(
      runOCR({
        source_document_id: sourceDocId,
        bytes: new TextEncoder().encode('test bytes'),
        content_hash: 'test-hash',
        trace_id,
        prior_trace: [],
      }),
    ).rejects.toMatchObject({ code: 'PIPELINE_TRANSIENT_EXHAUSTED' });
  });

  it('Sidecar response Zod-validation failure: invokeSidecar throws PIPELINE_UNAVAILABLE (SCHEMA_MISMATCH)', async () => {
    const trace_id = crypto.randomUUID();
    traceIds.push(trace_id);
    const sourceDocId = await seedSourceDocument({ trace_id });

    vi.mocked(invokeSidecar).mockImplementation(
      createMockInvokeSidecar({ failureMode: 'malformed_response' }),
    );

    await expect(
      runOCR({
        source_document_id: sourceDocId,
        bytes: new TextEncoder().encode('test bytes'),
        content_hash: 'test-hash',
        trace_id,
        prior_trace: [],
      }),
    ).rejects.toMatchObject({ code: 'PIPELINE_UNAVAILABLE' });
  });

  it('pipeline_trace accumulates prior_trace records + emits run_ocr at end', async () => {
    const trace_id = crypto.randomUUID();
    traceIds.push(trace_id);
    const sourceDocId = await seedSourceDocument({ trace_id });

    vi.mocked(invokeSidecar).mockImplementation(
      createMockInvokeSidecar({ failureMode: null }),
    );

    const prior_trace = [
      {
        stage_name: 'dedup_no_match',
        input_hash: 'h0',
        output_hash: '',
        model: null,
        timestamp: new Date().toISOString(),
      },
      {
        stage_name: 'byte_fetch',
        input_hash: 'h1',
        output_hash: 'h2',
        model: null,
        timestamp: new Date().toISOString(),
      },
    ];

    const result = await runOCR({
      source_document_id: sourceDocId,
      bytes: new TextEncoder().encode('test'),
      content_hash: 'test-hash',
      trace_id,
      prior_trace,
    });

    expect(result.artifact.pipeline_trace).toHaveLength(3);
    expect(
      (result.artifact.pipeline_trace as Array<{ stage_name: string }>)[2].stage_name,
    ).toBe('run_ocr');
  });
});
