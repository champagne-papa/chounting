// tests/integration/onboardingStep4Completion.test.ts
// CA-70: step-4 completion detection. respondToUser with
// template_id `agent.onboarding.first_task.navigate` at
// current_step === 4 flips in_onboarding and sets
// onboarding_complete=true on the returned AgentResponse.
// Any other template_id at step 4 leaves state unchanged
// (Pre-decision 8 reservation guardrail).

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { handleUserMessage } from '@/agent/orchestrator';
import { __setMockFixtureQueue } from '@/agent/orchestrator/callClaude';
import { makeMessage } from '../fixtures/anthropic/makeMessage';
import { makeTestContext } from '../setup/makeTestContext';
import { adminClient, SEED } from '../setup/testDb';

const USER = SEED.USER_AP_SPECIALIST;

describe('CA-70: onboarding step 4 completion', () => {
  const ctx = makeTestContext({
    user_id: USER,
    org_ids: [SEED.ORG_REAL_ESTATE],
  });

  beforeEach(async () => {
    await adminClient()
      .from('agent_sessions')
      .delete()
      .eq('user_id', USER)
      .is('org_id', null);
  });

  afterEach(async () => {
    __setMockFixtureQueue(null);
    await adminClient()
      .from('agent_sessions')
      .delete()
      .eq('user_id', USER)
      .is('org_id', null);
  });

  it('flips in_onboarding and sets onboarding_complete=true on the completion template_id', async () => {
    __setMockFixtureQueue([
      makeMessage(
        [
          {
            type: 'tool_use',
            id: 'toolu_respond_navigate',
            name: 'respondToUser',
            input: {
              template_id: 'agent.onboarding.first_task.navigate',
              params: {},
            },
            caller: { type: 'direct' },
          },
        ],
        'tool_use',
      ),
    ]);

    const response = await handleUserMessage(
      {
        user_id: USER,
        org_id: null,
        locale: 'en',
        tz: 'UTC',
        message: "Let's post a journal entry.",
        initial_onboarding: {
          in_onboarding: true,
          current_step: 4,
          completed_steps: [1, 2, 3],
          invited_user: false,
        },
      },
      ctx,
    );
    expect(response.onboarding_complete).toBe(true);

    const { data: session } = await adminClient()
      .from('agent_sessions')
      .select('state')
      .eq('session_id', response.session_id)
      .single();
    const onboarding = (session?.state as Record<string, unknown>)
      ?.onboarding as Record<string, unknown>;
    expect(onboarding.in_onboarding).toBe(false);
    expect(onboarding.current_step).toBe(4);
  });

  it('leaves state unchanged when respondToUser uses a different template_id at step 4', async () => {
    __setMockFixtureQueue([
      makeMessage(
        [
          {
            type: 'tool_use',
            id: 'toolu_respond_other',
            name: 'respondToUser',
            input: {
              template_id: 'agent.greeting.welcome',
              params: { user_name: 'Alex' },
            },
            caller: { type: 'direct' },
          },
        ],
        'tool_use',
      ),
    ]);

    const response = await handleUserMessage(
      {
        user_id: USER,
        org_id: null,
        locale: 'en',
        tz: 'UTC',
        message: 'Still thinking about what to try.',
        initial_onboarding: {
          in_onboarding: true,
          current_step: 4,
          completed_steps: [1, 2, 3],
          invited_user: false,
        },
      },
      ctx,
    );
    expect(response.onboarding_complete).toBeUndefined();

    const { data: session } = await adminClient()
      .from('agent_sessions')
      .select('state')
      .eq('session_id', response.session_id)
      .single();
    const onboarding = (session?.state as Record<string, unknown>)
      ?.onboarding as Record<string, unknown>;
    expect(onboarding.in_onboarding).toBe(true);
    expect(onboarding.current_step).toBe(4);
  });
});
