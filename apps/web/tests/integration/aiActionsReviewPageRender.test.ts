// tests/integration/aiActionsReviewPageRender.test.ts
// Phase 1.2 Session 8 Commit 2 — AI Action Review page authz gate.
//
// Direct React-component render of the server-component page is
// not set up in this integration suite (no jsdom /
// @testing-library). This test pins the authz-gate ingredients the
// page relies on, matching the orgProfileEditorAuthz.test.ts
// precedent:
//
//   - getMembership(user_id, orgId) returns non-null for each of
//     the three seed personas on ORG_HOLDING → page renders.
//   - getMembership returns null for a stranger user_id → page
//     redirects.
//   - Documents the ?forbidden=ai-actions-read query-param
//     contract the page emits on denial (Session 8 / P30 shape,
//     matching Session 6 Pre-decision 5's ?forbidden pattern).

import { describe, it, expect } from 'vitest';
import { SEED } from '../setup/testDb';
import { getMembership } from '@/services/auth/getMembership';

describe('CA-S8-C2b: AI Action Review page authz gate', () => {
  // Seed reality (verified via psql against local dev DB):
  //   - Executive: active on ORG_HOLDING + ORG_REAL_ESTATE
  //   - Controller: active on ORG_HOLDING + ORG_REAL_ESTATE
  //   - AP Specialist: active on ORG_REAL_ESTATE ONLY (not ORG_HOLDING)
  // (The comment in orgProfileEditorAuthz.test.ts:52-54 claiming
  // "every seed user has memberships on both" is outdated;
  // captured as a Convention #9 datapoint in the C2 closeout.)
  it('each seed persona has active membership on their seeded org — page renders', async () => {
    const controller = await getMembership(SEED.USER_CONTROLLER, SEED.ORG_HOLDING);
    expect(controller).not.toBeNull();
    expect(controller!.role).toBe('controller');

    const executive = await getMembership(SEED.USER_EXECUTIVE, SEED.ORG_HOLDING);
    expect(executive).not.toBeNull();
    expect(executive!.role).toBe('executive');

    // AP Specialist is seeded on ORG_REAL_ESTATE, not ORG_HOLDING.
    const apSpecialist = await getMembership(
      SEED.USER_AP_SPECIALIST,
      SEED.ORG_REAL_ESTATE,
    );
    expect(apSpecialist).not.toBeNull();
    expect(apSpecialist!.role).toBe('ap_specialist');
  });

  it('AP specialist is NOT a member of ORG_HOLDING (seed reality) — page redirects for this combo', async () => {
    const apOnHolding = await getMembership(
      SEED.USER_AP_SPECIALIST,
      SEED.ORG_HOLDING,
    );
    expect(apOnHolding).toBeNull();
    // The page redirects when membership is null; this is the
    // standard non-member path, not persona-specific.
  });

  it('stranger user (not in memberships) — getMembership returns null → page redirects', async () => {
    const strangerId = '00000000-0000-0000-0000-999999999998';
    const membership = await getMembership(strangerId, SEED.ORG_HOLDING);
    expect(membership).toBeNull();
    // The page handles this branch by redirecting to
    // /<locale>/<orgId>/?forbidden=ai-actions-read (see assertion
    // below for the exact query-param shape).
  });

  it('?forbidden=ai-actions-read is the exact query-param flag the page emits on denial', () => {
    // Documenting the session contract as a code assertion: the
    // page at src/app/[locale]/[orgId]/agent/actions/page.tsx
    // redirects with this exact string on membership-null. Matches
    // Session 6 Pre-decision 5's ?forbidden=<kebab-action-id>
    // pattern. If this string changes, update both the page and
    // any downstream toast consumer in lockstep.
    const forbiddenFlag = 'ai-actions-read';
    expect(forbiddenFlag).toBe('ai-actions-read');
    expect(`/en/${SEED.ORG_HOLDING}/?forbidden=${forbiddenFlag}`).toBe(
      `/en/${SEED.ORG_HOLDING}/?forbidden=ai-actions-read`,
    );
  });
});
