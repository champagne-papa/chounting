// src/components/canvas/DocumentIntakeRail.tsx
//
// Phase 6 chunk 6.2b: the canvas's vertical intake rail. Drag-and-
// drop affordance for PDFs / images per PRD Phase 2 vision
// (docs/01_prd/triage_bucket_intake.md:3 "vertical intake rail on
// the far right of the canvas"). Sub-Q1 lock: canvas-only — this
// component is the entirety of the drag-drop UX surface at v1.
//
// First drag-drop UI in the codebase per chunk 6.2b verify-from-disk
// (Grain 5 zero-count scan returned zero existing patterns). Uses
// native HTML5 onDragOver / onDrop events — no react-dropzone, no
// external library (MF-5 first-instance precedent to codify at chunk
// close).
//
// On drop:
//   1. Generate a fresh drop_session_id (UUID per drop event; Flag 1
//      lock — client-generated; server trusts client value).
//   2. Construct FormData: drop_session_id field + N files field
//      entries.
//   3. POST to /api/orgs/[orgId]/documents/ingest/drag-drop.
//   4. On 201: refresh cards list (GET cards endpoint with the new
//      ingest_batch_id).
//   5. On error: surface ServiceError.details inline (Sub-Q9 R1
//      mitigation — file_index + filename + stage carries through).
//
// State machine:
//   - 'idle': dropzone visible, accepting drops
//   - 'uploading': during fetch in flight; show file count + progress
//   - 'showing-batch': after success; show cards from the latest batch
//   - 'error': after failure; show ServiceError details + reset button

'use client';

import { useState, useCallback } from 'react';
import { DocumentCard } from './DocumentCard';

interface Props {
  orgId: string;
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

type IntakeState =
  | { kind: 'idle' }
  | { kind: 'uploading'; file_count: number }
  | {
      kind: 'showing_batch';
      ingest_batch_id: string;
      cards: BatchCard[];
    }
  | {
      kind: 'error';
      code: string;
      message: string;
      details?: {
        file_index?: number;
        filename?: string;
        stage?: string;
      };
    };

export function DocumentIntakeRail({ orgId }: Props) {
  const [state, setState] = useState<IntakeState>({ kind: 'idle' });
  const [dragOver, setDragOver] = useState(false);

  const handleDrop = useCallback(
    async (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setDragOver(false);

      const fileList = Array.from(e.dataTransfer.files);
      if (fileList.length === 0) return;

      // Sub-Q1 lock: client-generated drop_session_id per drop event.
      const drop_session_id = crypto.randomUUID();

      const formData = new FormData();
      formData.append('drop_session_id', drop_session_id);
      for (const file of fileList) {
        formData.append('files', file);
      }

      setState({ kind: 'uploading', file_count: fileList.length });

      try {
        const res = await fetch(
          `/api/orgs/${orgId}/documents/ingest/drag-drop`,
          {
            method: 'POST',
            body: formData,
          },
        );
        if (!res.ok) {
          const errBody = (await res.json().catch(() => ({}))) as {
            error?: string;
            message?: string;
            details?: IntakeState extends { kind: 'error' }
              ? IntakeState['details']
              : never;
          };
          setState({
            kind: 'error',
            code: errBody.error ?? 'UNKNOWN_ERROR',
            message: errBody.message ?? `HTTP ${res.status}`,
            details: errBody.details as
              | { file_index?: number; filename?: string; stage?: string }
              | undefined,
          });
          return;
        }
        const body = (await res.json()) as {
          ingest_batch_id: string;
          document_count: number;
        };

        // Fetch cards for the new batch.
        const cardsRes = await fetch(
          `/api/orgs/${orgId}/documents/cases?ingest_batch_id=${body.ingest_batch_id}`,
        );
        const cardsBody = cardsRes.ok
          ? ((await cardsRes.json()) as { cards: BatchCard[] })
          : { cards: [] as BatchCard[] };
        setState({
          kind: 'showing_batch',
          ingest_batch_id: body.ingest_batch_id,
          cards: cardsBody.cards,
        });
      } catch (err) {
        setState({
          kind: 'error',
          code: 'NETWORK_ERROR',
          message: err instanceof Error ? err.message : String(err),
        });
      }
    },
    [orgId],
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setDragOver(true);
    },
    [],
  );

  const handleDragLeave = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setDragOver(false);
    },
    [],
  );

  const handleReset = useCallback(() => {
    setState({ kind: 'idle' });
  }, []);

  return (
    <aside
      className="w-[320px] flex flex-col border-l border-neutral-200 bg-neutral-50"
      data-testid="document-intake-rail"
    >
      <div className="h-10 border-b border-neutral-200 flex items-center px-3">
        <div className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
          Intake
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`rounded border-2 border-dashed p-6 text-center text-sm transition-colors ${
            dragOver
              ? 'border-blue-500 bg-blue-50 text-blue-700'
              : 'border-neutral-300 bg-white text-neutral-500'
          }`}
          data-testid="document-intake-dropzone"
        >
          {state.kind === 'uploading' ? (
            <div data-testid="document-intake-uploading">
              Uploading {state.file_count} file
              {state.file_count === 1 ? '' : 's'}...
            </div>
          ) : (
            <div>
              Drop PDFs, PNGs, JPEGs, or TIFFs here
              <div className="text-xs text-neutral-400 mt-2">
                Multiple files supported per drop
              </div>
            </div>
          )}
        </div>

        {state.kind === 'error' && (
          <div
            className="rounded border border-red-300 bg-red-50 p-3 text-xs text-red-700"
            data-testid="document-intake-error"
          >
            <div className="font-semibold uppercase tracking-wider mb-1">
              {state.code}
            </div>
            <div>{state.message}</div>
            {state.details?.filename && state.details?.stage && (
              <div className="mt-2 text-red-600">
                File {(state.details.file_index ?? 0) + 1}:{' '}
                {state.details.filename} (stage: {state.details.stage})
              </div>
            )}
            <button
              type="button"
              onClick={handleReset}
              className="mt-3 text-xs underline hover:text-red-900"
            >
              Try again
            </button>
          </div>
        )}

        {state.kind === 'showing_batch' && (
          <div data-testid="document-intake-batch-cards">
            <div className="text-xs text-neutral-500 mb-2">
              Last drop · {state.cards.length} card
              {state.cards.length === 1 ? '' : 's'}
            </div>
            <div className="space-y-2">
              {state.cards.map((card) => (
                <DocumentCard key={card.case_id} card={card} />
              ))}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
