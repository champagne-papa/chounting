// src/components/canvas/DocumentCard.tsx
//
// Phase 6 chunk 6.2b: per-document card. Renders Sub-Q2.1 columns
// (case_id, state, source_document_id, original_filename,
// ingest_batch_id, channel_metadata, received_at, created_at).
//
// Phase 7 chunk 7.3b Task 7.3b.3: state machine extension per chunk 7.3
// brief §4 value pick #6 + Sub-Q20 lock. State-driven render branches
// across 7 DocumentCaseStateSchema values (received, classified,
// needs_review, matched, proposed, approved, rejected); per-state badge
// color (green/yellow/orange/gray/red/blue); state-specific action
// affordances ("Review" for proposed; "View receipt" for approved;
// "Re-process" for needs_review; no action for terminal rejected).
//
// No new DocumentCaseStateSchema enum values introduced — the 7-state
// enum from existing substrate covers all chunk 7.3 transitions. Action
// affordance handlers are wired via optional `onAction` callback;
// PendingDocumentsView v1 omits the wiring (per chunk 7.3 brief §3.5
// Task 7.3b.4 no-structural-change discipline).
//
// Tailwind styling mirrors ProposedEntryCard convention (rounded
// border, padding, shadow). Consumed by PendingDocumentsView
// (chunk 6.5 chunk 3 canvas-tab surface); also referenced by
// cases/[caseId]/route.ts and ingestBatch.schema.ts.
//
// channel_metadata is pass-through JSONB on the wire; for drag-drop
// at chunk 6.2b / chunk 6.5 chunk 3 chat-input drop it carries
// `drop_session_id`. Chunk 6.3a adds `sender_address` for
// forwarded_mailbox batches.

'use client';

interface DocumentCardData {
  case_id: string;
  state: string;
  source_document_id: string;
  original_filename: string;
  ingest_batch_id: string;
  channel_metadata: Record<string, unknown>;
  received_at: string;
  created_at: string;
}

export type DocumentCardAction = 'review' | 'view_receipt' | 're_process';

interface Props {
  card: DocumentCardData;
  onAction?: (action: DocumentCardAction, caseId: string) => void;
}

// State badge color mapping per chunk 7.3 brief §4 value pick #6.
// 7-state DocumentCaseStateSchema enum coverage; unknown state falls
// back to gray (defensive — Zod-validated upstream so should not fire).
function stateBadgeClasses(state: string): string {
  switch (state) {
    case 'received':
    case 'classified':
      return 'bg-neutral-100 text-neutral-700 border-neutral-300';
    case 'proposed':
      return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    case 'approved':
      return 'bg-emerald-100 text-emerald-800 border-emerald-300';
    case 'needs_review':
      return 'bg-orange-100 text-orange-800 border-orange-300';
    case 'matched':
      return 'bg-blue-100 text-blue-800 border-blue-300';
    case 'rejected':
      return 'bg-red-100 text-red-800 border-red-300';
    default:
      return 'bg-neutral-100 text-neutral-500 border-neutral-300';
  }
}

// State-specific action affordances per chunk 7.3 brief §4 value pick #6.
// rejected = terminal → no action; received/classified/matched = in-flight
// → no action; proposed = "Review"; approved = "View receipt";
// needs_review = "Re-process".
function actionForState(
  state: string,
): { label: string; action: DocumentCardAction } | null {
  switch (state) {
    case 'proposed':
      return { label: 'Review', action: 'review' };
    case 'approved':
      return { label: 'View receipt', action: 'view_receipt' };
    case 'needs_review':
      return { label: 'Re-process', action: 're_process' };
    case 'received':
    case 'classified':
    case 'matched':
    case 'rejected':
    default:
      return null;
  }
}

export function DocumentCard({ card, onAction }: Props) {
  // drop_session_id is the channel_metadata field for drag-drop
  // batches (Sub-Q1 lock). For forwarded_mailbox at chunk 6.3,
  // `sender_address` will replace this position.
  const dropSessionId =
    typeof card.channel_metadata?.drop_session_id === 'string'
      ? card.channel_metadata.drop_session_id
      : undefined;

  const stateAction = actionForState(card.state);

  return (
    <div
      className="rounded-lg border border-neutral-300 bg-white p-3 shadow-sm"
      data-testid="document-card"
      data-case-id={card.case_id}
      data-state={card.state}
    >
      <div className="flex items-start justify-between gap-2">
        <div
          className="text-sm font-medium text-neutral-800 truncate"
          title={card.original_filename}
          data-testid="document-card-filename"
        >
          {card.original_filename}
        </div>
        <div
          className={`shrink-0 inline-flex items-center rounded border px-1.5 py-0.5 text-xs uppercase tracking-wider ${stateBadgeClasses(card.state)}`}
          data-testid="document-card-state"
        >
          {card.state}
        </div>
      </div>

      {dropSessionId && (
        <div
          className="mt-2 text-xs text-neutral-400 font-mono truncate"
          title={dropSessionId}
          data-testid="document-card-drop-session"
        >
          drop: {dropSessionId.slice(0, 8)}
        </div>
      )}

      <div className="mt-1 text-xs text-neutral-400">
        {new Date(card.received_at).toLocaleString()}
      </div>

      {stateAction && (
        <div className="mt-2">
          <button
            type="button"
            onClick={() => onAction?.(stateAction.action, card.case_id)}
            disabled={!onAction}
            className="text-xs font-medium rounded border border-neutral-300 bg-white px-2 py-1 text-neutral-800 hover:bg-neutral-50 disabled:opacity-50"
            data-testid={`document-card-action-${stateAction.action}`}
          >
            {stateAction.label}
          </button>
        </div>
      )}
    </div>
  );
}
