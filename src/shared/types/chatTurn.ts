// src/shared/types/chatTurn.ts
// Phase 1.2 Session 7 Commit 3 — client-facing ChatTurn
// discriminated union per sub-brief §4 Commit 3 ChatTurn type
// block, plus CardResolution per the Commit 2 design pass.
//
// Persistence vs. hydration:
//   - PersistedUserTurn / PersistedAssistantTurn: the subset that
//     is written to agent_sessions.turns by persistSession. User
//     turns are always persisted with status: 'sent' (client-
//     ephemeral 'sending' | 'failed' never persist). Assistant
//     turns persist without card_resolution — the conversation-
//     load endpoint derives that server-side from ai_actions.
//   - ChatTurn: the full client-consumed shape after hydration.
//     Includes client-ephemeral user statuses and the server-
//     derived card_resolution.
//
// Pre-decision 7: card_resolution is derived server-side from
// ai_actions.status and lands on the assistant turn as a read-
// only field. The client never mutates it — a subsequent
// Approve/Reject/Edit triggers a refresh cycle.

import type { CanvasDirective } from './canvasDirective';
import type { ProposedEntryCard } from './proposedEntryCard';

export type CardResolution =
  | {
      status: 'approved';
      journal_entry_id: string;
      entry_number: number;
    }
  | { status: 'rejected'; reason?: string }
  | { status: 'edited' }
  | { status: 'stale' };

export type ChatTurnUserSent = {
  role: 'user';
  id: string;
  text: string;
  timestamp: string;
  status: 'sent';
};

export type ChatTurnUserPending = {
  role: 'user';
  id: string;
  text: string;
  timestamp: string;
  status: 'sending' | 'failed';
  error_detail?: string;
};

export type ChatTurnUser = ChatTurnUserSent | ChatTurnUserPending;

export type ChatTurnAssistant = {
  role: 'assistant';
  id: string;
  template_id: string;
  params: Record<string, unknown>;
  card?: ProposedEntryCard;
  card_resolution?: CardResolution;
  canvas_directive_pill?: CanvasDirective;
  timestamp: string;
  trace_id: string;
};

export type ChatTurn = ChatTurnUser | ChatTurnAssistant;

// Persisted variants — client-ephemeral fields excluded. These
// are what agent_sessions.turns stores; the conversation-load
// endpoint adds card_resolution server-side during hydration.

export type PersistedUserTurn = ChatTurnUserSent;

export type PersistedAssistantTurn = Omit<
  ChatTurnAssistant,
  'card_resolution'
>;

export type PersistedTurn = PersistedUserTurn | PersistedAssistantTurn;
