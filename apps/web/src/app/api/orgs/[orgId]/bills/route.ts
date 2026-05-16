// src/app/api/orgs/[orgId]/bills/route.ts
//
// Phase 5 chunk B5-3-D3 substantive session #1: POST /bills mutation
// route — first AP write-side UI mutation consumer at codebase grain.
// Consumes billService.post per service-architecture skill §2:
//   - billService is unwrapped Pattern B (verified at billService.ts:11)
//   - route layer wraps via withInvariants(action: 'bill.post')
//   - bill.post ActionName + permissions seeded at
//     supabase/migrations/20240140000000_bill_action_permissions.sql
//
// Mirror pattern: journal-entries/route.ts canonical (HEAD 4abd387);
// single-mutation variant (no reversal/adjustment body discrimination).

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { PostBillInputSchema } from '@/shared/schemas/spend/bill.schema';
import { withInvariants } from '@/services/middleware/withInvariants';
import { billService } from '@/services/spend/billService';
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

    const parsed = PostBillInputSchema.parse(json);

    // URL/body org_id mismatch guard (prevent client spoofing)
    if (parsed.org_id !== orgId) {
      return NextResponse.json(
        { error: 'org_id mismatch between URL and body' },
        { status: 400 }
      );
    }

    const ctx = await buildServiceContext(req);

    // INV-SERVICE-001 wrap site: billService.post is unwrapped Pattern B;
    // route handler wraps via withInvariants at the call site. Skipping
    // this wrap would bypass the four INV-AUTH-001 pre-flight checks
    // (context shape, caller verification, org-access, role authorization).
    const result = await withInvariants(
      billService.post,
      { action: 'bill.post' }
    )(parsed, ctx);

    // 201 Created — REST convention for resource creation.
    // Returns { bill_id, journal_entry_id }.
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
