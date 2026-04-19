// tests/integration/apiAgentConfirmNotFound.test.ts
// CA-63: POST /api/agent/confirm with an unknown
// idempotency_key → 404 NOT_FOUND.

import { describe, it, expect, vi } from 'vitest';
import { SEED } from '../setup/testDb';

const TEST_TRACE = '00000000-0000-4000-8000-000000000063';

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

const { POST } = await import('@/app/api/agent/confirm/route');

describe('CA-63: /api/agent/confirm not found', () => {
  it('returns 404 NOT_FOUND for an unknown idempotency_key', async () => {
    const req = new Request('http://test/api/agent/confirm', {
      method: 'POST',
      body: JSON.stringify({
        org_id: SEED.ORG_HOLDING,
        idempotency_key: 'deadbeef-dead-beef-dead-beefdeadbeef',
      }),
      headers: { 'content-type': 'application/json' },
    });

    const resp = await POST(req);
    expect(resp.status).toBe(404);
    const body = await resp.json();
    expect(body.error).toBe('NOT_FOUND');
  });
});
