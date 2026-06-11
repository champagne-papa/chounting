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
