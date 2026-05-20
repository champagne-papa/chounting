-- ============================================================
-- Phase 7 chunk 7.2 — org_settings substrate-add migration
-- + ExceptionReason Layer 1 CHECK broadening (chunk_6 → chunk_7)
-- ============================================================
-- Per chunk 7.2 brief §2.1 + Sub-Q27 column-shape value picks + Session 38
-- directive Iteration 3 §2 Task 7.2.1.
--
-- ADR-0010 substrate-now-enforcement-later N=6 instance (Phase 5.1 chunk
-- 5.1a ratified N=5; chunk 7.2 adds N=6). 11 reserved org_settings columns
-- ship per ADR-0014 (5 v1-active NOT NULL DEFAULT) + ADR-0019 §2 lines
-- 399-404 (6 NULL-default substrate-now-enforcement-later).
--
-- The ENUM ADD VALUE for ai_fallback_validation_failed lands in the
-- preceding migration 20240157 (separated per Postgres ENUM new-value
-- same-transaction restriction; see that migration's header for the
-- split rationale). This migration's Layer 1 CHECK broadening references
-- the new value safely because the preceding migration's transaction
-- has committed before this one runs.
--
-- Per chunk-2-Phase-2 constraint-name sequencing lesson: Layer 1 CHECK
-- broadens from exception_reason_chunk_6_active → exception_reason_chunk_
-- 7_active. Sequential naming preserves the stable `chunk_\d+_active`
-- regex pattern used by Layer 1 CHECK-rejection tests.
-- ============================================================

-- ============================================================
-- ExceptionReason Layer 1 CHECK broadening: chunk_6_active → chunk_7_active
-- ============================================================

ALTER TABLE exception_queue_entries
  DROP CONSTRAINT exception_reason_chunk_6_active;

ALTER TABLE exception_queue_entries
  ADD CONSTRAINT exception_reason_chunk_7_active CHECK (
    exception_reason IN (
      'manual_route',
      'low_confidence_classification',
      'unknown_document_type',
      'unmatched_router_candidate',
      'multi_candidate_ambiguity',
      'invariant_violation',
      'ai_fallback_validation_failed'
    )
  );

-- ============================================================
-- org_settings table substrate
-- ============================================================
-- Row-per-org per ADR-0014 §Closes Q73 + ADR-0019 §2. Columns reserved at
-- v1 schema time per ADR-0010 discipline; per-org configurability switches
-- on post-v1 by allowing the column value to vary per org.

CREATE TABLE org_settings (
  org_id uuid PRIMARY KEY REFERENCES organizations(org_id) ON DELETE CASCADE,

  -- 5 ADR-0014 v1-active reserved columns (NOT NULL DEFAULT to v1-fixed value)
  -- per Sub-Q27 column-shape value picks.
  classification_fallback_order text[] NOT NULL DEFAULT ARRAY['tier_a', 'tier_c', 'tier_d']::text[],
  ai_fallback_budget integer NOT NULL DEFAULT 2,
  vendor_match_threshold numeric(3,2) NOT NULL DEFAULT 0.80,
  gc_cadence text NOT NULL DEFAULT 'daily',
  gc_threshold_hours integer NOT NULL DEFAULT 24,

  -- 6 ADR-0019 reserved columns (NULL-default substrate-now-enforcement-later)
  -- per ADR-0019 §2 lines 399-404 verbatim.
  confidence_threshold_vendor_invoice numeric(3,2) DEFAULT NULL,
  confidence_threshold_receipt numeric(3,2) DEFAULT NULL,
  confidence_threshold_payment_confirmation numeric(3,2) DEFAULT NULL,
  confidence_threshold_ambiguity_margin numeric(3,2) DEFAULT NULL,
  calibration_cadence integer DEFAULT NULL,
  calibration_test_set_version text DEFAULT NULL,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  -- Layer 1 CHECK: gc_cadence v1-active subset per ADR-0014 §Closes Q73.
  CONSTRAINT org_settings_gc_cadence_chunk_7_active CHECK (
    gc_cadence IN ('daily', 'hourly')
  ),

  -- Layer 1 CHECK: confidence-threshold columns within legal [0, 1] range
  -- per ADR-0019 §2 + ADR-0010 Layer 1 DB CHECK constraint.
  CONSTRAINT org_settings_confidence_threshold_vendor_invoice_range CHECK (
    confidence_threshold_vendor_invoice IS NULL
    OR (confidence_threshold_vendor_invoice >= 0 AND confidence_threshold_vendor_invoice <= 1)
  ),
  CONSTRAINT org_settings_confidence_threshold_receipt_range CHECK (
    confidence_threshold_receipt IS NULL
    OR (confidence_threshold_receipt >= 0 AND confidence_threshold_receipt <= 1)
  ),
  CONSTRAINT org_settings_confidence_threshold_payment_confirmation_range CHECK (
    confidence_threshold_payment_confirmation IS NULL
    OR (confidence_threshold_payment_confirmation >= 0 AND confidence_threshold_payment_confirmation <= 1)
  ),
  CONSTRAINT org_settings_confidence_threshold_ambiguity_margin_range CHECK (
    confidence_threshold_ambiguity_margin IS NULL
    OR (confidence_threshold_ambiguity_margin >= 0 AND confidence_threshold_ambiguity_margin <= 1)
  ),

  -- Layer 1 CHECK: vendor_match_threshold within legal [0, 1] range.
  CONSTRAINT org_settings_vendor_match_threshold_range CHECK (
    vendor_match_threshold >= 0 AND vendor_match_threshold <= 1
  ),

  -- Layer 1 CHECK: ai_fallback_budget positive.
  CONSTRAINT org_settings_ai_fallback_budget_positive CHECK (
    ai_fallback_budget > 0
  ),

  -- Layer 1 CHECK: gc_threshold_hours positive.
  CONSTRAINT org_settings_gc_threshold_hours_positive CHECK (
    gc_threshold_hours > 0
  ),

  -- Layer 1 CHECK: calibration_cadence positive (months) when set.
  CONSTRAINT org_settings_calibration_cadence_positive CHECK (
    calibration_cadence IS NULL OR calibration_cadence > 0
  ),

  -- Layer 1 CHECK: classification_fallback_order non-empty.
  CONSTRAINT org_settings_classification_fallback_order_nonempty CHECK (
    cardinality(classification_fallback_order) > 0
  )
);

-- Lookup index (org_id is PK; no secondary indexes needed at v1).

-- ============================================================
-- RLS policies (org-scoped per chounting convention)
-- ============================================================
-- Pattern parity with adjacent org-scoped tables (vendor_credits,
-- vendor_prepayments, organizations); user_has_org_access(org_id)
-- helper is defined in initial_schema.sql.

ALTER TABLE org_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY org_settings_select ON org_settings
  FOR SELECT USING (user_has_org_access(org_id));
CREATE POLICY org_settings_insert ON org_settings
  FOR INSERT WITH CHECK (user_has_org_access(org_id));
CREATE POLICY org_settings_update ON org_settings
  FOR UPDATE USING (user_has_org_access(org_id));

-- ============================================================
-- Auto-create trigger: row-per-org maintained across org lifecycle
-- ============================================================
-- Ensures every organization has a corresponding org_settings row,
-- both for existing orgs (via backfill below) and for orgs created
-- after this migration lands (via trigger). The trigger preserves
-- the row-per-org v1-active discipline per ADR-0014 §Closes Q73 +
-- ADR-0019 §2 across the dev-seed cycle (DELETE-then-INSERT) and
-- any future org creation paths.

CREATE OR REPLACE FUNCTION public.org_settings_auto_create()
  RETURNS TRIGGER
  LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO org_settings (org_id) VALUES (NEW.org_id)
    ON CONFLICT (org_id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER organizations_create_org_settings
  AFTER INSERT ON organizations
  FOR EACH ROW
  EXECUTE FUNCTION public.org_settings_auto_create();

-- ============================================================
-- Backfill: one row per existing organization
-- ============================================================
-- The 5 NOT NULL DEFAULT columns receive their v1-fixed defaults; the 6
-- NULL-default columns receive NULL (substrate-now-enforcement-later).
-- ON CONFLICT DO NOTHING handles re-running the migration idempotently.

INSERT INTO org_settings (org_id)
  SELECT org_id FROM organizations
  ON CONFLICT (org_id) DO NOTHING;
