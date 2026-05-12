// src/services/spend/vendorService.ts
//
// Phase 5 chunk B5-3-D2 substantive session #1: general-entity vendor list
// service per EC-A-5 Path (Y) ratification (Two Laws Law 1 dispositive:
// all DB access through src/services/; route handlers must not query
// vendors table directly).
//
// Mirror pattern: vendorReportService.ts (B5-3-D1) for structural
// discipline (imports, ServiceContext, adminClient, ServiceError,
// loggerWith, plain unwrapped functions exported as service object).
//
// Reading B preservation (ADR-0011 §1, ADR-0007 §Tier 2): READ-ONLY.
// No journalEntryService.post(); no INSERT/UPDATE; no recordMutation.
//
// INV-SERVICE-001 export contract (structural): plain unwrapped function
// (Pattern B). Route handlers do NOT wrap via withInvariants() — read
// functions are intentionally not wrapped per service-architecture skill
// §2 canonical; authorization via RLS on vendors table (vendors_select
// policy gates by user_has_org_access(org_id)).
// INV-SERVICE-002 adminClient discipline: all DB access via adminClient.
//
// ServiceErrorCode usage: generic 'READ_FAILED' per vendorReportService
// precedent; rich discriminator message text carries specifics.
//
// Consumer surface: EC-A-5 vendor balance view (this chunk) + B5-3-D3
// manual bill form + payment approval card (downstream). Centralized
// vendor-list pattern eliminates substrate-fragmentation across 3
// consumers (per chunk B5-3-D2 onset Path (X) vs (Y) substantive
// disposition).

import { adminClient } from '@/db/adminClient';
import type { ServiceContext } from '@/services/middleware/serviceContext';
import { loggerWith } from '@/shared/logger/pino';
import { ServiceError } from '@/services/errors/ServiceError';
import {
  ListVendorsInputSchema,
  type ListVendorsInput,
  type ListVendorsInputRaw,
  type ListVendorsOutput,
} from '@/shared/schemas/spend/listVendors.schema';

async function listVendors(
  input: ListVendorsInputRaw,
  ctx: ServiceContext,
): Promise<ListVendorsOutput> {
  let parsed: ListVendorsInput;
  try {
    parsed = ListVendorsInputSchema.parse(input);
  } catch (err) {
    if (err instanceof Error) {
      throw new ServiceError(
        'READ_FAILED',
        `list_vendors input validation failed: ${err.message}`,
      );
    }
    throw err;
  }

  const log = loggerWith({
    trace_id: ctx.trace_id,
    user_id: ctx.caller.user_id,
  });

  const db = adminClient();
  const { data, error } = await db
    .from('vendors')
    .select('vendor_id, name, is_active')
    .eq('org_id', parsed.org_id)
    .order('name', { ascending: true });

  if (error) {
    log.error({ err: error.message }, 'list_vendors query failed');
    throw new ServiceError(
      'READ_FAILED',
      `list_vendors query failed: ${error.message}`,
    );
  }

  return {
    vendors: (data ?? []).map((row) => ({
      vendor_id: row.vendor_id,
      name: row.name,
      is_active: row.is_active,
    })),
  };
}

export const vendorService = {
  listVendors,
};
