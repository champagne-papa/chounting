// tests/integration/buildSystemPromptOnboarding.test.ts
// CA-49: buildSystemPrompt appends the verbatim onboarding suffix
// from master §7.1 when persona === 'controller' &&
// orgContext === null.

import { describe, it, expect } from 'vitest';
import { buildSystemPrompt } from '@/agent/orchestrator/buildSystemPrompt';
import { SEED } from '../setup/testDb';
import { makeOrgContextFixture } from '../fixtures/agent/orgContextFixture';

const FIXED_NOW = new Date('2026-04-21T00:00:00Z');

describe('CA-49: buildSystemPrompt onboarding', () => {
  it('appends the onboarding suffix for controller + null orgContext', () => {
    const prompt = buildSystemPrompt({
      persona: 'controller',
      orgContext: null,
      locale: 'en',
      user: { user_id: SEED.USER_CONTROLLER, display_name: 'Jamie' },
      now: FIXED_NOW,
      timezone: 'UTC',
    });

    // Onboarding branch of the identity block (no org name)
    expect(prompt).toContain('You are helping a new user set up their first organization.');

    // Verbatim onboarding suffix from master §7.1
    expect(prompt).toContain('## Onboarding');
    expect(prompt).toContain('The user is new. Walk them through setup:');
    expect(prompt).toContain('(1) their profile');
    expect(prompt).toContain('(2) their organization');
    expect(prompt).toContain('(3) industry selection for CoA template');
    expect(prompt).toContain('(4) first task invitation');
    expect(prompt).toContain('they can skip to the form-based surface');
    expect(prompt).toContain('Use the available tools (updateUserProfile, createOrganization, updateOrgProfile, listIndustries)');
  });

  it('does NOT append the onboarding suffix for a non-controller persona with null orgContext', () => {
    // ap_specialist in onboarding — not the persona the suffix
    // targets. The identity block still uses the onboarding
    // framing (no org), but the onboarding suffix stays off.
    const prompt = buildSystemPrompt({
      persona: 'ap_specialist',
      orgContext: null,
      locale: 'en',
      user: { user_id: SEED.USER_AP_SPECIALIST },
      now: FIXED_NOW,
      timezone: 'UTC',
    });

    expect(prompt).not.toContain('## Onboarding');
    expect(prompt).not.toContain('Walk them through setup');
  });

  it('does NOT append the onboarding suffix for controller + non-null orgContext', () => {
    const prompt = buildSystemPrompt({
      persona: 'controller',
      orgContext: makeOrgContextFixture(),
      locale: 'en',
      user: { user_id: SEED.USER_CONTROLLER },
      now: FIXED_NOW,
      timezone: 'UTC',
    });

    expect(prompt).not.toContain('## Onboarding');
  });
});
