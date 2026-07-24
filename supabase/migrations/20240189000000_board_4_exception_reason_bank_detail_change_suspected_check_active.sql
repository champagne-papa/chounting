-- ============================================================
-- Board #4 Fork C — exception_reason Layer 1 CHECK broaden
-- (exception_reason_chunk_10_active → chunk_11_active)
-- ============================================================
-- Admits 'bank_detail_change_suspected' as the 11th v1-active
-- exception_reason value (board #4 Fork C handler #2; see 20240188 for the
-- detect-and-route / Tier-2-read-boundary provenance). The ENUM value landed
-- in 20240188 (a separate transaction, per the Postgres ALTER TYPE ADD VALUE
-- restriction); this CHECK references it safely because that transaction has
-- committed before this runs.
--
-- Sequential naming (chunk_10_active → chunk_11_active) preserves the stable
-- `chunk_\d+_active` regex used by the Layer-1 CHECK-rejection tests
-- (migrations.md "Versioned-CHECK constraint naming (linear chunk suffix)").
--
-- ADR-0010 admit framework + ADR-0022 additive provenance-preserving.
-- ============================================================

ALTER TABLE exception_queue_entries
  DROP CONSTRAINT exception_reason_chunk_10_active;

ALTER TABLE exception_queue_entries
  ADD CONSTRAINT exception_reason_chunk_11_active CHECK (
    exception_reason IN (
      'manual_route',
      'low_confidence_classification',
      'unknown_document_type',
      'unmatched_router_candidate',
      'multi_candidate_ambiguity',
      'invariant_violation',
      'ai_fallback_validation_failed',
      'bundle_partial_commit_reconciliation_pending',
      'multi_invoice',
      'duplicate_invoice_suspected',
      'bank_detail_change_suspected'
    )
  );
