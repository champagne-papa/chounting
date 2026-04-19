// src/agent/orchestrator/buildSystemPrompt.ts
// Phase 1.2 Session 3 — system prompt composition helper. Master
// §7 + sub-brief §6.3 / Pre-decision 1 (signature).
//
// Composition order (single blank line between sections):
//   1. Base persona prompt (identity + tools + rules + contract + voice)
//   2. Locale directive
//   3. Onboarding suffix (controller + null orgContext only)
//   4. Canvas context suffix (when canvasContext present)
//
// Session 4 will inject an org-context summary between steps 1 and
// 2 once OrgContextManager lands. The current composition order
// already has the slot.

import type { CanvasContext } from '@/shared/types/canvasContext';
import type { OrgContext } from '@/agent/memory/orgContextManager';
import type { Persona } from './toolsForPersona';
import { controllerPersonaPrompt } from '@/agent/prompts/personas/controller';
import { apSpecialistPersonaPrompt } from '@/agent/prompts/personas/ap_specialist';
import { executivePersonaPrompt } from '@/agent/prompts/personas/executive';
import { localeDirective, type Locale } from '@/agent/prompts/suffixes/localeDirective';
import { onboardingSuffix } from '@/agent/prompts/suffixes/onboardingSuffix';
import { canvasContextSuffix } from '@/agent/prompts/suffixes/canvasContextSuffix';

export interface BuildSystemPromptInput {
  persona: Persona;
  orgContext: OrgContext | null;
  locale: Locale;
  canvasContext?: CanvasContext;
  user: { user_id: string; display_name?: string };
}

export function buildSystemPrompt(input: BuildSystemPromptInput): string {
  const base = basePersonaPrompt(input);
  const sections: string[] = [base, localeDirective(input.locale)];

  if (input.persona === 'controller' && input.orgContext === null) {
    sections.push(onboardingSuffix());
  }

  if (input.canvasContext) {
    sections.push(canvasContextSuffix(input.canvasContext));
  }

  return sections.join('\n\n');
}

function basePersonaPrompt(input: BuildSystemPromptInput): string {
  const args = { orgContext: input.orgContext, user: input.user };
  switch (input.persona) {
    case 'controller':
      return controllerPersonaPrompt(args);
    case 'ap_specialist':
      return apSpecialistPersonaPrompt(args);
    case 'executive':
      return executivePersonaPrompt(args);
  }
}
