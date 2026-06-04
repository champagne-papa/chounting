-- =============================================================
-- 20240175000000_wave_6_d3_write_journal_entry_atomic_source_external_id.sql
-- Wave 6 D3 T1 — additive RPC amendment: write_journal_entry_atomic
-- gains the source_external_id INSERT column.
-- =============================================================
-- Provenance: D3 brief D-4.5 (2026-06-04-wave-6-d3-review-approve-post-
-- brief.md, LOCKED 2aa3c911), confirmed at the brief read-back: the
-- 20240134 body writes source_system (p_entry->>'source_system') but
-- omits source_external_id from both the INSERT column list and the
-- VALUES — so the partial unique index idx_je_source_external
-- (20240111: (org_id, source_system, source_external_id) WHERE
-- source_external_id IS NOT NULL, "prevents double-ingestion of the
-- same external transaction") never binds for any service-path write.
--
-- D3's human approve→post sets source_external_id = document_case_id
-- (one post per case), making the partial index the Layer-1
-- double-post guard: a re-entry after a post-then-crash recovery
-- raises 23505 naming idx_je_source_external, which the service maps
-- to the typed DUPLICATE_SOURCE_EXTERNAL_ID code (D3 T2) and the
-- approve-post route treats as already-posted (look up the existing
-- JE by the triple, complete the committed marking — no second write).
--
-- Change relative to 20240134: EXACTLY two lines — source_external_id
-- added to the journal_entries INSERT column list (after
-- source_system) and NULLIF(p_entry->>'source_external_id', '') added
-- to VALUES at the same position. NULLIF-empty deliberately (brief
-- D-4.5): an empty string must never bind the unique triple — NULL
-- (key absent, '' supplied, or pre-D3 callers) is skipped by the
-- partial index, preserving every existing caller's behavior
-- (manual/agent/import entries without external ids remain
-- unlimited). Everything else is a verbatim transcription of the
-- 20240134 body (verify-from-disk at authoring, 2026-06-04).
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
  -- Wave 6 D3: source_external_id added (see migration header).
  INSERT INTO journal_entries (
    org_id,
    fiscal_period_id,
    entry_date,
    description,
    reference,
    source,
    source_system,
    source_external_id,
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
    NULLIF(p_entry->>'source_external_id', ''),
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
