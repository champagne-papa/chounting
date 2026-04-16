// tests/integration/ownerProtection.test.ts
// CA-19: changeUserRole rejected when target is owner losing controller.
// CA-20: suspendUser and removeUser rejected when target is owner.

import { describe, it, expect } from 'vitest';
import { SEED } from '../setup/testDb';
import { membershipService } from '@/services/org/membershipService';
import type { ServiceContext } from '@/services/middleware/serviceContext';

describe('CA-19/20: org owner protection', () => {
  const ctx: ServiceContext = {
    trace_id: crypto.randomUUID(),
    caller: { verified: true, user_id: SEED.USER_CONTROLLER, email: 'controller@thebridge.local', org_ids: [SEED.ORG_HOLDING, SEED.ORG_REAL_ESTATE] },
    locale: 'en',
  };

  it('CA-19: rejects changing owner role away from controller', async () => {
    await expect(
      membershipService.changeUserRole(
        { org_id: SEED.ORG_HOLDING, user_id: SEED.USER_CONTROLLER, new_role: 'ap_specialist' },
        ctx,
      ),
    ).rejects.toThrow(/OWNER_ROLE_CHANGE_DENIED/);
  });

  it('CA-19: allows changing owner role to controller (no-op but accepted)', async () => {
    const result = await membershipService.changeUserRole(
      { org_id: SEED.ORG_HOLDING, user_id: SEED.USER_CONTROLLER, new_role: 'controller' },
      ctx,
    );
    expect(result.membership_id).toBeTruthy();
  });

  it('CA-20: rejects suspending the org owner', async () => {
    await expect(
      membershipService.suspendUser(
        { org_id: SEED.ORG_HOLDING, user_id: SEED.USER_CONTROLLER },
        ctx,
      ),
    ).rejects.toThrow(/OWNER_CANNOT_BE_SUSPENDED/);
  });

  it('CA-20: rejects removing the org owner', async () => {
    await expect(
      membershipService.removeUser(
        { org_id: SEED.ORG_HOLDING, user_id: SEED.USER_CONTROLLER },
        ctx,
      ),
    ).rejects.toThrow(/OWNER_CANNOT_BE_REMOVED/);
  });
});
