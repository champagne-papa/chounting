// tests/integration/orgGetCrossOrg.test.ts
// S30 hot-fix; element #6 G1 Variant γ closure regression tests.
//
// Asserts that GET handlers at /api/orgs/[orgId]/{profile,addresses,
// users,invitations} reject cross-org callers with 403 ORG_ACCESS_DENIED.
// The vi.mock(buildServiceContext) populates caller.org_ids with a
// single org (ORG_HOLDING); the test URL targets a different org
// (ORG_REAL_ESTATE). Mismatch triggers the route-handler-level
// caller.org_ids.includes(orgId) check at each route.
//
// Pattern mirrors tests/integration/conversationLoadEndpoint.test.ts:27-47.

import { describe, it, expect, vi } from 'vitest';
import { SEED } from '../setup/testDb';

const TEST_TRACE = '00000000-0000-4000-8000-0000000000c0';

vi.mock('@/services/middleware/serviceContext', async () => {
  const actual =
    await vi.importActual<typeof import('@/services/middleware/serviceContext')>(
      '@/services/middleware/serviceContext',
    );
  return {
    ...actual,
    buildServiceContext: vi.fn(async () => ({
      trace_id: TEST_TRACE,
      caller: {
        user_id: SEED.USER_CONTROLLER,
        email: 'controller@thebridge.local',
        verified: true,
        org_ids: [SEED.ORG_HOLDING], // single org for cross-org-deny scenarios
      },
      locale: 'en' as const,
    })),
  };
});

const { GET: getProfile } = await import('@/app/api/orgs/[orgId]/profile/route');
const { GET: getAddresses } = await import('@/app/api/orgs/[orgId]/addresses/route');
const { GET: getUsers } = await import('@/app/api/orgs/[orgId]/users/route');
const { GET: getInvitations } = await import('@/app/api/orgs/[orgId]/invitations/route');

describe('GET /api/orgs/[orgId]/* cross-org isolation (S30 hot-fix; element #6 G1 Variant γ)', () => {
  it('GET /api/orgs/[orgId]/profile returns 403 when caller is not a member of orgId', async () => {
    const req = new Request(
      `http://test/api/orgs/${SEED.ORG_REAL_ESTATE}/profile`,
      { method: 'GET' },
    );
    const resp = await getProfile(req, {
      params: Promise.resolve({ orgId: SEED.ORG_REAL_ESTATE }),
    });
    expect(resp.status).toBe(403);
    const body = await resp.json();
    expect(body.error).toBe('ORG_ACCESS_DENIED');
    expect(body.message).toContain(SEED.ORG_REAL_ESTATE);
  });

  it('GET /api/orgs/[orgId]/addresses returns 403 when caller is not a member of orgId', async () => {
    const req = new Request(
      `http://test/api/orgs/${SEED.ORG_REAL_ESTATE}/addresses`,
      { method: 'GET' },
    );
    const resp = await getAddresses(req, {
      params: Promise.resolve({ orgId: SEED.ORG_REAL_ESTATE }),
    });
    expect(resp.status).toBe(403);
    const body = await resp.json();
    expect(body.error).toBe('ORG_ACCESS_DENIED');
    expect(body.message).toContain(SEED.ORG_REAL_ESTATE);
  });

  it('GET /api/orgs/[orgId]/users returns 403 when caller is not a member of orgId', async () => {
    const req = new Request(
      `http://test/api/orgs/${SEED.ORG_REAL_ESTATE}/users`,
      { method: 'GET' },
    );
    const resp = await getUsers(req, {
      params: Promise.resolve({ orgId: SEED.ORG_REAL_ESTATE }),
    });
    expect(resp.status).toBe(403);
    const body = await resp.json();
    expect(body.error).toBe('ORG_ACCESS_DENIED');
    expect(body.message).toContain(SEED.ORG_REAL_ESTATE);
  });

  it('GET /api/orgs/[orgId]/invitations returns 403 when caller is not a member of orgId', async () => {
    const req = new Request(
      `http://test/api/orgs/${SEED.ORG_REAL_ESTATE}/invitations`,
      { method: 'GET' },
    );
    const resp = await getInvitations(req, {
      params: Promise.resolve({ orgId: SEED.ORG_REAL_ESTATE }),
    });
    expect(resp.status).toBe(403);
    const body = await resp.json();
    expect(body.error).toBe('ORG_ACCESS_DENIED');
    expect(body.message).toContain(SEED.ORG_REAL_ESTATE);
  });
});
