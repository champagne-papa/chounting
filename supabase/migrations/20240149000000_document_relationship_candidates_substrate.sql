-- =============================================================
-- 20240149000000_document_relationship_candidates_substrate.sql
-- Phase 4 chunk 1 — document_relationship_candidates substrate +
-- create_candidates_with_audit batch RPC.
--
-- Per ADR-0018 §item 2 (Subsystem 1 — Ledger-State Candidate
--                  Completion; the Router's three-subsystem
--                  decomposition splits into Subsystem 1 — this
--                  chunk — and Subsystem 2 + 3 deferred to chunks
--                  2+) +
--     ADR-0011 §1 (Document Platform owns
--                  document_relationship_candidates substrate) +
--     ADR-0011 §9 rule 3 (candidate versioning via
--                  supersedes_candidate_id; re-evaluation produces
--                  new rows referencing prior; the prior row is
--                  preserved) +
--     ADR-0014 §11 (pipeline → Router incomplete-candidate
--                  handoff; ADR-0018 §item 2 completes the
--                  candidate by reading committed AP/Spend state) +
--     ADR-0007 §Tier 2.5 (read-only ledger-aware path; Router is
--                  Tier 2.5; transactional state reads
--                  authorized: bills, payments, prepayments,
--                  source_document_links) +
--     ADR-0010 (reserved-enum three-layer defense; chunk-1 reuses
--                  chunk-5's linked_entity_type + link_role PG
--                  ENUM types; vendor_credit +
--                  vendor_credit_application stay in ENUM but are
--                  reserved post-v1 per Phase 2.5 Commit A; no
--                  _v1_active CHECK on the candidate row because
--                  pair-validity defense lives at Zod Layer 2 per
--                  the c-2 lock at scope-lock 2026-05-13).
--
-- Immutable-spine RLS shape composition (first-instance at
-- chunks-1-6). Chunks 1-2 + chunk 6 used direct-org_id 4-policy
-- RLS for spine entities (own lifecycle, UX hot-path query
-- performance). Chunks 5-6 used column-level GRANT for narrow
-- service_role mutation on N mutable columns + BEFORE UPDATE
-- triggers. Chunks 1-2 used column-immutability triggers for
-- mixed-mutability tables (mutable workflow columns + immutable
-- audit anchors). Chunk-1 of Phase 4 ships a NEW composition:
--   - direct-org_id 4-policy RLS (chunk-6 spine convention).
--   - REVOKE UPDATE, DELETE FROM service_role (chunks 1-2-style
--     immutability defense).
--   - NO column-level GRANT (degenerate — no mutable columns to
--     grant access to; rows are insert-only by ADR-0011 §9 rule
--     3 versioning semantics).
--   - NO column-immutability trigger (no mutable workflow columns
--     to guard; REVOKE + RLS USING(false) already cover).
--   - RLS UPDATE/DELETE USING (false) as belt-and-suspenders for
--     authenticator/authenticated user-role clients (REVOKE
--     handles service_role; RLS handles user-role).
-- Three-layer defense: (1) REVOKE removes service_role privilege;
-- (2) RLS USING(false) rejects at policy layer for user-role;
-- (3) no updateCandidate() / deleteCandidate() method exists at
-- service layer. Subsystem 3 re-evaluation (chunks 2+) creates
-- new rows via supersedes_candidate_id, never UPDATEs prior rows.
--
-- Bare-id PK convention (chunks-1-2-4-5 majority precedent +
-- chunk-4 mechanic-precedent for append-only substrate with self-
-- FK supersession). Chunk-4's ocr_runs uses supersedes_ocr_run_id
-- REFERENCES ocr_runs(id) — structurally identical to chunk-1
-- Phase-4's supersedes_candidate_id REFERENCES
-- document_relationship_candidates(id). Chunk-6's
-- exception_queue_entry_id (full-suffix) is an undocumented
-- outlier; chunk-6 migration header doesn't articulate the
-- convention shift. Chunk-1 of Phase-4 follows mechanic-precedent
-- over chunk-number-precedent. Codified in friction-journal entry
-- at chunk-1 close.
--
-- Four indexes — no "head per case" partial index.
-- document_cases.current_relationship_candidate_id is the head
-- pointer (reserved at chunk-1-of-Phase-2 substrate; populated
-- by Subsystem 2 chunks 2+ per M3-α); "current candidate per
-- case" lookups go through the document_cases FK, not through a
-- scan-WHERE on candidates. Saves one index. Pattern for future
-- versioned substrate: if parent table carries a head-pointer
-- FK, skip the equivalent "head row per parent" partial index
-- on the versioned table. See friction-journal entry #22 at
-- chunk-1 close.
--
-- create_candidates_with_audit batch RPC — three deliberate
-- divergences from chunks-3-6 substrate-writer pattern:
--   (a) Plural RPC naming reflects batch shape; Subsystem 1
--       produces zero or more candidates per ADR-0018 §item 2.
--       Chunks-3-6 RPCs are singular (create_X_with_audit,
--       enqueue_X_with_audit).
--   (b) 'agent' hardcoded inside the RPC as created_by. Chunks-
--       3-6 pass created_by through from service (writer may be
--       user or automation). Chunk-1 Subsystem 1 is automation-
--       only at v1 (Router is agent-pipeline per ADR-0007
--       §Tier 2.5); substrate invariant enforced mechanically at
--       RPC layer. Per-invocation user_id captured separately in
--       audit_log.user_id (when chunks-2+ ship Subsystem 3 with
--       controller-initiated triggers like T10).
--   (c) Per-candidate audit_log row (not 1 summary row, not
--       N+1). N candidates → N audit_log rows in single
--       transaction with same trace_id. Matches chunks-3-6 per-
--       write semantic; preserves per-candidate forensic
--       queryability. Logic Receipt's pipeline_trace per ADR-
--       0007 Q30 captures invocation-level summary on the
--       complementary surface (chunks 2+ when Subsystem 2 lands
--       proposal envelopes).
--
-- Subsystem-write-boundary discipline (M3-α). Chunk-1's
-- completeCandidate does NOT write
-- document_cases.current_relationship_candidate_id — Subsystem 1
-- produces candidates, period. Subsystem 2 chunks 2+ picks the
-- winner per ADR-0018 §item 3 branches (a/b/c) and sets the head
-- pointer at that time. The three-subsystem decomposition in
-- ADR-0018 §item 1 maps to a clean substrate-write-boundary
-- split: Subsystem 1 writes document_relationship_candidates;
-- Subsystem 2 writes document_cases.current_relationship_candidate_id;
-- Subsystem 3 writes new candidate rows with
-- supersedes_candidate_id pointing at prior.
--
-- Constraint naming: confidence_score_v1_active. Stable-across-
-- chunks (range CHECK is fixed at [0, 1]; not expected to
-- broaden). _v1_active suffix per chunks 3-4 precedent for
-- stable-across-chunks constraints; chunks 1-2-5-6 used
-- _chunk_N_active for broadening-across-chunks constraints. See
-- friction-journal entry at chunk-1 close on the discriminator.
-- Stable test regex:
--   /document_relationship_candidates_confidence_score_v1_active/
--
-- Anti-scope (NOT in chunk 1):
--   - Subsystem 2 (ambiguity resolution; head-pointer write) —
--     chunks 2+.
--   - Subsystem 3 (T1-T10 re-evaluation dispatcher) — chunks 2+.
--   - pre_commit_link_rerouted audit event (ADR-0016 §6) — fires
--     from Subsystem 3.
--   - router_re_evaluation_fired audit event (ADR-0018 §Schema-
--     deltas) — fires from Subsystem 3.
--   - vendor_credit / vendor_credit_application linked_entity_type
--     activation — reserved post-v1 per Phase 2.5 Commit A; Phase 5
--     vendor_credits table doesn't exist.
--   - re_routing_trigger DB enum/CHECK — TS-only closed vocabulary
--     per ADR-0018 §Schema-deltas; no schema substrate.
--   - Phase 7 pipeline emission to completeCandidate — Phase 7.
-- =============================================================

-- -----------------------------------------------------------
-- document_relationship_candidates table — 13 columns, spine
-- entity. Direct org_id (chunk-1-2 + chunk-6 spine convention).
-- All FKs ON DELETE RESTRICT (chunks-1-6 BEFORE DELETE rejection
-- triggers on parent tables; ON DELETE clause never cascades in
-- practice; RESTRICT is the natural shape).
-- -----------------------------------------------------------
CREATE TABLE document_relationship_candidates (
  id                          uuid              PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id                      uuid              NOT NULL REFERENCES organizations(org_id) ON DELETE RESTRICT,
  document_case_id            uuid              NOT NULL REFERENCES document_cases(id) ON DELETE RESTRICT,
  source_document_id          uuid              NOT NULL REFERENCES source_documents(id) ON DELETE RESTRICT,
  supersedes_candidate_id     uuid              REFERENCES document_relationship_candidates(id) ON DELETE RESTRICT,
  linked_entity_type          linked_entity_type NOT NULL,
  linked_entity_id            uuid              NOT NULL,
  link_role                   link_role         NOT NULL,
  confidence_score            numeric(5,4)      NOT NULL,
  candidate_features          jsonb             NOT NULL,
  trace_id                    uuid              NOT NULL,
  created_at                  timestamptz       NOT NULL DEFAULT NOW(),
  created_by                  text              NOT NULL,

  CONSTRAINT document_relationship_candidates_confidence_score_v1_active CHECK (
    confidence_score >= 0 AND confidence_score <= 1
  )
);

-- -----------------------------------------------------------
-- Lookup indexes — four.
--   - org_id: admin/forensic queries; chunks-1-6 substrate-spine
--     convention.
--   - document_case_id: Subsystem 2 ambiguity-resolution candidate
--     list (chunks 2+); chunk-1 read-back optimization.
--   - source_document_id: per-document forensic queries; cross-
--     domain audit reconstruction.
--   - supersedes_candidate_id (partial WHERE NOT NULL):
--     Subsystem 3 supersession chain traversal (chunks 2+);
--     partial reduces index size (first-version candidates have
--     supersedes_candidate_id IS NULL).
-- -----------------------------------------------------------
CREATE INDEX document_relationship_candidates_org_id_idx
  ON document_relationship_candidates (org_id);
CREATE INDEX document_relationship_candidates_document_case_id_idx
  ON document_relationship_candidates (document_case_id);
CREATE INDEX document_relationship_candidates_source_document_id_idx
  ON document_relationship_candidates (source_document_id);
CREATE INDEX document_relationship_candidates_supersedes_candidate_id_idx
  ON document_relationship_candidates (supersedes_candidate_id)
  WHERE supersedes_candidate_id IS NOT NULL;

-- -----------------------------------------------------------
-- 4-policy direct-org_id RLS (chunks 1-2 + chunk-6 substrate-
-- spine convention via user_has_org_access(org_id) helper).
-- UPDATE/DELETE USING (false) — rows are insert-only per ADR-
-- 0011 §9 rule 3 (versioning via supersedes_candidate_id, not
-- UPDATE; Subsystem 3 re-evaluation creates new rows).
-- -----------------------------------------------------------
ALTER TABLE document_relationship_candidates ENABLE ROW LEVEL SECURITY;

CREATE POLICY document_relationship_candidates_select ON document_relationship_candidates
  FOR SELECT USING (user_has_org_access(org_id));

CREATE POLICY document_relationship_candidates_insert ON document_relationship_candidates
  FOR INSERT WITH CHECK (user_has_org_access(org_id));

CREATE POLICY document_relationship_candidates_no_update ON document_relationship_candidates
  FOR UPDATE USING (false);

CREATE POLICY document_relationship_candidates_no_delete ON document_relationship_candidates
  FOR DELETE USING (false);

-- -----------------------------------------------------------
-- REVOKE UPDATE, DELETE FROM service_role — immutable-spine
-- defense. NO column-level GRANT (degenerate — no mutable
-- columns; insert-only). Diverges from chunks-5-6 which REVOKE
-- + GRANT narrowly on mutable resolution-cycle columns. First-
-- instance composition.
-- -----------------------------------------------------------
REVOKE UPDATE ON document_relationship_candidates FROM service_role;
REVOKE DELETE ON document_relationship_candidates FROM service_role;

-- -----------------------------------------------------------
-- create_candidates_with_audit RPC.
-- Batch shape: p_candidates JSONB array → UUID[] return.
-- Atomic: N INSERTs into document_relationship_candidates + N
-- INSERTs into audit_log, all in one transaction. Rollback on
-- any failure rolls all writes back.
--
-- Parent-derived org_id (chunks-3-6 canonical pattern): each
-- candidate's org_id derived from document_cases.org_id via
-- subquery at INSERT time. Service never passes org_id; p_audit
-- carries metadata only (user_id, trace_id, action, entity_type,
-- tool_name, idempotency_key, reason per chunk-6 enqueue RPC
-- audit_log INSERT shape).
--
-- 'agent' hardcoded as created_by (chunk-1 substrate invariant).
-- Subsystem 1 is automation-only at v1; Router is agent-pipeline
-- per ADR-0007 §Tier 2.5. Per-invocation user_id (when chunks-2+
-- ship Subsystem 3 with controller-initiated triggers) captured
-- separately in audit_log.user_id.
--
-- Per-candidate audit_log row — N candidates → N audit_log rows
-- with same trace_id. Matches chunks-3-6 per-write semantic.
-- entity_id = the just-inserted candidate's id (RETURNING).
-- -----------------------------------------------------------
CREATE OR REPLACE FUNCTION create_candidates_with_audit(
  p_candidates JSONB,
  p_audit      JSONB
) RETURNS UUID[] AS $$
DECLARE
  v_candidate     JSONB;
  v_candidate_id  UUID;
  v_case_id       UUID;
  v_org_id        UUID;
  v_ids           UUID[] := ARRAY[]::UUID[];
BEGIN
  -- Iterate the candidate set. jsonb_array_elements expects
  -- p_candidates to be a JSONB array; service caller passes an
  -- array even when the set has zero elements (no-op RPC call
  -- is safe — loop body executes zero times; returns empty UUID[]).
  FOR v_candidate IN SELECT * FROM jsonb_array_elements(p_candidates)
  LOOP
    v_case_id := (v_candidate->>'document_case_id')::uuid;

    -- Derive org_id from parent document_case (chunks-3-6
    -- canonical pattern; single source of truth at INSERT time).
    -- Defensive even though a single completeCandidate() invocation
    -- typically produces candidates for one case; per-candidate
    -- derivation handles future callers that may batch across cases.
    SELECT org_id INTO v_org_id
    FROM document_cases
    WHERE id = v_case_id;

    IF v_org_id IS NULL THEN
      RAISE EXCEPTION 'document_case % not found', v_case_id
        USING ERRCODE = 'foreign_key_violation';
    END IF;

    -- INSERT candidate row. created_by hardcoded 'agent' per
    -- chunk-1 substrate invariant (automation-only writer per
    -- ADR-0007 §Tier 2.5).
    INSERT INTO document_relationship_candidates (
      org_id,
      document_case_id,
      source_document_id,
      supersedes_candidate_id,
      linked_entity_type,
      linked_entity_id,
      link_role,
      confidence_score,
      candidate_features,
      trace_id,
      created_by
    )
    VALUES (
      v_org_id,
      v_case_id,
      (v_candidate->>'source_document_id')::uuid,
      NULLIF(v_candidate->>'supersedes_candidate_id', '')::uuid,
      (v_candidate->>'linked_entity_type')::linked_entity_type,
      (v_candidate->>'linked_entity_id')::uuid,
      (v_candidate->>'link_role')::link_role,
      (v_candidate->>'confidence_score')::numeric,
      v_candidate->'candidate_features',
      (v_candidate->>'trace_id')::uuid,
      'agent'
    )
    RETURNING id INTO v_candidate_id;

    v_ids := v_ids || v_candidate_id;

    -- INSERT audit_log — per-candidate per chunks-3-6 per-write
    -- semantic. Same trace_id links all rows in this Subsystem 1
    -- invocation for forensic queries.
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
      v_candidate_id,
      NULL,  -- no before_state; first INSERT for this candidate
      v_candidate_id,
      p_audit->>'tool_name',
      NULLIF(p_audit->>'idempotency_key', '')::uuid,
      p_audit->>'reason'
    );
  END LOOP;

  RETURN v_ids;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER;

GRANT EXECUTE ON FUNCTION create_candidates_with_audit(JSONB, JSONB)
  TO service_role;
