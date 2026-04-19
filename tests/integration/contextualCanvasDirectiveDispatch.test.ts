// tests/integration/contextualCanvasDirectiveDispatch.test.ts
// CA-80: Phase 1.2 Session 6 — ContextualCanvas directive
// dispatch coverage for the five new directive types.
//
// Direct React-component rendering is not set up in this
// integration-test suite (no jsdom / @testing-library). This
// test asserts the dispatch contract at the two layers that
// DO have test coverage:
//   (a) Zod schema acceptance — every new directive type parses
//       cleanly through canvasDirectiveSchema.
//   (b) canvasContextSuffix.describeDirective — the exhaustive
//       switch that the agent's prompt composition walks. A
//       missing case would fail typecheck (exhaustive check),
//       but the test pins behaviour — if a future edit adds a
//       new case without updating describeDirective, the switch
//       would fall through to undefined. This test ensures each
//       of the five Session 6 types yields a non-empty label.
//
// Together these cover the "dispatch correctness" contract the
// runtime relies on. Visual verification of the dispatched
// component lives in the post-restart Playwright pass.

import { describe, it, expect } from 'vitest';
import { canvasDirectiveSchema } from '@/shared/schemas/canvas/canvasDirective.schema';
import { canvasContextSuffix } from '@/agent/prompts/suffixes/canvasContextSuffix';
import type { CanvasDirective } from '@/shared/types/canvasDirective';
import type { CanvasContext } from '@/shared/types/canvasContext';

const ORG = '11111111-1111-1111-1111-111111111111';

const session6Directives: CanvasDirective[] = [
  { type: 'user_profile' },
  { type: 'org_profile', orgId: ORG },
  { type: 'org_users', orgId: ORG },
  { type: 'invite_user', orgId: ORG },
  { type: 'welcome' },
];

function canvasContextFor(d: CanvasDirective): CanvasContext {
  return {
    current_directive: d,
    selected_entity: undefined,
  };
}

describe('CA-80: ContextualCanvas dispatch — Session 6 directive types', () => {
  it('all five new directive types round-trip through canvasDirectiveSchema', () => {
    for (const d of session6Directives) {
      const parsed = canvasDirectiveSchema.parse(d);
      expect(parsed.type).toBe(d.type);
    }
  });

  it('canvasContextSuffix.describeDirective covers every new type with a non-empty label', () => {
    for (const d of session6Directives) {
      const suffix = canvasContextSuffix(canvasContextFor(d));
      expect(suffix).toMatch(/The user is currently looking at:/);
      expect(suffix).not.toMatch(/undefined/);
    }
  });

  it('describeDirective labels are distinctive per type (no collisions)', () => {
    const labels = new Set<string>();
    for (const d of session6Directives) {
      const suffix = canvasContextSuffix(canvasContextFor(d));
      // Extract just the description between the known phrases
      const match = suffix.match(/looking at: (.+)/);
      expect(match).toBeTruthy();
      labels.add(match![1].split('\n')[0]);
    }
    expect(labels.size).toBe(session6Directives.length);
  });

  it('Phase 1.1 types still work (regression guard — Session 6 extensions did not break prior dispatch)', () => {
    const phase11: CanvasDirective[] = [
      { type: 'none' },
      { type: 'chart_of_accounts', orgId: ORG },
      { type: 'journal_entry_list', orgId: ORG },
    ];
    for (const d of phase11) {
      const parsed = canvasDirectiveSchema.parse(d);
      expect(parsed.type).toBe(d.type);
      const suffix = canvasContextSuffix(canvasContextFor(d));
      expect(suffix).not.toMatch(/undefined/);
    }
  });
});
