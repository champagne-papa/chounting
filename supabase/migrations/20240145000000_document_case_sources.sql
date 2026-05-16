-- =============================================================
-- 20240145000000_document_case_sources.sql
-- Phase 2 chunk 3 — document_case_sources join table + atomic
-- INSERT-with-audit RPC for attach path.
--
-- Per ADR-0011 §3 (document_case_sources schema + role-enum
--                  v1-active subset) +
--     ADR-0011 §1 entity ownership (line 132) +
--     ADR-0011 Q75 closure (case-source cardinality —
--                  v1-permissive, schema doesn't enforce
--                  one-primary-per-case) +
--     ADR-0010   (reserved-enum three-layer defense) +
--     docs/02_specs/ledger_truth_model.md INV-AUDIT-001 leaf.
--
-- Layer 1 enforcement at v1: role CHECK ∈ {primary, supporting,
-- email_body, payment_evidence}. Reserved 2 values (superseded_
-- source, related_prior_document) stay in enum, CHECK-rejected.
-- Chunk 6 (exception queue) broadens.
--
-- Anti-scope (NOT in chunk 3):
--   - detach service method — chunk 6 (ADR doesn't describe
--     detach lifecycle; exception-queue resolution makes it
--     concrete).
--   - role-change UPDATE — full row immutability per chunk-3
--     adjudication (operator corrections via detach + re-attach
--     at chunk 6).
--   - document_artifacts table — chunk 4.
--   - source_document_links polymorphic spine — chunk 5.
--
-- PK shape: surrogate id uuid + UNIQUE (document_case_id,
-- source_document_id, role). Codebase precedent is unambiguously
-- surrogate for join tables (memberships, intercompany_
-- relationships, vendor_rules) — no composite-PK join tables in
-- this codebase.
--
-- DELETE/TRUNCATE protection asymmetry vs Phase 1 source_document_
-- versions: source_document_versions is an evidence anchor and
-- ships full triple-layer (RLS USING (false) + BEFORE DELETE +
-- BEFORE TRUNCATE + REVOKE TRUNCATE). document_case_sources is
-- a workflow row, not bulk-managed data — TRUNCATE protection
-- is skipped per Option C reasoning carried from chunk 1.
-- =============================================================

-- Enum (full membership; v1-active subset enforced via CHECK)
CREATE TYPE document_case_source_role AS ENUM (
  -- v1 active subset:
  'primary',
  'supporting',
  'email_body',
  'payment_evidence',
  -- Reserved (chunk 6 / exception queue activation):
  'superseded_source',
  'related_prior_document'
);

-- Table
CREATE TABLE document_case_sources (
  id                  uuid                       PRIMARY KEY DEFAULT gen_random_uuid(),
  document_case_id    uuid                       NOT NULL REFERENCES document_cases(id) ON DELETE RESTRICT,
  source_document_id  uuid                       NOT NULL REFERENCES source_documents(id) ON DELETE RESTRICT,
  role                document_case_source_role  NOT NULL,
  trace_id            uuid                       NOT NULL,
  created_at          timestamptz                NOT NULL DEFAULT NOW(),
  created_by          text                       NOT NULL,            -- matches Phase 1 source_documents.created_by shape

  CONSTRAINT document_case_sources_role_v1_active CHECK (
    role IN ('primary', 'supporting', 'email_body', 'payment_evidence')
  ),
  CONSTRAINT document_case_sources_unique_triple
    UNIQUE (document_case_id, source_document_id, role)
);

CREATE INDEX document_case_sources_case_id_idx   ON document_case_sources (document_case_id);
CREATE INDEX document_case_sources_source_id_idx ON document_case_sources (source_document_id);

-- RLS — EXISTS-subquery through parent document_cases (mirrors
-- Phase 1 source_document_versions pattern at 20240135000000:347-371).
-- Full update-lock + delete-lock at the RLS layer; triggers below
-- catch service_role bypass.
ALTER TABLE document_case_sources ENABLE ROW LEVEL SECURITY;

CREATE POLICY document_case_sources_select ON document_case_sources
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM document_cases dc
      WHERE dc.id = document_case_sources.document_case_id
        AND user_has_org_access(dc.org_id)
    )
  );

CREATE POLICY document_case_sources_insert ON document_case_sources
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM document_cases dc
      WHERE dc.id = document_case_sources.document_case_id
        AND user_has_org_access(dc.org_id)
    )
  );

CREATE POLICY document_case_sources_no_update ON document_case_sources
  FOR UPDATE USING (false);

CREATE POLICY document_case_sources_no_delete ON document_case_sources
  FOR DELETE USING (false);

-- Full immutability triggers — catches service_role bypass of RLS
-- (mirrors source_document_versions pattern). One function, two
-- triggers (UPDATE + DELETE). TRUNCATE protection skipped per
-- Option C asymmetry (workflow row, not evidence anchor).
CREATE OR REPLACE FUNCTION reject_document_case_sources_mutation()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'document_case_sources is append-only — UPDATE and DELETE forbidden to preserve audit_log referent integrity (role corrections route through chunk-6 detach + re-attach)'
    USING ERRCODE = 'feature_not_supported';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_document_case_sources_no_update
  BEFORE UPDATE ON document_case_sources
  FOR EACH ROW
  EXECUTE FUNCTION reject_document_case_sources_mutation();

CREATE TRIGGER trg_document_case_sources_no_delete
  BEFORE DELETE ON document_case_sources
  FOR EACH ROW
  EXECUTE FUNCTION reject_document_case_sources_mutation();

-- Atomic INSERT-with-audit RPC (INV-AUDIT-001 leaf).
-- Mirrors chunk 1's create_document_case_with_audit shape verbatim,
-- with one structural improvement: audit_log.org_id is derived
-- INSIDE the RPC via subquery from document_cases at INSERT time
-- (not from p_audit). This guarantees the audit row's org_id is
-- consistent with the case's org_id (single source of truth, same
-- instant) and eliminates the service-side double-read TOCTOU window
-- the previous "service looks up org_id then passes it" pattern
-- would have introduced. Canonical Phase 2/3 RPC pattern for
-- parent-table-derived audit org_id (see chunk-3 implementation
-- notes #2 for the carry-forward to chunks 4+).
CREATE OR REPLACE FUNCTION attach_document_case_source_with_audit(
  p_link  JSONB,
  p_audit JSONB
) RETURNS UUID AS $$
DECLARE
  v_link_id UUID;
BEGIN
  -- INSERT 1: document_case_sources
  INSERT INTO document_case_sources (
    id, document_case_id, source_document_id, role, trace_id, created_by
  )
  VALUES (
    (p_link->>'id')::uuid,
    (p_link->>'document_case_id')::uuid,
    (p_link->>'source_document_id')::uuid,
    (p_link->>'role')::document_case_source_role,
    (p_link->>'trace_id')::uuid,
    p_link->>'created_by'
  )
  RETURNING id INTO v_link_id;

  -- INSERT 2: audit_log — paired write in same transaction.
  -- audit_log.org_id derived via subquery from document_cases at
  -- INSERT time (NOT from p_audit). Column list + NULLIF wrapping
  -- otherwise mirrors chunk 1's RPC verbatim.
  INSERT INTO audit_log (
    org_id, user_id, trace_id, action, entity_type, entity_id,
    before_state, after_state_id, tool_name, idempotency_key, reason
  )
  VALUES (
    (SELECT org_id FROM document_cases WHERE id = (p_link->>'document_case_id')::uuid),
    NULLIF(p_audit->>'user_id', '')::uuid,
    (p_audit->>'trace_id')::uuid,
    p_audit->>'action',
    p_audit->>'entity_type',
    v_link_id,
    p_audit->'before_state',
    NULLIF(p_audit->>'after_state_id', '')::uuid,
    p_audit->>'tool_name',
    NULLIF(p_audit->>'idempotency_key', '')::uuid,
    p_audit->>'reason'
  );

  RETURN v_link_id;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER;

GRANT EXECUTE ON FUNCTION attach_document_case_source_with_audit(JSONB, JSONB)
  TO service_role;
