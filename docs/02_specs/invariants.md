# Invariants Index

The canonical index for the 17 Phase 1.1 invariants. The single
place to look up "what are all the rules, where are they
documented, and where are they enforced in code?"

This file is contributor-facing — it answers "is X already a
rule, and if so what's its INV-ID and where is it enforced?"
For audit-side evidence (the test that proves each rule is
enforced, the rationale for implicit coverage where no
dedicated test exists), see `docs/06_audit/control_matrix.md`.
For the full per-invariant rationale, Phase 2 evolution notes,
and interactions, see the leaves in
`docs/02_specs/ledger_truth_model.md`.

**The spec-without-enforcement rule.** An invariant only appears
in this file if it has corresponding enforcement in code today.
Aspirational rules (the Phase 2 posting rules engine, the Phase
2 event-sourcing projection, a future `rule_id` column on
journal entries) do not appear here — they live in Phase 2
briefs under `docs/09_briefs/phase-2/`. See
`docs/02_specs/README.md` for the full rule.

## Bidirectional reachability statement

As of commit `65bcfe0` (Waypoint F verification, completed
during the Phase 1.1 closeout docs restructure):

- **17 distinct INV-IDs** documented in
  `docs/02_specs/ledger_truth_model.md`
- **17 distinct INV-IDs** annotated in code (`src/` +
  `supabase/migrations/`)
- **Symmetric difference: empty.** Every documented invariant
  has at least one annotation site in code; every annotated
  INV-ID has a corresponding leaf in the doc.

The verification command, reproducible at any future point:

```bash
diff <(grep -oE 'INV-[A-Z]+-[0-9]{3}' docs/02_specs/ledger_truth_model.md | sort -u) \
     <(grep -rho 'INV-[A-Z]\+-[0-9]\+' src/ supabase/migrations/ | sort -u)
```

Expected output: empty (no diff).

## The 17 invariants

The order matches the leaf's Summary section: Layer 1 first
(11 invariants), then Layer 2 (6 invariants). Within each
layer, the order matches the order the invariants appear in
`ledger_truth_model.md`.

| # | INV-ID | Layer | Rule (one line) | Enforcement type | Leaf | Code site(s) |
|---|---|---|---|---|---|---|
| 1 | INV-LEDGER-001 | 1 | Debit = credit per journal entry | Deferred CONSTRAINT TRIGGER | [leaf](ledger_truth_model.md#inv-ledger-001--debit--credit-per-journal-entry) | `supabase/migrations/20240101000000_initial_schema.sql` (function `enforce_journal_entry_balance`) |
| 2 | INV-LEDGER-002 | 1 | Posting to a locked period is rejected | Trigger with `SELECT ... FOR UPDATE` | [leaf](ledger_truth_model.md#inv-ledger-002--posting-to-a-locked-period-is-rejected) | `supabase/migrations/20240101000000_initial_schema.sql` (function `enforce_period_not_locked`) |
| 3 | INV-LEDGER-003 | 1 | The events table is append-only | 3 triggers + 3 REVOKEs (defense in depth) | [leaf](ledger_truth_model.md#inv-ledger-003--the-events-table-is-append-only) | `supabase/migrations/20240101000000_initial_schema.sql` (function `reject_events_mutation` + REVOKE TRUNCATE block) |
| 4 | INV-LEDGER-006 | 1 | Journal line amounts are non-negative | CHECK constraint | [leaf](ledger_truth_model.md#inv-ledger-006--journal-line-amounts-are-non-negative) | `supabase/migrations/20240101000000_initial_schema.sql` (CONSTRAINT `line_amounts_nonneg`) |
| 5 | INV-LEDGER-004 | 1 | A journal line is debit XOR credit | CHECK constraint | [leaf](ledger_truth_model.md#inv-ledger-004--a-journal-line-is-debit-xor-credit) | `supabase/migrations/20240101000000_initial_schema.sql` (CONSTRAINT `line_is_debit_xor_credit`) |
| 6 | INV-LEDGER-005 | 1 | A journal line is never all-zero | CHECK constraint | [leaf](ledger_truth_model.md#inv-ledger-005--a-journal-line-is-never-all-zero) | `supabase/migrations/20240101000000_initial_schema.sql` (CONSTRAINT `line_is_not_all_zero`) |
| 7 | INV-MONEY-002 | 1 | Original amount matches base amount | CHECK constraint | [leaf](ledger_truth_model.md#inv-money-002--original-amount-matches-base-amount) | `supabase/migrations/20240101000000_initial_schema.sql` (CONSTRAINT `line_amount_original_matches_base`) |
| 8 | INV-MONEY-003 | 1 | CAD amount matches FX-converted original | CHECK constraint | [leaf](ledger_truth_model.md#inv-money-003--cad-amount-matches-fx-converted-original) | `supabase/migrations/20240101000000_initial_schema.sql` (CONSTRAINT `line_amount_cad_matches_fx`) |
| 9 | INV-IDEMPOTENCY-001 | 1 | Agent-sourced entries require idempotency key | CHECK constraint + Zod refine pairing | [leaf](ledger_truth_model.md#inv-idempotency-001--agent-sourced-entries-require-idempotency-key) | `supabase/migrations/20240101000000_initial_schema.sql` (CONSTRAINT `idempotency_required_for_agent`); `src/shared/schemas/accounting/journalEntry.schema.ts` (`idempotencyRefinement` — Phase 1.1 dead code, activates Phase 1.2) |
| 10 | INV-RLS-001 | 1 | Cross-org data is never visible outside the org | RLS policies (collective) + SECURITY DEFINER helpers | [leaf](ledger_truth_model.md#inv-rls-001--cross-org-data-is-never-visible-outside-the-org) | `supabase/migrations/20240101000000_initial_schema.sql` (RLS HELPER FUNCTIONS section) |
| 11 | INV-REVERSAL-002 | 1 | Reversal entries require a non-empty reason | CHECK constraint | [leaf](ledger_truth_model.md#inv-reversal-002--reversal-entries-require-a-non-empty-reason) | `supabase/migrations/20240102000000_add_reversal_reason.sql` (CONSTRAINT `reversal_reason_required_when_reversing`) |
| 12 | INV-AUTH-001 | 2 | Every mutating service call is authorized | TypeScript middleware (4 pre-flight checks) | [leaf](ledger_truth_model.md#inv-auth-001--every-mutating-service-call-is-authorized) | `src/services/middleware/withInvariants.ts` (primary); `src/services/auth/canUserPerformAction.ts` (permission source) |
| 13 | INV-SERVICE-001 | 2 | Every mutating service function is invoked through `withInvariants` | Structural pattern (export contract + wrap site) | [leaf](ledger_truth_model.md#inv-service-001--every-mutating-service-function-is-invoked-through-withinvariants) | `src/services/accounting/journalEntryService.ts` (export contract); `src/app/api/orgs/[orgId]/journal-entries/route.ts` (wrap site) |
| 14 | INV-SERVICE-002 | 2 | The service layer uses `adminClient`, never `userClient` | Structural pattern (import discipline) | [leaf](ledger_truth_model.md#inv-service-002--the-service-layer-uses-adminclient-never-userclient) | `src/services/accounting/journalEntryService.ts` (adminClient discipline) |
| 15 | INV-MONEY-001 | 2 | Money at the service boundary is string-typed, never JavaScript `Number` | Branded types + Zod schemas + arithmetic helpers + decimal.js confinement (collective) | [leaf](ledger_truth_model.md#inv-money-001--money-at-the-service-boundary-is-string-typed-never-javascript-number) | `src/shared/schemas/accounting/money.schema.ts` (collective enforcement) |
| 16 | INV-REVERSAL-001 | 2 | Reversal lines must mirror the original | TypeScript service function (5-step algorithm) | [leaf](ledger_truth_model.md#inv-reversal-001--reversal-lines-must-mirror-the-original) | `src/services/accounting/journalEntryService.ts` (function `validateReversalMirror`) |
| 17 | INV-AUDIT-001 | 2 | Every mutating service call writes an `audit_log` row in the same transaction | TypeScript service function + call-site discipline | [leaf](ledger_truth_model.md#inv-audit-001--every-mutating-service-call-writes-an-audit_log-row-in-the-same-transaction) | `src/services/audit/recordMutation.ts` (primary); `src/services/accounting/journalEntryService.ts` (call site in `post`) |

## Cross-layer pairings

Six invariants participate in pairings — same rule expressed at
two layers, or two complementary rules that together enforce a
single contract. The "only paired invariants may cross-reference
across layers" rule (established during Waypoint E.1) means
these are the only INV-IDs that legitimately appear annotated
in code at sites belonging to a different layer than their
primary.

| INV-A | INV-B | Relationship | Pairing site |
|---|---|---|---|
| INV-REVERSAL-002 (L1) | INV-REVERSAL-001 (L2) | Layer 1 reason CHECK + Layer 2 mirror service-check; both apply to reversal entries | Cross-references in both directions: `20240102000000_add_reversal_reason.sql` annotation cites INV-REVERSAL-001; `journalEntryService.ts validateReversalMirror` annotation cites INV-REVERSAL-002 |
| INV-IDEMPOTENCY-001 (L1) | INV-IDEMPOTENCY-001 (L2 pre-flight) | Same INV at two layers: Layer 1 CHECK constraint + Layer 2 Zod refine pre-flight (currently dead code in Phase 1.1; activates Phase 1.2) | `20240101000000_initial_schema.sql` (CONSTRAINT) and `journalEntry.schema.ts` (`idempotencyRefinement`) |
| INV-AUTH-001 (L2 primary) | INV-AUTH-001 (L2 permission source) | Same INV at two sites: middleware enforcement + role-action matrix | `withInvariants.ts` (primary) and `canUserPerformAction.ts` (permission source) |
| INV-AUDIT-001 (L2 primary) | INV-AUDIT-001 (L2 call site) | Same INV at two sites: enforcement function + call site inside caller's transaction | `recordMutation.ts` (primary) and `journalEntryService.ts` post function (call site) |
| INV-SERVICE-001 (L2 export contract) | INV-SERVICE-001 (L2 wrap site) | Same INV at two sites: service module exports unwrapped + route handler wraps | `journalEntryService.ts` (export contract) and `journal-entries/route.ts` POST handler (wrap site) |
| INV-LEDGER-003 (L1 primary) | INV-LEDGER-003 (L1 defense in depth) | Same INV at two sites: trigger function + REVOKE TRUNCATE block | `20240101000000_initial_schema.sql` (function `reject_events_mutation` + REVOKE block) |

## Discipline backstops (not invariants)

Two database-level enforcement sites participate in documented
disciplines without warranting their own INV-IDs. These sites
are annotated in their migrations with discoverability comments
that explicitly state the non-promotion (Waypoint E.3).

| Site | Discipline | Rationale for non-promotion |
|---|---|---|
| `unique_entry_number_per_org_period` UNIQUE constraint in `20240104000000_add_entry_number.sql` | The "retroactive collision detector" for the no-FOR-UPDATE entry-number allocation pattern (Transaction Isolation section of `ledger_truth_model.md`) | The rule the codebase actually cares about is sequentiality (entries numbered 1, 2, 3...), not uniqueness. UNIQUE enforces uniqueness but cannot enforce sequentiality (a sequence with gaps still satisfies UNIQUE). Phase 1.1 deliberately accepts gaps under failure conditions. Promoting to INV would contradict the Transaction Isolation section's "discipline, not invariant" classification. |
| `je_attachments_select` RLS policy in `20240106000000_add_attachments.sql` | Collective participant in INV-RLS-001 — the leaf's Phase 2 evolution note states: "The collective invariant does not change; the set of policies that enforce it grows." | INV-RLS-001 is annotated at a single load-bearing point (the SECURITY DEFINER helper functions in migration 001). Per-table replication of the annotation would defeat the rollup framing and inflate the bidirectional sweep count without adding grep value. |

Both sites are annotated in their migrations with comments that
quote the leaf's authoritative phrasing, making the
non-promotion findable from the migration site rather than
requiring a future reader to consult the leaf to understand why
the site has no INV-ID.

## How to add a new invariant

When Phase 1.2 or later phases add new enforcement, follow this
order to keep bidirectional reachability intact:

1. **Write the leaf in `ledger_truth_model.md` first.** Define
   the invariant text, the enforcement mechanism, the layer
   classification, and the interactions with existing
   invariants. The leaf is the canonical statement of the
   rule.
2. **Add the annotation in code.** A `-- INV-XYZ-NNN` comment
   in SQL migrations for Layer 1, a `// INV-XYZ-NNN` comment in
   TypeScript source for Layer 2. The annotation establishes
   bidirectional reachability — a future grep finds both the
   doc and the code site.
3. **Add the row to this file's main table.** New row at the
   end of the layer's section, with the leaf anchor and the
   code site(s).
4. **Add the audit row to `control_matrix.md`.** The
   audit-side evidence table needs the test coverage and the
   enforcement-mechanism specifics.
5. **Verify bidirectional reachability.** Run the diff command
   from the "Bidirectional reachability statement" section
   above. Expected output: empty.

The order is non-negotiable per the
`docs/02_specs/README.md` spec-without-enforcement rule:
**no INV-ID is added to this file before its enforcement
exists in code today.** Aspirational rules belong in Phase 2
briefs.
