-- =============================================================
-- 20240109000000_extend_organizations.sql
-- Phase 1.5A: additive organizations profile columns
-- =============================================================
-- Adds every new organizations column in one migration. The
-- legacy organizations.industry column is NOT dropped here — that
-- happens in a follow-up migration after app code cuts over to
-- industry_id. See docs/09_briefs/phase-1.5/brief.md §8 for the
-- two-step rollback-safety rationale.
-- =============================================================

BEGIN;

-- -----------------------------------------------------------------
-- NEW ENUMS
-- -----------------------------------------------------------------

CREATE TYPE business_structure AS ENUM (
  'sole_prop',
  'partnership',
  'corporation',
  'trust',
  'non_profit',
  'other'
);

CREATE TYPE accounting_framework AS ENUM (
  'aspe',
  'ifrs',
  'us_gaap',
  'other'
);

CREATE TYPE report_basis AS ENUM (
  'accrual',
  'cash'
);

CREATE TYPE org_status AS ENUM (
  'active',
  'trial',
  'suspended',
  'archived',
  'closed'
);

-- -----------------------------------------------------------------
-- COLUMN ADDITIONS
-- -----------------------------------------------------------------
-- business_structure is added nullable here; backfilled to 'other'
-- below; then flipped to NOT NULL. Same two-step pattern for
-- industry_id but with the backfill coming from the legacy
-- industry enum via the industries bridge column.
-- -----------------------------------------------------------------

ALTER TABLE organizations
  ADD COLUMN logo_storage_path            text,
  ADD COLUMN business_structure           business_structure,
  ADD COLUMN business_registration_number text,
  ADD COLUMN tax_registration_number      text,
  ADD COLUMN gst_registration_date        date,
  ADD COLUMN accounting_framework         accounting_framework NOT NULL DEFAULT 'aspe',
  ADD COLUMN description                  text,
  ADD COLUMN website                      text,
  ADD COLUMN email                        text,
  ADD COLUMN phone                        text,
  ADD COLUMN phone_country_code           text,
  ADD COLUMN time_zone                    text NOT NULL DEFAULT 'America/Vancouver',
  ADD COLUMN default_locale               text NOT NULL DEFAULT 'en',
  ADD COLUMN default_report_basis         report_basis NOT NULL DEFAULT 'accrual',
  ADD COLUMN default_payment_terms_days   integer NOT NULL DEFAULT 30,
  ADD COLUMN multi_currency_enabled       boolean NOT NULL DEFAULT false,
  ADD COLUMN status                       org_status NOT NULL DEFAULT 'active',
  ADD COLUMN mfa_required                 boolean NOT NULL DEFAULT false,
  ADD COLUMN books_start_date             date,
  ADD COLUMN external_ids                 jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN industry_id                  uuid REFERENCES industries(industry_id),
  ADD COLUMN parent_org_id                uuid REFERENCES organizations(org_id);

-- -----------------------------------------------------------------
-- NAMED CHECK CONSTRAINTS
-- See docs/02_specs/data_model.md organizations section for rationale.
-- -----------------------------------------------------------------

ALTER TABLE organizations
  ADD CONSTRAINT org_default_payment_terms_nonneg
    CHECK (default_payment_terms_days >= 0),
  ADD CONSTRAINT org_parent_is_not_self
    CHECK (parent_org_id IS NULL OR parent_org_id <> org_id),
  ADD CONSTRAINT org_country_phone_code_shape
    CHECK (phone_country_code IS NULL OR phone_country_code ~ '^\+[0-9]{1,3}$'),
  ADD CONSTRAINT org_external_ids_is_object
    CHECK (jsonb_typeof(external_ids) = 'object');

-- -----------------------------------------------------------------
-- STEP 1: backfill industry_id from the legacy industry enum
--         using the bridge column on industries.
-- -----------------------------------------------------------------

UPDATE organizations o
SET industry_id = i.industry_id
FROM industries i
WHERE i.default_coa_template_industry = o.industry
  AND o.industry_id IS NULL;

-- -----------------------------------------------------------------
-- STEP 2: enforce NOT NULL on industry_id.
--
-- If any organization row remains with industry_id = NULL at this
-- point, the bridge failed and the migration must roll back — do
-- not ship a nullable industry_id into production. The enum value
-- on that org has no corresponding industries row and needs either
-- (a) a new industries seed row with a matching bridge, or
-- (b) explicit assignment to an existing industries row.
-- -----------------------------------------------------------------

ALTER TABLE organizations
  ALTER COLUMN industry_id SET NOT NULL;

-- -----------------------------------------------------------------
-- business_structure backfill: existing rows get 'other' as the
-- deliberately-unspecific default. Orgs update to their real
-- structure via updateOrgProfile.
-- -----------------------------------------------------------------

UPDATE organizations
SET business_structure = 'other'
WHERE business_structure IS NULL;

ALTER TABLE organizations
  ALTER COLUMN business_structure SET NOT NULL;

-- -----------------------------------------------------------------
-- INDEXES
-- -----------------------------------------------------------------

CREATE INDEX idx_organizations_industry ON organizations (industry_id);
CREATE INDEX idx_organizations_parent_org ON organizations (parent_org_id)
  WHERE parent_org_id IS NOT NULL;
CREATE INDEX idx_organizations_status ON organizations (status)
  WHERE status <> 'active';

COMMIT;
