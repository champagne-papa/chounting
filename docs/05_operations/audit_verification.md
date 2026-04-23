# Audit Coverage Verifier

## 1. Purpose and categorization

The audit coverage verifier is a **Layer 2 detection backstop** for
INV-AUDIT-001 (the service-layer invariant that every mutating
service call writes an `audit_log` row via `recordMutation`). It
reconciles every tenant-entity row against `audit_log` to catch
regressions where a new mutation path skips `recordMutation` —
for example, a future service method that inserts into
`journal_entries` without routing through the audit writer.

The verifier is **distinct from ADR-0008 Layer 1b audit scans**
(see `docs/07_governance/adr/0008-layer-1-enforcement-modes.md`).
Layer 1b scans are reserved for cross-aggregate Phase 2 invariants
whose synchronous write-time enforcement would be prohibitively
expensive — checkpoint vs. ledger reconciliation, subsidiary
tie-out, bank-rec sum matching. Both use the same general shape
(scheduled detection, not prevention), but they target different
layers of the four-layer model. INV-AUDIT-001 is synchronously
enforced at the service layer via `recordMutation`; the verifier
is a detection backstop in case the service-layer enforcement is
silently bypassed. INV-CHECKPOINT-001 and siblings (Phase 2+) have
no synchronous enforcement option and sit in Layer 1b natively.

## 2. What it reconciles

Two entity-table reconciliations in Step 4:

- Every `journal_entries` row → matching `audit_log` row with
  action in `{'journal_entry.post', 'journal_entry.reverse'}`.
- Every currently-locked `fiscal_periods` row (`locked_at IS NOT
  NULL`) → matching `audit_log` row with action `'period.locked'`.

**Scope direction: one-directional.** The verifier scans from
entity tables to `audit_log` only. The reverse direction (every
`audit_log` row traces back to an existing entity row) is out of
scope for Step 4 to avoid coupling to an exclusion list for
`auth.login` / `auth.logout` (direct-write via
`src/services/auth/authEvents.ts`, bypassing `recordMutation`)
and any future direct-write audit paths. A future session that
adds reverse-direction checks would need to codify the exclusion
list at that time.

**Known limit — unlock event-history reconciliation.** The verifier
uses past-tense action strings (`period.locked`, `period.unlocked`)
per the Phase 1.5A audit-key convention (`docs/04_engineering/conventions.md`
§190+). The brief §9 examples for `period.*` predate the
convention's consolidation; shipped code is the authoritative
source. `journal_entry.post` and `journal_entry.reverse` remain
imperative because `journalEntryService` predates Phase 1.5A — a
tracked historical exception, not a new standard.

The verifier reconciles **currently-locked** `fiscal_periods`
rows, not the full lock/unlock event history. The `fiscal_periods`
schema does not persist unlock history — `locked_at` becomes NULL
again on unlock, so the row state at any moment tells you whether
a period is currently locked but not how many times it was locked
and unlocked in the past. The brief §9 claim "every `fiscal_periods`
lock/unlock event against `audit_log`" overstates what is feasible
against the current schema. Full lock/unlock event-history
reconciliation requires a schema change (for example, a
`period_lifecycle_events` table tracking every transition) and is
deferred to Phase 2+. See §6 below for the follow-up.

The `FISCAL_PERIOD_UNLOCK_ACTIONS` constant in the verifier source
is exported but unused — it is retained so Step 10's extension
pattern has a sibling const-set to mirror, and so the expected
action string for future lock/unlock-history work is findable
without re-derivation. The verifier's reconciliation logic does
not currently reference it.

## 3. Running the verifier

### Local

```bash
pnpm db:start             # Start local Supabase containers
pnpm db:reset             # Apply migrations to a clean DB
pnpm db:seed:all          # Seed auth users + dev fixtures
pnpm verify-audit-coverage
```

Stdout emits the JSON `GapReport` (for programmatic consumption).
Stderr emits a one-line OK or GAP summary.

### CI

The workflow at `.github/workflows/verify-audit-coverage.yml`
runs daily at 06:00 UTC and can be triggered manually via the
GitHub Actions UI (`workflow_dispatch`). This is the **primary
deployment path** for Step 4. See §4 below for the other three
deployment options, none of which are currently wired.

### Exit codes

- **0** — no gaps. Verifier succeeded and reconciliation passed.
- **1** — gaps detected. Caller (CI, operator) should page or
  alert; the JSON report on stdout lists each gap.
- **2** — verifier crashed (DB connection failure, query error,
  transient infrastructure problem). Treat as transient — retry
  before paging.

## 4. Deployment options

Brief §9 names four deployment options. The CI job is the one
wired; the other three are alternatives for future operators to
choose from as the surface matures.

### CI job (primary, wired)

Daily GitHub Actions run against a seed-reset DB. Catches
service-layer regressions where a new mutation path skips
`recordMutation`. Workflow file:
`.github/workflows/verify-audit-coverage.yml`. Trigger: schedule
(daily 06:00 UTC) plus manual dispatch. No push or PR triggers —
the service-layer test suite at PR time catches most
`recordMutation`-missing bugs, and daily cadence is adequate for
the remaining long-tail regression surface.

### Supabase `pg_cron`

Requires a `pg_cron` extension install and a SQL-callable wrapper
around the verifier's SELECTs. Trade: runs inside the database, no
CI runtime cost, harder to surface alerts to external paging
channels. Suitable if the deployment already has `pg_cron`
available for other scheduled tasks.

### Vercel Cron

Requires a Next.js API route that runs the verifier and
authenticates via a service-role JWT. Trade: uses the existing
application deployment surface, requires route-handler scaffolding
and service-token storage. Suitable once the Next.js app is
deployed to Vercel (Phase 1.3+).

### External cron on authenticated API route

Same route-handler scaffolding as Vercel Cron, but run by an
external scheduler (GitHub Actions scheduler on a separate repo,
`cron-job.org`, or equivalent). Trade: maximum flexibility,
requires a durable public URL and a rotation plan for the service
token. Suitable as a redundant path alongside one of the above.

## 5. Extension points

Two future-session extensions are reserved in the verifier source
via grep-findable TODO markers. The const-set shape in Step 4 is
the shape future sessions follow.

- **`TODO(step-9)`** — adjusting entries. When Step 9 of the
  Control Foundations brief ships, add `'journal_entry.adjust'` to
  `JOURNAL_ENTRY_ACTIONS` in
  `scripts/audit/verifyAuditCoverage.ts`. The existing
  `journal_entries` entity-row synthesis picks it up automatically
  because the filter is by `entity_type`, not by action; only the
  action-set constant needs extension.
- **`TODO(step-10)`** — recurring journals. When Step 10 ships,
  add `RECURRING_RUN_ACTIONS` and `RECURRING_TEMPLATE_ACTIONS`
  const sets, plus entity-table-scanning logic in `runVerifier`
  for the new `recurring_journal_runs` and
  `recurring_journal_templates` tables. The existing
  `audit_log` SELECT's `.in('entity_type', [...])` filter needs
  extension to include the new entity types.

Future contributors find these extension points by running
`grep -rn "TODO(step-9)\|TODO(step-10)" scripts/`.

## 6. Known follow-ups

- **Seed-data audit coverage gap.** The dev seed at
  `src/db/seed/dev.sql:122-126` inserts a locked `fiscal_period`
  ("FY Prior (LOCKED)" for org
  `22222222-2222-2222-2222-222222222222`) via direct SQL without
  a paired `period.locked` `audit_log` row. The seed predates
  Step 3 (when `periodService.lock` shipped); the locked period
  exists to exercise INV-LEDGER-002 (locked-period rejection) in
  `tests/integration/lockedPeriodRejection.test.ts`, not to
  demonstrate audit coverage. The verifier correctly detects
  this as an INV-AUDIT-001 gap. **Fix**: add a matching
  `audit_log` INSERT adjacent to the `fiscal_periods` INSERT,
  using the `period.locked` action, the pre-lock
  `fiscal_periods` row shape as `before_state`, and the
  controller user as `user_id`. Defer to a dedicated
  seed-cleanup session. The integration round-trip test at
  `tests/integration/verifyAuditCoverageRoundTrip.test.ts`
  currently asserts exactly this one known gap (not zero); when
  the seed fix lands, tighten the assertion to
  `expect(report.gaps).toEqual([])` in the same commit. Parallel
  to the Balance Sheet seed-data follow-up noted in
  `docs/09_briefs/phase-1.1/control-foundations-brief.md` §12
  ("do not 'fix' the RPC to suppress the mismatch") — same
  pattern, second instance.
- **Unlock event-history reconciliation.** Requires a
  `period_lifecycle_events` (or equivalent) schema addition that
  persists every lock/unlock transition as an immutable row.
  Today's `fiscal_periods.locked_at` NULL-on-unlock pattern
  doesn't support it. Deferred to Phase 2+. When the schema
  change lands, the verifier gains a reconciliation that iterates
  lifecycle events instead of current lock state, and
  `FISCAL_PERIOD_UNLOCK_ACTIONS` becomes the action-set filter
  for the unlock portion.
- **Reverse-direction scan.** Every `audit_log` row →
  matching entity row. Requires an exclusion list for
  `auth.login`, `auth.logout`, and any other direct-write audit
  actions that don't correspond to tenant-entity rows. Deferred
  until the direct-write surface has stabilized enough that the
  exclusion list is bounded and codifiable.
- **Direct-write audit action policy.** If a future mutation
  path inserts into `audit_log` without routing through
  `recordMutation` (as `authEvents.ts` already does), decide at
  that session's scope whether the new action belongs in the
  verifier's reconciliation set, in an exclusion list for the
  reverse-direction scan, or neither.

## 7. Categorization reference

- INV-AUDIT-001 (Layer 2, service-layer): every mutating service
  call writes an `audit_log` row via `recordMutation`. Primary
  enforcement.
- INV-AUDIT-002 (Layer 1a, commit-time physical): `audit_log` is
  append-only at the DB level via triggers, RLS, and REVOKEs.
  See `docs/07_governance/adr/0008-layer-1-enforcement-modes.md`
  for the enforcement-mode split and
  `docs/02_specs/ledger_truth_model.md` for the leaf.
- **The verifier** (Layer 2, detection backstop): runs on
  schedule, reports entities missing from `audit_log`, exit code
  signals gaps. The ADR-0008 1a/1b authority gradient classifies
  it as Layer 2 detection, not Layer 1b; the parallel scan-on-a-
  schedule shape is coincidental.
