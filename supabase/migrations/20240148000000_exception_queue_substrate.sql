-- =============================================================
-- 20240148000000_exception_queue_substrate.sql
-- Phase 2 chunk 6 — exception_queue_entries substrate + 3 closed
-- enums + 2 atomic RPCs with parent-derived org_id +
-- document_cases.state CHECK broadening.
--
-- Per ADR-0011 §13 (exception queue first-class deliverable +
--                  resolution_action enum: 17 values per Decision
--                  + 2026-05-08 amendment; 9 v1-active subset)
--                  silent on table schema, exception_status,
--                  exception_reason — chunk 6 invents) +
--     ADR-0011 §3 (document_cases lifecycle: needs_review entry
--                  from classified|matched; exits to matched|
--                  proposed|rejected; chunk 6 broadens to add
--                  needs_review → classified for reprocess
--                  resolution) +
--     ADR-0011 §10 (multi-entity reservation —
--                  wrong_entity_exception is a reserved
--                  exception_reason value, NOT a
--                  resolution_action) +
--     ADR-0011 §15 (INV-DOC-001 evidence-completeness —
--                  invariant_violation is the v1-active
--                  exception_reason for service-path enforcement) +
--     ADR-0013 §5-§6 (drift detection — drift_detected is
--                  reserved per ADR-0010; supabase_storage v1
--                  exempt; no scheduled job; reserved-not-active
--                  matches "named consumer in ratified ADR, no
--                  v1 active emitter" discipline) +
--     ADR-0015 §6 (cross-ADR-named resolution_action pattern;
--                  backfill_vendor_prepayment_suggested ships
--                  as substrate-now-amendment-later reserved
--                  value per ADR-0015 §6 cross-reference at
--                  lines 628/650/1137/1373; ADR-0011 §13
--                  amendment pending in retrospective inventory
--                  item #6 sub-finding 5) +
--     ADR-0018 §3-§4 (cancelled exception_status reserved
--                  consumer is Phase 4 Router T1-T4 firing-
--                  shape — new-domain-entity-posts → Router-
--                  found-match invalidates open exception;
--                  T5/T6 produce/update open exceptions,
--                  don't invalidate) +
--     ADR-0010   (reserved-enum three-layer defense applied
--                  across three enums).
--
-- SCOPE-LOCK DEVIATION (β): chunk 6 ships backfill_vendor_
-- prepayment_suggested as the 9th reserved resolution_action
-- value per ADR-0015 §6 cross-reference; ADR-0011 §13's enum
-- doesn't currently list it. Same trajectory as manual_born_
-- paid_workflow pre-2026-05-08-amendment. Brief commits stay;
-- §13 amendment pending in retrospective inventory item #6.
--
-- §6(a) + §6(b) two-mechanism state mutation control (chunk-5
-- precedent on 1 column; chunk-6 scales to 5):
--   - §6(a) column-level GRANT: REVOKE UPDATE FROM service_role +
--     GRANT UPDATE (exception_status, resolution_action,
--     resolution_notes, resolved_at, resolved_by) — service_role
--     can mutate only the 5 resolution-cycle columns post-INSERT.
--     8 other columns (PK, org_id, document_case_id,
--     source_document_id, exception_reason, trace_id, created_at,
--     created_by) are immutable post-INSERT.
--   - §6(b) column-list trigger: BEFORE UPDATE OF exception_status,
--     rejects resolved → anything regression (one-way). Narrow
--     firing surface; only fires on exception_status transitions.
--   Composition: GRANT enforces "which columns are mutable"
--   (5 cols); trigger enforces "valid transitions on the one-way
--   column" (no resolved → anything). No overlap.
--
-- Partial UNIQUE on (document_case_id) WHERE exception_status =
-- 'open': enforces one-open-per-case-at-a-time; resolved
-- historical rows preserved. Index entry drops automatically
-- when status flips to resolved, allowing legitimate re-enqueue.
-- Case-state ↔ exception-state 1:1 coupling while open.
--
-- Direct org_id RLS: chunks 1-2 substrate-spine convention
-- (NOT chunks 3-5 through-parent). exception_queue_entries is a
-- spine entity (operational unit with own lifecycle), not a
-- join-child. Direct org_id is cheaper at query time than
-- EXISTS-subquery; §13 framing of queue as "bulk of v1's user-
-- visible work" makes UX hot-path RLS performance load-bearing.
--
-- document_cases.state CHECK broadening: _chunk_2_active
-- ('received', 'proposed', 'approved', 'rejected') →
-- _chunk_6_active (+ 'needs_review', 'classified'). Per chunk-2
-- migration line 18 explicit chunk-6 entry point. The
-- LEGAL_TRANSITIONS broadening (needs_review → classified for
-- reprocess) lives at the service layer in
-- documentCaseService.ts; this migration broadens Layer 1 to
-- admit the broadened set as valid v1-active states.
--
-- ADR-0011 §3 extension: §3 transition table doesn't list
-- needs_review → classified; chunk-6 extension flags an
-- ADR-0011 §3 amendment in retrospective inventory item #6
-- sub-finding 4. Doc-drift status auditable via friction-
-- journal entry.
--
-- ON DELETE clauses: document_case_id FK ON DELETE RESTRICT
-- (verified at brief-loop: chunk-1 ships
-- reject_document_cases_delete() BEFORE DELETE trigger at
-- chunk-1 migration lines 134-145; document_cases rows never
-- delete in practice; RESTRICT appropriate). source_document_id
-- FK ON DELETE RESTRICT (Phase 1 reject_source_documents_delete
-- parallel pattern at storage migration line 413+).
--
-- Constraint naming: _chunk_6_active for all three CHECKs.
-- Stable test regex:
--   /(resolution_action|exception_status|exception_reason)_chunk_\d+_active/
-- Partial UNIQUE index: exception_queue_entries_open_per_case_idx
-- (no _chunk_N_active suffix; shape doesn't change across
-- chunks). Stable test regex:
--   /exception_queue_entries_open_per_case_idx/.
--
-- Anti-scope (NOT in chunk 6):
--   - Phase 4 Router T1-T4 cancelled-status emission — Phase 4.
--   - Phase 7 pipeline emission to enqueue — Phase 7.
--   - Phase 5 service-path INV-DOC-001 emission — Phase 5
--     amendment.
--   - Cross-phase resolution_action effects (attach_to_existing
--     _bill → documentLinkService.create, etc.) — consuming
--     services, future chunks.
--   - UI bulk operations, document-type-aware actions,
--     screenshot-gate — UI layer.
-- =============================================================

-- -----------------------------------------------------------
-- resolution_action ENUM (18 values per ADR-0011 §13 Decision +
-- 2026-05-08 amendment + ADR-0015 §6 cross-reference; v1-active
-- subset 9 values enforced via CHECK)
-- -----------------------------------------------------------
CREATE TYPE resolution_action AS ENUM (
  -- v1 active subset (9 values per ADR-0011 §13 Decision-section
  -- + 2026-05-08 amendment):
  'attach_to_existing_bill',
  'attach_to_existing_payment',
  'record_bill_payment',
  'mark_duplicate',
  'mark_non_accounting',
  'route_to_manual_entry',
  'manual_born_paid_workflow',
  'reprocess',
  'archive',
  -- Reserved per ADR-0010 (8 values from ADR-0011 §13):
  'create_bill',
  'create_vendor_prepayment',
  'apply_vendor_prepayment',
  'create_vendor_credit',
  'apply_vendor_credit',
  'request_missing_document',
  'route_to_bank_reconciliation',
  'route_to_AR_future',
  -- Reserved per ADR-0010 (1 value from ADR-0015 §6 cross-
  -- reference at lines 628/650/1137/1373; ADR-0011 §13
  -- amendment pending in retrospective inventory item #6
  -- sub-finding 5):
  'backfill_vendor_prepayment_suggested'
);

-- -----------------------------------------------------------
-- exception_status ENUM (3 values; v1-active subset 2 values
-- enforced via CHECK)
-- -----------------------------------------------------------
CREATE TYPE exception_status AS ENUM (
  -- v1 active (2 values):
  'open',
  'resolved',
  -- Reserved per ADR-0010 (1 value; named Phase 4 consumer per
  -- ADR-0018 §3 Subsystem 3 T1-T4 firing-shape):
  'cancelled'
);

-- -----------------------------------------------------------
-- exception_reason ENUM (8 values; v1-active subset 6 values
-- enforced via CHECK)
-- -----------------------------------------------------------
CREATE TYPE exception_reason AS ENUM (
  -- v1 active (6 values; each with named v1 consumer in
  -- ratified ADR):
  'manual_route',
  'low_confidence_classification',
  'unknown_document_type',
  'unmatched_router_candidate',
  'multi_candidate_ambiguity',
  'invariant_violation',
  -- Reserved per ADR-0010 (2 values; named consumer in ratified
  -- ADR, no v1 active emitter):
  --   wrong_entity_exception — ADR-0011 §10 (multi-entity post-v1)
  --   drift_detected — ADR-0013 §5-§6 (supabase_storage v1 exempt;
  --                    no scheduled job; v1 surface inert)
  'wrong_entity_exception',
  'drift_detected'
);

-- -----------------------------------------------------------
-- exception_queue_entries table — 13 columns, spine entity.
-- Direct org_id (chunks 1-2 convention, NOT chunks 3-5 through-
-- parent). FK ON DELETE RESTRICT to document_cases and
-- source_documents (both parents carry BEFORE DELETE reject
-- triggers; RESTRICT is the natural shape).
-- -----------------------------------------------------------
CREATE TABLE exception_queue_entries (
  exception_queue_entry_id  uuid              PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id                    uuid              NOT NULL REFERENCES organizations(org_id) ON DELETE RESTRICT,
  document_case_id          uuid              NOT NULL REFERENCES document_cases(id) ON DELETE RESTRICT,
  source_document_id        uuid              REFERENCES source_documents(id) ON DELETE RESTRICT,
  exception_reason          exception_reason  NOT NULL,
  exception_status          exception_status  NOT NULL DEFAULT 'open',
  resolution_action         resolution_action,
  resolution_notes          text,
  resolved_at               timestamptz,
  resolved_by               uuid,
  trace_id                  uuid              NOT NULL,
  created_at                timestamptz       NOT NULL DEFAULT NOW(),
  created_by                uuid,

  CONSTRAINT resolution_action_chunk_6_active CHECK (
    resolution_action IS NULL OR resolution_action IN (
      'attach_to_existing_bill',
      'attach_to_existing_payment',
      'record_bill_payment',
      'mark_duplicate',
      'mark_non_accounting',
      'route_to_manual_entry',
      'manual_born_paid_workflow',
      'reprocess',
      'archive'
    )
  ),
  CONSTRAINT exception_status_chunk_6_active CHECK (
    exception_status IN ('open', 'resolved')
  ),
  CONSTRAINT exception_reason_chunk_6_active CHECK (
    exception_reason IN (
      'manual_route',
      'low_confidence_classification',
      'unknown_document_type',
      'unmatched_router_candidate',
      'multi_candidate_ambiguity',
      'invariant_violation'
    )
  )
);

-- -----------------------------------------------------------
-- Partial UNIQUE index: one open exception per case at a time.
-- Index entry drops when status flips to resolved, allowing
-- legitimate re-enqueue. No _chunk_N_active suffix; shape stable
-- across chunks.
-- -----------------------------------------------------------
CREATE UNIQUE INDEX exception_queue_entries_open_per_case_idx
  ON exception_queue_entries (document_case_id)
  WHERE exception_status = 'open';

-- Lookup indexes
CREATE INDEX exception_queue_entries_org_id_idx
  ON exception_queue_entries (org_id);
CREATE INDEX exception_queue_entries_document_case_id_idx
  ON exception_queue_entries (document_case_id);
CREATE INDEX exception_queue_entries_source_document_id_idx
  ON exception_queue_entries (source_document_id);
CREATE INDEX exception_queue_entries_status_open_idx
  ON exception_queue_entries (exception_status)
  WHERE exception_status = 'open';

-- -----------------------------------------------------------
-- 4-policy direct-org_id RLS (chunks 1-2 substrate-spine
-- convention via user_has_org_access(org_id) helper).
-- -----------------------------------------------------------
ALTER TABLE exception_queue_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY exception_queue_entries_select ON exception_queue_entries
  FOR SELECT USING (user_has_org_access(org_id));

CREATE POLICY exception_queue_entries_insert ON exception_queue_entries
  FOR INSERT WITH CHECK (user_has_org_access(org_id));

CREATE POLICY exception_queue_entries_update ON exception_queue_entries
  FOR UPDATE USING (user_has_org_access(org_id))
  WITH CHECK (user_has_org_access(org_id));

CREATE POLICY exception_queue_entries_no_delete ON exception_queue_entries
  FOR DELETE USING (false);

-- -----------------------------------------------------------
-- §6(a) column-level GRANT for service_role (chunk-5 precedent
-- on 1 column; chunk-6 scales to 5 mutable resolution-cycle
-- columns).
-- -----------------------------------------------------------
REVOKE UPDATE ON exception_queue_entries FROM service_role;
REVOKE DELETE ON exception_queue_entries FROM service_role;
GRANT UPDATE (
  exception_status,
  resolution_action,
  resolution_notes,
  resolved_at,
  resolved_by
) ON exception_queue_entries TO service_role;

-- -----------------------------------------------------------
-- §6(b) column-list trigger: BEFORE UPDATE OF exception_status
-- only. Rejects resolved → anything regression (one-way).
-- -----------------------------------------------------------
CREATE OR REPLACE FUNCTION reject_invalid_exception_status_transition()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.exception_status = 'resolved' AND NEW.exception_status IS DISTINCT FROM 'resolved' THEN
    RAISE EXCEPTION 'exception_queue_entries.exception_status transition resolved → % is forbidden (one-way per ADR-0011 §13 chunk-6 semantics); resolution is permanent', NEW.exception_status
      USING ERRCODE = 'feature_not_supported';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_exception_queue_entries_status_one_way
  BEFORE UPDATE OF exception_status ON exception_queue_entries
  FOR EACH ROW
  EXECUTE FUNCTION reject_invalid_exception_status_transition();

-- -----------------------------------------------------------
-- document_cases.state CHECK broadening — chunk-2 → chunk-6.
-- Adds needs_review (per chunk-2 migration line 18 explicit
-- chunk-6 entry point) + classified (for reprocess
-- resolution_action's needs_review → classified target;
-- LEGAL_TRANSITIONS broadening lives at service layer).
-- -----------------------------------------------------------
ALTER TABLE document_cases
  DROP CONSTRAINT document_cases_state_chunk_2_active;

ALTER TABLE document_cases
  ADD CONSTRAINT document_cases_state_chunk_6_active
  CHECK (state IN (
    'received',
    'proposed',
    'approved',
    'rejected',
    'needs_review',
    'classified'
  ));

-- -----------------------------------------------------------
-- enqueue_exception_with_audit RPC.
-- Atomic: INSERT queue entry + UPDATE document_case state
-- (classified|matched → needs_review) + INSERT audit_log.
-- org_id derived via subquery from document_cases (chunk-3+
-- canonical pattern).
-- -----------------------------------------------------------
CREATE OR REPLACE FUNCTION enqueue_exception_with_audit(
  p_entry JSONB,
  p_audit JSONB
) RETURNS UUID AS $$
DECLARE
  v_entry_id UUID;
  v_case_id  UUID;
  v_org_id   UUID;
BEGIN
  v_case_id := (p_entry->>'document_case_id')::uuid;

  -- Derive org_id from parent document_case (chunk-3 canonical
  -- pattern; single source of truth at INSERT time).
  SELECT org_id INTO v_org_id
  FROM document_cases
  WHERE id = v_case_id;

  IF v_org_id IS NULL THEN
    RAISE EXCEPTION 'document_case % not found', v_case_id
      USING ERRCODE = 'foreign_key_violation';
  END IF;

  -- INSERT queue entry FIRST. Ordering matters: the partial UNIQUE
  -- on (document_case_id) WHERE exception_status = 'open' enforces
  -- duplicate-rejection at this step. If a queue row already exists
  -- in 'open' status for the same case, the INSERT raises
  -- unique_violation (23505) → service maps to EXCEPTION_ALREADY_OPEN.
  -- Running INSERT before the state-UPDATE ensures duplicate-enqueue
  -- against a case already in needs_review (because of a prior enqueue)
  -- surfaces as unique_violation, not as check_violation from the
  -- state predicate below. Implementation finding at chunk-6 first
  -- test run; documented in chunk-6 friction-journal paragraph 1.
  -- org_id is parent-derived (set above).
  INSERT INTO exception_queue_entries (
    org_id,
    document_case_id,
    source_document_id,
    exception_reason,
    trace_id,
    created_by
  )
  VALUES (
    v_org_id,
    v_case_id,
    NULLIF(p_entry->>'source_document_id', '')::uuid,
    (p_entry->>'exception_reason')::exception_reason,
    (p_entry->>'trace_id')::uuid,
    NULLIF(p_entry->>'created_by', '')::uuid
  )
  RETURNING exception_queue_entry_id INTO v_entry_id;

  -- Atomic case transition: classified|matched → needs_review.
  -- If state is not in {classified, matched}, UPDATE matches
  -- zero rows; raise check_violation. Service layer maps to
  -- INVALID_TRANSITION ServiceError. This fires only for first
  -- enqueues against wrong-state cases; duplicate-enqueues are
  -- caught by the partial-UNIQUE above.
  UPDATE document_cases
  SET state = 'needs_review'
  WHERE id = v_case_id
    AND state IN ('classified', 'matched');

  IF NOT FOUND THEN
    RAISE EXCEPTION 'document_case % not in classified|matched state; cannot enqueue exception (transition to needs_review requires source state classified or matched per ADR-0011 §3)', v_case_id
      USING ERRCODE = 'check_violation';
  END IF;

  -- INSERT audit_log — paired write in same transaction.
  -- entity_type='exception_queue_entry' is new at chunk 6.
  INSERT INTO audit_log (
    org_id, user_id, trace_id, action, entity_type, entity_id,
    before_state, after_state_id, tool_name, idempotency_key, reason
  )
  VALUES (
    v_org_id,
    NULLIF(p_audit->>'user_id', '')::uuid,
    (p_audit->>'trace_id')::uuid,
    p_audit->>'action',
    p_audit->>'entity_type',
    v_entry_id,
    p_audit->'before_state',
    v_entry_id,
    p_audit->>'tool_name',
    NULLIF(p_audit->>'idempotency_key', '')::uuid,
    p_audit->>'reason'
  );

  RETURN v_entry_id;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER;

GRANT EXECUTE ON FUNCTION enqueue_exception_with_audit(JSONB, JSONB)
  TO service_role;

-- -----------------------------------------------------------
-- resolve_exception_with_audit RPC.
-- Atomic: UPDATE queue entry (status→resolved, resolution_action,
-- resolution_notes, resolved_at, resolved_by) + UPDATE
-- document_case state (per 9-action terminal-state mapping) +
-- INSERT audit_log with combined before_state capturing both
-- prior states.
--
-- Per-action terminal case state mapping (load-bearing — see
-- brief 9-action table; one mis-mapped action means one wrong
-- production behavior):
--   - attach_to_existing_bill       → proposed
--   - attach_to_existing_payment    → proposed
--   - record_bill_payment           → proposed
--   - route_to_manual_entry         → proposed
--   - manual_born_paid_workflow     → proposed
--   - mark_duplicate                → rejected
--   - mark_non_accounting           → rejected
--   - archive                       → rejected
--   - reprocess                     → classified (requires
--                                     LEGAL_TRANSITIONS broadening
--                                     in documentCaseService.ts;
--                                     Layer 1 CHECK broadens to
--                                     admit classified per
--                                     _chunk_6_active above)
-- -----------------------------------------------------------
CREATE OR REPLACE FUNCTION resolve_exception_with_audit(
  p_entry_id   UUID,
  p_resolution JSONB,
  p_audit      JSONB
) RETURNS UUID AS $$
DECLARE
  v_before_status        exception_status;
  v_before_case_state    document_case_state;
  v_case_id              UUID;
  v_org_id               UUID;
  v_resolution_action    resolution_action;
  v_terminal_state       document_case_state;
BEGIN
  -- Lock queue row FOR UPDATE; capture before_status + case_id.
  SELECT exception_status, document_case_id, org_id
    INTO v_before_status, v_case_id, v_org_id
  FROM exception_queue_entries
  WHERE exception_queue_entry_id = p_entry_id
  FOR UPDATE;

  IF v_before_status IS NULL THEN
    RAISE EXCEPTION 'exception_queue_entry % not found', p_entry_id
      USING ERRCODE = 'no_data_found';
  END IF;

  -- Reject resolve-against-already-resolved (defense-in-depth;
  -- §6(b) trigger also catches this on the UPDATE, but rejecting
  -- here lets the service layer map cleanly).
  IF v_before_status != 'open' THEN
    RAISE EXCEPTION 'exception_queue_entry % is not open (status: %); cannot resolve', p_entry_id, v_before_status
      USING ERRCODE = 'check_violation';
  END IF;

  -- Compute terminal case state per 9-action mapping.
  v_resolution_action := (p_resolution->>'resolution_action')::resolution_action;
  v_terminal_state := (
    CASE v_resolution_action
      WHEN 'attach_to_existing_bill'    THEN 'proposed'::document_case_state
      WHEN 'attach_to_existing_payment' THEN 'proposed'::document_case_state
      WHEN 'record_bill_payment'        THEN 'proposed'::document_case_state
      WHEN 'route_to_manual_entry'      THEN 'proposed'::document_case_state
      WHEN 'manual_born_paid_workflow'  THEN 'proposed'::document_case_state
      WHEN 'mark_duplicate'             THEN 'rejected'::document_case_state
      WHEN 'mark_non_accounting'        THEN 'rejected'::document_case_state
      WHEN 'archive'                    THEN 'rejected'::document_case_state
      WHEN 'reprocess'                  THEN 'classified'::document_case_state
      ELSE NULL  -- reserved values shouldn't reach here; Layer 1
                 -- CHECK + Layer 2 Zod reject them upstream.
    END
  );

  IF v_terminal_state IS NULL THEN
    RAISE EXCEPTION 'resolution_action % has no terminal-state mapping (reserved value should not reach resolve RPC; check Layer 2 Zod + Layer 1 CHECK)', v_resolution_action
      USING ERRCODE = 'check_violation';
  END IF;

  -- Capture before_case_state for audit_log.before_state.
  SELECT state INTO v_before_case_state
  FROM document_cases
  WHERE id = v_case_id
  FOR UPDATE;

  IF v_before_case_state IS NULL THEN
    RAISE EXCEPTION 'document_case % not found (queue entry references nonexistent case — should not happen given FK)', v_case_id
      USING ERRCODE = 'no_data_found';
  END IF;

  -- UPDATE queue entry. Column-level GRANT (§6(a)) permits the
  -- 5 mutable columns. Trigger (§6(b)) admits open → resolved.
  UPDATE exception_queue_entries
  SET exception_status   = 'resolved',
      resolution_action  = v_resolution_action,
      resolution_notes   = p_resolution->>'resolution_notes',
      resolved_at        = NOW(),
      resolved_by        = NULLIF(p_resolution->>'resolved_by', '')::uuid
  WHERE exception_queue_entry_id = p_entry_id;

  -- UPDATE case state. Layer 1 CHECK (_chunk_6_active) admits
  -- proposed | rejected | classified.
  UPDATE document_cases
  SET state = v_terminal_state
  WHERE id = v_case_id;

  -- INSERT audit_log — combined before_state captures both
  -- prior states (queue.exception_status + case.state) per
  -- brief framing.
  INSERT INTO audit_log (
    org_id, user_id, trace_id, action, entity_type, entity_id,
    before_state, after_state_id, tool_name, idempotency_key, reason
  )
  VALUES (
    v_org_id,
    NULLIF(p_audit->>'user_id', '')::uuid,
    (p_audit->>'trace_id')::uuid,
    p_audit->>'action',
    p_audit->>'entity_type',
    p_entry_id,
    jsonb_build_object(
      'exception_status',    v_before_status::text,
      'document_case_state', v_before_case_state::text
    ),
    p_entry_id,
    p_audit->>'tool_name',
    NULLIF(p_audit->>'idempotency_key', '')::uuid,
    p_audit->>'reason'
  );

  RETURN p_entry_id;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER;

GRANT EXECUTE ON FUNCTION resolve_exception_with_audit(UUID, JSONB, JSONB)
  TO service_role;
