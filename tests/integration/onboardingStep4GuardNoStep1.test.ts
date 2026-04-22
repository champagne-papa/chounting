// tests/integration/onboardingStep4GuardNoStep1.test.ts
// Session 5.2 Fix 2 regression test: the step-4 completion
// detector in handleUserMessage now requires
// completed_steps.includes(1). State machines that reach
// current_step === 4 without step 1 ever completing (legal per
// the advance rule's math — e.g., step 1 failed silently and
// step 2+3's atomic advance jumped here) must NOT emit
// onboarding_complete, and in_onboarding must stay true.

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { handleUserMessage } from '@/agent/orchestrator';
import { __setMockFixtureQueue } from '@/agent/orchestrator/callClaude';
import { makeMessage } from '../fixtures/anthropic/makeMessage';
import { makeTestContext } from '../setup/makeTestContext';
import { adminClient, SEED } from '../setup/testDb';

const USER = SEED.USER_AP_SPECIALIST;
const FIXED_NOW = new Date('2026-04-21T00:00:00Z');

describe('Session 5.2: step-4 completion guard (step 1 required)', () => {
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

  it('first_task.navigate at step 4 is BLOCKED when completed_steps missing 1', async () => {
    // State shaped like a post-createOrganization advance that
    // happened without step 1 completing: current_step=4 but
    // completed_steps = [2, 3]. The advance rule can produce
    // this legally (smallest uncompleted > 3 is 4).
    __setMockFixtureQueue([
      makeMessage(
        [
          {
            type: 'tool_use',
            id: 'toolu_respond_navigate_blocked',
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
        message: "Let's do a journal entry.",
        initial_onboarding: {
          in_onboarding: true,
          current_step: 4,
          completed_steps: [2, 3], // 1 missing
          invited_user: false,
        },
      },
      ctx,
    );

    // Completion must NOT fire.
    expect(response.onboarding_complete).toBeUndefined();

    // State must stay at step 4, in_onboarding true, completed_steps unchanged.
    const { data: session } = await adminClient()
      .from('agent_sessions')
      .select('state')
      .eq('session_id', response.session_id)
      .single();
    const onboarding = (session?.state as Record<string, unknown>)
      ?.onboarding as Record<string, unknown>;
    expect(onboarding.in_onboarding).toBe(true);
    expect(onboarding.current_step).toBe(4);
    expect(onboarding.completed_steps).toEqual([2, 3]);
  });

  it('first_task.navigate at step 4 COMPLETES when completed_steps includes 1 (positive control)', async () => {
    __setMockFixtureQueue([
      makeMessage(
        [
          {
            type: 'tool_use',
            id: 'toolu_respond_navigate_allowed',
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
        message: "Let's do a journal entry.",
        initial_onboarding: {
          in_onboarding: true,
          current_step: 4,
          completed_steps: [1, 2, 3], // 1 present
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

  it('onboardingSuffix at current_step=4 with missing step 1 emits the recovery prose', async () => {
    const { buildSystemPrompt } = await import(
      '@/agent/orchestrator/buildSystemPrompt'
    );
    const prompt = buildSystemPrompt({
      persona: 'controller',
      orgContext: null,
      locale: 'en',
      user: { user_id: SEED.USER_CONTROLLER, display_name: 'Alex' },
      onboarding: {
        in_onboarding: true,
        current_step: 4,
        completed_steps: [2, 3],
        invited_user: false,
      },
      now: FIXED_NOW,
    });

    // Recovery branch language
    expect(prompt).toContain('blocked: profile incomplete');
    expect(prompt).toContain('display_name');
    expect(prompt).toContain('updateUserProfile');
    // Specifically tells the agent NOT to emit the completion template_id now.
    expect(prompt).toContain(
      'Do NOT emit `template_id: "agent.onboarding.first_task.navigate"` right now',
    );
  });

  it('onboardingSuffix at current_step=4 with step 1 complete emits the normal first-task prose', async () => {
    const { buildSystemPrompt } = await import(
      '@/agent/orchestrator/buildSystemPrompt'
    );
    const prompt = buildSystemPrompt({
      persona: 'controller',
      orgContext: null,
      locale: 'en',
      user: { user_id: SEED.USER_CONTROLLER, display_name: 'Alex' },
      onboarding: {
        in_onboarding: true,
        current_step: 4,
        completed_steps: [1, 2, 3],
        invited_user: false,
      },
      now: FIXED_NOW,
    });

    expect(prompt).toContain('## Onboarding — Step 4 of 4: First task');
    expect(prompt).toContain('Everything is set up');
    expect(prompt).not.toContain('blocked: profile incomplete');
  });
});
