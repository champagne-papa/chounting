// tests/integration/agentOrchestratorIngestDocument.integration.test.ts
//
// Phase 7 chunk 7.1a — integration tests for orchestrator entry
// function `ingestDocument`. Verifies Stages 0+1 active behavior
// (dedup-by-hash short-circuit + byteFetch via storage provider) +
// Stages 2-7 STUB pass-through + pipeline_trace accumulation.
//
// Storage provider is mocked at the resolver layer. source_documents
// rows are seeded via the chunk 6.1 create_ingest_batch_with_documents_with_audit
// RPC (same pattern as createIngestBatchWithDocumentsRpcRollback.test.ts).
//
// Cleanup posture: audit_log rows deleted by trace_id; substrate rows
// accumulate (delete-restricted per Phase 2 immutability triggers).

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { Mock } from 'vitest';
import { adminClient, SEED } from '../setup/testDb';
import { createMockInvokeSidecar } from '../fixtures/sidecar/mockSidecar';

vi.mock('@/services/storage/resolver', () => ({
  getStorageProvider: vi.fn(),
}));

vi.mock('@/agent/orchestrator/extraction/sidecar/client', () => ({
  invokeSidecar: vi.fn(),
}));

const { ingestDocument } = await import(
  '@/agent/orchestrator/extraction/ingestDocument'
);
const { getStorageProvider } = await import(
  '@/services/storage/resolver'
);
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

async function seedSourceDocument(opts: {
  trace_id: string;
  hash?: string;
  org_id?: string;
}): Promise<string> {
  const orgId = opts.org_id ?? SEED.ORG_HOLDING;
  const batchId = crypto.randomUUID();
  const docId = crypto.randomUUID();
  const caseId = crypto.randomUUID();
  const hash = opts.hash ?? randomHash();

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
    original_storage_key: `org_${orgId}/sources/test/${docId}.pdf`,
    original_content_hash: hash,
    original_byte_size: 42,
    original_filename: 'orch-test.pdf',
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
    bytes: new TextEncoder().encode('stub bytes'),
    content_hash: 'stub-fetch-hash',
    provider: 'supabase_storage',
  });
}

describe('Phase 7 chunk 7.1a/b — ingestDocument orchestrator (Stage 2 active per chunk 7.1b)', () => {
  let traceIds: string[] = [];

  beforeEach(() => {
    traceIds = [];
    (getStorageProvider as Mock).mockReturnValue({
      put: vi.fn(),
      fetch: makeFetchMock(),
    });
    vi.mocked(invokeSidecar).mockImplementation(
      createMockInvokeSidecar({ failureMode: null }),
    );
  });

  afterEach(async () => {
    for (const tid of traceIds) {
      await db.from('audit_log').delete().eq('trace_id', tid);
    }
  });

  it('Stages 0+1+2-7 active/stub: produces 8 pipeline_trace records on golden path', async () => {
    const trace_id = crypto.randomUUID();
    traceIds.push(trace_id);
    const sourceDocId = await seedSourceDocument({ trace_id });

    const result = await ingestDocument({
      org_id: SEED.ORG_HOLDING,
      source_document_id: sourceDocId,
      trace_id,
    });

    expect(result.status).toBe('committed');
    expect(result.failure_class).toBeNull();
    expect(result.pipeline_trace).toHaveLength(8);

    const stageNames = result.pipeline_trace.map((r) => r.stage_name);
    // Per ADR-0014 §13 canonical: 'run_ocr' at chunk 7.1b (active);
    // chunks 7.2 + 7.3 canonicalize remaining stub names.
    expect(stageNames).toEqual([
      'dedup_no_match',
      'byte_fetch',
      'run_ocr',
      'classify_stub',
      'extract_stub',
      'match_vendor_stub',
      'match_existing_state_stub',
      'build_proposal_stub',
    ]);

    // Each record carries non-empty input_hash + ISO-8601 timestamp.
    for (const record of result.pipeline_trace) {
      expect(record.input_hash).toBeTruthy();
      expect(record.timestamp).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/,
      );
    }
  });

  it('Stage 0 dedup-by-hash: short-circuits on prior matching hash within same org_id', async () => {
    const trace_id_first = crypto.randomUUID();
    const trace_id_dup = crypto.randomUUID();
    traceIds.push(trace_id_first, trace_id_dup);
    const sharedHash = randomHash();

    // First insert: prior document with the shared hash.
    await seedSourceDocument({ trace_id: trace_id_first, hash: sharedHash });

    // Second insert: duplicate hash. Orchestrator must short-circuit.
    const dupId = await seedSourceDocument({
      trace_id: trace_id_dup,
      hash: sharedHash,
    });

    const result = await ingestDocument({
      org_id: SEED.ORG_HOLDING,
      source_document_id: dupId,
      trace_id: trace_id_dup,
    });

    expect(result.status).toBe('dedup_short_circuit');
    expect(result.pipeline_trace).toHaveLength(1);
    expect(result.pipeline_trace[0].stage_name).toBe('dedup_short_circuit');
    expect(result.failure_class).toBeNull();
  });

  it('Stage 0 NOT_FOUND: returns pipeline_failed when source_document_id missing', async () => {
    const trace_id = crypto.randomUUID();
    traceIds.push(trace_id);
    const phantomId = crypto.randomUUID();

    const result = await ingestDocument({
      org_id: SEED.ORG_HOLDING,
      source_document_id: phantomId,
      trace_id,
    });

    expect(result.status).toBe('pipeline_failed');
    expect(result.failure_class).toBe('permanent_malformed');
  });

  it('pipeline_trace ordering: stages emit in fixed sequence per ADR-0014 §1', async () => {
    const trace_id = crypto.randomUUID();
    traceIds.push(trace_id);
    const sourceDocId = await seedSourceDocument({ trace_id });

    const result = await ingestDocument({
      org_id: SEED.ORG_HOLDING,
      source_document_id: sourceDocId,
      trace_id,
    });

    expect(result.status).toBe('committed');
    // Sequential timestamps (each subsequent record's timestamp is
    // >= prior record's timestamp).
    for (let i = 1; i < result.pipeline_trace.length; i++) {
      expect(
        result.pipeline_trace[i].timestamp >=
          result.pipeline_trace[i - 1].timestamp,
      ).toBe(true);
    }
  });
});
