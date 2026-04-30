// tests/integration/apiAgentConfirmStale.test.ts
// CA-62: seed ai_actions with status='stale'; POST /api/agent/
// confirm → 422 with a message matching /stale/i.

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { SEED } from '../setup/testDb';
import { adminClient } from '@/db/adminClient';

const TEST_TRACE = '00000000-0000-4000-8000-000000000062';

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

describe('CA-62: /api/agent/confirm stale', () => {
  const idempotencyKey = crypto.randomUUID();

  beforeEach(async () => {
    const db = adminClient();
    await db.from('ai_actions').delete().eq('idempotency_key', idempotencyKey);
  });

  afterEach(async () => {
    const db = adminClient();
    await db.from('ai_actions').delete().eq('idempotency_key', idempotencyKey);
    await db.from('audit_log').delete().eq('trace_id', TEST_TRACE);
  });

  it('returns 422 AGENT_TOOL_VALIDATION_FAILED when the ai_actions row is stale', async () => {
    const db = adminClient();
    const { error: insertErr } = await db.from('ai_actions').insert({
      org_id: SEED.ORG_HOLDING,
      user_id: SEED.USER_CONTROLLER,
      trace_id: TEST_TRACE,
      tool_name: 'postJournalEntry',
      tool_input: { note: 'stale seed for CA-62' },
      status: 'stale',
      staled_at: new Date().toISOString(),
      idempotency_key: idempotencyKey,
    });
    if (insertErr) throw new Error(insertErr.message);

    const req = new Request('http://test/api/agent/confirm', {
      method: 'POST',
      body: JSON.stringify({
        org_id: SEED.ORG_HOLDING,
        idempotency_key: idempotencyKey,
      }),
      headers: { 'content-type': 'application/json' },
    });

    const resp = await POST(req);
    expect(resp.status).toBe(422);
    const body = await resp.json();
    expect(body.error).toBe('AGENT_TOOL_VALIDATION_FAILED');
    expect(body.message).toMatch(/stale/i);
  });
});
