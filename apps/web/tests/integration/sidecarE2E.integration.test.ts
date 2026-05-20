// tests/integration/sidecarE2E.integration.test.ts
//
// Phase 7 chunk 7.1b — End-to-end test against deployed Modal sidecar
// per brief §4 Task 7.1b.9 acceptance criteria.
//
// Gated behind MODAL_OCR_HMAC_SECRET + MODAL_OCR_SIDECAR_URL env-var
// presence. Skips in CI by default per v1 manual-trigger design intent
// (Note 1 bank-state-and-proceed; founder runs E2E manually post-
// deployment).
//
// To run locally:
//   1. cd sidecar-ocr && bash deploy.sh           # deploy to Modal
//   2. modal secret create modal-ocr-hmac-secret value=$(bash sidecar-ocr/generate-secret.sh)
//   3. echo "MODAL_OCR_HMAC_SECRET=<secret>" >> apps/web/.env.local
//   4. echo "MODAL_OCR_SIDECAR_URL=<deployed-url>" >> apps/web/.env.local
//   5. cd apps/web && pnpm test:integration tests/integration/sidecarE2E

import { describe, it, expect } from 'vitest';
import { adminClient, SEED } from '../setup/testDb';
import { ingestDocument } from '@/agent/orchestrator/extraction/ingestDocument';

const HAS_MODAL_SECRETS = Boolean(
  process.env.MODAL_OCR_HMAC_SECRET && process.env.MODAL_OCR_SIDECAR_URL,
);

describe.skipIf(!HAS_MODAL_SECRETS)(
  'Phase 7 chunk 7.1b — Modal sidecar E2E (deployed)',
  () => {
    const db = adminClient();

    it('invokes deployed Modal sidecar end-to-end and persists artifact', async () => {
      const trace_id = crypto.randomUUID();
      const batchId = crypto.randomUUID();
      const docId = crypto.randomUUID();
      const caseId = crypto.randomUUID();

      const hash = `${'a'.repeat(64)}`; // placeholder; real e2e uses fixture PDF
      const { error: seedErr } = await db.rpc(
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
            trace_id,
            created_at: new Date().toISOString(),
            created_by: SEED.USER_CONTROLLER,
          },
          p_documents: [
            {
              id: docId,
              org_id: SEED.ORG_HOLDING,
              legal_entity_id: SEED.ORG_HOLDING,
              storage_provider: 'supabase_storage',
              original_storage_key: `org_${SEED.ORG_HOLDING}/sources/e2e/${docId}.pdf`,
              original_content_hash: hash,
              original_byte_size: 42,
              original_filename: 'e2e-fixture.pdf',
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
              trace_id,
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
        },
      );
      if (seedErr) throw new Error(`seed failed: ${seedErr.message}`);

      const result = await ingestDocument({
        org_id: SEED.ORG_HOLDING,
        source_document_id: docId,
        trace_id,
      });

      // Real Modal sidecar should produce a 'committed' status with
      // engine='paddleocr' artifact + pipeline_trace populated.
      expect(result.status).toBe('committed');
      expect(result.pipeline_trace.length).toBeGreaterThanOrEqual(8);

      // Verify document_artifacts row persisted with paddleocr engine.
      const { data: artifactRows } = await db
        .from('document_artifacts')
        .select('engine, engine_version')
        .eq('source_document_id', docId);
      expect(artifactRows?.length).toBeGreaterThanOrEqual(1);
      expect(artifactRows?.[0].engine).toBe('paddleocr');

      // Cleanup audit_log rows.
      await db.from('audit_log').delete().eq('trace_id', trace_id);
    });
  },
);
