-- =============================================================
-- 20240131000000_recurring_journal_templates.sql
-- Phase 0-1.1 Control Foundations Step 10a:
-- Recurring journals data model
-- =============================================================
-- Adds:
--   - recurring_run_status enum (four values; 'approved' reserved
--     for Phase 2 scheduler per ADR-0010)
--   - recurring_journal_templates       — template header metadata
--   - recurring_journal_template_lines  — per-template line detail
--   - recurring_journal_runs            — generated-run records
--   - enforce_template_balance deferred CONSTRAINT TRIGGER
--     enforcing INV-RECURRING-001 at transaction commit
--   - Idempotency UNIQUE (recurring_template_id, scheduled_for)
--     on runs for INSERT ON CONFLICT DO NOTHING contract (§3.3)
--   - Scoped CHECK restricting Phase 1 status writes to
--     {pending_approval, posted, rejected} — unconditional form
--   - RLS policies for all three tables with service-role
--     permissive annotation per brief §9
--
-- Slot note:
--   Brief §7 migration 8 originally targeted 20240129000000 but
--   Step 9a's adjustment_status_enum migration already occupies
--   that slot. Slot drift-corrected to 20240131000000.
--
-- INV-RECURRING-001 three-layer defense:
--   - Layer 1 (this migration): deferred CONSTRAINT TRIGGER on
--     recurring_journal_template_lines rejects at commit if
--     SUM(debit_amount) <> SUM(credit_amount) per template.
--     Mirrors enforce_journal_entry_balance at
--     20240101000000_initial_schema.sql:255-283.
--   - Layer 2 (Zod): RecurringTemplateInputSchema.refine()
--     balanced check at schema boundary. Faster ergonomic error.
--   - Layer 3 (service): all mutations go through Zod parse.
--
-- ADR-0010 second deliberate consumer:
--   recurring_journal_runs.status. Phase 1 writes only three of
--   the four enum values; 'approved' reserved for the Phase 2
--   scheduler that splits human approval from posting. Phase 1
--   approveRun() transitions directly pending_approval → posted
--   per brief §3.3.
--
--   The scoped CHECK here is UNCONDITIONAL (every row is a run;
--   no discriminator column). This is a variant of ADR-0010's
--   pattern distinct from Step 9a's adjustment_status form
--   (20240129000000_adjustment_status_enum.sql), which scoped via
--   entry_type <> 'adjusting' because journal_entries mixes
--   discriminated sub-types. Both shapes are valid applications
--   of ADR-0010.
--
-- Cross-references:
--   - brief §3.3 (locked design — status enum, idempotent
--     generateRun, auto_post hybrid flag)
--   - brief §4 Step 10 row
--   - brief §5 (INV-RECURRING-001 invariant table entry)
--   - brief §7 migration 8
--   - brief §9 (service-role permissive RLS annotation)
--   - ADR-0010 §Decision (reserved-enum-states discipline;
--     second deliberate consumer — recurring_journal_runs.status)
--   - 20240101000000_initial_schema.sql:255-283 (deferred
--     CONSTRAINT TRIGGER structural template)
--   - 20240129000000_adjustment_status_enum.sql (sibling
--     reserved-state consumer — discriminator-scoped form)
-- =============================================================

BEGIN;

-- -----------------------------------------------------------------
-- ENUM: recurring_run_status (ADR-0010 affordance; four values)
-- -----------------------------------------------------------------

CREATE TYPE recurring_run_status AS ENUM (
  'pending_approval',
  'approved',
  'posted',
  'rejected'
);

COMMENT ON TYPE recurring_run_status IS
  'Reserved-enum-states (ADR-0010). Phase 1 writes only pending_approval, posted, rejected. approved is reserved for the Phase 2 scheduler that splits human approval from posting (see brief §3.3). Phase 1 approveRun transitions pending_approval → posted directly.';

-- -----------------------------------------------------------------
-- TABLE: recurring_journal_templates
-- -----------------------------------------------------------------

CREATE TABLE recurring_journal_templates (
  recurring_template_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id                uuid NOT NULL REFERENCES organizations(org_id) ON DELETE RESTRICT,
  template_name         text NOT NULL,
  description           text,
  auto_post             boolean NOT NULL DEFAULT false,
  is_active             boolean NOT NULL DEFAULT true,
  created_by            uuid REFERENCES auth.users(id),
  created_at            timestamptz NOT NULL DEFAULT now(),
  CHECK (length(trim(template_name)) > 0)
);

CREATE INDEX idx_recurring_templates_org
  ON recurring_journal_templates (org_id, is_active);

COMMENT ON COLUMN recurring_journal_templates.auto_post IS
  'Hybrid auto-draft (default false) / auto-post (controller override true) per brief §3.3. Phase 1 does not auto-post; the Phase 2 scheduler consumes this flag to decide whether generateRun is followed by automatic approveRun.';

-- -----------------------------------------------------------------
-- TABLE: recurring_journal_template_lines
-- -----------------------------------------------------------------

CREATE TABLE recurring_journal_template_lines (
  template_line_id      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recurring_template_id uuid NOT NULL REFERENCES recurring_journal_templates(recurring_template_id) ON DELETE CASCADE,
  account_id            uuid NOT NULL REFERENCES chart_of_accounts(account_id),
  description           text,
  debit_amount          numeric(20,4) NOT NULL DEFAULT 0,
  credit_amount         numeric(20,4) NOT NULL DEFAULT 0,
  currency              char(3) NOT NULL DEFAULT 'CAD',
  tax_code_id           uuid REFERENCES tax_codes(tax_code_id),
  CONSTRAINT template_line_amounts_nonneg
    CHECK (debit_amount >= 0 AND credit_amount >= 0),
  CONSTRAINT template_line_is_debit_xor_credit
    CHECK ((debit_amount = 0) OR (credit_amount = 0)),
  CONSTRAINT template_line_is_not_all_zero
    CHECK (debit_amount > 0 OR credit_amount > 0)
);

CREATE INDEX idx_recurring_template_lines_template
  ON recurring_journal_template_lines (recurring_template_id);

-- -----------------------------------------------------------------
-- TABLE: recurring_journal_runs
-- -----------------------------------------------------------------

CREATE TABLE recurring_journal_runs (
  recurring_run_id      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recurring_template_id uuid NOT NULL REFERENCES recurring_journal_templates(recurring_template_id) ON DELETE RESTRICT,
  scheduled_for         date NOT NULL,
  status                recurring_run_status NOT NULL DEFAULT 'pending_approval',
  journal_entry_id      uuid REFERENCES journal_entries(journal_entry_id),
  rejection_reason      text,
  created_at            timestamptz NOT NULL DEFAULT now(),
  -- §3.3 idempotency: generateRun uses INSERT ... ON CONFLICT DO
  -- NOTHING + SELECT to return the existing row if present. The
  -- composite key UNIQUE is the conflict target.
  CONSTRAINT recurring_run_template_scheduled_unique
    UNIQUE (recurring_template_id, scheduled_for),
  -- ADR-0010 Layer 1: Phase 1 scoped CHECK — 'approved' reserved
  -- for Phase 2 scheduler. Unconditional form (every row is a
  -- run; no discriminator column). Phase 2 cutover loosens or
  -- drops this CHECK when the scheduler activates the full
  -- workflow. No existing-row backfill needed — every Phase 1
  -- row is in a valid post-workflow state by construction.
  CONSTRAINT recurring_run_status_phase1_allowed
    CHECK (status IN ('pending_approval', 'posted', 'rejected')),
  -- Defensive pairing: posted runs carry a journal_entry_id;
  -- rejected runs carry a rejection_reason. Layer 1a complement
  -- to the service-layer post-then-update sequence.
  CONSTRAINT recurring_run_posted_has_entry
    CHECK (status <> 'posted' OR journal_entry_id IS NOT NULL),
  CONSTRAINT recurring_run_rejected_has_reason
    CHECK (status <> 'rejected' OR (rejection_reason IS NOT NULL AND length(trim(rejection_reason)) > 0))
);

CREATE INDEX idx_recurring_runs_template_status
  ON recurring_journal_runs (recurring_template_id, status);

COMMENT ON CONSTRAINT recurring_run_status_phase1_allowed
  ON recurring_journal_runs IS
  'Reserved-enum-states Phase 1 defense (ADR-0010, second consumer). Unconditional scoped CHECK — every row is a run, no discriminator. approved reserved for Phase 2 scheduler. Loosen via CHECK modification at Phase 2 cutover; no existing-row backfill needed.';

COMMENT ON COLUMN recurring_journal_runs.status IS
  'Reserved-enum-states (ADR-0010). Phase 1 writes only pending_approval / posted / rejected. approved reserved for Phase 2 scheduler. Phase 1 approveRun transitions pending_approval → posted directly (brief §3.3).';

-- -----------------------------------------------------------------
-- INV-RECURRING-001 (Layer 1a): deferred CONSTRAINT TRIGGER
-- enforces SUM(debit_amount) = SUM(credit_amount) per template at
-- transaction commit. Mirrors enforce_journal_entry_balance
-- (20240101000000_initial_schema.sql:255-283).
-- -----------------------------------------------------------------

CREATE OR REPLACE FUNCTION enforce_template_balance()
RETURNS TRIGGER AS $$
DECLARE
  total_debit numeric(20,4);
  total_credit numeric(20,4);
  v_template_id uuid;
BEGIN
  v_template_id := COALESCE(NEW.recurring_template_id, OLD.recurring_template_id);

  SELECT
    COALESCE(SUM(debit_amount), 0),
    COALESCE(SUM(credit_amount), 0)
  INTO total_debit, total_credit
  FROM recurring_journal_template_lines
  WHERE recurring_template_id = v_template_id;

  IF total_debit <> total_credit THEN
    RAISE EXCEPTION
      'Recurring journal template % is not balanced: debits=%, credits=%',
      v_template_id, total_debit, total_credit
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE CONSTRAINT TRIGGER trg_enforce_template_balance
  AFTER INSERT OR UPDATE OR DELETE ON recurring_journal_template_lines
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW
  EXECUTE FUNCTION enforce_template_balance();

-- -----------------------------------------------------------------
-- RLS POLICIES
-- -----------------------------------------------------------------
-- RLS is permissive for the service-role path because INV-AUTH-001
-- via withInvariants is the enforcement layer for writes. Do not
-- 'harden' RLS by adding user-scoped write policies — the service
-- uses adminClient by design, per INV-SERVICE-002.
-- -----------------------------------------------------------------

ALTER TABLE recurring_journal_templates      ENABLE ROW LEVEL SECURITY;
ALTER TABLE recurring_journal_template_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE recurring_journal_runs           ENABLE ROW LEVEL SECURITY;

-- Templates: read gated by org membership.
CREATE POLICY recurring_templates_select ON recurring_journal_templates
  FOR SELECT USING (user_has_org_access(org_id));

-- Template lines: read gated by parent template's org membership
-- (EXISTS hop — same pattern as journal_lines_select at
-- 20240101000000_initial_schema.sql:739-747).
CREATE POLICY recurring_template_lines_select ON recurring_journal_template_lines
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM recurring_journal_templates t
      WHERE t.recurring_template_id = recurring_journal_template_lines.recurring_template_id
        AND user_has_org_access(t.org_id)
    )
  );

-- Runs: read gated by parent template's org membership.
-- RLS is permissive for the service-role path per brief §9 — see
-- header comment block above. Writes flow through adminClient
-- (service-role bypasses RLS) after withInvariants gates them.
CREATE POLICY recurring_runs_select ON recurring_journal_runs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM recurring_journal_templates t
      WHERE t.recurring_template_id = recurring_journal_runs.recurring_template_id
        AND user_has_org_access(t.org_id)
    )
  );

COMMIT;
