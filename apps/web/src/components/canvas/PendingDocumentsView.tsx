// src/components/canvas/PendingDocumentsView.tsx
//
// Phase 6.5 chunk 3: the pending-documents canvas view. Renders the
// document_cases queue surface in the multi-tab canvas (Zone 3),
// reachable via:
//   (a) Pattern γ Rule 1 drop event → new canvas tab focused
//       (chunk 3 AgentChatPanel chat-input drop → SplitScreenLayout
//       handleDropEvent → canvasTabRouting.routeNewTab); ingestBatchId
//       Prop carries the just-created batch id so the view focuses
//       on the new batch's cards.
//   (b) Pattern γ Rule 3 Zone 1 Billing "Pending Documents" nav →
//       routeReplaceActive replaces active tab with pending_documents
//       directive; no ingestBatchId Prop; view renders recent-N-cards
//       across all batches.
//
// Ports DocumentIntakeRail's mount-fetch state machine
// (idle → fetching_recent → idle_with_recent_cards/error) and
// extends it with batch-focused fetch (fetching_batch → showing_batch
// with fallback to fetching_recent on batch-fetch failure). Drop
// affordance is INTENTIONALLY ABSENT — drag-drop UX surface moved to
// AgentChatPanel chat input per Phase 6.5 chunk 3 Cut 1 Flow (a)
// re-entry-point. DocumentCard rendering inherited unchanged (shared
// component; also consumed by cases/[caseId]/route.ts and
// ingestBatch.schema.ts).
//
// State machine (6 states):
//   - 'idle': initial pre-mount state (transient)
//   - 'fetching_recent': mount-time GET in flight (no batch_id)
//   - 'idle_with_recent_cards': recent N cards rendered
//   - 'fetching_batch': mount-time GET in flight for specific batch
//   - 'showing_batch': batch-specific cards rendered
//   - 'error': fetch failure
//
// Mount behavior: if ingestBatchId Prop provided, fetch batch-specific
// cards via /api/orgs/[orgId]/documents/cases?ingest_batch_id={id};
// on success → showing_batch; on failure → fallback to fetching_recent
// (defensive: empirical batch may not yet be queryable due to RPC
// commit timing). If no ingestBatchId, fetch recent N cards via
// /api/orgs/[orgId]/documents/cases?limit=50; soft-fail to idle.
//
// Container shape: flex-1 (fills tab content area; NOT w-[320px]
// sidebar dimensions like pre-Phase-6.5 DocumentIntakeRail). Section
// header is a single canonical heading ("Pending Documents · N
// cards"). No "Recent" vs "Last drop" discrimination at tab grain —
// the ingestBatchId Prop already discriminates batch-focused vs
// recent-cards-across-batches; section header narrates the current
// state succinctly.

'use client';

import { useEffect, useState } from 'react';
import { DocumentCard } from './DocumentCard';

interface Props {
  orgId: string;
  ingestBatchId?: string;
}

interface BatchCard {
  case_id: string;
  state: string;
  source_document_id: string;
  original_filename: string;
  ingest_batch_id: string;
  channel_metadata: Record<string, unknown>;
  received_at: string;
  created_at: string;
}

type ViewState =
  | { kind: 'idle' }
  | { kind: 'fetching_recent' }
  | { kind: 'idle_with_recent_cards'; cards: BatchCard[] }
  | { kind: 'fetching_batch' }
  | {
      kind: 'showing_batch';
      ingest_batch_id: string;
      cards: BatchCard[];
    }
  | {
      kind: 'error';
      code: string;
      message: string;
    };

// Recent-cards limit per chunk-6.3a Sub-Q10 lock (v1 anchor pending
// operator feedback). Matches DocumentIntakeRail line 83 precedent.
const RECENT_CARDS_LIMIT = 50;

export function PendingDocumentsView({ orgId, ingestBatchId }: Props) {
  const [state, setState] = useState<ViewState>({ kind: 'idle' });

  // Mount-fetch behavior. Two branches per ingestBatchId presence:
  //   (a) ingestBatchId provided → fetch batch-specific cards;
  //       fallback to recent-cards fetch on failure.
  //   (b) no ingestBatchId → fetch recent N cards.
  // Cancellation via `cancelled` flag (mirrors DocumentIntakeRail
  // line 94 precedent; defensive against rapid Prop changes /
  // unmount races).
  useEffect(() => {
    let cancelled = false;

    async function fetchBatch(batchId: string) {
      setState({ kind: 'fetching_batch' });
      try {
        const res = await fetch(
          `/api/orgs/${orgId}/documents/cases?ingest_batch_id=${batchId}`,
        );
        if (cancelled) return;
        if (!res.ok) {
          // Batch-fetch failed; fall through to recent-cards fetch
          // (the just-created batch may not yet be queryable due to
          // RPC commit timing; recent-cards branch picks it up
          // alongside other recent batches).
          await fetchRecent();
          return;
        }
        const body = (await res.json()) as { cards: BatchCard[] };
        if (cancelled) return;
        setState({
          kind: 'showing_batch',
          ingest_batch_id: batchId,
          cards: body.cards ?? [],
        });
      } catch {
        if (cancelled) return;
        // Network failure on batch path; soft-fall to recent-cards.
        await fetchRecent();
      }
    }

    async function fetchRecent() {
      setState({ kind: 'fetching_recent' });
      try {
        const res = await fetch(
          `/api/orgs/${orgId}/documents/cases?limit=${RECENT_CARDS_LIMIT}`,
        );
        if (cancelled) return;
        if (!res.ok) {
          // Soft-fail: revert to idle so the empty-state copy renders;
          // the view stays mounted and the user can re-navigate.
          setState({ kind: 'idle' });
          return;
        }
        const body = (await res.json()) as { cards: BatchCard[] };
        if (cancelled) return;
        setState({ kind: 'idle_with_recent_cards', cards: body.cards ?? [] });
      } catch {
        if (cancelled) return;
        setState({ kind: 'idle' });
      }
    }

    if (ingestBatchId) {
      fetchBatch(ingestBatchId);
    } else {
      fetchRecent();
    }

    return () => {
      cancelled = true;
    };
  }, [orgId, ingestBatchId]);

  // Render branches per state.
  if (state.kind === 'idle' || state.kind === 'fetching_recent' || state.kind === 'fetching_batch') {
    return (
      <div
        className="flex flex-1 flex-col"
        data-testid="pending-documents-view"
        data-state={state.kind}
      >
        <div className="border-b border-neutral-200 px-6 py-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-500">
            Pending Documents
          </h2>
        </div>
        <div className="flex-1 px-6 py-4 text-sm text-neutral-400">
          {state.kind === 'idle'
            ? 'No pending documents yet. Drop files into the chat input to ingest.'
            : 'Loading...'}
        </div>
      </div>
    );
  }

  if (state.kind === 'error') {
    return (
      <div
        className="flex flex-1 flex-col"
        data-testid="pending-documents-view"
        data-state="error"
      >
        <div className="border-b border-neutral-200 px-6 py-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-500">
            Pending Documents
          </h2>
        </div>
        <div className="flex-1 px-6 py-4">
          <div
            className="rounded border border-red-300 bg-red-50 p-3 text-xs text-red-700"
            data-testid="pending-documents-error"
          >
            <div className="mb-1 font-semibold uppercase tracking-wider">
              {state.code}
            </div>
            <div>{state.message}</div>
          </div>
        </div>
      </div>
    );
  }

  // Cards-rendered branches: showing_batch (focused on one batch) and
  // idle_with_recent_cards (recent-N across all batches). Visual
  // treatment identical; section header narrates the scope.
  const cards =
    state.kind === 'showing_batch' ? state.cards : state.cards;
  const headingNarrative =
    state.kind === 'showing_batch'
      ? `Pending Documents · ${cards.length} card${cards.length === 1 ? '' : 's'} (just dropped)`
      : `Pending Documents · ${cards.length} card${cards.length === 1 ? '' : 's'}`;

  return (
    <div
      className="flex flex-1 flex-col"
      data-testid="pending-documents-view"
      data-state={state.kind}
    >
      <div className="border-b border-neutral-200 px-6 py-3">
        <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-500">
          {headingNarrative}
        </h2>
      </div>
      <div
        className="flex-1 overflow-y-auto px-6 py-4"
        data-testid={
          state.kind === 'showing_batch'
            ? 'pending-documents-batch-cards'
            : 'pending-documents-recent-cards'
        }
      >
        {cards.length === 0 ? (
          <div className="text-sm text-neutral-400">
            No pending documents.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
            {cards.map((card) => (
              <DocumentCard key={card.case_id} card={card} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
