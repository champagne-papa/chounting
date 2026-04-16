// tests/integration/inviteAcceptFlow.test.ts
// CA-16: Full invite → accept lifecycle.
// CA-17: acceptInvitation rejects expired/revoked tokens.

import { describe, it, expect, afterAll } from 'vitest';
import { adminClient, SEED } from '../setup/testDb';
import { invitationService } from '@/services/org/invitationService';
import type { ServiceContext } from '@/services/middleware/serviceContext';

describe('CA-16/17: invite → accept flow', () => {
  const db = adminClient();
  const traceId = crypto.randomUUID();
  const controllerCtx: ServiceContext = {
    trace_id: traceId,
    caller: { verified: true, user_id: SEED.USER_CONTROLLER, email: 'controller@thebridge.local', org_ids: [SEED.ORG_HOLDING, SEED.ORG_REAL_ESTATE] },
    locale: 'en',
  };

  const inviteeEmail = 'invitee-test@thebridge.local';
  let savedToken = '';
  let savedInvitationId = '';

  afterAll(async () => {
    await db.from('memberships').delete().eq('invited_via', savedInvitationId);
    await db.from('org_invitations').delete().eq('invitation_id', savedInvitationId);
    await db.from('audit_log').delete().eq('trace_id', traceId);
  });

  it('CA-16: inviteUser creates invitation and returns plaintext token', async () => {
    const result = await invitationService.inviteUser(
      { org_id: SEED.ORG_HOLDING, email: inviteeEmail, role: 'ap_specialist' },
      controllerCtx,
    );

    expect(result.invitation_id).toBeTruthy();
    expect(result.token).toContain(':');
    savedToken = result.token;
    savedInvitationId = result.invitation_id;

    const { data: inv } = await db
      .from('org_invitations')
      .select('*')
      .eq('invitation_id', result.invitation_id)
      .single();

    expect(inv!.status).toBe('pending');
    expect(inv!.invited_email).toBe(inviteeEmail);
    expect(inv!.token_hash).toBeTruthy();
    expect(inv!.token_hash).not.toBe(result.token);
  });

  it('CA-16: acceptInvitation validates token and creates active membership', async () => {
    const acceptorCtx: ServiceContext = {
      trace_id: traceId,
      caller: { verified: true, user_id: SEED.USER_AP_SPECIALIST, email: inviteeEmail, org_ids: [] },
      locale: 'en',
    };

    const result = await invitationService.acceptInvitation(
      { token: savedToken },
      acceptorCtx,
    );

    expect(result.org_id).toBe(SEED.ORG_HOLDING);
    expect(result.membership_id).toBeTruthy();

    const { data: inv } = await db
      .from('org_invitations')
      .select('status, accepted_at, accepted_by_user_id')
      .eq('invitation_id', savedInvitationId)
      .single();
    expect(inv!.status).toBe('accepted');
    expect(inv!.accepted_at).toBeTruthy();
    expect(inv!.accepted_by_user_id).toBe(SEED.USER_AP_SPECIALIST);

    const { data: mem } = await db
      .from('memberships')
      .select('status, role, invited_via')
      .eq('membership_id', result.membership_id)
      .single();
    expect(mem!.status).toBe('active');
    expect(mem!.role).toBe('ap_specialist');
    expect(mem!.invited_via).toBe(savedInvitationId);
  });

  it('CA-17: rejects already-used token', async () => {
    const acceptorCtx: ServiceContext = {
      trace_id: traceId,
      caller: { verified: true, user_id: SEED.USER_AP_SPECIALIST, email: inviteeEmail, org_ids: [] },
      locale: 'en',
    };

    await expect(
      invitationService.acceptInvitation({ token: savedToken }, acceptorCtx),
    ).rejects.toThrow(/INVITATION_INVALID_OR_EXPIRED/);
  });

  it('CA-17: rejects malformed token', async () => {
    const ctx: ServiceContext = {
      trace_id: traceId,
      caller: { verified: true, user_id: SEED.USER_AP_SPECIALIST, email: inviteeEmail, org_ids: [] },
      locale: 'en',
    };

    await expect(
      invitationService.acceptInvitation({ token: 'no-colon-here' }, ctx),
    ).rejects.toThrow(/INVITATION_INVALID_OR_EXPIRED/);
  });
});
