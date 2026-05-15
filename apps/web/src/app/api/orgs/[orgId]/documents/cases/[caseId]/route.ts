// src/app/api/orgs/[orgId]/documents/cases/[caseId]/route.ts
//
// GET /api/orgs/[orgId]/documents/cases/[caseId]
//
// Single case detail with full source_document + ingest_batch context.
// Same view as the cards-list endpoint (document_cards_view, migration
// 154); filter by case_id + org_id; sentinel filter inherited from
// the view definition.
//
// Sentinel-backed cases return 404 (the view excludes them by
// definition; .maybeSingle() returns null; the route returns
// NOT_FOUND). This is consistent with the cards-list filter shape.
//
// No withInvariants per Rule 2 + 50-route read-side convention.
// Explicit org-access check (ctx.caller.org_ids.includes(orgId))
// before SQL.

import { NextResponse } from 'next/server';
import { buildServiceContext } from '@/services/middleware/serviceContext';
import { adminClient } from '@/db/adminClient';
import { ServiceError } from '@/services/errors/ServiceError';
import { serviceErrorToStatus } from '@/app/api/_helpers/serviceErrorToStatus';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ orgId: string; caseId: string }> },
) {
  try {
    const { orgId, caseId } = await params;
    const ctx = await buildServiceContext(req);

    if (!ctx.caller.org_ids.includes(orgId)) {
      throw new ServiceError(
        'ORG_ACCESS_DENIED',
        `Caller does not have access to org_id=${orgId}`,
      );
    }

    const db = adminClient();
    const { data, error } = await db
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .from('document_cards_view' as any)
      .select(
        'case_id, state, source_document_id, original_filename, mime_type, ingest_batch_id, ingest_channel, channel_metadata, received_at, case_created_at',
      )
      .eq('org_id', orgId)
      .eq('case_id', caseId)
      .maybeSingle();

    if (error) {
      throw new ServiceError(
        'POST_FAILED',
        `Failed to read document case: ${error.message}`,
        { underlying: error.message },
      );
    }

    if (!data) {
      // Either the case doesn't exist OR its ingest_batch is sentinel-
      // backed (the view excludes sentinel rows so the JOIN yields no
      // row for sentinel-backed cases). Either way: 404 from the
      // operator's perspective.
      return NextResponse.json(
        { error: 'NOT_FOUND', message: 'Document case not found' },
        { status: 404 },
      );
    }

    // Shape the view row to CardDetailResult per the Zod schema.
    // CardDetailResultSchema extends DocumentCardSchema with an
    // `ingest_batch` nested object holding the full batch context
    // (id, ingest_channel, received_at, channel_metadata).
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const row = data as any;
    return NextResponse.json({
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
    });
  } catch (err) {
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
