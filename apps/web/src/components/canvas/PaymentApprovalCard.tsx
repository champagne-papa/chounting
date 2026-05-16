'use client';
//
// Phase 5 chunk B5-3-D3 substantive session #2: PaymentApprovalCard —
// per-bill canvas view for the payment-approval action. Calls POST
// /api/orgs/[orgId]/bills/[billId]/approve-for-payment (B5-3-D3 route)
// which wraps billService.approveForPayment via withInvariants(action:
// 'bill.approve').
//
// Phase 5 arc-closure substrate-correction: data source swapped from
// /reports/payment-approval-queue (which post-filters to
// approved_for_payment only — the OUTPUT state of the approve action,
// not the INPUT state pending_approval) to the per-bill endpoint
// /api/orgs/[orgId]/bills/[billId] (B5-3-D5; lifecycle-state-agnostic).
// Mirror pattern: RecordPaymentCard at B5-3-D5 received the identical
// correction. Without this swap, mounting from PendingApprovalsView
// (the new arc-closure wiring) would always error with "Bill not found
// in approval queue".
//
// Third instance of the queue-find-by-id substrate-correction pattern
// (#57 RecordPaymentCard's first surface, #69 RecordPaymentCard's
// second surface, this one PaymentApprovalCard). Grep audit confirmed
// no fourth consumer.

import { useState, useEffect } from 'react';
import type { CanvasNavigateFn } from '@/shared/types/canvasDirective';
import type { BillDetailRow } from '@/shared/schemas/spend/reports/billDetail.schema';

export interface PaymentApprovalCardProps {
  orgId: string;
  billId: string;
  onNavigate: CanvasNavigateFn;
}

export function PaymentApprovalCard({ orgId, billId, onNavigate }: PaymentApprovalCardProps) {
  const [bill, setBill] = useState<BillDetailRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch(`/api/orgs/${orgId}/bills/${billId}`)
      .then((res) => {
        if (!res.ok) {
          if (res.status === 404) throw new Error(`Bill ${billId} not found`);
          throw new Error(`Fetch failed: ${res.status}`);
        }
        return res.json() as Promise<BillDetailRow>;
      })
      .then((body) => {
        if (cancelled) return;
        setBill(body);
        setLoading(false);
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
  }, [orgId, billId]);

  const handleApprove = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/orgs/${orgId}/bills/${billId}/approve-for-payment`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}),
        },
      );
      if (!response.ok) {
        const errorBody = await response.json();
        if (response.status === 401) {
          window.location.href = '/en/sign-in';
          return;
        }
        setError(errorBody.message || errorBody.error || 'Approval failed');
        return;
      }
      await response.json();
      // On success: navigate back to the pending-approvals view (bill
      // has transitioned to approved_for_payment and is no longer here).
      onNavigate({ type: 'report_pending_approvals', orgId });
    } catch {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="text-sm text-neutral-400">Loading bill...</div>;
  }
  if (error && !bill) {
    return <div className="text-sm text-red-500">{error}</div>;
  }
  if (!bill) {
    return <div className="text-sm text-neutral-400">No bill data.</div>;
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <button
          type="button"
          className="text-sm text-blue-600 hover:underline"
          onClick={() => onNavigate({ type: 'report_pending_approvals', orgId })}
        >
          &larr; Back
        </button>
        <h2 className="text-lg font-semibold">
          Approve Bill{bill.bill_number ? ` #${bill.bill_number}` : ''} for Payment
        </h2>
      </div>

      {error && (
        <div className="mb-4 p-3 border border-red-300 rounded bg-red-50 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Bill detail — definition-list layout per JournalEntryDetailView precedent */}
      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm mb-6">
        <dt className="font-medium text-neutral-500">Bill Number</dt>
        <dd>{bill.bill_number ?? '—'}</dd>

        <dt className="font-medium text-neutral-500">Vendor</dt>
        <dd className="font-mono text-xs text-neutral-600">{bill.vendor_id}</dd>

        <dt className="font-medium text-neutral-500">Due Date</dt>
        <dd>{bill.due_date ?? '—'}</dd>

        <dt className="font-medium text-neutral-500">Amount (CAD)</dt>
        <dd className="font-mono">{String(bill.amount_cad)}</dd>

        <dt className="font-medium text-neutral-500">Lifecycle State</dt>
        <dd className="font-mono">{bill.lifecycle_state}</dd>
      </dl>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleApprove}
          disabled={submitting}
          className="px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50"
        >
          {submitting ? 'Approving...' : 'Approve for Payment'}
        </button>
        <button
          type="button"
          onClick={() => onNavigate({ type: 'report_pending_approvals', orgId })}
          disabled={submitting}
          className="px-4 py-2 bg-neutral-200 text-neutral-700 rounded text-sm hover:bg-neutral-300 disabled:opacity-50"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
