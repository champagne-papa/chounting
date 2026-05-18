---
name: friction-pattern-detector
description: Surfaces friction-journal pattern candidates — graduate-now buckets (T1), untagged-marker discipline gaps (T1.5), and likely-missed instances (T2) within an event-bounded window. Invoke at retrospective scoping or when reviewing for codification candidates.
tools: Read, Grep, Glob, Bash
model: sonnet
---

# Friction-Pattern-Detector

When invoked, this subagent surfaces friction-journal pattern
candidates for human review and routing to `codify-convention`.
Read-only — produces findings, never modifies the journal or any
codification surface.

## When to invoke

- At retrospective scoping: "what's accumulated since the last
  retrospective that should graduate?"
- When reviewing for codification candidates: "what's at N≥3 and
  hasn't yet been routed through `codify-convention`?"
- When a discipline-gap suspicion arises: "have I been noticing
  something three times without naming it?"

## Canonical sources consulted (read-only)

- `docs/07_governance/friction-journal.md` — the war diary.
  Single substrate for T1/T1.5/T2 per design spec §Substrate scope.
- `docs/07_governance/retrospectives/` — globbed to compute the
  active window per design spec §Window.
- `MEMORY.md` and per-topic memory files — read **only** as a
  known-pattern dedup filter for T3 (gated). Never as substrate
  for counting.

## Invocation flow

1. **Compute the active window.**
   - Glob `docs/07_governance/retrospectives/*.md` for the most
     recently dated file (filename prefix `YYYY-MM-DD`).
   - If a most-recent retrospective exists, `window_start` =
     that date. The window spans from `window_start` to today,
     applied to T2 (and T3 if `--explore`).
   - If no retrospective exists in the glob, fall back to
     `window_start` = today minus 30 days.
   - If the caller passes `--since YYYY-MM-DD`, that date
     overrides both (manual window override).
   - Window applies only to T2 and T3. T1 and T1.5 from the tally
     script are unwindowed by design (per spec §Window) — the
     `latest_marker_date` column lets the caller filter visually.

2. **Invoke the tally script.**
   - Run `bash scripts/friction-journal-tally.sh` (no arguments).
   - Parse stdout into three sections: T1 table, T1.5 table,
     Summary. Keep the bucket-ID list from T1 — this is the
     anchor set for the T2 scan.
   - The script always exits 0; do not treat its exit code as a
     signal.

3. **Read the windowed journal slice.**
   - Use Read or Grep+Read to extract entries from
     `docs/07_governance/friction-journal.md` whose nearest H2
     date heading is on or after `window_start`.
   - This slice is the substrate for T2 and T3.

4. **(T2 scan — see body section below.)**

5. **(T3 scan if `--explore` — see body section below.)**

6. **Emit consolidated stdout report** (output shape section below).

## T2 — Anchored-semantic scan

**Anchored, not exploratory.** T2 is asked a narrow question:
given the bucket-ID list extracted from T1, are there entries in
the active window that could plausibly belong to one of these
buckets but weren't tagged?

T2 is NOT asked to discover new buckets. New-bucket discovery is
T3 (gated, see next section).

### Procedure

1. Take the bucket-ID list from T1 (Tasks 4/6/7 output).
2. Read the windowed journal slice (from Invocation flow step 3).
3. For each entry in the window, consider whether the entry's
   content matches the pattern signature of any T1 bucket. The
   pattern signature is whatever the bucket's *existing tagged
   instances* in the journal have in common (verb-shape, context,
   subject).
4. If an entry plausibly matches a bucket but was not tagged with
   that bucket's instance marker, surface it as a T2 candidate.

### What counts as "plausibly matches"

- Same kind of friction (substrate-receipt drift, brief-amendment
  cycle, cross-phase reconciliation, etc.) as the bucket's prior
  instances.
- Same actor or surface (a `cadence-β-*` pattern is about cadence
  observations; a finding about substrate drift wouldn't count
  even if structurally similar).
- Reasonable confidence (≥70%) that a careful reader would tag
  the entry with this bucket if reviewing it now.

If confidence is below that threshold, do NOT surface as T2.
Low-confidence candidates contaminate the high-signal output and
defeat the purpose of anchoring.

### T2 output shape

For each candidate:

- **Bucket:** the existing bucket ID this entry plausibly belongs to.
- **Entry line range:** start–end line numbers in
  `friction-journal.md`.
- **Entry date:** the H2 date the entry sits under.
- **Why match:** one sentence linking the entry's content to the
  bucket's existing tagged instances.
- **Confidence:** high / medium (only surface ≥medium).

## Output shape

(awaiting implementation — Task 13)

## Handling T1.5 output

T1.5 may include false positives: methodology prose lines mentioning
"first-instance" / "second-instance" / etc. as a *concept* (e.g., a
section heading like "12 first-instance pattern observations")
rather than untagged observations needing a bucket name. The marker
regex matches bare `Nth-instance` because that's the dominant
tagging shape (grep audit 2026-05-18 found 73 bare vs 0
parenthesized), so prose mentions slip through and surface as T1.5
with no extractable bucket. Review the cited line before back-
tagging; methodology mentions are recognizable in 2 seconds and
should be discarded.

## What this subagent does NOT do

- Does not modify the journal (no auto-back-tagging of T1.5
  candidates).
- Does not invoke `codify-convention` directly — surfaces
  candidates for the operator to action.
- Does not perform cross-surface consistency checks (separate tool;
  see deferred `doc-sync-reconciler`).
- Does not include MEMORY.md as counting substrate (only as T3
  dedup filter).

## Design spec

`docs/09_briefs/phase-6.5/2026-05-17-friction-pattern-detector-design.md`
