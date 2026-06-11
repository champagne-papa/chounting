-- ============================================================
-- Phase 8 chunk 7 — exception_reason Layer 1 CHECK broaden
-- (chunk_7_active → chunk_8_active)
-- ============================================================
-- Framing #2 post-v1 reconciliation orchestrator (brief §2.1 Axis 4).
-- Layer 1 DB CHECK on exception_queue_entries.exception_reason broadens to
-- admit 'bundle_partial_commit_reconciliation_pending' (8th v1-active value).
--
-- The ENUM ADD VALUE lands in the preceding migration 20240160 (separated
-- per Postgres ENUM new-value same-transaction restriction; see that
-- migration's header for the split rationale). This migration's Layer 1
-- CHECK broadening references the new value safely because the preceding
-- migration's transaction has committed before this one runs.
--
-- Per chunk-2-Phase-2 constraint-name sequencing lesson
-- (20240158000000_phase_7_org_settings_substrate.sql lines 20-23): Layer 1
-- CHECK broadens from exception_reason_chunk_7_active →
-- exception_reason_chunk_8_active. Sequential naming preserves the stable
-- `chunk_\d+_active` regex pattern used by Layer 1 CHECK-rejection tests.
--
-- ADR-0010 admit framework + ADR-0022 additive provenance-preserving.
-- Layer 2 item #A ADR amendment paired at substrate-grade ship per Sub-Q9
-- substrate-grade-first (specific ADR-0014 §X consumer-ADR naming deferred
-- to chunk-impl substrate-amendment-pairing per Sub-Q21 Option 21.δ).
-- ============================================================

ALTER TABLE exception_queue_entries
  DROP CONSTRAINT exception_reason_chunk_7_active;

ALTER TABLE exception_queue_entries
  ADD CONSTRAINT exception_reason_chunk_8_active CHECK (
    exception_reason IN (
      'manual_route',
      'low_confidence_classification',
      'unknown_document_type',
      'unmatched_router_candidate',
      'multi_candidate_ambiguity',
      'invariant_violation',
      'ai_fallback_validation_failed',
      'bundle_partial_commit_reconciliation_pending'
    )
  );
