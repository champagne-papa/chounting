'use client';

import { useState, useEffect, useMemo } from 'react';
import type { CanvasNavigateFn } from '@/shared/types/canvasDirective';
import type { TrialBalanceRow } from '@/services/reporting/reportService';
import type { FiscalPeriodListItem } from '@/services/accounting/periodService';
import {
  addMoney,
  zeroMoney,
  eqMoney,
  type MoneyAmount,
} from '@/shared/schemas/accounting/money.schema';

export interface BasicTrialBalanceViewProps {
  orgId: string;
  onNavigate: CanvasNavigateFn;
}

export function BasicTrialBalanceView({ orgId, onNavigate: _onNavigate }: BasicTrialBalanceViewProps) {
  const [rows, setRows] = useState<TrialBalanceRow[] | null>(null);
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

  // Fetch trial balance data on mount and when period changes
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    const url = selectedPeriodId
      ? `/api/orgs/${orgId}/reports/trial-balance?periodId=${selectedPeriodId}`
      : `/api/orgs/${orgId}/reports/trial-balance`;

    fetch(url)
      .then(async (r) => {
        if (!r.ok) {
          const body = await r.json().catch(() => ({}));
          throw new Error(body.error || 'Failed to load trial balance');
        }
        return r.json();
      })
      .then((data: { rows: TrialBalanceRow[] }) => {
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

  const footerTotals = useMemo(() => {
    if (!rows) return { debit: zeroMoney(), credit: zeroMoney(), balanced: true };

    let debit: MoneyAmount = zeroMoney();
    let credit: MoneyAmount = zeroMoney();
    for (const row of rows) {
      debit = addMoney(debit, row.debit_total_cad);
      credit = addMoney(credit, row.credit_total_cad);
    }

    return {
      debit,
      credit,
      balanced: eqMoney(debit, credit),
    };
  }, [rows]);

  if (loading) {
    return <div className="text-sm text-neutral-400">Loading trial balance...</div>;
  }

  if (error) {
    return <div className="text-sm text-red-600">{error}</div>;
  }

  if (!rows || rows.length === 0) {
    return <div className="text-sm text-neutral-400">No trial balance data.</div>;
  }

  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">Trial Balance</h2>

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

      {/* Main table */}
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr>
            <th className="text-left text-xs uppercase tracking-wide text-neutral-500 border-b border-neutral-200 pb-2">Account Code</th>
            <th className="text-left text-xs uppercase tracking-wide text-neutral-500 border-b border-neutral-200 pb-2">Account Name</th>
            <th className="text-left text-xs uppercase tracking-wide text-neutral-500 border-b border-neutral-200 pb-2">Type</th>
            <th className="text-right text-xs uppercase tracking-wide text-neutral-500 border-b border-neutral-200 pb-2">Debit</th>
            <th className="text-right text-xs uppercase tracking-wide text-neutral-500 border-b border-neutral-200 pb-2">Credit</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.account_id} className="border-b border-neutral-100 hover:bg-neutral-50">
              <td className="py-2 font-mono">{row.account_code}</td>
              <td className="py-2">{row.account_name}</td>
              <td className="py-2 text-neutral-500">{row.account_type}</td>
              <td className="py-2 text-right font-mono">{row.debit_total_cad}</td>
              <td className="py-2 text-right font-mono">{row.credit_total_cad}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className={`border-t-2 border-neutral-400 ${footerTotals.balanced ? '' : 'text-red-600'}`}>
            <td className="py-2 font-semibold" colSpan={3}>Total</td>
            <td className="py-2 text-right font-mono font-semibold">{footerTotals.debit}</td>
            <td className="py-2 text-right font-mono font-semibold">{footerTotals.credit}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
