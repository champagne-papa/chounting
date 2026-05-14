-- =============================================================
-- 20240150000000_document_relationship_router_resolution.sql
-- Phase 4 chunk 2 — Subsystem 2 (Ambiguity Resolution) substrate:
-- CHECK broaden + head-pointer FK activation + two new RPCs.
--
-- Per ADR-0018 §item 3 (Subsystem 2 — Ambiguity Resolution; the
--                  Router's three-subsystem decomposition; this
--                  chunk implements branches a/b/c at substrate-
--                  mutation level with envelope-less v1 substrate-
--                  collapse: branch (b) routes through chunk-6's
--                  exception queue identically to branch (c),
--                  differing only in exception_reason) +
--     ADR-0018 §item 1 (three-subsystem decomposition;
--                  Subsystem 1 shipped at chunk 1, Subsystem 3
--                  deferred to chunks 3+) +
--     ADR-0011 §3 (document_case_state matrix; chunk-2-Phase-4
--                  broadens v1-active admit set to add 'matched'
--                  for the classified → matched transition) +
--     ADR-0010 (substrate-now-enforcement-later; chunk-1-Phase-2
--                  reserved current_relationship_candidate_id
--                  bare column; chunk-2-Phase-4 is the consumer-
--                  chunk that activates the FK constraint) +
--     ADR-0019 (Confidence Calibration Policy; at-decision-time
--                  ambiguity_margin_threshold captured in audit
--                  decision-record row for forensic invariance
--                  per §13; document_type stratification key per
--                  §9 row 1).
--
-- First cross-phase substrate modification at chunks-1-6 (per
-- F-J-θ): Phase 4 chunk modifies Phase 2 substrate. Two deltas:
-- (1) Layer 1 CHECK broaden on document_cases.state (chunk-6
-- 6-state admit set → chunk-2-Phase-4 7-state admit set adding
-- 'matched'). Constraint rename document_cases_state_chunk_6_active
-- → document_cases_state_chunk_7_active reflects linear chunk-
-- number suffix sequence (provisional; full cross-phase naming
-- discipline codification deferred to second cross-phase CHECK-
-- broaden event per R2.3 + retrospective inventory item 7).
-- (2) Head-pointer FK activation on
-- document_cases.current_relationship_candidate_id with
-- ON DELETE RESTRICT mirroring chunk-1-Phase-4 immutable-spine
-- convention (candidates are REVOKE'd from service_role for DELETE
-- + RLS DELETE USING(false); RESTRICT is effectively inert at v1
-- but documents the relationship + defense-in-depth under future
-- substrate changes that permit candidate deletion).
--
-- Two new RPCs implementing the three-branch decision contract:
-- - set_case_head_pointer_with_audit (branch a, atomic):
--   substrate mutation (head pointer + state transition
--   classified → matched) co-emitted with two audit rows in
--   single transaction. State-transition guard mirrors chunk-6's
--   enqueue RPC: UPDATE ... WHERE state='classified' / IF NOT FOUND
--   RAISE check_violation; 23514 maps to INVALID_TRANSITION at
--   the service boundary. Establishes the Router-subsystem
--   head-pointer-mutation RPC-name family (Subsystem 3 will extend
--   with supersede_case_head_pointer_with_audit at chunks 3+).
-- - record_router_decision (branches b/c, pure-audit): emits the
--   decision-record audit row only; no substrate mutation at this
--   RPC level. The state transition (classified → needs_review)
--   for branches (b)/(c) is owned by chunk-6's
--   enqueue_exception_with_audit RPC, invoked via cross-service
--   call from the service layer. Pure-audit RPC suffix-drop per
--   F-J-ε: the audit IS the operation; _with_audit suffix would
--   be degenerate. RETURNING audit_log_id INTO v_audit_id returns
--   the just-emitted audit row's PK for service-side observability
--   (audit_log_id column per 20240101000000_initial_schema.sql:485).
--
-- Split p_audit params on branch (a) RPC per F-J-δ: first instance
-- at chunks-1-6 of two-structurally-distinct-audit-rows-per-RPC
-- pattern. p_audit_decision carries caller-constructed 10-field
-- DecisionRecordBeforeState JSONB (branch, candidate_set_ids,
-- confidence_scores, top/runner_up_confidence, margin computed +
-- threshold, winner_candidate_id, exception_reason, document_type).
-- p_audit_mutation carries metadata only — RPC constructs the
-- 2-field {state, current_relationship_candidate_id} before_state
-- JSONB itself via SELECT ... FOR UPDATE on document_cases
-- (mirrors chunk-2-Phase-2's update_document_case_state_with_audit
-- before-state capture pattern; FOR UPDATE serializes concurrent
-- Subsystem 2 invocations on the same case_id).
--
-- audit_log idempotency_key first-instance deliberately-populated
-- at chunks-1-6 per F-J-β: chunks-5-6 services pass null;
-- chunk-2-Phase-4's service constructs deterministic TS-side md5
-- recipe (case_id, trace_id, 'router_decision_recorded') and passes
-- through p_audit_decision.idempotency_key. RPC's existing
-- NULLIF(...)::uuid pass-through (chunks-5-6 convention) carries
-- the value unchanged. audit_log.idempotency_key has no UNIQUE
-- constraint; the recipe is forensic-correlation-not-uniqueness.
-- =============================================================

-- -------------------------------------------------------------
-- (1) CHECK constraint broaden: admit 'matched' state.
-- Linear chunk-number suffix sequence per provisional cross-phase
-- naming discipline (retrospective inventory item 7).
-- -------------------------------------------------------------
ALTER TABLE document_cases
  DROP CONSTRAINT document_cases_state_chunk_6_active;

ALTER TABLE document_cases
  ADD CONSTRAINT document_cases_state_chunk_7_active
  CHECK (state IN (
    'received',
    'proposed',
    'approved',
    'rejected',
    'needs_review',
    'classified',
    'matched'
  ));

-- -------------------------------------------------------------
-- (2) Head-pointer FK activation per ADR-0010 substrate-now-
-- enforcement-later. chunk-1-Phase-2 reserved the bare column
-- (current_relationship_candidate_id uuid, no REFERENCES); this
-- chunk activates FK enforcement. ON DELETE RESTRICT mirrors
-- chunk-1-Phase-4 immutable-spine convention.
-- -------------------------------------------------------------
ALTER TABLE document_cases
  ADD CONSTRAINT document_cases_current_relationship_candidate_id_fk
  FOREIGN KEY (current_relationship_candidate_id)
  REFERENCES document_relationship_candidates(id)
  ON DELETE RESTRICT;

-- -------------------------------------------------------------
-- (3) Branch (a) atomic RPC — set_case_head_pointer_with_audit.
-- Mutates head pointer + transitions state classified → matched
-- + emits 2 audit rows (decision-record + mutation) in single
-- transaction. Split p_audit per F-J-δ (rows are structurally
-- distinct). State-transition guard via UPDATE ... WHERE
-- state='classified' / IF NOT FOUND RAISE check_violation.
-- -------------------------------------------------------------
CREATE OR REPLACE FUNCTION set_case_head_pointer_with_audit(
  p_decision       JSONB,  -- { case_id, winner_candidate_id, trace_id }
  p_audit_decision JSONB,  -- decision-record audit payload (caller-constructed 10-field before_state)
  p_audit_mutation JSONB   -- state+head-pointer mutation audit payload (RPC constructs before_state)
) RETURNS UUID AS $$
DECLARE
  v_case_id             UUID := (p_decision->>'case_id')::uuid;
  v_winner_candidate_id UUID := (p_decision->>'winner_candidate_id')::uuid;
  v_before_state        document_case_state;
  v_before_head_pointer UUID;
BEGIN
  -- Capture prior state + prior head pointer for the mutation
  -- audit row's RPC-constructed before_state. FOR UPDATE locks
  -- the row to serialize concurrent Subsystem 2 invocations on
  -- the same case_id. Mirrors chunk-2-Phase-2's
  -- update_document_case_state_with_audit pattern.
  SELECT state, current_relationship_candidate_id
    INTO v_before_state, v_before_head_pointer
  FROM document_cases
  WHERE id = v_case_id
  FOR UPDATE;

  IF v_before_state IS NULL THEN
    RAISE EXCEPTION 'document_case % not found', v_case_id
      USING ERRCODE = 'no_data_found';
  END IF;

  -- State-transition guard (G1): atomic UPDATE with WHERE
  -- state='classified'. If state has drifted (e.g., already
  -- 'matched' from a concurrent call, or 'needs_review' from
  -- a Subsystem 3 re-routing), the UPDATE matches zero rows.
  -- RAISE check_violation (23514) → INVALID_TRANSITION at
  -- service boundary. Mirrors chunk-6 enqueue RPC guard.
  UPDATE document_cases
  SET state = 'matched',
      current_relationship_candidate_id = v_winner_candidate_id
  WHERE id = v_case_id AND state = 'classified';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'document_case % not in state classified', v_case_id
      USING ERRCODE = 'check_violation';
  END IF;

  -- Row 1: decision-record audit (caller-constructed 10-field
  -- before_state via DecisionRecordBeforeState).
  INSERT INTO audit_log (
    org_id, user_id, trace_id, action, entity_type, entity_id,
    before_state, after_state_id, tool_name, idempotency_key, reason
  )
  VALUES (
    NULLIF(p_audit_decision->>'org_id', '')::uuid,
    NULLIF(p_audit_decision->>'user_id', '')::uuid,
    (p_audit_decision->>'trace_id')::uuid,
    p_audit_decision->>'action',           -- 'router_decision_recorded'
    p_audit_decision->>'entity_type',      -- 'document_case'
    v_case_id,
    p_audit_decision->'before_state',      -- DecisionRecordBeforeState 10-field JSONB
    v_case_id,
    p_audit_decision->>'tool_name',
    NULLIF(p_audit_decision->>'idempotency_key', '')::uuid,
    p_audit_decision->>'reason'
  );

  -- Row 2: state+head-pointer mutation audit (RPC-constructed
  -- 2-field before_state via jsonb_build_object).
  INSERT INTO audit_log (
    org_id, user_id, trace_id, action, entity_type, entity_id,
    before_state, after_state_id, tool_name, idempotency_key, reason
  )
  VALUES (
    NULLIF(p_audit_mutation->>'org_id', '')::uuid,
    NULLIF(p_audit_mutation->>'user_id', '')::uuid,
    (p_audit_mutation->>'trace_id')::uuid,
    p_audit_mutation->>'action',           -- 'document_case_transitioned'
    p_audit_mutation->>'entity_type',      -- 'document_case'
    v_case_id,
    jsonb_build_object(
      'state', v_before_state::text,
      'current_relationship_candidate_id', v_before_head_pointer
    ),
    v_case_id,
    p_audit_mutation->>'tool_name',
    NULLIF(p_audit_mutation->>'idempotency_key', '')::uuid,
    p_audit_mutation->>'reason'
  );

  RETURN v_case_id;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER;

-- -------------------------------------------------------------
-- (4) Branches (b)/(c) pure-audit RPC — record_router_decision.
-- Emits the decision-record audit row only; no substrate
-- mutation. The state transition classified → needs_review is
-- owned by chunk-6's enqueue_exception_with_audit RPC, invoked
-- via cross-service call from the service layer. Pure-audit
-- RPC suffix-drop per F-J-ε.
-- -------------------------------------------------------------
CREATE OR REPLACE FUNCTION record_router_decision(
  p_decision JSONB,
  p_audit    JSONB
) RETURNS UUID AS $$
DECLARE
  v_case_id  UUID := (p_decision->>'case_id')::uuid;
  v_audit_id UUID;
BEGIN
  INSERT INTO audit_log (
    org_id, user_id, trace_id, action, entity_type, entity_id,
    before_state, after_state_id, tool_name, idempotency_key, reason
  )
  VALUES (
    NULLIF(p_audit->>'org_id', '')::uuid,
    NULLIF(p_audit->>'user_id', '')::uuid,
    (p_audit->>'trace_id')::uuid,
    p_audit->>'action',                -- 'router_decision_recorded'
    p_audit->>'entity_type',           -- 'document_case'
    v_case_id,
    p_audit->'before_state',           -- DecisionRecordBeforeState 10-field JSONB
    v_case_id,
    p_audit->>'tool_name',
    NULLIF(p_audit->>'idempotency_key', '')::uuid,
    p_audit->>'reason'
  )
  RETURNING audit_log_id INTO v_audit_id;

  RETURN v_audit_id;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER;

-- -------------------------------------------------------------
-- (5) GRANTs — both RPCs callable by service_role only.
-- -------------------------------------------------------------
GRANT EXECUTE ON FUNCTION set_case_head_pointer_with_audit(JSONB, JSONB, JSONB)
  TO service_role;

GRANT EXECUTE ON FUNCTION record_router_decision(JSONB, JSONB)
  TO service_role;
