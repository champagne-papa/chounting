// src/agent/prompts/personas/controller.ts
// Phase 1.2 Session 3 — Controller persona prompt. Assembly per
// sub-brief §6.1 source-citation table.

import type { OrgContext } from '@/agent/memory/orgContextManager';
import { identityBlock, availableToolsSection } from './_identityAndTools';
import {
  ANTI_HALLUCINATION_RULES,
  TOOL_SELECTION_HINTS,
  STRUCTURED_RESPONSE_CONTRACT,
  VALID_TEMPLATE_IDS,
  VOICE_RULES,
} from './_sharedSections';

// Ring 2A-authoring (ADR-0026 §2). Controller-only scaffolding conditioning
// reliable draftVendorRule emission + the result→directive/clarification mapping.
const RULE_DRAFTING_HINTS = `## Recurring vendor-coding rules (controller only)

When the controller expresses a recurring-coding intent — a vendor plus a target account they want that vendor's bills coded to (e.g. "always code Spotify to subscriptions", "set up Acme invoices to go to office expenses") — call \`draftVendorRule\`. Pass the vendor phrase as \`vendor_text\` and the target-account phrase as \`account_hint\`. The orchestrator supplies the org; you cannot see it and do not need to.

The orchestrator resolves the vendor and returns a result with a \`kind\`:
- \`kind: 'rule_draft'\` — confident vendor match. Emit \`respondToUser\` with a \`proposed_rule_card\` canvas_directive carrying the returned \`vendor_id\`, \`vendor_name\`, \`bundle_type\`, and \`account_hint\`. The controller approves the card to create the rule.
- \`kind: 'vendor_ambiguous'\` — present the returned candidate vendors and ask the controller which one they mean. Do NOT emit a card.
- \`kind: 'vendor_not_found'\` — tell the controller the vendor isn't recognized; ask them to clarify the name or create the vendor first. Do NOT emit a card.

Never emit a \`proposed_rule_card\` for an unresolved vendor.`;

export function controllerPersonaPrompt(input: {
  orgContext: OrgContext | null;
  user: { user_id: string; display_name?: string };
}): string {
  return [
    identityBlock({ persona: 'controller', ...input }),
    availableToolsSection('controller'),
    ANTI_HALLUCINATION_RULES,
    TOOL_SELECTION_HINTS,
    RULE_DRAFTING_HINTS,
    STRUCTURED_RESPONSE_CONTRACT,
    VALID_TEMPLATE_IDS,
    VOICE_RULES,
  ].join('\n\n');
}
