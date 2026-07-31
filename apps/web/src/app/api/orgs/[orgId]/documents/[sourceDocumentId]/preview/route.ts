// src/app/api/orgs/[orgId]/documents/[sourceDocumentId]/preview/route.ts
//
// GET /api/orgs/[orgId]/documents/[sourceDocumentId]/preview
//
// The document-bytes read site: mints a short-lived, pre-authenticated
// provider URL and 302-redirects the browser to it. This is the endpoint
// every review screen depends on to render the real document — see
// docs/09_briefs/post-mvp/2026-07-31-ap-ingest-ui-build-plan.md §4.
//
// WHY A REDIRECT, NOT A PROXY (build-plan §4 decision, v1):
// Both providers already return URLs the browser can fetch directly
// (SharePoint: Graph @microsoft.graph.downloadUrl; Supabase: signed URL),
// so no Graph token or app-only credential ever reaches the frontend and
// no bytes flow through this server. The trade accepted: a copied URL
// works until it expires (provider-clamped to <=30 min reported; Graph's
// own validity is ~1h). Not a one-way door — if per-view audit or
// leak-resistance is later required, the handler body becomes a proxy
// with this route's signature unchanged.
//
// PROVIDER DISPATCH — the forward-marker in
// agent/orchestrator/extraction/stages/byteFetch.ts:31-38 addresses this
// consumer by name: "EVERY storage read site must dispatch
// getStorageProvider on the ROW's storage_provider — never a constant or
// the org default … previewUrl/… have zero callers, so when their
// consumers land each inherits THIS rule … do NOT use
// resolveStorageProvider here — that is ingest-only." Honoured: the
// provider comes from the row, because a document must be read from the
// provider it was WRITTEN under (an org whose default later changes must
// still serve its older documents).
//
// AUTHORIZATION — two checks, not one. The read-side convention
// (documents/cases/[caseId]/route.ts:14,32) is an explicit
// ctx.caller.org_ids.includes(orgId) guard with no withInvariants. That
// alone is NOT sufficient here: it proves the CALLER belongs to the org
// named in the URL, not that the DOCUMENT does. The second check lives in
// getStorageProviderForOrgSourceDocument, which filters by (id, org_id)
// so a cross-org document id misses identically to a nonexistent one —
// NOT_FOUND, never 403, no existence leak.
//
// No withInvariants per Rule 2 + the 50-route read-side convention.
// URL-minting is not audited per ADR-0013 §16
// (storageProviderService.ts:50).

import { buildServiceContext } from '@/services/middleware/serviceContext';
import { ServiceError } from '@/services/errors/ServiceError';
import { serviceErrorToStatus } from '@/app/api/_helpers/serviceErrorToStatus';
import { getStorageProviderForOrgSourceDocument } from '@/services/document-platform/extractionReadService';
import { getStorageProvider } from '@/services/storage/resolver';
import { loggerWith } from '@/shared/logger/pino';

// Short window: the browser follows the redirect immediately, so the URL
// need only outlive the round trip. The provider clamps this (<=30 min).
const PREVIEW_TTL_SECONDS = 300;

export async function GET(
  req: Request,
  { params }: { params: Promise<{ orgId: string; sourceDocumentId: string }> },
) {
  try {
    const { orgId, sourceDocumentId } = await params;
    const ctx = await buildServiceContext(req);
    const log = loggerWith({ trace_id: ctx.trace_id });

    // Check 1 — caller belongs to the org they named.
    if (!ctx.caller.org_ids.includes(orgId)) {
      throw new ServiceError(
        'ORG_ACCESS_DENIED',
        `Caller does not have access to org_id=${orgId}`,
      );
    }

    // Check 2 — the document belongs to THAT org (org-filtered read;
    // cross-org id → NOT_FOUND, no existence leak). Also yields the row's
    // provider for dispatch.
    const provider = await getStorageProviderForOrgSourceDocument(
      orgId,
      sourceDocumentId,
    );

    const { url, expires_at } = await getStorageProvider(provider).previewUrl(
      sourceDocumentId,
      { ttl_seconds: PREVIEW_TTL_SECONDS, mode: 'preview' },
      ctx,
    );

    log.info(
      { org_id: orgId, source_document_id: sourceDocumentId, provider, expires_at },
      'documentPreview: minted preview URL',
    );

    // 302 (not 307): a redirect for a GET, and caches must not store the
    // short-lived signed URL.
    return new Response(null, {
      status: 302,
      headers: { Location: url, 'Cache-Control': 'no-store' },
    });
  } catch (err) {
    if (err instanceof ServiceError) {
      return Response.json(
        { error: { code: err.code, message: err.message } },
        { status: serviceErrorToStatus(err.code) },
      );
    }
    // Non-ServiceError: do not leak provider/internal detail to the client.
    return Response.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Preview failed' } },
      { status: 500 },
    );
  }
}
