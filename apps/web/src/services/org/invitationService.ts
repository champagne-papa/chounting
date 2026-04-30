// src/services/org/invitationService.ts
//
// INV-SERVICE-001 export contract: mutating functions (inviteUser, revokeInvitation, resendInvitation) are
// route-handler-wrapped via withInvariants. Read function listPendingInvitations is route-handler-gated via
// explicit caller.org_ids.includes(orgId) check (S30 hot-fix; element #6 G1 Variant γ closure). Token-bearer
// functions (acceptInvitation, previewInvitationByToken) carry pattern-I skip-org-check annotations per S29a.
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
  // withInvariants: skip-org-check (pattern-B: route-handler-wrapped via withInvariants(action: 'user.invite'))
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

  // withInvariants: skip-org-check (pattern-I: token-bearer authorization, in-body validation)
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

  // withInvariants: skip-org-check (pattern-B: route-handler-wrapped via withInvariants(action: 'user.invite'))
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

  // withInvariants: skip-org-check (pattern-B: declared in INV-SERVICE-001 export contract; no current route-handler consumer; consumer expected in Phase 2 user-management surface)
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

  /**
   * Read-only preview of an invitation keyed by its composite token.
   * Used by the /invitations/accept server component to drive its
   * 5-state branching without mutating anything. Returns one of four
   * states; the caller (page.tsx) derives the email_mismatch fifth
   * state by comparing the returned `invitedEmail` against the
   * authenticated user's email. Separating concerns this way keeps
   * the service method reusable from contexts that don't have an
   * auth session (e.g., server-side rendering paths that need to
   * validate the token before attempting sign-in).
   *
   * No audit row — reads are not audited per Phase 1.5A convention.
   * Admin client is justified by the token-bearer auth pattern
   * already used in acceptInvitation: possession of a valid
   * composite token is the authorization signal.
   *
   * Context: this method was added during Session 6 execution as a
   * scope-consistent exception to the sub-brief's "no new service
   * functions" claim. See the session-start friction-journal entry
   * for the Convention #8 catch that produced it.
   */
  // withInvariants: skip-org-check (pattern-I: token-bearer authorization, in-body validation)
  async previewInvitationByToken(
    token: string,
  ): Promise<{
    state: 'pending' | 'invalid' | 'expired' | 'already_accepted';
    invitedEmail?: string;
    orgId?: string;
  }> {
    const db = adminClient();

    const colonIdx = token.indexOf(':');
    if (colonIdx === -1) {
      return { state: 'invalid' };
    }
    const invitationId = token.substring(0, colonIdx);

    const { data: invitation } = await db
      .from('org_invitations')
      .select('invitation_id, org_id, invited_email, status, expires_at, token_hash')
      .eq('invitation_id', invitationId)
      .maybeSingle();

    if (!invitation) {
      return { state: 'invalid' };
    }

    const match = await bcryptjs.compare(token, invitation.token_hash as string);
    if (!match) {
      return { state: 'invalid' };
    }

    if (invitation.status === 'revoked') {
      return { state: 'invalid' };
    }

    if (invitation.status === 'accepted') {
      return {
        state: 'already_accepted',
        orgId: invitation.org_id as string,
      };
    }

    // status === 'pending' — check expiry
    const now = new Date();
    const expiresAt = new Date(invitation.expires_at as string);
    if (expiresAt <= now) {
      return { state: 'expired' };
    }

    return {
      state: 'pending',
      invitedEmail: invitation.invited_email as string,
      orgId: invitation.org_id as string,
    };
  },

  /**
   * Lists pending invitations for an org. NOT withInvariants-wrapped
   * — read-only; service uses adminClient and bypasses RLS.
   * Authorization is enforced at the route handler via an explicit
   * caller.org_ids.includes(orgId) check that returns 403
   * ORG_ACCESS_DENIED on cross-org access. (S30 hot-fix; element #6
   * G1 Variant γ closure.)
   */
  // withInvariants: skip-org-check (pattern-G1: route-handler-gated via caller.org_ids.includes(orgId) check; not withInvariants-wrapped per S30 hot-fix arc c617f58 + 5d58b36, OQ-07 resolved-decision integrity)
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
