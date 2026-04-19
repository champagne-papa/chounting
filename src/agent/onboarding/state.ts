// src/agent/onboarding/state.ts
// Phase 1.2 Session 5 — OnboardingState shape + read/write
// helpers + Zod schema. Master §11.5 defines the state;
// Session 5 sub-brief §6.1 defines the storage contract on
// agent_sessions.state.onboarding.
//
// The same file exports both the TypeScript type and the Zod
// schema so they evolve together. This matches Session 4's
// pattern for narrow agent-internal shapes (per sub-brief §6.1
// rationale) — broader boundary schemas live under
// src/shared/schemas/, but this one is scoped to a single
// subsystem and reads more clearly next to its interface.
//
// State transitions are driven by the orchestrator (§6.4);
// this module is pure data + pure helpers.

import { z } from 'zod';

export interface OnboardingState {
  in_onboarding: boolean;
  current_step: 1 | 2 | 3 | 4;
  completed_steps: number[];
  invited_user: boolean;
}

export const onboardingStateSchema = z
  .object({
    in_onboarding: z.boolean(),
    current_step: z.union([
      z.literal(1),
      z.literal(2),
      z.literal(3),
      z.literal(4),
    ]),
    completed_steps: z.array(z.number().int().min(1).max(4)),
    invited_user: z.boolean(),
  })
  .strict();

/**
 * Reads `state.onboarding` from a session's generic state JSONB.
 * Returns null when the key is absent or malformed — that's the
 * signal that this is not an onboarding session (resolvePersona
 * and buildSystemPrompt both gate on null correctly).
 */
export function readOnboardingState(
  state: Record<string, unknown>,
): OnboardingState | null {
  const raw = state?.onboarding;
  if (raw === undefined || raw === null) return null;
  const parsed = onboardingStateSchema.safeParse(raw);
  if (!parsed.success) return null;
  return parsed.data;
}

/**
 * Returns a new state object with `state.onboarding` populated,
 * preserving any other keys present in `state`. Does not mutate
 * the input.
 */
export function writeOnboardingState(
  state: Record<string, unknown>,
  onboarding: OnboardingState,
): Record<string, unknown> {
  return { ...state, onboarding };
}

/**
 * Result of applying the step-advance rule to an OnboardingState.
 * ok=false signals an upstream bug — the state machine was already
 * terminal when a step-completion fired. Caller logs + leaves
 * state unchanged per sub-brief §6.4 item 3.
 */
export type AdvanceResult =
  | { ok: true; state: OnboardingState }
  | { ok: false; reason: 'all_complete' };

/**
 * Applies the step-advance rule from sub-brief §6.4 item 3.
 * Given the current state and the step(s) that just completed,
 * returns a new state where:
 *   - `completed_steps` is the union of old + newlyCompleted
 *   - `current_step` is the smallest int in {1,2,3,4} greater than
 *     max(newlyCompleted) that is NOT in the resulting
 *     completed_steps; defaults to 4 if no such int exists.
 *
 * Covers both fresh flow (step 1 → 2 → 4) and invited-user
 * shortened flow (step 1 → 4, because [2,3] are pre-completed at
 * initialization per master §11.5(c)).
 *
 * Does not flip `in_onboarding`. Step 4 completion is a separate
 * operation (`markOnboardingComplete`) keyed on the respondToUser
 * template_id match, not on a tool-driven step advance.
 *
 * Does not mutate the input state.
 */
export function advanceOnboardingState(
  state: OnboardingState,
  newlyCompleted: number[],
): AdvanceResult {
  if (newlyCompleted.length === 0) {
    return { ok: true, state };
  }

  const combined = new Set<number>([...state.completed_steps, ...newlyCompleted]);

  // Edge case: all four steps already in completed_steps before
  // this advance call fires. Upstream bug (step-completion
  // detector fired on a terminal machine). Log + don't re-advance.
  if ([1, 2, 3, 4].every((s) => combined.has(s))) {
    return { ok: false, reason: 'all_complete' };
  }

  const highestCompleted = Math.max(...newlyCompleted);
  let nextStep: 1 | 2 | 3 | 4 = 4;
  for (const candidate of [1, 2, 3, 4] as const) {
    if (candidate > highestCompleted && !combined.has(candidate)) {
      nextStep = candidate;
      break;
    }
  }

  return {
    ok: true,
    state: {
      ...state,
      current_step: nextStep,
      completed_steps: [...combined].sort((a, b) => a - b),
    },
  };
}

/**
 * Flips `in_onboarding` to false. Called by the orchestrator when
 * the respondToUser block carries template_id
 * `agent.onboarding.first_task.navigate` at current_step === 4.
 * Does not mutate the input state.
 */
export function markOnboardingComplete(state: OnboardingState): OnboardingState {
  return { ...state, in_onboarding: false };
}
