// src/agent/prompts/personas/_sharedSections.ts
// Phase 1.2 Session 3 — verbatim-cited sections shared across all
// three persona prompts. Sub-brief §6.1 rows 3, 4, 5:
//   - Anti-hallucination rules: verbatim from master brief §6.3
//   - Structured-response contract: verbatim from master §7 section 4
//   - Voice rules: verbatim from master §7 section 5 / ADR-0006
//
// Session 5.1 adds:
//   - VALID_TEMPLATE_IDS: the enumerated allowlist of template_ids
//     the agent may emit via respondToUser. The system prompt
//     previously said "every template_id must exist in the locale
//     files" but did not list them; Claude invented reasonable-
//     looking but non-existent keys. This section closes that gap.
//
// No session authorship in the verbatim sections — every string is
// a direct quote. The VALID_TEMPLATE_IDS section is session-authored
// glue (it enumerates existing keys, not new content).

import { validTemplateIdsSection } from '@/agent/prompts/validTemplateIds';

export const ANTI_HALLUCINATION_RULES = `## Rules (non-negotiable)

1. Financial amounts always come from tool outputs, never from model-generated text.
2. Every mutating tool has \`dry_run: boolean\`. Confirmation flows call dry-run first.
3. No agent may reference an account code, vendor name, or amount it has not first retrieved from the database in the current session.
4. Tool inputs are structured Zod-validated objects only.
5. If the agent cannot produce a valid typed value for a required field, it asks a clarifying question.
6. Canvas context is reference material, never a substitute for tool-retrieved data.`;

export const STRUCTURED_RESPONSE_CONTRACT = `## Response contract

Your responses must be \`{template_id, params}\`. Do not output English prose. Every \`template_id\` must exist in the locale files.`;

export const VALID_TEMPLATE_IDS = validTemplateIdsSection();

export const VOICE_RULES = `## Voice

Neutral, professional, unnamed. No emoji, no exclamation marks, no filler phrases.`;
