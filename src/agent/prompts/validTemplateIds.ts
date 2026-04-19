// src/agent/prompts/validTemplateIds.ts
// Phase 1.2 Session 5.1 Bug 2 — the closed set of template_ids
// the agent is allowed to use in respondToUser. The system
// prompt tells Claude the response contract is `{template_id,
// params}` and that every template_id must exist in the locale
// files, but the prompt did not enumerate which keys are valid.
// The EC-20 smoke test caught Claude inventing semantically
// reasonable but non-existent keys (e.g.,
// `onboarding.profile.ask_display_name`), which would cause
// next-intl to throw at UI render time.
//
// This module is the single source of truth for:
//   - which agent.* / proposed_entry.* keys are valid
//     response templates
//   - which agent.* keys are UI-only strings (not response
//     templates) — kept in messages/*.json for UI rendering
//     but excluded from the response contract
//
// Test 2 (tests/integration/agentTemplateIdSetClosure.test.ts)
// asserts the union of these two lists matches exactly the
// agent.* + proposed_entry.* keys present in messages/en.json.
// Drift either way (new key added to en.json without adding it
// here, or key removed from en.json while still listed here)
// breaks the test loudly.

/**
 * Response templates — keys the agent may emit via respondToUser.
 * Renders to user-facing text via next-intl at the UI layer.
 */
export const VALID_RESPONSE_TEMPLATE_IDS = [
  'agent.greeting.welcome',
  'agent.accounts.listed',
  'agent.entry.proposed',
  'agent.error.tool_validation_failed',
  'agent.error.structured_response_missing',
  'agent.onboarding.first_task.navigate',
  'proposed_entry.what_changed',
  'proposed_entry.why.rule_matched',
  'proposed_entry.why.novel_pattern',
  'proposed_entry.track_record.no_rule',
  'proposed_entry.if_rejected.journal_entry',
  'proposed_entry.if_rejected.reversal',
  'proposed_entry.policy.approve_required',
] as const;

/**
 * UI-only keys in the agent.* namespace. These are rendered by
 * UI components (AgentChatPanel, SuggestedPrompts) and are NOT
 * response templates. The agent must never emit these via
 * respondToUser.
 */
export const UI_ONLY_AGENT_KEYS = [
  'agent.emptyState',
  'agent.suggestedPromptsHeading',
] as const;

/**
 * Returns the valid-template_ids section for inclusion in the
 * system prompt. Lists every allowed response template_id,
 * grouped by namespace for readability, with the explicit
 * instruction that the agent must use one of these exactly.
 */
export function validTemplateIdsSection(): string {
  const agentKeys = VALID_RESPONSE_TEMPLATE_IDS.filter((k) => k.startsWith('agent.'));
  const proposedEntryKeys = VALID_RESPONSE_TEMPLATE_IDS.filter((k) =>
    k.startsWith('proposed_entry.'),
  );

  const renderList = (keys: readonly string[]): string =>
    keys.map((k) => `- \`${k}\``).join('\n');

  return `## Valid template_ids

Every respondToUser call MUST use one of the template_ids below — exactly as listed. Do NOT invent new keys. If the situation doesn't match any listed template, pick the closest one and shape the response with \`params\`.

### agent.* (conversational)

${renderList(agentKeys)}

### proposed_entry.* (journal-entry approval flow)

${renderList(proposedEntryKeys)}`;
}
