// tests/unit/extractionEval.test.ts
//
// Wave 5 D1 — unit tests for the pure scoreExtraction logic. Controlled inputs
// (no corpus, no extractor) so the coverage-vs-correctness semantics are pinned
// independently of the real Tier-A baseline.

import { describe, it, expect } from 'vitest';
import {
  scoreExtraction,
  aggregate,
  coverage,
  correctness,
  valuesMatch,
  runExtractionEval,
} from '../helpers/extractionEval';
import type { ExtractionFn, EvalCorpusDoc, GroundTruth } from '../helpers/extractionEval';

const FIELDS = ['amount', 'currency', 'vendor_invoice_number'];

describe('valuesMatch — type-aware equality', () => {
  it('numeric: "$1,433.25" matches 1433.25', () => {
    expect(valuesMatch('$1,433.25', 1433.25)).toBe(true);
    expect(valuesMatch(1433.25, '1433.25')).toBe(true);
  });
  it('string: case-insensitive + trimmed', () => {
    expect(valuesMatch('AMEX', 'amex')).toBe(true);
    expect(valuesMatch('  CAD ', 'cad')).toBe(true);
  });
  it('mismatch: different numbers / strings', () => {
    expect(valuesMatch(68.25, 1433.25)).toBe(false);
    expect(valuesMatch('Invoice', '1ABCD23M-0001')).toBe(false);
  });
});

describe('scoreExtraction — absent ≠ wrong', () => {
  it('a present field Tier A did NOT populate is a coverage gap, not an error', () => {
    const s = scoreExtraction(
      { amount: 100 }, // currency + invoice_number absent
      { amount: 100, currency: 'CAD', vendor_invoice_number: 'X1' },
      FIELDS,
    );
    expect(s.trulyPresent).toBe(3);
    expect(s.populated).toBe(1);
    expect(s.covered).toBe(1); // only amount covered
    expect(s.correct).toBe(1); // amount correct
    // currency/invoice_number: present but not populated → not correctness misses
    const currency = s.fields.find((f) => f.field === 'currency')!;
    expect(currency.present).toBe(true);
    expect(currency.populated).toBe(false);
    expect(currency.correct).toBe(false);
  });

  it('a populated WRONG value is a correctness miss (not a coverage gap)', () => {
    const s = scoreExtraction(
      { amount: 68.25 }, // wrong (truth 1433.25)
      { amount: 1433.25 },
      FIELDS,
    );
    expect(s.populated).toBe(1);
    expect(s.covered).toBe(1); // present AND populated
    expect(s.correct).toBe(0); // populated but wrong
  });

  it('a populated field NOT truly present is spurious: hurts correctness, not coverage', () => {
    const s = scoreExtraction(
      { currency: 'CAD' }, // truth has no currency
      { amount: 100 },
      FIELDS,
    );
    expect(s.trulyPresent).toBe(1); // only amount
    expect(s.populated).toBe(1); // currency
    expect(s.covered).toBe(0); // currency not present → not covered
    expect(s.correct).toBe(0); // spurious → not correct
  });
});

describe('aggregate / coverage / correctness', () => {
  it('coverage = covered/trulyPresent, correctness = correct/populated', () => {
    const a = scoreExtraction({ amount: 100 }, { amount: 100, currency: 'CAD' }, FIELDS);
    const b = scoreExtraction({ amount: 5 }, { amount: 10 }, FIELDS); // wrong
    const t = aggregate([a, b]);
    expect(t).toEqual({ trulyPresent: 3, populated: 2, covered: 2, correct: 1 });
    expect(coverage(t)).toBeCloseTo(2 / 3);
    expect(correctness(t)).toBeCloseTo(1 / 2);
  });

  it('correctness is vacuously 1 when nothing populated', () => {
    const s = scoreExtraction({}, { amount: 100 }, FIELDS);
    expect(correctness(aggregate([s]))).toBe(1);
    expect(coverage(aggregate([s]))).toBe(0);
  });
});

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
