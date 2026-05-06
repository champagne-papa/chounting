# Agent Tool Architecture

How an agent message becomes a database mutation. The canonical
call chain — agent → contracts → services → core → db — and the
defenses at each seam.

This doc formalizes the call-chain CTO Handoff v2 §7 names and
extends it with the Zod-defense-in-depth, idempotency, and
audit-emission contracts that already live in
`docs/02_specs/ledger_truth_model.md` and the agent-tool-authoring
skill. Where ADR-0020 (Agent-First Authority-Gradient Source
Architecture) ratifies the *folder layout* that surfaces the
authority gradient, this doc ratifies the *runtime behavior* that
moves a tool call across the layers.

**Canonical sources:**

- `docs/00_product/product_vision.md` — the Thesis ("authority
  flows down; structured errors flow up").
- `docs/03_architecture/authority-gradient.md` — the four-layer
  authority gradient that this call chain traverses.
- `docs/03_architecture/agent_interface.md` — durable,
  phase-agnostic agent contract: one voice, typed tools,
  structured outputs, persona discipline.
- `docs/02_specs/ledger_truth_model.md` — INV-SERVICE-001,
  INV-SERVICE-002, INV-AUTH-001, INV-IDEMPOTENCY-001,
  INV-AUDIT-001.
- `docs/02_specs/agent_autonomy_model.md` — Agent Ladder, limit
  model, System vs Policy boundary.
- `.claude/skills/agent-tool-authoring/SKILL.md` — the six
  anti-hallucination rules.
- `docs/07_governance/CTO_HANDOFF_V2.md` §7 — the call-chain shape
  this doc ratifies.
- `docs/07_governance/adr/0007-three-tier-agent-architecture.md`
  — three-tier agent architecture; Tier 1 commit path discipline.
- `docs/07_governance/adr/0020-agent-first-authority-gradient-source-architecture.md`
  — Appendix A import boundary rules.

## The canonical call chain

Every agent-initiated mutation follows this path. Every layer is
defended; nothing is optional:

```
Agent message (user input → orchestrator)
  ↓
agent/orchestrator/                                ← Layer 3
  resolves persona, session, org context, tool eligibility
  ↓
agent/policies/agent-ladder/                       ← Layer 4 (substrate at v1; enforcement Phase 2+)
  checks whether this rung may invoke the tool at all
  ↓
agent/tools/<capability>/<tool>.tool.ts            ← Layer 3
  validates Zod input (defense layer 1 of 3)
  enforces dry_run-first if mutating
  awaits user approval if Always Confirm
  calls service (with idempotency_key for retries)
  ↓
contracts/agent-tools/<capability>/<tool>.contract.ts   ← contracts boundary
  Zod schema for input + output
  tool and service both compile against this contract
  ↓
services/<area>/<service>.ts                       ← Layer 2
  withInvariants wrapper (INV-SERVICE-001 + INV-AUTH-001)
  Zod re-validation (defense layer 2 of 3)
  adminClient discipline (INV-SERVICE-002)
  authorization (INV-AUTH-001)
  idempotency check (INV-IDEMPOTENCY-001)
  opens transaction
  ↓
core/<area>/<rule>.ts                              ← pure rules
  pure invariant logic (no DB; no network)
  e.g., balanceDebitsAndCredits, isPeriodLocked,
        evidenceMetadataRules, postingRules
  ↓
db/repositories/<entity>Repository.ts              ← Layer 1
  typed persistence call (defense layer 3 of 3:
    DB CHECK constraints + RLS + triggers)
  ↓
services/audit/recordMutation.ts                   ← Layer 2 (same transaction)
  emits audit_log row with before_state /
  after_state / trace_id / idempotency_key
  ↓
[transaction commits]
  ↓
service returns ServiceResult<T>                   ← bubble up
  ↓
tool returns structured output to orchestrator
  ↓
orchestrator emits canvas_directive for the UI
```

## Concrete example: post a journal entry

Same call chain, populated with the concrete file names that
ADR-0020's layout ratifies:

```
User: "Post this approved journal entry."
  ↓
agent/orchestrator/
  → resolves controller persona, current org, current session
  → consults Agent Ladder for postJournalEntry on this org's
    accounting rules
  ↓
agent/policies/agent-ladder/                       ← Phase 2+ home
  → returns rung = 'always_confirm' for v1 (default)
  ↓
agent/tools/ledger/postJournalEntry.tool.ts
  → Zod-validates input { lines, memo, post_date, source: 'agent',
                           idempotency_key: <uuid> }
  → calls dry_run=true first
  → renders Proposed Entry Card via canvas_directive
  → awaits user approval click
  → calls dry_run=false with same idempotency_key
  ↓
contracts/agent-tools/ledger/postJournalEntry.contract.ts
  → defines PostJournalEntryInput + PostJournalEntryOutput Zod schemas
  → enforces source='agent' implies idempotency_key required
  ↓
services/accounting/journalEntryService.post()
  → wrapped in withInvariants({ action: 'journal_entry.post' })
    - INV-AUTH-001 four pre-flight checks
    - INV-SERVICE-001 wrap discipline
  → Zod re-validates input (defense layer 2)
  → INV-SERVICE-002: adminClient (no userClient under services/)
  → INV-IDEMPOTENCY-001: checks idempotency_key uniqueness
  → opens transaction
  → calls core/ledger/postingRules.balanceDebitsAndCredits()
  → calls core/period/isPeriodLocked()
  → inserts journal_entries + journal_lines via
    db/repositories/journalEntriesRepository
  → calls services/audit/recordMutation() with the same trace_id
  → commits transaction
  ↓
core/ledger/postingRules.ts
  → pure: returns Result<void, PostingRuleViolation>
  → no DB; no network; no agent imports
  ↓
db/repositories/journalEntriesRepository.ts
  → typed insert call against the adminClient
  → DB layer enforces:
    - INV-LEDGER-001 balance CHECK constraint
    - INV-LEDGER-002 period_locked trigger
    - INV-RLS-001 multi-tenant scoping
    - append-only (no UPDATE policy)
  ↓
services/audit/recordMutation.ts
  → inserts audit_log row with before_state=null,
    after_state=<entry summary>, trace_id, idempotency_key
  ↓
service returns ServiceResult<{ journal_entry_id, posted_at }>
  ↓
tool returns ToolResult { ok: true, journal_entry_id, ... }
  ↓
orchestrator emits canvas_directive { type: 'show_entry',
  journal_entry_id }
```

The error path is the inverse, with the same call-chain shape:

```
DB CHECK constraint violation (e.g., balance check fails)
  ↓
db/repositories returns typed DB error
  ↓
services/accounting/journalEntryService.post()
  → catches typed DB error
  → returns ServiceError { code: 'BALANCE_NOT_ZERO', detail: ... }
  ↓
agent/tools/ledger/postJournalEntry.tool.ts
  → returns ToolError { code: 'BALANCE_NOT_ZERO', ... }
  ↓
orchestrator emits canvas_directive { type: 'show_error', code, ... }
  ↓
UI renders localized message keyed off the code (i18n; not free-text)
```

## Defenses at each seam

The call chain has six defended seams. Each seam has a specific
discipline; the disciplines compose so that failure at any one
layer does not cascade.

### Seam 1: orchestrator ↔ Agent Ladder

The orchestrator resolves "is this tool eligible at all for this
agent rung on this rule?" Per the Agent Ladder model in
`docs/02_specs/agent_autonomy_model.md` §4, Layer 4 governance
gates whether the tool *can be invoked*; if the rule is at Always
Confirm and the user hasn't approved, the orchestrator does not
even reach the tool's body.

In v1 the Agent Ladder policy is in spec only (substrate-only per
ADR-0017 precedent applied to autonomy). The empty home at
`agent/policies/agent-ladder/` (created by ADR-0020) ships with a
README. Phase 2 populates the home with `canInvokeTool.ts`,
`promotionRules.ts`, `demotionRules.ts`, etc. v1's behavior is "all
mutating tools require user approval before execution" — Always
Confirm by default for every rule.

### Seam 2: tool input validation (Zod defense layer 1 of 3)

Tool input is **structured Zod-validated objects only.** The first
of the three Zod defense layers (the agent-tool-authoring skill's
Rule 4: "Tool inputs are structured Zod-validated objects only.
No free-text journal entries.").

Zod validation at the tool surface catches malformed input before
any service work begins. A malformed input fails at the tool
layer; the agent receives a typed validation error and either
asks the user a clarifying question (Rule 5) or surfaces the
error.

### Seam 3: tool ↔ contract

The tool and the corresponding service compile against the same
Zod contract at
`contracts/agent-tools/<capability>/<tool>.contract.ts`. This is
the seam ADR-0020 Decision item 4 names: "the formal interface
between agent/tools/ and services/."

The contract's role:

- **Single-source-of-truth Zod schema.** Both tool input and
  service input are parsed against the same schema. Drift is
  impossible because both consumers reference the same export.
- **Output envelope.** The contract defines the `ServiceResult<T>`
  shape (or `ToolResult<T>` shape if it differs). Future
  consumers (a CLI, a script, another agent per Phase 2's
  interaction model extraction at
  `docs/09_briefs/phase-2/interaction_model_extraction.md`) compile
  against the contract too.
- **Approval requirements.** The contract may carry metadata
  declaring "this tool is mutating" or "this tool requires Always
  Confirm regardless of rung" for Layer 4 governance to consume.
- **Authority metadata.** The contract may carry permission
  requirements that route handlers and middleware can introspect
  without instantiating the service.

In v1, tool schemas live at
`apps/web/src/agent/tools/schemas/` and
`apps/web/src/shared/schemas/accounting/`. Per ADR-0020 Decision
item 4, migration to `contracts/agent-tools/<capability>/` is
opportunistic (on first edit), not pre-emptive.

### Seam 4: tool ↔ service

The tool calls the service via a typed function. Per ADR-0020
Appendix A's import boundary rules, `agent/` may import
`services/`; this is the canonical agent-to-deterministic-engine
crossing.

What happens at this crossing:

- **`withInvariants` wrapping** per INV-SERVICE-001. **The
  service entry path applies `withInvariants` before the
  mutation body. Callers — route handlers, server actions, agent
  tools, scripts, future CLIs — do not get to choose whether
  invariants run.** INV-SERVICE-001 (the existing convention
  enforced by `eslint-rules/withInvariants-wrap-or-annotate.js`,
  scoped to `apps/web/src/services/**/*.ts`) is satisfied at the
  service boundary, not at any call site. The wrapper performs
  four pre-flight checks: context shape, caller verified, org
  access, and role-based authorization (INV-AUTH-001).
- **Zod re-validation** (defense layer 2 of 3). The service
  function re-validates its input, defense-in-depth. A bug in
  the tool's validation does not propagate to the service.
- **`adminClient` only** per INV-SERVICE-002. The service uses
  the service-role client; userClient imports under `services/`
  are rejected on review.
- **Authorization** via `canUserPerformAction(actor, action,
  target)`. The check is at the service layer, not the route
  handler.
- **Idempotency check** per INV-IDEMPOTENCY-001 if the source is
  `'agent'`. The service either inserts the new row or returns
  the existing row (per the idempotency-key column's UNIQUE
  constraint).

### Seam 5: service ↔ core

The service calls into `core/<area>/` for pure rule predicates.
Per ADR-0020 Appendix A's import boundary rules, `services/` may
import `core/`; per the converse rule, `core/` does NOT import
`services/`.

What lives at the seam:

- **Pure functions only.** `core/ledger/balanceDebitsAndCredits`,
  `core/period/isPeriodLocked`, `core/money/Money` arithmetic,
  `core/evidence/evidenceMetadataRules`. Each function takes
  typed inputs and returns typed outputs; no DB; no network; no
  agent imports.
- **Unit-testable without infrastructure.** Tests for `core/`
  functions don't need Supabase running; the tests instantiate
  inputs directly and assert on outputs.
- **Failure modes are typed.** A `core/` function that detects an
  invalid state returns a typed result (`Result<void,
  PostingRuleViolation>`); the service translates the violation
  into a `ServiceError` with an external code.

In v1, most pure logic lives inside services because the `core/`
extraction is opportunistic per ADR-0020 Decision item 6. The
first concrete extraction candidate is `core/evidence/` per
Phase 1 chunk 1 (`storageProviderService` per ADR-0013). Future
extractions surface as services are naturally edited.

### Seam 6: service ↔ db (defense layer 3 of 3)

The service calls into `db/repositories/<entity>Repository.ts`
for typed persistence. Per ADR-0020 Appendix A's import boundary
rules, `services/` may import `db/`; `db/` does not import
`services/` business orchestration.

The DB layer is the third **constraint-defense** layer (not Zod
— the DB layer enforces correctness through database mechanisms,
not Zod schemas):

- **DB CHECK constraints** (e.g., INV-LEDGER-001 balance check).
- **Triggers** (e.g., INV-LEDGER-002 period lock check).
- **Foreign keys** (referential integrity; org / period / account
  scoping).
- **RLS policies** (multi-tenant scoping; INV-RLS-001).
- **Append-only enforcement** (no UPDATE policy on
  `journal_entries` after posting).

The three-layer validation-defense-in-depth chain is therefore:
**(1) Zod at the tool surface, (2) Zod at the service surface,
(3) DB constraints / RLS / triggers / foreign keys / append-only
policies.** Layers 1 and 2 are Zod schema validation; Layer 3 is
constraint enforcement at the database. A bug in the service
that allows a malformed write to reach the DB is caught at the
constraint layer. Structured errors flow back up through the
service layer's typed-error translation.

## The six anti-hallucination rules at the tool layer

The agent-tool-authoring skill at
`.claude/skills/agent-tool-authoring/SKILL.md` codifies six rules
that prevent the agent from inventing values, bypassing tool
contracts, or substituting canvas context for live tool calls.
The rules apply at Seams 2 and 3 of the call chain:

1. **Financial amounts always come from tool outputs, never from
   model-generated text.** The agent proposes what to do; the
   service layer and database produce the numbers.
2. **Every mutating tool has a `dry_run: boolean` parameter.** The
   confirmation flow always calls dry-run first.
3. **No account codes, vendor names, or amounts that weren't
   retrieved in the current session.** If the agent hasn't
   retrieved it from the DB in this conversation, it can't
   reference it.
4. **Tool inputs are structured Zod-validated objects only.** No
   free-text journal entries.
5. **Ask clarifying questions rather than guess.** If the agent
   cannot produce a valid typed value for a required field, it
   must ask.
6. **Canvas context is reference material, never a substitute for
   tool-retrieved data.** The canvas can describe what the user
   is looking at; it cannot substitute for a live tool call when
   the agent needs authoritative state.

These rules close the "agent made something up" loop at the tool
boundary. The downstream layers (services, core, db) close the
"agent did something it shouldn't" loop via the Two Laws and the
20 invariants. Both layers must be respected; neither substitutes
for the other.

## Tool capability subdirectories

Per CTO Handoff v2 §7 + ADR-0020 Decision items 1 and 4, agent
tools and their contracts are organized by **capability** (not by
domain). The capability subdirectories:

| Capability | `agent/tools/<cap>/` purpose | Example tools |
|---|---|---|
| `ledger/` | journal-entry mutations and queries | `postJournalEntry`, `reverseJournalEntry`, `listJournalEntries` |
| `onboarding/` | first-run org setup | `createOrganization`, `selectIndustry`, `seedChartOfAccounts` |
| `document/` | document-level operations | `uploadDocument`, `classifyDocument`, `routeDocument` |
| `evidence/` | evidence-handling for storage / metadata | `storeDocumentEvidence`, `verifyEvidenceHash` |
| `reference/` | read-only lookups | `findVendor`, `lookupAccount`, `searchEntries` |

Capability is **what the tool does**, not which product domain
its data belongs to. A `findVendor` tool sits under `reference/`
because it's a lookup (capability), even though its data belongs
to the AP/Spend domain (per ADR-0011 §1). Contracts mirror the
same capability shape at
`contracts/agent-tools/<capability>/<tool>.contract.ts`.

Capability subdirectories are created on first use per ADR-0020
Decision item 6 (opportunistic). The empty
`contracts/agent-tools/` directory ships in this session with a
README; concrete subdirectories appear as their first tool is
authored.

## Cross-references

- ADR-0007 — three-tier agent architecture; Tier 1 commit path
  re-verification at the service layer.
- ADR-0011 §14 — Domain Boundary Map; service subdirectory
  ownership.
- ADR-0017 — Vendor Template Substrate; substrate-only-v1
  precedent that ADR-0020 inherits.
- ADR-0020 — Agent-First Authority-Gradient Source Architecture;
  folder layout + import boundary rules + ESLint rule scaffold.
- `docs/02_specs/ledger_truth_model.md` — INV-SERVICE-001,
  INV-SERVICE-002, INV-AUTH-001, INV-IDEMPOTENCY-001,
  INV-AUDIT-001 leaves.
- `docs/02_specs/agent_autonomy_model.md` §4 — Agent Ladder.
- `.claude/skills/service-architecture/SKILL.md` — the Two Laws
  + `withInvariants` discipline.
- `.claude/skills/agent-tool-authoring/SKILL.md` — the six
  anti-hallucination rules.
- `docs/03_architecture/agent_interface.md` — durable agent
  contract (one voice, typed tools, structured outputs).
- `docs/03_architecture/authority-gradient.md` — the four-layer
  framing this call chain traverses.
- `docs/03_architecture/folder-structure.md` — the canonical
  `apps/web/src/` tree per ADR-0020 Decision item 1.
