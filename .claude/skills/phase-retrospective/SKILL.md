---
name: phase-retrospective
description: Use at phase close to draft a retrospective writeup. Surfaces codification candidates from friction-journal, routes each through codify-convention, drafts the retrospective doc.
trigger: Explicit invocation at phase close, OR session entering retrospective-drafting work.
---

# Phase Retrospective

**Canonical destination:** `docs/07_governance/retrospectives/phase-<N>-retrospective.md`.
**Per-candidate routing:** wraps the `codify-convention` skill. Each
codification candidate surfaced from the phase's friction-journal entries
is routed through `codify-convention` before the retrospective drafts
the codified line. This skill is the bulk-codification orchestrator;
`codify-convention` is the per-candidate forcing function.

## Purpose

When invoked at phase close (after all chunks ship), this skill drafts
a retrospective writeup that:

1. Enumerates the phase's chunks and shipping commits.
2. Surfaces codification candidates from the phase's friction-journal
   entries (observation-grain N≥3 candidates and N=2 split-trigger
   candidates).
3. Routes each candidate through `codify-convention` to pick its
   destination file and draft the codification block.
4. Drafts the retrospective doc at
   `docs/07_governance/retrospectives/phase-<N>-retrospective.md`
   with standard sections.

Typical phase retrospectives carry 5–12 codification candidates;
running each through `codify-convention` individually is the discipline
this skill packages. Without the wrapper, the failure mode is
batch-default-to-CLAUDE.md or batch-codify-without-routing — exactly
the failure mode the v2.2 reorg is designed to prevent.

## When to invoke

- At phase close, after the last chunk ships and `pnpm agent:validate`
  is green at HEAD.
- At session-onset when the session's scope is retrospective-drafting
  (the brief or scope-lock says "draft phase-N retrospective").
- When a retrospective is being amended with newly-surfaced
  codification candidates from late-arriving friction-journal entries.

## Required inputs

To invoke, provide:

- **Phase identifier.** The phase number / arc label
  (e.g., "Phase 4", "Phase 6.5", "Arc A").
- **Friction-journal entries pointer.** Path or line ranges in
  `docs/07_governance/friction-journal.md` covering the phase's
  shipped entries. Carry-forward inventory items from prior
  retrospectives also belong here.
- **Commit range.** Typically `origin/main..HEAD` or
  `<phase-start-sha>..<phase-close-sha>`; used for chunk enumeration
  and the §2 commit table.
- **Brief / scope-lock artifacts.** Pointers to the phase's planning
  docs under `docs/09_briefs/phase-<N>/` for context on the original
  scope and ratified deviations.

## Output specification

A retrospective at
`docs/07_governance/retrospectives/phase-<N>-retrospective.md` with
these standard sections (in order):

1. **§1 Scope and timeline.** Phase boundaries, chunk count, shipping
   dates, commit range.
2. **§2 Chunks and commits.** Per-chunk one-line summaries plus
   shipping commit SHAs. Brief pointer for each chunk if useful.
3. **§3 Codification candidates.** Each candidate listed with its
   observation-grain N count, source friction-journal entry id(s),
   destination file (decided via `codify-convention`), and the
   drafted codification block. Candidates that did NOT meet
   threshold but were observed get a "carry-forward" note rather
   than a codification block.
4. **§4 Discipline graduations.** Patterns that fired during the
   phase and either graduated to codified conventions or stayed
   carry-forward. Cross-references the §3 candidates.
5. **§5 Carry-forwards.** Inventory items that did not close in
   this phase. Each carries forward to the next phase's
   retrospective inventory.

## Composition

- **Wraps `codify-convention` (one invocation per candidate).** Each
  candidate in §3 must be routed before the codification block is
  drafted. The retrospective is the orchestrator; per-candidate
  routing is delegated.
- **Reads friction-journal entries verbatim.** No paraphrasing
  candidate triggers — pull the trigger description from the
  friction-journal entry itself for the §3 candidate row.
- **Cross-references prior retrospectives.** Carry-forward items in
  §5 cite the originating retrospective; the chain stays walkable.

## Anti-patterns

- **Drafting before routing candidates.** Route first via
  `codify-convention`, draft the §3 block second. Drafting first
  hides routing errors behind a finished-looking retrospective.
- **Inventing codification thresholds.** The threshold is
  observation-grain N≥3 (or N=2 for split-trigger sub-types). See
  `docs/04_engineering/conventions/README.md` "Codification
  convention: observation-grain vs application-grain N count". Do
  not improvise a lower threshold under retrospective-drafting
  pressure.
- **Including chunk-level diff dumps.** Retrospectives are about
  patterns, not implementation details. Pointer to commits is
  sufficient; the diff lives in the git log.
- **Batch-codifying without per-candidate routing.** The default
  failure mode is "12 candidates → 1 CLAUDE.md edit." Each
  candidate is its own routing decision.

## Pipeline integration

This skill sits one layer above `codify-convention`:

1. Phase close → invoke `phase-retrospective`.
2. `phase-retrospective` enumerates candidates from friction-journal.
3. For each candidate → invoke `codify-convention`.
4. `codify-convention` picks the destination, drafts the block.
5. `phase-retrospective` collects the routed blocks into §3 of the
   retrospective.

The retrospective doc itself does not codify; it records the
codification decisions and links to where each codified rule
landed.
