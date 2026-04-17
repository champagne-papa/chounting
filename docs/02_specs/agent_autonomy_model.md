# Agent Autonomy Model

The rules that govern agent autonomy: when the agent may act
independently, how trust is earned and revoked, what limits apply
to autonomous actions, and what can never be autonomous. This file
answers "what controls the agent?" The companion file
`docs/02_specs/ledger_truth_model.md` answers "what controls the
ledger?"

**Source:** design-sprint decisions captured in
`docs/07_governance/friction-journal.md` (entry dated 2026-04-16,
"Agent Autonomy Design Sprint"). Open questions Q23–Q26 in
`docs/02_specs/open_questions.md` carry the four working defaults
referenced throughout.

**Scope.** This file documents the agent autonomy policy — the
governance layer that sits at Layer 4 of the authority gradient.
It does not document the engine (Layers 1–2, which live in
`ledger_truth_model.md`), the agent's internal mechanics
(Phase 1.2-specific, which live in
`docs/09_briefs/phase-1.2/agent_architecture.md`), or the
interaction model extraction (Phase 2, which lives in
`docs/09_briefs/phase-2/interaction_model_extraction.md`). This
spec documents what is durable across phases: the trust model,
the limit model, and the system vs. policy boundary.

**The spec-without-enforcement rule applies.** No invariants are
registered in `docs/02_specs/invariants.md` or
`docs/06_audit/control_matrix.md` from this file. Reserved INV-IDs
are listed in §10 for future registration when enforcement lands.
Per `docs/02_specs/README.md`: an invariant only appears in the
index if it has enforcement in code today.

**Cross-references:**
- Product thesis: `docs/00_product/product_vision.md`
- Ledger truth model: `docs/02_specs/ledger_truth_model.md`
- Intent model: `docs/02_specs/intent_model.md`
- Mutation lifecycle: `docs/02_specs/mutation_lifecycle.md`
- Phase 1.2 agent architecture:
  `docs/09_briefs/phase-1.2/agent_architecture.md`
- Phase 2 interaction model extraction:
  `docs/09_briefs/phase-2/interaction_model_extraction.md`
- Agent interface (durable patterns):
  `docs/03_architecture/agent_interface.md`
- UI architecture:
  `docs/03_architecture/ui_architecture.md`

---

## The Authority Gradient Extended (Layer 4 Governance)

The product thesis in `docs/00_product/product_vision.md` states:

> **This system is not an accounting UI with AI assistance. It is a
> deterministic financial engine with a probabilistic interface.**
>
> Agents interpret intent and propose actions. Services execute
> domain logic deterministically. The database enforces invariants
> absolutely. Authority flows down; structured errors flow up.

The design sprint extends this with a sharpening of the interface
half:

> **The product is not the AI. The product is the control surface
> over the AI.**

The agent is a managed actor in a trust system. The control
surface — the autonomy model, the limits, the promotion
ceremonies, the demotion paths, the audit artifacts — is the
product. The LLM underneath is an implementation detail that could
be replaced; the governance layer is what the controller trusts
and the auditor audits.

### Where this spec sits in the gradient

This spec lives at **Layer 4 — Cognitive Truth**. Per
`ledger_truth_model.md`, Layer 4 has zero enforcement invariants
by design. Agents are allowed to be wrong because lower layers
catch mistakes before they touch the ledger.

Layer 4 governance is nonetheless load-bearing. Every autonomy
decision in this spec produces a downstream enforcement action at
Layer 2 (service calls through `withInvariants`, authorization
via `canUserPerformAction`) or Layer 1 (schema constraints, CHECK
constraints, triggers). The governance layer does not enforce
rules itself — it *produces* the Layer 2/1 rules that enforce.

The distinction matters: a Layer 4 governance failure (e.g., a
rule that should be demoted is not) produces a correctness
problem that the confirmation-first model catches. A Layer 1/2
enforcement failure (e.g., a deferred constraint disabled)
produces a ledger corruption that nothing catches. The governance
layer operates under the assumption that enforcement below it is
absolute. See the "lower-wins rule" in `ledger_truth_model.md`.

### The Four Questions

Every confirmation surface in The Bridge — single-mutation card,
bulk approve dialog, promotion ceremony, reversal form — answers
four questions, in this order, in the same visual position:

1. **What changed?** — the delta.
2. **Why?** — the rule that matched, or "novel pattern — no rule."
3. **Track record?** — this rule has been right N of M times, or
   "first time doing this."
4. **What if I reject?** — explicit consequence language.

This is the audit grammar of the confirmation-first model. It is
formally defined in `docs/02_specs/intent_model.md` §5. Every
implementation of a confirmation surface must render these four
answers from `ProposedMutation` fields — never from free-form
model text.

---

## Principles

### 1. The Bookkeeper Analogy

Trust in The Bridge works the way trust works in a real accounting
department. An AP specialist has a $1,500 signing limit: she
handles invoices under that amount independently, and anything
above it goes to the controller for approval. A senior bookkeeper
earns independence on vendor categorization after demonstrating
competence on a few dozen entries — but certain tasks (wire
transfers, period-end adjustments, equity journal entries) stay
under controller oversight no matter how long the bookkeeper has
been on the job.

The agent inherits this model exactly. Trust is:
- **Scoped** — earned per rule, not globally.
- **Revocable** — any controller can demote a rule at any time.
- **Earned per-task** — the agent demonstrates competence on a
  specific pattern before earning autonomy on it.
- **Never uncappable on sensitive classes** — intercompany
  entries, equity postings, and reversals cannot be auto-posted
  regardless of the agent's track record.

This analogy is the product mental model. When a controller asks
"how much can the agent do on its own?" the answer is the same
shape as "how much can your AP specialist do on her own?" — a
list of rules with limits, not a global toggle.

### 2. Confidence Is a Policy Input, Not a UI Hint

Raw confidence scores (the model's self-assessed probability that
its proposed action is correct) are never displayed to users. The
user never sees "Confidence: 87%."

What the user sees is the **policy outcome** with a legible
reason: "Requires your approval: $1,800 exceeds this rule's
$1,500 limit." The policy outcome is derived from the decision
tree (§7), which uses confidence internally as one of many inputs
to rung assignment and track-record assessment — but the user-
facing language is always the policy decision, not the raw score.

This is a deliberate design decision (Q23, Q25 in
`docs/02_specs/open_questions.md`). Displaying raw confidence
invites calibration debates ("why did it say 87% and not 92%?")
that are unanswerable and counterproductive. Policy outcomes are
actionable: either the agent can act, or the user must approve,
and the reason is stated in terms the user can evaluate.

### 3. Trust Is Scoped and Revocable

Trust attaches to **rules**, not to the agent globally. A rule is
a learned pattern the agent has matched (e.g., "Amazon invoices
under $500 → debit Office Supplies, credit Accounts Payable").
Each rule has its own rung on the Agent Ladder (§4), its own
per-transaction limit, and its own track record.

Promotion and demotion happen per-rule. Promoting rule X from
Always Confirm to Notify & Auto-Post does not affect rule Y.
Demoting rule X back to Always Confirm is immediate and does not
require a ceremony. A rule's rung can be changed in either
direction at any time by the right authority (controller for
promotion to Notify & Auto-Post; owner for promotion to Silent
Auto; any controller for demotion).

### 4. Authority Never Flows Upward

The authority gradient is absolute at Layer 4:

- **Agents propose.** They produce `ProposedMutation` objects
  (see `docs/02_specs/intent_model.md` §3).
- **Services decide.** They execute via `withInvariants` and
  `canUserPerformAction` at Layer 2.
- **The database enforces.** CHECK constraints, triggers, RLS
  policies at Layer 1.

No Layer 4 governance decision can override a Layer 2 or Layer 1
enforcement. If the autonomy model says "auto-post" but the
service layer says "period locked," the service layer wins. If
the service layer says "post" but the database says "unbalanced,"
the database wins. This is the lower-wins rule from
`ledger_truth_model.md`, applied to Layer 4.

---

## The Agent Ladder

Three rungs. The canonical names are from
`docs/09_briefs/phase-1.2/agent_architecture.md`, which is
closer to code and predates this spec. The design-sprint informal
vocabulary (probationary / auto-with-notification / silent auto)
is recorded here once for traceability; this spec uses the
canonical names exclusively hereafter.

### Rung 1: Always Confirm

Every match requires human approval before any ledger write. This
is the default rung for all new rules. In Phase 1.2, every
mutating action is Always Confirm — the Phase 1.2 brief's
autonomy table specifies this explicitly.

The agent produces a `ProposedMutation`, the UI renders a
confirmation card using the Four Questions grammar, and the user
approves or rejects. No ledger write occurs until the user clicks
Approve.

### Rung 2: Notify & Auto-Post

The agent posts the entry to the ledger without waiting for human
approval. The entry enters a **24-hour reversible review window**
(see `docs/02_specs/mutation_lifecycle.md` — the "Posted (auto)"
state). During this window, any controller can undo the posting
with one click, which creates a reversal entry (per ADR-001
reversal semantics).

After 24 hours, the entry transitions to Finalized and is subject
to the same append-only rules as any other ledger entry.

**Promotion to Notify & Auto-Post** requires:
- A **promotion ceremony** (see §4.1 below).
- The promoting user must be a **controller** in the org.
- The rule must meet the **promotion thresholds** (see §4.2).

### Rung 3: Silent Auto

The agent posts the entry without notification. Reserved for the
lowest-risk, highest-confidence patterns — the accounting
equivalent of a direct-deposit payroll entry that has been the
same amount to the same accounts for 24 consecutive months.

**Promotion to Silent Auto** requires:
- A promotion ceremony (same as Notify & Auto-Post).
- The promoting user must be the **org owner** (not just any
  controller).
- Hard ceilings still apply regardless of rung (§6).

### 4.1 The Promotion Ceremony

Promotion is a **modal flow**, not a banner click:

1. Controller opens the Agent Policies canvas view (§8).
2. Selects a rule eligible for promotion (surfaced via the Agency
   Health view per Q26 — passive prompting, not chat).
3. The modal shows:
   - The last N matches for this rule (sampled, not exhaustive).
   - The maximum transaction amount observed.
   - A preview of impact: "Over the coming period, this would
     auto-post an estimated X entries totaling $Y."
4. Controller names the rule being promoted and confirms.
5. For Silent Auto promotion: the flow requires a second
   confirmation from the org owner (Q24 default —
   controller-proposes / owner-approves).

The ceremony exists to make promotion a deliberate act, not a
configuration drift. The controller is reviewing evidence and
making a judgment call — the same judgment an accounting manager
makes when expanding a subordinate's authority.

### 4.2 Promotion Thresholds

System-fixed for v1 (Q23 default):

| Threshold | Value |
|---|---|
| Minimum matches | ≥ 15 |
| Minimum approval rate | ≥ 95% |
| Evaluation window | 30 days |

A rule is eligible for promotion when all three thresholds are
met simultaneously. The thresholds are not user-configurable in
v1; they are logged per promotion decision so they can be tuned
in Phase 2 after observing real promotion behavior across
multiple orgs.

### 4.3 Demotion ("Re-Probate")

One click from any agent-attributed entry. Demotes the rule back
to Always Confirm immediately. No ceremony — demotion is
asymmetric by design. The cost of unearned trust is higher than
the cost of re-earning it.

Any controller in the org can demote any rule at any time. The
demotion is effective immediately: the next match for that rule
routes to human approval regardless of in-flight batches.

---

## Limit Model

Four dimensions. Rung decides **whether** the agent acts alone;
limits decide **how much**. The two are independent controls
composed together — a rule on Notify & Auto-Post with a
$500 per-transaction limit will auto-post a $420 entry but route
a $600 entry to human approval, even though the rung permits
autonomy.

### 5.1 Per-Transaction Amount

The maximum value a single entry can have to be eligible for
auto-post under a given rule. Set at promotion time; adjustable
later by the limit-change authorization process (§5.4).

Each rule has its own per-transaction limit. Different rules have
different risk profiles: a recurring office-supplies vendor might
have a $1,500 limit while a new construction contractor has $500.

### 5.2 Per-Day Aggregate

The maximum total value the agent can auto-post across **all
rules** per calendar day for a given org. This is a volume-abuse
prevention: even if 20 individual rules each have $1,500 limits,
the org's per-day aggregate might be $10,000 — preventing a
scenario where the agent auto-posts $30,000 in a single day
without human oversight.

**Mid-batch behavior: queue-remaining.** If the agent hits the
per-day aggregate during a batch of proposed entries, it
auto-posts what fits under the remaining aggregate and queues the
rest for human review with the reason "Per-day aggregate limit
reached." It does not stop-and-ask mid-batch. It does not
re-rank entries by priority. The first-in-first-out principle
applies: entries are processed in order, and the aggregate
acts as a hard cap.

### 5.3 Per-Rule Scope

Each rule has its own per-transaction limit. The limits table
in the Agent Policies view (§8) shows every rule's limit. Rules
can have different limits reflecting their risk profiles.

### 5.4 Category Hard Ceilings

Schema-enforced, non-configurable. Not a limit setting — a
hard-coded list of transaction classes that **can never auto-post**
regardless of rung, limit, or rule maturity.

The ceiling list (see §6 System boundary) includes: intercompany
entries, period-end adjustments, equity account postings,
reversals, postings to locked periods, and first-time vendors
above a floor amount.

These are not limits that can be raised. They are walls.

### 5.5 Limit-Change Authorization

Per Q24 default: **controller-proposes, owner-approves.**

1. Controller proposes a limit change (per-transaction on a rule,
   or per-day aggregate for the org).
2. The UI shows the Limit Change Preview (§8): what the change
   would have done over the last 90 days.
3. Owner approves or rejects.
4. Every limit change is audited with: proposer, approver, old
   value, new value, preview data snapshot, timestamp.

The friction is the feature. Limit changes are security-sensitive
in a family-office context — the extra approval step is low-cost
at this user count and high-value for auditability.

---

## System vs. Policy Boundary

### System (non-negotiable, schema-enforced)

Transaction classes that can **never** be auto-posted by the
agent, regardless of rung, limit, or rule maturity.

| # | Class | Status | Enforcement |
|---|---|---|---|
| 1 | Posting to a locked period | **Already enforced** | INV-LEDGER-002 — trigger `enforce_period_not_locked` |
| 2 | Reversal entries | **Already enforced** | INV-REVERSAL-001 (mirror check) + INV-REVERSAL-002 (reason CHECK) |
| 3 | Intercompany entries | **Reserved** | Becomes INV-AGENT-001 partial — ceiling check in agent orchestrator |
| 4 | Period-end adjustments | **Reserved** | Becomes INV-AGENT-001 partial — ceiling check on `entry_type = 'adjusting'` |
| 5 | Equity account postings | **Reserved** | Becomes INV-AGENT-001 partial — ceiling check on `account_type = 'equity'` |
| 6 | First-time vendors above floor | **Reserved** | Becomes INV-AGENT-001 partial — ceiling check on vendor match |

Items 1–2 are already enforced at Layer 1 by existing invariants.
Items 3–6 are reserved enforcement points that will become part
of INV-AGENT-001 when the agent orchestrator's ceiling check
lands (Phase 1.2 partial, Phase 2 full).

The system boundary is not configurable. An owner cannot remove
intercompany entries from the ceiling list. The ceiling list can
only be extended (by adding new classes in a migration), never
contracted.

### Policy (org-configurable by owner)

| # | Policy lever | Default | Who changes it |
|---|---|---|---|
| 1 | Per-transaction limit per rule | Set at promotion time | Controller proposes, owner approves (Q24) |
| 2 | Per-day aggregate limit | Org-level, set by owner | Owner directly |
| 3 | Which rules are on which rung | Progression rules (§4) | Controller (rung 2), owner (rung 3) |
| 4 | Promotion thresholds | System-fixed for v1 | Not configurable in v1 (Q23) |

Every policy change is audited. The audit row includes the old
value, the new value, the proposer, the approver (if different),
and a timestamp. See §9.

---

## The Policy Decision Tree

Five steps, evaluated in order for every proposed mutation that
matches a rule. If a mutation does not match any rule (novel
pattern), it routes to human approval immediately — novel
patterns skip the tree entirely.

### Step 1: Category Hard-Ceiling Check

**Check:** Is the proposed mutation in a System ceiling class
(§6)?

- **Pass (not a ceiling class):** continue to step 2.
- **Fail (ceiling class):** route to human approval. Reason:
  the specific ceiling that triggered (e.g., "Intercompany
  entries require human approval"). Regardless of rung, limit,
  or track record.

### Step 2: Rung Check

**Check:** Is the matched rule on an autonomy-granting rung
(Notify & Auto-Post or Silent Auto)?

- **Pass (autonomy rung):** continue to step 3.
- **Fail (Always Confirm):** route to human approval. Reason:
  "Rule is in Always Confirm mode."

### Step 3: Per-Transaction Limit Check

**Check:** Is the transaction amount within the rule's
per-transaction limit?

- **Pass (within limit):** continue to step 4.
- **Fail (exceeds limit):** route to human approval. Reason:
  "Amount $X exceeds this rule's $Y limit."

### Step 4: Per-Day Aggregate Check

**Check:** Does posting this transaction keep the org under the
per-day aggregate limit?

- **Pass (under aggregate):** continue to step 5.
- **Fail (aggregate exceeded):** queue remaining entries for
  human review. Reason: "Per-day aggregate limit reached."
  Notify controller.

### Step 5: Track Record Check

**Check:** Does the rule's recent activity support continued
autonomy? Specifically: no rejections in the last 10 matches,
and no demotion in the last 30 days.

- **Pass:** auto-post. The entry is written to the ledger and
  enters the lifecycle state appropriate for its rung (Posted
  (auto) with 24-hour reversible window for Notify & Auto-Post;
  immediate Posted (auto) → Finalized for Silent Auto).
- **Fail (recent rejection or demotion):** route to human
  approval. Reason: "Rule has recent rejections" or "Rule was
  recently demoted."

**The user never sees a confidence percentage in this tree.**
Confidence feeds step 2 internally — rung assignment depends on
cumulative confidence over the evaluation window — but the
user-facing language is always the policy decision with a legible
reason. See Principle 2 and the policy outcome language in §8.

---

## User-Facing Surface

### Agent Policies Canvas View

A dedicated canvas view launched from the Mainframe. Layout: a
table of every rule the agent has learned for the current org.

| Column | Content |
|---|---|
| Rule name | Human-readable pattern description |
| Current rung | Always Confirm / Notify & Auto-Post / Silent Auto |
| Per-transaction limit | Dollar amount or "N/A" for Always Confirm |
| Last-30-day volume | Count and total dollar value at current limit |
| Last-30-day rejection rate | Percentage; highlighted if > 5% |

**Bulk actions:** promote, demote, adjust limit, re-probate.
Multi-select + apply-to-all for batch operations.

### Limit Change Preview

When a controller proposes a limit change, the UI shows what the
change would have done over the last 90 days:

> "Raising limit from $500 to $1,500 would have auto-posted
> 14 additional entries; 12 of 14 had 100% historical approval."

This is the feature that makes limit changes defensible — no
flying blind. The preview data is computed server-side from
historical match data and snapshotted in the audit record for
the limit change.

### Policy Outcome Language

The user never sees "Confidence: 87%." The user sees the policy
decision in actionable terms. Three canonical phrasings:

1. **Auto-posted:** "Auto-posted per rule *Amazon Office
   Supplies* (amount $420, limit $500, rule track record 47/47)."
2. **Requires approval (limit):** "Requires your approval:
   amount $1,800 exceeds this rule's $1,500 limit."
3. **Requires approval (ceiling):** "Requires your approval:
   this is a first-time vendor; the agent cannot auto-post for
   new vendors above the $500 floor."

All phrasings are templated from `ProposedMutation.
policy_evaluation` fields (see `docs/02_specs/intent_model.md`
§3). The templates are localized via `next-intl` — the agent
never writes English prose for these surfaces.

### Agency Health View

A separate canvas view launched from the Mainframe (Q26 default
— passive prompting, not chat). Shows:

- **Promotion-eligible rules:** rules that meet all three
  thresholds (§4.2) and have not yet been promoted.
- **Demotion candidates:** rules with recent rejection spikes
  (> 10% rejection rate in the last 30 days).
- **Overall audit health:** agent auto-post volume, approval
  rate, ceiling-hit frequency over the last 30/90 days.

This is the calm review surface where the controller grants or
revokes autonomy — not in chat, not in a notification badge,
not in a modal that interrupts other work.

### ProposedEntryCard.confidence Migration

> **Conflict 3 reconciliation.** The Phase 1.1 display-shell
> type `src/shared/types/proposedEntryCard.ts` has a
> `confidence: 'high' | 'medium' | 'low' | 'novel'` field that
> is currently rendered in the Phase 1.1 UI. The design-sprint
> decision is: confidence is a policy input, never displayed.
>
> **Reconciliation plan.** When `ProposedMutation` becomes the
> canonical internal object (Phase 1.2 or Phase 2), the
> `confidence` field on the rendered card becomes internal-only.
> What the user sees becomes the policy outcome rendered from
> `policy_evaluation.required_action` + a legible reason
> template. The Phase 1.1 `ProposedEntryCard` type is a
> display-only shell today; its `confidence` field goes dark
> when `ProposedMutation` lands.
>
> This is a **migration obligation**, not a Phase 1.2 scope
> change. The `proposedEntryCard.ts` file is not edited in this
> session. The Phase 1.2 brief's existing "Confidence Routing"
> section (which says "display only in Phase 1") is superseded
> by the policy-outcome-language approach specified here; the
> brief will be reconciled when Phase 1.2 implementation begins.

---

## Audit Artifacts per Action

Every autonomy event is written via
`src/services/audit/recordMutation.ts` or its successor —
the same audit path as ledger mutations. Cross-reference
INV-AUDIT-001 in `ledger_truth_model.md`.

| Event | Fields logged |
|---|---|
| **Auto-post** | `rule_id`, `amount`, per-transaction limit at time of post, per-day aggregate remaining after post, `input_features`, `historical_match_count`, `trace_id` |
| **Promotion** | `rule_id`, `from_rung`, `to_rung`, `promoter_user_id`, `confirmer_user_id` (if different — Q24 flow), sampled matches reviewed, `timestamp` |
| **Demotion** | `rule_id`, `from_rung`, `to_rung` (always Always Confirm), `demoter_user_id`, triggering `entry_id` (if re-probated from a specific entry), `timestamp` |
| **Limit change** | `rule_id` (or `*` for aggregate), `old_value`, `new_value`, `proposer_user_id`, `approver_user_id`, `preview_data_snapshot`, `timestamp` |
| **Ceiling hit** | `rule_id`, `ceiling_type`, `mutation_type`, `attempted_amount`, `trace_id` |

The **ceiling hit** row records cases where a System ceiling
routed a mutation to human approval. This is useful for audit
("how often does the agent attempt ceiling-class transactions?")
and for tuning ("is the first-time-vendor floor too low?").

---

## Reserved INV-IDs

Per the spec-without-enforcement rule, these are **not** added to
`docs/02_specs/invariants.md` or `docs/06_audit/control_matrix.md`.
They exist only in this file for future registration when
enforcement lands.

### INV-AGENT-001 — No auto-post across System ceilings

No agent-initiated mutation in a System ceiling class (§6) may
be auto-posted, regardless of rung, limit, or rule maturity. The
ceiling check runs in the agent orchestrator before any ledger
write path is entered.

**Layer:** Layer 2 (service enforcement) for the orchestrator
gate; Layer 1 (schema constraint) for transaction classes that
already have CHECK constraints or triggers (locked period,
reversals). To be registered when the ceiling check lands in the
agent orchestrator (Phase 1.2 partial, Phase 2 full).

### INV-AGENT-002 — Every auto-post produces a Logic Receipt

Every autonomous agent posting produces a Logic Receipt —
a structured justification tuple with no raw LLM reasoning. See
`docs/02_specs/intent_model.md` §6 for the Logic Receipt
specification.

**Layer:** Layer 2 (service enforcement — the Logic Receipt is
written as part of the auto-post service call). To be registered
when the Logic Receipt write path lands.

### INV-AGENT-003 — Promotion requires authorized approval

Promotion from Always Confirm to Notify & Auto-Post requires
controller approval. Promotion to Silent Auto requires owner
approval (Q24 default — controller proposes, owner approves).
Every promotion is recorded in the audit log.

**Layer:** Layer 2 (service enforcement via `withInvariants` +
`canUserPerformAction`). To be registered when the promotion
ceremony service function lands.

### INV-AGENT-004 — Limit changes are audited

Every limit change (per-transaction or per-day aggregate) passes
through the controller-proposes / owner-approves flow and is
audited with proposer, approver, old value, new value, and
timestamp.

**Layer:** Layer 2 (service enforcement). To be registered when
the limit change API lands.

### INV-AGENT-005 — Re-probation is immediate and always available

Any controller can demote any rule to Always Confirm from any
agent-attributed entry, effective immediately. No ceremony, no
approval flow — demotion is a safety valve.

**Layer:** Layer 2 (service enforcement). To be registered when
the re-probate action lands.

---

## Summary

### The Three Rungs

| Rung | Behavior | Promotion authority | Default |
|---|---|---|---|
| Always Confirm | Human approves every match | (default — no action) | All rules start here |
| Notify & Auto-Post | Agent posts; 24h reversible window | Controller via ceremony | Phase 1.2: none promoted |
| Silent Auto | Agent posts silently | Owner via ceremony | Lowest-risk patterns only |

### Four Limit Dimensions

| Dimension | Scope | Configurable? |
|---|---|---|
| Per-transaction amount | Per rule | Yes (Q24 flow) |
| Per-day aggregate | Per org | Yes (owner-direct) |
| Per-rule scope | Per rule | Implicit (each rule has its own limit) |
| Category hard ceilings | System-wide | **No** — schema-enforced |

### System vs. Policy

| Category | Configurable | Examples |
|---|---|---|
| **System** | Never | Locked periods, intercompany, equity, reversals, period-end adjustments, first-time vendors above floor |
| **Policy** | By owner | Per-transaction limits, per-day aggregate, rung assignment, promotion criteria (v2+) |

### Decision Tree (compact)

| Step | Check | Pass | Fail |
|---|---|---|---|
| 1 | Ceiling class? | Continue | → Human approval |
| 2 | Autonomy rung? | Continue | → Human approval |
| 3 | Within per-txn limit? | Continue | → Human approval |
| 4 | Under daily aggregate? | Continue | → Queue remaining |
| 5 | Track record clean? | Auto-post | → Human approval |
