# Phase 1.5A Execution Brief — Organization Profile Expansion

*This brief is the execution spec for Phase 1.5A of The Bridge. It
extends the Phase 1.1 schema with the organization profile surface
area needed before Phase 1.2 begins. Phase 1.5 is split into three
sub-phases; only 1.5A is in scope here:*

- **1.5A — additive organization schema** (this brief)
- **1.5B — users, invitations, MFA enforcement**
- **1.5C — permissions refactor**

**How to read this file.**

- `CLAUDE.md` at the repo root carries the standing rules loaded
  every session. The Two Laws of Service Architecture, the
  `withInvariants()` requirement, the money string rule, and the
  Zod validation rule are all in effect throughout this phase.
- `docs/02_specs/ledger_truth_model.md` is the rules reference. If
  anything in this brief contradicts an INV leaf, the leaf wins and
  this brief is wrong.
- `docs/02_specs/data_model.md` is the schema reference. This brief
  mutates that file — the new tables (`industries`,
  `organization_addresses`), the extended `organizations` columns,
  and the `journal_entries` source-tracking additions all land in
  that doc in the same session this brief is written.
- `docs/09_briefs/phase-1.2/obligations.md` catalogs what Phase 1.2
  inherits. Phase 1.5A does not absorb those obligations — it
  precedes Phase 1.2 chronologically but does not discharge them.

**If anything in this brief contradicts `CLAUDE.md` or the canonical
docs in `docs/02_specs/`, the canonical doc wins and this brief is
wrong — flag immediately and fix here, not there.**

---

## 1. Goal

**Phase 1.5A lands the additive organization profile schema that
Phase 1.2 (agent integration) and downstream phases (reporting,
onboarding, multi-entity) need in place before they can execute.**

What "done" means in one paragraph: an organization row carries
its full business profile (legal structure, CRA Business Number,
GST/HST registration, accounting framework, reporting basis,
locale/timezone, status, MFA requirement, books start date, a
typed-key external-ids bag, a self-referential parent org pointer);
an organization has one-to-many addresses typed by purpose
(`mailing`, `physical`, `registered`, `payment_stub`) with exactly
one primary per type; industry classification moves from an enum
column on `organizations` to an FK into a new `industries` lookup
table (NAICS-light, ~25+ entries) while preserving the legacy
`org_industry` enum for `chart_of_accounts_templates.industry`; and
every mutation through the new `orgService.updateOrgProfile` /
`addressService` surface is audit-logged with a full `before_state`
snapshot. The `industries` table is authenticated-SELECT, no
writes. **No new journal entry behavior, no MFA enforcement, no
reporting behavior change, no UI polish.** Phase 1.5A is schema +
service + audit + tests; UI lands in 1.5B.

All ten Category A floor tests (the existing five from Phase 1.1,
plus five new floor tests specific to 1.5A) pass.

---

## 2. Prerequisites

### 2.1 Anchor docs (read in this order before writing code)

1. `docs/09_briefs/phase-1.1/brief.md` — density reference for this
   brief's house style.
2. `docs/09_briefs/CURRENT_STATE.md` — where Phase 1.1 closed.
3. `docs/09_briefs/phase-1.2/obligations.md` — what 1.2 inherits
   (1.5A must not interfere with any of these).
4. `docs/02_specs/data_model.md` — current schema; 1.5A extends
   this doc in the same session as the brief.
5. `docs/02_specs/ledger_truth_model.md` — INV leaves. The new
   tables do not introduce new ledger invariants; they inherit the
   existing RLS, audit, and service-middleware rules.
6. `docs/03_architecture/phase_simplifications.md` — the
   reserved-seat posture for `events` and synchronous `audit_log`
   remains unchanged in 1.5A.

### 2.2 Environment

No new environment variables. No new dependencies. Phase 1.5A is
pure schema + service + test additions against the existing
Supabase local stack and the existing Vitest harness.

### 2.3 Session-start git hygiene

Per Phase 1.2 obligation #5 (elevated from friction journal): every
session starts with `git status --short`, expected empty. Any
uncommitted files must be surfaced and decided on before 1.5A work
begins.

---

## 3. Locked Decisions (do not re-litigate)

These decisions are inputs to the brief, not open questions for
this session:

- **Industry model.** `org_industry` enum column on `organizations`
  is replaced by a new `industry_id` FK into an `industries` lookup
  table. Two-step migration (see §8): add nullable + backfill +
  NOT NULL now; drop the old `industry` column in a later migration
  after app code cuts over. The `org_industry` enum itself stays
  because `chart_of_accounts_templates.industry` still depends on
  it. Bridge via `industries.default_coa_template_industry`.
- **Address model.** One-to-many `organization_addresses` table
  with `address_type` enum (`mailing`, `physical`, `registered`,
  `payment_stub`). Partial unique index on `(org_id, address_type)
  WHERE is_primary = true`. Country is `char(2)` ISO 3166-1 alpha-2.
- **Tax registrations.** Scalar `tax_registration_number` column
  in 1.5A. The multi-jurisdiction
  `organization_tax_registrations` design is sketched in §15 (Open
  Questions) for a later phase — not built now.
- **MFA.** `organizations.mfa_required boolean NOT NULL DEFAULT
  false` in 1.5A. Middleware enforcement lands in 1.5B.
- **Report basis.** `organizations.default_report_basis enum
  (accrual, cash)` in 1.5A. No reporting behavior change this
  phase. The column is a **reporting-view default**, not a ledger
  mode — the architecture supports computing both cash and accrual
  views from the same ledger (see §10).
- **Onboarding state machine and `fiscal_years` first-class
  table.** Deferred to Phase 2 with the onboarding flow itself.

---

## 4. Database Schema

Phase 1.5A ships four new migrations, in strict order. The initial
schema file (`20240101000000_initial_schema.sql`) is not modified
in place — every change is an ALTER/CREATE in a new file,
preserving the Phase 1.1 migration history verbatim.

Naming: date-prefixed convention matching migrations 002 through
007. The next free slot is 108.

| # | File | Purpose |
|---|---|---|
| 108 | `20240108000000_seed_industries.sql` | New `industries` table, seed ~25+ entries, RLS `FOR SELECT TO authenticated USING (true)`, no writes. |
| 109 | `20240109000000_extend_organizations.sql` | New enums, new columns on `organizations`, self-FK `parent_org_id`, two-step `industry_id` backfill. |
| 110 | `20240110000000_organization_addresses.sql` | New `organization_addresses` table, `address_type` enum, partial unique index, RLS policies. |
| 111 | `20240111000000_journal_entries_source_tracking.sql` | Add `source_system` and `source_external_id` to `journal_entries`, backfill from existing `source` enum, partial unique index. |

### 4.1 Migration 108 — `industries` lookup table

```sql
-- =============================================================
-- 20240108000000_seed_industries.sql
-- Phase 1.5A: NAICS-light industries lookup table
-- =============================================================
-- Replaces the org_industry enum dependency on organizations with
-- a normalized lookup. The org_industry enum itself stays because
-- chart_of_accounts_templates.industry still uses it. The bridge
-- column default_coa_template_industry maps rows here back to
-- that enum so template loading at org creation continues to work.
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

-- naics_code is intentionally NULL on every seeded row in 1.5A.
-- Populating the 2-digit codes is a follow-up seed-update
-- migration tracked as a post-1.5A obligation (see §18).

-- Seed — 28 entries spanning NAICS 2-digit sectors + family-office
-- relevant subdivisions. Every row that maps to an existing
-- chart_of_accounts_templates.industry value MUST populate
-- default_coa_template_industry so org creation continues to find a
-- template. Currently holding_company and real_estate have seeded
-- templates; those two bridges are non-negotiable.

INSERT INTO industries
  (naics_code, slug, display_name, default_coa_template_industry, sort_order)
VALUES
  -- NAICS 11
  (NULL,  'agriculture',           'Agriculture, Forestry, Fishing',        NULL,              10),
  -- NAICS 21
  (NULL,  'mining_oil_gas',        'Mining, Oil & Gas Extraction',          NULL,              20),
  -- NAICS 22
  (NULL,  'utilities',             'Utilities',                             NULL,              30),
  -- NAICS 23
  (NULL,  'construction',          'Construction',                          NULL,              40),
  -- NAICS 31-33
  (NULL,  'manufacturing',         'Manufacturing',                         NULL,              50),
  -- NAICS 42
  (NULL,  'wholesale',             'Wholesale Trade',                       'trading',         60),
  -- NAICS 44-45
  (NULL,  'retail',                'Retail Trade',                          NULL,              70),
  -- NAICS 48-49
  (NULL,  'transportation',        'Transportation & Warehousing',          NULL,              80),
  -- NAICS 51
  (NULL,  'technology',            'Information Technology & Software',     NULL,              90),
  (NULL,  'media',                 'Media & Publishing',                    NULL,             100),
  -- NAICS 52 — Finance
  (NULL,  'financial_services',    'Financial Services',                    NULL,             110),
  (NULL,  'holding_company',       'Holding Company',                       'holding_company',120),
  (NULL,  'investment_fund',       'Investment Fund',                       NULL,             121),
  (NULL,  'family_office',         'Family Office',                         'holding_company',122),
  -- NAICS 53 — Real Estate
  (NULL,  'real_estate_operating', 'Real Estate Operating Company',         'real_estate',    130),
  (NULL,  'real_estate_reit',      'Real Estate Investment Trust (REIT)',   'real_estate',    131),
  (NULL,  'real_estate_development','Real Estate Development',              'real_estate',    132),
  (NULL,  'equipment_rental',      'Equipment Rental & Leasing',            NULL,             140),
  -- NAICS 54
  (NULL,  'professional_services', 'Professional & Technical Services',     NULL,             150),
  (NULL,  'legal_services',        'Legal Services',                        NULL,             151),
  (NULL,  'accounting_services',   'Accounting & Tax Services',             NULL,             152),
  -- NAICS 62
  (NULL,  'healthcare',            'Health Care',                           'healthcare',     160),
  -- NAICS 71
  (NULL,  'arts_entertainment',    'Arts, Entertainment & Recreation',      NULL,             170),
  -- NAICS 72 — Accommodation + Food Services
  (NULL,  'hospitality',           'Hospitality & Accommodation',           'hospitality',    180),
  (NULL,  'restaurant',            'Restaurant & Food Service',             'restaurant',     181),
  -- NAICS 81
  (NULL,  'nonprofit',             'Nonprofit Organization',                NULL,             190),
  -- NAICS 92
  (NULL,  'government',            'Government / Public Administration',    NULL,             200),
  -- Fallback
  (NULL,  'other',                 'Other / Not Otherwise Classified',      NULL,             999);

COMMIT;
```

**Seed verification gate (non-negotiable).** Before this migration
merges, cross-check every row in `chart_of_accounts_templates`
against the seed. Every distinct value of
`chart_of_accounts_templates.industry` MUST have a corresponding
`industries` row with `default_coa_template_industry` populated.
Currently `chart_of_accounts_templates` has seeded templates for
**`holding_company`** and **`real_estate`** only (confirmed via
`docs/02_specs/data_model.md` Phase 1.1 seeded industries note) —
those two bridges are load-bearing.

The four remaining `org_industry` enum values (`healthcare`,
`hospitality`, `trading`, `restaurant`) have **no CoA templates
seeded yet**, so the `industries` rows that bridge to them
(`healthcare`, `hospitality`, `wholesale → 'trading'`,
`restaurant`) carry `default_coa_template_industry` on the bridge
column even though no template exists to load. This is intentional
— when templates for those industries are seeded in a later
migration, the bridge already exists. See §9 for the migration
risk surface this creates and §15 OQ-05 for the enum-drop
obligation.

> **OPEN — needs founder decision:** The `family_office` row has
> `default_coa_template_industry = 'holding_company'` on the
> assumption that a family office entity uses the holding-company
> CoA until a dedicated family-office template is written. If you
> want family offices to default to a different template, flag it
> before the seed lands. Also listed in §15 as OQ-09.

### 4.2 Migration 109 — `organizations` extension

```sql
-- =============================================================
-- 20240109000000_extend_organizations.sql
-- Phase 1.5A: additive organizations profile columns
-- =============================================================
-- Adds every new organizations column in one migration. The
-- legacy organizations.industry column is NOT dropped here — that
-- happens in a follow-up migration after app code cuts over to
-- industry_id. See brief §8 for the two-step rationale.
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

ALTER TABLE organizations
  ADD COLUMN logo_storage_path           text,
  ADD COLUMN business_structure          business_structure,
  ADD COLUMN business_registration_number text,
  ADD COLUMN tax_registration_number     text,
  ADD COLUMN gst_registration_date       date,
  ADD COLUMN accounting_framework        accounting_framework NOT NULL DEFAULT 'aspe',
  ADD COLUMN description                 text,
  ADD COLUMN website                     text,
  ADD COLUMN email                       text,
  ADD COLUMN phone                       text,
  ADD COLUMN phone_country_code          text,
  ADD COLUMN time_zone                   text NOT NULL DEFAULT 'America/Vancouver',
  ADD COLUMN default_locale              text NOT NULL DEFAULT 'en',
  ADD COLUMN default_report_basis        report_basis NOT NULL DEFAULT 'accrual',
  ADD COLUMN default_payment_terms_days  integer NOT NULL DEFAULT 30,
  ADD COLUMN multi_currency_enabled      boolean NOT NULL DEFAULT false,
  ADD COLUMN status                      org_status NOT NULL DEFAULT 'active',
  ADD COLUMN mfa_required                boolean NOT NULL DEFAULT false,
  ADD COLUMN books_start_date            date,
  ADD COLUMN external_ids                jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN industry_id                 uuid REFERENCES industries(industry_id),
  ADD COLUMN parent_org_id               uuid REFERENCES organizations(org_id);

-- Named check constraints (see §4.2.1 below for rationale)
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
-- STEP 1: backfill industry_id from the existing industry enum
--         using the bridge column on industries.
-- -----------------------------------------------------------------

UPDATE organizations o
SET industry_id = i.industry_id
FROM industries i
WHERE i.default_coa_template_industry = o.industry
  AND o.industry_id IS NULL;

-- -----------------------------------------------------------------
-- STEP 2: enforce NOT NULL.
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
-- business_structure is NOT NULL going forward, but existing rows
-- need a default so the ALTER succeeds. Use 'other' as the
-- deliberately-unspecific backfill — orgs with a real structure
-- update via updateOrgProfile.
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
```

#### 4.2.1 Named CHECKs (rationale)

- **`org_default_payment_terms_nonneg`** — a negative payment-terms
  default is nonsense; reject at the DB layer. Local consistency;
  no INV attribution.
- **`org_parent_is_not_self`** — an org cannot be its own parent.
  Phase 1.5A ships the self-FK as a reserved seat; consolidation
  hierarchy walking is Phase 2. Still, the "not-self" invariant is
  cheap to enforce now and prevents a cycle-detection bug later.
- **`org_country_phone_code_shape`** — phone country codes are a
  narrow shape (`+1`, `+44`, `+852`). This CHECK catches typos
  like `1` or `+1234567` at the DB layer before they propagate
  into payment stubs.
- **`org_external_ids_is_object`** — `external_ids` is declared
  `jsonb` which also accepts arrays, strings, booleans, and nulls.
  This CHECK ensures the column is always a JSON object, which is
  the shape the Zod schema expects (see §11).

#### 4.2.2 Why `legal_name` and `functional_currency` are not touched

Both columns already exist from Phase 1.1's initial schema. Phase
1.5A **surfaces them in the new profile API** (§6) as
immutable-post-creation fields, but does not alter the schema:

- `legal_name` — already nullable; semantics in 1.5A are
  "operating/display name falls back to `name` when null; CRA
  filings use `legal_name` when populated."
- `functional_currency` — already `char(3) NOT NULL DEFAULT 'CAD'`.
  The API/UI renames this to **"base currency"** for user-facing
  clarity; the column name stays `functional_currency` to avoid
  migration churn. The rename lives in
  `src/shared/schemas/organization/profile.schema.ts` as a field
  alias, not in SQL.

### 4.3 Migration 110 — `organization_addresses` table

```sql
-- =============================================================
-- 20240110000000_organization_addresses.sql
-- Phase 1.5A: one-to-many addresses per org, typed by purpose
-- =============================================================

BEGIN;

CREATE TYPE address_type AS ENUM (
  'mailing',
  'physical',
  'registered',
  'payment_stub'
);

CREATE TABLE organization_addresses (
  address_id    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id        uuid NOT NULL REFERENCES organizations(org_id) ON DELETE CASCADE,
  address_type  address_type NOT NULL,
  line1         text NOT NULL,
  line2         text,
  city          text,
  region        text,
  postal_code   text,
  country       char(2) NOT NULL,
  attention     text,
  is_primary    boolean NOT NULL DEFAULT false,
  created_at    timestamptz NOT NULL DEFAULT now(),
  created_by    uuid REFERENCES auth.users(id),

  -- Country must be upper-case ISO 3166-1 alpha-2 (CA, US, GB...).
  CONSTRAINT addr_country_shape
    CHECK (country ~ '^[A-Z]{2}$'),
  CONSTRAINT addr_line1_not_blank
    CHECK (length(trim(line1)) > 0)
);

-- Partial unique index: at most one primary per (org_id, type).
CREATE UNIQUE INDEX idx_org_addr_primary
  ON organization_addresses (org_id, address_type)
  WHERE is_primary = true;

-- Supporting indexes for list queries.
CREATE INDEX idx_org_addr_org ON organization_addresses (org_id, address_type);

-- -----------------------------------------------------------------
-- RLS
-- -----------------------------------------------------------------

ALTER TABLE organization_addresses ENABLE ROW LEVEL SECURITY;

CREATE POLICY org_addr_select ON organization_addresses
  FOR SELECT USING (user_has_org_access(org_id));

CREATE POLICY org_addr_insert ON organization_addresses
  FOR INSERT WITH CHECK (user_has_org_access(org_id));

-- UPDATE and DELETE are controller-only, not just any org member.
CREATE POLICY org_addr_update ON organization_addresses
  FOR UPDATE USING (user_is_controller(org_id));

CREATE POLICY org_addr_delete ON organization_addresses
  FOR DELETE USING (user_is_controller(org_id));

COMMIT;
```

#### 4.3.1 Named CHECKs (rationale)

- **`addr_country_shape`** — rejects lower-case and non-alpha
  country codes at the DB layer, matching the Zod shape at the
  service boundary (INV-SERVICE-002 defense-in-depth).
- **`addr_line1_not_blank`** — an address with empty `line1` is
  unusable downstream (payment stubs, CRA filings, physical mail).
  Reject at the DB layer rather than silently accept a blank string.

### 4.4 Migration 111 — `journal_entries` source tracking

```sql
-- =============================================================
-- 20240111000000_journal_entries_source_tracking.sql
-- Phase 1.5A: granular integration-source tracking
-- =============================================================
-- Existing 'source' enum (manual, agent, import) stays as the
-- coarse classifier. New columns source_system and source_external_id
-- add the granularity needed for reconciliation when Phase 2
-- integrations (Flinks, Plaid, Stripe, Xero migration, CSV import)
-- start writing to the ledger.
-- =============================================================

BEGIN;

ALTER TABLE journal_entries
  ADD COLUMN source_system       text,
  ADD COLUMN source_external_id  text;

-- Backfill source_system from the existing enum.
UPDATE journal_entries
SET source_system = source::text
WHERE source_system IS NULL;

ALTER TABLE journal_entries
  ALTER COLUMN source_system SET NOT NULL,
  ADD CONSTRAINT source_system_not_blank
    CHECK (length(trim(source_system)) > 0);

-- Partial unique index: a given (org, source_system, external_id)
-- triple may only appear once. NULL external_id skips the index
-- (multiple manual entries with NULL external_id are fine).
CREATE UNIQUE INDEX idx_je_source_external
  ON journal_entries (org_id, source_system, source_external_id)
  WHERE source_external_id IS NOT NULL;

COMMIT;
```

See §13 for the full source-tracking rationale.

---

## 5. Service Signatures

All service functions live under `src/services/org/` and are wrapped
by `withInvariants()` per INV-SERVICE-001. Every mutating function
performs a Zod-validated input parse and is audit-logged with a full
`before_state` snapshot where applicable.

### 5.1 `orgService`

```ts
// src/services/org/orgService.ts

import { withInvariants } from '@/services/middleware/withInvariants';
import { orgProfileSchema, industryListSchema } from '@/shared/schemas/organization/profile.schema';

// Existing function — signature extended, not replaced.
export const createOrgWithTemplate = withInvariants(
  'org.create',
  async (ctx, input: CreateOrgInput) => { /* ... */ }
);

// NEW in 1.5A.
export const updateOrgProfile = withInvariants(
  'org.profile_updated',
  async (ctx, input: UpdateOrgProfileInput) => { /* ... */ }
);

// NEW in 1.5A. Authenticated users only (no org scoping).
export const listIndustries = withInvariants(
  'org.list_industries',
  async (ctx) => { /* ... */ }
);
```

#### 5.1.1 `createOrgWithTemplate` — extended input

Required at creation (additive to Phase 1.1's required fields):

- `name` — existing
- `industry_id` — NEW, replaces the Phase 1.1 `industry` enum input
- `business_structure` — NEW
- `functional_currency` — existing, surfaced in API as `base_currency`
- `fiscal_year_start_month` — existing
- `time_zone` — NEW (default `America/Vancouver`)
- `default_locale` — NEW (default `en`)
- `default_report_basis` — NEW (default `accrual`)
- `accounting_framework` — NEW (default `aspe`)

Optional at creation (may be populated later via `updateOrgProfile`):

- `legal_name`, `logo_storage_path`, `business_registration_number`,
  `tax_registration_number`, `gst_registration_date`, `description`,
  `website`, `email`, `phone`, `phone_country_code`,
  `default_payment_terms_days`, `multi_currency_enabled`, `status`,
  `mfa_required`, `books_start_date`, `external_ids`,
  `parent_org_id`.

During CoA template loading, the service resolves the `industry_id`
to the bridge enum via `SELECT default_coa_template_industry FROM
industries WHERE industry_id = $1`. If the bridge is NULL (the
industry has no seeded CoA template), the service rejects with
`ServiceError('NO_COA_TEMPLATE_FOR_INDUSTRY')`. This is the
mechanical consequence of the seed-verification rule in §4.1.

#### 5.1.2 `updateOrgProfile` — controller-only

```ts
type UpdateOrgProfileInput = {
  org_id: string;                 // UUID, Zod-validated
  patch: OrgProfilePatch;         // partial, at-least-one-field
};

type OrgProfilePatch = Partial<{
  // Mutable post-creation.
  name: string;
  legal_name: string | null;
  industry_id: string;
  business_structure: BusinessStructure;
  business_registration_number: string | null;
  tax_registration_number: string | null;
  gst_registration_date: string | null;   // YYYY-MM-DD
  accounting_framework: AccountingFramework;
  description: string | null;
  website: string | null;
  email: string | null;
  phone: string | null;
  phone_country_code: string | null;
  time_zone: string;
  default_locale: string;
  default_report_basis: ReportBasis;
  default_payment_terms_days: number;
  multi_currency_enabled: boolean;
  status: OrgStatus;
  mfa_required: boolean;
  books_start_date: string | null;
  external_ids: OrgExternalIds;           // see §11
  parent_org_id: string | null;
  logo_storage_path: string | null;
}>;
```

**Immutable post-creation** (reject in Zod, not just in SQL):
`functional_currency`, `fiscal_year_start_month`. A mutation that
includes these fields fails with
`ServiceError('ORG_IMMUTABLE_FIELD')`. If an org needs to change
base currency or fiscal calendar, that is a Phase 2+ data
migration, not a profile update.

**Authorization.** `withInvariants('org.profile_updated', ...)`
calls `canUserPerformAction('org.profile_updated', ctx, {org_id})`,
which checks `user_is_controller(org_id)`. The middleware blocks
non-controllers before the function body runs.

**Audit.** The full pre-mutation `organizations` row is written
to `audit_log.before_state` as `jsonb`. Consumers reconstruct
field-level diffs by comparing `before_state` to the current row
(see §12). The action key stays coarse (`org.profile_updated`);
the diff is reconstructable.

**Rejection branches:**

- `ORG_NOT_FOUND` — `org_id` does not exist.
- `ORG_IMMUTABLE_FIELD` — patch includes `functional_currency` or
  `fiscal_year_start_month`.
- `INDUSTRY_NOT_FOUND` — `industry_id` does not exist in
  `industries`.
- `PARENT_ORG_NOT_FOUND` — `parent_org_id` does not exist.
- `PARENT_ORG_IS_SELF` — `parent_org_id = org_id` (also caught by
  the DB CHECK, but the service rejects earlier with a cleaner
  error).
- `EXTERNAL_IDS_MALFORMED` — `external_ids` fails the Zod schema
  (known key with wrong type).

#### 5.1.3 `listIndustries` — authenticated-user callable

```ts
type ListIndustriesOutput = {
  industries: Industry[];
};

type Industry = {
  industry_id: string;
  naics_code: string | null;
  slug: string;
  display_name: string;
  parent_industry_id: string | null;
  is_active: boolean;
  sort_order: number;
};
```

The service filters `is_active = true`, sorts by `(sort_order,
display_name)`, and returns the whole list — Phase 1.5A has 28
entries, no pagination needed. The `default_coa_template_industry`
bridge is **not** exposed to clients; it is a backfill/loading
detail, not user-facing data.

Authorization: `withInvariants('org.list_industries', ...)` calls
`canUserPerformAction` which for this action returns `true` for any
authenticated user (no org scoping — the user needs to see the
industry list before they have picked an org). This is a new
non-org-scoped action key; its authorization rule lives in
`src/services/auth/canUserPerformAction.ts` as an explicit case.

### 5.2 `addressService`

```ts
// src/services/org/addressService.ts

export const addAddress = withInvariants(
  'org.address_added',
  async (ctx, input: AddAddressInput) => { /* ... */ }
);

export const updateAddress = withInvariants(
  'org.address_updated',
  async (ctx, input: UpdateAddressInput) => { /* ... */ }
);

export const removeAddress = withInvariants(
  'org.address_removed',
  async (ctx, input: RemoveAddressInput) => { /* ... */ }
);

export const setPrimaryAddress = withInvariants(
  'org.address_primary_changed',
  async (ctx, input: SetPrimaryAddressInput) => { /* ... */ }
);
```

All four are **controller-only** at the `canUserPerformAction`
layer (matching the RLS policy on UPDATE/DELETE). `addAddress` is
also controller-only despite the RLS INSERT policy accepting any
org member — the service layer is stricter. This is
defense-in-depth: an accidental UPDATE of the RLS INSERT policy to
`user_has_org_access` would not weaken the service authorization.

#### 5.2.1 `addAddress`

```ts
type AddAddressInput = {
  org_id: string;
  address_type: AddressType;
  line1: string;
  line2?: string | null;
  city?: string | null;
  region?: string | null;
  postal_code?: string | null;
  country: string;                // char(2), uppercased by Zod
  attention?: string | null;
  is_primary?: boolean;           // default false
};
```

**Region validation** is delegated to the Zod schema
`src/shared/schemas/organization/address.schema.ts` (see §14).

**Primary enforcement.** If `is_primary = true` and a primary
already exists for `(org_id, address_type)`, the partial unique
index would raise `unique_violation` at INSERT time. The service
wraps the insert in a transaction that first clears any existing
primary for the type (`UPDATE ... SET is_primary = false WHERE
org_id = $1 AND address_type = $2 AND is_primary = true`) before
inserting. This "auto-demote" behavior makes `addAddress(..., {
is_primary: true })` idempotent with respect to the partial unique
index without requiring the caller to call `setPrimaryAddress`
separately.

#### 5.2.2 `updateAddress`

```ts
type UpdateAddressInput = {
  org_id: string;
  address_id: string;
  patch: Partial<Omit<AddAddressInput, 'org_id' | 'address_type'>>;
};
```

`address_type` is immutable once set — changing the type of an
existing address row is a delete + add, not an update. The
service rejects a patch that includes `address_type` with
`ServiceError('ADDRESS_TYPE_IMMUTABLE')`.

If the patch sets `is_primary = true`, the same auto-demote
transaction from §5.2.1 runs.

Audit: full pre-mutation row in `before_state`.

#### 5.2.3 `removeAddress`

```ts
type RemoveAddressInput = {
  org_id: string;
  address_id: string;
};
```

Hard delete — no archival column. Removing the primary address of
a type leaves the org with no primary of that type, which is
acceptable (the partial unique index permits zero primaries per
type). Audit: full pre-delete row in `before_state`.

#### 5.2.4 `setPrimaryAddress`

```ts
type SetPrimaryAddressInput = {
  org_id: string;
  address_id: string;
};
```

Transactional: demote any current primary for the same `(org_id,
address_type)`, then promote the target. Audit: the `before_state`
captures the row being promoted; the demotion of the previous
primary is captured as a separate audit row with action key
`org.address_primary_changed`.

> **OPEN — needs founder decision:** should the demotion of the
> previous primary fire a second audit row, or be collapsed into
> the promotion's single audit row? Current brief assumes
> two rows (one per address, each with its own `before_state`)
> because that keeps the "one row per entity mutation" audit
> invariant. Also listed in §15 as OQ-06.

---

## 6. API Routes

New routes, all under `src/app/api/`. Every route is a thin adapter
that validates input with Zod, threads `trace_id` and `caller` into
`ServiceContext`, calls the service, and surfaces typed errors.

| Method | Path | Service | Auth |
|---|---|---|---|
| GET | `/api/industries` | `orgService.listIndustries` | authenticated |
| GET | `/api/orgs/[orgId]/profile` | `orgService.getOrgProfile` (NEW read function, `FOR SELECT` semantics) | any org member |
| PATCH | `/api/orgs/[orgId]/profile` | `orgService.updateOrgProfile` | controller |
| GET | `/api/orgs/[orgId]/addresses` | `addressService.listAddresses` (NEW read function) | any org member |
| POST | `/api/orgs/[orgId]/addresses` | `addressService.addAddress` | controller |
| PATCH | `/api/orgs/[orgId]/addresses/[addressId]` | `addressService.updateAddress` | controller |
| DELETE | `/api/orgs/[orgId]/addresses/[addressId]` | `addressService.removeAddress` | controller |
| POST | `/api/orgs/[orgId]/addresses/[addressId]/set-primary` | `addressService.setPrimaryAddress` | controller |

`getOrgProfile` and `listAddresses` are read-only. Per INV-SERVICE-001
they still go through the service layer (route handlers do not talk
to the DB directly), but they are not wrapped by `withInvariants()`
because the middleware is scoped to mutating functions. The read
path uses `userClient` (RLS-respecting) rather than `adminClient`
— a cross-org read attempt is blocked by RLS, not by service-layer
authorization.

> **OPEN — needs founder decision:** should read-only service
> functions also be wrapped by `withInvariants()` for
> uniform trace_id/audit plumbing, even though authorization is
> delegated to RLS? Current brief assumes **no** (matching existing
> Phase 1.1 read paths like `listChartOfAccounts`). Also listed in
> §15 as OQ-07.

---

## 7. RLS Policies (verbatim)

### `industries`

```sql
ALTER TABLE industries ENABLE ROW LEVEL SECURITY;
CREATE POLICY industries_select ON industries
  FOR SELECT TO authenticated USING (true);
```

**Deviation from standard pattern.** No org scoping — any
authenticated user reads any industry row. Same exception posture
as `chart_of_accounts_templates` (and for the same reason: a user
needs to see the industry list before they have chosen an org to
scope to). No INSERT/UPDATE/DELETE policy — seed-only, modifying
requires a migration.

### `organization_addresses`

```sql
ALTER TABLE organization_addresses ENABLE ROW LEVEL SECURITY;

CREATE POLICY org_addr_select ON organization_addresses
  FOR SELECT USING (user_has_org_access(org_id));

CREATE POLICY org_addr_insert ON organization_addresses
  FOR INSERT WITH CHECK (user_has_org_access(org_id));

CREATE POLICY org_addr_update ON organization_addresses
  FOR UPDATE USING (user_is_controller(org_id));

CREATE POLICY org_addr_delete ON organization_addresses
  FOR DELETE USING (user_is_controller(org_id));
```

**Deviation from standard pattern.** SELECT/INSERT use
`user_has_org_access` (any member can see addresses and — at the
RLS layer — insert them), but UPDATE/DELETE are scoped to
`user_is_controller`. The service layer tightens INSERT to
controller-only as defense-in-depth (see §5.2).

### `organizations` (policy additions — not replacements)

Phase 1.1's `organizations_select` policy continues to apply. No
new policies are added on `organizations` itself. The new columns
are visible through the existing SELECT policy because RLS is
row-scoped, not column-scoped. There is intentionally still no
INSERT/UPDATE policy on `organizations` — mutations go through
service functions via `adminClient`.

### `journal_entries` (no change)

Phase 1.1's append-only `USING (false)` policies on UPDATE/DELETE
continue to apply. The new `source_system` and `source_external_id`
columns are visible through the existing SELECT policy.

---

## 8. Two-Step `industry_id` Migration — Rollback Safety

The migration plan is deliberately two-step:

**Step one (this phase, migration 109):**
1. Add `industry_id uuid` nullable with FK to `industries`.
2. Backfill from `organizations.industry` via
   `industries.default_coa_template_industry` bridge.
3. `ALTER COLUMN industry_id SET NOT NULL`.
4. Leave `organizations.industry` in place.

**Step two (a later migration, NOT this phase):**
1. Drop `organizations.industry` after app code is fully cut over
   to `industry_id` and has been verified in production for at
   least one full deployment cycle.

### 8.1 Why two steps

**Rollback safety.** A single migration that drops
`organizations.industry` in the same transaction as the FK add is
not safe:

- If the application is mid-deploy when the migration lands, some
  running instances still read `organizations.industry` and break
  as soon as the column is gone.
- If the migration must be rolled back for an unrelated reason,
  restoring the dropped enum column from a point-in-time backup is
  lossy (any writes since the migration are lost on restore of the
  old column).

The two-step approach keeps `organizations.industry` as a passive
witness for a full deployment cycle, during which every code path
migrates to `industry_id`. Once the old column is observably unused
(verified via query log analysis and staged grep over the
codebase), the drop-column migration is safe.

### 8.2 Step-one rollback

Migration 109 runs inside a single `BEGIN...COMMIT`. If step 2
(SET NOT NULL) fails because the backfill missed a row, the
migration rolls back cleanly — `organizations` is unchanged, the
new columns are dropped, the enum definitions are removed. No
manual cleanup required.

### 8.3 Step-two prerequisites (for the later migration)

Before the drop-column migration can land:

- Zero references to `organizations.industry` remain in `src/`.
  `grep -rn "\.industry" src/ | grep -v industry_id` returns no
  results.
- The `types.ts` regeneration task from Phase 1.2 obligations has
  run at least once after the cutover, and the generated
  `Organizations` type no longer has the `industry` field.
- One full preview → production deployment cycle has elapsed with
  no calls to the old column (verified via Postgres `pg_stat`
  sampling or query log).

This obligation is captured in §15 as OQ-05 and will be promoted
to a Phase-1.6 or Phase-2 task when those preconditions hold.

---

## 9. NAICS-Light Seed Verification

The seed in §4.1 must pass a cross-check against existing
`chart_of_accounts_templates` rows before the migration is allowed
to merge. The check is part of the brief's exit criteria (§16)
and runs during migration review.

### 9.1 Enum → industries bridge map

| `org_industry` enum value | Has seeded CoA template? | Bridged by `industries.slug` |
|---|---|---|
| `holding_company` | **Yes** (seeded in Phase 1.1) | `holding_company`, `family_office` |
| `real_estate` | **Yes** (seeded in Phase 1.1) | `real_estate_operating`, `real_estate_reit`, `real_estate_development` |
| `healthcare` | No | `healthcare` |
| `hospitality` | No | `hospitality` |
| `trading` | No | `wholesale` |
| `restaurant` | No | `restaurant` |

### 9.2 Migration risk surface

Every `organizations.industry` enum value in production at
migration time must map via the bridge to at least one seeded
`industries` row. The backfill UPDATE in §4.2 depends on this. If
an org's `industry` value is, say, `restaurant`, the bridge UPDATE
must find an `industries` row with `default_coa_template_industry
= 'restaurant'` — which is the `restaurant` row in the seed.

**Risk:** adding a new `org_industry` enum value in a future
migration without simultaneously adding a bridged `industries` row
breaks the backfill pattern. Any future `ALTER TYPE org_industry
ADD VALUE` must be paired with a corresponding
`INSERT INTO industries (... default_coa_template_industry)`.

This is recorded as §15 OQ-05's enforcement mechanism: once the
old enum column is dropped, this whole coupling goes away. Until
then, add-enum-value migrations must pair.

### 9.3 Verification check (pre-merge)

```sql
-- Every enum value present on any organization must resolve via
-- the bridge. If this returns any rows, the migration is not safe
-- to apply.
SELECT DISTINCT o.industry
FROM organizations o
LEFT JOIN industries i
  ON i.default_coa_template_industry = o.industry
WHERE i.industry_id IS NULL;
```

Expected output: empty set.

---

## 10. Dual Cash/Accrual Reporting Philosophy

Phase 1.5A adds `organizations.default_report_basis enum (accrual,
cash)`. This column is a **view default**, not a ledger mode.

### 10.1 The architectural distinction

Two philosophies exist in peer accounting software:

- **QBO-style.** The org picks cash or accrual at setup; the
  ledger records entries in that mode; switching later is a
  migration event. Reports are generated in the ledger's one
  native mode.
- **Puzzle-style (dual-view).** The ledger records every accrual
  transaction with its full event timeline (invoice date,
  payment date, etc.); reports compute either accrual or cash
  views from the same ledger by filtering on which date column to
  aggregate on.

The Bridge uses the **dual-view** philosophy. The ledger is
always accrual-native — a journal entry's `entry_date` records
when the economic event occurred, not when cash moved. Cash-basis
reporting (when it lands in Phase 2+) will re-aggregate the same
ledger by payment-date columns on `bills`, `invoices`, and
`bank_transactions`, rather than by `journal_lines.entry_date`.

### 10.2 What `default_report_basis` means

The column expresses **which of the two views the UI defaults to
when a user opens a P&L or Balance Sheet**, not which mode the
ledger operates in. A user can toggle between cash and accrual
views on any report — the column just sets the initial tab.

### 10.3 Phase 1.5A behavior

**Zero behavior change.** The column is added, seeded with
`accrual` by default, and read by no code path in 1.5A. Phase 2
reporting work wires the column into the report-view selector.

### 10.4 Why this matters

A column named `report_basis` on `organizations` carries
implications in peer software (QBO: "this org is a cash-basis
company"). The brief commits to the dual-view semantics explicitly
so future readers and future phases do not accidentally re-wire
the ledger to the single-mode interpretation.

---

## 11. `external_ids` Typed-Key Zod Schema

### 11.1 The schema

```ts
// src/shared/schemas/organization/externalIds.schema.ts

import { z } from 'zod';

export const orgExternalIdsSchema = z
  .record(z.string(), z.unknown())
  .refine(
    (obj) => {
      // Known keys must match their declared type when present.
      if ('stripe_customer_id' in obj && typeof obj.stripe_customer_id !== 'string') return false;
      if ('xero_tenant_id' in obj && typeof obj.xero_tenant_id !== 'string') return false;
      if ('flinks_login_id' in obj && typeof obj.flinks_login_id !== 'string') return false;
      if ('cra_business_id' in obj && typeof obj.cra_business_id !== 'string') return false;
      if ('zoho_organization_id' in obj && typeof obj.zoho_organization_id !== 'string') return false;
      return true;
    },
    { message: 'external_ids known key has wrong type' }
  );

export type OrgExternalIds = z.infer<typeof orgExternalIdsSchema>;
```

### 11.2 Examples

Accepted:

```json
{}
{ "stripe_customer_id": "cus_abc123" }
{ "stripe_customer_id": "cus_abc123", "my_custom_tool": "foo" }
{ "future_integration_id": { "nested": "ok" } }
```

Rejected:

```json
{ "stripe_customer_id": 123 }            // known key, wrong type
{ "xero_tenant_id": ["a", "b"] }         // known key, wrong type
```

### 11.3 Rules

- **Known keys** — the five listed above — must match their
  declared type (`string`) when present.
- **Unknown keys** pass through without validation. This is
  intentional: an integration can write an unfamiliar key without
  needing a migration first; only when the key graduates to
  "known" (becomes contract-worthy) does it gain a type entry.
- **Adding a new known key is a schema change, not a data write.**
  A developer must update `externalIds.schema.ts` and add the key
  to the refine block; writing to an unknown key and "hoping for
  the best" loses type safety on reads.
- **DB-level defense:** the `org_external_ids_is_object` CHECK
  ensures the column is always a JSON object, so the Zod shape
  assumption (object with optional keys) holds even for direct SQL
  writes.

---

## 12. Audit `before_state` Field-Level Diff Convention

### 12.1 The convention

For coarse action keys that represent "one or more fields
changed" (`org.profile_updated`, `org.address_updated`), the
service writes the **full pre-mutation entity row** to
`audit_log.before_state` as `jsonb`. Consumers reconstruct
field-level diffs by comparing `before_state` against either the
current entity state or a subsequent audit row's `before_state`.

**Inserts carry null `before_state` by convention.** For action
keys that represent creation (`org.address_added`), `before_state`
is `NULL` — the row did not exist before. This is the
distinguishing signal between "created" and "mutated" audit rows
when reading the log. The service layer passes `before_state:
undefined` explicitly on insert audit calls so the absence is
deliberate rather than accidental; the DB column writes as `NULL`.

### 12.2 Why coarse action keys

An alternative design writes one audit row per changed field
(`org.profile.email_changed`, `org.profile.website_changed`,
etc.). This produces a cleaner event stream for analytics but
has two costs:

1. **Combinatorial action key explosion.** Every column on
   `organizations` becomes a distinct action key. New columns
   require new action keys — CLAUDE.md rule #4 gets harder to
   audit.
2. **Multi-row transactions for multi-field edits.** A user
   editing five profile fields in one UI save generates five
   audit rows in one transaction. Grouping them requires joining
   on `trace_id` and a timestamp window.

The coarse-key-plus-`before_state` approach keeps one action key
per mutation surface, one audit row per transaction, and
reconstructs field granularity on demand at read time. Trade-off
accepted.

### 12.3 Reconstruction query

```sql
-- Field-level diff for a given audit row:
WITH audit AS (
  SELECT before_state FROM audit_log WHERE audit_log_id = $1
),
current AS (
  SELECT to_jsonb(o.*) AS state FROM organizations o WHERE o.org_id = $2
)
SELECT
  key,
  (SELECT before_state FROM audit) -> key AS before,
  (SELECT state FROM current)       -> key AS after
FROM jsonb_object_keys((SELECT before_state FROM audit)) AS key
WHERE (SELECT before_state FROM audit) -> key
   IS DISTINCT FROM
      (SELECT state FROM current) -> key;
```

This query is not exposed as an API in 1.5A — it is a reference
pattern for whoever builds the audit-review UI in a later phase.

---

## 13. `parent_org_id` Reserved-Seat Rationale

### 13.1 The column

`organizations.parent_org_id uuid REFERENCES organizations(org_id)`,
nullable, with a CHECK constraint `org_parent_is_not_self`.

### 13.2 Why now

Three Phase 2+ features depend on a consolidation hierarchy:

- **Consolidated dashboards** across a holding company and its
  operating subsidiaries (the existing `consolidated/dashboard`
  stub route from Phase 1.1 hints at this).
- **Intercompany rollup** — the Phase 2 AP Agent learns
  intercompany relationships between orgs; a parent hierarchy
  makes "aggregate all children of org X" a single recursive
  query.
- **Multi-entity onboarding** — a single signup flow that
  instantiates a family office structure (holding + 3 subsidiaries)
  needs a parent pointer at each child's creation time.

Adding the column as a reserved seat in 1.5A means Phase 2 code
does not need to back-populate existing org rows via migration —
each org already has a parent pointer (NULL for top-level orgs)
from day one of Phase 2.

### 13.3 Zero behavior in 1.5A

No service function reads `parent_org_id`. No RLS policy uses it.
No report aggregates across it. The column is purely a schema
reservation, enforced with a single self-reference CHECK and a
partial index for future lookups.

**Known limitation (Phase 2 obligation).** The
`org_parent_is_not_self` CHECK only catches direct
self-reference (`parent_org_id = org_id`). A multi-org cycle
(A → B → A, A → B → C → A) is NOT prevented by the schema. This
is acceptable in 1.5A because nothing writes to `parent_org_id`.
Before Phase 2 consolidation features write to the column, cycle
detection must land — either a recursive trigger (walk the parent
chain on INSERT/UPDATE, reject on cycle) or app-layer validation
in the service that will own parent-setting. Tracked in
`docs/09_briefs/phase-1.2/obligations.md`.

### 13.4 What Phase 2 will need

See §15 OQ-03 for the consolidation hierarchy open questions Phase
2 needs to resolve (cross-org RLS behavior, cycle prevention
beyond the self-check, parent-change audit semantics).

---

## 14. Region Validation Convention by Country

### 14.1 The rule

`organization_addresses.region` is stored as free `text` at the
DB layer. Validation happens at the service boundary in Zod,
keyed by the address's `country`:

- **`country = 'CA'`** — `region` must be one of the 13
  province/territory ISO 3166-2 two-letter codes:
  `BC, AB, SK, MB, ON, QC, NB, NS, PE, NL, YT, NT, NU`.
- **`country = 'US'`** — `region` must be a US state ISO 3166-2
  two-letter code (50 states + DC). Full list not reproduced here;
  use the standard set.
- **All other countries** — `region` is accepted as free text.
  Phase 1.5A does not try to validate regions for 200+ countries.

### 14.2 The schema

```ts
// src/shared/schemas/organization/address.schema.ts

const CA_PROVINCES = ['BC','AB','SK','MB','ON','QC','NB','NS','PE','NL','YT','NT','NU'] as const;
const US_STATES = [/* 50 + DC */] as const;

export const addressSchema = z
  .object({
    address_type: z.enum(['mailing','physical','registered','payment_stub']),
    line1: z.string().min(1),
    line2: z.string().optional().nullable(),
    city: z.string().optional().nullable(),
    region: z.string().optional().nullable(),
    postal_code: z.string().optional().nullable(),
    country: z.string().length(2).regex(/^[A-Z]{2}$/),
    attention: z.string().optional().nullable(),
    is_primary: z.boolean().optional(),
  })
  .superRefine((val, ctx) => {
    if (val.country === 'CA' && val.region != null) {
      if (!CA_PROVINCES.includes(val.region as (typeof CA_PROVINCES)[number])) {
        ctx.addIssue({
          code: 'custom',
          message: `region must be a Canadian province/territory code (one of ${CA_PROVINCES.join(', ')}); got "${val.region}"`,
          path: ['region'],
        });
      }
    } else if (val.country === 'US' && val.region != null) {
      // ... same pattern for US_STATES
    }
  });
```

### 14.3 Why app-validated, not DB-constrained

A DB CHECK that encodes "if country = CA then region in (...)"
requires either a lookup table or an ugly inline list. Validation
changes (new country, new state) then require migrations rather
than Zod schema edits. Since address input always crosses a
service boundary (Zod validates every input per CLAUDE.md rule
#5), the practical enforcement is at the service layer. The DB
keeps the light-touch CHECK on country shape (`addr_country_shape`)
and nothing else.

> **OPEN — needs founder decision:** should the region set be
> extended to include Canadian territories' full names (e.g.,
> "Yukon", "Nunavut") as accepted aliases, or is the two-letter
> code the only accepted form? Current brief assumes two-letter
> code only (rejecting "British Columbia" as the Category A test
> requires). Also listed in §15 as OQ-08.

---

## 15. Open Questions (consolidated)

These are items either flagged inline in this brief or flagged
during drafting as needing founder decisions before implementation.
Each has a suggested default so work is unblocked if no founder
input arrives before the brief is executed against.

### OQ-01 — Multi-jurisdiction tax registrations

**Description.** An org operating in multiple Canadian provinces
(GST federal + QST Quebec + PST BC) needs multiple tax
registration numbers, not one. Phase 1.5A keeps a scalar
`tax_registration_number text` for simplicity.

**Proposed deferred design** (`organization_tax_registrations`
table, Phase 2):

```sql
CREATE TABLE organization_tax_registrations (
  registration_id      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id               uuid NOT NULL REFERENCES organizations(org_id) ON DELETE CASCADE,
  jurisdiction         text NOT NULL,        -- e.g. 'CA', 'CA-BC', 'CA-QC'
  tax_type             text NOT NULL,        -- e.g. 'GST', 'QST', 'PST'
  registration_number  text NOT NULL,
  effective_from       date NOT NULL,
  effective_to         date,
  CHECK (effective_to IS NULL OR effective_to >= effective_from)
);
```

**Current-best-guess answer.** Defer to Phase 2 alongside actual
tax calculation logic. The scalar column works for single-
jurisdiction orgs (which is every seeded org in Phase 1.1).

**Deferral target.** Phase 2.

### OQ-02 — Analytical dimensions on journal lines

**Description.** Pennylane's "dimensions" / QBO's "classes" pattern
— tagging each journal line with an analytical bucket (cost
center, project, property, etc.) for reporting. No decision yet
on: columns on `journal_lines` vs separate `journal_line_dimensions`
junction table.

**Current-best-guess answer.** Separate junction table
(`journal_line_dimensions`) — matches the pattern used elsewhere
in the schema (`vendor_rules`, `intercompany_relationships`) and
permits multi-dimensional tagging per line. Column-based would
require a migration per new dimension type.

**Deferral target.** Phase 2 (during or after reporting work).

### OQ-03 — Draft state on journal entries

**Description.** Puzzle's continuous-close model — does
`journal_entries.status` need a `draft` value, or does draft state
live entirely in `ai_actions.status = 'pending'`?

**Current-best-guess answer.** Draft lives in `ai_actions` —
`journal_entries` remains "posted = real" as Phase 1.1 designed.
This preserves the append-only rule on `journal_entries` and keeps
the ledger's read surface uncluttered by unposted drafts.

**Deferral target.** Phase 1.2 design review.

### OQ-04 — Onboarding state machine

**Description.** A new `onboarding_status` enum on `organizations`
would track a multi-step onboarding flow (welcome → profile →
addresses → CoA confirmation → first entry). Not in 1.5A.

**Current-best-guess answer.** Defer to Phase 2 when the
onboarding flow itself is designed. Premature now.

**Deferral target.** Phase 2.

### OQ-05 — `organizations.industry` enum column drop

**Description.** The legacy `industry` enum column on
`organizations` remains after 1.5A. It must be dropped in a
follow-up migration after app code is fully cut over to
`industry_id`.

**Current-best-guess answer.** Schedule the drop-column migration
for whichever phase lands after (a) every service function uses
`industry_id`, (b) `types.ts` no longer surfaces the `industry`
field, and (c) one full deployment cycle elapses with no old-column
reads.

**Deferral target.** Phase 1.6 or Phase 2, whichever lands first
after conditions are met.

### OQ-06 — Primary-address demotion audit granularity — RESOLVED (2026-04-15)

**Description.** When `setPrimaryAddress` promotes a new primary,
the previous primary is auto-demoted. Current brief emits two
audit rows (one per affected address). Alternative: one audit row
with both addresses in `before_state`.

**Resolution (2026-04-15).** Two audit rows, one per affected
address. Matches the "one row per entity mutation" invariant and
keeps downstream audit queries clean.

**Original rationale.** Two rows, matching the "one row per
entity mutation" invariant. Cleaner for downstream audit queries.

### OQ-07 — Read service functions and `withInvariants()` — RESOLVED (2026-04-15)

**Description.** Should read-only service functions (e.g.,
`getOrgProfile`, `listAddresses`) be wrapped by `withInvariants()`
for uniform trace_id plumbing?

**Resolution (2026-04-15).** No. Read-only functions are not
`withInvariants()`-wrapped. Matches existing Phase 1.1 pattern
(`listChartOfAccounts`); reads rely on RLS for authorization.
Revisit in Phase 1.2 if agent tool patterns suggest otherwise.

**Original rationale.** No — matches Phase 1.1 pattern
(`listChartOfAccounts` is not wrapped). Reads rely on RLS for
authorization; the service middleware is for mutations.

### OQ-08 — Region name aliases — RESOLVED (2026-04-15)

**Description.** Should `region` validation accept both two-letter
codes (`BC`) and full names (`British Columbia`)?

**Resolution (2026-04-15).** Two-letter codes only. Test CB-02
asserts rejection of `"British Columbia"`. UI handles
display-time prettification.

**Original rationale.** Two-letter codes only. Phase 1.5A
Category A test #7 asserts rejection of `"British Columbia"`. UI
can do display-time prettification.

### OQ-09 — Family office CoA template default — RESOLVED (2026-04-15)

**Description.** The `family_office` industries seed row has
`default_coa_template_industry = 'holding_company'` as a
provisional bridge. Should family offices use the holding-company
CoA, or wait for a dedicated template?

**Resolution (2026-04-15).** Bridge `family_office` to
`holding_company` CoA provisionally. Orthogonal follow-up: author
a dedicated family-office CoA template, then update the bridge.

**Original rationale.** Use the holding-company template for now.
Revisit when a dedicated family-office CoA is authored (no fixed
phase target — orthogonal work).

### OQ-10 — Accountant-firm-as-org pattern (1.5B input)

**Description.** Pennylane's "accountant firm as org with
cross-tenant access to client orgs" pattern. The 1.5B users-table
design must anticipate (a) firm orgs vs client orgs, (b)
time-bounded cross-org access, (c) entity-attached comments.
Flagged here so 1.5B does not accidentally box it out.

**Current-best-guess answer.** Treat this as a 1.5B design input,
not a 1.5A schema addition. Document in 1.5B brief when written.

**Deferral target.** 1.5B.

### OQ-11 — Billing contact vs primary contact

**Description.** Orgs need both a billing contact and a primary
contact, often different people. `organizations.email` covers one
of them; the other needs a users-table representation.

**Current-best-guess answer.** Defer to 1.5B users design. 1.5A's
`organizations.email` stands in for "primary org inbox" and
nothing else.

**Deferral target.** 1.5B.

---

## 16. Exit Criteria Matrix

Phase 1.5A is complete when every row below is MET. The matrix
follows the Phase 1.1 closeout convention (`exit_criteria_matrix.md`).

### 16.1 Schema

| # | Criterion | Verification |
|---|---|---|
| S1 | Migration 108 applied; `industries` table exists with ≥25 rows. | `SELECT COUNT(*) FROM industries >= 25` |
| S2 | Every `industries` row that bridges to a currently-seeded `chart_of_accounts_templates.industry` value has `default_coa_template_industry` populated. | §9.3 verification query returns empty set |
| S3 | Migration 109 applied; all new `organizations` columns exist with the types/defaults in §4.2. | `\d organizations` in psql |
| S4 | `organizations.industry_id` is NOT NULL for every existing org row (backfill succeeded). | `SELECT COUNT(*) FROM organizations WHERE industry_id IS NULL = 0` |
| S5 | `organizations.industry` (legacy enum column) still exists. | `\d organizations` shows the column |
| S6 | Four new enums exist: `business_structure`, `accounting_framework`, `report_basis`, `org_status`. | `\dT+ <enum>` |
| S7 | Migration 110 applied; `organization_addresses` table + `address_type` enum + partial unique index exist. | `\d organization_addresses` |
| S8 | Migration 111 applied; `journal_entries` has `source_system NOT NULL` and `source_external_id` columns; partial unique index `idx_je_source_external` exists. | `\d journal_entries` |

### 16.2 Services

| # | Criterion | Verification |
|---|---|---|
| V1 | `orgService.createOrgWithTemplate` accepts all new required + optional fields; integration test covers full-profile creation. | Integration test passes |
| V2 | `orgService.updateOrgProfile` is `withInvariants()`-wrapped, controller-only, writes full `before_state` to `audit_log`. | Integration test asserts both |
| V3 | `orgService.listIndustries` callable by any authenticated user (no org scoping). | Integration test with non-member user passes |
| V4 | `addressService` has `addAddress`, `updateAddress`, `removeAddress`, `setPrimaryAddress`, each `withInvariants()`-wrapped. | `grep withInvariants src/services/org/addressService.ts` returns 4 matches |
| V5 | Zod schemas exist at `src/shared/schemas/organization/{profile,address,externalIds}.schema.ts` with the shapes in §5, §11, §14. | Files exist, types compile |

### 16.3 API routes

| # | Criterion | Verification |
|---|---|---|
| R1 | All eight routes from §6 exist and call their service functions. | `find src/app/api -name route.ts` matches §6 |
| R2 | PATCH `/api/orgs/[orgId]/profile` rejects non-controller callers with 403. | API route test |
| R3 | POST `/api/orgs/[orgId]/addresses` rejects non-controller callers with 403. | API route test |

### 16.4 Audit

| # | Criterion | Verification |
|---|---|---|
| A1 | Five new action keys appear in `audit_log` after exercising the service layer: `org.profile_updated`, `org.address_added`, `org.address_updated`, `org.address_removed`, `org.address_primary_changed`. | Integration test query |
| A2 | Every `org.profile_updated` audit row has non-null `before_state` containing the full pre-mutation org row. | Integration test assertion |

### 16.5 Tests

| # | Criterion | Verification |
|---|---|---|
| T1 | All five Phase 1.1 Category A tests still pass. | `pnpm test:integration` green |
| T2 | All ten Phase 1.5A Category A tests pass (five new, §17). | `pnpm test:integration` green |
| T3 | `pnpm typecheck` passes after `pnpm db:generate-types` regenerates `src/db/types.ts`. | CI green |

---

## 17. Test Catalog

### 17.1 Category A floor tests (new — must pass at exit)

| # | Test file | What it asserts |
|---|---|---|
| CA-06 | `tests/integration/orgProfileCreation.test.ts` | Org creation with full profile populates all new columns; fields round-trip through `createOrgWithTemplate`. |
| CA-07 | `tests/integration/industryForeignKey.test.ts` | Inserting an org with a bogus `industry_id` rejects with FK violation; valid `industry_id` succeeds. |
| CA-08 | `tests/integration/addressPrimaryUniqueness.test.ts` | Partial unique index on `(org_id, address_type) WHERE is_primary = true` enforces one primary per type; `addAddress(..., {is_primary: true})` auto-demotes previous primary. |
| CA-09 | `tests/integration/addressServiceAudit.test.ts` | Each of the four `addressService` mutations writes an `audit_log` row with the correct action key and a populated `before_state`. |
| CA-10 | `tests/integration/crossOrgRlsIsolation.test.ts` (extend existing file) | Cross-org RLS isolation extends to `organization_addresses`: user in org A cannot SELECT address rows of org B; cannot INSERT into org B; controller of A cannot UPDATE/DELETE in org B. |

### 17.2 Category B tests (new — should pass at exit, not strict floor)

| # | Test file | What it asserts |
|---|---|---|
| CB-01 | `tests/integration/listIndustries.test.ts` | `orgService.listIndustries` callable by an authenticated user with zero org memberships; returns the seed list filtered to `is_active = true`. |
| CB-02 | `tests/unit/addressRegionValidation.test.ts` | Zod schema rejects `country='CA', region='British Columbia'`; accepts `country='CA', region='BC'`; accepts any region when `country='DE'`. |
| CB-03 | `tests/unit/externalIdsSchema.test.ts` | Rejects `{ stripe_customer_id: 123 }`; accepts `{ stripe_customer_id: 'cus_x', my_unknown_key: 'ok' }`. |
| CB-04 | `tests/integration/parentOrgSelfFk.test.ts` | `parent_org_id` accepts NULL; accepts a valid sibling `org_id`; rejects non-existent UUID (FK); rejects `parent_org_id = org_id` (CHECK). |
| CB-05 | `tests/integration/journalSourceExternalId.test.ts` | Inserting two entries with same `(org_id, source_system, source_external_id)` where `source_external_id IS NOT NULL` violates the partial unique index; multiple entries with `source_external_id = NULL` are all accepted. |

### 17.3 Test file locations summary

```
tests/
  integration/
    crossOrgRlsIsolation.test.ts        (EXTEND existing)
    orgProfileCreation.test.ts          (NEW)
    industryForeignKey.test.ts          (NEW)
    addressPrimaryUniqueness.test.ts    (NEW)
    addressServiceAudit.test.ts         (NEW)
    listIndustries.test.ts              (NEW)
    parentOrgSelfFk.test.ts             (NEW)
    journalSourceExternalId.test.ts     (NEW)
  unit/
    addressRegionValidation.test.ts     (NEW)
    externalIdsSchema.test.ts           (NEW)
```

**Do not create a new cross-org isolation test file.** Extend
`crossOrgRlsIsolation.test.ts` with the new `organization_addresses`
assertions so the Category A RLS test remains a single-file gate.

---

## 18. What is NOT in Phase 1.5A

Explicit out-of-scope list to prevent scope creep:

- **No MFA enforcement logic** — column only; middleware lands in 1.5B.
- **No `default_report_basis` reporting behavior** — column only;
  UI default toggle lands with Phase 2 reporting.
- **No user profile expansion** — users, invitations, roles are 1.5B.
- **No logo upload UI** — `logo_storage_path` column exists; UI
  lands in 1.5B alongside profile editing.
- **No rich profile backfill of existing seed data** — existing
  orgs get minimal sane defaults (`business_structure = 'other'`,
  empty `external_ids`, etc.). Founder can edit via
  `updateOrgProfile`.
- **No `organizations.industry` enum column drop** — two-step, see §8.
- **No `fiscal_years` first-class table** — Phase 2.
- **No `onboarding_status` enum** — Phase 2.
- **No `organization_tax_registrations` table** — Phase 2, see §15 OQ-01.
- **No journal line dimensions** — Phase 2, see §15 OQ-02.
- **No `industries.naics_code` population** — the column is
  seeded NULL in 1.5A. Populating the 2-digit NAICS codes is a
  follow-up seed-update migration tracked as a post-1.5A obligation.

---

## 19. Stop Points for This Session

This session (the one producing this brief) produces three
artifacts only:

1. This brief (`docs/09_briefs/phase-1.5/brief.md`).
2. Updates to `docs/02_specs/data_model.md` — new sections for
   `industries`, `organization_addresses`, extended
   `organizations` columns, `journal_entries` source-tracking
   additions, index-plan updates, and RLS policies in Part 2.
3. A new row in `docs/09_briefs/CURRENT_STATE.md` marking Phase
   1.5A in flight.

**No migrations written.** **No service code written.** **No test
files written.** The next session executes the brief and produces
the four migrations listed in §4, service code from §5, API
routes from §6, and tests from §17 — then asserts the §16 exit
criteria.

---

*End of Phase 1.5A Execution Brief.*
