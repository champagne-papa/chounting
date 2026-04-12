-- 005_add_entry_type.sql
-- IFRS requires distinguishing regular from adjusting/closing/reversing entries.
-- Defaulted to 'regular'; no UI field in Phase 1.1.

CREATE TYPE entry_type AS ENUM (
  'regular',
  'adjusting',
  'closing',
  'reversing'
);

ALTER TABLE journal_entries
  ADD COLUMN entry_type entry_type NOT NULL DEFAULT 'regular';

-- Set existing reversal entries to 'reversing':
UPDATE journal_entries
  SET entry_type = 'reversing'
  WHERE reverses_journal_entry_id IS NOT NULL;
