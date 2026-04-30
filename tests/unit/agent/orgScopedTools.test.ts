// tests/unit/agent/orgScopedTools.test.ts
//
// LT-04 / QUALITY-006 drift check (S30; Path C arc).
//
// Asserts that the derived ORG_SCOPED_TOOLS Set in
// src/agent/tools/orgScopedTools.ts is equal to the filter result
// over the tool registry's `gatedByDispatcherSet` flag. Drift in
// either direction (Set out-of-sync with registry) fails this test.
//
// Also asserts every tool has a boolean `gatedByDispatcherSet`
// field at runtime — companion to the compile-time enforcement
// from `defineTool<T extends BaseToolDef>` in
// src/agent/tools/types.ts (Hard constraint C).

import { describe, it, expect } from 'vitest';
import { ORG_SCOPED_TOOLS } from '@/agent/tools/orgScopedTools';
import * as tools from '@/agent/tools';

describe('ORG_SCOPED_TOOLS drift check (LT-04 / QUALITY-006)', () => {
  it('derives ORG_SCOPED_TOOLS from tool registry gatedByDispatcherSet field', () => {
    const expected = new Set(
      Object.values(tools)
        .filter((t) => t.gatedByDispatcherSet)
        .map((t) => t.name),
    );
    expect(new Set(ORG_SCOPED_TOOLS)).toEqual(expected);
  });

  it('every tool has explicit gatedByDispatcherSet decision (runtime spot-check; compile-time enforced via defineTool)', () => {
    for (const tool of Object.values(tools)) {
      expect(tool).toHaveProperty('gatedByDispatcherSet');
      expect(typeof tool.gatedByDispatcherSet).toBe('boolean');
    }
  });

  it('ORG_SCOPED_TOOLS contains the expected 5 tools at S30 closeout', () => {
    expect(new Set(ORG_SCOPED_TOOLS)).toEqual(
      new Set([
        'listChartOfAccounts',
        'checkPeriod',
        'listJournalEntries',
        'postJournalEntry',
        'reverseJournalEntry',
      ]),
    );
  });
});
