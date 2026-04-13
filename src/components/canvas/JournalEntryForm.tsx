// src/components/canvas/JournalEntryForm.tsx
// Journal entry creation form. Fetches dropdown data from API routes,
// manages dynamic lines via useFieldArray, computes running balance
// with branded MoneyAmount types, and POSTs to the journal entries API.

'use client';

import { useEffect, useMemo, useState } from 'react';
import { useForm, useFieldArray, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  MoneyAmountSchema,
  addMoney,
  eqMoney,
  zeroMoney,
  oneRate,
  type MoneyAmount,
} from '@/shared/schemas/accounting/money.schema';
import type { CanvasNavigateFn } from '@/shared/types/canvasDirective';

// ---------------------------------------------------------------------------
// Form schema (UI shape — intentionally different from PostJournalEntryInputSchema)
// ---------------------------------------------------------------------------

const JournalEntryFormLineSchema = z.object({
  account_id: z.string().uuid({ message: 'Account is required' }),
  debit_or_credit: z.enum(['debit', 'credit'], {
    message: 'Select debit or credit',
  }),
  amount: MoneyAmountSchema,
  tax_code_id: z.union([z.string().uuid(), z.literal('')]).optional().transform((v) => v || undefined),
});

export const JournalEntryFormSchema = z.object({
  fiscal_period_id: z.string().uuid({ message: 'Period is required' }),
  entry_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'Date must be YYYY-MM-DD' }),
  description: z.string().min(1, { message: 'Description is required' }),
  reference: z.string().optional(),
  lines: z.array(JournalEntryFormLineSchema).min(2, {
    message: 'At least 2 lines are required',
  }),
});

export type JournalEntryFormState = z.infer<typeof JournalEntryFormSchema>;
export type JournalEntryFormStateInput = z.input<typeof JournalEntryFormSchema>;

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
  is_intercompany_capable: boolean;
  is_active: boolean;
};
type TaxCode = {
  tax_code_id: string;
  code: string;
  rate: string;
  jurisdiction: string;
};

// ---------------------------------------------------------------------------
// Transform: form state -> service input shape
// ---------------------------------------------------------------------------

function formStateToServiceInput(
  formState: JournalEntryFormStateInput,
  orgId: string,
): Record<string, unknown> {
  const lines = formState.lines.map((line) => {
    const amount = line.amount as MoneyAmount;
    const isDebit = line.debit_or_credit === 'debit';
    return {
      account_id: line.account_id,
      debit_amount: isDebit ? amount : zeroMoney(),
      credit_amount: isDebit ? zeroMoney() : amount,
      currency: 'CAD',
      amount_original: amount,
      amount_cad: amount,
      fx_rate: oneRate(),
      tax_code_id: line.tax_code_id || undefined,
    };
  });

  return {
    org_id: orgId,
    fiscal_period_id: formState.fiscal_period_id,
    entry_date: formState.entry_date,
    description: formState.description,
    reference: formState.reference || undefined,
    source: 'manual' as const,
    lines,
  };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

type JournalEntryFormProps = {
  orgId: string;
  onNavigate: CanvasNavigateFn;
  prefill?: Record<string, unknown>; // Reserved for Task 15 reversal; ignored in Task 13
};

export function JournalEntryForm({ orgId, onNavigate }: JournalEntryFormProps) {
  const [periods, setPeriods] = useState<FiscalPeriod[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [taxCodes, setTaxCodes] = useState<TaxCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // --- Data fetching ---

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch(`/api/orgs/${orgId}/fiscal-periods`).then((r) => r.json()),
      fetch(`/api/orgs/${orgId}/chart-of-accounts`).then((r) => r.json()),
      fetch(`/api/tax-codes`).then((r) => r.json()),
    ])
      .then(([periodsData, accountsData, taxCodesData]) => {
        setPeriods(periodsData.periods ?? []);
        setAccounts(accountsData.accounts ?? []);
        setTaxCodes(taxCodesData.taxCodes ?? []);
      })
      .catch(() => {
        setPeriods([]);
        setAccounts([]);
        setTaxCodes([]);
      })
      .finally(() => setLoading(false));
  }, [orgId]);

  // --- Form setup ---

  const form = useForm<JournalEntryFormStateInput>({
    resolver: zodResolver(JournalEntryFormSchema),
    mode: 'onSubmit',
    defaultValues: {
      fiscal_period_id: '',
      entry_date: new Date().toISOString().slice(0, 10),
      description: '',
      reference: '',
      lines: [
        { account_id: '', debit_or_credit: 'debit', amount: '', tax_code_id: '' },
        { account_id: '', debit_or_credit: 'credit', amount: '', tax_code_id: '' },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'lines',
  });

  // --- Running balance ---

  const watchedLines = useWatch({ control: form.control, name: 'lines' });

  const balanceState = useMemo(() => {
    let totalDebit: MoneyAmount = zeroMoney();
    let totalCredit: MoneyAmount = zeroMoney();
    let allValid = true;

    for (const line of watchedLines) {
      const amountResult = MoneyAmountSchema.safeParse(line.amount);
      if (!amountResult.success) {
        allValid = false;
        break;
      }

      if (line.debit_or_credit === 'debit') {
        totalDebit = addMoney(totalDebit, amountResult.data);
      } else {
        totalCredit = addMoney(totalCredit, amountResult.data);
      }
    }

    if (!allValid) {
      return {
        display: '—',
        totalDebit: null,
        totalCredit: null,
        balanced: false,
        hasInput: false,
      };
    }

    const isInitial = eqMoney(totalDebit, zeroMoney()) && eqMoney(totalCredit, zeroMoney());

    return {
      display: `Debits: ${totalDebit} / Credits: ${totalCredit}`,
      totalDebit,
      totalCredit,
      balanced: !isInitial && eqMoney(totalDebit, totalCredit),
      hasInput: !isInitial,
    };
  }, [watchedLines]);

  // --- Submit handler ---

  const onSubmit = async (formData: JournalEntryFormStateInput) => {
    setFormError(null);
    setSubmitting(true);
    try {
      const serviceInput = formStateToServiceInput(formData, orgId);

      const response = await fetch(`/api/orgs/${orgId}/journal-entries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(serviceInput),
      });

      if (!response.ok) {
        const errorBody = await response.json();

        if (response.status === 400 && errorBody.details) {
          for (const issue of errorBody.details) {
            const path = issue.path.join('.');
            form.setError(path as Parameters<typeof form.setError>[0], { message: issue.message });
          }
        } else if (response.status === 422) {
          setFormError(errorBody.message || 'Unable to post entry');
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
      onNavigate({ type: 'journal_entry_list', orgId });
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
      <h2 className="text-lg font-semibold mb-4">New Journal Entry</h2>

      {formError && (
        <div className="mb-4 p-3 border border-red-300 rounded bg-red-50 text-sm text-red-600">
          {formError}
        </div>
      )}

      <form onSubmit={form.handleSubmit(onSubmit)}>
        {/* Header fields */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {/* Fiscal Period */}
          <div>
            <label className="block text-sm font-medium text-neutral-600 mb-1">
              Fiscal Period
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
              Entry Date
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

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-neutral-600 mb-1">
              Description
            </label>
            <input
              type="text"
              {...form.register('description')}
              className="w-full border border-neutral-300 rounded px-2 py-1 text-sm"
            />
            {form.formState.errors.description && (
              <p className="text-sm text-red-500 mt-1">
                {form.formState.errors.description.message}
              </p>
            )}
          </div>

          {/* Reference */}
          <div>
            <label className="block text-sm font-medium text-neutral-600 mb-1">
              Reference (optional)
            </label>
            <input
              type="text"
              {...form.register('reference')}
              className="w-full border border-neutral-300 rounded px-2 py-1 text-sm"
            />
          </div>
        </div>

        {/* Lines section */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-neutral-600">Lines</span>
            <button
              type="button"
              onClick={() => append({ account_id: '', debit_or_credit: 'debit', amount: '', tax_code_id: '' })}
              className="text-sm text-blue-600 hover:underline"
            >
              + Add Line
            </button>
          </div>

          {form.formState.errors.lines?.message && (
            <p className="text-sm text-red-500 mb-2">
              {form.formState.errors.lines.message}
            </p>
          )}

          <div className="space-y-3">
            {fields.map((field, index) => (
              <div key={field.id} className="flex items-start gap-2 p-3 border border-neutral-200 rounded">
                {/* Account */}
                <div className="flex-1 min-w-0">
                  <label className="block text-xs text-neutral-500 mb-0.5">Account</label>
                  {accounts.length === 0 ? (
                    <div className="text-sm text-neutral-400">
                      No accounts available. Contact your administrator.
                    </div>
                  ) : (
                    <select
                      {...form.register(`lines.${index}.account_id`)}
                      className="w-full border border-neutral-300 rounded px-2 py-1 text-sm"
                    >
                      <option value="">Select account...</option>
                      {accounts.map((a) => (
                        <option key={a.account_id} value={a.account_id}>
                          {a.account_code} — {a.account_name}
                        </option>
                      ))}
                    </select>
                  )}
                  {form.formState.errors.lines?.[index]?.account_id && (
                    <p className="text-sm text-red-500 mt-0.5">
                      {form.formState.errors.lines[index].account_id.message}
                    </p>
                  )}
                </div>

                {/* Debit/Credit */}
                <div className="w-24">
                  <label className="block text-xs text-neutral-500 mb-0.5">D/C</label>
                  <select
                    {...form.register(`lines.${index}.debit_or_credit`)}
                    className="w-full border border-neutral-300 rounded px-2 py-1 text-sm"
                  >
                    <option value="debit">Debit</option>
                    <option value="credit">Credit</option>
                  </select>
                  {form.formState.errors.lines?.[index]?.debit_or_credit && (
                    <p className="text-sm text-red-500 mt-0.5">
                      {form.formState.errors.lines[index].debit_or_credit.message}
                    </p>
                  )}
                </div>

                {/* Amount */}
                <div className="w-32">
                  <label className="block text-xs text-neutral-500 mb-0.5">Amount</label>
                  <input
                    type="text"
                    {...form.register(`lines.${index}.amount`)}
                    placeholder="0.00"
                    className="w-full border border-neutral-300 rounded px-2 py-1 text-sm font-mono"
                  />
                  {form.formState.errors.lines?.[index]?.amount && (
                    <p className="text-sm text-red-500 mt-0.5">
                      {form.formState.errors.lines[index].amount.message}
                    </p>
                  )}
                </div>

                {/* Tax Code */}
                <div className="w-36">
                  <label className="block text-xs text-neutral-500 mb-0.5">Tax Code</label>
                  <select
                    {...form.register(`lines.${index}.tax_code_id`)}
                    className="w-full border border-neutral-300 rounded px-2 py-1 text-sm"
                  >
                    <option value="">— No tax —</option>
                    {taxCodes.map((tc) => (
                      <option key={tc.tax_code_id} value={tc.tax_code_id}>
                        {tc.code} ({tc.rate})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Remove */}
                <div className="pt-4">
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    disabled={fields.length <= 2}
                    className="text-sm text-red-600 hover:underline disabled:text-neutral-400 disabled:no-underline"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Balance indicator */}
        <div className="mt-4 p-3 rounded border border-neutral-200">
          <div className="text-sm text-neutral-500">Balance</div>
          <div
            className={`text-base font-mono ${
              balanceState.hasInput
                ? balanceState.balanced
                  ? 'text-green-600'
                  : 'text-red-600'
                : 'text-neutral-400'
            }`}
          >
            {balanceState.display}
          </div>
        </div>

        {/* Submit */}
        <div className="mt-6">
          <button
            type="submit"
            disabled={submitting || loading || periods.length === 0 || accounts.length === 0}
            className="px-4 py-2 bg-neutral-800 text-white text-sm rounded hover:bg-neutral-700 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {submitting ? 'Posting...' : 'Post Entry'}
          </button>
        </div>
      </form>
    </div>
  );
}
