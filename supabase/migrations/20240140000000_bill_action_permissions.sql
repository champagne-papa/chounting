-- =============================================================
-- 20240140000000_bill_action_permissions.sql
-- Phase 5 chunk B5-3-D3 substantive session #1:
-- bill.post + bill.approve permissions for AP write-side UI chunk
-- =============================================================
-- Adds 2 new permissions per ADR-0015 Spend subdomain + chunk B5-3-D3
-- onset triangulation (founder Item 1 ratification + plan-doc-grain
-- role-key disposition D3.4: 'accountant' semantic mapped to disk-grounded
-- 'ap_specialist' role_key).
--
-- Role grants (separation-of-duties posture per spend brief §11):
--   bill.post     → ap_specialist + controller (operational accounting)
--   bill.approve  → controller only (separation: who-posts ≠ who-approves)
--
-- Sort_order placement:
--   bill.post     — Accounting, sort_order 18
--   bill.approve  — Accounting, sort_order 19
--   (After recurring_run.reject at 17; before any subsequent Accounting
--   additions. Verified at task-start grain: next-available slots are
--   18 and 19 — no migrations shipped between recon and implementation
--   that would have claimed these slots.)
--
-- Catalog count impact:
--   permissions:       25 → 27 (+2)
--   role_permissions:  +3 (controller: +2; ap_specialist: +1)
--
-- Parity:
--   CA-27 (permissionParity.test.ts) passes automatically once
--   ACTION_NAMES carries 'bill.post' + 'bill.approve' alongside
--   this seed (added in the same commit; see canUserPerformAction.ts
--   edit in this commit).
--   CA-28 (permissionCatalogSeed.test.ts) hardcoded counts bumped
--   from 25 to 27 in the same commit per the Permission Catalog
--   Count Drift convention (conventions.md).
--
-- Mirror pattern: 20240130000000_add_journal_entry_adjust_permission.sql
-- + 20240132000000_add_recurring_journal_permissions.sql (inline seed
-- alongside the chunk that consumes the ActionName).
-- =============================================================

BEGIN;

INSERT INTO permissions (permission_key, display_name, category, sort_order) VALUES
  ('bill.post',    'Post bills',                'Accounting', 18),
  ('bill.approve', 'Approve bills for payment', 'Accounting', 19);

-- Controller gets both (full access role)
INSERT INTO role_permissions (role_id, permission_key)
SELECT r.role_id, p.permission_key
FROM roles r, permissions p
WHERE r.role_key = 'controller'
  AND p.permission_key IN ('bill.post', 'bill.approve');

-- AP specialist gets bill.post only (separation-of-duties: operational
-- accounting can create bills; only controller approves for payment)
INSERT INTO role_permissions (role_id, permission_key)
SELECT r.role_id, p.permission_key
FROM roles r, permissions p
WHERE r.role_key = 'ap_specialist'
  AND p.permission_key = 'bill.post';

COMMIT;
