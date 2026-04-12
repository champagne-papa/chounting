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
  try {
    const { orgId } = await params;
    const url = new URL(req.url);
    const fiscalPeriodId = url.searchParams.get('fiscal_period_id') ?? undefined;

    const ctx = await buildServiceContext(req);
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
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
