# Tier-C eval/repro harness — buildable-now Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the Azure-independent, buildable-now slice of the Tier-C eval/repro harness: an extractor-*parameterized* scored-eval runner (enabling a baseline-vs-structured-output delta) plus a board-#3 classify-unknown repro-runner — reusing the already-shipped Wave-5-D1 substrate rather than rebuilding it.

**Architecture:** The Wave-5-D1 harness already scores the Tier-A baseline over the real-OCR corpus (`extractionAccuracy.integration.test.ts` + the pure scorer in `extractionEval.ts` + the `EXTRACTION_GROUND_TRUTH` labels + the frozen `BASELINE_TALLY` ratchet). This plan extracts the inline `tierAFor`/`scoreCorpus` logic into a reusable, extractor-parameterized `runExtractionEval(extractor, corpus, truthFor)` (so the *same* runner scores a future structured-output extractor and diffs the aggregates), refactors the existing harness to consume it behavior-preservingly (the `BASELINE_TALLY` ratchet is the proof), and adds a board-#3 repro-runner split into pure logic (CI-unit-tested) + a gated live runner (on-demand, real Claude). Ground truth stays in its single existing home (`EXTRACTION_GROUND_TRUTH`) — no second `expectedExtraction?` home. The design doc + CURRENT_STATE get a reconciliation pass first.

**Tech Stack:** TypeScript, Vitest 2 (`@chounting/web`), Supabase (`adminClient`), the in-repo Anthropic `callClaude` client (gated).

---

## Why this plan deviates from the design doc as written

Grounding the design doc's §7 "buildable-now" scope against disk (2026-06-14) found **3 of its 5 items already shipped** under Wave 5 D1, and **item 2 conflicts** with shipped substrate. The advisor verified this first-hand and ratified the reuse-minimal scope:

| § 7 item | On-disk status | This plan |
|---|---|---|
| Runner `runExtractionEval` | **NEW** (existing harness has a hardcoded inline `tierAFor`, not parameterized) | **Task 2 + 3** |
| `expectedExtraction?` on `RealOcrFixture` | **CONFLICT** — ground truth already exists as `EXTRACTION_GROUND_TRUTH` (sole home) | **Not built** — reuse the single home (Task 1 reframes §2.2) |
| Label figma/adobe/mattjanzen from source | **ALREADY DONE** (`extractionGolden.ts:31-58`, anti-circular, incl. the `31/10/25` date-trap) | **Not rebuilt** |
| Deterministic Tier-A baseline metric (CI) | **ALREADY EXISTS** (`extractionAccuracy.integration.test.ts`, ungated; frozen `BASELINE_TALLY`) | **Not rebuilt** — refactored in place (Task 3) |
| #3 thin repro-runner | **NEW** | **Task 5 + 6** |

**Decisions ratified (advisor + Phil):** (A) reuse-minimal, single GT home; (B) `amazon_invoice` stays in the Tier-A baseline as the first-sub-invoice projection (deferring **only** the Tier-C multi-invoice model to board-#4) — removing it would drop `vendor_invoice` `trulyPresent` 16→13 and silently lower the frozen baseline, exactly what the ratchet exists to block.

---

## File Structure

| File | Responsibility | Task |
|---|---|---|
| `docs/09_briefs/post-mvp/2026-06-14-tier-c-eval-harness-design.md` | Design record — reconcile §1/§2.1/§2.2/§2.3/§4/§7 to disk | 1 |
| `docs/09_briefs/CURRENT_STATE.md` | Make the 176ac24c supersession re-verify self-contained (prod artifact, not the design doc) | 1 |
| `apps/web/tests/helpers/extractionEval.ts` | + `ExtractionFn`, `EvalCorpusDoc`, `runExtractionEval` (pure) | 2 |
| `apps/web/tests/unit/extractionEval.test.ts` | + unit coverage for `runExtractionEval` | 2 |
| `apps/web/tests/integration/extractionAccuracy.integration.test.ts` | Refactor `scoreCorpus`/`tierAFor` to consume `runExtractionEval` (behavior-preserving) | 3 |
| `apps/web/tests/fixtures/extraction/extractionGolden.ts` | Contract-stating `amazon_invoice` annotation (matched wording with §4/§7) | 4 |
| `apps/web/tests/helpers/classifyUnknownRepro.ts` | Pure board-#3 logic: `tallyByReason`, `selectUnknownRows`, `reproVerdict` | 5 |
| `apps/web/tests/unit/classifyUnknownRepro.test.ts` | + unit coverage for the pure logic | 5 |
| `apps/web/tests/integration/classifyUnknownRepro.integration.test.ts` | Gated live runner (real Claude; loop empty against today's prod) | 6 |

**Command reference** (exact):
- Single test file: `pnpm --filter @chounting/web test <name-substring>` (e.g. `pnpm --filter @chounting/web test extractionEval`)
- Typecheck: `pnpm typecheck`
- Ship gate: `pnpm agent:validate`
- Full suite (push-readiness): `pnpm test:full`

---

## Task 1: Reconciliation pass (design doc + CURRENT_STATE)

**Docs-only — no TDD.** Lands as the finalization of the pending commit bundle (design doc + the CURRENT_STATE forensic correction), *before* the code tasks. Per CLAUDE.md "Multi-line Edit anchor confirmation (Z1 #11.a)": **Read each target block immediately before editing** so the Edit `oldText` matches exact bytes.

**Files:**
- Modify: `docs/09_briefs/post-mvp/2026-06-14-tier-c-eval-harness-design.md`
- Modify: `docs/09_briefs/CURRENT_STATE.md:122-130`

- [ ] **Step 1: §1 — the Tier-A baseline metric exists today**

In `## 1. Why this exists`, the sentence "all consume an **honest accuracy metric the system does not have today**" overstates the gap. Replace it so it reads (substance):

> The Tier-C arc (boards #2/#3/#4) all consume an honest *comparison* metric the system does not have today. A deterministic Tier-A accuracy baseline **already exists** (Wave 5 D1: `extractionAccuracy.integration.test.ts` + the frozen `BASELINE_TALLY`, 2026-06-02). What is missing is (a) an extractor-**parameterized** runner so a new structured-output extractor is scored against that baseline over the same frozen corpus + `SCORED_FIELDS` and the delta attributed to a cause, and (b) the paid Tier-C scored run (gated). This harness adds those.

- [ ] **Step 2: §2.1 — add the two omitted reuse artifacts**

The §2.1 "Reused substrate (verified first-hand)" bullet list omits the existing ground-truth + baseline-harness. Add two bullets:

> - **`tests/fixtures/extraction/extractionGolden.ts`** — `EXTRACTION_GROUND_TRUTH` (the **existing, sole** ground-truth home; human-from-source, anti-circular per its header, keyed to corpus `label`) **and** the frozen `BASELINE_TALLY` regression ratchet.
> - **`tests/integration/extractionAccuracy.integration.test.ts`** — the existing **CI-runnable** (ungated) Tier-A baseline harness this plan refactors to consume the new parameterized runner.

- [ ] **Step 3: §2.2 — reuse the single GT home, do not add a second**

Rewrite §2.2 so it no longer proposes `expectedExtraction?` on `RealOcrFixture`. Substance:

> Ground truth **already exists** as `EXTRACTION_GROUND_TRUTH` keyed by corpus `label` (`extractionGolden.ts`) — the sole home, with the label-from-source / anti-circular discipline already implemented (its header: "HUMAN ground truth read from each sanitized document — NOT the extractor's output"). The three clean single-invoice docs (`demo_figma_invoice`, `adobe_invoice`, `mattjanzen_invoice` — incl. mattjanzen's `31/10/25` DD/MM date-trap) are already labeled with the 5-field core. **Do NOT add an `expectedExtraction?` field to the fixture** — a second ground-truth home can drift from the first. The new runner reads truth via an injected `truthFor(label)` that resolves `EXTRACTION_GROUND_TRUTH`.

Keep the §2.2 REQUIREMENT paragraph (label-from-source, the noisy-doc fence) — it is satisfied, not removed.

- [ ] **Step 4: §2.3 — runner reads `truthFor(label)`, not `doc.expectedExtraction`**

In the §2.3 pseudocode, change the truth source. Replace:

```
for each corpus doc with expectedExtraction:
  ocr  = ocrTextFromLines(doc.lines)
  out  = extractor(ocr, doc.expectedType)      // Tier-A baseline | structured-output
  score = scoreExtraction(out, doc.expectedExtraction, SCORED_FIELDS[doc.expectedType])
```

with:

```
for each corpus doc:
  ocr   = ocrTextFromLines(doc.lines)
  out   = extractor(ocr, doc.expectedType)     // Tier-A baseline | structured-output
  truth = truthFor(doc.label)                  // EXTRACTION_GROUND_TRUTH[label] ?? {}
  score = scoreExtraction(out, truth, SCORED_FIELDS[doc.expectedType])
```

- [ ] **Step 5: §4 / §7 — amazon matched-wording note (no removal)**

In §4 (consequences) and §7 (Out of scope), make the amazon disposition explicit and tier-scoped, using the **exact** wording that Task 4 will mirror in `extractionGolden.ts`:

> **`amazon_invoice` — Tier-A baseline: RETAINED, scored first-sub-invoice; Tier-C #2/#4 multi-invoice model: DEFERRED to board-#4.** The doc stays a scored member of `BASELINE_TALLY` (a legitimate Tier-A datapoint — what the deterministic extractor yields on concatenated OCR). The board-#4 deferral applies only to the Tier-C structured-output multi-invoice model + GT shape + prod-fetch/PII sign-off. Removing the entry to "defer amazon" would drop `vendor_invoice` `trulyPresent` 16→13 and fail the frozen ratchet — do not.

- [ ] **Step 6: CURRENT_STATE — self-contained re-verify**

Read `docs/09_briefs/CURRENT_STATE.md:118-130`. The supersession block's re-verify (lines 129-130) points at the design doc, which is movable. Replace:

```
    Re-verify: the OCR query in
    `docs/09_briefs/post-mvp/2026-06-14-tier-c-eval-harness-design.md` §4.
```

with a self-contained prod-artifact query (the load-bearing facts are already inline above it):

```
    Re-verify: `select lines from document_artifacts where source_document_id =
    '3433cfe3-250e-4adc-ba7b-e803c9e6f334';` (prod `ollyqiiwdvbpbngqgjqk`) — the
    three sub-invoice numbers + amounts above read directly from that row.
```

- [ ] **Step 7: Commit (the bundle finalization)**

```bash
git add docs/09_briefs/post-mvp/2026-06-14-tier-c-eval-harness-design.md docs/09_briefs/CURRENT_STATE.md docs/09_briefs/post-mvp/2026-06-14-tier-c-eval-repro-harness-plan.md
git commit -m "docs(tier-c): reconcile eval-harness design to shipped Wave-5-D1 substrate + self-contained CURRENT_STATE re-verify"
```

---

## Task 2: `runExtractionEval` — the extractor-parameterized runner (pure)

**Files:**
- Test: `apps/web/tests/unit/extractionEval.test.ts` (append a `describe` block)
- Modify: `apps/web/tests/helpers/extractionEval.ts` (append types + the runner)

The genuinely-new logic. Pure: no I/O, no AI, no DB — the only impurity is whatever the caller's `extractor`/`truthFor` bring. Mirrors the inline `scoreCorpus` in `extractionAccuracy.integration.test.ts` but parameterizes the extractor so the *same* runner scores baseline vs. structured-output and the aggregates diff.

- [ ] **Step 1: Write the failing tests**

Append to `apps/web/tests/unit/extractionEval.test.ts`. Add `aggregate`, `runExtractionEval`, and `type ExtractionFn`, `type EvalCorpusDoc`, `type GroundTruth` to the existing import from `'../helpers/extractionEval'`.

```typescript
describe('runExtractionEval — extractor-parameterized corpus scoring', () => {
  const corpus: EvalCorpusDoc[] = [
    { label: 'doc_a', expectedType: 'vendor_invoice', lines: ['Total: $100.00', 'Invoice # INV-1'] },
    { label: 'doc_b', expectedType: 'receipt', lines: ['Total: $50.00'] },
  ];
  const truth: Record<string, GroundTruth> = {
    doc_a: { amount: 100, vendor_invoice_number: 'INV-1' },
    doc_b: { total: 50 },
  };
  const truthFor = (label: string): GroundTruth => truth[label] ?? {};
  const perfect: ExtractionFn = (_ocr, type) =>
    type === 'vendor_invoice'
      ? { amount: 100, vendor_invoice_number: 'INV-1' }
      : { total: 50 };

  it('groups per-doc scores by document type', () => {
    const byType = runExtractionEval(perfect, corpus, truthFor);
    expect(byType.vendor_invoice).toHaveLength(1);
    expect(byType.receipt).toHaveLength(1);
    expect(byType.payment_confirmation).toHaveLength(0);
  });

  it('different extractors → different aggregates (the before/after delta premise)', () => {
    const blind: ExtractionFn = () => ({});
    const good = aggregate(runExtractionEval(perfect, corpus, truthFor).vendor_invoice);
    const bad = aggregate(runExtractionEval(blind, corpus, truthFor).vendor_invoice);
    expect(good.correct).toBe(2); // amount + vendor_invoice_number recovered
    expect(bad.correct).toBe(0); // blind extractor recovers nothing
  });

  it('an unlabeled doc contributes 0 truly-present; a spurious populate hurts correctness', () => {
    const spurious: ExtractionFn = () => ({ amount: 999 });
    const byType = runExtractionEval(
      spurious,
      [{ label: 'unlabeled', expectedType: 'vendor_invoice', lines: ['x'] }],
      () => ({}),
    );
    const t = aggregate(byType.vendor_invoice);
    expect(t.trulyPresent).toBe(0);
    expect(t.populated).toBe(1);
    expect(t.correct).toBe(0);
  });

  it('deterministic: identical inputs → identical tallies', () => {
    const a = aggregate(runExtractionEval(perfect, corpus, truthFor).vendor_invoice);
    const b = aggregate(runExtractionEval(perfect, corpus, truthFor).vendor_invoice);
    expect(a).toEqual(b);
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `pnpm --filter @chounting/web test extractionEval`
Expected: FAIL — `runExtractionEval`, `ExtractionFn`, `EvalCorpusDoc` are not exported.

- [ ] **Step 3: Implement the runner**

Append to `apps/web/tests/helpers/extractionEval.ts` (after `ocrTextFromLines`):

```typescript
/** A document-type-aware extractor: OCR text + type → a flat field record. */
export type ExtractionFn = (
  ocrText: string,
  type: DocumentType,
) => Record<string, unknown>;

/**
 * One corpus doc the runner scores — a structural subset of `RealOcrFixture`,
 * kept here so the helper stays decoupled from the test fixture's full shape.
 */
export interface EvalCorpusDoc {
  label: string;
  expectedType: DocumentType;
  lines: string[];
}

/**
 * Run an extractor over a corpus, scoring each doc against its ground truth on
 * the type's SCORED_FIELDS, grouped per document type. Pure (no AI/DB of its
 * own; ocrTextFromLines routes through the real production extractOcrText).
 * Extractor-parameterized so the SAME runner scores a baseline vs. a new
 * structured-output extractor over the same frozen corpus + SCORED_FIELDS —
 * diff the per-type aggregates for the #2 before/after delta. Processes EVERY
 * doc (truthFor returns {} for an unlabeled doc → trulyPresent 0; a populate of
 * it is spurious), exactly preserving the prior inline scoreCorpus behavior.
 */
export function runExtractionEval(
  extractor: ExtractionFn,
  corpus: EvalCorpusDoc[],
  truthFor: (label: string) => GroundTruth,
): Record<DocumentType, DocScore[]> {
  const byType: Record<DocumentType, DocScore[]> = {
    vendor_invoice: [],
    receipt: [],
    payment_confirmation: [],
  };
  for (const doc of corpus) {
    const ocrText = ocrTextFromLines(doc.lines);
    const extracted = extractor(ocrText, doc.expectedType);
    const truth = truthFor(doc.label);
    byType[doc.expectedType].push(
      scoreExtraction(extracted, truth, SCORED_FIELDS[doc.expectedType]),
    );
  }
  return byType;
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `pnpm --filter @chounting/web test extractionEval`
Expected: PASS — all four new tests green, the existing `extractionEval.test.ts` tests still green.

- [ ] **Step 5: Commit**

```bash
git add apps/web/tests/helpers/extractionEval.ts apps/web/tests/unit/extractionEval.test.ts
git commit -m "feat(eval): extractor-parameterized runExtractionEval over the real-OCR corpus"
```

---

## Task 3: Refactor the baseline harness to consume `runExtractionEval`

**Files:**
- Modify: `apps/web/tests/integration/extractionAccuracy.integration.test.ts`

Behavior-preserving. The `regression ratchet` test (`tally.toEqual(BASELINE_TALLY[t])`) **is** the proof: if the refactor changed any number, CI fails. `BASELINE_TALLY` is untouched.

- [ ] **Step 1: Confirm the harness is green before the change (capture the baseline)**

Run: `pnpm --filter @chounting/web test extractionAccuracy`
Expected: PASS (the regression ratchet matches the frozen `BASELINE_TALLY`). This is the before-state the refactor must preserve.

- [ ] **Step 2: Swap the import block**

Replace the helper import (currently `extractionAccuracy.integration.test.ts:55-65`) — drop `scoreExtraction` and `ocrTextFromLines` (now owned by the runner), add `runExtractionEval` + `ExtractionFn`:

```typescript
import {
  SCORED_FIELDS,
  aggregate,
  coverage,
  correctness,
  runExtractionEval,
  type ExtractionFn,
  type DocumentType,
  type DocScore,
  type AggregateTally,
} from '../helpers/extractionEval';
```

- [ ] **Step 3: Replace `tierAFor` + `scoreCorpus` with the wrapper + a delegating `scoreCorpus`**

Replace the whole `tierAFor` function and `scoreCorpus` function (currently `:73-102`) with:

```typescript
const tierAExtractor: ExtractionFn = (ocrText, type) => {
  switch (type) {
    case 'vendor_invoice':
      return extractVendorInvoiceFieldsTierA(ocrText) as Record<string, unknown>;
    case 'receipt':
      return extractReceiptFieldsTierA(ocrText) as Record<string, unknown>;
    case 'payment_confirmation':
      return extractPaymentConfirmationFieldsTierA(ocrText) as Record<
        string,
        unknown
      >;
  }
};

// Score the whole corpus once; group doc scores by type. Delegates to the pure
// runExtractionEval — the baseline is now scored by the same parameterized
// runner a future structured-output extractor will use (diff the aggregates).
function scoreCorpus(): Record<DocumentType, DocScore[]> {
  return runExtractionEval(
    tierAExtractor,
    REAL_OCR_CORPUS,
    (label) => EXTRACTION_GROUND_TRUTH[label] ?? {},
  );
}
```

Leave the `TYPES` array, every `describe`/`it` block, and the `BASELINE_TALLY` ratchet unchanged. (`REAL_OCR_CORPUS: RealOcrFixture[]` *should* be assignable to `EvalCorpusDoc[]` — same required fields, identical `expectedType` union — so no cast is expected. **Do not treat "no cast" as load-bearing** (advisor tightening): the Step 5 typecheck is the proof. If `tsc` complains, the trivial fix is `REAL_OCR_CORPUS satisfies EvalCorpusDoc[]` or an `as EvalCorpusDoc[]` cast at the call site — neither changes behavior.)

- [ ] **Step 4: Run the harness to verify identical behavior**

Run: `pnpm --filter @chounting/web test extractionAccuracy`
Expected: PASS — every test green, the regression ratchet still matches `BASELINE_TALLY` exactly (vendor 16/10/10/3, receipt 18/8/8/6, payment 14/8/8/7). Identical tallies = behavior preserved.

- [ ] **Step 5: Typecheck (catches any now-unused import)**

Run: `pnpm typecheck`
Expected: PASS — no `scoreExtraction`/`ocrTextFromLines` unused-import error in this file.

- [ ] **Step 6: Commit**

```bash
git add apps/web/tests/integration/extractionAccuracy.integration.test.ts
git commit -m "refactor(eval): baseline harness consumes runExtractionEval (BASELINE_TALLY unchanged)"
```

---

## Task 4: `amazon_invoice` contract-stating annotation

**Files:**
- Modify: `apps/web/tests/fixtures/extraction/extractionGolden.ts` (above the `amazon_invoice:` entry, currently `:45`)

Comment-only — no scoring change, `BASELINE_TALLY` untouched. Wording **must match** Task 1 §4/§7. The annotation cites the *sanitized* corpus invoice numbers and cross-references the prod row `3433cfe3`'s real numbers, so a reader cross-referencing `3433cfe3` across the golden file and §4/CURRENT_STATE does not read the differing invoice numbers as a contradiction (advisor tightening).

- [ ] **Step 1: Read the block, then insert the annotation**

Read `apps/web/tests/fixtures/extraction/extractionGolden.ts:45-51`. Insert immediately above the `amazon_invoice: {` line:

```typescript
  // amazon_invoice — BOARD-#4 (multi-invoice) RECONCILIATION. This doc's OCR
  // concatenates THREE sub-invoices: CA10ABCD2E30 $14.55 · CA20EFGH4J50 $11.19
  // · CA30KLMN6P70 $15.65 (these are the SANITIZED corpus invoice numbers; the
  // prod row source_document 3433cfe3 carries the real CA56SWET7X6I /
  // CA542WJGEUEI / CA5KJ23M1ZFI per the CURRENT_STATE 176ac24c forensic — same
  // doc, same amounts, only the sanitized refs differ by rule). Tier-A baseline:
  // RETAINED, scored first-sub-invoice — a legitimate Tier-A datapoint (what the
  // deterministic extractor yields on concatenated OCR) and part of
  // BASELINE_TALLY's vendor_invoice trulyPresent. Tier-C #2/#4 multi-invoice
  // model: DEFERRED to board-#4 (single-object GroundTruth cannot represent N=3;
  // the multi-invoice GT shape + prod-fetch/PII sign-off ship with #4, on Phil's
  // architecture call). Do NOT remove this entry to "defer amazon" — that drops
  // vendor_invoice trulyPresent 16→13 and fails the frozen ratchet. Re-label +
  // re-freeze BASELINE_TALLY only when board-#4 opens.
```

- [ ] **Step 2: Verify the harness is still green (comment-only ⇒ no tally move)**

Run: `pnpm --filter @chounting/web test extractionAccuracy`
Expected: PASS — `BASELINE_TALLY` unchanged.

- [ ] **Step 3: Commit**

```bash
git add apps/web/tests/fixtures/extraction/extractionGolden.ts
git commit -m "docs(eval): contract-stating amazon_invoice annotation (Tier-A retained / Tier-C #4 deferred)"
```

---

## Task 5: board-#3 classify-unknown — pure logic + unit tests

**Files:**
- Test: `apps/web/tests/unit/classifyUnknownRepro.test.ts` (create)
- Create: `apps/web/tests/helpers/classifyUnknownRepro.ts`

The CI-runnable, always-exercised core of the repro-runner. The "discriminating query" (`select exception_reason, count(*) … group by 1`) tally and the repro-or-drop verdict, as pure functions. No DB, no AI.

- [ ] **Step 1: Write the failing tests**

Create `apps/web/tests/unit/classifyUnknownRepro.test.ts`:

```typescript
// tests/unit/classifyUnknownRepro.test.ts
//
// Board-#3 — pure repro-runner logic. No DB, no AI: the discriminating tally +
// the repro-or-drop verdict, pinned independently of the live runner.

import { describe, it, expect } from 'vitest';
import {
  tallyByReason,
  selectUnknownRows,
  reproVerdict,
} from '../helpers/classifyUnknownRepro';

describe('tallyByReason — the discriminating query, in-memory', () => {
  it('counts rows per exception_reason', () => {
    expect(
      tallyByReason([
        { exception_reason: 'unmatched_router_candidate' },
        { exception_reason: 'unmatched_router_candidate' },
        { exception_reason: 'unknown_document_type' },
      ]),
    ).toEqual({ unmatched_router_candidate: 2, unknown_document_type: 1 });
  });
  it('empty input → empty tally', () => {
    expect(tallyByReason([])).toEqual({});
  });
});

describe('selectUnknownRows', () => {
  it('keeps only unknown_document_type rows', () => {
    const rows = [
      { exception_reason: 'unknown_document_type', document_case_id: 'a' },
      { exception_reason: 'unmatched_router_candidate', document_case_id: 'b' },
    ];
    expect(selectUnknownRows(rows)).toEqual([rows[0]]);
  });
  it('grounded-today prod state: 4 unmatched_router_candidate → empty repro set', () => {
    const rows = Array.from({ length: 4 }, () => ({
      exception_reason: 'unmatched_router_candidate',
    }));
    expect(selectUnknownRows(rows)).toHaveLength(0);
  });
});

describe('reproVerdict — repro-or-drop', () => {
  it('still unknown → repro (genuine unknown on a legible doc)', () => {
    expect(reproVerdict('unknown')).toBe('repro');
  });
  it('now a real type → drop (the unknown did not reproduce)', () => {
    expect(reproVerdict('vendor_invoice')).toBe('drop');
    expect(reproVerdict('receipt')).toBe('drop');
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `pnpm --filter @chounting/web test classifyUnknownRepro`
Expected: FAIL — `../helpers/classifyUnknownRepro` does not exist.

- [ ] **Step 3: Implement the pure logic**

Create `apps/web/tests/helpers/classifyUnknownRepro.ts`:

```typescript
// tests/helpers/classifyUnknownRepro.ts
//
// Pure logic for the board-#3 classify-unknown repro-runner. No I/O, no AI, no
// DB. The live runner (classifyUnknownRepro.integration.test.ts) wires these to
// the real adminClient + classifyDocumentType; these functions are the
// deterministic, unit-tested core.

/** The discriminating query (`group by exception_reason`), in-memory. */
export function tallyByReason(
  rows: { exception_reason: string }[],
): Record<string, number> {
  const tally: Record<string, number> = {};
  for (const r of rows) {
    tally[r.exception_reason] = (tally[r.exception_reason] ?? 0) + 1;
  }
  return tally;
}

/** The board-#3 target subset: rows queued as unknown_document_type. */
export function selectUnknownRows<T extends { exception_reason: string }>(
  rows: T[],
): T[] {
  return rows.filter((r) => r.exception_reason === 'unknown_document_type');
}

export type ReproVerdict = 'repro' | 'drop';

/**
 * Repro-or-drop. Re-running the classifier on a legible doc that was queued as
 * unknown_document_type either still emits `unknown` (the unknown REPRODUCES —
 * a genuine unknown doc, keep/investigate) or now classifies to a real type
 * (the unknown did NOT reproduce — transient/since-fixed → DROP the case).
 */
export function reproVerdict(reclassifiedType: string): ReproVerdict {
  return reclassifiedType === 'unknown' ? 'repro' : 'drop';
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `pnpm --filter @chounting/web test classifyUnknownRepro`
Expected: PASS — all unit tests green.

- [ ] **Step 5: Commit**

```bash
git add apps/web/tests/helpers/classifyUnknownRepro.ts apps/web/tests/unit/classifyUnknownRepro.test.ts
git commit -m "feat(repro): board-#3 classify-unknown pure logic (tally + repro-or-drop)"
```

---

## Task 6: board-#3 gated live runner

**Files:**
- Create: `apps/web/tests/integration/classifyUnknownRepro.integration.test.ts`

On-demand operator diagnostic — **not a CI assertion target**. Reads real `exception_queue_entries` (point `SUPABASE_TEST_URL` at the target DB) and, for any `unknown_document_type` rows, re-runs the **real** classifier (Tier C → paid Claude). Grounded 2026-06-14: prod has **0** `unknown_document_type` rows (all 4 are `unmatched_router_candidate`), so the repro loop is empty today; the teeth activate when such a row appears. Gated behind `RUN_CLASSIFY_UNKNOWN_REPRO=1` + `ANTHROPIC_API_KEY`.

Substrate (grounded): `classifyDocumentType(input, ctx)` from `@/agent/orchestrator/extraction/classifier` returns `{ result: ClassificationResult, trace_records }` where `ClassificationResult.documentType: 'vendor_invoice'|'receipt'|'payment_confirmation'|'unknown'`; Tier C fires real Claude when Tier A abstains. `SystemActorServiceContext = { trace_id, caller: { user_id: null, system_actor }, org_id }` (`serviceContext.ts:80`). `exception_queue_entries` carries `document_case_id`, `source_document_id` (nullable), `org_id`, `exception_reason`. OCR lives in `document_artifacts.lines`, FK `document_artifacts_source_document_id_fkey`. Reads go through `adminClient()` (`@/db/adminClient`) — which honours the `SUPABASE_TEST_URL → SUPABASE_URL` / `SUPABASE_TEST_SERVICE_ROLE_KEY → SUPABASE_SERVICE_ROLE_KEY` cascade, so **no hardcoded URL** (passes `pnpm test:no-hardcoded-urls`).

**Three impl-onset verify-from-disk checks** (project discipline; the live branch is unexercised against today's prod, so these are low-risk but must be confirmed against disk before relying on the branch):
1. The `SystemActorServiceContext` literal — copy the exact construction `classifierTierCoordination.integration.test.ts` uses for `classifyDocumentType` (it is the canonical precedent).
2. The `document_artifacts` projection (`.select('*')` is safe; narrow to the needed columns by reading `reviewPreviewReadService.ts:135`).
3. Whether a global vitest setup installs a mock-Claude fixture queue; if so, clear it as `agentRealClientSmoke.test.ts` does (`__setMockFixtureQueue(null)`) so Tier C hits the real client.

- [ ] **Step 1: Write the gated runner**

Create `apps/web/tests/integration/classifyUnknownRepro.integration.test.ts`:

```typescript
// tests/integration/classifyUnknownRepro.integration.test.ts
//
// Board-#3 classify-unknown repro-runner (LIVE, gated). On-demand operator
// diagnostic — NOT a CI assertion target. Reads real exception_queue_entries
// (point SUPABASE_TEST_URL at the target DB) and, for any unknown_document_type
// rows, re-runs the REAL classifier (Tier C → paid Claude) to decide repro-or-
// drop. Grounded 2026-06-14: prod has 0 unknown_document_type rows (all 4 are
// unmatched_router_candidate), so the repro set is empty today; the teeth
// activate when such a row appears. Gated: RUN_CLASSIFY_UNKNOWN_REPRO=1 +
// ANTHROPIC_API_KEY (real Claude is billed).

import { describe, it, expect } from 'vitest';
import { adminClient } from '@/db/adminClient';
import { classifyDocumentType } from '@/agent/orchestrator/extraction/classifier';
import type { DocumentArtifactRow } from '@/agent/orchestrator/extraction/types';
import {
  type SystemActorServiceContext,
} from '@/services/middleware/serviceContext';
import {
  tallyByReason,
  selectUnknownRows,
  reproVerdict,
} from '../helpers/classifyUnknownRepro';

const SHOULD_RUN =
  process.env.RUN_CLASSIFY_UNKNOWN_REPRO === '1' &&
  Boolean(process.env.ANTHROPIC_API_KEY);

interface ExceptionRow {
  document_case_id: string;
  source_document_id: string | null;
  org_id: string;
  exception_reason: string;
}

describe.skipIf(!SHOULD_RUN)(
  'board-#3 — classify-unknown repro-runner (LIVE, paid Claude)',
  () => {
    it('discriminating query: tallies exception_queue_entries by exception_reason', async () => {
      const db = adminClient();
      const { data, error } = await db
        .from('exception_queue_entries')
        .select('exception_reason');
      expect(error).toBeNull();
      const tally = tallyByReason((data ?? []) as { exception_reason: string }[]);
      // eslint-disable-next-line no-console
      console.log('exception_reason tally =', JSON.stringify(tally));
      expect(typeof tally).toBe('object');
    });

    it('repro-or-drop: re-classifies every unknown_document_type row', async () => {
      const db = adminClient();
      const { data, error } = await db
        .from('exception_queue_entries')
        .select('document_case_id, source_document_id, org_id, exception_reason');
      expect(error).toBeNull();
      const unknownRows = selectUnknownRows((data ?? []) as ExceptionRow[]);

      const verdicts: { source_document_id: string; verdict: string }[] = [];
      for (const row of unknownRows) {
        if (!row.source_document_id) continue; // no OCR to re-run on
        const { data: art } = await db
          .from('document_artifacts')
          .select('*')
          .eq('source_document_id', row.source_document_id)
          .single();
        const ctx: SystemActorServiceContext = {
          trace_id: `repro-${row.document_case_id}`,
          caller: { user_id: null, system_actor: 'classify_unknown_repro' },
          org_id: row.org_id,
        };
        const classification = await classifyDocumentType(
          {
            ocrArtifact: art as unknown as DocumentArtifactRow,
            source_document_id: row.source_document_id,
            trace_id: ctx.trace_id,
          },
          ctx,
        );
        verdicts.push({
          source_document_id: row.source_document_id,
          verdict: reproVerdict(classification.result.documentType),
        });
      }
      // eslint-disable-next-line no-console
      console.log('repro verdicts =', JSON.stringify(verdicts));
      // Today (0 unknown rows) the repro set is empty; the assertion is that the
      // loop processed every row that carried OCR.
      expect(verdicts.length).toBe(
        unknownRows.filter((r) => r.source_document_id).length,
      );
    });
  },
);
```

- [ ] **Step 2: Verify it is correctly SKIPPED in the default suite (no gate set)**

Run: `pnpm --filter @chounting/web test classifyUnknownRepro.integration`
Expected: the `describe` is skipped (gate unset) — 0 failures. The pure unit tests from Task 5 are unaffected.

- [ ] **Step 3: Typecheck**

Run: `pnpm typecheck`
Expected: PASS. (If it fails on the `SystemActorServiceContext` literal or `classification.result.documentType`, resolve via impl-onset check #1 — copy the exact ctx construction from `classifierTierCoordination.integration.test.ts`.)

- [ ] **Step 4 (optional, paid — operator): exercise the live runner**

Only when an operator wants the live read. Against a DB with seeded/real rows:

```bash
RUN_CLASSIFY_UNKNOWN_REPRO=1 \
ANTHROPIC_API_KEY=sk-... \
SUPABASE_TEST_URL=... SUPABASE_TEST_SERVICE_ROLE_KEY=... \
pnpm --filter @chounting/web test classifyUnknownRepro.integration
```
Expected against today's prod: the tally prints (e.g. `{"unmatched_router_candidate":4}`), the repro set is empty, both tests pass. (Confirm impl-onset check #3 first if Tier C unexpectedly returns a mocked result.)

- [ ] **Step 5: Commit**

```bash
git add apps/web/tests/integration/classifyUnknownRepro.integration.test.ts
git commit -m "feat(repro): board-#3 gated live classify-unknown runner (real Claude, on-demand)"
```

---

## Done gate

- [ ] `pnpm agent:validate` green (typecheck + no-hardcoded-URLs + Category A floor).
- [ ] `pnpm --filter @chounting/web test extractionEval` and `… test classifyUnknownRepro` green; `… test extractionAccuracy` green with `BASELINE_TALLY` unchanged.
- [ ] `pnpm test:full` green at HEAD (Condition 1 push-readiness evidence) — counts move by the new unit tests only (Task 2: +4, Task 5: +6); the gated integration suite stays skipped.
- [ ] Design doc §1/§2.1/§2.2/§2.3/§4/§7 reconciled to disk; CURRENT_STATE re-verify self-contained; `amazon_invoice` annotation wording matches §4/§7.
- [ ] Friction-journal entry if any impl-onset check (#1/#2/#3) surfaced a surprise; otherwise none owed (this plan is a faithful reuse of shipped substrate).

---

## Self-review

- **Spec coverage:** All five §7 buildable-now items are accounted for — items 1+5 built (Tasks 2/3, 5/6), items 3+4 already shipped (documented, not rebuilt), item 2 reframed away from a duplicate home (Task 1). The design-doc §1/§2.1/§2.2/§2.3 grounding gaps + the §4/§7 amazon reconciliation are closed in Task 1.
- **Type consistency:** `ExtractionFn`/`EvalCorpusDoc`/`GroundTruth`/`DocScore`/`AggregateTally` are defined in Task 2 and reused verbatim in Task 3. `runExtractionEval`'s signature is identical across Tasks 2 and 3. `classification.result.documentType` (camelCase, 4-value union incl. `unknown`) matches `ClassificationResult`; the 3-value `DocumentType` in `extractionEval.ts` is a distinct module symbol used only by the scorer — no cross-wiring. `reproVerdict` consumes the 4-value string and only branches on `'unknown'`, so the union mismatch is inert.
- **No placeholders:** every code step shows complete code; the three Task-6 impl-onset checks are explicit verify-from-disk steps (project discipline) confined to a branch empty against today's prod, not hand-waves.
