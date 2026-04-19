// src/services/user/userProfileService.ts
//
// INV-SERVICE-001 export contract: plain unwrapped functions.
// updateProfile is audit-logged; getOrCreateProfile is NOT
// (fires on every sign-in — logging it would flood audit_log).
// Authorization: updateProfile is own-profile-only (route reads
// user_id from ctx.caller, not from URL). getOrCreateProfile is
// called from sign-in callback only (OQ-03 resolved).

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

  async updateProfile(
    input: { user_id: string; patch: UpdateUserProfilePatch },
    ctx: ServiceContext,
  ) {
    const parsedPatch = updateUserProfilePatchSchema.parse(input.patch);
    const log = loggerWith({ trace_id: ctx.trace_id, user_id: ctx.caller.user_id });
    const db = adminClient();

    const { data: before, error: beforeErr } = await db
      .from('user_profiles')
      .select('*')
      .eq('user_id', input.user_id)
      .maybeSingle();

    if (beforeErr) throw new ServiceError('PROFILE_UPDATE_FAILED', beforeErr.message);
    if (!before) throw new ServiceError('PROFILE_NOT_FOUND', `user_id=${input.user_id}`);

    const dbPatch = profilePatchToDbColumns(parsedPatch);

    const { error: updateErr } = await db
      .from('user_profiles')
      .update(dbPatch)
      .eq('user_id', input.user_id);

    if (updateErr) throw new ServiceError('PROFILE_UPDATE_FAILED', updateErr.message);

    // user.profile_updated is a user event, not an org event —
    // the profile is not scoped to any specific org. audit_log
    // .org_id has been nullable since migration 113 (Phase 1.5B);
    // AuditEntry.org_id is string | null as of Session 4.5.
    await recordMutation(db, ctx, {
      org_id: null,
      action: 'user.profile_updated',
      entity_type: 'user_profile',
      entity_id: input.user_id,
      before_state: before as Record<string, unknown>,
    });

    log.info({ user_id: input.user_id, fields_changed: Object.keys(dbPatch) }, 'User profile updated');
    return { user_id: input.user_id, fields_changed: Object.keys(dbPatch) };
  },
};
