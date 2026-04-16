// tests/integration/backfillVerification.test.ts
// CA-38: every membership has role_id matching its legacy role.

import { describe, it, expect } from 'vitest';
import { adminClient } from '../setup/testDb';

describe('CA-38: role_id backfill verification', () => {
  const db = adminClient();

  it('every membership has role_id NOT NULL', async () => {
    const { count } = await db
      .from('memberships')
      .select('*', { count: 'exact', head: true })
      .is('role_id', null);
    expect(count).toBe(0);
  });

  it('every membership role_id matches its legacy role via roles.role_key', async () => {
    const { data: memberships } = await db
      .from('memberships')
      .select('membership_id, role, role_id');

    const { data: roles } = await db
      .from('roles')
      .select('role_id, role_key');

    const roleMap = new Map(
      (roles ?? []).map((r: { role_id: string; role_key: string }) => [r.role_id, r.role_key]),
    );

    for (const m of (memberships ?? [])) {
      const expectedKey = (m as { role: string }).role;
      const actualKey = roleMap.get((m as { role_id: string }).role_id);
      expect(actualKey).toBe(expectedKey);
    }
  });
});
