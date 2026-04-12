// src/app/api/org/route.ts
// Thin API route over orgService.createOrgWithTemplate

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withInvariants } from '@/services/middleware/withInvariants';
import { orgService } from '@/services/org/orgService';
import { buildServiceContext } from '@/services/middleware/serviceContext';

const Body = z.object({
  name: z.string().min(1),
  industry: z.enum([
    'holding_company',
    'real_estate',
    'healthcare',
    'hospitality',
    'trading',
    'restaurant',
  ]),
});

export async function POST(req: Request) {
  const json = await req.json();
  const parsed = Body.parse(json);
  const ctx = await buildServiceContext(req);
  const result = await withInvariants(orgService.createOrgWithTemplate)(parsed, ctx);
  return NextResponse.json(result);
}
