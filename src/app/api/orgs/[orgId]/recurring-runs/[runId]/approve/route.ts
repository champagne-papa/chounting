import { NextResponse } from 'next/server';
import { z } from 'zod';
import { RecurringRunApproveInputSchema } from '@/shared/schemas/accounting/recurringJournal.schema';
import { withInvariants } from '@/services/middleware/withInvariants';
import { recurringJournalService } from '@/services/accounting/recurringJournalService';
import { buildServiceContext } from '@/services/middleware/serviceContext';
import { ServiceError } from '@/services/errors/ServiceError';
import { serviceErrorToStatus } from '@/app/api/_helpers/serviceErrorToStatus';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ orgId: string; runId: string }> },
) {
  try {
    const { orgId, runId } = await params;
    // Parse body (may be empty) — ADR-0010 Layer 2 rejects any
    // client-provided status override.
    const json = await req.json().catch(() => ({}));
    const parsed = RecurringRunApproveInputSchema.parse(json);

    const ctx = await buildServiceContext(req);
    const result = await withInvariants(
      recurringJournalService.approveRun,
      { action: 'recurring_run.approve' },
    )(
      {
        recurring_run_id: runId,
        org_id: orgId,
        ...parsed,
      },
      ctx,
    );

    return NextResponse.json(result, { status: 200 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request', details: err.issues },
        { status: 400 },
      );
    }
    if (err instanceof ServiceError) {
      return NextResponse.json(
        { error: err.code, message: err.message },
        { status: serviceErrorToStatus(err.code) },
      );
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
