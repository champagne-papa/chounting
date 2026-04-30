// tests/integration/agentStructuralRetry.test.ts
// CA-43: structural retry (master §6.2). When Claude ends its
// turn without a respondToUser tool_use, the orchestrator
// retries once with a clarification instruction. A second miss
// returns a generic error template per master §6.2 item 5:
//   { template_id: 'agent.error.structured_response_missing',
//     params: {} }
// and logs AGENT_STRUCTURED_RESPONSE_INVALID. The structural
// retry budget is independent of the Q13 tool-validation budget.
//
// Phase 1.2 Session 3 inverted this test per sub-brief §6.7 —
// Session 2 shipped a throw; master §6.2 item 5 specifies a
// template response. The invariant tested (two misses → surface
// failure to the user) is unchanged; only the surface shape
// flipped.

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import type Anthropic from '@anthropic-ai/sdk';
import { handleUserMessage } from '@/agent/orchestrator';
import { __setMockFixtureQueue } from '@/agent/orchestrator/callClaude';
import { makeMessage } from '../fixtures/anthropic/makeMessage';
import { makeTestContext } from '../setup/makeTestContext';
import { adminClient } from '@/db/adminClient';
import { SEED } from '../setup/testDb';

// A turn that ends with text-only content and stop_reason
// 'end_turn'. No tool_use blocks at all — triggers the
// structural retry path.
function textOnlyEndTurn(): Anthropic.Messages.Message {
  return makeMessage(
    [{ type: 'text', citations: null, text: 'I have completed my thinking.' }],
    'end_turn',
  );
}

describe('CA-43: structural retry budget', () => {
  beforeEach(() => {
    __setMockFixtureQueue([textOnlyEndTurn(), textOnlyEndTurn()]);
  });

  afterEach(async () => {
    __setMockFixtureQueue(null);
    await adminClient().from('agent_sessions').delete().eq('user_id', SEED.USER_CONTROLLER);
  });

  it('retries once when respondToUser is missing, then returns the fallback template on second miss', async () => {
    const ctx = makeTestContext({
      user_id: SEED.USER_CONTROLLER,
      org_ids: [SEED.ORG_HOLDING],
    });
    const response = await handleUserMessage(
      {
        user_id: SEED.USER_CONTROLLER,
        org_id: SEED.ORG_HOLDING,
        locale: 'en',
        tz: 'UTC',
        message: 'what is my balance?',
      },
      ctx,
    );

    expect(response.response.template_id).toBe('agent.error.structured_response_missing');
    expect(response.response.params).toEqual({});
    expect(response.trace_id).toBe(ctx.trace_id);
  });
});
