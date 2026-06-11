-- ============================================================
-- Phase 5.1 chunk 5.1a — vendor_credits substrate ratification (β)
-- + INV-DOC-001 Layer 2 enforcement Sub-Q4-d 4-d.γ backfill
-- ============================================================
-- Sub-Q3 β disposition (Phase 5.1 scope-lock cycle Round 2 onset):
-- substrate-tables-only. NO service-layer surface (vendorCreditService.ts
-- not introduced at Phase 5.1); NO consumer wiring. Tables ship with
-- comments naming named-future-trigger.
--
-- Named-future-activation: vendorCreditService consumer chunk post-v1
-- contingent on founder + two real users hitting operational need
-- (Phase 5 retro §6:404 framing). Activates T4 + T6 dispatcher slots
-- reserved at Phase 4 chunk 3 (Refinement 2 from Phase 5.1 Round 2).
--
-- ADR-0010 substrate-now-enforcement-later N=5 instance (Phase 6.5
-- retro ratified N=4; chunk 5.1a adds N=5).
--
-- Substrate shape parallels vendor_prepayments substrate at migration
-- 20240138000000:185-273 with v1 adjustments:
-- - text columns + CHECK constraints (no new ENUM types at chunk 5.1a;
--   ENUM creation deferred to post-v1 consumer chunk)
-- - status v1-active subset = 4 values (mirror vendor_prepayments_status)
-- - linked_entity_type CHECK at source_document_links broadens 6→8 per
--   ADR-0016 third amendment cycle (cell-validity matrix activation
--   defers to post-v1 consumer chunk per ADR-0016 §3 discipline)
-- ============================================================

-- ============================================================
-- vendor_credits table (post-v1 consumer ships service layer)
-- ============================================================
CREATE TABLE vendor_credits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(org_id) ON DELETE CASCADE,
  legal_entity_id uuid REFERENCES organizations(org_id) ON DELETE RESTRICT,
  vendor_id uuid NOT NULL REFERENCES vendors(vendor_id),
  status text NOT NULL DEFAULT 'open',
  amount_original numeric(20,4) NOT NULL,
  amount_cad numeric(20,4) NOT NULL,
  fx_rate numeric(20,8),
  currency char(3) NOT NULL DEFAULT 'CAD',
  issue_date date NOT NULL,
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by text NOT NULL,
  trace_id uuid NOT NULL,

  -- Layer-1 CHECK: v1-active subset per ADR-0010 substrate-now-
  -- enforcement-later discipline. Post-v1 consumer chunk may add
  -- reversed/expired/voided values.
  CONSTRAINT vendor_credits_status_v1_active CHECK (
    status IN ('open', 'partially_applied', 'fully_applied', 'refunded')
  )
);

CREATE INDEX vendor_credits_org_id_idx ON vendor_credits (org_id);
CREATE INDEX vendor_credits_vendor_id_idx ON vendor_credits (vendor_id);
CREATE INDEX vendor_credits_status_idx ON vendor_credits (status)
  WHERE status IN ('open', 'partially_applied');

-- ============================================================
-- vendor_credit_applications table
-- ============================================================
-- Links a vendor_credit to a bill that consumes (part of) it.
-- Status of the parent vendor_credit is computed at service layer
-- from the sum of application amount_originals (post-v1 consumer).

CREATE TABLE vendor_credit_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(org_id) ON DELETE CASCADE,
  vendor_credit_id uuid NOT NULL REFERENCES vendor_credits(id),
  bill_id uuid NOT NULL REFERENCES bills(bill_id),
  amount_original numeric(20,4) NOT NULL,
  amount_cad numeric(20,4) NOT NULL,
  applied_at date NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by text NOT NULL,
  trace_id uuid NOT NULL
);

CREATE INDEX vendor_credit_applications_org_id_idx
  ON vendor_credit_applications (org_id);
CREATE INDEX vendor_credit_applications_vendor_credit_id_idx
  ON vendor_credit_applications (vendor_credit_id);
CREATE INDEX vendor_credit_applications_bill_id_idx
  ON vendor_credit_applications (bill_id);

-- ============================================================
-- RLS policies (org-scoped per chounting convention)
-- ============================================================
-- Pattern parity with vendor_prepayments + vendor_prepayment_applications:
-- use user_has_org_access(org_id) helper (defined in initial_schema.sql).

ALTER TABLE vendor_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_credit_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY vendor_credits_select ON vendor_credits
  FOR SELECT USING (user_has_org_access(org_id));
CREATE POLICY vendor_credits_insert ON vendor_credits
  FOR INSERT WITH CHECK (user_has_org_access(org_id));
CREATE POLICY vendor_credits_update ON vendor_credits
  FOR UPDATE USING (user_has_org_access(org_id));

CREATE POLICY vendor_credit_applications_select ON vendor_credit_applications
  FOR SELECT USING (user_has_org_access(org_id));
CREATE POLICY vendor_credit_applications_insert ON vendor_credit_applications
  FOR INSERT WITH CHECK (user_has_org_access(org_id));
CREATE POLICY vendor_credit_applications_update ON vendor_credit_applications
  FOR UPDATE USING (user_has_org_access(org_id));

-- ============================================================
-- linked_entity_type CHECK broadening 6→8 per ADR-0016 third amendment
-- ============================================================
-- Per Sub-Q3 β + ADR-0016 §1 v1-active 6→8 amendment: source_document_links
-- CHECK admits vendor_credit + vendor_credit_application linked_entity_type
-- values. Layer 1 broadening implies Zod schema broadening per chunk-2-
-- Phase-2 lesson; LinkedEntityTypeSchema widens in same commit
-- (apps/web/src/shared/schemas/document-platform/sourceDocumentLink.schema.ts).
--
-- VALID_PAIRS matrix: NO new pair activations per Sub-Q3 β + ADR-0016 §3
-- validity-matrix activation discipline (substrate-only without consumer =
-- no semantic brief justifying cell activation). vendor_credit +
-- vendor_credit_application rows stay R/I in Table B; cell activations
-- defer to post-v1 vendorCreditService consumer chunk per ADR-0016 §3
-- pre-commit upgrade path.
--
-- LINKED_ENTITY_TABLE_MAP at sourceDocumentLink.schema.ts updates with 2
-- new entries (vendor_credit + vendor_credit_application; PK column 'id'
-- per vendor_prepayment precedent).

-- Constraint name follows sequential chunk_N_active convention (chunk_5
-- is current; chunk_6 admits the new vendor_credit + vendor_credit_application
-- values). Sequential naming preserves the stable `chunk_\d+_active` regex
-- pattern used by Layer 1 CHECK-rejection tests (e.g.,
-- documentLinkService.integration.test.ts line 352).
ALTER TABLE source_document_links
  DROP CONSTRAINT source_document_links_linked_entity_type_chunk_5_active;

ALTER TABLE source_document_links
  ADD CONSTRAINT source_document_links_linked_entity_type_chunk_6_active CHECK (
    linked_entity_type IN (
      'bill',
      'bill_line',
      'payment',
      'bill_payment_allocation',
      'vendor_prepayment',
      'vendor_prepayment_application',
      'vendor_credit',
      'vendor_credit_application'
    )
  );

-- ============================================================
-- INV-DOC-001 Layer 2 enforcement Sub-Q4-d 4-d.γ backfill
-- ============================================================
-- Forward-only enforcement at billService.post() for bills posted
-- post-Phase-5.1. Pre-Phase-5.1 posted bills may lack primary_invoice/
-- receipt link rows; backfill auto-overrides those via the
-- override_evidence_completeness flag (Layer 1 substrate at migration
-- 20240138000000:172) + emits bill_evidence_override_applied audit row
-- per backfilled bill.
--
-- Per Phase 5.1 scope-lock cycle Round 3 Sub-Q4-d 4-d.γ:
-- forward + audit row backfill.
--
-- Note: bill_evidence_override_applied is a new audit action; audit_log.action
-- column is text per supabase/migrations/20240101000000_initial_schema.sql:490
-- (no closed-enum CHECK on audit actions), so no enum-extension required.

WITH updated_bills AS (
  UPDATE bills
  SET override_evidence_completeness = true
  WHERE override_evidence_completeness = false
    AND bill_id NOT IN (
      SELECT linked_entity_id
      FROM source_document_links
      WHERE linked_entity_type = 'bill'
        AND link_role IN ('primary_invoice', 'receipt')
        AND link_status = 'created'
    )
  RETURNING bill_id, org_id
)
INSERT INTO audit_log (
  audit_log_id,
  org_id,
  user_id,
  trace_id,
  action,
  entity_type,
  entity_id,
  before_state,
  tool_name,
  created_at
)
SELECT
  gen_random_uuid(),
  org_id,
  NULL,                                    -- system actor for migration backfill
  gen_random_uuid(),                       -- migration-grain trace_id per backfilled row
  'bill_evidence_override_applied',
  'bill',
  bill_id,
  jsonb_build_object(
    'override_evidence_completeness', false,
    'reason', 'Phase 5.1 chunk 5.1a INV-DOC-001 forward-only enforcement; auto-override applied to pre-Phase-5.1 posted bill without primary_invoice/receipt link',
    'migration', '20240156000000_phase_5_1_vendor_credits_substrate'
  ),
  'phase_5_1_migration_backfill',          -- tool_name discriminator for migration-grain audits
  now()
FROM updated_bills;
