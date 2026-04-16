-- =============================================================
-- 20240117000000_memberships_role_id.sql
-- Phase 1.5C: two-step role_id backfill + user_has_permission()
-- =============================================================
-- Same discipline as 1.5A industry_id: add nullable → backfill
-- from legacy enum via roles.role_key bridge → SET NOT NULL.
-- Legacy role enum column stays until follow-up migration.
--
-- BLAST RADIUS: every file that inserts into memberships needs
-- to write both role AND role_id during the cutover window:
--   src/services/org/orgService.ts (createOrgWithTemplate)
--   src/services/org/invitationService.ts (acceptInvitation)
--   src/services/org/membershipService.ts (changeUserRole)
--   src/db/seed/dev.sql
--   tests that directly insert/update memberships.role
--
-- Also installs user_has_permission() (moved from migration 116
-- because it depends on memberships.role_id).
-- =============================================================

BEGIN;

-- Step 1: add role_id nullable
ALTER TABLE memberships ADD COLUMN role_id uuid REFERENCES roles(role_id);

-- Step 2: backfill via the role_key bridge
UPDATE memberships m
SET role_id = r.role_id
FROM roles r
WHERE r.role_key = m.role::text
  AND r.is_system = true
  AND m.role_id IS NULL;

-- Step 3: flip to NOT NULL
ALTER TABLE memberships ALTER COLUMN role_id SET NOT NULL;

CREATE INDEX idx_memberships_role_id ON memberships (role_id);

-- The existing membership_owner_must_be_controller CHECK uses the
-- legacy role column: NOT is_org_owner OR role = 'controller'.
-- During the cutover both columns are populated, so the CHECK
-- fires correctly. When the legacy column is dropped (Phase 1.6
-- or Phase 2), replace with a role_id-based version. No change now.

-- -----------------------------------------------------------------
-- SQL HELPER: user_has_permission()
-- Relocated from migration 116 — depends on memberships.role_id.
-- Same posture as user_has_org_access and user_is_controller:
-- SECURITY DEFINER, STABLE, SET search_path = ''.
-- Available for new RLS policies; existing policies NOT rewritten.
-- -----------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.user_has_permission(
  target_org_id uuid,
  target_permission_key text
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.memberships m
    JOIN public.role_permissions rp ON rp.role_id = m.role_id
    WHERE m.user_id = auth.uid()
      AND m.org_id = target_org_id
      AND m.status = 'active'
      AND rp.permission_key = target_permission_key
  );
$$;

REVOKE ALL ON FUNCTION public.user_has_permission(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.user_has_permission(uuid, text) TO authenticated;

COMMIT;
