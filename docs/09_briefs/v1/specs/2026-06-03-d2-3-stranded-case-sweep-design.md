# D2.3 Design — Stranded-Case Sweep (`sweepStrandedCases`)

**Status:** DESIGN — approved at the 2026-06-03 brainstorm read-back;
input to the D2.3 brief.
**Arc:** V1 Wave 6 (AP review build plan §5 — "D2.3 = the
parked-backlog sweep, its own brief, after D2.1").
**Grounding HEAD:** `83cd3f3d` (D1 + D2.1 banked; INV-WORKFLOW-002
registered).
**Approach ratified:** B — artifact-aware bucketing,
decision-machinery-only (A state-only and C direct-advance-everything
rejected; §3 records why).

---

## 1. Purpose & scope

`sweepStrandedCases` is the INV-WORKFLOW-002 eventual-consistency
backstop: it recovers document cases stranded in the automation
segment (`received` / `extracting` / `classified` / `matched`) by
routing them through the **existing D2.1 decision machinery**. The
sweep never asserts a disposition itself — every swept case ends with
a disposition the live machinery produced (`advanceCaseAutomation`
hand-off, `resolveCandidates` branches, `enqueueException` reasons),
or it is reported and left untouched.

Against the INV-WORKFLOW-002 leaf's two named residual classes
(`ledger_truth_model.md` §INV-WORKFLOW-002, post-T4 numbering):

- **Class 1 — pre-enforcement parked backlog (transitional):** the
  sweep is Class 1's realized retirement mechanism; retirement
  completes when the one-time backlog-clearing run executes (a named
  deliverable — §9). Shipping the code ships the recovery path;
  the backlog stays stranded until an operator runs it.
- **Class 2 — strandings (mid-chain crash orphan domain):** this
  sweep is the durable recovery path; the class itself persists (the
  post-hoc chain remains 3–5 separate RPC transactions).

Operator-run at v1; scheduled invocation is a named carry-forward
(§10) with the orchestrator method as the stable seam — a future
scheduler is a caller, not a refactor.

## 2. Grounded facts the design rests on

Each verified from disk at design time (SHA `83cd3f3d`):

1. **Stage-0 dedup excludes self.**
   `dedupByHash.ts:66` — `.neq('id', input.source_document_id)`;
   header: "within the same `org_id` (excluding self)". A
   same-document re-run does NOT self-short-circuit; the
   short-circuit only fires against a genuinely different doc sharing
   the hash. Re-run is therefore mechanically viable for stranded
   cases.
2. **`advanceCaseAutomation` is idempotent and ownership-scoped.**
   Owned edges exactly `{received→extracting, extracting→classified,
   matched→needs_review}`; no-op at/past target via `PIPELINE_ORDER`
   (`documentCaseService.ts:327`); REFUSES `classified→*` (Subsystem
   2's segment, single ownership by construction); each hop an
   audited RPC with `FOR UPDATE`.
3. **The pre-D2.1 backlog is candidate-bearing, decision-less.**
   Before D2.1 T3, `ingestDocument` called `completeCandidate` but
   never `resolveCandidates` (build plan §5 closure (C): wiring
   resolveCandidates was new at T3). Backlog docs were fully
   processed — OCR'd, classified, candidates persisted — with case
   state frozen at `received`.
4. **`document_relationship_candidates` has no UNIQUE constraint**
   (migration `20240149`: PK only). Re-running a candidate-bearing
   doc re-emits candidates → a clean N=1 match becomes a false N≥2
   ambiguity (v1: any N≥2 → manual review). This is why state alone
   is the wrong discriminator and candidates are the bucketing
   signal.
5. **Services may not import agent code.**
   `folder-structure.md:168-170` (ADR-0020 Appendix A); enforced by
   `architecture/agent-first-import-boundaries` at `'error'`
   (`eslint.config.mjs:119`). The reverse is permitted (agent →
   services). The sweep re-runs `ingestDocument` ⇒ placement is
   forced agent-side.
6. **`enqueue_exception_with_audit` is atomic.** One RPC = one
   transaction: INSERT queue entry + UPDATE case state
   (`classified|matched → needs_review`) + INSERT audit
   (`documentExceptionService.ts:65-67`). The crash class "exception
   open but state transition incomplete" cannot exist. The chunk-6
   "UNIQUE-INSERT before state-UPDATE" ordering is *within* the RPC
   (the 23505 fires before the state touch), not non-atomicity.
   §6 note: loop-safety does NOT depend on this fact — the anomaly
   bucket breaks the loop regardless; atomicity upgrades "rare
   anomaly" to "impossible."
7. **`resolveCandidates` branches (b)/(c) propagate
   `EXCEPTION_ALREADY_OPEN` unchanged** (no-wrap convention,
   `documentRouterService.ts:1641-1643`). Tolerance is the caller's
   job — the sweep's (§6).
8. **`document_cases` has no `updated_at`** — `created_at` only
   (migration `20240143:62-79`); `document_jobs.started_at` /
   `completed_at` are Phase-7-reserved nullables (state CHECK pins
   `'queued'`). Staleness re-grounds on `created_at` (§6, with the
   balance framing).
9. **`document_jobs` carries both FKs** (`source_document_id` +
   `document_case_id`, NOT NULL, `20240152:348-349`) — the
   case↔document join is a lookup-direction detail, not a missing
   capability.
10. **`manual_route` is not the sweep's reason — and no new reason is
    needed.** Ratified semantics (phase-2 chunk-6 brief line 79):
    catch-all for agent/user/test/UI-reclassification +
    bank/card-always-route + reserved-roles bundling — deliberate
    routing decisions, zero v1 emitters/readers. Under approach B the
    question DISSOLVES: every swept case flows through
    `resolveCandidates`, so it gets the real reason the live pipeline
    would assign (`unmatched_router_candidate`,
    `multi_candidate_ambiguity`). No borrowed semantics, no enum
    migration. If a genuinely-undecided sweep class ever emerges, a
    dedicated value is a named carry-forward — not built ahead of
    need.
11. **Tier-C runner precedent confirmed thin.**
    `scripts/tier-c-empirical-exercise.ts` (248 lines): arg parsing +
    env loading + a direct `ingestDocument()` call; no inlined logic.
    The service-method-plus-thin-runner seam claim is real.

## 3. Eligibility & bucketing

**Eligible:** `document_cases` in
`{received, extracting, classified, matched}` with `created_at` older
than the staleness threshold (default 30 minutes;
`--staleness-minutes` overrides). Optional `--org-id` filter; default
all orgs. Processing is sequential, oldest-first.

**Buckets, evaluated per case IN ORDER — the order is load-bearing:**

| # | Bucket | Test | Why this order |
|---|---|---|---|
| B1 | `matched`-stranding | `state = 'matched'` | **B1 must precede B2:** a matched case has a candidate (branch (a) set the head pointer), so it would also satisfy B2's test — but it must take the hand-off, not a re-resolve (`resolveCandidates` against a non-`classified` case dead-ends on the `WHERE state='classified'` guard). B1-first keeps an already-decided case from being re-adjudicated. |
| B2 | Candidate-bearing | ≥1 persisted `document_relationship_candidates` row for the case's source document | Candidates are the honest signal that OCR + classification happened. Covers the entire pre-D2.1 backlog (Class 1) and post-D2.1 crashes after emission. |
| B3-D | Dedup carve-out | Candidate-less AND `dedupByHash()` returns `shortCircuited: true` | Pre-check via the Stage-0 module itself — single source of dedup truth, cheap (two DB reads, pre-OCR), and it works for every candidate-less case because `original_content_hash` is set at ingestion, not OCR. Catching the dup BEFORE the re-run (rather than as a re-run outcome) prevents the forever-loop: re-run → Stage-0 short-circuit → still `received` → re-swept → … Sweep-terminal: reported, never re-run. Matches the leaf verbatim: "the D2.3 sweep classifies these, it does not route them." |
| B3 | Candidate-less, not a dup | Remainder | Pipeline work genuinely missing → full re-run. |
| B4 | Re-run failed | `ingestDocument` returned `pipeline_failed` | Reported with `failure_class`; stays re-eligible next run. |

**Rejected alternatives (recorded for the brief):**

- **A — state-only bucketing:** re-runs the candidate-bearing backlog
  into false ambiguity (fact 4) and direct-resolves
  crash-before-emission cases into false unmatched.
- **C — direct-advance everything + dedicated sweep
  exception_reason:** asserts `classified` for never-classified docs
  (dishonest state semantics), dumps candidate-less cases on
  reviewers with nothing to review, and requires the enum migration
  B makes unnecessary.

## 4. Recovery actions & guard inheritance

| Bucket | Action | Guard inheritance |
|---|---|---|
| B1 | `advanceCaseAutomation(→needs_review)` | Idempotent no-op at/past target; `FOR UPDATE`; owned edge |
| B2 | `advanceCaseAutomation(→classified)` (no-op when already there) → `resolveCandidates` | Honest advance — candidates prove the work happened. Resolution via real branches: N=1 → match + hand-off; N≥2 → `multi_candidate_ambiguity`; zero pending → `unmatched_router_candidate`. Branch-(a) RPC guard `WHERE state='classified'` blocks double-routing |
| B3-D | None — report `dedup_carveout` | Stage-0 semantics via the shared module |
| B3 | Full `ingestDocument()` re-run | No self-dedup (fact 1); idempotent advances absorb partial state; nothing to duplicate-emit |
| B4 | Report with `failure_class`; re-eligible | Per-case isolation |

**Named residual:** a mid-emission crash leaves a partial candidate
set, which lands in B2 and resolves on what survived. Worst case it
over-routes to review (N≥2) or matches on the surviving candidate;
never silent. The structural close is the UNIQUE constraint
(carry-forward 3).

## 5. Invocation surface & ctx attribution

- **Module:** `src/agent/orchestrator/maintenance/sweepStrandedCases.ts`
  — agent layer, forced by fact 5. New folder under
  `agent/orchestrator/` ⇒ the `apps/web/src/README.md`
  folder-placement guardrail is read at impl (must-confirm, §11).
  Exports `sweepStrandedCases(input, ctx: SystemActorServiceContext)`.
- **Attribution:** `system_actor: 'backlog_sweep'` — distinct from
  `'pipeline_orchestrator'`, so audit rows distinguish
  sweep-initiated transitions from live-pipeline ones; same Path-X
  `SYSTEM_ACTOR_USER_ID` service account (`actingUserId` writes a
  joinable identity, ADR-0007 Q78).
- **Trace:** each recovered case gets a fresh `trace_id` (pipeline
  convention — a trace scopes one flow); the report ties case →
  trace_id.
- **Runner:** `apps/web/scripts/sweep-stranded-cases.ts`, Tier-C
  shape (fact 11): args (`--org-id?`, `--staleness-minutes?`,
  `--execute`), env, one call. **Dry-run is the default** and runs
  the full bucketing including the read-only `dedupByHash` pre-check,
  so the operator previews exact buckets — and the B3 count, which IS
  the OCR/Claude spend — before `--execute`.
- **DI seam:** the module accepts an injectable ingest runner
  (default `ingestDocument`) — the testability seam for B3/B4 (§8).

## 6. Error handling & race posture

- **Per-case isolation.** Every case in its own try/catch; a failure
  records `{case, bucket, error}` in the report and the sweep moves
  on. The sweep itself only throws on setup failures (bad args, DB
  unreachable).
- **`EXCEPTION_ALREADY_OPEN` at B2 — loop-safe by construction, not
  by atomicity.** On catch: re-read case state. If `needs_review` →
  completed concurrently; count as recovered. If still `classified` →
  **anomaly bucket**: reported distinctly, NOT auto-repaired and NOT
  re-run. The sweep never silently repairs an invariant-violating
  row. Loop-safety holds regardless of whether
  `enqueue_exception_with_audit`'s atomicity (fact 6) is perfect —
  the anomaly bucket breaks the re-sweep loop either way; atomicity
  upgrades the anomaly from "rare" to "impossible."
- **Decision-record re-record residual (benign).** A crash between
  `record_router_decision` and `enqueueException` (sequential,
  `documentRouterService.ts:1616→1644`) leaves a recorded decision
  with no exception; the B2 re-resolve records a second
  decision-audit row before enqueueing clean. Duplicate audit, not a
  loop or a drop. Whether the `p_audit.idempotency_key` (line 1629)
  suppresses even the duplicate is a genuine defer (§11).
- **Race posture — the balance stated honestly.** `created_at`
  staleness is a **coarse primary filter**, not the precise defense:
  a live run doesn't bump `created_at`, so "stale = not in flight"
  rests on the pipeline's wall-clock bound (~30s OCR budget, minutes
  end-to-end), and the filter is blind to a Subsystem-3 re-dispatch
  of an old case (which looks stale but is in flight). **The
  inherited guards carry the precise race-defense weight** —
  idempotent advance, `FOR UPDATE`, `WHERE state='classified'`, the
  partial-UNIQUE on open exceptions — and they cover exactly that
  gap. Safe at v1; do not over-trust the threshold; `updated_at`
  (carry-forward 6) is the real upgrade.
- **Concurrency:** sequential oldest-first; one-sweep-at-a-time is
  operator discipline at v1 (pg advisory lock = carry-forward 4).

## 7. Reporting

The method returns a structured report (the runner prints it):
per-bucket counts + per-case rows `{document_case_id,
source_document_id, state_before, bucket, action_taken, outcome,
trace_id, error_code?}`. IDs only — no document content in output.
`log.info` per recovery action through the standard logger.

## 8. Testing

Integration suite (`tests/integration/`), seeding stranded shapes
directly:

- **B1:** `matched` case → sweep → `needs_review`; audit row
  attributed to the sweep actor (`backlog_sweep` +
  `SYSTEM_ACTOR_USER_ID`).
- **B2 variants:** `received`+candidates, N=1 → full chain to
  `needs_review` via match + hand-off; N≥2 →
  `multi_candidate_ambiguity`; zero *pending* candidates → branch (c)
  `unmatched_router_candidate`.
- **B3-D:** two docs same hash, second stranded candidate-less →
  reported `dedup_carveout`, zero writes, state unchanged.
- **B3/B4 via the DI seam:** stub the ingest runner to assert
  dispatch (B3) and `pipeline_failed` reporting + re-eligibility (B4)
  without OCR. A real-re-run e2e behind `RUN_MODAL_E2E` is optional,
  named.
- **Anomaly:** DB-seeded open exception + `classified` → anomaly
  bucket, no mutation.
- **Eligibility:** fresh case skipped (threshold); `needs_review`+
  states skipped; **dry-run asserts zero writes** (the load-bearing
  safety test).

## 9. Doc-sync at ship

In the same commit as the enforcing code (the registration
discipline):

- **INV-WORKFLOW-002 leaf** (`ledger_truth_model.md`): at the code
  commit, the Scope paragraph's "D2.3 sweep as the
  eventual-consistency backstop" and "the D2.3 sweep classifies
  these" (dedup carve-out) references flip from prospective to
  realized, and Class 1 is marked **retirement-mechanism-shipped** —
  NOT flat "retired": the sweep is operator-run, so at commit time
  the backlog cases are still stranded on disk, and the leaf may not
  assert a state that isn't true yet (the registration-honesty bar).
  Class 2 (strandings) persists with the sweep named as its recovery
  path. Post-T4 two-class numbering — NOT the pre-T4 (i)/(ii)/(iii)
  labels.
- **`invariants.md`** rollup + **`control_matrix.md`** evidence row
  updated, tests cited.
- **One-time backlog-clearing run (named deliverable, sequenced
  after the code commit):** operator executes the sweep (dry-run
  read-back, then `--execute`) against the live backlog; on
  completion, a follow-up doc-sync flips the Class 1 leaf wording to
  flat "retired," citing the run's report. D2.3 closes when both
  steps land.

## 10. Named carry-forwards

1. **Scheduled invocation** — seam ready; a scheduler is a caller.
2. **Terminal disposition for the dedup-carve-out class** — stays at
   `received` until the chunk-7.3 reuse-path wiring decides it.
3. **UNIQUE constraint on `document_relationship_candidates`** —
   structural re-run safety; the close for the partial-emission
   residual.
4. **pg advisory lock** for concurrent sweeps.
5. **Partial-candidate-set residual** (named in §4).
6. **`document_cases.updated_at`** + RPC bump — the real staleness
   upgrade if a future caller class breaks the `created_at`
   approximation.

## 11. Impl-time must-confirms (carried into the brief)

1. **`system_actor` switch grep (behavioral-safety, must-confirm):**
   verify nothing branches on `system_actor === 'pipeline_orchestrator'`
   (or any system_actor string) — introducing `'backlog_sweep'` must
   not silently change a path.
2. **`idempotency_key` dedupe check:** whether
   `record_router_decision`'s `p_audit.idempotency_key` suppresses
   the duplicate decision-audit row on B2 re-resolve.
3. **`apps/web/src/README.md` folder-placement guardrail** read
   before creating `agent/orchestrator/maintenance/`.
4. **Case↔document join direction** (fact 9): implement the reverse
   lookup off `document_jobs`; verify-from-disk at impl.
5. **Candidate "pending" semantics:** confirm the
   candidate-row status/filter `resolveCandidates` applies, so B2's
   "≥1 candidate" test matches what resolution will actually see.
6. **`system_actor` value registration (additive, ships with the
   sweep if constrained):** beyond the switch grep (#1), confirm
   whether `system_actor` is a constrained type — a DB CHECK on the
   audit path and/or a TS union/Zod enum. If it is, introducing
   `'backlog_sweep'` is an additive schema/type change that must
   ship WITH the sweep (Layer-1 CHECK broaden ⇒ Zod broaden
   discipline), or the first audit write rejects.
