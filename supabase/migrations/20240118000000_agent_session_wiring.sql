-- =============================================================
-- 20240118000000_agent_session_wiring.sql
-- Phase 1.2 Session 1: agent_sessions conversation column,
-- nullable org_id, supporting indexes, user.profile.update seed.
-- See docs/09_briefs/phase-1.2/brief.md §4.1 and §9.1.
-- =============================================================

BEGIN;

-- Issue 3 resolution (master §9.1): onboarding sessions exist
-- before the user creates/joins an org.
ALTER TABLE agent_sessions ALTER COLUMN org_id DROP NOT NULL;

-- Chat transcript column. See master §9.2 for the shape.
ALTER TABLE agent_sessions
  ADD COLUMN conversation jsonb NOT NULL DEFAULT '[]'::jsonb;

-- Orchestrator's per-message session lookup (master §5.2 step 1).
CREATE INDEX IF NOT EXISTS idx_agent_sessions_active
  ON agent_sessions (user_id, org_id, last_activity_at DESC);

-- AI Action Review queue sorted by creation time.
CREATE INDEX IF NOT EXISTS idx_ai_actions_org_created
  ON ai_actions (org_id, created_at DESC)
  WHERE status IN ('pending', 'confirmed');

-- user.profile.update permission row. sort_order 170 continues
-- the 10-step sequence that ended at 160 (user.remove) in
-- migration 116. Category 'Users' matches existing user.* keys.
INSERT INTO permissions (permission_key, display_name, category, sort_order)
VALUES ('user.profile.update', 'Update own user profile', 'Users', 170);

-- All three roles receive the grant (every user may edit their
-- own profile regardless of role). Precedent: ai_actions.read
-- in migration 116 is granted to all three roles.
INSERT INTO role_permissions (role_id, permission_key)
SELECT r.role_id, 'user.profile.update'
FROM roles r
WHERE r.role_key IN ('controller', 'ap_specialist', 'executive');

COMMIT;
