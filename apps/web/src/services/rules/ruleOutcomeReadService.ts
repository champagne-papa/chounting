// src/services/rules/ruleOutcomeReadService.ts
//
// Arc 2 T3 (agent→adminClient cleanup) — the Ring 2B shadow-eval
// outcome-param read pair, hoisted VERBATIM from
// agent/orchestrator/extraction/stages/shadowRuleEvaluation.ts
// (resolveOutcomeParams) per ADR-0020 Appendix A (agent → services
// → db; Law 1). Read-only; no withInvariants per the read-function
// asymmetry (INV-SERVICE-001 leaf).
//
// Deliberately error-TOLERANT, matching the pre-hoist semantics
// exactly: query errors are ignored and coalesce to null (the
// shadow path is fail-safe by design — A1a isolation property 2; a
// read failure must never fail the ingest). Both reads are
// org-filtered. (T5 correction, Class D arc 2026-06-06: the
// vendor_rules read was hoisted as-found by rule_id alone — the
// Arc 2 ledgered defense-in-depth gap — and now enforces org-scope
// like its in-file model resolveRuleDefaultAccount below. Narrows
// match semantics: a foreign org's rule_id no longer resolves.)
//
// Returns primitives only — services may not import agent-layer
// types (ADR-0020, both directions of the boundary).

import { adminClient } from '@/db/adminClient';
import { loggerWith } from '@/shared/logger/pino';

export interface RuleOutcomeParams {
  default_account_id: string | null;
  vendor_name: string | null;
}

export async function resolveRuleOutcomeParams(
  ruleId: string,
  vendorId: string,
  orgId: string,
): Promise<RuleOutcomeParams> {
  const db = adminClient();
  const { data: vr } = await db
    .from('vendor_rules')
    .select('default_account_id')
    .eq('rule_id', ruleId)
    .eq('org_id', orgId)
    .maybeSingle();
  const { data: vendor } = await db
    .from('vendors')
    .select('name')
    .eq('vendor_id', vendorId)
    .eq('org_id', orgId)
    .maybeSingle();
  return {
    default_account_id: vr?.default_account_id ?? null,
    vendor_name: vendor?.name ?? null,
  };
}

// ---------------------------------------------------------------
// Arc 2 T4 — resolveRuleDefaultAccount, hoisted VERBATIM from
// agent/orchestrator/extraction/ingestDocument.ts (the Wave 6 D4
// rule-default-account resolver). Fully org-scoped (unlike the
// resolveRuleOutcomeParams shadow pair above — the D4 resolver's
// own JSDoc names that deviation deliberately). Log messages and
// fallback semantics byte-identical to pre-hoist.
// ---------------------------------------------------------------

// Wave 6 D4 (brief D-1/D-2/D-3): resolve the matched vendor rule's
// default_account_id for the bill line. Direct org-scoped lookup at
// builder grain — NOT a live rule evaluation (D-1: the v1 derived
// branch is field_equals(vendor_id), proposal_type-agnostic and
// card-only, so the direct lookup selects the same rule the evaluator
// would; no Logic-Receipt writes from a human posting path).
// DIVERGENCE WATCH (close-report carry-forward): when non-vendor
// conditions or per-type branches exist post-V1, consumption must
// migrate to the evaluation result.
//
// Tiebreak when one vendor holds multiple active rules (possible only
// across bundle_type under the 20240163 §g uniqueness key): bundle_type
// enum order, then rule_id (defensive — unreachable from a valid seed).
const BUNDLE_TYPE_TIEBREAK: Record<string, number> = {
  // types.ts bundle_type enum array order (migration 20240163).
  born_paid_bill: 0,
  final_invoice_with_applied_deposit: 1,
  vendor_credit_applied_to_bill: 2,
};

/**
 * Returns the validated default_account_id of the vendor's winning
 * active rule, or null on EVERY fallback (no rule / none active / null
 * account / validation fail / read error) — the caller's org default
 * applies, and a rule can never block the human post (brief D-4).
 *
 * Validation (brief D-3): the account must be in-org (the
 * vendor_rules.default_account_id FK is NOT org-composite — never
 * trust the raw FK), account_type='expense' (the slot it fills is the
 * bill's expense line), and is_active. Read org-scoped, mirroring the
 * vendorRuleService read pattern, not the shadow stage's
 * rule_id-only shape.
 */
export async function resolveRuleDefaultAccount(
  org_id: string,
  vendor_id: string,
  trace_id: string,
): Promise<string | null> {
  const log = loggerWith({ trace_id });
  const db = adminClient();
  try {
    const { data: ruleRows, error: vrErr } = await db
      .from('vendor_rules')
      .select('rule_id, bundle_type, default_account_id')
      .eq('org_id', org_id)
      .eq('vendor_id', vendor_id)
      .not('default_account_id', 'is', null);
    if (vrErr) {
      log.info(
        { vendor_id, reason: 'rule_read_failed', err: vrErr.message },
        'D4 rule default account: fallback',
      );
      return null;
    }
    const withAccount = (ruleRows ?? []) as Array<{
      rule_id: string;
      bundle_type: string;
      default_account_id: string;
    }>;
    if (withAccount.length === 0) {
      // The expected common path (most vendors carry no rule, and the
      // v1 card flow never sets the account) — debug, not info, per the
      // T1 read-back: a non-event, not a noteworthy fallback.
      log.debug(
        { org_id, vendor_id, reason: 'no_rule_with_account' },
        'D4 rule default account: fallback',
      );
      return null;
    }

    // Two-step lifecycle filter (the ruleEvaluationService.evaluate
    // precedent; the composite (rule_id, org_id) FK makes the embed
    // awkward in Supabase JS).
    const { data: regRows, error: regErr } = await db
      .from('rule_registry')
      .select('id')
      .eq('org_id', org_id)
      .eq('lifecycle_state', 'active')
      .in('id', withAccount.map((r) => r.rule_id));
    if (regErr) {
      log.info(
        { vendor_id, reason: 'registry_read_failed', err: regErr.message },
        'D4 rule default account: fallback',
      );
      return null;
    }
    const activeIds = new Set((regRows ?? []).map((r) => r.id as string));
    const candidates = withAccount.filter((r) => activeIds.has(r.rule_id));
    if (candidates.length === 0) {
      log.info(
        { vendor_id, reason: 'no_active_rule' },
        'D4 rule default account: fallback',
      );
      return null;
    }

    candidates.sort(
      (a, b) =>
        (BUNDLE_TYPE_TIEBREAK[a.bundle_type] ?? 99) -
          (BUNDLE_TYPE_TIEBREAK[b.bundle_type] ?? 99) ||
        a.rule_id.localeCompare(b.rule_id),
    );
    if (candidates.length > 1) {
      log.info(
        { vendor_id, candidate_rule_ids: candidates.map((c) => c.rule_id) },
        'D4 rule default account: multiple active rules — bundle_type enum-order tiebreak applied',
      );
    }
    const winner = candidates[0];

    const { data: acct, error: acctErr } = await db
      .from('chart_of_accounts')
      .select('account_id')
      .eq('account_id', winner.default_account_id)
      .eq('org_id', org_id)
      .eq('account_type', 'expense')
      .eq('is_active', true)
      .maybeSingle();
    if (acctErr) {
      log.info(
        {
          vendor_id,
          rule_id: winner.rule_id,
          reason: 'account_read_failed',
          err: acctErr.message,
        },
        'D4 rule default account: fallback',
      );
      return null;
    }
    if (!acct) {
      // The audit-relevant line (T1 read-back): a rule pointing at an
      // account it shouldn't — cross-org, wrong type, or inactive.
      log.info(
        {
          org_id,
          vendor_id,
          rule_id: winner.rule_id,
          account_id: winner.default_account_id,
          reason: 'account_validation_failed',
        },
        'D4 rule default account: fallback (not an in-org active expense account)',
      );
      return null;
    }

    log.info(
      {
        vendor_id,
        rule_id: winner.rule_id,
        account_id: winner.default_account_id,
      },
      'D4 rule default account: resolved from matched rule',
    );
    return winner.default_account_id;
  } catch (err) {
    // Never block the human post on rule-substrate failure (brief D-4).
    log.warn(
      { vendor_id, err },
      'D4 rule default account: unexpected failure — fallback',
    );
    return null;
  }
}
