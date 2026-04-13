// src/components/bridge/MainframeRail.tsx
// The far-left icon rail. Always visible. Provides direct-launch
// navigation for the most common canvas views.

'use client';

import { ApiStatusDot } from './ApiStatusDot';
import type { CanvasDirective } from '@/shared/types/canvasDirective';
import { useTranslations } from 'next-intl';

interface Props {
  orgId: string;
  onNavigate: (d: CanvasDirective) => void;
}

const ICONS = [
  { id: 'coa',      label: 'Chart of Accounts', icon: '\u{1F4D2}' },
  { id: 'journals', label: 'Journal Entries',    icon: '\u{1F4D4}' },
  { id: 'pl',            label: 'P&L Report',         icon: '\u{1F4CA}' },
  { id: 'trial_balance', label: 'Trial Balance',      icon: '\u2696' },
  { id: 'actions',       label: 'AI Action Review',   icon: '\u2705' },
] as const;

export function MainframeRail({ orgId, onNavigate }: Props) {
  const _t = useTranslations('nav');

  function handleClick(id: string) {
    switch (id) {
      case 'coa':
        return onNavigate({ type: 'chart_of_accounts', orgId });
      case 'journals':
        return onNavigate({ type: 'journal_entry_list', orgId });
      case 'pl':
        return onNavigate({ type: 'report_pl', orgId });
      case 'trial_balance':
        return onNavigate({ type: 'report_trial_balance', orgId });
      case 'actions':
        return onNavigate({ type: 'ai_action_review_queue', orgId });
    }
  }

  return (
    <nav className="flex flex-col items-center w-16 border-r border-neutral-200 bg-white py-3 gap-2">
      <div className="text-xs font-bold text-neutral-500 tracking-widest mb-2">
        MAIN
      </div>
      {ICONS.map((item) => (
        <button
          key={item.id}
          onClick={() => handleClick(item.id)}
          title={item.label}
          className="w-10 h-10 rounded-md hover:bg-neutral-100 flex items-center justify-center text-xl"
        >
          {item.icon}
        </button>
      ))}
      <div className="flex-1" />
      <ApiStatusDot />
    </nav>
  );
}
