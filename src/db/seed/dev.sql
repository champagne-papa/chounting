BEGIN;

-- 1. Wipe seed data (cascade handles dependents)
DELETE FROM organizations
WHERE name IN ('Bridge Holding Co (DEV)', 'Bridge Real Estate Entity (DEV)');

-- 2. Create the two orgs with fixed UUIDs.
--    Phase 1.5A: industry_id (FK to industries) and business_structure
--    are NOT NULL. industry_id is looked up by slug from the seeded
--    industries table. The legacy industry enum column remains
--    populated during the two-step migration cutover.
INSERT INTO organizations (
  org_id, name, legal_name, industry, industry_id, business_structure,
  functional_currency, fiscal_year_start_month
) VALUES
  ('11111111-1111-1111-1111-111111111111',
   'Bridge Holding Co (DEV)', 'Bridge Holding Company Inc.',
   'holding_company',
   (SELECT industry_id FROM industries WHERE slug = 'holding_company'),
   'corporation',
   'CAD', 1),
  ('22222222-2222-2222-2222-222222222222',
   'Bridge Real Estate Entity (DEV)', 'Bridge Real Estate Holdings Ltd.',
   'real_estate',
   (SELECT industry_id FROM industries WHERE slug = 'real_estate_operating'),
   'corporation',
   'CAD', 1);

-- 3. Load CoA from templates into each org
INSERT INTO chart_of_accounts (org_id, account_code, account_name, account_type, is_intercompany_capable)
SELECT
  '11111111-1111-1111-1111-111111111111'::uuid,
  account_code, account_name, account_type, is_intercompany_capable
FROM chart_of_accounts_templates
WHERE industry = 'holding_company';

INSERT INTO chart_of_accounts (org_id, account_code, account_name, account_type, is_intercompany_capable)
SELECT
  '22222222-2222-2222-2222-222222222222'::uuid,
  account_code, account_name, account_type, is_intercompany_capable
FROM chart_of_accounts_templates
WHERE industry = 'real_estate';

-- 3b. EC-2 (Session 8 C6) CoA extension for the Real Estate test org.
--     The EC-2 prompt set exercises accounts not covered by the Real
--     Estate template (AR, consulting revenue, prepaid insurance,
--     payroll withholdings, GST/PST, equipment, etc.). These additions
--     are dev-only and survive `pnpm db:reset:clean`. ON CONFLICT DO
--     NOTHING keeps this section idempotent.
--
--     Phase 1.3+ TODO: this is a workaround. The real fix is more
--     industry templates + a CoA customization UX. Tracked in the
--     Session 8 C6 closeout friction-journal entry.
INSERT INTO chart_of_accounts (org_id, account_code, account_name, account_type, is_intercompany_capable)
VALUES
  -- Assets
  ('22222222-2222-2222-2222-222222222222', '1250', 'Prepaid Insurance',                    'asset',     false),
  ('22222222-2222-2222-2222-222222222222', '1260', 'GST Input Tax Credit',                 'asset',     false),
  ('22222222-2222-2222-2222-222222222222', '1600', 'Accounts Receivable',                  'asset',     false),
  ('22222222-2222-2222-2222-222222222222', '1610', 'Allowance for Doubtful Accounts',      'asset',     false),
  ('22222222-2222-2222-2222-222222222222', '1700', 'Equipment',                            'asset',     false),
  ('22222222-2222-2222-2222-222222222222', '1710', 'Accumulated Depreciation - Equipment', 'asset',     false),
  ('22222222-2222-2222-2222-222222222222', '1800', 'Software (Intangible)',                'asset',     false),
  ('22222222-2222-2222-2222-222222222222', '1810', 'Accumulated Amortization - Software',  'asset',     false),
  -- Liabilities
  ('22222222-2222-2222-2222-222222222222', '2010', 'Credit Card Payable',                  'liability', false),
  ('22222222-2222-2222-2222-222222222222', '2020', 'GST Payable',                          'liability', false),
  ('22222222-2222-2222-2222-222222222222', '2030', 'PST Payable',                          'liability', false),
  ('22222222-2222-2222-2222-222222222222', '2040', 'Federal Income Tax Payable',           'liability', false),
  ('22222222-2222-2222-2222-222222222222', '2050', 'CPP Payable',                          'liability', false),
  ('22222222-2222-2222-2222-222222222222', '2060', 'EI Payable',                           'liability', false),
  ('22222222-2222-2222-2222-222222222222', '2400', 'Unearned Revenue',                     'liability', false),
  ('22222222-2222-2222-2222-222222222222', '2410', 'Accrued Interest Payable',             'liability', false),
  ('22222222-2222-2222-2222-222222222222', '2500', 'Equipment Loan Payable',               'liability', false),
  -- Revenue
  ('22222222-2222-2222-2222-222222222222', '4300', 'Consulting Revenue',                   'revenue',   false),
  -- Expenses
  ('22222222-2222-2222-2222-222222222222', '5650', 'Rent Expense',                         'expense',   false),
  ('22222222-2222-2222-2222-222222222222', '5700', 'Office Supplies Expense',              'expense',   false),
  ('22222222-2222-2222-2222-222222222222', '5710', 'Cloud/Hosting Expense',                'expense',   false),
  ('22222222-2222-2222-2222-222222222222', '5720', 'Software Subscriptions',               'expense',   false),
  ('22222222-2222-2222-2222-222222222222', '5730', 'Meals & Entertainment',                'expense',   false),
  ('22222222-2222-2222-2222-222222222222', '5740', 'Professional Fees',                    'expense',   false),
  ('22222222-2222-2222-2222-222222222222', '5750', 'Contractor Expense',                   'expense',   false),
  ('22222222-2222-2222-2222-222222222222', '5760', 'Insurance Expense',                    'expense',   false),
  ('22222222-2222-2222-2222-222222222222', '5770', 'Depreciation Expense - Equipment',     'expense',   false),
  ('22222222-2222-2222-2222-222222222222', '5780', 'Amortization Expense',                 'expense',   false),
  ('22222222-2222-2222-2222-222222222222', '5790', 'Bad Debt Expense',                     'expense',   false),
  ('22222222-2222-2222-2222-222222222222', '5800', 'Salary/Wage Expense',                  'expense',   false),
  ('22222222-2222-2222-2222-222222222222', '5810', 'Interest Expense',                     'expense',   false)
ON CONFLICT (org_id, account_code) DO NOTHING;

-- 4. Memberships (Phase 1.5B: status + is_org_owner, Phase 1.5C: role_id)
-- Executive: access to BOTH orgs
INSERT INTO memberships (user_id, org_id, role, role_id, status) VALUES
  ('00000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'executive', (SELECT role_id FROM roles WHERE role_key = 'executive'), 'active'),
  ('00000000-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222', 'executive', (SELECT role_id FROM roles WHERE role_key = 'executive'), 'active');

-- Controller: access to BOTH orgs, is_org_owner for each
INSERT INTO memberships (user_id, org_id, role, role_id, status, is_org_owner) VALUES
  ('00000000-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'controller', (SELECT role_id FROM roles WHERE role_key = 'controller'), 'active', true),
  ('00000000-0000-0000-0000-000000000002', '22222222-2222-2222-2222-222222222222', 'controller', (SELECT role_id FROM roles WHERE role_key = 'controller'), 'active', true);

-- AP Specialist: access to ONLY the Real Estate org (proves the role-aware switcher)
INSERT INTO memberships (user_id, org_id, role, role_id, status) VALUES
  ('00000000-0000-0000-0000-000000000003', '22222222-2222-2222-2222-222222222222', 'ap_specialist', (SELECT role_id FROM roles WHERE role_key = 'ap_specialist'), 'active');

-- 4b. User profiles for seed users (Phase 1.5B)
INSERT INTO user_profiles (user_id, first_name, last_name, display_name)
VALUES
  ('00000000-0000-0000-0000-000000000001', 'Exec', 'User', 'Executive User'),
  ('00000000-0000-0000-0000-000000000002', 'Controller', 'User', 'Controller User'),
  ('00000000-0000-0000-0000-000000000003', 'AP', 'Specialist', 'AP Specialist')
ON CONFLICT (user_id) DO NOTHING;

-- 5. One open fiscal period per org (current calendar year)
INSERT INTO fiscal_periods (org_id, name, start_date, end_date, is_locked) VALUES
  ('11111111-1111-1111-1111-111111111111', 'FY Current', date_trunc('year', now())::date, (date_trunc('year', now()) + interval '1 year - 1 day')::date, false),
  ('22222222-2222-2222-2222-222222222222', 'FY Current', date_trunc('year', now())::date, (date_trunc('year', now()) + interval '1 year - 1 day')::date, false);

-- One LOCKED period for the prior year — used by integration test 2
INSERT INTO fiscal_periods (org_id, name, start_date, end_date, is_locked, locked_at) VALUES
  ('22222222-2222-2222-2222-222222222222', 'FY Prior (LOCKED)',
   (date_trunc('year', now()) - interval '1 year')::date,
   (date_trunc('year', now()) - interval '1 day')::date,
   true, now());

COMMIT;