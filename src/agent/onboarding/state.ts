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
