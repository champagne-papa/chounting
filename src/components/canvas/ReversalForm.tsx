// src/components/canvas/ReversalForm.tsx
// Reversal form — fetches a source journal entry, computes mirrored lines
// (debits/credits swapped), and collects editable fields before posting.

'use client';

import { useEffect, useMemo, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import type { CanvasNavigateFn } from '@/shared/types/canvasDirective';
import type { JournalEntryDetail } from '@/services/accounting/journalEntryService';
import type { FiscalPeriodListItem } from '@/services/accounting/periodService';
import {
  mirrorLines,
  type MirrorableLine,
} from '@/shared/schemas/accounting/journalEntry.schema';
import type { MoneyAmount, FxRate } from '@/shared/schemas/accounting/money.schema';

// ---------------------------------------------------------------------------
// Form schema (inline, not exported)
// ---------------------------------------------------------------------------

const ReversalFormSchema = z.object({
  fiscal_period_id: z.string().uuid({ message: 'Fiscal period is required' }),
  entry_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'Invalid date format' }),
  reversal_reason: z.string().min(1, { message: 'Reversal reason is required' }),
});

type ReversalFormStateInput = z.input<typeof ReversalFormSchema>;
type ReversalFormState = z.infer<typeof ReversalFormSchema>;

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface Props {
  orgId: string;
  sourceEntryId: string;
  onNavigate: CanvasNavigateFn;
}

// ---------------------------------------------------------------------------
// Transform: form state -> service input shape
// ---------------------------------------------------------------------------

function buildReversalInput(
  form: ReversalFormState,
  mirroredLines: MirrorableLine[],
  sourceEntry: JournalEntryDetail,
  orgId: string,
) {
  return {
    org_id: orgId,
    fiscal_period_id: form.fiscal_period_id,
    entry_date: form.entry_date,
    description: `Reversal of entry #${sourceEntry.entry_number}`,
    // reference is optional — omit (Zod .optional() accepts undefined, NOT null)
    source: 'manual' as const,
    reverses_journal_entry_id: sourceEntry.journal_entry_id,
    reversal_reason: form.reversal_reason,
    lines: mirroredLines.map((line) => ({
      account_id: line.account_id,
      debit_amount: line.debit_amount,
      credit_amount: line.credit_amount,
      currency: line.currency,
      amount_original: line.amount_original,
      amount_cad: line.amount_cad,
      fx_rate: line.fx_rate,
      tax_code_id: line.tax_code_id,
      // description omitted — z.string().optional() accepts undefined, not null
    })),
  };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ReversalForm({ orgId, sourceEntryId, onNavigate }: Props) {
  // --- Read-only derived state (NOT in react-hook-form) ---
  const [sourceEntry, setSourceEntry] = useState<JournalEntryDetail | null>(null);
  const [openPeriods, setOpenPeriods] = useState<FiscalPeriodListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // --- User-editable form state (react-hook-form with zodResolver) ---
  const form = useForm<ReversalFormStateInput>({
    resolver: zodResolver(ReversalFormSchema),
    defaultValues: {
      fiscal_period_id: '',
      entry_date: new Date().toISOString().slice(0, 10),
      reversal_reason: '',
    },
  });

  // --- Data fetching on mount ---

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLoadError(null);

    Promise.all([
      fetch(`/api/orgs/${orgId}/journal-entries/${sourceEntryId}`).then((res) => {
        if (!res.ok) throw new Error(`Failed to load source entry: HTTP ${res.status}`);
        return res.json() as Promise<JournalEntryDetail>;
      }),
      fetch(`/api/orgs/${orgId}/fiscal-periods`).then((res) => {
        if (!res.ok) throw new Error(`Failed to load fiscal periods: HTTP ${res.status}`);
        return res.json() as Promise<{ periods: FiscalPeriodListItem[]; count: number }>;
      }),
    ])
      .then(([entry, periodsResponse]) => {
        if (cancelled) return;
        setSourceEntry(entry);
        setOpenPeriods(periodsResponse.periods);

        // Default: source entry's period if still open, else first open period
        const sourcePeriodStillOpen = periodsResponse.periods.find(
          (p) => p.period_id === entry.fiscal_period_id,
        );
        const defaultPeriodId =
          sourcePeriodStillOpen?.period_id ?? periodsResponse.periods[0]?.period_id ?? '';

        form.setValue('fiscal_period_id', defaultPeriodId);
      })
      .catch((err) => {
        if (cancelled) return;
        setLoadError(err instanceof Error ? err.message : 'Failed to load data');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [orgId, sourceEntryId, form]);

  // --- Mirrored lines (derived via useMemo) ---

  const mirroredLines = useMemo<MirrorableLine[]>(() => {
    if (!sourceEntry) return [];
    return mirrorLines(
      sourceEntry.journal_lines.map((line) => ({
        account_id: line.account_id,
        debit_amount: line.debit_amount as MoneyAmount,
        credit_amount: line.credit_amount as MoneyAmount,
        currency: line.currency,
        amount_original: line.amount_original as MoneyAmount,
        amount_cad: line.amount_cad as MoneyAmount,
        fx_rate: line.fx_rate as FxRate,
        tax_code_id: line.tax_code_id,
      })),
    );
  }, [sourceEntry]);

  // --- Period gap detection ---

  const selectedPeriodId = useWatch({ control: form.control, name: 'fiscal_period_id' });

  const periodGap = useMemo(() => {
    if (!sourceEntry || !selectedPeriodId) return null;
    if (selectedPeriodId === sourceEntry.fiscal_period_id) return null;

    const selectedPeriod = openPeriods.find((p) => p.period_id === selectedPeriodId);
    const sourcePeriodName = sourceEntry.fiscal_periods?.name ?? '(unknown period)';
    const selectedPeriodName = selectedPeriod?.name ?? '(unknown period)';

    return { sourcePeriodName, selectedPeriodName };
  }, [sourceEntry, openPeriods, selectedPeriodId]);

  // --- Submit handler ---

  const onSubmit = form.handleSubmit(async (formValues) => {
    if (!sourceEntry) {
      setFormError('Source entry not loaded yet');
      return;
    }

    setSubmitting(true);
    setFormError(null);

    try {
      const input = buildReversalInput(formValues, mirroredLines, sourceEntry, orgId);

      const response = await fetch(`/api/orgs/${orgId}/journal-entries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });

      if (response.status === 401) {
        window.location.href = '/en/sign-in';
        return;
      }

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({ error: 'Unknown error' }));
        setFormError(errorBody.message ?? errorBody.error ?? `HTTP ${response.status}`);
        return;
      }

      const result = (await response.json()) as {
        journal_entry_id: string;
        entry_number: number;
      };

      // Success: navigate to detail view of the NEW reversal entry
      onNavigate({
        type: 'journal_entry',
        orgId,
        entryId: result.journal_entry_id,
        mode: 'view',
      });
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setSubmitting(false);
    }
  });

  // --- Render ---

  if (loading) {
    return <div className="text-sm text-neutral-400">Loading...</div>;
  }

  if (loadError) {
    return <div className="text-sm text-red-500">{loadError}</div>;
  }

  if (!sourceEntry) {
    return <div className="text-sm text-neutral-400">Source entry not found.</div>;
  }

  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">
        Reverse Journal Entry #{sourceEntry.entry_number}
      </h2>

      {/* Source context (read-only) */}
      <div className="mb-4 text-sm text-neutral-600">
        <div>
          <span className="font-medium">Original Date:</span> {sourceEntry.entry_date}
        </div>
        <div>
          <span className="font-medium">Original Description:</span> {sourceEntry.description}
        </div>
      </div>

      {/* Period gap banner */}
      {periodGap && (
        <div className="bg-yellow-50 border border-yellow-300 text-yellow-900 p-3 text-sm rounded mb-4">
          You are reversing a {periodGap.sourcePeriodName} entry into{' '}
          {periodGap.selectedPeriodName}. The reversal will appear in{' '}
          {periodGap.selectedPeriodName}, not in the original period, because{' '}
          {periodGap.sourcePeriodName} is closed. Verify this is the behaviour
          you want before posting.
        </div>
      )}

      {/* Mirrored lines preview (read-only) */}
      <div className="mb-6">
        <span className="text-sm font-medium text-neutral-600 block mb-2">
          Reversal Lines (preview)
        </span>
        <table className="w-full text-sm border border-neutral-200 rounded">
          <thead>
            <tr className="bg-neutral-50 border-b border-neutral-200">
              <th className="text-left px-3 py-2 font-medium text-neutral-600">Account</th>
              <th className="text-right px-3 py-2 font-medium text-neutral-600">Debit</th>
              <th className="text-right px-3 py-2 font-medium text-neutral-600">Credit</th>
            </tr>
          </thead>
          <tbody>
            {/* mirrorLines preserves order (verified in mirrorLines.test.ts) */}
            {mirroredLines.map((mLine, i) => {
              const sourceLine = sourceEntry.journal_lines[i];
              return (
                <tr key={sourceLine.journal_line_id} className="border-b border-neutral-100">
                  <td className="px-3 py-2">
                    {sourceLine.chart_of_accounts?.account_code ?? sourceLine.account_id}
                  </td>
                  <td className="px-3 py-2 text-right font-mono">
                    {mLine.debit_amount !== '0.0000' ? mLine.debit_amount : ''}
                  </td>
                  <td className="px-3 py-2 text-right font-mono">
                    {mLine.credit_amount !== '0.0000' ? mLine.credit_amount : ''}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Form error */}
      {formError && (
        <div className="mb-4 p-3 border border-red-300 rounded bg-red-50 text-sm text-red-600">
          {formError}
        </div>
      )}

      <form onSubmit={onSubmit}>
        {/* Editable fields */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {/* Fiscal Period */}
          <div>
            <label className="block text-sm font-medium text-neutral-600 mb-1">
              Fiscal Period
            </label>
            <select
              {...form.register('fiscal_period_id')}
              className="w-full border border-neutral-300 rounded px-2 py-1 text-sm"
            >
              <option value="">Select a period...</option>
              {openPeriods.map((p) => (
                <option key={p.period_id} value={p.period_id}>
                  {p.name}
                </option>
              ))}
            </select>
            {form.formState.errors.fiscal_period_id && (
              <p className="text-sm text-red-500 mt-1">
                {form.formState.errors.fiscal_period_id.message}
              </p>
            )}
          </div>

          {/* Reversal Date */}
          <div>
            <label className="block text-sm font-medium text-neutral-600 mb-1">
              Reversal Date
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

        {/* Reversal Reason */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-neutral-600 mb-1">
            Reversal Reason
          </label>
          <textarea
            {...form.register('reversal_reason')}
            rows={3}
            className="w-full border border-neutral-300 rounded px-2 py-1 text-sm"
          />
          {form.formState.errors.reversal_reason && (
            <p className="text-sm text-red-500 mt-1">
              {form.formState.errors.reversal_reason.message}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={submitting}
            className="px-4 py-2 bg-neutral-800 text-white text-sm rounded hover:bg-neutral-700 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {submitting ? 'Posting...' : 'Post Reversal'}
          </button>
          <button
            type="button"
            onClick={() =>
              onNavigate({ type: 'journal_entry', orgId, entryId: sourceEntryId, mode: 'view' })
            }
            className="px-4 py-2 border border-neutral-300 text-sm rounded hover:bg-neutral-50"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
