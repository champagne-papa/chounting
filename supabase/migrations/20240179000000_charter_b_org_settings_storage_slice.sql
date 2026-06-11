-- 20240179000000_charter_b_org_settings_storage_slice.sql
--
-- Charter B real-flow arc — D-1: org_settings storage slice (add-consumed-only).
--
-- Adds the v1-CONSUMED columns the reachability change needs:
--   - default_storage_provider — read by resolveStorageProvider (D-2).
--   - sharepoint_site_id / sharepoint_drive_id — read by orgDriveResolver
--     (forward-column read; null = not provisioned until per-org onboarding).
--
-- SCOPE — supersedes charter §4.A "adds all" (append-only): the inert
-- reserved columns (sharepoint_durability_mode / storage_retry_* /
-- preview_url_*) are NOT added here. They are unconsumed in v1 (the
-- provider never branches on durability at the 'none' rung; withRetry uses
-- hardcoded constants; previewUrl has zero callers) and are named as a
-- deferred sub-slice in spec D-1. Same reserve-don't-build-inert discipline
-- as the deferred Zod (carry #1) and the deferred provider_unavailable
-- routing surface (D-5). See spec 2026-06-07-charter-b-real-flow-design.md.
--
-- CHECK naming: default_storage_provider uses the _v1_active scheme (first
-- constraint on a new column), admitting the same v1-active provider set as
-- source_documents._v2_active. Paired with the D-4 Zod admit-set
-- (CHECK-broaden => Zod-broaden).
--
-- Existing org_settings rows (one per org via the 20240158 auto-create
-- trigger + backfill) get default_storage_provider = 'supabase_storage' from
-- the ADD COLUMN NOT NULL DEFAULT — no separate backfill needed.

ALTER TABLE org_settings
  ADD COLUMN default_storage_provider storage_provider
    NOT NULL DEFAULT 'supabase_storage';

ALTER TABLE org_settings
  ADD COLUMN sharepoint_site_id text;

ALTER TABLE org_settings
  ADD COLUMN sharepoint_drive_id text;

ALTER TABLE org_settings
  ADD CONSTRAINT org_settings_default_storage_provider_v1_active
    CHECK (default_storage_provider IN ('supabase_storage', 'sharepoint_drive'));
