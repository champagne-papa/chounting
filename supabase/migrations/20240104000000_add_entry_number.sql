-- 004_add_entry_number.sql
-- Sequential entry numbering per org per period.
-- Auditors require sequential references; UUIDs are not acceptable.
--
-- NULLABLE in this migration. Task 9 (journalEntryService.post upgrade)
-- populates the column on every INSERT, then a follow-up step in Task 9
-- sets NOT NULL + UNIQUE after the service is verified. This two-step
-- approach avoids breaking the test suite between Tasks 3 and 9 — the
-- service doesn't yet supply entry_number, so NOT NULL here would cause
-- INSERT failures in Tests 1, 2, and 5.

ALTER TABLE journal_entries
  ADD COLUMN entry_number bigint;

-- Backfill any existing rows in creation order:
UPDATE journal_entries je SET entry_number = sub.rn
FROM (
  SELECT journal_entry_id,
         ROW_NUMBER() OVER (
           PARTITION BY org_id, fiscal_period_id
           ORDER BY created_at
         ) AS rn
  FROM journal_entries
) sub
WHERE je.journal_entry_id = sub.journal_entry_id;

-- NOT NULL and UNIQUE constraint are added in Task 9 after
-- journalEntryService.post is updated to populate entry_number.
