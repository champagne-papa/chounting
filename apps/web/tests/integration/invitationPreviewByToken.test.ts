// tests/integration/invitationPreviewByToken.test.ts
// CA-82: Phase 1.2 Session 6 — previewInvitationByToken state
// branching. Dedicated unit test for the service method added
// as Option A of the Convention #8 catch (see session-start
// friction-journal entry for context).
//
// Seven it-blocks cover each state the method can return plus
// the happy path:
//   1. Malformed token (no ':')     → 'invalid'
//   2. Unknown invitation_id        → 'invalid'
//   3. Wrong bcrypt hash            → 'invalid'
//   4. Revoked status               → 'invalid'
//   5. Expired (past expires_at)    → 'expired'
//   6. Accepted                     → 'already_accepted' + orgId
//   7. Valid pending                → 'pending' + invitedEmail + orgId

import { describe, it, expect, afterAll } from 'vitest';
import { randomBytes, randomUUID } from 'node:crypto';
import bcryptjs from 'bcryptjs';
import { adminClient, SEED } from '../setup/testDb';
import { invitationService } from '@/services/org/invitationService';

describe('CA-82: invitationService.previewInvitationByToken state branching', () => {
  const db = adminClient();
  const cleanupIds: string[] = [];

  async function seedInvitation(args: {
    status: 'pending' | 'accepted' | 'revoked';
    expiresAt?: Date;
    email?: string;
  }) {
    const invitationId = randomUUID();
    const randomHex = randomBytes(32).toString('hex');
    const compositeToken = `${invitationId}:${randomHex}`;
    const tokenHash = await bcryptjs.hash(compositeToken, 10);
    const expiresAt = args.expiresAt ?? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const email = args.email ?? `ca82-${invitationId.substring(0, 8)}@thebridge.local`;

    const row: Record<string, unknown> = {
      invitation_id: invitationId,
      org_id: SEED.ORG_HOLDING,
      invited_email: email,
      invited_by_user_id: SEED.USER_CONTROLLER,
      role: 'ap_specialist',
      token_hash: tokenHash,
      status: args.status,
      expires_at: expiresAt.toISOString(),
    };
    // invitation_accepted_consistency CHECK requires accepted_at +
    // accepted_by_user_id populated when status='accepted'.
    if (args.status === 'accepted') {
      row.accepted_at = new Date().toISOString();
      row.accepted_by_user_id = SEED.USER_CONTROLLER;
    }

    const { error } = await db.from('org_invitations').insert(row);
    if (error) throw new Error(`seedInvitation insert failed: ${error.message}`);
    cleanupIds.push(invitationId);
    return { invitationId, token: compositeToken, email };
  }

  afterAll(async () => {
    if (cleanupIds.length > 0) {
      await db.from('org_invitations').delete().in('invitation_id', cleanupIds);
    }
  });

  it('(1) malformed token (no colon) returns invalid', async () => {
    const result = await invitationService.previewInvitationByToken('no-colon-here');
    expect(result).toEqual({ state: 'invalid' });
  });

  it('(2) unknown invitation_id returns invalid', async () => {
    const fakeToken = `${randomUUID()}:deadbeef`;
    const result = await invitationService.previewInvitationByToken(fakeToken);
    expect(result).toEqual({ state: 'invalid' });
  });

  it('(3) wrong bcrypt hash (right invitation_id, different random suffix) returns invalid', async () => {
    const { invitationId } = await seedInvitation({ status: 'pending' });
    // Different random hex paired with the same invitation_id →
    // lookup succeeds, bcrypt-compare fails.
    const wrongToken = `${invitationId}:${randomBytes(32).toString('hex')}`;
    const result = await invitationService.previewInvitationByToken(wrongToken);
    expect(result.state).toBe('invalid');
  });

  it('(4) revoked status returns invalid', async () => {
    const { token } = await seedInvitation({ status: 'revoked' });
    const result = await invitationService.previewInvitationByToken(token);
    expect(result).toEqual({ state: 'invalid' });
  });

  it('(5) expired (pending + past expires_at) returns expired', async () => {
    const { token } = await seedInvitation({
      status: 'pending',
      expiresAt: new Date(Date.now() - 60_000),
    });
    const result = await invitationService.previewInvitationByToken(token);
    expect(result).toEqual({ state: 'expired' });
  });

  it('(6) accepted status returns already_accepted + orgId', async () => {
    const { token } = await seedInvitation({ status: 'accepted' });
    const result = await invitationService.previewInvitationByToken(token);
    expect(result.state).toBe('already_accepted');
    expect(result.orgId).toBe(SEED.ORG_HOLDING);
    expect(result.invitedEmail).toBeUndefined();
  });

  it('(7) valid pending returns pending + invitedEmail + orgId', async () => {
    const email = `ca82-valid-pending-${randomUUID().substring(0, 8)}@thebridge.local`;
    const { token } = await seedInvitation({ status: 'pending', email });
    const result = await invitationService.previewInvitationByToken(token);
    expect(result.state).toBe('pending');
    expect(result.invitedEmail).toBe(email);
    expect(result.orgId).toBe(SEED.ORG_HOLDING);
  });
});
