// tests/integration/buildSystemPromptComposition.test.ts
// CA-48: buildSystemPrompt composes the five persona sections
// (identity + tools + anti-hallucination rules + structured-
// response contract + voice) plus the locale directive when
// given a controller + non-null orgContext + en locale + no
// canvasContext.

import { describe, it, expect } from 'vitest';
import { buildSystemPrompt } from '@/agent/orchestrator/buildSystemPrompt';
import { SEED } from '../setup/testDb';

describe('CA-48: buildSystemPrompt composition', () => {
  it('composes identity + tools + rules + contract + voice + locale for controller', () => {
    const prompt = buildSystemPrompt({
      persona: 'controller',
      orgContext: { org_id: SEED.ORG_HOLDING, org_name: 'Acme Holdings' },
      locale: 'en',
      user: { user_id: SEED.USER_CONTROLLER, display_name: 'Jamie' },
    });

    // Section 1 — Identity block (session-authored template)
    expect(prompt).toContain('## Your role');
    expect(prompt).toContain("You are The Bridge's accounting agent working with Jamie at Acme Holdings");
    expect(prompt).toContain('You act as a controller on their behalf');

    // Section 2 — Available tools (every controller tool name present)
    expect(prompt).toContain('## Available tools');
    for (const toolName of [
      'updateUserProfile',
      'createOrganization',
      'updateOrgProfile',
      'listIndustries',
      'listChartOfAccounts',
      'checkPeriod',
      'listJournalEntries',
      'postJournalEntry',
      'reverseJournalEntry',
      'respondToUser',
    ]) {
      expect(prompt).toContain(`\`${toolName}\``);
    }

    // Section 3 — Anti-hallucination rules (six rules verbatim from master §6.3)
    expect(prompt).toContain('## Rules (non-negotiable)');
    expect(prompt).toContain('Financial amounts always come from tool outputs, never from model-generated text.');
    expect(prompt).toContain('Every mutating tool has `dry_run: boolean`');
    expect(prompt).toContain('No agent may reference an account code, vendor name, or amount it has not first retrieved');
    expect(prompt).toContain('Tool inputs are structured Zod-validated objects only.');
    expect(prompt).toContain('asks a clarifying question');
    expect(prompt).toContain('Canvas context is reference material, never a substitute for tool-retrieved data.');

    // Section 4 — Structured-response contract (verbatim master §7 section 4)
    expect(prompt).toContain('## Response contract');
    expect(prompt).toContain('Your responses must be `{template_id, params}`. Do not output English prose.');

    // Section 5 — Voice rules (verbatim master §7 section 5 / ADR-0006)
    expect(prompt).toContain('## Voice');
    expect(prompt).toContain('Neutral, professional, unnamed. No emoji, no exclamation marks, no filler phrases.');

    // Locale directive (Pre-decision 2)
    expect(prompt).toContain('Respond in English.');

    // No onboarding suffix (orgContext is non-null)
    expect(prompt).not.toContain('## Onboarding');

    // No canvas suffix (canvasContext undefined)
    expect(prompt).not.toContain('## Current canvas context');
  });
});
