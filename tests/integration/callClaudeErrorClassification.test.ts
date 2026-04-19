// tests/integration/callClaudeErrorClassification.test.ts
// CA-55 through CA-59: real-API error classification per
// Pre-decision 2. Uses __setClientForTests to inject a stub
// whose messages.create() returns errors of specific shapes,
// then asserts callClaude maps each shape to the correct
// ServiceError with the correct retry behavior.

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  APIConnectionError,
  APIConnectionTimeoutError,
  AuthenticationError,
  InternalServerError,
  RateLimitError,
  type default as Anthropic,
} from '@anthropic-ai/sdk';
import {
  callClaude,
  __setMockFixtureQueue,
  __setClientForTests,
} from '@/agent/orchestrator/callClaude';
import { loggerWith } from '@/shared/logger/pino';

const log = loggerWith({ trace_id: 'test-callClaude-errors' });

// Minimal params suitable for every test — the stub doesn't
// inspect them.
const PARAMS = {
  model: 'claude-sonnet-4-20250514',
  max_tokens: 1024,
  messages: [{ role: 'user' as const, content: 'hi' }],
};

function makeStubClient(
  createImpl: () => Promise<unknown>,
): { client: Anthropic; createSpy: ReturnType<typeof vi.fn> } {
  const createSpy = vi.fn(createImpl);
  const client = {
    messages: { create: createSpy },
  } as unknown as Anthropic;
  return { client, createSpy };
}

describe('CA-55 through CA-59: callClaude error classification', () => {
  beforeEach(() => {
    // Force production path by clearing the fixture queue.
    __setMockFixtureQueue(null);
  });

  afterEach(() => {
    __setClientForTests(null);
  });

  it('CA-55: 401 Authentication error throws AGENT_UNAVAILABLE with no retry', async () => {
    const err = new AuthenticationError(
      401,
      { type: 'error', error: { type: 'authentication_error', message: 'Invalid API key' } },
      'Invalid API key',
      new Headers(),
    );
    const { client, createSpy } = makeStubClient(async () => {
      throw err;
    });
    __setClientForTests(client);

    await expect(callClaude(PARAMS, log)).rejects.toThrow(/AGENT_UNAVAILABLE/);
    expect(createSpy).toHaveBeenCalledTimes(1);
  });

  it('CA-56: 429 retries with exp backoff; succeeds on attempt 3', async () => {
    const rateErr = new RateLimitError(
      429,
      { type: 'error', error: { type: 'rate_limit_error', message: 'Slow down' } },
      'Slow down',
      new Headers(),
    );
    const successMsg = {
      id: 'msg_01',
      type: 'message' as const,
      role: 'assistant' as const,
      model: 'claude-sonnet-4-20250514',
      content: [{ type: 'text' as const, text: 'ok', citations: null }],
      stop_reason: 'end_turn' as const,
      stop_sequence: null,
      usage: { input_tokens: 1, output_tokens: 1 },
    };
    let call = 0;
    const { client, createSpy } = makeStubClient(async () => {
      call += 1;
      if (call < 3) throw rateErr;
      return successMsg;
    });
    __setClientForTests(client);

    const resp = await callClaude(PARAMS, log);
    expect(resp.id).toBe('msg_01');
    expect(createSpy).toHaveBeenCalledTimes(3);
  }, 15_000);

  it('CA-57: 5xx retries with exp backoff; succeeds on attempt 2', async () => {
    const serverErr = new InternalServerError(
      503,
      { type: 'error', error: { type: 'api_error', message: 'Try again' } },
      'Service unavailable',
      new Headers(),
    );
    const successMsg = {
      id: 'msg_02',
      type: 'message' as const,
      role: 'assistant' as const,
      model: 'claude-sonnet-4-20250514',
      content: [{ type: 'text' as const, text: 'ok', citations: null }],
      stop_reason: 'end_turn' as const,
      stop_sequence: null,
      usage: { input_tokens: 1, output_tokens: 1 },
    };
    let call = 0;
    const { client, createSpy } = makeStubClient(async () => {
      call += 1;
      if (call === 1) throw serverErr;
      return successMsg;
    });
    __setClientForTests(client);

    const resp = await callClaude(PARAMS, log);
    expect(resp.id).toBe('msg_02');
    expect(createSpy).toHaveBeenCalledTimes(2);
  }, 10_000);

  it('CA-58: connection timeout retries then fails with AGENT_UNAVAILABLE', async () => {
    const timeoutErr = new APIConnectionTimeoutError({
      message: 'Request timed out',
    });
    const { client, createSpy } = makeStubClient(async () => {
      throw timeoutErr;
    });
    __setClientForTests(client);

    await expect(callClaude(PARAMS, log)).rejects.toThrow(/AGENT_UNAVAILABLE/);
    // Linear retry, max 2 attempts
    expect(createSpy).toHaveBeenCalledTimes(2);
  }, 10_000);

  it('CA-59: malformed response (empty content) throws AGENT_TOOL_VALIDATION_FAILED with no retry', async () => {
    const malformedMsg = {
      id: 'msg_03',
      type: 'message' as const,
      role: 'assistant' as const,
      model: 'claude-sonnet-4-20250514',
      content: [], // empty
      stop_reason: 'end_turn' as const,
      stop_sequence: null,
      usage: { input_tokens: 1, output_tokens: 0 },
    };
    const { client, createSpy } = makeStubClient(async () => malformedMsg);
    __setClientForTests(client);

    await expect(callClaude(PARAMS, log)).rejects.toThrow(
      /AGENT_TOOL_VALIDATION_FAILED/,
    );
    expect(createSpy).toHaveBeenCalledTimes(1);
  });

  it('CA-59b: connection error (non-timeout) retries then fails', async () => {
    const connErr = new APIConnectionError({
      message: 'ECONNRESET',
      cause: new Error('socket hang up'),
    });
    const { client, createSpy } = makeStubClient(async () => {
      throw connErr;
    });
    __setClientForTests(client);

    await expect(callClaude(PARAMS, log)).rejects.toThrow(/AGENT_UNAVAILABLE/);
    expect(createSpy).toHaveBeenCalledTimes(2);
  }, 10_000);
});
