// src/components/canvas/ReviewCaseDetailView.tsx
//
// Wave 6 D3 T7 — the review case detail panel. Renders the org-verified
// case + the REBUILT proposal preview (GET
// /api/orgs/[orgId]/review/cases/[caseId] — brief D-2
// rebuild-not-persist) and the three action surfaces:
//
//   - Approve & Post (POST .../approve-post) — ONLY when the preview
//     says postable (the unmatched entry-card population per the T5
//     population-mapping correction; the route's builders re-verify and
//     are authoritative — a 409 NOT_POSTABLE here renders the banner).
//   - Reject (POST .../reject) — reason required (Zod-mirrored at the
//     form grain: the button stays disabled until a reason is typed).
//   - Resolve exception (POST .../resolve-exception) — the existing
//     chunk-6 9-action machinery, shown only for exception-bearing
//     cases (brief D-5: wiring only).
//
// NOT_POSTABLE steering: the banner names the reason and points at the
// resolve/reject actions (attachment-kind cases have nothing to post;
// bundle/missing-fields cases route to manual entry).
//
// Rendered in-view by ReviewInboxView (selectedCaseId swap) — one
// canvas directive at v1; a separate review_case_detail directive is
// deliberately deferred until cross-tab deep-linking earns its keep.

'use client';

import { useCallback, useEffect, useState } from 'react';

interface Props {
  orgId: string;
  caseId: string;
  onBack: () => void;
}

interface PreviewPayload {
  document_case: {
    id: string;
    state: string;
    document_type: string;
    classification_confidence: number | null;
    created_at: string;
  };
  source_document: {
    original_filename: string;
    mime_type: string;
    original_byte_size: number;
  } | null;
  candidates: Array<{
    id: string;
    linked_entity_type: string;
    linked_entity_id: string | null;
    link_role: string;
    confidence_score: number;
  }>;
  open_exception: {
    exception_queue_entry_id: string;
    exception_reason: string;
  } | null;
  proposal: { kind: string } | null;
  extracted_fields: Record<string, unknown>;
  vendor_match: { vendor_id: string | null; match_type: string } | null;
  postable: boolean;
  not_postable_reason: string | null;
  // Board #4 T2.5 — per-invoice α cards for a multi-invoice case; null for
  // single-invoice / α-absent cases (which render the single card above).
  invoices: Array<{
    ordinal: number;
    document_type: string;
    extracted_fields: Record<string, unknown>;
    vendor_match: { vendor_id: string | null; match_type: string } | null;
    proposal: { kind: string } | null;
    postable: boolean;
    not_postable_reason: string | null;
    post_status: string;
    posted_bill_id: string | null;
  }> | null;
  posted_journal_entries: Array<{
    journal_entry_id: string;
    entry_number: number;
    source_external_id: string;
  }>;
}

type ViewState =
  | { kind: 'loading' }
  | { kind: 'loaded'; preview: PreviewPayload }
  | { kind: 'acting'; preview: PreviewPayload }
  | { kind: 'done'; message: string }
  | { kind: 'error'; message: string };

// The chunk-6 9-action resolution set (migration 20240148; landing
// states proposed/rejected/classified per the RPC mapping).
const RESOLUTION_ACTIONS = [
  'attach_to_existing_bill',
  'attach_to_existing_payment',
  'record_bill_payment',
  'route_to_manual_entry',
  'manual_born_paid_workflow',
  'mark_duplicate',
  'mark_non_accounting',
  'archive',
  'reprocess',
] as const;

export function ReviewCaseDetailView({ orgId, caseId, onBack }: Props) {
  const [state, setState] = useState<ViewState>({ kind: 'loading' });
  const [rejectReason, setRejectReason] = useState('');
  const [resolutionAction, setResolutionAction] = useState<string>(
    'route_to_manual_entry',
  );

  const fetchPreview = useCallback(async () => {
    setState({ kind: 'loading' });
    try {
      const res = await fetch(`/api/orgs/${orgId}/review/cases/${caseId}`);
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
      setState({ kind: 'loaded', preview: (await res.json()) as PreviewPayload });
    } catch {
      setState({ kind: 'error', message: 'network error' });
    }
  }, [orgId, caseId]);

  useEffect(() => {
    void fetchPreview();
  }, [fetchPreview]);

  async function act(
    segment: string,
    body: Record<string, unknown> | undefined,
    doneMessage: string,
  ) {
    if (state.kind !== 'loaded') return;
    setState({ kind: 'acting', preview: state.preview });
    try {
      const res = await fetch(
        `/api/orgs/${orgId}/review/cases/${caseId}/${segment}`,
        {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: body === undefined ? undefined : JSON.stringify(body),
        },
      );
      const resBody = (await res.json().catch(() => ({}))) as {
        message?: string;
        error?: string;
        reason?: string;
        status?: string;
        case_state?: string;
      };
      if (!res.ok) {
        setState({
          kind: 'error',
          message:
            resBody.error === 'NOT_POSTABLE'
              ? `Not postable (${resBody.reason ?? 'unknown'}) — use resolve or reject`
              : (resBody.message ?? `${segment} failed (${res.status})`),
        });
        return;
      }
      // Board #4 T3 (3b): a multi-invoice approve-post can partially post
      // (case holds at 'approved' with some α still unposted) — derive an
      // HONEST message from the response rather than always claiming committed.
      const doneMsg =
        segment === 'approve-post' && resBody.case_state
          ? resBody.status === 'partially_posted'
            ? 'Some invoices posted; the case is held at approved — the rest still need attention (resolve or re-approve).'
            : `Posted and committed (${resBody.status ?? 'posted'}).`
          : doneMessage;
      setState({ kind: 'done', message: doneMsg });
    } catch {
      setState({ kind: 'error', message: 'network error' });
    }
  }

  if (state.kind === 'loading') {
    return (
      <div className="flex-1 p-4 text-sm text-neutral-500">Loading case…</div>
    );
  }
  if (state.kind === 'error') {
    return (
      <div className="flex-1 p-4">
        <button
          type="button"
          className="mb-3 text-sm text-blue-600 underline"
          onClick={onBack}
        >
          ← Back to inbox
        </button>
        <div role="alert" className="rounded border border-red-300 bg-red-50 p-3 text-sm text-red-800">
          {state.message}
        </div>
        <button
          type="button"
          className="mt-3 rounded border px-3 py-1 text-sm"
          onClick={() => void fetchPreview()}
        >
          Retry
        </button>
      </div>
    );
  }
  if (state.kind === 'done') {
    return (
      <div className="flex-1 p-4">
        <div role="status" className="rounded border border-green-300 bg-green-50 p-3 text-sm text-green-800">
          {state.message}
        </div>
        <button
          type="button"
          className="mt-3 text-sm text-blue-600 underline"
          onClick={onBack}
        >
          ← Back to inbox
        </button>
      </div>
    );
  }

  const { preview } = state;
  const acting = state.kind === 'acting';
  const fields = Object.entries(preview.extracted_fields);

  return (
    <div className="flex-1 overflow-y-auto p-4">
      <button
        type="button"
        className="mb-3 text-sm text-blue-600 underline"
        onClick={onBack}
      >
        ← Back to inbox
      </button>

      <h2 className="text-lg font-semibold">
        Review · {preview.document_case.document_type} ·{' '}
        <span data-testid="case-state">{preview.document_case.state}</span>
      </h2>
      {preview.source_document ? (
        <p className="text-sm text-neutral-600">
          {preview.source_document.original_filename} (
          {preview.source_document.mime_type},{' '}
          {preview.source_document.original_byte_size} bytes)
        </p>
      ) : null}

      {preview.open_exception ? (
        <div
          data-testid="exception-banner"
          className="mt-3 rounded border border-amber-300 bg-amber-50 p-2 text-sm text-amber-900"
        >
          Exception: {preview.open_exception.exception_reason}
        </div>
      ) : null}

      {preview.posted_journal_entries.length > 0 ? (
        <div className="mt-3 rounded border border-blue-300 bg-blue-50 p-2 text-sm text-blue-900">
          Posted journal entries:{' '}
          {preview.posted_journal_entries
            .map((je) => `#${je.entry_number} (${je.source_external_id})`)
            .join(', ')}
        </div>
      ) : null}

      {preview.invoices ? (
        // Board #4 T2.5 — multi-invoice case: one card per α row (the honest
        // N-card view that replaced the pre-T2.5 merged single card). Post-T3
        // (3b): the case-level Approve & Post below DRIVES the N-bill loop when
        // any α is postable (preview.postable), so these are no longer
        // display-only.
        <>
          <h3 className="mt-4 font-medium">
            Invoices{' '}
            <span
              data-testid="invoice-count"
              className="text-sm font-normal text-neutral-500"
            >
              ({preview.invoices.length} invoices — each posts as its own bill on approve)
            </span>
          </h3>
          {preview.invoices.map((inv) => (
            <div
              key={inv.ordinal}
              data-testid="invoice-card"
              className="mt-3 rounded border border-neutral-200 p-3"
            >
              <h4 className="font-medium">
                Invoice {inv.ordinal}{' '}
                <span className="text-sm font-normal text-neutral-500">
                  {inv.proposal ? inv.proposal.kind : 'none'} ·{' '}
                  {inv.postable
                    ? 'postable'
                    : `not postable (${inv.not_postable_reason ?? '—'})`}
                </span>
              </h4>
              <table className="mt-2 w-full text-sm">
                <tbody>
                  {Object.entries(inv.extracted_fields).length === 0 ? (
                    <tr>
                      <td className="py-1 text-neutral-500">
                        No extracted fields
                      </td>
                    </tr>
                  ) : (
                    Object.entries(inv.extracted_fields).map(([k, v]) => (
                      <tr key={k} className="border-t">
                        <td className="py-1 pr-4 font-mono text-neutral-600">
                          {k}
                        </td>
                        <td className="py-1">{String(v)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
              {inv.vendor_match ? (
                <p className="mt-1 text-sm text-neutral-600">
                  Vendor match: {inv.vendor_match.match_type}
                </p>
              ) : null}
            </div>
          ))}
        </>
      ) : (
        <>
          <h3 className="mt-4 font-medium">
            Rebuilt proposal{' '}
            <span className="text-sm font-normal text-neutral-500">
              {preview.proposal ? preview.proposal.kind : 'none'}
            </span>
          </h3>
          <table className="mt-2 w-full text-sm">
            <tbody>
              {fields.length === 0 ? (
                <tr>
                  <td className="py-1 text-neutral-500">No extracted fields</td>
                </tr>
              ) : (
                fields.map(([k, v]) => (
                  <tr key={k} className="border-t">
                    <td className="py-1 pr-4 font-mono text-neutral-600">{k}</td>
                    <td className="py-1">{String(v)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          {preview.vendor_match ? (
            <p className="mt-1 text-sm text-neutral-600">
              Vendor match: {preview.vendor_match.match_type}
            </p>
          ) : null}
        </>
      )}

      {preview.candidates.length > 0 ? (
        <>
          <h3 className="mt-4 font-medium">Routing candidates (recorded)</h3>
          <ul className="mt-1 list-inside list-disc text-sm">
            {preview.candidates.map((c) => (
              <li key={c.id}>
                {c.linked_entity_type} · {c.link_role} ·{' '}
                {c.confidence_score.toFixed(2)}
              </li>
            ))}
          </ul>
        </>
      ) : null}

      {/* ---- Actions ---- */}
      <div className="mt-6 border-t pt-4">
        {preview.postable ? (
          <button
            type="button"
            data-testid="approve-post"
            disabled={acting}
            className="rounded bg-green-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            onClick={() =>
              void act('approve-post', undefined, 'Posted and committed.')
            }
          >
            Approve &amp; Post
          </button>
        ) : (
          <div
            data-testid="not-postable-banner"
            className="rounded border border-neutral-300 bg-neutral-50 p-2 text-sm text-neutral-700"
          >
            Not postable
            {preview.not_postable_reason
              ? ` (${preview.not_postable_reason})`
              : ''}{' '}
            — resolve the exception or reject below.
          </div>
        )}

        <div className="mt-4 flex items-center gap-2">
          <input
            type="text"
            data-testid="reject-reason"
            placeholder="Reject reason (required)"
            className="w-64 rounded border px-2 py-1 text-sm"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
          />
          <button
            type="button"
            data-testid="reject"
            disabled={acting || rejectReason.trim().length === 0}
            className="rounded bg-red-600 px-3 py-1 text-sm text-white disabled:opacity-50"
            onClick={() =>
              void act('reject', { reason: rejectReason.trim() }, 'Rejected.')
            }
          >
            Reject
          </button>
        </div>

        {preview.open_exception ? (
          <div className="mt-4 flex items-center gap-2">
            <select
              data-testid="resolution-action"
              className="rounded border px-2 py-1 text-sm"
              value={resolutionAction}
              onChange={(e) => setResolutionAction(e.target.value)}
            >
              {RESOLUTION_ACTIONS.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
            <button
              type="button"
              data-testid="resolve-exception"
              disabled={acting}
              className="rounded bg-amber-600 px-3 py-1 text-sm text-white disabled:opacity-50"
              onClick={() =>
                void act(
                  'resolve-exception',
                  {
                    exception_queue_entry_id:
                      preview.open_exception!.exception_queue_entry_id,
                    resolution_action: resolutionAction,
                  },
                  'Exception resolved.',
                )
              }
            >
              Resolve
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
