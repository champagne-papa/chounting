// tests/integration/classifierRealOcr.integration.test.ts
//
// Phase 8 dedicated-fix-chunk Task 5/6 — real-OCR corpus regression +
// overfit guard. Runs the captured real PaddleOCR line-text (3 Session-68
// demo docs + founder-supplied docs from different vendors/formats) through
// the Tier A classifier and asserts the high-precision property:
//
//   - A Tier A match MUST be the correct type (never a misclassification).
//   - A no-match is acceptable: it routes to Tier C (low-recall by design).
//   - The 3 demo docs (the calibration set) MUST classify correctly via Tier A.
//
// Per Session 70 brief §1.3 overfit guard: if a real doc MISCLASSIFIES,
// that is the guard firing — stop-surface-explain, do NOT pre-tune.

import { describe, it, expect } from 'vitest';
import { evaluateTierA } from '@/agent/orchestrator/extraction/classifier/tierCoordination';
import type { DocumentArtifactRow } from '@/agent/orchestrator/extraction/types';
import { REAL_OCR_CORPUS } from '../fixtures/classifier/real-ocr/corpus';

function artifactWithLines(textLines: string[]): DocumentArtifactRow {
  return {
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
  };
}

describe('Phase 8 dedicated-fix-chunk Task 5 — real-OCR corpus', () => {
  it('every corpus doc has captured OCR line-text (no capture errors)', () => {
    expect(REAL_OCR_CORPUS.length).toBeGreaterThanOrEqual(10);
    for (const f of REAL_OCR_CORPUS) {
      expect(f.captureError, `${f.label} captureError`).toBeUndefined();
      expect(f.lines.length, `${f.label} line count`).toBeGreaterThan(0);
    }
  });

  it('Tier A verdict summary (diagnostic; always passes)', () => {
    const rows = REAL_OCR_CORPUS.map((f) => {
      const v = evaluateTierA(artifactWithLines(f.lines));
      return {
        label: f.label,
        source: f.source,
        expected: f.expectedType,
        verdict: v.matched ? v.documentType : 'NO-MATCH (→ Tier C)',
        outcome: v.matched
          ? v.documentType === f.expectedType
            ? 'correct'
            : 'MISCLASSIFIED'
          : 'abstain',
      };
    });
    // eslint-disable-next-line no-console
    console.table(rows);
    expect(rows.length).toBe(REAL_OCR_CORPUS.length);
  });

  describe('high-precision: a Tier A match must be the correct type (never misclassify)', () => {
    for (const f of REAL_OCR_CORPUS) {
      it(`${f.label} (${f.source}, expect ${f.expectedType})`, () => {
        const v = evaluateTierA(artifactWithLines(f.lines));
        if (v.matched) {
          // The precision guard: a confident Tier A match must be right.
          expect(v.documentType).toBe(f.expectedType);
        }
        // A no-match abstains to Tier C — acceptable low-recall behavior.
      });
    }
  });

  describe('demo calibration set classifies correctly via Tier A', () => {
    for (const f of REAL_OCR_CORPUS.filter((d) => d.source === 'demo')) {
      it(`${f.label} → ${f.expectedType}`, () => {
        const v = evaluateTierA(artifactWithLines(f.lines));
        expect(v.matched).toBe(true);
        if (v.matched) expect(v.documentType).toBe(f.expectedType);
      });
    }
  });
});
