// tests/integration/extractionAccuracy.integration.test.ts
//
// Wave 5 D1 — no-AI Tier-A extraction accuracy harness over the real-OCR
// corpus. Fixture-offline: each corpus doc's `lines` → extractOcrText (the
// production OCR-text assembly) → the named no-AI Tier-A entrypoint → scored
// against human ground truth. NO adminClient, NO DB read, NO live AI call.
//
// Posture (Wave 5 plan §D1, option A): the Tier-A baseline is measurably poor
// on real OCR — that is the eval FINDING, recorded, not pre-tuned. So this
// suite does NOT assert an absolute accuracy floor (which would rubber-stamp a
// poor baseline or sit permanently red). Instead:
//   - the REAL TEETH are structural invariants (determinism; well-formed
//     scoring; NO live-AI path; NO adminClient path);
//   - a harness-computed regression SNAPSHOT (BASELINE_TALLY) is a
//     one-directional ratchet — any drift up or down fails until re-frozen.
//
// Thesis note: a poor automated no-AI Tier-A baseline does NOT contradict "the
// system runs without the AI." The load-bearing non-AI guarantee is the human
// manual route (form/API producers in the ADR-0031 registry) — a human can
// post/correct with no AI. The precise finding: automated no-AI EXTRACTION is
// low-quality on real OCR ⇒ no-AI mode leans on human manual entry/correction,
// and Tier-C(AI) carries automated quality. This reinforces Wave 6 (the human
// review/approve→post UI is where poor extraction gets corrected) and feeds the
// §7 matcher-gap.

import { describe, it, expect, vi } from 'vitest';

// Cautionary-tale teeth: the eval suite must NEVER reach the live-AI fallback
// or an RLS-bypassing client. Mock both to THROW — the suite passing proves no
// path touched them. (The extractor modules import runAiExtractFallback at top
// level; the Tier-A entrypoints never call it, so these mocks never fire here.)
vi.mock('@/agent/orchestrator/extraction/aiFallbackExtractorBase', () => ({
  runAiExtractFallback: () => {
    throw new Error(
      'Wave 5 D1: the live-AI (Tier C) path must NOT be reachable from the eval suite',
    );
  },
}));
vi.mock('@/db/adminClient', () => ({
  adminClient: () => {
    throw new Error(
      'Wave 5 D1: the eval harness must NOT open an adminClient / persisted-read path',
    );
  },
}));

import { extractVendorInvoiceFieldsTierA } from '@/agent/orchestrator/extraction/vendorInvoiceExtractor';
import { extractReceiptFieldsTierA } from '@/agent/orchestrator/extraction/receiptExtractor';
import { extractPaymentConfirmationFieldsTierA } from '@/agent/orchestrator/extraction/paymentConfirmationExtractor';
import { REAL_OCR_CORPUS } from '../fixtures/classifier/real-ocr/corpus.sanitized';
import {
  EXTRACTION_GROUND_TRUTH,
  BASELINE_TALLY,
} from '../fixtures/extraction/extractionGolden';
import {
  SCORED_FIELDS,
  scoreExtraction,
  aggregate,
  coverage,
  correctness,
  ocrTextFromLines,
  type DocumentType,
  type DocScore,
  type AggregateTally,
} from '../helpers/extractionEval';

const TYPES: DocumentType[] = [
  'vendor_invoice',
  'receipt',
  'payment_confirmation',
];

function tierAFor(type: DocumentType, ocrText: string): Record<string, unknown> {
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
}

// Score the whole corpus once; group doc scores by type.
function scoreCorpus(): Record<DocumentType, DocScore[]> {
  const byType: Record<DocumentType, DocScore[]> = {
    vendor_invoice: [],
    receipt: [],
    payment_confirmation: [],
  };
  for (const f of REAL_OCR_CORPUS) {
    const type = f.expectedType as DocumentType;
    const ocrText = ocrTextFromLines(f.lines);
    const extracted = tierAFor(type, ocrText);
    const truth = EXTRACTION_GROUND_TRUTH[f.label] ?? {};
    byType[type].push(scoreExtraction(extracted, truth, SCORED_FIELDS[type]));
  }
  return byType;
}

describe('Wave 5 D1 — no-AI Tier-A extraction accuracy harness', () => {
  it('DIAGNOSTIC: per-type coverage / correctness over the corpus', () => {
    const byType = scoreCorpus();
    const rows = TYPES.map((t) => {
      const tally = aggregate(byType[t]);
      return {
        type: t,
        docs: byType[t].length,
        trulyPresent: tally.trulyPresent,
        populated: tally.populated,
        covered: tally.covered,
        correct: tally.correct,
        coverage: `${(coverage(tally) * 100).toFixed(0)}%`,
        correctness: `${(correctness(tally) * 100).toFixed(0)}%`,
      };
    });
    // eslint-disable-next-line no-console
    console.table(rows);
    // OBSERVED TALLY block — copy into BASELINE_TALLY to (re)freeze the snapshot.
    const observed: Record<string, AggregateTally> = {};
    for (const t of TYPES) observed[t] = aggregate(byType[t]);
    // eslint-disable-next-line no-console
    console.log('OBSERVED TALLY =', JSON.stringify(observed));
    expect(rows.length).toBe(TYPES.length);
  });

  // ---- structural invariants (the real teeth) ----

  it('no live-AI path: Tier-A entrypoints are synchronous (a live-AI path would be async)', () => {
    const r1 = extractVendorInvoiceFieldsTierA('Invoice # INV-1\nTotal: $10.00');
    const r2 = extractReceiptFieldsTierA('Total: $10.00\n2025-01-01');
    const r3 = extractPaymentConfirmationFieldsTierA('Amount: $10.00');
    for (const r of [r1, r2, r3]) {
      expect(r instanceof Promise).toBe(false);
      expect(typeof r).toBe('object');
    }
  });

  it('deterministic + pure: scoring the corpus twice yields identical tallies', () => {
    const a = TYPES.map((t) => aggregate(scoreCorpus()[t]));
    const b = TYPES.map((t) => aggregate(scoreCorpus()[t]));
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });

  it('well-formed scoring: covered ≤ trulyPresent, correct ≤ populated, non-negative', () => {
    const byType = scoreCorpus();
    for (const t of TYPES) {
      const tally = aggregate(byType[t]);
      expect(tally.covered).toBeLessThanOrEqual(tally.trulyPresent);
      expect(tally.correct).toBeLessThanOrEqual(tally.populated);
      for (const v of Object.values(tally)) expect(v).toBeGreaterThanOrEqual(0);
      expect(coverage(tally)).toBeGreaterThanOrEqual(0);
      expect(coverage(tally)).toBeLessThanOrEqual(1);
      expect(correctness(tally)).toBeGreaterThanOrEqual(0);
      expect(correctness(tally)).toBeLessThanOrEqual(1);
    }
  });

  it('label hygiene: every ground-truth field is a SCORED field for its type', () => {
    for (const f of REAL_OCR_CORPUS) {
      const type = f.expectedType as DocumentType;
      const truth = EXTRACTION_GROUND_TRUTH[f.label];
      expect(truth, `missing ground truth for ${f.label}`).toBeDefined();
      for (const field of Object.keys(truth ?? {})) {
        expect(
          SCORED_FIELDS[type],
          `${f.label}: '${field}' not in SCORED_FIELDS[${type}]`,
        ).toContain(field);
      }
    }
  });

  // ---- regression snapshot (one-directional ratchet) ----

  it('regression ratchet: per-type tally exactly matches the frozen baseline', () => {
    const byType = scoreCorpus();
    for (const t of TYPES) {
      const tally = aggregate(byType[t]);
      expect(
        tally,
        `${t} tally drifted from BASELINE_TALLY — if intended (e.g. Wave-6 ` +
          `hardening), re-freeze the snapshot in the same commit with a why.`,
      ).toEqual(BASELINE_TALLY[t]);
    }
  });
});
