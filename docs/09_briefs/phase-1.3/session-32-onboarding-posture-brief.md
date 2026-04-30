# Phase 1.3 Session 32 Sub-Brief — Onboarding Posture Revision

*This sub-brief drives a single execution session. The canonical
docs at `docs/00_product/product_vision.md`,
`docs/02_specs/agent_autonomy_model.md`, and the ADR set are the
architecture documents and are never modified by this session
beyond the one-paragraph addition specified in §6 Pre-decision 6.
Where this sub-brief and the canonical docs disagree, the
canonical docs win — stop and flag rather than deviate.*

**Phase placement.** Phase 1.3 contains two named arcs: **Path C**
(audit MT/LT cleanup; S28–S31, in flight) and **Path A**
(deployment readiness; opens after Path C, before MVP feedback).
This brief opens a third sibling thread — interaction-model polish
ahead of stakeholder demo. It is NOT Path C audit cleanup, NOT
Path A deployment readiness, NOT Phase 2 surface expansion.
Sequencing relative to Path C is **independent**: this session
touches `src/agent/prompts/suffixes/onboardingSuffix.ts`, the
welcome page, and the org landing route — none of which Path C
sessions edit. Default ship-order suggestion: land after the
in-flight Path C session whose context the operator is currently
holding, to keep commit trails clean. Operator's call.

---

## 1. Goal

Revise the onboarding interaction model so the agent's posture
toward the principal — and the structural surfaces around it —
match the product thesis and the bookkeeper analogy that govern
the rest of the system. Today, `onboardingSuffix.ts` does not
branch on `invited_user`, the `/welcome` page renders identically
for fresh and invited users, and the agent's voice in onboarding
is indistinguishable from generic SaaS chirpy onboarding. This
session converts onboarding from "a wizard that happens to be in
chat" into the four canonical stages of how a principal arrives
at their workspace, in the structural grammar of the agent
autonomy model. No new tools, no new schema, no new tools-layer
work; only prompt-prose revision, a quiet header on `/welcome`,
a small first-arrival treatment at `/[locale]/[orgId]`, a
`friction-journal` guardrail entry, and one paragraph added to
the canonical interaction-model doc.

---

## 2. Anchor SHA

**TBD** — set by orchestrating session at execution kickoff.
Verify HEAD at Task 1: anchor must be at or after the most
recent Path C closeout SHA so this thread does not interleave
mid-Path-C. Halt and surface if HEAD precedes Path C's current
in-flight session anchor.

---

## 3. Upstream authority

The framing in §§4–5 is downstream of, and accountable to:

- **`docs/00_product/product_vision.md`** — The Thesis ("not an
  accounting UI with AI assistance; a deterministic financial
  engine with a probabilistic interface") and the Thesis
  extension ("the product is not the AI; the product is the
  control surface over the AI"). Onboarding is the principal's
  first encounter with that control surface, and the posture
  must communicate that.
- **`docs/02_specs/agent_autonomy_model.md`** — Principle 1 (the
  Bookkeeper Analogy), Principle 2 (confidence is a policy input
  not a UI hint), Principle 4 (authority never flows upward), and
  the language register established in §8 (Policy Outcome
  Language). The principal is the controller of their workspace;
  the agent is delegated.
- **ADR-0002** — confidence never surfaces to the principal.
  Re-stated here because the consultant exchange that produced
  this brief violated this rule repeatedly in early rounds.
- **ADR-0006** — the agent persona is unnamed. The bookkeeper
  metaphor does this work in structural grammar, not in
  vocabulary; this session does NOT name the agent and does
  NOT introduce "captain," "crew," or any other anthropomorphic
  vocabulary into prompt prose or user-facing copy.
- **`docs/03_architecture/system_overview.md`** — Model B
  positioning. Puzzle/Pennylane data-first onboarding ("connect
  bank, system builds books") is the pattern this product
  rejects; the drift-list guardrail in §6 Pre-decision 4 codifies
  that rejection.
- **`docs/09_briefs/phase-2/interaction_model_extraction.md`** —
  the five primitives + zero-UI test. Onboarding's structural
  surfaces (the four stages, the two modes, Arrival as a state
  change) are interaction-model concerns; this session sharpens
  them at the prompt-and-shell layer ahead of the eventual
  Phase 2 extraction.
- **`docs/09_briefs/phase-2/obligations.md`** — confirms this work
  is NOT a Phase 2 surface-expansion item; it is interaction-
  model polish that lives upstream of Phase 2.

---

## 4. The four canonical stages (durable framing)

These are the **structural names** for the stages a principal
passes through to begin operating their workspace. They are not
user-facing copy. They are not section headings on the welcome
page. They are the grammar this session and future sessions
reason in when discussing onboarding. They map to the existing
state machine + auth flow:

| Stage          | What happens                                              | Existing surface                                              |
|----------------|-----------------------------------------------------------|---------------------------------------------------------------|
| Recognition    | The system identifies the returning principal             | `src/app/[locale]/sign-in/page.tsx` + `resolveSignInDestination` |
| Registration   | The system learns who the principal is (display name)     | `OnboardingState.current_step === 1` + `updateUserProfile` tool |
| Commissioning  | The principal brings their workspace into being (org + industry) | `current_step === 2` + `createOrganization` + `listIndustries` (step 3 is bundled into createOrganization per master §11.3) |
| Arrival        | The principal lands in their workspace, workforce at hand | `markOnboardingComplete` flip + `router.push('/[locale]/[orgId]')` in `AgentChatPanel.OnboardingChat.resolveCompletionHref` |

The stage names **do** change how prompt prose and structural
surfaces are designed (§6 Pre-decisions 1, 2, 3). They **do not**
change the state-machine shape, the storage contract, or the
tool surface — those stay as shipped at `OnboardingState`,
`agent_sessions.state.onboarding`, and the four onboarding tools.
This session is structural revision around an unchanged engine.

---

## 5. The two onboarding modes (structural commitment)

Two modes are now first-class:

- **Commissioning flow** — fresh user, zero memberships, full
  four-stage arc. Today's `OnboardingState{invited_user: false,
  completed_steps: []}` shape.
- **Joining flow** — invited user, `invited_user: true`,
  `completed_steps: [2, 3]` pre-set. Principal reports to an
  existing workspace; Commissioning stage is **not** theirs to
  perform. The state machine has encoded this distinction since
  Session 5 (master §11.5(c)); the suffix and welcome page have
  not.

**Decision: split at the suffix level first; defer route split.**
The lightweight intervention is to branch onboardingSuffix.ts
prose on `onboarding.invited_user`. This is the smallest change
that makes the agent's posture mode-aware (an AP specialist
joining an existing org is not in commissioning posture; the
prose must reflect that). A second-step intervention — splitting
`/welcome` into separate routes for the two modes — is **NOT**
in scope. The default position is: revisit the route-split
question when invited-user UX accumulates enough divergent
surface to warrant it. Today's divergent surface is one prompt
branch and zero UI branches; that does not warrant a route split.

The `OnboardingState.invited_user` flag is the routing input.
`onboardingSuffix(onboarding)` already receives this flag.
Revision in §6 Pre-decision 1 turns the flag into observable
prose differences; nothing else changes structurally.

---

## 6. Pre-decisions enumerated

What's decided at brief-write time. Do not re-litigate at
execution unless explicitly flagged as OPEN below.

### Pre-decision 1 — Posture test for agent prose

Every line of prose this session authors or revises passes the
following test before commit:

> Would a competent, busy professional speaking to their
> principal — i.e., a senior bookkeeper addressing the
> controller they report to — say this?

The test rules out two failure modes equally:

- **Chirpy SaaS** — "Awesome! Let's get you set up!" / "Welcome
  to your dashboard!" / "We're so excited to have you!" Rejected.
- **Sterile system** — "Profile registered. State advanced.
  Awaiting next input." Rejected.

Both produce wrong posture. Chirpy SaaS treats the principal as a
customer being entertained; sterile system treats the interaction
as a console session. The right register is closer to: "Got it.
Let's set up your workspace next — what should we call the
company?" Plain, attentive, deferring authority to the principal,
no metaphor leaking into vocabulary (per ADR-0006).

The posture test applies to prompt prose authored in §6 Pre-
decisions 2–3 (suffix revision) and to the single sober handoff
line at Arrival (Pre-decision 5). It does NOT apply to the
welcome-page header content shape (§Pre-decision 4), which is
structural rather than prose.

**Rejected alternative.** A static do/don't word list in
conventions.md. Rejected because the failure mode is register-
shaped, not vocabulary-shaped — the same word can be wrong-
shaped in one context and right-shaped in another. The "would a
senior bookkeeper say this to their controller?" test is the
durable version.

### Pre-decision 2 — Step-1 prose branches on `invited_user`

`onboardingSuffix.ts` step-1 prose is rewritten to branch on
`onboarding.invited_user`:

- **Commissioning branch** (`invited_user === false`) — current
  shipped prose register, tightened against the posture test.
  The principal is bringing their workspace into being; the
  agent's posture is "before we set up your workspace, I need to
  know what to call you." Tone is sober but warm; deference is
  to the unfolding act.
- **Joining branch** (`invited_user === true`) — different
  posture. The principal is reporting to an existing workspace,
  not commissioning a new one. Profile is the only thing
  outstanding (Commissioning was performed by whoever owns the
  org). Prose acknowledges this: "your organization is already
  set up; I just need to register you so the system can address
  you correctly." The Joining branch must NOT use Commissioning
  vocabulary ("set up your workspace," "your new organization") —
  those misframe the principal's relationship to the workspace
  they are joining.

Both branches share a single closing instruction (the
`updateUserProfile` tool call mechanics — see §6.2 of the master
brief for the unchanged mechanics). The branch is in posture and
framing, not in mechanics.

**File:** `src/agent/prompts/suffixes/onboardingSuffix.ts`,
case `1` (current lines 62–71).

### Pre-decision 3 — Step-2 prose tightened to encourage one composed turn

Today's step-2 prose at lines 73–82 permits multi-field capture
("You can also capture legal name, business structure, and base
currency in the same turn if the user volunteers them") but does
not encourage it. The tempo discipline this session adopts is:

> **Tempo, not depth.**

Commissioning is not compressed to 60-second SaaS speed (that
flattens the act of bringing a workspace into being). But the
agent should not ask four questions in four turns either. ONE
composed turn captures multiple fields when the principal
volunteers them ("What's the name, and what type of business?"),
the agent extracts name + industry, defaults the rest silently,
advances. Preserves ceremony; loses friction.

Concrete revision: step-2 prose is rewritten to **prefer** the
single-composed-turn shape over the field-by-field shape, while
keeping the tool mechanics (`listIndustries` call before
`createOrganization`) unchanged. The agent is instructed to (a)
ask for company name + industry in one turn when starting fresh;
(b) extract additional volunteered fields silently rather than
re-asking; (c) call `createOrganization` as soon as the minimum
two fields (name + industry) are in hand. Step 3 stays bundled
inside `createOrganization` per master §11.3 (no change).

**File:** `src/agent/prompts/suffixes/onboardingSuffix.ts`,
case `2` (current lines 73–82).

### Pre-decision 4 — Welcome page gains a quiet structural header

The current welcome page at `src/app/[locale]/welcome/page.tsx`
renders the agent chat full-width with a "Skip to form" link in
the corner during step 1. There is no surface that makes the
four-stage arc visible. This session adds a **minimal structural
header** that names where the principal is in the arc — without
becoming a wizard progress bar.

**Concrete shape (final wording deferred to Pre-decision 7
copy-pass):**

- Top of the page, above the chat panel, ~40px tall, neutral
  type, no progress fill, no step numbers, no "Step 1 of 3."
- Three or four words naming the current stage in plain language.
  E.g., the stage list at presentation time might be:
  "Recognition · Registration · Commissioning · Arrival" rendered
  with the current stage in regular weight and the others in
  muted weight; OR a single line "Setting up your workspace"
  with no stage list at all. Brief specifies the structural
  contract; the visual shape is one of two options surfaced in
  the §6 Pre-decision 7 copy-pass for operator selection.
- For the Joining flow, Commissioning is NOT visible in the stage
  list (Joining doesn't pass through Commissioning). Either the
  list is suppressed in Joining, or Commissioning is rendered as
  struck-through-muted to make the asymmetry legible. Brief-
  creation default: suppress Commissioning entirely in Joining;
  the list reads "Recognition · Registration · Arrival." Operator
  ratifies in §6 Pre-decision 7.
- The header is **server-rendered** (the welcome page is a server
  component); it derives stage label from the `OnboardingState`
  computed in `WelcomePage`. No client-side hydration story
  needed; no `'use client'` boundary added.

**Anti-shape.** This is NOT a wizard. No "1 of 3" numbering. No
progress fill. No "X% complete." No clickable stage list. No
animated transitions between stages. **No directional separators
between stages** (`›`, `→`, `>`); use a typographic separator
(middot `·` or vertical bar `|`) or no separator at all.
Directional separators imply a wizard breadcrumb regardless of
how the stages are styled. The agent is the surface that drives
the interaction; the header is a quiet structural sign so the
principal knows where they are in a longer arc. If implementation
drifts toward wizard shape, halt and surface.

**File:** `src/app/[locale]/welcome/page.tsx` — new minimal
header element above the existing chat panel container (current
JSX root at lines 116–133).

### Pre-decision 5 — Arrival as structural moment

Today's step-4 prose at lines 91–122 ends with the agent asking
"Want to try posting a journal entry? Or would you rather see
your Chart of Accounts first?" — a question, not a state change.
The new ending is closer to the agent **recommending a single
next action** and then transitioning. The structural moment of
Arrival is the landing at `/[locale]/[orgId]`, not the chat
exchange that precedes it.

**Two changes, one shared substrate.**

(A) **Step-4 prose revision.** The "two-option offer" at lines
115–119 is replaced with a single-recommendation-then-transition
shape. The agent recommends one concrete first action (the
Brief recommends posting a first journal entry as the canonical
recommendation, since the Phase 1 thesis is the engine and
journal-entry posting is the engine's primary surface), and
fires the `agent.onboarding.first_task.navigate` template_id —
the existing completion signal — as soon as the principal
acknowledges. The template_id mechanics are unchanged; what
changes is the prose that frames the moment.

The blocked-step-1 branch (current lines 102–110) is preserved
without revision — that's a defensive recovery prose path, not a
Commissioning surface.

**File:** `src/agent/prompts/suffixes/onboardingSuffix.ts`, case
`4`, the `step1Done` true branch (current lines 111–121).

(B) **First-arrival treatment at `/[locale]/[orgId]`.** When the
principal lands at the org root for the first time post-
onboarding, the page renders three things visibly without any
tutorial overlay or coach-mark scaffolding:

1. **The system is real.** Org name visible in the shell;
   ledger present (existing canvas / Mainframe surfaces fire
   normally, not suppressed).
2. **The principal is in control.** No tutorial overlays. No
   coach marks. No "We've set up your books for you!" framing
   (that's Puzzle/Pennylane positioning — see Pre-decision 4
   drift list).
3. **The workforce is ready.** Agent panel present, with one
   sober handoff line — the agent's first turn at the org-root
   surface, scripted to a single line that acknowledges arrival
   and offers to act. Brief-creation recommends a line shape like
   "Ready when you are — what's first?" or equivalent; final
   wording is deferred to Pre-decision 7.

Subsequent visits to `/[locale]/[orgId]` revert to the normal
app surface — no greeting, no first-time treatment. The
distinction reads from a **transient first-arrival signal**, not
a persistent flag.

**First-arrival signal mechanics.** A one-shot session-scoped
flag. Brief-creation default: a query param `?first_arrival=1`
on the redirect URL that `markOnboardingComplete`'s downstream
navigation appends. The construction point is
`AgentChatPanel.OnboardingChat.resolveCompletionHref` at lines
610–628 (verified at brief-creation; verify at execution Task 2);
the function has three return paths and the append targets the
**two Arrival-surface returns** only:

- (a) `if (onboardingCompletionHref) return onboardingCompletionHref;`
  — pre-computed Joining-flow href; **append**.
- (b) `if (data?.org_id) return \`/${locale}/${data.org_id}\`;`
  — membership-query-derived Commissioning-flow href; **append**.
- (c) `return \`/${locale}/admin/orgs\`;` — the
  onboarding-completed-but-no-membership recovery fallback per
  the 2026-04-20 erratum on session-5-brief.md; **do NOT
  append**, this is not an Arrival surface.

Consumed once by the org-root page and discarded on the next
navigation. Alternative: a transient flag on `agent_sessions.state`
with a TTL, cleared on first read. Brief recommendation:
query-param. Rationale: (a) no schema churn; (b) bookmarking the
URL with `?first_arrival=1` and returning later is harmless
because the first-arrival treatment is always small and sober —
there is no "tutorial blob" that re-firing would damage;
(c) URL inspection makes the signal visible during debugging,
where a state-flag is opaque; (d) **tradeoff:** the
`?first_arrival=1` parameter is visible in the user's URL bar.
For a bookkeeper-grade audience this is a small cost; the
debugging-visibility benefit (c) outweighs it. Operator may
overturn this calculus at the founder review gate.
**Operator ratifies in §6 Pre-decision 7.**

**Anti-shapes.** Explicitly rejected:
- Confetti, animations, "AI-generated your books!" framing.
- Modal overlay welcoming the principal.
- Pre-rendered CoA tour or "here's what we built for you" pane.
- Generated-content theater of any kind (see drift-list in
  Pre-decision 6 for the full rejection set).

**File:** new page-level treatment at
`src/app/[locale]/[orgId]/page.tsx` (existing `page.tsx` per
`docs/03_architecture/system_overview.md`'s tree at line ~150 —
verify exact path at execution Task 2). Render delta is small:
read the first-arrival signal, branch the first-turn agent line.
Estimated <40 lines of change.

### Pre-decision 6 — Drift list codification

The following pattern set is rejected on sight for any future
onboarding revision. Codified as a permanent guardrail in
`docs/07_governance/friction-journal.md` as a NOTE entry with
provenance pointing to this consultant exchange and this brief.

**The drift list:**

1. "Quick wins" / dopamine-loop additions ("post a fake entry
   to see how cool the system is!").
2. "AI magic moments" / generated-content theater ("watch us
   build your CoA in 12 seconds").
3. "Empty dashboard hacks" / engagement bait (any UI element
   whose purpose is to give the principal something to click on
   so the dashboard doesn't feel empty).
4. The Puzzle/Pennylane data-first onboarding pattern ("connect
   your bank, the system builds your books") — explicitly
   rejected per `product_vision.md`.

**Why these go on the same list.** The trap they share is
turning the product into "AI QuickBooks." `product_vision.md`'s
thesis explicitly distinguishes The Bridge from "an accounting
UI with AI assistance"; each item above is a path back to that
shape. The drift-list NOTE serves as a precommit checklist for
future onboarding revision sessions: a proposed change that
falls into any of these patterns requires explicit override
discussion in the friction journal, not silent inclusion.

**File:** appended NOTE in
`docs/07_governance/friction-journal.md`. Format: dated NOTE
with the four bullets verbatim, a one-paragraph "why these go
together" rationale, and provenance citation. **Provenance line
shape:** "this brief; `product_vision.md` Thesis; external
consultant review chain (multi-round) that proposed several
drift-list patterns and was rejected per Pre-decision 6's 'AI
QuickBooks' rationale; founder-approved into permanent guardrail
status." That history matters for future readers — the drift list
is durable specifically because an external review proposed each
pattern and was overruled.

### Pre-decision 7 — Copy-pass deferral

This session ships **structural** prompt revisions and component
shapes. Final user-facing wording — exact stage labels in the
welcome header, the exact step-2 question phrasing, the exact
sober handoff line at Arrival — is deferred to a separate
copy-pass after structural review. Reason: the structural
decisions in §§4–6 are durable; the wording is a mid-frequency
revision that reads better against committed structure than
against floating drafts.

The execution session DOES author placeholder wording for each
location, applies the §Pre-decision 1 posture test against the
placeholders, and surfaces both the structural shape and the
placeholder wording at the founder review gate. **Default path:
absorb the copy-pass during this session's review gate** —
revise placeholders during review and ship the wording with the
structural change, in one bounded artifact. **Defer to a
follow-up session only when wording proves contentious enough to
warrant its own session** (e.g., several rounds of revision at
the gate without convergence, or a stage-label decision that
opens broader product-language questions). Operator decides at
the gate, not in advance.

**Operator ratification points at review gate** (§Acceptance
criteria item 7):
- The welcome header rendering option (stage list vs single
  line; struck-through vs suppressed Commissioning in Joining).
- The first-arrival signal mechanism (query-param vs session-
  state flag).
- The placeholder wording for the welcome header, step-2
  question, step-4 single-recommendation prose, and the Arrival
  sober handoff line.

### Pre-decision 8 — Two-mode framing landed in `agent_interface.md`

The Commissioning / Joining distinction is added to
`docs/03_architecture/agent_interface.md` as a one-paragraph
addition. Rationale for `agent_interface.md` vs
`agent_autonomy_model.md`: the autonomy-model doc is governed
by the trust-system framing (rungs, limits, ceilings); the
two-mode distinction is an interaction-pattern fact, which
belongs in the interaction-pattern doc.

**Concrete placement:** at the end of the existing
`agent_interface.md`, a new subsection titled
"Onboarding modes." Body: one paragraph naming the two modes,
the four canonical stages, and the structural commitment (the
state-machine shape is unchanged from Session 5; what is added
is the durable posture distinction between Commissioning and
Joining).

**Verified at brief-creation:** `agent_interface.md` exists at
HEAD. The fallback clause is inactive; the file is the durable
home for the two-mode framing addition.

**File:** `docs/03_architecture/agent_interface.md`.

---

## 7. File-level scope

Every file the implementing session will touch, with line-level
approximations where possible. Verify line numbers at execution
Task 2; halt and surface on >5-line drift in the structure of
the affected blocks (small drift from intervening commits is
expected and not a halt condition).

| File | Status | Edit shape | Approx delta |
|---|---|---|---|
| `src/agent/prompts/suffixes/onboardingSuffix.ts` | Modified | Step-1 prose branches on `invited_user` (case 1, lines ~62–71); step-2 prose tightened toward single-composed-turn (case 2, lines ~73–82); step-4 step1Done branch revised from "two options" to "single recommended action" (case 4, lines ~111–121). Step 3 (case 3, lines ~84–89) unchanged. Blocked-step-1 branch (case 4, lines ~102–110) unchanged. | ~+60 / -25 lines |
| `src/app/[locale]/welcome/page.tsx` | Modified | New quiet structural header element above existing chat panel container (current JSX root lines ~116–133). Stage label derived server-side from `OnboardingState`. Joining-flow stage list adapts (Commissioning suppressed). | ~+25 / -2 lines |
| `src/app/[locale]/[orgId]/page.tsx` | Modified | Read first-arrival signal (query-param per Pre-decision 5; verify exact path at Task 2 — the existing org-root page may live under a layout file rather than `page.tsx` directly per Next.js App Router conventions); branch the first-turn agent prose; ensure normal-visit path is unchanged. No new layout, no overlay. | ~+30 / -5 lines |
| `src/components/bridge/AgentChatPanel.tsx` | Modified (three-point edit, deliberate exclusion) | `OnboardingChat.resolveCompletionHref` (lines ~610–628 at HEAD; verify at Task 2) has three return paths; append `?first_arrival=1` to the **two Arrival-surface returns** only — (a) the `onboardingCompletionHref` prop pass-through and (b) the membership-query-derived `/${locale}/${data.org_id}` URL. The third return — the `/${locale}/admin/orgs` fallback per the 2026-04-20 erratum on session-5-brief.md — is **not** an Arrival surface and does **not** get the append. | ~+5 / -2 lines |
| `docs/03_architecture/agent_interface.md` | Modified | New subsection "Onboarding modes" appended; one paragraph naming the two modes + four stages + structural commitment. Fallback to `agent_autonomy_model.md` if file absent at HEAD. | ~+15 lines |
| `docs/07_governance/friction-journal.md` | Modified | Appended NOTE codifying the drift list (4 patterns + rationale + provenance) per Pre-decision 6. | ~+12 lines |

**No changes to:**
- `src/agent/onboarding/state.ts` — state machine unchanged.
- `src/services/auth/resolveSignInDestination.ts` — Recognition
  routing logic unchanged.
- Any agent tool (`updateUserProfile`, `createOrganization`,
  `listIndustries`, `respondToUser`) — tool surface unchanged.
- Any orchestrator file beyond the one-line `resolveCompletionHref`
  query-param append in `AgentChatPanel.tsx`.
- `src/app/[locale]/sign-in/page.tsx` — Recognition surface
  unchanged.
- `messages/en.json`, `messages/fr-CA.json`, `messages/zh-Hant.json`
  — no new template_id keys (the existing
  `agent.onboarding.first_task.navigate` is the unchanged
  completion signal).
- Any migration, any schema, any Zod boundary schema.

Total Commit 1 delta estimate: **~6 files, ~+147 / -34 lines**
(per-file line counts: 60+25+30+5+15+12 = 147 added;
25+2+5+2+0+0 = 34 removed).
Y2 commit shape recommended: prompt-prose + welcome-page +
agent_interface paragraph in Commit 1; first-arrival-treatment
+ AgentChatPanel one-liner + friction-journal NOTE in Commit 2.
Operator's call at execution; Y1 (single bundled commit) is
acceptable if scope holds and review fits one founder gate.

---

## 8. Out of scope (explicit deferrals)

The following are explicitly deferred from this session, with
rationale:

- **Route split between Commissioning and Joining.** Lightweight
  suffix-level branching first per §5; the route split is a
  separate later decision that fires only when invited-user UX
  accumulates enough divergent surface to warrant it. Today's
  divergent surface is one prompt branch; that does not warrant
  it.
- **User-facing copy finalization.** This session ships
  structural prompt revisions and component shapes with
  posture-test-passing placeholder wording. Final wording —
  exact stage labels, exact question phrasings, exact sober
  handoff line — is deferred to a copy-pass session per Pre-
  decision 7. Operator may revise placeholders during this
  session's review gate; if so, that gate's revisions absorb
  the copy-pass and a separate session is unnecessary.
- **Pre-auth marketing copy above the sign-in form.** The
  founder did not commit to adding this in the consultant
  exchange. Out of scope; not flagged as a follow-up either
  (the decision was "we did not commit," not "we deferred").
- **Trust-signal surfacing on Arrival** ("every entry is
  immutable and auditable" or similar trust statements at the
  org-root first-arrival treatment). Promising direction;
  founder did not commit; flagged here as a candidate for a
  follow-up brief, NOT in scope this session.
- **AgentChatPanel rewrite.** Session 7 territory per the
  shipped Phase 1.2 brief sequence. The one-line
  `resolveCompletionHref` query-param append in §7 is the only
  AgentChatPanel edit in scope; do not refactor adjacent code.
- **Orchestrator changes beyond the `resolveCompletionHref`
  one-liner.** No edits to `src/agent/orchestrator/index.ts`.
  No new step-detection logic. No new state-write paths. The
  state machine, the step-advance rule, and the completion-
  detection (`agent.onboarding.first_task.navigate` template_id
  inspection) are all unchanged.
- **Agent-tool changes** (`updateUserProfile`,
  `createOrganization`, `listIndustries`, `respondToUser`).
  Tools stay as-is; only the suffix prose around them changes.
- **Schema migrations.** No DB changes. The transient first-
  arrival signal lives off-schema (query-param per Pre-decision
  5) precisely so this session ships zero migrations.
- **Phase 2 Surface expansion (mobile approvals, intercompany,
  recurring-entry scheduler, AP agent).** Not Phase 2.
- **Path C audit cleanup (S28–S31).** Independent thread; this
  session does not touch Path C scope.
- **Path A deployment readiness (CORS/CSRF/rate-limiting per
  DND-01).** Independent later thread per the path-c-arc-summary
  framing.

---

## 9. Hard constraints (do not violate)

- **The agent persona stays unnamed (ADR-0006).** No "captain,"
  "crew," "first officer," or any other name leaking into
  prompt prose, welcome-page copy, the sober handoff line at
  Arrival, or any code identifier. The bookkeeper metaphor does
  its work in structural grammar (deference, posture, register),
  not in vocabulary.
- **Confidence never surfaces to the principal (ADR-0002).**
  The agent never displays raw confidence scores to the user in
  any onboarding surface. The Four Questions audit grammar from
  `agent_autonomy_model.md` does not directly apply to onboarding
  (no confirmation card present); confidence-display restraint
  applies regardless.
- **No quick-wins, AI-magic-moments, empty-dashboard-hacks, or
  Puzzle/Pennylane data-first patterns.** Drift list per Pre-
  decision 6 is in force throughout this session; if a proposed
  change reads like any of those, halt and surface.
- **No new tools, no new schemas, no new migrations.** The state
  machine is unchanged. Adding storage shape would scope-expand
  beyond this session.
- **No `canvas_directive` use for onboarding navigation.** Per
  Session 5 Pre-decision 4, the completion-flag flip drives the
  navigation. The first-arrival treatment in §Pre-decision 5 is
  a route-level concern, not a canvas concern.
- **Posture test (§Pre-decision 1) applies to all authored prose.**
  No chirpy SaaS, no sterile system. Every authored line passes
  the test before commit.
- **Authority never flows upward (Principle 4 of
  `agent_autonomy_model.md`).** The agent does not present
  itself as autonomous in any onboarding surface; the agent is
  delegated, never primary. The principal is the authority from
  Recognition forward.
- **`pnpm agent:validate` clean at every commit boundary.**
  `pnpm test` full-suite green at every commit boundary, **modulo
  the documented Arc-A item-27 carry-forward per §10 acceptance
  criterion 10**. Halt on regressions attributable to this
  session's edits, not on the documented carry-forward.
- **Identity-assertion grep before edit (Convention #8).** Verify
  every cited file path and line range at execution Task 2 before
  any edit lands. Halt and surface on drift outside the §7
  tolerance bound.
- **Cited canonical docs are read-only this session except for
  the one-paragraph addition in §Pre-decision 8 and the friction-
  journal NOTE in §Pre-decision 6.** No other doc edits.

---

## 10. Acceptance criteria

What "done" looks like. Concrete and testable.

1. `onboardingSuffix(onboarding)` with
   `{current_step:1, invited_user:false}` produces step-1 prose
   in the Commissioning posture — verified by reading the
   generated string and applying the §Pre-decision 1 posture test.
2. `onboardingSuffix(onboarding)` with
   `{current_step:1, invited_user:true}` produces step-1 prose
   in the Joining posture — verifiably distinct from (1) and not
   using Commissioning vocabulary.
3. `onboardingSuffix(onboarding)` with `{current_step:2}`
   produces step-2 prose that prefers the single-composed-turn
   shape over field-by-field — verified by reading the string
   and confirming it instructs the agent to ask name + industry
   in one turn.
4. `onboardingSuffix(onboarding)` with
   `{current_step:4, completed_steps:[1,2,3], in_onboarding:true}`
   produces step-4 prose with a single recommended next action,
   not a two-option offer — verified by reading.
5. The welcome page at `/welcome` renders the new quiet header
   above the chat panel with the appropriate stage label for
   both Commissioning and Joining states — verified by manual
   browser smoke (`pnpm dev` against fresh-seed and against an
   invited-user fixture). **Note on Joining-flow fixture:** no
   invited-user fixture exists in `scripts/seed-auth-users.ts`
   today — the three seeded users are all attached to Bridge
   Holding Co (DEV) with populated display_names. Smoke-testing
   the Joining flow requires either (a) extending the seed
   script with a fourth user (active membership + null
   display_name; **surface to operator before extending — small
   scope addition that the operator may approve or reject in
   favor of (b)**), or (b) documenting the manual setup (sign in
   as one of the three seeded users; in the DB, null out that
   user's `user_profiles.display_name`; sign in again — now
   `resolveSignInDestination` routes to `/welcome` with
   `invited_user: true`). Operator's call at execution Task 2
   verification report; default lean (b) — manual setup is a
   one-off check at smoke time, not a durable test fixture.
6. Arrival at `/[locale]/[orgId]?first_arrival=1` (or whatever
   signal mechanism is ratified at the founder review gate)
   renders the agent panel with the one sober handoff line and
   no tutorial overlays / coach marks / generated-content theater
   — verified by manual browser smoke.
7. Subsequent visits to `/[locale]/[orgId]` (without the signal)
   render the normal app surface unchanged — verified by manual
   browser smoke (same browser session, navigate elsewhere and
   back).
8. `docs/03_architecture/agent_interface.md` (or the §Pre-
   decision 8 fallback) contains a new "Onboarding modes"
   subsection, one paragraph, naming the two modes + four
   canonical stages + structural commitment.
9. `docs/07_governance/friction-journal.md` contains a new dated
   NOTE codifying the drift list (4 patterns) with provenance
   citing this brief and `product_vision.md` thesis.
10. `pnpm agent:validate` clean at HEAD post-edit.
    `pnpm test` full-suite green **modulo the documented Arc-A
    item-27 carry-forward** (`accountLedgerService` running-
    balance shared-DB fragility, 2 tests failing under
    shared-DB full-suite per `CURRENT_STATE.md` and
    `obligations.md` §6 — fix shape known, migrate to
    less-polluted account; carry-forward documented in
    `arc-A-retrospective.md` Pattern 3). The meaningful check
    is **clean baseline under `pnpm db:reset:clean`**, which
    is the framing the push-readiness three-condition gate in
    `CLAUDE.md` allows for documented carry-forward. Full-suite
    count delta: +0 (this session ships no new test files —
    the changes are prose-and-shell shape, not behavior under
    test). If any pre-existing test pattern-matches on step-2
    or step-4 prose strings, those tests will need string
    updates; surface and revise as part of the affected commit.
    Halt only on regressions attributable to this session's
    edits, not on the documented carry-forward.
11. `pnpm typecheck` green.
12. Founder review gate passes on (a) the prompt-prose revisions
    against the §Pre-decision 1 posture test, (b) the welcome-
    header structural shape, (c) the first-arrival treatment
    visual sobriety, (d) the §Pre-decision 7 placeholder wording,
    and (e) the §Pre-decision 6 drift-list NOTE phrasing.

**Manual smoke triggers, not Playwright.** This session's UI
changes are smaller than the typical UI-session-screenshot-gate
threshold codified in `CLAUDE.md` (the gate fires for "new canvas
views, table structure changes, new clickability or navigation
paths"; this session adds a small header element and a tiny
first-arrival treatment, no new clickability). Brief-creation
recommendation: skip the formal screenshot gate; replace with
two quick `pnpm dev` smoke captures (one Commissioning, one
Joining; one first-arrival, one second-arrival). Operator's call
at the founder review gate; the formal screenshot gate is
available if operator wants the heavier verification.

---

## 11. Open questions

Surfaced at brief-creation; require resolution before or during
execution.

1. **OPEN — Welcome header shape ratification.** Two options
   surfaced in §Pre-decision 4 (full stage list vs single line;
   suppress vs strike-through Commissioning in Joining).
   Brief-creation default: stage list with Commissioning
   suppressed in Joining. Operator ratifies at Pre-execution
   Step 2 Plan or at the founder review gate.

2. **OPEN — First-arrival signal mechanism ratification.** Two
   options surfaced in §Pre-decision 5 (query-param vs session-
   state flag). Brief-creation default: query-param. Operator
   ratifies at Pre-execution Step 2 Plan.

3. **RESOLVED at brief-creation — `agent_interface.md` exists
   at HEAD.** Verified directly during brief authoring; the
   §Pre-decision 8 fallback clause is inactive. The file is
   the durable home for the two-mode framing addition. Open
   slot retained for traceability; no execution-time action
   required.

4. **OPEN (philosophical) — Does the Four Questions grammar from
   `agent_autonomy_model.md` apply to the Arrival sober handoff
   line?** The Four Questions ("What changed? / Why? / Track
   record? / What if I reject?") are spec'd as the audit grammar
   of confirmation surfaces. Onboarding has no confirmation
   surface; the Four Questions don't directly fit. But the
   underlying principle ("render from structured fields, never
   from free-form model text") could apply to the Arrival sober
   handoff line — i.e., the line could be sourced from a
   `respondToUser` template_id rather than authored as raw model
   prose. Brief-creation lean: not in scope this session; the
   handoff line is a single sentence and the existing template_id
   completion-signal pattern already covers the navigation. But
   this is a real philosophical thread the consultant exchange
   did not explicitly resolve. Surface to operator at the founder
   review gate.

5. **OPEN — Path placement in Phase 1.3.** This session opens a
   new sibling thread to Path C (audit cleanup) and Path A
   (deployment readiness). The thread does not yet have an
   arc-summary in the shape Path C has (`path-c-arc-summary.md`).
   Brief-creation lean: don't author an arc-summary for a
   one-session thread; revisit only if a follow-up onboarding
   session lands (the trust-signal surfacing at Arrival flagged
   in §8 is the most likely follow-up trigger). Operator
   ratifies — if the operator anticipates a follow-up, an
   arc-summary becomes worthwhile; if not, this brief stands
   alone.

6. **OPEN — Founder-review gate count: Y1 vs Y2.** §7 recommends
   Y2 (two commits, two gates) but allows Y1 if scope holds.
   Brief-creation lean: Y2, because the prompt-prose revisions
   benefit from posture-test review without first-arrival-
   treatment context noise. Operator ratifies at execution
   kickoff.

---

---

## Session label

`S32-onboarding-posture` — captures the interaction-model
posture-revision workstream.

---

## Implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> `superpowers:subagent-driven-development` (recommended) or
> `superpowers:executing-plans` to implement this plan
> task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
> No paid-API gate this session.

**Architecture.** Single-arc structural revision across six files
(seven if the first-arrival prop-drilling expansion is ratified
at Task 2 — see scope-expansion note there). Two commits, two
founder review gates. Y2 commit shape: prose + welcome header +
canonical-doc paragraph in Commit 1; first-arrival treatment +
AgentChatPanel three-point edit + drift-list NOTE in Commit 2.
Operator may collapse to Y1 at execution kickoff if scope holds.

**Tech stack.** TypeScript + Next.js 15 App Router (server +
client components), `next-intl` (unchanged — no new template_id
keys this session), Vitest (regression bedrock — no new tests
authored), Tailwind (welcome header). No new dependencies, no
migrations, no schema changes.

---

### Task 1: Session-init + HEAD anchor + Open Questions pre-resolution gate

**Files:**
- Read: `docs/09_briefs/phase-1.3/session-32-onboarding-posture-brief.md` §11 Open Questions

- [ ] **Step 1: Run session-init**

```bash
bash scripts/session-init.sh S32-onboarding-posture
```

Expected: session lock acquired; coord-session label captured.

- [ ] **Step 2: Confirm HEAD is at or after the latest Path C closeout**

```bash
git log --oneline -10
git rev-parse HEAD
```

Expected: HEAD is on `staging` and is at or after the most
recent in-flight Path C session anchor (S28 / S29a / S30 / S29b /
S31). Halt and surface if HEAD precedes that anchor — this thread
must not interleave mid-Path-C.

- [ ] **Step 3: Surface Open Questions to operator for pre-execution ratification**

Surface §11 OQs 1, 2, 4, 5, 6 to the operator with brief-
creation defaults restated. Specifically request resolution on:

- **OQ1** (welcome header shape): default = stage list with
  Commissioning suppressed in Joining; alternative = single-line
  "Setting up your workspace."
- **OQ2** (first-arrival signal mechanism): default =
  `?first_arrival=1` query-param; alternative = transient flag
  on `agent_sessions.state`. **OQ2 must resolve before Task 7;
  the implementation diverges materially.**
- **OQ4** (Four Questions grammar applicability): default = not
  in scope this session; surface for awareness only.
- **OQ5** (Phase 1.3 path-naming arc-summary): default = no
  arc-summary for a one-session thread.
- **OQ6** (Y1 vs Y2 commit shape): default = Y2.

Wait for operator resolution before proceeding to Task 2. Record
resolutions in the friction-journal entry drafted at Task 10.

---

### Task 2: Pre-flight verification

**Files (read-only at this task):**
- Read: `src/agent/prompts/suffixes/onboardingSuffix.ts`
- Read: `src/app/[locale]/welcome/page.tsx`
- Read: `src/app/[locale]/[orgId]/page.tsx`
- Read: `src/components/bridge/SplitScreenLayout.tsx`
- Read: `src/components/bridge/AgentChatPanel.tsx`
- Read: `docs/03_architecture/agent_interface.md`
- Read: `tests/integration/onboardingSuffixStepAware.test.ts`

- [ ] **Step 1: Verify suffix file structure at HEAD**

```bash
sed -n '60,125p' src/agent/prompts/suffixes/onboardingSuffix.ts
```

Expected:
- `case 1:` returns step-1 prose (lines ~62–71).
- `case 2:` returns step-2 prose (lines ~73–82).
- `case 3:` returns step-3 error-state prose (lines ~84–89).
- `case 4:` has `step1Done` branch + the "two options" prose
  block (lines ~91–122). The blocked-step-1 sub-branch is
  inside this case and stays unchanged.

If line numbers drift by >5 lines or the case structure has
changed, surface to operator before edits.

- [ ] **Step 2: Verify welcome page structure at HEAD**

```bash
sed -n '85,135p' src/app/[locale]/welcome/page.tsx
```

Expected: server component returning a `fixed inset-0 flex
bg-white` root with `showSkipLink && <a>` and a `<div
className="flex-1 max-w-2xl mx-auto flex flex-col">` containing
`<AgentChatPanel ... />`. The `isInvitedUser` boolean is
computed from `activeMemberships.length > 0`.

- [ ] **Step 3: Verify org-root page structure at HEAD**

```bash
cat src/app/[locale]/[orgId]/page.tsx
```

Expected: server component, ~20 lines, renders
`<SplitScreenLayout orgId={orgId} initialDirective={{ type:
'chart_of_accounts', orgId }} />`. The `params` prop is
`Promise<{ orgId: string }>` per Next.js 15 conventions; no
`searchParams` prop yet.

- [ ] **Step 4: Verify SplitScreenLayout / AgentChatPanel prop signatures**

```bash
sed -n '40,55p' src/components/bridge/SplitScreenLayout.tsx
sed -n '37,99p' src/components/bridge/AgentChatPanel.tsx
```

Expected:
- `SplitScreenLayout` accepts `{ orgId: string; initialDirective?:
  CanvasDirective }`.
- `AgentChatPanel` accepts the documented prop set including
  `initialOnboardingState?: OnboardingState`. The
  `OnboardingChat` subcomponent fires when
  `initialOnboardingState` is set; `ProductionChat` fires
  otherwise.

- [ ] **Step 5: Verify resolveCompletionHref shape**

```bash
sed -n '610,628p' src/components/bridge/AgentChatPanel.tsx
```

Expected: three return paths — (a) `if
(onboardingCompletionHref) return onboardingCompletionHref;` at
~611, (b) `if (data?.org_id) return
\`/${locale}/${data.org_id}\`;` at ~623, (c) `return
\`/${locale}/admin/orgs\`;` at ~627. Brief §Pre-decision 5 §B
calls for append on (a) and (b), exclusion on (c).

- [ ] **Step 6: Verify CA-67 test pattern matchers**

```bash
grep -n "Step [0-9] of 4\|first_task.navigate\|updateUserProfile\|displayName\|createOrganization\|listIndustries\|steps 2 AND 3 together\|Do NOT use this template_id" tests/integration/onboardingSuffixStepAware.test.ts
```

Expected: matches on the strings the new prose must preserve to
avoid pre-existing test-string updates (per acceptance criterion
10): the four heading patterns; tool names; "steps 2 AND 3
together"; "Do NOT use this template_id for any other turn."
Brief §10 acceptance criterion 11 expects `+0` test count;
preserving these strings is how that holds.

- [ ] **Step 7: Verify agent_interface.md exists at HEAD**

```bash
ls docs/03_architecture/agent_interface.md && wc -l docs/03_architecture/agent_interface.md
```

Expected: file exists; line count ~220. (Pre-decision 8
already-verified; this is a re-check at execution time.)

- [ ] **Step 8: Verify baseline test posture**

```bash
pnpm agent:validate
```

Expected: clean.

```bash
pnpm test 2>&1 | tail -10
```

Expected: full-suite green **modulo Arc-A item-27 carry-forward**
(2 tests in `accountLedgerService` running-balance shared-DB
fragility, fix shape known per `arc-A-retrospective.md` Pattern
3). Halt only on regressions outside that documented carry-
forward.

- [ ] **Step 9: Surface scope-expansion ack to operator**

The brief's §7 file-level scope lists `[orgId]/page.tsx` and
`AgentChatPanel.tsx` for the first-arrival work. Concrete
implementation requires the `firstArrival` boolean to flow
through three components — page.tsx → SplitScreenLayout.tsx →
AgentChatPanel.tsx → ProductionChat — because SplitScreenLayout
owns the viewport via `fixed inset-0` and renders the chat
panel directly. Surface to operator:

> "Brief §7 understated first-arrival scope by one file. Concrete
> implementation requires `SplitScreenLayout.tsx` to accept and
> pass a `firstArrival?: boolean` prop down to `AgentChatPanel`.
> ~+5 / -1 lines in SplitScreenLayout. Acceptable scope expansion,
> or operator prefers an alternative shape (e.g., reading the
> query-param directly inside AgentChatPanel via
> `useSearchParams` from `next/navigation`, bypassing
> SplitScreenLayout entirely)?"

Wait for operator decision. Default lean: prop-drill through
SplitScreenLayout — explicit data flow, no client-side
`useSearchParams` coupling between route and chat panel.

- [ ] **Step 10: Verification report to operator**

Surface:
1. Suffix file structure intact (Step 1).
2. Welcome page structure intact (Step 2).
3. Org-root page structure intact (Step 3).
4. SplitScreenLayout / AgentChatPanel signatures intact (Step 4).
5. resolveCompletionHref three-path structure intact (Step 5).
6. CA-67 test pattern matchers identified (Step 6).
7. agent_interface.md exists (Step 7).
8. Baseline `pnpm agent:validate` + `pnpm test` posture (Step 8).
9. Open Questions resolutions from Task 1 Step 3.
10. Scope-expansion decision from Step 9.

Wait for operator acknowledgment before Task 3.

---

### Task 3: Step 2 Plan — placeholder prose + plan surface

Produce the placeholder prose + structural diff plan and wait for
operator approval before any code edit.

- [ ] **Step 1: Author placeholder prose for step-1 Commissioning branch**

Target prose (preserves CA-67 matchers: heading,
`updateUserProfile`, `displayName`):

```
## Onboarding — Step 1 of 4: Profile

Before the user can set up their workspace, you need to know what to call them. ${completed}

Ask for their display name first — what they want to be called in the app. Once they give it, call \`updateUserProfile\` with \`{ displayName: <their-name> }\`. You may also capture preferences (locale, timezone, phone) in the same call or in follow-up turns, but display name is the only field that advances the state machine — the moment \`updateUserProfile\` succeeds with a non-empty \`displayName\`, this step is done and the system routes the user to the next step.

If the user would rather use a form, there's a "Skip to form" link in the top-right of the welcome screen that takes them to /settings/profile. Either path advances the state machine — don't push them toward one or the other.

Plain question, no marketing copy, keep it short.
```

- [ ] **Step 2: Author placeholder prose for step-1 Joining branch**

Target prose (same matchers, distinct posture):

```
## Onboarding — Step 1 of 4: Profile

The user has been invited to an existing organization. Their workspace is already set up; the only thing outstanding is registering them so the system can address them correctly. ${completed}

Ask for their display name — what they want to be called in the app. Once they give it, call \`updateUserProfile\` with \`{ displayName: <their-name> }\`. The moment the call succeeds with a non-empty \`displayName\`, this step is done and the system routes them into their organization.

Do NOT use commissioning vocabulary — phrases like "set up your workspace" or "your new organization" misframe the principal's relationship to a workspace that already exists. They are joining, not creating.

If they prefer a form, the "Skip to form" link in the top-right takes them to /settings/profile.

Plain question, no marketing copy, keep it short.
```

- [ ] **Step 3: Author placeholder prose for step-2 (tempo discipline)**

Target prose (preserves CA-67 matchers: heading,
`createOrganization`, `listIndustries`, "steps 2 AND 3
together"):

```
## Onboarding — Step 2 of 4: Organization

Profile is done. Now help the user bring their workspace into being. ${completed}

**Prefer a single composed turn.** Ask for the company name AND the industry in one question — for example, "What should we call the company, and what type of business is it?" If the user volunteers extra fields in the same answer (legal name, business structure, base currency), capture them silently rather than re-asking. Defaults are fine for what isn't volunteered.

Call \`listIndustries\` if the user names an industry phrase you can't map directly, or to surface options when they're unsure. Once you have company name + industry, call \`createOrganization\` with the collected fields. Success advances the state machine through steps 2 AND 3 together (industry selection is bundled into org creation).

If the user says "skip — I'll set this up later" or asks for a form, acknowledge that a form-based org-setup isn't wired in for you right now and offer to continue conversationally.
```

- [ ] **Step 4: Author placeholder prose for step-4 single-recommendation**

Target prose for the `step1Done === true` branch only —
preserves CA-67 matchers (`agent.onboarding.first_task.navigate`,
"Do NOT use this template_id for any other turn"). The
`step1Done === false` blocked branch is unchanged from current
shipped prose.

```
## Onboarding — Step 4 of 4: First task

Everything is set up. ${completed}

Recommend one concrete first action — posting a journal entry — and offer the transition. Plain phrasing, not chirpy. Something like: "Workspace ready. Want to post your first journal entry?"

When the user commits to the suggestion, or names a different concrete first task (anything actionable they want to do first), respond with the \`respondToUser\` tool using \`template_id: "agent.onboarding.first_task.navigate"\`. This is the explicit completion signal — the system will flip the onboarding flag and route the user into the main app. Do NOT use this template_id for any other turn or message; it is reserved for the moment the user commits to a first task.

If the user is still deciding or asks a clarifying question, respond with a regular template_id (the ones you'd use in normal operation) and stay at step 4 — the completion signal only fires when they pick a task.
```

- [ ] **Step 5: Author welcome-page header structural shape**

Per Pre-decision 4 / OQ1 default (stage list with Commissioning
suppressed in Joining):

```tsx
const stages = isInvitedUser
  ? ['Recognition', 'Registration', 'Arrival']
  : ['Recognition', 'Registration', 'Commissioning', 'Arrival'];
const currentStage = 'Registration'; // step 1 maps to Registration in both modes

// Inside the JSX root, restructure to flex-col with header above the chat:
<div className="fixed inset-0 flex flex-col bg-white">
  {showSkipLink && (
    <a /* unchanged */ />
  )}
  <header className="px-6 pt-6 pb-2">
    <ol className="flex flex-wrap gap-x-4 text-xs uppercase tracking-wide text-neutral-400">
      {stages.map((stage) => (
        <li key={stage} className={stage === currentStage ? 'text-neutral-700' : ''}>
          {stage}
        </li>
      ))}
    </ol>
  </header>
  <div className="flex-1 flex">
    <div className="flex-1 max-w-2xl mx-auto flex flex-col">
      <AgentChatPanel /* unchanged props */ />
    </div>
  </div>
</div>
```

The `gap-x-4` whitespace serves as separator (no directional
chars per anti-shape).

- [ ] **Step 6: Author agent_interface.md addition**

New subsection appended at the end of the file, before the
existing `## Cross-References` section:

```markdown
---

## Onboarding modes

The agent supports two onboarding modes, distinguishable by
`OnboardingState.invited_user`. The **Commissioning flow** is
for users with no existing memberships; they pass through all
four canonical stages — Recognition (sign-in), Registration
(profile capture), Commissioning (org + industry), and Arrival
(landing in the org). The **Joining flow** is for users invited
to an existing organization (`invited_user === true`,
`completed_steps: [2, 3]` pre-set); they pass through only
Recognition, Registration, and Arrival — Commissioning was
performed by whoever created the org. The state-machine shape is
unchanged across modes; what differs is the agent's posture (a
specialist joining an existing workspace is not in commissioning
posture) and the welcome-page stage indicator (which suppresses
Commissioning in the Joining flow). The four stage names are
durable structural framing, not user-facing copy.
```

- [ ] **Step 7: Author first-arrival treatment shape**

Per Pre-decision 5 §B (assuming OQ2 resolves to query-param
default and Task 2 Step 9 ratifies the SplitScreenLayout
prop-drill):

`src/app/[locale]/[orgId]/page.tsx` updated:

```tsx
import { SplitScreenLayout } from '@/components/bridge/SplitScreenLayout';

export default async function OrgPage({
  params,
  searchParams,
}: {
  params: Promise<{ orgId: string }>;
  searchParams: Promise<{ first_arrival?: string }>;
}) {
  const { orgId } = await params;
  const { first_arrival } = await searchParams;
  const firstArrival = first_arrival === '1';

  return (
    <SplitScreenLayout
      orgId={orgId}
      initialDirective={{ type: 'chart_of_accounts', orgId }}
      firstArrival={firstArrival}
    />
  );
}
```

`SplitScreenLayout.tsx` Props interface gains
`firstArrival?: boolean` (~+1 line); destructure on line ~45
(~+1 line); pass through to AgentChatPanel where the panel is
rendered (~+1 line).

`AgentChatPanel.tsx` `Props` gains `firstArrival?: boolean`
(~+1 line); destructure on line ~80 (~+1 line); pass through to
`ProductionChat` (~+1 line). `ProductionChat` accepts the prop
(~+1 line) and uses it to render a single sober handoff line
when the conversation is empty:

```tsx
// Inside ProductionChat, in the empty-state render branch
// (where SuggestedPrompts currently renders):
if (firstArrival && turns.length === 0) {
  return (
    <div className="flex flex-col gap-3 p-4">
      <div className="text-sm text-neutral-700">
        Workspace ready. Ready when you are — what's first?
      </div>
      <SuggestedPrompts /* existing props */ />
    </div>
  );
}
```

The empty-state SuggestedPrompts continues to render below the
sober handoff line; this is additive, not replacement. The
single-arrival treatment fires once: as soon as the user sends
their first message, `turns.length > 0` and the normal
conversation render takes over.

- [ ] **Step 8: Author AgentChatPanel.OnboardingChat.resolveCompletionHref three-point edit**

Per Pre-decision 5 §B, append `?first_arrival=1` to the two
Arrival-surface returns. Verified line-range 610–628 at brief-
creation:

```tsx
const resolveCompletionHref = useCallback(async (): Promise<string> => {
  if (onboardingCompletionHref) {
    // (a) — pre-computed Joining-flow href; append.
    return `${onboardingCompletionHref}?first_arrival=1`;
  }
  try {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );
    const { data } = await supabase
      .from('memberships')
      .select('org_id')
      .eq('status', 'active')
      .limit(1)
      .maybeSingle();
    if (data?.org_id) {
      // (b) — membership-query-derived Commissioning-flow href; append.
      return `/${locale}/${data.org_id}?first_arrival=1`;
    }
  } catch {
    // fall through to default
  }
  // (c) — admin-orgs recovery fallback. NOT an Arrival surface; do not append.
  return `/${locale}/admin/orgs`;
}, [onboardingCompletionHref, locale]);
```

Note on `onboardingCompletionHref` (path (a)): the prop is
constructed in `welcome/page.tsx` as `\`/${locale}/${orgId}\``.
Appending `?first_arrival=1` directly is safe — the value is a
bare path with no existing query-param. If a future welcome-page
revision adds query params to this prop, the append needs to
become a `URL`-aware merge instead; flag the assumption in the
edit comment.

- [ ] **Step 9: Author drift-list NOTE for friction-journal.md**

Format: dated NOTE appended to `docs/07_governance/friction-journal.md`.

```markdown
- 2026-XX-XX NOTE — S32 onboarding-posture drift list codified
  as permanent guardrail. Future onboarding revisions falling
  into any of the four patterns below are rejected on sight:
  (1) "quick wins" / dopamine-loop additions; (2) "AI magic
  moments" / generated-content theater; (3) "empty dashboard
  hacks" / engagement bait; (4) Puzzle/Pennylane data-first
  onboarding pattern ("connect bank, system builds books").
  The trap these share is turning the product into "AI
  QuickBooks" — a path `product_vision.md`'s Thesis explicitly
  rejects. The list serves as a precommit checklist for future
  onboarding revisions; a proposed change matching any pattern
  requires explicit override discussion in the friction journal.
  Provenance: this brief
  (`docs/09_briefs/phase-1.3/session-32-onboarding-posture-brief.md`);
  `product_vision.md` Thesis; external consultant review chain
  (multi-round) that proposed several drift-list patterns and
  was rejected per Pre-decision 6's "AI QuickBooks" rationale;
  founder-approved into permanent guardrail status. The drift
  list is durable specifically because an external review
  proposed each pattern and was overruled.
```

Replace `2026-XX-XX` with the actual execution date at commit
time.

- [ ] **Step 10: Surface diff scope expectation**

Commit 1 file table:

| File | Status | Approx delta |
|---|---|---|
| `src/agent/prompts/suffixes/onboardingSuffix.ts` | Modified | ~+60 / -25 |
| `src/app/[locale]/welcome/page.tsx` | Modified | ~+25 / -2 |
| `docs/03_architecture/agent_interface.md` | Modified | ~+15 |
| **Total Commit 1** | **3 files** | **~+100 / -27** |

Commit 2 file table:

| File | Status | Approx delta |
|---|---|---|
| `src/app/[locale]/[orgId]/page.tsx` | Modified | ~+10 / -2 |
| `src/components/bridge/SplitScreenLayout.tsx` | Modified | ~+5 / -1 (pending Task 2 Step 9 scope ack) |
| `src/components/bridge/AgentChatPanel.tsx` | Modified | ~+15 / -3 (three-point resolveCompletionHref + first-arrival prop drilling + sober handoff line) |
| `docs/07_governance/friction-journal.md` | Modified | ~+15 |
| **Total Commit 2** | **4 files** | **~+45 / -6** |

- [ ] **Step 11: Surface plan to operator**

Wait for operator approval. Specifically gate on:
- The four placeholder prose blocks (steps 1–4 above) against
  the §Pre-decision 1 posture test.
- The welcome-header structural shape (Step 5).
- The agent_interface.md "Onboarding modes" paragraph (Step 6).
- The first-arrival prop-drill mechanism (Step 7), assuming
  Task 2 Step 9 was already ratified.
- The resolveCompletionHref three-point edit shape (Step 8).
- The friction-journal NOTE phrasing (Step 9).
- The Y1-vs-Y2 commit shape ratification (per OQ6).

**Do not begin any code edit until operator approves the plan.**
Operator may revise placeholder prose during review; if they do,
re-run the §Pre-decision 1 posture test against the revisions
and update before commit.

---

### Task 4: Implement Commit 1 — prose + welcome header + canonical doc

After Task 3 plan approval.

- [ ] **Step 1: Apply step-1 Commissioning branch + Joining branch in onboardingSuffix.ts**

Edit `src/agent/prompts/suffixes/onboardingSuffix.ts` case 1 to
branch on `onboarding.invited_user`. Replace lines 62–71 with:

```typescript
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
```

- [ ] **Step 2: Apply step-2 tempo revision**

Edit `src/agent/prompts/suffixes/onboardingSuffix.ts` case 2.
Replace lines 73–82 with:

```typescript
    case 2:
      return `## Onboarding — Step 2 of 4: Organization

Profile is done. Now help the user bring their workspace into being. ${completed}

**Prefer a single composed turn.** Ask for the company name AND the industry in one question — for example, "What should we call the company, and what type of business is it?" If the user volunteers extra fields in the same answer (legal name, business structure, base currency), capture them silently rather than re-asking. Defaults are fine for what isn't volunteered.

Call \`listIndustries\` if the user names an industry phrase you can't map directly, or to surface options when they're unsure. Once you have company name + industry, call \`createOrganization\` with the collected fields. Success advances the state machine through steps 2 AND 3 together (industry selection is bundled into org creation).

If the user says "skip — I'll set this up later" or asks for a form, acknowledge that a form-based org-setup isn't wired in for you right now and offer to continue conversationally.`;
```

- [ ] **Step 3: Apply step-4 single-recommendation revision**

Edit `src/agent/prompts/suffixes/onboardingSuffix.ts` case 4
`step1Done === true` branch (lines 111–121). Replace with:

```typescript
      return `## Onboarding — Step 4 of 4: First task

Everything is set up. ${completed}

Recommend one concrete first action — posting a journal entry — and offer the transition. Plain phrasing, not chirpy. Something like: "Workspace ready. Want to post your first journal entry?"

When the user commits to the suggestion, or names a different concrete first task (anything actionable they want to do first), respond with the \`respondToUser\` tool using \`template_id: "agent.onboarding.first_task.navigate"\`. This is the explicit completion signal — the system will flip the onboarding flag and route the user into the main app. Do NOT use this template_id for any other turn or message; it is reserved for the moment the user commits to a first task.

If the user is still deciding or asks a clarifying question, respond with a regular template_id (the ones you'd use in normal operation) and stay at step 4 — the completion signal only fires when they pick a task.`;
```

The `step1Done === false` blocked branch (lines 102–110) stays
unchanged. Step 3 prose (lines 84–89) stays unchanged.

- [ ] **Step 4: Run targeted suffix test to confirm pattern matchers preserved**

```bash
pnpm test onboardingSuffixStepAware
```

Expected: green. The new prose preserves heading patterns,
tool-name mentions, "steps 2 AND 3 together", and the step-4
template_id reservation guardrail — CA-67 should pass without
test edits.

If any assertion fails, identify the missing string in the new
prose and either restore it or surface to operator if the
assertion can't be preserved without changing posture.

- [ ] **Step 5: Apply welcome-page header**

Edit `src/app/[locale]/welcome/page.tsx`. Insert before the
return statement (after line 113 where `showSkipLink` is
computed):

```tsx
  // Pre-decision 4 — quiet structural header. Stage names are
  // structural framing, not user-facing copy. Joining flow
  // suppresses Commissioning per OQ1 default.
  const stages = isInvitedUser
    ? ['Recognition', 'Registration', 'Arrival']
    : ['Recognition', 'Registration', 'Commissioning', 'Arrival'];
  const currentStage = 'Registration'; // step 1 maps to Registration in both modes
```

Replace the `return (...)` block (lines 116–133) with:

```tsx
  return (
    <div className="fixed inset-0 flex flex-col bg-white">
      {showSkipLink && (
        <a
          href={`/${locale}/settings/profile`}
          className="fixed top-4 right-4 z-10 text-sm text-neutral-600 hover:text-neutral-900 underline underline-offset-4 decoration-neutral-300"
        >
          Skip to form
        </a>
      )}
      <header className="px-6 pt-6 pb-2">
        <ol className="flex flex-wrap gap-x-4 text-xs uppercase tracking-wide text-neutral-400">
          {stages.map((stage) => (
            <li key={stage} className={stage === currentStage ? 'text-neutral-700' : ''}>
              {stage}
            </li>
          ))}
        </ol>
      </header>
      <div className="flex-1 flex">
        <div className="flex-1 max-w-2xl mx-auto flex flex-col">
          <AgentChatPanel
            orgId={null}
            initialOnboardingState={initialState}
            onboardingCompletionHref={completionHref}
          />
        </div>
      </div>
    </div>
  );
```

- [ ] **Step 6: Apply agent_interface.md addition**

Edit `docs/03_architecture/agent_interface.md`. Insert before the
final `## Cross-References` section:

```markdown
---

## Onboarding modes

The agent supports two onboarding modes, distinguishable by
`OnboardingState.invited_user`. The **Commissioning flow** is
for users with no existing memberships; they pass through all
four canonical stages — Recognition (sign-in), Registration
(profile capture), Commissioning (org + industry), and Arrival
(landing in the org). The **Joining flow** is for users invited
to an existing organization (`invited_user === true`,
`completed_steps: [2, 3]` pre-set); they pass through only
Recognition, Registration, and Arrival — Commissioning was
performed by whoever created the org. The state-machine shape
is unchanged across modes; what differs is the agent's posture
(a specialist joining an existing workspace is not in
commissioning posture) and the welcome-page stage indicator
(which suppresses Commissioning in the Joining flow). The four
stage names are durable structural framing, not user-facing
copy.

```

- [ ] **Step 7: Run agent:validate**

```bash
pnpm agent:validate
```

Expected: clean.

- [ ] **Step 8: Run full test suite**

```bash
pnpm test 2>&1 | tail -10
```

Expected: full-suite green modulo the documented Arc-A item-27
carry-forward. Halt on any new failure attributable to this
session's edits.

If a pre-existing test pattern-matches on a step-2 or step-4
prose string that the new prose dropped, surface and revise the
test in the same commit (per acceptance criterion 10).

- [ ] **Step 9: Run typecheck**

```bash
pnpm typecheck
```

Expected: green.

- [ ] **Step 10: Manual smoke — Commissioning welcome render**

```bash
pnpm dev
```

In a fresh browser window: navigate to `/en/welcome` as a
seed user with `display_name` nulled (or, default per
acceptance criterion 5 manual setup: sign in as
`executive@thebridge.local`, null out their display_name in DB,
sign in again).

Expected:
- Quiet header with four stages: Recognition · Registration ·
  Commissioning · Arrival (whitespace-separated, no directional
  chars).
- "Registration" rendered in `text-neutral-700`; others in
  `text-neutral-400`.
- "Skip to form" link in top-right.
- Chat panel below header.
- No wizard progress fill, no "Step 1 of 3" numbering.

Stop the dev server. (No screenshot capture required per
acceptance criterion 5 framing — this is dev smoke, not the
formal screenshot gate.)

- [ ] **Step 11: Manual smoke — Joining welcome render**

For Joining: the seeded users all have memberships AND
display_names. Operator-ratified manual setup at Task 1 Step 3
or Task 2 Step 9: sign in as a seed user, null their display_name
in DB but leave their membership intact, sign in again — the
sign-in resolver will route to `/welcome` with `invited_user:
true`.

Expected:
- Header renders three stages: Recognition · Registration ·
  Arrival (Commissioning suppressed per OQ1 default).
- "Registration" highlighted; others muted.
- Step-1 prose (visible by interacting with the chat) reflects
  the Joining branch — e.g., "their workspace is already set up"
  language, no commissioning vocabulary.

Stop the dev server.

---

### Task 5: Founder review gate (Commit 1)

- [ ] **Step 1: Surface to operator for review**

Present:
1. Diff summary across the three Commit 1 files.
2. Commissioning vs Joining prose side-by-side for posture-test
   review.
3. New step-2 prose with tempo discipline applied.
4. New step-4 single-recommendation prose.
5. Welcome-header rendering (manual smoke screenshots if
   operator requests; otherwise dev-server description).
6. agent_interface.md "Onboarding modes" paragraph.
7. `pnpm agent:validate` output.
8. `pnpm test` output (with carry-forward annotation).
9. `pnpm typecheck` output.

Wait for operator approval. Default decision absorbs §Pre-
decision 7 copy-pass during this gate per the brief default —
operator may revise placeholder wording in-line if needed.

- [ ] **Step 2: Apply revisions if requested**

Re-run targeted tests + agent:validate + typecheck after every
revision. Re-surface for re-approval.

---

### Task 6: Commit 1

- [ ] **Step 1: Stage files**

```bash
git add src/agent/prompts/suffixes/onboardingSuffix.ts \
        src/app/[locale]/welcome/page.tsx \
        docs/03_architecture/agent_interface.md
git status --short
```

Expected: three files modified; nothing else staged.

- [ ] **Step 2: Create Commit 1**

```bash
export COORD_SESSION='S32-onboarding-posture' && git commit -m "$(cat <<'EOF'
feat(onboarding): S32 posture revision — suffix + welcome header + agent_interface

- onboardingSuffix.ts step-1 branches on invited_user. Commissioning
  branch addresses fresh users; Joining branch addresses invited
  users (workspace already exists; only profile registration
  outstanding) and explicitly forbids commissioning vocabulary.
  Heading + tool names + displayName preserved (CA-67 matchers).
- onboardingSuffix.ts step-2 tightened to encourage one composed
  turn capturing name + industry. Tempo, not depth — preserves
  the ceremony of bringing a workspace into being while removing
  the four-questions-in-four-turns friction shape. createOrganization
  + listIndustries + "steps 2 AND 3 together" preserved.
- onboardingSuffix.ts step-4 step1Done branch revised from
  two-option offer to single recommended next action (post a
  journal entry). Completion-signal mechanics unchanged — same
  template_id, same orchestrator detection. Step-4 reservation
  guardrail preserved.
- welcome/page.tsx gains a quiet structural header above the
  chat panel naming the four canonical stages. Joining flow
  suppresses Commissioning. Whitespace separator (no directional
  chars per anti-shape).
- agent_interface.md adds "Onboarding modes" subsection
  documenting the two-mode framing as durable interaction-pattern
  fact alongside the existing One Voice / Tool-Call Model
  patterns.

Brief: docs/09_briefs/phase-1.3/session-32-onboarding-posture-brief.md
Phase: 1.3 (interaction-model polish thread; sibling to Path C +
Path A).
Upstream: product_vision.md Thesis + Thesis extension;
agent_autonomy_model.md Bookkeeper Analogy + Principle 2
(confidence not surfaced) + Principle 4 (authority never flows
upward); ADR-0002; ADR-0006 (agent persona unnamed).

Session: S32-onboarding-posture

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

- [ ] **Step 3: Verify Commit 1 landed**

```bash
git log -1 --stat
```

Expected: 3 files, ~+100 / -27 lines.

---

### Task 7: Implement Commit 2 — first-arrival treatment + AgentChatPanel three-point + drift list NOTE

After Commit 1 lands. OQ2 must be resolved by this point —
default = query-param.

- [ ] **Step 1: Edit `[orgId]/page.tsx` to read first-arrival query param**

Replace the entire file contents at
`src/app/[locale]/[orgId]/page.tsx`:

```tsx
// src/app/[locale]/[orgId]/page.tsx
// Org landing page — renders the Bridge split-screen layout
// with the Chart of Accounts as the default canvas view.
// S32: reads ?first_arrival=1 query param (per S32 brief
// Pre-decision 5 §B) and passes it to SplitScreenLayout for
// the post-onboarding sober handoff treatment.

import { SplitScreenLayout } from '@/components/bridge/SplitScreenLayout';

export default async function OrgPage({
  params,
  searchParams,
}: {
  params: Promise<{ orgId: string }>;
  searchParams: Promise<{ first_arrival?: string }>;
}) {
  const { orgId } = await params;
  const { first_arrival } = await searchParams;
  const firstArrival = first_arrival === '1';

  return (
    <SplitScreenLayout
      orgId={orgId}
      initialDirective={{ type: 'chart_of_accounts', orgId }}
      firstArrival={firstArrival}
    />
  );
}
```

- [ ] **Step 2: Extend SplitScreenLayout to accept and pass the prop**

Edit `src/components/bridge/SplitScreenLayout.tsx`:

Update the `Props` interface (line ~40):

```typescript
interface Props {
  orgId: string;
  initialDirective?: CanvasDirective;
  firstArrival?: boolean;
}
```

Update the destructure (line ~45):

```typescript
export function SplitScreenLayout({ orgId, initialDirective, firstArrival }: Props) {
```

Find the `<AgentChatPanel ... />` render site inside the JSX and
add `firstArrival={firstArrival}` to its props. (Use grep for
`<AgentChatPanel` in the file to locate; expected one render
site.)

- [ ] **Step 3: Extend AgentChatPanel to accept the prop and pass to ProductionChat**

Edit `src/components/bridge/AgentChatPanel.tsx`:

Update the `Props` interface (line ~37) — add after the
`onNavigate` field:

```typescript
  /**
   * S32 Pre-decision 5 §B: first-arrival signal from the org-root
   * page (`?first_arrival=1`). When true and ProductionChat is
   * empty, render a single sober handoff line above the
   * SuggestedPrompts empty state.
   */
  firstArrival?: boolean;
```

Update the function signature destructure (line ~80):

```typescript
export function AgentChatPanel({
  orgId,
  onCollapse,
  initialOnboardingState,
  onboardingCompletionHref,
  currentUserRole = 'controller',
  canvasContext,
  onNavigate,
  firstArrival,
}: Props) {
```

Pass through to ProductionChat (line ~90, the `<ProductionChat
... />` render):

```tsx
  return (
    <ProductionChat
      orgId={orgId}
      onCollapse={onCollapse}
      currentUserRole={currentUserRole}
      canvasContext={canvasContext}
      onNavigate={onNavigate}
      firstArrival={firstArrival}
    />
  );
```

- [ ] **Step 4: Update ProductionChat to render the sober handoff line**

In `AgentChatPanel.tsx`, find the `ProductionChat` component
definition (search for `function ProductionChat`). Add
`firstArrival?: boolean` to its `Props` interface and destructure
it. In the empty-state branch (where `SuggestedPrompts` renders
when there are no turns), wrap the empty state to include the
handoff line above SuggestedPrompts when `firstArrival && turns.length === 0`:

```tsx
// Inside ProductionChat's render, in the empty-state branch:
if (turns.length === 0) {
  return (
    <div className="flex flex-col gap-3 p-4">
      {firstArrival && (
        <div className="text-sm text-neutral-700">
          Workspace ready. Ready when you are — what's first?
        </div>
      )}
      <SuggestedPrompts /* existing props */ />
    </div>
  );
}
```

If the existing empty-state render doesn't match this exact
shape (the AgentChatPanel.tsx file is large; the actual empty-
state location may differ from this skeleton), adapt the
insertion to whatever the existing empty-state render-path
already does — the principle is "render one sober line above
the existing empty state when firstArrival is true." Surface to
operator if the existing empty-state path doesn't have a clean
insertion point.

- [ ] **Step 5: Apply resolveCompletionHref three-point edit**

Edit `src/components/bridge/AgentChatPanel.tsx`
`OnboardingChat.resolveCompletionHref` (lines 610–628). Replace
with:

```tsx
  const resolveCompletionHref = useCallback(async (): Promise<string> => {
    // (a) Pre-computed Joining-flow href; append first_arrival
    // signal per S32 Pre-decision 5 §B.
    if (onboardingCompletionHref) return `${onboardingCompletionHref}?first_arrival=1`;
    try {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      );
      const { data } = await supabase
        .from('memberships')
        .select('org_id')
        .eq('status', 'active')
        .limit(1)
        .maybeSingle();
      // (b) Membership-query-derived Commissioning-flow href; append signal.
      if (data?.org_id) return `/${locale}/${data.org_id}?first_arrival=1`;
    } catch {
      // fall through to default
    }
    // (c) admin-orgs recovery fallback (per 2026-04-20 erratum on
    // session-5-brief.md). NOT an Arrival surface; no signal append.
    return `/${locale}/admin/orgs`;
  }, [onboardingCompletionHref, locale]);
```

- [ ] **Step 6: Append drift-list NOTE to friction-journal.md**

Append the NOTE drafted at Task 3 Step 9 to
`docs/07_governance/friction-journal.md`. Replace
`2026-XX-XX` with today's date in `YYYY-MM-DD` form. Insert
under the most recent Phase 1.3 / Path C heading area so the
NOTE clusters with neighboring entries (find the appropriate
section heading via `grep -n "^## " docs/07_governance/friction-journal.md | tail -10`).

- [ ] **Step 7: Run agent:validate**

```bash
pnpm agent:validate
```

Expected: clean.

- [ ] **Step 8: Run full test suite**

```bash
pnpm test 2>&1 | tail -10
```

Expected: full-suite green modulo Arc-A item-27 carry-forward.
The first-arrival prop additions are pure prop-drilling with
optional fields; no test should break.

- [ ] **Step 9: Run typecheck**

```bash
pnpm typecheck
```

Expected: green.

- [ ] **Step 10: Manual smoke — first-arrival treatment**

```bash
pnpm db:reset:clean && pnpm db:seed:all
pnpm dev
```

Drive an end-to-end onboarding flow:
1. Navigate to `/en/sign-in`. Sign in as a fresh user (or null
   out a seed user's display_name to force `/welcome` routing).
2. Complete onboarding through the chat — register profile,
   commission an org, commit to a first task at step 4.
3. Confirm the post-completion redirect URL contains
   `?first_arrival=1`.
4. Confirm the org-root page renders the sober handoff line
   ("Workspace ready. Ready when you are — what's first?")
   above the empty-state SuggestedPrompts.
5. Confirm no tutorial overlay, no coach marks, no confetti, no
   "AI-generated your books" framing.
6. Send a chat message; the handoff line disappears (turns >0).
7. Navigate elsewhere and back to `/en/[orgId]` (without the
   query param). Confirm the normal app surface renders — no
   handoff line.

Stop the dev server.

---

### Task 8: Founder review gate (Commit 2)

- [ ] **Step 1: Surface to operator for review**

Present:
1. Diff summary across the four Commit 2 files.
2. The three-point resolveCompletionHref edit with deliberate
   exclusion called out.
3. First-arrival prop-drilling chain (page.tsx →
   SplitScreenLayout → AgentChatPanel → ProductionChat).
4. Sober handoff line text + render position.
5. Manual smoke results from Task 7 Step 10.
6. Drift-list NOTE phrasing in friction-journal.
7. `pnpm agent:validate` output.
8. `pnpm test` output (with carry-forward annotation).
9. `pnpm typecheck` output.

Wait for operator approval.

- [ ] **Step 2: Apply revisions if requested**

Re-run targeted tests + agent:validate + typecheck after every
revision. Re-surface for re-approval.

---

### Task 9: Commit 2

- [ ] **Step 1: Stage files**

```bash
git add src/app/[locale]/[orgId]/page.tsx \
        src/components/bridge/SplitScreenLayout.tsx \
        src/components/bridge/AgentChatPanel.tsx \
        docs/07_governance/friction-journal.md
git status --short
```

Expected: four files modified.

- [ ] **Step 2: Create Commit 2**

```bash
export COORD_SESSION='S32-onboarding-posture' && git commit -m "$(cat <<'EOF'
feat(onboarding): S32 first-arrival treatment + drift-list guardrail

- [orgId]/page.tsx reads ?first_arrival=1 query param and threads
  the boolean through SplitScreenLayout to AgentChatPanel /
  ProductionChat. ProductionChat renders one sober handoff line
  above the empty-state SuggestedPrompts when firstArrival &&
  turns.length === 0; subsequent visits render the normal app
  surface unchanged.
- AgentChatPanel.OnboardingChat.resolveCompletionHref three-point
  edit: append ?first_arrival=1 to the two Arrival-surface
  returns (a) pre-computed Joining-flow href and (b) membership-
  query-derived Commissioning-flow href. The third return —
  /${locale}/admin/orgs recovery fallback per the 2026-04-20
  erratum on session-5-brief.md — is NOT an Arrival surface and
  does NOT get the append.
- Drift-list NOTE appended to friction-journal.md as permanent
  guardrail. Four patterns rejected on sight: quick-wins /
  AI-magic-moments / empty-dashboard-hacks / Puzzle/Pennylane
  data-first onboarding. Provenance: this brief +
  product_vision.md Thesis + external consultant review chain
  that proposed the patterns and was overruled.

Brief: docs/09_briefs/phase-1.3/session-32-onboarding-posture-brief.md
First-arrival query-param-vs-flag decision: ratified at OQ2
operator gate (Task 1 Step 3) per Pre-decision 5 §B default.

Session: S32-onboarding-posture

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

- [ ] **Step 3: Verify Commit 2 landed**

```bash
git log -1 --stat
```

Expected: 4 files, ~+45 / -6 lines.

---

### Task 10: Post-commit verification + session-end

- [ ] **Step 1: Run full validation chain at HEAD**

```bash
pnpm agent:validate && pnpm typecheck && pnpm test 2>&1 | tail -10
```

Expected: all green, modulo Arc-A item-27 carry-forward.

- [ ] **Step 2: Verify acceptance criteria**

Walk the §10 acceptance criteria 1–12 against the shipped state.
Surface any criterion not met to the operator before session-end.

Specific spot-checks:
- (1)(2) Generate the suffix string for both
  `{current_step:1, invited_user:false}` and
  `{current_step:1, invited_user:true}`; confirm distinct prose.
- (4) Confirm step-4 prose has single recommendation, not two
  options.
- (8) Grep for "Onboarding modes" in agent_interface.md.
- (9) Grep for the drift-list provenance line in
  friction-journal.md.

- [ ] **Step 3: Append friction-journal closeout NOTE**

Separate from the drift-list NOTE shipped in Commit 2. This is
the session-close NOTE summarizing the work:

```markdown
- 2026-XX-XX NOTE — S32 onboarding-posture revision shipped.
  Two commits on staging: prose + welcome header + agent_interface
  ("Onboarding modes" subsection); first-arrival treatment +
  resolveCompletionHref three-point + drift-list guardrail NOTE.
  Open Questions resolved at execution gate: OQ1 = stage list
  with Commissioning suppressed in Joining; OQ2 = ?first_arrival=1
  query-param; OQ4 = surfaced for awareness only; OQ5 = no
  arc-summary; OQ6 = Y2 commit shape. Phase 2 surface expansion
  + Path A deployment readiness unaffected — this thread is
  interaction-model polish, sibling to Path C audit cleanup.
  Three follow-up candidates flagged in brief §8 (route split if
  Joining UX diverges; trust-signal surfacing on Arrival;
  Four-Questions-grammar applicability to Arrival handoff line).
```

Replace `2026-XX-XX` with today's date.

- [ ] **Step 4: Closeout commit (optional Y3 commit)**

If the friction-journal closeout NOTE is the only delta and the
operator prefers a separate closeout commit (Y3 shape):

```bash
git add docs/07_governance/friction-journal.md
git commit -m "$(cat <<'EOF'
docs(governance): S32 onboarding-posture session closeout

- Friction-journal NOTE summarizes the two-commit S32 arc and
  the OQ resolutions ratified at the execution gate.
- Three follow-up candidates flagged for future brief authoring.

Session: S32-onboarding-posture

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

Otherwise (Y2 shape preserved): roll the closeout NOTE into
Commit 2 by uncommitting Commit 2 (`git reset --soft HEAD~1`),
amending the friction-journal addition, and recommitting. Brief-
creation lean: separate Y3 closeout commit for cleaner audit
trail.

- [ ] **Step 5: Run session-end**

```bash
bash scripts/session-end.sh
```

Expected: session lock released; coord-session label cleared.

- [ ] **Step 6: Surface confirmation to operator**

Present:
1. Cumulative diff across all S32 commits (1, 2, optional 3).
2. Acceptance criteria walk-through (Step 2 above).
3. OQ resolutions captured in friction-journal.
4. Three follow-up candidates flagged for future brief authoring.
5. Carry-forward queue: nothing new (the trust-signal-surfacing
   and route-split candidates flagged at brief §8 are durable;
   no Phase 2 obligation rows added).

S32 closes here. Phase 1.3 Path C continues independently;
Phase 1.3 Path A and Phase 2 unaffected by this thread.

---

## Halt conditions

- Any verification step in Task 2 fails (line drift, missing
  files, baseline test failures outside the documented Arc-A
  carry-forward).
- Open Questions 1, 2, or 6 don't resolve at Task 1 Step 3.
- Operator does not approve plan at Task 3 Step 11.
- Operator does not ratify Task 2 Step 9 scope expansion.
- `pnpm agent:validate` regression caused by this session's
  edits.
- `pnpm test` regression outside the documented Arc-A item-27
  carry-forward.
- A pre-existing test pattern-matches on dropped prose strings
  and the implementing session can't reconcile without changing
  posture (per Task 4 Step 4 + Task 7 Step 8 surface conditions).
- Operator review gate at Task 5 or Task 8 returns revisions
  that the implementing session can't reconcile without scope
  expansion beyond §7.
- Manual smoke at Task 4 Steps 10–11 or Task 7 Step 10 shows
  drift-list-pattern shape (see brief Pre-decision 6).

---

*End of Phase 1.3 Session 32 Sub-Brief — Onboarding Posture
Revision.*
