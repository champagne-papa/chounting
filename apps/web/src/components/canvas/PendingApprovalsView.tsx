'use client';
//
// Phase 5 arc-closure: PendingApprovalsView — bills in pending_approval
// lifecycle_state. Consumes /api/orgs/[orgId]/reports/pending-approvals
// via client-side fetch (pattern parity with ActivePaymentsView and
// PaidBillsHistoryView).
//
// Closes the last functional gap before Phase 5 arc-closure: operators
// could reach reverse from approved_for_payment / partially_paid /
// fully_paid bills (via Active Payments + Paid Bills History row-clicks)
// but not from pending_approval, even though billService.reverse accepts
// that state.
//
// Row-click navigates to PaymentApprovalCard (payment_approval_card
// discriminator) for the approve action. Per-row "Reverse" button
// (mirror of the ActivePaymentsView amendment from B5-3-D6) navigates
// to BillReverseCard for the reverse action; stopPropagation keeps the
// row-body click going to the approve flow as the primary action.

import { useEffect, useState } from 'react';
import type { CanvasNavigateFn } from '@/shared/types/canvasDirective';
import type { SelectedEntity } from '@/shared/types/canvasContext';
import type { PendingApprovalsOutput } from '@/services/spend/reports/apReportService';

export interface PendingApprovalsViewProps {
  orgId: string;
  onNavigate: CanvasNavigateFn;
  onSelectEntity?: (entity: SelectedEntity) => void;
}

export function PendingApprovalsView({ orgId, onNavigate }: PendingApprovalsViewProps) {
  const [data, setData] = useState<PendingApprovalsOutput | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetch(`/api/orgs/${orgId}/reports/pending-approvals`)
      .then(async (r) => {
        if (!r.ok) {
          const body = await r.json().catch(() => ({}));
          throw new Error(body.error || 'Failed to load pending approvals');
        }
        return r.json();
      })
      .then((data: PendingApprovalsOutput) => {
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
      <h2 className="text-lg font-semibold mb-4">Pending Approvals</h2>

      {loading && <div className="text-sm text-neutral-400">Loading...</div>}
      {error && <div className="text-sm text-red-500">{error}</div>}
      {!loading && !error && data && data.bills.length === 0 && (
        <div className="text-sm text-neutral-400">
          No bills currently awaiting approval.
        </div>
      )}
      {!loading && !error && data && data.bills.length > 0 && (
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs uppercase tracking-wide text-neutral-500 border-b border-neutral-200">
              <th className="py-2 pr-4 text-left">Bill #</th>
              <th className="py-2 pr-4 text-left">Vendor</th>
              <th className="py-2 pr-4 text-left">Issue date</th>
              <th className="py-2 pr-4 text-left">Due date</th>
              <th className="py-2 pr-4 text-right">Amount (CAD)</th>
              <th className="py-2 pr-4 text-right">Days pending</th>
              <th className="py-2 pr-2 text-right w-1" />
            </tr>
          </thead>
          <tbody>
            {data.bills.map((b) => (
              <tr
                key={b.bill_id}
                onClick={() =>
                  onNavigate({
                    type: 'payment_approval_card',
                    orgId,
                    billId: b.bill_id,
                  })
                }
                className="border-b border-neutral-100 cursor-pointer hover:bg-neutral-50"
              >
                <td className="py-2 pr-4">{b.bill_number ?? '—'}</td>
                <td className="py-2 pr-4 font-mono text-xs">{b.vendor_id}</td>
                <td className="py-2 pr-4">{b.issue_date ?? '—'}</td>
                <td className="py-2 pr-4">{b.due_date ?? '—'}</td>
                <td className="py-2 pr-4 text-right font-mono">{b.amount_cad}</td>
                <td className="py-2 pr-4 text-right font-mono">{b.days_pending}</td>
                <td className="py-2 pr-2 text-right">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onNavigate({
                        type: 'bill_reverse_card',
                        orgId,
                        billId: b.bill_id,
                        returnTo: 'report_pending_approvals',
                      });
                    }}
                    className="px-2 py-0.5 text-xs text-red-600 border border-red-200 rounded hover:bg-red-50"
                  >
                    Reverse
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="font-semibold border-t-2 border-neutral-300">
              <td className="py-2 pr-4" colSpan={4}>Total amount</td>
              <td className="py-2 pr-4 text-right font-mono">{data.total_amount}</td>
              <td className="py-2 pr-4" />
              <td className="py-2 pr-2" />
            </tr>
          </tfoot>
        </table>
      )}
    </div>
  );
}
