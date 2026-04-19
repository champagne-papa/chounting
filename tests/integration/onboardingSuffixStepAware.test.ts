// tests/integration/onboardingSuffixStepAware.test.ts
// CA-67: buildSystemPrompt's onboarding suffix emits step-aware
// prose for current_step ∈ {1,2,3,4}, including the explicit
// template_id naming at step 4 (Pre-decision 8).

import { describe, it, expect } from 'vitest';
import { buildSystemPrompt } from '@/agent/orchestrator/buildSystemPrompt';
import type { OnboardingState } from '@/agent/onboarding/state';
import { SEED } from '../setup/testDb';
import { makeOrgContextFixture } from '../fixtures/agent/orgContextFixture';

const baseInput = {
  persona: 'controller' as const,
  orgContext: null,
  locale: 'en' as const,
  user: { user_id: SEED.USER_CONTROLLER, display_name: 'Alex' },
};

function freshAt(step: 1 | 2 | 3 | 4, completed: number[]): OnboardingState {
  return {
    in_onboarding: true,
    current_step: step,
    completed_steps: completed,
    invited_user: false,
  };
}

describe('CA-67: onboardingSuffix step-aware prose', () => {
  it('step 1 names the updateUserProfile trigger and the display_name rule', () => {
    const prompt = buildSystemPrompt({
      ...baseInput,
      onboarding: freshAt(1, []),
    });
    expect(prompt).toContain('## Onboarding — Step 1 of 4: Profile');
    expect(prompt).toContain('updateUserProfile');
    expect(prompt).toContain('displayName');
    // Step 1 prose must NOT mention the step-4 completion template_id
    expect(prompt).not.toContain('agent.onboarding.first_task.navigate');
  });

  it('step 2 names createOrganization + listIndustries and the atomic 2+3 advance', () => {
    const prompt = buildSystemPrompt({
      ...baseInput,
      onboarding: freshAt(2, [1]),
    });
    expect(prompt).toContain('## Onboarding — Step 2 of 4: Organization');
    expect(prompt).toContain('createOrganization');
    expect(prompt).toContain('listIndustries');
    expect(prompt).toContain('steps 2 AND 3 together');
    expect(prompt).not.toContain('agent.onboarding.first_task.navigate');
  });

  it('step 3 treats the state as a defensive error condition', () => {
    const prompt = buildSystemPrompt({
      ...baseInput,
      onboarding: freshAt(3, [1]),
    });
    expect(prompt).toContain('## Onboarding — Step 3 of 4: Industry');
    expect(prompt).toContain("shouldn't happen");
    expect(prompt).toContain('re-run');
  });

  it('step 4 explicitly names the completion template_id and forbids other uses', () => {
    const prompt = buildSystemPrompt({
      ...baseInput,
      onboarding: freshAt(4, [1, 2, 3]),
    });
    expect(prompt).toContain('## Onboarding — Step 4 of 4: First task');
    expect(prompt).toContain('agent.onboarding.first_task.navigate');
    // The reservation guardrail — critical for preventing premature
    // completion on unrelated step-4 turns.
    expect(prompt).toContain('Do NOT use this template_id for any other turn');
  });

  it('in_onboarding=false with non-null orgContext produces no onboarding section (post-onboarding normal flow)', () => {
    // Post-onboarding: user has an org, orgContext is loaded,
    // in_onboarding=false means the state machine has finished.
    // The defense-in-depth fallback (genericOnboardingSuffix for
    // controller+null-orgContext) does not apply here because
    // orgContext is non-null.
    const prompt = buildSystemPrompt({
      persona: 'controller',
      orgContext: makeOrgContextFixture(),
      locale: 'en',
      user: { user_id: SEED.USER_CONTROLLER, display_name: 'Alex' },
      onboarding: {
        in_onboarding: false,
        current_step: 4,
        completed_steps: [1, 2, 3],
        invited_user: false,
      },
    });
    expect(prompt).not.toContain('## Onboarding');
    expect(prompt).not.toContain('agent.onboarding.first_task.navigate');
  });
});
