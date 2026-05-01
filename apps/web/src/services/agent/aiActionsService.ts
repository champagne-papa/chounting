// src/services/agent/aiActionsService.ts
//
// INV-SERVICE-001 export contract (structural): all exports are wrapped
// at the export site via withInvariants() (Pattern A). Mutations carry
// no action key by current policy — see Q34 in
// docs/02_specs/open_questions.md (filed 2026-04-30 alongside this
// service's expansion). Authorization gate is upstream:
// `journal_entry.post` for confirm-Branch-4, and the route handler's
// buildServiceContext for everything else. Q34 may add action keys
// once Q33's agent-runtime half resolves and the role-grant matrix
// for ai_actions lifecycle is decided.
// INV-SERVICE-002 adminClient discipline (structural): every database
// access in this file goes through adminClient() from '@/db/adminClient'.
//
// History:
//   - Phase 1.2 Session 8 Commit 2 (OQ-S8-2): originally introduced
//     read-only with list() for the AI Action Review queue.
//   - Q33 partial-resolution arc 2026-04-30: extended with
//     getByIdempotencyKey, listByIdempotencyKeys, markConfirmed,
//     markResolved to clear the LT-03 / UF-006 baseline for the 4
//     route handlers (mfa-status, agent/confirm, agent/conversation,
//     agent/reject). The 3 agent-runtime sites remain deferred.
//
// File-top comment update (per CLAUDE.md §3 file-top staleness review):
// previous header described "read-only service; no mutating functions
// yet". That claim is now stale — the lifecycle mutations land here.

import { adminClient } from '@/db/adminClient';
import type { ServiceContext } from '@/services/middleware/serviceContext';
import { ServiceError } from '@/services/errors/ServiceError';
import { withInvariants } from '@/services/middleware/withInvariants';

export type AiActionStatus =
  | 'pending'
  | 'confirmed'
  | 'rejected'
  | 'stale'
  | 'edited'
  | 'auto_posted';

export interface AiActionListItem {
  ai_action_id: string;
  idempotency_key: string;
  status: AiActionStatus;
  tool_name: string;
  journal_entry_id: string | null;
  entry_number: number | null;
  created_at: string;
  confirmed_at: string | null;
  confirming_user_id: string | null;
  resolution_reason: string | null;
}

export interface AiActionRecord {
  ai_action_id: string;
  idempotency_key: string;
  org_id: string;
  status: AiActionStatus;
  tool_input: Record<string, unknown> | null;
  journal_entry_id: string | null;
  resolution_reason: string | null;
}

async function list(
  input: { org_id: string; limit?: number; offset?: number },
  _ctx: ServiceContext,
): Promise<AiActionListItem[]> {
  const db = adminClient();
  const limit = input.limit ?? 50;
  const offset = input.offset ?? 0;

  const { data: rows, error: rowsError } = await db
    .from('ai_actions')
    .select(
      'ai_action_id, idempotency_key, status, tool_name, journal_entry_id, created_at, confirmed_at, confirming_user_id, resolution_reason',
    )
    .eq('org_id', input.org_id)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);
  if (rowsError) throw new ServiceError('READ_FAILED', rowsError.message);
  if (!rows || rows.length === 0) return [];

  const entryIds = rows
    .map((r) => r.journal_entry_id)
    .filter((id): id is string => typeof id === 'string' && id.length > 0);

  const entryNumberById = new Map<string, number>();
  if (entryIds.length > 0) {
    const { data: entries, error: entriesError } = await db
      .from('journal_entries')
      .select('journal_entry_id, entry_number')
      .in('journal_entry_id', entryIds);
    if (entriesError) throw new ServiceError('READ_FAILED', entriesError.message);
    for (const e of entries ?? []) {
      entryNumberById.set(e.journal_entry_id as string, e.entry_number as number);
    }
  }

  return rows.map((r) => ({
    ai_action_id: r.ai_action_id as string,
    idempotency_key: r.idempotency_key as string,
    status: r.status as AiActionStatus,
    tool_name: r.tool_name as string,
    journal_entry_id: (r.journal_entry_id as string | null) ?? null,
    entry_number:
      r.journal_entry_id ? (entryNumberById.get(r.journal_entry_id as string) ?? null) : null,
    created_at: r.created_at as string,
    confirmed_at: (r.confirmed_at as string | null) ?? null,
    confirming_user_id: (r.confirming_user_id as string | null) ?? null,
    resolution_reason: (r.resolution_reason as string | null) ?? null,
  }));
}

async function getByIdempotencyKey(
  input: { org_id: string; idempotency_key: string },
  _ctx: ServiceContext,
): Promise<AiActionRecord | null> {
  const db = adminClient();
  const { data, error } = await db
    .from('ai_actions')
    .select(
      'ai_action_id, idempotency_key, org_id, status, tool_input, journal_entry_id, resolution_reason',
    )
    .eq('org_id', input.org_id)
    .eq('idempotency_key', input.idempotency_key)
    .maybeSingle();

  if (error) {
    throw new ServiceError(
      'READ_FAILED',
      `ai_actions lookup failed: ${error.message}`,
    );
  }
  if (!data) return null;

  return {
    ai_action_id: data.ai_action_id as string,
    idempotency_key: data.idempotency_key as string,
    org_id: data.org_id as string,
    status: data.status as AiActionStatus,
    tool_input: (data.tool_input as Record<string, unknown> | null) ?? null,
    journal_entry_id: (data.journal_entry_id as string | null) ?? null,
    resolution_reason: (data.resolution_reason as string | null) ?? null,
  };
}

async function listByIdempotencyKeys(
  input: { org_id: string; idempotency_keys: string[] },
  _ctx: ServiceContext,
): Promise<AiActionRecord[]> {
  if (input.idempotency_keys.length === 0) return [];
  const db = adminClient();
  const { data, error } = await db
    .from('ai_actions')
    .select(
      'ai_action_id, idempotency_key, org_id, status, tool_input, journal_entry_id, resolution_reason',
    )
    .eq('org_id', input.org_id)
    .in('idempotency_key', input.idempotency_keys);

  if (error) {
    throw new ServiceError(
      'READ_FAILED',
      `ai_actions batch lookup failed: ${error.message}`,
    );
  }
  return (data ?? []).map((row) => ({
    ai_action_id: row.ai_action_id as string,
    idempotency_key: row.idempotency_key as string,
    org_id: row.org_id as string,
    status: row.status as AiActionStatus,
    tool_input: (row.tool_input as Record<string, unknown> | null) ?? null,
    journal_entry_id: (row.journal_entry_id as string | null) ?? null,
    resolution_reason: (row.resolution_reason as string | null) ?? null,
  }));
}

async function markConfirmed(
  input: {
    org_id: string;
    ai_action_id: string;
    journal_entry_id: string;
    confirming_user_id: string;
  },
  _ctx: ServiceContext,
): Promise<void> {
  const db = adminClient();
  const { error } = await db
    .from('ai_actions')
    .update({
      status: 'confirmed',
      confirmed_at: new Date().toISOString(),
      confirming_user_id: input.confirming_user_id,
      journal_entry_id: input.journal_entry_id,
    })
    .eq('ai_action_id', input.ai_action_id)
    .eq('org_id', input.org_id);

  if (error) {
    throw new ServiceError(
      'POST_FAILED',
      `ai_actions update failed after post: ${error.message}`,
    );
  }
}

async function markResolved(
  input: {
    org_id: string;
    ai_action_id: string;
    outcome: 'rejected' | 'edited';
    reason?: string;
  },
  _ctx: ServiceContext,
): Promise<void> {
  const db = adminClient();
  const { error } = await db
    .from('ai_actions')
    .update({
      status: input.outcome,
      resolution_reason: input.reason ?? null,
    })
    .eq('ai_action_id', input.ai_action_id)
    .eq('org_id', input.org_id);

  if (error) {
    throw new ServiceError(
      'POST_FAILED',
      `ai_actions update failed: ${error.message}`,
    );
  }
}

export const aiActionsService = {
  list: withInvariants(list),
  getByIdempotencyKey: withInvariants(getByIdempotencyKey),
  listByIdempotencyKeys: withInvariants(listByIdempotencyKeys),
  markConfirmed: withInvariants(markConfirmed),
  markResolved: withInvariants(markResolved),
};
