# Phase 8 scope-input — post-v1 reconciliation + cross-service orchestrators + ledger extensions

**Date:** 2026-05-21
**Session:** 43 (Phase 8 first session)
**Status:** scope-input artifact at brainstorming-side onset grade
**Predecessor:** Phase 7 close trilogy (Session 40 chunk 7.3b impl `ab0f7fe` + Session 41 retrospective Commits A `29d8277` + B `df64956` + C `97f86ed` + Session 42 substrate close `96eae39`)
**Cycle posture:** substantively-new-phase cycle (analogous to Phase 7 Sessions 27-32 scope-input → scope-lock cycle Round 1-4 → cycle-close shape)

---

## §1 Executive summary

Phase 8 scope-input artifact framing. Walks Phase 8 scope-input
authoring per v3-proposal-style §-structure inheritance + Phase 7
scope-input §-structure template inheritance (with Phase 8-specific
extensions for accumulated multi-layer inheritance substrate).

**Phase 8 posture.** Substantively-new-phase cycle per ADR-0011 §1
spine sequencing. Phase 7 substrate (Tier 2 document pipeline
orchestrator) closed at HALT-grade per Session 42 close report —
substrate operationally complete at chunk 7.3b commit `ab0f7fe` +
sidecar-ocr deploy scaffolding shipped at chunk 7.1b; v1 close gate
19 satisfied at 1-of-3 partial demo evidence (payment_confirmation
success at warm OCR 16.5s; vendor_invoice + receipt exceeded 10s
per-request timeout per Session 42 §2.2 ratified-design-vs-
production-reality calibration gap N=11). Phase 8 absorbs three
structurally distinct work surfaces:

1. **v1 close demo completion** — Session 42 items #7+#8+#9
   (sidecar deployment validation harness + ADR-0014 §12.1 second
   amendment + demo re-fire at 3-of-3 success grade). Phase 8 first
   chunk candidate per Phase 5.1 sub-curve (b) substrate-fix-
   narrowness calibration.
2. **Post-v1 ADR amendments + cross-service orchestrators** per
   Phase 7 retrospective §6.1 + §6.2 forward-pointers (post-v1
   reconciliation orchestrator at Stage 7 Bundle partial-commit
   reconciliation path; paymentService.record() v1 consumers;
   Logic Receipt bundle-level INV-AGENT-002 audit event composition;
   system_actor widening at withInvariants).
3. **Ledger extensions** per ADR-0018 Subsystem 1 (Ledger-State
   Candidate Completion) activation surface — extended ledger
   semantics (new entity types, new relationship patterns, new
   score features) at lines 276-505.

**Phase 8 inheritance composition (3 layers).** Phase 8 inherits the
most comprehensive accumulated inheritance substrate of any phase
to date:

- **Layer 1 (substrate-grade):** 8 items per Session 42 close report
  §6.1-§6.2 (substrate-grade deferrals items #1-#8) + 1 demo gate
  item per §6.3 (item #9 founder-action Phase 8 onset). Layer 1.B
  enumerates the demo gate distinctly from Layer 1 substrate-grade
  per Session 41 §5.2 Gap 3 substrate-vs-deployment framing.
- **Layer 2 (ADR amendments):** 4 items per Phase 7 retrospective
  §6.1 (items #A + #B + #C) + Session 42 close report item #8
  (item #D ADR-0014 §12.1 second amendment).
- **Layer 3 (codification candidates):** 15 items at convention-
  grade candidate surface = 7 substantive findings per Session 42
  §5.2 + 5 future-cycle-watch sub-patterns per Phase 7 retrospective
  §6.3 + 3 Session 42 substrate close banking surfaces.

**Preliminary scope framings (8).** Per §6 enumeration: v1 close
demo completion sub-chunk + post-v1 reconciliation orchestrator +
cross-service orchestrators + ledger extensions + Logic Receipt
consumer + UI test infrastructure cycle + system_actor widening +
sidecar deployment validation harness. Per-framing entry shape:
substrate description + Phase 7/8 inheritance reference + estimated
scope grade (sub-chunk vs chunk vs multi-chunk). **Path C invocation
probability NOT pre-assigned per framing** — deferred to Phase 8
scope-lock cycle adjudication per multi-axis Path C probability
evaluation discipline (sub-question-anchored; sub-question specificity
required for Path C evaluation per Phase 7 N=4 banking).

**Sub-question catalog (preliminary at brainstorming-side onset
grain).** Per §7 enumeration: ~15-25 sub-questions in 4 subsections
(§7.1 Layer 1 substrate-grade items adjudication + §7.2 Layer 2 ADR
amendment adjudication + §7.3 §6 scope framings adjudication + §7.4
cross-cutting concerns). Phase 8 scope-lock cycle Round 1 walks the
catalog + surfaces any net-new sub-questions from Phase A reads
(analogous to Phase 7 §4 25-sub-question pre-enumeration loading
into Phase 7 scope-lock Round 1 walking all 25 + adding 1 new from
VFD-6 findings).

**§-structure inheritance.** Phase 7 scope-input artifact at
`docs/09_briefs/phase-7/2026-05-19-phase-7-extraction-scope-input.md`
(599 LOC; Session 27 commit `8ae3886`) is the canonical inheritance
template. Phase 8 extends with Layer 1/2/3 inheritance inventory
sections (§3, §4, §5) absorbing accumulated multi-phase substrate;
Phase 7's §3 (locked-at-onset cuts) and §6 (VFD targets) are not
directly mirrored — Phase 8's Layer-grade inheritance inventories
serve the analogous load-bearing role for scope-lock cycle Round 1
readiness. No Phase 6.5 scope-input artifact exists (Phase 6.5
shipped as amendment cycle, not substantively-new-phase cycle); the
single substantively-new-phase scope-input precedent is Phase 7.

**Forecast.** ~1100-1800 LOC at scope-input artifact grade. Phase 7
599 LOC anchor doesn't apply directly because Phase 8 §-structure is
materially heavier per accumulated 3-layer inheritance enumeration
(8 substrate-grade items + 4 ADR amendments + 15 codification
candidates + 8 preliminary scope framings + 15-25 sub-question
catalog) vs Phase 7's lighter single-table substrate inheritance
shape. Forecast recalibration explicit per Iteration 2 founder
observation #3.

---

## §1.2 Session-onset divergence absorption

Three divergences surfaced at Phase A verify-from-disk grade
(prospective anti-drift discipline application per Phase 7 N=49+
accumulated firings; codification graduated at Commit B `df64956`
scope-lock.md Candidate #3 routing).

### §1.2 (α) Inheritance composition framing — 8-vs-9 distinction

**Source:** Session 43 directive Iteration 2 §Inheritance vs
Session 42 close report §6 actual structure.

**Divergence:** Iteration 2 directive framed Phase 8 substrate-grade
inheritance as "9 items from Session 42 close report (6 inherited
from Session 41 + 3 NEW at Session 42; item #6 satisfied at Session
42 1-of-3 partial demo; 8 items carry forward)." Direct read of
Session 42 close report (lines 241-262) shows the actual structure:

- §6 header: "Phase 8 inheritance inventory (extended to 8 items)"
  — explicit framing at line 241.
- §6.1 substrate-grade deferrals (items #1-#7; 7 items): 5 from
  Session 41 §5.1 (items #1-#5 substrate-grade) + 1 promoted from
  Session 41 Iteration 2 §B carry-forward (item #6 e2e assertion
  authoring) + 1 NEW Session 42 (item #7 sidecar deployment
  validation harness).
- §6.2 substrate-grade deferral (item #8): NEW Session 42 ADR-0014
  §12.1 second amendment + client.ts calibration.
- §6.3 demo gate (item #9): NEW Session 42 demo re-fire at 3-of-3
  success grade; founder action; Phase 8 onset.

**Resolution.** Layer 1 substrate-grade inheritance = 8 items
(items #1-#8 from §6.1-§6.2). Layer 1.B demo gate = 1 item (item
#9 from §6.3). The "8 items carry forward" count in the directive
was correct; the framing was confused by conflation of (a) Session
41 item #6 (Modal sidecar demo gate; satisfied at Session 42 →
removed from inventory) with (b) Session 42 item #6 (e2e assertion
authoring; promoted from Session 41 Iteration 2 §B → carry-forward).
Different items, different fates.

**Phase 8 scope-input absorption.** §3 Layer 1 enumerates 8
substrate-grade items; §3.B enumerates 1 demo gate item with
founder-action framing. Total Layer 1 inheritance = 8 + 1 = 9 items
at inheritance-inventory grade; 8 substrate-grade at codification-
surface grade.

### §1.2 (β) ADR-0011 §1 phase sequencing language

**Source:** Phase 7 retrospective §6.2 + Session 42 close report
§6.2 vs direct read of ADR-0011 §1 (lines 116-117).

**Divergence:** Phase 7 retrospective §6.2 (and inherited Session
42 §6.2) cite Phase 8 canonical scope as "post-v1 reconciliation +
cross-service orchestrators + ledger extensions" attributed to
"ADR-0011 §1 phase sequencing." Direct read of ADR-0011 §1 lines
116-117 shows the actual language is: "The Decision is presented
as a sequence of spine items, each of which is the contract that
one or more downstream ADRs cite." The "post-v1 reconciliation +
cross-service orchestrators + ledger extensions" phrasing is a
Phase 7-retrospective-side synthesis or paraphrase of the spine-
items structure, not a direct ADR-0011 §1 quote.

**Resolution.** Phase 8 scope-input retains the "post-v1
reconciliation + cross-service orchestrators + ledger extensions"
framing as a working synthesis (inherited from Phase 7 retrospective
+ Session 42 close report) while explicitly noting at §2.3 ADR
substrate inheritance that this synthesis is paraphrase-grade, not
direct quote. Phase 8 scope-lock cycle Round 1 should adjudicate
whether to (a) ratify the synthesis at Phase 8 scope-lock close as
canonical Phase 8 scope language; (b) re-derive Phase 8 scope
directly from ADR-0011 §1 spine-items enumeration; or (c) propose
ADR-0011 §1 amendment codifying explicit phase-sequencing language
(post-v1 grade).

### §1.2 (γ) Cross-ADR-cited-substrate divergences

**Source:** Subagent verify-from-disk on ADR-0011 §13 + ADR-0014
§7 + ADR-0018 Subsystem 1.

**Divergence (γ-1).** Phase 7 retrospective §6.1 item #A maps
`bundle_partial_commit_reconciliation_pending` ENUM extension to
"ADR-0011 §13 enumeration broaden." Direct ADR-0011 §13 read shows
the section enumerates `resolution_action` enum (9 active / 18
reserved per lines 751-790). The `bundle_partial_commit_
reconciliation_pending` value is contextually an `exception_reason`
enum member (per "Stage 7 Bundle partial-commit reconciliation
path" framing in Session 41 §5.1 item #1). The actual ENUM target
may be `exception_reason` (potentially enumerated at a different
ADR-0011 § or ADR-0010 § location). Phase 8 scope-lock cycle Round
1 should verify ENUM target via direct ADR-0011 + database schema
read.

**Divergence (γ-2).** Phase 7 retrospective §6.3 (θ-candidate)
context cites "ADR-0014 §7 Reserved Tier B" as a ledger-extensions
activation reference. Direct ADR-0014 §7 read (lines 600-609) shows
Tier B is the Reserved Tier B classifier (post-v1 classifier
substrate), not a ledger-extension. The actual Phase 8 ledger-
extensions activation surface is ADR-0018 Subsystem 1 (Ledger-State
Candidate Completion) at lines 276-505.

**Resolution.** §4 Layer 2 item #A ADR amendment location noted
with ENUM-target uncertainty caveat (γ-1). §6 framing #4 ledger
extensions anchors at ADR-0018 Subsystem 1 lines 276-505 (γ-2 fix
applied). §11 cross-references corrects ADR-0014 §7 reference to
ADR-0018 §Subsystem 1.

---

## §2 What verify-from-disk reveals

### §2.1 Substrate inheritance — per-phase consumer count

Phase 8 inherits the full Phase 0 through Phase 7 substrate spine.
Per-phase substrate inheritance count (analogous to Phase 7 scope-
input §2.1 single-table substrate inheritance shape):

| Source phase | Substrate sites | Phase 8 consumer relevance |
|---|---|---|
| Phase 0 (governance + ledger truth model) | 20 invariants + ADR substrate at `docs/02_specs/ledger_truth_model.md` + `docs/07_governance/adr/` | All Phase 8 work cites Phase 0 governance |
| Phase 1 + 1.5 (ledger core + AP) | journalEntryService, accountLedgerService, billService, paymentService.record (greenfield) | §6 framing #3 cross-service orchestrators activates paymentService.record() v1 consumers |
| Phase 2 (document spine + link table + exception queue) | source_documents, source_document_links, document_cases, document_exception_queue, documentRouterService, documentLinkService, documentExceptionService | §6 framing #2 post-v1 reconciliation orchestrator absorbs Stage 7 Bundle partial-commit reconciliation path |
| Phase 4 (router subsystems 1-3) | documentRouterService.completeCandidate/resolveCandidates/runPerCaseReEvaluation, T1-T10 dispatcher fan-out, EXCEPTION_ALREADY_CANCELLED ServiceErrorCode | §6 framing #4 ledger extensions activates ADR-0018 Subsystem 1 candidate scoring extension |
| Phase 5 + 5.1 (AP foundation + payment + vendor credits reserved-seats) | paymentService, vendorPrepaymentService, billService composition, dispatchTrigger T1/T3/T5/T8/T10 v1-active-emission-wired | Phase 8 inherits 5+1 split (external-wrap billService.post/recordPayment/reverse + vendorPrepaymentService.record + documentExceptionService.resolveException; internal-wrap periodService.unlock) |
| Phase 6 + 6.5 (ingestion + UI shell) | ingest_batches, document_jobs, source_documents.ingest_batch_id, document_cards_view, DocumentIntakeRail, SplitScreenLayout, PendingDocumentsView, canvasDirective 39-member discriminated union | §6 framing #6 UI test infrastructure cycle absorbs DocumentCard state machine + ProposedAttachmentCard + PendingDocumentsView test coverage |
| Phase 7 (Tier 2 extraction pipeline) | ingestDocument orchestrator (8-stage), Tier A classifier, Tier C extractor, AI fallback budget, ProposedMutation/ProposedAttachment/ProposedMutationBundle, canvasDirective proposed_attachment_card 5-surface, DocumentCard state machine (7-state), Stage 7 commit composite, sidecar-ocr deploy substrate | §6 framing #1 v1 close demo completion absorbs sidecar deployment refresh + ADR-0014 §12.1 second amendment + client.ts calibration |

Total inherited substrate sites: ~50+ across services, schemas,
migrations, and UI consumers. Phase 8 net-new surface is bounded by
the §6 8-framing enumeration (predominantly extension of inherited
substrate, with discrete net-new surfaces at: post-v1 reconciliation
orchestrator + Logic Receipt consumer + ledger extensions activation
+ sidecar deployment validation harness).

### §2.2 Phase 7 close trilogy substrate references

The Phase 7 close trilogy is the direct inheritance source for
Phase 8 scope-input:

- **Session 40 chunk 7.3b impl at commit `ab0f7fe`:** ProposedMutation
  + ProposedAttachment + ProposedMutationBundle greenfield consolidation
  at `shared/schemas/accounting/`; canvasDirective proposed_attachment_
  card 5-surface RI-1 strict atomic extension (Zod 27→28 + TS 39→40
  + 3 consumer surfaces); DocumentCard state machine (7-state
  DocumentCaseStateSchema + state-driven render branches + state-
  specific action affordances); Stage 7 commit composite with
  synthCtxForCommit pattern + INV-DOC-001 primary_document_id
  propagation; 3-doc-type e2e tests at `tests/integration/e2e/`
  gated on `MODAL_OCR_HMAC_SECRET` env-var. Net 1549 LOC (first
  within-band landing of Phase 7 chunk-impl arc; breaks floor-bias
  trend).

- **Session 41 retrospective at `docs/07_governance/retrospectives/
  phase-7-retrospective.md`** (660 LOC + friction-journal banking
  +110 LOC; commits A `29d8277` + B `df64956` + C `97f86ed`).
  6-item inheritance inventory (5 substrate-grade items #1-#5 in
  §5.1 + 1 demo gate item #6 Modal sidecar deployment in §5.2 with
  explicit Gap 3 substrate-vs-deployment framing). 3-item post-v1
  ADR amendment forward-pointer in §6.1 (items #A + #B + #C). 5-item
  future-cycle-watch sub-patterns in §6.3 ((α) directive-grade
  citation N=4 non-fire + (δ) shared per-document AI fallback
  budget counter N=2 + (ζ) Stage 4 + Stage 7 Tier C AI fallback
  wrap-vs-defer N=2 + (η-candidate) mock harness location variation
  inactive + (θ-candidate) multi-axis Path C probability evaluation
  N=4 banking + (ν) unknown short-circuit pattern N=1). 13-codification
  candidate routing table in §3 shipped at Commit B `df64956`.

- **Session 42 substrate close at `docs/09_briefs/phase-7/
  2026-05-20-phase-7-v1-close-demo-close-report.md`** (~327 LOC;
  commit `96eae39`). 8-item Phase 8 substrate-grade inheritance
  inventory (§6.1-§6.2; per §1.2 (α) absorption) + 1 demo gate item
  #9 (§6.3 founder action Phase 8 onset). Session 41 item #6 (Modal
  sidecar demo gate) marked SATISFIED at Session 42 1-of-3 partial
  demo (payment_confirmation success at warm OCR 16.5s within 30s
  budget; vendor_invoice + receipt exceeded 10s per-request timeout
  × 3 retries → transient_exhausted ceiling). 7 substantive Phase 7
  retrospective findings banked at §5.2 (including NEW Session 42
  ratified-design-vs-production-reality calibration gap N=11). 3
  Session 42 substrate close banking surfaces: chunk-7.1b-impl-grade
  local-deploy-substrate-gap N=11 two-sub-cluster framing
  (substrate-staleness N=1-10 + ratified-design-vs-production-reality
  N=11); F-J-14 Grain 3 first-firing at Phase 7 substrate grade;
  push-terminal-close N=4 cumulative cross-phase. Phase 7 → Phase
  8 transition declared at §8 ("Phase 7 substrate close: PARTIAL
  at HALT grade ... Phase 7 retrospective cycle: TERMINAL at
  Session 41 ... Phase 7 implementation cycle: TERMINAL at Session
  40 ... Next operational fire (Session 43+): Phase 8 scope-lock-
  cycle-round opens with first chunk candidate being the v1 close
  demo completion + sidecar substrate refresh chunk per §6 inventory
  items #7-#9").

### §2.3 ADR substrate inheritance

Phase 8 inherits the full ADR substrate. Relevant ADRs for Phase 8
scope adjudication, with Phase A verify-from-disk citations:

- **ADR-0007 Three-Tier Agent Architecture** at `docs/07_governance/
  adr/0007-three-tier-agent-architecture.md`. Q30 Logic Receipt
  codification (`pipeline_trace: PipelineStageRecord[]` canonical
  definition at lines 482-489; closed at Phase 0 2026-05-03; per-
  stage record carries `stage_name`, `input_hash`, `output_hash`,
  `model`, `timestamp`). §Tier 2 safety contract at lines 208-235
  ("Safety contract (inviolable). Preserved verbatim from the
  2026-04-19 architecture proposal: 1. No direct writes. Tier 2
  stages never call mutating services or insert into tables. All
  commits route through Tier 1."). Phase 8 Layer 2 item #B extends
  Q30 pipeline_trace schema for new stage types (e.g., ledger-
  extension-validation stages); Phase 8 Layer 2 item #C amends
  §Tier 2 safety contract to widen system_actor scope (or
  alternatively at ADR-0011 §1 service-layer contract).

- **ADR-0010 Reserved Enum States** at `docs/07_governance/adr/
  0010-reserved-enum-states.md`. Admit discipline three-layer
  Phase 1 defense at lines 73-131 (Layer 1 DB CHECK + Layer 2 Zod
  boundary + Layer 3 Service emission). Phase 8 Layer 2 item #A
  extends by admitting new reserved values into the relevant
  `exception_reason` (or `resolution_action`) enum per §1.2 (γ-1)
  ENUM-target uncertainty caveat.

- **ADR-0011 Document Platform** at `docs/07_governance/adr/
  0011-document-platform.md`. §1 spine-items sequencing at lines
  116-117 ("The Decision is presented as a sequence of spine items,
  each of which is the contract that one or more downstream ADRs
  cite."). §13 ENUM enumeration at lines 751-790 (resolution_action
  enum 9 active / 18 reserved; active subset: `attach_to_existing_
  bill`, `attach_to_existing_payment`, `record_bill_payment`,
  `mark_duplicate`, `mark_non_accounting`, `route_to_manual_entry`,
  `manual_born_paid_workflow`, `reprocess`, `archive`). §1.2 (β)
  note: Phase 7 retrospective §6.2 "post-v1 reconciliation + cross-
  service orchestrators + ledger extensions" is paraphrase synthesis
  of spine-items structure, not direct §1 quote. Phase 8 Layer 2
  item #A may land at §13 enum broaden (subject to §1.2 (γ-1)
  ENUM-target verification).

- **ADR-0014 Tier 2 Document Pipeline** at `docs/07_governance/adr/
  0014-tier-2-document-pipeline.md`. §12.1 transient retryable at
  lines 980-1013 (max 3 attempts, base 500ms, exponential factor
  2x, ±20% jitter, ~3.5s wall-clock total budget; Amendment
  2026-05-20 overrides Stage 2 OCR to ~30s wall-clock budget + 10s
  per-request timeout at line 1009 enforced via AbortController at
  sidecar client). §7 Reserved Tier B classifier at lines 600-609
  ("Tier B — Small classifier (reserved post-v1). Trained small
  classifier (fastText or small transformer) over OCR'd text.
  Higher recall, moderate precision. Trained on a labeled corpus
  that v1 generates ... Tier B is post-v1 because the corpus does
  not exist at v1 ship time."). Phase 8 Layer 2 item #D = §12.1
  second amendment (10s → 60s per-request timeout) landing at
  lines 980-1013.

- **ADR-0018 Relationship Router** at `docs/07_governance/adr/
  0018-relationship-router.md`. Subsystem 1 Ledger-State Candidate
  Completion at lines 276-505 (reads committed accounting state +
  candidate generation + score composition). Phase 8 §6 framing #4
  ledger extensions activation surface = ADR-0018 Subsystem 1
  (corrects §1.2 (γ-2) divergence away from ADR-0014 §7).

- **ADR-0019 Lifecycle FSM** at `docs/07_governance/adr/0019-*`
  (status verified at Phase 7 scope-input §2.4 as ratified active).
  Phase 8 cross-reference for lifecycle adjudication if §6 framings
  2+3+4 surface lifecycle questions at scope-lock Round 1.

### §2.4 Convention substrate inheritance

Phase 8 inherits the convention substrate shipped at Phase 7
retrospective Commit B (`df64956`). Verified at Phase A grade
(anti-drift discipline application; zero divergence detected):

- **`docs/04_engineering/conventions/session/scope-lock.md`:** Phase
  7 evidence accretion section at lines 582-729 (Candidate #3
  directive-grade Phase A verification N=49+; Candidate #4 directive
  partial-information value pick incompatible with substrate N=3
  cross-instance / N=4 within-Session-40; Candidate #5 brief-cited
  substrate path doesn't exist N=6 conservative / N=8 expansive).
  Origin metadata: "First codified: Phase 7, 2026-05-20 (Phase 7
  retrospective close)".

- **`docs/04_engineering/conventions/session/plan-authoring.md`:**
  Phase 7 codifications at lines 798-1090 (Candidate #1 multi-
  iteration refinement N=12 at lines 798-889; Candidate #6 per-
  disposition-shape multiplier table chunk-impl grade N=5 at lines
  892-954; Candidate #7 brief task-naming vs ADR canonical N=8 at
  lines 979-1021; Candidate #9 Phase B scope addition pattern N=3
  at lines 1045-1090). Origin: "First codified: Phase 7, 2026-05-20".

- **`docs/04_engineering/conventions/testing.md`:** Phase 7
  codification at lines 62-124 (Candidate #8 test-location canonical
  path discipline N=5; canonical: `apps/web/tests/integration/`).
  Origin: "First codified: Phase 7, 2026-05-20 (Phase 7 retrospective
  close)".

- **`docs/04_engineering/conventions/service-layer.md`:** Phase 7
  codification at lines 335-466 (Candidate #11 consumer-side
  synthetic ServiceContext for system_actor invocations; substrate-
  shim framing; Phase 8 post-v1 ADR amendment forward-pointer for
  withInvariants widening). Origin: "First codified: Phase 7,
  2026-05-20 (Phase 7 retrospective close)".

- **`CLAUDE.md` (project root):** Push-readiness three-condition
  gate at lines 129-197. Push-terminal-close timing pattern sub-
  section at lines 169-196 (Candidate #13 codification). Codification
  provenance: "Codified as cross-phase N=3 pattern at Phase 7
  retrospective close per Phase 5.1 + Phase 6.5 + Phase 7 precedent.
  Phase 7 banked the codification candidate as Candidate #13 per
  §6 carry-forward observation #4."

- **F-J-14 catalog at `docs/07_governance/friction-journal.md`
  lines 12689-12800:** Three-grain catalog (Grain 1 brief-draft
  prospective; Grain 2 Phase-A-close-prospective; Grain 3 mid-impl-
  reactive). Phase 7 fourth-instance cross-validation entry shipped
  at Commit A `29d8277` documenting Phase 7 chunks 7.1a/7.1b/7.2/
  7.3a/7.3b achieving Grains 2+3 non-fire despite +10/+33/+37/+38%
  forecast-deltas. Grain 0 candidate (directive-grade Phase A
  verification as preemptive split decision) banked at N=1 evidence
  per Phase 7 chunk 7.3b within-band landing exemplar.

---

## §3 Phase 8 substrate-grade inheritance inventory (Layer 1)

Layer 1 enumerates the substrate-grade work surfaces inherited from
Session 42 close report §6.1-§6.2. Eight items (#1-#8) at substrate-
grade; one item (#9) at demo-gate-grade in §3.B.

### §3.1 Item #1 — bundle_partial_commit_reconciliation_pending ENUM extension + audit metadata writer

**Substrate state at Phase 8 onset.** Reserved value brief-cited at
chunk 7.3b but absent from ExceptionReasonSchema per Phase 7 §A
verification ((μ) sub-grain finding); current substrate uses
`manual_route` resolution + reconciliation_context audit metadata
per Session 41 Iteration 2 Note 2 default disposition.

**Inheritance reference.** Session 41 §5.1 item #1 (lines 449-460);
Session 42 close report §6.1 item #1 (line 247).

**Phase 8 codification candidate framing.** ENUM ADD VALUE migration
+ Zod schema broaden + audit metadata writer at Stage 7 Bundle
partial-commit reconciliation path. Activation trigger: operational
partial-commit reconciliation surface materializes (v1 substrate
covers via interim `manual_route` routing; formal codification
fires at first cross-tenant partial-commit observation OR Phase 8+
audit-substrate cycle).

**Cross-ENUM caveat per §1.2 (γ-1).** ENUM target may be
`exception_reason` (the queue-side ENUM) rather than `resolution_
action` (the resolution-side ENUM enumerated at ADR-0011 §13).
Phase 8 scope-lock cycle Round 1 should verify via direct
ADR-0011 + database schema read before brief-drafting.

**Estimated impl-grade scope.** ENUM migration (~30 LOC) + Zod
schema broaden (~5 LOC) + audit metadata writer at Stage 7 (~40-60
LOC) + integration tests (~80-120 LOC) = ~155-215 LOC at chunk-
grade.

### §3.2 Item #2 — Logic Receipt bundle-level INV-AGENT-002 event composition + ProposalJustificationSchema formal codification

**Substrate state at Phase 8 onset.** Phase 7 chunk 7.3b ships
permissive `justification: z.record(z.unknown()).optional()` per
Session 41 Iteration 2 Option (c') Finding E absorption. ADR-0007
Q30 specifies the Logic Receipt content shape (`pipeline_trace:
PipelineStageRecord[]` canonical at lines 482-489).

**Inheritance reference.** Session 41 §5.1 item #2 (lines 462-472;
paired with §4.B Candidate #12 deferral discipline per Session 41
Iteration 2 Gap 2); Session 42 close report §6.1 item #2 (line 248).

**Phase 8 codification candidate framing.** Formal
ProposalJustificationSchema + bundle-level INV-AGENT-002 audit
event composition at Stage 7 commit composite + nested per-child
traces. Activation trigger: Phase 8+ Logic Receipt consumer ships
(post-v1 audit-reproducibility consumer; ADR-0007 Q30 canonical
extension per Layer 2 item #B).

**Estimated impl-grade scope.** ProposalJustificationSchema Zod
(~40-60 LOC) + bundle-level INV-AGENT-002 emission at Stage 7
(~30-50 LOC) + nested per-child trace composition (~40-60 LOC) +
integration tests (~100-150 LOC) = ~210-320 LOC at chunk-grade.

### §3.3 Item #3 — payment.record ActionName addition + role_permissions migration

**Substrate state at Phase 8 onset.** Current substrate uses
`bill.record_payment` ActionName per ACTION_NAMES enum +
role_permissions seeding ((μ) sub-grain finding); paymentService.
record() is greenfield-with-no-v1-callers per Phase 7 chunk 7.2
Sub-Q2 2.β.

**Inheritance reference.** Session 41 §5.1 item #3 (lines 474-482);
Session 42 close report §6.1 item #3 (line 249).

**Phase 8 codification candidate framing.** Formal `payment.record`
ActionName + role_permissions migration + canUserPerformAction
parity test (CA-27 enforced parity). Activation trigger:
paymentService.record() gains v1 consumers (post-v1 reconciliation
orchestrator OR cross-service consumer chunk per §6 framing #3).

**Estimated impl-grade scope.** ActionName enum addition (~5 LOC)
+ role_permissions migration (~30-50 LOC) + canUserPerformAction
parity test (~40-80 LOC) + consumer-site wiring (~50-100 LOC at
v1-consumer chunk grade) = ~125-235 LOC at sub-chunk or chunk
grade depending on consumer count.

### §3.4 Item #4 — React DOM test env (jsdom + @testing-library/react) for UI component tests

**Substrate state at Phase 8 onset.** Vitest config has no React
DOM environment; chunk 6.2b + chunk 7.3b ProposedAttachmentCard +
DocumentCard state machine + PendingDocumentsView UI component
tests structurally verified via typecheck but not via component
test runs.

**Inheritance reference.** Session 41 §5.1 item #4 (lines 484-492);
Session 42 close report §6.1 item #4 (line 250).

**Phase 8 codification candidate framing.** vitest jsdom config +
@testing-library/react infra + per-component test fixtures.
Activation trigger: Phase 8+ UI test infrastructure cycle (§6
framing #6) OR cross-component test coverage gap surfaces
operationally.

**Estimated impl-grade scope.** vitest jsdom config (~20 LOC) +
@testing-library/react infra setup (~30-50 LOC) + per-component
test fixtures at chunk-grade (~200-400 LOC across 5-8 UI components
inherited from chunks 6.2b + 7.3b) = ~250-470 LOC at chunk grade.

### §3.5 Item #5 — Post-v1 ADR amendment for system_actor widening at withInvariants

**Substrate state at Phase 8 onset.** Phase 7 codifies the consumer-
side synthetic ServiceContext discipline as interim substrate-shim
(5-field synthCtxForCommit pattern at Stage 7 commit composite per
chunk 7.3b commit `ab0f7fe`). Service-layer convention substrate
shipped at `service-layer.md` lines 335-466 (Candidate #11
codification) with explicit Phase 8 forward-pointer.

**Inheritance reference.** Session 41 §5.1 item #5 (lines 494-505;
paired with §3.2 Candidate #11 substrate-shim framing); Session 42
close report §6.1 item #5 (line 251).

**Phase 8 codification candidate framing.** ADR-0007 §Tier 2 safety
contract amendment OR ADR-0011 §1 service-layer contract amendment
codifying the widening to a structural union (`ServiceContext |
SystemActorServiceContext`) parallel to chunk 6.3a `recordMutation`
widening pattern. Activation trigger: N=3 cross-chunk evidence at
orchestrator-driven service invocations (Phase 7 N=2 + first Phase
8 orchestrator-driven invocation graduates to N=3 per §6 framing
#7).

**Estimated impl-grade scope.** ADR amendment (sub-chunk; ~30-50
LOC) + withInvariants signature widen (~10-20 LOC) + consumer
migration from synthetic ctx to canonical SystemActorServiceContext
(~40-100 LOC depending on consumer count) + parity tests (~40-80
LOC) = ~120-250 LOC at sub-chunk or chunk grade.

### §3.6 Item #6 — E2E assertion body authoring (paired with React DOM env item #4)

**Substrate state at Phase 8 onset.** 3 e2e test files at
`apps/web/tests/integration/e2e/` shipped at chunk 7.3b (gated on
`MODAL_OCR_HMAC_SECRET` env-var presence per Session 41 §B
carry-forward framing). Test scaffolding present; assertion bodies
deferred to Phase 8 per Session 41 Iteration 2 §B carry-forward.

**Inheritance reference.** Session 41 Iteration 2 §B carry-forward
(not in main §5 inventory; promoted to Session 42 §6.1 item #6 at
line 252).

**Phase 8 codification candidate framing.** ~600-1050 LOC across 3
e2e test files (assertion body authoring for vendor_invoice +
receipt + payment_confirmation document types at Tier 2 extraction
pipeline output). Activation trigger: paired with §3.4 item #4
React DOM test env activation (Phase 8 UI test infrastructure
cycle).

**Estimated impl-grade scope.** ~600-1050 LOC at chunk grade
(Session 41 §B explicit estimate; per-doc-type assertion blocks
~200-350 LOC each across 3 files).

### §3.7 Item #7 — Sidecar deployment validation harness (NEW Session 42)

**Substrate state at Phase 8 onset.** Sidecar-ocr/ deployment
substrate shipped at chunk 7.1b (greenfield Python service + TS
client at `apps/web/src/agent/orchestrator/extraction/sidecar/`);
substrate-staleness sub-cluster N=1-10 surfaced at Session 42
across Modal CLI rename, FastAPI SDK rename, Pydantic 2 strict
mode, transitive dependencies, requirements.txt upper-bounds, image
config, secret naming.

**Inheritance reference.** Session 42 close report §6.1 item #7
(line 253; NEW Session 42 banking surface).

**Phase 8 codification candidate framing.** Fixture-mocked
equivalents that exercise deploy substrate WITHOUT requiring real
Modal. Would catch all N=1-N=10 sub-instances at chunk-ship rather
than at first real deployment. Convention candidate at testing.md
extension grade (e.g., "Deployment-substrate validation discipline:
fixture-mocked harness for any sidecar deployment scaffolding").

**Estimated impl-grade scope.** Fixture-mock harness (~150-250 LOC
Python + ~100-150 LOC TS) + integration test wiring (~80-120 LOC)
+ CI integration (~30-50 LOC) = ~360-570 LOC at chunk grade.

### §3.8 Item #8 — ADR-0014 §12.1 second amendment + client.ts calibration (NEW Session 42)

**Substrate state at Phase 8 onset.** `apps/web/src/agent/
orchestrator/extraction/sidecar/client.ts:25` `PER_REQUEST_TIMEOUT_
MS = 10_000` per ADR-0014 §12.1 Amendment 2026-05-20 (line 1009).
Empirical observation Session 42 §2.2: warm-state PaddleOCR
inference on real PDFs (~25-28KB) exceeds 10s consistently
(payment_confirmation succeeded at 16.5s warm OCR within 30s
budget; vendor_invoice + receipt exceeded 10s × 3 retries →
transient_exhausted ceiling). Ratified-design-vs-production-reality
calibration gap N=11.

**Inheritance reference.** Session 42 close report §6.2 item #8
(lines 255-257; NEW Session 42); Phase 7 retrospective §6.1 item #D
(equivalent forward-pointer at retrospective grade).

**Phase 8 codification candidate framing.** ADR-0014 §12.1 second
amendment ratifies new per-request timeout (60s or analogous warm-
state-PaddleOCR-fit value) + retains 30-180s Stage 2 budget framing;
client.ts update aligns substrate to ratified design. Activation
trigger: Phase 8 first chunk (substrate-fix-narrowness candidate
per Phase 5.1 sub-curve (b) calibration per §6 framing #1).

**Estimated impl-grade scope.** ADR amendment (~30-50 LOC) +
client.ts calibration update (~5 LOC) + per-request timeout test
(~30-50 LOC) = ~65-105 LOC at sub-chunk grade. Bundled with §3.B
item #9 demo re-fire in §6 framing #1.

### §3.B Layer 1 demo gate — Item #9 demo re-fire at 3-of-3 success grade (NEW Session 42; founder action)

**Substrate state at Phase 8 onset.** Session 42 1-of-3 partial
demo: payment_confirmation success (`def3f808-385f-4d32-a37d-
6f7719b51353`; all 9 active stages fired correctly; `status='committed'`
defensive guard branch); vendor_invoice + receipt failed at 10s
per-request timeout × 3 retries.

**Inheritance reference.** Session 42 close report §6.3 item #9
(line 261; demo gate; founder action; Phase 8 onset).

**Phase 8 framing.** After §3.8 item #8 ADR amendment + client.ts
fix + Modal sidecar re-deploy, demo re-fires at 3-of-3 success
grade. Single demo session (warm Modal + calibrated timeout + same
fixture set + same demo runner script at `apps/web/scripts/phase-
7-v1-close-demo.ts`). Banks 3-of-3 evidence + closes chunk 7.3
brief §6 close gate 19 verbatim.

**Substrate-vs-deployment framing per Session 41 §5.2 Gap 3 rule.**
Item #9 is a deployment-execution surface (founder action + demo
runner script), not a codification fire. Layer 1.B framing kept
distinct from Layer 1 substrate-grade items #1-#8 to avoid
conflating substrate-grade work with deployment gates.

**Bundle with §6 framing #1.** Items #7 + #8 + #9 bundled at Phase
8 first chunk per Session 42 §8 explicit framing ("Phase 8's first
chunk is structurally the 'Phase 7 substrate close completion +
Phase 8 onset' chunk per Phase 5.1 sub-curve (b) substrate-fix-
narrowness calibration").

---

## §4 Phase 8 ADR amendment inheritance inventory (Layer 2)

Layer 2 enumerates the ADR amendment work surfaces. Four items
(#A-#D); items #A-#C inherited from Phase 7 retrospective §6.1;
item #D NEW at Session 42.

### §4.A Item #A — bundle_partial_commit_reconciliation_pending ENUM extension at ADR-0010 admit + ADR-0011 §13 enumeration broaden

**Substrate location.** ADR-0010 lines 73-131 (admit discipline
three-layer defense) + ADR-0011 §13 lines 751-790 (ENUM enumeration).

**Scope.** Three-layer extension per ADR-0010 admit discipline: (1)
DB CHECK migration adding the reserved enum value; (2) Zod boundary
schema broaden; (3) service-layer emission omitted from Phase 1
write paths (DEFAULT handles assignment).

**Cross-ENUM caveat per §1.2 (γ-1).** ENUM target uncertainty: may
be `exception_reason` (queue-side) vs `resolution_action` (resolution-
side; enumerated at ADR-0011 §13). Phase 8 scope-lock Round 1
verifies target via direct ADR-0011 + database schema read.

**Amendment-grade vs substrate-grade adjudication.** Substrate-
grade landing (migration + Zod + admit-discipline application);
ADR amendment is the governance ratification surface. Phase 8
scope-lock cycle adjudicates which lands first (substrate-shape
chunk vs ADR amendment cycle).

**Phase 8 codification candidate framing.** Layer 1 item #1
substrate-grade work + Layer 2 item #A ADR amendment ratification.
Paired surfaces.

### §4.B Item #B — Logic Receipt codification at ADR-0007 Q30 canonical

**Substrate location.** ADR-0007 Q30 lines 482-489 (`pipeline_trace:
PipelineStageRecord[]` canonical definition).

**Scope.** Q30 was closed at Phase 0 (2026-05-03). Phase 8 amendment
extends `pipeline_trace` schema to absorb new stage types (e.g.,
ledger-extension-validation stages at §6 framing #4 + bundle-level
INV-AGENT-002 audit event composition at §3.2 item #2 substrate).

**Amendment-grade vs substrate-grade adjudication.** Per Phase 7
retrospective §6.1 item #B framing: "Logic Receipt codification at
ADR-0007 Q30 canonical." Phase 8 scope-lock cycle adjudicates
whether the amendment is (a) ADR-amendment-grade (ADR-0007 Q30
extension; codification of formal ProposalJustificationSchema +
bundle-level INV-AGENT-002 composition); (b) substrate-grade
(implementation lands in service layer; ADR ratification follows);
or (c) both (amendment + substrate concurrent).

**Phase 8 codification candidate framing.** Layer 1 item #2
substrate-grade work + Layer 2 item #B ADR amendment ratification.
Paired surfaces.

### §4.C Item #C — system_actor widening at ADR-0007 §Tier 2 safety contract OR ADR-0011 §1 service-layer contract

**Substrate location.** ADR-0007 §Tier 2 safety contract lines
208-235 (current: "No direct writes. Tier 2 stages never call
mutating services or insert into tables.") OR ADR-0011 §1 service-
layer contract (spine items at lines 116-117+; specific service-
layer contract item TBD per Phase 8 scope-lock Round 1 adjudication).

**Scope.** Widen `withInvariants`'s accepted ctx shape to a
structural union (`ServiceContext | SystemActorServiceContext`)
parallel to chunk 6.3a `recordMutation` widening pattern. Codifies
the canonical resolution of Phase 7 substrate-shim discipline
(Candidate #11 service-layer.md).

**Amendment-grade vs substrate-grade adjudication.** ADR amendment
ratifies the widening; service-layer substrate change is the
implementation surface. Pairing tighter than item #A/B because
service-layer.md substrate-shim discipline explicitly forward-
points to ADR amendment.

**Phase 8 codification candidate framing.** Layer 1 item #5
substrate-grade work + Layer 2 item #C ADR amendment ratification.
Paired surfaces.

### §4.D Item #D — ADR-0014 §12.1 second amendment (Stage 2 per-request timeout calibration) (NEW Session 42)

**Substrate location.** ADR-0014 §12.1 lines 980-1013 (transient
retryable section + Amendment 2026-05-20 Stage 2 overrides).

**Scope.** Raise `PER_REQUEST_TIMEOUT_MS` from `10_000` to `60_000`
(or analogous warm-state-PaddleOCR-inference-fit value). Retains
30-180s Stage 2 budget framing per first Amendment 2026-05-20.
ADR amendment ratifies new per-request timeout; client.ts update at
`apps/web/src/agent/orchestrator/extraction/sidecar/client.ts:25`
aligns substrate to ratified design.

**Amendment-grade vs substrate-grade adjudication.** Per Session 42
§6.2 framing: substrate-fix-narrowness activation (Phase 8 first
chunk per §6 framing #1). ADR amendment grade fires in tight bundle
with Layer 1 item #8 substrate (sub-chunk-grade ~65-105 LOC bundle
per §3.8).

**Phase 8 codification candidate framing.** Layer 1 item #8
substrate-grade work + Layer 2 item #D ADR amendment ratification.
Bundle activates at Phase 8 first chunk per §6 framing #1.

---

## §5 Phase 8 codification candidate inheritance inventory (Layer 3)

Layer 3 enumerates the convention-grade candidate surfaces. 15
items: 7 substantive findings per Session 42 close report §5.2 + 5
future-cycle-watch sub-patterns per Phase 7 retrospective §6.3 + 3
Session 42 substrate close banking surfaces.

### §5.1 Seven substantive Phase 7 retrospective findings (banked at Session 42 §5.2)

**Finding 5.1.1 — Schema-translation-discipline gap at manual sync
grade (N=8).** Chunk-7.1b-impl-grade two-sub-cluster framing.
Pydantic 2 strict mode + manual TS↔Python schema sync surfaces
translation-discipline gaps at chunk-ship grade. Codification
threshold: N=8 banking at Session 42; codification graduation
candidate at Phase 8 retrospective close.

**Finding 5.1.2 — Loose-version-pin forward-compatibility regression
(N=9).** ML library major-version-fragile pin discipline.
paddlepaddle 3.x breaking change masked by loose `>=` version pin
in requirements.txt. Codification threshold: N=9 banking;
codification graduation candidate at Phase 8 retrospective close.

**Finding 5.1.3 — Transitive dep-discovery gap at chunk-impl
authoring (N=10).** Deploy-time dep-resolution validation
discipline. pymupdf not declared in chunk 7.1b authoring; transitive
dependency surfaced only at deploy time. Codification threshold:
N=10 banking; codification graduation candidate at Phase 8
retrospective close.

**Finding 5.1.4 — Diagnostic-by-evidence discipline strengthening
mid-cascade.** Cross-attempt observation; substrate-fix-grade
diagnostic discipline. Multi-attempt diagnostic cascades benefit
from evidence-grade discipline strengthening between attempts.
Codification threshold: cross-attempt observation banking;
codification graduation candidate at Phase 8 retrospective close.

**Finding 5.1.5 — Layer-peeling diagnostic pattern structural
recognition (N=8 attempts-deep observation).** Substrate-fix-
cascade diagnostic discipline. Substrate-fix cascades exhibit
layer-peeling structure (each fix surfaces the next layer's gap).
Codification threshold: N=8 attempts-deep observation; codification
graduation candidate at Phase 8 retrospective close.

**Finding 5.1.6 — Misleading-upstream-library-error-message
verification discipline (N=10 surface adjunct).** Trust-but-verify
upstream error message fix recommendations. Upstream library error
messages may misdescribe the actual fix; verification discipline
required. Codification threshold: N=10 surface adjunct; codification
graduation candidate at Phase 8 retrospective close.

**Finding 5.1.7 — Ratified-design-vs-production-reality calibration
gap (N=11 sub-cluster; NEW Session 42).** Chunk-7.1b-impl-grade
two-sub-cluster framing (substrate-staleness N=1-10 + ratified-
design-vs-production-reality N=11). ADR-0014 §12.1 Amendment's 10s
per-request timeout empirically miscalibrated for warm-state real-
PDF PaddleOCR inference. Codification threshold: N=11 sub-cluster
banking at Session 42; codification graduation candidate at Phase
8 retrospective close (paired with Layer 1 item #8 + Layer 2 item
#D substrate work).

### §5.2 Five future-cycle-watch sub-patterns from Phase 7 retrospective §6.3

**§5.2.1 (α) Directive-grade citation against substrate (N=4 non-
fire evidence).** Non-fire at chunks 7.1b + 7.2 + 7.3a + 7.3b
despite +10/+33/+37/+38% forecast-deltas. Disposition: banked at
scope-lock.md Phase 7 accretion per Candidate #3 routing
(convention surface candidate if N=3 recurs Phase 8+).

**§5.2.2 (δ) Shared per-document AI fallback budget counter (N=2
banking).** Session 39 carry-forward; chunk 7.3b inherits unchanged.
Disposition: banked; promotion candidate at N=3 cross-document
observation Phase 8+.

**§5.2.3 (ζ) Stage 4 + Stage 7 Tier C AI fallback wrap-vs-defer
discipline (N=2 banking).** Chunk 7.3b commit composite does NOT
invoke AI; no N=3 evidence. Disposition: banked; promotion candidate
at N=3 multi-stage AI fallback observation Phase 8+.

**§5.2.4 (θ-candidate) Multi-axis Path C probability evaluation
(N=4 banking + θ-candidate).** Chunks 7.1 + 7.2 + 7.3 directive
grades + retrospective directive itself. Disposition: codification
graduation candidate strengthens at N=4; ratified at Iteration 2
directive grade as "Path C probability evaluation requires sub-
question specificity per multi-axis discipline; pre-evaluation
inverts sub-question-anchored discipline" (applied at this Phase
8 scope-input §6 framings grade).

**§5.2.5 (ν) Unknown short-circuit pattern at Stage 3 close (N=1
first-instance).** Session 39 first-instance observation.
Disposition: banked; promotion candidate at Phase 8+ if N=3 recurs.

### §5.3 Three Session 42 substrate close banking surfaces

**§5.3.1 Chunk-7.1b-impl-grade local-deploy-substrate-gap N=11
sub-pattern comprehensively graduated.** Two-sub-cluster framing
per §5.1.7 above: substrate-staleness N=1-10 (Modal CLI rename +
FastAPI SDK rename + Pydantic 2 strict mode + transitive deps +
requirements.txt upper-bounds + image config + secret naming) +
ratified-design-vs-production-reality N=11 (PER_REQUEST_TIMEOUT_MS
calibration). Codification graduation candidate at Phase 8
retrospective close.

**§5.3.2 F-J-14 Grain 3 first-firing at Phase 7 substrate grade.**
Validates catalog across all three grains (Grain 1 brief-draft
prospective + Grain 2 Phase-A-close-prospective + Grain 3 mid-impl-
reactive). Phase 7 chunk 7.3b cycle achieved Grain 3 firing at
substrate-fix cascade grade (Session 42 layer-peeling observations).
Disposition: catalog complete at three-grain coverage; banking
continues for Grain 0 candidate (directive-grade Phase A
verification as preemptive split decision; Phase 7 chunk 7.3b
within-band landing exemplar N=1).

**§5.3.3 Push-terminal-close N=4 cumulative cross-phase.** Phase
5.1 + 6.5 + Phase 7-retro + Phase 7-substrate-fix at Session 42
close. Graduates phase-terminal-close → phase-transition-grade
codification refinement candidate. Banking continues at Phase 8
retrospective close (N=5 if Phase 8 close fires push-terminal-close
pattern).

---

## §6 Phase 8 preliminary scope framings

Per Phase 7 retrospective §6.2 (per §1.2 (β) paraphrase-synthesis
caveat): Phase 8 canonical scope is "post-v1 reconciliation + cross-
service orchestrators + ledger extensions." Eight preliminary scope
framings at scope-input grade. Per-framing entry shape: substrate
description + Phase 7/8 inheritance reference + estimated scope
grade. **Path C invocation probability NOT pre-assigned** per
multi-axis discipline (sub-question-anchored; sub-question
specificity required); Phase 8 scope-lock cycle Round N adjudicates
Path C evaluation at sub-question-anchored grade.

### §6.1 Framing 1 — v1 close demo completion sub-chunk

**Substrate description.** Items #7 + #8 + #9 from Layer 1 (per
§3.7 + §3.8 + §3.B bundle). Sidecar deployment validation harness
+ ADR-0014 §12.1 second amendment + client.ts calibration + demo
re-fire at 3-of-3 success grade.

**Inheritance reference.** Phase 7 retrospective §6.1 item #D
(forward-pointer) + Session 42 close report §6 items #7-#9 + §8
"Phase 8's first chunk" explicit framing.

**Scope grade.** Sub-chunk (smallest scope grade at Phase 8).
Targeted substrate-fix-narrowness chunk shape per Phase 5.1 sub-
curve (b) precedent. Estimated forecast ~100-300 LOC at impl-grade
(sub-chunk floor calibration per Session 42 close report).

### §6.2 Framing 2 — Post-v1 reconciliation orchestrator

**Substrate description.** Stage 7 Bundle partial-commit
reconciliation surface activation. Layer 1 item #1 substrate +
Layer 2 item #A ADR amendment. First substantive Phase 8
reconciliation orchestrator candidate per Phase 7 retrospective
§6.2 forward-pointer.

**Inheritance reference.** Session 41 §5.1 item #1 + Session 42
§6.1 item #1 + Phase 7 retrospective §6.1 item #A.

**Scope grade.** Chunk (substantive new code surface). Estimated
forecast ~155-215 LOC at impl-grade per §3.1 estimate; may
graduate to multi-chunk if scope-lock surfaces audit-event
composition + integration test coverage at higher LOC.

### §6.3 Framing 3 — Cross-service orchestrators (paymentService.record v1 consumers)

**Substrate description.** Layer 1 item #3 substrate (payment.record
ActionName + role_permissions migration + canUserPerformAction
parity test) + analogous cross-service orchestrator patterns
surfaced at Phase 8 scope-lock cycle.

**Inheritance reference.** Session 41 §5.1 item #3 + Session 42
§6.1 item #3.

**Scope grade.** Chunk-or-multi-chunk (depends on consumer count
surfaced at scope-lock). Estimated forecast ~125-235 LOC at sub-
chunk-or-chunk grade per §3.3 estimate; scope-lock may surface
additional cross-service orchestrators (e.g., vendorPrepaymentService.
record() v1 consumers; documentExceptionService.resolveException()
v1 consumers) that bundle at multi-chunk grade.

### §6.4 Framing 4 — Ledger extensions (ADR-0018 Subsystem 1 activation)

**Substrate description.** Tier 2.5 Router activation per ADR-0018
Subsystem 1 (Ledger-State Candidate Completion at lines 276-505).
Extended ledger semantics (new entity types, new relationship
patterns, new score features). Per §1.2 (γ-2) absorption: activation
surface is ADR-0018 Subsystem 1, NOT ADR-0014 §7 Reserved Tier B
classifier (Phase 7 retrospective §6.3 mislabeled cross-reference
corrected here).

**Inheritance reference.** Phase 7 retrospective §6.2 + ADR-0018
Subsystem 1 substrate.

**Scope grade.** Multi-chunk (Tier 2.5 Router is itself a substantive
system; depends on Phase 8 scope-lock cycle scope-narrowing).
Estimated forecast TBD at scope-lock Round 1 (requires Subsystem 1
candidate scoring read + score composition read at Phase A grade
during chunk brief-drafting).

### §6.5 Framing 5 — Logic Receipt consumer

**Substrate description.** Layer 1 item #2 (Logic Receipt bundle-
level INV-AGENT-002 + ProposalJustificationSchema) + Layer 2 item
#B (ADR-0007 Q30 canonical extension). Phase 8 codification
candidate at audit-substrate cycle grade.

**Inheritance reference.** Session 41 §5.1 item #2 + Session 42
§6.1 item #2 + Phase 7 retrospective §6.1 item #B.

**Scope grade.** Chunk (substantive new code surface + ADR
amendment). Estimated forecast ~210-320 LOC at impl-grade per
§3.2 estimate.

### §6.6 Framing 6 — UI test infrastructure cycle

**Substrate description.** Layer 1 item #4 substrate (React DOM
test env + @testing-library/react infra + per-component test
fixtures) + Layer 1 item #6 (e2e assertion body authoring;
~600-1050 LOC across 3 e2e test files).

**Inheritance reference.** Session 41 §5.1 item #4 + Session 41
Iteration 2 §B carry-forward + Session 42 §6.1 items #4 + #6.

**Scope grade.** Chunk (test infrastructure + fixture authoring
combined; component test fixtures across 5-8 UI components
inherited from chunks 6.2b + 7.3b). Estimated forecast ~250-470
LOC at chunk grade (vitest jsdom infra) + ~600-1050 LOC (e2e
assertion body authoring) = ~850-1520 LOC combined-grade.

### §6.7 Framing 7 — system_actor widening at withInvariants

**Substrate description.** Layer 1 item #5 substrate (consumer-
side synthetic ServiceContext substrate-shim → canonical structural
union) + Layer 2 item #C (ADR amendment ratification).

**Inheritance reference.** Session 41 §5.1 item #5 + Session 42
§6.1 item #5 + Phase 7 retrospective §6.1 item #C + service-
layer.md Candidate #11 codification.

**Scope grade.** Sub-chunk-or-chunk (depends on consumer migration
scope; ADR amendment + withInvariants signature widen +
consumer-site migration). Estimated forecast ~120-250 LOC at sub-
chunk or chunk grade per §3.5 estimate.

### §6.8 Framing 8 — Sidecar deployment validation harness

**Substrate description.** Layer 1 item #7 substrate (fixture-
mocked equivalents that exercise deploy substrate without requiring
real Modal). Convention candidate at testing.md extension grade.

**Inheritance reference.** Session 42 §6.1 item #7 + Session 42
§5.2 §5.1.1 + §5.1.2 + §5.1.3 substrate-staleness sub-cluster
(N=1-10 catch surface).

**Scope grade.** Chunk (fixture-mocked Modal harness + per-substrate-
edit test coverage + CI integration). Estimated forecast ~360-570
LOC at chunk grade per §3.7 estimate.

### §6.9 Path C invocation evaluation note

Path C invocation probability NOT pre-assigned per multi-axis
discipline. Per §5.2.4 (θ-candidate) codification graduation
candidate (N=4 banking): Path C evaluation requires sub-question
specificity. Pre-evaluation at scope-input grade (before scope-
lock surfaces sub-questions) inverts sub-question-anchored
discipline. Phase 8 scope-lock cycle Round N adjudicates Path C
invocation per framing at sub-question-anchored grade.

**Forecast posture at scope-input grade.** Frame 6 (UI test
infrastructure cycle) at ~850-1520 LOC combined-grade is the
largest preliminary forecast; Frame 4 (ledger extensions) is TBD
but historically multi-chunk grade per ADR-0018 Subsystem 1
substrate weight. Phase 8 scope-lock Round 1 may surface Path C
split candidates at Frames 4 + 6 first.

---

## §7 Phase 8 sub-question catalog (preliminary at brainstorming-side onset grain)

Phase 8 sub-question pre-enumeration at brainstorming-side onset
grain analogous to Phase 7 §4 25-sub-question precedent (load-
bearing for Phase 7 scope-lock Round 1 walking all 25 + adding 1
new from VFD-6 findings per subagent verify-from-disk at Phase A
grade). Per-sub-question entry shape (matching Phase 7 §4
compression ~5-10 LOC each):

- **Sub-Q[N] (category/title).** Description (1-2 sentences) +
  option-space framing + inheritance source reference.
- **Decision-class classification** (governance-critical vs product-
  discovery vs mixed): preliminary lean ONLY; final classification
  DEFERRED to scope-lock Round 1 per Phase 7 §4 precedent.
- **NO per-sub-question Path C probability** — Path C evaluation
  is chunk-grade, not sub-question-grade, per multi-axis discipline.

Forecast ~15-25 sub-questions at brainstorming-side onset grain.

### §7.1 Layer 1 substrate-grade items adjudication sub-questions

- **Sub-Q1 (item #1 ENUM target).** Per §1.2 (γ-1) absorption:
  is `bundle_partial_commit_reconciliation_pending` an
  `exception_reason` enum member (queue-side) or `resolution_action`
  enum member (resolution-side)? ADR-0011 §13 enumerates
  `resolution_action`; the value is contextually queue-side. Phase
  8 scope-lock Round 1 should verify via direct ADR-0011 + database
  schema read.
- **Sub-Q2 (item #2 ProposalJustificationSchema shape).** What
  fields does the formal ProposalJustificationSchema carry?
  ProposalJustification per ADR-0007 Q30 canonical
  (`pipeline_trace: PipelineStageRecord[]`) + bundle-level
  composition fields TBD. Phase 8 scope-lock Round 1 adjudicates
  schema shape.
- **Sub-Q3 (item #3 paymentService.record consumer count).** How
  many v1 consumers does paymentService.record() activate at Phase
  8? Single consumer (post-v1 reconciliation orchestrator) vs
  multiple (cross-service orchestrator chunk vs N+ consumer wiring
  surfaces). Affects §6 framing #3 scope grade.
- **Sub-Q4 (item #4 component test fixture scope).** Which UI
  components are in-scope for Phase 8 test fixture authoring?
  Chunks 6.2b + 7.3b shipped 5-8 UI components (DocumentCard,
  ProposedAttachmentCard, PendingDocumentsView, DocumentIntakeRail,
  SplitScreenLayout, others TBD). Phase 8 scope-lock Round 1
  enumerates the per-component test fixture roster.
- **Sub-Q5 (item #5 withInvariants widening shape).** Does
  withInvariants widen to structural union (`ServiceContext |
  SystemActorServiceContext`) or discriminated union (`{type:
  'service'} | {type: 'system_actor'}`)? Phase 8 scope-lock Round
  1 adjudicates per chunk 6.3a `recordMutation` widening pattern
  precedent.
- **Sub-Q6 (item #6 e2e assertion body shape).** Per-doc-type
  assertion blocks at vendor_invoice + receipt + payment_confirmation.
  Shape: assertion-per-stage (9 stages × 3 doc types = 27 assertion
  blocks) vs assertion-per-doc-type-end-to-end (3 assertion blocks
  with stage-by-stage internal sub-assertions). Phase 8 scope-lock
  Round 1 adjudicates.
- **Sub-Q7 (item #7 fixture-mocked harness boundaries).** What
  surfaces does the fixture-mocked Modal harness cover? Deploy
  validation only (Modal CLI + FastAPI SDK + Pydantic 2 + transitive
  deps + requirements.txt + image config + secret naming = N=10
  surfaces) vs deploy validation + runtime invocation mocking. Phase
  8 scope-lock Round 1 adjudicates.
- **Sub-Q8 (item #8 timeout calibration value).** What exact value
  for `PER_REQUEST_TIMEOUT_MS`? 60_000 (per §1.2 (γ-1) Session 42
  default) vs warm-state-PaddleOCR-inference-fit value (empirically
  determined from 3-of-3 demo re-fire vendor_invoice + receipt
  warm OCR timing). Phase 8 scope-lock Round 1 adjudicates per
  empirical evidence basis.

### §7.2 Layer 2 ADR amendment adjudication sub-questions

- **Sub-Q9 (item #A amendment-grade vs substrate-grade fire order).**
  Layer 2 item #A ENUM extension: ADR amendment ratifies first
  (governance-led) vs substrate-shape chunk lands first (substrate-
  led). Affects §6 framing #2 sequencing.
- **Sub-Q10 (item #B Q30 extension shape).** Layer 2 item #B
  ADR-0007 Q30 extension: extends `pipeline_trace` schema to
  absorb new stage types vs adds parallel field (`bundle_audit_
  trace: BundleAuditRecord[]`) vs new ADR Q-number. Phase 8 scope-
  lock Round 1 adjudicates.
- **Sub-Q11 (item #C amendment location ADR-0007 vs ADR-0011).**
  Per Phase 7 retrospective §6.1 item #C framing: amendment lands
  at ADR-0007 §Tier 2 safety contract OR ADR-0011 §1 service-layer
  contract. Phase 8 scope-lock Round 1 picks the canonical location.
- **Sub-Q12 (item #D second amendment scope).** ADR-0014 §12.1
  second amendment: timeout-only (calibration value bump) vs
  framing-refinement (per-request budget framing extension with
  warm-state vs cold-state distinction) vs comprehensive (Stage 2
  budget + per-stage breakdown + retry framing refinement). Phase
  8 scope-lock Round 1 adjudicates per Layer 1 item #8 substrate
  evidence basis.

### §7.3 §6 scope framings adjudication sub-questions

- **Sub-Q13 (framing #1 bundle composition).** Framing #1 v1 close
  demo completion: bundles items #7 + #8 + #9 (per §3.B + §6.1
  framing). Phase 8 scope-lock Round 1 ratifies bundle vs splits
  into separate chunks if framing #1 LOC exceeds sub-chunk band.
- **Sub-Q14 (framing #4 ledger extensions chunk-decomp).** Framing
  #4 multi-chunk grade per §6.4. Phase 8 scope-lock Round 1
  enumerates ADR-0018 Subsystem 1 candidate scoring + score
  composition into N chunk-grade work surfaces (forecast TBD per
  Phase A grade chunk brief-drafting).
- **Sub-Q15 (framing #6 UI infra vs e2e assertion split).** Framing
  #6 combined-grade ~850-1520 LOC. Phase 8 scope-lock Round 1
  adjudicates split: UI infra chunk (vitest jsdom + @testing-
  library/react) + e2e assertion chunk separately vs combined
  framing #6 chunk.
- **Sub-Q16 (framing prioritization at Phase 8 scope-lock close).**
  Which framings ship at Phase 8 v1 close vs defer to post-v1
  amendment cycles? Framings #1 (v1 close demo completion) +
  potentially #4 (ledger extensions per ADR-0018) + potentially #2
  (post-v1 reconciliation orchestrator) are Phase 8 v1 close
  candidates; framings #3 + #5 + #6 + #7 + #8 may defer per scope-
  narrowing.
- **Sub-Q17 (Path C invocation at framings #4 + #6).** Multi-chunk
  framing #4 + combined-grade framing #6 are Path C invocation
  candidates per §6.9 forecast posture. Phase 8 scope-lock Round
  N adjudicates Path C evaluation per sub-question-anchored grade.

### §7.4 Cross-cutting sub-questions

- **Sub-Q18 (Phase 8 test infrastructure shape).** Phase 8 inherits
  e2e test infra at `apps/web/tests/integration/e2e/` (chunk 7.3b
  scaffolding) + integration test infra at `apps/web/tests/
  integration/` (Phase 7 testing.md canonical). Phase 8 net-new
  test infra: UI component tests (Framing #6) + cross-service
  orchestrator tests (Framing #3) + Modal fixture-mock tests
  (Framing #8). Scope-lock Round 1 adjudicates infrastructure
  ownership.
- **Sub-Q19 (Phase 8 observability surface).** Cross-service
  orchestrator (Framing #3) + post-v1 reconciliation orchestrator
  (Framing #2) + ledger extensions (Framing #4) may surface new
  observability requirements (log.info + trace_id propagation +
  audit event composition). Phase 8 scope-lock Round 1 adjudicates
  observability shape.
- **Sub-Q20 (Phase 8 cycle posture sequencing).** Phase 8 cycle
  shape: 4-6 scope-lock rounds + 3-N brief-drafting cycles + 3-N
  impl sessions + retrospective ceremony + terminal-close push.
  Phase 8 scope-lock close ratifies sequencing per Phase 7 precedent.

---

## §8 Phase 8 cycle posture + sequencing forecast

Per Phase 7 precedent at substantively-new-phase cycle grade.

**Scope-lock cycle expected.** 4-6 rounds (Phase 7 fired Round 1-4
+ cycle-close Round 5; Phase 8 analogous; potentially +1-2 rounds
if Layer 1 + Layer 2 + Layer 3 inheritance surfaces additional
adjudication needs).

**Brief-drafting cycle expected.** 3-N briefs (depending on scope-
lock chunk decomposition outcome). Per §6 8-framing enumeration:
likely 4-8 chunks at Phase 8 v1 close grade.

**Implementation cycle expected.** 3-N impl sessions (depending
on Path C SPLIT dispositions adjudicated at scope-lock cycle).

**Retrospective ceremony expected.** 3-commit T3>T4>T1 surface-
precedence per Phase 5.1 + 6.5 + 7 precedent. Layer 2 4-amendment
inheritance is materially heavier than Phase 7's 0-amendment
retrospective; Phase 8 retrospective Commit A grade may carry
substantial T3 work.

**Terminal-close push expected.** Phase 8 close grade per push-
terminal-close N=4 cumulative + Candidate #13 codification. Phase
8 close fires N=5 cumulative cross-phase observation; codification
graduation candidate at Phase 8 retrospective close (N=5
strengthens cross-phase pattern).

---

## §9 Risks and unknowns

Per Phase 7 §8 risks-and-unknowns inheritance shape (seven
subsections).

### §9.1 Path C invocation risk at scope-lock cycle

Depends on §6 scope framing adjudication outcomes. Framings #4
(ledger extensions multi-chunk) + #6 (UI test infrastructure
combined-grade ~850-1520 LOC) are leading Path C invocation
candidates per §6.9 forecast posture. Mitigation: Phase 8 scope-
lock Round 1 adjudicates Path C invocation at sub-question-
anchored grade per multi-axis discipline.

### §9.2 Multi-layer inheritance overhead risk at scope-input authoring

Phase 8 §-structure heavier than Phase 7 anchor (this artifact's
forecast at ~1100-1800 LOC per Iteration 2 recalibration; Phase 7
anchor 599 LOC; Phase 8 carries 3-layer inheritance enumeration
absent at Phase 7). Mitigation: §-structure inheritance template
mirrored from Phase 7 + Phase 8-specific extensions enumerated at
§3 + §4 + §5 inheritance inventories; cycle posture forecast at §8.

### §9.3 ADR amendment cycle overhead risk at Layer 2 4-amendment surface

Phase 7 was low-T3-amendment cycle (Commit A `29d8277` was F-J-14
amendment only; Commit B `df64956` was T4 convention codifications;
Commit C `97f86ed` was T1 writeup). Phase 8 inheriting 4 ADR
amendments at Layer 2 is materially heavier T3 work. Mitigation:
Phase 8 retrospective Commit A may stage T3 amendments in batches
(e.g., bundled per substrate-pairing item #A+§3.1 + item #B+§3.2
+ item #C+§3.5 + item #D+§3.8); scope-lock cycle may surface T3
amendments at chunk-impl grade (substrate-amendment pairing) or
defer to retrospective close (centralized T3 ceremony).

### §9.4 Volume forecast uncertainty across §6 8-framing surface

Each framing has substantively different scope band: §6.1 sub-
chunk ~100-300 LOC vs §6.4 multi-chunk TBD vs §6.6 combined-grade
~850-1520 LOC. Mitigation: Phase 8 scope-lock Round 1 per-framing
volume re-estimate at chunk-grade adjudication; per-chunk forecast
band at chunk brief-drafting grade per Phase 7 chunk-brief
precedent.

### §9.5 v1 close demo completion item #9 timing

Phase 8 sub-chunk per §6.1 framing #1. Item #9 demo re-fire is
founder action (single demo session warm Modal + calibrated timeout
+ same fixture set + same demo runner script); should be a single
operational fire post-item #8 ADR amendment + client.ts fix +
re-deploy. Mitigation: Phase 8 first chunk (sub-chunk per §6.1)
sequences items #7 + #8 + #9 in tight bundle; demo re-fire fires
at chunk close (1-of-3 → 3-of-3 evidence absorption).

### §9.6 Brainstorming-side metafact drift family inheritance

Phase 7 retrospective §6.3 (α) directive-grade citation N=4 non-
fire evidence + Phase 8 scope-input §1.2 (α-β-γ) divergence
absorption (this artifact). Phase 8 inherits the discipline; verify-
from-disk grounding required throughout (Layer 1 inventory items +
Layer 2 ADR locations + Layer 3 codification candidate routing).
Mitigation: anti-drift prospective-firing sub-discipline
(scope-lock.md Candidate #3 codification) applied at Phase 8
scope-lock Round 1 directive grade + chunk brief-drafting grade +
chunk-impl grade.

### §9.7 ADR ratification dependencies

Layer 2 amendments (items #A + #B + #C + #D) may forward-point to
additional dependencies surfaced at Phase 8 scope-lock cycle Round
1. Item #A may depend on ADR-0010 admit discipline extension; item
#B may depend on ADR-0007 Q30 + new ADR Q-numbers; item #C may
depend on ADR-0007 OR ADR-0011 location adjudication (Sub-Q11);
item #D ADR-0014 §12.1 extends prior 2026-05-20 Amendment.
Mitigation: Phase 8 scope-lock Round 1 enumerates ADR ratification
dependency graph + adjudicates ratification sequencing (T3 ordering
at retrospective Commit A grade).

---

## §10 Decision points — what downstream sessions adjudicate at each grade

Per Phase 7 §9 inheritance shape (five subsections).

### §10.1 Scope-lock cycle adjudicates

Sub-questions from §7 + chunk decomposition + Path C invocation
evaluation at sub-question-anchored grade + library/framework
choices + §6 framing prioritization (Sub-Q16) + ADR ratification
sequencing (§9.7). Phase 8 scope-lock Round 1 walks the §7 sub-
question catalog (~15-25 sub-questions per Phase 7 §4 precedent)
+ surfaces any net-new sub-questions from Phase A reads.

### §10.2 Chunk brief drafting adjudicates

Per-chunk acceptance criteria + per-chunk test matrix + per-chunk
risk catalog + per-chunk verify-from-disk targets + per-chunk
forecast band. F-J-14 Grain 1 (brief-draft prospective) evaluation
fires here. Per §3 Layer 1 + §4 Layer 2 substrate-amendment
pairings, per-chunk briefs may surface paired-amendment chunk
shape (substrate + ADR amendment in same chunk vs separate chunks).

### §10.3 Chunk implementation adjudicates

Path C reactive invocation (F-J-14 Grain 3 mid-impl-reactive) +
per-stage implementation details + ADR amendment candidates if
substrate evidence surfaces unforeseen ADR drift (Phase 8 chunk-
impl grade may surface (α) directive-grade citation N=5+ banking
toward graduation per §5.2.1).

### §10.4 Phase 8 retrospective adjudicates

T3 ADR amendments per Layer 2 4-amendment inheritance (§9.3 cycle
overhead) + T4 convention codifications per Layer 3 15-codification-
candidate inheritance (§5 enumeration) + T1 retrospective writeup.
Retrospective Commit A grade may stage T3 amendments in batches;
Commit B grade ships T4 codifications; Commit C grade ships T1
writeup. Push-terminal-close N=5 codification refinement candidate
fires at Commit C close.

### §10.5 v1 close adjudicates

3-of-3 demo success grade per Layer 1.B item #9 (§3.B) + post-v1
amendment cycle prioritization (Sub-Q16 framing prioritization at
scope-lock close). v1 close gate 19 verbatim closure fires at item
#9 demo re-fire.

---

## §11 Cross-references

### §11.1 Phase 7 close trilogy (direct inheritance)

- Session 40 chunk 7.3b impl commit: `ab0f7fe` (feat(agent): Phase
  7 chunk 7.3b impl — ProposedMutation/ProposedAttachment/
  ProposedMutationBundle greenfield + canvasDirective proposed_
  attachment_card 5-surface + DocumentCard state machine + Stage
  7 commit composite + 3-doc-type e2e demo).
- Session 41 retrospective: `docs/07_governance/retrospectives/
  phase-7-retrospective.md` (660 LOC; commits A `29d8277` + B
  `df64956` + C `97f86ed`).
- Session 42 substrate close: `docs/09_briefs/phase-7/2026-05-20-
  phase-7-v1-close-demo-close-report.md` (~327 LOC; commit
  `96eae39`).

### §11.2 Phase 7 scope-input precedent (§-structure template)

- Phase 7 scope-input artifact: `docs/09_briefs/phase-7/2026-05-19-
  phase-7-extraction-scope-input.md` (599 LOC; Session 27 commit
  `8ae3886`). Canonical §-structure inheritance anchor for Phase 8
  scope-input.
- Phase 6.5 scope-input: does not exist (Phase 6.5 was amendment
  cycle, not substantively-new-phase cycle).

### §11.3 Phase 5.1 retrospective precedent (amendment-cycle posture)

- Phase 5.1 retrospective: `docs/07_governance/retrospectives/
  phase-5.1-retrospective.md` (amendment-cycle precedent;
  differentiated from Phase 7 + Phase 8 substantively-new-phase
  cycle posture).

### §11.4 ADR substrate

- ADR-0007 Three-Tier Agent Architecture: `docs/07_governance/adr/
  0007-three-tier-agent-architecture.md` (Q30 Logic Receipt lines
  482-489; §Tier 2 safety contract lines 208-235).
- ADR-0010 Reserved Enum States: `docs/07_governance/adr/0010-
  reserved-enum-states.md` (admit discipline lines 73-131).
- ADR-0011 Document Platform: `docs/07_governance/adr/0011-
  document-platform.md` (§1 spine sequencing lines 116-117; §13
  ENUM enumeration lines 751-790).
- ADR-0014 Tier 2 Document Pipeline: `docs/07_governance/adr/
  0014-tier-2-document-pipeline.md` (§12.1 transient retryable
  lines 980-1013; Amendment 2026-05-20 at line 1009; §7 Reserved
  Tier B classifier lines 600-609).
- ADR-0018 Relationship Router: `docs/07_governance/adr/0018-
  relationship-router.md` (Subsystem 1 Ledger-State Candidate
  Completion lines 276-505). **Corrects Phase 7 retrospective §6.3
  cross-reference (γ-2 absorption): Phase 8 ledger extensions
  activation surface is ADR-0018 Subsystem 1, NOT ADR-0014 §7
  Reserved Tier B classifier.**
- ADR-0019 Lifecycle FSM: `docs/07_governance/adr/0019-*` (status
  verified at Phase 7 scope-input §2.4 as ratified active).

### §11.5 Convention substrate (Phase 7 retrospective Commit B)

- `docs/04_engineering/conventions/session/scope-lock.md` (Phase 7
  evidence accretion lines 582-729; Candidates #3 + #4 + #5).
- `docs/04_engineering/conventions/session/plan-authoring.md`
  (Phase 7 codifications lines 798-1090; Candidates #1 + #6 + #7
  + #9).
- `docs/04_engineering/conventions/testing.md` (Phase 7 codification
  lines 62-124; Candidate #8 test-location canonical path).
- `docs/04_engineering/conventions/service-layer.md` (Phase 7
  codification lines 335-466; Candidate #11 substrate-shim framing
  + Phase 8 forward-pointer).
- `CLAUDE.md` (Push-readiness three-condition gate lines 129-197;
  Push-terminal-close timing pattern lines 169-196; Candidate #13).
- `docs/07_governance/friction-journal.md` lines 12689-12800
  (F-J-14 three-grain catalog + Phase 7 fourth-instance cross-
  validation entry).

### §11.6 Next operational fire

Session 44 Phase 8 scope-lock cycle Round 1 directive. Round 1
walks §7 sub-question catalog (~15-25 sub-questions) + surfaces
net-new sub-questions from Phase A reads. Adjudicates Layer 1 + 2
+ 3 inheritance disposition at sub-question-anchored grade.

---

*Phase 8 scope-input artifact at brainstorming-side onset grade.
Session 43 closes with this artifact + commit per Phase C. Push
fires at Phase 8 retrospective close per push-terminal-close N=4
cumulative + Candidate #13 codification. Co-Authored-By: Claude
Opus 4.7 (1M context).*
