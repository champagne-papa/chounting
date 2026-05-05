// src/services/storage/storageProviderService.ts
// The StorageProvider interface contract per ADR-0013 §1.
//
// =============================================================
// withInvariants discipline — ADR-0013 §1 verbatim:
//
//   "storageProviderService runs at the data-access layer. It is
//    NOT wrapped in withInvariants(). Invariants apply to ledger
//    and domain mutations; storage operations emit typed
//    ServiceError per Service Communication Rule 5."
//
// This is enforcement, not convention. Callers (document-platform
// service layer) wrap their own write paths through withInvariants
// and call StorageProvider methods inside that wrapper. Provider
// implementations themselves do NOT pre-flight ctx through the
// withInvariants runner. They receive ctx as a typed parameter for
// trace_id propagation and audit/logging context.
// =============================================================
//
// Per-provider polymorphism per ADR-0013 §1: each active value of
// the storage_provider enum maps to one implementation. v1 active:
// supabase_storage (chunk 4). Reserved: sharepoint_drive,
// s3_bucket, external_url (post-v1 activation briefs).
//
// Failure classification per ADR-0013 §7 — implementations map
// native error responses to one of three categories:
//   - Transient retryable → retry per §8 → on budget exhaustion
//     emit STORAGE_PROVIDER_TRANSIENT_EXHAUSTED.
//   - Provider-unavailable / persistent → exception queue routing
//     (post-v1; v1 supabase_storage doesn't trigger this category).
//   - Permanent malformed → emit STORAGE_KEY_MALFORMED or
//     INTEGRITY_VERIFY_FAILED.
// Catchall STORAGE_OPERATION_FAILED (repo-convention; not in ADR
// text) for unexpected failures not classified by the matrix —
// reach for verbatim codes first.
//
// v1 orphan-blob acceptance per ADR-0013 §1: if document-platform's
// source_documents INSERT fails after a successful storage put(),
// the bytes already written remain at the storage_key. Cleanup is
// post-v1 garbage-collection per ADR-0014's pipeline. v1 accepts
// this risk in exchange for not inventing two-phase commit between
// storage and Postgres.
//
// Audit emission per ADR-0013 §16 lands in chunk 5. Storage methods
// themselves do not emit audit_log events; the document-platform
// caller emits source_document_created (after successful
// put-then-INSERT), source_document_version_captured (when a new
// source_document_versions row lands), storage_status_changed
// (every transition per §11) through the canonical writer
// (recordMutation.ts per INV-AUDIT-001). URL-minting (previewUrl)
// and pure reads (fetch, fetchVersion) are NOT audited per §16.
//
// =============================================================
// Anti-scope for chunk 2 (interface-only):
//   - Concrete provider implementations (chunk 4)
//   - Provider resolver / factory dispatch (chunk 4 — co-located
//     with the supabase implementation since the resolver has no
//     consumer until at least one implementation exists)
//   - Failure-classification helper (chunk 3)
//   - Retry helper with exponential backoff + jitter (chunk 3)
//   - Integrity-check helper (chunk 3)
//   - Audit-event emission wiring (chunk 5)
//   - Tests (chunk 6)
// =============================================================

import type { ServiceContext } from '@/services/middleware/serviceContext';
import type {
  PutInput,
  PutResult,
  FetchResult,
  PreviewOptions,
  PreviewResult,
  IntegrityResult,
} from './types';

export interface StorageProvider {
  // Per ADR-0013 §1: write bytes. Implementation computes SHA-256
  // pre-write, writes bytes to the provider, re-reads bytes and
  // computes SHA-256 of the re-read bytes per §9, compares the two
  // hashes, returns { storage_key, content_hash, byte_size, provider }
  // on success. Failure modes per §7 / §8.
  put(input: PutInput, ctx: ServiceContext): Promise<PutResult>;

  // Per ADR-0013 §1: read bytes for the current version (resolves
  // current_version_id per §3 read-resolution path). Returns
  // { bytes, content_hash, provider }.
  fetch(
    source_document_id: string,
    ctx: ServiceContext,
  ): Promise<FetchResult>;

  // Per ADR-0013 §1: read bytes for a specific version row. Used for
  // replayability per ADR-0011 §9 — fetching the bytes captured at a
  // prior source_document_versions row.
  fetchVersion(
    source_document_version_id: string,
    ctx: ServiceContext,
  ): Promise<FetchResult>;

  // Per ADR-0013 §1 + §12: return signed URL + expiry for preview /
  // download. URL-minting is NOT audited per §16. PreviewOptions
  // surface is minimal in chunk 2 (ttl_seconds); §12 expansion lands
  // when chunk 4's supabase implementation or a downstream consumer
  // forces the additional surface.
  previewUrl(
    source_document_id: string,
    options: PreviewOptions,
    ctx: ServiceContext,
  ): Promise<PreviewResult>;

  // Per ADR-0013 §1: rare path. Storage-layer delete is the bytes-
  // removal step only; the source_documents row cascade lives in the
  // document-platform service layer. Per ADR-0011 §4, source-document
  // deletion requires controller authority and produces an audit_log
  // entry — both enforced by the calling service layer.
  delete(source_document_id: string, ctx: ServiceContext): Promise<void>;

  // Per ADR-0013 §1 + §9: recompute hash from bytes at the resolved
  // (provider, storage_key) and compare against the current version's
  // content_hash. Drives drift detection (§5; post-v1 since
  // supabase_storage is exempt from drift in v1). Mismatch produces
  // typed ServiceError (INTEGRITY_VERIFY_FAILED); success returns
  // IntegrityResult.
  verifyIntegrity(
    source_document_id: string,
    ctx: ServiceContext,
  ): Promise<IntegrityResult>;
}
