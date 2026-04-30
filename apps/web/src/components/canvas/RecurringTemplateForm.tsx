// src/components/canvas/RecurringTemplateForm.tsx
// Phase 0-1.1 Arc A Step 10b — form for creating a recurring journal
// template. Structural template: AdjustmentForm. Consumes the shared
// <LineEditor /> extracted in the same session.

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
  type MoneyAmount,
} from '@/shared/schemas/accounting/money.schema';
import type { CanvasNavigateFn } from '@/shared/types/canvasDirective';
import { LineEditor } from '@/components/canvas/LineEditor';

// ---------------------------------------------------------------------------
// Form schema (UI shape — bridges to RecurringTemplateInputSchema via transform)
// ---------------------------------------------------------------------------

const RecurringTemplateFormLineSchema = z.object({
  account_id: z.string().uuid({ message: 'Account is required' }),
  debit_or_credit: z.enum(['debit', 'credit'], {
    message: 'Select debit or credit',
  }),
  amount: MoneyAmountSchema,
  tax_code_id: z.union([z.string().uuid(), z.literal('')]).optional().transform((v) => v || undefined),
});

const RecurringTemplateFormSchema = z.object({
  template_name: z.string().min(1, { message: 'Template name is required' }),
  description: z.string().optional(),
  auto_post: z.boolean().default(false),
  lines: z.array(RecurringTemplateFormLineSchema).min(2, {
    message: 'At least 2 lines are required',
  }),
});

type RecurringTemplateFormStateInput = z.input<typeof RecurringTemplateFormSchema>;

// ---------------------------------------------------------------------------
// Data-fetching types
// ---------------------------------------------------------------------------

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
// Transform: form state -> service input shape (RecurringTemplateInputSchema)
// ---------------------------------------------------------------------------

function formStateToServiceInput(
  formState: RecurringTemplateFormStateInput,
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
      tax_code_id: line.tax_code_id || undefined,
    };
  });

  return {
    org_id: orgId,
    template_name: formState.template_name,
    description: formState.description || undefined,
    auto_post: formState.auto_post,
    lines,
  };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

type Props = {
  orgId: string;
  onNavigate: CanvasNavigateFn;
};

export function RecurringTemplateForm({ orgId, onNavigate }: Props) {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [taxCodes, setTaxCodes] = useState<TaxCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch(`/api/orgs/${orgId}/chart-of-accounts`).then((r) => r.json()),
      fetch(`/api/tax-codes`).then((r) => r.json()),
    ])
      .then(([accountsData, taxCodesData]) => {
        setAccounts(accountsData.accounts ?? []);
        setTaxCodes(taxCodesData.taxCodes ?? []);
      })
      .catch(() => {
        setAccounts([]);
        setTaxCodes([]);
      })
      .finally(() => setLoading(false));
  }, [orgId]);

  const form = useForm<RecurringTemplateFormStateInput>({
    resolver: zodResolver(RecurringTemplateFormSchema),
    mode: 'onSubmit',
    defaultValues: {
      template_name: '',
      description: '',
      auto_post: false,
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
        balanced: false,
        hasInput: false,
      };
    }

    const isInitial = eqMoney(totalDebit, zeroMoney()) && eqMoney(totalCredit, zeroMoney());

    return {
      display: `Debits: ${totalDebit} / Credits: ${totalCredit}`,
      balanced: !isInitial && eqMoney(totalDebit, totalCredit),
      hasInput: !isInitial,
    };
  }, [watchedLines]);

  const onSubmit = async (formData: RecurringTemplateFormStateInput) => {
    setFormError(null);
    setSubmitting(true);
    try {
      const serviceInput = formStateToServiceInput(formData, orgId);

      const response = await fetch(`/api/orgs/${orgId}/recurring-templates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(serviceInput),
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({ error: 'Unknown error' }));
        if (response.status === 400 && errorBody.details) {
          for (const issue of errorBody.details) {
            const path = issue.path.join('.');
            form.setError(path as Parameters<typeof form.setError>[0], { message: issue.message });
          }
        } else if (response.status === 422) {
          setFormError(errorBody.message || 'Unable to create template');
        } else if (response.status === 401) {
          window.location.href = '/en/sign-in';
          return;
        } else {
          setFormError(errorBody.message ?? errorBody.error ?? 'An unexpected error occurred.');
        }
        return;
      }

      await response.json();
      onNavigate({ type: 'recurring_template_list', orgId });
    } catch {
      setFormError('An unexpected error occurred. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="text-sm text-neutral-400">Loading...</div>;
  }

  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">New Recurring Template</h2>

      {formError && (
        <div className="mb-4 p-3 border border-red-300 rounded bg-red-50 text-sm text-red-600">
          {formError}
        </div>
      )}

      <form onSubmit={form.handleSubmit(onSubmit)}>
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-neutral-600 mb-1">
              Template Name
            </label>
            <input
              type="text"
              {...form.register('template_name')}
              className="w-full border border-neutral-300 rounded px-2 py-1 text-sm"
            />
            {form.formState.errors.template_name && (
              <p className="text-sm text-red-500 mt-1">
                {form.formState.errors.template_name.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-600 mb-1">
              Description (optional)
            </label>
            <input
              type="text"
              {...form.register('description')}
              className="w-full border border-neutral-300 rounded px-2 py-1 text-sm"
            />
          </div>
        </div>

        {/* Auto-post checkbox with explanatory subtext (Phase 1 UX — avoid
            misleading the controller into thinking auto_post bypasses
            approval). Phase 2 scheduler will make this flag consequential. */}
        <div className="mb-6">
          <label className="flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              {...form.register('auto_post')}
              className="mt-0.5"
            />
            <span>
              <span className="font-medium text-neutral-700">
                Auto-post generated runs (bypass approval)
              </span>
              <span className="block text-xs text-neutral-500 mt-0.5">
                When checked, generated runs will be posted automatically. Phase 1 requires
                controllers to approve each run individually — this flag is reserved for the
                Phase 2 scheduler and currently has no effect on the approval flow.
              </span>
            </span>
          </label>
        </div>

        {/* Lines section — shared component (Step 10b extraction). */}
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

        <div className="mt-6">
          <button
            type="submit"
            disabled={submitting || loading || accounts.length === 0}
            className="px-4 py-2 bg-neutral-800 text-white text-sm rounded hover:bg-neutral-700 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {submitting ? 'Saving...' : 'Save Template'}
          </button>
          <button
            type="button"
            onClick={() => onNavigate({ type: 'recurring_template_list', orgId })}
            className="ml-3 px-4 py-2 border border-neutral-300 text-sm rounded hover:bg-neutral-50"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
