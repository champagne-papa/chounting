-- =============================================================
-- 001_initial_schema.sql
-- The Bridge — Phase 1.1 initial schema
-- =============================================================
-- This file is the single source of truth for the Phase 1.1 schema.
-- Phase 1.1 builds the data model, auth, RLS, and the five Category A
-- integration tests (v0.5.5 count — see PLAN.md §10a). No agent code,
-- no journal entry posting yet — but all schema reservations are
-- present so Phase 1.2 plugs in mechanically.
-- =============================================================

BEGIN;

-- -----------------------------------------------------------------
-- ENUMS
-- -----------------------------------------------------------------

CREATE TYPE user_role AS ENUM (
  'executive',
  'controller',
  'ap_specialist'
);

CREATE TYPE org_industry AS ENUM (
  'healthcare',
  'real_estate',
  'hospitality',
  'trading',
  'restaurant',
  'holding_company'
);

CREATE TYPE account_type AS ENUM (
  'asset',
  'liability',
  'equity',
  'revenue',
  'expense'
);

CREATE TYPE journal_entry_source AS ENUM (
  'manual',
  'agent',
  'import'
);

CREATE TYPE autonomy_tier AS ENUM (
  'always_confirm',
  'notify_auto',
  'silent'
);

CREATE TYPE ai_action_status AS ENUM (
  'pending',
  'confirmed',
  'rejected',
  'auto_posted',
  'stale'
);

CREATE TYPE confidence_level AS ENUM (
  'high',
  'medium',
  'low',
  'novel'
);

-- -----------------------------------------------------------------
-- ORGANIZATIONS
-- -----------------------------------------------------------------

CREATE TABLE organizations (
  org_id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name                text NOT NULL,
  legal_name          text,
  industry            org_industry NOT NULL,
  functional_currency char(3) NOT NULL DEFAULT 'CAD',
  fiscal_year_start_month smallint NOT NULL DEFAULT 1
    CHECK (fiscal_year_start_month BETWEEN 1 AND 12),
  created_at          timestamptz NOT NULL DEFAULT now(),
  created_by          uuid REFERENCES auth.users(id)
);

-- -----------------------------------------------------------------
-- MEMBERSHIPS
-- -----------------------------------------------------------------

CREATE TABLE memberships (
  membership_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id        uuid NOT NULL REFERENCES organizations(org_id) ON DELETE CASCADE,
  role          user_role NOT NULL,
  created_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, org_id)
);

CREATE INDEX idx_memberships_user_org ON memberships (user_id, org_id);
CREATE INDEX idx_memberships_org ON memberships (org_id);

-- -----------------------------------------------------------------
-- CHART OF ACCOUNTS TEMPLATES
-- -----------------------------------------------------------------

CREATE TABLE chart_of_accounts_templates (
  template_id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  industry                 org_industry NOT NULL,
  account_code             text NOT NULL,
  account_name             text NOT NULL,
  account_type             account_type NOT NULL,
  parent_account_code      text,
  is_intercompany_capable  boolean NOT NULL DEFAULT false,
  sort_order               integer NOT NULL DEFAULT 0,
  UNIQUE (industry, account_code)
);

-- -----------------------------------------------------------------
-- CHART OF ACCOUNTS
-- -----------------------------------------------------------------

CREATE TABLE chart_of_accounts (
  account_id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id                   uuid NOT NULL REFERENCES organizations(org_id) ON DELETE CASCADE,
  account_code             text NOT NULL,
  account_name             text NOT NULL,
  account_type             account_type NOT NULL,
  parent_account_id        uuid REFERENCES chart_of_accounts(account_id),
  is_intercompany_capable  boolean NOT NULL DEFAULT false,
  is_active                boolean NOT NULL DEFAULT true,
  created_at               timestamptz NOT NULL DEFAULT now(),
  UNIQUE (org_id, account_code)
);

CREATE INDEX idx_coa_org ON chart_of_accounts (org_id, account_code);

-- -----------------------------------------------------------------
-- FISCAL PERIODS
-- -----------------------------------------------------------------

CREATE TABLE fiscal_periods (
  period_id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id             uuid NOT NULL REFERENCES organizations(org_id) ON DELETE CASCADE,
  name               text NOT NULL,
  start_date         date NOT NULL,
  end_date           date NOT NULL,
  is_locked          boolean NOT NULL DEFAULT false,
  locked_at          timestamptz,
  locked_by_user_id  uuid REFERENCES auth.users(id),
  CHECK (end_date >= start_date),
  UNIQUE (org_id, start_date, end_date)
);

CREATE INDEX idx_fiscal_periods_org_dates ON fiscal_periods (org_id, start_date, end_date);

-- -----------------------------------------------------------------
-- INTERCOMPANY RELATIONSHIPS
-- -----------------------------------------------------------------

CREATE TABLE intercompany_relationships (
  relationship_id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_a_id                     uuid NOT NULL REFERENCES organizations(org_id),
  org_b_id                     uuid NOT NULL REFERENCES organizations(org_id),
  org_a_due_to_account_id      uuid REFERENCES chart_of_accounts(account_id),
  org_b_due_from_account_id    uuid REFERENCES chart_of_accounts(account_id),
  created_at                   timestamptz NOT NULL DEFAULT now(),
  CHECK (org_a_id <> org_b_id),
  UNIQUE (org_a_id, org_b_id)
);

COMMENT ON TABLE intercompany_relationships IS
  'Populated in Phase 2 by AP Agent. Do not write to manually.';

-- -----------------------------------------------------------------
-- JOURNAL ENTRIES
-- -----------------------------------------------------------------

CREATE TABLE journal_entries (
  journal_entry_id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id                    uuid NOT NULL REFERENCES organizations(org_id) ON DELETE RESTRICT,
  fiscal_period_id          uuid NOT NULL REFERENCES fiscal_periods(period_id),
  entry_date                date NOT NULL,
  description               text NOT NULL,
  reference                 text,
  source                    journal_entry_source NOT NULL,
  intercompany_batch_id     uuid,
  reverses_journal_entry_id uuid REFERENCES journal_entries(journal_entry_id),
  idempotency_key           uuid,
  created_at                timestamptz NOT NULL DEFAULT now(),
  created_by                uuid REFERENCES auth.users(id),
  CONSTRAINT idempotency_required_for_agent
    CHECK (source <> 'agent' OR idempotency_key IS NOT NULL)
);

CREATE INDEX idx_je_org_period ON journal_entries (org_id, fiscal_period_id);
CREATE INDEX idx_je_org_intercompany ON journal_entries (org_id, intercompany_batch_id)
  WHERE intercompany_batch_id IS NOT NULL;
CREATE INDEX idx_je_reverses ON journal_entries (reverses_journal_entry_id)
  WHERE reverses_journal_entry_id IS NOT NULL;

-- -----------------------------------------------------------------
-- TAX CODES — moved before journal_lines (forward reference fix)
-- -----------------------------------------------------------------

CREATE TABLE tax_codes (
  tax_code_id     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          uuid REFERENCES organizations(org_id) ON DELETE CASCADE,
  code            text NOT NULL,
  rate            numeric(6,4) NOT NULL,
  jurisdiction    text NOT NULL,
  effective_from  date NOT NULL,
  effective_to    date,
  CHECK (effective_to IS NULL OR effective_to >= effective_from)
);

CREATE INDEX idx_tax_codes_jurisdiction ON tax_codes (jurisdiction, effective_from);

-- -----------------------------------------------------------------
-- JOURNAL LINES
-- -----------------------------------------------------------------

CREATE TABLE journal_lines (
  journal_line_id    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  journal_entry_id   uuid NOT NULL REFERENCES journal_entries(journal_entry_id) ON DELETE CASCADE,
  account_id         uuid NOT NULL REFERENCES chart_of_accounts(account_id),
  description        text,
  debit_amount       numeric(20,4) NOT NULL DEFAULT 0,
  credit_amount      numeric(20,4) NOT NULL DEFAULT 0,
  tax_code_id        uuid REFERENCES tax_codes(tax_code_id),
  currency           char(3) NOT NULL DEFAULT 'CAD',
  amount_original    numeric(20,4) NOT NULL DEFAULT 0,
  amount_cad         numeric(20,4) NOT NULL DEFAULT 0,
  fx_rate            numeric(20,8) NOT NULL DEFAULT 1.0,
  CONSTRAINT line_amounts_nonneg
    CHECK (debit_amount >= 0 AND credit_amount >= 0),
  CONSTRAINT line_is_debit_xor_credit
    CHECK ((debit_amount = 0) OR (credit_amount = 0)),
  CONSTRAINT line_is_not_all_zero
    CHECK (debit_amount > 0 OR credit_amount > 0),
  CONSTRAINT line_amount_original_matches_base
    CHECK (amount_original = debit_amount + credit_amount),
  CONSTRAINT line_amount_cad_matches_fx
    CHECK (amount_cad = ROUND(amount_original * fx_rate, 4))
);

CREATE INDEX idx_jl_entry ON journal_lines (journal_entry_id);
CREATE INDEX idx_jl_account ON journal_lines (account_id);

-- -----------------------------------------------------------------
-- DEFERRED CONSTRAINT: debit = credit per journal entry
-- -----------------------------------------------------------------

CREATE OR REPLACE FUNCTION enforce_journal_entry_balance()
RETURNS TRIGGER AS $$
DECLARE
  total_debit numeric(20,4);
  total_credit numeric(20,4);
BEGIN
  SELECT
    COALESCE(SUM(debit_amount), 0),
    COALESCE(SUM(credit_amount), 0)
  INTO total_debit, total_credit
  FROM journal_lines
  WHERE journal_entry_id = COALESCE(NEW.journal_entry_id, OLD.journal_entry_id);

  IF total_debit <> total_credit THEN
    RAISE EXCEPTION
      'Journal entry % is not balanced: debits=%, credits=%',
      COALESCE(NEW.journal_entry_id, OLD.journal_entry_id), total_debit, total_credit
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE CONSTRAINT TRIGGER trg_enforce_journal_entry_balance
  AFTER INSERT OR UPDATE OR DELETE ON journal_lines
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW
  EXECUTE FUNCTION enforce_journal_entry_balance();

-- -----------------------------------------------------------------
-- TRIGGER: period not locked
-- -----------------------------------------------------------------

CREATE OR REPLACE FUNCTION enforce_period_not_locked()
RETURNS TRIGGER AS $$
DECLARE
  v_period_id uuid;
  v_is_locked boolean;
BEGIN
  SELECT je.fiscal_period_id INTO v_period_id
  FROM journal_entries je
  WHERE je.journal_entry_id = NEW.journal_entry_id;

  SELECT fp.is_locked INTO v_is_locked
  FROM fiscal_periods fp
  WHERE fp.period_id = v_period_id
  FOR UPDATE;

  IF v_is_locked THEN
    RAISE EXCEPTION
      'Cannot post to a locked fiscal period (journal_entry_id=%, period_id=%)',
      NEW.journal_entry_id, v_period_id
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_enforce_period_not_locked
  BEFORE INSERT OR UPDATE ON journal_lines
  FOR EACH ROW
  EXECUTE FUNCTION enforce_period_not_locked();

-- -----------------------------------------------------------------
-- VENDORS
-- -----------------------------------------------------------------

CREATE TABLE vendors (
  vendor_id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id                     uuid NOT NULL REFERENCES organizations(org_id) ON DELETE CASCADE,
  name                       text NOT NULL,
  email                      text,
  tax_id                     text,
  default_currency           char(3) NOT NULL DEFAULT 'CAD',
  is_intercompany_entity_id  uuid REFERENCES organizations(org_id),
  is_active                  boolean NOT NULL DEFAULT true,
  created_at                 timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_vendors_org ON vendors (org_id);

-- -----------------------------------------------------------------
-- VENDOR RULES
-- -----------------------------------------------------------------

CREATE TABLE vendor_rules (
  rule_id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id              uuid NOT NULL REFERENCES organizations(org_id) ON DELETE CASCADE,
  vendor_id           uuid NOT NULL REFERENCES vendors(vendor_id) ON DELETE CASCADE,
  default_account_id  uuid REFERENCES chart_of_accounts(account_id),
  autonomy_tier       autonomy_tier NOT NULL DEFAULT 'always_confirm',
  created_at          timestamptz NOT NULL DEFAULT now(),
  created_by          uuid REFERENCES auth.users(id),
  approved_at         timestamptz,
  approved_by         uuid REFERENCES auth.users(id)
);

CREATE INDEX idx_vendor_rules_org_vendor ON vendor_rules (org_id, vendor_id);

-- -----------------------------------------------------------------
-- CUSTOMERS
-- -----------------------------------------------------------------

CREATE TABLE customers (
  customer_id  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id       uuid NOT NULL REFERENCES organizations(org_id) ON DELETE CASCADE,
  name         text NOT NULL,
  email        text,
  tax_id       text,
  is_active    boolean NOT NULL DEFAULT true,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_customers_org ON customers (org_id);

-- -----------------------------------------------------------------
-- INVOICES
-- -----------------------------------------------------------------

CREATE TABLE invoices (
  invoice_id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id            uuid NOT NULL REFERENCES organizations(org_id) ON DELETE CASCADE,
  customer_id       uuid NOT NULL REFERENCES customers(customer_id),
  invoice_number    text NOT NULL,
  issue_date        date NOT NULL,
  due_date          date,
  status            text NOT NULL DEFAULT 'draft',
  currency          char(3) NOT NULL DEFAULT 'CAD',
  amount_original   numeric(20,4) NOT NULL DEFAULT 0,
  amount_cad        numeric(20,4) NOT NULL DEFAULT 0,
  fx_rate           numeric(20,8) NOT NULL DEFAULT 1.0,
  created_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_invoices_org_customer ON invoices (org_id, customer_id, status);

CREATE TABLE invoice_lines (
  invoice_line_id  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id       uuid NOT NULL REFERENCES invoices(invoice_id) ON DELETE CASCADE,
  description      text NOT NULL,
  quantity         numeric(20,4) NOT NULL DEFAULT 1,
  unit_price       numeric(20,4) NOT NULL DEFAULT 0,
  amount_original  numeric(20,4) NOT NULL DEFAULT 0,
  amount_cad       numeric(20,4) NOT NULL DEFAULT 0
);

-- -----------------------------------------------------------------
-- BILLS
-- -----------------------------------------------------------------

CREATE TABLE bills (
  bill_id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id            uuid NOT NULL REFERENCES organizations(org_id) ON DELETE CASCADE,
  vendor_id         uuid NOT NULL REFERENCES vendors(vendor_id),
  bill_number       text,
  issue_date        date NOT NULL,
  due_date          date,
  status            text NOT NULL DEFAULT 'draft',
  currency          char(3) NOT NULL DEFAULT 'CAD',
  amount_original   numeric(20,4) NOT NULL DEFAULT 0,
  amount_cad        numeric(20,4) NOT NULL DEFAULT 0,
  fx_rate           numeric(20,8) NOT NULL DEFAULT 1.0,
  created_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_bills_org_vendor ON bills (org_id, vendor_id, status);

CREATE TABLE bill_lines (
  bill_line_id     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bill_id          uuid NOT NULL REFERENCES bills(bill_id) ON DELETE CASCADE,
  account_id       uuid REFERENCES chart_of_accounts(account_id),
  description      text NOT NULL,
  amount           numeric(20,4) NOT NULL CHECK (amount > 0),
  amount_original  numeric(20,4) NOT NULL DEFAULT 0,
  amount_cad       numeric(20,4) NOT NULL DEFAULT 0
);

-- -----------------------------------------------------------------
-- PAYMENTS
-- -----------------------------------------------------------------

CREATE TABLE payments (
  payment_id    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id        uuid NOT NULL REFERENCES organizations(org_id) ON DELETE CASCADE,
  payment_date  date NOT NULL,
  amount        numeric(20,4) NOT NULL,
  currency      char(3) NOT NULL DEFAULT 'CAD',
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- -----------------------------------------------------------------
-- BANK ACCOUNTS + TRANSACTIONS
-- -----------------------------------------------------------------

CREATE TABLE bank_accounts (
  bank_account_id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id                    uuid NOT NULL REFERENCES organizations(org_id) ON DELETE CASCADE,
  name                      text NOT NULL,
  institution               text,
  account_number_last_four  text,
  currency                  char(3) NOT NULL DEFAULT 'CAD',
  is_active                 boolean NOT NULL DEFAULT true
);

CREATE TABLE bank_transactions (
  bank_transaction_id  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id               uuid NOT NULL REFERENCES organizations(org_id) ON DELETE CASCADE,
  bank_account_id      uuid NOT NULL REFERENCES bank_accounts(bank_account_id),
  posted_at            timestamptz NOT NULL,
  description          text,
  currency             char(3) NOT NULL DEFAULT 'CAD',
  amount_original      numeric(20,4) NOT NULL DEFAULT 0,
  amount_cad           numeric(20,4) NOT NULL DEFAULT 0,
  fx_rate              numeric(20,8) NOT NULL DEFAULT 1.0
);

CREATE INDEX idx_bank_tx_org ON bank_transactions (org_id, bank_account_id, posted_at);

-- -----------------------------------------------------------------
-- AUDIT LOG
-- -----------------------------------------------------------------

CREATE TABLE audit_log (
  audit_log_id     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id           uuid NOT NULL REFERENCES organizations(org_id) ON DELETE CASCADE,
  user_id          uuid REFERENCES auth.users(id),
  session_id       uuid,
  trace_id         uuid NOT NULL,
  action           text NOT NULL,
  entity_type      text NOT NULL,
  entity_id        uuid,
  before_state     jsonb,
  after_state_id   uuid,
  tool_name        text,
  idempotency_key  uuid,
  created_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_audit_org_trace ON audit_log (org_id, trace_id);
CREATE INDEX idx_audit_org_created ON audit_log (org_id, created_at);

-- -----------------------------------------------------------------
-- AI ACTIONS
-- -----------------------------------------------------------------

CREATE TABLE ai_actions (
  ai_action_id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id              uuid NOT NULL REFERENCES organizations(org_id) ON DELETE CASCADE,
  user_id             uuid REFERENCES auth.users(id),
  session_id          uuid,
  trace_id            uuid NOT NULL,
  tool_name           text NOT NULL,
  prompt              text,
  tool_input          jsonb,
  status              ai_action_status NOT NULL DEFAULT 'pending',
  confidence          confidence_level,
  routing_path        text,
  journal_entry_id    uuid REFERENCES journal_entries(journal_entry_id),
  confirming_user_id  uuid REFERENCES auth.users(id),
  rejection_reason    text,
  idempotency_key     uuid NOT NULL,
  response_payload    jsonb,
  staled_at           timestamptz,
  created_at          timestamptz NOT NULL DEFAULT now(),
  confirmed_at        timestamptz,
  UNIQUE (org_id, idempotency_key),
  CONSTRAINT stale_status_has_timestamp
    CHECK ((status = 'stale') = (staled_at IS NOT NULL))
);

CREATE INDEX idx_ai_actions_org_status ON ai_actions (org_id, status, created_at DESC);

-- -----------------------------------------------------------------
-- AGENT SESSIONS
-- -----------------------------------------------------------------

CREATE TABLE agent_sessions (
  session_id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id            uuid NOT NULL REFERENCES organizations(org_id) ON DELETE CASCADE,
  locale            text NOT NULL DEFAULT 'en',
  started_at        timestamptz NOT NULL DEFAULT now(),
  last_activity_at  timestamptz NOT NULL DEFAULT now(),
  state             jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX idx_agent_sessions_user_org ON agent_sessions (user_id, org_id);
CREATE INDEX idx_agent_sessions_last_activity ON agent_sessions (last_activity_at);

-- -----------------------------------------------------------------
-- EVENTS TABLE — RESERVED SEAT
-- -----------------------------------------------------------------

CREATE TABLE events (
  event_id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type       text NOT NULL,
  org_id           uuid NOT NULL REFERENCES organizations(org_id),
  aggregate_id     uuid NOT NULL,
  aggregate_type   text NOT NULL,
  payload          jsonb NOT NULL,
  occurred_at      timestamptz NOT NULL,
  recorded_at      timestamptz NOT NULL DEFAULT now(),
  trace_id         uuid NOT NULL,
  _event_version   text NOT NULL DEFAULT '1.0.0',
  sequence_number  bigserial NOT NULL
);

CREATE INDEX idx_events_org_aggregate ON events (org_id, aggregate_id, sequence_number);
CREATE INDEX idx_events_trace ON events (trace_id);
CREATE INDEX idx_events_type_recorded ON events (event_type, recorded_at);

COMMENT ON TABLE events IS
  'Reserved seat. Nothing writes here until Phase 2. Append-only trigger installed in Phase 1.1 to make the rule physical from day one.';

-- -----------------------------------------------------------------
-- EVENTS APPEND-ONLY TRIGGERS
-- -----------------------------------------------------------------

CREATE OR REPLACE FUNCTION reject_events_mutation()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'events table is append-only — UPDATE, DELETE, and TRUNCATE are forbidden'
    USING ERRCODE = 'feature_not_supported';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_events_no_update
  BEFORE UPDATE ON events
  FOR EACH ROW
  EXECUTE FUNCTION reject_events_mutation();

CREATE TRIGGER trg_events_no_delete
  BEFORE DELETE ON events
  FOR EACH ROW
  EXECUTE FUNCTION reject_events_mutation();

CREATE TRIGGER trg_events_no_truncate
  BEFORE TRUNCATE ON events
  FOR EACH STATEMENT
  EXECUTE FUNCTION reject_events_mutation();

REVOKE TRUNCATE ON events FROM PUBLIC;
REVOKE TRUNCATE ON events FROM authenticated;
REVOKE TRUNCATE ON events FROM anon;

-- -----------------------------------------------------------------
-- RLS HELPER FUNCTIONS
-- -----------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.user_has_org_access(target_org_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.memberships
    WHERE user_id = auth.uid() AND org_id = target_org_id
  );
$$;

REVOKE ALL ON FUNCTION public.user_has_org_access(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.user_has_org_access(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.user_is_controller(target_org_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.memberships
    WHERE user_id = auth.uid()
      AND org_id = target_org_id
      AND role = 'controller'
  );
$$;

REVOKE ALL ON FUNCTION public.user_is_controller(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.user_is_controller(uuid) TO authenticated;

-- -----------------------------------------------------------------
-- ENABLE RLS
-- -----------------------------------------------------------------

ALTER TABLE organizations                ENABLE ROW LEVEL SECURITY;
ALTER TABLE memberships                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE chart_of_accounts            ENABLE ROW LEVEL SECURITY;
ALTER TABLE chart_of_accounts_templates  ENABLE ROW LEVEL SECURITY;
ALTER TABLE fiscal_periods               ENABLE ROW LEVEL SECURITY;
ALTER TABLE intercompany_relationships   ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entries              ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_lines                ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendors                      ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_rules                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers                    ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices                     ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_lines                ENABLE ROW LEVEL SECURITY;
ALTER TABLE bills                        ENABLE ROW LEVEL SECURITY;
ALTER TABLE bill_lines                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments                     ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_accounts                ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_transactions            ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_codes                    ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log                    ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_actions                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_sessions               ENABLE ROW LEVEL SECURITY;
ALTER TABLE events                       ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------
-- RLS POLICIES
-- -----------------------------------------------------------------

CREATE POLICY organizations_select ON organizations
  FOR SELECT USING (user_has_org_access(org_id));

CREATE POLICY memberships_select ON memberships
  FOR SELECT USING (
    user_id = auth.uid() OR user_is_controller(org_id)
  );

CREATE POLICY chart_of_accounts_select ON chart_of_accounts
  FOR SELECT USING (user_has_org_access(org_id));
CREATE POLICY chart_of_accounts_insert ON chart_of_accounts
  FOR INSERT WITH CHECK (user_has_org_access(org_id));
CREATE POLICY chart_of_accounts_update ON chart_of_accounts
  FOR UPDATE USING (user_has_org_access(org_id));

CREATE POLICY coa_templates_select ON chart_of_accounts_templates
  FOR SELECT TO authenticated USING (true);

CREATE POLICY fiscal_periods_select ON fiscal_periods
  FOR SELECT USING (user_has_org_access(org_id));
CREATE POLICY fiscal_periods_insert ON fiscal_periods
  FOR INSERT WITH CHECK (user_is_controller(org_id));
CREATE POLICY fiscal_periods_update ON fiscal_periods
  FOR UPDATE USING (user_is_controller(org_id));

CREATE POLICY intercompany_relationships_select ON intercompany_relationships
  FOR SELECT USING (
    user_has_org_access(org_a_id) OR user_has_org_access(org_b_id)
  );

CREATE POLICY journal_entries_select ON journal_entries
  FOR SELECT USING (user_has_org_access(org_id));
CREATE POLICY journal_entries_insert ON journal_entries
  FOR INSERT WITH CHECK (user_has_org_access(org_id));
CREATE POLICY journal_entries_no_update ON journal_entries
  FOR UPDATE USING (false);
CREATE POLICY journal_entries_no_delete ON journal_entries
  FOR DELETE USING (false);

CREATE POLICY journal_lines_select ON journal_lines
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM journal_entries je
      WHERE je.journal_entry_id = journal_lines.journal_entry_id
        AND user_has_org_access(je.org_id)
    )
  );
CREATE POLICY journal_lines_insert ON journal_lines
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM journal_entries je
      WHERE je.journal_entry_id = journal_lines.journal_entry_id
        AND user_has_org_access(je.org_id)
    )
  );
CREATE POLICY journal_lines_no_update ON journal_lines
  FOR UPDATE USING (false);
CREATE POLICY journal_lines_no_delete ON journal_lines
  FOR DELETE USING (false);

CREATE POLICY vendors_select ON vendors
  FOR SELECT USING (user_has_org_access(org_id));
CREATE POLICY vendors_insert ON vendors
  FOR INSERT WITH CHECK (user_has_org_access(org_id));
CREATE POLICY vendors_update ON vendors
  FOR UPDATE USING (user_has_org_access(org_id));

CREATE POLICY vendor_rules_select ON vendor_rules
  FOR SELECT USING (user_has_org_access(org_id));
CREATE POLICY vendor_rules_cud ON vendor_rules
  FOR ALL USING (user_is_controller(org_id))
  WITH CHECK (user_is_controller(org_id));

CREATE POLICY customers_select ON customers
  FOR SELECT USING (user_has_org_access(org_id));
CREATE POLICY customers_insert ON customers
  FOR INSERT WITH CHECK (user_has_org_access(org_id));
CREATE POLICY customers_update ON customers
  FOR UPDATE USING (user_has_org_access(org_id));

CREATE POLICY invoices_tenant ON invoices FOR ALL
  USING (user_has_org_access(org_id))
  WITH CHECK (user_has_org_access(org_id));

CREATE POLICY invoice_lines_tenant ON invoice_lines FOR ALL
  USING (
    EXISTS (SELECT 1 FROM invoices i
            WHERE i.invoice_id = invoice_lines.invoice_id
              AND user_has_org_access(i.org_id))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM invoices i
            WHERE i.invoice_id = invoice_lines.invoice_id
              AND user_has_org_access(i.org_id))
  );

CREATE POLICY bills_tenant ON bills FOR ALL
  USING (user_has_org_access(org_id))
  WITH CHECK (user_has_org_access(org_id));

CREATE POLICY bill_lines_tenant ON bill_lines FOR ALL
  USING (
    EXISTS (SELECT 1 FROM bills b
            WHERE b.bill_id = bill_lines.bill_id
              AND user_has_org_access(b.org_id))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM bills b
            WHERE b.bill_id = bill_lines.bill_id
              AND user_has_org_access(b.org_id))
  );

CREATE POLICY payments_tenant ON payments FOR ALL
  USING (user_has_org_access(org_id))
  WITH CHECK (user_has_org_access(org_id));

CREATE POLICY bank_accounts_tenant ON bank_accounts FOR ALL
  USING (user_has_org_access(org_id))
  WITH CHECK (user_has_org_access(org_id));

CREATE POLICY bank_transactions_tenant ON bank_transactions FOR ALL
  USING (user_has_org_access(org_id))
  WITH CHECK (user_has_org_access(org_id));

CREATE POLICY tax_codes_select ON tax_codes
  FOR SELECT USING (
    org_id IS NULL OR user_has_org_access(org_id)
  );

CREATE POLICY audit_log_select ON audit_log
  FOR SELECT USING (user_has_org_access(org_id));

CREATE POLICY ai_actions_select ON ai_actions
  FOR SELECT USING (
    user_id = auth.uid() OR user_is_controller(org_id)
  );
CREATE POLICY ai_actions_insert ON ai_actions
  FOR INSERT WITH CHECK (user_has_org_access(org_id));

CREATE POLICY agent_sessions_select ON agent_sessions
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY events_select ON events
  FOR SELECT USING (user_has_org_access(org_id));

-- -----------------------------------------------------------------
-- SEED: Two CoA templates
-- -----------------------------------------------------------------

INSERT INTO chart_of_accounts_templates (industry, account_code, account_name, account_type, parent_account_code, is_intercompany_capable, sort_order) VALUES
  ('holding_company', '1000', 'Cash and Cash Equivalents',       'asset',     NULL,   false, 10),
  ('holding_company', '1100', 'Investments in Subsidiaries',     'asset',     NULL,   true,  20),
  ('holding_company', '1200', 'Intercompany Receivables',        'asset',     NULL,   true,  30),
  ('holding_company', '1300', 'Other Receivables',               'asset',     NULL,   false, 40),
  ('holding_company', '2000', 'Accounts Payable',                'liability', NULL,   false, 50),
  ('holding_company', '2100', 'Intercompany Payables',           'liability', NULL,   true,  60),
  ('holding_company', '2200', 'Accrued Liabilities',             'liability', NULL,   false, 70),
  ('holding_company', '3000', 'Share Capital',                   'equity',    NULL,   false, 80),
  ('holding_company', '3100', 'Retained Earnings',               'equity',    NULL,   false, 90),
  ('holding_company', '4000', 'Dividend Income',                 'revenue',   NULL,   false, 100),
  ('holding_company', '4100', 'Management Fee Income',           'revenue',   NULL,   true,  110),
  ('holding_company', '4200', 'Interest Income',                 'revenue',   NULL,   false, 120),
  ('holding_company', '5000', 'Professional Fees',               'expense',   NULL,   false, 130),
  ('holding_company', '5100', 'Office Expenses',                 'expense',   NULL,   false, 140),
  ('holding_company', '5200', 'Salaries and Wages',              'expense',   NULL,   false, 150),
  ('holding_company', '5300', 'Interest Expense',                'expense',   NULL,   false, 160);

INSERT INTO chart_of_accounts_templates (industry, account_code, account_name, account_type, parent_account_code, is_intercompany_capable, sort_order) VALUES
  ('real_estate', '1000', 'Cash and Cash Equivalents',           'asset',     NULL,   false, 10),
  ('real_estate', '1100', 'Tenant Receivables',                  'asset',     NULL,   false, 20),
  ('real_estate', '1200', 'Prepaid Property Taxes',              'asset',     NULL,   false, 30),
  ('real_estate', '1300', 'Land',                                'asset',     NULL,   false, 40),
  ('real_estate', '1400', 'Buildings',                           'asset',     NULL,   false, 50),
  ('real_estate', '1410', 'Accumulated Depreciation - Buildings','asset',     '1400', false, 60),
  ('real_estate', '1500', 'Intercompany Receivables',            'asset',     NULL,   true,  70),
  ('real_estate', '2000', 'Accounts Payable',                    'liability', NULL,   false, 80),
  ('real_estate', '2100', 'Mortgages Payable',                   'liability', NULL,   false, 90),
  ('real_estate', '2200', 'Tenant Security Deposits',            'liability', NULL,   false, 100),
  ('real_estate', '2300', 'Intercompany Payables',               'liability', NULL,   true,  110),
  ('real_estate', '3000', 'Owner Capital',                       'equity',    NULL,   false, 120),
  ('real_estate', '3100', 'Retained Earnings',                   'equity',    NULL,   false, 130),
  ('real_estate', '4000', 'Rental Income',                       'revenue',   NULL,   false, 140),
  ('real_estate', '4100', 'Parking Income',                      'revenue',   NULL,   false, 150),
  ('real_estate', '4200', 'Other Property Income',               'revenue',   NULL,   false, 160),
  ('real_estate', '5000', 'Property Management Fees',            'expense',   NULL,   true,  170),
  ('real_estate', '5100', 'Repairs and Maintenance',             'expense',   NULL,   false, 180),
  ('real_estate', '5200', 'Property Taxes',                      'expense',   NULL,   false, 190),
  ('real_estate', '5300', 'Insurance',                           'expense',   NULL,   false, 200),
  ('real_estate', '5400', 'Utilities',                           'expense',   NULL,   false, 210),
  ('real_estate', '5500', 'Mortgage Interest',                   'expense',   NULL,   false, 220),
  ('real_estate', '5600', 'Depreciation - Buildings',            'expense',   NULL,   false, 230);

COMMIT;

