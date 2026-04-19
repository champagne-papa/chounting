// tests/integration/agentTemplateIdSetClosure.test.ts
// Session 5.1 / Bug 2 regression: the valid-template_id allowlist
// in src/agent/prompts/validTemplateIds.ts must stay in sync with
// the agent.* + proposed_entry.* keys actually present in
// messages/en.json. Drift in either direction breaks:
//   - Agent-emits-unknown-template: next-intl throws "missing
//     translation" at UI render time (the EC-20 smoke test bug).
//   - Locale-has-key-agent-can't-use: dead i18n entries.
//
// Session 7 Commit 1 elevated VALID_RESPONSE_TEMPLATE_IDS from a
// flat array to TEMPLATE_ID_PARAMS — a template_id → Zod schema
// map. This test now reads the canonical set via
// Object.keys(TEMPLATE_ID_PARAMS) so it tracks the schema map
// directly. The derived VALID_RESPONSE_TEMPLATE_IDS export is
// kept as a back-compat re-export but is not the source of truth.
//
// Set equality (not subset) of agent.* + proposed_entry.* keys in
// messages/en.json against the union of TEMPLATE_ID_PARAMS keys +
// UI_ONLY_AGENT_KEYS.

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  TEMPLATE_ID_PARAMS,
  UI_ONLY_AGENT_KEYS,
  validTemplateIdsSection,
} from '@/agent/prompts/validTemplateIds';

const VALID_TEMPLATE_IDS = Object.keys(TEMPLATE_ID_PARAMS);

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

describe('agentTemplateIdSetClosure: TEMPLATE_ID_PARAMS matches messages/en.json', () => {
  const enPath = resolve(process.cwd(), 'messages/en.json');
  const en = JSON.parse(readFileSync(enPath, 'utf-8')) as Record<string, unknown>;
  const allKeys = flattenKeys(en);
  const namespacedKeys = allKeys.filter(
    (k) => k.startsWith('agent.') || k.startsWith('proposed_entry.'),
  );
  const namespacedSet = new Set(namespacedKeys);

  it('every TEMPLATE_ID_PARAMS key exists in messages/en.json', () => {
    for (const key of VALID_TEMPLATE_IDS) {
      expect(
        namespacedSet.has(key),
        `${key} is a key in TEMPLATE_ID_PARAMS but missing from messages/en.json`,
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
      ...VALID_TEMPLATE_IDS,
      ...UI_ONLY_AGENT_KEYS,
    ]);
    const unaccounted = namespacedKeys.filter((k) => !combined.has(k));
    expect(
      unaccounted,
      `Keys in messages/en.json not listed in TEMPLATE_ID_PARAMS or UI_ONLY_AGENT_KEYS: ${unaccounted.join(', ')}`,
    ).toEqual([]);
  });

  it('no overlap between TEMPLATE_ID_PARAMS keys and UI_ONLY_AGENT_KEYS', () => {
    const ids = new Set<string>(VALID_TEMPLATE_IDS);
    for (const ui of UI_ONLY_AGENT_KEYS) {
      expect(
        ids.has(ui),
        `${ui} appears in both TEMPLATE_ID_PARAMS and UI_ONLY_AGENT_KEYS`,
      ).toBe(false);
    }
  });

  it('validTemplateIdsSection renders each valid template_id as a bullet', () => {
    const section = validTemplateIdsSection();
    for (const key of VALID_TEMPLATE_IDS) {
      expect(section).toContain(`\`${key}\``);
    }
    // And must not leak UI-only keys into the prompt.
    for (const key of UI_ONLY_AGENT_KEYS) {
      expect(section).not.toContain(`\`${key}\``);
    }
  });
});
