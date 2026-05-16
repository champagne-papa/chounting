// src/components/canvas/OpenBillsView.tsx
'use client';
//
// EC-A-4 Open bills canvas view (Phase 5 chunk B5-3-D2 session #1).
// Consumes /api/orgs/[orgId]/reports/open-bills via client-side fetch
// per Pattern (b) ratification. List of bills with amount_due > 0
// (lifecycle ∈ posted / approved_for_payment / partially_paid). No
// filter UI in v1 — single useEffect fires on mount + orgId change.

import { useEffect, useState } from 'react';
import type { CanvasNavigateFn } from '@/shared/types/canvasDirective';
import type { SelectedEntity } from '@/shared/types/canvasContext';
import type { OpenBillsOutput } from '@/services/spend/reports/apReportService';

export interface OpenBillsViewProps {
  orgId: string;
  onNavigate: CanvasNavigateFn;
  onSelectEntity?: (entity: SelectedEntity) => void;
}

export function OpenBillsView({ orgId }: OpenBillsViewProps) {
  const [data, setData] = useState<OpenBillsOutput | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetch(`/api/orgs/${orgId}/reports/open-bills`)
      .then(async (r) => {
        if (!r.ok) {
          const body = await r.json().catch(() => ({}));
          throw new Error(body.error || 'Failed to load open bills');
        }
        return r.json();
      })
      .then((data: OpenBillsOutput) => {
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
      <h2 className="text-lg font-semibold mb-4">Open Bills</h2>

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
              <th className="py-2 pr-4 text-left">State</th>
              <th className="py-2 pr-4 text-right">Amount due</th>
            </tr>
          </thead>
          <tbody>
            {data.bills.map((b) => (
              <tr key={b.bill_id} className="border-b border-neutral-100">
                <td className="py-2 pr-4">{b.bill_number ?? '—'}</td>
                <td className="py-2 pr-4 font-mono text-xs">{b.vendor_id}</td>
                <td className="py-2 pr-4">{b.due_date ?? '—'}</td>
                <td className="py-2 pr-4">{b.lifecycle_state}</td>
                <td className="py-2 pr-4 text-right font-mono">{b.amount_due}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="font-semibold border-t-2 border-neutral-300">
              <td className="py-2 pr-4">Total</td>
              <td className="py-2 pr-4"></td>
              <td className="py-2 pr-4"></td>
              <td className="py-2 pr-4"></td>
              <td className="py-2 pr-4 text-right font-mono">{data.total_amount_due}</td>
            </tr>
          </tfoot>
        </table>
      )}
    </div>
  );
}
