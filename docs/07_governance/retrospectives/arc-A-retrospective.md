# Arc A Retrospective — Phase 0-1.1 Control Foundations

Written: 2026-04-24, immediately after Arc A Step 12b closed the
polish-sweep bundle.

Audience: future-me starting the next Arc or Phase 2, any future
collaborator inheriting the codebase, the Phase 2 brief author.

Arc A was the first arc executed under the three-role workflow
(founder + orchestrating Claude + wsl-claude executing in a
separate WSL terminal). This retrospective captures what Arc A
shipped, where the arc surprised, the patterns that emerged
during execution, and observations about the three-role workflow
itself.

---

## 1. What Arc A actually built

Arc A took the Phase 0-1.1 Control Foundations brief (12 steps)
and shipped all 12, closing with 14 Arc A commits plus 2
discipline-meta commits already on the branch. The held set at
retrospective time is 16 commits pending push.

**Steps 0-8b (foundations through report drill-downs)**:
INV-AUDIT-002 (audit_log append-only), `before_state` capture
convention (ADR-0009 — `714b9f5`), `audit_log.reason` column
and `periodService.lock`/`unlock`, audit coverage verifier
(`8aa1479`), `UNBALANCED` integrity-incident log (`1bf9267`),
`accountBalanceService` + `get_account_balance` RPC (`1336b46`),
Balance Sheet 4-row RPC and view (`425ee9d`), Trial Balance →
Account Ledger drill-down (`d1e7b55`), P&L → accounts-by-type
chain + D5 UUID polish (`8bb808d`).

**Step 9 (adjusting entries)**: split into 9a (`65705ab`, data +
service + ADR-0010 first consumer — `adjustment_status` reserved-
enum-states discipline) and 9b (`aa323ca`, AdjustmentForm canvas
component + canvas-directive wiring). INV-ADJUSTMENT-001 shipped
at 9a; three-layer defense pattern (DB CHECK + Zod + service)
landed as the mechanical template the later steps reused.

**Step 10 (recurring journals)**: split into 10a (`a8049fb`, data
+ service + routes — 16 files) and 10b (`ffcae53`, UI + shared
`<LineEditor />` extraction — 12 files). INV-RECURRING-001 with a
deferred CONSTRAINT TRIGGER on template lines (mirror of
INV-LEDGER-001's trigger). ADR-0010's second deliberate consumer
landed at the same migration (`recurring_run_status` enum with
unconditional scoped CHECK — variant distinct from Step 9a's
discriminator-scoped form). D10-D ratified `approveRun` as
best-effort sequential per the `adminClient()` non-atomicity
reality.

**Step 11 (doc-sync)** — `e016c20`: invariants count 18 → 20
across `invariants.md`, `ledger_truth_model.md`, and
`control_matrix.md`; two new invariant leaves (INV-ADJUSTMENT-001,
INV-RECURRING-001); cross-layer pairings table expanded with
INV-LEDGER-001 ↔ INV-RECURRING-001. D11-C ratified: count the
actual `ServiceErrorCode` union (56), not the brief's 19 → 24
math.

**Step 12a (mechanical closeout)** — `4330eef`: `src/db/types.ts`
regenerated against post-Arc-A schema (+231 lines); doc-sync items
18/19/20/21/23/25 landed (obligations.md bullet split +
approveRun atomicity note subsection, ADR-0010 cross-refs with
the shipped migration, AdjustmentForm file-top comment, 37-code
HTTP-status-table expansion + condensed per-code catalog). Item
24 verified no-op. Six files, +711 / −30.

**Step 12b (polish-sweep)** — `202b6cc`: items 11 (partial — test-1
fresh-seed-assumption fragility class closed in both files), 13
(AccountLedgerView padding + thead unification), 14
(JournalEntryDetailView `reversed_by` symmetric clickability via
IIFE capture-to-const mirror). Full-suite delta 483/487 →
485/487. Items 13 + 14 visual gate (D12b-D, 3 screenshots)
passed clean.

**What Arc A did NOT build**:

- Recurring-journal automated scheduler (pg-boss) — Phase 2 per
  brief §2.2; Arc A ships the data model + manual path only.
- `auto_post` flag consumption — Phase 2 scheduler concern.
- `approveRun` atomicity hardening — Phase 2 uniform service-
  layer concern (obligations.md subsection added at 12a).
- Full-depth per-code catalog for the 37 Phase 1.5 + Arc A codes
  in `ledger_truth_model.md` §Structured Error Contracts — item
  26, optional future session.
- `accountLedgerService` tests 3/6 running-balance window-
  function fragility — item 27, fix shape known (migrate to
  less-polluted account).

Arc A closed at 485/487 full-suite, push HELD pending
retrospective + item 27 decision + three-condition check.

---

## 2. The 12-step execution arc

The arc was mostly clean. Steps 0-8b executed as sequential
feature ships without structural surprises; the patterns from
Phase 1.1 (RPC-first for complex SQL, deferred CONSTRAINT TRIGGER
for balance checks, controller-gated mutations via
`withInvariants`) carried forward with no drift. The pivotal
moments were all in Steps 9 onward, where the arc surfaced its
first cross-cutting decisions.

**Step 9 split worked clean.** The 9a (data) / 9b (UI) cadence was
the first time the three-role workflow needed to commit to a
mid-arc split. The trigger was scope: data + UI in one commit
would have been too many files to review coherently. The split
committed data first (migration + service + schema + tests), let
the data land and be verified against the invariants, then
committed the UI on top (canvas form + directive variant + canvas
wiring + schema tests). Zero structural drift between 9a and 9b.
The data surface never needed to change after 9a shipped; 9b
consumed the service exactly as specified.

**Step 10 needed a bigger split — D10-A.** Step 10 was too large
to ship as one commit. The data layer alone was 16 files
(migration with 3 tables + deferred CONSTRAINT TRIGGER + RLS + 3
new error codes + 6 new ACTION_NAMES + service with 10 methods +
5 API routes + new Zod schemas + integration tests). Adding the
UI layer (4 canvas views + `<LineEditor />` extraction + canvas
wiring + schema tests) would have pushed the commit to ~28 files.
D10-A ratified the 9-style split: 10a (data) + 10b (UI). Both
shipped cleanly.

**Step 10a D10-D was the pivotal decision of the arc.** The resume
prompt originally recommended atomic `approveRun` semantics —
"transition pending_approval → posted in one transaction." During
orchestrator state-check, reading the `adminClient()` return type
revealed the data layer's actual shape: `adminClient()` creates a
fresh REST-over-HTTP Supabase client per call, and each
`.from(...).insert/update/select()` is an independent PostgREST
HTTP request running in its own short-lived DB transaction. The
service layer has no cross-call transaction handle. "Atomic" was
the resume-prompt's aspiration, not the data layer's capability.

The flip to "best-effort sequential + incident-log orphan guard"
was the session's most load-bearing decision. Under the new
framing, `approveRun` calls `journalEntryService.post()`, then
UPDATEs the run's status + journal_entry_id, then writes the
audit row. If the UPDATE fails after post succeeds, the service
logs `incident_type: 'recurring_run_orphaned'` at ERROR level and
throws `POST_FAILED`. Retries are blocked by the dual orphan-
guard (`status = 'pending_approval'` AND
`journal_entry_id IS NULL`). The invariant (INV-RECURRING-001)
holds under the non-atomic reality because template balance is
enforced at the template layer, not at the run-approval path.

Without the spec-check, wsl-claude would have implemented literal
atomicity-via-RPC: a new PL/pgSQL function that performs INSERT
journal_entry + INSERT journal_lines + UPDATE run + INSERT
audit_log in a single SQL transaction. That would have introduced
a second Law-2 entry point (the RPC), diverged from
`journalEntryService.post()` as the sole journal-entry creation
path, and required its own pairing with INV-AUTH-001 / INV-AUDIT-
001. The flip prevented that divergence.

**Step 11 D11-C was the second baseline-math catch.** The brief
said the ServiceErrorCode count was "19 → 24" (Phase 1.1 baseline
plus the 5 net-new codes from the brief). Orchestrator grep of
the actual `ServiceError.ts` union showed 53 → 56. The brief was
wrong by 32 codes — but the math was internally self-consistent
because the brief had been authored against a Phase 1.1 snapshot
before Phase 1.5 added the Org profile / Address / User profile /
Invitation / Membership / Agent code groups.

D11-C flipped the decision from "trust the brief math" to "count
the actual union." The HTTP-status-table expansion was deferred
from Step 11 (where it would have 37-row'd the doc-sync scope) to
Step 12a. This pattern is worth naming: **briefs decay against
the living codebase**. When the brief's math disagrees with the
filesystem, the filesystem wins — but the disagreement itself is
a signal that the brief was written against an older snapshot
than expected, and other claims in the same brief may also be
drifted.

**Step 12a item 25 was a scope-trade-off moment.** 37 new per-code
catalog entries in `ledger_truth_model.md` would have 6x'd the
Step 12a scope at full template depth (each Phase 1.1 entry
carries Class / Thrown by / Meaning / Caller action / HTTP status
/ Phase 2 evolution — roughly 15-30 lines). Wsl-claude chose
condensed-template (Class / Thrown by / Meaning / HTTP status
only) with an explicit note in the Code catalog paragraph
explaining the asymmetry. Orchestrator retroactively ratified
and filed full-depth expansion as item 26 (NEW, optional). The
asymmetry note is what makes the condensed choice honest — future
readers see that the Phase 1.1 entries are richer because they
were authored with time to spare during the Phase 1.1 closeout,
while the Arc A + Phase 1.5 additions shipped under the
mechanical-closeout constraint.

**Step 12b hallucinate-and-retract fired exactly as designed.**
Wsl-claude's prompt for 12b included the rule "if fewer than 4
full-suite failures close, stop and report three options with
trade-offs." Post-edit the count was 2 of 4 closed. Wsl-claude
stopped, reported Options A (ship partial, file new item) / B
(extend scope to fix the Cash polluter) / C (add comment + keep
failures). The orchestrator verified wsl-claude's diagnosis
mechanism against the filesystem — caught that the framing
"cross-file Cash contention" implied concurrent writes but the
actual mechanism was **sequential + historical-dated window-
function interleaving**. Decision outcome (Option A) didn't
change, but the mechanism correction shaped item 27's fix-shape
framing: the fix isn't about concurrency primitives, it's about
migrating the affected tests to a less-polluted account.

**Arc A closed at 485/487 full-suite**. The 2 residual failures
are accountLedgerService tests 3 and 6 (filed as item 27; not Arc
A regressions). The visual gate (D12b-D — 3 screenshots for items
13 + 14) passed clean against a fresh `pnpm db:reset:clean &&
pnpm db:seed:all` state.

---

## 3. Patterns that emerged during execution

### Pattern 1 — Historical-count archaeology preservation

When an arc adds structural elements to a completed phase's
foundations, header counts should preserve the original phase's
closing count AND attribute the delta to the adding arc. Shape:
"20 Phase 0-1.1 + Arc A invariants," not "20 invariants."

Fired at Step 11 when updating `invariants.md` and
`control_matrix.md`. The original "18" was the Phase 1.1 closeout
snapshot — a historical moment when the first 18 invariants
reached their settled shape. Flattening to "20" in the headers
would lose that moment and make Arc A's +2 delta invisible. The
compound phrasing preserves both the snapshot and the delta.

Fire count: 1 (Step 11 header updates). Named for future recurrence
— the same decision shape will land whenever Arc B or later adds
structural elements to Phase 0-1.1 / Arc A counts. Below
codification threshold but worth naming so the next occurrence
doesn't need to re-derive the framing.

### Pattern 2 — UI-session screenshot gate as delegation discipline

When a step ships UI changes, the orchestrator drafts a
prescribed screenshot sequence (N shots with per-shot
verifications); the founder captures against a fresh
`pnpm db:reset:clean && pnpm db:seed:all` state; the orchestrator
spot-checks each shot against the prescribed verifications before
ratifying. The gate blocks arc / phase closeout until passed.

Fire count: 6 across Arc A (Steps 7, 8a, 8b, 9b, 10b, 12b —
D12b-D for items 13 + 14). Past any reasonable codification
threshold.

The mechanism: the orchestrator cannot run the dev server or take
screenshots, but can spec what the screenshots must show. The
founder has the runtime env but lacks bandwidth to specify
exhaustive verifications. The delegation threads both roles'
capabilities — orchestrator specifies, founder captures and
posts, orchestrator verifies. It works for the same reason
pre-delegation verification worked in Phase 1.1's subagent
pattern: the roles with complementary capabilities divide the
work along capability lines, and the handoff points are where the
verification discipline lands.

The pattern earns a CLAUDE.md rule per D-retro-C (C3). Draft text
proposed below (held for founder ratification on section
placement — no obvious existing section matches; see §5 friction
for the placement question).

### Pattern 3 — Running-balance + historical-dated entries + shared-DB integration testing fragility

Integration tests that query a window-function-computed
`running_balance` (or any temporal-accumulator aggregate) at
specific historical dates are fragile under shared-DB sequential
test suites when prior test files post historical-dated activity
to the same account.

Mechanism: the RPC's running_balance at `entry_date = T` is the
sum of entries dated ≤ T. When TestFileA posts activity dated
2026-01-15 and TestFileB posts activity dated 2026-01-10/15/20
assuming only its own entries populate those dates, TestFileB's
running-balance deltas shift by TestFileA's contribution. This is
NOT concurrent — vitest runs test files sequentially within a
single process against a shared database — it's sequential +
accumulated state.

Fix shape (documented for item 27 resolution): migrate affected
tests to a less-polluted account (account 1300 Short-term
Investments, per the `adjustmentEntry.test.ts` precedent from Step
9a). The less-polluted account is one that no other test file
touches, so the running-balance computation is deterministic with
respect to the test's own posts.

Fire count: 1 (accountLedgerService tests 3/6 at Step 12b). Worth
naming because the fix shape is formulaic and the pattern will
recur whenever a running-balance or as-of-date query gets
integration-tested against a promiscuously-shared account (Cash,
Share Capital, AP — the big five). Approaches 3-fire
codification threshold if analogous fragility surfaces in future
report tests.

### Pattern 4 — Orchestrator mechanism-verification of wsl-claude diagnoses

When wsl-claude reports a diagnosis for why something failed or a
deviation from spec, the orchestrator verifies the proposed
mechanism against the filesystem rather than accepting the
framing.

Fired at Step 12b: wsl-claude's initial diagnosis framed the
residual 2 failures as "cross-file Cash contention" — language
that implied concurrent writes. Orchestrator spec-check caught
that vitest runs test files sequentially and the real mechanism
was sequential + historical-dated window-function interleaving.
Decision outcome (Option A, ship partial and file new item)
didn't change, but the item's fix-shape framing changed from
"concurrency primitives" to "migrate to quieter account" — which
is materially different future work.

Fire count: 1 (Step 12b). Paired discipline with Pattern 5
below; together they form the self-correction loop of the
three-role workflow. Below codification threshold as a standalone
rule, but worth naming because the pairing is load-bearing.

### Pattern 5 — Wsl-claude hallucinate-and-retract working as designed

Wsl-claude prompts include explicit "flag and stop if X" rules.
When X triggers, wsl-claude stops execution, surfaces the
condition and available options with trade-offs, and waits for
orchestrator or founder ratification.

Fire count: 1 clean fire (Step 12b — "fewer than 4 closed" → stop
+ report three options). The discipline worked better than
"wsl-claude uses best judgment" would have. Forcing the stop made
the trade-offs surface explicitly for founder ratification rather
than wsl-claude choosing silently. The Option A outcome was
defensible either way, but the founder-ratified framing is the
one that carried through to the commit message and item 27's
filing.

This is a positive-pattern naming — the non-silent partial-close
shape that keeps the three-role workflow tractable. Codification
threshold for positive patterns is murkier than for drift
patterns, but the discipline is already encoded in the prompt
structure itself.

### Pattern 6 — Literal-code-for-contracts, prose-for-behavior (carried forward from Phase 1.1)

Phase 1.1 named this in its own retrospective. Arc A reinforced
it. Prompts that specified replacement code verbatim (Step 12b
test rewrites, Step 10a CHECK constraint DDL, Step 9a three-layer
Zod/service/DB enforcement code) had zero structural drift.
Prompts that specified behavior in prose (Step 10b UI shape, Step
9b canvas directive additions) also had clean execution because
the codebase had strong enough existing patterns for wsl-claude
to mirror.

The single near-failure mode in Arc A was Step 10b's
`<LineEditor />` extraction. The prompt specified a generic-typed
component contract (`UseFieldArrayReturn<TFieldValues, 'lines'>`),
which turned out not to compile across the three consumer forms
because `'lines'` didn't satisfy `ArrayPath<TFieldValues>` uniformly.
Wsl-claude's fallback — the prompt explicitly pre-authorized a
load-bearing `any` at the public API boundary — avoided a halt.
The pattern-name candidate is **load-bearing `any` at cross-
consumer extraction boundaries** (below codification threshold at
1 fire, but worth tracking because the shape will recur whenever
generic types break across consumers in the same session).

### Pattern 7 — Stash-and-rerun regression attribution

When a gate check goes red mid-session after a stash operation,
the regression might be from the in-progress changes OR from
pre-existing dirt that was now visible. Attribute carefully.

Fire count: 2 in Arc A (Step 10a and Step 10b both used the
stash-verify-unstash cycle to confirm that full-suite failures
were pre-existing rather than regressions from the in-progress
work). Phase 1.1's "baseline-delta integration test pattern" is
the analog for test-authoring; this pattern is the analog for
test-debugging mid-session.

Approaching 3-fire codification threshold. If the stash-verify
pattern fires again in a future arc, it earns convention status
and a CLAUDE.md entry alongside the existing Category A floor
discipline.

### Pattern 8 — File-top comment staleness when body is edited

File-top comments describing a file's purpose or structural
context tend to drift when the file body is edited without the
comment being reviewed. Fired twice in Arc A:

- **Step 9b**: `AdjustmentForm.tsx` file-top comment claimed "Line
  editor JSX copy-pasted from JournalEntryForm (Step 9b; Step 12
  queue item 17 tracks the eventual extraction)" after 10b's
  extraction landed. Caught at Step 12a (item 23).
- **Step 12b**: test-file headers described pre-rewrite
  assertion shapes ("empty-seed shape pin" language still
  implying the absolute-value assertion) after the assertions
  were rewritten to shape pins. These comments were updated in
  the same Step 12b commit, but the staleness window between the
  rewrite and the comment update is the pattern fire.

Fire count: 2. Approaching 3-fire threshold. Candidate
convention at threshold: "commit-time review of file-top
comments for any file whose behavior body was edited."

### Pattern 9 — Wsl-claude scope-adjacent judgment within bounded tasks

Wsl-claude executing tightly-bounded tasks occasionally makes
small scope-adjacent additions when thematic coherence is
obvious. Orchestrator post-ratifies or asks for revert.

Arc A fires:
- **Step 12a item 19**: the prompt prescribed a new
  "Phase 2 obligations carried forward by Arc A" subsection in
  `obligations.md` with the approveRun atomicity note. Wsl-claude
  added a second bullet under the same subsection covering the
  per-code catalog drift-prevention rule. The second bullet
  wasn't in the prompt but fit the subsection's theme. Orchestrator
  retroactively accepted.
- **Step 12a item 21**: the prompt prescribed an
  ADR-0010 intro-tense fix. Wsl-claude also expanded the
  cross-references bullet for the shipped migration with more
  detail (unconditional scoped CHECK framing, distinct-from-
  discriminator-scoped note). Richer than prescribed;
  orchestrator retroactively accepted because the addition
  preserved the discipline of documenting the ADR variant at the
  ADR.

Fire count: 2. Below codification threshold but distinct from
scope creep: the additions add value without expanding edit
footprint meaningfully and maintain thematic coherence. The
safety valve is orchestrator retroactive ratification — wsl-claude
gets judgment space within a ratification boundary rather than
silent autonomy. Pattern worth naming so future orchestrator
reviews explicitly check for coherent-but-unprompted additions
rather than treating them as scope violations by default.

---

## 4. Obligations for the next Arc (or Phase 2)

Arc A carries forward the following items into the next arc's
scope or Phase 2 planning.

**Session-12 queue active items**:

- **Item 22**: shared `<Modal>` component extraction. Below
  codification threshold (single consumer — `RecurringRunListView`
  reject modal from Step 10b). If a second consumer ships a
  modal (reversal confirmation, template-line bulk edit, any
  other dialog flow), the threshold is met and the extraction
  becomes the next LineEditor-shaped session.

- **Item 26**: full-depth expansion of the 37 condensed
  `ServiceErrorCode` catalog entries in `ledger_truth_model.md`
  §Structured Error Contracts. Optional. The condensed template
  is honest about its asymmetry; full-depth expansion is polish.

- **Item 27**: `accountLedgerService` tests 3/6 running-balance
  window-function interleaving under shared-DB full-suite. Fix
  shape known (migrate to less-polluted account, 1300 precedent).
  Deferred; Arc A closed at 485/487 full-suite per isolation-
  contract framing. Resolution is a prerequisite for "clean
  full-suite green" if push-readiness requires it, or it remains
  deferred if push-readiness accepts the isolation-contract
  framing.

**Arc A Phase 2 carry-forwards** (recorded in `obligations.md`):

- Recurring-journal automated scheduler (pg-boss). Brief §2.2
  Phase 2 scope. Arc A shipped the data model and manual path;
  the scheduler trigger is the Phase 2 addition.

- `auto_post` flag consumption. The column exists and is
  accepted as input; no Phase 1 service path consumes it. The
  Phase 2 scheduler is its first consumer.

- `approveRun` atomicity hardening. Deferred as a uniform service-
  layer concern, not a one-off. If Phase 2 judges atomicity
  valuable for the scheduler path, the fix shape is a PL/pgSQL
  RPC `approve_recurring_run(run_id, ...)` applied consistently
  across the service layer, not a one-off for approveRun.

- Per-code catalog drift-prevention discipline. The Step 12a
  obligations.md subsection second bullet: Phase 1.2 and beyond
  should extend `ledger_truth_model.md` §Structured Error
  Contracts in-step with each new code addition rather than
  accumulating drift.

---

## 5. Meta-observations on the three-role workflow

Arc A was the first arc executed under the orchestrator +
wsl-claude + founder three-role workflow. The roles divide as
follows: **founder** sets scope and ratifies; **orchestrator**
drafts prompts, verifies state, spot-checks commits, surfaces
decisions for ratification; **wsl-claude** executes within
bounded prompts and stops at ratification gates.

### What's working

- **Orchestrator mechanism-verification catches wsl-claude
  diagnostic drift before it lands in decisions.** Fired cleanly
  at Step 10a (atomicity framing) and Step 12b (contention
  framing). Without the verify-against-filesystem discipline,
  the wrong decisions would have landed and their correction
  would have been a later session.

- **Wsl-claude hallucinate-and-retract keeps the workflow non-
  silent at partial-close points.** The 12b fire is the
  canonical example: wsl-claude could have silently shipped the
  partial fix with some rationalization, but the explicit "stop
  and report N options" rule forced the trade-offs to the
  founder for ratification.

- **Founder-performed screenshot gates thread orchestrator and
  founder capabilities** without requiring either role to have
  both. The pattern fired 6 times in Arc A with clean handoffs
  each time.

- **Spec-code verbatim in prompts + prose for behavior splits
  the labor correctly.** Carried from Phase 1.1; reinforced
  across Arc A. Zero structural drift on verbatim-code edits
  (migrations, CHECK constraints, Zod schemas, test rewrites).
  Near-clean execution on prose-specified behavior when the
  codebase had strong existing patterns to mirror.

- **Retroactive ratification of scope-adjacent judgment (Pattern
  9).** Gives wsl-claude useful authority — the ability to add
  coherent context to a prompt-prescribed edit — without opening
  unlimited scope. The orchestrator's review step is the safety
  valve.

### Friction

- **Session-init discipline forgotten once** (Step 12b start;
  caught post-hoc via the coordination warning on commit). No
  hard failure, but session-lock discipline was absent for that
  commit. If this recurs, tighter enforcement is needed —
  possibly wsl-claude should refuse to proceed past Step 0 if
  the session-init check hasn't been performed, rather than
  emitting a warning at commit time.

- **Context budget management required two split-session
  decisions** (Step 10 → 10a/10b; Step 12 → 12a/12b). The split
  pattern worked but requires orchestrator foresight about
  wsl-claude's context usage. The orchestrator doesn't have a
  direct view into wsl-claude's context budget mid-session, so
  splits are decided based on file-count heuristics. Possible
  refinement: wsl-claude reports context budget at step-close,
  not just at session-end, so the orchestrator can plan splits
  proactively rather than reactively.

- **File-top comment drift (Pattern 8) suggests tight edit
  scopes miss cross-cutting review items.** A looser scope
  might catch them, but looser scope risks drift on other
  axes. The specific mitigation is a "last-mile" scan in
  prompts: "verify that unchanged files near edited ones don't
  have stale references to the pre-edit state." This would
  have caught the AdjustmentForm file-top comment earlier.

- **CLAUDE.md section placement for new conventions is
  underspecified.** The retrospective earned a UI-screenshot-gate
  rule per Pattern 2, but CLAUDE.md's existing sections don't
  have an obvious placement slot for a per-step procedural gate.
  Options: add a new "Session execution conventions" section
  (founder decision); fold the rule into the existing "What
  'done' means" section as a fourth bullet; hold the rule in a
  separate conventions doc outside CLAUDE.md. Held for founder
  ratification.

### Unresolved meta-questions for the next arc

- **Should screenshot gates be run BEFORE commit (shifts failure
  left) or AFTER (currently)?** Trade-off between commit-chain
  cleanliness (commit only after screenshot pass) and early-
  failure-detection (commit first, then gate — failures roll
  back via amend or revert). Arc A used the after-commit shape
  throughout; the trade-off wasn't tested against the
  before-commit shape.

- **Should wsl-claude explicitly report context budget at every
  step-close** in addition to session-end? Would help
  orchestrator plan splits proactively. Costs one extra
  reporting line per step; benefit is clearer visibility.

- **Item 26 / 27 carry-forward mechanism — Phase 2 brief inputs
  or standalone follow-up sessions?** Both items have known fix
  shapes and are unblocked; the question is whether they earn
  their own session or fold into the Phase 2 scope. Founder
  call, depending on Phase 2 brief authorship timing.

---

## 6. Honest limitations of this retrospective

Arc A retrospective is written from the orchestrator's seat. I
saw what the orchestrator saw — state-check outputs, resume-
prompt drafts, wsl-claude's commit summaries, founder
ratifications. I did not see wsl-claude's internal deliberation
during prompt execution; the "wsl-claude would have implemented
literal atomicity-via-RPC" claim at Step 10a D10-D is a
counterfactual about what the unflipped prompt would have
produced, not a direct observation of what happened.

The three-role workflow description assumes the roles are
distinct entities. They are distinct conversation sessions but
not distinct competences — the orchestrator and wsl-claude are
both Claude instances reading different context windows. The
"roles" pattern observations are about workflow structure, not
about different-agent capabilities. A future refactor of the
three-role workflow that uses one session instead of two would
lose the context-budget-driven split discipline but might gain
tighter feedback loops; the trade-off is not evaluated here.

The pattern fire-count heuristic (3 fires earns codification)
is a working assumption, not a tested rule. Arc A had multiple
patterns at 1-2 fires that plausibly deserve codification
earlier (historical-count archaeology, orchestrator mechanism-
verification) and at least one pattern at 6 fires where the
codification mechanism itself is underspecified (screenshot
gate — no clean CLAUDE.md placement). Future arcs may refine the
codification threshold.

Arc A is 14 commits of code plus 2 discipline-meta commits plus
this retrospective. The Phase 1.1 retrospective's self-audit
caveat applies here too: I'm selecting which patterns to
highlight and which to minimize. A second reader should check
whether Pattern 3 (running-balance fragility) and Pattern 9
(scope-adjacent judgment) were genuinely the interesting
patterns or whether I'm overweighting them because they shaped
Step 12b's decisions and are fresh.
