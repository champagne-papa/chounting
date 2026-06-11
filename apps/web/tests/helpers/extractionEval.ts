// tests/helpers/extractionEval.ts
//
// Wave 5 D1 — pure scoring logic for the no-AI Tier-A extraction eval harness.
// No I/O, no AI, no DB. Coverage vs correctness are kept SEPARATE (absent ≠
// wrong): every extraction field is `.optional()` (schema header: "extractor
// attempts extraction but absence is valid"), so a missing field is a coverage
// gap, never a correctness error.
//
//   coverage    = (scored fields the doc truly has AND Tier A populated)
//                 / (scored fields the doc truly has)
//   correctness = (Tier A populated fields whose value matches ground truth)
//                 / (Tier A populated fields)
//
// A field Tier A populates that the doc does NOT truly have is a spurious
// extraction: it counts against correctness (populated, not correct) and not
// toward coverage.
//
// SCORED_FIELDS is the Tier-A-producible subset per type (Wave 5 plan §3
// three-way taxonomy). Tier-C(AI)-only fields and downstream-resolved fields
// (incl. vendor_id, §7 matcher-gap) are intentionally NOT scored here.

import { extractOcrText } from '@/agent/orchestrator/extraction/classifier/extractOcrText';
import type { DocumentArtifactRow } from '@/agent/orchestrator/extraction/types';

export type DocumentType =
  | 'vendor_invoice'
  | 'receipt'
  | 'payment_confirmation';

export const SCORED_FIELDS: Record<DocumentType, string[]> = {
  vendor_invoice: [
    'amount',
    'currency',
    'vendor_invoice_number',
    'accounting_date',
    'due_date',
  ],
  receipt: ['total', 'subtotal', 'date', 'payment_method', 'last_4', 'currency'],
  payment_confirmation: [
    'payment_amount',
    'payment_date',
    'payment_reference',
    'payment_method',
    'currency',
  ],
};

// field -> expected value; a field ABSENT from the record means the document
// does not truly contain that scored field (so it is not in the coverage
// denominator, and a Tier-A populate of it is a spurious extraction).
export type GroundTruth = Record<string, string | number>;

export interface FieldScore {
  field: string;
  present: boolean; // truly in the document (= key present in ground truth)
  populated: boolean; // Tier A emitted a value
  correct: boolean; // populated AND present AND value matches ground truth
}

export interface DocScore {
  fields: FieldScore[];
  trulyPresent: number;
  populated: number;
  covered: number; // present AND populated  (coverage numerator)
  correct: number; // populated AND correct  (correctness numerator)
}

export interface AggregateTally {
  trulyPresent: number;
  populated: number;
  covered: number;
  correct: number;
}

/** Parse a money/number-ish value to a number, else null. */
function toNum(v: unknown): number | null {
  if (typeof v === 'number') return Number.isNaN(v) ? null : v;
  if (typeof v === 'string') {
    const cleaned = v.replace(/[$,\s]/g, '');
    if (/^-?\d+(\.\d+)?$/.test(cleaned)) return Number(cleaned);
  }
  return null;
}

/**
 * Type-aware value equality: numeric compare when both sides are number-ish
 * (handles "$1,433.25" vs 1433.25), else trimmed case-insensitive string
 * compare (handles "AMEX" vs "amex", "CAD" vs "cad").
 */
export function valuesMatch(a: unknown, b: unknown): boolean {
  const na = toNum(a);
  const nb = toNum(b);
  if (na !== null && nb !== null) return na === nb;
  return String(a).trim().toLowerCase() === String(b).trim().toLowerCase();
}

function isPopulated(v: unknown): boolean {
  return v !== undefined && v !== null && !(typeof v === 'string' && v === '');
}

/** Score one document's Tier-A output against its ground truth. */
export function scoreExtraction(
  extracted: Record<string, unknown>,
  truth: GroundTruth,
  scoredFields: string[],
): DocScore {
  const fields: FieldScore[] = scoredFields.map((field) => {
    const present = Object.prototype.hasOwnProperty.call(truth, field);
    const populated = isPopulated(extracted[field]);
    const correct =
      populated && present && valuesMatch(extracted[field], truth[field]);
    return { field, present, populated, correct };
  });
  return {
    fields,
    trulyPresent: fields.filter((f) => f.present).length,
    populated: fields.filter((f) => f.populated).length,
    covered: fields.filter((f) => f.present && f.populated).length,
    correct: fields.filter((f) => f.correct).length,
  };
}

/** Sum doc scores into one tally. */
export function aggregate(scores: DocScore[]): AggregateTally {
  return scores.reduce<AggregateTally>(
    (acc, s) => ({
      trulyPresent: acc.trulyPresent + s.trulyPresent,
      populated: acc.populated + s.populated,
      covered: acc.covered + s.covered,
      correct: acc.correct + s.correct,
    }),
    { trulyPresent: 0, populated: 0, covered: 0, correct: 0 },
  );
}

/** coverage = covered / trulyPresent (0 when nothing is truly present). */
export function coverage(t: AggregateTally): number {
  return t.trulyPresent === 0 ? 0 : t.covered / t.trulyPresent;
}

/** correctness = correct / populated (1 when nothing populated — vacuously). */
export function correctness(t: AggregateTally): number {
  return t.populated === 0 ? 1 : t.correct / t.populated;
}

/**
 * Build the production OCR text from a corpus doc's `lines` by routing through
 * the real `extractOcrText` on a synthetic flat-line artifact (the canonical
 * PaddleOCR shape), so the harness sees exactly what production Tier A sees.
 */
export function ocrTextFromLines(textLines: string[]): string {
  const artifact = {
    engine: 'paddleocr',
    engine_version: '2.7.0',
    pages: { count: 1 },
    lines: textLines.map((text, idx) => ({
      text,
      bbox: [0, idx * 20, 100, (idx + 1) * 20],
      confidence: 0.95,
    })),
    words: { count: textLines.length * 3 },
    quality_flags: [],
    pipeline_trace: [],
    confidence: 0.95,
  } as unknown as DocumentArtifactRow;
  return extractOcrText(artifact);
}
