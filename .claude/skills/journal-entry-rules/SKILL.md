---
name: journal-entry-rules
description: Rules that govern journal entries, reversals, and money arithmetic. Load when touching journalEntryService, money math, or reversal logic.
trigger: Work touching journal entries, reversals, money arithmetic, or `journalEntryService`.
---

# Journal Entry Rules

**Canonical source:** `docs/02_specs/ledger_truth_model.md`. This
skill summarizes and points; the leaves in that file are
authoritative. If a rule here contradicts a leaf, the leaf wins and
this skill is stale.

## 1. Money is string-typed at every service boundary (INV-MONEY-001)

- Every field that represents money or an FX rate is a `z.string()`
  matching a strict decimal regex at the service boundary. Branded
  `MoneyAmount` / `FxRate` types make misuse a compile-time error.
- Arithmetic on money happens in Postgres `numeric(20,4)` or via
  `decimal.js` confined to
  `src/shared/schemas/accounting/money.schema.ts`. Never JS `+`,
  `*`, or `Array.reduce` on money values anywhere else.
- Use the exported helpers: `addMoney`, `multiplyMoneyByRate`,
  `eqMoney`, `eqRate`, `zeroMoney`, `oneRate`. `toMoneyAmount` /
  `toFxRate` coerce database-driver values into branded strings.
- **v0.5.5 incident.** A service sketch shipped JS `+` on
  `MoneyAmount` strings and didn't compile; the branded type caught
  it. Do not re-add. A violation silently corrupts P&L totals across
  a year of entries even though every individual entry passes the
  deferred balance constraint.
- Full contract: `docs/02_specs/ledger_truth_model.md` INV-MONEY-001
  leaf (including interactions with INV-MONEY-002 and INV-MONEY-003,
  which are the Layer 1 CHECK constraints the service layer
  pre-validates).

## 2. `journalEntryService.post()` is the only writer (Law 2)

The Two Laws of Service Architecture are framing defined in
`docs/02_specs/glossary.md` (Two Laws entry). Law 2: no function in
the codebase inserts into `journal_entries` or `journal_lines`
except `journalEntryService.post()`.

Enforcement of the Laws comes from the combination of
INV-SERVICE-001 (withInvariants wrapping — see the
`service-architecture` skill), INV-SERVICE-002 (`adminClient`
discipline so no alternate DB path gets a user-scoped client), and
INV-AUTH-001 (authorization). The Laws are framing on top of those
invariants, not an INV leaf themselves.

## 3. Reversals must mirror the original (INV-REVERSAL-001 + -002)

When `reverses_journal_entry_id` is populated on a
`PostJournalEntryInput`, `journalEntryService.post` runs
`validateReversalMirror()` **before** the BEGIN transaction. The
check verifies five things, in order:

1. `reversal_reason` is non-empty after trim.
2. The referenced entry exists.
3. Same `org_id` as the reversal (cross-org is rejected).
4. Line count matches (no partial reversals in Phase 1.1).
5. Each reversal line mirrors some original line: same
   `account_id`, `currency`, `amount_original`, `amount_cad`,
   `fx_rate`, `tax_code_id`, with `debit_amount` and `credit_amount`
   swapped.

Rejection branches: `REVERSAL_NOT_MIRROR`, `REVERSAL_CROSS_ORG`,
`REVERSAL_PARTIAL_NOT_SUPPORTED`. INV-REVERSAL-002 is the Layer 1
CHECK (`reversal_reason_required_when_reversing`) that backs the
non-empty-reason rule — the service-layer check gives cleaner
errors; the CHECK is unbypassable.

**Before moving `reversal_reason` anywhere else:** read
`docs/07_governance/adr/0001-reversal-semantics.md`. The column
lives on `journal_entries`, not `audit_log`, and the ADR explains
why.

Full contract: `docs/02_specs/ledger_truth_model.md`
INV-REVERSAL-001 and INV-REVERSAL-002 leaves.

## 4. Agent-sourced entries require an idempotency key (INV-IDEMPOTENCY-001)

`source = 'agent'` rows must have `idempotency_key` non-null,
enforced by both the Zod refine (`PostJournalEntryInputSchema`) and
the Postgres `CHECK (source <> 'agent' OR idempotency_key IS NOT
NULL)`. Manual and import sources may omit the key. Missing means
double-posting on retry.

Full contract: `docs/02_specs/ledger_truth_model.md`
INV-IDEMPOTENCY-001 leaf.
