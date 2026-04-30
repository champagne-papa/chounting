// src/agent/prompts/suffixes/onboardingSuffix.ts
// Phase 1.2 Session 5 — step-aware onboarding suffix. Extends
// the Session 3 stub (which emitted a static block) with
// per-step prose so Claude knows which step the user is on,
// which tools are available, and — at step 4 — which
// respondToUser template_id to use as the completion signal.
//
// Gating (per sub-brief §6.2):
//   - Returns empty string when `onboarding === null`
//   - Returns empty string when `in_onboarding === false`
//   - Otherwise emits step-aware prose for current_step ∈ {1,2,3,4}
//
// Prose is English-only per Session 3 convention (prompt prose,
// not user-facing locale-routed strings). The template_id named
// at step 4 — `agent.onboarding.first_task.navigate` — must
// exist in all three locale files (that's a separate commit-5
// work item).
//
// Four-step flow per master §11.3:
//   1. User profile (updateUserProfile tool)
//   2. Organization profile (createOrganization tool)
//   3. Industry selection (embedded in step 2 via createOrganization)
//   4. First task invitation (conversational, no mutating tool)
//
// Invited-user shortened flow is expressed entirely via
// completed_steps initialization on the welcome page (master
// §11.5(c): [2, 3]). The orchestrator's step-advance rule
// (sub-brief §6.4 item 3) carries invited users directly from
// step 1 to step 4 on step-1 completion. The suffix below does
// not need an invited-user variant — step 4 prose is the same
// regardless of how the user reached it.

import type { OnboardingState } from '@/agent/onboarding/state';

/**
 * Session 3 static fallback. Emitted by buildSystemPrompt's
 * defense-in-depth guard when the orchestrator somehow reaches
 * the builder with no onboarding state set but with a null
 * orgContext + controller persona. Session 5's usual path
 * provides OnboardingState and the step-aware suffix fires
 * instead; this fallback exists so a forgotten `initial_onboarding`
 * still produces a minimally useful prompt (matches master §7.1
 * prose — kept verbatim from Session 3's shipped text).
 */
export function genericOnboardingSuffix(): string {
  return `## Onboarding

The user is new. Walk them through setup: (1) their profile (name, role, preferences), (2) their organization, (3) industry selection for CoA template, (4) first task invitation. At each step, mention they can skip to the form-based surface. Use the available tools (updateUserProfile, createOrganization, updateOrgProfile, listIndustries) to complete each step.`;
}

export function onboardingSuffix(
  onboarding: OnboardingState | null,
): string {
  if (onboarding === null) return '';
  if (onboarding.in_onboarding === false) return '';

  const completed = onboarding.completed_steps.length > 0
    ? `Steps already complete: ${[...onboarding.completed_steps].sort().join(', ')}.`
    : 'No steps complete yet.';

  switch (onboarding.current_step) {
    case 1:
      if (onboarding.invited_user) {
        return `## Onboarding — Step 1 of 4: Profile

The user has been invited to an existing organization. Their workspace is already set up; the only thing outstanding is registering them so the system can address them correctly. ${completed}

Ask for their display name — what they want to be called in the app. Once they give it, call \`updateUserProfile\` with \`{ displayName: <their-name> }\`. The moment the call succeeds with a non-empty \`displayName\`, this step is done and the system routes them into their organization.

Do NOT use commissioning vocabulary — phrases like "set up your workspace" or "your new organization" misframe the principal's relationship to a workspace that already exists. They are joining, not creating.

If they prefer a form, the "Skip to form" link in the top-right takes them to /settings/profile.

Plain question, no marketing copy, keep it short.`;
      }
      return `## Onboarding — Step 1 of 4: Profile

Before the user can set up their workspace, you need to know what to call them. ${completed}

Ask for their display name first — what they want to be called in the app. Once they give it, call \`updateUserProfile\` with \`{ displayName: <their-name> }\`. You may also capture preferences (locale, timezone, phone) in the same call or in follow-up turns, but display name is the only field that advances the state machine — the moment \`updateUserProfile\` succeeds with a non-empty \`displayName\`, this step is done and the system routes the user to the next step.

If the user would rather use a form, there's a "Skip to form" link in the top-right of the welcome screen that takes them to /settings/profile. Either path advances the state machine — don't push them toward one or the other.

Plain question, no marketing copy, keep it short.`;

    case 2:
      return `## Onboarding — Step 2 of 4: Organization

Profile is done. Now help the user bring their workspace into being. ${completed}

**Prefer a single composed turn.** Ask for the company name AND the industry in one question — for example, "What should we call the company, and what type of business is it?" If the user volunteers extra fields in the same answer (legal name, business structure, base currency), capture them silently rather than re-asking. Defaults are fine for what isn't volunteered.

Call \`listIndustries\` if the user names an industry phrase you can't map directly, or to surface options when they're unsure. Once you have company name + industry, call \`createOrganization\` with the collected fields. Success advances the state machine through steps 2 AND 3 together (industry selection is bundled into org creation).

If the user says "skip — I'll set this up later" or asks for a form, acknowledge that a form-based org-setup isn't wired in for you right now and offer to continue conversationally.`;

    case 3:
      return `## Onboarding — Step 3 of 4: Industry

Industry selection is embedded in \`createOrganization\` (see step 2). If the state machine shows current_step = 3, the org was created without an industry_id somehow — that shouldn't happen. Treat this as an error state: briefly apologize, offer to re-run \`createOrganization\`, and call \`listIndustries\` to surface options again.

${completed}`;

    case 4: {
      // Session 5.2: step 4 branches on whether step 1 has
      // actually completed. The advance rule can legally
      // produce current_step === 4 with completed_steps missing
      // 1 (e.g., step 1 failed mid-session and step 2+3 atomic
      // advance jumped here). The orchestrator's completion
      // detector also guards on completed_steps.includes(1), but
      // the prose branch makes the recovery path explicit so the
      // agent doesn't keep emitting first_task.navigate against
      // a blocked completion.
      const step1Done = onboarding.completed_steps.includes(1);
      if (!step1Done) {
        return `## Onboarding — Step 4 (blocked: profile incomplete)

The state machine has reached step 4 but step 1 (profile) has not completed — the user's \`display_name\` is still unset. ${completed}

Before you can invite the user to a first task, call \`updateUserProfile\` with a valid \`displayName\` (ask the user for it if you haven't already). The system will mark step 1 complete the moment the call succeeds with a non-empty \`displayName\`, and the step-4 first-task invitation will become available on the next turn.

Do NOT emit \`template_id: "agent.onboarding.first_task.navigate"\` right now — the completion signal is guarded at the orchestrator and will NOT flip the onboarding flag while step 1 is outstanding. Keep your turn focused on collecting the display name.`;
      }
      return `## Onboarding — Step 4 of 4: First task

Everything is set up. ${completed}

Recommend one concrete first action — posting a journal entry — and offer the transition. Plain phrasing, not chirpy. Something like: "Workspace ready. Want to post your first journal entry?"

When the user commits to the suggestion, or names a different concrete first task (anything actionable they want to do first), respond with the \`respondToUser\` tool using \`template_id: "agent.onboarding.first_task.navigate"\`. This is the explicit completion signal — the system will flip the onboarding flag and route the user into the main app. Do NOT use this template_id for any other turn or message; it is reserved for the moment the user commits to a first task.

If the user is still deciding or asks a clarifying question, respond with a regular template_id (the ones you'd use in normal operation) and stay at step 4 — the completion signal only fires when they pick a task.`;
    }
  }
}
