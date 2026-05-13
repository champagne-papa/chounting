// src/components/canvas/RecordPaymentCard.tsx
'use client';
//
// Phase 5 chunk B5-3-D4 substantive session #1: RecordPaymentCard —
// per-bill form-grain canvas view for payment-execution action.
// Consumes POST /api/orgs/[orgId]/bills/[billId]/record-payment (Task 2
// route) which wraps billService.recordPayment via withInvariants(action:
// 'bill.record_payment'). Mirror pattern: ManualBillForm.tsx form-schema
// separation (catch #46) + PaymentApprovalCard.tsx per-bill discriminator.
//
// Reading B emit: recordPayment creates JE via journalEntryService.post
// (Dr ap_control + Cr cash; Sub-L CAD-only per billService.ts:516-523).
// State transition: approved_for_payment OR partially_paid → partially_paid
// (newSum < billAmount; partial payment) OR fully_paid (newSum >= billAmount;
// full payment).
//
// Dropdown endpoints:
//   /api/orgs/${orgId}/fiscal-periods  → { periods: FiscalPeriod[] }
//   /api/orgs/${orgId}/chart-of-accounts → { accounts: Account[] } (client-filtered)
//   /api/orgs/${orgId}/bills/${billId} → BillDetailRow
//     (B5-3-D5 substrate-correction: NEW per-bill bill-detail endpoint;
//     supersedes the B5-3-D4 Disposition (α) reuse of payment-approval-queue
//     which post-filtered to approved_for_payment only — broke the
//     partially_paid flow surfaced from ActivePaymentsView row-click.
//     Closes catch #69 substrate-grain semantic drift at downstream-consumer.)
//
// ap_control_account_id default-select: first liability account whose name
// contains "accounts payable" (case-insensitive). Mirror ManualBillForm precedent.
// cash_account_id default-select: first asset account whose name contains
// "cash and cash equivalents" (case-insensitive).
// fiscal_period_id default-select: first period in list (earliest open; per ManualBillForm).

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { RecordBillPaymentInputRaw } from '@/shared/schemas/spend/bill.schema';
import type { CanvasNavigateFn } from '@/shared/types/canvasDirective';
import type { BillDetailRow } from '@/shared/schemas/spend/reports/billDetail.schema';

// ---------------------------------------------------------------------
// Form schema (UI-state shape; distinct from RecordBillPaymentInputSchema
// service boundary). String-typed money fields per ManualBillForm precedent.
// ---------------------------------------------------------------------

const RecordPaymentFormSchema = z.object({
  payment_method: z.enum(['check', 'eft', 'wire', 'cash', 'other']),
  payment_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Payment date required'),
  amount_cad: z.string().regex(/^\d+(\.\d{1,4})?$/, 'Amount required (numeric)'),
  reference_number: z.string(),
  fiscal_period_id: z.string().uuid('Period required'),
  entry_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Entry date required'),
  ap_control_account_id: z.string().uuid('AP control account required'),
  cash_account_id: z.string().uuid('Cash account required'),
});

type RecordPaymentFormState = z.infer<typeof RecordPaymentFormSchema>;
type RecordPaymentFormStateInput = z.input<typeof RecordPaymentFormSchema>;

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

type Account = {
  account_id: string;
  account_code: string;
  account_name: string;
  account_type: string;
  is_active: boolean;
};

// ---------------------------------------------------------------------
// Transform: form state → service input shape (RecordBillPaymentInputRaw)
// Empty reference_number maps to null per RecordBillPaymentInputSchema nullable shape.
// ---------------------------------------------------------------------

function formStateToServiceInput(
  state: RecordPaymentFormState,
  orgId: string,
  billId: string,
): RecordBillPaymentInputRaw {
  return {
    org_id: orgId,
    bill_id: billId,
    payment_method: state.payment_method,
    payment_date: state.payment_date,
    amount_cad: state.amount_cad,
    reference_number: state.reference_number || null,
    fiscal_period_id: state.fiscal_period_id,
    entry_date: state.entry_date,
    ap_control_account_id: state.ap_control_account_id,
    cash_account_id: state.cash_account_id,
  };
}

// ---------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------

export type RecordPaymentCardProps = {
  orgId: string;
  billId: string;
  onNavigate: CanvasNavigateFn;
};

const TODAY = new Date().toISOString().slice(0, 10);

export function RecordPaymentCard({ orgId, billId, onNavigate }: RecordPaymentCardProps) {
  const [bill, setBill] = useState<BillDetailRow | null>(null);
  const [billLoading, setBillLoading] = useState(true);
  const [billError, setBillError] = useState<string | null>(null);

  const [periods, setPeriods] = useState<FiscalPeriod[]>([]);
  const [liabilityAccounts, setLiabilityAccounts] = useState<Account[]>([]);
  const [assetAccounts, setAssetAccounts] = useState<Account[]>([]);
  const [dropdownsLoading, setDropdownsLoading] = useState(true);

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // --- Form setup (defaultValues before dropdown data; setValue used post-fetch for defaults) ---

  const form = useForm<RecordPaymentFormStateInput>({
    resolver: zodResolver(RecordPaymentFormSchema),
    mode: 'onSubmit',
    defaultValues: {
      payment_method: 'eft',
      payment_date: TODAY,
      amount_cad: '',
      reference_number: '',
      fiscal_period_id: '',
      entry_date: TODAY,
      ap_control_account_id: '',
      cash_account_id: '',
    },
  });

  // --- Bill detail fetch (B5-3-D5 substrate-correction: per-bill endpoint) ---

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
        // Pre-fill amount_cad with bill's amount_due (full payment default)
        if (!form.getValues('amount_cad')) {
          form.setValue('amount_cad', String(body.amount_due), { shouldValidate: false });
        }
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
  }, [orgId, billId, form]);

  // --- Dropdown fetches (fiscal-periods + COA-liability + COA-asset) ---

  useEffect(() => {
    let cancelled = false;
    setDropdownsLoading(true);

    Promise.all([
      fetch(`/api/orgs/${orgId}/fiscal-periods`).then((r) => r.json()),
      fetch(`/api/orgs/${orgId}/chart-of-accounts`).then((r) => r.json()),
    ])
      .then(([periodsData, accountsData]) => {
        if (cancelled) return;

        const allPeriods: FiscalPeriod[] = periodsData.periods ?? [];
        const allAccounts: Account[] = accountsData.accounts ?? [];

        const liab = allAccounts.filter((a) => a.account_type === 'liability' && a.is_active);
        const asset = allAccounts.filter((a) => a.account_type === 'asset' && a.is_active);

        setPeriods(allPeriods);
        setLiabilityAccounts(liab);
        setAssetAccounts(asset);

        // Default-select fiscal_period_id: first open period (earliest open, per ManualBillForm precedent)
        if (allPeriods.length > 0 && !form.getValues('fiscal_period_id')) {
          form.setValue('fiscal_period_id', allPeriods[0].period_id, { shouldValidate: false });
        }

        // Default-select ap_control_account_id: first liability account whose name contains
        // "accounts payable" (case-insensitive). COA template seed: account_code 2000.
        if (!form.getValues('ap_control_account_id')) {
          const apMatch = liab.find((a) =>
            a.account_name.toLowerCase().includes('accounts payable'),
          );
          if (apMatch) {
            form.setValue('ap_control_account_id', apMatch.account_id, { shouldValidate: false });
          }
        }

        // Default-select cash_account_id: first asset account whose name contains
        // "cash and cash equivalents" (case-insensitive).
        if (!form.getValues('cash_account_id')) {
          const cashMatch = asset.find((a) =>
            a.account_name.toLowerCase().includes('cash and cash equivalents'),
          );
          if (cashMatch) {
            form.setValue('cash_account_id', cashMatch.account_id, { shouldValidate: false });
          }
        }
      })
      .catch(() => {
        if (cancelled) return;
        setPeriods([]);
        setLiabilityAccounts([]);
        setAssetAccounts([]);
      })
      .finally(() => {
        if (!cancelled) setDropdownsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [orgId, form]);

  // --- Submit handler ---

  const onSubmit = async (formData: RecordPaymentFormState) => {
    setFormError(null);
    setSubmitting(true);
    try {
      const serviceInput = formStateToServiceInput(formData, orgId, billId);

      const response = await fetch(`/api/orgs/${orgId}/bills/${billId}/record-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(serviceInput),
      });

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
        } else if (response.status === 422) {
          setFormError(errorBody.message || 'Unable to record payment');
        } else {
          setFormError(errorBody.message || 'An unexpected error occurred. Please try again.');
        }
        return;
      }

      await response.json();
      onNavigate({ type: 'report_payment_approval_queue', orgId });
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

  const loading = dropdownsLoading;

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
          Record Payment{bill.bill_number ? ` — Bill #${bill.bill_number}` : ''}
        </h2>
      </div>

      {/* Bill detail summary — definition-list layout per PaymentApprovalCard precedent */}
      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm mb-6 p-3 border border-neutral-200 rounded bg-neutral-50">
        <dt className="font-medium text-neutral-500">Bill Number</dt>
        <dd>{bill.bill_number ?? '—'}</dd>

        <dt className="font-medium text-neutral-500">Vendor</dt>
        <dd className="font-mono text-xs text-neutral-600">{bill.vendor_id}</dd>

        <dt className="font-medium text-neutral-500">Due Date</dt>
        <dd>{bill.due_date ?? '—'}</dd>

        <dt className="font-medium text-neutral-500">Bill Amount (CAD)</dt>
        <dd className="font-mono">{String(bill.amount_cad)}</dd>

        <dt className="font-medium text-neutral-500">Amount Due</dt>
        <dd className="font-mono font-semibold">{String(bill.amount_due)}</dd>
      </dl>

      {formError && (
        <div className="mb-4 p-3 border border-red-300 rounded bg-red-50 text-sm text-red-600">
          {formError}
        </div>
      )}

      {loading ? (
        <div className="text-sm text-neutral-400">Loading form options...</div>
      ) : (
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <div className="grid grid-cols-2 gap-4 mb-6">
            {/* Payment Method */}
            <div>
              <label className="block text-sm font-medium text-neutral-600 mb-1">
                Payment Method <span className="text-red-500">*</span>
              </label>
              <select
                {...form.register('payment_method')}
                className="w-full border border-neutral-300 rounded px-2 py-1 text-sm"
              >
                <option value="eft">EFT</option>
                <option value="check">Check</option>
                <option value="wire">Wire</option>
                <option value="cash">Cash</option>
                <option value="other">Other</option>
              </select>
              {form.formState.errors.payment_method && (
                <p className="text-sm text-red-500 mt-1">
                  {form.formState.errors.payment_method.message}
                </p>
              )}
            </div>

            {/* Payment Date */}
            <div>
              <label className="block text-sm font-medium text-neutral-600 mb-1">
                Payment Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                {...form.register('payment_date')}
                className="w-full border border-neutral-300 rounded px-2 py-1 text-sm"
              />
              {form.formState.errors.payment_date && (
                <p className="text-sm text-red-500 mt-1">
                  {form.formState.errors.payment_date.message}
                </p>
              )}
            </div>

            {/* Amount (CAD) — partial payment allowed */}
            <div>
              <label className="block text-sm font-medium text-neutral-600 mb-1">
                Amount (CAD) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                {...form.register('amount_cad')}
                placeholder="0.00"
                className="w-full border border-neutral-300 rounded px-2 py-1 text-sm font-mono"
              />
              <p className="text-xs text-neutral-400 mt-0.5">
                Partial payment allowed. Amount due: {String(bill.amount_due)}
              </p>
              {form.formState.errors.amount_cad && (
                <p className="text-sm text-red-500 mt-1">
                  {form.formState.errors.amount_cad.message}
                </p>
              )}
            </div>

            {/* Reference Number (optional) */}
            <div>
              <label className="block text-sm font-medium text-neutral-600 mb-1">
                Reference Number (optional)
              </label>
              <input
                type="text"
                {...form.register('reference_number')}
                placeholder="e.g. cheque #1234"
                className="w-full border border-neutral-300 rounded px-2 py-1 text-sm"
              />
            </div>

            {/* Cash Account */}
            <div>
              <label className="block text-sm font-medium text-neutral-600 mb-1">
                Cash Account <span className="text-red-500">*</span>
              </label>
              {assetAccounts.length === 0 ? (
                <div className="text-sm text-neutral-400">
                  No asset accounts available. Contact your administrator.
                </div>
              ) : (
                <select
                  {...form.register('cash_account_id')}
                  className="w-full border border-neutral-300 rounded px-2 py-1 text-sm"
                >
                  <option value="">Select cash account...</option>
                  {assetAccounts.map((a) => (
                    <option key={a.account_id} value={a.account_id}>
                      {a.account_code} — {a.account_name}
                    </option>
                  ))}
                </select>
              )}
              {form.formState.errors.cash_account_id && (
                <p className="text-sm text-red-500 mt-1">
                  {form.formState.errors.cash_account_id.message}
                </p>
              )}
            </div>

            {/* Fiscal Period */}
            <div>
              <label className="block text-sm font-medium text-neutral-600 mb-1">
                Fiscal Period <span className="text-red-500">*</span>
              </label>
              {periods.length === 0 ? (
                <div className="text-sm text-neutral-400">
                  No open fiscal periods. Contact your administrator to create or unlock a period.
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

            {/* AP Control Account */}
            <div>
              <label className="block text-sm font-medium text-neutral-600 mb-1">
                AP Control Account <span className="text-red-500">*</span>
              </label>
              {liabilityAccounts.length === 0 ? (
                <div className="text-sm text-neutral-400">
                  No liability accounts available. Contact your administrator.
                </div>
              ) : (
                <select
                  {...form.register('ap_control_account_id')}
                  className="w-full border border-neutral-300 rounded px-2 py-1 text-sm"
                >
                  <option value="">Select AP account...</option>
                  {liabilityAccounts.map((a) => (
                    <option key={a.account_id} value={a.account_id}>
                      {a.account_code} — {a.account_name}
                    </option>
                  ))}
                </select>
              )}
              {form.formState.errors.ap_control_account_id && (
                <p className="text-sm text-red-500 mt-1">
                  {form.formState.errors.ap_control_account_id.message}
                </p>
              )}
            </div>
          </div>

          {/* Submit + Cancel */}
          <div className="flex gap-2 mt-2">
            <button
              type="submit"
              disabled={
                submitting ||
                periods.length === 0 ||
                liabilityAccounts.length === 0 ||
                assetAccounts.length === 0
              }
              className="px-4 py-2 bg-neutral-800 text-white text-sm rounded hover:bg-neutral-700 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {submitting ? 'Recording...' : 'Record Payment'}
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
        </form>
      )}
    </div>
  );
}
