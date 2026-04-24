// src/components/canvas/RecurringTemplateListView.tsx
// Phase 0-1.1 Arc A Step 10b — list view for recurring journal
// templates. Mirrors JournalEntryListView structurally.
//
// Row click navigates to the template's run list (D10b-1 A1 pattern:
// rail icon lands here; row click descends to runs for that template).

'use client';

import { useEffect, useState } from 'react';
import type { CanvasNavigateFn } from '@/shared/types/canvasDirective';
import type { RecurringTemplateListItem } from '@/services/accounting/recurringJournalService';

interface Props {
  orgId: string;
  onNavigate: CanvasNavigateFn;
}

export function RecurringTemplateListView({ orgId, onNavigate }: Props) {
  const [templates, setTemplates] = useState<RecurringTemplateListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch(`/api/orgs/${orgId}/recurring-templates`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data: { templates: RecurringTemplateListItem[]; count: number }) => {
        setTemplates(data.templates ?? []);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Failed to load');
        setTemplates([]);
      })
      .finally(() => setLoading(false));
  }, [orgId]);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Recurring Templates</h2>
        <button
          className="text-sm text-blue-600 hover:underline"
          onClick={() => onNavigate({ type: 'recurring_template_form', orgId })}
        >
          + New Template
        </button>
      </div>

      {loading && (
        <div className="text-sm text-neutral-400">Loading recurring templates...</div>
      )}

      {error && <div className="text-sm text-red-500">{error}</div>}

      {!loading && !error && templates.length === 0 && (
        <div className="text-sm text-neutral-400">
          No recurring templates yet. Click + New Template to create one.
        </div>
      )}

      {!loading && !error && templates.length > 0 && (
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b border-neutral-200 text-left">
              <th className="py-2 pr-4 font-medium text-neutral-500">Name</th>
              <th className="py-2 pr-4 font-medium text-neutral-500">Description</th>
              <th className="py-2 pr-4 font-medium text-neutral-500">Auto-post</th>
              <th className="py-2 pr-4 font-medium text-neutral-500">Active</th>
              <th className="py-2 font-medium text-neutral-500" />
            </tr>
          </thead>
          <tbody>
            {templates.map((t) => (
              <tr
                key={t.recurring_template_id}
                className={`border-b border-neutral-100 hover:bg-neutral-50 cursor-pointer${
                  t.is_active ? '' : ' opacity-60'
                }`}
                onClick={() =>
                  onNavigate({
                    type: 'recurring_run_list',
                    orgId,
                    recurringTemplateId: t.recurring_template_id,
                  })
                }
              >
                <td className="py-2 pr-4 font-medium">{t.template_name}</td>
                <td className="py-2 pr-4 text-neutral-600">{t.description ?? '—'}</td>
                <td className="py-2 pr-4">{t.auto_post ? 'yes' : 'no'}</td>
                <td className="py-2 pr-4">{t.is_active ? 'yes' : 'no'}</td>
                <td className="py-2 text-right text-xs text-blue-600">View runs →</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
