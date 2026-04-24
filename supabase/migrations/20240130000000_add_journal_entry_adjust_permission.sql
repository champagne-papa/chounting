-- =============================================================
-- 20240130000000_add_journal_entry_adjust_permission.sql
-- Phase 0-1.1 Control Foundations Step 9:
-- journal_entry.adjust permission for adjusting-entry posting
-- =============================================================
-- Adds the journal_entry.adjust permission for the new
-- adjusting-entry branch of journalEntryService.post introduced
-- in Step 9a. Controller-only grant; mirrors the inline-seed
-- pattern established by Step 3's
-- 20240124000000_add_period_unlock_permission.sql.
--
-- Permission placement:
--   Accounting category, sort_order 11 — immediately after
--   journal_entry.post (sort_order 10) and before
--   chart_of_accounts.read (sort_order 20). Orders permissions
--   in the catalog so journal_entry.post and journal_entry.adjust
--   sit together in permission-catalog UIs.
--
-- Catalog count impact:
--   permissions:       18 → 19
--   role_permissions:  26 → 27 (controller gets the new grant;
--                               ap_specialist and executive
--                               unchanged at 4 each).
--
-- Parity:
--   CA-27 (permissionParity.test.ts) passes automatically once
--   ACTION_NAMES carries 'journal_entry.adjust' alongside this
--   seed (added in the same commit).
--   CA-28 (permissionCatalogSeed.test.ts) hardcoded counts are
--   bumped from 18 to 19 in the same commit per the Permission
--   Catalog Count Drift convention (conventions.md).
--
-- Brief §4 Step 11 framing notes (D9-F ratification):
--   Brief framed Step 11 as "consolidated permissions migration
--   seeding rows for Step 3/9/10 actions." Step 3 already
--   shipped its seed inline at 20240124000000; aligning with
--   that shipped pattern here per D9-F (F1). Step 12 doc-sync
--   queue item 15 reconciles the brief framing with reality;
--   Step 11's scope becomes Step 10's permission seeds only
--   (or shrinks to a doc-only cleanup if Step 10 also ships
--   inline).
-- =============================================================

BEGIN;

INSERT INTO permissions (permission_key, display_name, category, sort_order)
VALUES ('journal_entry.adjust', 'Post adjusting journal entries', 'Accounting', 11);

INSERT INTO role_permissions (role_id, permission_key)
SELECT r.role_id, 'journal_entry.adjust'
FROM roles r
WHERE r.role_key = 'controller';

COMMIT;
