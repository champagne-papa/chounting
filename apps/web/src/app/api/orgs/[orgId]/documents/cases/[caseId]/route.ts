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
import { documentCardReadService } from '@/services/document-platform/documentCardReadService';
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

    // Single case detail read hoisted to the service layer (ADR-0020;
    // adminClient is services-only). The service re-checks org access
    // inline and returns null for missing OR sentinel-backed cases.
    const detail = await documentCardReadService.getCardDetail(
      { org_id: orgId, case_id: caseId },
      ctx,
    );

    if (!detail) {
      // Either the case doesn't exist OR its ingest_batch is sentinel-
      // backed (the view excludes sentinel rows so the JOIN yields no
      // row for sentinel-backed cases). Either way: 404 from the
      // operator's perspective.
      return NextResponse.json(
        { error: 'NOT_FOUND', message: 'Document case not found' },
        { status: 404 },
      );
    }

    return NextResponse.json(detail);
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
