-- =============================================================
-- 20240167000000_rule_create_permission.sql
-- Ring 2A-authoring (ADR-0026 Decision 7 + Migration outline, amended 2026-05-29).
-- =============================================================
-- Seeds the rule.create permission and grants it to controller ONLY — rule
-- governance is controller authority (ADR-0025 Decision 9; no ap_specialist /
-- executive grants). Mirrors the 20240166000000_rule_action_permissions.sql
-- inline-seed pattern. The POST /api/orgs/[orgId]/rules create route authorizes
-- via withInvariants({ action: 'rule.create' }); rule.approve is NOT seeded — the
-- POST authorizes as a single rule.create action (the approval ceremony is
-- internal to the create→approve two-step), per ADR-0026 Decision 5/7.
--
-- Catalog count impact:
--   permissions:       34 -> 35 (+1)
--   role_permissions:  controller +1; ap_specialist / executive unchanged
--                      (total 45 -> 46)
--
-- Count-discipline (Permission Catalog Count Drift convention), all in this
-- same atomic commit:
--   CA-27 (permissionParity.test.ts) — passes automatically once ACTION_NAMES
--     carries 'rule.create' (canUserPerformAction.ts edit, this commit). It is
--     the set-equality enforcer: ACTION_NAMES+1 without this seed fails it.
--   CA-28 (permissionCatalogSeed.test.ts) — total 34->35 + controller 34->35.
--     ap_specialist (7) / executive (4) exact-sets unchanged (rule.create
--     controller-only).
--   CA-37 (crossOrgRlsIsolation.test.ts) — permissions 34->35, role_permissions
--     45->46.
--
-- 'Rules' category already exists (seeded by 20240166); sort_order is
-- category-scoped — rule.create sorts at 5 (before the lifecycle actions
-- promote/demote/rename/retire at 10/20/30/40, since creation precedes
-- lifecycle management). Function-/seed-only; no table-shape change, so no
-- types.ts regen.
-- =============================================================

BEGIN;

INSERT INTO permissions (permission_key, display_name, category, sort_order) VALUES
  ('rule.create', 'Create rule', 'Rules', 5);

-- Controller only (rule governance is controller authority; ADR-0025 Decision 9).
INSERT INTO role_permissions (role_id, permission_key)
SELECT r.role_id, p.permission_key
FROM roles r, permissions p
WHERE r.role_key = 'controller'
  AND p.permission_key = 'rule.create';

COMMIT;
