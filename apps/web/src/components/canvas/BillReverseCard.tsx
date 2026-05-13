'use client';
//
// Phase 5 chunk B5-3-D6: BillReverseCard — per-bill canvas view for the
// bill-reversal write-side action. Consumes POST /api/orgs/[orgId]/bills/
// [billId]/reverse which wraps billService.reverse via withInvariants
// (action: 'bill.reverse').
//
// Reverse is a 4-state mutation (pending_approval, approved_for_payment,
// partially_paid, fully_paid → voided) that produces a new reversal JE
// with mirrored lines (Dr ↔ Cr swap) per INV-REVERSAL-001 and INV-AP-002.
//
// 3-field form: reversal_reason (textarea, required, min 1 char),
// fiscal_period_id (picker, current-period default), entry_date (date,
// today default). Form-schema separation (catch #46) + zodResolver per
// RecordPaymentCard precedent. High-friction action: explicit "Reverse"
// confirm button, no auto-submit.
//
// Bill data fetch: /api/orgs/${orgId}/bills/${billId} (per-bill endpoint
// shipped at B5-3-D5; returns bill regardless of lifecycle_state so this
// card works for all 4 reversable states).
//
// returnTo navigation: directive carries optional returnTo for graceful
// return to the originating view (Active Payments vs Paid Bills History).
// Defaults to report_active_payments.

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { ReverseBillInputRaw } from '@/shared/schemas/spend/bill.schema';
import type {
  CanvasDirective,
  CanvasNavigateFn,
} from '@/shared/types/canvasDirective';
import type { BillDetailRow } from '@/shared/schemas/spend/reports/billDetail.schema';

// ---------------------------------------------------------------------
// Form schema — UI shape (distinct from ReverseBillInputSchema service
// boundary). Mirrors RecordPaymentForm precedent for separation.
// ---------------------------------------------------------------------

export const BillReverseFormSchema = z.object({
  reversal_reason: z.string().min(1, 'Reversal reason required'),
  fiscal_period_id: z.string().uuid('Period required'),
  entry_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Entry date required'),
});

type BillReverseFormState = z.infer<typeof BillReverseFormSchema>;
type BillReverseFormStateInput = z.input<typeof BillReverseFormSchema>;

// ---------------------------------------------------------------------
// Data-fetching types
// ---------------------------------------------------------------------

type FiscalPeriod = {
  period_id: string;
  name: string;
  start_date: string;
  end_date: string;
  is_locked: boolean;
};

// ---------------------------------------------------------------------
// Transform: form state → service input shape
// ---------------------------------------------------------------------

export function formStateToServiceInput(
  state: BillReverseFormState,
  orgId: string,
  billId: string,
): ReverseBillInputRaw {
  return {
    org_id: orgId,
    bill_id: billId,
    reversal_reason: state.reversal_reason,
    fiscal_period_id: state.fiscal_period_id,
    entry_date: state.entry_date,
  };
}

// ---------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------

export type BillReverseCardReturnTo =
  | 'report_active_payments'
  | 'report_paid_bills_history';

export type BillReverseCardProps = {
  orgId: string;
  billId: string;
  returnTo?: BillReverseCardReturnTo;
  onNavigate: CanvasNavigateFn;
};

const TODAY = new Date().toISOString().slice(0, 10);

function returnDirective(
  returnTo: BillReverseCardReturnTo,
  orgId: string,
): CanvasDirective {
  if (returnTo === 'report_paid_bills_history') {
    return { type: 'report_paid_bills_history', orgId };
  }
  return { type: 'report_active_payments', orgId };
}

export function BillReverseCard({
  orgId,
  billId,
  returnTo = 'report_active_payments',
  onNavigate,
}: BillReverseCardProps) {
  const [bill, setBill] = useState<BillDetailRow | null>(null);
  const [billLoading, setBillLoading] = useState(true);
  const [billError, setBillError] = useState<string | null>(null);

  const [periods, setPeriods] = useState<FiscalPeriod[]>([]);
  const [periodsLoading, setPeriodsLoading] = useState(true);

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const form = useForm<BillReverseFormStateInput>({
    resolver: zodResolver(BillReverseFormSchema),
    mode: 'onSubmit',
    defaultValues: {
      reversal_reason: '',
      fiscal_period_id: '',
      entry_date: TODAY,
    },
  });

  // --- Bill detail fetch ---

  useEffect(() => {
    let cancelled = false;
    setBillLoading(true);
    setBillError(null);
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
        setBillLoading(false);
      })
      .catch((err: Error) => {
        if (!cancelled) {
          setBillError(err.message);
          setBillLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [orgId, billId]);

  // --- Fiscal periods fetch ---

  useEffect(() => {
    let cancelled = false;
    setPeriodsLoading(true);
    fetch(`/api/orgs/${orgId}/fiscal-periods`)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        const all: FiscalPeriod[] = data.periods ?? [];
        setPeriods(all);
        if (all.length > 0 && !form.getValues('fiscal_period_id')) {
          form.setValue('fiscal_period_id', all[0].period_id, {
            shouldValidate: false,
          });
        }
      })
      .catch(() => {
        if (!cancelled) setPeriods([]);
      })
      .finally(() => {
        if (!cancelled) setPeriodsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [orgId, form]);

  // --- Submit ---

  const onSubmit = async (formData: BillReverseFormState) => {
    setFormError(null);
    setSubmitting(true);
    try {
      const serviceInput = formStateToServiceInput(formData, orgId, billId);

      const response = await fetch(
        `/api/orgs/${orgId}/bills/${billId}/reverse`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(serviceInput),
        },
      );

      if (!response.ok) {
        const errorBody = await response.json();
        if (response.status === 400 && errorBody.details) {
          for (const issue of errorBody.details) {
            const path = issue.path.join('.');
            form.setError(path as Parameters<typeof form.setError>[0], {
              message: issue.message,
            });
          }
        } else if (response.status === 401) {
          window.location.href = '/en/sign-in';
          return;
        } else {
          setFormError(
            errorBody.message || errorBody.error ||
              'An unexpected error occurred. Please try again.',
          );
        }
        return;
      }

      await response.json();
      onNavigate(returnDirective(returnTo, orgId));
    } catch {
      setFormError('An unexpected error occurred. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // --- Render ---

  if (billLoading) {
    return <div className="text-sm text-neutral-400">Loading bill...</div>;
  }
  if (billError && !bill) {
    return <div className="text-sm text-red-500">{billError}</div>;
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
          onClick={() => onNavigate(returnDirective(returnTo, orgId))}
        >
          &larr; Back
        </button>
        <h2 className="text-lg font-semibold">
          Reverse Bill{bill.bill_number ? ` — #${bill.bill_number}` : ''}
        </h2>
      </div>

      {/* Bill summary */}
      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm mb-6 p-3 border border-neutral-200 rounded bg-neutral-50">
        <dt className="font-medium text-neutral-500">Bill Number</dt>
        <dd>{bill.bill_number ?? '—'}</dd>

        <dt className="font-medium text-neutral-500">Vendor</dt>
        <dd className="font-mono text-xs text-neutral-600">{bill.vendor_id}</dd>

        <dt className="font-medium text-neutral-500">Due Date</dt>
        <dd>{bill.due_date ?? '—'}</dd>

        <dt className="font-medium text-neutral-500">Bill Amount (CAD)</dt>
        <dd className="font-mono">{String(bill.amount_cad)}</dd>

        <dt className="font-medium text-neutral-500">Lifecycle State</dt>
        <dd className="font-mono">{bill.lifecycle_state}</dd>
      </dl>

      <div className="mb-4 p-3 border border-amber-300 rounded bg-amber-50 text-sm text-amber-800">
        Reversing this bill posts a new journal entry that mirrors the
        original (Dr ↔ Cr swapped) and marks the bill <code>voided</code>.
        This action cannot be undone through the UI.
      </div>

      {formError && (
        <div className="mb-4 p-3 border border-red-300 rounded bg-red-50 text-sm text-red-600">
          {formError}
        </div>
      )}

      {periodsLoading ? (
        <div className="text-sm text-neutral-400">Loading form options...</div>
      ) : (
        <form onSubmit={form.handleSubmit(onSubmit)}>
          {/* Reversal reason — required, prominent */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-neutral-600 mb-1">
              Reversal Reason <span className="text-red-500">*</span>
            </label>
            <textarea
              {...form.register('reversal_reason')}
              rows={3}
              placeholder="Why is this bill being reversed?"
              className="w-full border border-neutral-300 rounded px-2 py-1 text-sm"
            />
            {form.formState.errors.reversal_reason && (
              <p className="text-sm text-red-500 mt-1">
                {form.formState.errors.reversal_reason.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            {/* Fiscal Period */}
            <div>
              <label className="block text-sm font-medium text-neutral-600 mb-1">
                Fiscal Period <span className="text-red-500">*</span>
              </label>
              {periods.length === 0 ? (
                <div className="text-sm text-neutral-400">
                  No open fiscal periods. Contact your administrator.
                </div>
              ) : (
                <select
                  {...form.register('fiscal_period_id')}
                  className="w-full border border-neutral-300 rounded px-2 py-1 text-sm"
                >
                  <option value="">Select a period...</option>
                  {periods.map((p) => (
                    <option key={p.period_id} value={p.period_id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              )}
              {form.formState.errors.fiscal_period_id && (
                <p className="text-sm text-red-500 mt-1">
                  {form.formState.errors.fiscal_period_id.message}
                </p>
              )}
            </div>

            {/* Entry Date */}
            <div>
              <label className="block text-sm font-medium text-neutral-600 mb-1">
                Entry Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                {...form.register('entry_date')}
                className="w-full border border-neutral-300 rounded px-2 py-1 text-sm"
              />
              {form.formState.errors.entry_date && (
                <p className="text-sm text-red-500 mt-1">
                  {form.formState.errors.entry_date.message}
                </p>
              )}
            </div>
          </div>

          <div className="flex gap-2 mt-2">
            <button
              type="submit"
              disabled={submitting || periods.length === 0}
              className="px-4 py-2 bg-red-600 text-white text-sm rounded hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {submitting ? 'Reversing...' : 'Reverse'}
            </button>
            <button
              type="button"
              onClick={() => onNavigate(returnDirective(returnTo, orgId))}
              disabled={submitting}
              className="px-4 py-2 bg-neutral-200 text-neutral-700 rounded text-sm hover:bg-neutral-300 disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
