// src/components/canvas/ReviewInboxView.tsx
//
// Wave 6 D3 T7 — the review inbox canvas view (Zone 3). Lists the
// review-track cases (GET /api/orgs/[orgId]/review/cases): both
// populations in one list per brief D-5 — exception-bearing cases wear
// the exception badge; approved cases wear the post-status badge (the
// D-4 stranding window, operator-visible). Clicking a row swaps to the
// in-view ReviewCaseDetailView (selectedCaseId state — one canvas
// directive at v1; PendingDocumentsView mount-fetch state-machine
// idiom).

'use client';

import { useCallback, useEffect, useState } from 'react';
import { ReviewCaseDetailView } from './ReviewCaseDetailView';

interface Props {
  orgId: string;
}

interface InboxRow {
  document_case_id: string;
  state: string;
  document_type: string;
  classification_confidence: number | null;
  created_at: string;
  open_exception: {
    exception_queue_entry_id: string;
    exception_reason: string;
  } | null;
  posted: boolean;
}

type ViewState =
  | { kind: 'idle' }
  | { kind: 'fetching' }
  | { kind: 'loaded'; cases: InboxRow[] }
  | { kind: 'error'; message: string };

const INBOX_LIMIT = 200;

export function ReviewInboxView({ orgId }: Props) {
  const [state, setState] = useState<ViewState>({ kind: 'idle' });
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);

  const fetchInbox = useCallback(async () => {
    setState({ kind: 'fetching' });
    try {
      const res = await fetch(
        `/api/orgs/${orgId}/review/cases?limit=${INBOX_LIMIT}`,
      );
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as {
          message?: string;
        };
        setState({
          kind: 'error',
          message: body.message ?? `fetch failed (${res.status})`,
        });
        return;
      }
      const body = (await res.json()) as { cases: InboxRow[] };
      setState({ kind: 'loaded', cases: body.cases });
    } catch {
      setState({ kind: 'error', message: 'network error' });
    }
  }, [orgId]);

  useEffect(() => {
    if (selectedCaseId === null) void fetchInbox();
  }, [fetchInbox, selectedCaseId]);

  if (selectedCaseId !== null) {
    return (
      <ReviewCaseDetailView
        orgId={orgId}
        caseId={selectedCaseId}
        onBack={() => setSelectedCaseId(null)}
      />
    );
  }

  if (state.kind === 'idle' || state.kind === 'fetching') {
    return (
      <div className="flex-1 p-4 text-sm text-neutral-500">
        Loading review inbox…
      </div>
    );
  }
  if (state.kind === 'error') {
    return (
      <div className="flex-1 p-4">
        <div role="alert" className="rounded border border-red-300 bg-red-50 p-3 text-sm text-red-800">
          {state.message}
        </div>
        <button
          type="button"
          className="mt-3 rounded border px-3 py-1 text-sm"
          onClick={() => void fetchInbox()}
        >
          Retry
        </button>
      </div>
    );
  }

  const { cases } = state;
  return (
    <div className="flex-1 overflow-y-auto p-4">
      <h2 className="text-lg font-semibold">
        Review Inbox · {cases.length} case{cases.length === 1 ? '' : 's'}
      </h2>
      {cases.length === 0 ? (
        <p className="mt-2 text-sm text-neutral-500">
          Nothing awaiting review.
        </p>
      ) : (
        <ul className="mt-3 divide-y" data-testid="inbox-list">
          {cases.map((c) => (
            <li key={c.document_case_id}>
              <button
                type="button"
                className="flex w-full items-center gap-3 py-2 text-left text-sm hover:bg-neutral-50"
                onClick={() => setSelectedCaseId(c.document_case_id)}
              >
                <span className="rounded bg-neutral-200 px-2 py-0.5 text-xs font-medium">
                  {c.state}
                </span>
                <span className="flex-1">{c.document_type}</span>
                {c.open_exception ? (
                  <span
                    data-testid={`exception-badge-${c.document_case_id}`}
                    className="rounded bg-amber-100 px-2 py-0.5 text-xs text-amber-900"
                  >
                    {c.open_exception.exception_reason}
                  </span>
                ) : null}
                {c.state === 'approved' ? (
                  <span
                    data-testid={`post-status-${c.document_case_id}`}
                    className={
                      c.posted
                        ? 'rounded bg-blue-100 px-2 py-0.5 text-xs text-blue-900'
                        : 'rounded bg-neutral-100 px-2 py-0.5 text-xs text-neutral-600'
                    }
                  >
                    {c.posted ? 'posted — awaiting commit mark' : 'not posted'}
                  </span>
                ) : null}
                <span className="text-xs text-neutral-400">
                  {new Date(c.created_at).toLocaleDateString()}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
