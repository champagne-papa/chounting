// tests/integration/agentTemplateParamsClosure.test.ts
// Session 7 Commit 1 — bidirectional parity between each
// TEMPLATE_ID_PARAMS schema's declared field set and the
// {placeholder} tokens in messages/en.json's corresponding string.
//
// Failure modes this catches:
//   - Schema declares a field the locale string never references
//     → param is unused; potential silent truncation of agent
//     intent at the UI.
//   - Locale string has a {placeholder} the schema doesn't declare
//     → next-intl renders the literal token (e.g. "{user_name}")
//     in user-facing text instead of the value.
//
// en.json is authoritative; fr-CA.json and zh-Hant.json are
// English fallbacks in Phase 1.2 (cross-locale placeholder
// parity is a Phase 2 follow-up — see sub-brief §9).

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { z } from 'zod';
import { TEMPLATE_ID_PARAMS } from '@/agent/prompts/validTemplateIds';

function getValueAtPath(obj: Record<string, unknown>, path: string): unknown {
  return path.split('.').reduce<unknown>((acc, key) => {
    if (acc !== null && typeof acc === 'object' && key in acc) {
      return (acc as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj);
}

function extractPlaceholders(s: string): Set<string> {
  // Matches next-intl-style {token} placeholders. Restricted to
  // identifier-ish characters so escaped braces or formatted
  // expressions don't trip the parser.
  const matches = s.match(/\{([A-Za-z_][A-Za-z0-9_]*)\}/g) ?? [];
  return new Set(matches.map((m) => m.slice(1, -1)));
}

function schemaShapeKeys(schema: z.ZodTypeAny): Set<string> {
  if (!(schema instanceof z.ZodObject)) {
    throw new Error('TEMPLATE_ID_PARAMS schemas must be ZodObject instances');
  }
  return new Set(Object.keys(schema.shape as Record<string, z.ZodTypeAny>));
}

describe('agentTemplateParamsClosure: schema fields ↔ en.json placeholders', () => {
  const enPath = resolve(process.cwd(), 'messages/en.json');
  const en = JSON.parse(readFileSync(enPath, 'utf-8')) as Record<string, unknown>;

  for (const [template_id, schema] of Object.entries(TEMPLATE_ID_PARAMS)) {
    it(`${template_id}: schema field set equals en.json placeholder set`, () => {
      const value = getValueAtPath(en, template_id);
      expect(
        typeof value,
        `messages/en.json is missing a string at path ${template_id}`,
      ).toBe('string');

      const placeholders = extractPlaceholders(value as string);
      const fields = schemaShapeKeys(schema);

      // Bidirectional: schema-declared fields must all appear as
      // placeholders, and every placeholder must correspond to a
      // schema field.
      const missingPlaceholders = [...fields].filter((f) => !placeholders.has(f));
      const extraPlaceholders = [...placeholders].filter((p) => !fields.has(p));

      expect(
        missingPlaceholders,
        `${template_id}: schema declares fields not present as {placeholders} in en.json: ${missingPlaceholders.join(', ')}`,
      ).toEqual([]);
      expect(
        extraPlaceholders,
        `${template_id}: en.json has {placeholders} not declared in schema: ${extraPlaceholders.join(', ')}`,
      ).toEqual([]);
    });
  }
});
