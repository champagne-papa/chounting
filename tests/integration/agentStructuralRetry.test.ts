// tests/integration/agentStructuralRetry.test.ts
// CA-43: structural retry (master §6.2). When Claude ends its
// turn without a respondToUser tool_use, the orchestrator
// retries once with a clarification instruction. A second miss
// raises AGENT_STRUCTURED_RESPONSE_INVALID. The structural
// retry budget is independent of the Q13 tool-validation budget.

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

  it('retries once when respondToUser is missing, then raises on second miss', async () => {
    const ctx = makeTestContext({
      user_id: SEED.USER_CONTROLLER,
      org_ids: [SEED.ORG_HOLDING],
    });
    await expect(
      handleUserMessage(
        {
          user_id: SEED.USER_CONTROLLER,
          org_id: SEED.ORG_HOLDING,
          locale: 'en',
          message: 'what is my balance?',
        },
        ctx,
      ),
    ).rejects.toThrow(/AGENT_STRUCTURED_RESPONSE_INVALID|structured/i);
  });
});
