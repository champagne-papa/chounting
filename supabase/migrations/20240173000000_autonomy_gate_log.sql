-- =============================================================
-- 20240173000000_autonomy_gate_log.sql
-- ADR-0032 Wave-3 build — Canonical Autonomy Gate Seam recording substrate.
--
-- Executable build pass for ADR-0032
-- (docs/07_governance/adr/0032-canonical-autonomy-gate-seam.md, ratified
-- 2026-06-02 at 3bebc7af; ratification package 6fe7fd1c). This migration
-- ships the attempt-grain recording table the seam writes to; it makes no
-- decisions of its own beyond the FK delete-behavior settled below (the
-- ADR's OQ-1..7 are the design authority).
--
-- =============================================================
-- HEAD PASS (findings grounding this migration)
--
-- (a) FILENAME CONVENTION. `<14-digit-ts>_<snake>.sql`. Highest existing
--     is 20240172000000_evidence_objects_substrate.sql; next slot is
--     20240173000000. Suffix `autonomy_gate_log` names the table.
--
-- (b) ATTEMPT-GRAIN, NOT RULE-GRAIN (ADR-0032 D-0032.3 / OQ-2). One row
--     per autonomous commit attempt at the live seam (the two
--     ledger-committing ingestDocument branches), NOT one row per
--     candidate rule. A bundle attempt is one row (OQ-2), not one per
--     child. Distinct artifact from rule_evaluation_log (ADR-0024); the
--     two share trace_id, neither subsumes the other.
--
-- (c) RECORDING-NOT-DECIDING, DB-ENFORCED (ADR-0032 D-0032.2). At V1 the
--     gate records a disposition but the attempt parks unconditionally
--     (Invariant 5 — no autonomous commit at V1). realized_outcome is
--     CHECK-constrained to ('parked') ONLY: no row can encode a committed
--     outcome at V1, even from a buggy writer. This promotes
--     recording-not-deciding from code-discipline to a DB invariant. The
--     post-V1 governed-auto-commit flip (V2 Track 1.1) broadens the CHECK
--     to add 'committed' at its producer wave — the Wave-1/2 v1-active
--     CHECK-narrowing pattern (workflow_instances, evidence_objects) run
--     in reverse.
--
-- (d) SERVICE-EMITTED-ONLY, APPEND-ONLY RLS (mirrors rule_evaluation_log,
--     20240164000000 §c). No user-path INSERT policy (RLS-enabled-no-policy
--     denies the user path; service_role bypasses — audit_log/events
--     precedent). Explicit UPDATE/DELETE USING(false) surfaces append-only
--     intent at the RLS layer. ENFORCEMENT SCOPE: RLS-only (no triggers,
--     no REVOKEs), so append-only is enforced against the USER path only;
--     the service path is append-only by single-writer discipline
--     (autonomyGateService inserts only). This is the rule_evaluation_log
--     shape, authored faithfully.
--
-- (e) FK DELETE BEHAVIOR — DELIBERATE (raised at the build-plan read-back).
--     org_id -> organizations(org_id) ON DELETE CASCADE. autonomy_gate_log
--     is a recording/diagnostic LOG — the rule_evaluation_log sibling
--     class, whose org rows cascade on org-delete (transitively via its
--     rule_registry FK ON DELETE CASCADE). It is NOT the protected
--     evidence anchor class (evidence_objects uses ON DELETE RESTRICT). A
--     diagnostic log is disposable on org-delete and must not RESTRICT /
--     block org deletion; CASCADE matches the log-class convention. (No
--     rule FK: an attempt may have no winning rule -- gate_disposition
--     null -- so the table cannot borrow rule_evaluation_log's
--     transitive-via-rule_registry org integrity; a direct org FK gives
--     the cascade + integrity.)
--
-- (f) NO VIEW AT V1 (ADR-0032 D-0032.7 / OQ — "read surfaces ship
--     security_invoker = true ... if any"). Recording-only at V1: no
--     consumer reads autonomy_gate_log until the V2 eval harness. The
--     table's own RLS SELECT (user_has_org_access) is the V1 read guard; a
--     security_invoker aggregate view lands WITH its consumer (the
--     evidence_objects precedent — Wave 2 shipped table RLS, no view).
--
-- (g) INV-AUTONOMY-GATE-001 — RESERVED, NOT REGISTERED (ADR-0032 D-0032.8;
--     ADR-0021 register-on-enforcement). Recording != enforcing, so no
--     invariants.md / ledger_truth_model.md leaf is registered by this
--     migration. This table is the future enforcement substrate; the
--     invariant registers when the gate gains commit authority (post-V1).
--
-- =============================================================
-- SCOPE
--   IN : autonomy_gate_log table, 3 indexes, RLS (append-only,
--        service-emitted).
--   OUT: no view (recording-only, no V1 consumer); no new enums
--        (reuses action_type from Ring 1); no triggers/REVOKEs (RLS-only);
--        no service/seam/orchestrator code (separate build commit); no
--        invariant registration (reserved per ADR-0021).
-- =============================================================

BEGIN;

-- -----------------------------------------------------------------
-- autonomy_gate_log — one row per autonomous commit attempt at the
-- Canonical Autonomy Gate Seam (the two ledger-committing ingestDocument
-- branches: proposed_entry_card, proposed_mutation_bundle).
-- -----------------------------------------------------------------
CREATE TABLE autonomy_gate_log (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id              uuid NOT NULL REFERENCES organizations(org_id) ON DELETE CASCADE,
  trace_id            uuid NOT NULL,
  source_document_id  uuid NOT NULL,
  seam_branch         text NOT NULL
    CHECK (seam_branch IN ('proposed_entry_card','proposed_mutation_bundle')),
  -- The gate's computed output for this attempt. NULL when no rule was
  -- gate-evaluated: a bundle attempt (rule evaluation is card-grain --
  -- card-only deferral) or an entry-card attempt with no winner.
  effective_action    action_type NULL,
  gate_disposition    text NULL
    CHECK (gate_disposition IS NULL OR gate_disposition IN ('auto_posted','routed','blocked','pending')),
  -- What actually happened to the attempt. V1: 'parked' ONLY (Invariant 5;
  -- recording-not-deciding, DB-enforced). Post-V1 broadens to add 'committed'.
  realized_outcome    text NOT NULL
    CHECK (realized_outcome IN ('parked')),
  created_at          timestamptz NOT NULL DEFAULT now()
);

-- -----------------------------------------------------------------
-- Indexes
-- -----------------------------------------------------------------
CREATE INDEX idx_autonomy_gate_log_org_created
  ON autonomy_gate_log (org_id, created_at);        -- tenant-scoped queries
CREATE INDEX idx_autonomy_gate_log_trace
  ON autonomy_gate_log (trace_id);                  -- cross-event correlation
CREATE INDEX idx_autonomy_gate_log_source_document
  ON autonomy_gate_log (source_document_id);        -- per-attempt lookup

-- -----------------------------------------------------------------
-- RLS — append-only, service-emitted (mirrors rule_evaluation_log §c).
--
-- INV-AUTONOMY-GATE-001 (reserved-unregistered; register-on-enforcement,
-- ADR-0021) — autonomy_gate_log is append-only against the user path: RLS
-- blocks authenticated-role UPDATE/DELETE (USING(false)) and there is no
-- user-path INSERT policy. Attempt records are written only by
-- autonomyGateService on the service_role client (which bypasses RLS).
-- service_role can technically mutate (RLS-only, no triggers); service-path
-- append-only is by single-writer discipline. The invariant is NOT
-- registered at Wave 3 (recording != enforcing); this table is its future
-- enforcement substrate.
-- -----------------------------------------------------------------
ALTER TABLE autonomy_gate_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY autonomy_gate_log_select ON autonomy_gate_log
  FOR SELECT USING (user_has_org_access(org_id));

-- No INSERT policy: service-emitted only. RLS-enabled-no-policy denies the
-- user path; service_role bypasses RLS (audit_log/events precedent).

CREATE POLICY autonomy_gate_log_no_update ON autonomy_gate_log
  FOR UPDATE USING (false);   -- append-only (user path)

CREATE POLICY autonomy_gate_log_no_delete ON autonomy_gate_log
  FOR DELETE USING (false);   -- append-only (user path)

COMMENT ON TABLE autonomy_gate_log IS
  'ADR-0032 Wave-3 (Canonical Autonomy Gate Seam). One row per autonomous '
  'commit attempt at the live seam (the two ledger-committing ingestDocument '
  'branches). Records the gate''s computed disposition (effective_action / '
  'gate_disposition; NULL for bundle attempts and no-winner cards) and the '
  'realized_outcome (V1: ''parked'' ONLY -- recording-not-deciding, '
  'DB-enforced; Invariant 5). Attempt-grain, distinct from rule_evaluation_log '
  '(rule-grain, ADR-0024); shares trace_id, subsumes nothing. Append-only '
  'against the user path (RLS USING(false) + no user-path INSERT); '
  'service-emitted via service_role; service-path append-only by single-writer '
  'discipline (autonomyGateService). INV-AUTONOMY-GATE-001 reserved-'
  'unregistered (register-on-enforcement, ADR-0021); this is its future '
  'enforcement substrate.';

COMMIT;
