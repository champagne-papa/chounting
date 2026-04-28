// tests/integration/mfaEnforcementMiddleware.test.ts
// CA-22: MFA enforcement — verifies the org mfa_required column + the
// middleware's wiring + redirect logic.
//
// The original test asserted only the DB-level prerequisite (column flips,
// function exports) and noted "The actual redirect behavior is verified
// manually in the browser." S25 QW-01 (UF-009) wires enforceMfa into the
// top-level middleware.ts and adds wiring-assertion cases that exercise
// the request → middleware → redirect path with a mocked Supabase chain.

import { describe, it, expect, afterAll, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { adminClient, SEED } from '../setup/testDb';

describe('CA-22: MFA enforcement prerequisites', () => {
  const db = adminClient();

  afterAll(async () => {
    await db.from('organizations')
      .update({ mfa_required: false })
      .eq('org_id', SEED.ORG_HOLDING);
  });

  it('org with mfa_required=false does not require MFA', async () => {
    const { data } = await db
      .from('organizations')
      .select('mfa_required')
      .eq('org_id', SEED.ORG_HOLDING)
      .single();
    expect(data!.mfa_required).toBe(false);
  });

  it('org with mfa_required=true requires MFA', async () => {
    await db.from('organizations')
      .update({ mfa_required: true })
      .eq('org_id', SEED.ORG_HOLDING);

    const { data } = await db
      .from('organizations')
      .select('mfa_required')
      .eq('org_id', SEED.ORG_HOLDING)
      .single();
    expect(data!.mfa_required).toBe(true);
  });

  it('mfaEnforcement module exports enforceMfa function', async () => {
    const mod = await import('@/middleware/mfaEnforcement');
    expect(typeof mod.enforceMfa).toBe('function');
  });
});

// CA-22 (extended): middleware wiring — S25 QW-01 / UF-009.
// Asserts that the top-level middleware.ts actually invokes enforceMfa
// (not just exports it from a sibling module) and that the redirect
// behavior fires under the expected (aal, mfa_required, path) combinations.
//
// Mocks @supabase/ssr's createServerClient to control auth.getUser,
// auth.mfa.getAuthenticatorAssuranceLevel, and the organizations row
// lookup per test case. Constructs real NextRequest fixtures matching
// the middleware matcher.

const supabaseStub = vi.hoisted(() => ({
  auth: {
    getUser: vi.fn(),
    mfa: { getAuthenticatorAssuranceLevel: vi.fn() },
  },
  from: vi.fn(),
}));

vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(() => supabaseStub),
}));

const TEST_ORG_ID = '11111111-1111-1111-1111-111111111111';
const TEST_USER_ID = '22222222-2222-2222-2222-222222222222';

function configureSupabase(opts: {
  user: { id: string } | null;
  mfaRequired: boolean | null;
  aal: 'aal1' | 'aal2' | null;
}) {
  supabaseStub.auth.getUser.mockResolvedValue({
    data: { user: opts.user },
    error: null,
  });

  supabaseStub.from.mockReturnValue({
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        maybeSingle: vi
          .fn()
          .mockResolvedValue({ data: { mfa_required: opts.mfaRequired }, error: null }),
      }),
    }),
  });

  supabaseStub.auth.mfa.getAuthenticatorAssuranceLevel.mockResolvedValue({
    data: opts.aal ? { currentLevel: opts.aal } : null,
    error: null,
  });
}

describe('CA-22 (extended): middleware wiring asserts enforceMfa is invoked', () => {
  beforeEach(() => {
    supabaseStub.auth.getUser.mockReset();
    supabaseStub.auth.mfa.getAuthenticatorAssuranceLevel.mockReset();
    supabaseStub.from.mockReset();
    // Env vars are loaded by tests/setup/loadEnv.ts at suite startup
    // (NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_ANON_KEY from
    // .env.local). enforceMfa returns null early if either is missing,
    // which would falsely make a "no redirect" assertion pass — assert
    // they are set so the test exercises the real wiring.
    expect(process.env.NEXT_PUBLIC_SUPABASE_URL).toBeTruthy();
    expect(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY).toBeTruthy();
  });

  it('aal1 + mfa_required=true + org-scoped path → 307 redirect to mfa-enroll', async () => {
    configureSupabase({
      user: { id: TEST_USER_ID },
      mfaRequired: true,
      aal: 'aal1',
    });
    const middleware = (await import('../../middleware')).default;
    const req = new NextRequest(`http://localhost:3000/en/${TEST_ORG_ID}/dashboard`);

    const res = await middleware(req);

    expect(res?.status).toBe(307);
    expect(res?.headers.get('location')).toContain('/en/mfa-enroll');
  });

  it('aal2 + mfa_required=true + org-scoped path → pass-through (no MFA redirect)', async () => {
    configureSupabase({
      user: { id: TEST_USER_ID },
      mfaRequired: true,
      aal: 'aal2',
    });
    const middleware = (await import('../../middleware')).default;
    const req = new NextRequest(`http://localhost:3000/en/${TEST_ORG_ID}/dashboard`);

    const res = await middleware(req);

    expect(res?.headers.get('location') ?? '').not.toContain('/mfa-enroll');
  });

  it('aal1 + mfa_required=false + org-scoped path → pass-through (no redirect)', async () => {
    // Regression-hole closer: ensures middleware does not unconditionally
    // redirect on aal1; it only redirects when the org actually requires MFA.
    configureSupabase({
      user: { id: TEST_USER_ID },
      mfaRequired: false,
      aal: 'aal1',
    });
    const middleware = (await import('../../middleware')).default;
    const req = new NextRequest(`http://localhost:3000/en/${TEST_ORG_ID}/dashboard`);

    const res = await middleware(req);

    expect(res?.headers.get('location') ?? '').not.toContain('/mfa-enroll');
  });

  it('non-org-scoped path → enforceMfa skipped (no redirect)', async () => {
    configureSupabase({
      user: { id: TEST_USER_ID },
      mfaRequired: true,
      aal: 'aal1',
    });
    const middleware = (await import('../../middleware')).default;
    const req = new NextRequest('http://localhost:3000/en/sign-in');

    const res = await middleware(req);

    expect(res?.headers.get('location') ?? '').not.toContain('/mfa-enroll');
  });
});
