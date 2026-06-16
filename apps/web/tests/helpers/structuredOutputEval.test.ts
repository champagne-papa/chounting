import { describe, it, expect } from 'vitest';
import {
  deriveStructuredSchema,
  SUPPORTED_FORMATS,
  ocrTextHash,
  buildUserMessage,
  stripFences,
  makeReplayExtractor,
  PER_TYPE_CONFIG,
  type CaptureFixture,
} from './structuredOutputEval';
import { scoreExtraction, SCORED_FIELDS } from './extractionEval';

describe('deriveStructuredSchema', () => {
  it('recurses (nested items get additionalProperties:false) and makes properties required-nullable', () => {
    const s = deriveStructuredSchema(PER_TYPE_CONFIG.vendor_invoice.schema) as {
      additionalProperties?: boolean;
      required?: string[];
      properties: Record<string, { type?: unknown; items?: { additionalProperties?: boolean } }>;
    };
    expect(s.additionalProperties).toBe(false);
    // required-nullable: every property is listed in `required`
    expect([...(s.required ?? [])].sort()).toEqual(Object.keys(s.properties).sort());
    // a scalar property is nullable (type widened to include 'null')
    expect(s.properties.amount.type).toEqual(['number', 'null']);
    // recursion still reaches nested array items
    expect(s.properties.line_items.items?.additionalProperties).toBe(false);
  });
  it('vendor STRUCTURED schema (what is actually sent) drops the unscored line_items', () => {
    const s = JSON.stringify(deriveStructuredSchema(PER_TYPE_CONFIG.vendor_invoice.structuredSchema));
    expect(s).not.toContain('line_items');
  });
  it('strips $schema and emits no unsupported numeric/string constraints', () => {
    const s = JSON.stringify(deriveStructuredSchema(PER_TYPE_CONFIG.receipt.structuredSchema));
    expect(s).not.toContain('$schema');
    expect(s).not.toMatch(/"(minimum|maximum|minLength|maxLength|multipleOf)"/);
  });
  it('derives all three prod schemas without throwing', () => {
    for (const t of ['vendor_invoice', 'receipt', 'payment_confirmation'] as const) {
      expect(() => deriveStructuredSchema(PER_TYPE_CONFIG[t].structuredSchema)).not.toThrow();
    }
  });
  it('is provably API-clean across all three schemas (no unsupported constraint/format leak)', () => {
    const BAD = /"(minimum|maximum|exclusiveMinimum|exclusiveMaximum|multipleOf|minLength|maxLength|minItems|maxItems|uniqueItems)"/;
    for (const t of ['vendor_invoice', 'receipt', 'payment_confirmation'] as const) {
      const s = JSON.stringify(deriveStructuredSchema(PER_TYPE_CONFIG[t].structuredSchema));
      expect(s, `${t}: unsupported constraint leaked`).not.toMatch(BAD);
      expect(s, `${t}: $ref/$schema leaked`).not.toMatch(/"\$(ref|schema)"/);
      for (const f of [...s.matchAll(/"format":"([^"]+)"/g)].map((m) => m[1])) {
        expect(SUPPORTED_FORMATS.has(f), `${t}: unsupported format ${f}`).toBe(true);
      }
    }
  });
});

describe('ocrTextHash', () => {
  it('is deterministic and 64 hex chars', () => {
    expect(ocrTextHash('abc')).toBe(ocrTextHash('abc'));
    expect(ocrTextHash('abc')).toMatch(/^[0-9a-f]{64}$/);
  });
});

describe('buildUserMessage', () => {
  it('mirrors the prod template verbatim', () => {
    expect(buildUserMessage('receipt', 'LINE')).toBe(
      'OCR text for receipt document:\n\nLINE\n\nReturn the JSON object per the extraction schema. JSON only — no markdown fences.',
    );
  });
});

describe('makeReplayExtractor', () => {
  const fixture: CaptureFixture = {
    [ocrTextHash('OCRTEXT')]: {
      label: 'x', expectedType: 'vendor_invoice',
      freetext: { raw: '{"amount": 10}', stop_reason: 'end_turn', usage: { input_tokens: 1, output_tokens: 1 }, stamp: 's' },
      structured: { raw: '```json\n{"amount": 20}\n```', stop_reason: 'end_turn', usage: { input_tokens: 1, output_tokens: 1 }, stamp: 's' },
    },
  };
  it('parses raw, strips fences', () => {
    expect(makeReplayExtractor(fixture, 'freetext')('OCRTEXT')).toEqual({ amount: 10 });
    expect(makeReplayExtractor(fixture, 'structured')('OCRTEXT')).toEqual({ amount: 20 });
  });
  it('returns {} on miss, parse failure, and non-object JSON (array/scalar/null)', () => {
    expect(makeReplayExtractor(fixture, 'freetext')('MISSING')).toEqual({});
    const mk = (raw: string): CaptureFixture => ({
      [ocrTextHash('B')]: {
        ...fixture[ocrTextHash('OCRTEXT')],
        freetext: { raw, stop_reason: 'max_tokens', usage: { input_tokens: 1, output_tokens: 1 }, stamp: 's' },
      },
    });
    for (const raw of ['not json', '[1,2]', '42', '"str"', 'null']) {
      expect(makeReplayExtractor(mk(raw), 'freetext')('B'), `raw=${raw}`).toEqual({});
    }
  });
});

describe('stripFences', () => {
  it('removes ```json fences', () => {
    expect(stripFences('```json\n{"a":1}\n```')).toBe('{"a":1}');
  });
});

// The crux of "required-nullable is scope-preserving" (advisor): a field
// emitted as null must replay AND score identically to an omitted field for the
// scored scalars — else required-nullable would distort the metric.
describe('null scores identically to absent (scope-preserving)', () => {
  const mk = (raw: string): CaptureFixture => ({
    [ocrTextHash('K')]: {
      label: 'k',
      expectedType: 'vendor_invoice',
      freetext: { raw, stop_reason: 'end_turn', usage: { input_tokens: 1, output_tokens: 1 }, stamp: 's' },
      structured: { raw, stop_reason: 'end_turn', usage: { input_tokens: 1, output_tokens: 1 }, stamp: 's' },
    },
  });
  it('null and omitted yield an identical DocScore for the scored fields', () => {
    const truth = { amount: 100, currency: 'CAD' };
    const withNull = makeReplayExtractor(mk('{"amount": null, "currency": "CAD"}'), 'structured')('K');
    const omitted = makeReplayExtractor(mk('{"currency": "CAD"}'), 'structured')('K');
    // replay keeps the null value (not dropped)
    expect(withNull).toEqual({ amount: null, currency: 'CAD' });
    const sNull = scoreExtraction(withNull, truth, SCORED_FIELDS.vendor_invoice);
    const sOmit = scoreExtraction(omitted, truth, SCORED_FIELDS.vendor_invoice);
    expect(sNull).toEqual(sOmit); // byte-identical tally
    expect(sNull.fields.find((f) => f.field === 'amount')?.populated).toBe(false);
  });
});
