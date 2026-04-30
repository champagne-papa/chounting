'use client';

import { useState, useEffect } from 'react';
import Decimal from 'decimal.js';
import type { CanvasNavigateFn } from '@/shared/types/canvasDirective';
import type { PLRow } from '@/services/reporting/reportService';
import type { FiscalPeriodListItem } from '@/services/accounting/periodService';

export interface BasicPLViewProps {
  orgId: string;
  onNavigate: CanvasNavigateFn;
}

function computeNetIncome(rows: PLRow[]): string {
  const revenue = rows.find((r) => r.account_type === 'revenue');
  const expense = rows.find((r) => r.account_type === 'expense');

  if (!revenue || !expense) return '0.0000';

  const revenueNet = new Decimal(revenue.credit_total_cad).minus(
    new Decimal(revenue.debit_total_cad)
  );
  const expenseNet = new Decimal(expense.debit_total_cad).minus(
    new Decimal(expense.credit_total_cad)
  );

  return revenueNet.minus(expenseNet).toFixed(4);
}

export function BasicPLView({ orgId, onNavigate }: BasicPLViewProps) {
  const [rows, setRows] = useState<PLRow[] | null>(null);
  const [periods, setPeriods] = useState<FiscalPeriodListItem[]>([]);
  const [selectedPeriodId, setSelectedPeriodId] = useState<string | undefined>(undefined);
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

  // Fetch P&L data on mount and when period changes
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    const url = selectedPeriodId
      ? `/api/orgs/${orgId}/reports/pl?periodId=${selectedPeriodId}`
      : `/api/orgs/${orgId}/reports/pl`;

    fetch(url)
      .then(async (r) => {
        if (!r.ok) {
          const body = await r.json().catch(() => ({}));
          throw new Error(body.error || 'Failed to load P&L');
        }
        return r.json();
      })
      .then((data: { rows: PLRow[] }) => {
        if (!cancelled) {
          setRows(data.rows);
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
  }, [orgId, selectedPeriodId]);

  if (loading) {
    return <div className="text-sm text-neutral-400">Loading P&amp;L...</div>;
  }

  if (error) {
    return <div className="text-sm text-red-600">{error}</div>;
  }

  if (!rows || rows.length === 0) {
    return <div className="text-sm text-neutral-400">No P&amp;L data.</div>;
  }

  const revenueRow = rows.find((r) => r.account_type === 'revenue');
  const expenseRow = rows.find((r) => r.account_type === 'expense');

  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">Profit &amp; Loss</h2>

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

      {/* Revenue section */}
      <section className="mb-6">
        <h3 className="text-sm font-semibold text-neutral-700 mb-2">Revenue</h3>
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr>
              <th className="text-left text-xs uppercase tracking-wide text-neutral-500 border-b border-neutral-200 pb-2">Account Type</th>
              <th className="text-right text-xs uppercase tracking-wide text-neutral-500 border-b border-neutral-200 pb-2">Debit</th>
              <th className="text-right text-xs uppercase tracking-wide text-neutral-500 border-b border-neutral-200 pb-2">Credit</th>
            </tr>
          </thead>
          <tbody>
            {revenueRow && (
              <tr
                className="border-b border-neutral-100 hover:bg-neutral-50 cursor-pointer"
                onClick={() =>
                  onNavigate({
                    type: 'report_accounts_by_type',
                    orgId,
                    accountType: 'revenue',
                    periodId: selectedPeriodId,
                  })
                }
              >
                <td className="py-2">{revenueRow.account_type}</td>
                <td className="py-2 text-right font-mono">{revenueRow.debit_total_cad}</td>
                <td className="py-2 text-right font-mono">{revenueRow.credit_total_cad}</td>
              </tr>
            )}
          </tbody>
        </table>
      </section>

      {/* Expense section */}
      <section className="mb-6">
        <h3 className="text-sm font-semibold text-neutral-700 mb-2">Expense</h3>
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr>
              <th className="text-left text-xs uppercase tracking-wide text-neutral-500 border-b border-neutral-200 pb-2">Account Type</th>
              <th className="text-right text-xs uppercase tracking-wide text-neutral-500 border-b border-neutral-200 pb-2">Debit</th>
              <th className="text-right text-xs uppercase tracking-wide text-neutral-500 border-b border-neutral-200 pb-2">Credit</th>
            </tr>
          </thead>
          <tbody>
            {expenseRow && (
              <tr
                className="border-b border-neutral-100 hover:bg-neutral-50 cursor-pointer"
                onClick={() =>
                  onNavigate({
                    type: 'report_accounts_by_type',
                    orgId,
                    accountType: 'expense',
                    periodId: selectedPeriodId,
                  })
                }
              >
                <td className="py-2">{expenseRow.account_type}</td>
                <td className="py-2 text-right font-mono">{expenseRow.debit_total_cad}</td>
                <td className="py-2 text-right font-mono">{expenseRow.credit_total_cad}</td>
              </tr>
            )}
          </tbody>
        </table>
      </section>

      {/* Net income */}
      <section className="border-t-2 border-neutral-400 pt-3">
        <div className="flex justify-between items-center">
          <span className="text-sm font-semibold">Net Income</span>
          <span className="text-sm font-semibold font-mono">{computeNetIncome(rows)}</span>
        </div>
      </section>
    </div>
  );
}
