// src/agent/prompts/validTemplateIds.ts
// Phase 1.2 Session 5.1 Bug 2 + Session 7 Commit 1 +
// Session 7.1.1 — the closed set of template_ids paired with
// the params Zod schema for each, split into two maps:
//
//   - AGENT_EMITTABLE_TEMPLATE_IDS — rendered in the system
//     prompt; Claude may select any of these via respondToUser.
//   - SERVER_EMITTED_TEMPLATE_IDS — orchestrator-internal;
//     emitted only from self-emit paths (Q13 exhaust and
//     structural-retry exhaust). Never listed in the prompt.
//
// Session 7 Commit 1 elevated the closure from a flat array
// (VALID_RESPONSE_TEMPLATE_IDS) to a template_id → Zod schema
// map so the orchestrator boundary validates Claude's emitted
// params against a declared shape. Session 7.1.1 adds
// agent.response.natural (grounded conversational fallback
// per P19) and splits the catalog per P21.
//
// validateParamsAgainstTemplate accepts both maps via merged
// lookup because (a) single API surface for any future consumer
// validating a persisted turn, (b) defense-in-depth if a future
// code path validates server-emitted turns before persistence.
// Isolation of agent.error.* from the agent-selectable surface
// is maintained at the prompt-renderer layer
// (validTemplateIdsSection iterates only
// AGENT_EMITTABLE_TEMPLATE_IDS), not at the validator layer.
//
// Single source of truth for:
//   - which agent.* / proposed_entry.* keys Claude may emit
//     (AGENT_EMITTABLE_TEMPLATE_IDS)
//   - which agent.error.* keys the orchestrator emits on
//     failure paths (SERVER_EMITTED_TEMPLATE_IDS)
//   - which agent.* keys are UI-only strings (UI_ONLY_AGENT_KEYS)
//     — rendered by UI components, never emitted by either side

import { z } from 'zod';

/**
 * Response templates Claude may emit via respondToUser. Rendered
 * into the system prompt by validTemplateIdsSection(). Every
 * schema is .strict() so extra fields are rejected at the
 * orchestrator boundary via validateParamsAgainstTemplate.
 */
export const AGENT_EMITTABLE_TEMPLATE_IDS = {
  'agent.greeting.welcome': z.object({ user_name: z.string() }).strict(),
  'agent.accounts.listed': z.object({ count: z.number() }).strict(),
  'agent.entry.proposed': z.object({ amount: z.string() }).strict(),
  'agent.entry.posted': z.object({ entry_number: z.number() }).strict(),
  'agent.entry.rejected': z.object({}).strict(),
  'agent.response.natural': z.object({ text: z.string() }).strict(),
  'agent.onboarding.first_task.navigate': z.object({}).strict(),
  // OI-2 fix-stack item 4 (validation commit). Agent-emittable
  // because Claude may surface a clarification on out-of-list span
  // phrasing the resolver missed; the orchestrator's primary use is
  // server-side self-emit on the span short-circuit path. Both
  // paths share the template. span_kind='unresolved' is reserved
  // for a future fuzzy date-shape detector — currently unused.
  'agent.clarify.entry_date_ambiguous': z
    .object({
      source_phrase: z.string(),
      span_kind: z.enum(['week', 'month', 'quarter', 'year', 'unresolved']),
    })
    .strict(),
  'proposed_entry.what_changed': z.object({}).strict(),
  'proposed_entry.why.rule_matched': z.object({ label: z.string() }).strict(),
  'proposed_entry.why.novel_pattern': z.object({}).strict(),
  'proposed_entry.track_record.no_rule': z.object({}).strict(),
  'proposed_entry.if_rejected.journal_entry': z.object({}).strict(),
  'proposed_entry.if_rejected.reversal': z.object({}).strict(),
  'proposed_entry.policy.approve_required': z.object({}).strict(),
} as const satisfies Record<string, z.ZodTypeAny>;

/**
 * Response templates emitted only by orchestrator self-emit paths
 * — Q13 validation-retry exhaustion and structural-retry
 * exhaustion. NOT listed in the system prompt; Claude must not
 * select these. Kept here so the closure test, locale parity
 * test, and any future validator-at-persistence-boundary code
 * can reason about them uniformly with the agent-emittable set.
 */
export const SERVER_EMITTED_TEMPLATE_IDS = {
  'agent.error.tool_validation_failed': z
    .object({ retries: z.number() })
    .strict(),
  'agent.error.structured_response_missing': z.object({}).strict(),
  // OI-2 fix-stack item 3 (validation commit). Orchestrator
  // self-emits on day-of-week mismatch between a weekday token in
  // the user's prompt and the day-of-week of the agent's
  // entry_date (computed in the request's IANA tz). Fail-fast: no
  // retry, no ai_actions row written. English-only prompts; non-
  // English locales skip the gate. Server-emitted only — never
  // shown to Claude.
  'agent.error.entry_date_dow_mismatch': z
    .object({
      resolved_date: z.string(),
      resolved_dow: z.string(),
      prompt_dow: z.string(),
      source_phrase: z.string(),
    })
    .strict(),
} as const satisfies Record<string, z.ZodTypeAny>;

export type ValidTemplateId =
  | keyof typeof AGENT_EMITTABLE_TEMPLATE_IDS
  | keyof typeof SERVER_EMITTED_TEMPLATE_IDS;

/**
 * Merged lookup used by validateParamsAgainstTemplate. Not
 * exported — external consumers iterate the two maps explicitly
 * so the split stays visible at call sites.
 */
const MERGED_TEMPLATE_ID_PARAMS = {
  ...AGENT_EMITTABLE_TEMPLATE_IDS,
  ...SERVER_EMITTED_TEMPLATE_IDS,
} as const satisfies Record<string, z.ZodTypeAny>;

/**
 * Derived flat list of every valid template_id (both maps).
 * Preserved for consumers that iterate the template_id set
 * without caring which map an id lives in (closure tests).
 */
export const VALID_RESPONSE_TEMPLATE_IDS = [
  ...Object.keys(AGENT_EMITTABLE_TEMPLATE_IDS),
  ...Object.keys(SERVER_EMITTED_TEMPLATE_IDS),
] as readonly ValidTemplateId[];

/**
 * UI-only keys in the agent.* namespace. These are rendered by
 * UI components (AgentChatPanel, SuggestedPrompts) and are NOT
 * response templates. Neither Claude nor the orchestrator
 * emits these via respondToUser.
 */
export const UI_ONLY_AGENT_KEYS = [
  'agent.emptyState',
  'agent.suggestedPromptsHeading',
  'agent.suggestions.controller.pl',
  'agent.suggestions.controller.new_entry',
  'agent.suggestions.controller.ai_actions',
  'agent.suggestions.ap_specialist.queue',
  'agent.suggestions.ap_specialist.incoming',
  'agent.suggestions.executive.cash',
  'agent.suggestions.executive.runway',
] as const;

/**
 * Discriminated-result shape for params validation against a
 * template_id. No throws — call sites branch on .ok.
 */
export type ValidateParamsResult<T = Record<string, unknown>> =
  | { ok: true; params: T }
  | { ok: false; error: z.ZodError };

/**
 * Validate params against the schema declared for template_id.
 * Accepts both agent-emittable and server-emitted ids via merged
 * lookup (see header rationale). Primary consumer: orchestrator's
 * respondToUser boundary, where a Zod failure rides the Q13
 * retry budget. Secondary consumer (Session 7 Commit 2):
 * ProposedEntryCard's policy_outcome reason_template_id +
 * reason_params pair.
 */
export function validateParamsAgainstTemplate(
  template_id: string,
  params: unknown,
): ValidateParamsResult {
  const schema = (
    MERGED_TEMPLATE_ID_PARAMS as Record<string, z.ZodTypeAny>
  )[template_id];
  if (!schema) {
    const error = new z.ZodError([
      {
        code: 'custom',
        path: ['template_id'],
        message: `Unknown template_id: ${template_id}`,
      },
    ]);
    return { ok: false, error };
  }
  const parsed = schema.safeParse(params);
  if (parsed.success) {
    return { ok: true, params: parsed.data as Record<string, unknown> };
  }
  return { ok: false, error: parsed.error };
}

function renderLeafType(schema: z.ZodTypeAny): string {
  if (schema instanceof z.ZodString) return 'string';
  if (schema instanceof z.ZodNumber) return 'number';
  if (schema instanceof z.ZodBoolean) return 'boolean';
  return 'unknown';
}

function renderParamsShape(schema: z.ZodTypeAny): string {
  if (!(schema instanceof z.ZodObject)) return 'unknown';
  const shape = schema.shape as Record<string, z.ZodTypeAny>;
  const keys = Object.keys(shape);
  if (keys.length === 0) return '{}';
  const parts = keys.map((k) => `${k}: ${renderLeafType(shape[k])}`);
  return `{ ${parts.join(', ')} }`;
}

/**
 * Returns the valid-template_ids section for inclusion in the
 * system prompt. Iterates AGENT_EMITTABLE_TEMPLATE_IDS only —
 * server-only templates (agent.error.*) are never shown to
 * Claude, so they can't be selected via respondToUser. Each
 * entry carries its params shape so Claude sees the declared
 * fields. The prose preamble (Session 7.1.1 P20) instructs
 * "prefer structured, fall back to natural" — agent.response
 * .natural is the fallback for grounded conversational answers
 * when no structured template fits.
 */
export function validTemplateIdsSection(): string {
  const entries = Object.entries(AGENT_EMITTABLE_TEMPLATE_IDS) as Array<
    [string, z.ZodTypeAny]
  >;
  const agentEntries = entries.filter(([k]) => k.startsWith('agent.'));
  const proposedEntryEntries = entries.filter(([k]) =>
    k.startsWith('proposed_entry.'),
  );

  const renderEntry = ([k, schema]: [string, z.ZodTypeAny]): string =>
    `- \`${k}\` — params: \`${renderParamsShape(schema)}\``;

  const renderList = (es: Array<[string, z.ZodTypeAny]>): string =>
    es.map(renderEntry).join('\n');

  return `## Valid template_ids

Every respondToUser call MUST use one of the template_ids below — exactly as listed. Do NOT invent new keys. **Additional fields in \`params\` are not permitted** — supply exactly the fields declared for the chosen template_id.

**Selection — prefer structured, fall back to natural.** When the response shape matches a structured template, use it: greeting a new user → \`agent.greeting.welcome\`; proposing a journal entry → \`agent.entry.proposed\`; listing accounts → \`agent.accounts.listed\`; acknowledging an approved post → \`agent.entry.posted\`; rejection → \`agent.entry.rejected\`; onboarding completion → \`agent.onboarding.first_task.navigate\`. Use \`agent.response.natural\` (params: \`{ text: string }\`) only when no structured template fits — for grounded conversational answers (e.g., "why was this posted?", explaining a balance, asking a clarifying question when context is ambiguous). The \`text\` param carries your prose verbatim.

### agent.* (conversational)

${renderList(agentEntries)}

### proposed_entry.* (journal-entry approval flow)

${renderList(proposedEntryEntries)}`;
}
