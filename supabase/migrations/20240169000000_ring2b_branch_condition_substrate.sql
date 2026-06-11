-- =============================================================
-- 20240169000000_ring2b_branch_condition_substrate.sql
-- Ring 2B implementation (ADR-0027, ratified d6175f4d).
--
-- The branch/condition STORAGE substrate the shipped-but-inert Ring 2A
-- evaluator needs: rule_branches + rule_conditions, registry-keyed via the
-- rule_track_records pattern (20240163 §c) — simple rule_id cascade FK, no
-- org_id, through-parent RLS. JSONB only for the polymorphic condition_value;
-- everything else normalized for ordering / immutability.
--
-- This migration is SUBSTRATE-ONLY (the tables + their guards). The
-- create_vendor_rule_atomic extension that POPULATES these tables (Decision 7 /
-- OQ-2B-2) lands in the next migration (20240170), co-committed with its TS
-- caller update + types.ts regen, so the RPC signature change and its caller
-- flip atomically rather than leaving a red window (the 3-arg→4-arg change
-- breaks ruleCreationOrchestrator.ts:70 until the caller updates). This split
-- keeps each commit green: nothing writes rule_branches yet at this migration,
-- so it is purely additive.
--
-- ENUM grounding (per ADR-0027 Decision 1, verified on disk):
--   * branch_type is NEW — created here. It is DISTINCT from the
--     rule_evaluation_log.winning_branch_type text CHECK ('primary','guardrail')
--     (20240164 §a): branch_type is the structural AUTHORED kind
--     ('primary','otherwise_if', §5.2); winning_branch_type is the WIN-TIME
--     classification where a winning otherwise_if maps to 'guardrail'
--     (evaluator.ts:20-21). The two are deliberately distinct vocabularies and
--     are NOT unified here.
--   * condition_type / action_type / trigger_type are shipped (20240163 §a).
--
-- NOT NULL blast radius (.claude/rules/migrations.md): rule_branches and
-- rule_conditions are BRAND-NEW tables with zero existing rows and zero
-- existing INSERT sites. The only writer is the create_vendor_rule_atomic
-- extension in 20240170 (co-authored with this arc). Blast radius is therefore
-- the single co-authored RPC; no external INSERT site exists to enumerate.
--
-- Substrate-mod test-staleness review (.claude/rules/migrations.md): this
-- migration CREATEs new substrate (does not broaden an existing CHECK/ENUM/
-- UNIQUE/NOT-NULL on a populated table), so no existing test asserts against it.
-- The immutability-trigger interaction with cascade-delete-based test cleanup
-- is addressed in the surface note accompanying this commit (the rule_registry-
-- delete cascade pattern at ruleTrackRecordServiceRecordEvaluation /
-- ruleEvaluationServiceRecordEvaluation integration tests).
--
-- Canon: docs/07_governance/adr/0027-ring2b-substrate.md Decisions 1-3.
--        docs/02_specs/rule-type-core.md §4 / §5.1 / §5.2 / §5.5.
--        docs/09_briefs/post-mvp/2026-05-30-ring2b-impl-scope-lock.md.
-- =============================================================

BEGIN;

-- -------------------------------------------------------------
-- a. branch_type enum (NEW; ADR-0027 Decision 1). Matches the TS
--    BranchType at core/rules/types.ts:21. NOT the winning_branch_type
--    vocabulary (see header).
-- -------------------------------------------------------------
CREATE TYPE branch_type AS ENUM (
  'primary',
  'otherwise_if'
);

-- -------------------------------------------------------------
-- b. rule_branches — ordered branches per rule. Registry-keyed
--    (rule_track_records pattern, 20240163 §c): simple rule_id cascade FK,
--    NO org_id (rule-scoped uniqueness, org derived through-parent).
-- -------------------------------------------------------------
CREATE TABLE rule_branches (
  id                              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_id                         uuid NOT NULL REFERENCES rule_registry(id) ON DELETE CASCADE,
  branch_order                    integer NOT NULL CHECK (branch_order >= 0),
  branch_type                     branch_type NOT NULL,
  max_outcome_action              action_type NOT NULL,
  -- §5.4: a Rule's evaluation-trigger set is a 2-value subset of trigger_type
  -- (EvaluationTrigger = Extract<TriggerType, 'proposed_mutation_generated' |
  -- 'proposed_mutation_bundle_generated'>, shared/rules/types.ts:39-42). DB
  -- CHECK enforces the closed grammar; non-empty guard rejects the
  -- never-evaluated dead branch (<@ alone admits {}).
  applies_to_evaluation_triggers  trigger_type[] NOT NULL,
  -- §6.1 step-2 branch filter. NULL = applies to any source trigger; an empty
  -- non-null array would be a dead filter, so guard non-empty when present. No
  -- subset CHECK — SourceTrigger is the full trigger_type.
  applies_to_source_triggers      trigger_type[],
  CONSTRAINT rule_branches_rule_order_uq UNIQUE (rule_id, branch_order),
  CONSTRAINT rule_branches_eval_triggers_subset CHECK (
    cardinality(applies_to_evaluation_triggers) >= 1
    AND applies_to_evaluation_triggers <@ ARRAY[
      'proposed_mutation_generated',
      'proposed_mutation_bundle_generated'
    ]::trigger_type[]
  ),
  CONSTRAINT rule_branches_source_triggers_nonempty CHECK (
    applies_to_source_triggers IS NULL
    OR cardinality(applies_to_source_triggers) >= 1
  )
);

-- At most one 'primary' branch per rule (the ≤1 half of Decision 1's
-- exactly-one-primary; the ≥1 half is enforced in the create RPC, which sees
-- the whole branch set in one transaction). Partial unique index = DB-level
-- belt over the RPC's suspenders.
CREATE UNIQUE INDEX rule_branches_one_primary_per_rule
  ON rule_branches (rule_id) WHERE branch_type = 'primary';

-- Condition assembly reads branches by rule; index the FK.
CREATE INDEX rule_branches_rule_id_idx ON rule_branches (rule_id);

-- §b.RLS — through-parent (rule_registry), mirroring rule_track_records
-- (20240163 §c.RLS). SELECT user_has_org_access; INSERT user_is_controller
-- (branches co-created with the rule); UPDATE/DELETE USING(false) — write-once,
-- the actual mutation model (not the registry CUD shape). Service writes are
-- service_role (RLS-exempt); these state design intent for the user path.
ALTER TABLE rule_branches ENABLE ROW LEVEL SECURITY;

CREATE POLICY rule_branches_select ON rule_branches
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM rule_registry r
      WHERE r.id = rule_branches.rule_id
        AND user_has_org_access(r.org_id)
    )
  );

CREATE POLICY rule_branches_insert ON rule_branches
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM rule_registry r
      WHERE r.id = rule_branches.rule_id
        AND user_is_controller(r.org_id)
    )
  );

CREATE POLICY rule_branches_no_user_update ON rule_branches
  FOR UPDATE USING (false);

CREATE POLICY rule_branches_no_user_delete ON rule_branches
  FOR DELETE USING (false);

-- -------------------------------------------------------------
-- c. rule_conditions — ordered conditions per branch. branch_id cascade FK;
--    org derived two-hop (rule_conditions → rule_branches → rule_registry).
--    condition_value JSONB (polymorphic per condition_type; core/rules/types.ts
--    types it `unknown`, validated at the ruleBranchService assembly boundary).
-- -------------------------------------------------------------
CREATE TABLE rule_conditions (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id         uuid NOT NULL REFERENCES rule_branches(id) ON DELETE CASCADE,
  condition_order   integer NOT NULL CHECK (condition_order >= 0),
  condition_type    condition_type NOT NULL,
  target_field      text NOT NULL,
  condition_value   jsonb NOT NULL,
  CONSTRAINT rule_conditions_branch_order_uq UNIQUE (branch_id, condition_order)
);

CREATE INDEX rule_conditions_branch_id_idx ON rule_conditions (branch_id);

-- §c.RLS — two-hop through-parent. SELECT user_has_org_access; INSERT
-- user_is_controller; UPDATE/DELETE USING(false).
ALTER TABLE rule_conditions ENABLE ROW LEVEL SECURITY;

CREATE POLICY rule_conditions_select ON rule_conditions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM rule_branches b
      JOIN rule_registry r ON r.id = b.rule_id
      WHERE b.id = rule_conditions.branch_id
        AND user_has_org_access(r.org_id)
    )
  );

CREATE POLICY rule_conditions_insert ON rule_conditions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM rule_branches b
      JOIN rule_registry r ON r.id = b.rule_id
      WHERE b.id = rule_conditions.branch_id
        AND user_is_controller(r.org_id)
    )
  );

CREATE POLICY rule_conditions_no_user_update ON rule_conditions
  FOR UPDATE USING (false);

CREATE POLICY rule_conditions_no_user_delete ON rule_conditions
  FOR DELETE USING (false);

-- -------------------------------------------------------------
-- d. §5.1 logic-freeze — column-immutability trigger (ADR-0027 Decision 2;
--    OQ-2B-1 ratified toward trigger). INV-RULE-004 (Layer 1a), registered at
--    this arc per the spec-without-enforcement rule.
--
--    SCOPE — HYBRID (adjudicated). UPDATE + TRUNCATE are all-path (the trigger
--    fires for service_role too) — STRONGER than INV-RULE-001's RLS-only
--    user-path append-only; the belt-and-suspenders the fiduciary-logic stakes
--    justify (the branch logic IS the substrate the §5.1 audit-reproducibility
--    guarantee rests on). DELETE is user-path only — RLS USING(false) (above)
--    + the ruleBranchService single-writer discipline (never partial-delete
--    branch/condition rows on a non-proposed rule; whole-rule removal only via
--    the rule_registry ON DELETE CASCADE). The DELETE freeze is the SAME
--    discipline-not-DB model as INV-RULE-001, NOT stronger; the residual (a
--    service-path direct DELETE of a live rule's branch is not DB-blocked) is
--    named in the INV-RULE-004 leaf + the ruleBranchService contract (20240170).
--
--    DELETE deliberately NOT trigger-blocked: a DELETE here only arrives via the
--    rule_registry ON DELETE CASCADE (whole-rule removal / retire-and-create-new
--    cleanup), and an all-path BEFORE DELETE on a cascade-child of a deletable
--    parent is the CA-65 trap (append-only DELETE triggers silently rejecting
--    cascades, breaking the rule_registry-delete test-cleanup pattern). The log
--    cascades away with the rule → no dangling Logic-Receipt.
--
--    UNCONDITIONAL (write-once-from-creation, Decision 1) — the trigger does NOT
--    read parent.lifecycle_state. Branches are INSERT-only via the create RPC;
--    approval flips rule_registry.lifecycle_state, not branch rows; amendment is
--    retire-and-create-new, never in-place edit — so there is no proposed-state
--    branch-UPDATE path to preserve. Resolves toward Decision 1's "write-once at
--    creation"; ADR-0027 Decision 2's "once past proposed" wording gets a
--    footnote touch-up (spec-staleness batch).
-- -------------------------------------------------------------
CREATE OR REPLACE FUNCTION reject_rule_branches_mutation()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'rule_branches is logic-frozen (INV-RULE-004) — UPDATE and TRUNCATE are forbidden'
    USING ERRCODE = 'feature_not_supported';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_rule_branches_no_update
  BEFORE UPDATE ON rule_branches
  FOR EACH ROW
  EXECUTE FUNCTION reject_rule_branches_mutation();

CREATE TRIGGER trg_rule_branches_no_truncate
  BEFORE TRUNCATE ON rule_branches
  FOR EACH STATEMENT
  EXECUTE FUNCTION reject_rule_branches_mutation();

CREATE OR REPLACE FUNCTION reject_rule_conditions_mutation()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'rule_conditions is logic-frozen (INV-RULE-004) — UPDATE and TRUNCATE are forbidden'
    USING ERRCODE = 'feature_not_supported';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_rule_conditions_no_update
  BEFORE UPDATE ON rule_conditions
  FOR EACH ROW
  EXECUTE FUNCTION reject_rule_conditions_mutation();

CREATE TRIGGER trg_rule_conditions_no_truncate
  BEFORE TRUNCATE ON rule_conditions
  FOR EACH STATEMENT
  EXECUTE FUNCTION reject_rule_conditions_mutation();

-- Layer 3 — REVOKE TRUNCATE for non-privileged roles (closes the row-level-
-- trigger TRUNCATE gap; service_role retains TRUNCATE by platform constraint
-- and is caught by the statement-level triggers above).
REVOKE TRUNCATE ON rule_branches FROM PUBLIC;
REVOKE TRUNCATE ON rule_branches FROM authenticated;
REVOKE TRUNCATE ON rule_branches FROM anon;
REVOKE TRUNCATE ON rule_conditions FROM PUBLIC;
REVOKE TRUNCATE ON rule_conditions FROM authenticated;
REVOKE TRUNCATE ON rule_conditions FROM anon;

COMMIT;
