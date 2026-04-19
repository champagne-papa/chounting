// tests/integration/agentOrchestratorHappyPath.test.ts
// CA-39: orchestrator happy path — Fixture A (single-turn
// respondToUser tool_use) → structured response extracted.

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { handleUserMessage } from '@/agent/orchestrator';
import { __setMockFixtureQueue } from '@/agent/orchestrator/callClaude';
import { respondToUserHappyPath } from '../fixtures/anthropic/respondToUserHappyPath';
import { makeTestContext } from '../setup/makeTestContext';
import { adminClient } from '@/db/adminClient';
import { SEED } from '../setup/testDb';

describe('CA-39: orchestrator happy path (Fixture A)', () => {
  beforeEach(() => {
    __setMockFixtureQueue([respondToUserHappyPath]);
  });

  afterEach(async () => {
    __setMockFixtureQueue(null);
    await adminClient().from('agent_sessions').delete().eq('user_id', SEED.USER_CONTROLLER);
  });

  it('extracts the structured response from the respondToUser tool_use', async () => {
    const ctx = makeTestContext({
      user_id: SEED.USER_CONTROLLER,
      org_ids: [SEED.ORG_HOLDING],
    });
    const response = await handleUserMessage(
      {
        user_id: SEED.USER_CONTROLLER,
        org_id: SEED.ORG_HOLDING,
        locale: 'en',
        message: 'Hi, who am I?',
      },
      ctx,
    );

    expect(response.response.template_id).toBe('agent.greeting.welcome');
    expect(response.response.params.user_name).toBe('Jamie');
    expect(response.trace_id).toBe(ctx.trace_id);
    expect(response.session_id).toBeDefined();
  });
});
