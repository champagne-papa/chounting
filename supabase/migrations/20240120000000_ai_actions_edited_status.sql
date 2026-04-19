-- =============================================================
-- 20240120000000_ai_actions_edited_status.sql
-- Phase 1.2 Session 7 Commit 2 (Pre-decision 3):
-- Agent-Ladder correctness scoped exception to Session 7's
-- "no migrations" discipline. Two ALTERs, purely additive,
-- fully backward-compatible.
--
-- 1. Add 'edited' to ai_action_status enum. Required so
--    approval_rate = approved / (approved + not_approved) has
--    a well-defined denominator in Phase 1.3 trust calibration
--    (docs/02_specs/agent_autonomy_model.md §Promotion).
--    Without this value, edit-and-replace is indistinguishable
--    from plain rejection and rule promotion cannot compute.
--
-- 2. Rename rejection_reason → resolution_reason. The column
--    now serves three terminal states (rejected, edited, stale),
--    not just rejection. Blast radius grep-verified at draft
--    (2026-04-19): 1 code file (src/db/types.ts, 3 type
--    references), 0 tests, 0 production consumers.
-- =============================================================

BEGIN;

ALTER TYPE ai_action_status ADD VALUE IF NOT EXISTS 'edited';

ALTER TABLE ai_actions RENAME COLUMN rejection_reason TO resolution_reason;

COMMIT;
