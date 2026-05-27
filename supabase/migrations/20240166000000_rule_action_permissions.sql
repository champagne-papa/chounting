-- =============================================================
-- 20240166000000_rule_action_permissions.sql
-- Ring 2A-core Commit 4 (ADR-0025 §9 Decision 9 + §Migration outline).
-- =============================================================
-- Seeds the four rule.* row-action permissions and grants them to
-- controller ONLY — rule governance is controller authority (ADR-0025
-- Decision 9; no ap_specialist / executive grants). Mirrors the
-- 20240140000000_bill_action_permissions.sql inline-seed pattern.
--
-- Catalog count impact:
--   permissions:       30 -> 34 (+4)
--   role_permissions:  controller +4 (+4); ap_specialist/executive unchanged
--                      (total 41 -> 45)
--
-- Count-discipline (Permission Catalog Count Drift convention), all in this
-- same atomic commit:
--   CA-27 (permissionParity.test.ts) — passes automatically once ACTION_NAMES
--     carries the four rule.* keys (canUserPerformAction.ts edit, this commit).
--     It is the set-equality enforcer: ACTION_NAMES+4 without this seed fails it.
--   CA-28 (permissionCatalogSeed.test.ts) — total 30->34 + controller 30->34.
--     ap_specialist (7) / executive (4) exact-sets unchanged (rule.* controller-only).
--   CA-37 (crossOrgRlsIsolation.test.ts) — permissions 30->34, role_permissions 41->45.
--
-- 'Rules' is a new permission category (permissions.category is free-form text,
-- no CHECK constraint — verified at HEAD); sort_order is category-scoped, not a
-- globally-unique counter (per 20240162 note).
-- =============================================================

BEGIN;

INSERT INTO permissions (permission_key, display_name, category, sort_order) VALUES
  ('rule.promote', 'Promote rule', 'Rules', 10),
  ('rule.demote',  'Demote rule',  'Rules', 20),
  ('rule.rename',  'Rename rule',  'Rules', 30),
  ('rule.retire',  'Retire rule',  'Rules', 40);

-- Controller only (rule governance is controller authority; ADR-0025 Decision 9).
INSERT INTO role_permissions (role_id, permission_key)
SELECT r.role_id, p.permission_key
FROM roles r, permissions p
WHERE r.role_key = 'controller'
  AND p.permission_key IN ('rule.promote', 'rule.demote', 'rule.rename', 'rule.retire');

COMMIT;
