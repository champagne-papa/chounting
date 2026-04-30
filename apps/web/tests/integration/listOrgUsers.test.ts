// tests/integration/listOrgUsers.test.ts
// CA-24: Returns active + suspended, excludes removed; joins profiles.

import { describe, it, expect } from 'vitest';
import { SEED } from '../setup/testDb';
import { membershipService } from '@/services/org/membershipService';
import type { ServiceContext } from '@/services/middleware/serviceContext';

describe('CA-24: listOrgUsers returns active/suspended, excludes removed', () => {
  const ctx: ServiceContext = {
    trace_id: crypto.randomUUID(),
    caller: { verified: true, user_id: SEED.USER_CONTROLLER, email: 'controller@thebridge.local', org_ids: [SEED.ORG_HOLDING, SEED.ORG_REAL_ESTATE] },
    locale: 'en',
  };

  it('returns active members with joined profiles for the real-estate org', async () => {
    const result = await membershipService.listOrgUsers(
      { org_id: SEED.ORG_REAL_ESTATE },
      ctx,
    );

    expect(result.users.length).toBeGreaterThanOrEqual(2);

    const statuses = result.users.map((u: Record<string, unknown>) => u.status as string);
    expect(statuses).not.toContain('removed');
    expect(statuses).not.toContain('invited');

    const controller = result.users.find(
      (u: Record<string, unknown>) => u.user_id === SEED.USER_CONTROLLER,
    );
    expect(controller).toBeTruthy();
    expect((controller as Record<string, unknown>).user_profiles).toBeTruthy();
  });
});
