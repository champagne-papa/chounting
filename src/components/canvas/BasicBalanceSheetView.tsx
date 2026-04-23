'use client';

import { useState, useEffect, useMemo } from 'react';
import type { CanvasNavigateFn } from '@/shared/types/canvasDirective';
import type { BalanceSheetResult } from '@/services/reporting/reportService';
import {
  addMoney,
  subtractMoney,
  eqMoney,
  type MoneyAmount,
} from '@/shared/schemas/accounting/money.schema';

// Phase 0-1.1 Control Foundations Step 7. Canvas view for the
// 4-row Balance Sheet per brief §3.1. Structural template:
// BasicTrialBalanceView.tsx. DO NOT pattern-copy BasicPLView.tsx —
// it has a pre-existing INV-MONEY-001 violation (direct decimal.js
// import) tracked in brief §12 as a follow-up. Money arithmetic
// here uses addMoney / subtractMoney / eqMoney from money.schema
// only.

export interface BasicBalanceSheetViewProps {
  orgId: string;
  onNavigate: CanvasNavigateFn;
}

export function BasicBalanceSheetView({ orgId, onNavigate: _onNavigate }: BasicBalanceSheetViewProps) {
  const [data, setData] = useState<BalanceSheetResult | null>(null);
  // Default to today (client-side) so <input type="date"> renders
  // populated on first load. If the user clears it, the service-
  // side default fills in — belt-and-suspenders.
  const [asOfDate, setAsOfDate] = useState<string>(
    () => new Date().toISOString().slice(0, 10),
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch balance sheet data on mount and when as_of_date changes
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    const url = `/api/orgs/${orgId}/reports/balance-sheet?asOfDate=${asOfDate}`;

    fetch(url)
      .then(async (r) => {
        if (!r.ok) {
          const body = await r.json().catch(() => ({}));
          throw new Error(body.error || 'Failed to load balance sheet');
        }
        return r.json();
      })
      .then((payload: BalanceSheetResult) => {
        if (!cancelled) {
          setData(payload);
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
  }, [orgId, asOfDate]);

  const equation = useMemo(() => {
    if (!data) {
      return null;
    }
    const totalEquity = addMoney(data.equity_base, data.current_earnings);
    const rhs = addMoney(data.liabilities, totalEquity);
    return {
      totalEquity,
      rhs,
      balanced: eqMoney(data.assets, rhs),
      delta: subtractMoney(data.assets, rhs),
    };
  }, [data]);

  if (loading) {
    return <div className="text-sm text-neutral-400">Loading balance sheet...</div>;
  }

  if (error) {
    return <div className="text-sm text-red-600">{error}</div>;
  }

  if (!data || !equation) {
    return <div className="text-sm text-neutral-400">No balance sheet data.</div>;
  }

  return (
    <div>
      <h2 className="text-lg font-semibold mb-1">Balance Sheet</h2>
      <p className="text-xs text-neutral-500 mb-4">As of {asOfDate}</p>

      {/* Date picker */}
      <div className="mb-6">
        <label className="block text-xs text-neutral-500 mb-1">As of date</label>
        <input
          type="date"
          value={asOfDate}
          onChange={(e) => setAsOfDate(e.target.value)}
          className="border border-neutral-300 rounded px-2 py-1 text-sm"
        />
      </div>

      {/* Equation-failure banner (view-render only — no service throw;
          brief §6 does not promote Balance Sheet to a discipline
          backstop). Mirrors BasicTrialBalanceView's footer-mismatch
          styling. */}
      {!equation.balanced && (
        <div className="text-red-600 text-sm mb-4 p-2 border border-red-200 bg-red-50 rounded">
          Balance sheet does not balance: assets = {data.assets}, liabilities + equity = {equation.rhs}, delta = {equation.delta}.
        </div>
      )}

      {/* 4-row layout per brief §3.1 */}
      <table className="w-full text-sm border-collapse">
        <tbody>
          <tr className="border-b border-neutral-100">
            <td className="py-2">Assets</td>
            <td className="py-2 text-right font-mono">{data.assets}</td>
          </tr>
          <tr className="border-b border-neutral-100">
            <td className="py-2">Liabilities</td>
            <td className="py-2 text-right font-mono">{data.liabilities}</td>
          </tr>
          <tr>
            <td className="py-2">Equity</td>
            <td className="py-2"></td>
          </tr>
          <tr className="border-b border-neutral-100">
            <td className="py-2 pl-6 text-neutral-600">Equity base (retained + capital)</td>
            <td className="py-2 text-right font-mono">{data.equity_base}</td>
          </tr>
          <tr className="border-b border-neutral-100">
            <td className="py-2 pl-6 text-neutral-600">Current earnings</td>
            <td className="py-2 text-right font-mono">{data.current_earnings}</td>
          </tr>
          <tr className={`border-t-2 border-neutral-400 ${equation.balanced ? '' : 'text-red-600'}`}>
            <td className="py-2 pl-6 font-semibold">Total equity</td>
            <td className="py-2 text-right font-mono font-semibold">{equation.totalEquity}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
