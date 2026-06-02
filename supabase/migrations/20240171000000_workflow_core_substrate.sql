-- =============================================================
-- 20240171000000_workflow_core_substrate.sql
-- Workflow Core Substrate — ADR-0028 (V1 governance arc, Wave 1, R4).
--
-- Executable authoring pass for ADR-0028
-- (docs/07_governance/adr/0028-workflow-core-substrate.md, ratified
-- 2026-06-01). Bounded translation: this migration is the SQL for
-- ADR-0028's D-0028.1/.2/.8 substrate; it makes no substrate decisions
-- of its own. Net-new, general, INERT: nothing writes these tables at
-- Wave 1 (the `events`-table reserved-seat pattern — append-only trigger
-- installed physical-from-day-one; the first live writer is a later
-- consumer wave).
--
-- =============================================================
-- HEAD PASS (findings grounding this migration)
--
-- (a) FILENAME CONVENTION. `<14-digit-ts>_<snake>.sql`. Immediately
--     follows 20240170000000_ring2b_create_vendor_rule_atomic_branches.sql;
--     next slot 20240171000000. Suffix names the substrate this ships.
--
-- (b) NET-NEW ⇒ EMPTY NOT-NULL BLAST RADIUS. Both tables are net-new and
--     inert; there are zero existing INSERT sites (grep "INSERT INTO
--     workflow_instances|workflow_events" returns nothing). NOT-NULL
--     columns without DEFAULT (org_id, definition_key, definition_version,
--     state, trace_id, created_by; workflow_instance_id, event_type,
--     payload, trace_id) carry no blast radius — nothing inserts yet.
--
-- (c) INERT POSTURE. workflow_instances.state has a v1-active CHECK
--     narrowed to the entry value 'pending' (document_cases 'received' /
--     document_jobs 'queued' precedent: substrate-now / enforcement-later).
--     The full lifecycle enum ships; the CHECK broadens when a consumer
--     wave activates writes. No invariant is registered (ADR-0028 D-0028.8;
--     register-on-enforcement, ADR-0021): INV-WORKFLOW-002/003/004 stay
--     reserved in agent_autonomy_model / future invariants.md, not added
--     here. The append-only trigger on workflow_events is the substrate
--     made physical (events precedent), distinct from the doc-registration
--     of INV-WORKFLOW-002.
--
-- (d) THREE-LOG DISAMBIGUATION (ADR-0028 Context). workflow_events is the
--     execution-grain log; it is NOT the `events` outbox (R5, domain-event
--     emission; do-not-repurpose) and NOT audit_log (mutation grain).
--     trace_id is the shared correlation key (joins to audit_log via
--     idx_audit_org_trace) — no log subsumes another.
--
-- (e) APPEND-ONLY MECHANISM. workflow_events uses the trigger-based
--     append-only of `events`/`audit_log` (ADR-0028 §2.2 design-spec
--     choice), NOT the RLS-only shape of rule_evaluation_log: per-table
--     reject function + BEFORE UPDATE/DELETE (row) + BEFORE TRUNCATE
--     (statement) triggers, authoritative against ALL paths incl.
--     service_role. workflow_instances is NOT append-only (the engine
--     advances its state); it is service-emitted (RLS SELECT only, no
--     user-path write policy; service_role writes).
-- =============================================================
-- SCOPE
--   IN : workflow_instance_state enum, workflow_event_type enum,
--        workflow_instances table (+ indexes, RLS, comment),
--        workflow_events table (+ indexes, RLS, append-only triggers,
--        comment).
--   OUT: no services/workflow code (substrate-only; the engine runtime is
--        a later wave); no workflow_definitions table (definitions are
--        code-defined, ADR-0028 D-0028.4); no document_jobs change
--        (consumer seam reserved inert, D-0028.2 / OQ-3); no invariant
--        registration (D-0028.8); no system_overview/workflow_model edits
--        (separate docs in this build).
-- =============================================================

BEGIN;

-- -----------------------------------------------------------------
-- §1. Enums — instance lifecycle + execution event types
-- -----------------------------------------------------------------
CREATE TYPE workflow_instance_state AS ENUM (
  -- v1-active subset (Wave 1: inert; CHECK narrows to 'pending'):
  'pending',
  -- Reserved (consumer-wave activation — the generic lifecycle):
  'running', 'completed', 'compensating', 'compensated', 'failed'
);

CREATE TYPE workflow_event_type AS ENUM (
  'activity_started', 'activity_completed', 'activity_failed',
  -- explicit compensation (ADR-0028 D-0028.4 / OQ-4: encoded as event_type):
  'compensation_started', 'compensation_completed',
  -- AI-step output capture for replay-honor (invariant 9 / D-0028.6):
  'ai_step_recorded'
);

-- -----------------------------------------------------------------
-- §2. workflow_instances — DB-backed instances of code-defined
--     definitions (ADR-0028 D-0028.1). version-pinned; child-workflow
--     linkage via parent_instance_id (R4). MUTABLE (engine advances
--     state); service-emitted.
-- -----------------------------------------------------------------
CREATE TABLE workflow_instances (
  id                  uuid                    PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id              uuid                    NOT NULL REFERENCES organizations(org_id) ON DELETE RESTRICT,
  definition_key      text                    NOT NULL,   -- identity of a code-defined definition (Decision 4)
  definition_version  text                    NOT NULL,   -- pinned version; instance bound to the def version it started under
  parent_instance_id  uuid                    REFERENCES workflow_instances(id) ON DELETE RESTRICT,  -- child-workflow (R4)
  state               workflow_instance_state NOT NULL,
  trace_id            uuid                    NOT NULL,   -- audit join key (-> audit_log via idx_audit_org_trace)
  started_at          timestamptz,
  completed_at        timestamptz,
  created_at          timestamptz             NOT NULL DEFAULT now(),
  created_by          text                    NOT NULL,   -- 'agent' | <user_id> | service-actor

  -- Reserved learning-readable surface (R4 "shaped for the learning
  -- substrate to read"). Minimal + additive: a single nullable jsonb the
  -- V2 Track-4 learning substrate may annotate. Richer columns are
  -- additive when that track specs; not pinned beyond this surface now.
  learning_metadata   jsonb,

  -- v1-active CHECK (inert): narrows state to the entry value; broadens at
  -- the consumer wave (document_cases/document_jobs precedent).
  CONSTRAINT workflow_instances_state_v1_active CHECK (state = 'pending')
);

CREATE INDEX idx_workflow_instances_org_created
  ON workflow_instances (org_id, created_at);        -- tenant-scoped queries
CREATE INDEX idx_workflow_instances_parent
  ON workflow_instances (parent_instance_id);        -- child-workflow traversal (R4)
CREATE INDEX idx_workflow_instances_trace
  ON workflow_instances (trace_id);                  -- audit / cross-event join

-- RLS: service-emitted (Workflow Core writes via service_role). SELECT
-- scoped to org membership; no user-path write policy (RLS-enabled-no-policy
-- denies the user path; service_role bypasses). NOT append-only — the
-- engine advances state — so no USING(false) UPDATE/DELETE here.
ALTER TABLE workflow_instances ENABLE ROW LEVEL SECURITY;

CREATE POLICY workflow_instances_select ON workflow_instances
  FOR SELECT USING (user_has_org_access(org_id));

COMMENT ON TABLE workflow_instances IS
  'ADR-0028 (Workflow Core Substrate, V1 Wave 1, R4). Net-new, general, '
  'INERT at Wave 1 (no live writer until a consumer wave). DB-backed '
  'instances of code-defined workflow definitions (Decision 4): '
  'definition_key + definition_version pin the started-under version; '
  'parent_instance_id is the child-workflow linkage (R4). Service-emitted '
  '(service_role writes; SELECT scoped to org). Mutable lifecycle (the '
  'engine advances state) — v1-active CHECK narrows state to ''pending'' '
  'until the consumer wave broadens it. learning_metadata is the reserved '
  'minimal learning-readable surface. No invariant registered (D-0028.8).';

-- -----------------------------------------------------------------
-- §3. workflow_events — append-only per-instance execution log
--     (ADR-0028 D-0028.1/.6). Records activities, compensations, and AI
--     step outputs (ai_output, replay-honor). Distinct from the `events`
--     outbox (R5) and audit_log (mutation grain).
-- -----------------------------------------------------------------
CREATE TABLE workflow_events (
  id                    uuid                PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id                uuid                NOT NULL REFERENCES organizations(org_id) ON DELETE RESTRICT,
  workflow_instance_id  uuid                NOT NULL REFERENCES workflow_instances(id) ON DELETE RESTRICT,
  sequence_number       bigserial           NOT NULL,   -- global serial; total order within an instance via ORDER BY
  event_type            workflow_event_type NOT NULL,
  activity_key          text,                           -- which activity (null for non-activity events)
  payload               jsonb               NOT NULL,
  ai_output             jsonb,                           -- recorded AI-step output vs frozen inputs (invariant 9 / D-0028.6)
  trace_id              uuid                NOT NULL,    -- audit join key
  recorded_at           timestamptz         NOT NULL DEFAULT now()
);

CREATE INDEX idx_workflow_events_instance_seq
  ON workflow_events (workflow_instance_id, sequence_number);  -- ordered replay per instance
CREATE INDEX idx_workflow_events_org_recorded
  ON workflow_events (org_id, recorded_at);                    -- tenant-scoped queries
CREATE INDEX idx_workflow_events_trace
  ON workflow_events (trace_id);                               -- audit / cross-event join

-- RLS: service-emitted + append-only (user path). SELECT scoped to org;
-- no user-path INSERT policy (service_role writes); explicit USING(false)
-- UPDATE/DELETE surfaces the append-only intent at the RLS layer (the
-- rule_evaluation_log/audit_log idiom). All-path append-only is the
-- trigger below.
ALTER TABLE workflow_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY workflow_events_select ON workflow_events
  FOR SELECT USING (user_has_org_access(org_id));

CREATE POLICY workflow_events_no_update ON workflow_events
  FOR UPDATE USING (false);   -- append-only (user path); INV-WORKFLOW-002 (reserved)

CREATE POLICY workflow_events_no_delete ON workflow_events
  FOR DELETE USING (false);   -- append-only (user path); INV-WORKFLOW-002 (reserved)

-- Append-only triggers (authoritative against ALL paths incl. service_role;
-- the events/audit_log precedent). Substrate made physical-from-day-one;
-- the INV-WORKFLOW-002 doc-registration is deferred (D-0028.8).
CREATE OR REPLACE FUNCTION reject_workflow_events_mutation()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'workflow_events is append-only — UPDATE, DELETE, and TRUNCATE are forbidden'
    USING ERRCODE = 'feature_not_supported';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_workflow_events_no_update
  BEFORE UPDATE ON workflow_events
  FOR EACH ROW
  EXECUTE FUNCTION reject_workflow_events_mutation();

CREATE TRIGGER trg_workflow_events_no_delete
  BEFORE DELETE ON workflow_events
  FOR EACH ROW
  EXECUTE FUNCTION reject_workflow_events_mutation();

CREATE TRIGGER trg_workflow_events_no_truncate
  BEFORE TRUNCATE ON workflow_events
  FOR EACH STATEMENT
  EXECUTE FUNCTION reject_workflow_events_mutation();

COMMENT ON TABLE workflow_events IS
  'ADR-0028 (Workflow Core Substrate, V1 Wave 1). Append-only per-instance '
  'execution log: activities, compensations (event_type, OQ-4), and AI-step '
  'outputs (ai_output, replay-honor per invariant 9 / D-0028.6). Net-new, '
  'INERT at Wave 1. Distinct from the events outbox (R5) and audit_log '
  '(mutation grain); trace_id is the shared correlation key. Append-only '
  'against all paths via BEFORE UPDATE/DELETE/TRUNCATE triggers '
  '(events/audit_log precedent) + USING(false) RLS on the user path. '
  'INV-WORKFLOW-002 reserved, not registered (D-0028.8).';

COMMIT;
