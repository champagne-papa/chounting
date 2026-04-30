// tests/integration/orgUsersViewRender.test.ts
// CA-77: Phase 1.2 Session 6 — OrgUsersView render data source.
// The view fetches GET /api/orgs/[orgId]/users which calls
// membershipService.listOrgUsers. This test asserts the shape
// and content the view expects: active + suspended members,
// joined user_profiles, role / status / is_org_owner fields.

import { describe, it, expect } from 'vitest';
import { SEED } from '../setup/testDb';
import { membershipService } from '@/services/org/membershipService';
import type { ServiceContext } from '@/services/middleware/serviceContext';

type OrgUserRow = {
  membership_id: string;
  user_id: string;
  role: string;
  status: string;
  is_org_owner: boolean;
  user_profiles: Record<string, unknown> | null;
};

describe('CA-77: OrgUsersView render data — listOrgUsers', () => {
  const ctx: ServiceContext = {
    trace_id: crypto.randomUUID(),
    caller: {
      verified: true,
      user_id: SEED.USER_CONTROLLER,
      email: 'controller@thebridge.local',
      org_ids: [SEED.ORG_HOLDING],
    },
    locale: 'en',
  };

  it('returns active members on ORG_HOLDING with joined user_profiles', async () => {
    const result = await membershipService.listOrgUsers({ org_id: SEED.ORG_HOLDING }, ctx);
    expect(result.users).toBeDefined();
    expect(result.users.length).toBeGreaterThanOrEqual(2); // at least controller + executive

    const rows = result.users as unknown as OrgUserRow[];
    for (const u of rows) {
      expect(u.user_id).toBeTruthy();
      expect(u.role).toBeTruthy();
      expect(u.status).toBeTruthy();
      expect(['active', 'suspended']).toContain(u.status);
    }
  });

  it('each row surfaces the columns the view renders (Name/Role/Status/Owner)', async () => {
    const result = await membershipService.listOrgUsers({ org_id: SEED.ORG_HOLDING }, ctx);
    const rows = result.users as unknown as OrgUserRow[];
    const controllerRow = rows.find((u) => u.user_id === SEED.USER_CONTROLLER);
    expect(controllerRow).toBeDefined();
    expect(controllerRow!.role).toBe('controller');
    expect(controllerRow!.is_org_owner).toBe(true);
    expect(controllerRow!.user_profiles).toBeDefined();
  });

  it('includes only active + suspended (removed/pending are filtered out)', async () => {
    const result = await membershipService.listOrgUsers({ org_id: SEED.ORG_HOLDING }, ctx);
    const rows = result.users as unknown as OrgUserRow[];
    for (const u of rows) {
      expect(['active', 'suspended']).toContain(u.status);
    }
  });
});
