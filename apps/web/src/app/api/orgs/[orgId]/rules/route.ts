// apps/web/src/app/api/orgs/[orgId]/rules/route.ts
//
// Ring 2A-core Commit 4 (ADR-0025 §9). GET — the Stage 1 canvas rule list.
// Read-path: calls the withInvariants-wrapped ruleRegistryService.listForCanvas
// (org-access check via Invariant 3 → ORG_ACCESS_DENIED), mirroring the
// journal-entries GET → journalEntryService.list pattern. The route does NOT
// touch the DB directly (adminClient is services-only); the join lives in the
// service. Query params: ?lifecycle= ?rung= ?sort= (?health= deferred to Commit 5).

import { NextResponse } from 'next/server';
import { ruleRegistryService } from '@/services/rules/ruleRegistryService';
import { buildServiceContext } from '@/services/middleware/serviceContext';
import { ServiceError } from '@/services/errors/ServiceError';
import { serviceErrorToStatus } from '@/app/api/_helpers/serviceErrorToStatus';
import { logger } from '@/shared/logger/pino';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ orgId: string }> },
) {
  let orgId: string | undefined;
  let traceId: string | undefined;
  try {
    ({ orgId } = await params);
    const url = new URL(req.url);
    const lifecycle = url.searchParams.get('lifecycle') ?? undefined;
    const rung = url.searchParams.get('rung') ?? undefined;
    const sort = url.searchParams.get('sort') ?? undefined;

    const ctx = await buildServiceContext(req);
    traceId = ctx.trace_id;

    const rules = await ruleRegistryService.listForCanvas(
      { org_id: orgId, lifecycle, rung, sort },
      ctx,
    );
    return NextResponse.json({ rules, count: rules.length });
  } catch (err) {
    if (err instanceof ServiceError) {
      const status = serviceErrorToStatus(err.code);
      if (status >= 500) {
        logger.error(
          { trace_id: traceId, org_id: orgId, err_code: err.code, err_message: err.message },
          'rules GET 500 (ServiceError)',
        );
      }
      return NextResponse.json({ error: err.code, message: err.message }, { status });
    }
    logger.error(
      { trace_id: traceId, org_id: orgId, err: { message: err instanceof Error ? err.message : String(err) } },
      'rules GET 500 (unknown)',
    );
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
