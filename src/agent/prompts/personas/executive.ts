// src/agent/prompts/personas/executive.ts
// Phase 1.2 Session 3 — Executive persona prompt. Assembly per
// sub-brief §6.1 source-citation table.

import type { OrgContext } from '@/agent/memory/orgContextManager';
import { identityBlock, availableToolsSection } from './_identityAndTools';
import {
  ANTI_HALLUCINATION_RULES,
  STRUCTURED_RESPONSE_CONTRACT,
  VOICE_RULES,
} from './_sharedSections';

export function executivePersonaPrompt(input: {
  orgContext: OrgContext | null;
  user: { user_id: string; display_name?: string };
}): string {
  return [
    identityBlock({ persona: 'executive', ...input }),
    availableToolsSection('executive'),
    ANTI_HALLUCINATION_RULES,
    STRUCTURED_RESPONSE_CONTRACT,
    VOICE_RULES,
  ].join('\n\n');
}
