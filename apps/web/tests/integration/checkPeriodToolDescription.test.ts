// tests/integration/checkPeriodToolDescription.test.ts
// CA-85: checkPeriodTool.description includes the null-recovery
// instruction with both locked-past and not-yet-created cases
// named, plus the UUID/dry-run-handle leak prohibition. Site 2
// of O3 (per docs/09_briefs/phase-1.2/session-8-c6-prereq-o3-
// agent-date-context.md §5.c).
//
// Phase A transcript verification was indeterminate (logs absent —
// see Phase E friction entry); the contingency text was applied
// per the strict-superset rationale (broader trigger clause is
// safe under any hypothesis). The contingency assertion below
// confirms the broader trigger phrasing is present.

import { describe, it, expect } from 'vitest';
import { checkPeriodTool } from '@/agent/tools/checkPeriod';

describe('CA-85: checkPeriod tool description', () => {
  it('includes the null-recovery instruction with both locked and not-created cases named', () => {
    const description = checkPeriodTool.description;

    // Trigger clause references the actual return signal
    expect(description).toContain('returns null');

    // Contingency text — broader trigger applied per Phase A
    // indeterminate fallback (strict-superset logic).
    expect(description).toContain('or otherwise indicates the period is not available for posting');

    // Both ambiguous cases named
    expect(description).toContain('locked for posting');
    expect(description).toContain('has not yet been created');

    // Year-end framing as the typical not-yet-created cause
    expect(description).toContain('year-end');

    // Recovery action — reconsider date inference first
    expect(description).toContain('reconsider whether the date you inferred is correct');
    expect(description).toContain('the Current date above');

    // Output discipline — broadened ID-leak prohibition
    expect(description).toContain('never ask for or display internal IDs, UUIDs, or dry-run handles');
  });
});
