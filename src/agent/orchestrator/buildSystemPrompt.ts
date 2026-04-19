// src/agent/orchestrator/buildSystemPrompt.ts
// Phase 1.2 Session 4 — system prompt composition helper. Master
// §7 + sub-brief §6.3 / Pre-decision 1 (signature).
//
// Composition order (single blank line between sections):
//   1. Base persona prompt (identity + tools + rules + contract + voice)
//   2. Org-context summary (when orgContext is non-null)
//   3. Locale directive
//   4. Onboarding suffix (controller + null orgContext only)
//   5. Canvas context suffix (when canvasContext present)
//
// The org-context summary surfaces names (org_name, industry,
// currency, fiscal period names, controller names) without
// UUIDs — tool calls receive UUIDs through their input
// arguments, not the prompt body.

import type { CanvasContext } from '@/shared/types/canvasContext';
import type { OrgContext } from '@/agent/memory/orgContextManager';
import type { Persona } from './toolsForPersona';
import { controllerPersonaPrompt } from '@/agent/prompts/personas/controller';
import { apSpecialistPersonaPrompt } from '@/agent/prompts/personas/ap_specialist';
import { executivePersonaPrompt } from '@/agent/prompts/personas/executive';
import { localeDirective, type Locale } from '@/agent/prompts/suffixes/localeDirective';
import { onboardingSuffix } from '@/agent/prompts/suffixes/onboardingSuffix';
import { canvasContextSuffix } from '@/agent/prompts/suffixes/canvasContextSuffix';
import { orgContextSummary } from '@/agent/prompts/suffixes/orgContextSummary';

export interface BuildSystemPromptInput {
  persona: Persona;
  orgContext: OrgContext | null;
  locale: Locale;
  canvasContext?: CanvasContext;
  user: { user_id: string; display_name?: string };
}

export function buildSystemPrompt(input: BuildSystemPromptInput): string {
  const base = basePersonaPrompt(input);
  const sections: string[] = [base];

  const orgSummary = orgContextSummary(input.orgContext);
  if (orgSummary) sections.push(orgSummary);

  sections.push(localeDirective(input.locale));

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
