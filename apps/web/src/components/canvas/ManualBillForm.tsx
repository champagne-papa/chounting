// src/components/canvas/ManualBillForm.tsx
'use client';
//
// Phase 5 chunk B5-3-D3 substantive session #1: ManualBillForm — first
// write-side UI mutation consumer at codebase grain.
// Consumes POST /api/orgs/[orgId]/bills (Task 2 route) which wraps
// billService.post via withInvariants(action: 'bill.post').
// Mirror pattern: JournalEntryForm.tsx canonical (HEAD 4abd387);
// separated form schema (UI shape) + service schema (PostBillInputRaw);
// formStateToServiceInput transform typed against PostBillInputRaw
// (z.input<> = pre-transform plain strings, matching MoneyAmountSchema /
// FxRateSchema .input() before branded-type coercion).
//
// Dropdown endpoints:
//   /api/orgs/${orgId}/fiscal-periods  → { periods: FiscalPeriod[] }
//   /api/orgs/${orgId}/chart-of-accounts → { accounts: Account[] } (client-filtered by account_type)
//   /api/tax-codes  → { taxCodes: TaxCode[] } (flat; globally-readable reference data)
//   /api/orgs/${orgId}/vendors (delegated to VendorPicker component)
//
// ap_control_account_id default-select: first liability account whose
// account_name contains "accounts payable" (case-insensitive).
// fiscal_period_id default-select: first open period (list already ordered
// by service; first element = earliest open period, consistent with
// JournalEntryForm which renders them in order without explicit "current" logic).

import { useEffect, useState } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { PostBillInputRaw } from '@/shared/schemas/spend/bill.schema';
import type { CanvasNavigateFn } from '@/shared/types/canvasDirective';
import { VendorPicker } from '@/components/canvas/_shared/VendorPicker';

// ---------------------------------------------------------------------------
// Form schema (UI shape — intentionally distinct from PostBillInputSchema)
// ---------------------------------------------------------------------------

const ManualBillFormLineSchema = z.object({
  account_id: z.string().uuid({ message: 'Expense account required' }),
  description: z.string().min(1, { message: 'Description required' }),
  amount: z.string().regex(/^\d+(\.\d{1,4})?$/, { message: 'Amount required (numeric, up to 4 decimals)' }),
  tax_code_id: z.string(),
});

const ManualBillFormSchema = z.object({
  vendor_id: z.string().uuid({ message: 'Vendor required' }),
  bill_number: z.string(),
  issue_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'Issue date required (YYYY-MM-DD)' }),
  due_date: z.string(),
  amount_cad: z.string().regex(/^\d+(\.\d{1,4})?$/, { message: 'Amount required (numeric, up to 4 decimals)' }),
  tax_amount_total: z.string(),
  fiscal_period_id: z.string().uuid({ message: 'Fiscal period required' }),
  entry_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'Entry date required (YYYY-MM-DD)' }),
  ap_control_account_id: z.string().uuid({ message: 'AP control account required' }),
  bill_lines: z
    .array(ManualBillFormLineSchema)
    .min(1, { message: 'At least one line required' }),
});

type ManualBillFormState = z.infer<typeof ManualBillFormSchema>;
type ManualBillFormStateInput = z.input<typeof ManualBillFormSchema>;

// ---------------------------------------------------------------------------
// Data-fetching types
// ---------------------------------------------------------------------------

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

type TaxCode = {
  tax_code_id: string;
  code: string;
  rate: string;
  jurisdiction: string;
};

// ---------------------------------------------------------------------------
// Transform: form state -> service input shape (PostBillInputRaw)
// ---------------------------------------------------------------------------

function formStateToServiceInput(
  state: ManualBillFormState,
  orgId: string,
): PostBillInputRaw {
  return {
    org_id: orgId,
    vendor_id: state.vendor_id,
    bill_number: state.bill_number || null,
    issue_date: state.issue_date,
    due_date: state.due_date || null,
    payment_terms_days: null,
    purchase_order_id: null,
    currency: 'CAD',
    amount_original: state.amount_cad,
    amount_cad: state.amount_cad,
    fx_rate: '1',
    tax_amount_total: state.tax_amount_total || '0',
    bill_lines: state.bill_lines.map((l, idx) => ({
      account_id: l.account_id,
      description: l.description,
      amount: l.amount,
      amount_original: l.amount,
      amount_cad: l.amount,
      tax_code_id: l.tax_code_id || null,
      line_number: idx + 1,
    })),
    fiscal_period_id: state.fiscal_period_id,
    entry_date: state.entry_date,
    ap_control_account_id: state.ap_control_account_id,
  };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export type ManualBillFormProps = {
  orgId: string;
  onNavigate: CanvasNavigateFn;
};

const TODAY = new Date().toISOString().slice(0, 10);

export function ManualBillForm({ orgId, onNavigate }: ManualBillFormProps) {
  const [periods, setPeriods] = useState<FiscalPeriod[]>([]);
  const [liabilityAccounts, setLiabilityAccounts] = useState<Account[]>([]);
  const [expenseAccounts, setExpenseAccounts] = useState<Account[]>([]);
  const [taxCodes, setTaxCodes] = useState<TaxCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // --- Form setup (defaultValues before dropdown data; setValue used post-fetch for defaults) ---

  const form = useForm<ManualBillFormStateInput>({
    resolver: zodResolver(ManualBillFormSchema),
    mode: 'onSubmit',
    defaultValues: {
      vendor_id: '',
      bill_number: '',
      issue_date: TODAY,
      due_date: '',
      amount_cad: '',
      tax_amount_total: '0',
      fiscal_period_id: '',
      entry_date: TODAY,
      ap_control_account_id: '',
      bill_lines: [
        { account_id: '', description: '', amount: '', tax_code_id: '' },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'bill_lines',
  });

  // --- Data fetching ---

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    Promise.all([
      fetch(`/api/orgs/${orgId}/fiscal-periods`).then((r) => r.json()),
      fetch(`/api/orgs/${orgId}/chart-of-accounts`).then((r) => r.json()),
      fetch(`/api/tax-codes`).then((r) => r.json()),
    ])
      .then(([periodsData, accountsData, taxCodesData]) => {
        if (cancelled) return;

        const allPeriods: FiscalPeriod[] = periodsData.periods ?? [];
        const allAccounts: Account[] = accountsData.accounts ?? [];
        const allTaxCodes: TaxCode[] = taxCodesData.taxCodes ?? [];

        const liab = allAccounts.filter(
          (a) => a.account_type === 'liability' && a.is_active,
        );
        const exp = allAccounts.filter(
          (a) => a.account_type === 'expense' && a.is_active,
        );

        setPeriods(allPeriods);
        setLiabilityAccounts(liab);
        setExpenseAccounts(exp);
        setTaxCodes(allTaxCodes);

        // Default-select fiscal_period_id: first open period (earliest open, per JournalEntryForm precedent)
        if (allPeriods.length > 0 && !form.getValues('fiscal_period_id')) {
          form.setValue('fiscal_period_id', allPeriods[0].period_id, {
            shouldValidate: false,
          });
        }

        // Default-select ap_control_account_id: first liability account whose name contains
        // "accounts payable" (case-insensitive). COA template seed verification confirms:
        // account_code 2000 + account_name "Accounts Payable" across holding_company + real_estate.
        if (!form.getValues('ap_control_account_id')) {
          const apMatch = liab.find((a) =>
            a.account_name.toLowerCase().includes('accounts payable'),
          );
          if (apMatch) {
            form.setValue('ap_control_account_id', apMatch.account_id, {
              shouldValidate: false,
            });
          }
        }
      })
      .catch(() => {
        if (cancelled) return;
        setPeriods([]);
        setLiabilityAccounts([]);
        setExpenseAccounts([]);
        setTaxCodes([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [orgId, form]);

  // --- Submit handler ---

  const onSubmit = async (formData: ManualBillFormState) => {
    setFormError(null);
    setSubmitting(true);
    try {
      const serviceInput = formStateToServiceInput(formData, orgId);

      const response = await fetch(`/api/orgs/${orgId}/bills`, {
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
        } else if (response.status === 422) {
          setFormError(errorBody.message || 'Unable to post bill');
        } else if (response.status === 401) {
          window.location.href = '/en/sign-in';
          return;
        } else {
          setFormError('An unexpected error occurred. Please try again.');
        }
        return;
      }

      await response.json();
      form.reset();
      onNavigate({ type: 'report_open_bills', orgId });
    } catch {
      setFormError('An unexpected error occurred. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // --- Render ---

  if (loading) {
    return <div className="text-sm text-neutral-400">Loading...</div>;
  }

  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">New Bill</h2>

      {formError && (
        <div className="mb-4 p-3 border border-red-300 rounded bg-red-50 text-sm text-red-600">
          {formError}
        </div>
      )}

      <form onSubmit={form.handleSubmit(onSubmit)}>
        {/* ------------------------------------------------------------------ */}
        {/* Vendor */}
        {/* ------------------------------------------------------------------ */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-neutral-600 mb-1">
            Vendor <span className="text-red-500">*</span>
          </label>
          <Controller
            control={form.control}
            name="vendor_id"
            render={({ field }) => (
              <VendorPicker
                orgId={orgId}
                value={field.value || null}
                onChange={field.onChange}
                disabled={submitting}
              />
            )}
          />
          {form.formState.errors.vendor_id && (
            <p className="text-sm text-red-500 mt-1">
              {form.formState.errors.vendor_id.message}
            </p>
          )}
        </div>

        {/* ------------------------------------------------------------------ */}
        {/* Bill header fields */}
        {/* ------------------------------------------------------------------ */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {/* Bill Number (optional) */}
          <div>
            <label className="block text-sm font-medium text-neutral-600 mb-1">
              Bill Number (optional)
            </label>
            <input
              type="text"
              {...form.register('bill_number')}
              placeholder="e.g. INV-001"
              className="w-full border border-neutral-300 rounded px-2 py-1 text-sm"
            />
          </div>

          {/* Issue Date */}
          <div>
            <label className="block text-sm font-medium text-neutral-600 mb-1">
              Issue Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              {...form.register('issue_date')}
              className="w-full border border-neutral-300 rounded px-2 py-1 text-sm"
            />
            {form.formState.errors.issue_date && (
              <p className="text-sm text-red-500 mt-1">
                {form.formState.errors.issue_date.message}
              </p>
            )}
          </div>

          {/* Due Date (optional) */}
          <div>
            <label className="block text-sm font-medium text-neutral-600 mb-1">
              Due Date (optional)
            </label>
            <input
              type="date"
              {...form.register('due_date')}
              className="w-full border border-neutral-300 rounded px-2 py-1 text-sm"
            />
          </div>

          {/* Bill Amount (CAD) */}
          <div>
            <label className="block text-sm font-medium text-neutral-600 mb-1">
              Bill Amount (CAD) <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              {...form.register('amount_cad')}
              placeholder="0.00"
              className="w-full border border-neutral-300 rounded px-2 py-1 text-sm font-mono"
            />
            {form.formState.errors.amount_cad && (
              <p className="text-sm text-red-500 mt-1">
                {form.formState.errors.amount_cad.message}
              </p>
            )}
          </div>

          {/* Tax Amount Total (optional) */}
          <div>
            <label className="block text-sm font-medium text-neutral-600 mb-1">
              Tax Amount Total (optional)
            </label>
            <input
              type="text"
              {...form.register('tax_amount_total')}
              placeholder="0.00"
              className="w-full border border-neutral-300 rounded px-2 py-1 text-sm font-mono"
            />
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

        {/* ------------------------------------------------------------------ */}
        {/* Bill Lines */}
        {/* ------------------------------------------------------------------ */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-neutral-700">Bill Lines</h3>
            <button
              type="button"
              onClick={() =>
                append({ account_id: '', description: '', amount: '', tax_code_id: '' })
              }
              className="text-xs px-2 py-1 border border-neutral-300 rounded hover:bg-neutral-50"
            >
              + Add Line
            </button>
          </div>

          {form.formState.errors.bill_lines?.root && (
            <p className="text-sm text-red-500 mb-2">
              {form.formState.errors.bill_lines.root.message}
            </p>
          )}

          <div className="space-y-4">
            {fields.map((field, idx) => (
              <div
                key={field.id}
                className="border border-neutral-200 rounded p-3 relative"
              >
                <div className="text-xs text-neutral-400 mb-2">Line {idx + 1}</div>

                {fields.length > 1 && (
                  <button
                    type="button"
                    onClick={() => remove(idx)}
                    className="absolute top-2 right-2 text-xs text-red-400 hover:text-red-600"
                  >
                    Remove
                  </button>
                )}

                <div className="grid grid-cols-2 gap-3">
                  {/* Expense Account */}
                  <div>
                    <label className="block text-xs font-medium text-neutral-600 mb-1">
                      Expense Account <span className="text-red-500">*</span>
                    </label>
                    {expenseAccounts.length === 0 ? (
                      <div className="text-xs text-neutral-400">
                        No expense accounts available.
                      </div>
                    ) : (
                      <select
                        {...form.register(`bill_lines.${idx}.account_id`)}
                        className="w-full border border-neutral-300 rounded px-2 py-1 text-xs"
                      >
                        <option value="">Select account...</option>
                        {expenseAccounts.map((a) => (
                          <option key={a.account_id} value={a.account_id}>
                            {a.account_code} — {a.account_name}
                          </option>
                        ))}
                      </select>
                    )}
                    {form.formState.errors.bill_lines?.[idx]?.account_id && (
                      <p className="text-xs text-red-500 mt-1">
                        {form.formState.errors.bill_lines[idx].account_id?.message}
                      </p>
                    )}
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-xs font-medium text-neutral-600 mb-1">
                      Description <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      {...form.register(`bill_lines.${idx}.description`)}
                      className="w-full border border-neutral-300 rounded px-2 py-1 text-xs"
                    />
                    {form.formState.errors.bill_lines?.[idx]?.description && (
                      <p className="text-xs text-red-500 mt-1">
                        {form.formState.errors.bill_lines[idx].description?.message}
                      </p>
                    )}
                  </div>

                  {/* Amount */}
                  <div>
                    <label className="block text-xs font-medium text-neutral-600 mb-1">
                      Amount <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      {...form.register(`bill_lines.${idx}.amount`)}
                      placeholder="0.00"
                      className="w-full border border-neutral-300 rounded px-2 py-1 text-xs font-mono"
                    />
                    {form.formState.errors.bill_lines?.[idx]?.amount && (
                      <p className="text-xs text-red-500 mt-1">
                        {form.formState.errors.bill_lines[idx].amount?.message}
                      </p>
                    )}
                  </div>

                  {/* Tax Code (optional; /api/tax-codes endpoint exists) */}
                  <div>
                    <label className="block text-xs font-medium text-neutral-600 mb-1">
                      Tax Code (optional)
                    </label>
                    <select
                      {...form.register(`bill_lines.${idx}.tax_code_id`)}
                      className="w-full border border-neutral-300 rounded px-2 py-1 text-xs"
                    >
                      <option value="">None</option>
                      {taxCodes.map((tc) => (
                        <option key={tc.tax_code_id} value={tc.tax_code_id}>
                          {tc.code} ({tc.rate}%) — {tc.jurisdiction}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ------------------------------------------------------------------ */}
        {/* Submit */}
        {/* ------------------------------------------------------------------ */}
        <div className="mt-6">
          <button
            type="submit"
            disabled={
              submitting ||
              loading ||
              periods.length === 0 ||
              liabilityAccounts.length === 0 ||
              expenseAccounts.length === 0
            }
            className="px-4 py-2 bg-neutral-800 text-white text-sm rounded hover:bg-neutral-700 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {submitting ? 'Posting...' : 'Post Bill'}
          </button>
        </div>
      </form>
    </div>
  );
}
