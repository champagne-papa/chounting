// tests/integration/userProfileAudit.test.ts
// CA-15: updateProfile writes user.profile_updated to audit_log with before_state.

import { describe, it, expect, afterAll } from 'vitest';
import { adminClient, SEED } from '../setup/testDb';
import { userProfileService } from '@/services/user/userProfileService';
import type { ServiceContext } from '@/services/middleware/serviceContext';

describe('CA-15: updateProfile audit logging', () => {
  const db = adminClient();
  const traceId = crypto.randomUUID();
  const ctx: ServiceContext = {
    trace_id: traceId,
    caller: { verified: true, user_id: SEED.USER_CONTROLLER, email: 'controller@thebridge.local', org_ids: [SEED.ORG_HOLDING] },
    locale: 'en',
  };

  afterAll(async () => {
    await db.from('audit_log').delete().eq('trace_id', traceId);
    await db.from('user_profiles').update({ display_name: 'Controller User' }).eq('user_id', SEED.USER_CONTROLLER);
  });

  it('writes user.profile_updated with before_state', async () => {
    await userProfileService.updateProfile(
      { user_id: SEED.USER_CONTROLLER, patch: { displayName: 'Updated Name' } },
      ctx,
    );

    const { data: auditRows } = await db
      .from('audit_log')
      .select('*')
      .eq('trace_id', traceId)
      .eq('action', 'user.profile_updated');

    expect(auditRows).toHaveLength(1);
    expect(auditRows![0].entity_type).toBe('user_profile');
    expect(auditRows![0].entity_id).toBe(SEED.USER_CONTROLLER);
    expect(auditRows![0].before_state).toBeTruthy();
    expect((auditRows![0].before_state as Record<string, unknown>).display_name).toBe('Controller User');
  });
});
