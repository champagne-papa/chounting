// src/agent/orchestrator/callClaude.ts
// Phase 1.2 Session 4 — Anthropic client wrapper with two
// branches:
//
//   - Fixture branch (test path). __mockFixture is a non-null
//     array seeded by __setMockFixtureQueue. Each call shifts
//     the head off the queue and returns it. Empty array after
//     non-null seed is a test misconfiguration and throws.
//
//   - Production branch. __mockFixture is null. Instantiates
//     the Anthropic client (lazily), calls messages.create with
//     the provided params, and classifies failures per master
//     §5.4 / sub-brief Pre-decision 2:
//
//       401 / 403 → AGENT_UNAVAILABLE, no retry
//       429       → AGENT_UNAVAILABLE after retry exhaustion;
//                   exponential backoff, max 3: 1s, 2s, 4s
//       5xx       → AGENT_UNAVAILABLE after retry exhaustion;
//                   exponential backoff, max 2: 1s, 2s
//       network   → AGENT_UNAVAILABLE after retry exhaustion;
//                   linear, max 2: 2s, 2s
//       malformed → AGENT_TOOL_VALIDATION_FAILED, no retry
//                   (feeds the structural-retry path in
//                    handleUserMessage — master §6.2 item 5)
//
// Critical invariant: when __mockFixture is non-null the
// fixture path takes precedence BEFORE any real-API code
// executes. The existing fixture-driven integration tests
// continue to run without the real Anthropic client being
// instantiated.

import Anthropic, {
  APIConnectionError,
  AuthenticationError,
  InternalServerError,
  PermissionDeniedError,
  RateLimitError,
} from '@anthropic-ai/sdk';
import type { Logger } from 'pino';
import { ServiceError } from '@/services/errors/ServiceError';

let __mockFixture: Anthropic.Messages.Message[] | null = null;

/**
 * Test-only setter for the mock fixture queue.
 * Pass a non-null array to route callClaude through the fixture
 * branch (each call shifts the head off). Pass `null` to route
 * callClaude through the real Anthropic client (production branch).
 */
export function __setMockFixtureQueue(
  fixtures: Anthropic.Messages.Message[] | null,
): void {
  __mockFixture = fixtures;
}

// Lazily constructed client — avoid instantiation at import time
// so test environments without ANTHROPIC_API_KEY can import the
// module without blowing up.
let __client: Anthropic | null = null;
function getClient(): Anthropic {
  if (__client === null) {
    __client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return __client;
}

/**
 * Test-only setter for the Anthropic client. Pass a stub with a
 * `messages.create` method that returns or throws whatever the
 * test needs. Pass `null` to reset back to lazy construction of
 * the real client. Used by CA-55–CA-59 to exercise the production-
 * path classifier without hitting the real API.
 */
export function __setClientForTests(client: Anthropic | null): void {
  __client = client;
}

export async function callClaude(
  params: Anthropic.Messages.MessageCreateParams,
  log: Logger,
): Promise<Anthropic.Messages.Message> {
  // Fixture path — takes precedence before real API.
  if (__mockFixture !== null) {
    if (__mockFixture.length === 0) {
      log.error({}, 'callClaude: mock fixture queue empty');
      throw new Error(
        'callClaude: mock fixture queue is empty. ' +
          'Tests must seed the queue via __setMockFixtureQueue(fixtures).',
      );
    }
    const next = __mockFixture.shift()!;
    log.debug(
      { fixture_id: next.id, stop_reason: next.stop_reason },
      'callClaude: returning mock fixture',
    );
    return next;
  }

  // Production path — real Anthropic client with per-class
  // retry and classification.
  return invokeWithRetry(params, log);
}

async function invokeWithRetry(
  params: Anthropic.Messages.MessageCreateParams,
  log: Logger,
): Promise<Anthropic.Messages.Message> {
  const client = getClient();
  const MAX_429_ATTEMPTS = 3;
  const MAX_5XX_ATTEMPTS = 2;
  const MAX_CONN_ATTEMPTS = 2;
  let attempts429 = 0;
  let attempts5xx = 0;
  let attemptsConn = 0;

  while (true) {
    let resp: Anthropic.Messages.Message;
    try {
      resp = (await client.messages.create(
        params,
      )) as Anthropic.Messages.Message;
    } catch (err) {
      // 401 / 403 — terminal. Bad key, revoked key, wrong
      // account. Not retryable; not a Session 4 regression.
      if (
        err instanceof AuthenticationError ||
        err instanceof PermissionDeniedError
      ) {
        log.error(
          { status: err.status, type: err.type },
          'callClaude: auth/permission error — terminal',
        );
        throw new ServiceError(
          'AGENT_UNAVAILABLE',
          `Anthropic API ${err.status}: ${err.message}`,
        );
      }

      // 429 — exponential backoff, max 3 attempts (1s, 2s, 4s).
      if (err instanceof RateLimitError) {
        attempts429 += 1;
        if (attempts429 >= MAX_429_ATTEMPTS) {
          log.error(
            { attempts: attempts429 },
            'callClaude: 429 retry budget exhausted',
          );
          throw new ServiceError(
            'AGENT_UNAVAILABLE',
            `Rate limit exceeded after ${attempts429} attempts`,
          );
        }
        const waitMs = Math.pow(2, attempts429 - 1) * 1000;
        log.warn(
          { attempt: attempts429, wait_ms: waitMs },
          'callClaude: 429 — backing off',
        );
        await sleep(waitMs);
        continue;
      }

      // 5xx — exponential backoff, max 2 attempts (1s, 2s).
      if (err instanceof InternalServerError) {
        attempts5xx += 1;
        if (attempts5xx >= MAX_5XX_ATTEMPTS) {
          log.error(
            { attempts: attempts5xx },
            'callClaude: 5xx retry budget exhausted',
          );
          throw new ServiceError(
            'AGENT_UNAVAILABLE',
            `Server error after ${attempts5xx} attempts`,
          );
        }
        const waitMs = Math.pow(2, attempts5xx - 1) * 1000;
        log.warn(
          { attempt: attempts5xx, wait_ms: waitMs },
          'callClaude: 5xx — backing off',
        );
        await sleep(waitMs);
        continue;
      }

      // Network / timeout (APIConnectionTimeoutError is a
      // subclass of APIConnectionError, so this catches both).
      // Linear retry, max 2 attempts at 2s each.
      if (err instanceof APIConnectionError) {
        attemptsConn += 1;
        if (attemptsConn >= MAX_CONN_ATTEMPTS) {
          log.error(
            { attempts: attemptsConn },
            'callClaude: connection retry budget exhausted',
          );
          throw new ServiceError(
            'AGENT_UNAVAILABLE',
            `Connection error after ${attemptsConn} attempts`,
          );
        }
        log.warn(
          { attempt: attemptsConn },
          'callClaude: connection error — retrying',
        );
        await sleep(2000);
        continue;
      }

      // Anything else — surface as AGENT_UNAVAILABLE, no retry.
      // Covers BadRequest, NotFound, Conflict, UnprocessableEntity,
      // and any non-APIError surprise.
      const msg = err instanceof Error ? err.message : String(err);
      log.error({ err: msg }, 'callClaude: unexpected error');
      throw new ServiceError(
        'AGENT_UNAVAILABLE',
        `Unexpected Anthropic error: ${msg}`,
      );
    }

    // Malformed-response classification. A valid response has a
    // non-empty content array AND a stop_reason. Missing either
    // surfaces as AGENT_TOOL_VALIDATION_FAILED, which feeds the
    // structural-retry path in handleUserMessage (master §6.2
    // item 5 — Session 3 closed).
    if (!Array.isArray(resp.content) || resp.content.length === 0) {
      log.error(
        { stop_reason: resp.stop_reason },
        'callClaude: malformed response — empty content',
      );
      throw new ServiceError(
        'AGENT_TOOL_VALIDATION_FAILED',
        'Anthropic response has empty content array',
      );
    }
    if (!resp.stop_reason) {
      log.error({}, 'callClaude: malformed response — missing stop_reason');
      throw new ServiceError(
        'AGENT_TOOL_VALIDATION_FAILED',
        'Anthropic response missing stop_reason',
      );
    }

    // C6-α: emit a single log.info line carrying both usage and
    // stop_reason. trace_id rides the child logger the caller
    // passed in (loggerWith from the orchestrator). This line is
    // the join key that scripts/verify-ec-2.ts greps against for
    // per-entry cost capture — see Finding M in the Session 8
    // friction-journal for the pre-check that surfaced the gap.
    log.info(
      {
        stop_reason: resp.stop_reason,
        usage: {
          input_tokens: resp.usage.input_tokens,
          output_tokens: resp.usage.output_tokens,
          cache_read_input_tokens: resp.usage.cache_read_input_tokens ?? null,
          cache_creation_input_tokens:
            resp.usage.cache_creation_input_tokens ?? null,
        },
      },
      'callClaude: API call complete',
    );
    return resp;
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
