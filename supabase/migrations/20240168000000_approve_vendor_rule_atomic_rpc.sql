-- =============================================================
-- 20240168000000_approve_vendor_rule_atomic_rpc.sql
-- Ring 2A-authoring (ADR-0026 Decision 5, as amended 2026-05-29).
--
-- The vendor-template approval ceremony: an atomic two-table transition of an
-- already-created ('proposed') vendor rule to its active, approved state.
--   * vendor_rules.approved_at / approved_by  ← provenance (who approved, when)
--   * rule_registry.lifecycle_state = 'active' ← the functional activation gate
--     (ruleEvaluationService.evaluate filters candidates on lifecycle_state =
--     'active'; a 'proposed' rule is never evaluated).
--
-- Transition-sibling of create_vendor_rule_atomic (20240165): the create RPC
-- writes the same two tables (+ rule_track_records) at creation in the 'proposed'
-- state; this RPC transitions the already-created rows. lifecycle_state is a
-- stored column set explicitly here — it is NOT derived from approved_at (migration
-- 20240163 §d's CASE is a one-time backfill, not a runtime mechanism; see ADR-0026
-- Amended 2026-05-29).
--
-- Atomicity is the load-bearing property: a plpgsql function body runs in a single
-- transaction, so an orphaned half-approve (approved_at set but lifecycle_state
-- still 'proposed', or vice versa) cannot persist. vendorRuleService.approve is the
-- sole caller (a thin wrapper, mirroring how ruleCreationOrchestrator wraps the
-- create RPC).
--
-- Idempotency: a NOT-FOUND rule returns NULL (the caller maps to RULE_NOT_FOUND);
-- an already-approved rule (approved_at IS NOT NULL) is a no-op return with no
-- re-write (preserving the original approver + timestamp). The vendor_rules UPDATE
-- additionally carries `approved_at IS NULL` as race-safe defense-in-depth (a
-- concurrent approve landing between the wrapper's read and this call no-ops the
-- write rather than double-stamping). The rule_registry UPDATE is naturally
-- idempotent (active-when-already-active is a no-op write).
--
-- SECURITY DEFINER per the create_vendor_rule_atomic precedent. With the
-- service_role grant both bypass RLS at the call site, but DEFINER runs with the
-- owner's privileges. The DEFINER-vs-INVOKER hygiene review the create RPC
-- forward-flagged (Ring 2A-core rollout) carries to this sibling RPC; not
-- relitigated here (ADR-0026 Decision 5 specifies the RPC).
--
-- This migration adds a function only — no table/CHECK/ENUM/UNIQUE/NOT-NULL change
-- to existing substrate (the approved_at / approved_by / lifecycle_state columns
-- already exist per 20240163), so the substrate-mod test-staleness review
-- (.claude/rules/migrations.md) does not fire. No types.ts regen.
--
-- Canon: docs/07_governance/adr/0026-ring2a-authoring.md Decision 5 (amended
--        2026-05-29) + Migration outline.
--        docs/02_specs/rule-type-core.md §5.2 (v1 branchless) + §6.1 (evaluate
--        candidate set = active rules).
-- =============================================================

CREATE OR REPLACE FUNCTION approve_vendor_rule_atomic(
  p_rule_id     uuid,
  p_org_id      uuid,
  p_approved_by uuid
)
RETURNS uuid AS $$
DECLARE
  v_existing_approved_at timestamptz;
BEGIN
  -- Org-scoped existence + current approval state, in the same transaction as
  -- the writes. A NOT-FOUND (cross-org or absent rule) returns NULL.
  SELECT approved_at INTO v_existing_approved_at
  FROM vendor_rules
  WHERE rule_id = p_rule_id AND org_id = p_org_id;

  IF NOT FOUND THEN
    RETURN NULL;                 -- caller maps to RULE_NOT_FOUND
  END IF;

  IF v_existing_approved_at IS NOT NULL THEN
    RETURN p_rule_id;            -- idempotent: already approved; no re-write
  END IF;

  -- 1. vendor_rules provenance. The approved_at IS NULL guard is race-safe
  --    defense-in-depth (a concurrent approve no-ops this write rather than
  --    overwriting the first approver/timestamp).
  UPDATE vendor_rules
  SET approved_at = now(), approved_by = p_approved_by
  WHERE rule_id = p_rule_id AND org_id = p_org_id AND approved_at IS NULL;

  -- 2. rule_registry functional activation gate. Naturally idempotent.
  UPDATE rule_registry
  SET lifecycle_state = 'active'
  WHERE id = p_rule_id AND org_id = p_org_id;

  RETURN p_rule_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION approve_vendor_rule_atomic(uuid, uuid, uuid) TO service_role;
