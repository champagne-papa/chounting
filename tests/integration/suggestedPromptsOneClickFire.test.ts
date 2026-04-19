// tests/integration/suggestedPromptsOneClickFire.test.ts
// Phase 1.2 Session 7 Commit 3 — SuggestedPrompts one-click-fire
// contract per sub-brief §4 Commit 3.
//
// No jsdom is set up in this suite (environment: 'node' per
// vitest.config.ts), so rather than mounting React, this test
// asserts the contract surface directly at the two layers the
// component sits on:
//
//   1. PROMPT_SLUGS — the persona → slug map is exhaustive
//      across the UserRole union.
//   2. Locale parity — every persona.slug pair resolves to a
//      non-empty string in messages/en.json (and its siblings
//      fr-CA.json / zh-Hant.json as smoke checks).
//
// The click-fire contract itself is a one-liner: the button's
// onClick calls onSelect(text). What matters for correctness is
// that `text` (resolved by useTranslations) is a real string the
// parent can forward to its send path — which requires the
// locale keys to exist. The existing agentTemplateParamsClosure
// test covers response-template parity; this test covers the
// UI-only suggestion keys that live alongside them.

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { PROMPT_SLUGS } from '@/components/bridge/SuggestedPrompts';

function loadLocale(file: string): Record<string, unknown> {
  const p = resolve(process.cwd(), 'messages', file);
  return JSON.parse(readFileSync(p, 'utf-8')) as Record<string, unknown>;
}

function getAtPath(obj: Record<string, unknown>, path: string): unknown {
  return path.split('.').reduce<unknown>((acc, key) => {
    if (acc !== null && typeof acc === 'object' && key in acc) {
      return (acc as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj);
}

describe('SuggestedPrompts — one-click-fire contract', () => {
  it('PROMPT_SLUGS covers every UserRole with at least one slug', () => {
    const roles = Object.keys(PROMPT_SLUGS);
    expect(roles).toEqual(
      expect.arrayContaining(['controller', 'ap_specialist', 'executive']),
    );
    for (const role of roles) {
      const slugs = PROMPT_SLUGS[role as keyof typeof PROMPT_SLUGS];
      expect(slugs.length).toBeGreaterThan(0);
    }
  });

  it('every (persona, slug) pair resolves to a non-empty string in messages/en.json', () => {
    const en = loadLocale('en.json');
    for (const [role, slugs] of Object.entries(PROMPT_SLUGS)) {
      for (const slug of slugs) {
        const key = `agent.suggestions.${role}.${slug}`;
        const value = getAtPath(en, key);
        expect(typeof value).toBe('string');
        expect((value as string).length).toBeGreaterThan(0);
      }
    }
  });

  it('fr-CA.json and zh-Hant.json carry the same keys (English-fallback strings allowed)', () => {
    const fr = loadLocale('fr-CA.json');
    const zh = loadLocale('zh-Hant.json');
    for (const [role, slugs] of Object.entries(PROMPT_SLUGS)) {
      for (const slug of slugs) {
        const key = `agent.suggestions.${role}.${slug}`;
        const fVal = getAtPath(fr, key);
        const zVal = getAtPath(zh, key);
        expect(typeof fVal).toBe('string');
        expect((fVal as string).length).toBeGreaterThan(0);
        expect(typeof zVal).toBe('string');
        expect((zVal as string).length).toBeGreaterThan(0);
      }
    }
  });

  it('each slug is a unique string within its persona (no accidental duplicate keys)', () => {
    for (const [role, slugs] of Object.entries(PROMPT_SLUGS)) {
      const uniq = new Set(slugs);
      expect(uniq.size).toBe(slugs.length);
      // role used in the assertion failure message when a
      // duplicate surfaces during future edits.
      expect(role).toBeTruthy();
    }
  });
});
