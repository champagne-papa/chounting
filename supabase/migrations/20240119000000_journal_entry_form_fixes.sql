-- =============================================================
-- 20240119000000_journal_entry_form_fixes.sql
-- Phase 1.2: UX fixes from journal_entry_form_gaps.md.
--
-- No schema changes. The fixes (fiscal period default, dropdown
-- disabled option, per-line description wiring) are pure
-- front-end. This migration exists so the sequence is contiguous
-- and the change is discoverable via `supabase migration list`.
--
-- See docs/09_briefs/phase-1.2/brief.md §4.2.
-- =============================================================

BEGIN;

-- Intentionally empty.

COMMIT;
