// src/components/bridge/canvasTabRouting.ts
//
// Phase 6.5 chunk 2b: Pattern γ source-driven routing pure functions
// per Sub-Q11.a Rules 1-4 + edge cases EC2.β + EC3.β. The module is
// pure — no React hooks, no localStorage / window access — so unit
// tests fire in node-env per A1-B disposition inherited from chunk 1.
// EC1.β prompt-on-replace (Rule 3) is a side effect; the caller
// (SplitScreenLayout.handleMainframeNavigate) invokes window.confirm
// before calling routeReplaceActive here.
//
// selectedEntity reduction (compatibility check across directive
// changes) lives in the caller — SplitScreenLayout handlers invoke
// reduceSelection separately and pass the resolved value to
// routeStayInActive. Keeps canvasTabRouting decoupled from canvas-
// selection logic.
//
// Pattern γ rule → function mapping:
//   Rule 1 (drop event → new tab focused; EC3.β one-tab-per-batch)
//     → routeNewTab (called from chunk 3 handleDropEvent)
//   Rule 2 (agent canvas_directive → new tab focused; EC2.β
//          focus-existing on exact match)
//     → routeNewTab with { focusExistingExactMatch: true }
//   Rule 3 (Zone 1 navigation → replace active; EC1.β prompt)
//     → routeReplaceActive (caller fires window.confirm first)
//   Rule 4 (in-canvas drill-down → stays in active; append history)
//     → routeStayInActive
// Plus tab management helpers (closeTab + switchTab) for the
// CanvasTabStrip component's onClose + onSwitch callbacks.

import { createTab } from '@/shared/types/canvasTab';
import type { Tab, TabsState } from '@/shared/types/canvasTab';
import type { CanvasDirective } from '@/shared/types/canvasDirective';
import type { SelectedEntity } from '@/shared/types/canvasContext';

/**
 * Pattern γ Rule 4: in-canvas drill-down stays in active tab.
 * Appends `directive` to active tab's history (trimming any forward
 * history past current index, per canonical browser-back-history
 * semantics) and advances historyIndex by 1. Updates selectedEntity
 * if the caller supplies one (caller invokes reduceSelection before
 * routing).
 *
 * No-op if no active tab.
 */
export function routeStayInActive(
  state: TabsState,
  directive: CanvasDirective,
  selectedEntity?: SelectedEntity,
): TabsState {
  const active = state.tabs.find((t) => t.tabId === state.activeTabId);
  if (!active) return state;
  const newHistory = [
    ...active.history.slice(0, active.historyIndex + 1),
    directive,
  ];
  const updated: Tab = {
    ...active,
    directive,
    selectedEntity,
    history: newHistory,
    historyIndex: newHistory.length - 1,
  };
  return {
    ...state,
    tabs: state.tabs.map((t) => (t.tabId === state.activeTabId ? updated : t)),
  };
}

/**
 * Pattern γ Rule 3: Zone 1 navigation replaces active tab's
 * directive. The active tab's back-history is intentionally
 * discarded per Sub-Q11.a Rule 3 spec — replacement is a fresh
 * navigation. selectedEntity also resets to undefined (fresh
 * navigation; previous selection irrelevant in the new view).
 *
 * EC1.β prompt-on-replace is the caller's responsibility (caller
 * fires window.confirm and only invokes this function on user
 * accept). At v1 default, the caller always prompts; per-form
 * dirty-state detection is substrate-now-enforcement-later per
 * ADR-0010 for post-v1 selective prompting.
 *
 * No-op if no active tab.
 */
export function routeReplaceActive(
  state: TabsState,
  directive: CanvasDirective,
): TabsState {
  const active = state.tabs.find((t) => t.tabId === state.activeTabId);
  if (!active) return state;
  const updated: Tab = {
    ...active,
    directive,
    selectedEntity: undefined,
    history: [directive],
    historyIndex: 0,
  };
  return {
    ...state,
    tabs: state.tabs.map((t) => (t.tabId === state.activeTabId ? updated : t)),
  };
}

/**
 * Pattern γ Rule 1 (drop event) + Rule 2 (agent canvas_directive):
 * open a new tab focused. When `opts.focusExistingExactMatch` is
 * true, first checks if an existing tab matches (EC2.β); if found,
 * switches active to that tab instead of opening a new one.
 *
 * The new tab is positioned at the end of the tabs array (no
 * insertion ordering per Cut 9 v1 limitation).
 */
export function routeNewTab(
  state: TabsState,
  directive: CanvasDirective,
  opts?: { focusExistingExactMatch?: boolean },
): TabsState {
  if (opts?.focusExistingExactMatch) {
    const matchedTabId = findExistingExactMatch(state, directive);
    if (matchedTabId !== null) {
      return switchTab(state, matchedTabId);
    }
  }
  const fresh = createTab(directive);
  return {
    tabs: [...state.tabs, fresh],
    activeTabId: fresh.tabId,
  };
}

/**
 * EC2.β: scan open tabs for one whose `directive` structurally
 * matches the input. Returns the matched tabId or null.
 *
 * Matching rule: same discriminator type AND all directive
 * payload fields equal. Implemented via shallow equality over the
 * directive's own enumerable properties — sufficient because the
 * `CanvasDirective` discriminated union members are flat objects
 * with primitive fields (strings / enums / occasional union
 * primitives). Nested-object directives (`proposed_entry_card`'s
 * `card` field) compare by reference; agent emissions of these are
 * one-off and unlikely to match an open tab anyway.
 *
 * If `selectedEntity` is provided, also requires the matched tab's
 * selectedEntity to match (by type + id). Otherwise selectedEntity
 * is ignored.
 */
export function findExistingExactMatch(
  state: TabsState,
  directive: CanvasDirective,
  selectedEntity?: SelectedEntity,
): string | null {
  for (const tab of state.tabs) {
    if (!directivesEqual(tab.directive, directive)) continue;
    if (selectedEntity !== undefined) {
      if (!selectedEntitiesEqual(tab.selectedEntity, selectedEntity)) continue;
    }
    return tab.tabId;
  }
  return null;
}

/**
 * Sub-Q11.d.close.α: close the tab matching `tabId`. If `tabId` is
 * the active tab, advance active to adjacent-right; fallback to
 * adjacent-left at rightmost. When the last tab is closed, the
 * tabs-zero state is handled here: a fresh `{type: 'none'}` tab is
 * created so the caller always has a valid active tab.
 *
 * No-op if `tabId` doesn't match any open tab.
 */
export function closeTab(state: TabsState, tabId: string): TabsState {
  const index = state.tabs.findIndex((t) => t.tabId === tabId);
  if (index === -1) return state;
  const remaining = state.tabs.filter((t) => t.tabId !== tabId);

  if (remaining.length === 0) {
    // Tabs-zero state: create a fresh neutral tab.
    const freshTab = createTab({ type: 'none' });
    return { tabs: [freshTab], activeTabId: freshTab.tabId };
  }

  if (state.activeTabId !== tabId) {
    // Closing a non-active tab; activeTabId unchanged.
    return { tabs: remaining, activeTabId: state.activeTabId };
  }

  // Closing the active tab: advance to adjacent-right; fallback to
  // adjacent-left at rightmost (per 11.d.close.α).
  const newActiveTabId =
    index < remaining.length
      ? remaining[index].tabId
      : remaining[remaining.length - 1].tabId;
  return { tabs: remaining, activeTabId: newActiveTabId };
}

/**
 * Sub-Q11.d.switch.α: set activeTabId to `tabId` (instant; no
 * animation overhead at the state grain). No-op if `tabId` doesn't
 * match any open tab.
 */
export function switchTab(state: TabsState, tabId: string): TabsState {
  if (!state.tabs.some((t) => t.tabId === tabId)) return state;
  return { ...state, activeTabId: tabId };
}

function directivesEqual(a: CanvasDirective, b: CanvasDirective): boolean {
  if (a.type !== b.type) return false;
  const aKeys = Object.keys(a) as Array<keyof typeof a>;
  const bKeys = Object.keys(b) as Array<keyof typeof b>;
  if (aKeys.length !== bKeys.length) return false;
  for (const key of aKeys) {
    if (!(key in b)) return false;
    if ((a as Record<string, unknown>)[key] !== (b as Record<string, unknown>)[key]) {
      return false;
    }
  }
  return true;
}

function selectedEntitiesEqual(
  a: SelectedEntity | undefined,
  b: SelectedEntity | undefined,
): boolean {
  if (a === b) return true;
  if (!a || !b) return false;
  return a.type === b.type && a.id === b.id;
}
