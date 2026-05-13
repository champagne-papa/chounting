-- =============================================================
-- 20240144000000_document_cases_transition.sql
-- Phase 2 chunk 2 — state CHECK broaden + atomic UPDATE-with-audit RPC.
--
-- Per ADR-0011 §3 (case state machine, human-only transitions
--                  walkable in Phase 2 substrate-only world) +
--     ADR-0010   (reserved-enum three-layer defense: Layer 1
--                  broadens incrementally; Layers 2-3 added in
--                  the service + schema layer) +
--     docs/02_specs/ledger_truth_model.md INV-AUDIT-001 leaf.
--
-- Layer 1 enforcement at chunk 2: state CHECK broadens to
-- {received, proposed, approved, rejected}. Reserved 6 states
-- (extracting, classified, matched, needs_review, committed,
-- archived) stay in the enum type but CHECK-rejected. The
-- needs_review state is deliberately deferred — its exit
-- transitions are §13 (exception queue) terrain, not yet
-- semantically defined. Chunk 6 broadens to include it.
--
-- Anti-scope (NOT in chunk 2):
--   - needs_review source-state transitions (chunk 6).
--   - Automation-driven transitions (Phase 4 / 7 / 8).
--   - Idempotency key handling on transitions.
-- =============================================================

-- Broaden the state CHECK constraint (DROP + ADD; rename for
-- chunk traceability).
ALTER TABLE document_cases
  DROP CONSTRAINT document_cases_state_chunk_1_active;

ALTER TABLE document_cases
  ADD CONSTRAINT document_cases_state_chunk_2_active
  CHECK (state IN ('received', 'proposed', 'approved', 'rejected'));

-- Atomic UPDATE-with-audit RPC (INV-AUDIT-001 leaf).
-- Mirrors chunk 1's create_document_case_with_audit shape;
-- single-purpose per chunk-zero adjudication (one RPC per
-- mutation type — generalization would push state-machine
-- guards into plpgsql which belongs in the service).
CREATE OR REPLACE FUNCTION update_document_case_state_with_audit(
  p_case_id      UUID,
  p_target_state document_case_state,
  p_audit        JSONB
) RETURNS UUID AS $$
DECLARE
  v_before_state document_case_state;
BEGIN
  -- Capture the prior state for audit_log.before_state.
  -- FOR UPDATE locks the row to serialize concurrent transitions
  -- on the same case_id — without the lock, two concurrent callers
  -- could read the same v_before_state and produce two audit rows
  -- both claiming the same prior state, when only one UPDATE wins.
  -- Mirrors enforce_period_not_locked precedent in the initial schema.
  SELECT state INTO v_before_state
  FROM document_cases
  WHERE id = p_case_id
  FOR UPDATE;

  IF v_before_state IS NULL THEN
    RAISE EXCEPTION 'document_case % not found', p_case_id
      USING ERRCODE = 'no_data_found';
  END IF;

  -- UPDATE the state. The Layer 1 CHECK constraint rejects
  -- p_target_state values outside the v1-active subset.
  UPDATE document_cases
  SET state = p_target_state
  WHERE id = p_case_id;

  -- Paired audit INSERT in same transaction. Column list +
  -- NULLIF wrapping mirrors chunk 1's RPC verbatim. The only
  -- chunk-2 specific column is before_state, which captures
  -- the prior state value as JSON for round-trip traceability.
  INSERT INTO audit_log (
    org_id, user_id, trace_id, action, entity_type, entity_id,
    before_state, after_state_id, tool_name, idempotency_key, reason
  )
  VALUES (
    NULLIF(p_audit->>'org_id', '')::uuid,
    NULLIF(p_audit->>'user_id', '')::uuid,
    (p_audit->>'trace_id')::uuid,
    p_audit->>'action',
    p_audit->>'entity_type',
    p_case_id,
    jsonb_build_object('state', v_before_state::text),
    NULLIF(p_audit->>'after_state_id', '')::uuid,
    p_audit->>'tool_name',
    NULLIF(p_audit->>'idempotency_key', '')::uuid,
    p_audit->>'reason'
  );

  RETURN p_case_id;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER;

GRANT EXECUTE ON FUNCTION update_document_case_state_with_audit(UUID, document_case_state, JSONB)
  TO service_role;
