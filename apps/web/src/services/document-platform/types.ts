// src/services/document-platform/types.ts
// Types for the document-platform service per ADR-0011 §1 + §2.
//
// Per ADR-0011 §2, source_documents row creation has three field
// categories:
//   - Caller-provided: org_id, raw bytes, mime_type, original_filename,
//     ingest_channel, received_at, created_by
//   - Service-derived (from storage layer): original_content_hash,
//     original_byte_size, original_storage_key (all returned from
//     storageProviderService.put() per chunk 4 PutResult contract)
//   - Service-generated: id (crypto.randomUUID()), created_at (DB
//     default NOW())
//
// CreateSourceDocumentInput captures the caller-provided shape only;
// the service derives + generates the rest.
//
// CreateSourceDocumentResult returns the generated id + the
// storage-layer confirmed metadata so the caller has the canonical
// record for downstream use (e.g., the upload route returning the
// new source_document_id to the UI).

import type { Database } from '@/db/types';

export type StorageProviderEnum =
  Database['public']['Enums']['storage_provider'];
export type IngestChannelEnum =
  Database['public']['Enums']['ingest_channel'];

export interface CreateSourceDocumentInput {
  // The bytes to store. Service computes SHA-256 + byte_size from these
  // by passing them to storageProviderService.put() per chunk 4 contract.
  bytes: Uint8Array;

  // HTTP Content-Type for the stored object. Caller-provided per
  // ADR-0011 §2 — the document-platform service does NOT detect MIME
  // type; the ingestion route is responsible for detection (e.g.,
  // mime-types lib) before calling this service.
  mime_type: string;

  // Original filename as supplied by the caller. Used in §14 storage
  // path construction (sanitized by chunk 4) AND stored on
  // source_documents.original_filename (unsanitized) for display.
  original_filename: string;

  // The org under which to scope the document. withInvariants
  // pre-flight validates this against ctx.caller.org_ids.
  org_id: string;

  // Ingestion channel discriminator per ADR-0011 §2 closed enum
  // (drag_drop_pdf, forwarded_mailbox, direct_upload, api_ingest).
  ingest_channel: IngestChannelEnum;

  // ISO-8601 timestamp of when the document was received at the
  // platform boundary. Caller-provided per §2; distinct from
  // created_at (DB default NOW() at INSERT time).
  received_at: string;

  // Caller's user_id; persisted as source_documents.created_by.
  // Service does NOT validate this against ctx.caller.user_id —
  // withInvariants pre-flight already verified ctx.caller. Caller is
  // responsible for passing the same user_id consistently.
  created_by: string;
}

export interface CreateSourceDocumentResult {
  // The generated source_documents.id (UUID; crypto.randomUUID()).
  // Caller uses this for downstream references (FK from other tables;
  // UI-side document selection; etc.).
  id: string;

  // Storage layer's confirmed key (after put-and-verify) per chunk 4
  // PutResult contract. Document-platform persists this as
  // source_documents.original_storage_key per the §14 path pattern.
  storage_key: string;

  // SHA-256 of the bytes as written, verified post-write per ADR-0013
  // §9 integrity-check policy. Persisted as original_content_hash.
  content_hash: string;

  // Byte count of the stored object. Persisted as original_byte_size.
  byte_size: number;

  // Which provider holds the bytes. v1 always 'supabase_storage' per
  // ADR-0013 §2 mechanical selection.
  provider: StorageProviderEnum;
}
