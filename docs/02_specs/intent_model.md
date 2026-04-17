# Intent Model

The canonical shapes for user intents and proposed mutations.
This file answers "what objects flow between entry points and the
engine?" The companion files `agent_autonomy_model.md` and
`mutation_lifecycle.md` answer "what governance applies?" and
"what states does a mutation pass through?"

**Source:** design-sprint decisions captured in
`docs/07_governance/friction-journal.md` (entry dated 2026-04-16).

**Scope.** This file defines the `Intent` discriminated union, the
`ProposedMutation` internal object, the Four Questions grammar,
and the Logic Receipt specification. It does not define
enforcement — enforcement is either in `ledger_truth_model.md`
(Layers 1–2) or reserved in `agent_autonomy_model.md` (Layer 4
governance).

**The spec-without-enforcement rule applies.** Reserved INV-IDs
are listed in §7 for future registration.

**Cross-references:**
- Agent autonomy model: `docs/02_specs/agent_autonomy_model.md`
- Mutation lifecycle: `docs/02_specs/mutation_lifecycle.md`
- Existing canvas directive type:
  `src/shared/types/canvasDirective.ts`
- Existing canvas context type:
  `src/shared/types/canvasContext.ts`
- Existing ProposedEntryCard type:
  `src/shared/types/proposedEntryCard.ts`
- Phase 2 interaction model extraction:
  `docs/09_briefs/phase-2/interaction_model_extraction.md`
- Ledger truth model: `docs/02_specs/ledger_truth_model.md`

---

## The Three Intents

Every entry point in The Bridge produces one of three intent types.
No entry point has bespoke routing — chat, palette, Mainframe,
form, import all converge on the same three shapes. The intent
handlers are singular and shared.

### Navigation Intent

Produces a `CanvasDirective` (existing type at
`src/shared/types/canvasDirective.ts`). The canvas renders the
directed view; the chat transcript is unaffected.

**Examples:**
- User clicks the Mainframe "Chart of Accounts" icon.
- Chat agent responds to "show me the P&L" with a
  `{ type: 'report_pl', orgId, periodId }` directive.
- Palette user types "go to journal entries."

### Mutation Intent

Produces a `ProposedMutation` (§3). The mutation enters the
lifecycle (see `docs/02_specs/mutation_lifecycle.md`) and flows
through the policy decision tree
(`docs/02_specs/agent_autonomy_model.md` §7) before any ledger
write.

**Examples:**
- User fills in the journal entry form and submits.
- Agent drafts an invoice from a natural-language utterance.
- Controller uses the palette to reclassify 14 transactions.

### Query Intent

Produces a transient canvas view or an in-chat structured response.
No ledger mutation. No lifecycle state.

**Examples:**
- "Show me Amazon spend over $500 last July" → transient canvas
  table.
- "What's my cash position?" → in-chat structured answer with
  amounts rendered from service output.

### The Canonical Rule

No entry path has bespoke routing. Chat, palette, Mainframe, form,
and file import all produce one of the three intents. The intent
handlers are singular and shared across all paths. When a new entry
path is added (e.g., a mobile app, a CLI, an API-only client), it
produces the same `Intent` objects and the same handlers consume
them.

---

## The ProposedMutation Type

The canonical internal object for every ledger-touching change.
Every confirmation surface renders from a `ProposedMutation`.
Every audit record for an agent-attributed entry stores one.

> **Conflict 2 reconciliation.** The Phase 2 brief
> `docs/09_briefs/phase-2/interaction_model_extraction.md`
> defines a `Proposal` primitive with `{ id, type, payload,
> status, created_by }`. `ProposedMutation` is the full internal
> representation; `Proposal` is the API-level projection that
> external consumers see. The Phase 2 brief stands as written —
> Phase 2 work will reconcile the two surfaces. This spec does
> not rewrite the Phase 2 brief.

> **Conflict 3 reconciliation.** The Phase 1.1 type
> `src/shared/types/proposedEntryCard.ts` has a `confidence`
> field that is currently rendered. `ProposedMutation` supersedes
> `ProposedEntryCard` as the canonical internal object.
> `ProposedEntryCard` becomes a display-only rendering of a
> subset of `ProposedMutation` fields. The `confidence` field
> on the rendered card goes dark (internal-only) when
> `ProposedMutation` lands. See `agent_autonomy_model.md` §8
> for the full migration plan.

### Shape

```typescript
type ProposedMutation = {
  id: string;                        // UUID
  type: MutationType;                // 'journal_entry' | 'reversal' | 'bill' | ...

  delta: {
    before_state: Record<string, unknown> | null;
    after_state: Record<string, unknown>;
    affected_accounts: string[];     // account_id[]
    amounts: {
      total_debit: string;           // MoneyAmount
      total_credit: string;          // MoneyAmount
      currency: string;              // ISO 4217
    };
  };

  justification: {
    rule_id: string | null;          // null = novel pattern
    input_features: Record<string, unknown>;
    historical_match_count: number;
    confidence_score: number;        // INTERNAL ONLY — never surfaced
    source_transactions: string[];   // FK references to source data
    user_utterance: string | null;   // verbatim chat input; null if not chat-originated
  };

  policy_evaluation: {
    ladder_rung: 'always_confirm' | 'notify_auto_post' | 'silent_auto';
    amount_limits_applied: {
      per_transaction_limit: string; // MoneyAmount
      per_day_aggregate_remaining: string;
    };
    ceiling_flags: string[];         // e.g. ['intercompany', 'equity']
    required_action: 'approve' | 'auto-post' | 'block' | 'escalate';
  };

  lifecycle_state: string;           // see mutation_lifecycle.md
  created_at: string;                // ISO 8601
  created_by: string;                // user_id or 'agent'
};
```

### Field-Level Rules

**`justification.confidence_score`** is internal-only and is
**never** included in any API response returned to a client, any
UI rendering, or any export format. The user-facing equivalent
is `policy_evaluation.required_action` + the legible reason
template. See `agent_autonomy_model.md` Principle 2.

**`justification.user_utterance`** preserves the user's chat
input verbatim when the mutation originated from a chat message.
It is `null` when the mutation originated from a form submission,
file import, or palette action. The utterance is stored for audit
reproducibility — given the same utterance, rule version, and
historical context, the same `ProposedMutation` should be
producible.

**`justification.rule_id`** is `null` for novel patterns. Novel
patterns route to human approval immediately — they skip the
autonomy decision tree entirely (see `agent_autonomy_model.md`
§7).

**`policy_evaluation.required_action`** is the field that produces
the user-facing outcome language. Its four values:
- `approve` — requires human approval (the default for Always
  Confirm, limit violations, ceiling hits, novel patterns).
- `auto-post` — the agent may post autonomously (Notify &
  Auto-Post or Silent Auto, within limits, clean track record).
- `block` — the mutation is categorically blocked (e.g., posting
  to a locked period — this is caught by Layer 1/2 enforcement
  and surfaced as a `ServiceError`).
- `escalate` — the mutation needs attention from a higher
  authority than the current user (Phase 2 routing).

---

## The Intent Type

A discriminated union with three variants:

```typescript
type Intent =
  | { type: 'navigation'; directive: CanvasDirective }
  | { type: 'mutation'; mutation: ProposedMutation }
  | { type: 'query'; query: QuerySpec };
```

`CanvasDirective` is the existing type at
`src/shared/types/canvasDirective.ts`.

`QuerySpec` is reserved as a Phase 2 shape to be defined when
query intents are built. Phase 1.2 query intents produce
transient canvas views using existing `CanvasDirective` variants
(e.g., `report_pl`) — the `QuerySpec` extraction happens when
the Phase 2 interaction model extraction separates queries from
navigation.

### Entry-Point Contracts

| Entry point | Intent types produced |
|---|---|
| Mainframe click | Navigation only |
| Chat message | Any of the three (agent decides based on utterance) |
| Command Palette | Any of the three (palette layer routes based on prefix/context) |
| Form submit | Mutation (always) |
| File import | Mutation (typically bulk — one `ProposedMutation` per imported row) |

---

## The Four Questions Grammar

Defined here once, canonically. Every confirmation surface in The
Bridge answers these four questions, in this order, in the same
visual position. This is a product-wide UI contract, not a
component.

### 1. What changed?

The delta. Rendered from `ProposedMutation.delta`. Shows the
before/after state, the affected accounts, and the amounts. For
a journal entry, this is the debit/credit line table. For a
reversal, this is the original entry alongside the mirrored
reversal.

### 2. Why?

The rule that matched, or "novel pattern — no rule." Rendered
from `ProposedMutation.justification.rule_id`. When `rule_id` is
non-null, the UI shows the rule's human-readable name and a
one-line description of the pattern. When `rule_id` is null, the
UI shows "Novel pattern — the agent has not seen this transaction
type before."

### 3. Track record?

Rendered from `ProposedMutation.justification.
historical_match_count` and the rule's recent approval rate.

- When `rule_id` is non-null: "This rule has been right N of M
  times (X% approval rate over the last 30 days)."
- When `rule_id` is null: "First time doing this."

### 4. What if I reject?

Explicit consequence language. Rendered from a template keyed on
`ProposedMutation.type`. Examples:

- Journal entry rejection: "The entry will not be posted. You can
  edit and resubmit, or discard."
- Reversal rejection: "The original entry remains on the ledger."
- Bulk import rejection: "N entries will not be imported. You can
  review individually."

**The contract applies everywhere.** Every confirmation surface —
single-mutation card, bulk approve dialog, promotion ceremony,
reversal form, period close confirmation — uses this grammar in
this order. No confirmation surface may omit a question or
reorder the sequence.

---

## Logic Receipts

The immutable audit artifact derived from `ProposedMutation.
justification`. A Logic Receipt is what an auditor reads when
they ask "why did the system do this?"

### Rules

1. **No raw LLM reasoning is stored in Logic Receipts.** The
   justification tuple is structured data: rule_id, input
   features, historical match count, source transactions. The
   LLM's chain-of-thought, internal deliberation, or
   intermediate reasoning steps are never persisted anywhere in
   the system.

2. **English explanations in the UI are templated from the
   structured tuple**, not taken from model output. The
   reasoning text on a confirmation card is
   `messages/{locale}.json` template + `justification` fields,
   never a raw Claude response.

3. **Logic Receipts are exportable** as CSV and JSON for auditor
   consumption. The export format includes a schema version so
   downstream tools can handle format evolution.

4. **Logic Receipts are reproducible.** Given the same rule
   version, input features, and historical context at the time
   of the action, a Logic Receipt can be re-computed byte-for-
   byte. This is the auditability guarantee: the receipt is not
   a black box, it is a deterministic function of its inputs.

Logic Receipts piggyback on the existing `audit_log` write path
(INV-AUDIT-001 in `ledger_truth_model.md`). The
`audit_log.before_state` column carries the Logic Receipt as
structured JSON alongside the mutation's before/after state.

---

## Reserved INV-IDs

Per the spec-without-enforcement rule, these are **not** added to
`docs/02_specs/invariants.md` or `docs/06_audit/control_matrix.md`.

### INV-INTENT-001 — ProposedMutation completeness

Every ledger-touching mutation path produces a `ProposedMutation`
object with all required fields populated. No mutation reaches
the service layer without a complete `ProposedMutation`.

**Layer:** Layer 2 (Zod schema validation at the service
boundary). To be registered when the Zod schema for
`ProposedMutation` lands in Phase 1.2 or Phase 2.

### INV-INTENT-002 — Confidence score is never API-surfaced

The `justification.confidence_score` field is never included in
any API response returned to a client. API projections of
`ProposedMutation` (including the Phase 2 `Proposal` primitive)
strip this field.

**Layer:** Layer 2 (API response serialization). To be registered
when the API surfaces for proposals land.

### INV-INTENT-003 — User utterance verbatim preservation

`user_utterance` on `ProposedMutation` stores the original chat
input verbatim, never a paraphrase or summary. This is the
audit-reproducibility contract: the same input must produce the
same Logic Receipt.

**Layer:** Layer 2 (service enforcement). To be registered when
chat-originated mutations land in Phase 1.2.
