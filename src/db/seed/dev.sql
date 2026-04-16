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