// src/components/canvas/DocumentCard.tsx
//
// Phase 6 chunk 6.2b: per-document card. Renders Sub-Q2.1 columns
// (case_id, state, source_document_id, original_filename,
// ingest_batch_id, channel_metadata, received_at, created_at).
//
// Tailwind styling mirrors ProposedEntryCard convention (rounded
// border, padding, shadow). Consumed by PendingDocumentsView
// (chunk 6.5 chunk 3 canvas-tab surface) post-Phase-6.5; also
// referenced by cases/[caseId]/route.ts and ingestBatch.schema.ts.
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

interface Props {
  card: DocumentCardData;
}

export function DocumentCard({ card }: Props) {
  // drop_session_id is the channel_metadata field for drag-drop
  // batches (Sub-Q1 lock). For forwarded_mailbox at chunk 6.3,
  // `sender_address` will replace this position.
  const dropSessionId =
    typeof card.channel_metadata?.drop_session_id === 'string'
      ? card.channel_metadata.drop_session_id
      : undefined;

  return (
    <div
      className="rounded-lg border border-neutral-300 bg-white p-3 shadow-sm"
      data-testid="document-card"
      data-case-id={card.case_id}
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
          className="text-xs uppercase tracking-wider text-neutral-500 shrink-0"
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
    </div>
  );
}
