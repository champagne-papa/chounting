// tests/integration/onboardingInvitedUser.test.ts
// CA-71: invited-user shortened flow per master §11.5(c). The
// welcome page initializes `completed_steps: [2, 3]` because
// the user has a membership (org + industry already exist) but
// needs to complete step 1 (profile). The advance rule in
// sub-brief §6.4 item 3 carries them directly from step 1 to
// step 4 — steps 2 and 3 are skipped.
//
// Uses set-equality on completed_steps per the sub-brief's
// CA-71 assertion shape (order-independent).

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { handleUserMessage } from '@/agent/orchestrator';
import { __setMockFixtureQueue } from '@/agent/orchestrator/callClaude';
import { makeMessage } from '../fixtures/anthropic/makeMessage';
import { makeTestContext } from '../setup/makeTestContext';
import { adminClient, SEED } from '../setup/testDb';
import { advanceOnboardingState } from '@/agent/onboarding/state';

const USER = SEED.USER_AP_SPECIALIST;

describe('CA-71: invited-user shortened flow', () => {
  const ctx = makeTestContext({
    user_id: USER,
    org_ids: [SEED.ORG_REAL_ESTATE],
  });

  beforeEach(async () => {
    __setMockFixtureQueue([
      makeMessage(
        [
          {
            type: 'tool_use',
            id: 'toolu_update',
            name: 'updateUserProfile',
            input: { displayName: 'Invited Alex' },
            caller: { type: 'direct' },
          },
        ],
        'tool_use',
      ),
      makeMessage(
        [
          {
            type: 'tool_use',
            id: 'toolu_respond',
            name: 'respondToUser',
            input: {
              template_id: 'agent.greeting.welcome',
              params: { user_name: 'Invited Alex' },
            },
            caller: { type: 'direct' },
          },
        ],
        'tool_use',
      ),
    ]);
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
    await adminClient()
      .from('user_profiles')
      .update({ display_name: 'AP Specialist' })
      .eq('user_id', USER);
  });

  it('pure advance rule: step 1 completion skips directly to step 4 for invited users', () => {
    // The advance rule is the load-bearing piece of the shortened
    // flow; verify it independently of the orchestrator round-trip.
    const result = advanceOnboardingState(
      {
        in_onboarding: true,
        current_step: 1,
        completed_steps: [2, 3],
        invited_user: true,
      },
      [1],
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.state.current_step).toBe(4);
    expect(new Set(result.state.completed_steps)).toEqual(new Set([1, 2, 3]));
  });

  it('handleUserMessage round-trip: invited user step-1 completion → current_step=4, completed_steps={1,2,3}', async () => {
    const response = await handleUserMessage(
      {
        user_id: USER,
        org_id: null,
        locale: 'en',
        tz: 'UTC',
        message: 'My name is Invited Alex.',
        initial_onboarding: {
          in_onboarding: true,
          current_step: 1,
          completed_steps: [2, 3],
          invited_user: true,
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
    expect(new Set(onboarding.completed_steps as number[])).toEqual(
      new Set([1, 2, 3]),
    );
    expect(onboarding.invited_user).toBe(true);
  });
});
