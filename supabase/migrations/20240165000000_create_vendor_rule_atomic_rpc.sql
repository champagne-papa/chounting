-- =============================================================
-- 20240165000000_create_vendor_rule_atomic_rpc.sql
-- Ring 2A-core Commit 3 (ADR-0025 §6 / Decision 6 + Migration outline).
--
-- Atomic all-or-nothing creation of a vendor rule's three rows in one
-- transaction:
--   rule_registry (parent) → rule_track_records (co-created, ADR-0023
--   Decision 5) → vendor_rules (child, composite FK to the parent).
--
-- Mirrors write_journal_entry_atomic (20240134) — the project's only
-- multi-table atomicity primitive. There is no service-layer transaction
-- threading (ADR-0025 Correction 1 / OQ-8); ruleCreationOrchestrator
-- (services/rules/) is the sole caller.
--
-- Atomicity is the load-bearing property: a plpgsql function body runs in a
-- single transaction, so any failure rolls back ALL THREE inserts. The
-- rollback paths this activates:
--   * vendor_rules_org_legalentity_vendor_bundle_uq (20240163 §g) — a
--     duplicate (org_id, COALESCE(legal_entity_id, org_id), vendor_id,
--     bundle_type) raises unique_violation; the parent rule_registry and the
--     co-created rule_track_records roll back with it. This is the
--     orphaned-rule_registry-row integrity gap that makes atomicity required
--     (ADR-0025 Migration outline).
--   * vendor_rules_rule_registry_fk (20240163 §e) — composite (rule_id,
--     org_id). The function derives a single v_org_id for the parent and the
--     child, so a caller cannot diverge parent/child org_id and trip the FK.
--   * organizations / auth.users / chart_of_accounts FKs — invalid
--     references raise foreign_key_violation, whole function rolls back.
--
-- SECURITY DEFINER per ADR-0025 §6 / Migration outline. NOTE: the cited
-- precedent write_journal_entry_atomic (20240134) is SECURITY INVOKER. With
-- the service_role grant both bypass RLS at the call site, but DEFINER runs
-- with the owner's privileges. Flagged for a future security-mode hygiene
-- review (Ring 2A-core rollout forward-flag); not relitigated here (the ADR
-- is ratified canon with DEFINER specified).
--
-- This migration adds a function only — no table/CHECK/ENUM/UNIQUE/NOT-NULL
-- change to existing substrate, so the substrate-mod test-staleness review
-- (.claude/rules/migrations.md) does not fire. No NOT NULL column added.
--
-- Canon: docs/07_governance/adr/0025-ring2a-core-implementation-seams.md
--        §6 (Decision 6) + Migration outline.
--        docs/07_governance/adr/0023-rule-type-core-substrate.md Decision 5
--        (rule_track_records co-creation) + Decision 1 (class-table inheritance).
-- =============================================================

CREATE OR REPLACE FUNCTION create_vendor_rule_atomic(
  p_registry      JSONB,
  p_track_record  JSONB,
  p_vendor_rule   JSONB
)
RETURNS uuid AS $$
DECLARE
  v_org_id   uuid;
  v_rule_id  uuid;
BEGIN
  -- org_id is taken from p_registry and reused for the vendor_rules child so
  -- the composite FK (rule_id, org_id) cannot be violated by a caller passing
  -- a divergent org_id in p_vendor_rule.
  v_org_id := (p_registry->>'org_id')::uuid;

  -- 1. rule_registry parent. id is DB-generated (DEFAULT gen_random_uuid())
  --    and captured for both children; the caller never supplies it.
  --    current_rung defaults to 'always_confirm' when p_registry omits it
  --    (v1: every new rule starts at always_confirm).
  INSERT INTO rule_registry (
    org_id,
    rule_type,
    lifecycle_state,
    current_rung,
    name,
    created_by
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

  -- 2. rule_track_records co-created (ADR-0023 Decision 5). Counters default
  --    to 0; only model_version (inferential rules) is carried from input.
  INSERT INTO rule_track_records (rule_id, model_version)
  VALUES (
    v_rule_id,
    NULLIF(p_track_record->>'model_version', '')
  );

  -- 3. vendor_rules child. rule_id = the parent id (class-table inheritance,
  --    1:1; composite FK (rule_id, org_id) → rule_registry(id, org_id)).
  INSERT INTO vendor_rules (
    rule_id,
    org_id,
    vendor_id,
    default_account_id,
    legal_entity_id,
    bundle_type,
    approved_at,
    approved_by
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

  RETURN v_rule_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION create_vendor_rule_atomic(JSONB, JSONB, JSONB) TO service_role;
