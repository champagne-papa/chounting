// tests/integration/agentToolCallThenRespond.test.ts
// CA-40: orchestrator executes a tool call then extracts
// respondToUser from the follow-up turn (Fixture B — two-turn
// sequence).

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { handleUserMessage } from '@/agent/orchestrator';
import { __setMockFixtureQueue } from '@/agent/orchestrator/callClaude';
import {
  toolCallTurn,
  respondAfterToolTurn,
} from '../fixtures/anthropic/toolCallThenRespond';
import { makeTestContext } from '../setup/makeTestContext';
import { adminClient } from '@/db/adminClient';
import { SEED } from '../setup/testDb';

describe('CA-40: tool call then respondToUser (Fixture B)', () => {
  beforeEach(() => {
    __setMockFixtureQueue([toolCallTurn, respondAfterToolTurn]);
  });

  afterEach(async () => {
    __setMockFixtureQueue(null);
    await adminClient().from('agent_sessions').delete().eq('user_id', SEED.USER_CONTROLLER);
  });

  it('executes listChartOfAccounts then extracts follow-up respondToUser', async () => {
    const ctx = makeTestContext({
      user_id: SEED.USER_CONTROLLER,
      org_ids: [SEED.ORG_HOLDING],
    });
    const response = await handleUserMessage(
      {
        user_id: SEED.USER_CONTROLLER,
        org_id: SEED.ORG_HOLDING,
        locale: 'en',
        message: 'list my accounts',
      },
      ctx,
    );

    expect(response.response.template_id).toBe('agent.accounts.listed');
    expect(response.response.params.count).toBe(14);
    expect(response.trace_id).toBe(ctx.trace_id);
  });
});
