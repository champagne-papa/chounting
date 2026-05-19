# Phase 7 Extraction Pipeline — Scope-Lock Cycle Round 4 (Final-Lock Cycle)

**Session:** 31
**Date:** 2026-05-19
**Branch:** `staging`
**Local HEAD at session-onset:** `aa3d3c8` (Phase 7 scope-lock cycle Round 3)
**`origin/staging` HEAD:** `4aea7e2` (4 commits behind local; banks for Phase 7 terminal-close push)
**Validation gates at session-onset:** `pnpm agent:validate` 26/26 green (preserved through Round 3 docs-only commit).
**Predecessor:** Phase 7 scope-lock cycle Round 3 at `aa3d3c8` (`docs/09_briefs/phase-7/2026-05-19-phase-7-scope-lock-cycle-round-3.md`; 500 LOC).

---

## §1 — Preamble + cross-references

### §1.0 What this round is

This is **Round 4** of the Phase 7 extraction pipeline scope-lock cycle — **the final-lock cycle per Phase 5.1 Round 4 precedent**. Round 4 walks the **7-sub-question batch** per Round 3 §6.2 prompt inputs: UI consumer detail (Sub-Q15 + Sub-Q19 + Sub-Q20) + chunk decomposition (Sub-Q21 + Sub-Q22) + Modal sidecar placement final lock (Sub-Q23; inherits chunk 7.1 from Sub-Q5 Path A) + observability cross-cutting (Sub-Q25). Round 4 close should surface scope-lock-cycle-readiness for Round 5+ brief-drafting + cycle-close.

### §1.1 Walk-order discipline

Round 4 walks UI consumer detail first (Sub-Q15 → Sub-Q19 → Sub-Q20) per coupling discipline: Sub-Q15 extraction-result UI render shape gates Sub-Q19 canvasDirective member shape (carries the UI render payload) which gates Sub-Q20 PendingDocumentsView render (consumes the directive member). After UI consumer batch, walk chunk decomposition (Sub-Q21 → Sub-Q22 → Sub-Q23): Sub-Q21 chunk count + boundaries gates Sub-Q22 shipping order; Sub-Q23 inherits chunk 7.1 placement from Sub-Q5 Path A lock. Sub-Q25 (observability) walked last as cross-cutting concern.

### §1.2 Anti-drift discipline application outcomes

Per directive anti-drift discipline notes (prospective application at directive grade per Round 2 + Round 3 precedent): four sub-questions had anti-drift framings in the directive. Round 4 walk evidence:

**Sub-Q15 sub-axis (b) resolves cleanly at Round 4 — no brief-grade deferral needed.** Walk evidence per Phase A reads:

- `ingestionService.handleDragDropUpload` returns aggregate batch shape (`{ ingest_batch_id: string; document_count: number }`) — single batch with N source documents per drag-drop event; ingest_batch_id propagates through pipeline.
- `PendingDocumentsView` state machine (`idle | fetching_recent | idle_with_recent_cards | fetching_batch | showing_batch | error`) renders FLAT grid of `DocumentCard` per-case; `showing_batch` state batch-filters via `ingestBatchId` prop (cards for one batch); `idle_with_recent_cards` renders recent-N across batches.
- Pattern γ Rule 1 (`handleDropEvent`) opens **one tab per batch** with ingest_batch_id encoded (handleDropEvent at SplitScreenLayout fires after ingest 201).

The substrate evidence resolves sub-axis (b) cleanly: per-batch tab opens at drop; PendingDocumentsView at `showing_batch` state renders N cards per batch within that tab; each card represents one source document's case. The brainstorming-side lean for brief-grade deferral was a safety hedge that walk evidence dissolves — Round 4 locks both sub-axes (a) + (b).

**Sub-Q19 naming-convention finding.** Walk evidence per Phase A step 5 canvasDirective union substrate at `apps/web/src/shared/schemas/canvas/canvasDirective.schema.ts`: existing 39 members use **snake_case underscored single-action grain** (`chart_of_accounts`, `journal_entry`, `proposed_entry_card`, `report_pl`, etc.). NO dot-namespaced members at v1. The directive's hypothetical "extraction.result_ready" framing was drift from existing convention. Lock at single new `proposed_attachment_card` member at v1 (snake_case parallel to existing `proposed_entry_card`).

**Sub-Q21 F-J-14 banking discipline outcome.** Walk evidence per Phase A step 15 F-J-14 catalog read: the catalog has **three grains** explicitly:

- **Grain 1 — Brief-draft prospective:** Path C evaluated at chunk-brief drafting when scope-lock surfaces volume + framing arithmetic crossing single-session-reliable-delivery bound.
- **Grain 2 — Phase-A-close prospective:** Path C evaluated at Phase A close when implementation-onset substrate-load surfaces volume arithmetic crossing reliable-delivery bound.
- **Grain 3 — Mid-impl reactive:** Path C evaluated mid-implementation when in-flight framing-revisits accumulate beyond single-session budget.

The directive's anti-drift framing presumed "Grains 1+2+3 are all impl-grade" — empirically inaccurate. **Grains 1 + 2 are prospective surfaces at chunk-brief and impl-onset grades respectively; only Grain 3 is reactive.** Scope-lock-cycle Round 4 grade is EARLIER than Grain 1 (chunk-brief is post-scope-lock-cycle-close per Phase 5.1 sequencing). Sub-Q21 Option (2) 4-chunk pre-allocation at scope-lock-cycle grade WOULD introduce a new sub-grain earlier than Grain 1 — call it "Grain 0 scope-lock-cycle prospective" — but Option (1) defer-to-Grain-1 stays within existing catalog. The directive's anti-drift framing for Sub-Q21 was partially correct (Option 2 IS earlier than catalog grains) but mis-characterized the catalog grains as impl-grade-only.

Lock at Option (1) defer-to-Grain-1 — 3-chunk decomposition at scope-lock-cycle grade; Path C invocation deferred to chunk 7.1 brief-drafting per F-J-14 Grain 1 prospective. No new sub-grain codification needed; existing catalog supports the disposition.

**Sub-Q25 observability locks cleanly at chunk-by-chunk-incremental** per Sub-Q24 inheritance + Phase 5.1/6.5 precedent. No anti-drift firing.

### §1.3 Anti-drift cumulative banking at Round 4 close

The directive's four anti-drift framings produced three substantive findings at walk grade:

1. **Sub-Q15 sub-axis (b) substrate-evidence-resolves-against-pre-emptive-deferral** (lean for brief-grade deferral was unnecessary; walk evidence resolves at Round 4) — sub-shape variant: pre-emptive-deferral-lean-overridden-by-substrate.
2. **Sub-Q19 naming-convention drift** (directive hypothesized dot-namespaced new members against snake_case existing convention) — option-space-framing-against-substrate sub-shape, naming-convention sub-grain.
3. **Sub-Q21 F-J-14 catalog-grain-characterization drift** (directive framed Grains 1+2+3 as impl-grade-only; catalog actually has Grain 1+2 prospective + Grain 3 reactive) — option-space-framing-against-substrate sub-shape, catalog-substrate-characterization sub-grain.

Cumulative banking: option-space-framing-against-substrate sub-shape catalog **graduates to N=8 instances** at Round 4 close (5 at Round 3 close + 3 at Round 4 walk: Sub-Q15.b + Sub-Q19 + Sub-Q21). Sub-grain refinements: brainstorming-side-lean drift (Sub-Q1 + Sub-Q12 + Sub-Q15.b) + directive-grade-candidate-enumeration drift (Sub-Q13 + Sub-Q19) + catalog-substrate-characterization drift (Sub-Q21) + scope-input-artifact-authoring drift (5 Round 1 divergences). **Codification candidate materially supported at Phase 7 retrospective grade.**

### §1.4 Substrate-density-compresses-LOC observation continuation

Round 3 §1.5 N=4 banking achieved (599 + 310 + 486 + 500 LOC; four-grain consistency at sub-curve (b) below-floor compression). Round 4 forecast at ~500-900 LOC per per-sub-question walk depth at 7 sub-questions with high lock-disposition density. **N=5 banking candidate at compression trajectory continuation if Round 4 LOC lands in or below band.**

### §1.5 Canonical cross-references

- **Round 3 artifact** at `docs/09_briefs/phase-7/2026-05-19-phase-7-scope-lock-cycle-round-3.md` (`aa3d3c8`) — predecessor; Round 4 prompt inputs at §6.2.
- **Phase 7 onset scope-input artifact** at `docs/09_briefs/phase-7/2026-05-19-phase-7-extraction-scope-input.md` (`8ae3886`) — sub-question option-space framing.
- **ADR-0014 §1 + §8 + §11 + §12** — chunk decomposition stage sequence + trace propagation + ProposedAttachment v1 variants + audit event shapes.
- **ADR-0020 §1** — `agent/orchestrator/extraction/` placement (Round 3 lock inheritance).
- **`apps/web/src/shared/schemas/canvas/canvasDirective.schema.ts`** — canvasDirective discriminated union 39-member substrate; snake_case naming convention.
- **`apps/web/src/components/canvas/PendingDocumentsView.tsx`** — state machine + DocumentCard render contract.
- **`apps/web/src/components/bridge/SplitScreenLayout.tsx`** — three-zone layout + Pattern γ source-driven routing.
- **`apps/web/src/services/document-platform/ingestionService.ts`** — `handleDragDropUpload` aggregate-batch return shape.
- **`docs/04_engineering/conventions/session/scope-lock.md` §Session-budget-feasibility verification + Path C invocation conditions (RI-7)** — Path C discipline; F-J-14 cross-reference.
- **`docs/07_governance/friction-journal.md`** F-J-14 entries + 2026-05-15 second-instance graduation entry + 2026-05-17 third-instance consolidation entry — three-grain catalog substrate.
- **Phase 5.1 chunks 5.1a + 5.1b + 5.1c briefs** at `docs/09_briefs/phase-5.1/chunks/` — chunk-grain (single-chunk-atomic substrate + service + governance) + shipping-order discipline (substrate-first within chunk).
- **Phase 6.5 chunks 1 + 2 + 3 briefs** at `docs/09_briefs/phase-6.5/chunks/` — chunk grain at UI-driven Phase 6.5 precedent.

---

## §2 — Per-sub-question walk

Walk-order Sub-Q15 → Sub-Q19 → Sub-Q20 → Sub-Q21 → Sub-Q22 → Sub-Q23 → Sub-Q25 per §1.1.

### §2.1 Sub-Q15 — Extraction-result UI render shape (anti-drift discipline applied; both sub-axes lock at Round 4)

**Option space (scope-input §4.3 + directive anti-drift split):**

- **Sub-axis (a) proposal-card type:** ProposedEntryCard (per ADR-0011 §11) vs ProposedAttachmentCard (per ADR-0014 §11 v1 variants) vs both-paths-bifurcated per Sub-Q18 inheritance. Governance-critical.
- **Sub-axis (b) render granularity:** single document (per-source-document tab) vs grouped-by-batch (per-batch tab with N cards). Product-discovery UX-grade.

**Substrate evidence:**

- ADR-0014 §11 ProposedMutation / ProposedMutationBundle / ProposedAttachment routing per document type + extraction completeness.
- Sub-Q18 lock (Round 2): bifurcated receipt routing — matching-prior-payment → ProposedAttachment.attach_payment_evidence; no-matching → exception queue.
- `ingestionService.handleDragDropUpload` returns `{ ingest_batch_id: string; document_count: number }` (Phase A step 8) — aggregate batch shape; N source documents per batch.
- `PendingDocumentsView` state machine renders flat grid of DocumentCard per-case; `showing_batch` state batch-filters via `ingestBatchId` prop (Phase A step 7).
- `SplitScreenLayout` Pattern γ Rule 1 (`handleDropEvent` → routeNewTab without focusExistingExactMatch) opens **one tab per batch** with ingest_batch_id encoded (Phase A step 8).

**Walk:**

Sub-axis (a) — proposal-card type bifurcation per Sub-Q18 inheritance:

- `vendor_invoice` + `payment_confirmation` classifications produce ProposedMutation / ProposedMutationBundle → render via `proposed_entry_card` canvasDirective (existing Phase 1.1 member).
- `receipt` classification with matching-prior-payment produces ProposedAttachment (attach_payment_evidence) → render via NEW `proposed_attachment_card` canvasDirective (Phase 7 net-new; Sub-Q19 below).
- `receipt` classification without matching-prior-payment + `unknown` classifications route to exception queue (no UI render at Phase 7 substrate; existing exception-queue UI consumes).

Sub-axis (b) — render granularity:

- handleDragDropUpload returns aggregate batch; Pattern γ Rule 1 opens one tab per batch; PendingDocumentsView at showing_batch state renders N cards per batch within that tab.
- Phase 7 extraction completes per source document (Stage 7 buildProposal per-document); each completion updates the corresponding DocumentCard state (per-case grain) within the existing batch tab.
- Render granularity is **per-card-update within per-batch-tab** — substrate evidence resolves the sub-axis without brief-grade deferral. PendingDocumentsView contract doesn't need state machine extension; DocumentCard per-card state machine extends to include post-classification render state (chunk 7.3 grade).

**Disposition:** **Lock at both sub-axes.**

- Sub-axis (a): bifurcated render per Sub-Q18 inheritance — `proposed_entry_card` for vendor_invoice + payment_confirmation; `proposed_attachment_card` (NEW; Sub-Q19) for receipt + matching-prior-payment; no UI render for exception queue path.
- Sub-axis (b): per-card update within per-batch tab; PendingDocumentsView consumes DocumentCard state extension at chunk 7.3 grade. No PendingDocumentsView state machine extension needed.

Anti-drift outcome: substrate evidence resolved sub-axis (b) cleanly at Round 4; brainstorming-side lean for brief-grade deferral was unnecessary. Bank at §6.3 as pre-emptive-deferral-lean-overridden-by-substrate sub-shape variant.

### §2.2 Sub-Q19 — canvasDirective new-member shape (anti-drift discipline applied; naming-convention lock)

**Option space (directive anti-drift framing):**

- Single new member with hypothetical naming (e.g., `extraction.result_ready`).
- Multiple new members (e.g., `extraction.result_ready` + `extraction.exception_queued` + `extraction.classification_failed`).
- Single new member with snake_case convention.

**Substrate evidence:**

- `canvasDirective.schema.ts` enumerates 39 members per Phase 6.5 close; all members use **snake_case underscored single-action grain** (`chart_of_accounts`, `journal_entry`, `proposed_entry_card`, `report_pl`, `recurring_template_list`, etc.).
- NO dot-namespaced members at v1; the hypothetical `extraction.*` framing drifts from existing convention.
- Existing `proposed_entry_card` member (Phase 1.1) consumes ProposedEntryCardInputSchema; serves as PARALLEL anchor for Phase 7's new ProposedAttachment render path.
- Sub-Q15 sub-axis (a) lock: bifurcated render (proposed_entry_card existing + proposed_attachment_card NEW).

**Walk:**

The directive's "extraction.result_ready" framing presumed dot-namespaced new members — but existing convention is snake_case. The naming-convention drift is option-space-framing-against-substrate sub-shape (naming-convention sub-grain). Walk-grade correction: new member name follows snake_case convention.

Phase 7 net-new canvasDirective member at v1: `proposed_attachment_card` (parallel to existing `proposed_entry_card`). Member shape: Zod discriminated union variant carrying ProposedAttachmentInputSchema (analogous to `proposed_entry_card` carrying ProposedEntryCardInputSchema). Render shape: render via existing canvas tab routing (Pattern γ inheritance); rendered within batch tab PendingDocumentsView's DocumentCard.

ProposedMutationBundle (v1 active type: `born_paid_bill`) render shape: walks via existing `proposed_entry_card` member with bundle-shape embedded in ProposedEntryCardInputSchema, OR adds separate `proposed_mutation_bundle_card` member. Defer to chunk 7.3 brief-grade (rare enough at v1 to not warrant Round 4 lock; ProposedMutationBundle bundle-render UX is product-discovery grade).

**Disposition:** **Lock at single new `proposed_attachment_card` canvasDirective member at v1; snake_case convention.** ProposedMutationBundle render shape deferred to chunk 7.3 brief-grade (product-discovery sub-axis).

Anti-drift outcome: naming-convention drift caught prospectively; bank at §6.3 as directive-grade option-space-framing-against-substrate sub-shape (naming-convention sub-grain; parallels Sub-Q13 directive-candidate-enumeration drift but at naming-convention grade).

### §2.3 Sub-Q20 — PendingDocumentsView post-classification render

**Option space (scope-input §4.5):**

- In-place render update (existing PendingDocumentsView renders extraction result in same view) vs split-screen render (extraction result opens in new tab per Pattern γ source-driven routing).
- PendingDocumentsView consumes existing DocumentCard contract vs PendingDocumentsView state machine extension for post-classification state.

**Substrate evidence:**

- PendingDocumentsView at `showing_batch` state renders flat grid of DocumentCard per-case; ingestBatchId prop drives batch-filter.
- Pattern γ Rule 1 already opens one tab per batch at drop event (Phase 6.5 chunk 2 ship); Phase 7 extraction completes within existing batch tab.
- DocumentCard per-card state currently renders pre-classification state (per Phase 6.5 chunk 3 ship); Phase 7 extension adds post-classification state to DocumentCard.

**Walk:**

PendingDocumentsView contract is consumer-of-DocumentCard at per-case grain. Post-classification render is downstream of DocumentCard per-card state extension — Phase 7 extends DocumentCard render state (pre-classification → classifying → post-classification → reviewing → committed), NOT PendingDocumentsView state machine. The PendingDocumentsView state machine (`idle | fetching_recent | idle_with_recent_cards | fetching_batch | showing_batch | error`) doesn't need new members for post-classification — the state-machine drives BATCH-LEVEL view selection; DocumentCard drives PER-CARD state.

In-place render update (within existing batch tab) is the substrate-aligned path — Pattern γ Rule 1 opens one tab per batch at drop; extraction completion updates the existing batch tab's cards in place.

**Disposition:** **Lock at PendingDocumentsView consumes DocumentCard per-card state via existing contract; no PendingDocumentsView state machine extension. DocumentCard per-card state extension at chunk 7.3 brief-grade.**

Phase 7 chunk 7.3 brief-drafting addresses DocumentCard state machine extension (pre-classification → classifying → post-classification → reviewing → committed) + per-card render of `proposed_attachment_card` / `proposed_entry_card` shapes.

### §2.4 Sub-Q21 — Phase 7 chunk count + boundaries (anti-drift + F-J-14 discipline applied)

**Option space (per directive):**

- **Option (1) 3-chunk decomposition:** chunk 7.1 orchestrator skeleton + Modal sidecar; chunk 7.2 classifier + dedup; chunk 7.3 extractor + matcher + proposal + UI. Path C invocation at chunk 7.1 deferred to brief-drafting grade per F-J-14 Grain 1 prospective.
- **Option (2) 4-chunk pre-allocation at scope-lock-cycle grade:** chunk 7.1a orchestrator skeleton + chunk 7.1b Modal sidecar + chunk 7.2 classifier + dedup + chunk 7.3 extractor + matcher + proposal + UI. Pre-allocates Path C invocation at scope-lock-grade.

**Substrate evidence:**

- F-J-14 catalog at friction-journal: **three grains** explicitly enumerated.
  - Grain 1 — Brief-draft prospective (chunk-brief grade).
  - Grain 2 — Phase-A-close prospective (impl-onset grade).
  - Grain 3 — Mid-impl reactive.
- Grains 1 + 2 are PROSPECTIVE surfaces; Grain 3 is REACTIVE. The directive's "Grains 1+2+3 are impl-grade only" framing was empirically inaccurate.
- RI-7 substrate at scope-lock.md §Session-budget-feasibility verification: Path C invocation conditions include "volume estimators sum exceeds single-session reliable delivery band" + "scope-lock surfaces N framing-revisits (typically N≥3)" + "substantively-novel-logic scope."
- Scope-input §5 framing: 3-chunk decomposition at brainstorming-side onset grain.
- Sub-Q5 Path A lock (Session 29 founder-decision): chunk 7.1 absorbs Modal substrate; Path C invocation candidate carried forward at chunk 7.1 brief-drafting grade per F-J-14 Grain 1 prospective.

**Walk:**

The directive's anti-drift framing presumed Sub-Q21 Option (2) at scope-lock-cycle grade would introduce a new sub-grain (since "Grains 1+2+3 are impl-grade only"). Walk evidence overrides: Grains 1 + 2 ARE prospective. Scope-lock-cycle Round 4 grade IS earlier than Grain 1 (chunk-brief), so Option (2) WOULD introduce a new sub-grain earlier than Grain 1 — call it "Grain 0 scope-lock-cycle-prospective" if invoked. But Option (1) defer-to-Grain-1 stays within existing catalog without introducing new sub-grain.

Substantive question: does scope-lock-cycle-grade evidence support Option (2) pre-allocation, OR does the evidence support Option (1) defer-to-brief-grade?

Per RI-7 substrate: Path C invocation conditions are volume + framing + novelty arithmetic. At Round 4 scope-lock-cycle grade, Phase 7 chunk 7.1 forecast is approximately 1400-2200 LOC (per Session 29 Sub-Q5 walk evidence with Modal substrate absorption). This forecast confidence is "middling-not-high" per Session 29 brainstorming-side walk — the LOC translation involves unknowns (Python authorship greenfield-vs-adapted; Modal CLI declarative-vs-substantive; HMAC thin-wrapper-vs-substantive).

At Grain 1 brief-drafting grade, chunk 7.1 brief walks Modal substrate-load directly + produces tighter LOC forecast + adjudicates Path C invocation per RI-7 arithmetic with high evidence-density. Option (1) defer-to-Grain-1 is the operationally-cleaner shape — brief-drafting walk has the substrate evidence Round 4 lacks.

**Disposition:** **Lock at Option (1) 3-chunk decomposition at scope-lock-cycle grade.** Phase 7 chunk decomposition per scope-input §5:

- **Chunk 7.1** — Orchestrator skeleton + Modal sidecar deployment (Stage 0 dedup + Stage 1 byte fetch + Stage 2 OCR active; Stages 3-7 stub).
- **Chunk 7.2** — Classifier (Tier A + Tier C + Tier D) + dedup integration + org_settings substrate-add migration (5 ADR-0014 columns + 6 ADR-0019 columns per Round 3 §1.4 finding) + classification stage active.
- **Chunk 7.3** — Field extractor + vendor matcher + relationship-candidate + proposal-building + UI consumer wires (canvasDirective `proposed_attachment_card` extension + DocumentCard state machine extension per Sub-Q19 + Sub-Q20 locks).

Path C invocation candidate at chunk 7.1 carries forward to brief-drafting grade per F-J-14 Grain 1 prospective. If chunk 7.1 brief-drafting walks confirm LOC explosion (above RI-7 single-session ceiling per chunk-3-Phase-4 empirical bound: 8 files + 1 migration + 1 types.ts + 5 framings), chunk 7.1 splits to chunk 7.1a (orchestrator skeleton) + chunk 7.1b (Modal sidecar) at brief-grade per Grain 1.

Anti-drift outcome: F-J-14 catalog-grain-characterization drift caught prospectively (directive presumed impl-grade-only); banking framing tightened to within-existing-catalog. Bank at §6.3 as catalog-substrate-characterization sub-grain of option-space-framing-against-substrate sub-shape.

### §2.5 Sub-Q22 — Chunk shipping order

**Option space (per Sub-Q21 disposition outcome):**

- Sub-Q21 locked at 3-chunk: shipping order adjudicates 7.1 → 7.2 → 7.3 (canonical sequence) vs alternative orderings.

**Substrate evidence:**

- ADR-0014 §1 orchestrator stage sequence: dedup → fetch → OCR → classification → extraction → vendor matching → relationship candidate → proposal building. Sequential dependency.
- Chunk 7.1 ships Stages 0-2 active; chunk 7.2 ships Stage 3 active (depends on chunk 7.1 OCR substrate); chunk 7.3 ships Stages 4-7 active (depends on chunk 7.2 classification substrate).
- Phase 5.1 + Phase 6.5 chunk shipping precedent: substrate-first within chunk; canonical-dependency-order across chunks.

**Walk:**

Sequential dependency dictates 7.1 → 7.2 → 7.3 canonical order. Alternative orderings (e.g., classifier-first at 7.2 → orchestrator-second at 7.1) would require classifier to stub orchestrator interface during dependency inversion — operational complexity not justified by any compensating benefit. Canonical sequence is the substrate-aligned path.

**Disposition:** **Lock at canonical sequence 7.1 → 7.2 → 7.3.** Phase 7 chunks ship in order. If chunk 7.1 splits to chunk 7.1a + chunk 7.1b at brief-grade per F-J-14 Grain 1, sequence extends to 7.1a → 7.1b → 7.2 → 7.3.

### §2.6 Sub-Q23 — Modal sidecar chunk placement final lock

**Option space (per Sub-Q5 Path A inheritance):**

- Lock at chunk 7.1 placement per Sub-Q5 Path A founder-decision (Session 29).

**Substrate evidence:**

- Sub-Q5 Path A lock (Session 29): chunk 7.1 absorbs Modal substrate.
- Sub-Q21 Option (1) lock (Round 4 above): 3-chunk decomposition at scope-lock-cycle grade; Path C invocation at chunk 7.1 deferred to brief-drafting grade.

**Walk:**

Sub-Q23 final lock is essentially inheritance-confirmation: chunk 7.1 placement holds per Sub-Q5 Path A. Path C invocation framing at brief-drafting-prospective grade is handled at Sub-Q21 disposition.

**Disposition:** **Lock at chunk 7.1 placement (inherited from Sub-Q5 Path A); Path C invocation deferred to chunk 7.1 brief-drafting grade per F-J-14 Grain 1 prospective (Sub-Q21 inheritance).** If chunk 7.1 brief-grade walk surfaces Path C invocation, Modal substrate ships at chunk 7.1b (post-Path-C-split).

### §2.7 Sub-Q25 — Logging + observability

**Option space (per directive anti-drift framing):**

- Chunk-by-chunk-incremental (per Sub-Q24 + Phase 5.1/6.5 precedent) vs cross-cutting-pre-chunk-7.1 standalone-substrate-prep.

**Substrate evidence:**

- ADR-0014 §8 trace propagation: pipeline_trace JSONB column on document_artifacts; per-stage records emitted by orchestrator.
- ADR-0014 §12 audit event shapes: `pipeline_transient_retry` + `pipeline_transient_exhausted` + `pipeline_unavailable` + `extraction_failed` (verbatim).
- Sub-Q24 Round 2 lock: per-chunk-incremental test infra.
- Phase 5.1 + Phase 6.5 observability precedent: chunks ship observability incrementally (no pre-Phase observability-prep session).

**Walk:**

Cross-cutting-pre-chunk-7.1 standalone-substrate-prep was rejected at Sub-Q5 founder-decision grade (Session 29 Path A selected in-Phase-7 over Path B standalone-infra-session). The analogous adjudication for observability would inherit the rejection — observability substrate ships incrementally within chunks per established precedent.

ADR-0014 §8 + §12 commit observability primitives (pipeline_trace JSONB column + audit event shapes); each chunk ships the observability surface for its stages:

- Chunk 7.1 ships pipeline_trace emission for Stages 0-2 + Stage 2 Modal sidecar timeout audit events (§12.1 transient class).
- Chunk 7.2 ships classification stage pipeline_trace emission + Tier C AI fallback cost tracking + classification confidence audit events.
- Chunk 7.3 ships extraction stage pipeline_trace emission + per-field extraction conviction audit events.

**Disposition:** **Lock at chunk-by-chunk-incremental observability.** Each Phase 7 chunk ships its own observability surface (pipeline_trace emission + audit events + cost tracking). Cross-cutting observability tooling (dev-tools surfacing + metrics dashboards) defers to post-v1 amendment if surface materializes.

---

## §3 — Round 4 dispositions banked

| Sub-Q | Disposition | Lock detail |
|---|---|---|
| Sub-Q15 | **Lock at both sub-axes** | sub-axis (a) bifurcated render (proposed_entry_card existing + proposed_attachment_card NEW per Sub-Q19); sub-axis (b) per-card update within per-batch tab; PendingDocumentsView no state-machine extension |
| Sub-Q19 | **Lock** | single new `proposed_attachment_card` canvasDirective member at v1 (snake_case convention); ProposedMutationBundle render shape deferred to chunk 7.3 brief-grade |
| Sub-Q20 | **Lock** | PendingDocumentsView consumes DocumentCard per-card state via existing contract; DocumentCard per-card state extension at chunk 7.3 brief-grade |
| Sub-Q21 | **Lock at Option (1)** | 3-chunk decomposition at scope-lock-cycle grade; Path C invocation at chunk 7.1 deferred to brief-drafting per F-J-14 Grain 1 prospective |
| Sub-Q22 | **Lock** | canonical sequence 7.1 → 7.2 → 7.3 |
| Sub-Q23 | **Lock** | chunk 7.1 placement (inherited from Sub-Q5 Path A); Path C invocation framing at brief-grade per Sub-Q21 inheritance |
| Sub-Q25 | **Lock** | chunk-by-chunk-incremental observability per Sub-Q24 + precedent |

**Count:**

- **7 clean locks** at Round 4.
- **0 partial locks**.
- **0 brief-grade deferrals** (Sub-Q19 ProposedMutationBundle render + Sub-Q20 DocumentCard state extension defer to chunk 7.3 brief but are product-discovery sub-axes, not Round-4-grade partial-locks per Sub-Q27 pattern).
- **0 founder-decision-required**.
- **0 new sub-questions surfaced**.

**All 7 Round 4 sub-questions lock cleanly at Round 4 grade. Final-lock cycle complete.**

---

## §4 — Decision-class split disposition final state

Per Round 1 §4 decision-class split (16+1 = 17 governance-critical + 6 mixed + 4 product-discovery = 27 sub-questions at Round 2 close). Round 4 walks the final 7 sub-questions; updated final state:

**Governance-critical sub-questions all locked (17 of 17):**

- Sub-Q1 + Sub-Q1.b ✓ (Rounds 2 + 3)
- Sub-Q2 ✓ (Round 2)
- Sub-Q5 ✓ (Session 29 founder-decision-resolved)
- Sub-Q7 + Sub-Q8 ✓ (Round 3)
- Sub-Q11 + Sub-Q11.b ✓ (Rounds 2 + 3)
- Sub-Q12 ✓ (Round 3 anti-drift override)
- Sub-Q14 + Sub-Q14.b ✓ (Rounds 2 + 3)
- Sub-Q16 + Sub-Q17 + Sub-Q18 ✓ (Round 2)
- Sub-Q21 + Sub-Q22 + Sub-Q23 ✓ (Round 4)
- Sub-Q24 ✓ (Round 2)
- Sub-Q26 ✓ (Round 2)

**Mixed sub-questions all locked (6 of 6) — governance-critical surfaces at Round 3 + product-discovery surfaces deferred to brief-drafting:**

- Sub-Q3 + Sub-Q4 ✓ (Round 3; numeric values defer to chunk 7.1 brief)
- Sub-Q6 + Sub-Q9 ✓ (Round 3)
- Sub-Q10 ✓ (Round 3; specific fields defer to chunk 7.2 brief)
- Sub-Q13 ✓ (Round 3; per-field shape defers to chunk 7.2 brief)

**Product-discovery sub-questions all locked (4 of 4):**

- Sub-Q15 ✓ (Round 4; sub-axis (b) substrate-resolves at walk grade)
- Sub-Q19 ✓ (Round 4; ProposedMutationBundle render defers to chunk 7.3 brief)
- Sub-Q20 ✓ (Round 4; DocumentCard state extension defers to chunk 7.3 brief)
- Sub-Q25 ✓ (Round 4)

**Sub-Q27 (surfaced at Round 2) brief-grade deferral confirmed** — column-shape adjudication walks at chunk 7.2 brief alongside substrate-add migration (5 ADR-0014 columns + 6 ADR-0019 columns per Round 3 §1.4).

**Total Round 4 final state: 27 of 27 sub-questions locked at scope-lock-cycle grade with appropriate brief-grade deferrals for product-discovery sub-axes. Phase 7 scope-lock-cycle ready for Round 5+ cycle-close.**

---

## §5 — Round 5+ scope (scope-lock-cycle-close + brief-drafting plan)

### §5.1 Round 5 scope — Brief drafting plan + cross-chunk validation matrix

Round 4 final-lock cycle complete. Round 5 produces the **scope-lock-cycle-close ratification artifact** + **brief-drafting plan**:

- **Scope-lock-cycle-close ratification artifact** — single artifact consolidating the 27-sub-question locks across Rounds 1-4 + the carry-forward observations (anti-drift catalog graduations + substrate-density-compresses-LOC banking + directive-authoring multi-iteration refinement banking + Sub-Q26 substrate-scope expansion banking) + the Phase 7 retrospective codification candidates. Mirrors Phase 5.1 Round 4 final ratification artifact precedent.
- **Brief-drafting plan** — per-chunk brief enumeration: chunk 7.1 brief drafting session (orchestrator skeleton + Modal sidecar; Path C invocation evaluation at Grain 1 prospective) + chunk 7.2 brief drafting session (classifier + dedup + org_settings substrate-add migration) + chunk 7.3 brief drafting session (extractor + matcher + proposal + UI). 3 brief-drafting sessions minimum; potentially 4 if chunk 7.1 splits to 7.1a + 7.1b at brief-grade per F-J-14 Grain 1.

### §5.2 Round 6 scope (if needed)

If Round 5 surfaces unforeseen ratification gaps (e.g., cross-chunk dependency matrix incomplete, brief-drafting plan requires additional substrate verification), Round 6 closes the gaps. Otherwise Round 6 is optional — scope-lock cycle could close at Round 5 if Round 5 produces both ratification artifact + brief-drafting plan in one session.

### §5.3 Updated round count forecast

Round 1 forecast: 5-7 rounds.
Round 2 close: 5-7 rounds with batching compression.
Round 3 close: 6 rounds at well-calibrated middle.
**Round 4 close (final-lock cycle complete): 5-6 rounds total**. Round 5 ratifies cycle close (likely terminal); Round 6 contingent on Round 5 outcome.

### §5.4 Phase 7 chunk-brief drafting sequencing (per scope-input §7.3 framing)

Post-scope-lock-cycle-close sequencing:

1. **Session 32-33** (depending on Round 5/Round 6) — Phase 7 scope-lock cycle close.
2. **Session 33-34** — Phase 7 chunk 7.1 brief drafting (Path C invocation evaluation; possibly splits chunk 7.1 to 7.1a + 7.1b).
3. **Session 34-35** — Phase 7 chunk 7.2 brief drafting.
4. **Session 35-36** — Phase 7 chunk 7.3 brief drafting.
5. **Session 36+ onwards** — chunk implementations + Phase 7 retrospective + terminal-close push.

Total Phase 7 envelope per scope-input §7 framing: ~12-18 sessions (1 scope-input + 4 scope-lock rounds + Round 5+ cycle close + 3-4 brief-drafting sessions + 3-6 implementation sessions + retrospective ceremony + terminal-close push). Provisional pending Path C invocation outcomes at chunk-brief grade.

---

## §6 — Round 4 close

### §6.1 Round 4 dispositions banked summary

- **7 clean locks** at Round 4 (Sub-Q15 + Sub-Q19 + Sub-Q20 + Sub-Q21 + Sub-Q22 + Sub-Q23 + Sub-Q25).
- **0 partial locks** at Round 4 (Sub-Q15 sub-axis (b) substrate-resolves at walk grade; brief-grade deferral unnecessary).
- **0 founder-decision-required** at Round 4.
- **0 new sub-questions surfaced** at Round 4.
- **3 anti-drift discipline outcomes** at Round 4: Sub-Q15 sub-axis (b) substrate-evidence-resolves-against-pre-emptive-deferral (sub-shape variant); Sub-Q19 naming-convention drift (option-space-framing-against-substrate sub-shape, naming-convention sub-grain); Sub-Q21 F-J-14 catalog-grain-characterization drift (option-space-framing-against-substrate sub-shape, catalog-substrate-characterization sub-grain).

### §6.2 Scope-lock-cycle-readiness assessment

**ALL 27 sub-questions locked at scope-lock-cycle grade.** Phase 7 scope-lock cycle is **ready for Round 5+ cycle-close ratification**.

Ratification readiness conditions per Phase 5.1 Round 4 precedent:

- [x] All governance-critical sub-questions locked at scope-lock-cycle grade (17 of 17).
- [x] All mixed sub-questions locked at scope-lock-cycle grade with product-discovery sub-axes appropriately deferred to brief-grade (6 of 6).
- [x] All product-discovery sub-questions locked at scope-lock-cycle grade or appropriately deferred to brief-grade (4 of 4).
- [x] New sub-question surfaced at scope-lock-cycle grade (Sub-Q27 brief-grade deferral; Round 2 surfacing).
- [x] Chunk decomposition + shipping order locked (Sub-Q21 + Sub-Q22; Round 4).
- [x] Modal sidecar chunk placement locked (Sub-Q23; Round 4 inheritance from Sub-Q5 Session 29).
- [x] No founder-decision-required dispositions remaining.
- [x] Anti-drift discipline application outcomes banked at carry-forward observations.

**Phase 7 scope-lock cycle ready for cycle-close ratification at Round 5.**

### §6.3 Carry-forward observations

- **Candidate (c) catalog state at Session 31 close:**
  - sp-auth sub-grain N=0 maintained (single-execute Round 4 walk).
  - Push-state-claim sub-shape N=4 maintained (9-session avoidance trajectory at Sessions 23-31 onset; codification at `b7ec879` empirically validated across 9 sessions; tier-1 stability evidence accumulating).
  - Brief-drafting metafact-assertion grain N=4 maintained.

- **Option-space-framing-against-substrate sub-shape catalog graduates to N=8 instances at Round 4 close** — Round 4 surfaces 3 sub-shape instances (Sub-Q15.b pre-emptive-deferral-lean-overridden-by-substrate + Sub-Q19 naming-convention-drift + Sub-Q21 catalog-substrate-characterization-drift). Sub-grain catalog now spans: scope-input-artifact-authoring (5 Round 1 divergences) + Round-1-VFD + Round-2-Sub-Q1 (brainstorming-side-lean drift) + Round-3-Sub-Q12 (brainstorming-side-lean drift) + Round-3-Sub-Q13 (directive-grade-candidate-enumeration drift) + Round-4-Sub-Q15.b (pre-emptive-deferral-lean variant) + Round-4-Sub-Q19 (naming-convention-drift sub-grain) + Round-4-Sub-Q21 (catalog-substrate-characterization-drift sub-grain). **Codification candidate strongly supported at Phase 7 retrospective grade per N=3+ threshold; sub-grain catalog refinement at retrospective grade.**

- **Substrate-density-compresses-LOC observation N=5 banking candidate at Round 4 close** — five-grain consistency through Round 4 close (599 + 310 + 486 + 500 + Round 4 LOC). Sub-curve (b) below-floor compression continues. **Codification candidate at Phase 7 retrospective exploratory framing extension per `plan-authoring.md` Volume-forecast four-curve calibration sub-curve precedent.**

- **Directive-authoring multi-iteration refinement sub-grain N=3 codification threshold MET at Session 31** — three-iteration cycles fired at Sessions 29 + 30 + 31. Pattern: complex governance-critical sub-question batches at scope-lock-cycle grade benefit from explicit refinement-iteration discipline at directive grade; three iterations consistently produce tighter directives with prospective anti-drift catches. **Codification candidate strongly supported at Phase 7 retrospective grade per N=3+ threshold.** Sub-grain framing: the pattern is brainstorming-side ↔ executor deliberation surface where refinement notes function as forced second-pass on directive before walk-grade evidence arrives. Worth codifying explicitly at retrospective grade as new sub-discipline.

- **Anti-drift prospective-firing sub-discipline N=3 banking at Round 4 close** — Round 3 fired 2 prospective catches (Sub-Q12 + Sub-Q13); Round 4 fired 3 more prospective catches (Sub-Q15.b + Sub-Q19 + Sub-Q21). Total N=5 across Rounds 3 + 4. **Codification threshold strongly met; sub-discipline codification candidate at Phase 7 retrospective grade: anti-drift prospective-application at directive grade.** Sub-grain: directive-grade anti-drift framing notes catch potential walk-grade drift before reactive discovery; the discipline operates as forcing function for walk-grade evidence-density before lock-grade adjudication.

- **Sub-Q26 substrate-scope expansion N=2 banking maintained** — Round 2 caught 2→5 columns; Round 3 surfaced 5→~11 columns (ADR-0019 substrate-scope expansion). Round 4 does NOT surface additional Sub-Q26-grade expansions. Multi-ADR-substrate-surface enumeration sub-discipline codification candidate at Phase 7 retrospective grade.

- **Pre-emptive-deferral-lean-overridden-by-substrate sub-shape (NEW at Round 4)** — Sub-Q15 sub-axis (b) had brainstorming-side lean for brief-grade deferral (safety hedge); walk evidence at Round 4 resolved cleanly without needing deferral. Sub-shape: lean was unnecessary; walk evidence at Round 4 has sufficient evidence-density. N=1 banking at Round 4; codification threshold N=3+ pending future cycles.

- **Local commits ahead of `origin/staging` post-session:** expected 5 (scope-input artifact at `8ae3886` + Round 1 artifact at `2d97efe` + Round 2 artifact at `9b8d0af` + Round 3 artifact at `aa3d3c8` + this Round 4 artifact). No push; banks for Phase 7 terminal-close push per precedent.

### §6.4 Round 5 prompt inputs

Round 5 directive inputs from this Round 4 close:

**Round 5 scope:** Scope-lock-cycle-close ratification artifact + brief-drafting plan.

- **Scope-lock-cycle-close ratification artifact** — consolidates 27 sub-question locks across Rounds 1-4 + 5 carry-forward observation banking entries (option-space-framing-against-substrate catalog graduations + substrate-density-compresses-LOC banking + directive-authoring multi-iteration refinement banking + anti-drift prospective-firing banking + Sub-Q26 substrate-scope expansion banking) + Phase 7 retrospective codification candidates enumeration.
- **Brief-drafting plan** — per-chunk brief enumeration: chunk 7.1 (with Path C invocation evaluation at Grain 1 prospective) + chunk 7.2 + chunk 7.3. Pre-allocates brief-drafting sessions in scope-input §7.3 sequencing.

**Round 4 locks inherited as substrate constraints for Round 5 walks:** All 27 sub-question locks + 5 carry-forward observations.

**Substrate citation corrections inherited from Rounds 1-3 + Round 4:** No new substrate citation corrections surfaced at Round 4. VFD inheritance:
- VFD-2 `original_content_hash` (Round 1).
- VFD-5 `pipeline_trace` JSONB column (Round 1).
- VFD-6 `org_settings` ~11 reserved columns (ADR-0014 5 + ADR-0019 6 per Round 3).
- VFD-11 + VFD-13 path corrections (Round 1).

**Phase 7 retrospective codification candidate catalog at Round 4 close (for Round 5 ratification artifact enumeration):**

1. Option-space-framing-against-substrate sub-shape (N=8 instances; sub-grain refinement: brainstorming-side-lean drift + directive-grade-candidate-enumeration drift + naming-convention-drift + catalog-substrate-characterization-drift + pre-emptive-deferral-lean-overridden-by-substrate + scope-input-artifact-authoring drift).
2. Substrate-density-compresses-LOC observation (N=5 banking; sub-curve (b) below-floor compression).
3. Directive-authoring multi-iteration refinement sub-grain (N=3; codification threshold met).
4. Anti-drift prospective-firing sub-discipline (N=5; codification threshold strongly met).
5. Multi-ADR-substrate-surface enumeration sub-discipline (Sub-Q26 substrate-scope expansion pattern; N=2 banking).
6. Pre-emptive-deferral-lean-overridden-by-substrate sub-shape (N=1; below threshold; track at retrospective for future cycles).

---

**Round 4 status:** complete. **Final-lock cycle achieved.** 7 clean locks + 3 anti-drift prospective firings. All 27 sub-questions locked at scope-lock-cycle grade. Phase 7 scope-lock cycle ready for Round 5+ cycle-close ratification artifact + brief-drafting plan. Next operational fire: Round 5 scope-lock-cycle-close ratification artifact authoring per §6.4 prompt inputs.
