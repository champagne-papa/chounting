// tests/integration/agentSessionOnboarding.test.ts
// CA-46: loadOrCreateSession handles org_id = null (onboarding
// sessions exist before the user has created/joined an org —
// master §9.1 Issue 3 resolution).

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { loadOrCreateSession } from '@/agent/orchestrator/loadOrCreateSession';
import { adminClient } from '@/db/adminClient';
import { SEED } from '../setup/testDb';
import { loggerWith } from '@/shared/logger/pino';
import { makeTestContext } from '../setup/makeTestContext';

const TEST_USER = SEED.USER_AP_SPECIALIST;

describe('CA-46: onboarding session (org_id null)', () => {
  const ctx = makeTestContext({
    user_id: TEST_USER,
    org_ids: [SEED.ORG_REAL_ESTATE],
  });
  const log = loggerWith({ trace_id: ctx.trace_id });

  beforeEach(async () => {
    await adminClient()
      .from('agent_sessions')
      .delete()
      .eq('user_id', TEST_USER)
      .is('org_id', null);
    await adminClient().from('audit_log').delete().eq('trace_id', ctx.trace_id);
  });

  afterEach(async () => {
    await adminClient()
      .from('agent_sessions')
      .delete()
      .eq('user_id', TEST_USER)
      .is('org_id', null);
    await adminClient().from('audit_log').delete().eq('trace_id', ctx.trace_id);
  });

  it('creates a session with org_id IS NULL for onboarding', async () => {
    const created = await loadOrCreateSession(
      { user_id: TEST_USER, org_id: null, locale: 'en' },
      ctx,
      log,
    );
    expect(created.org_id).toBeNull();
    expect(created.user_id).toBe(TEST_USER);
    expect(Array.isArray(created.conversation)).toBe(true);
  });

  it('fallback finds the existing onboarding session', async () => {
    const first = await loadOrCreateSession(
      { user_id: TEST_USER, org_id: null, locale: 'en' },
      ctx,
      log,
    );
    const second = await loadOrCreateSession(
      { user_id: TEST_USER, org_id: null, locale: 'en' },
      ctx,
      log,
    );
    expect(second.session_id).toBe(first.session_id);
    expect(second.org_id).toBeNull();
  });
});
