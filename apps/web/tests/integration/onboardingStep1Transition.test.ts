// tests/integration/onboardingStep1Transition.test.ts
// CA-68: updateUserProfile with a non-empty displayName advances
// the onboarding state machine from step 1 to step 2 on a fresh
// user (Pre-decision 5 + sub-brief §6.4 item 3 advance rule).

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { handleUserMessage } from '@/agent/orchestrator';
import { __setMockFixtureQueue } from '@/agent/orchestrator/callClaude';
import { makeMessage } from '../fixtures/anthropic/makeMessage';
import { makeTestContext } from '../setup/makeTestContext';
import { adminClient, SEED } from '../setup/testDb';

const USER = SEED.USER_AP_SPECIALIST;

// Two-turn fixture: turn 1 calls updateUserProfile, turn 2
// responds after the tool result comes back.
function updateUserProfileThenRespond() {
  return [
    makeMessage(
      [
        {
          type: 'tool_use' as const,
          id: 'toolu_update_profile',
          name: 'updateUserProfile',
          input: { displayName: 'Alex Test' },
          caller: { type: 'direct' as const },
        },
      ],
      'tool_use',
    ),
    makeMessage(
      [
        {
          type: 'tool_use' as const,
          id: 'toolu_respond',
          name: 'respondToUser',
          input: {
            template_id: 'agent.greeting.welcome',
            params: { user_name: 'Alex Test' },
          },
          caller: { type: 'direct' as const },
        },
      ],
      'tool_use',
    ),
  ];
}

describe('CA-68: onboarding step 1 transition', () => {
  const ctx = makeTestContext({
    user_id: USER,
    org_ids: [SEED.ORG_REAL_ESTATE],
  });

  beforeEach(async () => {
    __setMockFixtureQueue(updateUserProfileThenRespond());
    await adminClient()
      .from('agent_sessions')
      .delete()
      .eq('user_id', USER)
      .is('org_id', null);
    await adminClient()
      .from('user_profiles')
      .update({ display_name: null })
      .eq('user_id', USER);
  });

  afterEach(async () => {
    __setMockFixtureQueue(null);
    await adminClient()
      .from('agent_sessions')
      .delete()
      .eq('user_id', USER)
      .is('org_id', null);
    // Restore seed display_name
    await adminClient()
      .from('user_profiles')
      .update({ display_name: 'AP Specialist' })
      .eq('user_id', USER);
  });

  it('advances current_step from 1 to 2 and adds 1 to completed_steps', async () => {
    const response = await handleUserMessage(
      {
        user_id: USER,
        org_id: null,
        locale: 'en',
        tz: 'UTC',
        message: 'My name is Alex.',
        initial_onboarding: {
          in_onboarding: true,
          current_step: 1,
          completed_steps: [],
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
    const state = session?.state as Record<string, unknown>;
    const onboarding = state?.onboarding as Record<string, unknown>;
    expect(onboarding.in_onboarding).toBe(true);
    expect(onboarding.current_step).toBe(2);
    expect(onboarding.completed_steps).toEqual([1]);
    expect(onboarding.invited_user).toBe(false);
  });
});
