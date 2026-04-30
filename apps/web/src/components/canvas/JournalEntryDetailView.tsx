'use client';

import { useEffect, useMemo, useState } from 'react';
import type { CanvasNavigateFn } from '@/shared/types/canvasDirective';
import type { JournalEntryDetail } from '@/services/accounting/journalEntryService';
import {
  addMoney,
  zeroMoney,
  type MoneyAmount,
} from '@/shared/schemas/accounting/money.schema';

interface Props {
  orgId: string;
  entryId: string;
  onNavigate: CanvasNavigateFn;
}

export function JournalEntryDetailView({ orgId, entryId, onNavigate }: Props) {
  const [entry, setEntry] = useState<JournalEntryDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch(`/api/orgs/${orgId}/journal-entries/${entryId}`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data: JournalEntryDetail) => {
        setEntry(data);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Failed to load');
        setEntry(null);
      })
      .finally(() => setLoading(false));
  }, [orgId, entryId]);

  const totals = useMemo(() => {
    if (!entry) return { debit: zeroMoney(), credit: zeroMoney() };
    let debit: MoneyAmount = zeroMoney();
    let credit: MoneyAmount = zeroMoney();
    for (const line of entry.journal_lines) {
      debit = addMoney(debit, line.debit_amount as MoneyAmount);
      credit = addMoney(credit, line.credit_amount as MoneyAmount);
    }
    return { debit, credit };
  }, [entry]);

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <button
          className="text-sm text-blue-600 hover:underline"
          onClick={() => onNavigate({ type: 'journal_entry_list', orgId })}
        >
          &larr; Back to list
        </button>
        {entry && (
          <h2 className="text-lg font-semibold">
            Journal Entry #{entry.entry_number}
          </h2>
        )}
      </div>

      {loading && (
        <div className="text-sm text-neutral-400">Loading...</div>
      )}

      {error && (
        <div className="text-sm text-red-500">{error}</div>
      )}

      {!entry && !loading && !error && (
        <div className="text-sm text-neutral-400">Journal entry not found.</div>
      )}

      {entry && (
        <>
          {/* Entry metadata */}
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm mb-6">
            <dt className="font-medium text-neutral-500">Entry Number</dt>
            <dd>{entry.entry_number}</dd>

            <dt className="font-medium text-neutral-500">Date</dt>
            <dd>{entry.entry_date}</dd>

            <dt className="font-medium text-neutral-500">Description</dt>
            <dd>{entry.description}</dd>

            <dt className="font-medium text-neutral-500">Reference</dt>
            <dd>{entry.reference ?? '—'}</dd>

            <dt className="font-medium text-neutral-500">Source</dt>
            <dd>{entry.source}</dd>

            <dt className="font-medium text-neutral-500">Type</dt>
            <dd>{entry.entry_type}</dd>

            <dt className="font-medium text-neutral-500">Created</dt>
            <dd>{new Date(entry.created_at).toLocaleString()}</dd>

            {entry.reverses_journal_entry_id != null && (() => {
              // Capture entry.reverses into a local const so the
              // type narrowing survives into the onClick closure.
              // Naked `entry.reverses!.entry_id` would be a
              // non-null-assertion footgun; the capture is the
              // safe idiom.
              const reversesTarget = entry.reverses;
              return (
                <>
                  <dt className="font-medium text-neutral-500">Reverses Entry</dt>
                  <dd>
                    {reversesTarget ? (
                      <button
                        className="text-blue-600 hover:underline"
                        onClick={() =>
                          onNavigate({
                            type: 'journal_entry',
                            orgId,
                            entryId: reversesTarget.entry_id,
                            mode: 'view',
                          })
                        }
                      >
                        #{reversesTarget.entry_number}
                      </button>
                    ) : (
                      '—'
                    )}
                  </dd>

                  <dt className="font-medium text-neutral-500">Reason</dt>
                  <dd>{entry.reversal_reason ?? '—'}</dd>
                </>
              );
            })()}

            {entry.entry_type === 'adjusting' && entry.adjustment_reason && (
              <>
                <dt className="font-medium text-neutral-500">Adjustment Reason</dt>
                <dd>{entry.adjustment_reason}</dd>
              </>
            )}
          </dl>

          {/* Lines table */}
          <table className="w-full text-sm border-collapse mb-4">
            <thead>
              <tr className="border-b border-neutral-200 text-left">
                <th className="py-2 pr-4 font-medium text-neutral-500">Account</th>
                <th className="py-2 pr-4 font-medium text-neutral-500">Description</th>
                <th className="py-2 pr-4 text-right font-medium text-neutral-500">Debit</th>
                <th className="py-2 pr-4 text-right font-medium text-neutral-500">Credit</th>
                <th className="py-2 font-medium text-neutral-500">Currency</th>
              </tr>
            </thead>
            <tbody>
              {entry.journal_lines.map((line) => (
                <tr
                  key={line.journal_line_id}
                  className="border-b border-neutral-100 hover:bg-neutral-50"
                >
                  <td className="py-2 pr-4">
                    {line.chart_of_accounts?.account_code ?? '—'} —{' '}
                    {line.chart_of_accounts?.account_name ?? 'Unknown'}
                  </td>
                  <td className="py-2 pr-4">{line.description ?? '—'}</td>
                  <td className="py-2 pr-4 text-right font-mono">
                    {line.debit_amount !== '0.0000' ? line.debit_amount : ''}
                  </td>
                  <td className="py-2 pr-4 text-right font-mono">
                    {line.credit_amount !== '0.0000' ? line.credit_amount : ''}
                  </td>
                  <td className="py-2">{line.currency}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-neutral-200">
                <td className="py-2 pr-4" />
                <td className="py-2 pr-4 font-semibold text-right">Totals</td>
                <td className="py-2 pr-4 text-right font-mono font-semibold">
                  {totals.debit}
                </td>
                <td className="py-2 pr-4 text-right font-mono font-semibold">
                  {totals.credit}
                </td>
                <td className="py-2" />
              </tr>
            </tfoot>
          </table>

          {/* Actions */}
          <div className="mt-4">
            {entry.reversed_by ? (() => {
              // Capture entry.reversed_by into a local const so
              // the type narrowing survives into the onClick
              // closure. Naked `entry.reversed_by!.entry_id`
              // would be a non-null-assertion footgun; the
              // capture is the safe idiom (mirrors the reverses
              // block above).
              const reversedByTarget = entry.reversed_by;
              return (
                <div className="text-sm text-neutral-500">
                  This entry has already been reversed by{' '}
                  <button
                    className="text-blue-600 hover:underline"
                    onClick={() =>
                      onNavigate({
                        type: 'journal_entry',
                        orgId,
                        entryId: reversedByTarget.entry_id,
                        mode: 'view',
                      })
                    }
                  >
                    Entry #{reversedByTarget.entry_number}
                  </button>
                </div>
              );
            })() : (
              <button
                className="text-sm text-red-600 hover:underline"
                onClick={() =>
                  onNavigate({
                    type: 'reversal_form',
                    orgId,
                    sourceEntryId: entry.journal_entry_id,
                  })
                }
              >
                Reverse this entry
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
