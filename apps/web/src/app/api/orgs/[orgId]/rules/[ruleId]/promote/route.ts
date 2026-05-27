// apps/web/src/app/api/orgs/[orgId]/rules/[ruleId]/promote/route.ts
//
// Ring 2A-core Commit 4 (ADR-0025 §9, OQ-4 separate sub-routes). POST — promote a
// rule to a higher autonomy rung. withInvariants({ action: 'rule.promote' }) at the
// route engages the controller-only permission check (rule.* seeded this commit);
// ruleRegistryService.promote is the wrapped service method (Commit 3).

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { PromoteRuleInputSchema } from '@/shared/schemas/rules/ruleActions.schema';
import { withInvariants } from '@/services/middleware/withInvariants';
import { ruleRegistryService } from '@/services/rules/ruleRegistryService';
import { buildServiceContext } from '@/services/middleware/serviceContext';
import { ServiceError } from '@/services/errors/ServiceError';
import { serviceErrorToStatus } from '@/app/api/_helpers/serviceErrorToStatus';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ orgId: string; ruleId: string }> },
) {
  try {
    const { orgId, ruleId } = await params;
    const json = await req.json().catch(() => ({}));
    const parsed = PromoteRuleInputSchema.parse({ ...json, org_id: orgId, rule_id: ruleId });
    const ctx = await buildServiceContext(req);
    const result = await withInvariants(ruleRegistryService.promote, { action: 'rule.promote' })(parsed, ctx);
    return NextResponse.json(result, { status: 200 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request', details: err.issues }, { status: 400 });
    }
    if (err instanceof ServiceError) {
      return NextResponse.json({ error: err.code, message: err.message }, { status: serviceErrorToStatus(err.code) });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
