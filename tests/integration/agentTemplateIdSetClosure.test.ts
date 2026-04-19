// tests/integration/agentTemplateIdSetClosure.test.ts
// Session 5.1 / Bug 2 regression: the valid-template_id allowlist
// in src/agent/prompts/validTemplateIds.ts must stay in sync with
// the agent.* + proposed_entry.* keys actually present in
// messages/en.json. Drift in either direction breaks:
//   - Agent-emits-unknown-template: next-intl throws "missing
//     translation" at UI render time (the EC-20 smoke test bug).
//   - Locale-has-key-agent-can't-use: dead i18n entries.
//
// This test asserts the union of VALID_RESPONSE_TEMPLATE_IDS +
// UI_ONLY_AGENT_KEYS matches EXACTLY the set of agent.* +
// proposed_entry.* keys present in messages/en.json (set
// equality, not subset).

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  VALID_RESPONSE_TEMPLATE_IDS,
  UI_ONLY_AGENT_KEYS,
  validTemplateIdsSection,
} from '@/agent/prompts/validTemplateIds';

function flattenKeys(obj: Record<string, unknown>, prefix = ''): string[] {
  const out: string[] = [];
  for (const [k, v] of Object.entries(obj)) {
    const full = prefix === '' ? k : `${prefix}.${k}`;
    if (v !== null && typeof v === 'object') {
      out.push(...flattenKeys(v as Record<string, unknown>, full));
    } else {
      out.push(full);
    }
  }
  return out;
}

describe('agentTemplateIdSetClosure: validTemplateIds matches messages/en.json', () => {
  const enPath = resolve(process.cwd(), 'messages/en.json');
  const en = JSON.parse(readFileSync(enPath, 'utf-8')) as Record<string, unknown>;
  const allKeys = flattenKeys(en);
  const namespacedKeys = allKeys.filter(
    (k) => k.startsWith('agent.') || k.startsWith('proposed_entry.'),
  );
  const namespacedSet = new Set(namespacedKeys);

  it('every VALID_RESPONSE_TEMPLATE_IDS key exists in messages/en.json', () => {
    for (const key of VALID_RESPONSE_TEMPLATE_IDS) {
      expect(
        namespacedSet.has(key),
        `${key} is listed in VALID_RESPONSE_TEMPLATE_IDS but missing from messages/en.json`,
      ).toBe(true);
    }
  });

  it('every UI_ONLY_AGENT_KEYS key exists in messages/en.json', () => {
    for (const key of UI_ONLY_AGENT_KEYS) {
      expect(
        namespacedSet.has(key),
        `${key} is listed in UI_ONLY_AGENT_KEYS but missing from messages/en.json`,
      ).toBe(true);
    }
  });

  it('every agent.* or proposed_entry.* key in messages/en.json is accounted for', () => {
    const combined = new Set<string>([
      ...VALID_RESPONSE_TEMPLATE_IDS,
      ...UI_ONLY_AGENT_KEYS,
    ]);
    const unaccounted = namespacedKeys.filter((k) => !combined.has(k));
    expect(
      unaccounted,
      `Keys in messages/en.json not listed in VALID_RESPONSE_TEMPLATE_IDS or UI_ONLY_AGENT_KEYS: ${unaccounted.join(', ')}`,
    ).toEqual([]);
  });

  it('no overlap between VALID_RESPONSE_TEMPLATE_IDS and UI_ONLY_AGENT_KEYS', () => {
    const ids = new Set<string>(VALID_RESPONSE_TEMPLATE_IDS);
    for (const ui of UI_ONLY_AGENT_KEYS) {
      expect(
        ids.has(ui),
        `${ui} appears in both VALID_RESPONSE_TEMPLATE_IDS and UI_ONLY_AGENT_KEYS`,
      ).toBe(false);
    }
  });

  it('validTemplateIdsSection renders each valid template_id as a bullet', () => {
    const section = validTemplateIdsSection();
    for (const key of VALID_RESPONSE_TEMPLATE_IDS) {
      expect(section).toContain(`\`${key}\``);
    }
    // And must not leak UI-only keys into the prompt.
    for (const key of UI_ONLY_AGENT_KEYS) {
      expect(section).not.toContain(`\`${key}\``);
    }
  });
});
