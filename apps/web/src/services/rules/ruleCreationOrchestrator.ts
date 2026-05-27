// apps/web/src/services/rules/ruleCreationOrchestrator.ts
//
// Ring 2A-core Commit 3 (ADR-0025 §6 / Decision 6). Composes vendor-rule
// creation: dedup probe → create_vendor_rule_atomic RPC (all-or-nothing
// rule_registry + rule_track_records + vendor_rules) → audit. The RPC is the
// sole vendor_rules writer (locked decision Q2 / Option 1), preserving the
// ADR-0023 Decision 5 co-creation invariant.
//
// No production caller wires this arc (ADR-0025 Decision 6 / Non-decision); it
// exists + is integration-testable against seeded inputs.

import { adminClient } from '@/db/adminClient';
import type { ServiceContext } from '@/services/middleware/serviceContext';
import { withInvariants } from '@/services/middleware/withInvariants';
import { ServiceError } from '@/services/errors/ServiceError';
import { recordMutation } from '@/services/audit/recordMutation';
import { loggerWith } from '@/shared/logger/pino';
import { vendorRuleService } from '@/services/rules/vendorRuleService';
import type { Database } from '@/db/types';

type BundleType = Database['public']['Enums']['bundle_type'];
type RuleType = Database['public']['Enums']['rule_type'];
type RuleLifecycleState = Database['public']['Enums']['rule_lifecycle_state'];

export const ruleCreationOrchestrator = {
  /**
   * Create a vendor rule (parent + co-created track record + child) atomically,
   * de-duplicating on the 20240163 §g uniqueness key. If a matching vendor rule
   * already exists, returns it with created=false (no-op); otherwise calls the RPC.
   *
   * JUDGMENT CALLS (review):
   *  - defaults: rule_type='pattern' (vendor rules are pattern rules),
   *    lifecycle_state='proposed' (a freshly created vendor rule is not yet approved;
   *    the vendor-template approval ceremony flips approved_at/by separately).
   *  - audit 'rule.created' is emitted at the orchestrator level AFTER the RPC, not
   *    inside the RPC (unlike write_journal_entry_atomic which bundles its audit). Rule
   *    creation is not ledger-atomicity-critical for audit, and orchestrator-level audit
   *    keeps the RPC a pure data primitive.
   */
  createVendorRule: withInvariants(async (
    input: {
      org_id: string;
      vendor_id: string;
      bundle_type: BundleType;
      default_account_id?: string | null;
      legal_entity_id?: string | null;
      rule_type?: RuleType;
      lifecycle_state?: RuleLifecycleState;
      model_version?: string | null;
    },
    ctx: ServiceContext,
  ): Promise<{ rule_id: string; created: boolean }> => {
    const log = loggerWith({ trace_id: ctx.trace_id, user_id: ctx.caller.user_id });

    const existing = await vendorRuleService.findExisting(
      {
        org_id: input.org_id,
        vendor_id: input.vendor_id,
        bundle_type: input.bundle_type,
        legal_entity_id: input.legal_entity_id ?? null,
      },
      ctx,
    );
    if (existing) {
      log.info({ rule_id: existing.rule_id, vendor_id: input.vendor_id }, 'Vendor rule already exists; create skipped');
      return { rule_id: existing.rule_id, created: false };
    }

    const db = adminClient();
    const { data, error } = await db.rpc('create_vendor_rule_atomic', {
      p_registry: {
        org_id: input.org_id,
        rule_type: input.rule_type ?? 'pattern',
        lifecycle_state: input.lifecycle_state ?? 'proposed',
        created_by: ctx.caller.user_id,
      },
      p_track_record: {
        model_version: input.model_version ?? null,
      },
      p_vendor_rule: {
        vendor_id: input.vendor_id,
        default_account_id: input.default_account_id ?? null,
        legal_entity_id: input.legal_entity_id ?? null,
        bundle_type: input.bundle_type,
      },
    });
    if (error || !data) {
      throw new ServiceError('RULE_CREATE_FAILED', error?.message ?? 'create_vendor_rule_atomic returned no id');
    }
    const rule_id = data as string;

    await recordMutation(db, ctx, {
      org_id: input.org_id,
      action: 'rule.created',
      entity_type: 'rule_registry',
      entity_id: rule_id,
    });

    log.info({ rule_id, vendor_id: input.vendor_id, bundle_type: input.bundle_type }, 'Vendor rule created');
    return { rule_id, created: true };
  }),
};
