# ADR-0008: Layer 1 Enforcement Modes — Commit-Time (1a) vs. Scheduled Audit (1b)

> **Numbering note.** This ADR was drafted as ADR-0007 and
> renumbered to ADR-0008 before landing because ADR-0007 is
> reserved for the agent-architecture policy ADR (blocked by
> Q27–Q31 in `docs/02_specs/open_questions.md` and sketched
> in `docs/09_briefs/phase-2/agent_architecture_proposal.md`).
> The two ADRs are orthogonal in scope — agent-architecture
> policy does not interact with Layer 1 enforcement modes —
> and the renumber is mechanical. Kept here as a breadcrumb
> so the first reader doesn't double-check the sequence.

## Status

Accepted

## Date

2026-04-21

## Triggered by

External CTO architecture review cycle (April 2026). The review
compared chounting against LedgerSMB and then against the external
CTO's independent framing. Two load-bearing observations from the
cycle motivated this ADR:

1. **Not every invariant can be feasibly enforced at write time.**
   Cross-aggregate sums (a subsidiary-ledger control-account
   reconciliation, a checkpoint-vs-ledger equality) cannot be
   checked by a row-level trigger without prohibitive write-path
   cost. Yet they *are* physical — they live in the database, not
   in the service layer — and they *are* load-bearing for
   accounting correctness.
2. **LedgerSMB's audit-scan pattern (`docs/07_governance/audits/`)
   already exists in chounting as a discipline** — the
   `audit-scans` skill, the `docs/07_governance/audits/prompts/`
   directory — but the pattern has no home in
   `ledger_truth_model.md`. The Layer 1 section assumes every
   physical invariant is enforced synchronously at commit. It is
   not. The model needs language for the other mode.

See the 2026-04-21 friction-journal entry for the full review
cycle (sections A through E) and the Phase 2 priority ordering
that emerged from it.

## Context

The four-layer model in `docs/02_specs/ledger_truth_model.md`
describes the authority gradient (*agents propose, services
decide, the database enforces*) and groups invariants into:

- **Layer 1 — Physical Truth**: the database enforces
- **Layer 2 — Operational Truth**: services decide
- **Layer 3 — Temporal Truth**: events as source of truth (no
  active invariants in Phase 1.1)
- **Layer 4 — Cognitive Truth**: agents propose (no enforcement
  invariants by design)

The 11 Phase 1.1 Layer 1 invariants (INV-LEDGER-001 through 006,
INV-MONEY-002/003, INV-IDEMPOTENCY-001, INV-RLS-001,
INV-REVERSAL-002) are all enforced at write or commit time by
CHECK constraints, triggers, or RLS policies. The model's implicit
assumption is that every Layer 1 invariant follows this pattern.

Phase 2 will introduce invariants that do not fit:

- **Checkpoint vs. ledger reconciliation.** A Phase 2
  `account_checkpoint` table records per-account balances at
  period close. The rule is "sum of `journal_lines` with
  `entry_date` on or before the checkpoint equals
  `account_checkpoint.amount` for that account." Checking this
  invariant on every journal-line insert would require the
  trigger to re-sum the entire line history for the affected
  account, which is O(n) per insert and catastrophic for any org
  with meaningful history.
- **Subsidiary-ledger tie-out.** A Phase 2 subsidiary ledger
  (bills against AP control account, invoices against AR control
  account) adds the rule "sum of open subsidiary balances equals
  the control-account GL balance." This is a cross-aggregate sum
  across two tables; it cannot be a row-level trigger, and a
  transaction-level deferred constraint would require re-summing
  both aggregates on every commit.
- **Cross-aggregate reconciliation generally.** Bank-rec sum
  matching, inventory COGS conservation (purchased = sold),
  intercompany batch balance — any rule that relates two
  aggregates rather than two columns on the same row — has the
  same shape.

LedgerSMB addresses the same class of rule with audit queries
(`docs/07_governance/audits/prompts/*.md` in their codebase)
that run on a schedule and report violations after the fact. The
rule is *physical* (it operates on database state, not service
state) but *detected, not prevented*. This is a sound engineering
tradeoff for this class of invariant — the alternative is
dropping the invariant or accepting a write-path cost that makes
the system unusable.

chounting has already absorbed the audit-scan pattern — the
`audits/prompts/` directory, the `audit-scans` skill — but the
pattern has no formal place in the authority gradient. A new
contributor reading `ledger_truth_model.md` and
`docs/07_governance/audits/` sees two apparently-different
enforcement mechanisms and no unifying framework.

The choice is:

- Leave Layer 1 monolithic and add an `enforcement_mode` tag to
  each invariant leaf (`commit-time` vs. `scheduled-audit`).
- Split Layer 1 into **Layer 1a (commit-time physical)** and
  **Layer 1b (scheduled physical / audit scan)**, making the
  distinction structural rather than metadata.
- Collapse audit-scan invariants into Layer 2 or create a new
  Layer 5.

## Decision

Split Layer 1 into two sub-layers, both physical:

- **Layer 1a — commit-time physical.** Invariants enforced by
  CHECK constraints, BEFORE/AFTER triggers, DEFERRABLE
  CONSTRAINT TRIGGER, or RLS policies. Evaluated synchronously
  during the write path or at transaction `COMMIT`. Violations
  are prevented. A violating DML statement cannot commit. All 11
  current Phase 1.1 Layer 1 invariants are Layer 1a.
- **Layer 1b — scheduled physical (audit scan).** Invariants
  enforced by SQL queries stored under
  `docs/07_governance/audits/prompts/` and executed by a
  scheduled job or on-demand by the audit-scans skill. Evaluated
  asynchronously on a cadence (daily, weekly, per-period-close).
  Violations are detected and reported, not prevented. The audit
  job is the enforcement mechanism; the prompt file is the
  canonical definition.

Both sub-layers are Layer 1 because the rule operates on
database state and is independent of service-layer code. A rogue
DML statement from psql cannot bypass a Layer 1a CHECK
constraint; neither can it evade a Layer 1b audit scan running
that week. The difference is *latency*: 1a catches violations
before commit; 1b catches them by the next scheduled run.

The authority gradient semantics are unchanged. Both 1a and 1b
sit below Layer 2; Layer 2 cannot override either. A service
function that computes a cross-aggregate value and writes it
into a row without running the 1b check still has to pass every
1a check on the row itself, and the 1b scan still runs on its
own schedule regardless of what the service layer thought it
knew. The lower-wins rule holds within Layer 1 as well: if 1a
rejects a row, 1b is never reached for that row.

**When a new invariant is Layer 1a vs. Layer 1b.** Three tests:

1. **Is the rule evaluable on a single row, or on rows inserted
   within a single transaction?** If yes and the cost is
   bounded, it is Layer 1a. If no (the rule relates two
   aggregates, two tables, or history older than the current
   transaction), it may need to be Layer 1b.
2. **Is the synchronous evaluation cost acceptable?** A CHECK
   constraint or a row-level trigger that runs in microseconds
   is fine. A trigger that must re-aggregate a year of
   `journal_lines` on every insert is not. If the
   synchronous-cost answer is "no, this breaks the write
   path," it is Layer 1b.
3. **Is a scheduled-audit cadence adequate for the business
   guarantee?** Debit = credit per journal entry needs to be
   enforced *now*, because an unbalanced entry is never
   acceptable and detection at the end of the day is too late.
   Subsidiary tie-out needs to be *consistent at close*, and a
   daily or per-period-close cadence is acceptable — month-end
   close is the ritual that turns 1b detection into 1a-grade
   guarantee. If the cadence question's answer is "yes, a
   scheduled check with documented cadence is adequate," 1b is
   the right home.

All three tests have to align. A rule that is cheap to evaluate
synchronously (test 2 passes) but only meaningful as an
aggregate (test 1 fails) is Layer 1b — the synchronous variant
would be a per-row version that does not enforce the rule the
business cares about.

**Documentation updates applied with this ADR.** The
`ledger_truth_model.md` Authority Gradient table is updated to
show Layer 1a and Layer 1b as distinct rows. A "Phase 2 Reserved
Invariants" subsection is added at the end of Layer 1 with three
stubs (INV-CHECKPOINT-001 as Layer 1b, INV-SUBLEDGER-LINK-001 as
Layer 1a, INV-SUBLEDGER-TIEOUT-001 as Layer 1b). The 17 Phase
1.1 invariants remain numerically unchanged; their classification
updates from "Layer 1" to "Layer 1a."

## Consequences

**What this enables.**

- Phase 2 briefs that introduce cross-aggregate invariants
  (checkpoint reconciliation, subsidiary tie-out, bank-rec sum
  matching) have a named enforcement mode to pick from rather
  than a choice between "prohibitive write cost" and "drop the
  invariant."
- The audit-prompt pattern (markdown file + YAML frontmatter +
  SQL body, currently used under `docs/07_governance/audits/`
  for codebase-architecture scans) gains a formal tie to the
  truth model as the shape of a Layer 1b enforcement mechanism,
  mirroring how a CHECK constraint or trigger is the shape for
  1a. The exact directory under which Phase 2 Layer 1b prompts
  live is a layout decision the first Layer 1b brief makes —
  see the audits-directory reference in the Cross-references
  block below.
- Future external reviews that compare chounting to detection-
  based ledgers (LedgerSMB, legacy ERPs) have vocabulary to
  explain why the two systems look different in the write path
  but can converge on the same set of guarantees.

**What this constrains.**

- Contributors now have to correctly classify new Phase 2
  invariants as 1a or 1b when drafting them. The three tests
  above are the decision rule. Misclassification has cost: a
  1b invariant mis-declared as 1a lands a trigger that either
  does not scale or does not actually enforce the rule; a 1a
  invariant mis-declared as 1b ships a rule that the database
  could have prevented and instead merely detects.
- Layer 1b requires a scheduled execution mechanism. Phase 2
  must build or specify the scheduler (pg-boss, a cron, a
  CI-triggered job) that runs the audit prompts. The ADR does
  not prescribe which; the `audit-scans` skill and
  `audits/prompts/` give the content, not the runner. Phase 2's
  events-projection work (Simplification 1 and 2 corrections)
  is the natural place to address this, since pg-boss lands in
  Phase 2 for the events projection.
- Layer 1b invariants are *eventually correct*, not
  *synchronously correct*. An hour of incorrect subsidiary
  tie-out between a mutation and the next scan is possible. This
  is acceptable for the invariants classified as 1b because they
  are about aggregate consistency, not about any single
  transaction's legality — but it does mean a reader of the
  database between audit runs might see a transient violation.
  The audit prompt's comment block must state the cadence under
  which it runs, so the window is explicit.

**Cost honestly.** The split adds one category for contributors
to learn. It also makes the truth model marginally more complex
to skim. The alternative (a monolithic Layer 1 with metadata
tags) is simpler to skim but harder to reason about — an
invariant with `enforcement_mode: scheduled-audit` tucked inside
a leaf that otherwise reads like a CHECK-constraint spec is
easier to miss than a leaf that lives in a section titled "Layer
1b." The split is a conscious choice to surface the distinction
in structure rather than metadata.

## Alternatives considered

**Keep Layer 1 monolithic; add an `enforcement_mode` field on
each invariant leaf.** Rejected. The distinction between
prevention and detection is load-bearing enough that it deserves
structural representation, not a metadata tag. A reader skimming
for "what Layer 1 invariants exist?" would see every leaf in one
section and have to read each leaf's metadata to understand which
are prevented and which are detected. Structural separation makes
the mode unmissable.

**Collapse Layer 1b into Layer 2 (service-enforced).** Rejected.
Audit scans are not service code. They run outside any service
call, outside any request context, on a schedule. Classifying
them as Layer 2 would claim that services enforce them, which is
false: services do not schedule or execute the scans, and the
scans operate on database state that has already been committed
through the service layer. The distinguishing property of Layer
1 is "enforced by the database itself, independent of the
service layer's correctness" — audit scans satisfy that property.

**Introduce a new Layer 5 for scheduled audits.** Rejected.
Adding a fifth layer would imply scheduled audits are a
fundamentally different category of truth from commit-time
physical enforcement. They are not. Both mechanisms verify
properties of database state; both are physical; both operate
independently of the service layer. Layer 5 would be numerically
wrong (scheduled audits sit between Layer 1 and Layer 2 in the
authority gradient, not below Layer 4) and semantically wrong
(the gradient is *agents propose, services decide, database
enforces* — scheduled audits are database enforcement, just on a
different cadence). The 1a/1b sub-layer structure is the correct
granularity.

**Build Phase 2 invariants as Layer 1a triggers and accept the
write-path cost.** Rejected. The cost is not theoretical. A
trigger that re-aggregates `journal_lines` on every insert turns
a 10ms journal-entry post into a 2-second post once the org has
a year of history. Phase 1.1 already documents (Simplification
1, Simplification 2) that synchronous enforcement of some rules
is a temporary choice; extending synchronous enforcement to
rules where it is clearly wrong would repeat that mistake with
less excuse.

## Cross-references

- **`docs/02_specs/ledger_truth_model.md`** — Authority Gradient
  table (Layer 1a / Layer 1b rows), "Phase 2 Reserved
  Invariants" subsection at the end of Layer 1 (three stubs with
  explicit mode classification).
- **`docs/07_governance/friction-journal.md`** — 2026-04-21
  entry recording the external CTO review cycle, the Phase 2
  priority ordering, and the pushback on `journal_type` as a
  Tier 1 item.
- **`docs/07_governance/audits/`** — existing audit-framework
  directory. Today it holds codebase-audit scan prompts (under
  `audits/prompts/`) dispatched by the `audit-scans` skill. The
  Layer 1b invariant-query prompts introduced in Phase 2 follow
  the same markdown-file pattern (YAML frontmatter + SQL body,
  inherited from LedgerSMB's `audits/prompts/` convention) but
  describe different subject matter (SQL invariant queries vs.
  Claude-dispatched code scans). Whether Layer 1b prompts live
  alongside the existing codebase scans (same directory,
  different content) or in a sibling subdirectory
  (`audits/invariants/` for example) is a Phase 2 layout
  decision deferred to the brief that introduces the first
  Layer 1b invariant. This ADR reserves the *pattern*, not the
  exact path.
- **`docs/03_architecture/system_overview.md`** — "Model Context
  — Ledger Infrastructure vs. ERP" section added in the same
  commit, which explains why chounting's Layer 1 rigor and its
  Phase 2 backlog of domain modules both follow from the
  Model-B-core-on-a-Hybrid-trajectory position.
- **`docs/03_architecture/phase_simplifications.md`** — the
  Simplification 1 and 2 corrections (audit log projection,
  events table activation) are the Phase 2 infrastructure that
  Layer 1b's scheduled-execution mechanism plugs into.
- **`.claude/skills/audit-scans/SKILL.md`** — existing skill for
  codebase-audit dispatch. Phase 2 may extend it to also run
  Layer 1b invariant queries, or introduce a sibling skill;
  that choice follows the directory-layout decision above.
