// src/agent/prompts/suffixes/temporalContext.ts
// O3 Site 1 (Bug A fix). Injects current-date context into the
// system prompt as dual UTC + org-local stamps so the agent
// can resolve relative date expressions ("this month," "today,"
// "yesterday") against an authoritative anchor instead of
// falling back to training-data temporal priors.
//
// Filename uses the "suffix" naming convention for filesystem
// consistency with sibling helpers in this folder
// (orgContextSummary.ts, onboardingSuffix.ts, canvasContextSuffix.ts).
// Positioned as a PREFIX in buildSystemPrompt's composition order
// (before basePersonaPrompt) because the persona body's
// availableToolsSection() renders tool descriptions that reference
// "the Current date above" — those references must resolve to a
// block that physically precedes them in the rendered prompt.
//
// Phase 1.2 design (per docs/09_briefs/phase-1.2/session-8-c6-prereq-
// o3-agent-date-context.md §5.b): both stamps emit identical UTC
// values because organizations.timezone does not exist yet (Phase 2
// follow-up — see Open Item OI-2). The "Phase 2 will resolve" note
// in the org-local stamp tells the agent why the two values are
// currently identical.

export function temporalContextSuffix(now: Date): string {
  const isoDate = now.toISOString().slice(0, 10);
  return [
    `Current date: ${isoDate} (ISO 8601, UTC)`,
    `Today (org-local): ${isoDate} (UTC — org timezone not yet configured; Phase 2 will resolve from organizations.timezone)`,
  ].join('\n');
}
