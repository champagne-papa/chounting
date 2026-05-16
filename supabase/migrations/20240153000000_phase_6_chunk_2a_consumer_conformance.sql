-- =============================================================
-- 20240153000000_phase_6_chunk_2a_consumer_conformance.sql
-- Phase 6 chunk 6.2a — Sub-Q4 Step C/D activation + Sub-Q5 RPC
-- amendment + create_ingest_batch_for_test test-only RPC.
--
-- Per chunk 6.1 carry-forward (commit 3ba9b1d) Sub-Q4 4-step
-- activation sequence:
--   (1) Update consumer (createSourceDocument signature change ships
--       in same commit as this migration);
--   (2) Backfill interim-period rows — none expected (chunk 6.1
--       sentinel-batch backfill covered pre-migration-152 rows;
--       inter-chunk window is single-session-grain);
--   (3) ALTER source_documents.ingest_batch_id SET NOT NULL (Step C);
--   (4) Extend enforce_source_documents_column_immutability trigger
--       (Step D; 12 → 13 columns).
--
-- ADR-0010 layer discipline:
--   - Layer 1: ALTER NOT NULL + trigger extension catches service_role
--     bypass of NOT NULL contract;
--   - Layer 2: TypeScript boundary at CreateSourceDocumentInput.ingest_batch_id
--     (typed-required);
--   - Layer 3: service emission at createSourceDocumentImpl always
--     passes ingest_batch_id from input.
--
-- INV-AUDIT-001: RPC amendment preserves the existing audit_log
-- emission shape (entity_type='source_document'); the new column is
-- additive on the entity row, not a new audit-grain.
--
-- _for_test suffix convention: first instance in the codebase. Codifies
-- "test-only substrate; production code never calls this." Mirrors
-- _with_audit suffix convention (mutating RPC) per F-J-ε precedent
-- (Phase 4 chunk 2).
--
-- Layer 3 service-no-emit on test-only RPC: production ingestionService
-- (chunks 6.2b + 6.3) MUST NOT call create_ingest_batch_for_test;
-- production code uses create_ingest_batch_with_documents_with_audit
-- (chunk 6.1) exclusively.
--
-- Path C invocation per chunk 6.2a brief §"Path C invocation callout":
-- combined 6.2a+6.2b LOC forecast ~1700-2300 vs chunk-3-Phase-4 ~1400
-- empirical anchor; five framings from verify-from-disk; chunk-arc-
-- shape carry-forward from chunk 6.1 meta-observation #1; wiring-with-
-- tests-pairing at each commit boundary.
--
-- See docs/07_governance/adr/0011-document-platform.md §1 (entity
-- ownership) + §2 (source_documents schema).
-- See docs/02_specs/ledger_truth_model.md INV-AUDIT-001 leaf.
-- See supabase/migrations/20240137000000_create_source_document_with_audit_rpc.sql
-- (the RPC this migration amends).
-- See supabase/migrations/20240152000000_ingestion_substrate.sql
-- §"source_documents.ingest_batch_id 3-step ALTER" (Step A + Step B
-- shipped at chunk 6.1; Step C + Step D ship here).
-- See docs/09_briefs/phase-6/chunks/2026-05-15-phase-6-chunk-2a.md
-- (this migration's authoritative brief; commit 010b5e6).
-- =============================================================

-- =============================================================
-- Statement 1: AMEND create_source_document_with_audit RPC body.
-- Function signature unchanged (still (p_source_document JSONB,
-- p_audit JSONB)); INSERT column list extends from 13 → 14 cols.
-- p_source_document JSONB shape now requires ingest_batch_id key.
-- =============================================================

CREATE OR REPLACE FUNCTION create_source_document_with_audit(
  p_source_document JSONB,
  p_audit           JSONB
)
RETURNS UUID AS $$
DECLARE
  v_source_document_id UUID;
BEGIN
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
    ingest_batch_id,            -- NEW at chunk 6.2a per Sub-Q5 lock
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
    (p_source_document->>'ingest_batch_id')::uuid,   -- NEW; required post Step C
    (p_source_document->>'storage_status')::storage_status,
    (p_source_document->>'received_at')::timestamptz,
    p_source_document->>'created_by'
  );

  -- audit_log INSERT block unchanged from migration 137.
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

  RETURN v_source_document_id;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER;

-- GRANT preserved from migration 137 (idempotent on CREATE OR REPLACE).
GRANT EXECUTE ON FUNCTION create_source_document_with_audit(JSONB, JSONB) TO service_role;

-- =============================================================
-- Statement 2: CREATE create_ingest_batch_for_test test-only RPC.
-- Test-only substrate per _for_test suffix convention. v1 callers
-- limited to tests/helpers/createIngestBatchForTest.ts +
-- chunks 6.2b/6.3 test fixtures. Production ingestionService uses
-- create_ingest_batch_with_documents_with_audit (chunk 6.1)
-- exclusively per Layer 3 service-no-emit discipline.
--
-- Narrower scope than chunk 6.1's RPC: writes a SINGLE ingest_batches
-- row only. Does NOT compose source_documents + document_cases +
-- document_jobs + audit_log. Tests that need a parent batch_id for
-- a downstream source_documents INSERT (the 30-caller refactor at
-- chunk 6.2a + future chunk-6.3 forwarded_mailbox tests) get the
-- batch_id without exercising chunk 6.1's 5-table atomic discipline
-- as a side effect.
-- =============================================================

CREATE OR REPLACE FUNCTION create_ingest_batch_for_test(
  p_org_id            UUID,
  p_ingest_channel    ingest_channel  DEFAULT 'drag_drop_pdf',
  p_received_at       TIMESTAMPTZ     DEFAULT NOW(),
  p_channel_metadata  JSONB           DEFAULT '{}'::jsonb,
  p_trace_id          UUID            DEFAULT gen_random_uuid()
)
RETURNS TABLE (ingest_batch_id UUID, trace_id UUID) AS $$
DECLARE
  v_batch_id UUID;
BEGIN
  v_batch_id := gen_random_uuid();
  INSERT INTO ingest_batches (
    id, org_id, ingest_channel, received_at, channel_metadata, trace_id, created_by
  )
  VALUES (
    v_batch_id, p_org_id, p_ingest_channel, p_received_at,
    p_channel_metadata, p_trace_id, 'test_helper_create_ingest_batch_for_test'
  );
  RETURN QUERY SELECT v_batch_id, p_trace_id;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER;

GRANT EXECUTE ON FUNCTION create_ingest_batch_for_test(
  UUID, ingest_channel, TIMESTAMPTZ, JSONB, UUID
) TO service_role;

-- =============================================================
-- Statement 3a: Backfill interim-period NULL rows.
-- Per chunk 6.1 brief carry-forward Sub-Q4 4-step activation
-- sequence step (2): "any source_documents written between chunk 6.1
-- close and Step C activation have NULL ingest_batch_id. Re-run the
-- sentinel-batch backfill query from migration 152 Step B against
-- current state."
--
-- The chunk 6.2a brief comment block above said "no interim-period
-- rows expected" — that estimate held for the inter-session window
-- of brief-drafting itself but not for any pnpm test runs that
-- created source_documents rows in the dev DB between chunk 6.1
-- ship and chunk 6.2a apply. Verify-at-implementation gate at
-- chunk 6.2a impl surfaced 76 NULL rows in dev DB across 1 distinct
-- org; backfill activates per chunk 6.1 brief carry-forward.
-- Codified at chunk close per friction-journal (D)-filter as
-- single-finding-scale Grain 5 brief-completeness gap (the brief's
-- Task 1 verify gates didn't include "check for NULL ingest_batch_id
-- rows" — a sibling of chunk 6.1's Sub-Q4 verify gate that was
-- specified at substrate level but not propagated to chunk 6.2a's
-- consumer-conformance level).
--
-- Mirrors migration 152 Step B fallback shape; distinguisher is
-- channel_metadata.migration = 153 (vs 152). Sentinel batches are
-- permanent production substrate per chunk 6.1 close meta-observation
-- #4; this backfill adds one more sentinel batch per distinct org
-- with NULL ingest_batch_id at chunk 6.2a apply time.
-- =============================================================

INSERT INTO ingest_batches (
  id, org_id, ingest_channel, received_at, channel_metadata, trace_id, created_by
)
SELECT
  gen_random_uuid(),
  sd.org_id,
  'drag_drop_pdf',
  NOW(),
  '{"sentinel": true, "migration": 153, "purpose": "backfill source_documents.ingest_batch_id at chunk 6.2a Step C activation per Sub-Q4 4-step sequence step (2)"}'::jsonb,
  gen_random_uuid(),
  'system_migration_153'
FROM (SELECT DISTINCT org_id FROM source_documents WHERE ingest_batch_id IS NULL) sd;

UPDATE source_documents
SET ingest_batch_id = (
  SELECT id FROM ingest_batches
  WHERE channel_metadata @> '{"sentinel": true, "migration": 153}'::jsonb
    AND ingest_batches.org_id = source_documents.org_id
  LIMIT 1
)
WHERE ingest_batch_id IS NULL;

-- =============================================================
-- Statement 3b: ALTER source_documents.ingest_batch_id SET NOT NULL
-- (Sub-Q4 Step C). All consumer paths updated in same commit per
-- Grain 5; interim-period rows backfilled at Statement 3a above.
-- =============================================================

ALTER TABLE source_documents
  ALTER COLUMN ingest_batch_id SET NOT NULL;

-- =============================================================
-- Statement 4: CREATE OR REPLACE enforce_source_documents_column_immutability
-- with 13-column comparison (Sub-Q4 Step D; current 12 cols + ingest_batch_id).
-- Original 12-column body at supabase/migrations/20240135000000_storage_substrate.sql:384-404.
-- Trigger binding unchanged at migration 135:406-409; CREATE OR REPLACE
-- FUNCTION semantic propagates new body to existing trigger automatically.
-- =============================================================

CREATE OR REPLACE FUNCTION enforce_source_documents_column_immutability()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.id                    IS DISTINCT FROM NEW.id                    OR
     OLD.org_id                IS DISTINCT FROM NEW.org_id                OR
     OLD.legal_entity_id       IS DISTINCT FROM NEW.legal_entity_id       OR
     OLD.storage_provider      IS DISTINCT FROM NEW.storage_provider      OR
     OLD.original_storage_key  IS DISTINCT FROM NEW.original_storage_key  OR
     OLD.original_content_hash IS DISTINCT FROM NEW.original_content_hash OR
     OLD.original_byte_size    IS DISTINCT FROM NEW.original_byte_size    OR
     OLD.original_filename     IS DISTINCT FROM NEW.original_filename     OR
     OLD.ingest_channel        IS DISTINCT FROM NEW.ingest_channel        OR
     OLD.ingest_batch_id       IS DISTINCT FROM NEW.ingest_batch_id       OR
     OLD.received_at           IS DISTINCT FROM NEW.received_at           OR
     OLD.created_at            IS DISTINCT FROM NEW.created_at            OR
     OLD.created_by            IS DISTINCT FROM NEW.created_by THEN
    RAISE EXCEPTION 'source_documents column-immutability violation: only current_version_id, storage_status, and mime_type may change post-ingestion (per ADR-0011 §2 + ADR-0013 §11)'
      USING ERRCODE = 'feature_not_supported';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
