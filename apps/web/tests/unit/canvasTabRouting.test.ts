// tests/unit/canvasTabRouting.test.ts
//
// Phase 6.5 chunk 2b — unit tests for the canvasTabRouting pure-
// function module per Sub-Q11.a Pattern γ Rules 1-4 + edge cases.
// Per A1-B disposition: pure-function tests run in node-env without
// React DOM; component + hook coverage routes through E2E specs.

import { describe, it, expect } from 'vitest';

import {
  closeTab,
  findExistingExactMatch,
  routeNewTab,
  routeReplaceActive,
  routeStayInActive,
  switchTab,
} from '@/components/bridge/canvasTabRouting';
import type { Tab, TabsState } from '@/shared/types/canvasTab';

function makeTab(
  tabId: string,
  directive: Tab['directive'] = { type: 'none' },
  history?: Tab['history'],
  historyIndex = 0,
): Tab {
  const resolvedHistory = history ?? [directive];
  return { tabId, directive, history: resolvedHistory, historyIndex };
}

const ORG_A = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
const ORG_B = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

describe('routeStayInActive (Pattern γ Rule 4)', () => {
  it('appends directive to active tab history; advances index', () => {
    const t = makeTab('t1', { type: 'chart_of_accounts', orgId: ORG_A });
    const state: TabsState = { tabs: [t], activeTabId: 't1' };
    const result = routeStayInActive(state, {
      type: 'report_open_bills',
      orgId: ORG_A,
    });
    expect(result.tabs[0].directive).toEqual({
      type: 'report_open_bills',
      orgId: ORG_A,
    });
    expect(result.tabs[0].history).toHaveLength(2);
    expect(result.tabs[0].historyIndex).toBe(1);
  });

  it('trims forward history past current index when appending', () => {
    const t = makeTab(
      't1',
      { type: 'chart_of_accounts', orgId: ORG_A },
      [
        { type: 'chart_of_accounts', orgId: ORG_A },
        { type: 'report_open_bills', orgId: ORG_A },
        { type: 'report_ap_aging', orgId: ORG_A },
      ],
      0,
    );
    const state: TabsState = { tabs: [t], activeTabId: 't1' };
    const result = routeStayInActive(state, {
      type: 'journal_entry_list',
      orgId: ORG_A,
    });
    // historyIndex was 0; forward entries dropped; append produces length 2.
    expect(result.tabs[0].history).toHaveLength(2);
    expect(result.tabs[0].historyIndex).toBe(1);
    expect(result.tabs[0].history[1]).toEqual({
      type: 'journal_entry_list',
      orgId: ORG_A,
    });
  });

  it('updates selectedEntity when caller supplies one', () => {
    const t = makeTab('t1', { type: 'chart_of_accounts', orgId: ORG_A });
    const state: TabsState = { tabs: [t], activeTabId: 't1' };
    const result = routeStayInActive(
      state,
      { type: 'journal_entry_list', orgId: ORG_A },
      {
        type: 'journal_entry',
        id: '11111111-1111-1111-1111-111111111111',
        display_name: 'JE-42',
      },
    );
    expect(result.tabs[0].selectedEntity).toEqual({
      type: 'journal_entry',
      id: '11111111-1111-1111-1111-111111111111',
      display_name: 'JE-42',
    });
  });

  it('returns state unchanged when no active tab matches', () => {
    const state: TabsState = { tabs: [], activeTabId: 'missing' };
    const result = routeStayInActive(state, {
      type: 'report_open_bills',
      orgId: ORG_A,
    });
    expect(result).toEqual(state);
  });
});

describe('routeReplaceActive (Pattern γ Rule 3)', () => {
  it('replaces active tab directive AND resets history + selectedEntity', () => {
    const t = makeTab(
      't1',
      { type: 'chart_of_accounts', orgId: ORG_A },
      [
        { type: 'chart_of_accounts', orgId: ORG_A },
        { type: 'report_open_bills', orgId: ORG_A },
      ],
      1,
    );
    const stateWithSelection: TabsState = { tabs: [t], activeTabId: 't1' };
    stateWithSelection.tabs[0].selectedEntity = {
      type: 'journal_entry',
      id: '11111111-1111-1111-1111-111111111111',
      display_name: 'JE-42',
    };
    const result = routeReplaceActive(stateWithSelection, {
      type: 'report_ap_aging',
      orgId: ORG_A,
    });
    expect(result.tabs[0].directive).toEqual({
      type: 'report_ap_aging',
      orgId: ORG_A,
    });
    expect(result.tabs[0].history).toEqual([
      { type: 'report_ap_aging', orgId: ORG_A },
    ]);
    expect(result.tabs[0].historyIndex).toBe(0);
    expect(result.tabs[0].selectedEntity).toBeUndefined();
  });
});

describe('routeNewTab (Pattern γ Rules 1+2)', () => {
  it('opens a new tab focused; existing tabs preserved', () => {
    const t1 = makeTab('t1', { type: 'chart_of_accounts', orgId: ORG_A });
    const state: TabsState = { tabs: [t1], activeTabId: 't1' };
    const result = routeNewTab(state, {
      type: 'report_open_bills',
      orgId: ORG_A,
    });
    expect(result.tabs).toHaveLength(2);
    expect(result.tabs[0]).toEqual(t1);
    expect(result.tabs[1].directive).toEqual({
      type: 'report_open_bills',
      orgId: ORG_A,
    });
    expect(result.activeTabId).toBe(result.tabs[1].tabId);
  });

  it('focuses existing tab on exact match (EC2.β) when opts set', () => {
    const t1 = makeTab('t1', { type: 'chart_of_accounts', orgId: ORG_A });
    const t2 = makeTab('t2', { type: 'report_open_bills', orgId: ORG_A });
    const state: TabsState = { tabs: [t1, t2], activeTabId: 't1' };
    const result = routeNewTab(
      state,
      { type: 'report_open_bills', orgId: ORG_A },
      { focusExistingExactMatch: true },
    );
    // No new tab opened; activeTabId switched to t2.
    expect(result.tabs).toHaveLength(2);
    expect(result.activeTabId).toBe('t2');
  });

  it('opens new tab when no exact match found (EC2.β fallback)', () => {
    const t1 = makeTab('t1', { type: 'chart_of_accounts', orgId: ORG_A });
    const state: TabsState = { tabs: [t1], activeTabId: 't1' };
    const result = routeNewTab(
      state,
      { type: 'report_open_bills', orgId: ORG_A },
      { focusExistingExactMatch: true },
    );
    expect(result.tabs).toHaveLength(2);
    expect(result.tabs[1].directive).toEqual({
      type: 'report_open_bills',
      orgId: ORG_A,
    });
  });
});

describe('findExistingExactMatch (EC2.β)', () => {
  it('returns tabId when directive structurally matches', () => {
    const t1 = makeTab('t1', { type: 'chart_of_accounts', orgId: ORG_A });
    const t2 = makeTab('t2', { type: 'report_open_bills', orgId: ORG_A });
    const state: TabsState = { tabs: [t1, t2], activeTabId: 't1' };
    const match = findExistingExactMatch(state, {
      type: 'report_open_bills',
      orgId: ORG_A,
    });
    expect(match).toBe('t2');
  });

  it('returns null when no match', () => {
    const t1 = makeTab('t1', { type: 'chart_of_accounts', orgId: ORG_A });
    const state: TabsState = { tabs: [t1], activeTabId: 't1' };
    const match = findExistingExactMatch(state, {
      type: 'report_ap_aging',
      orgId: ORG_A,
    });
    expect(match).toBeNull();
  });

  it('distinguishes by id-bearing field (different orgId → no match)', () => {
    const t1 = makeTab('t1', { type: 'report_open_bills', orgId: ORG_A });
    const state: TabsState = { tabs: [t1], activeTabId: 't1' };
    const match = findExistingExactMatch(state, {
      type: 'report_open_bills',
      orgId: ORG_B,
    });
    expect(match).toBeNull();
  });
});

describe('closeTab (Sub-Q11.d.close.α)', () => {
  it('closes active tab; switches to adjacent-right', () => {
    const t1 = makeTab('t1', { type: 'chart_of_accounts', orgId: ORG_A });
    const t2 = makeTab('t2', { type: 'report_open_bills', orgId: ORG_A });
    const t3 = makeTab('t3', { type: 'report_ap_aging', orgId: ORG_A });
    const state: TabsState = { tabs: [t1, t2, t3], activeTabId: 't2' };
    const result = closeTab(state, 't2');
    expect(result.tabs.map((t) => t.tabId)).toEqual(['t1', 't3']);
    expect(result.activeTabId).toBe('t3');
  });

  it('closes rightmost active tab; falls back to adjacent-left', () => {
    const t1 = makeTab('t1', { type: 'chart_of_accounts', orgId: ORG_A });
    const t2 = makeTab('t2', { type: 'report_open_bills', orgId: ORG_A });
    const t3 = makeTab('t3', { type: 'report_ap_aging', orgId: ORG_A });
    const state: TabsState = { tabs: [t1, t2, t3], activeTabId: 't3' };
    const result = closeTab(state, 't3');
    expect(result.tabs.map((t) => t.tabId)).toEqual(['t1', 't2']);
    expect(result.activeTabId).toBe('t2');
  });

  it('closes non-active tab; activeTabId unchanged', () => {
    const t1 = makeTab('t1', { type: 'chart_of_accounts', orgId: ORG_A });
    const t2 = makeTab('t2', { type: 'report_open_bills', orgId: ORG_A });
    const state: TabsState = { tabs: [t1, t2], activeTabId: 't2' };
    const result = closeTab(state, 't1');
    expect(result.tabs.map((t) => t.tabId)).toEqual(['t2']);
    expect(result.activeTabId).toBe('t2');
  });

  it('closes last tab; creates fresh "none" tab (tabs-zero state)', () => {
    const t1 = makeTab('t1', { type: 'chart_of_accounts', orgId: ORG_A });
    const state: TabsState = { tabs: [t1], activeTabId: 't1' };
    const result = closeTab(state, 't1');
    expect(result.tabs).toHaveLength(1);
    expect(result.tabs[0].directive).toEqual({ type: 'none' });
    expect(result.activeTabId).toBe(result.tabs[0].tabId);
  });

  it('no-op for non-existent tabId', () => {
    const t1 = makeTab('t1', { type: 'chart_of_accounts', orgId: ORG_A });
    const state: TabsState = { tabs: [t1], activeTabId: 't1' };
    const result = closeTab(state, 'missing');
    expect(result).toEqual(state);
  });
});

describe('switchTab (Sub-Q11.d.switch.α)', () => {
  it('updates activeTabId for valid tabId', () => {
    const t1 = makeTab('t1', { type: 'chart_of_accounts', orgId: ORG_A });
    const t2 = makeTab('t2', { type: 'report_open_bills', orgId: ORG_A });
    const state: TabsState = { tabs: [t1, t2], activeTabId: 't1' };
    const result = switchTab(state, 't2');
    expect(result.activeTabId).toBe('t2');
    expect(result.tabs).toEqual([t1, t2]);
  });

  it('no-op for invalid tabId', () => {
    const t1 = makeTab('t1', { type: 'chart_of_accounts', orgId: ORG_A });
    const state: TabsState = { tabs: [t1], activeTabId: 't1' };
    const result = switchTab(state, 'missing');
    expect(result).toEqual(state);
  });
});
