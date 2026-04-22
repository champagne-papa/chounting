-- =============================================================
-- 20240124000000_add_period_unlock_permission.sql
-- Phase 1.x Phase B Prompt 4: add period.unlock permission
-- =============================================================
-- Adds the period.unlock permission for the new
-- periodService.unlock() method introduced in Phase B Prompt 4.
-- Controller-only grant, matching period.lock's pattern from
-- migration 116 (sort_order 40). period.unlock slots at
-- sort_order 41 immediately after period.lock in the Accounting
-- category.
--
-- Catalog count impact:
--   permissions:       17 → 18
--   role_permissions:  25 → 26 (controller gets the new grant;
--                               ap_specialist and executive
--                               unchanged at 4 each).
--
-- Parity:
--   CA-27 (permissionParity.test.ts) passes automatically once
--   ACTION_NAMES carries 'period.unlock' alongside this seed.
--   CA-28 and CA-37 hardcoded counts are bumped in the same
--   commit per the Permission Catalog Count Drift convention
--   (conventions.md:110).
-- =============================================================

BEGIN;

INSERT INTO permissions (permission_key, display_name, category, sort_order)
VALUES ('period.unlock', 'Unlock fiscal periods', 'Accounting', 41);

INSERT INTO role_permissions (role_id, permission_key)
SELECT r.role_id, 'period.unlock'
FROM roles r
WHERE r.role_key = 'controller';

COMMIT;
