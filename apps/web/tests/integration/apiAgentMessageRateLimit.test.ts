// tests/integration/apiAgentMessageRateLimit.test.ts
// Path A carve-out: rate-limit gate on POST /api/agent/message.
// Two it-blocks pin the route-layer policy decision (mocked
// helper → 429 / 200 branches). The helper itself (Upstash
// Redis sliding-window logic) is not exercised live this
// session per OQ 3 default — V1 ships with mock-shaped
// integration coverage; live-Upstash unit tests are Phase 2
// if they ever earn their place.
//
// Mocking shape mirrors CA-60 (apiAgentMessage.test.ts):
// vi.mock the serviceContext module to bypass JWT check, and
// __setMockFixtureQueue the callClaude fixture for the
// success-branch orchestrator call. New: vi.mock the rate-
// limit helper module so each it-block can dictate the
// helper's return value.

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { SEED } from '../setup/testDb';
import { __setMockFixtureQueue } from '@/agent/orchestrator/callClaude';
import { respondToUserHappyPath } from '../fixtures/anthropic/respondToUserHappyPath';
import { adminClient } from '@/db/adminClient';

const TEST_TRACE = 'test-rate-limit-trace';

vi.mock('@/services/middleware/serviceContext', async () => {
  const actual =
    await vi.importActual<typeof import('@/services/middleware/serviceContext')>(
      '@/services/middleware/serviceContext',
    );
  return {
    ...actual,
    buildServiceContext: vi.fn(async () => ({
      trace_id: TEST_TRACE,
      caller: {
        user_id: SEED.USER_CONTROLLER,
        email: 'controller@thebridge.local',
        verified: true,
        org_ids: [SEED.ORG_HOLDING],
      },
      locale: 'en' as const,
    })),
  };
});

vi.mock('@/app/api/_helpers/rateLimit', () => ({
  rateLimitAgentMessage: vi.fn(),
}));

// Import AFTER vi.mock so the route sees the mocked modules.
const { POST } = await import('@/app/api/agent/message/route');
const { rateLimitAgentMessage } = await import(
  '@/app/api/_helpers/rateLimit'
);

describe('Path A carve-out: POST /api/agent/message rate-limit gate', () => {
  beforeEach(() => {
    __setMockFixtureQueue([respondToUserHappyPath]);
  });

  afterEach(async () => {
    __setMockFixtureQueue(null);
    vi.mocked(rateLimitAgentMessage).mockReset();
    await adminClient()
      .from('agent_sessions')
      .delete()
      .eq('user_id', SEED.USER_CONTROLLER);
    await adminClient().from('audit_log').delete().eq('trace_id', TEST_TRACE);
  });

  it('returns 429 with Retry-After header and RATE_LIMITED body when helper says success: false', async () => {
    vi.mocked(rateLimitAgentMessage).mockResolvedValueOnce({
      success: false,
      retry_after_seconds: 42,
      reason: 'burst',
    });

    const req = new Request('http://test/api/agent/message', {
      method: 'POST',
      body: JSON.stringify({
        org_id: SEED.ORG_HOLDING,
        message: 'Hi, who am I?',
        locale: 'en',
      }),
      headers: { 'content-type': 'application/json' },
    });

    const resp = await POST(req);

    expect(resp.status).toBe(429);
    expect(resp.headers.get('Retry-After')).toBe('42');

    const body = await resp.json();
    expect(body.error).toBe('RATE_LIMITED');
    expect(body.message).toBe('Too many requests. Please slow down.');
    expect(body.retry_after_seconds).toBe(42);

    expect(vi.mocked(rateLimitAgentMessage)).toHaveBeenCalledWith(
      SEED.USER_CONTROLLER,
      TEST_TRACE,
    );
  });

  it('proceeds to the orchestrator and returns 200 when helper says success: true', async () => {
    vi.mocked(rateLimitAgentMessage).mockResolvedValueOnce({ success: true });

    const req = new Request('http://test/api/agent/message', {
      method: 'POST',
      body: JSON.stringify({
        org_id: SEED.ORG_HOLDING,
        message: 'Hi, who am I?',
        locale: 'en',
      }),
      headers: { 'content-type': 'application/json' },
    });

    const resp = await POST(req);

    expect(resp.status).toBe(200);
    expect(resp.headers.get('Retry-After')).toBeNull();

    const body = await resp.json();
    expect(body.session_id).toBeDefined();
    expect(body.response).toBeDefined();
    expect(body.response.template_id).toBe('agent.greeting.welcome');
    expect(body.trace_id).toBe(TEST_TRACE);

    expect(vi.mocked(rateLimitAgentMessage)).toHaveBeenCalledWith(
      SEED.USER_CONTROLLER,
      TEST_TRACE,
    );
  });
});
