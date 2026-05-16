-- =========================================================
-- Phase 4 chunk 3 — Subsystem 3 (Re-Evaluation Logic): T1/T3/T5/T8/T10
-- dispatcher substrate.
--
-- Closes ADR-0018 §item 4 three-subsystem decomposition (Subsystem 1
-- shipped at chunk 1 / 6f3c2ad; Subsystem 2 shipped at chunk 2 /
-- 8c036be; this migration ships Subsystem 3 substrate). Framing F:
-- T1/T3/T5/T8/T10 v1-active-emission-wired; T2/T4/T6 reserved per
-- "land schema with consumer code" pending paymentService.ts +
-- vendorCreditService.ts future Phase 5 amendment.
--
-- Migration scope:
--   1. CHECK rename exception_status_chunk_6_active →
--      exception_status_chunk_8_active admitting 'cancelled' per
--      Round 4.a (α-iii) arc-extended-lifecycle-sequence codification.
--      Phase 2 chunks 1-6 = positions 1-6; Phase 4 chunk 1 skipped
--      (used _v1_active); Phase 4 chunk 2 = position 7; this chunk =
--      position 8. Closes chunk-2-Phase-4 retrospective inventory
--      item 7 (Layer 1 CHECK suffix discipline codification).
--   2. reject_invalid_exception_status_transition trigger function
--      rewrite with second IF clause forbidding cancelled → other
--      (mirror of chunk-6 resolved → terminal one-way rule).
--      Per-source-state error messaging preserved.
--   3. New RPC cancel_exception_with_audit(p_entry_id, p_audit)
--      — atomic UPDATE exception_status='open'→'cancelled' + audit
--      row emission. Service-layer 23514 check_violation → maps to
--      EXCEPTION_ALREADY_CANCELLED at the service boundary.
--      Mirrors chunk-6 enqueue_exception_with_audit + resolve_
--      exception_with_audit patterns (SELECT FOR UPDATE parent-
--      derived org_id + state-transition-guarded UPDATE +
--      RAISE check_violation on guard failure + single audit row).
--      The _with_audit suffix is retained per F-J-ε (mutating RPC,
--      not pure-audit).
--
-- Test-stable constraint name regex: /exception_status_chunk_\d+_active/
-- per chunk-2 + chunk-6 codified discipline (4.e-α grep sweep at
-- impl onset confirmed all 9 existing test assertions already use
-- this stable pattern).
--
-- Forward-pointing comment: pre_commit_link_rerouted audit event
-- (ADR-0016 §6 line 1037) is a 10-field cascade-payload event
-- capturing prior + new linked-entity 3-tuples; reserved for a
-- future chunk per "land schema with consumer code" reverse-
-- discipline. The decision_outcome field on router_re_evaluation_
-- fired (this chunk's audit event introduced at service layer per
-- ADR-0018 §Schema-deltas; emitted via recordMutation) captures
-- the coarse "re-route happened" semantic; a future chunk wires
-- the fine-grained prior→new entity coordinates per ADR-0016 §6
-- when the cascade-payload construction logic ships.
-- =========================================================

-- ---------------------------------------------------------
-- 1. CHECK rename — admits 'cancelled' v1-active terminal.
-- ---------------------------------------------------------
-- chunk-6 v1-active CHECK was (open, resolved); chunk-3
-- broadens to (open, resolved, cancelled) under (α-iii) arc-
-- extended-lifecycle-sequence position 8 suffix.
ALTER TABLE exception_queue_entries
  DROP CONSTRAINT exception_status_chunk_6_active;

ALTER TABLE exception_queue_entries
  ADD CONSTRAINT exception_status_chunk_8_active
  CHECK (exception_status IN ('open', 'resolved', 'cancelled'));


-- ---------------------------------------------------------
-- 2. Trigger function rewrite — cancelled-is-terminal symmetry.
-- ---------------------------------------------------------
-- chunk-6 originally rejected only resolved → other transitions
-- (resolved-is-terminal). chunk-3 activates 'cancelled' as a
-- second terminal state per ADR-0018 Subsystem 3 contract
-- (re-enqueue produces a NEW entry, not a transition from
-- cancelled; chunk-6 partial UNIQUE index (document_case_id)
-- WHERE exception_status='open' correctly admits fresh enqueue
-- after cancellation). The trigger function extends with a
-- second IF clause forbidding cancelled → other; per-source-
-- state error messaging preserved (mirror-framing in error text
-- documents the symmetry to operators reading audit logs).
--
-- ERRCODE convention: feature_not_supported on both clauses
-- mirrors chunk-6's existing chosen ERRCODE for the resolved →
-- other rejection. The cancel_exception_with_audit RPC's WHERE-
-- clause guard uses check_violation per chunks-2/6 state-machine
-- UPDATE convention (see §3 below); the trigger function and
-- the RPC guard serve different defense layers (trigger fires
-- against bad direct UPDATEs that attempt cancelled→other; RPC
-- guard fires the typed error on cancel-against-non-open-row).
CREATE OR REPLACE FUNCTION reject_invalid_exception_status_transition()
RETURNS TRIGGER AS $$
BEGIN
  -- chunk-6: resolved is terminal one-way.
  IF OLD.exception_status = 'resolved' AND NEW.exception_status IS DISTINCT FROM 'resolved' THEN
    RAISE EXCEPTION 'exception_queue_entries.exception_status transition resolved → % is forbidden (one-way per ADR-0011 §13 chunk-6 semantics); resolution is permanent', NEW.exception_status
      USING ERRCODE = 'feature_not_supported';
  END IF;

  -- chunk-3: cancelled is terminal one-way (mirror of chunk-6 resolved).
  IF OLD.exception_status = 'cancelled' AND NEW.exception_status IS DISTINCT FROM 'cancelled' THEN
    RAISE EXCEPTION 'cancelled is terminal per ADR-0018 Subsystem 3 contract; cancelled → % is forbidden (mirrors chunk-6 resolved → % one-way rule)', NEW.exception_status, NEW.exception_status
      USING ERRCODE = 'feature_not_supported';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- ---------------------------------------------------------
-- 3. cancel_exception_with_audit RPC.
-- Atomic: UPDATE queue entry (status open→cancelled) +
-- INSERT audit_log. org_id derived via subquery from
-- exception_queue_entries' own org_id column (chunk-6 row
-- carries it). Mirrors chunk-6 enqueue/resolve RPC patterns.
-- ---------------------------------------------------------
CREATE OR REPLACE FUNCTION cancel_exception_with_audit(
  p_entry_id UUID,
  p_audit    JSONB
) RETURNS UUID AS $$
DECLARE
  v_before_status    exception_status;
  v_document_case_id UUID;
  v_org_id           UUID;
BEGIN
  -- Capture prior state + parent-derived org_id.
  -- FOR UPDATE locks the row to serialize concurrent dispatcher
  -- calls on the same entry (mirrors chunk-6 resolve_exception_
  -- with_audit pattern).
  SELECT exception_status, document_case_id, org_id
    INTO v_before_status, v_document_case_id, v_org_id
  FROM exception_queue_entries
  WHERE exception_queue_entry_id = p_entry_id
  FOR UPDATE;

  IF v_org_id IS NULL THEN
    RAISE EXCEPTION 'exception_queue_entry % not found', p_entry_id
      USING ERRCODE = 'no_data_found';
  END IF;

  -- State-transition guard: atomic UPDATE with WHERE
  -- exception_status='open'. If status has drifted to 'resolved'
  -- or 'cancelled' (concurrent dispatch or manual resolve), the
  -- UPDATE matches zero rows. RAISE check_violation maps to
  -- EXCEPTION_ALREADY_CANCELLED at the service boundary.
  -- Mirrors chunks-2/6 state-machine UPDATE convention.
  UPDATE exception_queue_entries
  SET exception_status = 'cancelled'
  WHERE exception_queue_entry_id = p_entry_id AND exception_status = 'open';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'exception_queue_entry % not in open status (current: %)', p_entry_id, v_before_status
      USING ERRCODE = 'check_violation';
  END IF;

  -- Emit mutation audit row (caller-constructed action verb +
  -- entity_type; RPC-constructed 2-field before_state).
  INSERT INTO audit_log (
    org_id, user_id, trace_id, action, entity_type, entity_id,
    before_state, after_state_id, tool_name, idempotency_key, reason
  )
  VALUES (
    v_org_id,
    NULLIF(p_audit->>'user_id', '')::uuid,
    (p_audit->>'trace_id')::uuid,
    p_audit->>'action',                   -- 'exception_cancelled'
    p_audit->>'entity_type',              -- 'exception_queue_entry'
    p_entry_id,
    jsonb_build_object(
      'exception_status', v_before_status::text,
      'document_case_id', v_document_case_id
    ),
    p_entry_id,
    p_audit->>'tool_name',
    NULLIF(p_audit->>'idempotency_key', '')::uuid,
    p_audit->>'reason'
  );

  RETURN p_entry_id;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER;

GRANT EXECUTE ON FUNCTION cancel_exception_with_audit(UUID, JSONB) TO service_role;
