# Modal-e2e Fixture-Coverage Closeout — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close the two `[NEEDS FIXTURE]` Modal-e2e scenarios asymmetrically — build + unskip + paid-run Scenario 1 (no-cited-bill payment); build Scenario 2 (born-paid) as durable infra but leave it `it.skip [NEEDS-FIX]` (statically-proven bug, no paid run) — plus the synthetic-fixture tooling, corpus regression, governance entries, and outcome doc.

**Architecture:** A zero-dependency PDF generator emits two synthetic single-page text PDFs into the (now-gitignored) `document-pipeline-demo/` directory. A `LABELS`-filtered extension of the capture script OCRs only the new fixtures into a gitignored `corpus.partial.ts` fragment, which is hand-sanitized into the committed `corpus.sanitized.ts` (cheap Tier-A regression). Two new harness helpers support the born-paid assertion. Scenario 1 runs paid against the real Modal sidecar; Scenario 2's body is written but skipped. Governance: a friction-journal entry (born-paid non-functionality, WRONG-dominant) + a Phase 8 retrospective amendment + an outcome doc.

**Tech Stack:** TypeScript, Node built-ins (no new deps), `tsx`, Vitest, Supabase admin client, Modal OCR sidecar (paid), pnpm workspace (`@chounting/web`).

**Spec:** `docs/09_briefs/phase-8/2026-05-24-needs-fixture-closeout-spec.md` (read first).

**Commit discipline:** Three logical commits per the spec (project convention — coherent multi-file commits at logical boundaries, not per-task micro-commits). Tasks are grouped under COMMIT 1 / 2 / 3 markers; the commit is the final step of each group. Prefix every commit with `COORD_SESSION='needs-fixture-closeout'` (shell env does not persist across the session-lock and the pre-commit hook needs it inline).

**Two HUMAN GATES (paid API):** Task 4 (capture, ~$0.10) and Task 8 (Scenario 1 e2e, ~$0.10). STOP, surface the cost estimate, wait for explicit founder "go" before running. Combined ceiling ~$0.20.

**Out of scope (do NOT fix-forward):** born-paid bundle bug (`proposalBuilder.ts:136,152`), schema-gap fixes, bill-candidate matching investigation, housekeeping, new ADR/convention work.

---

## Task 0: Pre-flight — re-ground and baseline

**Files:** none (verification only).

- [ ] **Step 1: Confirm HEAD and clean tree**

Run:
```bash
git log -1 --format=%H        # expect 5eade62f... (or 3445828e if spec commit is HEAD)
git status --short
```
Expected: HEAD is the spec commit `3445828e` (or `5eade62f` if spec not yet committed in this clone); working tree shows only the known unrelated untracked paths.

- [ ] **Step 2: Routine baseline**

Run:
```bash
pnpm typecheck && pnpm agent:validate && pnpm test
```
Expected: `pnpm test` green at `1406` passing / `0` failing / `10` skipped (the e2e file is `describe.skipIf(!RUN_E2E)`-gated). Record the exact observed numbers — they are the close-comparison baseline.

- [ ] **Step 3: Re-verify the four spec corrections against disk**

Run:
```bash
rg -n "isBornPaidBundleCandidate|extractedFields\.amount" apps/web/src/agent/orchestrator/extraction/stages/proposalBuilder.ts
rg -n "payment_amount" apps/web/src/shared/schemas/extraction/paymentConfirmationExtractionSchema.ts
git ls-files apps/web/tests/fixtures/document-pipeline-demo/   # expect EMPTY
```
Expected: `isBornPaidBundleCandidate` has the two branches; `buildBornPaidBundle` reads `extractedFields.amount` as string (lines ~136,152); `paymentConfirmationExtractionSchema` declares `payment_amount` as a number; demo dir is untracked. **If any correction no longer holds, STOP and surface to the founder before proceeding** — the fixture/scenario design depends on them.

---

## COMMIT 1 — synthetic fixtures + capture tooling + corpus regression

## Task 1: Zero-dependency PDF generator + generate the two fixtures

**Files:**
- Create: `apps/web/scripts/generate-synthetic-fixtures.ts`
- Output (gitignored, Task 2): `apps/web/tests/fixtures/document-pipeline-demo/payment_no_cited_bill.pdf`, `apps/web/tests/fixtures/document-pipeline-demo/born_paid_invoice.pdf`

**Design note — no TDD red/green here, by design:** a fixture PDF's correctness is defined by what PaddleOCR reads back from it (Task 4), not by its byte structure. The script therefore self-checks structural soundness inline (magic bytes, EOF, each input line present) and throws on failure; the real validation is the OCR capture (Task 4) and the classifier regression (Task 5). ASCII-only content (the writer uses single-byte `latin1` encoding — no em-dashes or other multi-byte glyphs).

- [ ] **Step 1: Write the generator script**

Create `apps/web/scripts/generate-synthetic-fixtures.ts`:
```ts
/**
 * Modal-e2e NEEDS-FIXTURE closeout (2026-05-24) — synthetic fixture generator.
 *
 * Emits two single-page, text-based PDFs into document-pipeline-demo/ for the
 * two deferred payment_confirmation e2e scenarios. Zero dependencies: a minimal
 * PDF 1.4 writer using only Node built-ins. Output is deterministic (no
 * embedded timestamps), matching the gitignore-and-regenerate posture — the
 * committed canonical input is the sanitized OCR in
 * ../tests/fixtures/classifier/real-ocr/corpus.sanitized.ts, not these binaries.
 *
 * Content is ASCII-only (the writer encodes latin1 single-byte). Dates align
 * with DEMO_FIGMA.issueDate (2025-11-18) and amount 282.24 so Scenario 1's
 * seeded payment maximizes Stage 6 match odds.
 *
 * Run (from repo root):
 *   pnpm --filter @chounting/web exec tsx scripts/generate-synthetic-fixtures.ts
 */
import * as fs from 'node:fs';
import * as path from 'node:path';

const SCRIPT_DIR = path.dirname(process.argv[1] ?? __filename ?? '');
const APP_WEB_DIR = path.resolve(SCRIPT_DIR, '..');
const DEMO_DIR = path.join(APP_WEB_DIR, 'tests', 'fixtures', 'document-pipeline-demo');

function escapePdfText(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
}

/** Minimal single-page PDF 1.4 with Helvetica text, one input line per row. */
function buildSinglePagePdf(lines: string[]): Buffer {
  const fontSize = 14;
  const leading = 20;
  const startX = 72;
  const startY = 720;

  const contentParts = [
    'BT',
    `/F1 ${fontSize} Tf`,
    `${leading} TL`,
    `${startX} ${startY} Td`,
    ...lines.map((l) => `(${escapePdfText(l)}) Tj T*`),
    'ET',
  ];
  const content = contentParts.join('\n');
  const contentLen = Buffer.byteLength(content, 'latin1');

  const objBodies = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] ' +
      '/Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    `<< /Length ${contentLen} >>\nstream\n${content}\nendstream`,
  ];

  const header = '%PDF-1.4\n';
  let body = '';
  const offsets: number[] = [];
  let pos = Buffer.byteLength(header, 'latin1');
  objBodies.forEach((obj, i) => {
    const objStr = `${i + 1} 0 obj\n${obj}\nendobj\n`;
    offsets.push(pos);
    body += objStr;
    pos += Buffer.byteLength(objStr, 'latin1');
  });

  const xrefStart = pos;
  const count = objBodies.length + 1; // object 0 is the free head
  let xref = `xref\n0 ${count}\n0000000000 65535 f \n`;
  for (const off of offsets) {
    xref += `${off.toString().padStart(10, '0')} 00000 n \n`;
  }
  const trailer =
    `trailer\n<< /Size ${count} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF\n`;

  return Buffer.from(header + body + xref + trailer, 'latin1');
}

function assertSound(pdf: Buffer, lines: string[], label: string): void {
  const s = pdf.toString('latin1');
  if (!s.startsWith('%PDF-1.4')) throw new Error(`${label}: missing %PDF header`);
  if (!s.trimEnd().endsWith('%%EOF')) throw new Error(`${label}: missing %%EOF`);
  for (const l of lines) {
    if (!s.includes(escapePdfText(l))) throw new Error(`${label}: line not embedded: ${l}`);
  }
}

// Fixture 1 — no cited bill; classifies payment_confirmation; payment fields.
const PAYMENT_NO_CITED_BILL: string[] = [
  'PAYMENTS MADE',
  'Payee: Figma, Inc.',
  'Payment Date: 2025-11-18',
  'Amount Paid: $282.24',
  'Payment Mode: EFT',
  'Paid Through: Operating Account',
];

// Fixture 2 — born-paid; cited bill + payment fields; exercises the (broken)
// bundle path. ASCII hyphen, not em-dash (latin1 single-byte).
const BORN_PAID_INVOICE: string[] = [
  'PAYMENTS MADE - BORN-PAID RECEIPT',
  'Vendor: Figma, Inc.',
  'Vendor Tax ID: 100000000RT9999',
  'Bill Number: 1ABCD23M-0002',
  'Bill Date: 2025-11-18',
  'Bill Amount: $282.24',
  'Payment Date: 2025-11-18',
  'Amount Paid: $282.24',
  'Payment Mode: EFT',
];

function emit(filename: string, lines: string[]): void {
  const pdf = buildSinglePagePdf(lines);
  assertSound(pdf, lines, filename);
  const out = path.join(DEMO_DIR, filename);
  fs.writeFileSync(out, pdf);
  console.log(`Wrote ${out} (${pdf.length} bytes, ${lines.length} lines)`);
}

fs.mkdirSync(DEMO_DIR, { recursive: true });
emit('payment_no_cited_bill.pdf', PAYMENT_NO_CITED_BILL);
emit('born_paid_invoice.pdf', BORN_PAID_INVOICE);
```

- [ ] **Step 2: Run the generator**

Run:
```bash
pnpm --filter @chounting/web exec tsx scripts/generate-synthetic-fixtures.ts
```
Expected: two `Wrote …` lines, no thrown errors (the inline `assertSound` passed for both).

- [ ] **Step 3: Spot-check the PDFs are well-formed**

Run:
```bash
file apps/web/tests/fixtures/document-pipeline-demo/payment_no_cited_bill.pdf \
     apps/web/tests/fixtures/document-pipeline-demo/born_paid_invoice.pdf
head -c 8 apps/web/tests/fixtures/document-pipeline-demo/born_paid_invoice.pdf; echo
```
Expected: `file` reports `PDF document, version 1.4`; the head shows `%PDF-1.4`.

- [ ] **Step 4: Typecheck the new script**

Run:
```bash
pnpm typecheck
```
Expected: green (no errors introduced by the new script).

---

## Task 2: Gitignore the demo directory

**Files:**
- Create: `apps/web/tests/fixtures/document-pipeline-demo/.gitignore`

- [ ] **Step 1: Remove the stray Windows ADS stubs (never commit these)**

Run:
```bash
rm -f apps/web/tests/fixtures/document-pipeline-demo/*:Zone.Identifier
ls -1 apps/web/tests/fixtures/document-pipeline-demo/
```
Expected listing afterward: the 3 original demo PDFs + the 2 new synthetic PDFs + (after Step 2) `.gitignore`. No `*:Zone.Identifier` entries.

- [ ] **Step 2: Write the allowlist .gitignore (mirrors `source-pdfs/.gitignore`)**

Create `apps/web/tests/fixtures/document-pipeline-demo/.gitignore`:
```gitignore
# Demo + synthetic pipeline fixtures. The 3 demo PDFs were never committed; the
# 2 synthetic PDFs are regenerated deterministically by
# ../../../scripts/generate-synthetic-fixtures.ts. The committed canonical input
# the tests consume is the sanitized OCR line-text in
# ../classifier/real-ocr/corpus.sanitized.ts — not these binaries. Also excludes
# Windows NTFS *:Zone.Identifier artifacts.
*
!.gitignore
```

- [ ] **Step 3: Verify the binaries are ignored but the .gitignore is tracked**

Run:
```bash
git check-ignore apps/web/tests/fixtures/document-pipeline-demo/born_paid_invoice.pdf && echo "PDF IGNORED (good)"
git status --short apps/web/tests/fixtures/document-pipeline-demo/
```
Expected: the PDF is IGNORED; `git status` shows only `.gitignore` as a new (`??` → to be added) file under that path.

---

## Task 3: Capture-script `LABELS` filter + fragment emission + `synthetic` source + corpus entries

**Files:**
- Modify: `apps/web/scripts/capture-real-ocr-fixtures.ts`
- Modify: `apps/web/tests/fixtures/classifier/real-ocr/.gitignore`

- [ ] **Step 1: Widen the `CorpusDoc.source` union to include `'synthetic'`**

In `apps/web/scripts/capture-real-ocr-fixtures.ts`, change the `CorpusDoc` interface (line ~50):
```ts
interface CorpusDoc {
  label: string;
  expectedType: ExpectedType;
  source: 'demo' | 'founder' | 'synthetic';
  file: string; // absolute path
}
```

- [ ] **Step 2: Widen the emitted `RealOcrFixture.source` type literal**

In the same file, in the `out` template's interface (the emitted module, line ~136), change:
```ts
export interface RealOcrFixture {
  label: string;
  source: 'demo' | 'founder' | 'synthetic';
  expectedType: RealOcrExpectedType;
  captureError?: string;
  lines: string[];
}
```
(This widens the type the script writes into the gitignored `corpus.ts`; keep it consistent with the committed `corpus.sanitized.ts` widened in Task 5.)

- [ ] **Step 3: Append the two synthetic CORPUS entries**

In the same file, immediately before the closing `];` of the `CORPUS` array (after the `mattjanzen_payment` entry, line ~66), add:
```ts
  // Synthetic fixtures — Modal-e2e NEEDS-FIXTURE closeout (2026-05-24).
  // source:'synthetic' keeps them in the abstain-tolerant high-precision guard
  // and OUT of the forced-match demo-calibration block in
  // classifierRealOcr.integration.test.ts.
  { label: 'synthetic_no_cited_payment', expectedType: 'payment_confirmation', source: 'synthetic', file: path.join(DEMO_DIR, 'payment_no_cited_bill.pdf') },
  { label: 'synthetic_born_paid', expectedType: 'payment_confirmation', source: 'synthetic', file: path.join(DEMO_DIR, 'born_paid_invoice.pdf') },
```

- [ ] **Step 4: Add the `LABELS` filter at the top of `main()`**

In the same file, immediately after `const { invokeSidecar } = await import('../src/agent/orchestrator/extraction/sidecar/client');` (line ~70), insert:
```ts
  const labelFilter = process.env.LABELS?.split(',').map((s) => s.trim()).filter(Boolean);
  if (labelFilter?.length) {
    const unknown = labelFilter.filter((l) => !CORPUS.some((d) => d.label === l));
    if (unknown.length) {
      console.error(`Unknown LABELS: ${unknown.join(', ')}`);
      process.exit(1);
    }
  }
  const targets = labelFilter?.length
    ? CORPUS.filter((d) => labelFilter.includes(d.label))
    : CORPUS;
  console.log(
    `Capturing ${targets.length} of ${CORPUS.length} fixtures` +
      `${labelFilter?.length ? ` (LABELS=${labelFilter.join(',')})` : ''}.`,
  );
```

- [ ] **Step 5: Iterate `targets` instead of `CORPUS`**

In the same file, change the capture loop header (line ~73):
```ts
  for (const doc of targets) {
```

- [ ] **Step 6: Branch the emission — fragment when `LABELS` is set**

In the same file, replace the final write block (lines ~146-147, the `fs.writeFileSync(OUT_PATH, out);` + its `console.log`) with:
```ts
  if (labelFilter?.length) {
    const PARTIAL_PATH = path.join(
      APP_WEB_DIR, 'tests', 'fixtures', 'classifier', 'real-ocr', 'corpus.partial.ts',
    );
    const partial = `// AUTO-GENERATED fragment (LABELS-filtered capture) — RAW OCR, gitignored.
// Sanitize these entries into corpus.sanitized.ts's REAL_OCR_CORPUS array, then
// DELETE this file. Never commit raw OCR.
export const REAL_OCR_CORPUS_PARTIAL = [
${body}
];
`;
    fs.writeFileSync(PARTIAL_PATH, partial);
    console.log(`\nWrote ${captured.length} fragment fixtures to ${PARTIAL_PATH}`);
  } else {
    fs.writeFileSync(OUT_PATH, out);
    console.log(`\nWrote ${captured.length} fixtures to ${OUT_PATH}`);
  }
```
(`body` and `out` are both already in scope from earlier in `main()`; `out` is left built-but-unused on the fragment path — harmless.)

- [ ] **Step 7: Gitignore the fragment file**

In `apps/web/tests/fixtures/classifier/real-ocr/.gitignore`, append a line after `corpus.ts`:
```gitignore
corpus.partial.ts
```

- [ ] **Step 8: Typecheck**

Run:
```bash
pnpm typecheck
```
Expected: green. (The `source` widening + new entries + filter are all type-consistent.)

---

## Task 4: 🛑 HUMAN GATE (paid) — capture the synthetic fixtures' OCR

**Files:**
- Output (gitignored): `apps/web/tests/fixtures/classifier/real-ocr/corpus.partial.ts`

- [ ] **Step 1: Surface the cost estimate and STOP**

Tell the founder: "About to OCR 2 synthetic fixtures via the real Modal sidecar (paid). Estimate: ~$0.02–0.06 for 2 captures + ~$0.02–0.04 if Modal cold-starts → **~$0.10 ceiling**. This is the first of two paid gates this session (combined ~$0.20). Proceed?" **Wait for explicit "go".**

- [ ] **Step 2: Run the label-filtered capture**

After "go", run:
```bash
LABELS=synthetic_no_cited_payment,synthetic_born_paid \
  pnpm --filter @chounting/web exec tsx scripts/capture-real-ocr-fixtures.ts
```
Expected: `Capturing 2 of 12 fixtures (LABELS=…)`, two `OCR … N lines` rows, and `Wrote 2 fragment fixtures to …/corpus.partial.ts`. No `WARNING` about empty/errored OCR.

- [ ] **Step 3: Inspect the captured line-text**

Run:
```bash
cat apps/web/tests/fixtures/classifier/real-ocr/corpus.partial.ts
```
Verify:
- `synthetic_no_cited_payment` lines CONTAIN `PAYMENTS MADE`, `Amount Paid` / `$282.24`, `Payment Date` / `2025-11-18`; and do NOT contain `Invoice number` or `Bill Number`.
- `synthetic_born_paid` lines CONTAIN `PAYMENTS MADE`, `Bill Number`, `1ABCD23M-0002`, `Amount Paid`.

If OCR is garbage (line-text doesn't match the PDF), regenerate with larger fonts / cleaner spacing (Task 1, bump `fontSize`/`leading`) and re-run this gate (another paid call — re-surface the cost).

---

## Task 5: Sanitize into `corpus.sanitized.ts` + Tier-A regression

**Files:**
- Modify: `apps/web/tests/fixtures/classifier/real-ocr/corpus.sanitized.ts`
- Delete (after merge): `apps/web/tests/fixtures/classifier/real-ocr/corpus.partial.ts`

- [ ] **Step 1: Widen the committed `RealOcrFixture.source` union**

In `apps/web/tests/fixtures/classifier/real-ocr/corpus.sanitized.ts` (line ~29), change:
```ts
export interface RealOcrFixture {
  label: string;
  source: 'demo' | 'founder' | 'synthetic';
  expectedType: RealOcrExpectedType;
  captureError?: string;
  lines: string[];
}
```

- [ ] **Step 2: Append the two sanitized entries**

Copy the two entries from `corpus.partial.ts` into the `REAL_OCR_CORPUS` array, immediately before the closing `];` (after the `mattjanzen_payment` entry). The fixtures use only synthetic identities (`Figma, Inc.`, `1ABCD23M-0002`, `100000000RT9999`, `$282.24`, dates) that already appear consistently in the sanitized corpus, so this is a **near-verbatim copy** — preserve each entry's `label` / `source: "synthetic"` / `expectedType: "payment_confirmation"` and paste the captured `lines` verbatim. Only if a line contains a value NOT already in the synthetic identity set should it be scrubbed to match the existing substitution conventions (§corpus.sanitized.ts header). Shape:
```ts
  {
    label: "synthetic_no_cited_payment",
    source: "synthetic",
    expectedType: "payment_confirmation",
    lines: [
      // ...captured lines, verbatim from corpus.partial.ts...
    ],
  },
  {
    label: "synthetic_born_paid",
    source: "synthetic",
    expectedType: "payment_confirmation",
    lines: [
      // ...captured lines, verbatim from corpus.partial.ts...
    ],
  },
```

- [ ] **Step 3: Run the Tier-A corpus regression**

Run:
```bash
pnpm --filter @chounting/web test classifierRealOcr.integration.test.ts
```
Expected: green. The two new entries each get an `it` in the **high-precision** describe (must NOT misclassify; abstain → Tier C is acceptable). They are NOT in the forced-match `demo calibration` describe (that filters `source === 'demo'`), so abstain does not fail. **Grounded count:** this adds exactly **+2** `it`s (one per entry in the high-precision describe; the other two tests iterate internally).

- [ ] **Step 4: If `synthetic_no_cited_payment` MISCLASSIFIES (not abstain, wrong type)**

The overfit guard has fired. STOP — do not pre-tune the classifier. Inspect the line-text, identify the misfiring negative pattern, fix the **source PDF** (Task 1), re-run the capture gate (Task 4), re-sanitize. Surface to the founder if the cause is non-obvious.

- [ ] **Step 5: Delete the fragment and re-run the full typecheck/validate**

Run:
```bash
rm apps/web/tests/fixtures/classifier/real-ocr/corpus.partial.ts
pnpm typecheck && pnpm agent:validate
```
Expected: green. (The fragment is transient; deleting it keeps the tree clean and avoids a stray gitignored file lingering.)

- [ ] **Step 6: COMMIT 1**

Run:
```bash
git add apps/web/scripts/generate-synthetic-fixtures.ts \
        apps/web/scripts/capture-real-ocr-fixtures.ts \
        apps/web/tests/fixtures/document-pipeline-demo/.gitignore \
        apps/web/tests/fixtures/classifier/real-ocr/.gitignore \
        apps/web/tests/fixtures/classifier/real-ocr/corpus.sanitized.ts
git status --short   # confirm the 2 PDFs and corpus.partial.ts are NOT staged (gitignored)
COORD_SESSION='needs-fixture-closeout' git commit -m "$(cat <<'EOF'
test(modal-e2e-closeout): synthetic fixtures + LABELS capture filter + corpus entries

No-dep PDF generator emits 2 synthetic payment_confirmation fixtures
(payment_no_cited_bill, born_paid_invoice) into document-pipeline-demo/.
LABELS env-filter on the capture script writes a gitignored corpus.partial.ts
fragment; the 2 sanitized entries land in the committed corpus.sanitized.ts
under a new source:'synthetic' tag (abstain-tolerant high-precision guard, out
of the forced-match demo-calibration block). +2 routine tests.

Correction 3 reframe: the demo dir was never committed (no existing pattern);
this commit gitignores it (allowlist) and removes stray *:Zone.Identifier ADS
stubs. Synthetic PDFs are regenerated deterministically, not committed.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## COMMIT 2 — harness helpers + scenarios + governance

## Task 6: Harness helpers `getBillsByVendor` / `getPaymentsByVendor`

**Files:**
- Modify: `apps/web/tests/integration/e2e/ingestPipelineHarness.ts`

- [ ] **Step 1: Add the two helpers**

In `apps/web/tests/integration/e2e/ingestPipelineHarness.ts`, immediately after `getPaymentById` (ends line ~258) and before `cleanupSeededVendor`, insert:
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
(Column names verified against `seedApprovedBill`/`seedPayment`: `bills.amount_cad`, `payments.amount`.)

- [ ] **Step 2: Typecheck**

Run:
```bash
pnpm typecheck
```
Expected: green. (The helpers are exported but not yet imported — TS does not flag unused exports.)

---

## Task 7: e2e import update + Scenario 1 unskipped + Scenario 2 `[NEEDS-FIX]`

**Files:**
- Modify: `apps/web/tests/integration/e2e/documentPipeline.paymentConfirmation.e2e.test.ts`

- [ ] **Step 1: Extend the harness import**

In `apps/web/tests/integration/e2e/documentPipeline.paymentConfirmation.e2e.test.ts`, replace the import block (lines 20-27):
```ts
import {
  runIngestPipeline,
  seedVendor,
  seedApprovedBill,
  seedPayment,
  cleanupSeededVendor,
  getPaymentById,
  getBillsByVendor,
  getPaymentsByVendor,
  DEMO_FIGMA,
} from './ingestPipelineHarness';
```
(`seedApprovedBill` + `getPaymentById` stay — they're used by the existing skipped cited-bill scenario.)

- [ ] **Step 2: Replace the Scenario 1 placeholder (line 112) with the unskipped test**

Replace this line:
```ts
    it.skip('payment_confirmation no-cited-bill + matched candidate: ProposedAttachmentCard attach_payment_evidence → proposal_id=null [NEEDS FIXTURE]', async () => {});
```
with:
```ts
    // Fixture-blocked scenario, now unskipped (Modal-e2e closeout 2026-05-24).
    // A no-cited-bill payment_confirmation doc + a seeded matching payment →
    // Stage 6 emits a payment-candidate (loadOpenPaymentsForVendor) →
    // buildPaymentConfirmationProposal Branch 2 (no cited bill +
    // topCandidate.linked_entity_id !== null) → attach_payment_evidence
    // ProposedAttachmentCard → proposal_id=null (non-ledger, ingestDocument.ts).
    // Branch 2 is NOT threshold-gated, and the payment→payment candidate path
    // already fired in the 2026-05-24 run (at 0.25), so this has better odds
    // than the bill-candidate scenarios.
    it(
      'payment_confirmation no-cited-bill + matched candidate: ProposedAttachmentCard attach_payment_evidence → proposal_id=null',
      async () => {
        const vendorId = await seedVendor();
        await seedPayment({ vendor_id: vendorId });
        try {
          const { output } = await runIngestPipeline('payment_no_cited_bill.pdf');
          expect(output.status).toBe('committed');
          expect(output.failure_class).toBeNull();
          expect(output.proposal_id).toBeNull();
        } finally {
          await cleanupSeededVendor(vendorId);
        }
      },
      MODAL_TIMEOUT_MS,
    );
```

- [ ] **Step 3: Replace the Scenario 2 placeholder (line 113) with the `[NEEDS-FIX]` body**

Replace this line:
```ts
    it.skip('payment_confirmation born-paid (cited invoice + payment): ProposedMutationBundle born_paid_bill + partial-commit reconciliation [NEEDS FIXTURE]', async () => {});
```
with:
```ts
    // NEEDS-FIX (NOT NEEDS-FIXTURE): the fixture exists, classifies, and
    // extracts correctly, but buildBornPaidBundle (proposalBuilder.ts:136,152)
    // reads extractedFields.amount as a string while
    // PaymentConfirmationExtractionSchema emits payment_amount as z.number().
    // The post_bill child gets amount: undefined →
    // buildPostBillInputFromChildMutation returns null (ingestDocument.ts:730)
    // → bundle commit skipped → proposal_id=null. Deterministic static bug;
    // born-paid is non-functional at v1 (also: the receipt + vendor_invoice
    // branches of isBornPaidBundleCandidate are structurally dead — schema
    // gaps). Re-enable once the bundle field-name + type mismatch is fixed.
    // See friction-journal 2026-05-24 (born-paid non-functionality entry).
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
    );
```

- [ ] **Step 4: Typecheck + confirm routine still skips the e2e**

Run:
```bash
pnpm typecheck
pnpm --filter @chounting/web test documentPipeline.paymentConfirmation.e2e
```
Expected: typecheck green; the e2e run reports the whole describe **skipped** (no `RUN_MODAL_E2E`), confirming the routine baseline is unaffected by the unskipped Scenario 1.

---

## Task 8: 🛑 HUMAN GATE (paid) — Scenario 1 Modal-e2e run + disposition

**Files:** possibly Modify `documentPipeline.paymentConfirmation.e2e.test.ts` (revert Scenario 1 to `it.skip` on a re-skip disposition).

- [ ] **Step 1: Surface the cost estimate and STOP**

Tell the founder: "About to run Scenario 1 against the real Modal sidecar (paid). Estimate: ~$0.01–0.03 OCR + ~$0.02–0.05 Tier C (if Tier A insufficient) + cold start → **~$0.10 ceiling**. Scenario 2 stays skipped. Combined with the capture gate, session paid total ~$0.20. Proceed?" **Wait for explicit "go".**

- [ ] **Step 2: Run the paid e2e**

After "go", run:
```bash
cd apps/web && RUN_MODAL_E2E=1 pnpm test:integration tests/integration/e2e/documentPipeline.paymentConfirmation.e2e
```
Verify Vitest reports: the unseeded scenario passing, **Scenario 1 running** (not skipped), Scenario 2 + cited-bill scenario **skipped**.

- [ ] **Step 3: Disposition (apply exactly ONE branch per the spec §Step 9 matrix)**

- **PASS:** Scenario 1 stays unskipped. Record the pass for Task 10 / Task 11. Done.
- **FAIL "no payment-candidate emitted" / `proposal_id` unexpectedly null with no candidate:** revert Scenario 1 to `it.skip(...)` (keep the body; add a comment pointing at the existing 2026-05-24 bill-candidate friction entry — now N=2 on that finding). Note for Task 9/10/11 that this is N=2 evidence. **Never ship a known-failing test.**
- **FAIL differently / surprisingly:** STOP. Capture the failure output verbatim, surface to the founder, gather evidence before any root-cause claim. Revert Scenario 1 to `it.skip` pending investigation.
- **Tier C array-vs-object fires** (Tier C extract returns a top-level JSON array → Zod rejects, same shape as the 2026-05-23 N=1): this is N=2 → codification fires (Task 12). Surface both N=1 + N=2 evidence to the founder.

---

## Task 9: Friction-journal entry — born-paid non-functionality

**Files:**
- Modify: `docs/07_governance/friction-journal.md`

- [ ] **Step 1: Read the file tail to anchor the append point**

Run:
```bash
tail -40 docs/07_governance/friction-journal.md
```
Confirm the recent entries use the `## YYYY-MM-DD — <title>` section format (NOT the strict one-line `[date] [category]` header format the file's top declares). Match the recent convention.

- [ ] **Step 2: Append the entry**

Append at the bottom of `docs/07_governance/friction-journal.md`:
```markdown
## 2026-05-24 — Born-paid bundle non-functional at v1 (WRONG; 3 sub-findings)

Building the 2 NEEDS-FIXTURE Modal-e2e scenarios surfaced that the born-paid
bundle feature has zero working code paths at v1. Dominant category **WRONG**
(broken code in `buildBornPaidBundle`); the two schema-gap sub-findings are
**NOTE** (structural dead-code, not a defect fixed this session).

1. **(NOTE) `isBornPaidBundleCandidate` receipt branch structurally dead.**
   `ReceiptExtractionSchema` has no `cited_invoice_number` / `cited_bill_id`
   field; a receipt-classified document cannot satisfy `hasCitedBill`. Branch
   defined but unreachable.
2. **(NOTE) `isBornPaidBundleCandidate` vendor_invoice branch structurally
   dead.** `VendorInvoiceExtractionSchema` has no `payment_reference` /
   `payment_method` field; a vendor_invoice-classified document cannot satisfy
   `hasPaymentFields`. Branch defined but unreachable.
3. **(WRONG) `buildBornPaidBundle` (proposalBuilder.ts:136,152) field-name +
   type mismatch.** Reads `extractedFields.amount` and checks
   `typeof … === 'string'`. `PaymentConfirmationExtractionSchema` emits
   `payment_amount` as `z.number()`. The bundle's `post_bill` child gets
   `amount: undefined` → `buildPostBillInputFromChildMutation`
   (ingestDocument.ts:730) returns null → bill commit skipped →
   `proposal_id=null`. Same mismatch on the `record_bill_payment` child.

The payment_confirmation branch of `isBornPaidBundleCandidate` IS reachable
(payment_confirmation classification + Tier C extracting `cited_invoice_number`
+ a payment field), but routing to `buildBornPaidBundle` then hits sub-finding 3
deterministically. So no born-paid bundle has ever committed.

N=1 on **born-paid feature non-functionality at v1** — a single finding with 3
sub-mechanisms. Distinct from the 2026-05-24 bill-candidate finding (that is
Stage 6 candidate matching against seeded state on real OCR; this is the
proposal-builder + extraction-schema substrate).

**Disposition:** built Fixture 2 + scenario body as durable infra; left the
scenario `it.skip` with `[NEEDS-FIX]` pointing here. Did NOT spend paid Modal $
on its e2e (the failure is statically proven). Born-paid bundle fix is the named
next arc. Grounding came from the closeout work; see
`docs/09_briefs/phase-8/2026-05-24-needs-fixture-closeout.md`.
```

---

## Task 10: Phase 8 retrospective amendment

**Files:**
- Modify: `docs/07_governance/retrospectives/phase-8-retrospective.md`

- [ ] **Step 1: Locate the append point**

Run:
```bash
rg -n "Follow-ups closeout" docs/07_governance/retrospectives/phase-8-retrospective.md
```
Read the "Follow-ups closeout (2026-05-24)" subsection and its end. The new subsection goes immediately after it.

- [ ] **Step 2: Append the additive subsection**

Insert after the "Follow-ups closeout" subsection (fill the bracketed Scenario-1 outcome per the Task 8 disposition):
```markdown
### NEEDS-FIXTURE closeout (2026-05-24)

Of the 2 NEEDS-FIXTURE Modal-e2e scenarios deferred at the auto-commit-arc
follow-ups close (`5eade62f`):

- **No-cited-bill payment scenario — [PASS, closes the item / re-skipped as N=2
  on the bill-candidate finding].** Synthetic fixture (no-dep PDF generator) +
  corpus regression entry (`source:'synthetic'`) + harness extensions
  (`getBillsByVendor` / `getPaymentsByVendor`) + scenario body unskipped + paid
  Modal-e2e. [PASS: assertion lines up — Branch 2 attach_payment_evidence →
  proposal_id=null.] [Re-skip: the no-payment-candidate failure is the same
  Stage 6 matching weakness the 2026-05-24 finding documents → N=2, no new arc.]
- **Born-paid bundle scenario — DEFERRED as `[NEEDS-FIX]`, not run.** Grounding
  surfaced 3 confirmed sub-findings (friction-journal 2026-05-24) that render
  born-paid non-functional at v1: 2 structurally-dead branches in
  `isBornPaidBundleCandidate` (schema gaps in the receipt + vendor_invoice
  extractors) + a deterministic field-name + type mismatch in
  `buildBornPaidBundle` (proposalBuilder.ts:136,152 reads `extractedFields.amount`
  as string; the schema emits `payment_amount` as number). Fixture + scenario
  body + corpus entry shipped as durable infra; the `it.skip` is `[NEEDS-FIX]`.
  Did NOT spend paid Modal $ (failure statically proven).

The original §3 framing scoped born-paid as a fixture-availability problem. This
grounding closes that framing: the feature is non-functional independent of
fixture availability. **Born-paid bundle fix is now the named next arc**,
alongside the bill-candidate matching investigation.

Open carry-forwards after this session:
- bill-candidate matching investigation [N=2 if Scenario 1 re-skipped]
- born-paid bundle fix (the 3-sub-finding entry) — likely a 1–2 commit arc
- Tier C extract robustness (still N=1 [or N=2 + codified if it fired])
```

- [ ] **Step 3: COMMIT 2**

Run:
```bash
git add apps/web/tests/integration/e2e/ingestPipelineHarness.ts \
        apps/web/tests/integration/e2e/documentPipeline.paymentConfirmation.e2e.test.ts \
        docs/07_governance/friction-journal.md \
        docs/07_governance/retrospectives/phase-8-retrospective.md
COORD_SESSION='needs-fixture-closeout' git commit -m "$(cat <<'EOF'
test(modal-e2e-closeout): harness helpers + scenario bodies + governance

getBillsByVendor / getPaymentsByVendor harness helpers. Scenario 1
(no-cited-bill payment) unskipped + [PASS / re-skipped N=2 per disposition].
Scenario 2 (born-paid) body written, left it.skip [NEEDS-FIX] — feature is
non-functional at v1 (2 dead branches + deterministic buildBornPaidBundle
amount/payment_amount mismatch; no paid run, failure statically proven).

Friction-journal entry (born-paid non-functionality, WRONG-dominant + 2 NOTE
schema gaps). Phase 8 retrospective NEEDS-FIXTURE closeout subsection; born-paid
bundle fix named as next arc.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## COMMIT 3 — outcome doc

## Task 11: Outcome doc

**Files:**
- Create: `docs/09_briefs/phase-8/2026-05-24-needs-fixture-closeout.md`

- [ ] **Step 1: Write the outcome doc**

Create `docs/09_briefs/phase-8/2026-05-24-needs-fixture-closeout.md`, modeled on `2026-05-24-modal-e2e-followup.md`. Fill the bracketed outcome from the Task 8 disposition. Include the Branch-2 positive-evidence side-finding (per founder direction, this lives in the outcome doc only — not a friction-journal addendum):
```markdown
# Modal-e2e NEEDS-FIXTURE closeout (2026-05-24)

Carry-forward from the auto-commit-arc follow-ups closeout (`5eade62f`). Closes
the 2 `[NEEDS FIXTURE]` scenarios asymmetrically. Spec:
`2026-05-24-needs-fixture-closeout-spec.md`.

## What was run

- Synthetic fixtures generated (no-dep PDF writer): `payment_no_cited_bill.pdf`,
  `born_paid_invoice.pdf`. Captured via the new `LABELS` filter (paid Modal OCR);
  sanitized into `corpus.sanitized.ts` under a new `source:'synthetic'` tag.
- Scenario 1 (no-cited-bill payment): unskipped + paid Modal-e2e.
- Scenario 2 (born-paid): body built as durable infra, left `it.skip [NEEDS-FIX]`,
  no paid run.

**Why Scenario 1 had better odds than the prior (re-skipped) bill scenarios:**
`buildPaymentConfirmationProposal` Branch 2 (no cited bill + matched candidate)
is **not threshold-gated** — it routes on any non-null candidate, including the
0.25-confidence kind the 2026-05-24 run produced. And the payment→payment
candidate emission path is the same one that already fired in that run (the
receipt→payment candidate at 0.25), unlike the bill-candidate path that never
emitted. So a payment-candidate against the seeded payment was the
better-grounded bet.

## What happened

- Scenario 1: [PASS — committed, proposal_id=null, item closed / re-skipped:
  no payment-candidate emitted on real OCR → N=2 on the bill-candidate finding].
- Scenario 2: not run; `[NEEDS-FIX]` (born-paid non-functional at v1 — see below).
- Paid cost (actual): [$X.XX capture + $Y.YY e2e].

## What we learned

Born-paid is non-functional at v1: 2 structurally-dead branches
(`isBornPaidBundleCandidate` receipt + vendor_invoice — schema gaps) + a
deterministic `buildBornPaidBundle` field-name/type mismatch
(`amount` string vs `payment_amount` number). Friction-journal 2026-05-24.
[If Tier C array-vs-object fired: N=2 → codified, see commit.]

## Disposition / carry-forwards

- Born-paid bundle fix — **named next arc** (1–2 commits).
- Bill-candidate matching investigation — open [N=2 if Scenario 1 re-skipped].
- Tier C extract robustness — N=1 [or N=2 + codified].
```

- [ ] **Step 2: COMMIT 3**

Run:
```bash
git add docs/09_briefs/phase-8/2026-05-24-needs-fixture-closeout.md
COORD_SESSION='needs-fixture-closeout' git commit -m "$(cat <<'EOF'
docs(phase-8): Modal-e2e NEEDS-FIXTURE closeout outcome doc

Outcome of the asymmetric 2-scenario closeout: Scenario 1 disposition,
born-paid [NEEDS-FIX] deferral, paid cost, carry-forwards. Folds in the
Branch-2-not-threshold-gated positive-evidence side-finding.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 12 (CONDITIONAL): Tier C array-vs-object codification

**Only if** Task 8 surfaced the Tier C top-level-array failure (N=2).

**Files:**
- Modify: the Tier C extract schema / normalization (defense-in-depth: prompt-side strengthening + schema-side `T | T[]` tolerance with normalization — exact files determined when the failure is observed)
- Modify: `docs/07_governance/friction-journal.md` (mark the 2026-05-23 Tier C entry N=2 + codification)

- [ ] **Step 1: Surface N=1 + N=2 evidence to the founder and confirm the defense-in-depth approach** (prompt + schema tolerance). Wait for direction.
- [ ] **Step 2: Implement the agreed fix with a test, run it, commit** as a single additional commit with the codification + the friction-journal N=2 mark. (Code-level TDD: write a test feeding a single-element array → expect normalization to the object; run red; implement; run green.)

---

## Session close

- [ ] **Step 1: Full verification**

Run:
```bash
pnpm typecheck && pnpm agent:validate && pnpm test
```
Expected: typecheck + validate green; `pnpm test` green with the routine count = **baseline + 2** (the 2 new `source:'synthetic'` corpus entries in the high-precision describe). **Report the EXACT observed pass/fail/skip count** — do not assert a predicted number in the close writeup beyond noting the grounded +2.

- [ ] **Step 2: Confirm tree state**

Run:
```bash
git status --short
git log --oneline origin/staging..HEAD
```
Expected: clean tree (no stray `corpus.partial.ts`, no staged PDFs); 3 (or 4 with Task 12) new commits ahead of `origin/staging`.

- [ ] **Step 3: Push to `origin/staging` (fast-forward)**

Run:
```bash
git push origin staging
```

- [ ] **Step 4: Surface to the founder**

Report: which scenario passed / re-skipped (with which finding); the born-paid `[NEEDS-FIX]` reframe + 3-sub-finding; actual combined paid cost; exact routine count shift; new open arcs (born-paid bundle fix = named next; bill-candidate investigation [N=2?]; Tier C robustness N=1 [or N=2+codified]).

- [ ] **Step 5: Release the session lock**

Run:
```bash
bash scripts/session-end.sh
```

---

## Self-review (plan author)

**Spec coverage:** every spec §5 in-scope item maps to a task — (1) PDF generator → Task 1; (2) LABELS filter → Task 3; (3) corpus + sanitized entries → Tasks 3+5; (4) harness helpers → Task 6; (5) Scenario 1 unskip + paid / Scenario 2 [NEEDS-FIX] → Tasks 7+8; (6) demo-dir .gitignore → Task 2; (7) friction-journal entry → Task 9; (8) retrospective amendment → Task 10; (9) outcome doc → Task 11. Paid gates → Tasks 4+8. Conditional Tier C codification → Task 12.

**Placeholder scan:** the only intentional fill-in-at-runtime spots are (a) the captured `lines` arrays in Task 5 Step 2 (cannot exist before the paid capture) and (b) the bracketed Scenario-1 outcome in Tasks 10/11 (depends on the paid run). Both are explicitly conditional, not vague placeholders. No "TBD"/"add error handling"/etc.

**Type consistency:** `source: 'demo' | 'founder' | 'synthetic'` widened in all three locations (capture-script `CorpusDoc` + emitted `RealOcrFixture` + committed `corpus.sanitized.ts` `RealOcrFixture`). Helper signatures (`getBillsByVendor` returns `amount_cad`; `getPaymentsByVendor` returns `amount`) match the verified table columns. Fixture filenames (`payment_no_cited_bill.pdf`, `born_paid_invoice.pdf`) consistent across generator, CORPUS entries, and scenario `runIngestPipeline(...)` calls. `REAL_OCR_CORPUS_PARTIAL` (fragment) vs `REAL_OCR_CORPUS` (committed) kept distinct.

**Spec deviation flagged:** spec §Step 4 tagged the new entries `source:'demo'`; this plan uses `source:'synthetic'` to avoid the forced-match `demo calibration` describe (which would fail an abstaining born-paid fixture) and to make the count deterministically +2. This is a correctness refinement consistent with the spec's intent (a passing suite); surfaced to the founder at handoff.
