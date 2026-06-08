# Charter B real-flow arc — retrospective

**Arc:** Charter B real-flow — make `sharepointDriveProvider` REACHABLE.
**Commit range:** `1dc71bc9..aed41979` (16 commits, local on `staging`).
**Status at close:** implementation + verification complete; **UNIT-PROVEN,
live SharePoint transfer gated**. Push + lock-release pending the
three-condition gate (Conditions 2–3 + push are the operator's).
**Predecessor:** Charter B (a) (`…66efcc59`) shipped the provider
"implemented + admitted, NOT YET REACHABLE"; this arc removed the two
reachability gates and discharged/scoped the three entangled carries.

---

## What shipped

The selection seam went **dynamic end-to-end**, and the provider is now
reachable in principle (live transfer gated). By spec section:

- **D-1 — `org_settings` storage slice** (`ad0243c5`, migration 20240179):
  `default_storage_provider` (NOT NULL DEFAULT `supabase_storage`, v1-active
  CHECK) + `sharepoint_site_id`/`drive_id`. **Add-consumed-only** — supersedes
  charter §4.A "adds all" (append-only note in the migration header); the
  inert reserved columns (`sharepoint_durability_mode` / `storage_retry_*` /
  `preview_url_*`) deferred as a named sub-slice.
- **D-2/D-4 — `resolveStorageProvider` helper + Zod admit-set** (`858d6748`):
  the single ingest-time selection authority; returns the enum, fallback
  `supabase_storage`, output validated through
  `z.enum(['supabase_storage','sharepoint_drive'])`. Marked ingest-only.
- **D-2 — wiring into all three ingest paths** (`58cf0b35`): single-doc
  co-located resolve/put/stamp; both batch paths resolve-in-TS-then-thread
  (the put and row-stamp are split by the RPC boundary); §4.B-2 header
  reconciliation (two owned RPCs, one selection authority).
- **D-3 — `byteFetch` dispatch-on-row + forward-marker** (`3c724df5`): fetch
  selects on the row's `storage_provider`, never a constant; the forward-marker
  binds the future preview/verify/delete read consumers to the same rule.
- **D-5 — two-layer `provider_unavailable` wire contract** (`0ee5e676`, one
  coordinated commit): `STORAGE_PROVIDER_UNAVAILABLE` (withRetry) →
  `PIPELINE_UNAVAILABLE` (byteFetch) → `classifyError` UNCHANGED; replaces a
  masked-as-transient path with an honest `pipeline_unavailable` trail, no
  wasted retries. Plus the reserved-not-active `exception_reason` value
  (`8be8c4ca`, migration 20240180).
- **D-6 — gated tail** (`27359dbd`): onboarding runbook (Sites.Selected-only,
  decision-#1 operator-onboarding) + `RUN_SHAREPOINT_E2E`-gated harness that
  skips by default and throws-not-false-greens.

Doc-sync fixes (`ac8bd7ca`, `d916d397`, `25369feb`) and two test-fixes
surfaced by `test:full` (`634ac050`, `aed41979`) round out the 16.

## The honest core — UNIT-PROVEN, not PROVEN

The arc closes one notch past (a): **reachable in principle, dynamic
selection + classification proven against mocked Graph, first live SharePoint
transfer gated.** The gated harness *throws* until implemented against a real
tenant, so no path false-greens as "proven live." This is the same
UNIT-PROVEN-≠-PROVEN boundary (a) held, advanced by exactly the work that was
local-executable.

**The three (a)-carries, honestly accounted:**

- **Carry (a) — Layer-2 Zod admit-set:** DISCHARGED. Landed with the dynamic
  value (D-4), paired to the D-1 CHECK.
- **Carry (b) — provider_unavailable routing + substrate:** PARTIALLY
  discharged, by design (decision #2 = option 1). The *classification* is now
  honest (the D-5 wire contract) and the `exception_reason` value is
  *reserved*; the *exception-queue routing surface* + the enqueue
  coupling-wall design are **deferred-with-consumer to Phase-7** — the
  near-vestigiality of the v1 surface (the only live read, `byteFetch`, runs
  moments after `put` already re-read the same bytes) made building active
  routing now inert-substrate-ahead-of-consumer. Eyes-open scope, not an
  omission.
- **Carry (c) — Task-8 ops + live e2e:** local parts landed (runbook, env
  wiring already present, gated harness); Azure registration + live run gated.

## Load-bearing decisions (and why)

- **The selection *seam* reframe (charter finding #1).** The biggest catch of
  the design phase: provider selection is two independent points (put at
  ingest, fetch at read), both hardcoded. Write-dynamic-without-fetch-dynamic
  would have been *reachable-but-broken* — silent cross-provider divergence.
  The corrected spine (pick-once at ingest, dispatch-on-row at fetch) is a
  correctness fix, not a scope-widening.
- **Decision #2 = option 1 (minimal routing).** Grounded against disk:
  `storage_status` has zero UI surface, `exception_queue` is first-class
  visible, the enqueue path couples to `classified|matched` (which a
  `received`-state ingest failure can't satisfy), and the v1 failure surface
  is near-vestigial. Building active routing would have been the hardest design
  cost in the arc for a near-unreachable event — deferred-with-consumer.
- **D-1 add-consumed-only (supersedes charter §4.A).** Same
  reserve-don't-build-inert discipline; recorded as an append-only charter
  supersession, not a silent contradiction.
- **One shared selection authority (not a chokepoint).** The disk topology
  has *two* `source_documents` writers (single-doc RPC + batch RPC); the naive
  "resolve at the canonical writer" was disk-falsified. The helper centralizes
  selection without pretending a chokepoint exists.

## Codification candidates (§3) — assessed, none graduated this arc

Grounded against the friction-journal + existing conventions. The threshold is
observation-grain N≥3 (N=2 for split-trigger sub-types); no improvising.

| Candidate | Status | Disposition |
|---|---|---|
| **header-lags-the-edit doc-sync** | **Already codified** — `conventions/code.md:135-180` "File-top comment staleness review" (prior N=4: Arc A ×3 + Phase 3 ×1) | Fired 2× this arc (Task 3 preamble, Task 5 disposition matrix) + adjacents (resolver.ts, storage failureClassification). NOT a new codification — an existing convention violated and caught at read-back. See §Process observations. |
| **test-isolation under parallel / shared-state mutation** | **Already codified** — `conventions/testing.md:128-265` + integration-test-rules §3 (cross-arc N=2) | This arc's shared-*config-row* mutation (org_settings.default_storage_provider) is a new *application* of the codified discipline, caught by the full-suite gate (`634ac050`). Not a new block; provenance noted here. |
| **run a service's UNIT test (not just integration) when it gains a dependency** | **Novel, N=1** (the Task-3 `documentPlatformService.test.ts` regression, `aed41979`) | Below threshold → §5 carry-forward. |
| **two-seat per-task read-back ≠ full-suite gate** | **Novel, N=1** (structural; the two `test:full` findings) | Below threshold → §5 carry-forward. Worth naming because it bounds what the cadence can prove. |

**`codify-convention` was not invoked this arc:** the two strong candidates are
already codified; the two novel ones are N=1. Recording carry-forwards rather
than improvising a lower threshold is the discipline (per
`conventions/README.md` codification-threshold rule).

## Process observations (§4 — discipline graduations / adherence)

- **The existing conventions held — as a CATCH, not a PREVENT.** Both
  header-lags (codified) and test-isolation (codified) *fired* this arc and
  were caught — header-lags by per-task read-back, test-isolation by the
  full-suite gate. The conventions worked as safety nets. But adherence
  *lagged*: I violated the file-top-comment-staleness convention twice before
  read-back caught it, despite it being codified. Carry-forward observation:
  the convention is stated as a *review discipline*; an *edit-time* trigger
  (e.g., a path-scoped `.claude/rules` reminder at service files, or a
  closeout-checklist line) would shift it from catch to prevent.
- **`test:full` caught what per-task read-backs structurally could not.** The
  two test-fixes (`634ac050` parallel pollution; `aed41979` unit-suite
  membership) are the centerpiece process lesson. The two-seat per-task
  read-back verified each task's *source correctness* first-hand; it was never
  positioned to surface cross-test interaction (needs parallel readers) or a
  unit-suite-membership miss (needs the full suite). This is the precise
  boundary between "UNIT-PROVEN per task" and "PROVEN" — and the reason the
  full-suite gate exists before push. Banked as the §5 carry-forward.
- **Doc-sync kept pace per-task.** Every header-lag flagged at read-back was
  corrected in the next commit (the `fix(doc-sync)` commits), and the named
  Final-verification sweep was a confirmation pass, not a cleanup — the
  pattern that recurred was *caught and closed* each time.

## Three-condition push gate

- **Condition 1 — test-suite health: MET.** `pnpm test:full` green at HEAD
  (1792 passed / 11 skipped — the 11 are gated e2e harnesses, skipped by
  design); `pnpm agent:validate` green (26/26 floor + typecheck + URL check +
  intent-producers 0 ERRORs); `pnpm typecheck` clean. The two `test:full`
  findings were fixed (not waived) — green is genuine, not "acceptable
  baseline."
- **Condition 2 — doc-sync reconciled:** `db/types.ts` regenerated against the
  post-slice + post-reserve schema; no ledger-invariant changes (storage /
  service-layer arc — `invariants.md`/`control_matrix.md`/`ledger_truth_model.md`
  untouched and consistent); ADR-0013's 2026-06-07 amendment was *realized*,
  not changed (no new ADR needed, per the charter). Charter §4.A supersession
  recorded in the slice migration header. **Operator to confirm at the gate.**
- **Condition 3 — governance closeout:** this retrospective + the
  friction-journal "Charter B real-flow CLOSED" entry + `CURRENT_STATE` update
  are the closeout artifacts. No conventions earned graduation (see §3).

## Carry-forwards (T-class — adjacent, not absorbed)

1. **`provider_unavailable` exception-queue routing surface** — deferred-with-
   consumer to Phase-7 (decision #2). Lands with the job-runner + terminal
   states + the later-read consumers that actually exercise it. The
   `exception_reason` value is reserved; the enqueue coupling-wall design is
   the open piece.
2. **Live SharePoint Graph e2e** — the gated harness throws until implemented
   against a real tenant (runbook complete). The PROVEN-LIVE discharge.
3. **Codification candidate: unit-test-when-a-dependency-is-added** (N=1).
   Watch for N≥3; the Task-3 regression is the first fire.
4. **Codification candidate: two-seat read-back ≠ full-suite gate** (N=1,
   novel). The boundary the two `test:full` findings demonstrate.
5. **Orchestrator `failureClassification.ts` header residual** — its
   "immediate route to exception queue" lines overstate its emit-and-throw
   behavior (no enqueue). Pre-existing (Phase-7 chunk 7.1a), the unchanged
   (c) leg, NOT this arc's regression; left as a known minor residual (a live
   pre-existing instance of the header-lags pattern). One-liner annotation or
   leave — operator's call, non-blocking.

## Arc character

A spec-and-plan-heavy arc with a long two-seat read-back cadence: charter →
spec → plan, each ratified against disk before code, then seven
implementation tasks each read back first-hand. The discipline paid for
itself twice — finding #1's selection-seam reframe (a silent-divergence bug
caught at design grain) and decision #2's grounded minimal-routing scope. The
two `test:full` findings are the honest counterweight: per-task rigor is
necessary but not sufficient; the full-suite gate is where cross-test truth
lives. The arc closes exactly where it should — reachable, unit-proven, live
transfer honestly gated.
