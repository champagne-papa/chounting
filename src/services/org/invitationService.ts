// src/services/org/invitationService.ts
//
// INV-SERVICE-001 export contract: plain unwrapped functions.
// Mutating functions are wrapped at the route layer via
// withInvariants({ action: 'user.invite' }). This file does NOT
// enforce permissions; the wrapper does.
//
// Token flow (OQ-02 RESOLVED): composite format
// {invitation_id}:{random_hex}. Only bcrypt hash stored. On accept:
// split on ':', PK lookup, bcrypt-compare.

import { randomBytes } from 'node:crypto';
import bcryptjs from 'bcryptjs';
import { adminClient } from '@/db/adminClient';
import type { ServiceContext } from '@/services/middleware/serviceContext';
import { loggerWith } from '@/shared/logger/pino';
import { ServiceError } from '@/services/errors/ServiceError';
import { recordMutation } from '@/services/audit/recordMutation';

export const invitationService = {
  async inviteUser(
    input: { org_id: string; email: string; role: string },
    ctx: ServiceContext,
  ) {
    const email = input.email.toLowerCase();
    const log = loggerWith({ trace_id: ctx.trace_id, user_id: ctx.caller.user_id });
    const db = adminClient();

    // Check if the invitee is already an active member of this org.
    // Look up the user by email via Supabase admin API, then check
    // for an active membership in the target org.
    const { data: { users: matchingUsers } } = await db.auth.admin.listUsers();
    const inviteeAuth = (matchingUsers ?? []).find(
      (u: { email?: string }) => u.email?.toLowerCase() === email,
    );
    if (inviteeAuth) {
      const { data: activeMembership } = await db
        .from('memberships')
        .select('membership_id')
        .eq('user_id', inviteeAuth.id)
        .eq('org_id', input.org_id)
        .eq('status', 'active')
        .maybeSingle();
      if (activeMembership) {
        throw new ServiceError('USER_ALREADY_MEMBER', `${email} is already an active member of this org`);
      }
    }

    // Check for existing pending invitation
    const { data: existingInvite } = await db
      .from('org_invitations')
      .select('invitation_id')
      .eq('org_id', input.org_id)
      .eq('invited_email', email)
      .eq('status', 'pending')
      .maybeSingle();

    if (existingInvite) {
      throw new ServiceError('INVITATION_ALREADY_PENDING', `Pending invitation already exists for ${email}`);
    }

    // Generate composite token: {invitation_id}:{random}
    const invitationId = crypto.randomUUID();
    const randomHex = randomBytes(32).toString('hex');
    const compositeToken = `${invitationId}:${randomHex}`;
    const tokenHash = await bcryptjs.hash(compositeToken, 10);

    const { error: invErr } = await db.from('org_invitations').insert({
      invitation_id: invitationId,
      org_id: input.org_id,
      invited_email: email,
      invited_by_user_id: ctx.caller.user_id,
      role: input.role,
      token_hash: tokenHash,
    });

    if (invErr) {
      throw new ServiceError('INVITATION_WRITE_FAILED', invErr.message);
    }

    // The invitee's membership is created during acceptInvitation,
    // not here — the invitee may not have an auth account yet.

    await recordMutation(db, ctx, {
      org_id: input.org_id,
      action: 'user.invited',
      entity_type: 'org_invitation',
      entity_id: invitationId,
      before_state: undefined,
    });

    log.info({ org_id: input.org_id, email, invitation_id: invitationId }, 'User invited');
    return { invitation_id: invitationId, token: compositeToken };
  },

  async acceptInvitation(
    input: { token: string },
    ctx: ServiceContext,
  ) {
    const log = loggerWith({ trace_id: ctx.trace_id, user_id: ctx.caller.user_id });
    const db = adminClient();

    // Split token on first ':' to extract invitation_id.
    const colonIdx = input.token.indexOf(':');
    if (colonIdx === -1) {
      throw new ServiceError('INVITATION_INVALID_OR_EXPIRED', 'Malformed token');
    }
    const invitationId = input.token.substring(0, colonIdx);

    // PK lookup + status/expiry filter.
    const { data: invitation, error: lookupErr } = await db
      .from('org_invitations')
      .select('*')
      .eq('invitation_id', invitationId)
      .eq('status', 'pending')
      .gt('expires_at', new Date().toISOString())
      .maybeSingle();

    if (lookupErr || !invitation) {
      throw new ServiceError('INVITATION_INVALID_OR_EXPIRED', 'Invitation not found, expired, or already used');
    }

    // Bcrypt-compare full token against stored hash.
    const match = await bcryptjs.compare(input.token, invitation.token_hash);
    if (!match) {
      throw new ServiceError('INVITATION_INVALID_OR_EXPIRED', 'Token mismatch');
    }

    // Verify the invitation is for this user's email.
    const callerEmail = ctx.caller.email.toLowerCase();
    if (invitation.invited_email !== callerEmail) {
      throw new ServiceError('INVITATION_INVALID_OR_EXPIRED', 'Invitation is for a different email');
    }

    // Mark invitation accepted.
    const { error: updateErr } = await db
      .from('org_invitations')
      .update({
        status: 'accepted',
        accepted_at: new Date().toISOString(),
        accepted_by_user_id: ctx.caller.user_id,
      })
      .eq('invitation_id', invitationId);

    if (updateErr) {
      throw new ServiceError('INVITATION_WRITE_FAILED', updateErr.message);
    }

    // Create active membership for the acceptor.
    // Cutover window: write both role (legacy enum) and role_id (new FK).
    const { data: roleRow } = await db
      .from('roles')
      .select('role_id')
      .eq('role_key', invitation.role)
      .eq('is_system', true)
      .single();
    if (!roleRow) {
      throw new ServiceError('INVITATION_WRITE_FAILED', `No system role found for role_key=${invitation.role}`);
    }

    const { data: membership, error: memErr } = await db
      .from('memberships')
      .insert({
        user_id: ctx.caller.user_id,
        org_id: invitation.org_id,
        role: invitation.role,
        role_id: roleRow.role_id,
        status: 'active',
        invited_via: invitationId,
      })
      .select('membership_id')
      .single();

    if (memErr || !membership) {
      throw new ServiceError('INVITATION_WRITE_FAILED', memErr?.message ?? 'Membership creation failed');
    }

    await recordMutation(db, ctx, {
      org_id: invitation.org_id as string,
      action: 'user.invitation_accepted',
      entity_type: 'org_invitation',
      entity_id: invitationId,
      before_state: invitation as Record<string, unknown>,
    });

    log.info({ org_id: invitation.org_id, invitation_id: invitationId, user_id: ctx.caller.user_id }, 'Invitation accepted');
    return { org_id: invitation.org_id as string, membership_id: membership.membership_id as string };
  },

  async revokeInvitation(
    input: { org_id: string; invitation_id: string },
    ctx: ServiceContext,
  ) {
    const log = loggerWith({ trace_id: ctx.trace_id, user_id: ctx.caller.user_id });
    const db = adminClient();

    const { data: invitation } = await db
      .from('org_invitations')
      .select('*')
      .eq('invitation_id', input.invitation_id)
      .eq('org_id', input.org_id)
      .eq('status', 'pending')
      .maybeSingle();

    if (!invitation) {
      throw new ServiceError('INVITATION_NOT_FOUND', `invitation_id=${input.invitation_id}`);
    }

    const { error } = await db
      .from('org_invitations')
      .update({ status: 'revoked' })
      .eq('invitation_id', input.invitation_id);

    if (error) throw new ServiceError('INVITATION_WRITE_FAILED', error.message);

    await recordMutation(db, ctx, {
      org_id: input.org_id,
      action: 'user.invitation_revoked',
      entity_type: 'org_invitation',
      entity_id: input.invitation_id,
      before_state: invitation as Record<string, unknown>,
    });

    log.info({ org_id: input.org_id, invitation_id: input.invitation_id }, 'Invitation revoked');
    return { invitation_id: input.invitation_id };
  },

  async resendInvitation(
    input: { org_id: string; invitation_id: string },
    ctx: ServiceContext,
  ) {
    const db = adminClient();

    const { data: invitation } = await db
      .from('org_invitations')
      .select('invitation_id')
      .eq('invitation_id', input.invitation_id)
      .eq('org_id', input.org_id)
      .eq('status', 'pending')
      .maybeSingle();

    if (!invitation) {
      throw new ServiceError('INVITATION_NOT_FOUND', `invitation_id=${input.invitation_id}`);
    }

    const randomHex = randomBytes(32).toString('hex');
    const compositeToken = `${input.invitation_id}:${randomHex}`;
    const tokenHash = await bcryptjs.hash(compositeToken, 10);

    const { error } = await db
      .from('org_invitations')
      .update({
        token_hash: tokenHash,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      })
      .eq('invitation_id', input.invitation_id);

    if (error) throw new ServiceError('INVITATION_WRITE_FAILED', error.message);

    return { invitation_id: input.invitation_id, token: compositeToken };
  },

  async listPendingInvitations(
    input: { org_id: string },
    _ctx: ServiceContext,
  ) {
    const db = adminClient();
    const { data, error } = await db
      .from('org_invitations')
      .select('*')
      .eq('org_id', input.org_id)
      .eq('status', 'pending')
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false });

    if (error) throw new ServiceError('READ_FAILED', error.message);
    return { invitations: data ?? [] };
  },
};
