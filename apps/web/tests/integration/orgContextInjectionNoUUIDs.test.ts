// tests/integration/orgContextInjectionNoUUIDs.test.ts
// CA-54: buildSystemPrompt with non-null OrgContext produces a
// prompt that contains the org's human-readable fields and
// contains zero v4 UUIDs. Both positive and negative assertions
// per Clarification B.

import { describe, it, expect } from 'vitest';
import { buildSystemPrompt } from '@/agent/orchestrator/buildSystemPrompt';
import { loadOrgContext } from '@/agent/memory/orgContextManager';
import { SEED } from '../setup/testDb';

const UUID_V4_REGEX =
  /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;
const FIXED_NOW = new Date('2026-04-21T00:00:00Z');

describe('CA-54: OrgContext injection — positive + negative assertions', () => {
  it('includes org_name, industry_display_name, functional_currency, and controller display_name; excludes any UUIDs', async () => {
    const orgContext = await loadOrgContext(SEED.ORG_HOLDING);

    const prompt = buildSystemPrompt({
      persona: 'controller',
      orgContext,
      locale: 'en',
      user: {
        user_id: SEED.USER_CONTROLLER,
        display_name: 'Controller User',
      },
      now: FIXED_NOW,
      timezone: 'UTC',
    });

    // Positive assertions — the human-readable fields are present.
    expect(prompt).toContain(orgContext.org_name);
    expect(prompt).toContain(orgContext.industry_display_name);
    expect(prompt).toContain(orgContext.functional_currency);
    // At least one controller's display_name must surface.
    expect(orgContext.controllers.length).toBeGreaterThan(0);
    const someControllerName = orgContext.controllers[0].display_name;
    expect(prompt).toContain(someControllerName);

    // Negative assertion — no v4 UUIDs leak into the prompt.
    // The regex is the full v4 shape so partial hex substrings
    // don't escape detection.
    const uuidMatch = prompt.match(UUID_V4_REGEX);
    expect(
      uuidMatch,
      uuidMatch
        ? `Prompt contains UUID "${uuidMatch[0]}" — Pre-decision 1 forbids UUIDs in prompt prose`
        : undefined,
    ).toBeNull();
  });
});
