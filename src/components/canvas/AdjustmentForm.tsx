// src/components/canvas/AdjustmentForm.tsx
// Line editor JSX copy-pasted from JournalEntryForm (Step 9b;
// Step 12 queue item 17 tracks the eventual extraction).

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
import { LineEditor } from '@/components/canvas/LineEditor';

// ---------------------------------------------------------------------------
// Form schema (UI shape — bridges to AdjustmentInputSchema via transform below)
// ---------------------------------------------------------------------------

const AdjustmentFormLineSchema = z.object({
  account_id: z.string().uuid({ message: 'Account is required' }),
  debit_or_credit: z.enum(['debit', 'credit'], {
    message: 'Select debit or credit',
  }),
  amount: MoneyAmountSchema,
  tax_code_id: z.union([z.string().uuid(), z.literal('')]).optional().transform((v) => v || undefined),
});

const AdjustmentFormSchema = z.object({
  fiscal_period_id: z.string().uuid({ message: 'Period is required' }),
  entry_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'Date must be YYYY-MM-DD' }),
  description: z.string().min(1, { message: 'Description is required' }),
  reference: z.string().optional(),
  adjustment_reason: z.string().min(1, { message: 'Adjustment reason is required' }),
  lines: z.array(AdjustmentFormLineSchema).min(2, {
    message: 'At least 2 lines are required',
  }),
});

type AdjustmentFormStateInput = z.input<typeof AdjustmentFormSchema>;

// ---------------------------------------------------------------------------
// Data-fetching types (shape mirrors JournalEntryForm)
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
// Transform: form state -> service input shape (adjusting-entry branch)
// ---------------------------------------------------------------------------

function formStateToServiceInput(
  formState: AdjustmentFormStateInput,
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
    entry_type: 'adjusting' as const,
    adjustment_reason: formState.adjustment_reason,
    lines,
  };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

type AdjustmentFormProps = {
  orgId: string;
  onNavigate: CanvasNavigateFn;
};

export function AdjustmentForm({ orgId, onNavigate }: AdjustmentFormProps) {
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

  const form = useForm<AdjustmentFormStateInput>({
    resolver: zodResolver(AdjustmentFormSchema),
    mode: 'onSubmit',
    defaultValues: {
      fiscal_period_id: '',
      entry_date: new Date().toISOString().slice(0, 10),
      description: '',
      reference: '',
      adjustment_reason: '',
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

  const onSubmit = async (formData: AdjustmentFormStateInput) => {
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

      const result = (await response.json()) as {
        journal_entry_id: string;
        entry_number: number;
      };

      onNavigate({
        type: 'journal_entry',
        orgId,
        entryId: result.journal_entry_id,
        mode: 'view',
      });
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
      <h2 className="text-lg font-semibold mb-4">New Adjusting Entry</h2>

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

        {/* Adjustment Reason */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-neutral-600 mb-1">
            Adjustment Reason
          </label>
          <textarea
            {...form.register('adjustment_reason')}
            rows={3}
            className="w-full border border-neutral-300 rounded px-2 py-1 text-sm"
          />
          {form.formState.errors.adjustment_reason && (
            <p className="text-sm text-red-500 mt-1">
              {form.formState.errors.adjustment_reason.message}
            </p>
          )}
        </div>

        {/* Lines section — shared component (Step 10b extraction; Step 12 queue item 17 resolved). */}
        <LineEditor
          register={form.register}
          errors={form.formState.errors}
          fields={fields}
          append={append}
          remove={remove}
          accounts={accounts}
          taxCodes={taxCodes}
        />

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

        {/* Actions */}
        <div className="mt-6">
          <button
            type="submit"
            disabled={submitting || loading || periods.length === 0 || accounts.length === 0}
            className="px-4 py-2 bg-neutral-800 text-white text-sm rounded hover:bg-neutral-700 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {submitting ? 'Posting...' : 'Post Adjusting Entry'}
          </button>
          <button
            type="button"
            onClick={() => onNavigate({ type: 'journal_entry_list', orgId })}
            className="ml-3 px-4 py-2 border border-neutral-300 text-sm rounded hover:bg-neutral-50"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
