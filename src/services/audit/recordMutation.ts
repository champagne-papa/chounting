// src/services/audit/recordMutation.ts
// INV-AUDIT-001 (primary enforcement): every mutating service call writes an audit_log row in the same transaction.
// Paired with INV-AUDIT-002 (Layer 1a) — the database makes the audit_log row permanent once this function writes it (see supabase/migrations/20240122000000_audit_log_append_only.sql).
// Synchronous audit log writer (Simplification 1).
// Called inside the same database transaction as the mutation it records.
// In Phase 2 this role moves to the events table; for now audit_log is
// the Layer 3 truth written synchronously within the mutation transaction.

import type { SupabaseClient } from '@supabase/supabase-js';
import type { ServiceContext } from '@/services/middleware/serviceContext';

/**
 * Audit payload passed to recordMutation(). See the INV-AUDIT-001
 * leaf in docs/02_specs/ledger_truth_model.md for the full rule;
 * the "Before-state capture convention" section of that leaf
 * covers before_state semantics — INSERT omits it, UPDATE and
 * DELETE capture the full pre-mutation row via a same-transaction
 * SELECT.
 */
export interface AuditEntry {
  // org_id is nullable per migration 113 (2026-04-15) —
  // login/logout and user-profile-update audit rows legitimately
  // carry null org_id because they are user events, not org
  // events. Prior to this type update, callers without an org
  // context cast undefined through `unknown as string` to
  // satisfy the type; the hack only worked because Supabase-js
  // silently drops undefined JSON fields. Typing the field
  // correctly lets callers pass null explicitly.
  org_id: string | null;
  action: string;
  entity_type: string;
  entity_id?: string;
  before_state?: Record<string, unknown>;
  after_state_id?: string;
  tool_name?: string;
  idempotency_key?: string;
  // reason: caller-supplied rationale for the mutation. Populated
  // by periodService.lock / periodService.unlock (Phase 1.x Phase
  // B Prompt 4); nullable for all other mutation types, which are
  // fully described by action + before_state + after_state.
  reason?: string;
}

/**
 * Writes one row to the `audit_log` table.
 *
 * Accepts a `SupabaseClient` rather than creating its own so the caller
 * can pass the same client (and therefore the same transaction) that is
 * performing the mutation. This guarantees the audit row is committed
 * atomically with the data change — if the transaction rolls back, the
 * audit row disappears too.
 *
 * @param db   - The Supabase client participating in the current transaction.
 * @param ctx  - The ServiceContext for this request (provides org_id, user_id, trace_id).
 * @param entry - The audit payload describing what changed.
 */
export async function recordMutation(
  db: SupabaseClient,
  ctx: ServiceContext,
  entry: AuditEntry,
): Promise<void> {
  const { error } = await db.from('audit_log').insert({
    org_id: entry.org_id,
    user_id: ctx.caller.user_id,
    trace_id: ctx.trace_id,
    action: entry.action,
    entity_type: entry.entity_type,
    entity_id: entry.entity_id ?? null,
    before_state: entry.before_state ?? null,
    after_state_id: entry.after_state_id ?? null,
    tool_name: entry.tool_name ?? null,
    idempotency_key: entry.idempotency_key ?? null,
    reason: entry.reason ?? null,
  });

  if (error) {
    throw new Error(`[AUDIT_WRITE_FAILED] ${error.message}`);
  }
}
