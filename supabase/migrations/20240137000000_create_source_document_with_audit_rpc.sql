-- =============================================================
-- 20240137000000_create_source_document_with_audit_rpc.sql
-- Phase 1.Storage chunk N — atomic source_documents + audit_log
-- write RPC.
-- =============================================================
-- Defines `create_source_document_with_audit(p_source_document JSONB,
-- p_audit JSONB) RETURNS UUID`. Service-layer
-- documentPlatformService.createSourceDocument calls this RPC after
-- storageProviderService.put() succeeds; the RPC executes both INSERTs
-- (source_documents + audit_log) atomically in one BEGIN/COMMIT
-- envelope.
--
-- Atomicity is the load-bearing property of this migration. Per
-- docs/02_specs/ledger_truth_model.md INV-AUDIT-001 leaf:
--   "Every service function that writes to a tenant-scoped table also
--    writes a row to `audit_log` inside the same database transaction."
-- The source_document_created audit event lives in this RPC so it
-- commits atomically with the source_documents INSERT (parallel
-- pattern to 20240134000000_write_journal_entry_atomic_rpc.sql:45-52).
--
-- In Supabase JS, sequential `.insert()` calls are NOT atomic at the
-- PostgREST request layer (each call is its own request-level
-- transaction). RPC invocation IS atomic — the entire function body
-- commits or rolls back as one unit per Postgres transaction
-- semantics.
--
-- Mirrors the 20240134000000_write_journal_entry_atomic_rpc.sql
-- pattern: heavy comment block citing rollback paths + invariants;
-- JSONB payload params; service-layer constructs payloads (with
-- redactPii applied where applicable); RPC inserts already-prepared
-- shapes.
--
-- Rollback paths:
--   * source_documents Layer 1 CHECK constraints
--     (storage_provider_v1_active; storage_status_v1_active;
--     original_byte_size >= 0) — fire on INSERT and abort the
--     transaction.
--   * source_documents FK constraints (org_id, legal_entity_id →
--     organizations) — invalid FK aborts.
--   * source_documents column-immutability trigger fires on UPDATE
--     only, not INSERT; INSERT path is unaffected.
--   * audit_log append-only triggers (per 20240122000000) fire on
--     UPDATE/DELETE only; INSERT is allowed.
--   * audit_log Layer 1a (RLS append-only) — service_role bypasses
--     RLS, so service-role-invoked RPC INSERTs proceed.
--
-- INV-AUDIT-001 (Layer 2): the audit_log INSERT lives in this RPC so
-- it commits atomically with source_documents. Splitting audit out
-- would defeat the same-transaction guarantee that makes audit
-- trustworthy (see ledger_truth_model.md INV-AUDIT-001 leaf).
--
-- before_state for INSERT events: omitted per recordMutation
-- convention. audit_log allows NULL before_state (per migration
-- 20240122000000 + 20240123000000). The service-layer caller passes
-- before_state = null in the auditPayload; this RPC inserts that
-- null directly.
--
-- See docs/02_specs/ledger_truth_model.md INV-AUDIT-001 leaf.
-- See docs/07_governance/adr/0011-document-platform.md §1 (entity
-- ownership) + §2 (source_documents schema).
-- See docs/07_governance/adr/0013-storage-provider.md §16 (audit
-- events for storage layer; source_document_created shape).
-- See supabase/migrations/20240134000000_write_journal_entry_atomic_rpc.sql
-- for the parallel RPC pattern this migration mirrors.
-- =============================================================

CREATE OR REPLACE FUNCTION create_source_document_with_audit(
  p_source_document JSONB,
  p_audit           JSONB
)
RETURNS UUID AS $$
DECLARE
  v_source_document_id UUID;
BEGIN
  -- p_source_document.id is the caller-pre-generated UUID (matches
  -- source_documents.id default of gen_random_uuid() but service-
  -- layer pre-generates because the §14 storage path requires the
  -- id before INSERT — see service comment header for write-order
  -- rationale). Echoed back in the RETURN clause for service-layer
  -- sanity check.
  v_source_document_id := (p_source_document->>'id')::uuid;

  INSERT INTO source_documents (
    id,
    org_id,
    legal_entity_id,
    storage_provider,
    original_storage_key,
    original_content_hash,
    original_byte_size,
    original_filename,
    mime_type,
    ingest_channel,
    storage_status,
    received_at,
    created_by
  )
  VALUES (
    v_source_document_id,
    (p_source_document->>'org_id')::uuid,
    NULLIF(p_source_document->>'legal_entity_id', '')::uuid,
    (p_source_document->>'storage_provider')::storage_provider,
    p_source_document->>'original_storage_key',
    p_source_document->>'original_content_hash',
    (p_source_document->>'original_byte_size')::bigint,
    p_source_document->>'original_filename',
    p_source_document->>'mime_type',
    (p_source_document->>'ingest_channel')::ingest_channel,
    (p_source_document->>'storage_status')::storage_status,
    (p_source_document->>'received_at')::timestamptz,
    p_source_document->>'created_by'
  );

  -- INSERT audit_log. Pattern mirrors 20240134000000 RPC's audit
  -- INSERT block. entity_id is v_source_document_id (the just-INSERTed
  -- source_document.id), so the service-layer caller does not need to
  -- round-trip this value in the audit payload (it is implicit).
  INSERT INTO audit_log (
    org_id,
    user_id,
    trace_id,
    action,
    entity_type,
    entity_id,
    before_state,
    after_state_id,
    tool_name,
    idempotency_key,
    reason
  )
  VALUES (
    NULLIF(p_audit->>'org_id', '')::uuid,
    NULLIF(p_audit->>'user_id', '')::uuid,
    (p_audit->>'trace_id')::uuid,
    p_audit->>'action',
    p_audit->>'entity_type',
    v_source_document_id,
    p_audit->'before_state',
    NULLIF(p_audit->>'after_state_id', '')::uuid,
    p_audit->>'tool_name',
    NULLIF(p_audit->>'idempotency_key', '')::uuid,
    p_audit->>'reason'
  );

  -- Return the just-INSERTed source_documents.id. Supabase JS
  -- exposes RETURNS UUID as the data field of the RPC response;
  -- the service-layer caller compares it to its pre-generated id
  -- as a sanity check.
  RETURN v_source_document_id;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER;

GRANT EXECUTE ON FUNCTION create_source_document_with_audit(JSONB, JSONB) TO service_role;
