-- =============================================================
-- 20240135000000_storage_substrate.sql
-- Phase 1.Storage chunk 1 — storage substrate (closed-enum types
-- + source_documents + source_document_versions + circular FK
-- + RLS policies + immutability triggers + REVOKE TRUNCATE).
--
-- Per ADR-0011 §2  (source_documents schema spine) +
--     ADR-0011 §9  (document lifecycle immutability rules) +
--     ADR-0013 §4  (source_documents schema inheritance —
--                   original-anchor + current-pointer hybrid) +
--     ADR-0013 §6  (drift-detection outcomes — capture_reason
--                   closed enum) +
--     ADR-0013 §11 (source_documents.storage_status closed enum) +
--     ADR-0010     (reserved-enum-states three-layer defense:
--                   Layer 1 DB CHECK + Layer 2 Zod boundary +
--                   Layer 3 service no-emit).
--
-- Phase 1.Storage chunk 1 of 6. Subsequent chunks:
--   2. storageProviderService interface + types + ServiceError
--      extension.
--   3. Failure-classification + retry helpers + integrity-check
--      helper.
--   4. Supabase provider implementation.
--   5. Audit-event emission wiring.
--   6. Unit + integration tests.
--
-- Anti-scope (NOT in chunk 1):
--   - org_settings table + 8 storage-related reserved columns
--     (per Sub-Q4 a-prime adjudication: org_settings is a
--     cross-cutting substrate created in its own dedicated
--     sub-arc later in Phase 1, before v1 ship; v1 storage
--     service code uses hard-coded constants per ADR-0013 §2 /
--     §8 / §12 system-fixed-in-v1 framing).
--   - drift_cadence enum (sole consumer is the deferred
--     org_settings.drift_detection_cadence column; lands
--     alongside column per "land schema with consumer code"
--     discipline; Sub-Q3 own-enum-type verdict stands for that
--     future migration).
--   - source_document_links (ADR-0016 — Document Relationship
--     Graph; later sub-phase).
--   - document_cases, document_case_sources (Document Core;
--     later sub-phase).
--   - document_artifacts (extraction layer; later sub-phase).
--   - document_relationship_candidates (Relationship Router;
--     later sub-phase).
--   - ingest_batches, ingest_items, document_jobs (Pipeline;
--     later sub-phase). source_documents.ingest_batch_id column
--     deferred per Sub-Q2 (a) — lands when ingest_batches table
--     exists, per "land schema with consumer code" discipline.
--
-- Cross-ADR naming resolution: this migration uses
-- `original_storage_key` per ADR-0013 §4 (post-ratification
-- canonical name). ADR-0011 §2 lists the column as `storage_key`
-- (pre-amendment label); ADR-0013 §4 refines to
-- `original_storage_key` to make the original-anchor + current-
-- pointer hybrid explicit. Resolution adjudicated at chunk 1
-- onset.
--
-- Reserved-enum-states discipline per ADR-0010:
--   Layer 1 (DB CHECK on closed-enum columns) — SHIPPED HERE.
--   Layer 2 (service-layer Zod boundary rejection) — lands in
--           chunk 2 alongside storageProviderService.
--   Layer 3 (service-layer write-path emission filter) — lands
--           in chunk 4 (Supabase provider) + chunk 5 (audit
--           event emission).
--
-- Immutability defense pattern per
-- 20240133000000_journal_immutability_triggers.sql precedent —
-- three-layer defense:
--   Layer 1 — RLS policies USING (false) for blocked operations.
--   Layer 2 — BEFORE UPDATE/DELETE/TRUNCATE triggers (catch
--             service_role mutations that bypass RLS).
--   Layer 3 — REVOKE TRUNCATE from PUBLIC / authenticated / anon.
--
-- source_documents immutability scope: post-ingestion only
-- `current_version_id` (per ADR-0011 §2), `storage_status`
-- (per ADR-0013 §11 state-transitions — supersedes ADR-0011 §2
-- "only current_version_id" wording for storage_status; the
-- transition mechanic in §11 requires mutability), and
-- `mime_type` (per ADR-0011 §2 explicit "mime-type detection
-- may improve post-ingestion without invalidating the
-- evidence") are mutable; all other columns are write-once.
-- Trigger compares OLD vs NEW and rejects mutations to any
-- other column. DELETE blocked. TRUNCATE blocked.
--
-- source_document_versions immutability scope: rows fully
-- immutable per ADR-0011 §9. UPDATE / DELETE / TRUNCATE all
-- blocked.
--
-- supersedes_version_id on source_document_versions: platform-
-- supersession-pattern application per ADR-0011 §9
-- (replayability is load-bearing; ocr_runs and
-- document_relationship_candidates carry analogous columns).
-- Not listed verbatim on source_document_versions in ADR-0011
-- §2 / ADR-0013 §4, but consistent extension of §9's
-- supersession-pattern discipline. Service-layer assigns a
-- supersedes pointer when a new explicit version captures
-- (NULL for the first explicit version, which supersedes the
-- implicit-version-1 anchored on source_documents).
--
-- See docs/02_specs/ledger_truth_model.md INV-DOC reservation
-- (Q79 path β; INV-DOC-001 shape lands at first DOC-citing code
-- per substrate-now-enforcement-later cross-pattern; this
-- migration ships substrate, not invariant content).
-- =============================================================

BEGIN;

-- =============================================================
-- BLOCK 1 — Closed-enum types per ADR-0010 reserved-enum-states
-- discipline. v1 active subsets noted per enum; reserved values
-- are emitted by no v1 service write path.
-- =============================================================

-- storage_provider per ADR-0011 §2 + ADR-0013 §1. v1 active
-- value: supabase_storage. Reserved values activate post-v1 per
-- ADR-0013 §14 per-provider implementation skeletons.
CREATE TYPE storage_provider AS ENUM (
  'supabase_storage',
  'sharepoint_drive',
  's3_bucket',
  'external_url'
);

-- storage_status per ADR-0013 §11. v1 active subset: available,
-- pending_initial_verify (in-flight only).
CREATE TYPE storage_status AS ENUM (
  'available',
  'pending_initial_verify',
  'permission_loss',
  'missing_file',
  'hash_mismatch',
  'provider_unavailable',
  'verification_pending_retry'
);

-- capture_reason per ADR-0013 §6. v1 active subset:
-- vendor_corrected_invoice, reformatted_pdf,
-- accessibility_replacement (manual-capture cases). drift_*
-- values reserved (drift inert in v1 since supabase_storage is
-- exempt from drift detection per ADR-0013 §5).
CREATE TYPE capture_reason AS ENUM (
  'vendor_corrected_invoice',
  'reformatted_pdf',
  'accessibility_replacement',
  'drift_auto_supersession',
  'drift_controller_override',
  'drift_rejected_kept_original',
  'unknown_drift'
);

-- ingest_channel per ADR-0011 §2. All values active in v1.
CREATE TYPE ingest_channel AS ENUM (
  'drag_drop_pdf',
  'forwarded_mailbox',
  'direct_upload',
  'api_ingest'
);

-- =============================================================
-- BLOCK 2 — source_documents table.
--
-- The substrate's evidence anchor per ADR-0011 §2. One row per
-- uploaded file. Original-anchor columns (original_content_hash,
-- original_byte_size, original_filename, original_storage_key)
-- are write-once and immutable. current_version_id, storage_status,
-- and mime_type are the only post-ingestion-mutable columns
-- (per ADR-0011 §2 integrity contract + ADR-0013 §11 state
-- transitions + ADR-0011 §2 explicit mime-type-may-improve
-- wording).
-- =============================================================

CREATE TABLE source_documents (
  id                     uuid             PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id                 uuid             NOT NULL REFERENCES organizations(org_id) ON DELETE RESTRICT,

  -- Reserved per ADR-0011 §10 (multi-entity reservations).
  -- Defaults to org_id in v1 where the org-entity mapping is 1-1.
  -- Nullable to support v1 implicit-org case + post-v1 explicit
  -- legal-entity routing. FK target may shift to a separate
  -- legal_entities table when multi-entity activates post-v1.
  legal_entity_id        uuid                      REFERENCES organizations(org_id) ON DELETE RESTRICT,

  storage_provider       storage_provider NOT NULL,

  -- Per ADR-0013 §4 cross-ADR naming resolution. Immutable
  -- post-ingestion (enforced by trigger in BLOCK 5).
  original_storage_key   text             NOT NULL,
  original_content_hash  text             NOT NULL,
  original_byte_size     bigint           NOT NULL CHECK (original_byte_size >= 0),
  original_filename      text             NOT NULL,

  -- Pointer to latest captured version. Null at ingestion (the
  -- original ingestion is implicit version 1; no separate version
  -- row exists). Set when first explicit version row captures.
  -- Per ADR-0011 §2 integrity contract: this is one of two
  -- columns on source_documents that may change post-ingestion.
  -- FK constraint added in BLOCK 4 due to circular reference
  -- with source_document_versions.
  current_version_id     uuid,

  mime_type              text             NOT NULL,
  ingest_channel         ingest_channel   NOT NULL,

  -- DEFAULT 'pending_initial_verify' biases toward the in-flight
  -- safe state per ADR-0013 §11. Service-layer transitions to
  -- 'available' after put-and-verify completes.
  storage_status         storage_status   NOT NULL DEFAULT 'pending_initial_verify',

  received_at            timestamptz      NOT NULL,
  created_at             timestamptz      NOT NULL DEFAULT NOW(),
  created_by             text             NOT NULL,

  -- Layer 1 (DB CHECK) reserved-enum-states defense per
  -- ADR-0010. v1 active values only; constraints relax when
  -- reserved values activate post-v1.
  CONSTRAINT source_documents_storage_provider_v1_active
    CHECK (storage_provider = 'supabase_storage'),
  CONSTRAINT source_documents_storage_status_v1_active
    CHECK (storage_status IN ('available', 'pending_initial_verify'))
);

CREATE INDEX idx_source_documents_org              ON source_documents (org_id);
CREATE INDEX idx_source_documents_current_version  ON source_documents (current_version_id);
CREATE INDEX idx_source_documents_org_status       ON source_documents (org_id, storage_status);

COMMENT ON TABLE source_documents IS
  'Document Platform evidence anchor per ADR-0011 §2. One row per uploaded file. '
  'Original-anchor columns (original_*) immutable; current_version_id, '
  'storage_status, and mime_type the only post-ingestion-mutable columns.';

-- =============================================================
-- BLOCK 3 — source_document_versions table.
--
-- Versioned bytes per ADR-0011 §2 + §9 + ADR-0013 §4. Rows fully
-- immutable per §9. Each version row carries its own
-- storage_provider and storage_key for per-version provider
-- support (ADR-0013 §4 reserves this flexibility at v1 schema
-- level even though v1 never exercises it).
-- =============================================================

CREATE TABLE source_document_versions (
  id                     uuid             PRIMARY KEY DEFAULT gen_random_uuid(),
  source_document_id     uuid             NOT NULL REFERENCES source_documents(id) ON DELETE RESTRICT,

  -- Service-layer-assigned monotonic version number per
  -- (source_document_id). The original ingestion is implicit
  -- version 1 (no explicit row); the first explicit version row
  -- is version 2 per ADR-0011 §2 versioning model.
  version_number         int              NOT NULL CHECK (version_number >= 2),

  -- Immutable per ADR-0011 §9.
  content_hash           text             NOT NULL,
  byte_size              bigint           NOT NULL CHECK (byte_size >= 0),
  captured_at            timestamptz      NOT NULL,

  capture_reason         capture_reason   NOT NULL,

  -- Per-version provider per ADR-0013 §4. Per-version
  -- storage_key allows post-v1 provider migration on a
  -- per-version basis.
  storage_provider       storage_provider NOT NULL,
  storage_key            text             NOT NULL,

  -- Replayability per ADR-0011 §9 supersession pattern. Points
  -- to the prior version row this version supersedes (NULL for
  -- the first explicit version row, which supersedes the
  -- implicit-version-1 anchored on source_documents).
  -- Platform-pattern application; not listed verbatim in
  -- ADR-0011 §2 / ADR-0013 §4 column enumeration but consistent
  -- with §9's supersession-pattern discipline (ocr_runs.
  -- supersedes_ocr_run_id, document_relationship_candidates.
  -- supersedes_candidate_id are sibling applications).
  supersedes_version_id  uuid                      REFERENCES source_document_versions(id) ON DELETE RESTRICT,

  created_at             timestamptz      NOT NULL DEFAULT NOW(),

  UNIQUE (source_document_id, version_number),

  -- Layer 1 (DB CHECK) reserved-enum-states defense per
  -- ADR-0010. v1 active values only.
  CONSTRAINT source_document_versions_capture_reason_v1_active
    CHECK (capture_reason IN (
      'vendor_corrected_invoice',
      'reformatted_pdf',
      'accessibility_replacement'
    )),
  CONSTRAINT source_document_versions_storage_provider_v1_active
    CHECK (storage_provider = 'supabase_storage')
);

CREATE INDEX idx_source_document_versions_doc         ON source_document_versions (source_document_id, version_number);
CREATE INDEX idx_source_document_versions_supersedes  ON source_document_versions (supersedes_version_id);

COMMENT ON TABLE source_document_versions IS
  'Versioned bytes per ADR-0011 §2 + §9. Rows fully immutable. '
  'Per-version storage_provider and storage_key support reserved post-v1 '
  'provider migration. supersedes_version_id implements §9 replayability pattern.';

-- =============================================================
-- BLOCK 4 — Circular-FK resolution.
--
-- source_documents.current_version_id → source_document_versions(id).
-- Added post-table-create due to mutual reference between the
-- two tables (source_documents.current_version_id references
-- source_document_versions, while source_document_versions.
-- source_document_id references source_documents).
-- =============================================================

ALTER TABLE source_documents
  ADD CONSTRAINT source_documents_current_version_id_fkey
  FOREIGN KEY (current_version_id)
  REFERENCES source_document_versions(id)
  ON DELETE RESTRICT;

-- =============================================================
-- BLOCK 5 — RLS, immutability triggers, REVOKE TRUNCATE.
--
-- RLS pattern per Sub-Q5 lock: Pattern A (journal_entries-style).
-- SELECT/INSERT scoped to user_has_org_access(org_id);
-- post-ingestion mutability constrained via triggers (not
-- column-grants). Three-layer immutability defense per
-- 20240133000000 precedent.
-- =============================================================

ALTER TABLE source_documents          ENABLE ROW LEVEL SECURITY;
ALTER TABLE source_document_versions  ENABLE ROW LEVEL SECURITY;

-- ----- source_documents RLS policies -----

CREATE POLICY source_documents_select ON source_documents
  FOR SELECT USING (user_has_org_access(org_id));

CREATE POLICY source_documents_insert ON source_documents
  FOR INSERT WITH CHECK (user_has_org_access(org_id));

-- UPDATE allowed at the RLS layer; column-restriction is
-- enforced by trg_source_documents_column_immutability below.
-- RLS gates the org scope; the trigger gates the column scope.
CREATE POLICY source_documents_update ON source_documents
  FOR UPDATE USING (user_has_org_access(org_id))
  WITH CHECK (user_has_org_access(org_id));

CREATE POLICY source_documents_no_delete ON source_documents
  FOR DELETE USING (false);

-- ----- source_document_versions RLS policies -----

CREATE POLICY source_document_versions_select ON source_document_versions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM source_documents sd
      WHERE sd.id = source_document_versions.source_document_id
        AND user_has_org_access(sd.org_id)
    )
  );

CREATE POLICY source_document_versions_insert ON source_document_versions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM source_documents sd
      WHERE sd.id = source_document_versions.source_document_id
        AND user_has_org_access(sd.org_id)
    )
  );

CREATE POLICY source_document_versions_no_update ON source_document_versions
  FOR UPDATE USING (false);

CREATE POLICY source_document_versions_no_delete ON source_document_versions
  FOR DELETE USING (false);

-- ----- source_documents column-restricted UPDATE trigger -----

-- Per ADR-0011 §2 integrity contract + ADR-0013 §11 state
-- transitions + ADR-0011 §2 mime-type-may-improve wording:
-- current_version_id, storage_status, and mime_type are the
-- only mutable columns post-ingestion. All other columns are
-- write-once at ingestion. Trigger compares OLD vs NEW and
-- rejects mutations to any other column. Layer 2 of three-layer
-- defense; catches service_role bypass of column-restricted
-- UPDATE policy. The IS DISTINCT FROM operator handles NULL
-- comparison correctly (legal_entity_id may be NULL).
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
     OLD.received_at           IS DISTINCT FROM NEW.received_at           OR
     OLD.created_at            IS DISTINCT FROM NEW.created_at            OR
     OLD.created_by            IS DISTINCT FROM NEW.created_by THEN
    RAISE EXCEPTION 'source_documents column-immutability violation: only current_version_id, storage_status, and mime_type may change post-ingestion (per ADR-0011 §2 + ADR-0013 §11)'
      USING ERRCODE = 'feature_not_supported';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_source_documents_column_immutability
  BEFORE UPDATE ON source_documents
  FOR EACH ROW
  EXECUTE FUNCTION enforce_source_documents_column_immutability();

-- DELETE block (Layer 2 — catches service_role bypass of
-- _no_delete RLS policy). Mirrors journal_entries pattern.
CREATE OR REPLACE FUNCTION reject_source_documents_delete()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'source_documents is delete-restricted — DELETE and TRUNCATE forbidden under any caller'
    USING ERRCODE = 'feature_not_supported';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_source_documents_no_delete
  BEFORE DELETE ON source_documents
  FOR EACH ROW
  EXECUTE FUNCTION reject_source_documents_delete();

CREATE TRIGGER trg_source_documents_no_truncate
  BEFORE TRUNCATE ON source_documents
  FOR EACH STATEMENT
  EXECUTE FUNCTION reject_source_documents_delete();

REVOKE TRUNCATE ON source_documents FROM PUBLIC;
REVOKE TRUNCATE ON source_documents FROM authenticated;
REVOKE TRUNCATE ON source_documents FROM anon;

-- ----- source_document_versions immutability triggers -----

-- Full immutability per ADR-0011 §9. UPDATE / DELETE / TRUNCATE
-- all forbidden. Triggers catch service_role bypass of RLS
-- (Layer 2). Mirrors journal_entries / journal_lines pattern
-- from 20240133000000.
CREATE OR REPLACE FUNCTION reject_source_document_versions_mutation()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'source_document_versions is append-only per ADR-0011 §9 — UPDATE, DELETE, and TRUNCATE are forbidden'
    USING ERRCODE = 'feature_not_supported';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_source_document_versions_no_update
  BEFORE UPDATE ON source_document_versions
  FOR EACH ROW
  EXECUTE FUNCTION reject_source_document_versions_mutation();

CREATE TRIGGER trg_source_document_versions_no_delete
  BEFORE DELETE ON source_document_versions
  FOR EACH ROW
  EXECUTE FUNCTION reject_source_document_versions_mutation();

CREATE TRIGGER trg_source_document_versions_no_truncate
  BEFORE TRUNCATE ON source_document_versions
  FOR EACH STATEMENT
  EXECUTE FUNCTION reject_source_document_versions_mutation();

REVOKE TRUNCATE ON source_document_versions FROM PUBLIC;
REVOKE TRUNCATE ON source_document_versions FROM authenticated;
REVOKE TRUNCATE ON source_document_versions FROM anon;

COMMIT;
