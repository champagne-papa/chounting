-- =============================================================
-- 20240122000000_audit_log_append_only.sql
-- Phase 1.x: append-only enforcement for audit_log (INV-AUDIT-002)
-- =============================================================
-- Makes the audit_log table append-only at the database level.
-- Mirrors INV-LEDGER-003's pattern on the events table: three
-- triggers + two RLS policies + three REVOKEs, defense in depth.
--
-- audit_log is actively written today by every mutating service
-- function (via recordMutation() — see INV-AUDIT-001). Once
-- written, the row must be permanent — the audit trail's
-- trustworthiness depends on it. Without this migration a
-- service-role bug, a malicious caller holding service-role
-- credentials, or a misconfigured REPL session could rewrite or
-- erase history between write and read.
--
-- Paired invariant: INV-AUDIT-001 (Layer 2) guarantees every
-- mutation writes an audit_log row; INV-AUDIT-002 (Layer 1a,
-- this migration) guarantees that row is permanent. Together:
-- every mutation produces a permanent audit record.
--
-- See docs/02_specs/ledger_truth_model.md INV-AUDIT-002 (Layer 1a)
-- leaf for full rationale, Phase 2 evolution notes, and the
-- pairing with INV-AUDIT-001. See
-- docs/07_governance/adr/0008-layer-1-enforcement-modes.md for
-- the 1a classification test (commit-time physical enforcement).
-- =============================================================

BEGIN;

-- INV-AUDIT-002 (Layer 1a): audit_log table is append-only — no UPDATE, DELETE, or TRUNCATE.
-- Triggers below dispatch to this function for UPDATE and DELETE (row-level)
-- and for TRUNCATE (statement-level). TRUNCATE needs special handling
-- because row-level triggers do not fire during TRUNCATE — see the
-- REVOKE block below for the second layer of TRUNCATE defense.
CREATE OR REPLACE FUNCTION reject_audit_log_mutation()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'audit_log is append-only — UPDATE, DELETE, and TRUNCATE are forbidden'
    USING ERRCODE = 'feature_not_supported';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_audit_log_no_update
  BEFORE UPDATE ON audit_log
  FOR EACH ROW
  EXECUTE FUNCTION reject_audit_log_mutation();

CREATE TRIGGER trg_audit_log_no_delete
  BEFORE DELETE ON audit_log
  FOR EACH ROW
  EXECUTE FUNCTION reject_audit_log_mutation();

CREATE TRIGGER trg_audit_log_no_truncate
  BEFORE TRUNCATE ON audit_log
  FOR EACH STATEMENT
  EXECUTE FUNCTION reject_audit_log_mutation();

-- Explicit RLS policies that deny UPDATE and DELETE for user-scoped
-- clients. audit_log already has RLS enabled and a SELECT policy;
-- the absence of UPDATE/DELETE policies already denies those
-- operations by default for authenticated/anon roles. Adding
-- explicit USING (false) policies makes the intent discoverable
-- from `\d audit_log` in psql and guards against a future migration
-- accidentally broadening the default-deny by adding a UPDATE or
-- DELETE policy without re-evaluating append-only. The triggers
-- above are the authoritative enforcement for the service-role
-- client, which bypasses RLS entirely; the policies are the
-- surfaced intent for everyone else.
CREATE POLICY audit_log_no_update ON audit_log
  FOR UPDATE USING (false);

CREATE POLICY audit_log_no_delete ON audit_log
  FOR DELETE USING (false);

-- INV-AUDIT-002 (Layer 1a, defense in depth): REVOKE TRUNCATE closes the
-- row-level-trigger gap. Row-level triggers (trg_audit_log_no_update,
-- trg_audit_log_no_delete) do not fire during TRUNCATE; the statement-
-- level trg_audit_log_no_truncate catches it, but a role with TRUNCATE
-- privilege could still attempt the operation. REVOKE from every
-- non-privileged role removes the privilege itself. The Supabase-
-- managed service_role retains the privilege by platform constraint,
-- so trg_audit_log_no_truncate is the authoritative catch for that role.
REVOKE TRUNCATE ON audit_log FROM PUBLIC;
REVOKE TRUNCATE ON audit_log FROM authenticated;
REVOKE TRUNCATE ON audit_log FROM anon;

COMMIT;
