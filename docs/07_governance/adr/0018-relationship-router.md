# ADR-0018: Relationship Router

## Status

Ratified 2026-05-04 by CTO per D5 ratification package §3.1.
Closes Q56 (Relationship Router re-evaluation triggers); does
not close Q28 (gated on the `agent_architecture_policy.md`
matrix per Q77); cites — does not redraft — Q66 (closed by
ADR-0007 amendment 2026-05-03), Q76 (immutability boundary
owned by ADR-0011 §9 and ADR-0016 §6), and Q77 (matrix-landing
as v1-ship gate, not v1-code gate).

## Date

2026-05-04

## Triggered by

Phase 0 governance plan Task C10 (Tier 5 — depends on ADR-0007
ratification 2026-05-03, ADR-0011 ratification 2026-05-03,
ADR-0012 ratification 2026-05-03, ADR-0014 ratification
2026-05-03, ADR-0015 ratification 2026-05-03, and ADR-0016
ratification 2026-05-04). The 2026-05-02 Document Platform
reframe spec
(`docs/09_briefs/phase-2/document_platform_reframe_design.md`)
named the Relationship Router as the seventh ADR in the
eight-ADR Phase 0 set per §7 and identified the Router as
"load-bearing intelligence" per §8 — three subsystems
(match-against-existing-state, ambiguity resolution,
re-evaluation logic) that together produce
`DocumentRelationshipCandidate` rows from classifier output and
committed domain state. ADR-0007 §Tier 2.5 ratified the Router's
tier placement (closing Q66); ADR-0011 §1 reserved
`document_relationship_candidates` at the entity-ownership
boundary and explicitly forward-pointed Router behavior to this
ADR; ADR-0014 §7 closed the Tier A+C+D classifier output that
this Router consumes; ADR-0015 §7 named the three Scenarios
(A/B/C) whose proposal generation the Router drives; ADR-0016 §3
ratified the schema-side validity matrix that this Router's
Subsystem 1 candidate filter consumes.

ADR-0018 carries one mechanism — the Relationship Router
algorithm — and a tightly-scoped suite of specifications attached
to that mechanism: the three-subsystem decomposition
(Ledger-State Candidate Completion, Ambiguity Resolution,
Re-Evaluation Logic), the Tier 2.5 read-boundary specifics for
the Router's reads, the stale-state TOCTOU obligations the
Router defers to Tier 1, the integration points with ADR-0014's
classifier output and ADR-0019's confidence thresholds, and the
closed list of v1 re-evaluation triggers (T1–T10; v1-active
subset T1, T2, T3, T4, T5, T6, T8, T10).

## Context

### Why a Relationship Router ADR exists

ADR-0007 §Tier 2.5 introduced the Read-Only Ledger-Aware Path
specifically because the Relationship Router needed a tier
contract that authorized reads against committed ledger state
without authorizing writes. ADR-0011 §1 reserved
`document_relationship_candidates` as a Document-Platform-owned
table; ADR-0011 §9 reserved that the Router's pre-commit
re-routing produces new candidate rows that supersede prior rows
via `supersedes_candidate_id`; ADR-0016 §3 ratified the
schema-side validity matrix that determines which
`(linked_entity_type, link_role)` pairs the Router may propose;
ADR-0016 §6 ratified the `pre_commit_link_rerouted` audit event
the Router emits when re-evaluation produces a new candidate.
What none of those upstream ADRs specifies is the algorithm: how
the Router generates candidates, how it scores them, how it
resolves ambiguity, when it re-runs, and where the boundary
between "Router proposes" and "Tier 1 re-verifies" sits.

ADR-0018 fills that algorithmic specification. The split is
intentional and load-bearing: ADR-0016 owns the schema substrate
(what can be stored, what gets accepted at insert time);
ADR-0018 owns the algorithm (how candidates are produced,
scored, and re-evaluated). A future contributor who adds a new
candidate-generation feature, changes the scoring composition,
or extends the re-evaluation trigger set is amending ADR-0018.
A future contributor who adds a new `linked_entity_type` /
`link_role` value or activates a reserved cell in the validity
matrix is amending ADR-0016. A future contributor who changes
the per-document-type confidence threshold value or the
calibration governance is amending ADR-0014 §7 (Q65 provisional
values) or ADR-0019 (Confidence Calibration Policy), not
ADR-0018.

### Phase 0 dependency context and Reading B preservation

ADR-0018 is Tier 5 and gates ADR-0019 (Confidence Calibration
Policy, Tier 6, forthcoming). ADR-0018 depends on the Tier 4
trio (ADR-0015, ADR-0016, ADR-0017); on ADR-0014 (the
classifier that produces Router input); on ADR-0012 (the bundle
envelope the Router populates for born-paid Scenario C); on
ADR-0011 (the spine — entity ownership boundary,
ProposedAttachment contract, exception queue, lifecycle
immutability); on ADR-0007 (Tier 2.5 read-boundary contract);
and on ADR-0010 (reserved-enum-states discipline applied to
any new enum the Router introduces). The
Router introduces no new schema enums in v1; this dependency is
named for completeness.

**Reading B preservation as the load-bearing constraint.** The
ledger service is the sole writer of `journal_entries` and
`journal_lines` (per `docs/02_specs/ledger_truth_model.md`
Service Communication Rules + ADR-0011 §8). The
`documentLinkService` is the sole writer of
`source_document_links` (per ADR-0016 §1 single-writer rule).
**The Router NEVER writes to either.** The Router produces
`DocumentRelationshipCandidate` objects; Tier 1 commit paths
consume those candidates after re-verification; the
`documentLinkService` is the only path that translates a
ratified candidate into a `source_document_links` row. A future
contributor who proposes a Router service that writes to
`source_document_links` directly is proposing the same violation
as a Reading B violation — it is mechanical, not conventional.

### What ADR-0007 / ADR-0011 / ADR-0014 / ADR-0015 / ADR-0016 already nailed down (do not redraft)

The Router's algorithmic contract sits on top of ratified
substrate. The following are **not redrafted** here:

- **Tier 2.5 safety contract** — read-only against committed
  ledger state, idempotent, deterministic TypeScript
  orchestration, Zod-validated `DocumentRelationshipCandidate`
  output, no LLM-planned matching (Q31), reverified by Tier 1
  per the expanded Q28 matrix. Owned by ADR-0007 §Tier 2.5.
- **`document_relationship_candidates` schema** — the table is
  reserved by ADR-0011 §1 and versioned per ADR-0011 §9 with
  `supersedes_candidate_id` for replayability.
- **Tier 2 classifier output** — the
  `(document_type, confidence, rationale)` tuple plus extracted
  fields per `agent_architecture_policy.md` §2.1 row shapes.
  Owned by ADR-0014 §7 (Q71) and §8 (Q72).
- **Per-document-type confidence threshold values** —
  `vendor_invoice` 0.85 / `receipt` 0.80 / `payment_confirmation`
  0.85 / `unknown` always-exception. Owned by ADR-0014 §7 (Q65
  v1 provisional values); calibration governance forward-pointed
  to ADR-0019.
- **Validity matrix for `(linked_entity_type, link_role)`
  pairs** — the v1-active cells in Table A; the full
  pair-validity matrix authoritative cell counts; rejection
  rules at Layer 1 / Layer 2 / Layer 3. Owned by ADR-0016 §3,
  §4. ADR-0018 cites by label rather than restating counts.
- **Pre-commit vs post-commit boundary** — pre-commit candidates
  may re-route via discard-and-recreate; post-commit
  `source_document_links` rows are immutable and require
  reversal-or-supersession to change. Owned by ADR-0011 §9
  (lifecycle immutability rules) and ADR-0016 §6 (schema-side
  enforcement).
- **`pre_commit_link_rerouted` audit event shape** — owned by
  ADR-0016 §6.
- **AP/Spend Scenario A / B / C lifecycle** — the proposal
  shapes (`ProposedAttachment(attach_payment_evidence)`,
  `ProposedMutation(record_bill_payment)`,
  `ProposedMutationBundle(post_bill_with_payment)`) are owned by
  ADR-0015 §7. ADR-0018 specifies which of these shapes the
  Router produces from match output, not the lifecycle of the
  resulting domain rows.
- **Vendor matcher read-boundary three-category split** — owned
  by ADR-0007 §Tier 2.5 + ADR-0011 §11. ADR-0018 inherits
  verbatim and consumes vendor matcher output as candidate
  scoring input.

## Decision

The Decision is presented as seven items, each closing a
contract surface or a Q-sub-item the Router owns. The items are
not optional; together they form the algorithmic specification
of the Router's three subsystems plus the Tier 2.5 read boundary
and the integration points with ADR-0014, ADR-0015, ADR-0016,
and ADR-0019.

### 1. Router scope and tier placement

**Tier placement.** The Relationship Router runs at Tier 2.5 per
ADR-0007 §Tier 2.5 — Read-Only Ledger-Aware Path and §Amendment
(Q66 closure). The Tier 2.5 safety contract is restated here
verbatim from ADR-0007:

- The Router MAY read from the committed ledger state and from
  `source_documents` / `document_artifacts` / existing
  `source_document_links`.
- The Router MUST NOT write. No INSERT / UPDATE / DELETE / call
  to any mutating service.
- The Router MUST be deterministic TypeScript orchestration.
  LLM-planned matching is prohibited per Q31 (the same rule
  that applies to Tier 2 stages applies to Tier 2.5).
- The Router produces Zod-validated output
  (`DocumentRelationshipCandidate`).
- Tier 1 re-verifies every Router output at the commit boundary
  per the expanded Q28 matrix (`agent_architecture_policy.md`
  §2.2 relationship-claim re-verification + §2.3 stale-state
  TOCTOU re-verification).
- The Router is idempotent: the same input (classifier output +
  committed domain state at read time) produces the same
  candidate set across re-runs. ADR-0010 reserved-enum-states
  discipline applies to any new enum the Router introduces; v1
  introduces none.

**Three-subsystem decomposition.** Per the reframe spec §8, the
Router is three subsystems, not one:

1. **Subsystem 1 — Ledger-State Candidate Completion** (item 2
   below). Given ADR-0014's structural match-against-existing-
   state output (a `DocumentRelationshipCandidate` carrying
   document type, extracted fields, vendor match, and any
   reference-data-resolvable relationship target), complete the
   candidate by reading committed accounting state (open bills,
   payments, vendor prepayments, vendor credits, existing
   `source_document_links`) and producing zero or more
   completed `DocumentRelationshipCandidate` rows carrying
   `(linked_entity_type, linked_entity_id, link_role,
   confidence_score, candidate_features)`. The cross-ADR
   boundary is load-bearing: ADR-0014 owns the structural /
   reference-data-resolvable portion (the "incomplete candidate"
   produced by its match-against-existing-state subsystem per
   ADR-0014 §11); ADR-0018 owns the ledger-state completion
   that requires the Tier 2.5 read boundary.
2. **Subsystem 2 — Ambiguity Resolution** (item 3 below). When
   Subsystem 1 produces multiple candidates above threshold,
   decide between propose-the-best, propose-with-ambiguity-flag,
   and route-to-exception-queue.
3. **Subsystem 3 — Re-Evaluation Logic** (item 4 below). When
   domain state changes, re-run Subsystem 1 against pre-commit
   candidates and exception-queue cases. The closed list of v1
   re-evaluation triggers is T1–T10 (v1-active subset T1, T2,
   T3, T4, T5, T6, T8, T10; reserved post-v1 T7, T9).

**Why the decomposition is load-bearing.** The three subsystems
have different concerns and different failure modes. Subsystem 1
is candidate generation — its failure mode is "missed match"
(stranded document) or "spurious match" (low-confidence noise).
Subsystem 2 is decision logic — its failure mode is "ghost
match" (silently picking the wrong candidate when multiple
plausible candidates exist). Subsystem 3 is liveness — its
failure mode is "stale exception" (a document permanently
stranded in the exception queue because the trigger that should
re-route it never fires). Conflating these into a single
"matching algorithm" loses the distinct testability and
audit-event-shape obligations of each. Subsystem 1's audit
events live in `pipeline_trace`; Subsystem 2's decisions live in
the candidate row itself plus the exception-queue routing event;
Subsystem 3's re-runs emit `pre_commit_link_rerouted` per
ADR-0016 §6.

**Idempotency surface.** All three subsystems are idempotent.
Subsystem 1 is idempotent because its inputs (classifier output,
domain-state snapshot at read time) are stable for a given
`document_case` at a given clock time, and its scoring is
deterministic. Subsystem 2 is idempotent because its decision
function is a deterministic comparison of confidence margins
against thresholds. Subsystem 3 is idempotent because each
re-run reads fresh state and emits a versioned candidate row
that supersedes prior rows via `supersedes_candidate_id` per
ADR-0011 §9 — the prior row is preserved, the new row is the
current pointer, and re-running the re-run produces the same
new row (modulo trigger-specific metadata like the firing
trigger type).

**LLM-planned orchestration prohibition (Q31 inheritance).**
The orchestrator that runs Subsystem 1 → Subsystem 2 → emit
candidate is a deterministic TypeScript function calling
subsystems in fixed sequence. No LLM coordinator decides which
subsystem runs next. Subsystem 1 itself does not invoke an LLM
to plan candidate generation; the matching logic is
deterministic feature extraction + scoring composition. The
prohibition extends to Subsystem 3 — a future contributor who
proposes "use an LLM to decide which trigger should fire when"
is proposing a Q31 violation. The trigger-event consumer is a
plain TypeScript function that consumes typed trigger events
and enqueues Subsystem 1 re-runs per the closed trigger set
T1–T10.

### 2. Subsystem 1 — Ledger-State Candidate Completion

**Cross-ADR boundary with ADR-0014.** ADR-0014 §11 specifies
that its match-against-existing-state subsystem produces a
`DocumentRelationshipCandidate` from document type + extracted
fields + vendor match + reference-data reads, but explicitly
states: "When the subsystem's output requires reading committed
accounting state (open bills, vendor balances), the relationship
candidate is an **incomplete candidate** that flows into the
Relationship Router (ADR-0018, Tier 2.5) for completion." ADR-0018's
Subsystem 1 is the completion stage. The boundary is mechanical:
ADR-0014 produces structural / reference-data-resolvable
candidates inside the Tier 2 read boundary (vendor identity,
chart of accounts, tax codes, classes); ADR-0018 completes those
candidates inside the Tier 2.5 read boundary (open bills,
payments, vendor prepayments, vendor credits, existing
`source_document_links`). ADR-0014 hands an incomplete candidate
to ADR-0018; ADR-0018 returns a completed candidate or routes to
exception. Neither ADR is amended by this framing — the boundary
is restated here to make the Subsystem 1 ownership unambiguous.

**Inputs.**

1. ADR-0014's structural match-against-existing-state output —
   a `DocumentRelationshipCandidate` carrying `(document_type,
   classification_confidence, rationale, fields)` plus vendor
   match plus any reference-data-resolvable target (per ADR-0014
   §11). Equivalent to the Tier 2 classifier output per ADR-0014
   §6 (Q71): `(document_type, classification_confidence,
   rationale, fields)` where `fields` is the per-document-type
   field-extraction shape from `agent_architecture_policy.md`
   §2.1. v1-active document types: `vendor_invoice`, `receipt`,
   `payment_confirmation`, `unknown`. (`unknown` short-circuits
   to exception queue per ADR-0014 §7 — Subsystem 1 is not
   invoked for `unknown`.)
2. Committed AP/Spend domain state at read time. The Router
   reads (per item 5 below):
   - Open bills: rows in `bills` where `lifecycle_state IN
     ('approved_for_payment', 'partially_paid')` per ADR-0015 §7
     Scenario B framing, plus `vendor_id`, `amount_total`,
     `accounting_date`, `bill_number`, `due_date`.
   - Payments: rows in `payments` where `payment_state IN
     ('pending', 'paid')` (excluding `failed` per ADR-0015 §8),
     plus `vendor_id`, `amount_total`, `payment_date`,
     `payment_method`, `authorization_reference`,
     `bank_or_card_last4`.
   - Vendor prepayments: rows in `vendor_prepayments` where
     `status IN ('open', 'partially_applied')` per ADR-0015 §1,
     plus `vendor_id`, `remaining_balance`, `prepayment_type`,
     `payment_id`.
   - Vendor credits: rows in `vendor_credits` where `status IN
     ('open', 'partially_applied')` per ADR-0015 §10, plus
     `vendor_id`, `unapplied_balance`, `original_amount`.
   - Existing `source_document_links` for the case's source
     documents (read-only — to detect already-matched documents
     and avoid double-routing per ADR-0011 §1's polymorphic
     contract).

**Outputs.** Zero or more `DocumentRelationshipCandidate` rows.
Each row carries:

- `linked_entity_type` (one of the 8 v1-active values per
  ADR-0016 §1: `bill`, `bill_line`, `payment`,
  `bill_payment_allocation`, `vendor_prepayment`,
  `vendor_prepayment_application`, `vendor_credit`,
  `vendor_credit_application`).
- `linked_entity_id` (the matched row's primary key).
- `link_role` (one of the 4 v1-active values per ADR-0016 §2:
  `primary_invoice`, `payment_evidence`, `receipt`,
  `supporting`).
- `confidence_score` (a number in [0, 1]).
- `candidate_features` (a Zod-typed object capturing which
  fields drove the match — for example `{vendor_match: 'exact',
  amount_match: 'within_0.01', date_match: 'within_3_days'}`).
- The pair `(linked_entity_type, link_role)` MUST be one of the
  15 active-v1 cells in ADR-0016 §3 Table A. The Router rejects
  candidate generation for any pair labeled `R` (reserved
  post-v1) or `I` (invalid) at the algorithm level — Subsystem 1
  never proposes a candidate that the
  `documentLinkService.create()` Layer 1 / Layer 2 / Layer 3
  defenses would reject. This is a defense-in-depth alignment
  with ADR-0016 §4: the Router's output is constrained to the
  same active-v1 subset that the schema accepts.

**Pseudocode-level specification of candidate generation.** For
each v1-active document type, Subsystem 1 produces candidates
against a defined target set:

- **`vendor_invoice` → bill matching.** The classifier-extracted
  fields include `vendor_name` (or matcher-resolved `vendor_id`
  per ADR-0014 §9), `invoice_amount`, `invoice_date`,
  `invoice_number`. Subsystem 1 generates candidates for
  Scenario "invoice arrives, no bill yet" (the common path):
  the candidate is a `(bill, primary_invoice)` pair where the
  bill is **about to be created** by the proposal — this is
  the inferred-target case where Subsystem 1's output is the
  candidate the proposal will commit. For Scenario "invoice
  matches an existing bill" (an invoice arrives for a bill that
  was manually entered without evidence), Subsystem 1 queries
  open bills filtered by `vendor_id` and produces candidates
  for each match. Per-feature scoring:
  - vendor match (exact `vendor_id` match → high; matcher
    resolves to same `vendor_id` → high; vendor_name fuzzy
    similarity → mid; no vendor match → reject candidate).
  - amount match (exact `amount_total` equality → high; within
    rounding tolerance (cents) → high; off-by-tax-amount → mid;
    no amount match → reject candidate).
  - date proximity (`accounting_date` within 7 days of
    `invoice_date` → high; within 30 days → mid; older than 30
    days → low; reject candidates beyond 90 days as
    semantically implausible at v1).
  - `bill_number` / `invoice_number` alignment (exact match →
    high; partial match (substring or normalized form) → mid;
    no field present → ignore feature; mismatch → mid signal,
    not auto-reject).

- **`receipt` → payment matching.** The classifier-extracted
  fields include `vendor_name` / matcher-resolved `vendor_id`,
  `receipt_amount`, `receipt_date`, `payment_method`,
  `authorization_reference`. Subsystem 1 queries existing
  `payments` filtered by `vendor_id` and produces candidates
  for each match. The candidate's `link_role` depends on the
  match shape:
  - `(payment, payment_evidence)` — Scenario A per ADR-0015 §7:
    receipt matches an already-recorded payment; the candidate
    proposes `ProposedAttachment(attach_payment_evidence)`.
  - `(payment, receipt)` — Scenario A variant: the receipt is
    the primary payment-evidence document and no separate
    `payment_confirmation` exists; the candidate proposes
    attachment under the `receipt` role per ADR-0016 §2's
    `(payment, receipt)` active-v1 cell.
  - `(bill, receipt)` — Scenario B per ADR-0015 §7: receipt
    triggers payment of an open bill; the candidate proposes
    `ProposedMutation(record_bill_payment)` plus a post-commit
    attachment.
  - No bill match + no payment match → Scenario C per ADR-0015
    §7: the candidate proposes routing to the exception queue
    with `resolution_action = route_to_manual_entry` (per
    ADR-0011 §13's v1 active resolution-action enum) and
    payload subtype `manualBornPaidBundleEntry` so the
    controller's exception-queue UI presents the manual
    born-paid bundle workflow per ADR-0015 §7. v1 routes
    Scenario C to the exception queue; automated born-paid
    bundle generation is post-v1. ADR-0018 does not amend
    ADR-0011 §13's v1 active resolution-action enum.

  Per-feature scoring:
  - vendor match (same shape as `vendor_invoice` flow above).
  - amount match (exact equality including tax → high; equal to
    bill remaining-balance for Scenario B → high; off by small
    rounding → high; no match → reject candidate).
  - date proximity (`payment_date` within 3 days of
    `receipt_date` → high; within 14 days → mid; older than 30
    days → reject for Scenario A since payments rarely lag
    receipts that long).
  - `authorization_reference` / reference-number match (exact →
    high; partial → mid; absent on either side → ignore feature).
  - `payment_method` consistency (matching method → high;
    inconsistent (e.g., classifier extracts "cheque" but the
    payment is `eft`) → low signal, not auto-reject; the field
    may be classifier-noisy).

- **`payment_confirmation` → payment matching.** Symmetric to
  the `receipt` → payment flow but with stronger weight on
  `authorization_reference` since payment confirmations
  typically carry a transaction reference number. The candidate
  shape is `(payment, payment_evidence)` for the typical
  Scenario A path. Per-feature scoring same as `receipt` flow
  with the reference-number weight increased.

**Confidence scoring composition.** The
`confidence_score ∈ [0, 1]` is composed from per-feature
weighted contributions. The composition is deterministic and
implementation-owned (the Router's TypeScript module computes
the score from a Zod-typed feature record); the contract this
ADR establishes is:

- The composition is a deterministic function of the feature
  vector. No randomness, no LLM call. (Q31 prohibition extends
  here.)
- Per-feature contributions are bounded; no single feature's
  contribution exceeds the score range. The dominant features
  (vendor + amount) anchor the score; secondary features (date,
  reference, payment method) adjust it within the residual
  range.
- The exact weights and the composition formula are
  implementation-owned at v1, ratified at v1 ship time per the
  same provisional-pending-v1-ship pattern as ADR-0014 §7 (Q65
  values) and ADR-0007 §Q77 (Q28 matrix). ADR-0019 (Confidence
  Calibration Policy, forthcoming) owns the calibration
  governance for ongoing post-ratification adjustment of weights
  and thresholds.
- The Router writes the feature vector and the resulting score
  into `candidate_features` so a reviewer (controller during
  exception-queue triage; auditor during forensic replay) can
  reconstruct why a particular score landed.

**Candidate filtering.** After scoring, Subsystem 1 drops
candidates below the per-document-type threshold from ADR-0014
§6 (Q65 v1 provisional values):

- `vendor_invoice` candidates below 0.85 → drop.
- `receipt` candidates below 0.80 → drop.
- `payment_confirmation` candidates below 0.85 → drop.
- `unknown` document type — Subsystem 1 is not invoked; the
  case routes directly to exception queue per ADR-0014 §7.

If the post-filter candidate set is empty, Subsystem 2 routes
the case to the exception queue per item 3 below. If the
post-filter candidate set has one or more candidates, Subsystem
2 proceeds to ambiguity resolution.

**Subsystem 1 audit trail.** Each Subsystem 1 invocation emits
a `pipeline_trace` stage record per ADR-0007 Q30 (the Logic
Receipt's `pipeline_trace: PipelineStageRecord[]` field) with
`stage_name = 'router_match_against_state'`,
`input_hash = SHA-256 of (classifier output + domain-state
snapshot fingerprint)`, `output_hash = SHA-256 of candidate
set`, `model = null` (deterministic TypeScript, no LLM),
`timestamp = <now>`. Re-runs of Subsystem 1 (per Subsystem 3
triggers) produce new `pipeline_trace` records; the prior
records are preserved per ADR-0011 §9 (immutability of
extraction artifacts; the Router's pipeline_trace records are
the same lifecycle as `extraction_runs` and follow the same
supersession discipline).

### 3. Subsystem 2 — Ambiguity Resolution

**Trigger.** Subsystem 2 runs after Subsystem 1 produces ≥ 1
candidate above threshold. The decision Subsystem 2 makes is
which of three branches the case takes:

(a) **Propose-the-best.** A single high-confidence candidate
pulls ahead of any runner-up by a margin that exceeds the
ambiguity-margin threshold. Subsystem 2 emits the winning
candidate as the proposal target; the resulting proposal
shape is determined by the candidate's `(linked_entity_type,
link_role)` pair and the document type per ADR-0015 §7
Scenarios A / B / C:

- `(bill, primary_invoice)` candidate from a `vendor_invoice`
  classification → `ProposedMutation(post_bill)` with the
  invoice attached as `primary_invoice`; Subsystem 2 hands
  the proposal envelope off to the AP/Spend domain commit
  path.
- `(payment, payment_evidence)` candidate from a `receipt`
  or `payment_confirmation` classification, Scenario A →
  `ProposedAttachment(attach_payment_evidence)` per
  ADR-0011 §7.
- `(bill, receipt)` candidate from a `receipt` classification,
  Scenario B → `ProposedMutation(record_bill_payment)` plus
  a post-commit attachment per ADR-0012 §2 (attachments are
  not bundle children).
- `(bill, primary_invoice)` candidate from a `vendor_invoice`
  classification + matched open bill (the "invoice arrives
  after manual bill" sub-case) →
  `ProposedAttachment(attach_invoice_to_existing_bill)` per
  ADR-0011 §7.

(b) **Propose-with-ambiguity-flag.** Multiple candidates fall
within the ambiguity margin of each other. Subsystem 2 emits a
`ProposedAttachment` or `ProposedMutation` whose payload
carries multiple candidate targets; the Tier 1 review surface
(`ProposedEntryCard`) presents disambiguation UI listing the
candidates with their feature vectors and scores so the
controller can pick the correct target. The proposal's
`justification.rule_id` is null (novel pattern — multiple
plausible matches) per `intent_model.md` §3 ProposedMutation
shape; the `pipeline_trace` records carry the full candidate
set so the rejection-of-runners-up is reconstructable from the
audit trail.

(c) **Route-to-exception-queue.** No candidate clearly wins —
either the post-filter candidate set is empty (no candidate
above threshold), or multiple candidates cluster too tightly
to disambiguate without controller intervention and the
ambiguity flag is not actionable in the proposal-card flow
(rare; v1 surfaces this when the candidate cluster is large
enough that disambiguation becomes its own workflow). The case
routes to the exception queue per ADR-0011 §13; the
`resolution_action` enum from ADR-0011 §13 surfaces
match-disambiguation actions
(`attach_to_existing_bill`,
`attach_to_existing_payment`, `record_bill_payment`,
`mark_duplicate`, `mark_non_accounting`,
`route_to_manual_entry`, `reprocess`, `archive` are the v1
active subset; the controller's queue UI provides the
case-specific affordances).

**Ambiguity-margin threshold.** A single Tier 6 calibrated
value, forward-pointed to ADR-0019 (Confidence Calibration
Policy). The contract this ADR establishes:

- The margin is a numeric threshold in [0, 1] applied to the
  difference between the top candidate's `confidence_score`
  and the runner-up's `confidence_score`. Margin ≥ threshold
  → propose-the-best; margin < threshold → propose-with-
  ambiguity-flag (or route to exception queue if the
  candidate cluster is large).
- The provisional v1 value is the Router implementation's
  default; ADR-0019 ratifies the value at v1 ship time
  alongside the per-document-type confidence thresholds.
- The same provisional-pending-v1-ship pattern as ADR-0014 §7
  (Q65) and ADR-0007 §Q77 (Q28 matrix): drafted now, ratified
  at ship; calibration governance for ongoing
  post-ratification adjustment is forward-pointed to ADR-0019.

**Q28 surface 2 sub-case fired here.** ADR-0007 §Q28 expansion
surface 2 named the relationship-claim re-verification matrix.
One of its sub-cases — "(d) the Tier-2 vendor match still
resolves to the same vendor at commit time (vendor master may
have been merged or renamed)" — is **not** a Subsystem 2
responsibility. Subsystem 2 makes the propose-vs-disambiguate
decision at proposal time using the vendor match resolved
at proposal time. Tier 1 re-verifies that the same vendor
resolution holds at commit time per
`agent_architecture_policy.md` §2.2 row (d). The Router never
re-resolves the vendor at commit; the Router's job is "best
candidate at proposal time," and Tier 1's job is "still-valid
candidate at commit time." Item 6 below specifies the
Router's read boundary; item 6 also specifies the stale-state
TOCTOU obligations the Router defers to Tier 1.

**Subsystem 2 audit trail.** The propose-vs-disambiguate-
vs-exception decision lands on the candidate row's
`candidate_features` (recording the full candidate set and the
chosen branch) and on the `pipeline_trace` (a
`router_ambiguity_resolution` stage record with input_hash =
candidate set, output_hash = decision tuple, `model = null`,
timestamp = <now>). Cases routed to the exception queue
additionally emit the queue-routing audit event per ADR-0011
§13.

### 4. Subsystem 3 — Re-Evaluation Logic (Q56 closure)

**Trigger event consumer.** Subsystem 3 runs in response to
domain events that may invalidate or improve a Subsystem 1
candidate set. The dispatcher is a deterministic TypeScript
function that consumes typed trigger events from the AP/Spend
domain services (and post-v1 from other domains per ADR-0011
§14 Domain Boundary Map). The dispatcher is NOT LLM-planned per
Q31 — a future contributor who proposes "use an LLM to decide
which trigger should fire when" is proposing a Q31 violation.

**Scope of re-evaluation.** Subsystem 3 re-evaluates **only
pre-commit cases** — `document_relationship_candidates` rows
where the corresponding `document_case` has NOT yet committed a
proposal that produced a `source_document_links` row for the
candidate's pair. Post-commit `source_document_links` rows are
governed by ADR-0016 §6 immutability (link rows transition only
via `documentLinkService.reverseLinkedEntityLink()`,
producing a `source_document_link_reversed` audit event;
re-creation is a fresh `documentLinkService.create()` call, not
a silent re-evaluation). The Router NEVER silently re-evaluates
post-commit. Post-commit re-routing follows the
supersession-via-reversal+recreation pattern per ADR-0016 §5+§6
— a path explicitly cited here, not redrafted.

**Closed list of v1 re-evaluation triggers.** The triggers and
their dispatch shape are:

- **Trigger T1 — New bill posts** (v1-active). A previously-
  stranded receipt or `payment_confirmation` (routed to the
  exception queue per Subsystem 2 branch (c) because no
  candidate emerged) may now match the new bill. Trigger event
  source: `billService.post()` emits a typed `bill_posted`
  event after successful `withInvariants()` commit. Dispatcher
  scope: re-runs Subsystem 1 against all open exception-queue
  cases for the bill's vendor (filtered by `vendor_id` to
  bound the re-evaluation cost). If a candidate emerges above
  threshold, the case re-routes from exception queue to
  proposed state and emits a `pre_commit_link_rerouted` audit
  event per ADR-0016 §6 with `re_routing_trigger = 'T1_new_bill'`.

- **Trigger T2 — New payment posts** (v1-active). Symmetric to
  T1 for stranded receipts that should attach to the new
  payment. Trigger event source: `paymentService.record()` (for
  manual payments) and `paymentService.commitFailureReversal()`
  (when a failed payment's reversal lands per ADR-0015 §8;
  reversal does not directly trigger T2, but the corresponding
  bill returning to `approved_for_payment` may trigger T1).
  Dispatcher scope: re-runs Subsystem 1 against open
  exception-queue cases for the payment's vendor.
  `re_routing_trigger = 'T2_new_payment'`.

- **Trigger T3 — New vendor_prepayment posts** (v1-active). A
  previously-stranded retainer-agreement-style supporting
  document (routed to exception queue) may now match the new
  prepayment. Per ADR-0015 §1 (Q59 closure), vendor prepayments
  may also be linked to a final-invoice case routed to the
  exception queue per ADR-0015 §6 (Q64 closure — "final invoice
  references prior deposit not in CHOUnting"); creating the
  prepayment row backfills the linkage and Subsystem 3 may
  re-route the final invoice case from exception to proposed
  state. Trigger event source:
  `vendorPrepaymentService.create()`. Dispatcher scope: re-runs
  Subsystem 1 against open exception-queue cases for the
  prepayment's vendor.
  `re_routing_trigger = 'T3_new_vendor_prepayment'`.

- **Trigger T4 — New vendor_credit posts** (v1-active).
  Symmetric to T3 for credit memos. A vendor credit memo
  routed to the exception queue (per ADR-0015 §10 v1 manual
  workflow) may now have its evidence document re-routed to
  attach to the resulting `vendor_credit` row. Trigger event
  source: `vendorCreditService.create()`. Dispatcher scope:
  same as T3.
  `re_routing_trigger = 'T4_new_vendor_credit'`.

- **Trigger T5 — Bill state transition** (v1-active). When a
  bill leaves the `('approved_for_payment', 'partially_paid')`
  states — e.g., transitions to `paid`, `voided`, or
  `cancelled` — pre-commit candidates pointing at that bill are
  invalidated. Trigger event source:
  `billService.markPaid()` /
  `billService.void()` /
  `billService.cancel()` per ADR-0015's bill lifecycle. The
  cascade matrix in ADR-0016 §5 specifies the post-commit
  treatment (link row's `link_status` flips to `reversed`); the
  pre-commit treatment is dispatcher-driven re-evaluation.
  Dispatcher scope: invalidate the pre-commit candidate row;
  re-run Subsystem 1; if no new candidate emerges above
  threshold, the case routes to the exception queue.
  `re_routing_trigger = 'T5_bill_state_transition'`.

- **Trigger T6 — Payment state transition** (v1-active).
  Symmetric to T5 for stranded `payment_evidence` candidates
  pointing at a payment that just transitioned to `failed` per
  ADR-0015 §8. Trigger event source: a payment's
  `payment_state` flipping to `failed` via the
  proposal-and-confirm flow per ADR-0015 §8 emits a typed
  `payment_state_changed` event. Dispatcher scope: invalidate
  pre-commit candidates pointing at the failed payment; re-run
  Subsystem 1; if no new candidate emerges, the case routes to
  the exception queue.
  `re_routing_trigger = 'T6_payment_state_transition'`.

- **Trigger T7 — Vendor master merge** (reserved post-v1).
  When the vendor-master domain ships merge semantics (post-v1
  per ADR-0011 §1's `vendor_master` reserved
  `linked_entity_type` and per the future vendor-master domain
  ADR; cite Q33 forward-pointer to the future agent-runtime
  refactor / vendor-master domain), pre-commit candidates
  pointing at a merged-away vendor invalidate. v1 has no
  vendor-master merge surface; ADR-0015 §9 vendor master
  integration does not introduce merge semantics. Reserved
  post-v1; activation follows the same reserved-enum-states
  discipline pattern as ADR-0010 — explicit amendment to this
  ADR plus the corresponding vendor-master domain ADR, not
  silent activation.
  `re_routing_trigger = 'T7_vendor_master_merge'` reserved.

- **Trigger T8 — Period reopen** (v1-active, narrow scope).
  When a closed fiscal period reopens, pre-commit candidates
  whose `accounting_date` falls in the reopened period
  re-validate against the now-open period state. v1 may have
  rare period-reopen events (per ADR-0015 §10 the period-close
  flow is part of post-v1 scope; v1's period semantics are
  framework-level and reopen events are operationally rare).
  Trigger event source: a period-state transition from `closed`
  to `open` (handled by the period-close service). Dispatcher
  scope: re-run Subsystem 1 against pre-commit candidates with
  `accounting_date` in the reopened period; the v1 active
  behavior is "re-run Subsystem 1 with current state" — typically
  a no-op since the candidates were already valid before period
  close, but the re-run is required to handle the case where
  the candidate was invalidated by a state transition while the
  period was closed and is now valid again.
  `re_routing_trigger = 'T8_period_reopen'`.

- **Trigger T9 — Document supersession** (reserved post-v1).
  When a re-uploaded document supersedes a prior version per
  ADR-0011 §2's `current_version_id` pointer + immutable anchor
  pattern, the prior version's pre-commit candidates may
  invalidate. Per ADR-0016 §2, the `superseded_version`
  `link_role` is reserved post-v1; v1 captures supersession
  through the `current_version_id` pointer on
  `source_documents` rather than through a link-role row.
  Subsystem 3's T9 trigger activates when `superseded_version`
  becomes v1-active in a future ADR-0016 amendment.
  `re_routing_trigger = 'T9_document_supersession'` reserved.

- **Trigger T10 — Manual operator override** (v1-active). A
  controller-initiated re-route from the exception queue UI
  fires Subsystem 1 against a specific case. Trigger event
  source: the exception-queue UI's manual reprocess action
  (per ADR-0011 §13's `resolution_action = 'reprocess'`
  v1-active value). Dispatcher scope: re-run Subsystem 1
  against the specified case's classifier output and current
  domain state. v1 active behavior.
  `re_routing_trigger = 'T10_manual_override'`.

**v1-active subset summary.** T1, T2, T3, T4, T5, T6, T8, T10
are v1-active (8 of 10). T7 (vendor-master merge) and T9
(document supersession) are reserved post-v1; activation
requires explicit ADR amendment per the reserved-enum-states
discipline pattern.

**Per-trigger contract surfaces.** For every trigger T_i:

1. **Trigger event source.** The domain service that emits the
   typed event after a successful `withInvariants()` commit.
   The event shape is owned by the emitting service; the
   Router's dispatcher consumes the event but does not own its
   schema.
2. **Dispatcher.** A deterministic TypeScript function that
   consumes the event and enqueues Subsystem 1 re-runs against
   the case set the trigger affects. NOT LLM-planned (Q31).
3. **Scope of re-evaluation.** Pre-commit cases only;
   post-commit link rows go through ADR-0016 §6 supersession.
4. **Audit event.** `pre_commit_link_rerouted` per ADR-0016 §6
   with `re_routing_trigger` carrying the trigger identifier.
   The audit event lands inside the dispatcher's transaction so
   the re-routing is atomic with the new candidate row's
   creation per ADR-0011 §9.

**Subsystem 3 idempotency.** Re-running a trigger against a
case that already has a current candidate produces an
**idempotent** result: if the new Subsystem 1 output matches
the current candidate, no new candidate row is emitted (the
existing row is the current pointer); if the new Subsystem 1
output differs, a new candidate row lands with
`supersedes_candidate_id` pointing at the prior row per
ADR-0011 §9. Re-running against an exception-queue case
similarly produces either no change (same exception state) or
a new candidate (re-route to proposed state). The dispatcher's
deduplication is by `(case_id, classifier_output_fingerprint,
domain_state_fingerprint)` — running the same trigger twice
within a small time window with the same fingerprints is a
no-op.

**Telemetry — `router_re_evaluation_fired` audit event
(introduced by this ADR per the Schema deltas section below).**
Each Subsystem 3 dispatcher invocation emits a
`router_re_evaluation_fired` audit event capturing
`(org_id, trigger_type, candidate_count_before,
candidate_count_after, decision_outcome, trace_id)`. This is
distinct from `pre_commit_link_rerouted` (which emits **only
when re-routing actually happens**); the
`router_re_evaluation_fired` event emits on **every** trigger
firing, including no-op re-runs. The two events together provide
the operational visibility for Subsystem 3 — re-evaluation
liveness (every trigger fires) and re-routing outcomes (only
re-routings fire). The event flows through the canonical
audit-log writer per ADR-0011 §1.

### 5. Tier 2.5 read-boundary specifics

The Router's reads against committed state are governed by
ADR-0007 §Tier 2.5 (Read boundary — transactional state and
vendor control fields) and ADR-0011 §11 (vendor-matcher read
boundary verbatim quotation). Restated and made specific:

**Reads the Router performs.**

(a) Open bills with `vendor_id`, `amount_total`,
   `accounting_date`, `lifecycle_state`, `bill_number`,
   `due_date` per ADR-0015's `bills` schema. The Router filters
   by `lifecycle_state IN ('approved_for_payment',
   'partially_paid')` for matching purposes; bills in
   `pending_approval`, `voided`, `cancelled`, or `paid` states
   are excluded from the candidate target set (state transitions
   into these states fire Subsystem 3 triggers per item 4
   above).

(b) Payments with `vendor_id`, `amount_total`, `payment_date`,
   `payment_state`, `payment_method`, `authorization_reference`,
   `bank_or_card_last4` per ADR-0015 §7 reconciliation-metadata
   preservation requirement and ADR-0015 §10's `payments`
   schema. The Router filters by `payment_state IN ('pending',
   'paid')`; `failed` payments per ADR-0015 §8 are excluded
   from the candidate target set.

(c) Vendor prepayments with `vendor_id`, `remaining_balance`,
   `prepayment_type`, `payment_id`, `status` per ADR-0015 §1.
   The Router filters by `status IN ('open',
   'partially_applied')`.

(d) Vendor credits with `vendor_id`, `unapplied_balance`,
   `original_amount`, `status` per ADR-0015 §10. The Router
   filters by `status IN ('open', 'partially_applied')`.

(e) Source documents with `original_content_hash`, `mime_type`,
   `document_type`, `classification_confidence` per ADR-0011 §2
   and ADR-0014 §7. The Router reads classification metadata to
   decide which Subsystem 1 candidate-generation flow to invoke.

(f) Existing `source_document_links` rows for the case's source
   documents — read-only, to detect already-matched documents
   and avoid double-routing per ADR-0016 §1 single-writer rule.
   The Router queries; the Router never INSERTs / UPDATEs /
   DELETEs.

**Vendor-control / payment-risk reads (Tier 2.5 territory).**
The Router MAY read the vendor-control / payment-risk fields on
`vendors`: `bank_account_last4`, `payment_instructions`,
`bank_detail_confirmed_at`, `payment_hold_status`,
`blocked_vendor_status` — per ADR-0007 §Tier 2.5 read boundary
("payment-readiness state, and any extractor that reads them
risks overstepping into payment-risk logic"). Tier 2 stages
(the classifier and extraction pipeline per ADR-0014) MAY NOT
read these fields. The Router consumes them when producing
payment-readiness candidates (e.g., scoring whether a bill is
paying-eligible). Tier 1 re-verifies vendor-control fields at
commit per `agent_architecture_policy.md` §2.3 row (e). The
Router does NOT make payment authorization decisions — those
are domain commit decisions per ADR-0015 §9.

**Reference-data reads (Tier 2 territory, also readable by
Tier 2.5).** The Router MAY read the reference-data fields on
`vendors`: `name`, `aliases`, `tax_id`, `email_domain`,
`address`, `default_account_mapping`,
`historical_template_association` — per ADR-0007 §Tier 2 Read
boundary and ADR-0011 §11. These are the vendor matcher's
inputs (per ADR-0014 §9), and the Router consumes vendor
matcher output for candidate scoring per item 2 above.

**Single-writer rule citations.**

- **`source_document_links`** — `documentLinkService.create()`
  is the sole INSERT path per ADR-0016 §1. The Router NEVER
  writes; the Router queries existing rows to avoid
  double-routing.
- **`journal_entries` and `journal_lines`** — `ledgerService`
  is the sole writer per Reading B
  (`docs/02_specs/ledger_truth_model.md` Service Communication
  Rules + ADR-0011 §8). The Router NEVER writes; the Router
  produces candidates that domain commit paths consume; the
  domain services route the ledger operations through
  `ledgerService.post(...)` inside their `withInvariants()`
  transactions per ADR-0011 §8 three-layer separation.
- **`source_documents` / `source_document_versions` /
  `document_artifacts`** — Document Platform substrate writers
  per ADR-0011 §1 + ADR-0014 §1. The Router NEVER writes; the
  Router reads the existing rows for matching context.
- **`document_relationship_candidates`** — Document Platform
  substrate writer per ADR-0011 §1. The Router IS the writer
  of this table (the Router produces candidate rows). The
  candidate rows are versioned per ADR-0011 §9 with
  `supersedes_candidate_id`; the prior row is preserved.
- **`audit_log`** — canonical audit-log writer
  (`recordMutation` per INV-AUDIT-001 today; any future audit
  service inherits this role) per ADR-0011 §1. The Router
  emits audit events via the canonical writer; the Router
  NEVER inserts into `audit_log` directly.

**Reading B preservation as mechanical, not conventional.**
The Router's read-only-against-ledger contract is mechanically
enforced by ADR-0007 §Tier 2.5 + the Q29 ESLint rule (which
prevents files under `src/agent/pipelines/**/*` from importing
mutating service entry points; the Router code lives under that
directory tree per the Tier 2.5 placement). A future
contributor whose Router code imports `ledgerService.post` or
`documentLinkService.create` gets a build-time failure.

### 6. Stale-state TOCTOU obligations (Q28 surface 3)

The Router runs at proposal-generation time. The Router's
candidate is "best candidate at proposal time"; Tier 1's
contract is "still-valid candidate at commit time." The
distinction is load-bearing because the Router's reads are not
locked — committed state may change between Router invocation
and Tier 1 commit. The TOCTOU window is closed by Tier 1's
re-verification per `agent_architecture_policy.md` §2.3
stale-state TOCTOU re-verification matrix.

**The five sub-cases inherited from ADR-0007 §Q28 expansion
surface 3.** (Restated; the authoritative matrix lives in
`agent_architecture_policy.md` §2.3.)

(a) Bill #N is still in posted state (not paid by another
   mutation while the proposal was pending). Re-call
   `getBill(bill_id) FOR UPDATE` inside the commit
   transaction; verify `lifecycle_state` consistent with the
   proposal's expectation.

(b) `vendor_prepayment` row still has the same
   `remaining_balance`. Re-call
   `getVendorPrepayment(prepayment_id) FOR UPDATE`; verify
   `remaining_balance >= application_amount`.

(c) `vendor_credit` row still has unapplied balance. Re-call
   `getVendorCredit(credit_id) FOR UPDATE`; verify
   `unapplied_balance >= application_amount`.

(d) Ledger period containing the bill's `accounting_date` is
   still open. Layer 1a DB trigger
   `trg_enforce_period_not_locked` runs at insert time;
   service-layer pre-flight `checkPeriod(accounting_date)` for
   ergonomics.

(e) Vendor's `bank_detail_confirmed` flag has not flipped. Re-
   call `getVendor(vendor_id)` at commit; verify
   `bank_detail_confirmed_at` is non-null and not invalidated.

**Where these checks fire.** Inside `withInvariants()` at the
Tier 1 commit boundary per
`agent_architecture_policy.md` §2.3 — Layer 2 for sub-cases
(a), (b), (c), (e); Layer 1a (DB trigger) + Layer 2 pre-flight
for sub-case (d). The Router does NOT perform these checks
itself; the Router's candidate is the proposal-time best, and
Tier 1's re-verification is the commit-time still-valid
guarantee.

**Failure modes per check.** ServiceError raised inside
`withInvariants()`, transaction rolls back via Postgres
ROLLBACK, mutation rejected. The case may then be queued for
human review or re-routed via Subsystem 3 trigger T5 (bill
state transition) / T6 (payment state transition) / T8 (period
reopen) per item 4 above.

**Why the Router does not perform stale-state checks.** The
Router's job is candidate generation — producing a proposal-
time view of the most-likely-correct match. Pushing stale-state
checks into the Router would conflate proposal-time and commit-
time concerns: the Router would either (a) lock rows during its
read (which would block the AP/Spend domain services from
committing while the Router runs, creating an unnecessary
contention surface), or (b) check stale-state at proposal time
without locking (which would not actually close the TOCTOU
window since state could still change between the Router's
check and the Tier 1 commit). The correct division of labor is:
Router proposes; Tier 1 re-verifies inside `withInvariants()`
with `FOR UPDATE` row locks (or DB triggers for period
constraints) where the locking actually closes the TOCTOU
window. This is the same architectural reasoning that motivated
the Tier 2.5 split per ADR-0007 §Amendment.

**A future amendment that pushes stale-state checks into the
Router is conflating proposal-time and commit-time concerns.**
This rule is preserved in Notes for future ADR writers below.

### 7. Integration with ADR-0019 confidence thresholds

The Router consumes thresholds; ADR-0019 (Confidence Calibration
Policy, forthcoming Tier 6 — depends on this Tier 5 ADR) owns
the calibration governance. Three Router decision points consume
thresholds:

(i) **Candidate filtering in Subsystem 1.** Per-document-type
    threshold drops candidates below the threshold. v1
    provisional values per ADR-0014 §7 (Q65):
    `vendor_invoice` 0.85 / `receipt` 0.80 /
    `payment_confirmation` 0.85 / `unknown` always-exception
    (Subsystem 1 not invoked for `unknown`).

(ii) **Propose-vs-exception routing in Subsystem 2.** When the
     post-filter candidate set is empty, the case routes to
     the exception queue per Subsystem 2 branch (c). When the
     post-filter candidate set has at least one candidate
     above threshold, Subsystem 2 proceeds to the
     ambiguity-resolution branch logic.

(iii) **Ambiguity-margin in Subsystem 2.** A single calibrated
      value applied to the difference between the top
      candidate's `confidence_score` and the runner-up's
      `confidence_score`. Margin ≥ threshold →
      propose-the-best (Subsystem 2 branch (a)); margin <
      threshold → propose-with-ambiguity-flag (branch (b)) or
      route-to-exception-queue (branch (c)) depending on the
      candidate cluster size.

**Threshold values vs calibration governance — the split.**

- **Threshold values** for per-document-type confidence are
  owned by ADR-0014 §7 (Q65 v1 provisional values).
- **Ambiguity-margin threshold value** is provisional in this
  ADR, pending ADR-0019 ratification.
- **Calibration governance** — who calibrates, against what
  test set, how often, with what audit trail — is owned by
  ADR-0019 (Q57 closure, forthcoming).

The Router does NOT specify threshold values beyond
inheriting ADR-0014's; the Router specifies the algorithmic
decision points where thresholds gate behavior. An ADR-0019
ratification that adjusts threshold values triggers an ADR-0014
amendment (for per-document-type values) and an ADR-0018
amendment (for the ambiguity-margin value) to match — a routine
maintenance step, not a re-litigation.

## Schema deltas

**ADR-0018 introduces no new platform tables and no new
source-document schema columns. It introduces one audit-event
type: `router_re_evaluation_fired`.** The Router writes to
`document_relationship_candidates` (a table reserved by
ADR-0011 §1 with the versioning semantics owned by ADR-0011
§9); the Router consumes `(linked_entity_type, link_role)`
pair-validity per ADR-0016 §3; the Router emits the
`pre_commit_link_rerouted` audit event whose schema is owned by
ADR-0016 §6.

**One new audit event introduced by this ADR:**
`router_re_evaluation_fired`. Captures Subsystem 3 dispatcher
liveness — every trigger firing emits this event regardless of
whether re-routing actually occurred. Distinct from
`pre_commit_link_rerouted` (which emits only when re-routing
happens) per the discipline that "every trigger fires" and "only
re-routings re-route" are separate operational concerns.

| Event | Fields |
|---|---|
| `router_re_evaluation_fired` | `org_id`, `trigger_type` (one of `T1_new_bill`, `T2_new_payment`, `T3_new_vendor_prepayment`, `T4_new_vendor_credit`, `T5_bill_state_transition`, `T6_payment_state_transition`, `T8_period_reopen`, `T10_manual_override`; reserved post-v1: `T7_vendor_master_merge`, `T9_document_supersession`), `case_id` (the `document_case` that was re-evaluated), `candidate_count_before` (number of candidates the case had before the re-run), `candidate_count_after` (number of candidates after the re-run), `decision_outcome` (one of `no_change`, `re_routed_from_exception`, `re_routed_to_exception`, `candidate_superseded`), `trace_id` |

The event flows through the canonical audit-log writer per
ADR-0011 §1; no service inserts into `audit_log` directly. The
event lands inside the dispatcher's transaction so re-evaluation
telemetry is atomic with any candidate-row mutation.

**No new columns on existing tables.** No new closed enums.
The `re_routing_trigger` field on the existing
`pre_commit_link_rerouted` event (per ADR-0016 §6) is constrained
to the trigger identifier strings T1–T10; the trigger
identifiers are not materialized as a closed enum because they
are an algorithm-level vocabulary owned by this ADR, not a
schema-level enum. If a future ADR-0018 amendment promotes the
trigger identifier to a closed enum (e.g., to enable typed
indexing by trigger type), that amendment introduces the enum
under ADR-0010 reserved-enum-states discipline. The
`decision_outcome` payload value follows the same convention —
a four-string vocabulary (`no_change`, `re_routed_from_exception`,
`re_routed_to_exception`, `candidate_superseded`) documented as
the event's payload constraint, not promoted to a schema-level
closed enum because no service-behavior path branches on the
value; promotion follows ADR-0010 discipline if a future feature
gates behavior on the value.

## Reserved enums and audit events

**Reserved enums introduced by ADR-0018:** None. The Router's
trigger identifiers (T1–T10) are an algorithm-level vocabulary;
v1 ships them as string identifiers in the
`router_re_evaluation_fired` event payload. T7
(vendor_master_merge) and T9 (document_supersession) are
reserved post-v1 trigger identifiers; activation requires
explicit ADR-0018 amendment plus the corresponding upstream ADR
amendment (vendor-master domain ADR for T7; ADR-0016 §2
`superseded_version` activation for T9).

**Reserved audit events introduced by ADR-0018:** One —
`router_re_evaluation_fired` per the Schema deltas section
above. The event ships at v1 with the v1-active trigger
identifiers; reserved trigger identifiers (T7, T9) are valid
event-payload values but no v1 service write path emits them
(the dispatcher does not exist for those triggers in v1).

## Cross-references

- **ADR-0001** (`0001-reversal-semantics.md`) — reversal-as-
  mirror semantics. Cited indirectly: post-commit
  `source_document_links` re-routing follows the supersession-
  via-reversal+recreation pattern per ADR-0016 §5+§6, which
  inherits ADR-0001's reversal-as-mirror discipline.
- **ADR-0007** (`0007-three-tier-agent-architecture.md`) —
  specifically §Tier 2.5 — Read-Only Ledger-Aware Path
  (Router's tier placement); §Amendment (Q66 closure, three-
  option deliberation that produced Tier 2.5); §Q28 expansion
  to four re-verification surfaces (relationship-claim and
  stale-state TOCTOU surfaces are the Router's contracts with
  Tier 1). Carried prerequisite for this ADR.
- **ADR-0010** (`0010-reserved-enum-states.md`) — discipline
  applied to any new enum the Router introduces. v1 introduces
  none; T7 / T9 trigger identifiers reserved post-v1 follow
  this discipline at activation time.
- **ADR-0011** (`0011-document-platform.md`) — §1 entity
  ownership boundary (Router writes to
  `document_relationship_candidates` only; never to
  `source_document_links` / `journal_entries` /
  `journal_lines`); §3 case lifecycle; §7 ProposedAttachment
  contract; §9 lifecycle immutability rules (Router pre-commit
  re-routing is allowed; post-commit goes through
  supersession); §11 vendor-matcher read boundary; §13
  exception queue (Router routes ambiguous and unmatched
  cases here); §14 Domain Boundary Map (post-v1 Banking domain
  expansion of trigger set); §9 lifecycle immutability (cited,
  not redrafted; ADR-0011 §9 owns the immutability boundary
  for the Q76 question; ADR-0018 inherits). Carried prerequisite
  for this ADR.
- **ADR-0012** (`0012-proposed-mutation-bundle.md`) — bundle
  envelope and atomicity. The Router populates a
  `ProposedMutationBundle` for born-paid Scenario C cases per
  ADR-0015 §7 (manual workflow available in v1; automated
  born-paid bundle generation is post-v1); per ADR-0012 §2,
  attachments are not bundle children — the Router's
  candidate that produces a `ProposedAttachment` for the
  receipt attachment is a post-bundle-commit operation.
- **ADR-0014** (`0014-tier-2-document-pipeline.md`) — §6 Tier
  A+C+D classifier output (Q71); §6 per-document-type
  confidence threshold values (Q65 v1 provisional values that
  the Router consumes at Subsystem 1 candidate filtering); §8
  AI fallback contract (Q72) — the classifier's AI fallback
  output is Subsystem 1's input; the Router does not invoke
  the AI fallback itself; §11 match-against-existing-state
  subsystem boundary — ADR-0014's subsystem produces structural
  / reference-data-resolvable candidates that flow as inputs
  to ADR-0018's Subsystem 1 (Ledger-State Candidate Completion);
  ADR-0014 explicitly cites ADR-0018 as the owner of the
  Tier 2.5 completion path. Carried prerequisite for this ADR.
- **ADR-0015** (`0015-ap-spend-subdomain.md`) — §7 Scenarios
  A/B/C (the proposal shapes the Router produces from match
  output); §8 payment failure flow (Trigger T6's source); §10
  link_role consumption (the four v1-active `link_role` values
  the Router proposes); §1 (Q59 vendor prepayment object shape
  — Trigger T3's source); §10 (vendor credit object shape —
  Trigger T4's source); §6 (Q64 final invoice with prior
  deposit — exception case that Trigger T3 may re-route); §9
  (vendor master integration — three-category read-boundary
  split). Carried prerequisite for this ADR.
- **ADR-0016** (`0016-document-relationship-graph.md`) — §1
  `linked_entity_type` enum membership (Router constrained to
  the v1-active subset: `bill`, `bill_line`, `payment`,
  `bill_payment_allocation`, `vendor_prepayment`,
  `vendor_prepayment_application`, `vendor_credit`,
  `vendor_credit_application`); §2 `link_role` enum membership
  (Router constrained to the v1-active subset:
  `primary_invoice`, `payment_evidence`, `receipt`,
  `supporting`); §3 pair-validity matrix (Router proposes
  candidates only for the v1-active cells in Table A; ADR-0016
  §3 owns the authoritative cell counts and full membership);
  §4 `documentLinkService` rejection rules (Router output is
  constrained to active-v1 pairs that the three-layer defense
  accepts); §5 cascade behavior per `linked_entity_type`
  (Trigger T5 / T6 re-evaluation respects the cascade matrix
  at the pre-commit boundary); §6 pre-commit / post-commit
  boundary (Router operates only at the pre-commit boundary;
  post-commit immutability is owned by ADR-0011 §9 + ADR-0016
  §6). Carried prerequisite for this ADR.
- **ADR-0017** (`0017-vendor-template-substrate.md`) — vendor
  template substrate. The Router may consume vendor matcher
  output for candidate scoring per ADR-0011 §11 vendor matcher
  read-boundary inheritance; ADR-0018 does not specify vendor
  template behavior. Tier 4 prerequisite ADR.
- **ADR-0019** (forthcoming, Confidence Calibration Policy) —
  forward-pointer for confidence calibration governance.
  ADR-0019 owns Q57 closure (calibration governance) and the
  ratification process for the per-document-type threshold
  values (jointly with ADR-0014 §7 Q65) and the ambiguity-
  margin threshold value introduced by this ADR. Tier 6
  dependent ADR (depends on this Tier 5 ADR).
- **`docs/02_specs/intent_model.md`** — `ProposedMutation` and
  `ProposedAttachment` shapes; the Four Questions grammar; the
  canonical rule "No entry path has bespoke routing." Cited:
  Subsystem 2's proposal-shape selection rides existing
  primitives; the Router introduces no new entry path.
- **`docs/02_specs/mutation_lifecycle.md`** — canonical
  lifecycle states (Pending, Needs Attention, Approved,
  Posted (auto), Posted (manual), Finalized; terminal Rejected
  and Rejected-with-reversal). The Router introduces no new
  lifecycle vocabulary; pre-commit candidate re-routing is
  not a lifecycle transition (the candidate row supersedes
  via `supersedes_candidate_id` per ADR-0011 §9, which is a
  domain-entity versioning surface, not a mutation-lifecycle
  state).
- **`docs/02_specs/ledger_truth_model.md`** — Reading B
  (Service Communication Rules) — the Router never writes to
  `journal_entries` / `journal_lines`; mutating commit paths
  go through `ledgerService.post(...)` per the three-layer
  separation in ADR-0011 §8.
- **`docs/02_specs/agent_architecture_policy.md`** — Q28
  matrix authoritative source. §2.2 relationship-claim
  re-verification rows are the Router's commit-time contract
  with Tier 1 (Subsystem 2 sub-case (d) cited above); §2.3
  stale-state TOCTOU rows are the Router's commit-time
  contract with Tier 1 for the five sub-cases enumerated in
  item 6.
- **`docs/02_specs/invariants.md`** — INV-AGENT-001
  (Authority Gradient — agents propose, services decide, DB
  enforces; preserved by the Router's read-only Tier 2.5
  contract); INV-AGENT-002 (Logic Receipt — the Router's
  `pipeline_trace` records preserve byte-for-byte
  reproducibility per ADR-0007 §Q30); INV-DOC-001
  (evidence-completeness — the Router's
  `(bill, primary_invoice)` candidate is the supply-side of
  the bill-to-evidence relationship that INV-DOC-001 will
  enforce when registered per Q79). All three invariants are
  reserved candidates per ADR-0007 / ADR-0011 §15 — the
  Router preserves them by contract; registration in
  `invariants.md` is governed by the spec-without-enforcement
  rule.
- **`docs/02_specs/open_questions.md`** — Q56 (closed by this
  ADR per item 4 above); Q66 (already closed by ADR-0007
  §Amendment 2026-05-03 — Router tier placement is Tier 2.5);
  Q76 (partially addressed — Subsystem 3 re-evaluation policy
  cites the immutability boundary owned by ADR-0011 §9 +
  ADR-0016 §6; the immutability rules themselves are not
  redrafted here); Q77 (still open per ADR-0007 §Amendment —
  Q28 matrix expansion lands in
  `agent_architecture_policy.md` before v1 ships).
- **`docs/09_briefs/phase-2/document_platform_reframe_design.md`**
  — §9 (Tier 2 / Tier 2.5 / Tier 1-pre-commit dependency
  framing — three-option deliberation that produced Tier 2.5
  via ADR-0007 §Amendment); §13 Q-list (Q56 and Q66 source).

## Closes

- **Q56 — Relationship Router re-evaluation triggers.** Per
  item 4 (Subsystem 3 — Re-Evaluation Logic) above. Three
  deliverables:

  1. **Domain events trigger list.** Closed list T1–T10. v1-
     active subset: T1 (new bill posts), T2 (new payment
     posts), T3 (new vendor_prepayment posts), T4 (new
     vendor_credit posts), T5 (bill state transition), T6
     (payment state transition), T8 (period reopen), T10
     (manual operator override). Reserved post-v1: T7
     (vendor-master merge), T9 (document supersession).
     Per-trigger contract surfaces enumerated in item 4:
     trigger event source, dispatcher (deterministic
     TypeScript per Q31, NOT LLM-planned), scope of re-
     evaluation (pre-commit cases only — Subsystem 1
     Ledger-State Candidate Completion re-runs against fresh
     state), audit event (`pre_commit_link_rerouted` per
     ADR-0016 §6 with `re_routing_trigger` carrying the trigger
     identifier).

  2. **Audit-trail shape for routing-decision changes.**
     ADR-0016 §6 owns the `pre_commit_link_rerouted` event
     schema; ADR-0018 specifies which Subsystem 3 triggers
     fire it (T1–T6, T8, T10 in v1; T7, T9 reserved post-v1).
     ADR-0018 introduces a parallel
     `router_re_evaluation_fired` event for liveness
     telemetry (every trigger firing emits, regardless of
     re-routing outcome; see Schema deltas above). Post-
     commit re-routing produces supersession-via-reversal+
     recreation per ADR-0016 §5+§6 (cited, not redrafted).

  3. **Which decisions are immutable post-commit.** Owned by
     ADR-0011 §9 + ADR-0016 §6 (cited, not redrafted).
     ADR-0018 inherits and references; pre-commit candidate
     rows supersede via `supersedes_candidate_id` per
     ADR-0011 §9; post-commit `source_document_links` rows
     transition only via `documentLinkService.reverseLinkedEntityLink()`
     per ADR-0016 §5+§6.

## Anti-overscope discipline

ADR-0018 explicitly does NOT close the following boundaries.
Each is owned by another ADR and cited by ADR-0018 at the
integration point.

- **Schema substrate** (`linked_entity_type` enum membership,
  `link_role` enum membership, pair-validity matrix,
  `documentLinkService` rejection rules, cascade behavior, pre-
  commit-vs-post-commit boundary) → owned by ADR-0016. ADR-0018
  consumes the validity matrix at Subsystem 1 candidate
  filtering (item 2); does NOT redraft enum membership or
  matrix cells. The authoritative enum membership (v1-active
  entity types, v1-active link roles, full reserved sets), the
  authoritative pair-validity matrix (v1-active cells, reserved
  cells, invalid cells, total cell counts), and the
  `documentLinkService` rejection rules at all three defense
  layers are all owned by ADR-0016 §1 / §2 / §3. ADR-0018
  cites ADR-0016 §3 by label rather than restating counts to
  avoid count-drift across amendments.

- **Confidence threshold values and calibration governance** →
  threshold values for per-document-type owned by ADR-0014 §7
  (Q65 v1 provisional values); calibration governance owned by
  ADR-0019 (forthcoming, Q57 closure). ADR-0018 consumes
  thresholds at three decision points (item 7) — candidate
  filtering, propose-vs-exception routing, ambiguity margin —
  and provides a provisional ambiguity-margin value pending
  ADR-0019 ratification; does NOT specify per-document-type
  threshold values or governance process.

- **AP/Spend domain decisions** (born-paid bundle workflow,
  manual workflow, Scenarios A/B/C lifecycle, Q60 / Q61 / Q62 /
  Q63 / Q64 / Q74 closures, payment failure flow Q78 closure,
  vendor master integration) → owned by ADR-0015. ADR-0018
  produces candidates that AP/Spend domain commit paths
  consume; does NOT specify domain commit behavior.

- **OCR / extraction / classification behavior** → owned by
  ADR-0014. ADR-0018 consumes Tier 2 classifier output as a
  typed input (item 2 inputs); does NOT specify how the
  classifier produces it. The dedup-by-hash idempotency (Q70),
  document-type classification strategy (Q71), AI fallback
  contract (Q72), and AI fallback re-verification budget are
  all owned by ADR-0014.

- **`ProposedAttachment` primitive** → owned by ADR-0011 §7.
  ADR-0018 produces candidates that consumers (AP/Spend domain
  commit paths) wrap into `ProposedAttachment`; does NOT
  introduce a new proposal primitive.

- **`source_document_links` writes** → owned by
  `documentLinkService.create()` per ADR-0016 §1 single-writer
  rule. ADR-0018 NEVER writes; produces candidates;
  `documentLinkService.create()` commits.

- **Vendor template substrate / autonomy** → owned by ADR-0017.
  ADR-0018 may consume vendor matcher output for candidate
  scoring (per ADR-0011 §11 vendor matcher read-boundary
  inheritance); does NOT specify vendor template behavior or
  autonomy thresholds.

- **Q28 matrix expansion** → owned by
  `agent_architecture_policy.md` (Phase 0 governance plan Task
  E2). ADR-0018 cites Q28 surface 2 (relationship-claim re-
  verification) and Q28 surface 3 (stale-state TOCTOU) as the
  Router's commit-time contract with Tier 1; does NOT redraft
  the matrix or close Q77. Q28's full closure is gated on the
  matrix landing in `agent_architecture_policy.md` per Q77, a
  v1-ship gate not v1-code gate per ADR-0007 §Updates.

- **Q66 closure venue.** Q66 (Relationship Router tier
  placement) is closed by ADR-0007 §Amendment per the 2026-05-
  03 ratification — option (b) Tier 2.5. ADR-0018 inherits
  the closure; does NOT re-close.

- **Q76 closure venue.** Q76 (immutability boundary) is owned
  by ADR-0011 §9 + ADR-0016 §6. ADR-0018
  inherits the immutability boundary; does NOT redraft. The
  Subsystem 3 re-evaluation policy in item 4 above operates
  within the immutability boundary (pre-commit re-routing
  allowed; post-commit goes through supersession), but the
  boundary itself is not closed by this ADR.

## Consequences

### What this enables

- The Relationship Router ships with a complete algorithmic
  contract that authorizes its read-against-committed-state
  pattern while constraining its write-side to zero —
  preserving Reading B at the substrate layer.
- The three-subsystem decomposition makes the Router
  testable as three concerns: Subsystem 1 candidate
  generation tests are stable across runs (deterministic
  feature extraction + scoring); Subsystem 2 ambiguity-
  resolution tests are independent of candidate generation
  (the inputs are candidate sets, the outputs are decisions);
  Subsystem 3 re-evaluation tests are independent of both
  (the inputs are domain events, the outputs are dispatch
  decisions).
- The closed list of v1 re-evaluation triggers (T1–T10; v1-
  active subset 8 of 10) bounds the operational complexity:
  every trigger fires through a named TypeScript dispatcher
  with named audit events; no implicit re-evaluation paths;
  no LLM-planned dispatch.
- The `router_re_evaluation_fired` event provides liveness
  telemetry for Subsystem 3 — every trigger firing is
  observable, including no-op re-runs. Combined with
  `pre_commit_link_rerouted` (which fires only on actual re-
  routing), the operational visibility distinguishes "trigger
  did not fire" (a Subsystem 3 bug) from "trigger fired but
  found nothing" (a candidate-set state).
- Post-v1 trigger activation (T7 vendor-master merge, T9
  document supersession) follows the same reserved-enum-
  states discipline pattern as ADR-0010 — explicit amendment,
  not silent activation. The seats are reserved at v1; the
  dispatchers do not exist; activation is a future ADR-0018
  amendment plus the corresponding upstream ADR amendment
  (vendor-master domain ADR for T7; ADR-0016 §2
  `superseded_version` activation for T9).
- The Tier 2.5 read-boundary specifics (item 5 above) make
  the Router's read pattern auditable: the named reads are
  the only legitimate Router reads; any Router code that
  reads other tables is overstepping the contract and should
  be flagged in code review or at the Q29 ESLint boundary.
- Stale-state TOCTOU obligations (item 6 above) are
  distributed correctly between Router and Tier 1: the
  Router proposes; Tier 1 re-verifies inside
  `withInvariants()` with row locks. The TOCTOU window is
  closed mechanically, not by Router-side optimistic checks
  that would not actually close the window.

### What this constrains

- The Router's read boundary is strict. Every read against
  committed state must be a read the Tier 2.5 contract
  authorizes (item 5 above). A future Router feature that
  needs to read a table not enumerated in item 5 requires an
  ADR-0018 amendment plus, if the table is in a different
  domain, the corresponding domain ADR amendment.
- LLM-planned matching is prohibited (Q31 inheritance). A
  future Router amendment that proposes "use an LLM to plan
  Subsystem 1 candidate generation" or "use an LLM to decide
  Subsystem 2 ambiguity resolution" or "use an LLM dispatcher
  for Subsystem 3 triggers" is proposing a Q31 violation.
- The single-writer rules for `source_document_links` and
  `journal_entries` / `journal_lines` are mechanical
  (enforced by the Q29 ESLint rule for the source path; by
  Reading B service-layer separation for the ledger path). A
  future Router amendment that proposes direct writes to
  either is proposing the same violation as a Reading B
  violation — and the build-time failure surfaces the
  violation immediately.
- Stale-state checks fire at Tier 1, not in the Router. A
  future Router amendment that pushes stale-state checks into
  the Router is conflating proposal-time and commit-time
  concerns; the rule is preserved in Notes for future ADR
  writers below.
- The closed list of triggers (T1–T10) bounds Subsystem 3's
  operational surface. Adding a new trigger (e.g., a Banking-
  domain trigger when Banking enters v1-active per ADR-0011
  §14) requires an ADR-0018 amendment that specifies the
  trigger event source, the dispatcher, the scope of re-
  evaluation, and the audit event identifier — same pattern
  as the existing T1–T10 contract surface.
- The ambiguity-margin threshold value is provisional in v1,
  pending ADR-0019 ratification. v1 ships with the
  Router-implementation default; the calibration governance
  for ongoing post-ratification adjustment is forward-pointed
  to ADR-0019.

### What this costs

- One new audit event (`router_re_evaluation_fired`) — schema
  delta in the audit-event taxonomy (per ADR-0011 §1
  canonical audit-log writer); test surface (every Subsystem
  3 dispatcher invocation must emit the event); operational
  visibility surface (a forensic query "show me every
  Subsystem 3 firing for this case" reads this event).
- The closed list of triggers (T1–T10; v1-active 8) is an
  obligation: every named trigger must have a working
  dispatcher in v1 for the v1-active subset. The reserved
  triggers (T7, T9) cost zero v1 implementation but cost
  the discipline of preserving the seats in this ADR.
- The three-subsystem decomposition is an architectural
  obligation: the Router's TypeScript module must surface the
  three subsystems as separately-testable units. A
  monolithic-Router implementation that conflates the three
  concerns is a violation of the contract.
- The pipeline_trace records (`router_match_against_state`,
  `router_ambiguity_resolution`, plus the trigger-driven
  re-runs) are obligations on the Logic Receipt rendering
  per ADR-0007 §Q30 — the Router's trace records render in
  the Logic Receipt UI and contribute to byte-for-byte
  reproducibility.
- The provisional ambiguity-margin value pending ADR-0019
  ratification is a pre-v1-ship obligation: ADR-0019 must
  ratify the value at v1 ship time per the Q77 v1-ship-gate
  pattern.

## Alternatives considered

### Alternative 1 — LLM-planned matching coordinator

A Router design where an LLM coordinator decides which match
strategy to apply, in what order, and how to combine results.
Rejected. Per Q31, LLM-planned orchestration is prohibited at
Tier 2 / Tier 2.5. The reasoning that motivated Q31's framing
applies verbatim: an LLM coordinator weakens the deterministic
TypeScript-orchestration contract, produces non-reproducible
Logic Receipts (the orchestration plan itself becomes part of
the trace and varies across runs), and reintroduces the
multi-agent dynamic-dispatch pattern that the three-tier policy
is designed to prevent. A future contributor who proposes "my
LLM coordinator is just a typed function" is proposing the
violation Q31 was filed to prevent.

### Alternative 2 — Single-pass matching with no re-evaluation

A simpler Router that runs Subsystem 1 once per document_case,
emits a candidate or routes to exception, and never re-runs.
Rejected. This shape strands documents whose match target
arrives later — a receipt arrives before its bill posts; the
single-pass Router routes the receipt to the exception queue;
the bill posts an hour later; the receipt remains stuck in the
exception queue with no path back to proposed state except
manual operator intervention. Q56 was filed specifically
because the single-pass shape creates this stranding failure
mode: "When a previously unmatched document gets re-classified
after new domain state lands ... which domain events trigger
Router re-runs?" Subsystem 3's re-evaluation logic is the
answer; rejecting this alternative is the closure direction.
The cost (a closed list of triggers + a dispatcher per trigger)
is the price for liveness.

### Alternative 3 — Trigger-based re-evaluation via DB triggers vs deterministic TypeScript dispatcher

A Router design where Subsystem 3 re-runs are driven by
Postgres triggers on the AP/Spend domain tables (e.g., an
INSERT trigger on `bills` fires the Router's Subsystem 1 for
all open exception cases for the new bill's vendor). Rejected.
DB triggers bypass the single-writer rule pattern: the Router's
`document_relationship_candidates` writes would land outside the
service-layer transaction that produced the trigger source
event, breaking the audit-event-emission discipline (the
`pre_commit_link_rerouted` event would land outside
`withInvariants()`, losing atomicity with the candidate-row
write). DB triggers also conflict with ADR-0007 Q31 — a
TypeScript-orchestrated dispatcher is the deterministic-
orchestration shape the policy mandates; pushing re-evaluation
into DB triggers fragments the orchestration across two
languages and two enforcement layers. The deterministic
TypeScript dispatcher preserves audit-event emission inside the
service transaction per ADR-0016 §6 framing and keeps the
orchestration in one place.

## Notes for future ADR writers

- **The Tier 2.5 contract is the load-bearing safety
  boundary.** Future Router amendments that add LLM-planned
  matching are proposing Q31 violations. The Q31 verbatim rule
  (per ADR-0007 §Tier 2 safety contract item 6) applies to
  Tier 2 and Tier 2.5 equally. A future contributor whose
  amendment text reads "the Router's matching is enhanced by
  LLM planning of stage order" is proposing the violation.

- **The single-writer rule for `source_document_links` is
  mechanical.** Future Router amendments that propose direct
  writes are proposing the same violation as a Reading B
  violation. The Q29 ESLint rule on
  `src/agent/pipelines/**/*` would catch the import; the
  Reading B service-layer separation would catch the
  ledger-side equivalent. Both checks are mechanical, not
  conventional.

- **The re-evaluation trigger set (T1–T10) is the closed v1
  set + reserved post-v1.** Activation of T7 / T9 follows the
  same reserved-enum-states discipline pattern as ADR-0010 —
  explicit amendment, not silent activation. A future ADR-0018
  amendment that activates T7 must also reference the
  vendor-master domain ADR that introduces the merge surface;
  a future amendment that activates T9 must reference the
  ADR-0016 §2 amendment that activates the
  `superseded_version` `link_role`.

- **The Q28 surface 3 stale-state checks fire at Tier 1
  commit boundary, not in the Router.** A future amendment
  that pushes stale-state checks into the Router is conflating
  proposal-time and commit-time concerns. The Router's job is
  "best candidate at proposal time"; Tier 1's job is "still-
  valid candidate at commit time." Pushing checks into the
  Router either creates false confidence (checks without row
  locks do not close the TOCTOU window) or creates contention
  (locks held during the Router's run block domain commits).
  The architectural reasoning is the same as the Tier 2.5
  split per ADR-0007 §Amendment.

- **T7 vendor-master merge activation** is gated on the future
  vendor-master domain ADR (cite Q33 forward-pointer to the
  agent-runtime refactor and the future vendor-master domain
  ADR). v1 has no vendor-master merge surface; activation is
  not a v1 concern. The seat is reserved here so a future
  amendment can activate without re-litigating the trigger
  contract.

- **T9 document-supersession activation** is gated on
  ADR-0016 §2 `superseded_version` link-role activation. v1's
  versioning model captures supersession through the
  `current_version_id` pointer on `source_documents`; the
  link-role-driven supersession is post-v1.

- **Banking-domain post-v1 expansion of trigger set.** When
  `bank_transaction` / `card_transaction` enter the v1-active
  `linked_entity_type` subset (per ADR-0011 §14 Domain
  Boundary Map; post-v1 Banking domain ADR), new triggers
  enter the closed set. The expansion shape — a new trigger
  T_n whose trigger event source is the Banking domain
  service, whose dispatcher consumes the event, whose scope
  is bank/card-statement reconciliation cases, whose audit
  event is `pre_commit_link_rerouted` with
  `re_routing_trigger = 'T_n_<name>'` — follows the same
  contract surface as T1–T10.

- **The provisional ambiguity-margin value is a pre-v1-ship
  obligation.** ADR-0019 must ratify the value at v1 ship
  time per the Q77 v1-ship-gate pattern. The same provisional-
  pending-v1-ship pattern as ADR-0014 §7 (Q65 values) and
  ADR-0007 §Q77 (Q28 matrix). If ratification adjusts the
  value, ADR-0018 amends to match — a routine maintenance
  step, not a re-litigation.

- **The three-subsystem decomposition is testable
  architecture, not just narrative organization.** The
  Router's TypeScript module must surface the three
  subsystems (Ledger-State Candidate Completion / Ambiguity
  Resolution / Re-Evaluation Logic) as separately-callable,
  separately-testable units. A future implementation that
  conflates Subsystem 1 candidate completion with Subsystem 2
  ambiguity resolution loses the ability to test
  ambiguity-resolution decisions against fixed candidate sets,
  and loses the ability to test Subsystem 3 re-evaluation
  against fixed Subsystem 1 outputs. The decomposition is
  load-bearing for the test surface, not just the
  Decision-section presentation.

- **The cross-ADR boundary with ADR-0014 §11 is mechanical,
  not conventional.** ADR-0014's match-against-existing-state
  subsystem produces structural / reference-data-resolvable
  candidates; ADR-0018's Subsystem 1 (Ledger-State Candidate
  Completion) consumes those candidates and completes them via
  Tier 2.5 reads. A future contributor who proposes that
  ADR-0018's Subsystem 1 read reference data directly (vendor
  identity, chart of accounts, tax codes) is duplicating
  ADR-0014's responsibility; the inputs to ADR-0018's
  Subsystem 1 already carry that resolved data per ADR-0014
  §11. A future contributor who proposes that ADR-0014's
  match-against-existing-state subsystem read transactional
  state (open bills, payments) is proposing a Tier 2 vs Tier
  2.5 boundary violation per ADR-0007 §Tier 2.5; the
  transactional reads belong in ADR-0018's Subsystem 1, not
  ADR-0014's.

- **The Router's read boundary is the closed list in item 5,
  not "anything in the AP/Spend schema."** A future feature
  that needs the Router to read a new table (e.g., a future
  reconciliation-state table) requires an ADR-0018 amendment
  that adds the read to item 5. The closed-list discipline
  prevents the Router from accumulating ad-hoc reads that
  would make the Tier 2.5 read boundary effectively
  open-ended — which would defeat the purpose of the Tier
  2.5 split per ADR-0007 §Amendment.
