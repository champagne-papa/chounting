// tests/integration/orgUsersViewInvite.test.ts
// CA-78: Phase 1.2 Session 6 — OrgUsersView inline invite flow.
// The invite form POSTs to /api/orgs/[orgId]/invitations, which
// calls invitationService.inviteUser under withInvariants. On
// success the response carries a composite token that the view
// surfaces in a readonly text input. This test exercises the
// service call the form triggers.
//
// CA-16 in inviteAcceptFlow.test.ts already covers the full
// invite → accept lifecycle; CA-78 is scoped to the Session 6
// UI-surface-level contract: role selection, email lowercasing,
// token-returned shape.

import { describe, it, expect, afterAll } from 'vitest';
import { adminClient, SEED } from '../setup/testDb';
import { invitationService } from '@/services/org/invitationService';
import type { ServiceContext } from '@/services/middleware/serviceContext';

describe('CA-78: OrgUsersView invite flow — inviteUser', () => {
  const db = adminClient();
  const traceId = crypto.randomUUID();
  const ctx: ServiceContext = {
    trace_id: traceId,
    caller: {
      verified: true,
      user_id: SEED.USER_CONTROLLER,
      email: 'controller@thebridge.local',
      org_ids: [SEED.ORG_HOLDING],
    },
    locale: 'en',
  };

  const testEmails: string[] = [];

  afterAll(async () => {
    if (testEmails.length > 0) {
      await db
        .from('org_invitations')
        .delete()
        .eq('org_id', SEED.ORG_HOLDING)
        .in('invited_email', testEmails);
    }
    await db.from('audit_log').delete().eq('trace_id', traceId);
  });

  it('invite form submission returns { invitation_id, token } with ":" separator', async () => {
    const email = 'ca78-invite-a@thebridge.local';
    testEmails.push(email);
    const result = await invitationService.inviteUser(
      { org_id: SEED.ORG_HOLDING, email, role: 'ap_specialist' },
      ctx,
    );
    expect(result.invitation_id).toBeTruthy();
    expect(result.token).toContain(':');
    // Token shape is {invitation_id}:{random_hex} — the prefix
    // must match the invitation_id (what the view displays for copy).
    expect(result.token.split(':')[0]).toBe(result.invitation_id);
  });

  it('invitation row stores bcrypt hash, not the plaintext token', async () => {
    const email = 'ca78-invite-b@thebridge.local';
    testEmails.push(email);
    const result = await invitationService.inviteUser(
      { org_id: SEED.ORG_HOLDING, email, role: 'executive' },
      ctx,
    );
    const { data } = await db
      .from('org_invitations')
      .select('token_hash, role, invited_email, status')
      .eq('invitation_id', result.invitation_id)
      .single();
    expect(data!.status).toBe('pending');
    expect(data!.role).toBe('executive');
    expect(data!.invited_email).toBe(email.toLowerCase());
    expect(data!.token_hash).toBeTruthy();
    expect(data!.token_hash).not.toBe(result.token);
  });

  it('email is normalized to lowercase on invite', async () => {
    const email = 'CA78-Invite-MixedCase@ThebRidge.Local';
    testEmails.push(email.toLowerCase());
    const result = await invitationService.inviteUser(
      { org_id: SEED.ORG_HOLDING, email, role: 'controller' },
      ctx,
    );
    const { data } = await db
      .from('org_invitations')
      .select('invited_email')
      .eq('invitation_id', result.invitation_id)
      .single();
    expect(data!.invited_email).toBe(email.toLowerCase());
  });

  it('rejects a duplicate pending invitation for the same email', async () => {
    const email = 'ca78-invite-dup@thebridge.local';
    testEmails.push(email);
    await invitationService.inviteUser(
      { org_id: SEED.ORG_HOLDING, email, role: 'ap_specialist' },
      ctx,
    );
    await expect(
      invitationService.inviteUser(
        { org_id: SEED.ORG_HOLDING, email, role: 'ap_specialist' },
        ctx,
      ),
    ).rejects.toThrow(/INVITATION_ALREADY_PENDING/);
  });
});
