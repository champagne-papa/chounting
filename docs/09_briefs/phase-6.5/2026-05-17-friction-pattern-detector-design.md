# Friction-Pattern-Detector — Design

Date: 2026-05-17
Status: Design (pre-implementation-plan)
Origin: Brainstorm session — phase-6.5 substrate

## Context

The friction journal (`docs/07_governance/friction-journal.md`, 13,256
lines) carries the discipline of inline pattern-instance tagging:
when the user notices a recurring observation, they tag it with
`(third-instance)`, `N=3`, `cadence-β-i-a`, etc. Codification fires at
N≥3 via `codify-convention`.

Two gaps in the current loop:

1. Tagged-but-not-graduated. The user may write `(third-instance)`
   without immediately routing to `codify-convention`. Nothing surfaces
   the backlog.
2. Recurring-but-untagged. The user may notice the same pattern three
   times without ever writing an instance marker on any of them. The
   discipline depends on noticing in the moment; the detector exists
   to backstop attention gaps.

A third gap — untagged-instance-marker — was identified during
brainstorming: lines that say `third-instance of this happening` with
no bucket reference. These count as a discipline signal in their own
right ("name this").

## Decision summary

| Decision | Choice | Reason (compressed) |
|---|---|---|
| Approach | (b) Tag-tally + anchored-semantic supplement | (a) reflects discipline, doesn't augment; (c) reclusters and loses tagging-discipline anchor |
| Tier model | Four tiers (T1, T1.5, T2, T3) | T1+T2 from approach (b); T1.5 surfaces untagged-marker discipline gap; T3 gated behind `--explore` for noise control |
| Bucket extraction | (i) Anchor-extract on instance marker | (ii) registry-driven gated on the discipline it's meant to augment |
| Graduation check | Two-stage: bare grep for ID-shaped buckets, footer-grep `Promoted from:` for phrasal | Phrasal buckets ("Path C") false-match prose; origin-metadata footer is precise anchor |
| Window | Event-based (since last retrospective); 30-day fallback if none; `--since <date>` override | Matches discipline rhythm, bounded LLM substrate |
| Output destination | Stdout | Routing-into-canonical-surfaces closes the loop; parallel persistence surface would compete with canonical truth |
| Substrate scope | `friction-journal.md` only for T1/T1.5/T2; MEMORY.md as T3 dedup filter only | Authority gradient: journal is war diary; memory is derivative |
| Composition direction | Script callable standalone; subagent invokes script | Deterministic surface = script (reusable by humans, CI, other agents); reasoning surface = subagent |

## Three-tier output model

### Tier 1 — Graduate now

**Input:** Lines with both an instance marker and a co-occurring bucket
reference.
**Output condition:** Bucket has ≥3 tallied instances AND no
graduation-check hit.
**Action implied:** Invoke `codify-convention` on this bucket.

### Tier 1.5 — Name this

**Input:** Lines with an instance marker but no co-occurring bucket
reference within the same line.
**Output condition:** ≥3 such untagged markers exist (count is global
to the journal; not windowed — see §Window).
**Action implied:** Read the source lines, identify the pattern,
back-tag with a bucket reference.

### Tier 2 — Likely-missed instance (anchored)

**Input:** All entries in the active window (see §Window).
**Output condition:** LLM reasoning identifies an entry that
plausibly belongs to one of the *existing* bucket IDs extracted by T1
but wasn't tagged.
**Action implied:** Read the candidate, decide whether to add the
instance marker.

T2 is explicitly *anchored*: candidate space is the buckets T1 already
knows about. T2 is not asked to discover new buckets. New-bucket
discovery is T3.

### Tier 3 — Possible new bucket (gated)

**Input:** All entries in the active window.
**Output condition:** LLM reasoning identifies a recurring pattern
that does not map to any existing bucket.
**Gating:** Requires `--explore` flag (or equivalent) on the subagent
invocation. Default invocations skip T3.
**Dedup:** Before surfacing a candidate new bucket, the subagent
checks MEMORY.md and per-topic memory files for an existing
known-pattern reference matching the candidate. Memory acts as
known-pattern registry, not as substrate for counting.

## Components

### `scripts/friction-journal-tally.sh`

Bash, deterministic. Reads `docs/07_governance/friction-journal.md`,
emits T1 and T1.5 output as structured stdout (TSV or columnar; exact
shape deferred to implementation plan).

Per-row T1 fields: `bucket_id`, `instance_count`, `latest_marker_date`,
`graduated_yn`, `source_lines` (line numbers with markers).
Per-row T1.5 fields: `unnamed_instance_count`, `latest_marker_date`,
`source_lines`.

Standalone-callable: `bash scripts/friction-journal-tally.sh` is a
legitimate invocation pattern, independent of the subagent.

Exit codes: always 0. Counts are visible in the stdout structure
(rows where `graduated_yn=N` and `instance_count≥3` are the
graduate-now candidates; row count of T1.5 is the untagged-marker
count). Callers decide what's actionable. The tally script is a
surfacing tool, not a linter — exit-1 on "you have ungraduated
candidates" would pressure the script's role toward "block until
graduated," which isn't its job. The precedent in
`audit-friction-journal-citations.sh` is a citation-correctness
linter (pass/fail bivalent); the tally script is not. If a future
caller (CI, hook) wants fail-on-condition behavior, that's a
`--exit-on-ungraduated` flag added then, not the default contract.

### `.claude/agents/friction-pattern-detector.md`

Subagent. Tools: Read, Grep, Glob, Bash.

Invocation flow:
1. Compute window via retrospective glob (event-based); fallback to
   30-day window if no retrospective exists.
2. Invoke `scripts/friction-journal-tally.sh`; parse T1 and T1.5.
3. Read the active-window slice of `friction-journal.md`.
4. With T1's bucket-ID list as anchor, perform T2 anchored-semantic
   scan over the window.
5. If `--explore`, perform T3 unanchored-discovery scan; dedup
   candidates against memory.
6. Emit consolidated stdout report: T1 table, T1.5 table, T2
   candidates list, [T3 if enabled].

## Bucket extraction — anchor-extract (i)

Anchor on the instance marker. Extract the bucket reference from the
same line, within ~50 characters of the marker. Permissive matching:
paren-delimited, dash-delimited code-like, quoted, or
capitalized-discriminator-phrasal.

**Multiple-bucket-on-one-line rule:** The bucket reference *adjacent
to* the marker is primary (counted in the tally). Other references on
the line are visible in the `source_lines` context column for human
review.

**No-bucket-on-line rule:** Counted into T1.5, not silently dropped.

Rationale (recorded): A registry-driven approach is gated on the
discipline it's meant to augment — the registry can never be more
complete than human awareness of which buckets exist, and human
awareness is the thing the detector exists to backstop. Anchor-extract
inverts the dependency: the instance marker *is* the act of
recognition; the bucket reference next to it is whatever the user
called it. String-match grouping across lines makes the user's
existing discipline of reusing bucket IDs the de facto deduplication
mechanism. Discipline failures (typos, variant naming) show up as
T1.5-or-near-miss output and are correctly surfaced as discipline
issues, not tool issues.

Known limitation discovered at first-implementation verification
(2026-05-18): B1's permissive matching has a **signal-hiding
subclass** not captured by the noise-class tradeoff above —
false-positive parenthesized tokens like `(sustained)` (used as a
status annotation across many bare-prose observations) can shadow
lines that belong in T1.5 rather than merely add noise rows, because
their parenthesized form preempts the bucket extractor while the real
observation name sits in bare prose elsewhere on the line;
~~resolution deferred to a future session with an empirical audit of
all-lowercase-letter parenthesized bucket usage in the journal before
any B1 discriminator change.~~ Resolved 2026-05-19 via heuristic
discriminator: B1's matched content must contain at least one of
{digit, non-ASCII byte, hyphen} to be returned; otherwise the
function falls through to B2 and B3. The empirical audit
(2026-05-19) of `grep -oE '\([a-z]+\)'` against the journal
surfaced zero legitimate bucket IDs in the top 30 by frequency (all
were enumeration markers, status annotations, commit-message scopes,
code references, or prose asides), confirming the heuristic
over-rejects nothing of value. Verification surfaced a finding the
original caveat did not anticipate: **the heuristic primarily
redirects attribution rather than removing it** — most previously-
shadowed lines had a real B2-shape bucket co-located in the same
window, so when B1 rejects the noise token, the fall-through to
B2/B3 finds the real bucket. The net T1.5 increase was only ~20
lines (not the ~518 the prior framing predicted), because most (but
not all) shadowed observations were tagged after all; B1 was
preempting B2's access to them. The remaining ~20 lines were
genuinely untagged and correctly surface in T1.5 — the original
caveat's framing held for that subset. Trade-off documented but not
anticipated: future buckets that happen to be all-lowercase-letters-
only would be rejected by the heuristic.

## Graduation check — two stages

**Stage A (ID-shaped buckets):** Bare grep for the bucket ID in
`docs/04_engineering/conventions/**/*.md`, `CLAUDE.md`, and
`.claude/skills/**/SKILL.md`. ID-shaped buckets (`F-J-14`, `RI-6`,
`cadence-β-i-a`, `Z1 #11`) appear verbatim when codified.

**Stage B (phrasal buckets):** Grep for the codification block's
origin-metadata footer (`Promoted from: <bucket>` or equivalent per
`.claude/rules/docs-codification.md`) in the same surfaces. Phrasal
buckets ("Path C", "Framing B'") are too generic for bare grep to
distinguish codification from incidental prose.

A bucket is graduated if Stage A OR Stage B returns a hit.

Skills directory inclusion (`.claude/skills/**/SKILL.md`) is added on
grounds that skills *are* codifications of discipline; if a pattern
has been graduated into a skill, the detector should not re-surface
it as ungraduated. Flagged for review under §Decisions introduced in
drafting.

## Window

**Default:** Glob `docs/07_governance/retrospectives/*.md` for the
most recent file by filename date. Window = entries dated on or after
that date.

**Fallback:** If no retrospective exists in the glob, window = last
30 calendar days.

**Override:** `--since <YYYY-MM-DD>` argument to the subagent.

Applies to T2 and T3. T1 and T1.5 are *unwindowed* in the bash pass —
the script tallies the whole journal and outputs all rows with a
`latest_marker_date` column. Window-filtering of T1/T1.5 is a render
decision at the subagent layer or a human-reader decision when the
script is invoked standalone.

## Output destination — stdout

The subagent emits its consolidated report to stdout (the conversation
or the calling context, depending on invocation). No scratch file is
written.

**Reason:** The detector routes T1 candidates *into* `codify-convention`,
which writes codification blocks to canonical convention files. Once
codified, the next run of the tally script's graduation check (Stage
A or B) marks them as graduated. The loop closes through canonical
surfaces. A scratch file would create a parallel persistence surface
that competes with the canonical-source truth, and would require its
own maintenance discipline (when to clear, how to dedup, etc.).

If accumulation across sessions becomes valuable later, it can be
added without redesigning the detector — the script already outputs
structured data that can be redirected to a file by the caller.

## Substrate scope

**T1 / T1.5 / T2:** `docs/07_governance/friction-journal.md` only.

**T3:** Same journal substrate; MEMORY.md and per-topic memory files
are read *only* as a known-pattern dedup filter, never as substrate
for counting.

**Reason:** The friction journal is the war diary; by discipline,
that's where N-counting happens. Memory entries are derivative —
patterns there are already promoted out of journal status. Counting
memory would double-count the same observations through a different
authority surface. Memory's content is also heterogeneous (notes,
half-formed decisions, pointers), which would force the detector to
develop a model of "what counts as an observation" across surfaces it
wasn't designed for, reintroducing the instability that disqualified
approach (c).

Cross-surface consistency questions ("is this bucket referenced in
multiple authority surfaces under different names?") are real but
belong to a separate tool — possibly the deferred
`doc-sync-reconciler`. Out of scope here.

## Composition direction — precedent

This subagent invokes its companion script; the script does not
invoke the subagent.

**Generalized principle (proposed as project precedent):** The
deterministic surface of a capability should live as a script
(invocable by humans, CI, other subagents). The reasoning surface
should live as a subagent (invocable only where reasoning is wanted).
This keeps deterministic work composable without forcing it through
an LLM, and keeps subagents from becoming the only path to mechanical
operations.

For this detector: `friction-journal-tally.sh` is a generally useful
tool ("just give me the list"). `friction-pattern-detector.md`
layers reasoning (T2, T3) on top of the script's output. The split is
durable: future improvements to mechanical tallying go in the script
and benefit standalone callers and the subagent equally.

## Out of scope

- Auto-invocation of `codify-convention`. The detector surfaces
  candidates; the user (or a future orchestrator) decides to act.
- Writing back to the journal (e.g., auto-tagging T1.5 candidates).
  The detector reports; the human writes the tag.
- Cross-surface consistency checks (bucket appearing under different
  names in conventions, ADRs, skills). Belongs to a separate tool.
- Modification of `codify-convention` skill. T1's output shape will
  be designed to be ingestible by `codify-convention` *as it stands*.
  If a mismatch surfaces during implementation, the detector adapts
  to the skill, not the reverse — `codify-convention` is invoked from
  multiple paths (manual, path-scoped rules, future orchestrators);
  the detector is one upstream caller and shouldn't dictate the
  skill's ingestion shape.
- Performance optimization. The journal is 13,256 lines; the bash
  pass is grep-based and finishes in well under a second. No
  optimization needed.

## Decisions introduced in drafting (please review)

These are decisions I made while writing this spec that we did not
explicitly settle in the brainstorm conversation. Review these
specifically:

1. **Graduation check substrate set.** I added `.claude/skills/**/SKILL.md`
   to the Stage A / Stage B grep set, on the reasoning that skills are
   codifications of discipline. Brainstorm only named
   `conventions/**/*.md` and `CLAUDE.md`. If you don't want skills
   counted as a graduation surface (e.g., because skills can carry
   patterns at "specialize-and-point" granularity without fully
   codifying), drop the inclusion.

2. **Spec file placement.** Placed at top of `docs/09_briefs/phase-6.5/`
   matching existing brainstorm-file convention (`reorg-brainstorm-reply-v1.md`,
   etc.), rather than creating a new `phase-6.5/specs/` subfolder. The
   README permits `09_briefs/phase-N/specs/`, but no phase currently
   uses it. Move if you want the subfolder convention started here.

3. **Script exit-code semantics.** Spec says exit 0 if no ungraduated
   T1 candidates exist; 1 otherwise. This mirrors
   `audit-friction-journal-citations.sh` (0 = clean, 1 = action
   needed). Alternative: always 0, with the count in stdout for the
   caller to parse. Worth deciding now because CI integrations would
   pin on this.

4. **T1.5 output is unwindowed.** I extrapolated the "T1 unwindowed,
   T1.5 unwindowed, T2/T3 windowed" split from the brainstorm's
   logic; we didn't explicitly say T1.5 follows T1's windowing rule.
   It's the symmetric choice — but if you'd prefer T1.5 windowed
   (only surface "untagged in the recent window" to avoid
   surfacing-stale-discipline-gaps), say so.

5. **Subagent tool list.** I specified Read, Grep, Glob, Bash. No
   Edit/Write tools — the subagent surfaces, doesn't modify. Flagged
   in case you want Edit available for auto-back-tagging of T1.5
   candidates (which I've left explicitly out of scope above, but
   could be reconsidered).

6. **T1.5 trigger threshold.** I set "≥3 untagged markers exist"
   mirroring T1's N≥3. Brainstorm said "≥3 in window" but the
   spec's choice to make T1.5 unwindowed means the threshold is
   global. Could alternatively be set higher (e.g., ≥5) since
   unwindowed counts are larger by construction. Default ≥3 keeps the
   threshold consistent with T1; review if you want it tuned.

## Implementation handoff

Next step: invoke `superpowers:writing-plans` to produce the
implementation plan. The plan should specify:

- Exact bash for `friction-journal-tally.sh` including regex shapes,
  output format, exit codes.
- Exact subagent prompt for `.claude/agents/friction-pattern-detector.md`
  including T2 anchored-semantic instruction wording and T3 gating.
- Render rules for T1.5 output: sort by `latest_marker_date`
  descending so stale untagged-instance buckets sink to the bottom
  and the human can stop reading when entries get old enough.
- Test plan: smoke-test the tally script against the current journal;
  verify graduation-check stage B against at least one known
  Promoted-from-X codification block.
- Worktree-resolution sanity check (deferred parallel concern from
  brainstorm): confirm subagent file in `.claude/agents/` resolves
  from `.claude/worktrees/phase-0-governance/` and
  `.claude/worktrees/phase-1-storage-evidence-core/` before declaring
  the implementation complete.
