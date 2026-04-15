// src/services/auth/canUserPerformAction.ts
// INV-AUTH-001 (permission source): the role-action matrix below is the authoritative Phase 1.1 permission source. Called by withInvariants() pre-flight Invariant 4.
// Authorization check: given a caller's role in an org, can they perform
// a specific action? Called by withInvariants() as a pre-flight gate.
//
// Role hierarchy (Phase 1.1):
//   controller    — full access (all actions)
//   ap_specialist — post journal entries, read chart of accounts
//   executive     — read-only across the board

import type { ServiceContext } from '@/services/middleware/serviceContext';
import { adminClient } from '@/db/adminClient';

export type ActionName =
  | 'journal_entry.post'
  | 'chart_of_accounts.read'
  | 'chart_of_accounts.write'
  | 'period.lock'
  | 'org.create'
  | 'audit_log.read'
  | 'ai_actions.read'
  // Phase 1.5A — org profile + addresses (controller-only)
  | 'org.profile_updated'
  | 'org.address_added'
  | 'org.address_updated'
  | 'org.address_removed'
  | 'org.address_primary_changed';

export type UserRole = 'executive' | 'controller' | 'ap_specialist';

export interface AuthorizationResult {
  permitted: boolean;
  reason: string;
}

// Which actions each role is allowed to perform.
const ROLE_PERMISSIONS: Record<UserRole, ReadonlySet<ActionName>> = {
  controller: new Set<ActionName>([
    'journal_entry.post',
    'chart_of_accounts.read',
    'chart_of_accounts.write',
    'period.lock',
    'org.create',
    'audit_log.read',
    'ai_actions.read',
    // Phase 1.5A — controller-only profile + address mutations
    'org.profile_updated',
    'org.address_added',
    'org.address_updated',
    'org.address_removed',
    'org.address_primary_changed',
  ]),
  ap_specialist: new Set<ActionName>([
    'journal_entry.post',
    'chart_of_accounts.read',
    'ai_actions.read',
  ]),
  executive: new Set<ActionName>([
    'chart_of_accounts.read',
    'audit_log.read',
    'ai_actions.read',
  ]),
};

/**
 * Checks whether the caller in the given ServiceContext is permitted to
 * perform `action` against `orgId`. Looks up the caller's role in the
 * memberships table, then checks the static permission map.
 *
 * Returns a typed result — never throws for a "not permitted" case.
 * The caller (withInvariants) decides whether to throw.
 */
export async function canUserPerformAction(
  ctx: ServiceContext,
  action: ActionName,
  orgId: string,
): Promise<AuthorizationResult> {
  const db = adminClient();

  const { data: membership, error } = await db
    .from('memberships')
    .select('role')
    .eq('user_id', ctx.caller.user_id)
    .eq('org_id', orgId)
    .maybeSingle();

  if (error) {
    return { permitted: false, reason: `Membership lookup failed: ${error.message}` };
  }

  if (!membership) {
    return { permitted: false, reason: `No membership for user in org_id=${orgId}` };
  }

  const role = membership.role as UserRole;
  const allowedActions = ROLE_PERMISSIONS[role];

  if (!allowedActions) {
    return { permitted: false, reason: `Unknown role: ${role}` };
  }

  if (!allowedActions.has(action)) {
    return {
      permitted: false,
      reason: `Role '${role}' is not permitted to perform '${action}'`,
    };
  }

  return { permitted: true, reason: 'ok' };
}
