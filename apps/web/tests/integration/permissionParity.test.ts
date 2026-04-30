// tests/integration/permissionParity.test.ts
// CA-27: ActionName union (ACTION_NAMES) matches permissions table.

import { describe, it, expect } from 'vitest';
import { adminClient } from '../setup/testDb';
import { ACTION_NAMES } from '@/services/auth/canUserPerformAction';

describe('CA-27: TypeScript ActionName ↔ DB permissions parity', () => {
  const db = adminClient();

  it('ACTION_NAMES and permissions table are set-equal', async () => {
    const { data: dbPerms } = await db
      .from('permissions')
      .select('permission_key');

    const dbKeys = new Set(
      (dbPerms ?? []).map((p: { permission_key: string }) => p.permission_key),
    );
    const tsKeys = new Set<string>(ACTION_NAMES);

    const inDbNotTs = [...dbKeys].filter((k) => !tsKeys.has(k));
    const inTsNotDb = [...tsKeys].filter((k) => !dbKeys.has(k));

    expect(inDbNotTs).toEqual([]);
    expect(inTsNotDb).toEqual([]);
  });
});
