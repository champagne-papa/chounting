'use client';

import { useState, useEffect } from 'react';
import type { CanvasNavigateFn } from '@/shared/types/canvasDirective';
import type { AccountsByTypeResult } from '@/services/reporting/reportService';
import type { SelectedEntity } from '@/shared/types/canvasContext';
import type { FiscalPeriodListItem } from '@/services/accounting/periodService';

type AccountType = 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';

export interface AccountsByTypeViewProps {
  orgId: string;
  accountType: AccountType;
  periodId?: string;
  onNavigate: CanvasNavigateFn;
  onSelectEntity?: (entity: SelectedEntity) => void;
}

const TYPE_LABELS: Record<AccountType, string> = {
  asset: 'Asset',
  liability: 'Liability',
  equity: 'Equity',
  revenue: 'Revenue',
  expense: 'Expense',
};

export function AccountsByTypeView({
  orgId,
  accountType,
  periodId,
  onNavigate,
  onSelectEntity,
}: AccountsByTypeViewProps) {
  const [data, setData] = useState<AccountsByTypeResult | null>(null);
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

  // Fetch accounts-by-type data on mount and when period or accountType changes
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    const base = `/api/orgs/${orgId}/reports/accounts-by-type?accountType=${accountType}`;
    const url = selectedPeriodId ? `${base}&periodId=${selectedPeriodId}` : base;

    fetch(url)
      .then(async (r) => {
        if (!r.ok) {
          const body = await r.json().catch(() => ({}));
          throw new Error(body.error || body.message || 'Failed to load accounts');
        }
        return r.json();
      })
      .then((result: AccountsByTypeResult) => {
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
  }, [orgId, accountType, selectedPeriodId]);

  if (loading) {
    return <div className="text-sm text-neutral-400">Loading accounts...</div>;
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
              type: 'report_pl',
              orgId,
              periodId: selectedPeriodId,
            })
          }
        >
          &larr; Back to P&amp;L
        </button>
      </div>

      <h2 className="text-lg font-semibold mb-4">{TYPE_LABELS[accountType]} Accounts</h2>

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
          No {accountType} accounts with activity{selectedPeriodId ? ' in the selected period' : ''}.
        </div>
      ) : (
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr>
              <th className="text-left text-xs uppercase tracking-wide text-neutral-500 border-b border-neutral-200 pb-2 pr-4">Account</th>
              <th className="text-right text-xs uppercase tracking-wide text-neutral-500 border-b border-neutral-200 pb-2 pr-4">Debit</th>
              <th className="text-right text-xs uppercase tracking-wide text-neutral-500 border-b border-neutral-200 pb-2">Credit</th>
            </tr>
          </thead>
          <tbody>
            {data.rows.map((row) => (
              <tr
                key={row.account_id}
                className="border-b border-neutral-100 hover:bg-neutral-50 cursor-pointer"
                onClick={() => {
                  onSelectEntity?.({
                    type: 'account',
                    id: row.account_id,
                    display_name: `${row.account_code} — ${row.account_name}`,
                  });
                  onNavigate({
                    type: 'report_account_ledger',
                    orgId,
                    accountId: row.account_id,
                    periodId: selectedPeriodId,
                  });
                }}
              >
                <td className="py-2 pr-4">
                  {row.account_code} &mdash; {row.account_name}
                </td>
                <td className="py-2 pr-4 text-right font-mono">
                  {row.debit_total_cad !== '0.0000' ? row.debit_total_cad : ''}
                </td>
                <td className="py-2 text-right font-mono">
                  {row.credit_total_cad !== '0.0000' ? row.credit_total_cad : ''}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
