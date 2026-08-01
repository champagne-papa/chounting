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
//
// Phase 6.5 chunk 3: ProductionChat gains chat-input drag-drop /
// paste / "+" button intake affordances per Sub-Q9.b.α staged-
// with-explicit-ingest. Staged attachments tray renders above the
// chat input form. Unified Send fires both ingest + chat message
// (Sub-Q9.c.α): ingest-only-path = attachments + empty text;
// send-with-attached-message-path = attachments + text. Three-
// moment acknowledgment composite (Sub-Q10): drop → tray entry
// (no separate UI); Send → transient toast "Ingesting N
// documents..." (~3s fade); ingest completion → onDropEvent Prop
// fire (SplitScreenLayout consumer opens new canvas tab via
// canvasTabRouting.routeNewTab Pattern γ Rule 1 + EC3.β one-tab-
// per-batch). Failure-path toast persists until dismissed
// (Sub-Q10.b.γ). beforeunload prompt for staged-files-on-reload
// (Sub-Q9.d.α session-only persistence; File objects don't
// serialize). Cut 1 Flow (a) substrate inheritance:
// /api/orgs/[orgId]/documents/ingest/drag-drop endpoint reused
// without modification; ingestionService.handleDragDropUpload
// withInvariants-wrapped per Pattern B external-wrap (Phase 6
// chunk 6.2b precedent).

'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { StagedFileTile } from './composer/StagedFileTile';
import { StagedFilePreview } from './composer/StagedFilePreview';
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

// Phase 6.5 chunk 3: window event fired by ProductionChat after an
// ingest completes; Zone1ConsolidatedPanel listens and refreshes
// the "Pending Documents" nav-item count badge. Same event name as
// Zone1ConsolidatedPanel's listener (module-private; one canonical
// string).
const PENDING_DOCUMENTS_REFRESH_EVENT = 'chounting:pending-documents-changed';

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
  /**
   * S32 Pre-decision 5 §B: first-arrival signal from the org-root
   * page (`?first_arrival=1`). When true and ProductionChat is
   * empty, render a single sober handoff line above the
   * SuggestedPrompts empty state.
   */
  firstArrival?: boolean;
  /**
   * Phase 6.5 chunk 1: when true, render the collapsed 44px rail-
   * mode with new-output badge instead of the full chat panel.
   * Parent SplitScreenLayout flows this from useShellState
   * .zone2Collapsed.
   */
  collapsed?: boolean;
  /**
   * Phase 6.5 chunk 1: click-to-expand callback for the collapsed
   * rail. Counterpart to onCollapse.
   */
  onExpand?: () => void;
  /**
   * Phase 6.5 chunk 3 (Task 7): invoked after ingest completion
   * with a `pending_documents` canvas directive carrying the just-
   * created ingest_batch_id. SplitScreenLayout consumer fires
   * canvasTabRouting.routeNewTab per Pattern γ Rule 1 + EC3.β
   * one-tab-per-batch (no focusExistingExactMatch; every drop
   * batch is unique via drop_session_id and gets its own tab).
   */
  onDropEvent?: (directive: CanvasDirective) => void;
}

export function AgentChatPanel({
  orgId,
  onCollapse,
  initialOnboardingState,
  onboardingCompletionHref,
  currentUserRole = 'controller',
  canvasContext,
  onNavigate,
  firstArrival,
  collapsed,
  onExpand,
  onDropEvent,
}: Props) {
  // Phase 6.5 chunk 1: collapsed-rail unread tracking. unreadCount
  // increments when a new assistant turn arrives WHILE collapsed;
  // resets to 0 when collapsed flips false (expand).
  const [unreadCount, setUnreadCount] = useState(0);
  const collapsedRef = useRef<boolean>(collapsed ?? false);

  useEffect(() => {
    collapsedRef.current = collapsed ?? false;
    if (!collapsed) {
      setUnreadCount(0);
    }
  }, [collapsed]);

  const handleAssistantTurnAdded = useCallback(() => {
    if (collapsedRef.current) {
      setUnreadCount((prev) => prev + 1);
    }
  }, []);

  if (collapsed) {
    return <CollapsedAgentRail unreadCount={unreadCount} onExpand={onExpand} />;
  }

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
      firstArrival={firstArrival}
      onAssistantTurnAdded={handleAssistantTurnAdded}
      onDropEvent={onDropEvent}
    />
  );
}

// -----------------------------------------------------------------
// CollapsedAgentRail — Phase 6.5 chunk 1
// -----------------------------------------------------------------

function CollapsedAgentRail({
  unreadCount,
  onExpand,
}: {
  unreadCount: number;
  onExpand?: () => void;
}) {
  return (
    <aside
      data-zone="2"
      data-collapsed="true"
      aria-label="Agent chat collapsed rail"
      className="flex h-full w-11 flex-col items-center border-r border-neutral-200 bg-white py-3"
    >
      <button
        type="button"
        onClick={onExpand}
        title="Expand agent chat (Cmd+Shift+\\)"
        aria-label="Expand agent chat"
        className="relative flex h-9 w-9 items-center justify-center rounded-md hover:bg-neutral-100"
        data-testid="agent-collapsed-expand"
      >
        <span className="text-[10px] font-bold tracking-widest text-neutral-500">
          AI
        </span>
        {unreadCount > 0 && (
          <span
            data-testid="agent-collapsed-badge"
            className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full border border-neutral-800 bg-white px-1 text-[10px] font-bold text-neutral-800"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>
    </aside>
  );
}

// -----------------------------------------------------------------
// ProductionChat — Session 7 Commit 3
// -----------------------------------------------------------------

// Phase 6.5 chunk 3 (Task 6): toast lifecycle state machine.
type ToastState =
  | { kind: 'idle' }
  | { kind: 'ingesting'; fileCount: number; appearedAt: number }
  | { kind: 'success'; appearedAt: number }
  | { kind: 'error'; code: string; message: string };

function ProductionChat({
  orgId,
  onCollapse,
  currentUserRole,
  canvasContext,
  onNavigate,
  firstArrival,
  onAssistantTurnAdded,
  onDropEvent,
}: {
  orgId: string | null;
  onCollapse?: () => void;
  currentUserRole: UserRole;
  canvasContext?: CanvasContext;
  onNavigate?: CanvasNavigateFn;
  firstArrival?: boolean;
  /**
   * Phase 6.5 chunk 1: fired after a new assistant turn is appended
   * via the `send` path. Used by the AgentChatPanel wrapper to bump
   * the collapsed-rail unread badge. Card-resolution acks (from
   * `onCardResolved`) deliberately do NOT fire this — those are
   * user-initiated outputs, not unsolicited agent output.
   */
  onAssistantTurnAdded?: () => void;
  /**
   * Phase 6.5 chunk 3 (Task 7): fired after ingest completion with
   * a `pending_documents` directive carrying the new ingest_batch_id.
   */
  onDropEvent?: (directive: CanvasDirective) => void;
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

  // Phase 6.5 chunk 3 (Task 4): staged attachments tray + drop
  // affordance state. attachments is in-memory React state per
  // Sub-Q9.d.α session-only; File objects don't serialize so
  // localStorage / IndexedDB persistence is post-v1 candidate.
  const [attachments, setAttachments] = useState<File[]>([]);
  // Index of the staged file open in the full-size preview; null = closed.
  // Index (not the File) so a remove that shifts the array closes cleanly.
  const [previewIdx, setPreviewIdx] = useState<number | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Phase 6.5 chunk 3 (Task 6): three-moment acknowledgment toast
  // lifecycle. Success → ~3s fade (Sub-Q10.b.α); error → persist-
  // until-dismissed (Sub-Q10.b.γ); ingesting → in-flight indicator.
  const [toastState, setToastState] = useState<ToastState>({ kind: 'idle' });

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

  // Phase 6.5 chunk 3 (Task 4): file-intake helpers shared by
  // drag-drop / paste / "+" button affordances. All three funnel
  // into the same staged tray state via addAttachments.
  const addAttachments = useCallback((files: File[]) => {
    if (files.length === 0) return;
    setAttachments((prev) => [...prev, ...files]);
  }, []);

  const handleRemoveAttachment = useCallback((idx: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== idx));
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setDragOver(false);
      const fileList = Array.from(e.dataTransfer.files);
      addAttachments(fileList);
    },
    [addAttachments],
  );

  const handlePaste = useCallback(
    (e: React.ClipboardEvent<HTMLInputElement>) => {
      const fileList = Array.from(e.clipboardData?.files ?? []);
      if (fileList.length === 0) return;
      e.preventDefault();
      addAttachments(fileList);
    },
    [addAttachments],
  );

  const handleAddClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const fileList = Array.from(e.target.files ?? []);
      addAttachments(fileList);
      // Reset input so selecting the same file twice in a row fires
      // a fresh change event.
      e.target.value = '';
    },
    [addAttachments],
  );

  // Phase 6.5 chunk 3 (Task 4): beforeunload prompt for staged-
  // files-on-reload. Registers when tray has entries; unregisters
  // when empty. Native browser prompt (cannot be styled per browser
  // security model).
  useEffect(() => {
    if (attachments.length === 0) return;
    function handler(e: BeforeUnloadEvent) {
      e.preventDefault();
      e.returnValue = '';
    }
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [attachments.length]);

  // Phase 6.5 chunk 3 (Task 6): success-toast auto-fade. Standard
  // ~3000ms fade per Sub-Q10.b.α; adaptive early-fade (250ms) if
  // canvas tab opened past mid-window so the toast doesn't linger
  // after the tab is already visible. Error toasts persist (no
  // auto-fade) per Sub-Q10.b.γ.
  useEffect(() => {
    if (toastState.kind !== 'success') return;
    const elapsed = Date.now() - toastState.appearedAt;
    const remaining = elapsed > 1500 ? 250 : 3000 - elapsed;
    const t = setTimeout(() => setToastState({ kind: 'idle' }), Math.max(remaining, 0));
    return () => clearTimeout(t);
  }, [toastState]);

  // Phase 6.5 chunk 3 (Task 6): explicit error-toast dismissal.
  // Triggers: close-button click; new-ingest-fire (clears prior
  // error on retry); click-outside not wired at v1 (would require
  // ref-tracking; deferred to post-v1 if friction surfaces).
  const dismissToast = useCallback(() => {
    setToastState({ kind: 'idle' });
  }, []);

  // Phase 6.5 chunk 3 (Task 5): ingest fire path. POST staged files
  // to existing /api/orgs/[orgId]/documents/ingest/drag-drop
  // endpoint per Cut 1 Flow (a) substrate inheritance; on 201 fire
  // onDropEvent Prop with pending_documents directive carrying the
  // batch id; toast lifecycle transitions per Sub-Q10 three-moment
  // composite.
  const fireIngest = useCallback(
    async (files: File[]) => {
      if (!orgId || files.length === 0) return;
      const drop_session_id = crypto.randomUUID();
      const formData = new FormData();
      formData.append('drop_session_id', drop_session_id);
      for (const file of files) formData.append('files', file);

      setToastState({
        kind: 'ingesting',
        fileCount: files.length,
        appearedAt: Date.now(),
      });

      try {
        const res = await fetch(
          `/api/orgs/${orgId}/documents/ingest/drag-drop`,
          { method: 'POST', body: formData },
        );
        if (!res.ok) {
          const errBody = (await res.json().catch(() => ({}))) as {
            error?: string;
            message?: string;
          };
          setToastState({
            kind: 'error',
            code: errBody.error ?? 'INGEST_FAILED',
            message:
              errBody.message ?? `Ingest failed (HTTP ${res.status}).`,
          });
          return;
        }
        const result = (await res.json()) as {
          ingest_batch_id: string;
          document_count: number;
        };
        setToastState({ kind: 'success', appearedAt: Date.now() });
        // Fire Zone 1 nav badge refresh.
        window.dispatchEvent(new Event(PENDING_DOCUMENTS_REFRESH_EVENT));
        // Fire onDropEvent Prop with pending_documents directive
        // (consumer = SplitScreenLayout.handleDropEvent; opens new
        // canvas tab via canvasTabRouting.routeNewTab without
        // focusExistingExactMatch per EC3.β).
        onDropEvent?.({
          type: 'pending_documents',
          orgId,
          ingestBatchId: result.ingest_batch_id,
        });
      } catch (err) {
        setToastState({
          kind: 'error',
          code: 'NETWORK_ERROR',
          message: err instanceof Error ? err.message : 'Network error',
        });
      }
    },
    [orgId, onDropEvent],
  );

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
        // OI-2 fix-stack item 1: capture browser tz per-send.
        // Stable within a session in practice; per-send keeps the
        // capture site adjacent to the fetch and avoids retaining
        // the value across renders.
        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const body: Record<string, unknown> = {
          org_id: orgId,
          message: trimmed,
          locale,
          tz,
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
        onAssistantTurnAdded?.();
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
    [orgId, locale, sessionId, submitting, canvasContext, onAssistantTurnAdded],
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

  // Phase 6.5 chunk 3 (Task 5): unified Send disabled-rule per
  // Sub-Q9.c.α. Enabled when attachments present OR text present
  // (or both); disabled when both empty. Tooltip on disabled state
  // communicates the requirement.
  const sendEnabled =
    !submitting &&
    (attachments.length > 0 || input.trim().length > 0);

  // Phase 6.5 chunk 3 (Task 5): unified Send handler. Fires ingest
  // (if attachments) AND chat message (if text), conditionally.
  // Ingest-only-path: attachments + empty text → ingest fires; no
  // chat turn appended. Send-with-attached-message-path: attachments
  // + text → both fire (ingest + chat turn). Chat-only-path: no
  // attachments + text → existing send flow unchanged.
  const handleUnifiedSend = useCallback(() => {
    if (!sendEnabled) return;
    const filesToIngest = attachments;
    const textToSend = input.trim();
    // Clear tray + input optimistically; toast / chat-turn reflect
    // status.
    setAttachments([]);
    if (filesToIngest.length > 0) {
      void fireIngest(filesToIngest);
    }
    if (textToSend.length > 0) {
      void send(textToSend);
    }
  }, [sendEnabled, attachments, input, fireIngest, send]);

  return (
    <aside
      className="w-[380px] flex flex-col border-r border-neutral-200 bg-white relative"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      data-testid="agent-chat-panel"
    >
      {/* Phase 6.5 chunk 3 (Task 4): drag-over visual indicator —
          full-panel overlay only when files are being dragged over. */}
      {dragOver && (
        <div
          className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center bg-blue-50/70 border-2 border-dashed border-blue-500"
          data-testid="agent-drag-over-indicator"
        >
          <div className="rounded-md bg-white px-4 py-2 text-sm font-medium text-blue-700 shadow">
            Drop to attach
          </div>
        </div>
      )}

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
            {firstArrival && (
              <div className="text-sm text-neutral-700 mb-3">
                Workspace ready. Ready when you are — what&apos;s first?
              </div>
            )}
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

      {/* Phase 6.5 chunk 3 (Task 6): three-moment acknowledgment
          toast — ingesting / success / error. Renders above tray
          + form so it doesn't push the message area. Success auto-
          fades; error persists until dismissed. */}
      {toastState.kind !== 'idle' && (
        <div
          className={
            toastState.kind === 'error'
              ? 'border-t border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800 flex items-center justify-between'
              : 'border-t border-neutral-200 bg-neutral-50 px-3 py-2 text-xs text-neutral-700 flex items-center justify-between'
          }
          data-testid="agent-ingest-toast"
          data-toast-state={toastState.kind}
        >
          {toastState.kind === 'ingesting' && (
            <span>
              Ingesting {toastState.fileCount} document
              {toastState.fileCount === 1 ? '' : 's'}…
            </span>
          )}
          {toastState.kind === 'success' && <span>✓ Ingested</span>}
          {toastState.kind === 'error' && (
            <span data-testid="agent-ingest-toast-error">
              <span className="font-semibold uppercase tracking-wider">
                {toastState.code}
              </span>
              {' — '}
              {toastState.message}
            </span>
          )}
          {toastState.kind === 'error' && (
            <button
              type="button"
              onClick={dismissToast}
              className="underline text-red-900 ml-2"
              aria-label="Dismiss ingest error"
              data-testid="agent-ingest-toast-dismiss"
            >
              Dismiss
            </button>
          )}
        </div>
      )}

      {/* Pre-send composer tray (build plan screen 2). Tiles replace the
          Phase 6.5 chunk 3 text rows; staging semantics unchanged — these
          files live in browser memory and reach the pipeline only at Send. */}
      {attachments.length > 0 && (
        <div
          className="border-t border-neutral-200 bg-neutral-50 px-3 py-2"
          style={{ maxHeight: 180, overflowY: 'auto' }}
          data-testid="agent-staged-tray"
        >
          <div className="flex flex-wrap gap-2">
            {attachments.map((file, idx) => (
              <StagedFileTile
                key={`${file.name}-${file.size}-${idx}`}
                file={file}
                onRemove={() => handleRemoveAttachment(idx)}
                onPreview={() => setPreviewIdx(idx)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Full-size preview of a staged (not-yet-uploaded) file. Guarded on
          the index still being in range — a remove can shrink the array
          while the overlay is open. */}
      {previewIdx !== null && attachments[previewIdx] && (
        <StagedFilePreview
          file={attachments[previewIdx]}
          onClose={() => setPreviewIdx(null)}
        />
      )}

      <form
        className="border-t border-neutral-200 p-3 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          handleUnifiedSend();
        }}
      >
        {/* Phase 6.5 chunk 3 (Task 4): "+" button affordance for file
            picker; hidden <input type="file"> triggered on click. */}
        <button
          type="button"
          onClick={handleAddClick}
          className="flex h-9 w-9 items-center justify-center rounded border border-neutral-300 text-sm text-neutral-500 hover:bg-neutral-50"
          aria-label="Attach file"
          data-testid="agent-attach-button"
        >
          {'\u{1F4CE}'}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          hidden
          onChange={handleFileInputChange}
          data-testid="agent-attach-input"
        />
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onPaste={handlePaste}
          placeholder="Type a message…"
          className="flex-1 border border-neutral-300 rounded px-3 py-2 text-sm"
          disabled={submitting}
          data-testid="agent-input"
        />
        <button
          type="submit"
          disabled={!sendEnabled}
          title={
            !sendEnabled && !submitting
              ? 'Add a message or attach a file to send'
              : undefined
          }
          className="whitespace-nowrap bg-emerald-600 text-white px-4 py-2 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          data-testid="agent-send"
        >
          {submitting
            ? '...'
            : attachments.length > 0
              ? `Send ${attachments.length} ${attachments.length === 1 ? 'file' : 'files'}`
              : 'Send'}
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
  const tRoot = useTranslations();
  const [turns, setTurns] = useState<OnboardingTurn[]>([]);
  const [input, setInput] = useState('');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resolveCompletionHref = useCallback(async (): Promise<string> => {
    // (a) Pre-computed Joining-flow href; append first_arrival
    // signal per S32 Pre-decision 5 §B. Safe to append `?...`
    // directly: the prop is constructed in welcome/page.tsx as
    // `/${locale}/${orgId}` (bare path, no existing query-param).
    // Future welcome-page revisions that add query params would
    // need URL-aware merging here.
    if (onboardingCompletionHref) return `${onboardingCompletionHref}?first_arrival=1`;
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
      // (b) Membership-query-derived Commissioning-flow href; append signal.
      if (data?.org_id) return `/${locale}/${data.org_id}?first_arrival=1`;
    } catch {
      // fall through to default
    }
    // (c) admin-orgs recovery fallback (per 2026-04-20 erratum on
    // session-5-brief.md). NOT an Arrival surface; no signal append.
    return `/${locale}/admin/orgs`;
  }, [onboardingCompletionHref, locale]);

  const send = useCallback(async () => {
    const message = input.trim();
    if (!message || submitting) return;
    setSubmitting(true);
    setError(null);
    setTurns((prev) => [...prev, { role: 'user', text: message }]);
    setInput('');

    // OI-2 fix-stack item 1: same browser-tz capture as the
    // production-mode send. Per-send keeps capture adjacent to the
    // fetch and avoids retaining across renders.
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const body: Record<string, unknown> = {
      org_id: orgId,
      message,
      locale,
      tz,
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
      let assistantText: string;
      if (typeof data.response?.template_id === 'string') {
        try {
          assistantText = tRoot(
            data.response.template_id,
            (data.response.params ?? {}) as never,
          );
        } catch {
          assistantText = data.response.template_id;
        }
      } else {
        assistantText = '(no response)';
      }
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
          <div className="text-sm text-neutral-700">
            What should I call you?
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
