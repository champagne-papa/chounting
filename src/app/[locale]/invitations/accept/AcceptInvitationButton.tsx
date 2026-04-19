// src/app/[locale]/invitations/accept/AcceptInvitationButton.tsx
// Phase 1.2 Session 6 §6.5 — small client component for the
// invitation-accept CTA. POSTs to /api/invitations/accept and
// navigates to the org on success.

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Props {
  token: string;
  redirectTo: string;
}

type State = 'idle' | 'submitting' | 'error';

export function AcceptInvitationButton({ token, redirectTo }: Props) {
  const router = useRouter();
  const [state, setState] = useState<State>('idle');
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setState('submitting');
    setError(null);
    try {
      const res = await fetch('/api/invitations/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      const body = await res.json();
      if (!res.ok) {
        setError(body?.message ?? body?.error ?? 'Could not accept invitation.');
        setState('error');
        return;
      }
      router.push(redirectTo);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not accept invitation.');
      setState('error');
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleClick}
        disabled={state === 'submitting'}
        className="w-full px-4 py-2 rounded-md bg-neutral-900 text-white text-sm font-medium hover:bg-neutral-800 disabled:opacity-50"
      >
        {state === 'submitting' ? 'Accepting…' : 'Accept invitation'}
      </button>
      {error && (
        <div className="mt-3 text-sm text-red-600" role="alert">{error}</div>
      )}
    </div>
  );
}
