-- =============================================================
-- 20240129000000_adjustment_status_enum.sql
-- Phase 0-1.1 Control Foundations Step 9:
-- Adjustment status reserved-enum-states affordance
-- =============================================================
-- Adds:
--   - adjustment_status enum type with four values:
--     'posted', 'pending_approval', 'approved', 'rejected'.
--     Phase 1 writes only 'posted'; the other three are
--     reserved for Phase 2 maker-checker workflow.
--   - journal_entries.adjustment_status column NOT NULL
--     DEFAULT 'posted'.
--   - Scoped CHECK forbidding non-'posted' values on adjusting
--     rows — the Phase 1 reserved-state defense at the DB.
--
-- Reserved-enum-states discipline (ADR-0010):
--   The four enum values are schema-ready for Phase 2's
--   maker-checker workflow without requiring a migration when
--   Phase 2 activates. Phase 2 loosens the scoped CHECK (or
--   drops it entirely) to permit pending_approval/approved/
--   rejected state transitions. No existing-row backfill is
--   needed — every Phase 1 row has adjustment_status='posted'
--   by the NOT NULL DEFAULT, which remains a valid terminal
--   state under Phase 2 semantics.
--
-- Three-layer Phase 1 defense per ADR-0010 §Decision:
--   Layer 1 (this migration): scoped CHECK restricting
--     non-'posted' values. DB is authoritative guard.
--   Layer 2 (Zod): AdjustmentInputSchema rejects any client
--     override of adjustment_status via z.undefined().optional()
--     — no client path can submit a reserved state.
--   Layer 3 (service): journalEntryService.post omits the
--     column from INSERT on the adjusting branch; the DEFAULT
--     handles assignment. No write path emits non-'posted'.
--
-- Retroactive ADR-0010 consumer:
--   entry_type 'closing' was reserved in migration
--   20240105000000_add_entry_type.sql before ADR-0010 codified
--   the discipline. 'closing' has never been written by any
--   Phase 1 code path — structurally the same pattern applied
--   informally. ADR-0010 §Context cites 'closing' as the
--   founding (pre-codification) example.
--
-- Scope of this migration's CHECK:
--   The constraint fires only on rows where entry_type =
--   'adjusting'. Non-adjusting entries default to 'posted' and
--   the CHECK predicate is trivially true for them. The scope
--   matches the discriminator that motivates the reservation:
--   only adjusting entries carry workflow semantics in the
--   planned Phase 2.
--
-- Cross-references:
--   - brief §3.2 (adjustment_status schema approval-ready)
--   - brief §3.4 (ADR-B framing — reserved-enum-states)
--   - brief §6 (discipline backstop registration, Step 12)
--   - ADR-0010 (shared discipline statement; this migration
--     is the first deliberate consumer)
--   - 20240105000000_add_entry_type.sql (retroactive consumer
--     of the same pattern — 'closing' value)
--   - 20240128000000_add_adjustment_reason.sql (sibling Step 9
--     migration)
-- =============================================================

BEGIN;

CREATE TYPE adjustment_status AS ENUM (
  'posted',
  'pending_approval',
  'approved',
  'rejected'
);

ALTER TABLE journal_entries
  ADD COLUMN adjustment_status adjustment_status NOT NULL DEFAULT 'posted';

ALTER TABLE journal_entries
  ADD CONSTRAINT adjustment_status_posted_in_phase_1
  CHECK (
    entry_type <> 'adjusting' OR adjustment_status = 'posted'
  );

COMMENT ON CONSTRAINT adjustment_status_posted_in_phase_1
  ON journal_entries IS
  'Reserved-enum-states Phase 1 defense (ADR-0010). Forbids non-posted values on adjusting rows. Loosen via CHECK modification when Phase 2 maker-checker workflow activates pending_approval/approved/rejected states. No existing-row backfill needed at Phase 2 cutover — every Phase 1 row is posted by default.';

COMMENT ON COLUMN journal_entries.adjustment_status IS
  'Reserved-enum-states (ADR-0010). Phase 1 writes only posted. pending_approval/approved/rejected reserved for Phase 2 maker-checker workflow.';

COMMIT;
