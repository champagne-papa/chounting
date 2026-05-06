CHOUnting CTO Handoff v2
Core decision

We are rejecting a DDD-first /src/modules/ architecture.

We are not rejecting:

Product → Module → Feature → Requirement → Task

Workflow Arc → Stage → Workflow Session → Step

Delivery Phase → Phase Branch → Worktree → Build Chunk → Commit

Feature Flag → Cohort → Ramp → Retirement

Those still hold.

What changes is how the source tree is organized.

Previously proposed:

apps/web/src/modules/
  document-core/
  double-entry/
  client-core/
  audit/
  reporting/

New recommendation:

apps/web/src/
  app/          # workflow-shaped routes and surfaces
  agent/        # cognitive layer
  contracts/    # formal agent/API/event contracts
  services/     # deterministic engine
  core/         # pure deterministic calculations/rules
  db/           # persistence boundary
  components/   # app UI
  shared/       # cross-cutting utilities

In other words:

Product modules remain a planning/documentation concept.
Source code is organized by authority layer and agent boundary, not by DDD bounded context.

1. What stays the same from our prior discussion
Repo structure stays

Current monorepo shape is still right:

chounting/
├── apps/
│   ├── web/
│   └── demo/
├── packages/
│   ├── ui/
│   ├── tokens/
│   └── flags/          # recommended
├── docs/
├── supabase/
├── scripts/
├── tests/
├── turbo.json
└── pnpm-workspace.yaml

Recommended interpretation:

apps/web/
  Real CHOUnting application.

apps/demo/
  Demo/sandbox/showcase app.

packages/ui/
  Reusable UI primitives.

packages/tokens/
  Design tokens.

packages/flags/
  Shared feature flag names/config.

docs/
  Product map, workflow map, architecture, ADRs, phase briefs.

supabase/
  Migrations and Supabase config.

No repo redesign is needed.

Worktree strategy stays

Use phase-scoped worktrees outside .claude/:

~/projects/chounting/
~/projects/chounting-worktrees/
  phase-0-governance/
  phase-1-storage-evidence-core/
  phase-2-...

The model remains:

main branch / trunk
    │
    │   ↑ merge at phase ratification
    │     preferably --no-ff to preserve arc topology
    │
    ├── phase/0-governance
    ├── phase/1-storage-evidence-core
    └── phase/2-...

Recommended language:

Phase-scoped trunk-compatible development.

Not pure trunk-based development.

Rules:

- Phase branches are temporary governance/integration lanes.
- Work happens in a dedicated worktree.
- Commits are small and frequent.
- Active phase branches regularly merge from main.
- Incomplete runtime behavior is feature-flagged.
- Phase branch merges to main at ratification.
- main remains the canonical ratified state.

Rejecting DDD does not affect this.

Product/workflow model stays

Product structure still answers:

What exists in the software?

Product
└── Module
    └── Feature
        └── Requirement
            └── Task

Workflow structure still answers:

How does the user move through it?

Workflow Arc
└── Stage
    └── Workflow Session
        └── Step

Delivery structure still answers:

When and where do we build it?

Delivery Phase
└── Phase Branch
    └── Worktree
        └── Build Chunk
            └── Commit

Runtime rollout still answers:

When does merged code become visible or active?

Feature Flag
└── Cohort
    └── Ramp
        └── Retirement

The connection remains:

User Step
→ powered by Feature
→ owned by Product Module
→ implemented by Requirements/Tasks
→ built during a Delivery Phase
→ isolated in a Phase Worktree
→ merged to main at ratification
→ exposed through Feature Flags

The only thing that changes is that source code is no longer organized as:

src/modules/<product-module>/<feature>/

Instead, a feature becomes a vertical slice through the authority layers.

2. New architecture principle

The new principle should be:

CHOUnting is organized around the authority gradient between the AI agent, formal tool contracts, deterministic services, pure rules, and persistence.

This better matches the product thesis:

The product is not the AI.
The product is the control surface over the AI.

So the primary source-code question is not:

Which product module owns this file?

The primary source-code question becomes:

Which authority layer owns this responsibility?

3. Recommended apps/web/src structure
apps/web/src/
├── app/
│   ├── layout.tsx
│   ├── globals.css
│   ├── not-found.tsx
│   ├── error.tsx
│   ├── global-error.tsx
│   ├── [locale]/
│   │   ├── layout.tsx
│   │   ├── error.tsx
│   │   ├── loading.tsx
│   │   ├── [orgId]/
│   │   │   ├── error.tsx
│   │   │   ├── loading.tsx
│   │   │   ├── (workflows)/
│   │   │   │   ├── intake/
│   │   │   │   ├── ledger/
│   │   │   │   ├── review/
│   │   │   │   └── reporting/
│   │   │   ├── (settings)/
│   │   │   └── (admin)/
│   │   └── ...
│   └── api/
│
├── agent/
│   ├── orchestrator/
│   ├── tools/
│   │   ├── ledger/
│   │   ├── onboarding/
│   │   ├── document/
│   │   ├── evidence/
│   │   └── reference/
│   ├── policies/
│   │   └── agent-ladder/
│   ├── prompts/
│   ├── memory/
│   ├── date-resolution/
│   └── canvas/
│
├── contracts/
│   ├── agent-tools/
│   ├── api/
│   ├── events/
│   └── public/
│
├── services/
│   ├── accounting/
│   ├── evidence/
│   ├── audit/
│   ├── auth/
│   ├── org/
│   ├── user/
│   ├── storage/
│   └── middleware/
│
├── core/
│   ├── ledger/
│   ├── period/
│   ├── chart/
│   ├── money/
│   ├── tax/
│   └── evidence/
│
├── db/
│   ├── adminClient.ts
│   ├── types.ts
│   └── repositories/
│
├── components/
│   ├── layout/
│   ├── shared/
│   ├── canvas/
│   └── bridge/
│
├── hooks/
├── lib/
├── shared/
└── middleware/

I would use core/ instead of domain/ if we are explicitly rejecting DDD language.

core/ means:

Pure deterministic rules, math, validation helpers, and types with no database, no network, no agent, no UI.

This avoids DDD framing while preserving the useful idea that accounting/evidence rules should be testable without Supabase or the agent runtime.

4. Authority-layer meaning
app/ — workflow surface

This is the human-facing route/workflow layer.

It should be organized around user journeys:

apps/web/src/app/[locale]/[orgId]/(workflows)/intake/
apps/web/src/app/[locale]/[orgId]/(workflows)/ledger/
apps/web/src/app/[locale]/[orgId]/(workflows)/review/
apps/web/src/app/[locale]/[orgId]/(workflows)/reporting/

This corresponds to:

Workflow Arc → Stage → Workflow Session → Step

Routes should be thin. They should call services, server actions, or module-level surfaces. They should not own core accounting rules.

agent/ — cognitive layer

This is the AI-facing layer.

It owns:

- orchestration;
- persona resolution;
- prompt construction;
- memory/context loading;
- tool selection;
- tool dispatch;
- Agent Ladder policies;
- dry-run behavior;
- cognitive state;
- canvas directives;
- date resolution;
- agent-only validation before tool call.

The key rule:

The agent may recommend, explain, propose, and invoke tools, but it does not own accounting truth.

Agent code should not directly mutate database tables.

Good:

await postJournalEntryTool.invoke(input)

Good inside the tool:

await journalEntryService.postJournalEntry(validatedInput)

Bad:

await supabase.from('journal_entries').insert(...)
contracts/ — formal boundary layer

This becomes much more important in the agent-first architecture.

contracts/agent-tools/ is the formal interface between:

agent/tools/

and:

services/

It should hold:

- tool input schemas;
- tool output schemas;
- tool result envelopes;
- dry-run response contracts;
- error contracts;
- approval requirements;
- maybe authority metadata.

Example:

contracts/agent-tools/ledger/postJournalEntry.contract.ts
contracts/agent-tools/ledger/reverseJournalEntry.contract.ts
contracts/agent-tools/evidence/storeDocumentEvidence.contract.ts
contracts/agent-tools/onboarding/createOrganization.contract.ts

This is the seam auditors and future developers should inspect when asking:

What is the AI allowed to ask the system to do?

services/ — deterministic engine

This is where actual system actions happen.

Services own:

- transactions;
- authorization checks;
- invariant enforcement;
- audit logging;
- DB coordination;
- service context;
- lower-wins enforcement;
- calls into core pure logic;
- repository usage.

Examples:

services/accounting/journalEntryService.ts
services/accounting/periodService.ts
services/evidence/evidenceStorageService.ts
services/audit/recordMutation.ts
services/auth/canUserPerformAction.ts
services/middleware/withInvariants.ts

The service layer is where “yes/no” authority lives for application actions.

Agent tools can request action. Services decide and execute.

core/ — pure deterministic rules

This replaces the DDD-style domain/ recommendation.

core/ owns pure logic only:

core/ledger/
  balanceDebitsAndCredits.ts
  buildReversalLines.ts
  postingRules.ts

core/period/
  isPeriodLocked.ts
  periodBoundaryRules.ts

core/money/
  Money.ts
  currency.ts
  rounding.ts

core/evidence/
  evidenceHash.ts
  evidenceMetadataRules.ts

Rules:

- no DB imports;
- no Supabase imports;
- no agent imports;
- no app/router imports;
- no service context;
- deterministic inputs and outputs;
- heavily unit tested.

This lets accounting/evidence rules be shared by services and validated without spinning up infrastructure.

db/ — persistence boundary

This owns:

- Supabase admin client;
- generated DB types;
- typed query helpers;
- repositories if needed.

Recommended shape:

db/
├── adminClient.ts
├── types.ts
└── repositories/
    ├── journalEntriesRepository.ts
    ├── fiscalPeriodsRepository.ts
    ├── evidenceRepository.ts
    └── orgRepository.ts

Important rule:

Agent and UI code should not directly import db/adminClient.

Only services and repositories should touch the persistence boundary.

components/ — app-level UI

Because packages/ui already exists, apps/web/src/components/ should not become the design system.

Use:

packages/ui/

for reusable primitives:

Button
Input
Dialog
Modal
Toast
Table
Card
Dropdown

Use:

apps/web/src/components/

for CHOUnting-specific shared UI:

AppShell
OrgSwitcher
Sidebar
CanvasPanel
BridgeView
EmptyState
PageHeader

Feature-specific UI can live near workflow routes or under components/ if shared. Since we are rejecting DDD modules, do not force all feature UI into modules/<feature>/ui.

5. How a feature maps across the new structure

Under DDD, we might have said:

modules/double-entry/journal-entry/

Under agent-first authority architecture, journal entry posting becomes a slice through layers:

Workflow route:
app/[locale]/[orgId]/(workflows)/ledger/

Agent tool:
agent/tools/ledger/postJournalEntry.tool.ts

Tool contract:
contracts/agent-tools/ledger/postJournalEntry.contract.ts

Service:
services/accounting/journalEntryService.ts

Pure rules:
core/ledger/postingRules.ts
core/ledger/balanceDebitsAndCredits.ts
core/period/isPeriodLocked.ts

Persistence:
db/repositories/journalEntriesRepository.ts
db/repositories/fiscalPeriodsRepository.ts

Audit:
services/audit/recordMutation.ts

Feature flag:
packages/flags/src/accounting.ts

That is the key difference.

A product feature does not live in one folder.

A product feature is a traceable vertical slice through the authority gradient.

6. Example: Document Upload

Product model:

Product: CHOUnting
Module: Document Core
Feature: Document Upload

Workflow model:

Workflow Arc: Bookkeeping Intake to Ledger
Stage: Document Intake
Workflow Session: Upload client document package
Step: User uploads bank statement

Source mapping:

Route:
app/[locale]/[orgId]/(workflows)/intake/documents/page.tsx

Agent tool:
agent/tools/document/uploadDocument.tool.ts

Tool contract:
contracts/agent-tools/document/uploadDocument.contract.ts

Service:
services/evidence/storeDocumentEvidenceService.ts
services/storage/uploadStorageService.ts

Pure rules:
core/evidence/evidenceMetadataRules.ts
core/evidence/evidenceHash.ts

Persistence:
db/repositories/evidenceRepository.ts

Feature flags:
packages/flags/src/evidence.ts

Delivery mapping:

Delivery Phase:
Phase 1 — Storage / Evidence Core

Branch:
phase/1-storage-evidence-core

Worktree:
~/projects/chounting-worktrees/phase-1-storage-evidence-core/

Runtime mapping:

Flags:
evidence_storage_v1
document_upload_enabled
agent_document_upload_tool_enabled
7. Example: Agent Ladder tool invocation

For an AI agent tool, the call chain should look like this:

Agent message
  ↓
agent/orchestrator/
  ↓
agent/policies/agent-ladder/
  ↓
agent/tools/<capability>/<tool>.tool.ts
  ↓
contracts/agent-tools/<capability>/<tool>.contract.ts
  ↓
services/<area>/<service>.ts
  ↓
core/<area>/
  ↓
db/repositories/
  ↓
audit service records mutation

Concrete example:

User:
"Post this approved journal entry."

Flow:
agent/orchestrator/
  resolves persona, session, org context, tool eligibility

agent/policies/agent-ladder/
  checks whether this agent rung may post or only propose

agent/tools/ledger/postJournalEntry.tool.ts
  validates input/output contract
  enforces dry-run if required
  calls service

contracts/agent-tools/ledger/postJournalEntry.contract.ts
  defines exact input/output schema

services/accounting/journalEntryService.ts
  checks permissions
  checks period lock
  checks debit/credit balance
  starts transaction
  records audit event
  writes to DB

core/ledger/postingRules.ts
  pure invariant logic

db/repositories/journalEntriesRepository.ts
  persistence

This makes the Agent Ladder a real architectural citizen instead of a policy idea floating in docs.

8. Feature flags in the new model

Feature flags still matter, but they are not the source of authority.

Flags can hide or expose behavior.

They should not be the only thing preventing invalid behavior.

Recommended package:

packages/flags/
├── src/
│   ├── accounting.ts
│   ├── evidence.ts
│   ├── agent.ts
│   ├── onboarding.ts
│   ├── rollout.ts
│   └── index.ts

Example flags:

export const agentFlags = {
  ledgerPostingToolEnabled: 'agent_ledger_posting_tool_enabled',
  agentLadderRung2Enabled: 'agent_ladder_rung_2_enabled',
  documentUploadToolEnabled: 'agent_document_upload_tool_enabled',
} as const

export const evidenceFlags = {
  evidenceStorageV1: 'evidence_storage_v1',
  documentUploadEnabled: 'document_upload_enabled',
} as const

export const accountingFlags = {
  ledgerPostingEnabled: 'ledger_posting_enabled',
  balancedEntryRequiredForPosting: 'balanced_entry_required_for_posting',
} as const

Important rule:

Feature flag = rollout control.
Agent Ladder = cognitive permission model.
Service invariants = deterministic authority.
DB constraints/RLS = persistence authority.

Do not let flags replace service invariants.

9. Product/workflow maps under agent-first architecture

The product/workflow model still works. It just becomes a documentation and traceability layer, not a source-folder hierarchy.

Recommended docs:

docs/
├── 00_product/
│   ├── product-map.md
│   └── modules/
│       ├── document-core.md
│       ├── double-entry.md
│       ├── client-core.md
│       ├── agent-control-surface.md
│       └── evidence-core.md
│
├── 01_workflows/
│   ├── workflow-map.md
│   ├── document-intake.md
│   ├── bookkeeping-intake-to-ledger.md
│   └── agent-assisted-posting.md
│
├── 03_architecture/
│   ├── authority-gradient.md
│   ├── agent-tool-architecture.md
│   ├── agent-ladder.md
│   ├── folder-structure.md
│   ├── branching-and-feature-flag-strategy.md
│   └── product-workflow-delivery-mapping.md
│
├── 07_governance/
│   └── adr/
│
└── 09_briefs/
    ├── phase-1/
    ├── phase-2/
    └── phase-3/

The matrix becomes the bridge.

Example:

Product Module	Feature	Workflow Step	Agent Tool	Service	Core Rule	Phase	Flag
Document Core	Document Upload	Upload bank statement	uploadDocument	storeDocumentEvidenceService	evidenceMetadataRules	Phase 1/2	document_upload_enabled
Double Entry	Post entry to ledger	Approve/post transaction	postJournalEntry	journalEntryService	postingRules	Phase 3/4	ledger_posting_enabled
Double Entry	Debit/Credit Validation	Validate entry before posting	maybe none	journalEntryService	balanceDebitsAndCredits	Phase 3/4	balanced_entry_required_for_posting
Agent Control Surface	Tool Permissioning	Agent attempts action	all tools	service boundary	n/a	Phase 2	agent_ladder_rung_2_enabled

This gives the CTO traceability without forcing DDD folders.

10. Delivery phases under the new source structure

Delivery phases should still not become source folders.

Do not create:

src/phase-1/
src/phase-2/

Instead, a phase touches the relevant authority layers.

Example:

Phase 1 — Storage / Evidence Core

May touch:

core/evidence/
services/evidence/
services/storage/
db/repositories/evidenceRepository.ts
contracts/agent-tools/evidence/
agent/tools/evidence/
app/[locale]/[orgId]/(workflows)/intake/
packages/flags/src/evidence.ts
supabase/migrations/
docs/09_briefs/phase-1/
docs/03_architecture/authority-gradient.md

Example:

Phase 2 — Interaction Model / Agent Ladder

May touch:

agent/orchestrator/
agent/policies/agent-ladder/
agent/tools/
contracts/agent-tools/
services/audit/
packages/flags/src/agent.ts
docs/03_architecture/agent-ladder.md
docs/09_briefs/phase-2/

Example:

Phase 3 — Ledger Posting

May touch:

core/ledger/
core/period/
services/accounting/
db/repositories/journalEntriesRepository.ts
contracts/agent-tools/ledger/
agent/tools/ledger/
app/[locale]/[orgId]/(workflows)/ledger/
packages/flags/src/accounting.ts
supabase/migrations/

So the rule becomes:

Delivery phases are slices through authority layers, not folders.

11. Import boundary rules

These rules are the real architecture.

Agent rules
agent/ may import:
- contracts/
- services/
- shared/
- packages/flags

agent/ may not import:
- db/adminClient
- db repositories directly
- app routes
- UI components unless explicitly part of canvas/surface integration
Services rules
services/ may import:
- core/
- db/
- contracts/
- shared/
- packages/flags

services/ may not import:
- agent/
- app/
- React components
Core rules
core/ may import:
- shared primitives only

core/ may not import:
- db/
- services/
- agent/
- app/
- contracts that imply transport concerns
- React
DB rules
db/ may import:
- generated types
- low-level config
- shared/env

db/ should not import:
- agent/
- app/
- services/
- core business orchestration
App rules
app/ may import:
- services through server actions/route handlers
- contracts
- components
- packages/ui
- packages/flags

app/ should not own:
- accounting invariants
- agent policy
- direct DB mutations
Contracts rules
contracts/ may import:
- zod or schema libraries
- shared primitive types where needed

contracts/ should not import:
- services/
- agent/
- app/
- db/
12. What this means for rejecting DDD

Rejecting DDD means:

No src/modules/ as the primary source structure.

No forced bounded-context folders.

No generic domain/application/infrastructure/ui template.

No need to pre-decide six product modules as code boundaries.

No “feature lives in exactly one module folder” rule.

But it does not mean:

No domain discipline.

No pure rules.

No clear boundaries.

No product map.

No workflow map.

No feature ownership.

No contracts.

No invariants.

The replacement is:

Agent-first authority-gradient architecture.

This is more custom-fit for CHOUnting.

13. What to tell the CTO directly

I would frame it like this:

We should not use DDD as the primary /src organizing principle. CHOUnting’s load-bearing architectural seam is not bounded contexts; it is the authority gradient between the AI agent, agent tools, deterministic services, pure accounting/evidence rules, and the database. Product modules and workflow arcs remain essential planning artifacts, but source code should be organized by authority layer so the agent boundary is explicit, auditable, and enforceable.

Then:

Routes remain workflow-shaped. Product modules remain documented in docs/00_product. Delivery phases remain branch/worktree units. Feature flags control runtime rollout. But implementation slices across agent/, contracts/, services/, core/, and db/.

14. Recommended migration plan
Step 1 — Keep current repo shape

No monorepo redesign.

Keep:

apps/web
apps/demo
packages/ui
packages/tokens
docs
supabase
scripts
tests

Add later:

packages/flags
Step 2 — Move worktrees out of .claude/

Target:

~/projects/chounting-worktrees/

Move Phase 1 first.

Move Phase 0 too unless governance explicitly requires its current path.

Step 3 — Add architecture docs

Create/update:

docs/03_architecture/authority-gradient.md
docs/03_architecture/agent-tool-architecture.md
docs/03_architecture/agent-ladder.md
docs/03_architecture/folder-structure.md
docs/03_architecture/branching-and-feature-flag-strategy.md
docs/03_architecture/product-workflow-delivery-mapping.md
Step 4 — Add or formalize contracts/agent-tools/

This is probably the highest-leverage first source change.

Move or centralize tool schemas here:

apps/web/src/contracts/agent-tools/

This makes AI tool boundaries explicit.

Step 5 — Restructure agent/tools/ by capability

Current agent tool files should move toward:

agent/tools/
├── ledger/
├── onboarding/
├── document/
├── evidence/
└── reference/

This is not DDD. It is tool-surface organization.

Step 6 — Add agent/policies/agent-ladder/

Create:

apps/web/src/agent/policies/agent-ladder/

Initial files can be minimal:

README.md
types.ts
canInvokeTool.ts
promotionRules.ts
demotionRules.ts

Even if enforcement is partial at first, the folder gives Phase 2 a clear home.

Step 7 — Extract pure logic into core/ only when touched

Do not mass-refactor.

First pilot candidate:

core/ledger/

Extract pure pieces from journal-entry service:

balance math
posting rules
reversal line construction
period predicates
money handling

Leave DB writes and audit recording in services.

Step 8 — Keep services as deterministic engine

Do not split every service into DDD subfolders.

Instead, clarify:

services/accounting/
services/evidence/
services/audit/
services/auth/
services/org/

Services can be larger than pure functions because they coordinate real operations.

Step 9 — Add packages/flags/

Use feature flags to gate:

- workflow entry points;
- agent tools;
- risky enforcement behavior;
- staged rollout capabilities.

But do not let flags replace:

- Agent Ladder policy;
- service invariants;
- DB constraints;
- audit logging.
15. CTO decision points
Decision 1 — Architecture name

Recommended:

Agent-first authority-gradient architecture

Alternative:

AI-control-surface architecture

Avoid:

DDD modular monolith
Decision 2 — Pure logic folder name

Recommended if rejecting DDD terminology:

core/

Alternative if CTO is comfortable with the term:

domain/

I recommend:

core/

because it avoids reopening the DDD debate.

Decision 3 — Tool contracts location

Recommended:

apps/web/src/contracts/agent-tools/

If multiple apps need these contracts later, promote to:

packages/agent-contracts/

Do not extract prematurely.

Decision 4 — Agent Ladder home

Recommended:

apps/web/src/agent/policies/agent-ladder/

Durable ladder state, if any, should be persisted through services and DB, not held only in agent memory.

Decision 5 — Phase 1 pilot

Recommended first pilot:

1. contracts/agent-tools/
2. agent/tools/ capability grouping
3. core/ledger/ or core/evidence/ extraction only where Phase 1 needs it

Do not start with a full source-tree refactor.

16. Final proposed standard

The final standard becomes:

Repo:
Monorepo with apps/web, apps/demo, packages, docs, supabase.

Worktrees:
Phase worktrees live outside the repo under ~/projects/chounting-worktrees/.

Product map:
Product → Module → Feature → Requirement → Task.

Workflow map:
Workflow Arc → Stage → Workflow Session → Step.

Delivery map:
Delivery Phase → Phase Branch → Worktree → Build Chunk → Commit.

Runtime rollout:
Feature Flag → Cohort → Ramp → Retirement.

Source architecture:
Agent-first authority-gradient architecture.

apps/web/src/app:
Workflow-shaped routes.

apps/web/src/agent:
Cognitive layer, tool dispatch, prompts, memory, policies, Agent Ladder.

apps/web/src/contracts:
Formal schemas for agent tools, APIs, events.

apps/web/src/services:
Deterministic engine, invariants, transactions, audit, permissions.

apps/web/src/core:
Pure deterministic rules and calculations.

apps/web/src/db:
Persistence boundary.

packages/flags:
Runtime rollout flags.

docs:
The source of truth for product/workflow/delivery mappings and architectural rules.
