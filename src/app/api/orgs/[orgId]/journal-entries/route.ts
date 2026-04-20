import { NextResponse } from 'next/server';
import { z } from 'zod';
import {
  PostJournalEntryInputSchema,
  ReversalInputSchema,
} from '@/shared/schemas/accounting/journalEntry.schema';
import { withInvariants } from '@/services/middleware/withInvariants';
import { journalEntryService } from '@/services/accounting/journalEntryService';
import { buildServiceContext } from '@/services/middleware/serviceContext';
import { ServiceError } from '@/services/errors/ServiceError';
import { serviceErrorToStatus } from '@/app/api/_helpers/serviceErrorToStatus';
import { logger } from '@/shared/logger/pino';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ orgId: string }> }
) {
  try {
    const { orgId } = await params;
    const json = await req.json();

    // Discriminate on body shape, then parse with the correct schema.
    // This produces meaningful Zod errors (from the intended schema)
    // rather than confusing union-mismatch errors.
    const isReversal =
      json && typeof json === 'object' &&
      'reverses_journal_entry_id' in json &&
      json.reverses_journal_entry_id;

    const parsed = isReversal
      ? ReversalInputSchema.parse(json)
      : PostJournalEntryInputSchema.parse(json);

    // Validate URL orgId matches body org_id (prevent mismatch)
    if (parsed.org_id !== orgId) {
      return NextResponse.json(
        { error: 'org_id mismatch between URL and body' },
        { status: 400 }
      );
    }

    const ctx = await buildServiceContext(req);
    // INV-SERVICE-001 wrap site: this is the Phase 1.1 reference implementation of the
    // SERVICE-001 pattern — every mutating service function is invoked through withInvariants()
    // at the route handler boundary. The pattern is paired with the "SERVICE-001 export contract"
    // annotation at the top of journalEntryService.ts (module exports unwrapped; route handler
    // wraps at the call site). Skipping this wrap would silently bypass all four INV-AUTH-001
    // pre-flight checks (context shape, caller verification, org-access, role authorization).
    const result = await withInvariants(
      journalEntryService.post,
      { action: 'journal_entry.post' }
    )(parsed, ctx);

    // 201 Created — REST convention for resource creation.
    // Returns { journal_entry_id, entry_number }.
    return NextResponse.json(result, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request', details: err.issues },
        { status: 400 }
      );
    }
    if (err instanceof ServiceError) {
      return NextResponse.json(
        { error: err.code, message: err.message },
        { status: serviceErrorToStatus(err.code) }
      );
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ orgId: string }> }
) {
  // C4 (P31): hoist trace_id + org_id so the unknown-error log
  // in the catch block can emit them when they're known. Both
  // are undefined when the error fires before param/ctx landing;
  // pino omits undefined values, so partial logs are still clean.
  let orgId: string | undefined;
  let traceId: string | undefined;
  try {
    ({ orgId } = await params);
    const url = new URL(req.url);
    const fiscalPeriodId = url.searchParams.get('fiscal_period_id') ?? undefined;

    const ctx = await buildServiceContext(req);
    traceId = ctx.trace_id;
    const entries = await journalEntryService.list(
      { org_id: orgId, fiscal_period_id: fiscalPeriodId },
      ctx
    );

    return NextResponse.json({ entries, count: entries.length });
  } catch (err) {
    if (err instanceof ServiceError) {
      return NextResponse.json(
        { error: err.code, message: err.message },
        { status: serviceErrorToStatus(err.code) }
      );
    }
    // C4 (P31): structured log for the unknown-error 500 path so
    // the HoldingCo-specific 500 surfaces its root cause. The
    // ServiceError branch above already reaches pino via the
    // service-layer loggerWith(ctx) call; only this fallthrough
    // needed instrumentation.
    logger.error(
      {
        trace_id: traceId,
        org_id: orgId,
        err: {
          message: err instanceof Error ? err.message : String(err),
          stack: err instanceof Error ? err.stack : undefined,
          code: (err as { code?: string })?.code,
        },
      },
      'journal-entries GET 500',
    );
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
