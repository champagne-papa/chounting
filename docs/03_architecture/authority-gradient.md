# Authority Gradient

CHOUnting's load-bearing architectural seam. Four layers of
authority, each with a defined ownership scope, talking to its
neighbors through narrow, defended interfaces. Authority flows
down; structured errors flow up; nothing bypasses a layer.

This document consolidates the Layer 1 / Layer 2 / Layer 3 /
Layer 4 framing that lives across multiple canonical sources.
The canonical sources remain authoritative; this is the rollup.

**Canonical sources:**

- `docs/00_product/product_vision.md` — the Thesis ("deterministic
  financial engine with a probabilistic interface") and Thesis
  Extension ("the product is the control surface over the AI").
- `docs/02_specs/ledger_truth_model.md` — the 20 invariants with
  full leaves; INV-SERVICE-001 (`withInvariants`), INV-SERVICE-002
  (`adminClient`), INV-AUTH-001 (authorization), INV-LEDGER-001
  through INV-LEDGER-006, etc.
- `docs/02_specs/agent_autonomy_model.md` §2 (Authority Gradient
  Extended) — Layer 4 governance: Agent Ladder, limit model,
  System vs Policy boundary.
- `docs/07_governance/adr/0007-three-tier-agent-architecture.md`
  §Context — three-tier agent architecture (Tier 1 commit; Tier 2
  proposal; Tier 2.5 Relationship Router; Tier 3 interface).
- `docs/07_governance/adr/0011-document-platform.md` §14 — Domain
  Boundary Map.
- `docs/07_governance/adr/0020-agent-first-authority-gradient-source-architecture.md`
  — folder layout that surfaces the authority gradient at the
  source-tree level.

## The four layers

| Layer | Name | Role | Ownership scope |
|---|---|---|---|
| 1 | **Database** | Persistence + bedrock invariants | DB CHECK constraints, foreign keys, triggers, RLS policies, append-only ledger |
| 2 | **Services** | Deterministic engine | `apps/web/src/services/**`; `withInvariants` wrapping; `adminClient` discipline; audit log emission; transactions |
| 3 | **Agent** | Cognitive interface | `apps/web/src/agent/**`; orchestrator; tool dispatch; persona; canvas directives; no DB writes; no business logic |
| 4 | **Governance** | Authority model + autonomy policy | Agent Ladder (3 rungs); limit model (4 dimensions); System ceiling; promotion / demotion ceremonies |

Layers 1, 2, 3 are runtime; Layer 4 is meta-architectural — it
governs *what the agent is allowed to do at all*. Layer 4 lives in
specs (`agent_autonomy_model.md`), in service code that consults
Agent Ladder state (Phase 2), and in the audit-log corpus that
records every promotion / demotion / approval / rejection.

## What each layer does

### Layer 1 — Database

The database holds the **bedrock invariants** that no other layer
can repair. Concretely:

- **Append-only ledger.** RLS policies + INV-LEDGER-005 prevent
  UPDATE on `journal_entries` and `journal_lines` after posting.
  Reversals are normal entries with a self-FK + non-empty reason
  per ADR-0001, not row mutations.
- **Debits-equal-credits.** `journal_entries.balance_check_total`
  is enforced by a CHECK constraint plus a trigger that recomputes
  the sum across `journal_lines` for each entry. INV-LEDGER-001.
- **Multi-tenant isolation.** RLS policies on every business table
  scope reads to the caller's `org_id`. INV-RLS-001.
- **Structured enums.** Every enum that ships closed (per ADR-0010)
  has a Layer 1 DB CHECK constraint as its outermost defense.
- **Period locks.** `fiscal_periods.locked_at IS NOT NULL` blocks
  posting at the trigger layer per INV-LEDGER-002.
- **Idempotency for agent mutations.** `journal_entries` carries
  `idempotency_key`; a CHECK constraint enforces `source <>
  'agent' OR idempotency_key IS NOT NULL` per INV-IDEMPOTENCY-001.
- **Audit-log writer boundary.** No INSERT policy for
  authenticated users on `audit_log`; only `adminClient` (via
  `services/audit/recordMutation.ts`) inserts.

A bug in Layer 2 or 3 cannot violate a Layer 1 invariant. The
database refuses the write at the constraint layer; structured
errors flow back up.

### Layer 2 — Services

Services are the **deterministic engine**. Per the
product_vision.md thesis, this is the half of the system that has
no natural language, no probabilistic reasoning, no model calls on
the critical path of a journal entry. Services own:

- **All application database access is initiated through
  `services/`.** Repositories under
  `apps/web/src/db/repositories/` are persistence helpers called
  by services, **not an alternate application entry point**.
  Routes, agent code, React components, and `core/` code must
  not import repositories directly. The Two Laws (Law 1) in
  `docs/02_specs/glossary.md` capture the same rule from the
  authority-direction angle: "All database access goes through
  `src/services/` only." The repository helpers are called by
  services on the way to `db/`, never instead of services. See
  the `service-architecture` skill at
  `.claude/skills/service-architecture/SKILL.md`.
- **Journal-entry writing.** Per the Two Laws (Law 2): "All
  journal entries are created by `journalEntryService.post()`
  only. No other function in the codebase may insert into
  `journal_entries` or `journal_lines`."
- **The `withInvariants` wrapper** per INV-SERVICE-001. The
  service entry path applies `withInvariants` before the
  mutation body. Callers — route handlers, server actions,
  agent tools, scripts, future CLIs — do not get to choose
  whether invariants run; the wrapping is at the service
  boundary, not at any call site. The wrapper performs four
  pre-flight checks (context shape, caller verified, org
  access, role-based authorization). INV-SERVICE-001 +
  INV-AUTH-001. The convention is enforced by
  `eslint-rules/withInvariants-wrap-or-annotate.js`, scoped to
  `apps/web/src/services/**/*.ts`.
- **`adminClient` discipline** per INV-SERVICE-002. Every file
  under `services/**` imports from `@/db/adminClient`; `userClient`
  imports under `services/` are rejected on review. The
  `no-restricted-imports` lint rule enforces this at `services/`'s
  outer boundary.
- **Authorization.** Service functions check
  `canUserPerformAction(actor, action, target)` (or its
  equivalent) before mutating. The check is at the service layer,
  not the route handler.
- **Audit log emission.** Every mutating service function writes
  one or more rows to `audit_log` via
  `services/audit/recordMutation.ts`, in the same transaction as
  the data mutation. INV-AUDIT-001.
- **Transaction boundaries.** A service function that touches
  multiple rows runs inside a transaction; partial-write states
  are not observable from outside the service.
- **Structured errors.** A service function that rejects a call
  returns a typed `ServiceError` with a code (`PERIOD_LOCKED`,
  `REVERSAL_NOT_MIRROR`, `PERMISSION_DENIED`, etc.), not a
  natural-language explanation. The agent can act on the code
  programmatically.

Services are where "yes/no" authority lives for application
actions. Agents can request action; services decide and execute.

### Layer 3 — Agent

The agent is the **probabilistic interface**. Per the
product_vision.md thesis, this layer reads messy human input,
interprets intent, suggests actions, and explains outcomes. The
agent owns:

- **Orchestration** under `agent/orchestrator/`. Resolving
  persona, session, org context, tool eligibility.
- **Persona resolution.** The agent presents as one voice per
  ADR-0003 / ADR-0006 (one-voice agent architecture; persona
  unnamed). No user-facing sub-agent delegation.
- **Prompt construction** under `agent/prompts/`.
- **Memory and context loading** under `agent/memory/` and
  `agent/canvas/` (canvas-context injection per Phase 1.2's
  minimal bidirectional flow).
- **Tool selection and dispatch** under `agent/tools/<capability>/`.
  Tool inputs are structured Zod-validated objects (per the
  agent-tool-authoring skill at
  `.claude/skills/agent-tool-authoring/SKILL.md`).
- **Dry-run behavior.** Every mutating tool has a `dry_run:
  boolean` parameter; the confirmation flow always calls dry-run
  first.
- **Date resolution** under `agent/date-resolution/`.
- **Canvas directives** — render instructions for the UI's
  canvas panel, structured (not free-form) per the canvas-directive
  contract in `docs/03_architecture/ui_architecture.md`.

What the agent **does not own**:

- Database access. Agent code does not import
  `@/db/adminClient` or `db/repositories` directly. (The current
  Q33 narrowed exemption — 3 agent-runtime sites in
  `orgContextManager`, `orchestrator/index`, `loadOrCreateSession`
  — is the only deferred exception, per
  `docs/03_architecture/monorepo.md` Q33 entry.)
- Business logic. Debit / credit math, period enforcement,
  FX calculation, posting rules, and reversal-line construction
  are pure functions in `core/<area>/` or live inside services;
  not in agent code.
- Authority. The agent can propose; the service decides; the
  database enforces. The agent never owns the "yes" decision on a
  mutation.

### Layer 4 — Governance (Autonomy Model)

Layer 4 wraps the 3-layer runtime authority gradient with an
**autonomy policy**. It answers "what is the agent allowed to do
*at all*?" while Layer 1/2/3 answers "given that it's allowed,
how does the request execute?"

The Agent Ladder per `docs/02_specs/agent_autonomy_model.md` §4
defines three rungs:

1. **Always Confirm** — every proposed mutation requires explicit
   user approval before execution. v1 default for all rules.
2. **Notify & Auto-Post** — proposed mutation auto-executes;
   user receives a notification with a 24-hour reversal window.
   Controller-authorized per §4.1 promotion ceremony.
3. **Silent Auto** — proposed mutation auto-executes without
   notification. Owner-authorized per §4.1.

Promotion and demotion are ceremonies that emit audit events and
update durable state in `vendor_rules.current_rung` (or analogous
per-rule columns when the substrate extends per ADR-0017's
substrate-now-enforcement-later precedent).

Layer 4 also defines:

- **The limit model** (four dimensions: monetary cap, scope,
  frequency, recoverability). A rule's autonomy is bounded by
  whichever limit hits first.
- **System vs Policy boundary** (`agent_autonomy_model.md` §6).
  Seven row classes are uncappable regardless of rung: locked-period
  posting, reversal entries, intercompany entries, period-end
  adjustments, equity postings, first-time vendors above floor,
  and vendor bank-detail changes (INV-AGENT-006).
- **Promotion thresholds** (Q23 system-fixed for v1; per-org
  tunable post-v1 per `agent_autonomy_model.md` §4.2).

Layer 4 lives in specs at v1 (substrate-only); enforcement code
ships per the substrate-now-enforcement-later pattern (e.g.,
`vendor_rules` substrate from ADR-0017 ships at v1; auto-post
calibration consumption ships post-v1).

## How the layers compose at runtime (the canonical request path)

A user posts a journal entry through the agent. The four layers
collaborate as follows:

```
User: "Post this approved journal entry."
  ↓
[Layer 3] agent/orchestrator/
  - resolves persona, session, org context
  - resolves tool eligibility per Layer 4 Agent Ladder rung
  ↓
[Layer 3] agent/policies/agent-ladder/         ← Phase 2 home; substrate at v1
  - checks: is this mutation under Always Confirm or higher?
  - if Always Confirm: requires user approval before tool call
  ↓
[Layer 3] agent/tools/ledger/postJournalEntry.tool.ts
  - validates Zod input (Layer 1 of three-layer Zod defense)
  - calls dry_run=true first; renders proposed entry
  - awaits user approval
  - calls dry_run=false with idempotency key
  ↓
[contracts] contracts/agent-tools/ledger/postJournalEntry.contract.ts
  - defines exact input / output schema
  - tool and service both compile against this contract
  ↓
[Layer 2] services/accounting/journalEntryService.post()
  - withInvariants wrapper (Layer 2 of Zod defense)
  - INV-AUTH-001 four pre-flight checks
  - INV-SERVICE-002 adminClient
  - INV-IDEMPOTENCY-001 idempotency-key check
  - opens transaction
  - calls core/ledger/postingRules.balanceDebitsAndCredits()
  - inserts journal_entries + journal_lines
  - inserts audit_log row
  - commits transaction
  ↓
[Layer 1] database
  - INV-LEDGER-001 balance check (CHECK constraint)
  - INV-LEDGER-002 period lock check (trigger)
  - INV-RLS-001 multi-tenant isolation
  - append-only enforcement
  - returns success or refuses with structured error
  ↓
[Layer 2] returns ServiceResult { ok: true, journal_entry_id, ... }
  ↓
[Layer 3] tool returns structured output to orchestrator
  ↓
[Layer 3] orchestrator emits canvas_directive for the UI
```

The structured-error path is the inverse:

```
[Layer 1] CHECK constraint violation
  ↓
[Layer 2] catches DB error; returns ServiceError { code: 'PERIOD_LOCKED', ... }
  ↓
[Layer 3] tool receives ServiceError; agent surfaces typed error
  ↓
[Layer 3] orchestrator emits canvas_directive showing the rejection
  ↓
[user] sees a localized message (i18n applied to the code, not free-text)
```

No layer can be skipped. Agent → Service → DB is enforced by the
import boundary rules per ADR-0020 Appendix A and (post-Phase-1-
chunk-1 activation) by the `agent-first-import-boundaries`
ESLint rule.

## What this means for source organization

ADR-0020 surfaces the authority gradient at the source-tree
layer:

- **Layer 1** lives at `apps/web/src/db/` (admin client, generated
  types, repositories) plus the migrations under
  `supabase/migrations/`.
- **Layer 2** lives at `apps/web/src/services/<area>/`. Subdirectory
  naming follows ADR-0011 §14 Domain Boundary Map.
- **Layer 3** lives at `apps/web/src/agent/`. The `agent/policies/
  agent-ladder/` empty home (added by ADR-0020 in 2026-05-05's
  substrate session) is the Phase 2 implementation target for
  Layer 4 enforcement code.
- **Layer 4** is meta-architectural; the spec lives at
  `docs/02_specs/agent_autonomy_model.md`. Phase 2 implementation
  code lands at `agent/policies/agent-ladder/` per ADR-0020
  Decision item 5.

The `core/` directory under `apps/web/src/core/` (added by
ADR-0020) is **pure deterministic logic** — math, validation
helpers, and rule predicates with no DB / no network / no agent /
no UI. Per ADR-0020 Decision item 2, the name is `core/` not
`domain/` to avoid reopening DDD framing.

`core/` is **not an authority layer**. It is a pure-rule library
**called by Layer 2 (Services)**: services invoke `core/`
functions for rule predicates (`isPeriodLocked`,
`balanceDebitsAndCredits`, `evidenceMetadataRules`); `core/`
calls nothing back. The same framing applies to `contracts/`,
which is a boundary artifact (Zod / TypeScript schemas at the
agent ↔ services seam), not an authority layer in its own
right. Tests for `core/` functions don't need Supabase running.

## Authority gradient and the Two Laws

The Two Laws of Service Architecture (Law 1: all DB access
through `services/`; Law 2: all journal entries via
`journalEntryService.post()`) are framings of the
authority-gradient discipline at the Layer 2 ↔ Layer 1 seam.
INV-SERVICE-001 + INV-SERVICE-002 + INV-AUTH-001 are the
invariant-level enforcements; the Two Laws are the prose
shorthand. The `service-architecture` skill at
`.claude/skills/service-architecture/SKILL.md` summarizes both.

The agent-tool-authoring discipline (six anti-hallucination rules
at `.claude/skills/agent-tool-authoring/SKILL.md`) is the analog
discipline at the Layer 3 ↔ Layer 2 seam. The six rules together
prevent the agent from inventing values, bypassing tool contracts,
or substituting canvas context for live tool calls.

## Cross-references

- ADR-0007 — three-tier agent architecture; Tier 1 commit-path
  re-verification. Layer-3 internal partition.
- ADR-0011 §14 — Domain Boundary Map. Layer-2 service partition
  (which subdirectory owns which domain).
- ADR-0017 — Vendor Template Substrate. Layer 4's `vendor_rules`
  substrate; v1 substrate-only; post-v1 enforcement of auto-post
  calibration consuming the substrate.
- ADR-0020 — Agent-First Authority-Gradient Source Architecture.
  The folder layout that surfaces the authority gradient at the
  source-tree level.
- `docs/02_specs/ledger_truth_model.md` INV-SERVICE-001,
  INV-SERVICE-002, INV-AUTH-001 leaves — the load-bearing
  invariants for the Layer 2 ↔ Layer 1 seam.
- `docs/02_specs/agent_autonomy_model.md` §2 (Authority Gradient
  Extended), §4 (Agent Ladder), §6 (System vs Policy boundary).
- `docs/00_product/product_vision.md` Thesis + Thesis Extension.
