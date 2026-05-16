# Product / Workflow / Delivery Mapping

The four maps that describe CHOUnting from four different
angles, and how they relate to each other.

> **Vocabulary formalization landed in `glossary.md` per the B.5
> rules-substrate session (PR #4, merged 2026-05-06).** The
> Product Vocabulary and Delivery Vocabulary subsections plus
> the Stage/Phase clarification are now canonical.

This doc consolidates CTO Handoff v2 §9 (the four-maps matrix)
and serves as the bridge between planning artifacts (product map,
workflow map, delivery map) and source code (the
authority-gradient layout per ADR-0020).

**Canonical sources:**

- `docs/07_governance/CTO_HANDOFF_V2.md` §9 (the four-maps
  matrix), §5 (how a feature maps across the new structure),
  §6 (Document Upload example), §10 (delivery phases).
- `docs/02_specs/glossary.md` — Workflow Vocabulary section
  (Arc / Phase / Session / Sub-session hierarchy; codified
  2026-04-26). The B.5 follow-on session adds the Product
  Vocabulary and Delivery Vocabulary subsections.
- `docs/03_architecture/folder-structure.md` — the source-tree
  layout that delivery slices traverse.
- `docs/03_architecture/branching-and-feature-flag-strategy.md`
  — the branching cadence that delivery phases follow.
- `docs/00_product/product_vision.md` — the product positioning
  (control surface; multi-entity consolidation; AP automation).
- `docs/07_governance/adr/0020-agent-first-authority-gradient-source-architecture.md`
  — the ADR ratifying the source-tree axis these maps reference.

## The four maps

Four orthogonal axes describe the product. Each answers a
different question; together they describe what CHOUnting is,
how users move through it, when and where it gets built, and
how rolled-out behavior reaches users.

### Map 1 — Product

> What exists in the software?

```
Product
└── Module
    └── Feature
        └── Requirement
            └── Task
```

**Examples:**

- Product: CHOUnting
- Module: Document Core, Double Entry, Client Core, Agent
  Control Surface, Evidence Core, AP Automation, Reporting
- Feature: Document Upload, Post Journal Entry, Reverse Journal
  Entry, Vendor Master, Period Lock
- Requirement: "Document upload accepts PDF and image files"
- Task: implementation work units

**Source-tree home:** `docs/00_product/`. Modules are documented;
they are NOT source folders. Per ADR-0020 Decision item 1 +
CTO Handoff v2 §1, source code is organized by authority layer
(per `docs/03_architecture/folder-structure.md`), not by product
module.

### Map 2 — Workflow

> How does the user move through it?

```
Workflow Arc
└── Stage
    └── Workflow Session
        └── Step
```

**Examples:**

- Workflow Arc: Bookkeeping Intake to Ledger; Period Close;
  AP Automation; Reporting Cycle
- Stage: Document Intake; Journal Entry Composition; Period
  Reconciliation
- Workflow Session: "Upload client document package"; "Compose
  manual journal entry"; "Approve AP bundle"
- Step: "User uploads bank statement"; "Agent proposes journal
  entry"; "User approves Proposed Entry Card"

**Source-tree home:** `docs/01_workflows/` (forward-looking; the
workflow-map document lives there per CTO Handoff v2 §9). UI for
workflow Stages lives at
`apps/web/src/app/[locale]/[orgId]/(workflows)/<workflow>/`.

The `(workflows)/` route group is the source-tree presence of
the Workflow map; route groups inside it are workflow Stages.

### Map 3 — Delivery

> When and where do we build it?

```
Delivery Phase
└── Phase Branch
    └── Worktree
        └── Build Chunk
            └── Commit
```

**Examples:**

- Delivery Phase: Phase 1 (Storage / Evidence Core); Phase 2
  (Interaction Model Extraction)
- Phase Branch: `phase/1-storage-evidence-core`; `phase/2-interaction-model`
- Worktree: `.claude/worktrees/phase-1-storage-evidence-core/`
  (current); aspirational target `~/projects/chounting-worktrees/
  phase-1-storage-evidence-core/`
- Build Chunk: a session-shaped unit of work within a phase
  (e.g., "Phase 1 chunk 1: storageProviderService")
- Commit: individual git commits

**Source-tree home:** `docs/09_briefs/phase-1/`,
`docs/09_briefs/phase-1.2/`, `docs/09_briefs/phase-1.5/`,
`docs/09_briefs/phase-2/`. Phase folders are planning artifacts.
Delivery phases are NOT source folders; per ADR-0020 there is
no `apps/web/src/phase-1/`.

### Map 4 — Runtime rollout

> When does merged code become visible or active?

```
Feature Flag
└── Cohort
    └── Ramp
        └── Retirement
```

**Examples:**

- Feature Flag: `evidence_storage_v1`,
  `agent_ledger_posting_tool_enabled`, `agent_autonomy_controls_ui_enabled`
- Cohort: alpha users; controllers-only; 10% rollout; full
  rollout
- Ramp: 0% → 1% → 10% → 50% → 100%
- Retirement: flag removed from code after rollout completes
  and the new behavior is the default

**Source-tree home:** `packages/flags/` (forward-looking; ships
when Phase 2 needs it per ADR-0020 Out of Scope). Per
`docs/03_architecture/branching-and-feature-flag-strategy.md`,
flags are runtime rollout control, not authority.

## How the four maps connect

A user step is **one row that traverses all four maps:**

```
User Step
→ powered by Feature
→ owned by Product Module
→ implemented by Requirements / Tasks
→ built during a Delivery Phase
→ isolated in a Phase Worktree
→ merged to staging at phase ratification
→ promoted to main at release tags
→ exposed through Feature Flags to specific Cohorts
```

The maps' connection is the bridge between planning artifacts and
shipped code. A new feature does NOT live in a single folder; it
is a **vertical slice** through the authority layers per ADR-0020.

## How a feature maps across the source tree

CTO Handoff v2 §5 names the canonical example: posting a journal
entry. Under the agent-first organizing axis (per ADR-0020), the
feature decomposes:

```
Feature: Post Journal Entry to Ledger
Module: Double Entry
Workflow: Bookkeeping Intake to Ledger / Manual Entry Stage
Phase: Phase 1+ (Phase 1.2 already shipped the v1 flow)

Source-tree slice:
  Workflow route:
    apps/web/src/app/[locale]/[orgId]/(workflows)/ledger/

  Agent tool:
    apps/web/src/agent/tools/ledger/postJournalEntry.tool.ts

  Tool contract:
    apps/web/src/contracts/agent-tools/ledger/postJournalEntry.contract.ts

  Service:
    apps/web/src/services/accounting/journalEntryService.ts

  Pure rules:
    apps/web/src/core/ledger/postingRules.ts
    apps/web/src/core/ledger/balanceDebitsAndCredits.ts
    apps/web/src/core/period/isPeriodLocked.ts

  Persistence:
    apps/web/src/db/repositories/journalEntriesRepository.ts
    apps/web/src/db/repositories/fiscalPeriodsRepository.ts

  Audit:
    apps/web/src/services/audit/recordMutation.ts

  Feature flag (when packages/flags ships):
    packages/flags/src/accounting.ts
```

Per CTO Handoff v2 §5: "A product feature does not live in one
folder. A product feature is a traceable vertical slice through
the authority gradient."

## How a delivery phase touches authority layers

Phase 1 (Storage / Evidence Core) is the first delivery phase
post-Phase-0. Its slice traverses:

| Authority layer | Phase 1 slice |
|---|---|
| `app/` | `(workflows)/intake/` route group when intake UI ships |
| `agent/tools/` | `agent/tools/evidence/` capability dir |
| `contracts/agent-tools/` | `contracts/agent-tools/evidence/` capability dir |
| `services/` | `services/storage/` (chunk 1 lands here), `services/evidence/` |
| `core/` | `core/evidence/` (pure evidence rules) |
| `db/` | `db/repositories/evidenceRepository.ts` (first concrete repo) |
| `supabase/migrations/` | new migrations for evidence tables |
| `packages/flags/` | `packages/flags/src/evidence.ts` (when packages/flags ships) |
| Planning | `docs/09_briefs/phase-1/` (brief, exit criteria, retrospective) |
| Architecture | `docs/03_architecture/authority-gradient.md` etc. (already in place) |

The phase ships in chunks; chunk 1 is the first commit on
`phase/1-storage-evidence-core`. The phase ratifies and merges to
`staging` at phase exit per
`docs/03_architecture/branching-and-feature-flag-strategy.md`.

## The four-maps matrix

A representative row of the matrix bridges all four maps to a
specific source slice (per CTO Handoff v2 §9). Examples:

| Product Module | Feature | Workflow Step | Agent Tool | Service | Core Rule | Phase | Flag |
|---|---|---|---|---|---|---|---|
| Document Core | Document Upload | Upload bank statement | `uploadDocument` | `storeDocumentEvidenceService` | `evidenceMetadataRules` | Phase 1 | `document_upload_enabled` |
| Double Entry | Post entry to ledger | Approve / post transaction | `postJournalEntry` | `journalEntryService` | `postingRules` | Phase 1.2 (shipped) | `ledger_posting_enabled` |
| Double Entry | Debit/Credit Validation | Validate entry before posting | n/a (service-internal) | `journalEntryService` | `balanceDebitsAndCredits` | Phase 1.1 (shipped) | `balanced_entry_required_for_posting` |
| Agent Control Surface | Tool Permissioning | Agent attempts action | all tools | service boundary | n/a | Phase 2 | `agent_autonomy_controls_ui_enabled` |
| AP Automation | Vendor Bill Approval | Approve AP bundle | `approveBundle` | `bundleApprovalService` (forthcoming) | `bundleEffectiveCeiling` (per ADR-0012 §9) | Phase 5 (Spend) | `ap_bundle_approval_enabled` |

The matrix is the auditor-facing artifact: given any one cell,
one can trace through to the others. It does NOT live in this
doc as the canonical matrix; it lives in
`docs/00_product/product-map.md` (created 2026-05-06 in the
B.5 rules-substrate session). This doc shows the cross-map
relationship and representative rows.

## Vocabulary distinctions (introduced conceptually only)

The four-maps framing surfaces five distinct uses of "stage" /
"phase" / "module" — terms that overlap colloquially but carry
specific meanings in the CHOUnting framework. These distinctions
are **introduced conceptually here**; the canonical glossary
entries landed in B.5 (PR #4).

| Term | Map | Granularity | Example |
|---|---|---|---|
| **Module** | Product map | second-level (under Product) | Document Core; Double Entry; AP Automation |
| **Stage** | Workflow map | second-level (under Workflow Arc) | Document Intake; Journal Entry Composition |
| **Workflow Stage** | Workflow map | synonym for Stage; disambiguates from *Delivery Phase* | (same as Stage) |
| **Workflow Phase** | Workflow map | NOT a standard term in this framework; if used, means a longer Stage spanning multiple Workflow Sessions | (informal) |
| **Delivery Phase** | Delivery map | top-level (Delivery Phase → Phase Branch) | Phase 0 (Governance); Phase 1 (Storage); Phase 2 (Interaction Model) |

B.5 (PR #4) formalized these into `glossary.md` with
cross-references and authoritative disambiguation. The glossary
entries are canonical; this doc holds the conceptual
introduction.

## Why the four maps stay separate

A v1 architectural temptation was to collapse the product /
workflow / delivery maps into a single "feature" hierarchy where
a product module owned a folder, a workflow lived inside the
module, and a phase delivered the workflow. The v2 acceptance
explicitly rejects that collapse:

- A **feature** spans authority layers; it doesn't fit into a
  single product-module folder.
- A **workflow** is how users move through features; it doesn't
  belong in a product-module subfolder either (a single workflow
  may touch multiple modules — e.g., AP Automation touches
  Document Core, Double Entry, AP Automation).
- A **delivery phase** is a temporary integration lane; it
  doesn't belong inside a product folder because phases come and
  go while modules persist.
- A **runtime flag** is rollout control; it isn't owned by
  anything in the source tree until it lands in
  `packages/flags/`.

Keeping the four maps separate gives each axis its own purpose
and prevents a single hierarchy from carrying four conflicting
roles.

## Cross-references

- `docs/07_governance/CTO_HANDOFF_V2.md` §5 (feature mapping),
  §9 (four-maps matrix), §10 (delivery phases as slices not
  folders).
- `docs/02_specs/glossary.md` — Workflow Vocabulary section;
  Product / Delivery vocabulary additions land in B.5 session.
- `docs/03_architecture/folder-structure.md` — the
  authority-layer folder layout that delivery slices traverse.
- `docs/03_architecture/branching-and-feature-flag-strategy.md`
  — the branching cadence delivery phases follow.
- `docs/03_architecture/authority-gradient.md` — the four-layer
  framing each feature slice traverses.
- `docs/03_architecture/agent-tool-architecture.md` — the
  call chain a feature traverses at runtime.
- ADR-0020 — the ratifying ADR for the source-tree axis these
  maps reference.
- `docs/00_product/product_vision.md` — product positioning
  (control surface, multi-entity, AP automation).

## Out of scope for the 2026-05-05 substrate session

- **Workflow map document** at `docs/01_workflows/workflow-map.md`
  — deferred to a workflow-mapping session post-Phase-1.
- **`packages/flags/` package introduction** — deferred until
  Phase 2 needs it.
