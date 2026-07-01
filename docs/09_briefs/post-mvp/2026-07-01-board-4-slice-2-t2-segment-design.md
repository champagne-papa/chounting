# Board #4 — Slice 2 T2 (Stage 2.5 segment) — Approach

> **Status:** DRAFT approach — for advisor verification of the *integration
> shape* BEFORE implementation (T1 rhythm: draft → verify → build). No stage
> code written yet. No prod writes.
> **Authored:** 2026-07-01 (WSL). Branch `feat/board-4-slice-2` (T1 at d5d4f1be).
> **Parent:** build-plan T2; build-spec §1.4 (N-1); T1 α substrate (applied local).
> **Lane:** WSL grounds + drafts; advisor verifies the approach vs disk; then WSL
> implements + shows tests; Phil owns commits/prod.

---

## ⚠ REDIRECT (2026-07-01, advisor + WSL first-hand) — T2 impl ON HOLD; design "the middle" first

Reading the full orchestrator first-hand supersedes this doc's §2 framing
("Stage 2.5 subsumes classify+extract; remove-vs-retain Stage 3/4"). The loop
boundary is **not "Stages 3-7"** — the mainline has a case-grained tail that does
not loop:

- **Per-region (3-5, likely into 6):** classify (`:190`), extract (`:258`), and
  **`match_vendor` (`:295-331`, one `vendorMatch` per fields — amazon is 3 vendors,
  so per-α is forced)**; `match_against_existing_state` (`:336-394`,
  `completeCandidate`) matches *an invoice* against ledger state → also likely
  per-α.
- **Case-grained-singular (6.5-7 + review):** route the case
  (`advanceCaseAutomation`/`resolveCandidates`), the single parked card (Stage 7),
  one-exception-per-case — and the **unknown short-circuit** (`:223-256`), a
  case-grained early `return` that, looped per-region, would abandon later regions
  and **violate the locked per-invoice-independent atomicity**.

**The gap is board #4's, not just T2's:** the build-spec specified the *ends* — T2
(write N α) and T3 (post N α → N bills) — but **not the middle**: how N propagates
through Stages 5-7, the unknown re-grain (per-α, not case-early-return), and
whether the review surface is N cards / routes once-or-per-α / bypasses the parked
card for approve-post reading α directly. **None settled.**

**Next (pending Phil's rescope go):** ground Stages 5-7 + the parked-card→
approve-post→review surface first-hand, design how N propagates through the
case-grained middle, THEN implement T2 with the full seam known. Working
hypothesis to pressure-test (NOT adopt): loop 3-5(-6?) per region → N α; run the
case-grained tail once over the α set; unknown re-grained per-α; N=1 collapses to
the existing single-card flow.

---

## 1. Grounding (first-hand, `feat/board-4-slice-2`)

- **Stage sequence** (`ingestDocument.ts:98-199`): Stage 0 dedup → 1 byte-fetch →
  **2 OCR** (`:158-181`, produces `ocrResult.artifact` = `DocumentArtifactRow`
  with bbox `lines`) → **3 classify** (`:190-199`, `classifyDocumentType({ ocrArtifact,
  source_document_id, trace_id }, ctx)`) → 4 extract → 5-7. Each stage is
  `withFailureClassification(stage_name, source_document_id, ctx, () => fn())` and
  pushes a `PipelineStageRecord` to `pipeline_trace`.
- **Stage-module template** (`runOCR.ts`): `fn(input): Promise<{ artifact,
  trace_record }>`; writes substrate via a **Layer-2 service**
  (`insertOcrArtifactChain` in `extractionArtifactWriteService`), NOT a direct
  insert — the ADR-0020 agent→service→db path. Emits a `PipelineStageRecord`
  (`stage_name`, `input_hash`, `output_hash`, `model`, `timestamp`).
- **Classify/extract consume a `DocumentArtifactRow`** and flatten its `lines` to
  text (`extractOcrText`, §4.4 grounding) — so they can run on **any** artifact,
  including a sub-artifact holding only one region's lines. This is the seam that
  makes per-region reuse possible without touching classify/extract internals.

## 2. Slot + the integration decision (the load-bearing choice)

Stage 2.5 sits **between Stage 2 and Stage 3**. The real decision is *what it
subsumes*, because N invoices need N classify+extract runs where today there is
one:

- **RECOMMENDED — Stage 2.5 subsumes per-region classify+extract and writes N α
  rows; Stages 3-4 become the per-region body it loops.** Stage 2.5:
  1. `segmentInvoiceRegions(artifact) → Region[]` (the algorithm behind a seam,
     §3) — each `Region` = a subset of `artifact.lines` + its bbox extent.
  2. sort regions by a **content-stable key** (region top-`y`) → assign `ordinal`
     1..N (deterministic — AP/T5 depends on it).
  3. for each region: build a **sub-artifact** (`{ ...artifact, lines: region.lines }`)
     and run the **existing** `classifyDocumentType` + extract on it → per-region
     `document_type` + `extracted_fields`.
  4. write one **pending** α row per region via the new service (§4).
  - **N=1 is a strict generalization → no regression** (advisor target #3): a
    single-invoice document segments to exactly one region, so the loop runs once,
    calling the *same* classify+extract on the *whole* artifact — identical in
    effect to today. The single-invoice path is the N=1 case of the same code, not
    a separate branch.
- **REJECTED — Stage 2.5 only segments; orchestrator loops Stages 3-4 per α.**
  Requires restructuring the orchestrator's Stage 3-7 mainline into a per-α loop —
  a much larger, riskier change to the live single-invoice path. The recommended
  shape localizes the N-ness inside Stage 2.5 and leaves the mainline's post-Stage-4
  shape for T3 to fan.

**Open for the advisor:** whether the orchestrator's *existing* standalone Stage 3
(`classifyDocumentType` at `:190`) and Stage 4 calls are **removed** (their work
now happens inside 2.5's loop) or **retained for N=1 and bypassed for N>1**. Lean:
remove the standalone calls and always route through 2.5's loop (one code path;
N=1 is just one iteration) — but this touches the live pipeline mainline, so it is
the thing to verify carefully. Grounding the exact Stage 3-4 call sites + their
downstream consumers (Stage 5 match reads `extractedFields`/`classification`) is a
**T2 implementation-onset task**, flagged not yet done.

## 3. The segmentation seam (algorithm = build risk, isolated)

`segmentInvoiceRegions(artifact): Region[]` behind a seam so the algorithm can be
iterated without touching integration. v1 candidates (decide at build, isolate
behind the seam): `Invoice #`/`Facture`-header anchoring over bbox-sorted lines;
or spatial/page-gap clustering. **Reliability is slice-2 build risk** (design
§4.4) — the α lock is robust to it; imperfect segmentation degrades to
`needs_review` via the spine, never a silent mis-post. v1 fallback: on
low-confidence segmentation, emit **one** region (N=1) rather than a wrong N — a
safe degrade to today's behavior.

## 4. The α-write service (advisor target #1)

New Layer-2 service (mirrors `extractionArtifactWriteService`):
`extractedInvoiceWriteService.createExtractedInvoice(...)` → calls the T1 RPC
`create_extracted_invoice_with_audit(p_invoice, p_audit)`. Stage 2.5 (agent) calls
the service; the service calls the RPC — **never a direct table insert** (audit
pairing is in the RPC; ADR-0020 agent→service→db). Writes `post_status='pending'`
(default), `posted_bill_id`/`idempotency_key` NULL (set later at T3/T5). `ordinal`,
`document_type`, `extracted_fields`, `region_ref`, `extraction_run_id` from the
loop.

## 5. Advisor's three T2 verify targets — how the approach addresses each

1. **Writes pending α through the RPC, not a direct insert** → §4 (service →
   `create_extracted_invoice_with_audit`; audit pairing preserved).
2. **Deterministic ordinal over a content-stable sort** → §2.2 (sort by region
   top-`y` before assigning ordinal; re-segmentation reproduces ordinals — the
   T5 ordinal-fallback key depends on it).
3. **N=1 produces exactly one α, identical in effect to today** → §2 recommended
   shape (N=1 = one loop iteration calling the same classify+extract on the whole
   artifact; no separate branch).

## 6. Scope

- **T2 delivers:** Stage 2.5 (segment + per-region classify/extract loop + N α
  writes), the segmentation seam (v1 + safe N=1 degrade), the α-write service, the
  `segment_document` trace_record, and the orchestrator wiring.
- **NOT T2:** the N-loop *post* fan (T3); committed-marking re-grain (T4); the key
  resolution (T5); the stuck-invoice UI (T6). Stage 2.5 stops at N pending α rows.
- **Tests (T7, but drafted alongside):** N=1 no-regression (one α, same fields as
  today); N=3 (three α, distinct ordinals, deterministic across a re-run); the
  segmentation-low-confidence → N=1 degrade.

## 7. Implementation-onset tasks (before writing the stage)

Flagged per verify-from-disk — resolve first-hand at T2 build onset:

1. The exact Stage 3/4 call sites + signatures (`classifyDocumentType`, the
   extract stage) and their **downstream consumers** (Stage 5 match reads what?) —
   to decide the §2 "remove vs retain standalone" cleanly without breaking Stage 5-7.
2. The `DocumentArtifactRow` shape (does a sub-artifact need `pages`/`words`
   sliced too, or only `lines`?) — classify/extract read `lines` via
   `extractOcrText`, but confirm no consumer reads `words`/`pages`.
3. `extraction_run_id` provenance for a region — the whole-document `extraction_run`
   exists (Stage 2); decide whether all N α share it (coarse; the nullable-link
   design permits) or it's NULL per region.
