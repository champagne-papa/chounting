// src/services/org/membershipService.ts
//
// INV-SERVICE-001 export contract: plain unwrapped functions.
// Mutating functions wrapped at the route layer via withInvariants.
// Authorization: route handler specifies the ActionName; this file
// does not enforce permissions. See docs/04_engineering/conventions.md
// Phase 1.5A Conventions for the permission-key namespace split.
//
// Phase 1.5B extensions: changeUserRole, suspendUser, reactivateUser,
// removeUser, listOrgUsers. is_org_owner protection rules enforced
// here (not in DB CHECKs, except membership_owner_must_be_controller).

import { adminClient } from '@/db/adminClient';
import type { ServiceContext } from '@/services/middleware/serviceContext';
import { loggerWith } from '@/shared/logger/pino';
import { ServiceError } from '@/services/errors/ServiceError';
import { recordMutation } from '@/services/audit/recordMutation';

export const membershipService = {
  // withInvariants: skip-org-check (pattern-H: dead code; remove in Phase 2 cleanup)
  async listForUser(
    input: { user_id: string },
    ctx: ServiceContext,
  ) {
    const log = loggerWith({ trace_id: ctx.trace_id, user_id: ctx.caller.user_id });
    const db = adminClient();

    const { data, error } = await db
      .from('memberships')
      .select('org_id, role, is_org_owner, organizations(name)')
      .eq('user_id', input.user_id)
      .eq('status', 'active');

    if (error) {
      log.error({ error }, 'Failed to list memberships for user');
      return [];
    }
    return data ?? [];
  },

  // withInvariants: skip-org-check (pattern-B: route-handler-wrapped via withInvariants(action: 'user.role.change'))
  async changeUserRole(
    input: { org_id: string; user_id: string; new_role: string },
    ctx: ServiceContext,
  ) {
    const log = loggerWith({ trace_id: ctx.trace_id, user_id: ctx.caller.user_id });
    const db = adminClient();

    const { data: membership } = await db
      .from('memberships')
      .select('*')
      .eq('org_id', input.org_id)
      .eq('user_id', input.user_id)
      .eq('status', 'active')
      .maybeSingle();

    if (!membership) {
      throw new ServiceError('MEMBERSHIP_NOT_FOUND', `No active membership for user_id=${input.user_id} in org_id=${input.org_id}`);
    }

    if (membership.is_org_owner && input.new_role !== 'controller') {
      throw new ServiceError('OWNER_ROLE_CHANGE_DENIED', 'Cannot change org owner role away from controller. Transfer ownership first.');
    }

    // Cutover window: write both role (legacy enum) and role_id (new FK).
    const { data: newRoleRow, error: roleErr } = await db
      .from('roles')
      .select('role_id')
      .eq('role_key', input.new_role)
      .eq('is_system', true)
      .single();
    if (roleErr || !newRoleRow) {
      throw new ServiceError('MEMBERSHIP_NOT_FOUND', `No system role found for role_key=${input.new_role}`);
    }

    const { error } = await db
      .from('memberships')
      .update({ role: input.new_role, role_id: newRoleRow.role_id })
      .eq('membership_id', membership.membership_id);

    if (error) throw new ServiceError('MEMBERSHIP_NOT_FOUND', error.message);

    await recordMutation(db, ctx, {
      org_id: input.org_id,
      action: 'user.role_changed',
      entity_type: 'membership',
      entity_id: membership.membership_id as string,
      before_state: membership as Record<string, unknown>,
    });

    log.info({ org_id: input.org_id, user_id: input.user_id, new_role: input.new_role }, 'User role changed');
    return { membership_id: membership.membership_id as string };
  },

  // withInvariants: skip-org-check (pattern-B: route-handler-wrapped via withInvariants(action: 'user.suspend'))
  async suspendUser(
    input: { org_id: string; user_id: string },
    ctx: ServiceContext,
  ) {
    const log = loggerWith({ trace_id: ctx.trace_id, user_id: ctx.caller.user_id });
    const db = adminClient();

    const { data: membership } = await db
      .from('memberships')
      .select('*')
      .eq('org_id', input.org_id)
      .eq('user_id', input.user_id)
      .eq('status', 'active')
      .maybeSingle();

    if (!membership) {
      throw new ServiceError('MEMBERSHIP_NOT_FOUND', `No active membership for user_id=${input.user_id}`);
    }

    if (membership.is_org_owner) {
      throw new ServiceError('OWNER_CANNOT_BE_SUSPENDED', 'Cannot suspend the org owner');
    }

    const { error } = await db
      .from('memberships')
      .update({
        status: 'suspended',
        suspended_at: new Date().toISOString(),
        suspended_by: ctx.caller.user_id,
      })
      .eq('membership_id', membership.membership_id);

    if (error) throw new ServiceError('MEMBERSHIP_NOT_FOUND', error.message);

    await recordMutation(db, ctx, {
      org_id: input.org_id,
      action: 'user.suspended',
      entity_type: 'membership',
      entity_id: membership.membership_id as string,
      before_state: membership as Record<string, unknown>,
    });

    log.info({ org_id: input.org_id, user_id: input.user_id }, 'User suspended');
    return { membership_id: membership.membership_id as string };
  },

  // withInvariants: skip-org-check (pattern-B: route-handler-wrapped via withInvariants(action: 'user.suspend' — substrate-bug per closeout NOTE; route-vs-action-string mismatch flagged for separate fix))
  async reactivateUser(
    input: { org_id: string; user_id: string },
    ctx: ServiceContext,
  ) {
    const log = loggerWith({ trace_id: ctx.trace_id, user_id: ctx.caller.user_id });
    const db = adminClient();

    const { data: membership } = await db
      .from('memberships')
      .select('*')
      .eq('org_id', input.org_id)
      .eq('user_id', input.user_id)
      .eq('status', 'suspended')
      .maybeSingle();

    if (!membership) {
      throw new ServiceError('MEMBERSHIP_NOT_SUSPENDED', `No suspended membership for user_id=${input.user_id}`);
    }

    const { error } = await db
      .from('memberships')
      .update({
        status: 'active',
        suspended_at: null,
        suspended_by: null,
      })
      .eq('membership_id', membership.membership_id);

    if (error) throw new ServiceError('MEMBERSHIP_NOT_FOUND', error.message);

    await recordMutation(db, ctx, {
      org_id: input.org_id,
      action: 'user.reactivated',
      entity_type: 'membership',
      entity_id: membership.membership_id as string,
      before_state: membership as Record<string, unknown>,
    });

    log.info({ org_id: input.org_id, user_id: input.user_id }, 'User reactivated');
    return { membership_id: membership.membership_id as string };
  },

  // withInvariants: skip-org-check (pattern-B: route-handler-wrapped via withInvariants(action: 'user.remove'))
  async removeUser(
    input: { org_id: string; user_id: string },
    ctx: ServiceContext,
  ) {
    const log = loggerWith({ trace_id: ctx.trace_id, user_id: ctx.caller.user_id });
    const db = adminClient();

    const { data: membership } = await db
      .from('memberships')
      .select('*')
      .eq('org_id', input.org_id)
      .eq('user_id', input.user_id)
      .in('status', ['active', 'suspended'])
      .maybeSingle();

    if (!membership) {
      throw new ServiceError('MEMBERSHIP_NOT_FOUND', `No active/suspended membership for user_id=${input.user_id}`);
    }

    if (membership.is_org_owner) {
      throw new ServiceError('OWNER_CANNOT_BE_REMOVED', 'Cannot remove the org owner. Transfer ownership first.');
    }

    const { error } = await db
      .from('memberships')
      .update({
        status: 'removed',
        removed_at: new Date().toISOString(),
        removed_by: ctx.caller.user_id,
      })
      .eq('membership_id', membership.membership_id);

    if (error) throw new ServiceError('MEMBERSHIP_NOT_FOUND', error.message);

    await recordMutation(db, ctx, {
      org_id: input.org_id,
      action: 'user.removed',
      entity_type: 'membership',
      entity_id: membership.membership_id as string,
      before_state: membership as Record<string, unknown>,
    });

    log.info({ org_id: input.org_id, user_id: input.user_id }, 'User removed');
    return { membership_id: membership.membership_id as string };
  },

  /**
   * Lists users in an org with their memberships and profile data.
   * NOT withInvariants-wrapped — read-only; service uses adminClient
   * and bypasses RLS. Authorization is enforced at the route handler
   * via an explicit caller.org_ids.includes(orgId) check that returns
   * 403 ORG_ACCESS_DENIED on cross-org access. (S30 hot-fix;
   * element #6 G1 Variant γ closure.)
   */
  // withInvariants: skip-org-check (pattern-G1: route-handler-gated via caller.org_ids.includes(orgId) check; not withInvariants-wrapped per S30 hot-fix arc c617f58 + 5d58b36, OQ-07 resolved-decision integrity)
  async listOrgUsers(
    input: { org_id: string },
    _ctx: ServiceContext,
  ) {
    const db = adminClient();
    const { data, error } = await db
      .from('memberships')
      .select('membership_id, user_id, org_id, role, status, is_org_owner, created_at')
      .eq('org_id', input.org_id)
      .in('status', ['active', 'suspended'])
      .order('created_at');

    if (error) throw new ServiceError('READ_FAILED', error.message);

    // Join user_profiles separately — PostgREST FK inference requires
    // both tables to share a column name, which memberships.user_id and
    // user_profiles.user_id do, but the supabase-js client doesn't
    // always infer cross-table embeds correctly when there are multiple
    // FKs from the same column. Manual join is more reliable.
    const userIds = (data ?? []).map((m: { user_id: string }) => m.user_id);
    const { data: profiles } = await db
      .from('user_profiles')
      .select('user_id, first_name, last_name, display_name, avatar_storage_path, preferred_locale, preferred_timezone, last_login_at')
      .in('user_id', userIds);

    const profileMap = new Map(
      (profiles ?? []).map((p: { user_id: string }) => [p.user_id, p]),
    );

    const users = (data ?? []).map((m: Record<string, unknown>) => ({
      ...m,
      user_profiles: profileMap.get(m.user_id as string) ?? null,
    }));

    return { users };
  },
};
