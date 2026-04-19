// src/agent/prompts/suffixes/canvasContextSuffix.ts
// Phase 1.2 Session 3 — subordinate-framing block for canvas
// context. The prose body is VERBATIM from
// docs/09_briefs/phase-1.2/canvas_context_injection.md
// "System Prompt Framing — Explicitly Subordinate" section
// (sub-brief §6.2 / Pre-decision 3).
//
// Handlebars-style `{#if}`/`{/if}` conditionals in the source doc
// are translated to TypeScript template-literal conditionals; the
// English prose ("reference only", "Do not assume...", etc.) is
// copied character-for-character.
//
// `current_directive.description` in the source doc is a
// placeholder — CanvasDirective has no `description` field. The
// describeDirective helper below maps each discriminated-union
// member to a short human-readable label. These labels are
// session-authored and reviewed at commit 2.

import type { CanvasContext } from '@/shared/types/canvasContext';
import type { CanvasDirective } from '@/shared/types/canvasDirective';

export function canvasContextSuffix(
  canvasContext: CanvasContext | undefined,
): string {
  if (!canvasContext) return '';

  const description = describeDirective(canvasContext.current_directive);
  const selectionLine = canvasContext.selected_entity
    ? `\nThe user has clicked on: ${canvasContext.selected_entity.display_name} (${canvasContext.selected_entity.type}, id: ${canvasContext.selected_entity.id})`
    : '';

  return `## Current canvas context (reference only)

The user is currently looking at: ${description}${selectionLine}

This context is reference material only. Use it when the user's message is ambiguous ("this", "here", "why is it so high") to resolve which entity they mean. **Do not assume the user is asking about the selected entity or the current canvas unless their message refers to it.** If the user sends a message that explicitly names a different entity, follow the explicit reference and ignore the selection. If the user sends a message with no clear referent and nothing is selected, ask a clarifying question rather than guessing from a stale selection.`;
}

// Session-authored directive → human-readable label mapping.
// Each label names the view briefly. Reviewed at commit 2.
function describeDirective(directive: CanvasDirective): string {
  switch (directive.type) {
    case 'chart_of_accounts':
      return 'the chart of accounts';
    case 'journal_entry':
      return 'a journal entry detail view';
    case 'journal_entry_form':
      return 'the new journal entry form';
    case 'journal_entry_list':
      return 'the journal entry list';
    case 'proposed_entry_card':
      return 'a proposed entry awaiting approval';
    case 'ai_action_review_queue':
      return 'the AI action review queue';
    case 'report_pl':
      return 'the profit & loss report';
    case 'report_trial_balance':
      return 'the trial balance report';
    case 'reversal_form':
      return 'the reversal form';
    case 'none':
      return 'no canvas view';
    case 'user_profile':
      return 'the user profile editor';
    case 'org_profile':
      return 'the organization profile editor';
    case 'org_users':
      return 'the organization users list';
    case 'invite_user':
      return 'the invite user form';
    case 'welcome':
      return 'the welcome / onboarding view';
    case 'ap_queue':
      return 'the AP queue';
    case 'vendor_detail':
      return 'a vendor detail view';
    case 'bank_reconciliation':
      return 'a bank reconciliation';
    case 'ar_aging':
      return 'the AR aging report';
    case 'consolidated_dashboard':
      return 'the consolidated dashboard';
  }
}
