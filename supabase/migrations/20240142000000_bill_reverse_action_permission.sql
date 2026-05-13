-- =============================================================
-- 20240142000000_bill_reverse_action_permission.sql
-- Phase 5 chunk B5-3-D6: bill.reverse permission for the bill
-- reversal write-side UI.
-- =============================================================
-- Adds 1 new permission per ADR-0015 Spend subdomain.
--
-- Role grants (correction action; SoD axis):
--   bill.reverse  → controller only (NOT ap_specialist — reverse
--                   is a correction action that mutates a posted
--                   ledger entry; restricted to controller per
--                   separation-of-duties).
--
-- Sort_order placement: Accounting, sort_order 21
-- (After bill.record_payment at 20.)
--
-- Catalog count impact:
--   permissions:       28 → 29 (+1)
--   role_permissions:  38 → 39 (+1; controller +1)
--
-- Mirror pattern: 20240141000000_bill_record_payment_action_permission.sql
-- (single-permission inline seed alongside the consuming chunk).
-- =============================================================

BEGIN;

INSERT INTO permissions (permission_key, display_name, category, sort_order) VALUES
  ('bill.reverse', 'Reverse bills', 'Accounting', 21);

INSERT INTO role_permissions (role_id, permission_key)
SELECT r.role_id, p.permission_key
FROM roles r, permissions p
WHERE r.role_key = 'controller'
  AND p.permission_key = 'bill.reverse';

COMMIT;
