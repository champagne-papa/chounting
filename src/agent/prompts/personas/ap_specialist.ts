// src/agent/prompts/personas/ap_specialist.ts
// Phase 1.2 Session 3 — AP Specialist persona prompt. Assembly
// per sub-brief §6.1 source-citation table.

import type { OrgContext } from '@/agent/memory/orgContextManager';
import { identityBlock, availableToolsSection } from './_identityAndTools';
import {
  ANTI_HALLUCINATION_RULES,
  STRUCTURED_RESPONSE_CONTRACT,
  VOICE_RULES,
} from './_sharedSections';

export function apSpecialistPersonaPrompt(input: {
  orgContext: OrgContext | null;
  user: { user_id: string; display_name?: string };
}): string {
  return [
    identityBlock({ persona: 'ap_specialist', ...input }),
    availableToolsSection('ap_specialist'),
    ANTI_HALLUCINATION_RULES,
    STRUCTURED_RESPONSE_CONTRACT,
    VOICE_RULES,
  ].join('\n\n');
}
