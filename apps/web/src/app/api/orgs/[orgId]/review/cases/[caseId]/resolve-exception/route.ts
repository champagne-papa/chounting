// src/app/api/orgs/[orgId]/review/cases/[caseId]/resolve-exception/route.ts
//
// POST /api/orgs/[orgId]/review/cases/[caseId]/resolve-exception
//
// Wave 6 D3 T6 — thin wrapper over the existing 9-action
// resolveException (brief D-5: wiring only — the resolution semantics
// and the landing-state mapping are chunk-6's, untouched). Defense in
// depth: explicit org membership check at the route + the T3
// in-service org probe inside resolveException (pre-RPC, derives from
// the entry row). resolved_by = the verified caller — never
// client-supplied. The caseId path segment is navigational context;
// the entry id binds the resolution (same-org entry/case mismatch is a
// client bug, not an authorization hole — both ids are org-checked).

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { buildServiceContext } from '@/services/middleware/serviceContext';
import { ServiceError } from '@/services/errors/ServiceError';
import { serviceErrorToStatus } from '@/app/api/_helpers/serviceErrorToStatus';
import { resolveException } from '@/services/document-platform/documentExceptionService';

const ParamsSchema = z.object({
  orgId: z.string().uuid(),
  caseId: z.string().uuid(),
});
const BodySchema = z.object({
  exception_queue_entry_id: z.string().uuid(),
  resolution_action: z.string().min(1),
  resolution_notes: z.string().optional(),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ orgId: string; caseId: string }> },
) {
  try {
    const raw = await params;
    const { orgId } = ParamsSchema.parse(raw);
    const body = BodySchema.parse(await req.json().catch(() => ({})));
    const ctx = await buildServiceContext(req);

    if (!ctx.caller.org_ids.includes(orgId)) {
      throw new ServiceError(
        'ORG_ACCESS_DENIED',
        `Caller does not have access to org_id=${orgId}`,
      );
    }

    const result = await resolveException(
      {
        exception_queue_entry_id: body.exception_queue_entry_id,
        // Layer-2 Zod inside resolveException rejects reserved values;
        // the string passes through to ResolutionActionSchema there.
        resolution_action: body.resolution_action as never,
        resolution_notes: body.resolution_notes,
        resolved_by: ctx.caller.user_id,
      },
      ctx,
    );
    return NextResponse.json(
      {
        exception_status: result.exception_status,
        resolution_action: result.resolution_action,
        document_case_id: result.document_case_id,
      },
      { status: 200 },
    );
  } catch (err) {
    if (err instanceof ServiceError) {
      return NextResponse.json(
        { error: err.code, message: err.message },
        { status: serviceErrorToStatus(err.code) },
      );
    }
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'INVALID_INPUT', issues: err.issues },
        { status: 400 },
      );
    }
    throw err;
  }
}
