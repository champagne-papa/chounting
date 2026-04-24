import { NextResponse } from 'next/server';
import { z } from 'zod';
import { RecurringTemplateUpdateSchema } from '@/shared/schemas/accounting/recurringJournal.schema';
import { withInvariants } from '@/services/middleware/withInvariants';
import { recurringJournalService } from '@/services/accounting/recurringJournalService';
import { buildServiceContext } from '@/services/middleware/serviceContext';
import { ServiceError } from '@/services/errors/ServiceError';
import { serviceErrorToStatus } from '@/app/api/_helpers/serviceErrorToStatus';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ orgId: string; templateId: string }> },
) {
  try {
    const { templateId } = await params;
    const ctx = await buildServiceContext(req);
    const detail = await recurringJournalService.getTemplate(
      { recurring_template_id: templateId },
      ctx,
    );
    return NextResponse.json(detail);
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

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ orgId: string; templateId: string }> },
) {
  try {
    const { orgId, templateId } = await params;
    const json = await req.json();
    const parsed = RecurringTemplateUpdateSchema.parse(json);

    const ctx = await buildServiceContext(req);
    await withInvariants(
      recurringJournalService.updateTemplate,
      { action: 'recurring_template.update' },
    )(
      {
        recurring_template_id: templateId,
        org_id: orgId,
        ...parsed,
      },
      ctx,
    );

    return NextResponse.json({ recurring_template_id: templateId });
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

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ orgId: string; templateId: string }> },
) {
  try {
    const { orgId, templateId } = await params;
    const ctx = await buildServiceContext(req);
    await withInvariants(
      recurringJournalService.deactivateTemplate,
      { action: 'recurring_template.deactivate' },
    )(
      {
        recurring_template_id: templateId,
        org_id: orgId,
      },
      ctx,
    );

    return NextResponse.json({ recurring_template_id: templateId });
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
