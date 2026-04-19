// tests/integration/agentSessionPrecedence.test.ts
// CA-45: three-precedence session load/create per master §5.2
// step 1 / sub-brief §5.7.

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { loadOrCreateSession } from '@/agent/orchestrator/loadOrCreateSession';
import { adminClient } from '@/db/adminClient';
import { SEED } from '../setup/testDb';
import { loggerWith } from '@/shared/logger/pino';
import { makeTestContext } from '../setup/makeTestContext';

const TEST_USER = SEED.USER_CONTROLLER;
const TEST_ORG = SEED.ORG_HOLDING;

describe('CA-45: session load/create precedence', () => {
  const ctx = makeTestContext({
    user_id: TEST_USER,
    org_ids: [TEST_ORG],
  });
  const log = loggerWith({ trace_id: ctx.trace_id });

  beforeEach(async () => {
    await adminClient().from('agent_sessions').delete().eq('user_id', TEST_USER);
    await adminClient().from('audit_log').delete().eq('trace_id', ctx.trace_id);
  });

  afterEach(async () => {
    await adminClient().from('agent_sessions').delete().eq('user_id', TEST_USER);
    await adminClient().from('audit_log').delete().eq('trace_id', ctx.trace_id);
  });

  it('branch 1: session_id hit returns the existing row', async () => {
    const first = await loadOrCreateSession(
      { user_id: TEST_USER, org_id: TEST_ORG, locale: 'en' },
      ctx,
      log,
    );
    const second = await loadOrCreateSession(
      { user_id: TEST_USER, org_id: TEST_ORG, locale: 'en', session_id: first.session_id },
      ctx,
      log,
    );
    expect(second.session_id).toBe(first.session_id);
  });

  it('branch 2: fallback by (user_id, org_id) returns the most recent', async () => {
    const first = await loadOrCreateSession(
      { user_id: TEST_USER, org_id: TEST_ORG, locale: 'en' },
      ctx,
      log,
    );
    const second = await loadOrCreateSession(
      { user_id: TEST_USER, org_id: TEST_ORG, locale: 'en' },
      ctx,
      log,
    );
    expect(second.session_id).toBe(first.session_id);
  });

  it('branch 3: no match creates a new session', async () => {
    const created = await loadOrCreateSession(
      { user_id: TEST_USER, org_id: TEST_ORG, locale: 'en' },
      ctx,
      log,
    );
    expect(created.session_id).toBeDefined();
    expect(created.user_id).toBe(TEST_USER);
    expect(created.org_id).toBe(TEST_ORG);
    expect(Array.isArray(created.conversation)).toBe(true);
    expect(created.conversation).toHaveLength(0);
  });

  it('unknown session_id raises AGENT_SESSION_NOT_FOUND', async () => {
    const fakeId = '99999999-9999-9999-9999-999999999999';
    await expect(
      loadOrCreateSession(
        { user_id: TEST_USER, org_id: TEST_ORG, locale: 'en', session_id: fakeId },
        ctx,
        log,
      ),
    ).rejects.toThrow(/AGENT_SESSION_NOT_FOUND|not found/i);
  });
});
