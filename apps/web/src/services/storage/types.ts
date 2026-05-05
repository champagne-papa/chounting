// src/services/storage/types.ts
// Shared types for the storageProviderService interface contract.
//
// Per ADR-0013 §1  (interface contract — input/output shapes) +
//     ADR-0013 §6  (capture_reason, cross-reference) +
//     ADR-0013 §9  (integrity-check policy — IntegrityResult shape) +
//     ADR-0013 §11 (storage_status, cross-reference) +
//     ADR-0013 §12 (preview/download URL behavior — PreviewOptions
//                   surface; v1 ships minimum shape per substrate-
//                   now-enforcement-later, full §12 surface lands at
//                   consumer-code time).
//
// These types are consumed by:
//   - storageProviderService.ts (the StorageProvider interface
//     declaration)
//   - apps/web/src/services/storage/providers/* (per-provider
//     implementations landing in chunk 4)
//   - document-platform service callers wrapping put-then-INSERT in
//     their own withInvariants block (later phase)
//
// Reserved-enum-states three-layer defense per ADR-0010:
//   Layer 1 (DB CHECK) ships in the chunk 1 migration.
//   Layer 2 (Zod boundary) lands alongside provider implementations
//           (chunk 4) at the service-input boundary.
//   Layer 3 (service no-emit) lands in chunk 4 (Supabase provider) +
//           chunk 5 (audit-event emission).
// The TS types here are the type-system surface of the contract.

import type { Database } from '@/db/types';

// The DB-canonical storage_provider enum. Active v1 value:
// 'supabase_storage'; reserved values activate post-v1 per ADR-0013
// §14 per-provider implementation skeletons.
export type StorageProviderEnum =
  Database['public']['Enums']['storage_provider'];

// PutInput — bytes + minimal metadata required for the storage write.
//
// Storage layer is data-access infrastructure; the document-platform
// caller owns source_documents row metadata (ingest_channel,
// original_filename, etc.). Per ADR-0013 §1: storage layer concerns
// itself with "all blob bytes I/O" — only what's needed to write bytes
// lives here. Other source_documents fields are populated by the
// document-platform service that calls put() and then INSERTs the
// source_documents row in its own withInvariants-wrapped transaction.
export interface PutInput {
  // The bytes to write. Uint8Array is the platform-neutral common
  // denominator across provider SDKs (Supabase Storage, S3,
  // SharePoint Graph, external_url fetchers); provider
  // implementations may wrap into Buffer/Blob/Stream as needed for
  // their SDK (Buffer.from(uint8) is trivial in Node-runtime
  // implementations; reverse coercion is also trivial). Choosing
  // Uint8Array at the contract layer keeps the interface portable
  // across runtimes (Node, Workers, Deno) without locking to
  // Node-runtime APIs.
  bytes: Uint8Array;

  // HTTP Content-Type for the stored object. Required at storage layer
  // because providers (Supabase Storage, S3, SharePoint) all bind
  // content-type at write time.
  mime_type: string;

  // The org under which to scope the storage key. Storage layer scopes
  // paths by org_id (e.g., supabase storage path = `${org_id}/${uuid}`)
  // to mirror RLS-scoped read semantics on source_documents. Storage
  // layer does NOT validate org_id against caller's memberships — that
  // is withInvariants's responsibility on the calling service per
  // ADR-0013 §1 (storage runs at the data-access layer; invariants
  // apply to the calling domain layer).
  org_id: string;
}

// PutResult — what put() returns on success.
// Per ADR-0013 §1 verbatim: "{ storage_key, content_hash, byte_size,
// provider }".
export interface PutResult {
  // Provider-scoped key for the written bytes. Document-platform
  // caller persists this as source_documents.original_storage_key
  // (per ADR-0013 §4 cross-ADR naming resolution shipped in chunk 1).
  storage_key: string;

  // SHA-256 of the bytes as written, verified post-write per ADR-0013
  // §9 integrity-check policy. Document-platform caller persists this
  // as source_documents.original_content_hash.
  content_hash: string;

  // Byte count of the written object. Document-platform caller
  // persists this as source_documents.original_byte_size.
  byte_size: number;

  // Which provider holds the bytes. v1 always 'supabase_storage'.
  provider: StorageProviderEnum;
}

// FetchResult — what fetch() and fetchVersion() return on success.
// Per ADR-0013 §1 verbatim: "{ bytes, content_hash, provider }".
export interface FetchResult {
  // The bytes as read from the provider. Uint8Array per the
  // platform-neutral contract (see PutInput.bytes for full rationale).
  bytes: Uint8Array;

  // SHA-256 of the bytes as captured at write time (NOT recomputed on
  // read; this is the row's content_hash from source_document_versions
  // or source_documents.original_content_hash). To recompute and
  // verify against the stored bytes, call verifyIntegrity().
  content_hash: string;

  provider: StorageProviderEnum;
}

// PreviewOptions — caller-supplied options for preview URL generation.
//
// ADR-0013 §1 names the `options` parameter without enumerating fields;
// §12 (preview/download URL behavior) specifies the full surface.
// Chunk 2 ships a minimum shape (ttl_seconds) per substrate-now-
// enforcement-later — chunk 4 expands as the supabase implementation
// or a §12 verbatim re-read at consumer-code time forces additional
// fields (e.g., download-disposition headers, signed-url scope, content-
// disposition for inline-vs-attachment behavior).
export interface PreviewOptions {
  // Time-to-live for the preview URL in seconds. Per ADR-0013 §Closes
  // Q73, org_settings.preview_url_default_ttl and
  // org_settings.preview_url_max_ttl bound the value post-v1; v1 uses
  // system-fixed bounds because org_settings is deferred to a later
  // sub-arc (per chunk 1 Sub-Q4 a-prime adjudication).
  ttl_seconds?: number;
}

// PreviewResult — what previewUrl() returns on success.
// Per ADR-0013 §1 verbatim: "{ url, expires_at, provider }".
export interface PreviewResult {
  // Signed URL the caller hands to the browser for download/preview.
  url: string;

  // ISO-8601 timestamp at which the URL expires. Caller can re-mint by
  // calling previewUrl() again.
  expires_at: string;

  provider: StorageProviderEnum;
}

// IntegrityResult — what verifyIntegrity() returns on success.
//
// Per ADR-0013 §9: "the two hashes must match" defines the success
// path. Mismatch produces typed ServiceError (INTEGRITY_VERIFY_FAILED)
// per §9, NOT a `matches: false` return — the failure surfaces as
// throw, so this shape is success-only. Callers that want
// non-throwing mismatch detection (e.g., post-v1 drift-detection
// queue routing) will need a separate softer surface; chunk 2 ships
// the throw-on-mismatch shape per the §9 verbatim contract.
export interface IntegrityResult {
  // The computed hash (matches the row's expected content_hash since
  // mismatch would have thrown).
  content_hash: string;

  // Byte count of the verified object.
  byte_size: number;

  provider: StorageProviderEnum;
}
