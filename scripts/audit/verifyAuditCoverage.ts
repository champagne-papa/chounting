// scripts/audit/verifyAuditCoverage.ts
// Phase 0–1.1 Control Foundations — Step 4.
//
// Layer 2 detection backstop for INV-AUDIT-001 (service-layer
// "every mutation writes an audit_log row"). Reconciles every
// tenant-entity row against `audit_log` to catch regressions where
// a new mutation path skips `recordMutation`.
//
// Distinct from ADR-0008 Layer 1b audit scans (reserved for
// cross-aggregate Phase 2 invariants — checkpoint vs. ledger
// reconciliation, subsidiary tie-out). Same general shape
// (scheduled detection, not prevention), different layer.
//
// See `docs/05_operations/audit_verification.md` for the full
// operational doc, deployment options, and extension points.

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

// --- Allowed action sets ----------------------------------------------------
//
// Past-tense forms per the Phase 1.5A audit-key convention
// (docs/04_engineering/conventions.md §190+, "Permission Keys vs
// Audit Action Keys"). The brief §9 examples for `period.*` use
// imperative forms and predate the convention's consolidation;
// shipped code is the authoritative source. `journal_entry.post`
// and `journal_entry.reverse` remain imperative because
// `journalEntryService` predates Phase 1.5A — a tracked historical
// exception, not a new standard.
//
// TODO(step-9): add 'journal_entry.adjust' to JOURNAL_ENTRY_ACTIONS
//   when adjusting entries ship. See brief §9 "extensions as ship-
//   order dependencies."
// TODO(step-10): add 'recurring_run.generate', 'recurring_run.approve',
//   'recurring_run.reject' to a new RECURRING_RUN_ACTIONS set, and
//   'recurring_template.create', 'recurring_template.update',
//   'recurring_template.deactivate' to a new RECURRING_TEMPLATE_ACTIONS
//   set, plus their entity-table-scanning logic in runVerifier. See
//   brief §9 "extensions as ship-order dependencies."

export const JOURNAL_ENTRY_ACTIONS = [
  'journal_entry.post',
  'journal_entry.reverse',
] as const;

export const FISCAL_PERIOD_LOCK_ACTIONS = ['period.locked'] as const;

// Defined but unused by the Step-4 reconciliation path. `fiscal_periods`
// schema doesn't persist unlock history (`locked_at` becomes NULL on
// unlock), so the verifier reconciles currently-locked periods only.
// Full lock/unlock event-history reconciliation requires a schema
// change deferred to Phase 2+. This constant is retained so Step 10's
// extension pattern has a sibling const-set shape to copy, and so
// future lock/unlock-history work finds the expected action string
// without re-deriving it. See docs/05_operations/audit_verification.md
// §6 ("Known follow-ups") for the full deferral.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const FISCAL_PERIOD_UNLOCK_ACTIONS = ['period.unlocked'] as const;

// --- Types ------------------------------------------------------------------

export interface EntityRow {
  entity_type: 'journal_entry' | 'fiscal_period';
  entity_id: string;
  org_id: string;
  expected_action_set: readonly string[];
  lifecycle_event?: 'locked' | 'unlocked';
}

export interface AuditRow {
  action: string;
  entity_type: string;
  entity_id: string;
  org_id: string | null;
}

export interface Gap {
  kind: 'missing_audit_row';
  entity_type: string;
  entity_id: string;
  org_id: string;
  lifecycle_event?: 'locked' | 'unlocked';
  expected_action_set: readonly string[];
}

export interface GapReport {
  gaps: Gap[];
  scanned_entity_count: number;
  scanned_audit_count: number;
}

// --- Pure reconciliation logic ---------------------------------------------

/**
 * Reports entity rows that have no matching audit_log row with an
 * action in the expected set. Pure — deterministic on inputs, no I/O.
 *
 * One-directional: entity-table → audit_log only. Reverse direction
 * (every audit_log row references an existing entity) is out of
 * scope for Step 4 to avoid coupling to an exclusion list for
 * `auth.login`/`auth.logout` and future direct-write audit paths.
 */
export function reconcileAuditCoverage(input: {
  entities: EntityRow[];
  auditRows: AuditRow[];
}): GapReport {
  const { entities, auditRows } = input;
  const gaps: Gap[] = [];

  for (const entity of entities) {
    const matched = auditRows.some(
      (row) =>
        row.entity_type === entity.entity_type &&
        row.entity_id === entity.entity_id &&
        entity.expected_action_set.includes(row.action),
    );
    if (!matched) {
      gaps.push({
        kind: 'missing_audit_row',
        entity_type: entity.entity_type,
        entity_id: entity.entity_id,
        org_id: entity.org_id,
        ...(entity.lifecycle_event !== undefined && {
          lifecycle_event: entity.lifecycle_event,
        }),
        expected_action_set: entity.expected_action_set,
      });
    }
  }

  return {
    gaps,
    scanned_entity_count: entities.length,
    scanned_audit_count: auditRows.length,
  };
}

// --- DB-reading wrapper ----------------------------------------------------

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

/**
 * Reads entity and audit rows from Supabase and runs the reconciliation.
 *
 * The optional `db` parameter exists for test dependency injection —
 * the integration round-trip test passes in the shared `adminClient()`
 * from `tests/setup/testDb.ts` so it does not need to re-derive the
 * connection from env vars. Default (no db passed) matches the
 * `scripts/verify-ec-2.ts` operational-script pattern: direct
 * `createClient` with env-var credentials. Deliberately does NOT
 * import `adminClient` from `src/db/` — the verifier is operational
 * tooling outside the service-layer boundary, and INV-SERVICE-002's
 * service-layer affordances do not apply here.
 */
export async function runVerifier(db?: SupabaseClient): Promise<GapReport> {
  const client =
    db ??
    (() => {
      if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
        throw new Error(
          'VERIFIER_ENV_MISSING: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set when no db client is injected',
        );
      }
      return createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
    })();

  const { data: journalEntries, error: jeErr } = await client
    .from('journal_entries')
    .select('journal_entry_id, org_id');
  if (jeErr) {
    throw new Error(`VERIFIER_READ_FAILED (journal_entries): ${jeErr.message}`);
  }

  const { data: fiscalPeriods, error: fpErr } = await client
    .from('fiscal_periods')
    .select('period_id, org_id, locked_at');
  if (fpErr) {
    throw new Error(`VERIFIER_READ_FAILED (fiscal_periods): ${fpErr.message}`);
  }

  const { data: auditRows, error: alErr } = await client
    .from('audit_log')
    .select('action, entity_type, entity_id, org_id')
    .in('entity_type', ['journal_entry', 'fiscal_period']);
  if (alErr) {
    throw new Error(`VERIFIER_READ_FAILED (audit_log): ${alErr.message}`);
  }

  const entities: EntityRow[] = [
    ...(journalEntries ?? []).map(
      (e): EntityRow => ({
        entity_type: 'journal_entry',
        entity_id: e.journal_entry_id as string,
        org_id: e.org_id as string,
        expected_action_set: JOURNAL_ENTRY_ACTIONS,
      }),
    ),
    ...(fiscalPeriods ?? [])
      .filter((p) => p.locked_at !== null)
      .map(
        (p): EntityRow => ({
          entity_type: 'fiscal_period',
          entity_id: p.period_id as string,
          org_id: p.org_id as string,
          expected_action_set: FISCAL_PERIOD_LOCK_ACTIONS,
          lifecycle_event: 'locked',
        }),
      ),
  ];

  return reconcileAuditCoverage({
    entities,
    auditRows: (auditRows ?? []) as AuditRow[],
  });
}

// --- CLI entrypoint --------------------------------------------------------

async function main(): Promise<void> {
  const report = await runVerifier();

  // Stdout: JSON for programmatic consumption (CI, operators).
  console.log(JSON.stringify(report, null, 2));

  if (report.gaps.length > 0) {
    console.error(
      `AUDIT COVERAGE GAP: ${report.gaps.length} entities have no matching audit_log row`,
    );
    process.exit(1);
  }

  console.error('AUDIT COVERAGE OK');
  process.exit(0);
}

// ESM module guard: only run main() when invoked directly via tsx
// (from the `verify-audit-coverage` shim or `pnpm verify-audit-coverage`).
// When imported by vitest for unit tests, `scriptPath` and
// `invokedPath` won't match and main() never fires. Uses
// fileURLToPath + resolve to normalize both to absolute filesystem
// paths, handling the case where `process.argv[1]` is relative.
const scriptPath = fileURLToPath(import.meta.url);
const invokedPath = resolve(process.argv[1] ?? '');

if (scriptPath === invokedPath) {
  main().catch((err) => {
    console.error('VERIFIER FAILURE:', err);
    process.exit(2);
  });
}
