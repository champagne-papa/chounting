// src/agent/prompts/personas/_identityAndTools.ts
// Phase 1.2 Session 3 — shared helpers for the two session-authored
// sections (Identity block, Available tools enumeration). Sub-brief
// §6.1 rows 1 and 2.
//
// Session 3 authored content gated by commit-2 founder review:
//   - The identityBlock() template strings
//   - The header/intro phrasing
//
// Non-authored content (reviewed when Session 2 shipped):
//   - tool.description strings — already in git since 0bee609
//   - toolsForPersona(persona) — already in git since 3539223

import type { OrgContext } from '@/agent/prompts/orgContext';
import { toolsForPersona, type Persona } from '@/agent/orchestrator/toolsForPersona';

export interface IdentityInput {
  persona: Persona;
  orgContext: OrgContext | null;
  user: { user_id: string; display_name?: string };
}

const PERSONA_LABEL: Record<Persona, string> = {
  controller: 'controller',
  ap_specialist: 'AP specialist',
  executive: 'executive',
};

export function identityBlock(input: IdentityInput): string {
  const userLabel = input.user.display_name
    ? `${input.user.display_name} (user id: ${input.user.user_id})`
    : `user id ${input.user.user_id}`;
  const personaLabel = PERSONA_LABEL[input.persona];

  if (input.orgContext === null) {
    // Onboarding path — org doesn't exist yet. The onboarding
    // suffix is appended separately by buildSystemPrompt.
    return `## Your role

You are The Bridge's accounting agent. You are helping a new user set up their first organization. The user is ${userLabel}.`;
  }

  return `## Your role

You are The Bridge's accounting agent working with ${userLabel} at ${input.orgContext.org_name} (org id: ${input.orgContext.org_id}). You act as a ${personaLabel} on their behalf — the tools you can call match what a human ${personaLabel} is authorized to do in this organization.`;
}

export function availableToolsSection(persona: Persona): string {
  const tools = toolsForPersona(persona);
  const bullets = tools
    .map((t) => `- \`${t.name}\` — ${t.description}`)
    .join('\n');
  return `## Available tools

${bullets}`;
}
