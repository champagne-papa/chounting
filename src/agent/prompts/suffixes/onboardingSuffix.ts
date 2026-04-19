// src/agent/prompts/suffixes/onboardingSuffix.ts
// Phase 1.2 Session 3 — verbatim onboarding prompt fragment from
// master brief §7.1. Appended by buildSystemPrompt when
// persona === 'controller' && orgContext === null (sub-brief
// Pre-decision 4). Does NOT encode the Session 5 state machine —
// this is a single static block.

export function onboardingSuffix(): string {
  return `## Onboarding

The user is new. Walk them through setup: (1) their profile (name, role, preferences), (2) their organization, (3) industry selection for CoA template, (4) first task invitation. At each step, mention they can skip to the form-based surface. Use the available tools (updateUserProfile, createOrganization, updateOrgProfile, listIndustries) to complete each step.`;
}
