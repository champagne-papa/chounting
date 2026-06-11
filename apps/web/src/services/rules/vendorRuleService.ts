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
import { recordMutation } from '@/services/audit/recordMutation';
import { loggerWith } from '@/shared/logger/pino';
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

  /**
   * Approve a 'proposed' vendor rule — the vendor-template approval ceremony
   * (ADR-0026 Decision 5). A two-table atomic transition via the
   * approve_vendor_rule_atomic RPC (20240168): sets vendor_rules.approved_at/
   * approved_by (provenance) + rule_registry.lifecycle_state='active' (the
   * functional gate ruleEvaluationService.evaluate filters candidates on).
   *
   * NOT a co-creation bypass: this UPDATEs an already-co-created row (the
   * read-only constraint on this service guards standalone INSERT, which would
   * bypass create_vendor_rule_atomic's parent+track-record co-creation; an
   * approval UPDATE on existing rows does not). createVendorRule remains the
   * sole creator (untouched per T4).
   *
   * Idempotent: an already-approved rule is a no-op return (no RPC, no audit) —
   * the wrapper's read-before fast-path; the RPC carries its own
   * approved_at IS NULL guard for the race. Audit (rule.approved) emits
   * TS-side after the RPC, mirroring promote + the create-orchestrator's
   * audit-after-write window.
   */
  approve: withInvariants(async (
    input: { org_id: string; rule_id: string },
    ctx: ServiceContext,
  ): Promise<VendorRuleRow> => {
    const log = loggerWith({ trace_id: ctx.trace_id, user_id: ctx.caller.user_id });
    const db = adminClient();

    // Read-before: org-scoped existence + approved_at, for the idempotency
    // fast-path and the before_state audit capture.
    const { data: beforeData, error: readErr } = await db
      .from('vendor_rules')
      .select('*')
      .eq('rule_id', input.rule_id)
      .eq('org_id', input.org_id)
      .maybeSingle();
    if (readErr) throw new ServiceError('READ_FAILED', readErr.message);
    if (!beforeData) {
      throw new ServiceError('RULE_NOT_FOUND', `vendor rule not found (id=${input.rule_id})`);
    }
    const before = beforeData as VendorRuleRow;
    if (before.approved_at !== null) {
      log.info({ rule_id: input.rule_id }, 'Vendor rule already approved; approve skipped');
      return before;
    }

    const { data, error } = await db.rpc('approve_vendor_rule_atomic', {
      p_rule_id: input.rule_id,
      p_org_id: input.org_id,
      p_approved_by: ctx.caller.user_id,
    });
    if (error || !data) {
      throw new ServiceError('POST_FAILED', error?.message ?? 'approve_vendor_rule_atomic returned no id');
    }

    await recordMutation(db, ctx, {
      org_id: input.org_id,
      action: 'rule.approved',
      entity_type: 'rule_registry',
      entity_id: input.rule_id,
      before_state: before as unknown as Record<string, unknown>,
    });

    const { data: after } = await db
      .from('vendor_rules')
      .select('*')
      .eq('rule_id', input.rule_id)
      .eq('org_id', input.org_id)
      .single();
    log.info({ rule_id: input.rule_id }, 'Vendor rule approved');
    return (after ?? before) as VendorRuleRow;
  }),
};
