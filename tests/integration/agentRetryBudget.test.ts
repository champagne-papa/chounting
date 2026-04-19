// tests/integration/agentRetryBudget.test.ts
// CA-42: Q13 tool-validation retry budget (master §5.2 step 7 —
// max 2 retries after the initial attempt). Three consecutive
// validation failures surface the clarification template rather
// than a fourth retry.

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { handleUserMessage } from '@/agent/orchestrator';
import { __setMockFixtureQueue } from '@/agent/orchestrator/callClaude';
import { validationFailTurn } from '../fixtures/anthropic/validationRetryTrigger';
import { makeTestContext } from '../setup/makeTestContext';
import { adminClient } from '@/db/adminClient';
import { SEED } from '../setup/testDb';

describe('CA-42: Q13 validation retry budget exhaustion', () => {
  beforeEach(() => {
    // Three identical fail-turns in the queue. The orchestrator
    // retries the first two (validationRetries = 1, then 2);
    // the third exceeds the budget (3 > 2) and the orchestrator
    // surfaces the clarification template.
    __setMockFixtureQueue([validationFailTurn, validationFailTurn, validationFailTurn]);
  });

  afterEach(async () => {
    __setMockFixtureQueue(null);
    await adminClient().from('agent_sessions').delete().eq('user_id', SEED.USER_CONTROLLER);
  });

  it('surfaces tool_validation_failed after exhausting the Q13 budget', async () => {
    const ctx = makeTestContext({
      user_id: SEED.USER_CONTROLLER,
      org_ids: [SEED.ORG_HOLDING],
    });
    const response = await handleUserMessage(
      {
        user_id: SEED.USER_CONTROLLER,
        org_id: SEED.ORG_HOLDING,
        locale: 'en',
        message: 'post an entry',
      },
      ctx,
    );

    expect(response.response.template_id).toBe('agent.error.tool_validation_failed');
    expect(response.trace_id).toBe(ctx.trace_id);
  });
});
