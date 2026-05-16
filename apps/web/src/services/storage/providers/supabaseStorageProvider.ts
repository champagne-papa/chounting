// src/services/storage/providers/supabaseStorageProvider.ts
// Supabase Storage implementation of the StorageProvider interface
// per ADR-0013 §14.
//
// Path pattern (§14 verbatim): org_{org_id}/sources/{source_document_id}/{filename}
// Filename is sanitized to remove unsafe chars before path construction;
// the unsanitized original is preserved on source_documents.original_filename
// by the document-platform caller after put() succeeds.
//
// Bucket: 'documents' (provisioned in
// supabase/migrations/20240136000000_storage_buckets.sql per chunk 4
// Sub-Q I lock).
//
// withInvariants discipline (per ADR-0013 §1; cross-reference): this
// provider is data-access-layer infrastructure; NOT wrapped in
// withInvariants. Callers (document-platform service layer) wrap their
// own write paths through withInvariants and call provider methods
// inside that wrapper. Provider receives ctx for trace_id propagation
// and audit/logging context only — it does not pre-flight ctx through
// the withInvariants runner.
//
// Failure handling: each network-bound operation is wrapped in withRetry
// per §8. classifier integration happens inside withRetry (chunk 3).
// Hash verification per §9 throws INTEGRITY_VERIFY_FAILED on mismatch
// (not retryable; permanent_malformed condition per §7).
//
// Audit emission: NOT emitted by this layer. Per §16, storage events
// (source_document_created, source_document_version_captured,
// storage_status_changed, controller_override_resolution,
// drift_exception_created) are emitted by the document-platform
// service layer at chunk 5.
//
// Bytes encoding: Uint8Array per chunk 2 contract. Supabase SDK accepts
// Uint8Array directly via its ArrayBufferView slot. Blob from .download()
// is converted to Uint8Array via .arrayBuffer() + new Uint8Array(buf).
//
// Read-resolution paths per ADR-0013 §3: fetch / previewUrl /
// verifyIntegrity all resolve through current_version_id (or fall back
// to original_storage_key when current_version_id is NULL). fetchVersion
// reads a specific version row directly. delete enumerates all storage
// keys (original + every version) for the source_document and removes
// them all (single supabase storage.remove() call accepts an array).

import type { SupabaseClient } from '@supabase/supabase-js';
import { adminClient } from '@/db/adminClient';
import { ServiceError } from '@/services/errors/ServiceError';
import { loggerWith } from '@/shared/logger/pino';
import type {
  StorageProvider,
  StorageProviderContext,
} from '../storageProviderService';
import type {
  PutInput,
  PutResult,
  FetchResult,
  PreviewOptions,
  PreviewResult,
  IntegrityResult,
  StorageProviderEnum,
} from '../types';
import { withRetry } from '../retry';
import { computeHash, verifyHash } from '../integrity';

const PROVIDER: StorageProviderEnum = 'supabase_storage';
const STORAGE_BUCKET = 'documents';

// Per ADR-0013 §12 (system-fixed v1 bounds).
const PREVIEW_TTL_DEFAULT_SECONDS = 300; // 5 minutes
const PREVIEW_TTL_MAX_SECONDS = 1800; // 30 minutes

// Sanitize a filename for use in a Supabase storage path. Replaces
// path separators, control chars, and parent-dir refs with safe
// equivalents; collapses whitespace runs; trims leading/trailing
// underscores. The original (unsanitized) form is preserved by the
// document-platform caller on source_documents.original_filename.
function sanitizeFilenameForStoragePath(name: string): string {
  const trimmed = name.trim() || 'unnamed';
  const sanitized = trimmed
    .replace(/\.\./g, '_')
    .replace(/[/\\]/g, '_')
    .replace(/[\x00-\x1f\x7f]/g, '_')
    .replace(/\s+/g, '_')
    .replace(/^_+|_+$/g, '');
  return sanitized || 'unnamed';
}

// Build the §14 verbatim storage path for a (org, doc, filename) tuple.
function buildStorageKey(
  orgId: string,
  sourceDocumentId: string,
  filename: string,
): string {
  const safeFilename = sanitizeFilenameForStoragePath(filename);
  return `org_${orgId}/sources/${sourceDocumentId}/${safeFilename}`;
}

// Clamp the requested TTL to v1 system-fixed bounds per §12.
function clampTtl(requested: number | undefined): number {
  const ttl = requested ?? PREVIEW_TTL_DEFAULT_SECONDS;
  return Math.min(Math.max(1, ttl), PREVIEW_TTL_MAX_SECONDS);
}

interface ResolvedStorageRef {
  storage_key: string;
  content_hash: string;
  byte_size_expected: number;
}

// Resolve current_version's storage ref from source_documents row.
// Falls back to original_storage_key when current_version_id is NULL
// (the implicit-version-1 case per ADR-0011 §2).
async function resolveCurrentStorageRef(
  db: SupabaseClient,
  source_document_id: string,
): Promise<ResolvedStorageRef> {
  const { data: doc, error: docErr } = await db
    .from('source_documents')
    .select(
      'original_storage_key, original_content_hash, original_byte_size, current_version_id',
    )
    .eq('id', source_document_id)
    .maybeSingle();
  if (docErr) {
    throw new ServiceError(
      'STORAGE_OPERATION_FAILED',
      `Failed to load source_document ${source_document_id}: ${docErr.message}`,
      docErr,
    );
  }
  if (!doc) {
    throw new ServiceError(
      'STORAGE_OPERATION_FAILED',
      `source_document ${source_document_id} not found`,
    );
  }

  if (doc.current_version_id) {
    const { data: ver, error: verErr } = await db
      .from('source_document_versions')
      .select('storage_key, content_hash, byte_size')
      .eq('id', doc.current_version_id)
      .maybeSingle();
    if (verErr) {
      throw new ServiceError(
        'STORAGE_OPERATION_FAILED',
        `Failed to load source_document_version ${doc.current_version_id}: ${verErr.message}`,
        verErr,
      );
    }
    if (!ver) {
      throw new ServiceError(
        'STORAGE_OPERATION_FAILED',
        `source_document_version ${doc.current_version_id} not found (referenced by source_document ${source_document_id})`,
      );
    }
    return {
      storage_key: ver.storage_key,
      content_hash: ver.content_hash,
      byte_size_expected: ver.byte_size,
    };
  }

  return {
    storage_key: doc.original_storage_key,
    content_hash: doc.original_content_hash,
    byte_size_expected: doc.original_byte_size,
  };
}

// Resolve a specific version row's storage ref directly.
async function resolveVersionStorageRef(
  db: SupabaseClient,
  source_document_version_id: string,
): Promise<ResolvedStorageRef> {
  const { data, error } = await db
    .from('source_document_versions')
    .select('storage_key, content_hash, byte_size')
    .eq('id', source_document_version_id)
    .maybeSingle();
  if (error) {
    throw new ServiceError(
      'STORAGE_OPERATION_FAILED',
      `Failed to load source_document_version ${source_document_version_id}: ${error.message}`,
      error,
    );
  }
  if (!data) {
    throw new ServiceError(
      'STORAGE_OPERATION_FAILED',
      `source_document_version ${source_document_version_id} not found`,
    );
  }
  return {
    storage_key: data.storage_key,
    content_hash: data.content_hash,
    byte_size_expected: data.byte_size,
  };
}

// Collect all storage keys associated with a source_document (the
// original + every version row). Used by delete() for full bytes
// removal.
async function collectAllStorageKeys(
  db: SupabaseClient,
  source_document_id: string,
): Promise<string[]> {
  const { data: doc, error: docErr } = await db
    .from('source_documents')
    .select('original_storage_key')
    .eq('id', source_document_id)
    .maybeSingle();
  if (docErr) {
    throw new ServiceError(
      'STORAGE_OPERATION_FAILED',
      `Failed to load source_document ${source_document_id}: ${docErr.message}`,
      docErr,
    );
  }
  if (!doc) {
    throw new ServiceError(
      'STORAGE_OPERATION_FAILED',
      `source_document ${source_document_id} not found`,
    );
  }

  const { data: versions, error: verErr } = await db
    .from('source_document_versions')
    .select('storage_key')
    .eq('source_document_id', source_document_id);
  if (verErr) {
    throw new ServiceError(
      'STORAGE_OPERATION_FAILED',
      `Failed to load versions for source_document ${source_document_id}: ${verErr.message}`,
      verErr,
    );
  }

  const keys = new Set<string>([doc.original_storage_key]);
  for (const v of versions ?? []) {
    keys.add(v.storage_key);
  }
  return Array.from(keys);
}

// Download bytes from the storage bucket as a Uint8Array.
async function downloadBytes(
  db: SupabaseClient,
  storage_key: string,
): Promise<Uint8Array> {
  const { data, error } = await db.storage
    .from(STORAGE_BUCKET)
    .download(storage_key);
  if (error) throw error;
  if (!data) {
    throw new ServiceError(
      'STORAGE_OPERATION_FAILED',
      `Empty data on download for storage_key=${storage_key}`,
    );
  }
  const arrayBuf = await data.arrayBuffer();
  return new Uint8Array(arrayBuf);
}

export function createSupabaseStorageProvider(): StorageProvider {
  return {
    async put(input: PutInput, ctx: StorageProviderContext): Promise<PutResult> {
      const {
        bytes,
        mime_type,
        org_id,
        source_document_id,
        original_filename,
      } = input;
      const log = loggerWith({
        trace_id: ctx.trace_id,
        user_id: ctx.caller.user_id ?? undefined,
      });
      const storage_key = buildStorageKey(
        org_id,
        source_document_id,
        original_filename,
      );
      const expectedHash = computeHash(bytes);
      const byte_size = bytes.byteLength;

      log.debug({ storage_key, byte_size }, 'storage.put: begin');
      const db = adminClient();

      // Upload — wrapped in withRetry per §8.
      await withRetry(async () => {
        const { error } = await db.storage
          .from(STORAGE_BUCKET)
          .upload(storage_key, bytes, {
            contentType: mime_type,
            upsert: false,
          });
        if (error) throw error;
      });

      // Verify-readback per §9 — withRetry on the network read; verifyHash local.
      const reReadBytes = await withRetry(() => downloadBytes(db, storage_key));
      verifyHash(reReadBytes, expectedHash);

      log.debug({ storage_key }, 'storage.put: complete');

      return {
        storage_key,
        content_hash: expectedHash,
        byte_size,
        provider: PROVIDER,
      };
    },

    async fetch(
      source_document_id: string,
      ctx: StorageProviderContext,
    ): Promise<FetchResult> {
      const log = loggerWith({
        trace_id: ctx.trace_id,
        user_id: ctx.caller.user_id ?? undefined,
      });
      const db = adminClient();
      const ref = await resolveCurrentStorageRef(db, source_document_id);
      log.debug(
        { source_document_id, storage_key: ref.storage_key },
        'storage.fetch: begin',
      );
      const bytes = await withRetry(() => downloadBytes(db, ref.storage_key));
      return {
        bytes,
        content_hash: ref.content_hash,
        provider: PROVIDER,
      };
    },

    async fetchVersion(
      source_document_version_id: string,
      ctx: StorageProviderContext,
    ): Promise<FetchResult> {
      const log = loggerWith({
        trace_id: ctx.trace_id,
        user_id: ctx.caller.user_id ?? undefined,
      });
      const db = adminClient();
      const ref = await resolveVersionStorageRef(db, source_document_version_id);
      log.debug(
        { source_document_version_id, storage_key: ref.storage_key },
        'storage.fetchVersion: begin',
      );
      const bytes = await withRetry(() => downloadBytes(db, ref.storage_key));
      return {
        bytes,
        content_hash: ref.content_hash,
        provider: PROVIDER,
      };
    },

    async previewUrl(
      source_document_id: string,
      options: PreviewOptions,
      ctx: StorageProviderContext,
    ): Promise<PreviewResult> {
      const log = loggerWith({
        trace_id: ctx.trace_id,
        user_id: ctx.caller.user_id ?? undefined,
      });
      const db = adminClient();
      const ref = await resolveCurrentStorageRef(db, source_document_id);
      const ttl = clampTtl(options.ttl_seconds);

      // Per §12: 'preview' renders inline (no Content-Disposition);
      // 'download' attaches via Content-Disposition. Supabase
      // createSignedUrl 'download' option: pass true to attach.
      const signedUrlOptions: { download?: boolean } = {};
      if (options.mode === 'download') {
        signedUrlOptions.download = true;
      }

      const { data, error } = await db.storage
        .from(STORAGE_BUCKET)
        .createSignedUrl(ref.storage_key, ttl, signedUrlOptions);
      if (error) {
        throw new ServiceError(
          'STORAGE_OPERATION_FAILED',
          `Failed to create signed URL for storage_key=${ref.storage_key}: ${error.message}`,
          error,
        );
      }
      if (!data?.signedUrl) {
        throw new ServiceError(
          'STORAGE_OPERATION_FAILED',
          `Empty signedUrl for storage_key=${ref.storage_key}`,
        );
      }

      const expires_at = new Date(Date.now() + ttl * 1000).toISOString();
      log.debug(
        {
          source_document_id,
          storage_key: ref.storage_key,
          ttl,
          mode: options.mode ?? 'preview',
        },
        'storage.previewUrl: minted',
      );

      return {
        url: data.signedUrl,
        expires_at,
        provider: PROVIDER,
      };
    },

    async delete(
      source_document_id: string,
      ctx: StorageProviderContext,
    ): Promise<void> {
      const log = loggerWith({
        trace_id: ctx.trace_id,
        user_id: ctx.caller.user_id ?? undefined,
      });
      const db = adminClient();
      const keys = await collectAllStorageKeys(db, source_document_id);
      log.debug(
        { source_document_id, key_count: keys.length },
        'storage.delete: begin',
      );

      await withRetry(async () => {
        const { error } = await db.storage.from(STORAGE_BUCKET).remove(keys);
        if (error) throw error;
      });

      log.debug(
        { source_document_id, key_count: keys.length },
        'storage.delete: complete',
      );
    },

    async verifyIntegrity(
      source_document_id: string,
      ctx: StorageProviderContext,
    ): Promise<IntegrityResult> {
      const log = loggerWith({
        trace_id: ctx.trace_id,
        user_id: ctx.caller.user_id ?? undefined,
      });
      const db = adminClient();
      const ref = await resolveCurrentStorageRef(db, source_document_id);
      log.debug(
        { source_document_id, storage_key: ref.storage_key },
        'storage.verifyIntegrity: begin',
      );

      const bytes = await withRetry(() => downloadBytes(db, ref.storage_key));
      verifyHash(bytes, ref.content_hash);

      const byte_size = ref.byte_size_expected ?? bytes.byteLength;
      log.debug(
        { source_document_id, byte_size },
        'storage.verifyIntegrity: matched',
      );

      return {
        content_hash: ref.content_hash,
        byte_size,
        provider: PROVIDER,
      };
    },
  };
}
