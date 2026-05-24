// tests/integration/e2e/ingestPipelineHarness.ts
//
// Phase 8 chunk 6 sub-chunk b — shared harness for the document-pipeline
// e2e tests. Seeds a source_document (storage upload + ingest-batch RPC)
// for one of the document-pipeline-demo fixtures, then invokes the real
// ingestDocument() orchestrator (Stages 0-7 against the deployed Modal
// sidecar). Modeled on apps/web/scripts/phase-7-v1-close-demo.ts.
//
// Dedup discipline: each seed uses a UNIQUE original_content_hash so
// Stage 0 (dedup_by_hash) never short-circuits on a prior run's row —
// the e2e blocks assert full traversal, so a same-bytes re-run must still
// be treated as a new document. (Real uploads carry their true SHA-256;
// this uniqueness is a test-isolation device only.)

import * as fs from 'node:fs';
import * as path from 'node:path';
import * as crypto from 'node:crypto';
import { adminClient, SEED } from '../../setup/testDb';
import { ingestDocument } from '@/agent/orchestrator/extraction/ingestDocument';
import type { IngestDocumentOutput } from '@/agent/orchestrator/extraction/types';

const FIXTURE_DIR = path.resolve(__dirname, '..', '..', 'fixtures', 'document-pipeline-demo');

export interface PipelineRun {
  output: IngestDocumentOutput;
  source_document_id: string;
  document_case_id: string;
  trace_id: string;
}

/**
 * Seed a source_document for the given demo fixture PDF and run the full
 * ingestDocument pipeline against the real Modal sidecar. Returns the
 * orchestrator output plus the seeded ids for downstream assertions.
 */
export async function runIngestPipeline(fixtureFilename: string): Promise<PipelineRun> {
  const admin = adminClient();
  const bytes = fs.readFileSync(path.join(FIXTURE_DIR, fixtureFilename));
  // Unique content hash per run (test-isolation; see file header).
  const content_hash = crypto
    .createHash('sha256')
    .update(bytes)
    .update(crypto.randomUUID())
    .digest('hex');

  const trace_id = crypto.randomUUID();
  const batchId = crypto.randomUUID();
  const docId = crypto.randomUUID();
  const caseId = crypto.randomUUID();
  const jobId = crypto.randomUUID();
  const storage_key = `org_${SEED.ORG_HOLDING}/sources/e2e/${docId}.pdf`;

  const upload = await admin.storage.from('documents').upload(storage_key, bytes, {
    contentType: 'application/pdf',
    upsert: false,
  });
  if (upload.error) {
    throw new Error(`storage upload failed for ${fixtureFilename}: ${upload.error.message}`);
  }

  const now = new Date().toISOString();
  const { error } = await admin.rpc('create_ingest_batch_with_documents_with_audit', {
    p_batch: {
      id: batchId,
      org_id: SEED.ORG_HOLDING,
      ingest_channel: 'drag_drop_pdf',
      received_at: now,
      channel_metadata: {
        drop_session_id: crypto.randomUUID(),
        chat_session_id: crypto.randomUUID(),
        user_id: SEED.USER_CONTROLLER,
      },
      trace_id,
      created_at: now,
      created_by: SEED.USER_CONTROLLER,
    },
    p_documents: [
      {
        id: docId,
        org_id: SEED.ORG_HOLDING,
        legal_entity_id: SEED.ORG_HOLDING,
        storage_provider: 'supabase_storage',
        original_storage_key: storage_key,
        original_content_hash: content_hash,
        original_byte_size: bytes.length,
        original_filename: fixtureFilename,
        mime_type: 'application/pdf',
        ingest_channel: 'drag_drop_pdf',
        storage_status: 'available',
        received_at: now,
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
        trace_id,
        created_by: SEED.USER_CONTROLLER,
      },
    ],
    p_case_sources: [],
    p_jobs: [
      {
        id: jobId,
        org_id: SEED.ORG_HOLDING,
        source_document_id: docId,
        document_case_id: caseId,
        state: 'queued',
        trace_id,
        created_by: SEED.USER_CONTROLLER,
      },
    ],
    p_audit: {
      org_id: SEED.ORG_HOLDING,
      user_id: SEED.USER_CONTROLLER,
      trace_id,
      action: 'ingest_batch_created',
      entity_type: 'ingest_batch',
      before_state: null,
      after_state_id: null,
      tool_name: null,
      idempotency_key: null,
      reason: null,
    },
  });
  if (error) throw new Error(`seed RPC failed for ${fixtureFilename}: ${error.message}`);

  const output = await ingestDocument({
    org_id: SEED.ORG_HOLDING,
    source_document_id: docId,
    trace_id,
  });

  return { output, source_document_id: docId, document_case_id: caseId, trace_id };
}
