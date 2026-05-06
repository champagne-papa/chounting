// src/services/document-platform/documentPlatformService.ts
//
// INV-SERVICE-001 export contract: createSourceDocument is the
// canonical writer of source_documents (and the source_document_created
// audit_log entry). No other service inserts to either table per
// ADR-0011 §1 entity ownership boundary. Wrapped via withInvariants
// per Pattern A (export-site wrapping) — the established pattern for
// services without action-permission variants per journalEntryService
// list/get precedent.
//
// INV-SERVICE-002 adminClient discipline: every database access in
// this file goes through `adminClient()` from `@/db/adminClient`. No
// userClient import; no direct supabase-js client construction.
//
// Per ADR-0020 authority gradient: Layer 2 (services) domain service.
// Allowed import targets: core, db, contracts, shared, services
// (same-layer). NOT allowed: agent, app, React.
//
// =============================================================
// Atomicity contract (γ-1 per chunk N session lock)
//
// Per ADR-0013 §16 verbatim: source_document_created audit event
// fires "in the same transaction as the source_documents INSERT."
// This is a transactional integrity guarantee, not a service-layer
// convention.
//
// In Supabase JS, sequential `.insert()` calls are NOT atomic at the
// PostgREST request layer — each call is its own request-level
// transaction. Same-transaction guarantees require an RPC.
//
// Chunk N follows the journalEntryService.post() precedent
// (`20240134000000_write_journal_entry_atomic_rpc.sql`) and uses the
// `create_source_document_with_audit` RPC defined in
// `20240137000000_create_source_document_with_audit_rpc.sql`. The RPC
// executes INSERT source_documents + INSERT audit_log atomically in
// one BEGIN/COMMIT envelope.
//
// recordMutation.ts is NOT called from this service. The audit_log
// INSERT lives inside the RPC body. The service-layer redactPii call
// (used by other services for INSERT/UPDATE/DELETE before_state
// payloads) is not needed here because INSERT events have no
// before_state per recordMutation convention.
// =============================================================
//
// Flow:
//   1. withInvariants pre-flight validates ctx + org_id consistency.
//   2. Service generates fresh source_documents.id via
//      crypto.randomUUID() — this is required up-front for the §14
//      storage path construction at step 3.
//   3. Service dispatches storageProviderService.put() (resolved via
//      chunk 4 resolver) to write bytes + verify hash. Per chunk 4
//      contract, put() does upload + verify-readback per ADR-0013 §9
//      and returns PutResult { storage_key, content_hash, byte_size,
//      provider }.
//   4. Service constructs RPC payloads (sourceDocumentPayload +
//      auditPayload) per ADR-0011 §2 schema + ADR-0013 §16 audit shape.
//   5. Service calls create_source_document_with_audit RPC. RPC executes
//      both INSERTs atomically; returns the generated id.
//   6. Service returns CreateSourceDocumentResult.
//
// =============================================================
// v1 orphan-blob acceptance per ADR-0013 §1
//
// If step 3 succeeds (bytes written to storage) but step 5 fails (RPC
// errors before commit), the bytes already at storage_key are
// orphaned. v1 accepts this risk per §1 framing; cleanup is post-v1
// garbage-collection (ADR-0014 pipeline scope).
//
// If step 3 fails (storage put failure), step 5 is skipped; service
// throws ServiceError with chunk 3 classifier-mapped code.
// =============================================================

import { adminClient } from '@/db/adminClient';
import { ServiceError } from '@/services/errors/ServiceError';
import type { ServiceContext } from '@/services/middleware/serviceContext';
import { withInvariants } from '@/services/middleware/withInvariants';
import { loggerWith } from '@/shared/logger/pino';
import { getStorageProvider } from '@/services/storage/resolver';
import type {
  CreateSourceDocumentInput,
  CreateSourceDocumentResult,
} from './types';

// v1 system-fixed: every write picks supabase_storage per ADR-0013 §2
// "v1's selection is mechanical: every write picks supabase_storage".
// Per-org default (post-v1) lands when the org_settings sub-arc ships
// per chunk 1 Sub-Q4 a-prime adjudication.
const V1_STORAGE_PROVIDER = 'supabase_storage' as const;

async function createSourceDocumentImpl(
  input: CreateSourceDocumentInput,
  ctx: ServiceContext,
): Promise<CreateSourceDocumentResult> {
  const log = loggerWith({
    trace_id: ctx.trace_id,
    user_id: ctx.caller.user_id,
  });

  // Generate id up-front — required for the §14 storage path
  // construction (org_{org_id}/sources/{source_document_id}/{filename})
  // at the storage.put() call below, AND used as source_documents.id
  // at INSERT time inside the RPC. Pre-generating in app code matches
  // the established journalEntries write-order pattern.
  const source_document_id = crypto.randomUUID();

  // Resolve provider per chunk 4 resolver — v1 returns the supabase
  // implementation. Reserved providers throw STORAGE_OPERATION_FAILED.
  const storageProvider = getStorageProvider(V1_STORAGE_PROVIDER);

  log.debug(
    { source_document_id, org_id: input.org_id },
    'documentPlatformService.createSourceDocument: begin',
  );

  // Step 3: write bytes to storage. Per chunk 4, put() does upload +
  // verify-readback per ADR-0013 §9 within the put() call. On
  // failure, throws ServiceError with chunk 3 classifier-mapped code
  // (STORAGE_KEY_MALFORMED, INTEGRITY_VERIFY_FAILED,
  // STORAGE_PROVIDER_TRANSIENT_EXHAUSTED, or STORAGE_OPERATION_FAILED).
  const putResult = await storageProvider.put(
    {
      bytes: input.bytes,
      mime_type: input.mime_type,
      org_id: input.org_id,
      source_document_id,
      original_filename: input.original_filename,
    },
    ctx,
  );

  // Steps 4-5: dispatch RPC for atomic INSERT source_documents +
  // INSERT audit_log per ADR-0013 §16 same-transaction guarantee.
  const db = adminClient();

  // sourceDocumentPayload mirrors source_documents schema (chunk 1
  // migration). storage_status = 'available' since storage.put() above
  // already completed put-and-verify per chunk 4; the
  // 'pending_initial_verify' default is for in-flight ingestion paths
  // that INSERT before verify completes (not exercised here).
  // legal_entity_id defaults to org_id per ADR-0011 §10 v1 1-1 mapping.
  const sourceDocumentPayload = {
    id: source_document_id,
    org_id: input.org_id,
    legal_entity_id: input.org_id,
    storage_provider: V1_STORAGE_PROVIDER,
    original_storage_key: putResult.storage_key,
    original_content_hash: putResult.content_hash,
    original_byte_size: putResult.byte_size,
    original_filename: input.original_filename,
    mime_type: input.mime_type,
    ingest_channel: input.ingest_channel,
    storage_status: 'available' as const,
    received_at: input.received_at,
    created_by: input.created_by,
  };

  // auditPayload per ADR-0013 §16 source_document_created audit event.
  // entity_id is set by the RPC body (it's the just-INSERTed source
  // document's id, which equals source_document_id we passed in).
  // before_state omitted per recordMutation convention for INSERT
  // events (no prior state to capture).
  const auditPayload = {
    org_id: input.org_id,
    user_id: ctx.caller.user_id,
    trace_id: ctx.trace_id,
    action: 'source_document_created',
    entity_type: 'source_document',
    after_state_id: source_document_id,
    tool_name: null,
    idempotency_key: null,
    reason: null,
  };

  const { data, error } = await db.rpc('create_source_document_with_audit', {
    p_source_document: sourceDocumentPayload,
    p_audit: auditPayload,
  });

  if (error) {
    throw new ServiceError(
      'STORAGE_OPERATION_FAILED',
      `Failed to create source_document via RPC: ${error.message}`,
      error,
    );
  }

  // Sanity check: RPC returns the id we passed in (it's also the just-
  // INSERTed source_documents.id). Mismatch indicates a programming
  // error in the RPC body or a JSONB-cast surprise.
  if (!data || data !== source_document_id) {
    throw new ServiceError(
      'STORAGE_OPERATION_FAILED',
      `RPC returned unexpected id: expected ${source_document_id}, got ${String(data)}`,
    );
  }

  log.debug(
    { source_document_id, storage_key: putResult.storage_key },
    'documentPlatformService.createSourceDocument: complete',
  );

  return {
    id: source_document_id,
    storage_key: putResult.storage_key,
    content_hash: putResult.content_hash,
    byte_size: putResult.byte_size,
    provider: putResult.provider,
  };
}

export const documentPlatformService = {
  // withInvariants Pattern A (export-site wrapping). createSourceDocument
  // has no action-permission variants (createSourceDocument is the
  // single creation path; no adjust/correction shapes), so Pattern B
  // (route-handler-wrapped) is not needed.
  createSourceDocument: withInvariants(createSourceDocumentImpl),
};
