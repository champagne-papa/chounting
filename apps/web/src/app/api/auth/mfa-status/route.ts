// GET /api/auth/mfa-status — MFA enrollment status for current org

import { NextResponse } from 'next/server';
import { adminClient } from '@/db/adminClient';
import { buildServiceContext } from '@/services/middleware/serviceContext';
import { ServiceError } from '@/services/errors/ServiceError';
import { serviceErrorToStatus } from '@/app/api/_helpers/serviceErrorToStatus';

export async function GET(req: Request) {
  try {
    const ctx = await buildServiceContext(req);
    const url = new URL(req.url);
    const orgId = url.searchParams.get('org_id');

    let orgRequiresMfa = false;
    if (orgId) {
      const db = adminClient();
      const { data: org } = await db
        .from('organizations')
        .select('mfa_required')
        .eq('org_id', orgId)
        .maybeSingle();
      orgRequiresMfa = org?.mfa_required ?? false;
    }

    return NextResponse.json({
      user_id: ctx.caller.user_id,
      org_requires_mfa: orgRequiresMfa,
    });
  } catch (err) {
    if (err instanceof ServiceError) {
      return NextResponse.json({ error: err.code, message: err.message }, { status: serviceErrorToStatus(err.code) });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
