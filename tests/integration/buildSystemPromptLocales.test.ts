// tests/integration/buildSystemPromptLocales.test.ts
// CA-52: the locale parameter flows into the prompt. Three
// baseline prompts with different locales differ from each other,
// and the diff is the locale-directive segment.

import { describe, it, expect } from 'vitest';
import { buildSystemPrompt } from '@/agent/orchestrator/buildSystemPrompt';
import { SEED } from '../setup/testDb';
import { makeOrgContextFixture } from '../fixtures/agent/orgContextFixture';

const FIXED_NOW = new Date('2026-04-21T00:00:00Z');

const BASE_INPUT = {
  persona: 'controller' as const,
  orgContext: makeOrgContextFixture(),
  user: { user_id: SEED.USER_CONTROLLER, display_name: 'Jamie' },
  now: FIXED_NOW,
};

describe('CA-52: buildSystemPrompt locale directive', () => {
  const en = buildSystemPrompt({ ...BASE_INPUT, locale: 'en' });
  const frCA = buildSystemPrompt({ ...BASE_INPUT, locale: 'fr-CA' });
  const zhHant = buildSystemPrompt({ ...BASE_INPUT, locale: 'zh-Hant' });

  it('each locale produces its own directive line', () => {
    expect(en).toContain('Respond in English.');
    expect(frCA).toContain('Répondez en français canadien.');
    expect(zhHant).toContain('請以繁體中文回應。');
  });

  it('the three outputs differ from each other', () => {
    expect(en).not.toBe(frCA);
    expect(en).not.toBe(zhHant);
    expect(frCA).not.toBe(zhHant);
  });

  it('the only difference is the locale directive', () => {
    // Stripping each locale's directive should equalize the three
    // outputs (the persona, identity, tools, rules, contract,
    // voice sections are locale-independent).
    const strip = (s: string, directive: string) => s.replace(directive, '<DIRECTIVE>');
    const enStripped = strip(en, 'Respond in English.');
    const frStripped = strip(frCA, 'Répondez en français canadien.');
    const zhStripped = strip(zhHant, '請以繁體中文回應。');

    expect(enStripped).toBe(frStripped);
    expect(enStripped).toBe(zhStripped);
  });
});
