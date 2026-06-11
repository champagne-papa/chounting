-- =============================================================
-- 20240176000000_wave_6_d3_document_cases_state_check_broaden.sql
-- Wave 6 D3 T1 — document_cases.state Layer-1 CHECK broaden:
-- chunk_8 → chunk_9, admitting 'committed'.
-- =============================================================
-- Provenance: D3 brief D-3.1 (LOCKED 2aa3c911). The human
-- approve→post path's honest terminus is case state 'committed'
-- (the INV-WORKFLOW-002 leaf names "a terminal case state
-- (rejected / committed)"; ADR-0011 §3: approved→committed =
-- "automation (ledger commit succeeds)" — D3's approve-post route
-- drives it via the new AUTOMATION_ADVANCE_EDGES entry after
-- journalEntryService.post succeeds under the human's ctx).
--
-- The D2.1 "'committed' is V1-unreachable" parenthetical binds the
-- PIPELINE status (IngestDocumentOutput.status — its appearance on
-- the automation path stays a bleed-stop-regression signal), NOT
-- the case state reached via the human review path.
--
-- 'archived' stays Layer-1-reserved (archival cadence is post-V1).
--
-- Naming: linear chunk suffix (chunk_8 → chunk_9) per the codified
-- convention (docs/04_engineering/conventions/migrations.md
-- §"Versioned-CHECK constraint naming"); dependent tests pin
-- /document_cases_state_chunk_\d+_active/ and pass unmodified.
-- Substrate-mod test-staleness review (same convention file):
-- three rejection probes used 'committed' as the still-reserved
-- state and are re-picked to 'archived' in this T1 commit
-- (documentCaseService.integration.test.ts ×2,
-- documentExceptionService.integration.test.ts ×1) — the re-pick
-- discipline those tests themselves prescribe.
-- =============================================================

ALTER TABLE document_cases
  DROP CONSTRAINT document_cases_state_chunk_8_active;

ALTER TABLE document_cases
  ADD CONSTRAINT document_cases_state_chunk_9_active
  CHECK (state IN (
    'received',
    'proposed',
    'approved',
    'rejected',
    'needs_review',
    'classified',
    'matched',
    'extracting',
    'committed'
  ));
