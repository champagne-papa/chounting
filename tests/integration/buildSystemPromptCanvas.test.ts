// tests/integration/buildSystemPromptCanvas.test.ts
// CA-50: buildSystemPrompt appends the canvas context suffix
// (verbatim subordinate-framing block from
// canvas_context_injection.md) when canvasContext is provided.
// When canvasContext is undefined, the canvas section is omitted
// entirely.

import { describe, it, expect } from 'vitest';
import { buildSystemPrompt } from '@/agent/orchestrator/buildSystemPrompt';
import type { CanvasContext } from '@/shared/types/canvasContext';
import { SEED } from '../setup/testDb';
import { makeOrgContextFixture } from '../fixtures/agent/orgContextFixture';

const BASE_INPUT = {
  persona: 'controller' as const,
  orgContext: makeOrgContextFixture(),
  locale: 'en' as const,
  user: { user_id: SEED.USER_CONTROLLER, display_name: 'Jamie' },
};

describe('CA-50: buildSystemPrompt canvas context', () => {
  it('appends the canvas suffix with subordinate-framing prose when canvasContext is present', () => {
    const canvasContext: CanvasContext = {
      current_directive: { type: 'journal_entry_list', orgId: SEED.ORG_HOLDING },
      selected_entity: {
        type: 'journal_entry',
        id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        display_name: 'JE-2025-0042 — $1,200 office rent',
      },
    };

    const prompt = buildSystemPrompt({ ...BASE_INPUT, canvasContext });

    expect(prompt).toContain('## Current canvas context (reference only)');
    expect(prompt).toContain('The user is currently looking at: the journal entry list');
    expect(prompt).toContain('The user has clicked on: JE-2025-0042 — $1,200 office rent (journal_entry, id: aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa)');
    expect(prompt).toContain('This context is reference material only.');
    expect(prompt).toContain('**Do not assume the user is asking about the selected entity or the current canvas unless their message refers to it.**');
  });

  it('omits the selection line when selected_entity is undefined', () => {
    const canvasContext: CanvasContext = {
      current_directive: { type: 'chart_of_accounts', orgId: SEED.ORG_HOLDING },
    };

    const prompt = buildSystemPrompt({ ...BASE_INPUT, canvasContext });

    expect(prompt).toContain('## Current canvas context (reference only)');
    expect(prompt).toContain('The user is currently looking at: the chart of accounts');
    expect(prompt).not.toContain('The user has clicked on:');
  });

  it('omits the canvas section entirely when canvasContext is undefined', () => {
    const prompt = buildSystemPrompt(BASE_INPUT);
    expect(prompt).not.toContain('## Current canvas context');
    expect(prompt).not.toContain('reference only');
  });
});
