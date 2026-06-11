-- =============================================================
-- 20240172000000_evidence_objects_substrate.sql
-- Canonical Evidence Object anchor — ADR-0033 (V1 governance arc, Wave 2, R3).
--
-- Executable authoring pass for ADR-0033 D-0033.1. Net-new, general,
-- by-reference evidence object anchor. INERT at Wave 2: per OQ-2 the posture
-- is assemble-on-read — services/evidence assembles TRANSIENT canonical
-- objects from live references; NO row-producer ships at Wave 2. Persistence,
-- the producer, and the write-posture (append-only vs mutable) are Wave 6
-- (when the AP Review consumer makes the object load-bearing). The table ships
-- now so the addressable identity (D-0033.1) is reserved.
--
-- =============================================================
-- HEAD PASS
--
-- (a) FILENAME. <14-digit-ts>_<snake>.sql; follows
--     20240171000000_workflow_core_substrate.sql; next slot 20240172000000.
--
-- (b) NET-NEW ⇒ EMPTY NOT-NULL BLAST RADIUS. Net-new + inert; zero existing
--     INSERT sites (grep "INSERT INTO evidence_objects" returns nothing). The
--     assemble-on-read service writes no rows.
--
-- (c) INERT POSTURE. status has a v1-active CHECK narrowed to 'reserved' (the
--     document_cases/workflow_instances substrate-now precedent). No invariant
--     registered (ADR-0033 D-0033.8 / D-0033.4; register-on-enforcement,
--     ADR-0021): INV-EVIDENCE-001/002 stay reserved, teeth at Wave 6. The live
--     INV-DOC-001 bill gate (billService.post) is untouched (D-0033.3).
--
-- (d) WRITE-POSTURE DEFERRED. No append-only triggers ship here: the table is
--     inert (nothing writes), and append-only-vs-mutable is a Wave-6 decision
--     made when the producer is designed. Adding triggers now would
--     pre-commit a write-posture against zero rows.
--
-- (e) BY-REFERENCE, NOT BY-COPY (D-0033.1). The anchor holds a subject
--     (subject_type/subject_id) + trace_id + a typed domain_extension; the
--     facets (documents/extraction/decision/approval) are discovered by
--     reference (subject + trace_id), not duplicated here.
-- =============================================================
-- SCOPE
--   IN : evidence_object_status enum, evidence_objects table (+ indexes, RLS,
--        comment).
--   OUT: no row-producer, no append-only triggers (write-posture = Wave 6);
--        no services/core code (separate build files); no INV registration
--        (D-0033.8); no billService.post change (D-0033.3); no glossary /
--        ledger_truth_model edits (separate doc reconciles in this build).
-- =============================================================

BEGIN;

-- -----------------------------------------------------------------
-- §1. evidence_object_status — descriptive completeness (Wave 6 producer);
--     v1-active narrows to 'reserved' (inert).
-- -----------------------------------------------------------------
CREATE TYPE evidence_object_status AS ENUM (
  -- v1-active subset (Wave 2: inert; CHECK narrows to 'reserved'):
  'reserved',
  -- Reserved (Wave-6 producer — descriptive completeness, OQ-6):
  'partial', 'complete'
);

-- -----------------------------------------------------------------
-- §2. evidence_objects — the net-new, general, by-reference anchor
--     (ADR-0033 D-0033.1). One stable, addressable row per committed posting
--     (subject-polymorphic). INERT at Wave 2 (no row-producer).
-- -----------------------------------------------------------------
CREATE TABLE evidence_objects (
  id                uuid                   PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id            uuid                   NOT NULL REFERENCES organizations(org_id) ON DELETE RESTRICT,
  subject_type      text                   NOT NULL,   -- 'bill' at AP; general (subject-polymorphic)
  subject_id        uuid                   NOT NULL,   -- the committed posting / entity
  trace_id          uuid                   NOT NULL,   -- correlation key -> facets / audit_log
  status            evidence_object_status NOT NULL,
  domain_extension  jsonb,                             -- typed per-domain (AP) extension; general spine stays clean
  created_at        timestamptz            NOT NULL DEFAULT now(),
  created_by        text                   NOT NULL,

  -- v1-active CHECK (inert): narrows status to 'reserved'; broadens at the
  -- Wave-6 producer wave (document_cases / workflow_instances precedent).
  CONSTRAINT evidence_objects_status_v1_active CHECK (status = 'reserved')
);

CREATE INDEX idx_evidence_objects_org_subject
  ON evidence_objects (org_id, subject_type, subject_id);  -- subject lookup
CREATE INDEX idx_evidence_objects_trace
  ON evidence_objects (trace_id);                          -- correlation / audit join

-- RLS: service-emitted (the Wave-6 producer writes via service_role). SELECT
-- scoped to org membership; no user-path write policy (RLS-enabled-no-policy
-- denies the user path; service_role bypasses). The read/assemble service
-- (services/evidence) reads the live facet tables, not this inert table.
ALTER TABLE evidence_objects ENABLE ROW LEVEL SECURITY;

CREATE POLICY evidence_objects_select ON evidence_objects
  FOR SELECT USING (user_has_org_access(org_id));

COMMENT ON TABLE evidence_objects IS
  'ADR-0033 (Canonical Evidence Object Model, V1 Wave 2, R3). Net-new, general, '
  'by-reference anchor: one stable addressable row per committed posting '
  '(subject_type/subject_id), holding a trace_id correlation key + a typed '
  'domain_extension; facets (document/extraction/decision/approval) are '
  'assembled by reference, not duplicated here. INERT at Wave 2 (assemble-on-read; '
  'no row-producer — services/evidence assembles transient objects from live '
  'refs). Persistence + producer + write-posture are Wave 6. v1-active CHECK '
  'narrows status to ''reserved''. No invariant registered (D-0033.8); the live '
  'INV-DOC-001 bill gate is untouched (D-0033.3).';

COMMIT;
