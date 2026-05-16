-- =============================================================
-- 20240152000000_ingestion_substrate.sql
-- Phase 6 chunk 1 — ingestion substrate + atomic RPC.
--
-- Per ADR-0011 §1 entity ownership (Document Platform owns
-- ingest_batches + document_jobs; ingest_items deferred to Phase 7
-- per ADR-0011 §1 Amendment 2026-05-15 — see commit 010fe97) +
--     ADR-0011 §2 (source_documents schema + write-once contract;
--                  ingest_batch_id FK activation closes
--                  Sub-Q2(a) deferral from migration 135) +
--     ADR-0011 §3 (case lifecycle; document_jobs is the per-file
--                  work-queue Phase 7 orchestrator consumes) +
--     ADR-0014 §1 (pipeline orchestrator ships in Phase 7; this
--                  migration ships substrate only — no orchestrator
--                  runtime per Reading B at Phase 6 scope-lock) +
--     ADR-0014 §6 (dedup-by-hash idempotency; Phase 7 territory) +
--     ADR-0010   (substrate-now-enforcement-later; reserved-enum
--                 three-layer defense; column-grain reserved
--                 NULL-able columns) +
--     docs/02_specs/ledger_truth_model.md INV-AUDIT-001 leaf
--                 (audit_log INSERT in same DB transaction at
--                  batch grain — single audit row per RPC call).
--
-- Layer 1 enforcement at v1:
--   * document_job_state CHECK = 'queued'; reserved values
--     (in_flight/failed_retry/failed_permanent/completed) ship
--     in ENUM, CHECK-rejected at v1; Phase 7 broadens via ALTER
--     CONSTRAINT.
--   * ingest_channel intentionally NOT narrowed at substrate
--     (all 4 ENUM values from migration 135:152 stay v1-active
--     per migration 135 comment "all values active in v1");
--     service-level narrowing at chunks 6.2/6.3 emit only
--     drag_drop_pdf + forwarded_mailbox per spend brief §2
--     Layer-3 no-emit discipline.
--   * source_documents.ingest_batch_id NOT NULL (Sub-Q4 lock;
--     activates after 3-step ALTER closes migration 135
--     Sub-Q2(a) deferral).
--   * document_jobs.attempt_count DEFAULT 0 with NO v1-active
--     CHECK (Sub-Q3 lock — Variant A pattern per ADR-0010;
--     Phase 7 activates by writing non-zero values; do NOT
--     reflexively add CHECK by mirroring state's pattern).
--
-- DELETE protection asymmetry (Option C, workflow-class):
--   * ingest_batches + document_jobs: RLS + BEFORE DELETE trigger
--     only. NO TRUNCATE REVOKE. Workflow rows, not evidence
--     anchors; load-bearing concern is audit_log referent
--     integrity (catch service_role bypass via trigger).
--   * Mirrors document_cases pattern (migration 143:129-145) and
--     document_case_sources pattern (migration 145:110-126).
--   * Phase 1 source_documents-class evidence anchors retain
--     three-layer + REVOKE TRUNCATE — workflow rows don't.
--
-- Per-channel write composition (locked at Phase 6 chunk 1
-- brainstorming Round 7 + Round 4):
--   drag-drop event (N files):
--     1 ingest_batches + N source_documents + N document_cases
--     at state='received' + 0 document_case_sources (Phase 7
--     writes primary role post-classification) + N document_jobs.
--   forwarded_mailbox event (1 email + 1 body + N attachments):
--     1 ingest_batches + N+1 source_documents (body + attachments)
--     + 1 document_cases at state='received' (per-email grain)
--     + 1 document_case_sources (email_body role only — the only
--     v1-unambiguous role per migration 145 immutability
--     constraint) + N document_jobs (all pointing to per-email
--     document_case_id; attachment provenance via document_jobs
--     not via document_case_sources at Phase 6).
--
-- Sub-Q5 RPC shape: single 6-param JSONB RPC mirrors migration
-- 137/143/145 caller-pre-shapes-JSONB pattern scaled to 5 tables.
-- Caller (chunks 6.2/6.3 ingestionService channel-handlers)
-- constructs JSON arrays sized per channel. Single audit row at
-- batch grain (entity_type='ingest_batch', entity_id=v_batch_id);
-- per-row audit emission deferred to Phase 7 transitions on
-- document_jobs.
--
-- Anti-scope (NOT in chunk 6.1):
--   * ingest_items table — ADR-0011 §1 Amendment 2026-05-15
--     defers to Phase 7 per "land schema with consumer code"
--     discipline. Activation trigger: first Phase 7 consumer crisps.
--   * ingestionService service file + channel-handlers (chunks
--     6.2 / 6.3).
--   * POST API routes for ingest (chunks 6.2 + 6.3 webhook handler).
--   * Per-document cards UI + read endpoints (chunk 6.2).
--   * Mail receiver integration / drag-drop UX surface (chunks
--     6.3 + 6.2 scope-lock).
--   * Orchestrator runtime — Phase 7 per ADR-0014:1249.
--     document_jobs queue rows wait for Phase 7 orchestrator.
--   * Phase 7-reserved document_jobs columns (attempt_count >0,
--     started_at, completed_at, last_error_*, pipeline_trace_id)
--     — write paths defer to Phase 7 orchestrator activation.
--   * document_case_sources writes for non-email_body roles —
--     Phase 7 post-classification writes primary/supporting/
--     payment_evidence per RI Flag 5 division-of-labor.
-- =============================================================

-- =============================================================
-- BLOCK 1 — document_job_state ENUM
--
-- Full membership ships at substrate; v1-active subset enforced
-- via CHECK constraint on document_jobs.state. Mirrors
-- document_case_state pattern (migration 143:40-48).
-- =============================================================

CREATE TYPE document_job_state AS ENUM (
  -- v1 active subset (chunk 6.1):
  'queued',
  -- Reserved (Phase 7 orchestrator activation):
  'in_flight',
  'failed_retry',
  'failed_permanent',
  'completed'
);

-- =============================================================
-- BLOCK 2 — ingest_batches table + RLS + triggers
--
-- Sub-Q1 lock: channel_metadata jsonb (Layer 2 Zod-discriminated-
-- union validates at chunks 6.2/6.3 service ingress; sparseness
-- reasoning over typed columns — 7 distinct fields across 4
-- channels). Three-layer defense preserved via jsonb + Zod
-- boundary + service-only constructed shapes.
--
-- Fully-immutable envelope row: no Phase 6 mutable columns.
-- Phase 7+ may introduce mutable columns (e.g., processing
-- progress metadata) via ADR amendment + ALTER + immutability
-- trigger update.
-- =============================================================

CREATE TABLE ingest_batches (
  id                uuid             PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id            uuid             NOT NULL REFERENCES organizations(org_id) ON DELETE RESTRICT,
  ingest_channel    ingest_channel   NOT NULL,    -- ENUM from migration 135:153; all 4 values DB-active
  received_at       timestamptz      NOT NULL,
  channel_metadata  jsonb            NOT NULL,    -- Sub-Q1 lock; Layer 2 Zod validates at chunks 6.2/6.3 service ingress
  trace_id          uuid             NOT NULL,
  created_at        timestamptz      NOT NULL DEFAULT NOW(),
  created_by        text             NOT NULL     -- matches Phase 1 source_documents.created_by shape: 'agent' | <user_id>
);

CREATE INDEX ingest_batches_org_id_idx          ON ingest_batches (org_id);
CREATE INDEX ingest_batches_ingest_channel_idx  ON ingest_batches (ingest_channel);
CREATE INDEX ingest_batches_received_at_idx     ON ingest_batches (received_at);

COMMENT ON TABLE ingest_batches IS
  'Phase 6 ingestion-channel envelope per ADR-0011 §1. One row per submission event '
  '(drag-drop event = 1 batch with N items; email = 1 batch with N+1 items including body). '
  'Fully immutable post-INSERT (no Phase 6 mutable columns); column-immutability trigger '
  'catches service_role bypass of RLS WITH CHECK.';

-- RLS — mirrors document_cases pattern (migration 143:85-99)
ALTER TABLE ingest_batches ENABLE ROW LEVEL SECURITY;

CREATE POLICY ingest_batches_select ON ingest_batches
  FOR SELECT USING (user_has_org_access(org_id));

CREATE POLICY ingest_batches_insert ON ingest_batches
  FOR INSERT WITH CHECK (user_has_org_access(org_id));

-- UPDATE allowed at the RLS layer; column-restriction enforced by
-- trg_ingest_batches_column_immutability below. Fully-immutable
-- envelope at Phase 6 (no mutable columns); RLS UPDATE policy
-- exists for Phase 7+ extensibility.
CREATE POLICY ingest_batches_update ON ingest_batches
  FOR UPDATE USING (user_has_org_access(org_id))
  WITH CHECK (user_has_org_access(org_id));

CREATE POLICY ingest_batches_no_delete ON ingest_batches
  FOR DELETE USING (false);

-- Column-immutability trigger — fully-immutable envelope.
-- Mirrors document_case_sources full immutability (migration
-- 145:110-126) at column-by-column grain rather than blanket
-- mutation rejection (preserves UPDATE policy as forward-
-- compatibility for Phase 7+ mutable columns).
CREATE OR REPLACE FUNCTION enforce_ingest_batches_column_immutability()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.id               IS DISTINCT FROM NEW.id               OR
     OLD.org_id           IS DISTINCT FROM NEW.org_id           OR
     OLD.ingest_channel   IS DISTINCT FROM NEW.ingest_channel   OR
     OLD.received_at      IS DISTINCT FROM NEW.received_at      OR
     OLD.channel_metadata IS DISTINCT FROM NEW.channel_metadata OR
     OLD.trace_id         IS DISTINCT FROM NEW.trace_id         OR
     OLD.created_at       IS DISTINCT FROM NEW.created_at       OR
     OLD.created_by       IS DISTINCT FROM NEW.created_by THEN
    RAISE EXCEPTION 'ingest_batches column-immutability violation: ingestion-envelope row is fully immutable post-INSERT at Phase 6 (no v1 mutable columns; Phase 7+ may add mutable columns via ADR amendment + ALTER + trigger update)'
      USING ERRCODE = 'feature_not_supported';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_ingest_batches_column_immutability
  BEFORE UPDATE ON ingest_batches
  FOR EACH ROW
  EXECUTE FUNCTION enforce_ingest_batches_column_immutability();

-- Row-level DELETE protection — Option C asymmetry per migration
-- 143 chunk-zero adjudication. Workflow-class row; not evidence
-- anchor. Defense-in-depth for audit_log referent integrity
-- (catches service_role bypass of _no_delete RLS policy). No
-- TRUNCATE block — workflow rows are not bulk-managed data.
CREATE OR REPLACE FUNCTION reject_ingest_batches_delete()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'ingest_batches is delete-restricted — DELETE forbidden to preserve audit_log referent integrity'
    USING ERRCODE = 'feature_not_supported';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_ingest_batches_no_delete
  BEFORE DELETE ON ingest_batches
  FOR EACH ROW
  EXECUTE FUNCTION reject_ingest_batches_delete();

-- =============================================================
-- BLOCK 3 — source_documents.ingest_batch_id 3-step ALTER
--
-- Sub-Q4 verify-at-implementation gate fired at chunk 6.1
-- implementation (2026-05-15) with count = 75 source_documents
-- rows in dev DB (all single org_id 11111111-1111-1111-1111-
-- 111111111111 — seed-data dev org). Step B empty-assertion
-- would fail; sentinel-batch fallback activated per Flagged
-- Ambiguity #3 option (a) generalized to multi-org-safe SELECT
-- DISTINCT pattern. Single-org dev DB → 1 sentinel batch;
-- future multi-org cases → 1 per distinct existing org_id.
--
-- This closes Sub-Q2(a) "land schema with consumer code"
-- deferral from migration 135 (where source_documents.ingest_
-- batch_id was named but deferred pending ingest_batches table
-- existing).
-- =============================================================

-- Step A: ADD COLUMN nullable
ALTER TABLE source_documents
  ADD COLUMN ingest_batch_id uuid REFERENCES ingest_batches(id) ON DELETE RESTRICT;

-- Step B: empty-assertion (commented; Sub-Q4 gate showed count = 75
-- in dev DB at chunk 6.1 implementation — fallback activated below).
-- Reactivate this assertion if applying migration to a fresh DB
-- where production source_documents row count is verified zero.
-- DO $$
-- BEGIN
--   IF EXISTS (SELECT 1 FROM source_documents WHERE ingest_batch_id IS NULL) THEN
--     RAISE EXCEPTION 'source_documents.ingest_batch_id backfill required: % rows have NULL ingest_batch_id. Activate Step B fallback (sentinel-batch backfill) below.',
--       (SELECT COUNT(*) FROM source_documents WHERE ingest_batch_id IS NULL);
--   END IF;
-- END $$;

-- Step B fallback (ACTIVATED at chunk 6.1 implementation per
-- Sub-Q4 gate count > 0). One sentinel batch per distinct
-- existing org_id with NULL ingest_batch_id; sentinel batches
-- use 'drag_drop_pdf' as the ingest_channel placeholder (any
-- valid v1-active channel works for sentinel data; drag_drop_pdf
-- is the user-facing intuitive choice for backfilled rows).
INSERT INTO ingest_batches (
  id, org_id, ingest_channel, received_at, channel_metadata, trace_id, created_by
)
SELECT
  gen_random_uuid(),
  sd.org_id,
  'drag_drop_pdf',
  NOW(),
  '{"sentinel": true, "migration": 152, "purpose": "backfill source_documents.ingest_batch_id at chunk 6.1 close per Sub-Q4 fallback"}'::jsonb,
  gen_random_uuid(),
  'system_migration_152'
FROM (SELECT DISTINCT org_id FROM source_documents WHERE ingest_batch_id IS NULL) sd;

UPDATE source_documents sd
SET ingest_batch_id = ib.id
FROM ingest_batches ib
WHERE sd.org_id = ib.org_id
  AND ib.channel_metadata @> '{"sentinel": true, "migration": 152}'::jsonb
  AND sd.ingest_batch_id IS NULL;

-- Step C: SET NOT NULL — DEFERRED to chunks 6.2/6.3 per Sub-Q4
-- amendment 2026-05-15 (RI-10 brief amendment cycle).
--
-- Rationale: NOT NULL is a consumer contract on the column, not
-- substrate. The consumer that satisfies the contract
-- (documentPlatformService.createSourceDocument passing
-- ingest_batch_id) does not ship at chunk 6.1 — it ships at
-- chunks 6.2/6.3 with ingestionService. Activating Step C at
-- chunk 6.1 breaks every existing createSourceDocument caller
-- (57 test failures observed at chunk 6.1 implementation).
--
-- Application of "land schema with consumer code" reverse-
-- discipline at CONSTRAINT grain (not just table/column grain;
-- new precedent codified at chunk 6.1 — Flag 10 retrospective
-- candidate). Step C deferred until consumer code at chunks
-- 6.2/6.3 always supplies ingest_batch_id.
--
-- Activation trigger: chunk where migration 137's RPC is amended
-- to require ingest_batch_id OR where
-- documentPlatformService.createSourceDocument is verified to
-- always pass it. Coordinated three-step activation across
-- chunks: (1) chunks 6.2/6.3 update service to pass
-- ingest_batch_id; (2) backfill any interim-period NULL rows;
-- (3) ALTER COLUMN SET NOT NULL + extend column-immutability
-- trigger to include ingest_batch_id.
--
-- Original Step C statement preserved here as commented for
-- chunks-6.2/6.3 reference:
-- ALTER TABLE source_documents ALTER COLUMN ingest_batch_id SET NOT NULL;

-- Step D: extend column-immutability trigger to include
-- ingest_batch_id — DEFERRED with Step C per Sub-Q4 amendment.
-- Reason: while column stays nullable (Step C deferred), service-
-- layer backfill paths (chunks 6.2/6.3 update of existing NULL
-- rows when documentPlatformService is updated) need NULL →
-- non-NULL transitions to work. Including ingest_batch_id in
-- the immutability list at chunk 6.1 would block those backfills.
-- When Step C activates at chunks 6.2/6.3, Step D ships
-- simultaneously to lock the column post-NOT-NULL-activation.
--
-- Original Step D function body preserved here as commented for
-- chunks-6.2/6.3 reference (12-column immutability list adds
-- `OLD.ingest_batch_id IS DISTINCT FROM NEW.ingest_batch_id`
-- to migration 135's existing 11-column body):
-- CREATE OR REPLACE FUNCTION enforce_source_documents_column_immutability() ...

-- =============================================================
-- BLOCK 4 — document_jobs table + RLS + triggers
--
-- Anticipatory schema per Sub-Q3 lock + plan-doc framing.
-- v1-active workflow + audit-anchor columns (workflow: id,
-- org_id, source_document_id, document_case_id, ingest_batch_id,
-- state; audit-anchor: trace_id, created_at, created_by per
-- Phase 1+ convention) + Phase 7-reserved NULL-able columns
-- (attempt_count DEFAULT 0, started_at, completed_at,
-- last_error_code, last_error_message, pipeline_trace_id).
--
-- Sub-Q3 lock CODIFIED EXPLICITLY: attempt_count ships as
-- NOT NULL DEFAULT 0 with NO v1-active CHECK constraint.
-- Variant A pattern per ADR-0010 (NULL-default config columns
-- with v1-fixed default). Phase 7 orchestrator activates by
-- writing non-zero values; adding CHECK (attempt_count = 0)
-- here would add zero value (Layer-3 service-no-emit already
-- covers it at v1) and create churn at Phase 7 activation.
-- DO NOT reflexively add a CHECK constraint by mirroring
-- state's pattern.
-- =============================================================

CREATE TABLE document_jobs (
  -- v1-active workflow + audit-anchor columns
  id                  uuid                PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id              uuid                NOT NULL REFERENCES organizations(org_id) ON DELETE RESTRICT,
  source_document_id  uuid                NOT NULL REFERENCES source_documents(id)  ON DELETE RESTRICT,
  document_case_id    uuid                NOT NULL REFERENCES document_cases(id)    ON DELETE RESTRICT,
  ingest_batch_id     uuid                NOT NULL REFERENCES ingest_batches(id)    ON DELETE RESTRICT,
  state               document_job_state  NOT NULL,
  trace_id            uuid                NOT NULL,
  created_at          timestamptz         NOT NULL DEFAULT NOW(),
  created_by          text                NOT NULL,

  -- Phase 7-reserved NULL-able columns (Sub-Q3 lock: attempt_count
  -- DEFAULT 0, no v1-active CHECK):
  attempt_count       int                 NOT NULL DEFAULT 0,
  started_at          timestamptz,
  completed_at        timestamptz,
  last_error_code     text,
  last_error_message  text,
  pipeline_trace_id   uuid,

  CONSTRAINT document_jobs_state_v1_active CHECK (
    state = 'queued'
  )
);

CREATE INDEX document_jobs_org_id_idx              ON document_jobs (org_id);
CREATE INDEX document_jobs_source_document_id_idx  ON document_jobs (source_document_id);
CREATE INDEX document_jobs_document_case_id_idx    ON document_jobs (document_case_id);
CREATE INDEX document_jobs_ingest_batch_id_idx     ON document_jobs (ingest_batch_id);
CREATE INDEX document_jobs_state_queued_idx        ON document_jobs (state) WHERE state = 'queued';

COMMENT ON TABLE document_jobs IS
  'Phase 6 per-attachment work-queue per ADR-0011 §1. Pre-classification '
  'queue; Phase 7 orchestrator (ADR-0014 §1 ingestDocument) reads + transitions. '
  'Anticipatory schema: 7 Phase 7-reserved NULL-able columns (attempt_count, '
  'started_at, completed_at, last_error_code, last_error_message, '
  'pipeline_trace_id) defer Phase 7 activation per ADR-0010 substrate-now-'
  'enforcement-later. v1-active CHECK narrows state to ''queued''.';

ALTER TABLE document_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY document_jobs_select ON document_jobs
  FOR SELECT USING (user_has_org_access(org_id));

CREATE POLICY document_jobs_insert ON document_jobs
  FOR INSERT WITH CHECK (user_has_org_access(org_id));

CREATE POLICY document_jobs_update ON document_jobs
  FOR UPDATE USING (user_has_org_access(org_id))
  WITH CHECK (user_has_org_access(org_id));

CREATE POLICY document_jobs_no_delete ON document_jobs
  FOR DELETE USING (false);

-- Column-immutability trigger — protects audit-anchor + FK columns
-- from UPDATE. Mutable columns: state, attempt_count, started_at,
-- completed_at, last_error_code, last_error_message,
-- pipeline_trace_id (Phase 7-mutable workflow fields).
CREATE OR REPLACE FUNCTION enforce_document_jobs_column_immutability()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.id                  IS DISTINCT FROM NEW.id                  OR
     OLD.org_id              IS DISTINCT FROM NEW.org_id              OR
     OLD.source_document_id  IS DISTINCT FROM NEW.source_document_id  OR
     OLD.document_case_id    IS DISTINCT FROM NEW.document_case_id    OR
     OLD.ingest_batch_id     IS DISTINCT FROM NEW.ingest_batch_id     OR
     OLD.trace_id            IS DISTINCT FROM NEW.trace_id            OR
     OLD.created_at          IS DISTINCT FROM NEW.created_at          OR
     OLD.created_by          IS DISTINCT FROM NEW.created_by THEN
    RAISE EXCEPTION 'document_jobs column-immutability violation: id / org_id / source_document_id / document_case_id / ingest_batch_id / trace_id / created_at / created_by are immutable post-INSERT (Phase 6 chunk 1 substrate; state + Phase 7-reserved workflow fields mutable)'
      USING ERRCODE = 'feature_not_supported';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_document_jobs_column_immutability
  BEFORE UPDATE ON document_jobs
  FOR EACH ROW
  EXECUTE FUNCTION enforce_document_jobs_column_immutability();

CREATE OR REPLACE FUNCTION reject_document_jobs_delete()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'document_jobs is delete-restricted — DELETE forbidden to preserve audit_log referent integrity'
    USING ERRCODE = 'feature_not_supported';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_document_jobs_no_delete
  BEFORE DELETE ON document_jobs
  FOR EACH ROW
  EXECUTE FUNCTION reject_document_jobs_delete();

-- =============================================================
-- BLOCK 5 — atomic RPC create_ingest_batch_with_documents_with_audit
--
-- Sub-Q5 lock: single 6-param JSONB RPC. Mirrors migration
-- 137/143/145 caller-pre-shapes-JSONB pattern scaled to 5 tables.
-- Caller (chunks 6.2/6.3 ingestionService channel-handlers)
-- constructs JSON arrays sized per channel.
--
-- Atomicity is the load-bearing property: per INV-AUDIT-001 leaf,
-- the audit_log INSERT lives in this RPC so it commits atomically
-- with the entity INSERTs. The 5 entity tables + 1 audit_log
-- INSERT all succeed or all roll back (Postgres transaction
-- semantics within plpgsql function body).
--
-- audit_log.org_id sourcing: single batch-grain audit row.
-- org_id comes from the audit payload directly (NOT via parent-
-- table subquery as in migration 145) because the audit
-- references ingest_batches.id (the batch just INSERTed) and
-- subquery would tautologically read what we just wrote. Mirrors
-- migration 137 pattern (line 132).
--
-- Pre-generated UUIDs: caller pre-generates batch.id +
-- source_documents.id + document_cases.id + document_case_sources.id
-- + document_jobs.id before invoking the RPC. Mirrors migration
-- 137:75-81 pattern (storage path needs source_document_id
-- before INSERT; analogously batch_id needed in
-- source_documents.ingest_batch_id + document_jobs.ingest_batch_id
-- before child INSERTs; cases need ids before document_jobs FK
-- references).
-- =============================================================

CREATE OR REPLACE FUNCTION create_ingest_batch_with_documents_with_audit(
  p_batch        JSONB,
  p_documents    JSONB,
  p_cases        JSONB,
  p_case_sources JSONB,
  p_jobs         JSONB,
  p_audit        JSONB
) RETURNS UUID AS $$
DECLARE
  v_batch_id UUID;
  v_doc      JSONB;
  v_case     JSONB;
  v_link     JSONB;
  v_job      JSONB;
BEGIN
  v_batch_id := (p_batch->>'id')::uuid;

  -- INSERT 1: ingest_batches (1 row, the envelope)
  INSERT INTO ingest_batches (
    id, org_id, ingest_channel, received_at, channel_metadata,
    trace_id, created_at, created_by
  )
  VALUES (
    v_batch_id,
    (p_batch->>'org_id')::uuid,
    (p_batch->>'ingest_channel')::ingest_channel,
    (p_batch->>'received_at')::timestamptz,
    (p_batch->'channel_metadata'),
    (p_batch->>'trace_id')::uuid,
    COALESCE((p_batch->>'created_at')::timestamptz, NOW()),
    p_batch->>'created_by'
  );

  -- INSERT 2..N+1: source_documents (jsonb_array_elements iteration;
  -- 1..N rows per channel — drag-drop: N files, forwarded_mailbox:
  -- N+1 attachments including email body)
  FOR v_doc IN SELECT * FROM jsonb_array_elements(p_documents) LOOP
    INSERT INTO source_documents (
      id, org_id, legal_entity_id, storage_provider, original_storage_key,
      original_content_hash, original_byte_size, original_filename,
      mime_type, ingest_channel, ingest_batch_id, storage_status,
      received_at, created_by
    )
    VALUES (
      (v_doc->>'id')::uuid,
      (v_doc->>'org_id')::uuid,
      NULLIF(v_doc->>'legal_entity_id', '')::uuid,
      (v_doc->>'storage_provider')::storage_provider,
      v_doc->>'original_storage_key',
      v_doc->>'original_content_hash',
      (v_doc->>'original_byte_size')::bigint,
      v_doc->>'original_filename',
      v_doc->>'mime_type',
      (v_doc->>'ingest_channel')::ingest_channel,
      v_batch_id,
      COALESCE((v_doc->>'storage_status')::storage_status, 'pending_initial_verify'),
      (v_doc->>'received_at')::timestamptz,
      v_doc->>'created_by'
    );
  END LOOP;

  -- INSERT: document_cases (per-channel grain; drag-drop: N 1:1
  -- with source_documents; forwarded_mailbox: 1 per-email)
  FOR v_case IN SELECT * FROM jsonb_array_elements(p_cases) LOOP
    INSERT INTO document_cases (
      id, org_id, document_type, state, trace_id, created_by
    )
    VALUES (
      (v_case->>'id')::uuid,
      (v_case->>'org_id')::uuid,
      (v_case->>'document_type')::document_type,
      COALESCE((v_case->>'state')::document_case_state, 'received'),
      (v_case->>'trace_id')::uuid,
      v_case->>'created_by'
    );
  END LOOP;

  -- INSERT: document_case_sources (may be empty array for drag-drop;
  -- forwarded_mailbox writes 1 email_body role row at Phase 6 per
  -- RI Flag 5 division-of-labor — primary/supporting/payment_evidence
  -- land at Phase 7 post-classification)
  FOR v_link IN SELECT * FROM jsonb_array_elements(p_case_sources) LOOP
    INSERT INTO document_case_sources (
      id, document_case_id, source_document_id, role, trace_id, created_by
    )
    VALUES (
      (v_link->>'id')::uuid,
      (v_link->>'document_case_id')::uuid,
      (v_link->>'source_document_id')::uuid,
      (v_link->>'role')::document_case_source_role,
      (v_link->>'trace_id')::uuid,
      v_link->>'created_by'
    );
  END LOOP;

  -- INSERT: document_jobs (N per batch; one per attachment-grain
  -- source_documents row; all pointing to the per-batch
  -- document_case_id or per-attachment document_case_id depending
  -- on channel)
  FOR v_job IN SELECT * FROM jsonb_array_elements(p_jobs) LOOP
    INSERT INTO document_jobs (
      id, org_id, source_document_id, document_case_id, ingest_batch_id,
      state, trace_id, created_by
    )
    VALUES (
      (v_job->>'id')::uuid,
      (v_job->>'org_id')::uuid,
      (v_job->>'source_document_id')::uuid,
      (v_job->>'document_case_id')::uuid,
      v_batch_id,
      COALESCE((v_job->>'state')::document_job_state, 'queued'),
      (v_job->>'trace_id')::uuid,
      v_job->>'created_by'
    );
  END LOOP;

  -- INSERT (final): audit_log — single audit row at batch grain
  -- per INV-AUDIT-001 leaf + Phase 6 chunk 1 audit-grain decision
  -- (one logical mutation per ingestion event = one audit row;
  -- per-row audit emission deferred to Phase 7 document_jobs
  -- state transitions).
  INSERT INTO audit_log (
    org_id, user_id, trace_id, action, entity_type, entity_id,
    before_state, after_state_id, tool_name, idempotency_key, reason
  )
  VALUES (
    NULLIF(p_audit->>'org_id', '')::uuid,
    NULLIF(p_audit->>'user_id', '')::uuid,
    (p_audit->>'trace_id')::uuid,
    p_audit->>'action',
    p_audit->>'entity_type',
    v_batch_id,
    p_audit->'before_state',
    NULLIF(p_audit->>'after_state_id', '')::uuid,
    p_audit->>'tool_name',
    NULLIF(p_audit->>'idempotency_key', '')::uuid,
    p_audit->>'reason'
  );

  RETURN v_batch_id;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER;

GRANT EXECUTE ON FUNCTION create_ingest_batch_with_documents_with_audit(JSONB, JSONB, JSONB, JSONB, JSONB, JSONB)
  TO service_role;
