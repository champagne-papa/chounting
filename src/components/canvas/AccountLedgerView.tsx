'use client';

import { useState, useEffect } from 'react';
import type { CanvasNavigateFn } from '@/shared/types/canvasDirective';
import type { AccountLedgerResult } from '@/services/reporting/accountLedgerService';
import type { FiscalPeriodListItem } from '@/services/accounting/periodService';

export interface AccountLedgerViewProps {
  orgId: string;
  accountId: string;
  periodId?: string;
  onNavigate: CanvasNavigateFn;
}

export function AccountLedgerView({ orgId, accountId, periodId, onNavigate }: AccountLedgerViewProps) {
  const [data, setData] = useState<AccountLedgerResult | null>(null);
  const [periods, setPeriods] = useState<FiscalPeriodListItem[]>([]);
  const [selectedPeriodId, setSelectedPeriodId] = useState<string | undefined>(periodId);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch periods once on mount
  useEffect(() => {
    let cancelled = false;
    fetch(`/api/orgs/${orgId}/fiscal-periods`)
      .then((r) => r.json())
      .then((data: { periods: FiscalPeriodListItem[] }) => {
        if (!cancelled) setPeriods(data.periods ?? []);
      })
      .catch(() => {
        // Non-fatal — dropdown just shows "All Periods" only
      });
    return () => {
      cancelled = true;
    };
  }, [orgId]);

  // Fetch ledger data on mount and when period changes
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    const url = selectedPeriodId
      ? `/api/orgs/${orgId}/reports/account-ledger?accountId=${accountId}&periodId=${selectedPeriodId}`
      : `/api/orgs/${orgId}/reports/account-ledger?accountId=${accountId}`;

    fetch(url)
      .then(async (r) => {
        if (!r.ok) {
          const body = await r.json().catch(() => ({}));
          throw new Error(body.error || body.message || 'Failed to load account ledger');
        }
        return r.json();
      })
      .then((result: AccountLedgerResult) => {
        if (!cancelled) {
          setData(result);
          setLoading(false);
        }
      })
      .catch((err: Error) => {
        if (!cancelled) {
          setError(err.message);
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [orgId, accountId, selectedPeriodId]);

  if (loading) {
    return <div className="text-sm text-neutral-400">Loading account ledger...</div>;
  }

  if (error) {
    return <div className="text-sm text-red-600">{error}</div>;
  }

  if (!data) {
    return <div className="text-sm text-neutral-400">No data.</div>;
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-2">
        <button
          className="text-sm text-blue-600 hover:underline"
          onClick={() =>
            onNavigate({
              type: 'report_trial_balance',
              orgId,
              periodId: selectedPeriodId,
            })
          }
        >
          &larr; Back to Trial Balance
        </button>
      </div>

      <h2 className="text-lg font-semibold">
        Ledger for {data.account.code} &mdash; {data.account.name}
      </h2>
      <p className="text-xs text-neutral-500 mb-4">Type: {data.account.type}</p>

      {/* Period filter dropdown */}
      <div className="mb-6">
        <label className="block text-xs text-neutral-500 mb-1">Period</label>
        <select
          value={selectedPeriodId ?? ''}
          onChange={(e) => setSelectedPeriodId(e.target.value || undefined)}
          className="border border-neutral-300 rounded px-2 py-1 text-sm"
        >
          <option value="">All Periods</option>
          {periods.map((p) => (
            <option key={p.period_id} value={p.period_id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      {data.rows.length === 0 ? (
        <div className="text-sm text-neutral-400">
          No activity for this account{selectedPeriodId ? ' in the selected period' : ''}.
        </div>
      ) : (
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr>
              <th className="text-right text-xs uppercase tracking-wide text-neutral-500 border-b border-neutral-200 pb-2">Entry #</th>
              <th className="text-left text-xs uppercase tracking-wide text-neutral-500 border-b border-neutral-200 pb-2">Date</th>
              <th className="text-left text-xs uppercase tracking-wide text-neutral-500 border-b border-neutral-200 pb-2">Description</th>
              <th className="text-right text-xs uppercase tracking-wide text-neutral-500 border-b border-neutral-200 pb-2">Debit</th>
              <th className="text-right text-xs uppercase tracking-wide text-neutral-500 border-b border-neutral-200 pb-2">Credit</th>
              <th className="text-right text-xs uppercase tracking-wide text-neutral-500 border-b border-neutral-200 pb-2">Running Balance</th>
            </tr>
          </thead>
          <tbody>
            {data.rows.map((row) => (
              <tr
                key={row.journal_entry_id}
                className="border-b border-neutral-100 hover:bg-neutral-50 cursor-pointer"
                onClick={() =>
                  onNavigate({
                    type: 'journal_entry',
                    orgId,
                    entryId: row.journal_entry_id,
                    mode: 'view',
                  })
                }
              >
                <td className="py-2 text-right">{row.entry_number}</td>
                <td className="py-2">{row.entry_date}</td>
                <td className="py-2">{row.description}</td>
                <td className="py-2 text-right font-mono">
                  {row.debit_amount !== '0.0000' ? row.debit_amount : ''}
                </td>
                <td className="py-2 text-right font-mono">
                  {row.credit_amount !== '0.0000' ? row.credit_amount : ''}
                </td>
                <td className="py-2 text-right font-mono">{row.running_balance}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
