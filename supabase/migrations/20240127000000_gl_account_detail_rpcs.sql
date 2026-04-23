-- =============================================================
-- 20240127000000_gl_account_detail_rpcs.sql
-- Phase 0-1.1 Control Foundations Step 8a:
-- GL account detail RPCs (get_account_ledger + get_accounts_by_type)
-- =============================================================
-- Adds two read-only SQL functions consumed by Step 8 drill-down
-- views:
--
--   - get_account_ledger(p_org_id, p_account_id, p_period_id)
--     → TABLE (journal_entry_id, entry_number, entry_date,
--             description, debit_amount, credit_amount,
--             amount_cad, running_balance)
--     Ordered journal-line history for one account with a running-
--     balance window function. Consumed in Step 8a by
--     AccountLedgerView via the
--     /api/orgs/[orgId]/reports/account-ledger GET route.
--
--   - get_accounts_by_type(p_org_id, p_account_type, p_period_id)
--     → TABLE (account_id, account_code, account_name,
--             debit_total_cad, credit_total_cad)
--     Per-account debit/credit totals filtered to one account
--     type. Consumed in Step 8b by AccountsByTypeView via the
--     /api/orgs/[orgId]/reports/accounts-by-type GET route.
--
-- Both RPCs share this file per brief §7 migration 5.
--
-- Design decisions (per S8-0423-arc-A-step8a-tb-ledger
-- state-check ratification):
--
--   - INNER JOIN discipline. Both RPCs use INNER JOINs with
--     filter predicates in the WHERE clause — NOT LEFT JOINs
--     with filters on the join condition. Per Step 6 latent-bug
--     lesson (Step 12 doc-sync queue item 7); template:
--     20240125000000_account_balance_rpc.sql. The strict-
--     equality period filter (fiscal_period_id = p_period_id)
--     would tolerate LEFT JOIN here, but uniformity with Step
--     6/7 RPCs reduces cognitive load and protects against
--     someone re-deriving the wrong lesson from a precedent
--     that exists only by accident of filter type.
--
--   - Sign-convention asymmetry between the two RPCs:
--       * get_account_ledger returns running_balance debit-
--         positive (caller knows account.type from service-
--         returned metadata and flips sign for liability/
--         equity/revenue accounts if rendering in natural-
--         balance form). RPC has one account_id but doesn't
--         pre-flip — the polarity decision lives where the
--         polarity context lives (the caller).
--       * get_accounts_by_type returns debit_total_cad and
--         credit_total_cad as separate columns (NOT pre-
--         flipped). The view (AccountsByTypeView in 8b)
--         renders both columns TB-style — keeping the
--         separation lets the view mirror TB's rendering
--         pattern without an extra transformation.
--     Contrast Step 7's get_balance_sheet, which pre-flips per
--     account_type because its consumer (BalanceSheetView)
--     needs 4 named scalar totals already in natural-balance
--     form. Decision: shape follows the consumer.
--
--   - get_account_ledger ORDER BY tertiary key on
--     journal_entry_id. journal_entries.entry_number is UNIQUE
--     per (org_id, fiscal_period_id, entry_number) per
--     migration 20240104000000_add_entry_number.sql; across
--     periods, duplicate entry_numbers are possible. With
--     p_period_id IS NULL (all-periods query), two entries
--     from different periods can share both entry_date AND
--     entry_number — ambiguous tie → ambiguous row order →
--     ambiguous running-balance progression → flaky tests.
--     Tertiary key on journal_entry_id (UUID, always unique)
--     guarantees deterministic ordering under all conditions.
--     Applied consistently to both the window function ORDER BY
--     and the outer SELECT ORDER BY.
--
--   - get_account_ledger window frame: explicit ROWS BETWEEN
--     UNBOUNDED PRECEDING AND CURRENT ROW. PostgreSQL's default
--     frame for windowed aggregates is RANGE BETWEEN UNBOUNDED
--     PRECEDING AND CURRENT ROW, which treats ties differently
--     (all peer rows share the same window-frame end). ROWS
--     gives row-by-row accumulation regardless of tie behavior.
--
--   - Enum-cast asymmetry from Step 7. get_balance_sheet uses
--     string literals (`coa.account_type = 'asset'`) which
--     PostgreSQL implicitly coerces at parse time. This RPC's
--     get_accounts_by_type takes a `text` parameter and
--     requires an explicit `::account_type` cast at the filter
--     site because PostgreSQL has no implicit text→enum cast
--     for variables. Both shapes are correct for their
--     respective parameter types; the asymmetry is necessary,
--     not accidental.
--
--   - No entry_type filter (Q21 carry-forward from Steps 6/7).
--     Reversing entries are included in get_account_ledger and
--     show as their own rows; the original + reversal pair
--     nets to zero in the running balance, visible as a
--     "spike and return" over the two rows.
--
--   - Belt-and-suspenders org filter on both RPCs. SECURITY
--     INVOKER + RLS already isolate cross-org data; the
--     explicit `coa.org_id = p_org_id AND je.org_id = p_org_id`
--     predicates are defense-in-depth carrying Step 6/7
--     discipline.
--
--   - No DEFAULT on p_account_type for get_accounts_by_type;
--     service passes a required value. p_period_id has DEFAULT
--     NULL on both RPCs (call site convention).
--
-- Cross-references:
--   - Brief §4 (Step 8 row — TB rows clickable, GL ledger view).
--   - Brief §7 (migration 5 — re-slotted to 20240127000000
--     because Step 7 took the prior slot 20240126000000).
--   - Brief §11.1 gate 3 (psql round-trip — pre-flight Cash row
--     count + both RPC zero-row baselines).
--   - 20240125000000_account_balance_rpc.sql (structural
--     template, INNER JOIN discipline, debit-positive sign
--     convention).
--   - 20240126000000_balance_sheet_rpc.sql (Step 7 — sign-
--     convention contrast: pre-flips because consumer needs
--     scalar totals).
--   - 20240104000000_add_entry_number.sql (entry_number
--     UNIQUE-per-(org,period) constraint motivating the
--     tertiary ORDER BY key).
-- =============================================================

BEGIN;

-- ---------------------------------------------------------------
-- get_accounts_by_type — per-account totals, filtered by type.
-- Consumed in Step 8b. Shipped here for brief §7 migration-5
-- alignment (one migration file for both Step 8 RPCs).
-- ---------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_accounts_by_type(
  p_org_id uuid,
  p_account_type text,
  p_period_id uuid DEFAULT NULL
) RETURNS TABLE (
  account_id uuid,
  account_code text,
  account_name text,
  debit_total_cad numeric,
  credit_total_cad numeric
) LANGUAGE sql SECURITY INVOKER AS $$
  SELECT
    coa.account_id,
    coa.account_code,
    coa.account_name,
    COALESCE(SUM(jl.amount_cad) FILTER (WHERE jl.debit_amount > 0), 0)  AS debit_total_cad,
    COALESCE(SUM(jl.amount_cad) FILTER (WHERE jl.credit_amount > 0), 0) AS credit_total_cad
  FROM chart_of_accounts coa
  JOIN journal_lines jl      ON jl.account_id = coa.account_id
  JOIN journal_entries je    ON je.journal_entry_id = jl.journal_entry_id
  WHERE coa.org_id = p_org_id
    AND je.org_id  = p_org_id
    AND coa.account_type = p_account_type::account_type
    AND (p_period_id IS NULL OR je.fiscal_period_id = p_period_id)
  GROUP BY coa.account_id, coa.account_code, coa.account_name
  ORDER BY coa.account_code;
$$;

GRANT EXECUTE ON FUNCTION get_accounts_by_type(uuid, text, uuid) TO service_role;

-- ---------------------------------------------------------------
-- get_account_ledger — ordered ledger with running balance.
-- Consumed in Step 8a by AccountLedgerView. Running balance is
-- debit-positive; caller flips sign for liability/equity/revenue
-- accounts if rendering in natural-balance form.
-- ---------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_account_ledger(
  p_org_id uuid,
  p_account_id uuid,
  p_period_id uuid DEFAULT NULL
) RETURNS TABLE (
  journal_entry_id uuid,
  entry_number bigint,
  entry_date date,
  description text,
  debit_amount numeric,
  credit_amount numeric,
  amount_cad numeric,
  running_balance numeric
) LANGUAGE sql SECURITY INVOKER AS $$
  SELECT
    je.journal_entry_id,
    je.entry_number,
    je.entry_date,
    je.description,
    jl.debit_amount,
    jl.credit_amount,
    jl.amount_cad,
    SUM(
      CASE WHEN jl.debit_amount > 0 THEN jl.amount_cad
           ELSE -jl.amount_cad
      END
    ) OVER (
      ORDER BY je.entry_date, je.entry_number, je.journal_entry_id
      ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
    ) AS running_balance
  FROM journal_lines jl
  JOIN journal_entries je     ON je.journal_entry_id = jl.journal_entry_id
  JOIN chart_of_accounts coa  ON coa.account_id = jl.account_id
  WHERE coa.org_id = p_org_id
    AND je.org_id  = p_org_id
    AND jl.account_id = p_account_id
    AND (p_period_id IS NULL OR je.fiscal_period_id = p_period_id)
  ORDER BY je.entry_date, je.entry_number, je.journal_entry_id;
$$;

GRANT EXECUTE ON FUNCTION get_account_ledger(uuid, uuid, uuid) TO service_role;

COMMIT;
