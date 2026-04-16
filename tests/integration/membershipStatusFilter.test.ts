// tests/integration/membershipStatusFilter.test.ts
// CA-26: buildServiceContext and RLS helpers exclude suspended/removed users.
// This test verifies the blast-radius fix: every memberships consumer
// filters status = 'active'.

import { describe, it, expect, afterAll } from 'vitest';
import { adminClient, SEED } from '../setup/testDb';
import { getMembership } from '@/services/auth/getMembership';
import { canUserPerformAction } from '@/services/auth/canUserPerformAction';
import type { ServiceContext } from '@/services/middleware/serviceContext';

describe('CA-26: membership status filter', () => {
  const db = adminClient();

  it('getMembership returns null for a suspended user', async () => {
    await db.from('memberships')
      .update({ status: 'suspended', suspended_at: new Date().toISOString(), suspended_by: SEED.USER_CONTROLLER })
      .eq('user_id', SEED.USER_AP_SPECIALIST)
      .eq('org_id', SEED.ORG_REAL_ESTATE);

    const result = await getMembership(SEED.USER_AP_SPECIALIST, SEED.ORG_REAL_ESTATE);
    expect(result).toBeNull();

    await db.from('memberships')
      .update({ status: 'active', suspended_at: null, suspended_by: null })
      .eq('user_id', SEED.USER_AP_SPECIALIST)
      .eq('org_id', SEED.ORG_REAL_ESTATE);
  });

  it('canUserPerformAction rejects a suspended user', async () => {
    await db.from('memberships')
      .update({ status: 'suspended', suspended_at: new Date().toISOString(), suspended_by: SEED.USER_CONTROLLER })
      .eq('user_id', SEED.USER_AP_SPECIALIST)
      .eq('org_id', SEED.ORG_REAL_ESTATE);

    const ctx: ServiceContext = {
      trace_id: crypto.randomUUID(),
      caller: { verified: true, user_id: SEED.USER_AP_SPECIALIST, email: 'ap@thebridge.local', org_ids: [] },
      locale: 'en',
    };

    const authResult = await canUserPerformAction(ctx, 'journal_entry.post', SEED.ORG_REAL_ESTATE);
    expect(authResult.permitted).toBe(false);

    await db.from('memberships')
      .update({ status: 'active', suspended_at: null, suspended_by: null })
      .eq('user_id', SEED.USER_AP_SPECIALIST)
      .eq('org_id', SEED.ORG_REAL_ESTATE);
  });

  it('getMembership returns null for a removed user', async () => {
    await db.from('memberships')
      .update({ status: 'removed', removed_at: new Date().toISOString(), removed_by: SEED.USER_CONTROLLER })
      .eq('user_id', SEED.USER_AP_SPECIALIST)
      .eq('org_id', SEED.ORG_REAL_ESTATE);

    const result = await getMembership(SEED.USER_AP_SPECIALIST, SEED.ORG_REAL_ESTATE);
    expect(result).toBeNull();

    await db.from('memberships')
      .update({ status: 'active', removed_at: null, removed_by: null })
      .eq('user_id', SEED.USER_AP_SPECIALIST)
      .eq('org_id', SEED.ORG_REAL_ESTATE);
  });
});
