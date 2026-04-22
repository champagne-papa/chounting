// tests/integration/permissionCatalogSeed.test.ts
// CA-28: 3 roles × correct permission counts
// (18 total; controller 18; ap_specialist 4; executive 4).

import { describe, it, expect } from 'vitest';
import { adminClient } from '../setup/testDb';

describe('CA-28: permission catalog seed integrity', () => {
  const db = adminClient();

  it('3 system roles exist', async () => {
    const { data } = await db.from('roles').select('role_key, is_system').eq('is_system', true);
    expect(data).toHaveLength(3);
    const keys = (data ?? []).map((r: { role_key: string }) => r.role_key).sort();
    expect(keys).toEqual(['ap_specialist', 'controller', 'executive']);
  });

  it('18 permissions exist', async () => {
    const { data } = await db.from('permissions').select('permission_key');
    expect(data).toHaveLength(18);
  });

  it('controller has all 18 permissions', async () => {
    const { data: role } = await db.from('roles').select('role_id').eq('role_key', 'controller').single();
    const { data: perms } = await db.from('role_permissions').select('permission_key').eq('role_id', role!.role_id);
    expect(perms).toHaveLength(18);
  });

  it('ap_specialist has exactly 4 permissions', async () => {
    const { data: role } = await db.from('roles').select('role_id').eq('role_key', 'ap_specialist').single();
    const { data: perms } = await db.from('role_permissions').select('permission_key').eq('role_id', role!.role_id);
    expect(perms).toHaveLength(4);
    const keys = (perms ?? []).map((p: { permission_key: string }) => p.permission_key).sort();
    expect(keys).toEqual(['ai_actions.read', 'chart_of_accounts.read', 'journal_entry.post', 'user.profile.update']);
  });

  it('executive has exactly 4 permissions', async () => {
    const { data: role } = await db.from('roles').select('role_id').eq('role_key', 'executive').single();
    const { data: perms } = await db.from('role_permissions').select('permission_key').eq('role_id', role!.role_id);
    expect(perms).toHaveLength(4);
    const keys = (perms ?? []).map((p: { permission_key: string }) => p.permission_key).sort();
    expect(keys).toEqual(['ai_actions.read', 'audit_log.read', 'chart_of_accounts.read', 'user.profile.update']);
  });
});
