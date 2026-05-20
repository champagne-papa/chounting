# Phase 7 retrospective — Tier 2 document pipeline (Stages 0-7 active)

*Drafted at Session 41 close, 2026-05-20. Multi-impl-session
retrospective precedent: Phase 5.1 (3 impl-sessions) + Phase 6.5 (3
impl-sessions); Phase 7 extends to 5 impl-sessions (chunks 7.1a +
7.1b + 7.2 + 7.3a + 7.3b at commits `f0fdecc` + `4c481a9` +
`c401296` + `8499189` + `ab0f7fe`). Phase 7 scope-lock cycle close
at `b964798` (`docs/09_briefs/phase-7/2026-05-19-phase-7-scope-lock-cycle-close.md`).*

---

## §1 Arc summary

Phase 7 ships the Tier 2 document pipeline orchestrator per ADR-0014
§1 verbatim — eight stages running deterministically against
substrate produced by Phase 6 (Ingestion) + Phases 2-5 (Document
Platform + Ledger + Spend). At Phase 7 close, the pipeline runs
end-to-end across three v1 document types (vendor_invoice +
receipt + payment_confirmation), producing structurally-correct
ProposedEntryCard / ProposedAttachmentCard / ProposedMutationBundle
outputs that route to the canvas surface via the existing
canvasDirective consumer.

The arc spanned **12 sessions across three cycles**:

- **Scope-lock cycle (Sessions 29-32):** Four founder-ratification
  rounds locking the 3-chunk decomposition + 8-stage scope per ADR-
  0014 §13 canonical + 6-item codification candidate inventory.
- **Chunk-brief-drafting cycle (Sessions 33-35):** Three chunk briefs
  (chunks 7.1 + 7.2 + 7.3) at commits `701dcd2` + `c7be3f8` +
  `56d886d`. Chunk 7.1 + chunk 7.3 both fired Path C SPLIT at
  brief-grade per multi-axis evaluation; chunk 7.2 stayed SINGLE-CHUNK.
- **Implementation cycle (Sessions 36-40):** Five chunk-impl
  sessions at commits enumerated above. ADR-0014 §12.1 amendment at
  chunk 7.1b (commit `4c481a9`) ships as the **only T3 amendment of
  Phase 7 implementation cycle** — Stage 2 ~30s wall-clock budget
  exception per Modal cold-start (vs the canonical ~3.5s budget for
  Stages 0+1+3-7). Chunk 7.2's ENUM extension is substrate-grade
  (Layer 1 CHECK broaden + Zod boundary widen), not T3. Chunks 7.3a
  + 7.3b ship without T3 amendment.

Phase 7 is a **low-T3-amendment cycle** vs Phase 5.1 + Phase 6.5
precedents — Phase 5.1 amended ADR-0018 §item 4 with T2_new_payment
dispatcher activation; Phase 6.5 amended ADR-0010 + F-J-14 with
three-grain Path C catalog consolidation. Phase 7's substrate-grade
broadenings (chunk 7.2 ENUM extension + chunk 7.3b ProposedMutation/
ProposedAttachment/ProposedMutationBundle Zod greenfield) land
without ADR amendment because they're additive at the substrate
grade per ADR-0010 reserved-enum-states discipline + ADR-0022
additive provenance-preserving discipline.

### §1.1 Per-chunk substrate enumeration

**Chunk 7.1a (Session 36 → commit `f0fdecc`):** Orchestrator
skeleton at `apps/web/src/agent/orchestrator/extraction/` (10 new
files + modifications; ~1210 LOC net). Stages 0+1 active
(dedup_by_hash via `dedupByHash.ts` + byte_fetch via
`byteFetch.ts`). Failure classification wrapper + retry-on-transient
discipline per ADR-0014 §12. Pipeline_trace JSONB emission per
ADR-0007 Q30 Logic Receipt reproducibility.

**Chunk 7.1b (Session 37 → commit `4c481a9`):** Modal sidecar
substrate at greenfield `sidecar-ocr/` Python repo + TS client at
`apps/web/src/agent/orchestrator/extraction/sidecar/`. Stage 2
(run_ocr) active via Modal Functions deployment per ADR-0014 §3.
**T3 amendment shipped: ADR-0014 §12.1** (Stage 2 wall-clock budget
exception per Modal cold-start; ~30s vs canonical ~3.5s). ~1591 LOC
net.

**Chunk 7.2 (Session 38 → commit `c401296`):** Stage 3 classifier
active per ADR-0014 §7 + agent_architecture_policy.md §2.1. Tier A
rule-based (vendor_invoice + receipt + payment_confirmation rules) +
Tier C Claude Sonnet AI fallback + Tier D 'unknown' fallback. 11
reserved org_settings columns at migration (5 ADR-0014 NOT NULL
DEFAULT + 6 ADR-0019 NULL-default) per Sub-Q27 lock.
ExceptionReasonSchema extension ('ai_fallback_validation_failed'
v1-active added). ~3010 LOC net (largest Phase 7 chunk by LOC; +37%
above forecast upper bound).

**Chunk 7.3a (Session 39 → commit `8499189`):** Stages 4-7 active
substrate. Per-document-type extractor modules
(vendorInvoiceExtractor + receiptExtractor +
paymentConfirmationExtractor) at flat-within-extraction/ per Sub-Q11.b.
Per-document-type Zod schemas at `shared/schemas/extraction/`.
vendorService.matchVendor extension per ADR-0014 §9 (6-strategy
cascade post-pg_trgm-absence + vendors.aliases-absence
substrate-finding). proposalBuilder.ts substrate at
`stages/proposalBuilder.ts` (ProposedEntryCard-only routes; Bundle +
ProposedAttachment routes deferred to chunk 7.3b per Iteration 2
Option γ). aiFallbackBudget.ts + aiFallbackExtractorBase.ts as Phase B
shared-module extractions. ~2625 LOC net.

**Chunk 7.3b (Session 40 → commit `ab0f7fe`):** ProposedMutation +
ProposedAttachment + ProposedMutationBundle Zod schemas greenfield
consolidation at `shared/schemas/accounting/` (Option γ inheritance
+ Option (c') Finding E permissive justification shape).
ProposedAttachmentCard Zod schema + UI renderer.
canvasDirective proposed_attachment_card RI-1 strict atomic
5-surface extension (Zod 27→28 + TS 39→40 + 3 consumer surfaces at
bridge/ContextualCanvas.tsx + shared/types/tabTitle.ts +
agent/prompts/suffixes/canvasContextSuffix.ts per Finding A path
verification). DocumentCard state machine extension (7-state
DocumentCaseStateSchema + state-driven render branches + state-
specific action affordances). Stage 7 commit composite at
ingestDocument.ts with synthCtxForCommit pattern + INV-DOC-001
primary_document_id propagation. 3-doc-type e2e tests at
`tests/integration/e2e/` gated on MODAL_OCR_HMAC_SECRET env-var
presence. ~1549 LOC net (within forecast band; first within-band
landing of Phase 7 chunk-impl arc).

### §1.2 ADR-0014 §12.1 amendment as only T3 amendment of Phase 7 impl cycle (Iteration 2 Gap 1 absorption)

The Modal cold-start ~30s wall-clock budget exception at Stage 2 is
the **only ADR amendment shipped during Phase 7 implementation cycle**.
Chunk 7.2's ExceptionReasonSchema extension is substrate-grade
(migration + Zod boundary broaden; Layer 1 + Layer 2 cohesion); the
ENUM is governed by ADR-0010 reserved-enum-states discipline which
explicitly admits additive substrate broadening without ADR amendment.
Chunks 7.3a + 7.3b ship 3 greenfield Zod schemas + RI-1 strict
atomic 5-surface extension without ADR amendment because both are
additive substrate-grade per ADR-0022 additive provenance-preserving
discipline.

Phase 7's low-T3-amendment posture distinguishes it from Phase 5.1
(T3: ADR-0018 §item 4 + Phase 5.1 second amendment for T2_new_payment
dispatcher) + Phase 6.5 (T3: ADR-0010 + F-J-14 three-grain catalog
consolidation). The empirical pattern: phases whose substrate is
predominantly additive (new tables, new schemas, new ENUM members
within existing reservation) ship low-T3-amendment; phases whose
substrate is contract-reshaping (new dispatch surfaces, new grain
catalogs) ship high-T3-amendment. Phase 7 is the first phase to
empirically demonstrate the low-T3-amendment posture at multi-
chunk-impl breadth (5 chunks; only 1 T3 amendment).

---

## §2 Process review

Phase 7 implementation cycle empirically validates three primary
phase-grade disciplines: directive-authoring multi-iteration
refinement, F-J-14 Grain 2/3 non-fire cross-validation, and anti-
drift prospective-firing at directive-grade Phase A verification.

### §2.1 Directive-authoring multi-iteration refinement N=12 cumulative cross-grade

Multi-iteration refinement (Iteration 1 → orchestrator-and-WSL review
→ Iteration 2 nudges → Iteration 3 absorbed) fired N=12 times across
Phase 7 at three directive grades:

- **Scope-lock-cycle-round grade (N=4):** Sessions 29-32 four
  founder-ratification rounds of Phase 7 scope-lock cycle close.
- **Chunk-brief-drafting grade (N=3):** Sessions 33-35 chunk briefs
  (chunks 7.1 + 7.2 + 7.3).
- **Chunk-impl directive grade (N=5):** Sessions 36-40 chunk-impl
  directives. Chunk 7.3b's Iteration 2 alone caught 5 substantive
  Phase A findings (Findings A-E) at directive grade before WSL
  dispatch.

Plus N=1 at Session 41 retrospective drafting directive grade
(this directive's own multi-iteration refinement cycle, with
Iteration 2 nudges + 3 substantive Gap absorptions + Iteration 3
ratification). Cumulative N=13 at retrospective close.

Codification graduation candidate at N=12 cross-grade strongly ripe;
ratified at Commit B `plan-authoring.md` new "Multi-iteration
refinement at directive/brief/plan authoring" section per
Candidate #1 routing.

### §2.2 F-J-14 Grain 2/3 non-fire at chunk-impl-grade N=5 cross-validation

Across the 5 Phase 7 chunk-impl sessions, Path C Grain 2 (Phase-A-
close prospective) and Grain 3 (mid-impl reactive) **did not fire**
despite varying forecast-vs-reality gaps. Each chunk delivered as
single-session-feasible implementation; no Phase-A-close substrate-
load overrun forced split; no mid-impl framing-revisit accumulation
crossed budget threshold.

Per-chunk forecast-vs-reality deltas:

| Chunk | Path C disposition | Forecast | Realized | Delta |
|---|---|---|---|---|
| 7.1a | Grain 1 SPLIT (chunk 7.1 → 7.1a + 7.1b) | 700-1100 | ~1210 | +10% |
| 7.1b | Grain 1 SPLIT companion | 750-1200 | ~1591 | +33% |
| 7.2 | Grain 1 SINGLE-CHUNK | 1500-2200 | ~3010 | +37% |
| 7.3a | Grain 1 SPLIT (chunk 7.3 → 7.3a + 7.3b) | 1100-1900 | ~2625 | +38% |
| 7.3b | Grain 1 SPLIT companion | 1200-1900 | ~1549 | within band |

The non-fire pattern is **positive evidence** validating F-J-14's
three-grain catalog "earlier-grain invocation preferred" guidance:
Grain 1 at brief-grade caught the structural scope-risk at chunks 7.1
+ 7.3 (SPLIT); chunk 7.2's SINGLE-CHUNK held despite +37% floor-bias
because its scope was structurally bounded (Stage 3 classifier +
org_settings substrate; no cross-phase framing interactions).

Chunk 7.3b's **within-band landing** is the critical observation:
breaks the +10-38% floor-bias trend at chunk-impl grade. Iteration 2
directive-grade Phase A verification absorbed scope deferrals at
directive grade itself (Option γ Bundle/Mutation/Attachment substrate
consolidation + Option (c') Finding E permissive justification),
bounding chunk 7.3b complexity before implementation began. This
surfaces a **Grain 0 candidate** (directive-grade Phase A
verification) at N=1 evidence; banked at F-J-14 fourth-instance
entry as forward-pointer for future-cycle-watch.

Codification graduation candidate ratified at Commit A F-J-14
fourth-instance entry (2026-05-20) per Candidate #2 routing.

### §2.3 Anti-drift prospective-firing N=49+ cumulative + directive-grade Phase A verification

Anti-drift prospective-firing at directive-authoring grade
accumulated N=49+ cumulative instances across multiple phases. Phase
7 operationally validates the discipline at chunk-impl directive
grade: each chunk-impl directive's Phase A reads + verification steps
caught substantive findings BEFORE WSL dispatch rather than at impl-
grade reactive.

(α) sub-grain (directive-grade-citation-against-substrate) NOT FIRED
at Phase 7 chunks 7.1b + 7.2 + 7.3a + 7.3b — N=4 non-fire evidence
that three-iteration refinement cycle + directive-grade Phase A
verification together preempt directive citation drift. Without the
discipline, citation drift would have surfaced as (β) reconciliations
at impl-grade.

Codification ratified at Commit B `scope-lock.md` Phase 7 evidence
accretion section per Candidate #3 routing.

---

## §3 Codifications shipped — 13-candidate routing

Per the Session 41 directive Iteration 3 §2 founder-ratified routing
table (13 candidates total; Iteration 2 Candidate #13 added for
push-terminal-close N=3). All routing dispositions confirmed at
Iteration 3 dispatch; this section documents the per-candidate
disposition with commit-hash references.

### §3.1 Strongly ripe codification graduations (6 candidates)

**Candidate #1 — Directive-authoring multi-iteration refinement
N=12 cross-grade.** Shipped at **Commit B** (`df64956`) `plan-
authoring.md` new "Multi-iteration refinement at directive/brief/
plan authoring" section. Cross-grade evidence: scope-lock-cycle-
round N=4 + chunk-brief-drafting N=3 + chunk-impl directive N=5 +
retrospective drafting N=1. Multi-iteration trades short-term
authoring latency for empirical reduction in mid-execution scope-
corrections.

**Candidate #2 — F-J-14 Grain 2/3 non-fire at chunk-impl-grade N=5
cross-validation.** Shipped at **Commit A** (`29d8277`) friction-
journal F-J-14 fourth-instance entry (2026-05-20). Documents Phase
7's chunk-impl-grade non-fire pattern as positive cross-validation
evidence of F-J-14's three-grain catalog "earlier-grain invocation
preferred" guidance. Surfaces Grain 0 candidate (directive-grade
Phase A verification) at N=1 evidence for future-cycle-watch.

**Candidate #3 — Anti-drift prospective-firing N=49+ + directive-
grade Phase A verification discipline operationally validated.**
Shipped at **Commit B** (`df64956`) `scope-lock.md` Phase 7
evidence accretion section "Directive-grade Phase A verification
discipline operationally validated." Paired with Candidates #4 +
#5 at substrate-citation-verification family convention surface.

**Candidate #4 — (ι) sub-grain "directive partial-information value
pick incompatible with substrate state" N=3 cross-instance + N=4
within-Session-40.** Shipped at **Commit B** (`df64956`)
`scope-lock.md` Phase 7 evidence accretion section. Paired with
Candidate #5 at "pair-but-distinguished" convention text: (ι) fires
at directive grade between brief-author and chunk-impl; (μ) fires
at brief grade between substrate and brief-author.

**Candidate #5 — (μ) sub-grain "brief-cited substrate path/column/
extension doesn't exist at substrate" N=6 conservative / N=8
expansive per counting methodology.** Shipped at **Commit B**
(`df64956`) `scope-lock.md` Phase 7 evidence accretion section.
**Counting methodology callout** documents both conservative N=6
(treating multi-sub-surface divergences as single firings) and
expansive N=8 (treating 5-surface RI-1 path divergence at 3-of-5
surfaces as 3 separate firings) per Iteration 2 §A nudge. Both well
above N=3 codification threshold; methodology choice matters at
future-cycle observation-grain banking grade.

**Candidate #6 — Forecast-vs-reality at chunk-impl grade N=5 banking
— per-disposition-shape multiplier table.** Shipped at **Commit B**
(`df64956`) `plan-authoring.md` new "Per-disposition-shape multiplier
table at chunk-impl grade (Phase 7 extension)" section. Extends Phase
5.1 four-curve calibration substrate. N=5 chunk-impl evidence with
critical mechanism: directive-grade Phase A verification absorbing
scope deferrals → within-band landing at chunk 7.3b (vs +10-38%
floor-bias at chunks 7.1a/7.1b/7.2/7.3a without such absorption).

### §3.2 Ripe codification candidates (7 candidates — Candidate #13 added at Iteration 2)

**Candidate #7 — (β) brief task-naming vs ADR canonical stage_name
canonicalization N=8 cumulative.** Shipped at **Commit B** (`df64956`)
`plan-authoring.md` new "Brief task-naming vs ADR canonical
stage_name canonicalization" section. Reconcile at impl-time inline
comments; trace_record emissions use ADR canonical names; brief
task names stay as chunk-scope readability anchors.

**Candidate #8 — (ε) test-location convention reaffirmation N=5
cumulative.** Shipped at **Commit B** (`df64956`) `testing.md` new
"Test-location canonical path discipline (N=5 reaffirmation)"
section. Canonical: `apps/web/tests/integration/`. E2E tests under
`integration/e2e/` (chunk 7.3b first-instance precedent).

**Candidate #9 — (κ) Phase B scope addition pattern N=3 cumulative.**
Shipped at **Commit B** (`df64956`) `plan-authoring.md` new "Phase B
scope addition pattern at chunk-impl grade" section. Phase 7
evidence: chunk 7.2 ON INSERT trigger + chunk 7.3a aiFallbackBudget.ts
+ chunk 7.3a aiFallbackExtractorBase.ts.

**Candidate #10 — (γ) orphan-tolerance composite-write grain N=2
cross-chunk.** Below N=3 codification threshold per Phase 6.5
Candidate #4 routing precedent; banked at **Commit C** retrospective
§4 T1-narrative below. Friction-journal banking entry at
2026-05-20 (this commit). Promotion to convention surface if N=3
recurs at Phase 8+.

**Candidate #11 — (ξ) consumer-side synthetic ServiceContext for
system_actor orchestrator invocations N=2 cross-chunk + post-v1 ADR
amendment forward-pointer.** Shipped at **Commit B** (`df64956`)
`service-layer.md` new "Consumer-side synthetic ServiceContext for
system_actor orchestrator invocations" section. **Substrate-shim
framing**: 5-field synthetic ServiceContext is interim discipline,
not permanent contract. Phase 8 post-v1 ADR amendment forward-pointer
for `withInvariants` widening to structural union (`ServiceContext |
SystemActorServiceContext`) parallel to chunk 6.3a `recordMutation`
widening pattern. Codification at N=2 defensible per Iteration 2 §A
Candidate #11 founder-ratification — contract shape is precise +
reusable + paired with retrospective inventory item #5 forward-
pointer.

**Candidate #12 — (λ) TS-only IngestDocumentOutput.status union
extension cross-chunk deferral mechanism N=1 + Finding E "formal-
substrate-codification-deferral-at-chunk-impl-grade" sub-pattern N=1
(paired observation per Iteration 2 Gap 2).** Below N=3 codification
threshold per Phase 6.5 Candidate #12 routing precedent; banked at
**Commit C** retrospective §4 T1 exemplar narrative below + friction-
journal banking entry. **Paired observation** per Iteration 2 Gap 2:
retrospective inventory item #2 (Logic Receipt bundle-level event
composition + ProposalJustificationSchema codification) is the
**deferred substrate**; Candidate #12 is the **deferral discipline**
itself. Two halves of one observation.

**Candidate #13 — Push-terminal-close pattern N=3 cross-phase
(Phase 5.1 + Phase 6.5 + Phase 7).** Shipped at **Commit B**
(`df64956`) `CLAUDE.md` Push-readiness three-condition gate
extension. Names the canonical "WHEN" timing for the existing three-
condition gate (not a fourth condition). Phase retrospective close
fires the gate; intermediate phase-work commits stay local on the
working branch until retrospective close.

---

## §4 T1-narrative observations (below N=3 codification threshold)

Per Phase 6.5 + Phase 5.1 below-N=3-threshold routing precedent,
N=1 first-instance + N=2 cross-chunk evidence banks as T1-narrative
exemplar in this retrospective + friction-journal banking entry.
Promotion to convention surface candidate if N=3 recurs at Phase 8+.

### §4.A Candidate #10 — (γ) orphan-tolerance composite-write grain N=2 cross-chunk

**Pattern.** Composite writes (sequential INSERTs across related
tables, where partial completion is operationally acceptable)
exhibit orphan-tolerance discipline: if step N succeeds and step
N+1 fails, the step-N row's commit stands without rollback;
operational reconciliation handles the partial state. Distinct from
strict-atomicity composite-writes (where partial completion is
unacceptable; rollback required).

**N=2 cross-chunk evidence:**

- **Chunk 7.1b document_artifacts INSERT chain (commit
  `4c481a9`):** Modal sidecar callback writes a chain of document
  artifact rows (pages + lines + words + quality_flags) sequentially.
  Partial completion is tolerated; the per-row commit stands without
  upstream rollback.
- **Chunk 7.3b Stage 7 Bundle execution (commit `ab0f7fe`):** Born-
  paid bundle execution invokes withInvariants(billService.post)
  followed by withInvariants(paymentService.record) sequentially. If
  first child commits + second child fails, the bill commit stands;
  the failure routes to exception queue with manual_route +
  reconciliation_context (per Iteration 2 Note 2 default disposition
  — `bundle_partial_commit_reconciliation_pending` reserved value
  ABSENT from ExceptionReasonSchema per Phase A verification; (μ)
  sub-grain N=5 banking).

**Promotion trigger.** N=3 cross-chunk evidence at Phase 8+ graduates
to convention surface. Likely third-instance candidate: future
multi-step orchestrator-driven workflows (Tier 2.5+ pipelines;
reconciliation orchestrators) that adopt sequential best-effort
semantics.

### §4.B Candidate #12 — (λ) + Finding E paired observation N=1 (Iteration 2 Gap 2)

**Pattern (paired-observation framing).** Two halves of one
observation: the deferred substrate (retrospective inventory item
#2) and the deferral discipline itself (Candidate #12).

**Half 1 — Deferred substrate (retrospective inventory item #2):**
Logic Receipt bundle-level INV-AGENT-002 event composition +
ProposalJustificationSchema formal codification. ADR-0007 Q30
specifies Logic Receipt content shape (rule_id + input_features +
historical_match_count + confidence_score + source_transactions +
user_utterance + pipeline_trace); Phase 7 chunk 7.3b ships
ProposedMutation/ProposedAttachment/ProposedMutationBundle with
`justification: z.record(z.unknown()).optional()` permissive shape
per Iteration 2 Option (c') Finding E absorption. Formal codification
deferred to Phase 8 / post-v1 Logic Receipt consumer.

**Half 2 — Deferral discipline (Candidate #12) — (λ) TS-only union
extension cross-chunk deferral mechanism N=1 first-instance:**
IngestDocumentOutput.status union member
'deferred_chunk_7_3b_pending_activation' preserved with JSDoc
`@deprecated` annotation per Iteration 2 Note 4 + ADR-0022 additive
provenance-preserving discipline. Activation at chunk 7.3b made the
status defined-but-not-emitted; the union member stays for
TypeScript exhaustiveness defensive coverage while marking the
post-activation state via `@deprecated`.

**Paired-observation framing rationale.** The deferred substrate
(half 1) is THE THING THAT GETS DEFERRED; the deferral discipline
(half 2) is THE MECHANISM BY WHICH THE DEFERRAL HAPPENS. They are
two halves of one observation per Iteration 2 Gap 2 absorption.
Both at N=1 first-instance; both below N=3 codification threshold;
both bank as T1-narrative exemplars; both promote to convention
surface candidates if recurrence at Phase 8+ surfaces additional
"formal-substrate-codification-deferral-at-chunk-impl-grade"
instances OR additional "TS-only union extension cross-chunk
deferral mechanism" instances.

**Promotion trigger.** N=3 recurrence at Phase 8+ across either
half. Phase 8's Logic Receipt consumer codification fires
half 1's promotion; Phase 8+ chunks that adopt TS-only union
extension as a cross-chunk deferral mechanism fire half 2's
promotion.

---

## §5 Codifications NOT shipped — 6-item retrospective inventory (Iteration 2 Gap 3 absorption)

Per Iteration 2 Gap 3 absorption: 6-item retrospective inventory
distinguishes **substrate-grade deferrals (items #1-#5)** from the
**demo gate (item #6)**.

### §5.1 Substrate-grade deferrals (Phase 8 / post-v1 forward-pointers)

**Item #1 — `bundle_partial_commit_reconciliation_pending` ENUM
extension + audit metadata writer.** Reserved value brief-cited but
absent from ExceptionReasonSchema per Phase A verification ((μ)
sub-grain finding); current substrate uses 'manual_route' +
reconciliation_context audit metadata per Iteration 2 Note 2
default disposition. Phase 8+ codification: ENUM ADD VALUE
migration + Zod schema broaden + audit metadata writer at Stage 7
Bundle partial-commit reconciliation path. Activation trigger:
operational partial-commit reconciliation surface materializes (v1
substrate covers via interim manual_route routing; formal codification
fires at first cross-tenant partial-commit observation OR Phase 8+
audit-substrate cycle).

**Item #2 — Logic Receipt bundle-level INV-AGENT-002 event
composition + ProposalJustificationSchema formal codification.**
Paired with §4.B Candidate #12 deferral discipline per Iteration 2
Gap 2. ADR-0007 Q30 specifies the Logic Receipt content shape; Phase
7 chunk 7.3b ships permissive `justification: z.record(z.unknown()).
optional()` per Iteration 2 Option (c') Finding E. Phase 8+
codification: formal ProposalJustificationSchema + bundle-level
INV-AGENT-002 audit event composition at Stage 7 commit composite +
nested per-child traces. Activation trigger: Phase 8+ Logic Receipt
consumer ships (post-v1 audit-reproducibility consumer; ADR-0007 Q30
canonical).

**Item #3 — `payment.record` ActionName addition + role_permissions
migration.** Current substrate uses `bill.record_payment` ActionName
per ACTION_NAMES enum + role_permissions seeding ((μ) sub-grain
finding); paymentService.record() is greenfield-with-no-v1-callers
per Sub-Q2 2.β. Phase 8+ codification: formal `payment.record`
ActionName + role_permissions migration + canUserPerformAction parity
test (CA-27 enforced parity). Activation trigger: paymentService.record()
gains v1 consumers (post-v1 reconciliation orchestrator OR cross-
service consumer chunk).

**Item #4 — React DOM test env (jsdom + @testing-library/react) for
UI component tests.** Vitest config has no React DOM environment;
chunk 6.2b + chunk 7.3b ProposedAttachmentCard + DocumentCard state
machine + PendingDocumentsView UI component tests structurally
verified via typecheck but not via component test runs. Phase 8+
codification: vitest jsdom config + @testing-library/react infra +
per-component test fixtures. Activation trigger: Phase 8+ UI test
infrastructure cycle OR cross-component test coverage gap surfaces
operationally.

**Item #5 — Post-v1 ADR amendment for system_actor widening at
withInvariants.** Paired with §3.2 Candidate #11 substrate-shim
framing. Phase 7 codifies the consumer-side synthetic ServiceContext
discipline as **interim** substrate-shim; the canonical resolution
is widening `withInvariants`'s accepted ctx shape to a structural
union (`ServiceContext | SystemActorServiceContext`) parallel to
chunk 6.3a `recordMutation` widening pattern. Phase 8+ codification:
ADR-0007 §Tier 2 safety contract amendment OR ADR-0011 §1 service-
layer contract amendment codifying the widening. Activation trigger:
N=3 cross-chunk evidence at orchestrator-driven service invocations
(Phase 7 N=2 + first Phase 8 orchestrator-driven invocation graduates
to N=3).

### §5.2 Demo gate (NOT substrate-grade deferral)

**Item #6 — Modal sidecar deployment as Phase 7 demo gate
(Iteration 2 Gap 3 distinction).** Chunk 7.1b shipped the Modal
sidecar Python service substrate at greenfield `sidecar-ocr/` repo
+ TS client at `apps/web/src/agent/orchestrator/extraction/sidecar/`;
deployment requires founder action (`bash sidecar-ocr/deploy.sh` +
`modal secret create` + `.env.local` MODAL_OCR_HMAC_SECRET +
MODAL_OCR_SIDECAR_URL population). The deployment is a **demo gate**,
NOT a substrate-grade deferral — substrate is shipped; deployment is
the demo-execution prerequisite.

**Gap 3 distinction rationale.** Substrate-grade deferrals (items
#1-#5) are codification surfaces that ship at future arcs with new
substrate (migrations, schemas, ADR amendments). Demo gates are
deployment-execution surfaces that ship operationally outside the
codification cycle (founder action; not a Phase 8+ codification
fire). Conflating the two at retrospective close would obscure the
substrate-vs-deployment distinction. The 6-item enumeration with
explicit Gap 3 framing keeps the distinction clear.

**Demo execution timing.** Per Iteration 2 §F nudge ratified at
Iteration 3: v1 close demo **DEFERRED to Session 42** dedicated
demo session. Session 41 (this session) closes at Commit C +
terminal-close push; Session 42 fires the dedicated v1 close demo
across 3 document types per chunk 7.3 brief §6 close gate 19. If
Modal credentials are present at Session 41 onset, Session 42
fires the demo immediately; otherwise founder action fires in
parallel (independent surface; no coordination cost).

---

## §6 Carry-forwards

Phase 7 close hands off to Phase 8+ with the following carry-forwards:

### §6.1 Phase 8+ scope items

**Post-v1 ADR amendments (3):** item #1 ENUM extension at ADR-0010
admit + ADR-0011 §13 enumeration broaden; item #2 Logic Receipt
codification at ADR-0007 Q30 canonical; item #5 system_actor widening
at withInvariants per ADR-0007 §Tier 2 safety contract OR ADR-0011
§1 service-layer contract.

**Substrate-grade deferrals (5):** items #1-#5 per §5.1.

**Demo gate (1):** item #6 Modal sidecar deployment for v1 close
demo per §5.2.

### §6.2 Phase 8 readiness state

**Phase 8 canonical next phase per ADR-0011 §1 phase sequencing:**
post-v1 reconciliation + cross-service orchestrators + ledger
extensions. Phase 7 substrate (Tier 2 document pipeline orchestrator)
is operationally complete at substrate grade; v1 close demo gate
satisfaction (Session 42) verifies the v1-walkable demo per chunk
7.3 brief §6 close gate 19.

**Phase 8 substrate-anchoring ADRs:** ADR-0014 (Tier 2 substrate;
Phase 7 active) + ADR-0018 (Relationship Router; Phase 4 + Phase 5.1
amendments) + ADR-0007 (safety contract; pending Phase 8 system_actor
widening amendment per §5.1 item #5) + ADR-0012 (Bundle composition;
Phase 7 chunk 7.3b active) + future ADR-NNNN post-v1 reconciliation
orchestrator (Phase 8 first-instance precedent likely).

### §6.3 Banking-cycle observations (T1-narrative; no codification venue)

**(α) directive-grade citation against substrate** NOT FIRED at
Phase 7 chunks 7.1b + 7.2 + 7.3a + 7.3b — N=4 non-fire evidence
that three-iteration refinement cycle + directive-grade Phase A
verification together preempt directive citation drift.

**(δ) Shared per-document AI fallback budget counter** (Session 39
carry-forward; chunk 7.3b inherits unchanged).

**(ζ) Stage 4 + Stage 7 Tier C AI fallback wrap-vs-defer discipline**
N=2 banking (chunk 7.3b commit composite does NOT invoke AI; no N=3
evidence at chunk 7.3b).

**(η-candidate) mock harness location variation continuation**
inactive at chunks 7.3a + 7.3b.

**(θ-candidate) multi-axis Path C probability evaluation** N=3
independent-firing evidence (chunks 7.1 + 7.2 + 7.3 directive
grades). N=4 banking at retrospective drafting grade (this directive
itself fires multi-axis Path C probability evaluation in its
§1.3-equivalent). Codification graduation candidate strengthens at
N=4.

**(ν) unknown short-circuit pattern at Stage 3 close** N=1 first-
instance (Session 39).

---

## §7 Surface-precedence note (T3>T4>T1)

13 codification surfaces ship from this retrospective drafting work
across three artifact tiers per Phase 6.5 + Phase 5.1 surface-
precedence convention inheritance:

**Tier 3 (T3) — ADR + friction-journal canonical record:**
- F-J-14 fourth-instance entry (2026-05-20) per Candidate #2
  routing — chunk-impl-grade Grain 2/3 non-fire N=5 cross-validation
  pattern characterization (Commit A `29d8277`).

No ADR amendments at Phase 7 retrospective close (low-T3-amendment
cycle posture per §1.2). Phase 8 carries 3 forward-pointed ADR
amendments per §6.1.

**Tier 4 (T4) — CLAUDE.md + topical-conventions canonical record:**
- CLAUDE.md Push-readiness section extension per Candidate #13
  (push-terminal-close N=3 timing paragraph).
- `plan-authoring.md` 4 new sections per Candidates #1 + #6 + #7 +
  #9 (multi-iteration refinement N=12; per-disposition-shape
  multiplier table; brief task-naming vs ADR canonical N=8; Phase B
  scope addition pattern N=3).
- `scope-lock.md` Phase 7 evidence accretion section per Candidates
  #3 + #4 + #5 (directive-grade Phase A verification discipline;
  (ι) sub-grain N=3; (μ) sub-grain N=6-N=8 with counting methodology
  callout).
- `service-layer.md` new section per Candidate #11 (consumer-side
  synthetic ServiceContext substrate-shim; Phase 8 post-v1 ADR
  amendment forward-pointer).
- `testing.md` new section per Candidate #8 (test-location canonical
  path N=5 reaffirmation).

All shipped at Commit B (`df64956`).

**Tier 1 (T1) — Retrospective + friction-journal exemplar narrative:**
- §4.A (γ) orphan-tolerance composite-write grain N=2 cross-chunk
  per Candidate #10 below-N=3-threshold routing.
- §4.B (λ) + Finding E paired observation N=1 per Candidate #12
  below-N=3-threshold routing (Iteration 2 Gap 2 absorption).
- This retrospective writeup at §1-§7 + friction-journal banking
  entries (Commit C `<<<commit-hash>>>`).

**Surface-precedence ordering.** When a future reader needs the
canonical statement of any Phase 7 codification, the surface-
precedence ordering is **T3 > T4 > T1**. T3 (ADR + friction-journal)
holds canonical contract; T4 (CLAUDE.md + topical conventions)
holds active operational rule; T1 (retrospective + friction-journal
narrative) holds provenance + exemplar evidence. Disagreements
resolve in T3 > T4 > T1 order — T3 wins over T4 wins over T1.

Inheritance from Phase 6.5 + Phase 5.1 retrospective precedents.

---

*Phase 7 implementation cycle TERMINAL at Session 40 chunk 7.3b
impl commit `ab0f7fe`. Phase 7 retrospective drafting cycle TERMINAL
at Session 41 Commit C. v1 close demo across 3 document types
DEFERRED to Session 42 dedicated demo session per Iteration 2 §F
nudge. Phase 8+ readiness state per §6.2. Co-Authored-By: Claude
Opus 4.7 (1M context).*
