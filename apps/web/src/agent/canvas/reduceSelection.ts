// src/agent/canvas/reduceSelection.ts
// Phase 1.2 Session 7.1 Commit 5 — pure selection reducer honoring
// Pre-decision 10's type-compatibility rule from Session 7. The
// selection survives a directive change iff the new directive type
// is on the compatibility allowlist for the selection's entity
// type; otherwise it drops.
//
// Explicit drops worth naming:
//   - `journal_entry_form` drops a prior `journal_entry` selection.
//     The form is a fresh form with prefill, not a display of the
//     selected entity. User intent on switching to the form is "I
//     want to create something new," not "I want to edit my
//     selection."
//   - `proposed_entry_card` drops all selections. The card is the
//     agent's proposal, not a selection target — it stands on its
//     own; the user is looking at agent output, not a picked entity.

import type { CanvasDirective } from '@/shared/types/canvasDirective';
import type { CanvasContext, SelectedEntity } from '@/shared/types/canvasContext';

const COMPATIBLE_DIRECTIVES: Record<
  SelectedEntity['type'],
  readonly CanvasDirective['type'][]
> = {
  journal_entry: ['journal_entry', 'journal_entry_list'],
  account: ['chart_of_accounts'],
};

export type CanvasSelectionEvent =
  | { type: 'select'; entity: SelectedEntity }
  | { type: 'directive_change'; new_directive: CanvasDirective }
  | { type: 'clear' };

export function reduceSelection(
  current: SelectedEntity | undefined,
  event: CanvasSelectionEvent,
): SelectedEntity | undefined {
  switch (event.type) {
    case 'select':
      return event.entity;
    case 'directive_change': {
      if (!current) return undefined;
      const compatible = COMPATIBLE_DIRECTIVES[current.type];
      return compatible.includes(event.new_directive.type) ? current : undefined;
    }
    case 'clear':
      return undefined;
  }
}

/**
 * True iff the canvas context carries grounding information worth
 * sending to the orchestrator. Used by the chat send path to decide
 * whether to include `canvas_context` in the request body: when the
 * current directive is `none` AND no selection is set, the context
 * has nothing to ground on and injecting "looking at: no canvas
 * view" into the system prompt is prompt noise.
 */
export function hasGroundingContext(ctx: CanvasContext): boolean {
  return (
    ctx.current_directive.type !== 'none' || ctx.selected_entity !== undefined
  );
}
