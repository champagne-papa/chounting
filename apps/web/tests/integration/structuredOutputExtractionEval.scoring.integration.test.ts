// apps/web/tests/integration/structuredOutputExtractionEval.scoring.integration.test.ts
//
// Board #2 scoring (FREE, deterministic, CI-safe). Replays the committed
// capture fixture through the existing runExtractionEval and reports the
// per-type delta vs the frozen Tier-A BASELINE_TALLY. Report-only: a captured
// sample is "the score of that sample", not true accuracy — no equality freeze.
// Flags non-end_turn captures so truncation/refusal is not scored as a coverage
// miss. Skips until the fixture (produced by the paid capture run) exists.
import fs from 'fs';
import path from 'path';
import { describe, it, expect } from 'vitest';
import {
  runExtractionEval,
  aggregate,
  ocrTextFromLines,
  type DocumentType,
  type AggregateTally,
} from '../helpers/extractionEval';
import { REAL_OCR_CORPUS } from '../fixtures/classifier/real-ocr/corpus.sanitized';
import { EXTRACTION_GROUND_TRUTH, BASELINE_TALLY } from '../fixtures/extraction/extractionGolden';
import {
  makeReplayExtractor,
  ocrTextHash,
  type CaptureFixture,
} from '../helpers/structuredOutputEval';

const FIXTURE_PATH = path.resolve(
  process.cwd(),
  'tests/fixtures/extraction/structuredOutputCaptures.json',
);
const TYPES: DocumentType[] = ['vendor_invoice', 'receipt', 'payment_confirmation'];

function loadFixture(): CaptureFixture {
  return JSON.parse(fs.readFileSync(FIXTURE_PATH, 'utf8')) as CaptureFixture;
}

const FIXTURE_EXISTS = fs.existsSync(FIXTURE_PATH);

describe.skipIf(!FIXTURE_EXISTS)('board-#2 — structured-output scoring (free)', () => {
  const fixture = FIXTURE_EXISTS ? loadFixture() : ({} as CaptureFixture);
  const truthFor = (label: string) => EXTRACTION_GROUND_TRUTH[label] ?? {};

  it('every corpus doc has a captured entry', () => {
    for (const doc of REAL_OCR_CORPUS) {
      expect(
        fixture[ocrTextHash(ocrTextFromLines(doc.lines))],
        `missing capture for ${doc.label}`,
      ).toBeDefined();
    }
  });

  it('reports the three-column per-type delta (report-only, no ratchet)', () => {
    const freeByType = runExtractionEval(makeReplayExtractor(fixture, 'freetext'), REAL_OCR_CORPUS, truthFor);
    const structByType = runExtractionEval(makeReplayExtractor(fixture, 'structured'), REAL_OCR_CORPUS, truthFor);
    const fmt = (t: AggregateTally) => `cov ${t.covered}/${t.trulyPresent}  corr ${t.correct}/${t.populated}`;
    for (const t of TYPES) {
      console.log(
        `[${t}]\n  tierA(base): ${fmt(BASELINE_TALLY[t])}\n  freetext  : ${fmt(aggregate(freeByType[t]))}\n  structured: ${fmt(aggregate(structByType[t]))}`,
      );
    }
    // Loose, non-ratchet sanity: both replays scored EVERY corpus doc (a
    // coverage check on the eval process, not a freeze on the delta values).
    const scored = (byType: Record<DocumentType, unknown[]>) =>
      TYPES.reduce((n, t) => n + byType[t].length, 0);
    expect(scored(freeByType)).toBe(REAL_OCR_CORPUS.length);
    expect(scored(structByType)).toBe(REAL_OCR_CORPUS.length);
  });

  it('flags non-end_turn captures (refusal / truncation) instead of scoring them as misses', () => {
    const flagged = Object.values(fixture).flatMap((e) =>
      (['freetext', 'structured'] as const)
        .filter((v) => e[v].stop_reason !== 'end_turn')
        .map((v) => `${e.label}:${v}=${e[v].stop_reason}`),
    );
    if (flagged.length) {
      console.warn('board-#2 NON-end_turn captures (interpret with care, not coverage misses):', flagged);
    }
    expect(Array.isArray(flagged)).toBe(true); // report-only; never fails the build
  });
});
