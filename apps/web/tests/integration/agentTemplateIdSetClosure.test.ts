// tests/integration/agentTemplateIdSetClosure.test.ts
// Session 5.1 / Bug 2 regression: the valid-template_id allowlist
// in src/agent/prompts/validTemplateIds.ts must stay in sync with
// the agent.* + proposed_entry.* keys actually present in
// messages/en.json. Drift in either direction breaks:
//   - Agent-emits-unknown-template: next-intl throws "missing
//     translation" at UI render time (the EC-20 smoke test bug).
//   - Locale-has-key-agent-can't-use: dead i18n entries.
//
// Session 7 Commit 1 elevated the allowlist from a flat array
// to TEMPLATE_ID_PARAMS (template_id → Zod schema map).
// Session 7.1.1 split that map into AGENT_EMITTABLE_TEMPLATE_IDS
// (agent-selectable, rendered in the system prompt) and
// SERVER_EMITTED_TEMPLATE_IDS (orchestrator self-emit paths;
// agent.error.*). This test now reads the canonical set via the
// merged union so coverage continues to match every declared
// template_id, and adds a load-bearing negative assertion: no
// SERVER_EMITTED template_id may appear in the rendered
// validTemplateIdsSection() prompt section — enforces P21's
// isolation guarantee that Claude never sees agent.error.* as a
// selectable option.
//
// Set equality (not subset) of agent.* + proposed_entry.* keys in
// messages/en.json against the union of AGENT_EMITTABLE +
// SERVER_EMITTED + UI_ONLY_AGENT_KEYS.

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  AGENT_EMITTABLE_TEMPLATE_IDS,
  SERVER_EMITTED_TEMPLATE_IDS,
  UI_ONLY_AGENT_KEYS,
  validTemplateIdsSection,
} from '@/agent/prompts/validTemplateIds';

const AGENT_EMITTABLE_KEYS = Object.keys(AGENT_EMITTABLE_TEMPLATE_IDS);
const SERVER_EMITTED_KEYS = Object.keys(SERVER_EMITTED_TEMPLATE_IDS);
const VALID_TEMPLATE_IDS = [...AGENT_EMITTABLE_KEYS, ...SERVER_EMITTED_KEYS];

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

describe('agentTemplateIdSetClosure: template maps match messages/en.json', () => {
  const enPath = resolve(process.cwd(), 'messages/en.json');
  const en = JSON.parse(readFileSync(enPath, 'utf-8')) as Record<string, unknown>;
  const allKeys = flattenKeys(en);
  const namespacedKeys = allKeys.filter(
    (k) => k.startsWith('agent.') || k.startsWith('proposed_entry.'),
  );
  const namespacedSet = new Set(namespacedKeys);

  it('every AGENT_EMITTABLE_TEMPLATE_IDS key exists in messages/en.json', () => {
    for (const key of AGENT_EMITTABLE_KEYS) {
      expect(
        namespacedSet.has(key),
        `${key} is a key in AGENT_EMITTABLE_TEMPLATE_IDS but missing from messages/en.json`,
      ).toBe(true);
    }
  });

  it('every SERVER_EMITTED_TEMPLATE_IDS key exists in messages/en.json', () => {
    for (const key of SERVER_EMITTED_KEYS) {
      expect(
        namespacedSet.has(key),
        `${key} is a key in SERVER_EMITTED_TEMPLATE_IDS but missing from messages/en.json`,
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
      `Keys in messages/en.json not listed in AGENT_EMITTABLE / SERVER_EMITTED / UI_ONLY_AGENT_KEYS: ${unaccounted.join(', ')}`,
    ).toEqual([]);
  });

  it('no overlap between template_id maps and UI_ONLY_AGENT_KEYS', () => {
    const ids = new Set<string>(VALID_TEMPLATE_IDS);
    for (const ui of UI_ONLY_AGENT_KEYS) {
      expect(
        ids.has(ui),
        `${ui} appears in both a template_id map and UI_ONLY_AGENT_KEYS`,
      ).toBe(false);
    }
  });

  it('validTemplateIdsSection renders every AGENT_EMITTABLE_TEMPLATE_IDS key as a bullet', () => {
    const section = validTemplateIdsSection();
    for (const key of AGENT_EMITTABLE_KEYS) {
      expect(section).toContain(`\`${key}\``);
    }
    // And must not leak UI-only keys into the prompt.
    for (const key of UI_ONLY_AGENT_KEYS) {
      expect(section).not.toContain(`\`${key}\``);
    }
  });

  it('validTemplateIdsSection does NOT render any SERVER_EMITTED_TEMPLATE_IDS key (P21 isolation)', () => {
    // Load-bearing per Session 7.1.1 P21: Claude must never see
    // agent.error.* as a selectable option in the system prompt.
    // Isolation lives at the prompt-renderer layer; this assertion
    // locks the invariant into a test.
    const section = validTemplateIdsSection();
    for (const key of SERVER_EMITTED_KEYS) {
      expect(
        section,
        `validTemplateIdsSection must NOT contain SERVER_EMITTED key ${key} (would expose server-only template to Claude)`,
      ).not.toContain(`\`${key}\``);
    }
  });
});
