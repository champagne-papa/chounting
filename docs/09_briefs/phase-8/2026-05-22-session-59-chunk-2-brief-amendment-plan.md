# Session 59 Phase 8 Chunk 2 Brief Amendment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans (recommended) or superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Compose chunk 2 brief amendment at inline-edit grade per Disposition (b) ratification at Session 59 chunk 2 impl-onset substrate-evidence-propagation-gap adjudication. Amendments per §B.1-B.4 framing at Session 59 disposition design + §C follow-on chunk framing-pairing for F-3 substrate change deferral to chunk 4 substantive surface (framing ii preliminary recommendation).

**Architecture:** Inline edits to `docs/09_briefs/phase-8/chunks/2026-05-21-phase-8-chunk-2.md` at HEAD via explicit-correction commit per Session 54 commit `0e50cfb` precedent (preserves original chunk 2 brief commit `5dc042a` immutable in git history). ~150-300 LOC delta target per brainstorming-side §6 estimate. Inline Execution at WSL-side dispatch grade (subagent dispatch unnecessary at scoped-amendment grade per Session 54 explicit-correction-commit precedent inheritance).

**Tech Stack:** Markdown docs authoring. No code changes. Substrate verification reads at `apps/web/src/shared/schemas/document-platform/sourceDocumentLink.schema.ts` + `documentRelationshipCandidate.schema.ts` + `apps/web/src/services/document-platform/documentRouterService.ts` re-confirmed at chunk 2 impl-onset Phase A CONDITIONAL substrate verification grade (no re-verification required at amendment composition grade).

---

## File Structure

**Files to edit (inline amendments):**
- `docs/09_briefs/phase-8/chunks/2026-05-21-phase-8-chunk-2.md` (~150-300 LOC delta; amendment-grade edits per §B.1-B.4 + §6.11 new carry-forward observations section)

**Files to read (Phase A re-verification — substrate state already verified at chunk 2 impl-onset Session 59 Phase A CONDITIONAL grade; re-verification at amendment-composition-onset grade is sub-grain (d) chunk-brief-to-chunk-impl temporal gap discipline application):**
- `apps/web/src/shared/schemas/document-platform/sourceDocumentLink.schema.ts` lines 27-36 (LinkedEntityTypeSchema 8-value enum + lines 4-26 Phase 5.1 chunk 5.1a third amendment provenance header)
- `apps/web/src/shared/schemas/document-platform/sourceDocumentLink.schema.ts` lines 68-82 (VALID_PAIRS 13-cell matrix; canonical Layer-2 pair-validity helper)
- `apps/web/src/shared/schemas/document-platform/documentRelationshipCandidate.schema.ts` line 201 (linked_entity_id: z.string().uuid() NON-nullable; F-3 substrate verification)
- `apps/web/src/services/document-platform/documentRouterService.ts` lines 741-832 (per-document-type branches already shipped at Phase 4 chunk 1 grade; F-2 substrate verification)
- `docs/09_briefs/phase-8/2026-05-22-session-59-disposition-design.md` (this session's disposition design; B.1-B.4 amendments + C follow-on chunk framing-pairing source)

**Files NOT created or modified:**
- chunk 2 impl substrate (`documentRouterService.ts` extensions deferred to Session 60+ chunk 2 impl re-dispatch grade)
- ADR substrate (no ADR amendments at chunk 2 brief amendment grade)
- chunk 4 brief (`docs/09_briefs/phase-8/chunks/2026-05-21-phase-8-chunk-4.md`) — follow-on chunk framing-pairing recommendation deferred to chunk 4 impl-onset substrate-load grade OR chunk 4 brief amendment cycle at substrate-evidence-propagation-gap discovery grade (NOT at Session 59 amendment-composition grade)

---

## Task 1: Phase A — Pre-amendment verify-from-disk

**Files:**
- Read-only verification across substrate paths above

- [ ] **Step 1: Verify commits-ahead unchanged at Session 59 amendment-composition-onset.**

```bash
git log --oneline origin/staging..HEAD | wc -l
```
Expected: `34` (was 33 at Session 58 close + 1 disposition design commit at Session 59 in-progress). After plan commit + amendment commit: 36 commits ahead post-Session-59.

- [ ] **Step 2: Verify pnpm agent:validate 26/26 baseline preserved at amendment-composition-onset.**

```bash
pnpm agent:validate 2>&1 | tail -5
```
Expected: `Tests 26 passed (26)` in output. Docs-only amendment cycle preserves validation gate baseline.

- [ ] **Step 3: Verify working tree state at Session 59 amendment-composition-onset.**

```bash
git status --short
```
Expected: only pre-existing untracked Phase 6/6.5 carry-forwards (5 items); session 59 disposition design + plan tracked at clean grade post-individual-commits.

- [ ] **Step 4: Re-verify F-1 substrate state (LinkedEntityTypeSchema 8 values at HEAD).**

```bash
grep -nE "z\.enum\(\[" apps/web/src/shared/schemas/document-platform/sourceDocumentLink.schema.ts | head -5
sed -n '27,40p' apps/web/src/shared/schemas/document-platform/sourceDocumentLink.schema.ts
```
Expected: LinkedEntityTypeSchema z.enum with 8 values (bill, bill_line, payment, bill_payment_allocation, vendor_prepayment, vendor_prepayment_application, vendor_credit, vendor_credit_application).

- [ ] **Step 5: Re-verify F-1 substrate state (VALID_PAIRS 13 cells at HEAD).**

```bash
grep -cE "^\s+'[a-z_]+\|[a-z_]+'," apps/web/src/shared/schemas/document-platform/sourceDocumentLink.schema.ts
```
Expected: `13` (13 entries in VALID_PAIRS set; no vendor_credit or vendor_credit_application rows per Sub-Q3 β substrate-tables-only-without-cell-activation discipline).

- [ ] **Step 6: Re-verify F-3 substrate state (linked_entity_id NON-nullable at HEAD).**

```bash
grep -n "linked_entity_id:" apps/web/src/shared/schemas/document-platform/documentRelationshipCandidate.schema.ts
```
Expected: `linked_entity_id: z.string().uuid(),` at line 201 (NON-nullable).

- [ ] **Step 7: Read Session 59 disposition design as amendment-composition source.**

Read `docs/09_briefs/phase-8/2026-05-22-session-59-disposition-design.md` §4.1 (amendments B.1-B.4) + §4.2 (follow-on chunk framing-pairing recommendation framing ii extend chunk 4 substantive surface). Amendments compose against this source at canonical brief-as-source-of-truth-from-design-doc inheritance.

---

## Task 2: Compose chunk 2 brief amendments inline

**Files:**
- `docs/09_briefs/phase-8/chunks/2026-05-21-phase-8-chunk-2.md`

Amendments fire at inline-edit grade per Session 54 commit `0e50cfb` explicit-correction-commit-at-HEAD precedent. Each amendment preserves original substrate at editorially-minimal grain — amendments add provenance markers + reframe affected sections without restructuring artifact-wide layout.

### Amendment §B.1 — Task 4 F-1 reframe (enum narrowing → VALID_PAIRS-based pair-validity emission assertion)

- [ ] **Step 1: Amend §2.1 linked_entity_type expansion adjudication subsection** (lines 129-144).

Replace prose at lines 131-136 ("Per Phase 2.5 Commit A `9d788e2`...") with amended prose citing Phase 5.1 chunk 5.1a ADR-0016 third amendment ratification (LinkedEntityTypeSchema 6 → 8 values + VALID_PAIRS 13-cell matrix preservation per Sub-Q3 β substrate-tables-only-without-cell-activation discipline). Implementation intent preserved structurally via pair-validity matrix at canonical `VALID_PAIRS` helper at `sourceDocumentLink.schema.ts:68`. Per-document-type linked_entity_type mapping at lines 138-142 stays unchanged (mapping enforces emission constraint via VALID_PAIRS subset relationship).

- [ ] **Step 2: Amend Task 4 Scope subsection** (lines 315-323).

Replace Task 4 framing from "v1-active 6-value subset emission constraint per Phase 2.5 Commit A" to "VALID_PAIRS-based pair-validity emission assertion per Sub-Q3 β substrate-tables-only-without-cell-activation discipline inheritance from Phase 5.1 chunk 5.1a". Task 4 substantive surface: assert emitted (linked_entity_type, link_role) pair is in VALID_PAIRS at Subsystem 1 output emission boundary. Reserved values (vendor_credit, vendor_credit_application) structurally prevented from emission via pair-validity matrix (zero vendor_credit / vendor_credit_application rows in VALID_PAIRS).

- [ ] **Step 3: Amend Task 4 Acceptance criteria** (lines 324-333).

Replace "v1-active 6-value subset emission constraint" wording with "VALID_PAIRS-based pair-validity emission assertion". Replace "Type-level reflection consistent with v1-active subset (verify at impl-onset whether type union narrowing or service-layer assertion)" with "Service-layer assertion at Subsystem 1 output emission boundary using existing exported VALID_PAIRS helper at `sourceDocumentLink.schema.ts:68`". Drop "Layer 1 CHECK at source_document_links.linked_entity_type preserved (no migration required per Phase 2.5 Commit A inheritance)" — replace with "Layer 1 + Layer 2 pair-validity matrix at VALID_PAIRS preserved per Sub-Q3 β substrate-tables-only-without-cell-activation discipline inheritance from Phase 5.1 chunk 5.1a (no migration required)".

- [ ] **Step 4: Amend Task 4 Partial-information value picks** (lines 337-342).

Drop "Type union narrowing vs service-layer assertion" partial-information item (resolved by amendment at Path β pair-validity matrix reliance). Drop "Reserved-value-rejection assertion shape: runtime throw vs Zod schema rejection" partial-information item (resolved by VALID_PAIRS structural prevention — no runtime throw or schema rejection needed; pair-validity assertion at output emission boundary uses VALID_PAIRS.has()). Drop "Defense-in-depth posture" partial-information item (resolved by Path β single-layer reliance + Sub-Q3 β substrate-tables-only-without-cell-activation discipline structural prevention). Keep "Assertion test fixture shape" partial-information item (still operationally undecided at impl-onset grade).

### Amendment §B.2 — F-2 clarification (per-document-type branches extend in-place)

- [ ] **Step 5: Amend §2.1 per-document-type narrative preamble** (lines 100-103).

Add clarifying sentence after line 102: "Per Phase 4 chunk 1 substrate inheritance at `documentRouterService.ts:741-832`: per-document-type branches for vendor_invoice + receipt + payment_confirmation already shipped at single-feature-scoring grade. Chunk 2 substantive surface EXTENDS in-place rather than scaffolding new branches — per-feature contribution surface expansion within existing branches + missing scenarios per per-document-type narrative below (vendor_invoice Scenario A inferred-target DEFERRED per §B.3 amendment; receipt Scenario A variant `(payment, receipt)` + Scenario C exception routing ADDED at chunk 2 grade; payment_confirmation single canonical scenario already shipped + per-feature contribution surface expanded at chunk 2 grade)."

- [ ] **Step 6: Amend §3.1 Files modified subsection** (lines 190-193).

Add clarifying parenthetical at line 190 after "Touch grain: function body extension within existing `completeCandidate` exported function": "(per-document-type branches already shipped at Phase 4 chunk 1 grade at lines 741-832; chunk 2 extends existing branches in-place rather than scaffolding new branches)".

### Amendment §B.3 — F-3 disposition (Scenario A inferred-target paths DEFERRED to chunk 4)

- [ ] **Step 7: Amend §2.1 vendor_invoice subsection (Scenario A inferred-target)** (lines 104-108).

Replace "**Scenario A inferred-target (common path):** `invoice-arrives-no-bill-yet`. Subsystem 1 emits candidate with `linked_entity_type = 'bill'` + `linked_entity_id` null..." with: "**Scenario A inferred-target (common path) — DEFERRED to chunk 4 per F-3 substantive cross-phase substrate change scope discipline.** `invoice-arrives-no-bill-yet` Subsystem 1 emission would require `linked_entity_id` null but HEAD substrate has `documentRelationshipCandidate.schema.ts:201` `linked_entity_id: z.string().uuid()` NON-nullable. Six substrate change requirements (migration + Zod schema + NewCandidatePayload type + VALID_PAIRS refine + RPC parameter shape + downstream consumer audit) are substantively beyond chunk 2 brief scope (brief §3.3 explicitly: 'no schema changes at chunk 2'). Scenario A inferred-target absorbed at chunk 4 substantive surface per framing (ii) preliminary recommendation at Session 59 disposition design §4.2."

- [ ] **Step 8: Amend §2.1 receipt subsection (note Scenario A variant + Scenario C as ADDED at chunk 2)** (lines 110-119).

Add clarifying parenthetical after line 119 Receipt multi-scenario emission disambiguation prose: "(per Phase 4 chunk 1 substrate inheritance: Scenario A `(payment, payment_evidence)` + Scenario B `(bill, receipt)` already shipped at single-feature-scoring grade; chunk 2 ADDS Scenario A variant `(payment, receipt)` receipt-as-primary path + Scenario C exception routing signal emission)."

- [ ] **Step 9: Amend Task 1 vendor_invoice Scope subsection** (lines 234-237).

Replace Scope bullet list with "**Scope:** Extend `completeCandidate` function body to cover `vendor_invoice` document_type per ADR-0018 §2 lines 367-394 pseudocode-level specification. Scenario coverage at chunk 2 grade: **Scenario B existing-bill matching ONLY** at chunk 2 grade (vendor + amount + date proximity + bill_number/invoice_number alignment per-feature contribution surface expansion within existing Phase 4 chunk 1 single-feature-scoring branch). **Scenario A inferred-target DEFERRED to chunk 4** per F-3 substantive cross-phase substrate change scope discipline (null `linked_entity_id` requires substrate change requiring migration + Zod widening + RPC parameter shape update + downstream consumer audit; absorbed at chunk 4 substantive surface per framing ii preliminary recommendation at Session 59 disposition design §4.2)."

- [ ] **Step 10: Amend Task 1 Acceptance criteria** (lines 241-251).

Replace "completeCandidate function handles document_type = 'vendor_invoice' branch with both Scenario A + Scenario B emission paths." with "completeCandidate function handles document_type = 'vendor_invoice' branch with Scenario B existing-bill matching emission path at per-feature contribution surface expansion grade (Scenario A inferred-target deferred per §B.3 amendment to chunk 4)."

- [ ] **Step 11: Add §2.4 F-3 substantive cross-phase substrate change deferral framing.**

Add new §2.4 subsection after §2.3 (line 183) titled "§2.4 F-3 substantive cross-phase substrate change deferral framing (DEFERRED to chunk 4)" capturing:
- Brief premise vs HEAD substrate divergence: brief Task 1 Scenario A inferred-target framing assumes null `linked_entity_id` emission; HEAD substrate at `documentRelationshipCandidate.schema.ts:201` has `linked_entity_id: z.string().uuid()` NON-nullable.
- Six substrate change requirements enumeration (migration + Zod schema + NewCandidatePayload type + VALID_PAIRS refine + RPC + downstream consumer audit).
- Disposition: DEFERRED to chunk 4 substantive surface per framing (ii) preliminary recommendation at Session 59 disposition design §4.2 (chunk 4 already ships substrate-grade integration + audit trail + downstream consumer wiring; F-3 substrate change is integration-grade work aligned with chunk 4 envelope).
- Forward-pointer: chunk 4 brief at `docs/09_briefs/phase-8/chunks/2026-05-21-phase-8-chunk-4.md` adjudicates F-3 substrate change scope absorption at chunk 4 impl-onset substrate-load grade OR chunk 4 brief amendment cycle at substrate-evidence-propagation-gap discovery grade.
- Provenance: amendment composed at Session 59 chunk 2 brief amendment cycle per Disposition (b) ratification at chunk 2 impl-onset substrate-evidence-propagation-gap adjudication grade per `docs/09_briefs/phase-8/2026-05-22-session-59-disposition-design.md`.

### Amendment §B.4 — F-4 confirmation (no amendment needed)

F-4 per-feature contribution surface expansion within existing single-feature-scoring framework implementable as briefed. No amendment needed at chunk 2 brief content surface.

### Amendment artifact provenance (top-of-brief marker)

- [ ] **Step 12: Add amendment provenance block at top of brief (after Status line at line 7).**

Add new bullet after Status line at line 7:
- **Amendment cycle:** Session 59 (this artifact at amendment-cycle close) — chunk 2 brief amended inline per Disposition (b) ratification at chunk 2 impl-onset substrate-evidence-propagation-gap adjudication. Amendments at §2.1 + §2.4 (new) + §3.1 + Task 1 + Task 4 per §B.1-B.4 framing at `docs/09_briefs/phase-8/2026-05-22-session-59-disposition-design.md`. Original brief artifact at commit `5dc042a` preserved immutable in git history per discovery-after-commit substrate-stability discipline; amendment fires via explicit-correction commit at HEAD per Session 54 commit `0e50cfb` precedent inheritance.

### §6.11 amendment-cycle carry-forward observations section

- [ ] **Step 13: Add §6.11 amendment-cycle carry-forward observations section at end of §6** (after §6.10 line 580).

Add new §6.11 subsection capturing:
- Substrate-evidence-propagation-gap N=4 → N=5 confirming-fire MATERIALIZED at sub-grain (d) chunk-brief-to-chunk-impl temporal gap N=1 first-instance grade per Session 59 chunk 2 impl-onset Phase A CONDITIONAL substrate verification discovery.
- Sub-grain (d) chunk-brief-to-chunk-impl temporal gap N=1 first-instance — substantively novel at substrate-evidence-propagation-gap discipline grade (substrate evolved across ~8-session temporal window between Session 51 brief composition and Session 59 impl execution per Phase 5.1 chunk 5.1a ADR-0016 third amendment ratification).
- Verify-from-disk-at-impl-onset discipline sub-pattern N=1 first-instance at Session 59 chunk 2 impl-onset Phase A CONDITIONAL substrate verification grade. Sibling discipline to preemptive substrate path verification at session-onset N=11 cumulative.
- Chunk-brief-amendment-at-impl-onset-via-substrate-evidence-propagation-gap sub-pattern N=1 first-instance candidate at Session 59 brief amendment cycle materialization grade.
- Discovery-after-commit substrate-stability discipline sub-pattern N=2 → N=3 cumulative confirming-fire candidate at Session 59 brief amendment cycle (chunk 2 brief artifact at commit `5dc042a` preserved unchanged + amendment fires via separate explicit-correction commit at HEAD per Session 54 `0e50cfb` precedent inheritance).
- Substrate-evidence-propagation-gap remediation via explicit correction commit sub-pattern N=1 → N=2 confirming-fire candidate at Session 59 brief amendment commit grade per Session 54 `0e50cfb` precedent inheritance.
- Path B sub-grain (iv) TERMINAL-brief-drafting-cycle-shift sub-pattern: N=1 first-instance MATERIALIZATION deferred from Session 59 to Session 60 grade. NEW sub-grain (iv-deferred) N=1 first-instance candidate at Session 59 grade — sub-grain (iv) defers via brief amendment cycle insertion at chunk-impl-onset substrate-evidence-propagation-gap discovery grade.
- F-3 substantive cross-phase substrate change deferral to chunk 4 substantive surface per framing (ii) preliminary recommendation at Session 59 disposition design §4.2. Chunk 4 brief substrate-load at Session N+ impl-onset OR chunk 4 brief amendment cycle adjudicates F-3 substrate change scope absorption.

---

## Task 3: Commit cycle — disposition design + amendment plan + chunk 2 brief amendment (3 commits)

**Files:**
- `docs/09_briefs/phase-8/2026-05-22-session-59-disposition-design.md` (Commit 1; already composed at task 8 close)
- `docs/09_briefs/phase-8/2026-05-22-session-59-chunk-2-brief-amendment-plan.md` (Commit 2; this artifact)
- `docs/09_briefs/phase-8/chunks/2026-05-21-phase-8-chunk-2.md` (Commit 3; explicit-correction commit at HEAD per Session 54 `0e50cfb` precedent)

- [ ] **Step 1: Commit 1 — Session 59 disposition design.**

```bash
git add docs/09_briefs/phase-8/2026-05-22-session-59-disposition-design.md
git commit -m "docs(phase-8): Session 59 disposition design — Disposition (b) brief amendment cycle (chunk 2 brief amendment via substrate-evidence-propagation-gap sub-grain (d) chunk-brief-to-chunk-impl temporal gap N=1 first-instance MATERIALIZED + four F-finding catalog at chunk 2 impl-onset Phase A CONDITIONAL substrate verification grade + framing ii preliminary recommendation F-3 deferral to chunk 4 substantive surface)"
```

- [ ] **Step 2: Commit 2 — Session 59 chunk 2 brief amendment plan.**

```bash
git add docs/09_briefs/phase-8/2026-05-22-session-59-chunk-2-brief-amendment-plan.md
git commit -m "docs(phase-8): Session 59 chunk 2 brief amendment implementation plan — per /superpowers:executing-plans skill chain from design doc 2026-05-22-session-59-disposition-design.md"
```

- [ ] **Step 3: Commit 3 — chunk 2 brief amendment (explicit-correction commit at HEAD).**

```bash
git add docs/09_briefs/phase-8/chunks/2026-05-21-phase-8-chunk-2.md
git commit -m "docs(phase-8): chunk 2 brief amendment — Task 4 VALID_PAIRS-based pair-validity emission assertion (F-1 enum 6→8 + 13-cell matrix per Phase 5.1 chunk 5.1a Sub-Q3 β) + F-2 extends-in-place clarification + §2.4 (new) F-3 Scenario A inferred-target deferred to chunk 4 substantive surface (framing ii) + §6.11 amendment-cycle carry-forward observations (substrate-evidence-propagation-gap N=5 confirming-fire MATERIALIZED at sub-grain d N=1 first-instance chunk-brief-to-chunk-impl temporal gap) — explicit-correction commit at HEAD preserving original chunk 2 brief commit 5dc042a immutable per Session 54 0e50cfb precedent"
```

- [ ] **Step 4: Verify post-commit state.**

```bash
git log origin/staging..HEAD --oneline | wc -l
git status --short
```
Expected: `36` commits ahead (33 baseline + 3 amendment cycle commits); working tree clean modulo 5 pre-existing untracked carry-forwards.

---

## Task 4: Memory close + Session 59 close-state report

**Files:**
- Memory updates at `/home/philc/.claude/projects/-home-philc-projects-chounting/memory/`
- Close-state report at brainstorming-side dispatch (no artifact file)

- [ ] **Step 1: Update MEMORY.md project file with Phase 8 chunk 2 brief amendment cycle outcome.**

Add or update entry covering: Session 59 brief amendment cycle close at 3-commit shape; F-1/F-2/F-3/F-4 findings + Disposition (b) ratification + framing (ii) F-3 deferral to chunk 4; substrate-evidence-propagation-gap sub-grain (d) chunk-brief-to-chunk-impl temporal gap N=1 first-instance MATERIALIZED; sub-grain (iv) TERMINAL-brief-drafting-cycle-shift deferred from Session 59 to Session 60 per amendment-cycle interjection; chunk 2 impl re-dispatch fires Session 60+.

- [ ] **Step 2: Compose close-state report per Sessions 50-58 close report shape inheritance.**

Surface:
- Commits banked at Session 59 grade (3 commits: disposition design + amendment plan + chunk 2 brief amendment)
- pnpm agent:validate state at session-close grade (26/26 green preserved)
- Working tree state at session-close grade (clean modulo 5 pre-existing untracked carry-forwards)
- Commits-ahead origin/staging count at session-close grade (36 commits ahead post-Session-59)
- Banking surfaces materialized at session-close grade (per §6.11 amendment-cycle carry-forward observations)
- Phase 8 cycle status update at session-close grade (chunk-impl cycle posture re-dispatch fires Session 60 grade per Path B sequential continuation under post-amendment brief substrate-readiness grade; chunk-impl progress 0 of 10 chunk impls complete post-Session-59 — chunk 2 impl deferred to Session 60)
- Next operational fire forecast grade (Session 60 chunk 2 single-chunk impl re-dispatch at post-amendment brief substrate-readiness grade)

---

## Acceptance criteria — Session 59 close

- 3 commits banked at Session 59 grade per brief amendment cycle precedent shape.
- pnpm agent:validate 26/26 green preserved (docs-only amendment cycle).
- Working tree clean modulo 5 pre-existing untracked carry-forwards.
- 36 commits ahead of origin/staging post-Session-59.
- Chunk 2 brief amendments capture §B.1-B.4 amendments per Session 59 disposition design §4.1 inheritance + §6.11 amendment-cycle carry-forward observations section addition.
- F-3 substantive cross-phase substrate change deferral to chunk 4 substantive surface per framing (ii) preliminary recommendation captured at chunk 2 brief §2.4 (new) subsection + amendment provenance block at top-of-brief.
- Original chunk 2 brief commit `5dc042a` preserved immutable in git history; amendment fires via explicit-correction commit at HEAD per Session 54 `0e50cfb` precedent.
- Memory close + close-state report composed at brainstorming-side dispatch grade.
- Chunk 2 impl re-dispatch fires Session 60 grade per Path B sequential continuation under post-amendment brief substrate-readiness grade.
