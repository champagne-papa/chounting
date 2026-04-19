// src/services/auth/resolveSignInDestination.ts
// Phase 1.2 Session 5 / sub-brief §6.8 — post-sign-in
// destination resolver.
//
// Pure function so CA-73 can test the branching without
// simulating a browser flow. The sign-in page calls this after
// signInWithPassword succeeds and the two membership /
// user_profiles queries resolve.
//
// Rule (master §11.1):
//   - Zero active memberships → /welcome (new user, full
//     onboarding flow).
//   - Memberships exist but display_name is null → /welcome
//     (invited user, shortened flow — profile still needed).
//   - Memberships AND display_name set → /[firstOrgId]
//     (existing user, direct to their primary org).
//
// The "primary org" for a user with multiple memberships is the
// first one returned by the query (ordered by the caller). The
// sign-in page orders by membership.created_at ascending so
// long-standing members land on their earliest org.

export interface MembershipRef {
  org_id: string;
  status: string;
}

export function resolveSignInDestination(
  locale: string,
  memberships: MembershipRef[],
  displayName: string | null,
): string {
  const activeMemberships = memberships.filter((m) => m.status === 'active');

  // Onboarding trigger per master §11.1.
  if (activeMemberships.length === 0) {
    return `/${locale}/welcome`;
  }
  if (displayName === null || displayName.length === 0) {
    return `/${locale}/welcome`;
  }

  // Existing user — route to their first org.
  return `/${locale}/${activeMemberships[0].org_id}`;
}
