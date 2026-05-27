// apps/web/src/services/rules/vendorRuleService.ts
//
// Ring 2A-core Commit 3 (ADR-0025 §6 / Decision 6).
//
// READ-ONLY for v1 (locked decision Q2 / Option 1): all vendor_rules CREATION
// goes through ruleCreationOrchestrator → create_vendor_rule_atomic, which
// co-creates the rule_registry parent + rule_track_records (ADR-0023 Decision 5
// co-creation invariant). A standalone single-table insert here would bypass
// that invariant, so this service exposes only reads (canvas lookups + the
// orchestrator's dedup probe). [Surfaced for explicit confirmation at review:
// ADR-0025 Decision 6 lists a `create`; the RPC path satisfies it.]

import { adminClient } from '@/db/adminClient';
import type { ServiceContext } from '@/services/middleware/serviceContext';
import { withInvariants } from '@/services/middleware/withInvariants';
import { ServiceError } from '@/services/errors/ServiceError';
import type { Database } from '@/db/types';

type VendorRuleRow = Database['public']['Tables']['vendor_rules']['Row'];
type BundleType = Database['public']['Enums']['bundle_type'];

export const vendorRuleService = {
  /** Read a vendor rule by its rule_id (= rule_registry.id; 1:1 child). */
  getByRuleId: withInvariants(async (
    input: { org_id: string; rule_id: string },
    _ctx: ServiceContext,
  ): Promise<VendorRuleRow | null> => {
    const db = adminClient();
    const { data, error } = await db
      .from('vendor_rules')
      .select('*')
      .eq('rule_id', input.rule_id)
      .eq('org_id', input.org_id)
      .maybeSingle();
    if (error) throw new ServiceError('READ_FAILED', error.message);
    return (data as VendorRuleRow | null) ?? null;
  }),

  /** List an org's vendor rules (Stage 1 canvas joins). */
  listByOrg: withInvariants(async (
    input: { org_id: string },
    _ctx: ServiceContext,
  ): Promise<VendorRuleRow[]> => {
    const db = adminClient();
    const { data, error } = await db
      .from('vendor_rules')
      .select('*')
      .eq('org_id', input.org_id);
    if (error) throw new ServiceError('READ_FAILED', error.message);
    return (data ?? []) as VendorRuleRow[];
  }),

  /**
   * Dedup probe for ruleCreationOrchestrator: find an existing vendor rule on the
   * 20240163 §g uniqueness key — (org_id, COALESCE(legal_entity_id, org_id),
   * vendor_id, bundle_type). Returns the matching row or null.
   *
   * JUDGMENT CALL (review): the COALESCE(legal_entity_id, org_id) fold is applied
   * JS-side (Supabase JS cannot express the expression-index predicate directly):
   * query by (org_id, vendor_id, bundle_type), then match the effective legal
   * entity. Low row-count per (org, vendor, bundle), so the JS fold is cheap.
   */
  findExisting: withInvariants(async (
    input: { org_id: string; vendor_id: string; bundle_type: BundleType; legal_entity_id?: string | null },
    _ctx: ServiceContext,
  ): Promise<VendorRuleRow | null> => {
    const db = adminClient();
    const { data, error } = await db
      .from('vendor_rules')
      .select('*')
      .eq('org_id', input.org_id)
      .eq('vendor_id', input.vendor_id)
      .eq('bundle_type', input.bundle_type);
    if (error) throw new ServiceError('READ_FAILED', error.message);
    const rows = (data ?? []) as VendorRuleRow[];
    const effectiveLegalEntity = input.legal_entity_id ?? input.org_id;
    const match = rows.find(
      (r) => (r.legal_entity_id ?? r.org_id) === effectiveLegalEntity,
    );
    return match ?? null;
  }),
};
