// tests/unit/evidenceCompleteness.test.ts
//
// ADR-0033 core/evidence pure rule (assessCompleteness). Descriptive
// completeness (OQ-6) from facet presence; no DB. "Complete" is general
// (all four facets), not the bill slice.

import { describe, it, expect } from 'vitest';
import { assessCompleteness } from '@/core/evidence/completeness';

describe('assessCompleteness — ADR-0033 core/evidence', () => {
  it('empty: no facets present', () => {
    const c = assessCompleteness({ documents: 0, extractions: 0, decisions: 0, approvals: 0 });
    expect(c.status).toBe('empty');
    expect(c.has_document).toBe(false);
    expect(c.has_extraction).toBe(false);
    expect(c.has_decision).toBe(false);
    expect(c.has_approval).toBe(false);
  });

  it('partial: some but not all facets present', () => {
    const c = assessCompleteness({ documents: 1, extractions: 0, decisions: 0, approvals: 0 });
    expect(c.status).toBe('partial');
    expect(c.has_document).toBe(true);
    expect(c.has_extraction).toBe(false);
  });

  it('complete: all four facets present', () => {
    const c = assessCompleteness({ documents: 2, extractions: 1, decisions: 1, approvals: 3 });
    expect(c.status).toBe('complete');
    expect(c.has_document && c.has_extraction && c.has_decision && c.has_approval).toBe(true);
  });

  it('partial: three of four present (not collapsed to complete)', () => {
    const c = assessCompleteness({ documents: 1, extractions: 1, decisions: 1, approvals: 0 });
    expect(c.status).toBe('partial');
  });
});
