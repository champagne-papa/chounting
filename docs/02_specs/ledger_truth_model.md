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
higher-order function: every service function in `src/services/`
is exported as `withInvariants(fn, { action })` so that calling
the function runs four pre-flight invariants before the function
body:

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

**End of calibration sample.** The remaining 14 INV-IDs, Layer 3,
Layer 4, Transaction Isolation, Service Communication Rules, and
Structured Error Contracts sections will be added in a follow-up
pass after review.
