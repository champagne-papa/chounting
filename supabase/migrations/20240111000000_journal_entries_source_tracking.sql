-- =============================================================
-- 20240111000000_journal_entries_source_tracking.sql
-- Phase 1.5A: granular integration-source tracking
-- =============================================================
-- The existing 'source' enum (manual, agent, import) remains the
-- coarse classifier. Two new columns add integration-level
-- granularity for Phase 2 reconciliation (Flinks, Plaid, Stripe,
-- Xero migration, CSV imports, etc.):
--
--   source_system       text NOT NULL  — free-text integration id
--   source_external_id  text           — id in that source system
--
-- Partial unique index prevents double-ingestion of the same
-- external transaction. NULL source_external_id is ignored by the
-- index (manual entries produce no external id).
--
-- Two-step backfill (add nullable → populate from source::text →
-- SET NOT NULL) is the same disciplined pattern migration 109 uses.
-- See docs/09_briefs/phase-1.5/brief.md §4.4 for rationale.
-- =============================================================

BEGIN;

-- -----------------------------------------------------------------
-- STEP 1: add new columns (nullable for the backfill window).
-- -----------------------------------------------------------------

ALTER TABLE journal_entries
  ADD COLUMN source_system       text,
  ADD COLUMN source_external_id  text;

-- -----------------------------------------------------------------
-- STEP 2: backfill source_system from the existing source enum.
-- Cast is lossless: 'manual' → 'manual', 'agent' → 'agent',
-- 'import' → 'import'. Any future new enum value would extend this
-- mapping automatically because ::text is enum-label-exact.
-- -----------------------------------------------------------------

UPDATE journal_entries
SET source_system = source::text
WHERE source_system IS NULL;

-- -----------------------------------------------------------------
-- STEP 3: flip source_system to NOT NULL and add the non-blank
-- CHECK. If the backfill missed any rows, this fails and the
-- whole migration rolls back — do not ship a nullable
-- source_system into production.
-- -----------------------------------------------------------------

ALTER TABLE journal_entries
  ALTER COLUMN source_system SET NOT NULL,
  ADD CONSTRAINT source_system_not_blank
    CHECK (length(trim(source_system)) > 0);

-- -----------------------------------------------------------------
-- STEP 4: partial unique index.
-- A (org_id, source_system, source_external_id) triple may only
-- appear once when source_external_id IS NOT NULL. Entries with
-- source_external_id = NULL (every pre-1.5A row, every manual
-- entry) are skipped by the index and may occur in any quantity.
-- Note: the index intentionally binds source_system (text), not
-- the coarse source (enum).
-- -----------------------------------------------------------------

CREATE UNIQUE INDEX idx_je_source_external
  ON journal_entries (org_id, source_system, source_external_id)
  WHERE source_external_id IS NOT NULL;

COMMIT;
