-- =============================================================
-- 20240146000000_document_artifacts_substrate.sql
-- Phase 2 chunk 4 — engine-agnostic OCR/extraction substrate.
-- Three immutable tables (ocr_runs, extraction_runs,
-- document_artifacts) per ADR-0011 §5 + §9, with through-parent
-- RLS via source_documents.org_id, full immutability triggers,
-- and Layer 1 CHECK discipline on document_artifacts.
--
-- Per ADR-0011 §5 (document_artifacts engine-agnostic contract,
--                  13 columns verbatim) +
--     ADR-0011 §9 Rule 1 (ocr_runs immutable; supersession via
--                  supersedes_ocr_run_id) +
--     ADR-0011 §9 Rule 2 (extraction_runs immutable per
--                  (source_document_id, ocr_run_id,
--                  extraction_version) tuple) +
--     ADR-0011 §3 ("ocr_runs and extraction_runs ... separate
--                  tables or artifact subtypes ... owned by
--                  Phase 1-4 implementation plans, not this ADR")
--                  — chunk 4 picks separate tables +
--     ADR-0010   (reserved-enum three-layer defense; chunk 4
--                  ships Layer 1 DB CHECK + Layer 2 Zod;
--                  Layer 3 service no-emit reserved for Phase 7) +
--     ADR-0014   (Tier 2 Document Pipeline — owns the writer at
--                  Phase 7; chunk 4 ships substrate-only).
--
-- Interpretation receipts (named here so future-readers see them):
--   - §5 says `engine text`; chunk 4 ships ENUM per ADR-0010
--     + chunks 1-3 precedent. §5's "for example" engine list is
--     non-exhaustive; ENUM ship interprets the three named
--     values as closed. ALTER TYPE adds values if Phase 7 needs
--     them.
--   - §5 has 13 columns and no `created_by` on
--     document_artifacts. Chunk 4 honors strictly — actor
--     identity for artifact rows lives at the audit_log layer
--     Phase 7 writes when invoking the pipeline. ocr_runs and
--     extraction_runs are chunk-4-defined (schema-deferred by
--     §3) and carry created_by per chunks-1-3 convention.
--   - confidence is NULL-able with range CHECK. NULL preserves
--     the distinction between "Phase 7 wrote 0 confidence" and
--     "Phase 7 forgot to populate." ALTER NOT NULL when Phase 7
--     wires the writer with proven populate-discipline.
--
-- Layer 1 enforcement at v1: engine CHECK ∈ {paddleocr}.
-- Reserved 2 values (tesseract, claude_vision_3_5) stay in
-- ENUM, CHECK-rejected. Engine activation broadens the CHECK as
-- a group when post-v1 engines ship.
--
-- Anti-scope (NOT in chunk 4):
--   - Writer service path — Phase 7 (Tier 2 pipeline
--     orchestrator per ADR-0014).
--   - audit-log RPC for artifact writes — Phase 7 (pattern
--     mirrors chunk-3's attach_document_case_source_with_audit
--     with parent-derived org_id).
--   - ocr_runs supersession workflow + "current head" pointer
--     — Phase 7 / Q69.
--   - Additional run-table columns (status, started_at,
--     finished_at, model_version, error_blob) — Phase 7 /
--     future migrations.
--   - source_document_links polymorphic spine — chunk 5.
--   - Exception queue + resolution_action enum — chunk 6.
--
-- DELETE/TRUNCATE protection asymmetry vs Phase 1
-- source_document_versions: source_document_versions is an
-- evidence anchor and ships full triple-layer (RLS USING (false)
-- + BEFORE DELETE + BEFORE TRUNCATE + REVOKE TRUNCATE).
-- document_artifacts, ocr_runs, extraction_runs are substrate
-- rows (immutable workflow rows tracking the OCR/extraction
-- pipeline state) — TRUNCATE protection is skipped per
-- Option C reasoning carried from chunk 1.
-- =============================================================

-- -----------------------------------------------------------
-- Engine ENUM (full membership; v1-active subset via CHECK)
-- -----------------------------------------------------------
CREATE TYPE document_artifact_engine AS ENUM (
  -- v1 active:
  'paddleocr',
  -- Reserved (post-v1 group activation):
  'tesseract',
  'claude_vision_3_5'
);

-- -----------------------------------------------------------
-- ocr_runs — OCR pass metadata + supersession chain.
--
-- §9 Rule 1: immutable; re-extraction produces a new ocr_runs
-- row that supersedes the prior via supersedes_ocr_run_id.
-- No uniqueness on source_document_id — supersession chains
-- by-design. The "current head" pointer lives at Phase 7 / Q69.
-- -----------------------------------------------------------
CREATE TABLE ocr_runs (
  id                     uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  source_document_id     uuid         NOT NULL REFERENCES source_documents(id) ON DELETE RESTRICT,
  supersedes_ocr_run_id  uuid,
  created_at             timestamptz  NOT NULL DEFAULT NOW(),
  created_by             text         NOT NULL,

  CONSTRAINT ocr_runs_supersedes_fk
    FOREIGN KEY (supersedes_ocr_run_id)
    REFERENCES ocr_runs(id)
    ON DELETE RESTRICT
);

CREATE INDEX ocr_runs_source_document_id_idx ON ocr_runs (source_document_id);

ALTER TABLE ocr_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY ocr_runs_select ON ocr_runs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM source_documents sd
      WHERE sd.id = ocr_runs.source_document_id
        AND user_has_org_access(sd.org_id)
    )
  );

CREATE POLICY ocr_runs_insert ON ocr_runs
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM source_documents sd
      WHERE sd.id = ocr_runs.source_document_id
        AND user_has_org_access(sd.org_id)
    )
  );

CREATE POLICY ocr_runs_no_update ON ocr_runs
  FOR UPDATE USING (false);

CREATE POLICY ocr_runs_no_delete ON ocr_runs
  FOR DELETE USING (false);

CREATE OR REPLACE FUNCTION reject_ocr_runs_mutation()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'ocr_runs is append-only — UPDATE and DELETE forbidden (re-extraction produces new rows per ADR-0011 §9 Rule 1, not in-place updates)'
    USING ERRCODE = 'feature_not_supported';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_ocr_runs_no_update
  BEFORE UPDATE ON ocr_runs
  FOR EACH ROW
  EXECUTE FUNCTION reject_ocr_runs_mutation();

CREATE TRIGGER trg_ocr_runs_no_delete
  BEFORE DELETE ON ocr_runs
  FOR EACH ROW
  EXECUTE FUNCTION reject_ocr_runs_mutation();

-- -----------------------------------------------------------
-- extraction_runs — TS-extraction pass metadata.
--
-- §9 Rule 2: immutable per (source_document_id, ocr_run_id,
-- extraction_version) tuple. Re-running TS extraction against
-- a new ocr_runs row produces a new extraction_runs row.
-- -----------------------------------------------------------
CREATE TABLE extraction_runs (
  id                  uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  source_document_id  uuid         NOT NULL REFERENCES source_documents(id) ON DELETE RESTRICT,
  ocr_run_id          uuid         NOT NULL REFERENCES ocr_runs(id) ON DELETE RESTRICT,
  extraction_version  text         NOT NULL,
  created_at          timestamptz  NOT NULL DEFAULT NOW(),
  created_by          text         NOT NULL,

  CONSTRAINT extraction_runs_unique_tuple
    UNIQUE (source_document_id, ocr_run_id, extraction_version)
);

CREATE INDEX extraction_runs_source_document_id_idx ON extraction_runs (source_document_id);
CREATE INDEX extraction_runs_ocr_run_id_idx         ON extraction_runs (ocr_run_id);

ALTER TABLE extraction_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY extraction_runs_select ON extraction_runs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM source_documents sd
      WHERE sd.id = extraction_runs.source_document_id
        AND user_has_org_access(sd.org_id)
    )
  );

CREATE POLICY extraction_runs_insert ON extraction_runs
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM source_documents sd
      WHERE sd.id = extraction_runs.source_document_id
        AND user_has_org_access(sd.org_id)
    )
  );

CREATE POLICY extraction_runs_no_update ON extraction_runs
  FOR UPDATE USING (false);

CREATE POLICY extraction_runs_no_delete ON extraction_runs
  FOR DELETE USING (false);

CREATE OR REPLACE FUNCTION reject_extraction_runs_mutation()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'extraction_runs is append-only — UPDATE and DELETE forbidden (re-extraction against new ocr_runs produces new (source_document_id, ocr_run_id, extraction_version) rows per ADR-0011 §9 Rule 2)'
    USING ERRCODE = 'feature_not_supported';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_extraction_runs_no_update
  BEFORE UPDATE ON extraction_runs
  FOR EACH ROW
  EXECUTE FUNCTION reject_extraction_runs_mutation();

CREATE TRIGGER trg_extraction_runs_no_delete
  BEFORE DELETE ON extraction_runs
  FOR EACH ROW
  EXECUTE FUNCTION reject_extraction_runs_mutation();

-- -----------------------------------------------------------
-- document_artifacts — engine-agnostic OCR/extraction output
-- payload per ADR-0011 §5 (13 columns verbatim).
--
-- Notably NO created_by column per §5. Artifact rows are
-- always-pipeline-written; actor identity for these rows lives
-- at the audit_log layer Phase 7 writes when invoking the
-- pipeline. The audit_log row carries trace_id linking the
-- artifact to the originating user/agent action.
--
-- engine ENUM ships per ADR-0010 + chunks 1-3 precedent;
-- engine_v1_active CHECK restricts to paddleocr at v1.
--
-- confidence is NULL-able with range CHECK; ALTER NOT NULL
-- when Phase 7's writer populate-discipline is proven.
-- -----------------------------------------------------------
CREATE TABLE document_artifacts (
  id                  uuid                       PRIMARY KEY DEFAULT gen_random_uuid(),
  source_document_id  uuid                       NOT NULL REFERENCES source_documents(id) ON DELETE RESTRICT,
  ocr_run_id          uuid                       NOT NULL REFERENCES ocr_runs(id) ON DELETE RESTRICT,
  extraction_run_id   uuid                       NOT NULL REFERENCES extraction_runs(id) ON DELETE RESTRICT,
  engine              document_artifact_engine   NOT NULL,
  engine_version      text                       NOT NULL,
  pages               jsonb                      NOT NULL,
  lines               jsonb                      NOT NULL,
  words               jsonb                      NOT NULL,
  quality_flags       text[]                     NOT NULL,
  pipeline_trace      jsonb                      NOT NULL,
  confidence          numeric,
  created_at          timestamptz                NOT NULL DEFAULT NOW(),

  CONSTRAINT document_artifacts_engine_v1_active CHECK (
    engine IN ('paddleocr')
  ),
  CONSTRAINT document_artifacts_confidence_range CHECK (
    confidence IS NULL OR (confidence >= 0 AND confidence <= 1)
  )
);

CREATE INDEX document_artifacts_source_document_id_idx ON document_artifacts (source_document_id);
CREATE INDEX document_artifacts_ocr_run_id_idx         ON document_artifacts (ocr_run_id);
CREATE INDEX document_artifacts_extraction_run_id_idx  ON document_artifacts (extraction_run_id);

ALTER TABLE document_artifacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY document_artifacts_select ON document_artifacts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM source_documents sd
      WHERE sd.id = document_artifacts.source_document_id
        AND user_has_org_access(sd.org_id)
    )
  );

CREATE POLICY document_artifacts_insert ON document_artifacts
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM source_documents sd
      WHERE sd.id = document_artifacts.source_document_id
        AND user_has_org_access(sd.org_id)
    )
  );

CREATE POLICY document_artifacts_no_update ON document_artifacts
  FOR UPDATE USING (false);

CREATE POLICY document_artifacts_no_delete ON document_artifacts
  FOR DELETE USING (false);

CREATE OR REPLACE FUNCTION reject_document_artifacts_mutation()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'document_artifacts is append-only — UPDATE and DELETE forbidden (replayability requires new rows referencing new ocr_run_id / extraction_run_id per ADR-0011 §9 + §5)'
    USING ERRCODE = 'feature_not_supported';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_document_artifacts_no_update
  BEFORE UPDATE ON document_artifacts
  FOR EACH ROW
  EXECUTE FUNCTION reject_document_artifacts_mutation();

CREATE TRIGGER trg_document_artifacts_no_delete
  BEFORE DELETE ON document_artifacts
  FOR EACH ROW
  EXECUTE FUNCTION reject_document_artifacts_mutation();

-- No RPC at chunk 4 — no writer service ships. Phase 7's Tier 2
-- pipeline orchestrator (per ADR-0014) owns the writer; it will
-- introduce the audit-log RPC pattern (mirrors chunk-3's
-- attach_document_case_source_with_audit with parent-derived
-- org_id) at that time.
