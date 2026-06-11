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
      createMockInvokeSidecar({
        failureMode: null,
        // Inject Invoice-shape lines so Stage 3 Tier A classifier matches
        // vendor_invoice deterministically + Stage 4 Tier A extractor
        // resolves the three required fields (vendor_invoice_number +
        // amount + accounting_date) so Stage 4 stays in Tier A path
        // (no Tier C invocation needed; avoids Claude fixture seeding).
        artifactOverride: {
          lines: [
            {
              text: 'Invoice #12345',
              bbox: [0, 0, 100, 20],
              confidence: 0.95,
            },
            {
              text: 'Acme Vendor Co.',
              bbox: [0, 20, 100, 40],
              confidence: 0.95,
            },
            {
              text: 'Date: 2026-01-15',
              bbox: [0, 40, 100, 60],
              confidence: 0.95,
            },
            {
              text: 'Total: $123.45',
              bbox: [0, 60, 100, 80],
              confidence: 0.95,
            },
          ],
        },
      }),
    );
  });

  afterEach(async () => {
    for (const tid of traceIds) {
      await db.from('audit_log').delete().eq('trace_id', tid);
    }
  });

  it('Stages 0+1+2+3 active + Stages 4-7 stub: produces 9 pipeline_trace records on golden path (Tier A match)', async () => {
    const trace_id = crypto.randomUUID();
    traceIds.push(trace_id);
    const sourceDocId = await seedSourceDocument({ trace_id });

    const result = await ingestDocument({
      org_id: SEED.ORG_HOLDING,
      source_document_id: sourceDocId,
      trace_id,
    });

    // Wave -1 A-now bleed-stop (ADR-0007 §Tier 2 Q78 V1-re-scoping): a matched
    // vendor_invoice builds a proposed_entry_card but no longer auto-posts — the
    // pipeline parks it (no ledger write). Status flips committed → parked_unposted;
    // all stages still run, so the trace assertions below are unchanged.
    expect(result.status).toBe('parked_unposted');
    expect(result.failure_class).toBeNull();
    expect(result.pipeline_trace).toHaveLength(9);

    const stageNames = result.pipeline_trace.map((r) => r.stage_name);
    // Per ADR-0014 §13 canonical (chunks 7.1b + 7.2 + 7.3a active) +
    // chunk 4 Phase 8 Task 1 (Subsystem-1-grade router_match_against_state
    // stage record per ADR-0018 §2 lines 492-504; emitted alongside the
    // orchestrator-grade match_against_existing_state record): dedup_by_hash
    // + byte_fetch + run_ocr + classify_document_type + extract_fields +
    // match_vendor + match_against_existing_state + router_match_against_state
    // + build_proposal. Tier A classification + extraction paths emit
    // parent only (no ai_fallback child sub-stages).
    expect(stageNames).toEqual([
      'dedup_no_match',
      'byte_fetch',
      'run_ocr',
      'classify_document_type',
      'extract_fields',
      'match_vendor',
      'match_against_existing_state',
      'router_match_against_state',
      'build_proposal',
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

    // Wave -1 A-now bleed-stop: matched vendor_invoice parks, not auto-posts.
    expect(result.status).toBe('parked_unposted');
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

// =====================================================================
// Phase 8 chunk 4 Task 3 — router_match_against_state stage record
// (axis 1) + Logic Receipt audit consumer surface (axis 2 fold-in).
//
// Axis 2 folds into axis 1 per Session 66 Phase A Finding A
// disposition: brief axis 2 framing cites
// `ProposedMutation.justification.pipeline_trace` at Stage 7
// build_proposal grade, but no HEAD code path populates that field;
// ProposalJustificationSchema formal Zod codification deferred to
// chunk 9 per Layer 2 item #B. Runtime Logic Receipt consumer
// accessibility is verified at `IngestDocumentOutput.pipeline_trace`
// boundary — the only existing consumer surface at chunk 4 grade.
// =====================================================================
const SHA256_HEX = /^[a-f0-9]{64}$/;

describe('Phase 8 chunk 4 Task 3 — router_match_against_state pipeline_trace record (axis 1 + axis 2 folded)', () => {
  let traceIds: string[] = [];

  beforeEach(() => {
    traceIds = [];
    (getStorageProvider as Mock).mockReturnValue({
      put: vi.fn(),
      fetch: makeFetchMock(),
    });
    vi.mocked(invokeSidecar).mockImplementation(
      createMockInvokeSidecar({
        failureMode: null,
        artifactOverride: {
          lines: [
            { text: 'Invoice #12345', bbox: [0, 0, 100, 20], confidence: 0.95 },
            { text: 'Acme Vendor Co.', bbox: [0, 20, 100, 40], confidence: 0.95 },
            { text: 'Date: 2026-01-15', bbox: [0, 40, 100, 60], confidence: 0.95 },
            { text: 'Total: $123.45', bbox: [0, 60, 100, 80], confidence: 0.95 },
          ],
        },
      }),
    );
  });

  afterEach(async () => {
    for (const tid of traceIds) {
      await db.from('audit_log').delete().eq('trace_id', tid);
    }
  });

  it('router_match_against_state record carries the full Logic Receipt shape per ADR-0007 §Q30 + ADR-0018 §2 lines 492-504', async () => {
    const trace_id = crypto.randomUUID();
    traceIds.push(trace_id);
    const sourceDocId = await seedSourceDocument({ trace_id });

    const result = await ingestDocument({
      org_id: SEED.ORG_HOLDING,
      source_document_id: sourceDocId,
      trace_id,
    });

    // Wave -1 A-now bleed-stop: matched vendor_invoice parks, not auto-posts.
    expect(result.status).toBe('parked_unposted');
    const record = result.pipeline_trace.find(
      (r) => r.stage_name === 'router_match_against_state',
    );
    expect(record).toBeDefined();
    // ADR-0018 §2 line 495 + ADR-0007 §Q30 line 484: five-field record shape.
    expect(record!.stage_name).toBe('router_match_against_state');
    expect(record!.input_hash).toMatch(SHA256_HEX);
    expect(record!.output_hash).toMatch(SHA256_HEX);
    // ADR-0018 §2 line 498: deterministic TypeScript, no LLM.
    expect(record!.model).toBeNull();
    expect(record!.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });

  it('router_match_against_state input_hash captures Subsystem-1-grade fingerprint distinct from orchestrator-grade match_against_existing_state', async () => {
    // ADR-0018 §2 lines 496-497: Subsystem-1-grade input_hash =
    // SHA-256(classifier output + domain-state snapshot fingerprint),
    // capturing document_type + classification_confidence + extracted_fields
    // + vendor_match. The orchestrator-grade match_against_existing_state
    // emission at ingestDocument.ts:354-366 hashes a narrower fingerprint
    // ({documentCaseId, vendorMatch}); the two records co-emit per partial-
    // info value pick (a) at chunk 4 Task 1.
    const trace_id = crypto.randomUUID();
    traceIds.push(trace_id);
    const sourceDocId = await seedSourceDocument({ trace_id });

    const result = await ingestDocument({
      org_id: SEED.ORG_HOLDING,
      source_document_id: sourceDocId,
      trace_id,
    });

    const subsystemRecord = result.pipeline_trace.find(
      (r) => r.stage_name === 'router_match_against_state',
    );
    const orchestratorRecord = result.pipeline_trace.find(
      (r) => r.stage_name === 'match_against_existing_state',
    );
    expect(subsystemRecord).toBeDefined();
    expect(orchestratorRecord).toBeDefined();
    // Both records co-emit but with distinct fingerprints — Subsystem-1
    // captures classifier output + extracted_fields, orchestrator does not.
    expect(subsystemRecord!.input_hash).not.toBe(orchestratorRecord!.input_hash);
  });

  it('router_match_against_state output_hash matches match_against_existing_state output_hash (same candidate set hashed at both grades)', async () => {
    // Both records hash the same `relationshipCandidates` array per
    // ingestDocument.ts:360-363 + ingestDocument.ts:392-395; output_hashes
    // must agree to confirm both grades observed the same Subsystem-1
    // output state.
    const trace_id = crypto.randomUUID();
    traceIds.push(trace_id);
    const sourceDocId = await seedSourceDocument({ trace_id });

    const result = await ingestDocument({
      org_id: SEED.ORG_HOLDING,
      source_document_id: sourceDocId,
      trace_id,
    });

    const subsystemRecord = result.pipeline_trace.find(
      (r) => r.stage_name === 'router_match_against_state',
    );
    const orchestratorRecord = result.pipeline_trace.find(
      (r) => r.stage_name === 'match_against_existing_state',
    );
    expect(subsystemRecord!.output_hash).toBe(orchestratorRecord!.output_hash);
  });

  it('router_match_against_state emits in canonical sequence position (after match_against_existing_state, before build_proposal)', async () => {
    // ADR-0018 §2 lines 492-504 + ADR-0014 §13: Subsystem-1-grade record
    // co-emits with orchestrator-grade record adjacent to it; build_proposal
    // is downstream consumer surface (Stage 7).
    const trace_id = crypto.randomUUID();
    traceIds.push(trace_id);
    const sourceDocId = await seedSourceDocument({ trace_id });

    const result = await ingestDocument({
      org_id: SEED.ORG_HOLDING,
      source_document_id: sourceDocId,
      trace_id,
    });

    const stageNames = result.pipeline_trace.map((r) => r.stage_name);
    const orchestratorIdx = stageNames.indexOf('match_against_existing_state');
    const subsystemIdx = stageNames.indexOf('router_match_against_state');
    const buildProposalIdx = stageNames.indexOf('build_proposal');
    expect(orchestratorIdx).toBeGreaterThanOrEqual(0);
    expect(subsystemIdx).toBe(orchestratorIdx + 1);
    expect(buildProposalIdx).toBe(subsystemIdx + 1);
  });

  it('axis 2 Logic Receipt consumer fold-in: router_match_against_state surfaces in IngestDocumentOutput.pipeline_trace at runtime consumer boundary per ADR-0007 §Q30', async () => {
    // Chunk 4 axis 2 (folded into axis 1 per Session 66 Phase A Finding A):
    // ProposalJustificationSchema formal Zod codification deferred to
    // chunk 9 per Layer 2 item #B (Sub-Q9 substrate-grade-first lock);
    // chunk 4 verifies runtime accessibility at the only existing consumer
    // surface — IngestDocumentOutput.pipeline_trace — without schema-level
    // formalization. Downstream Logic Receipt consumers read the field
    // permissively at the optional `justification: z.record(...)` shape
    // (proposedMutation.schema.ts:65,77 + proposedAttachmentCard.schema.ts:52)
    // pending chunk 9 ProposalJustificationSchema formal Zod codification.
    const trace_id = crypto.randomUUID();
    traceIds.push(trace_id);
    const sourceDocId = await seedSourceDocument({ trace_id });

    const result = await ingestDocument({
      org_id: SEED.ORG_HOLDING,
      source_document_id: sourceDocId,
      trace_id,
    });

    // Logic Receipt consumer surface: result.pipeline_trace is the
    // accessible record array; downstream Logic Receipt consumers read
    // it without schema-level Zod parse (permissive runtime consumption).
    expect(Array.isArray(result.pipeline_trace)).toBe(true);
    const consumerView = result.pipeline_trace.find(
      (r) => r.stage_name === 'router_match_against_state',
    );
    expect(consumerView).toBeDefined();
    // ADR-0007 §Q30 five-field consumer contract — fields readable as
    // unknown-typed JSONB at runtime per ProposalJustificationSchema
    // deferral.
    expect(consumerView).toEqual(
      expect.objectContaining({
        stage_name: 'router_match_against_state',
        input_hash: expect.stringMatching(SHA256_HEX),
        output_hash: expect.stringMatching(SHA256_HEX),
        model: null,
        timestamp: expect.stringMatching(
          /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/,
        ),
      }),
    );
  });
});
