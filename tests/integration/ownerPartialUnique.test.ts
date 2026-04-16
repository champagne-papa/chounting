// tests/integration/ownerPartialUnique.test.ts
// CA-25: Partial unique index rejects second owner for same org.

import { describe, it, expect, afterAll } from 'vitest';
import { adminClient, SEED } from '../setup/testDb';

describe('CA-25: one org owner per org (partial unique)', () => {
  const db = adminClient();

  afterAll(async () => {
    await db
      .from('memberships')
      .update({ is_org_owner: false })
      .eq('user_id', SEED.USER_EXECUTIVE)
      .eq('org_id', SEED.ORG_HOLDING);
  });

  it('rejects setting a second owner for the same org', async () => {
    // First make executive a controller so the CHECK passes, then
    // test the partial unique on is_org_owner.
    await db.from('memberships')
      .update({ role: 'controller' })
      .eq('user_id', SEED.USER_EXECUTIVE)
      .eq('org_id', SEED.ORG_HOLDING);

    const { error } = await db
      .from('memberships')
      .update({ is_org_owner: true })
      .eq('user_id', SEED.USER_EXECUTIVE)
      .eq('org_id', SEED.ORG_HOLDING);

    expect(error).not.toBeNull();
    expect(error!.message).toMatch(/unique|duplicate/i);

    // Restore
    await db.from('memberships')
      .update({ role: 'executive' })
      .eq('user_id', SEED.USER_EXECUTIVE)
      .eq('org_id', SEED.ORG_HOLDING);
  });
});
