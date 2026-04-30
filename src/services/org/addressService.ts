// src/services/org/addressService.ts
//
// INV-SERVICE-001 export contract (structural): plain unwrapped
// functions; mutating functions wrapped at the call site via
// withInvariants() with a controller-only ActionName.
// INV-SERVICE-002 adminClient discipline: all DB access via adminClient.
//
// Phase 1.5A — address mutations on organization_addresses.
// Audit-logged with full before_state per brief §12.
//
// Authorization posture: these functions do NOT enforce
// permissions themselves. Per INV-SERVICE-001 the controller-only
// gate lives in the route handler that wraps each call with
// withInvariants(..., { action: 'org.address.create' })
// (or .update / .delete / .set_primary). The wrapper runs
// canUserPerformAction against ROLE_PERMISSIONS before the
// function body executes; the service file is permission-agnostic.
//
// "Auto-demote" pattern: addAddress and updateAddress with
// is_primary = true demote any existing primary for the same
// (org_id, address_type) pair before the insert/update succeeds.
// This makes the partial unique index idx_org_addr_primary an
// implementation detail rather than a caller burden.

import { adminClient } from '@/db/adminClient';
import type { ServiceContext } from '@/services/middleware/serviceContext';
import { loggerWith } from '@/shared/logger/pino';
import { ServiceError } from '@/services/errors/ServiceError';
import { recordMutation } from '@/services/audit/recordMutation';
import {
  addAddressSchema,
  updateAddressPatchSchema,
  type AddAddressInput,
  type UpdateAddressPatch,
} from '@/shared/schemas/organization/address.schema';

// camelCase → snake_case mapping for address columns.
function addressInputToDbColumns(
  patch: Partial<AddAddressInput>,
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (patch.addressType !== undefined) out.address_type = patch.addressType;
  if (patch.line1 !== undefined) out.line1 = patch.line1;
  if (patch.line2 !== undefined) out.line2 = patch.line2;
  if (patch.city !== undefined) out.city = patch.city;
  if (patch.region !== undefined) out.region = patch.region;
  if (patch.postalCode !== undefined) out.postal_code = patch.postalCode;
  if (patch.country !== undefined) out.country = patch.country;
  if (patch.attention !== undefined) out.attention = patch.attention;
  if (patch.isPrimary !== undefined) out.is_primary = patch.isPrimary;
  return out;
}

async function loadAddressOrThrow(
  db: ReturnType<typeof adminClient>,
  org_id: string,
  address_id: string,
) {
  const { data, error } = await db
    .from('organization_addresses')
    .select('*')
    .eq('address_id', address_id)
    .eq('org_id', org_id)
    .maybeSingle();
  if (error) {
    throw new ServiceError('ADDRESS_WRITE_FAILED', `Pre-load failed: ${error.message}`);
  }
  if (!data) {
    throw new ServiceError('ADDRESS_NOT_FOUND', `address_id=${address_id} not found in org_id=${org_id}`);
  }
  return data;
}

async function demoteCurrentPrimary(
  db: ReturnType<typeof adminClient>,
  org_id: string,
  address_type: string,
): Promise<{ demoted_address_id: string; before: Record<string, unknown> } | null> {
  const { data: current } = await db
    .from('organization_addresses')
    .select('*')
    .eq('org_id', org_id)
    .eq('address_type', address_type)
    .eq('is_primary', true)
    .maybeSingle();

  if (!current) return null;

  const { error } = await db
    .from('organization_addresses')
    .update({ is_primary: false })
    .eq('address_id', current.address_id);
  if (error) {
    throw new ServiceError('ADDRESS_WRITE_FAILED', `Demote failed: ${error.message}`);
  }
  return { demoted_address_id: current.address_id as string, before: current as Record<string, unknown> };
}

export const addressService = {
  /**
   * Adds an address to an org. Controller-only when invoked through
   * the API route (route handler wraps with
   * withInvariants(..., { action: 'org.address.create' })).
   * This function does not enforce permissions; the wrapper does.
   *
   * If isPrimary=true, any existing primary for the same
   * (org_id, address_type) pair is auto-demoted (logical
   * transaction) so the partial unique index does not reject.
   */
  async addAddress(
    input: { org_id: string } & AddAddressInput,
    ctx: ServiceContext,
  ) {
    const { org_id, ...rest } = input;
    let parsed: AddAddressInput;
    try {
      parsed = addAddressSchema.parse(rest);
    } catch (err) {
      if (err instanceof Error) {
        throw new ServiceError('ADDRESS_VALIDATION_FAILED', err.message);
      }
      throw err;
    }

    const log = loggerWith({ trace_id: ctx.trace_id, user_id: ctx.caller.user_id });
    const db = adminClient();

    // Auto-demote previous primary of the same type.
    let demoted: Awaited<ReturnType<typeof demoteCurrentPrimary>> = null;
    if (parsed.isPrimary === true) {
      demoted = await demoteCurrentPrimary(db, org_id, parsed.addressType);
    }

    const insertRow = {
      org_id,
      created_by: ctx.caller.user_id,
      ...addressInputToDbColumns(parsed),
    };

    const { data: inserted, error } = await db
      .from('organization_addresses')
      .insert(insertRow)
      .select('address_id')
      .single();

    if (error || !inserted) {
      throw new ServiceError('ADDRESS_WRITE_FAILED', error?.message ?? 'unknown');
    }

    // Audit: one row for the insert; if a previous primary was
    // demoted, emit a second row for that change too (per OQ-06).
    // before_state = null is explicit: the row did not exist before
    // this insert. Inserts have null before_state by convention;
    // updates and deletes carry the full pre-mutation row.
    await recordMutation(db, ctx, {
      org_id,
      action: 'org.address_added',
      entity_type: 'organization_address',
      entity_id: inserted.address_id,
      before_state: undefined,
    });

    if (demoted) {
      await recordMutation(db, ctx, {
        org_id,
        action: 'org.address_primary_changed',
        entity_type: 'organization_address',
        entity_id: demoted.demoted_address_id,
        before_state: demoted.before,
      });
    }

    log.info(
      { org_id, address_id: inserted.address_id, demoted: demoted?.demoted_address_id ?? null },
      'Address added',
    );

    return { address_id: inserted.address_id as string };
  },

  /**
   * Updates an address. addressType is immutable: the raw input
   * is checked pre-parse and ADDRESS_TYPE_IMMUTABLE is thrown if
   * the caller includes it. (Zod's omit would silently strip it
   * otherwise, which we don't want.)
   *
   * If patch.isPrimary === true, any other primary of the same
   * type for the org is demoted first (per OQ-06: emits a second
   * audit row for the demotion).
   */
  async updateAddress(
    input: { org_id: string; address_id: string; patch: UpdateAddressPatch & { addressType?: unknown } },
    ctx: ServiceContext,
  ) {
    // Defense-in-depth pre-parse rejection.
    if (input.patch && Object.prototype.hasOwnProperty.call(input.patch, 'addressType')) {
      throw new ServiceError(
        'ADDRESS_TYPE_IMMUTABLE',
        'addressType cannot be changed; delete and re-add the address instead',
      );
    }

    let parsedPatch: UpdateAddressPatch;
    try {
      parsedPatch = updateAddressPatchSchema.parse(input.patch);
    } catch (err) {
      if (err instanceof Error) {
        throw new ServiceError('ADDRESS_VALIDATION_FAILED', err.message);
      }
      throw err;
    }

    const log = loggerWith({ trace_id: ctx.trace_id, user_id: ctx.caller.user_id });
    const db = adminClient();

    const before = await loadAddressOrThrow(db, input.org_id, input.address_id);

    let demoted: Awaited<ReturnType<typeof demoteCurrentPrimary>> = null;
    if (parsedPatch.isPrimary === true && !(before as { is_primary: boolean }).is_primary) {
      demoted = await demoteCurrentPrimary(
        db,
        input.org_id,
        (before as { address_type: string }).address_type,
      );
    }

    const dbPatch = addressInputToDbColumns(parsedPatch);
    const { error } = await db
      .from('organization_addresses')
      .update(dbPatch)
      .eq('address_id', input.address_id)
      .eq('org_id', input.org_id);

    if (error) {
      throw new ServiceError('ADDRESS_WRITE_FAILED', error.message);
    }

    await recordMutation(db, ctx, {
      org_id: input.org_id,
      action: 'org.address_updated',
      entity_type: 'organization_address',
      entity_id: input.address_id,
      before_state: before as Record<string, unknown>,
    });

    if (demoted) {
      await recordMutation(db, ctx, {
        org_id: input.org_id,
        action: 'org.address_primary_changed',
        entity_type: 'organization_address',
        entity_id: demoted.demoted_address_id,
        before_state: demoted.before,
      });
    }

    log.info(
      { org_id: input.org_id, address_id: input.address_id, fields_changed: Object.keys(dbPatch) },
      'Address updated',
    );

    return { address_id: input.address_id, fields_changed: Object.keys(dbPatch) };
  },

  /**
   * Hard-deletes an address. No archival column. Audit row carries
   * full pre-delete state in before_state.
   */
  async removeAddress(
    input: { org_id: string; address_id: string },
    ctx: ServiceContext,
  ) {
    const log = loggerWith({ trace_id: ctx.trace_id, user_id: ctx.caller.user_id });
    const db = adminClient();

    const before = await loadAddressOrThrow(db, input.org_id, input.address_id);

    const { error } = await db
      .from('organization_addresses')
      .delete()
      .eq('address_id', input.address_id)
      .eq('org_id', input.org_id);

    if (error) {
      throw new ServiceError('ADDRESS_WRITE_FAILED', error.message);
    }

    await recordMutation(db, ctx, {
      org_id: input.org_id,
      action: 'org.address_removed',
      entity_type: 'organization_address',
      entity_id: input.address_id,
      before_state: before as Record<string, unknown>,
    });

    log.info({ org_id: input.org_id, address_id: input.address_id }, 'Address removed');
    return { address_id: input.address_id };
  },

  /**
   * Promotes the target address to primary; demotes any other
   * primary of the same type. Per OQ-06: emits TWO audit rows
   * (one for the promotion, one for the demotion) so each entity
   * mutation has its own audit row.
   */
  async setPrimaryAddress(
    input: { org_id: string; address_id: string },
    ctx: ServiceContext,
  ) {
    const log = loggerWith({ trace_id: ctx.trace_id, user_id: ctx.caller.user_id });
    const db = adminClient();

    const before = await loadAddressOrThrow(db, input.org_id, input.address_id);
    const address_type = (before as { address_type: string }).address_type;

    // No-op short-circuit: already primary.
    if ((before as { is_primary: boolean }).is_primary === true) {
      return { address_id: input.address_id, no_op: true };
    }

    const demoted = await demoteCurrentPrimary(db, input.org_id, address_type);

    const { error } = await db
      .from('organization_addresses')
      .update({ is_primary: true })
      .eq('address_id', input.address_id)
      .eq('org_id', input.org_id);
    if (error) {
      throw new ServiceError('ADDRESS_WRITE_FAILED', error.message);
    }

    // Two audit rows per OQ-06.
    await recordMutation(db, ctx, {
      org_id: input.org_id,
      action: 'org.address_primary_changed',
      entity_type: 'organization_address',
      entity_id: input.address_id,
      before_state: before as Record<string, unknown>,
    });
    if (demoted) {
      await recordMutation(db, ctx, {
        org_id: input.org_id,
        action: 'org.address_primary_changed',
        entity_type: 'organization_address',
        entity_id: demoted.demoted_address_id,
        before_state: demoted.before,
      });
    }

    log.info(
      { org_id: input.org_id, promoted: input.address_id, demoted: demoted?.demoted_address_id ?? null },
      'Primary address changed',
    );
    return { address_id: input.address_id, demoted: demoted?.demoted_address_id ?? null };
  },

  /**
   * Lists all addresses for an org. Read; not withInvariants-wrapped
   * per OQ-07. Authorization is enforced at the route handler via an
   * explicit caller.org_ids.includes(orgId) check that returns 403
   * ORG_ACCESS_DENIED on cross-org access. Service uses adminClient
   * and bypasses RLS; route-handler check is the load-bearing gate.
   * (S30 hot-fix; element #6 G1 Variant γ closure.)
   */
  async listAddresses(input: { org_id: string }, _ctx: ServiceContext) {
    const db = adminClient();
    const { data, error } = await db
      .from('organization_addresses')
      .select('*')
      .eq('org_id', input.org_id)
      .order('address_type')
      .order('is_primary', { ascending: false })
      .order('created_at');
    if (error) {
      throw new ServiceError('READ_FAILED', error.message);
    }
    return { addresses: data ?? [] };
  },
};
