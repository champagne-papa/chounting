-- =============================================================
-- 20240133000000_journal_immutability_triggers.sql
-- Phase 1.2 post-audit S26 — ledger-integrity Day-1 fix-stack:
--   Section A — QW-04 / UF-001: append-only enforcement on
--               journal_entries and journal_lines (immutability
--               triggers + REVOKE TRUNCATE).
--   Section B — QW-03 / UF-004: period date-range enforcement
--               (entry_date must fall within the cited fiscal
--               period's [start_date, end_date]).
--   Section C — QW-05 / UF-005: cross-org account-id guard on
--               journal_lines (account_id's org must match the
--               parent journal_entry's org).
-- =============================================================
-- Closes the three Phase 1.2 audit Quick Wins on the ledger-
-- integrity surface (docs/07_governance/audits/phase-1.2/action-plan.md
-- QW-03 / QW-04 / QW-05). Together with S25's read-path checks
-- and S27's transaction-atomicity RPC, this migration restores
-- the load-bearing INV-LEDGER-001 / INV-LEDGER-002 / INV-AUDIT-001
-- triple on the journal_entry mutation path under service_role
-- writes.
--
-- Mirrors the audit_log/events three-layer pattern shipped at
-- 20240122000000_audit_log_append_only.sql:
--   Layer 1 — RLS policies USING (false) for UPDATE/DELETE.
--   Layer 2 — BEFORE UPDATE/DELETE/TRUNCATE triggers (catch
--             service_role mutations that bypass RLS).
--   Layer 3 — REVOKE TRUNCATE from PUBLIC/authenticated/anon
--             (closes the row-level-trigger gap during TRUNCATE
--             for non-privileged roles; row-level-trigger gap is
--             the gap row-level triggers don't fire during
--             TRUNCATE; statement-level triggers catch it).
--
-- Note: RLS policies journal_entries_no_update, journal_entries_no_delete,
-- journal_lines_no_update, and journal_lines_no_delete are NOT
-- created here — they were shipped at the initial schema
-- (20240101000000, lines 734-758). This migration adds the
-- remaining two layers of the three-layer pattern: BEFORE
-- UPDATE/DELETE/TRUNCATE triggers (defense for service_role
-- bypass of RLS) and REVOKE TRUNCATE (defense against the row-
-- level-trigger gap during TRUNCATE).
--
-- See docs/02_specs/ledger_truth_model.md INV-LEDGER-001 +
-- INV-LEDGER-002 leaves; docs/07_governance/adr/0008-layer-1-enforcement-modes.md
-- for the Layer-1a classification rationale (commit-time physical
-- enforcement). UF-001 / UF-004 / UF-005 evidence in
-- docs/07_governance/audits/phase-1.2/unified-findings.md.
-- =============================================================

BEGIN;

-- =============================================================
-- Section A — QW-04: immutability triggers + REVOKE TRUNCATE on
-- journal_entries and journal_lines.
-- =============================================================

-- INV-LEDGER-001 (Layer 1a): journal_entries is append-only — no
-- UPDATE, DELETE, or TRUNCATE under any caller, including
-- service_role.  Triggers below dispatch to this function for
-- UPDATE and DELETE (row-level) and for TRUNCATE (statement-
-- level). TRUNCATE needs special handling because row-level
-- triggers do not fire during TRUNCATE — see the REVOKE block at
-- the end of this section for the second layer of TRUNCATE
-- defense.
CREATE OR REPLACE FUNCTION reject_journal_entries_mutation()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'journal_entries is append-only — UPDATE, DELETE, and TRUNCATE are forbidden'
    USING ERRCODE = 'feature_not_supported';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_journal_entries_no_update
  BEFORE UPDATE ON journal_entries
  FOR EACH ROW
  EXECUTE FUNCTION reject_journal_entries_mutation();

CREATE TRIGGER trg_journal_entries_no_delete
  BEFORE DELETE ON journal_entries
  FOR EACH ROW
  EXECUTE FUNCTION reject_journal_entries_mutation();

CREATE TRIGGER trg_journal_entries_no_truncate
  BEFORE TRUNCATE ON journal_entries
  FOR EACH STATEMENT
  EXECUTE FUNCTION reject_journal_entries_mutation();

-- INV-LEDGER-001 (Layer 1a, defense in depth on journal_entries):
-- REVOKE TRUNCATE closes the row-level-trigger gap for non-
-- privileged roles. The Supabase-managed service_role retains
-- TRUNCATE privilege by platform constraint, so
-- trg_journal_entries_no_truncate is the authoritative catch for
-- that role.
REVOKE TRUNCATE ON journal_entries FROM PUBLIC;
REVOKE TRUNCATE ON journal_entries FROM authenticated;
REVOKE TRUNCATE ON journal_entries FROM anon;

-- INV-LEDGER-001 (Layer 1a): journal_lines is append-only —
-- mirrors the journal_entries pattern above, per-table function
-- naming for grep-discoverability.
CREATE OR REPLACE FUNCTION reject_journal_lines_mutation()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'journal_lines is append-only — UPDATE, DELETE, and TRUNCATE are forbidden'
    USING ERRCODE = 'feature_not_supported';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_journal_lines_no_update
  BEFORE UPDATE ON journal_lines
  FOR EACH ROW
  EXECUTE FUNCTION reject_journal_lines_mutation();

CREATE TRIGGER trg_journal_lines_no_delete
  BEFORE DELETE ON journal_lines
  FOR EACH ROW
  EXECUTE FUNCTION reject_journal_lines_mutation();

CREATE TRIGGER trg_journal_lines_no_truncate
  BEFORE TRUNCATE ON journal_lines
  FOR EACH STATEMENT
  EXECUTE FUNCTION reject_journal_lines_mutation();

REVOKE TRUNCATE ON journal_lines FROM PUBLIC;
REVOKE TRUNCATE ON journal_lines FROM authenticated;
REVOKE TRUNCATE ON journal_lines FROM anon;

-- =============================================================
-- Section B — QW-03: period date-range enforcement on
-- journal_entries INSERT.
-- =============================================================

-- INV-LEDGER-002 (Layer 1a, date-range facet): journal entries
-- posting inside a fiscal period must have entry_date within
-- that period's [start_date, end_date] range. This complements
-- enforce_period_not_locked (the original Layer 1a period-lock
-- trigger on journal_lines, line 793 of initial schema), which
-- catches posting to a *locked* period but does NOT validate
-- date-range membership against an *unlocked* period.
-- Together: enforce_period_not_locked checks "is this period
-- writable?"; enforce_journal_entry_period_range checks "is
-- entry_date inside the period the entry claims to belong to?".
-- The two triggers fire on different tables (lines vs entries)
-- but enforce sibling facets of INV-LEDGER-002.
CREATE OR REPLACE FUNCTION enforce_journal_entry_period_range()
RETURNS TRIGGER AS $$
DECLARE
  period_start DATE;
  period_end   DATE;
BEGIN
  SELECT start_date, end_date INTO period_start, period_end
  FROM fiscal_periods WHERE period_id = NEW.fiscal_period_id;

  IF NEW.entry_date < period_start OR NEW.entry_date > period_end THEN
    RAISE EXCEPTION 'entry_date % is outside fiscal period [%, %]',
      NEW.entry_date, period_start, period_end
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_journal_entry_period_range
  BEFORE INSERT ON journal_entries
  FOR EACH ROW
  EXECUTE FUNCTION enforce_journal_entry_period_range();

-- =============================================================
-- Section C — QW-05: cross-org account-id guard on journal_lines.
-- =============================================================

-- UF-005 closure: journal_lines.account_id has a simple FK to
-- chart_of_accounts(account_id) (initial schema line 223) but no
-- composite constraint guarantees that the account's org_id
-- matches the parent journal_entry's org_id. This trigger closes
-- the gap. BEFORE INSERT OR UPDATE coverage is belt-and-suspenders:
-- journal_lines is made append-only by Section A above (so UPDATE
-- shouldn't fire today), but if Section A's UPDATE coverage is
-- ever loosened (e.g., a future migration adds a soft-delete
-- column), this trigger preserves the cross-org guarantee
-- without re-opening the gap.
CREATE OR REPLACE FUNCTION enforce_journal_line_account_org()
RETURNS TRIGGER AS $$
DECLARE
  entry_org   UUID;
  account_org UUID;
BEGIN
  SELECT org_id INTO entry_org   FROM journal_entries  WHERE journal_entry_id = NEW.journal_entry_id;
  SELECT org_id INTO account_org FROM chart_of_accounts WHERE account_id     = NEW.account_id;

  IF entry_org IS DISTINCT FROM account_org THEN
    RAISE EXCEPTION 'journal_lines.account_id (%) belongs to org % but parent journal_entry belongs to org %',
      NEW.account_id, account_org, entry_org
      USING ERRCODE = 'foreign_key_violation';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_journal_line_account_org
  BEFORE INSERT OR UPDATE ON journal_lines
  FOR EACH ROW
  EXECUTE FUNCTION enforce_journal_line_account_org();

COMMIT;
