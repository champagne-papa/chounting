-- =============================================================
-- 20240110000000_organization_addresses.sql
-- Phase 1.5A: one-to-many addresses per org, typed by purpose
-- =============================================================
-- address_type enum distinguishes mailing, physical, registered,
-- payment_stub. Partial unique index enforces at most one
-- primary per (org_id, address_type). See
-- docs/09_briefs/phase-1.5/brief.md §4.3 for rationale.
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

-- Partial unique index: at most one primary per (org_id, address_type).
CREATE UNIQUE INDEX idx_org_addr_primary
  ON organization_addresses (org_id, address_type)
  WHERE is_primary = true;

-- Supporting index for list queries.
CREATE INDEX idx_org_addr_org
  ON organization_addresses (org_id, address_type);

-- -----------------------------------------------------------------
-- RLS
-- SELECT/INSERT: any org member; UPDATE/DELETE: controllers only.
-- Service layer tightens INSERT to controller-only as
-- defense-in-depth (see brief §5.2).
-- -----------------------------------------------------------------

ALTER TABLE organization_addresses ENABLE ROW LEVEL SECURITY;

CREATE POLICY org_addr_select ON organization_addresses
  FOR SELECT USING (user_has_org_access(org_id));

CREATE POLICY org_addr_insert ON organization_addresses
  FOR INSERT WITH CHECK (user_has_org_access(org_id));

CREATE POLICY org_addr_update ON organization_addresses
  FOR UPDATE USING (user_is_controller(org_id));

CREATE POLICY org_addr_delete ON organization_addresses
  FOR DELETE USING (user_is_controller(org_id));

COMMIT;
