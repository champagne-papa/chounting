// tests/integration/buildSystemPromptTemporal.test.ts
// CA-84: buildSystemPrompt prefixes a temporal context block
// emitting current date as dual UTC + org-local stamps. Site 1
// of O3 (per docs/09_briefs/phase-1.2/session-8-c6-prereq-o3-
// agent-date-context.md §5.b). Block is positioned as a prefix
// before the persona body so tool descriptions referencing
// "the Current date above" resolve to a true positional anchor.

import { describe, it, expect } from 'vitest';
import { buildSystemPrompt } from '@/agent/orchestrator/buildSystemPrompt';
import { SEED } from '../setup/testDb';
import { makeOrgContextFixture } from '../fixtures/agent/orgContextFixture';

// FIXED_NOW is deliberately chosen to match the spec's example stamps
// (2026-04-21) for readability when comparing test output to the spec.
// It is arbitrary otherwise; any fixed Date works. Do not change to
// `new Date()` — determinism is load-bearing (tests depend on the ISO
// date string matching the asserted substrings).
const FIXED_NOW = new Date('2026-04-21T00:00:00Z');

describe('CA-84: buildSystemPrompt temporal context', () => {
  it('renders the temporal block for signed-in (controller + non-null orgContext)', () => {
    const prompt = buildSystemPrompt({
      persona: 'controller',
      orgContext: makeOrgContextFixture(),
      locale: 'en',
      user: { user_id: SEED.USER_CONTROLLER, display_name: 'Jamie' },
      now: FIXED_NOW,
    });

    expect(prompt).toContain('Current date: 2026-04-21 (ISO 8601, UTC)');
    expect(prompt).toContain('Today (org-local): 2026-04-21 (UTC — org timezone not yet configured; Phase 2 will resolve from organizations.timezone)');
  });

  it('renders the temporal block for onboarding (controller + null orgContext)', () => {
    const prompt = buildSystemPrompt({
      persona: 'controller',
      orgContext: null,
      locale: 'en',
      user: { user_id: SEED.USER_CONTROLLER, display_name: 'Jamie' },
      now: FIXED_NOW,
    });

    expect(prompt).toContain('Current date: 2026-04-21 (ISO 8601, UTC)');
    expect(prompt).toContain('Today (org-local): 2026-04-21 (UTC — org timezone not yet configured; Phase 2 will resolve from organizations.timezone)');
  });

  it('renders both UTC and org-local stamps with identical UTC values under Phase 1.2', () => {
    const prompt = buildSystemPrompt({
      persona: 'controller',
      orgContext: makeOrgContextFixture(),
      locale: 'en',
      user: { user_id: SEED.USER_CONTROLLER, display_name: 'Jamie' },
      now: FIXED_NOW,
    });

    // Both stamps must be present
    expect(prompt).toContain('Current date:');
    expect(prompt).toContain('Today (org-local):');

    // Phase 1.2 (route ii — UTC-only): both stamps share the same
    // ISO date value; Phase 2 will diverge them when
    // organizations.timezone resolves to a non-UTC IANA TZ.
    // See OI-2 in the O3 spec.
    const utcMatch = prompt.match(/Current date: (\d{4}-\d{2}-\d{2})/);
    const orgLocalMatch = prompt.match(/Today \(org-local\): (\d{4}-\d{2}-\d{2})/);
    expect(utcMatch?.[1]).toBe('2026-04-21');
    expect(orgLocalMatch?.[1]).toBe('2026-04-21');
    expect(utcMatch?.[1]).toBe(orgLocalMatch?.[1]);
  });

  // T4: temporal block is the literal first section in the rendered
  // prompt, parameterized over all three personas for cross-persona
  // invariance. The startsWith assertion is persona-invariant — it
  // tests the prefix-not-suffix design intent directly without
  // depending on any persona-specific identityBlock string.
  describe.each([
    { persona: 'controller', userId: SEED.USER_CONTROLLER },
    { persona: 'ap_specialist', userId: SEED.USER_AP_SPECIALIST },
    { persona: 'executive', userId: SEED.USER_EXECUTIVE },
  ] as const)('temporal block is the first section in the rendered prompt — $persona', ({ persona, userId }) => {
    it(`temporal block is the first section in the rendered prompt for ${persona}`, () => {
      const prompt = buildSystemPrompt({
        persona,
        orgContext: makeOrgContextFixture(),
        locale: 'en',
        user: { user_id: userId },
        now: FIXED_NOW,
      });

      expect(prompt.startsWith('Current date:')).toBe(true);
    });
  });
});
