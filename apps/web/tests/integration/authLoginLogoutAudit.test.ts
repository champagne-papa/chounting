// tests/integration/authLoginLogoutAudit.test.ts
// CA-23: Login/logout events written to audit_log with correct action keys.

import { describe, it, expect, afterAll } from 'vitest';
import { adminClient, SEED } from '../setup/testDb';
import { recordLoginEvent, recordLogoutEvent } from '@/services/auth/authEvents';

describe('CA-23: auth login/logout audit events', () => {
  const db = adminClient();
  const traceId = crypto.randomUUID();

  afterAll(async () => {
    await db.from('audit_log').delete().eq('trace_id', traceId);
  });

  it('recordLoginEvent writes auth.login with null org_id', async () => {
    await recordLoginEvent(SEED.USER_CONTROLLER, traceId);

    const { data } = await db
      .from('audit_log')
      .select('*')
      .eq('trace_id', traceId)
      .eq('action', 'auth.login');

    expect(data).toHaveLength(1);
    expect(data![0].entity_type).toBe('user');
    expect(data![0].entity_id).toBe(SEED.USER_CONTROLLER);
    expect(data![0].org_id).toBeNull();
  });

  it('recordLogoutEvent writes auth.logout with null org_id', async () => {
    await recordLogoutEvent(SEED.USER_CONTROLLER, traceId);

    const { data } = await db
      .from('audit_log')
      .select('*')
      .eq('trace_id', traceId)
      .eq('action', 'auth.logout');

    expect(data).toHaveLength(1);
    expect(data![0].entity_type).toBe('user');
    expect(data![0].org_id).toBeNull();
  });
});
