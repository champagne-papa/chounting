// src/agent/prompts/validTemplateIds.ts
// Phase 1.2 Session 5.1 Bug 2 + Session 7 Commit 1 — the closed
// set of template_ids the agent is allowed to use in
// respondToUser, paired with the params Zod schema for each.
//
// Session 5.1 introduced the template_id closure (VALID_RESPONSE
// _TEMPLATE_IDS as a flat array) after Claude invented
// semantically reasonable but non-existent keys under the old
// "params is just a record" contract.
//
// Session 7 Commit 1 elevates that closure to TEMPLATE_ID_PARAMS
// — a template_id → Zod schema map — so the orchestrator boundary
// validates Claude's emitted params against a declared shape, not
// just the generic Record<string, unknown>. A Zod failure rides
// the existing Q13 retry budget; exhausted budget emits
// agent.error.tool_validation_failed as a normal turn.
//
// Single source of truth for:
//   - which agent.* / proposed_entry.* keys are valid response
//     templates (TEMPLATE_ID_PARAMS)
//   - which agent.* keys are UI-only strings (UI_ONLY_AGENT_KEYS)
//     — rendered by UI components, never emitted by the agent

import { z } from 'zod';

/**
 * Response templates → params schemas the agent may emit via
 * respondToUser. Every schema is .strict() so extra fields are
 * rejected at the orchestrator boundary via
 * validateParamsAgainstTemplate.
 */
export const TEMPLATE_ID_PARAMS = {
  'agent.greeting.welcome': z.object({ user_name: z.string() }).strict(),
  'agent.accounts.listed': z.object({ count: z.number() }).strict(),
  'agent.entry.proposed': z.object({ amount: z.string() }).strict(),
  'agent.entry.posted': z.object({ entry_number: z.number() }).strict(),
  'agent.entry.rejected': z.object({}).strict(),
  'agent.error.tool_validation_failed': z
    .object({ retries: z.number() })
    .strict(),
  'agent.error.structured_response_missing': z.object({}).strict(),
  'agent.onboarding.first_task.navigate': z.object({}).strict(),
  'proposed_entry.what_changed': z.object({}).strict(),
  'proposed_entry.why.rule_matched': z.object({ label: z.string() }).strict(),
  'proposed_entry.why.novel_pattern': z.object({}).strict(),
  'proposed_entry.track_record.no_rule': z.object({}).strict(),
  'proposed_entry.if_rejected.journal_entry': z.object({}).strict(),
  'proposed_entry.if_rejected.reversal': z.object({}).strict(),
  'proposed_entry.policy.approve_required': z.object({}).strict(),
} as const satisfies Record<string, z.ZodTypeAny>;

export type ValidTemplateId = keyof typeof TEMPLATE_ID_PARAMS;

/**
 * Derived flat list. Object.keys(TEMPLATE_ID_PARAMS). Preserved
 * for consumers that iterate the template_id set without caring
 * about params shape (e.g., agentTemplateIdSetClosure test).
 */
export const VALID_RESPONSE_TEMPLATE_IDS = Object.keys(
  TEMPLATE_ID_PARAMS,
) as readonly ValidTemplateId[];

/**
 * UI-only keys in the agent.* namespace. These are rendered by
 * UI components (AgentChatPanel, SuggestedPrompts) and are NOT
 * response templates. The agent must never emit these via
 * respondToUser.
 *
 * Session 7 Commit 1 added the seven per-persona suggestion
 * keys consumed by SuggestedPrompts' empty-state render.
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
 * Primary consumer: orchestrator's respondToUser boundary, where
 * a Zod failure rides the Q13 retry budget. Secondary consumer
 * (Session 7 Commit 2): ProposedEntryCard's policy_outcome
 * reason_template_id + reason_params pair.
 */
export function validateParamsAgainstTemplate(
  template_id: string,
  params: unknown,
): ValidateParamsResult {
  const schema = (TEMPLATE_ID_PARAMS as Record<string, z.ZodTypeAny>)[
    template_id
  ];
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
 * system prompt. Each entry carries its params shape so Claude
 * sees the declared fields; the section-level prose reiterates
 * the .strict() invariant so Claude's instruction-following
 * respects the "no extra fields" contract rather than triggering
 * avoidable orchestrator-boundary retries.
 */
export function validTemplateIdsSection(): string {
  const entries = Object.entries(TEMPLATE_ID_PARAMS) as Array<
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

Every respondToUser call MUST use one of the template_ids below — exactly as listed. Do NOT invent new keys. If the situation doesn't match any listed template, pick the closest one and shape the response with \`params\`. **Additional fields in \`params\` are not permitted** — supply exactly the fields declared for the chosen template_id.

### agent.* (conversational)

${renderList(agentEntries)}

### proposed_entry.* (journal-entry approval flow)

${renderList(proposedEntryEntries)}`;
}
