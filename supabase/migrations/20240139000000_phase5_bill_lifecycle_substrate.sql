-- Phase 5 chunk B5-2 substantive session #1: bill lifecycle substrate
--
-- Per ADR-0015 §1 + §10 (bill lifecycle scope) and Spend brief §3.1
-- (mutation lifecycle table) + §5 (data model) + §11.1-11.3 (EC-A-1/2
-- + INV-AP-001/002 reserved invariants).
--
-- Locked scope (chunk B5-2 onset planning + 12-disposition substantive
-- surfacing per founder bundled-accept 2026-05-10):
--   - 4 mutations: post_bill, approve_bill_for_payment, record_bill_payment, reverse_bill
--   - 2 new tables: bill_payment_allocations (net-new); bill_lines column extensions only
--   - payment_method closed enum (v1 active: check/eft/wire/cash/other; reserved: credit_card/ach/bank_transfer/money_order)
--   - bills/bill_lines/payments column extensions per Sub-G ratified list
--   - INV-AP-001 + INV-AP-002 activation at Layer 2 service (D5)
--   - Reading B preservation (non-negotiable)
--   - bills.status legacy text column LEFT UNTOUCHED per Sub-F (i)
--   - bills/bill_lines/payments money columns stay numeric per Sub-H/L/M
--
-- Cross-references:
--   - bill_lifecycle_state enum + bills.lifecycle_state column shipped
--     at chunk B5-1 migration 20240138000000 lines 111-119, 170-172.
--     Reused as canonical per D1.
--   - vendor_prepayment_applications (B5-1) is semantically distinct
--     from bill_payment_allocations (this migration) per Sub-I.

-- ===========================================================================
-- Closed enum: payment_method (Sub-K + ADR-0010 reserved-enum-states)
-- ===========================================================================
-- Each enum declares FULL membership (v1 active + reserved). The v1-active
-- subset is enforced via Layer-1 CHECK constraint on the column using the
-- enum (declared inline with the column below). Reserved values exist in
-- the type so future migrations can activate them without an enum-altering
-- migration; they are NEVER emitted by v1 write paths (Layer-3 service
-- discipline).

-- payment_method per Sub-K (v1 active: check/eft/wire/cash/other;
-- reserved: credit_card/ach/bank_transfer/money_order)
CREATE TYPE payment_method AS ENUM (
  -- v1 active subset
  'check',
  'eft',
  'wire',
  'cash',
  'other',
  -- Reserved (post-v1 method expansion)
  'credit_card',
  'ach',
  'bank_transfer',
  'money_order'
);

-- ===========================================================================
-- bills table extensions (Sub-G + Sub-N (b))
-- ===========================================================================
-- Note: purchase_order_id ships nullable WITHOUT FK (purchase_orders table
-- doesn't exist; Phase F deferral per Spend brief §15).
-- posted_journal_entry_id per Sub-N (b): canonical back-reference for
-- reverse_bill to identify the JE to reverse via journalEntryService.post().

ALTER TABLE bills
  ADD COLUMN payment_terms_days int,
  ADD COLUMN purchase_order_id uuid,  -- nullable; no FK (Phase F deferral)
  ADD COLUMN tax_amount_total numeric(20,4) NOT NULL DEFAULT 0,
  ADD COLUMN posted_journal_entry_id uuid REFERENCES journal_entries(journal_entry_id);  -- per Sub-N (b); populated at post_bill time

COMMENT ON COLUMN bills.purchase_order_id IS
  'Reserved for Phase F PO module per Spend brief §15. Nullable; no FK constraint until purchase_orders table ships.';

COMMENT ON COLUMN bills.posted_journal_entry_id IS
  'FK to the journal_entry created when this bill was posted (post_bill mutation). Populated at post_bill time from journalEntryService.post() return value. Nullable for unposted bills (lifecycle_state = ''draft''). Used by reverse_bill mutation to identify the JE to reverse via journalEntryService.post(reverses_journal_entry_id=...).';

CREATE INDEX idx_bills_posted_journal_entry ON bills (posted_journal_entry_id) WHERE posted_journal_entry_id IS NOT NULL;

-- ===========================================================================
-- bill_lines table extensions (Sub-G)
-- ===========================================================================
-- Note: NO fx_rate column (Sub-M defer; relies on parent bill.fx_rate).

ALTER TABLE bill_lines
  ADD COLUMN tax_code_id uuid REFERENCES tax_codes(tax_code_id),  -- nullable; lines without tax
  ADD COLUMN line_number int;

CREATE INDEX idx_bill_lines_tax_code ON bill_lines (tax_code_id) WHERE tax_code_id IS NOT NULL;

-- ===========================================================================
-- payments table extensions (Sub-G + Sub-K + Sub-L)
-- ===========================================================================
-- Note: payments.amount stays CAD-implicit per Sub-L; service layer enforces
-- bill.currency = 'CAD' for record_bill_payment v1.

ALTER TABLE payments
  ADD COLUMN payment_method payment_method NOT NULL DEFAULT 'other',
  ADD COLUMN vendor_id uuid REFERENCES vendors(vendor_id),
  ADD COLUMN applied_to text CHECK (applied_to IS NULL OR applied_to IN ('bill', 'invoice')),
  ADD COLUMN reference_number text;

-- Layer-1 CHECK: payment_method v1-active subset (per Sub-K)
ALTER TABLE payments
  ADD CONSTRAINT payments_method_v1_active CHECK (
    payment_method IN ('check', 'eft', 'wire', 'cash', 'other')
  );

COMMENT ON COLUMN payments.amount IS
  'CAD-implicit for v1 per Sub-L. Multi-currency triad (amount_original/amount_cad/fx_rate) deferred to post-v1 multi-currency arc. Service layer enforces bill.currency = ''CAD'' precondition for record_bill_payment.';

CREATE INDEX idx_payments_vendor ON payments (org_id, vendor_id) WHERE vendor_id IS NOT NULL;

-- ===========================================================================
-- bill_payment_allocations table (Sub-I; net-new per Q60/Q74 substrate)
-- ===========================================================================
-- Many-to-many: one payment can split across N bills; one bill can be
-- allocated from N payments. Distinct from vendor_prepayment_applications
-- (which links vendor_prepayments to bills, not payments).

CREATE TABLE bill_payment_allocations (
  bill_payment_allocation_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(org_id) ON DELETE CASCADE,
  payment_id uuid NOT NULL REFERENCES payments(payment_id),
  bill_id uuid NOT NULL REFERENCES bills(bill_id),
  amount_cad numeric(20,4) NOT NULL CHECK (amount_cad > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid NOT NULL REFERENCES auth.users(id),
  trace_id uuid NOT NULL
);

CREATE INDEX idx_bill_payment_allocations_payment ON bill_payment_allocations (payment_id);
CREATE INDEX idx_bill_payment_allocations_bill ON bill_payment_allocations (bill_id);
CREATE INDEX idx_bill_payment_allocations_org ON bill_payment_allocations (org_id);

-- ===========================================================================
-- RLS policies for bill_payment_allocations (org-scoped per chounting convention)
-- ===========================================================================
-- Pattern parity with vendor_prepayment_applications (B5-1 migration
-- 20240138000000 lines 257-272): use user_has_org_access(org_id) helper
-- (defined in initial_schema.sql line 634).

ALTER TABLE bill_payment_allocations ENABLE ROW LEVEL SECURITY;

CREATE POLICY bill_payment_allocations_tenant_select ON bill_payment_allocations
  FOR SELECT USING (user_has_org_access(org_id));

CREATE POLICY bill_payment_allocations_tenant_insert ON bill_payment_allocations
  FOR INSERT WITH CHECK (user_has_org_access(org_id));

CREATE POLICY bill_payment_allocations_tenant_update ON bill_payment_allocations
  FOR UPDATE USING (user_has_org_access(org_id));
