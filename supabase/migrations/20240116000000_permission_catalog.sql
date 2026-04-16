-- =============================================================
-- 20240116000000_permission_catalog.sql
-- Phase 1.5C: table-driven permission catalog
-- =============================================================
-- Replaces the ROLE_PERMISSIONS TypeScript map in
-- canUserPerformAction.ts with three seed-populated tables:
--   roles (3 system rows)
--   permissions (16 rows — one per ActionName)
--   role_permissions (22 rows — controller all 16, AP 3, exec 3)
--
-- Also installs user_has_permission() SQL helper for future RLS.
--
-- Verification commands (run before merging):
--   grep "| '" src/services/auth/canUserPerformAction.ts \
--     | grep -v "//\|UserRole\|ap_specialist\|executive\|controller" \
--     | sed "s/.*| '//; s/'.*//" | sort
--   # must return exactly 16 lines matching the INSERT below
--
-- See docs/09_briefs/phase-1.5/1.5C-brief.md §4.1.
-- =============================================================

BEGIN;

-- -----------------------------------------------------------------
-- ROLES
-- -----------------------------------------------------------------

CREATE TABLE roles (
  role_id       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role_key      text UNIQUE NOT NULL,
  display_name  text NOT NULL,
  description   text,
  is_system     boolean NOT NULL DEFAULT true,
  org_id        uuid REFERENCES organizations(org_id),
  sort_order    integer NOT NULL DEFAULT 0,
  created_at    timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT role_system_org_consistency
    CHECK (
      (is_system = true AND org_id IS NULL) OR
      (is_system = false AND org_id IS NOT NULL)
    )
);

CREATE INDEX idx_roles_org ON roles (org_id) WHERE org_id IS NOT NULL;

ALTER TABLE roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY roles_select ON roles
  FOR SELECT TO authenticated USING (
    is_system = true OR user_has_org_access(org_id)
  );

-- -----------------------------------------------------------------
-- PERMISSIONS
-- -----------------------------------------------------------------

CREATE TABLE permissions (
  permission_key  text PRIMARY KEY,
  display_name    text NOT NULL,
  description     text,
  category        text NOT NULL,
  sort_order      integer NOT NULL DEFAULT 0,
  created_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY permissions_select ON permissions
  FOR SELECT TO authenticated USING (true);

-- -----------------------------------------------------------------
-- ROLE_PERMISSIONS (join)
-- -----------------------------------------------------------------

CREATE TABLE role_permissions (
  role_id         uuid NOT NULL REFERENCES roles(role_id) ON DELETE CASCADE,
  permission_key  text NOT NULL REFERENCES permissions(permission_key) ON DELETE CASCADE,
  granted_at      timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (role_id, permission_key)
);

ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY role_permissions_select ON role_permissions
  FOR SELECT TO authenticated USING (true);

-- -----------------------------------------------------------------
-- SEED: 3 system roles
-- -----------------------------------------------------------------

INSERT INTO roles (role_key, display_name, description, is_system, sort_order) VALUES
  ('controller',    'Controller',     'Full access. Manages all accounting, users, and org settings.',  true, 10),
  ('ap_specialist', 'AP Specialist',  'Posts journal entries, reads chart of accounts and AI actions.', true, 20),
  ('executive',     'Executive',      'Read-only across the board. Views reports and audit logs.',      true, 30);

-- -----------------------------------------------------------------
-- SEED: 16 permissions (one per ActionName)
-- -----------------------------------------------------------------

INSERT INTO permissions (permission_key, display_name, category, sort_order) VALUES
  ('journal_entry.post',      'Post journal entries',       'Accounting',    10),
  ('chart_of_accounts.read',  'View chart of accounts',     'Accounting',    20),
  ('chart_of_accounts.write', 'Edit chart of accounts',     'Accounting',    30),
  ('period.lock',             'Lock fiscal periods',        'Accounting',    40),
  ('org.create',              'Create organizations',       'Organization',  50),
  ('audit_log.read',          'View audit log',             'Reports',       60),
  ('ai_actions.read',         'View AI actions',            'Agent',         70),
  ('org.profile.update',      'Update org profile',         'Organization',  80),
  ('org.address.create',      'Add org addresses',          'Organization',  90),
  ('org.address.update',      'Edit org addresses',         'Organization', 100),
  ('org.address.delete',      'Remove org addresses',       'Organization', 110),
  ('org.address.set_primary', 'Set primary address',        'Organization', 120),
  ('user.invite',             'Invite users',               'Users',        130),
  ('user.role.change',        'Change user roles',          'Users',        140),
  ('user.suspend',            'Suspend/reactivate users',   'Users',        150),
  ('user.remove',             'Remove users',               'Users',        160);

-- -----------------------------------------------------------------
-- SEED: role_permissions
-- Controller: all 16. AP Specialist: 3. Executive: 3.
-- -----------------------------------------------------------------

INSERT INTO role_permissions (role_id, permission_key)
SELECT r.role_id, p.permission_key
FROM roles r CROSS JOIN permissions p
WHERE r.role_key = 'controller';

INSERT INTO role_permissions (role_id, permission_key)
SELECT r.role_id, p.permission_key
FROM roles r, permissions p
WHERE r.role_key = 'ap_specialist'
  AND p.permission_key IN ('journal_entry.post', 'chart_of_accounts.read', 'ai_actions.read');

INSERT INTO role_permissions (role_id, permission_key)
SELECT r.role_id, p.permission_key
FROM roles r, permissions p
WHERE r.role_key = 'executive'
  AND p.permission_key IN ('chart_of_accounts.read', 'audit_log.read', 'ai_actions.read');

-- user_has_permission() SQL helper is installed in migration 117
-- (after memberships.role_id exists). It joins
-- memberships.role_id → role_permissions.role_id, so it depends
-- on the column added in that migration.

COMMIT;
