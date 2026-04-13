'use client';

import { useEffect, useState } from 'react';
import type { CanvasNavigateFn } from '@/shared/types/canvasDirective';
import type { JournalEntryListItem } from '@/services/accounting/journalEntryService';

interface Props {
  orgId: string;
  onNavigate: CanvasNavigateFn;
}

export function JournalEntryListView({ orgId, onNavigate }: Props) {
  const [entries, setEntries] = useState<JournalEntryListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch(`/api/orgs/${orgId}/journal-entries`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data: { entries: JournalEntryListItem[]; count: number }) => {
        setEntries(data.entries ?? []);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Failed to load');
        setEntries([]);
      })
      .finally(() => setLoading(false));
  }, [orgId]);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Journal Entries</h2>
        <button
          className="text-sm text-blue-600 hover:underline"
          onClick={() => onNavigate({ type: 'journal_entry_form', orgId })}
        >
          + New Entry
        </button>
      </div>

      {loading && (
        <div className="text-sm text-neutral-400">Loading journal entries...</div>
      )}

      {error && (
        <div className="text-sm text-red-500">{error}</div>
      )}

      {!loading && !error && entries.length === 0 && (
        <div className="text-sm text-neutral-400">
          No journal entries yet. Click + New Entry to create one.
        </div>
      )}

      {!loading && !error && entries.length > 0 && (
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b border-neutral-200 text-left">
              <th className="py-2 pr-4 text-right font-medium text-neutral-500">#</th>
              <th className="py-2 pr-4 font-medium text-neutral-500">Date</th>
              <th className="py-2 pr-4 font-medium text-neutral-500">Description</th>
              <th className="py-2 pr-4 font-medium text-neutral-500">Type</th>
              <th className="py-2 pr-4 text-right font-medium text-neutral-500">Debits</th>
              <th className="py-2 text-right font-medium text-neutral-500">Credits</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => (
              <tr
                key={entry.journal_entry_id}
                className="border-b border-neutral-100 hover:bg-neutral-50 cursor-pointer"
                onClick={() =>
                  onNavigate({
                    type: 'journal_entry',
                    orgId,
                    entryId: entry.journal_entry_id,
                    mode: 'view',
                  })
                }
              >
                <td className="py-2 pr-4 text-right">{entry.entry_number}</td>
                <td className="py-2 pr-4">{entry.entry_date}</td>
                <td className="py-2 pr-4">
                  {entry.description}
                  {entry.reverses_journal_entry_id != null && (
                    <span className="text-xs text-amber-600 ml-2">Reversal</span>
                  )}
                </td>
                <td className="py-2 pr-4">{entry.entry_type}</td>
                <td className="py-2 pr-4 text-right font-mono">{entry.total_debit}</td>
                <td className="py-2 text-right font-mono">{entry.total_credit}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
