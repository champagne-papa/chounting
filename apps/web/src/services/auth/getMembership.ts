// src/services/auth/getMembership.ts
// Looks up a user's membership (and role) in a specific org.
// Used by canUserPerformAction and test helpers.

import { adminClient } from '@/db/adminClient';
import type { UserRole } from './canUserPerformAction';

export interface Membership {
  user_id: string;
  org_id: string;
  role: UserRole;
  role_id: string;
}

/**
 * Returns the membership record for a user in an org, or null if none exists.
 * Uses the service-role client (bypasses RLS) because this is called from
 * the service middleware layer before the request reaches RLS-scoped queries.
 */
export async function getMembership(
  userId: string,
  orgId: string,
): Promise<Membership | null> {
  const db = adminClient();

  const { data, error } = await db
    .from('memberships')
    .select('user_id, org_id, role, role_id')
    .eq('user_id', userId)
    .eq('org_id', orgId)
    .eq('status', 'active')
    .maybeSingle();

  if (error || !data) return null;

  return {
    user_id: data.user_id,
    org_id: data.org_id,
    role: data.role as UserRole,
    role_id: data.role_id as string,
  };
}
