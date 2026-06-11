-- =============================================================
-- 20240162000000_phase_8_chunk_8_role_permissions_payment_record.sql
-- Phase 8 chunk 8 (framing #3 cross-service orchestrators):
-- payment.record permission for the cross-service payment-recording action.
-- =============================================================
-- Adds 1 new permission. Named consumer: paymentService.record() — the
-- payment-flow primitive consumed directly by the document-ingestion
-- orchestrator (ingestDocument.ts record_bill_payment + born_paid bundle
-- record-payment-child binding sites) and by postV1ReconciliationOrchestrator
-- (Phase 8 chunk 7 consumer #2). Seeding 'payment.record' resolves the
-- (μ) sub-grain N=8 placeholder where those binding sites used
-- 'bill.record_payment' because 'payment.record' was not yet seeded.
--
-- Role grants (operational accounting; mirrors bill.record_payment per
-- Finding 5): payment.record → controller + ap_specialist (NOT executive).
--
-- Sort_order placement: Accounting, sort_order 22 — next within the AP/Spend
-- Accounting group after bill.record_payment=20 and bill.reverse=21.
-- sort_order is category-scoped display ordering (global max is 170 in the
-- User Management group), not a globally-unique counter.
--
-- Catalog count impact:
--   permissions:       29 -> 30 (+1)
--   role_permissions:  controller +1 + ap_specialist +1 (+2)
--
-- Migration-slot note: brief §2.1/§3.2 cited slot 20240160 OR 20240161 with
-- explicit uncertainty (composed Session 56 @26-ahead). By Session 76
-- impl-onset, chunk 7 (Session 75) shipped the sequential-split pair at
-- 20240160 (ADD VALUE) + 20240161 (CHECK broaden), so chunk 8 targets the
-- next free slot 20240162 per the (EEEE) brief-vs-substrate-state slot
-- resolution.
--
-- Mirror pattern: 20240141000000_bill_record_payment_action_permission.sql.
-- =============================================================

BEGIN;

INSERT INTO permissions (permission_key, display_name, category, sort_order) VALUES
  ('payment.record', 'Record payments', 'Accounting', 22);

INSERT INTO role_permissions (role_id, permission_key)
SELECT r.role_id, p.permission_key
FROM roles r, permissions p
WHERE r.role_key IN ('controller', 'ap_specialist')
  AND p.permission_key = 'payment.record';

COMMIT;
