# Phase 8 Dedicated Fix Chunk Brief — Tier A classifier real-OCR recalibration (Sub-option E: restore high-precision + lean on Tier C)

- **Date:** 2026-05-23
- **Phase:** Phase 8 (dedicated fix chunk inserted post-chunk-5; gates chunk 6)
- **Chunk:** Tier A real-OCR recalibration fix chunk (Phase 8 11th-chunk insertion). Scoped at Session 68 from the chunk 1 Task 4 demo re-fire investigation; design ratified at Session 69 (Sub-option E hybrid).
- **Path C disposition:** **NO SPLIT** at brief-grade per F-J-14 Grain 1 prospective evaluation — coherent chunk (3 rule modules + tierCoordination precedence + tests + real-OCR fixture corpus).
- **Status:** brief-drafting (Session 70; this artifact) → impl (Session 71 Tasks 1-4 + 6) → impl-validation (Session 72 Tasks 5 + 7, gated on founder document drop) → close (Session 73).
- **Predecessors:** `project_phase_8_session_68_demo_refire_classifier_gap.md` (root cause + failing tokens) + `project_phase_8_session_69_dedicated_fix_chunk_brainstorming.md` (ratified design). HEAD = `7ee1e00` on staging; 50 commits ahead of origin/staging; `pnpm agent:validate` 26/26 green at Session 67 baseline (no tracked code changed since).

---

## §1 — Preamble

### §1.1 Brief context

The Phase 8 chunk 1 Task 4 demo re-fire (Session 68) ran the document pipeline against the real Modal sidecar on three real PDF fixtures and surfaced that **Tier A misclassifies 2 of 3 as `vendor_invoice`**. Root cause (confirmed against the persisted `document_artifacts.lines` OCR text): the Tier A `vendor_invoice` rule **over-matches** on field-label cross-references, while the `receipt`/`payment_confirmation` rules **under-match** real-world (Figma/Zoho) layouts. The rule modules carry the caveat *"Calibrated against mockSidecar synthetic OCR at v1; real-PaddleOCR calibration deferred"* — this chunk **is** that deferred real-OCR calibration.

This brief operationalizes the Session 69 ratified design (**Sub-option E**): *restore Tier A's designed high-precision, low-recall property and lean on the already-robust Tier C (Claude) fallback for the residual.* It is NOT a positive-pattern broadening to "catch all three" (that overfits N=3 and fights the architecture — see §1.3).

### §1.2 Root-cause evidence (grounding — the real captured OCR)

Per `prediction-grounding`, the pattern changes below are grounded against the actual OCR text captured from `document_artifacts.lines` at Session 68. The discriminating signals are **title/header tokens**, not field-label mentions:

- **vendor_invoice.pdf** (Figma invoice): `Invoice` (title) · `Invoice number` · `Date of issue` · `Bill to` · `CA$282.24 due` → genuinely an invoice.
- **receipt.pdf** (Figma receipt): `Receipt` (title) · `Invoice number 1SRPQ68M-0001` (cross-ref) · `Date paid` · `Bill to` · `CA$282.24 paid on November 18, 2025` → a receipt that *cites* its invoice number. The `\binvoice\b` in `vendorInvoiceRules` fires on "Invoice number"; the receipt's own positives need a card-method line / "thank you" (absent), and its `VENDOR_INVOICE_NEGATIVE_PATTERNS` *also* fires on the cited "Invoice number" — so receipt suppresses itself.
- **payment_confirmation.pdf** (Zoho voucher): `PAYMENTS MADE` (header) · `Payment#` · `Amount Paid` · `Payment Date` · `Payment Mode` · `Payment for` · `Bill Number` / `Bill Date` / `Bill Amount` (cross-ref) → a payment voucher. The `\bbill\b(?!\s*to)` fires on "Bill Number"; the payment positives want `payment received/processed/confirmation` / `transaction id` (none present).

### §1.3 Design principle — restore precision, arbitrate conflicts in coordination, lean on Tier C

Tier A is **high-precision, low-recall, binary short-circuit by design** (ADR-0014 §7); Tier C (Claude) is the designed catch-all. The bug is a precision regression. Four levers, in dependency order:

1. **(Task 1) Tighten `vendor_invoice` positives** so they fire on an invoice *header/title*, not field-label cross-references (`Invoice number`, `Bill Number`).
2. **(Tasks 2-3) Add modest high-precision positives** to `receipt`/`payment_confirmation` for the real header vocabularies — **low-recall on purpose** (don't try to catch every format).
3. **(Task 4) Resolve multi-match conflicts in `tierCoordination`** via document-kind-defining-header precedence (a `Receipt` title or `PAYMENTS MADE` header outranks an invoice cross-reference). This is the robust place to arbitrate, because per-rule negative patterns mutually interfere on cross-references (§1.2).
4. **Weak/ambiguous/no-clean-winner → no Tier A match → Tier C decides.** This is already the architecture; we rely on it deliberately.

**Overfit guard (load-bearing, per `regex-permissive-matching` + `prediction-grounding`):** the patterns are grounded in N=3 real fixtures. N=3 tuning overfits. Therefore: tune test-first against committed real-OCR fixtures (Task 6), and **validate against an expanded real-OCR corpus** (Task 5, founder-supplied). Tier A staying low-recall is acceptable — formats the rules don't recognize fall to Tier C, which is correct. The goal is (a) stop `vendor_invoice` false-positives and (b) catch high-confidence cases; everything else → Tier C. On any divergence between a pattern's predicted behavior and the corpus, **stop-surface-explain** — do not pre-tune.

### §1.4 Cross-references

- `apps/web/src/agent/orchestrator/extraction/classifier/{vendorInvoiceRules,receiptRules,paymentConfirmationRules,tierCoordination,aiFallback}.ts`
- `apps/web/tests/integration/classifier{VendorInvoiceRules,ReceiptRules,PaymentConfirmationRules,TierCoordination}.integration.test.ts` (centralized location per testing.md Candidate #8; flat `.integration.test.ts`)
- ADR-0014 §7 (Tier A high-precision-low-recall + per-type thresholds) + §8 (Tier C Zod + confidence gates) + §12.1/§12.3 (Tier C budget + audit). ADR-0007 §Q31 (deterministic orchestration; Claude classification only).
- Conventions: `regex-permissive-matching.md` (over-match cost class + shape-discriminator mitigation), `prediction-grounding.md` (audit-don't-tune; stop-surface-explain).
- `apps/web/scripts/phase-7-v1-close-demo.ts` (the demo runner; Task 7).

---

## §2 — Scope

### §2.1 What this chunk ships

- Precision-restored Tier A `vendor_invoice` rule (no longer fires on field-label cross-references).
- High-precision real-OCR positives for `receipt` + `payment_confirmation` (Figma/Zoho header vocabularies).
- A `tierCoordination` document-kind-defining-header precedence rule resolving multi-match conflicts; weak/ambiguous → no-match → Tier C.
- A committed **real-OCR fixture corpus** (`apps/web/tests/fixtures/classifier/real-ocr/`) — the captured OCR line-text of the 3 demo fixtures + founder-supplied additional docs.
- Extended integration tests (the 4 existing `classifier*.integration.test.ts` files) asserting correct classification for the real-OCR fixtures + the precedence behavior.
- A chunk 1 demo re-fire confirming 3-of-3 `committed` **with correct per-type classification** (the first real exercise of Tier C).

### §2.2 What this chunk does NOT ship

- No change to the Tier C `aiFallback.ts` implementation (it is already robust; this chunk only causes it to actually run for residual docs).
- No change to the pipeline orchestrator (`ingestDocument.ts`), Stages 0/1/2/4/5/6/7, or `document_cases` state persistence (out of scope; the case-state-not-advanced behavior is by-design per Session 68).
- No new architecture (Tier B insertion, Tier-C-first, etc. — Sub-option D was rejected as out-of-scope).
- No confidence-threshold changes (Sub-option C — orthogonal; Tier A is binary match/no-match).

### §3 — Substrate touchpoints

**§3.1 Files modified:** `vendorInvoiceRules.ts` (positives + negatives), `receiptRules.ts` (positives), `paymentConfirmationRules.ts` (positives), `tierCoordination.ts` (precedence), and the 4 `classifier*.integration.test.ts` files.

**§3.2 Files created:** `apps/web/tests/fixtures/classifier/real-ocr/*.ts` (captured OCR line-text fixtures: the 3 demo docs + founder additions).

**§3.3 Files NOT modified:** `aiFallback.ts`, `extractOcrText.ts`, `ingestDocument.ts`, all Stage modules, `types.ts`, schemas, migrations.

**§3.4 Service-layer scope:** NONE. Classifier-internal only; no service-layer mutation, no RLS/audit surface.

---

## §4 — Tasks

> TDD throughout: write/extend the failing test against the real-OCR fixture first, run it red, change the rule minimally, run it green, commit. Patterns below are **grounded starting points** from the captured OCR (§1.2); refine them test-first against the Task 5 fixtures and confirm no regression in the existing positive/negative/no-match cases (which encode the chunk 7.2 design intent).

### Task 1 — `vendorInvoiceRules.ts`: stop the over-match

**Files:** Modify `apps/web/src/agent/orchestrator/extraction/classifier/vendorInvoiceRules.ts`; Test `apps/web/tests/integration/classifierVendorInvoiceRules.integration.test.ts`.

- [ ] **Step 1 — failing tests** (extend the existing file, reusing its `artifactWithLines` helper). Add real-OCR-grounded cases:

```ts
describe('real-OCR negative cases (Session 68 calibration)', () => {
  it('does NOT match a receipt that cites an invoice number', () => {
    const artifact = artifactWithLines([
      'Receipt', 'Invoice number', '1SRPQ68M-0001', 'Date paid',
      'November 18, 2025', 'CA$282.24 paid on November 18, 2025',
    ]);
    expect(evaluateVendorInvoice(artifact).matched).toBe(false);
  });

  it('does NOT match a payment voucher that lists a bill number', () => {
    const artifact = artifactWithLines([
      'PAYMENTS MADE', 'Payment#', '517', 'Amount Paid', 'Payment Date',
      'Payment Mode', 'Cash', 'Payment for', 'Bill Number', 'Bill Date',
      'Bill Amount', '1SRPQ68M0001',
    ]);
    expect(evaluateVendorInvoice(artifact).matched).toBe(false);
  });

  it('STILL matches a genuine invoice with an "Invoice" title line', () => {
    const artifact = artifactWithLines([
      'Invoice', 'Invoice number', '1SRPQ68M-0001', 'Date of issue',
      'Bill to', 'CA$282.24 due November 18, 2025',
    ]);
    expect(evaluateVendorInvoice(artifact).matched).toBe(true);
  });
});
```

- [ ] **Step 2 — run red:** `pnpm test classifierVendorInvoiceRules` → first two FAIL (currently match), third PASS.
- [ ] **Step 3 — tighten positives** so field-label mentions don't fire. Replace the two over-broad header patterns:

```ts
const VENDOR_INVOICE_HEADER_PATTERNS = [
  // "invoice" as a header/title, NOT a field label ("invoice number/no/#/date/amount/total").
  /\binvoice\b(?!\s*(number|no\b|#|date|amount|total|to\b))/i,
  // "bill" excluding "bill to" AND field labels ("bill number/date/amount/#").
  /\bbill\b(?!\s*(to|number|date|amount|#|no\b))/i,
  /\bstatement\b/i,
  /\btax\s+invoice\b/i,
];
```

- [ ] **Step 4 — add document-kind-defining negatives** (belt-and-suspenders; grounded in §1.2). Extend the negative arrays:

```ts
// Receipt/payment "document-kind-defining" headers suppress vendor_invoice
// even if an invoice/bill term appears (it is a cross-reference).
const RECEIPT_FOOTER_NEGATIVE_PATTERNS = [
  /thank\s+you\s+for\s+your\s+(purchase|patronage|business)/i,
  /merchant\s+(id|copy|number)/i,
  /\bauth(\s+code|orization|\.?)\b/i,
  /\bapproval\s+code\b/i,
  /^\s*receipt\b/im,           // "Receipt" title line
  /\bdate\s+paid\b/i,
  /\bpaid\s+on\b/i,
];
const PAYMENT_CONFIRMATION_NEGATIVE_PATTERNS = [
  /payment\s+(received|completed|processed)/i,
  /thank\s+you\s+for\s+your\s+payment/i,
  /\bpayments?\s+made\b/i,      // "PAYMENTS MADE" header
  /\bpayment\s+(date|mode)\b/i,
  /\bamount\s+paid\b/i,
];
```

- [ ] **Step 5 — run green:** `pnpm test classifierVendorInvoiceRules` → all pass (including the pre-existing positive/no-match cases — confirm no regression). **Commit.**

### Task 2 — `receiptRules.ts`: recognize real receipts (high-precision)

**Files:** Modify `receiptRules.ts`; Test `classifierReceiptRules.integration.test.ts`.

- [ ] **Step 1 — failing test:** the Figma receipt (`['Receipt','Invoice number','1SRPQ68M-0001','Date paid','CA$282.24 paid on November 18, 2025']`) must `evaluateReceipt(...).matched === true`. Run red (currently false: no card-method line, and its `VENDOR_INVOICE_NEGATIVE_PATTERNS` fires on the cited "Invoice number").
- [ ] **Step 2 — add a high-precision receipt-header signal** + make a `Receipt` title authoritative over an invoice cross-reference. Add a positive category and adjust the match + negative logic:

```ts
// A "Receipt" title line + a payment-completion-on-receipt signal is a
// high-precision receipt signature (real online receipts cite the invoice
// number; that cross-ref must NOT suppress the receipt).
const RECEIPT_HEADER_PATTERNS = [/^\s*receipt\b/im];
const RECEIPT_PAID_SIGNALS = [/\bdate\s+paid\b/i, /\bpaid\s+on\b/i, /\bpayment\s+date\b/i];
```

Match rule (in `evaluateReceipt`): `const receiptHeader = anyMatch(text, RECEIPT_HEADER_PATTERNS) && anyMatch(text, RECEIPT_PAID_SIGNALS);` — if `receiptHeader`, classify `receipt` and **skip** the `VENDOR_INVOICE_NEGATIVE_PATTERNS` suppression (the "Invoice number" cross-ref is expected on a receipt). Otherwise fall back to the existing (total + payment-method) logic + existing negatives.

- [ ] **Step 3 — run green** + confirm existing receipt tests still pass (no regression). **Commit.**

### Task 3 — `paymentConfirmationRules.ts`: recognize real payment vouchers (high-precision)

**Files:** Modify `paymentConfirmationRules.ts`; Test `classifierPaymentConfirmationRules.integration.test.ts`.

- [ ] **Step 1 — failing test:** the Zoho voucher (`['PAYMENTS MADE','Payment#','Amount Paid','Payment Date','Payment Mode','Cash','Payment for','Bill Number']`) must `evaluatePaymentConfirmation(...).matched === true`. Run red (current positives want "payment received/processed/confirmation").
- [ ] **Step 2 — add high-precision voucher-header positives** (grounded in §1.2):

```ts
const PAYMENT_CONFIRMATION_POSITIVE_PATTERNS = [
  /\bpayment\s+(received|completed|processed|successful)/i,
  /\bthank\s+you\s+for\s+your\s+payment\b/i,
  /\byour\s+payment\s+(has\s+been\s+)?(processed|received|completed)/i,
  /\bpayment\s+confirmation\b/i,
  /\bconfirmation\s+(number|of\s+payment)/i,
  /\btransaction\s+(id|reference|number)/i,
  /\bpayments?\s+made\b/i,              // Zoho "PAYMENTS MADE" header
  /\bamount\s+paid\b/i,
  /\bpayment\s+(date|mode|voucher)\b/i,
];
```

Ensure the existing `RECEIPT_NEGATIVE_PATTERNS` (line-item/total layout) does not spuriously suppress — the voucher has no subtotal/tax/total line-item block, so it won't fire.

- [ ] **Step 3 — run green** + confirm existing payment-confirmation tests still pass. **Commit.**

### Task 4 — `tierCoordination.ts`: document-kind-defining precedence

**Files:** Modify `tierCoordination.ts`; Test `classifierTierCoordination.integration.test.ts`.

After Tasks 1-3, the three real fixtures should each match exactly one type. Task 4 makes that robust against future multi-match conflicts and is the clean conflict arbiter.

- [ ] **Step 1 — failing test:** an artifact with BOTH a `Receipt` title and an `Invoice number` cross-ref must classify `receipt` (not `vendor_invoice`); a voucher with `PAYMENTS MADE` + `Bill Number` must classify `payment_confirmation`. Run red if precedence not yet present.
- [ ] **Step 2 — add precedence in `pickHighestConfidenceMatch` / `coordinateTiers`:** when multiple Tier A rules match, a `receipt` or `payment_confirmation` match outranks a `vendor_invoice` match (a kind-defining header beats an invoice cross-reference). Keep highest-confidence-first within a kind.

  **Partial-information value pick (impl-onset, §4.PI-1):** (a) symmetric mutual-precedence table across all three kinds vs (b) asymmetric "receipt/payment outrank vendor_invoice" only. Lean **(b)** — it is the minimal change matching Sub-option E's "primary = stop vendor_invoice over-match"; adopt (a) only if it reads cleaner after Tasks 1-3.

- [ ] **Step 3 — confirm fall-through:** add/confirm a test that a doc with weak/conflicting signals returns no Tier A match and routes to Tier C (existing Tier-C-fallback test path). **Commit.**

### Task 5 — Real-OCR fixture corpus (gated on founder document drop)

**Files:** Create `apps/web/tests/fixtures/classifier/real-ocr/`.

- [ ] **Step 1 — capture the 3 demo fixtures' OCR text** as committed fixtures. Mechanism (**§4.PI-2 value pick**): (a) read from the runOCR stage output during a pipeline run; (b) read the persisted `document_artifacts.lines` after a Modal run (preferred — already populated for the 3 demo docs from Session 68); (c) standalone PaddleOCR invocation. Lean **(b)**: `SELECT lines FROM document_artifacts WHERE source_document_id = ...` for the 3 demo docs, serialize the line-text array into a `.ts` fixture (`export const FIGMA_INVOICE_OCR_LINES = [...]` etc.).
- [ ] **Step 2 — founder document drop (GATING):** founder supplies ~2-3 additional real docs per type from **different** vendors/formats (per Session 69 open-decision-1 self-dogfooding ratification). Surface a specific "drop these N files into `apps/web/tests/fixtures/classifier/real-ocr/source-pdfs/`" ask at this step. Run them through the pipeline (or standalone OCR), capture line-text into fixtures.
- [ ] **Step 3 — commit** the captured fixtures.

### Task 6 — Test extensions against the real-OCR corpus

**Files:** the 4 `classifier*.integration.test.ts` files + a new `classifierRealOcr.integration.test.ts`.

- [ ] **Step 1 — corpus test:** for every fixture in `real-ocr/`, assert `classifyDocumentType` (or the per-rule evaluators) returns the expected type. The 3 demo fixtures must classify correctly via Tier A; founder-added docs assert correct **final** type (Tier A OR Tier C — a Tier-A no-match that Tier C resolves correctly is a pass).
- [ ] **Step 2 — run green** across the full classifier suite. **Commit.**

### Task 7 — Chunk 1 demo re-fire (first real Tier C exercise; gating evidence)

**Files:** none (run `apps/web/scripts/phase-7-v1-close-demo.ts` from `apps/web`).

- [ ] **Step 1 — re-run** the demo (from `apps/web` so the `@/` alias resolves; real Modal sidecar). Per Session 68: the script hardcodes the **Phase 7** output path — after the run, **copy** results to the Phase 8 path and **`git checkout`-restore** the Phase 7 artifact.
- [ ] **Step 2 — verify 3-of-3 `committed` WITH correct per-type classification:** vendor_invoice → `vendor_invoice`; receipt → `receipt`; payment_confirmation → `payment_confirmation` (distinct `classify_document_type` output hashes; correct routing). This is the first time Tier C runs on real OCR — confirm it behaves.
- [ ] **Step 3 — commit** the Phase 8 demo-results JSON as the gate-1 evidence artifact (supersedes the untracked Session 68 pre-fix JSON).

### Task 8 — Close gate

- [ ] `pnpm typecheck` green.
- [ ] `pnpm test` full suite green (existing 1359 + new classifier cases; pre-existing `storageProviderIntegration` `StorageApiError` is the only acceptable failure).
- [ ] `pnpm agent:validate` 26/26 green; no-hardcoded-URLs grep green.
- [ ] Chunk 1 Task 4 demo re-fire 3-of-3 `committed` with correct per-type classification → **chunk 6 substrate-readiness gate 1 SATISFIED**.
- [ ] Single-commit close (or per-task commits per TDD); no push (banks on staging per CLAUDE.md Candidate #13).

---

## §5 — Partial-information value picks (impl-onset adjudication)

- **§4.PI-1** (Task 4 precedence): (a) symmetric vs (b) asymmetric vendor-invoice-only suppression. Lean (b).
- **§4.PI-2** (Task 5 capture mechanism): (a) runOCR-output / (b) persisted `document_artifacts.lines` / (c) standalone PaddleOCR. Lean (b).
- **Regex final form:** the §4 patterns are grounded starting points; final forms are tuned test-first against the Task 5 fixtures. Per `prediction-grounding`, on any divergence between predicted and corpus behavior, stop-surface-explain.

## §6 — Carry-forward / banking

- **Overfit risk (load-bearing):** N=3 grounding; Task 5 corpus + Task 7 demo are the guard. Tier A intentionally stays low-recall; residual → Tier C.
- **F-J-14 Grain 1:** NO-SPLIT (coherent fix chunk).
- **Tier C first real exercise:** Task 7 is the first real-OCR run of `aiFallback.ts`; bank its observed behavior.
- **Validation-corpus dependency:** Task 5 Step 2 gates on a founder document drop (Session 72 timing); Tasks 1-4 + 6 (the 3-fixture-grounded work) do not.
- **Recurring pnpm workspace-bump:** re-revert at each session if present; deferred dependency-hygiene pass (Phase 8 retro).
