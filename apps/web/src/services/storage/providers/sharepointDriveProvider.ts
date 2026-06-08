// src/services/storage/providers/sharepointDriveProvider.ts
// SharePoint (Microsoft Graph) implementation of the StorageProvider
// interface per ADR-0013 §1/§14 + the 2026-06-07 universal-default
// amendment. Charter B (a).
//
// Integrity (spec D-B1 / §9): put-then-re-read SHA-256 — mirrors
// supabaseStorageProvider exactly, reusing integrity.ts unchanged.
// Graph cannot return SHA-256 (sha256Hash is documented unsupported;
// quickXorHash is a different digest), so the native guarantee is NOT
// trusted in lieu of re-read; the test is the put-then-re-read SHA-256
// equality below.
//
// Auth (spec D-B2): app-only client certificate, Sites.Selected-only
// registration — see graphClient.ts.
//
// storage_key (spec D-B3): the Graph driveItem id. Per-org site/drive
// resolved from org_settings via orgDriveResolver.
//
// Graph bytes-I/O is injected (GraphIo) so the integrity sequence +
// size-gate are unit-tested against a mock; the real SDK-backed io's
// transfer correctness is gated to the real-M365 e2e (plan Task 8).
//
// Per ADR-0013 §1: data-access layer; NOT withInvariants-wrapped.
// Audit (§16) is the document-platform caller's job, not this layer.

import { ServiceError } from '@/services/errors/ServiceError';
import { computeHash, verifyHash } from '../integrity';
import type {
  PutInput,
  PutResult,
  FetchResult,
  PreviewOptions,
  PreviewResult,
  IntegrityResult,
  StorageProviderEnum,
} from '../types';
import type {
  StorageProvider,
  StorageProviderContext,
} from '../storageProviderService';
import { loggerWith } from '@/shared/logger/pino';
import { resolveOrgDrive } from './graph/orgDriveResolver';
import { realGraphIo, type GraphIo } from './graph/graphIo';

const PROVIDER: StorageProviderEnum = 'sharepoint_drive';

// Graph simple PUT supports ≤ 4 MiB; larger requires an upload session
// (spec D-B4). MiB, not MB.
const SIMPLE_UPLOAD_MAX_BYTES = 4 * 1024 * 1024;

// Per-org folder convention under the org's drive root. The drive is
// already org-scoped (resolved from org_settings), so within it the
// per-document folder suffices. Under `none` durability this is
// write-once and never reorganized (spec D-B3 caveat-deferral).
function buildParentPath(sourceDocumentId: string): string {
  return `sources/${sourceDocumentId}`;
}

// Sanitize a filename for a SharePoint path segment (mirrors the
// supabase provider's discipline). The unsanitized original is
// preserved by the document-platform caller on
// source_documents.original_filename.
function sanitizeFilename(name: string): string {
  const trimmed = name.trim() || 'unnamed';
  const sanitized = trimmed
    .replace(/\.\./g, '_')
    .replace(/[/\\:*?"<>|]/g, '_')
    .replace(/[\x00-\x1f\x7f]/g, '_')
    .replace(/\s+/g, '_')
    .replace(/^_+|_+$/g, '');
  return sanitized || 'unnamed';
}

const NOT_YET_IMPLEMENTED = (method: string): never => {
  throw new ServiceError(
    'STORAGE_OPERATION_FAILED',
    `sharepointDriveProvider.${method} not implemented yet (plan Task 3/4)`,
    { stage: 'not_implemented', method },
  );
};

// io is injected for testability; defaults to the real SDK-backed impl.
export function createSharepointDriveProvider(
  io: GraphIo = realGraphIo,
): StorageProvider {
  return {
    async put(input: PutInput, ctx: StorageProviderContext): Promise<PutResult> {
      const log = loggerWith({
        trace_id: ctx.trace_id,
        user_id: ctx.caller.user_id ?? undefined,
        org_id: input.org_id,
      });

      // Resolve the org's SharePoint site/drive (org_settings; Task 8
      // precondition — throws "not provisioned" until the slice lands).
      const { driveId } = await resolveOrgDrive(input.org_id);

      const fileName = sanitizeFilename(input.original_filename);
      const parentPath = buildParentPath(input.source_document_id);
      const expectedHash = computeHash(input.bytes);
      const byte_size = input.bytes.byteLength;

      log.debug(
        { parentPath, fileName, byte_size },
        'sharepoint.put: begin',
      );

      // Size-gate (spec D-B4): simple PUT ≤ 4 MiB, else upload session.
      const uploadInput = {
        driveId,
        parentPath,
        fileName,
        bytes: input.bytes,
        mimeType: input.mime_type,
      };
      const driveItemId =
        byte_size <= SIMPLE_UPLOAD_MAX_BYTES
          ? await io.uploadSmall(uploadInput)
          : await io.uploadLarge(uploadInput);

      // §9 integrity: re-read the written bytes and verify SHA-256
      // against the pre-write hash. Throws INTEGRITY_VERIFY_FAILED on
      // mismatch (the concrete §9 guarantee).
      const reReadBytes = await io.downloadBytes(driveId, driveItemId);
      verifyHash(reReadBytes, expectedHash);

      log.debug({ driveItemId }, 'sharepoint.put: complete');

      return {
        storage_key: driveItemId,
        content_hash: expectedHash,
        byte_size,
        provider: PROVIDER,
      };
    },

    // Tasks 3–4 implement these against the resolved storage_key
    // (driveItem id) + injected io. Stubbed so the factory satisfies
    // the StorageProvider interface while only `put` is under test.
    async fetch(
      _source_document_id: string,
      _ctx: StorageProviderContext,
    ): Promise<FetchResult> {
      return NOT_YET_IMPLEMENTED('fetch');
    },
    async fetchVersion(
      _source_document_version_id: string,
      _ctx: StorageProviderContext,
    ): Promise<FetchResult> {
      return NOT_YET_IMPLEMENTED('fetchVersion');
    },
    async previewUrl(
      _source_document_id: string,
      _options: PreviewOptions,
      _ctx: StorageProviderContext,
    ): Promise<PreviewResult> {
      return NOT_YET_IMPLEMENTED('previewUrl');
    },
    async delete(
      _source_document_id: string,
      _ctx: StorageProviderContext,
    ): Promise<void> {
      NOT_YET_IMPLEMENTED('delete');
    },
    async verifyIntegrity(
      _source_document_id: string,
      _ctx: StorageProviderContext,
    ): Promise<IntegrityResult> {
      return NOT_YET_IMPLEMENTED('verifyIntegrity');
    },
  };
}
