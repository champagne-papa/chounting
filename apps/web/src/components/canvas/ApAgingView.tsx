// src/components/canvas/ApAgingView.tsx
'use client';
//
// EC-A-3 AP aging canvas view (Phase 5 chunk B5-3-D2 session #1).
// Consumes /api/orgs/[orgId]/reports/ap-aging via client-side fetch
// per Pattern (b) ratification. 4-bucket aging breakdown with optional
// as_of_date filter (defaults to today server-side if omitted).

import { useEffect, useState } from 'react';
import type { CanvasNavigateFn } from '@/shared/types/canvasDirective';
import type { SelectedEntity } from '@/shared/types/canvasContext';
import type { ApAgingOutput } from '@/services/spend/reports/apReportService';

export interface ApAgingViewProps {
  orgId: string;
  onNavigate: CanvasNavigateFn;
  onSelectEntity?: (entity: SelectedEntity) => void;
}

export function ApAgingView({ orgId }: ApAgingViewProps) {
  const [data, setData] = useState<ApAgingOutput | null>(null);
  const [asOfDate, setAsOfDate] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    const url = asOfDate
      ? `/api/orgs/${orgId}/reports/ap-aging?as_of_date=${asOfDate}`
      : `/api/orgs/${orgId}/reports/ap-aging`;

    fetch(url)
      .then(async (r) => {
        if (!r.ok) {
          const body = await r.json().catch(() => ({}));
          throw new Error(body.error || 'Failed to load AP aging');
        }
        return r.json();
      })
      .then((data: ApAgingOutput) => {
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
  }, [orgId, asOfDate]);

  return (
    <div className="p-6">
      <h2 className="text-lg font-semibold mb-4">AP Aging</h2>

      <div className="mb-6">
        <label className="block text-xs text-neutral-500 mb-1">As of date</label>
        <input
          type="date"
          value={asOfDate ?? ''}
          onChange={(e) => setAsOfDate(e.target.value || undefined)}
          className="border border-neutral-300 rounded px-2 py-1 text-sm"
        />
      </div>

      {loading && <div className="text-sm text-neutral-400">Loading...</div>}
      {error && <div className="text-sm text-red-500">{error}</div>}
      {!loading && !error && data && (
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs uppercase tracking-wide text-neutral-500 border-b border-neutral-200">
              <th className="py-2 pr-4 text-left">Bucket</th>
              <th className="py-2 pr-4 text-right">Bill count</th>
              <th className="py-2 pr-4 text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {data.buckets.map((b) => (
              <tr key={b.bucket} className="border-b border-neutral-100">
                <td className="py-2 pr-4">{b.bucket}</td>
                <td className="py-2 pr-4 text-right">{b.bill_count}</td>
                <td className="py-2 pr-4 text-right font-mono">{b.amount}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="font-semibold border-t-2 border-neutral-300">
              <td className="py-2 pr-4">Total</td>
              <td className="py-2 pr-4"></td>
              <td className="py-2 pr-4 text-right font-mono">{data.total}</td>
            </tr>
          </tfoot>
        </table>
      )}
    </div>
  );
}
