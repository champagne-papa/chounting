-- =============================================================
-- 20240125000000_account_balance_rpc.sql
-- Phase 0-1.1 Control Foundations Step 6: get_account_balance RPC
-- =============================================================
-- Adds a single read-only SQL function that returns the
-- point-in-time CAD balance for one account as of a specific date.
-- This is the canonical account-balance lookup consumed by Step 7's
-- Balance Sheet, Step 8's drill-down reports, and any future
-- consumer that needs "balance at a moment in time."
--
-- Function shape:
--   get_account_balance(p_org_id, p_account_id, p_as_of_date)
--   → TABLE (balance_cad numeric)  -- single-row TABLE return for
--                                     Supabase RPC array convention
--
-- Design decisions (per S8-0423-arc-A-step6 brief):
--
--   - Inclusive-of-day: `je.entry_date <= p_as_of_date`. Matches
--     get_balance_sheet (Step 7) and get_accounts_by_type
--     (Step 8). See brief §3.1.
--
--   - Debit-positive convention. Returns
--     SUM(debit amount_cad) - SUM(credit amount_cad). For
--     asset/expense accounts the natural balance is positive; for
--     liability/equity/revenue accounts it is negative. Sign
--     flipping per account type is the caller's responsibility —
--     the RPC does not bake in account-type polarity.
--
--   - No entry_type filter (Q21 decision, mirrors get_trial_balance
--     / get_profit_and_loss in 20240107000000_report_rpc_functions.sql).
--     Reversing entries are included; they net naturally against
--     their originals via aggregation.
--
--   - No DEFAULT on p_as_of_date. The service layer
--     (accountBalanceService) owns the "today" default via
--     `new Date().toISOString().slice(0, 10)`, matching the
--     reportService `?? null` pattern. Keeping the default out of
--     the RPC keeps integration tests deterministic against a
--     fixed DB clock.
--
--   - Belt-and-suspenders org filter. SECURITY INVOKER + RLS
--     already isolate cross-org data, but the explicit
--     `je.org_id = p_org_id AND coa.org_id = p_org_id` predicates
--     are retained as defense in depth. If a future migration
--     flips this RPC to SECURITY DEFINER for performance, the
--     explicit predicates keep cross-org isolation intact without
--     depending on the RLS policies being in force at call time.
--
--   - Account-existence semantic: LEFT JOIN + COALESCE returns
--     0.0000 for a nonexistent or cross-org account_id. No
--     NOT_FOUND error path — matches get_trial_balance's handling
--     of zero-activity accounts. Primary consumers (Steps 7/8)
--     drive account_id from a prior CoA query, so typo-detection
--     is not an ergonomic concern.
--
-- Cross-references:
--   - Brief §3.1 (inclusive-of-day), §4 (ship order Step 6), §6
--     (discipline backstop — registration deferred to Step 12),
--     §7 (migration slot — re-slotted from 20240124000000 to
--     20240125000000 because Step 3 shipped 20240124000000_add_
--     period_unlock_permission.sql first).
--   - 20240107000000_report_rpc_functions.sql header comment for
--     the Q21 decision on reversing-entry aggregation.
-- =============================================================

BEGIN;

CREATE OR REPLACE FUNCTION get_account_balance(
  p_org_id uuid,
  p_account_id uuid,
  p_as_of_date date
)
RETURNS TABLE (balance_cad numeric)
LANGUAGE sql
SECURITY INVOKER
AS $$
  -- Join structure note: uses INNER JOINs with the date filter in the
  -- WHERE clause, NOT the LEFT JOIN chain that get_trial_balance and
  -- get_profit_and_loss use. The LEFT JOIN pattern with a date filter
  -- on the outer-table join condition does not correctly exclude
  -- journal_lines when the journal_entries side fails the filter —
  -- the LEFT JOIN preserves the jl row with je NULL, and the SUM of
  -- jl.amount_cad includes it regardless of the je filter. For a
  -- single-account balance lookup the "preserve zero-activity rows"
  -- rationale for LEFT JOIN does not apply: we want only rows that
  -- match every criterion, and COALESCE(SUM, 0) handles the empty-
  -- result case (nonexistent account, cross-org account, zero-
  -- activity account) uniformly.
  SELECT
    COALESCE(SUM(jl.amount_cad) FILTER (WHERE jl.debit_amount > 0), 0) -
    COALESCE(SUM(jl.amount_cad) FILTER (WHERE jl.credit_amount > 0), 0)
      AS balance_cad
  FROM journal_lines jl
  JOIN journal_entries je ON je.journal_entry_id = jl.journal_entry_id
  JOIN chart_of_accounts coa ON coa.account_id = jl.account_id
  WHERE jl.account_id = p_account_id
    -- Belt-and-suspenders org filter (see header). Defense in depth
    -- against a future SECURITY DEFINER flip.
    AND coa.org_id = p_org_id
    AND je.org_id = p_org_id
    AND je.entry_date <= p_as_of_date;
$$;

GRANT EXECUTE ON FUNCTION get_account_balance(uuid, uuid, date) TO service_role;

COMMIT;
