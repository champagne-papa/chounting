# Engineering conventions — routing

This folder holds the canonical engineering conventions for
chounting, organized by topical surface (the surface a session is
working on at codification time and at retrieval time). The
top-level [`../conventions.md`](../conventions.md) is the index that
points here.

Each topical file holds one or more codified rules. Each rule
carries an origin-metadata footer naming when it was first codified,
the evidence basis, and any cross-references. The chronological
origin (which Phase / which arc) is preserved in the footer; the
file structure is topical, not chronological.

## Topical files

- [`code.md`](./code.md) — branch naming, contribution rules,
  performance, i18n, file-top comment staleness review.
- [`service-layer.md`](./service-layer.md) — webhook handler
  conventions, error-handling review, service template structure,
  three-consumer pattern.
- [`schema.md`](./schema.md) — Zod schema strictness (strict vs
  passthrough), API boundary casing, JSON schema patterns.
- [`migrations.md`](./migrations.md) — migration review cadence,
  NOT NULL column blast radius, seed-data PII placeholder convention,
  substrate-mod test staleness review.
- [`audit-permissions.md`](./audit-permissions.md) — permission keys
  vs audit action keys, permission catalog count drift, audit
  `before_state` convention, audit-action naming split.
- [`testing.md`](./testing.md) — test-scope pragmatic reduction at
  chunk close, test-infrastructure friction-vs-value evaluation.
- [`ai-agents.md`](./ai-agents.md) — agent-mediated session
  conventions (orphan row-card pairing verification, ai_action
  discipline).
- [`session/`](./session/) — session-execution conventions
  (sub-folder; Commit A's content migration produced ~1700 lines,
  exceeding the 600-line sub-split threshold per v2.2 reorg proposal
  §5.1, so this content lives in four sub-files under
  [`session/`](./session/) rather than a single
  `session-execution.md`). Plan-authoring discipline
  (`session/plan-authoring.md`), scope-lock conventions
  (`session/scope-lock.md`; includes the Verify-forward-at-scope-lock
  RI-1 through RI-10 cluster relocated from CLAUDE.md at Commit D),
  session-close shape (`session/session-close.md`), and runtime
  iterative-catching (`session/iterative-catching.md` — Session
  Labeling, Session Lock, environmental re-verification, Mutual
  Hallucination-Flag-and-Retract Discipline, bidirectional
  iterative-catching termination).
- [`prediction-grounding.md`](./prediction-grounding.md) — discipline
  for encoding predictions and parameter values in planning artifacts
  (specs, regex parameters, session-handoff prompts, ADRs, briefs,
  plans): ground against empirical evidence at write time, or
  explicitly mark as ungrounded and document the verification step.
  Codified Phase 6.5 from `caveat-prediction-vs-empirical-resolution`
  family at N=3. Paired with `regex-permissive-matching.md` for the
  design-time-vs-resolution-time split.
- [`regex-permissive-matching.md`](./regex-permissive-matching.md)
  — design-time discipline for permissive regex matching against
  non-trivial input populations: anticipate cost classes beyond the
  classical noise/signal split (over-match into similar-shaped
  strings, character-class incompleteness collapsing distinguishable
  subgroups, priority-ordered preemption hiding real signal).
  Codified Phase 6.5 from `regex-permissive-cost-class` family at
  N=3 distinct cost classes. Paired with `prediction-grounding.md`
  for the resolution-time discipline.

## Routing rule

Each observation has a single load-bearing home. Other surfaces may
contain summarized projections that point at the canonical source,
but the substantive content lives at exactly one location.

Routing destinations:

- Raw friction signal (CLUNKY/WANT/WRONG/NOTE on a specific
  moment) → `docs/07_governance/friction-journal.md`. Append-only;
  format `[date] [category] [one-line description]` per the file
  header. Active phase only — closed phases archive per the
  archival rule below.
- Repeatable rule earned by ≥3 fires → a topical file under this
  folder. Use the [decision tree](#routing-decision-tree) to pick
  the destination; match the existing voice.
- Architectural decision crossing more than one arc →
  `docs/07_governance/adr/NNNN-<slug>.md`. See
  `docs/07_governance/adr/README.md` for format.
- Phase- or arc-scope reflection →
  `docs/07_governance/retrospectives/<scope>-retrospective.md`.
  Four-section shape per the Phase 1.2 retrospective template.
- Unresolved question → `docs/02_specs/open_questions.md`.
- Inheritance carry-forward →
  `docs/09_briefs/phase-N/obligations.md`.

### Routing decision tree

When promoting a friction-journal pattern (≥3 fires) to a codified
convention, walk this tree to pick the topical file:

1. **Does the rule fire every session, regardless of surface?** If
   yes, it belongs in repo-root `CLAUDE.md` (must-always rules),
   not in this folder.
2. **What's the trigger surface?**
   - File-glob trigger (matches a path) → eligible for both topical
     conventions (canonical body) and `.claude/rules/` (operational
     projection; pilot scope at Commit C).
   - Activity trigger (fires at scope-lock, brief-write,
     verification gate, session close) → topical convention only.
   - Explicit invocation → skill at `.claude/skills/<name>/`.
   - Subagent dispatch → subagent at `.claude/agents/<name>.md`.
3. **What's the surface character?**
   - Branch / commit / contribution / formatting / file-top
     comments / cross-cutting code patterns → `code.md`.
   - Service template / route handler / middleware / webhook handler
     / error handling → `service-layer.md`.
   - Zod schema / API boundary casing / JSON schema → `schema.md`.
   - Supabase migration / RLS / backfill / NOT NULL discipline /
     seed-data PII → `migrations.md`.
   - Audit log / permission catalog / audit action naming →
     `audit-permissions.md`.
   - Test patterns / mocks / test-scope discipline → `testing.md`.
   - Agent tools / LLM call discipline / agent-mediated session
     discipline → `ai-agents.md`.
   - Plan-authoring / scope-lock / verification gate / session
     close / iterative-catching → the appropriate sub-file under
     [`session/`](./session/) (plan-authoring → `plan-authoring.md`;
     scope-lock → `scope-lock.md`; close-time → `session-close.md`;
     runtime coordination → `iterative-catching.md`).

The `codify-convention` skill (landing at Commit B) wraps this
decision tree as a forcing function at codification time.

## Write-time tripwires

Three policy tripwires plus a fallback rule:

1. **The 10-second rule.** A single friction-journal entry must
   be readable in roughly 10 seconds. Format
   `[date] [category] [one-line description]` with optional 2–3
   line elaboration; entries longer than ~10 lines are signal that
   content belongs elsewhere. Apply at write-time.
2. **No embedded retrospectives in the journal.** Sub-section
   headings like `### (a) Outcome summary` inside the friction
   journal are signal that content has overshot its container.
3. **Closeout artifacts route by purpose.** A closeout commit may
   produce a retrospective (long prose), conventions (codified
   rules), an obligations entry (carry-forward), and a
   `CURRENT_STATE.md` update — each lands at its correct surface.
   Bundling them into a friction-journal section is a routing
   failure.

**Fallback rule (capture-first).** If routing is unclear at
write-time, capture the observation in `friction-journal.md` with a
`[ROUTE?]` tag and resolve later. Unresolved `[ROUTE?]` tags are
resolved at session close (route to canonical destination or
explicitly mark `[ROUTE: stays-in-journal]` with rationale). The
phase-end hygiene pass (see below) audits that no tags survive
across sessions; tags that survive the hygiene pass itself are a
discipline violation requiring retroactive resolution.

## Codification thresholds

- **N=2** — split-trigger threshold (sub-types graduate to own
  conventions on second instance).
- **N=3** — codification threshold (friction-journal pattern →
  topical conventions entry).
- **N=5** — meta-shape review threshold (re-evaluate when sub-type
  list reaches five).

These are working thresholds, not laws. The Mutual Hallucination-
Flag-and-Retract Discipline (in `session/iterative-catching.md`)'s retraction
sub-track was grandfathered at 8 datapoints; author judgment governs
edge cases.

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
journal entries, retrospective inventory ratification, conventions
graduations), name the grain explicitly: "observation-grain N=X"
or "application-grain N=Y." For codification threshold purposes,
observation-grain N is the load-bearing count; application-grain N
documents the breadth-of-application within an instance but doesn't
contribute to the threshold count.

Precedent: Phase 4 chunk 3 close (memory-only candidate (iii)
graduation per Phase 4 retrospective; applies retroactively to
F-J-11 and other ambiguous-N codifications). Future codification
claims at chunks 4+ name the grain.

---
**Origin (this sub-section):**
- First codified: Phase 4 chunk 3 close (2026-05-14)
- Evidence basis: memory-only candidate (iii) graduation per Phase
  4 retrospective; retroactive to F-J-11 and other ambiguous-N
  codifications
- Promoted from: Phase 4 retrospective memory-only graduation
- Cross-references: F-J-11 (Pattern B variant split prose);
  Phase 4 retrospective writeup
- v2.2 reorg: 2026-05-17 (relocated from repo-root CLAUDE.md at
  Commit D per `docs/09_briefs/phase-6.5/reorg-proposal-v2.md` §4.1;
  lives alongside the codification-thresholds parent section as the
  methodological companion to N=2/N=3/N=5 thresholds)

## Three-category codification taxonomy

Codification thresholds vary by category. The artifact-codification
relationship is the load-bearing distinction:

- **Architectural principle.** Ratification IS codification. The
  principle's text in `DOCS_RESTRUCTURE_V<N>.md` (or in an ADR) is
  the canonical record at the moment of ratification. Threshold:
  N=1 per surface the principle applies to. Aggregation across
  surfaces is NOT required — each surface independently meets N=1.
  Worked examples: Principles 1, 2, 3 in `DOCS_RESTRUCTURE_V2.md`;
  ADR-0020's authority-gradient source organization.
- **Procedural pattern.** Artifact's existence documents the
  convention. The convention is in the artifact itself; reading the
  artifact teaches the pattern. Threshold: N=1 establishes; N=2
  confirms; codification often coincides with artifact creation.
  Worked examples: ADR `## Amendment` block format (per ADR-0022);
  friction-journal entry shape; round-N session-plan filename
  convention.
- **Process meta-pattern.** Artifact is decoupled from codification.
  The pattern operates on processes (how decisions get made, how
  drift gets caught, how sequences get verified) rather than on
  artifacts. Threshold: N=2 with shape match across distinct timing
  surfaces or distinct contexts; N=3 confirms. Codification gates
  must catch shape-match across instances, not just count. Worked
  examples: plan-substrate-vs-canonical-reality drift meta-pattern
  (codified in `session/plan-authoring.md`).

---
**Origin:**
- First codified: Round-2 Conventions, 2026-05-09
- Evidence basis: Round-2 docs reorganization codification work
- Promoted from: Round-2 session 8 codification arc
- Cross-references: `docs/07_governance/DOCS_RESTRUCTURE_V2.md`,
  ADR-0020, ADR-0022

## Hygiene cadence

A phase-end hygiene pass is required at every phase close. The pass:

1. Resolves any `[ROUTE?]` tags that have survived their
   session-close clearing requirement.
2. Reviews convention threshold candidates (patterns at 2+
   datapoints not yet codified).
3. Prunes obligations that have been completed or invalidated.
4. Verifies cross-references from the topical files in this folder
   to friction-journal subsections still resolve.

Lands as part of the phase closeout commit set, alongside the phase
retrospective.

**Tooling floor.** Policy alone decays without tooling. The
following minimum viable tooling supports this hygiene cadence:

- **Line-length check**
  (`scripts/check-friction-journal-line-length.sh`) — script
  flagging any single bullet item in `friction-journal.md`
  exceeding ~10 lines.
- **`[ROUTE?]` tag scanner** (`scripts/scan-route-tags.sh`) —
  script listing unresolved tags in the active journal, with a
  non-zero exit at phase close (`--phase-end` mode) if any
  survive.
- **Heading detector** (`scripts/detect-journal-headings.sh`) —
  script flagging `###` or `####` headings inside
  `friction-journal.md` (signal that retrospective content has
  been embedded).
- **Citation auditor**
  (`scripts/audit-friction-journal-citations.sh`) — script
  auditing the topical conventions files for citations to
  `friction-journal.md` patterns; catches both `\.md` and
  shorthand `section (X)` patterns.

Run scripts manually until a phase-end hygiene cadence
orchestrator wraps them. Additional tooling may follow.

## Archival rule

When a phase closes:

1. That phase's friction-journal section moves to
   `friction-journal/phase-X.md` in the same commit as the phase
   retrospective.
2. Archived sections preserve their original lettering (sections
   (a) through (p) keep those letters in the archive) so prior
   citations resolve without rewriting.
3. Long-prose subsections already absorbed into the phase
   retrospective are stubbed in the archive with a one-line
   pointer (e.g., "Section (p): captured in
   `phase-1.2-retrospective.md` §3 Pattern 6.") rather than
   duplicated.
4. Citations from topical conventions files to friction-journal
   subsections that have been absorbed into a retrospective are
   rewritten to point at the retrospective subsection, not the
   archive stub.

## Deprecation model

Conventions can be retired via three distinct paths, each with
explicit lineage:

- **Deprecated.** Convention is no longer applicable (e.g., the
  underlying system was redesigned and the discipline is moot).
  Convention text retains in its topical file with a
  `**DEPRECATED** as of <date>; reason: <reason>` header and is
  moved to a "Deprecated Conventions" section at end of file.
- **Superseded.** Convention is replaced by a different convention
  that handles the same problem differently. Original convention
  links to its successor; successor cites its predecessor. Same
  lineage shape as ADR supersession.
- **Merged.** Two or more conventions combine into one, typically
  when their codification-trigger evidence is found to be the same
  underlying pattern. The merge is recorded in the surviving
  convention's body; the merged-out conventions become one-line
  stubs pointing at the survivor. The original Per-Entry Pending-
  Orphan Preflight rename (to Per-Entry Row-Card Pairing) is the
  originating instance, captured in `ai-agents.md`.

All three paths require a Governance Audit row (see the
governance-audit appendix in the top-level
[`../conventions.md`](../conventions.md)).

## Known limitations

This routing rule defers three concerns. Each is named explicitly
so future review knows where to revisit:

- **Ownership model deferred.** In current solo-dev-with-Claude
  operation, ownership collapses to the operator. Deferred — will
  be addressed when warranted, with full review at that time.
- **Read-path design deferred.** This routing covers write
  discipline. Navigation/usage patterns (onboarding read path,
  debugging read path, decision-history read path) live in
  `docs/04_engineering/DEV_WORKFLOW.md`. Deferred — will be
  addressed when warranted, with full review at that time.
- **Priority gradient deferred.** All conventions are currently
  flat (no CRITICAL/HIGH/LOCAL tagging). Deferred — will be
  addressed when warranted, with full review at that time.

---
**Origin:**
- First codified: Documentation Routing, 2026-04-26 (Phase 1.2 C12
  closeout follow-on)
- Evidence basis: friction-journal drift surfaced by
  `phase-1.2-retrospective.md` §2 inheritance-artifact map; three
  classes of drift (closeout absorption, session-closeout
  absorption, convention codification source absorption)
- Promoted from: `phase-1.2-retrospective.md` §2 inheritance-artifact
  map analysis; first concrete application was the Phase 1.2
  friction-journal split
- Cross-references: `phase-1.2-retrospective.md` §2; ADR-0020
  (authority gradient); `DOCS_RESTRUCTURE_V2.md` Principles 1-3.
- Tooling-floor amendment: 2026-04-27 (S17 tooling delivery; added
  citation-auditor as fourth tooling-floor bullet per S16
  C1-extension finding).
- v2.2 reorg restructure: 2026-05-17 (Commit A of reorg per
  `docs/09_briefs/phase-6.5/reorg-proposal-v2.md`; promoted from
  buried `## Documentation Routing` section at line 1695 of the
  pre-split `conventions.md` to discoverable `README.md` at
  directory entry).
