# Phase 1.2 Session 5 Execution Sub-Brief — Onboarding State Machine + Welcome Page + Sign-In Redirect

*This sub-brief drives Session 5 of Phase 1.2. The master brief at
`docs/09_briefs/phase-1.2/brief.md` (frozen at SHA aae547a) is the
architecture document and is never modified during execution. The
Session 1–4 sub-briefs plus Session 4.5 closeout are density and
structural references. Where this sub-brief and the master brief
disagree, the master brief wins — stop and flag rather than
deviate.*

---

## 1. Goal

Session 5 delivers the first end-to-end user-facing flow of
Phase 1.2: a new user signs in, lands on a functional welcome
page, completes onboarding conversationally, and is redirected
to the main app. Four moving parts:

- **State machine** — `OnboardingState` typed on
  `agent_sessions.state.onboarding`; orchestrator reads at turn
  start, writes transitions on step completions.
- **Extended onboardingSuffix** — step-aware system prompt
  instructions so Claude knows which step the user is on and
  what the step-4 completion signal looks like.
- **Welcome page** — minimal functional surface at
  `src/app/[locale]/welcome/page.tsx`. Chat pre-focused, rail
  hidden, visual polish deferred to Session 7.
- **Sign-in redirect** — after successful auth, check memberships
  + `user_profiles.display_name`; route onboarding-needed users
  to `/[locale]/welcome`.

No AgentChatPanel rewrite (Session 7), no form-escape surfaces
(Session 6), no canvas directive extensions (Session 6), no UI
polish (Session 7). Session 5 is the vertical slice that proves
the onboarding flow works end-to-end against a minimally-styled
welcome page.

---

## 2. Master-brief sections implemented

- **§3 Decision A** — "Onboarding flow: all four steps in 1.2"
  (confirmed; Session 5 implements per-step state tracking)
- **§11.1** — Trigger. Sign-in checks memberships +
  `display_name`; redirects to `/[locale]/welcome`.
- **§11.2** — Welcome page layout (minimal per Pre-decision 1)
- **§11.3** — Four-step flow (state transitions per step)
- **§11.4** — Completion (flag flip + welcome-page redirect)
- **§11.5** — State tracking, resume behavior, OQ-03
  invited-user default (shortened flow)
- **§20 EC-20** — Onboarding new-user test
- **§20 EC-22** — Onboarding invited-user shortened flow
- **§14.5** — Sign-in redirect logic (the onboarding-routing
  portion; the rest of §14 UI stays Session 7)

Sections NOT delivered:

- §12 form-escape surfaces → Session 6
- §14.1 AgentChatPanel rewrite → Session 7
- §14.2 ContextualCanvas click handlers → Session 7
- §14.3 SuggestedPrompts functional → Session 7
- §14.4 SplitScreenLayout onboarding mode → Session 7
- §14.6 Avatar dropdown, Mainframe Activity icon → Session 7
- §15 Canvas directive extensions → Session 6
- §20 EC-21 (Skip link navigation) → Session 6 (depends on
  form-escape surfaces)
- §21 CA-46/CA-47 master-brief numbering → Session 8
  reconciliation (Session 5 continues CA-67+ per Session 3's
  pattern)

---

## 3. Locked Decisions (inherited)

All master §3 decisions + Session 1–4 sub-brief decisions +
Session 4.5 closeout + the seven Session 5 pre-decisions below
(§4). `AuditEntry.org_id: string | null` is in place (Session
4.5); no further audit-type work in Session 5.

---

## 4. Founder pre-decisions (authoritative)

### Pre-decision 1 — Minimal functional welcome, no Session 7 imports

The Session 5 welcome page at `src/app/[locale]/welcome/page.tsx`
ships as a minimal functional surface. It renders the existing
Phase 1.1 `AgentChatPanel` against an onboarding session, wrapped
in a layout that hides the Mainframe rail. Visual polish
(typography, empty-state framing, ghost-row styling, onboarding
progress indicator) is Session 7 scope. Session 5's acceptance
bar: the page renders, the chat works end-to-end, the rail is
absent.

Session 5's welcome page MUST NOT import: `ContextualCanvas`
(Session 7), Mainframe rail components (Session 7),
`ProposedEntryCard` rendering (Session 7), `SuggestedPrompts`
(Session 7). Execution-time temptation to "just add a small
panel" is explicitly rejected.

### Pre-decision 2 — AgentChatPanel contract: `{ orgId: string | null }`

The Phase 1.1 `AgentChatPanel` is a stub; Session 7 rewrites it.
To prevent Session 7 from accidentally breaking Session 5's
welcome, Session 5 defines the component contract:

```typescript
interface AgentChatPanelProps {
  orgId: string | null;  // null during onboarding
}
```

Session 7's rewrite must honor this — `orgId: string | null`
stays required, no new required props, no rename. Session 5's
welcome imports the component once and passes `orgId={null}`.
The TypeScript compiler is the enforcement mechanism; no runtime
contract test needed. If the current `AgentChatPanel` stub
doesn't accept `orgId`, Session 5 adds that prop (making the
stub conform to the contract is a Session 5 work item; do not
block on Session 7).

### Pre-decision 3 — Invited-user detection via server component

The welcome page reads the user's memberships at load time to
branch into full-vs-shortened flow. Implementation: **Next.js
server component**, fetching memberships server-side before the
client chat component renders.

Rationale:
- One round trip instead of two (no client-side loading flash)
- No "welcome assumes full flow, then re-renders with shortened
  flow when fetch completes" jank
- Matches Next.js App Router idiom
- The shortened-flow decision is made before the first chat
  message goes out, so the orchestrator's onboarding suffix is
  correct from turn one

The membership check is a single query; ≥ 1 active membership →
invited-user (shortened flow), zero memberships → full flow.
Cite master §11.5(c) as the OQ-03 default that formalizes this.

### Pre-decision 4 — Step 4 completion is a state flag flip, not canvas_directive

Session 5 flips `state.onboarding.in_onboarding` to `false` when
step 4 completes. The welcome page observes this flag via a new
`AgentResponse.onboarding_complete?: boolean` signal and
redirects via `router.push` when the flip happens. Session 5
does NOT use `canvas_directive` for the onboarding-complete
navigation.

Rationale: `canvas_directive`'s natural consumer is
`ContextualCanvas` (Session 7). Using it for a straight same-app
navigation in Session 5 presses a canvas concern into a
navigation concern. `canvas_directive`'s first real use lands
naturally in Session 6 (directive extensions) or Session 7
(`ContextualCanvas` consumption). CA-70 stays focused on state
machine completion instead of doubling as `canvas_directive`
shape verification.

### Pre-decision 5 — Step 1 completes when display_name is set

Master §11.3 lists four fields for step 1 (name, role
preferences, locale, timezone). Locking step advance to
all-four-set would force the agent into a rigid interrogation
pattern. Rule: **step 1 completes when
`user_profiles.display_name` is set to a non-null non-empty
string.** Other fields are optional and can be set in subsequent
turns without triggering state transitions. Matches §11.1's
trigger logic where `display_name IS NULL` signals onboarding
needed.

### Pre-decision 6 — resolvePersona stub confirmed as master decision A

Session 4's `resolvePersona` returns `'controller'` when
`org_id === null`. Master decision A (brief §3) confirms this
is correct ("Onboarding user becomes controller of the org they
create"). Session 5 does NOT rewrite `resolvePersona`; Session 5
DOES add an inline comment citing master decision A so the
reasoning is visible without a git blame trail. Five-line work
item.

### Pre-decision 7 — Test delta is a floor, not a cap

Session 5's test matrix has dimensions: fresh vs resume × full
vs invited × four steps = 16 cells. Minimum is 7 tests covering
the load-bearing cases (§8). Execution MAY add tests during
commit 5 for cases discovered inadequately covered (matching
Session 4's sub-assertion pattern) without amending the
sub-brief. Execution MAY NOT remove tests — if a test turns out
redundant or infeasible, execution flags and asks.

### Pre-decision 8 — Step-4 completion signal is a template_id pattern (drafting decision)

Of the three options (respondToUser template_id / new
completeOnboarding tool / orchestrator heuristic), Session 5
uses **Option A: a specific `respondToUser` template_id pattern**.

Concrete shape:
- Template ID: `agent.onboarding.first_task.navigate` (added to
  all three locale files per i18n convention)
- The orchestrator's `handleUserMessage` inspects the
  `respondToUser` block's `template_id` on every successful
  return. When it matches `agent.onboarding.first_task.navigate`
  AND the current session is an onboarding session (state.
  onboarding.in_onboarding === true AND current_step === 4),
  the orchestrator flips `in_onboarding = false` and writes
  the state back to the DB as part of `persistSession`.
- `AgentResponse` gains `onboarding_complete?: boolean`, set to
  `true` when the flip happens (unset otherwise).
- The extended `onboardingSuffix` at `current_step === 4`
  explicitly names this template_id as the "use this when the
  user commits to a first task" marker so Claude chooses it
  correctly.

Rationale: Option A preserves the "always respondToUser at
turn end" discipline (master §6.2 item 2), adds no new tool
(honors §6.4 persona whitelist invariance + Session 5's
no-new-tools out-of-scope constraint), is fully observable via
the existing `agent.message_processed` audit row (template_id
logged), and requires only one new orchestrator detection
branch. Option B (new tool) would add a persona-whitelist
decision and a master-brief divergence. Option C (heuristic)
has no clean programmatic trigger and is untestable by design.

---

## 5. Prerequisites

- Git clean at `cbbfafd` (Session 4.5 closeout) or later
- `pnpm test` green at 209/209 (regression baseline)
- No new deps — Session 5 is pure code + UI
- No new migrations — `agent_sessions.state` JSONB is the
  storage substrate (existing column from Phase 1.1, typed
  further in Session 5)
- `ANTHROPIC_API_KEY` in `.env.local` (unchanged from Session 4;
  required for the orchestrator in non-fixture tests)

---

## 6. Work items

Nine work items. Commit 1 has a founder review gate for the
extended `onboardingSuffix` prose (matches Session 3 / Session 4
cadence for authored system-prompt content). Every commit leaves
`pnpm typecheck && pnpm test` green.

### 6.1 OnboardingState type + state.onboarding JSONB shape

**File:** `src/agent/onboarding/state.ts` (NEW).

Define the `OnboardingState` shape verbatim from master §11.5:

```typescript
export interface OnboardingState {
  in_onboarding: boolean;
  current_step: 1 | 2 | 3 | 4;
  completed_steps: number[];
  invited_user: boolean;
}
```

Plus a typed reader/writer pair:

```typescript
export function readOnboardingState(
  state: Record<string, unknown>,
): OnboardingState | null;

export function writeOnboardingState(
  state: Record<string, unknown>,
  onboarding: OnboardingState,
): Record<string, unknown>;
```

`readOnboardingState` returns `null` when `state.onboarding` is
absent or malformed (non-onboarding session). `writeOnboardingState`
returns a new state object with `state.onboarding` populated,
preserving any other keys in `state`.

Plus the Zod schema that mirrors the TS interface — same file,
so the type + the runtime validator evolve together:

```typescript
import { z } from 'zod';

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
```

This is the schema §6.6 imports for the `/api/agent/message`
route body validator. Keeping it alongside the type in
`src/agent/onboarding/state.ts` (rather than in
`src/shared/schemas/agent/`) matches the pattern Session 4 used
for narrow agent-internal shapes — broader boundary schemas
live under `src/shared/schemas/`, but this one is scoped to a
single subsystem and reads more clearly next to its interface.

**Done when:** file exists, type + two helpers + Zod schema
exported, unit coverage via integration tests in commit 5.

### 6.2 Extended onboardingSuffix

**File:** `src/agent/prompts/suffixes/onboardingSuffix.ts`
(modified).

Current signature: `onboardingSuffix(): string`. Extend to:

```typescript
export function onboardingSuffix(
  onboarding: OnboardingState | null,
): string;
```

Returns empty string when `onboarding === null` or
`in_onboarding === false`. Otherwise returns a step-aware
prompt block that:

- Names which of the four steps is current
- Lists which steps are already complete (shortened-flow users
  see steps 2+3 as pre-completed)
- Names the available tool(s) for the current step (step 1:
  `updateUserProfile`; step 2: `createOrganization` +
  `listIndustries`; step 3: embedded in step 2 per master §11.3;
  step 4: none — conversational only, the agent is offering a
  first-task menu)
- For step 4, explicitly names the template_id
  `agent.onboarding.first_task.navigate` as the completion
  signal the agent should use in `respondToUser` when the user
  commits to a first task

**Founder review gate applies at commit 1.** Session-authored
prose reviewed before landing.

### 6.3 buildSystemPrompt wiring

**File:** `src/agent/orchestrator/buildSystemPrompt.ts`
(modified).

Current onboarding branch: `if (input.persona === 'controller'
&& input.orgContext === null) sections.push(onboardingSuffix())`.

New logic: pass `onboarding: OnboardingState | null` through the
`BuildSystemPromptInput` interface; `onboardingSuffix(onboarding)`
gates on the state (returns empty string when `onboarding` is
null or `in_onboarding === false`). The existing
`persona === 'controller' && orgContext === null` guard stays as
a defense-in-depth — if the orchestrator somehow reaches
buildSystemPrompt without onboarding state set but with a null
orgContext, the old behavior (generic onboarding suffix) still
fires.

**Done when:** `BuildSystemPromptInput.onboarding` is typed,
composition order preserved, existing tests green.

### 6.4 Orchestrator state-read + transition handlers

**File:** `src/agent/orchestrator/index.ts` (modified).

Three additions inside `handleUserMessage`:

1. **Read onboarding state at turn start** — after
   `loadOrCreateSession`, call
   `readOnboardingState(session.state)` and pass the result
   (which may be null) into `buildSystemPrompt`. Session.state
   is already `Record<string, unknown>` — no schema change.

2. **Initialize onboarding state if absent** — when the session
   is fresh (empty `state`) AND the user needs onboarding
   (caller is creating a new onboarding session from the welcome
   page), the welcome page passes an
   `initial_onboarding?: OnboardingState` via a new route
   surface (§6.5). Orchestrator merges this into `session.state`
   on first turn.

3. **Detect transitions after executeTool** — for each tool
   execution that's relevant to onboarding, check the outcome
   and compute the next step:
   - `updateUserProfile` returned with `display_name` set (Pre-
     decision 5): step 1 completes.
   - `createOrganization` succeeded: steps 2 AND 3 complete
     together (step 3 is embedded per master §11.3).

   **Step-advance rule** (replaces the hardcoded 1→2 / 2→4
   pattern so the invited-user shortened flow works correctly):
   when a step N completes, add N to `completed_steps`, then set
   `current_step` to the smallest integer in `{1, 2, 3, 4}` that
   is greater than N AND not in `completed_steps`. If no such
   integer exists (all higher steps are already marked complete
   via the invited-user initialization), set `current_step = 4`
   as the terminal pre-completion state.

   Worked examples:
   - Fresh user at step 1 completes step 1 → `completed_steps`
     becomes `[1]`; smallest integer > 1 not in it is `2` →
     `current_step = 2`.
   - Fresh user at step 2 completes step 2 + 3 atomically →
     `completed_steps` becomes `[1, 2, 3]` (1 was already there
     from step-1 completion); smallest > 3 not in it is `4` →
     `current_step = 4`.
   - Invited user at step 1 with `completed_steps = [2, 3]`
     completes step 1 → `completed_steps` becomes `[2, 3, 1]`;
     smallest > 1 not in it is `4` → `current_step = 4`
     (skipping 2 and 3, which are pre-completed from
     initialization).

   **Edge case:** if `completed_steps` already contains all of
   `{1, 2, 3, 4}` before step-N completion, something upstream
   is broken (step completion fired on an already-terminal
   machine). The transition handler logs an error and does not
   re-advance — execution sees it in logs and flags.

4. **Detect step-4 completion** — inspect the `respondToUser`
   block's `template_id` after the tool-use partition. If it
   matches `agent.onboarding.first_task.navigate` AND onboarding
   state shows `current_step === 4 && in_onboarding === true`,
   flip `in_onboarding = false`, set `onboarding_complete: true`
   on the returned `AgentResponse`.

5. **Persist state changes** — `persistSession` gains a
   `state?: Record<string, unknown>` parameter; when non-null,
   the UPDATE includes `state = $new_state`. All three write
   sites above go through this single path.

   **State is persisted ONLY on the success path** —
   respondToUser present, no validation errors. Failure paths
   (Q13 exhaustion, structural-retry exhaustion) persist
   conversation via the existing `persistSession` call but MUST
   NOT persist state changes. Rationale: a failed turn should
   be replayable without skipping a step. If `updateUserProfile`
   validation fails twice and hits Q13 exhaustion, `current_step`
   stays at 1; the user's next message is still a step-1 turn.
   Concrete implementation: the two failure-path `persistSession`
   calls pass `state: undefined` (or omit the parameter); only
   the success-path call passes the new state.

**Done when:** handleUserMessage reads state, advances on tool
outcomes using the smallest-uncompleted-step rule, detects
step-4 completion, persists state only on the success path, and
`AgentResponse` exposes `onboarding_complete`.

### 6.5 AgentResponse shape extension

**File:** `src/agent/orchestrator/index.ts` (same module as §6.4;
interface edit).

Add optional field:

```typescript
export interface AgentResponse {
  session_id: string;
  response: StructuredResponse;
  canvas_directive?: CanvasDirective;
  proposed_entry_card?: ProposedEntryCard;
  trace_id: string;
  onboarding_complete?: boolean;  // NEW — set true when step 4 completes
}
```

**Non-breaking** — existing consumers that don't inspect this
field are unaffected. CA-60 (apiAgentMessage) and other Session
4 tests do not assert on its absence, so no test changes
required.

### 6.6 /api/agent/message route — initial_onboarding parameter

**File:** `src/app/api/agent/message/route.ts` (modified).

Extend the request-body Zod schema to accept an optional
`initial_onboarding` field:

```typescript
z.object({
  org_id: z.string().uuid().nullable(),
  message: z.string().min(1),
  locale: z.enum(['en', 'fr-CA', 'zh-Hant']).optional(),
  session_id: z.string().uuid().optional(),
  canvas_context: canvasContextSchema.optional(),
  initial_onboarding: onboardingStateSchema.optional(),  // NEW
}).strict()
```

`onboardingStateSchema` is the Zod shape of `OnboardingState`
(four-field object). It's passed through to `handleUserMessage`
via a new optional field on `HandleUserMessageInput`. The
orchestrator initializes `session.state.onboarding` from this
value on the first turn of a fresh onboarding session.

**Done when:** the route accepts `initial_onboarding`, passes it
through, and the orchestrator uses it correctly on fresh
session first-turn.

### 6.7 Welcome page (new)

**File:** `src/app/[locale]/welcome/page.tsx` (NEW — server
component).

Server-component flow:
1. Read the authenticated user's session (via `buildServiceContext`
   or the equivalent server-side auth check).
2. Query `memberships` filtered to the caller's user_id + status
   = 'active'. Count.
3. Query `user_profiles.display_name` for the caller.
4. Compute initial `OnboardingState` per master §11.5(c):
   - `in_onboarding: true`
   - `current_step: 1` — always. Master §11.1's trigger only
     routes users to `/welcome` when `display_name IS NULL`, so
     both fresh and invited users need step 1 (profile). The
     advance rule in §6.4 item 3 handles the invited-user
     shortened flow by skipping steps 2+3 on step-1 completion.
   - `completed_steps`: `[]` for fresh user (zero memberships),
     `[2, 3]` for invited user (org + industry already exist;
     profile is still needed via step 1). Matches master
     §11.5(c) verbatim.
   - `invited_user`: true if ≥ 1 active membership, else false
5. Render a minimal layout — no Mainframe rail, no canvas — with
   `<AgentChatPanel orgId={null} initialOnboardingState={...} />`
   embedded.

**AgentChatPanel** receives the computed OnboardingState via a
new prop `initialOnboardingState?: OnboardingState`. The client
component's first POST to `/api/agent/message` includes this
value as `initial_onboarding` (passed through per §6.6).
Subsequent messages rely on the persisted session state and do
not re-send the initial state.

**Invited-user orgId in Session 5: null.** Both fresh and
invited users land on the welcome page with
`<AgentChatPanel orgId={null} ... />`. Option A (passing the
invited user's first-membership `org_id`) would load OrgContext
and give step 4 richer conversational context — "Want to see
the CoA for {org_name}?" vs "Want to see your CoA?" — but it
forces the orchestrator to treat onboarding and non-onboarding
sessions asymmetrically (org-switch detection would fire,
`agent.*` audit emits would fire at normal cadence, onboarding
suffix gating would depend on `state.onboarding` rather than
`org_id === null`). Session 5 takes the simpler Option B:
onboarding is uniformly orgless regardless of invited-user
status. Step 4's conversational menu works without
`OrgContext`. The richer-context question is deferred to a
later session where the trade-off can be made against live
usage data. The welcome page still has the membership list
client-side (for the invited-user case the firstOrgId is
known), so the completion `router.push` at onboarding-complete
has the target org available without needing the orchestrator
to know it.

**Layout constraint:** the welcome page does NOT wrap in
`SplitScreenLayout` (Session 7 scope per master §14.4). It uses
a flat div or a Session-5-local layout primitive. The point is:
no rail, no canvas, just the chat full-width.

**Done when:** the page exists, renders for a test user, computes
onboarding state correctly, and the chat panel handles an initial
onboarding turn end-to-end.

### 6.8 Sign-in redirect logic

**File:** `src/app/[locale]/sign-in/page.tsx` (modified).

Current post-auth behavior: `router.push('/${locale}/admin/orgs')`.

New behavior:
1. After `signInWithPassword` succeeds, query the authenticated
   user's memberships + `user_profiles.display_name`.
2. If memberships count is 0 OR display_name is null →
   `router.push('/${locale}/welcome')`.
3. Otherwise → existing behavior (`router.push('/${locale}/admin/
   orgs')` or equivalent).

Membership + profile reads go through the browser client since
the sign-in page is already `'use client'`. RLS scopes the
reads to the caller (user_profiles SELECT is own-profile-only;
memberships SELECT is own-membership-only). Each read is a
single round trip; total sign-in flow gains ~100ms on a fresh
sign-in (acceptable).

**Done when:** the sign-in page redirects onboarding-needed users
to `/welcome` and existing users to their previous destination.

### 6.9 AgentChatPanel prop contract + stub conformance

**File:** `src/components/agent/AgentChatPanel.tsx` (modified; or
wherever the Phase 1.1 stub lives — execution confirms).

If the current stub doesn't already accept `orgId: string | null`,
Session 5 adds that prop + the `initialOnboardingState?:
OnboardingState` prop per §6.7. No behavioral changes to the
stub — just the prop shape that Session 7 must honor.

**Done when:** `AgentChatPanelProps` matches Pre-decision 2;
Session 5's welcome imports cleanly; existing Session 4 test
patterns (which don't render this component) are unaffected.

### 6.10 resolvePersona inline comment

**File:** `src/agent/orchestrator/index.ts`, `resolvePersona`
function.

Add a five-line comment above the `if (org_id === null) return
'controller';` branch:

```typescript
// Master decision A (brief §3): onboarding users become
// controllers of the org they create. The null-org branch here
// returns 'controller' so the system prompt + tool whitelist
// match what the user will become once createOrganization
// succeeds. Confirmed in Session 5 Pre-decision 6.
```

**Done when:** the comment is present and references master
decision A + Session 5 Pre-decision 6.

### 6.11 Mandatory pre-execution Cited-Code Verification grep

Per conventions.md. Before commit 1:

```bash
grep -rnE 'onboarding|in_onboarding|welcome' \
  src/agent/ src/app/ docs/09_briefs/phase-1.2/
grep -rn "state.onboarding\|OnboardingState" src/
grep -rn "last_login_at\|display_name IS NULL" src/
```

Expected state at session start (per the drafting-session grep
documented in the friction journal):
- First grep: ~9 hits in `src/agent/` (Session 3/4 onboarding
  suffix, persona + orchestrator references, createOrganization
  + listIndustries tools); **zero hits in `src/app/`** (Session
  5 creates the welcome page and the sign-in redirect).
- Second grep: **zero hits** (Session 5 introduces both).
- Third grep: `last_login_at` used only for login-time tracking
  in `userProfileService` + `membershipService` (NOT as an
  onboarding signal — Pre-decision 5 uses `display_name`
  instead); zero `display_name IS NULL` hits in source code.

Any additional hits → flag before proceeding with commit 1.

---

## 7. Exit Criteria

Eleven `S5-N` criteria.

| # | Criterion | Verification |
|---|---|---|
| S5-1 | `OnboardingState` type exported from `src/agent/onboarding/state.ts` | `grep -n "export interface OnboardingState" src/agent/onboarding/state.ts` returns 1 |
| S5-2 | `readOnboardingState` + `writeOnboardingState` helpers exported | grep returns 2 |
| S5-3 | `onboardingSuffix` accepts `OnboardingState \| null` and returns step-aware prose for steps 1–4 | CA-67, CA-68 pass |
| S5-4 | `buildSystemPrompt` threads `onboarding` through its input | CA-67 asserts step-1 suffix language in generated prompt |
| S5-5 | Orchestrator advances `current_step` after `updateUserProfile` when `display_name` becomes non-null | CA-68 passes |
| S5-6 | Orchestrator advances to step 4 after `createOrganization` success (steps 2+3 completed atomically) | CA-69 passes |
| S5-7 | Orchestrator flips `in_onboarding=false` on `respondToUser` with template_id `agent.onboarding.first_task.navigate` when state is at step 4 | CA-70 passes |
| S5-8 | `AgentResponse.onboarding_complete` is `true` when the flip happens (otherwise unset) | CA-70 asserts |
| S5-9 | Welcome page at `src/app/[locale]/welcome/page.tsx` renders server-side with correct initial state for full vs invited user | CA-71 passes (invited user case), manual smoke for full user |
| S5-10 | Sign-in page redirects onboarding-needed users to `/welcome`, others to existing destination | CA-73 passes (two it-blocks: zero memberships + membership with null display_name) |
| S5-11 | Full regression clean: 209 baseline + new CA-67–73+ = ~218 tests, 0 failures | `pnpm test` |

---

## 8. Test delta

At least seven new tests (CA-67 through CA-73). Execution may
add sub-assertions or additional it-blocks per Pre-decision 7.

| # | File | Asserts |
|---|---|---|
| CA-67 | `tests/integration/onboardingSuffixStepAware.test.ts` | `buildSystemPrompt` with `OnboardingState{current_step:1, in_onboarding:true}` produces a prompt that names step 1 + the `updateUserProfile` tool. Repeat for steps 2, 3, 4 — each in its own it-block. Step 4 prompt explicitly names the `agent.onboarding.first_task.navigate` template_id. |
| CA-68 | `tests/integration/onboardingStep1Transition.test.ts` | Start session with `state.onboarding = { in_onboarding:true, current_step:1, completed_steps:[], invited_user:false }`. Seed a fixture that calls `updateUserProfile({displayName:'Test Name'})`. After handleUserMessage: reload session; `state.onboarding.current_step === 2`, `completed_steps` contains `1`. |
| CA-69 | `tests/integration/onboardingStep2And3Transition.test.ts` | Start at step 2. Fixture calls `createOrganization` with valid input. After handleUserMessage: reload session; `current_step === 4`, `completed_steps` contains `1, 2, 3`. |
| CA-70 | `tests/integration/onboardingStep4Completion.test.ts` | Start at step 4. Fixture returns `respondToUser` with `template_id: 'agent.onboarding.first_task.navigate'`. After handleUserMessage: returned `AgentResponse.onboarding_complete === true`; reload session; `state.onboarding.in_onboarding === false`. Second fixture: `respondToUser` with a different template_id at step 4 → `onboarding_complete` stays unset, `in_onboarding` stays true. |
| CA-71 | `tests/integration/onboardingInvitedUser.test.ts` | Compute initial OnboardingState as the welcome page would: user with one active membership + null display_name → `{current_step:1, completed_steps:[2,3], invited_user:true}` per master §11.5(c). Then assert that when step 1 completes, the advance rule (§6.4 item 3) moves `current_step` directly to `4` (smallest int > 1 not in `{2,3,1}`), reflecting the shortened flow. `completed_steps` after step-1 completion is order-independent `{1, 2, 3}` — use a set-equality assertion (`expect(new Set(s)).toEqual(new Set([1,2,3]))`) rather than array-order to avoid coupling the test to the advance-rule's append order. |
| CA-72 | `tests/integration/onboardingResumeBehavior.test.ts` | Create an onboarding session at step 2, don't complete. Simulate a second message turn (same session_id, within TTL). buildSystemPrompt's generated prompt on the second turn contains step-2 language (resume from current_step). Two it-blocks: (a) within TTL — resume; (b) beyond TTL — new session, step 1 fresh. |
| CA-73 | `tests/integration/onboardingSignInRedirect.test.ts` | Two it-blocks in one file. (1) User with zero active memberships → sign-in post-auth logic routes to `/welcome`. (2) User with active membership + populated display_name → routes to `/admin/orgs`. Tests the redirect decision function (a pure function extracted from the sign-in page), not the browser flow. |

Drafter may split CA-67's four step-aware assertions into a
single file with multiple it-blocks (as drafted here) OR into
four separate files — execution decides. Final numbering is
execution-time.

---

## 9. What is NOT in Session 5

- `AgentChatPanel` rewrite (Session 7)
- Welcome page visual polish — typography, empty-state framing,
  ghost-row styling, onboarding progress indicator (Session 7)
- Form-escape surfaces — profile, org, invite editors (Session 6)
- "Skip — I know what I'm doing" link implementation (Session 6
  depends on the form-escape routes existing)
- Canvas directive extensions for form surfaces (Session 6)
- Mainframe rail visibility toggle (Session 7)
- `SplitScreenLayout` onboarding mode (Session 7)
- `canvas_directive` for onboarding completion (Pre-decision 4
  defers its first production use)
- Master §14.6 avatar dropdown, Mainframe Activity icon
  (Session 7)
- New tools, new deps, new migrations, new ActionNames, new
  ServiceError codes
- Tightening `canvasDirectiveSchema.card` from `z.unknown()` to
  `ProposedEntryCardSchema` (Session 7)
- Master §21 CA-* numbering reconciliation (Session 8)
- `agent.*` audit emit skip-rule reconsideration (flagged in
  Session 4.5 for "Session 5 to decide"; Session 5 keeps the
  skip rule intact — richer onboarding audit coverage is not
  worth the scope expansion here, and null-org emits would
  require loosening Clarification D mid-flow)

---

## 10. Stop Points for This Session

The execution session produces:

- `src/agent/onboarding/state.ts` (NEW)
- Updated `src/agent/prompts/suffixes/onboardingSuffix.ts`
- Updated `src/agent/orchestrator/buildSystemPrompt.ts`
- Updated `src/agent/orchestrator/index.ts` (state read/write,
  transition handlers, AgentResponse field, resolvePersona
  comment)
- Updated `src/app/api/agent/message/route.ts`
  (`initial_onboarding` body field)
- `src/app/[locale]/welcome/page.tsx` (NEW — server component)
- Updated `src/components/agent/AgentChatPanel.tsx` (prop
  contract conformance)
- Updated `src/app/[locale]/sign-in/page.tsx` (redirect logic)
- One new template_id key (`agent.onboarding.first_task.navigate`)
  added to all three locale files (`messages/en.json`,
  `messages/fr-CA.json`, `messages/zh-Hant.json`) per Pre-decision
  8. The `onboardingSuffix` itself is English-only per Session 3
  convention (prompt prose, not user-facing strings), so no
  locale-routed prompt keys are added.
- 7+ new test files (`tests/integration/*.test.ts`)
- Updated `docs/07_governance/friction-journal.md`
  (session-close entry)

Stop after all 11 S5 exit criteria pass. Do **not** begin
Session 6.

---

## 11. Commit plan

Five commits. Commit 1 has a founder review gate for the
extended `onboardingSuffix` prose (matches Session 3 + Session 4
cadence for authored system-prompt content). Every other commit
lands without a gate. Every commit green — no intentional red
intermediate state.

- **Commit 1** — `feat(phase-1.2): OnboardingState + extended onboardingSuffix + buildSystemPrompt wiring`
  Files: new `src/agent/onboarding/state.ts`, updated
  `src/agent/prompts/suffixes/onboardingSuffix.ts`, updated
  `src/agent/orchestrator/buildSystemPrompt.ts`. Typecheck clean,
  209 existing tests still pass. **Founder review gate for the
  onboardingSuffix prose** (step-1 through step-4 language,
  including the template_id naming at step 4).

- **Commit 2** — `feat(phase-1.2): orchestrator state transitions + AgentResponse.onboarding_complete`
  Files: updated `src/agent/orchestrator/index.ts` (state
  read/write, three transition detectors, template_id detection
  at step-4 completion, resolvePersona comment), updated
  `src/app/api/agent/message/route.ts` (`initial_onboarding`
  body field). Typecheck + 209 tests green.

- **Commit 3** — `feat(phase-1.2): welcome page + AgentChatPanel prop contract`
  Files: new `src/app/[locale]/welcome/page.tsx`, updated
  `src/components/agent/AgentChatPanel.tsx` (prop contract
  conformance — `orgId`, `initialOnboardingState`). Typecheck +
  209 tests green. Execution confirms the welcome page renders
  via `pnpm dev` smoke check (don't commit the dev output;
  just verify).

- **Commit 4** — `feat(phase-1.2): sign-in redirect logic`
  Files: updated `src/app/[locale]/sign-in/page.tsx`
  (post-auth membership + display_name check, conditional
  `/welcome` redirect). Typecheck + 209 tests green.

- **Commit 5** — `test(phase-1.2): CA-67 through CA-73 — onboarding state machine + welcome + redirect`
  Files: 7+ new test files; updated `messages/en.json`,
  `messages/fr-CA.json`, `messages/zh-Hant.json` for the new
  template_id(s). Full regression green.

If execution surfaces a reason to split or merge, do so — but
every commit must leave `pnpm typecheck && pnpm test` green.

---

*End of Phase 1.2 Session 5 Sub-Brief.*

---

## 2026-04-20 ERRATA (Session 8, Commit 3)

The Session 5 sub-brief's references to `/admin/orgs` at :572 and :685
described actual Phase 1.1 behavior at drafting time and were not
placeholders. Session 5 Commit 5 landed a new `resolveSignInDestination`
helper that routes sign-in to `/[locale]/[firstOrgId]/` (master §14.5),
superseding the `/admin/orgs` post-auth target for the sign-in path.

The Session 7.1 friction-journal handoff subsequently claimed the
`/admin/orgs` route "doesn't exist in the shipped codebase" — this was
factually wrong; `src/app/[locale]/admin/orgs/page.tsx` ships from the
Phase 1.1 foundation commit (70e65ef) as a working client-side
org-creation form.

`AgentChatPanel.OnboardingChat.resolveCompletionHref`
(AgentChatPanel.tsx:604-622) routes onboarding-complete users to
`/[locale]/[firstOrgId]/` when a membership exists, and falls through
to `/${locale}/admin/orgs` only in the degenerate "onboarding-
completed-but-no-membership" edge case — a Phase 1.1 safety net that
fires when a user finishes onboarding but has no memberships yet,
letting them recover by creating an org manually. Session 8 preserved
this fall-through rather than changing it to match a wrong premise;
future sessions may reconsider if operational data shows the edge
case fires or if the `/admin/orgs` route is deprecated in favor of
a different recovery flow.

Supersedes the :572 and :685 references as historical artifacts;
retained for audit trail.
