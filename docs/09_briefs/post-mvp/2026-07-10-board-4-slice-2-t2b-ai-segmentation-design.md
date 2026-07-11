# Board #4 — Slice 2 T2b — AI-assisted segmentation (option A + D fallback) — Design

> **Status:** DRAFT design — grounded seam; the architecture (esp. the §3 reframe)
> is WSL + Phil's call; advisor verifies grounding. No code. No prod writes.
> **Authored:** 2026-07-10 (WSL). Branch `feat/board-4-slice-2` (T2a at 997fe2cf).
> **Decision carried:** segmentation = **A (AI-assisted) for the split, D (N=1
> degrade) as fallback** (Phil 2026-07-10).
> **⚠ REVERSES §1.4's N-1 lock → N-2 — ACCEPTED (Phil 2026-07-10)**, justified by
> the `pages={count:6}` region-grouping-infeasibility finding. Provenance cost:
> deterministic region-anchor → **AI-derived soft locator** (§4.5), NOT "lost."
> **D-3 grounded to FREE-TEXT** (board-2 array-collapse; §4-D3). **Folded in:**
> soft-provenance (§4.5) + a deterministic **arithmetic reconciliation gate** (§5).
> Next: record the §1.4 reversal into the committed supersession, then build T2b.
> **Grounding:** callClaude + runAiExtractFallback read first-hand; the Amazon
> structure (6pg/3inv, no per-line page attribution) read from prod. Advisor verifies.

---

## 1. Why A (grounded): deterministic segmentation is infeasible on the real artifact

Prod grounding (Amazon `3433cfe3…`): `pages = {"count": 6}` — a **count only, no
per-line page attribution**; each `line` is `{bbox, text, confidence}` with
**per-page-reset coordinates** (same invoice number at `y81` and `y288/316`; three
"Invoice/Facture" at `y40-53`); 3 invoices span 6 pages, interleaved. So top-y
clustering, x-columns, and page-based splitting all fail (§T2b finding). The
structure Claude *can* reason about — group by invoice number across a messy
6-page layout — is exactly what deterministic spatial rules cannot. Hence A.

## 2. The seam to reuse (grounded)

- **`callClaude(params, log) → Message`** (`callClaude.ts:99`): thin seam; passes
  `params` straight to `client.messages.create`. **NOTE — T2b uses free-text-parse,
  NOT structured output (D-3, grounded below)**, so this is the plain messages
  path, not `output_config`. Fixture branch
  (`__setMockFixtureQueue`/`__setClientForTests`) makes it unit-testable without
  the API.
- **`runAiExtractFallback` pattern** (`aiFallbackExtractorBase.ts:90-261`): the
  shape to mirror — budget-gate (`tryConsumeCall`, `:116`) → build params
  (`:137-147`) → `callClaude` (`:151`) → fence-strip + `JSON.parse` (`:182-185`) →
  `schema.safeParse` (`:216`) → discriminated `{valid:true,fields} |
  {valid:false,reason}` (`:41-55`) with audit at each failure. This is the exact
  degrade scaffold D needs.

## 3. REFRAME — AI-*multi-extract* (this REVERSES §1.4's N-1 choice — recorded as such)

**Honest framing (advisor catch):** this reframe **is N-2 (array-extraction)** — the
path §1.4 explicitly REJECTED, on the argument that α needs a **region-anchor**, not
"an array index / invoice_number," or it becomes "a thin wrapper spending the reason
it was chosen." **So this reverses §1.4.** It is justified — but by a NEW input, not
a change of mind: prod grounding shows `pages={count:6}` with **no per-line page
attribution**, so N-1's deterministic region-grouping (the source of its provenance
edge) is **infeasible on this artifact**. N-1's advantage over N-2 was resting on a
capability the OCR doesn't actually provide.

- **ACCEPTED (Phil 2026-07-10), with a mitigation.** The trade is real, but
  deterministic region-anchoring is **infeasible** on this artifact — so the actual
  choice was *"invoice_number+fields, or no split at all (D-only)"*, and the split
  is worth more than D-only (D-only = Amazon → `needs_review` forever, defeating the
  arc). **Accurate recorded cost:** provenance degrades from **deterministic
  region-anchor** → **AI-derived invoice-number locator** (soft-provenance, §4.5) —
  NOT "provenance lost." A future *"show me where in the source"* audit gets a coarse
  trail (the line-span the AI drew each invoice from), not a guaranteed bbox. This
  rides the supersession into build-spec §1.4 as a **recorded reversal** with this
  exact framing.

**The middle-design assumed:** segment (2.5) → loop classify+extract per region (the
invasive **T2c mainline refactor**) → N α. **A makes that unnecessary:** Claude
reads the multi-invoice OCR and returns the **N invoices' extracted fields directly,
as a JSON array (FREE-TEXT — see D-3)** — one call yields what "segment + N×
classify/extract" would, and board-2 proved the model returns the correct 3-element
array on this exact doc. So:

- **AI-multi-extract call → N invoice objects → write N α** (extracted_fields +
  `document_type` per invoice; **`region_ref = {kind:'ai_soft', source_locator}`** —
  the soft-provenance (§4.5), NOT NULL. T1 unchanged: `region_ref` is a nullable
  JSONB that holds either kind; a Zod discriminated union types it (`ai_soft` now,
  `bbox` reserved for a future deterministic option B).
- **Deletes the risky per-region mainline refactor (T2c).** Single-invoice path
  unchanged; multi-invoice branch = one AI call → N α. The strict win on the risk
  axis the middle-design worried about — and the reason the reversal is worth its
  provenance cost, IF Phil accepts that cost.

## 4. Decisions to confirm (surfaced; Phil/advisor)

- **(D-1) Trigger — when does the multi-invoice branch fire?** Lean: reuse the
  **existing multi-invoice signal** — the normal extractor returning an *array* (or
  a cheap distinct-invoice-number count > 1 over the OCR text) — so the single path
  is untouched and the AI-multi-extract fires only when the doc looks multi-invoice.
  (Today that signal degrades to `needs_review`; board #4 replaces that with the
  AI-split.) Confirm the exact signal at impl.
- **(D-2) Budget.** The AI-segment call needs a budget like `tryConsumeCall`.
  Decide: share the per-document Stage-3/4 budget (max 2) or a dedicated
  segmentation budget. Lean: a **dedicated** 1-call segmentation budget (the
  multi-invoice branch is distinct from the Tier-C extract fallback; sharing could
  starve one).
- **(D-3) RESOLVED by grounding (advisor catch) — FREE-TEXT array, NOT structured
  output.** board-2 §6.4 (verified first-hand): free-text returned the correct
  3-element array on this exact doc (`:434-435`); **structured COLLAPSED** —
  single-object schema can't hold N (`:440-443`) — and structured was fragile even
  for ONE object (`:405-420`: *"Schema is too complex"* → had to drop `line_items`;
  *"Grammar compilation timed out"* → had to force required-nullable). An N-element
  structured array is strictly *more* complex → walks straight back into that wall.
  So T2b uses a **free-text prompt** asking for a JSON array of invoices →
  `JSON.parse` → Zod-validate an **array schema**
  (`z.array(<VendorInvoiceExtraction-ish>)`). This is exactly the
  `runAiExtractFallback` shape (fence-strip + parse + safeParse; **no
  `output_config`**). No structured output anywhere in T2b.

## 4.5 Soft-provenance (advisor mitigation — narrows the reversal's audit gap at zero cost)

Deterministic bbox region-grouping is infeasible (§1), but the **same free-text
call** can return, per invoice, a **coarse source locator** — the matched
invoice-number string and/or the line-text span the fields were drawn from. Costs
nothing extra (a few more fields in the same response). Persisted into
`α.region_ref` as `{ kind: 'ai_soft', invoice_number, source_locator }` (T1's
`region_ref` JSONB, unchanged). So:

- **`region_ref` is populated, not NULL** — it records *"this α's fields came from
  the lines mentioning CA542WJGEUEI"*, a real (if coarse) audit trail, rather than
  nothing.
- **The `kind` discriminator keeps the schema honest** — `ai_soft` says "AI-derived
  locator, not a deterministic bbox," so an auditor (and future code) knows exactly
  what provenance each α carries. If deterministic segmentation ever becomes feasible
  (option B, per-line page attribution), those α get `kind:'bbox'` and predate-vs-
  postdate is distinguishable.
- **A Zod schema** types `region_ref` as a discriminated union (`ai_soft` active;
  `bbox` reserved) — the α-write service (T2a) accepts it via the existing
  `region_ref?: Record<string, unknown>` param (no T1/T2a change).

## 5. The D fallback (safe degrade — the whole point of A+D)

Any of: budget exhausted · `callClaude` failure · parse fail · Zod fail · model
returns 1 invoice/refuses · **or the ARITHMETIC RECONCILIATION GATE fails** →
**degrade to N=1**: the doc processes as one α on the existing path → routes to
`needs_review` (today's behavior). A bad or unsure split therefore **never silently
mis-posts** — it falls back to a human, which is the spine.

**Reconciliation gate (advisor, deterministic — independent of model confidence):**
the free-text call also returns the **document-stated total**; if
`sum(invoice amounts) ≠ document total` (within a cent tolerance), the split is
**not trusted → degrade to N=1**. This is a *deterministic* correctness check that
doesn't rely on the model's self-assessment: for Amazon, `$14.55 + $11.19 + $15.65
= $41.39` (the stated total) reconciles; a mis-split that drops or double-counts an
invoice fails the sum and degrades. The gate is the primary confidence signal;
"model confidence" is secondary. The discriminated-union result
(mirroring `AiExtractResult`) carries the degrade reason for the audit trail.

## 6. Scope / revised T2 shape (supersedes middle-design §5 T2/T2c)

- **T2b (this):** the AI-multi-extract call (mirror `runAiExtractFallback` —
  free-text prompt → parse → Zod-validate an array schema; no structured output) →
  returns N invoice objects OR a degrade signal. Pure-ish; unit-testable via the
  callClaude fixture branch.
- **T2c (was: risky mainline per-region refactor) → now: thin branch.** On the
  multi-invoice trigger (D-1): call T2b; on success loop `createExtractedInvoice`
  (T2a) per returned invoice → N pending α; on degrade → N=1 existing path. **No
  per-region classify/extract loop; the single-invoice mainline is untouched.**
- **Unchanged (scope-level):** T2.5 (review reads α → N cards + α-absent fallback),
  T3 (post loop), T4 (aggregate marking), T5/T6, T7. **Caveat (2026-07-11):** the
  *scope* of T2.5 is unchanged, but this reversal changed the **character** of its
  α-absent fallback — it is now the **permanent** single-invoice path (single-invoice
  writes no α), not the temporary drain the middle-design §3 framed. See §6.2 and
  the middle-design §3 supersession (Reading A ratified).

### 6.1 T2c SHIPPED (this session) + HARD DEPLOY GATE — T2c must NOT reach prod without T2.5

T2c is wired into `ingestDocument.ts` (Stage 2.5, between OCR and classify) and is
locally green: 3 observable-state integration tests
(`multiInvoicePipelineWiring.integration.test.ts` — valid N-split, reconciliation-
degrade clean fall-through, single-invoice no-regression), typecheck clean, sibling
orchestrator test 9/9 unregressed. It is **local-testable now** but carries a
deploy-sequencing gate.

**GATE (with teeth): T2c must NOT be deployed to prod ahead of T2.5.** Grounded
first-hand at `reviewPreview.ts:266-267` + `:315`: `buildReviewPreview` rebuilds the
review card by **Stage-4 Tier-A re-extraction over the persisted artifact**
(`extractOcrText(artifact)` → Tier A) and **never reads the α
(`extracted_invoices`) rows**. So in the T2c→T2.5 window a multi-invoice case — now
parked at `needs_review` with N α rows written — would, when a human opens it in
review, render a SINGLE Tier-A card re-extracted over the *whole* multi-invoice OCR
text: a merged/garbled card a human could act on (approve-post the wrong single
bill). That is worse than pre-T2c (the doc would have flowed the single path). T2.5
(review reads α → N cards; α-absent Tier-A fallback for pre-T2c cases) closes it.

Not a build blocker — a deploy-order constraint. Until T2.5 ships, T2c stays behind
the deploy line (feature-flag or unmerged-to-prod), even though it is correct and
tested locally.

**Safety re-verify note:** the T2c false-negative guarantee (a missed/garbled
split degrades to the single path rather than mis-posting) rests PARTLY on the
Wave -1 auto-commit being DISABLED. The wiring parks; it does not itself assert
auto-commit is off. This guarantee MUST be re-verified when governed auto-commit
returns post-V1.

### 6.2 T2.5 SHIPPED (Reading A) — the deploy gate is now satisfiable

Built 2026-07-11 under **Reading A** (ratified by Phil; see the middle-design §3
supersession). `buildReviewPreview` now reads the case's α rows and, **when α are
present (multi-invoice case)**, builds **N cards** — one per α, from
`α.extracted_fields` (the verbatim pipeline extraction — no re-extraction) + a pure
per-α `matchVendor` + `buildProposal`. **When α are absent** (single-invoice — the
majority, which write no α — and any pre-T2c case), it uses the existing Tier-A
rebuild: the **permanent** α-absent fallback (§6.2 caveat above), byte-for-byte the
prior behavior.

The N-card case is **not postable via the single-bill approve-post path**:
case-level `postable=false` with reason `multi_invoice_post_deferred` (per-invoice
posting is **T3**'s N-bill loop). So T2.5 closes the gate on *both* halves the §6.1
gate named — the human sees N honest cards **and** cannot approve-post the wrong
single bill. (§6.1's `reviewPreview.ts:266-267`/`:315` line refs describe the
**pre-T2.5** code; the Tier-A rebuild still exists as the fallback but at shifted
lines.)

Sites touched: `reviewPreviewReadService.ts` (the first α read — `ORDER BY ordinal`,
org-safe via the verified parent case), `reviewPreview.ts` (the N-card branch +
`ReviewInvoiceCard` + the `invoices` field + `multi_invoice_post_deferred` reason),
`ReviewCaseDetailView.tsx` (the N-card render). Inbox stays case-grained (the light
"N invoices" badge is optional and deferred — not required to close the gate).
Observable-state tests in `reviewPreviewMultiInvoice.integration.test.ts`.

**Deploy note:** with T2.5 shipped, the §6.1 HARD DEPLOY GATE is *satisfiable* —
T2c+T2.5 may deploy together. (T3 still owes the N-bill post loop; until then a
multi-invoice case is review-visible as N cards but parks unposted, which is the
correct interim.)

## 7. Impl-onset items (confirm first-hand before building)

1. The exact multi-invoice trigger signal (D-1) — where the current array/Zod-reject
   happens (vendorInvoiceExtractor + the orchestrator Stage-4 site), to branch cleanly.
2. `aiFallbackBudget.ts` shape (`tryConsumeCall`) — to add or share a segmentation budget (D-2).
3. The free-text array prompt + the Zod array schema (`z.array(<VendorInvoiceExtraction-ish>)`)
   — NOT structured output (D-3, grounded). Tested via the callClaude fixture branch
   (seed a 3-element-array fixture; assert N α; seed a malformed/1-element fixture;
   assert the D degrade to N=1).
