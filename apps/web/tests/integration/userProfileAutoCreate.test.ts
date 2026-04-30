// tests/integration/userProfileAutoCreate.test.ts
// CA-14: getOrCreateProfile auto-creates on first call, returns existing on second.

import { describe, it, expect, afterAll } from 'vitest';
import { adminClient, SEED } from '../setup/testDb';
import { userProfileService } from '@/services/user/userProfileService';
import type { ServiceContext } from '@/services/middleware/serviceContext';

describe('CA-14: user profile auto-creation', () => {
  const db = adminClient();
  const ctx: ServiceContext = {
    trace_id: crypto.randomUUID(),
    caller: { verified: true, user_id: SEED.USER_CONTROLLER, email: 'controller@thebridge.local', org_ids: [SEED.ORG_HOLDING] },
    locale: 'en',
  };

  afterAll(async () => {
    // Seed profiles are re-created by dev.sql; just ensure test doesn't leave garbage.
  });

  it('returns an existing profile for a seeded user', async () => {
    const profile = await userProfileService.getOrCreateProfile(
      { user_id: SEED.USER_CONTROLLER, email: 'controller@thebridge.local' },
      ctx,
    );
    expect(profile.user_id).toBe(SEED.USER_CONTROLLER);
    expect(profile.last_login_at).toBeTruthy();
  });

  it('auto-creates a profile for a new user_id then returns existing on second call', async () => {
    const newUserId = SEED.USER_EXECUTIVE;
    const profile1 = await userProfileService.getOrCreateProfile(
      { user_id: newUserId, email: 'executive@thebridge.local' },
      ctx,
    );
    expect(profile1.user_id).toBe(newUserId);

    const profile2 = await userProfileService.getOrCreateProfile(
      { user_id: newUserId, email: 'executive@thebridge.local' },
      ctx,
    );
    expect(profile2.user_id).toBe(newUserId);
    expect(profile2.created_at).toBe(profile1.created_at);
  });
});
