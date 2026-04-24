import { NextResponse } from 'next/server';
import { z } from 'zod';
import { RecurringTemplateInputSchema } from '@/shared/schemas/accounting/recurringJournal.schema';
import { withInvariants } from '@/services/middleware/withInvariants';
import { recurringJournalService } from '@/services/accounting/recurringJournalService';
import { buildServiceContext } from '@/services/middleware/serviceContext';
import { ServiceError } from '@/services/errors/ServiceError';
import { serviceErrorToStatus } from '@/app/api/_helpers/serviceErrorToStatus';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ orgId: string }> },
) {
  try {
    const { orgId } = await params;
    const json = await req.json();
    const parsed = RecurringTemplateInputSchema.parse(json);

    if (parsed.org_id !== orgId) {
      return NextResponse.json(
        { error: 'org_id mismatch between URL and body' },
        { status: 400 },
      );
    }

    const ctx = await buildServiceContext(req);
    const result = await withInvariants(
      recurringJournalService.createTemplate,
      { action: 'recurring_template.create' },
    )(parsed, ctx);

    return NextResponse.json(result, { status: 201 });
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

export async function GET(
  req: Request,
  { params }: { params: Promise<{ orgId: string }> },
) {
  try {
    const { orgId } = await params;
    const ctx = await buildServiceContext(req);
    const templates = await recurringJournalService.listTemplates({ org_id: orgId }, ctx);
    return NextResponse.json({ templates, count: templates.length });
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
