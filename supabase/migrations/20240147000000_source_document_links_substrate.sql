-- =============================================================
-- 20240147000000_source_document_links_substrate.sql
-- Phase 2 chunk 5 — polymorphic source_document_links spine +
-- atomic create + reverse RPCs with parent-derived org_id.
--
-- Per ADR-0011 §4 (three discipline constraints: closed enum on
--                  linked_entity_type, closed enum on link_role,
--                  service-layer integrity validation; ADR is
--                  silent on base column list — chunk 5 invents
--                  the 9-column shape per chunk-3 join-table
--                  precedent) +
--     ADR-0011 §9 Rule 4 (post-commit immutability via link_status
--                  flip; pre-commit re-routing permitted) +
--     ADR-0016 §1, §2, §3, §4, §5, §6 (membership + matrix +
--                  rejection rules + cascade contract + GRANT
--                  mechanism — all owned by ADR-0016) +
--     ADR-0010   (reserved-enum three-layer defense) +
--     ADR-0001   (reversal semantics inherited by §5 cascade).
--
-- DEVIATION FROM ADR-0016 §1 v1-active subset: chunk 5 ships 6
-- v1-active linked_entity_type values, NOT the 8 ADR-0016 §1
-- specifies. ADR-0016 §1 lists vendor_credit + vendor_credit_
-- application as v1-active, but Phase 5 substrate did not ship
-- vendor_credits / vendor_credit_applications tables. The
-- polymorphic integrity validator's existence check requires
-- those tables to exist; including the two values in chunk-5's
-- v1-active subset would produce LINKED_ENTITY_NOT_FOUND errors
-- with a "relation does not exist" Postgres error at runtime.
-- Forward-compatible: when Phase 5 ships the credit substrate,
-- a future chunk's CHECK relaxes _chunk_5_active to _chunk_N_active
-- with 8 values; pair-validity CHECK extends to 15 pairs; Zod
-- literal union extends to 8; the validator's table map adds two
-- cases. Per ADR-0016 §1's reserved-enum activation discipline,
-- this is the canonical extension path. See chunk-5 retrospective
-- inventory addition (ADR-0016 full editorial audit).
--
-- §6(a) + §6(b) two-mechanism state mutation control:
--   - §6(a) column-level GRANT: REVOKE UPDATE FROM service_role +
--     GRANT UPDATE (link_status) — service_role can only mutate
--     the one column. Codebase-novel pattern (chunks 1-4 used
--     RLS USING (false) for row-level immutability; chunk 5
--     introduces column-level GRANT for narrow service_role
--     mutation while blocking other columns).
--   - §6(b) column-list trigger: BEFORE UPDATE OF link_status,
--     rejects reversed → created regression. Narrow firing
--     surface; only fires on link_status transitions.
--   Composition: GRANT enforces "which columns are mutable" (only
--   link_status); trigger enforces "valid transitions on the
--   mutable column" (no regression). No overlap; clean
--   architecture.
--
-- Polymorphic FK absence: linked_entity_id references one of N
-- tables depending on linked_entity_type. SQL polymorphic FKs
-- are not enforceable per ADR-0011 §4 constraint 3. Service-
-- layer integrity validation lives in documentLinkService.create()
-- as a 6-case switch (per the chunk-5 deviation from ADR-0016
-- §1 noted above).
--
-- Pair-validity matrix at chunk 5: 13 A-labeled cells (ADR-0016
-- §3 Table A specifies 15; chunk 5 drops the 2 vendor_credit /
-- vendor_credit_application cells per the §1 deviation above):
--   ('bill', 'primary_invoice'), ('bill', 'receipt'),
--   ('bill', 'supporting'),
--   ('bill_line', 'supporting'),
--   ('payment', 'payment_evidence'), ('payment', 'receipt'),
--   ('payment', 'supporting'),
--   ('bill_payment_allocation', 'payment_evidence'),
--   ('bill_payment_allocation', 'supporting'),
--   ('vendor_prepayment', 'payment_evidence'),
--   ('vendor_prepayment', 'receipt'),
--   ('vendor_prepayment', 'supporting'),
--   ('vendor_prepayment_application', 'supporting').
--
-- ON DELETE CASCADE on source_document_id FK per ADR-0011 §4
-- + ADR-0016 §5 — different from chunks 3-4's ON DELETE RESTRICT.
-- Cascade fires at table-owner level (bypasses GRANT/REVOKE) so
-- the source_documents → source_document_links cascade works
-- despite REVOKE DELETE FROM service_role.
--
-- Constraint naming: _chunk_5_active for all three CHECKs
-- (chunks 1-2 incremental-broadening precedent). Stable test
-- regex: /source_document_links_(linked_entity_type|link_role|
-- pair_validity)_chunk_\d+_active/.
-- =============================================================

-- -----------------------------------------------------------
-- linked_entity_type ENUM (28 values per ADR-0016 §1;
-- v1-active subset enforced via CHECK; chunk 5 ships 6 v1-active
-- per the deviation documented in the file-header comment)
-- -----------------------------------------------------------
CREATE TYPE linked_entity_type AS ENUM (
  -- v1 active subset at chunk 5 (6 values; ADR-0016 §1 lists 8
  -- including vendor_credit + vendor_credit_application but
  -- Phase 5 substrate doesn't ship those tables):
  'bill',
  'bill_line',
  'payment',
  'bill_payment_allocation',
  'vendor_prepayment',
  'vendor_prepayment_application',
  -- Reserved at chunk 5 (will activate when Phase 5 ships credit
  -- substrate; ADR-0016 §1 already lists them in v1-active set):
  'vendor_credit',
  'vendor_credit_application',
  -- Reserved post-v1 (20 values):
  'bank_transaction',
  'card_transaction',
  'bank_account',
  'card_account',
  'customer_invoice',
  'customer_invoice_line',
  'customer_payment',
  'customer_credit',
  'vendor_statement_line',
  'bank_reconciliation',
  'card_reconciliation',
  'fixed_asset',
  'tax_filing',
  'payroll_run',
  'payroll_employee',
  'journal_entry',
  'journal_line',
  'vendor_master',
  'customer_master',
  'period_close'
);

-- -----------------------------------------------------------
-- link_role ENUM (27 values per ADR-0016 §2;
-- v1-active subset enforced via CHECK)
-- -----------------------------------------------------------
CREATE TYPE link_role AS ENUM (
  -- v1 active subset (4 values):
  'primary_invoice',
  'payment_evidence',
  'receipt',
  'supporting',
  -- Reserved post-v1 (23 values):
  'duplicate_arrival',
  'superseded_version',
  'vendor_credit_memo',
  'vendor_statement_excerpt',
  'purchase_order',
  'receiving_document',
  'retainer_agreement',
  'deposit_request',
  'bank_statement_excerpt',
  'card_statement_excerpt',
  'reconciliation_evidence',
  'failure_notice',
  'customer_invoice_attachment',
  'customer_remittance',
  'tax_form',
  'contract',
  'payroll_document',
  'asset_purchase_support',
  'prior_period_evidence',
  'correction_memo',
  'controller_override_memo',
  'audit_evidence',
  'email_thread'
);

-- -----------------------------------------------------------
-- link_status ENUM (2 values per ADR-0016 §5; both active v1)
-- -----------------------------------------------------------
CREATE TYPE link_status AS ENUM (
  'created',
  'reversed'
);

-- -----------------------------------------------------------
-- source_document_links table — 9 columns, polymorphic spine.
-- No FK on linked_entity_id (polymorphic). No reversal columns
-- on the row per ADR-0016 §Schema-deltas.
-- -----------------------------------------------------------
CREATE TABLE source_document_links (
  id                  uuid                NOT NULL  PRIMARY KEY DEFAULT gen_random_uuid(),
  source_document_id  uuid                NOT NULL  REFERENCES source_documents(id) ON DELETE CASCADE,
  linked_entity_type  linked_entity_type  NOT NULL,
  linked_entity_id    uuid                NOT NULL,
  link_role           link_role           NOT NULL,
  link_status         link_status         NOT NULL  DEFAULT 'created',
  trace_id            uuid                NOT NULL,
  created_at          timestamptz         NOT NULL  DEFAULT NOW(),
  created_by          text                NOT NULL,

  CONSTRAINT source_document_links_linked_entity_type_chunk_5_active CHECK (
    linked_entity_type IN (
      'bill', 'bill_line', 'payment', 'bill_payment_allocation',
      'vendor_prepayment', 'vendor_prepayment_application'
    )
  ),
  CONSTRAINT source_document_links_link_role_chunk_5_active CHECK (
    link_role IN (
      'primary_invoice', 'payment_evidence', 'receipt', 'supporting'
    )
  ),
  CONSTRAINT source_document_links_pair_validity_chunk_5_active CHECK (
    (linked_entity_type, link_role) IN (
      ('bill',                          'primary_invoice'),
      ('bill',                          'receipt'),
      ('bill',                          'supporting'),
      ('bill_line',                     'supporting'),
      ('payment',                       'payment_evidence'),
      ('payment',                       'receipt'),
      ('payment',                       'supporting'),
      ('bill_payment_allocation',       'payment_evidence'),
      ('bill_payment_allocation',       'supporting'),
      ('vendor_prepayment',             'payment_evidence'),
      ('vendor_prepayment',             'receipt'),
      ('vendor_prepayment',             'supporting'),
      ('vendor_prepayment_application', 'supporting')
    )
  ),
  CONSTRAINT source_document_links_unique_quad
    UNIQUE (source_document_id, linked_entity_type, linked_entity_id, link_role)
);

CREATE INDEX source_document_links_source_doc_idx
  ON source_document_links (source_document_id);
CREATE INDEX source_document_links_entity_idx
  ON source_document_links (linked_entity_type, linked_entity_id);
CREATE INDEX source_document_links_entity_status_idx
  ON source_document_links (linked_entity_type, linked_entity_id, link_status);

-- -----------------------------------------------------------
-- RLS (user_role): 4-policy through-parent via source_documents.
-- -----------------------------------------------------------
ALTER TABLE source_document_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY source_document_links_select ON source_document_links
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM source_documents sd
      WHERE sd.id = source_document_links.source_document_id
        AND user_has_org_access(sd.org_id)
    )
  );

CREATE POLICY source_document_links_insert ON source_document_links
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM source_documents sd
      WHERE sd.id = source_document_links.source_document_id
        AND user_has_org_access(sd.org_id)
    )
  );

CREATE POLICY source_document_links_no_user_update ON source_document_links
  FOR UPDATE USING (false);

CREATE POLICY source_document_links_no_user_delete ON source_document_links
  FOR DELETE USING (false);

-- -----------------------------------------------------------
-- §6(a) column-level GRANT for service_role.
-- -----------------------------------------------------------
REVOKE UPDATE ON source_document_links FROM service_role;
REVOKE DELETE ON source_document_links FROM service_role;
GRANT UPDATE (link_status) ON source_document_links TO service_role;

-- -----------------------------------------------------------
-- §6(b) column-list trigger: BEFORE UPDATE OF link_status only.
-- Rejects reversed → created regression.
-- -----------------------------------------------------------
CREATE OR REPLACE FUNCTION reject_source_document_links_status_regression()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.link_status = 'reversed' AND NEW.link_status = 'created' THEN
    RAISE EXCEPTION 'source_document_links.link_status transition reversed → created is forbidden (one-way per ADR-0016 §6(b)); reversal is permanent'
      USING ERRCODE = 'feature_not_supported';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_source_document_links_status_one_way
  BEFORE UPDATE OF link_status ON source_document_links
  FOR EACH ROW
  EXECUTE FUNCTION reject_source_document_links_status_regression();

-- -----------------------------------------------------------
-- create_source_document_link_with_audit RPC.
-- Mirrors chunk-3 attach_document_case_source_with_audit shape
-- with parent-derived org_id (subquery from source_documents).
-- -----------------------------------------------------------
CREATE OR REPLACE FUNCTION create_source_document_link_with_audit(
  p_link  JSONB,
  p_audit JSONB
) RETURNS UUID AS $$
DECLARE
  v_link_id UUID;
BEGIN
  -- INSERT 1: source_document_links
  INSERT INTO source_document_links (
    id, source_document_id, linked_entity_type, linked_entity_id,
    link_role, link_status, trace_id, created_by
  )
  VALUES (
    (p_link->>'id')::uuid,
    (p_link->>'source_document_id')::uuid,
    (p_link->>'linked_entity_type')::linked_entity_type,
    (p_link->>'linked_entity_id')::uuid,
    (p_link->>'link_role')::link_role,
    'created',
    (p_link->>'trace_id')::uuid,
    p_link->>'created_by'
  )
  RETURNING id INTO v_link_id;

  -- INSERT 2: audit_log — paired write in same transaction.
  -- audit_log.org_id derived via subquery from source_documents.
  INSERT INTO audit_log (
    org_id, user_id, trace_id, action, entity_type, entity_id,
    before_state, after_state_id, tool_name, idempotency_key, reason
  )
  VALUES (
    (SELECT org_id FROM source_documents WHERE id = (p_link->>'source_document_id')::uuid),
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

GRANT EXECUTE ON FUNCTION create_source_document_link_with_audit(JSONB, JSONB)
  TO service_role;

-- -----------------------------------------------------------
-- reverse_source_document_link_with_audit RPC.
-- Bulk operation per ADR-0016 §5 — flips ALL link_status='created'
-- rows matching (linked_entity_type, linked_entity_id). Emits
-- one audit_log row per flipped row.
--
-- Returns UUID[] of flipped link rows (may be empty if no
-- matching rows; service treats empty as a valid no-op).
-- -----------------------------------------------------------
CREATE OR REPLACE FUNCTION reverse_source_document_link_with_audit(
  p_input JSONB,
  p_audit JSONB
) RETURNS UUID[] AS $$
DECLARE
  v_flipped UUID[];
  v_link_id UUID;
  v_source_doc_id UUID;
  v_org_id UUID;
BEGIN
  -- Bulk UPDATE with RETURNING; capture flipped link_ids for
  -- subsequent per-row audit_log INSERTs.
  WITH flipped AS (
    UPDATE source_document_links
    SET link_status = 'reversed'
    WHERE linked_entity_type = (p_input->>'linked_entity_type')::linked_entity_type
      AND linked_entity_id   = (p_input->>'linked_entity_id')::uuid
      AND link_status        = 'created'
    RETURNING id
  )
  SELECT array_agg(id) INTO v_flipped FROM flipped;

  IF v_flipped IS NULL THEN
    RETURN ARRAY[]::UUID[];
  END IF;

  -- Per-row audit_log INSERT. One event per flipped row.
  FOR v_link_id IN SELECT unnest(v_flipped) LOOP
    SELECT source_document_id
      INTO v_source_doc_id
      FROM source_document_links
      WHERE id = v_link_id;

    SELECT org_id INTO v_org_id
      FROM source_documents
      WHERE id = v_source_doc_id;

    INSERT INTO audit_log (
      org_id, user_id, trace_id, action, entity_type, entity_id,
      before_state, after_state_id, tool_name, idempotency_key, reason
    )
    VALUES (
      v_org_id,
      NULLIF(p_audit->>'controller_user_id', '')::uuid,
      (p_audit->>'reversal_trace_id')::uuid,
      'source_document_link_reversed',
      'source_document_link',
      v_link_id,
      jsonb_build_object('link_status', 'created'),
      NULL,
      NULL,
      NULL,
      p_audit->>'reversal_reason'
    );
  END LOOP;

  RETURN v_flipped;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER;

GRANT EXECUTE ON FUNCTION reverse_source_document_link_with_audit(JSONB, JSONB)
  TO service_role;
