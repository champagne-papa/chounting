-- 20240178000000_charter_b_sharepoint_provider_admission.sql
--
-- Charter B (a) Task 5 — admit sharepoint_drive in the storage_provider
-- Layer-1 CHECKs.
--
-- Gated by the ADR-0013 2026-06-07 universal-default amendment (the
-- amendment named exactly this as a "named-not-done" go-live dep:
-- "Widen the source_documents and source_document_versions v1-active
-- storage_provider CHECK to admit sharepoint_drive"). The
-- sharepoint_drive enum value already exists (migration 20240135);
-- only these two reserved-enum-state CHECKs pinned writes to
-- supabase_storage.
--
-- Constraint naming: the existing constraints use the `_v`-version
-- scheme (`_v1_active`), not the `_chunk_N_active` scheme. The linear
-- continuation under the `_v`-scheme is `_v2_active` (the v-scheme
-- analog of the _chunk_N_active -> _chunk_{N+1}_active convention in
-- conventions/migrations.md "Versioned-CHECK constraint naming"). No
-- test pins the constraint name (verified: only a comment reference in
-- 20240137 RPC migration); dependent tests insert supabase_storage rows
-- which the broadened CHECK still admits.
--
-- No types regen: CHECK constraints are not reflected in db/types.ts
-- (the column is already the storage_provider enum type).

ALTER TABLE source_documents
  DROP CONSTRAINT source_documents_storage_provider_v1_active;
ALTER TABLE source_documents
  ADD CONSTRAINT source_documents_storage_provider_v2_active
    CHECK (storage_provider IN ('supabase_storage', 'sharepoint_drive'));

ALTER TABLE source_document_versions
  DROP CONSTRAINT source_document_versions_storage_provider_v1_active;
ALTER TABLE source_document_versions
  ADD CONSTRAINT source_document_versions_storage_provider_v2_active
    CHECK (storage_provider IN ('supabase_storage', 'sharepoint_drive'));
