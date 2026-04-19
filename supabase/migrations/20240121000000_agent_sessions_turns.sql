-- =============================================================
-- 20240121000000_agent_sessions_turns.sql
-- Phase 1.2 Session 7 Commit 3 (Pre-decision 14):
-- Correctness-driven scoped exception to Session 7's "no
-- migrations" discipline, identically justified to migration
-- 120's Pre-decision 3 exception. Adds the structured turns
-- column required by Pre-decision 8's mount-time conversation
-- fetch.
--
-- The existing agent_sessions.conversation JSONB carries
-- Anthropic-format messages and is read by the orchestrator as
-- Claude's message context (unchanged contract). The new turns
-- column carries the client-facing ChatTurn array consumed by
-- the /api/agent/conversation GET endpoint. Clean separation:
-- conversation for Claude, turns for the UI.
--
-- Purely additive. Existing readers of conversation are
-- unaffected. Existing rows default to turns = '[]' — the
-- /api/agent/conversation endpoint runs a reconstruction
-- fallback on empty-turns rows (Option B parse of the stored
-- Anthropic messages) with a logged warning so pre-migration
-- sessions surface visibly in Phase 1.3 friction logs.
-- =============================================================

BEGIN;

ALTER TABLE agent_sessions
  ADD COLUMN turns jsonb NOT NULL DEFAULT '[]'::jsonb;

COMMIT;
