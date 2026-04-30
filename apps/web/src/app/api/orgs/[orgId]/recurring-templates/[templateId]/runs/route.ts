import { NextResponse } from 'next/server';
import { z } from 'zod';
import { RecurringRunGenerateInputSchema } from '@/shared/schemas/accounting/recurringJournal.schema';
import { withInvariants } from '@/services/middleware/withInvariants';
import { recurringJournalService } from '@/services/accounting/recurringJournalService';
import { buildServiceContext } from '@/services/middleware/serviceContext';
import { ServiceError } from '@/services/errors/ServiceError';
import { serviceErrorToStatus } from '@/app/api/_helpers/serviceErrorToStatus';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ orgId: string; templateId: string }> },
) {
  try {
    const { orgId, templateId } = await params;
    const json = await req.json();
    const parsed = RecurringRunGenerateInputSchema.parse(json);

    const ctx = await buildServiceContext(req);
    const result = await withInvariants(
      recurringJournalService.generateRun,
      { action: 'recurring_run.generate' },
    )(
      {
        recurring_template_id: templateId,
        org_id: orgId,
        ...parsed,
      },
      ctx,
    );

    // 201 Created on new generation; 200 OK on idempotent-return-existing.
    return NextResponse.json(result, { status: result.created ? 201 : 200 });
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
