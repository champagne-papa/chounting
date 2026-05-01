# Phase 1.3 Session 33 Sub-Brief — Onboarding Integration Fixes (Pre-Demo)

*This sub-brief drives a single execution session. The canonical
docs at `docs/00_product/product_vision.md`,
`docs/02_specs/agent_autonomy_model.md`, and the ADR set are the
architecture documents and are never modified by this session.
Where this sub-brief and the canonical docs disagree, the
canonical docs win — stop and flag rather than deviate.*

**Phase placement.** Sibling thread to S32-onboarding-posture.
Same arc, downstream of S32: S32 shipped the structural and
postural revision (suffix branching, welcome header, first-arrival
treatment, drift-list NOTE); this session closes the integration
gaps the founder surfaced when running the fresh-user flow
end-to-end against S32's shipped surface on 2026-04-30. Not
Path C audit cleanup (S28–S31). Not Path A deployment readiness.
Not Phase 2 surface expansion. Sequencing is **gate-shape
demo-blocker** — three named failures interrupt the
fresh-user-to-Arrival flow on the demo path, and the demo is
imminent. Land before any other Phase 1.3 thread that competes
for founder attention.

---

## 1. Goal

Close three integration gaps in the onboarding flow that surfaced
during the founder's pre-demo dry-run on 2026-04-30 (S32 closeout
day). All three are **integration failures at component
boundaries**, not feature gaps and not bugs in any single
component's internal logic. Failure 1 is template-id resolver
wiring missed in the OnboardingChat component when ProductionChat
shipped its resolver in Session 7; the agent's onboarding
greetings render as `[agent.greeting.welcome]` instead of
"Welcome, Phil Chou." Failure 2 is a first-turn ordering ambiguity
at the human-system interaction boundary — the user types their
name as their opening message, but the agent legitimately greets
first, and the user's intended-as-name input is consumed as small
talk. Failure 3 is a form-escape dead-end — `UserProfileEditor`'s
save handler exits with `'saved'` state and no redirect, which is
correct for already-onboarded users hitting `/settings/profile`
but wrong for a fresh-user-via-skip-link who needs to return to
`/welcome`. This session ships the three fixes, a friction-journal
entry codifying the placeholder-decay lesson surfaced by Failure
1, and an end-to-end dev-smoke walkthrough as the binding
acceptance gate. **No agent prompt rewrites beyond targeted
step-1 tightening; no OnboardingChat-vs-ProductionChat
unification; no orchestrator changes.**

---

## 2. Anchor SHA

**TBD** — set by orchestrating session at execution kickoff.
Verify HEAD at Task 1: anchor must be at or after the most
recent S32 commit (the Commit 2 SHA referenced in the
friction-journal NOTE at `docs/07_governance/friction-journal.md`
2026-04-30 entry — `37a24a0` per that record; verify at execution
in case of intervening cleanup commits like the
`session-config-cleanup-0430` thread). Halt and surface if HEAD
precedes that anchor — this thread builds directly on S32's
shipped surface and must not interleave.

---

## 3. Upstream authority

The framing in §§4–5 is downstream of, and accountable to:

- **`docs/00_product/product_vision.md`** — The Thesis ("not an
  accounting UI with AI assistance; a deterministic financial
  engine with a probabilistic interface") and the Thesis
  extension ("the product is not the AI; the product is the
  control surface over the AI"). The opening prompt this session
  adds at `/welcome` is a structural element of that control
  surface — a static, system-rendered question that scopes the
  user's first message before the probabilistic agent layer
  receives it.
- **S32 closeout NOTE in `docs/07_governance/friction-journal.md`
  (2026-04-30)** — failure-mode provenance. The S32 thread shipped
  the postural revision and the structural surfaces around it; the
  three integration gaps in this brief surfaced when the founder
  exercised the shipped surface end-to-end during demo prep.
  Failure 1 in particular was masked through Sessions 5 → 7 → S32
  because the placeholder rendered visibly only when the agent
  emitted greetings — a code path exercised only in fresh-user
  smoke testing.
- **ADR-0006** — agent persona unnamed. The opening prompt at
  `/welcome` (Failure 2 fix) MUST NOT introduce names, metaphors,
  or anthropomorphic framing. The line is system-side ("What
  should I call you?") not agent-side; it is the system asking on
  behalf of the principal's-yet-unconfigured workspace.
- **ADR-0002** — confidence never surfaces. Re-stated for any
  copy this session authors.
- **`docs/02_specs/agent_autonomy_model.md`** — Principle 4
  (authority never flows upward) governs the framing of the
  opening prompt. The system asks; the principal answers. The
  agent does not present itself as autonomous in this exchange.
- **The `OnboardingState` type** at
  `apps/web/src/agent/onboarding/state.ts` — the state-machine
  contract is unchanged this session. No new fields, no new
  invariants, no new state-advance rules.
- **S32 brief Pre-decision 1 (posture test)** — applies to all
  authored prose this session, in particular the opening prompt
  at `/welcome` and any tightening of step-1 suffix prose.
- **S32 brief Pre-decision 6 (drift list)** — applies in force.
  No "quick wins," no "AI magic moments," no engagement bait, no
  data-first onboarding patterns. The opening prompt is a sober
  structural element, not a delight moment.
- **Diagnostic conversation, 2026-04-30 (chat-mode pattern from
  CLAUDE.md governance — "briefs cite their philosophical
  upstream").** The framing of the three failure modes — and the
  decision to bundle them as integration fixes rather than
  reopening the S32 surface — is the output of a diagnostic
  conversation between founder and Claude during the dry-run.
  The fix-shape recommendations (resolver wiring, server-rendered
  opening prompt, query-param onboarding-mode detection) are
  founder-ratified outputs of that conversation, not independent
  derivations.

---

## 4. The three failure modes

Each failure has: observed symptom, root cause, recommended fix,
alternative fix (if any), and line-range estimate. All line
ranges verify at execution Task 2; halt and surface on >5-line
drift in the structure of affected blocks.

### Failure 1 — Template-id placeholder rendering in OnboardingChat

**Observed symptom.** During the fresh-user dry-run, the agent's
first response to "Phil Chou" rendered as `[agent.greeting.welcome]`
(literal bracketed string) instead of "Welcome, Phil Chou." Every
subsequent agent turn during onboarding renders the same
placeholder shape: bracketed template_id literal, never resolved
to user-facing copy.

**Root cause.** At
`apps/web/src/components/bridge/AgentChatPanel.tsx:692–695`
(verified at brief-creation), the `OnboardingChat` subcomponent
computes `assistantText` as:

```typescript
const assistantText =
  typeof data.response?.template_id === 'string'
    ? `[${data.response.template_id}]`
    : '(no response)';
```

This is a debug placeholder shipped in Session 5 with the
intent that ProductionChat's eventual rendering pattern would
absorb it during Session 7. ProductionChat shipped its resolver
at Session 7 Commit 3 (commit `9be396c`) — see `renderAssistantText`
helper at lines 379–385 using
`tRoot = useTranslations()` (line 130) — and the unification was
implicitly assumed but never written. The placeholder remained
through Session 7, S32, and into the demo-rehearsal surface; the
masking condition was that placeholder rendering is observable
only during fresh-user smoke, which Sessions 5.1 / 5.2 / S32 each
ran but produced no fire because they were testing other surfaces
(protocol invariants, posture wording, structural shapes).

**Recommended fix.** Wire `useTranslations` into `OnboardingChat`
exactly mirroring `ProductionChat`'s `renderAssistantText`
pattern. The `useTranslations` import is **already present at
the file top** (line 19, in use by `ProductionChat` at lines 129
and 130) — the fix reuses the existing import; no new imports
are added. Concrete shape:

```typescript
// (no new import needed — useTranslations already imported at line 19)

function OnboardingChat({ /* existing props */ }) {
  // ... existing state ...
  const tRoot = useTranslations();

  const renderAssistantText = (
    template_id: string,
    params: Record<string, unknown> | undefined,
  ): string => {
    try {
      return tRoot(template_id, (params ?? {}) as never);
    } catch {
      return template_id; // bare template_id, NOT bracketed
    }
  };

  // In the send() success branch:
  const assistantText = typeof data.response?.template_id === 'string'
    ? renderAssistantText(data.response.template_id, data.response.params)
    : '(no response)';
}
```

The catch branch returns the bare template_id (without brackets)
to match ProductionChat's `renderAssistantText` shape (line 383)
— the bracketed form was the debug placeholder; the
production-shape fallback is the bare key, which is still an
observable signal in dev that a template_id is missing from
`messages/en.json` without being framed as a deliberate-debug
artifact.

**No alternative fix.** The placeholder is unambiguously a
shipped-debug-shape decay; the resolver wiring is the single
correct intervention.

**Line-range estimate.** AgentChatPanel.tsx:608–778 is the
OnboardingChat subcomponent. The edit clusters at:

- Add `tRoot` and `renderAssistantText` near the top of the
  function (~+8 lines, around line 620).
- Replace the assistantText computation at lines 692–695 with
  the resolver call (~+1 / -3 lines).
- Total: ~+9 / -3 in `AgentChatPanel.tsx`.

### Failure 2 — First-turn ordering: greeting vs registration

**Observed symptom.** During dry-run, fresh user navigates to
`/welcome`, sees only the chat panel (no scaffolded prompt), types
"Phil Chou" as their first message — the obvious thing, since the
welcome page presents the chat panel and waits. The agent receives
"Phil Chou" + the step-1 onboarding suffix, decides on its first
turn to greet rather than register, emits `respondToUser` with
`template_id: "agent.greeting.welcome"` and `params: { user_name:
"Phil" }` — and does NOT call `updateUserProfile`. Result:
"agent.greeting.welcome" renders (post-Failure-1 fix) as
"Welcome, Phil." But the state machine has not advanced: profile
is still unset, the user has already typed what they thought was
their name, and the next turn the agent re-asks for a name. The
user has to type their name again. State machine never advances
on the original input.

**Root cause.** This is a failure at the **human-system
interaction boundary**, not in the orchestrator's logic and not
in the agent's reasoning. The orchestrator main loop at
`apps/web/src/agent/orchestrator/index.ts` (around line 406 —
`respondBlock = toolUses.find((b) => b.name === 'respondToUser')`)
correctly handles whatever tool calls the agent emits; the agent
correctly chooses among legitimate options based on the prompt;
the user correctly types what the welcome page led them to think
was the right input. The gap is that the welcome page does not
make explicit what the system is asking for — there is no
visible system-side opening question. The chat panel renders an
empty conversation; the user infers from context they should
type their name; the agent receives the input without any
disambiguation that would force `updateUserProfile` over
`agent.greeting.welcome` on the first turn.

The step-1 suffix at
`apps/web/src/agent/prompts/suffixes/onboardingSuffix.ts:76–84`
(Commissioning branch, post-S32) instructs the agent to "ask for
their display name first" but does NOT say "treat the user's
opening message as a name if it looks like one" or "do not
greet on turn 1." The agent has interpretive latitude; under
that latitude, greeting first is a legitimate posture choice.

**Recommended principal fix — audit and refine the existing
opening prompt in `OnboardingChat`'s empty-state branch.** The
empty-state at `AgentChatPanel.tsx:725–729` already contains a
static client-rendered prompt:

```typescript
{turns.length === 0 && (
  <div className="text-sm text-neutral-500">
    Let&apos;s get your profile set up. What&apos;s your name?
  </div>
)}
```

This line was shipped at Session 5 and survives at HEAD. It is
the structural opening prompt in shape; the integration gap is
that it has decayed in **prominence** — `text-neutral-500` and
its placement at the top of the conversation `overflow-y-auto`
div make it visually subordinate to the chat input, not a
visible system-side anchor that scopes the user's first message.
A user scanning the page sees the chat input as the primary
affordance and types into it before reading the small grey line
above.

**The fix is therefore audit-and-refine, not add-new.** Concrete
shape:

(a) **Audit the existing wording against §Pre-decision 4 posture
test.** "Let's get your profile set up. What's your name?" is
acceptable but possibly verbose; "What should I call you?" is a
cleaner posture-test-passing variant per the diagnostic
conversation. Final wording deferred to founder review gate per
the S32 Pre-decision 7 copy-pass pattern. The implementing
session does NOT write fresh prompt prose without first reading
what's already there and applying the posture test to it.

(b) **Promote visual prominence so the prompt is visible on
first paint** without scroll, and reads as the system asking
rather than as caption text. Concrete change: lift the line out
of the scrollable `overflow-y-auto` conversation div and render
it as a sibling above (or as a header inside the same div but
styled to read as the active question — larger type, less muted
color). Goal: the user's eye lands on the opening prompt before
the chat input.

The agent does not see this prompt — it is rendered by
`OnboardingChat` as a static client-side element, not injected
into the orchestrator's prompt stream. The user sees it; their
first message is then unambiguously interpreted (by them and by
the agent) as the answer to that question; the agent's first
tool call becomes deterministic `updateUserProfile`.

The opening prompt is **structural** in the same way the welcome
header (S32 Pre-decision 4) is structural — quiet, neutral,
unbranded, posture-test-passing. On Joining flows
(`invited_user === true`), the same prompt fires — Joining-flow
users also need to register their display name; the question is
the same.

**Recommended alternative / sibling fix — step-1 suffix prose
tightening.** A targeted addition to the Commissioning branch of
`onboardingSuffix.ts` step 1 (lines 76–84) instructing the agent:

> On the user's first turn that contains plausible name content
> (a string of one to four words that looks like a person's name
> and is not a question), call `updateUserProfile` immediately
> with that string as `displayName`. Do NOT emit
> `agent.greeting.welcome` on the same turn — the greeting is
> reserved for the post-`updateUserProfile` confirmation turn,
> not the first turn.

Same addition mirrored into the Joining branch (lines 64–74) with
the same instruction — Joining users also type their name on
their first turn.

**Combined-fix posture.** The two fixes are sibling, not
exclusive. Principal (server-rendered opening prompt) is the
load-bearing fix because it removes interpretive ambiguity at
the human-system boundary; alternative (suffix tightening) is a
defense-in-depth tightening that handles the case where the
principal prompt is ignored or misread by the agent. Operator
ratifies at Pre-decision 2 whether to ship both or principal-only.

**Line-range estimate (principal fix only).**

- `apps/web/src/components/bridge/AgentChatPanel.tsx` — refine
  the existing empty-state block at lines 725–729: revise wording
  per posture-test audit AND/OR promote visual prominence (lift
  out of scrollable div, restyle for active-question reading).
  ~+5 / -3 lines if wording-only; ~+10 / -5 if wording + visual
  prominence promotion. The existing line is refactored, not
  duplicated — two adjacent prompts would be redundant.

**Line-range estimate (combined: principal + suffix tightening).**

- `AgentChatPanel.tsx` — same ~+12 / -3 as above.
- `apps/web/src/agent/prompts/suffixes/onboardingSuffix.ts` —
  ~+8 / -0 added to each of the two step-1 branches (Commissioning
  + Joining), shared instruction text via local const if
  applicable; ~+10 / -0 net.

### Failure 3 — Form-escape post-save no-redirect

**Observed symptom.** During dry-run, fresh user clicks the
"Skip to form" link at `/welcome` (S32-shipped, lines 125–132),
arrives at `/[locale]/settings/profile`, fills out the
`UserProfileEditor` form, clicks "Save changes." The PATCH to
`/api/auth/me` succeeds; the form displays "Profile updated." in
green; `saveState` is set to `'saved'`. And then nothing happens
— no redirect, no transition, no signal that the user can now
proceed. The user is stuck on the settings page with their
profile saved, with no path back to `/welcome` to continue
onboarding (org commissioning + Arrival). Manual workaround:
type `/welcome` in the URL bar.

**Root cause.** `UserProfileEditor.handleSave` at
`apps/web/src/components/canvas/UserProfileEditor.tsx:69–115` is
shaped for the post-onboarding case (already-onboarded user
visits `/settings/profile` to update their info). The save
returns silently with `'saved'` state because the user is
already on the settings page; they don't need to be taken
anywhere. For an already-onboarded user, this is correct. For a
fresh-user-via-skip-link, it is a dead-end.

**Recommended principal detection mechanism — explicit query
param `?from=welcome`.** Mirror S32's Pre-decision 5
`?first_arrival=1` pattern (the analogous decision: a transient
client-side signal carried via URL rather than persisted on
state). The skip link at `apps/web/src/app/[locale]/welcome/page.tsx:127`
is updated to point at `/${locale}/settings/profile?from=welcome`
instead of the bare path. The form reads the param via
`useSearchParams` from `next/navigation`, stores it in a
ref/state on mount, and on save success (`setSaveState('saved')`
branch at line 107) checks the param: if present, calls
`router.push(\`/${locale}/welcome\`)` after a short visible
delay (e.g., 500ms — long enough for the green "Profile updated"
to register, short enough not to feel laggy).

**Recommended alternative — server-side onboarding-state read at
form mount.** The form could read the user's `OnboardingState`
from `agent_sessions.state.onboarding` (or a dedicated GET on
`/api/auth/me`'s extension) at mount time and infer "this user is
mid-onboarding" from `in_onboarding === true`. Rejected as more
complex and more coupled (the form would need to know about
`agent_sessions`, a layer it currently does not touch), with no
substantive benefit over the query-param approach for the demo
horizon. **Default lean: query-param.** Operator ratifies at
Pre-decision 1.

**Line-range estimate.**

- `apps/web/src/app/[locale]/welcome/page.tsx` — extend the skip
  link's `href` to append `?from=welcome`. ~+1 / -1 lines around
  line 127.
- `apps/web/src/components/canvas/UserProfileEditor.tsx` — add
  `useSearchParams` import; read `from` param on mount; on save
  success branch (line 107), if `from === 'welcome'`, schedule a
  `router.push(\`/${locale}/welcome\`)` via the existing
  `setTimeout` (replace the existing 2000ms idle-state revert
  branch to do the redirect when the param is set). ~+10 / -2
  lines.
- `apps/web/src/app/[locale]/settings/profile/page.tsx` — no
  changes (the wrapper passes `searchParams` implicitly via
  Next.js routing; the form reads via `useSearchParams` client-
  side). Verify at execution Task 2 that no server-side
  `searchParams` plumbing is needed.

**Locale handling.** `useSearchParams` does not give the locale;
the form needs `useParams` or similar to construct the redirect
URL. Use the same pattern as `OnboardingChat`'s line 619 —
`const params = useParams(); const locale = (params.locale as
string) ?? 'en';`

---

## 5. Pre-decisions enumerated

What's decided at brief-write time. Do not re-litigate at
execution unless explicitly flagged as **OPEN** below.

### Pre-decision 1 — Failure 3 detection mechanism

**Default at brief-write: query-param `?from=welcome`** carried
on the skip link from `/welcome` to `/settings/profile`, read
client-side by `UserProfileEditor` via `useSearchParams`, used
on save-success to trigger `router.push` back to `/welcome`.

**Rationale (parallels S32 Pre-decision 5).** Same calculus as
S32's `?first_arrival=1`: (a) no schema churn; (b) bookmarking
the URL with `?from=welcome` and returning later is harmless
because the redirect fires only after a successful save (a
re-bookmarked-and-revisited form will redirect after the user
saves, which is the correct intent if they came from welcome
and are still onboarding); (c) URL inspection makes the signal
visible during debugging where a state-flag is opaque; (d)
**tradeoff:** the param appears in the user's URL bar — for a
bookkeeper-grade audience this is a small cost; the
debugging-visibility benefit (c) outweighs it. Same calculus
the S32 decision settled on; sibling shape; same operator
override surface available.

**Alternative considered:** server-side onboarding-state read at
form mount. Rejected as scope-expanding (the form would need to
read `agent_sessions.state` or extend `/api/auth/me` to surface
`in_onboarding`); no demo-horizon benefit. Operator may revisit
if the query-param shape proves brittle in practice.

### Pre-decision 2 — Step-1 suffix tightening alongside opening-prompt fix

**Two options:**

- (2-a) **Principal-only.** Ship the server-rendered opening
  prompt on the welcome page; do not touch `onboardingSuffix.ts`.
  Smaller scope, cleaner attribution (the integration fix is
  exactly one file change for Failure 2).
- (2-b) **Combined.** Ship the opening prompt AND tighten the
  suffix step-1 prose in both branches (Commissioning + Joining)
  to instruct the agent to call `updateUserProfile` immediately
  on plausible-name first-turn input and NOT emit
  `agent.greeting.welcome` on the same turn. Defense-in-depth: if
  the opening prompt is ignored or misread by the agent (e.g., a
  user types something ambiguous like a question), the suffix
  tightening still pushes the agent toward the right tool call.

**Default at brief-write: (2-b) combined.** Reasoning: the
opening prompt is a structural intervention at the user surface,
and the suffix tightening is an agent-prompt intervention; the
two operate at different layers and reinforce each other without
duplication. The cost of (2-b) over (2-a) is ~+10 lines in
`onboardingSuffix.ts` and one extra commit in the Y3 sequence
(Commit 2 expands to also cover the suffix change). The benefit
is robustness at the demo — the agent will not undermine the
opening prompt's structural intent if the principal types
something the prompt did not anticipate.

**Posture-test discipline.** The suffix tightening prose passes
the §S32 Pre-decision 1 posture test before commit. No chirpy
language ("just say hi to your new bookkeeper!"); no sterile
language ("PROCESS_NAME_INPUT(string)"). Plain instruction in
the same register as the surrounding suffix.

Operator ratifies at Pre-execution Task 3 (Step-2 Plan).

### Pre-decision 3 — Commit shape (Y3, single review gate at end)

**Three commits, one founder review gate at the end after
end-to-end dev-smoke.**

- **Commit 1** — Failure 1 fix: `useTranslations` wired into
  `OnboardingChat`. Single file (`AgentChatPanel.tsx`). ~+9 / -3
  lines. Self-contained; reverts cleanly.
- **Commit 2** — Failure 2 fix: server-rendered opening prompt
  in OnboardingChat empty-state. If Pre-decision 2 resolves to
  (2-b), this commit ALSO ships the suffix tightening. Files:
  `AgentChatPanel.tsx` (always); `onboardingSuffix.ts` (if 2-b).
  ~+12 / -3 (2-a) or ~+22 / -3 (2-b).
- **Commit 3** — Failure 3 fix: query-param skip-link change +
  `UserProfileEditor` redirect on save. Files:
  `welcome/page.tsx`; `UserProfileEditor.tsx`. ~+11 / -3 lines.

Single founder review gate fires AFTER all three commits land
AND after the end-to-end dev-smoke walkthrough completes (per
Acceptance Criterion 1 below). Reasoning: the three failures are
sibling-shaped — they all fail-on the fresh-user demo path, they
all need to be working together for the end-to-end smoke to
pass, and reviewing each in isolation produces less signal than
reviewing the full integrated flow. The dev-smoke walkthrough
itself is what validates the work; the founder gate is on the
result, not on the per-commit shape.

**Rejected alternatives.** Y1 (single bundled commit) — loses
per-failure attribution and complicates partial revert. Y2 (two
gates: per-commit then end-to-end) — doubles founder attention
cost without proportionate signal gain.

**Hard-rule on Y3.** If at any point during Commit 1 → Commit 2
→ Commit 3 → dev-smoke a fix produces a regression that breaks
the chain, halt immediately, do not proceed to the next commit.
Surface to operator. Smoke discipline applies at every commit
boundary: `pnpm agent:validate` clean and `pnpm test` full-suite
green (modulo the documented Arc-A item-27 carry-forward) at
each commit.

### Pre-decision 4 — Founder posture test applies to opening-prompt wording

The opening-prompt text on the welcome page (Failure 2 principal
fix) passes the S32 Pre-decision 1 posture test before commit.
The brief-creation placeholder is "What should I call you?" —
**plain, attentive, deferring authority to the principal, no
metaphor, no chirpy framing, no sterile-system framing.** Operator
may revise placeholder during the founder review gate; if so,
re-run posture test against revisions.

**Posture-test failures explicitly rejected:**

- "Hi! Welcome to The Bridge! What's your name? 🎉" — chirpy SaaS
  failure mode.
- "ENTER USER_NAME:" — sterile-system failure mode.
- "I'm your bookkeeper. What should I call you?" — ADR-0006
  violation (agent persona naming).
- "Quick — what should I call you?" — drift-list failure mode
  (engagement bait shape).

**Acceptable shapes:** "What should I call you?" / "Before we
set up your workspace, what should I call you?" / "What's your
name?" Plain question, zero theater.

### Pre-decision 5 — No new template_ids; no new locale keys

The opening prompt is a static client-side render in
`OnboardingChat`'s empty-state branch — it is **not** a
template_id flowed through the orchestrator + locale catalog. The
prompt is the system asking on behalf of the welcome page, not
the agent producing prose. Reasoning: (a) the prompt is fixed at
mount time and never changes per turn or per session; static-text
is the right shape, not template-id; (b) adding a template_id
would expand the locale catalog (en + fr-CA + zh-Hant) and the
orchestrator's params-shape enumeration test (CA-67 family) for
no semantic benefit; (c) the existing empty-state line at
`AgentChatPanel.tsx:725–729` is also static text — this fix
follows the precedent set there.

**Future Phase 2 consideration.** If/when the welcome-page text
gets locale-routed for a non-English principal pool, the static
shape gets revisited then. Out of scope for this session; not
flagged as a follow-up either (the decision is "static is right
for now," not "deferred").

### Pre-decision 6 — Friction-journal entry on placeholder-shipped pattern

A friction-journal NOTE entry codifying the lesson surfaced by
Failure 1: **temporary placeholder code shipped under
"this'll be replaced later" intent decays into invisible
architecture by the third session.** The Session 5 placeholder
survived through Sessions 5.1, 5.2, 6, 7, 7.1, 8, 32, and into
demo rehearsal — masked because the rendering surface was
exercised only during fresh-user smoke, which each intervening
session had a different focus and never re-tested. The lesson is
**not** "always implement the final shape immediately" (sometimes
a placeholder is the correct minimal-functional move); it is
**"placeholder code needs a tripwire — a test, a TODO with a
session anchor, or a closeout-NOTE pointer — that fires when the
replacement session ships, not later."**

Format: dated NOTE in `docs/07_governance/friction-journal.md`,
appended after the S32 closeout NOTE block. Provenance: this
brief; S32 closeout NOTE; the diagnostic conversation
2026-04-30. Codification candidate (single datapoint with this
NOTE; track for future fires of the same pattern):
*placeholder-decay-without-tripwire*. Adjacent to but distinct
from the *sprawl-without-tripwire* pattern in
`docs/09_briefs/session-config-cleanup-0430-brief.md` (which is
about config-file rule sprawl across sessions, not placeholder
code in working source). Verify the cited brief is present at
HEAD before landing the NOTE; the file is untracked at
brief-creation, expected to land on its own commit timeline. If
absent at execution, drop the cross-reference and keep the
NOTE's standalone framing.

**Connection worth surfacing in the NOTE.** S32's closeout NOTE
flagged three follow-up candidates (route split between
Commissioning and Joining; trust-signal surfacing on Arrival;
Four Questions audit-grammar applicability to the sober handoff
line). Each is at risk of the same decay-without-tripwire
mechanism that produced Failure 1 — surfaced in a brief, never
revisited, slowly becoming invisible architecture by session
N+3. The placeholder-decay NOTE should call this out: the
lesson is not just about placeholder code in working source but
about **any deferral that lacks a tripwire**, including
follow-up candidates listed in closeout NOTEs. A possible
mitigation surface (out of scope for this session, flagged for
future): a periodic "follow-up candidate audit" that fires every
N sessions to surface dormant deferrals before they decay.

### Pre-decision 7 — UserProfileEditor "skip" affordance scope

The fix in Failure 3 redirects to `/welcome` on **save success
only**. If a fresh-user-via-skip-link user navigates to the
form, decides not to fill it out, and clicks back / closes the
tab / navigates away, no redirect fires — that's a non-save-path
exit, not in scope. Reasoning: the demo path is form-fill →
save → return, and that path needs to work; the
form-abandonment path is rare-shape, not on the demo critical
path, and adding logic for it scope-expands without
proportional benefit. If post-demo feedback surfaces this as
common, it becomes a follow-up brief.

**Out-of-scope explicitly:** a "Cancel" or "Back to onboarding"
button on the form for non-save exit. Not in scope.

**Implicit form-abandonment recovery path acknowledged.**
Browser-back from `/settings/profile?from=welcome` lands on
`/welcome` and re-evaluates state via the welcome-page server
component — if `display_name` is still null, the user is at
step 1; if a garbage display_name was saved, the state machine
advances to step 2 with that bad display_name (a defect-shape
that is already latent at HEAD, not introduced by this session).
For the demo path, the browser-back affordance is sufficient
form-abandonment recovery — no additional "Back to onboarding"
button needed.

---

## 6. File-level scope

Every file the implementing session will touch, with line-level
approximations where possible. Verify line numbers at execution
Task 2; halt and surface on >5-line drift in the structure of
the affected blocks.

| File | Status | Edit shape | Approx delta |
|---|---|---|---|
| `apps/web/src/components/bridge/AgentChatPanel.tsx` | Modified | (Commit 1) Add `tRoot` + `renderAssistantText` to OnboardingChat (`useTranslations` already imported at line 19; OnboardingChat declared at line 608, runs to EOF at 778; insertion ~620); replace bracketed-placeholder computation at lines 692–695 with resolver call. (Commit 2) Audit and refine the existing empty-state opening prompt at lines 725–729 ("Let's get your profile set up. What's your name?") — revise wording per §Pre-decision 4 posture test AND/OR promote visual prominence so the prompt is visible on first paint and reads as the active system-side question. | ~+14 / -8 lines (Commit 1: ~+9 / -3; Commit 2: ~+5 / -3 wording-only OR ~+10 / -5 with prominence promotion) |
| `apps/web/src/agent/prompts/suffixes/onboardingSuffix.ts` | Modified (only if Pre-decision 2 = 2-b) | Step-1 Commissioning branch (lines ~76–84) and Step-1 Joining branch (lines ~64–74) gain a tightening clause: "On the user's first turn that contains plausible name content, call `updateUserProfile` immediately. Do NOT emit `agent.greeting.welcome` on the same turn." | ~+10 / -0 lines (zero if 2-a) |
| `apps/web/src/app/[locale]/welcome/page.tsx` | Modified | Skip-link `href` extended with `?from=welcome` query param at line 127. No other changes — `showSkipLink = initialState.current_step === 1` visibility logic at line 113, structural header, layout, redirect logic, and OnboardingState computation all unchanged from S32. | ~+1 / -1 lines |
| `apps/web/src/components/canvas/UserProfileEditor.tsx` | Modified | Add `useSearchParams` + `useParams` + `useRouter` imports from `next/navigation`; read `from` query param on mount; on save success branch (line 107), if `from === 'welcome'`, schedule `router.push(\`/${locale}/welcome\`)` via setTimeout (replace the existing 2000ms idle-state revert with the redirect when param is set). | ~+12 / -2 lines |
| `docs/07_governance/friction-journal.md` | Modified | Appended NOTE per §Pre-decision 6: placeholder-decay-without-tripwire codification + closeout NOTE for this session (commits, OQ resolutions, dev-smoke result). | ~+25 lines |

**No changes to:**

- `apps/web/src/agent/orchestrator/index.ts` — orchestrator is
  correctly handling whatever tool calls the agent emits;
  Failure 2 is a human-system boundary issue, not an
  orchestrator issue. No `STEP_4_COMPLETION_TEMPLATE_ID`
  changes; no main-loop changes; no respondBlock-handling
  changes.
- `apps/web/src/app/[locale]/settings/profile/page.tsx` — the
  server wrapper does not need to plumb `searchParams`; the
  form reads the param client-side via `useSearchParams`.
- `apps/web/src/app/[locale]/[orgId]/page.tsx` — Arrival
  surface is unchanged from S32; the `?first_arrival=1`
  query-param logic is untouched.
- `apps/web/messages/en.json` (and fr-CA.json, zh-Hant.json) —
  no new template_id keys; no copy edits; the four template_ids
  the welcome flow uses (`agent.greeting.welcome`,
  `agent.error.tool_validation_failed`,
  `agent.error.structured_response_missing`,
  `agent.onboarding.first_task.navigate`) all exist at HEAD
  (verified at brief-creation: line 46 / 57 / 58 / 69 of
  `apps/web/messages/en.json`).
- Any agent tool (`updateUserProfile`, `createOrganization`,
  `listIndustries`, `respondToUser`) — tool surface unchanged.
- Any orchestrator file — no edits.
- `OnboardingState` type at
  `apps/web/src/agent/onboarding/state.ts` — no schema or shape
  changes.
- Any migration, any DB schema, any Zod boundary schema.
- `docs/02_specs/agent_autonomy_model.md`,
  `docs/03_architecture/agent_interface.md`,
  `docs/00_product/product_vision.md` — read-only this session.

**Total scope estimate (combined Commits 1+2+3):** 5 files
modified, ~+69 / -9 lines if Pre-decision 2 = 2-b (~+59 / -9
if 2-a). Test additions: 0 (the fixes are integration-shape;
end-to-end dev-smoke is the binding acceptance gate, not unit
test additions).

---

## 7. Out of scope (explicit deferrals)

- **OnboardingChat → ProductionChat unification.** Conceptually
  Session 7 territory — the original S7 sub-brief framed
  ProductionChat as the eventual unification target. Re-opening
  that surface here scope-expands materially (full conversation-
  state migration, ChatTurn shape, error UI three-treatment
  branch, mount-time conversation fetch, empty-state
  SuggestedPrompts). The integration fix in Failure 1 is the
  minimum surface to close the placeholder bug; full unification
  is a separate brief if/when the OnboardingChat divergence
  becomes a maintenance liability rather than a localized debt.
  Not flagged as a follow-up trigger this session — the divergence
  has been stable since S7 and has not grown.

- **Agent prompt rewrites beyond Failure 2's targeted step-1
  tightening.** No other suffix changes. No system prompt edits.
  No new tool descriptions. The §Pre-decision 2 (2-b) suffix
  addition is bounded to the step-1 first-turn-name-extraction
  instruction in both Commissioning and Joining branches; nothing
  else.

- **Form-escape generalization for other settings pages.** Only
  `/settings/profile` is on the onboarding skip-link path. The
  other settings routes (`/settings/org`, `/settings/users`,
  etc., insofar as they exist) are post-onboarding. Not adding
  `?from=welcome` semantics to any other form. If the demo
  surfaces a need for an org-creation form-escape (currently
  conversational-only per Pre-decision 4 of S5), that's a
  follow-up brief, not this session's surface.

- **Server-side first-turn emission via the orchestrator.** A
  heavier alternative to the welcome-page client-rendered opening
  prompt would be to seed the conversation with a
  system-emitted "What should I call you?" turn injected by the
  orchestrator on session creation. Rejected as
  scope-expansion: the welcome-page client-rendered opening
  prompt accomplishes the same demo-blocker outcome with zero
  orchestrator changes, zero agent_sessions schema work, and
  zero risk of perturbing the structural-response-invalid /
  OI-2 / Q33 territory the orchestrator is currently navigating.

- **Demo-deployment work.** Vercel preview, seed strategy,
  password protection, etc. — separate threads (some adjacent
  to Path A deployment readiness, some standalone). Not in
  scope here. The dev-smoke acceptance criterion runs against
  `pnpm dev` locally; demo-environment-specific concerns
  surface in their own brief.

- **Path C audit cleanup (S28–S31).** Independent thread; this
  session does not touch Path C scope.

- **Path A deployment readiness (CORS/CSRF/rate-limiting per
  DND-01).** Independent later thread.

- **Session-config-cleanup-0430.** A sibling-but-independent
  session opened against the `.claude/` permissions cleanup
  surface. Not interleaved with this session; separate
  push-readiness gate when its time comes.

- **Phase 2 surface expansion** (mobile approvals, intercompany,
  recurring-entry scheduler, AP agent). Not Phase 2.

---

## 8. Hard constraints (do not violate)

- **The agent persona stays unnamed (ADR-0006).** No "captain,"
  "crew," "first officer," "Bridge," or any other name leaking
  into prompt prose, the welcome-page opening prompt, code
  identifiers, or friction-journal NOTE phrasing. The
  bookkeeper metaphor does its work in structural grammar
  (deference, posture, register), not in vocabulary.

- **Confidence never surfaces to the principal (ADR-0002).** Not
  applicable to this session's surfaces directly (no
  confirmation cards in onboarding), but re-stated for any copy
  authored.

- **Drift list (S32 Pre-decision 6) in force.** No quick wins,
  no AI magic moments, no empty-dashboard hacks, no
  Puzzle/Pennylane data-first patterns. The opening prompt at
  `/welcome` is sober, professional, structural — not a delight
  moment.

- **Posture test (S32 Pre-decision 1) applies to all authored
  prose.** Specifically: the welcome-page opening prompt
  wording AND (if Pre-decision 2 = 2-b) the suffix-tightening
  clause. No chirpy SaaS, no sterile system. Every authored line
  passes the test before commit.

- **No new tools, no new schemas, no new migrations, no new
  template_ids, no new locale keys.** This session ships zero
  storage shape changes, zero protocol changes, zero
  orchestrator changes.

- **Authority never flows upward (Principle 4 of
  `agent_autonomy_model.md`).** The opening prompt at `/welcome`
  is the system asking on behalf of the principal's-yet-
  unconfigured workspace; it is NOT the agent presenting itself
  as autonomous. The principal answers; the system records;
  the agent acts on the record.

- **No `canvas_directive` use for onboarding navigation.** Per
  Session 5 Pre-decision 4 — the
  `markOnboardingComplete`-flag flip and the existing
  `?first_arrival=1` query-param drive navigation. Failure 3's
  fix uses `?from=welcome` query-param + `router.push` —
  consistent with the existing pattern, not a canvas concern.

- **`pnpm agent:validate` clean at every commit boundary.**
  `pnpm test` full-suite green at every commit boundary, **modulo
  the documented Arc-A item-27 carry-forward** per
  `CURRENT_STATE.md` and `docs/07_governance/retrospectives/
  arc-A-retrospective.md` Pattern 3. Halt on regressions
  attributable to this session's edits, not on the documented
  carry-forward.

- **Identity-assertion grep before edit (Convention #8).** Verify
  every cited file path and line range at execution Task 2 before
  any edit lands. Halt and surface on drift outside the §6
  tolerance bound.

- **Cited canonical docs are read-only this session except for
  the friction-journal NOTE in §Pre-decision 6.** No other doc
  edits.

- **No paid-API spend this session.** All fixes are integration-
  shape — code edits and locale-resolution wiring. Dev-smoke
  acceptance test (§9 Acceptance Criterion 1) does fire the
  agent end-to-end and consumes paid-API tokens, but the spend
  is small-shape (single fresh-user walkthrough; estimated
  <$0.30 per the established Phase 1.2 single-walkthrough
  baselines per `friction-journal.md`). If dev-smoke needs a
  retry due to flake or fix iteration, second walkthrough also
  paid; budget ceiling for this session's dev-smoke is
  **$1.00 cumulative** across all walkthrough attempts. Halt
  and surface if exceeded.

---

## 9. Acceptance criteria

What "done" looks like. Concrete and testable.

1. **End-to-end dev-smoke walkthrough (binding gate).** The
   founder runs `pnpm dev` locally and walks the fresh-user
   path from sign-in through to Arrival, with all three fixes
   in effect. Concrete acceptance shape:

   - **Manual fixture setup** (mirrors S32 acceptance criterion 5
     pattern for the Joining-flow fixture gap). The three seeded
     users in `scripts/seed-auth-users.ts` all have populated
     `display_name` AND active memberships against Bridge Holding
     Co (DEV); a fresh-user fixture does not exist at HEAD. Two
     options:

     - **(a) Manual DB setup (default lean — one-off, not a
       durable fixture).** Connect to local Supabase via
       Supabase Studio at `http://localhost:54323` (or directly
       via `psql` against the local Supabase Postgres). Run, for
       the chosen seed user (e.g., `executive@thebridge.local`):
       ```sql
       UPDATE user_profiles
         SET display_name = NULL
         WHERE user_id = (SELECT id FROM auth.users WHERE email = 'executive@thebridge.local');
       DELETE FROM memberships
         WHERE user_id = (SELECT id FROM auth.users WHERE email = 'executive@thebridge.local');
       ```
       Verify by signing in: should route to `/welcome` with
       `OnboardingState.invited_user: false, completed_steps:
       []`. Document the exact SQL invoked in the closeout NOTE
       so the next dev-smoke can reproduce.

     - **(b) Extend the seed script with a fourth fresh-shaped
       user** (no membership, null display_name). Operator may
       opt for this if dev-smoke is expected to recur post-demo
       (e.g., for regression checks against the integration
       fixes). Brief-creation default lean (a) — one-off setup
       at smoke time, not a durable fixture; surface to operator
       at Pre-execution Task 3 if (b) is preferred.
   - At `/welcome`: the structural header (S32) shows the four
     stages with "Registration" highlighted; the chat panel
     renders with the **structural opening prompt visible at
     mount** (e.g., "What should I call you?") — verifies
     Failure 2 fix in principal-fix shape.
   - User types their display name (e.g., "Phil Chou"). Agent
     calls `updateUserProfile` on the first turn; the agent's
     response renders as "Welcome, Phil Chou." (resolved from
     `agent.greeting.welcome`) — verifies Failure 1 fix.
   - State machine advances to step 2 (Organization /
     Commissioning).
   - User types company name + industry in one composed turn
     (per S32-shipped tempo discipline); agent calls
     `listIndustries` if needed, then `createOrganization`;
     state machine advances through steps 2 + 3 atomically.
   - Step 4 completion: agent recommends posting a journal
     entry; user commits; agent emits
     `agent.onboarding.first_task.navigate`; orchestrator flips
     `onboarding_complete: true`; client navigates to
     `/[locale]/[orgId]?first_arrival=1`.
   - At `/[locale]/[orgId]?first_arrival=1`: the agent panel
     shows the sober handoff line ("Workspace ready. Ready when
     you are — what's first?" or whatever the S32 surface
     produced). Org name visible in shell; ledger present; no
     tutorial overlays; no coach marks. Subsequent navigation
     to other parts of the app and back to `/[locale]/[orgId]`
     (without the query param) renders the normal app surface.

   **Independently:** test the form-escape path. Same fresh-user
   start, but at step 1 the user clicks "Skip to form" instead
   of typing in the chat. Arrives at
   `/[locale]/settings/profile?from=welcome`. Fills out the form
   (display_name + at least one other field). Clicks "Save
   changes." Sees green "Profile updated." for ~500ms. Then is
   redirected back to `/welcome`. State machine advances to
   step 2 because `display_name` is now set. Continues through
   commissioning + Arrival as above — verifies Failure 3 fix.

   **Failure mode:** If any segment of the walkthrough fails or
   produces unexpected behavior (placeholder still rendering;
   agent greets first instead of registering; form save dead-
   ends), the acceptance gate is failed and the session halts
   for re-fix.

2. **Failure 1 isolated check.** `OnboardingChat`'s
   `assistantText` computation in `AgentChatPanel.tsx`:
   - Calls `useTranslations` (resolver wired).
   - Returns the resolved string (e.g., "Welcome, Phil Chou.")
     when the template_id exists in `messages/en.json`.
   - Returns the bare template_id (e.g., "agent.greeting.welcome",
     no brackets) when the key is missing — verified by
     temporarily passing a fake template_id to confirm
     fallback shape.

3. **Failure 2 isolated check.** `/welcome` page renders the
   structural opening prompt visibly above (or as) the empty-
   state of the chat. The text passes the §Pre-decision 4
   posture test. If Pre-decision 2 = 2-b, the suffix
   tightening clause is present in both step-1 branches in
   `onboardingSuffix.ts` — verified by reading the generated
   string under both `invited_user: false` and `invited_user:
   true` inputs.

4. **Failure 3 isolated check.** `/welcome` skip-link href is
   `/${locale}/settings/profile?from=welcome`. The form at
   `/settings/profile?from=welcome` reads the param on mount and
   on successful save, navigates to `/${locale}/welcome`
   after a brief visible "Profile updated." flash.
   `/settings/profile` (no query param) saves and stays on the
   page (legacy behavior preserved for already-onboarded
   users) — verified by direct navigation to
   `/settings/profile` without the param and confirming no
   redirect after save.

5. `pnpm agent:validate` clean at HEAD post-edit.

6. `pnpm test` full-suite green at HEAD post-edit, modulo the
   documented Arc-A item-27 carry-forward. The meaningful check
   is **clean baseline under `pnpm db:reset:clean`**, framing
   per the push-readiness three-condition gate in `CLAUDE.md`.
   This session ships zero new tests; full-suite count delta
   should be +0. If any pre-existing test pattern-matches on
   the bracketed-placeholder string `[${template_id}]`,
   surface and revise as part of Commit 1.

7. `pnpm typecheck` green.

8. `docs/07_governance/friction-journal.md` contains the new
   dated NOTE codifying the placeholder-decay-without-tripwire
   pattern (§Pre-decision 6) AND a session-closeout NOTE listing
   the three commits, OQ resolutions (§10), and dev-smoke
   walkthrough result.

9. **Founder review gate** passes after the dev-smoke
   walkthrough (single gate, end of session per §Pre-decision 3).
   Specifically gate on: (a) the dev-smoke walkthrough produced
   the expected outcome end-to-end, (b) the opening-prompt
   wording passes the posture test, (c) the friction-journal
   NOTE phrasing is acceptable, (d) the three commit messages
   are well-shaped per push-readiness-gate per-commit-shape
   discipline, (e) any §10 OQs resolved during execution are
   recorded.

**Manual smoke triggers, not Playwright.** The dev-smoke
walkthrough is operator-side, browser-driven, fresh-user-shaped.
Playwright harness at `tests/e2e/` is available but not required
for this session — the failures are integration-shape and
manifest end-to-end; a single walkthrough exercise is the right
acceptance shape for a demo-blocker session. UI-session
screenshot gate (per `CLAUDE.md` Session execution conventions
§ UI-session screenshot gate) does NOT fire for this session:
the changes are not "new canvas views, table structure changes,
new clickability, or visual discriminators on entry types" —
they are integration fixes on existing surfaces with no new
interactive elements. Operator's call at the founder review gate
if the heavier verification is wanted.

---

## 10. Open questions

Surfaced at brief-creation; require resolution before or during
execution.

1. **OPEN — Pre-decision 1 (Failure 3 detection mechanism)
   ratification.** Default = query-param `?from=welcome`. Only
   alternative considered (server-side onboarding-state read)
   is heavier and not demo-horizon-justified. Operator ratifies
   at Pre-execution Task 3 (Step-2 Plan); default lean is the
   query-param approach unless operator surfaces a concern.

2. **RESOLVED at kickoff — Pre-decision 2 (suffix tightening
   alongside opening-prompt fix) = (2-b) combined.** Founder
   pre-resolved at brief review per S32 mix-mode pattern.
   Rationale: (a) the cost is tiny (~+10 lines in
   `onboardingSuffix.ts`); (b) defense-in-depth at the
   human-system boundary is exactly the right place to
   belt-and-suspenders; (c) Pre-decision 2 already specifies
   this gates Commit 2 — pre-resolving means Commit 2 does not
   need a separate ratification round mid-execution. Commit 2's
   scope is fixed: opening-prompt refinement in
   `AgentChatPanel.tsx` AND step-1 suffix tightening in
   `onboardingSuffix.ts` (both Commissioning and Joining
   branches).

3. **OPEN — Opening-prompt placeholder wording.** Brief-creation
   placeholder: "What should I call you?" Operator may revise at
   the founder review gate per the §Pre-decision 7 shape from
   S32 (copy-pass absorption during structural review). Re-run
   posture test against revisions before commit.

4. **OPEN — Should the opening prompt also fire on Joining
   flows?** Default = yes, same prompt on both modes
   (`invited_user === false` and `=== true`). Reasoning: Joining
   users also need to register their display name; the question
   is the same. Alternative: branch the opening prompt on
   `invited_user` to use Joining-specific framing
   (e.g., "Welcome — what should I call you?" with implicit
   acknowledgment of the existing org). Brief-creation lean: do
   not branch; same prompt for both modes preserves the
   structural-element-not-postural-element discipline. The
   posture difference between Commissioning and Joining flows
   is carried in the suffix prose (S32-shipped), not in the
   welcome-page opening prompt. Operator ratifies at the
   founder review gate.

5. **OPEN — Should Commit 3's `setTimeout` delay before redirect
   be configurable, or hardcoded at 500ms?** Default = hardcoded
   at 500ms. Reasoning: this is a UX timing decision, not a
   configuration concern; no other consumer would tune this
   value; the existing `setTimeout(..., 2000)` for idle-state
   revert at line 109 is also hardcoded. Operator ratifies at
   Pre-execution Task 3.

6. **OPEN — Founder-review gate: end-of-session only, or also
   per-commit?** Default = end-of-session only (per
   §Pre-decision 3 Y3 shape — single gate after all three
   commits + dev-smoke). Operator may override to per-commit if
   any of the three commits seems large enough to warrant
   isolated review. Default lean reaffirmed: per-commit gates
   would double the founder-attention cost; the integration
   nature of the failures means the dev-smoke is the binding
   evaluation surface.

7. **RESOLVED at brief-creation — All four template_ids
   referenced in the welcome flow exist in
   `apps/web/messages/en.json`.** Verified during brief
   authoring: `agent.greeting.welcome` (line 46),
   `agent.error.tool_validation_failed` (line 57),
   `agent.error.structured_response_missing` (line 58),
   `agent.onboarding.first_task.navigate` (line 69). No locale
   work needed. Open slot retained for traceability.

8. **OPEN (philosophical, low-priority) — Does the placeholder-
   decay-without-tripwire pattern from §Pre-decision 6 also
   apply to TODOs and friction-journal "follow-up candidate"
   markers?** The S32 closeout NOTE listed three follow-up
   candidates (route split, trust-signal surfacing on Arrival,
   Four Questions audit-grammar applicability). If the same
   "decays into invisible architecture by session N+3" mechanism
   applies, the candidates need their own tripwire. Brief-creation
   lean: distinct mechanism. TODOs and follow-up candidates have
   visible homes (in friction-journal text); placeholder code
   has an invisible home (in working code that masks itself).
   But the boundary deserves thought. Surface to operator at the
   founder review gate; not blocking.

---

## Session label

`S33-onboarding-integration-fixes` — captures the three-failure
integration thread.

---

## Brief-review revisions log (2026-04-30)

Brief draft surfaced for founder review; five corrections + three
optional refinements returned. Disposition:

- **Reviewer Correction #1 (reframe Failure 2 as audit-and-refine
  the existing empty-state line, not add-new) — APPLIED.** §4
  Failure 2 "Recommended principal fix" rewritten; §6 file-table
  row for `AgentChatPanel.tsx` updated; line-range estimate
  revised to ~+5 / -3 (wording-only) or ~+10 / -5 (with
  prominence promotion).
- **Reviewer Correction #2 (clarify `useTranslations` import is
  reused, not added) — APPLIED.** §4 Failure 1 fix snippet now
  explicitly cites line 19 import re-use; §6 file-table row
  notes "useTranslations already imported at line 19."
- **Reviewer Correction #3 (re-anchor line ranges to "around line
  1006+") — NOT APPLIED; substrate disagrees with reviewer.**
  Verified at brief-revision time: `OnboardingChat` is declared
  at `AgentChatPanel.tsx:608` (file is 778 lines total — see
  comment marker `// OnboardingChat — unchanged from Session 5`
  at line 600 and `function OnboardingChat({` at line 608); its
  empty-state IS at lines 725–729. ProductionChat's empty-state
  is at line 430 (rendering `tHeading('emptyState')`), distinct
  from OnboardingChat's hardcoded empty-state at 725–729. The
  reviewer's "around line 1006" claim does not match the file at
  HEAD. Brief's existing line ranges (608–778 for OnboardingChat,
  725–729 for empty-state, 692–695 for placeholder) are correct
  as-shipped. Identity-assertion grep at execution Task 2 will
  confirm.
- **Reviewer Correction #4 (acknowledge browser-back form-
  abandonment recovery in Pre-decision 8) — APPLIED.**
  Pre-decision 7 (renumbered from 8 — see Optional Refinement #2
  below) now explicitly notes browser-back lands on `/welcome`
  and the welcome-page server component re-evaluates state; no
  "Back to onboarding" button needed.
- **Reviewer Correction #5 (verify `session-config-cleanup-0430-
  brief.md` citation) — APPLIED.** File verified present at
  `docs/09_briefs/session-config-cleanup-0430-brief.md` (root of
  `09_briefs/`, not in `phase-1.3/` — untracked at
  brief-revision time). §Pre-decision 6 citation updated with
  full path; brief notes the file is untracked and instructs
  the implementing session to re-verify presence at execution
  before landing the cross-reference.
- **Optional Refinement #1 (name manual SQL/Supabase Studio
  setup steps explicitly in AC1) — APPLIED.** Acceptance
  criterion 1 now lists exact SQL for nulling `display_name`
  and deleting the `memberships` row, with Supabase Studio /
  psql connection notes. Mirrors S32 acceptance criterion 5
  pattern.
- **Optional Refinement #2 (fold Pre-decision 7 into §6
  file-table) — APPLIED.** Old Pre-decision 7 (skip-link
  visibility unchanged) absorbed into the `welcome/page.tsx`
  row of §6 file-table; old Pre-decision 8 renumbered to 7.
- **Optional Refinement #3 (call out S32's three follow-up
  candidates as same-pattern risks) — APPLIED.** §Pre-decision
  6 expanded with a paragraph on the connection — the
  placeholder-decay lesson generalizes to any deferral that
  lacks a tripwire, including follow-up candidates listed in
  closeout NOTEs. A periodic-audit mitigation flagged for
  future, out of scope this session.

**Pre-resolved at kickoff (per founder mix-mode pattern):**

- **OQ2 (suffix tightening alongside opening-prompt fix) =
  (2-b) combined.** Recorded in §10 OQ2; Commit 2's scope
  fixed at brief-write time.

**Surfaces at gate (per founder mix-mode pattern):** OQs 1, 3,
4, 5, 6 stay OPEN; resolution at the single end-of-session
founder review gate per §Pre-decision 3.

**Convention-fire to record at session close.** During brief
review the founder asserted line ranges ("OnboardingChat at
~line 1006") that did not match HEAD. The brief-revision step
re-verified against the actual file (`AgentChatPanel.tsx`:
OnboardingChat at line 608, empty-state at 725–729) and pushed
back rather than complying with the wrong correction. Founder
self-acknowledged the substrate-misread on second-pass review.
This is **fire #2** against the
*verify-substrate-claims-from-foreign-conversation-context-
before-acting* convention candidate (fire #1 logged in
`friction-journal.md` 2026-04-30 Q33 partial-resolution arc).
The session closeout NOTE should record this fire explicitly,
naming both fires + the convention-candidate codification
threshold (3+ fires per chounting's discipline). Worth tracking
toward codification.

---
