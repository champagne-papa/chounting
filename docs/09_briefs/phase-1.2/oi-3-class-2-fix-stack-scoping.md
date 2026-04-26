# Session 8 OI-3 — Class 2 Orphan Pattern: Prompt-Surgery for Canvas Directive Emission

Status: **Design ratified (recommended-with-flag on Section 3c sub-decision). Implementation pending.**

Date drafted: 2026-04-26 (UTC).

Anchor commits: C7 EC-13 friction-journal capture at `5fb3b7b`; C11
retrospective capture at `f221bab` (section (p), lines 7041–7476 of
`docs/07_governance/friction-journal.md` — authoritative source for
analysis findings).

Depends on: nothing. Independent prompt-surgery; no upstream code
changes required.

Companion convention applications: Meta A (PARTIAL closure
state-decomposition) and Meta B (scoping-time cross-dependency
articulation), both drafted in C11 retrospective section (p),
scheduled for landing in `docs/04_engineering/conventions.md` via a
separate operator-reviewed governance chat. This brief applies both
at scoping time per section 7 below.

## 1. Finding

C7 EC-13 paid-API verification run (2026-04-26, S9-0425) attempted
four EC-2 entries before halting at $0.4913. Two productive (Entries
12, 14), two staled as Class 2 orphans (Entries 13, 15). The Class 2
pattern: agent emits a `postJournalEntry` tool call that succeeds and
writes an `ai_actions` row, then emits `respondToUser` with a
template_id but **without** a paired `canvas_directive` carrying the
ProposedEntryCard. Downstream processing intercepts the orphaned
`ai_actions` row (no card to ratify against) and stales the entry.

C11 Section 4 ran a discrimination pass over the C7 evidence base
(N=2 stalings, four candidate hypotheses surviving). The pass
collapsed the hypothesis set by reading the agent's prompt-system
source surfaces. Result: **the agent's prompt has zero instructional
surface on `canvas_directive` emission.** The model knows the field
exists from the JSON-Schema rendering of `respondToUser`'s input
schema but has no instruction telling it when, why, or how to
populate it. Compounding the structural absence: the
`validTemplateIdsSection` selection rubric explicitly routes
ambiguity-perception ("for grounded conversational answers...
asking a clarifying question when context is ambiguous") to
`agent.response.natural`, which carries no `canvas_directive`
obligation.

The mechanism is two-layered (per C11's H3/H3b stacking refinement,
Convention #10 retraction #17):

- **H3b-ii (instructional, primary):** the prompt creates the
  conditions under which the model omits `canvas_directive` on
  complex entries. The selection rubric routes complexity-feeling
  entries to a no-directive template, and no other prompt surface
  tells the model that journal-entry-proposal turns require
  canvas_directive emission.
- **H3 (model-cognitive, secondary):** given H3b-ii's conditions,
  whether the model has independent complexity-perception driving
  template selection toward natural is a fix-validation question,
  observable post-fix. If prompt-surgery resolves emission cleanly
  on previously-staled shapes, H3b-ii alone was the mechanism. If
  staled shapes persist post-fix, H3 is independently live and the
  fix needs a second iteration.

The structural-absence pattern is broader than the three primary
prompt surfaces. C11 also flagged the `onboardingSuffix` step-4
prose ("If the user is still deciding or asks a clarifying
question, respond with a regular template_id and stay at step 4")
as the same pattern-different-context: clarifying-question guidance
without directive-pairing instruction. Onboarding turns don't carry
journal-entry-proposal load and aren't in OI-3 scope, but the
pattern is named here so onboarding work — whenever it surfaces —
has a pre-named pattern to match against rather than re-discovering
it.

## 2. Root cause

Three surfaces in the prompt system, each contributing to the
structural absence. Plus a fourth lower-load-bearing instance and
a structural asymmetry observation.

### 2a. STRUCTURED_RESPONSE_CONTRACT defines the response shape without canvas_directive

`src/agent/prompts/personas/_sharedSections.ts:38-42` —
`STRUCTURED_RESPONSE_CONTRACT` reads in full:

> ## Response contract
>
> Your responses must be `{template_id, params}`. Do not output
> English prose. Every `template_id` must exist in the locale files.

The contract specifies template_id and params. The
`canvas_directive` field is structurally optional in the
respondToUser Zod schema, but the contract — which is the
model's authoritative description of what a response is — never
mentions it. The model has no contract-level instruction that
responses *can or should* carry a `canvas_directive`.

### 2b. respondToUser tool description names template_id and params, not canvas_directive

`src/agent/tools/respondToUser.ts:9-10` — the tool description
reads in full:

> The final step of every turn. You MUST end every turn with a
> call to respondToUser carrying a template_id and params. The
> user-facing response is rendered from these via next-intl — do
> not output English prose.

Same gap, second surface. The tool description names template_id
and params; `canvas_directive` is invisible at this layer.

### 2c. validTemplateIdsSection rubric routes ambiguity to no-directive template

`src/agent/prompts/validTemplateIds.ts` — the
`validTemplateIdsSection()` rendered into the prompt instructs:

> **Selection — prefer structured, fall back to natural.** When
> the response shape matches a structured template, use it...
> Use `agent.response.natural` (params: `{ text: string }`) only
> when no structured template fits — for grounded conversational
> answers (e.g., "why was this posted?", explaining a balance,
> **asking a clarifying question when context is ambiguous**).
> The `text` param carries your prose verbatim.

The bolded clause is load-bearing for the Class 2 mechanism. When
the model perceives a journal-entry proposal as ambiguous (Entry
13's gross-vs-net method choice, Entry 15's contra-asset Allowance
treatment), the rubric routes it to `agent.response.natural`,
which has params `{ text: string }` only and carries no
canvas_directive obligation. The rubric doesn't distinguish
"ambiguity on a non-proposal turn" (where no card is appropriate)
from "ambiguity on a journal-entry-proposal turn" (where a card
should still surface alongside the clarifying question — see
section 3).

### 2d. onboardingSuffix step-4 prose — same pattern, different context

`src/agent/prompts/suffixes/onboardingSuffix.ts:139` — step-4
prose ends with:

> If the user is still deciding or asks a clarifying question,
> respond with a regular template_id (the ones you'd use in
> normal operation) and stay at step 4 — the completion signal
> only fires when they pick a task.

Onboarding step 4 isn't a journal-entry-proposal turn (it's a
first-task invitation) and doesn't carry Class 2 orphan risk, so
this surface is **out of OI-3 scope**. It's named here as a
candidate for follow-on onboarding-specific work, not as a fix
target. The structural-absence pattern manifesting in onboarding
prose is informative for any future workstream that touches
onboarding clarification handling.

### 2e. Asymmetry between input and output prompt surfaces

`canvasContextSuffix.ts` documents the **input direction**: the
user is currently looking at canvas X. No surface documents the
**output direction**: when should the model emit a canvas_directive,
and with what content? The asymmetry is structural. Fixing OI-3
means authoring the output-direction surface to parallel the
input-direction surface that's already documented.

## 3. Implications

Three downstream effects of the prompt-surgery work. The third
includes a sub-decision flagged for operator ratification at
scoping-doc review.

### 3a. Card schema and contract-shape coupling

The recommended decision (sub-section 3c below) is "card alongside
clarification, with tentative-flag mitigation." This implies the
canvas_directive contract handles **clarification-bearing cards** —
cards that ship alongside a clarifying question rather than alongside
a confidence-bearing proposal. That's a small ontology shift, not a
text tweak. The model has to learn the contract distinguishes
confident proposals (card carrying confirmed values, ratification
surface immediate) from tentative proposals (card carrying
placeholder/sentinel values, ratification surface delayed pending
clarification answer).

This creates a cross-dependency between OI-3's prompt-surgery work
(upstream — has to teach the model tentative-vs-confident) and the
ProposedEntryCard schema or canvas_directive shape (downstream — has
to represent tentative state somehow). The card-schema decision is
out of OI-3's prompt-surgery scope, but this brief flags the
sub-decision so the implementation chat resolves it before
authoring prompt text against the simpler "always confident" model.

### 3b. Confirm route invariants unchanged

The orchestrator's Site 2 post-fill (from OI-2) writes
authoritative `org_id` / `idempotency_key` / `trace_id` onto
emitted cards. `/api/agent/confirm` and `/api/agent/reject` look
up `ai_actions` by `(org_id, idempotency_key)`. None of these
invariants change under OI-3 — prompt-surgery teaches the model
**when** to emit a card; Site 2 still post-fills the
orchestrator-owned UUIDs. The confirm/reject continuity established
by OI-2 carries forward unchanged.

The one nuance: under "card alongside clarification," tentative
cards still need to write an `ai_actions` row at Site 1 (the
prior `postJournalEntry` tool call already does this). The
confirm route is what transitions tentative cards into confirmed
journal entries. If a tentative card is never ratified (operator
abandons the clarification thread), the `ai_actions` row stales
naturally via the existing TTL/cleanup path.

### 3c. Recommended sub-decision: card alongside clarification, with tentative-flag mitigation

C11 flagged this decision but didn't commit to it. This brief
recommends:

> **When the model perceives a journal-entry-proposal as
> requiring clarification, the model emits both a clarifying
> question (via `agent.response.natural` text param OR a future
> dedicated clarification template) AND a `canvas_directive`
> carrying a ProposedEntryCard with the model's best-effort
> tentative values. The card carries a tentative flag (or
> equivalent representation — see four-option enumeration below)
> so the UI renders it differently from a confident proposal,
> and operators can either answer the clarification (refines
> the card) or ratify the tentative card directly (skips
> clarification).**

Three reasons:

1. **Orphan-prevention model is structurally simpler when
   entry-proposal turns always emit a card.** "Card always
   present on proposal turns; clarification carried alongside"
   is a cleaner invariant than "card present except when
   ambiguity." The latter requires the orphan check to know
   which turns are ambiguous, which it currently can't.
2. **Preserves the user-facing affordance.** The canvas card is
   the surface the operator interacts with to ratify or revise.
   Clarification without a card means the operator answers in
   chat, the model produces a card on the next turn, and the
   ratification surface is one turn delayed. With a card
   alongside, the operator can ratify or revise in the same
   turn the clarification surfaces.
3. **Aligns staled-entry behavior with productive-entry
   behavior.** C7's productive entries (12, 14) emitted cards;
   the staled entries (13, 15) emitted no cards. The fix that
   aligns staled-entry behavior with productive-entry behavior
   is "always emit card on proposal turns," not "introduce a new
   no-card-with-clarification path."

**Counter-argument with mitigation:** "card with clarification"
requires the model to populate card fields on entries it
explicitly perceives as ambiguous, which is harder than populating
fields on entries it's confident about. The model may produce
low-quality card content (placeholder amounts, guessed accounts)
under ambiguity, which is worse than no card. The tentative-flag
mitigation addresses this: the card schema represents tentative
state explicitly, so operators (and downstream UI) can distinguish
"this is the model's best guess pending your input" from "this is
the model's confident proposal."

**Sub-decision flagged for implementation chat:** how does the
card schema represent tentative state? Four options to enumerate
(implementation chat resolves):

- **(a) Tentative-flag boolean on the card.** Add
  `tentative: boolean` to ProposedEntryCardSchema. Simple, but
  requires every consumer (UI, confirm route, audit log) to
  branch on the flag.
- **(b) Sentinel values in card fields.** "amount: TBD",
  "account_code: TBD" rendered as placeholders. Strict schema
  rejects sentinels; clarification flow surfaces the gap.
  Composable with existing schema; cheap.
- **(c) Separate card variant in the discriminated union.** Add
  `tentative_proposed_entry_card` as a peer to
  `proposed_entry_card` in `canvasDirectiveSchema`. Most
  type-safe; highest authoring cost.
- **(d) Existing schema unchanged + clarifying text in
  agent.response.natural's text param paired with a
  confident-shape card.** No schema change; the model emits a
  confident card alongside a "but I'd like to confirm X" prose
  message. Cheapest; weakest tentative-state signal to UI.

Operator ratifies the recommendation at scoping-doc review. The
four-option enumeration travels forward to the implementation
chat, which selects the option after reading the actual UI
consumer code and the confirm-route audit-trail handling.

## 4. Design ratified — prompt-surgery on three surfaces

Three concrete prompt-text revisions, drafted below. Each draft
commits the **semantic content** the surface must convey;
implementation chat finalizes exact wording (word choice, sentence
structure, tone-matching to surrounding prompt context). The
semantic content below is the floor — it is resolved at scoping,
not deferred.

### 4a. STRUCTURED_RESPONSE_CONTRACT revision

**Semantic content (committed at scoping):** the contract must
introduce `canvas_directive` as a structurally optional field that
becomes **required** on journal-entry-proposal turns
(`template_id: agent.entry.proposed`). The contract must name the
proposal turn → directive emission pairing as load-bearing for
ratification (without it, the entry cannot be confirmed). The
contract must surface the tentative-state pathway: ambiguous
proposal entries still emit a card, marked tentative, alongside
the clarifying question.

**Draft prose (implementation chat finalizes):**

> ## Response contract
>
> Your responses must be `{template_id, params}` and may carry an
> optional `canvas_directive`. Do not output English prose.
> Every `template_id` must exist in the locale files.
>
> **When to emit `canvas_directive`:** when the response surfaces
> a renderable artifact for the user to interact with — most
> commonly, a journal-entry proposal. For
> `template_id: agent.entry.proposed`, you MUST pair the response
> with a `canvas_directive` of type `proposed_entry_card`
> carrying the entry's structured representation. This pairing
> is the user's ratification surface; without it, the entry
> cannot be confirmed.
>
> **Tentative proposals:** if the entry's accounting treatment
> is ambiguous and you would otherwise ask a clarifying question,
> still emit the card with your best-effort values, marked as
> tentative. The clarifying question accompanies the tentative
> card — the user can either answer the question (refines the
> card) or ratify the tentative card directly. [Implementation
> chat: replace this paragraph with the specific tentative-state
> representation chosen from the four-option enumeration in
> scoping doc §3c.]

Length: ~12 lines vs. current ~3 lines. The extension is the
load-bearing structural change.

### 4b. respondToUser tool description revision

**Semantic content (committed at scoping):** the tool description
must mention `canvas_directive` so the model encounters it at
both the contract layer (4a) and the tool layer. The description
must state that responses surfacing renderable artifacts include
a `canvas_directive` describing the artifact.

**Draft prose (implementation chat finalizes):**

> The final step of every turn. You MUST end every turn with a
> call to respondToUser carrying a `template_id` and `params`.
> When the response surfaces a renderable artifact for the user
> (most commonly a journal-entry proposal), include a
> `canvas_directive` describing the artifact. The user-facing
> response is rendered from `template_id`/`params` via next-intl
> — do not output English prose.

The tool description complements the contract revision in 4a;
both surfaces now mention canvas_directive. Length: ~7 lines vs.
current ~3 lines.

### 4c. validTemplateIdsSection rubric revision

**Semantic content (committed at scoping):** the rubric must
distinguish "ambiguity on non-proposal turns" (route to
agent.response.natural; no card) from "ambiguity on
journal-entry-proposal turns" (route to agent.entry.proposed
with tentative canvas_directive; clarification surfaces alongside
the card). The unconditional ambiguity → agent.response.natural
routing is the load-bearing failure surface and must be replaced.

**Draft prose (implementation chat finalizes):**

Current:
> Use `agent.response.natural` (params: `{ text: string }`) only
> when no structured template fits — for grounded conversational
> answers (e.g., "why was this posted?", explaining a balance,
> **asking a clarifying question when context is ambiguous**).

Proposed:
> Use `agent.response.natural` (params: `{ text: string }`) only
> when no structured template fits — for grounded conversational
> answers (e.g., "why was this posted?", explaining a balance,
> asking a clarifying question that does not propose a journal
> entry). **For clarifying questions on journal-entry proposals,
> use `agent.entry.proposed` with a tentative `canvas_directive`
> instead** — the tentative card surfaces alongside the
> clarification so the user can ratify or refine in one turn.

The proposed rubric removes the unconditional ambiguity →
agent.response.natural routing and replaces it with a
proposal-aware split: non-proposal clarifications still route to
agent.response.natural; proposal clarifications route to
agent.entry.proposed with tentative directive.

## 5. Options considered

### Option A (ratified) — prompt-surgery on three surfaces with tentative-flag mitigation

See §4. Honors the structural-absence finding directly: every
prompt surface that touches canvas_directive emission gets
explicit instruction.

### Option B (rejected) — ambiguity → no-card by design

Convention #11's existing orphan-prevention model treats card
absence on proposal turns as the orphan signature. Allowing
"no-card-with-clarification" requires the orphan-prevention
model to distinguish ambiguity-driven absences (legitimate)
from emission-failure absences (Class 2 orphan). This is
strictly harder than the recommended option and reproduces
parts of the current Class 2 mechanism in a new disguise.

### Option C (rejected) — model-cognitive intervention without prompt-surgery

If H3 (model-cognitive complexity-perception) is the actual
mechanism, the fix surface is the model's reasoning behavior,
not the prompt. Possible interventions: fine-tuning on
canvas_directive emission, RLHF on staled-shape recovery,
prompt-cached examples of clarification-with-card. Rejected
because:

- C11's discrimination pass located a load-bearing prompt
  mechanism (H3b-ii). Skipping prompt-surgery to test H3
  pre-emptively assumes H3 is live independently, which the
  evidence doesn't support.
- Cost asymmetry: prompt-surgery is a 3-file commit with
  bounded scope. Model-cognitive intervention requires
  evaluation infrastructure OI-3 doesn't currently have.
- The fix-validation step in §6 part 5 explicitly tests whether
  H3 is live post-fix. If validation surfaces persistent
  staling, H3 is promoted to next-iteration scope.

### Option D (rejected) — orchestrator-side enforcement

Move canvas_directive emission discipline to the orchestrator:
on receiving a `respondToUser` with template_id matching a
proposal-shaped template (`agent.entry.proposed`), the
orchestrator synthesizes a card from the most recent
`postJournalEntry` tool_result if no card was emitted. Rejected
because:

- The orchestrator doesn't have the model's reasoning context
  for tentative-state representation. A synthesized card under
  ambiguity carries no signal to operators that the model
  flagged uncertainty.
- Reproduces OI-2's Site 2 post-fill pattern at a layer that's
  semantic rather than mechanical. OI-2 post-fill handles
  orchestrator-owned UUIDs (no model reasoning involved). Card
  synthesis would handle account selection, amount inference,
  description authoring — model-reasoning territory.
- Couples downstream behavior to upstream model failure shapes.
  If the model emits a card with model-reasoning errors, the
  orchestrator can't tell the difference between
  "model-perceived ambiguity" and "model-reasoning error."

## 6. Implementation scope

Eight parts, each corresponding to an atomic commit, work block,
or downstream verification step.

### Part 1 — Pre-fix M3 baseline measurement

Before prompt-surgery commits, measure pre-fix canvas_directive
emission rate per entry shape category. This produces the
baseline against which §6 Part 5 (M1 post-fix validation)
compares.

**Production-trace surface:**
- `$HOME/chounting-logs/c7-ec13-run-20260426T054634Z.log` (~31
  min of C7 dev-server logs, archived per friction-journal
  section (o)).
- Pre-C7 archived traces from C5/C6 if available — check
  `$HOME/chounting-logs/` for siblings.

**Grep recipe (existing telemetry, template_id distribution
only):**

```bash
grep "handleUserMessage: response extracted" \
  $HOME/chounting-logs/c7-ec13-run-*.log \
  | jq -s 'group_by(.template_id)
           | map({template_id: .[0].template_id,
                  count: length,
                  had_tool_calls_true: map(select(.had_tool_calls)) | length,
                  had_tool_calls_false: map(select(.had_tool_calls | not)) | length})'
```

**Limitation:** the existing log line surfaces `template_id` and
`had_tool_calls` but not `canvas_directive` presence (Obs-G
standing telemetry gap from C11). M3 baseline against the
existing log shows template_id distribution but cannot directly
measure canvas_directive emission rate. To obtain a true
canvas_directive baseline, Part 2 below adds the field to the log
line; M3 then runs against post-Part-2 logs from a free-tier
re-run, OR M3 re-derives canvas_directive presence from
ai_actions row presence cross-referenced against template_id
(orphan signature: `template_id` proposes-an-entry but no paired
ai_actions confirmation).

**Cross-referencing recipe (no telemetry change required;
illustrative — column names not verified against current schema):**

```sql
SELECT
  je.template_id,
  COUNT(*) AS turn_count,
  COUNT(aa.idempotency_key) AS confirmed_pairs,
  COUNT(*) - COUNT(aa.idempotency_key) AS likely_orphans
FROM agent_session_turns je
LEFT JOIN ai_actions aa
  ON aa.idempotency_key = je.card_idempotency_key
WHERE je.session_id IN (<C7 session ids>)
GROUP BY je.template_id;
```

The SQL above is illustrative — `agent_session_turns.card_idempotency_key`
is the conceptual join key, but the actual column may be derived
from a JSONB field (e.g., the `successAssistantTurn.card.idempotency_key`
shape produced by the orchestrator). Implementation chat translates
the recipe to the actual schema shape (likely a
`jsonb_path_query`/`->>` expression) before running.

Implementation chat picks recipe; either gives baseline data.

### Part 2 — Telemetry patch (closeout deliverable from C11 Obs-G)

Add `canvas_directive_present: boolean` and `directive_source:
'model_loose' | 'site2_postfilled' | 'none'` to the
response-extraction log line in `src/agent/orchestrator/index.ts`
(currently emits `template_id` and `had_tool_calls` only).

This is **C11 closeout deliverable #1a** (per friction-journal
section (p) Obs-G discussion). Scheduled into OI-3 because OI-3's
M1 post-fix validation depends on observable canvas_directive
emission rate, which the existing log line cannot provide.

If operator prefers Part 2 deferred to a separate telemetry
workstream, M3 baseline and M1 validation use the cross-
referencing recipe from Part 1 instead. Either path works;
including Part 2 in OI-3 is the lower-friction option.

### Part 3 — Prompt-surgery on three surfaces

Three file edits per §4 above. Implementation chat finalizes
exact wording and resolves the §3c sub-decision (four-option
tentative-state representation) before authoring prompt text in
4a's bracketed paragraph.

**Files:**
- `src/agent/prompts/personas/_sharedSections.ts` —
  `STRUCTURED_RESPONSE_CONTRACT` revision per §4a
- `src/agent/tools/respondToUser.ts` — tool description
  revision per §4b
- `src/agent/prompts/validTemplateIds.ts` —
  `validTemplateIdsSection()` rubric revision per §4c

**Schema changes (depending on §3c sub-decision resolution):**
- (a) tentative-flag: add `tentative?: boolean` to
  `ProposedEntryCardSchema` and `ProposedEntryCardInputSchema`.
- (b) sentinel values: no schema change; document sentinel
  vocabulary in card-schema comments.
- (c) discriminated-union variant: add
  `tentative_proposed_entry_card` to `canvasDirectiveSchema`
  with separate variant card schema.
- (d) prose-only: no schema change.

### Part 4 — Soft 9 integration test (M2 durable test)

**Sequencing dependency:** Soft 9 authoring is sequenced after
§3c sub-decision resolution; expected directive shape varies by
tentative-state-representation option chosen. If implementation
chat attempts Part 4 before §3c resolves, assertion #2's
expected shape is undefined.

Author `tests/integration/soft9OI3PromptSurgery.test.ts`
paralleling Soft 8's pattern (
`tests/integration/soft8EntryEightReplay.test.ts`). Asserts:

1. **Productive path with directive:** Agent emits
   `agent.entry.proposed` for a simple double-entry (Entry 12
   shape). Response includes `canvas_directive` with type
   `proposed_entry_card`. Site 2 post-fill stamps
   `org_id`/`idempotency_key`/`trace_id`; card validates strict.
2. **Tentative path with directive:** Agent emits
   `agent.entry.proposed` for a contra-account entry (Entry 15
   shape) where the prompt would previously have routed to
   `agent.response.natural`. Response includes both the
   structured response and a tentative `canvas_directive`.
3. **No-directive path stays clean:** Agent emits
   `agent.response.natural` for a non-proposal clarification
   ("why was this posted?"). No `canvas_directive` expected; no
   orphan ai_actions row.
4. **Strict-schema rejection on emission-but-invalid:** if the
   model emits a malformed canvas_directive (post-fix), Site 2's
   `ProposedEntryCardSchema.parse()` throws (defense-in-depth
   from OI-2 unchanged).

Fixture strategy: new fixture files
`tests/fixtures/anthropic/oi3-class-2-shapes.ts` covering Entry
12, Entry 13 (multi-line split), Entry 15 (contra-asset
adjusting). Mocked-LLM integration tests; no paid-API spend.

### Part 5 — M1 post-fix validation (paid, $0.50 ceiling)

Synthetic-prompt harness against the real model on
canvas_directive emission post-fix. **Scoping for this run
applies Meta A's state-decomposition convention** (per §7
below): coverage / cost / hypothesis-discrimination dimensions
articulated at scoping time.

**Prompt set:** nine shapes total.
- C7-attempted shapes (4): Entries 12 (simple double-entry),
  13 (multi-line split with discount), 14 (gate A short-circuit
  / relative-date), 15 (contra-asset adjusting Allowance).
- C7-untried directive-emission shapes (4): Entries 16
  (multi-leg asset/financing), 17 (cross-reference dependency),
  18 (intra-asset transfer), 19 (contra-intangible adjusting).
- **Negative-control (1):** Entry 20 (ambiguous + cross-entry
  hallucination bait, EC-11 failure-mode probe). Expected
  outcome: NO canvas_directive, agent.response.natural with
  clarifying text. Tests OI-3's prompt-surgery doesn't
  over-correct toward "always emit card" on entries that should
  not emit a confident card.

**Run shape:**
- 3 runs per shape for H3e (nondeterminism) variance assessment
  and H3 vs. H3b-only discrimination (post-fix; if any
  positive-emission shape still stales after prompt-surgery,
  H3 is independently live).
- 27 total prompt invocations.
- Estimated cost: $0.40-$0.50 against $0.50 ceiling at typical
  $0.015-0.020/invocation. Halt at ceiling per Meta A's cost
  dimension; if per-invocation cost trends toward the upper
  bound, the run halts before completing all 27 invocations and
  closes PARTIAL with the state-decomposition discipline §7a
  requires.

**Hypothesis-discrimination dimension (Meta A example, N=1 for
hypothesis-discrimination as a measurement axis; per-sub-type
N=2 split trigger fires if a future run authors the same
dimension, per Meta A convention):**

For each shape, classify the run's outcome across its 3 invocations:
- **H3b-alone:** all positive-emission shapes emit
  canvas_directive cleanly (3/3 runs each); negative-control
  (Entry 20) does not emit (3/3 runs). Prompt-surgery fixed the
  mechanism without over-correction.
- **H3-also-live:** 1+ runs across the 3 fail to emit on a
  positive-emission shape despite prompt-surgery. H3 is
  independently live; OI-3 needs a second iteration addressing
  model-cognitive selection behavior.
- **Over-correction:** negative-control (Entry 20) emits a
  canvas_directive in 1+ runs despite expected no-card. Indicates
  prompt-surgery routes too aggressively toward emission. Surgery
  needs revision to handle the proposal-vs-non-proposal-shape
  distinction more carefully.
- **Inconclusive:** variance too high to distinguish patterns
  (e.g., split outcomes within the 3 runs of a shape with low
  confidence on either pattern).

A run's overall classification can be a mix — e.g.,
"H3b-alone on shapes 12/14/16/17/18/19, H3-also-live on shapes
13/15, no over-correction on Entry 20" is a sharper diagnostic
than collapsing to a single state.

### Part 6 — Synthetic-bypass for upstream-attrition mitigation (Meta B invariant-pipeline)

**Meta B's invariant-pipeline articulation (§7 below) surfaces a
recursive cross-dependency:** OI-3's verification can't run
against the EC-2 prompt set without OI-3 itself being live in
the loop, because the same Class 2 attrition mechanism that
scoped C7's coverage to simple shapes would scope OI-3's
verification the same way.

**Resolution:** Part 5's harness is **synthetic** — single-turn
prompts with controlled context, designed to exercise the
target shape's canvas_directive emission directly. Synthetic
prompts bypass the upstream Class 2 risk by isolating the
fix-stack's verification surface. This is one of Meta B's three
invariant-pipeline-resolution options ("synthesize bypass
prompts"); the other two ("sequence upstream fix first" — OI-3
*is* the upstream fix; "claim coverage only against
post-attrition residue" — reproduces C7's shape) don't apply.

This was C11's tentative resolution; this scoping doc commits
to it.

### Part 7 — Validation and resume

- `pnpm agent:validate` green (typecheck + 26/26 Category A
  floor).
- `pnpm test` — existing 536 + 1 new (Soft 9) = 537/537
  passing.
- Prompt-surgery commits land sequentially per Part 3.
- M3 baseline runs from log artifacts, no paid spend.
- Soft 9 lands as an atomic commit under Part 4.
- M1 post-fix validation runs after Parts 1-4 land, paid spend
  bounded by Part 5's $0.50 ceiling.

### Part 8 — Commit shape

Sequence:
1. Telemetry patch (Part 2) — atomic commit.
2. Prompt-surgery commits (Part 3) — three commits, one per
   surface, OR one batched commit with all three surfaces. Batch
   if the §3c sub-decision lands cleanly during implementation;
   sequential if any surface needs iteration.
3. Soft 9 integration test (Part 4) — atomic commit.
4. M1 post-fix validation (Part 5) — execution work, no commit
   of code; produces friction-journal entry and updated run
   record.

Standalone branch: `oi-3-class-2-fix-stack`. Merge to
origin/staging after Part 5 validates clean.

## 7. Convention applications

OI-3 is the first concrete application of C11's Meta A and Meta
B conventions. Per the C11 retrospective scoping prompt, this
brief applies both at scoping time (preventive), not just at run
time (retrospective).

### 7a. Meta A — state-decomposition for OI-3's measurement dimensions

OI-3's M1 post-fix validation (Part 5) measures three
dimensions. Each gets explicit decomposition at scoping time per
Meta A:

**Coverage dimension** (N-tuple values):
- **Verified:** post-fix emission confirmed (3/3 runs emit
  canvas_directive cleanly on positive-emission shapes; 3/3 runs
  do not emit on negative-control).
- **Attempted-but-failed:** post-fix emission absent on a
  positive-emission shape (1+ runs fail despite prompt-surgery)
  OR present on negative-control (over-correction).
- **Untried:** shapes not in Part 5's nine-shape harness.

**Cost dimension** (N-tuple values):
- **Verification spend:** paid-API spend on the nine shapes
  with 3 runs each.
- **Discovery spend:** paid-API spend on out-of-scope failures
  surfacing during Part 5 (e.g., a different orphan pattern not
  named in OI-3 scope).
- **Total:** verification + discovery, against $0.50 ceiling.

**Hypothesis-discrimination dimension** (N=1 in Meta A's example
list; per-sub-type N=2 split trigger fires if a future run
authors this dimension; four states per the expansion in Part 5):
- **H3b-alone:** rubric-followed cleanly post-fix on
  positive-emission shapes; no over-correction on
  negative-control.
- **H3-also-live:** some positive-emission shapes still fail
  despite prompt-surgery.
- **Over-correction:** negative-control emits despite expected
  no-card.
- **Inconclusive:** variance too high to distinguish patterns.

Per Meta A convention text: any PARTIAL closure on Part 5
populates all three dimensions in the run record, regardless of
whether each dimension shows divergence.

### 7b. Meta B — scoping-time cross-dependency articulation

Three articulation prompts run against this scoping doc per
Meta B:

**Policy-rule interactions:** Part 5's halt criteria are inherited
from EC-2's halt-and-escalate ($0.50 single-call ceiling, full
$0.50 chunk-total ceiling, systematic-issue halt). The pairwise
check: when a single call exceeds $0.50, both single-call-ceiling
and chunk-total-ceiling could trigger; convention is single-call
fires first. When systematic-issue halt and chunk-total are both
active, systematic-issue overrides per Convention #10 retraction
#16's D2-vs-D3 resolution. Both interactions are explicit and
follow established precedent.

**Invariant-pipeline dependencies:** OI-3 verifies against a
prompt set where the same invariant OI-3 fixes (Class 2 orphan
pattern) is upstream of OI-3's verification surface. Recursion
resolved via synthetic-bypass per §6 Part 6. The other two
options (sequence upstream first; claim coverage post-attrition)
don't apply; doc commits to bypass.

**Telemetry-salience dependencies:**
- (i) Existing telemetry surfacing: response-extraction log line
  emits `template_id` and `had_tool_calls`, not
  `canvas_directive` presence. OI-3's M1 validation depends on
  this discriminator. **Closeout patch scheduled into OI-3 as
  Part 2** rather than deferred to a separate telemetry
  workstream — the dependency is direct.
- (ii) Net-new code path telemetry: prompt-surgery is text-only
  in three files; no net-new orchestrator/service code paths
  introduced. This sub-clause does not fire for OI-3.

### 7c. Meta-evidence on Meta B's first application

Meta B's three articulation prompts, applied above, surfaced
their cross-dependencies cleanly. Specifically:

- Policy-rule interactions surfaced two pairs (single-call vs.
  chunk-total; systematic-issue vs. chunk-total) and resolved
  both with explicit precedent citations.
- Invariant-pipeline surfaced the recursive Class-2-as-upstream-
  and-as-fix dependency C11 anticipated, and resolved with the
  synthetic-bypass option C11 tentatively named.
- Telemetry-salience surfaced sub-clause (i)'s direct dependency
  on the canvas_directive log field, scheduling the patch into
  OI-3 as Part 2.

**First-application evidence is confirmatory.** Meta B's prompts
work as authored on this scoping case. This is N=1 evidence on a
convention with N=3 instances; not a falsification trigger, but
informative for the conventions-catalog edit chat. The catalog
edit can land Meta B's text as drafted in C11 section (p)
without revision based on this evidence.

One **observation worth carrying to the catalog edit chat**:
during scoping, the natural framing of §3a's card-schema
coupling raised a question — is "fix-stack-introduces-cross-
dependency-with-schema" an instance of invariant-pipeline
dependencies or a fourth Meta B sub-type (contract-shape
dependencies)? The current Meta B text accommodates it as an
invariant-pipeline instance (the schema is downstream of the
prompt-surgery work in pipeline order), but the "downstream"
relationship is contract-shape rather than execution-order.

Catalog edit chat may consider renaming the sub-type for broader
semantic coverage without splitting; rename is lower-cost than
split and accommodates the contract-shape case under existing
convention structure. Candidate renames: "invariant or
contract-shape pipeline dependencies" or "downstream-component
dependencies." Either captures the contract-shape instance
without committing to a sub-type proliferation that N=1 evidence
wouldn't support.

## 8. Open items

**Resolved at scoping (committed):**

- Sub-decision §3c recommendation (card alongside clarification,
  with tentative-flag mitigation) — recommended, awaits
  operator ratification at scoping-doc review.
- **Semantic content of §4a/4b/4c** — what the contract, tool
  description, and rubric must convey is committed in the
  semantic-content blocks of §4. Implementation chat finalizes
  prose; semantics is the floor.
- Synthetic-bypass for invariant-pipeline recursion — committed
  in §6 Part 6.
- Telemetry patch scheduled into OI-3 as Part 2 rather than
  deferred — committed.
- Negative-control (Entry 20) included in Part 5 prompt set —
  committed.

**Flagged for implementation chat to resolve:**

- §3c four-option enumeration on tentative-state representation
  ((a) flag / (b) sentinels / (c) discriminated-union variant /
  (d) prose-only). Implementation chat selects after reading UI
  consumer code and confirm-route audit-trail handling.
- **Exact prose wording** in §4a/4b/4c — word choice, sentence
  structure, tone-matching to surrounding prompt context. Drafts
  in §4 are the semantic floor; implementation chat finalizes
  prose.
- Part 5's run-record format for hypothesis-discrimination
  dimension (specific JSON shape, where stored, how surfaced in
  friction-journal capture).

**Flagged for downstream chats / future workstreams:**

- onboardingSuffix step-4 prose pattern (§2d) — same pattern,
  out of OI-3 scope; named for future onboarding-specific work.
- Meta B catalog edit observation (§7c) — invariant-pipeline
  vs. contract-shape sub-type question with rename-vs-split
  candidate paths; flagged for conventions-catalog edit chat.
- C12 Phase 1.2 closeout decision (does OI-3 close inside Phase
  1.2 or extend into Phase 2?) — operator scope decision,
  not OI-3 work.

**Resume point:** OI-3 fix-stack chat opens against this brief.
First action: implementation chat resolves §3c four-option
enumeration; second action: prompt-surgery commits per §6 Part
3 with finalized text.
