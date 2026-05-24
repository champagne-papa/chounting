# Modal-e2e fixture-coverage closeout — design spec

**Date:** 2026-05-24
**Ground-truth HEAD:** `5eade62f` (`docs(phase-8): retrospective follow-ups closeout — §13 fix done, Modal-e2e partial, Tier C not-fired`)
**Status:** design approved; ready for `writing-plans`
**Carry-forward provenance:** named follow-up from the auto-commit-arc follow-ups closeout (`5eade62f`). Prior session brief: `docs/09_briefs/phase-8/2026-05-24-modal-e2e-followup.md`.
**Outcome doc (written at end of impl, distinct from this spec):** `docs/09_briefs/phase-8/2026-05-24-needs-fixture-closeout.md`.

---

## 1. Summary

Two `it.skip` scenarios remain in
`apps/web/tests/integration/e2e/documentPipeline.paymentConfirmation.e2e.test.ts`
marked `[NEEDS FIXTURE]` (lines 112–113). This session sources synthetic
fixtures, captures their OCR, and lands the coverage — but **asymmetrically**,
because disk-grounding reshaped the two scenarios into two different problems:

- **Scenario 1 (no-cited-bill payment):** genuinely fixture-blocked. Build the
  fixture, unskip, run a **paid** Modal-e2e. Expected outcome verified sound
  against disk (§4).
- **Scenario 2 (born-paid bundle):** **not** fixture-blocked — the underlying
  feature is non-functional at v1 (§3, Correction 2). Build the fixture +
  scenario body as durable infra, but reframe `[NEEDS FIXTURE]` →
  `[NEEDS-FIX]`, leave it `it.skip`, and **do not** spend paid Modal $ on its
  e2e (the failure is statically proven).

The session also extends the capture script with a cost-discipline label
filter, documents the born-paid non-functionality as a friction-journal entry,
and amends the Phase 8 retrospective.

---

## 2. Decision record

**Born-paid posture: build + defer, no paid run.** Of the four options
considered (run-paid-as-briefed / build-and-defer / fix-now / drop-entirely),
the chosen posture builds Fixture 2 + scenario body + corpus entry as durable
infrastructure (reusable verbatim once the bug is fixed), captures its OCR for
the cheap corpus regression test, but does **not** run its e2e paid — the
born-paid commit failure is deterministic and statically proven, so a paid run
carries no information. This respects the standing "do not fix-forward" posture
while still banking the expensive fixture-sourcing work.

**Resolved sub-decisions:**
- **PDF generation:** zero-dependency PDF writer (Node built-ins only). Bonus:
  deterministic byte-for-byte output (no metadata timestamps), matching the
  gitignore-and-regenerate posture from Correction 3.
- **Capture-script corpus merge:** fragment-file approach — when `LABELS` is
  set, write captured entries to `corpus.partial.ts` and merge into the main
  `corpus.ts` manually, rather than parsing the auto-generated TS in-script.

---

## 3. Grounding — four corrections (verified against disk at `5eade62f`)

The original session brief predated these. All four were ground-truthed against
disk during brainstorming; **re-verify each against disk at impl onset** (file
shapes may drift) and STOP-surface to the founder if any no longer holds.

### Correction 1 — born-paid branches are structurally dead at v1 (VERIFIED)

`isBornPaidBundleCandidate` (`proposalBuilder.ts:84-113`) has two branches:

- **Branch A:** `(documentType === 'receipt' || documentType === 'payment_confirmation') && hasCitedBill && hasPaymentFields`
- **Branch B:** `documentType === 'vendor_invoice' && hasInvoiceFields && hasPaymentFields`

where `hasCitedBill` = `cited_bill_id || cited_invoice_number`,
`hasPaymentFields` = `payment_reference || payment_method`,
`hasInvoiceFields` = `vendor_invoice_number && amount`.

- `ReceiptExtractionSchema` has **no** `cited_invoice_number` / `cited_bill_id`
  → receipt sub-clause of Branch A structurally unreachable.
- `VendorInvoiceExtractionSchema` has **no** `payment_reference` /
  `payment_method` → Branch B structurally unreachable.
- `PaymentConfirmationExtractionSchema` has all the right fields. Tier A
  (`paymentConfirmationExtractor.ts`) does **not** populate
  `cited_invoice_number` (its regexes cover only `payment_amount` /
  `payment_date` / `payment_reference` / `payment_method` / `currency`); the
  Tier C prompt explicitly asks for `cited_invoice_number`.

So the only reachable born-paid path is: `payment_confirmation` classification +
**Tier C** extraction populating `cited_invoice_number` + a payment field.

### Correction 2 — born-paid bundle commit is statically broken (VERIFIED + ESCALATED)

Brainstorm-side raised this as "suspected"; shell-side confirmed it as a
deterministic bug:

- `buildBornPaidBundle` (`proposalBuilder.ts:136,152`) reads
  `extractedFields.amount` and checks `typeof … === 'string'`.
- `PaymentConfirmationExtractionSchema` emits `payment_amount` as `z.number()`
  — **not** `amount`, and **not** a string.
- The bundle's `post_bill` child therefore gets `amount: undefined` →
  `buildPostBillInputFromChildMutation` (`ingestDocument.ts:730`) returns
  `null` → bill commit skipped → `proposal_id=null`. Same mismatch on the
  `record_bill_payment` child.

**The born-paid scenario cannot pass at v1 regardless of fixture quality or
Tier C luck.** Combined with Correction 1, all three born-paid branches are
non-functional: receipt + vendor_invoice are structurally dead (schema gaps);
payment_confirmation reaches `buildBornPaidBundle` but the builder is itself
broken on the field-name + type mismatch. **The born-paid feature ships zero
working paths today.** This is a Phase 8 retrospective amendment, not only a
friction-journal entry (§ Step 7).

### Correction 3 — demo PDFs are NOT tracked; no committed pattern (REFRAMED)

`git ls-files apps/web/tests/fixtures/document-pipeline-demo/` is **empty**;
`git status` reports the directory `??`; the 3 demo PDFs were never committed.
The directory is not gitignored, but there is **no established pattern to
match**. It also contains `*.pdf:Zone.Identifier` NTFS-ADS stubs (Windows
download artifacts) that must never be committed.

**Decision:** gitignore the directory (allowlist-only, like `source-pdfs/`).
The synthetic PDFs are deterministic from the generator script, so they need
not be in git — `corpus.sanitized.ts` is the canonical committed input the
tests consume. If the founder later wants the PDFs committed for
hand-inspection, that is a defensible alternative — surface in the commit
message; ask before committing if uncertain.

### Correction 4 — Scenario 2's disposition shifted (DERIVED from 1+2)

The born-paid scenario's blocker is no longer "no fixture exists" — it is "the
feature has no working code path at v1." This session reframes that scenario
`[NEEDS FIXTURE]` → `[NEEDS-FIX]`, builds its body as durable infra, and does
not spend paid Modal $ on its e2e.

---

## 4. Scenario 1 routing — verified sound (the paid scenario)

The one scenario we spend paid $ on had its expected assertion grounded against
disk:

- **Stage 6** (`completeCandidate`, `documentRouterService.ts:1240-1321`)
  generates payment_confirmation candidates **only against `payment` rows** via
  `loadOpenPaymentsForVendor` (filter `payment_state IN ('pending','paid')`).
  `seedPayment` sets `payment_state: 'paid'` → the seeded payment is a valid
  candidate target. (No bill / prepayment iteration for payment_confirmation.)
- **`buildPaymentConfirmationProposal`** (`proposalBuilder.ts:238-302`) has
  three branches:
  1. cited-bill OR top candidate is a `bill` → `record_bill_payment`
     ProposedEntry (commits; `proposal_id = payment_id`).
  2. no cited bill + `topCandidate.linked_entity_id !== null` →
     `attach_payment_evidence` ProposedAttachmentCard (`ingestDocument.ts:492`
     → `proposal_id=null`).
  3. no match → `payment_confirmation_unmatched_defensive_guard` ProposedEntry
     (empty payload → exception queue; `proposal_id=null`).
- Scenario 1 (no cited bill + seeded matching payment) → **Branch 2** →
  `attach_payment_evidence` → `status='committed'`, `proposal_id===null`.
  **Assertion confirmed correct.**

**Positive-evidence side-findings (fold into the OUTCOME doc only, per founder
direction — not a friction-journal addendum):**
1. **Branch 2 is not threshold-gated** — it fires on *any* non-null candidate,
   including the 0.25-confidence kind the 2026-05-24 run produced.
2. The payment→payment emission path is the *same one* that already fired
   (receipt→payment at 0.25) in the prior run — unlike the bill-candidate path,
   which never emitted. So Scenario 1 has materially better odds than the
   previously-failed bill scenarios.

The 2026-05-24 friction entry already scopes its finding to *bill*-candidate
generation specifically, so no refinement of that entry is needed; the
Branch-2-not-threshold-gated observation is the genuinely new ground and belongs
in the outcome doc's "what was run / why we expected better odds" framing.

**Harness column names verified:** `bills` → `bill_id, org_id, vendor_id,
bill_number, issue_date, amount_original, amount_cad, currency, fx_rate,
lifecycle_state`; `payments` → `payment_id, org_id, vendor_id, payment_date,
amount, currency, payment_method, payment_purpose, payment_state, applied_to,
reference_number`. `getPaymentById` selects `payment_id, vendor_id`.

---

## 5. Scope

**In scope:**
1. No-dep PDF generator producing 2 synthetic fixtures (durable infra).
2. `LABELS` env-var filter on the capture script (cost discipline; durable infra).
3. Corpus + `corpus.sanitized.ts` entries for both fixtures (cheap regression).
4. Harness helpers `getBillsByVendor` / `getPaymentsByVendor`.
5. Scenario 1 unskipped + **paid** Modal-e2e; Scenario 2 body written, left
   `it.skip [NEEDS-FIX]`.
6. `.gitignore` for `document-pipeline-demo/` (allowlist pattern).
7. Friction-journal entry: born-paid non-functionality (3 sub-findings).
8. Phase 8 retrospective amendment (additive "NEEDS-FIXTURE closeout" subsection).
9. Outcome doc.

**Out of scope — do NOT fix-forward:**
- Born-paid bundle bug fix (`proposalBuilder.ts:136,152` field-name + type
  mismatch) — **named next arc**.
- Schema-gap fixes (receipt + vendor_invoice extraction schemas) — surfaced in
  the retrospective amendment, not fixed.
- Bill-candidate matching investigation — named next arc.
- `CURRENT_STATE.md`, `session-init.sh`, backup cleanup — deferred housekeeping.
- New ADR / convention work.

---

## 6. Step-by-step plan

### Step 1 — Re-ground + baseline
```bash
git log -1 --format=%H        # expect 5eade62f...
pnpm typecheck && pnpm agent:validate && pnpm test
```
Confirm `1406/0/10` routine baseline (e2e file is `describe.skipIf(!RUN_E2E)`-
gated; contributes to the 10 skips). Independently re-verify all four
corrections against disk (grep `isBornPaidBundleCandidate`, `buildBornPaidBundle`,
the three extraction schemas' fields, `git ls-files` on the demo dir). If any
correction no longer holds, STOP and surface before designing fixtures.

### Step 2 — Capture-script `LABELS` filter (fragment-file approach)
Add to `apps/web/scripts/capture-real-ocr-fixtures.ts`, top of `main()`:
```ts
const labelFilter = process.env.LABELS?.split(',').map((s) => s.trim()).filter(Boolean);
const targets = labelFilter && labelFilter.length > 0
  ? CORPUS.filter((doc) => labelFilter.includes(doc.label))
  : CORPUS;
if (labelFilter && targets.length !== labelFilter.length) {
  const missing = labelFilter.filter((l) => !CORPUS.some((d) => d.label === l));
  console.error(`Unknown LABELS: ${missing.join(', ')}`);
  process.exit(1);
}
```
When `LABELS` is set, emit captured entries to `corpus.partial.ts` (a fragment),
to be merged into `corpus.ts` manually. Without `LABELS`, behavior is unchanged
(full `CORPUS` → `corpus.ts`). `corpus.sanitized.ts` updates are always manual
per existing sanitization discipline. Document the choice in the script header.

### Step 3 — Generate the 2 synthetic PDFs
Write `apps/web/scripts/generate-synthetic-fixtures.ts` (no-dep PDF writer, ~80
lines: header, catalog, pages, page, Helvetica font, content stream, xref,
trailer). Output to `apps/web/tests/fixtures/document-pipeline-demo/`. Add a
`.gitignore` to that directory:
```gitignore
# Synthetic + downloaded fixtures — regenerated by
# scripts/generate-synthetic-fixtures.ts and by manual founder downloads.
# Captured OCR line-text in ../classifier/real-ocr/corpus.sanitized.ts is the
# committed canonical input the tests consume.
*
!.gitignore
```

**Fixture 1 — `payment_no_cited_bill.pdf`** (classify payment_confirmation via
Tier A; NO cited bill; payment amount + date). Content:
```
PAYMENTS MADE
Payee: Figma, Inc.
Payment Date: 2025-11-20
Amount Paid: $282.24
Payment Mode: EFT
Paid Through: Operating Account
```
Rationale: `PAYMENTS MADE` / `Amount Paid` / `Payment Date` / `Payment Mode`
are payment_confirmation positives; no invoice/bill text → `hasCitedBill=false`
→ `isBornPaidBundleCandidate` false → regular payment_confirmation routing; no
Subtotal/Tax/Total cluster → receipt-negative pattern won't fire. Tier A
extracts `payment_amount` + `payment_date` but not `payment_reference` → Tier A
insufficient → Tier C runs (routing unaffected either way).

**Fixture 2 — `born_paid_invoice.pdf`** (classify payment_confirmation; exercise
the broken bundle path; durable infra). Content:
```
PAYMENTS MADE — BORN-PAID RECEIPT
Vendor: Figma, Inc.
Vendor Tax ID: 100000000RT9999
Bill Number: 1ABCD23M-0002
Bill Date: 2025-11-20
Bill Amount: $282.24
Payment Date: 2025-11-20
Amount Paid: $282.24
Payment Mode: EFT
```
Rationale: strong payment_confirmation positives; `Bill Number` is in the
`vendorInvoiceRules.ts` negative-lookahead exclusion
(`/\bbill\b(?!\s*(to|number|date|amount|no\b))/i`) so it won't trip the
vendor_invoice header rule; explicit `Bill Number: 1ABCD23M-0002` is the shape
the Tier C `cited_invoice_number` prompt expects. Even with perfect
classification + extraction, the bundle commit fails per Correction 2 — that is
the point; the fixture is sound and reaches `buildBornPaidBundle`.

Use ≥12pt with comfortable line-spacing (PaddleOCR is robust on PDF-native text
but can mis-segment tightly-spaced lines).

### Step 4 — Capture (paid, label-filtered)
Add 2 entries to `CORPUS` first (e.g. labels `synthetic_no_cited_payment`,
`synthetic_born_paid`, both `expectedType: 'payment_confirmation'`, `source:
'demo'`). **STOP, surface cost (~$0.10 ceiling: 2 OCR captures + possible cold
start), wait for explicit "go"**, then:
```bash
LABELS=synthetic_no_cited_payment,synthetic_born_paid \
  pnpm --filter @chounting/web exec tsx scripts/capture-real-ocr-fixtures.ts
```
Inspect the captured lines: `synthetic_no_cited_payment` must contain
`PAYMENTS MADE` / `Amount Paid` / `Payment Date` and NOT `Invoice number` /
`Bill Number`; `synthetic_born_paid` must contain `Bill Number` /
`1ABCD23M-0002` / `PAYMENTS MADE` / `Amount Paid`. If OCR is garbage, regenerate
with bigger fonts / cleaner layout and re-capture.

### Step 5 — Sanitize into `corpus.sanitized.ts`
Manually copy the new entries into `REAL_OCR_CORPUS`. Fixtures use only
synthetic identities (Figma, Inc. / `1ABCD23M-0002` / `100000000RT9999`) already
present consistently in the sanitized corpus, so sanitization is verbatim copy;
match existing substitution conventions if anything needs scrubbing. Then:
```bash
pnpm --filter @chounting/web test classifierRealOcr.integration.test.ts
```
New entries must classify as `payment_confirmation` OR abstain (no-match →
Tier C). Anything else trips the overfit guard → inspect line-text, find the
misfiring negative pattern, fix the source PDF, re-capture.

### Step 6 — Harness helpers + scenario bodies
Add to `apps/web/tests/integration/e2e/ingestPipelineHarness.ts`:
```ts
export async function getBillsByVendor(
  vendor_id: string,
): Promise<Array<{ bill_id: string; vendor_id: string; bill_number: string | null; amount_cad: string }>> {
  const admin = adminClient();
  const { data } = await admin
    .from('bills')
    .select('bill_id, vendor_id, bill_number, amount_cad')
    .eq('vendor_id', vendor_id);
  return (data ?? []) as Array<{ bill_id: string; vendor_id: string; bill_number: string | null; amount_cad: string }>;
}

export async function getPaymentsByVendor(
  vendor_id: string,
): Promise<Array<{ payment_id: string; vendor_id: string | null; amount: string }>> {
  const admin = adminClient();
  const { data } = await admin
    .from('payments')
    .select('payment_id, vendor_id, amount')
    .eq('vendor_id', vendor_id);
  return (data ?? []) as Array<{ payment_id: string; vendor_id: string | null; amount: string }>;
}
```
Verify `cleanupSeededVendor` cascades (it deletes `bill_payment_allocations` +
`payments` + `bills` + `vendors` by `vendor_id`, covering bundle-committed rows).

In `documentPipeline.paymentConfirmation.e2e.test.ts`, replace the two
`it.skip` placeholders:

**Scenario 1 — UNSKIPPED:**
```ts
it(
  'payment_confirmation no-cited-bill + matched candidate: ProposedAttachmentCard attach_payment_evidence → proposal_id=null',
  async () => {
    const vendorId = await seedVendor();
    // Seed a payment matching the fixture's amount/date so Stage 6 emits a
    // payment-candidate; pipeline routes via buildPaymentConfirmationProposal
    // Branch 2 (no cited bill + matched candidate with concrete entity).
    await seedPayment({ vendor_id: vendorId });
    try {
      const { output } = await runIngestPipeline('payment_no_cited_bill.pdf');
      expect(output.status).toBe('committed');
      expect(output.failure_class).toBeNull();
      // attach_payment_evidence is a ProposedAttachmentCard; orchestrator
      // returns proposal_id=null per ingestDocument.ts (non-ledger commit).
      expect(output.proposal_id).toBeNull();
    } finally {
      await cleanupSeededVendor(vendorId);
    }
  },
  MODAL_TIMEOUT_MS,
),
```

**Scenario 2 — BODY WRITTEN, LEFT `it.skip [NEEDS-FIX]`:**
```ts
// NEEDS-FIX (NOT NEEDS-FIXTURE): fixture exists + classifies + extracts
// correctly, but buildBornPaidBundle (proposalBuilder.ts:136,152) reads
// extractedFields.amount as string while PaymentConfirmationExtractionSchema
// emits payment_amount as z.number(). post_bill child gets amount: undefined →
// buildPostBillInputFromChildMutation returns null → bundle commit skipped →
// proposal_id=null. Deterministic static bug; born-paid is non-functional at
// v1 (combined with the structural dead-code in the receipt + vendor_invoice
// branches per the schema-gap finding). Re-enable once the bundle field-name
// mismatch is fixed. See friction-journal 2026-05-24 (born-paid entry).
it.skip(
  'payment_confirmation born-paid (cited invoice + payment): ProposedMutationBundle born_paid_bill + partial-commit reconciliation [NEEDS-FIX]',
  async () => {
    const vendorId = await seedVendor();
    try {
      const { output } = await runIngestPipeline('born_paid_invoice.pdf');
      expect(output.status).toBe('committed');
      expect(output.failure_class).toBeNull();
      expect(output.proposal_id).not.toBeNull();
      const bills = await getBillsByVendor(vendorId);
      const payments = await getPaymentsByVendor(vendorId);
      expect(bills.length).toBe(1);
      expect(payments.length).toBe(1);
      expect(bills[0]!.bill_id).toBe(output.proposal_id);
    } finally {
      await cleanupSeededVendor(vendorId);
    }
  },
  MODAL_TIMEOUT_MS,
),
```

### Step 7 — Friction-journal entry + retrospective amendment
Append a friction-journal entry dated 2026-05-24 documenting born-paid
non-functionality with three sub-findings: (1) receipt branch dead (schema gap
— no `cited_*`), (2) vendor_invoice branch dead (schema gap — no `payment_*`),
(3) `buildBornPaidBundle` field-name + type mismatch (`amount` string vs
`payment_amount` number). Frame as N=1 on **born-paid feature
non-functionality at v1** — distinct from the 2026-05-24 bill-candidate finding
(that is Stage 6 matching; this is proposal-builder + extraction-schema
substrate). Disposition: fixture + body built as durable infra, left
`it.skip [NEEDS-FIX]`, no paid e2e. Cross-reference this spec and the outcome
doc.

**Entry format:** follow the *recent* friction-journal convention — a
full `## 2026-05-24 — <title>` section with prose sub-findings (as used by the
auto-commit-arc, Modal-e2e-followup, and Tier C entries), **not** the strict
one-line `[date] [category] [description]` format the file header declares but
recent entries no longer follow. Do not compress to a one-liner. Dominant
category is **WRONG** (the `buildBornPaidBundle` bug — broken code); the two
schema-gap sub-findings are **NOTE** (structural dead-code, not a defect to fix
this session). Inline-cite WRONG as the entry's dominant category.

Then add an additive "NEEDS-FIXTURE closeout (2026-05-24)" subsection to
`docs/07_governance/retrospectives/phase-8-retrospective.md` (after the existing
"Follow-ups closeout" subsection): record Scenario 1's outcome, the Scenario 2
`[NEEDS-FIX]` reframe + 3-sub-finding, and that **born-paid bundle fix is now
the named next arc** (the original §3 framing scoped it as
fixture-availability; this grounding closes that framing — the feature is
non-functional independent of fixtures).

### Step 8 — Paid Modal-e2e (Scenario 1 only)
**STOP, surface cost (~$0.10 ceiling; combined with Step 4 ~$0.20 session
total), wait for explicit "go"**, then:
```bash
cd apps/web
RUN_MODAL_E2E=1 pnpm test:integration tests/integration/e2e/documentPipeline.paymentConfirmation.e2e
```
Born-paid skips per its `it.skip`; only Scenario 1 runs paid. Verify Vitest's
skip/run report matches.

### Step 9 — Disposition for Scenario 1
- **Passes:** one NEEDS-FIXTURE item closes cleanly; record pass in the
  retrospective subsection.
- **Fails "no payment-candidate emitted":** re-skip with a comment pointing at
  the existing bill-candidate friction entry (now N=2 on that finding); add an
  N=2 addendum to the 2026-05-24 entry; record re-skip in the retrospective.
  Revert the Scenario 1 body to `it.skip` before its commit lands — never ship
  a known-failing test.
- **Fails differently / surprisingly:** STOP, capture failure detail, surface
  to founder; gather evidence before speculating on root cause.
- **Tier C array-vs-object fires** (Tier C extract returns top-level JSON array,
  Zod rejects — same shape as the 2026-05-23 N=1): that is N=2 → codification
  fires. Surface both N=1 + N=2 evidence; recommend defense-in-depth
  (prompt-side strengthening + schema-side `T | T[]` tolerance with
  normalization); add one commit with codification + friction-journal N=2 mark.

### Step 10 — Commits (3, possibly 4)
1. **Fixtures + tooling:** `generate-synthetic-fixtures.ts` (new);
   `capture-real-ocr-fixtures.ts` (`LABELS` filter); `document-pipeline-demo/
   .gitignore` (new); `corpus.sanitized.ts` (2 entries). PDFs gitignored, not
   committed. Commit message notes the Correction 3 reframe (no existing
   pattern; this commit establishes one).
2. **Harness + scenarios + governance:** `ingestPipelineHarness.ts` (2 helpers);
   `documentPipeline.paymentConfirmation.e2e.test.ts` (Scenario 1 unskipped or
   reverted per Step 9; Scenario 2 `[NEEDS-FIX]`); `friction-journal.md`
   (born-paid entry); `phase-8-retrospective.md` (closeout subsection).
3. **Outcome doc:** `docs/09_briefs/phase-8/2026-05-24-needs-fixture-closeout.md`
   (modeled on `2026-05-24-modal-e2e-followup.md`: what was run / what happened
   per scenario / what we learned / disposition / carry-forwards). Folds in the
   Branch-2-not-threshold-gated positive-evidence side-finding (§4).
4. **Conditional:** Tier C codification, if N=2 fired (Step 9).

### Step 11 — Session close
```bash
pnpm typecheck && pnpm agent:validate && pnpm test
# expect 1406+/0/10 routine (e2e gated). The 2 new corpus entries increase the
# routine count, but DO NOT predict a specific total: classifierRealOcr's suite
# may iterate each entry through >1 test (no-error capture check + diagnostic
# verdict), so the delta could be +2 or +4. Report the EXACT observed count at
# close rather than asserting a predicted number (avoids a prediction-grounding
# miss reading as a defect on an otherwise-green suite).
```
Push to `origin/staging` (fast-forward). Surface to founder: which scenario
passed/re-skipped; the born-paid `[NEEDS-FIX]` reframe + 3-sub-finding; actual
combined paid cost; new open arcs; routine baseline shift.

---

## 7. Posture notes

- **Verify-from-disk before every claim.** This spec is grounded at `5eade62f`;
  re-check the four corrections at impl onset (Step 1).
- **Paid-API gate is non-negotiable.** Two paid moments (capture ~$0.10;
  Scenario 1 e2e ~$0.10). STOP, surface estimate, wait for explicit "go".
  Combined ceiling ~$0.20.
- **Do not fix-forward the born-paid bundle bug.** It has ≥3 reasonable fixes
  with different blast radii (rename in `proposalBuilder`; mirror in extractor;
  both with number→string coercion; plus whether the receipt/vendor_invoice
  schema gaps should be filled or codified as intentionally-dead). That is an
  arc, not a mid-session patch.
- **No close-report ceremony.** Tell the founder what landed, what tests
  shifted, the cost, what's left.

---

## 8. Open carry-forwards after this session

1. **Born-paid bundle fix** (the 3-sub-finding entry) — **named next arc**;
   likely a 1–2 commit arc (rename `amount` → `payment_amount` in
   `proposalBuilder` + number→string coercion; decide whether to fill or
   codify-as-dead the receipt/vendor_invoice schema gaps).
2. **Bill-candidate matching investigation** — still open (N=2 if Scenario 1
   re-skips).
3. **Tier C extract robustness** — still N=1 (or N=2 + codified if it fired).
