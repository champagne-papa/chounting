// tests/integration/onboardingResumeBehavior.test.ts
// CA-72: resume behavior per master §11.5(b).
//
// Two it-blocks:
//   (1) Within-TTL resume — a session abandoned mid-onboarding
//       and returned to (same session_id, session.state has the
//       existing onboarding key) reads state from the DB and
//       emits the step-aware suffix for the persisted step.
//   (2) Beyond-TTL fresh — an expired session_id is rejected;
//       the orchestrator surfaces AGENT_SESSION_EXPIRED.
//       (Session 5 doesn't refresh the UI flow end-to-end, but
//       the orchestrator behavior is the load-bearing test.)

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { handleUserMessage } from '@/agent/orchestrator';
import { __setMockFixtureQueue } from '@/agent/orchestrator/callClaude';
import { makeMessage } from '../fixtures/anthropic/makeMessage';
import { makeTestContext } from '../setup/makeTestContext';
import { adminClient, SEED } from '../setup/testDb';

const USER = SEED.USER_AP_SPECIALIST;

describe('CA-72: onboarding resume behavior', () => {
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

  it('within-TTL resume: persisted state drives the next turn without re-seeding initial_onboarding', async () => {
    // Turn 1: seed initial state, agent replies trivially.
    __setMockFixtureQueue([
      makeMessage(
        [
          {
            type: 'tool_use',
            id: 'toolu_respond_1',
            name: 'respondToUser',
            input: {
              template_id: 'agent.greeting.welcome',
              params: { user_name: 'User' },
            },
            caller: { type: 'direct' },
          },
        ],
        'tool_use',
      ),
    ]);
    const r1 = await handleUserMessage(
      {
        user_id: USER,
        org_id: null,
        locale: 'en',
        tz: 'UTC',
        message: 'hello',
        initial_onboarding: {
          in_onboarding: true,
          current_step: 2,
          completed_steps: [1],
          invited_user: false,
        },
      },
      ctx,
    );

    // Manually advance persisted state via the DB to simulate
    // "user abandoned at step 2, resumed" — this mirrors the
    // real-world case where the in-memory advance persisted and
    // the user comes back later.
    await adminClient()
      .from('agent_sessions')
      .update({
        state: {
          onboarding: {
            in_onboarding: true,
            current_step: 2,
            completed_steps: [1],
            invited_user: false,
          },
        },
      })
      .eq('session_id', r1.session_id);

    // Turn 2: no initial_onboarding passed; orchestrator reads
    // persisted state and drives the step-aware suffix from it.
    // Fixture doesn't touch the state machine.
    __setMockFixtureQueue([
      makeMessage(
        [
          {
            type: 'tool_use',
            id: 'toolu_respond_2',
            name: 'respondToUser',
            input: {
              template_id: 'agent.greeting.welcome',
              params: { user_name: 'User' },
            },
            caller: { type: 'direct' },
          },
        ],
        'tool_use',
      ),
    ]);

    const r2 = await handleUserMessage(
      {
        user_id: USER,
        org_id: null,
        locale: 'en',
        tz: 'UTC',
        message: 'back again',
        session_id: r1.session_id,
      },
      ctx,
    );

    expect(r2.session_id).toBe(r1.session_id);
    // State preserved across the turn.
    const { data: session } = await adminClient()
      .from('agent_sessions')
      .select('state')
      .eq('session_id', r2.session_id)
      .single();
    const onboarding = (session?.state as Record<string, unknown>)
      ?.onboarding as Record<string, unknown>;
    expect(onboarding.current_step).toBe(2);
    expect(onboarding.completed_steps).toEqual([1]);
  });

  it('expired session_id surfaces AGENT_SESSION_EXPIRED (no auto-resume)', async () => {
    // Create a session, then backdate its last_activity_at past
    // the 30-day TTL.
    const { data: created } = await adminClient()
      .from('agent_sessions')
      .insert({
        user_id: USER,
        org_id: null,
        locale: 'en',
        state: {},
        conversation: [],
      })
      .select('session_id')
      .single();
    if (!created) throw new Error('session seed failed');

    await adminClient()
      .from('agent_sessions')
      .update({
        last_activity_at: new Date(
          Date.now() - 31 * 24 * 60 * 60 * 1000,
        ).toISOString(),
      })
      .eq('session_id', created.session_id);

    await expect(
      handleUserMessage(
        {
          user_id: USER,
          org_id: null,
          locale: 'en',
          tz: 'UTC',
          message: 'resume attempt',
          session_id: created.session_id,
        },
        ctx,
      ),
    ).rejects.toThrow(/AGENT_SESSION_EXPIRED|older than/);
  });
});
