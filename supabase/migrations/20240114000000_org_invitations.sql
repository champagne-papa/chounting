-- =============================================================
-- 20240114000000_org_invitations.sql
-- Phase 1.5B: invitation-based org membership onboarding
-- =============================================================
-- Token flow (OQ-02 RESOLVED): composite token format is
-- {invitation_id}:{random_hex}. Only bcrypt hash stored. On
-- accept: split on first ':', PK lookup by invitation_id, then
-- bcrypt-compare full token. O(1) vs O(n) email scan.
--
-- See docs/09_briefs/phase-1.5/1.5B-brief.md §4.3.
-- =============================================================

BEGIN;

CREATE TYPE invitation_status AS ENUM (
  'pending',
  'accepted',
  'expired',
  'revoked'
);

CREATE TABLE org_invitations (
  invitation_id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id               uuid NOT NULL REFERENCES organizations(org_id) ON DELETE CASCADE,
  invited_email        text NOT NULL,
  invited_by_user_id   uuid NOT NULL REFERENCES auth.users(id),
  role                 user_role NOT NULL,
  token_hash           text NOT NULL,
  expires_at           timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  accepted_at          timestamptz,
  accepted_by_user_id  uuid REFERENCES auth.users(id),
  status               invitation_status NOT NULL DEFAULT 'pending',
  created_at           timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT invitation_email_lowercase
    CHECK (invited_email = lower(invited_email)),
  CONSTRAINT invitation_accepted_consistency
    CHECK (
      status != 'accepted'
      OR (accepted_at IS NOT NULL AND accepted_by_user_id IS NOT NULL)
    )
);

-- Only one pending invitation per email per org.
CREATE UNIQUE INDEX idx_invitation_pending_email
  ON org_invitations (org_id, invited_email)
  WHERE status = 'pending';

CREATE INDEX idx_invitations_org_status
  ON org_invitations (org_id, status);

ALTER TABLE org_invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY org_invitations_select ON org_invitations
  FOR SELECT USING (user_is_controller(org_id));

-- -----------------------------------------------------------------
-- Add the deferred FK from memberships.invited_via → org_invitations.
-- The column was added in migration 113 as plain uuid; now that the
-- target table exists, add the FK constraint.
-- -----------------------------------------------------------------

ALTER TABLE memberships
  ADD CONSTRAINT memberships_invited_via_fkey
    FOREIGN KEY (invited_via) REFERENCES org_invitations(invitation_id);

COMMIT;
