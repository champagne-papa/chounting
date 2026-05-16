# CLAUDE.md — The Bridge

@AGENTS.md

This file carries the **standing rules** loaded every session.
**Root explains, docs justify, skills specialize, scripts execute.**
Long-form reasoning lives in `docs/02_specs/`; ADRs in
`docs/07_governance/adr/`. `docs/INDEX.md` maps the full tree.
When a rule is unclear or a situation is not covered, stop and
flag it in `docs/02_specs/open_questions.md` — do not guess.

## Navigation — tier-1 always-relevant

- **`docs/02_specs/ledger_truth_model.md`** — the 20 invariants.
  Full leaves, Phase 2 evolution notes, interactions. Tiebreaker
  for ledger legality.
- **`docs/02_specs/agent_autonomy_model.md`** — the agent
  governance layer: Agent Ladder (three rungs), limit model (four
  dimensions), policy decision tree.
- **`docs/09_briefs/CURRENT_STATE.md`** — where the project is
  right now.
- **`docs/07_governance/friction-journal.md`** — the war diary.
- **`docs/INDEX.md`** — one-line-per-file map of everything else
  (ADRs, data model, glossary, phase simplifications,
  architecture, engineering, briefs).

## Project rules and vocabulary

Canonical sources for project-wide rules across concerns
(repo shape, worktrees, delivery, vocabulary):

- `docs/04_engineering/repo-rules.md` — repo shape, four-layer
  architecture, cross-reference table.
- `docs/04_engineering/worktree-rules.md` — when to use a
  worktree, where they live, per-worktree session-lock detail.
- `docs/04_engineering/delivery-model.md` — phase lifecycle,
  merge rules, branch sync, flag posture.
- `docs/03_architecture/folder-structure.md` — source-tree
  architecture (ADR-0020).
- `docs/03_architecture/authority-gradient.md` — the four-
  layer authority framing.
- `docs/02_specs/glossary.md` — product / workflow / delivery
  vocabulary.
- `docs/04_engineering/conventions.md` — branch naming and
  contribution rules.

### Folder placement guardrails

Three surface guardrails ratify Principle 3 (folder placement
guardrails at high-decision-cost structural surfaces) per
`docs/07_governance/DOCS_RESTRUCTURE_V2.md` Part 1:

- **`apps/web/src/README.md`** — source-tree authority-layer
  guardrail per ADR-0020.
- **`docs/README.md`** — docs-tree document-class guardrail.
- **Repo-root `README.md`** — repo-root structural-folder
  guardrail.

Before creating any folder at one of these surfaces, read the
relevant guardrail. The bypass procedure (Pattern 7 conditional
permission for cross-phase meta-arcs under `07_governance/`)
carries two operational rules: canonical-source verification at
execution time AND chronological-reality verification at planning
time. AI agents may not unilaterally bypass without operator
acknowledgment in the commit body.

Worked examples: `docs/superpowers/` migration (Session 5A,
caught-and-fixed Principle 2 violation); `docs/07_governance/round-2/`
(canonical first-instance Pattern 7 precedent).

When starting work, identify which concern your task touches
and read the canonical source. Do not re-derive these rules
from conversation context.

## On-demand rules — load when touching the relevant area

Skills in `.claude/skills/` summarize and point; canonical leaves
remain authoritative. Load by trigger:

- `journal-entry-rules/` — journal entries, reversals, money
  arithmetic, or `journalEntryService`.
- `service-architecture/` — files under `src/services/`, API route
  handlers, or agent tools that mutate data.
- `agent-tool-authoring/` — files under `src/agent/tools/`,
  `src/agent/orchestrator/`, or `src/agent/prompts/`.
- `integration-test-rules/` — files under `tests/integration/` or
  running Category A floor tests.
- `audit-scans/` — running a codebase audit or working through
  `docs/07_governance/audits/DESIGN.md`.

## What "done" means

1. `pnpm agent:validate` passes — runs typecheck, the
   no-hardcoded-URLs grep check, and all five Category A floor
   tests. `pnpm test` is the full vitest suite; `pnpm test:e2e`
   runs the Playwright harness at `tests/e2e/` — see the
   `tests/e2e/README.md` for setup and founder review workflow.
2. Every doc you touched is still internally consistent: the leaf
   in `ledger_truth_model.md`, the rollup in `invariants.md`, the
   audit row in `control_matrix.md` if applicable, and
   cross-references between them.
3. Any non-obvious decision has a friction-journal entry or an
   ADR, per the rule in `docs/07_governance/adr/README.md`.

## Session execution conventions

Conventions for per-step execution that fire on specific scope
conditions. Rules here earn their place by multi-fire
codification threshold (typically 3+) — one-off patterns belong
in a retrospective or the friction-journal, not here.

### UI-session screenshot gate

Any step that ships UI changes requires a screenshot gate before
ratification.

1. Orchestrator drafts a prescribed capture sequence (typically
   2–5 shots) with per-shot verifications.
2. Founder captures against a fresh `pnpm db:reset:clean && pnpm
   db:seed:all` state to eliminate accumulated test pollution.
3. Orchestrator spot-checks each shot against the prescribed
   verifications.
4. Gate blocks arc / phase closeout until passed.

Typical triggers: new canvas views, table structure changes,
new clickability or navigation paths, visual discriminators on
entry types. Steps that touch only non-visible surfaces
(service logic, API routes, server-side guards) skip the gate.

Precedent: Arc A used this pattern 6 times (Steps 7, 8a, 8b,
9b, 10b, 12b). See
`docs/07_governance/retrospectives/arc-A-retrospective.md` §3
Pattern 2 for mechanism details.

### Push readiness three-condition gate

Push from the working branch to a shared branch requires three
conditions met. Any condition unmet holds the push.

1. **Test-suite health.** `pnpm test` full-suite green at HEAD,
   OR deviations documented with (a) mechanism, (b) fix shape,
   (c) explicit carry-forward framing (retrospective, friction-
   journal, or filed queue item). "Acceptable baseline" without
   these three artifacts is not a met condition.
2. **Doc-sync reconciled.** `invariants.md` ↔ `control_matrix.md`
   ↔ `ledger_truth_model.md` ↔ shipped code all consistent;
   bidirectional reachability diff clean (or flagged exceptions
   documented as Phase 2 stubs). `types.ts` regenerated against
   the post-arc schema. ADRs, obligations, and any other arc-
   affected governance docs reconciled.
3. **Governance closeout.** Retrospective written; friction-
   journal updated with arc-scope entries; any conventions
   earned by fire count codified in this file or filed for
   future codification with provenance.

Pre-push sanity sequence (run from working-branch HEAD):

```bash
git log --oneline origin/main..HEAD | wc -l    # or origin/staging..HEAD
git status --short                              # expect clean
pnpm agent:validate                             # 26/26 green
pnpm test                                       # Condition 1 evidence
pnpm typecheck                                  # green
```

Precedent: the framework had been operating tacitly across Arc
A and was codified at Arc A's push-readiness gate. Arc A's
closeout state (487/487 full suite green; doc-sync reconciled;
retrospective + friction-journal + convention codification
shipped) is the reference example of all three conditions met.
See `docs/07_governance/retrospectives/arc-A-retrospective.md`
for the arc provenance and §5 for the meta-observation on the
framework's implicit operation.

### File-top comment staleness review

When a session edits a file's behavior body (test logic,
component rendering, service implementation), the session must
also review the file's top-of-file comment for staleness — any
description of shape, behavior, or contract the comment makes
that the edit invalidates must be updated in the same commit,
not deferred.

Typical staleness triggers:
- Test file headers enumerating test descriptions (pre-rewrite
  assertion shapes, order-sensitivity claims, fresh-seed
  assumptions).
- Component file headers describing props, structural role, or
  dependencies (post-extraction or post-refactor).
- Service file headers describing function surface or returned
  shape (post-signature change).

Review checklist for any session touching a file body:

1. Does the file-top comment describe what the file *does*?
2. Do any of those descriptions rely on the pre-edit state?
3. If yes, update the relevant lines in the same commit.

Precedent: Arc A saw this pattern fire 3 times —
AdjustmentForm.tsx comment drifted at Step 10b's LineEditor
extraction (fixed at Step 12a item 23); test-file headers in
reportBalanceSheet.test.ts and accountLedgerService.test.ts
drifted at Step 12b's test-1 rewrite (fixed at Pattern 8
codification session post-push). The pattern fires most
commonly when a session's scope is narrow (fix-the-body only)
and the comment is adjacent-but-not-explicitly-in-scope. See
`docs/07_governance/retrospectives/arc-A-retrospective.md` §3
Pattern 8 for mechanism details.

### Multi-line Edit anchor confirmation (Z1 #11.a)

When an Edit's `oldText` anchor spans multiple lines, grep-only
verification of the anchor underspecifies whitespace and line-
continuation handling. The Edit tool matches against exact bytes
including trailing whitespace, line-break characters, and any
soft-wrap artifacts that grep normalization elides. The discipline:
before dispatching a multi-line Edit, Read the target block to
confirm the exact bytes the Edit will match against, then construct
`oldText` from that read rather than from grep output or memory.

Mechanism: grep returns line-content matches; Edit operates on
byte-level matches that include line terminators and surrounding
context. The two views diverge whenever the file uses inconsistent
trailing whitespace, mixed line-endings, or wrap-discipline
variations across paragraphs.

Trigger: any Edit whose `oldText` spans more than one line.
Single-line `oldText` does not require the discipline; grep
verification of single-line uniqueness remains sufficient.

Precedent: Phase 0 governance arc Sessions 2A-2F. Codified at
Session 2F closeout (Observation 6 path α) as Z1 #11 sub-pattern.
Full Z1 catalog at
`docs/09_briefs/phase-2/2026-05-04-session-2f-closeout.md` §4.

### Bidirectional iterative-catching termination (Z1 #15)

When two-sided work involves iterative drift-catching between
sides, the loop terminates not at "agreement" but at canonical-
evidence-anchor: the on-disk artifacts and commit history that
both sides can verify against independently. Transcript inheritance
between sessions is not load-bearing; the canonical artifacts are.

Mechanism: agreement-as-termination produces convergence on shared
mistakes when both sides drift toward the same misreading.
Anchor-as-termination forces both sides to verify against
artifacts that exist outside either side's working memory, which
breaks the shared-drift mode.

Trigger: any two-sided arc where iterative catching surfaces
multiple drift candidates. Sessions that resolve cleanly on first-
pass verification do not require the discipline.

Precedent: Phase 0 governance arc Sessions 2A-2F. Codified at
Session 2F closeout (Observation 3 path α). Full Z1 catalog at
`docs/09_briefs/phase-2/2026-05-04-session-2f-closeout.md` §4.

### Substrate-now-enforcement-later cross-pattern

When ratifying substrate (schema reservations, enum members,
interface contracts, invariant placeholders), the enforcement
code (lint rules, runtime checks, migrations against reserved
values, invariant-content writeup) does not need to land at
substrate-ratification time. Enforcement lands at implementation
time when the first consuming code path forces the question.

Mechanism: substrate at ratification time fixes the shape; the
shape is verifiable from spec + the closed-enum / reserved-value
discipline (Layer 1 DB CHECK + Layer 2 Zod boundary + Layer 3
service no-emit per ADR-0010). Enforcement at implementation time
fixes the runtime behavior; runtime behavior is verifiable from
code + tests. Conflating the two timing surfaces produces two
failure modes:
- Over-specifying enforcement before consumer code shape is known
  produces premature lock-in that the first consumer has to work
  around.
- Under-specifying substrate so consumer code drifts from intended
  shape produces a migration cliff when the discrepancy surfaces.

Trigger: any ratification-time decision that names a slot
(reserved enum value, INV-ID placeholder, lint-rule placeholder,
matrix v1-ship-gate). Substrate lands now; enforcement gate fires
at the first consumer.

Precedent: Phase 0 → Phase 1 transition. Codified at D6 §6.8 +
ADR-0010 Variant A precedent (commit `797db40`). Three deferred-
obligation triggers carry this pattern into Phase 1: Q29 (ESLint
rule design fires at first `src/agent/pipelines/**/*` code), Q79
(INV-DOC-001 shape + DOC prefix fire at first DOC-citing code),
Q77 (Q28 matrix fires at v1 ship). Full Phase 0 closeout at
`docs/09_briefs/phase-2/2026-05-04-phase-0-closure-verification.md`.

### Substrate-mod-event test-staleness review

When shipping a substrate modification that broadens an enum, adds
a partial UNIQUE constraint, renames a CHECK constraint, or
otherwise changes a column-level invariant, audit dependent tests
at substrate-mod commit time (not at downstream test-failure time)
for:

- Assertion strings referencing constraint names (likely to drift)
- Hardcoded values that the substrate-mod broadens or constrains
  (likely to collide)
- Reserved-set assertions (likely to invalidate)

**Evidence basis (N=3 graduation).** chunk-2-Phase-4 β-2
(exception_status `'matched'` broadening invalidated chunk-6 test
assertion on still-reserved set); chunk-6-Phase-2 β-2c (audit test
regex hardcoded constraint name that broadening migration renamed);
chunk-6.3a β-4 (chunk-6.1 RPC rollback test hardcoded `message_id`
collided with migration 155 idempotency partial UNIQUE index).

**Trigger.** Any substrate-mod commit that touches CHECK
constraint suffixes, enum membership, UNIQUE indexes, or column-
level NOT NULL invariants. Discipline fires at the substrate-mod
commit grain, before substrate changes propagate to downstream
consumer tests.

### Plan-authoring substrate-verification at transitive-dependency grain

Plan-authoring (briefs, plan files, session-start prompts) cites
substrate at cited-substrate grain — what's listed in the planning
artifact. Verify-from-disk operates at transitive-dependency grain —
what the cited substrate actually depends on, exists at, or supports.
Gaps surface at implementer dispatch when cited substrate's
transitive dependencies don't exist or projected scope exceeds what
substrate enables.

The discipline: at plan-authoring grain, dispatch a verify-from-disk
recon subagent BEFORE locking scope to confirm cited substrate +
transitive dependencies + scope feasibility. Sub-shapes:

- **B1 — Substrate-citation verification.** Cited substrate may
  reference tables, types, files, or sections that don't exist (have
  been deferred / not yet activated / renamed / moved). Recon at
  plan-authoring grain catches these before scope-lock.
- **B2 — Scope-projection verification.** Plan may project scope
  larger than substrate supports (e.g., 4 mutations cited but only
  3 active per ADR reservation; 7 tests cited but only 6 fit the
  test-architecture rule). Recon at plan-authoring grain catches
  scope-substrate mismatch before scope-lock.

Mechanism: cited-substrate grain is what plan-authoring sees in the
canonical substrate; verified-from-disk grain is what actually exists
+ what the cited substrate transitively depends on + what scope the
substrate enables. The two diverge when (a) substrate has been
deferred to a future arc but cited as active (B1), OR (b) plan-
authoring projects scope beyond what substrate explicitly supports
(B2). Both surface as gaps at implementer dispatch unless caught
preventively.

Adjacent to Z1 #11.b (verbatim re-read at drafting-onset for cited
substrate). Cluster B fires earlier: at plan-authoring-onset, before
scope-lock. The discrimination is timing — Z1 #11.b is for drafters;
Cluster B is for plan-authors.

Trigger: any plan-authoring activity that cites substrate by section
reference, table name, type name, or scope count (mutations, tests,
events, files). Single-line plan items don't fire; multi-line plan
bodies or session-start prompts do.

Precedent: Phase 5 chunk B5-1 sessions #1+#2. Codified at chunk B5-1
session #3 closeout (2026-05-10) per cross-arc N=2 graduation pathway
via candidate (e). B1 instances: session #1 D5/(orgset-β)
substrate-citation gap; session #2 D3 approval-gate substrate-
misreading + D5 Q-lock notation drift; session #3 pickup-file-content-
tracking gap (meta-evidence at pickup-file-maintenance grain). B2
instances: session #2 D1-γ scope reduction (4→3 mutations) + D2-α
scope reduction (7→6 tests). Runtime grain (B3) covered separately
by `.claude/skills/integration-test-rules/` §3 dedicated-test-accounts
pattern; not a Cluster B sub-discipline. See
`docs/07_governance/friction-journal.md` Phase 5 chunk B5-1 closeout
retrospective entry (2026-05-10) Adjudication 1 for full evidence
basis.

### Memory-writes-only Stage 6 firing-shape

When a session's substantive scope is fully captured by a single
substantive commit, Stage 6 session-close fires as memory-writes-only:
no additional commit, just pickup file refresh + MEMORY.md refresh.
The (γ-a) bundle pattern carries: 1 substantive commit + 2 memory-
writes (pickup + MEMORY).

Trigger: any session whose substantive scope is captured in a single
commit AND whose Stage 6 surface is limited to pickup-file refresh +
MEMORY.md refresh. Multi-commit sessions fire Stage 6 differently
(per substantive commit's own commit body + final memory-writes after
the last commit).

Mechanism: Stage 6 separates session-close infrastructure (pickup +
MEMORY) from session-substance (commit). Memory-writes-only fires
when the session's substance is single-commit-captured; the memory
infrastructure layer rides outside the commit. Avoids creating a
post-substance "infrastructure-only commit" that bloats history.

Precedent: Phase 5 chunk B5-1 within-arc N=3 (chunk-onset
memory-writes-only Stage 6 + session #1 close (γ-a) bundle 1+2 +
session #2 close (γ-a) bundle 1+2). Graduated to pattern-stable at
chunk B5-1 session #3 closeout (2026-05-10) per candidate (e)
shape-refinement-via-within-arc-evidence-basis meta-pathway. See
`docs/07_governance/friction-journal.md` Phase 5 chunk B5-1 closeout
retrospective entry (2026-05-10) Adjudication 4 for the graduation
adjudication.

## Verify-forward-at-scope-lock for computational-shape chunks

A discipline cluster that fires at scope-lock for chunks whose
substantive scope is **computational-shape** (dispatcher-style,
re-evaluator-style, or substantively-novel-logic) rather than
**substrate-shape** (table additions, column changes, function
signatures, type definitions). Substrate-shape scope-locks are
well-served by the existing verify-from-disk discipline at
`feedback_verify_from_disk_at_brief_loop.md` (Item C). Computational-
shape chunks need additional scope-lock-time verification to avoid
the framing-discovery arc surfacing mid-implementation and forcing
brief amendment cycles + Path C splits.

Evidence basis: Phase 4 chunk 3 (Subsystem 3 dispatcher; commits
`c3782e9` (3a) + `5d4e954` (3b); amended brief at `c76d264`). The
chunk-3 7-round scope-lock locked thorough substrate-shape but
missed computational-shape under-specification systematically; five
framings surfaced mid-implementation as the framing-discovery arc.
The discipline cluster below codifies the scope-lock-time
verification that would have caught the computational-shape gaps at
scope-lock instead of mid-implementation. See Phase 4 retrospective
writeup §3 (framing-discovery arc centerpiece) for full evidence
unpacking.

### Consumer-presence verification before substrate addition (RI-1)

Before adding a substrate field, enum value, table reservation, or
type / function signature, verify that a v1 consumer for it exists
or is named with explicit activation-trigger. Four-instance
precedent met at chunk-3-Phase-4 close:

- `vendor_credits` / `vendor_credit_applications` table reservation
  per Phase 5 substrate decision (Phase 2.5 Commit A moved
  `vendor_credit` + `vendor_credit_application` from `linked_entity_type`
  v1-active to reserved post-v1; tables don't ship at v1; no v1
  consumer service).
- `backfill_vendor_prepayment_suggested` `resolution_action` value
  introduced at chunk-6-Phase-2 close, ratified at Phase 2.5
  Commit B follow-on (chunk-6 shipped pre-amendment substrate
  pending Phase 2.5 Commit B amendment).
- `paymentService.ts` / `vendorCreditService.ts` gap at chunk-3-
  Phase-4 (T2/T4/T6 dispatcher branches reserved per Framing F
  pending these services shipping; chunk-3 ships T2/T4/T6 as Zod
  literal-union members + dispatcher switch handlers but no
  service emission wiring).
- `cancelled_at` column at chunk-3-Phase-4 Round 4.c (γ) lock
  declined — both v1 consumer checks (UI surface, audit/reporting
  filter) negative; cancellation = pure status flip; WHEN/WHY via
  audit_log trace_id correlation. "Land schema with consumer
  code" reverse-discipline applied.

**Why:** Substrate without a v1 consumer becomes either dead code
(removed at next cleanup pass) or operationally drifts (the substrate
fires writes that no service reads, accumulating data that doesn't
participate in any v1 workflow). Cost of deferring substrate to a
future chunk with explicit named consumer < cost of cleaning up
unconsumed substrate or living with operational drift.

**How to apply:** At scope-lock for any substrate addition, name the
v1 consumer (service file + line range) for the substrate. If no
v1 consumer exists and won't ship in the same chunk, defer the
substrate to the consumer-shipping chunk via reserved-not-omitted
shape per ADR-0010 substrate-now-enforcement-later. Forward-pointer
the deferral in the appropriate retrospective inventory item with
activation-trigger named.

### Read-substrate verification at scope-lock, four grains (RI-6)

For dispatcher-style / re-evaluator-style / substantively-novel-
logic chunks, scope-lock must explicitly verify-forward at four
nested substrate grains. The first grain is well-covered by Item C
at `feedback_verify_from_disk_at_brief_loop.md`; grains 2-4 are
the extension this cluster adds.

**Grain 1 — Substrate-shape grain.** What tables, columns, function
signatures, type definitions, constants, and ServiceErrorCodes
exist? Verify-from-disk on every cited substrate. This grain is
Item C's existing scope; the four-grain refinement extends it.

**Grain 1 reinforcement (chunk 6.3a evidence basis).** Four sub-
instances at chunk-6.3a strengthen the Grain 1 discipline. Each
fires the same underlying pattern (brief-scope-lock-without-
substrate-verify-from-disk) at a distinct sub-grain:

- **Flag 20** (`organizations.slug` column gap; column-existence
  sub-grain): brief Sub-Q2 + Sub-Q6 walks referenced
  `inbound+<org-slug>@inbound.chounting.com` +
  `SELECT organizations WHERE slug = mailboxHash` without
  disk-verify on `organizations.slug` column. Disk evidence: no
  slug column. β-2 in-line single-finding-scale brief amendment
  per RI-10.

- **β-2** (MailboxHash resolution at impl-onset; same surface as
  Flag 20 but caught at impl-onset grain rather than brief-draft
  grain): execution-side caught at substrate-receipt before
  consuming.

- **β-3 / MF-2** (`ServiceContext` 111-site blast radius;
  consumer-count sub-grain): brief Sub-Q6 Artifact 3 proposed
  discriminated-union extension with pre-drafted conditional MF-2
  threshold "≤10 sites in-scope; >10 sites codify scope expansion."
  Disk evidence: 111 sites. 11x off. Brainstorming-side adjudicated
  to sister-type Approach B at impl-onset.

- **Sub-Q10** (cards-UI discovery mechanism gap; UI-consumer-
  contract sub-grain): brief Sub-Q1 "server-only" constraint at
  session start scoped to affordance-kind; Sub-Q10 walk surfaced
  existing-UI-consumer-contract not verified. Cross-references
  RI-6 Grain 5 amendment.

**Pattern.** RI-10 framing-interaction-tracing operates as the
consolidation discipline: four entries surface one underlying
pattern. The discipline rule strengthens at chunk-6.3a evidence
basis: cited substrate at scope-lock requires verify-from-disk at
the cited-substrate's grain — **column-existence** for SQL
references, **consumer-count** for blast-radius estimates,
**UI-consumer-contract** for affordance-kind constraints.

**Grain 2 — Per-trigger / per-branch semantic coverage grain.** For
each trigger / branch / input shape the chunk dispatches over, what
is the per-trigger semantic? Are stranded paths handled? What does
"audit-only" vs "re-routing-functional" vs "no-op" mean per
trigger? Build the coverage table at scope-lock.

**Grain 3 — Per-trigger × per-decision-outcome conformance grain.**
For each combination of `(trigger, prior-state, decision-outcome)`,
what is the per-cell behavior? Is the discriminator's rule structure
exhaustive? Are there unreachable cells? Are reachable cells
prescribed at the right outcome? Build the rule table at scope-lock.

**Grain 4 — Idempotency-and-side-effect-contract conformance
grain.** For each cited contract (ADR-cited or chunk-cited), is the
contract implemented at chunk close? If not, is the deferral
explicit and named (forward-pointer inventory item + activation
trigger)? Articulate what's implemented at chunk close and what's
deferred at scope-lock — not at implementation.

**Why:** Chunk-3-Phase-4 evidence per grain: Grain 1 surfaced two
β-reconciliations (β-3 carried-in trigger errcode + β-4 PK column
fix); Grain 2 surfaced Pause 3 (γ'-partial per-trigger coverage)
mid-implementation; Grain 3 surfaced Pause 4 (D-partial 6-rule
discriminator replacing brief's 3-rule under-specification) + the
second-order β-5 / β-6; Grain 4 surfaced Pause 5 (D-partial-no-
idempotency at v1). Verify-forward at all four grains at scope-lock
would have caught these at scope-lock rather than mid-implementation.

**How to apply:** At scope-lock for any computational-shape chunk,
produce the four-grain artifacts as part of the scope-lock outputs:
- Grain 1 verify-from-disk results per Item C.
- Grain 2 coverage table (trigger × semantic).
- Grain 3 conformance table (trigger × prior-state × decision-
  outcome).
- Grain 4 contract-implementation status (per cited contract:
  "implemented at chunk N" or "deferred to chunk M via RI-X
  forward-pointer with activation trigger Y").

Precedent: Phase 4 chunk 3 close (single-arc evidence; four-grain
refinement synthesizes chunk-3's discipline-graduation lessons into
one inventory item). The four-grain checklist applies retroactively
to F-J-8 (Item C prospective application) — Item C remains Grain 1's
canonical statement; grains 2-4 are the chunk-3-Phase-4 extension.

### Grain 5 — Consumer-application grain at scope-lock

Grains 1-4 verify what substrate IS shipped. Grain 5 verifies how
shipped substrate interacts with existing CONSUMERS of the affected
entity types. Sub-sub-grains:

- **Substrate-shape consumer-application.** When cross-phase
  consumers (services, agent tools, integration tests) read the
  affected entity types, do they continue to behave correctly
  post-modification? **Evidence basis:** chunk-6.1 origin —
  cross-phase test failure surfaced consumer-contract gap;
  Sub-Q4 4-step activation sequence codified.

- **UI-consumer-contract.** When existing UI components consume
  the affected entity types, does the scope-lock's affordance-kind
  constraint account for the UI consumer's contract requirements?
  **Evidence basis:** chunk-6.3a Sub-Q10 firing — forwarded_mailbox
  ingestion would have shipped with cards-UI invisibility (operator-
  perceives-as-broken-despite-working-correctly) without the Grain 5
  extension catching the existing-UI-consumer gap.

**Discipline rule.** Scope-lock that ships substrate affecting an
entity type MUST verify-from-disk against all current consumers of
that entity type — services, agent tools, integration tests, AND
existing UI components — to confirm consumer-contract conformance
post-modification.

### Session-budget-feasibility verification + Path C invocation conditions (RI-7)

At scope-lock, compute the chunk's volume-vs-budget arithmetic and
adjudicate whether single-session reliable delivery is achievable
or whether Path C dispatcher-isolated invocation (or analogous
split shape) is the right structural choice. Path C invocation
preserves wiring-with-tests pairing at each commit boundary;
validation-gate-green at each commit is non-negotiable.

**Volume estimators at scope-lock:**
- Source files touched (modified + created).
- Migrations (substrate-level changes).
- Generated `types.ts` regenerations.
- Test surface (new tests + modified tests).
- Pre-drafted friction-journal entries.
- Cross-phase blast radius (number of services across phases).

**Path C invocation conditions:**
- Volume estimators sum exceeds single-session reliable delivery
  band.
- Scope-lock surfaces N framing-revisits (typically N≥3 framings;
  RI-10 codifies the multi-finding shape).
- Substantively-novel-logic scope (dispatcher-style, re-evaluator-
  style, computational-shape chunks per this cluster).

**Path C fault line declaration:**
- Explicit declaration at scope-lock: "fault line = X-isolated vs
  Y-cross-phase" (chunk-3-Phase-4 used dispatcher-isolated vs
  cross-phase-wirings).
- Each split commit preserves wiring-with-tests pairing.
- Validation gate green at each commit non-negotiable.

**Why:** Chunk-3-Phase-4 evidence: 5 framings + brief amendment
cycle + 8 source files + 1 migration + 1 generated types.ts pushed
chunk-3 over single-session reliable delivery. Path C dispatcher-
isolated split (3a + 3b) was the response. The chunk-3 upper bound
(8 files + 1 migration + 1 types.ts + 5 framings + brief amendment
cycle) is the current empirical evidence point for Path C invocation.

**How to apply:** At scope-lock, produce the volume estimate +
framing count. If the estimate sits comfortably below chunk-3's
empirical upper bound AND no framing-revisits surface at scope-lock,
single-session delivery is appropriate. If the estimate approaches
chunk-3's bound OR framing-revisits surface at scope-lock, invoke
Path C with explicit fault-line declaration. F-J-14 tier-1
codifies Path C invocation; this cluster carries the discipline
forward.

Precedent: Phase 4 chunk 3 (first Path C invocation at chunks-1-6 +
Phase 4 grain; upper-bound calibration anchor). Future chunks
calibrate downward against this anchor as evidence accumulates.

### Brief amendment cycle threshold + framing-interaction matrix at N≥3 (RI-10)

At single-finding scale (one or two β reconciliations per chunk),
friction-journal-only divergence is sufficient: implementation
surfaces are absorbed by friction-journal entries (β-N
reconciliations); brief text stays as-shipped at scope-lock for
chronology + provenance. At multi-finding-shape-changing scale
(typically N≥3 framings touched), brief amendment cycle is the
right tool — the amendment section ratifies new framings as
authoritative; friction-journal entries codify discipline
graduations; retrospective inventory tracks any further ADR
amendments.

**Sub-discipline — framing-interaction matrix at N≥3.** When a
brief amendment ratifies N framings, the amendment process must
explicitly trace each framing's interaction-with-every-other-
framing — not just absorb the framings as-stated. Absorbing
framings without tracing interactions yields second-order
consequences surfacing at implementation rather than at amendment.

**Why:** Chunk-3-Phase-4 evidence: five framings (γ' re-eval
primitive + γ'-partial per-trigger coverage + D-partial 6-rule
discriminator + D-partial-no-idempotency + Path C split) + amended
brief at `c76d264`. The amended brief absorbed framings 1-5 at
framing-level but didn't trace second-order consequences: β-5
(count_after semantic ambiguity from K2-post-mutation vs
`newCandidates.length` under D-partial-no-idempotency) and β-6
(rule 5 reachability via T5→T1 sequence under no-supersedes-on-
empty-rerun) are second-order consequences of Pause 5 that
surfaced at 3a impl. Empirical bound: chunk-3's 5 framings is the
current upper evidence point; lower bound undetermined (future
chunks calibrate downward).

**How to apply:** At single-finding scale, friction-journal entries
absorb. At N≥3 framings, fire brief amendment cycle. As part of
the amendment cycle, produce a framing-interaction matrix listing
each framing × each other framing × the interaction's second-order
consequence at substrate / discriminator / contract level. The
matrix surfaces second-order consequences before implementation
rather than after.

Precedent: Phase 4 chunk 3 (first instance; brief amendment cycle
at `c76d264`; F-J-15 tier-1 codifies). Future chunks calibrate the
N≥3 threshold downward as evidence accumulates.

### Codification convention: observation-grain vs application-grain N count

When counting codification-graduation evidence (N), distinguish
two grains:

- **Observation-grain N.** The pattern surfaces as a new finding
  in distinct sessions / chunks / contexts. Typical codification
  threshold is observation-grain N=3 (the pattern needs to surface
  as a new observation in 3 distinct contexts before graduating to
  "should we normalize / codify project-wide" question).
- **Application-grain N.** The pattern is applied N times within a
  single session / chunk / context. Application-grain N within one
  session is one instance from threshold-counting perspective —
  not N independent observations.

**Why:** Chunk-3-Phase-4 close evidence: F-J-11 (Pattern B variant
split) prose conflated observation-grain N=1 (chunk-3 surfaced the
Phase-1-internal-wrap vs Phase-2/5-external-wrap split as a single
finding at scope-lock Round 6) with application-grain N=6 (chunk-3
applied the split across 6 service-method modifications at 3b).
The split is documented at chunk-3 but graduation awaits a second-
observation-grain instance (e.g., a future chunk reaching into
Phase 1 services or any variant-mixed service surface and re-
surfacing the variant-aware insertion-site decision).

**How to apply:** When citing N in codification claims (friction-
journal entries, retrospective inventory ratification, CLAUDE.md
graduations), name the grain explicitly: "observation-grain N=X"
or "application-grain N=Y." For codification threshold purposes,
observation-grain N is the load-bearing count; application-grain N
documents the breadth-of-application within an instance but doesn't
contribute to the threshold count.

Precedent: Phase 4 chunk 3 close (memory-only candidate (iii)
graduation per Phase 4 retrospective; applies retroactively to
F-J-11 and other ambiguous-N codifications). Future codification
claims at chunks 4+ name the grain.

### Partial-information-recommendation-drift discipline

When authoring a recommendation, brief, handoff prompt, or other
substrate that frames decisions for downstream consumption,
partial-information recommendations (recommendations made without
disk-verify on cited substrate) introduce drift that surfaces at
consumption time. Two firing-shapes:

- **Retrospective drift.** Recommendation references *prior work*
  (citations to existing files / sections / decisions) without
  disk-verify. Catch authority = reader of recommendation.
  Discovery moment = post-recommendation reading. Codification
  surface = drift-fix entry post-discovery.

- **Prospective drift.** Recommendation frames *future work*
  (handoff prompts / brief drafts) with quantitative anchors or
  substrate references without disk-verify at authoring time. Catch
  authority = execution-side session-onset state-verify. Discovery
  moment = pre-execution at substrate-receipt. Codification surface
  = Round 0 state-verify ratification + downstream consumption
  surfaces.

**Discipline rule.** Recommendations that cite substrate (file
paths / section references / quantitative anchors / decision
precedents) MUST disk-verify at authoring time. When this discipline
fails-to-fire at authoring time, the catch is structurally located
at the consumption surface (retrospective or prospective). Both
shapes inherit the broader Verify-from-disk-at-non-standard-grain
pattern at recommendation-substrate-receipt grain — see
Verify-from-disk-at-non-standard-grain codification for the
grain-agnostic parent discipline.

**Evidence basis (N=4 graduation; N=5 with post-Round-3 evidence):**
(1) Phase 5.1 "reviewer chunk" naming drift at Phase 4 retrospective
drafting (retrospective drift; caught at post-close drift-fix
`18dd608`); (2) Reading A vs B scope-lock adjudication (retrospective
drift; brainstorming-session-internal); (3) scope-observation framing
on Postmark webhook scope vs Reading B lock (retrospective drift;
brainstorming-session-internal); (4) chunk-6.3b handoff prompt
"~20+" vs 243 commits magnitude drift (prospective drift; caught at
WSL-side Round 0 state-verify). (5) chunk-6.3b Round 6 onset
brainstorming-side Op 2 "first merge-to-main since pre-Phase-4
grain" framing drift (caught at Round 6 verify-from-disk; cfcf2e7 +
9f0ebb3 prior merge-to-main precedents exist).

### Verify-from-disk-at-non-standard-grain pattern

Execution-side at substrate-receipt MUST disk-verify substrate before
consuming, regardless of substrate-grain and regardless of
substrate-authorship-provenance. The discipline is grain-agnostic
and catch-direction-agnostic.

**Sub-grains observed-to-date (chunk-6.3a → 6.3b conversation arc):**

1. **Substrate-shape grain** (chunk-6.3a β-2): cited schema column
   verified to not exist on disk. Inter-side catch.
2. **Consumer-count grain** (chunk-6.3a β-3): cited blast-radius
   estimate (≤10 sites) verified to be 111 on disk (11x off).
   Inter-side catch.
3. **Context-gap grain** (chunk-6.3a scope-input artifact): cited
   Q1-Q4 content verified to not exist in session record.
   Session-internal catch.
4. **Handoff-receipt grain** (chunk-6.3a→6.3b transition): handoff
   prompt at `e0824c2` verified against disk anchors at session-onset
   state-verify. Inter-side catch.
5. **Intra-handoff-quantitative-estimate grain** (chunk-6.3b Round 0
   catch #4): "~20+ commits" handoff body estimate verified to be 243
   on disk (~12x off). Inter-side catch.
6. **Intra-commit-message-entry-count grain** (chunk-6.3b Round 0
   catch #5): "22 entries" commit message claim verified to be 26 on
   disk (1.18x off). **Intra-side catch** (NEW catch-direction
   sub-shape).

**Cross-grain instances at Phase 4:** (7) Round 3
retrospective-scoping (Phase 5.1 "reviewer chunk" naming drift).
(8) Post-retrospective-close drift-fix at `18dd608`.

**Discipline rule.** Disk is the canonical source. Substrate-receipt
grain — wherever it lives (impl-onset, session-onset, retrospective-
scoping, downstream-consumption) — requires disk-verify against the
cited substrate's grain. The substrate-author may be opposite-side
(inter-side catch; sub-grains #1, #2, #4, #5; Phase 4 instances) or
same-side (intra-side catch; sub-grain #6). The discipline operates
catch-direction-agnostic — same-side substrate is not exempt from
disk-verify-at-consumption.

**Named sub-disciplines:** Partial-information-recommendation-drift
(firing at recommendation-substrate-receipt grain; see codification
for two-shape sub-discipline).

### Cross-references

- Phase 4 retrospective writeup §3 (framing-discovery arc
  centerpiece) and §4 (codified patterns by graduation surface) at
  `docs/07_governance/retrospectives/phase-4-retrospective.md`.
- ADR-0018 §item 4 amendment at `docs/07_governance/adr/0018-relationship-router.md`
  (Phase 4 retrospective Amendment block) — canonical statement of
  v1 Subsystem 3 dispatcher contract (γ'-partial coverage +
  D-partial 6-rule discriminator + D-partial-no-idempotency).
- ADR-0016 §6 amendment at `docs/07_governance/adr/0016-document-relationship-graph.md`
  (Phase 4 retrospective Amendment block) — `pre_commit_link_rerouted`
  v1 emission deferral forward-pointer + activation trigger.
- `feedback_verify_from_disk_at_brief_loop.md` Item C — Grain 1's
  canonical statement (substrate-shape verify-from-disk discipline;
  this cluster's Grain 2-4 extension builds on Item C).
- `docs/07_governance/friction-journal.md` — F-J-1 (chunk-N suffix
  discipline); F-J-13 (γ' + γ'-partial + D-partial-no-idempotency
  codification); F-J-14 (Path C dispatcher-isolated split);
  F-J-15 (brief amendment cycle discipline at multi-finding scale);
  Phase 4 retrospective F-J entry (codify-while-deciding meta-
  discipline + three applied-discipline instances).

### Post-close correction (2026-05-15)

The cluster above shipped at Phase 4 retrospective Commit C
(`294f9e7`, 2026-05-14) with cross-references that name "Phase 5.1
reviewer chunk" and "Phase 7 envelope substrate" as Phase 4's
downstream consumers. Post-close verify-from-disk at the
next-session-recommendation grain (2026-05-15) surfaced drift:
"Phase 5.1 reviewer chunk" is a Commit-C-drafting fabrication;
canonical Phase 5.1 = **Phase 5 amendments** per Phase 2
retrospective §6 line 588 (INV-DOC-001 enforcement + vendor_credits
substrate + paymentService introduction territory). The Round 7
scope-lock missed Phase 6 (Ingestion) as the canonical next phase
per Phase 5 retrospective §6 sequencing (`Phase 5 → Phase 2 →
Phase 3 → Phase 4 → Phase 6 → Phase 7 → Phase 8`). Phase 6 is
the operationally-instantiated **pure discipline-reference
consumer** of this cluster (Round 7 Q3 third-shape ratified
operationally).

Canonical readings authoritative at the cross-references above:

- **Phase 5.1** = Phase 5 amendments (not "Phase 5.1 reviewer
  chunk"). Both-shapes consumer of Phase 4 (activation-trigger:
  T2 dispatcher slot via paymentService.record() post-commit
  dispatch hook; discipline-reference: RI-1 + RI-6 + RI-7 +
  RI-10).
- **Phase 6** (Ingestion) — canonical next phase post-Phase-4 per
  Phase 5 retrospective §6:380-381. Pure discipline-reference
  consumer of Phase 4 (RI-1 + RI-6 + RI-7 + RI-10 at Phase 6
  scope-lock; no activation-trigger work on Phase 4 substrate).
- **Phase 7** Tier 2 pipeline — both-shapes consumer (activation-
  trigger: γ'-partial coverage gap + RI-9 fingerprint-dedup;
  discipline-reference: RI-1 + RI-6 + RI-7 + RI-10).

Full corrected cross-phase consumer inventory + corrected
next-session sequencing at the Phase 4 retrospective writeup's
"## Post-close correction" section (`docs/07_governance/retrospectives/phase-4-retrospective.md`).
Drift codification + discovery-grain framing at friction-journal
2026-05-15 entry. Below ADR-amendment-cycle threshold;
provenance-preserving correction shape (original cross-references
above stay; this note appends at end of cluster).

## Project conventions

### Webhook route handler conventions

Conventions for external-webhook routes — provider-invoked HTTP
endpoints that receive substrate from third-party services (Postmark
inbound mail; future Stripe / auth callbacks / etc.).

**Directory convention.** Webhook routes live at
`apps/web/src/app/api/webhooks/<provider>-<event>/route.ts`. Frontend-
invoked routes stay at `/api/orgs/[orgId]/...`. The semantic
distinction is **who invokes** (third-party HMAC-verified vs.
user-session-authenticated) and **how `org_id` is derived** (resolver
helper vs. URL parameter). Future webhook routes inherit this
directory layout.

**System-actor route handler pattern.** Webhook route handlers bypass
`withInvariants` and construct `SystemActorServiceContext` directly
with `caller: { user_id: null, system_actor: '<source>' }`. The
discriminator is **invocation source**: third-party HMAC-verified
webhook (system-actor) vs. authenticated user session (user-session).
Future system-actor surfaces (cron, scheduled tasks, other webhook
providers) inherit this pattern. The runtime guarantee that
`withInvariants` normally provides (verified caller + memberships-vs-
input-org check) is replaced by HMAC verification + provider-specific
org-resolve at the route handler boundary.

**`SystemActorServiceContext` sister type.** Sister type to
`ServiceContext` (NOT a discriminated-union extension). Existing
`ctx.caller.user_id` consumer sites unchanged. `recordMutation`
widens its accepted ctx shape to `ServiceContext |
SystemActorServiceContext`; storage provider methods widen `ctx`
to `StorageProviderContext` (same union) to accept system-actor
invocation at storage put time. Service methods that need to support
**both** invocation modes declare the union at parameter type
(explicit signature, not implicit narrowing). The "two ServiceContext
types" cost is bounded; the alternative (consumer-site narrowing at
discriminated-union extension) is scope-disproportionate to the
value at one new system-actor caller grain.

**HMAC constant-time signature comparison.** Webhook handlers use
`crypto.timingSafeEqual` (node:crypto) on equal-length hex digests
for signature verification. Direct `===` string comparison on
signature digests is an anti-pattern (timing-attack reconstruction
of the secret); `timingSafeEqual` is the canonical Node.js stdlib
primitive for constant-time digest comparison. The helper pattern:
compute expected digest → length-check → wrap in `timingSafeEqual`.

**Cross-references.**
- `apps/web/src/app/api/webhooks/postmark-inbound/route.ts` — first
  instance precedent for all four sub-conventions at chunk 6.3a.
- `apps/web/src/services/middleware/serviceContext.ts` —
  `SystemActorServiceContext` sister type definition.
- `apps/web/src/services/audit/recordMutation.ts` — union-widening
  surface for system-actor audit emission.

### Seed-data PII-shape placeholder convention

When migration-seeded data includes PII or near-PII (email addresses,
phone numbers, personal identifiers), prefer placeholder-plus-post-
deploy convention vs. literal-values-in-migration.

**Pattern.** Migration ships placeholder rows (e.g.,
`placeholder-founder@chounting.com`); operator runs post-deploy
`UPDATE` to substitute real values. Discipline-failure mode if
forgotten: downstream consumer rejects all data as not-matching
expected shape (loud, observable, not silent).

**Reason.** Git history is forever; v1 audience scope (internal-only)
does not constrain future audience. Placeholder seeds keep PII out of
the git provenance trail.

**Evidence basis (N=1 first-instance precedent at chunk-6.3a;
load-bearing-for-future-PII-seed-migrations).** Migration 155
Statement 3 inserts 3 allowlist seed rows with placeholder addresses
for `internal_sender_allowlist`. Operator runs post-deploy `UPDATE`
for each placeholder.

**Cross-references.**
- `supabase/migrations/20240155000000_forwarded_mailbox_substrate.sql`
  Statement 3 — first-instance precedent.
- chunk-6.2a `_for_test` suffix convention (N=1 first-instance
  precedent) — parallel graduation pattern.

### Audit-action naming convention split

Audit action names split between two shapes:

- **Dot-namespaced** (`forwarded_mailbox.rejected_not_allowlisted`,
  `forwarded_mailbox.signature_invalid`): for new domain-event
  families with anticipated taxonomy expansion. The namespace prefix
  groups related actions under a single domain umbrella; future
  taxonomy additions land as new sub-actions under the same prefix.

- **Underscored** (`document_case_transitioned`,
  `ingest_batch_created`): for established entity-state-transition
  events with stable taxonomy. The flat naming reflects the stable
  shape; no umbrella prefix needed.

**Evidence basis (N=2 graduation).** chunk-6.3a forwarded_mailbox.*
opens a new domain family (dot-namespaced); chunk-2-Phase-3
`document_case_transitioned` is established entity-state-transition
(underscored).

**Discipline rule.** When introducing a new audit action, choose
shape based on taxonomy stability: dot-namespaced if you anticipate
≥3 related actions under the same domain umbrella; underscored if
the action is standalone or part of a stable event family.

### Zod strict-mode-for-our-shape vs passthrough-for-third-party

Zod schemas split on `.strict()` / `.passthrough()` based on
substrate origin:

- **Our-shape schemas** use `.strict()` — typically with `.refine()`
  sentinel-rejection layer for defense-in-depth. Detect drift early;
  symmetric Layer-2 write-side discipline.

- **Third-party-payload schemas** use `.passthrough()` — forward-
  compat with provider API additions (new fields silently dropped at
  our-shape construction). Sentinel-rejection NOT applied (third-
  party payload won't naturally emit our sentinel-shape;
  defense-in-depth marginal).

**Evidence basis (N=2 graduation).**
`DragDropChannelMetadataSchema` `.strict()` + `.refine()` for
sentinel rejection (our-shape; chunk 6.2b);
`PostmarkInboundWebhookSchema` `.passthrough()` for forward-compat
with Postmark API additions like `ReplyTo`, `MessageStream`,
`OriginalRecipient` (third-party-payload; chunk 6.3a).

**Discipline rule.** Authoring a new Zod schema requires
substrate-origin classification: our-shape gets `.strict()`; third-
party-payload gets `.passthrough()`. PascalCase field names at the
third-party-payload boundary transform to snake_case at our-shape
construction.

## Phase 1 Simplifications

Three Phase 1 simplifications (synchronous audit log,
reserved-seat `events` table, agents-collapsed-to-services) are
temporary. Each has a named, scheduled Phase 2 correction. **Do
not re-architect around them as if they were permanent.** See
`docs/03_architecture/phase_simplifications.md` for the full
simplification table.

## When in doubt

- If a situation is not covered by this file, the skills in
  `.claude/skills/`, or the canonical docs in `docs/02_specs/`,
  flag it in `docs/02_specs/open_questions.md`. **Do not guess.**
- If something in this file contradicts the canonical docs or an
  ADR, the canonical doc or ADR wins — this file is wrong and
  should be fixed here, with a friction-journal entry recording
  the fix.
- Code that deviates from the canonical docs during a session is
  wrong unless an ADR is written to update them first. The ADR
  comes before the code, not after.
- The leaves in `ledger_truth_model.md` and the ADRs are the
  tiebreakers for their respective domains: leaves win for
  invariant questions, ADRs win for architectural decisions.
