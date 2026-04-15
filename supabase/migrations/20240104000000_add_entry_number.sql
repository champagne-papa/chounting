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

-- NOT NULL and UNIQUE constraint added in Task 9 Phase B after
-- journalEntryService.post verified to populate entry_number on
-- every INSERT, and test helpers updated to supply the column.
ALTER TABLE journal_entries
  ALTER COLUMN entry_number SET NOT NULL;

-- Discipline backstop, not a standalone invariant.
-- This UNIQUE constraint is the "retroactive collision detector" for
-- the no-FOR-UPDATE entry-number allocation pattern documented in the
-- Transaction Isolation section of docs/02_specs/ledger_truth_model.md.
-- It is deliberately NOT promoted to its own INV-ID: the actual rule
-- the codebase cares about is sequentiality (entries numbered 1, 2, 3...)
-- not uniqueness (which is what UNIQUE enforces). The Transaction
-- Isolation section explicitly distinguishes "discipline" from
-- "invariant" and classifies this constraint as a discipline backstop
-- for a deliberately race-prone read-then-write pattern. See that
-- section for the three-reason rationale (READ COMMITTED + targeted
-- row locks vs SERIALIZABLE).
ALTER TABLE journal_entries
  ADD CONSTRAINT unique_entry_number_per_org_period
  UNIQUE (org_id, fiscal_period_id, entry_number);
