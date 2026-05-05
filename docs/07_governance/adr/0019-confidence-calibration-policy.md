# ADR-0019: Confidence Calibration Policy

## Status

Ratified 2026-05-04 by CTO per D6 ratification package §3.1.

## Date

2026-05-04

## Triggered by

Phase 0 governance plan Task C11 (Tier 6 — depends on ADR-0007
ratification 2026-05-03 and §Amendment 2026-05-03; ADR-0010
already accepted 2026-04-24; ADR-0011 ratification 2026-05-03;
ADR-0014 ratification 2026-05-03; ADR-0016 ratification
2026-05-04; ADR-0017 ratification 2026-05-04; ADR-0018
ratification 2026-05-04). The 2026-05-02 Document Platform
reframe spec
(`docs/09_briefs/phase-2/document_platform_reframe_design.md`)
named the Confidence Calibration Policy as the eighth and final
ADR of the eight-ADR Phase 0 set per §7. ADR-0014 Decision item 7
("Document-type classification strategy (Q71)") shipped per-
document-type confidence threshold values as **provisional in
v1** under the Q77 v1-ship-gate pattern and forward-pointed Q57
calibration governance to this ADR. ADR-0017 Decision item 4
named the substrate-now-enforcement-later precedent that
ADR-0019's per-org reserved-seat substrate inherits and extended
the forward-pointer to a post-Phase-0 vendor-template-enforcement
calibration ADR scope distinct from ADR-0019's. ADR-0018 Decision
item 3 named Subsystem 2's ambiguity-margin algorithmic placement
with a Router-implementation-default value pending ADR-0019
ratification, and Decision item 4 closed Q56 with the closed list
of v1 re-evaluation triggers (T1–T10; v1-active subset T1, T2,
T3, T4, T5, T6, T8, T10) that ADR-0019 inherits verbatim. The
Session 2D opening prompt at
`docs/09_briefs/phase-2/2026-05-04-session-2d-opening-prompt.md`
(committed at `17b43cd`) carried the brainstorming inheritance;
the design spec at
`docs/superpowers/specs/2026-05-04-adr-0019-confidence-calibration-policy-design.md`
(committed at `dc2e1fb`) consolidated the eight design sections,
the eleven-area boundary callout, the twelve-item out-of-scope
list, the five Phase 0 governance lessons, and the three deferred
Phase 0 closure verification surfaces.

ADR-0019 carries one substantive surface — the calibration
governance for v1's confidence-threshold values — and a tightly
scoped suite of specifications attached to that surface: the
five-decision summary (Path A bounded-substantive-in-v1; Path γ
system-fixed-only-at-v1 with per-org substrate reserved; N = 6
calendar months as the first-cycle wall-clock value; post-v1
cadence = 6 calendar months independently named from N; Q73
confidence-threshold portion complete closure under the
substrate-extension pattern), the five named calibration surfaces
(four active threshold surfaces — `vendor_invoice` / `receipt` /
`payment_confirmation` classifier thresholds plus the Router
Subsystem 2 ambiguity-margin — and one structural always-
exception surface, `unknown`), the cross-domain calibration
coupling discipline that calibrates the four active surfaces as a
coupled set per cycle, the six reserved post-v1 `org_settings.*`
override seats with three-layer defense per ADR-0010, the three
canonical audit events for cycle execution and ratification (with
Framing α audit-event ID + hash citation discipline for
amendment-commit provenance), the two-anchor effective-time
contract that distinguishes governance-anchor from
operational-anchor timestamps, the audit-trail invariance
discipline for prior pre-commit candidates and post-commit ledger
state, the T11 reserved-trigger forward-pointer that stays NEW-
trigger reserved-not-active-v1 until a future ADR-0018 amendment
to its closed list T1–T10, the fifteen ratified-at-v1-ship
parameters, the cycle-execution and threshold-change ratification
authority shapes, the three deferred Phase 0 closure verification
surfaces, and the eleven-area boundary callout that names the
non-ADR-0019 territories adjacent to calibration governance.

## Context

### Why a Confidence Calibration Policy ADR exists

ADR-0014 Decision item 7 shipped four per-document-type
confidence threshold values for v1's classifier — `vendor_invoice`
0.85, `receipt` 0.80, `payment_confirmation` 0.85, `unknown`
always-exception — under the Q77 v1-ship-gate pattern: drafted
now, ratified at v1 ship, calibration governance for ongoing
post-ratification adjustment forward-pointed to this ADR.
ADR-0018 Decision item 3 named Subsystem 2's ambiguity-margin
algorithmic placement and explicitly deferred the value to a
Router-implementation default pending ADR-0019 ratification.
Q57 ("calibration governance: who calibrates against what test
set how often") was the canonical Q-anchor for the calibration
question across both ADR-0014 and ADR-0018; Q73 ("OCR /
extraction / classification / language / threshold per-org
configurability portion") was the canonical Q-anchor for whether
threshold values should be per-org-tunable or system-fixed.
Neither question fit inside ADR-0014 or ADR-0018: the threshold
values themselves are operational properties of the classifier
and Router (code paths branch on them), but the **governance**
of those values — who has authority to calibrate, what data
informs the calibration, what audit trail records the
calibration, what immutability boundary applies when values move
post-commit — is a distinct concern. ADR-0019 owns the
governance; ADR-0014 / ADR-0018 own the values.

ADR-0019 ratifies (per Q77 v1-ship-gate pattern) the four active
threshold values at v1 ship + 6 months. If ratification adjusts
values, an ADR-0014 amendment cascade fires for the per-document-
type classifier surfaces (3.1 / 3.2 / 3.3); if the ambiguity-
margin moves, an ADR-0018 amendment cascade fires for surface
3.5. Cascades are independent per surface; both can fire from the
same cycle. Cascades reference the calibration cycle's audit
events as ratification provenance via Framing α (audit-event ID +
content hash citation; the audit log is the single source of
truth, not the cited content).

### Why governance-level, not engineering-only

A purely engineering-level treatment of confidence thresholds
would name the values, ship them, and let the implementation
team retune them as data accumulates. That is insufficient for a
Phase 0 governance corpus because:

- The threshold values determine which controller-review surface
  receives more burden (proposal-path-confirmation vs exception-
  queue-resolution per ADR-0011 §7 + §13). Burden allocation is
  a controller-experience product decision, not an engineering
  decision.
- The threshold values determine which classifications produce
  proposed `source_document_links` rows under ADR-0016 §6
  immutability. A retroactive threshold change would fight the
  lifecycle immutability principle if it tried to revisit prior
  decisions; a prospective-only contract is required, and the
  contract is governance.
- The threshold values are referenced by ADR-0014 Decision item
  7 and ADR-0018 Decision item 3 as **locked decisions** in the
  Phase 0 corpus. Changes to them are amendment cascades against
  ratified ADRs, requiring the same cascade discipline as any
  other ADR amendment.
- The cycle execution itself produces an audit trail that other
  controllers (and the founder) need to be able to read against
  the canonical INV-AUDIT-002 append-only invariant. Audit-event
  taxonomy and emission discipline are governance.

ADR-0019 fills the governance-level gap. The split is intentional
and load-bearing: ADR-0014 / ADR-0018 own values and operational
behavior; ADR-0019 owns the meta-governance for moving those
values, the audit trail for the moves, the authority for
ratifying the moves, and the immutability contracts that hold
when values move post-commit. A future contributor who proposes
adjusting a threshold without firing the calibration cycle is
proposing a governance violation; the rule is preserved in Notes
for future ADR writers (item a).

### Q23 / Q24 cross-references

Q57's filed framing in `docs/02_specs/open_questions.md` cross-
references `agent_autonomy_model.md` Q23 ("agent ladder
thresholds — fixed at the system level for v1") and Q24 ("limit
change authorization: controller-direct vs controller-proposes /
owner-approves vs owner-only"). The cross-references are
load-bearing for ADR-0019:

- **Q23 supports Path γ's system-fixed-only-at-v1 shape.** Q23
  established the system-level-only authority pattern for ladder
  thresholds in v1; ADR-0019 inherits the pattern for confidence
  thresholds. Both are system-fixed-only at v1; both reserve the
  per-org substrate per ADR-0010 reserved-enum-states discipline;
  both forward-point per-org operational activation to post-v1.
  ADR-0019 *completes* Q23 by specifying the system-level update
  authority Q23 left unspecified — CTO + Controller jointly
  ratify threshold changes; the founder reviews when material
  user-workflow impact is identified.
- **Q24 informs the post-v1 per-org-activation authorization
  pattern** (forward-pointed; not ratified in v1). When the
  post-v1 per-org operational activation ADR ships, it will need
  to specify per-org threshold-change authorization (a Q24-
  pattern controller-proposes / owner-approves analog), per-org
  calibration-cycle execution authority, and the runtime-
  consumption contracts for the six reserved `org_settings.*`
  columns. ADR-0019 names the forward-pointer; the post-v1 ADR
  ratifies the authorization shape.

ADR-0019 does not extend Q23 or Q24 themselves. The agent-ladder
threshold authorization (Q23) and the limit-change authorization
(Q24) remain owned by `agent_autonomy_model.md`; ADR-0019 only
inherits the patterns Q23 / Q24 establish for the confidence-
threshold domain.

### Reading B preservation as load-bearing constraint

`ledger_truth_model.md` Service Communication Rules and ADR-0011
§8 establish Reading B: domain services own domain logic; the
ledger service is the sole writer of `journal_entries` and
`journal_lines`; both run inside `withInvariants()` per Service
Communication Rule 1. ADR-0014 Decision item 11 ("Pipeline output
→ ProposedMutation/Bundle/Attachment routing") preserves Reading
B at the Tier 2 boundary; ADR-0016 single-writer rule preserves
Reading B at the link-row boundary; ADR-0017 single-writer rule
preserves Reading B at the vendor-rule boundary; ADR-0018
preserves Reading B at the Tier 2.5 boundary by forbidding the
Router from writing to `source_document_links` or
`journal_entries` directly.

**ADR-0019 introduces NO new write service.** Calibration
governance operates through three existing surfaces:

1. The canonical audit-log writer per ADR-0011 §1
   (`recordMutation.ts` per INV-AUDIT-001) emits the three
   calibration audit events. No new audit-write service path.
2. The existing `org_settings.*` writer (Sub-verification 1
   deferred to Phase 0 closure verification per §10 of the
   design spec) handles writes to the six reserved post-v1
   columns when the post-v1 per-org operational activation ADR
   ratifies. No new `org_settings.*` write service path.
3. A platform-team-executed cycle process (runbook + script) at
   `v1_ship_at + 6 calendar months` and every 6 calendar months
   thereafter prepares the calibration test set, runs the
   computation, emits the audit events, drafts the amendment-
   cascade commits if the 0.02 floor is crossed, and routes the
   ratification-approval request to CTO + Controller. The cycle
   process is operational obligation, not a new service.

The four prior single-writer-rule applications stand unchanged at
four (`ledgerService` for journal entries; `documentLinkService`
for `source_document_links`; `vendorRuleService` for
`vendor_rules`; the Router for `document_relationship_candidates`
per ADR-0018). ADR-0019 does not introduce a fifth single-writer
rule.

### Phase 0 dependency context

ADR-0019 sits at Tier 6 of Phase 0's eight-ADR architecture and
is the last ADR of the Phase 0 corpus. Tier 6 is the algorithm-
apex governance layer above Tier 5 (Relationship Router / ADR-
0018) and Tier 4 (the trio: AP/Spend / ADR-0015, Document
Relationship Graph / ADR-0016, Vendor Template Substrate /
ADR-0017).

ADR-0019 depends on:

- **ADR-0007** — three-tier agent architecture; specifically
  Tier 2.5 timing contract (calibration values are consumed at
  Tier 2 classifier output and Tier 2.5 Router Subsystem 2; the
  consumption timing constrains when newly-calibrated values
  take effect — see §7.1 Two-anchor effective-time contract).
  The §Amendment 2026-05-03 closed Q66 (Router tier placement)
  is referenced; ADR-0019 does not re-open Q66.
- **ADR-0010** — reserved-enum-states discipline. Three-layer
  defense (DB CHECK at Layer 1, Zod boundary at Layer 2, service
  emission filter at Layer 3) applied verbatim to the six
  reserved `org_settings.*` columns plus the
  `amendment_cascades_fired` enum array on Event 2. ADR-0019
  does NOT redraft the discipline; it applies it to the
  calibration substrate.
- **ADR-0011** — Document Platform spine; specifically §1 entity
  ownership boundary (the `org_settings.*` table-existence
  boundary), §7 ProposedAttachment primitive (calibration
  consumes the same data shape that controller-confirmed
  exception-queue resolutions produce), §9 lifecycle
  immutability rules (post-commit threshold changes do NOT
  re-route post-commit links).
- **ADR-0014** — Tier 2 Document Pipeline; specifically Decision
  item 7 (the four per-document-type confidence threshold values
  ADR-0019 ratifies and the always-exception structural rule for
  `unknown`) and Decision item 8 (the AI fallback contract whose
  Tier C confidence is the input to Decision item 7's
  classification gate). ADR-0019 ratifies the values at v1 ship
  + 6 months; if values move, ADR-0014 amends.
- **ADR-0016** — Document Relationship Graph; specifically §6
  lifecycle immutability cross-reference for §7 of this ADR
  (audit-trail invariance under threshold changes).
- **ADR-0017** — Vendor Template Substrate; specifically Decision
  item 4 (the substrate-now-enforcement-later precedent that
  ADR-0019's per-org-substrate-reserved framing inherits and the
  post-Phase-0 enforcement-calibration ADR scope that ADR-0019
  does NOT subsume). The forward-pointer in ADR-0017 Decision
  item 4 is to a future amendment-or-new-ADR scope distinct from
  ADR-0019's; ADR-0019 is the four-substantive-surface
  calibration ADR; vendor-template post-v1 enforcement
  calibration is a separate scope.
- **ADR-0018** — Relationship Router; specifically Decision item
  3 (Subsystem 2 ambiguity-margin algorithmic placement, with
  the Router-implementation default value pending ADR-0019
  ratification) and Decision item 4 (Q56 closure with the closed
  list of v1 re-evaluation triggers T1–T10). ADR-0019 ratifies
  the ambiguity-margin **value** at v1 ship + 6 months and
  inherits the T1–T10 closed list verbatim. T11 in §7.4 is a
  NEW reserved-not-active-v1 trigger requiring a future ADR-0018
  amendment to the closed list — NOT an activation of any
  existing ADR-0018 reserved seat (T7 vendor-master merge or T9
  document supersession).

### What ADR-0007 / ADR-0010 / ADR-0011 / ADR-0014 / ADR-0016 / ADR-0017 / ADR-0018 already nailed down (do not redraft)

- **ADR-0007 §Tier 2.5 (closed Q66 by 2026-05-03 Amendment).**
  Tier 2.5 is the Read-Only Ledger-Aware Path that authorizes
  reads against committed ledger state without authorizing
  writes. The Router and the calibration-cycle script both
  operate within Tier 2.5's read-only-with-ledger-context
  contract. ADR-0019 does NOT redraft Tier 2.5.
- **ADR-0010 reserved-enum-states discipline.** Three-layer
  defense applied verbatim to the six reserved `org_settings.*`
  columns and to `amendment_cascades_fired`. ADR-0019 does NOT
  redraft the discipline.
- **ADR-0011 §1 entity ownership.** `org_settings` is a
  cross-cutting platform-config table; AP/Spend and Document
  Platform both consume settings; the table itself ships with
  ADR-0011's spine. ADR-0019 does NOT propose moving the table
  or extending the entity-ownership boundary.
- **ADR-0011 §7 ProposedAttachment.** The proposal-path /
  exception-queue-resolution split is the substrate the
  calibration corpus draws from. ADR-0019 does NOT redraft the
  ProposedAttachment contract.
- **ADR-0011 §9 + ADR-0016 §6 lifecycle immutability.**
  Post-commit `journal_entries` / `journal_lines` /
  `source_document_links` rows are immutable under threshold
  changes. ADR-0019 inherits the principle verbatim and extends
  it with the prospective-not-retroactive contract (§7).
- **ADR-0014 Decision item 7 per-document-type confidence
  threshold values.** The four values (0.85 / 0.80 / 0.85 /
  always-exception) are the v1-fixed defaults ADR-0019 ratifies
  per Q77 pattern. ADR-0019 does NOT amend the values pre-
  ratification; the ratification cycle at v1 ship + 6 months
  may amend them.
- **ADR-0014 Decision item 8 AI fallback.** The Tier C AI
  fallback's `confidence` output is what the per-document-type
  thresholds gate. ADR-0019 does NOT redraft the AI fallback
  contract.
- **ADR-0016 §6 lifecycle immutability cross-reference.** The
  post-commit link-row immutability discipline is inherited
  verbatim. ADR-0019 does NOT redraft the lifecycle invariant
  for `source_document_links`.
- **ADR-0017 Decision item 4 substrate-now-enforcement-later
  precedent.** The pattern (substrate at v1; enforcement
  forward-pointed) is the fifth-Phase-0-application pattern
  ADR-0019 inherits for Path γ (per-org `org_settings.*`
  substrate reserved at v1 schema time; per-org operational
  activation forward-pointed to post-v1). ADR-0019 does NOT
  redraft the pattern.
- **ADR-0018 Decision item 3 Subsystem 2 ambiguity-margin
  algorithmic placement.** The algorithm — top candidate
  confidence minus runner-up confidence, propose-the-best vs
  propose-with-ambiguity-flag vs route-to-exception based on
  the margin — is owned by ADR-0018. ADR-0019 ratifies the
  threshold value at v1 ship + 6 months but does NOT redraft
  the algorithm or move the algorithmic placement.
- **ADR-0018 Decision item 4 Q56 closure with T1–T10 closed
  list.** The v1 re-evaluation trigger set is closed at T1–T10
  (v1-active subset T1, T2, T3, T4, T5, T6, T8, T10). ADR-0019
  inherits the closed list **verbatim**; T11 in §7.4 is a NEW
  reserved-not-active-v1 trigger that would require a future
  ADR-0018 amendment **to that closed list** — NOT an
  activation of T7 or T9 reserved seats.

## Decision

### 1. Path A — Bounded substantive in v1 (Q57 governance + Q65 / ambiguity-margin ratification at v1 ship + 6 months)

ADR-0019 ratifies a **bounded operational governance** for the
four active confidence-threshold surfaces in v1. The bounds:

- The first calibration cycle runs at `v1_ship_at + 6 calendar
  months` (Decision item 3 first-cycle timing N).
- Subsequent cycles run every 6 calendar months thereafter
  (Decision item 4 post-v1 cadence).
- The cycle test-set composition, computation methodology,
  ratified floors, and audit-event schemas are ratified at v1
  ship time (per Decision item 9 fifteen ratified-at-v1-ship
  parameters).
- The cycle's amendment-cascade authority (CTO + Controller
  joint ratification) is ratified at v1 ship (per Decision item
  6 authority).

The bounds reduce v1 design risk without sacrificing operational
obligation: every calibration parameter the cycle consumes is
ratified now; the **outcome** of the first cycle (whether values
move, by how much, with what justification) is the only design-
by-prediction surface, and the 0.02 adjustment-rule floor
prevents amendment churn from sub-noise movements.

Path A bounded-substantive-in-v1 is the **first Phase 0
governance lesson** captured by this ADR — a framing future
governance authors can apply to any calibration-shaped surface
where v1 lacks the data to ratify final values but cannot defer
the entire question to post-v1 without leaving operational
behavior unanchored.

### 2. Path γ — System-fixed-only-at-v1 + per-org substrate reserved (Q73 confidence-threshold portion complete closure)

Threshold values are **system-fixed-only at v1**: every org
running on the platform consumes the same v1-ratified values; no
per-org override is operationally active at v1.

Per-org override **substrate** is reserved at v1 schema time per
ADR-0010 reserved-enum-states discipline. The six reserved post-
v1 `org_settings.*` columns ship at v1:

| Reserved seat | Maps to surface | v1 runtime behavior |
|---|---|---|
| `org_settings.confidence_threshold_vendor_invoice` | 3.1 | NULL-default; runtime falls through to system-fixed default |
| `org_settings.confidence_threshold_receipt` | 3.2 | NULL-default; runtime falls through to system-fixed default |
| `org_settings.confidence_threshold_payment_confirmation` | 3.3 | NULL-default; runtime falls through to system-fixed default |
| `org_settings.confidence_threshold_ambiguity_margin` | 3.5 | NULL-default; runtime falls through to ADR-0018-implementation-default |
| `org_settings.calibration_cadence` | (governance config) | NULL-default; runtime falls through to system-fixed cadence (6 months); per-org cadence override is reserved only in v1, NOT operationally active |
| `org_settings.calibration_test_set_version` | (governance config) | NULL-default; runtime falls through to platform-shipped test-set version |

All six columns ship NULL-default at v1; the runtime fall-through
to system-fixed values is mechanical (the consumer code reads
the column; if NULL, falls through to the system-fixed default
per the existing classifier and Router code paths). Three-layer
defense per ADR-0010: Layer 1 DB CHECK constraints permit only
NULL or values in the legal `[0, 1]` numeric range (for
threshold columns) or NULL or values in the legal cadence /
version enum (for governance-config columns); Layer 2 Zod
boundary rejects non-NULL values during v1 service-call
validation; Layer 3 service emission filter prevents the existing
`org_settings.*` writer from emitting any non-NULL value at v1.

Per-org operational activation is forward-pointed to a post-v1
amendment-or-new-ADR per the ADR-0017 Decision item 4 deferred-
to-draft-time framing. The activation ADR will need to specify
per-org threshold-change authorization (a Q24-pattern analog),
per-org calibration-cycle execution authority, and the runtime-
consumption contracts that loosen the Layer 2 / Layer 3 emission
filters on the six reserved columns.

The six reserved columns are **disjoint** from ADR-0014's twelve
OCR / retention / language reserved columns from Q73's other
portion. Future contributors proposing a calibration-related
column should add it to this set (with an ADR-0019 amendment);
future contributors proposing an OCR / retention / language-
related column should add it to ADR-0014's set (with an ADR-0014
amendment). The disjointness is mechanical because the column
name prefixes (`confidence_threshold_*` / `calibration_*` here;
`ocr_*` / `retention_*` / `language_*` in ADR-0014) do not
collide.

Path γ system-fixed-only-at-v1 + per-org-substrate-reserved is
the **fifth Phase 0 application** of the substrate-now-
enforcement-later pattern (after ADR-0011 reserved exception-
resolution-actions; ADR-0014 Tier B classifier reserved post-v1;
ADR-0014 reserved `org_settings.*` columns from Q73's other
portion; ADR-0017 vendor-rules enforcement). It is the **second
Phase 0 governance lesson** captured by this ADR.

### 3. First-cycle timing N = 6 calendar months (one-shot wall-clock from v1_ship_at)

The first calibration cycle triggers at `v1_ship_at + 6 calendar
months`. `v1_ship_at` is anchored to the production-deployment
commit and recorded as `v1_ship_at` in a platform-config artifact
at v1 deployment.

Platform team has **±2-week execution discretion** for quarter-
end alignment (e.g., shifting the cycle by up to two weeks to
avoid landing on a quarter-close week when controller capacity is
constrained). The audit event `calibration_run_completed`
records both `scheduled_at` (the `v1_ship_at + 6` target) and
`executed_at` (the actual cycle-execution timestamp).

`N` is a **one-shot wall-clock value**, consumed once at the
first cycle. `N` is not a recurring cadence parameter — the
post-first-cycle cadence is governed by Decision item 4
independently. A future contributor who proposes "N is the
recurring cadence" is conflating two independently-named
parameters; the rule is preserved in Notes for future ADR
writers (item c).

### 4. Post-v1 cadence = 6 calendar months (independently named from N)

Subsequent cycles run **every 6 calendar months** after the first
cycle (cycle 2 at month 12; cycle 3 at month 18; etc.). Same
test-set composition, same computation methodology, same outcome-
recording shape; `cycle_number ≥ 2` for subsequent cycles.

The post-v1 cadence is **independently named from N**: the two
parameters are separately ratifiable and separately amendable.
If post-first-cycle data informs a need for a different cadence,
an ADR-0019 amendment can change the cadence without changing N
(N is consumed; only the cadence remains operationally live).
Equivalently, if the first cycle's timing is shifted (e.g., a
one-time shift of N to 4 months because v1 ships earlier than
expected and 6-month traffic accumulation is unnecessary), the
cadence can remain at 6 months without compounding the timing
shift.

`org_settings.calibration_cadence` is **reserved only in v1**;
no per-org cadence override is operationally active at v1. The
substrate ships at v1; the per-org operational activation is
forward-pointed per Decision item 2.

The independent-naming pattern (N ≠ post-v1 cadence) is the
**third Phase 0 governance lesson** captured by this ADR — a
framing future governance authors can apply to any timing
parameter where the first-cycle wall-clock value is conceptually
distinct from the recurring period. Independently-named timing
parameters preserve the degree-of-freedom for post-first-cycle
adjustment.

### 5. Calibration surfaces (five named threshold surfaces; four active calibration + one structural always-exception)

ADR-0019 governs calibration of confidence-threshold values
across **two distinct subsystem domains** with five named
threshold surfaces.

**Subsystem domain 1 — ADR-0014 classifier per-document-type
confidence thresholds (4 surfaces; 3 active calibration + 1
structural always-exception).**

| Surface | Document type | v1-fixed default (Q65) | Calibration semantics |
|---|---|---|---|
| **3.1** | `vendor_invoice` | 0.85 | Above → proposal path; below → exception queue |
| **3.2** | `receipt` | 0.80 | Above → proposal path; below → exception queue |
| **3.3** | `payment_confirmation` | 0.85 | Above → proposal path; below → exception queue |
| **3.4** | `unknown` | always-exception (no threshold) | Always routes to exception queue regardless of confidence; structural per ADR-0014 Decision item 7; **NOT threshold-calibrated** |

Surface 3.4 is **structurally always-exception** per ADR-0014
Decision item 7's `unknown` document-type contract. There is no
threshold value to calibrate; the routing is unconditional
exception-queue regardless of any confidence number the
classifier emits. ADR-0019 acknowledges 3.4 as a calibration
surface for taxonomic completeness but does NOT generate a
calibration recommendation for it.

**Subsystem domain 2 — ADR-0018 Router Subsystem 2 ambiguity-
margin threshold (1 surface).**

| Surface | Subsystem | v1-fixed default | Calibration semantics |
|---|---|---|---|
| **3.5** | Router Subsystem 2 ambiguity-margin | Router-implementation default (Q77-pattern provisional) | Numeric threshold in `[0, 1]` applied to (top candidate confidence − runner-up confidence). Margin ≥ threshold → propose-the-best; margin < threshold → propose-with-ambiguity-flag (or route-to-exception if cluster large) |

The ambiguity-margin algorithmic placement is owned by ADR-0018
Decision item 3. ADR-0019 ratifies the **value** at v1 ship + 6
months; ADR-0019 does NOT amend the algorithm or move the
algorithmic placement.

**Cross-domain calibration coupling.** The four active surfaces
(3.1 / 3.2 / 3.3 / 3.5) are calibrated as a **coupled set per
first cycle, NOT independently**. A Subsystem 2 ambiguity-margin
calibrated against post-classification candidate distributions
WILL shift if upstream classifier thresholds shift; coordinated
calibration prevents the second cycle from running against
shifted upstream distributions.

The coupling is operationalized in three places:

1. The single `calibration_run_completed` event (Event 2)
   carries `prior_value_set` / `recommended_value_set` /
   `new_value_set` JSON fields covering all four active
   surfaces, not four separate event emissions.
2. The `amendment_cascades_fired` field on Event 2 is an enum
   array (Decision item 8) with values
   `ADR_0014_DOCUMENT_TYPE_THRESHOLDS` and
   `ADR_0018_AMBIGUITY_MARGIN`, allowing both cascades to fire
   from one cycle.
3. Subsystem 2 calibration consumes a paired
   `subsystem_1_candidate_set` per document in the test-set
   artifact (Sub-verification 3 deferred — see §10 of the
   design spec); the candidate set is generated against the
   classifier-output distribution that exists at cycle start,
   not against a hypothetical post-cascade distribution.

Cross-domain calibration coupling is the **fourth Phase 0
governance lesson** captured by this ADR — a framing future
governance authors can apply to any multi-stage pipeline where
downstream-stage thresholds depend on upstream-stage
distributions.

### 6. Calibration cycle authority (two-layer split)

| Authority | Holder | Scope |
|---|---|---|
| **Cycle-execution authority** | Platform team (only) | Initiates the calibration runbook; prepares the test set; runs the computation; emits the audit events |
| **Threshold-change ratification authority** | **CTO + Controller (joint)** | Reviews `confidence_threshold_calibrated` events; ratifies or rejects each recommended movement; if ratified, authorizes ADR-0014 / ADR-0018 amendment-cascade single-purpose commits |
| **Product-shape review** | Founder (only when threshold behavior materially affects user workflow) | Reviewed by CTO + Controller before threshold-change ratification if material user-workflow impact is identified |

The split codifies a discipline: **computation is evidence-
gathering; threshold amendment is governance.** Authority
follows that split. The platform team executes the cycle
mechanically; the CTO + Controller jointly review the recommended
movements and ratify before any ADR amendment lands. The founder
reviews when the threshold change materially affects user
workflow (e.g., a meaningful shift in proposal-path vs exception-
queue burden allocation); the founder is not in the routine
ratification loop because the threshold change does not, on its
face, require founder-tier authority — it requires CTO+Controller
joint accountability for the value change.

ADR-0019 *completes* Q23 by specifying the system-level update
authority Q23 left unspecified. Path γ + CTO+Controller
ratification preserves the system-fixed framing (no per-org
override at v1) while ensuring governance accountability for
value changes.

**Cycle-execution-authority post-v1 amendment pathway.** If
post-first-cycle data informs a need for a controller-approval-
gate before computation (e.g., the cycle should require explicit
controller sign-off before the test set is published), an
ADR-0019 amendment can add a controller-approval-gate at the
cycle-execution-authority layer. v1 ships platform-team-only at
the execution layer; the amendment pathway is named here so the
post-v1 authority refinement does not land as a surprise.

**Post-v1 per-org override authority pathway forward-pointer.**
Per-org override authority is forward-pointed to post-v1
amendment-or-new-ADR per Decision item 2 (Path γ substrate
extension). The activation ADR will specify per-org threshold-
change authorization (a Q24-pattern controller-proposes / owner-
approves analog) and per-org cycle-execution authority. ADR-0019
does NOT pre-specify the activation authority shape.

### 7. Calibration cycle test-set composition and computation methodology

The first calibration cycle (and every subsequent cycle) runs
against a **pooled cross-org v1 production data** test set. The
test set is NOT per-org cohorts — pooling avoids low-volume orgs
generating noisy per-org calibrations. The `org_set` field
records contributing orgs; per-org runtime behavior remains
identical (system-fixed) regardless of contributing-org
identity.

| Property | v1-ratified value | Rationale |
|---|---|---|
| **Test-set size per active document type** | 100 documents (or all eligible if fewer; underpowered-surface fallback) | Standard calibration sample size at family-office volume |
| **Sampling source** | Controller-confirmed exception-queue resolutions from v1 production traffic | Natural ground-truth labels |
| **Sampling strategy** | Stratified random sampling within each document type, stratified by classifier confidence-score bucket | Covers full distribution proportionally |
| **Stratification bucket boundaries** | `[0.0, 0.6, 0.7, 0.8, 0.9, 1.0]` (5 buckets) | Oversamples 0.6–0.9 boundary region |
| **Source-org eligibility floor** | ≥ 50 controller-confirmed resolutions per active type | Prevents low-volume orgs from dominating |
| **Test-set version artifact** | Versioned, hash-verifiable, immutable, JSON format v1 | Q30 byte-for-byte reproducibility |
| **Underpowered-surface fallback** | Use all eligible documents; mark surface as underpowered; **default rule for underpowered surfaces: NO automatic threshold movement** — recommended value is computed against the available data but does NOT propose movement absent explicit CTO + Controller justification. Threshold-lowering specifically requires explicit CTO + Controller justification (sample-size insufficient to bound false-positive rate at the 0.95 precision floor); threshold-raising under underpowered conditions also requires justification (sample-size insufficient to confirm operating-curve shift). | Particularly relevant for `payment_confirmation` |
| **Ambiguity-margin test fixture** | Same test set + paired Subsystem 1 candidate set per document (Sub-verification 3 deferred to Phase 0 closure) | Subsystem 2 calibration requires candidate distribution |

**Computation methodology — classifier surfaces (3.1 / 3.2 / 3.3).**
For each active classifier surface, compute the operating curve
(precision-recall vs threshold) over the test set; identify the
operating point that minimizes controller-review burden subject
to **precision floor 0.95**; recommend the threshold at the
operating point.

**Computation methodology — ambiguity-margin (3.5).** Compute
the operating curve (propose-the-best correctness vs propose-
with-ambiguity-flag controller-review-burden vs margin); identify
the operating point that minimizes controller-review burden
subject to **correctness floor 0.98**; recommend the margin at
the operating point.

**Adjustment-rule floor: 0.02 absolute-delta.** If `|recommended_value
− current_value| < 0.02`, the current value is ratified as-is and
NO amendment cascade fires. Above 0.02, the amendment cascade
fires per Decision item 8.

The 0.02 floor is a **governance amendment threshold, NOT a
statistical truth claim** — it prevents amendment churn from
sub-noise movements. Post-cycle data may inform refinement of the
floor via a future ADR-0019 amendment; the floor is named at v1
ship as a governance discipline, not as a final statistical
parameter.

**Precision floor 0.95 rationale (vs financial-controls 0.99
convention).** ADR-0014's classifier is a **routing classifier**
(routes to proposal path with downstream Tier 1 commit-time
confirmation gate per ADR-0011 §7, vs routes to exception queue
with downstream controller resolution per ADR-0011 §13), NOT a
terminal-decision classifier. Both routes have downstream
controller review; the classifier's precision determines which
review surface receives more burden. Proposal-path-confirmation
is the more efficient controller surface (one click); exception-
queue-resolution requires explicit decision-making (higher per-
document cognitive cost). 0.95 is operationally preferable —
financial-controls 0.99 conventions apply to terminal-decision
classifiers without downstream review, which is not ADR-0014's
shape.

### 8. Cycle outcome recording (four audit events; Framing α amendment-commit citation)

The cycle emits **four audit events** through the canonical
audit-log writer per ADR-0011 §1; durable per INV-AUDIT-002
append-only.

1. **`calibration_test_set_published`** — emitted at test-set
   publication time, **BEFORE** cycle execution.
2. **`calibration_run_completed`** — emitted at cycle completion,
   **AFTER** computation, **BEFORE** threshold-change
   ratification.
3. **`confidence_threshold_calibrated`** — emitted **per surface
   that crossed the 0.02 floor** (zero to four events per cycle
   for the four active surfaces 3.1 / 3.2 / 3.3 / 3.5),
   **AFTER** `calibration_run_completed`, **AFTER** CTO +
   Controller threshold-change ratification, **BEFORE** the
   corresponding ADR amendment cascade single-purpose commit.
   Records the governance-anchor (ratification) timestamp via
   `event_emitted_at`; does NOT record the operational-anchor
   (deployment) timestamp.
4. **`confidence_threshold_deployed`** — emitted **per surface
   whose new value is picked up by the running pipeline**
   (zero to four events per cycle), **AFTER** the deployment
   system rolls out the new value to production runtime.
   Records the operational-anchor (deployment) timestamp via
   `event_emitted_at`. Emitted by the deployment system through
   the canonical audit-log writer per ADR-0011 §1, NOT through
   post-emission enrichment of Event 3 (which would violate
   INV-AUDIT-002 append-only).

If no surface crosses the 0.02 floor, **no
`confidence_threshold_calibrated` event is emitted** and **no
`confidence_threshold_deployed` event is emitted**; the empty
`amendment_cascades_fired` array on `calibration_run_completed`
is the canonical no-change record. The cycle still emits Event 1
+ Event 2; Events 3 and 4 are conditional.

**Amendment cascade.** If `amendment_cascades_fired` array is
non-empty, the platform team prepares the corresponding ADR
amendment(s) per single-purpose-commit discipline:

- **ADR-0014 amendment** (if 3.1 / 3.2 / 3.3 moved): updates
  Decision item 7's "Per-document-type confidence threshold
  values" table.
- **ADR-0018 amendment** (if 3.5 moved): updates Decision item
  3's documented Router-implementation default.

The amendment cascades are independent per surface; both can
fire from the same cycle; both reference the same
`calibration_run_completed` event as ratification provenance via
**Framing α** (audit-event ID + content hash citation, NOT
content embedding). Event 4 (`confidence_threshold_deployed`)
is NOT cited in amendment-cascade commit bodies — Framing α
applies to ratification provenance (Events 2 + 3) only;
deployment provenance (Event 4) is a separate audit-trail
surface verified via §Decision item 13 audit-trail invariance
+ §Decision item 12 two-anchor effective-time contract.

**Framing α amendment-commit citation discipline.** ADR-0014 /
ADR-0018 amendment commits triggered by calibration-cycle
ratifications cite ratification provenance by **audit-event ID
+ content hash**, NOT by embedding the audit-event content into
the commit body. Amendment commit body shape:

```
This amendment ratifies the threshold change from calibration cycle {cycle_number}.

Ratification provenance:
- calibration_run_completed event ID: {event_id}
- calibration_run_completed event content hash: {SHA-256}
- confidence_threshold_calibrated event ID (this surface): {event_id}
- confidence_threshold_calibrated event content hash: {SHA-256}
- Cycle scheduled_at: {timestamp}
- Cycle executed_at: {timestamp}
- CTO ratifier: {cto_ratifier_id}
- Controller ratifier: {controller_ratifier_id}
- Founder reviewer (if review requested): {founder_reviewed_by_id | not_requested}
- Prior value: {prior_value}
- New value: {new_value}
- 0.02 floor decision: {applied | not_applied}
```

The audit log is single source of truth; the citation references
canonical state. A future contributor reading the amendment
commit body queries the audit log by `event_id`, verifies the
content hash, and confirms the cited ratification. If the audit
log is unavailable or the hash does not match, the amendment is
unverifiable — the citation discipline preserves the audit log's
position as canonical state.

Framing α is the **fifth Phase 0 governance lesson** captured by
this ADR. The discipline (audit-event ID + content hash citation
in ADR amendment commits) generalizes to any future audit-event-
anchored governance event-driven ADR amendment cascade. **Strong
codification candidate flagged for Session 2D / 2E closeout
adjudication** per the Z1 carry-forward queue.

**Threshold-change approval.** CTO + Controller jointly ratify
each `confidence_threshold_calibrated` event before the
corresponding amendment cascade fires (per Decision item 6).
Ratification is recorded in the Event 3 fields `cto_ratifier_id`
and `controller_ratifier_id`. If the founder reviewed (material
user-workflow impact identified), `founder_review_requested =
true` and `founder_reviewed_by_id` is populated; otherwise
`founder_review_requested = false` and `founder_reviewed_by_id` is
NULL.

**Cycle-wide trace_id discipline.** All four audit events for
a cycle share a `trace_id` (UUID). Generated at cycle start when
`calibration_test_set_published` emits; propagated to all
subsequent events of the same cycle including Event 4 which may
emit substantially later (post-deployment) than Events 1–3.
Allows querying the full cycle's event chain by `trace_id`.
Structurally parallel to ADR-0012's `bundle_id` and ADR-0018's
Subsystem 3 dispatcher `trace_id`.

### 9. Fifteen ratified-at-v1-ship parameters

The following fifteen parameters are ratified at v1 ship and are
**locked** under the calibration cycle (not subject to the
0.02-floor adjustment-rule machinery; changes require ADR-0019
amendment, not a calibration cycle outcome).

| # | Parameter | v1-ratified value | Source |
|---|---|---|---|
| 1 | Stratification bucket boundaries | `[0.0, 0.6, 0.7, 0.8, 0.9, 1.0]` (5 buckets) | Decision item 7 |
| 2 | Test-set size per active document type | 100 documents | Decision item 7 |
| 3 | Source-org eligibility floor | ≥ 50 controller-confirmed resolutions per active type | Decision item 7 |
| 4 | Underpowered-surface fallback policy | Use all eligible; mark underpowered; threshold-lowering requires CTO + Controller approval | Decision item 7 |
| 5 | Precision floor (3.1 / 3.2 / 3.3) | 0.95 | Decision item 7 |
| 6 | Correctness floor (3.5) | 0.98 | Decision item 7 |
| 7 | Adjustment-rule floor | 0.02 absolute-delta | Decision item 7 |
| 8 | First-cycle timing N | 6 calendar months from `v1_ship_at` | Decision item 3 |
| 9 | Post-v1 cadence | Every 6 calendar months after first cycle | Decision item 4 |
| 10 | Cycle-execution authority | Platform team only | Decision item 6 |
| 11 | Threshold-change ratification authority | CTO + Controller (joint) | Decision item 6 |
| 12 | Product-shape review trigger | Founder approval requested for material user-workflow impact | Decision item 6 |
| 13 | `amendment_cascades_fired` enum values | `ADR_0014_DOCUMENT_TYPE_THRESHOLDS`, `ADR_0018_AMBIGUITY_MARGIN` | Decision item 8 |
| 14 | Calibration test-set artifact format-version | v1 | Decision item 11 |
| 15 | Calibration audit-event schema-version | v1 | Decision item 10 |

A future contributor who proposes adjusting any of the fifteen
parameters must amend ADR-0019; the calibration cycle does not
have authority to amend its own parameters. The discipline is
preserved in Notes for future ADR writers (item d).

### 10. Four audit events — schema specification

All four events flow through the canonical audit-log writer per
ADR-0011 §1; durable per INV-AUDIT-002 append-only. All four
events carry `schema_version: "v1"` field.

**Event 1 — `calibration_test_set_published` (13 fields).**

`event_id`, `event_type`, `event_emitted_at`, `cycle_number`,
`test_set_version`, `test_set_hash`, `sampling_parameters`
(JSON), `document_count_per_type` (JSON), `org_set` (array),
`underpowered_surfaces` (array), `published_by`
(platform_team_member_id per Decision item 6), `trace_id`,
`schema_version`.

**Event 2 — `calibration_run_completed` (16 fields).**

`event_id`, `event_type`, `event_emitted_at`, `cycle_number`,
`scheduled_at`, `executed_at`, `test_set_version`,
`test_set_published_event_id`, `prior_value_set` (JSON),
`recommended_value_set` (JSON, UN-rounded operating-curve
recommendations), `new_value_set` (JSON, after 0.02 floor),
`amendment_cascades_fired` (enum array), `operating_curve_summary`
(JSON), `executed_by`, `trace_id`, `schema_version`.

**Event 3 — `confidence_threshold_calibrated` (17 fields).**

`event_id`, `event_type`, `event_emitted_at`, `cycle_number`,
`surface_id` (enum), `prior_value` (numeric), `recommended_value`
(numeric, UN-rounded), `new_value` (numeric, ratified),
`amendment_cascade_target` (enum: `ADR_0014` or `ADR_0018`),
`cto_ratifier_id`, `controller_ratifier_id`,
`founder_review_requested` (boolean), `founder_reviewed_by_id`
(nullable), `justification` (text),
`calibration_run_completed_event_id`, `trace_id`,
`schema_version`.

`event_emitted_at` is the governance-anchor (ratification)
timestamp per the two-anchor effective-time contract (Decision
item 12). The operational-anchor (deployment) timestamp is
recorded on Event 4, NOT post-emission enriched onto Event 3 —
INV-AUDIT-002 append-only forbids post-emission field mutation.

**Field-name discipline note:** `founder_reviewed_by_id` is
named (not `founder_ratifier_id`) because the founder reviews
when material user-workflow impact is identified per Decision
item 6, but does NOT ratify the threshold change. Ratification
authority is CTO + Controller (joint) only. The field's name
makes the semantic distinction explicit at the schema layer
without requiring readers to cross-reference Decision item 6 to
disambiguate. Companion field `founder_review_requested`
(boolean) uses consistent "review" framing.

**Event 4 — `confidence_threshold_deployed` (10 fields).**

`event_id`, `event_type`, `event_emitted_at`, `cycle_number`,
`surface_id` (enum), `confidence_threshold_calibrated_event_id`,
`deployed_value` (numeric), `deployed_by`
(deployment_system_actor_id), `trace_id`, `schema_version`.

Emitted by the deployment system after the running pipeline
picks up the new value. `event_emitted_at` is the
operational-anchor timestamp per Decision item 12 two-anchor
effective-time contract. `confidence_threshold_calibrated_event_id`
cites the ratification provenance via Framing α (audit-event
ID; hash verifiable via §Decision item 8 citation discipline).
`deployed_value` is recorded explicitly to permit future
contributor verification that the deployed value matches the
ratified value (defensive cross-check; in normal operation
`deployed_value == new_value` from Event 3). Future contributors
authoring the deployment-system integration code must ensure
Event 4 emission routes through the canonical audit-log writer
per ADR-0011 §1, not directly to `audit_log`; a direct insert is
a Reading B violation.

### 11. Calibration test-set artifact format (v1)

The calibration test set is a **versioned JSON document**
persisted in the canonical artifact storage layer (same storage
abstraction family as ADR-0013). **Calibration test-set
artifacts are NOT `source_documents`, do NOT create
`document_cases`, and do NOT participate in
`source_document_links`** — they are governance artifacts stored
through the storage abstraction for operational consistency.

**A published calibration test-set artifact is immutable.**
Corrections publish a new `test_set_version`; prior versions
remain addressable and hash-verifiable.

JSON schema (v1):

```json
{
  "test_set_version": "v1-{date}-{seq}",
  "test_set_format_version": "v1",
  "published_at": "ISO-8601",
  "published_by": "platform_team_member_id",
  "trace_id": "UUID",
  "sampling_parameters": {
    "test_set_size_per_type": 100,
    "source_org_eligibility_floor": 50,
    "stratification_bucket_boundaries": [0.0, 0.6, 0.7, 0.8, 0.9, 1.0],
    "sampling_strategy": "stratified_random_per_org_pooled"
  },
  "document_count_per_type": { "vendor_invoice": 100, "receipt": 100, "payment_confirmation": 73 },
  "underpowered_surfaces": ["payment_confirmation"],
  "org_set": ["org_id_1", "org_id_2", "..."],
  "documents": [
    {
      "document_id": "UUID",
      "document_type_classification": "vendor_invoice",
      "controller_confirmed_correct_label": "vendor_invoice",
      "classifier_confidence_score": 0.87,
      "stratification_bucket": "0.8-0.9",
      "subsystem_1_candidate_set": [],
      "controller_confirmed_correct_target_candidate_id": "UUID"
    }
  ]
}
```

The `subsystem_1_candidate_set` field carries the Subsystem 2
calibration's paired-candidate-distribution input. Whether the
candidate set can be reconstructed from existing ADR-0018
audit logs OR whether ADR-0018 must be amended to persist
`subsystem_1_candidate_set` at proposal time is a **Phase 0
closure verification surface** (Sub-verification 3 — see §10 of
the design spec). ADR-0019's calibration test-set artifact
format v1 carries the field; the closure verification determines
whether reconstruction or capture is the implementation route.

**D6-visible carry-forward:** Sub-verification 3 is named
explicitly in the D6 ratification package §6 Discoverability
Notes as a deferred Phase 0 closure surface that the post-D6
Phase 0 closure verification work must adjudicate before
Phase 1 (Storage / Evidence Core) code start. The
non-resolution at D6 ratification is intentional: Sub-verification 3
does not gate ADR-0019's substantive content at D6; the
substantive content (calibration test-set artifact format v1
carries `subsystem_1_candidate_set`) is locked, and the closure
verification determines the implementation route post-D6.

### 12. Two-anchor effective-time contract (governance + operational anchors)

Threshold changes have **two distinct timestamps** in the audit
trail:

- **Governance effective-time anchor:** the amendment commit
  timestamp (when ADR-0014 / ADR-0018 locked values change in
  the repo).
- **Operational effective-time anchor:** the deployment
  timestamp (when the running pipeline picks up the new value).

Documents classified or routed between the two timestamps use
the **prior** threshold (the running code has not yet picked up
the change); after the operational anchor, the **new** threshold
applies. Both timestamps are recorded in the audit trail: the
governance anchor is Event 3's `event_emitted_at` (ratification
moment); the operational anchor is Event 4's `event_emitted_at`
(deployment moment). Event 4 emission lives on the deployment
system per Decision item 10; the two-event split honors
INV-AUDIT-002 append-only by recording deployment as a separate
event rather than post-emission enriching a deployment-time
field onto Event 3.

The two-anchor contract preserves Q30 byte-for-byte
reproducibility: a document's classification at any historical
moment can be re-derived from `pipeline_trace` events cross-
referenced against the audit log's amendment-commit history and
deployment-commit history. A future contributor who proposes a
"single effective-time" model is proposing a Q30 violation; the
distinction is preserved in Notes for future ADR writers (item
e). Whether `pipeline_trace` records explicitly capture the
threshold value used at classification / routing time, OR
whether the value is inferred from timestamp cross-referenced
against the ADR amendment commit chain, is a Phase 0 closure
verification surface (Sub-verification 4 — see §10 of the design
spec).

### 13. Audit-trail invariance and prospective-not-retroactive contract

**Pre-commit candidates: untouched.** Pre-commit
`document_relationship_candidates` rows generated under prior
thresholds are **NOT re-evaluated by the threshold change** at
v1. ADR-0018 Decision item 4's closed list of v1 re-evaluation
triggers (T1–T10) does NOT include "calibrated threshold value
moved" as a v1-active trigger.

**Post-commit ledger state: untouched.** Post-commit
`journal_entries` / `journal_lines` / `source_document_links`
rows committed under prior thresholds remain **immutable** per
ADR-0011 §9 + ADR-0016 §6. The **prospective-not-retroactive
principle holds for both threshold drops AND threshold rises** —
controller-confirmed prior decisions are binding regardless of
the new threshold's hypothetical re-routing under v1 rules.

**T11 reserved-trigger forward-pointer (post-v1 reserved; NEW
trigger).**

| Reserved trigger | Activation condition | Effect |
|---|---|---|
| **T11 — Threshold-move re-evaluation** (post-v1 reserved; NEW trigger requiring an ADR-0018 amendment to its closed list T1–T10, NOT an activation of any existing reserved seat) | Calibration cycle's amendment cascade fires AND post-v1 ADR-0018 amendment introducing T11 is ratified | Re-runs Subsystem 1 against pre-commit candidates; emits `pre_commit_link_rerouted` per ADR-0016 §6 |

T11 is **reserved-not-active-v1** per the substrate-now-
enforcement-later pattern. The operational cost of re-evaluating
thousands of pending candidates on every threshold movement is
high; the architectural value is uncertain (post-v1 traffic data
will inform whether T11 activation is warranted). ADR-0019 does
NOT pre-emptively activate T11; ADR-0019 does NOT amend ADR-0018
Decision item 4's closed list T1–T10. T11 is a **NEW trigger**;
T11's activation in a future ADR-0018 amendment is **NOT** an
activation of T7 (vendor-master merge) or T9 (document
supersession) reserved seats — those are ADR-0018-internal
reserved seats for separate triggers.

**Audit-trail invariance.** The audit log is invariant under
threshold changes per INV-AUDIT-002 append-only. Existing
`pipeline_trace` events from prior threshold periods are NOT
modified. The audit-trail invariance is mechanical: the canonical
audit-log writer is append-only; no service path can rewrite a
prior `pipeline_trace` event.

## Schema deltas

Surfaced explicitly per the Phase 0 schema-decision discipline.
No silent table or column introductions; all enum extensions and
new tables are named at the ADR level so future readers can audit
the schema scope of ADR-0019 from this section alone.

**New tables: none.** ADR-0019 introduces no new tables. The
calibration test-set artifact (Decision item 11) is stored
through the canonical artifact storage layer, NOT in a new SQL
table.

**New columns on existing tables (6, all on `org_settings`):**

- `confidence_threshold_vendor_invoice` — numeric, NULL-default,
  CHECK constraint admits NULL or value in `[0, 1]`. Reserved
  per Decision item 2; v1 emission filter rejects non-NULL.
- `confidence_threshold_receipt` — numeric, NULL-default, CHECK
  constraint admits NULL or value in `[0, 1]`. Reserved per
  Decision item 2; v1 emission filter rejects non-NULL.
- `confidence_threshold_payment_confirmation` — numeric,
  NULL-default, CHECK constraint admits NULL or value in
  `[0, 1]`. Reserved per Decision item 2; v1 emission filter
  rejects non-NULL.
- `confidence_threshold_ambiguity_margin` — numeric,
  NULL-default, CHECK constraint admits NULL or value in
  `[0, 1]`. Reserved per Decision item 2; v1 emission filter
  rejects non-NULL.
- `calibration_cadence` — interval, NULL-default, CHECK
  constraint admits NULL or value in a closed cadence enum
  (post-v1 enum membership). Reserved per Decision item 2 and
  Decision item 4; v1 emission filter rejects non-NULL.
- `calibration_test_set_version` — text, NULL-default, CHECK
  constraint admits NULL or value matching the
  `v1-{date}-{seq}` test-set-version pattern. Reserved per
  Decision item 2; v1 emission filter rejects non-NULL.

The six columns are **disjoint** from ADR-0014's twelve OCR /
retention / language reserved columns from Q73's other portion.
Future contributors proposing a calibration-related column must
add it here (with an ADR-0019 amendment); future contributors
proposing an OCR / retention / language-related column must add
it to ADR-0014's set.

**Sub-verification 1 — `org_settings.*` writer ownership.** Per
the Reading B preservation framing in Context, ADR-0019
introduces no new write service. The existing `org_settings.*`
writer (identity to be confirmed at Phase 0 closure verification
per `ledger_truth_model.md` Service Communication Rules + ADR-
0011 §1) handles writes to the six reserved post-v1 columns
when the post-v1 per-org operational activation ADR ratifies.
Sub-verification 1 is **deferred to Phase 0 closure
verification** per §10 of the design spec; ADR-0019 does NOT
pre-specify the writer identity.

**New closed enum introduced (1):** `amendment_cascades_fired`
(enum array used in Event 2). Closed enum membership at v1:
`{ADR_0014_DOCUMENT_TYPE_THRESHOLDS, ADR_0018_AMBIGUITY_MARGIN}`.
Three-layer defense per ADR-0010: Layer 1 DB CHECK validates
each array element against the closed set; Layer 2 Zod boundary
rejects unknown values; Layer 3 service emission filter prevents
the cycle script from emitting any value outside the closed set.

**Existing closed enums consumed (0):** ADR-0019 does not
consume any existing closed enum at the schema layer beyond
`document_type` (referenced only as the surface-id discriminator
on Event 3 `surface_id`; the enum is owned by ADR-0011 §6 and
not extended here).

**Reserved-enum migrations beyond v1.** Activation of the six
reserved `org_settings.*` columns is a post-v1 ADR amendment-
or-new-ADR per Decision item 2; the columns ship NULL-default
at v1 schema time; activation flips the v1 active subset
(currently `{}`) and adds runtime emission per the post-v1
operational activation ADR.

**v1-safe CHECK constraints.** Per ADR-0010 reserved-enum-states
discipline, the six `org_settings.*` columns ship with v1 CHECK
constraints permitting NULL only for v1; the post-v1 activation
ADR loosens the constraints as part of the same migration that
ships the operational activation. The `amendment_cascades_fired`
enum-array CHECK constraint is the Layer 1 backstop under the
Layer 2 Zod boundary and Layer 3 service emission filter.

## Reserved enums and audit events

Per ADR-0010 reserved-enum-states discipline:

**`amendment_cascades_fired`** — closed enum array, two values,
v1 active subset is the full set
`{ADR_0014_DOCUMENT_TYPE_THRESHOLDS, ADR_0018_AMBIGUITY_MARGIN}`,
no reserved-post-v1 set at v1 ship. Three-layer defense per
ADR-0010: Layer 1 DB CHECK validates each array element; Layer 2
Zod boundary rejects unknown values; Layer 3 service emission
filter prevents the cycle script from emitting unknown values.
Future expansion (e.g., a third subsystem with its own
calibration cascade) requires an ADR-0019 amendment to extend
the enum.

**Active audit event types (4 total):**
`calibration_test_set_published` (Event 1, per Decision item 10),
`calibration_run_completed` (Event 2, per Decision item 10),
`confidence_threshold_calibrated` (Event 3, per Decision item
10), `confidence_threshold_deployed` (Event 4, per Decision item
10). All four route through the canonical audit-log writer per
ADR-0011 §1 audit-log writer boundary; the audit table itself
is owned by INV-AUDIT-001 + INV-AUDIT-002.

**No reserved post-v1 audit event types at v1 ship.** Future
calibration-related audit events (e.g., a per-org-activation
event when the post-v1 operational activation ADR ratifies)
ship in the future ADR amendment, not as ADR-0019 v1 reserved
seats.

## Cross-references

- **ADR-0007 §Tier 2.5 (Q66 closed by 2026-05-03 Amendment).**
  Tier 2.5 read-only-with-ledger-context contract; the
  calibration-cycle script and the Router's runtime threshold
  consumption both operate within Tier 2.5's bounds. Inherited
  verbatim.
- **ADR-0010** — reserved-enum-states discipline. Three-layer
  defense applied verbatim to the six reserved `org_settings.*`
  columns and the `amendment_cascades_fired` enum array.
- **ADR-0011 §1** — entity ownership boundary; the
  `org_settings.*` table-existence boundary; the canonical
  audit-log writer boundary. Inherited verbatim.
- **ADR-0011 §7** — ProposedAttachment primitive; the
  proposal-path / exception-queue split is the substrate the
  calibration corpus draws from. Inherited verbatim.
- **ADR-0011 §9** — document lifecycle immutability rules;
  prospective-not-retroactive principle for post-commit ledger
  state under threshold changes (§7 of this ADR's Decision
  block). Inherited verbatim.
- **ADR-0014 Decision item 7** — per-document-type confidence
  threshold values (Q65 provisional v1 values: `vendor_invoice`
  0.85, `receipt` 0.80, `payment_confirmation` 0.85, `unknown`
  always-exception). ADR-0019 ratifies these values at v1 ship
  + 6 months; if values move, ADR-0014 Decision item 7's table
  is the amendment-cascade target.
- **ADR-0014 Decision item 8** — AI fallback contract. The Tier
  C fallback's `confidence` output is what Decision item 7's
  thresholds gate. ADR-0019 does NOT redraft the AI fallback
  contract.
- **ADR-0014 Decision item 11** — Pipeline output → Proposed
  Mutation/Bundle/Attachment routing. Reading B preservation
  at the Tier 2 boundary; ADR-0019 inherits the boundary
  verbatim.
- **ADR-0016 §6** — lifecycle immutability cross-reference; the
  post-commit `source_document_links` immutability discipline
  is inherited verbatim by ADR-0019 §7 (audit-trail invariance).
- **ADR-0017 Decision item 4** — substrate-now-enforcement-
  later precedent; the post-Phase-0 vendor-template-enforcement
  calibration ADR scope distinct from ADR-0019's. ADR-0019
  inherits the substrate-now-enforcement-later pattern for Path
  γ; ADR-0019 does NOT subsume the vendor-template-enforcement
  calibration scope.
- **ADR-0018 Decision item 3** — Subsystem 2 ambiguity-margin
  algorithmic placement; the Router-implementation default
  pending ADR-0019 ratification. ADR-0019 ratifies the value at
  v1 ship + 6 months; if value moves, ADR-0018 Decision item 3
  is the amendment-cascade target.
- **ADR-0018 Decision item 4** — Q56 closure with the closed
  list of v1 re-evaluation triggers (T1–T10; v1-active subset
  T1, T2, T3, T4, T5, T6, T8, T10). ADR-0019 inherits the
  closed list verbatim; T11 in §7 of the Decision block is a
  NEW reserved-not-active-v1 trigger requiring a future
  ADR-0018 amendment to its closed list — NOT an activation
  of T7 or T9.
- **`docs/02_specs/agent_autonomy_model.md` Q23** — agent-ladder
  thresholds fixed at the system level for v1. ADR-0019
  inherits the system-level-only authority pattern for Path γ
  and *completes* Q23 by specifying the system-level update
  authority (CTO + Controller jointly ratify; founder reviews
  on material user-workflow impact).
- **`docs/02_specs/agent_autonomy_model.md` Q24** — limit-change
  authorization shape. ADR-0019 forward-points to a Q24-pattern
  analog for the post-v1 per-org operational activation ADR;
  ADR-0019 does NOT pre-specify the activation authority shape.
- **`docs/02_specs/ledger_truth_model.md`** — Service
  Communication Rules (Reading B). ADR-0019 introduces no new
  service; the four prior single-writer-rule applications stand
  unchanged at four. Inherited verbatim.
- **`docs/02_specs/intent_model.md`** — Logic Receipt schema and
  ProposedMutation conventions. ADR-0019 does NOT extend the
  Logic Receipt or the ProposedMutation surface; the calibration
  test-set artifact is a governance artifact distinct from the
  proposal-pipeline artifact set.
- **INV-AUDIT-001** — canonical audit-log writer rule. Inherited
  verbatim; the three calibration audit events all route
  through `recordMutation.ts` (or the future audit service that
  inherits the role).
- **INV-AUDIT-002** — audit-log append-only invariant. Inherited
  verbatim; audit-trail invariance under threshold changes
  (§7 of the Decision block) is mechanical because the canonical
  audit-log writer is append-only.

## Closes

This ADR closes the following questions from
`docs/02_specs/open_questions.md`:

| Q | Closure scope | Disposition |
|---|---|---|
| **Q57** | Confidence calibration governance | **COMPLETE closure.** Path A bounded-substantive-in-v1 (Decision item 1) + the four-active-surface coupled-calibration discipline (Decision item 5) + the cycle authority and audit-event taxonomy (Decision items 6, 8, 10) close Q57's calibration-governance question. v1 ratifies the cycle parameters; the first cycle at v1 ship + 6 months ratifies the four active threshold values; subsequent cycles run on cadence. ADR-0019 *completes* Q23 by specifying the system-level update authority Q23 left unspecified. |
| **Q73** | Confidence-threshold configurability portion | **COMPLETE closure of the confidence-threshold portion** under the substrate-extension pattern. Path γ system-fixed-only-at-v1 (no per-org override at v1) + per-org `org_settings.*` substrate reserved per ADR-0010 (six reserved columns per Decision item 2) + per-org operational activation forward-pointed to post-v1 amendment-or-new-ADR per ADR-0017 Decision item 4 framing. Structurally identical to ADR-0017's Q60 closure pattern (substrate + forward-pointer = complete closure of the question's decision space at Phase 0). The OCR / retention / language portion of Q73 closes separately by ADR-0014's twelve reserved columns; the two reserved-column sets are disjoint. |
| **Q65** | ADR-0014 v1 provisional confidence threshold values | **RATIFICATION-AT-V1-SHIP closure (per Q77 v1-ship-gate pattern).** ADR-0014 Decision item 7's four provisional values (`vendor_invoice` 0.85, `receipt` 0.80, `payment_confirmation` 0.85, `unknown` always-exception) are ratified at v1 ship + 6 months by the first calibration cycle. If values move, ADR-0014 amendment cascade fires per Decision item 8. The values themselves remain owned by ADR-0014 Decision item 7; ADR-0019 owns the ratification process. |
| **ambiguity-margin (ADR-0018 Decision item 3)** | Router Subsystem 2 ambiguity-margin threshold value | **RATIFICATION-AT-V1-SHIP closure (per Q77 v1-ship-gate pattern).** ADR-0018 Decision item 3's Router-implementation default ambiguity-margin value is ratified at v1 ship + 6 months by the first calibration cycle, alongside the Q65 values per the cross-domain calibration coupling discipline (Decision item 5). If value moves, ADR-0018 amendment cascade fires per Decision item 8. The algorithmic placement remains owned by ADR-0018 Decision item 3; ADR-0019 owns the ratification process. |

**Explicitly NOT closed by ADR-0019:**

- **Q28** (matrix expansion landing in
  `agent_architecture_policy.md` per Q77 v1-ship gate) — owned
  by Q77's v1-ship gate framing; ADR-0019 does NOT amend the
  matrix.
- **Q29** (ESLint lint design for Tier 2 / Tier 2.5) — owned by
  the post-v1 lint-design ADR or a future amendment; ADR-0019
  does NOT design lint rules.
- **Q56** (Relationship Router re-evaluation triggers — closed
  list T1–T10) — already closed by **ADR-0018 Decision item 4**
  D5; ADR-0019 inherits the closure verbatim and does NOT
  re-close or amend. T11 in §7 of the Decision block is a NEW
  trigger requiring a future ADR-0018 amendment to that closed
  list, NOT an amendment of T1–T10's closed list at v1.
- **Q66** (Router tier placement) — already closed by
  **ADR-0007 §Amendment 2026-05-03**; ADR-0019 cites the
  closure and does NOT re-open.
- **Q76** (immutability boundary) — owned by **ADR-0011 §9 +
  ADR-0016 §6**; ADR-0019 inherits the principle and applies
  it to threshold changes (§7 of the Decision block) but does
  NOT redraft the immutability invariant.
- **Q77** (Q28 matrix expansion scope — still open) — gates v1
  ship per the Q77 v1-ship-gate pattern; ADR-0019 does NOT
  amend Q77's status.
- **Q79** (INV-DOC-001 shape — Phase 0 closure accounting) —
  in-scope ADR-0011 §15 framing; Phase 0 closure verification
  surface; ADR-0019 does NOT close.
- **Vendor-template post-v1 enforcement calibration** — separate
  post-Phase-0 ADR per **ADR-0017 Decision item 4** forward-
  pointer. ADR-0019 owns the four-substantive-surface
  calibration; the vendor-template-enforcement calibration is a
  distinct scope.
- **OCR / extraction / classification implementation** — owned
  by **ADR-0014 Decision items 1–9**; ADR-0019 does NOT
  redraft any of those decisions.
- **Relationship Router algorithm** — owned by **ADR-0018
  Decision items 1–7**; ADR-0019 does NOT redraft any of
  those decisions.
- **E2 / Q28 matrix ratification** (gates v1 ship per Q77) —
  ADR-0019 does NOT close E2.
- **Threshold-move re-evaluation trigger T11 activation** —
  reserved-not-active-v1 per §7 of the Decision block;
  activation requires a future ADR-0018 amendment to its
  closed list T1–T10. ADR-0019 names the forward-pointer; it
  does NOT activate T11.

## Anti-overscope discipline

ADR-0019 owns the calibration-cycle governance for the four
substantive surfaces (Q57 governance + Q73 confidence-threshold
portion + Q65 ratification + ambiguity-margin ratification) plus
the fifteen ratified-at-v1-ship parameters and the three audit
events. The following are explicitly NOT ADR-0019 scope. Future
readers (and future ADR amendment authors) are warned: if a
proposed amendment to ADR-0019 drifts into the territories below,
the proposal is misplaced and should be re-scoped to the owning
ADR.

**Eleven-area boundary callout.**

1. **`agent_autonomy_model.md` Q23 agent-ladder threshold
   authorization** — owned by `agent_autonomy_model.md`.
   ADR-0019 inherits the system-level-only authority pattern;
   does NOT extend Q23 itself.
2. **`agent_autonomy_model.md` Q24 limit-change authorization**
   — owned by `agent_autonomy_model.md`. ADR-0019 forward-
   points to a Q24-pattern analog for post-v1 per-org
   activation; does NOT pre-specify the activation authority
   shape.
3. **ADR-0014 per-document-type confidence threshold values
   (Q65)** — owned by **ADR-0014 Decision item 7**. ADR-0019
   ratifies the values at v1 ship + 6 months; the values
   themselves and any pre-ratification adjustment remain owned
   by ADR-0014.
4. **ADR-0018 ambiguity-margin algorithmic placement** — owned
   by **ADR-0018 Decision item 3**. ADR-0019 ratifies the
   threshold value; the algorithm itself remains owned by
   ADR-0018.
5. **ADR-0017 vendor-template post-v1 enforcement calibration**
   — separate post-Phase-0 ADR per **ADR-0017 Decision item 4**.
   The four enforcement surfaces named in ADR-0017 Decision
   item 4 (auto-post calibration thresholds, promotion ceremony,
   demotion-trigger rules, learning-loop governance) consume a
   substrate distinct from ADR-0019's calibration substrate;
   the two scopes do NOT overlap.
6. **ADR-0011 §1 entity ownership** (`org_settings.*` table-
   existence boundary) — owned by **ADR-0011 §1**. ADR-0019
   adds six columns to the existing table; does NOT propose
   moving the table or extending the entity-ownership boundary.
7. **ADR-0011 §7 ProposedAttachment primitive** — owned by
   **ADR-0011 §7**. ADR-0019 consumes the proposal-path /
   exception-queue split as substrate for the calibration
   corpus; does NOT redraft the primitive.
8. **ADR-0011 §9 + ADR-0016 §6 lifecycle immutability** —
   owned by **ADR-0011 §9** and **ADR-0016 §6**. ADR-0019
   applies the prospective-not-retroactive principle to
   threshold changes (§7 of the Decision block); does NOT
   redraft the immutability invariant.
9. **ADR-0007 Tier 2.5 calibration-consumption timing** —
   owned by **ADR-0007 §Tier 2.5** (and the §Amendment
   2026-05-03 closing Q66). ADR-0019 operates within Tier 2.5's
   read-only-with-ledger-context bounds; does NOT extend the
   tier contract.
10. **ADR-0010 reserved-enum-states discipline** — owned by
    **ADR-0010**. ADR-0019 applies three-layer defense to the
    six reserved `org_settings.*` columns and the
    `amendment_cascades_fired` enum array; does NOT redraft the
    discipline.
11. **Founder-level Phase 0 governance authority** — owned by
    the Phase 0 governance plan and the founder. ADR-0019's
    product-shape review trigger (Decision item 6, parameter
    12) operates within the founder's authority; ADR-0019 does
    NOT extend or redraft founder-level Phase 0 governance
    authority itself.

Boundaries 1–10 are ADR-and-spec-anchored; Boundary 11 is
governance-process-anchored (foundation boundary).

**Cross-domain calibration coupling note.** The four active
surfaces (3.1 / 3.2 / 3.3 / 3.5) are calibrated as a coupled set
per first cycle, NOT independently (Decision item 5). A proposed
ADR-0019 amendment that would calibrate any of the four active
surfaces in isolation against the others must surface the
coupling implication explicitly; the coupling discipline is the
mechanical defense against second-cycle distribution drift.

**Cross-ADR boundary harmonization (deferred to draft time).**
Three candidate-harmonization surfaces with the post-Phase-0
vendor-template-enforcement-calibration ADR are flagged for
draft-time harmonization decisions:

- Test-set composition methodology → Decision item 7 (cycle
  test-set composition) of this ADR.
- Audit-event taxonomy → Decision items 8, 10 (cycle outcome
  recording + audit-event schemas) of this ADR.
- Ratification-authority shape → Decision item 6 (cycle
  authority) of this ADR.

The post-Phase-0 ADR may mirror these patterns or diverge based
on vendor-template-specific considerations; harmonization is
deferred to draft time of the post-Phase-0 ADR per ADR-0017
Decision item 4 framing. ADR-0019 does NOT pre-decide
harmonization on behalf of the future ADR.

Where ADR-0019 needs to reference any of the above areas, it
does so by ADR number with the boundary explicit (e.g., "the
threshold values themselves are owned by ADR-0014 Decision item
7 — ADR-0019 ratifies the values at v1 ship + 6 months but
does not amend them pre-ratification"; "the ambiguity-margin
algorithm is owned by ADR-0018 Decision item 3 — ADR-0019
ratifies the threshold value but does not move the algorithmic
placement"; "the vendor-template post-v1 enforcement calibration
lives in a separate post-Phase-0 ADR per ADR-0017 Decision item
4 — ADR-0019's calibration substrate is disjoint from the
vendor-rules substrate"). The forward-pointers in Decision items
2 (Path γ post-v1 activation), 6 (post-v1 per-org override
authority), and 13 (T11 reserved-not-active-v1) are the load-
bearing boundary callouts.

## Consequences

### What this enables

- **The four active confidence-threshold values land at v1 with
  a named ratification path.** ADR-0014 Decision item 7's
  provisional values and ADR-0018 Decision item 3's Router-
  implementation-default ambiguity-margin both ship at v1 with
  ADR-0019's ratification cycle scheduled for v1 ship + 6
  months. The Q77 v1-ship-gate pattern lands cleanly: the
  values are coded against at v1, ratified post-launch with
  real traffic, and amended via cascade if the cycle's
  recommendation crosses the 0.02 floor.
- **The substrate-now-enforcement-later pattern is consistently
  applied (fifth Phase 0 application).** Path γ ships the six
  reserved `org_settings.*` columns at v1 schema time; per-org
  operational activation lives post-v1 in a future amendment-
  or-new-ADR. The post-v1 activation ADR can ship enforcement
  contracts against an existing column set; it does not have to
  migrate the schema before wiring service paths.
- **Reading B preservation extends to the calibration domain
  with no new write service.** ADR-0019 introduces no new
  service; the canonical audit-log writer (per ADR-0011 §1)
  emits the three calibration audit events; the existing
  `org_settings.*` writer (Sub-verification 1 deferred) handles
  the six reserved columns post-activation; the platform-team-
  executed cycle process is operational obligation, not a new
  service. The four prior single-writer-rule applications stand
  unchanged at four.
- **The cross-domain calibration coupling discipline preserves
  the soundness of post-cycle ambiguity-margin ratification.**
  The four active surfaces calibrate as a coupled set per cycle;
  Subsystem 2's ambiguity-margin is calibrated against the
  classifier-output distribution that exists at cycle start,
  not a hypothetical post-cascade distribution. A future
  contributor amending the cycle to calibrate Subsystem 2 in
  isolation must explicitly surface the coupling implication.
- **The Framing α audit-event-ID + content-hash citation
  discipline preserves the audit log as single source of
  truth.** ADR-0014 / ADR-0018 amendment commits triggered by
  calibration cycles cite ratification provenance by audit-
  event ID + content hash, NOT by content embedding. A future
  reader queries the audit log by `event_id`, verifies the
  hash, confirms the citation. Framing α generalizes to any
  future audit-event-anchored governance event-driven ADR
  amendment cascade.
- **The two-anchor effective-time contract preserves Q30
  byte-for-byte reproducibility for documents classified or
  routed across threshold changes.** Documents classified
  between governance-anchor and operational-anchor timestamps
  use the prior threshold; after the operational anchor, the
  new threshold applies. Both timestamps are in the audit
  trail; a document's classification at any historical moment
  can be re-derived.
- **The prospective-not-retroactive contract preserves
  controller-confirmed prior decisions under threshold
  changes.** Pre-commit candidates are not re-evaluated at v1
  (T1–T10 closed list; T11 reserved-not-active-v1); post-commit
  ledger state is immutable per ADR-0011 §9 + ADR-0016 §6. A
  threshold drop does not retroactively re-route prior
  confirmations; a threshold rise does not retroactively
  invalidate prior confirmations. The controller's confirmation
  is binding regardless of the new threshold's hypothetical
  re-routing.
- **The post-v1 per-org operational activation work has a
  substrate to bootstrap against.** When the activation ADR
  ships, the six `org_settings.*` columns will already exist at
  v1 schema time; the activation ADR specifies the runtime-
  consumption contracts and loosens the v1 emission filters; no
  schema migration is required at activation time.

### What this constrains

- **CTO + Controller joint ratification is required for every
  threshold change.** A future contributor proposing a
  threshold change without firing the calibration cycle, or
  proposing a cycle outcome that bypasses the joint
  ratification, is proposing a governance violation. The
  discipline is mechanical: amendment-cascade commits cite
  Event 3's `cto_ratifier_id` and `controller_ratifier_id`; if
  either field is empty, the amendment is unverifiable.
- **The 0.02 adjustment-rule floor prevents amendment churn
  from sub-noise movements.** Calibration cycles with
  recommended value movements below the floor produce no
  amendment cascade; the value remains ratified-as-is. A
  future contributor proposing to lower the floor must amend
  ADR-0019 (item d in Notes for future ADR writers).
- **The four active surfaces calibrate as a coupled set per
  cycle.** A future contributor proposing to calibrate
  Subsystem 2 in isolation against the classifier surfaces
  must surface the coupling implication explicitly; the
  coupling discipline is the mechanical defense against
  second-cycle distribution drift.
- **Per-org operational activation is reserved-not-active-v1.**
  No org may consume the six `org_settings.*` columns at v1;
  the v1 emission filter rejects any non-NULL write. A future
  contributor proposing per-org operational activation at v1
  is proposing a Path γ violation; the rule is preserved in
  Notes for future ADR writers (item b).
- **T11 threshold-move re-evaluation is reserved-not-active-v1.**
  No threshold change at v1 re-evaluates prior pre-commit
  candidates. A future contributor proposing T11 activation at
  v1 is proposing an ADR-0018 amendment to the closed list
  T1–T10; the activation must land as a future ADR-0018
  amendment, NOT as an in-band ADR-0019 amendment.
- **The fifteen ratified-at-v1-ship parameters are locked under
  the calibration cycle.** A calibration cycle does not have
  authority to amend its own parameters; changes to any of the
  fifteen parameters require an ADR-0019 amendment.
- **Amendment-commit citation follows Framing α.** A future
  amendment-commit author who embeds audit-event content into
  the commit body (instead of citing event ID + content hash)
  is proposing a single-source-of-truth violation; the audit
  log is canonical, not the cited content.
- **The two-anchor effective-time contract operationalizes
  through Event 4 emission, NOT post-emission enrichment of
  Event 3.** Per the C11a 4-event refactor (Decision item 10):
  the operational-anchor (deployment) timestamp lives on
  Event 4's `event_emitted_at`, emitted by the deployment
  system after the running pipeline picks up the new value.
  A future contributor proposing post-emission enrichment of
  a `deployment_at` field onto Event 3 is proposing an
  INV-AUDIT-002 append-only violation. The deployment-system
  integration code must route Event 4 emission through the
  canonical audit-log writer per ADR-0011 §1; a direct insert
  into `audit_log` is a Reading B violation.

### What this costs

- **Cycle-execution operational obligation.** The platform team
  executes the calibration runbook at v1 ship + 6 months and
  every 6 calendar months thereafter. Test-set preparation
  (sampling + stratification + artifact publication), cycle
  computation (operating curves + recommendations), audit-event
  emission (3 events per cycle + ratification approvals), and
  amendment-commit drafting (if cascades fire) are operational
  costs the cycle imposes on the platform team. The cost is
  bounded (one cycle every 6 months) but non-zero; future
  resourcing plans for the platform team must account for the
  cycle obligation.
- **CTO + Controller ratification organizational obligation.**
  Each cycle that produces a non-empty
  `amendment_cascades_fired` array imposes a joint-ratification
  decision on the CTO and Controller. The decision involves
  reviewing the cycle's recommendations, the operating curves,
  the underpowered-surface annotations, and the founder's
  product-shape review (if requested) before authorizing the
  amendment cascade. The organizational cost compounds across
  multiple cycles if multiple surfaces cross the 0.02 floor in
  the same cycle.
- **Substrate-now-enforcement-later cost (substrate ships in
  v1 schema even though enforcement is forward-pointed).** The
  six reserved `org_settings.*` columns ship at v1 schema time
  with v1-safe CHECK constraints, Layer 2 Zod boundary
  rejection of non-NULL values, and Layer 3 service emission
  filter prevention of non-NULL writes. The schema cost is
  modest (six nullable columns plus three CHECK constraints
  plus the service-layer filters) but non-zero; the migration
  inventory at v1 ship includes the columns even though no v1
  service path consumes them.
- **Audit-log volume implications (4 new audit-event types).**
  Each cycle emits at least 2 events (Event 1 + Event 2) and
  up to 10 events (Event 1 + Event 2 + Event 3 × 4 active
  surfaces + Event 4 × 4 active surfaces). The audit-log volume
  at v1 ship + 6 months is bounded but non-zero; future
  audit-log retention and storage capacity planning must
  account for the cycle's contributions, including the post-
  deployment Event 4 emissions which may land days or weeks
  after the corresponding Event 3 emission depending on
  deployment cadence.
- **Amendment-cascade single-purpose-commit discipline cost.**
  Each cycle outcome that crosses the 0.02 floor produces one
  ADR-0014 amendment commit (if 3.1 / 3.2 / 3.3 moved) and / or
  one ADR-0018 amendment commit (if 3.5 moved). The amendment
  cascades are independent per surface; both can fire from the
  same cycle. The single-purpose-commit discipline ensures each
  amendment commit cites Framing α provenance for exactly one
  surface; commit-history bookkeeping is the cost.
- **Framing α audit-event-ID + content-hash citation
  bookkeeping cost.** Amendment commits cite event IDs +
  content hashes; the platform team's amendment-drafting
  process must compute the content hashes and embed them into
  the commit body. The bookkeeping cost is mechanical (a
  scripted hash computation) but adds a step to the amendment-
  drafting process.

## Notes for future ADR writers

- **a. The threshold values are owned by ADR-0014 / ADR-0018;
  ADR-0019 owns the calibration governance.** A future
  contributor who proposes adjusting a threshold value without
  firing the calibration cycle is proposing a governance
  violation. The path for adjusting threshold values goes
  through the calibration cycle: cycle runs; recommendation
  emerges; CTO + Controller ratify; ADR-0014 / ADR-0018
  amendment cascade fires per Decision item 8. A direct edit
  to ADR-0014 Decision item 7's table or ADR-0018 Decision item
  3's documented value, without the cycle, is the governance
  violation.
- **b. Per-org operational activation is reserved-not-active-v1.**
  The six `org_settings.*` columns ship NULL-default at v1
  with v1-safe CHECK constraints + Layer 2 Zod + Layer 3
  emission filter rejecting non-NULL. A future contributor who
  proposes per-org operational activation at v1 is proposing a
  Path γ violation. The activation pathway is a post-v1
  amendment-or-new-ADR per Decision item 2 + ADR-0017 Decision
  item 4 framing.
- **c. N (first-cycle wall-clock) and the post-v1 cadence are
  independently named.** N = 6 months as a one-shot value; the
  post-v1 cadence = 6 months as a recurring period. A future
  contributor who conflates the two parameters (e.g., proposes
  changing the cadence by changing N) is proposing a parameter-
  identity violation; the two parameters are separately
  ratifiable and separately amendable per Decision items 3 and
  4.
- **d. The fifteen ratified-at-v1-ship parameters are locked
  under the calibration cycle.** The calibration cycle's
  outcome (recommended value movements for the four active
  surfaces, with 0.02-floor adjudication) is the only output
  the cycle has authority to produce. A future contributor who
  proposes the cycle adjusting (for example) the precision
  floor or the underpowered-surface fallback policy is
  proposing a parameter-amendment violation; changes to any of
  the fifteen parameters require an ADR-0019 amendment, not a
  calibration cycle outcome.
- **e. The two-anchor effective-time contract is load-bearing
  for Q30 byte-for-byte reproducibility.** Threshold changes
  have two timestamps in the audit trail (governance anchor =
  amendment commit; operational anchor = deployment timestamp).
  A future contributor proposing a single-effective-time model
  is proposing a Q30 violation. Documents classified between
  the two anchors use the prior threshold; the operational
  anchor is when the new threshold takes effect.
- **f. T11 threshold-move re-evaluation is a NEW trigger, NOT
  an activation of T7 or T9 reserved seats.** A future
  contributor activating T11 must amend ADR-0018 Decision item
  4's closed list T1–T10 to include T11; T11 is not a re-use
  of T7 (vendor-master merge) or T9 (document supersession)
  reserved seats — those are separate ADR-0018-internal
  reserved seats for separate triggers. The activation lands
  as an ADR-0018 amendment, not an ADR-0019 amendment.
- **g. The cross-domain calibration coupling is the mechanical
  defense against second-cycle distribution drift.** A future
  contributor proposing to calibrate Subsystem 2's ambiguity-
  margin in isolation against the classifier surfaces (e.g.,
  by running a separate cycle for Subsystem 2 only) must
  surface the coupling implication explicitly. The four active
  surfaces calibrate as a coupled set per cycle; the
  `amendment_cascades_fired` enum array is the audit-log
  canonical record of which subsystems' values moved together.
- **h. Framing α audit-event-ID + content-hash citation
  discipline is a strong codification candidate flagged for
  Session 2D / 2E closeout adjudication.** The pattern (audit-
  event ID + content hash citation in ADR amendment commits;
  audit log as single source of truth; canonical-state
  reference, not content embedding) generalizes to any future
  audit-event-anchored governance event-driven ADR amendment
  cascade. A future ADR writer authoring an ADR with audit-
  event-anchored amendment cascades should reference Framing α
  as the load-bearing precedent. The codification adjudication
  is on the Z1 carry-forward queue for Session 2D / 2E
  closeout; future ADR writers can treat the discipline as
  load-bearing pending formal codification.
- **i. The five Phase 0 governance lessons.** ADR-0019 captures
  five Phase 0 governance lessons that future ADR writers can
  apply: (1) Path A bounded-substantive-in-v1 framing for
  calibration-shaped surfaces; (2) Path γ system-fixed-only-at-
  v1 + per-org-substrate-reserved framing as the fifth Phase 0
  application of substrate-now-enforcement-later; (3) N ≠
  post-v1 cadence framing for independently-named timing
  parameters; (4) cross-domain calibration coupling for multi-
  stage pipelines where downstream-stage thresholds depend on
  upstream-stage distributions; (5) Framing α audit-event-ID +
  content-hash citation discipline for ADR amendment commits.
  Each lesson is self-contained and transferable to non-
  calibration domains.
- **j. The three deferred Phase 0 closure verification surfaces
  remain open.** Sub-verification 1 (`org_settings.*` writer
  ownership), Sub-verification 3 (subsystem_1_candidate_set
  reconstructibility from ADR-0018 Router audit logs), and
  Sub-verification 4 (`pipeline_trace` threshold-value capture
  sufficiency) are all deferred to Phase 0 closure verification
  per §10 of the design spec. ADR-0019 does NOT speculate about
  resolution; future verification work determines the
  resolution. Sub-verification 2 (4-audit-event reproducibility
  sufficiency for Q30) closes via the 9-step replay procedure
  in §6.5 of the design spec.
- **k. The post-Phase-0 vendor-template-enforcement calibration
  is a separate scope.** Per ADR-0017 Decision item 4, the
  post-v1 vendor-template enforcement (auto-post calibration
  thresholds, promotion ceremony, demotion-trigger rules,
  learning-loop governance) ships in a future amendment to
  ADR-0017 or in a new ADR. The three candidate-harmonization
  surfaces (test-set composition methodology, audit-event
  taxonomy, ratification-authority shape) are flagged for
  draft-time harmonization; ADR-0019 does NOT pre-decide
  harmonization. A future ADR writer authoring the vendor-
  template enforcement calibration ADR may mirror ADR-0019's
  patterns or diverge based on vendor-template-specific
  considerations.
