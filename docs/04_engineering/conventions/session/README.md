# Session-execution conventions — sub-folder

The session-execution conventions sub-split into four files because
the parent `session-execution.md` exceeded the 600-line sub-split
threshold per v2.2 reorg proposal §5.1. Each file collects rules
that fire at the same temporal grain in a session's lifecycle.

See [`../README.md`](../README.md) for the broader routing rule
that determines when a rule belongs in this sub-folder vs. another
topical file.

## Files in this sub-folder

- [`plan-authoring.md`](./plan-authoring.md) — drafting-time
  discipline; verification that fires when a session is writing a
  plan, brief, scope-lock input, or handoff prompt. Cited-Code
  Verification, Spec-to-Implementation Verification, Plan-Time
  Model-Config Verification, plan-substrate-vs-canonical-reality
  drift meta-pattern, Round-N restructure plan workflow, "Verify
  the artifact before agreeing with an alarm" rule, Volume-forecast
  Phase-A-realized.
- [`scope-lock.md`](./scope-lock.md) — scope-lock-time discipline;
  verification that fires when a session is articulating dimensions,
  cross-dependencies, and closure shapes before execution. PARTIAL
  Closure State-Decomposition (Meta A), Scoping-Time Cross-
  Dependency Articulation (Meta B), Material Gaps Surface at Layer-
  Transition Boundaries, Methodology cluster sub-categorization.
- [`session-close.md`](./session-close.md) — close-time discipline;
  verification that fires at chunk close, phase close, or
  retrospective drafting. Verification-gate reference-classification,
  Screenshot-gate verification-shape independence.
- [`iterative-catching.md`](./iterative-catching.md) — runtime
  coordination discipline; gates and verifications fired during
  execution (commit-time, approval-time, paste-time, environmental-
  re-verify-time). Check HEAD before Step 2 Plan, Re-verify
  Environmental Claims at Each Gate, Preservation and Ambiguity
  Gates, Erase-to-Clean vs. Document-to-Verify, Mutual
  Hallucination-Flag-and-Retract Discipline, Session Labeling
  Convention, Session Lock File Convention.

## When CLAUDE.md content lands

At Commit D of the v2.2 reorg, additional rules from CLAUDE.md
relocate into this sub-folder:

- RI-1 through RI-10 cluster → `scope-lock.md`.
- Bidirectional iterative-catching termination → `iterative-catching.md`.
- Substrate-now-enforcement-later → `scope-lock.md`.
- Memory-writes-only Stage 6 firing-shape → `session-close.md`.
- Plan-authoring substrate-verification at transitive-dependency
  grain → `plan-authoring.md`.

At Commit A close-time, those rules have not yet relocated; they
remain at their current home in CLAUDE.md. After Commit D lands,
each sub-file should still be under ~400 lines individually.
