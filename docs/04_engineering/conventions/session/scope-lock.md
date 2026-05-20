# Scope-lock conventions

Scope-lock-time discipline that fires when a session is articulating
dimensions, cross-dependencies, and closure shapes before execution.
These rules catch cross-layer coordination gaps before they fire as
runtime collisions.

See [`README.md`](./README.md) for the sub-folder routing rule and
the broader [`../README.md`](../README.md) for the topical routing
rule.

---

## Verify-forward-at-scope-lock for computational-shape chunks

A discipline cluster that fires at scope-lock for chunks whose
substantive scope is **computational-shape** (dispatcher-style,
re-evaluator-style, or substantively-novel-logic) rather than
**substrate-shape** (table additions, column changes, function
signatures, type definitions). Substrate-shape scope-locks are
well-served by the existing verify-from-disk discipline at
`feedback_verify_from_disk_at_brief_loop.md` (Item C). Computational-
shape chunks need additional scope-lock-time verification to avoid
the framing-discovery arc surfacing mid-implementation and forcing
brief amendment cycles + Path C splits.

Evidence basis: Phase 4 chunk 3 (Subsystem 3 dispatcher; commits
`c3782e9` (3a) + `5d4e954` (3b); amended brief at `c76d264`). The
chunk-3 7-round scope-lock locked thorough substrate-shape but
missed computational-shape under-specification systematically; five
framings surfaced mid-implementation as the framing-discovery arc.
The discipline cluster below codifies the scope-lock-time
verification that would have caught the computational-shape gaps at
scope-lock instead of mid-implementation. See Phase 4 retrospective
writeup §3 (framing-discovery arc centerpiece) for full evidence
unpacking.

### Consumer-presence verification before substrate addition (RI-1)

Before adding a substrate field, enum value, table reservation, or
type / function signature, verify that a v1 consumer for it exists
or is named with explicit activation-trigger. Four-instance
precedent met at chunk-3-Phase-4 close:

- `vendor_credits` / `vendor_credit_applications` table reservation
  per Phase 5 substrate decision (Phase 2.5 Commit A moved
  `vendor_credit` + `vendor_credit_application` from `linked_entity_type`
  v1-active to reserved post-v1; tables don't ship at v1; no v1
  consumer service).
- `backfill_vendor_prepayment_suggested` `resolution_action` value
  introduced at chunk-6-Phase-2 close, ratified at Phase 2.5
  Commit B follow-on (chunk-6 shipped pre-amendment substrate
  pending Phase 2.5 Commit B amendment).
- `paymentService.ts` / `vendorCreditService.ts` gap at chunk-3-
  Phase-4 (T2/T4/T6 dispatcher branches reserved per Framing F
  pending these services shipping; chunk-3 ships T2/T4/T6 as Zod
  literal-union members + dispatcher switch handlers but no
  service emission wiring).
- `cancelled_at` column at chunk-3-Phase-4 Round 4.c (γ) lock
  declined — both v1 consumer checks (UI surface, audit/reporting
  filter) negative; cancellation = pure status flip; WHEN/WHY via
  audit_log trace_id correlation. "Land schema with consumer
  code" reverse-discipline applied.

**Why:** Substrate without a v1 consumer becomes either dead code
(removed at next cleanup pass) or operationally drifts (the substrate
fires writes that no service reads, accumulating data that doesn't
participate in any v1 workflow). Cost of deferring substrate to a
future chunk with explicit named consumer < cost of cleaning up
unconsumed substrate or living with operational drift.

**How to apply:** At scope-lock for any substrate addition, name the
v1 consumer (service file + line range) for the substrate. If no
v1 consumer exists and won't ship in the same chunk, defer the
substrate to the consumer-shipping chunk via reserved-not-omitted
shape per ADR-0010 substrate-now-enforcement-later. Forward-pointer
the deferral in the appropriate retrospective inventory item with
activation-trigger named.

### Read-substrate verification at scope-lock, four grains (RI-6)

For dispatcher-style / re-evaluator-style / substantively-novel-
logic chunks, scope-lock must explicitly verify-forward at four
nested substrate grains. The first grain is well-covered by Item C
at `feedback_verify_from_disk_at_brief_loop.md`; grains 2-4 are
the extension this cluster adds.

**Grain 1 — Substrate-shape grain.** What tables, columns, function
signatures, type definitions, constants, and ServiceErrorCodes
exist? Verify-from-disk on every cited substrate. This grain is
Item C's existing scope; the four-grain refinement extends it.

**Grain 1 reinforcement (chunk 6.3a evidence basis).** Four sub-
instances at chunk-6.3a strengthen the Grain 1 discipline. Each
fires the same underlying pattern (brief-scope-lock-without-
substrate-verify-from-disk) at a distinct sub-grain:

- **Flag 20** (`organizations.slug` column gap; column-existence
  sub-grain): brief Sub-Q2 + Sub-Q6 walks referenced
  `inbound+<org-slug>@inbound.chounting.com` +
  `SELECT organizations WHERE slug = mailboxHash` without
  disk-verify on `organizations.slug` column. Disk evidence: no
  slug column. β-2 in-line single-finding-scale brief amendment
  per RI-10.

- **β-2** (MailboxHash resolution at impl-onset; same surface as
  Flag 20 but caught at impl-onset grain rather than brief-draft
  grain): execution-side caught at substrate-receipt before
  consuming.

- **β-3 / MF-2** (`ServiceContext` 111-site blast radius;
  consumer-count sub-grain): brief Sub-Q6 Artifact 3 proposed
  discriminated-union extension with pre-drafted conditional MF-2
  threshold "≤10 sites in-scope; >10 sites codify scope expansion."
  Disk evidence: 111 sites. 11x off. Brainstorming-side adjudicated
  to sister-type Approach B at impl-onset.

- **Sub-Q10** (cards-UI discovery mechanism gap; UI-consumer-
  contract sub-grain): brief Sub-Q1 "server-only" constraint at
  session start scoped to affordance-kind; Sub-Q10 walk surfaced
  existing-UI-consumer-contract not verified. Cross-references
  RI-6 Grain 5 amendment.

**Pattern.** RI-10 framing-interaction-tracing operates as the
consolidation discipline: four entries surface one underlying
pattern. The discipline rule strengthens at chunk-6.3a evidence
basis: cited substrate at scope-lock requires verify-from-disk at
the cited-substrate's grain — **column-existence** for SQL
references, **consumer-count** for blast-radius estimates,
**UI-consumer-contract** for affordance-kind constraints.

**Grain 2 — Per-trigger / per-branch semantic coverage grain.** For
each trigger / branch / input shape the chunk dispatches over, what
is the per-trigger semantic? Are stranded paths handled? What does
"audit-only" vs "re-routing-functional" vs "no-op" mean per
trigger? Build the coverage table at scope-lock.

**Grain 3 — Per-trigger × per-decision-outcome conformance grain.**
For each combination of `(trigger, prior-state, decision-outcome)`,
what is the per-cell behavior? Is the discriminator's rule structure
exhaustive? Are there unreachable cells? Are reachable cells
prescribed at the right outcome? Build the rule table at scope-lock.

**Grain 4 — Idempotency-and-side-effect-contract conformance
grain.** For each cited contract (ADR-cited or chunk-cited), is the
contract implemented at chunk close? If not, is the deferral
explicit and named (forward-pointer inventory item + activation
trigger)? Articulate what's implemented at chunk close and what's
deferred at scope-lock — not at implementation.

**Why:** Chunk-3-Phase-4 evidence per grain: Grain 1 surfaced two
β-reconciliations (β-3 carried-in trigger errcode + β-4 PK column
fix); Grain 2 surfaced Pause 3 (γ'-partial per-trigger coverage)
mid-implementation; Grain 3 surfaced Pause 4 (D-partial 6-rule
discriminator replacing brief's 3-rule under-specification) + the
second-order β-5 / β-6; Grain 4 surfaced Pause 5 (D-partial-no-
idempotency at v1). Verify-forward at all four grains at scope-lock
would have caught these at scope-lock rather than mid-implementation.

**How to apply:** At scope-lock for any computational-shape chunk,
produce the four-grain artifacts as part of the scope-lock outputs:
- Grain 1 verify-from-disk results per Item C.
- Grain 2 coverage table (trigger × semantic).
- Grain 3 conformance table (trigger × prior-state × decision-
  outcome).
- Grain 4 contract-implementation status (per cited contract:
  "implemented at chunk N" or "deferred to chunk M via RI-X
  forward-pointer with activation trigger Y").

Precedent: Phase 4 chunk 3 close (single-arc evidence; four-grain
refinement synthesizes chunk-3's discipline-graduation lessons into
one inventory item). The four-grain checklist applies retroactively
to F-J-8 (Item C prospective application) — Item C remains Grain 1's
canonical statement; grains 2-4 are the chunk-3-Phase-4 extension.

### Grain 5 — Consumer-application grain at scope-lock

Grains 1-4 verify what substrate IS shipped. Grain 5 verifies how
shipped substrate interacts with existing CONSUMERS of the affected
entity types. Sub-sub-grains:

- **Substrate-shape consumer-application.** When cross-phase
  consumers (services, agent tools, integration tests) read the
  affected entity types, do they continue to behave correctly
  post-modification? **Evidence basis:** chunk-6.1 origin —
  cross-phase test failure surfaced consumer-contract gap;
  Sub-Q4 4-step activation sequence codified.

- **UI-consumer-contract.** When existing UI components consume
  the affected entity types, does the scope-lock's affordance-kind
  constraint account for the UI consumer's contract requirements?
  **Evidence basis:** chunk-6.3a Sub-Q10 firing — forwarded_mailbox
  ingestion would have shipped with cards-UI invisibility (operator-
  perceives-as-broken-despite-working-correctly) without the Grain 5
  extension catching the existing-UI-consumer gap.

**Discipline rule.** Scope-lock that ships substrate affecting an
entity type MUST verify-from-disk against all current consumers of
that entity type — services, agent tools, integration tests, AND
existing UI components — to confirm consumer-contract conformance
post-modification.

### Session-budget-feasibility verification + Path C invocation conditions (RI-7)

At scope-lock, compute the chunk's volume-vs-budget arithmetic and
adjudicate whether single-session reliable delivery is achievable
or whether Path C dispatcher-isolated invocation (or analogous
split shape) is the right structural choice. Path C invocation
preserves wiring-with-tests pairing at each commit boundary;
validation-gate-green at each commit is non-negotiable.

**Volume estimators at scope-lock:**
- Source files touched (modified + created).
- Migrations (substrate-level changes).
- Generated `types.ts` regenerations.
- Test surface (new tests + modified tests).
- Pre-drafted friction-journal entries.
- Cross-phase blast radius (number of services across phases).

**Path C invocation conditions:**
- Volume estimators sum exceeds single-session reliable delivery
  band.
- Scope-lock surfaces N framing-revisits (typically N≥3 framings;
  RI-10 codifies the multi-finding shape).
- Substantively-novel-logic scope (dispatcher-style, re-evaluator-
  style, computational-shape chunks per this cluster).

**Path C fault line declaration:**
- Explicit declaration at scope-lock: "fault line = X-isolated vs
  Y-cross-phase" (chunk-3-Phase-4 used dispatcher-isolated vs
  cross-phase-wirings).
- Each split commit preserves wiring-with-tests pairing.
- Validation gate green at each commit non-negotiable.

**Why:** Chunk-3-Phase-4 evidence: 5 framings + brief amendment
cycle + 8 source files + 1 migration + 1 generated types.ts pushed
chunk-3 over single-session reliable delivery. Path C dispatcher-
isolated split (3a + 3b) was the response. The chunk-3 upper bound
(8 files + 1 migration + 1 types.ts + 5 framings + brief amendment
cycle) is the current empirical evidence point for Path C invocation.

**How to apply:** At scope-lock, produce the volume estimate +
framing count. If the estimate sits comfortably below chunk-3's
empirical upper bound AND no framing-revisits surface at scope-lock,
single-session delivery is appropriate. If the estimate approaches
chunk-3's bound OR framing-revisits surface at scope-lock, invoke
Path C with explicit fault-line declaration. F-J-14 tier-1
codifies Path C invocation; this cluster carries the discipline
forward.

Precedent: Phase 4 chunk 3 (first Path C invocation at chunks-1-6 +
Phase 4 grain; upper-bound calibration anchor). Future chunks
calibrate downward against this anchor as evidence accumulates.

### Brief amendment cycle threshold + framing-interaction matrix at N≥3 (RI-10)

At single-finding scale (one or two β reconciliations per chunk),
friction-journal-only divergence is sufficient: implementation
surfaces are absorbed by friction-journal entries (β-N
reconciliations); brief text stays as-shipped at scope-lock for
chronology + provenance. At multi-finding-shape-changing scale
(typically N≥3 framings touched), brief amendment cycle is the
right tool — the amendment section ratifies new framings as
authoritative; friction-journal entries codify discipline
graduations; retrospective inventory tracks any further ADR
amendments.

**Sub-discipline — framing-interaction matrix at N≥3.** When a
brief amendment ratifies N framings, the amendment process must
explicitly trace each framing's interaction-with-every-other-
framing — not just absorb the framings as-stated. Absorbing
framings without tracing interactions yields second-order
consequences surfacing at implementation rather than at amendment.

**Why:** Chunk-3-Phase-4 evidence: five framings (γ' re-eval
primitive + γ'-partial per-trigger coverage + D-partial 6-rule
discriminator + D-partial-no-idempotency + Path C split) + amended
brief at `c76d264`. The amended brief absorbed framings 1-5 at
framing-level but didn't trace second-order consequences: β-5
(count_after semantic ambiguity from K2-post-mutation vs
`newCandidates.length` under D-partial-no-idempotency) and β-6
(rule 5 reachability via T5→T1 sequence under no-supersedes-on-
empty-rerun) are second-order consequences of Pause 5 that
surfaced at 3a impl. Empirical bound: chunk-3's 5 framings is the
current upper evidence point; lower bound undetermined (future
chunks calibrate downward).

**How to apply:** At single-finding scale, friction-journal entries
absorb. At N≥3 framings, fire brief amendment cycle. As part of
the amendment cycle, produce a framing-interaction matrix listing
each framing × each other framing × the interaction's second-order
consequence at substrate / discriminator / contract level. The
matrix surfaces second-order consequences before implementation
rather than after.

Precedent: Phase 4 chunk 3 (first instance; brief amendment cycle
at `c76d264`; F-J-15 tier-1 codifies). Future chunks calibrate the
N≥3 threshold downward as evidence accumulates.

### Verify-from-disk-at-non-standard-grain pattern

Execution-side at substrate-receipt MUST disk-verify substrate before
consuming, regardless of substrate-grain and regardless of
substrate-authorship-provenance. The discipline is grain-agnostic
and catch-direction-agnostic.

**Sub-grains observed-to-date (chunk-6.3a → Phase 5.1 evidence accretion):**

1. **Substrate-shape grain** (chunk-6.3a β-2): cited schema column
   verified to not exist on disk. Inter-side catch.
2. **Consumer-count grain** (chunk-6.3a β-3): cited blast-radius
   estimate (≤10 sites) verified to be 111 on disk (11x off).
   Inter-side catch.
3. **Context-gap grain** (chunk-6.3a scope-input artifact): cited
   Q1-Q4 content verified to not exist in session record.
   Session-internal catch.
4. **Handoff-receipt grain** (chunk-6.3a→6.3b transition): handoff
   prompt at `e0824c2` verified against disk anchors at session-onset
   state-verify. Inter-side catch.
5. **Intra-handoff-quantitative-estimate grain** (chunk-6.3b Round 0
   catch #4): "~20+ commits" handoff body estimate verified to be 243
   on disk (~12x off). Inter-side catch.
6. **Intra-commit-message-entry-count grain** (chunk-6.3b Round 0
   catch #5): "22 entries" commit message claim verified to be 26 on
   disk (1.18x off). **Intra-side catch** (NEW catch-direction
   sub-shape).
7. **Session-prompt-authoring / directive-authoring grain** (Phase
   6.5 retrospective drafting plan; 2026-05-17; broadened at Phase
   5.1 close 2026-05-19 to include directive-authoring sub-shapes):
   inter-side catches at the session-prompt or directive-authoring
   onset state-verify (prophylactic application). Phase 6.5 firing:
   Session 14 prompt cited ADR location as `docs/04_decisions/`
   verified to not exist on disk (actual `docs/07_governance/adr/`);
   also cited "apps/web/CLAUDE.md (or root)" verified to be root-only
   on disk. Phase 5.1 evidence accretion (Sessions 19-23 onset firings;
   parent consolidation candidate ratified at Phase 5.1 retrospective):
   - **Push-state-claim sub-shape** (N=4 evidence; Sessions 19/20/21/22
     onset). Session directive cited `origin/staging` push state without
     verify-from-disk grounding; actual push state diverged. Sessions
     23 + 24 directive citations explicitly verified push state via
     `git log origin/staging -1` at directive-authoring grain
     (avoidance trajectory empirically validates remediation pattern).
   - **Dev-DB-state-assumption sub-shape** (N=1 at Session 23 onset).
     Chunk 5.1c brief drafting directive assumed `bill_payment_allocations`
     accumulated state for Cat 2 reproduction; verify-from-disk at
     Session 23 onset surfaced row count = 0 (dev DB reset between
     Session 22 close and Session 23 onset; brief path (i) natural-
     accumulation framing premise-broken — see brief-drafting grain
     sub-grain #8 sub-shape #3 below).
   - **Directive-substrate-coverage sub-shape** (N=1 at Session 23
     onset). Chunk 5.1c brief drafting directive cited "4 consumer
     methods (aging / openBills / paymentApprovalQueue / activePayments)"
     with implication of 4 direct integration tests; verify-from-disk
     surfaced 3 direct integration tests + 1 route-grade test
     (activePayments via `vi.spyOn` mocking; no direct service-grade
     test). Validation-gate scope at Session 24 Phase C necessarily
     enumerated the 3 direct + 1 route-grade + full-suite sweep per
     test-coverage gap.
8. **Brief-drafting metafact-assertion grain** (Phase 5.1 evidence
   accretion 2026-05-19; new grain). Brief drafter asserts metafacts
   at brief-drafting authorship grain (line citations, mechanism
   diagnostics, test behavior assumptions) without verify-from-disk
   grounding; subsequent verify-from-disk at impl-onset or downstream-
   consumption surfaces drift. Sub-shapes:
   - **Brief-citation-line-drift sub-shape** (N=2 at Session 22
     directive references to chunk 5.1b brief). Brief cited
     `EVIDENCE_INCOMPLETE at ServiceError.ts:109-114` and
     `RecordBillPaymentInputSchema at bill.schema.ts:117-130`; impl-
     onset verify-from-disk surfaced actual line ranges at 103-108 and
     111-122 (consistent ~5-6 line offset; substrate shape correct).
     Remediation pattern: structural-anchor citations
     (e.g., "EVIDENCE_INCOMPLETE annotation in the Phase 5.1 chunk
     5.1a comment block in `ServiceError.ts`") preferred over absolute
     line citations at brief-drafting grade; line citations remain
     valid at impl-time verify-from-disk grade (smaller temporal gap).
   - **Cat 2 mechanism / URL-shape misidentification sub-shape**
     (N=1 at Session 24 chunk 5.1c Phase A). Brief framed Cat 2
     apReport URI-too-long firing as "accumulated bill_payment_allocations
     row state exceeds PostgREST URL length"; impl-onset empirical
     evidence at Session 24 Phase B Task 0 revealed firing comes from
     "OPEN BILLS count in the SECOND-query IN clause" (254 open bills
     × ~37 chars/UUID ≈ 9.4KB IN list exceeded ~8KB PostgREST URL
     limit). Different mechanism; same fix shape (nested-select
     eliminates the second SELECT IN entirely). Remediation pattern:
     verify-from-disk URL-shape calculation at brief-drafting grade
     for URL-pressure firings (compute the URL string and check
     against PostgREST/nginx URL length limit before asserting the
     mechanism).
   - **Test-cleanup-behavior assumption sub-shape** (N=1 at Session
     24 chunk 5.1c Phase A). Brief assumed "natural accumulation via
     test runs" (path (i)) would produce `bill_payment_allocations`
     accumulation state; verify-from-disk on helper-consumer test
     files (billRecordPayment.test.ts + paymentServiceRecord.test.ts +
     billEcA1.test.ts) revealed all DELETE allocations in `afterAll`
     cleanup. Happy-path test runs do not accumulate. Brief's path (i)
     premise-broken; impl-onset adjudicated path moot once root-cause
     refinement revealed 254-bills-in-IN URL pressure was itself the
     firing condition (no accumulation needed). Remediation pattern:
     verify-from-disk on test cleanup behavior at brief-drafting grade
     before asserting accumulation paths.
9. **Session-close-report attribution grain** (Phase 5.1 evidence
   accretion 2026-05-19; new grain). Session close report asserts
   quantitative attributions (failure counts, instance counts,
   per-fixture-counts) at session-close authorship grain; subsequent
   verify-from-disk at next-session-onset surfaces drift. Sub-shape:
   - **Fixture-count-attribution sub-shape** (N=1 at Session
     22→23 boundary). Session 22 close report enumerated "6 failures
     across apAging.test.ts + openBills.test.ts (×2) +
     paymentApprovalQueue.test.ts (×3) = 6"; Session 23 brief drafting
     verify-from-disk fixture count = 5 (apAging:2 + openBills:2 +
     paymentApprovalQueue:1). Minor 5↔6 attribution discrepancy at
     session-close-report grain (the (×N) parenthetical likely counted
     failed assertions within a fixture rather than fixtures; vitest's
     "Tests N failed" output counts test cases, not assertions).
     Remediation pattern: verify-from-disk on vitest output structure
     at session-close authorship grain when reporting per-test-file
     failure counts; prefer "5 fixtures across N files" framing over
     "(×N)" parenthetical multiplier framing.

**Parent consolidation (Phase 5.1 close ratification).** Sub-grains
#7 + #8 + #9 share a parent pattern at "brainstorming-side metafact
drift at directive-authoring + brief-drafting + session-close-report
grain." Seven-sub-shape evidence basis at Phase 5.1 close: push-state-
claim (#7 N=4) + dev-DB-state-assumption (#7 N=1) + directive-
substrate-coverage (#7 N=1) + brief-citation-line-drift (#8 N=2) +
Cat 2 URL-shape misidentification (#8 N=1) + test-cleanup-behavior
assumption (#8 N=1) + fixture-count-attribution (#9 N=1) = N=11
instances across 7 sub-shapes. The parent shape is the structural
claim: brainstorming-side asserts a metafact at authoring grain
(directive, brief, session-close-report) that fails verify-from-disk
grounding at downstream-consumption grain (session-onset, impl-onset,
next-session brief-drafting). The remediation pattern is consistent
across all seven sub-shapes: verify-from-disk grounding at
brainstorming-side BEFORE asserting metafacts. The discipline's
load-bearing home is this catalog extension; cousin firings at future
phases extend the sub-grain or sub-shape enumeration as evidence
accretes.

**Cross-grain instances at Phase 4:** (8) Round 3
retrospective-scoping (Phase 5.1 "reviewer chunk" naming drift).
(9) Post-retrospective-close drift-fix at `18dd608`.

**Discipline rule.** Disk is the canonical source. Substrate-receipt
grain — wherever it lives (impl-onset, session-onset, retrospective-
scoping, downstream-consumption) — requires disk-verify against the
cited substrate's grain. The substrate-author may be opposite-side
(inter-side catch; sub-grains #1, #2, #4, #5; Phase 4 instances) or
same-side (intra-side catch; sub-grain #6). The discipline operates
catch-direction-agnostic — same-side substrate is not exempt from
disk-verify-at-consumption.

**Named sub-disciplines:** Partial-information-recommendation-drift
(firing at recommendation-substrate-receipt grain; see
[`plan-authoring.md`](./plan-authoring.md) §Partial-information-recommendation-drift
discipline for the two-shape sub-discipline).

### Cross-references

- Phase 4 retrospective writeup §3 (framing-discovery arc
  centerpiece) and §4 (codified patterns by graduation surface) at
  `docs/07_governance/retrospectives/phase-4-retrospective.md`.
- ADR-0018 §item 4 amendment at `docs/07_governance/adr/0018-relationship-router.md`
  (Phase 4 retrospective Amendment block) — canonical statement of
  v1 Subsystem 3 dispatcher contract (γ'-partial coverage +
  D-partial 6-rule discriminator + D-partial-no-idempotency).
- ADR-0016 §6 amendment at `docs/07_governance/adr/0016-document-relationship-graph.md`
  (Phase 4 retrospective Amendment block) — `pre_commit_link_rerouted`
  v1 emission deferral forward-pointer + activation trigger.
- `feedback_verify_from_disk_at_brief_loop.md` Item C — Grain 1's
  canonical statement (substrate-shape verify-from-disk discipline;
  this cluster's Grain 2-4 extension builds on Item C).
- `docs/07_governance/friction-journal.md` — F-J-1 (chunk-N suffix
  discipline); F-J-13 (γ' + γ'-partial + D-partial-no-idempotency
  codification); F-J-14 (Path C dispatcher-isolated split);
  F-J-15 (brief amendment cycle discipline at multi-finding scale);
  Phase 4 retrospective F-J entry (codify-while-deciding meta-
  discipline + three applied-discipline instances).

### Post-close correction (2026-05-15)

The cluster above shipped at Phase 4 retrospective Commit C
(`294f9e7`, 2026-05-14) with cross-references that name "Phase 5.1
reviewer chunk" and "Phase 7 envelope substrate" as Phase 4's
downstream consumers. Post-close verify-from-disk at the
next-session-recommendation grain (2026-05-15) surfaced drift:
"Phase 5.1 reviewer chunk" is a Commit-C-drafting fabrication;
canonical Phase 5.1 = **Phase 5 amendments** per Phase 2
retrospective §6 line 588 (INV-DOC-001 enforcement + vendor_credits
substrate + paymentService introduction territory). The Round 7
scope-lock missed Phase 6 (Ingestion) as the canonical next phase
per Phase 5 retrospective §6 sequencing (`Phase 5 → Phase 2 →
Phase 3 → Phase 4 → Phase 6 → Phase 7 → Phase 8`). Phase 6 is
the operationally-instantiated **pure discipline-reference
consumer** of this cluster (Round 7 Q3 third-shape ratified
operationally).

Canonical readings authoritative at the cross-references above:

- **Phase 5.1** = Phase 5 amendments (not "Phase 5.1 reviewer
  chunk"). Both-shapes consumer of Phase 4 (activation-trigger:
  T2 dispatcher slot via paymentService.record() post-commit
  dispatch hook; discipline-reference: RI-1 + RI-6 + RI-7 +
  RI-10).
- **Phase 6** (Ingestion) — canonical next phase post-Phase-4 per
  Phase 5 retrospective §6:380-381. Pure discipline-reference
  consumer of Phase 4 (RI-1 + RI-6 + RI-7 + RI-10 at Phase 6
  scope-lock; no activation-trigger work on Phase 4 substrate).
- **Phase 7** Tier 2 pipeline — both-shapes consumer (activation-
  trigger: γ'-partial coverage gap + RI-9 fingerprint-dedup;
  discipline-reference: RI-1 + RI-6 + RI-7 + RI-10).

Full corrected cross-phase consumer inventory + corrected
next-session sequencing at the Phase 4 retrospective writeup's
"## Post-close correction" section (`docs/07_governance/retrospectives/phase-4-retrospective.md`).
Drift codification + discovery-grain framing at friction-journal
2026-05-15 entry. Below ADR-amendment-cycle threshold;
provenance-preserving correction shape (original cross-references
above stay; this note appends at end of cluster).

---
**Origin:**
- First codified: Phase 4 retrospective Commit C (`294f9e7`,
  2026-05-14); evidence accreted through Phase 6 chunk 6.3b +
  Phase 6.5 (sub-grain #7 added 2026-05-17) + Phase 5.1 (sub-grain
  #7 broadened to directive-authoring + sub-grains #8 brief-drafting
  + #9 session-close-report added 2026-05-19; parent consolidation
  ratified at Phase 5.1 close)
- Evidence basis: Phase 4 chunk 3 (5 framings + amended brief
  `c76d264`); chunk-6.3a Grain 1 reinforcement (4 sub-instances);
  chunk-6.3b sub-grains 5+6; Phase 6.5 sub-grain #7; Phase 5.1
  Sessions 19-24 N=11 instances across 7 sub-shapes (#7 N=6: push-
  state-claim N=4 + dev-DB-state-assumption N=1 + directive-
  substrate-coverage N=1; #8 N=4: brief-citation-line-drift N=2 +
  Cat 2 URL-shape misidentification N=1 + test-cleanup-behavior
  assumption N=1; #9 N=1: fixture-count-attribution N=1)

**Evaluation basis:**

- **Load-bearing (prescriptive).** The catalog extension generates
  operator action at directive-authoring + brief-drafting + session-
  close-report grain: verify-from-disk grounding BEFORE asserting
  metafacts. Sessions 23 + 24 directive citations empirically
  validated the avoidance trajectory (push-state-claim N=4 → N=4
  stable post-codification across two sessions; directive
  explicitly verified push state via `git log origin/staging -1`).
  Future readers consume the discipline as load-bearing scope-lock
  + brief-drafting + close-report authoring rule.
- **Generalizable.** Sub-shape diversity across 7 sub-shapes spanning
  three authoring grains (directive / brief / close-report)
  empirically demonstrates the pattern's reach beyond any single
  authoring surface. The remediation pattern (verify-from-disk
  grounding) is identical across all seven sub-shapes — the
  discipline operates at the parent-shape grain regardless of which
  specific sub-shape fires. General analog at Mechanism B
  brainstorming-side discipline shape (parent claim at "executive-
  side metafact assertion without verify-from-disk grounding").
- **Stable.** N=11 instances across 4 phases (Phase 4 + Phase 6.3a-
  6.3b + Phase 6.5 + Phase 5.1); 7 sub-shapes; pattern signature
  consistent across all firings (metafact assertion at authoring
  grain → verify-from-disk drift at consumption grain → remediation
  via verify-from-disk grounding at authoring grain). Two-session
  avoidance trajectory at Sessions 23 + 24 (push-state-claim N=4
  stable; directive cited verified push state per remediation
  pattern) empirically validates the discipline's stability post-
  codification.

- Promoted from: Phase 4 retrospective §3 (framing-discovery arc
  centerpiece); F-J-13/14/15 tier-1 codifications; Phase 5.1
  retrospective §3 parent consolidation (Observations #16 + #19 +
  #21 + #22 + #23 + #25 + #26)
- Cross-references: ADR-0018 §item 4 amendments (Phase 4 retrospective
  Amendment + Phase 5.1 retrospective Amendment); ADR-0016 §6
  amendment; `feedback_verify_from_disk_at_brief_loop.md` Item C
  (Grain 1 canonical statement); F-J-1, F-J-13, F-J-14, F-J-15;
  Phase 4 retrospective writeup §3 and §4; Phase 6.5 retrospective
  §3 Candidate #5; Phase 5.1 retrospective §3 (forthcoming)
- v2.2 reorg: 2026-05-17 (relocated from repo-root CLAUDE.md at
  Commit D per `docs/09_briefs/phase-6.5/reorg-proposal-v2.md` §4.1;
  cluster ships as single codification unit per §5.3 footer
  consolidation)

### Phase 7 evidence accretion (2026-05-20): directive-grade Phase A verification discipline + (ι) + (μ) sub-grains paired-but-distinguished

Phase 7 implementation cycle (Sessions 36-40; chunks 7.1a/7.1b/7.2/
7.3a/7.3b) extends the parent verify-from-disk-at-non-standard-grain
pattern with paired-but-distinguished sub-grain instances at
directive-grade Phase A verification surfaces. Three Phase 7
codification candidates synthesize as a coherent extension of the
parent shape.

**Anti-drift prospective-firing operationally validated as
directive-grade Phase A verification discipline (Candidate #3, N=49+
cumulative).** The discipline of anti-drift prospective-firing at
directive-authoring grade has accumulated N=49+ instances across
multiple phases. Phase 7 operationally validates the discipline at
chunk-impl directive grade: Iteration 2 directive-grade Phase A
verification (each chunk-impl directive's Phase A reads + verification
steps) caught substantive findings BEFORE WSL dispatch rather than
at impl-grade reactive. Chunk 7.3b's Iteration 2 alone caught 5 Phase
A findings (A-E) at directive grade; without directive-grade Phase A
verification, those findings would have surfaced as (β) reconciliations
at impl-grade.

Discipline rule: at directive authoring, run Phase A verification
substeps (substrate reads + verify-from-disk on cited paths/columns/
extensions + Iteration 2 founder review surfaces) BEFORE dispatching
to WSL. Surfaces caught at directive grade are absorbed via
directive amendment (Iteration 2 → Iteration 3); surfaces missed at
directive grade surface at impl-grade reactive (β reconciliations +
mid-impl scope corrections).

**(ι) sub-grain — directive partial-information value pick
incompatible with substrate state (N=3 cross-instance + N=4
within-Session-40; Candidate #4).** Fires when a directive's
partial-information value pick (e.g., "Option α default vs Option β
override") cites a substrate value that turns out to be incompatible
with current substrate state. Different from (μ) below: (ι) is about
the VALUE PICK adjudication at directive-grade vs substrate state;
(μ) is about the CITED PATH/COLUMN/EXTENSION existence at substrate.

(ι) fires at directive grade between brief-author and chunk-impl
session: brief author writes a partial-information value pick; chunk-
impl directive author cites it; Phase A verification catches the
substrate incompatibility before dispatch.

Phase 7 evidence basis (N=3 cross-instance + N=4 within-Session-40):
- **Session 38 — Postgres ENUM transaction-scope:** chunk 7.2
  directive cited "ENUM ADD VALUE in same transaction as DML using
  the new value" pattern; Phase A verification surfaced Postgres
  ENUM transaction-scope constraint requires explicit `COMMIT`
  between ENUM ADD VALUE + DML using new value.
- **Session 39 — ProposedMutation/ProposedAttachment Zod absence:**
  chunk 7.3a directive's Iteration 1 cited Bundle + Mutation +
  Attachment Zod schemas as "existing"; Phase A revealed all three
  schemas absent at substrate (greenfield work consolidated to
  chunk 7.3b per Iteration 2 Option γ).
- **Session 40 — Findings A+C+D+E (within-session N=4):**
  chunk 7.3b directive Iteration 2 caught 5 substantive Phase A
  findings (RI-1 5-surface path divergence at 3-of-5 surfaces +
  ProposedMutationBundle absence at v1 + Modal sidecar deployment
  status + ProposalJustificationSchema absence). N=4 within-session
  firings of (ι) at single directive grade.

Discipline rule: at directive authoring, verify each partial-
information value pick's cited substrate via Phase A reads. If
substrate incompatibility surfaces, route to Iteration 2 founder
adjudication (override default → alternative disposition).

**(μ) sub-grain — brief-cited substrate path/column/extension
doesn't exist at substrate (N=6 conservative / N=8 expansive;
Candidate #5).** Fires when a brief or directive cites a substrate
path / column name / file extension / enum value / API contract
that turns out NOT to exist at substrate. Different from (ι) above:
(μ) is about the CITED ARTIFACT existence at substrate; (ι) is
about the VALUE PICK adjudication at directive-grade vs substrate
state.

(μ) fires at brief grade between substrate and brief-author OR at
directive grade between brief-author and chunk-impl session: the
brief author cites substrate path/column/extension; Phase A
verification at directive grade catches the substrate gap before
dispatch.

**Counting methodology callout.** Phase 7 evidence basis admits two
counting methodologies for N count:

- **Conservative N=6 counting** — each substrate-grain divergence
  counts as ONE firing regardless of sub-surface multiplicity.
  (Session 39 vendors.aliases + pg_trgm = N=2; Session 40 5-surface
  RI-1 entry-point path divergence = N=1 [single structural
  divergence]; ExceptionReasonSchema absence = N=1; LinkedEntityTypeSchema
  outdated v1-active = N=1; document-platform/ dir convention = N=1;
  bill.record_payment ActionName = N=1. Total N=7 conservative;
  documenting the methodology for clarity.)
- **Expansive N=8 counting** — multi-sub-surface divergences count
  each sub-surface as a separate firing. (Session 39 vendors.aliases
  + pg_trgm = N=2; Session 40 5-surface RI-1 path divergence at 3-of-5
  surfaces = N=3 [each path is a separate firing]; ExceptionReasonSchema
  absence = N=1; LinkedEntityTypeSchema outdated = N=1; document-platform/
  dir convention = N=1; bill.record_payment ActionName = N=1. Total
  N=8 expansive.)

**Methodology choice.** Both are defensible; both well above N=3
codification threshold. The choice matters at observation-grain
banking grade (whether subsequent multi-sub-surface divergences add
N=1 or N=multiple). At Phase 7 close, codification at the parent
shape is unaffected by methodology choice; future evidence accretion
banks per the elected methodology. Documenting both to prevent drift
at future-cycle banking. The pattern's signature (cited artifact
doesn't exist at substrate) is identical across all sub-surfaces;
remediation is identical (verify-from-disk at directive-grade Phase
A before dispatch).

Discipline rule: at brief authoring AND at directive authoring,
verify each cited substrate path/column/extension/enum value/API
contract via Phase A reads. If gap surfaces, route to Iteration 2
founder adjudication (substrate-update via amendment OR cite-correct
to substrate-actual).

**Paired-but-distinguished sub-grain framing.** (ι) and (μ) are
related — both are substrate-citation verification disciplines at
different verification windows. (ι) fires at directive grade
between brief-author and chunk-impl; (μ) fires at brief grade
between substrate and brief-author. Same family of "substrate-
citation-verification" disciplines but different verification
windows. Pairing them at this convention section preserves the
cohesive convention surface; distinguishing them in convention
text prevents future-reader conflation of the two firing-shapes.

**Cross-references.**
- F-J-14 fourth-instance entry (2026-05-20) for the chunk-impl-grade
  evidence basis backing Candidate #3.
- Phase 7 chunk-impl directive Iteration 2 surfaces (Sessions
  37+38+39+40) for the (ι) + (μ) within-session firing evidence
  basis.
- Phase 7 retrospective at
  `docs/07_governance/retrospectives/phase-7-retrospective.md`
  §3 Candidates #3 + #4 + #5 for full empirical narrative + the
  conservative-vs-expansive counting methodology adjudication.

**Origin (Phase 7 evidence accretion 2026-05-20):**
- First codified: Phase 7, 2026-05-20 (Phase 7 retrospective close)
- Evidence basis: Candidate #3 N=49+ cumulative + Candidate #4 N=3
  cross-instance (within-Session-40 N=4) + Candidate #5 N=6-N=8
  per counting methodology
- Promoted from: Phase 7 retrospective §3 Candidates #3 + #4 + #5
- Cross-references: F-J-14 fourth-instance entry; Phase 7
  retrospective §3 Candidates #3 + #4 + #5

---

## PARTIAL Closure State-Decomposition (Meta A)

When a verification arc closes PARTIAL — halted before
completing all in-scope items, whether by budget
ceiling, systematic-issue halt, operator pause, or any
other early-termination mechanism — the run record
must populate the dimensions this convention names
rather than collapse to a single-value disposition
that loses information. The natural-language headline
for any measured dimension ("X verified," "Y spent,"
"Z covered," "halt fired correctly") implicitly elects
a single state; the run record must surface all states
the runtime distinguished, even when one state has
zero population.

At scoping time, the run author articulates which
dimensions the run will measure and what runtime
states each headline could collapse. The standing
list below names dimensions that have appeared in
prior runs and may apply; it is reference, not a
mandatory checklist. Authors should consider whether
each applies and add new dimensions as they surface.

Decomposition shapes may be **value-level** (sub-values
of one axis) or **axis-level** (claims about different
layers bundled by runtime coincidence). When a
decomposition is axis-level, name the layers
explicitly so the bundling that produced the single
headline doesn't reproduce in the run record.

**Standing dimensions (reference, not mandatory):**

- **Coverage trichotomy** (value-level): verified /
  attempted-but-failed / untried. Untried may
  sub-decompose by mechanism (untried-by-design vs.
  untried-by-halt) where the distinction matters for
  remediation paths.
- **Cost trichotomy** (value-level): verification
  spend / discovery spend / total. Distinguishes
  in-scope verification cost from out-of-scope
  failure-mode disposal cost; reading the run total
  as "verification cost" inflates the unit by
  conflating the two.
- **Spec-runtime tuple** (value-level): spec-time
  disposition / runtime disposition. Distinguishes
  what the spec author expected at spec-time anchor
  from what the runtime produced at runtime anchor;
  the two diverge implicitly when the spec→run gap is
  non-trivial.
- **Halt-policy outcome** (axis-level; originating
  instance, not the dimension's general shape):
  runtime-execution discipline / scoping-completeness.
  The halt firing is a runtime-discipline fact;
  whether the collision should have been live at
  runtime is a scoping-process fact. The single "halt
  fired correctly" headline bundles both; the
  decomposition splits them so the runtime success
  doesn't carry forward as evidence the scoping was
  sufficient. Future axis-level dimensions may surface
  with different layer-pairs (e.g.,
  test-coverage-discipline / scoping-completeness on a
  different verification arc) — the dimension's
  general shape is "claims about different layers
  bundled by runtime coincidence into one headline,"
  with halt-policy outcome as the C7-derived first
  instance.

**Per-sub-type N=2 split trigger:** when any single
sub-type accumulates a second instance, that sub-type
graduates to its own convention. Currently axis-level
decomposition is at N=1 (halt-policy outcome); a
second axis-level instance would fire the split.
Hypothesis-discrimination dimension (introduced in
OI-3 scoping doc §7a, commit `161bff8`, Part 5) is
also at N=1 and would graduate per the same trigger
on a second authoring.

First applied: captured in
`phase-1.2-retrospective.md` §3 Pattern 6 (Meta A
first concrete application; original friction-journal
section (o) "C7 closeout deliverables (Meta A
application, post-C11)" sub-section, commit `52a63f0`).
The four C7 closeout deliverables (coverage trichotomy
/ cost trichotomy / spec-runtime tuple / halt-collision
axis-level) are Meta A's first concrete population. The OI-3 scoping
doc §7a (commit `161bff8`) is the second application,
applying Meta A at scoping time to OI-3's M1 post-fix
validation run measurement dimensions.

Composes with: **Scoping-Time Cross-Dependency
Articulation (Meta B)** — sibling meta-convention.
Meta B applies at scoping time pre-execution
(articulating cross-dependencies before they fire as
runtime collisions); Meta A applies at run-record
time post-PARTIAL-closure (decomposing the
single-value disposition into the dimensions the
runtime distinguished). They are temporally
complementary: Meta B prevents some collisions from
landing in run records at all; Meta A ensures the
ones that do land surface their full state-space.
**Mutual Hallucination-Flag-and-Retract Discipline
(Convention #10)** — upstream epistemic-hygiene
framework. PARTIAL closures sit downstream of #10's
discipline: when a run closes PARTIAL, the
state-decomposition Meta A requires is itself a
hallucination-resistance mechanism (single-value
dispositions are the natural-language headline that
overstates the result; the decomposition is the
explicit qualifier that blocks the carry-forward).

First codified: this commit, S13 conventions-catalog
codification. Drafted in C11 retrospective (captured in
`docs/07_governance/retrospectives/phase-1.2-retrospective.md`
§3 Pattern 6; original `friction-journal/phase-1.2.md`
section (p), commit `f221bab`); first concrete
application in S12 (`52a63f0`); applied at scoping time
in OI-3 scoping doc (`161bff8`).

---
**Origin:**
- First codified: Phase 1.2, 2026-04-26 (S13 conventions-catalog
  codification)
- Evidence basis: N=1 first concrete application (S12 C7 closeout
  deliverables, commit `52a63f0`); N=2 with OI-3 scoping doc §7a
  application (commit `161bff8`)
- Promoted from: C11 retrospective drafting (section (p), commit
  `f221bab`)
- Cross-references: Scoping-Time Cross-Dependency Articulation
  (Meta B; below); Mutual Hallucination-Flag-and-Retract Discipline
  (in [`iterative-catching.md`](./iterative-catching.md));
  `docs/07_governance/retrospectives/phase-1.2-retrospective.md`
  §3 Pattern 6

---

## Scoping-Time Cross-Dependency Articulation (Meta B)

When scoping a verification run, fix-stack, or
workstream, the author must articulate
cross-dependencies between components that have been
authored independently. Components may be policy
rules within a scoping doc, distinct workstream
artifacts (fix-stacks, prompt sets, verification
harnesses), or existing code paths interacting with
new code paths a fix-stack introduces.
Cross-dependencies that stay implicit at scoping time
surface as runtime collisions, where the scoping doc
didn't ask the cross-product question and the
runtime is left to resolve the collision ad-hoc.

The articulation is concrete: for each
cross-dependency the run measures against, name the
components, name the interaction question, and
resolve it (or explicitly defer with a named
fallback).

**Articulation may be iterative:** resolving one
cross-dependency can surface another (e.g., choosing
to sequence an upstream fix opens a question about
how the upstream fix's own scoping articulates its
dependencies). Continue articulation until no new
cross-dependencies surface.

**Cross-dependency types that have appeared in prior
runs and may apply** (reference, not mandatory):

- **Policy-rule interactions:** for each pair of
  policy rules `(D_i, D_j)` authored in the scoping
  doc, does the doc say which wins when both apply?
  Pairwise check across the rule set. The
  D2-vs-D3 collision in C7 EC-13 (captured in
  `phase-1.2-retrospective.md` §3 Pattern 6, Cluster A
  Item 1 / Fact A + Fact B split; original
  friction-journal section (p), commit `f221bab`) is
  the originating instance — D2 (halt on
  systematic reproduction) and D3 (continue
  per-instance for out-of-scope failure) collided at
  runtime because the scoping doc never asked the
  pairwise question.
- **Downstream-component dependencies:** when
  verifying invariant N or shipping a fix-stack
  against component N, what other components are
  downstream — by execution-order, by contract-shape,
  or by any other coupling — and what's the plan if
  any of them fail systematically or shift their
  contract during the run? Choose explicitly:
  sequence the downstream fix first, synthesize
  bypass artifacts, or claim coverage only against
  the post-attrition residue. This sub-type covers
  both the original invariant-pipeline case (Meta B's
  N=2 instance: OI-3 verification facing
  Class-2-as-upstream-and-as-fix recursion, OI-3
  scoping doc §7b commit `161bff8`) and the
  contract-shape case surfaced in OI-3 §7c
  (prompt-surgery work coupled to ProposedEntryCard
  schema via tentative-state representation), and is
  open to future cases where a component's downstream
  coupling does not fit either named precedent.
- **Telemetry-salience dependencies:** when a fix-stack
  lands on invariant N, two sub-checks. (i) Does
  existing telemetry surface the discriminators that
  matter for N's failure modes? If not, the fix-stack
  scope includes the telemetry refresh. (ii) Does any
  net-new code path the fix-stack introduces have its
  own telemetry? If not, the fix-stack scope includes
  net-new instrumentation. The OI-3 case (OI-3
  scoping doc §7b commit `161bff8`) scheduled the
  canvas_directive log-field patch into OI-3 Part 2
  per sub-clause (i); sub-clause (ii) did not fire
  because prompt-surgery introduces no net-new
  orchestrator/service code paths.

Authors should consider whether each applies and add
new cross-dependency types as they surface.

**Per-sub-type N=2 split trigger:** when any single
sub-type accumulates evidence of structurally
distinct mechanisms (e.g., a future case that doesn't
fit either the "by execution-order" or "by
contract-shape" coupling under downstream-component
dependencies, or a third sub-type beyond
policy-rule/downstream-component/telemetry-salience),
re-evaluate whether to split. **Meta-level N=5 review
trigger:** if the cross-dependency type list grows to
five sub-types, re-evaluate whether the meta-shape
still holds across them or has fragmented into a
grab-bag.

First applied: OI-3 scoping doc §7b (commit
`161bff8`). All three articulation prompts surfaced
their cross-dependencies cleanly on first application
— policy-rule interactions surfaced two halt-criteria
pairs and resolved both with precedent citations;
downstream-component dependencies surfaced the
recursive Class-2-as-upstream-and-as-fix dependency
and resolved with synthetic-bypass; telemetry-salience
surfaced the canvas_directive log-field gap and
scheduled the patch into OI-3 Part 2. The §7c
contract-shape observation drove this convention's
sub-type rename from the original drafted name
("invariant-pipeline dependencies") to the broader
"downstream-component dependencies" framing landed
above; rename is N=1-evidence-driven, not a
falsification trigger.

Composes with: **PARTIAL Closure State-Decomposition
(Meta A)** — sibling meta-convention; Meta A applies
post-PARTIAL-closure, Meta B applies at scoping-time
pre-execution. Together they form a temporal pair on
the verification arc. **Spec-to-Implementation
Verification (Convention #8)** — upstream
verification-discipline sibling. Spec-to-Impl catches
drift in assertions about shipped code at
implementation time; Meta B catches drift in
cross-layer coordination at scoping time. Both
prevent classes of drift that would otherwise surface
as runtime failures, and both share the
"articulation-now-prevents-collision-later" shape.

First codified: this commit, S13 conventions-catalog
codification. Drafted in C11 retrospective (captured in
`docs/07_governance/retrospectives/phase-1.2-retrospective.md`
§3 Pattern 6; original `friction-journal/phase-1.2.md`
section (p), commit `f221bab`); first applied in OI-3
scoping doc §7b (commit `161bff8`) with the §7c sub-type
rename informing the final form landed here.

---
**Origin:**
- First codified: Phase 1.2, 2026-04-26 (S13 conventions-catalog
  codification)
- Evidence basis: N=1 first application (OI-3 scoping doc §7b,
  commit `161bff8`) with three articulation prompts surfacing
  their cross-dependencies cleanly; §7c sub-type rename
  observation
- Promoted from: C11 retrospective drafting (section (p), commit
  `f221bab`); first applied in OI-3 scoping doc §7b
- Cross-references: PARTIAL Closure State-Decomposition (Meta A;
  above); Spec-to-Implementation Verification (in
  [`plan-authoring.md`](./plan-authoring.md));
  `docs/07_governance/retrospectives/phase-1.2-retrospective.md`
  §3 Pattern 6

---

## Material Gaps Surface at Layer-Transition Boundaries

Gaps between abstraction layers — schema ↔ UX,
planner-drafting ↔ execution-reality, catalog-closure ↔
prompt-routing — are where under-specified requirements
silently decompose into bugs. When a sub-brief cites one
layer as a dependency of work in another, the cross-layer
contract must be stated explicitly and verified against
both sides, not assumed from narrative coherence on either
side alone.

Rationale: five datapoints across Sessions 7 and 7.1
triggered codification. (1) **P11b** (Session 7):
onboarding-complete UX layer depended on an
`agent_sessions.org_id` schema shape that the UX layer
didn't state and the schema layer didn't enforce,
producing a silent null-propagation bug at session load.
(2) **P14** (Session 7): conversation-resume UX depended
on Session 5.1's terminating-text persistence behavior;
the UX layer assumed a persistence contract the
persistence layer didn't guarantee. (3) **P16 dual-context
rewrite** (Session 7.1): the `onNavigate` callback shape
expected by canvas-transcript UX didn't match what the
transcript component emitted; caught at test time.
(4) **P19 template-catalog gap** (Session 7.1.1): EC-19
scenario (a) wasn't answerable because catalog-closure and
prompt-routing layers each assumed the other held the
missing template. (5) **P21 rationale drift**
(Session 7.1.1): the planner-drafting layer asserted a
rationale ("self-emit paths keep same helper") that didn't
match the four call sites in
`src/agent/orchestrator/index.ts` — the drafting layer's
narrative was coherent but contractually wrong against the
execution-reality layer.

Remediation: when a sub-brief cites a cross-layer
dependency, state the dependency explicitly (which symbol,
at which layer, with what contract) and verify against
both sides (grep the symbol, read the caller, confirm the
contract is what both layers think it is). Narrative
coherence on one side of a boundary is insufficient
evidence; the other side's shape must be read and matched.

See `docs/07_governance/friction-journal/phase-1.2.md` Session 7 and
Session 7.1 retrospectives for the full datapoint records.
First codified: 2026-04-22, as part of the deferred
Session 8 C9 codification (landed in the same commit as
Convention #10 and the governance-audit mechanism).

---
**Origin:**
- First codified: Phase 1.2, 2026-04-22 (Phase C ratification pass
  + C9 codification)
- Evidence basis: N=5 datapoints across Sessions 7 and 7.1 (P11b,
  P14, P16 dual-context rewrite, P19 template-catalog gap, P21
  rationale drift)
- Promoted from: Sessions 7 and 7.1 retrospectives
- Cross-references:
  `docs/07_governance/friction-journal/phase-1.2.md` Session 7 and
  Session 7.1 retrospectives

---

## Methodology cluster sub-categorization

The methodology cluster bucket accumulated 11 inhabitants
during round-2 sessions (soft-threshold at 10 tripped at Session
6.5 closeout; 11th added at Session 6 brainstorm closeout).
Session 8 ratifies sub-categorization into three clusters with
differential character. The actual inventory spans round-2
friction-journal entries (5A brainstorm closeout's "Methodology
cluster (8; reasoning tools)" enumeration #3-#10 + Session 5B
brainstorm's #16 + Session 6 brainstorm's +2); future inventories
consult the journal as canonical record.

**Cluster A: Codification-trajectory observations.**

Inhabitants currently at codification trajectory: Tier 1 LIVE
candidates, Tier 2 candidates, Tier 3 holds, or items recently
graduated to dedicated codification.

Worked examples (with current status post-Session-8):
- Drift meta-pattern (graduated to Tier 1 ratified at Session 8
  C1; dedicated codification at the
  [`plan-authoring.md`](./plan-authoring.md) entry).
- Inter-session dependency sub-axis (graduated as part of drift
  meta-pattern at Session 8 C1).
- Prophylactic-vs-reactive sub-rule (graduated as part of drift
  meta-pattern at Session 8 C1).
- Recurring meta-arc placement question (Tier 3 hold; see
  carry-forward sub-section in
  [`plan-authoring.md`](./plan-authoring.md)).
- Substrate-leverage phase observation (Tier 3 → Tier 2 per
  Session 5B brainstorm closeout).
- Floor-only push gate carve-out (graduated to ratified at
  Session 7 C6; dedicated codification at the round-N
  restructure plan workflow + this Round-2 Conventions section).
- Turbo cache content-hash (Tier 1 LIVE candidate; codification
  path TBD).
- Variance-decomposition diagnostic (#5; N=1).
- Handoff-prompt-commit-number-translation (#6; N=1).

Character: items have a codification trajectory (toward
ratification or hold-with-recurrence-trigger). Sub-cluster's
own count discipline: items track their N-count toward
codification thresholds per the three-category codification
taxonomy.

**Cluster B: Session-execution discipline observations.**

Inhabitants describing operational discipline that fires within
session execution (typically at session-start verification,
pre-push gates, or mid-execution pattern recognition).

Worked examples:
- Mid-dispatch plan re-read pre-push verification (N=2 per
  Session 6 brainstorm closeout).
- Parallel-session commit visibility (N=1 per Session 6
  brainstorm closeout).
- Pre-execution-audit-revealing-scope-refinement (#8; N=2 across
  Phase 3 substrate audit + 5B Decision 1 audit).
- Fresh-pass-on-decision-revealing-refinement (#16; N=1).

Character: items describe session-execution mechanics — what
gates fire, what verifications run, what patterns surface
during execution. Distinct from codification-trajectory
candidates (which are about what gets ratified) and from
scope/structural observations (which are about scope decisions).

**Cluster C: Scope/structural observations.**

Inhabitants describing scope decisions, structural patterns,
and category preservation (meta-meta level).

Worked examples:
- Count-level-vs-structural-level distinction (#7; N=2 across
  decision domains: Decision 4 commit shape + Decision 6
  gate-path).
- Discipline-extension pattern (#10; N=2: 5A's agency-extends-
  to-consumer + 5B's discipline-extends-to-published-artifact-
  accuracy).
- 5A-closeout-framings-refined-by-5B-brainstorm (#9; N=2:
  Decision 1 audit revision + Decision 3 binary→split).
- Categorical-distinction-preservation meta-pattern (round-2
  brainstorm-time observation; N=2).
- Failure-mode taxonomy (forward vs backward) — sub-pattern
  within structural-pattern bucket per Session 6 brainstorm
  closeout.
- Count-level commit pattern variance (#11 in structural-pattern
  bucket; N=3 codification candidacy).

Character: items describe scope/structural reasoning — how
scope decisions emerge, how structural patterns hold across
work shapes, how category boundaries preserve.

Note: the structural-pattern cluster (NEW BUCKET established at
Session 5B brainstorm Decision 7.B with #11/#12/#13) is sibling
to the methodology cluster. Cluster C absorbs structural-pattern-
related observations conceptually; explicit reconciliation
between methodology cluster Cluster C and the journal's
structural-pattern bucket can land at a future bucket-structural
session if the two reveal differential character (currently
treated as related sub-shape evidence).

**Adding new observations to the bucket.**

Future round-N or arc-X observations land in the cluster they
match by character. New sub-cluster creation requires evidence
of differential character (per the codification-practice
meta-question's answer; sub-shape preservation when differential
firing evidence exists). The bucket count limits no longer apply
once sub-categorization is in place; instead each sub-cluster
operates under its own count discipline.

**Re-evaluation trigger.** Methodology cluster sub-categorization
re-evaluates if any sub-cluster grows past ~8 inhabitants
(soft-threshold 50% smaller than the parent bucket's
10-inhabitant threshold, reflecting sub-cluster's narrower
scope) OR if a new observation doesn't fit cleanly into A / B /
C. The re-evaluation may add a fourth sub-cluster, split an
existing sub-cluster, or restructure the parent bucket.

---
**Origin:**
- First codified: Round-2 Conventions, 2026-05-09 (Session 8
  ratification)
- Evidence basis: 11 inhabitants accumulated during round-2 sessions
  (5A brainstorm closeout #3-#10 + Session 5B #16 + Session 6
  brainstorm +2)
- Promoted from: Round-2 sub-categorization ratification
- Cross-references: Plan-substrate-vs-canonical-reality drift
  meta-pattern (in [`plan-authoring.md`](./plan-authoring.md));
  Three-category codification taxonomy (in
  [`../README.md`](../README.md))

---

## Substrate-now-enforcement-later cross-pattern

When ratifying substrate (schema reservations, enum members,
interface contracts, invariant placeholders), the enforcement
code (lint rules, runtime checks, migrations against reserved
values, invariant-content writeup) does not need to land at
substrate-ratification time. Enforcement lands at implementation
time when the first consuming code path forces the question.

Mechanism: substrate at ratification time fixes the shape; the
shape is verifiable from spec + the closed-enum / reserved-value
discipline (Layer 1 DB CHECK + Layer 2 Zod boundary + Layer 3
service no-emit per ADR-0010). Enforcement at implementation time
fixes the runtime behavior; runtime behavior is verifiable from
code + tests. Conflating the two timing surfaces produces two
failure modes:
- Over-specifying enforcement before consumer code shape is known
  produces premature lock-in that the first consumer has to work
  around.
- Under-specifying substrate so consumer code drifts from intended
  shape produces a migration cliff when the discrepancy surfaces.

Trigger: any ratification-time decision that names a slot
(reserved enum value, INV-ID placeholder, lint-rule placeholder,
matrix v1-ship-gate). Substrate lands now; enforcement gate fires
at the first consumer.

Precedent: Phase 0 → Phase 1 transition. Codified at D6 §6.8 +
ADR-0010 Variant A precedent (commit `797db40`). Three deferred-
obligation triggers carry this pattern into Phase 1: Q29 (ESLint
rule design fires at first `src/agent/pipelines/**/*` code), Q79
(INV-DOC-001 shape + DOC prefix fire at first DOC-citing code),
Q77 (Q28 matrix fires at v1 ship). Full Phase 0 closeout at
`docs/09_briefs/phase-2/2026-05-04-phase-0-closure-verification.md`.

---
**Origin:**
- First codified: Phase 0 → Phase 1 transition, at D6 §6.8 +
  ADR-0010 Variant A precedent (commit `797db40`)
- Evidence basis: N=multiple deferred-obligation triggers (Q29,
  Q79, Q77)
- Promoted from: D6 §6.8 codification + ADR-0010 Variant A
  precedent
- Cross-references: ADR-0010 Variant A; D6 §6.8;
  `docs/09_briefs/phase-2/2026-05-04-phase-0-closure-verification.md`
- v2.2 reorg: 2026-05-17 (relocated from repo-root CLAUDE.md at
  Commit D per `docs/09_briefs/phase-6.5/reorg-proposal-v2.md` §4.1)

---

## Operational-flex collapse heuristic at chunk-grade decomposition

When a chunk scope-lock cycle convenes for chunk-grade decomposition,
the cycle may **collapse cleanly** — empty cycle, no sub-question
adjudication needed, no Path C invocation evaluation needed — when
three conditions hold:

1. All sub-questions adjudicated at the prior cycle close.
2. All partial-information items operationalized at the brief grain.
3. Path C evaluation belongs at session-onset Phase A grain (per
F-J-14 three-grain Path C catalog), not at chunk scope-lock grain.

When these three conditions hold at scope-lock cycle onset, the cycle
collapses to empty; the brief stands as canonical chunk-shipping
substrate; implementation proceeds directly.

**Why:** Empty scope-lock cycles are a positive signal — they
indicate that pre-cycle adjudication discipline + brief-grain
operationalization discipline + Path-C-grain-catalog discipline
collectively absorbed the work upstream. Recognizing the empty-cycle
condition at session onset saves a meeting-shape that produces no
output.

**How to apply:** At chunk scope-lock cycle onset, evaluate the three
conditions. If all hold, declare empty-cycle collapse + skip directly
to implementation grain. If any condition fails, the cycle convenes
per existing scope-lock discipline.

**Evidence basis (N=3 graduation; Phase 6.5 chunks 1 + 2 + 3):**
Session 6 (chunk 1 scope-lock cycle) collapsed cleanly; Session 9
(chunk 2 scope-lock cycle) collapsed cleanly; Session 12 (chunk 3
scope-lock cycle) collapsed cleanly. Three-precedent track record at
chunks-1-3-Phase-6.5 grain.

**Cross-references.**
- Phase 6.5 retrospective at
  `docs/07_governance/retrospectives/phase-6-5-retrospective.md`
  §3 Candidate #11 for full empirical narrative.
- F-J-14 three-grain Path C catalog (friction-journal 2026-05-17
  entry; Commit A `1752f06`) for the Path C grain-evaluation
  discipline referenced in condition (3).

---
**Origin:**
- First codified: Phase 6.5, 2026-05-17 (Phase 6.5 retrospective
  close)
- Evidence basis: N=3 graduation across Phase 6.5 chunks 1+2+3
  (Sessions 6, 9, 12 all collapsed cleanly)
- Promoted from: Phase 6.5 retrospective §3 Candidate #11
- Cross-references: Phase 6.5 retrospective §3 Candidate #11;
  F-J-14 three-grain Path C catalog (friction-journal 2026-05-17
  entry; Commit A `1752f06`)
- v2.2 reorg: 2026-05-17 (relocated from repo-root CLAUDE.md at
  Commit D per `docs/09_briefs/phase-6.5/reorg-proposal-v2.md` §4.1)
