-- =============================================================
-- 20240181000000_extracted_invoices_substrate.sql
-- Board #4 slice-2 Task T1 — the α entity: extracted_invoices.
--
-- The per-invoice home for the case → N bills fan (one-case-N-bills,
-- N-1 segment-then-loop). One row per invoice within a document_case:
-- carries the segment's region + per-invoice extraction + per-invoice
-- document_type, and (post-phase) the bill it became + its persisted
-- idempotency key + post status.
--
-- Design authority:
--   docs/09_briefs/post-mvp/2026-06-29-board-4-slice-2-build-spec.md §1.4/§1.5
--   docs/09_briefs/post-mvp/2026-06-29-board-4-slice-2-build-plan.md T1
--   docs/09_briefs/post-mvp/2026-06-16-board-4-multi-invoice-modeling-design.md
--     (α LOCKED §4.3; §10.1 case→bill trace; G1/G2/G3).
--
-- IMMUTABILITY POSTURE (AP-1) — WORKFLOW ROW, NOT APPEND-ONLY.
--   Follows document_cases (20240143) column-immutability, NOT
--   document_artifacts/extraction_runs (20240146) full append-only,
--   because the post-phase mutates three columns:
--     - post_status      pending → posted | unrepairable (workflow field)
--     - posted_bill_id    NULL → value (WRITE-ONCE)
--     - idempotency_key   NULL → value (WRITE-ONCE; AP-3 — a silent
--                         re-write would let re-run dedup and crash-class
--                         recovery disagree about an invoice's key)
--   All other columns are immutable anchors. The BEFORE UPDATE trigger
--   below enforces both (anchor-immutability + write-once).
--
-- RLS: through-parent document_cases.org_id (no own org_id column;
--   mirrors document_case_sources 20240145:82-98). extracted_invoices
--   is a case-child; org scope derives from the parent case.
--
-- NOT-NULL BLAST RADIUS (.claude/rules/migrations.md): this is a NEW
--   table. Its only INSERT site is board #4 Stage 2.5 (T2), which does
--   not exist yet — so the blast radius of the NOT-NULL columns is
--   EMPTY at migration time (no existing writer to break). T2 is the
--   first and only inserter, via create_extracted_invoice_with_audit.
--
-- extraction_run_id is NULLABLE by design (advisor 2026-07-01): α (via
--   extracted_fields + region_ref), not extraction_runs, is the
--   per-region provenance home — the consequence of choosing α over β.
--   Per-region extraction under N-1 does not fit the per-source_document
--   extraction_runs keying, so this link is optional/coarse. Do NOT
--   "fix" to NOT NULL.
--
-- Anti-scope (NOT in T1):
--   - Stage 2.5 segmenter (writer) — T2.
--   - the N-loop post + post-phase UPDATE of posted_bill_id/post_status
--     /idempotency_key — T3 (service-layer, through the trigger below).
--   - committed-marking re-grain — T4.
-- =============================================================

-- -----------------------------------------------------------
-- post_status ENUM (all three v1-active; no reserved subset)
-- -----------------------------------------------------------
CREATE TYPE extracted_invoice_post_status AS ENUM (
  'pending',       -- created by Stage 2.5; not yet posted
  'posted',        -- billService.post succeeded; posted_bill_id set
  'unrepairable'   -- G3: JE landed but bill did not (POSTING_RECOVERY_UNREPAIRABLE)
);

-- -----------------------------------------------------------
-- Table
-- -----------------------------------------------------------
CREATE TABLE extracted_invoices (
  id                  uuid                          PRIMARY KEY DEFAULT gen_random_uuid(),
  document_case_id    uuid                          NOT NULL REFERENCES document_cases(id)   ON DELETE RESTRICT,
  source_document_id  uuid                          NOT NULL REFERENCES source_documents(id) ON DELETE RESTRICT,
  ordinal             int                           NOT NULL,                                   -- 1..N within case, over a deterministic Stage-2.5 sort (T2)
  document_type       document_type                 NOT NULL,                                   -- per-invoice (subsumes §10.2)
  extracted_fields    jsonb                         NOT NULL,                                   -- per-invoice VendorInvoiceExtraction payload (may be {} on empty extract)
  extraction_run_id   uuid                          REFERENCES extraction_runs(id) ON DELETE RESTRICT,  -- NULLABLE by design (see header)
  region_ref          jsonb,                                                                    -- segment bbox/line-range (N-1 provenance)
  idempotency_key     text,                                                                     -- WRITE-ONCE; resolved at first post (T5)
  posted_bill_id      uuid                          REFERENCES bills(bill_id) ON DELETE RESTRICT,       -- WRITE-ONCE; the auditable case↔bill link
  post_status         extracted_invoice_post_status NOT NULL DEFAULT 'pending',
  trace_id            uuid                          NOT NULL,
  created_at          timestamptz                   NOT NULL DEFAULT NOW(),
  created_by          text                          NOT NULL,

  -- One α per ordinal per case (the natural key; feeds the ordinal-
  -- fallback idempotency suffix, T5).
  CONSTRAINT extracted_invoices_case_ordinal_unique
    UNIQUE (document_case_id, ordinal),

  -- v1-active document_type subset (mirrors document_cases 20240143:73-75).
  CONSTRAINT extracted_invoices_document_type_v1_active CHECK (
    document_type IN ('vendor_invoice', 'receipt', 'payment_confirmation', 'unknown')
  ),

  -- post_status ⇔ posted_bill_id coherence: a 'posted' row MUST carry a
  -- bill; a non-'posted' row MUST NOT. (unrepairable + pending both have
  -- NULL posted_bill_id — G3 leaves it NULL by construction.)
  CONSTRAINT extracted_invoices_posted_has_bill CHECK (
    (post_status = 'posted') = (posted_bill_id IS NOT NULL)
  )
);

CREATE INDEX extracted_invoices_document_case_id_idx ON extracted_invoices (document_case_id);
CREATE INDEX extracted_invoices_source_document_id_idx ON extracted_invoices (source_document_id);
CREATE INDEX extracted_invoices_posted_bill_id_idx ON extracted_invoices (posted_bill_id)
  WHERE posted_bill_id IS NOT NULL;

-- -----------------------------------------------------------
-- RLS — through-parent document_cases.org_id (mirrors
-- document_case_sources 20240145:82-98). SELECT/INSERT/UPDATE gated by
-- org access to the parent case; UPDATE is allowed (post-phase writes
-- posted_bill_id/post_status/idempotency_key) with the column-scope
-- enforced by the trigger below. DELETE locked.
-- -----------------------------------------------------------
ALTER TABLE extracted_invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY extracted_invoices_select ON extracted_invoices
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM document_cases dc
      WHERE dc.id = extracted_invoices.document_case_id
        AND user_has_org_access(dc.org_id)
    )
  );

CREATE POLICY extracted_invoices_insert ON extracted_invoices
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM document_cases dc
      WHERE dc.id = extracted_invoices.document_case_id
        AND user_has_org_access(dc.org_id)
    )
  );

CREATE POLICY extracted_invoices_update ON extracted_invoices
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM document_cases dc
      WHERE dc.id = extracted_invoices.document_case_id
        AND user_has_org_access(dc.org_id)
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM document_cases dc
      WHERE dc.id = extracted_invoices.document_case_id
        AND user_has_org_access(dc.org_id)
    )
  );

CREATE POLICY extracted_invoices_no_delete ON extracted_invoices
  FOR DELETE USING (false);

-- -----------------------------------------------------------
-- Column-immutability + write-once trigger (AP-1 / AP-3).
-- Catches service_role bypass of RLS (mirrors document_cases 20240143:
-- 109-127 idiom, extended with two write-once guards).
--
--   anchors (immutable, any change → reject):
--     id, document_case_id, source_document_id, ordinal, document_type,
--     extracted_fields, extraction_run_id, region_ref, trace_id,
--     created_at, created_by
--   write-once (NULL→value only, value→different → reject):
--     idempotency_key, posted_bill_id
--   freely mutable (the workflow field):
--     post_status
-- -----------------------------------------------------------
CREATE OR REPLACE FUNCTION enforce_extracted_invoices_immutability()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.id                 IS DISTINCT FROM NEW.id                 OR
     OLD.document_case_id   IS DISTINCT FROM NEW.document_case_id   OR
     OLD.source_document_id IS DISTINCT FROM NEW.source_document_id OR
     OLD.ordinal            IS DISTINCT FROM NEW.ordinal            OR
     OLD.document_type      IS DISTINCT FROM NEW.document_type      OR
     OLD.extracted_fields   IS DISTINCT FROM NEW.extracted_fields   OR
     OLD.extraction_run_id  IS DISTINCT FROM NEW.extraction_run_id  OR
     OLD.region_ref         IS DISTINCT FROM NEW.region_ref         OR
     OLD.trace_id           IS DISTINCT FROM NEW.trace_id           OR
     OLD.created_at         IS DISTINCT FROM NEW.created_at         OR
     OLD.created_by         IS DISTINCT FROM NEW.created_by THEN
    RAISE EXCEPTION 'extracted_invoices column-immutability violation: only post_status, posted_bill_id (write-once), idempotency_key (write-once) are mutable post-INSERT'
      USING ERRCODE = 'feature_not_supported';
  END IF;

  -- write-once: idempotency_key (AP-3). NULL→value allowed; any change to
  -- an already-set key is forbidden (would let re-run dedup and crash-class
  -- recovery disagree about an invoice's key).
  IF OLD.idempotency_key IS NOT NULL
     AND NEW.idempotency_key IS DISTINCT FROM OLD.idempotency_key THEN
    RAISE EXCEPTION 'extracted_invoices.idempotency_key is write-once (NULL→value only); re-writing a resolved key is forbidden (AP-3)'
      USING ERRCODE = 'feature_not_supported';
  END IF;

  -- write-once: posted_bill_id. NULL→value allowed; re-pointing a posted
  -- bill is forbidden.
  IF OLD.posted_bill_id IS NOT NULL
     AND NEW.posted_bill_id IS DISTINCT FROM OLD.posted_bill_id THEN
    RAISE EXCEPTION 'extracted_invoices.posted_bill_id is write-once (NULL→value only)'
      USING ERRCODE = 'feature_not_supported';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_extracted_invoices_immutability
  BEFORE UPDATE ON extracted_invoices
  FOR EACH ROW
  EXECUTE FUNCTION enforce_extracted_invoices_immutability();

-- Row-level DELETE protection (mirrors document_cases 20240143:134-145):
-- extracted_invoices rows are audit_log referents (entity_id) — a
-- service_role-using bug must not orphan audit entries.
CREATE OR REPLACE FUNCTION reject_extracted_invoices_delete()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'extracted_invoices is delete-restricted — DELETE forbidden to preserve audit_log referent integrity'
    USING ERRCODE = 'feature_not_supported';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_extracted_invoices_no_delete
  BEFORE DELETE ON extracted_invoices
  FOR EACH ROW
  EXECUTE FUNCTION reject_extracted_invoices_delete();

-- -----------------------------------------------------------
-- Atomic INSERT-with-audit RPC (INV-AUDIT-001 leaf).
-- Mirrors attach_document_case_source_with_audit (20240145:139-187):
-- audit_log.org_id is derived INSIDE the RPC via subquery from
-- document_cases at INSERT time (single source of truth; no service-side
-- double-read TOCTOU). Called by Stage 2.5 (T2), once per segmented
-- invoice.
-- -----------------------------------------------------------
CREATE OR REPLACE FUNCTION create_extracted_invoice_with_audit(
  p_invoice JSONB,
  p_audit   JSONB
) RETURNS UUID AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO extracted_invoices (
    id, document_case_id, source_document_id, ordinal, document_type,
    extracted_fields, extraction_run_id, region_ref, trace_id, created_by
  )
  VALUES (
    (p_invoice->>'id')::uuid,
    (p_invoice->>'document_case_id')::uuid,
    (p_invoice->>'source_document_id')::uuid,
    (p_invoice->>'ordinal')::int,
    (p_invoice->>'document_type')::document_type,
    p_invoice->'extracted_fields',
    NULLIF(p_invoice->>'extraction_run_id', '')::uuid,
    p_invoice->'region_ref',
    (p_invoice->>'trace_id')::uuid,
    p_invoice->>'created_by'
  )
  RETURNING id INTO v_id;

  -- Paired audit write, same transaction. org_id derived from the parent
  -- document_case (not from p_audit) — mirrors chunk-3 RPC.
  INSERT INTO audit_log (
    org_id, user_id, trace_id, action, entity_type, entity_id,
    before_state, after_state_id, tool_name, idempotency_key, reason
  )
  VALUES (
    (SELECT org_id FROM document_cases WHERE id = (p_invoice->>'document_case_id')::uuid),
    NULLIF(p_audit->>'user_id', '')::uuid,
    (p_audit->>'trace_id')::uuid,
    p_audit->>'action',
    p_audit->>'entity_type',
    v_id,
    p_audit->'before_state',
    NULLIF(p_audit->>'after_state_id', '')::uuid,
    p_audit->>'tool_name',
    NULLIF(p_audit->>'idempotency_key', '')::uuid,
    p_audit->>'reason'
  );

  RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER;

GRANT EXECUTE ON FUNCTION create_extracted_invoice_with_audit(JSONB, JSONB)
  TO service_role;
