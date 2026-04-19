// src/agent/orchestrator/index.ts
// Phase 1.2 Session 2 — the Double Entry Agent orchestrator.
// Master brief §5.1 signatures, §5.2 main loop.
//
// Commit 2 (this commit): file exists with the full signature +
// type contracts so downstream commits can import it. The main
// loop body lands in commit 3 together with loadOrCreateSession,
// toolsForPersona, and trace_id propagation wiring.

import type { ServiceContext } from '@/services/middleware/serviceContext';
import type { CanvasContext } from '@/shared/types/canvasContext';
import type { CanvasDirective } from '@/shared/types/canvasDirective';
import type { ProposedEntryCard } from '@/shared/types/proposedEntryCard';
import { loggerWith } from '@/shared/logger/pino';

export interface HandleUserMessageInput {
  user_id: string;
  /** NULL during onboarding before the user has created or joined an org (master §9.1). */
  org_id: string | null;
  locale: 'en' | 'fr-CA' | 'zh-Hant';
  message: string;
  session_id?: string;
  canvas_context?: CanvasContext;
}

export interface StructuredResponse {
  template_id: string;
  params: Record<string, unknown>;
}

export interface AgentResponse {
  session_id: string;
  response: StructuredResponse;
  canvas_directive?: CanvasDirective;
  proposed_entry_card?: ProposedEntryCard;
  trace_id: string;
}

export async function handleUserMessage(
  input: HandleUserMessageInput,
  ctx: ServiceContext,
): Promise<AgentResponse> {
  const log = loggerWith({
    trace_id: ctx.trace_id,
    org_id: input.org_id ?? undefined,
    user_id: input.user_id,
  });

  log.debug({ locale: input.locale, has_session: !!input.session_id }, 'handleUserMessage: entry (stub)');

  // Commit 3 replaces this stub with the full 10-step main loop
  // from master §5.2.
  throw new Error(
    'handleUserMessage: orchestrator main loop not yet wired. ' +
    'Commit 3 of Phase 1.2 Session 2 lands the full implementation.',
  );
}
