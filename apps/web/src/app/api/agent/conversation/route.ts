// src/app/api/agent/conversation/route.ts
// Phase 1.2 Session 7 Commit 3 — GET /api/agent/conversation
// per sub-brief §4 Commit 3 "Conversation-load endpoint" and
// Pre-decision 14.
//
// Contract:
//   Query param: org_id (uuid, required)
//   Returns:     { turns: ChatTurn[], session_id: string | null }
//
// Flow:
//   1. Resolve most-recent agent_sessions row for (user_id,
//      org_id) within 30-day TTL.
//   2. If stored `turns` is populated (post-migration-121
//      sessions): hydrate card_resolution server-side from
//      ai_actions (+ journal_entries.entry_number when approved)
//      and return.
//   3. If `turns` is empty but `conversation` has content
//      (pre-migration-121 sessions): log a warning and fall
//      through to the Option B reconstruction path — regex-parse
//      the terminating assistant text for template_id; derive
//      user turns from user-role messages.
//   4. No session at all: return empty turns + null session_id.
//
// RLS enforcement: adminClient is used for the join semantics
// (cross-table ai_actions lookup keyed by idempotency_key), but
// every query is constrained by the request's user_id + org_id,
// and buildServiceContext verifies the caller's JWT before we
// enter this path. The org_id the client sends is matched
// against session.org_id; mismatched requests get no session
// back.

import { NextResponse } from 'next/server';
import { z } from 'zod';
import type { Logger } from 'pino';
import { adminClient } from '@/db/adminClient';
import { buildServiceContext } from '@/services/middleware/serviceContext';
import { ServiceError } from '@/services/errors/ServiceError';
import { serviceErrorToStatus } from '@/app/api/_helpers/serviceErrorToStatus';
import { loggerWith } from '@/shared/logger/pino';
import type {
  CardResolution,
  ChatTurn,
  ChatTurnAssistant,
  ChatTurnUserSent,
  PersistedAssistantTurn,
  PersistedTurn,
  PersistedUserTurn,
} from '@/shared/types/chatTurn';
import type { ProposedEntryCard } from '@/shared/types/proposedEntryCard';

const TTL_DAYS = 30;
const TERMINATING_TEXT_RE = /^\[responded with template_id=([^\]]+)\]$/;

const querySchema = z.object({ org_id: z.string().uuid() });

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const query = querySchema.parse({
      org_id: url.searchParams.get('org_id') ?? undefined,
    });

    const ctx = await buildServiceContext(req);
    const log = loggerWith({
      trace_id: ctx.trace_id,
      org_id: query.org_id,
      user_id: ctx.caller.user_id,
    });

    const db = adminClient();
    const ttlCutoff = new Date(
      Date.now() - TTL_DAYS * 24 * 60 * 60 * 1000,
    ).toISOString();

    const { data: session, error: sessionErr } = await db
      .from('agent_sessions')
      .select('session_id, user_id, org_id, turns, conversation')
      .eq('user_id', ctx.caller.user_id)
      .eq('org_id', query.org_id)
      .gte('last_activity_at', ttlCutoff)
      .order('last_activity_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (sessionErr) {
      throw new ServiceError(
        'READ_FAILED',
        `agent_sessions lookup failed: ${sessionErr.message}`,
      );
    }

    if (!session) {
      return NextResponse.json({ turns: [], session_id: null });
    }

    const storedTurns = (session.turns as unknown[]) ?? [];
    const storedConversation = (session.conversation as unknown[]) ?? [];

    // Branch A: post-migration-121 session with structured turns.
    if (storedTurns.length > 0) {
      const hydrated = await hydrateTurns(
        storedTurns as PersistedTurn[],
        query.org_id,
        db,
        log,
      );
      return NextResponse.json({
        turns: hydrated,
        session_id: session.session_id,
      });
    }

    // Branch B: pre-migration-121 session — reconstruct.
    if (storedConversation.length > 0) {
      log.warn(
        { session_id: session.session_id },
        'conversation-load: pre-migration-121 session, falling back to reconstruction',
      );
      const reconstructed = reconstructFromAnthropicMessages(storedConversation);
      return NextResponse.json({
        turns: reconstructed,
        session_id: session.session_id,
      });
    }

    // Branch C: session exists but has no content yet (fresh).
    return NextResponse.json({ turns: [], session_id: session.session_id });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request', details: err.issues },
        { status: 400 },
      );
    }
    if (err instanceof ServiceError) {
      return NextResponse.json(
        { error: err.code, message: err.message },
        { status: serviceErrorToStatus(err.code) },
      );
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// -----------------------------------------------------------------
// Hydration — post-migration-121 path
// -----------------------------------------------------------------

async function hydrateTurns(
  persisted: PersistedTurn[],
  orgId: string,
  db: ReturnType<typeof adminClient>,
  log: Logger,
): Promise<ChatTurn[]> {
  // Collect idempotency_keys from assistant turns that carry a
  // card so the ai_actions join fires as one query.
  const idempotencyKeys = persisted
    .filter(
      (t): t is PersistedAssistantTurn =>
        t.role === 'assistant' && t.card !== undefined,
    )
    .map((t) => (t.card as ProposedEntryCard).idempotency_key);

  // Map idempotency_key -> CardResolution (if the card has been
  // acted on). Pending cards have no entry; client renders
  // buttons normally.
  const resolutionMap = new Map<string, CardResolution>();
  if (idempotencyKeys.length > 0) {
    const { data: aiActions, error: aiErr } = await db
      .from('ai_actions')
      .select(
        'idempotency_key, status, journal_entry_id, resolution_reason',
      )
      .eq('org_id', orgId)
      .in('idempotency_key', idempotencyKeys);
    if (aiErr) {
      log.warn(
        { err: aiErr.message },
        'conversation-load: ai_actions join failed, cards will render without card_resolution',
      );
    } else {
      // Collect journal_entry_ids for approved rows so entry_number
      // can land on CardResolution via a single secondary SELECT.
      const approvedJournalIds = (aiActions ?? [])
        .filter((r) => r.status === 'confirmed' && r.journal_entry_id)
        .map((r) => r.journal_entry_id as string);
      const entryNumberByJournalId = new Map<string, number>();
      if (approvedJournalIds.length > 0) {
        const { data: entries, error: jeErr } = await db
          .from('journal_entries')
          .select('journal_entry_id, entry_number')
          .in('journal_entry_id', approvedJournalIds);
        if (jeErr) {
          log.warn(
            { err: jeErr.message },
            'conversation-load: journal_entries enrichment failed; approved cards will render without entry_number',
          );
        } else {
          for (const je of entries ?? []) {
            entryNumberByJournalId.set(
              je.journal_entry_id,
              je.entry_number as number,
            );
          }
        }
      }

      for (const row of aiActions ?? []) {
        const resolution = deriveResolution(row, entryNumberByJournalId);
        if (resolution !== undefined) {
          resolutionMap.set(row.idempotency_key as string, resolution);
        }
      }
    }
  }

  return persisted.map((t): ChatTurn => {
    if (t.role === 'user') {
      const userTurn: ChatTurnUserSent = t;
      return userTurn;
    }
    const assistant = t as PersistedAssistantTurn;
    const resolution = assistant.card
      ? resolutionMap.get(assistant.card.idempotency_key)
      : undefined;
    const hydrated: ChatTurnAssistant = {
      ...assistant,
      ...(resolution !== undefined && { card_resolution: resolution }),
    };
    return hydrated;
  });
}

function deriveResolution(
  row: {
    status: string | null;
    journal_entry_id: string | null;
    resolution_reason: string | null;
  },
  entryNumberByJournalId: Map<string, number>,
): CardResolution | undefined {
  switch (row.status) {
    case 'confirmed':
    case 'auto_posted': {
      if (!row.journal_entry_id) return undefined;
      const entryNumber = entryNumberByJournalId.get(row.journal_entry_id);
      if (entryNumber === undefined) return undefined;
      return {
        status: 'approved',
        journal_entry_id: row.journal_entry_id,
        entry_number: entryNumber,
      };
    }
    case 'rejected':
      return {
        status: 'rejected',
        ...(row.resolution_reason && { reason: row.resolution_reason }),
      };
    case 'edited':
      return { status: 'edited' };
    case 'stale':
      return { status: 'stale' };
    case 'pending':
    default:
      return undefined;
  }
}

// -----------------------------------------------------------------
// Option B reconstruction - pre-migration-121 path
// -----------------------------------------------------------------

function reconstructFromAnthropicMessages(
  conversation: unknown[],
): ChatTurn[] {
  const out: ChatTurn[] = [];
  for (const raw of conversation) {
    if (!raw || typeof raw !== 'object') continue;
    const msg = raw as { role?: unknown; content?: unknown };
    if (msg.role === 'user' && typeof msg.content === 'string') {
      const userTurn: PersistedUserTurn = {
        role: 'user',
        id: crypto.randomUUID(),
        text: msg.content,
        timestamp: new Date(0).toISOString(),
        status: 'sent',
      };
      out.push(userTurn);
      continue;
    }
    if (msg.role === 'assistant' && Array.isArray(msg.content)) {
      for (const block of msg.content as Array<Record<string, unknown>>) {
        if (block.type !== 'text' || typeof block.text !== 'string') continue;
        const match = TERMINATING_TEXT_RE.exec(block.text);
        if (!match) continue;
        const assistantTurn: ChatTurnAssistant = {
          role: 'assistant',
          id: crypto.randomUUID(),
          template_id: match[1],
          params: {},
          timestamp: new Date(0).toISOString(),
          trace_id: '00000000-0000-0000-0000-000000000000',
        };
        out.push(assistantTurn);
      }
    }
  }
  return out;
}
