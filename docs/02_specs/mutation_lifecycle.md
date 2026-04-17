# Mutation Lifecycle

The states a proposed mutation passes through from creation to
finalization. This file answers "where is this mutation right now,
and what can happen to it next?" The companion files
`agent_autonomy_model.md` and `intent_model.md` answer "what
governance applies?" and "what shape does the mutation have?"

**Source:** design-sprint decisions captured in
`docs/07_governance/friction-journal.md` (entry dated 2026-04-16).

**Scope.** This file defines the six canonical lifecycle states,
the allowed transitions between them, the triggers that elevate
mutations to Needs Attention, and the timing rules. It does not
define enforcement — enforcement for lifecycle transitions will
live at Layer 2 (service enforcement) when implemented.

**The spec-without-enforcement rule applies.** Reserved INV-IDs
are listed in §7.

**Cross-references:**
- Agent autonomy model: `docs/02_specs/agent_autonomy_model.md`
- Intent model: `docs/02_specs/intent_model.md`
- Ledger truth model: `docs/02_specs/ledger_truth_model.md`
- ADR-001 (reversal semantics):
  `docs/07_governance/adr/0001-reversal-semantics.md`
- Phase 1.2 agent architecture:
  `docs/09_briefs/phase-1.2/agent_architecture.md`

---

## States

Six canonical states. Every `ProposedMutation` has a non-null
`lifecycle_state` at all times.

### Pending

Created, not yet reviewed. The default initial state for any
mutation requiring human approval (policy decision tree step 2
routes to human approval, or steps 1/3/5 fail). The mutation is
visible to the user in the Lifecycle View (§5) but has no urgency
signal.

### Needs Attention

Elevated from Pending due to a trigger condition (§4). This is the
"noisy state" — the one that surfaces in the controller's
Lifecycle View badge count and that the controller acts on during
month-end close. Every mutation in Needs Attention has a reason
attached (the trigger that elevated it).

### Approved

Human-approved, not yet posted to the ledger. This is a
**transient state** — typically milliseconds between the user
clicking Approve and the service completing the ledger write.
The state exists so the transition is auditable: the audit log
records the Approved transition with the approver's user_id and
timestamp before the Posted transition fires.

### Posted (auto)

Written to the ledger by the agent (Notify & Auto-Post or Silent
Auto rung), currently within the **24-hour reversible window**.
Visible in the ledger as a normal entry with a "recently
auto-posted" pill in the UI. During this window, any controller
can undo the posting with one click — the undo creates a reversal
entry per ADR-001 reversal semantics (not a database DELETE).

### Posted (manual)

Written to the ledger by a human via form submission or manual
approval. No reversible-window pill — manual postings finalize
immediately. The append-only ledger rule from
`ledger_truth_model.md` applies: corrections are made via reversal
entries, not updates or deletes.

### Finalized

Past the 24-hour reversible window (for auto-posted), or in a
closed period, or manually posted. Standard ledger state. No undo
path beyond formal reversal (see ADR-001). This is the terminal
state for successful mutations.

---

## Transitions

| From | To | Who |
|---|---|---|
| *(none)* | Pending | Any mutation initiator (agent, user, import) |
| Pending | Needs Attention | System (automatic elevation per §4 triggers) |
| Pending | Approved | User with appropriate role |
| Pending | Rejected | User with appropriate role |
| Needs Attention | Approved | User with appropriate role |
| Needs Attention | Rejected | User with appropriate role |
| Approved | Posted (manual) | System (immediate ledger write after human approval) |
| Approved | Posted (auto) | System (immediate ledger write after auto-post policy pass) |
| Posted (auto) | Finalized | System (24 hours elapsed) |
| Posted (auto) | Rejected-with-reversal | Any controller (click undo within 24h window) |
| Posted (manual) | Finalized | System (immediate — no reversible window) |

**Rejected** and **Rejected-with-reversal** are terminal states.
A rejected mutation can be re-submitted as a new `ProposedMutation`
(new ID, new lifecycle) but the original is immutable.

**Rejected-with-reversal** creates a reversal entry in the ledger
and transitions the original `Posted (auto)` entry to this
terminal state. The reversal entry itself follows normal reversal
semantics (INV-REVERSAL-001, INV-REVERSAL-002).

---

## Needs Attention: Triggers

A Pending mutation is elevated to Needs Attention when any of the
following conditions is detected. Multiple triggers can fire on
the same mutation; the mutation carries the full list of active
triggers.

| # | Trigger | Reason text |
|---|---|---|
| 1 | Per-transaction limit violation | "Amount $X exceeds rule's $Y limit" |
| 2 | Per-day aggregate limit hit | "Per-day aggregate limit reached" |
| 3 | Category ceiling flagged | "Intercompany / equity / period-end / etc." |
| 4 | Novel pattern (no matching rule) | "No matching rule in institutional memory" |
| 5 | Reversible window expiring in < 2 hours | "Auto-posted entry reversible window expiring soon" |
| 6 | Recent demotion of the matched rule | "Rule was recently demoted; manual review required" |

Every trigger is logged in the audit trail with the mutation ID,
the trigger type, and the reason text.

**Trigger 5** applies only to mutations in the Posted (auto) state
that have not yet been reviewed by a controller. It is a
courtesy elevation — the mutation is already posted, but the
controller is reminded before the undo window closes.

---

## The Lifecycle View

A persistent UI surface showing mutation state counts and a
drill-down list. Commitment: one persistent location in the app
chrome, not buried in a queue or hidden behind navigation.

**Placement options** (final placement for Phase 1.2 UI work):
- Top chrome of the app, alongside the period indicator and org
  switcher (badge with Needs Attention count).
- A dedicated Mainframe item labeled "Activity."

Either placement ensures the controller always sees the count
without navigating to it.

### Layout

- **State counts** at the top: Pending, Needs Attention
  (emphasized — larger number, amber background), Approved,
  Posted (auto within window), Finalized (collapsed).
- **Filters**: by state, by rule, by date range.
- **Click-through** to a list of mutations in the selected state.

### Prioritization within Needs Attention

When a controller opens the Needs Attention list, mutations are
sorted by priority:

1. **Ceiling flags** — the highest urgency; these are mutations
   the agent should not have attempted to auto-post.
2. **Expiring windows** — mutations whose 24-hour undo window
   is closing soon.
3. **Limit violations** — mutations that exceeded a rule's
   per-transaction limit.
4. **Novel patterns** — new patterns the agent has never seen.

This is the order a controller should handle them during close.
Within each priority tier, mutations are sorted by creation time
(oldest first).

---

## Timing Rules

### Reversible window

24 hours from the moment a mutation enters Posted (auto). Not
user-configurable in v1. After 24 hours, the mutation
automatically transitions to Finalized.

The 24-hour window is measured by the system clock at the server
layer, not by the user's local time. The transition to Finalized
is triggered by the first read or write that touches the mutation
after the window elapses — there is no background cron in Phase 1
(per the locked-in stack: no pg-boss in Phase 1). Phase 2
introduces a scheduled job for timely finalization.

### Agent session TTL

30 days (Q15 default in `docs/02_specs/open_questions.md`).
Sessions older than 30 days are eligible for cleanup. This is
orthogonal to the mutation lifecycle — a mutation's state does
not depend on the session that created it.

### Needs Attention elevation

Automatic, immediate. The elevation happens on write — when a
mutation is created or when a condition changes (e.g., the
per-day aggregate crosses the limit mid-batch). No batch job.
No polling interval. The mutation's state reflects reality at
every read.

### Batch close behavior

At period close, all Pending and Needs Attention mutations for
that period must be resolved (approved or rejected). Unresolved
mutations block period close.

This becomes a `PERIOD_CLOSE_BLOCKED_BY_PENDING` ServiceError
(reserved for Phase 2 when the period-close flow is built). The
close UI surfaces the count and links to the Lifecycle View
filtered to the target period.

---

## Reserved INV-IDs

Per the spec-without-enforcement rule, these are **not** added to
`docs/02_specs/invariants.md` or `docs/06_audit/control_matrix.md`.

### INV-LIFECYCLE-001 — Lifecycle state is always non-null

Every `ProposedMutation` has a non-null `lifecycle_state` at all
times. The state transitions defined in §3 are enforced at the
service layer — no mutation can skip a state or transition to an
invalid target.

**Layer:** Layer 2 (service enforcement). To be registered when
lifecycle state management lands in the mutation service.

### INV-LIFECYCLE-002 — Period close blocked by pending mutations

Period close is blocked while mutations for that period remain in
Pending or Needs Attention. The controller must resolve every
outstanding mutation before the period can be locked.

**Layer:** Layer 2 (service enforcement — the period-lock service
function checks for unresolved mutations). To be registered when
the period-close flow lands in Phase 2.
