// tests/integration/canUserPerformActionRewrite.test.ts
// CA-29 through CA-33: canUserPerformAction SQL rewrite preserves
// Phase 1.1/1.5B behavior exactly.

import { describe, it, expect, afterAll } from 'vitest';
import { adminClient, SEED } from '../setup/testDb';
import { canUserPerformAction } from '@/services/auth/canUserPerformAction';
import type { ServiceContext } from '@/services/middleware/serviceContext';

function makeCtx(userId: string, email: string, orgIds: string[]): ServiceContext {
  return {
    trace_id: crypto.randomUUID(),
    caller: { verified: true, user_id: userId, email, org_ids: orgIds },
    locale: 'en',
  };
}

describe('CA-29–33: canUserPerformAction SQL rewrite', () => {
  const db = adminClient();

  // CA-29: controller + AP can post journal entries; executive denied
  it('CA-29: controller permitted for journal_entry.post', async () => {
    const ctx = makeCtx(SEED.USER_CONTROLLER, 'controller@thebridge.local', [SEED.ORG_HOLDING, SEED.ORG_REAL_ESTATE]);
    const result = await canUserPerformAction(ctx, 'journal_entry.post', SEED.ORG_HOLDING);
    expect(result.permitted).toBe(true);
  });

  it('CA-29: ap_specialist permitted for journal_entry.post', async () => {
    const ctx = makeCtx(SEED.USER_AP_SPECIALIST, 'ap@thebridge.local', [SEED.ORG_REAL_ESTATE]);
    const result = await canUserPerformAction(ctx, 'journal_entry.post', SEED.ORG_REAL_ESTATE);
    expect(result.permitted).toBe(true);
  });

  it('CA-29: executive denied for journal_entry.post', async () => {
    const ctx = makeCtx(SEED.USER_EXECUTIVE, 'executive@thebridge.local', [SEED.ORG_HOLDING, SEED.ORG_REAL_ESTATE]);
    const result = await canUserPerformAction(ctx, 'journal_entry.post', SEED.ORG_HOLDING);
    expect(result.permitted).toBe(false);
  });

  // CA-30: period.lock controller only
  it('CA-30: controller permitted for period.lock', async () => {
    const ctx = makeCtx(SEED.USER_CONTROLLER, 'controller@thebridge.local', [SEED.ORG_HOLDING]);
    const result = await canUserPerformAction(ctx, 'period.lock', SEED.ORG_HOLDING);
    expect(result.permitted).toBe(true);
  });

  it('CA-30: ap_specialist denied for period.lock', async () => {
    const ctx = makeCtx(SEED.USER_AP_SPECIALIST, 'ap@thebridge.local', [SEED.ORG_REAL_ESTATE]);
    const result = await canUserPerformAction(ctx, 'period.lock', SEED.ORG_REAL_ESTATE);
    expect(result.permitted).toBe(false);
  });

  it('CA-30: executive denied for period.lock', async () => {
    const ctx = makeCtx(SEED.USER_EXECUTIVE, 'executive@thebridge.local', [SEED.ORG_HOLDING]);
    const result = await canUserPerformAction(ctx, 'period.lock', SEED.ORG_HOLDING);
    expect(result.permitted).toBe(false);
  });

  // CA-31: org.address.delete controller only
  it('CA-31: controller permitted for org.address.delete', async () => {
    const ctx = makeCtx(SEED.USER_CONTROLLER, 'controller@thebridge.local', [SEED.ORG_HOLDING]);
    const result = await canUserPerformAction(ctx, 'org.address.delete', SEED.ORG_HOLDING);
    expect(result.permitted).toBe(true);
  });

  it('CA-31: executive denied for org.address.delete', async () => {
    const ctx = makeCtx(SEED.USER_EXECUTIVE, 'executive@thebridge.local', [SEED.ORG_HOLDING]);
    const result = await canUserPerformAction(ctx, 'org.address.delete', SEED.ORG_HOLDING);
    expect(result.permitted).toBe(false);
  });

  // CA-32: suspended user denied even with correct role
  it('CA-32: suspended user denied', async () => {
    await db.from('memberships')
      .update({ status: 'suspended', suspended_at: new Date().toISOString(), suspended_by: SEED.USER_CONTROLLER })
      .eq('user_id', SEED.USER_AP_SPECIALIST)
      .eq('org_id', SEED.ORG_REAL_ESTATE);

    const ctx = makeCtx(SEED.USER_AP_SPECIALIST, 'ap@thebridge.local', []);
    const result = await canUserPerformAction(ctx, 'journal_entry.post', SEED.ORG_REAL_ESTATE);
    expect(result.permitted).toBe(false);

    await db.from('memberships')
      .update({ status: 'active', suspended_at: null, suspended_by: null })
      .eq('user_id', SEED.USER_AP_SPECIALIST)
      .eq('org_id', SEED.ORG_REAL_ESTATE);
  });

  // CA-33: no-membership user denied
  it('CA-33: user with no membership denied', async () => {
    const ctx = makeCtx('00000000-0000-0000-0000-000000000099', 'nobody@example.com', []);
    const result = await canUserPerformAction(ctx, 'journal_entry.post', SEED.ORG_HOLDING);
    expect(result.permitted).toBe(false);
  });
});
