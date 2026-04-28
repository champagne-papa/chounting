# Development Workflow

This document captures the operational discipline accrued across
Sessions 15-22 (S15-S22) of the chounting project. It is written
for three audiences: the returning operator (philc, after time
away or onboarding a collaborator), a future synthesis Claude
(picking up Phase 2 mid-arc in `claude.ai`), and a future WSL
Claude (this role, opening a fresh session against this project).

This document captures patterns. Canonical conventions remain in
[`conventions.md`](./conventions.md); ADRs remain in
[`07_governance/adr/`](../07_governance/adr/). DEV_WORKFLOW.md is
intentionally less prescriptive than `conventions.md` — the
patterns described here are operational tendencies, not codified
rules. When a pattern matures (≥3 fires of the same shape), it
graduates to `conventions.md` per the Documentation Routing
convention's codification thresholds.

This document is currently calibrated for the solo-operator
development model in which a single operator (philc) coordinates
multiple Claude roles (WSL Claude as execution partner, synthesis
Claude in `claude.ai` for cross-checks). When the project grows
to a multi-contributor team, several patterns will need
refinement — tiering of discipline by work-type, bounded
autonomy thresholds, friction-journal evolution toward
structured tagged issues. Those refinements are out-of-scope for
v1 and will surface in a v2 revision when team-scale concerns
become current.

The standing rule that backs most of what follows is the **halt-
and-surface default**: do not take destructive or high-stakes
actions (paid-API spend, schema changes, branch operations,
governance commits) without explicit operator authorization, and
when uncertain about anything not covered by this document, the
skills in `.claude/skills/`, or the canonical docs, halt and
flag rather than guess. The patterns below describe the shape
that discipline takes when it fires.

## How to use this document

The patterns in this document apply to different kinds of work
with different intensities. Use this triage:

- **Routine code changes** (typecheck-clean refactors, tests
  on existing code, single-line fixes): apply Convention #8
  sub-shape #1 (existence-level grep verification) for any
  cited symbols. Y2 commit shape not required. Halt-and-
  surface default applies if anything unexpected surfaces.
- **Brief-shaped product work** (new feature, new module, new
  schema): apply §1 (brief-as-its-own-session), §2 (all four
  Convention #8 sub-shapes at brief-write time), §4 (Y2
  commit shape), §8 (D1 plan-time decision batching). Multi-
  round review (§5) optional based on blast radius.
- **Paid-API or cost-bearing work**: in addition to the
  brief-shaped patterns, apply §3 (dry-run-with-real-API
  discipline). Spend ceilings stated at brief-write time;
  halt conditions named explicitly.
- **Architectural / irreversible decisions** (schema
  migrations, API contract changes, security boundary
  changes): apply all of the above plus §5 (multi-round
  review). Rollback discipline (named in §10) covers the
  revert paths if the decision needs to be reverted.
- **Governance or documentation work**: apply the
  Documentation Routing convention (in `conventions.md`) for
  routing; apply §1 if the work is brief-shaped. Y2 commit
  shape variant (§4 S21 family) applies if the work splits
  into product-decision + brief-creation.

This document fulfills the "Read-path design" deferral named in
the Documentation Routing convention's "Known limitations"
section.

## 1. Brief-creation as its own session

Brief-creation runs under a session lock distinct from the
session that executes the brief. Across S15-S22 this fired N=7:
`f90753b` (S15 brief), `6e76d89` (S16 brief), `b756436` (S17
brief), `6467caa` (S18 brief), `09b9e78` (S19 brief), `d08f6a3`
(S20 brief), and `3fc349d` (the brief for S22, landed as S21
Commit 2).

Why the pattern earns its place: brief-write authoring
concentrates verification discipline (Convention #8 Spec-to-
Implementation Verification) on prose that the executing session
will then operate against. Bundling brief-write into the
executing session dilutes both — verification gets squeezed by
execution pressure, and execution gets distracted by re-deriving
plan-time decisions. Splitting them keeps each session's
context-window dedicated to one mode.

The lock-acquisition sub-pattern is at N=2 in the friction-
journal at the time of writing (an unresolved `[ROUTE?]` entry
captures the question of whether documentation-only sessions
should be required to acquire a lock at all); the brief-as-its-
own-session pattern itself is robustly established.
Codification-candidate status: not yet — the pattern fires
cleanly under operator-driven session orchestration without
needing rule-enforcement.

## 2. Convention #8 plan-time verification — four sub-shapes

The most load-bearing discipline of the S15-S22 arc.
**Convention #8 (Spec-to-Implementation Verification)** in
`conventions.md` catches "narratively correct, contractually
wrong" drift between cited source material and the brief or
plan being authored. Across S20-S22, four distinct sub-shapes
of the convention surfaced. Canonical reference for the N=4
framing is the body of commit `cceb725` (S22 Commit 2).

1. **Existence-level (G2).** Brief grep recipes used literal
   backticks (`` ` ``) which false-negatived against
   TypeScript template-literal escaped backticks (`` \` ``) in
   source. Distinctive-prose patterns resolve cleanly.
   Captured as the G2 entry in `friction-journal.md`; S20
   origin in commit `f362f0e`.

2. **Behavior-level binary (A2).** S20 Task 4 Option iii.b
   attempted `process.stdout.write` interception to capture
   paid-API usage; failed against the project's pino logger
   (SonicBoom direct fd-1 writes bypass monkey-patching).
   Switched to SDK-wrapper substitution via existing test-only
   `__setClientForTests` injection. Captured as the A2 entry
   in `friction-journal.md`; S20 origin in `f362f0e`.

3. **Assumption-vs-implementation (classifier-strictness-
   gap).** S20 brief's hypothesis-discrimination model assumed
   shape 13 emits `card_no_tentative`; §4a prompt-surgery
   legitimately routes the gross-vs-net ambiguity to
   `card_tentative`. Brief-authoring miss, not surgery or
   classifier-mechanic miss. Captured as the classifier-
   strictness-gap entry in `friction-journal.md`; S20 origin
   in `f362f0e`.

4. **Quantitative-behavior (S22 cost projection).** S22 brief
   verified the caching mechanism's existence (cache_control
   would register, cache_read tokens would populate) but did
   not verify the per-call uncached delta growth pattern. S20
   measurement (~1.5K uncached/call expected) was 2× lower
   than actual (~3.1K uncached/call). Cost projection -58%;
   actual -32%. Captured as the S22 caching NOTE entry in
   `friction-journal.md`; canonical framing in commit body of
   `cceb725`.

Each sub-shape is a distinct verification move. Existence-
level: grep for the symbol or string. Behavior-level binary:
attempt the operation in a contained probe before depending on
it. Assumption-vs-implementation: read the implementation
surface the brief is reasoning about, not the brief's mental
model of it. Quantitative-behavior: cite the source data the
projection rests on, and re-verify the projection's intermediate
arithmetic, not just the bounding cases.

Codification candidate status: parked; lands as a Phase 2
`obligations.md` candidate or future Convention #8 amendment per
N=4 evidence. The convention's existing prose (six bullets:
numeric / literal / list / structural / identity / temporal)
covers the existence-level cases cleanly; the behavior-level
extension is the codification work that has not yet shipped.

## 3. Dry-run-with-real-API discipline for paid harnesses

Paid-API harnesses run a dry-run shape against the real API
before the full sweep is authorized. S20's harness (`31166fb`)
shipped with `--first-shape-only`: a single shape against the
real API to validate wiring (env-file resolution, capture
proxy, classification logic, run-record writer). The dry-run
cost counts toward the cumulative ceiling, but its purpose is
mechanism-validation rather than evidence-gathering. S22's
caching enablement re-fired the dry-run after implementation
(`cceb725` Task 7) to confirm `cache_read_tokens > 0` and the
cost drop materialized — a re-fire-after-implementation pattern
distinct from the initial dry-run, used to validate the change
behaves as the brief projected.

Why the pattern earns its place: paid-API harnesses fail in
several ways that don't surface until invocation (wrong
environment variables, missing SDK-feature support, broken
capture wrappers, miscounted ceilings). A dry-run shape catches
those mechanism failures before they accumulate cost across a
9-shape × 3-run sweep. The cost of the dry-run is small
relative to the cost of discovering a mechanism failure halfway
through a paid sweep.

Run records persist out-of-tree at `$HOME/chounting-logs/`
(e.g., `oi3-m1-run-20260428T044651Z.json`,
`oi3-m1-cached-run-20260428T061604Z.json`). Commit bodies cite
the path and the run is preserved for Phase 2 reference, but
the artifact itself is not version-controlled — paid-API
responses can carry sensitive data and would clutter the repo
even when they don't. The convention is: commit body cites the
path; the artifact lives outside the tree.

## 4. Y2 commit shape and the S21 variant family

Workstream sessions split into two commits: **Commit 1 = the
product change** (code or product-decision artifact); **Commit
2 = governance attribution** (validation evidence, run record,
friction-journal entry). The split preserves audit-chain
narrative — a reviewer can read the product change and the
governance record as two readable units. Commit ordering is
load-bearing — the substantive change lands first, attribution
second; reversed ordering reads as a follow-up rather than a
primary change.

Canonical pure form, both observed in the S20-S22 arc:

- **S20.** `31166fb` (feat — paid-API harness) → `f362f0e`
  (docs(governance) — run record + Convention #8 N=3 fire).
- **S22.** `856dcc7` (feat(orchestrator) — caching enablement)
  → `cceb725` (docs(governance) — H1 confirmed, N=4 fire).

**S21 variant.** Both commits are docs, but the split shape is
preserved:

- `78ebaed` (docs(governance) — Class 2 fix-stack scope
  decision) → `3fc349d` (docs(briefs) — S22 brief).

S21 demonstrates the variant family: a session whose "product"
is a structural decision rather than code can still split into
decision-in-Commit-1 / brief-in-Commit-2 cleanly. The canonical
form is not "code → docs"; it is "the substantive change → the
attribution that frames how to consume it." Document the variant
family, not the assumed pure form.

Why the pattern earns its place: bundling product change and
governance attribution into a single commit obscures
reviewability and complicates blame chains; future readers
trying to understand why a change was made have to read commit
bodies that mix mechanics with motivation. The split scales
better.

## 5. Multi-round review for high-stakes governance

Three-role triangulation (operator + WSL Claude + synthesis
Claude in `claude.ai`) fires when a structural decision's
downstream blast radius is large. Class 2 fix-stack scope
decision (`78ebaed`) is the canonical example: synthesis Claude
arrived at PARTIAL COLLAPSE independently in `claude.ai`; WSL
Claude's fresh-session read of canonical sources arrived at the
same verdict; the operator confirmed concurrence before the
commit landed. Commit body cites the independent arrival
explicitly.

When the pattern fires: Phase-2 architectural decisions, scope-
boundary judgments, governance-document additions whose
implications cross multiple workstreams. When it does not fire:
small-scope mechanical commits (typecheck-clean refactors,
single-line fixes, friction-journal entry appends, harness-
parameter tweaks). The cost of triangulation is real (three
sessions of context-window) and is reserved for cases where the
cost of reverting a wrong call is comparable.

Codification-candidate status: not yet — the pattern fires
cleanly under operator-driven session orchestration; the
discipline is "operator decides when to escalate," not "WSL
auto-escalates." A codified rule would be premature.

## 6. System-vs-product cadence

Ship product work between governance commits where possible.
The S20 → S21 → S22 cadence is the canonical example: S20
closed governance (M1 paid-validation run record + Convention
#8 N=3 + obligations.md update); S21 opened with governance
(Class 2 scope decision) and continued under the same lock to
ship the S22 brief; S22 shipped product (caching) and closed
with governance (validation evidence + N=4 fire). Each session
has a recognizable "what shipped vs what governance recorded"
attribution.

Why the pattern earns its place: bundling product + governance
in a single commit obscures attribution and complicates review
when the work needs to be revisited or partially reverted. The
alternation lets a future reader skim commit subjects and
identify the audit chain.

The cadence is not a forcing function — sessions whose entire
scope is governance (like the S15 Documentation Routing
codification, `5b02474`) or whose entire scope is product (like
the S22 caching implementation, `856dcc7`) ship as single-mode
commits. The pattern is "alternate when the work alternates,"
not "always alternate."

## 7. N=2 split-trigger as decision prompt, not forcing function

The Documentation Routing convention specifies three thresholds
in `conventions.md` (see "Codification thresholds"):

- **N=2** — split-trigger threshold (sub-types graduate to
  their own conventions on second instance).
- **N=3** — codification threshold (friction-journal pattern
  → `conventions.md` entry).
- **N=5** — meta-shape review threshold (re-evaluate when
  sub-type list reaches five).

S20's five `[ROUTE?]` entries (G2 grep-recipe, L3 env-file
flag, A2 SDK-wrapper substitution, cost-overshoot, classifier-
strictness-gap) all persist at HEAD in the friction-journal;
none have been formally codified into `conventions.md`. Of the
five, four contributed to the Convention #8 N=4 codification-
candidate evidence per `cceb725` commit body (G2 = sub-shape
#1, A2 = sub-shape #2, classifier-strictness-gap = sub-shape
#3, cost-overshoot = supporting evidence for sub-shape #4).
Only L3 (env-file flag for `tsx` invocations) remains a
distinct refinement candidate with its own potential
codification path. The N=2 split-trigger threshold prompted
decisions ("does this sub-pattern warrant its own convention
yet?") but did not force codification — N=4 is where the
codification work consolidates, awaiting the eventual
convention amendment.

Why the pattern earns its place: codifying at N=2 risks
premature codification (the second instance often shares
mechanism with the first, not the eventual stable form);
codifying at N=3+ allows the pattern to mature and the
sub-shape boundaries to clarify. The thresholds are decision
prompts the author runs against the friction-journal; they are
not enforced by tooling.

A related discipline supports the threshold pattern:
**friction-journal entry format**. Entries follow the 10-second
rule (one date + category + one-line description + optional
2-3 line elaboration; entries longer than ~10 lines are signal
that content belongs elsewhere — see "Write-time tripwires" in
`conventions.md`). Tag selection is binary: NOTE for resolved
observations carrying forward as named patterns; `[ROUTE?]` for
observations whose canonical destination is unclear at write-
time, resolved at session close. New entries append after
existing entries (the journal is append-only). Numerical
anchors and commit SHAs cited in entries must be grep-able. The
format constraints exist because the journal is the substrate
the codification thresholds run against; an unreadable journal
can't be re-scanned at N=3.

## 8. Plan-time decisions consolidated at a single approval gate

S20 Task 3's plan surface is the canonical example of D1 (the
Decision-1 plan-approval gate as named in operator session
prompts): cumulative ceiling, per-call ceiling, run-record
write-shape (skeleton-before-invocation; finalize-after),
output-classification taxonomy (six categories), halt-resolution
policy, and the D3 shape-filtering flag — all surfaced together
for single operator approval. S22 Task 3 followed the same shape
(cache breakpoint placement, system block flattening, compat-
shim strategy for the test consumer, structural-dependency
comments at code sites — batched into one approval gate).

Why the pattern earns its place: piecemeal decision-by-decision
approval invites iteration thrash (each round shifts the
context the next decision must reckon with) and degrades the
context window faster than batched approval. Surfacing the
decision space as a single coherent block lets the operator
review the trade-offs against each other rather than serially.

The pattern also serves a halt-discipline purpose: a single
approval gate is one place to halt for operator review; multiple
small gates are five places where the executor might be tempted
to proceed without explicit authorization on any one of them.

## 9. Tool-surface verification doctrine

WSL Claude verifies its own capabilities and tool surface before
claiming them, rather than paraphrasing from training data. The
discipline is broader than Convention #8's behavior-level
sub-shape: that catches "brief said X about codebase, codebase
says Y"; this catches "Claude assumed it has capability X
without verifying its tool surface."

Several S20-S22 instances:

- **A2 SDK-wrapper substitution** (captured as the A2 entry in
  `friction-journal.md`; S20 origin `f362f0e`). Option iii.b
  stdout-write interception was the brief's planned capture
  mechanism; failure mode (pino's SonicBoom direct fd-1 bypass
  of `process.stdout.write`) was caught at execution by
  attempting the operation, not by pre-execution research.
  Resolution moved to SDK-wrapper via existing
  `__setClientForTests` test-only export.

- **Convention #8 sub-shape #2** names this tool-surface
  failure mode (N=4 codification candidate).

The standing project rule for WSL Claude is named in operator
session prompts as the **verify-directly doctrine**: read files
before making claims; do not paraphrase from training data; the
chounting project is mounted via standard tools, and tool
behavior is verified by attempting the operation rather than
assumed from documentation. The doctrine pre-dates the S15-S22
arc but has tightened across it, with each tool-surface
false-negative case adding to the codification surface that
Convention #8's N=4 evidence consolidates.

Why the pattern earns its place: training-data-derived
assumptions about tool surfaces drift fast (SDK API changes,
logging-library internals, environment-variable propagation
quirks). Gate-time verification is cheap; the cost of
proceeding on an incorrect tool-surface assumption is the cost
of a failed paid-API run or a destructive command run against
the wrong target.

Codification-candidate status: folds into Convention #8
behavior-level extension (N=4 codification candidate). The
verify-directly doctrine itself remains a project-level
operational rule; it is named in session prompts and applied
during execution but does not need its own `conventions.md`
entry because Convention #8's behavior-level extension covers
the codifiable surface.

## 10. Failure and rollback discipline

Forward-progress patterns dominate this document. The S15-S22
arc also exercised halt-and-recover cycles that warrant
explicit naming.

### Halt classes

Three classes of halt have fired (or are structurally possible)
across the arc:

- **Plan-time halts.** Convention #8 fire at brief-write or
  plan-approval time (G2 grep recipes false-negative; A2 pino
  destination assumption; classifier-strictness-gap on shape
  13 expected outcome). Recovery: revise the brief or plan
  with verified facts, surface as friction-journal entry,
  re-approve. Forward progress resumes from the corrected
  plan; no commit reverts needed.
- **Execution-time halts.** Paid-API per-call or cumulative
  ceiling fires (S20 halt at shape 13 run 2: $0.163 > $0.15
  per-call ceiling). Recovery: surface evidence captured so
  far, classify as PARTIAL closure per Meta A (PARTIAL
  Closure State-Decomposition convention in `conventions.md`),
  document untried scope in friction-journal entry. No commit
  reverts; the captured evidence stays in the run record.
- **Post-commit halts.** Post-commit halts have not fired in
  S15-S22; the discipline below is defensive scaffolding for
  the case structurally possible but unobserved (e.g.,
  caching enablement at S22 might have degraded production
  model behavior under some workload not exercised in shape
  12 dry-run).

### Rollback paths

- **Plan-time halts:** no rollback needed — the brief or plan
  is revised before commit.
- **Execution-time halts:** no rollback needed — the captured
  evidence is the deliverable; PARTIAL closure framing per
  Meta A makes the partialness durable. The S20 PARTIAL
  closure (`f362f0e` body) is the canonical example: shapes
  15+20 untried, evidence on shapes 12+13 captured cleanly,
  Phase 2 follow-on queue named explicitly.
- **Post-commit halts:** `git revert` the offending commit;
  open a follow-on session to re-implement with the new
  learning. The Convention #8 fire on the original commit
  becomes the codification candidate for the re-
  implementation. The revert commit body cites the discovery
  context.

### When to halt vs proceed

The halt-and-surface default named in the preamble applies. The
decision is not "halt vs proceed forever"; it is "halt to the
next gate." Common gates: brief approval, plan approval, commit
review, paid-API authorization, post-commit verification.
Halting to a gate preserves operator agency on whether to
proceed.

**Bounded autonomy.** When the work is small-scope, low-risk,
reversible (typecheck-clean refactors, friction-journal
appends, comment-only edits), proceed without explicit
authorization. The bounded-autonomy zone is where the cost of
halting is comparable to the cost of the work itself. Outside
that zone, halt to the next gate. The operator may expand or
contract the bounded-autonomy zone over time as trust
calibration evolves.
