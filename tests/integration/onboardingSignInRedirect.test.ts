// tests/integration/onboardingSignInRedirect.test.ts
// CA-73: sign-in redirect decision logic. Tests the pure
// resolveSignInDestination helper directly (Pre-decision 7 floor,
// sub-brief §6.8 extraction rationale — pure function rather
// than browser-flow simulation).

import { describe, it, expect } from 'vitest';
import { resolveSignInDestination } from '@/services/auth/resolveSignInDestination';

describe('CA-73: sign-in destination resolver', () => {
  it('zero memberships → /welcome (new user)', () => {
    expect(resolveSignInDestination('en', [], 'Alex')).toBe('/en/welcome');
    expect(resolveSignInDestination('en', [], null)).toBe('/en/welcome');
    expect(resolveSignInDestination('fr-CA', [], null)).toBe('/fr-CA/welcome');
  });

  it('membership exists but display_name null/empty → /welcome (invited user)', () => {
    expect(
      resolveSignInDestination(
        'en',
        [{ org_id: 'org-1', status: 'active' }],
        null,
      ),
    ).toBe('/en/welcome');
    expect(
      resolveSignInDestination(
        'en',
        [{ org_id: 'org-1', status: 'active' }],
        '',
      ),
    ).toBe('/en/welcome');
  });

  it('membership + display_name set → /[locale]/[firstOrgId] (existing user)', () => {
    expect(
      resolveSignInDestination(
        'en',
        [
          { org_id: 'org-1', status: 'active' },
          { org_id: 'org-2', status: 'active' },
        ],
        'Alex',
      ),
    ).toBe('/en/org-1');
    expect(
      resolveSignInDestination(
        'zh-Hant',
        [{ org_id: 'org-42', status: 'active' }],
        'User',
      ),
    ).toBe('/zh-Hant/org-42');
  });

  it('ignores non-active memberships when counting', () => {
    // User with only suspended/invited memberships and no profile
    // should still route to /welcome (no active membership).
    expect(
      resolveSignInDestination(
        'en',
        [
          { org_id: 'org-1', status: 'suspended' },
          { org_id: 'org-2', status: 'invited' },
        ],
        null,
      ),
    ).toBe('/en/welcome');
    // With display_name set, still /welcome — the first-org route
    // requires an ACTIVE membership.
    expect(
      resolveSignInDestination(
        'en',
        [{ org_id: 'org-1', status: 'suspended' }],
        'Alex',
      ),
    ).toBe('/en/welcome');
  });
});
