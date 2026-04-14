# ADR-001: Reversal Entry Semantics

## Status

Accepted

## Date

2026-04-11

## Triggered by

PLAN.md §18c.19 — the founder's resolution of Open Question 19
("Reversal entry mechanism — how is a wrong entry corrected?") during
the v0.5.5 founder-answers pass. This ADR is written verbatim from the
§18c.19 RESOLVED block during the step-5 split on the same day,
producing the first ADR in `docs/decisions/` and establishing the
format for subsequent ADRs.

## Context

PLAN.md §14 ("Event Sourcing vs. CRUD + Audit") resolved that the
Phase 1 ledger uses traditional CRUD with a strong audit table:
`journal_entries` + `journal_lines` are append-only by convention.
RLS policies (§2c) enforce this at the database:

```sql
CREATE POLICY journal_entries_no_update ON journal_entries
  FOR UPDATE USING (false);  -- never updatable; corrections via reversal entries
CREATE POLICY journal_entries_no_delete ON journal_entries
  FOR DELETE USING (false);  -- never deletable
```

§14 said "corrections are made via reversal entries, which is
IFRS-correct" — but the **schema and workflow for creating a reversal
were not specified anywhere** through PLAN.md v0.5.4. This was a real
Phase 1.1 gap: the moment a real user posts a real wrong entry in
Phase 1.3 (real bookkeeping), they need a legal way to correct it, and
reversal is the only legal path. No UPDATE, no DELETE.

The v0.5.2 draft of PLAN.md §18 flagged this as Open Question 19 and
proposed a design. The founder resolved Q19 during the step-2
minimum-unblock pass of v0.5.5 with three mandatory Phase 1.1
additions to the proposed design. This ADR captures the full
resolution, including the mid-cycle `audit_log` → `journal_entries`
placement migration that taught the document process something about
how to handle ambiguous load-bearing instructions.

### Constraints that shaped the decision

- **No UPDATE/DELETE on `journal_entries` or `journal_lines`** — both
  RLS-enforced to `false`. This is not negotiable.
- **IFRS correctness** — the reversal pattern (new entry with
  swapped debits/credits) is the standard IFRS correction mechanism.
- **Phase 1.3 is real bookkeeping** — Phase 1.3 exit criterion #7
  requires exercising reversal on a real entry. The mechanism must
  exist and be tested before Phase 1.3 begins.
- **Audit trail integrity** — auditors must always get an answer to
  "why was this reversal posted?". The reason cannot be optional.
- **Agent path comes in Phase 1.2** — the Phase 1.1 reversal path is
  the manual UI flow; Phase 1.2 adds a `reverseJournalEntry` agent
  tool that wraps the same service function. The schema and service
  layer must be correct in Phase 1.1 so Phase 1.2 plugs in without
  a migration.

## Decision

**Reversal entries are normal `journal_entries` rows with three
additional fields** — a self-FK linking them to the original entry, a
required non-empty reason column, and a mandatory UI banner surfacing
the fiscal period gap — enforced by three independent layers: form
validation, service-layer mirror check, and database CHECK constraint.
Three additions beyond the v0.5.2 proposed design are mandatory in
Phase 1.1, not deferred.

### The schema

Two new columns on `journal_entries`, both nullable at the column
level but guarded by conditional constraints:

```sql
ALTER TABLE journal_entries
  ADD COLUMN reverses_journal_entry_id uuid
    REFERENCES journal_entries(journal_entry_id);

ALTER TABLE journal_entries
  ADD COLUMN reversal_reason text;

-- A reversal entry must have a non-empty reason:
ALTER TABLE journal_entries
  ADD CONSTRAINT reversal_reason_required_when_reversing
  CHECK (
    reverses_journal_entry_id IS NULL
    OR (reversal_reason IS NOT NULL AND length(trim(reversal_reason)) > 0)
  );
```

Partial index on the self-FK (PLAN.md §2e):

```sql
CREATE INDEX journal_entries_reverses_fk_idx
  ON journal_entries (reverses_journal_entry_id)
  WHERE reverses_journal_entry_id IS NOT NULL;
```

### The three mandatory Phase 1.1 additions

**(1) Service-layer mirror check, mandatory in Phase 1.1 with a
dedicated integration test.** When `reverses_journal_entry_id` is
populated, `journalEntryService.post` runs this sequence **before** the
`BEGIN` transaction:

1. Load the referenced entry and all its lines by `journal_entry_id`.
2. Verify the referenced entry exists in the same `org_id`.
   Cross-org reversal is impossible and rejected with
   `ServiceError('REVERSAL_CROSS_ORG', ...)`.
3. Verify line count matches. Partial reversals are Phase 2; a count
   mismatch is rejected with `REVERSAL_PARTIAL_NOT_SUPPORTED`.
4. For each line in the new entry, find a line in the referenced
   entry with the same `account_id`, `currency`, `amount_original`,
   `amount_cad`, `fx_rate`, and `tax_code_id` — and `debit_amount`
   and `credit_amount` **swapped**. If any line cannot be matched,
   reject with `REVERSAL_NOT_MIRROR` and include the offending line
   index in the error message.
5. Verify `reversal_reason` is present and non-empty (re-validates
   the form layer's check because the Phase 1.2 agent path will
   bypass the form).

The check runs before `BEGIN` because rejecting upstream costs less
than rolling back a failed INSERT, and because rejection must happen
before the `audit_log` write so no audit row references a reversal
that did not happen.

The integration test is
`tests/integration/reversalMirror.test.ts`, Category A floor #5
(PLAN.md §10a; `docs/specs/phase-1.1.md` §6g). The test exercises:
(a) non-mirror rejection, (b) empty `reversal_reason` rejection,
(c) the happy path confirming a correctly mirrored reversal lands
with the FK and reason populated.

**(2) Period gap banner in the reversal UI, mandatory,
non-dismissible.** When the reversal's auto-assigned period (the
current open period for the entry's org) differs from the original
entry's period, the reversal form surfaces a warning banner at the top
of the canvas, restating both period labels by their human names:

> You are reversing a **March 2026** entry into **April 2026**. The
> reversal will appear in **April 2026**, not in the original period,
> because March 2026 is closed. Verify this is the behaviour you want
> before posting.

Banner rules:

- Visible by default. Cannot be dismissed. Disappears only when the
  user manually changes `fiscal_period_id` (if another period is
  open) or when the original and reversal periods are the same.
- Restates both period names by their human label, not by UUID.
- Styled as a warning, not an error — the action is legal. The banner
  exists because a user reversing a March entry from April needs to
  understand the reversal posts to April, not back into March.
  Without this surfacing, P&L anomalies appear in the wrong month and
  the user spends an afternoon finding out why.

Full UI specification in PLAN.md §4h.

**(3) `reversal_reason` text column on `journal_entries`, required
non-empty on every reversal entry, enforced by a DB CHECK constraint.**
The reversal UI has a required multiline `reversal_reason` field
(PLAN.md §4h); blank values are rejected at the form layer,
re-validated at the service layer (PLAN.md §15e step 5), and enforced
at the database layer by the CHECK constraint quoted above. **Three
layers for the same rule.** This captures *why* the reversal was
posted — "vendor misclassified," "duplicate of entry #12345," "wrong
amount, FX rate corrected" — which is the story auditors care about,
distinct from the structural FK link.

### The placement rationale and history (read carefully if considering moving the column again)

The v0.5.5 first draft placed the `reversal_reason` column on
**`audit_log`**, not `journal_entries`, because the founder's Q19
wording was *"the audit log captures a reversal_reason text field."*
Claude made the literal placement, applied it across PLAN.md §2a, §4h,
§15e, and §18c.19, and surfaced the trade-off explicitly as a veto
point with both alternatives documented in §2a so the next reader
would see it.

The founder reconsidered within the same v0.5.5 cycle. The corrected
wording is *"the audit **trail** captures,"* where the trail is the
broader concept that includes `journal_entries` columns alongside
`audit_log` rows. **The trail and the log are different things.**

Two reasons the column belongs on `journal_entries`:

1. **Semantic fit.** The reason is a property of the reversal entry
   itself, not of the mutation record that created it. `audit_log` is
   a generic mutation log. Once you start adding domain-specific
   columns there (`invoice_void_reason`, `payment_reversal_reason`,
   ...), the table loses its meaning as a generic record and
   eventually becomes a junk drawer.
2. **Query shape.** "Show me all reversals and why" becomes a
   single-table self-join on `journal_entries`:

   ```sql
   SELECT r.journal_entry_id,
          r.reversal_reason,
          o.entry_date AS original_date,
          o.description AS original_description
   FROM journal_entries r
   JOIN journal_entries o
     ON r.reverses_journal_entry_id = o.journal_entry_id
   WHERE r.reverses_journal_entry_id IS NOT NULL;
   ```

   versus joining through `audit_log` filtered by `action` type. The
   self-join is simpler, faster, and does not depend on
   `audit_log`'s Phase 1 → Phase 2 projection evolution (Phase 1
   writes audit_log synchronously; Phase 2 demotes it to a pg-boss
   projection of the events table — see PLAN.md §14 and
   Simplification 1).

The full placement history is preserved inline in PLAN.md §2a
(`journal_entries` and `audit_log` definitions both carry notes) so a
future reader considering moving the column again sees the tradeoff
without having to dig into this ADR.

## Consequences

**What this enables:**

- Phase 1.1 ships with a functional manual reversal flow, not just a
  schema reservation. Phase 1.3's real bookkeeping can exercise
  reversal on real entries from day one of Phase 1.3.
- The Phase 1.2 `reverseJournalEntry` agent tool has an existing
  service function to wrap — no service-layer work required for the
  agent path beyond the orchestrator glue.
- Auditors querying "why was this posted" get a guaranteed non-empty
  string on every reversal, enforced at three layers.
- The reversal path exercises all the architectural layers — Zod
  validation (§3a), service-layer invariants (§15e), deferred DB
  constraint (§1d), RLS (§2c), and audit_log (§2a) — so the Phase
  1.1 integration test suite proves the full stack works on a
  non-trivial insert shape.

**What this constrains:**

- **Partial reversals are not available in Phase 1.1.** The mirror
  check rejects any reversal whose line count does not match the
  original. A user who wants to reverse one line of a multi-line
  entry has to reverse the whole thing and re-post a corrected
  version — two transactions instead of one. This is accepted as
  the cost of shipping.
- **Reversal-of-reversal chains are not visualized in Phase 1.1.**
  The schema permits them (a reversal is just an entry that points
  at another entry via `reverses_journal_entry_id`; nothing stops
  that target from itself being a reversal), but the UI does not
  visualize the chain. Phase 2 adds a reversal-chain view.
- **Automatic period-end reversals** (the accrual accounting pattern
  where an accrual posted on the last day of a period is
  auto-reversed on the first day of the next period) **are not
  available**. Phase 2 introduces the schedule; Phase 1.1 has no
  automatic reversal.
- **Any future change to the `reversal_reason` column placement**
  (moving it back to `audit_log`, or to a new `reversal_reasons`
  table, or removing it entirely) must update this ADR or supersede
  it with a new one. The placement rationale is load-bearing — the
  two reasons listed above are not style preferences but architectural
  choices that shape query patterns and table semantics.

**What this does NOT change:**

- `journal_entries` remains append-only at the RLS layer. This ADR
  adds columns, not UPDATE/DELETE capability.
- The deferred debit=credit constraint (§1d) validates reversal
  entries the same way it validates original entries — no new trigger,
  no constraint relaxation.
- `audit_log` remains a generic mutation record. The brief `audit_log.reversal_reason` column that existed mid-cycle has been removed; the `audit_log` §2a definition preserves a note explaining why and establishing the "no domain-specific columns on audit_log" rule for future decisions.

## Alternatives considered

### Alternative 1: `UPDATE` or `DELETE` on `journal_entries`

**Rejected.** Not IFRS-correct. Also breaks the audit trail — the
whole point of an append-only ledger is that the historical record
cannot be rewritten. This alternative was not seriously considered
during Q19 because §14 had already resolved the append-only question
in v0.5.0.

### Alternative 2: `reversal_reason` on `audit_log` (the literal Q19 wording)

**Considered, briefly implemented, rejected.** The founder's Q19
wording was "the audit log captures a reversal_reason text field."
Claude made the literal placement and applied it across PLAN.md §2a,
§4h, §15e, and §18c.19 during the v0.5.5 first pass, with the trade-off
flagged explicitly as a veto point in the §2a placement rationale and
in the post-edit summary. The founder reconsidered and corrected
the wording to "audit trail, not audit log" — see the "placement
rationale and history" section above for the full reasoning.

The architectural cost of Alternative 2: `audit_log` becomes a
domain-specific table over time (`invoice_void_reason`,
`payment_reversal_reason`, ...) instead of a generic mutation
record; queries for "show me all reversals and why" require an
audit_log join filtered by action type; and the `reversal_reason`
column would have been orphaned during the Phase 1 → Phase 2
`audit_log` projection migration (PLAN.md §14, Simplification 1),
requiring special handling in the backfill script.

### Alternative 3: Partial reversals in Phase 1.1

**Rejected — deferred to Phase 2.** The mirror check assumes full
mirror because the partial case has UX complexity the Phase 1.1
scope cannot absorb: which lines get reversed, what happens if the
remaining lines no longer balance, whether the partial reversal
references the original or the remaining-balance version, and so on.
These are questions the Phase 2 AP Agent will surface organically
when real AP workflows encounter the need. Phase 1.1 ships with the
simpler rule and the mirror check enforces it; the schema does not
preclude a future relaxation.

### Alternative 4: Separate `reversal_reasons` table joined by journal_entry_id

**Rejected.** Adds a JOIN to every reversal query for no semantic
benefit. The reason is 1:1 with the reversal entry; a separate table
is normalization for its own sake. The CHECK constraint enforcing
non-empty is also harder on a separate table — you have to add a
trigger that runs after insert on `journal_entries` to verify the
matching row exists in `reversal_reasons`, which moves the rule into
trigger land where it is harder to see and easier to bypass. One
column on `journal_entries` is the right shape.

### Alternative 5: `reversal_reason` in `audit_log.before_state` JSONB blob

**Rejected.** Would work mechanically — `audit_log.before_state` is
already `jsonb nullable` and could carry a `{"reversal_reason":
"..."}` object. But this hides the reason inside an otherwise-opaque
blob that no SQL query will discover without ad-hoc JSON extraction,
and it inherits the "domain-specific content on audit_log" problem
from Alternative 2 in a form that is harder to spot because the
content is JSON-typed.

## Cross-references

- **PLAN.md §2a** — `journal_entries` and `audit_log` schema
  definitions with the full placement history preserved inline.
- **PLAN.md §2b** — Reversal mirror invariant row (service-layer
  enforcement, cannot be a DB CHECK).
- **PLAN.md §2e** — Partial index on `reverses_journal_entry_id`.
- **PLAN.md §4h** — Reversal UI full specification (launch point,
  prefill, period gap banner, reversal_reason field, Phase 2
  deferrals).
- **PLAN.md §7 Phase 1.1** — "What is built" reversal path bullet;
  exit criterion #3 (five-test Category A floor).
- **PLAN.md §10a** — Test file layout; Category A floor #5 is
  `reversalMirror.test.ts`.
- **PLAN.md §15e Layer 2** — Full five-step reversal mirror check
  procedure with reject branches.
- **PLAN.md §18c.19 RESOLVED** — The founder's Q19 resolution; this
  ADR is written verbatim from there.
- **PLAN.md §14** — Event sourcing decision; explains the
  Phase 1 → Phase 2 `audit_log` projection migration that Alternative
  2's rejection partly turned on.
- **`docs/specs/phase-1.1.md` §5** — Seed script split (referenced
  because the reversal test setup depends on seeded users).
- **`docs/specs/phase-1.1.md` §6g** — Test 5 (reversal mirror)
  implementation skeleton.

## Notes for future ADR writers

This is the first ADR in the project. A few things worth carrying
forward:

1. **Write ADRs in anger, not in advance.** This ADR exists because
   Q19 forced a real architectural decision with real alternatives
   and real tradeoffs. Pre-populated ADRs become cargo-cult docs
   that rot — see PLAN.md §16.
2. **Capture the history when the decision moves during the same
   cycle.** The `audit_log` → `journal_entries` migration happened
   within the v0.5.5 cycle; if this ADR had been written after the
   first draft and not updated, the placement rationale would have
   been lost and a future reader might move the column back on
   first principles. The "placement rationale and history" section
   above is deliberately detailed for that reason.
3. **Reference PLAN.md by section number.** Section numbers are
   stable across revisions (the Bible has a fixed outline) while
   line numbers are not.
4. **Write the "Alternatives considered" section properly.** Not
   just "we thought about X but rejected it" — say *why*, and name
   the architectural cost the alternative would have imposed.
   Future-you will thank past-you for the cost analysis.
