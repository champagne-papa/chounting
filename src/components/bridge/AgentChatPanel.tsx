// src/components/bridge/AgentChatPanel.tsx
//
// Two modes:
//   - Phase 1.1 stub (when initialOnboardingState is undefined):
//     empty state with persona-aware suggested prompts. Clicking a
//     suggested prompt shows a "Coming in Phase 1.2" tooltip.
//   - Phase 1.2 Session 5 onboarding mode (when
//     initialOnboardingState is provided): functional chat that
//     POSTs to /api/agent/message with the initial state on first
//     send, renders the conversation, and on onboarding_complete
//     routes the user to the main app layout.
//
// Session 7 rewrites both modes into a unified production chat.
// The prop contract defined here — orgId: string | null plus the
// optional onboarding props — is what Session 7 must honor per
// Session 5 Pre-decision 2.
//
// Layout: onboarding mode takes the full width of its container
// (no fixed 380px, no right border) and hides the collapse
// button. Phase 1.1 stub mode retains the existing sidebar
// styling so the SplitScreenLayout caller is unchanged.

'use client';

import { useCallback, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import { SuggestedPrompts } from './SuggestedPrompts';
import { useTranslations } from 'next-intl';
import type { OnboardingState } from '@/agent/onboarding/state';

interface Props {
  orgId: string | null;
  onCollapse?: () => void;
  initialOnboardingState?: OnboardingState;
  /**
   * Pre-computed destination for onboarding completion (e.g., the
   * invited user's first-membership org). Unset for fresh users,
   * whose first org is created mid-onboarding; in that case the
   * completion handler re-queries memberships client-side.
   */
  onboardingCompletionHref?: string;
}

interface ChatTurn {
  role: 'user' | 'assistant';
  text: string;
}

export function AgentChatPanel({
  orgId,
  onCollapse,
  initialOnboardingState,
  onboardingCompletionHref,
}: Props) {
  if (initialOnboardingState) {
    return (
      <OnboardingChat
        orgId={orgId}
        initialOnboardingState={initialOnboardingState}
        onboardingCompletionHref={onboardingCompletionHref}
      />
    );
  }
  return <StubChat orgId={orgId} onCollapse={onCollapse} />;
}

function StubChat({
  orgId: _orgId,
  onCollapse,
}: {
  orgId: string | null;
  onCollapse?: () => void;
}) {
  const t = useTranslations('agent');
  return (
    <aside className="w-[380px] flex flex-col border-r border-neutral-200 bg-neutral-50">
      <div className="h-10 border-b border-neutral-200 flex items-center justify-between px-3">
        <div className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
          Agent
        </div>
        {onCollapse && (
          <button
            onClick={onCollapse}
            className="text-neutral-400 hover:text-neutral-700 text-sm"
            aria-label="Collapse chat"
          >
            &larr;
          </button>
        )}
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-4 text-center">
        <div className="text-lg font-medium text-neutral-700 mb-1">
          {t('emptyState')}
        </div>
        <div className="text-xs text-neutral-400 mb-6">
          Phase 1.1 — agent activates in Phase 1.2
        </div>
        <SuggestedPrompts />
      </div>
    </aside>
  );
}

function OnboardingChat({
  orgId,
  initialOnboardingState,
  onboardingCompletionHref,
}: {
  orgId: string | null;
  initialOnboardingState: OnboardingState;
  onboardingCompletionHref?: string;
}) {
  const router = useRouter();
  const params = useParams();
  const locale = (params.locale as string) ?? 'en';
  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const [input, setInput] = useState('');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resolveCompletionHref = useCallback(async (): Promise<string> => {
    if (onboardingCompletionHref) return onboardingCompletionHref;
    // Fresh user just created an org mid-onboarding — re-query
    // memberships client-side to find the new org_id.
    try {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      );
      const { data } = await supabase
        .from('memberships')
        .select('org_id')
        .eq('status', 'active')
        .limit(1)
        .maybeSingle();
      if (data?.org_id) return `/${locale}/${data.org_id}`;
    } catch {
      // fall through to default
    }
    return `/${locale}/admin/orgs`;
  }, [onboardingCompletionHref, locale]);

  const send = useCallback(async () => {
    const message = input.trim();
    if (!message || submitting) return;
    setSubmitting(true);
    setError(null);
    setTurns((prev) => [...prev, { role: 'user', text: message }]);
    setInput('');

    const body: Record<string, unknown> = {
      org_id: orgId,
      message,
      locale,
    };
    // Include initial_onboarding only on the first send — Session
    // 5 Pre-decision 3: the state carries through the persisted
    // session after the first turn.
    if (sessionId === null) {
      body.initial_onboarding = initialOnboardingState;
    } else {
      body.session_id = sessionId;
    }

    try {
      const res = await fetch('/api/agent/message', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        setError(`Agent request failed (${res.status}).`);
        setSubmitting(false);
        return;
      }
      const data = await res.json();
      setSessionId(data.session_id);
      const assistantText =
        typeof data.response?.template_id === 'string'
          ? `[${data.response.template_id}]`
          : '(no response)';
      setTurns((prev) => [...prev, { role: 'assistant', text: assistantText }]);

      if (data.onboarding_complete === true) {
        const href = await resolveCompletionHref();
        router.push(href);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setSubmitting(false);
    }
  }, [
    input,
    submitting,
    orgId,
    locale,
    sessionId,
    initialOnboardingState,
    resolveCompletionHref,
    router,
  ]);

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="h-12 border-b border-neutral-200 flex items-center px-4">
        <div className="text-sm font-semibold text-neutral-800">The Bridge</div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-3">
        {turns.length === 0 && (
          <div className="text-sm text-neutral-500">
            Let&apos;s get your profile set up. What&apos;s your name?
          </div>
        )}
        {turns.map((turn, i) => (
          <div
            key={i}
            className={
              turn.role === 'user'
                ? 'text-right'
                : 'text-left text-neutral-700'
            }
          >
            <span
              className={
                turn.role === 'user'
                  ? 'inline-block bg-emerald-100 rounded px-3 py-1 text-sm'
                  : 'inline-block text-sm'
              }
            >
              {turn.text}
            </span>
          </div>
        ))}
        {error && <div className="text-xs text-red-600">{error}</div>}
      </div>

      <form
        className="border-t border-neutral-200 p-3 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          void send();
        }}
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message…"
          className="flex-1 border border-neutral-300 rounded px-3 py-2 text-sm"
          disabled={submitting}
        />
        <button
          type="submit"
          disabled={submitting || input.trim().length === 0}
          className="bg-emerald-600 text-white px-4 py-2 rounded text-sm disabled:opacity-50"
        >
          {submitting ? '...' : 'Send'}
        </button>
      </form>
    </div>
  );
}
