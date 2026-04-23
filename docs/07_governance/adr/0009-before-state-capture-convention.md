# ADR-0009: `before_state` Capture Convention for `audit_log`

## Status

Accepted

## Date

2026-04-23

## Triggered by

Phase 0–1.1 Control Foundations brief §10 — the ADR obligation paired
with Step 3's shipping of `periodService.lock` and `periodService.unlock`
as the first ledger-adjacent control-surface consumers of the
convention. The brief decomposes the work: Step 2 lands the doc + ADR
pair (this ADR and the `AuditEntry` JSDoc) and Step 3 lands the code
that first exercises the convention in the accounting domain. Brief
§3.5 states the convention content; §10 locks the framing as "first
live consumer," not "convention ahead of consumer."

## Context

The `AuditEntry.before_state?: Record<string, unknown>` field on the
payload passed to `recordMutation` (`src/services/audit/recordMutation.ts`
line 33) has been the intended capture point for pre-mutation state
since the `AuditEntry` interface stabilized under INV-AUDIT-001. Phase
1.5A (2026-04-15) was the convention's first broad application,
landing populated `before_state` across six service files:
`orgService.updateOrgProfile` (UPDATE with pre-update SELECT),
`addressService` (INSERT with explicit `undefined`, UPDATE, DELETE,
and an auto-demote side-effect pattern),
`membershipService` (four lifecycle UPDATE mutations — invite, activate,
suspend, remove), `invitationService` (create / cancel / accept),
`userProfileService.updateProfile` (conditional on the upsert branch:
`undefined` on the insert side, populated on the update side), and
`src/agent/orchestrator/loadOrCreateSession.ts` (agent-session
org-switch UPDATE). Three integration tests shipped alongside
(`addressServiceAudit.test.ts`, `userProfileAudit.test.ts`,
`agentSessionOrgSwitchAudit.test.ts`), and the contributor-facing
concise form was added to `docs/04_engineering/conventions.md:190` as
the "Audit `before_state` Convention" subsection under Phase 1.5A
Conventions. By the time this ADR is filed, the convention is roughly
two weeks old as a pattern in the codebase.

Two converging forces make this the right moment for an ADR despite
the convention pre-existing the decision record. First, the Control
Foundations brief §10 explicitly requires it: ADR-A on the
`before_state` capture convention is one of two ADRs paired with this
brief. Second, Step 3's `periodService.lock` and `periodService.unlock`
are the first consumers on the **ledger-adjacent control surface** —
the convention has crossed from the organization and membership
configuration domain into the surface that interacts directly with
posted journal entries. A convention this load-bearing deserves the
decision-history artifact future readers will grep for when they
encounter a new UPDATE or DELETE service method and ask "do I capture
`before_state` here?" The INV-AUDIT-001 leaf in
`docs/02_specs/ledger_truth_model.md` (the "Before-state capture
convention" and "Current implementation sites" paragraphs around line
2960) is the load-bearing spec; `conventions.md:190` is the bullet-form
contributor reminder; this ADR is the decision record.

This ADR is deliberately numbered after ADR-0008 and references its
Layer 1a/1b enforcement-mode framing. ADR-0008 established the split:
INV-AUDIT-002 sits in Layer 1a (commit-time physical — `audit_log`
append-only at the database via triggers, RLS policies, and REVOKEs).
ADR-0009 records the Layer 2 service-layer convention by which UPDATE
and DELETE callers populate the field that ADR-0008's append-only
guarantee then makes permanent. The two ADRs compose: 0008 makes the
row permanent once written; 0009 specifies what the row must contain
when an UPDATE writes it. ADR-0009 is its original draft number, not a
renumber — the `(ADR-0007 is reserved …)` reservation in the index is
unchanged.

**Framing correction recorded in-place.** An earlier drafter pass on
the doc-only codification of this convention framed
`periodService.lock` / `unlock` as "the first real exercise of this
convention" and asserted "no current call site populates
`before_state`." Both claims were wrong against the shipped codebase:
Phase 1.5A had introduced the convention two weeks earlier across the
six service files named above, with three integration tests and the
`conventions.md:190` entry. The executor caught the drift at the Step
2 gate via `grep -rn "recordMutation" src/`; the Spec-to-Implementation
Verification convention at `docs/04_engineering/conventions.md` was
refined to add **temporal claims** as a sixth verification category
(conventions.md §337 ff, "Refinement datapoint (Phase A)"), and the
full incident record sits at `docs/07_governance/friction-journal.md`
Phase A subsection A (line 4912). This ADR is filed under the
corrected framing — *first live consumer on the ledger-adjacent
control surface*, not first exercise overall. The correction is kept
visible here, not just in the friction journal, so future ADR
drafters who pattern-copy this one inherit the correct framing rule
and the "verify before you claim" discipline.

## Decision

The `before_state` capture convention is Accepted as the pattern for
all current and future tenant-scoped service-layer mutations that
write through `recordMutation`. Three rules govern when and how the
field is populated. The `AuditEntry` JSDoc (`recordMutation.ts` lines
12–19) is the in-code reminder that points contributors back to the
INV-AUDIT-001 leaf for the load-bearing statement; the JSDoc was
written as part of this brief's `before_state` capture work (Phase B)
alongside this ADR.

### The three rules

- **INSERT mutations omit `before_state`.** The row did not exist
  before the mutation; absence is correct. Pass `before_state:
  undefined` (or omit the field; `recordMutation` normalizes both to
  SQL `NULL`). Explicit `undefined` is preferred over field omission
  because it signals deliberate absence to reviewers rather than
  accidental omission. Current consumers: `journalEntryService.post`,
  `addressService.addAddress` (insert branch),
  `invitationService.create`, and `userProfileService.updateProfile`'s
  upsert-insert branch.
- **UPDATE mutations MUST capture `before_state`** via a `SELECT`
  issued through the same `adminClient` before the `UPDATE`, passing
  the full pre-update row to `recordMutation` as a
  `Record<string, unknown>`. Current consumers:
  `orgService.updateOrgProfile`, `membershipService` (four lifecycle
  methods — invite / activate / suspend / remove),
  `addressService.updateAddress` and `addressService.setPrimaryAddress`,
  `invitationService.cancel` and `invitationService.accept`,
  `userProfileService.updateProfile`'s update branch,
  `src/agent/orchestrator/loadOrCreateSession.ts`'s org-switch UPDATE,
  and (Step 3 of this brief) `periodService.lock` /
  `periodService.unlock`.
- **DELETE mutations MUST capture `before_state` via the same
  pattern.** `addressService.removeAddress` is the current and only
  example. Phase 1 permits no DELETE on posted ledger rows — RLS
  default-deny on `journal_entries` and `journal_lines`, and
  INV-AUDIT-002 (Layer 1a) forbids DELETE on `audit_log` itself via
  triggers, RLS policies, and REVOKEs. The rule exists for current and
  future tenant-scoped tables that permit delete operations.

### Atomicity — the narrower guarantee

The guarantees are narrower than a single database transaction. The
`SELECT` → `UPDATE` → `audit_log INSERT` triple is not one
transaction: each supabase-js call is a separate PostgREST HTTP
round-trip, each running in its own short-lived server-side
transaction. What the convention guarantees is that all three
operations target the same row through the same `adminClient` in
sequence, so the `UPDATE`'s row-level lock correctly serializes
against concurrent writers — including INV-LEDGER-002's
`enforce_period_not_locked` trigger, which acquires
`SELECT ... FOR UPDATE` on the same `fiscal_periods` row when
`journal_lines` inserts fire and therefore serializes against
`periodService.lock` on the same row.

That serialization guarantee does not extend to making the preceding
`SELECT` and the subsequent `UPDATE` see the same row state. The
`SELECT` holds no lock of its own, so a concurrent writer committing
between the `SELECT` and the `UPDATE` is technically possible under
`READ COMMITTED`. In that window, `before_state` captured by the
`SELECT` would be stale against what the `UPDATE` then sees and
mutates. The window is narrow — same-request, same-client,
sub-millisecond between the two round-trips — and the concurrent-writer
pattern is rare in Phase 1 (single-founder traffic, no agent-driven
write loops on `fiscal_periods` or similar control-surface rows). The
orphan case produces a `before_state` that disagrees with the
`UPDATE`'s actual pre-state by one concurrent mutation: a known and
accepted risk, load-bearing motivation for the Phase 2
events-projection migration. The INV-AUDIT-001 leaf's "Known limits"
paragraph (`ledger_truth_model.md` around line 3037) states this
honestly, and this ADR inherits that framing rather than overclaiming
atomicity the call pattern does not provide.

A second orphan window — data `UPDATE` committed, then a crash before
the `audit_log INSERT` — produces a mutation without an audit row at
all. Phase 1 treats this as the primary honest-limit case of the
synchronous-audit simplification (Phase Simplification 1). Phase 2's
events-projection work addresses both windows by deriving audit
entries from the mutation event rather than writing them in a second
round-trip.

### `NOT_FOUND` ordering

If the pre-update `SELECT` returns zero rows, the service MUST throw
`ServiceError('NOT_FOUND', ...)` — or the domain-specific equivalent
such as `RECURRING_TEMPLATE_NOT_FOUND` — **before** attempting the
`UPDATE`. This is not a `recordMutation` concern. It is the calling
service's responsibility to not invoke `recordMutation` for a mutation
that never happened: without this ordering rule, a service that issues
an `UPDATE` against a row that does not exist would produce an
`UPDATE` affecting zero rows (a no-op) and then write an audit entry
claiming a mutation occurred, leaving a ghost row in `audit_log` that
references a non-event. `periodService.lock` and `periodService.unlock`
are the first explicit demonstrations of this ordering on the
ledger-adjacent surface: both methods check the `maybeSingle()` result
and throw `NOT_FOUND` before the `UPDATE` call, with the same-org
scoping filter (`.eq('org_id', input.org_id)`) ensuring cross-org
lookups produce `NOT_FOUND` rather than false affirmatives.

### Phase 2 evolution

When the `events` table activates and `audit_log` becomes a projection
from events — the Phase Simplification 1 → Phase 2 correction recorded
at `docs/03_architecture/phase_simplifications.md` — `before_state`
migrates into the event payload. The shape is unchanged from a
consumer's perspective: a reader querying the projected `audit_log`
sees the same `before_state` jsonb column with the same semantics.
What changes is the writer: `recordMutation` gives way to event
emission inside the same statement as the mutation, and the projection
worker rebuilds `audit_log` from the event stream. The atomicity
critique of the current synchronous path closes in Phase 2 because the
event emission and the data `UPDATE` live in the same statement, not
two round-trips; the projection worker's eventual consistency is the
trade Phase 2 makes, and it is a better trade than the orphan windows
documented above. This ADR's convention migrates forward cleanly: the
three rules (INSERT omits, UPDATE captures, DELETE captures) continue
to govern event payloads, and the authority of the convention moves
with the write path.

## Consequences

**What this enables.** Auditors and audit-log consumers reconstruct
field-level diffs by comparing `before_state` to current state for
every UPDATE and DELETE. The presence or absence of `before_state`
becomes the in-band "created vs. mutated" signal in `audit_log`
without consulting `action` — a useful affordance for generic audit
tooling that does not want to enumerate action strings. The
ledger-adjacent control surface (`periodService.lock` /
`periodService.unlock`, the future Phase 2 adjustments and
control-account reconciliations, future close-process operations)
starts with the convention already in place rather than retrofitted
later: Step 3 does not have to invent the pattern, only to follow it.
ADR-0008's Layer 1a append-only guarantee composes cleanly with the
convention: every `UPDATE` writes a permanent audit row containing the
pre-state, so the combined guarantee is "every mutation produces a
permanent record containing the pre-mutation state." The convention
also composes with secondary-audit-row patterns: when a service
mutation has a logical side-effect (for example,
`addressService.setPrimaryAddress` auto-demoting a prior primary
address), the convention composes by emitting a second
`recordMutation` call with its own `before_state` for the side-effect
row — this works cleanly because `before_state` is payload-per-call,
not payload-per-mutation.

**What this constrains.** Every future UPDATE or DELETE service method
on a tenant-scoped table must follow the `SELECT`-then-mutate pattern;
a forgotten `SELECT` is a code-review rejection. The Step 4 audit
coverage verifier will not catch a missing `before_state` for an
UPDATE because the convention's shape is *capture when mutating a
row that existed*, and the verifier cannot distinguish a correctly-null
`before_state` on an INSERT from an incorrectly-null `before_state` on
an UPDATE without reasoning about service intent — the absence is
indistinguishable from a legal INSERT to a mutation-action-agnostic
check. Enforcement of this convention therefore lives in code review
and in the targeted integration tests named above, not in the
verifier. Contributors adding a new UPDATE or DELETE service method
must also add a test that asserts the presence and shape of
`before_state` in the emitted `audit_log` row.

The known synchronous-audit-not-transactional-across-HTTP-round-trips
limit carries through into this convention: a crash between the
`UPDATE` and the `audit_log INSERT` leaves a mutation without an audit
row; a concurrent writer committing between the `SELECT` and the
`UPDATE` produces a stale `before_state`. Neither is a Phase 1 bug;
both are known risks accepted as the cost of the synchronous audit
simplification, and both close in Phase 2 per the evolution paragraph
above.

Finally, adding a delete-allowed table in a future phase requires a
decision about whether existing service callers handle the
`SELECT`-then-`DELETE` sequence atomically enough for the use case, or
whether delete operations on that table need to move into the Phase 2
events-projection path from day one. This ADR does not resolve that
question in advance; it flags it as something the brief introducing
such a table must address.

## Alternatives considered

### Alternative 1 — Database trigger mirroring rows into `audit_log` on UPDATE/DELETE

Rejected. The INV-AUDIT-001 leaf places the audit write in the service
layer (Layer 2); moving capture into a trigger splits the
authoritative-write story across two enforcement points for the same
rule. It would require the trigger to construct an `AuditEntry`-shaped
payload in PL/pgSQL, duplicating the type that currently lives
structurally in TypeScript. Two consequences follow: drift between
trigger-language payload construction and TypeScript payload
construction (the same bug now has two places to live), and a second
test surface — every new audit-emitting mutation would need unit tests
in TypeScript *and* trigger-behavior tests at the database level.

INV-AUDIT-002's append-only triggers (Layer 1a) work well precisely
because they enforce a *negative* rule — no UPDATE, DELETE, or
TRUNCATE on `audit_log` — that requires no coordinated payload
construction. Mirroring rows into `audit_log` is a *positive* rule
with payload construction, which belongs in service code where the
constructed payload is type-checked, testable, and visible in the
service method alongside the mutation it records. Negative
database-layer invariants and positive service-layer conventions are a
deliberate split in the four-layer model; this alternative would
violate it for no semantic benefit.

### Alternative 2 — ORM-style middleware wrapper synthesizing `before_state`

Rejected. The service layer uses the Supabase client directly per
INV-SERVICE-002 (no ORM abstraction), and supabase-js has no
transactional middleware concept. Intercepting UPDATE and DELETE to
synthesize `before_state` would require either a wrapper class
implementing the supabase-js surface (every method proxied, every
return type preserved) or a custom client with hooks for pre-mutation
SELECT injection. Either path is architectural drift inconsistent with
Phase 1's explicit simplicity choice recorded in Phase Simplification
1 (synchronous audit log, no event sourcing infrastructure).

The per-method `SELECT`-then-mutate pattern is roughly six lines per
call site and is visible in the service method next to the mutation it
records. A wrapper that would replace those six lines is a
multi-hundred-line architectural commitment with a second surface area
to test, maintain, and explain to contributors. The trade is wrong for
the problem: the convention's cost is already low, and its visibility
at each call site is a feature for reviewers, not a cost to eliminate.

### Alternative 3 — Defer `before_state` capture to Phase 2's events projection

Rejected. Phase 2 is not yet built. Deferring capture means audit rows
written in Phase 1 have no pre-state at all — a permanently null
`before_state` column on every row currently in the table. When the
projection lands, there is no way to reconstruct history that already
happened: the pre-mutation data is not recoverable from any source
because the UPDATE overwrote it and the `before_state` snapshot was
never taken. The data is irretrievably lost.

Capturing now means Phase 2's projection migrates a populated field
rather than a permanently-NULL one, and the Phase 1 audit trail is
diff-reconstructable from day one of the projection cutover rather
than diff-reconstructable only for mutations that happened
post-cutover. The cost of capturing now is approximately six lines of
service code per UPDATE or DELETE method, plus one targeted
integration test per service. That is a small bill against the value
of a complete audit trail that survives the Phase 1 → Phase 2
transition.

### Alternative 4 — Postgres `OLD` row reference in a trigger function writing to a separate `audit_before_state` side-table

Rejected. Inherits Alternative 1's split-authority cost — capture now
lives in the database, the rest of the audit write lives in the
service layer — and adds new costs of its own. A second table means a
JOIN on every audit-trail read that wants to surface the pre-state,
which is the common case rather than the rare case. It introduces a
"where did the field live in this period?" archaeology problem during
the Phase 2 events-projection migration: the projection worker would
need to know that old rows come from the side-table and new rows come
from the event payload, complicating what would otherwise be a
one-source rebuild. A single `audit_log.before_state` `jsonb` column
on the table that the Phase 2 projection will itself rebuild is the
shape that composes best with the projection migration and the
simplest shape for current queries.

## Cross-references

- **`docs/09_briefs/phase-1.1/control-foundations-brief.md`** — §3.5
  (the convention content) and §10 (the ADR obligation and the "first
  live consumer" framing rule). The brief is this ADR's immediate
  parent.
- **`docs/02_specs/ledger_truth_model.md`** — INV-AUDIT-001 leaf. The
  "Before-state capture convention" paragraph (around line 2960), the
  "Current implementation sites" paragraph (around line 3000), and the
  "Known limits — synchronous audit is not transactional across HTTP
  round-trips" paragraph (around line 3037) are the load-bearing spec.
  This ADR records the decision; the leaf paragraphs carry the rule.
- **`docs/04_engineering/conventions.md:190`** — "Audit `before_state`
  Convention" subsection under Phase 1.5A Conventions. The concise
  bullet-form contributor-facing reminder that landed with Phase 1.5A.
  Conventions.md §337 ff ("Refinement datapoint (Phase A)") records
  the addition of *temporal claims* as a sixth Spec-to-Implementation
  Verification category, motivated by the framing-correction incident
  on the prior drafter pass for this same convention.
- **`src/services/audit/recordMutation.ts`** — the `AuditEntry` type
  declaring the `before_state?: Record<string, unknown>` field (line
  33) and the JSDoc block (lines 12–19) pointing contributors to the
  INV-AUDIT-001 leaf. The JSDoc was written as part of this brief's
  `before_state` capture work (Phase B) and is the in-code reminder.
- **`src/services/accounting/periodService.ts`** — the `lock` method
  (around line 98 with the documented concurrency note) and the
  `unlock` method (around line 185). Both are the first
  ledger-adjacent control-surface consumers of the convention; both
  perform the pre-update `SELECT`, throw `NOT_FOUND` before UPDATE on
  zero-row results, and pass the pre-mutation row to `recordMutation`
  alongside the caller-supplied `reason`.
- **The six Phase 1.5A consumer service files** (2026-04-15):
  `src/services/org/orgService.ts`, `src/services/org/addressService.ts`,
  `src/services/org/membershipService.ts`,
  `src/services/org/invitationService.ts`,
  `src/services/user/userProfileService.ts`, and
  `src/agent/orchestrator/loadOrCreateSession.ts`. These introduced
  the convention in practice; the three integration tests
  (`tests/integration/addressServiceAudit.test.ts`,
  `tests/integration/userProfileAudit.test.ts`,
  `tests/integration/agentSessionOrgSwitchAudit.test.ts`) plus the
  Step 3 test (`tests/integration/periodLockUnlock.test.ts`) exercise
  the convention end-to-end.
- **ADR-0008** (`0008-layer-1-enforcement-modes.md`) — the Layer 1a /
  Layer 1b enforcement-mode split. INV-AUDIT-002 (Layer 1a, append-only
  `audit_log`) and this ADR's Layer 2 service-layer convention compose:
  0008 makes the row permanent once written; 0009 specifies what the
  row contains when an UPDATE writes it.
- **`docs/03_architecture/phase_simplifications.md`** — Simplification
  1 (synchronous audit log) is the constraint that makes the `SELECT`
  → `UPDATE` → audit triple non-atomic across HTTP round-trips; the
  Phase 2 events-projection correction is what this ADR's "Phase 2
  evolution" paragraph references as the closing of both orphan
  windows.
- **`docs/07_governance/friction-journal.md`** — Phase A subsection A
  (around line 4912), "Drafter-side Spec-to-Implementation Verification
  failure (Prompt 3 `before_state` convention) — 2026-04-21." The
  framing-correction record; the canonical datapoint behind this ADR's
  Context paragraph on the correction.
- **ADR-0001** (`0001-reversal-semantics.md`) — reference for ADR
  voice, depth, and Alternatives Considered shape. This ADR follows
  0001's register: prose-heavy, bullets only for the rule enumeration
  and alternatives list, honest about what the convention does and
  does not guarantee.
