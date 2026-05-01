// src/services/agent/agentSessionService.ts
//
// INV-SERVICE-001 export contract (structural): wrapped reads via
// withInvariants() at the export site (Pattern A). No action key —
// authorization is shape/access invariants only (caller verified +
// org access via Invariant 3).
// INV-SERVICE-002 adminClient discipline (structural): every database
// access in this file goes through adminClient() from '@/db/adminClient'.
//
// First file under src/services/agent/ for agent_sessions reads.
// Created Q33 partial-resolution arc 2026-04-30: extracted from
// /api/agent/conversation route to clear LT-03 / UF-006 baseline.
// Reads only; the mutating side of agent_sessions (loadOrCreate,
// session.org_id stitching, turns persistence) lives behind Q33's
// agent-runtime deferral and is not extracted here.

import { adminClient } from '@/db/adminClient';
import type { ServiceContext } from '@/services/middleware/serviceContext';
import { ServiceError } from '@/services/errors/ServiceError';
import { withInvariants } from '@/services/middleware/withInvariants';

export interface AgentSessionRecord {
  session_id: string;
  user_id: string;
  org_id: string | null;
  turns: unknown[];
  conversation: unknown[];
}

async function getMostRecentForUser(
  input: { org_id: string; user_id: string; ttl_days: number },
  _ctx: ServiceContext,
): Promise<AgentSessionRecord | null> {
  const db = adminClient();
  const ttlCutoff = new Date(
    Date.now() - input.ttl_days * 24 * 60 * 60 * 1000,
  ).toISOString();

  const { data, error } = await db
    .from('agent_sessions')
    .select('session_id, user_id, org_id, turns, conversation')
    .eq('user_id', input.user_id)
    .eq('org_id', input.org_id)
    .gte('last_activity_at', ttlCutoff)
    .order('last_activity_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new ServiceError(
      'READ_FAILED',
      `agent_sessions lookup failed: ${error.message}`,
    );
  }
  if (!data) return null;

  return {
    session_id: data.session_id,
    user_id: data.user_id,
    org_id: data.org_id,
    turns: (data.turns as unknown[]) ?? [],
    conversation: (data.conversation as unknown[]) ?? [],
  };
}

export const agentSessionService = {
  getMostRecentForUser: withInvariants(getMostRecentForUser),
};
