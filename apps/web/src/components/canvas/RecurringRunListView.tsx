// src/components/canvas/RecurringRunListView.tsx
// Phase 0-1.1 Arc A Step 10b — list view for recurring journal runs
// with inline approve (window.confirm) + reject (modal w/ rejection_reason).
// D10b-3 (C1 + C3) ratification.
//
// ADR-0010 Layer 3 UI discipline: renders only Phase 1 status values
// (pending_approval / posted / rejected). No UI path proposes 'approved'.

'use client';

import { useEffect, useState, useCallback } from 'react';
import type { CanvasNavigateFn } from '@/shared/types/canvasDirective';
import type {
  RecurringRunListItem,
  RecurringTemplateListItem,
} from '@/services/accounting/recurringJournalService';

interface Props {
  orgId: string;
  onNavigate: CanvasNavigateFn;
  recurringTemplateId?: string;
}

type RejectModalState = {
  runId: string;
  reason: string;
  submitting: boolean;
  error: string | null;
} | null;

function StatusBadge({ status }: { status: string }) {
  const color =
    status === 'pending_approval'
      ? 'bg-amber-100 text-amber-800'
      : status === 'posted'
        ? 'bg-green-100 text-green-800'
        : status === 'rejected'
          ? 'bg-red-100 text-red-800'
          : 'bg-neutral-100 text-neutral-700';
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${color}`}>
      {status}
    </span>
  );
}

export function RecurringRunListView({ orgId, onNavigate, recurringTemplateId }: Props) {
  const [runs, setRuns] = useState<RecurringRunListItem[]>([]);
  const [templateMap, setTemplateMap] = useState<Map<string, string>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [rejectModal, setRejectModal] = useState<RejectModalState>(null);

  const refresh = useCallback(() => {
    setLoading(true);
    setError(null);
    setActionError(null);

    const runsUrl = recurringTemplateId
      ? `/api/orgs/${orgId}/recurring-runs?recurring_template_id=${recurringTemplateId}`
      : `/api/orgs/${orgId}/recurring-runs`;

    Promise.all([
      fetch(runsUrl).then((res) => {
        if (!res.ok) throw new Error(`Runs fetch failed: HTTP ${res.status}`);
        return res.json() as Promise<{ runs: RecurringRunListItem[]; count: number }>;
      }),
      fetch(`/api/orgs/${orgId}/recurring-templates`).then((res) => {
        if (!res.ok) throw new Error(`Templates fetch failed: HTTP ${res.status}`);
        return res.json() as Promise<{ templates: RecurringTemplateListItem[]; count: number }>;
      }),
    ])
      .then(([runsResponse, templatesResponse]) => {
        setRuns(runsResponse.runs ?? []);
        const map = new Map<string, string>();
        for (const t of templatesResponse.templates ?? []) {
          map.set(t.recurring_template_id, t.template_name);
        }
        setTemplateMap(map);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Failed to load');
        setRuns([]);
      })
      .finally(() => setLoading(false));
  }, [orgId, recurringTemplateId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function handleApprove(run: RecurringRunListItem) {
    if (!window.confirm('Approve and post this run?')) return;
    setActionError(null);
    try {
      const response = await fetch(
        `/api/orgs/${orgId}/recurring-runs/${run.recurring_run_id}/approve`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}),
        },
      );
      if (!response.ok) {
        const body = await response.json().catch(() => ({ error: 'Unknown error' }));
        setActionError(body.message ?? body.error ?? `HTTP ${response.status}`);
        return;
      }
      refresh();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Approve failed');
    }
  }

  function openRejectModal(runId: string) {
    setRejectModal({ runId, reason: '', submitting: false, error: null });
  }

  async function submitReject() {
    if (!rejectModal) return;
    if (rejectModal.reason.trim().length === 0) {
      setRejectModal({ ...rejectModal, error: 'Rejection reason is required' });
      return;
    }
    setRejectModal({ ...rejectModal, submitting: true, error: null });
    try {
      const response = await fetch(
        `/api/orgs/${orgId}/recurring-runs/${rejectModal.runId}/reject`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ rejection_reason: rejectModal.reason }),
        },
      );
      if (!response.ok) {
        const body = await response.json().catch(() => ({ error: 'Unknown error' }));
        setRejectModal({
          ...rejectModal,
          submitting: false,
          error: body.message ?? body.error ?? `HTTP ${response.status}`,
        });
        return;
      }
      setRejectModal(null);
      refresh();
    } catch (err) {
      setRejectModal({
        ...rejectModal,
        submitting: false,
        error: err instanceof Error ? err.message : 'Reject failed',
      });
    }
  }

  const headerTitle = recurringTemplateId
    ? `Recurring Runs — ${templateMap.get(recurringTemplateId) ?? 'Template'}`
    : 'Recurring Runs';

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          {recurringTemplateId && (
            <button
              className="text-sm text-blue-600 hover:underline"
              onClick={() => onNavigate({ type: 'recurring_template_list', orgId })}
            >
              &larr; Back to templates
            </button>
          )}
          <h2 className="text-lg font-semibold">{headerTitle}</h2>
        </div>
      </div>

      {actionError && (
        <div className="mb-4 p-3 border border-red-300 rounded bg-red-50 text-sm text-red-600">
          {actionError}
        </div>
      )}

      {loading && <div className="text-sm text-neutral-400">Loading recurring runs...</div>}
      {error && <div className="text-sm text-red-500">{error}</div>}

      {!loading && !error && runs.length === 0 && (
        <div className="text-sm text-neutral-400">
          No recurring runs yet for this {recurringTemplateId ? 'template' : 'org'}.
        </div>
      )}

      {!loading && !error && runs.length > 0 && (
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b border-neutral-200 text-left">
              <th className="py-2 pr-4 font-medium text-neutral-500">Template</th>
              <th className="py-2 pr-4 font-medium text-neutral-500">Scheduled For</th>
              <th className="py-2 pr-4 font-medium text-neutral-500">Status</th>
              <th className="py-2 font-medium text-neutral-500">Actions / Detail</th>
            </tr>
          </thead>
          <tbody>
            {runs.map((run) => (
              <tr
                key={run.recurring_run_id}
                className="border-b border-neutral-100 hover:bg-neutral-50"
              >
                <td className="py-2 pr-4">
                  {templateMap.get(run.recurring_template_id) ?? '—'}
                </td>
                <td className="py-2 pr-4">{run.scheduled_for}</td>
                <td className="py-2 pr-4">
                  <StatusBadge status={run.status} />
                </td>
                <td className="py-2">
                  {run.status === 'pending_approval' && (
                    <div className="flex gap-2">
                      <button
                        className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700"
                        onClick={() => handleApprove(run)}
                      >
                        Approve
                      </button>
                      <button
                        className="px-3 py-1 border border-red-300 text-red-600 text-xs rounded hover:bg-red-50"
                        onClick={() => openRejectModal(run.recurring_run_id)}
                      >
                        Reject
                      </button>
                    </div>
                  )}
                  {run.status === 'posted' && run.journal_entry_id && (
                    <button
                      className="text-sm text-blue-600 hover:underline"
                      onClick={() =>
                        onNavigate({
                          type: 'journal_entry',
                          orgId,
                          entryId: run.journal_entry_id!,
                          mode: 'view',
                        })
                      }
                    >
                      View journal entry →
                    </button>
                  )}
                  {run.status === 'rejected' && (
                    <span
                      className="text-xs text-neutral-600"
                      title={run.rejection_reason ?? ''}
                    >
                      {run.rejection_reason
                        ? run.rejection_reason.length > 60
                          ? `${run.rejection_reason.slice(0, 57)}…`
                          : run.rejection_reason
                        : '—'}
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Reject modal — D10b-3 (C3) */}
      {rejectModal && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
          onClick={(e) => {
            if (e.target === e.currentTarget && !rejectModal.submitting) {
              setRejectModal(null);
            }
          }}
        >
          <div className="bg-white rounded shadow-lg p-6 w-[480px] max-w-[90vw]">
            <h3 className="text-base font-semibold mb-3">Reject Run</h3>
            {rejectModal.error && (
              <div className="mb-3 p-2 border border-red-300 rounded bg-red-50 text-sm text-red-600">
                {rejectModal.error}
              </div>
            )}
            <label className="block text-sm font-medium text-neutral-600 mb-1">
              Rejection Reason
            </label>
            <textarea
              value={rejectModal.reason}
              onChange={(e) =>
                setRejectModal(
                  rejectModal ? { ...rejectModal, reason: e.target.value, error: null } : null,
                )
              }
              rows={3}
              className="w-full border border-neutral-300 rounded px-2 py-1 text-sm"
              placeholder="Explain why this run is being rejected..."
              disabled={rejectModal.submitting}
            />
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                className="px-3 py-1 border border-neutral-300 text-sm rounded hover:bg-neutral-50 disabled:opacity-40"
                onClick={() => setRejectModal(null)}
                disabled={rejectModal.submitting}
              >
                Cancel
              </button>
              <button
                type="button"
                className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed"
                onClick={submitReject}
                disabled={rejectModal.submitting || rejectModal.reason.trim().length === 0}
              >
                {rejectModal.submitting ? 'Rejecting...' : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
