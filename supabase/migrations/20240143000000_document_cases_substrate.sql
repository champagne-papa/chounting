-- =============================================================
-- 20240143000000_document_cases_substrate.sql
-- Phase 2 chunk 1 — document_cases substrate + atomic audit RPC.
--
-- Per ADR-0011 §3 (case lifecycle states + transition matrix) +
--     ADR-0011 §6 (document_type discriminator) +
--     ADR-0011 §9 (immutability rules — column-level for audit
--                  anchors; row-level row-persistence not enumerated
--                  for document_cases, but see audit-referent
--                  integrity note below) +
--     ADR-0010   (reserved-enum three-layer defense) +
--     docs/02_specs/ledger_truth_model.md INV-AUDIT-001 leaf
--                (audit_log INSERT in same DB transaction).
--
-- Layer 1 enforcement at v1: state CHECK = 'received';
-- document_type CHECK ∈ {vendor_invoice, receipt,
-- payment_confirmation, unknown}. Full enum membership ships
-- in the type so chunk 2+ broadens via ALTER CONSTRAINT.
--
-- DELETE protection asymmetry vs Phase 1 source_documents:
--   Phase 1 ships three layers (RLS USING (false) + BEFORE DELETE
--   trigger + BEFORE TRUNCATE trigger + REVOKE TRUNCATE) because
--   source_documents is an evidence anchor and TRUNCATE protection
--   guards against bulk re-seed paths. Chunk 1 ships only the first
--   two (RLS + BEFORE DELETE) because document_cases is a workflow
--   row, not bulk-managed data, and the load-bearing concern is
--   audit_log referent integrity — a service_role-using bug must
--   not orphan audit entries. TRUNCATE protections are skipped as
--   cargo-cult for this row class. Chunk-zero adjudication.
--
-- Anti-scope (NOT in chunk 1):
--   - transition() service method (chunk 2).
--   - document_case_sources table + link_role enum (chunk 3).
--   - document_artifacts table (chunk 4).
--   - source_document_links polymorphic table (chunk 5).
--   - Exception queue + resolution_action enum (chunk 6).
-- =============================================================

-- Enums (full membership; v1-active subset enforced via CHECK)
CREATE TYPE document_case_state AS ENUM (
  -- v1 active subset (chunk 1):
  'received',
  -- Reserved (chunks 2+ / Phases 3-7 activation):
  'extracting', 'classified', 'matched',
  'proposed', 'needs_review',
  'approved', 'committed',
  'rejected', 'archived'
);

CREATE TYPE document_type AS ENUM (
  -- v1 active subset:
  'vendor_invoice', 'receipt', 'payment_confirmation', 'unknown',
  -- Reserved (post-v1 activation per ADR-0011 §6):
  'credit_memo', 'vendor_statement', 'purchase_order',
  'receiving_document', 'retainer_request', 'deposit_request',
  'bank_statement', 'card_statement', 'customer_invoice',
  'customer_remittance', 'tax_form', 'contract',
  'payroll_document', 'asset_purchase_support'
);

-- Table
CREATE TABLE document_cases (
  id                                uuid                PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id                            uuid                NOT NULL REFERENCES organizations(org_id) ON DELETE RESTRICT,
  document_type                     document_type       NOT NULL,
  state                             document_case_state NOT NULL DEFAULT 'received',
  current_relationship_candidate_id uuid,                                  -- populated Phase 4
  classification_confidence         numeric,                                -- populated Phase 7
  trace_id                          uuid                NOT NULL,
  created_at                        timestamptz         NOT NULL DEFAULT NOW(),
  created_by                        text                NOT NULL,           -- matches Phase 1 source_documents.created_by shape

  CONSTRAINT document_cases_document_type_v1_active CHECK (
    document_type IN ('vendor_invoice','receipt','payment_confirmation','unknown')
  ),
  CONSTRAINT document_cases_state_chunk_1_active CHECK (
    state = 'received'
  )
);

CREATE INDEX document_cases_org_id_idx        ON document_cases (org_id);
CREATE INDEX document_cases_document_type_idx ON document_cases (document_type);
CREATE INDEX document_cases_state_active_idx  ON document_cases (state) WHERE state = 'received';

-- RLS — mirrors source_documents pattern verbatim (20240135000000:331-345)
ALTER TABLE document_cases ENABLE ROW LEVEL SECURITY;

CREATE POLICY document_cases_select ON document_cases
  FOR SELECT USING (user_has_org_access(org_id));

CREATE POLICY document_cases_insert ON document_cases
  FOR INSERT WITH CHECK (user_has_org_access(org_id));

-- UPDATE allowed at the RLS layer; column-restriction is enforced by
-- trg_document_cases_column_immutability below. RLS gates the org
-- scope; the trigger gates the column scope (parallel to Phase 1).
CREATE POLICY document_cases_update ON document_cases
  FOR UPDATE USING (user_has_org_access(org_id))
  WITH CHECK (user_has_org_access(org_id));

CREATE POLICY document_cases_no_delete ON document_cases
  FOR DELETE USING (false);

-- Column-immutability trigger — mirrors source_documents pattern
-- (20240135000000:384-409). Protects audit-anchor columns from UPDATE.
-- Mutable columns: state, document_type, current_relationship_candidate_id,
-- classification_confidence (workflow fields; transition() broadens reach
-- at chunk 2).
CREATE OR REPLACE FUNCTION enforce_document_cases_column_immutability()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.id         IS DISTINCT FROM NEW.id         OR
     OLD.org_id     IS DISTINCT FROM NEW.org_id     OR
     OLD.trace_id   IS DISTINCT FROM NEW.trace_id   OR
     OLD.created_at IS DISTINCT FROM NEW.created_at OR
     OLD.created_by IS DISTINCT FROM NEW.created_by THEN
    RAISE EXCEPTION 'document_cases column-immutability violation: id / org_id / trace_id / created_at / created_by are immutable post-INSERT (per ADR-0011 §9)'
      USING ERRCODE = 'feature_not_supported';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_document_cases_column_immutability
  BEFORE UPDATE ON document_cases
  FOR EACH ROW
  EXECUTE FUNCTION enforce_document_cases_column_immutability();

-- Row-level DELETE protection — Option C asymmetry vs Phase 1.
-- Defense-in-depth for audit_log referent integrity: a service_role-using
-- bug must not delete a document_case that audit_log entries reference
-- via entity_id, which would degrade the audit trail to auditable-but-
-- uninvestigable. The trigger fires regardless of RLS bypass.
CREATE OR REPLACE FUNCTION reject_document_cases_delete()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'document_cases is delete-restricted — DELETE forbidden to preserve audit_log referent integrity'
    USING ERRCODE = 'feature_not_supported';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_document_cases_no_delete
  BEFORE DELETE ON document_cases
  FOR EACH ROW
  EXECUTE FUNCTION reject_document_cases_delete();

-- Atomic INSERT-with-audit RPC (INV-AUDIT-001 leaf)
-- Mirrors 20240137000000_create_source_document_with_audit_rpc.sql
-- audit_log INSERT shape verbatim, swapping entity_id source from
-- v_source_document_id to v_case_id and entity_type to 'document_case'.
CREATE OR REPLACE FUNCTION create_document_case_with_audit(
  p_case  JSONB,
  p_audit JSONB
) RETURNS UUID AS $$
DECLARE
  v_case_id UUID;
BEGIN
  -- INSERT 1: document_cases
  INSERT INTO document_cases (
    id, org_id, document_type, state, trace_id, created_by
  )
  VALUES (
    (p_case->>'id')::uuid,
    (p_case->>'org_id')::uuid,
    (p_case->>'document_type')::document_type,
    COALESCE((p_case->>'state')::document_case_state, 'received'),
    (p_case->>'trace_id')::uuid,
    p_case->>'created_by'
  )
  RETURNING id INTO v_case_id;

  -- INSERT 2: audit_log — paired write in same transaction.
  -- Column list + NULLIF wrapping mirrors Phase 1 storage RPC verbatim.
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
    v_case_id,
    p_audit->'before_state',
    NULLIF(p_audit->>'after_state_id', '')::uuid,
    p_audit->>'tool_name',
    NULLIF(p_audit->>'idempotency_key', '')::uuid,
    p_audit->>'reason'
  );

  RETURN v_case_id;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER;

GRANT EXECUTE ON FUNCTION create_document_case_with_audit(JSONB, JSONB)
  TO service_role;
