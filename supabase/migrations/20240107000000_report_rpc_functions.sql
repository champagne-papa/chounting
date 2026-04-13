-- Migration 0007: P&L and Trial Balance RPC functions (Phase 16A)
--
-- Adds two read-only SQL functions that aggregate journal lines for
-- financial reports. These queries use PostgreSQL FILTER clauses which
-- aren't expressible through the Supabase PostgREST query builder, so
-- we use RPC functions called via adminClient().rpc().
--
-- Both functions:
-- - Use amount_cad for multi-currency correctness (overriding the Trial
--   Balance spec's native-currency columns for consistency with P&L)
-- - Accept NULL period_id for "all periods" mode
-- - Include reversed entries and their reversals; they net naturally
--   via aggregation (Q21 decision: reversals are not excluded)
-- - Use LANGUAGE sql (single SELECT, planner can inline)
-- - Use SECURITY INVOKER (respects RLS, caller's permissions)
-- - Grant EXECUTE to service_role only (service layer access)

-- ---------------------------------------------------------------------------
-- get_profit_and_loss
--
-- Returns per-account-type aggregates for P&L and Balance Sheet summary.
-- One row per account type (asset, liability, equity, revenue, expense).
-- Net income is computed UI-side as revenue.credit_total_cad - expense.debit_total_cad.

CREATE OR REPLACE FUNCTION get_profit_and_loss(
  p_org_id uuid,
  p_period_id uuid
)
RETURNS TABLE (
  account_type text,
  debit_total_cad numeric,
  credit_total_cad numeric
)
LANGUAGE sql
SECURITY INVOKER
AS $$
  SELECT
    coa.account_type::text AS account_type,
    COALESCE(SUM(jl.amount_cad) FILTER (WHERE jl.debit_amount > 0), 0) AS debit_total_cad,
    COALESCE(SUM(jl.amount_cad) FILTER (WHERE jl.credit_amount > 0), 0) AS credit_total_cad
  FROM chart_of_accounts coa
  LEFT JOIN journal_lines jl ON jl.account_id = coa.account_id
  LEFT JOIN journal_entries je ON je.journal_entry_id = jl.journal_entry_id
    AND je.org_id = p_org_id
    AND (p_period_id IS NULL OR je.fiscal_period_id = p_period_id)
  WHERE coa.org_id = p_org_id
  GROUP BY coa.account_type
  ORDER BY
    CASE coa.account_type::text
      WHEN 'asset' THEN 1
      WHEN 'liability' THEN 2
      WHEN 'equity' THEN 3
      WHEN 'revenue' THEN 4
      WHEN 'expense' THEN 5
    END;
$$;

GRANT EXECUTE ON FUNCTION get_profit_and_loss(uuid, uuid) TO service_role;

-- ---------------------------------------------------------------------------
-- get_trial_balance
--
-- Returns per-account balance totals. Uses LEFT JOIN to ensure zero-balance
-- accounts still appear in the output (required for chart-of-accounts
-- completeness — the Trial Balance should show every account the org has).

CREATE OR REPLACE FUNCTION get_trial_balance(
  p_org_id uuid,
  p_period_id uuid
)
RETURNS TABLE (
  account_id uuid,
  account_code text,
  account_name text,
  account_type text,
  debit_total_cad numeric,
  credit_total_cad numeric
)
LANGUAGE sql
SECURITY INVOKER
AS $$
  SELECT
    coa.account_id,
    coa.account_code,
    coa.account_name,
    coa.account_type::text AS account_type,
    COALESCE(SUM(jl.amount_cad) FILTER (WHERE jl.debit_amount > 0), 0) AS debit_total_cad,
    COALESCE(SUM(jl.amount_cad) FILTER (WHERE jl.credit_amount > 0), 0) AS credit_total_cad
  FROM chart_of_accounts coa
  LEFT JOIN journal_lines jl ON jl.account_id = coa.account_id
  LEFT JOIN journal_entries je ON je.journal_entry_id = jl.journal_entry_id
    AND je.org_id = p_org_id
    AND (p_period_id IS NULL OR je.fiscal_period_id = p_period_id)
  WHERE coa.org_id = p_org_id
  GROUP BY coa.account_id, coa.account_code, coa.account_name, coa.account_type
  ORDER BY coa.account_code;
$$;

GRANT EXECUTE ON FUNCTION get_trial_balance(uuid, uuid) TO service_role;
