# Phase 6 — Ingestion

Phase 6 ships the ingestion-channel substrate (`ingest_batches`,
`source_documents.ingest_batch_id` activation, `document_jobs`
anticipatory schema) and the v1 manual-walkable ingestion service
for drag-drop + forwarded_mailbox channels. Reading B per the
Phase 6 / Phase 7 demarcation: substrate + ingestion path land
at Phase 6; orchestrator runtime defers to Phase 7 per
ADR-0014:1249 ("the pipeline ships in Phase 7"). Scope-locked
2026-05-15; in progress.

## Sub-buckets present

- `plans/` — Phase 6 ingestion execution plan (2026-05-15 design
  summary + 3-chunk decomposition: 6.1 substrate, 6.2 drag-drop,
  6.3 forwarded_mailbox + closeout).

## Closeout artifacts

Pending — Phase 6 retrospective ships at chunk 6.3 close.
Retrospective will consolidate the 8 RI candidate flags surfaced
during 2026-05-15 scope-lock (six from scope-lock rounds:
drag_drop_pdf vs direct_upload semantic gap;
ADR-named-not-yet-shipped substrate pattern; document_jobs ↔
ingest_items overlap at Phase 7; document_cases.state ↔
document_jobs.state overlap at Phase 7; column-grain vs
table-grain "land schema with consumer code" discipline; Phase 6
vs Phase 7 division-of-labor on document_case_sources writes;
two from verify-from-disk side-channel: substrate-citation gap
in document_platform_initiative.md:771-776; plans/ sub-bucket
lifecycle undocumented at ADR-0021 §4 level) plus any new flags
surfaced during implementation.
