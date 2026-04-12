# Architecture Decision Records

This folder holds one ADR per significant architectural decision. ADRs
are the project's long-term memory — the place where future readers
find out *why* the code is the way it is, not just what it does.

ADRs are not written in advance as documentation ceremony. They are
written **in anger**, when a real decision has to be made with real
tradeoffs and real alternatives, and the reasoning is load-bearing
enough that forgetting it in six months would be costly.

## When to write an ADR

Write an ADR when:

- A decision took more than 30 minutes to make.
- A decision closes off other options in a way that is hard to
  reverse later.
- A future contributor will reasonably ask "why?" and the code alone
  cannot answer.
- A decision contradicts something in `PLAN.md` (in which case, also
  bump `PLAN.md` to match — or record why the ADR supersedes the
  Bible on this specific point).
- A decision moves during the same working session — record the
  history so the next reader does not undo it on first principles.

**Do not write an ADR for:**

- Style preferences (naming, import order, formatting).
- Routine dependency additions — unless the dependency is
  safety-critical enough to warrant explicit version-pinning
  discipline (e.g., `zod-to-json-schema` is tracked this way because
  the agent tool layer depends on its output — see PLAN.md §18a.9).
- Trivial bug fixes.
- Per-feature specs — those live under `docs/specs/`, not here.

## Format

One file per ADR, named `NNNN-short-slug.md` where `NNNN` is a
zero-padded four-digit number in commit order. Contents follow this
template:

```markdown
# ADR-NNNN: [Decision Title]

## Status

Accepted | Superseded by ADR-MMMM | Deprecated

## Date

YYYY-MM-DD

## Triggered by

Which conversation, PR, or incident prompted this.

## Context

What problem needed solving and what constraints apply.

## Decision

What was decided. A few sentences to a few paragraphs. If the
decision has multiple parts, list them clearly.

## Consequences

What this enables and what it constrains. Be honest about the
downside — consequences with no cost are rare and usually indicate
the cost was not examined.

## Alternatives considered

What was rejected and why. Name the architectural cost each
alternative would have imposed. Not "we thought about X" — *why X
was wrong for this situation*.

## Cross-references

Links to PLAN.md sections, other ADRs, specs, or external docs that
the reader should follow for more detail.
```

## Supersedes and supersession

ADRs are never edited after they are accepted. If a decision changes,
write a new ADR, set its `Triggered by` field to the ADR being
superseded, and update the old ADR's status to
`Superseded by ADR-MMMM`. The old ADR stays in place as history — do
not delete it.

## Current ADRs

| # | Title | Status | Date |
|---|---|---|---|
| [ADR-0001](./0001-reversal-semantics.md) | Reversal Entry Semantics | Accepted | 2026-04-11 |

## Related files

- **`PLAN.md`** — the Architecture Bible. ADRs reference sections in
  PLAN.md by number (§2a, §15e, §18c.19, ...).
- **`CLAUDE.md`** at the repo root — standing rules loaded every
  session. Derived from PLAN.md, filtered by the throwaway-work test.
- **`docs/specs/`** — per-phase execution briefs. ADRs reference
  specific brief sections when the decision affects execution work.
