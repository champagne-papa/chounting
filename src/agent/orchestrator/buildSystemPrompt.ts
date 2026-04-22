// src/agent/orchestrator/buildSystemPrompt.ts
// Phase 1.2 Session 5 — system prompt composition helper. Master
// §7 + sub-brief §6.3 / Pre-decision 1 (signature).
//
// Composition order (single blank line between sections):
//   1. Base persona prompt (identity + tools + rules + contract + voice)
//   2. Org-context summary (when orgContext is non-null)
//   3. Locale directive
//   4. Onboarding suffix (when onboarding state exists AND
//      in_onboarding is true — step-aware prose per
//      Session 5 §6.2)
//   5. Canvas context suffix (when canvasContext present)
//
// Session 5 threads the new `onboarding: OnboardingState | null`
// input through. The onboardingSuffix helper handles null and
// in_onboarding=false by returning empty string, so callers
// that don't supply the input still produce a valid prompt.
// The Session 3/4 defense-in-depth guard
// (persona === 'controller' && orgContext === null) stays as a
// secondary trigger for backwards compatibility — it fires an
// empty suffix now (the extended suffix returns '' for null
// onboarding), but the code path remains intact.

import type { CanvasContext } from '@/shared/types/canvasContext';
import type { OrgContext } from '@/agent/memory/orgContextManager';
import type { OnboardingState } from '@/agent/onboarding/state';
import type { Persona } from './toolsForPersona';
import { controllerPersonaPrompt } from '@/agent/prompts/personas/controller';
import { apSpecialistPersonaPrompt } from '@/agent/prompts/personas/ap_specialist';
import { executivePersonaPrompt } from '@/agent/prompts/personas/executive';
import { localeDirective, type Locale } from '@/agent/prompts/suffixes/localeDirective';
import {
  onboardingSuffix,
  genericOnboardingSuffix,
} from '@/agent/prompts/suffixes/onboardingSuffix';
import { canvasContextSuffix } from '@/agent/prompts/suffixes/canvasContextSuffix';
import { orgContextSummary } from '@/agent/prompts/suffixes/orgContextSummary';
import { temporalContextSuffix } from '@/agent/prompts/suffixes/temporalContext';

export interface BuildSystemPromptInput {
  persona: Persona;
  orgContext: OrgContext | null;
  locale: Locale;
  canvasContext?: CanvasContext;
  user: { user_id: string; display_name?: string };
  onboarding?: OnboardingState | null;
  // O3 Site 1 — current date for temporal context injection
  // (required, no default; injected by orchestrator and tests).
  now: Date;
}

export function buildSystemPrompt(input: BuildSystemPromptInput): string {
  const base = basePersonaPrompt(input);
  // O3 Site 1: temporalContextSuffix is positioned as a PREFIX
  // despite "suffix" in the name — see comment in
  // temporalContext.ts for full rationale (filesystem consistency
  // with sibling suffixes/ files). Tool descriptions reference
  // "the Current date above" — that anchor must precede the
  // persona body in render order.
  const sections: string[] = [temporalContextSuffix(input.now), base];

  const orgSummary = orgContextSummary(input.orgContext);
  if (orgSummary) sections.push(orgSummary);

  sections.push(localeDirective(input.locale));

  const stepAware = onboardingSuffix(input.onboarding ?? null);
  if (stepAware) {
    sections.push(stepAware);
  } else if (input.persona === 'controller' && input.orgContext === null) {
    // Defense-in-depth fallback per sub-brief §6.3: if the
    // orchestrator reaches here without onboarding state but
    // with the controller+null-orgContext shape, emit the
    // Session 3 static suffix so the prompt still reads as an
    // onboarding prompt. Session 5's usual path sets
    // input.onboarding and the step-aware suffix fires above.
    sections.push(genericOnboardingSuffix());
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
