// src/shared/types/canvasTab.ts
//
// Phase 6.5 chunk 2 substrate (Session 10a): tab data model per
// Sub-Q11.b.α state lift. Each Tab carries its own directive +
// selectedEntity + navigation history. SplitScreenLayout owns
// `tabs: ReadonlyArray<Tab> + activeTabId` state.
//
// At chunk-2a (this commit), per-source callbacks at SplitScreenLayout
// all share an "append to active tab's history" semantic (degenerate
// Pattern γ; preserves pre-chunk-2 single-history-stack behavior).
// At chunk-2b (Session 10b), the per-source callbacks diverge:
//   - Zone 1 navigation → Pattern γ Rule 3 (replace active; EC1.β prompt)
//   - Agent canvas_directive → Pattern γ Rule 2 (new tab or focus-existing EC2.β)
//   - In-canvas drill-down → Pattern γ Rule 4 (stays in active; append; unchanged from 2a)
//   - AgentChatPanel drop event → Pattern γ Rule 1 (new tab; EC3.β one-tab-per-batch)
//
// Session-only persistence per Cut 9 v1 limitation (tabs reset on
// reload; no localStorage at v1). canvasContext singleton-shape
// preserved at TYPE level per Sub-Q18.α (orchestrator prompt-suffix
// + canvasContext.schema.ts + canvasContext.ts type unchanged; only
// source-of-truth changes from singleton to active-tab).

import type { CanvasDirective } from './canvasDirective';
import type { SelectedEntity } from './canvasContext';

export type Tab = {
  tabId: string;
  directive: CanvasDirective;
  selectedEntity?: SelectedEntity;
  history: ReadonlyArray<CanvasDirective>;
  historyIndex: number;
};

export type TabsState = {
  tabs: ReadonlyArray<Tab>;
  activeTabId: string;
};

/**
 * Construct a fresh Tab seeded with the given directive at history
 * position 0. Used at SplitScreenLayout mount + (at chunk 2b) when
 * Pattern γ Rules 1/2 open new tabs.
 */
export function createTab(directive: CanvasDirective): Tab {
  return {
    tabId: crypto.randomUUID(),
    directive,
    history: [directive],
    historyIndex: 0,
  };
}
