-- =============================================================
-- 20240141000000_bill_record_payment_action_permission.sql
-- Phase 5 chunk B5-3-D4 substantive session #1:
-- bill.record_payment permission for AP payment-execution write-side UI chunk
-- =============================================================
-- Adds 1 new permission per ADR-0015 Spend subdomain + chunk B5-3-D4
-- onset triangulation (founder Item 2 ratification per spend brief
-- §3.1 + §9.1 + §15 grounding + ap_specialist role description).
--
-- Role grants (operational accounting; mirrors bill.post precedent):
--   bill.record_payment  → ap_specialist + controller
--
-- Sort_order placement: Accounting, sort_order 20
--
-- Catalog count impact:
--   permissions:       27 → 28 (+1)
--   role_permissions:  36 → 38 (+2; controller +1 + ap_specialist +1)
--
-- Mirror pattern: 20240140000000_bill_action_permissions.sql (B5-3-D3
-- session #1 migration; bill.post + bill.approve atomic).
-- =============================================================

BEGIN;

INSERT INTO permissions (permission_key, display_name, category, sort_order) VALUES
  ('bill.record_payment', 'Record bill payments', 'Accounting', 20);

INSERT INTO role_permissions (role_id, permission_key)
SELECT r.role_id, p.permission_key
FROM roles r, permissions p
WHERE r.role_key IN ('controller', 'ap_specialist')
  AND p.permission_key = 'bill.record_payment';

COMMIT;
