-- Phase 5 chunk B5-1 substantive session #1: vendor prepayment substrate
--
-- Per ADR-0015 §1 (Q59 closure — vendor prepayment object shape),
-- §3 (Q61 closure — bifurcated approval gate),
-- §4 (Q62 closure — deposit/retainer tax timing),
-- §10 (schema deltas portion for vendor_prepayments + applications),
-- §11 (reserved enums for prepayment workflows).
--
-- Locked scope (chunk B5-1 onset planning + 7-item substantive surfacing):
--   Migration shape: (mig-α) single migration file.
--   Q1 enforcement: 3-layer joint per ADR-0010 reserved-enum-states.
--     Layer 1 (this file): CHECK constraints on closed-enum columns
--       restricting to v1-active subsets.
--     Layer 2: Zod boundary at apps/web/src/shared/schemas/spend/
--       vendorPrepayment.schema.ts rejects reserved values at service
--       entry points.
--     Layer 3: service code never emits reserved values; pure status
--       function at apps/web/src/services/spend/vendorPrepaymentStatus.ts
--       throws if reserved values are encountered (defensive).
--   Reading B preservation (ADR-0011 §1, ADR-0007 §Tier 2): the schema
--     introduced here will be consumed by mutation handlers in session #2;
--     handlers MUST call ledgerService.post inside withInvariants and
--     never write journal_entries / journal_lines directly.
--
-- Substrate-gap deferral (D5 / item 18 carry-forward): ADR-0015 §10
-- specifies `org_settings.deposit_tax_timing_default` as a per-org
-- override for tax-timing 3-layer resolution rule (Q2 lock). The
-- `org_settings` table itself was deferred at Phase 1.Storage chunk 1
-- (per supabase/migrations/20240135000000_storage_substrate.sql:27-32
-- anti-scope block) to a "dedicated sub-arc later in Phase 1, before
-- v1 ship". That sub-arc has not fired. Per (orgset-β) lock at
-- chunk B5-1 substantive session #1: this migration DEFERS the
-- `deposit_tax_timing_default` column extension; tax-timing 3-layer
-- rule operates with per-document override + jurisdiction default
-- branches active (per-org override branch reserved-but-inactive per
-- substrate-now-enforcement-later cross-pattern, D6 §6.8).
--
-- FT2 ride-alongside (item 1 fix target 2): the citation correction in
-- 20240137000000_create_source_document_with_audit_rpc.sql lines 13-19
-- ships in the same chunk-grain commit as this migration per chunk B5-1
-- substantive surfacing item 4 lock.

-- ===========================================================================
-- Closed enums (ADR-0015 §11 + bill_lifecycle_state from §10)
-- ===========================================================================
-- Each enum declares FULL membership (v1 active + reserved). The v1-active
-- subset is enforced via Layer-1 CHECK constraint on the column using the
-- enum (declared inline with the column below). Reserved values exist in
-- the type so future migrations can activate them without an enum-altering
-- migration; they are NEVER emitted by v1 write paths (Layer-3 service
-- discipline).

CREATE TYPE vendor_prepayment_type AS ENUM (
  -- v1 active subset
  'retainer',
  'deposit',
  'advance',
  'other',
  -- Reserved (post-v1 activation per ADR-0010)
  'security_deposit',
  'prepaid_service',
  'inventory_deposit',
  'fixed_asset_deposit'
);

CREATE TYPE vendor_prepayment_status AS ENUM (
  -- v1 active subset
  'open',
  'partially_applied',
  'fully_applied',
  'refunded',
  -- Reserved (post-v1 activation; v1 cases route through manual ledger
  -- entries with controller-stamped audit reasons)
  'written_off',
  'forfeited'
);

CREATE TYPE tax_timing_choice AS ENUM (
  -- v1 active subset
  'at_payment',
  'at_final_invoice',
  'review_required',
  -- Reserved (post-v1 controller-per-invoice workflow)
  'controller_chooses_per_invoice'
);

CREATE TYPE payment_purpose AS ENUM (
  -- v1 active subset
  'bill_payment',
  'vendor_prepayment',
  'vendor_refund',
  'other',
  -- Reserved (post-v1 expansion of payment purposes)
  'customer_payment',
  'employee_reimbursement',
  'owner_reimbursement',
  'tax_payment'
);

CREATE TYPE payment_state AS ENUM (
  -- v1 active subset
  'pending',
  'paid',
  'failed',
  -- Reserved (post-v1 partial/refund state expansion)
  'partially_returned',
  'refunded'
);

-- bill_lifecycle_state per ADR-0015 §10 (canonical AP states; all v1-active)
CREATE TYPE bill_lifecycle_state AS ENUM (
  'draft',
  'pending_approval',
  'approved_for_payment',
  'partially_paid',
  'fully_paid',
  'voided',
  'cancelled'
);

-- ===========================================================================
-- payments table extensions (ADR-0015 §10)
-- ===========================================================================

ALTER TABLE payments
  ADD COLUMN payment_state payment_state NOT NULL DEFAULT 'pending',
  ADD COLUMN payment_purpose payment_purpose NOT NULL DEFAULT 'other',
  ADD COLUMN bank_or_card_last4 text,
  ADD COLUMN merchant_identifier text,
  ADD COLUMN authorization_reference text,
  ADD COLUMN statement_appearance_date date;

-- Layer-1 CHECK: v1-active subset for payment_state + payment_purpose
ALTER TABLE payments
  ADD CONSTRAINT payments_state_v1_active CHECK (
    payment_state IN ('pending', 'paid', 'failed')
  ),
  ADD CONSTRAINT payments_purpose_v1_active CHECK (
    payment_purpose IN ('bill_payment', 'vendor_prepayment', 'vendor_refund', 'other')
  );

-- payment_purpose immutability (ADR-0015 §1; payment_purpose immutable
-- post-insert). Reclassification requires reversal + new payment with
-- corrected purpose per Reading B preservation. Implemented via BEFORE
-- UPDATE trigger (CHECK constraints cannot reference OLD/NEW).
CREATE OR REPLACE FUNCTION payments_payment_purpose_immutable()
RETURNS trigger AS $$
BEGIN
  IF OLD.payment_purpose IS DISTINCT FROM NEW.payment_purpose THEN
    RAISE EXCEPTION 'payment_purpose is immutable post-insert (ADR-0015 §1)'
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER payments_payment_purpose_immutable_trigger
  BEFORE UPDATE ON payments
  FOR EACH ROW
  EXECUTE FUNCTION payments_payment_purpose_immutable();

-- ===========================================================================
-- bills table extensions (ADR-0015 §10)
-- ===========================================================================
-- bills.lifecycle_state: canonical AP states (all v1-active; no CHECK needed
-- beyond the type itself).
-- bills.override_evidence_completeness: reserved Phase 2 stub for INV-DOC-001
-- (enforcement deferred per substrate-now-enforcement-later D6 §6.8).

ALTER TABLE bills
  ADD COLUMN lifecycle_state bill_lifecycle_state NOT NULL DEFAULT 'draft',
  ADD COLUMN override_evidence_completeness boolean NOT NULL DEFAULT false;

-- ===========================================================================
-- vendor_prepayments table (ADR-0015 §1, §10)
-- ===========================================================================
-- AP/Spend-owned record of cash paid to vendors before a final invoice exists.
-- Load-bearing primitive for retainers, deposits, and advances.
-- Status is computed at service layer (Layer 2 service code, ADR-0015 §1
-- "transition rules are Layer 2"); schema only holds the value.
-- legal_entity_id self-references organizations per v1 1:1 org-entity mapping
-- (ADR-0011 §10 framing; precedent at supabase/migrations/20240135000000_
-- storage_substrate.sql:182).

CREATE TABLE vendor_prepayments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(org_id) ON DELETE CASCADE,
  legal_entity_id uuid REFERENCES organizations(org_id) ON DELETE RESTRICT,
  vendor_id uuid NOT NULL REFERENCES vendors(vendor_id),
  prepayment_type vendor_prepayment_type NOT NULL,
  status vendor_prepayment_status NOT NULL,
  payment_id uuid NOT NULL REFERENCES payments(payment_id),
  amount_original numeric(20,4) NOT NULL,
  amount_cad numeric(20,4) NOT NULL,
  fx_rate numeric(20,8),
  currency char(3) NOT NULL DEFAULT 'CAD',
  recognized_at date NOT NULL,
  expected_application_date date,
  tax_timing_choice tax_timing_choice NOT NULL,
  tax_amount_at_payment numeric(20,4),
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by text NOT NULL,
  trace_id uuid NOT NULL,

  -- Layer-1 CHECK: restrict v1-active subset of closed enums per ADR-0010
  CONSTRAINT vendor_prepayments_type_v1_active CHECK (
    prepayment_type IN ('retainer', 'deposit', 'advance', 'other')
  ),
  CONSTRAINT vendor_prepayments_status_v1_active CHECK (
    status IN ('open', 'partially_applied', 'fully_applied', 'refunded')
  ),
  CONSTRAINT vendor_prepayments_tax_timing_v1_active CHECK (
    tax_timing_choice IN ('at_payment', 'at_final_invoice', 'review_required')
  )
);

CREATE INDEX vendor_prepayments_org_id_idx ON vendor_prepayments (org_id);
CREATE INDEX vendor_prepayments_vendor_id_idx ON vendor_prepayments (vendor_id);
CREATE INDEX vendor_prepayments_payment_id_idx ON vendor_prepayments (payment_id);
CREATE INDEX vendor_prepayments_status_idx ON vendor_prepayments (status)
  WHERE status IN ('open', 'partially_applied');

-- ===========================================================================
-- vendor_prepayment_applications table (ADR-0015 §1, §10)
-- ===========================================================================
-- Links a vendor_prepayment to a bill that consumes (part of) it. Status of
-- the parent vendor_prepayment is computed at service layer from the sum of
-- application amount_originals.

CREATE TABLE vendor_prepayment_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(org_id) ON DELETE CASCADE,
  vendor_prepayment_id uuid NOT NULL REFERENCES vendor_prepayments(id),
  bill_id uuid NOT NULL REFERENCES bills(bill_id),
  amount_original numeric(20,4) NOT NULL,
  amount_cad numeric(20,4) NOT NULL,
  applied_at date NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by text NOT NULL,
  trace_id uuid NOT NULL
);

CREATE INDEX vendor_prepayment_applications_org_id_idx
  ON vendor_prepayment_applications (org_id);
CREATE INDEX vendor_prepayment_applications_vendor_prepayment_id_idx
  ON vendor_prepayment_applications (vendor_prepayment_id);
CREATE INDEX vendor_prepayment_applications_bill_id_idx
  ON vendor_prepayment_applications (bill_id);

-- ===========================================================================
-- RLS policies (org-scoped per chounting convention)
-- ===========================================================================
-- Pattern parity with existing tables: use user_has_org_access(org_id) helper
-- (defined in initial_schema.sql) for FOR ALL access control.

ALTER TABLE vendor_prepayments ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_prepayment_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY vendor_prepayments_select ON vendor_prepayments
  FOR SELECT USING (user_has_org_access(org_id));
CREATE POLICY vendor_prepayments_insert ON vendor_prepayments
  FOR INSERT WITH CHECK (user_has_org_access(org_id));
CREATE POLICY vendor_prepayments_update ON vendor_prepayments
  FOR UPDATE USING (user_has_org_access(org_id));

CREATE POLICY vendor_prepayment_applications_select ON vendor_prepayment_applications
  FOR SELECT USING (user_has_org_access(org_id));
CREATE POLICY vendor_prepayment_applications_insert ON vendor_prepayment_applications
  FOR INSERT WITH CHECK (user_has_org_access(org_id));
CREATE POLICY vendor_prepayment_applications_update ON vendor_prepayment_applications
  FOR UPDATE USING (user_has_org_access(org_id));
