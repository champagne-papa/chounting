// tests/integration/userHasPermissionHelper.test.ts
// CA-34: user_has_permission() SQL helper returns correct results.

import { describe, it, expect } from 'vitest';
import { adminClient, userClientFor, SEED } from '../setup/testDb';

describe('CA-34: user_has_permission() SQL helper', () => {
  it('controller has journal_entry.post via the helper', async () => {
    const client = await userClientFor('controller@thebridge.local', 'DevSeed!Controller#1');
    const { data, error } = await client.rpc('user_has_permission', {
      target_org_id: SEED.ORG_HOLDING,
      target_permission_key: 'journal_entry.post',
    });
    expect(error).toBeNull();
    expect(data).toBe(true);
  });

  it('executive does NOT have journal_entry.post', async () => {
    const client = await userClientFor('executive@thebridge.local', 'DevSeed!Executive#1');
    const { data, error } = await client.rpc('user_has_permission', {
      target_org_id: SEED.ORG_HOLDING,
      target_permission_key: 'journal_entry.post',
    });
    expect(error).toBeNull();
    expect(data).toBe(false);
  });

  it('executive HAS audit_log.read', async () => {
    const client = await userClientFor('executive@thebridge.local', 'DevSeed!Executive#1');
    const { data, error } = await client.rpc('user_has_permission', {
      target_org_id: SEED.ORG_HOLDING,
      target_permission_key: 'audit_log.read',
    });
    expect(error).toBeNull();
    expect(data).toBe(true);
  });

  it('ap_specialist denied for cross-org permission', async () => {
    const client = await userClientFor('ap@thebridge.local', 'DevSeed!ApSpec#1');
    const { data, error } = await client.rpc('user_has_permission', {
      target_org_id: SEED.ORG_HOLDING,
      target_permission_key: 'journal_entry.post',
    });
    expect(error).toBeNull();
    expect(data).toBe(false);
  });
});
