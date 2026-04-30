// tests/integration/inviteRevokeReinvite.test.ts
// CA-18: Revoke flips status; re-invite same email creates new pending.

import { describe, it, expect, afterAll } from 'vitest';
import { adminClient, SEED } from '../setup/testDb';
import { invitationService } from '@/services/org/invitationService';
import type { ServiceContext } from '@/services/middleware/serviceContext';

describe('CA-18: invite → revoke → re-invite', () => {
  const db = adminClient();
  const traceId = crypto.randomUUID();
  const ctx: ServiceContext = {
    trace_id: traceId,
    caller: { verified: true, user_id: SEED.USER_CONTROLLER, email: 'controller@thebridge.local', org_ids: [SEED.ORG_HOLDING, SEED.ORG_REAL_ESTATE] },
    locale: 'en',
  };
  const email = 'revoke-test@thebridge.local';
  const createdIds: string[] = [];

  afterAll(async () => {
    for (const id of createdIds) {
      await db.from('org_invitations').delete().eq('invitation_id', id);
    }
    await db.from('audit_log').delete().eq('trace_id', traceId);
  });

  it('revokes a pending invitation, then re-invites same email', async () => {
    const invite1 = await invitationService.inviteUser(
      { org_id: SEED.ORG_HOLDING, email, role: 'ap_specialist' },
      ctx,
    );
    createdIds.push(invite1.invitation_id);

    await invitationService.revokeInvitation(
      { org_id: SEED.ORG_HOLDING, invitation_id: invite1.invitation_id },
      ctx,
    );

    const { data: revoked } = await db
      .from('org_invitations')
      .select('status')
      .eq('invitation_id', invite1.invitation_id)
      .single();
    expect(revoked!.status).toBe('revoked');

    const invite2 = await invitationService.inviteUser(
      { org_id: SEED.ORG_HOLDING, email, role: 'controller' },
      ctx,
    );
    createdIds.push(invite2.invitation_id);

    const { data: pending } = await db
      .from('org_invitations')
      .select('status, role')
      .eq('invitation_id', invite2.invitation_id)
      .single();
    expect(pending!.status).toBe('pending');
    expect(pending!.role).toBe('controller');
  });
});
