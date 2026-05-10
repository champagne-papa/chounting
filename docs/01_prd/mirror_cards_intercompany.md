# Mirror Cards (Intercompany) — Phase 2 Brief

A two-sided Proposed Mutation Card pattern for intercompany
transactions. When the agent detects an intercompany transaction
in Entity A, the confirmation card shows the mirrored entry that
will post to Entity B. Approving posts to both ledgers in a
single atomic operation, ensuring the due-to / due-from balance
is always correct.

Multi-entity accounting is where the family-office persona spends
the most manual time reconciling. Posting an intercompany entry
in one entity without posting the mirror in the counterparty
creates a reconciliation gap that surfaces weeks later at
month-end close. The Mirror Card makes the two-sidedness visible
and atomic at the approval moment — the user sees both sides
before committing either.

**Status:** Phase 2 pattern, captured during the agent autonomy
design sprint (2026-04-16). Not yet scoped, not yet specified
beyond this stub.

## What this is NOT

- Not automatic intercompany elimination for consolidated
  reporting — that is a separate Phase 3 pattern.
  Elimination entries are a reporting-layer concept; Mirror
  Cards are a posting-layer concept.
- Not a replacement for the intercompany hard ceiling —
  intercompany entries still require human approval regardless
  of rung (see `docs/02_specs/agent_autonomy_model.md` §6,
  System boundary).
- Not a partial-mirror pattern — both sides post together or
  neither posts. Partial intercompany is a reconciliation
  anomaly, not a feature.

## Cross-references

- `docs/02_specs/agent_autonomy_model.md` §6 (intercompany as
  System hard ceiling).
- `docs/02_specs/intent_model.md` §3 (`ProposedMutation` — the
  mutation type for an intercompany transaction carries both
  sides in its delta).
- `docs/07_governance/friction-journal.md` entry 2026-04-16.
