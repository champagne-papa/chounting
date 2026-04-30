// src/components/bridge/ApiStatusDot.tsx
// Green/yellow/red dot showing Claude API availability.
// In Phase 1.1: always green (we don't call the API yet).
// In Phase 1.2: real status from a /api/health/anthropic endpoint.
// When red: Mainframe auto-expands with a banner saying
// "Agent unavailable — use quick navigation."

'use client';

import { useTranslations } from 'next-intl';

type Status = 'green' | 'yellow' | 'red';

interface Props {
  status?: Status;
}

export function ApiStatusDot({ status = 'green' }: Props) {
  const t = useTranslations('nav');

  const color = {
    green: 'bg-emerald-500',
    yellow: 'bg-amber-400',
    red: 'bg-red-500',
  }[status];

  const title = {
    green: 'Agent ready',
    yellow: 'Agent degraded',
    red: t('agentUnavailable'),
  }[status];

  return (
    <div className="flex flex-col items-center gap-1 mb-2" title={title}>
      <div className={`w-3 h-3 rounded-full ${color}`} />
      <div className="text-[9px] text-neutral-500">API</div>
    </div>
  );
}
