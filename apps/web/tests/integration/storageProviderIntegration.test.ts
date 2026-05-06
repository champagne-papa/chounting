// tests/integration/storageProviderIntegration.test.ts
//
// Phase 1.Storage chunk N+M — integration tests for chunk 4
// supabaseStorageProvider against real Supabase Storage. Three
// surfaces (per Sub-Q A locked file 1):
//   1. previewUrl TTL boundary clamping (Sub-Q F: 6 cases with
//      tolerance window)
//   2. verifyIntegrity hash-mismatch round-trip (chunk 4 §9
//      integrity-check policy)
//   3. bucket-not-found via Sub-Q D (b) drop-and-recreate (the
//      only Sub-Q with active brainstorm-side / WSL-side
//      adjudication divergence; founder elected (b) per
//      integration-test purity discipline)
//
// Bucket lifecycle:
//   - globalSetup loads test_helpers.sql which idempotently
//     INSERTs 'documents' into storage.buckets (chunk N+M
//     hygiene addition). Recovery on every vitest run.
//   - The bucket-not-found describe drops the bucket in
//     beforeAll and recreates it in afterAll. Other describes
//     in this file run with the bucket present.
//   - bucket-not-found describe runs LAST in declaration order
//     so its drop doesn't affect earlier describes (vitest runs
//     describes in declaration order within a file).
//
// Cleanup posture per chunk N+M scope:
//   - bucket objects: removed in afterAll
//   - audit_log rows: removed in afterAll by trace_id
//   - source_documents rows: NOT removed (delete-forbidden per
//     trg_source_documents_no_delete; rows accumulate within a
//     vitest run and reset on `pnpm db:reset` per harness
//     contract). Each test uses a unique UUID so accumulation
//     doesn't cause cross-test interference.

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { adminClient, SEED } from '../setup/testDb';
import { makeTestContext } from '../setup/makeTestContext';
import { createSupabaseStorageProvider } from '@/services/storage/providers/supabaseStorageProvider';
import { ServiceError } from '@/services/errors/ServiceError';
import { documentPlatformService } from '@/services/document-platform/documentPlatformService';

const STORAGE_BUCKET = 'documents';
const TEST_FILENAME = 'test.pdf'; // Needs no sanitization; predictable storage_key.
const TEST_BYTES = new TextEncoder().encode(
  'Phase 1.Storage chunk N+M test content',
);
const TEST_MIME = 'application/pdf';

describe('Phase 1.Storage chunk N+M: supabaseStorageProvider integration', () => {
  describe('previewUrl TTL boundary clamping (Sub-Q F)', () => {
    const provider = createSupabaseStorageProvider();
    const ctx = makeTestContext({ org_ids: [SEED.ORG_HOLDING] });
    let sourceDocumentId: string;
    let storageKey: string;

    beforeAll(async () => {
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
      sourceDocumentId = result.id;
      storageKey = result.storage_key;
    });

    afterAll(async () => {
      const db = adminClient();
      await db.storage.from(STORAGE_BUCKET).remove([storageKey]);
      await db.from('audit_log').delete().eq('trace_id', ctx.trace_id);
      // source_documents row NOT deleted (delete-forbidden per
      // trg_source_documents_no_delete); accumulates within run.
    });

    // Per Sub-Q F lock + verify-from-disk:
    //   clampTtl = Math.min(Math.max(1, ttl ?? 300), 1800)
    //   PREVIEW_TTL_DEFAULT_SECONDS = 300
    //   PREVIEW_TTL_MAX_SECONDS     = 1800
    //   expires_at = ISO of Date.now() + ttl * 1000
    const cases: Array<{
      input: number | undefined;
      expected: number;
      label: string;
    }> = [
      { input: undefined, expected: 300, label: 'undefined → default 300' },
      { input: 0, expected: 1, label: '0 → min-clamp 1' },
      { input: 1, expected: 1, label: '1 → unchanged (min boundary)' },
      { input: 300, expected: 300, label: '300 → unchanged' },
      { input: 1800, expected: 1800, label: '1800 → unchanged (max boundary)' },
      { input: 3600, expected: 1800, label: '3600 → max-clamp 1800' },
    ];

    for (const { input, expected, label } of cases) {
      it(`ttl_seconds ${label}`, async () => {
        // Tolerance window for expires_at: capture Date.now() before
        // and after the call; assert returned expires_at falls in
        // [before + expected*1000, after + expected*1000 + 100ms]
        // to avoid flakiness from clock granularity + ISO round-trip.
        const before = Date.now();
        const result = await provider.previewUrl(
          sourceDocumentId,
          input === undefined ? {} : { ttl_seconds: input },
          ctx,
        );
        const after = Date.now();

        const expiresMs = new Date(result.expires_at).getTime();
        expect(expiresMs).toBeGreaterThanOrEqual(before + expected * 1000);
        expect(expiresMs).toBeLessThanOrEqual(after + expected * 1000 + 100);

        expect(result.url).toBeTruthy();
        expect(result.provider).toBe('supabase_storage');
      });
    }
  });

  describe('verifyIntegrity hash-mismatch round-trip', () => {
    const provider = createSupabaseStorageProvider();
    const ctx = makeTestContext({ org_ids: [SEED.ORG_HOLDING] });
    let sourceDocumentId: string;
    let storageKey: string;

    beforeAll(async () => {
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
      sourceDocumentId = result.id;
      storageKey = result.storage_key;
    });

    afterAll(async () => {
      const db = adminClient();
      await db.storage.from(STORAGE_BUCKET).remove([storageKey]);
      await db.from('audit_log').delete().eq('trace_id', ctx.trace_id);
    });

    it('overwriting bucket bytes with different content causes verifyIntegrity to throw INTEGRITY_VERIFY_FAILED', async () => {
      // Corrupt the storage object via direct upsert. The
      // source_documents row's content_hash still reflects the
      // original (pre-corruption) bytes; verifyIntegrity downloads
      // the corrupted bytes and recomputes SHA-256 → mismatch →
      // verifyHash throws ServiceError('INTEGRITY_VERIFY_FAILED')
      // per integrity.ts:64-69.
      const db = adminClient();
      const corruptedBytes = new TextEncoder().encode(
        'corrupted bytes do not match the original SHA-256',
      );
      const { error: uploadError } = await db.storage
        .from(STORAGE_BUCKET)
        .upload(storageKey, corruptedBytes, {
          contentType: TEST_MIME,
          upsert: true,
        });
      expect(uploadError).toBeNull();

      try {
        await provider.verifyIntegrity(sourceDocumentId, ctx);
        expect.fail(
          'verifyIntegrity should have thrown INTEGRITY_VERIFY_FAILED',
        );
      } catch (err) {
        expect(err).toBeInstanceOf(ServiceError);
        expect((err as ServiceError).code).toBe('INTEGRITY_VERIFY_FAILED');
      }
    });
  });

  // Sub-Q D (b) drop-and-recreate. Runs LAST in declaration order
  // so earlier describes (TTL, hash-mismatch) execute with the
  // bucket present. afterAll recreates the bucket; if afterAll
  // fails (process killed mid-test, network blip), the
  // test_helpers.sql idempotent INSERT in globalSetup restores
  // bucket presence on the next vitest run.
  describe('bucket-not-found (Sub-Q D b: drop-and-recreate)', () => {
    const provider = createSupabaseStorageProvider();
    const ctx = makeTestContext({ org_ids: [SEED.ORG_HOLDING] });

    beforeAll(async () => {
      const db = adminClient();
      // Supabase requires the bucket to be empty before deletion.
      // Earlier describes' afterAll cleanups should have emptied
      // their own keys. Defensive: list any remaining keys and
      // remove them across the org_-prefixed folder structure.
      const remainingKeys = await listAllStorageKeys(db, STORAGE_BUCKET);
      if (remainingKeys.length > 0) {
        await db.storage.from(STORAGE_BUCKET).remove(remainingKeys);
      }
      const { error: deleteError } = await db.storage.deleteBucket(
        STORAGE_BUCKET,
      );
      if (deleteError) throw deleteError;
    });

    afterAll(async () => {
      const db = adminClient();
      // Idempotent recreate: only create if missing (the test_helpers
      // INSERT may re-run on next globalSetup, but within this
      // afterAll we restore eagerly so subsequent files in the run
      // see the bucket).
      const { data: buckets } = await db.storage.listBuckets();
      const exists = buckets?.some((b) => b.name === STORAGE_BUCKET);
      if (!exists) {
        const { error } = await db.storage.createBucket(STORAGE_BUCKET, {
          public: false,
        });
        if (error) throw error;
      }
    });

    it('put against missing bucket throws ServiceError', async () => {
      try {
        await provider.put(
          {
            bytes: TEST_BYTES,
            mime_type: TEST_MIME,
            org_id: SEED.ORG_HOLDING,
            source_document_id: crypto.randomUUID(),
            original_filename: TEST_FILENAME,
          },
          ctx,
        );
        expect.fail(
          'put should have thrown when bucket is missing',
        );
      } catch (err) {
        // Supabase storage returns 4xx for bucket-not-found. Per
        // failureClassification.ts:90-115, 4xx (excluding auth/throttle)
        // maps to permanent_malformed → withRetry re-throws as
        // ServiceError('STORAGE_KEY_MALFORMED') per retry.ts:78-85.
        expect(err).toBeInstanceOf(ServiceError);
        // Code is STORAGE_KEY_MALFORMED in v1 classifier behavior; if a
        // future Supabase SDK changes the status semantics, this
        // assertion documents the expected mapping. Broad-fallback to
        // any ServiceError would weaken the test; keeping specific.
        expect((err as ServiceError).code).toBe('STORAGE_KEY_MALFORMED');
      }
    });
  });
});

// Helper: list all storage keys under the §14 path scheme
// (org_*/sources/*/<filename>). Used only by the bucket-not-found
// describe's beforeAll defensive cleanup. Top-level Supabase list()
// returns folders + files at the listed prefix; nested objects need
// recursive descent through the §14 prefix structure.
async function listAllStorageKeys(
  db: ReturnType<typeof adminClient>,
  bucket: string,
): Promise<string[]> {
  const keys: string[] = [];
  const { data: topLevel } = await db.storage.from(bucket).list();
  for (const entry of topLevel ?? []) {
    if (!entry.name.startsWith('org_')) continue;
    const orgPrefix = entry.name;
    const { data: orgLevel } = await db.storage.from(bucket).list(orgPrefix);
    for (const sub of orgLevel ?? []) {
      if (sub.name !== 'sources') continue;
      const sourcesPrefix = `${orgPrefix}/sources`;
      const { data: sourcesLevel } = await db.storage
        .from(bucket)
        .list(sourcesPrefix);
      for (const docFolder of sourcesLevel ?? []) {
        const docPrefix = `${sourcesPrefix}/${docFolder.name}`;
        const { data: files } = await db.storage.from(bucket).list(docPrefix);
        for (const file of files ?? []) {
          keys.push(`${docPrefix}/${file.name}`);
        }
      }
    }
  }
  return keys;
}
