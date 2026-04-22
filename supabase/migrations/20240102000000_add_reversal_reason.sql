-- 002_add_reversal_reason.sql
-- Adds the reversal_reason column to journal_entries per ADR-001.
-- The column is nullable at the column level but guarded by a CHECK:
-- any entry with reverses_journal_entry_id must have a non-empty reason.

ALTER TABLE journal_entries
  ADD COLUMN reversal_reason text;

-- INV-REVERSAL-002 (Layer 1a): reversal entries require a non-empty reason.
-- length(trim(...)) > 0 rejects whitespace-only values, not just NULL.
-- Complement to INV-REVERSAL-001 (Layer 2 mirror check): the mirror
-- rule ensures reversals swap debits/credits correctly; this rule
-- ensures every reversal explains itself. See ADR-001 for the
-- placement rationale (reason lives on journal_entries, not audit_log).
ALTER TABLE journal_entries
  ADD CONSTRAINT reversal_reason_required_when_reversing
  CHECK (
    reverses_journal_entry_id IS NULL
    OR (reversal_reason IS NOT NULL AND length(trim(reversal_reason)) > 0)
  );
