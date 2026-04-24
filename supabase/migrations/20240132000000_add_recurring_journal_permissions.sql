-- =============================================================
-- 20240132000000_add_recurring_journal_permissions.sql
-- Phase 0-1.1 Control Foundations Step 10a:
-- Inline permission seed for recurring-journals actions
-- =============================================================
-- Adds six controller-only permissions for the recurring-journals
-- feature landing in Step 10a. Matches the inline-seed precedent
-- established by Step 3 (20240124000000_add_period_unlock_permission.sql)
-- and Step 9a (20240130000000_add_journal_entry_adjust_permission.sql)
-- per D10-E (A) ratification.
--
-- Permissions (all controller-only, Accounting category):
--   recurring_template.create       — sort_order 12
--   recurring_template.update       — sort_order 13
--   recurring_template.deactivate   — sort_order 14
--   recurring_run.generate          — sort_order 15
--   recurring_run.approve           — sort_order 16
--   recurring_run.reject            — sort_order 17
--
-- Catalog count impact:
--   permissions:       19 → 25 (+6)
--   role_permissions:  27 → 33 (+6; controller only)
--
-- Parity:
--   CA-27 (permissionParity.test.ts) passes automatically once
--   ACTION_NAMES carries the six new action names alongside
--   this seed (added in the same commit).
--   CA-28 (permissionCatalogSeed.test.ts) hardcoded counts must
--   be bumped to 25 / 33 in the same commit per the Permission
--   Catalog Count Drift convention.
--
-- Brief §4 Step 11 framing notes (D10-E ratification):
--   Brief originally framed Step 11 as a consolidated
--   permissions migration seeding rows for Steps 3/9/10 actions
--   (20240130000000_control_foundation_permissions.sql). Steps 3
--   and 9a already shipped their seeds inline; Step 10a ships
--   its own here per the established precedent. Step 11 becomes
--   doc-sync only (Step 12 queue item 15).
-- =============================================================

BEGIN;

INSERT INTO permissions (permission_key, display_name, category, sort_order) VALUES
  ('recurring_template.create',     'Create recurring journal templates',       'Accounting', 12),
  ('recurring_template.update',     'Edit recurring journal templates',         'Accounting', 13),
  ('recurring_template.deactivate', 'Deactivate recurring journal templates',   'Accounting', 14),
  ('recurring_run.generate',        'Generate recurring journal runs',          'Accounting', 15),
  ('recurring_run.approve',         'Approve and post recurring journal runs',  'Accounting', 16),
  ('recurring_run.reject',          'Reject recurring journal runs',            'Accounting', 17);

INSERT INTO role_permissions (role_id, permission_key)
SELECT r.role_id, p.permission_key
FROM roles r, permissions p
WHERE r.role_key = 'controller'
  AND p.permission_key IN (
    'recurring_template.create',
    'recurring_template.update',
    'recurring_template.deactivate',
    'recurring_run.generate',
    'recurring_run.approve',
    'recurring_run.reject'
  );

COMMIT;
