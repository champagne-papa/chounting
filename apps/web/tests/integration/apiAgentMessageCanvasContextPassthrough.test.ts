// tests/integration/apiAgentMessageCanvasContextPassthrough.test.ts
// Phase 1.2 Session 7.1 Commit 5 — the route-level passthrough
// contract: whatever `canvas_context` the client sends in the
// request body is validated by canvasContextSchema and forwarded
// to handleUserMessage with shape preserved. The orchestrator is
// mocked here; agent-side behavior verification (EC-19b under/
// over-anchored / clarification scenarios) is the manual paid-API
// gate run separately and logged in the friction journal.

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { SEED } from '../setup/testDb';
import type { CanvasContext } from '@/shared/types/canvasContext';

const TEST_TRACE = 'test-ca-canvas-passthrough-trace';

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

const handleUserMessageMock = vi.fn(async (input: unknown) => ({
  session_id: '00000000-0000-0000-0000-00000000cafe',
  response: { template_id: 'agent.greeting.welcome', params: {} },
  trace_id: TEST_TRACE,
  // Return the input for inspection in assertions via last-call args.
  _input: input,
}));

vi.mock('@/agent/orchestrator', async () => {
  const actual =
    await vi.importActual<typeof import('@/agent/orchestrator')>(
      '@/agent/orchestrator',
    );
  return {
    ...actual,
    handleUserMessage: handleUserMessageMock,
  };
});

// Import AFTER vi.mock so the route sees the mocks.
const { POST } = await import('@/app/api/agent/message/route');

function postWithBody(body: unknown) {
  return POST(
    new Request('http://test/api/agent/message', {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'content-type': 'application/json' },
    }),
  );
}

describe('POST /api/agent/message — canvas_context passthrough', () => {
  beforeEach(() => {
    handleUserMessageMock.mockClear();
  });

  afterEach(() => {
    handleUserMessageMock.mockClear();
  });

  it('forwards a populated canvas_context (directive + selection) unchanged to handleUserMessage', async () => {
    const canvasContext: CanvasContext = {
      current_directive: {
        type: 'journal_entry_list',
        orgId: SEED.ORG_HOLDING,
      },
      selected_entity: {
        type: 'journal_entry',
        id: '11111111-1111-1111-1111-111111111111',
        display_name: '#179 — October rent',
      },
    };

    const resp = await postWithBody({
      org_id: SEED.ORG_HOLDING,
      message: 'Why is this entry so large?',
      locale: 'en',
      canvas_context: canvasContext,
    });
    expect(resp.status).toBe(200);

    expect(handleUserMessageMock).toHaveBeenCalledTimes(1);
    const firstArg = handleUserMessageMock.mock.calls[0][0] as {
      canvas_context?: CanvasContext;
    };
    expect(firstArg.canvas_context).toEqual(canvasContext);
  });

  it('forwards a directive-only canvas_context (no selection) unchanged', async () => {
    const canvasContext: CanvasContext = {
      current_directive: { type: 'chart_of_accounts', orgId: SEED.ORG_HOLDING },
    };

    const resp = await postWithBody({
      org_id: SEED.ORG_HOLDING,
      message: 'What is this?',
      canvas_context: canvasContext,
    });
    expect(resp.status).toBe(200);
    const arg = handleUserMessageMock.mock.calls[0][0] as {
      canvas_context?: CanvasContext;
    };
    expect(arg.canvas_context).toEqual(canvasContext);
    expect(arg.canvas_context?.selected_entity).toBeUndefined();
  });

  it('omits canvas_context from the orchestrator input when the request body does not include it', async () => {
    const resp = await postWithBody({
      org_id: SEED.ORG_HOLDING,
      message: 'Hello',
      locale: 'en',
    });
    expect(resp.status).toBe(200);
    const arg = handleUserMessageMock.mock.calls[0][0] as {
      canvas_context?: CanvasContext;
    };
    expect(arg.canvas_context).toBeUndefined();
  });

  it('rejects a canvas_context with unknown fields (strict schema)', async () => {
    const resp = await postWithBody({
      org_id: SEED.ORG_HOLDING,
      message: 'Hi',
      canvas_context: {
        current_directive: { type: 'none' },
        selected_entity: {
          type: 'journal_entry',
          id: '11111111-1111-1111-1111-111111111111',
          display_name: 'x',
          extra_field: 'nope',
        },
      },
    });
    expect(resp.status).toBe(400);
    expect(handleUserMessageMock).not.toHaveBeenCalled();
  });

  it('rejects a canvas_context with a non-UUID entity id', async () => {
    const resp = await postWithBody({
      org_id: SEED.ORG_HOLDING,
      message: 'Hi',
      canvas_context: {
        current_directive: { type: 'none' },
        selected_entity: {
          type: 'journal_entry',
          id: 'not-a-uuid',
          display_name: 'x',
        },
      },
    });
    expect(resp.status).toBe(400);
    expect(handleUserMessageMock).not.toHaveBeenCalled();
  });
});
