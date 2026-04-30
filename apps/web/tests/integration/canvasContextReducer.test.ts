// tests/integration/canvasContextReducer.test.ts
// Phase 1.2 Session 7.1 Commit 5 — pure-function tests for
// reduceSelection + hasGroundingContext. Covers Pre-decision 10's
// type-compatibility rule plus the grounding-context helper that
// gates canvas_context inclusion in the agent request body.

import { describe, it, expect } from 'vitest';
import {
  reduceSelection,
  hasGroundingContext,
} from '@/agent/canvas/reduceSelection';
import type { SelectedEntity } from '@/shared/types/canvasContext';

const ORG = '11111111-1111-1111-1111-111111111111';
const ENTRY_ID = '22222222-2222-2222-2222-222222222222';
const ACCOUNT_ID = '33333333-3333-3333-3333-333333333333';

const JE_SELECTION: SelectedEntity = {
  type: 'journal_entry',
  id: ENTRY_ID,
  display_name: '#179 — October rent',
};

const ACCOUNT_SELECTION: SelectedEntity = {
  type: 'account',
  id: ACCOUNT_ID,
  display_name: '1100 — Cash',
};

describe('reduceSelection — select event', () => {
  it('sets a fresh selection on empty state', () => {
    expect(reduceSelection(undefined, { type: 'select', entity: JE_SELECTION }))
      .toEqual(JE_SELECTION);
  });

  it('overrides an existing selection with a new one', () => {
    expect(
      reduceSelection(ACCOUNT_SELECTION, { type: 'select', entity: JE_SELECTION }),
    ).toEqual(JE_SELECTION);
  });
});

describe('reduceSelection — directive_change event (Pre-decision 10)', () => {
  it('keeps a journal_entry selection when navigating to a compatible directive (journal_entry)', () => {
    const result = reduceSelection(JE_SELECTION, {
      type: 'directive_change',
      new_directive: { type: 'journal_entry', orgId: ORG, entryId: ENTRY_ID, mode: 'view' },
    });
    expect(result).toEqual(JE_SELECTION);
  });

  it('keeps a journal_entry selection when navigating to journal_entry_list', () => {
    const result = reduceSelection(JE_SELECTION, {
      type: 'directive_change',
      new_directive: { type: 'journal_entry_list', orgId: ORG },
    });
    expect(result).toEqual(JE_SELECTION);
  });

  it('keeps an account selection when navigating to chart_of_accounts', () => {
    const result = reduceSelection(ACCOUNT_SELECTION, {
      type: 'directive_change',
      new_directive: { type: 'chart_of_accounts', orgId: ORG },
    });
    expect(result).toEqual(ACCOUNT_SELECTION);
  });

  it('drops a journal_entry selection when navigating to journal_entry_form (fresh form, not a display)', () => {
    const result = reduceSelection(JE_SELECTION, {
      type: 'directive_change',
      new_directive: { type: 'journal_entry_form', orgId: ORG },
    });
    expect(result).toBeUndefined();
  });

  it('drops a journal_entry selection when navigating to an unrelated directive (report_pl)', () => {
    const result = reduceSelection(JE_SELECTION, {
      type: 'directive_change',
      new_directive: { type: 'report_pl', orgId: ORG },
    });
    expect(result).toBeUndefined();
  });

  it('drops any selection when navigating to proposed_entry_card (agent output, not a selection target)', () => {
    const minimalCard = {} as never;
    const jeResult = reduceSelection(JE_SELECTION, {
      type: 'directive_change',
      new_directive: { type: 'proposed_entry_card', card: minimalCard },
    });
    const acctResult = reduceSelection(ACCOUNT_SELECTION, {
      type: 'directive_change',
      new_directive: { type: 'proposed_entry_card', card: minimalCard },
    });
    expect(jeResult).toBeUndefined();
    expect(acctResult).toBeUndefined();
  });

  it('drops an account selection when navigating to journal_entry_list (type-mismatch)', () => {
    const result = reduceSelection(ACCOUNT_SELECTION, {
      type: 'directive_change',
      new_directive: { type: 'journal_entry_list', orgId: ORG },
    });
    expect(result).toBeUndefined();
  });

  it('no-op on empty selection regardless of new directive', () => {
    const result = reduceSelection(undefined, {
      type: 'directive_change',
      new_directive: { type: 'journal_entry_list', orgId: ORG },
    });
    expect(result).toBeUndefined();
  });
});

describe('reduceSelection — clear event', () => {
  it('clears a populated selection', () => {
    expect(reduceSelection(JE_SELECTION, { type: 'clear' })).toBeUndefined();
  });

  it('no-op on empty selection', () => {
    expect(reduceSelection(undefined, { type: 'clear' })).toBeUndefined();
  });
});

describe('hasGroundingContext', () => {
  it('false when directive is none and no selection', () => {
    expect(
      hasGroundingContext({
        current_directive: { type: 'none' },
        selected_entity: undefined,
      }),
    ).toBe(false);
  });

  it('true when directive is meaningful even without selection', () => {
    expect(
      hasGroundingContext({
        current_directive: { type: 'journal_entry_list', orgId: ORG },
        selected_entity: undefined,
      }),
    ).toBe(true);
  });

  it('true when selection is set even if directive is none', () => {
    expect(
      hasGroundingContext({
        current_directive: { type: 'none' },
        selected_entity: JE_SELECTION,
      }),
    ).toBe(true);
  });

  it('true when both directive and selection are meaningful', () => {
    expect(
      hasGroundingContext({
        current_directive: { type: 'chart_of_accounts', orgId: ORG },
        selected_entity: ACCOUNT_SELECTION,
      }),
    ).toBe(true);
  });
});
