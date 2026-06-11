/**
 * Phase 8 dedicated-fix-chunk Task 5 — real-OCR fixture corpus capture.
 *
 * OCRs the real-OCR corpus (3 Session-68 demo docs + founder-supplied
 * docs) against the real Modal sidecar via invokeSidecar (OCR only — no
 * DB seeding, no classification, no pipeline) and emits the captured
 * line-text into a committed TS fixture at
 * apps/web/tests/fixtures/classifier/real-ocr/corpus.ts.
 *
 * Per Session 70 brief §4 Task 5 §4.PI-2: capture from a Modal run. The
 * Session 71 db:reset wiped the Session 68 persisted artifacts, so we
 * re-OCR from the source files (deterministic for identical bytes).
 *
 * Invocation (from repo root):
 *   pnpm --filter @chounting/web exec tsx scripts/capture-real-ocr-fixtures.ts
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import * as crypto from 'node:crypto';

const SCRIPT_DIR = path.dirname(process.argv[1] ?? __filename ?? '');
const APP_WEB_DIR = path.resolve(SCRIPT_DIR, '..');

// Load apps/web/.env.local (tsx doesn't auto-load Next env files); src
// imports assert a strict env set at module load.
function loadEnvLocal(): void {
  const envPath = path.join(APP_WEB_DIR, '.env.local');
  const lines = fs.readFileSync(envPath, 'utf-8').split('\n');
  for (const raw of lines) {
    const line = raw.trim();
    if (!line || line.startsWith('#') || !line.includes('=')) continue;
    const eq = line.indexOf('=');
    const k = line.slice(0, eq).trim();
    const v = line.slice(eq + 1).trim();
    if (!(k in process.env)) process.env[k] = v;
  }
}
loadEnvLocal();

const DEMO_DIR = path.join(APP_WEB_DIR, 'tests', 'fixtures', 'document-pipeline-demo');
const DROP_DIR = path.join(APP_WEB_DIR, 'tests', 'fixtures', 'classifier', 'real-ocr', 'source-pdfs');
const OUT_PATH = path.join(APP_WEB_DIR, 'tests', 'fixtures', 'classifier', 'real-ocr', 'corpus.ts');

type ExpectedType = 'vendor_invoice' | 'receipt' | 'payment_confirmation';

interface CorpusDoc {
  label: string;
  expectedType: ExpectedType;
  source: 'demo' | 'founder' | 'synthetic';
  file: string; // absolute path
}

const CORPUS: CorpusDoc[] = [
  // Session 68 demo fixtures (the 3 the rules were tuned + validated on).
  { label: 'demo_figma_invoice', expectedType: 'vendor_invoice', source: 'demo', file: path.join(DEMO_DIR, 'vendor_invoice.pdf') },
  { label: 'demo_figma_receipt', expectedType: 'receipt', source: 'demo', file: path.join(DEMO_DIR, 'receipt.pdf') },
  { label: 'demo_zoho_payment', expectedType: 'payment_confirmation', source: 'demo', file: path.join(DEMO_DIR, 'payment_confirmation.pdf') },
  // Founder-supplied corpus expansion (different vendors/formats).
  { label: 'mattjanzen_invoice', expectedType: 'vendor_invoice', source: 'founder', file: path.join(DROP_DIR, 'MattJanzen_INV-000778_10312025_$1433.25_Invoice.pdf') },
  { label: 'amazon_invoice', expectedType: 'vendor_invoice', source: 'founder', file: path.join(DROP_DIR, 'Amazon_CA56SWET7X6I_12052025_$41.39_Invoice.pdf') },
  { label: 'adobe_invoice', expectedType: 'vendor_invoice', source: 'founder', file: path.join(DROP_DIR, 'Adobe_3295049836_12022025_$146.71_Invoice.pdf') },
  { label: 'delara_receipt', expectedType: 'receipt', source: 'founder', file: path.join(DROP_DIR, 'Delara_825590_03042026_$321.25_Receipt.pdf') },
  { label: 'bestbuy_receipt', expectedType: 'receipt', source: 'founder', file: path.join(DROP_DIR, 'BestBuy_12082025_263464558_$125.15_Receipt.pdf') },
  { label: 'mattjanzen_receipt', expectedType: 'receipt', source: 'founder', file: path.join(DROP_DIR, 'MattJanzen_INV-000778_10312025_$1433.25_Receipt.pdf') },
  { label: 'mattjanzen_payment', expectedType: 'payment_confirmation', source: 'founder', file: path.join(DROP_DIR, 'MattJanzen_INV-000778_10312025_$1433.25_Payment.png') },
  // Synthetic fixtures — Modal-e2e NEEDS-FIXTURE closeout (2026-05-24).
  // source:'synthetic' keeps them in the abstain-tolerant high-precision guard
  // and OUT of the forced-match demo-calibration block in
  // classifierRealOcr.integration.test.ts.
  { label: 'synthetic_no_cited_payment', expectedType: 'payment_confirmation', source: 'synthetic', file: path.join(DEMO_DIR, 'payment_no_cited_bill.pdf') },
  { label: 'synthetic_born_paid', expectedType: 'payment_confirmation', source: 'synthetic', file: path.join(DEMO_DIR, 'born_paid_invoice.pdf') },
];

async function main() {
  const { invokeSidecar } = await import('../src/agent/orchestrator/extraction/sidecar/client');

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

  const captured: Array<{ doc: CorpusDoc; lines: string[]; error?: string }> = [];
  for (const doc of targets) {
    const bytes = new Uint8Array(fs.readFileSync(doc.file));
    const content_hash = crypto.createHash('sha256').update(bytes).digest('hex');
    const trace_id = crypto.randomUUID();
    process.stdout.write(`OCR ${doc.label} (${doc.source}, ${path.extname(doc.file)})... `);
    // Retry transient timeouts (Modal cold-start can exceed the 60s
    // per-request timeout; the pipeline's withFailureClassification wrapper
    // retries — this standalone capture mirrors that).
    let lastErr = '';
    let done = false;
    for (let attempt = 1; attempt <= 4 && !done; attempt++) {
      try {
        const resp = await invokeSidecar({
          bytes,
          content_hash,
          ctx: { trace_id, caller: { user_id: null, system_actor: 'pipeline_orchestrator' }, org_id: '11111111-1111-1111-1111-111111111111' },
        } as never);
        const rawLines = (resp.artifact.lines as Array<{ text?: string }> | undefined) ?? [];
        const lines = rawLines.map((l) => (typeof l?.text === 'string' ? l.text : '')).filter((t) => t.length > 0);
        captured.push({ doc, lines });
        console.log(`${lines.length} lines${attempt > 1 ? ` (attempt ${attempt})` : ''}`);
        done = true;
      } catch (err) {
        lastErr = err instanceof Error ? `${err.name}: ${err.message}` : String(err);
      }
    }
    if (!done) {
      captured.push({ doc, lines: [], error: lastErr });
      console.log(`ERROR: ${lastErr}`);
    }
  }

  // Emit the fixture.
  const header = `// AUTO-GENERATED by apps/web/scripts/capture-real-ocr-fixtures.ts (Phase 8 Task 5).
// Real PaddleOCR line-text captured from the document-pipeline-demo set +
// founder-supplied real documents. Do not hand-edit; re-run the capture
// script to regenerate. The source PDFs/PNGs are git-ignored (real personal
// documents); only this captured line-text is committed.
//
// expectedType is the correct classification. The corpus test asserts Tier A
// returns expectedType OR abstains (no-match → Tier C); it must never return
// a different type (the high-precision / overfit guard).
`;
  const body = captured.map(({ doc, lines, error }) => {
    const lineLiterals = lines.map((l) => `    ${JSON.stringify(l)},`).join('\n');
    return `  {
    label: ${JSON.stringify(doc.label)},
    source: ${JSON.stringify(doc.source)},
    expectedType: ${JSON.stringify(doc.expectedType)},${error ? `\n    captureError: ${JSON.stringify(error)},` : ''}
    lines: [
${lineLiterals}
    ],
  },`;
  }).join('\n');

  const out = `${header}
export type RealOcrExpectedType =
  | 'vendor_invoice'
  | 'receipt'
  | 'payment_confirmation';

export interface RealOcrFixture {
  label: string;
  source: 'demo' | 'founder' | 'synthetic';
  expectedType: RealOcrExpectedType;
  captureError?: string;
  lines: string[];
}

export const REAL_OCR_CORPUS: RealOcrFixture[] = [
${body}
];
`;
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
  const failures = captured.filter((c) => c.error || c.lines.length === 0);
  if (failures.length > 0) {
    console.log(`\nWARNING: ${failures.length} doc(s) produced no lines / errored:`);
    for (const f of failures) console.log(`  - ${f.doc.label}: ${f.error ?? 'empty OCR'}`);
  }
}

main().catch((err) => {
  console.error('FATAL:', err);
  process.exit(1);
});
