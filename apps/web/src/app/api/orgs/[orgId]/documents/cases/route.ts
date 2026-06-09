// src/app/api/orgs/[orgId]/documents/cases/route.ts
//
// GET /api/orgs/[orgId]/documents/cases[?ingest_batch_id=X][&limit=N][&count_only=true]
//
// List document cards. Modes per Sub-Q10 Option B (chunk 6.3a) + chunk
// 6.5 chunk 3 count_only extension:
//   - With ingest_batch_id: filter to that batch (chunk-6.2b drag-drop
//     call shape; backward-compatible).
//   - Without ingest_batch_id: return recent N cards across all batches
//     for the org (chunk 6.5 chunk 3 PendingDocumentsView mount-fetch
//     shape — formerly DocumentIntakeRail mount-fetch pre-Phase-6.5;
//     v1-default-pending-operator-feedback limit=50).
//   - With count_only=true: head-only count of cards for the org
//     (chunk 6.5 chunk 3 Zone 1 "Pending Documents" nav-item badge).
//
// Sub-Q1 server-only constraint at chunk 6.3a applies per-affordance /
// per-discovery-mechanism / per-existing-UI-consumer: cards endpoint
// extension (this file) and the post-Phase-6.5 PendingDocumentsView
// mount-fetch are minimum-scope discovery-mechanism extensions; new
// affordances (visual differentiation, per-channel icons, etc.) remain
// out of scope per Phase 7+ forward-pointer.
//
// No withInvariants per Rule 2 (validation at both ends) + the
// 50-route read-side convention (mirror pendingApprovals, openBills,
// activePayments, etc.). Org-access check is explicit (verify
// ctx.caller.org_ids.includes(orgId) before any SQL).
//
// Sub-Q2.2 symmetric filter discipline: the sentinel filter
// (channel_metadata @> '{"sentinel": true}'::jsonb) is baked into
// document_cards_view (migration 154). Both batch-scoped and recent-N
// paths inherit the filter via the view; no WHERE-clause repetition.

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { buildServiceContext } from '@/services/middleware/serviceContext';
import { documentCardReadService } from '@/services/document-platform/documentCardReadService';
import { ServiceError } from '@/services/errors/ServiceError';
import { serviceErrorToStatus } from '@/app/api/_helpers/serviceErrorToStatus';

const QuerySchema = z.object({
  ingest_batch_id: z.string().uuid().optional(),
  limit: z.number().int().positive().max(500).default(50),
  // Phase 6.5 chunk 3: count_only mode for Zone 1 "Pending Documents"
  // nav-item badge. Returns { count: N } instead of { cards: [...] }.
  // Bypasses card-shape mapping for fewer bytes on the wire; the view's
  // sentinel filter applies as on the cards-list path.
  count_only: z.boolean().optional().default(false),
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

    // Validate query params via Zod. ingest_batch_id is optional at
    // chunk 6.3a per Sub-Q10 Option B; limit defaults to 50 (v1-anchor-
    // pending-operator-feedback per friction-journal codification);
    // count_only is chunk 6.5 chunk 3 addition for Zone 1 nav badge.
    const url = new URL(req.url);
    const limitRaw = url.searchParams.get('limit');
    const countOnlyRaw = url.searchParams.get('count_only');
    const parsed = QuerySchema.parse({
      ingest_batch_id: url.searchParams.get('ingest_batch_id') ?? undefined,
      limit: limitRaw === null ? undefined : Number(limitRaw),
      count_only: countOnlyRaw === 'true' ? true : undefined,
    });

    // count_only short-circuit: head-only request returns row count
    // for the org (sentinel filter inherits from document_cards_view).
    if (parsed.count_only) {
      const count = await documentCardReadService.countCards(
        { org_id: orgId },
        ctx,
      );
      return NextResponse.json({ count });
    }

    // Card list read hoisted to the service layer (ADR-0020; adminClient
    // is services-only). The view has the sentinel filter baked in; the
    // service re-checks org access inline and shapes the rows.
    const cards = await documentCardReadService.listCards(
      {
        org_id: orgId,
        ingest_batch_id: parsed.ingest_batch_id,
        limit: parsed.limit,
      },
      ctx,
    );

    // Response shape: chunk-6.2b drag-drop callers expect
    // `ingest_batch_id` field on the envelope; chunk-6.3a recent-N
    // callers expect just `cards`. Emit `ingest_batch_id` only when
    // it was a query filter (preserves backward-compat).
    return NextResponse.json(
      parsed.ingest_batch_id !== undefined
        ? { ingest_batch_id: parsed.ingest_batch_id, cards }
        : { cards },
    );
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
