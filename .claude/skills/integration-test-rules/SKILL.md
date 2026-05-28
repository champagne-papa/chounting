---
name: integration-test-rules
description: Rules for integration tests — env-var cascade, no hardcoded localhost URLs, the five Category A floor tests. Load when working in tests/integration/.
trigger: Work in `tests/integration/` or when running Category A floor tests.
---

# Integration Test Rules

**Canonical source:** `docs/04_engineering/testing_strategy.md`.
This skill summarizes and points.

## 1. No hardcoded localhost URLs or keys

No test file may hardcode `http://localhost:54321`, `127.0.0.1:54321`,
or any local Supabase key. Tests read from:

- **URL:** `SUPABASE_TEST_URL` → `SUPABASE_URL` → error
- **Service role key:** `SUPABASE_TEST_SERVICE_ROLE_KEY` →
  `SUPABASE_SERVICE_ROLE_KEY` → error

A grep-fail CI check (`pnpm test:no-hardcoded-urls`) rejects any
file under `tests/` or `src/` containing the literal
`localhost:54321` or `127.0.0.1:54321`.

## 2. The five Category A floor tests

These five integration tests are the non-negotiable invariant-proof
set. Run `pnpm agent:floor` to execute all five:

| Test file | Proves |
|---|---|
| `tests/integration/unbalancedJournalEntry.test.ts` | INV-LEDGER-001 — debits must equal credits per entry |
| `tests/integration/lockedPeriodRejection.test.ts` | INV-LEDGER-002 — posting to a locked period is rejected |
| `tests/integration/crossOrgRlsIsolation.test.ts` | INV-RLS-001 — cross-org data is never visible outside the org |
| `tests/integration/serviceMiddlewareAuthorization.test.ts` | INV-AUTH-001 — every mutating service call is authorized |
| `tests/integration/reversalMirror.test.ts` | INV-REVERSAL-001 — reversals mirror the original with debit/credit swapped |

`pnpm agent:validate` runs `pnpm typecheck && pnpm
test:no-hardcoded-urls && pnpm agent:floor` as the shipping check.

Full contract (including Category A rationale, how it relates to
Category B / C tests, and the audit-side evidence table): see
`docs/04_engineering/testing_strategy.md` and
`docs/06_audit/control_matrix.md`.

## 3. Test pollution disciplines

Integration tests that touch the ledger substrate face two distinct
pollution surfaces with different disciplines. The trigger surface is
broadly shared (any test that posts journal entries via
`journalEntryService.post` directly or through any service that
delegates to the journal-entry path — `billService.post`,
`billService.recordPayment`, `vendorPrepaymentService.apply`,
`vendorPrepaymentService.refund`, etc.), but the disciplines fire at
different test-authoring grains:

- **§3.1 — Per-run COA isolation** fires at COA-creation grain
  (typically `beforeAll`).
- **§3.2 — JE/JL accumulation-acceptance** fires at cleanup grain
  (typically `afterAll`) and at read-side aggregate-counting grain.

### 3.1 Per-run COA isolation

When an integration test creates `chart_of_accounts` rows (typically
in `beforeAll` to provision proxy accounts for the test's JE posts),
derive per-run unique `account_code` values from `traceId`:

```typescript
const apCode = `T${traceId.slice(0, 8)}_AP`;
const vpaCode = `T${traceId.slice(0, 8)}_VPA`;
```

The `T${traceId.slice(0,8)}_` prefix serves two purposes:

1. **Prevents `UNIQUE(org_id, account_code)` collisions across runs.**
   The same test re-running in the same DB session accumulates rows;
   without the per-run prefix, the second run fails on the unique
   constraint. (`chart_of_accounts` is not append-only — DELETE
   cleanup is permitted — but cleanup is unreliable across crashed
   tests, mid-test exceptions, and pre-afterAll assertion failures.
   The per-run prefix is defense-in-depth.)
2. **Tags the rows for downstream filter discipline.** Aggregate-
   counting tests filter T-prefixed accounts at the read side — see
   §3.2.

Canonical pattern (from
`apps/web/tests/integration/vendorPrepaymentApply.test.ts`,
codification anchor):

```typescript
// In beforeAll, derive per-run unique account_codes from traceId
// to avoid UNIQUE(org_id, account_code) collision across runs:
const apCode = `T${traceId.slice(0, 8)}_AP`;
const vpaCode = `T${traceId.slice(0, 8)}_VPA`;

const { data: created, error: coaErr } = await db
  .from('chart_of_accounts')
  .insert([
    {
      org_id: SEED.ORG_HOLDING,
      account_code: apCode,
      account_name: 'TEST AP control proxy',
      account_type: 'liability',
    },
    {
      org_id: SEED.ORG_HOLDING,
      account_code: vpaCode,
      account_name: 'TEST vendor prepayment asset proxy',
      account_type: 'asset',
    },
  ])
  .select('account_id, account_code');

if (coaErr || !created || created.length !== 2) {
  throw new Error(`COA seed failed: ${coaErr?.message ?? 'no data'}`);
}

apControlAccountId = created.find((c) => c.account_code === apCode)!.account_id;
vpAssetAccountId = created.find((c) => c.account_code === vpaCode)!.account_id;

// Use apControlAccountId / vpAssetAccountId for JE line account references.
```

`afterAll` COA cleanup (DELETE on `chart_of_accounts` by account_id) is
permitted and remains a hygiene-positive practice, but is NOT a load-
bearing discipline — the per-run prefix and the read-side filter
(§3.2) together handle pollution without requiring cleanup.

Trigger: any integration test that creates `chart_of_accounts` rows.
Tests that only read seeded COA rows (e.g., reading
`account_code = '2200'` for assertion) don't need this pattern.

Precedent: Phase 5 chunk B5-1 substantive session #2 (2026-05-10).
Pattern codified mid-session after `reportTrialBalance.test.ts`
collision surfaced during full-suite verification post-substrate-
drafting; refactored across 4 test files
(`vendorPrepaymentApply.test.ts` + 3 EC-A-* per-criterion tests). See
`docs/07_governance/friction-journal.md` Phase 5 chunk B5-1 closeout
retrospective entry (2026-05-10) Adjudication 6 for the codification
adjudication.

### 3.2 JE/JL accumulation-acceptance

`journal_entries` and `journal_lines` are **append-only** per
**INV-LEDGER-001** (Layer 1a, implemented at
`supabase/migrations/20240133000000_journal_immutability_triggers.sql`
— `trg_journal_entries_no_delete` rejects DELETE on
`journal_entries`). The trigger fires for all callers including
`service_role`; **service-role does NOT bypass triggers** in this
constraint.

The discipline at cleanup grain: any integration test that posts
JEs/JLs must NOT attempt DELETE cleanup in `afterAll`. Rows accumulate
canonically across runs. Preserve `createdJeIds` (or equivalent
tracking array) for diagnostic purposes only.

Canonical pattern (from
`apps/web/tests/integration/journalSourceExternalId.test.ts:32-40`):

```typescript
afterAll(async () => {
  // journal_entries is append-only — DELETE cleanup is rejected by
  // trg_journal_entries_no_delete. Rows accumulate across test runs;
  // per-run unique source_external_id values prevent unique-key
  // collisions on subsequent runs. The createdIds array is preserved
  // for diagnostic purposes only; no cleanup attempted.
  void createdIds;
});
```

Per-run uniqueness on `source_external_id` (when the test posts JEs
with that field) is the analogous discipline to §3.1's per-run COA
isolation — prevents unique-key collisions across runs without
requiring cleanup.

**Read-side filter for COA-counting / reporting tests.** Tests that
count `chart_of_accounts` rows or assert on aggregate ledger state
(e.g., trial balance, P&L) must filter T-prefixed accounts to ignore
§3.1's per-run isolation rows:

```typescript
const seedRows = result.rows.filter((r) => !/^T[a-f0-9]{8}_/.test(r.account_code));
```

Canonical pattern: `apps/web/tests/integration/reportTrialBalance.test.ts:147`.
Apply the same filter shape in any test whose assertions depend on COA
aggregation cleanliness.

Trigger: any integration test that posts JEs/JLs (no-DELETE cleanup
discipline), AND any test that counts or reports on COA aggregate
state (read-side filter).

Precedent: Phase 5 chunk B5-2 closeout session #2 (2026-05-10).
Revision codified per catch #18 substrate-level finding — original §3
framing prescribed DELETE cleanup that was silently rejected at the
trigger layer; substrate read of migration 20240133000000 and the
`journalSourceExternalId.test.ts` precedent corrected the discipline.
See `docs/07_governance/friction-journal.md` Phase 5 chunk B5-2
closeout retrospective entry (2026-05-10) for the codification
adjudication.

### 3.3 Append-only spine-substrate accumulation-acceptance (mechanism-extension)

`document_relationship_candidates` and `source_documents` are
**append-only** at the database layer — same mechanism class as
§3.2's JE/JL, with different specific enforcement:

- **`document_relationship_candidates`** — append-only per RLS
  `document_relationship_candidates_no_delete` policy +
  `REVOKE DELETE ON document_relationship_candidates FROM service_role`
  (migration `20240149000000_document_relationship_candidates_substrate.sql:209-220`).
  Versioning via `supersedes_candidate_id` per **ADR-0011 §9 rule 3**.
- **`source_documents`** — append-only per RLS
  `source_documents_no_delete` policy + `trg_source_documents_no_delete`
  trigger (migration `20240135000000_storage_substrate.sql:344, 421`).
  **Service-role does NOT bypass triggers** (same Catch #18
  substrate-mechanism as JE/JL).

The discipline at cleanup grain: any integration test that writes
rows to these substrates must NOT attempt DELETE cleanup in
`afterAll`. Rows accumulate canonically across runs. Tests that
track row IDs for diagnostic purposes preserve them as `void`
references — no cleanup attempted. Same pattern as §3.2's
`createdJeIds` shape.

The discipline at empty-state-assumption grain: tests must NOT
assume the substrate is empty at session start. Full-suite
integration sweeps run via `pnpm test:full` (defined in root
`package.json`) which prepends `pnpm db:reset:clean` to clear all
substrate before the suite runs. Single-file dev runs rely on
operator-side manual `pnpm db:reset:clean` invocation between
iterations when empty-state matters.

**Read-side scoping for tests asserting on substrate state.**
Filter by per-test identifiers to scope queries to your own
test's rows — `trace_id` for `document_relationship_candidates`,
`ingest_batch_id` for `source_documents`. This is per-test
scoping, not the aggregate cleanliness pattern §3.2 establishes
for COA-counting tests (neither substrate carries a stable
test-vs-real tag, so positive-filter-to-your-own-test is the
natural shape):

```typescript
// document_relationship_candidates — filter by traceId
const mineCandidates = candidates.filter((c) => c.trace_id === traceId);

// source_documents — filter by per-test ingest_batch_id
const mineSources = docs.filter((d) => d.ingest_batch_id === batchId);
```

**Per-run uniqueness for UNIQUE constraints.** Neither
`document_relationship_candidates` nor `source_documents` has
UNIQUE constraints beyond PK (gen_random_uuid() suffices). If
future append-only spine substrates carry UNIQUE constraints,
derive per-run unique values from `traceId` analogous to §3.1's
T-prefix pattern and §3.2's `source_external_id` pattern.

**Canonical afterAll pattern** for tests writing to these
substrates:

```typescript
afterAll(async () => {
  // document_relationship_candidates is append-only (RLS no_delete +
  // REVOKE DELETE; supersedes_candidate_id versioning per ADR-0011 §9).
  // source_documents is append-only (RLS no_delete +
  // trg_source_documents_no_delete; service_role does NOT bypass
  // triggers). Rows accumulate across runs; full-suite sweeps reset
  // via pnpm test:full → pnpm db:reset:clean.
  void createdCandidateIds;
  void createdSourceDocumentIds;
});
```

Trigger: any integration test that writes rows to
`document_relationship_candidates` or `source_documents` —
Subsystem-3 candidate-resolution tests;
`documentPlatformService.createSourceDocument` tests; any test
invoking `complete_candidate` or `create_candidates_with_audit`
RPCs.

The cross-substrate root cause: §3.3 and §3.2 share root cause —
substrate is structurally append-only at the database layer;
cleanup must happen at the session-boundary layer via
`pnpm db:reset:clean` (wired into `pnpm test:full`), not at the
test-boundary layer via `afterAll DELETE`. §3.3 extends §3.2's
pattern to spine substrates beyond the journal ledger.

---
**Origin:**
- First codified: Umbrella test-isolation discipline arc,
  2026-05-28
- Evidence basis: N=2 substrate-grain mechanism-extension within
  §3 discipline class. `document_relationship_candidates`
  accumulation (2438 rows at HEAD-pass; drift from 1834 at T8
  closeout 2026-05-28); `source_documents` accumulation (implicit
  in `trg_source_documents_no_delete` schema + acknowledged
  inline in `storageProviderIntegration.test.ts:30-33`). Verified
  via HEAD-pass empirical audit of `apps/web/tests/integration/`.
- Promoted from: umbrella arc HEAD-pass audit findings.
- Cross-references: ADR-0011 §9 rule 3 (insert-only spine
  versioning); §3.2 (sibling discipline for JE/JL same-mechanism);
  CLAUDE.md "What done means" Condition 1 (`pnpm test:full`
  push-readiness gate); `docs/04_engineering/conventions/testing.md`
  (operational discipline naming the substrate-deletability split
  + full-suite-vs-dev-iteration command pattern).

**Evaluation basis:**

- **Load-bearing (prescriptive).** The discipline generates
  concrete operator action: when authoring integration tests
  that write to these substrates, do NOT add DELETE cleanup in
  `afterAll` (would be silently rejected — same Catch #18
  mechanism); do NOT assume empty starting state; use
  `pnpm test:full` for empty-state-sensitive full-suite sweeps.
  Without §3.3, a new test author would default to the afterAll-
  DELETE pattern (matching most other tables) and reproduce the
  silent-cleanup-rejection failure mode that Catch #18 documented
  for JE/JL. The discipline closes that failure path at authoring
  time.

- **Generalizable.** The mechanism class is "append-only spine
  substrates" — generalizes to any future substrate with REVOKE
  DELETE + RLS no_delete policy or trigger-blocked DELETE. The
  candidate and source_documents instances are not coincidental
  same-shape data; they're two instances of an architectural
  pattern (insert-only spine versioning per ADR-0011 §9 rule 3
  plus trigger-enforced append-only-ness). Future spine substrates
  added to the architecture should be auditable for this
  discipline at substrate-creation grain.

- **Stable (substrate-mechanism-anchored).** The discipline is
  anchored in the database layer's structural enforcement (RLS
  policies + REVOKE statements + triggers). The substrate
  enforcement is itself stable; the discipline derived from it is
  therefore stable. Not exploratory — the same Catch #18
  mechanism that established §3.2 establishes §3.3 by the same
  evidence shape (substrate-level finding via verify-from-disk on
  migration files).
