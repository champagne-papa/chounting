-- =============================================================
-- 20240112000000_user_profiles.sql
-- Phase 1.5B: user profile table
-- =============================================================
-- Supabase Auth owns identity (email, password, MFA). This table
-- owns display info, preferences, and login tracking. Auto-created
-- on first login via userProfileService.getOrCreateProfile().
--
-- See docs/09_briefs/phase-1.5/1.5B-brief.md §4.1.
-- =============================================================

BEGIN;

CREATE TABLE user_profiles (
  user_id               uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name            text,
  last_name             text,
  display_name          text,
  avatar_storage_path   text,
  phone                 text,
  phone_country_code    text,
  preferred_locale      text,
  preferred_timezone    text,
  last_login_at         timestamptz,
  created_at            timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT profile_phone_country_code_shape
    CHECK (phone_country_code IS NULL OR phone_country_code ~ '^\+[0-9]{1,3}$')
);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Users see their own profile.
CREATE POLICY user_profiles_select_own ON user_profiles
  FOR SELECT USING (user_id = auth.uid());

-- Controllers see profiles of members in their orgs (for user list).
CREATE POLICY user_profiles_select_org ON user_profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM memberships m
      WHERE m.user_id = user_profiles.user_id
        AND user_is_controller(m.org_id)
    )
  );

COMMENT ON TABLE user_profiles IS
  'Application-owned user profile. Supabase Auth owns identity (email, password, MFA); we own display info, preferences, and login tracking. Auto-created on first login via getOrCreateProfile().';

COMMIT;
