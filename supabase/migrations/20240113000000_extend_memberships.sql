-- =============================================================
-- 20240113000000_extend_memberships.sql
-- Phase 1.5B: membership lifecycle, org owner, RLS helper updates,
-- audit_log.org_id nullable.
-- =============================================================
-- BLAST RADIUS: memberships is read by 6 locations in src/:
--
--   1. src/services/middleware/serviceContext.ts (buildServiceContext)
--   2. src/services/auth/canUserPerformAction.ts
--   3. src/services/auth/getMembership.ts
--   4. src/services/org/membershipService.ts (listForUser)
--   5. src/components/bridge/OrgSwitcher.tsx (browser RLS client)
--   6. supabase/migrations/20240101000000_initial_schema.sql
--      → user_has_org_access() and user_is_controller()
--
-- This migration updates the two SQL helper functions (#6).
-- Files #1-#4 are updated in the service code step (TypeScript).
-- File #5 (OrgSwitcher) goes through RLS which calls the updated
-- helpers — no code change needed, but verify post-migration.
--
-- See docs/09_briefs/phase-1.5/1.5B-brief.md §4.2 for rationale.
-- =============================================================

BEGIN;

-- -----------------------------------------------------------------
-- NEW ENUM
-- -----------------------------------------------------------------

CREATE TYPE membership_status AS ENUM (
  'active',
  'invited',
  'suspended',
  'removed'
);

-- -----------------------------------------------------------------
-- COLUMN ADDITIONS on memberships
-- -----------------------------------------------------------------
-- status gets DEFAULT 'active' so all existing rows are backfilled
-- automatically by Postgres. No explicit UPDATE needed.
-- invited_via is a plain uuid for now; FK added in migration 114
-- after org_invitations table exists.
-- -----------------------------------------------------------------

ALTER TABLE memberships
  ADD COLUMN status           membership_status NOT NULL DEFAULT 'active',
  ADD COLUMN invited_via      uuid,
  ADD COLUMN is_org_owner     boolean NOT NULL DEFAULT false,
  ADD COLUMN suspended_at     timestamptz,
  ADD COLUMN suspended_by     uuid REFERENCES auth.users(id),
  ADD COLUMN removed_at       timestamptz,
  ADD COLUMN removed_by       uuid REFERENCES auth.users(id);

-- -----------------------------------------------------------------
-- PARTIAL UNIQUE INDEX: at most one owner per org
-- -----------------------------------------------------------------

CREATE UNIQUE INDEX idx_memberships_org_owner
  ON memberships (org_id)
  WHERE is_org_owner = true;

-- -----------------------------------------------------------------
-- BACKFILL: in dev seed, the controller for each org becomes owner.
-- Only targets orgs that have exactly one controller (the seed
-- pattern). Production orgs get their owner set by
-- createOrgWithTemplate.
-- -----------------------------------------------------------------

UPDATE memberships SET is_org_owner = true
WHERE role = 'controller'
  AND status = 'active'
  AND org_id IN (
    SELECT org_id FROM memberships
    WHERE role = 'controller' AND status = 'active'
    GROUP BY org_id
    HAVING COUNT(*) = 1
  );

-- -----------------------------------------------------------------
-- NAMED CHECK: owner must be controller
-- -----------------------------------------------------------------

ALTER TABLE memberships
  ADD CONSTRAINT membership_owner_must_be_controller
    CHECK (NOT is_org_owner OR role = 'controller');

-- -----------------------------------------------------------------
-- UPDATE RLS HELPER FUNCTIONS to filter status = 'active'.
--
-- CREATE OR REPLACE overwrites the Phase 1.1 definitions. The only
-- change is one new AND clause. Both functions keep SECURITY DEFINER,
-- STABLE, SET search_path = '' posture.
--
-- After this, every existing RLS policy that calls these helpers
-- automatically excludes suspended/removed memberships — no policy
-- SQL changes needed.
-- -----------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.user_has_org_access(target_org_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.memberships
    WHERE user_id = auth.uid()
      AND org_id = target_org_id
      AND status = 'active'
  );
$$;

CREATE OR REPLACE FUNCTION public.user_is_controller(target_org_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.memberships
    WHERE user_id = auth.uid()
      AND org_id = target_org_id
      AND role = 'controller'
      AND status = 'active'
  );
$$;

-- -----------------------------------------------------------------
-- AUDIT_LOG.ORG_ID: make nullable (OQ-04 RESOLVED 2026-04-15).
-- Login/logout audit rows carry org_id = NULL because they are
-- user events, not org events.
-- -----------------------------------------------------------------

ALTER TABLE audit_log ALTER COLUMN org_id DROP NOT NULL;

COMMIT;
