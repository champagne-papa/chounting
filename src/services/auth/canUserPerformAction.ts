// src/services/auth/canUserPerformAction.ts
// INV-AUTH-001 (permission source): the permissions table + role_permissions
// join are the authoritative permission source as of Phase 1.5C. Called by
// withInvariants() pre-flight Invariant 4.
//
// Phase 1.5C rewrite: replaced the ROLE_PERMISSIONS TypeScript map with
// a two-query SQL lookup against role_permissions. Same signature, same
// behavior, same return type. Every existing withInvariants call site
// works unchanged.
//
// Convention: ACTION_NAMES is the runtime constant array that the
// ActionName type derives from. A parity test (CA-27) asserts
// set-equality between ACTION_NAMES and the permissions table.
// Adding a new permission requires updating ACTION_NAMES AND seeding
// a permissions row in a migration.

import type { ServiceContext } from '@/services/middleware/serviceContext';
import { adminClient } from '@/db/adminClient';

export const ACTION_NAMES = [
  'journal_entry.post',
  'journal_entry.adjust',
  'chart_of_accounts.read',
  'chart_of_accounts.write',
  'period.lock',
  'period.unlock',
  'org.create',
  'audit_log.read',
  'ai_actions.read',
  'org.profile.update',
  'org.address.create',
  'org.address.update',
  'org.address.delete',
  'org.address.set_primary',
  'user.invite',
  'user.role.change',
  'user.suspend',
  'user.remove',
  'user.profile.update',
  // Recurring journals (Phase 0-1.1 Arc A Step 10)
  'recurring_template.create',
  'recurring_template.update',
  'recurring_template.deactivate',
  'recurring_run.generate',
  'recurring_run.approve',
  'recurring_run.reject',
] as const;

export type ActionName = typeof ACTION_NAMES[number];

export type UserRole = 'executive' | 'controller' | 'ap_specialist';

export interface AuthorizationResult {
  permitted: boolean;
  reason: string;
}

export async function canUserPerformAction(
  ctx: ServiceContext,
  action: ActionName,
  orgId: string,
): Promise<AuthorizationResult> {
  // Adjustment 2: short-circuit when the org isn't in the caller's
  // active membership set. ctx.caller.org_ids is populated by
  // buildServiceContext from memberships WHERE status = 'active'.
  if (ctx.caller.org_ids && !ctx.caller.org_ids.includes(orgId)) {
    return { permitted: false, reason: `User has no membership in org_id=${orgId}` };
  }

  const db = adminClient();

  // Query 1: look up the caller's active membership to get role_id.
  const { data: membership, error: memErr } = await db
    .from('memberships')
    .select('role_id')
    .eq('user_id', ctx.caller.user_id)
    .eq('org_id', orgId)
    .eq('status', 'active')
    .maybeSingle();

  if (memErr) {
    return { permitted: false, reason: `Membership lookup failed: ${memErr.message}` };
  }

  if (!membership) {
    return { permitted: false, reason: `No membership for user in org_id=${orgId}` };
  }

  // Query 2: check if the role has the requested permission.
  const { data: perm, error: permErr } = await db
    .from('role_permissions')
    .select('permission_key')
    .eq('role_id', membership.role_id)
    .eq('permission_key', action)
    .maybeSingle();

  if (permErr) {
    return { permitted: false, reason: `Permission lookup failed: ${permErr.message}` };
  }

  if (!perm) {
    return {
      permitted: false,
      reason: `Role does not have permission '${action}'`,
    };
  }

  return { permitted: true, reason: 'ok' };
}
