-- =============================================================
-- 20240128000000_add_adjustment_reason.sql
-- Phase 0-1.1 Control Foundations Step 9:
-- Adjusting entries require non-empty adjustment_reason
-- =============================================================
-- Adds:
--   - journal_entries.adjustment_reason text NULL
--   - CHECK constraint enforcing INV-ADJUSTMENT-001:
--     adjusting entries must carry a non-empty reason.
--
-- INV-ADJUSTMENT-001 three-layer defense:
--   - Layer 1 (this migration): DB CHECK rejects inserts/updates
--     that set entry_type='adjusting' AND adjustment_reason is
--     NULL or whitespace-only (length(trim(...)) > 0 is the
--     strict non-empty test — tighter than Zod's .min(1) which
--     is length-only).
--   - Layer 2 (Zod): AdjustmentInputSchema requires
--     adjustment_reason: z.string().min(1). The CHECK is the
--     authoritative stricter guard against whitespace-only
--     values that slip past .min(1).
--   - Layer 3 (service): journalEntryService.post writes the
--     field through from parsed input on the adjusting branch;
--     never synthesizes.
--
-- Non-adjusting entries leave adjustment_reason NULL. The CHECK
-- short-circuits via `entry_type <> 'adjusting'` for them; no
-- constraint burden on the regular/reversing paths.
--
-- `entry_type` enum already contains 'adjusting' from migration
-- 20240105000000_add_entry_type.sql (all four values — regular,
-- adjusting, closing, reversing — shipped in the initial enum
-- definition). No ALTER TYPE needed; the CHECK predicate below
-- can reference 'adjusting' directly without transaction-
-- boundary concerns (state-check D9-D path iii).
--
-- Cross-references:
--   - brief §3.2 (adjusting-entry design, controller-only)
--   - brief §4 Step 9 row (migration 6)
--   - brief §5 (INV-ADJUSTMENT-001 invariant table entry)
--   - ADR-0010 (reserved-enum-states discipline; sibling
--     migration 20240129000000 is ADR-0010's first deliberate
--     consumer, this migration is the same Layer 1 pattern
--     applied to the adjustment_reason requirement).
--   - INV-REVERSAL-002 (parallel discipline — reversal_reason
--     required for reversing entries; same enforcement shape).
-- =============================================================

BEGIN;

ALTER TABLE journal_entries
  ADD COLUMN adjustment_reason text NULL;

ALTER TABLE journal_entries
  ADD CONSTRAINT adjustment_reason_required_for_adjusting
  CHECK (
    entry_type <> 'adjusting'
    OR (adjustment_reason IS NOT NULL AND length(trim(adjustment_reason)) > 0)
  );

COMMENT ON CONSTRAINT adjustment_reason_required_for_adjusting
  ON journal_entries IS
  'INV-ADJUSTMENT-001: adjusting entries require non-empty adjustment_reason. Layer 1 of three-layer defense (DB CHECK + Zod + service). length(trim(...)) > 0 is stricter than Zod .min(1) — whitespace-only fails here.';

COMMIT;
