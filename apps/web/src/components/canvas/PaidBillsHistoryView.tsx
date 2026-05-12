// src/components/canvas/PaidBillsHistoryView.tsx
'use client';
//
// EC-A-7 Paid bills history canvas view (Phase 5 chunk B5-3-D2 session #2).
// Consumes /api/orgs/[orgId]/reports/paid-bills-history via client-side
// fetch per Pattern (b) ratification. Bills in fully_paid lifecycle
// state — historical view of completed payments.

import { useEffect, useState } from 'react';
import type { CanvasNavigateFn } from '@/shared/types/canvasDirective';
import type { SelectedEntity } from '@/shared/types/canvasContext';
import type { PaidBillsHistoryOutput } from '@/services/spend/reports/apReportService';

export interface PaidBillsHistoryViewProps {
  orgId: string;
  onNavigate: CanvasNavigateFn;
  onSelectEntity?: (entity: SelectedEntity) => void;
}

export function PaidBillsHistoryView({ orgId }: PaidBillsHistoryViewProps) {
  const [data, setData] = useState<PaidBillsHistoryOutput | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetch(`/api/orgs/${orgId}/reports/paid-bills-history`)
      .then(async (r) => {
        if (!r.ok) {
          const body = await r.json().catch(() => ({}));
          throw new Error(body.error || 'Failed to load paid bills history');
        }
        return r.json();
      })
      .then((data: PaidBillsHistoryOutput) => {
        if (!cancelled) {
          setData(data);
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
  }, [orgId]);

  return (
    <div className="p-6">
      <h2 className="text-lg font-semibold mb-4">Paid Bills History</h2>

      {loading && <div className="text-sm text-neutral-400">Loading...</div>}
      {error && <div className="text-sm text-red-500">{error}</div>}
      {!loading && !error && data && data.bills.length === 0 && (
        <div className="text-sm text-neutral-400">No data.</div>
      )}
      {!loading && !error && data && data.bills.length > 0 && (
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs uppercase tracking-wide text-neutral-500 border-b border-neutral-200">
              <th className="py-2 pr-4 text-left">Bill #</th>
              <th className="py-2 pr-4 text-left">Vendor</th>
              <th className="py-2 pr-4 text-left">Due date</th>
              <th className="py-2 pr-4 text-right">Amount paid</th>
            </tr>
          </thead>
          <tbody>
            {data.bills.map((b) => (
              <tr key={b.bill_id} className="border-b border-neutral-100">
                <td className="py-2 pr-4">{b.bill_number ?? '—'}</td>
                <td className="py-2 pr-4 font-mono text-xs">{b.vendor_id}</td>
                <td className="py-2 pr-4">{b.due_date ?? '—'}</td>
                <td className="py-2 pr-4 text-right font-mono">{b.amount_cad}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="font-semibold border-t-2 border-neutral-300">
              <td className="py-2 pr-4" colSpan={3}>Total amount paid</td>
              <td className="py-2 pr-4 text-right font-mono">{data.total_amount_paid}</td>
            </tr>
          </tfoot>
        </table>
      )}
    </div>
  );
}
