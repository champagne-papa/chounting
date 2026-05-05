# ADR-0017: Vendor Template Substrate (substrate-only v1)

## Status

Ratified 2026-05-04 by CTO with named follow-ups per D4 ratification package §3.3.

## Date

2026-05-04

## Triggered by

Phase 0 governance plan Task C9 (Tier 4 — depends on ADR-0007
ratification 2026-05-03, ADR-0010 (already accepted 2026-04-24),
ADR-0011 ratification 2026-05-03, ADR-0012 ratification
2026-05-03, ADR-0013 ratification 2026-05-03, ADR-0014
ratification 2026-05-03, and the Layer-4 amendment at commit
`84691d5` registering INV-AGENT-006 + `agent_autonomy_model.md`
§6 row 7; sibling to ADR-0015 drafted at commit `c036c31` on
2026-05-03 and ADR-0016 drafted at commit `ccfc6da` on 2026-05-04).
The 2026-05-02 Document Platform reframe spec
(`docs/09_briefs/phase-2/document_platform_reframe_design.md`) named
the Vendor Template substrate as one of the eight ADRs in the
eight-ADR Phase 0 set per §7. ADR-0011 §Forward-pointed Q60 entry
forward-pointed the post-v1 portion of Q60 to this ADR; ADR-0012 §13
explicitly forward-pointed Q60's auto-post calibration / promotion
threshold / vendor-rule promotion authority to ADR-0017; ADR-0015 §2
closed the v1 portion of Q60 (Always Confirm for `born_paid_bill`)
and forward-pointed the post-v1 portion to this ADR per its Closes
table entry. ADR-0017 inherits the post-v1 substrate seat for
`vendor_rules.clean_approval_count` named explicitly by ADR-0015 §2.

ADR-0017 carries one mechanism — the vendor template substrate —
and a deliberately narrow specification attached to that mechanism:
the `vendor_rules` table schema with its full v1 column set, two
closed enums (`vendor_rule_rung` mirroring `agent_autonomy_model.md`
§4 ladder and `vendor_rule_promotion_authority` mirroring §4.1
controller-vs-owner discriminator) shipping at v1 schema time per
ADR-0010 reserved-enum-states discipline, the single-writer rule
for `vendor_rules` analogous to Reading B for the ledger and to the
single-writer rule for `source_document_links` from ADR-0016, and a
v1-no-enforcement contract: no v1 service write path consumes
`vendor_rules` columns for autonomy decisions. Substrate ships at
v1 schema time; full enforcement (auto-post calibration,
promotion / demotion authority, learning-loop governance) is
deferred past Phase 0 and is explicitly NOT in ADR-0017's scope.

## Context

### Why a Vendor Template substrate ADR exists (substrate-only v1)

The Phase 0 sequencing produces a tension that ADR-0017 resolves:
the post-v1 phase needs a place to stand when it builds vendor
template enforcement (auto-post calibration thresholds for
`born_paid_bill` bundles, controller promotion ceremonies for
specific vendor-rule rules, demotion-trigger rules per-rule
rejection-rate thresholds, learning-loop governance for human
correction → template candidate → shadow mode → approval/versioning
→ rollback). That place to stand is a schema substrate — a
`vendor_rules` table with a column set the post-v1 enforcement can
consume. Without the substrate at v1, the post-v1 enforcement work
has to migrate the schema before it can wire any service path; with
the substrate at v1, the post-v1 enforcement can ship enforcement
contracts against an existing column set.

The substrate ships at v1; the enforcement (which would consume
the substrate for auto-post / promotion / demotion decisions) does
not. Specifically: no v1 Tier 1 commit path consults
`vendor_rules.current_rung` to decide whether to skip the bundle
approval gate for `born_paid_bill`; no v1 Tier 2 stage reads
`vendor_rules.clean_approval_count` to score a match candidate; no
v1 promotion ceremony fires; no v1 service path emits a
`vendor_rule_promoted` audit event. The columns exist in the
schema; the autonomy logic that would consume them does not yet
exist as v1 service code.

The reason for this split is consistent with three other Phase 0
substrate-now-enforcement-later decisions:

1. **ADR-0014 Tier B (small classifier) reservation post-v1.** The
   Tier B small-model classifier was reserved post-v1 because a
   labeled training corpus does not exist at v1; v1 generates the
   corpus through Tier A LLM-based classification, and Tier B
   activates when sufficient labeled data has accumulated. The
   substrate that supports Tier B (the document-classification
   confidence column on the pipeline's intermediate state) ships at
   v1; the Tier B service code does not.
2. **Q23 promotion thresholds fixed for v1** per
   `agent_autonomy_model.md` §4.2. The thresholds (≥ 15 matches,
   ≥ 95% approval rate, 30-day evaluation window) are
   system-fixed for v1 because tuning them requires observed
   real-org promotion behavior that v1 will produce; the
   threshold-tuning machinery is reserved for post-v1.
3. **Q57 confidence calibration governance forward-pointing to
   ADR-0019.** ADR-0014 set v1-fixed confidence thresholds and
   forward-pointed the calibration governance to ADR-0019; the
   post-v1 calibration policy needs labeled outcome data v1
   generates, so the calibration substrate ships at v1 (the
   threshold values live in `org_settings.*` columns) and the
   calibration governance ships post-v1.

The `vendor_rules` substrate is the fourth application of the same
pattern: post-v1 vendor-template enforcement requires a labeled
corpus of vendor-rule outcomes (which `born_paid_bill` bundles for
which vendors got controller-approved cleanly across N consecutive
attempts; which got rejected with what reason) that v1 will
produce by routing every `born_paid_bill` bundle through Always
Confirm and capturing the controller's accept/reject decision in
the canonical audit trail. ADR-0017's substrate gives the post-v1
enforcement work a column set to consume; v1 generates the corpus
through the existing Always Confirm flow without any v1 service
path consuming the column set itself.

### Phase 0 dependency context and Reading B preservation

ADR-0017 sits in Tier 4 alongside ADR-0015 (AP/Spend Subdomain,
drafted at commit `c036c31`) and ADR-0016 (Document Relationship
Graph, drafted at commit `ccfc6da`). All three depend on ADR-0011
(the spine — entity ownership, `source_documents` schema,
`source_document_links` discipline at the spine level,
exception-queue routing, audit-log writer boundary, lifecycle
immutability, vendor-matcher read boundary at §11,
ProposedAttachment contract); on ADR-0010 (reserved-enum-states
discipline applied verbatim to both enums this ADR introduces);
on ADR-0007 (three-tier agent architecture, particularly the
Tier 1 commit-path discipline that re-verifies vendor-control
fields and the Tier 2 read-boundary three-category split that
constrains when matcher stages may read `vendor_rules`); on
ADR-0012 (bundle envelope, bundle-effective ceiling, bundle-type
enum membership including `born_paid_bill`); and on ADR-0014
(Tier 2 pipeline, vendor matcher implementation, classification
strategy). ADR-0017 is a sibling to ADR-0015 and ADR-0016 — none
of the three depends on either other ratifying first; the Tier 4
trio ratifies as a package per the Phase 0 sequencing.

ADR-0017 also depends on the Layer-4 governance amendment at
commit `84691d5` that registered INV-AGENT-006 in
`agent_autonomy_model.md` §10 and added `agent_autonomy_model.md`
§6 row 7 (vendor bank-detail change as System ceiling). That
amendment is the load-bearing constraint on what the vendor
template substrate cannot do: the substrate shipped here cannot
authorize any post-v1 enforcement that would move a vendor
bank-detail change away from controller confirmation, and cannot
extend autonomy across any of the seven System ceiling rows in
`agent_autonomy_model.md` §6. The substrate is for promotion of
non-ceiling mutations (specifically, post-v1 promotion of
`bundle_type = 'born_paid_bill'` rules from Always Confirm to
Notify & Auto-Post for trusted vendors); it cannot raise the
System ceiling for any bundle child or any standalone mutation.

ADR-0017 inherits the upstream contracts verbatim and does not
re-litigate any upstream decision. Per ADR-0011 §8 and Reading B
from `ledger_truth_model.md` Service Communication Rules: domain
services own domain logic; the ledger service is the sole writer
of `journal_entries` and `journal_lines`; both run inside
`withInvariants()` per Service Communication Rule 1. ADR-0017
inherits Reading B verbatim and adds its own corresponding
single-writer rule: **`vendorRuleService` is the sole writer of
`vendor_rules`** (item 2 in Decision below). The single-writer
rule mirrors the ADR-0016 pattern for `source_document_links` and
extends Reading B's architectural separation to the vendor-rule
substrate at the schema layer.

### What ADR-0007 / ADR-0010 / ADR-0011 / ADR-0012 / ADR-0014 / ADR-0015 / ADR-0016 already nailed down (do not redraft)

- **ADR-0007** — three-tier agent architecture; Tier 1 commit-path
  re-verification; Tier 2 read boundary three-category split for
  vendor master fields. ADR-0017 inherits the architecture
  verbatim and does NOT introduce a fourth tier or re-categorize
  vendor-master read access.
- **ADR-0010** — reserved-enum-states discipline. Three-layer
  defense (DB CHECK, Zod boundary, service emission) applied
  verbatim to both enums this ADR introduces. ADR-0017 does NOT
  redraft the discipline; it applies it to `vendor_rule_rung` and
  `vendor_rule_promotion_authority`.
- **ADR-0011 §1** — entity ownership boundary. AP/Spend owns
  `vendors` and the bills / payments / prepayments / credits
  tables. ADR-0017's `vendor_rules` substrate is AP/Spend-owned
  per the per-vendor-per-bundle-type cardinality and the
  vendor-master locality: a `vendor_rules` row is keyed on
  `(org_id, vendor_id, bundle_type)` and the natural ownership is
  with the domain that owns `vendors`. ADR-0017 inherits the
  entity-ownership boundary verbatim.
- **ADR-0011 §11** — vendor-matcher read boundary. The Tier 2
  vendor matcher reads vendor identity-and-matching fields ONLY;
  the Tier 2.5 Relationship Router may read vendor control /
  payment-risk fields when producing payment-readiness candidates;
  Tier 1 re-verifies all vendor-control fields at commit. ADR-0017
  inherits the three-category split verbatim and does NOT propose
  any new read-boundary categories. `vendor_rules` is
  identity-and-matching territory (vendor history patterns; not
  vendor payment-risk control state) — see item 6 in Decision
  below for the full inheritance argument.
- **ADR-0012 §12** — `bundle_type` enum membership; v1 active
  value is `born_paid_bill`. ADR-0017's `vendor_rules.bundle_type`
  column references the closed `bundle_type` enum from ADR-0012;
  v1 `vendor_rules` rows carry `bundle_type = 'born_paid_bill'`
  exclusively (the only v1-active bundle type per ADR-0012 §12).
- **ADR-0012 §13** — approval gate framework; auto-post deferred
  past v1; Q60 split between ADR-0015 v1 portion and ADR-0017
  post-v1 portion. ADR-0012 §13 explicitly named ADR-0017 as the
  owner of the post-v1 calibration substrate; ADR-0017 ships that
  substrate.
- **ADR-0014 §9** — vendor-matcher pipeline integration with
  ADR-0011 §11 inheritance. ADR-0017's `vendor_rules` table is
  read-eligible by the Tier 2 matcher under the
  identity-and-matching category (item 6 below); the v1 matcher
  does not currently read `vendor_rules` for autonomy purposes
  because v1 has no autonomy enforcement to drive.
- **ADR-0015 §2** — Q60 v1 closure (Always Confirm for
  `born_paid_bill`); explicit forward-pointer to ADR-0017 for the
  post-v1 substrate seat including the `clean_approval_count`
  column on `vendor_rules`. ADR-0017 honors the forward-pointer:
  `clean_approval_count` is in the v1 column set per Decision item
  1 below. ADR-0015 §9 also ratifies the AP/Spend ownership of
  `vendors` master mutations including INV-AGENT-006 enforcement;
  ADR-0017 inherits this verbatim and does NOT amend vendor
  master mutation rules.
- **ADR-0016** — Document Relationship Graph schema substrate;
  `linked_entity_type` / `link_role` enums; pair-validity matrix;
  cascade behavior. ADR-0016 is orthogonal to ADR-0017: the
  document relationship graph is a separate substrate from the
  vendor-rule substrate, and there is no schema-side dependency
  between the two. ADR-0017 cites ADR-0016 only for sibling-trio
  context and for the substrate-only-v1 anti-overscope precedent.

### Reading B preservation as load-bearing constraint for ADR-0017

Reading B is the architectural constraint that ADR-0017 holds at
the vendor-rule layer. The corresponding rule for ADR-0017 is the
**single-writer rule for `vendor_rules`**: `vendorRuleService` is
the only function that inserts rows into `vendor_rules`. No
domain code path writes to `vendor_rules` directly. No Tier 2
stage writes to `vendor_rules` directly. No agent tool writes to
`vendor_rules` directly. The only v1 write path is
`vendorRuleService.create()`, which seeds a row when a vendor's
first `bundle_type = 'born_paid_bill'` proposal lands in the
Always Confirm gate (the seed exists for diagnostic purposes
only; no v1 autonomy logic consumes it).

The single-writer rule is the vendor-rule analog of Reading B for
the ledger and of the single-writer rule from ADR-0016 for
`source_document_links`. Just as Reading B prevents domain
services from writing journal entries directly (only
`ledgerService.post(...)` inserts into `journal_entries`), and
just as ADR-0016's single-writer rule prevents domain services
from writing link rows directly (only `documentLinkService` inserts
into `source_document_links`), the single-writer rule for
`vendor_rules` prevents domain services from writing vendor-rule
rows directly (only `vendorRuleService` inserts into
`vendor_rules`). The pattern is consistent across all three
substrate tables that the Phase 0 ADR set introduces; future
substrate tables in subsequent ADRs are expected to follow the
same single-writer pattern.

## Decision

The Decision is presented as seven items. Item 1 is the
substrate's `vendor_rules` table schema with column rationale.
Item 2 is the single-writer rule per `vendorRuleService`. Item 3
is the v1 read posture (no autonomy decisions consume the
substrate; columns are queryable for diagnostics). Item 4 is the
post-v1 enforcement forward-pointer (what enforcement adds; not
specified here). Item 5 is the closed enum membership for
`vendor_rule_rung` and `vendor_rule_promotion_authority`. Item 6
is System ceiling preservation. Item 7 is vendor matcher
read-boundary inheritance.

### 1. `vendor_rules` table substrate (Q60 post-v1 portion closure)

The `vendor_rules` table is the AP/Spend-owned schema seat that
post-v1 vendor template enforcement will consume. Substrate ships
at v1 schema time; no v1 service write path consumes the columns
for autonomy decisions; columns are queryable for diagnostic
purposes only.

**Schema shape (new — owned by ADR-0017, AP/Spend-domain
ownership per ADR-0011 §1).**

```
vendor_rules (
  id                            uuid primary key,
  org_id                        uuid not null references orgs,
  legal_entity_id               uuid null references legal_entities, -- multi-entity reservation per ADR-0011 §10; v1 fills with org_id
  vendor_id                     uuid not null references vendors,
  bundle_type                   bundle_type not null,             -- closed enum from ADR-0012 §12
  current_rung                  vendor_rule_rung not null
                                  default 'always_confirm',       -- closed enum, see item 5
  promotion_authority           vendor_rule_promotion_authority null, -- closed enum, see item 5
  clean_approval_count          integer not null default 0,       -- per ADR-0015 §2 forward-pointer
  last_clean_approval_at        timestamptz null,                 -- audit anchor for the count
  rejection_count               integer not null default 0,       -- rejection-rate-window numerator
  last_rejection_at             timestamptz null,                 -- rejection-rate-window anchor
  promoted_at                   timestamptz null,                 -- audit anchor for promotion ceremony
  promoted_by                   uuid null references users,       -- controller / owner who promoted
  demoted_at                    timestamptz null,                 -- audit anchor for demotion
  demoted_by                    uuid null references users,       -- controller who demoted
  created_at                    timestamptz not null default now(),
  created_by                    text not null,                    -- 'agent' or user_id
  trace_id                      uuid not null,
  unique (org_id, legal_entity_id, vendor_id, bundle_type)
);
```

**Column rationale.**

- `id`, `org_id`, `vendor_id` — the natural composite-key shape:
  one rule row per (org, legal_entity, vendor, bundle_type) — see
  `legal_entity_id` rationale below for the multi-entity dimension.
  The `vendor_id` references the AP/Spend-owned `vendors` table
  per ADR-0011 §1.
- `legal_entity_id` — multi-entity reservation per ADR-0011 §10.
  Nullable at the schema level for post-v1 multi-entity workflows;
  v1 service path (`vendorRuleService.create()`) populates with
  `org_id` so the unique constraint composes mechanically — same
  pattern as ADR-0011 §10's `source_documents.legal_entity_id`
  ("Defaults to `org_id` in v1 where the org-entity mapping is
  1-1"). Post-v1 multi-entity service path resolves the actual
  legal_entity_id from the bundle's child mutations (a born-paid
  bundle whose bill posts to legal_entity X carries
  legal_entity_id=X on its vendor_rules row). The column exists
  at v1 schema time so post-v1 activation does not require a
  schema migration; rule history accumulated in v1 carries the
  multi-entity-ready key shape from the start.
- `bundle_type` — references the closed `bundle_type` enum from
  ADR-0012 §12. v1 active value is `born_paid_bill`; reserved
  values (`final_invoice_with_applied_deposit`,
  `vendor_credit_applied_to_bill`) ship in the enum per ADR-0010
  but no v1 `vendor_rules` row carries them (the corresponding
  bundle types are reserved at v1 per ADR-0012 §12). The column
  exists at v1 schema time so post-v1 activation of additional
  bundle types does not require a column migration.
- `current_rung` — the rule's current rung position on the Agent
  Ladder per `agent_autonomy_model.md` §4. v1 default is
  `always_confirm` (the §4 default rung for all new rules); v1
  emits only `always_confirm` because no v1 promotion ceremony
  fires. Per ADR-0010 the column ships with NOT NULL DEFAULT
  `'always_confirm'` so seeded rows have a valid value at insert.
- `promotion_authority` — nullable at v1 because no v1 row carries
  a non-null value (no promotion has happened yet). The column
  exists so post-v1 promotion ceremonies can record which authority
  level (controller for Notify & Auto-Post per
  `agent_autonomy_model.md` §4.1; owner for Silent Auto per §4.1)
  authorized the promotion. The closed enum membership lands in
  item 5 below.
- `clean_approval_count` — the column ADR-0015 §2 explicitly
  forward-pointed. NOT NULL DEFAULT 0; v1 increments are NOT
  performed by any v1 service path (see item 3 below); the column
  exists so post-v1 enforcement can read it for promotion-eligibility
  scoring. The corpus of clean approvals lives in the audit log at
  v1 (every `born_paid_bill` controller approval emits a
  `bundle_approved` audit event per ADR-0012); post-v1 enforcement
  derives the count from the audit corpus and writes it back into
  `clean_approval_count` for fast lookup.
- `last_clean_approval_at` — audit anchor for the count's window.
  Nullable; v1 never sets it because no v1 service path increments
  `clean_approval_count`.
- `rejection_count` and `last_rejection_at` — the per-rule
  rejection-rate-window numerator and anchor. Per
  `agent_autonomy_model.md` §4.3 demotion is one-click immediate
  and does not require a count; the rejection counters here are
  for post-v1 demotion-trigger thresholds (the per-rule
  rejection-rate threshold for promoted bundle rules forward-pointed
  by ADR-0015 §2). v1 never increments these; nullable / DEFAULT 0
  at v1 schema time.
- `promoted_at`, `promoted_by`, `demoted_at`, `demoted_by` — audit
  anchors for the post-v1 promotion ceremony per
  `agent_autonomy_model.md` §4.1 and demotion per §4.3. Nullable
  at v1 because no v1 ceremony fires. Post-v1 ceremonies populate
  these columns inside the same transaction as the
  `vendor_rule_promoted` / `vendor_rule_demoted` audit-event
  emission (item 5 below).
- `created_at`, `created_by`, `trace_id` — the canonical audit
  columns inherited from the rest of the AP/Spend schema per
  ADR-0015's audit-column conventions.

**Why the `vendor_rules` table is AP/Spend-owned (not
platform-owned).** The natural cardinality is per-vendor-per-bundle-type
(one row per `(org_id, vendor_id, bundle_type)` triple). Vendor
identity is owned by AP/Spend per ADR-0011 §1; vendor rules
attach to vendor identity via `vendor_id`. The natural ownership
follows: vendor rules live with the domain that owns vendors.
The platform-owned alternative (placing `vendor_rules` in a
substrate-tier schema alongside `source_documents` /
`source_document_links` / `document_cases`) was considered and
rejected — see Alternative 3 below.

**Why a separate table (not columns on `vendors` directly).** The
per-(legal-entity, vendor, bundle-type) cardinality forecloses
materializing the substrate inside `vendors` directly: one vendor
may have multiple bundle-type rules (the v1 active set is one
bundle type, `born_paid_bill`; the reserved set per ADR-0012 §12
includes `final_invoice_with_applied_deposit` and
`vendor_credit_applied_to_bill`; post-v1 activation may add more)
across one or more legal entities (post-v1 multi-entity per
ADR-0011 §10's reservation pattern; v1 collapses to the org's
single legal entity). A `vendors`-direct materialization would
either (a) flatten the rule set into per-bundle-type-per-entity
column families with explosive column count growth, or (b) lose
the per-bundle-type or per-entity discrimination entirely. The
separate table is the natural shape — see Alternative 1 below.

### 2. Single-writer rule per `vendorRuleService`

`vendorRuleService` is the sole writer of `vendor_rules`. The
single-writer rule is the vendor-rule analog of Reading B for the
ledger and of the single-writer rule from ADR-0016 for
`source_document_links`. The rule is mechanical at the
architectural layer: no domain service path inserts directly into
`vendor_rules`; no Tier 2 stage inserts directly; no agent tool
inserts directly; no SQL migration script inserts ad-hoc rows.
The only insert path is `vendorRuleService.create()` (or its
equivalent — final naming finalizes at service implementation per
project naming conventions).

**v1 service surface (minimal).** `vendorRuleService` ships at v1
with one function: `create(orgId, vendorId, bundleType,
traceId)`. The function inserts a row with `current_rung =
'always_confirm'`, all counter columns at default 0, all audit
anchor columns null, and emits a `vendor_rule_created` audit
event per item 5 below. The v1 fire condition is the first
`born_paid_bill` proposal for a `(org_id, vendor_id,
'born_paid_bill')` triple that does not already have a
`vendor_rules` row (idempotent seed); v1 fills `legal_entity_id`
with `org_id` per item 1's multi-entity reservation pattern.
The seed exists for substrate-presence purposes (post-v1
enforcement assumes a row exists for every active vendor) and is
not consumed by any v1 autonomy decision.

**Seed timing.** The seed fires at proposal time (when a
`born_paid_bill` proposal lands in the Always Confirm gate per
ADR-0015 §2), NOT at proposal commit time. The intent: every
vendor with a `born_paid_bill` proposal — whether the proposal
ultimately commits or rejects — generates a `vendor_rules` row.
Post-v1 enforcement consumes both the audit corpus (controller
accept / reject decisions per `bundle_approved` / `bundle_rejected`
events) AND the substrate row presence; seeding at proposal time
ensures the substrate row exists before the audit decision lands,
giving the post-v1 enforcement a stable join target. Idempotency
ensures no duplicate seeds for the same `(org_id, legal_entity_id,
vendor_id, bundle_type)` quadruple — the unique constraint per
item 1 makes this mechanical at the database layer.

**Post-v1 service surface (forward-pointed).** Post-v1
enforcement adds `incrementCleanApprovalCount(...)`,
`incrementRejectionCount(...)`, `promote(...)` (which performs
the §4.1 promotion ceremony), `demote(...)` (which performs the
§4.3 demotion). All four are reserved post-v1 — they do NOT ship
in v1. The promotion / demotion functions consume
`agent_autonomy_model.md` §4.1 / §4.2 / §4.3 contracts that do
not yet exist as v1 service code.

**Idempotency contract.** `vendorRuleService.create()` is
idempotent over the `(org_id, legal_entity_id, vendor_id,
bundle_type)` quadruple per the unique constraint in item 1: a
second call for the same quadruple is a no-op (the function
detects the existing row and returns the existing
`vendor_rule_id` without inserting). Idempotency is mechanical at
the database layer — the unique constraint prevents duplicate
inserts; the service function catches the unique-violation error
and returns the existing row. Post-v1 increment functions
(`incrementCleanApprovalCount`, `incrementRejectionCount`) are
NOT idempotent over single calls (each call increments the
counter by 1); they ARE idempotent over the `(audit_event_id,
vendor_rule_id)` pair via a derived idempotency key per the audit
corpus consumption in item 4 — the post-v1 enforcement ADR
specifies the derivation. v1 ships only `create()`; idempotency
discipline for the post-v1 increment functions is forward-pointed.

### 3. v1 read posture (no autonomy decisions consume `vendor_rules`)

**No v1 service write path consumes `vendor_rules` columns for
autonomy decisions.** This is the load-bearing v1-substrate-only
constraint: substrate present in the schema; enforcement absent
from the runtime. Specifically:

- **No v1 Tier 1 commit path consults `vendor_rules.current_rung`
  to decide the bundle approval gate.** Per ADR-0015 §2, every
  `born_paid_bill` bundle in v1 flows through Always Confirm; the
  `current_rung` column ships at `'always_confirm'` for every v1
  row, but the Tier 1 commit path does not read the column to
  decide the gate. The gate is decided by the bundle-type
  autonomy default per `agent_autonomy_model.md` §4 (Always Confirm
  for all rules at first), not by querying `vendor_rules`.
- **No v1 Tier 2 stage reads `vendor_rules.clean_approval_count`
  to score a match candidate.** Per ADR-0014 §9 the vendor matcher
  reads identity-and-matching fields from `vendors`; the matcher
  does not consult `vendor_rules` for autonomy purposes at v1.
  Post-v1 the matcher MAY read `vendor_rules` per item 7 below;
  v1 it does not.
- **No v1 promotion ceremony fires.** The `vendor_rule_promoted`
  audit event is reserved per item 5 below; v1 emits only
  `vendor_rule_created`. No v1 service path calls
  `vendorRuleService.promote(...)` (the function does not exist
  in v1; see item 2).
- **No v1 demotion path fires.** Demotion per `agent_autonomy_model.md`
  §4.3 is one-click immediate; v1 has no rules above Always Confirm
  to demote. The `vendor_rule_demoted` audit event is reserved per
  item 5; v1 emits zero of them.
- **No v1 service path emits `vendor_rule_rejection_recorded`
  events.** Reserved post-v1 per item 5.

**Diagnostic queryability.** The columns are queryable for
diagnostic purposes by controllers and operators. A controller
can run a SQL query to see "which vendors have a `vendor_rules`
row with `bundle_type = 'born_paid_bill'`" (the answer is "every
vendor for whom at least one `born_paid_bill` bundle has been
proposed") even though no v1 automation acts on the answer. This
is intentional: the substrate's diagnostic visibility lets
operators understand the eventual post-v1 enforcement surface
before the enforcement ships, and lets the post-v1 enforcement
work bootstrap against a substrate populated by v1 traffic.

### 4. Post-v1 enforcement (explicitly forward-pointed; NOT specified here)

Post-v1 vendor template enforcement adds runtime consumption of
the `vendor_rules` substrate for autonomy decisions. The
enforcement ships in a post-Phase-0 ADR (a future amendment to
ADR-0017 or a new ADR depending on scope at draft time); ADR-0017
forward-points the contracts but does NOT specify them. The
expected enforcement surface includes:

- **Auto-post calibration thresholds.** Per-bundle-type
  `clean_approval_count` floor below which the bundle must remain
  in Always Confirm; per-bundle-type per-amount thresholds; the
  same parametrization pattern as Q23 system-fixed promotion
  thresholds in `agent_autonomy_model.md` §4.2 but per-rule per-
  bundle-type granularity. ADR-0017 does NOT pick the threshold
  values; the post-v1 calibration ADR consumes the v1 corpus and
  picks them with operator review.
- **Promotion ceremony per `agent_autonomy_model.md` §4.1.** The
  modal flow that lets a controller promote a vendor's
  `born_paid_bill` rule from Always Confirm to Notify & Auto-Post.
  The post-v1 ceremony populates `promoted_at` / `promoted_by` /
  `promotion_authority` columns in the `vendor_rules` row inside
  the same transaction as the `vendor_rule_promoted` audit event.
  Authority discrimination per §4.1 (controller for Notify &
  Auto-Post; owner for Silent Auto) is mirrored in the
  `vendor_rule_promotion_authority` enum (item 5 below).
- **Demotion-trigger rules.** Per-rule rejection-rate threshold
  for promoted bundle rules that triggers automatic demotion back
  to Always Confirm; mirrors `agent_autonomy_model.md` §4.3
  one-click demotion at the manual surface but adds the
  rate-driven automatic trigger. ADR-0017 does NOT pick the rate
  threshold; the post-v1 calibration ADR picks it.
- **Learning-loop governance.** Human correction → template
  candidate → shadow mode → approval/versioning → rollback. The
  loop produces vendor-rule candidates (controller corrects an
  Always Confirm decision; the system proposes a vendor-rule
  amendment); shadow mode runs the candidate against a window of
  prior decisions and reports the would-have-been-different rate;
  approval/versioning records the controller's accept and pins
  the rule version; rollback restores the prior version. ADR-0017
  does NOT specify the loop algorithm; the post-v1 learning-loop
  ADR specifies it. The substrate columns the loop consumes
  (`promoted_at`, `promoted_by`, `clean_approval_count`,
  `rejection_count`) all ship at v1 schema time per item 1 above.

All four enforcement surfaces consume `vendor_rules` columns at
runtime. **None ship in v1.** ADR-0017's substrate is the schema
seat; the enforcement is the runtime that the future ADR will
specify against.

**Audit corpus source for post-v1 enforcement.** The post-v1
enforcement work derives `clean_approval_count` and
`rejection_count` from the canonical audit log per ADR-0011 §1
audit-log writer boundary — specifically from `bundle_approved`
and `bundle_rejected` events emitted by the bundle approval gate
per ADR-0012 §13 + ADR-0015 §2. The audit corpus is the
canonical source of truth; the `vendor_rules` counter columns
(`clean_approval_count`, `last_clean_approval_at`,
`rejection_count`, `last_rejection_at`) are denormalized
fast-lookup mirrors that post-v1 enforcement writes back via
`vendorRuleService.incrementCleanApprovalCount(...)` /
`vendorRuleService.incrementRejectionCount(...)` (forward-pointed
post-v1 functions per item 2). A future enforcement contributor
who proposes deriving the count from `vendor_rules` columns
without verifying against the audit corpus is proposing a
single-source-of-truth violation: the audit corpus is canonical;
the counter columns are cached.

### 5. Closed enums introduced (per ADR-0010 reserved-enum-states discipline)

Two closed enums ship at v1 schema time per ADR-0010 three-layer
defense (DB CHECK constraint at Layer 1, Zod schema validation at
Layer 2, service emission filter at Layer 3). Both enums ship
with their full reserved membership at v1; the v1 active subset
is explicit; reserved values are defined-but-not-emitted at v1.

**Closed enum: `vendor_rule_rung`.** Mirrors the Agent Ladder per
`agent_autonomy_model.md` §4. Full membership at v1 schema time:

| Value | v1 status | Source |
|---|---|---|
| `always_confirm` | **Active** (the only emitted value at v1) | `agent_autonomy_model.md` §4 Rung 1 — default rung for all new rules |
| `notify_and_auto_post` | **Reserved** post-v1 | `agent_autonomy_model.md` §4 Rung 2 — controller-authorized via §4.1 ceremony |
| `silent_auto` | **Reserved** post-v1 | `agent_autonomy_model.md` §4 Rung 3 — owner-authorized via §4.1 ceremony |

The full reserved set ships at v1 schema time per ADR-0010 because
all three rungs are named in `agent_autonomy_model.md` §4 (the
canonical Agent Ladder); shipping the full reserved set lets
post-v1 enforcement transition rules from `always_confirm` to
`notify_and_auto_post` or `silent_auto` without a schema
migration. v1 emits only `always_confirm` per the
`vendor_rules.current_rung NOT NULL DEFAULT 'always_confirm'`.

**Closed enum: `vendor_rule_promotion_authority`.** Mirrors the
controller-vs-owner discriminator per `agent_autonomy_model.md`
§4.1 (Promotion Ceremony). Full membership at v1 schema time:

| Value | v1 status | Source |
|---|---|---|
| `controller` | **Reserved** post-v1 | `agent_autonomy_model.md` §4.1 — controller is the promotion authority for Notify & Auto-Post |
| `owner` | **Reserved** post-v1 | `agent_autonomy_model.md` §4.1 — owner is the promotion authority for Silent Auto |

Both values are reserved at v1 because the column
(`vendor_rules.promotion_authority`) is null on every v1 row (no
v1 row has been promoted; the column carries a non-null value
only post-v1 ceremony). The closed enum ships at v1 schema time
per ADR-0010 so post-v1 ceremonies can populate the column with a
defined value without a schema migration.

**Audit event types reserved.** ADR-0017 reserves four audit event
types in the audit-event vocabulary per ADR-0011 §1 audit-log
writer boundary:

| Event type | v1 status | Fire condition |
|---|---|---|
| `vendor_rule_created` | **Active v1** | `vendorRuleService.create()` seeds a `vendor_rules` row (item 2 above) |
| `vendor_rule_promoted` | **Reserved** post-v1 | Post-v1 promotion ceremony per `agent_autonomy_model.md` §4.1 fires; populates `promoted_at` / `promoted_by` / `promotion_authority` columns |
| `vendor_rule_demoted` | **Reserved** post-v1 | Post-v1 demotion per `agent_autonomy_model.md` §4.3 fires; populates `demoted_at` / `demoted_by` columns |
| `vendor_rule_rejection_recorded` | **Reserved** post-v1 | Post-v1 demotion-trigger rule fires; increments `rejection_count`; updates `last_rejection_at` |

Only `vendor_rule_created` fires in v1. The other three are
reserved per the substrate-only-v1 framing — the events
correspond to enforcement actions that v1 does not perform. The
event-type vocabulary ships at v1 schema time per ADR-0011 §1
audit-log writer convention so post-v1 enforcement can emit them
without a vocabulary migration.

### 6. System ceiling preservation

**Vendor templates cannot move ANY mutation across the System
ceiling per `agent_autonomy_model.md` §6 + Principle 1.** The
System ceiling list per `agent_autonomy_model.md` §6 enumerates
seven row classes that are uncappable regardless of rung, limit,
or rule maturity:

1. Posting to a locked period (already enforced, INV-LEDGER-002)
2. Reversal entries (already enforced, INV-REVERSAL-001 +
   INV-REVERSAL-002)
3. Intercompany entries (reserved → INV-AGENT-001 partial)
4. Period-end adjustments (reserved → INV-AGENT-001 partial)
5. Equity account postings (reserved → INV-AGENT-001 partial)
6. First-time vendors above floor (reserved → INV-AGENT-001
   partial)
7. **Vendor bank-detail change** (reserved → **INV-AGENT-006**;
   System ceiling on `update_vendor` mutations that change
   `bank_account`, `payment_instructions`, or
   `bank_detail_confirmed_flag`)

The System ceiling is uncappable per `agent_autonomy_model.md`
Principle 1 (the bookkeeper analogy: a real bookkeeper does not
delegate fraud-control decisions to a machine, regardless of the
machine's track record). ADR-0017's substrate inherits this
verbatim: a vendor template promotion can move a `bundle_type =
'born_paid_bill'` rule from `always_confirm` to
`notify_and_auto_post` post-v1 for trusted vendors, but cannot
move ANY mutation in classes 1–7 above out of Always Confirm,
including a `born_paid_bill` bundle whose composition includes a
locked-period posting (class 1), a reversal child (class 2), an
intercompany child (class 3), a period-end adjusting child (class
4), an equity child (class 5), or a first-time vendor above floor
(class 6). The bundle-effective ceiling per ADR-0012 §9 is
max(child ceilings); a bundle whose any child carries a System
ceiling flag stays at the System ceiling regardless of the
vendor's rule rung.

**INV-AGENT-006 inheritance.** Vendor bank-detail changes per row
7 / INV-AGENT-006 are **uncappable**. The substrate cannot
authorize any post-v1 enforcement that would move a bank-detail
change away from controller confirmation with out-of-band
verification. A `vendor_rules` row with `bundle_type =
'born_paid_bill'` and `current_rung = 'notify_and_auto_post'`
post-v1 does NOT — and CANNOT — affect the gate on a sibling
`update_vendor` proposal that touches bank-detail columns; the
sibling proposal flows through INV-AGENT-006 enforcement at
`vendorService.update()` regardless of the vendor's
`born_paid_bill` rule rung. Per ADR-0011 §11 + ADR-0015 §9 +
INV-AGENT-006, the bank-detail enforcement is at the
`vendorService.update()` service layer and does not consult
`vendor_rules`.

A future contributor proposing that vendor template substrate
authorize bank-detail changes for vendors with high
`clean_approval_count` is proposing a System ceiling reduction
that is out of scope for ADR-0017 amendments. The System ceiling
rule is registered in `agent_autonomy_model.md` §6 row 7 and §10
INV-AGENT-006; any reduction requires amending those two
locations first, with controller-and-founder review at the
governance layer, before ADR-0017 (or any other ADR) can amend a
corresponding service-layer enforcement surface. This mirrors
ADR-0015's framing for vendor master integration.

### 7. Vendor matcher read-boundary inheritance (from ADR-0011 §11)

Per ADR-0011 §11 (verbatim quote in ADR-0011 §11 from ADR-0007),
the Tier 2 vendor matcher reads **vendor identity-and-matching
fields ONLY** (name, aliases, tax ID, email/domain, address,
default account mapping, historical template association, chart
of accounts, tax codes, classes / projects / departments). The
matcher MUST NOT read transactional committed state and MUST NOT
read vendor control / payment-risk fields.

**`vendor_rules` is identity-and-matching territory, not control /
payment-risk territory.** The substrate captures vendor history
patterns (which `bundle_type` rules a vendor has, which rung the
rule is on, the clean-approval count window) — the same
"historical template association" category the ADR-0011 §11
quote names explicitly. `vendor_rules` is NOT vendor control /
payment-risk state (bank account, payment instructions,
bank-detail-confirmed flag, payment hold status, blocked-vendor
status — those columns live on `vendors` and are governed by the
ADR-0011 §11 third-category restriction).

**v1 matcher does not read `vendor_rules` for autonomy
purposes.** Per item 3 above, no v1 service path consumes
`vendor_rules` columns for autonomy decisions; the matcher is no
exception. Post-v1 enforcement may add **advisory-only** matcher
reads of `vendor_rules.current_rung` and
`vendor_rules.clean_approval_count` for promotion-eligibility
scoring per item 4 above; "advisory-only" means the matcher's
read does NOT bypass any approval gate or commit-time
re-verification — the Tier 1 commit path still re-verifies all
vendor-control fields per ADR-0007 + ADR-0011 §11 regardless of
what the matcher's score suggested. The matcher's read fits
within the ADR-0011 §11 identity-and-matching category and does
NOT require a read-boundary expansion. A future contributor who
proposes the matcher's `vendor_rules` read as a gate-bypass
(skipping Tier 1 re-verification when the matcher score is high)
is proposing a Reading-boundary violation; the rejection is hard.

**ADR-0017 does NOT propose any new read-boundary categories.**
The three-category split per ADR-0007 / ADR-0011 §11 (reference /
master data; transactional committed state; control /
payment-risk fields) stands unchanged. Adding a new read-boundary
category would require an ADR-0007 / ADR-0011 amendment first;
ADR-0017 has no such proposal.

## Schema deltas

Surfaced explicitly per the Phase 0 schema-decision discipline.
No silent table or column introductions; all enum extensions and
new tables are named at the ADR level so future readers can
audit the schema scope of ADR-0017 from this section alone.

**New tables (1):**

- `vendor_rules` — AP/Spend-domain ownership per ADR-0011 §1; column
  set per item 1 above (including nullable `legal_entity_id`
  multi-entity reservation per ADR-0011 §10); unique constraint
  on `(org_id, legal_entity_id, vendor_id, bundle_type)`.

**New columns on existing tables: none.** ADR-0017 does NOT add
any columns to existing tables. Specifically, no columns are
added to `vendors`, `bills`, `payments`, or any other AP/Spend
domain table; no columns are added to platform-substrate tables
(`source_documents`, `source_document_links`, `document_cases`).

**New closed enums introduced (2):** `vendor_rule_rung` and
`vendor_rule_promotion_authority` per item 5 above. Both ship at
v1 schema time with full reserved membership; v1 active subset is
explicit; three-layer defense per ADR-0010.

**Existing closed enums consumed (1):** `bundle_type` from
ADR-0012 §12. ADR-0017's `vendor_rules.bundle_type` references
the enum directly; no extension to the enum is proposed.

**Reserved-enum migrations beyond v1.** Activation of reserved
values in `vendor_rule_rung` (`notify_and_auto_post`,
`silent_auto`) and `vendor_rule_promotion_authority`
(`controller`, `owner`) is a post-v1 ADR amendment, not a schema
migration — the values ship in the enums at v1; activation flips
the active subset and adds runtime emission per the post-v1
enforcement ADR. Migrations beyond the v1 schema-time addition
are zero unless a future amendment activates a reserved value.

**v1-safe CHECK constraints.** Per ADR-0010 reserved-enum-states
discipline, the `vendor_rules` table ships with three scoped
CHECK constraints at v1 schema time: (1) a CHECK on
`current_rung` restricting v1 emission to the active subset
(`current_rung = 'always_confirm'`) — rejects any v1 row attempting
a reserved value at the database layer; (2) a CHECK on
`promotion_authority` enforcing the v1 null-only invariant
(`promotion_authority IS NULL`) — rejects any v1 row attempting
to populate the column with a reserved value; (3) a CHECK on the
audit-anchor columns enforcing v1 null-only on
`promoted_at`, `promoted_by`, `demoted_at`, `demoted_by`,
`last_clean_approval_at`, `last_rejection_at` — these columns
ship at v1 schema time but no v1 service path populates them
(the reserved post-v1 functions are the only writers). Post-v1
activation requires loosening the CHECK constraints (extending
the IN list for `current_rung`, removing the IS NULL constraint
on `promotion_authority`, removing the IS NULL constraints on
the audit anchors) as part of the same migration that ships the
post-v1 enforcement. The constraints are the Layer 1 backstop
under the Layer 2 Zod boundary and Layer 3 service emission
filter per ADR-0010 three-layer defense.

## Reserved enums and audit events

Per ADR-0010 reserved-enum-states discipline:

**`vendor_rule_rung`** — closed enum, three values, v1 active
subset is `{always_confirm}`, reserved post-v1 set is
`{notify_and_auto_post, silent_auto}`. Three-layer defense per
ADR-0010: Layer 1 DB CHECK rejects values outside the closed set;
Layer 2 Zod boundary rejects reserved values during v1 service
call validation; Layer 3 service emission filter prevents
`vendorRuleService.create()` from emitting reserved values at v1
(the function only writes `'always_confirm'`).

**`vendor_rule_promotion_authority`** — closed enum, two values,
v1 active subset is `{}` (empty; column is null on every v1
row), reserved post-v1 set is `{controller, owner}`. Three-layer
defense per ADR-0010: Layer 1 DB CHECK accepts both values when
the column is non-null; Layer 2 Zod boundary rejects non-null
values during v1 service call validation (the column must be
null at v1); Layer 3 service emission filter prevents the v1
service path from emitting any non-null value.

**Reserved audit event types (4 total):** `vendor_rule_created`
(active v1), `vendor_rule_promoted` (reserved post-v1),
`vendor_rule_demoted` (reserved post-v1),
`vendor_rule_rejection_recorded` (reserved post-v1). Per item 5
above. All four route through the canonical audit-log writer per
ADR-0011 §1 audit-log writer boundary; the audit table itself is
owned by INV-AUDIT-001.

## Cross-references

- **ADR-0007** — three-tier agent architecture; Tier 1 commit-path
  re-verification; Tier 2 read-boundary three-category split for
  vendor master fields. Inherited verbatim.
- **ADR-0010** — reserved-enum-states discipline. Three-layer
  defense applied to both `vendor_rule_rung` and
  `vendor_rule_promotion_authority`.
- **ADR-0011 §1** — entity ownership boundary. AP/Spend owns
  `vendors`; ADR-0017's `vendor_rules` is AP/Spend-owned by
  natural ownership inheritance.
- **ADR-0011 §11** — vendor-matcher read boundary three-category
  split. ADR-0017's `vendor_rules` is identity-and-matching
  territory under the first category; no new categories proposed.
- **ADR-0012 §12** — `bundle_type` enum membership. ADR-0017
  references the enum but does not extend it.
- **ADR-0012 §13** — approval gate framework; auto-post deferred
  past v1; Q60 split with ADR-0015 v1 portion and ADR-0017 post-v1
  portion. ADR-0017 ratifies the post-v1 substrate seat named here.
- **ADR-0014 §9** — vendor-matcher pipeline integration. ADR-0017's
  substrate is read-eligible by the Tier 2 matcher under the
  identity-and-matching category; v1 matcher does not consume it
  for autonomy purposes.
- **ADR-0015** (sibling Tier 4, drafted at `c036c31`) — closes
  Q60 v1 portion; §2 forward-pointer named the substrate seat for
  `clean_approval_count` that ADR-0017 ships in item 1; §9 vendor
  master integration with INV-AGENT-006 enforcement is inherited
  verbatim.
- **ADR-0016** (sibling Tier 4, drafted at `ccfc6da`) — Document
  Relationship Graph. Orthogonal substrate (no schema dependency);
  cited only for sibling-trio context and substrate-only-v1
  anti-overscope precedent.
- **ADR-0019** (forthcoming, post-Phase-0) — Confidence Calibration
  Policy. ADR-0017 does NOT specify confidence thresholds, per-rule
  calibration policy, or threshold tuning governance; all of those
  live in ADR-0019 per Q57 forward-pointing. ADR-0019 may
  cross-reference ADR-0017's substrate when the post-v1 enforcement
  ships.
- **`docs/02_specs/mutation_lifecycle.md`** — canonical
  mutation-lifecycle states. ADR-0017 does NOT extend the canonical
  states; `vendor_rule_rung` is agent-ladder vocabulary from
  `agent_autonomy_model.md` §4 and is distinct from
  mutation-lifecycle vocabulary. See Notes for future ADR writers
  for the distinction's load-bearing framing.
- **`docs/02_specs/ledger_truth_model.md`** — Service Communication
  Rules (Reading B). ADR-0017's single-writer rule per
  `vendorRuleService` is the vendor-rule analog of Reading B,
  matching the ADR-0016 single-writer rule for
  `source_document_links`.
- **`docs/02_specs/intent_model.md`** — Logic Receipt schema and
  ProposedMutation conventions. ADR-0017 does NOT extend the
  Logic Receipt or the ProposedMutation surface; the v1 substrate
  is not produced or consumed by the proposal pipeline.
- **`docs/02_specs/agent_autonomy_model.md`** — §4 Agent Ladder
  (Always Confirm / Notify & Auto-Post / Silent Auto rungs); §4.1
  Promotion Ceremony (controller for Notify & Auto-Post; owner for
  Silent Auto); §4.2 Promotion Thresholds (Q23 system-fixed for
  v1); §4.3 Demotion ("Re-Probate"); §6 System ceiling (7 rows
  including row 7 vendor bank-detail change); §10 Reserved INV-IDs
  (INV-AGENT-001..006); Principle 1 (System ceiling is
  uncappable). ADR-0017 inherits all six sections verbatim.
- **INV-AGENT-006** — vendor bank-detail changes are System
  ceiling (registered at commit `84691d5`). ADR-0017's substrate
  does NOT and CANNOT authorize any reduction of this invariant.

## Closes

This ADR closes the following questions from
`docs/02_specs/open_questions.md`:

| Q | Closure scope | Disposition |
|---|---|---|
| **Q60** | Born-paid bill bundle approval gate — post-v1 portion | **PARTIAL closure — post-v1 portion only.** v1 portion (Always Confirm for `born_paid_bill`) closed by **ADR-0015 §2**. Post-v1 portion (substrate seat for auto-post calibration, promotion thresholds, vendor-rule promotion authority) closes here as **substrate-only**: the `vendor_rules` table with `clean_approval_count` (per ADR-0015 §2 forward-pointer), `current_rung`, `promotion_authority`, audit-anchor columns, and the two closed enums (`vendor_rule_rung`, `vendor_rule_promotion_authority`) per ADR-0010 reserved-enum-states discipline. **Full enforcement (auto-post calibration thresholds, promotion ceremonies, demotion-trigger rules, learning-loop governance) deferred past Phase 0** per item 4. Per items 1, 4, 5. |

**Q43 (retired-range topic-mapping inheritance — no Q-number
anchor).** Per `docs/02_specs/open_questions.md` Q35–Q52
retirement notice (2026-05-02), the original `ap_ingestion_initiative.md`
brief reserved Q35–Q52 for filing in a separate prompt cycle that
did not run before the brief was superseded by the Document
Platform reframe. Q43's original topic was "vendor-template-as-autonomy-rule"
— the territory ADR-0017 holds the substrate piece of. Per the
retirement notice, Q35–Q52 are retired and will not be reused.
ADR-0017 inherits the Q43 topic without inheriting a Q-number
anchor: the substrate-only-v1 closure here covers the schema
piece of the original Q43 territory; the post-v1 enforcement
piece (deferred per item 4) is the runtime piece of the same
territory and lands in a future ADR. No closure record entry is
created for Q43 because the Q-number is retired; the topic
mapping is recorded in this paragraph for future-reader visibility.

**Explicitly NOT closed by ADR-0017:**

- **Q60 v1 portion** (Always Confirm for `born_paid_bill` v1) —
  closed by **ADR-0015 §2**.
- **Q57** (Confidence calibration governance) — owned by
  **ADR-0019** (forthcoming, post-Phase-0). ADR-0017 does NOT
  specify confidence thresholds or calibration policy.
- **Vendor template post-v1 enforcement** (auto-post calibration,
  promotion / demotion authority, learning-loop governance) —
  deferred past Phase 0 per item 4. Will land in a future ADR
  amendment to ADR-0017 or in a new ADR depending on scope at
  draft time.
- **Vendor master integration** (vendor identity, matching,
  bank-detail changes per INV-AGENT-006) — owned by **ADR-0011
  §11** (read boundary), **ADR-0015 §9** (write path with
  INV-AGENT-006 enforcement at `vendorService.update()`), and
  **INV-AGENT-006** (the System ceiling rule itself, registered
  in `agent_autonomy_model.md` §6 row 7 and §10).

## Anti-overscope discipline

ADR-0017 owns the vendor template substrate at v1 only — schema,
single-writer rule, closed enums, reserved audit events, and the
substrate-only-v1 contract. The following are explicitly NOT
ADR-0017 scope. Future readers (and future ADR amendment authors)
are warned: if a proposed amendment to ADR-0017 drifts into the
territories below, the proposal is misplaced and should be
re-scoped to the owning ADR.

- **Post-v1 vendor template enforcement** — deferred past Phase 0;
  lands in a future ADR amendment to ADR-0017 or a new ADR. The
  enforcement contracts (auto-post calibration thresholds,
  promotion ceremony per `agent_autonomy_model.md` §4.1, demotion-
  trigger rules, learning-loop governance) are NOT specified here;
  they consume the substrate ADR-0017 ships but live in a future
  scope. ADR-0017 does NOT specify threshold values, calibration
  policy, ceremony UI, or learning-loop algorithm.
- **Confidence calibration governance** — owned by **ADR-0019**
  (forthcoming, post-Phase-0). ADR-0017 consumes calibration
  outcomes only at runtime (and only post-v1 when enforcement
  ships); ADR-0017 does NOT specify confidence threshold values,
  per-document-type calibration policy, or the governance process
  for tuning thresholds. All of those live in ADR-0019 per Q57
  forward-pointing by ADR-0011 / ADR-0014.
- **Q60 v1 portion** (Always Confirm for `born_paid_bill` v1) —
  owned by **ADR-0015 §2**. ADR-0017 ratifies the v1 portion's
  forward-pointer for the post-v1 substrate seat
  (`clean_approval_count`); ADR-0017 does NOT re-litigate the v1
  approval rules.
- **AP/Spend domain decisions** — owned by **ADR-0015** (sibling
  Tier 4). ADR-0017's `vendor_rules` table is AP/Spend-owned per
  the entity-ownership boundary, but ADR-0017 does NOT specify
  AP/Spend domain workflows (vendor prepayment shape, born-paid
  bundle workflow, manual workflow, payment failure lifecycle, tax
  timing, vendor balance, exception-queue routing for missing
  deposits, receipt v1 path). All of those live in ADR-0015. If a
  future ADR-0017 amendment proposes content in any of those
  areas, the amendment is misplaced and should be re-scoped to
  ADR-0015.
- **Document Relationship Graph** — owned by **ADR-0016** (sibling
  Tier 4). ADR-0017 does NOT specify `linked_entity_type` /
  `link_role` enum membership, pair-validity matrix, or cascade
  behavior. The two substrates (vendor-rule and document-link)
  are orthogonal; no schema-side dependency exists between them.
- **Vendor master integration** (vendor identity, matching,
  bank-detail changes) — owned by **ADR-0011 §11** (read
  boundary), **ADR-0015 §9** (write path with INV-AGENT-006
  enforcement), and **INV-AGENT-006** (the System ceiling rule
  registered in `agent_autonomy_model.md` §6 row 7 and §10).
  ADR-0017's substrate does NOT amend vendor master mutation
  rules, does NOT propose any reduction of the INV-AGENT-006
  System ceiling, and does NOT extend the vendor-matcher
  read-boundary three-category split.

Where ADR-0017 needs to reference any of the above areas, it does
so by ADR number with the boundary explicit (e.g., "the
post-v1 enforcement contracts are deferred past Phase 0 — ADR-0017
ships the substrate that future enforcement consumes, not the
enforcement itself"; "the bank-detail enforcement is at the
`vendorService.update()` service layer per ADR-0015 §9 +
INV-AGENT-006 — ADR-0017's substrate does not consult and cannot
authorize bank-detail changes"). The forward-pointers in items 4
(post-v1 enforcement deferral), 6 (System ceiling preservation),
and 7 (vendor matcher read-boundary inheritance) are the
load-bearing boundary callouts.

## Consequences

### What this enables

- **The vendor template substrate ships in v1 with a complete
  schema seat for post-v1 enforcement.** The `vendor_rules` table
  with its full v1 column set, the two closed enums per ADR-0010
  reserved-enum-states discipline, and the reserved audit-event
  vocabulary all carry structured schema-side enforcement at v1
  schema time. Post-v1 enforcement has a substrate to consume.
- **ADR-0015 §2's forward-pointer for `clean_approval_count`
  lands cleanly.** The column ships at v1 schema time with NOT
  NULL DEFAULT 0; v1 service paths do not increment it; post-v1
  enforcement reads it for promotion-eligibility scoring and
  derives the count from the audit corpus.
- **Reading B's vendor-rule analog (single-writer rule)
  preserves the architectural separation.** `vendorRuleService`
  is the sole writer of `vendor_rules`; the rule mirrors the
  ADR-0016 single-writer rule for `source_document_links` and
  composes with Reading B for the ledger. The three single-writer
  rules together (`ledgerService` for journal entries,
  `documentLinkService` for link rows, `vendorRuleService` for
  vendor-rule rows) enforce the substrate-tier architectural
  separation at the schema layer.
- **The substrate-now-enforcement-later pattern is consistently
  applied.** ADR-0017 is the fourth Phase 0 application (after
  ADR-0014 Tier B, Q23 promotion thresholds, Q57 calibration
  governance) of the same pattern: substrate ships at v1; the
  enforcement ships post-v1 once v1 traffic generates the corpus
  the enforcement needs. Future ADR writers can reference ADR-0017
  as a load-bearing precedent for the pattern.
- **Post-v1 enforcement work has a substrate to bootstrap
  against.** When the post-v1 vendor template enforcement ADR
  scopes, the `vendor_rules` table will be populated with rows for
  every vendor that has had at least one `born_paid_bill` proposal
  during v1 traffic; the audit log will contain the corpus of
  controller approvals and rejections; the post-v1 enforcement can
  derive `clean_approval_count` and `rejection_count` from the
  audit corpus and write them back into `vendor_rules` for fast
  lookup. The bootstrap is mechanical because v1 substrate
  populated the necessary rows.
- **System ceiling preservation is mechanical.** Per item 6, the
  substrate cannot authorize any post-v1 enforcement that would
  move a mutation across the System ceiling. The mechanical
  preservation comes from the `vendorService.update()` enforcement
  surface for INV-AGENT-006 per ADR-0015 §9 — the bank-detail
  enforcement does not consult `vendor_rules`, so a future
  enforcement amendment that proposed reading `vendor_rules` for
  bank-detail decisions would have to amend `vendorService.update()`
  first, which would be a System ceiling reduction requiring the
  governance amendment per ADR-0015 §9's framing.

### What this constrains

- **No v1 service write path consumes `vendor_rules` for
  autonomy decisions.** Per item 3 above, the substrate is
  diagnostic-only at v1; no Tier 1 commit path consults
  `current_rung`; no Tier 2 stage scores against
  `clean_approval_count`; no v1 promotion ceremony fires; no v1
  demotion fires. A future contributor proposing v1 autonomy
  consumption of `vendor_rules` is proposing a substrate-only-v1
  framing violation; the framing was set by ADR-0011 §Forward-pointed
  Q60 entry, ADR-0012 §13, and ADR-0015 §2 collectively, and
  ADR-0017 ratifies the substrate-only-v1 framing.
- **No domain code path may write to `vendor_rules` directly.**
  The single-writer rule per `vendorRuleService` is mechanical —
  only `vendorRuleService` is the entry point. Future
  contributors who propose direct writes from a domain service
  (a `billService` that increments `clean_approval_count` directly
  on bundle approval) are proposing a single-writer-rule
  violation, with the same shape and same hard rejection as a
  Reading B violation.
- **No silent activation of reserved enum values.** The reserved
  values in both enums (`vendor_rule_rung` reserved set
  `{notify_and_auto_post, silent_auto}`;
  `vendor_rule_promotion_authority` reserved set `{controller,
  owner}`) ship in the schema at v1 but are not emitted by v1
  service write paths. Activating a reserved value requires a
  post-v1 ADR amendment per ADR-0010 discipline; silent activation
  is a discipline violation caught by the Layer 1 / Layer 2 /
  Layer 3 defenses.
- **No System ceiling extension via vendor template.** Per item 6,
  the substrate cannot authorize any post-v1 enforcement that
  would move a mutation across the System ceiling per
  `agent_autonomy_model.md` §6 + Principle 1. Bank-detail changes
  per row 7 / INV-AGENT-006 are uncappable; equity / intercompany /
  period-end / locked-period / reversals / first-time-vendor-above-floor
  are uncappable. A future contributor proposing template-driven
  promotion that crosses the System ceiling is proposing a fraud-
  control reduction that is out of scope for ADR-0017 amendments.
- **No new read-boundary categories proposed.** Per item 7,
  ADR-0017 inherits the ADR-0011 §11 three-category split verbatim
  and does NOT propose a fourth category for `vendor_rules`. The
  table is identity-and-matching territory under the first
  category. A future contributor who proposes "vendor_rules is its
  own read-boundary category" is proposing a categorization that
  ADR-0017 has already rejected — the table fits within
  identity-and-matching cleanly.

### What this costs

- **Schema scope.** One new table (`vendor_rules`) with the v1
  substrate column set including the `legal_entity_id`
  multi-entity reservation per ADR-0011 §10 and one unique
  constraint; two new closed enums (`vendor_rule_rung`,
  `vendor_rule_promotion_authority`) shipping with full reserved
  membership at v1 schema time per ADR-0010. No column additions
  to existing tables; no schema modifications outside the new
  table and the two new enums. Migration cost is bounded by the
  new-table footprint.
- **Reserved-enum migrations.** Both enums introduced by ADR-0017
  ship at v1 with full reserved membership; activation of reserved
  values is a future ADR amendment, not a schema migration.
  Migrations beyond the v1 schema-time addition are zero unless a
  future amendment activates a reserved value.
- **Service surface.** `vendorRuleService` ships at v1 with one
  function: `create(orgId, vendorId, bundleType, traceId)`. The
  function is the only write path; the function emits a
  `vendor_rule_created` audit event; no other v1 functions on
  `vendorRuleService` exist. Post-v1 functions
  (`incrementCleanApprovalCount`, `incrementRejectionCount`,
  `promote`, `demote`) are reserved per item 2 above. The minimal
  v1 surface is intentional: substrate only.
- **Test surface.** Integration tests for: substrate-creation
  idempotency (calling `vendorRuleService.create()` twice for the
  same `(org_id, vendor_id, bundle_type)` triple is idempotent —
  the second call is a no-op); single-writer rule enforcement (no
  domain service writes to `vendor_rules` directly); reserved-enum-value
  rejection at all three layers (Layer 1 DB CHECK rejects, Layer 2
  Zod rejects, Layer 3 service emission rejects); audit-event
  emission (`vendor_rule_created` fires on seed; the other three
  event types do NOT fire in v1); System ceiling preservation
  (no `vendor_rules` row consultation in `vendorService.update()`
  bank-detail enforcement, even when post-v1 promotion would
  hypothetically move the rule rung). The minimal test surface
  matches the minimal service surface.
- **Audit-log volume.** ADR-0017 adds 4 new audit event types
  (item 5). Only `vendor_rule_created` fires in v1; the v1 volume
  is bounded by the count of unique `(vendor, bundle_type)` pairs
  that have at least one proposal during v1 — for the "founder + 2
  real users" cohort this is small (tens to low hundreds across v1
  duration). Post-v1 scaling depends on enforcement activation.
  All events route through the canonical audit-log writer per
  ADR-0011 §1.

## Alternatives considered

### Alternative 1 — Materialize substrate inside `vendors` table directly

**Rejected — per-vendor-per-bundle-type cardinality requires a
separate table.** The alternative would have added column families
to `vendors` (e.g., `born_paid_clean_approval_count`,
`born_paid_current_rung`, `final_invoice_clean_approval_count`,
`final_invoice_current_rung`, `vendor_credit_clean_approval_count`,
`vendor_credit_current_rung`) — one column family per active or
reserved bundle type. The alternative was rejected on three
grounds:

1. **Explosive column count.** v1 has one active bundle type
   (`born_paid_bill`); ADR-0012 §12 reserves two more
   (`final_invoice_with_applied_deposit`,
   `vendor_credit_applied_to_bill`) and names three additional
   reserved candidates (`intercompany_due_to_due_from`,
   `multi_entity_payment_split`, `vendor_credit_with_refund`).
   Materializing as column families would produce six column
   families × ~6 columns per family (`current_rung`,
   `promotion_authority`, `clean_approval_count`,
   `last_clean_approval_at`, `rejection_count`, `last_rejection_at`,
   `promoted_at`, `promoted_by`, `demoted_at`, `demoted_by`) — 60+
   columns on `vendors` for a substrate that v1 does not even
   consume.
2. **Cardinality mismatch.** Vendor identity is 1:1 (one row per
   vendor); vendor rules are 1:N (one rule per bundle type per
   vendor). Materializing the 1:N relationship as flat columns
   collapses the cardinality and loses the per-bundle-type
   discrimination — a query "show me every vendor whose
   `born_paid_bill` rule is on `notify_and_auto_post`" becomes a
   table scan with column-family awareness instead of an indexed
   lookup on `(current_rung, bundle_type)`.
3. **Migration friction post-v1.** Activating a new reserved
   bundle type post-v1 in the column-family approach requires a
   schema migration (new column families); in the separate-table
   approach activation is just a flip in the `bundle_type` enum's
   active subset (already reserved in ADR-0012 §12). The
   separate-table approach makes activation a runtime concern; the
   column-family approach makes activation a schema concern.

The separate `vendor_rules` table is the natural shape and the
chosen design. The cost is one extra join at lookup time
(`vendors JOIN vendor_rules ON vendor_id`); the benefit is the
correct cardinality model and bounded migration cost for future
bundle-type activation.

### Alternative 2 — Ship substrate AND enforcement together at v1

**Rejected — needs a labeled corpus that v1 generates.** The
alternative would have shipped the substrate AND the post-v1
enforcement at v1 together: auto-post calibration thresholds for
`born_paid_bill`, promotion ceremonies, demotion-trigger rules,
and learning-loop governance all live and emit at v1. The
alternative was rejected on the same grounds the parallel Phase 0
substrate-now-enforcement-later decisions were rejected:

1. **No labeled corpus at v1.** Auto-post calibration thresholds
   require observed approval / rejection rates across multiple
   vendors and multiple bundles; v1 generates the corpus through
   Always Confirm and the canonical audit log. Picking thresholds
   pre-corpus is guess-work; the founder + 2 real users cohort has
   no prior CHOUnting traffic to draw from.
2. **No Q23 evolution path.** `agent_autonomy_model.md` §4.2 sets
   v1 promotion thresholds as system-fixed (Q23) precisely
   because tuning requires v1-observed promotion behavior. The
   per-bundle-type tuning ADR-0017 enforcement would do is a
   per-rule extension of the same pattern; v1 cannot pick
   per-rule thresholds before generating per-rule corpus.
3. **Pattern consistency.** ADR-0014 Tier B reservation; Q23
   v1-fixed promotion thresholds; Q57 confidence calibration
   forward-pointing to ADR-0019. Three prior Phase 0 decisions
   shipped substrate at v1 and deferred enforcement post-v1.
   ADR-0017 is the fourth application of the pattern; deviating
   here would break the Phase 0 consistency without a substantive
   reason.

### Alternative 3 — Defer substrate AND enforcement to post-v1

**Rejected — post-v1 work has to migrate without a substrate
seat.** The alternative would have deferred both the substrate
AND the enforcement to post-v1: no `vendor_rules` table at v1,
no `vendor_rule_rung` enum at v1, no audit event vocabulary at
v1. The alternative was rejected on two grounds:

1. **Post-v1 migration cost.** When the post-v1 enforcement ADR
   scopes, it would need to ship the substrate first (one or two
   migrations adding `vendor_rules` and the two enums) before
   shipping the enforcement (a third migration adding the runtime
   service paths). The split-migration sequence is operationally
   awkward and produces a window between the substrate landing
   and the enforcement landing during which the substrate is in
   the schema but the enforcement is not yet wired — exactly the
   v1 state ADR-0017 ships at v1, but landed mid-cycle instead of
   at v1 schema-time.
2. **Same trap as ADR-0014 Tier B reservation.** ADR-0014 chose
   to reserve the Tier B classifier substrate at v1 schema time
   (the reserved column on the pipeline's intermediate state)
   precisely to avoid the migration awkwardness when Tier B
   eventually ships post-v1. ADR-0017 inherits the same
   reasoning verbatim: substrate at v1, enforcement post-v1, no
   mid-cycle migration awkwardness.

Substrate at v1 + enforcement at post-v1 is the substrate-now-enforcement-later
pattern; deferring both to post-v1 would produce the same eventual
schema but with worse operational mechanics. The substrate-only-v1
framing is the correct shape.

## Notes for future ADR writers

- **Q60 split pattern (v1 closes in ADR-0015; post-v1 substrate
  closes here; post-v1 enforcement deferred).** The pattern this
  ADR continues — closing the substrate piece of a multi-piece
  question while explicitly deferring the runtime enforcement
  piece — is the same pattern ADR-0011 used for Q73's four-piece
  closure and ADR-0015 used for Q60's v1 / post-v1 split. ADR-0017
  closes the post-v1 substrate piece of Q60; the post-v1
  enforcement piece is deferred past Phase 0. A future contributor
  who attempts a single-ADR full closure of Q60 (v1 portion + v1
  substrate + v1 enforcement) is misframing the question — Q60's
  full decision space is a three-part split. The split is
  intentional and matches ADR-0012 §13's framework / specifics
  partition.

- **Substrate-now-enforcement-later pattern as Phase 0 lesson.**
  ADR-0017 is the fourth Phase 0 application of the pattern:
  ADR-0014 Tier B (small classifier substrate at v1; Tier B
  enforcement post-v1 because corpus needs v1 generation); Q23
  promotion thresholds (system-fixed for v1; tuning machinery
  post-v1 because per-org corpus needs v1 generation); Q57
  confidence calibration (substrate at v1 in `org_settings.*`;
  calibration governance post-v1 in ADR-0019 because labeled
  outcome corpus needs v1 generation); ADR-0017 vendor template
  substrate (substrate at v1; enforcement post-v1 because labeled
  vendor-rule outcome corpus needs v1 generation). The pattern is
  consistent across Phase 0; future ADR writers should reach for
  the pattern when a calibration / enforcement decision depends
  on a corpus v1 will produce. The pattern is NOT to be used when
  the substrate would consume v1 traffic without a corpus need
  (e.g., a substrate that requires ongoing mutation by v1
  service code is not a substrate-now-enforcement-later
  candidate).

- **Multi-entity reservation pattern (ADR-0011 §10 precedent).**
  ADR-0017 follows ADR-0011 §10's multi-entity reservation pattern
  by including a nullable `legal_entity_id` column on
  `vendor_rules` at v1 schema time. The column ships nullable so
  post-v1 multi-entity service paths can populate it with the
  resolved legal_entity_id from the bundle's child mutations; v1
  service path (`vendorRuleService.create()`) populates with
  `org_id` per the ADR-0011 §10 "Defaults to `org_id` in v1 where
  the org-entity mapping is 1-1" pattern, so the
  `(org_id, legal_entity_id, vendor_id, bundle_type)` unique
  constraint composes mechanically without NULL-uniqueness
  pathology. The reservation is essentially free at v1 schema
  time; a post-v1 retrofit (adding the column to a populated
  `vendor_rules` table after rule history accumulates) would be
  expensive — same reasoning ADR-0011 §10 invokes for
  `source_documents.legal_entity_id` and the ADR-0015 schema's
  `bills.legal_entity_id` / `bill_lines.benefiting_entity_id` /
  `payments.paying_entity_id` / `payments.benefiting_entity_id`
  reservations. A future contributor who proposes removing
  `legal_entity_id` from `vendor_rules` ("v1 doesn't need it") is
  proposing a multi-entity-readiness regression; the reservation
  is the right shape for substrate.

- **System ceiling preservation discipline.** A future contributor
  proposing that vendor template substrate authorize any mutation
  across the System ceiling (bank-detail changes, equity,
  intercompany, period-end, locked-period, reversals, first-time
  vendor above floor) is proposing a fraud-control reduction that
  is out of scope for ADR-0017 amendments. The System ceiling rule
  is registered in `agent_autonomy_model.md` §6 (the seven-row
  table) and §10 (INV-AGENT-001..006); any reduction requires
  amending those two locations first, with controller-and-founder
  review at the governance layer, before ADR-0017 can amend a
  corresponding service-layer enforcement surface. This mirrors
  ADR-0015 §9's framing for vendor master integration: governance
  amendment first (in `agent_autonomy_model.md`), domain or
  substrate ADR amendment second (in ADR-0015 or ADR-0017), never
  in reverse order.

- **Learning-loop governance forward-pointer.** The post-v1
  learning loop (human correction → template candidate → shadow
  mode → approval/versioning → rollback) is forward-pointed by
  item 4 above; ADR-0017 does NOT specify the loop algorithm,
  shadow-mode rules, versioning shape, or rollback mechanics. The
  loop ships in a future ADR (a post-Phase-0 learning-loop ADR
  or a future ADR-0017 amendment depending on scope at draft
  time). A future contributor who proposes drafting the loop
  inside ADR-0017 amendment scope is misplacing the work; the
  loop is its own ADR-shaped contract that consumes ADR-0017's
  substrate as one input among many (audit corpus, vendor matcher
  output, controller decision history).

- **Expected post-v1 amendment vectors.** ADR-0017 is expected to
  receive amendments as the post-v1 phases scope. The expected
  amendment vectors:
  - **Activation of reserved `vendor_rule_rung` values.** When
    post-v1 promotion ceremonies ship, the reserved
    `notify_and_auto_post` and `silent_auto` values activate
    (v1-active subset extends from `{always_confirm}` to the full
    set). The amendment ships with the post-v1 enforcement ADR;
    ADR-0017 amends item 5 to flip the active-subset framing.
  - **Activation of reserved `vendor_rule_promotion_authority`
    values.** When post-v1 promotion ceremonies ship, both
    `controller` and `owner` activate per
    `agent_autonomy_model.md` §4.1. The amendment ships with the
    same post-v1 enforcement ADR.
  - **Activation of reserved audit event types.** When post-v1
    enforcement ships, `vendor_rule_promoted`,
    `vendor_rule_demoted`, and `vendor_rule_rejection_recorded`
    activate. The amendment ships with the post-v1 enforcement
    ADR.
  - **Service-surface extension on `vendorRuleService`.** Post-v1
    functions (`incrementCleanApprovalCount`,
    `incrementRejectionCount`, `promote`, `demote`) ship; ADR-0017
    amends item 2 to flip the v1 service surface framing.
  - **Per-bundle-type calibration thresholds.** When the post-v1
    enforcement ADR picks the threshold values, ADR-0017 (or the
    enforcement ADR) records the values per bundle type; the
    `vendor_rules` schema does NOT change because the thresholds
    are policy values, not row state.

- **What ADR-0017 will NOT amend (boundary discipline).** Per the
  Anti-overscope discipline section: ADR-0017 amendments must
  NOT extend into ADR-0015 (AP/Spend domain decisions), ADR-0016
  (Document Relationship Graph), ADR-0019 (confidence calibration
  governance), ADR-0014 (OCR / extraction behavior), ADR-0011 §11
  (vendor matcher read-boundary three-category split), or
  INV-AGENT-006 (System ceiling for vendor bank-detail changes).
  If a future amendment proposes content in any of those areas,
  the amendment is misplaced and should be re-scoped to the
  owning ADR. The Tier 4 / Tier 5 / Tier 6 dependency chain is
  load-bearing; ADR-0017 absorbing decisions from those tiers
  would invert the dependency direction and break the Phase 0
  ratification ordering.

- **The `vendor_rule_rung` vs mutation-lifecycle vocabulary
  distinction is load-bearing.** Item 5's distinction —
  `vendor_rule_rung = 'always_confirm' | 'notify_and_auto_post' |
  'silent_auto'` is an agent-ladder vocabulary from
  `agent_autonomy_model.md` §4 on `vendor_rules.current_rung`,
  NOT a mutation-lifecycle state — must be preserved by every
  future amendment. The canonical mutation-lifecycle vocabulary
  from `mutation_lifecycle.md` is unchanged; the vendor-rule
  layer carries its own state column with its own narrow rung
  vocabulary. The pattern mirrors ADR-0015's `payment_state =
  'failed'` distinction from mutation-lifecycle and ADR-0016's
  `link_status = 'created' | 'reversed'` distinction from
  mutation-lifecycle. A future contributor who proposes unifying
  the agent-ladder rungs into the mutation-lifecycle vocabulary
  (adding `auto_post_eligible` to the mutation-lifecycle states,
  or adding `posted_with_reversible_window` to `vendor_rule_rung`)
  is conflating distinct vocabularies. The distinction is
  necessary because a `born_paid_bill` proposal flows through
  canonical mutation-lifecycle states (Pending → Approved →
  Posted (manual)) while the corresponding `vendor_rules` row's
  `current_rung` is a separate lifecycle on a separate entity
  (the vendor-rule rule, not the proposal). Both lifecycles apply
  to the same proposal but at different levels of abstraction.

  In plain language: the proposal asks "what's happening to the
  ledger right now?" (mutation-lifecycle); the vendor-rule asks
  "how much autonomy does this rule currently have?"
  (rung-lifecycle); the link row asks "is this evidence still
  active?" (link-status). Three distinct questions, three
  distinct vocabularies on three distinct entities. A unified
  vocabulary would force one lifecycle to answer all three
  questions, which produces conceptual ambiguity at every
  state transition.

- **The Tier 4 trio (ADR-0015, ADR-0016, ADR-0017) ratifies as a
  package; do not propose isolated ADR-0017 ratification.** Per
  the Phase 0 governance plan, the Tier 4 trio ratifies together
  as part of the D4 ratification package. ADR-0017's
  `clean_approval_count` column depends on ADR-0015 §2's
  forward-pointer; ADR-0015 §2's forward-pointer depends on
  ADR-0017's substrate seat existing; the dependencies are
  bidirectional and the ratification package preserves the
  consistency. A future contributor who proposes a partial
  ADR-0017 amendment that breaks one direction of the dependency
  (e.g., removing `clean_approval_count` from the v1 column set)
  would also need to amend ADR-0015 in the same amendment
  package; the discipline is inherited from the Phase 0
  sequencing.

- **The single-writer rule for `vendor_rules` is the vendor-rule
  analog of Reading B for the ledger.** A future contributor who
  proposes a domain service that writes to `vendor_rules`
  directly (a `billService` that increments
  `clean_approval_count` as part of its `post()` function) is
  proposing a single-writer-rule violation. The correct path: the
  domain service emits an audit event (which v1 already does for
  `bundle_approved`); post-v1 enforcement reads the audit corpus,
  derives the count, and routes through `vendorRuleService` to
  write the count back; no domain-service path bypassed the
  single-writer rule. The rule is the third instance of the
  pattern (`ledgerService` for journal entries,
  `documentLinkService` for link rows, `vendorRuleService` for
  vendor-rule rows); future substrate tables in subsequent ADRs
  are expected to follow the same single-writer pattern.
