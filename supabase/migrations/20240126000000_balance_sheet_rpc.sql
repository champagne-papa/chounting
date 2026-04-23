-- =============================================================
-- 20240126000000_balance_sheet_rpc.sql
-- Phase 0-1.1 Control Foundations Step 7: get_balance_sheet RPC
-- =============================================================
-- Adds a single read-only SQL function that returns the
-- point-in-time Balance Sheet for one org as of a specific date.
-- Consumed by BasicBalanceSheetView.tsx via the
-- /api/orgs/[orgId]/reports/balance-sheet GET route and by
-- reportService.balanceSheet.
--
-- Function shape:
--   get_balance_sheet(p_org_id, p_as_of_date)
--   → TABLE (account_type text, total_cad numeric)
--     Returns exactly 4 rows, in fixed order:
--       'asset', 'liability', 'equity', 'current_earnings'
--
-- Design decisions (per S8-0423-arc-A-step7 state-check):
--
--   - D1: Sign convention — PRE-FLIP IN RPC. Unlike
--     get_account_balance (Step 6, 20240125000000) which returns
--     debit-positive and delegates sign-flipping to the caller,
--     this RPC knows the account_type directly and pre-flips per
--     type. All four returned rows are naturally positive for
--     normal-balance activity. Consumers must NOT apply a second
--     sign flip.
--
--       asset:             SUM(debit)  - SUM(credit)   (debit-positive)
--       liability:         SUM(credit) - SUM(debit)    (credit-positive)
--       equity:            SUM(credit) - SUM(debit)    (credit-positive)
--       current_earnings:  revenue_net - expense_net
--                        = (SUM(revenue credit) - SUM(revenue debit))
--                        - (SUM(expense debit)  - SUM(expense credit))
--                        (positive = profit; negative = loss)
--
--   - D8: 4-arm UNION ALL with in-RPC current-earnings synthesis.
--     The 4-row contract from brief §3.1 is expressed as four
--     SELECT arms, each with its own INNER JOIN chain. Keeps the
--     RPC as the single source of truth for Balance Sheet shape;
--     service layer just flattens 4 rows → named scalar fields.
--
--   - Inclusive-of-day: je.entry_date <= p_as_of_date. Matches
--     get_account_balance (Step 6) and get_accounts_by_type
--     (Step 8). See brief §3.1.
--
--   - No entry_type filter (Q21 decision, carried from Step 6).
--     Reversing entries are included; they net naturally against
--     their originals via aggregation.
--
--   - No DEFAULT on p_as_of_date. The service layer
--     (reportService.balanceSheet) owns the "today" default via
--     `new Date().toISOString().slice(0, 10)`, matching the
--     accountBalanceService pattern. Keeping the default out of
--     the RPC keeps integration tests deterministic.
--
--   - Belt-and-suspenders org filter. SECURITY INVOKER + RLS
--     already isolate cross-org data; the explicit
--     `coa.org_id = p_org_id AND je.org_id = p_org_id` predicates
--     are defense-in-depth (carries Step 6 discipline).
--
--   - Equity arm covers CoA account_type = 'equity' ONLY (Share
--     Capital, Retained Earnings). Revenue and expense do NOT
--     contribute to the equity arm; they synthesize into the
--     current_earnings arm instead. This is the brief §3.1
--     decomposition: equity_base (equity accounts) + current_earnings
--     (revenue − expense) = total equity.
--
-- RPC structural discipline (load-bearing, per Step 6 latent-bug
-- lesson documented as Step 12 doc-sync queue item 7):
--
--   Each arm uses INNER JOINs with filter predicates in the WHERE
--   clause — NOT LEFT JOINs with filters on the join condition.
--   The latter pattern (used by get_profit_and_loss and
--   get_trial_balance in 20240107000000_report_rpc_functions.sql)
--   preserves journal_lines rows with NULL journal_entries when
--   the outer filter fails, causing the SUM to include rows the
--   filter should have excluded. Balance Sheet correctness
--   depends on the date filter actually excluding later-dated
--   entries, so INNER JOIN + filter-in-WHERE is the correct shape.
--   Structural template: get_account_balance (Step 6).
--
-- Cross-references:
--   - Brief §3.1 (4-row Balance Sheet lock, inclusive-of-day,
--     equation check rationale).
--   - Brief §4 (ship order Step 7).
--   - Brief §7 (migration slot — re-slotted from 20240125000000
--     to 20240126000000 because Steps 3 and 6 shifted the
--     baseline).
--   - Brief §11.1 gate 3 (psql round-trip).
--   - 20240125000000_account_balance_rpc.sql (structural template,
--     INNER JOIN discipline).
--   - 20240107000000_report_rpc_functions.sql (Q21 decision on
--     reversing-entry aggregation; do NOT mirror LEFT JOIN shape).
-- =============================================================

BEGIN;

CREATE OR REPLACE FUNCTION get_balance_sheet(
  p_org_id uuid,
  p_as_of_date date
)
RETURNS TABLE (account_type text, total_cad numeric)
LANGUAGE sql
SECURITY INVOKER
AS $$
  -- Arm 1: asset (pre-flipped debit-positive; naturally positive
  -- for normal-balance activity).
  SELECT
    'asset'::text AS account_type,
    COALESCE(SUM(jl.amount_cad) FILTER (WHERE jl.debit_amount > 0), 0) -
    COALESCE(SUM(jl.amount_cad) FILTER (WHERE jl.credit_amount > 0), 0)
      AS total_cad
  FROM journal_lines jl
  JOIN journal_entries je ON je.journal_entry_id = jl.journal_entry_id
  JOIN chart_of_accounts coa ON coa.account_id = jl.account_id
  WHERE coa.org_id = p_org_id
    AND je.org_id  = p_org_id
    AND je.entry_date <= p_as_of_date
    AND coa.account_type = 'asset'

  UNION ALL

  -- Arm 2: liability (pre-flipped credit-positive).
  SELECT
    'liability'::text AS account_type,
    COALESCE(SUM(jl.amount_cad) FILTER (WHERE jl.credit_amount > 0), 0) -
    COALESCE(SUM(jl.amount_cad) FILTER (WHERE jl.debit_amount > 0), 0)
      AS total_cad
  FROM journal_lines jl
  JOIN journal_entries je ON je.journal_entry_id = jl.journal_entry_id
  JOIN chart_of_accounts coa ON coa.account_id = jl.account_id
  WHERE coa.org_id = p_org_id
    AND je.org_id  = p_org_id
    AND je.entry_date <= p_as_of_date
    AND coa.account_type = 'liability'

  UNION ALL

  -- Arm 3: equity_base (pre-flipped credit-positive). Covers
  -- Share Capital + Retained Earnings (CoA account_type =
  -- 'equity'). Revenue and expense do NOT contribute here —
  -- they synthesize into the current_earnings arm.
  SELECT
    'equity'::text AS account_type,
    COALESCE(SUM(jl.amount_cad) FILTER (WHERE jl.credit_amount > 0), 0) -
    COALESCE(SUM(jl.amount_cad) FILTER (WHERE jl.debit_amount > 0), 0)
      AS total_cad
  FROM journal_lines jl
  JOIN journal_entries je ON je.journal_entry_id = jl.journal_entry_id
  JOIN chart_of_accounts coa ON coa.account_id = jl.account_id
  WHERE coa.org_id = p_org_id
    AND je.org_id  = p_org_id
    AND je.entry_date <= p_as_of_date
    AND coa.account_type = 'equity'

  UNION ALL

  -- Arm 4: current_earnings (synthesized). Revenue is credit-
  -- positive in its normal balance; expense is debit-positive.
  -- Positive current_earnings means profit; negative means loss.
  -- This row is what brief §3.1 requires for the equation check
  -- to balance mid-period without a closing-entry workflow.
  SELECT
    'current_earnings'::text AS account_type,
    (
      COALESCE(SUM(jl.amount_cad) FILTER (WHERE jl.credit_amount > 0 AND coa.account_type = 'revenue'), 0) -
      COALESCE(SUM(jl.amount_cad) FILTER (WHERE jl.debit_amount > 0  AND coa.account_type = 'revenue'), 0)
    ) - (
      COALESCE(SUM(jl.amount_cad) FILTER (WHERE jl.debit_amount > 0  AND coa.account_type = 'expense'), 0) -
      COALESCE(SUM(jl.amount_cad) FILTER (WHERE jl.credit_amount > 0 AND coa.account_type = 'expense'), 0)
    ) AS total_cad
  FROM journal_lines jl
  JOIN journal_entries je ON je.journal_entry_id = jl.journal_entry_id
  JOIN chart_of_accounts coa ON coa.account_id = jl.account_id
  WHERE coa.org_id = p_org_id
    AND je.org_id  = p_org_id
    AND je.entry_date <= p_as_of_date
    AND coa.account_type IN ('revenue', 'expense');
$$;

GRANT EXECUTE ON FUNCTION get_balance_sheet(uuid, date) TO service_role;

COMMIT;
