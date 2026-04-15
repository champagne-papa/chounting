-- =============================================================
-- 20240108000000_seed_industries.sql
-- Phase 1.5A: NAICS-light industries lookup table + seed
-- =============================================================
-- Replaces the org_industry enum dependency on organizations with
-- a normalized lookup. The org_industry enum itself stays because
-- chart_of_accounts_templates.industry still uses it. The bridge
-- column default_coa_template_industry maps rows here back to
-- that enum so template loading at org creation continues to work.
--
-- See docs/09_briefs/phase-1.5/brief.md §4.1 for rationale and
-- §9 for the seed-verification rules.
-- =============================================================

BEGIN;

CREATE TABLE industries (
  industry_id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  naics_code                     text,
  slug                           text UNIQUE NOT NULL,
  display_name                   text NOT NULL,
  parent_industry_id             uuid REFERENCES industries(industry_id),
  default_coa_template_industry  org_industry,
  is_active                      boolean NOT NULL DEFAULT true,
  sort_order                     integer NOT NULL DEFAULT 0,
  created_at                     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_industries_slug ON industries (slug);
CREATE INDEX idx_industries_parent ON industries (parent_industry_id);

ALTER TABLE industries ENABLE ROW LEVEL SECURITY;

CREATE POLICY industries_select ON industries
  FOR SELECT TO authenticated USING (true);

COMMENT ON TABLE industries IS
  'NAICS-light industry classification. Seeded only; no writes at runtime. Bridge column default_coa_template_industry maps rows back to the org_industry enum for CoA template loading until that enum is fully retired.';

-- -----------------------------------------------------------------
-- Seed — 28 entries spanning NAICS 2-digit sectors + family-office
-- relevant subdivisions. naics_code is intentionally NULL on every
-- row in 1.5A — populating the codes is a follow-up seed-update
-- migration, tracked as a post-1.5A obligation.
--
-- Bridge invariant: every row that maps to an existing
-- chart_of_accounts_templates.industry value MUST populate
-- default_coa_template_industry. Currently holding_company and
-- real_estate have seeded templates; those bridges are non-negotiable.
-- The other four enum values (healthcare, hospitality, trading,
-- restaurant) have no CoA templates yet, but the bridge rows are
-- seeded here so future template migrations are a pure seed-insert.
-- -----------------------------------------------------------------

INSERT INTO industries
  (naics_code, slug, display_name, default_coa_template_industry, sort_order)
VALUES
  -- NAICS 11
  (NULL,  'agriculture',             'Agriculture, Forestry, Fishing',        NULL,              10),
  -- NAICS 21
  (NULL,  'mining_oil_gas',          'Mining, Oil & Gas Extraction',          NULL,              20),
  -- NAICS 22
  (NULL,  'utilities',               'Utilities',                             NULL,              30),
  -- NAICS 23
  (NULL,  'construction',            'Construction',                          NULL,              40),
  -- NAICS 31-33
  (NULL,  'manufacturing',           'Manufacturing',                         NULL,              50),
  -- NAICS 42
  (NULL,  'wholesale',               'Wholesale Trade',                       'trading',         60),
  -- NAICS 44-45
  (NULL,  'retail',                  'Retail Trade',                          NULL,              70),
  -- NAICS 48-49
  (NULL,  'transportation',          'Transportation & Warehousing',          NULL,              80),
  -- NAICS 51
  (NULL,  'technology',              'Information Technology & Software',     NULL,              90),
  (NULL,  'media',                   'Media & Publishing',                    NULL,             100),
  -- NAICS 52 — Finance
  (NULL,  'financial_services',      'Financial Services',                    NULL,             110),
  (NULL,  'holding_company',         'Holding Company',                       'holding_company',120),
  (NULL,  'investment_fund',         'Investment Fund',                       NULL,             121),
  (NULL,  'family_office',           'Family Office',                         'holding_company',122),
  -- NAICS 53 — Real Estate
  (NULL,  'real_estate_operating',   'Real Estate Operating Company',         'real_estate',    130),
  (NULL,  'real_estate_reit',        'Real Estate Investment Trust (REIT)',   'real_estate',    131),
  (NULL,  'real_estate_development', 'Real Estate Development',               'real_estate',    132),
  (NULL,  'equipment_rental',        'Equipment Rental & Leasing',            NULL,             140),
  -- NAICS 54
  (NULL,  'professional_services',   'Professional & Technical Services',     NULL,             150),
  (NULL,  'legal_services',          'Legal Services',                        NULL,             151),
  (NULL,  'accounting_services',     'Accounting & Tax Services',             NULL,             152),
  -- NAICS 62
  (NULL,  'healthcare',              'Health Care',                           'healthcare',     160),
  -- NAICS 71
  (NULL,  'arts_entertainment',      'Arts, Entertainment & Recreation',      NULL,             170),
  -- NAICS 72 — Accommodation + Food Services
  (NULL,  'hospitality',             'Hospitality & Accommodation',           'hospitality',    180),
  (NULL,  'restaurant',              'Restaurant & Food Service',             'restaurant',     181),
  -- NAICS 81
  (NULL,  'nonprofit',               'Nonprofit Organization',                NULL,             190),
  -- NAICS 92
  (NULL,  'government',              'Government / Public Administration',    NULL,             200),
  -- Fallback
  (NULL,  'other',                   'Other / Not Otherwise Classified',      NULL,             999);

COMMIT;
