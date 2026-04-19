// src/agent/orchestrator/loadOrCreateSession.ts
// Phase 1.2 Session 2 — session precedence per master §5.2
// step 1. Uses adminClient (INV-SERVICE-002). RLS enforcement
// for reads is the user-scoped SELECT policy from migration 001
// (Session 1 verified — no RLS changes in 118).

import type { Logger } from 'pino';
import { adminClient } from '@/db/adminClient';
import { ServiceError } from '@/services/errors/ServiceError';

const TTL_DAYS = 30;

export interface LoadOrCreateSessionInput {
  user_id: string;
  /** NULL for onboarding sessions (master §9.1 Issue 3 resolution). */
  org_id: string | null;
  locale: 'en' | 'fr-CA' | 'zh-Hant';
  /** If provided, load this specific session (most-specific branch). */
  session_id?: string;
}

export interface AgentSessionRow {
  session_id: string;
  user_id: string;
  org_id: string | null;
  locale: string;
  started_at: string;
  last_activity_at: string;
  state: Record<string, unknown>;
  conversation: unknown[];
}

/**
 * Precedence (master §5.2 step 1):
 *  1. session_id provided → load by PK + check TTL + match user/org
 *  2. session_id absent   → look up most recent for (user_id, org_id)
 *                           within TTL
 *  3. Otherwise           → create new row (org_id may be NULL)
 */
export async function loadOrCreateSession(
  input: LoadOrCreateSessionInput,
  log: Logger,
): Promise<AgentSessionRow> {
  const db = adminClient();
  const ttlCutoff = new Date(Date.now() - TTL_DAYS * 24 * 60 * 60 * 1000).toISOString();

  // Branch 1: session_id provided
  if (input.session_id) {
    const { data, error } = await db
      .from('agent_sessions')
      .select('*')
      .eq('session_id', input.session_id)
      .maybeSingle();

    if (error) {
      log.error({ err: error.message, session_id: input.session_id }, 'loadOrCreateSession: lookup failed');
      throw new ServiceError('AGENT_SESSION_NOT_FOUND', `Session lookup failed: ${error.message}`);
    }
    if (!data) {
      throw new ServiceError('AGENT_SESSION_NOT_FOUND', `Session ${input.session_id} not found`);
    }
    if (data.user_id !== input.user_id) {
      throw new ServiceError('AGENT_SESSION_NOT_FOUND', 'Session does not belong to caller');
    }
    if ((data.org_id ?? null) !== input.org_id) {
      throw new ServiceError('AGENT_SESSION_NOT_FOUND', 'Session org does not match request');
    }
    if (new Date(data.last_activity_at).toISOString() < ttlCutoff) {
      throw new ServiceError('AGENT_SESSION_EXPIRED', `Session older than ${TTL_DAYS} days`);
    }
    log.debug({ session_id: data.session_id }, 'loadOrCreateSession: hit by session_id');
    return toRow(data);
  }

  // Branch 2: fallback — most recent session for (user_id, org_id)
  let q = db
    .from('agent_sessions')
    .select('*')
    .eq('user_id', input.user_id)
    .gte('last_activity_at', ttlCutoff)
    .order('last_activity_at', { ascending: false })
    .limit(1);
  q = input.org_id === null ? q.is('org_id', null) : q.eq('org_id', input.org_id);

  const { data: fallback, error: fallbackError } = await q.maybeSingle();
  if (fallbackError) {
    log.error({ err: fallbackError.message }, 'loadOrCreateSession: fallback lookup failed');
  }
  if (fallback) {
    log.debug({ session_id: fallback.session_id }, 'loadOrCreateSession: hit by (user, org) fallback');
    return toRow(fallback);
  }

  // Branch 3: create new
  const { data: created, error: createError } = await db
    .from('agent_sessions')
    .insert({
      user_id: input.user_id,
      org_id: input.org_id,
      locale: input.locale,
      state: {},
      conversation: [],
    })
    .select('*')
    .single();

  if (createError || !created) {
    log.error({ err: createError?.message }, 'loadOrCreateSession: insert failed');
    throw new ServiceError(
      'AGENT_SESSION_NOT_FOUND',
      `Could not create agent session: ${createError?.message ?? 'unknown error'}`,
    );
  }
  log.debug({ session_id: created.session_id }, 'loadOrCreateSession: new session created');
  return toRow(created);
}

function toRow(raw: Record<string, unknown>): AgentSessionRow {
  return {
    session_id: raw.session_id as string,
    user_id: raw.user_id as string,
    org_id: (raw.org_id as string | null) ?? null,
    locale: raw.locale as string,
    started_at: raw.started_at as string,
    last_activity_at: raw.last_activity_at as string,
    state: (raw.state as Record<string, unknown>) ?? {},
    conversation: (raw.conversation as unknown[]) ?? [],
  };
}
