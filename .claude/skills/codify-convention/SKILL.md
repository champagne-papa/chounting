---
name: codify-convention
description: Use when promoting a friction-journal pattern to a codified convention after N≥3 fires. Walks the routing decision tree, picks the destination file, drafts the codification block with origin metadata.
trigger: Explicit invocation when a friction-journal pattern has met the N=3 codification threshold and is about to graduate to a codified convention.
---

# Codify Convention

**Canonical routing source:** `docs/04_engineering/conventions/README.md`.
This skill is a procedural projection of that README — when the README's
"Routing rule" section changes, the skill follows. Read the README's
"Routing rule" and "Routing decision tree" sections as the authoritative
reference before invoking this skill on a candidate.

## Purpose

This skill fires at codification time. When a friction-journal pattern has
met the N=3 codification threshold (or N=2 for split-trigger sub-types) and
the operator or session is about to graduate it to a codified convention,
this skill picks the destination file and drafts the codification block
with the standardized origin-metadata footer. The default-to-CLAUDE.md
failure mode that motivated the v2.2 reorg is exactly what this skill
prevents — it is one of four redundant routing pointers (per v2.2 §10.5)
forcing each codification through the routing decision tree.

## When to invoke

- A friction-journal pattern has fired ≥3 times across distinct contexts
  (observation-grain N=3, not application-grain — see
  `docs/04_engineering/conventions/README.md` "Codification convention:
  observation-grain vs application-grain N count").
- A sub-type of an existing convention has fired a second time (N=2
  split-trigger threshold).
- A phase-end hygiene pass surfaces convention-threshold candidates.
- A retrospective is consolidating multiple codification candidates and
  needs each routed before bulk-codification.

## Required inputs

To invoke, provide:

- **Candidate rule name.** One-line summary (e.g., "audit-action naming
  convention split").
- **Trigger description.** When does the rule fire? File glob, activity
  (scope-lock, brief-write, verification gate, session close), explicit
  invocation, or subagent dispatch.
- **Evidence basis.** N-count plus source friction-journal entries with
  commit SHAs.
- **Composition.** What other rules does it interact with? Cross-references
  to ADRs or sibling conventions.

## Destination summary table

| Trigger                                                                  | Destination                                                |
|--------------------------------------------------------------------------|------------------------------------------------------------|
| Fires every session (unconditional, or every-session-that-does-X-shape)  | repo-root `CLAUDE.md`                                      |
| Fires on a file glob                                                     | `.claude/rules/<area>.md` (3-file pilot at launch)         |
| Fires on activity (scope-lock, plan-authoring, session-close, etc.)      | topical `conventions/<topic>.md` or `conventions/session/<sub>.md` |
| Fires on explicit invocation                                             | `.claude/skills/<name>/SKILL.md`                           |
| Fires on dispatch                                                        | `.claude/agents/<name>.md`                                 |
| Domain invariant (not a procedural rule)                                 | `docs/02_specs/` (ledger_truth_model.md leaves, glossary)  |

For the full decision tree, walk
`docs/04_engineering/conventions/README.md` "Routing decision tree"
section against the candidate. For sub-routing within topical conventions
(which of `code.md` / `service-layer.md` / `schema.md` / `migrations.md` /
`audit-permissions.md` / `testing.md` / `ai-agents.md` /
`session/<sub>.md`), see the topical-files index in
`conventions/README.md`.

## Output specification

Produce two artifacts:

1. **Destination decision.** Name the file (with section-heading
   suggestion) where the codification block will land. If ambiguous,
   consult `conventions/README.md` for canonical disposition and surface
   the ambiguity for operator decision — do not invent new routing logic.

2. **Drafted codification block.** Markdown body matching the destination
   file's voice, terminated with the standardized origin-metadata footer
   per v2.2 §5.3, followed by an Evaluation basis section that captures
   the graduation reasoning:

   ```markdown
   ---
   **Origin:**
   - First codified: <Phase X.Y, YYYY-MM-DD>
   - Evidence basis: N=<count>, commits <sha1>, <sha2>, ...
   - Promoted from: <friction-journal entry id>
   - Cross-references: <ADR-XXXX, related conventions if applicable>

   **Evaluation basis:**

   - **Load-bearing.** <Assessment of how the convention
     generates operator action or grounds future reasoning. Use
     sub-qualifier `(prescriptive)` or `(descriptive)` per the
     load-bearing sub-shape distinction in
     `docs/04_engineering/conventions/README.md` §Graduation
     criteria.>
   - **Generalizable.** <Assessment of the pattern's reach
     beyond its originating context. Surface diversity, known
     general analogs, or domain breadth are typical evidence
     shapes.>
   - **Stable.** <Assessment of the pattern's temporal settling.
     Use sub-qualifier `(exploratory framing)` if codifying
     provisionally — see README §Graduation criteria for when
     exploratory framing is appropriate.>
   ```

   The Evaluation basis section is a required component of every
   codification. The canonical framework for each criterion lives at
   `docs/04_engineering/conventions/README.md` §Graduation criteria;
   this section captures the graduation reasoning in the artifact
   trail alongside provenance — future readers see both *what* was
   codified and *why* it met the criteria.

   Depth is content-driven: where graduation reasoning has substance
   (the typical case at N=3 codifications), use paragraph per
   criterion as in `prediction-grounding.md` and
   `regex-permissive-matching.md`. Where reasoning is genuinely
   brief, single-sentence assessment per criterion is acceptable.
   The discipline is naming the criteria explicitly, not producing
   paragraphs.

## Anti-patterns to flag

- **Default-to-CLAUDE.md.** If the candidate looks like it wants to go in
  CLAUDE.md but the trigger description doesn't match "fires every
  session" or "fires every session that does X-shape common work,"
  redirect to the appropriate topical file. This is the failure mode
  the skill exists to prevent.
- **Reproducing routing logic.** If you find yourself authoring
  multi-paragraph routing logic inside this skill or inside a
  codification block, stop. The canonical routing rule lives in
  `conventions/README.md`; this skill points at it.
- **N-count ambiguity.** Name the observation-grain N count explicitly
  (e.g., "observation-grain N=3"). Application-grain N within one session
  is one instance from threshold-counting perspective.

## Pipeline integration

This skill is one of four redundant routing pointers per v2.2 §10.5:

1. CLAUDE.md routing index section (lands at Commit D).
2. `docs/04_engineering/conventions/README.md` (Commit A — canonical).
3. `.claude/rules/docs-codification.md` (Commit C pilot, if landed).
4. This skill (Commit B).

Four redundant pointers reduce the failure mode to "session explicitly
ignores all four," which is detectable post-hoc.
