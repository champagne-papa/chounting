// tests/unit/i18nLocaleParity.test.ts
// CA-51: i18n locale file parity. Every key in messages/en.json
// must have a corresponding key in messages/fr-CA.json AND
// messages/zh-Hant.json, recursively. Per
// docs/04_engineering/conventions.md i18n conventions:
// "Every key in en.json must have a corresponding key in both
// other locale files, even if the value is still English.
// Empty strings render as blank UI; missing keys throw at
// runtime in next-intl dev mode."
//
// Unit test (no DB access) — reads the JSON files via fs.

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function loadLocale(name: string): Record<string, unknown> {
  const path = resolve(process.cwd(), 'messages', `${name}.json`);
  return JSON.parse(readFileSync(path, 'utf-8'));
}

/** Walk the object tree and return every dotted key path. */
function collectKeyPaths(obj: unknown, prefix = ''): string[] {
  if (obj === null || typeof obj !== 'object' || Array.isArray(obj)) {
    return [prefix];
  }
  const paths: string[] = [];
  for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
    const next = prefix ? `${prefix}.${k}` : k;
    paths.push(...collectKeyPaths(v, next));
  }
  return paths;
}

describe('CA-51: i18n locale file parity', () => {
  const en = loadLocale('en');
  const frCA = loadLocale('fr-CA');
  const zhHant = loadLocale('zh-Hant');

  const enKeys = new Set(collectKeyPaths(en));
  const frCAKeys = new Set(collectKeyPaths(frCA));
  const zhHantKeys = new Set(collectKeyPaths(zhHant));

  it('en.json and fr-CA.json have identical key sets', () => {
    const inEnNotFr = [...enKeys].filter((k) => !frCAKeys.has(k));
    const inFrNotEn = [...frCAKeys].filter((k) => !enKeys.has(k));
    expect(inEnNotFr).toEqual([]);
    expect(inFrNotEn).toEqual([]);
  });

  it('en.json and zh-Hant.json have identical key sets', () => {
    const inEnNotZh = [...enKeys].filter((k) => !zhHantKeys.has(k));
    const inZhNotEn = [...zhHantKeys].filter((k) => !enKeys.has(k));
    expect(inEnNotZh).toEqual([]);
    expect(inZhNotEn).toEqual([]);
  });

  it('carries the Session 3 template_ids (spot check)', () => {
    const required = [
      'agent.greeting.welcome',
      'agent.accounts.listed',
      'agent.entry.proposed',
      'agent.error.tool_validation_failed',
      'agent.error.structured_response_missing',
      'proposed_entry.what_changed',
      'proposed_entry.why.rule_matched',
      'proposed_entry.why.novel_pattern',
      'proposed_entry.track_record.no_rule',
      'proposed_entry.if_rejected.journal_entry',
      'proposed_entry.if_rejected.reversal',
      'proposed_entry.policy.approve_required',
    ];
    for (const key of required) {
      expect(enKeys.has(key), `en.json missing ${key}`).toBe(true);
      expect(frCAKeys.has(key), `fr-CA.json missing ${key}`).toBe(true);
      expect(zhHantKeys.has(key), `zh-Hant.json missing ${key}`).toBe(true);
    }
  });
});
