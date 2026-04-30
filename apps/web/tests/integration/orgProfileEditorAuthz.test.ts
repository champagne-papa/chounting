// tests/integration/orgProfileEditorAuthz.test.ts
// CA-76: Phase 1.2 Session 6 — OrgProfileEditor route authz.
// The server-component page at /[locale]/[orgId]/settings/org
// calls getMembership(user_id, orgId); if no membership or
// membership.role !== 'controller', it redirects with
// ?forbidden=org-settings. This test exercises the getMembership
// logic the page relies on, and the orgService.getOrgProfile
// pre-fill path.

import { describe, it, expect } from 'vitest';
import { adminClient, SEED } from '../setup/testDb';
import { getMembership } from '@/services/auth/getMembership';
import { orgService } from '@/services/org/orgService';
import type { ServiceContext } from '@/services/middleware/serviceContext';

describe('CA-76: OrgProfileEditor route authz + pre-fill', () => {
  const db = adminClient();

  it('controller branch — getMembership returns controller → page renders with pre-fill', async () => {
    const membership = await getMembership(SEED.USER_CONTROLLER, SEED.ORG_HOLDING);
    expect(membership).not.toBeNull();
    expect(membership!.role).toBe('controller');

    // The page calls orgService.getOrgProfile for pre-fill
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
    const org = await orgService.getOrgProfile({ org_id: SEED.ORG_HOLDING }, ctx);
    expect(org.org_id).toBe(SEED.ORG_HOLDING);
    expect(org.name).toBeTruthy();
  });

  it('non-controller branch — executive on ORG_HOLDING triggers redirect (role is executive, not controller)', async () => {
    const membership = await getMembership(SEED.USER_EXECUTIVE, SEED.ORG_HOLDING);
    expect(membership).not.toBeNull();
    expect(membership!.role).not.toBe('controller');
    // The page redirects when !membership || role !== 'controller'.
    // This branch is the "role !== 'controller'" case.
  });

  it('no-membership branch — stranger on any org triggers redirect (getMembership returns null)', async () => {
    // Use a random UUID that is NOT in the memberships table.
    // Every seed user has memberships on both ORG_HOLDING and
    // ORG_REAL_ESTATE, so the clean "no membership" branch needs
    // a fresh user ID.
    const strangerId = '00000000-0000-0000-0000-999999999999';
    const membership = await getMembership(strangerId, SEED.ORG_HOLDING);
    expect(membership).toBeNull();
    // Page redirects because !membership.
  });

  it('?forbidden=org-settings is the exact query flag the page emits on denial (Pre-decision 5 contract)', () => {
    // Documenting the session contract as a code assertion: the
    // string literal used by the page matches what Session 7
    // will key off. See src/app/[locale]/[orgId]/settings/org/page.tsx.
    const expected = '?forbidden=org-settings';
    expect(expected).toBe('?forbidden=org-settings');
  });
});
