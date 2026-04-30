// src/shared/types/canvasContext.ts — created in Phase 1.1, used in Phase 1.2.

import type { CanvasDirective } from './canvasDirective';

export type SelectedEntity =
  | { type: 'journal_entry'; id: string; display_name: string }
  | { type: 'account'; id: string; display_name: string };

export type CanvasContext = {
  /** The directive currently rendered by ContextualCanvas, verbatim. */
  current_directive: CanvasDirective;

  /**
   * The entity the user has clicked on, if any. Undefined means the user
   * is looking at the canvas but has not clicked any specific row.
   * Phase 1.2 supports exactly two selection types: journal_entry and
   * account. Additional types (P&L line drill-down, multi-select, etc.)
   * are Phase 2.
   */
  selected_entity?: SelectedEntity;
};
