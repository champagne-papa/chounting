# Tier-C eval/repro harness — design

> **Status:** DRAFT for review (2026-06-14). Authored via
> `superpowers:brainstorming`. The eval contract was decided in that
> dialogue (split architecture; 5-field Tier-A core); this doc records the
> validated design for an implementation plan. **§4 corrected 2026-06-14**
> after first-hand prod-OCR confirmation that the flagship seed case
> (176ac24c) is a multi-invoice doc, not a single-invoice #2 seed (see §4).
> **Build gate:** advisor verifies this doc against the grounding; Phil
> approves before any code.

## 1. Why this exists

The Tier-C arc (boards #2/#3/#4 — structured-output extraction, classify-unknown
repro-or-drop, per-vendor templates) all consume an honest *comparison* metric
the system does not have today. A deterministic Tier-A accuracy **baseline
already exists** (Wave 5 D1: `tests/integration/extractionAccuracy.integration.test.ts`
+ the frozen `BASELINE_TALLY`, 2026-06-02). What is missing is (a) an
extractor-**parameterized** runner so a new structured-output extractor is scored
against that baseline over the same frozen corpus + `SCORED_FIELDS` and the delta
attributed to a cause, and (b) the paid Tier-C scored run (gated). This harness
adds those — it remains the gating prerequisite for attributing an
extraction-accuracy delta to a cause instead of tuning blind.

It is also the **right Tier-C-arc opener while the SharePoint Azure clock runs** —
the buildable-now scope (below) is entirely operator-independent and
Azure-independent.

### Eval contract (decided, not re-litigated here)

- **Split, not one artifact** — a thin **repro-runner** (#3) and a **scored
  eval-set** (#2/#4) are different kinds of thing (a routing/exception boolean
  vs. a multi-field score). `tests/helpers/extractionEval.ts` already drew this
  line ("the no-AI Tier-A extraction eval"); #3 is an `exception_reason` query.
- **5-field Tier-A core as the comparable metric** — `SCORED_FIELDS` (the
  Tier-A-producible subset) is kept as the apples-to-apples metric across a
  baseline extractor vs. the new structured-output. Extension to the other
  structured fields is **additive and deferred to #4** (see §2.4).

## 2. Scored eval-set (#2/#4)

Reuses the existing substrate verbatim; the only genuinely new logic is a thin
runner.

### 2.1 Reused substrate (verified first-hand)

- **`tests/helpers/extractionEval.ts`** (Wave 5 D1) — the pure scorer:
  `scoreExtraction(extracted, truth, scoredFields)` → `DocScore`;
  `coverage = covered/trulyPresent`; `correctness = correct/populated`;
  coverage and correctness kept **separate** (absent ≠ wrong); type-aware
  `valuesMatch` (`"$1,433.25" == 1433.25`, `"AMEX" == "amex"`). `scoreExtraction`
  takes a plain `Record<string, unknown>` → **extractor-agnostic by
  construction**.
- **`ocrTextFromLines(lines)`** (same file) — routes a corpus doc's `lines`
  through the **real** `extractOcrText`, so the harness input is exactly
  production Tier-A input.
- **`tests/fixtures/classifier/real-ocr/corpus.sanitized.ts`** — the frozen,
  PII-sanitized real-OCR corpus (~10 docs), `RealOcrFixture` =
  `{label, source, expectedType, captureError?, lines[]}`.
- **`SCORED_FIELDS`** — `vendor_invoice`: `amount, currency,
  vendor_invoice_number, accounting_date, due_date`; `receipt` / `payment_confirmation`
  analogues.
- **`tests/fixtures/extraction/extractionGolden.ts`** — `EXTRACTION_GROUND_TRUTH`
  (the **existing, sole** ground-truth home; human-from-source, anti-circular per
  its header, keyed to corpus `label`) **and** the frozen `BASELINE_TALLY`
  regression ratchet (2026-06-02).
- **`tests/integration/extractionAccuracy.integration.test.ts`** — the existing
  **CI-runnable** (ungated) Tier-A baseline harness this work refactors to consume
  the new parameterized runner.

### 2.2 Ground truth (reuse the existing sole home)

Ground truth **already exists** as `EXTRACTION_GROUND_TRUTH` keyed by corpus
`label` (`extractionGolden.ts`) — the sole home, with the label-from-source /
anti-circular discipline already implemented (its header: "HUMAN ground truth read
from each sanitized document — NOT the extractor's output"). The three clean
single-invoice docs (`demo_figma_invoice`, `adobe_invoice`, `mattjanzen_invoice` —
incl. mattjanzen's `31/10/25` DD/MM date-trap) are already labeled with the
5-field core. **Do NOT add an `expectedExtraction?` field to the fixture** — a
second ground-truth home can drift from the first. The new runner reads truth via
an injected `truthFor(label)` that resolves `EXTRACTION_GROUND_TRUTH`. The
REQUIREMENT below is satisfied, not removed.

**REQUIREMENT — label from the source document, not from `lines[]`.** The label
is what the document *truly says* (the 5 core fields). If lifted from the same
OCR `lines[]` the extractor consumes, a systematic OCR error becomes both the
input and the ground truth → a case scores **correct-on-garbage**. Labels are
human ground-truth, verified against the source doc (a human-judgment step, not a
programmatic derivation — see §4).

The fence holds **hardest on the noisy docs**, precisely where "from lines" is
most tempting and most wrong: the Adobe fixture's garbled PST, mattjanzen's
`31/10/25` **DD/MM date-trap** (the exact ambiguity the Tier-C work targets), and
the Amazon multi-page garble. Those are where label-from-source earns its keep.

### 2.3 The runner (new — the only real new logic)

`runExtractionEval(extractor, corpus, truthFor)` — extractor-parameterized:

```
for each corpus doc:
  ocr   = ocrTextFromLines(doc.lines)
  out   = extractor(ocr, doc.expectedType)     // Tier-A baseline | structured-output
  truth = truthFor(doc.label)                  // EXTRACTION_GROUND_TRUTH[label] ?? {}
  score = scoreExtraction(out, truth, SCORED_FIELDS[doc.expectedType])
aggregate → { coverage, correctness } per extractor-version
```

The **#2 before/after delta** = run it twice (baseline vs. new structured-output)
over the **same frozen corpus + same `SCORED_FIELDS`**, diff the aggregates. A
case the baseline extractor mishandles scores low coverage/correctness; the
structured-output should recover the core fields — that delta is the metric.

### 2.4 Deferred extension (two-tier, scoped honestly)

Extending past the 5-field core is **not uniformly cheap**:
- **Scalar structured fields** (`vendor_name`, `account_code`, `tax_code_id`,
  `tax_amount`) — slot into the verified scalar `valuesMatch` for free; additive
  whenever #4 wants them.
- **`line_items`** (`z.array` of objects) — falls through `valuesMatch`'s scalar
  path (`String([object Object]…)` — a useless compare); requires a
  **line-item-aware scorer extension**, scoped as its own small piece when #4
  opens. NOT assumed free.

Option-1 (5-field core) keeps #2's before/after **entirely inside the verified
scalar scorer** — no scorer work, no broken array compare.

## 3. Tier-C determinism — gated, with raw-output capture

Scoring the structured-output extractor invokes **real Claude** → paid +
non-deterministic (fights "stable scorer"). Decision:

- **Deterministic Tier-A baseline** scored-set runs **free in CI** (no AI — the
  Wave-5-D1 intent).
- The **Tier-C / structured-output** scored run is **gated** (`RUN_*_EVAL`, paid,
  on-demand) — same pattern as `RUN_SHAREPOINT_E2E` / `RUN_MODAL_E2E`.

### 3.1 Capture REQUIREMENT — raw, pre-Zod output

The gated Tier-C run **captures the model's raw text/JSON response *before* the
schema gate**, keyed by `(corpus doc, extractor-version)`, so the score is
re-computable deterministically and re-runnable without re-billing.

**This must be the raw pre-`safeParse` output, NOT the parsed/validated
extraction.** The #2 population is exactly the Zod-failing cases; a fixture that
stores only the post-`safeParse` result captures **nothing** for the cases that
matter, and you can't diff what structured-output changed. Capturing raw also
**retroactively closes the "raw model output uncaptured" gap** the 176ac24c
forensic flagged — the eval harness becomes the thing that finally captures it.

### 3.2 Honest labeling of a captured sample

A captured Tier-C run is a **frozen sample of a non-deterministic model**: the
re-computed score is deterministic but it is the score *of that sample*, not
"the structured-output extractor's true accuracy." Capture fixtures are stamped
**captured-sample · dated · model-version** so a later reader does not treat one
run as the extractor's accuracy. (Same "unit-proven ≠ proven" discipline that
ran through the SharePoint arc.)

## 4. Seed cases — corrected after first-hand confirmation (2026-06-14)

**176ac24c is a board-#4 (multi-invoice) case, NOT a single-invoice #2 seed —
confirmed first-hand against prod OCR.** Its PDF
(`Amazon_CA56SWET7X6I_..._$41.39_Invoice.pdf`, source_document `3433cfe3…`) is
**three invoices in one document** (`document_artifacts.lines`):
`CA56SWET7X6I` $14.55 · `CA542WJGEUEI` $11.19 · `CA5KJ23M1ZFI` $15.65. The sum is
`$41.39` — the **filename amount is the sum**, and its invoice number is just the
**first** of the three. (The committed corpus `amazon_invoice` fixture is the
sanitized version of this same doc.)

Consequences:
- A single-object `GroundTruth` cannot represent three invoices, so 176ac24c
  **cannot be a single-invoice #2 seed**. It is the deferred **board-#4
  multi-invoice** case (consistent with §7's #4 deferral). The multi-invoice
  model is Phil's architecture authority — this reframe **defers** 176ac24c, it
  does not pre-judge that model.
- The original "array-failure" on 176ac24c is now explained: extraction returned
  a **3-element array** → the single-object `VendorInvoiceExtractionSchema`
  rejected it. The board-#2-vs-#4 / 1-vs-N question is **resolved by the OCR:
  N=3, multi-invoice** — not awaiting a capture. The (B)-not-(A) verdict still
  holds (it was classified `vendor_invoice` and Zod-failed); only the earlier
  "filename hints single-invoice" sub-claim was wrong (filename = first invoice
  number + sum). A one-line correction to the committed CURRENT_STATE forensic
  follows this reframe (persist-don't-defer).

**Buildable-now #2 seed: the clean single-invoice corpus docs (already committed
+ sanitized + ALREADY LABELED).** The #2 metric is already seeded — the clean
single-invoice fixtures (`demo_figma_invoice`, `adobe_invoice`,
`mattjanzen_invoice`) carry their 5-field-core labels in `EXTRACTION_GROUND_TRUTH`
(`extractionGolden.ts`), labeled from source per §2.2 — no prod-fetch, no new
sanitization, no new labeling. mattjanzen's `31/10/25` DD/MM date-trap is already
labeled from source (the exact correct-on-garbage hazard §2.2 forbids).

**Deferred to board-#4:** 176ac24c's prod-fetch + PII-sanitization sign-off + the
multi-invoice ground-truth shape ship with #4, on Phil's multi-invoice
architecture call — out of the buildable-now scope.

**`amazon_invoice` (the committed sanitized fixture of this same doc) — Tier-A
baseline: RETAINED, scored first-sub-invoice; Tier-C #2/#4 multi-invoice model:
DEFERRED to board-#4.** The fixture stays a scored member of `BASELINE_TALLY` (a
legitimate Tier-A datapoint — what the deterministic extractor yields on
concatenated OCR). The board-#4 deferral applies only to the Tier-C
structured-output multi-invoice model + GT shape + prod-fetch/PII sign-off.
Removing the entry to "defer amazon" would drop `vendor_invoice` `trulyPresent`
16→13 and fail the frozen ratchet — do not. (The `extractionGolden.ts` annotation
carries the matched wording.)

## 5. Thin repro-runner (#3)

A script/test, separate from the scored eval-set:
- The discriminating query: `select exception_reason, count(*) from
  exception_queue_entries group by 1` — `unknown_document_type` is **currently
  0** (grounded 2026-06-14; all 4 prod exceptions are `unmatched_router_candidate`).
- For any `unknown_document_type` rows that exist, re-run classify on their OCR
  (gated, real Claude) → does the classifier genuinely emit `unknown` on a
  legible doc → **repro-or-drop**.
- `document_type` cannot discriminate (every case reads `unknown` per the
  persist-gap finding); the runner keys on `exception_reason` + the audit trail.

## 6. Testing strategy (TDD)

- **Pure aggregation** (the runner's scoring/aggregation) — unit-tested with mock
  extractor outputs + ground truth; no AI, no DB. RED→GREEN.
- **Real-extractor-over-corpus** — the gated integration piece (Tier-A baseline
  runnable in CI; Tier-C gated/paid).
- Reuses the repo's gating conventions (`describe.skipIf(!RUN_*)`, `apps/web`
  vitest) and the mock-Claude fixture-queue pattern for deterministic unit
  coverage of the structured-output path's parsing.

## 7. Scope

**Buildable now (Azure-independent — the Tier-C-arc opener):**
- The extractor-**parameterized** runner (`runExtractionEval`) + its
  pure-aggregation unit tests — the genuinely-new logic.
- Refactor the existing `extractionAccuracy.integration.test.ts` to consume the
  runner (behavior-preserving; `BASELINE_TALLY` unchanged).
- The #3 thin repro-runner (pure logic + unit tests; gated live runner).

*Already shipped (Wave 5 D1 — NOT rebuilt):* the **#2 seed** labels on the clean
single-invoice docs (figma, Adobe, mattjanzen) live in `EXTRACTION_GROUND_TRUTH`,
labeled from source; the deterministic **Tier-A baseline** metric is CI-runnable
(`extractionAccuracy.integration.test.ts` + frozen `BASELINE_TALLY`). No
`expectedExtraction?`-on-fixture — reuse the single ground-truth home.

**Gated / on-demand (not v1-blocking):**
- The Tier-C / structured-output scored run (paid, `RUN_*_EVAL`) + the raw-output
  capture fixtures.

**Out of scope (named, deferred):**
- **176ac24c / the Amazon multi-invoice doc → board-#4 seed** — the **Tier-C
  multi-invoice model** is deferred (confirmed N=3 — §4); its prod-fetch +
  sanitization + multi-invoice ground-truth shape ship with #4. The **Tier-A
  baseline** `amazon_invoice` fixture is **retained, scored first-sub-invoice**
  (stays in `BASELINE_TALLY`) — NOT removed.
- `line_items` scorer extension (→ #4, its own piece per §2.4).
- The scalar structured-field extension (→ #4, additive).
- The structured-output extractor itself (#2) and per-vendor templates (#4) —
  this harness is their prerequisite, not their implementation.

## 8. Actor split (build)

WSL designs/builds; advisor verifies proven-vs-inferred at each step; Phil
commits/pushes and signs off the human-judgment steps (the corpus-doc labels;
and, when #4 opens, the 176ac24c prod-fetch + PII sanitization). The buildable-now
scope is operator-independent; the gated Tier-C run waits on a paid on-demand
execution, not on Azure.
