# Board #4 — Slice 2 "The Middle" — N-propagation seam design

> **Status:** DRAFT seam design — the architecture is WSL + Phil's call; the
> advisor verifies the *grounding*, not the seam's correctness. No code. No prod.
> **Authored:** 2026-07-01 (WSL). Branch `feat/board-4-slice-2` (T1 at d5d4f1be).
> **Supersedes scope of:** build-spec §1.5 (the fan was framed as living at
> approve-post; it actually spans the review surface — see §0).
> **Grounding:** all first-hand this session; anchors inline. Advisor to verify.

---

## 0. The scope correction (what the mainline read revealed)

Phase 1 chose the right direction (α persists per-invoice extraction) but scoped
the reshape too narrowly. **The card is ephemeral** — never persisted; both the
review surface AND approve-post reconstruct it by **Tier-A RE-EXTRACTION over the
whole `document_artifacts` OCR** (`reviewPreview.ts:3` "rebuild, not persist";
`:266-322`). That path is **single-invoice by construction** (one whole-doc
re-extraction → one card). So board #4 **reverses "rebuild-not-persist" for the
multi-invoice case**: α *is* the persistence, and the review reads N α rows
instead of re-extracting one. This spans the orchestrator (per-region 3-5), the
**review surface** (`buildReviewPreview`), the review inbox, and approve-post —
not just "add a post loop."

**Bonus (α also fixes an existing single-invoice residual):** the Tier-A-only
review re-extraction degrades Tier-C-extracted docs to `NOT_POSTABLE`
(`reviewPreview.ts:14-15`). Reading α (which persists the full, Tier-C-capable
extraction) eliminates that. So reversing rebuild-not-persist is a single-invoice
*improvement* too, not only a multi-invoice fix.

## 1. Grain resolution (grounded)

| Stage | Today | Board #4 | Note |
|---|---|---|---|
| 3 classify / 4 extract / 5 match_vendor | whole-doc, 1× | **per-region** | Stage 5 per-α forced (amazon=3 vendors, `:295-331`) |
| unknown short-circuit (`:223-256`) | case early-`return` | **per-α** | a region's `unknown` flags *its* α (`document_type='unknown'`); never aborts the case |
| 6 completeCandidate (`:769`) / 6.5 resolveCandidates (`:1432`) | case-grained | **stays case-grained-once (v1)** | common case = N new invoices → no candidates → `needs_review`; per-α candidate matching deferred (needs α-ref on `document_relationship_candidates`). **Input under N-α (named, per advisor):** for N>1, Stage 6 candidate matching is **skipped** (deferred; the case routes to `needs_review` regardless), and Stage 6.5 routes the case **once** → `needs_review`; N=1 runs Stage 6 as today on the single α's fields. Any choice is outcome-compatible (route-to-needs_review), so this is the explicit v1 pick, not a forced one. |
| 7 buildProposal → park (`:493-622`) | 1 ephemeral card, discarded | **write N α; route case** | pipeline stops building/discarding a card; it persists N α + routes the case to `needs_review` |
| review **detail** (`buildReviewPreview`) | re-extract → 1 card | **read N α → N cards** | the reversal; closes the Tier-C residual |
| review **inbox** (`listReviewCases`) | 1/case | **1/case (+ "N invoices" indicator)** | minimal; `posted` probe already multi-JE-aware (`:73-91`) |
| approve-post | rebuild 1 → 1 bill | **loop N α → N bills** | T3 + aggregate committed-marking T4 |

## 2. The seam — where N enters and where it collapses

- **Pipeline (Stage 2.5 + per-region 3-5):** segment the bbox artifact → N regions
  (deterministic ordinal); loop classify+extract+match_vendor per region; write one
  **pending** α per region via the T1 RPC (`extractedInvoiceWriteService`).
  Stage 6/6.5 runs **once** at case grain (routes the N-invoice case to
  `needs_review`); Stage 7 no longer builds+discards a card — the α rows *are* the
  persisted proposal inputs.
- **Review detail:** `buildReviewPreview` reads the case's N α rows; per α it
  re-runs `matchVendor` (pure read; from `α.extracted_fields.vendor_name`) +
  `buildProposal` → **N cards**. No re-extraction.
- **approve-post:** loop the N α → `buildPostBillInput(α)` → `billService.post`
  (per-invoice key from `α.idempotency_key`, T5) → N bills; aggregate
  committed-marking (T4).

  *Shipped realization (T5 close, 2026-07-11):* the per-invoice key is not read back
  from `α.idempotency_key` at the post — at first-post/crash-recovery that column is
  NULL (chicken-and-egg). `childKeyFor` deterministically recomputes it (over write-once
  α fields) and `postExtractedInvoice` persists it write-once. See friction-journal
  2026-07-11.

## 3. DECISION — one path (α always), not two — LOCKED (Phil, 2026-07-01)

> **⚠ SUPERSEDED 2026-07-11 → TWO paths (α only for multi-invoice). The premise
> below is dead in the shipped pipeline.** This decision rests on "Segmentation
> always runs (you can't know N before segmenting)." The **T2b reversal
> (2026-07-10, `t2b-design.md §3`, accepted by Phil)** falsified that premise:
> segmentation is now AI-multi-extract **gated behind `looksMultiInvoice`** — a
> cheap pre-segmentation read of "probably N=1" — so the single-invoice path is
> **untouched and writes NO α** (grounded first-hand at `ingestDocument.ts` Stage
> 2.5: the sole α write is triple-nested inside `looksMultiInvoice` **and**
> `invoices.length > 1`). Consequences that were **recorded on the segmentation
> axis but never propagated here** (the doc captured half of one decision):
> - **one path → TWO paths.** α is written only for reconciled N≥2 splits; every
>   single-invoice doc (the majority) writes no α. The "two paths" this section
>   explicitly *rejected* is the shipped reality.
> - **the α-absent fallback is PERMANENT, not a temporary drain.** It is the
>   single-invoice path, not a cutover queue that "retires once the pre-board-#4
>   review queue drains." The drain-and-retire framing below is void.
> - **Reading A ratified (Phil 2026-07-11):** T2.5 is additive — `buildReviewPreview`
>   reads α → N cards *when α present*, else today's Tier-A rebuild (permanent).
>   Single-invoice review is byte-for-byte untouched; the single-invoice
>   Tier-C→`NOT_POSTABLE` residual the "α always" bonus would have closed survives
>   as a **named post-v1 carry-forward**.
>
> The original §3 text is preserved below (provenance, not rewritten). It is the
> N-1-era reasoning; read it as history, not as the governing decision.

**Segmentation always runs** (you can't know N before segmenting), so the pipeline
**always writes α** (N≥1). Therefore review + approve-post **always read α** — one
code path, N=1 is just one α.

- **N=1 is a strict generalization *and* an improvement:** one region → one α →
  one card → one bill = today's single-invoice result, **plus** α persists the
  full (Tier-C-capable) extraction, so N=1 read-α ≥ N=1 re-extract (closes the
  Tier-C `NOT_POSTABLE` residual). Not a regression — a strict improvement, *if* α
  persists the pipeline's real extraction (Tier A or C), which it does.
- Rejected — **two paths (re-extract for N=1, α for N>1):** two code paths, the
  N=1 path keeps the Tier-C residual, and you still segment always — so it buys
  nothing but divergence. One path is simpler and strictly better.
- **Blast-radius honesty (two risks, both must be handled):**
  1. **Behavioral:** one-path changes the live single-invoice review from
     re-extract to read-α. Regression-tested (N=1 read-α = same card as today's
     re-extract on a Tier-A doc; a *better* card on Tier-C). Where the T7 tests
     concentrate.
  2. **Cutover (deploy-safety, GROUNDED):** existing review-queue cases have **no α
     rows** — α is board #4, they predate Stage 2.5. Prod has review-track cases
     *now* (4 `needs_review` at the last count; α absent by definition since the
     table isn't in prod). A naive read-α cutover **strands them** —
     `buildReviewPreview` finds nothing to read. **Mitigation (part of T2.5): an
     α-absent fallback** — when a case has zero α rows, `buildReviewPreview` uses
     the existing Tier-A re-extract path; retired once the pre-board-#4 review
     queue drains. (Alternative: retroactively segment + backfill α for the queue —
     heavier, riskier; the fallback is the lean.) This bites at cutover, not in
     tests, so it is a **required** T2.5 sub-task, not a nicety.

## 4. What reshapes from Phase 1 (the supersession content)

- **build-spec §1.5 (T3):** "the fan lives at approve-post" → **the fan spans the
  review surface**; `buildReviewPreview` reads α (N cards), the inbox gets an
  N-indicator, approve-post loops α. T3 stands but is one of three N-sites, not the
  site.
- **T1 stands unchanged:** α needs **no vendor column** — `matchVendor` is a pure
  read re-derivable from `α.extracted_fields.vendor_name` (confirmed vs
  `extractVendorFields`). Migration not reopened.
- **New v1 task surfaced:** the review-surface reversal (`buildReviewPreview` reads
  α) is its own task, call it **T2.5** — between the segmenter (T2) and the
  approve-post loop (T3). §1.6's task list gets it inserted.
- **Deferred (post-v1):** per-α Stage-6 candidate matching (duplicate-detection per
  invoice) — needs an α-reference on `document_relationship_candidates`; the common
  N-new-invoice case doesn't need it.

## 5. Revised task order (supersedes §1.6 middle)

1. **T1** α migration — DONE (`d5d4f1be`, local).
2. **T2** Stage 2.5 segmenter + per-region 3-5 loop → N pending α; unknown per-α;
   Stage 6/6.5 once; Stage 7 writes α not a card.
3. **T2.5** (NEW) review-surface reversal — scope (refined per advisor grounding):
   (a) `buildReviewPreview` reads N α → N cards (no re-extract) **with the α-absent
   fallback** (§3 cutover: zero-α cases use the existing Tier-A re-extract path);
   (b) the inbox **stays case-grained** (`listReviewCases` is one-row-per-case,
   grounded) — at most a light aggregate badge ("3 invoices, 2 postable"), NOT a
   listing fan. The reversal concentrates in `buildReviewPreview`.
4. **T3** approve-post loops N α → N bills (persisted per-α key).
5. **T4** aggregate committed-marking (case→committed iff all α posted).
6. **T5** persisted per-α idempotency key — **DONE (subsumed into T3 `d881243c`+`9597dc45`; see friction-journal 2026-07-11)**. **T6** G3 stuck-invoice affordance.
7. **T7** tests — incl. the one-path N=1-no-regression (read-α ≡ today on Tier-A;
   ≥ today on Tier-C) + N=3 deterministic-ordinal + unknown-per-α + partial-post.

## 6. Design-onset items (confirm first-hand before each task)

1. `resolveCandidates` full body (`:1432`) — confirm it routes case-once cleanly
   with N α present (read at T2 onset; only its signature/usage read so far).
2. The sub-artifact shape for per-region classify/extract (does a region need
   `pages`/`words` sliced, or only `lines`? — classify/extract read `lines` via
   `extractOcrText`, but confirm no `words`/`pages` consumer).
3. `buildReviewPreview`'s exact read set to swap re-extraction for α-reads without
   disturbing the IDOR-root sequencing (`loadReviewPreviewRows`).
