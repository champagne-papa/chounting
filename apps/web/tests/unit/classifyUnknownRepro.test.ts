// tests/unit/classifyUnknownRepro.test.ts
//
// Board-#3 — pure repro-runner logic. No DB, no AI: the discriminating tally +
// the repro-or-drop verdict, pinned independently of the live runner.

import { describe, it, expect } from 'vitest';
import {
  tallyByReason,
  selectUnknownRows,
  reproVerdict,
} from '../helpers/classifyUnknownRepro';

describe('tallyByReason — the discriminating query, in-memory', () => {
  it('counts rows per exception_reason', () => {
    expect(
      tallyByReason([
        { exception_reason: 'unmatched_router_candidate' },
        { exception_reason: 'unmatched_router_candidate' },
        { exception_reason: 'unknown_document_type' },
      ]),
    ).toEqual({ unmatched_router_candidate: 2, unknown_document_type: 1 });
  });
  it('empty input → empty tally', () => {
    expect(tallyByReason([])).toEqual({});
  });
});

describe('selectUnknownRows', () => {
  it('keeps only unknown_document_type rows', () => {
    const rows = [
      { exception_reason: 'unknown_document_type', document_case_id: 'a' },
      { exception_reason: 'unmatched_router_candidate', document_case_id: 'b' },
    ];
    expect(selectUnknownRows(rows)).toEqual([rows[0]]);
  });
  it('grounded-today prod state: 4 unmatched_router_candidate → empty repro set', () => {
    const rows = Array.from({ length: 4 }, () => ({
      exception_reason: 'unmatched_router_candidate',
    }));
    expect(selectUnknownRows(rows)).toHaveLength(0);
  });
});

describe('reproVerdict — repro-or-drop', () => {
  it('still unknown → repro (genuine unknown on a legible doc)', () => {
    expect(reproVerdict('unknown')).toBe('repro');
  });
  it('now a real type → drop (the unknown did not reproduce)', () => {
    expect(reproVerdict('vendor_invoice')).toBe('drop');
    expect(reproVerdict('receipt')).toBe('drop');
  });
});
