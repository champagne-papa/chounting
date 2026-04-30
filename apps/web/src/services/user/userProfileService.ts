// src/services/user/userProfileService.ts
//
// INV-SERVICE-001 export contract: getOrCreateProfile, getProfile, and
// updateProfile carry pattern-D skip-org-check annotations per S29a —
// withInvariants's org-check is N/A since profiles are user-scoped, not
// org-scoped (route reads user_id from ctx.caller, not from URL).
// updateProfile is audit-logged; getOrCreateProfile is NOT
// (fires on every sign-in — logging it would flood audit_log).
// getOrCreateProfile is called from sign-in callback only (OQ-03 resolved).

import { adminClient } from '@/db/adminClient';
import type { ServiceContext } from '@/services/middleware/serviceContext';
import { loggerWith } from '@/shared/logger/pino';
import { ServiceError } from '@/services/errors/ServiceError';
import { recordMutation } from '@/services/audit/recordMutation';
import {
  updateUserProfilePatchSchema,
  type UpdateUserProfilePatch,
} from '@/shared/schemas/user/profile.schema';

function profilePatchToDbColumns(
  patch: UpdateUserProfilePatch,
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (patch.firstName !== undefined) out.first_name = patch.firstName;
  if (patch.lastName !== undefined) out.last_name = patch.lastName;
  if (patch.displayName !== undefined) out.display_name = patch.displayName;
  if (patch.phone !== undefined) out.phone = patch.phone;
  if (patch.phoneCountryCode !== undefined) out.phone_country_code = patch.phoneCountryCode;
  if (patch.preferredLocale !== undefined) out.preferred_locale = patch.preferredLocale;
  if (patch.preferredTimezone !== undefined) out.preferred_timezone = patch.preferredTimezone;
  if (patch.avatarStoragePath !== undefined) out.avatar_storage_path = patch.avatarStoragePath;
  return out;
}

export const userProfileService = {
  // withInvariants: skip-org-check (pattern-D: own-profile-only, route reads user_id from ctx.caller)
  async getOrCreateProfile(
    input: { user_id: string; email: string },
    _ctx: ServiceContext,
  ) {
    const db = adminClient();

    const { data: existing } = await db
      .from('user_profiles')
      .select('*')
      .eq('user_id', input.user_id)
      .maybeSingle();

    if (existing) {
      await db
        .from('user_profiles')
        .update({ last_login_at: new Date().toISOString() })
        .eq('user_id', input.user_id);
      return { ...existing, last_login_at: new Date().toISOString() };
    }

    const { data: created, error } = await db
      .from('user_profiles')
      .insert({
        user_id: input.user_id,
        last_login_at: new Date().toISOString(),
      })
      .select('*')
      .single();

    if (error || !created) {
      throw new ServiceError('PROFILE_UPDATE_FAILED', error?.message ?? 'Profile creation failed');
    }

    return created;
  },

  // withInvariants: skip-org-check (pattern-D: own-profile-only, route reads user_id from ctx.caller)
  async getProfile(
    input: { user_id: string },
    _ctx: ServiceContext,
  ) {
    const db = adminClient();
    const { data, error } = await db
      .from('user_profiles')
      .select('*')
      .eq('user_id', input.user_id)
      .maybeSingle();

    if (error) throw new ServiceError('READ_FAILED', error.message);
    if (!data) throw new ServiceError('PROFILE_NOT_FOUND', `user_id=${input.user_id}`);
    return data;
  },

  // withInvariants: skip-org-check (pattern-D: own-profile-only, route reads user_id from ctx.caller)
  async updateProfile(
    input: { user_id: string; patch: UpdateUserProfilePatch },
    ctx: ServiceContext,
  ) {
    const parsedPatch = updateUserProfilePatchSchema.parse(input.patch);
    const log = loggerWith({ trace_id: ctx.trace_id, user_id: ctx.caller.user_id });
    const db = adminClient();

    // Session 5.2: upsert shape. The Phase 1.5B design assumed
    // sign-in's getOrCreateProfile always runs before any
    // updateProfile call, but the EC-20 smoke test caught a
    // bypass-sign-in path (admin-created users via
    // auth.admin.createUser) that doesn't fire getOrCreateProfile
    // and leaves no user_profiles row. Converting to upsert
    // removes the ordering dependency: the row is materialized
    // on first updateProfile call if absent. The SELECT
    // beforehand captures `before` for the audit row per Phase
    // 1.5A convention (before_state populated on UPDATE, null
    // on INSERT).

    const { data: before, error: beforeErr } = await db
      .from('user_profiles')
      .select('*')
      .eq('user_id', input.user_id)
      .maybeSingle();

    if (beforeErr) throw new ServiceError('PROFILE_UPDATE_FAILED', beforeErr.message);

    const dbPatch = profilePatchToDbColumns(parsedPatch);

    // ON CONFLICT (user_id) DO UPDATE is atomic at the DB layer,
    // so the SELECT-then-UPSERT race window (another session
    // inserting between our SELECT and our UPSERT) is benign for
    // correctness — the second writer's UPSERT becomes an UPDATE.
    // The audit's before_state may be slightly stale in that
    // narrow window (we'd report null when a concurrent insert
    // happened), but single-user flows are unlikely to race and
    // the audit fidelity hit is acceptable.
    const { error: upsertErr } = await db
      .from('user_profiles')
      .upsert(
        { user_id: input.user_id, ...dbPatch },
        { onConflict: 'user_id' },
      );

    if (upsertErr) throw new ServiceError('PROFILE_UPDATE_FAILED', upsertErr.message);

    // user.profile_updated is a user event, not an org event —
    // the profile is not scoped to any specific org. audit_log
    // .org_id has been nullable since migration 113 (Phase 1.5B);
    // AuditEntry.org_id is string | null as of Session 4.5.
    // before_state is null on the upsert-insert path (Phase
    // 1.5A convention: null before_state distinguishes "created"
    // from "mutated" when reading the audit log).
    await recordMutation(db, ctx, {
      org_id: null,
      action: 'user.profile_updated',
      entity_type: 'user_profile',
      entity_id: input.user_id,
      before_state: before ? (before as Record<string, unknown>) : undefined,
    });

    log.info(
      {
        user_id: input.user_id,
        fields_changed: Object.keys(dbPatch),
        auto_created: !before,
      },
      'User profile upserted',
    );
    return { user_id: input.user_id, fields_changed: Object.keys(dbPatch) };
  },
};
