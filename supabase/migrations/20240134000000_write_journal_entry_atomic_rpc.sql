-- =============================================================
-- 20240134000000_write_journal_entry_atomic_rpc.sql
-- Phase 1.2 S27 MT-01-rpc — atomic journal-entry write RPC.
-- =============================================================
-- Replaces the four-call insert sequence in
-- src/services/accounting/journalEntryService.ts:post() (period
-- read → MAX+1 entry_number read → INSERT journal_entries →
-- INSERT journal_lines → recordMutation INSERT audit_log) with a
-- single plpgsql function so the three INSERTs commit atomically
-- inside one BEGIN/COMMIT envelope rather than across separate
-- PostgREST round-trips.
--
-- Atomicity is the load-bearing property of this migration. The
-- rollback paths it activates are:
--   * enforce_journal_entry_balance (initial schema, line 279) —
--     CONSTRAINT TRIGGER, DEFERRABLE INITIALLY DEFERRED. Fires at
--     COMMIT, not per-statement, so the multi-line INSERT inside
--     this RPC can transiently unbalance during execution and
--     still abort cleanly at COMMIT if sum(debits) ≠ sum(credits).
--     Without the deferred-constraint timing, partial inserts
--     would be visible to readers between the journal_entries
--     INSERT and the journal_lines INSERT and balance enforcement
--     would have to move into the service layer.
--   * enforce_period_not_locked (initial schema, journal_lines
--     INSERT trigger) — fires per-statement inside the RPC. If
--     the period is locked between the service-layer pre-check
--     and the RPC's INSERT, the trigger raises check_violation
--     and the whole RPC envelope rolls back.
--   * trg_journal_entry_period_range (S26 QW-03, journal_entries
--     INSERT trigger) — entry_date outside the period's date
--     range raises check_violation, RPC rolls back.
--   * trg_journal_line_account_org (S26 QW-05, journal_lines
--     INSERT trigger) — cross-org account_id raises
--     foreign_key_violation, RPC rolls back. This is the
--     S26↔S27 boundary the arc was designed to verify (see
--     postJournalEntryRpcRollback.test.ts Test 3).
--   * journal_lines FK to chart_of_accounts — invalid
--     account_id raises foreign_key_violation, RPC rolls back.
--   * unique_entry_number_per_org_period (migration 0004) —
--     concurrent post-collision raises unique_violation, RPC
--     rolls back (collision is functionally zero today under
--     Phase 1.2 single-controller-per-org, the FOR-UPDATE fix
--     is deferred to Phase 2 mobile-approval scope, see S27
--     friction-journal entry).
--
-- INV-AUDIT-001 (Layer 2): the audit_log INSERT moves into this
-- function. Splitting audit out of the RPC envelope would defeat
-- the same-transaction-dispatch guarantee that makes audit
-- trustworthy (see ledger_truth_model.md INV-AUDIT-001 leaf).
-- The service layer constructs the audit JSONB and applies
-- redactPii() (S25 QW-07) before calling this RPC, the RPC
-- inserts the already-redacted JSONB as-is.
--
-- Service-layer pre-checks (period lookup, period_lock check,
-- period date-range check, reversal-mirror validation) remain
-- in journalEntryService.ts as defense-in-depth and for typed
-- ServiceError UX. The DB triggers above are the final guard,
-- they catch race-window violations the service-layer pre-check
-- cannot.
--
-- See docs/02_specs/ledger_truth_model.md INV-LEDGER-001 /
-- INV-LEDGER-002 / INV-AUDIT-001 leaves for the invariant
-- text, docs/09_briefs/S27-mt-01-rpc.md for the arc brief and
-- pre-decisions, the brief's Task 3 plan surface for the
-- seven approval gates this migration ratifies.
-- =============================================================

CREATE OR REPLACE FUNCTION write_journal_entry_atomic(
  p_entry  JSONB,
  p_lines  JSONB,
  p_audit  JSONB
)
RETURNS TABLE (
  journal_entry_id UUID,
  entry_number     INTEGER
) AS $$
DECLARE
  v_org_id            UUID;
  v_fiscal_period_id  UUID;
  v_journal_entry_id  UUID;
  v_entry_number      INTEGER;
BEGIN
  -- p_entry payload is canonical for org_id and fiscal_period_id.
  -- Both are echoed back from the input, never client-trusted (the
  -- service layer constructs p_entry from a Zod-parsed input).
  v_org_id           := (p_entry->>'org_id')::uuid;
  v_fiscal_period_id := (p_entry->>'fiscal_period_id')::uuid;

  -- entry_number = MAX(entry_number) + 1 within (org_id, period).
  -- No FOR UPDATE — the unique_entry_number_per_org_period
  -- constraint (migration 0004) is the collision detector. Phase
  -- 1.2 single-controller-per-org makes the race window
  -- functionally zero today. FOR-UPDATE-locked allocation
  -- bundles with Phase 2 cross-turn caching scope where
  -- concurrent posting becomes plausible (see S27 friction-
  -- journal entry on the entry_number UNIQUE deferral).
  SELECT COALESCE(MAX(je.entry_number), 0) + 1
    INTO v_entry_number
    FROM journal_entries je
   WHERE je.org_id           = v_org_id
     AND je.fiscal_period_id = v_fiscal_period_id;

  -- INSERT journal_entries. Field order mirrors the service-layer
  -- insert that this RPC replaces (journalEntryService.ts post()
  -- pre-S27, lines ~166–197). entry_type is derived in the service
  -- layer from the discriminator (regular/reversing/adjusting) and
  -- passed through. The RPC trusts the caller for entry_type per
  -- pre-decision #3 (no plpgsql discriminator logic).
  INSERT INTO journal_entries (
    org_id,
    fiscal_period_id,
    entry_date,
    description,
    reference,
    source,
    source_system,
    idempotency_key,
    reverses_journal_entry_id,
    reversal_reason,
    adjustment_reason,
    entry_number,
    entry_type,
    created_by
  )
  VALUES (
    v_org_id,
    v_fiscal_period_id,
    (p_entry->>'entry_date')::date,
    p_entry->>'description',
    p_entry->>'reference',
    (p_entry->>'source')::journal_entry_source,
    p_entry->>'source_system',
    NULLIF(p_entry->>'idempotency_key', '')::uuid,
    NULLIF(p_entry->>'reverses_journal_entry_id', '')::uuid,
    p_entry->>'reversal_reason',
    p_entry->>'adjustment_reason',
    v_entry_number,
    (p_entry->>'entry_type')::entry_type,
    NULLIF(p_entry->>'created_by', '')::uuid
  )
  RETURNING journal_entries.journal_entry_id INTO v_journal_entry_id;

  -- INSERT journal_lines. p_lines is a JSONB array of line
  -- payloads. jsonb_array_elements expands it into rows, and the
  -- per-row column extracts mirror the service-layer insert.
  -- The deferred enforce_journal_entry_balance constraint fires
  -- at COMMIT and validates sum(debit) = sum(credit) across the
  -- just-inserted lines.
  INSERT INTO journal_lines (
    journal_entry_id,
    account_id,
    description,
    debit_amount,
    credit_amount,
    currency,
    amount_original,
    amount_cad,
    fx_rate,
    tax_code_id
  )
  SELECT
    v_journal_entry_id,
    (line->>'account_id')::uuid,
    line->>'description',
    (line->>'debit_amount')::numeric,
    (line->>'credit_amount')::numeric,
    line->>'currency',
    (line->>'amount_original')::numeric,
    (line->>'amount_cad')::numeric,
    (line->>'fx_rate')::numeric,
    NULLIF(line->>'tax_code_id', '')::uuid
  FROM jsonb_array_elements(p_lines) AS line;

  -- INSERT audit_log. p_audit is constructed by the service layer
  -- with redactPii() already applied to before_state per Gate 3
  -- (option a). Today's post path passes before_state = null,
  -- and the redact call site is preserved as a forward-compatibility
  -- provision so future paths that populate before_state are
  -- redacted automatically without RPC changes.
  --
  -- entity_id is set to the journal_entry_id we just inserted,
  -- so the service-layer caller does NOT need to round-trip this
  -- value (it is not known until the entries INSERT returns).
  INSERT INTO audit_log (
    org_id,
    user_id,
    trace_id,
    action,
    entity_type,
    entity_id,
    before_state,
    after_state_id,
    tool_name,
    idempotency_key,
    reason
  )
  VALUES (
    NULLIF(p_audit->>'org_id', '')::uuid,
    NULLIF(p_audit->>'user_id', '')::uuid,
    (p_audit->>'trace_id')::uuid,
    p_audit->>'action',
    p_audit->>'entity_type',
    v_journal_entry_id,
    p_audit->'before_state',
    NULLIF(p_audit->>'after_state_id', '')::uuid,
    p_audit->>'tool_name',
    NULLIF(p_audit->>'idempotency_key', '')::uuid,
    p_audit->>'reason'
  );

  -- Return the assigned (journal_entry_id, entry_number) tuple.
  -- Supabase exposes RETURNS TABLE as a JSON array client-side
  -- and the TS service destructures index 0.
  RETURN QUERY SELECT v_journal_entry_id, v_entry_number;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER;

GRANT EXECUTE ON FUNCTION write_journal_entry_atomic(JSONB, JSONB, JSONB) TO service_role;
