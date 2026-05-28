# Rule Type Core

**Status:** Ratified 2026-05-26 by CTO. Canonical spec for the rule-core domain
layer. Post-ratification location per ADR-0021; ratified from
`docs/09_briefs/post-mvp/2026-05-25-cto-proposal-rule-type-core.md` at commit
`2fd2a5ca` on `staging`.

**Scope:** This spec ratifies an architectural commitment and a delivery
sequence for the rule core, not an implementation. The commitment is that rules
are a domain concept with their own invariants, lifecycle, and evaluation
semantics; the delivery sequence is this spec plus three
substrate-and-implementation rings downstream. The spec commits to interface;
substrate and behavior are deferred to downstream ADRs per the
substrate-now-enforcement-later precedent established by ADR-0014, ADR-0017, and
ADR-0019.

**Revision history**

- **V1** — initial draft.
- **V2** — incorporated two rounds of review. Surfaced a four-item drift between
  ADR-0017's text and the live `vendor_rules` schema and reframed the relevant
  sections (§3). Tightened conflict-resolution determinism, lifecycle/rung axis
  separation, action cardinality, the closed condition library. Added the Rule
  Validity Invariants. Adopted the three-state match taxonomy (primary /
  guardrail / almost). Committed to class-table inheritance for the Registry.
  Softened external-reference language asymmetrically (Asana as cited precedent;
  "Claude-Code-shaped" demoted to a provenance mention).
- **V2.1** — precision patch over V2; no architectural changes. Three
  load-bearing clarifications: promotion changes *authority* not *logic*; one
  source of truth for cross-cutting metadata; rule logic is *immutable*
  (retire-and-create-new for amendments). Seven precision improvements.
- **V3 (this, consolidated)** — merges V2 + V2.1 into one coherent document.
  **One disk-grounded correction to V2.1 Patch 9:** V2.1 asserted `needs_review`
  is the canonical mutation-lifecycle state and "Needs Attention" is UI-only.
  Verification against `mutation_lifecycle.md` shows the reverse — "Needs
  Attention" is the canonical mutation state (the token `needs_review` does not
  appear there; it belongs to the document-case lifecycle per ADR-0011/0016/
  0018). V3 reverses the mapping: "Needs Attention" is canonical for
  ProposedMutations; `needs_review` is reserved for document-case contexts and
  is not used in this proposal.
- **V3.1** — final precision patch over V3; no architectural changes. Adds the
  missing `auto_post_at_rung_2 × silent_auto` capping row (§6.1). Restructures §6.1
  so conflict resolution tiebreaks on candidate *effective* action rather than max
  action, and separates the **pure rule core** (rule logic → MatchResult) from the
  **Agent Ladder gate** (authority decision → effective action) in a new §6.1.1 —
  closing the gap between §6.1 and §5.6's effective-action safety story (the most
  consequential change). `effective_action` is no longer a MatchResult field
  (§5.7); the gate computes it. Adds `applies_to_source_triggers` to Branch (§5.2)
  and rewrites §11.3 honestly to show the scheduled-source Spotify Rule with a peer
  drag-drop Rule. Reserves true empty-condition `otherwise` post-v1 (§5.2) to
  remove a foot-gun. Clarifies `name` is mutable display metadata with audit-event
  and snapshot semantics (§5.1, §8.5). Rewrites the §5.6 System ceiling bullet to
  match §6.2/§6.3's short-circuit semantics. Tightens §10 Ring 1 to default to
  `rule_track_records.clean_approval_count`. Adds an explicit §5.6 note on which
  actions are rung-capped. Surfaces Q-RTC-12. **Note:** the accompanying diagrams
  (call chain, rule structure, four-stage delivery) require coordinated updates to
  reflect the pure-core-vs-Agent-Ladder-gate separation introduced by this patch;
  diagrams are rendered separately and updated alongside V3.1 before the CTO packet
  ships.
- **V3.2** — pre-CTO-review precision pass over V3.1; no architectural changes.
  Seven local fixes: separates §6.1.1's step numbering against
  `agent_autonomy_model.md` §7 (canonical decision-tree steps 3–5 are gate
  concerns, not pure-core concerns; this proposal's local steps 2–5 are pure core,
  7–8 are gate); rewrites §5.2's `max_outcome_action` bullet to remove the residual
  "ceiling caps effective action" implication and align it with §5.6 / §6.2's
  short-circuit semantics; adds an explicit §5.2 paragraph distinguishing
  `applies_to_source_triggers` (payload-compatibility gating) from the
  `source_trigger_equals` Condition (specificity-contributing predicate); tightens
  §5.7's `also_matched_rules` ordering language to specify conservatism of
  `tiebreak_effective_action`; adds a §6.4 composition-of-inputs paragraph
  clarifying that Four Questions populate from MatchResult (Q2 / Q3) plus the gate's
  `effective_action` (Q4 outcome clause), preventing Ring 2 implementers from wiring
  the UI to MatchResult alone; corrects §14's open-question count (eleven → twelve);
  names guardrail audit events as activating with the first Ring 2A evaluator that
  supports `otherwise_if` branches, removing the v1-active ambiguity between §8.5
  and §11's worked examples.
- **Ratified** — 2026-05-26. CTO ratification of V3.2 with no requested changes.
  Document moves from
  `docs/09_briefs/post-mvp/2026-05-25-cto-proposal-rule-type-core.md` to
  `docs/02_specs/rule-type-core.md` per ADR-0021. Status flips from
  pre-ratification proposal to canonical spec; framing in §1 and §14 updated
  accordingly. Downstream Ring 1 substrate ADR drafting unblocked.

---

## 1. Why this spec exists

The Chounting architecture has the Agent Ladder gate ratified at Seam 1 of the
call chain (`agent-tool-architecture.md`), and one concrete rule materialization
specified in ADR-0017 (`vendor_rules` table, substrate-only-v1). Between these
two — the gate above and the substrate below — there is no specified domain
layer defining *what a rule is as a domain object*.

`agent_autonomy_model.md` defines what the gate *does with* rules (three rungs,
four limit dimensions, System ceiling, five-step decision tree, promotion
thresholds 15/95%/30 days). It is sparser on *what rules are* — the things that
get promoted and demoted between rungs. There are no lifecycle states, no
trigger/condition/action grammar, and no evaluation procedure specified anywhere
canonical.

The gap matters because the rule core is cross-cutting infrastructure. The
drag-drop bill workflow needs it. Bank reconciliation will need it. Recurring
transactions will need it. Categorization of novel items will need it. Without a
specified domain layer, each consuming workflow will invent its own rule
dialect, and Phase 3+ will spend significant effort reconciling six dialects.

This spec defines the domain layer.

**Dependency note.** A parallel session is drafting
`docs/02_specs/document-v2-workflow.md` covering the drag-drop bill workflow.
The workflow document will reference this spec once both are ratified. At the
time of drafting, the workflow document does not yet exist on disk; this spec
stands alone but its first concrete consumer is that workflow.

---

## 2. The load-bearing architectural commitment

**Rules are a domain concept, not a storage concept.**

This is the single sentence everything else flows from, and the one architectural
claim this spec ratifies.

Rules have **invariants** — track record is non-negative, rung transitions are a
legal state machine, predicates must be parseable, promoted rules must satisfy
the 15/95%/30 thresholds. Rules have **lifecycle** — proposed, active, demoted,
retired — with audit events at every transition. Rules have **evaluation
semantics** — given a ProposedMutation, a deterministic procedure returns a typed
MatchResult. Rules have **learning rules** — system observation of approval
patterns produces candidate rules; the threshold for proposal differs from the
threshold for promotion.

The `vendor_rules` table from ADR-0017 is one persistence of this domain concept,
specifically the per-vendor materialization for AP/Spend. Future materializations
— recurring schedules, reconciliation match rules, categorization rules — are
separate domain-specific tables, each persisting the same domain concept with
different FK structure. The orchestrator consults the rule core, not any specific
table.

This mirrors the existing discipline for accounting: `journal_entries` is a
table, but "a journal entry must balance" is not a property of the table — it's a
domain invariant enforced by `journalEntryService.post()` via `withInvariants`,
which calls pure functions in `core/`. The table stores the persistence of a
domain concept; the concept owns the rules.

**Source-tree placement** per ADR-0020 Appendix A dependency direction:

- Policy logic at `apps/web/src/agent/policies/agent-ladder/` (the empty home
  ratified per ADR-0020 Decision item 5).
- Pure evaluation functions at `apps/web/src/core/rules/` (no DB, no I/O, no
  agent imports).
- Service entry at `apps/web/src/services/agent/ruleEvaluationService.ts` (final
  naming at implementation).
- Persistence via `apps/web/src/db/repositories/`, never accessed directly from
  agent or core.

**Accurate dependency direction:** agent/orchestrator → services. Services
assemble inputs from repositories and call pure core evaluators. Core has no DB,
I/O, repository, or agent imports. The Authority Gradient is preserved without
implying core imports persistence.

---

## 3. Substrate reality check — ADR-0017 text-vs-schema divergence

This subsection is a **precondition** for the spec's substantive claims. It
exists because earlier drafts cited ADR-0017 substrate (`vendor_rule_rung`,
`clean_approval_count`) as if it were live, and disk verification surfaced that
the substrate diverges from the ratified ADR text in four places.

The live `vendor_rules` shape (from
`supabase/migrations/20240101000000_initial_schema.sql`):

```sql
CREATE TABLE vendor_rules (
  rule_id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id             uuid NOT NULL REFERENCES organizations(org_id),
  vendor_id          uuid NOT NULL REFERENCES vendors(vendor_id),
  default_account_id uuid REFERENCES chart_of_accounts(account_id),
  autonomy_tier      autonomy_tier NOT NULL DEFAULT 'always_confirm',
  created_at         timestamptz NOT NULL DEFAULT now(),
  created_by         uuid REFERENCES auth.users(id),
  approved_at        timestamptz,
  approved_by        uuid REFERENCES auth.users(id)
);
```

with `autonomy_tier` enum values `('always_confirm', 'notify_auto', 'silent')`.

**Four items in ADR-0017 text are not in the live schema:**

| ADR-0017 text specifies | Live schema |
|---|---|
| `vendor_rule_rung` enum (`always_confirm`/`notify_and_auto_post`/`silent_auto`) | enum is `autonomy_tier` (`always_confirm`/`notify_auto`/`silent`) |
| `clean_approval_count integer NOT NULL DEFAULT 0` column | column does not exist |
| `bundle_type` column (per-vendor per-bundle-type cardinality) | column does not exist; the table has per-vendor cardinality only |
| `legal_entity_id` + `(org_id, legal_entity_id, vendor_id, bundle_type)` unique constraint | column and constraint do not exist |

**Consequences for this spec:**

- The "per-vendor per-bundle-type materialization" phrasing must be read as
  ADR-0017 text *intent*, not shipped fact. This document phrases it as "the
  per-vendor materialization (with per-bundle-type cardinality reserved in
  ADR-0017 text but not yet migrated)."
- Every reference to a specific ADR-0017 substrate column name is anchored to the
  domain concept (current rung, clean approval count) and to the live column
  where one exists (`autonomy_tier`). Where the ADR-0017 column doesn't exist
  live, this document says so explicitly.
- §9.2 (shadow mode) does **not** "extend existing substrate." Shadow mode
  requires a counter that does not yet exist; Ring 1 ships the counter; Ring 2
  ships shadow mode against the now-real counter.
- **Ring 1 substrate reconciliation precondition.** Ring 1 reconciles the
  four-item drift in the same migration that establishes the rule registry
  shape. These decisions are interdependent (§5.10, §10).

**Ring 0 does not amend ADR-0017.** Ring 1 either reconciles the live schema to
ADR-0017 text or includes an explicit ADR-0017 amendment section in its decision.
The four-item drift reconciliation lives in the Ring 1 ADR regardless of which
path is chosen.

Why this is a §3 precondition rather than a §12 open question: the drift was the
most consequential issue surfaced in review. Surfacing it prominently — rather
than burying it in cross-references — is what makes the rest of the spec
honest. The architectural claim in §2 survives intact (it doesn't depend on which
substrate columns currently exist); the citation discipline tightens; the Ring 1
sequence sharpens.

---

## 4. Scope and non-scope

**In scope**

- The domain concepts the rule core comprises (Rule, RuleType, Trigger,
  Condition, Action, MatchResult, RuleLifecycle, TrackRecord, plus the Registry
  recommendation).
- The grammar Rules are expressed in (Trigger Set / Branch List with Condition
  Set and a single terminal **max** Action per Branch).
- The closed-library principle for triggers, conditions, and actions.
- Evaluation semantics including deterministic conflict resolution, effective
  action capping, and Four Questions population.
- The three-state match taxonomy (primary / guardrail / almost).
- Rule lifecycle states and transitions, on an axis separate from current rung;
  and rule-logic immutability (retire-and-create-new for amendments).
- Rule Validity Invariants, split by enforcing ring.
- The single-writer rule(s) for the rule registry and track-record tables.
- The relationship between the rule core, the Agent Ladder gate, and the System
  ceiling.
- Cross-workflow applicability via explicit Trigger declaration.
- Configuration model per-org for default initial rung and proposal
  aggressiveness; reservation of materiality posture as a future concept (not its
  definition).
- Per-org configuration substrate following the ADR-0019 reserved-column
  precedent.
- Three agent-maintained rule-system differentiators (post-hoc anomaly
  surfacing, shadow-mode execution, rule-refinement loop).
- Four-stage delivery sequence (Ring 0 spec plus three downstream rings).
- Worked examples across multiple workflows.

**Not in scope**

- The exact predicate JSON schema. Reserved for Ring 2 implementation.
- The rule-proposal threshold value. Reserved post-v1, picked by calibration
  cycle per ADR-0019.
- The UI for rule authoring and the promotion ceremony. Product surface.
- Materiality band default values, thresholds, or band definitions. Future ADR;
  this spec reserves only the concept that rule evaluation *may* later consume
  materiality posture.
- Rule logic versioning infrastructure (a `rule_version_id` field). V1 uses
  retire-and-create-new (§5.1); a future ADR may introduce versioning if
  amendments become high-frequency.
- The Agent-Orchestrated Workflow Catalog. Separate future ADR.
- The workflow-level autonomy machinery. Separate future ADR, downstream of this
  one.
- The continuous reconciliation feedback loop into rule track records. Separate
  future ADR.
- Any amendment to `agent_autonomy_model.md`, `intent_model.md`,
  `mutation_lifecycle.md`, ADR-0007, ADR-0011, ADR-0012, or ADR-0019. The
  spec inherits all of these verbatim.
- ADR-0017 amendment scope. The four-item drift reconciliation lives in the
  Ring 1 substrate ADR, not in an ADR-0017 amendment, because the Ring 1 ADR is
  also establishing the registry shape and the two decisions are interdependent.

---

## 5. Domain concepts

The rule core comprises **nine ratified concepts plus one Ring 1 registry
recommendation**. Each is defined at the level the spec ratifies;
details deferred to Ring 1 and Ring 2 implementation.

### 5.1 Rule

The domain object. Fields:

- `rule_id` — UUID, stable across lifecycle (this is the live `vendor_rules` PK).
- `name` — human-readable; rendered in the Four Questions.
- `rule_type` — discriminator: `pattern` | `temporal` | `inferential` (§5.3).
- `triggers` — set of **Evaluation** Trigger discriminators (OR'd); see §5.4.
- `branches` — ordered list of Branch objects; first-match-wins (§5.2).
- `applies_to_intent_types` — array of intent types the rule serves; derivable
  from triggers but stored explicitly for indexing.
- `lifecycle_state` — `proposed` | `active` | `demoted` | `retired` (§5.8).
  Separate axis from current rung.
- `current_rung` — `always_confirm` | `notify_and_auto_post` | `silent_auto`. The
  live schema column is `autonomy_tier` with values `always_confirm` |
  `notify_auto` | `silent`; Ring 1 reconciles the naming (§3, §10). Separate axis
  from `lifecycle_state`.
- `track_record` — denormalized fast-lookup of audit-derived counts (§5.9).
- `predecessor_rule_id` — UUID, nullable. If non-null, points at the previous
  `rule_id` this Rule succeeds (set when a Rule is created as the successor of a
  retired Rule whose logic was amended).
- `successor_rule_id` — UUID, nullable. Set on a retired Rule when its successor
  is created. Bidirectional reference for audit and learner reasoning.
- `audit_anchors` — `created_by`/`at`, `promoted_by`/`at`, `demoted_by`/`at`,
  `retired_by`/`at`.
- `org_id`, `legal_entity_id` — per ADR-0011 §10 multi-entity reservation.
  `legal_entity_id` is one of the four ADR-0017 drift items reconciled at Ring 1.

A Rule is the unit of promotion, demotion, evaluation, and audit. It is a
persisted artifact addressable by `rule_id`.

**Rule logic immutability.** The following fields **cannot** be mutated in place
after a Rule enters `lifecycle_state = active`: `triggers`, `branches`
(including all Conditions and `max_outcome_action` per branch),
`applies_to_intent_types`, `rule_type`. The following fields **may** be mutated:
`lifecycle_state`, `current_rung`, `track_record` (via the track-record service),
`audit_anchors`, and `name` (mutable display metadata). Renaming a Rule emits the
audit event `rule_metadata_updated`; historical Logic Receipts store a
`rule_name_snapshot` so past Four Questions renderings remain reproducible.
Logic-bearing fields (`triggers`, `branches`, `applies_to_intent_types`,
`rule_type`) remain immutable per the rule above.

To amend a Rule's logic, the operation is **retire-and-create-new**:

1. The Rule being amended transitions to `lifecycle_state = retired` with
   `successor_rule_id` set.
2. A new Rule is created with `predecessor_rule_id` set, `lifecycle_state =
   active`, `current_rung = always_confirm` (the successor restarts at the most
   conservative rung), and the amended logic.
3. The successor's TrackRecord starts fresh. The promotion ceremony evaluates the
   successor independently. The original Rule's track record remains intact for
   audit but does not transfer.

This applies to all logic changes — controller-authored, system-proposed via the
Ring 3 refinement loop, or any future amendment ceremony. There is no in-place
edit of Branches, Conditions, or Actions.

*Rationale:* every historical MatchResult points at a `rule_id` whose logic is
guaranteed by this rule to be the logic that fired. Audit reproducibility holds
without a separate `rule_version_id` field.

### 5.2 Branch

The decision logic within a Rule. Each Branch has:

- `branch_order` — integer; branches evaluate in order, first-match-wins.
- `branch_type` — `primary` | `otherwise_if` | `otherwise`.
- `conditions` — **ordered** list of Condition objects, AND'd within the branch.
  Order is significant for diagnostic determinism (§5.7).
- `max_outcome_action` — exactly one terminal Action from the closed library
  (§5.6), expressing the **maximum permitted** outcome for this branch. The
  *effective* runtime action is computed downstream by the Agent Ladder gate
  (§6.1 steps 7–8, §6.1.1) from `current_rung`, per-transaction limits, daily
  aggregate limits, and track-record health. System ceilings are checked
  upstream before rule evaluation and short-circuit the rule core entirely
  (§6.2); the ceiling does not cap effective actions, it prevents them from
  being computed.
- `applies_to_evaluation_triggers` — optional. When a Rule declares multiple
  Evaluation Triggers, a Branch may restrict itself to a subset; Branches whose
  `applies_to_evaluation_triggers` excludes the current event are skipped during
  evaluation. This preserves the trigger-payload-compatibility invariant (§7).
- `applies_to_source_triggers` — optional. When a Branch's Conditions reference
  fields present only on certain Proposal-Source Triggers (e.g., `scheduled_date`
  is present only when `source_trigger = scheduled_time_occurs`), the Branch may
  restrict itself to those sources. Branches whose `applies_to_source_triggers`
  excludes the current proposal's `source_trigger` are skipped during evaluation.
  This preserves the trigger-payload-compatibility invariant (§7) for Rules whose
  branches differ by source.
- `annotations` — optional, non-authoritative metadata consumed by the
  orchestrator for side-effect hints (e.g., "tag for the reconciliation lens").
  Annotations cannot alter the autonomy outcome.

**`applies_to_source_triggers` vs `source_trigger_equals` Condition (§5.5):**
Use `applies_to_source_triggers` for payload-compatibility gating — it decides
whether the Branch is *eligible* to evaluate at all. Branches whose
`applies_to_source_triggers` excludes the current proposal's `source_trigger`
are skipped before any Condition is evaluated. Use `source_trigger_equals` when
the proposal source is part of the logical predicate and should contribute to
specificity and to the explanation surfaced in the Four Questions. The two are
not redundant: the first is a structural guard preventing
field-not-present-on-payload errors; the second is a Condition with specificity
weight participating in conflict resolution.

**Branch types:**

- `primary` — the happy-path Branch. **Required**; a Rule has exactly one.
- `otherwise_if` — alternative branches with their own Conditions; zero or more
  allowed. Evaluated in `branch_order` after the primary. Guardrail behavior
  (§5.7) is produced by `otherwise_if` branches.
- `otherwise` — **reserved post-v1.** A true empty-condition catch-all that always
  matches if reached is a foot-gun: a Rule with a broad Evaluation Trigger like
  `proposed_mutation_generated` and an empty `otherwise` would guardrail-match far
  more proposals than intended. A future ADR will define `otherwise` semantics once
  a `rule_scope` field (or equivalent bounded-scope mechanism) exists in the
  substrate. **In v1, only `primary` and `otherwise_if` branches are valid.**

In v1, a Rule produces an `almost_match` whenever its Trigger fires but no Branch's
Conditions pass — i.e., neither the `primary` nor any `otherwise_if` matched. This
is correct fiduciary behavior: the proposal goes to default approval rather than
being routed by an unbounded catch-all. Rules produce `guardrail_match` outcomes
only via `otherwise_if` branches.

**Branch action cardinality is exactly one terminal outcome.** A branch cannot
have both `auto_post_at_rung_2` and `route_to_exception_queue_with_reason`. Side
effects (notifications, tags, audit-trail hints) live in `annotations`.

The structure is borrowed from the WHEN / CHECK-IF / DO grammar that
workflow-automation systems like Asana have converged on, bounded for Chounting's
fiduciary domain. The convergent precedent does real de-risking work: the grammar
has been pressure-tested at scale in adjacent domains. Chounting bounds it more
narrowly because the cost of being wrong is higher.

### 5.3 RuleType

The discriminator for predicate evaluation semantics. Three values, closed enum
per ADR-0010 reserved-enum-states discipline:

- `pattern` — typed field comparisons (equality, range, set membership). Pure
  deterministic evaluation, no model in the loop. Reproducible byte-for-byte.
- `temporal` — schedule semantics (next occurrence, cadence window).
  Deterministic given a system clock; reproducibility includes the evaluation
  timestamp.
- `inferential` — consumes model outputs (semantic similarity scores,
  classification confidences). Confidence is internal-only per ADR-0002;
  reproducibility requires `pipeline_trace` per ADR-0007 Q30 (model version,
  input features hash, output hash).

Each RuleType has its own predicate evaluator (Ring 2 deliverable). All three
share the same Rule shape; they differ in how their Conditions evaluate.

### 5.4 Trigger

The event class that activates rule evaluation. Triggers come in two roles.

**Evaluation Triggers** (the events rule evaluation runs *against*):

- `proposed_mutation_generated` — a ProposedMutation is produced. The canonical
  evaluation trigger; the vast majority of rule evaluation runs here.
- `proposed_mutation_bundle_generated` — a ProposedMutationBundle is produced.
  Rule evaluation runs against the bundle envelope and each child per §6.5.

**Proposal-Source Triggers** (the events that *cause* a ProposedMutation to be
created upstream; available as filters on Conditions):

- `scheduled_time_occurs` — a temporal schedule fires. The scheduler emits this;
  the orchestrator transforms it into a ProposedMutation with `source_trigger =
  scheduled_time_occurs`; rule evaluation runs **once** on the resulting
  `proposed_mutation_generated`.
- `external_event_ingested` — an event from outside Chounting (bank statement
  line, payment confirmation, vendor statement). Same shape: external event →
  orchestrator generates ProposedMutation with `source_trigger =
  external_event_ingested` → evaluation runs on `proposed_mutation_generated`.
- `user_drag_drop`, `user_form_submit`, `user_palette_action`, `agent_proposal`
  — for completeness; these also flow through `proposed_mutation_generated` with
  their respective `source_trigger` values.

**Rule Triggers match Evaluation Triggers only.** A Rule's Trigger Set contains
only Evaluation Triggers. To filter on source — e.g., a Rule that fires only for
scheduler-originated proposals — the Rule uses a `source_trigger_equals`
Condition (§5.5). This eliminates double evaluation: the scheduler doesn't
trigger rule evaluation directly; it triggers proposal generation, which then
triggers evaluation exactly once.

The Trigger Set is OR'd: any matching Evaluation Trigger activates evaluation of
the Rule's Branches. Triggers are also the index Chounting uses to avoid
evaluating every Rule against every event. Closed enum; extends via ADR
amendment.

### 5.5 Condition

The closed library of typed predicates within a Branch. v1 active set:

**Pattern conditions** (apply to all RuleTypes; most natural for `pattern`):

- `field_equals` — typed comparison against a closed value set.
- `field_in_range` — numeric or temporal range with inclusive bounds.
- `field_outside_range` — explicit complement of `field_in_range`; in the closed
  library because guardrail branches need it (Spotify-$1,399 example, §11.2).
- `field_in_set` — set membership.
- `field_matches_pattern` — typed string pattern (vendor names, descriptions);
  limited to closed regex shapes.
- `source_trigger_equals` — filters on the upstream `source_trigger` field
  carried by the ProposedMutation. Closed value set (the Proposal-Source Trigger
  enum). Used by Rules that should fire only for proposals from a specific source.

**Temporal conditions** (most natural for `temporal`):

- `schedule_matches` — current evaluation time within ±N units of a stored
  schedule's next occurrence.
- `cadence_matches` — observed cadence (monthly, quarterly, etc.) matches
  expected.

**Inferential conditions** (only for `inferential`):

- `semantic_match_above_threshold` — model output ≥ a stored per-rule threshold;
  calibration governance per ADR-0019.
- `category_classification_matches` — categorization model output equals a stored
  category.

Each Condition has a **deterministic specificity weight** defined in the
condition library, contributing to specificity-based conflict resolution (§6.1
step 4a). Closed-set conditions (`field_equals`, `field_in_set`,
`category_classification_matches`, `source_trigger_equals`) weight higher than
range/threshold conditions (`field_in_range`, `field_outside_range`,
`semantic_match_above_threshold`), which weight higher than pattern-match
conditions (`field_matches_pattern`). The exact weight table is owned by Ring 2;
the ordering is fixed at Ring 0. There is no "if needed" discretion — the weight
table is total.

Conditions compose with AND within a Branch. New Condition types require ADR
amendment.

### 5.6 Action

The closed library of terminal autonomy outcomes within a Branch. v1 active set:

- `auto_post_at_rung_2` — auto-post via Notify & Auto-Post; 24-hour reversible
  window per `agent_autonomy_model.md` §4.
- `auto_post_at_rung_3` — auto-post via Silent Auto; only available if the Rule's
  promotion authority was owner per `agent_autonomy_model.md` §4.1.
- `suggest_with_required_approval` — populate the proposal's recommended fields
  (account, category) but route to human approval.
- `route_to_exception_queue_with_reason` — route the ProposedMutation to the
  **Needs Attention** lifecycle state with a typed reason. (Per
  `mutation_lifecycle.md`, "Needs Attention" is the canonical mutation state for
  review-required proposals; `needs_review` is a document-case state and is not
  used for mutations. Whether an "exception queue" is a distinct UI surface from
  the Needs Attention lane is a product-surface question, not a new lifecycle
  state.)
- `block_with_reason` — categorically block with a typed reason for **non-ceiling
  rule-domain blocks only**. System ceiling classes are never implemented as Rule
  Actions; they are handled before rule evaluation (§6.2).

Five actions. Closed. Extension requires ADR amendment.

**Max outcome vs. effective outcome.** The five Actions are *max outcomes* — the
most permissive autonomy a Branch may produce when its Conditions match. The
`max_outcome_action` is owned by the Branch (pure rule core). The *effective*
outcome is owned by the **Agent Ladder gate** (the service/orchestrator layer,
§6.1 steps 7–8 and §6.1.1), which caps the max by the live authority state. The
capping table (§6.1 step 3) belongs to the gate's specification; the pure core
references it only to compute a tiebreak value during conflict resolution. The
effective outcome is capped by:

- `current_rung` — a Branch with `max_outcome_action = auto_post_at_rung_2`
  evaluated against a Rule at `current_rung = always_confirm` yields an effective
  action of `suggest_with_required_approval` (the proposal is populated; the
  autonomy is capped to approval). This is §7 Step 2 (rung check).
- **Per-transaction limits, daily aggregate limits, track-record health** —
  applied at Steps 3–5 of the decision tree in `agent_autonomy_model.md` §7; can
  further cap.
- **System ceiling** — checked upstream at Step 1 of `agent_autonomy_model.md`
  §7's decision tree, **before** rule evaluation. If a ceiling fires, no
  MatchResult is produced and the rule core is not invoked. As a defensive guard
  only, `ruleEvaluationService` returns `EvaluationSkipped(reason =
  system_ceiling_class)` if called with a ceiling-class proposal (reversals are one
  such class — §6.3). The ceiling does not *cap* effective actions; it
  short-circuits evaluation entirely.

**Note on which actions are subject to rung-capping.** Only `auto_post_at_rung_*`
actions are subject to rung-based capping. `suggest_with_required_approval`,
`route_to_exception_queue_with_reason`, and `block_with_reason` already represent
conservative outcomes and pass through the capping table unchanged regardless of
`current_rung` (the "any" rows in the §6.1 table). This is why worked examples like
§11.2 need no parenthetical caveat about routing actions.

The Branch's `max_outcome_action` describes what the rule is ultimately *allowed*
to do once promoted. The Rule's `current_rung` describes what the rule is
*currently authorized* to do. **Promotion mutates authority; it never rewrites
Branch logic.**

External-service actions (Slack notification, email send) are lifecycle side
effects handled by the orchestrator and audit emission, not Rule Actions. The
narrowness of the action library is the safety property and the differentiator
from permissive automation systems; every Action has a clean audit story and a
defined relationship to the Agent Ladder.

### 5.7 MatchResult

The typed output of evaluation. Returned by
`ruleEvaluationService.evaluate(proposal)` to the orchestrator.

Fields:

- `winning_rule_id` — the Rule that won conflict resolution, or `null` if no
  Rule's primary or guardrail branch matched.
- `winning_branch` — the Branch within the winning Rule that matched.
- `winning_branch_type` — `primary` | `guardrail`. Drives track-record dynamics
  (§5.9).
- `winning_branch_max_action` — the `max_outcome_action` the winning Branch
  dictates (what the rule logic *permitted*). MatchResult does **not** carry a
  final `effective_action`: that is computed downstream by the Agent Ladder gate
  (§6.1 steps 7–8, §6.1.1) from `current_rung` + limits + track-record health, and
  is recorded on the Logic Receipt — not on the pure core's MatchResult. (The
  rule-core append of the Logic Receipt landed as `rule_evaluation_log` /
  INV-RULE-001 per ADR-0024; INV-AGENT-002 — the broader cross-agent Logic
  Receipt write path — remains reserved, per ADR-0025 §8.)
- `match_classification` — one of the three states below.
- `also_matched_rules` — Rules that matched but lost on conflict resolution.
  Ordered by the full conflict-resolution ordering: specificity descending, then
  conservatism of `tiebreak_effective_action` descending (per §6.1 step 4b), then
  recency descending, then stable UUID.
- `almost_match_rules` — Rules whose Trigger matched but no Branch matched. Each
  entry carries `rule_id`; `closest_branch_id` (the Branch with the most
  Conditions that passed; deterministic tiebreak: lowest `branch_order` wins);
  and `failed_conditions` (ordered list of Conditions in `closest_branch` that
  did not pass, in their `condition_order`, first failure first). All diagnostic
  fields are deterministic — the same inputs produce the same ordering on every
  evaluation.
- `track_record_snapshot` — denormalized counts for the winning rule.
- `four_questions_population` — structured fields the UI templates render into the
  Four Questions grammar (§6.4).
- `evaluation_trace` — typed audit record (Triggers fired, Rules evaluated,
  Branches considered, conflict-resolution decision, tiebreak-capping applied).
  Routes to the Logic Receipt (note: the rule-core append landed as
  `rule_evaluation_log` / INV-RULE-001 per ADR-0024; the broader cross-agent
  INV-AGENT-002 Logic Receipt write path remains reserved-but-not-yet-registered,
  landing when its consuming service materializes per `agent_autonomy_model.md`
  §10 — reconciled here per ADR-0025 §8).

**Three-state match taxonomy:**

- `primary_match` — the winning Rule's primary branch matched. Normal rule
  outcome. Contributes to the Rule's **primary** track record (§5.9).
- `guardrail_match` — the winning Rule's `otherwise_if` branch matched (the
  primary did not, but a guardrail did). (`otherwise` is reserved post-v1, §5.2.)
  The Rule recognized the shape but routed conservatively. Contributes to the
  Rule's **guardrail** track record, distinct from the primary. A guardrail firing
  is neutral for the primary's approval-rate denominator — the rule did what it was
  supposed to do for out-of-bounds cases.
- `almost_match` — at least one Rule's Trigger fired but no Branch's Conditions
  passed (in v1, neither the `primary` nor any `otherwise_if` matched). The Rule
  did not fire; the proposal goes to its default path (typically approval as novel
  pattern). The almost-match information is informational for the user and
  structural for the learner.

The three-state taxonomy is a **deliberate vocabulary expansion**. The cost is one
more term users, controllers, auditors, and contributors must learn. The benefit:
a cleaner audit trail (guardrail firings distinguished from primary firings);
better UI language ("the Spotify rule recognized this transaction but routed it to
review because the amount was outside the expected range" beats "no rule
matched"); better learner signals (guardrail firings suggest the primary branch
may need adjustment; almost-match firings suggest a new rule or branch); and
better track-record dynamics (guardrail firings don't punish the primary rule for
doing the right defensive thing).

### 5.8 RuleLifecycle

The state machine for a Rule's life. **Lifecycle state is on an axis separate from
current rung.** Promotion and demotion change the rung; lifecycle state captures
the rule's overall position in its life arc.

States:

- `proposed` — system-observed pattern; controller has not yet accepted. May
  enter `active` on acceptance, or `retired` on rejection.
- `active` — live and participating in evaluation at its `current_rung`.
- `demoted` — demoted from a higher rung back to `always_confirm` per
  `agent_autonomy_model.md` §4.3. **Live-but-conservative**, not retired.
  Re-promotion transitions back to `active` via the normal ceremony.
- `retired` — no longer participates in evaluation. Terminal.

Transitions:

```
(none)            → proposed         [system observation creates]
(none)            → active           [controller authors directly]
proposed          → active           [controller accepts]
proposed          → retired          [controller rejects; audit: rule_proposal_rejected]
active@rung_N     → active@rung_M     [promotion ceremony; current_rung mutates, logic unchanged]
active@rung_N     → demoted           [demotion §4.3; current_rung → always_confirm, logic unchanged]
demoted           → active@rung_M     [re-promotion ceremony; current_rung mutates, logic unchanged]
active            → retired           [controller explicitly retires; OR logic amendment via retire-and-create-new]
demoted           → retired           [controller explicitly retires; OR logic amendment via retire-and-create-new]
```

When `retired` is reached via logic amendment, the successor Rule's
`predecessor_rule_id` is set and the retired Rule's `successor_rule_id` is set in
the same transaction.

**Axis separation in plain English:**

- Promotion changes `current_rung`. `lifecycle_state` stays `active`.
- Demotion changes `current_rung` to `always_confirm` AND sets `lifecycle_state`
  to `demoted`.
- Re-promotion sets `lifecycle_state` to `active` and updates `current_rung`.
- Retirement sets `lifecycle_state` to `retired`; `current_rung` no longer
  evaluated.

Every transition produces an audit event through the canonical audit-log writer
per ADR-0011 §1 (event vocabulary in §8.5).

### 5.9 TrackRecord

The per-Rule audit-derived history that drives promotion eligibility, demotion
triggers, and the Four Questions question 3.

The audit log is the canonical source of truth per ADR-0011 §1; the TrackRecord's
denormalized counts are fast-lookup mirrors. Per the four-item drift (§3) the
counter columns do not yet exist on disk; they ship at Ring 1, and post-Ring-1
enforcement reads from the audit corpus and writes back.

**Primary track record** (drives promotion eligibility):

- `clean_approval_count` — count of times the primary Branch fired and the
  resulting proposal was approved (or auto-posted and not reversed within the
  window).
- `rejection_count` — count of times the primary's proposal was rejected or
  reversed.
- `recent_outcomes` — last 10 primary outcomes for the demotion-trigger check per
  `agent_autonomy_model.md` §7.
- `last_clean_approval_at`, `last_rejection_at` — audit anchors.
- `promotion_eligible` — derived: ≥15 primary matches AND ≥95% approval rate AND
  30-day window satisfied.

**Guardrail track record** (drives guardrail branch tuning, not primary
promotion):

- `guardrail_fire_count` — count of times any guardrail (`otherwise_if`) branch
  fired. (`otherwise` is reserved post-v1, §5.2.)
- `guardrail_confirmed_count` — count of guardrail firings where the controller's
  disposition confirmed the primary should *not* have auto-posted. Includes:
  (a) rejection of the proposal, (b) approval as a documented exception,
  (c) approval with edits that remain outside the primary branch's Condition
  bounds.
- `guardrail_resolved_into_primary_bounds_count` — count of guardrail firings
  where the controller's edits moved the proposal back *inside* the primary
  branch's bounds. May indicate (a) the guardrail's Conditions are too tight and
  the primary's bounds should expand, (b) upstream extraction error producing
  out-of-bounds data the controller corrected, or (c) a legitimate one-off
  correction. **Signal, not judgment** — the Ring 3 learner classifies the cause
  before proposing a refinement.
- `last_guardrail_fire_at` — audit anchor.

The guardrail counters measure something different from the primary counters. A
guardrail firing followed by controller confirmation is *good* for the guardrail.
A guardrail firing resolved back inside primary bounds is *informational* about
calibration. The counters expose this dynamic so guardrail branches are
improvable rather than invisible.

For `inferential` Rules, TrackRecord additionally exposes `model_version` so
promotion can be conditional on the model that produced the matches (a model
update could invalidate accumulated TrackRecord).

### 5.10 RuleRegistry (Ring 1 recommendation)

Ring 0 ratifies the **cross-rule addressing interface**. Ring 1 ratifies the
**substrate shape**. The two are deliberately decoupled: Ring 0 says "there must
be a way to address every Rule uniformly regardless of materialization"; Ring 1
picks the substrate that delivers that addressing.

**Recommended substrate shape: class-table inheritance.**

A `rule_registry` table holds the cross-cutting Rule metadata. Domain-specific
Rule tables (`vendor_rules`, future `recurring_schedule_rules`, future
`reconciliation_match_rules`) hold the type-specific FK structure and Branch /
Condition / Action details. Each domain-specific table has a `rule_id` column
that is **both its PK and a 1:1 FK to `rule_registry.id`**.

The recommendation rests on three load-bearing facts:

1. **The live `vendor_rules` PK is already `rule_id`.** From the initial-schema
   migration: `CREATE TABLE vendor_rules ( rule_id uuid PRIMARY KEY DEFAULT
   gen_random_uuid(), ... )`. The schema author already conceived vendor_rules
   identity as a rule id. Class-table inheritance is the path of least resistance
   against the actual schema: `rule_registry.id ← vendor_rules.rule_id` is a
   natural 1:1 FK using the column that already exists with the right name.
2. **DB-enforced referential integrity.** A 1:1 FK gives standard Postgres FK
   enforcement: a `vendor_rules` row cannot exist without a `rule_registry` row,
   and the cascade behavior on retirement is well-defined. This matters because
   the rule core sits in fiduciary territory; the safety property is "the registry
   and the domain table cannot drift."
3. **Ontology fit.** `vendor_rules` *is-a* rule. Rules across materializations
   share substantial structure (lifecycle, rung, triggers, audit anchors) and
   differ only in domain-specific FK detail — exactly the shape class-table
   inheritance was designed for.

**Source of truth under class-table inheritance.** If Ring 1 ships
`rule_registry`, the source-of-truth allocation is:

- `rule_registry` owns: identity (`id = rule_id`), `name`, `rule_type`,
  `lifecycle_state`, `current_rung`, `triggers`, `applies_to_intent_types`,
  audit anchors, and `predecessor_rule_id` / `successor_rule_id`.
- `rule_track_records` (new table, keyed by `rule_id`) owns: the denormalized
  TrackRecord counters — `clean_approval_count`, `rejection_count`,
  `guardrail_fire_count`, `guardrail_confirmed_count`,
  `guardrail_resolved_into_primary_bounds_count`, `last_clean_approval_at`,
  `last_rejection_at`, `last_guardrail_fire_at`, and (for inferential)
  `model_version`.
- `vendor_rules` owns: vendor-specific scope only — `vendor_id`,
  `default_account_id`, `bundle_type` (ADR-0017 reconciliation),
  `legal_entity_id` (ADR-0017 reconciliation), and the `(org_id, legal_entity_id,
  vendor_id, bundle_type)` unique constraint. The existing `autonomy_tier` column
  is migrated into `rule_registry.current_rung` at Ring 1 and then dropped,
  deprecated, or retained as a generated column with `rule_registry` as source of
  truth.

This keeps class-table inheritance clean: identity and cross-cutting metadata flow
through the registry; counters live in their own table to avoid bloating the
registry row on every approval; materialization tables hold only their
domain-specific FKs.

**One writer per table:** `ruleRegistryService` writes `rule_registry`;
`ruleTrackRecordService` writes `rule_track_records`; `vendorRuleService` writes
`vendor_rules` (per ADR-0017 §2, unchanged). The three single-writer rules are
disjoint by table; the rule core orchestrates calls through
`ruleEvaluationService` and `rulePromotionService`.

**Considered and rejected: polymorphic spine.** An alternative would mirror
`source_document_links` (ADR-0016): a `rule_registry` row carries a
`backing_table` enum + `backing_row_id`, with service-layer integrity (via a
`RULE_BACKING_TABLE_MAP` analogous to `LINKED_ENTITY_TABLE_MAP`) and no DB-level
FK to the backing rows. Rejected because:

- **Integrity cost.** `source_document_links.linked_entity_id` carries no DB
  foreign key — the Relationships block in `db/types.ts` shows FKs only to
  `source_document_id`. Integrity is service-only via `LINKED_ENTITY_TABLE_MAP`.
  That's an acceptable trade for document links because they point at genuinely
  heterogeneous entities (bills, payments, vendors, journal entries). Rules don't
  have that heterogeneity; the integrity weakness would be imported without the
  justification that earns it.
- **Schema fit.** `vendor_rules.rule_id` is already the PK. The polymorphic spine
  would add `backing_table` + `backing_row_id` to `rule_registry`, orphaning
  `vendor_rules.rule_id` as an internal identifier disconnected from the
  registry's primary identifier.
- **Pattern-copy reason.** Copy a pattern for its reason, not its shape.
  `source_document_links` is polymorphic because documents associate with
  heterogeneous entities. Rules across materializations are not heterogeneous in
  the same way.

**What Ring 0 ratifies:** the cross-rule addressing interface — there must exist a
way for `ruleEvaluationService` to address every Rule uniformly regardless of
materialization, supporting the registry's cross-cutting metadata.

**What Ring 1 ratifies:** the substrate. The Ring 1 ADR either (a) ships
`rule_registry` with class-table inheritance against `vendor_rules.rule_id`,
reconciling the four-item ADR-0017 drift in the same migration, or (b) defers the
registry until the second backing rule table exists (deferral interim path
below). Path (a) is the recommendation; path (b) is the alternative Ring 1 may
choose if the second materialization is far enough off that the registry would
ship empty.

**Deferral interim path.** If Ring 1 defers `rule_registry`, `vendorRuleService`
must still expose the canonical Rule interface to `ruleEvaluationService`, and any
required cross-cutting metadata for v1 must either live on `vendor_rules`
temporarily or be synthesized by the repository adapter. **Deferral of the
physical table does not defer the domain interface.** The interim path explicitly
defers source-of-truth consolidation; if chosen, the second-materialization ADR
is the natural home for the registry/track-record split.

---

## 6. Evaluation semantics

### 6.1 The evaluation procedure

Given an event (a ProposedMutation generated, a ProposedMutationBundle generated,
a scheduled time arriving, an external event ingested — the latter two arriving
through `proposed_mutation_generated` per §5.4):

1. **Trigger index lookup** *(service layer — `ruleEvaluationService`)*. Find all
   Rules whose Trigger Set includes an Evaluation Trigger matching this event
   class, and assemble their Rule rows and audit-derived TrackRecord snapshots as
   inputs for the pure core.
2. **Per-Rule branch evaluation** *(pure core)*. For each candidate Rule, walk its
   Branch List in `branch_order`. Skip Branches whose
   `applies_to_evaluation_triggers` or `applies_to_source_triggers` excludes the
   current event. For each remaining Branch, evaluate all Conditions (AND'd) in
   `condition_order`. First Branch where all Conditions pass becomes the Rule's
   matched Branch. If no Branch matches, the Rule does not fire and goes into
   `almost_match_rules` with the closest Branch and the first failing Condition. A
   matched `primary` Branch produces a `primary_match` candidate; a matched
   `otherwise_if` Branch produces a `guardrail_match` candidate.
3. **Tiebreak-only candidate effective-action computation** *(pure core)*. For
   tiebreaker purposes within conflict resolution **only**, compute a
   `tiebreak_effective_action` for each matched candidate by capping the matched
   Branch's `max_outcome_action` by that candidate Rule's `current_rung` using the
   capping table below. This is **not** the authoritative effective action — it
   exists only so the conservatism tiebreaker in step 4b operates on the
   runtime-meaningful outcome rather than the theoretical max. The System ceiling,
   per-transaction, daily-aggregate, and track-record-health checks are **not**
   applied here; they happen upstream (ceiling, §6.2) and downstream (gate, steps
   7–8) of the pure core.

   | `max_outcome_action` | `current_rung` | capped action |
   |---|---|---|
   | `auto_post_at_rung_3` | `silent_auto` | `auto_post_at_rung_3` |
   | `auto_post_at_rung_3` | `notify_and_auto_post` | `auto_post_at_rung_2` |
   | `auto_post_at_rung_3` | `always_confirm` | `suggest_with_required_approval` |
   | `auto_post_at_rung_2` | `silent_auto` | `auto_post_at_rung_2` |
   | `auto_post_at_rung_2` | `notify_and_auto_post` | `auto_post_at_rung_2` |
   | `auto_post_at_rung_2` | `always_confirm` | `suggest_with_required_approval` |
   | `suggest_with_required_approval` | any | `suggest_with_required_approval` |
   | `route_to_exception_queue_with_reason` | any | `route_to_exception_queue_with_reason` |
   | `block_with_reason` | any | `block_with_reason` |

   (`max` means max: a Branch's `max_outcome_action` is never *elevated* by a higher
   `current_rung` — see the `auto_post_at_rung_2 × silent_auto` row. Only
   `auto_post_at_rung_*` actions are rung-capped; the three conservative actions
   pass through unchanged, §5.6.)
4. **Conflict resolution across Rules** *(pure core)*. From the matched candidates,
   select the winner via a fully deterministic, total ordering:
   - **(4a) Most specific predicate wins.** Specificity is the sum of deterministic
     specificity weights for the matched Branch's Conditions (§5.5). No "if needed"
     tiebreaker; the weight table is fixed at Ring 2 ratification.
   - **(4b) Tied specificity → most conservative `tiebreak_effective_action`
     wins.** Conservatism ordering: `block_with_reason` >
     `route_to_exception_queue_with_reason` > `suggest_with_required_approval` >
     `auto_post_at_rung_2` > `auto_post_at_rung_3`. (Tiebreaking only; promotion is
     governed by `agent_autonomy_model.md` §4.) Tiebreaking on the *effective*
     action rather than the theoretical max ensures the runtime-more-conservative
     rule wins — a rule with a high max but conservative `current_rung` must not
     lose to a rule with a lower max but a more permissive rung. Fiduciary systems
     break ties toward conservatism, not recency.
   - **(4c) Tied conservatism → most recently activated/promoted wins.** Recency
     reflects current understanding.
   - **(4d) Final tiebreaker → stable UUID ordering on `rule_id`.** Never reachable
     in practice but specified so the procedure is total.
5. **MatchResult assembly** *(pure core boundary)*. Build the MatchResult with
   `winning_rule_id`, `winning_branch`, `winning_branch_type`,
   `winning_branch_max_action`, `also_matched_rules`, `almost_match_rules`, the
   `track_record_snapshot`, `four_questions_population`, and `evaluation_trace`.
   **MatchResult does not contain a final `effective_action`** — that is computed
   downstream by the gate layer (steps 7–8). The MatchResult is the pure core's
   output.
6. **Pure core returns.** The service layer hands the MatchResult to the
   orchestrator.
7. **Effective-action gate** *(service/orchestrator layer — the Agent Ladder
   gate)*. The orchestrator applies the gate checks in the order of
   `agent_autonomy_model.md` §7's decision tree (the System ceiling having already
   been checked at §7 Step 1, upstream per §6.2):
   - Cap `winning_branch_max_action` (the matched Branch's `max_outcome_action` —
     the capping table's input column) by `current_rung` via the table (§7 Step 2,
     rung check).
   - Apply the per-transaction limit check (§7 Step 3).
   - Apply the per-day aggregate check (§7 Step 4).
   - Apply the track-record health check (§7 Step 5; recent rejection patterns may
     demote in flight).
   - Produce the final `effective_action`.
8. **Orchestrator dispatches** per the final `effective_action` to commit /
   approval / exception (Needs Attention) / block.

### 6.1.1 Pure core vs. Agent Ladder gate

The procedure above spans two architectural layers. The numbering relative to
`agent_autonomy_model.md` §7's canonical decision tree:

- §7 Step 1 (System ceiling) is upstream of rule evaluation entirely (§6.2).
- §7 Step 2 (rule match) is implemented by `ruleEvaluationService` plus the pure
  rule core.
- §7 Steps 3–5 (per-transaction limit, daily aggregate, track-record health) are
  Agent Ladder gate checks applied **after** MatchResult.

The numbering relative to this spec's §6.1 local procedure:

- Local Steps 2–5 are the pure rule-core path (`core/rules/`): given indexed
  Rules and a payload, return a typed MatchResult. No DB, no I/O, no agent
  imports; deterministic and reproducible. (Local Step 1 — trigger-index lookup
  and input assembly — is the service layer feeding the pure core.)
- Local Steps 7–8 are the Agent Ladder gate (service/orchestrator layer): given
  a MatchResult and the canonical rung / limit / track-record state, compute the
  runtime `effective_action` and dispatch.

The pure core does the rule logic; the gate does the authority decision. The pure
core's MatchResult carries `winning_branch_max_action` (what the rule logic
*permitted*); the gate's `effective_action` (what the system is *currently
authorized* to do) is **not a field of the pure core's output**. This is the
architectural separation §2's load-bearing commitment depends on. Conflict
resolution's tiebreaker in step 4b uses a `tiebreak_effective_action` computed
inside the pure core for ordering candidates only — it is not propagated to the
orchestrator as the authoritative outcome. (Where exactly the gate code lives —
service vs. orchestrator — is a Ring 2 decision; this spec commits to the
separation, not to a file shape.)

### 6.2 Where the System ceiling fits

The System ceiling per `agent_autonomy_model.md` §6 is **adjacent to** the rule
core, not inside it. Ceilings fire at Step 1 of the decision tree in
`agent_autonomy_model.md` §7, **before** rule evaluation at Step 2.

The reason ceilings are not Rules:

- Ceilings are non-configurable safety rails; Rules are promotable patterns with
  track records.
- Ceiling membership is set in `agent_autonomy_model.md` §6 and extended only via
  amendment to that spec, never by promoting or demoting Rules.
- Mixing them would create paths for future contributors to argue "a ceiling is
  just a Rule with infinite track record" — false and dangerous.

The integration point: the orchestrator calls a ceiling check first (per the
existing §7 step 1), then calls `ruleEvaluationService.evaluate(proposal)` if the
ceiling did not fire. The ceiling check has its own service path
(`systemCeilingService` or named per implementation); the rule core is
downstream. This spec does not specify the ceiling check; it commits to
consuming ceiling-check results before its own evaluation runs.

### 6.3 Reversal proposals — defensive guard, not normal flow

Reversals per ADR-0001 are themselves a System ceiling class per
`agent_autonomy_model.md` §6 row 2. Under normal orchestration, reversal-class
proposals **never reach** `ruleEvaluationService` — they are routed to approval by
the ceiling check at Step 1.

As a **defensive invariant**, `ruleEvaluationService.evaluate(proposal)` rejects
reversal-class proposals if called with one: it returns `EvaluationSkipped(reason
= system_ceiling_reversal)` rather than producing a MatchResult. This is
belt-and-suspenders — the orchestrator should never call evaluate on a reversal
because the ceiling check upstream catches it, but the defensive guard makes the
rule core robust to orchestrator bugs. Ceiling semantics stay in their canonical
home (`agent_autonomy_model.md` §6) without leaking into the rule core.

### 6.4 Four Questions population

**Composition of inputs.** The final Four Questions rendering is composed from two
inputs: the MatchResult produced by the pure rule core (§6.1 step 5), and the
`effective_action` produced by the Agent Ladder gate (§6.1 steps 7–8, §6.1.1). The
MatchResult populates the rule-identity, predicate-explanation, and track-record
fields of Q2 and Q3; the gate's `effective_action` populates the outcome language
of Q4 ("auto-posted" vs. "routed to approval" vs. "routed to Needs Attention" vs.
"blocked"). Q2 and Q3 are owned by the pure core's MatchResult; Q4's outcome clause
is owned by the gate's `effective_action`. The UI templating
(`messages/{locale}.json` per `intent_model.md` §6) consumes both.

This refines `intent_model.md` §5. The grammar is unchanged; the contract for how
rule evaluation populates each question is specified.

**Q1 — What changed?** Unchanged. Populated from `ProposedMutation.delta` or
aggregated from `ProposedMutationBundle.children[*].delta`. Not affected by rule
evaluation.

**Q2 — Why?** Populated from `MatchResult.match_classification`:

- `primary_match`: "Matched: [rule.name] ([rule_type]). [Predicate description in
  human language from closed templates]."
- `guardrail_match`: "Matched: [rule.name] ([rule_type]) — guardrail branch. The
  rule recognized this transaction but routed it [to review / blocked] because
  [specific failing Condition from the primary in human language]." (e.g., "the
  amount $1,399 is outside the expected range $12.59–$15.39.")
- `almost_match`: "No matching rule. Note: [rule.name] applies to this [trigger
  context] but [specific Condition that failed] — no guardrail branch covered this
  case."
- No rule, no trigger: "Novel pattern — no rule applies."

**Q3 — Track record?** Populated from the winning rule's TrackRecord; the
denominator depends on the match classification:

- `primary_match`: "This rule has correctly handled N of M primary matches over
  the last 30 days. Promoted to [rung] on [date] by [user]."
- `guardrail_match`: "This rule's guardrail branch has fired K times in the last
  30 days; J of those were confirmed by review. The primary branch has correctly
  handled N of M matches."
- Inferential additional: "Model version: [v]."
- `almost_match`: "Rule [name]'s primary has correctly handled X of Y matches when
  it fired."
- No rule: "First time the system has seen this transaction shape."

**Q4 — What if I reject?** Mostly unchanged from `intent_model.md` §5, with
consequence language referencing the rule and the match classification:

- `primary_match`: "Rejecting will not post the entry. The [rule.name] rule will
  record a primary-branch rejection in its track record."
- `guardrail_match`: "Rejecting will not post the entry. The [rule.name] rule's
  guardrail branch fired as designed — rejecting is neutral for the rule's primary
  track record."
- `almost_match` / novel: unchanged from `intent_model.md` §5.

All populations are structured fields in `MatchResult.four_questions_population`.
The UI templates them via `messages/{locale}.json` per `intent_model.md` §6 Logic
Receipts (templated English; the agent does not write free-form). The rule core
does not write English; it writes typed fields the UI renders.

### 6.5 Bundle composition

Bundles per ADR-0012 introduce an additional consideration: a bundle has its own
justification with its own `rule_id`, and each child has its own justification
with its own `rule_id`. Both can match.

Following ADR-0012 §9's `bundle_effective_ceiling = max(child_mutation.ceiling)`,
the spec commits to: `bundle_effective_autonomy = strictest(any participating
rule's effective action)` using the conservatism ordering from §6.1 step 4b
(applied at the Agent Ladder gate, since effective action is gate-computed per
§6.1.1).

If a bundle-level rule resolves to `auto_post_at_rung_2` and a child-level rule
resolves to `suggest_with_required_approval`, the bundle goes to approval. If any
participating rule is a `guardrail_match` routing to exception, the whole bundle
routes to Needs Attention. If any participating rule is an `almost_match`, the
bundle goes to approval as a novel-shape composite.

The bundle's MatchResult is composed from per-child MatchResults plus a
bundle-level evaluation. Q2 reports the bundle-level winning rule and notes child
rules that also fired. The user sees one aggregate ProposedBundleCard per
ADR-0012 §6.

---

## 7. Rule Validity Invariants

A Rule is valid only if all the following hold. The invariants split into two
enforcement layers, honoring §10's Ring 1 substrate-only framing.

**Ring 1 enforces DB-checkable invariants** via schema constraints, FK integrity,
and check constraints:

1. **Enum closure.** `rule_type`, `lifecycle_state`, `current_rung`,
   `trigger_type`, `condition_type`, `action_type` are reserved enums per
   ADR-0010; non-enum values are rejected at the DB layer.
2. **FK integrity.** `org_id`, `legal_entity_id`, `vendor_id` (in `vendor_rules`),
   `predecessor_rule_id` / `successor_rule_id` (in `rule_registry`) all carry
   DB-enforced FKs.
3. **Lifecycle/rung enum validity.** No row can have a `lifecycle_state` or
   `current_rung` outside the enum.
4. **Retired rule exclusion at query/index level.** Repositories filter
   `lifecycle_state != 'retired'` for all evaluation queries; covered by a partial
   index.
5. **Single-writer rule enforcement** via Postgres RLS or service-layer assertion.

**Ring 2 enforces structural rule-shape invariants** at construction time in the
rule-authoring API and at evaluation time in `ruleEvaluationService`:

6. **Trigger / payload compatibility.** Every field referenced by a Branch's
   Conditions is present on the payloads of every Evaluation Trigger and
   Proposal-Source Trigger the Branch applies to. A Branch referencing a
   source-specific field (e.g., `scheduled_date`) must declare
   `applies_to_source_triggers` restricting it to the sources that carry that
   field; otherwise the Rule is invalid.
7. **Branch action cardinality.** Every Branch has exactly one
   `max_outcome_action`; side effects live in `annotations`.
8. **Closed-library membership.** Every Condition, Action, and Trigger is from the
   closed library at authoring time. No free-form expressions.
9. **Inferential pipeline contract.** Every Inferential Condition references a
   `pipeline_trace` contract per ADR-0007 Q30.
10. **Auto-post-capable branch bounds.** Every Branch with `max_outcome_action ∈
    {auto_post_at_rung_2, auto_post_at_rung_3}` has bounded Conditions covering
    vendor/counterparty identity, account/category target, and amount/materiality
    range. Missing one is a validation failure; the exact "bounded enough" check
    is owned by Ring 2.
11. **Intent type consistency.** `applies_to_intent_types` equals the computed
    union of trigger-payload-compatible intent types, or is generated by the
    service.
12. **System ceiling separation.** No Rule's Conditions are constructed to fire
    only when a System ceiling class is present.
13. **Guardrail branch coverage** (recommendation, not strict). Rules with an
    auto-post-capable primary should have at least one `otherwise_if` guardrail
    covering out-of-bounds cases; Ring 2 surfaces this as a warning at authoring
    time, and Ring 3's learner proposes guardrail branches when missing.

Ring 1 enforces what the DB can check; Ring 2 enforces what requires the predicate
JSON schema and structural logic.

---

## 8. Lifecycle, learning, and configuration

### 8.1 Rule creation paths

**Controller-authored.** A controller (in chat with the agent, or in the Agent
Policies canvas) authors a Rule. The agent assists with drafting — translating
natural language into typed Triggers, Conditions, and Actions, and proposing the
defensive guardrail branches the controller didn't think to add — but the
controller has authority. The Rule lands at `lifecycle_state = active`,
`current_rung = always_confirm`. Promotion follows `agent_autonomy_model.md` §4.1
ceremony.

**System-proposed.** The learner (Ring 3 post-v1) watches the audit corpus,
identifies repeated approval patterns, and drafts candidate Rules. Candidates land
at `lifecycle_state = proposed`. The controller reviews the proposed Rule (as a
branched flowchart in the Agent Policies canvas) and accepts (→ `active`) or
rejects (→ `retired`, audit `rule_proposal_rejected`). System-proposed Rules
include defensive guardrail branches automatically.

Both paths produce identical Rule shapes. The runtime evaluator does not care
about origin. The audit log records origin (`created_by`, `creation_method`
enum).

### 8.2 Promotion, demotion, re-promotion

Unchanged from `agent_autonomy_model.md` §4.1, §4.2, §4.3:

- Promotion thresholds: 15 **primary** matches, 95% approval rate over the last 30
  days. Guardrail matches do not count toward the denominator (§5.9).
- Promotion authority: controller for `notify_and_auto_post`, owner for
  `silent_auto`.
- Promotion ceremony: modal flow with sampled matches, max amount observed, impact
  preview.
- Demotion: one-click immediate by any controller. Mutates `current_rung` to
  `always_confirm` and `lifecycle_state` to `demoted`.
- Re-promotion: same ceremony; mutates `current_rung` and `lifecycle_state` to
  `active`.

Promotion changes authority (`current_rung`), never Branch logic (§5.6, §5.1).

### 8.3 Agent role in the rule-refinement loop

When the agent proposes a Rule refinement (§9.3), the mechanism is:

1. Agent observes audit corpus via read tools.
2. Agent uses the rule core's draft API to produce a candidate **successor** Rule
   — typed, audit-anchored, expressing the amended logic in full.
3. The candidate successor is a ProposedMutation-equivalent: structured, typed. It
   flows through the same approval surfaces as any rule creation.
4. The controller reviews the successor Rule. Approval is a **single transaction**
   that retires the predecessor and activates the successor, setting bidirectional
   `predecessor_rule_id` / `successor_rule_id` links.
5. Every refinement proposal produces an audit event (`rule_refinement_proposed`);
   acceptance produces a paired `rule_retired` (predecessor) and `rule_activated`
   (successor); rejection produces `rule_refinement_rejected` and leaves the
   predecessor unchanged.

There is **no in-place edit**. The agent drafts; the controller approves; the
result is always a new Rule with explicit predecessor lineage. The agent has no
authority to alter Rules autonomously.

### 8.4 Configuration model

Per-org configuration following the ADR-0019 reserved-column precedent. Reserved
post-v1 `org_settings.*` columns:

- `default_initial_rung_for_new_rules` — closed enum; v1 value is always
  `always_confirm` for both controller-authored and system-proposed Rules.
  Reserved values `notify_and_auto_post` and `silent_auto` are post-v1 only and
  require explicit override authority specified by a future ADR. (The name removes
  the ambiguity that an earlier `default_rung_for_new_rules` could be read as a way
  to bypass the 15/95%/30 promotion thresholds.)
- `rule_proposal_threshold` — integer; how many similar approvals before the
  system proposes a Rule. NULL-default at v1; first calibration cycle picks the
  value per ADR-0019.
- `rule_type_preference` — closed enum (`pattern_preferred` | `temporal_preferred`
  | `inferential_preferred` | `no_preference`). NULL-default; influences which type
  of Rule the system proposes from observation. `temporal_preferred` is included
  for completeness given recurring transactions are first-class; the calibration
  cycle decides whether it's commonly selected.
- `agent_verbosity_for_rules` — closed enum (`terse` | `standard` | `educational`);
  influences chat-layer narration of rule outcomes but not the rule core
  evaluation itself.

All NULL-default at v1. Three-layer defense per ADR-0010 (DB CHECK admitting NULL,
Zod boundary rejecting non-NULL at v1, service emission filter preventing non-NULL
writes). Operational activation forward-pointed to a post-v1 ADR.

The columns are disjoint from ADR-0014's twelve OCR/retention/language columns and
ADR-0019's six confidence-threshold/calibration columns.

The user-knowledge axis materializes as configuration here, not as a different
rule core. A novice org might be configured with `rule_proposal_threshold = 25`
(slower proposal) and `agent_verbosity_for_rules = educational`; an expert org with
`rule_proposal_threshold = 8` and `terse`. Same rule core; different per-org
defaults; same audit story.

**Materiality posture is reserved as a concept, not defined here.** The spec
commits to: rule evaluation *may* later consume materiality posture for additional
gating beyond rung-level autonomy. The bands, thresholds, and defaults are a future
ADR. No `org_settings.*` columns for materiality are reserved at v1; Ring 1 decides
whether materiality columns ship at Ring 1 or wait for the future ADR.

### 8.5 Audit emission

Every rule lifecycle transition and every material evaluation produces audit
events through the canonical audit-log writer per ADR-0011 §1.

Reserved event types (per ADR-0010 reserved-enum-states discipline):

- `rule_proposed` — system-proposed rule created.
- `rule_activated` — rule enters `active` state.
- `rule_promoted` — rule moved to a higher rung.
- `rule_demoted` — rule moved to `demoted` state.
- `rule_retired` — rule retired. Includes retirement-as-amendment, in which case
  `successor_rule_id` is populated.
- `rule_proposal_rejected` — controller rejected a system-proposed Rule (proposed
  → retired without activation). Distinct from `rule_match_rejected`.
- `rule_evaluated` — every evaluation, with `MatchResult.evaluation_trace` as the
  payload.
- `rule_match_confirmed` — winning rule's primary-branch proposal approved or
  auto-posted-and-not-reversed. Drives `clean_approval_count`.
- `rule_match_rejected` — winning rule's primary-branch proposal rejected or
  reversed within window.
- `rule_guardrail_fired` — guardrail branch match emitted. Drives guardrail
  counters.
- `rule_guardrail_confirmed` — controller disposition confirmed the guardrail.
- `rule_guardrail_resolved_into_primary_bounds` — controller's edit moved the
  proposal back inside primary bounds.
- `rule_refinement_proposed` — agent drafted a successor Rule for controller
  review.
- `rule_refinement_rejected` — controller rejected an agent-proposed refinement.
- `rule_metadata_updated` — a Rule's mutable display metadata (e.g., `name`)
  changed; logic-bearing fields remain immutable (§5.1). v1-active (rename is a
  trivial UI operation).

**v1 active subset** for controller-authored Rules: `rule_activated`,
`rule_promoted`, `rule_demoted`, `rule_retired`, `rule_metadata_updated`,
`rule_evaluated`, `rule_match_confirmed`, `rule_match_rejected`. Proposal events
activate when the Ring 3 learner ships. Refinement events activate when the
rule-refinement loop ships. **Guardrail events activate with the first workflow
evaluator that supports `otherwise_if` guardrail branches.** If the first Ring 2A
drag-drop bill evaluator ships guardrails in v1, then `rule_guardrail_fired`,
`rule_guardrail_confirmed`, and `rule_guardrail_resolved_into_primary_bounds` are
v1-active for that workflow.

**Audit volume note.** `rule_evaluated` emission is per-evaluation. If volume
becomes prohibitive at scale, an amendment may narrow emission to material outcomes
only (matches and almost-matches, skipping no-trigger-fired). This is a Ring 2/3
operational concern, not a Ring 0 concern.

---

## 9. Agent-maintained rule-system differentiators

This section names the three capabilities the spec commits to enabling, which
together produce the categorical differentiation from existing accounting software
with rule systems. (The conversation called these the Claude-Code-shaped
capabilities; this spec names them generically because they describe what the
system *does*, not which adjacent system it resembles.)

### 9.1 Post-hoc anomaly surfacing on auto-posted entries (Ring 2)

When a Rule auto-posts at rung 2 or 3, a separate audit-scan service downstream of
the rule core computes the delta to downstream views and flags anomalies for
review **even though the entry already posted**. Anomalies surface as **Needs
Attention** items per `mutation_lifecycle.md`, not as new ledger changes.

Examples:

- Auto-posted entry pushed an account >2σ from its historical month-over-month
  variance.
- Auto-posted entry pushed YTD against budget across a configured threshold.
- Auto-posted entry's vendor has been auto-posting consistently but this entry's
  amount is in the 99th percentile of the vendor's history.

The entry is not reversed automatically. The controller reviews and decides
whether to reverse via the normal reversal flow. This stays within the safety
envelope: the entry posted through legitimate rule machinery, and the system's role
is surfacing for review. The novelty is that the system notices things *after* they
happen and proactively flags them, rather than waiting for monthly review.

*Ring assignment:* Ring 2. Does not require corpus; ships once the first rung-2
rule promotes and the auto-post path materializes.

### 9.2 Shadow-mode execution for new rules (Ring 2)

Before a Rule is promoted to rung 2 or rung 3, it runs in **shadow mode** for a
30-day window. The Rule generates the proposal it would have auto-posted; the
controller continues to approve manually; the audit log records both the actual
approval and the shadow Rule's would-have-been outcome.

After the window, the promotion ceremony shows the controller: N actual approvals;
M of N matched the shadow Rule's would-have-been outcome; K of N differed, broken
down by category (edited the account, changed the amount, rejected). Promotions are
conditional on the shadow comparison crossing a configurable bar (default: ≥95%
agreement, mirroring the promotion threshold from `agent_autonomy_model.md` §4.2).

Shadow mode is anchored to the `clean_approval_count` counter — which **does not
yet exist on disk** per §3. Ring 1 ships the counter; Ring 2 ships shadow mode
against the counter Ring 1 just made real. The sequencing is explicit and the
substrate dependency is named.

*Ring assignment:* Ring 2 (capability), with the substrate dependency landed at
Ring 1.

### 9.3 The rule-refinement loop (Ring 3)

The agent watches the audit corpus continuously for rule-vs-reality friction:

- Rules whose primary branch is failing (`almost_match_rules` accumulating).
- Rules whose guardrail branches are firing more than they should
  (`guardrail_resolved_into_primary_bounds_count` growing).
- Rules whose recent matches are being edited by the controller before approval.
- Rules whose track record is degrading.
- Rules that haven't fired in N months (candidates for retirement).
- Patterns of controller-edited approvals that suggest a missing Branch.

For each friction signal, the agent drafts a Rule refinement per the §8.3
mechanism and surfaces it conversationally or in the Agent Policies canvas. The
controller approves or rejects each refinement individually. Every refinement goes
through the same promotion/demotion machinery as any rule change; the agent only
proposes.

This is the loop that makes Chounting genuinely different from rule-based
accounting software. Other systems require the user to maintain rules manually;
Chounting makes rule maintenance the agent's job, within the safety envelope.

*Ring assignment:* Ring 3 (post-v1 learner). Substrate: the audit corpus from v1
traffic generates the signals; the rule lifecycle's `proposed` state is the seat
the refinements land in.

---

## 10. Four-stage delivery sequence

The rule core delivers in four stages: Ring 0 (this spec) plus three downstream
rings (substrate, per-workflow implementations, post-v1 learner).

### Ring 0 — This spec

A spec document at `docs/02_specs/rule-type-core.md`. No code. Defines: the nine
ratified domain concepts plus the Registry recommendation (§5); the
Trigger/Condition/Action grammar and closed-library principle; the three-state
match taxonomy; the evaluation procedure and fully deterministic conflict
resolution plus effective action capping (§6); the Rule Validity Invariants (§7);
lifecycle, learning, configuration, audit (§8); the three differentiators (§9);
the substrate reality check (§3); the relationships to System ceiling, Agent
Ladder, ADR-0017, ADR-0019, ADR-0012, ADR-0007; worked examples (§11); open
questions (§12).

Ratifies the interface that Ring 1 substrate and Ring 2 implementations consume.
*Cost:* spec drafting + CTO review. No code, no migration. *Deliverable:* this
document, ratified.

### Ring 1 — Substrate

A future ADR. Ships a single migration consolidating **five interdependent
decisions**:

1. `rule_registry` table with class-table inheritance via `rule_registry.id ←
   vendor_rules.rule_id` (1:1 FK on the existing PK), per §5.10. OR: defer the
   registry until the second backing rule table exists (deferral interim path,
   §5.10).
2. `rule_track_records` table (new), keyed by `rule_id`, holding the denormalized
   TrackRecord counters per the §5.10 source-of-truth allocation.
3. **ADR-0017 drift reconciliation:** Under the class-table inheritance path
   (§5.10), satisfy ADR-0017's `clean_approval_count` requirement through
   `rule_track_records.clean_approval_count` rather than adding the column to
   `vendor_rules`. Add `bundle_type` and `legal_entity_id` to `vendor_rules` per
   ADR-0017 text. Add the `(org_id, legal_entity_id, vendor_id, bundle_type)`
   unique constraint. If the registry/track-records path is deferred (§5.10
   deferral interim path), Ring 1 may temporarily add
   `vendor_rules.clean_approval_count` but must mark it interim and migrate it to
   `rule_track_records` when the registry ships.
4. **Enum naming reconciliation:** rename `autonomy_tier` to `rule_autonomy_rung`
   (values matching ADR-0017 text) OR amend ADR-0017 to ratify `autonomy_tier` as
   canonical. The migration also moves `current_rung` source-of-truth into
   `rule_registry`; `vendor_rules.autonomy_tier` becomes a generated column or is
   dropped.
5. **Single-writer rules** for `ruleRegistryService`, `ruleTrackRecordService`,
   and the unchanged `vendorRuleService` — disjoint by table, mirroring the
   Reading B pattern from `ledger_truth_model.md`.

Also: reserved enums for `rule_type`, `rule_lifecycle_state`, `condition_type`,
`action_type`, `trigger_type` per ADR-0010 three-layer defense; reserved post-v1
`org_settings.*` columns per §8.4; reserved audit event types per §8.5.

No v1 service path consumes the registry or the new columns for autonomy
decisions. **Diagnostic-only at v1**, mirroring ADR-0017's substrate-only-v1
framing. *Cost:* schema migration (one or two new tables, four new columns on
`vendor_rules`, one unique constraint, multiple reserved enums and audit events).
Footprint comparable to ADR-0017. *Deliverable:* a Ring 1 ADR (e.g., "ADR-NN: Rule
Type Core Substrate and ADR-0017 Reconciliation") ratified after Ring 0.

### Ring 2 — Per-workflow implementation

Code, shipped incrementally per workflow. First implementation lands with the
drag-drop bill workflow:

- Pattern predicate evaluator at `core/rules/patternPredicateEval.ts`.
- `ruleEvaluationService.ts` at the service layer.
- Wiring from the orchestrator's Seam 1 to the new service.
- Integration tests against the drag-drop bill flow.
- Per ADR-0007 Q31, deterministic TypeScript orchestration — not LLM-planned.

Subsequent Ring 2 capabilities:

- Shadow-mode execution (§9.2), once the first rung-2 promotion is on the horizon.
- Post-hoc anomaly surfacing (§9.1), once auto-posted entries exist to scan.
- Temporal predicate evaluator when recurring transactions land.
- Inferential predicate evaluator when categorization-of-novel-items lands (per
  ADR-0007 Q30 `pipeline_trace`).

Each Ring 2 ship implements one capability and wires one workflow. The Ring 0
interface contract holds across all of them. *Cost:* per-workflow engineering,
bounded by the workflow's scope. *Deliverable:* code, per workflow.

### Ring 3 — Learner

Post-v1, post at least two ADR-0019 calibration cycles (~12 months of v1 traffic).
Ships the audit-corpus learner that produces system-proposed Rules; the
rule-refinement loop (§9.3); and the "amendment to existing rule" ceremony variant
for the §8.3 mechanism. The substrate from Ring 1 has the `proposed` lifecycle
state reserved for the learner's output. *Cost:* significant engineering;
predicated on having v1 corpus. *Deliverable:* code; future ADRs per substantive
sub-system.

---

## 11. Worked examples

Each example walks through input → evaluation → MatchResult → consequence. The
five-question stress test is applied implicitly — if any worked example doesn't
fit, the spec shape needs to widen before ratification.

### 11.1 Drag-drop bill, primary match, promoted rule

**Input:** User drags an Amazon invoice PDF into chat. Tier 2 pipeline extracts:
vendor=Amazon, amount=$420, line items contain "office", date in current period.
Pipeline produces `ProposedMutation(post_bill)` with `source_trigger =
user_drag_drop`.

**Orchestrator:** Step 1 ceiling check — not a ceiling class. Proceed to rule
evaluation.

**Rule core:** Evaluation Trigger `proposed_mutation_generated` matches Rule
"Amazon Office Supplies." Primary Branch:

- `field_equals(vendor_id, "amazon_vendor_id")` → pass
- `field_in_range(amount, 0, 500)` → pass
- `field_matches_pattern(line_items, "office_supplies_pattern")` → pass

Primary matches. `max_outcome_action = auto_post_at_rung_2`; the Rule's
`current_rung = notify_and_auto_post` (promoted last quarter). Match
classification: `primary_match`. A less-specific vendor-default rule also matched
and lost on specificity. The pure core returns this in the MatchResult
(`winning_branch_max_action = auto_post_at_rung_2`); it does not compute the
effective action.

**Agent Ladder gate (orchestrator):** caps the max by `current_rung` (rung 2
permits auto-post), then per-transaction, daily aggregate, and track-record checks
pass → `effective_action = auto_post_at_rung_2`.

**Consequence:** Entry auto-posts; lifecycle transitions to Posted (auto); 24-hour
reversible window opens; INV-AGENT-002 Logic Receipt emits with
`evaluation_trace`. Q2 = "Matched: Amazon Office Supplies (pattern). Auto-posted to
Office Supplies." Q3 = "This rule has correctly handled 47 of 49 primary matches
over the last 30 days."

### 11.2 Drag-drop bill, guardrail match (the Spotify-$1,399 case)

**Input:** Spotify charge for $1,399 (≈100× normal). Pipeline produces
`ProposedMutation(post_bill)`.

**Rule core:** Trigger matches Rule "Spotify monthly." Primary Branch:

- `field_equals(vendor_id, "spotify_vendor_id")` → pass
- `field_in_range(amount, 12.59, 15.39)` → **fail**

Primary fails. `otherwise_if` Branch:

- `field_equals(vendor_id, "spotify_vendor_id")` → pass
- `field_outside_range(amount, 12.59, 15.39)` → pass (closed-library condition)

`otherwise_if` matches. `max_outcome_action =
route_to_exception_queue_with_reason("Spotify transaction outside expected amount
range")`. Match classification: `guardrail_match`; `winning_branch_type =
guardrail`. The gate passes route actions through unchanged (not subject to
rung-capping, §5.6) → `effective_action = route_to_exception_queue_with_reason`.

**Consequence:** Proposal routes to **Needs Attention** with the typed reason. Q2 =
"Matched: Spotify monthly rule — guardrail branch. The rule recognized this
transaction but routed it to review because the amount $1,399 is outside the
expected range $12.59–$15.39." Q3 = "This rule's guardrail branch has fired 0 times
before; the primary has correctly handled 11 of 11 matches." Q4 = "Rejecting will
not post the entry. The rule's guardrail branch fired as designed — rejecting is
neutral for the rule's primary track record." The guardrail TrackRecord increments
`guardrail_fire_count` and, depending on disposition, `guardrail_confirmed_count` or
`guardrail_resolved_into_primary_bounds_count`.

*Demonstrates:* sanity bounds are inside the rule structure (`otherwise_if` using
the closed `field_outside_range` condition), not a separate suppression subsystem.
The guardrail classification surfaces useful context and feeds distinct learner
signals.

### 11.3 Recurring subscription, temporal rule (single-evaluation path)

**Input:** Scheduled date arrives. The scheduler emits
`scheduled_time_occurs(schedule_id=spotify_monthly, payload={vendor=Spotify,
scheduled_amount=$13.99, scheduled_date=2026-06-07})`. The orchestrator transforms
this into a `ProposedMutation(post_bill)` with `source_trigger =
scheduled_time_occurs` and emits `proposed_mutation_generated` **exactly once**.

**Rule core:** Evaluation Trigger `proposed_mutation_generated` matches the
scheduled-source Spotify Rule "Spotify monthly (scheduled)." Its primary Branch
declares `applies_to_source_triggers = [scheduled_time_occurs]` because it
references `scheduled_date`, a field present only on scheduler-originated
proposals:

- `field_equals(vendor_id, "spotify_vendor_id")` → pass
- `field_in_range(amount, 12.59, 15.39)` → pass
- `schedule_matches(scheduled_date, ±2 days)` → pass

The Rule also has an `otherwise_if` guardrail branch (same
`applies_to_source_triggers`) handling out-of-range amounts via
`field_outside_range(amount, 12.59, 15.39)` → `route_to_exception_queue_with_reason`.

Primary matches. `winning_branch_max_action = auto_post_at_rung_2`, `current_rung =
notify_and_auto_post`. Classification: `primary_match`. The gate (§6.1 step 7) caps
to `effective_action = auto_post_at_rung_2`.

**Consequence:** Auto-posts; 24-hour window opens; user sees a notification.

*Demonstrates:* the **same rule shape and same evaluation procedure** cover both
scheduled and drag-drop sources, with branches discriminating on source where
source-specific fields are referenced. This Rule is the scheduled-source variant; a
**peer Rule** "Spotify monthly (drag-drop)" covers drag-drop Spotify invoices with
no `schedule_matches` condition (because `scheduled_date` is absent from drag-drop
payloads). The earlier "one rule serves both sources" framing was overstated: what
holds is one grammar, one procedure, source-discriminated branches. No double
evaluation — the scheduler triggers proposal generation, which triggers evaluation
exactly once.

### 11.4 Bank reconciliation, pattern rule against AR

**Input:** Bank statement line ingested: $4,200 deposit on 2026-06-14,
`payee_string="STRIPE TRANSFER #4471"`. Pipeline produces `external_event_ingested`
of type `bank_statement_line`; orchestrator generates a `ProposedMutation` with
`source_trigger = external_event_ingested`. Tier 2.5 Relationship Router produces a
`DocumentRelationshipCandidate` matching against open AR balance.

**Rule core:** Trigger matches Rule "Stripe transfer auto-match against AR." Primary
Branch:

- `field_matches_pattern(payee_string, "STRIPE TRANSFER #\\d+")` → pass
- `field_in_range(amount_delta_from_open_ar, -0.01, 0.01)` → pass
- `field_in_range(date_delta_from_invoice_record, -2, 2)` (days) → pass

Primary matches. `winning_branch_max_action = auto_post_at_rung_2`. Classification:
`primary_match`. The gate caps by `current_rung` and applies limits →
`effective_action = auto_post_at_rung_2`.

**Consequence:** Auto-match commits via the AR-side payment-application service. The
live `paymentService.record()` handles AP payments; the AR-side service for applying
customer receipts to open invoices **does not yet exist** as a named method — this
example posits `cashReceiptService.applyCustomerPayment` (or equivalent) as a future
service materializing when the AR/reconciliation workflow lands (open question
Q-RTC-10). The open AR balance settles; 24-hour reversible window opens.

*Demonstrates:* pattern Rules work for reconciliation despite the input event
differing from a drag-drop proposal. The Trigger discriminates; the same evaluation
procedure runs. The AR-vs-AP service distinction is real and flagged as future work.

### 11.5 T2 filing prep, no rule + System ceiling

**Input:** Agent runs `runT2Prep(fiscal_year_2025)`. Step 5 drafts the tax expense
and tax payable journal entries as `ProposedMutationBundle(t2_year_end)` with two
`post_journal_entry` children, period=2025-Q4 (locked).

**Rule core:** Trigger `proposed_mutation_bundle_generated` — no T2 rule promoted
yet. For each child, no rules match. `winning_rule_id = null` for all evaluations.

**But:** Step 1 ceiling check (upstream of rule evaluation) fires. Period-end
adjustments per `agent_autonomy_model.md` §6 row 4 — System ceiling. Bundle routes
to approval regardless of any rule maturity.

**Consequence:** ProposedBundleCard renders; controller approves; bundle posts
atomically per ADR-0012 §3.

*Demonstrates:* the System ceiling correctly fires before rule evaluation. Even if a
future T2 rule promoted to rung 2 or 3, period-end adjustments stay in approval per
the ceiling. The rule core does not override the ceiling; ceilings live upstream in
`agent_autonomy_model.md` §6.

### 11.6 Inferential rule, novel vendor categorization

**Input:** Drag-drop invoice from "Acme Consulting Group LLC" (never seen before).
Pipeline extracts: vendor=new, amount=$3,200, line items "Q3 strategy advisory
hours." Produces `ProposedMutation(post_bill)` with no matching vendor in master.

**Rule core:** Trigger matches inferential Rule "Professional Services semantic
categorization." Primary Branch:

- `semantic_match_above_threshold(line_items, "consulting_professional_services_corpus",
  threshold=0.75)` → pass (model output 0.87, internal)

Primary matches. `max_outcome_action = suggest_with_required_approval` (inferential
rules promote especially conservatively; this rule has not been promoted to an
auto-post rung). Classification: `primary_match`. The gate passes
`suggest_with_required_approval` through unchanged (not subject to rung-capping,
§5.6) → `effective_action = suggest_with_required_approval`.

**Consequence:** Proposal routes to approval with suggested account = Professional
Services. Q2 = "Matched: Professional Services categorization rule (inferential).
Line items semantically match the consulting category." Q3 = "This rule has
correctly categorized 47 of 49 vendors over the last 30 days. Model version:
[model-id]." No confidence number visible per ADR-0002.

*Demonstrates:* inferential Rules work alongside pattern Rules in the same
evaluation procedure. Confidence is internal; the populated Four Questions are
legible without exposing the score. Model version surfaces for auditor
reproducibility but is not user-emphasized.

---

## 12. Open questions

- **Q-RTC-1:** Ring 1 substrate timing — does `rule_registry` ship at Ring 1, or is
  it deferred until the second backing rule table exists? Recommendation (§5.10) is
  to ship; alternative is to defer. Ring 1 ADR decision.
- **Q-RTC-2:** Enum naming reconciliation — rename `autonomy_tier` to
  `rule_autonomy_rung` (matching ADR-0017 text but breaking the live schema) or
  amend ADR-0017 to ratify `autonomy_tier` as canonical (matching the live schema
  but amending the ADR text). Ring 1 picks.
- **Q-RTC-3:** Rule similarity metric for the system-proposed Rule path. Reserved
  post-v1; first calibration cycle picks the metric.
- **Q-RTC-4:** The `rule_proposal_threshold` value. Reserved per ADR-0019.
- **Q-RTC-5:** Materiality bands. Future ADR territory; this spec reserves the
  concept only.
- **Q-RTC-6:** Continuous reconciliation feedback into TrackRecord. Future ADR.
- **Q-RTC-7:** Workflow-level autonomy promotion. When all rules in a workflow are
  at rung 2+, can the workflow itself promote to headless completion? Future ADR.
- **Q-RTC-8:** Per-org rule library export/import. Reserved post-v1.
- **Q-RTC-9:** Audit event volume from `rule_evaluated` emissions. Recommendation is
  emit-every-evaluation; narrowing is a future amendment if volume becomes
  prohibitive.
- **Q-RTC-10:** The `cashReceiptService.applyCustomerPayment` (or equivalent)
  AR-side service does not exist on disk. The §11.4 example posits it as future work
  materializing when the AR/reconciliation workflow lands. Naming and service shape
  are owned by that future workflow, not by this spec.
- **Q-RTC-11:** Bundle-type cardinality in `vendor_rules`. ADR-0017 text specifies
  per-vendor per-bundle-type cardinality; the live schema is per-vendor only. Ring 1
  decides whether to add `bundle_type` per ADR-0017 intent or revise the cardinality
  — open because either path may be legitimate depending on whether per-bundle-type
  rules are needed in the v1 timeframe.
- **Q-RTC-12:** v1 reserves true empty-condition `otherwise` branches (§5.2). A
  future ADR introduces `otherwise` semantics with proper rule-scope or per-trigger
  scope substrate to prevent broad-trigger Rules from guardrail-matching unintended
  proposals via an empty catch-all. Reserved post-v1.

---

## 13. Cross-references

Canonical sources the spec inherits verbatim:

- `docs/02_specs/agent_autonomy_model.md` — Agent Ladder, rungs, limits,
  ceremonies, System ceiling, decision tree, promotion thresholds (§4, §4.1–§4.3,
  §5, §6, §7).
- `docs/02_specs/intent_model.md` — ProposedMutation shape, Four Questions grammar
  (§5), Logic Receipt spec (§6 templating reference), Three Intents.
- `docs/02_specs/mutation_lifecycle.md` — six lifecycle states (incl. the canonical
  **Needs Attention** state), transitions, Needs Attention triggers, timing rules.
- `docs/02_specs/agent_architecture_policy.md` — Q28 re-verification matrix; sibling
  document at the same architectural layer.
- `docs/03_architecture/agent-ladder.md` — pointer document.
- `docs/03_architecture/agent-tool-architecture.md` — call chain; rule core lives at
  Seam 1.
- `docs/07_governance/adr/0001-reversal-semantics.md` — reversal entries; ceiling
  treatment lives in `agent_autonomy_model.md` §6 row 2.
- `docs/07_governance/adr/0002-confidence-as-policy-input.md` — confidence is never
  user-visible.
- `docs/07_governance/adr/0007-three-tier-agent-architecture.md` — three-tier
  architecture; Q31, Q30, Q28.
- `docs/07_governance/adr/0010-reserved-enum-states.md` — three-layer defense for
  all reserved enums here.
- `docs/07_governance/adr/0011-document-platform.md` — spine; canonical audit-log
  writer (§1); entity ownership; §10 multi-entity reservation.
- `docs/07_governance/adr/0012-proposed-mutation-bundle.md` — bundle envelope; §9
  composition rule applied to autonomy in §6.5.
- `docs/07_governance/adr/0016-document-relationship-graph.md` —
  `source_document_links` polymorphic spine; cited in §5.10 as the
  considered-and-rejected alternative for the Registry shape.
- `docs/07_governance/adr/0017-vendor-template-substrate.md` — first concrete rule
  materialization; substrate-only-v1 precedent; single-writer rule pattern. §3
  surfaces the four-item drift between ADR-0017 text and live schema.
- `docs/07_governance/adr/0019-confidence-calibration-policy.md` —
  substrate-now-enforcement-later precedent; disjoint reserved column convention.
- `docs/07_governance/adr/0020-agent-first-authority-gradient-source-architecture.md`
  — source-tree placement; Appendix A dependency direction;
  `agent/policies/agent-ladder/` empty home.
- `apps/web/src/agent/policies/agent-ladder/README.md` — the empty source-tree home
  this spec populates.
- `supabase/migrations/20240101000000_initial_schema.sql` — canonical source for the
  live `vendor_rules` shape cited in §3.

---

## 14. What this spec commits to

**In one paragraph:** This spec commits to: rules are a domain concept
with their own invariants, lifecycle, evaluation semantics, and learning rules,
expressible in a closed Trigger / Condition / Action grammar (structurally similar
to the WHEN / CHECK-IF / DO grammar that workflow-automation systems like Asana have
converged on, bounded narrowly for Chounting's fiduciary domain), populated through
controller authoring and post-v1 system observation, evaluated deterministically via
fully ordered specificity → conservatism → recency → UUID conflict resolution with
authority-capped effective actions, integrated with the existing Agent Ladder and
System ceiling without amendment to either, and delivered in four stages (this
interface spec now; a substrate ADR consolidating the Registry + ADR-0017 drift
reconciliation next; per-workflow implementations as workflows ship; learner
machinery post-v1 after two calibration cycles of v1 traffic). The spec enables
three agent-maintained rule-system differentiators — post-hoc anomaly surfacing on
auto-posted entries, shadow-mode execution for new rules, and a rule-refinement loop
where the agent proposes rule changes for controller approval — which together
produce a daily experience that compounds over months without ever giving the agent
autonomy over ledger state. Authority remains "agents propose, services decide, the
database enforces"; the rule core fits underneath the gate without disturbing the
gradient.

Three load-bearing clarifications the contract now makes explicit:

1. **Promotion changes authority, not rule logic.** The Branch's max action
   describes the rule's *logical permission* (pure core); the Agent Ladder gate's
   effective action describes the *current authority* (gate layer, §6.1.1).
   Promotion mutates `current_rung`, which the gate consumes; the pure core's
   Branch logic never changes. The conflict-resolution tiebreaker (§6.1 step 4b)
   ranks on candidate effective action, so the runtime-more-conservative rule wins
   — the safety claim is backed by the effective action, not the theoretical max.
2. **One source of truth.** `rule_registry` owns identity/lifecycle/rung/audit;
   `rule_track_records` owns counters; materialization tables (`vendor_rules`) own
   only their domain-specific scope. No double bookkeeping.
3. **Rule logic is immutable.** Logic amendments retire the old Rule and create a
   successor with `predecessor_rule_id` lineage. Historical MatchResults always
   point at the rule logic that actually fired.

The spec carries one Ring 1 recommendation (class-table inheritance for the
Registry, §5.10, with the polymorphic spine as the
considered-and-rejected alternative citing `source_document_links` precedent),
surfaces twelve other open questions, surfaces a four-item ADR-0017 text-vs-schema
drift that Ring 1 must reconcile as a precondition, and is honest that the
categorical differentiation from existing accounting software emerges over months of
use as the rule library matures — not on day one.

With ratification complete, Ring 1 substrate ADR drafting proceeds as the
next workstream — consolidating the Registry shape, the ADR-0017
reconciliation, the `rule_track_records` table, the enum naming
reconciliation, and the single-writer rules. Ring 2 implementations proceed
per workflow once the Ring 1 substrate ADR ratifies. Ring 3 learner
machinery proceeds post-v1 after sufficient v1 corpus accumulates.
