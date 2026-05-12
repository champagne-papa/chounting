'use client';
//
// Phase 5 chunk B5-3-D3 substantive session #2: PaymentApprovalCard —
// per-bill canvas view for payment-approval action.
// Consumes POST /api/orgs/[orgId]/bills/[billId]/approve-for-payment (Task 1
// route) which wraps billService.approveForPayment via withInvariants(action:
// 'bill.approve'). Data fetch: reuses queue endpoint + client-side billId
// filter (Disposition (α) per plan-doc-grain ratification; no new per-bill
// endpoint).
//
// Mirror pattern: JournalEntryDetailView.tsx canonical (HEAD 4abd387);
// per-entity canvas view with { orgId, billId } discriminator.

import { useEffect, useState } from 'react';
import type { CanvasNavigateFn } from '@/shared/types/canvasDirective';
import type {
  PaymentApprovalQueueOutput,
  PaymentApprovalQueueRow,
} from '@/services/spend/reports/apReportService';

export interface PaymentApprovalCardProps {
  orgId: string;
  billId: string;
  onNavigate: CanvasNavigateFn;
}

export function PaymentApprovalCard({ orgId, billId, onNavigate }: PaymentApprovalCardProps) {
  const [bill, setBill] = useState<PaymentApprovalQueueRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch(`/api/orgs/${orgId}/reports/payment-approval-queue`)
      .then((res) => {
        if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
        return res.json() as Promise<PaymentApprovalQueueOutput>;
      })
      .then((body) => {
        if (cancelled) return;
        const found = body.bills.find((b) => b.bill_id === billId);
        if (!found) {
          setError(`Bill ${billId} not found in approval queue`);
        } else {
          setBill(found);
        }
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
      // On success: navigate back to queue (bill no longer in approved_for_payment state)
      onNavigate({ type: 'report_payment_approval_queue', orgId });
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
          onClick={() => onNavigate({ type: 'report_payment_approval_queue', orgId })}
        >
          &larr; Back to queue
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

        <dt className="font-medium text-neutral-500">Amount Due</dt>
        <dd className="font-mono">{String(bill.amount_due)}</dd>
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
          onClick={() => onNavigate({ type: 'report_payment_approval_queue', orgId })}
          disabled={submitting}
          className="px-4 py-2 bg-neutral-200 text-neutral-700 rounded text-sm hover:bg-neutral-300 disabled:opacity-50"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
