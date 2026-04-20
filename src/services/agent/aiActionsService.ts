// src/services/agent/aiActionsService.ts
//
// INV-SERVICE-001 export contract (structural): read-only service;
// list() is invoked directly from server components and integration
// tests. No mutating functions yet.
// INV-SERVICE-002 adminClient discipline (structural): every database
// access in this file goes through adminClient() from '@/db/adminClient'.
//
// Phase 1.2 Session 8 Commit 2 (OQ-S8-2): first file under
// src/services/agent/. Reads ai_actions for the AI Action Review
// queue at /[locale]/[orgId]/agent/actions.
//
// Two-query pattern for entry_number lookup matches
// journalEntryService.list's reversed_by lookup — separate queries
// + client-side merge, per Phase 1.1 retrospective §3 external-
// system runtime-shape discipline.

import { adminClient } from '@/db/adminClient';
import type { ServiceContext } from '@/services/middleware/serviceContext';
import { ServiceError } from '@/services/errors/ServiceError';

export type AiActionStatus = 'pending' | 'confirmed' | 'rejected' | 'stale' | 'edited';

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

async function list(
  input: { org_id: string; limit?: number; offset?: number },
  ctx: ServiceContext,
): Promise<AiActionListItem[]> {
  // Inline org_access check — reads do not go through withInvariants.
  if (!ctx.caller.org_ids.includes(input.org_id)) {
    throw new ServiceError(
      'ORG_ACCESS_DENIED',
      `Caller does not have access to org_id=${input.org_id}`,
    );
  }

  const db = adminClient();
  const limit = input.limit ?? 50;
  const offset = input.offset ?? 0;

  // Step 1: fetch ai_actions rows for the org.
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

  // Step 2: batch-fetch entry_number for confirmed rows only.
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

  // Step 3: merge entry_number into each row.
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

export const aiActionsService = { list };
