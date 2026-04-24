import { NextResponse } from 'next/server';
import { z } from 'zod';
import { RecurringRunRejectInputSchema } from '@/shared/schemas/accounting/recurringJournal.schema';
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
    const json = await req.json();
    const parsed = RecurringRunRejectInputSchema.parse(json);

    const ctx = await buildServiceContext(req);
    await withInvariants(
      recurringJournalService.rejectRun,
      { action: 'recurring_run.reject' },
    )(
      {
        recurring_run_id: runId,
        org_id: orgId,
        ...parsed,
      },
      ctx,
    );

    return NextResponse.json({ recurring_run_id: runId }, { status: 200 });
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
