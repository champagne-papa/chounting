// tests/integration/documentPlatformServiceIntegration.test.ts
//
// Phase 1.Storage chunk N+M — service-layer integration tests for
// chunk N's documentPlatformService.createSourceDocument. Two
// surfaces (per Sub-Q A locked file 3):
//   1. End-to-end happy path: real bytes round-trip through
//      service → storage.put → RPC; verify storage bucket +
//      source_documents row + audit_log row all populated.
//   2. Orphan-blob path (Sub-Q B (a) FK violation): storage.put
//      succeeds, RPC fails on FK constraint; bytes are orphaned
//      in the bucket per ADR-0013 §1's v1 acceptance window.
//
// Sub-Q B mechanism — deliberate withInvariants Invariant 3
// bypass:
//   The service's withInvariants pre-flight (Invariant 3 at
//   withInvariants.ts:59-70) checks org_id against
//   ctx.caller.org_ids — a MEMBERSHIP-LIST check against the
//   verified ServiceContext, NOT a DB-existence check against
//   the organizations table. The test crafts a ServiceContext
//   with org_ids: [absentUuid] so that:
//     (a) Invariant 3 passes (absentUuid IS in the caller's
//         membership list)
//     (b) storage.put succeeds (path construction uses absentUuid
//         as a string; storage layer doesn't validate FK)
//     (c) RPC INSERT fails on FK (org_id REFERENCES
//         organizations(org_id), absentUuid is not in the table)
//   This produces the orphan-blob window per ADR-0013 §1: bytes
//   in storage at the absent-org path; no source_documents row.
//
// Sub-Q G — Z1 #11.b subpattern: §11 reading-ambiguity deferral
//
//   ADR-0013 §11 includes 'ingestion_initial_set' as a trigger
//   value for the storage_status_changed audit event. Three
//   readings of §11 surfaced at chunk N+1 onset:
//     Reading A: ingestion is a tracked transition; chunk N
//                should emit storage_status_changed with
//                trigger=ingestion_initial_set alongside the
//                source_document_created event.
//     Reading B: source_document_created captures initial state
//                implicitly; storage_status_changed fires only
//                on UPDATE-time transitions.
//     Reading C: ingestion_initial_set is reserved-but-not-
//                emitted in v1; intended for post-v1 reserved-
//                provider ingest paths (SharePoint / S3 /
//                external_url) where drift detection makes
//                initial-set audit useful for drift-baselining.
//                v1 supabase_storage is drift-exempt per §5, so
//                initial-set audit isn't needed.
//
//   Founder-locked Reading C + δ-2 + δ-3-lite addendum: defer
//   storage_status_changed v1-active emission per substrate-now-
//   enforcement-later default posture; document the §11 reading
//   ambiguity as v1-ship-gate-gated obligation candidate.
//
//   Per Sub-Q G chunk-N+M-G adjudication: this comment is the
//   load-bearing on-disk artifact documenting the deferral. NO
//   storage_status_changed test is added here. A future chunk
//   (post-v1 reserved-provider activation OR v1-ship-gate
//   resolution) will add the test under whichever reading
//   ratifies at that gate. See chunk N+1 closeout adjudication
//   in friction-journal.

import { describe, it, expect, afterAll } from 'vitest';
import { adminClient, SEED } from '../setup/testDb';
import { makeTestContext } from '../setup/makeTestContext';
import { documentPlatformService } from '@/services/document-platform/documentPlatformService';
import { ServiceError } from '@/services/errors/ServiceError';

const STORAGE_BUCKET = 'documents';
const TEST_FILENAME = 'service-integration-test.pdf';
const TEST_BYTES = new TextEncoder().encode(
  'Phase 1.Storage chunk N+M service-integration content',
);
const TEST_MIME = 'application/pdf';

describe('Phase 1.Storage chunk N+M: documentPlatformService end-to-end', () => {
  describe('happy path: bytes round-trip + source_documents + audit_log all populated', () => {
    const ctx = makeTestContext({ org_ids: [SEED.ORG_HOLDING] });
    const trackedKeys: string[] = [];

    afterAll(async () => {
      const db = adminClient();
      if (trackedKeys.length > 0) {
        await db.storage.from(STORAGE_BUCKET).remove(trackedKeys);
      }
      await db.from('audit_log').delete().eq('trace_id', ctx.trace_id);
      // source_documents rows accumulate (delete-forbidden); reset
      // on `pnpm db:reset` per harness contract.
    });

    it('createSourceDocument writes bytes to storage + inserts source_documents + emits audit_log', async () => {
      const result = await documentPlatformService.createSourceDocument(
        {
          bytes: TEST_BYTES,
          mime_type: TEST_MIME,
          org_id: SEED.ORG_HOLDING,
          original_filename: TEST_FILENAME,
          ingest_channel: 'direct_upload',
          received_at: new Date().toISOString(),
          created_by: SEED.USER_CONTROLLER,
        },
        ctx,
      );
      trackedKeys.push(result.storage_key);

      // Result shape contract per CreateSourceDocumentResult
      expect(result.id).toBeTruthy();
      expect(result.storage_key).toBe(
        `org_${SEED.ORG_HOLDING}/sources/${result.id}/${TEST_FILENAME}`,
      );
      expect(result.content_hash).toMatch(/^[0-9a-f]{64}$/);
      expect(result.byte_size).toBe(TEST_BYTES.byteLength);
      expect(result.provider).toBe('supabase_storage');

      // Bucket contains the bytes
      const db = adminClient();
      const { data: downloaded, error: downloadError } = await db.storage
        .from(STORAGE_BUCKET)
        .download(result.storage_key);
      expect(downloadError).toBeNull();
      expect(downloaded).toBeTruthy();
      const downloadedBytes = new Uint8Array(await downloaded!.arrayBuffer());
      expect(downloadedBytes).toEqual(TEST_BYTES);

      // source_documents row exists with the canonical fields
      const { data: docRow } = await db
        .from('source_documents')
        .select(
          'id, org_id, storage_provider, original_storage_key, original_content_hash, original_byte_size, original_filename, mime_type, ingest_channel, storage_status, created_by',
        )
        .eq('id', result.id)
        .single();

      expect(docRow).toBeTruthy();
      expect(docRow!.org_id).toBe(SEED.ORG_HOLDING);
      expect(docRow!.storage_provider).toBe('supabase_storage');
      expect(docRow!.original_storage_key).toBe(result.storage_key);
      expect(docRow!.original_content_hash).toBe(result.content_hash);
      expect(docRow!.original_byte_size).toBe(TEST_BYTES.byteLength);
      expect(docRow!.original_filename).toBe(TEST_FILENAME);
      expect(docRow!.mime_type).toBe(TEST_MIME);
      expect(docRow!.ingest_channel).toBe('direct_upload');
      expect(docRow!.storage_status).toBe('available');
      expect(docRow!.created_by).toBe(SEED.USER_CONTROLLER);

      // audit_log row exists with the source_document_created shape
      const { data: auditRows } = await db
        .from('audit_log')
        .select('action, entity_type, entity_id, before_state, trace_id, user_id, org_id')
        .eq('trace_id', ctx.trace_id);

      expect(auditRows).toHaveLength(1);
      expect(auditRows![0].action).toBe('source_document_created');
      expect(auditRows![0].entity_type).toBe('source_document');
      expect(auditRows![0].entity_id).toBe(result.id);
      expect(auditRows![0].before_state).toBeNull();
      expect(auditRows![0].user_id).toBe(SEED.USER_CONTROLLER);
      expect(auditRows![0].org_id).toBe(SEED.ORG_HOLDING);
    });
  });

  describe('orphan-blob path: storage.put succeeds, RPC FK fails (Sub-Q B a)', () => {
    // Crafted ServiceContext with absent UUID in org_ids — see
    // file-top comment for the deliberate Invariant 3 bypass
    // mechanism + ADR-0013 §1 v1 orphan-blob acceptance framing.
    const absentOrgId = crypto.randomUUID();
    const ctx = makeTestContext({ org_ids: [absentOrgId] });
    const orphanedKeys: string[] = [];

    afterAll(async () => {
      const db = adminClient();
      if (orphanedKeys.length > 0) {
        await db.storage.from(STORAGE_BUCKET).remove(orphanedKeys);
      }
      // No audit_log cleanup needed — the RPC rolled back, so no
      // audit row was ever inserted under ctx.trace_id.
    });

    it('FK violation on absent org_id leaves bytes in bucket but no source_documents row', async () => {
      const db = adminClient();
      let thrownError: unknown = null;

      try {
        await documentPlatformService.createSourceDocument(
          {
            bytes: TEST_BYTES,
            mime_type: TEST_MIME,
            org_id: absentOrgId,
            original_filename: TEST_FILENAME,
            ingest_channel: 'direct_upload',
            received_at: new Date().toISOString(),
            created_by: SEED.USER_CONTROLLER,
          },
          ctx,
        );
        expect.fail('createSourceDocument should have thrown on FK violation');
      } catch (err) {
        thrownError = err;
      }

      // Service wraps the PostgREST 23503 in
      // ServiceError('STORAGE_OPERATION_FAILED') per
      // documentPlatformService.ts:179-184.
      expect(thrownError).toBeInstanceOf(ServiceError);
      expect((thrownError as ServiceError).code).toBe(
        'STORAGE_OPERATION_FAILED',
      );

      // Reconstruct the orphan-blob storage_key from the deterministic
      // §14 path scheme. The service pre-generated source_document_id
      // at line 104 BEFORE put(), so the bucket has bytes at a
      // path that includes the (now-thrown-away) UUID. We can't
      // recover the exact UUID from the thrown error, but we CAN
      // enumerate the org_<absentOrgId>/ prefix which has only this
      // one orphan blob (no prior tests have used absentOrgId).
      const orphanPrefix = `org_${absentOrgId}/sources`;
      const { data: sourcesEntries } = await db.storage
        .from(STORAGE_BUCKET)
        .list(orphanPrefix);

      // Exactly one orphan source_document folder under the absent org.
      expect(sourcesEntries).toBeTruthy();
      expect(sourcesEntries).toHaveLength(1);

      const orphanDocId = sourcesEntries![0].name;
      const docPrefix = `${orphanPrefix}/${orphanDocId}`;
      const { data: orphanFiles } = await db.storage
        .from(STORAGE_BUCKET)
        .list(docPrefix);
      expect(orphanFiles).toHaveLength(1);
      expect(orphanFiles![0].name).toBe(TEST_FILENAME);

      const orphanKey = `${docPrefix}/${TEST_FILENAME}`;
      orphanedKeys.push(orphanKey);

      // No source_documents row exists for this orphan UUID — the
      // RPC rolled back on FK violation. The bytes-only state is
      // the orphan-blob window per ADR-0013 §1.
      const { data: docRow } = await db
        .from('source_documents')
        .select('id')
        .eq('id', orphanDocId)
        .maybeSingle();
      expect(docRow).toBeNull();

      // No audit_log row exists for this trace_id — RPC rolled back
      // both INSERTs atomically per chunk N's RPC migration.
      const { data: auditRows } = await db
        .from('audit_log')
        .select('audit_log_id')
        .eq('trace_id', ctx.trace_id);
      expect(auditRows).toHaveLength(0);
    });
  });
});
