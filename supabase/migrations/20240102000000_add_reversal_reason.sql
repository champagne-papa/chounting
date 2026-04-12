-- 002_add_reversal_reason.sql
-- Adds the reversal_reason column to journal_entries per ADR-001.
-- The column is nullable at the column level but guarded by a CHECK:
-- any entry with reverses_journal_entry_id must have a non-empty reason.

ALTER TABLE journal_entries
  ADD COLUMN reversal_reason text;

ALTER TABLE journal_entries
  ADD CONSTRAINT reversal_reason_required_when_reversing
  CHECK (
    reverses_journal_entry_id IS NULL
    OR (reversal_reason IS NOT NULL AND length(trim(reversal_reason)) > 0)
  );
