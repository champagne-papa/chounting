// tests/integration/rolePermissionsPK.test.ts
// CA-35: duplicate (role_id, permission_key) rejected by PK.

import { describe, it, expect } from 'vitest';
import { adminClient } from '../setup/testDb';

describe('CA-35: role_permissions PK rejects duplicates', () => {
  const db = adminClient();

  it('inserting duplicate (role_id, permission_key) fails', async () => {
    const { data: controllerRole } = await db
      .from('roles')
      .select('role_id')
      .eq('role_key', 'controller')
      .single();

    const { error } = await db.from('role_permissions').insert({
      role_id: controllerRole!.role_id,
      permission_key: 'journal_entry.post',
    });

    expect(error).not.toBeNull();
    expect(error!.message).toMatch(/unique|duplicate/i);
  });
});
