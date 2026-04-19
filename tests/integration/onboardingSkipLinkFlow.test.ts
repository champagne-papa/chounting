// tests/integration/onboardingSkipLinkFlow.test.ts
// CA-81: Phase 1.2 Session 6 — onboarding skip-link prose.
// The welcome page's visible "Skip to form" link is gated on
// initialState.current_step === 1 (Pre-decision 3). The
// onboardingSuffix's step-1 prose block names the skip-link so
// Claude's responses align with what the user can see.
//
// React-component render of the welcome page isn't set up in
// this integration suite, so this test pins the invariant at
// the prose layer: step 1 references "Skip to form" +
// /settings/profile path; steps 2/3/4 do NOT.
//
// The 'Either path advances the state machine' neutrality
// clause is also asserted — it prevents Claude from evangelizing
// either chat or form path.

import { describe, it, expect } from 'vitest';
import { onboardingSuffix } from '@/agent/prompts/suffixes/onboardingSuffix';
import type { OnboardingState } from '@/agent/onboarding/state';

function at(step: 1 | 2 | 3 | 4, completed: number[] = []): OnboardingState {
  return {
    in_onboarding: true,
    current_step: step,
    completed_steps: completed,
    invited_user: false,
  };
}

describe('CA-81: onboardingSuffix step-1 skip-link prose', () => {
  it('step 1 prose names the "Skip to form" link', () => {
    const suffix = onboardingSuffix(at(1, []));
    expect(suffix).toContain('Skip to form');
  });

  it('step 1 prose names the /settings/profile destination', () => {
    const suffix = onboardingSuffix(at(1, []));
    expect(suffix).toContain('/settings/profile');
  });

  it('step 1 prose includes neutrality guidance (either path advances the state machine)', () => {
    const suffix = onboardingSuffix(at(1, []));
    expect(suffix).toContain('Either path advances the state machine');
    expect(suffix).toMatch(/don't push them toward one or the other/);
  });

  it('step 2 prose does NOT mention the skip-link (no org-creation form-escape per Pre-decision 3)', () => {
    const suffix = onboardingSuffix(at(2, [1]));
    expect(suffix).not.toContain('Skip to form');
    expect(suffix).not.toContain('/settings/profile');
    // Step 2 keeps its permanent "isn't wired in for you right now"
    // phrasing per Pre-decision 3's permanence note.
    expect(suffix).toContain("isn't wired in for you right now");
  });

  it('step 3 prose does NOT mention the skip-link', () => {
    const suffix = onboardingSuffix(at(3, [1]));
    expect(suffix).not.toContain('Skip to form');
    expect(suffix).not.toContain('/settings/profile');
  });

  it('step 4 prose does NOT mention the skip-link (not a skippable step)', () => {
    const suffix = onboardingSuffix(at(4, [1, 2, 3]));
    expect(suffix).not.toContain('Skip to form');
    expect(suffix).not.toContain('/settings/profile');
  });

  it('empty state (in_onboarding=false) emits no suffix (regression guard)', () => {
    const suffix = onboardingSuffix({
      in_onboarding: false,
      current_step: 4,
      completed_steps: [1, 2, 3],
      invited_user: false,
    });
    expect(suffix).toBe('');
  });
});
