// src/components/bridge/AgentChatPanel.tsx
//
// Two modes, chosen at the top-level wrapper:
//   - Onboarding (initialOnboardingState provided): OnboardingChat
//     subcomponent, unchanged from Session 5.
//   - Production (initialOnboardingState absent): ProductionChat
//     subcomponent — Session 7 Commit 3. Mount-time conversation
//     fetch, ChatTurn rendering (user text, assistant text + card
//     + pill), send flow with status=sending/sent/failed, three
//     error UI treatments (banner+retry for Q11; inline retry on
//     user turn for network failures; normal template rendering
//     for agent-emitted errors), empty-state SuggestedPrompts
//     wired to the send path (one-click-fire).

'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { createBrowserClient } from '@supabase/ssr';
import { SuggestedPrompts } from './SuggestedPrompts';
import { ProposedEntryCard } from '@/components/ProposedEntryCard';
import type { OnboardingState } from '@/agent/onboarding/state';
import type { UserRole } from '@/shared/types/userRole';
import type {
  ChatTurn,
  ChatTurnAssistant,
  ChatTurnUser,
} from '@/shared/types/chatTurn';
import type {
  CanvasDirective,
  CanvasNavigateFn,
} from '@/shared/types/canvasDirective';
import type { CanvasContext } from '@/shared/types/canvasContext';
import { hasGroundingContext } from '@/agent/canvas/reduceSelection';

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
  /**
   * Session 7 Commit 3: persona for the empty-state suggested
   * prompts. Parent (SplitScreenLayout) reads the current user's
   * role from its membership context; defaults here to
   * 'controller' so the component is safe when unwired.
   */
  currentUserRole?: UserRole;
  /**
   * Session 7.1 Commit 5: the canvas state (current directive +
   * optional selection) the parent shell holds, forwarded to the
   * orchestrator on every send via `canvas_context` — but only
   * when `hasGroundingContext` is true. Optional for welcome /
   * onboarding-mode callsites that have no canvas shell.
   */
  canvasContext?: CanvasContext;
  /**
   * Session 7.1 Commit 5: directive-navigation callback flowed
   * down to ProposedEntryCard so Approve/Edit can switch the
   * canvas. Wrapped by SplitScreenLayout.handleCanvasNavigate so
   * every directive change runs the selection reducer first.
   */
  onNavigate?: CanvasNavigateFn;
}

export function AgentChatPanel({
  orgId,
  onCollapse,
  initialOnboardingState,
  onboardingCompletionHref,
  currentUserRole = 'controller',
  canvasContext,
  onNavigate,
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
  return (
    <ProductionChat
      orgId={orgId}
      onCollapse={onCollapse}
      currentUserRole={currentUserRole}
      canvasContext={canvasContext}
      onNavigate={onNavigate}
    />
  );
}

// -----------------------------------------------------------------
// ProductionChat — Session 7 Commit 3
// -----------------------------------------------------------------

function ProductionChat({
  orgId,
  onCollapse,
  currentUserRole,
  canvasContext,
  onNavigate,
}: {
  orgId: string | null;
  onCollapse?: () => void;
  currentUserRole: UserRole;
  canvasContext?: CanvasContext;
  onNavigate?: CanvasNavigateFn;
}) {
  const tHeading = useTranslations('agent');
  const tRoot = useTranslations();
  const params = useParams();
  const locale = (params.locale as string) ?? 'en';

  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [bannerError, setBannerError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  // Mount-time conversation fetch (Pre-decision 8).
  useEffect(() => {
    if (!orgId) {
      setLoading(false);
      return;
    }
    const ac = new AbortController();
    (async () => {
      try {
        const res = await fetch(
          `/api/agent/conversation?org_id=${encodeURIComponent(orgId)}`,
          { signal: ac.signal },
        );
        if (!res.ok) {
          // Non-fatal: surface empty state, user can still send.
          setLoading(false);
          return;
        }
        const data = (await res.json()) as {
          turns: ChatTurn[];
          session_id: string | null;
        };
        setTurns(data.turns);
        setSessionId(data.session_id);
      } catch {
        // AbortError or network; show empty state.
      } finally {
        setLoading(false);
      }
    })();
    return () => ac.abort();
  }, [orgId]);

  // Scroll to bottom on turn changes.
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [turns.length]);

  const send = useCallback(
    async (message: string) => {
      const trimmed = message.trim();
      if (!trimmed || submitting) return;
      setSubmitting(true);
      setBannerError(null);

      const userTurnId = crypto.randomUUID();
      const userTurn: ChatTurnUser = {
        role: 'user',
        id: userTurnId,
        text: trimmed,
        timestamp: new Date().toISOString(),
        status: 'sending',
      };
      setTurns((prev) => [...prev, userTurn]);
      setInput('');

      try {
        const body: Record<string, unknown> = {
          org_id: orgId,
          message: trimmed,
          locale,
        };
        if (sessionId !== null) {
          body.session_id = sessionId;
        }
        if (canvasContext && hasGroundingContext(canvasContext)) {
          body.canvas_context = canvasContext;
        }
        const res = await fetch('/api/agent/message', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(body),
        });

        if (!res.ok) {
          let detailMessage = `Agent request failed (${res.status}).`;
          try {
            const detail = await res.json();
            if (typeof detail?.message === 'string') detailMessage = detail.message;
          } catch {
            // ignore parse failure
          }
          if (res.status >= 500 || res.status === 503) {
            // Q11-class: banner + retry. User turn stays as 'failed'
            // so the inline retry affordance is also available.
            setBannerError(detailMessage);
          }
          setTurns((prev) =>
            prev.map((t) =>
              t.id === userTurnId && t.role === 'user'
                ? { ...t, status: 'failed' as const, error_detail: detailMessage }
                : t,
            ),
          );
          return;
        }

        const data = (await res.json()) as {
          session_id: string;
          response: { template_id: string; params: Record<string, unknown> };
          canvas_directive?: CanvasDirective;
          trace_id: string;
          onboarding_complete?: boolean;
        };

        const directive = data.canvas_directive;
        const card =
          directive?.type === 'proposed_entry_card' ? directive.card : undefined;
        const pill =
          directive && directive.type !== 'proposed_entry_card'
            ? directive
            : undefined;
        const assistantTurn: ChatTurnAssistant = {
          role: 'assistant',
          id: crypto.randomUUID(),
          template_id: data.response.template_id,
          params: data.response.params,
          ...(card !== undefined && { card }),
          ...(pill !== undefined && { canvas_directive_pill: pill }),
          timestamp: new Date().toISOString(),
          trace_id: data.trace_id,
        };

        setTurns((prev) => {
          const flipped = prev.map((t) =>
            t.id === userTurnId && t.role === 'user'
              ? { ...t, status: 'sent' as const }
              : t,
          );
          return [...flipped, assistantTurn];
        });
        setSessionId(data.session_id);
      } catch (err) {
        // Network failure — fetch threw. Inline retry on user turn.
        const msg = err instanceof Error ? err.message : 'Network error';
        setTurns((prev) =>
          prev.map((t) =>
            t.id === userTurnId && t.role === 'user'
              ? { ...t, status: 'failed' as const, error_detail: msg }
              : t,
          ),
        );
      } finally {
        setSubmitting(false);
      }
    },
    [orgId, locale, sessionId, submitting, canvasContext],
  );

  const retryTurn = useCallback(
    (turnId: string) => {
      const failed = turns.find(
        (t): t is ChatTurnUser =>
          t.role === 'user' && t.id === turnId && t.status === 'failed',
      );
      if (!failed) return;
      setTurns((prev) => prev.filter((t) => t.id !== turnId));
      void send(failed.text);
    },
    [turns, send],
  );

  const onCardResolved = useCallback(
    (
      cardTurnId: string,
      resolution:
        | { outcome: 'approved'; journal_entry_id: string; entry_number?: number }
        | { outcome: 'rejected'; reason?: string }
        | { outcome: 'edited' },
    ) => {
      // Append an optimistic ack turn using the existing locale
      // keys. Source-of-truth on refresh is the server-derived
      // card_resolution from conversation-load; these optimistic
      // turns aren't persisted this commit.
      let ackTurn: ChatTurnAssistant | null = null;
      const now = new Date().toISOString();
      if (resolution.outcome === 'approved') {
        ackTurn = {
          role: 'assistant',
          id: crypto.randomUUID(),
          template_id: 'agent.entry.posted',
          params:
            resolution.entry_number !== undefined
              ? { entry_number: resolution.entry_number }
              : {},
          timestamp: now,
          trace_id: '00000000-0000-0000-0000-000000000000',
        };
      } else if (resolution.outcome === 'rejected') {
        ackTurn = {
          role: 'assistant',
          id: crypto.randomUUID(),
          template_id: 'agent.entry.rejected',
          params: {},
          timestamp: now,
          trace_id: '00000000-0000-0000-0000-000000000000',
        };
      }
      // For 'edited' we don't synthesize an ack turn — the canvas
      // pre-fills the form and the next user action drives the
      // next turn.
      setTurns((prev) => {
        const withResolution = prev.map((t) => {
          if (t.role !== 'assistant' || t.id !== cardTurnId) return t;
          const card_resolution =
            resolution.outcome === 'approved'
              ? resolution.entry_number !== undefined
                ? ({
                    status: 'approved' as const,
                    journal_entry_id: resolution.journal_entry_id,
                    entry_number: resolution.entry_number,
                  } as const)
                : undefined
              : resolution.outcome === 'rejected'
              ? ({
                  status: 'rejected' as const,
                  ...(resolution.reason && { reason: resolution.reason }),
                } as const)
              : ({ status: 'edited' as const } as const);
          return card_resolution
            ? { ...t, card_resolution }
            : { ...t, card_resolution: { status: 'edited' as const } };
        });
        return ackTurn ? [...withResolution, ackTurn] : withResolution;
      });
    },
    [],
  );

  const renderAssistantText = (turn: ChatTurnAssistant): string => {
    try {
      return tRoot(turn.template_id, turn.params as never);
    } catch {
      return turn.template_id;
    }
  };

  return (
    <aside className="w-[380px] flex flex-col border-r border-neutral-200 bg-white">
      <div className="h-10 border-b border-neutral-200 flex items-center justify-between px-3">
        <div className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
          Agent
        </div>
        {onCollapse && (
          <button
            type="button"
            onClick={onCollapse}
            className="text-neutral-400 hover:text-neutral-700 text-sm"
            aria-label="Collapse chat"
          >
            &larr;
          </button>
        )}
      </div>

      {bannerError && (
        <div
          className="bg-amber-50 border-b border-amber-200 px-3 py-2 text-xs text-amber-800 flex items-center justify-between"
          data-testid="agent-banner-error"
        >
          <span>{bannerError}</span>
          <button
            type="button"
            className="underline text-amber-900"
            onClick={() => setBannerError(null)}
            aria-label="Dismiss banner"
          >
            Dismiss
          </button>
        </div>
      )}

      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-3 py-4 space-y-3"
        data-testid="agent-transcript"
      >
        {loading && (
          <div className="text-xs text-neutral-400">Loading conversation…</div>
        )}
        {!loading && turns.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center px-2">
            <div className="text-base font-medium text-neutral-700 mb-2">
              {tHeading('emptyState')}
            </div>
            <SuggestedPrompts role={currentUserRole} onSelect={send} />
          </div>
        )}
        {turns.map((turn) => (
          <TurnView
            key={turn.id}
            turn={turn}
            renderAssistantText={renderAssistantText}
            onRetry={retryTurn}
            onCardResolved={onCardResolved}
            onNavigate={onNavigate}
          />
        ))}
      </div>

      <form
        className="border-t border-neutral-200 p-3 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          void send(input);
        }}
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message…"
          className="flex-1 border border-neutral-300 rounded px-3 py-2 text-sm"
          disabled={submitting}
          data-testid="agent-input"
        />
        <button
          type="submit"
          disabled={submitting || input.trim().length === 0}
          className="bg-emerald-600 text-white px-4 py-2 rounded text-sm disabled:opacity-50"
          data-testid="agent-send"
        >
          {submitting ? '...' : 'Send'}
        </button>
      </form>
    </aside>
  );
}

function TurnView({
  turn,
  renderAssistantText,
  onRetry,
  onCardResolved,
  onNavigate,
}: {
  turn: ChatTurn;
  renderAssistantText: (turn: ChatTurnAssistant) => string;
  onRetry: (turnId: string) => void;
  onCardResolved: (
    turnId: string,
    resolution:
      | { outcome: 'approved'; journal_entry_id: string; entry_number?: number }
      | { outcome: 'rejected'; reason?: string }
      | { outcome: 'edited' },
  ) => void;
  onNavigate?: CanvasNavigateFn;
}) {
  if (turn.role === 'user') {
    return (
      <div className="text-right" data-testid={`turn-user-${turn.status}`}>
        <span
          className={`inline-block rounded px-3 py-1 text-sm ${
            turn.status === 'failed'
              ? 'bg-red-100 text-red-900'
              : 'bg-emerald-100 text-neutral-800'
          }`}
        >
          {turn.text}
        </span>
        {turn.status === 'sending' && (
          <div className="text-xs text-neutral-400 mt-1">Sending…</div>
        )}
        {turn.status === 'failed' && (
          <div className="mt-1 flex items-center justify-end gap-2 text-xs text-red-700">
            <span>Failed{turn.error_detail ? `: ${turn.error_detail}` : ''}</span>
            <button
              type="button"
              className="underline"
              onClick={() => onRetry(turn.id)}
              data-testid={`turn-user-retry-${turn.id}`}
            >
              Retry
            </button>
          </div>
        )}
      </div>
    );
  }
  const text = renderAssistantText(turn);
  const hasCard = turn.card !== undefined;
  const isCardResolved = turn.card_resolution !== undefined;
  return (
    <div
      className="text-left text-neutral-800 space-y-2"
      data-testid="turn-assistant"
    >
      {text && <div className="text-sm">{text}</div>}
      {hasCard && !isCardResolved && (
        <ProposedEntryCard
          card={turn.card!}
          onResolved={(r) => onCardResolved(turn.id, r)}
          onNavigate={onNavigate}
        />
      )}
      {hasCard && isCardResolved && (
        <CardResolvedBadge resolution={turn.card_resolution!} />
      )}
      {turn.canvas_directive_pill && (
        <div className="inline-block text-xs rounded border border-neutral-300 px-2 py-0.5 bg-neutral-50 text-neutral-600">
          {humanizePillType(turn.canvas_directive_pill.type)}
        </div>
      )}
    </div>
  );
}

function CardResolvedBadge({
  resolution,
}: {
  resolution: NonNullable<ChatTurnAssistant['card_resolution']>;
}) {
  if (resolution.status === 'approved') {
    return (
      <div className="text-xs text-emerald-700" data-testid="card-resolved-approved">
        ✓ Posted as #{resolution.entry_number}
      </div>
    );
  }
  if (resolution.status === 'rejected') {
    return (
      <div className="text-xs text-neutral-600" data-testid="card-resolved-rejected">
        ✕ Rejected{resolution.reason ? ` — ${resolution.reason}` : ''}
      </div>
    );
  }
  if (resolution.status === 'edited') {
    return (
      <div className="text-xs text-neutral-600" data-testid="card-resolved-edited">
        ✎ Edited and replaced
      </div>
    );
  }
  return (
    <div className="text-xs text-neutral-500" data-testid="card-resolved-stale">
      — Proposal stale
    </div>
  );
}

function humanizePillType(type: string): string {
  return type.replace(/_/g, ' ');
}

// -----------------------------------------------------------------
// OnboardingChat — unchanged from Session 5
// -----------------------------------------------------------------

interface OnboardingTurn {
  role: 'user' | 'assistant';
  text: string;
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
  const [turns, setTurns] = useState<OnboardingTurn[]>([]);
  const [input, setInput] = useState('');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resolveCompletionHref = useCallback(async (): Promise<string> => {
    if (onboardingCompletionHref) return onboardingCompletionHref;
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
