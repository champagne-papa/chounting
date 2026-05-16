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

  // Parent ingest_batches.id (UUID). Required at chunk 6.2a per
  // Sub-Q4 Step C activation (migration 153). Caller (drag-drop
  // ingestionService at chunk 6.2b; forwarded_mailbox ingestionService
  // at chunk 6.3) creates the parent ingest_batches row first via
  // chunk 6.1's create_ingest_batch_with_documents_with_audit RPC,
  // then passes the returned batch_id here. Test fixtures use
  // tests/helpers/createIngestBatchForTest.ts to obtain a batch_id.
  // Production code MUST NOT call create_ingest_batch_for_test
  // (Layer 3 service-no-emit per migration 153 _for_test suffix
  // convention).
  ingest_batch_id: string;

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

// =============================================================
// Drag-drop ingestion contract (chunk 6.2b)
//
// Sub-Q1 lock: drag-drop UX surface is canvas-only (DocumentIntakeRail
//   on the right edge of the layout per PRD Phase 2 vision).
// Sub-Q3 lock: multi-file POST, no explicit application-layer cap at
//   v1 (Next.js body limits apply as implicit fallback).
// Sub-Q9 lock: all-or-nothing + Zod pre-validate at ingress. If any
//   file fails Zod validation, the entire batch is rejected before
//   any storage put. If any storage put fails mid-batch,
//   ingestionService throws ServiceError with details carrying
//   file_index + filename + stage; orphan blobs from prior successful
//   puts are cleaned by ADR-0014 §10 GC.
// Sub-Q8 lock: single trace_id (from ServiceContext) propagates across
//   the entire drag-drop event — 1 ingest_batches row + N
//   source_documents + N document_cases + N document_jobs + 1
//   audit_log row.
//
// drop_session_id is a per-drop-event identifier (client-generated
// UUID per Flag 1 lock). Every file in a single drop event shares
// the same drop_session_id; it lives on ingest_batches.channel_metadata
// rather than on each source_documents row.
// =============================================================

// One file in a drag-drop batch. Lean shape — bytes + content-type
// + filename. drop_session_id and org_id live at the batch level
// (DragDropUploadInput), not on each file, per Sub-Q1 lock.
export interface DragDropFileInput {
  bytes: Uint8Array;
  mime_type: string;
  original_filename: string;
}

// Input to ingestionService.handleDragDropUpload — the batch envelope.
// Composed by the drag-drop route handler from the multipart form-data
// payload. created_by is derived from ctx.caller.user_id in the
// service body (not passed through the input).
export interface DragDropUploadInput {
  org_id: string;
  drop_session_id: string;  // client-generated UUID per drop event
  files: DragDropFileInput[];  // N files; no explicit cap at v1
}

// Result returned by ingestionService.handleDragDropUpload on success
// (all N files written + RPC committed atomically). Failed batches
// throw ServiceError; this shape is success-only.
export interface DragDropUploadResult {
  ingest_batch_id: string;  // the newly-created batch's UUID
  document_count: number;   // mirrors input.files.length on success
}

// =============================================================
// Forwarded-mailbox ingestion contract (chunk 6.3a)
//
// Sub-Q2 lock: Postmark inbound webhook + pre-parsed JSON; no MIME
//   parser library (Sub-Q3 cascade-closed).
// Sub-Q4 lock: Layer 2 service-enforced allowlist via
//   internal_sender_allowlist DB table.
// Sub-Q5 lock: 1-element p_case_sources array at service layer
//   (role='email_body'); existing chunk 6.1 RPC unchanged.
// Sub-Q6 lock: handleForwardedMailbox takes SystemActorServiceContext
//   (sister type to ServiceContext per β-3 Approach B); bypasses
//   withInvariants per Sub-Q6 Artifact 3.
// Sub-Q7 lock: email_body filename composition at service layer
//   from Postmark Subject. p_documents[0] = email_body source_document;
//   p_documents[1..N] = attachments.
//
// Idempotency: Layer 1 partial UNIQUE index on
//   (org_id, channel_metadata->>'message_id') WHERE ingest_channel =
//   'forwarded_mailbox' (migration 155 Statement 1). Service performs
//   pre-RPC SELECT check for idempotent fast-path; on rare race-
//   condition, catches RPC unique_violation and SELECTs existing.
// =============================================================

// One file in a forwarded-mailbox batch (email_body or attachment).
// Lean shape: bytes + content-type + filename. Service composes the
// synthetic email_body filename (Sub-Q7 lock) at handler entry; the
// route handler decodes Postmark base64 Content into raw bytes.
export interface ForwardedMailboxFileInput {
  bytes: Uint8Array;
  mime_type: string;
  original_filename: string;
}

// Input to ingestionService.handleForwardedMailbox — the post-Postmark
// parsed shape (snake_case; Postmark PascalCase is transformed at route
// boundary). org_id is pre-resolved by the route handler via
// resolveOrgFromMailboxHash. allowlist_email = Postmark `From` after
// .toLowerCase() normalization (used for allowlist comparison).
export interface ForwardedMailboxUploadInput {
  org_id: string;
  // Canonical channel_metadata fields (matches
  // ForwardedMailboxChannelMetadataSchema):
  from: string;           // raw Postmark From; service lowercases for allowlist
  to: string;             // raw Postmark To
  subject: string;        // raw Postmark Subject; may be empty
  message_id: string;     // Postmark MessageID (idempotency key)
  // email_body source_document at files[0]; attachments at files[1..N].
  // Service composes synthetic email_body filename per Sub-Q7 lock
  // before storage put.
  email_body: ForwardedMailboxFileInput;
  attachments: ForwardedMailboxFileInput[];
}

// Result discriminated by `status`:
//   - 'accepted': new ingest_batches row written + N+1 source_documents +
//     1 case + 1 case_sources + N+1 jobs + 1 audit_log.
//   - 'idempotent': existing batch found via message_id idempotency;
//     zero new rows written.
//   - 'rejected': allowlist rejection; only the rejection audit_log
//     row was written. No ingest_batches / source_documents / etc.
export type ForwardedMailboxUploadResult =
  | {
      status: 'accepted';
      ingest_batch_id: string;
      document_count: number;
    }
  | {
      status: 'idempotent';
      ingest_batch_id: string;
    }
  | {
      status: 'rejected';
      reason: 'not_allowlisted';
    };
