// src/services/document-platform/documentCardReadService.ts
//
// UF-006 / ADR-0020 (app→adminClient cleanup): document-card read
// bundle, hoisted from the documents/cases route handlers (app →
// services → db; Law 1). Read-only; no withInvariants per the
// read-function asymmetry (INV-SERVICE-001 leaf) — each method runs an
// inline ctx.caller.org_ids.includes(org_id) guard (assertOrgAccess)
// because adminClient bypasses RLS. Reads document_cards_view
// (migration 154); the view bakes in the sentinel filter, so callers
// inherit it. Error codes, messages, and response shapes are
// byte-identical to the pre-hoist route reads.

import { adminClient } from '@/db/adminClient';
import { ServiceError } from '@/services/errors/ServiceError';
import type { ServiceContext } from '@/services/middleware/serviceContext';

export interface CardDetail {
  case_id: string;
  state: string;
  source_document_id: string;
  original_filename: string;
  ingest_batch_id: string;
  channel_metadata: unknown;
  received_at: string;
  created_at: string;
  ingest_batch: {
    id: string;
    ingest_channel: string;
    received_at: string;
    channel_metadata: unknown;
  };
}

export interface Card {
  case_id: string;
  state: string;
  source_document_id: string;
  original_filename: string;
  ingest_batch_id: string;
  channel_metadata: unknown;
  received_at: string;
  created_at: string;
}

function assertOrgAccess(ctx: ServiceContext, orgId: string): void {
  if (!ctx.caller.org_ids.includes(orgId)) {
    throw new ServiceError(
      'ORG_ACCESS_DENIED',
      `Caller does not have access to org_id=${orgId}`,
    );
  }
}

async function getCardDetail(
  input: { org_id: string; case_id: string },
  ctx: ServiceContext,
): Promise<CardDetail | null> {
  assertOrgAccess(ctx, input.org_id);
  const db = adminClient();
  const { data, error } = await db
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .from('document_cards_view' as any)
    .select(
      'case_id, state, source_document_id, original_filename, mime_type, ingest_batch_id, ingest_channel, channel_metadata, received_at, case_created_at',
    )
    .eq('org_id', input.org_id)
    .eq('case_id', input.case_id)
    .maybeSingle();

  if (error) {
    throw new ServiceError(
      'POST_FAILED',
      `Failed to read document case: ${error.message}`,
      { underlying: error.message },
    );
  }
  if (!data) return null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const row = data as any;
  return {
    case_id: row.case_id,
    state: row.state,
    source_document_id: row.source_document_id,
    original_filename: row.original_filename,
    ingest_batch_id: row.ingest_batch_id,
    channel_metadata: row.channel_metadata,
    received_at: row.received_at,
    created_at: row.case_created_at,
    ingest_batch: {
      id: row.ingest_batch_id,
      ingest_channel: row.ingest_channel,
      received_at: row.received_at,
      channel_metadata: row.channel_metadata,
    },
  };
}

async function listCards(
  input: { org_id: string; ingest_batch_id?: string; limit: number },
  ctx: ServiceContext,
): Promise<Card[]> {
  assertOrgAccess(ctx, input.org_id);
  const db = adminClient();
  let query = db
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .from('document_cards_view' as any)
    .select(
      'case_id, state, source_document_id, original_filename, ingest_batch_id, channel_metadata, received_at, case_created_at',
    )
    .eq('org_id', input.org_id);

  if (input.ingest_batch_id !== undefined) {
    query = query.eq('ingest_batch_id', input.ingest_batch_id);
  }

  const { data, error } = await query
    .order('case_created_at', { ascending: false })
    .limit(input.limit);

  if (error) {
    throw new ServiceError(
      'POST_FAILED',
      `Failed to read document cards: ${error.message}`,
      { underlying: error.message },
    );
  }

  return (data ?? []).map(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (row: any) => ({
      case_id: row.case_id,
      state: row.state,
      source_document_id: row.source_document_id,
      original_filename: row.original_filename,
      ingest_batch_id: row.ingest_batch_id,
      channel_metadata: row.channel_metadata,
      received_at: row.received_at,
      created_at: row.case_created_at,
    }),
  );
}

async function countCards(
  input: { org_id: string },
  ctx: ServiceContext,
): Promise<number> {
  assertOrgAccess(ctx, input.org_id);
  const db = adminClient();
  const { count, error } = await db
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .from('document_cards_view' as any)
    .select('*', { count: 'exact', head: true })
    .eq('org_id', input.org_id);
  if (error) {
    throw new ServiceError(
      'POST_FAILED',
      `Failed to count document cards: ${error.message}`,
      { underlying: error.message },
    );
  }
  return count ?? 0;
}

export const documentCardReadService = {
  // withInvariants: skip-org-check (pattern-G3: read; org access enforced by an inline caller.org_ids.includes(org_id) guard (assertOrgAccess) in the getCardDetail() body)
  getCardDetail,
  // withInvariants: skip-org-check (pattern-G3: read; org access enforced by an inline caller.org_ids.includes(org_id) guard (assertOrgAccess) in the listCards() body)
  listCards,
  // withInvariants: skip-org-check (pattern-G3: read; org access enforced by an inline caller.org_ids.includes(org_id) guard (assertOrgAccess) in the countCards() body)
  countCards,
};
