-- ============================================================
-- Board #4 slice-2 — exception_reason Layer 1 CHECK broaden
-- (exception_reason_chunk_8_active → chunk_9_active)
-- ============================================================
-- Admits 'multi_invoice' as the 9th v1-active exception_reason value — the
-- accurate reason for a multi-invoice case routed to needs_review (board #4;
-- see the preceding ADD VALUE migration 20240182 for the provenance
-- rationale). The ENUM value landed in that preceding migration (a separate
-- transaction, per the Postgres ALTER TYPE ADD VALUE restriction); this CHECK
-- references it safely because that transaction has committed before this runs.
--
-- Sequential naming (chunk_8_active → chunk_9_active) preserves the stable
-- `chunk_\d+_active` regex used by the Layer-1 CHECK-rejection tests
-- (migrations.md "Versioned-CHECK constraint naming (linear chunk suffix)").
--
-- ADR-0010 admit framework + ADR-0022 additive provenance-preserving.
-- ============================================================

ALTER TABLE exception_queue_entries
  DROP CONSTRAINT exception_reason_chunk_8_active;

ALTER TABLE exception_queue_entries
  ADD CONSTRAINT exception_reason_chunk_9_active CHECK (
    exception_reason IN (
      'manual_route',
      'low_confidence_classification',
      'unknown_document_type',
      'unmatched_router_candidate',
      'multi_candidate_ambiguity',
      'invariant_violation',
      'ai_fallback_validation_failed',
      'bundle_partial_commit_reconciliation_pending',
      'multi_invoice'
    )
  );
