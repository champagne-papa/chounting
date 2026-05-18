# Iterative-catching conventions

Runtime coordination discipline; gates and verifications fired during
execution (commit-time, approval-time, paste-time, environmental-
re-verify-time). These rules catch drift between sides (operator ↔
executor; planner ↔ executor; agent ↔ agent) before it propagates
into committed state.

See [`README.md`](./README.md) for the sub-folder routing rule and
the broader [`../README.md`](../README.md) for the topical routing
rule.

---

## Check HEAD before Step 2 Plan

Before writing a Step 2 plan, an agent MUST run:

```bash
git log --oneline -10
```

and confirm HEAD matches the baseline the prompt was written
against. If HEAD has moved since the prompt was written (new
commits are present that the prompt does not reference), STOP
and report before planning. Do not silently reconcile.

Rationale: concurrent Claude Code sessions under the same git
identity can interleave commits on the same branch. A Step 2
plan written against stale HEAD will duplicate or conflict with
work already landed. This check is cheap (one tool call) and
prevents the entire class of "I found a commit I didn't author"
incidents. First observed: 2026-04-22, Phase C of O3 — Phase C
agent discovered 78e9f0d already at HEAD, committed 14 minutes
earlier by a parallel session working the same plan.

---
**Origin:**
- First codified: Phase 1.2, 2026-04-22 (Phase B arc consolidation),
  commit `c24d69d`
- Evidence basis: N=1 first-instance precedent (O3 Phase C parallel-
  session commit interleave)
- Promoted from: Phase B arc consolidation
- Cross-references:
  `docs/07_governance/friction-journal/phase-1.2.md` Phase C; Session
  Lock File Convention (below)

---

## Re-verify Environmental Claims at Each Gate

At every gate that depends on environmental state —
commit-time, pre-approval, phase-boundary — an agent MUST
re-verify the relevant state immediately before the gate
fires, regardless of what was true at plan time or at a prior
checkpoint. This applies to working-tree cleanliness,
test-floor state, evidence preservation, and any other
environmental fact a commit body, approval request, or
checkpoint assertion claims. Prior-checkpoint framing is
context-window truth; only verification at the gate itself is
gate-time truth.

Rationale: parallel actors (the operator running concurrent
sessions, background processes, migration workflows) can
change the environment between gates an agent passes through;
equally, an agent's own assumptions about its execution
environment can be wrong from the start without any other
actor running anything at all. Three datapoints in the O3
execution arc demonstrated the cost of carrying or making
environmental assumptions without gate-time verification:
(1) working-tree drift at Phase B pre-Commit-1 (the plan's
clean-tree preamble was untrue at execution time because
in-progress parallel work was in the tree); (2) commit-body
staleness at O3 Site 1 (commit `6c407e7`'s body claimed
"Pre-O3 uncommitted Phase B Prompt 4 work remains in working
tree untouched" — already false at commit time because the
parallel work had been committed 14 minutes earlier);
(3) environment-inference at Phase D D2.6 (the executor
inferred its bash tool ran in a sandbox separate from the
operator's WSL instance, when it was actually running on the
same machine; the inference was corrected when the operator
flagged the actual environment before the server-stop command
ran). Pairs with "Check HEAD before Step 2 Plan" — same
parallel-commit-robustness pattern at the plan-time gate;
this convention covers commit-time, approval-time, and
phase-boundary gates plus the agent's own pre-action
environmental assumptions. First observed: 2026-04-22, O3
execution arc; full analysis in
`docs/07_governance/friction-journal/phase-1.2.md` Phase C section (c)
under "Plan-time-discipline family" and
"Symmetric-application datapoints."

---
**Origin:**
- First codified: Phase 1.2, 2026-04-22 (Phase C ratification pass,
  retro), commit `a610e0e`
- Evidence basis: N=3 datapoints in O3 execution arc (working-tree
  drift; commit-body staleness; environment-inference)
- Promoted from: O3 execution arc
- Cross-references: Check HEAD before Step 2 Plan (above);
  `docs/07_governance/friction-journal/phase-1.2.md` Phase C
  section (c)

---

## Preservation and Ambiguity Gates

Preservation gates (check-time verifications that depend on
named environmental state having been preserved from a prior
point) must verify state at check time rather than reason
from inverse-of-action, because the executor cannot bind all
actors who could affect the state, and because reasoning
from absence-of-recalled-action to presence-of-expected-state
is inferentially unsound regardless of actor authority. When
gates surface unexpected or ambiguous state, document the
ambiguity into the analysis rather than erase it to restore
gate-cleanliness; the ambiguity is signal, not noise.
Remediations: (i) resume-prompt preservation claims should
include a side-note to the operator (or a
snapshot-at-session-start step for the executor), not just
an instruction to the executor; (ii) cleanliness checks that
fail should trigger investigation-and-document rather than
clean-to-restore.

Rationale: three datapoints in the O3 execution arc
triggered codification — (1) log-absence at Phase A
(resume-prompt-stated `~/chounting-logs/` paths not present
at execution time); (2) working-tree drift at Phase B
pre-Commit-1 (in-progress parallel work in the tree
violated the plan's clean-tree assumption); (3) C11
forensic-evidence wipe at Phase D pre-approval gate
(operator's parallel migration workflow ran
`pnpm db:reset:clean`, wiping `agent_sessions f27a3878...`
rows the resume prompt assumed preserved). The pattern
across all three: preservation assumptions stated as
instructions to the executor cannot bind other actors, and
inverse-of-action reasoning is unsound regardless of actor
authority. See also "Erase-to-Clean vs. Document-to-Verify"
for the broader meta-principle. First observed: 2026-04-22,
O3 execution arc; full retrospective in
`docs/07_governance/friction-journal/phase-1.2.md` Phase C section (b).

---
**Origin:**
- First codified: Phase 1.2, 2026-04-22 (Phase C ratification pass,
  retro), commit `a610e0e`
- Evidence basis: N=3 datapoints in O3 execution arc (log-absence at
  Phase A; working-tree drift at Phase B; C11 forensic-evidence
  wipe at Phase D)
- Promoted from: O3 execution arc
- Cross-references: Erase-to-Clean vs. Document-to-Verify (below);
  Re-verify Environmental Claims at Each Gate (above);
  `docs/07_governance/friction-journal/phase-1.2.md` Phase C
  section (b)

---

## Erase-to-Clean vs. Document-to-Verify

When either the operator or the executor reaches for an
erase-to-clean shortcut to resolve ambiguity or exonerate
action — deleting test pollution to restore gate-cleanliness,
inferring "no action of mine" from absence-of-recall,
re-offering a previously-ratified decision as an open option
— the shortcut must be overridden in favor of documenting
the ambiguity into the analysis. The discipline applies to
whichever side reaches first; whichever side catches it —
whether the other actor or the actor themselves — must
surface rather than let the shortcut stand.

Rationale: three instances within a single execution arc
(O3) demonstrate the pattern is not Claude-specific.
(1) C6 evidence attribution: "no action of mine" framing
applied inverse-of-action reasoning to self-exonerate
without verifying via audit-log triangulation. (2) D2.2
row-count cleanup: lean toward DELETEing test-pollution
journal entries to restore gate-cleanliness, when a
documented timestamp filter would have made them trivially
distinguishable. (3) Playwright-options-re-offered:
presenting a previously-ratified decision (operator drives
browser manually) as an open choice (Claude could drive via
Playwright) without new evidence, re-opening
approval-granularity that was already settled. Each
instance was caught by reciprocity from the other side;
both sides remain susceptible. See also "Preservation and
Ambiguity Gates" for the gate-specific application of this
principle. First observed: 2026-04-22, O3 execution arc;
meta-pattern analysis in
`docs/07_governance/friction-journal/phase-1.2.md` Phase C section (c)
under "Meta-pattern family."

---
**Origin:**
- First codified: Phase 1.2, 2026-04-22 (Phase C ratification pass,
  retro), commit `a610e0e`
- Evidence basis: N=3 instances within O3 execution arc (C6
  evidence attribution; D2.2 row-count cleanup; Playwright-options-
  re-offered)
- Promoted from: O3 execution arc meta-pattern analysis
- Cross-references: Preservation and Ambiguity Gates (above);
  `docs/07_governance/friction-journal/phase-1.2.md` Phase C
  section (c) under "Meta-pattern family"

---

## Mutual Hallucination-Flag-and-Retract Discipline

Either the planner or the executor can produce content —
sub-brief prose, commit bodies, causal attributions,
rationale statements — that survives internal consistency
checks but is wrong against the shipped codebase, the
actual execution environment, or the actual sequence of
events. When either side catches the other, or catches
itself, the discipline is to flag explicitly and retract
to the correct claim rather than paper over with a
compatible-sounding revision. The correction can come from
either direction; neither side is exempt.

This convention has two operational sub-tracks: a
**retraction sub-track** for post-claim correction
(catching wrong claims after assertion and explicitly
retracting), and an **EC-direction sub-track** for
pre-claim hygiene (rules governing how EC qualifies,
infers, and asks under uncertainty before claiming).
Both are operational phases of the same epistemic-
discipline-under-uncertainty practice — same operator
(Claude calibrating its epistemic state), different
temporal phase (pre-claim vs. post-claim). The
retraction sub-track was the codification-trigger
scope; the EC-direction sub-track was formally
introduced 2026-04-25 in the C6 closeout commit per
Phase E retrospective.

**Retraction sub-track datapoints** (8 priors
enumerated below as codification-trigger set,
including 2 S8 O3-arc datapoints #7–#8; mainline
retraction-track cumulative through 2026-04-25 C6
close = 12 — see
`docs/07_governance/friction-journal/phase-1.2.md` Phase E for
the running mainline ledger): eight datapoints across
Sessions 7.1 and the Session 8 O3 arc triggered
codification. Six from the
Session 7.1 thread: (1) **P20 prose tweaks** (7.1.1 design
pass) — founder added two precise tweaks to drafted prose;
planner drafted, founder flagged, planner ratified.
(2) **P21 rationale retraction** (7.1.1 design pass) —
planner drafted a rationale that grep-verification showed
didn't match the call sites; planner explicitly retracted
and re-stated. (3) **ValidTemplateId type redefinition**
(7.1.1 design pass) — planner proposed, founder asked for
external-caller grep, proceeded ratified only after
zero-caller evidence. (4) **Zombie dev-server
misdiagnosis** (7.1.2 EC-19 run) — planner misread `ps`
output and claimed a root-owned process held port 3000;
founder-instigated fresh logs exposed the error.
(5) **executing-plans skill review-gate bypass** (7.1.2) —
self-audit observation; the skill's workflow skipped the
founder review gate between implementation and commit.
(6) **7.1.2 sub-brief stale-phrasing observation** —
planner noticed the §4 `journalEntry.ts` bullet's stale
"data-testid selectors" phrasing and flagged rather than
papering over. Two additional datapoints from the O3 arc:
(7) **Working-tree drift at Phase B pre-Commit-1** (O3) —
the plan's clean-tree preamble was untrue at execution
time because a parallel session had in-progress Prompt 4
work in the tree; misread resolved by explicit authorship
triangulation via
`git log --format="%h %ai %an <%ae>"`.
(8) **Parallel commits during Phase C execution** (O3) —
commit `78e9f0d` landed from the O3 session while a
separate audit session was read-first for the same Phase C
scope; the `c24d69d` Check-HEAD convention fired correctly
on discovery.

**EC-direction sub-track datapoints** (7 datapoints;
sub-track formally introduced 2026-04-25 C6 closeout
commit; the 8 retraction-track priors enumerated above
are grandfathered as the codification-trigger set —
this commit introduces the sub-track structure
prospectively and does not retroactively reclassify
priors into sub-tracks):

- **EC-#1 EC verifies persistence via DB query, not
  stream observation.** Log presence is necessary but
  not sufficient evidence of DB write.
- **EC-#2 EC includes orphan `ai_action` contributions
  in cost estimates.** Visible operator-paste log-line
  traces understate actual spend when tool-calls
  produce orphans (no card rendered, no operator-paste
  resumption); cost from these is invisible to
  paste-line traces alone.
- **EC-#3 EC distinguishes operator-mitigated outcomes
  from agent self-recovery.** Visible traces alone
  cannot distinguish operator re-paste with explicit-
  anchor (mitigation) from agent self-correction; EC
  asks for operator-action narration before
  classifying outcome attribution.
- **EC-#4 Operator approval required before executing
  stale-handling SQL,** even when consultant ratifies.
  Pre-staged SQL is verified against live schema and
  check constraints by the executor; operator approval
  is the second gate before write.
- **EC-#5 EC requests operator-narration of intent
  before classifying any new agent-behavior pattern
  requiring operator intervention** (reject, re-paste,
  explicit-date anchor, or similar action).
- **EC-#6 EC reports cost estimates as lower-bound
  ranges when telemetry is incomplete** (log-line
  traces missing, orphan-line gap, or multi-paste
  behavior visible in operator screenshots).
- **EC-#7 EC qualifies inferences from DB-visible
  state with explicit "based on what's visible"
  framing.** For claims requiring filesystem,
  operator-action, or session-context beyond
  DB-visible state, EC asks rather than infers.

Source evidence for the 7 EC-direction sub-track
datapoints in `docs/07_governance/friction-journal/phase-1.2.md`
Phase E section (h) (2026-04-25 S8 C6 closeout).

**Scope — single-track commit flow binds the executor,
not the operator.** Single-track commit-flow discipline
applies to the current executor's commit flow only; it
does not prohibit the operator from committing parallel
work during an execution. Execution plans must be robust
to parallel operator commits landing during their run. Two
robustness requirements follow: (a) verify environmental
state at each commit-time gate rather than carrying state
assumptions from prior checkpoints (see also "Re-verify
Environmental Claims at Each Gate"); (b) write commit
bodies that claim only what is verifiable at commit time,
not what was true at the start of the phase. These
requirements were derived from the two O3 datapoints (7)
and (8) above.

**Tripwire semantics (retuned 2026-04-22).** The practical
tripwire on this discipline — when to halt and reassess
rather than continue — had been informally applied to
aggregate environmental surprises across a phase (N=3
unrelated environmental surprises = halt). The O3 arc
accumulated 4+ environmental surprises, each resolved in
a single diagnostic round with no cumulative degradation.
Retuned semantics: the threshold tracks iterations on the
same task rather than phase-total surprises. A single task
requiring more than 3 debug rounds is the degradation
signal; a phase accumulating 4+ unrelated environmental
surprises each resolved in one round is a noisy
environment, not degraded execution. Provenance: retune
derived from the O3 arc's own experience, made explicit on
2026-04-22 per Phase C section (c) in
`docs/07_governance/friction-journal/phase-1.2.md`.

First codified: 2026-04-22, as part of the deferred
Session 8 C9 codification (landed in the same commit as
Convention #9 and the governance-audit mechanism).
Sub-track structure introduced 2026-04-25 in the C6
closeout commit per Phase E retrospective. See
`docs/07_governance/friction-journal/phase-1.2.md` Session 7.1
retrospective and Phase C section for the codification-
trigger record; Phase E section (h) for EC-direction
sub-track source evidence.

---
**Origin:**
- First codified: Phase 1.2, 2026-04-22 (Phase C ratification pass
  + C9 codification)
- Evidence basis: N=8 retraction-track datapoints across Sessions
  7.1 and O3 arc; N=7 EC-direction sub-track datapoints (2026-04-25
  C6 closeout); grandfathered at 8 priors (above the N=3 threshold)
- Promoted from: Session 7.1 retrospective and Phase C section
- Cross-references: Re-verify Environmental Claims at Each Gate
  (above); Per-Entry Row-Card Pairing Post-Paste Verification (in
  [`../ai-agents.md`](../ai-agents.md));
  `docs/07_governance/friction-journal/phase-1.2.md` Session 7.1
  retrospective and Phase C section; Phase E section (h) for
  EC-direction sub-track source evidence

---

## Session Labeling Convention

Every prompt to an executor agent opens with a session label
naming the work arc in flight — `Session M — main ratification
arc`, `Session O — O3 implementation`, `Session P4 — Prompt 4
feature work`, or similar. The label persists across prompts
within a session and appears as a Git trailer on every commit
the session authors: `Session: <label>`.

Rationale: four concurrent-session failures on 2026-04-22
(commit interleave, DB state wipe, authorization race,
ratification bypass — see
`docs/07_governance/friction-journal/phase-1.2.md` Phase B subsection A
for the full record) and the explicit ad-hoc coordination
behavior in commit `9aaeeec` (parallel session authoring a
session-closeout that named four co-existing sessions on the
branch and held its own push under three named unhold
conditions) motivate formalizing what was already emerging as
a convention in the wild. Without session labels, concurrent
sessions leave no durable attribution at the commit level;
`git blame` can't distinguish which session produced which
commit, and post-hoc correlation requires reconstructing from
friction-journal narrative rather than reading `git log`.

Operating rules:
- **Operator** states the label in the first prompt of each
  new session. If the operator neglects to state one, the
  agent asks before proceeding to Step 2.
- **Agent** adds `Session: <label>` as a Git trailer on every
  commit it authors, placed just before the
  `Co-Authored-By: Claude …` trailer.
- **Resumed sessions** (a new conversation continuing a prior
  arc) re-initialize the lock via
  `bash scripts/session-init.sh <label>` at the start; agents
  read the fresh lock at Step 2 gate. A session continuing the
  same arc uses the same label; a session starting fresh uses
  a new label. Resumed sessions that find a stale lock follow
  the stale-lock recovery procedure in the Session Lock File
  Convention below.

The label also serves as the audit-trail dimension in the
Governance Audit table (each convention entry cites the
governance cycle; session-labeled commits make that citation
verifiable from `git log` alone).

Composes with "Session Lock File Convention" (below): the
label is the identifier, the lock is the enforcement. See
also: "Check HEAD before Step 2 Plan" (`c24d69d`), "Re-verify
Environmental Claims at Each Gate" (`a610e0e`), and "Mutual
Hallucination-Flag-and-Retract Discipline" (above).

**Label hygiene.** Labels should be date-stamped,
arc-descriptive, or both — `coord-2026-04-22`, `M-coord`,
`S8-0423`, `phase-1.2-s8-mid` are illustrative — rather
than bare single letters or tokens indistinguishable across
arcs. The examples earlier in this section (`Session M`,
`Session O — O3`, `Session P4 — Prompt 4`) are descriptive
but not unique across time: a later session initializing
with `session-init.sh M` would produce indistinguishable
`git log --grep='Session: M'` results against the coord
arc's four commits (`918e68a`, `c12513a`, `00afe82`,
`4372d65`). See `docs/09_briefs/CURRENT_STATE.md` "Session
M (coord arc) — disambiguation note" and friction-journal
subsection (h) for the incident record. This is a
recommendation, not a requirement — the Operator rule
above still owns label choice; the Session Lock File
Convention's commit-time refusal remains the sole
collision-prevention mechanism. Hygiene backstops the
readability layer (attribution, post-hoc search, history
reconstruction), not collision prevention.

First codified: 2026-04-22, coordination-mechanism ratification
commit.

---
**Origin:**
- First codified: Phase 1.2, 2026-04-22 (coordination-mechanism
  ratification), commit `918e68a`
- Evidence basis: N=4 concurrent-session failures on 2026-04-22
  (commit interleave, DB state wipe, authorization race,
  ratification bypass) + commit `9aaeeec` ad-hoc coordination
- Promoted from: 2026-04-22 coordination failure incidents
- Cross-references: Session Lock File Convention (below); Check
  HEAD before Step 2 Plan (above); Re-verify Environmental Claims
  at Each Gate (above); Mutual Hallucination-Flag-and-Retract
  Discipline (above);
  `docs/07_governance/friction-journal/phase-1.2.md` Phase B
  subsection A
- Label-hygiene amendment: 2026-04-22 (Session M near-collision)

---

## Session Lock File Convention

Every session that will commit to the repo creates a lock file
at `.coordination/session-lock.json` at its start and removes
it at its end. The lock encodes the session's label, start
timestamp, process id, optional prompt-doc path, and a
free-form constraints list (e.g., "no `pnpm db:reset:clean`
until 2026-04-23"). A Git pre-commit hook backs the convention
by refusing commits whose `COORD_SESSION` environment variable
doesn't match the active lock's label — foreign-session
commits are blocked at commit time before they can land.

Rationale: incidents on 2026-04-22 demonstrated three classes
of coordination failure that labeling alone doesn't address.
Commit interleave (incident #1): two sessions writing to the
same branch can only be post-hoc detected without enforcement;
the lock prevents the foreign session from committing until
the lock clears. DB state wipe (incident #2): a preservation
constraint stated in a plan doc the second session doesn't
read is invisible to it; the lock's `constraints` field makes
the constraint discoverable by any agent's Step 2 gate read.
Authorization race (incident #3): a session entering a paid-
API phase can encode a "do not commit phase-X work while this
lock is held" constraint that the foreign session sees at
pre-commit time.

Operating rules:
- **Session start** runs `bash scripts/session-init.sh <label>
  [prompt_doc_path]`. The script creates the lock; if a
  foreign lock exists, it prints the current lock and exits
  non-zero.
- **Session identification at commit time.** The pre-commit
  hook reads the `COORD_SESSION` environment variable from
  the committing subprocess. Two paths are supported:
  (a) **inline env** (default): the agent passes
  `COORD_SESSION=<label>` inline on each commit command
  (`COORD_SESSION=M git commit ...`), so the variable is
  scoped to the commit subprocess only; (b) **shell export**
  (operator-side): `export COORD_SESSION=<label>` in the
  shell that launched Claude Code *before* launching it, so
  the Bash tool inherits the env. Path (a) is the v1
  default because Claude Code's Bash tool subprocesses
  inherit env from the Claude Code process, not from the
  operator's current terminal — exports performed after
  Claude Code starts are invisible to the agent. Path (b)
  works only when the operator sequences the export before
  starting Claude Code; re-exporting mid-session has no
  effect on the agent. Under path (a), the handshake's
  semantics are "agent labels its own commit with the
  session's label," not "informed operator authorized
  each commit" — the residual guarantee is that foreign-
  session agents in parallel Claude Code sessions would
  not know the correct label and would fail the hook.
- **Every Step 2 gate** reads `.coordination/session-lock.json`
  in addition to running `git log --oneline -10` per the
  "Check HEAD" convention. If a foreign lock is active, the
  agent stops and reports rather than proceeding.
- **Pre-commit hook** (installed one-time per worktree via
  `bash scripts/install-hooks.sh`) refuses commits when
  `COORD_SESSION` doesn't match the lock's label, when the
  lock exists but `COORD_SESSION` is unset, or when
  `COORD_SESSION` is set but the lock file is missing.
  Permissive-with-warning mode when the lock is absent
  (baseline for pre-convention workflow or operator-chosen
  opt-out).
- **Session end** runs `bash scripts/session-end.sh` to
  remove the lock. Operator unsets `COORD_SESSION` in the
  shell.
- **Stale-lock recovery** applies when the lock's
  `started_at` is more than 6 hours old AND no process
  matches its `pid` AND no recent commits carry a matching
  `Session:` trailer. Manual inspection confirms staleness;
  `rm .coordination/session-lock.json` clears it.

Known v1 limitations: the pre-commit hook lives in
`.git/hooks/pre-commit` (per-worktree, per-clone — git does
not track hooks). Re-run `scripts/install-hooks.sh` in every
worktree or fresh clone that will commit. `session-end.sh`
removes the lock unconditionally in v1 — no PID-ownership
check — so running it in the wrong session removes the
active lock (recoverable via re-init). Multi-hook composition
is not supported in v1; the install script backs up any
existing pre-commit hook as `.git/hooks/pre-commit.pre-coordination`
before overwriting.

Composes with "Session Labeling Convention" (above): the
label is the identifier, the lock is the enforcement. Also
composes with "Check HEAD before Step 2 Plan" (`c24d69d`) by
adding a filesystem check alongside the HEAD check; with
"Re-verify Environmental Claims at Each Gate" (`a610e0e`) by
giving environmental constraints a declarative home in the
lock's `constraints` field; and with "Mutual Hallucination-
Flag-and-Retract Discipline" by enforcing its single-track
commit-flow requirement via commit-time refusal rather than
relying on agent discipline alone.

First codified: 2026-04-22, coordination-mechanism
ratification commit. Supporting tooling:
`.coordination/README.md`, `scripts/session-init.sh`,
`scripts/session-end.sh`, `scripts/install-hooks.sh`.

---
**Origin:**
- First codified: Phase 1.2, 2026-04-22 (coordination-mechanism
  ratification), commit `918e68a`
- Evidence basis: N=3 classes of coordination failure on 2026-04-22
  (commit interleave, DB state wipe, authorization race)
- Promoted from: 2026-04-22 coordination failure incidents
- Cross-references: Session Labeling Convention (above); Check
  HEAD before Step 2 Plan (above); Re-verify Environmental Claims
  at Each Gate (above); Mutual Hallucination-Flag-and-Retract
  Discipline (above); `.coordination/README.md`;
  `scripts/session-init.sh`; `scripts/session-end.sh`;
  `scripts/install-hooks.sh`
- Env-inheritance amendment: 2026-04-22 (Session M first-activation
  finding)

---

## Bidirectional iterative-catching termination (Z1 #15)

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

---
**Origin:**
- First codified: Phase 0 governance arc, 2026-05-04 (Session 2F
  closeout, Observation 3 path α)
- Evidence basis: N=1 first-instance (Z1 #15 catalog entry)
- Promoted from: Z1 #15 catalog
- Cross-references:
  `docs/09_briefs/phase-2/2026-05-04-session-2f-closeout.md` §4
- v2.2 reorg: 2026-05-17 (relocated from repo-root CLAUDE.md at
  Commit D per `docs/09_briefs/phase-6.5/reorg-proposal-v2.md` §4.1)
