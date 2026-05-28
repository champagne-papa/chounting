# Testing conventions

Test patterns, mocks, test-scope discipline, and infrastructure-vs-
value evaluation at chunk close.

See [`README.md`](./README.md) for the routing rule that determines
when a rule belongs here vs. another topical file.

The integration-test floor rules and dedicated-test-accounts pattern
live in the `integration-test-rules` skill at
`.claude/skills/integration-test-rules/` and are not duplicated here.

---

## Test-scope-pragmatic-reduction at chunk close

When chunk-close validation surfaces test-infrastructure friction
that exceeds marginal verification value (e.g., DOM environment
gaps for unit tests, browser-API synthesis non-trivialities for E2E
tests, fixture infrastructure not yet shipped), defer the test scope
to a dedicated test-infrastructure session as named-future-trigger.

**Trigger:** any chunk close where test-infra friction surfaces
during validation gate firing.

**Discipline rule.** At chunk-close validation surface, evaluate
test-infra-friction-vs-marginal-verification-value ratio. When
friction exceeds value, defer to dedicated session with named
future-trigger; do not block chunk close on test-infra friction that
yields marginal verification incremental.

**Why:** chunk-close gates exist to verify substrate + service
correctness; test-infra friction at chunk close diverts attention
from substrate verification + delays chunk ship for marginal value.

**Evidence basis (N=3 graduation across Phase 6.5):** chunk 1
(vitest DOM environment gap; React component+hook unit tests
deferred per A1-B disposition; commit `5a9492b`); chunk 2 (A1-B
inheritance; CanvasTabStrip DOM coverage routes through E2E specs +
screenshot gate; commit `c5d7e89`); chunk 3 (Playwright DataTransfer
synthesis non-trivial; E2E specs skipped per Test Deviation 3;
commit `29e2ba1`).

**Cross-references.**
- Phase 6 chunk 6.2b vitest jsdom-config gap for adjacent N=4
  evidence at Phase 6 grain.
- Phase 6.5 retrospective §3 Candidate #7.

---
**Origin:**
- First codified: Phase 6.5, 2026-05-17 (Phase 6.5 retrospective
  close)
- Evidence basis: N=3 graduation across Phase 6.5 chunks 1, 2, 3
  (commits `5a9492b`, `c5d7e89`, `29e2ba1`)
- Promoted from: Phase 6.5 retrospective §3 Candidate #7
- Cross-references: Phase 6.5 retrospective §3 Candidate #7;
  Phase 6 chunk 6.2b vitest jsdom-config gap (adjacent N=4 evidence
  at Phase 6 grain)

---

## Test-location canonical path discipline (N=5 reaffirmation)

Integration tests live at `apps/web/tests/integration/` —
the canonical centralized location. Co-located `__tests__/`
directories alongside source files are anti-pattern at this
codebase. The discipline fires when authoring new integration
tests or relocating existing tests; brief / directive citations
suggesting co-located placement are corrected to canonical
`tests/integration/` at substrate-receipt grain.

**Trigger:** any new integration test authoring or brief/directive
citation referencing test placement.

**Discipline rule.** Author integration tests under
`apps/web/tests/integration/` (centralized location). E2E tests
under `apps/web/tests/integration/e2e/` (per Phase 7 chunk 7.3b
new precedent). Unit tests under `apps/web/tests/unit/`. Brief /
directive citations specifying co-located `__tests__/` paths are
override-corrected to canonical locations at impl-grade.

**Why:** Centralized test location enables single-pass discovery
(grep / find / IDE navigation) of all test coverage; co-located
`__tests__/` directories produce blast-radius for full-suite-
verification scripts that need to enumerate test locations.
Centralized location also aligns with the integration-test-rules
skill's §3 dedicated-test-accounts pattern and §1 floor-test
enumeration.

**Evidence basis (N=5 cross-validation; Phase 7 chunks
7.1a + 7.1b + 7.2 + 7.3a + 7.3b):** Each Phase 7 chunk-impl
directive cited integration test placement; each chunk-impl
implementation placed tests at canonical `tests/integration/`.
Chunk 7.3b added new `tests/integration/e2e/` subdirectory as
first-instance precedent for e2e-class tests at canonical location.
Five consecutive chunks reaffirming the canonical path discipline
graduates to N=5 cross-validation evidence.

**How to apply.** At impl-grade, place integration tests at
`apps/web/tests/integration/<test-name>.test.ts` (flat) or
`apps/web/tests/integration/<class>/<test-name>.test.ts` (e2e
class, future per-class subdirectories at need). Brief/directive
citations to co-located `__tests__/` are corrected at impl-grade.

**Cross-references.**
- `.claude/skills/integration-test-rules/` §1 floor-test
  enumeration (canonical Category A floor-test paths at
  `tests/integration/`).
- Phase 7 chunks 7.1a + 7.1b + 7.2 + 7.3a + 7.3b commits
  f0fdecc + 4c481a9 + c401296 + 8499189 + ab0f7fe (N=5
  cross-validation evidence).
- Phase 7 retrospective at
  `docs/07_governance/retrospectives/phase-7-retrospective.md`
  §3 Candidate #8.

---
**Origin:**
- First codified: Phase 7, 2026-05-20 (Phase 7 retrospective
  close)
- Evidence basis: N=5 cross-validation across Phase 7 chunks
  7.1a + 7.1b + 7.2 + 7.3a + 7.3b
- Promoted from: Phase 7 retrospective §3 Candidate #8
- Cross-references: `.claude/skills/integration-test-rules/`;
  Phase 7 retrospective §3 Candidate #8

---

## Test-isolation discipline — substrate-deletability split and full-suite command pattern

The chounting test substrate splits along **substrate-deletability**.
Mutable tables (vendors, bills, chart_of_accounts, etc.) admit
`afterAll` DELETE cleanup at the test layer. Append-only spine
substrates reject DELETE at the database layer:
`journal_entries`/`journal_lines` per INV-LEDGER-001's
`trg_journal_entries_no_delete`; `document_relationship_candidates`
per RLS `no_delete` policy + `REVOKE DELETE FROM service_role`;
`source_documents` per `trg_source_documents_no_delete`. Service-role
does NOT bypass triggers in this constraint. afterAll DELETE
attempts on append-only spines are silently rejected at the
trigger/RLS layer.

This drives the test-authoring discipline class at
`.claude/skills/integration-test-rules/SKILL.md` §3 — §3.1 per-run
COA isolation (mutable; T-prefix codes); §3.2 JE/JL accumulation-
acceptance (append-only); §3.3 append-only spine-substrate
accumulation-acceptance (candidates + source_documents). The
common shape: cleanup happens at the session-boundary layer via
`pnpm db:reset:clean`, not at the test-boundary layer via afterAll
DELETE.

**Full-suite vs dev-iteration command pattern.** Two canonical
commands serve two different invocation shapes:

- **`pnpm test`** — the bare full vitest suite. Suitable for dev
  iteration (single-file or focused-path runs) and for CI
  environments that start with clean state by virtue of fresh
  containers. Fast cycle, no reset cost.
- **`pnpm test:full`** — `pnpm db:reset:clean && pnpm test`. The
  canonical push-readiness Condition-1 invocation per CLAUDE.md
  "What done means". Resets all substrate (append-only spines +
  storage buckets + mutable tables) before running the suite —
  structural enforcement of empty-state-at-session-start.

**Trigger:** any operator workflow invoking integration tests —
push-readiness Condition-1 evidence, full-suite sweeps, dev
iteration.

**Discipline rule.** Match command to invocation shape:

- Bare `pnpm test` (or `pnpm test:integration`, or path-narrowed
  variants like `pnpm test path/to/file.test.ts`) for dev iteration.
- `pnpm test:full` for push-readiness Condition-1 evidence capture
  and any empty-state-sensitive full-suite sweep.
- Manual `pnpm db:reset:clean` between dev iterations when
  accumulation surfaces as test-failure-firing within an iteration
  cycle.

**Why.** Integration test substrate accumulates state across runs
when tests write to append-only substrates or to mutable substrates
without afterAll cleanup. Accumulation surfaces as test-failure-
firing when substrate limits cross (PostgREST 1000-row truncation
at T8 closeout 2026-05-28; storage bucket "not empty" at
storageProviderIntegration). Structural enforcement of empty-state-
at-session-start via `pnpm db:reset:clean` resolves accumulation
symptoms across both substrate-deletability classes uniformly —
the diagnostic-driven simplification that produced this discipline.

**Evidence basis.** Umbrella test-isolation discipline arc HEAD-pass
audit surfaced: 2438 `document_relationship_candidates` rows
accumulated in ORG_HOLDING (drift from 1834 at T8 closeout); 79
storage objects in the `documents` bucket from ~90 minutes of test
activity; 75/197 integration test files without afterAll hooks.
HEAVY verification at the arc's narrow-A wiring commit `fc85c411`
(`pnpm test:full` end-to-end): 1547 passed / 10 skipped / 0 failed
— empirical validation that the storage test (failing per T8
Condition-1 deviation) passes post-reset without any storage-code
change.

**How to apply.**

- At dev-iteration time: bare `pnpm test [path]` or
  `pnpm test:integration [path]`.
- At push-readiness time: `pnpm test:full` (the Pre-push sanity
  sequence in CLAUDE.md names this as Condition-1 evidence).
- When accumulation surfaces during dev iteration as test failure:
  manual `pnpm db:reset:clean` between iterations.

**Cross-references.**

- `.claude/skills/integration-test-rules/SKILL.md` §3 — test-
  authoring-grain discipline for the substrate-deletability split
  (§3.1 / §3.2 / §3.3 subsections).
- CLAUDE.md "What done means" §1 — canonical push-readiness
  Condition-1 command (`pnpm test:full`).
- CLAUDE.md push-readiness three-condition gate §1 + pre-push
  sanity sequence — Condition-1 evidence shape.
- `docs/03_architecture/branching-and-feature-flag-strategy.md`
  "Push-readiness gate (three conditions)" — parallel codification.

---
**Origin:**
- First codified: Umbrella test-isolation discipline arc, 2026-05-28
- Evidence basis: HEAD-pass audit surfacing 2438 candidate rows + 79
  storage objects accumulated across 90-min test-activity window;
  T8 closeout's Condition-1 deviation traced to same root cause
  class; HEAVY verification at narrow-A wiring commit `fc85c411`
  (1547/0/10) validates structural enforcement.
- Promoted from: umbrella arc HEAD-pass audit findings + diagnostic-
  driven simplification (Option D → D + narrow-A → narrow-A handles
  storage uniformly with candidates).
- Cross-references: `.claude/skills/integration-test-rules/SKILL.md`
  §3 (test-authoring discipline); CLAUDE.md "What done means" §1 +
  push-readiness gate (workflow-canonical command reference);
  `docs/03_architecture/branching-and-feature-flag-strategy.md`
  (parallel codification of push-readiness gate).

**Evaluation basis:**

- **Load-bearing (prescriptive).** The discipline generates concrete
  operator action: choose the right command for the invocation shape.
  At push-readiness, run `pnpm test:full`; at dev iteration, bare
  `pnpm test`; when accumulation surfaces between iterations, manual
  `pnpm db:reset:clean`. Without the discipline named explicitly,
  operators may default to bare `pnpm test` for push-readiness and
  capture stale-state evidence (storage test failing, candidate
  accumulation symptoms), reproducing the T8 closeout's Condition-1
  deviation.

- **Generalizable.** The substrate-deletability axis + full-suite-
  vs-dev-iteration command pattern generalizes to any future
  substrate with structural append-only enforcement (RLS no_delete
  + REVOKE DELETE; immutability triggers) and any future canonical
  workflow-command introduction with state-sensitivity. The
  pattern's shape is the pairing of substrate-class recognition at
  the test-authoring grain (covered by SKILL.md §3) with command-
  selection discipline at the workflow grain (covered here).

- **Stable (substrate-mechanism-anchored at the workflow layer).**
  The command pattern is anchored in the substrate-deletability
  split, which is anchored in database-layer structural enforcement.
  The discipline is as stable as the substrate enforcement. Not
  exploratory — HEAVY verification at commit `fc85c411` empirically
  validates the structural enforcement holds at canonical-command
  introduction time.
