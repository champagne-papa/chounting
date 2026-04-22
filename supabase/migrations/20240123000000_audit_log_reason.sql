-- =============================================================
-- 20240123000000_audit_log_reason.sql
-- Phase 1.x Phase B Prompt 4: add audit_log.reason column
-- =============================================================
-- Adds a nullable `reason` TEXT column to audit_log for carrying
-- the human-entered rationale on mutations like period.locked and
-- period.unlocked. The column is nullable because prior mutation
-- types (journal_entry.post, org.profile_updated, address writes,
-- membership changes) have no equivalent explanation — they are
-- described fully by action + before_state + after_state.
--
-- The column is additive:
--   - Backfills as NULL for all existing rows.
--   - Downstream consumers (audit log reader, Phase 2 projection
--     worker) treat it as optional.
--   - INV-AUDIT-002 (Layer 1a) append-only enforcement already
--     covers the whole row, so the new column inherits
--     permanence automatically — no trigger changes needed.
--
-- Cross-reference: INV-AUDIT-001 (Layer 2) leaf in
-- docs/02_specs/ledger_truth_model.md — the before_state capture
-- convention paragraph already allows services to pass domain-
-- specific audit fields like `reason`; this migration adds the
-- column that carries it.
-- =============================================================

BEGIN;

ALTER TABLE audit_log ADD COLUMN reason TEXT;

COMMIT;
