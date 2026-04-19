// tests/fixtures/anthropic/makeMessage.ts
// Phase 1.2 Session 2 — shared helper for Anthropic Messages
// API response fixtures. Fills envelope boilerplate so fixture
// files focus on the content blocks + stop_reason that matter.
//
// Return type is Anthropic.Messages.Message — TypeScript
// catches envelope drift when the SDK version bumps.

import type Anthropic from '@anthropic-ai/sdk';

let __fixtureIdCounter = 0;
function nextFixtureId(): string {
  __fixtureIdCounter += 1;
  return `msg_test_${__fixtureIdCounter.toString(16).padStart(8, '0')}`;
}

export function makeMessage(
  content: Anthropic.Messages.ContentBlock[],
  stop_reason: Anthropic.Messages.StopReason,
): Anthropic.Messages.Message {
  return {
    id: nextFixtureId(),
    container: null,
    content,
    model: 'claude-sonnet-4-20250514',
    role: 'assistant',
    stop_details: null,
    stop_reason,
    stop_sequence: null,
    type: 'message',
    usage: {
      cache_creation: null,
      cache_creation_input_tokens: null,
      cache_read_input_tokens: null,
      input_tokens: 100,
      output_tokens: 50,
      server_tool_use: null,
      service_tier: 'standard',
      inference_geo: null,
    } as Anthropic.Messages.Usage,
  };
}
