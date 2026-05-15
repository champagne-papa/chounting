// src/app/api/orgs/[orgId]/documents/cases/route.ts
//
// GET /api/orgs/[orgId]/documents/cases?ingest_batch_id=X
//
// List document cards by ingest_batch_id. v1 chunk 6.2b scope: cards
// endpoint filtered to a single batch per Sub-Q2.1 + Flag 4 lock.
// Global all-cards listing is Phase 7 forward-pointer territory per
// Phase 5 retro §6:416-424 lifecycle-state-agnostic per-entity
// endpoint framing.
//
// No withInvariants per Rule 2 (validation at both ends) + the
// 50-route read-side convention (mirror pendingApprovals, openBills,
// activePayments, etc.). Org-access check is explicit (verify
// ctx.caller.org_ids.includes(orgId) before any SQL).
//
// Sub-Q2.2 symmetric filter discipline: the sentinel filter
// (channel_metadata @> '{"sentinel": true}'::jsonb) is baked into
// document_cards_view (migration 154). Both this endpoint and the
// case-detail endpoint query the view, inheriting the same filter.
// This route does NOT need to repeat the filter at the WHERE clause.

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { buildServiceContext } from '@/services/middleware/serviceContext';
import { adminClient } from '@/db/adminClient';
import { ServiceError } from '@/services/errors/ServiceError';
import { serviceErrorToStatus } from '@/app/api/_helpers/serviceErrorToStatus';

const QuerySchema = z.object({
  ingest_batch_id: z.string().uuid(),
});

export async function GET(
  req: Request,
  { params }: { params: Promise<{ orgId: string }> },
) {
  try {
    const { orgId } = await params;
    const ctx = await buildServiceContext(req);

    // Explicit org-access check (read endpoint without withInvariants
    // Invariant 3). Returns 403 if caller is not a member of the org.
    if (!ctx.caller.org_ids.includes(orgId)) {
      throw new ServiceError(
        'ORG_ACCESS_DENIED',
        `Caller does not have access to org_id=${orgId}`,
      );
    }

    // Validate query params via Zod. ingest_batch_id is required at
    // v1 chunk 6.2b scope (Flag 4 lock).
    const url = new URL(req.url);
    const parsed = QuerySchema.parse({
      ingest_batch_id: url.searchParams.get('ingest_batch_id') ?? undefined,
    });

    // Query the document_cards_view (migration 154). The view has
    // the sentinel filter baked in; we filter by org_id + batch_id
    // here. adminClient bypasses RLS but the explicit WHERE clause
    // provides org isolation; the explicit ctx.caller.org_ids check
    // above provides the access-control gate.
    const db = adminClient();
    const { data, error } = await db
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .from('document_cards_view' as any)
      .select(
        'case_id, state, source_document_id, original_filename, ingest_batch_id, channel_metadata, received_at, case_created_at',
      )
      .eq('org_id', orgId)
      .eq('ingest_batch_id', parsed.ingest_batch_id)
      .order('case_created_at', { ascending: false });

    if (error) {
      throw new ServiceError(
        'POST_FAILED',
        `Failed to read document cards: ${error.message}`,
        { underlying: error.message },
      );
    }

    // Shape view rows to CardListResult per the Zod schema. The view
    // emits case_created_at; the wire shape uses created_at.
    const cards = (data ?? []).map(
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

    return NextResponse.json({
      ingest_batch_id: parsed.ingest_batch_id,
      cards,
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request', details: err.issues },
        { status: 400 },
      );
    }
    if (err instanceof ServiceError) {
      return NextResponse.json(
        { error: err.code, message: err.message, details: err.details },
        { status: serviceErrorToStatus(err.code) },
      );
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
