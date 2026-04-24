import { NextResponse } from 'next/server';
import { recurringJournalService } from '@/services/accounting/recurringJournalService';
import { buildServiceContext } from '@/services/middleware/serviceContext';
import { ServiceError } from '@/services/errors/ServiceError';
import { serviceErrorToStatus } from '@/app/api/_helpers/serviceErrorToStatus';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ orgId: string }> },
) {
  try {
    const { orgId } = await params;
    const url = new URL(req.url);
    const templateId = url.searchParams.get('recurring_template_id') ?? undefined;
    const status = url.searchParams.get('status') ?? undefined;

    const ctx = await buildServiceContext(req);
    const runs = await recurringJournalService.listRuns(
      {
        org_id: orgId,
        recurring_template_id: templateId,
        status,
      },
      ctx,
    );

    return NextResponse.json({ runs, count: runs.length });
  } catch (err) {
    if (err instanceof ServiceError) {
      return NextResponse.json(
        { error: err.code, message: err.message },
        { status: serviceErrorToStatus(err.code) },
      );
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
