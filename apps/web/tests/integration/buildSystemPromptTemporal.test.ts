// tests/integration/buildSystemPromptTemporal.test.ts
// CA-84 + OI-2 fix-stack item 1: buildSystemPrompt prefixes a
// temporal-context block emitting current date. Originally Site 1
// of O3 (per docs/09_briefs/phase-1.2/session-8-c6-prereq-o3-
// agent-date-context.md §5.b). The OI-2 fix-stack foundation
// commit replaced the Phase-1.2 dual-UTC placeholder with real
// timezone-aware rendering: when timezone === 'UTC' a single line
// is emitted; otherwise dual UTC + org-local stamps using
// Intl.DateTimeFormat. Also asserts the optional resolved-entry-
// date section that the orchestrator's resolveRelativeDate feeds
// in for point-token prompts.

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

// Rollover fixture: 03:00 UTC on 2026-04-26 is 20:00 PDT on
// 2026-04-25 in America/Vancouver. UTC and local stamps diverge.
const ROLLOVER_NOW = new Date('2026-04-26T03:00:00Z');

describe('CA-84: buildSystemPrompt temporal context — UTC single-line', () => {
  it('renders a single Current date line for signed-in (controller + non-null orgContext)', () => {
    const prompt = buildSystemPrompt({
      persona: 'controller',
      orgContext: makeOrgContextFixture(),
      locale: 'en',
      user: { user_id: SEED.USER_CONTROLLER, display_name: 'Jamie' },
      now: FIXED_NOW,
      timezone: 'UTC',
    });

    expect(prompt).toContain('Current date: 2026-04-21 (ISO 8601, UTC)');
    // UTC single-line emit: no "Today (org-local):" line, no
    // Phase-2 placeholder boilerplate.
    expect(prompt).not.toContain('Today (org-local):');
    expect(prompt).not.toContain('Phase 2 will resolve');
  });

  it('renders a single Current date line for onboarding (controller + null orgContext)', () => {
    const prompt = buildSystemPrompt({
      persona: 'controller',
      orgContext: null,
      locale: 'en',
      user: { user_id: SEED.USER_CONTROLLER, display_name: 'Jamie' },
      now: FIXED_NOW,
      timezone: 'UTC',
    });

    expect(prompt).toContain('Current date: 2026-04-21 (ISO 8601, UTC)');
    expect(prompt).not.toContain('Today (org-local):');
    expect(prompt).not.toContain('Phase 2 will resolve');
  });
});

describe('CA-84: buildSystemPrompt temporal context — IANA tz dual stamps', () => {
  it('emits dual stamps with diverged dates at the rollover boundary (Vancouver UTC-7)', () => {
    const prompt = buildSystemPrompt({
      persona: 'controller',
      orgContext: makeOrgContextFixture(),
      locale: 'en',
      user: { user_id: SEED.USER_CONTROLLER, display_name: 'Jamie' },
      now: ROLLOVER_NOW,
      timezone: 'America/Vancouver',
    });

    expect(prompt).toContain('Current date: 2026-04-26 (ISO 8601, UTC)');
    expect(prompt).toContain('Today (org-local): 2026-04-25 (America/Vancouver)');
    // Phase-2 placeholder is fully gone post-foundation-commit.
    expect(prompt).not.toContain('Phase 2 will resolve');
    expect(prompt).not.toContain('org timezone not yet configured');
  });

  it('emits dual stamps with same date when there is no rollover (mid-day UTC, Vancouver UTC-7)', () => {
    const prompt = buildSystemPrompt({
      persona: 'controller',
      orgContext: makeOrgContextFixture(),
      locale: 'en',
      user: { user_id: SEED.USER_CONTROLLER, display_name: 'Jamie' },
      now: new Date('2026-04-21T18:00:00Z'),
      timezone: 'America/Vancouver',
    });

    expect(prompt).toContain('Current date: 2026-04-21 (ISO 8601, UTC)');
    expect(prompt).toContain('Today (org-local): 2026-04-21 (America/Vancouver)');
  });
});

describe('CA-84: buildSystemPrompt temporal block prefix positioning', () => {
  // T4: temporal block is the literal first section in the rendered
  // prompt, parameterized over all three personas for cross-persona
  // invariance. The startsWith assertion is persona-invariant — it
  // tests the prefix-not-suffix design intent directly without
  // depending on any persona-specific identityBlock string.
  describe.each([
    { persona: 'controller', userId: SEED.USER_CONTROLLER },
    { persona: 'ap_specialist', userId: SEED.USER_AP_SPECIALIST },
    { persona: 'executive', userId: SEED.USER_EXECUTIVE },
  ] as const)(
    'temporal block is the first section in the rendered prompt — $persona',
    ({ persona, userId }) => {
      it(`UTC: temporal block is the first section in the rendered prompt for ${persona}`, () => {
        const prompt = buildSystemPrompt({
          persona,
          orgContext: makeOrgContextFixture(),
          locale: 'en',
          user: { user_id: userId },
          now: FIXED_NOW,
          timezone: 'UTC',
        });

        expect(prompt.startsWith('Current date:')).toBe(true);
      });

      it(`IANA tz: temporal block is the first section for ${persona}`, () => {
        const prompt = buildSystemPrompt({
          persona,
          orgContext: makeOrgContextFixture(),
          locale: 'en',
          user: { user_id: userId },
          now: ROLLOVER_NOW,
          timezone: 'America/Vancouver',
        });

        expect(prompt.startsWith('Current date:')).toBe(true);
      });
    },
  );
});

describe('CA-84: temporal-block cross-section anchors', () => {
  // T5: checkPeriod's recovery instruction (Site 2) references the
  // temporal anchor "the Current date above" — verifies the prefix
  // positioning makes the cross-section reference true positional.
  // checkPeriod is out of scope for the OI-2 foundation commit, so
  // its reference to "the Current date above" stays unchanged.
  it('checkPeriod tool description references "the Current date above"', () => {
    const prompt = buildSystemPrompt({
      persona: 'controller',
      orgContext: makeOrgContextFixture(),
      locale: 'en',
      user: { user_id: SEED.USER_CONTROLLER, display_name: 'Jamie' },
      now: FIXED_NOW,
      timezone: 'UTC',
    });

    const checkPeriodBulletStart = prompt.indexOf('`checkPeriod`');
    expect(checkPeriodBulletStart).toBeGreaterThan(-1);

    const nextToolBoundary = prompt.indexOf('\n- `', checkPeriodBulletStart + 1);
    const checkPeriodBulletBody =
      nextToolBoundary === -1
        ? prompt.slice(checkPeriodBulletStart)
        : prompt.slice(checkPeriodBulletStart, nextToolBoundary);
    expect(checkPeriodBulletBody).toContain('the Current date above');
  });

  // T6 (post-OI-2): postJournalEntry's description was rewritten in
  // the foundation commit. It no longer asks the agent to do date
  // arithmetic; it points at the orchestrator's resolved entry_date.
  // Anchor the assertion on the new wording rather than the old
  // "Current date above" phrase.
  it('postJournalEntry tool description points to the resolved entry_date and forbids date arithmetic', () => {
    const prompt = buildSystemPrompt({
      persona: 'controller',
      orgContext: makeOrgContextFixture(),
      locale: 'en',
      user: { user_id: SEED.USER_CONTROLLER, display_name: 'Jamie' },
      now: FIXED_NOW,
      timezone: 'UTC',
    });

    const postJournalBulletStart = prompt.indexOf('`postJournalEntry`');
    expect(postJournalBulletStart).toBeGreaterThan(-1);

    const nextToolBoundary = prompt.indexOf('\n- `', postJournalBulletStart + 1);
    const postJournalBulletBody =
      nextToolBoundary === -1
        ? prompt.slice(postJournalBulletStart)
        : prompt.slice(postJournalBulletStart, nextToolBoundary);
    expect(postJournalBulletBody).toContain('Resolved entry_date for this turn');
    expect(postJournalBulletBody).toContain('Do not perform date arithmetic');
  });
});

describe('CA-84: resolved-entry-date section', () => {
  it('appends the resolved-entry-date line when resolvedEntryDate is provided', () => {
    const prompt = buildSystemPrompt({
      persona: 'controller',
      orgContext: makeOrgContextFixture(),
      locale: 'en',
      user: { user_id: SEED.USER_CONTROLLER, display_name: 'Jamie' },
      now: FIXED_NOW,
      timezone: 'UTC',
      resolvedEntryDate: { date: '2026-04-20', sourcePhrase: 'yesterday' },
    });

    expect(prompt).toContain(
      'Resolved entry_date for this turn: 2026-04-20 (from phrase: "yesterday")',
    );
  });

  it('omits the resolved-entry-date line when resolvedEntryDate is undefined', () => {
    const prompt = buildSystemPrompt({
      persona: 'controller',
      orgContext: makeOrgContextFixture(),
      locale: 'en',
      user: { user_id: SEED.USER_CONTROLLER, display_name: 'Jamie' },
      now: FIXED_NOW,
      timezone: 'UTC',
    });

    // Anchor on the colon-suffix form: the section line is
    // `Resolved entry_date for this turn: <date> ...`. The bare
    // phrase (no colon) appears inside the postJournalEntry tool
    // description as a quoted reference, so an unqualified
    // not.toContain would false-positive on that.
    expect(prompt).not.toContain('Resolved entry_date for this turn:');
  });

  it('positions the resolved-entry-date line immediately after the temporal block', () => {
    const prompt = buildSystemPrompt({
      persona: 'controller',
      orgContext: makeOrgContextFixture(),
      locale: 'en',
      user: { user_id: SEED.USER_CONTROLLER, display_name: 'Jamie' },
      now: ROLLOVER_NOW,
      timezone: 'America/Vancouver',
      resolvedEntryDate: { date: '2026-04-25', sourcePhrase: 'today' },
    });

    const localLineIdx = prompt.indexOf('Today (org-local):');
    const resolvedIdx = prompt.indexOf('Resolved entry_date for this turn:');
    expect(localLineIdx).toBeGreaterThan(-1);
    expect(resolvedIdx).toBeGreaterThan(localLineIdx);
    // Nothing else interposed: between the two anchors there are
    // only newlines (the two sections are joined by '\n\n').
    const between = prompt.slice(
      prompt.indexOf('\n', localLineIdx),
      resolvedIdx,
    );
    expect(between.trim()).toBe('');
  });
});
