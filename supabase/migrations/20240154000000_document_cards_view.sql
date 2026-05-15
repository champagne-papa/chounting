-- =============================================================
-- 20240154000000_document_cards_view.sql
-- Phase 6 chunk 6.2b — document_cards_view (cards endpoint substrate).
--
-- Per chunk 6.2b brief Flag 6 + MF-3 resolution: the cards endpoint
-- needs to flatten document_cases × document_jobs × source_documents
-- × ingest_batches into a single per-card row. Four implementation
-- shapes were considered: (i) chained supabase-js .not() against a
-- nested-JOIN reference (uncertain syntax support); (ii) Postgres
-- view with sentinel filter baked in; (iii) stored procedure; (iv)
-- fetch + app-layer filter. This migration ships (ii) — the view
-- approach — for deterministic shape + symmetric filter discipline.
--
-- The view is the SINGLE source of truth for "per-document card"
-- shape. Both endpoints query the same view:
--   GET /api/orgs/[orgId]/documents/cases?ingest_batch_id=X (list)
--   GET /api/orgs/[orgId]/documents/cases/[caseId]           (detail)
--
-- Per chunk 6.2b brief MF-3 explicit framing: "If (ii) or (iii) shape
-- selected, the migration ships in chunk 6.2b commit (no separate
-- substrate-only commit)." This migration is part of the single
-- chunk 6.2b commit per Path C precedent.
--
-- =============================================================
-- Sub-Q2.2 symmetric filter discipline
--
-- Same JSONB containment expression
-- `channel_metadata @> '{"sentinel": true}'::jsonb` appears at:
--   - Layer 2 Zod ingress (DragDropChannelMetadataSchema in
--     apps/web/src/shared/schemas/document-platform/ingestBatch.schema.ts;
--     .strict() + .refine block rejects sentinel-keyed channel_metadata
--     at write-side)
--   - This view's WHERE clause (read-side filter excludes sentinel-
--     backed rows from operator-facing cards endpoint)
--
-- One sentinel-shape definition, two enforcement sites. If either
-- layer drifts (e.g., narrowing to {"sentinel": true, "migration": 152}
-- which would silently pass m152 fixtures while breaking m153
-- coverage), surface as a Phase 6 regression — symmetric-filter
-- discipline is principle-level.
--
-- Sentinel batches exist as permanent migration substrate (m152 +
-- m153 backfill rows). They are NEVER the result of a new ingestion
-- event; the write-side Zod refusal prevents new sentinel rows, and
-- the read-side filter here excludes historical sentinel rows from
-- operator views. Test plan tests 13 + 14 verify BOTH m152-shape AND
-- m153-shape sentinel fixtures are filtered (Drift 3 acknowledgment).
--
-- =============================================================
-- JOIN topology
--
-- document_cases (chunk-1-Phase-2)
--   ↑ document_jobs.document_case_id (FK; chunk 6.1)
--   ↓ document_jobs.source_document_id (FK; chunk 6.1)
-- source_documents (chunk-1-Phase-1)
--   ↓ source_documents.ingest_batch_id (FK; chunk 6.1 + Step C
--     activated at chunk 6.2a)
-- ingest_batches (chunk 6.1)
--
-- INNER JOIN through document_jobs is the canonical "per-card" link
-- per chunk 6.1 + 6.2b architecture. document_cases pre-chunk-6.1
-- (no document_jobs row) are correctly excluded — they belong to
-- the legacy Phase-2 surface, not the Phase 6 ingestion arc.
--
-- =============================================================
-- RLS inheritance
--
-- Views inherit RLS from underlying tables in Postgres. Without
-- SECURITY DEFINER (default is SECURITY INVOKER for views), the
-- view runs with caller's permissions:
--   - service_role (adminClient at the route handler) BYPASSES RLS.
--     Cards route filters explicitly by org_id in the WHERE clause
--     + checks ctx.caller.org_ids.includes(orgId) before SQL.
--   - authenticated users (via supabaseClient) would see only their
--     org's rows via underlying tables' org-scoped RLS policies
--     (user_has_org_access).
--
-- v1 access path: service_role only (cards route). Future user-
-- direct view access (e.g., direct supabaseClient queries from
-- the browser) inherits the underlying RLS automatically.
--
-- GRANT SELECT to service_role explicitly (idempotent with bypass);
-- GRANT to authenticated for future user-direct access patterns.
-- =============================================================

CREATE OR REPLACE VIEW document_cards_view AS
SELECT
  dc.id              AS case_id,
  dc.org_id          AS org_id,
  dc.state           AS state,
  dc.created_at      AS case_created_at,
  sd.id              AS source_document_id,
  sd.original_filename AS original_filename,
  sd.mime_type       AS mime_type,
  ib.id              AS ingest_batch_id,
  ib.ingest_channel  AS ingest_channel,
  ib.channel_metadata AS channel_metadata,
  ib.received_at     AS received_at
FROM document_cases dc
INNER JOIN document_jobs dj
  ON dj.document_case_id = dc.id
INNER JOIN source_documents sd
  ON sd.id = dj.source_document_id
INNER JOIN ingest_batches ib
  ON ib.id = sd.ingest_batch_id
WHERE NOT (ib.channel_metadata @> '{"sentinel": true}'::jsonb);

COMMENT ON VIEW document_cards_view IS
  'Phase 6 chunk 6.2b cards endpoint substrate. Flattens '
  'document_cases × document_jobs × source_documents × '
  'ingest_batches per-card. Sentinel filter baked in for '
  'symmetric filter discipline (Sub-Q2.2): same JSONB containment '
  'expression as DragDropChannelMetadataSchema write-side rejection. '
  'INNER JOIN through document_jobs is the canonical per-card link '
  'per chunk 6.1 architecture; pre-chunk-6.1 document_cases (no '
  'document_jobs row) are correctly excluded.';

GRANT SELECT ON document_cards_view TO service_role;
GRANT SELECT ON document_cards_view TO authenticated;
