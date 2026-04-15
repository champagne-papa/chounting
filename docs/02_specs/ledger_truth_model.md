# Ledger Truth Model

The rules the Phase 1.1 system enforces, where each rule is enforced,
and what happens when the enforcement is violated. This file answers
"what is legal in the ledger, and who stops what is illegal?" The
companion file `docs/02_specs/data_model.md` answers "what is the
shape of the schema?"

**Source:** extracted from PLAN.md Invariants 1-6, §1d (four-layer
hierarchy), §2b (deferred vs non-deferred invariants), §3a
(money-as-string rationale), §10c (transaction isolation), §15 and
§15e (service communication rules) during Phase 1.1 closeout
restructure. Enforcement points verified against the Phase 1.1
codebase:
`supabase/migrations/20240101000000_initial_schema.sql`,
`supabase/migrations/20240102000000_add_reversal_reason.sql`,
`src/services/middleware/withInvariants.ts`,
`src/services/accounting/journalEntryService.ts`,
`src/services/audit/recordMutation.ts`,
`src/shared/schemas/accounting/money.schema.ts`,
`src/services/errors/ServiceError.ts`,
`src/services/auth/canUserPerformAction.ts`.

**Scope.** This file documents Phase 1.1 reality only. An invariant
appears here if and only if it has a corresponding enforcement point
in code today. Aspirational rules (the Phase 2 posting rules engine,
the Phase 2 event-sourcing projection, a future `rule_id`/
`rule_version` column on journal entries) do not appear here — they
live in Phase 2 briefs. When a Phase 1.1 invariant's enforcement is
scheduled to evolve in Phase 2 (for example, INV-AUDIT-001 moving
from a synchronous write to a projection), the note appears inline
on that invariant as a Phase 2 evolution reference, not as a
separate set of aspirational invariants.

**Cross-references:**
- Product thesis: `docs/00_product/product_vision.md` (The Thesis
  section)
- Schema shape: `docs/02_specs/data_model.md`
- Phase 1 → Phase 2 simplifications:
  `docs/03_architecture/phase_simplifications.md`
- Request lifecycle: `docs/03_architecture/request_lifecycle.md`
- Testing strategy (Category A floor tests):
  `docs/04_engineering/testing_strategy.md`

---

## The Authority Gradient

The product thesis in `docs/00_product/product_vision.md` states:

> **This system is not an accounting UI with AI assistance. It is a
> deterministic financial engine with a probabilistic interface.**
>
> Agents interpret intent and propose actions. Services execute
> domain logic deterministically. The database enforces invariants
> absolutely. Authority flows down; structured errors flow up.

The **authority gradient** — *agents propose, services decide, the
database enforces* — is the permanent contract between the three
actors in the system. It does not change across phases. What
changes across phases is the *interface* through which proposals
and confirmations flow (Phase 1.2 UI-coupled, Phase 2 extracted to
API primitives — see
`docs/09_briefs/phase-2/interaction_model_extraction.md`). The
gradient itself is permanent.

### How the Gradient Is Implemented

The four-layer hierarchy is the mechanical implementation of the
authority gradient. Each layer has a specific enforcement
mechanism, a specific failure mode, and a specific position in the
gradient:

| Layer | Role | Enforcement mechanism | Examples |
|---|---|---|---|
| **Layer 1 — Physical Truth** | The database enforces | Postgres CHECK constraints, triggers, RLS policies | INV-LEDGER-001 through 006, INV-MONEY-002/003, INV-IDEMPOTENCY-001, INV-REVERSAL-002, INV-RLS-001 |
| **Layer 2 — Operational Truth** | Services decide | TypeScript service functions wrapped in `withInvariants()`, Zod schemas at every boundary, typed `ServiceError` codes | INV-SERVICE-001/002, INV-AUTH-001, INV-MONEY-001, INV-REVERSAL-001, INV-AUDIT-001 |
| **Layer 3 — Temporal Truth** | Events as source of truth | Append-only event stream (`events` table with triggers) | INV-LEDGER-003 (enforcement exists at Layer 1 today; the Layer 3 role of "events as source of truth" is a Phase 2 obligation) |
| **Layer 4 — Cognitive Truth** | Agents propose | Structured-response contracts, confirmation-first model, anti-hallucination rules — no enforcement invariants at this layer by design | (none — see Layer 4 section below) |

**The lower-wins rule.** When two layers would disagree, the lower
layer wins. A service function calling the database with an
unbalanced journal entry will have its transaction rolled back by
the deferred constraint at COMMIT, regardless of what the service
function "thought" it was doing. An agent proposing a posting to a
locked period will have the proposal rejected by the service layer,
and if somehow the service were bypassed, by the database trigger.
Authority only flows *down* — no layer can override a lower layer.

**Why Layer 4 has no enforcement invariants.** Agents are allowed to
be wrong. That is the entire point of the confirmation-first model:
an agent proposes, a human confirms, the service executes, the
database verifies. If the agent is wrong, the error is caught
before it touches the ledger. Putting enforcement invariants at
Layer 4 would mean trusting agents to be correct, which would
undermine the gradient. The Layer 4 section below explains what
*does* live at this layer (discipline, not enforcement) and why
that is load-bearing despite the absence of INV-IDs.

**Structured errors flow up.** When Layer 1 rejects a write (CHECK
violation, trigger exception, RLS failure), the service layer
catches the Postgres error and re-raises it as a typed
`ServiceError` code. The agent or UI consuming that code never sees
a raw Postgres error message — it sees a stable contract
(`PERIOD_LOCKED`, `REVERSAL_NOT_MIRROR`, `PERMISSION_DENIED`, etc.)
that it can act on programmatically. The error contract is the
*how* of "structured errors flow up" and is documented in its own
section below.

---

## Layer 1 — Physical Truth (The Database Enforces)

Layer 1 is where the rules become physics. Every invariant in this
layer is enforced by the database itself — a Postgres CHECK
constraint, a trigger function, or a row-level security policy — so
that the rule holds regardless of which service function calls the
database, which user is logged in, or whether the caller has
carefully validated the input. **Layer 1 is the layer that cannot
be bypassed by a bug in any higher layer.** If a service function
tries to insert an unbalanced journal entry because of a regression,
the deferred constraint trigger rolls the transaction back at
COMMIT and raises `check_violation`. If a service function forgets
to filter by `org_id` because of a typo, RLS (when the query runs
through a user-scoped client) returns zero rows rather than leaking
cross-org data. Layer 1 is not the *only* place these rules are
checked — many of them also have service-layer defense-in-depth
checks — but Layer 1 is the authoritative place, and a rule is
only considered truly enforced if Layer 1 rejects violations.

**What makes a rule a Layer 1 invariant.** Three criteria, all of
which must hold:

1. **Mechanically enforced by the database.** A CHECK constraint, a
   trigger function, or an RLS policy — not application code, not a
   convention, not a code review rule.
2. **Unbypassable from above.** No service function, no
   authenticated user, no agent can issue a DML statement that
   bypasses the rule. The service-role client
   (`src/db/adminClient.ts`) bypasses RLS but still hits CHECK
   constraints and triggers, so CHECK-based and trigger-based Layer
   1 rules apply to *every* client. RLS-based Layer 1 rules apply
   only to user-scoped clients; the service-role client operates
   above RLS.
3. **Verified by an integration test.** At minimum, one integration
   test attempts to violate the rule through the service layer and
   confirms the violation is rejected with the expected error
   shape. The five Category A floor tests in `tests/integration/`
   cover the most load-bearing Layer 1 invariants; see
   `docs/04_engineering/testing_strategy.md`.

The Layer 1 invariants are presented below in the order they appear
in the migration file, so a reader walking from the SQL to the
invariant documentation follows the same sequence.

### INV-LEDGER-001 — Debit = credit per journal entry

**Invariant.** The sum of `debit_amount` across all `journal_lines`
for a given `journal_entry_id` must equal the sum of
`credit_amount` across the same lines. This rule is enforced at
transaction commit time, not at statement time — a service function
may insert any number of lines within a single transaction, and
the rule is checked once when the transaction commits.

**Enforcement.** `CONSTRAINT TRIGGER trg_enforce_journal_entry_balance`,
defined in `supabase/migrations/20240101000000_initial_schema.sql`.
The trigger is declared `DEFERRABLE INITIALLY DEFERRED`, which
means Postgres evaluates it at `COMMIT` rather than after each
row-level operation. The trigger body aggregates sums and raises
`check_violation` if they disagree:

```sql
CREATE OR REPLACE FUNCTION enforce_journal_entry_balance()
RETURNS TRIGGER AS $$
DECLARE
  total_debit numeric(20,4);
  total_credit numeric(20,4);
BEGIN
  SELECT
    COALESCE(SUM(debit_amount), 0),
    COALESCE(SUM(credit_amount), 0)
  INTO total_debit, total_credit
  FROM journal_lines
  WHERE journal_entry_id = COALESCE(NEW.journal_entry_id, OLD.journal_entry_id);

  IF total_debit <> total_credit THEN
    RAISE EXCEPTION
      'Journal entry % is not balanced: debits=%, credits=%',
      COALESCE(NEW.journal_entry_id, OLD.journal_entry_id), total_debit, total_credit
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE CONSTRAINT TRIGGER trg_enforce_journal_entry_balance
  AFTER INSERT OR UPDATE OR DELETE ON journal_lines
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW
  EXECUTE FUNCTION enforce_journal_entry_balance();
```

**Why deferred.** A journal entry with two or more lines cannot be
inserted line-by-line if the balance check runs at statement time
— after the first `INSERT`, the entry is transiently unbalanced
(total_debit ≠ total_credit), and a non-deferred trigger would
reject the first insert before the second line was written. The
`DEFERRABLE INITIALLY DEFERRED` setting moves the evaluation to
`COMMIT`, by which time all lines for the entry have been inserted
and the sums can be compared against a fully-populated set.

**Interaction with the service layer.**
`journalEntryService.post()` does *not* re-check debit = credit in
application code before `BEGIN`. The deferred constraint at
`COMMIT` is the single source of truth; an application-layer check
would be duplicate enforcement that could drift from the database
truth. The Zod schema at the service boundary
(`PostJournalEntryInputSchema.refine(...)`) does check balance as a
pre-flight validation so the caller gets a fast error for the
common case, but that check is for ergonomics — the authoritative
enforcement is the database trigger. See
`docs/03_architecture/phase_simplifications.md` for the "one
enforcement point per rule" discipline that this embodies.

**Transaction isolation note.** The deferred constraint runs inside
the caller's transaction, so the isolation level of that
transaction determines when the constraint sees other transactions'
writes. The Phase 1.1 isolation level is READ COMMITTED (Postgres
default), which is the correct choice for this constraint — see
the "Transaction Isolation" section later in this file.

**Category A floor test.**
`tests/integration/unbalancedJournalEntry.test.ts` posts a journal
entry with deliberately mismatched debit/credit totals through the
service layer and asserts that the transaction is rolled back with
`ServiceError('POST_FAILED', ...)` carrying the
`check_violation` code as its cause. This test is the mechanical
proof that INV-LEDGER-001 cannot be bypassed through normal service
calls. See `docs/04_engineering/testing_strategy.md` for the full
Category A floor table.

**Referenced by:** `docs/02_specs/data_model.md` `journal_lines`
section; `docs/03_architecture/request_lifecycle.md` manual path
and confirmation commit path; `docs/03_architecture/phase_plan.md`
Phase 1.1 "What was built" bullet;
`docs/04_engineering/testing_strategy.md` Category A floor table;
`docs/04_engineering/developer_setup.md` quick-check section;
`docs/04_engineering/conventions.md` worked example;
`docs/03_architecture/phase_simplifications.md` "What is NOT
simplified" bullet.

---

### INV-LEDGER-002 — Posting to a locked period is rejected

**Invariant.** A journal line whose parent `journal_entries` row
references a `fiscal_periods` row with `is_locked = true` cannot
be inserted. The insert is rejected by the database with
`check_violation` before the row reaches `journal_lines`. Locked
periods are immutable history; corrections to a locked period
are made via a reversal entry posted to a currently-open period
(see INV-REVERSAL-001 for the mirror rule and INV-REVERSAL-002
for the reason requirement).

**Enforcement.** `TRIGGER trg_enforce_period_not_locked`,
defined in
`supabase/migrations/20240101000000_initial_schema.sql`. The
trigger fires `BEFORE INSERT OR UPDATE` on `journal_lines` and
rejects the operation if the parent entry's period is locked.
The trigger body takes a row-level lock on the `fiscal_periods`
row via `SELECT ... FOR UPDATE` before reading `is_locked`:

```sql
CREATE OR REPLACE FUNCTION enforce_period_not_locked()
RETURNS TRIGGER AS $$
DECLARE
  v_period_id uuid;
  v_is_locked boolean;
BEGIN
  SELECT je.fiscal_period_id INTO v_period_id
  FROM journal_entries je
  WHERE je.journal_entry_id = NEW.journal_entry_id;

  SELECT fp.is_locked INTO v_is_locked
  FROM fiscal_periods fp
  WHERE fp.period_id = v_period_id
  FOR UPDATE;

  IF v_is_locked THEN
    RAISE EXCEPTION
      'Cannot post to a locked fiscal period (journal_entry_id=%, period_id=%)',
      NEW.journal_entry_id, v_period_id
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_enforce_period_not_locked
  BEFORE INSERT OR UPDATE ON journal_lines
  FOR EACH ROW
  EXECUTE FUNCTION enforce_period_not_locked();
```

**Why a row-level lock, and why it is load-bearing.** Without
the `FOR UPDATE` clause, this trigger has a race condition.
Consider two concurrent transactions:

- Transaction A: posting a new journal entry to period P. The
  trigger reads `is_locked` and sees `false`.
- Transaction B: locking period P via
  `periodService.lock()`, running
  `UPDATE fiscal_periods SET is_locked = true WHERE period_id = P`.

Under READ COMMITTED isolation, if transaction B commits
between A's read and A's commit, A's `journal_lines` insert
succeeds and commits into a now-locked period. The lock
intended to freeze period P has been circumvented by
concurrent transaction ordering. In an accounting system, a
journal entry that posts after a period is locked is a silent
correctness failure — it appears in the period's P&L but was
never approved as part of that period's close.

`SELECT ... FOR UPDATE` on the `fiscal_periods` row closes the
race. The trigger takes a row-level lock on the period before
reading `is_locked`. Any concurrent `periodService.lock()`
transaction attempting to
`UPDATE fiscal_periods SET is_locked = true` on the same row
blocks until the trigger's transaction either commits (at
which point B proceeds and locks the period for future posts)
or rolls back. This serializes the check against concurrent
locks without elevating isolation across the entire
transaction.

**Interaction with the service layer.**
`journalEntryService.post()` calls `periodService.isOpen()` as
a pre-flight check *before* `BEGIN`. That pre-flight reads
`is_locked` without a row lock and returns a clean
`ServiceError('PERIOD_LOCKED', ...)` if the period is already
locked. This is an ergonomic optimization — it lets the common
case ("user tried to post to a period they already knew was
locked") return a clean typed error before any transaction is
opened. **But the service-layer check is not authoritative.**
An attacker or regression that bypassed
`journalEntryService.post()` and issued direct DML through the
service-role client would still hit the trigger at INSERT
time, and the race between a concurrent period lock and a
journal post is handled only by the trigger's `FOR UPDATE`.
The service-layer check is a pre-flight comfort feature; the
trigger is the rule.

**Transaction isolation note.** The `FOR UPDATE` row-lock
strategy is the reason Phase 1.1 runs under Postgres's default
READ COMMITTED isolation instead of elevating to
`SERIALIZABLE`. A targeted row lock is cheaper than SSI
predicate locking for the single race pattern that matters in
Phase 1. See the Transaction Isolation section at the end of
this layer for the three-reason rejection of `SERIALIZABLE`
and the Phase 2 revisit criteria.

**Category A floor test.**
`tests/integration/lockedPeriodRejection.test.ts` seeds a
locked fiscal period, attempts to post a journal entry whose
`fiscal_period_id` references that locked period through the
service layer, and asserts that the call raises
`ServiceError('PERIOD_LOCKED', ...)` with no rows created in
`journal_entries` or `journal_lines`. This is the mechanical
proof that INV-LEDGER-002 cannot be bypassed by any code path
that respects the trigger. See
`docs/04_engineering/testing_strategy.md` for the full
Category A floor table.

**Phase 2 evolution.** The trigger shape does not change in
Phase 2. When the events table begins receiving writes (the
Simplification 2 correction), a `PeriodLockedEvent` will be
written inside the same transaction as the
`UPDATE fiscal_periods SET is_locked = true` statement, and
the Phase 2 projection layer will update `audit_log` and any
other derived state asynchronously. The authoritative lock
enforcement — the trigger and its `FOR UPDATE` — is
unchanged.

**Referenced by:** `docs/02_specs/data_model.md`
`fiscal_periods` section (lock mechanism paragraph) and
`journal_lines` section (triggers list);
`docs/03_architecture/request_lifecycle.md` manual path
(Period check step); `docs/03_architecture/phase_plan.md`
Phase 1.1 "What was built" bullet and Phase 1.3 exit
criterion 8 ("Period lock exercised after the real close");
`docs/04_engineering/testing_strategy.md` Category A floor
table; `docs/04_engineering/conventions.md` row-lock pattern
note.

---

### INV-LEDGER-003 — The events table is append-only

**Invariant.** No `UPDATE`, no `DELETE`, and no `TRUNCATE`
can modify rows in the `events` table. Once a row is
inserted, it is permanent. This is the Layer 1 enforcement
of the append-only rule that makes the events table
trustworthy as a source of truth in Phase 2.

**Scope in Phase 1.1.** The `events` table is a reserved seat
— created in the Phase 1.1 initial migration with
append-only triggers installed from day one, but no code
writes to it until Phase 2 (Simplification 2, see
`docs/03_architecture/phase_simplifications.md`). The
invariant is still a Layer 1 rule today because the triggers
are installed and would fire on any attempt to mutate an
`events` row, whether by direct DML, a misconfigured service
function, or a malicious caller. The rule *becomes
observable* in Phase 2 when events begin to carry real
content. It *is enforceable* in Phase 1.1 because the
physical enforcement exists now.

**Enforcement.** Three triggers plus three `REVOKE`
statements, defined in
`supabase/migrations/20240101000000_initial_schema.sql`. Two
of the triggers fire `BEFORE` row-level mutations and one
fires `BEFORE` a statement-level `TRUNCATE`. The triggers all
call the same rejection function:

```sql
CREATE OR REPLACE FUNCTION reject_events_mutation()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'events table is append-only — UPDATE, DELETE, and TRUNCATE are forbidden'
    USING ERRCODE = 'feature_not_supported';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_events_no_update
  BEFORE UPDATE ON events
  FOR EACH ROW
  EXECUTE FUNCTION reject_events_mutation();

CREATE TRIGGER trg_events_no_delete
  BEFORE DELETE ON events
  FOR EACH ROW
  EXECUTE FUNCTION reject_events_mutation();

CREATE TRIGGER trg_events_no_truncate
  BEFORE TRUNCATE ON events
  FOR EACH STATEMENT
  EXECUTE FUNCTION reject_events_mutation();

REVOKE TRUNCATE ON events FROM PUBLIC;
REVOKE TRUNCATE ON events FROM authenticated;
REVOKE TRUNCATE ON events FROM anon;
```

**Why three triggers instead of one.** Postgres fires
different trigger events for different DML operations, and a
`BEFORE UPDATE` trigger does not catch `DELETE` or
`TRUNCATE`. A `BEFORE UPDATE OR DELETE` compound trigger
still does not catch `TRUNCATE`, because `TRUNCATE` is a
DDL-adjacent operation with its own trigger event. Each
mutation path has its own trigger. The rule "events are
append-only" has to be stated to Postgres three times to
cover three different ways a row could disappear.

**Why REVOKE TRUNCATE plus the trigger — defense in depth.**
`TRUNCATE` was specifically called out in v0.5.3 of the
architecture as the one mutation path that could silently
wipe the append-only history. A role with `TRUNCATE`
privilege could bypass any row-level trigger because row-level
triggers do not fire during `TRUNCATE` — only statement-level
`BEFORE TRUNCATE` triggers do. The Phase 1.1 migration
therefore takes two protections: it installs
`trg_events_no_truncate` as a `BEFORE TRUNCATE` statement
trigger that raises `feature_not_supported`, AND it revokes
the `TRUNCATE` privilege from every non-privileged role
(`PUBLIC`, `authenticated`, `anon`). The Supabase-managed
`service_role` retains the `TRUNCATE` privilege because the
platform's grant management makes revoking it awkward, but
the trigger catches it anyway. The trigger is the
authoritative enforcement; the REVOKE is the second line.

**Interaction with the service layer.** No service function
in Phase 1.1 writes to `events` — the path does not exist
because events are reserved for Phase 2. The trigger
enforcement runs regardless of which client issues the DML,
including the service-role client, because triggers fire on
every DML operation that matches their trigger events.
**Phase 2 service functions** that begin writing events
inside mutation transactions (per the Simplification 1
correction) will rely on these triggers to guarantee that the
only legal operation on `events` is `INSERT`; any Phase 2 bug
that tries to update or delete an event is caught by the
database.

**No dedicated integration test — Phase 1.2 obligation.**
INV-LEDGER-003 is not on the Category A floor today because
the `events` table is not yet exercised by any Phase 1.1 code
path. The correctness floor test for the append-only rule is
scheduled to land in Phase 2 alongside the first service
function that writes events. Until then, the invariant is
enforced but not exercised by a test. A manual verification
procedure (issue `UPDATE events SET payload = '{}' WHERE
event_id = any_uuid` through `psql` and confirm the
`feature_not_supported` error surfaces) is documented in
`docs/04_engineering/conventions.md` as a spot-check.

**Phase 2 evolution.** When the events table begins receiving
writes, INV-LEDGER-003 moves from "enforced but not
exercised" to "the single most load-bearing rule in the
system," because the event stream becomes the source of
truth from which `audit_log` and other projections are
rebuilt (Invariant 5 in the Architecture Bible). Phase 2
adds the dedicated integration test that attempts every
mutation path (`UPDATE`, `DELETE`, `TRUNCATE`) and asserts
each is rejected by the trigger. The trigger shape and the
REVOKE statements do not change; the test coverage around
them grows.

**Referenced by:** `docs/02_specs/data_model.md` `events`
section (triggers list and reserved-seat rationale);
`docs/03_architecture/phase_simplifications.md`
Simplification 2 ("Events table reserved seat");
`docs/03_architecture/phase_plan.md` Phase 2 "What lights
up" bullet; `docs/04_engineering/conventions.md` manual
spot-check procedure; `docs/04_engineering/testing_strategy.md`
Phase 2 test obligations.

---

### INV-LEDGER-006 — Journal line amounts are non-negative

**Invariant.** Both `debit_amount` and `credit_amount` on
any row in `journal_lines` must be greater than or equal to
zero. Negative amounts are never legal on either side of a
journal line; a correction to an over-posted amount is made
by a reversal entry (which swaps debits and credits), not by
a negative amount on the same side.

**Enforcement.** `CONSTRAINT line_amounts_nonneg CHECK
(debit_amount >= 0 AND credit_amount >= 0)` on
`journal_lines`, defined in
`supabase/migrations/20240101000000_initial_schema.sql`:

```sql
CONSTRAINT line_amounts_nonneg
  CHECK (debit_amount >= 0 AND credit_amount >= 0)
```

**Why a CHECK and not a domain type.** Postgres supports
domain types (`CREATE DOMAIN non_negative_amount AS
numeric(20,4) CHECK (VALUE >= 0)`) which would let the rule
be declared on the type rather than repeated per column. The
schema does not use domains because the pattern is rare
elsewhere in the project and the extra indirection hurts
readability when a reader is walking from a `CREATE TABLE`
block to the rules that apply to it. Inline `CHECK`
constraints are the convention; domains are a potential
future cleanup.

**Interaction with INV-LEDGER-004 and INV-LEDGER-005.** This
rule is one of three CHECK constraints that together define
what a valid `journal_lines` row looks like: (a) both
amounts non-negative (this invariant), (b) one amount is
zero (INV-LEDGER-004 — debit XOR credit), (c) the other is
strictly positive (INV-LEDGER-005 — not all-zero).
Collectively they enforce that every journal line is
*exactly one* of "a positive debit" or "a positive credit,"
which is the atomic shape the double-entry ledger rule
operates on. Violating any one of the three rejects the
insert with `check_violation`.

**Interaction with the service layer.** The Zod schema
`JournalLineInputSchema` in
`src/shared/schemas/accounting/journalEntry.schema.ts` also
validates that both amounts are non-negative at the service
boundary, as part of the XOR `.refine()` that jointly
enforces this invariant together with INV-LEDGER-004 and
INV-LEDGER-005. The Zod refine is a pre-flight ergonomic
check — it produces a clean
`z.ZodError` with a specific field path before `BEGIN`,
which is a better user experience than a generic
`check_violation` from Postgres. **The database CHECK is the
authoritative enforcement.** An agent path or a manual-DML
path that skipped Zod validation would still hit the CHECK
at insert time.

**No dedicated integration test — implicit coverage.**
INV-LEDGER-006 is not on the Category A floor as a standalone
test. It is exercised implicitly by:
`tests/integration/unbalancedJournalEntry.test.ts` (whose
input constructions assume non-negative amounts and would
surface a Zod error if they drifted);
`tests/unit/journalEntrySchema.test.ts` (which tests the
Zod `.refine()` logic for the combined XOR +
non-negative + non-zero rule); and the Phase 1.1 manual
journal entry exit criterion #9 (the founder's 5 real posts,
none of which can have negative amounts because the form
input widget does not accept them). The CHECK itself has no
dedicated "try to post a negative amount" test because
doing so would require bypassing both the Zod schema and the
manual entry form; the CHECK is the last line of defense
against a path that does not exist in Phase 1.1 code.

**Referenced by:** `docs/02_specs/data_model.md`
`journal_lines` section (named CHECKs list);
`docs/03_architecture/phase_plan.md` Phase 1.1 schema
obligations; `docs/04_engineering/testing_strategy.md` unit
test coverage for `journalEntrySchema.test.ts`;
`docs/04_engineering/conventions.md` Zod-at-boundary pattern.

---

### INV-LEDGER-004 — A journal line is debit XOR credit

**Invariant.** For any row in `journal_lines`, at least one
of `debit_amount` and `credit_amount` must be zero. A line
can be a debit (positive `debit_amount`, zero
`credit_amount`) or a credit (zero `debit_amount`, positive
`credit_amount`), but not both. This rule is what makes
"debit" and "credit" two separate columns instead of one
signed column: the presence of a value in one column is the
direction, and the direction is exclusive.

**Enforcement.** `CONSTRAINT line_is_debit_xor_credit CHECK
((debit_amount = 0) OR (credit_amount = 0))` on
`journal_lines`, defined in
`supabase/migrations/20240101000000_initial_schema.sql`:

```sql
CONSTRAINT line_is_debit_xor_credit
  CHECK ((debit_amount = 0) OR (credit_amount = 0))
```

**Why not a signed column.** A single signed `amount`
column with a positive/negative convention would satisfy
the accounting math with less schema surface, but it
produces a category of bugs that the two-column schema
prevents. A signed-column schema forces every query that
computes "sum of debits" or "sum of credits" to branch on
sign (`SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END) AS
debits`), and a forgotten branch silently produces wrong
results. The two-column schema makes the branches
explicit at the column level: the P&L query sums
`debit_amount` from one column and `credit_amount` from
another, and there is no sign convention to forget. The
cost of two columns plus this CHECK is paid once at schema
time; the cost of a signed column would be paid on every
query for the life of the project.

**Why this is a CHECK and not application-side.** The rule
holds *for every row regardless of which code path writes
it*, and the database is the only place in the system that
every write path passes through. A service-layer check
would be duplicate enforcement that could drift (a new
service function forgetting to call it, an agent path
skipping it). The CHECK is the single source of truth; the
service layer's Zod refine (see INV-LEDGER-006 interaction
note) exists only for the ergonomic error message.

**Interaction with INV-LEDGER-005 and INV-LEDGER-006.** See
the "Interaction with INV-LEDGER-004 and INV-LEDGER-005"
note under INV-LEDGER-006 above — the three CHECK
constraints on `journal_lines` jointly define the valid
shape of a line. INV-LEDGER-004 says "one side is zero,"
INV-LEDGER-005 says "the other side is strictly positive,"
and INV-LEDGER-006 says "neither is negative." Each is
necessary; none is sufficient on its own.

**Interaction with the service layer.** The Zod schema's
XOR `.refine()` in
`src/shared/schemas/accounting/journalEntry.schema.ts`
validates this rule at the service boundary for ergonomic
error messages, not as authoritative enforcement. The
database CHECK is the rule; the Zod refine is the nice
error message.

**No dedicated integration test — implicit coverage.**
Same posture as INV-LEDGER-006: the XOR rule is exercised
implicitly by `tests/unit/journalEntrySchema.test.ts` and by
the construction of every integration test that posts real
journal entries. The CHECK has no dedicated "try to post a
line with both debit and credit set" test because the form
input and the Zod schema both reject it before the CHECK
can fire.

**Referenced by:** `docs/02_specs/data_model.md`
`journal_lines` section (named CHECKs list);
`docs/03_architecture/phase_plan.md` Phase 1.1 schema
obligations; `docs/04_engineering/testing_strategy.md` unit
test coverage; `docs/04_engineering/conventions.md` Zod
`.refine()` pattern.

---

### INV-LEDGER-005 — A journal line is never all-zero

**Invariant.** For any row in `journal_lines`, at least one
of `debit_amount` and `credit_amount` must be strictly
positive. A line where both amounts are zero is rejected,
even though such a line would trivially satisfy the
debit-equals-credit rule at the aggregate level.

**Enforcement.** `CONSTRAINT line_is_not_all_zero CHECK
(debit_amount > 0 OR credit_amount > 0)` on
`journal_lines`, defined in
`supabase/migrations/20240101000000_initial_schema.sql`:

```sql
CONSTRAINT line_is_not_all_zero
  CHECK (debit_amount > 0 OR credit_amount > 0)
```

**Why this rule exists.** An all-zero journal line is
technically legal under INV-LEDGER-001 (debits equal
credits — 0 = 0) and technically legal under INV-LEDGER-004
(at least one side is zero — both are). Without this
constraint, a service-layer bug or a misconfigured import
path could produce a journal entry containing several
all-zero lines plus the real ones, and the entry would pass
every other check. The result is a journal entry with
invisible "filler" rows — invisible because they produce
no P&L impact, and invisible because no report surfaces
them. An auditor walking through the entry sees rows that
convey no information but exist in the ledger. This is
worse than a rejected entry: it is a ledger that *looks*
correct but contains junk.

The rule exists to make all-zero lines a rejected class
rather than a silently-accepted one. An entry that would
have inserted an all-zero line is rejected at the database
layer with `check_violation`, and the service-layer Zod
refine surfaces the rejection at the boundary with a
specific error message pointing at the offending line
index. The Phase 1.1 system does not permit a line whose
sole purpose is to exist.

**Interaction with INV-LEDGER-004 and INV-LEDGER-006.** See
the note under INV-LEDGER-006. The three CHECKs jointly
define the valid shape of a line; INV-LEDGER-005 is the one
that closes the "both zero" gap that INV-LEDGER-004 and
INV-LEDGER-006 alone would leave open.

**Interaction with the service layer.** The Zod refine on
`JournalLineInputSchema` in
`src/shared/schemas/accounting/journalEntry.schema.ts`
encodes this rule as part of the combined XOR + non-zero
check, so a Zod validation failure names the specific line
and the specific rule. The database CHECK is the
authoritative enforcement for any path that bypasses Zod.

**No dedicated integration test — implicit coverage.**
Same posture as INV-LEDGER-006 and INV-LEDGER-004. The rule
is exercised by `tests/unit/journalEntrySchema.test.ts`
and is implicit in the construction of every real journal
entry integration test.

**Referenced by:** `docs/02_specs/data_model.md`
`journal_lines` section (named CHECKs list and D11
reference); `docs/03_architecture/phase_plan.md` Phase 1.1
schema obligations;
`docs/04_engineering/testing_strategy.md` unit test
coverage; `docs/04_engineering/conventions.md` Zod
`.refine()` pattern.

---

### INV-MONEY-002 — Original amount matches base amount

**Invariant.** For any row in `journal_lines`,
`amount_original` must equal `debit_amount + credit_amount`.
Because INV-LEDGER-004 guarantees that at most one of
`debit_amount` and `credit_amount` is non-zero per line,
the sum equals whichever side is populated.
`amount_original` is therefore the unsigned magnitude of
the line, with direction conveyed by which column is
non-zero. This rule ties the multi-currency view of the
line (`amount_original` in the line's own `currency`) to
the debit/credit view at the row level, preventing a
desync where a line's multi-currency amount contradicts
its debit/credit amounts.

**Enforcement.** `CONSTRAINT
line_amount_original_matches_base CHECK (amount_original =
debit_amount + credit_amount)` on `journal_lines`, defined
in `supabase/migrations/20240101000000_initial_schema.sql`:

```sql
CONSTRAINT line_amount_original_matches_base
  CHECK (amount_original = debit_amount + credit_amount)
```

**Why the equation works.** Given INV-LEDGER-004 (one side
is zero), `debit_amount + credit_amount` equals `max(debit_amount,
credit_amount)`, which is the unsigned magnitude of the line.
For a pure-CAD transaction with `fx_rate = 1.0` and
`amount_cad = amount_original`, the equation says
"`amount_original` is whichever side is populated" — which
is the obvious definition. For a multi-currency transaction
where `amount_original` is in the line's own `currency` and
`amount_cad` is the CAD-converted value (see
INV-MONEY-003), the equation still says "`amount_original`
is whichever side is populated" because debit and credit
columns are always in the functional currency magnitude of
the line — they are not in any particular currency. They
are the row's direction.

**Why this CHECK prevents a silent P&L corruption pattern.**
Without this rule, a service function bug (or an import
path that populated `amount_original` and `amount_cad` from
one source and `debit_amount` / `credit_amount` from
another) could produce a line where the debit/credit
magnitude disagrees with the declared original amount. The
debit-equals-credit constraint (INV-LEDGER-001) would still
pass at the aggregate level, because the debit and credit
columns still balance. The P&L query that sums `amount_cad`
would return a number, but that number would be inconsistent
with the entry-by-entry sum of debits and credits. An
auditor walking down the entry would see "`debit_amount =
100`, `amount_original = 200`" — a row where the same
number means two different things, and there is no
principled way to decide which is authoritative. The CHECK
makes this class of bug impossible at the row level.

**Interaction with the service layer.** The Zod schema's
`.refine()` for `JournalLineInputSchema` in
`src/shared/schemas/accounting/journalEntry.schema.ts`
validates this equation at the service boundary using
`decimal.js` arithmetic against the string-typed
`MoneyAmount` brand (INV-MONEY-001). The service-layer
check prevents a well-formed Zod input from reaching the
database with a mismatch. **The database CHECK is the
authoritative enforcement** and fires regardless of which
client issues the insert.

**Why decimal.js matches Postgres `numeric`.** JavaScript
`Number` arithmetic is IEEE 754 and cannot represent
`0.1 + 0.2` exactly. A service function that computed
`amount_original` by summing debit and credit via JS math
could produce a value that differs from Postgres's exact
`numeric(20,4)` addition in the last place. The
`decimal.js`-backed `addMoney()` helper matches Postgres
semantics, so the Zod refine and the database CHECK agree
on every input. See INV-MONEY-001 for the full
"money-as-string" rationale.

**No dedicated integration test — implicit coverage.**
INV-MONEY-002 is exercised by
`tests/unit/moneySchema.test.ts` (which tests the
`addMoney()` helper against known input/output pairs
including boundary values at four decimal places) and by
the construction of every integration test that posts
multi-line journal entries. The CHECK has no dedicated
"try to post a mismatch" test because the Zod refine
prevents the mismatch from leaving the service boundary.

**Phase 2 evolution.** INV-MONEY-002 is permanent and does
not change in Phase 2. Multi-currency journal entries from
Phase 2 AP Agent imports populate `amount_original` in the
bill's currency, `amount_cad` via FX conversion
(INV-MONEY-003), and `debit_amount`/`credit_amount` in the
row's direction magnitude. The equation holds regardless of
currency.

**Referenced by:** `docs/02_specs/data_model.md`
`journal_lines` section (named CHECKs list, D5 reference);
`docs/03_architecture/phase_plan.md` Phase 1.1 multi-currency
schema obligations; `docs/04_engineering/testing_strategy.md`
`moneySchema.test.ts` coverage;
`docs/04_engineering/conventions.md` money-as-string pattern.

---

### INV-MONEY-003 — CAD amount matches FX-converted original

**Invariant.** For any row in `journal_lines`, `amount_cad`
must equal `ROUND(amount_original * fx_rate, 4)`. This ties
the multi-currency row to its functional-currency (CAD)
value via the stored FX rate, and prevents a desync where
the CAD amount differs from what the FX conversion would
produce. Every Phase 1.1 journal line stores the FX rate
used at post time (`1.0` for CAD-native transactions), so
the CAD amount is always reproducible from the original
amount and the rate.

**Enforcement.** `CONSTRAINT line_amount_cad_matches_fx
CHECK (amount_cad = ROUND(amount_original * fx_rate, 4))`
on `journal_lines`, defined in
`supabase/migrations/20240101000000_initial_schema.sql`:

```sql
CONSTRAINT line_amount_cad_matches_fx
  CHECK (amount_cad = ROUND(amount_original * fx_rate, 4))
```

**Why ROUND and why four decimal places.** The `numeric(20,4)`
type used for `amount_cad` can represent exactly four
fractional digits. FX conversion in a multi-currency system
produces values with arbitrary precision (the `fx_rate`
column is `numeric(20,8)` — eight fractional digits — so
the raw product can have up to twelve fractional digits).
The CHECK rounds the product to four places using
Postgres's built-in `ROUND()` with `HALF_UP` rounding,
which is the standard accounting rounding mode. The
service layer's `multiplyMoneyByRate()` helper in
`src/shared/schemas/accounting/money.schema.ts` uses
`decimal.js` with `Decimal.ROUND_HALF_UP` to match Postgres
behavior exactly, so the pre-flight Zod refine and the
database CHECK agree on every input.

**Why this invariant is separate from INV-MONEY-002.**
INV-MONEY-002 ties `amount_original` to the
debit/credit columns (the row's own direction magnitude).
INV-MONEY-003 ties `amount_cad` to `amount_original` via
the FX rate. The two rules operate on different column
pairs and would need to be checked separately even if the
schema collapsed them. Phase 1.1 is almost entirely CAD-
native, so `fx_rate = 1.0` and `amount_cad =
amount_original` for every real journal entry today — the
rule is trivially satisfied. But the rule *must be
enforceable from day one* because Phase 2 AP Agent bill
ingestion will post USD and EUR bills from intercompany
vendors, and the Phase 1.1 schema reservation for
multi-currency columns is meaningful only if the
consistency rule between them is enforced. Retrofitting an
integrity constraint to a populated table is painful;
installing it on day one is free.

**Interaction with the service layer.** The
`multiplyMoneyByRate()` helper and the corresponding Zod
refine in `JournalLineInputSchema` validate this rule at
the service boundary before `BEGIN`. A mismatch between the
service-layer computation and the database CHECK would
indicate a bug in `multiplyMoneyByRate()` or a drift
between `decimal.js` rounding and Postgres `ROUND()` —
both of which are tested in
`tests/unit/moneySchema.test.ts` against known boundary
cases. The database CHECK is the authoritative
enforcement; the service-layer computation is how a clean
input reaches the database.

**Why CAD and not the functional currency.** The project is
locked to Canadian family offices operating in CAD
(Architecture Bible Section "Non-Negotiable Constraints"),
so the functional currency is CAD across all orgs in
Phase 1.1. Every org's `organizations.functional_currency`
is hard-coded to `'CAD'`. The column name `amount_cad`
encodes this assumption in the schema: a multi-currency
transaction's functional-currency amount is always the
CAD amount. A future expansion to orgs with non-CAD
functional currencies (Phase 3+) would rename the column to
`amount_functional` and loosen the constraint to
`amount_functional = ROUND(amount_original * fx_rate, 4)`
while keeping the rule shape identical. That rename is not
Phase 1 work.

**No dedicated integration test — implicit coverage.**
INV-MONEY-003 is exercised by
`tests/unit/moneySchema.test.ts` (which tests
`multiplyMoneyByRate()` against boundary cases at the
`numeric(20,4)` precision edge) and is implicit in every
integration test that posts real journal entries (every
Phase 1.1 entry has `fx_rate = 1.0` and the rule trivially
holds). The CHECK has no dedicated multi-currency test
because no Phase 1.1 code path produces a non-`1.0` FX
rate — that test lands in Phase 2 alongside the first AP
Agent multi-currency bill.

**Phase 2 evolution.** The rule is permanent. Phase 2
introduces real multi-currency bills (USD, EUR, GBP from
intercompany entities) and the `fx_rate` column starts
carrying values other than `1.0`. The CHECK is what makes
the FX conversion trustworthy under load.

**Referenced by:** `docs/02_specs/data_model.md`
`journal_lines` section (named CHECKs list, D5 reference);
`docs/03_architecture/phase_plan.md` Phase 1.1 multi-currency
schema obligations and Phase 2 AP Agent expectations;
`docs/04_engineering/testing_strategy.md`
`moneySchema.test.ts` coverage;
`docs/04_engineering/conventions.md` money-as-string
pattern; `docs/09_briefs/phase-2/*` multi-currency bill
ingestion brief (when written).

---

### INV-IDEMPOTENCY-001 — Agent-sourced entries require idempotency key

**Invariant.** Any row in `journal_entries` with `source =
'agent'` must have a non-null `idempotency_key`. Rows with
`source = 'manual'` or `source = 'import'` may omit the key
(it is nullable for those sources). This rule makes "agent
posts are idempotent" a schema fact rather than a
TypeScript-side convention.

**Enforcement.** `CONSTRAINT idempotency_required_for_agent
CHECK (source <> 'agent' OR idempotency_key IS NOT NULL)`
on `journal_entries`, defined in
`supabase/migrations/20240101000000_initial_schema.sql`:

```sql
CONSTRAINT idempotency_required_for_agent
  CHECK (source <> 'agent' OR idempotency_key IS NOT NULL)
```

**Why the rule applies only to agent source.** Manual
journal entries are submitted one at a time by a user
clicking a form button. The form submission path has no
retry semantics — if the user clicks twice, the second
click is a user action, not a retry. An idempotency key
would be ceremonial for manual entries. **Agent journal
entries are different**: they are produced by a Claude tool
call inside an orchestrator loop, and the loop has retry
semantics (tool-call validation retry, network retry,
confirmation-card Approve double-click). Without an
idempotency key, a retry could post the same journal entry
twice. The key is the mechanism that makes agent retries
safe: the service layer's idempotency check looks up
`(org_id, idempotency_key)` in `ai_actions` before any DML,
and a hit returns the existing result instead of posting a
duplicate. Import-sourced entries are reserved for Phase 2+
bank feeds and have their own deduplication strategy (by
bank transaction ID), so import may also omit the key.

**Why this is a CHECK and not a service-layer convention.**
The Phase 1.1 architecture explicitly chose to make this a
DB-enforced constraint rather than a service-layer rule,
because a forgotten idempotency key in a new service
function or a new tool definition is a silent bug that
surfaces only under retry — the kind of bug that passes
all the happy-path tests and then fires in production the
first time the network flakes. A CHECK constraint rejects
the insert at the database layer before any retry scenario
can occur, so any new code path that forgets to carry the
idempotency key fails immediately at the first insert, not
at the first retry. **The schema-enforced version is
cheaper to debug and impossible to forget.** The service
layer still performs the idempotency *lookup* (checking
`ai_actions` for an existing row before doing any work), but
the schema guarantees the *key is present* whenever it is
needed.

**Interaction with the `ai_actions` idempotency slot.** The
idempotency path has two halves that together make agent
posts safe under retry:

1. **The slot claim.** When the agent produces a dry-run
   result, `journalEntryService.post()` inserts a row in
   `ai_actions` with `status = 'pending'` and the
   idempotency key, plus a `UNIQUE (org_id,
   idempotency_key)` constraint on `ai_actions`. A second
   attempt with the same key hits the UNIQUE constraint
   and is routed to the existing pending row instead of
   creating a duplicate.
2. **The confirm path.** When the user clicks Approve, the
   same idempotency key carries through to the final
   `journal_entries` INSERT, and INV-IDEMPOTENCY-001
   guarantees the key is present on the row — so a future
   forensic query "show me every agent-posted entry and
   its idempotency key" returns a non-null column on every
   row.

**Interaction with the service layer.** The Zod schema
`PostJournalEntryInputSchema` in
`src/shared/schemas/accounting/journalEntry.schema.ts`
validates this rule with a `.refine()` at the service
boundary (`source === 'agent'` implies
`idempotency_key !== undefined`), and
`journalEntryService.post()` performs the
`ai_actions` idempotency lookup before any DML. **The
database CHECK is the authoritative enforcement** — even
if Zod and the service function both regressed, the CHECK
would reject the insert.

**No dedicated integration test — implicit coverage.**
INV-IDEMPOTENCY-001 is exercised implicitly by every
Phase 1.1 integration test (all of which use
`source = 'manual'` and do not trigger the rule) and by
`tests/unit/journalEntrySchema.test.ts` (which tests the
Zod refine). The first dedicated integration test for the
agent path lands in Phase 1.2 alongside the first real
agent-posted entry, and Phase 1.2 exit criterion #4
("Idempotency works: submit the same approval twice, the
second call returns the existing result") is the mechanical
proof that the end-to-end path is correct.

**Phase 2 evolution.** The rule is permanent. Phase 2 adds
more source values for other agents (AP Agent, AR Agent,
Reconciliation Agent), and the CHECK rule broadens to "any
agent source requires an idempotency key." The schema
shape does not change; the source enum gains values.

**Referenced by:** `docs/02_specs/data_model.md`
`journal_entries` section (named CHECKs list) and
`ai_actions` section (idempotency-slot interaction);
`docs/03_architecture/request_lifecycle.md` agent path and
confirmation commit path (idempotency lookup step);
`docs/03_architecture/phase_plan.md` Phase 1.2 exit
criterion 4 ("Idempotency works");
`docs/04_engineering/testing_strategy.md` Phase 1.2 test
obligations; `docs/04_engineering/conventions.md` agent
retry safety pattern.

---

### INV-RLS-001 — Cross-org data is never visible outside the org

**Invariant.** A user authenticated as a member of org A
cannot read any row, from any tenant-scoped table, that
belongs to org B — unless the user also has a
`memberships` row for org B. This is the single
architectural invariant that makes the multi-tenant family
office platform safe: one user's view of the database is
scoped to the orgs they have membership in, and no leak
across the tenant boundary is possible through any user-
scoped query.

**Why this is a rollup rather than a single SQL snippet.**
Unlike the other Layer 1 invariants in this file —
each of which is enforced by a single CHECK or trigger with
a fixed location — INV-RLS-001 is the *collective effect*
of every RLS policy in the schema. The rule is enforced by
roughly twenty `CREATE POLICY` statements across every
tenant-scoped table, plus two `SECURITY DEFINER` helper
functions (`user_has_org_access` and `user_is_controller`)
that centralize the membership-check logic. The full SQL
lives in `docs/02_specs/data_model.md` Part 2 — this leaf
names the invariant and points at its enforcement, it does
not duplicate the RLS policy SQL.

**Enforcement mechanism.** Every tenant-scoped table has
RLS enabled via `ALTER TABLE <t> ENABLE ROW LEVEL
SECURITY`, and every such table has at least a SELECT
policy whose `USING` clause calls
`user_has_org_access(target_org_id)`. The helper function
is defined as:

```sql
CREATE OR REPLACE FUNCTION public.user_has_org_access(target_org_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.memberships
    WHERE user_id = auth.uid() AND org_id = target_org_id
  );
$$;

REVOKE ALL ON FUNCTION public.user_has_org_access(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.user_has_org_access(uuid) TO authenticated;
```

The function is `STABLE` so the planner can inline and
memoize its result within a single statement. It is
`SECURITY DEFINER` so it can read `public.memberships`
without recursively invoking the `memberships_select`
policy. It sets `search_path = ''` so a malicious role
cannot shadow `public.memberships` with a local temp
table. The `REVOKE` from `PUBLIC` and explicit `GRANT` to
`authenticated` ensure only logged-in users can call the
function. See `docs/02_specs/data_model.md` Part 2 for the
full policy body and the per-table RLS specifics.

**Why the service-role client bypasses RLS — and why that
is not a bug.** The service-role client
(`src/db/adminClient.ts`) uses Supabase's service-role key
and bypasses RLS entirely. `auth.uid()` inside a
service-role query returns `NULL`, so
`user_has_org_access()` returns `false` — but the service
role bypasses policy evaluation, so the query runs
regardless. This is intentional: the service layer is
authoritative and must be able to write across RLS
boundaries (e.g., writing an `audit_log` row for an action
a user took, or loading a referenced journal entry during
the reversal mirror check). **The enforcement for
service-role mutations is the service layer itself, not
RLS** — specifically, `withInvariants()` runs the
`canUserPerformAction` check (INV-AUTH-001) before any
mutating service function runs, and the check loads the
caller's memberships from `ctx.caller.org_ids` and rejects
calls that target an org the caller is not a member of.
RLS is defense-in-depth for reads that go through the
user-scoped client; service-layer authorization is the
primary enforcement for writes. See INV-AUTH-001 for the
full service-layer enforcement story.

**Category A floor test.**
`tests/integration/crossOrgRlsIsolation.test.ts` creates
two orgs with disjoint user memberships, posts journal
entries in each, and asserts that a user-scoped client
authenticated as a member of org A cannot SELECT rows from
`journal_entries`, `journal_lines`, `chart_of_accounts`,
`audit_log`, `ai_actions`, or any other tenant-scoped
table where those rows belong to org B. The test runs
through the user-scoped client (not the service-role
client) because that is the path RLS protects. It is the
mechanical proof that the RLS policies collectively enforce
cross-org isolation and that no table with an `org_id`
column was missed when RLS was enabled in the Phase 1.1
initial migration. See
`docs/04_engineering/testing_strategy.md` for the full
Category A floor table.

**Interaction with other invariants.** INV-RLS-001 is the
foundation that other invariants depend on for tenant
scoping: INV-AUTH-001 (Layer 2) loads the caller's org
memberships to make authorization decisions;
INV-REVERSAL-001 (Layer 2) checks same-org when loading a
referenced entry for the mirror check; INV-AUDIT-001
(Layer 2) stamps every audit row with the caller's org.
Every layer-2 invariant that operates on an org-scoped
entity assumes the org boundary is real, and INV-RLS-001 is
what makes it real at the database level.

**Phase 2 evolution.** The rule is permanent. Phase 2 adds
new tenant-scoped tables (bills populated by the AP Agent,
bank transactions from Flinks, reconciliation batches)
and each new table gets its own RLS policies that follow
the same pattern — SELECT via `user_has_org_access(org_id)`,
INSERT/UPDATE/DELETE per the table's access model. The
collective invariant does not change; the set of policies
that enforce it grows. A Phase 2 table that ships without
RLS is a hard failure regardless of other Phase 2 exit
criteria.

**Referenced by:** `docs/02_specs/data_model.md` Part 2
(full RLS policy SQL and per-table specifics);
`docs/03_architecture/request_lifecycle.md` manual path
(RLS defense-in-depth note);
`docs/03_architecture/phase_plan.md` Phase 1.1 "What was
built" bullet and Phase 1.3 exit criterion 13 ("Cross-org
accidental visibility check");
`docs/04_engineering/testing_strategy.md` Category A floor
table; `docs/04_engineering/conventions.md` two-client
pattern (service-role vs user-scoped).

---

### INV-REVERSAL-002 — Reversal entries require a non-empty reason

**Invariant.** A journal entry that reverses another (has
`reverses_journal_entry_id IS NOT NULL`) must have a
non-empty `reversal_reason`. The reason captures *why* the
reversal was posted — "vendor misclassified," "duplicate
of entry #12345," "wrong amount, FX rate corrected" — and
is required as a schema fact, not as a service-layer
convention. A reversal without a reason is not a legal
reversal. This is the Layer 1 complement to
INV-REVERSAL-001 (the service-layer mirror check): the
mirror rule guarantees that a reversal swaps the original's
debits and credits; the reason rule guarantees that the
ledger always knows why the reversal exists.

**Enforcement.** `CONSTRAINT
reversal_reason_required_when_reversing CHECK
(reverses_journal_entry_id IS NULL OR (reversal_reason IS
NOT NULL AND length(trim(reversal_reason)) > 0))` on
`journal_entries`, defined in
`supabase/migrations/20240102000000_add_reversal_reason.sql`:

```sql
ALTER TABLE journal_entries
  ADD COLUMN reversal_reason text;

ALTER TABLE journal_entries
  ADD CONSTRAINT reversal_reason_required_when_reversing
  CHECK (
    reverses_journal_entry_id IS NULL
    OR (reversal_reason IS NOT NULL AND length(trim(reversal_reason)) > 0)
  );
```

**Why `length(trim(...)) > 0` instead of `IS NOT NULL`.**
A simple `IS NOT NULL` check would allow the reversal
reason to be the empty string, a single space, or a tab
character. Those values pass `NOT NULL` but are
semantically blank — they capture no story, and an auditor
asking "why was this reversal posted?" would get a
technically-present but practically-empty answer. The
`length(trim(reversal_reason)) > 0` form trims whitespace
before checking length, so any whitespace-only value is
rejected. The rule enforces "a human has typed something
meaningful into the reason field," not just "a value is
present."

**Why this rule belongs on `journal_entries` and not
`audit_log`.** The `reversal_reason` column lives on
`journal_entries`, not on `audit_log`. The full rationale
for this placement is documented in
`docs/02_specs/data_model.md` `journal_entries` section
and in `docs/07_governance/adr/0001-reversal-semantics.md`
(the ADR seed). The short version: the reversal reason is
a property of the reversal entry itself (it describes the
entry, not the mutation that created it), queries for
"show me every reversal and why" become a single-table
self-join rather than a multi-table join through
`audit_log`, and the rule "every reversal explains itself"
is a ledger rule belonging in the same enforcement layer
as "every reversal mirrors the original" — the database,
not the log. Putting it on `audit_log` would have made the
rule a service-layer convention that a forgotten call
could silently skip.

**Why this is a CHECK and not only a service-layer
validation.** The service layer has three checks for the
reversal reason, in layered order:

1. **The UI form level.** The manual reversal form in
   `src/components/canvas/ReversalForm.tsx` makes
   `reversal_reason` a required field with a minimum
   character count, so the form cannot be submitted
   blank.
2. **The service layer.** `validateReversalMirror()` in
   `src/services/accounting/journalEntryService.ts`
   (INV-REVERSAL-001, step 1) rejects empty or
   whitespace-only reasons before the database transaction
   begins, returning a clean
   `ServiceError('REVERSAL_NOT_MIRROR', ...)`.
3. **The database.** This CHECK constraint.

The three layers exist because a future agent path (the
Phase 1.2 `reverseJournalEntry` tool) bypasses the form,
and a future bug or regression in the service layer would
bypass the service-level check. The database CHECK is the
last line of defense. **An auditor asking "why was this
posted?" must always get an answer**, and the only way to
guarantee that in a system that has three distinct write
paths is to enforce the rule at the one layer every path
has to pass through.

**Interaction with INV-REVERSAL-001.** INV-REVERSAL-001 is
the Layer 2 service-layer check that verifies a reversal's
lines mirror the original with debits and credits swapped.
INV-REVERSAL-002 is the Layer 1 database CHECK that
verifies a reversal has a non-empty reason. Both apply to
the same `journal_entries` row when
`reverses_journal_entry_id IS NOT NULL`. Both must be
satisfied for the reversal to post. See INV-REVERSAL-001
(in the Layer 2 section below) for the mirror check
algorithm and the cross-org defense; this leaf covers only
the reason rule.

**No dedicated integration test — covered by
reversalMirror.test.ts.** The Category A floor test
`tests/integration/reversalMirror.test.ts` exercises
INV-REVERSAL-001 directly, and every assertion it makes
against `validateReversalMirror()` also catches the
service-layer portion of INV-REVERSAL-002 (step 1 of the
mirror check algorithm rejects empty reasons). A dedicated
"try to insert a reversal with empty reversal_reason
through direct DML" test is not on the Phase 1.1 floor
because it would require bypassing the service layer
entirely, and the Phase 1.1 system has no code path that
does so. The test lands in Phase 1.2 alongside the
`reverseJournalEntry` agent tool, whose path provides the
first realistic way to exercise the database CHECK
independent of the service-layer check.

**Phase 2 evolution.** The rule is permanent. Phase 2 adds
the agent path (`reverseJournalEntry` tool), and the
service-layer check runs on that path the same way it runs
on the manual form path. The database CHECK is unchanged.
Phase 2 also adds partial reversal support, and the
reason rule still applies — a partial reversal must still
carry a reason, because an auditor asking "why did you
reverse half of entry X?" still needs an answer.

**Referenced by:** `docs/02_specs/data_model.md`
`journal_entries` section (named CHECKs list and placement
rationale for `reversal_reason`);
`docs/03_architecture/ui_architecture.md` Reversal UI
section; `docs/03_architecture/phase_plan.md` Phase 1.1
"What was built" bullet (manual reversal path);
`docs/04_engineering/testing_strategy.md` Category A floor
table (INV-REVERSAL-001 covers the service-layer portion);
`docs/07_governance/adr/0001-reversal-semantics.md` ADR
placement rationale.

---

### Transaction Isolation (READ COMMITTED + targeted row locks)

**This is not an invariant.** Transaction isolation is a
discipline that supports Layer 1 invariants rather than a
rule of its own. It appears in this layer because it
determines the concurrency semantics under which the Layer
1 enforcement mechanisms operate, and two invariants —
INV-LEDGER-001 (deferred balance constraint) and
INV-LEDGER-002 (period-lock trigger) — have behavior that
cannot be reasoned about without knowing the isolation
level. The section lives at the end of Layer 1 so a reader
encounters the invariants it supports before meeting the
discipline that enables them.

**The rule.** Phase 1.1 mutating service functions run
under Postgres's default `READ COMMITTED` isolation level.
The service layer does not elevate transactions to
`REPEATABLE READ` or `SERIALIZABLE`. Concurrency
protection against race conditions is provided by targeted
row-level locks (`SELECT ... FOR UPDATE`) at the specific
read-then-write points where write skew would otherwise
occur.

**The three read-then-write points in Phase 1.1, and how each
is protected.** Phase 1.1 has three places where a service
function or trigger reads a value and then writes based on
what it read. Each gets a different protection strategy, and
the differences are deliberate.

1. **Period lock** (INV-LEDGER-002) — protected by a row lock.
   The `trg_enforce_period_not_locked` trigger takes
   `SELECT fp.is_locked FROM fiscal_periods fp WHERE ...
   FOR UPDATE` on the referenced period row before
   reading `is_locked`. This serializes the trigger
   against any concurrent `periodService.lock()`
   transaction attempting to `UPDATE fiscal_periods SET
   is_locked = true` on the same row. Without the row
   lock, the trigger could read `is_locked = false`,
   proceed, and commit into a period that a concurrent
   transaction locked between the read and the commit.
2. **The deferred balance constraint** (INV-LEDGER-001) —
   no lock needed because the pattern is transaction-scoped.
   It runs inside the caller's transaction at `COMMIT` and
   aggregates `journal_lines` for the parent entry, which
   the caller inserted earlier in the same transaction. Under
   `READ COMMITTED`, the aggregate query sees the
   caller's own writes and the committed state of other
   transactions. There is no race pattern for this
   constraint because one journal entry's lines are
   inserted by one transaction — multiple transactions
   cannot collaborate on a single entry. The constraint
   trigger fires N times for N lines (once per row), and
   each invocation produces the same aggregate result
   because each sees the fully-populated set of lines
   for the parent entry. See the INV-LEDGER-001 leaf for
   the full discussion of why the N invocations are
   correct.
3. **Entry number allocation** in `journalEntryService.post()`
   — no lock, relying on the UNIQUE constraint as the
   collision detector. The service function computes the
   next entry number with
   `SELECT entry_number FROM journal_entries WHERE org_id = ?
   AND fiscal_period_id = ? ORDER BY entry_number DESC LIMIT 1`,
   then inserts the new entry with `entry_number = MAX + 1`.
   The source file carries an explicit comment at this read:
   `// Compute entry_number (MAX + 1, no FOR UPDATE in Phase 1.1)`.
   Under concurrent posts to the same (org, period) pair, two
   transactions could both read the same `MAX` and both try
   to insert `MAX + 1`. The second transaction would then
   violate the `unique_entry_number_per_org_period` UNIQUE
   constraint (INSERT failure) and roll back. At Phase 1.1
   traffic (a solo founder posting a few entries per day),
   this race is effectively nonexistent — no two posts
   overlap in wall-clock time — so the UNIQUE constraint is
   the retroactive safety net rather than the primary
   protection. **Phase 1.2 revisits this** if agent-driven
   posting introduces burstiness that makes the race
   meaningful; the fix would be a `FOR UPDATE` row lock on
   a per-period counter row or an advisory lock on `(org_id,
   fiscal_period_id)`. Phase 1.1 accepts the exposure because
   the traffic profile makes it a theoretical rather than
   operational concern, and because a failed UNIQUE INSERT
   produces a clean transaction rollback with no data
   corruption — the service layer catches the error and
   surfaces it as `ServiceError('POST_FAILED', ...)`, and the
   caller retries. This is a deliberate "accept the failure
   mode because it is rare and self-correcting" choice, not
   an oversight.

**Why not `SERIALIZABLE` — three reasons.**

1. **The one race pattern that matters is already
   handled.** The period-lock race is the only
   concurrent-write pattern in Phase 1.1 where a
   read-then-write from one transaction could interleave
   with a write from another transaction to produce an
   incorrect outcome. The `SELECT ... FOR UPDATE` row
   lock on `fiscal_periods` closes the race precisely.
   `SERIALIZABLE` would close the same race through
   predicate locking, at higher cost. Row locks are
   cheap; predicate locks are not.
2. **The deferred balance constraint is already
   transaction-scoped.** The debit-equals-credit rule
   operates on rows that one transaction inserted, and
   the aggregate check runs inside that same
   transaction. Elevating isolation would not change its
   semantics — there is nothing to serialize against,
   because concurrent transactions do not share rows
   inside a single journal entry.
3. **`SERIALIZABLE` produces retryable errors that the
   service layer would need to handle.** Postgres's
   Serializable Snapshot Isolation (SSI) uses predicate
   locking and raises `could not serialize access due to
   read/write dependencies` errors when it detects a
   potentially non-serializable transaction order. These
   errors are not deterministic — the same workload can
   produce serialization failures on one run and succeed
   on the next, depending on transaction timing and
   predicate-lock overlap. A Phase 1.1 service layer
   elevated to `SERIALIZABLE` would need retry logic on
   every mutating call, which is operational complexity
   with no benefit for Phase 1.1 traffic (a solo founder
   posting a few entries per day). The cost is paid on
   every call; the benefit is captured by the row lock
   for free.

**The rule stated one more time, because it is load-
bearing.** Phase 1.1 service functions run under `READ
COMMITTED`. The period-lock trigger uses
`SELECT ... FOR UPDATE` for its one race-sensitive read.
The deferred balance constraint runs at `COMMIT` without
any lock because the constraint is transaction-scoped and
cannot race. The entry-number allocation runs without a
lock and leans on the `unique_entry_number_per_org_period`
UNIQUE constraint as a retroactive collision detector,
which is acceptable at Phase 1.1 traffic but is the one
pattern to revisit first if burstiness changes. **Do not
elevate isolation for the whole transaction when a row
lock (or, in the entry-number case, a well-chosen UNIQUE
constraint) on a single row is the correct scope.**

**Phase 2 revisit.** Phase 2 introduces the AP Agent with
concurrent bill ingestion, which creates new
read-then-write patterns that do not exist in Phase 1.1:

- **Vendor rule lookup before posting.** The AP Agent
  reads a `vendor_rules` row to determine the default
  account mapping, then posts a journal entry that uses
  that mapping. A concurrent controller updating the
  vendor rule between the read and the post could cause
  the AP Agent to post under stale rules. The fix is a
  row lock on `vendor_rules` during the read, the same
  pattern as the period lock.
- **Intercompany batch assignment.** When the AP Agent
  posts a bill that turns out to be intercompany, it
  must assign a shared `intercompany_batch_id` across two
  journal entries in two different orgs. The read-then-
  write pattern for "allocate the next batch ID"
  requires either a row lock on a counter table or a
  database sequence.
- **Reconciliation matching.** When the AP Agent matches
  a bank transaction to a bill, the match must be
  serialized against other matches to prevent two
  transactions from matching the same bank row. Row lock
  on `bank_transactions`.

**Default position for Phase 2 remains `READ COMMITTED`
plus targeted row locks** — the discipline does not
change; the set of row-lock points grows. A Phase 2
feature that proposes elevating isolation for the whole
transaction needs to justify why a row lock is
insufficient, and the justification has to name the
specific race pattern the row lock cannot close. Without
that justification, the answer is "add a row lock at the
specific read point."

**Referenced by:** `docs/02_specs/data_model.md`
`fiscal_periods` section (lock mechanism paragraph);
`docs/03_architecture/request_lifecycle.md` manual path
and confirmation commit path (transaction boundaries);
`docs/03_architecture/phase_plan.md` Phase 2 AP Agent
scope notes; `docs/04_engineering/conventions.md`
transaction isolation rule.

---

## Layer 2 — Operational Truth (Services Decide)

Layer 2 is where the rules become policy. Every invariant in this
layer is enforced by TypeScript service functions in `src/services/`
— not by the database, not by convention, not by code review alone.
**Layer 2 is the layer that decides what a valid request even
looks like before the database sees it.** A service function wraps
its body in `withInvariants()`, which runs pre-flight checks
(context shape, caller identity, org access, role permission). The
function then validates its input against a Zod schema (which
rejects values the service cannot safely handle), performs
business-logic checks (reversal mirror validity, period-lock
pre-flight, idempotency lookup), and only then issues the database
writes. If any check fails, the function throws a typed
`ServiceError` with a stable code, and the database is never
touched.

**Layer 2 properties.** The service layer has specific properties
that distinguish it from every other layer and from the "service"
abstractions in competing accounting systems:

| Property | What it means |
|---|---|
| **Deterministic** | No LLM calls, no natural-language parsing, no probabilistic branches on the critical path of a mutation. A service function's output depends only on its typed input and the current database state. |
| **Schema-bound** | Every input and every output has a Zod schema. `any` is forbidden without justification. TypeScript strict mode is on. |
| **Testable** | Service functions are the unit test target. 100% coverage is achievable because the functions are pure with respect to the database and the database is reset between tests. |
| **Not in prompts** | Service logic never appears in an agent system prompt. Agents call services through tool definitions; they do not reason about service bodies. This is the line that keeps LLMs out of the critical path of correctness. |

**What makes a rule a Layer 2 invariant.** Three criteria:

1. **Enforced by a service function or middleware.** Not by the
   database (those are Layer 1), not by a convention, not by code
   review alone.
2. **Runs before the database sees the call.** Layer 2 checks are
   pre-flight — they reject bad calls before any DML is issued, so
   that a rejected call leaves no transactional footprint and
   returns a clean typed error.
3. **Defended by an integration test or a unit test that exercises
   the service function directly.** Unlike Layer 1 invariants, Layer
   2 invariants can be meaningfully unit-tested because the rules
   are TypeScript code rather than SQL.

The Layer 2 invariants are presented below in the order they are
evaluated by `withInvariants()` and the service function body.

### INV-AUTH-001 — Every mutating service call is authorized

**Invariant.** Before any service function mutates the database, the
caller's identity must be verified, the caller must have access to
the target org, and the caller's role must permit the specific
action being requested. No mutating call proceeds without all three
checks passing.

**Enforcement.** `withInvariants()` at
`src/services/middleware/withInvariants.ts`. The wrapper is a
higher-order function that takes a raw service function and
returns a wrapped version that runs four pre-flight invariants
before the function body. Mutating service functions in
`src/services/` are exported **unwrapped**; the API route
handler applies the wrapper at the call site, using the pattern
`await withInvariants(service.fn, { action: 'action.name' })(input, ctx)`.
This is why every mutating API route handler imports both the
service module and the `withInvariants` middleware — the wrap
happens at the boundary where the request enters the service
layer. Read functions (`list`, `get`) do **not** go through
`withInvariants`; they handle authorization inline via
`ctx.caller.org_ids.includes(input.org_id)` because they have
no `{ action }` mapping in the role matrix and their
authorization model is simpler ("caller must be a member of
the requested org"). The wrapper's four pre-flight checks are:

```typescript
export function withInvariants<I, O>(
  fn: ServiceFn<I, O>,
  opts?: WithInvariantsOptions,
): ServiceFn<I, O> {
  return async (input, ctx) => {
    // Invariant 1: ServiceContext shape
    if (!ctx || !ctx.trace_id || !ctx.caller?.user_id) {
      throw new InvariantViolationError('MISSING_CONTEXT', ...);
    }

    // Invariant 2: caller identity is verified, not claimed
    if (!ctx.caller.verified) {
      throw new InvariantViolationError('UNVERIFIED_CALLER', ...);
    }

    // Invariant 3: org_id consistency
    // If input carries an org_id, it must match a caller membership
    const claimedOrgId = (input as Record<string, unknown>)?.org_id;
    if (typeof claimedOrgId === 'string' && claimedOrgId &&
        ctx.caller.org_ids && !ctx.caller.org_ids.includes(claimedOrgId)) {
      throw new InvariantViolationError('ORG_ACCESS_DENIED', ...);
    }

    // Invariant 4: role-based authorization
    if (opts?.action && typeof claimedOrgId === 'string' && claimedOrgId) {
      const authResult = await canUserPerformAction(ctx, opts.action, claimedOrgId);
      if (!authResult.permitted) {
        throw new InvariantViolationError('PERMISSION_DENIED', authResult.reason);
      }
    }

    // Execute wrapped function
    return fn(input, ctx);
  };
}
```

**The four pre-flight checks, in order:**

1. **Context shape.** `ServiceContext` must be present with a
   `trace_id` and a `caller.user_id`. A missing context is a
   programming error (the API route handler failed to build one),
   not a user error.
2. **Caller identity verified, not claimed.** The
   `ctx.caller.verified` flag is set by `buildServiceContext()`
   after validating the Supabase Auth JWT. A handler that forgets
   to verify the JWT and sets `verified = false` (or leaves it
   unset) causes the wrapper to throw `UNVERIFIED_CALLER` before
   any business logic runs. This is the defense against "an
   unauthenticated request somehow reached a service function."
3. **Org access.** If the input carries an `org_id`, that org must
   be in the caller's membership list. This check is
   defense-in-depth against RLS: RLS catches the violation at the
   database level too, but failing fast with a clear typed error
   is better than RLS silently returning empty results and forcing
   the service function to interpret "no rows" as either "empty
   org" or "unauthorized."
4. **Role-based authorization.** If the service function was
   wrapped with `{ action: 'journal_entry.post' }` (or any other
   action name), the wrapper calls `canUserPerformAction(ctx,
   action, orgId)` to check the caller's role against the static
   permission map in
   `src/services/auth/canUserPerformAction.ts`. Three roles
   (`executive`, `controller`, `ap_specialist`) have seven possible
   actions; the matrix is explicit and exhaustive. Unknown roles
   and unknown actions fail closed.

**Role matrix (Phase 1.1).** The authoritative matrix is in
`canUserPerformAction.ts`; the summary is:

- **`controller`** — full access. All seven actions permitted.
- **`ap_specialist`** — `journal_entry.post`, `chart_of_accounts.read`,
  `ai_actions.read`. Cannot lock periods, create orgs, or write
  the chart of accounts.
- **`executive`** — read-only. `chart_of_accounts.read`,
  `audit_log.read`, `ai_actions.read`. Cannot post journal entries.

**Returns a typed result, never throws.** `canUserPerformAction`
returns `{ permitted: boolean; reason: string }` — it never throws
for a "not permitted" case. The caller (`withInvariants`) decides
whether to translate a `permitted: false` result into a thrown
`InvariantViolationError('PERMISSION_DENIED', ...)`. This separation
exists so that non-middleware callers (a future UI
authorization-preview feature, for example) can query authorization
without exception handling.

**Category A floor test.**
`tests/integration/serviceMiddlewareAuthorization.test.ts` calls a
mutating service function with a `ServiceContext` whose caller's
role does not permit the action, and asserts that the call throws
`InvariantViolationError('PERMISSION_DENIED', ...)` without touching
the database. This test is the mechanical proof that INV-AUTH-001
cannot be bypassed through normal service calls.

**Phase 2 evolution.** The role matrix is static in Phase 1.1.
Phase 2 introduces confidence-based routing
(`ProposedEntryCard.routing_path`) which adds an additional
authorization dimension: low-confidence entries require controller
approval even from an `ap_specialist` who would otherwise be
permitted to post. The `canUserPerformAction` signature will
extend with an optional `confidence` parameter; the underlying
matrix shape stays the same.

**Referenced by:** `docs/00_product/personas.md` (role-based
authorization note); `docs/03_architecture/system_overview.md`
(withInvariants service layer description);
`docs/03_architecture/request_lifecycle.md` manual path (Auth check
step); `docs/02_specs/data_model.md` Part 2 "Why RLS still matters
when writes go through adminClient";
`docs/04_engineering/testing_strategy.md` Category A floor table.

---

### INV-SERVICE-001 — Every mutating service function is invoked through `withInvariants`

**Invariant.** No path in the Phase 1.1 codebase calls a mutating
service function directly without first passing through the
`withInvariants()` wrapper. The wrapper is not optional
decoration — it is the enforcement point for INV-AUTH-001's four
pre-flight checks, and bypassing it would silently skip caller
verification, org-access checking, and role-based authorization.
Every mutating API route handler applies the wrapper at the call
site via the pattern
`await withInvariants(service.fn, { action: 'action.name' })(input, ctx)`.

**Why this is a Layer 2 invariant rather than a Layer 1
constraint.** The rule "every mutation passes through a
pre-flight middleware" cannot be expressed in the database — the
database has no concept of "a TypeScript function wrapper." It
also cannot be a TypeScript type-level constraint, because
`journalEntryService.post` is a plain async function that can
be imported and called from any file that imports the service
module. The enforcement is therefore **code-level discipline**:
the pattern is uniform across every API route handler in
`src/app/api/`, and code review rejects any new handler that
imports a service function but does not wrap it.

**Enforcement.** Three layered mechanisms make this rule hold
in practice, none of which are runtime assertions but all of
which catch violations:

1. **The service modules export unwrapped functions by
   convention.** `src/services/accounting/journalEntryService.ts`
   exports `{ post, list, get }` as plain functions. There is
   no wrapped export to "accidentally" use. A caller importing
   `journalEntryService.post` gets the raw function and must
   wrap it explicitly to use it correctly — or the wrapping
   never happens and the authorization checks never run. This
   is deliberate: a wrapped export would hide the wrap, and
   would make it possible for a new handler to use the wrapped
   version without seeing `withInvariants` in its imports,
   which would obscure the enforcement path.
2. **The API route handler convention.** Every mutating route
   handler in `src/app/api/` imports both the service module
   and `withInvariants` from
   `@/services/middleware/withInvariants`, and applies the
   wrapper inline at the call site. The reference
   implementation is
   `src/app/api/orgs/[orgId]/journal-entries/route.ts`:

```typescript
import { withInvariants } from '@/services/middleware/withInvariants';
import { journalEntryService } from '@/services/accounting/journalEntryService';

export async function POST(req: Request, { params }: { params: Promise<{ orgId: string }> }) {
  // ...build ctx, parse input...
  const result = await withInvariants(
    journalEntryService.post,
    { action: 'journal_entry.post' }
  )(parsed, ctx);
  // ...return response...
}
```

   Every new mutating endpoint follows the same three-line
   wrapping pattern. The uniformity is load-bearing — a
   reviewer scanning a new route handler can verify "yes,
   `withInvariants` is present with the right action" in under
   a second.
3. **Code review rejects bare service calls.** A PR that
   introduces `await journalEntryService.post(input, ctx)`
   without the wrapper is rejected on review. This is not an
   automated check — there is no lint rule today that enforces
   it. Phase 1.2 may add such a lint rule (candidate: an
   ESLint restricted-syntax rule that forbids direct calls to
   `services/**.post` and similar mutating exports). Phase 1.1
   relies on code review and the fact that only one developer
   is writing this code.

**Asymmetry with read functions.** Read functions (`list`,
`get`) are **not** wrapped in `withInvariants`. They are called
directly by the route handler and handle authorization inline
via `if (!ctx.caller.org_ids.includes(input.org_id)) { throw new
ServiceError('ORG_ACCESS_DENIED', ...); }`. This is a
deliberate Phase 1.1 choice: read functions have a simpler
authorization model ("caller must be a member of the requested
org") than writes ("caller must be a member AND have a role
that permits the specific action"), and the inline check is
cheaper than a full `withInvariants` pass. The asymmetry is
not a bug — it is the architectural shape of Layer 2 — and the
INV-SERVICE-001 rule **only applies to mutating service
functions**. Reads have their own discipline (inline
`org_ids.includes` check) which is not separately invariant-
numbered.

**What breaks if this rule is violated.** A mutating service
function called without `withInvariants`:

- Skips the JWT verification check → an unauthenticated request
  could reach a mutation.
- Skips the org-access check → a caller could write to an org
  they are not a member of.
- Skips the role-based authorization check → an `executive`
  could post a journal entry (which the role is not permitted
  to do).
- Skips the trace_id propagation → the mutation runs without
  a pino logger context, making it hard to correlate with
  other logs from the same request.

The database Layer 1 checks (CHECK constraints, triggers, RLS
from the user-scoped client) catch *some* of these failures —
but RLS is bypassed by `adminClient` which the service layer
uses, so the RLS fallback does not protect this path. Layer 2
must catch it, and Layer 2 catching it depends on `withInvariants`
being applied. INV-SERVICE-001 is the rule that guarantees the
application happens.

**Phase 2 evolution.** Phase 2 introduces additional service
functions (AP Agent, reconciliation, bank feed ingestion),
and the rule applies to every new mutating function the same
way. Phase 2 also introduces agent-initiated tool calls that
invoke services through a different entry point than an API
route handler — the orchestrator layer. The orchestrator
applies `withInvariants` itself when invoking a service
function, maintaining the rule across both entry paths
(HTTP route and agent tool call). Phase 2 is also the
earliest point at which an automated lint rule becomes
valuable, because the number of service functions grows
beyond what code review can reliably catch.

**Referenced by:** INV-AUTH-001 (the four pre-flight checks
that `withInvariants` runs);
`docs/03_architecture/system_overview.md` (Layer 2 service
layer description);
`docs/03_architecture/request_lifecycle.md` manual path
(withInvariants wrap step); `docs/04_engineering/conventions.md`
service function authoring pattern;
`docs/04_engineering/testing_strategy.md` Layer 2 test
obligations (every new mutating service function must have a
unit test that exercises the `withInvariants` wrapping path).

---

### INV-SERVICE-002 — The service layer uses `adminClient`, never `userClient`

**Invariant.** Every database read and write issued by a Phase
1.1 service function goes through `adminClient()` (the
service-role Supabase client). No service function imports or
uses `userClient` (the anon-key-plus-JWT client). The two
clients exist for different purposes: `userClient` is for
Next.js server components and any read path where RLS
enforcement is desired as defense-in-depth; `adminClient` is
for the service layer, which is authoritative and must be
able to write across RLS boundaries. This rule is the mechanical
implementation of the two-client discipline documented in
`docs/02_specs/data_model.md` Part 2 "The Two-Client Rule."

**Why the service layer bypasses RLS.** The service layer
writes rows that RLS would reject if it were enforced. Two
concrete examples:

- **Writing `audit_log` rows.** The `audit_log_select` RLS
  policy allows org members to *read* audit rows for their
  orgs. There is no INSERT policy because no user-scoped
  client should ever write to the audit log — writes come
  from `recordMutation()` via `adminClient`, which bypasses
  RLS. Without `adminClient`, the audit write would be
  rejected with "new row violates RLS policy" even though
  the caller is authorized for the underlying mutation.
- **Loading a referenced entry in `validateReversalMirror`.**
  The reversal mirror check loads the *original* entry's
  lines to compare against the proposed reversal's lines.
  Under the user-scoped client, this SELECT succeeds (the
  reverser is an org member, so RLS allows it), but the
  inline org-id check in
  `validateReversalMirror` is more explicit and produces a
  cleaner `ServiceError('REVERSAL_CROSS_ORG')` error when
  the caller tries to reference an entry from a different
  org. The service-role path gives the service full control
  over what "not found" vs "cross-org" vs "legitimate read"
  means at the typed-error level, which would be harder
  to distinguish if RLS were silently returning empty
  results.

The general principle: RLS is a blunt instrument that
returns "zero rows" when access is denied, which forces the
service layer to interpret "zero rows" as either "legitimate
empty result" or "access denied." That ambiguity is a
source of bugs. Using `adminClient` + explicit service-layer
authorization (INV-AUTH-001) is cleaner — the service layer
knows exactly why a read returned nothing, because it did
the authorization itself.

**Enforcement.** Two layered mechanisms, same shape as
INV-SERVICE-001:

1. **Convention in imports.** Every service file in
   `src/services/**` imports from `@/db/adminClient`, never
   from `@/db/userClient`. The reference pattern:

```typescript
import { adminClient } from '@/db/adminClient';
// ...
async function post(input, ctx) {
  const db = adminClient();
  // all DB operations via `db`
}
```

2. **Code review.** A PR that imports `userClient` into
   `src/services/**` is rejected on review. As with
   INV-SERVICE-001, this is not automated today; Phase 1.2
   may add a lint rule forbidding `userClient` imports
   under the `services/` directory.

**Interaction with INV-AUTH-001 and INV-RLS-001.** The three
invariants work together:

- **INV-RLS-001** (Layer 1) is the database-level defense.
  It catches cross-org reads through any user-scoped client.
- **INV-AUTH-001** (Layer 2) is the service-layer defense.
  It catches unauthorized mutations at the wrapper level,
  before any DB call is issued.
- **INV-SERVICE-002** (this rule) is the architectural
  decision to use the service-role client inside the service
  layer, which shifts the authorization responsibility from
  RLS to INV-AUTH-001.

Without INV-AUTH-001, using `adminClient` would be unsafe —
there would be no check preventing a caller from writing to
an org they don't belong to. Without INV-SERVICE-002, the
service layer would inherit RLS's ambiguous zero-rows-means-
either-empty-or-denied behavior, which would force defensive
coding patterns throughout the service layer that the current
design avoids. Both rules are necessary for the current Layer
2 shape to hold.

**Why not just run the service layer through `userClient`?**
Two reasons. First, the `audit_log` write would fail, as
described above — there is no INSERT policy for `audit_log`.
The service layer would need a dedicated RLS exception for
audit writes, which would be a narrow carve-out that
complicates the RLS story. Second, the service-role client
is already the only path that can write `events` (Phase 2),
because `events` has no INSERT policy for any non-admin
role. Converging on `adminClient` in Phase 1.1 makes the
Phase 2 event-writing path mechanical — no migration needed,
no new client wiring, just start calling `db.from('events')
.insert(...)` inside existing service functions. The Phase
1.1 convergence pays a Phase 2 dividend.

**What breaks if this rule is violated.** A service function
that uses `userClient` instead of `adminClient`:

- Cannot write to `audit_log` — the write fails with "new
  row violates RLS policy," and the `recordMutation()` helper
  throws `AUDIT_WRITE_FAILED`, rolling back the entire
  transaction.
- Cannot read a referenced entry across an org boundary
  cleanly — RLS silently returns empty, and the service
  function must distinguish "not found" from "access denied"
  without any signal from the database.
- Cannot call the two RPC functions `get_profit_and_loss`
  and `get_trial_balance` — these are granted `EXECUTE` to
  `service_role` only, not to `authenticated`, so a
  `userClient` call would fail with "permission denied for
  function."

**Phase 2 evolution.** The rule is permanent. Phase 2 adds
agent-initiated service calls via the orchestrator, and the
orchestrator uses `adminClient` via the service functions it
invokes. Phase 2 also adds the events-table write path, which
is adminClient-only by construction (no `authenticated` INSERT
policy on `events`). No new exceptions to the rule are
anticipated.

**Referenced by:** `docs/02_specs/data_model.md` Part 2 "The
Two-Client Rule"; INV-AUTH-001 and INV-RLS-001 (the two rules
that together make INV-SERVICE-002 safe);
`docs/03_architecture/system_overview.md` (service layer
client discipline);
`docs/04_engineering/conventions.md` service function
authoring pattern;
`docs/04_engineering/testing_strategy.md` service test
patterns (tests call service functions directly with a
service-role client, matching the production path).

---

### INV-MONEY-001 — Money at the service boundary is string-typed, never JavaScript `Number`

**Invariant.** Every monetary value that crosses the service
boundary — as an input to a service function, as an output,
as a field inside a Zod-validated payload — is a branded
`MoneyAmount` string, never a JavaScript `number`. The same
rule applies to FX rates, which use the separate `FxRate`
branded string. JavaScript `Number` values for money or FX
rates never reach the service body, never appear in service
function signatures, and never leave the service module
boundary on the way back to the API response.

**Why this rule exists.** JavaScript `Number` is an IEEE 754
double-precision float. It cannot represent `0.1 + 0.2`
exactly — the result is `0.30000000000000004`, not `0.3`.
For money, this is a correctness failure: a journal entry
that balances exactly in the database can become unbalanced
after a round-trip through JavaScript arithmetic, and a P&L
report that sums thousands of entries accumulates
last-place errors that compound into visible discrepancies.
The Phase 1.1 architecture rules JavaScript `Number` out of
the money path entirely. Arithmetic on money values happens
in one of two places:

1. **Postgres `numeric(20,4)`** — the authoritative store.
2. **`decimal.js`** — inside the
   `src/shared/schemas/accounting/money.schema.ts` module,
   which is the only file permitted to import `decimal.js`.

The service layer never does `a + b` where `a` and `b` are
money; it calls `addMoney(a, b)` which delegates to
`decimal.js`, which produces a result with Postgres-matching
semantics.

**Enforcement.** Two layered mechanisms:

1. **Zod boundary validation.** Every money field at every
   service-boundary Zod schema is `MoneyAmountSchema` —
   defined in
   `src/shared/schemas/accounting/money.schema.ts`:

```typescript
export type MoneyAmount = string & { __brand: 'MoneyAmount' };
export type FxRate = string & { __brand: 'FxRate' };

export const MoneyAmountSchema = z
  .string()
  .regex(
    /^-?\d{1,16}(\.\d{1,4})?$/,
    'Must be a valid amount (up to 4 decimal places)',
  )
  .transform((v) => v as MoneyAmount);

export const FxRateSchema = z
  .string()
  .regex(
    /^-?\d{1,12}(\.\d{1,8})?$/,
    'Must be a valid rate (up to 8 decimal places)',
  )
  .transform((v) => v as FxRate);
```

   The regex validates at most 4 decimal places for
   `MoneyAmount` (matching Postgres `numeric(20,4)`) and at
   most 8 for `FxRate` (matching `numeric(20,8)`). The
   `.transform()` brands the validated string as
   `MoneyAmount` or `FxRate`. A call that passes a JavaScript
   number for a money field fails Zod validation at the
   boundary and produces a clean `z.ZodError` naming the
   offending field.

2. **TypeScript branded types.** `MoneyAmount` and `FxRate`
   are declared as `string & { __brand: 'MoneyAmount' }` and
   `string & { __brand: 'FxRate' }`. The brand is a phantom
   type — it exists only at compile time and has no runtime
   representation. At compile time, TypeScript distinguishes
   `MoneyAmount` from `string`, so a developer cannot pass
   a plain `string` where `MoneyAmount` is expected, and
   cannot construct a `MoneyAmount` without going through
   the Zod schema or the `toMoneyAmount()` coercion helper.
   This catches drift at type-check time — if a new service
   function accidentally types a parameter as `string`
   instead of `MoneyAmount`, a call site that passes an
   actual `MoneyAmount` succeeds (because `MoneyAmount
   extends string`), but a call site that accidentally
   passes a `number` fails with a type error.

**The arithmetic helpers.** `money.schema.ts` exports six
helpers that operate on branded money values:

```typescript
export function addMoney(a: MoneyAmount, b: MoneyAmount): MoneyAmount;
export function multiplyMoneyByRate(amount: MoneyAmount, rate: FxRate): MoneyAmount;
export function eqMoney(a: MoneyAmount, b: MoneyAmount): boolean;
export function eqRate(a: FxRate, b: FxRate): boolean;
export function zeroMoney(): MoneyAmount;
export function oneRate(): FxRate;
```

Every service function that needs to compute on money uses
these helpers. `addMoney` uses `decimal.js` addition and
returns a `numeric(20,4)`-compatible result.
`multiplyMoneyByRate` uses `Decimal.ROUND_HALF_UP` to match
Postgres's `ROUND()` semantics, which is what INV-MONEY-003
(the database CHECK for `amount_cad = ROUND(amount_original *
fx_rate, 4)`) requires. `eqMoney` and `eqRate` use
`Decimal.eq()` rather than JavaScript `===`, so string
representations that are numerically equal but
lexicographically different (e.g. `'1.0000'` vs `'1'`) are
correctly treated as equal.

**Coercion from the database driver.** The Supabase driver
serializes Postgres `numeric` columns to JSON in a way that
is not stable across versions — sometimes as strings,
sometimes as JavaScript numbers. The service layer handles
this via `toMoneyAmount(value: string | number): MoneyAmount`
and `toFxRate(value: string | number): FxRate`, which wrap
the value in `new Decimal(value)` and return
`Decimal.toFixed(4)` or `Decimal.toFixed(8)` respectively.
Every service function that reads money from the database
applies `toMoneyAmount` to the raw column value before
using it — see `journalEntryService.get` for the reference
implementation, which coerces `debit_amount`, `credit_amount`,
`amount_original`, `amount_cad`, and `fx_rate` on every
line row returned from a SELECT.

**`decimal.js` is confined to one file.** The service layer
as a whole imports `decimal.js` exactly once: in
`src/shared/schemas/accounting/money.schema.ts`. Every other
file that needs to do money arithmetic calls the exported
helpers. This confinement is deliberate — it means any
change to money arithmetic semantics (rounding mode,
precision, handling of negative zero, etc.) happens in one
place and automatically propagates to every service
function. A code review finding `import Decimal from
'decimal.js'` anywhere outside `money.schema.ts` is a
rejected PR.

**Interaction with INV-MONEY-002 and INV-MONEY-003.** The
two Layer 1 money CHECKs enforce the database-level
consistency:

- INV-MONEY-002: `amount_original = debit_amount + credit_amount`
- INV-MONEY-003: `amount_cad = ROUND(amount_original * fx_rate, 4)`

Both rules assume Postgres `numeric` semantics. For the
service layer's pre-flight Zod refines (which check the same
equations *before* the database write, producing cleaner
errors) to agree with the database, the service layer's
arithmetic must match Postgres. `decimal.js` with
`ROUND_HALF_UP` matches Postgres `ROUND()` semantics
exactly. JavaScript `Number` arithmetic does not. The
service layer's conformance to the database CHECKs therefore
depends on INV-MONEY-001 being true — if a service function
accidentally computed `amount_cad` as
`Number(amount_original) * Number(fx_rate)`, the result
would differ from the database's `ROUND(amount_original *
fx_rate, 4)` in the last place on any non-trivial FX rate,
and the INSERT would fail the CHECK with a mismatch the
service layer could not reproduce under `decimal.js`.
INV-MONEY-001 is the foundation that makes INV-MONEY-002
and INV-MONEY-003 enforceable at the service layer at all.

**What breaks if this rule is violated.** A service function
that uses `Number` arithmetic on money values:

- Cannot correctly pre-validate the INV-MONEY-002 and
  INV-MONEY-003 CHECKs, because JS arithmetic drifts from
  Postgres `numeric` in the last place.
- Produces P&L sums that drift from the database
  aggregate — a service-layer sum of 1000 journal lines
  can differ from the Postgres `SUM(amount_cad)` by tens
  of cents, which looks like "the report is wrong."
- Introduces silent precision loss when passing money
  through JSON serialization — a string like `"123.4567"`
  round-trips exactly, but `Number("123.4567")` may
  serialize back as `"123.4567"` *or* `"123.4566999999..."`
  depending on the path.

**No dedicated integration test — exercised by every money-
touching test.** INV-MONEY-001 is not on the Category A floor
as a standalone test. It is enforced by the Zod schemas at
every service call site (every integration test that posts
a journal entry exercises `MoneyAmountSchema` implicitly),
and by the unit tests in `tests/unit/moneySchema.test.ts`
which cover `addMoney`, `multiplyMoneyByRate`,
`toMoneyAmount`, and `toFxRate` against boundary cases
(4-decimal-place precision, 8-decimal-place precision,
rounding-mode edge cases). The combined effect is that
every mutation path through the service layer is
money-typed end to end.

**Phase 2 evolution.** The rule is permanent and becomes
more important in Phase 2 when real multi-currency bill
ingestion begins. Phase 2 introduces the first service
functions that compute money values with non-trivial
`fx_rate` (USD, EUR, GBP bills from intercompany vendors),
and the precision match between `multiplyMoneyByRate` and
Postgres `ROUND()` is what lets those bills post without
CHECK violations. A Phase 2 regression that accidentally
passed FX rates through `Number` would surface as an
entire category of bills failing to post. INV-MONEY-001
is the compile-time and boundary-time defense against
that failure mode.

**Referenced by:** `docs/02_specs/data_model.md`
`journal_lines` section (named CHECKs list for MONEY-002
and MONEY-003, both of which cite MONEY-001 as the
service-layer precondition);
`docs/03_architecture/request_lifecycle.md` manual path
and confirmation commit path (money validation step);
`docs/03_architecture/phase_plan.md` Phase 1.1 "What was
built" bullet (money-as-string discipline);
`docs/04_engineering/testing_strategy.md`
`moneySchema.test.ts` unit test coverage;
`docs/04_engineering/conventions.md` money-as-string
pattern with the `decimal.js`-confinement rule; PLAN.md §3a
(seed material for the rationale).

---

### INV-REVERSAL-001 — Reversal lines must mirror the original

**Invariant.** A journal entry that reverses another (has
`reverses_journal_entry_id IS NOT NULL`) must consist of exactly
the same lines as the original entry, with `debit_amount` and
`credit_amount` swapped on each line and every other column
preserved (same `account_id`, `currency`, `amount_original`,
`amount_cad`, `fx_rate`, `tax_code_id`). Partial reversals are not
supported in Phase 1.1 — a reversal must mirror all lines of the
original or it is rejected.

**Why Layer 2 and not Layer 1.** This rule could in principle be a
database trigger, but it is expressed in TypeScript in the service
layer because (a) the mirror check involves comparing two sets of
rows against each other, which is cleaner in application code than
in PL/pgSQL, and (b) the check must run *before* `BEGIN` so that a
rejected reversal produces a clean `ServiceError` without a
rolled-back transaction cluttering the logs. The complementary
rule **INV-REVERSAL-002** (reversal_reason non-empty) *is* a Layer
1 CHECK constraint — that one is a simple column predicate and
fits the database enforcement shape.

**Enforcement.** `validateReversalMirror()` in
`src/services/accounting/journalEntryService.ts`, called from
`journalEntryService.post()` before the database transaction
begins. The algorithm has five steps:

1. **reversal_reason non-empty.** If `reversal_reason` is missing,
   empty, or whitespace-only, throw
   `ServiceError('REVERSAL_NOT_MIRROR', 'reversal_reason is
   required and must be non-empty')`. This is a service-layer
   defense-in-depth check — the Layer 1 CHECK constraint
   (INV-REVERSAL-002) also catches this, but the service layer
   gives the caller a cleaner error code upstream of the database.
2. **Load the referenced entry.** `SELECT journal_entry_id, org_id
   FROM journal_entries WHERE journal_entry_id = :reverses_id`. If
   not found, throw
   `ServiceError('REVERSAL_NOT_MIRROR', 'Referenced journal entry
   not found')`.
3. **Same-org check.** The original entry's `org_id` must match the
   reversal's `org_id`. If they differ, throw
   `ServiceError('REVERSAL_CROSS_ORG', 'Cannot reverse an entry
   from a different org')`. This is the cross-org defense: a user
   in org A cannot reverse an entry in org B even if they somehow
   hold a valid reference to the org B entry's UUID.
4. **Line count match.** `input.lines.length` must equal
   `originalLines.length`. If they differ, throw
   `ServiceError('REVERSAL_PARTIAL_NOT_SUPPORTED', ...)`. Phase
   1.1 has no partial-reversal affordance; Phase 2 will add it.
5. **Each input line mirrors some original line.** For each line
   in the reversal input, find a match in the original lines
   where: `account_id` equals, `currency` equals,
   `amount_original` equals (to 4 decimal places), `amount_cad`
   equals (to 4 decimal places), `fx_rate` equals (to 8 decimal
   places), and debit/credit are *swapped* (original debit equals
   reversal credit and vice versa). Matched originals are removed
   from the candidate set to prevent double-matching. If any
   reversal line finds no match, throw
   `ServiceError('REVERSAL_NOT_MIRROR', 'Line N does not mirror
   any line in the original entry')`.

**Supabase-driver normalization.** The Supabase REST API may return
numeric columns as JavaScript numbers (the PostgREST JSON
serialization for `numeric` is not stable across versions), while
the service boundary carries money as 4-decimal-place strings
(INV-MONEY-001). The mirror comparison normalizes both sides
through `toMoney(v) => Number(v).toFixed(4)` before equality
checks, so the comparison is correct regardless of whether the
driver returned strings or numbers.

**Interaction with INV-REVERSAL-002.** The Layer 1 CHECK constraint
`reversal_reason_required_when_reversing` is the authoritative
enforcement for the reversal_reason rule — even if a bug in
`validateReversalMirror` allowed a reversal without a reason, the
database CHECK would reject it at insert time. The service-layer
check exists because it produces a cleaner typed error; the
database check exists because it is unbypassable. Both matter.

**Deferred to Phase 2:**

- **Partial reversals.** The ability to reverse only some lines of
  a multi-line entry. The Phase 1.1 algorithm assumes full mirror
  and the UI offers no partial-selection affordance. See
  `docs/03_architecture/ui_architecture.md` Reversal UI section.
- **Automatic period-end reversals.** The accrual accounting
  pattern where an accrual posted on the last day of a period is
  auto-reversed on the first day of the next period. Phase 2
  introduces the schedule.

**Category A floor test.**
`tests/integration/reversalMirror.test.ts` posts an original
entry, then attempts three invalid reversals (one with a missing
line, one with mismatched amounts, one with the debit/credit not
swapped) and asserts that each is rejected with the expected
`ServiceError` code without affecting the original entry. The test
also posts a valid reversal and asserts that both entries exist in
the ledger and net to zero in a P&L query.

**Referenced by:** `docs/02_specs/data_model.md` `journal_entries`
section (service-layer enforcement note);
`docs/03_architecture/ui_architecture.md` Reversal UI section
(service-layer verifies mirror before transaction begins);
`docs/03_architecture/phase_plan.md` Phase 1.1 "What was built"
bullet; `docs/04_engineering/testing_strategy.md` Category A floor
table; `docs/07_governance/adr/0001-reversal-semantics.md` (ADR
for reversal design).

---

### INV-AUDIT-001 — Every mutating service call writes an `audit_log` row in the same transaction

**Invariant.** Every service function that writes to a
tenant-scoped table also writes a row to `audit_log` inside
the same database transaction. The audit row captures *who*
did *what* to *which entity*, with a `trace_id` tying the
audit row to the pino log entries for the same request. If
the mutation transaction rolls back (for any reason — CHECK
violation, trigger exception, service-layer error), the audit
row rolls back with it. If the mutation commits, the audit
row is guaranteed to be present. "Guaranteed" is literal: the
rule is *transactional*, not *eventual*.

**Why transactional and not asynchronous.** A Phase 2
architecture would emit an event to the `events` table and
let a projection worker build `audit_log` asynchronously.
Phase 1.1 does not have the events table writing any rows
yet (Simplification 2 — see
`docs/03_architecture/phase_simplifications.md`), so the
audit path is synchronous: the service function calls
`recordMutation()` inside its own transaction, and the
audit row commits atomically with the mutation. This is
**Simplification 1** from the phase_simplifications document
— the explicit decision to write audit synchronously until
the event stream can take over.

The tradeoff: a synchronous audit write adds one row to
every mutation transaction. At Phase 1.1 traffic (solo
founder, few mutations per day), this is free. Phase 2
introduces higher volumes and the projection pattern
becomes valuable because it lets the audit write happen
off the critical path. The rule shape in Phase 1.1 is
"synchronous inside the transaction"; the Phase 2 shape
will be "eventual via projection from events." Both are
*implementations* of the same invariant "every mutation
produces an audit record." The difference is only in *when*
the audit row becomes visible.

**Enforcement.** `recordMutation()` at
`src/services/audit/recordMutation.ts`. The helper is called
by every mutating service function from inside its
transaction, passing the service's active `SupabaseClient`
(the service-role client) so the audit row participates in
the same transaction as the mutation:

```typescript
export async function recordMutation(
  db: SupabaseClient,
  ctx: ServiceContext,
  entry: AuditEntry,
): Promise<void> {
  const { error } = await db.from('audit_log').insert({
    org_id: entry.org_id,
    user_id: ctx.caller.user_id,
    trace_id: ctx.trace_id,
    action: entry.action,
    entity_type: entry.entity_type,
    entity_id: entry.entity_id ?? null,
    before_state: entry.before_state ?? null,
    after_state_id: entry.after_state_id ?? null,
    tool_name: entry.tool_name ?? null,
    idempotency_key: entry.idempotency_key ?? null,
  });

  if (error) {
    throw new Error(`[AUDIT_WRITE_FAILED] ${error.message}`);
  }
}
```

The helper accepts a `SupabaseClient` argument rather than
creating its own via `adminClient()`. This is load-bearing:
the caller passes the same client (and therefore the same
transaction context) that is performing the mutation, so the
audit INSERT runs inside the same transaction as the
preceding data INSERTs. If the transaction rolls back, both
the data writes and the audit writes disappear together.
There is no window in which the data exists without its
audit row, and no window in which an audit row exists for
a mutation that did not happen.

**Why a plain `Error`, not a `ServiceError`.** A failure in
`recordMutation` throws `new Error('[AUDIT_WRITE_FAILED] ...')`
— a plain `Error` with a bracketed code prefix, not a typed
`ServiceError`. This is intentional. An audit write failure
is not a caller-facing error; it is an *internal integrity
failure* of the service layer itself. The calling service
function catches the error (or lets it propagate), and the
outer transaction rolls back. The caller receives a generic
500 Internal Server Error from the API route handler, not
a specific typed code. The reason is that an audit write
failing means something is wrong at a level below what the
caller can usefully act on — the service layer itself is
broken — and exposing that as a structured error code would
invite callers to build retry logic around it, which is
not the right response. The right response is "roll back,
log loudly, page the on-call." The `AUDIT_WRITE_FAILED`
prefix makes the failure greppable in logs and in stack
traces, which is the Phase 1.1 observability need.

**The pattern in practice.**
`journalEntryService.post()` calls `recordMutation` after
the journal_entries INSERT and the journal_lines INSERT
complete, but before any return from the function (which is
the implicit COMMIT point for the transaction started by
the Supabase client's first write). The shape is:

```typescript
async function post(input, ctx) {
  // ... Zod parse, period-lock pre-flight, reversal mirror ...
  const db = adminClient();
  // INSERT journal_entries
  // INSERT journal_lines
  await recordMutation(db, ctx, {
    org_id: parsed.org_id,
    action: isReversal ? 'journal_entry.reverse' : 'journal_entry.post',
    entity_type: 'journal_entry',
    entity_id: entry.journal_entry_id,
  });
  return { journal_entry_id, entry_number };
}
```

Every new mutating service function added to
`src/services/` follows this pattern: after the last data
mutation, before any return, call `recordMutation` with
the action name and the entity ID. Forgetting to call
`recordMutation` is caught by code review (same discipline
as INV-SERVICE-001 and INV-SERVICE-002).

**Interaction with INV-AUTH-001.** The audit row carries
`user_id` from `ctx.caller.user_id` — which is populated
only if the caller is verified (INV-AUTH-001 pre-flight
step 2). If a mutation somehow reached `recordMutation`
with an unverified caller, the audit row would carry a
NULL or bogus `user_id`. INV-AUTH-001 prevents this by
ensuring the `verified` flag must be true before any
business logic runs; the `recordMutation` call is inside
the business logic, so it inherits the verified-caller
guarantee. The two rules chain: AUTH-001 guarantees
`user_id` is real, AUDIT-001 guarantees that real
`user_id` is recorded on every mutation.

**Interaction with INV-SERVICE-002.** `recordMutation`
takes a `SupabaseClient` argument rather than instantiating
its own, which means it participates in whatever
transaction the caller has open — necessarily the
service-role client's transaction, because INV-SERVICE-002
requires service functions to use `adminClient`. If a
service function somehow passed a `userClient` instance
to `recordMutation`, the audit INSERT would fail with
"new row violates RLS policy" (because there is no INSERT
policy on `audit_log`), the caller would receive
`AUDIT_WRITE_FAILED`, and the transaction would roll back.
This is another example of INV-SERVICE-002 being a
prerequisite for other Layer 2 invariants to hold.

**What breaks if this rule is violated.** A service
function that mutates data without calling
`recordMutation`:

- Produces a mutation with no audit trail — an auditor
  asking "who posted this entry and when?" cannot
  answer from `audit_log` alone. The AI Action Review
  queue (Phase 1.2) depends on `audit_log` rows being
  present for every agent-initiated entry; missing rows
  mean the queue shows fewer entries than were actually
  posted.
- Misses the `trace_id` correlation — pino log entries
  for the request cannot be tied back to a specific
  mutation by grepping `audit_log`, so forensic
  investigation has to rely on timestamp matching
  alone.
- Defeats the "single place to ask 'what happened?'"
  promise that the audit log is supposed to carry.

**No dedicated integration test — implicit coverage.**
INV-AUDIT-001 is exercised implicitly by every integration
test that posts a journal entry: each test asserts
(directly or indirectly) that the audit row exists
after a successful post, and no audit row exists after a
rollback. The Category A floor test
`tests/integration/unbalancedJournalEntry.test.ts`
implicitly exercises the rollback path — when the
deferred balance constraint fails at COMMIT, both the
journal_lines INSERTs and the audit_log INSERT roll
back together, and the test asserts zero rows in both
tables afterward. A dedicated "audit row is present
when mutation succeeds, absent when mutation rolls back"
unit test is a Phase 1.2 test obligation for the agent
path where audit guarantees become user-facing (the
AI Action Review queue depends on them).

**Phase 2 evolution — the projection shift.** Phase 2
introduces the events table as the source of truth
for mutations, and `audit_log` becomes a projection
derived from the event stream via a background worker.
The synchronous `recordMutation` call inside the
service function goes away; it is replaced by an event
emission (still inside the transaction, still
synchronous from the service function's perspective)
and a projection worker that reads the event stream
and builds `audit_log` rows asynchronously. The
**invariant** "every mutation produces an audit record"
is unchanged; the **mechanism** shifts from "write
audit row in the same transaction" to "emit event in
the same transaction, project to audit_log
asynchronously." The Phase 2 shape has two failure
modes that Phase 1.1 does not:

- The projection worker could fall behind, so the
  audit row is present in `events` but not yet in
  `audit_log` — forensic queries must check both.
- The projection worker could crash and miss events —
  Phase 2 adds a reconciliation job that replays events
  from a checkpoint to catch up.

Phase 1.1's synchronous shape has neither problem
because the audit row and the mutation are the same
transaction. The tradeoff is that Phase 1.1 cannot
scale audit writes independently of mutation writes —
a slow `audit_log` insert slows every mutation. At
Phase 1.1 traffic this is invisible; Phase 2 makes it
matter.

**Referenced by:** `docs/02_specs/data_model.md`
`audit_log` section (Phase 1 synchronous write note,
"Simplification 1");
`docs/03_architecture/phase_simplifications.md`
Simplification 1 ("audit_log written synchronously in
Phase 1, projection from events in Phase 2");
`docs/03_architecture/request_lifecycle.md` manual path
(recordMutation step in the service body);
`docs/03_architecture/phase_plan.md` Phase 2 "What
lights up" bullet (projection worker);
`docs/04_engineering/testing_strategy.md` Phase 1.2
test obligations (audit row presence on successful
post, audit row absence on rollback);
Structured Error Contracts section (the
`AUDIT_WRITE_FAILED` sentinel and why it is not a
typed `ServiceError`).

---

**End of calibration sample.** The remaining 14 INV-IDs, Layer 3,
Layer 4, Transaction Isolation, Service Communication Rules, and
Structured Error Contracts sections will be added in a follow-up
pass after review.
