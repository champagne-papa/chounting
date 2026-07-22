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

---

## Fixture-offline eval-suite teeth (N=4)

An eval or validation suite that exercises code reachable from a live-AI
call or an RLS-bypassing persisted read must PROVE by construction that it
reaches neither — not merely avoid them by intent. Three mechanical teeth,
applied together, make a suite pass the proof:

- **Mock the AI + admin clients to throw.** `vi.mock` the live-AI entrypoint
  (`callClaude`) and the RLS-bypassing client (`@/db/adminClient`) so any call
  throws. They are typically already in the import graph (the extractor /
  classifier modules import them at top level), so a suite that passes with
  both mocked-to-throw has demonstrably called neither.
- **Assert sync-return on the function under test.** A live-AI path is
  `async`; the no-AI path is synchronous. `expect((r as unknown) instanceof
  Promise).toBe(false)` structurally proves the deterministic path was taken.
- **Keep the import graph pure where it can be.** Import only the pure function
  / schema under test, not the orchestrator / AI module — then the no-AI /
  no-persisted-read property holds by the graph itself, with the mocks as
  belt-guards against a future edit wiring the heavy module in.

Together these convert "the suite is fixture-offline" from an assertion about
intent into a tested property: the suite cannot silently regress to firing live
AI (paid, non-deterministic) or an RLS-bypassing read (the Wave-2 IDOR class)
without a test failing. This is the test-side enforcement of the
cautionary-tale read-scoping discipline.

---
**Origin:**
- First codified: V1 Wave 5 (AP eval harness), 2026-06-03
- Evidence basis: N=4 (observation-grain across the four Wave-5 eval
  deliverables), commits `c431aa24` (D1 extraction accuracy), `849439c4`
  (D2 confidence-to-policy), `041ac343` (D3 unsafe-output), `7535901b`
  (D4 input-contamination).
- Promoted from: Wave-5 D1–D4 eval-suite construction (see
  `docs/07_governance/retrospectives/v1-wave-5-retrospective.md` §3).
- Cross-references: the Wave-2 cautionary-tale read-scoping discipline (IDOR);
  the Wave-5 build plan §3 (I/O posture) + §5 (IDOR posture) at
  `docs/09_briefs/v1/plans/2026-06-02-wave-5-ap-eval-harness-build-plan.md`.

**Evaluation basis:**

- **Load-bearing (prescriptive).** The convention prescribes a concrete
  three-tooth construction at eval-suite authoring time and grounds the
  read-back claim "no live-AI / no persisted-read reachable" in a tested
  property rather than reviewer inspection. Across D1–D4 the teeth were exactly
  what the artifact read-back verified for the no-AI / no-IDOR property each
  time — the mechanism, not the intent, cleared the gate.

- **Generalizable.** Fired across four structurally-distinct eval surfaces
  (extraction accuracy, confidence→policy, output-validation, input-
  contamination) — different code under test, the same teeth. The general shape
  (prove-absence-by-mock-to-throw + a sync/async discriminant) applies to any
  test that must demonstrate it did not traverse an expensive or unsafe
  dependency, not only AI / `adminClient`.

- **Stable.** The construction settled at D1 and applied unchanged through D4
  (the `as unknown` cast for non-object returns was the only mechanical
  wrinkle); no re-litigation across the four fires. Not exploratory — the full
  `test:full` sweep (1632/0/10) at the Wave-5 close validates the suites hold.

## Additive-named-export-for-eval (N=3)

When an eval suite needs to exercise shipped pure logic — a Tier-A
heuristic, a governed constant map, a preview/rebuild composer — expose
that logic as an **additive, behaviour-preserving named export whose name
mirrors the shipped entry point**, rather than refactoring the shipped
call graph or duplicating the logic into the test tree. The export is
re-export / map-only grain: zero behaviour change at the shipped call
sites, provable by the import graph (the shipped entry point's body is
untouched; the new name points at the same object or a pure extraction
of it). The eval suite imports the named export directly and runs it
fixture-offline under the teeth pattern above (§Fixture-offline
eval-suite teeth — the consuming sibling: the export is *what* the suite
imports; the teeth are *how* the suite proves the import stayed pure).

Why not the alternatives: refactoring the shipped call graph for
testability churns reviewed code for zero product benefit and invalidates
read-back claims about untouched call sites; duplicating logic into the
test tree forks the source of truth and silently diverges. The additive
named export is the smallest move that gives the eval suite a stable,
greppable handle on exactly the shipped logic.

---
**Origin:**
- First codified: V1 Wave 6, 2026-06-06 (Wave 6 retrospective close)
- Evidence basis: observation-grain N=3 — Wave-5 D1 `c431aa24`
  (`…TierA` extractor exports mirroring `evaluateTierA`), Wave-5 D2
  `849439c4` (`CONFIDENCE_THRESHOLDS` map-only export), Wave-6 D3 T5
  `7117cf6f` (`buildReviewPreview` for the review-rebuild eval suite)
- Promoted from: friction-journal Wave-5 N=2 bank (2026-06-03) + Wave-6
  D3 close report §5 carry-forward #4 (the third fire); count trail
  reconciled at Wave-6 retrospective §3 (the journal's N=2 predates D3's
  third fire — no contradiction)
- Cross-references: §Fixture-offline eval-suite teeth (the consuming
  pattern); `v1-wave-5-retrospective.md` §3; Wave-6 D3 close report §5

**Evaluation basis:**

- **Load-bearing (prescriptive).** Generates a concrete authoring move at
  every eval-suite onset: re-expose additively, don't refactor and don't
  fork. Across the three fires it is what let each suite land with the
  shipped call graph byte-untouched — the property the per-task read-backs
  verified each time.
- **Generalizable.** Three structurally-distinct logic classes across two
  waves — a heuristic function, a governed constant, a rebuild composer —
  same move each time. The shape applies to any shipped pure logic an
  offline suite needs a handle on, independent of the AP domain.
- **Stable.** The pattern applied unchanged across all three fires; the
  third (D3 T5) was a routine application with no variation or
  re-litigation. Not exploratory.

## Tier-A-sufficient live-pipeline fixtures (N=4)

The complement of §Fixture-offline eval-suite teeth. Where an EVAL suite proves it
reaches no live-AI call by mocking `callClaude` to THROW, a live-pipeline INTEGRATION
test — one that drives the real ingestion pipeline (`ingestDocument`) through Stage 3
(classify) and Stage 4 (extract) and beyond — needs the AI call *reachable but not
taken*: the real classifier and extractor run, and the OCR fixture must carry enough
content that the free/deterministic Tier-A path wins. It reaches Tier A by CONSTRUCTION
(content sufficiency), not by mocking the AI unreachable — mocking `callClaude` here
would break or hollow out the very pipeline the test exercises.

Two gates the fixture must satisfy, both grounded in the pipeline's own trigger logic:

- **Stage-4 extraction sufficiency.** `vendorInvoiceExtractor`'s `tierASufficient`
  falls to the paid Tier-C AI fallback unless Tier A extracts amount AND
  `vendor_invoice_number` AND `accounting_date`. The fixture carries all three as
  labeled lines (`Invoice #<n>` / `Total: $x` / `Date: yyyy-mm-dd`) so extraction stays
  Tier-A.
- **Stage-2.5 `looksMultiInvoice` control.** The multi-invoice segmentation invokes a
  paid AI multi-extract when ≥2 distinct 6+-char letter-AND-digit tokens appear. The
  fixture must not trip it unintentionally: a pure-digit invoice number (`Invoice 12345`)
  and a word-only `Vendor:` name do not count as tokens; a labeled alphanumeric like
  `INV-1001A` would. (This is why a statement fixture listing a bare `Invoice 12345`
  stays single-path while still extracting a number.)

Verify per test: `grep -c "callClaude: API call complete"` on the run output is `0`. A
pipeline test that silently falls to a paid tier is both non-deterministic and a real
API charge — the 3-`callClaude` catch on the statement handler's first fixture run is
the canonical miss this discipline prevents.

**Fixture fidelity corollary.** Where the same test needs a seeded relationship the
pipeline reads (a `source_document_links` primary_invoice link, an α `extracted_invoices`
row), seed it via the real write-path RPC (`create_source_document_link_with_audit` /
`reverse_source_document_link_with_audit`), never a raw insert — so the test exercises
the exact `(entity, role, status)` shape the pipeline queries, at production fidelity.

---
**Origin:**
- First codified: Board #4 Fork C arc-close, 2026-07-22
- Evidence basis: observation-grain N=4 — `d687243f` (multiInvoicePipelineWiring T2c,
  2026-07-11), `612b05a9` (semanticDuplicatePipelineWiring, Fork C #1, 2026-07-20),
  `f53f67cf` (bankDetailChangePipelineWiring, Fork C #2, 2026-07-21), `1dc8c62b`
  (statementNotInvoicePipelineWiring, Fork C #3, 2026-07-21)
- Promoted from: friction-journal 2026-07-21 board #4 Fork C tranche-3 entry (banked
  graduate-ready; authoring deferred to arc-close, triggered by the operator 2026-07-22)
- Cross-references: §Fixture-offline eval-suite teeth (the complementary sibling —
  mock-to-throw for eval suites vs. content-sufficiency for pipeline integration tests);
  §Additive-named-export-for-eval

**Evaluation basis:**

- **Load-bearing (prescriptive).** Generates a concrete fixture-authoring move at every
  live-pipeline integration-test onset: carry the Tier-A-sufficient field triple and
  keep the multi-invoice token count controlled. Without it named, a pipeline test
  silently makes paid, non-deterministic Tier-C calls — the exact 3-`callClaude` miss
  that surfaced on the statement fixture's first run and was caught only by the
  grep-for-`callClaude` check.

- **Generalizable.** Fired across four structurally-distinct pipeline branches
  (multi-invoice segmentation, semantic-dup, bank-detail, statement) over two arcs and
  three calendar days — different handler, same fixture-construction move. The shape
  (engineer input so the real cheap/deterministic path wins, for a test that must run
  the real pipeline end-to-end) generalizes to any pipeline with a tiered cheap-path /
  expensive-path fallback keyed on input content, not only the AP OCR domain.

- **Stable.** The construction was practiced from the first fire (T2c) and named
  explicitly by the fourth (statement, where the bare-`Invoice 12345` token choice was
  deliberate against both gates); the arc-close fix wave reaffirmed the fidelity
  corollary. No re-litigation across the four fires. Not exploratory.
