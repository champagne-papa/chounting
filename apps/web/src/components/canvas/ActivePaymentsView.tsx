// src/components/canvas/ActivePaymentsView.tsx
'use client';
//
// Phase 5 chunk B5-3-D5 — Active payments canvas view. Operator entry path
// for subsequent partial-payment-followup actions. Consumes
// /api/orgs/[orgId]/reports/active-payments via client-side fetch
// (pattern parity with PaymentApprovalQueueView). Bills in
// partially_paid lifecycle_state.
//
// Closes catch #57 sub-surface expansion UX gap at partial-payment-
// followup grain: partially_paid bills disappear from
// PaymentApprovalQueueView per its post-filter approved_for_payment only.
// ActivePaymentsView is the additive-substrate solution preserving
// B5-3-D2 PaymentApprovalQueueView semantic canonical-for-approve-action
// grain.
//
// Row-click navigates to RecordPaymentCard (payment_record_card
// discriminator) with computed amount_due pre-fill for subsequent
// partial-payment.
//
// B5-3-D6 amendment: per-row "Reverse" affordance navigates to
// BillReverseCard (bill_reverse_card discriminator). Both
// approved_for_payment and partially_paid bills can be reversed
// from this entry. Button stops propagation so the row-body
// navigates to record-payment as before.

import { useEffect, useState } from 'react';
import type { CanvasNavigateFn } from '@/shared/types/canvasDirective';
import type { SelectedEntity } from '@/shared/types/canvasContext';
import type { ActivePaymentsOutput } from '@/services/spend/reports/apReportService';

export interface ActivePaymentsViewProps {
  orgId: string;
  onNavigate: CanvasNavigateFn;
  onSelectEntity?: (entity: SelectedEntity) => void;
}

export function ActivePaymentsView({ orgId, onNavigate }: ActivePaymentsViewProps) {
  const [data, setData] = useState<ActivePaymentsOutput | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetch(`/api/orgs/${orgId}/reports/active-payments`)
      .then(async (r) => {
        if (!r.ok) {
          const body = await r.json().catch(() => ({}));
          throw new Error(body.error || 'Failed to load active payments');
        }
        return r.json();
      })
      .then((data: ActivePaymentsOutput) => {
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
      <h2 className="text-lg font-semibold mb-4">Active Payments</h2>

      {loading && <div className="text-sm text-neutral-400">Loading...</div>}
      {error && <div className="text-sm text-red-500">{error}</div>}
      {!loading && !error && data && data.bills.length === 0 && (
        <div className="text-sm text-neutral-400">
          No bills currently in partial-payment state.
        </div>
      )}
      {!loading && !error && data && data.bills.length > 0 && (
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs uppercase tracking-wide text-neutral-500 border-b border-neutral-200">
              <th className="py-2 pr-4 text-left">Bill #</th>
              <th className="py-2 pr-4 text-left">Vendor</th>
              <th className="py-2 pr-4 text-left">Due date</th>
              <th className="py-2 pr-4 text-right">Amount due</th>
              <th className="py-2 pr-2 text-right w-1" />
            </tr>
          </thead>
          <tbody>
            {data.bills.map((b) => (
              <tr
                key={b.bill_id}
                onClick={() => onNavigate({ type: 'payment_record_card', orgId, billId: b.bill_id })}
                className="border-b border-neutral-100 cursor-pointer hover:bg-neutral-50"
              >
                <td className="py-2 pr-4">{b.bill_number ?? '—'}</td>
                <td className="py-2 pr-4 font-mono text-xs">{b.vendor_id}</td>
                <td className="py-2 pr-4">{b.due_date ?? '—'}</td>
                <td className="py-2 pr-4 text-right font-mono">{b.amount_due}</td>
                <td className="py-2 pr-2 text-right">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onNavigate({
                        type: 'bill_reverse_card',
                        orgId,
                        billId: b.bill_id,
                        returnTo: 'report_active_payments',
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
              <td className="py-2 pr-4" colSpan={3}>Total amount due</td>
              <td className="py-2 pr-4 text-right font-mono">{data.total_amount_due}</td>
              <td className="py-2 pr-2" />
            </tr>
          </tfoot>
        </table>
      )}
    </div>
  );
}
