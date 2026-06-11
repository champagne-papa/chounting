-- 20240174000000_wave_6_d2_1_document_cases_state_check_broaden.sql
--
-- Wave 6 D2.1 T1 — document_cases.state Layer-1 CHECK broaden:
-- document_cases_state_chunk_7_active → document_cases_state_chunk_8_active,
-- admitting 'extracting'.
--
-- D2.1 wires the pipeline orchestrator to advance case state through the
-- ADR-0011 §3 legal matrix (received → extracting → classified → …) before
-- Subsystem-2 routing (Wave 6 build plan §5 D2.1, closure (B)).
-- 'extracting' becomes a persisted intermediate state. 'committed' and
-- 'archived' remain reserved at Layer 1.
--
-- Constraint name continues the linear chunk-number suffix
-- (chunk_1 → chunk_2 → chunk_6 → chunk_7 → chunk_8) per the versioned-CHECK
-- naming discipline CODIFIED AT THIS EVENT — the second cross-phase
-- CHECK-broaden event, the deferred-codification trigger named in
-- 20240150's header (R2.3, phase-4 chunk-2 brief). Canonical:
-- docs/04_engineering/conventions/migrations.md
-- §"Versioned-CHECK constraint naming (linear chunk suffix)".
--
-- Zod lockstep (Layer 2): DocumentCaseStateSchema
-- (apps/web/src/shared/schemas/document-platform/documentCase.schema.ts)
-- mirrors this admission set verbatim and broadens in the same commit.

ALTER TABLE document_cases
  DROP CONSTRAINT document_cases_state_chunk_7_active;

ALTER TABLE document_cases
  ADD CONSTRAINT document_cases_state_chunk_8_active
  CHECK (state IN (
    'received',
    'proposed',
    'approved',
    'rejected',
    'needs_review',
    'classified',
    'matched',
    'extracting'
  ));
