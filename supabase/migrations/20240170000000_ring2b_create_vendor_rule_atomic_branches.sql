-- =============================================================
-- 20240170000000_ring2b_create_vendor_rule_atomic_branches.sql
-- Ring 2B implementation commit 2 (ADR-0027 Decision 7 / OQ-2B-2).
--
-- Extends create_vendor_rule_atomic (20240165) to co-create a rule's branches
-- + ordered conditions in the SAME atomic transaction as the
-- registry/track_record/vendor_rules rows. OQ-2B-2 is adjudicated → EXTEND the
-- existing RPC (not a dedicated branch-authoring RPC): a separate RPC would
-- break the single-transaction atomicity (ADR-0025 Correction 1: no
-- service-layer transaction threading) or duplicate the wrapper.
--
-- Signature change: 3-arg → 4-arg (adds p_branches). A 4-arg function is a new
-- overload, not a CREATE OR REPLACE of the 3-arg, so we DROP the 3-arg first to
-- avoid an ambiguous overload pair. p_branches DEFAULT '[]'::jsonb means the
-- existing 3-named-arg caller (ruleCreationOrchestrator.ts:70) resolves to this
-- function unchanged and creates a BRANCHLESS rule — exactly the current inert
-- behavior. Branch-AUTHORING (the orchestrator deriving + passing real
-- p_branches) lands with ruleBranchService in a later commit; this migration
-- only adds the storage-WRITE capability.
--
-- Exactly-one-primary (ADR-0027 Decision 1): enforced HERE for the ≥1 half
-- (the ≤1 half is the rule_branches_one_primary_per_rule partial unique index,
-- 20240169). Enforced only when p_branches is non-empty — a branchless rule
-- (empty p_branches) is permitted and stays inert (no winner), preserving
-- today's creation semantics until branch-authoring lands.
--
-- SECURITY DEFINER (A3 forward-flag extends to the modified RPC). DEFINER
-- HYGIENE FLAG CARRIED, NOT ABSORBED: create_vendor_rule_atomic is SECURITY
-- DEFINER while its precedent write_journal_entry_atomic (20240134) is SECURITY
-- INVOKER — flagged at 20240165 for a future security-mode hygiene review
-- spanning create + approve_vendor_rule_atomic (T4-adjacent). Re-touching the
-- function here re-surfaces that flag; the hygiene resolution is NOT taken in
-- this arc.
--
-- This migration changes a FUNCTION only — no table/CHECK/ENUM/UNIQUE/NOT-NULL
-- change to existing substrate (the substrate-mod test-staleness review fires
-- on 20240169, not here). The function-signature change is captured by the
-- types.ts regen co-committed with this migration.
--
-- Canon: docs/07_governance/adr/0027-ring2b-substrate.md Decision 7 / OQ-2B-2.
--        docs/07_governance/adr/0025-ring2a-core-implementation-seams.md
--        Correction 1 (no service-layer txn threading).
-- =============================================================

DROP FUNCTION IF EXISTS create_vendor_rule_atomic(JSONB, JSONB, JSONB);

CREATE OR REPLACE FUNCTION create_vendor_rule_atomic(
  p_registry      JSONB,
  p_track_record  JSONB,
  p_vendor_rule   JSONB,
  p_branches      JSONB DEFAULT '[]'::jsonb
)
RETURNS uuid AS $$
DECLARE
  v_org_id        uuid;
  v_rule_id       uuid;
  v_branches      jsonb := COALESCE(p_branches, '[]'::jsonb);
  v_branch        jsonb;
  v_branch_id     uuid;
  v_condition     jsonb;
  v_primary_count integer;
BEGIN
  v_org_id := (p_registry->>'org_id')::uuid;

  -- 1. rule_registry parent (unchanged from 20240165).
  INSERT INTO rule_registry (
    org_id, rule_type, lifecycle_state, current_rung, name, created_by
  )
  VALUES (
    v_org_id,
    (p_registry->>'rule_type')::rule_type,
    (p_registry->>'lifecycle_state')::rule_lifecycle_state,
    COALESCE((p_registry->>'current_rung')::rule_autonomy_rung, 'always_confirm'),
    p_registry->>'name',
    NULLIF(p_registry->>'created_by', '')::uuid
  )
  RETURNING id INTO v_rule_id;

  -- 2. rule_track_records co-created (unchanged).
  INSERT INTO rule_track_records (rule_id, model_version)
  VALUES (v_rule_id, NULLIF(p_track_record->>'model_version', ''));

  -- 3. vendor_rules child (unchanged).
  INSERT INTO vendor_rules (
    rule_id, org_id, vendor_id, default_account_id, legal_entity_id,
    bundle_type, approved_at, approved_by
  )
  VALUES (
    v_rule_id,
    v_org_id,
    (p_vendor_rule->>'vendor_id')::uuid,
    NULLIF(p_vendor_rule->>'default_account_id', '')::uuid,
    NULLIF(p_vendor_rule->>'legal_entity_id', '')::uuid,
    (p_vendor_rule->>'bundle_type')::bundle_type,
    NULLIF(p_vendor_rule->>'approved_at', '')::timestamptz,
    NULLIF(p_vendor_rule->>'approved_by', '')::uuid
  );

  -- 4. rule_branches + rule_conditions co-created (NEW; ADR-0027 Decision 7).
  --    Skipped when branchless (preserves current inert creation). Atomic with
  --    the parent — any failure here rolls back all four inserts.
  IF jsonb_array_length(v_branches) > 0 THEN
    -- Exactly-one-primary (≥1 half; ≤1 is the partial unique index in 20240169).
    SELECT count(*) INTO v_primary_count
      FROM jsonb_array_elements(v_branches) b
      WHERE b->>'branch_type' = 'primary';
    IF v_primary_count <> 1 THEN
      RAISE EXCEPTION 'a rule with branches must have exactly one primary branch (got %)', v_primary_count
        USING ERRCODE = 'check_violation';
    END IF;

    FOR v_branch IN SELECT * FROM jsonb_array_elements(v_branches) LOOP
      INSERT INTO rule_branches (
        rule_id, branch_order, branch_type, max_outcome_action,
        applies_to_evaluation_triggers, applies_to_source_triggers
      )
      VALUES (
        v_rule_id,
        (v_branch->>'branch_order')::integer,
        (v_branch->>'branch_type')::branch_type,
        (v_branch->>'max_outcome_action')::action_type,
        ARRAY(SELECT jsonb_array_elements_text(v_branch->'applies_to_evaluation_triggers'))::trigger_type[],
        CASE
          WHEN v_branch->'applies_to_source_triggers' IS NULL
            OR jsonb_typeof(v_branch->'applies_to_source_triggers') = 'null'
          THEN NULL
          ELSE ARRAY(SELECT jsonb_array_elements_text(v_branch->'applies_to_source_triggers'))::trigger_type[]
        END
      )
      RETURNING id INTO v_branch_id;

      FOR v_condition IN
        SELECT * FROM jsonb_array_elements(COALESCE(v_branch->'conditions', '[]'::jsonb))
      LOOP
        INSERT INTO rule_conditions (
          branch_id, condition_order, condition_type, target_field, condition_value
        )
        VALUES (
          v_branch_id,
          (v_condition->>'condition_order')::integer,
          (v_condition->>'condition_type')::condition_type,
          v_condition->>'target_field',
          v_condition->'condition_value'
        );
      END LOOP;
    END LOOP;
  END IF;

  RETURN v_rule_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION create_vendor_rule_atomic(JSONB, JSONB, JSONB, JSONB) TO service_role;
