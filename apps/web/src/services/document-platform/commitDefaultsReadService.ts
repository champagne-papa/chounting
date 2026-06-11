// src/services/document-platform/commitDefaultsReadService.ts
//
// Arc 2 T4 (agent→adminClient cleanup) — the Stage-7 commit-default
// lookup pair, hoisted VERBATIM from
// agent/orchestrator/extraction/ingestDocument.ts per ADR-0020
// Appendix A (agent → services → db; Law 1). Read-only; no
// withInvariants per the read-function asymmetry (INV-SERVICE-001
// leaf) — every query is org-filtered. Null-on-any-missing-
// dependency semantics preserved exactly (the callers'
// fallback-to-manual-review behavior depends on it). Consumers:
// buildPostBillInput / buildRecordPaymentInput (the spine's
// preserved Wave -1 commit helpers + the Wave 6 D3 approve-post
// rebuild path).

import { adminClient } from '@/db/adminClient';

/**
 * Look up org-level defaults for bill commit: current open fiscal
 * period + AP control account (first liability account matching AP
 * conventions) + a default expense account for bill lines. Returns
 * null on any missing dependency.
 */
export async function lookupBillCommitDefaults(org_id: string): Promise<{
  fiscal_period_id: string;
  ap_control_account_id: string;
  default_expense_account_id: string;
} | null> {
  const db = adminClient();
  const today = new Date().toISOString().slice(0, 10);

  const { data: period } = await db
    .from('fiscal_periods')
    .select('period_id')
    .eq('org_id', org_id)
    .eq('is_locked', false)
    .lte('start_date', today)
    .gte('end_date', today)
    .limit(1)
    .maybeSingle();
  if (!period) return null;

  const { data: ap } = await db
    .from('chart_of_accounts')
    .select('account_id')
    .eq('org_id', org_id)
    .eq('account_type', 'liability')
    .ilike('account_name', '%accounts payable%')
    .limit(1)
    .maybeSingle();
  if (!ap) return null;

  const { data: expense } = await db
    .from('chart_of_accounts')
    .select('account_id')
    .eq('org_id', org_id)
    .eq('account_type', 'expense')
    .limit(1)
    .maybeSingle();
  if (!expense) return null;

  return {
    fiscal_period_id: (period as { period_id: string }).period_id,
    ap_control_account_id: (ap as { account_id: string }).account_id,
    default_expense_account_id: (expense as { account_id: string }).account_id,
  };
}

/**
 * Look up org-level defaults for payment commit: current open fiscal
 * period + AP control account + a cash account. Returns null on any
 * missing dependency.
 */
export async function lookupPaymentCommitDefaults(org_id: string): Promise<{
  fiscal_period_id: string;
  ap_control_account_id: string;
  cash_account_id: string;
} | null> {
  const db = adminClient();
  const today = new Date().toISOString().slice(0, 10);

  const { data: period } = await db
    .from('fiscal_periods')
    .select('period_id')
    .eq('org_id', org_id)
    .eq('is_locked', false)
    .lte('start_date', today)
    .gte('end_date', today)
    .limit(1)
    .maybeSingle();
  if (!period) return null;

  const { data: ap } = await db
    .from('chart_of_accounts')
    .select('account_id')
    .eq('org_id', org_id)
    .eq('account_type', 'liability')
    .ilike('account_name', '%accounts payable%')
    .limit(1)
    .maybeSingle();
  if (!ap) return null;

  const { data: cash } = await db
    .from('chart_of_accounts')
    .select('account_id')
    .eq('org_id', org_id)
    .eq('account_type', 'asset')
    .ilike('account_name', '%cash%')
    .limit(1)
    .maybeSingle();
  if (!cash) return null;

  return {
    fiscal_period_id: (period as { period_id: string }).period_id,
    ap_control_account_id: (ap as { account_id: string }).account_id,
    cash_account_id: (cash as { account_id: string }).account_id,
  };
}
