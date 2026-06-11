# Rule Core Access-and-Tuning Brief — v1 Stage 1 + future surfaces

**Status:** Design-only pre-ratification brief. Not an ADR, not a UI spec, not an
amendment to V3.1. Specifies the user-facing surface of the rule core downstream of
the architecture ratified in the Rule Type Core CTO Proposal (V3.1).

**Anchor:** `00250f34` on `staging` — the V3.1 commit (the document has since been
ratified and moved to the canonical spec at `docs/02_specs/rule-type-core.md`). This brief
inherits V3.1's domain model wholesale and does not extend it. Where a user-facing
surface appears to need something V3.1 does not provide, the brief surfaces it as an
open question (§8), never as a unilateral change.

**Scope posture:** The v1 deliverable is **Stage 1** (§4–§7). Stage 2 and Stage 3
are named with their substrate dependencies (§3) but not specified — naming them is
the whole of the brief's obligation to them.

---

## 1. Why this brief exists

V3.1 answers the architectural question — *what is a Rule*. It does not answer the
product-surface question — *what does a user do with a Rule, and through which
surfaces*. The two are separable, and the second is unanswered.

Without the second answered, two downstream workstreams carry avoidable risk. The
Ring 1 substrate ADR risks shipping schemas that don't cleanly support the v1 user
operations (for example, a track-record shape that can't feed the canvas's
last-30-day indicator without a separate derived read). The Ring 2A implementation
risks shipping evaluator code with no place to surface its outputs.

This brief is the bridge between V3.1's domain model and the eventual UI specs that
ship alongside Ring 2A workflow evaluators. It sets v1 user-facing scope, names the
future product surfaces with their substrate dependencies, and pins down a small set
of questions the Ring 1 ADR benefits from having answered (§8). It produces
downstream UI specs when the corresponding substrate ships; it does not itself author
them.

---

## 2. What V3.1 ratifies (load-bearing inheritance)

This brief inherits the following from V3.1 verbatim. It does not re-state the detail;
it cites the section and uses the vocabulary.

The closed Trigger / Condition / Action grammar (V3.1 §5.4–§5.6). The **pure core vs.
Agent Ladder gate** separation (§6.1, §6.1.1): the pure core produces a `MatchResult`
carrying `winning_branch_max_action` (what the rule logic *permitted*); the gate
computes `effective_action` (what the system is *currently authorized* to do).
`effective_action` is not a field of the `MatchResult`. The three-state match taxonomy
— `primary_match` / `guardrail_match` / `almost_match` (§5.7). The lifecycle states
(`proposed` / `active` / `demoted` / `retired`) on an axis **separate** from
`current_rung` (§5.8). The Rule Validity Invariants (§7). Retire-and-create-new logic
immutability with `predecessor_rule_id` / `successor_rule_id` lineage (§5.1). The
mutability of `name` as display metadata, emitting `rule_metadata_updated` with a
`rule_name_snapshot` for reproducibility (§5.1 / Patch 5, §8.5).

Every claim this brief makes about the rule core's domain model is either a verbatim
inheritance from V3.1 or an open question surfaced in §8. There is no silent
extension. If a user-facing operation specified below appears to contradict V3.1, the
contradiction is a finding for the rule-core spec to address, not a change this brief
makes.

---

## 3. The three-stage canvas progression (forward-looking scope)

The user-facing surface for the rule core grows in three stages, each gated on a
substrate dependency. Only Stage 1 is the v1 deliverable.

**Stage 1 — Minimum viable canvas.** A list view of the org's Rules plus four row
actions (promote / demote / rename / retire) and a promotion-ceremony modal, with the
agent as the primary authoring path. *Substrate dependency:* Ring 1 (`rule_registry` +
`rule_track_records`, or the deferral interim path per V3.1 §5.10) **plus** the first
Ring 2A workflow evaluator (the drag-drop bill `pattern` evaluator). This is what the
brief specifies in detail (§4–§7).

**Stage 2 — Flowchart authoring canvas.** A WHEN / CHECK-IF / DO authoring surface for
power users — form-based rule construction and a rendered Branch/Condition/Action
flowchart detail view. *Substrate dependency:* Stage 1 substrate **plus** a second
Ring 2A materialization (recurring schedules or reconciliation match rules). The second
materialization is what makes rule shape visibly heterogeneous and makes form-based
authoring meaningfully different from chat-based authoring — with one materialization,
a flowchart authoring surface has nothing to disambiguate. **Reserved as a future
product surface;** the brief names it and its substrate dependency and stops there.

**Stage 3 — Full canvas with learner outputs.** Surfaces system-proposed Rules
(`lifecycle_state = proposed`), refinement amendments, shadow-mode comparison results,
and post-hoc anomaly indicators. *Substrate dependency:* Ring 2B (shadow-mode
execution, post-hoc anomaly scan) **plus** Ring 3 (the learner + the rule-refinement
loop). **Reserved as a future surface;** ships post-v1 after corpus accumulation.

Plainly: the v1 deliverable is Stage 1. Stage 2 ships when its substrate dependency
(the second materialization) materializes, not before. Stage 3 ships post-v1 after
corpus accumulates. The Stage labels in this brief refer to this canvas progression,
not to repo phase numbering.

---

## 4. Stage 1 canvas specification

This is the load-bearing section. It specifies what operations exist and what data
they need. Pixel layouts, field shapes, and interaction details are downstream
UI-spec concerns and are out of scope here.

### List view contract

A scannable list of Rules for the controller's current org. At v1 substrate, the list
is scoped to `vendor_rules` rows enriched with their `rule_registry` and
`rule_track_records` counterparts — or with cross-cutting metadata synthesized by the
repository adapter if Ring 1 takes the deferral interim path (V3.1 §5.10). The canvas
consumes whichever the Ring 1 ADR ships; it reads through a catalog/query service or
repository-backed read model — **not** through `ruleEvaluationService`, which is the
runtime evaluator path — never the tables directly (V3.1 §2 dependency direction).

Each row exposes, at minimum:

- **Rule name** — the `name` field. System-created Rules default to a
  system-generated label until renamed.
- **Workflow scope** — at v1, uniformly "Vendor rule," derived from the backing
  materialization (`vendor_rules`). Future stages add other scopes as further
  materializations land; the label is a derivation, not a stored user-facing field.
- **Current rung** — a badge: `always_confirm` / `notify_and_auto_post` /
  `silent_auto` (canonical names: Always Confirm / Notify & Auto-Post / Silent Auto).
- **Lifecycle state** — a *separate* badge: `active` / `demoted` (and `proposed` once
  Ring 3 lands). V3.1's rung/lifecycle axis separation (§5.8) is **visible here as two
  badges, not one collapsed status**. A demoted Rule reads as `always_confirm` rung +
  `demoted` lifecycle — distinguishable from a never-promoted `always_confirm` /
  `active` Rule.
- **Primary track record** — a single indicator of clean approvals over total primary
  matches in the last 30 days. See Q-RC-AT-1: this is a *derived windowed read*, not a
  stored cumulative counter (`clean_approval_count` in V3.1 §5.9 is cumulative; the
  30-day window is computed from the audit corpus).
- **Last winning match** — the most recent evaluation in which the Rule won conflict
  resolution. See Q-RC-AT-2: V3.1 §5.9 stores outcome-specific anchors
  (`last_clean_approval_at`, `last_rejection_at`, `last_guardrail_fire_at`) but no
  single such timestamp; the semantic is pinned and the canonical column label is a
  product/UX sub-question.

Sort and filter axes (affordances are downstream-spec; the brief names the axes): by
rung, by lifecycle state, by track-record health (recent rejection rate), by recency
(last winning match).

### Four row actions

- **Promote.** Available when the Rule's `promotion_eligible` is true (≥15 primary
  matches AND ≥95% approval rate AND 30-day window, V3.1 §5.9). Opens the
  promotion-ceremony modal. Authority: controller for `notify_and_auto_post`, owner
  for `silent_auto` (agent_autonomy_model.md §4.1).
- **Demote.** Available for any Rule at `current_rung != always_confirm`. One-click,
  immediate, no ceremony — demotion is asymmetric by design (agent_autonomy_model.md
  §4.3 "Re-Probate"). Authority: any controller. Mutates `current_rung` to
  `always_confirm` AND `lifecycle_state` to `demoted` in the same transaction (V3.1
  §5.8 axis-separation discipline).
- **Rename.** `name` is mutable display metadata (V3.1 §5.1 / Patch 5). Emits
  `rule_metadata_updated`; historical Logic Receipts store `rule_name_snapshot` so
  past Four Questions renderings remain reproducible. See Q-RC-AT-3 on the
  `rule_name_snapshot` dependency on the Logic Receipt write path.
- **Retire.** Available for any Rule at `lifecycle_state ∈ {active, demoted}`.
  Requires a confirmation step (the only Stage 1 row action that does — retired
  is terminal per V3.1 §5.8, with no `retired → active` transition; friction
  matches terminality). Authority: any controller (V3.1 §5.8, "controller
  explicitly retires" — Stage 1 does not unilaterally escalate to owner; see
  Q-RC-AT-7). Emits `rule_retired` with `successor_rule_id = null` (explicit
  retirement only; the retire-and-create-new amendment path is Ring 3, not
  Stage 1). Sets `lifecycle_state = retired`; the Rule no longer participates
  in evaluation. Once retired, the Rule's row remains for audit but does not
  appear in the canvas's default `lifecycle_state ∈ {active, demoted}` filter.

### Promotion-ceremony modal contract

Per agent_autonomy_model.md §4.1, the modal shows: the last N matches for the Rule
(sampled, not exhaustive), the maximum transaction amount observed, an impact preview
("over the coming period this would auto-post an estimated X entries totaling $Y"),
and a confirm/cancel pair. For `silent_auto`, the flow requires a second confirmation
from the org owner (Q24 controller-proposes / owner-approves). The brief specifies
*what the modal shows*, inheriting the canonical ceremony; sample-selection logic,
impact-preview computation, and the back-end query shape are downstream-spec concerns.

### Stage 1 detail surface (behavior, not logic)

Stage 1 includes a detail surface — a drawer or panel opened by selecting a
Rule from the list view — but the surface renders **behavior, not logic**.

The detail surface answers *what has this Rule been doing*:

- Identity header: rule name (renameable inline per the Rename row action),
  rule type, current rung, lifecycle state. The two badges (rung + lifecycle)
  remain visible at the top.
- Track-record trend: primary clean-approval rate over the last 30 days
  (windowed read; see Q-RC-AT-1), recent rejection rate, guardrail-fire and
  guardrail-resolved-into-primary-bounds counts.
- Recent matches: the last N evaluations in which the Rule's trigger fired,
  each row showing match classification (`primary_match`, `guardrail_match`,
  `almost_match`), the proposal it matched against (linked to that proposal's
  canonical surface), the disposition (approved / rejected / auto-posted /
  routed-to-Needs-Attention), and the resulting effective action.
- Last winning match: the most recent evaluation in which the Rule won
  conflict resolution (`winning_rule_id`). See Q-RC-AT-2 for the label/naming
  sub-question.

The detail surface does **not** render the Rule's Trigger / Condition / Action
structure — no Branch flowchart, no Condition predicates, no
`max_outcome_action` exposed. That surface is Stage 2's flowchart canvas; it
is the surface that makes form-based authoring viable, and rendering rule
logic at Stage 1 collapses the Stage 1 / Stage 2 boundary.

This split — *what the Rule did* (Stage 1) vs *what the Rule is* (Stage 2) —
is the load-bearing scope guard. Demote and retire decisions are driven by
behavior: a Rule is misbehaving when its recent matches show the wrong
classifications or its track record is degrading, not because its predicates
look wrong on inspection. Stage 1's detail surface gives controllers exactly
what they need to decide demote and retire confidently, and nothing more.
Inspecting *what the Rule is* — its logic — is Stage 2 territory because it
lives on the same axis as authoring the Rule's logic from a form.

### What Stage 1 does NOT include

- **Form-based rule authoring.** Rules come from the conversational surface (§5) or
  from `vendorRuleService` writes via service-layer fixtures during testing.
  Form-based authoring is a Stage 2 surface.
- **Flowchart rule detail view (logic rendering).** The full
  Trigger/Condition/Action structure is not rendered to the user at Stage 1.
  Stage 1's detail surface renders behavior (recent matches, track-record
  trend, last winning match), not logic. The Branch / Condition / Action
  flowchart is Stage 2.
- **System-proposed Rules.** The learner is Ring 3, post-v1. No `lifecycle_state =
  proposed` rows appear at Stage 1 (but see Q-RC-AT-4 on reserving the lane).
- **Predecessor/successor chain navigation.** The retire-and-create-new lineage (V3.1
  §5.1) is recorded in the schema at Ring 1 but not surfaced visually until Stage 2.
- **Refinement amendments.** Ring 3 territory.

---

## 5. The conversational rule-authoring surface (Stage 1's primary authoring path)

Stage 1 has no form-based authoring. The agent is the primary authoring surface at v1.

**The drafting contract.** A controller says in chat: "auto-post Amazon office
supplies under $500." The agent's drafting API (abstractly; the exact service-method
shape is Ring 2A territory) translates this into a typed Rule using the closed grammar:
pick `rule_type` (`pattern`), pick the Evaluation Trigger Set
(`[proposed_mutation_generated]`), build the primary Branch's Conditions from the
closed library (`field_equals(vendor_id, …)`, `field_in_range(amount, 0, 500)`,
`field_matches_pattern(line_items, "office_supplies_pattern")`), propose the defensive
`otherwise_if` guardrail Branches the controller didn't ask for explicitly
(out-of-range amount → `route_to_exception_queue_with_reason`), and set
`max_outcome_action` from the stated intent (`auto_post_at_rung_2` for "auto-post").

**Expectation-setting in the agent's confirmation.** When the controller's stated
intent is "auto-post," the agent's chat-side confirmation makes the v1 authority
discipline explicit: *"I'll create this as an auto-post-capable rule, but it will
start at Always Confirm. It can auto-post after the promotion ceremony, once it has a
track record of 15 primary matches with ≥95% approval over 30 days."* This reinforces
V3.1 §14's load-bearing clarification 1 — promotion changes authority, not rule logic
— at the moment of rule creation, not after the controller discovers the new rule
isn't auto-posting yet.

**Authority discipline.** The agent drafts; the controller confirms. The agent does
not write to the registry directly — it produces a typed Rule object that surfaces in
chat as a proposal-shaped affordance the controller approves. On approval, the registry
mutation flows through `ruleRegistryService` / `vendorRuleService` per V3.1's
single-writer rules (§5.10). Per V3.1 §8.1, the Rule lands at `lifecycle_state =
active`, `current_rung = always_confirm`. Promotion is a separate ceremony (§4).

**Anti-hallucination disciplines.** These are owned by the `agent-tool-authoring`
conventions; the brief references rather than re-states them. The agent does not
synthesize free-form predicates — every Condition comes from the closed library. The
agent retrieves real `vendor_id` and other typed references via tool calls; it does not
invent them. When the controller's intent is ambiguous, the agent asks clarifying
questions rather than guessing.

**The conversational verbosity contract.** Per V3.1 §8.4's `agent_verbosity_for_rules`
configuration, the chat-side narration of rule drafting and of subsequent rule outcomes
is templated per intent_model.md §6 Logic Receipts (the `messages/{locale}.json`
template + structured `justification` fields, never raw model output). Terse / standard
/ educational variants. This is a pure UI surface; it does not affect rule core
evaluation. The templates themselves are out of scope for this brief.

---

## 6. Per-org configuration surface

Per V3.1 §8.4, the rule core's primary explicit tuning surface is per-org
`org_settings.*` columns, all NULL-default at v1, with activation post-v1 per
ADR-0019's substrate-now-enforcement-later pattern.

The reserved columns (inherited verbatim from V3.1 §8.4):
`default_initial_rung_for_new_rules`, `rule_proposal_threshold`,
`rule_type_preference`, `agent_verbosity_for_rules`.

**Authority surface:** owner-level for activation, mirroring the Q24
controller-proposes / owner-approves pattern from agent_autonomy_model.md. The brief
commits to this authority *shape*; the exact activation ceremony is reserved for a
future ADR.

**v1 UI:** none. The columns are NULL-default substrate-only at v1. Per-org
configuration at Stage 1 is a **schema-only deliverable, not a user-facing surface.**
A visible per-org configuration UI lands when the columns activate, post-v1.

---

## 7. Implicit tuning via approval behavior

This is the surface most product specs miss: every controller approval, rejection, and
edit emits audit events that update the Rule's TrackRecord mirrors. The audit log is
canonical per `docs/07_governance/adr/0011-document-platform.md` §1; TrackRecord
counters are fast-lookup denormalizations. Per V3.1 §5.9 + §8.5:

- Approve a Rule's primary-branch proposal → `clean_approval_count` increments; audit
  event `rule_match_confirmed`.
- Reject or reverse → `rejection_count` increments; audit event `rule_match_rejected`;
  a recent rejection pattern may trigger automatic demotion (agent_autonomy_model.md §7
  step 5).
- Approve a guardrail-fired proposal in a way that confirms the guardrail →
  `guardrail_confirmed_count` increments; audit event `rule_guardrail_confirmed`.
- Edit a guardrail-fired proposal back inside primary bounds →
  `guardrail_resolved_into_primary_bounds_count` increments; audit event
  `rule_guardrail_resolved_into_primary_bounds`.

The user does not think of these as "tuning the rule" — they think of them as doing
their job. The cumulative effect is that the rule library tunes itself over months
without explicit management. This is what V3.1 §14 calls compounding over months.

The brief names this surface explicitly so it is visible in product planning, and
confirms two things. **No special UI is required:** the existing approval surfaces —
the ProposedEntryCard, the Needs Attention lane (the canonical mutation state per
mutation_lifecycle.md; not `needs_review`, which is a document-case state), and the
reversal flow — produce these events as side effects of normal work. **Track-record
freshness is a UI-quality concern:** because rule state mutates during day-to-day work,
the Stage 1 canvas must show track-record state that is fresh-enough-to-be-useful
(real-time or near-real-time, not daily-batch), or the canvas will misrepresent rule
maturity. This freshness requirement interacts with Q-RC-AT-1 (the windowed read path).

---

## 8. Open questions and decisions surfaced to V3.1 / Ring 1

Numbered per the V3.1 convention: one-line statement, one-line proposed default or
deferral target. None of these amend V3.1; they are surfaced for a future product/UX
review and for the Ring 1 substrate ADR.

- **Q-RC-AT-1 — Windowed track-record read path.** The list view's last-30-day
  indicator is a derived windowed read, but V3.1 §5.9's `clean_approval_count` is a
  cumulative counter. *Proposed:* Ring 1 defines a windowed read (audit-corpus query or
  a 30-day materialized view) feeding the canvas; the cumulative counter alone does not
  satisfy the indicator. Whichever path Ring 1 picks must meet the freshness bar named
  in §7 — track-record state must be fresh-enough-to-be-useful, since implicit tuning
  mutates rule state during normal day-to-day work.
- **Q-RC-AT-2 — "Last winning match" semantic + canonical column label.** V3.1
  §5.9 stores outcome-specific anchors (`last_clean_approval_at`,
  `last_rejection_at`, `last_guardrail_fire_at`) but no single timestamp for
  the Rule's most recent winning evaluation. *Semantic, pinned:* "the most
  recent evaluation in which the Rule won conflict resolution
  (`winning_rule_id = this.rule_id`)." Ring 1 decides whether this is a
  stored `last_winning_match_at` column or a derived read from
  `rule_evaluated` audit events (this read is governed by the same freshness
  bar as Q-RC-AT-1, §7). *Canonical UI label, deferred to product/UX:* the
  natural English candidates are "last matched" (collides with V3.1 §5.7's
  `also_matched_rules` vocabulary, where "matched" covers losers too) and
  "last applied" (collides downstream toward ledger-posting, which is gated
  by `effective_action` and is not the same as winning conflict resolution).
  This brief uses the descriptive phrase "last winning match" in prose
  without committing to a UI label; the canonical label is a product/UX
  naming sub-question.
- **Q-RC-AT-3 — `rule_name_snapshot` depends on the Logic Receipt write path.** Rename
  emits `rule_metadata_updated` and relies on `rule_name_snapshot` for reproducible
  past renderings, but the Logic Receipt write path (INV-AGENT-002) is
  reserved-but-not-yet-registered (V3.1 §5.7). *Proposed:* rename ships at Stage 1
  (V3.1 §8.5 marks `rule_metadata_updated` v1-active); the `rule_name_snapshot`
  reproducibility guarantee is contingent on the Logic Receipt write path landing, and
  Ring 1 should note the dependency rather than assume the guarantee holds at v1. At
  v1, until INV-AGENT-002 lands, rename ships without snapshot storage — audit
  references resolve to the Rule's current name at read time, not the name it held at
  fire time. A small, acceptable audit/UX cost; Ring 1 either accepts it or accelerates
  the Logic Receipt write path.
- **Q-RC-AT-4 — Reserve the `proposed` lane in the Stage 1 canvas.** Ring 3 ships the
  learner post-v1, so no `lifecycle_state = proposed` rows exist at Stage 1. *Proposed:*
  yes — leave the proposed lane as a placeholder in the canvas's information
  architecture so Ring 3 visibility slots in without a redesign; do not build its
  contents at Stage 1.
- **Q-RC-AT-5 — Where the agent's draft affordance renders.** The "I drafted a Rule
  from what you said — here's what I came up with" affordance could render inline in
  chat as an expandable proposal card, in a side panel, or both. *Deferral:* downstream
  UI-spec concern; raised here, not decided.
- **Q-RC-AT-6 — Multi-org controllers.** V3.1 does not address whether the Stage 1
  canvas serves controllers operating across multiple orgs or is scoped one-org-at-a-
  time. *Proposed:* one-org-at-a-time at Stage 1 (the canvas is org-scoped); multi-org
  switching is a product-scope question for the future product/UX review.
- **Q-RC-AT-7 — Retire authority at Stage 1.** V3.1 §5.8 specifies controller
  authority for explicit retirement ("controller explicitly retires"). The
  Stage 1 Retire action follows that authority shape (§4 row actions). *Open
  for product/UX:* whether the terminal nature of retirement warrants owner
  gating in addition to controller authority — terminal operations elsewhere
  in the system (e.g., the silent_auto promotion ceremony per
  `agent_autonomy_model.md` §4.1) require owner co-sign. This brief commits
  to V3.1's authority shape; if owner-gating Retire is desirable, that is a
  finding for the rule-core spec to absorb, not a brief decision.

---

## 9. Cross-references

Inherited verbatim; cited, not re-stated.

- `docs/02_specs/rule-type-core.md` — the canonical rule-core spec
  (ratified). This brief inherits its domain model wholesale.
- `docs/02_specs/agent_autonomy_model.md` — promotion ceremony (§4.1), demotion /
  Re-Probate (§4.3), decision-tree steps (§7), Agent Policies canvas + template
  language (§8).
- `docs/02_specs/intent_model.md` — Four Questions grammar (§5); Logic Receipt
  templating contract (§6).
- `docs/02_specs/mutation_lifecycle.md` — the canonical **Needs Attention** mutation
  state (not `needs_review`).
- `docs/07_governance/adr/0017-vendor-template-substrate.md` — first concrete rule
  materialization; the substrate the v1 canvas operates against (with the V3.1 §3
  four-item drift reconciled at Ring 1).
- `docs/07_governance/adr/0020-agent-first-authority-gradient-source-architecture.md` —
  the `agent/policies/agent-ladder/` empty home; dependency direction.
- `apps/web/src/agent/policies/agent-ladder/README.md` — the policy/source
  home for Agent Ladder logic per ADR-0020. **Not** the UI home; UI
  components for the Stage 1 canvas live in the eventual product-surface
  location chosen by the Ring 2A UI spec, which is downstream of this brief.

---

## 10. What the brief asks for

The brief is not asking for CTO ratification (V3.1 carries that). It asks for product /
UX agreement on four points:

1. **Stage 1 scope is correct** — the minimum viable canvas (list view +
   promote/demote/rename/retire + promotion-ceremony modal + behavior-not-logic detail
   surface) plus the conversational authoring surface, with form-based authoring
   deferred to Stage 2.
2. **Stages 2 and 3 are deferred but named** — their substrate dependencies (§3) are
   correctly identified; they are real future surfaces, not vaporware.
3. **The implicit-tuning surface (§7) is a product concern, not just an architectural
   one** — track-record freshness affects perception of rule maturity and is a
   UI-quality requirement, not an afterthought.
4. **The conversational surface is the v1 primary authoring path** — form-based
   authoring waits for Stage 2.

If any of these four are contested, the contestation is itself an open question for the
product/UX review, not a decision this brief makes unilaterally.
