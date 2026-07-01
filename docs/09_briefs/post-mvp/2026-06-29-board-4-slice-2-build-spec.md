# Board #4 — Slice 2 Build Spec (case → N bills)

> **Status:** DRAFT — Phase 1 design-decision artifact (plan §1.6). Building this
> incrementally: **§1.4 (extraction contract) drafted; §1.5 (the fan) next.** No
> code; no prod writes. **§1.4 advisor-verified + independent disk-audit ALL
> CLEAR (2026-06-29)** — all anchors match disk, incl. `buildProposal → one
> ProposalResult` and the α FK targets (exist; `extracted_invoice` does not yet).
> Pending Phil approval. The N-source sub-decision (§1.4.2) is **LOCKED N-1 (Phil
> 2026-06-29)**.
> **Authored:** 2026-06-29 (WSL).
> **Parent decision record:** `2026-06-16-board-4-multi-invoice-modeling-design.md`
> (α LOCKED §4.3; Fork B grounded §4.4; case→bill 1:1 traced §10.1).
> **Grounding substrate:** code `main @ b749179d`; prod `ollyqiiwdvbpbngqgjqk`
> (read-only). Re-verify anchors at read time.
> **Lane:** WSL grounds + drafts; advisor verifies against disk; Phil owns the
> sub-decision, the commit, and any prod action.

---

## Locked inputs (carried from the parent decision record)

- **Fork A** = one-case-N-bills (Phil 2026-06-28).
- **N-home** = **α**, a new per-invoice `extracted_invoice` entity (Phil
  2026-06-29) — chosen on provenance + robustness-to-segmentation-difficulty.
- **Case→bill 1:1 is baked into logic + DB** (§10.1): the dedup key `${caseId}:bill`
  → `idx_je_source_external` UNIQUE forces one bill per case at Layer 1. Any N
  design must re-key this per-invoice or N collapses to 1.

---

## §1.4 — The N-array extraction contract

### 1.4.1 The current 1-shape (grounded first-hand, `main @ b749179d`)

| Stage | Shape today | Anchor |
|---|---|---|
| Extraction output | one `VendorInvoiceExtraction` (11 optional fields) | `vendorInvoiceExtractionSchema.ts:41-56` |
| Extractor return | `ExtractionResult { fields: <one object>, ai_fallback_invoked, trace_records }` | `vendorInvoiceExtractor.ts:151-184` |
| AI prompt | *"Return a **single** JSON object"* | `vendorInvoiceExtractor.ts:131` |
| Proposal | `buildProposal(input) → one ProposalResult` (one `documentType`, one `extractedFields`, one card) | `proposalBuilder.ts:38-76` |
| Bill | `card → buildPostBillInput → one bill (.single())` | §10.1 |

The pipeline is 1-invoice-shaped end to end. "N" must be introduced at exactly one
seam and fanned from there.

### 1.4.2 SUB-DECISION (Phil) — where does N come from?

Two viable shapes; they differ in cost **and** in how much they honor the
provenance reason α was locked. **Surfaced, not pre-decided.**

- **(N-1) Segment-then-loop** — *recommended; coherent with α.* A new **Stage 2.5
  (segment)** reads the bbox-structured artifact (§4.4) and partitions its lines
  into N invoice regions; **stages 3–7 run once per region.** The extraction
  schema stays **single-object per region** (no schema change). Each region → one
  α `extracted_invoice` (carrying its region anchor) → one proposal → one bill.
  - *Pros:* strong per-invoice provenance (each α row ← an addressable bbox
    region); **works under structured-output** (each region is a single object —
    sidesteps the board-2 multi-invoice collapse); the downstream 1-shape is
    reused verbatim N times.
  - *Cons:* must build Stage 2.5 segmentation (the real new work; reliability is
    slice-2 build risk, discovered here).
- **(N-2) Array-extraction** — *cheaper, weaker.* Extraction emits
  `VendorInvoiceExtraction[]` over the whole document; the model **already returns
  the array on free-text** (board-2 amazon). No segmentation stage.
  - *Pros:* minimal new code; leans on observed model behavior.
  - *Cons:* **weak provenance** (an array index, no region anchor — makes α a thin
    wrapper, undercutting the reason it was locked); **structured-output collapses
    on the array** (board-2 KEY FINDING), so N-2 is **free-text-only** — it forfeits
    the constrained-decoding guarantee prod is moving toward.

**LOCKED: N-1 (Phil, 2026-06-29).** Decided by the **verified board-2
structured-output collapse** — free-text amazon returned a correct 3-element
array; structured-output returned all-fields-null because a single-object schema
can't hold three invoices — which makes **N-2 free-text-only by construction**,
forfeiting structured outputs for exactly the multi-invoice case. N-1 (each region
→ one object) stays compatible with both decode paths. Reinforced by α-provenance
consistency (N-2 gives α only an array index; `region_ref` exists only under N-1)
and conservatism (N-1 leaves the verified single-object extraction contract
untouched and loops it; N-2 mutates the contract into the known failure mode).
Segmentation reliability is **slice-2 build risk, not architectural risk** —
imperfect segmentation degrades to `needs_review` via the spine, and the
difficulty raises effort without flipping the call (same robustness axis as the α
lock).

### 1.4.3 The α entity — `extracted_invoice` (draft shape)

One row per invoice within a case; the home for segmentation's grouping +
extraction + the bill it becomes. Follows the Phase-2 chunk substrate pattern
(immutability triggers, through-parent RLS, atomic INSERT-with-audit RPC).

| Column | Type | Note |
|---|---|---|
| `id` | uuid PK | |
| `document_case_id` | uuid NOT NULL → `document_cases` | the originating case |
| `source_document_id` | uuid NOT NULL → `source_documents` | the PDF it came from |
| `ordinal` | int NOT NULL | 1..N within the case (stable per-invoice key; feeds the `source_external_id` re-key) |
| `document_type` | document_type NOT NULL | **per-invoice** type — subsumes the §10.2 single-`document_type` gap for the multi-invoice case |
| `extracted_fields` | jsonb NOT NULL | the per-invoice `VendorInvoiceExtraction` payload |
| `extraction_run_id` | uuid NULL → `extraction_runs` | provenance to the OCR/extraction pass (N-1) |
| `region_ref` | jsonb NULL | the segment's bbox/line-range (N-1 provenance; NULL under N-2) |
| `posted_bill_id` | uuid NULL → `bills` | the bill this invoice became (NULL pre-post) — the auditable case↔bill link γ lacked |
| `trace_id`, `created_by`, `created_at` | | per the chunk pattern |

Open at §1.5/build: whether `extracted_fields` duplicates or replaces the
`document_artifacts`/`extraction_runs` payload; whether `posted_bill_id` is the
canonical case↔bill link or rides `source_document_links` alongside.

### 1.4.4 The per-invoice `source_external_id` re-key (forced by §10.1)

The 1:1-collapse point. Today the approve-post route sets `${caseId}:bill`
(`route.ts:155`) → `idx_je_source_external` UNIQUE. For N bills under one case:

- **Re-key** to a per-invoice value — `${caseId}:bill:${ordinal}` (uses the α
  `ordinal`), or `${caseId}:bill:${vendor_invoice_number}` if a stable invoice
  number is the better idempotency key. **Required under both N-1 and N-2.**
- Open: ordinal-keyed (always present, but re-segmentation could renumber) vs
  invoice-number-keyed (stable across re-runs, but absent/duplicated on some
  docs). Decide at §1.5 with the idempotency semantics.

### 1.4.5 Threads into §1.5 (the fan — next)

N α rows → N proposals → N `billService.post` calls under one case; the
committed-marking + per-bill evidence-object persistence; the atomicity posture
(all-N-or-nothing vs per-invoice-independent). Drafted next.

---

## §1.5 — The fan (N α → N proposals → N bills)

> **⚠ SCOPE SUPERSESSION (2026-07-01) — the fan spans the review surface, not just
> approve-post.** Grounding the orchestrator + review surface first-hand (Phase-3
> T2 onset) found the fan is broader than this section framed it. The card is
> **ephemeral** — never persisted; both the review surface AND approve-post
> reconstruct it by **Tier-A re-extraction over the whole OCR**
> (`reviewPreview.ts:3,266-322`), which is single-invoice by construction. So
> board #4 **reverses "rebuild-not-persist" for the multi-invoice case**: the
> review reads N α rows (N cards) instead of re-extracting one. This section's
> "the fan lives at approve-post" is **narrowed** — approve-post (T3) is one of
> **three** N-sites: per-region pipeline (T2), `buildReviewPreview` reads α (NEW
> **T2.5**), approve-post loops α (T3). Recorded additively, not rewritten. Full
> design + the revised task order: **`2026-07-01-board-4-slice-2-middle-design.md`**.
> Also recorded there: **one-path (α always) LOCKED (Phil 2026-07-01)**; the inbox
> stays **case-grained** (N cards are a detail-level concern); the one-path cutover
> needs an **α-absent re-extract fallback** for in-flight review-queue cases
> (deploy-safety, grounded — prod has `needs_review` cases with no α); **T1 stands
> unchanged** (no vendor column); per-α Stage-6 candidate matching **deferred
> post-v1**. The §1.5.2/§1.5.3 idempotency + atomicity locks below are **unaffected**
> — they govern the post loop, which still holds.
>
> Drafted against N-1. Two postures **LOCKED by Phil (2026-07-01)**, each resting
> on a **first-hand-grounded** fact (not the plausible version). Grounding done 2026-06-30; **G1/G2 advisor-verified airtight
> 2026-07-01**, and reading the full `post()` surfaced **G3** (an existing
> crash-class the fan multiplies) — added below, re-confirmed first-hand by WSL.

### 1.5.0 Grounding findings (first-hand, `main @ b749179d`)

**(G1) The idempotency constraint — uniqueness is on a free-text string, scoped
per (org, source_system).** `idx_je_source_external` is UNIQUE on
`(org_id, source_system, source_external_id) WHERE source_external_id IS NOT NULL`
(`20240111:65-67`). `journalEntryService.post` writes **`source_system = parsed.source`**
(`:187`) and **`source_external_id` verbatim** (`:190`); `billService.post` passes
`source: 'manual'` (`:342`) + the route's `source_external_id`. So the live
uniqueness scope is **`(org_id, 'manual', <the string>)`** — and the **`caseId` in
the string is the only thing giving per-case scope today.** Consequence: an
invoice-number key *without* a `caseId` prefix would **false-collide across cases
in one org** (the same vendor invoice number recurring in two cases/months →
spurious dedup-recover). **The `caseId` prefix is required.**

**(G2) `billService.post` is per-invoice-independent — no shared case-level
state.** It mutates ONLY new-bill-keyed rows — JE (via `journalEntryService.post`),
`bills`, `bill_lines`, `source_document_links`, the audit row, then a best-effort
dispatch (`billService.ts:271-462`). It **never touches `document_cases`.** So N
posts under one case cannot corrupt each other at the bill layer; invoice-2's
failure leaves invoice-1's bill intact. **The only shared state is the case state
machine** in the approve-post route (case-grained transitions + the case-grained
`committed` marking via `advanceCaseAutomation`, `route.ts:292-295`).

**(G3) An existing JE-before-bill crash-class the fan multiplies.** `post()` posts
the JE *before* inserting the bill (`billService.ts:336` JE, then `:355` bill).
`getRecoveryBillIdByJournalEntry` (`:982-1005`) has an explicit
`POSTING_RECOVERY_UNREPAIRABLE` path: if the JE landed but the bill insert never
did, retry can't recreate the bill (the JE dedup fires first) — *"Manual repair
required; re-approving will not resolve this."* This is **today's single-bill
behavior**, not introduced by board #4 — but the N-fan **multiplies the window**
from one JE→bill pair to N. Two consequences, both *reinforcing* §1.5.3's posture
(handled there).

### 1.5.1 The fan shape

Stage 2.5 segments → N α `extracted_invoice` rows (each with `ordinal`,
`region_ref`, `extracted_fields`). The post phase loops the **verified 1-shape**
(N-1) per α: `buildPostBillInput(α) → billService.post → one bill`, then write the
α's `posted_bill_id`. The existing single-invoice contract is reused N times — no
extraction/proposal-contract mutation (the conservatism N-1 was locked for).

### 1.5.2 DECISION — idempotency key (recommendation, for Phil's lock)

**LOCKED (Phil, 2026-07-01): composite, `caseId`-prefixed —**
`` `${caseId}:bill:${suffix}` `` where `suffix = vendor_invoice_number` **when
present AND unique within the case's N**, else the **persisted `α.ordinal`** (and
per the §1.6 watch-item, the resolved key is **persisted on the α row, not
recomputed**).

- Grounded on **(G1):** keep the `${caseId}` prefix — it preserves the *current*
  per-case scope; board #4 does **not** newly solve org-wide cross-case invoice
  dedup (that's a separate question, out of scope).
- Invoice-number suffix is **content-stable across re-segmentation** (the advisor's
  reason to prefer it over bare ordinal); the **ordinal fallback is stable on the
  common recovery path** because `α.ordinal` is *persisted once at segmentation and
  read back* (re-approval doesn't re-segment). The α entity persisting the ordinal
  is what makes the fallback safe — another payoff of the α lock.
- Residual (slice-2 build, named not solved): a B3 **re-segmentation** re-run could
  reassign ordinals — bounded by making Stage 2.5 ordering deterministic (sort
  regions by a content key, e.g. region top-`y`) and/or α-dedup on re-run. Tracked,
  not papered over.

### 1.5.3 DECISION — atomicity posture (recommendation, for Phil's lock)

**LOCKED (Phil, 2026-07-01): per-invoice-independent** (each α posts/fails alone;
partial success allowed) + aggregate committed-marking.

- Grounded on **(G2):** per-invoice posting is **safe at the bill layer** —
  `billService.post` shares no mutable case state, so a partial failure cannot
  leave invoice-1 inconsistent. This is the fact the recommendation rests on, not
  an assumption.
- **Spine alignment:** all-N-or-nothing turns "2 clean invoices + 1 uncertain" into
  "nothing posts" — the *opposite* of route-uncertain-to-human. Per-invoice-
  independent posts the clean ones and routes only the uncertain α to
  `needs_review`, at invoice grain.
- **The case-state coupling (the real design change this forces):** because the
  `committed` marking is case-grained (G2), it must **re-grain to an aggregate over
  the α rows** — the case reaches `committed` only when **all** α carry
  `posted_bill_id`; a partial case stays in a review state with the unposted α
  flagged (per-invoice status on α — exactly the grain α was locked for). This is a
  real change to the approve-post route's terminal marking; **slice-2 build work**,
  flagged here.
- **The (G3) crash-class reinforces this posture, not undercuts it.** Two points:
  1. **It argues *for* per-invoice-independent.** All-or-nothing would be *harder*
     here — you cannot cleanly roll back N already-posted JEs (the ledger is
     append-only; a reversal is itself a post). Per-invoice-independent + the
     aggregate marking degrades the crash-class **gracefully**: a burned/stuck
     invoice leaves its α row **without `posted_bill_id`**, so the case stays in
     review and a human sees the gap — the spine catching exactly the case the
     machine *cannot* auto-repair (`POSTING_RECOVERY_UNREPAIRABLE`). So the
     committed-marking re-grain (§1.5.3) isn't only for the `needs_review` path —
     it's also what **surfaces** the crash-class.
  2. **Idempotency and atomicity are two orthogonal axes — do not conflate
     "idempotent" with "atomic."** The §1.5.2 key solves **re-run dedup** (don't
     double-post the same invoice). The (G3) crash-class is a **non-atomicity the
     key cannot resolve** (a JE without its bill). Different concerns, different
     mechanisms: **key → re-run safety; committed-marking → stuck-invoice
     visibility.** §1.6 must build both, and not assume the key covers the
     crash-class.
- Also pre-existing: the `DUPLICATE_SOURCE_EXTERNAL_ID` recovery (§10.1) handles
  the *other* branch — JE landed **and** bill exists (a benign re-approval) — and
  per-invoice keying (§1.5.2) makes that recovery fire **per invoice**.

### 1.5.4 Threads into §1.6 (packaging)

With §1.4 + §1.5 drafted, §1.6 consolidates this into the slice-2 build plan
(task decomposition: the α migration; Stage 2.5; the N-loop in the route; the
committed-marking re-grain; the per-invoice key). Awaits Phil's two locks above.

**§1.6 watch-items (advisor, 2026-07-01 — carry in, don't rediscover mid-build):**

1. **Persist the idempotency key per-α; do not recompute it.** The
   invoice-number-else-ordinal rule (§1.5.2) has a boundary seam: an invoice whose
   number is *present-but-not-unique-in-case* (a genuine collision or a
   mis-extraction of the same string) falls to ordinal — so one case can **mix**
   number-keyed and ordinal-keyed α rows, and a re-segmentation would drift only
   the ordinal-keyed subset. Fix at build: **decide each α's key at first post and
   store it on the α row** (the entity holds it, same as `ordinal`), so re-run
   dedup (§1.5.2) and crash-class recovery (§1.5.3/G3) can never disagree about an
   invoice's key. The key is **persisted, not recomputed.**
2. **The G3 stuck-invoice needs a distinct "manual repair" affordance, not a
   "retry."** A `POSTING_RECOVERY_UNREPAIRABLE` α **cannot** be re-approved (by the
   error's own words), so "case stays in review with the unposted α flagged" must
   render an affordance that is *not* a retry loop the operator structurally can't
   win. §1.6 / slice-2 UX build concern — cheap to design now, expensive to
   discover in prod.

---

## Out of scope here

- **Stage 2.5 segmentation algorithm** (spatial clustering vs header-anchoring) —
  slice-2 build; its reliability is the build risk the α lock is robust to.
- **Org-wide cross-case invoice dedup** — a separate question (§1.5.2); board #4
  preserves current per-case scope.
- **The detector** (slice-1, Phase 0) — independent; unaffected.
- **Stage 2.5 segmentation algorithm** (spatial clustering vs header-anchoring) —
  slice-2 build; its reliability is the build risk the α lock is robust to.
- **The detector** (slice-1, Phase 0) — independent; unaffected.
