// src/agent/orchestrator/callClaude.ts
// Phase 1.2 Session 2 — mocked Anthropic client wrapper.
//
// In Session 2 this reads from a test-injected fixture queue.
// Session 4 replaces the queue branch with a real Anthropic
// client call; the function signature stays identical so the
// call-site in handleUserMessage is untouched.

import type Anthropic from '@anthropic-ai/sdk';
import type { Logger } from 'pino';

let __mockFixture: Anthropic.Messages.Message[] | null = null;

/**
 * Test-only setter for the mock fixture queue. Seed an ordered
 * list of Message objects; each callClaude invocation shifts
 * the head off the queue.
 *
 * Pass `null` or an empty array to reset between tests.
 */
export function __setMockFixtureQueue(
  fixtures: Anthropic.Messages.Message[] | null,
): void {
  __mockFixture = fixtures;
}

export async function callClaude(
  _params: Anthropic.Messages.MessageCreateParams,
  log: Logger,
): Promise<Anthropic.Messages.Message> {
  if (__mockFixture === null || __mockFixture.length === 0) {
    log.error({}, 'callClaude: no mock fixture set');
    throw new Error(
      'callClaude: mock fixture queue is empty or null. ' +
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
