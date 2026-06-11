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
import {
  resolveCurrentRef,
  resolveVersionRef,
  collectAllRefs,
} from './graph/sharepointRefResolver';
import { realGraphIo, type GraphIo } from './graph/graphIo';

const PROVIDER: StorageProviderEnum = 'sharepoint_drive';

// Graph simple PUT supports ≤ 4 MiB; larger requires an upload session
// (spec D-B4). MiB, not MB.
const SIMPLE_UPLOAD_MAX_BYTES = 4 * 1024 * 1024;

// Preview URL TTL bounds per ADR-0013 §12 (system-fixed v1), matching
// supabaseStorageProvider: default 5 min, max 30 min.
const PREVIEW_TTL_DEFAULT_SECONDS = 300;
const PREVIEW_TTL_MAX_SECONDS = 1800;

function clampTtl(requested: number | undefined): number {
  const ttl = requested ?? PREVIEW_TTL_DEFAULT_SECONDS;
  return Math.min(Math.max(1, ttl), PREVIEW_TTL_MAX_SECONDS);
}

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

    // Read methods (Task 3): resolve the stored storage_key (driveItem
    // id) + org from the row, derive driveId from the row's org
    // (row-authoritative), then call the injected io. content_hash on
    // fetch is the row's stored hash, NOT recomputed (per types.ts;
    // verifyIntegrity is the recompute path).
    async fetch(
      source_document_id: string,
      _ctx: StorageProviderContext,
    ): Promise<FetchResult> {
      const ref = await resolveCurrentRef(source_document_id);
      const { driveId } = await resolveOrgDrive(ref.org_id);
      const bytes = await io.downloadBytes(driveId, ref.driveItemId);
      return { bytes, content_hash: ref.content_hash, provider: PROVIDER };
    },

    async fetchVersion(
      source_document_version_id: string,
      _ctx: StorageProviderContext,
    ): Promise<FetchResult> {
      const ref = await resolveVersionRef(source_document_version_id);
      const { driveId } = await resolveOrgDrive(ref.org_id);
      const bytes = await io.downloadBytes(driveId, ref.driveItemId);
      return { bytes, content_hash: ref.content_hash, provider: PROVIDER };
    },

    async previewUrl(
      source_document_id: string,
      options: PreviewOptions,
      _ctx: StorageProviderContext,
    ): Promise<PreviewResult> {
      const ref = await resolveCurrentRef(source_document_id);
      const { driveId } = await resolveOrgDrive(ref.org_id);
      const url = await io.getDownloadUrl(driveId, ref.driveItemId);
      // §12 TTL clamp. NOTE: Graph's @microsoft.graph.downloadUrl carries
      // its own ~1h expiry that we don't control; we report a clamped
      // (≤30 min) window so callers re-mint well within Graph's validity.
      // 'mode' (preview/download) is not enforced by downloadUrl (no
      // Content-Disposition control) — v1 limitation per spec §6.
      const ttl = clampTtl(options.ttl_seconds);
      const expires_at = new Date(Date.now() + ttl * 1000).toISOString();
      return { url, expires_at, provider: PROVIDER };
    },

    async delete(
      source_document_id: string,
      _ctx: StorageProviderContext,
    ): Promise<void> {
      // Bytes-removal step only; the source_documents cascade +
      // controller authority + audit are the calling layer's (ADR-0011
      // §4). Enumerate original + every version key.
      const { org_id, driveItemIds } = await collectAllRefs(source_document_id);
      const { driveId } = await resolveOrgDrive(org_id);
      for (const itemId of driveItemIds) {
        await io.deleteItem(driveId, itemId);
      }
    },

    // Recompute path (distinct from fetch's stored-hash return):
    // download the bytes and verifyHash against the row's content_hash.
    // Throws INTEGRITY_VERIFY_FAILED on mismatch; returns IntegrityResult
    // on match. This is the drift hook the (out-of-scope) scheduled drift
    // runner calls — NOTE: verifyIntegrity is throw-on-mismatch, so that
    // runner needs a non-throwing surface (catch INTEGRITY_VERIFY_FAILED
    // or a softer method) per spec §3.
    async verifyIntegrity(
      source_document_id: string,
      _ctx: StorageProviderContext,
    ): Promise<IntegrityResult> {
      const ref = await resolveCurrentRef(source_document_id);
      const { driveId } = await resolveOrgDrive(ref.org_id);
      const bytes = await io.downloadBytes(driveId, ref.driveItemId);
      verifyHash(bytes, ref.content_hash);
      return {
        content_hash: ref.content_hash,
        byte_size: ref.byte_size ?? bytes.byteLength,
        provider: PROVIDER,
      };
    },
  };
}
