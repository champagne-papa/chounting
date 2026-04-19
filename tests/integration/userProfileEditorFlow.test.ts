// tests/integration/userProfileEditorFlow.test.ts
// CA-75: Phase 1.2 Session 6 — UserProfileEditor backend flow.
// The editor component fetches GET /api/auth/me (pre-fill) and
// submits PATCH /api/auth/me (save). This test exercises the
// service-layer path each API route uses — userProfileService.
// getOrCreateProfile + userProfileService.updateProfile —
// asserting the editor's save path materializes or updates the
// user_profiles row correctly.

import { describe, it, expect, afterAll } from 'vitest';
import { adminClient, SEED } from '../setup/testDb';
import { userProfileService } from '@/services/user/userProfileService';
import type { ServiceContext } from '@/services/middleware/serviceContext';

describe('CA-75: UserProfileEditor flow — updateProfile persists the patch', () => {
  const db = adminClient();
  const traceId = crypto.randomUUID();
  const ctx: ServiceContext = {
    trace_id: traceId,
    caller: {
      verified: true,
      user_id: SEED.USER_EXECUTIVE,
      email: 'executive@thebridge.local',
      org_ids: [SEED.ORG_HOLDING],
    },
    locale: 'en',
  };

  // Capture original row to restore in afterAll
  let originalProfile: Record<string, unknown> | null = null;

  afterAll(async () => {
    if (originalProfile) {
      await db
        .from('user_profiles')
        .update({
          display_name: originalProfile.display_name,
          first_name: originalProfile.first_name,
          last_name: originalProfile.last_name,
        })
        .eq('user_id', SEED.USER_EXECUTIVE);
    }
    await db.from('audit_log').delete().eq('trace_id', traceId);
  });

  it('pre-fetch: profile row exists for executive (GET /api/auth/me → getOrCreateProfile)', async () => {
    const profile = await userProfileService.getOrCreateProfile(
      { user_id: SEED.USER_EXECUTIVE, email: 'executive@thebridge.local' },
      ctx,
    );
    expect(profile).toBeTruthy();
    expect(profile.user_id).toBe(SEED.USER_EXECUTIVE);
    originalProfile = profile as Record<string, unknown>;
  });

  it('updateProfile persists a displayName patch (what PATCH /api/auth/me triggers on save)', async () => {
    const newName = 'Executive User — CA75 probe';
    const result = await userProfileService.updateProfile(
      { user_id: SEED.USER_EXECUTIVE, patch: { displayName: newName } },
      ctx,
    );
    expect(result.fields_changed).toContain('display_name');

    const { data } = await db
      .from('user_profiles')
      .select('display_name')
      .eq('user_id', SEED.USER_EXECUTIVE)
      .single();
    expect(data!.display_name).toBe(newName);
  });

  it('updateProfile persists multi-field patches atomically', async () => {
    const result = await userProfileService.updateProfile(
      {
        user_id: SEED.USER_EXECUTIVE,
        patch: {
          displayName: 'Exec CA75 multi',
          firstName: 'ExecCA75First',
          lastName: 'ExecCA75Last',
        },
      },
      ctx,
    );
    expect(result.fields_changed).toEqual(
      expect.arrayContaining(['display_name', 'first_name', 'last_name']),
    );

    const { data } = await db
      .from('user_profiles')
      .select('display_name, first_name, last_name')
      .eq('user_id', SEED.USER_EXECUTIVE)
      .single();
    expect(data!.display_name).toBe('Exec CA75 multi');
    expect(data!.first_name).toBe('ExecCA75First');
    expect(data!.last_name).toBe('ExecCA75Last');
  });

  it('updateProfile records an audit row with action=user.profile_updated', async () => {
    const { data } = await db
      .from('audit_log')
      .select('action, entity_type, entity_id')
      .eq('trace_id', traceId)
      .eq('action', 'user.profile_updated');
    expect(data!.length).toBeGreaterThanOrEqual(1);
    const row = data![0];
    expect(row.entity_type).toBe('user_profile');
    expect(row.entity_id).toBe(SEED.USER_EXECUTIVE);
  });
});
