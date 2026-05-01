// src/components/canvas/AiActionReviewTable.tsx
// Phase 1.2 Session 8 Commit 2 — table component for the AI Action
// Review queue. Server component (pure render, no interactivity
// beyond <Link> navigation). Reusable by any future consumer that
// renders ai_actions rows.
//
// Directory: `canvas/` matches P30 verbatim; the route at
// /[locale]/[orgId]/agent/actions is outside the canvas shell, but
// OrgProfileEditor + UserProfileEditor set the precedent that
// src/components/canvas/ holds canvas-OR-route editor/table
// components. Phase 2 cleanup alongside dead ai_action_review_queue
// directive.

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import type {
  AiActionListItem,
  AiActionStatus,
} from '@/services/agent/aiActionsService';

interface Props {
  rows: AiActionListItem[];
  orgId: string;
  locale: string;
}

const STATUS_PILL: Record<AiActionStatus, string> = {
  confirmed:   'bg-green-100 text-green-800',
  auto_posted: 'bg-green-100 text-green-800',
  rejected:    'bg-red-100 text-red-800',
  pending:     'bg-blue-100 text-blue-800',
  stale:       'bg-neutral-100 text-neutral-600',
  edited:      'bg-amber-100 text-amber-800',
};

function formatTimestamp(iso: string, locale: string): string {
  try {
    return new Intl.DateTimeFormat(locale, {
      dateStyle: 'short',
      timeStyle: 'short',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function AiActionReviewTable({ rows, orgId, locale }: Props) {
  const t = useTranslations('aiActionReview');

  if (rows.length === 0) {
    return (
      <p className="text-sm text-neutral-600">{t('empty')}</p>
    );
  }

  return (
    <table className="w-full text-sm border border-neutral-200 rounded-md overflow-hidden">
      <thead className="bg-neutral-50 text-neutral-700">
        <tr>
          <th className="text-left px-3 py-2 font-medium">{t('col.created')}</th>
          <th className="text-left px-3 py-2 font-medium">{t('col.tool')}</th>
          <th className="text-left px-3 py-2 font-medium">{t('col.status')}</th>
          <th className="text-left px-3 py-2 font-medium">{t('col.entry')}</th>
          <th className="text-left px-3 py-2 font-medium">{t('col.resolution')}</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.ai_action_id} className="border-t border-neutral-200">
            <td className="px-3 py-2 text-neutral-700 whitespace-nowrap">
              {formatTimestamp(row.created_at, locale)}
            </td>
            <td className="px-3 py-2 font-mono text-neutral-800">{row.tool_name}</td>
            <td className="px-3 py-2">
              <span
                className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${STATUS_PILL[row.status]}`}
              >
                {t(`status.${row.status}`)}
              </span>
            </td>
            <td className="px-3 py-2">
              {row.status === 'confirmed' && row.journal_entry_id && row.entry_number !== null ? (
                <Link
                  href={`/${locale}/${orgId}/journal-entries/${row.journal_entry_id}`}
                  className="text-blue-600 hover:underline"
                >
                  #{row.entry_number}
                </Link>
              ) : (
                <span className="text-neutral-400">—</span>
              )}
            </td>
            <td className="px-3 py-2 text-neutral-700">
              {row.resolution_reason ?? <span className="text-neutral-400">—</span>}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
