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

export function controllerPersonaPrompt(input: {
  orgContext: OrgContext | null;
  user: { user_id: string; display_name?: string };
}): string {
  return [
    identityBlock({ persona: 'controller', ...input }),
    availableToolsSection('controller'),
    ANTI_HALLUCINATION_RULES,
    TOOL_SELECTION_HINTS,
    STRUCTURED_RESPONSE_CONTRACT,
    VALID_TEMPLATE_IDS,
    VOICE_RULES,
  ].join('\n\n');
}
