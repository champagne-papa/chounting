// tests/integration/apiAgentMessage.test.ts
// CA-60: POST /api/agent/message with Fixture A seeded in the
// callClaude queue; response body matches the AgentResponse
// shape. Uses vi.mock to bypass buildServiceContext's JWT
// check — tests don't have valid Supabase Auth cookies.

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { SEED } from '../setup/testDb';
import { __setMockFixtureQueue } from '@/agent/orchestrator/callClaude';
import { respondToUserHappyPath } from '../fixtures/anthropic/respondToUserHappyPath';
import { adminClient } from '@/db/adminClient';

const TEST_TRACE = 'test-ca-60-trace';

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

// Import AFTER vi.mock so the route sees the mocked context.
const { POST } = await import('@/app/api/agent/message/route');

describe('CA-60: POST /api/agent/message', () => {
  beforeEach(() => {
    __setMockFixtureQueue([respondToUserHappyPath]);
  });

  afterEach(async () => {
    __setMockFixtureQueue(null);
    await adminClient()
      .from('agent_sessions')
      .delete()
      .eq('user_id', SEED.USER_CONTROLLER);
    await adminClient().from('audit_log').delete().eq('trace_id', TEST_TRACE);
  });

  it('returns 200 with an AgentResponse body', async () => {
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

    const body = await resp.json();
    expect(body.session_id).toBeDefined();
    expect(body.response).toBeDefined();
    expect(body.response.template_id).toBe('agent.greeting.welcome');
    expect(body.trace_id).toBe(TEST_TRACE);
  });

  it('returns 400 on invalid body (missing message)', async () => {
    const req = new Request('http://test/api/agent/message', {
      method: 'POST',
      body: JSON.stringify({ org_id: SEED.ORG_HOLDING }),
      headers: { 'content-type': 'application/json' },
    });
    const resp = await POST(req);
    expect(resp.status).toBe(400);
  });
});
