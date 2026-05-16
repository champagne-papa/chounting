# Cmd+Z as Reversal — Phase 2 Brief

The keyboard shortcut Cmd+Z (Ctrl+Z on Windows) on a
recently-posted journal entry opens a pre-filled reversal form
with `reversal_reason = "User undo within session"` and the
mirror lines pre-computed. The user confirms (or edits the
reason), and the reversal posts through the standard reversal
path per ADR-0001.

Users expect Cmd+Z to undo. The ledger is append-only (ADR-0001),
so real undo is impossible — there is no DELETE, no UPDATE. Routing
Cmd+Z to the pre-filled reversal form is the accounting-correct
answer to a universal user expectation. It is not real undo; it
is one-click-to-legal-reversal with a pre-populated reason the
user can accept or override.

**Status:** Phase 2 pattern, captured during the agent autonomy
design sprint (2026-04-16). Not yet scoped, not yet specified
beyond this stub.

## What this is NOT

- Not real undo. The ledger remains append-only. The reversal is
  a new entry, not a delete. Both entries (original + reversal)
  remain on the ledger permanently.
- Not available for finalized entries outside the reversible
  window (see `mutation_lifecycle.md` §6) — Cmd+Z is a shortcut
  to the existing reversal path, subject to the same timing and
  authorization rules.
- Not a replacement for the full reversal form — users who need
  to write a substantive `reversal_reason` (not the session-undo
  stub text) use the full reversal form via the journal entry
  detail view.

## Cross-references

- `docs/07_governance/adr/0001-reversal-semantics.md` (the
  reversal mechanism Cmd+Z routes through — mirror check,
  reason requirement, period-gap banner).
- `docs/02_specs/mutation_lifecycle.md` §6 (timing rules for
  the 24-hour reversible window).
- `docs/07_governance/friction-journal.md` entry 2026-04-16.
