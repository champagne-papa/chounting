-- S26: drop pre-S26 signatures explicitly. CREATE OR REPLACE only
-- replaces an exactly-matching signature; adding an optional parameter
-- creates a new overload and leaves the old signature live, which makes
-- PostgREST's RPC dispatch ambiguous ("could not choose the best
-- candidate function"). Explicit DROP IF EXISTS clears the prior shape.
DROP FUNCTION IF EXISTS test_post_unbalanced_entry(uuid, uuid, uuid, uuid, numeric, numeric);
DROP FUNCTION IF EXISTS test_post_balanced_entry(uuid, uuid, uuid, uuid, numeric);

CREATE OR REPLACE FUNCTION test_post_unbalanced_entry(
  p_org_id uuid,
  p_period_id uuid,
  p_debit_account uuid,
  p_credit_account uuid,
  p_debit_amount numeric,
  p_credit_amount numeric,
  p_entry_date date DEFAULT current_date
) RETURNS uuid AS $$
DECLARE
  v_entry_id uuid;
  v_next_entry_number bigint;
BEGIN
  -- Compute next entry_number (same MAX + 1 pattern as the service).
  -- Test entries that roll back (deferred constraint rejects unbalanced)
  -- still need a valid entry_number to pass the NOT NULL constraint
  -- before the deferred check fires at COMMIT.
  SELECT COALESCE(MAX(entry_number), 0) + 1
    INTO v_next_entry_number
    FROM journal_entries
    WHERE org_id = p_org_id AND fiscal_period_id = p_period_id;

  -- p_entry_date defaults to current_date — see test_post_balanced_entry
  -- for the rationale (S26 QW-03 period date-range trigger).
  INSERT INTO journal_entries (org_id, fiscal_period_id, entry_date, description, source, source_system, entry_number)
  VALUES (p_org_id, p_period_id, p_entry_date, 'TEST UNBALANCED', 'manual', 'manual', v_next_entry_number)
  RETURNING journal_entry_id INTO v_entry_id;

  INSERT INTO journal_lines (journal_entry_id, account_id, debit_amount, amount_original, amount_cad)
  VALUES (v_entry_id, p_debit_account, p_debit_amount, p_debit_amount, p_debit_amount);

  INSERT INTO journal_lines (journal_entry_id, account_id, credit_amount, amount_original, amount_cad)
  VALUES (v_entry_id, p_credit_account, p_credit_amount, p_credit_amount, p_credit_amount);

  RETURN v_entry_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION test_post_balanced_entry(
  p_org_id uuid,
  p_period_id uuid,
  p_debit_account uuid,
  p_credit_account uuid,
  p_amount numeric,
  p_entry_date date DEFAULT current_date
) RETURNS uuid AS $$
DECLARE
  v_entry_id uuid;
  v_next_entry_number bigint;
BEGIN
  -- Compute next entry_number (same MAX + 1 pattern as the service).
  SELECT COALESCE(MAX(entry_number), 0) + 1
    INTO v_next_entry_number
    FROM journal_entries
    WHERE org_id = p_org_id AND fiscal_period_id = p_period_id;

  -- p_entry_date defaults to current_date (backward-compat for callers
  -- that target the currently-open period). Callers targeting non-
  -- current periods (locked-period tests, historical-period tests)
  -- MUST pass an in-period date because trg_journal_entry_period_range
  -- (S26 QW-03) enforces entry_date ∈ [period.start_date, period.end_date].
  INSERT INTO journal_entries (org_id, fiscal_period_id, entry_date, description, source, source_system, entry_number)
  VALUES (p_org_id, p_period_id, p_entry_date, 'TEST BALANCED', 'manual', 'manual', v_next_entry_number)
  RETURNING journal_entry_id INTO v_entry_id;

  INSERT INTO journal_lines (journal_entry_id, account_id, debit_amount, amount_original, amount_cad)
  VALUES (v_entry_id, p_debit_account, p_amount, p_amount, p_amount);

  INSERT INTO journal_lines (journal_entry_id, account_id, credit_amount, amount_original, amount_cad)
  VALUES (v_entry_id, p_credit_account, p_amount, p_amount, p_amount);

  RETURN v_entry_id;
END;
$$ LANGUAGE plpgsql;