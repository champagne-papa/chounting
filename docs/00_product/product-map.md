# Product Map

This doc captures the **Product map** (what exists in the
software). It is documentation, not source-folder structure.
Per ADR-0020, source code is organized by authority layer
(`agent/`, `services/`, `core/`, `db/`, `contracts/`); product
modules live here.

A **Product Module** is a coherent area of product capability —
a documentation concept used in product planning, roadmap
discussions, and feature ownership. A feature implementation
slices through authority layers; the module is where the feature
is documented, not where its code lives.

## Canonical sources

- `docs/00_product/product_vision.md` — the Thesis
- `docs/02_specs/glossary.md` — Product Vocabulary subsection
- `docs/03_architecture/folder-structure.md` (ADR-0020) —
  where code actually lives
- `docs/03_architecture/product-workflow-delivery-mapping.md` —
  the four-maps cross-reference

## The Thesis (anchor)

From `docs/00_product/product_vision.md`:

> This system is not an accounting UI with AI assistance. It is
> a deterministic financial engine with a probabilistic
> interface. Agents interpret intent and propose actions.
> Services execute domain logic deterministically. The database
> enforces invariants absolutely. Authority flows down;
> structured errors flow up.

Modules below are organized so a feature's product home is
easy to identify, while the source code that implements the
feature remains organized by authority layer.

## Module index (currently-recognized)

> **Tentative-until-evidenced rule.** Module names below are
> working planning vocabulary, not commitments. A Product
> Module graduates from tentative to canonical only when it:
>
> - appears in multiple workflow arcs, OR
> - owns distinct product obligations across phases, OR
> - requires separate roadmap / docs tracking, OR
> - has at least one shipped feature documented under it.
>
> Until a module meets one of those criteria, its name may be
> amended without requiring an ADR. Module rename to source
> folder is **not** permitted; source code remains organized
> by authority layer regardless of module name changes.

### Document Core (Phase 1+)

Document upload, storage, classification, extraction, evidence
artifacts. The substrate ships in Phase 1 (Storage / Evidence
Core, per ADR-0013); per-feature ships through Phase 2 (intake
UX) and Phase 3 (extraction / review).

Cross-references:
- `docs/02_specs/data_model.md` evidence-related tables
- `docs/07_governance/adr/0011-document-platform.md`
- `docs/07_governance/adr/0013-storage-provider.md`
- `docs/07_governance/adr/0014-tier-2-document-pipeline.md`

### Double Entry (Phase 1.2 shipped, Phase 3+ extends)

Journal entries, reversals, posting, balance validation,
periods, chart of accounts. Phase 1.2 shipped the agent-side
posting tools; Phase 3+ extends with reporting, period close,
adjustments.

Cross-references:
- `docs/02_specs/ledger_truth_model.md`
- `docs/07_governance/adr/0001-reversal-semantics.md`
- `docs/07_governance/adr/0008-layer-1-enforcement-modes.md`
- `docs/07_governance/adr/0012-proposed-mutation-bundle.md`

### Client Core (Phase 2+)

Client profiles, engagements, document linking, multi-client
workflows. Tentative; ships when Phase 2 names a workflow that
needs explicit client-context separation. The current shape is
implicit in `org` and membership tables; explicit Client Core
emerges when family-office flows formalize.

### Identity & Access (Phase 1.5 shipped)

Orgs, users, MFA, invitations, permissions, roles. Foundational
substrate; Phase 1.5 A/B/C shipped the canonical shape.

Cross-references:
- `docs/07_governance/adr/0003-one-voice-agent-architecture.md`
  (persona + auth interaction)
- `docs/02_specs/data_model.md` org / user / membership tables

### Audit (Phase 1.1+, foundational)

Audit log, mutation traces, evidence preservation,
before-state capture. Phase 1.1 Simplification 1 established
the synchronous-same-transaction audit log shape.

Cross-references:
- `docs/07_governance/adr/0009-before-state-capture-convention.md`
- `docs/02_specs/ledger_truth_model.md` INV-AUDIT-001
- `docs/03_architecture/phase_simplifications.md`
  (Simplification 1)

### Reporting (Phase 4+)

P&L, balance sheet, trial balance, period reports. Far-future;
substrate emerges when Phase 4 names the reporting requirements.
Listed here as a tentative module so reporting-shaped work has
a documentation home when it surfaces; treat as a placeholder
until evidence ratifies.

### Agent Control Surface (Phase 1.2+)

The cognitive layer, tool permissioning, Agent Ladder, persona
discipline, dry-run model. Phase 1.2 shipped the canonical
agent architecture; Phase 2 extends with interaction model
extraction and Agent Ladder substrate.

Cross-references:
- `docs/02_specs/agent_autonomy_model.md`
- `docs/03_architecture/agent-tool-architecture.md`
- `docs/03_architecture/agent-ladder.md`
- `docs/07_governance/adr/0007-three-tier-agent-architecture.md`
- `docs/07_governance/adr/0017-vendor-template-substrate.md`
- `docs/07_governance/adr/0019-confidence-calibration-policy.md`

## What this doc is NOT

- **Not a folder structure.** Source code organization is per
  ADR-0020, by authority layer (`agent/`, `services/`, `core/`,
  `db/`, `contracts/`). New modules do not require source-folder
  changes.
- **Not a commitment to module names being final.** The
  tentative-until-evidenced rule above governs graduation.
- **Not a constraint on the source tree.** A feature
  implementation slices across authority layers regardless of
  which module it belongs to. The module is the documentation
  home; the layers are the runtime homes.
- **Not the roadmap.** The roadmap lives in
  `docs/03_architecture/phase_plan.md` and the phase briefs at
  `docs/09_briefs/phase-N/`. Module status above ("Phase 1.2
  shipped", "Phase 4+", etc.) is a current-state marker, not
  a forward commitment.

## Cross-reference

For where code actually lives:
- `docs/03_architecture/folder-structure.md`
- `docs/07_governance/adr/0020-agent-first-authority-gradient-source-architecture.md`

For workflow ↔ module ↔ delivery cross-mapping:
- `docs/03_architecture/product-workflow-delivery-mapping.md`

For vocabulary distinctions (Module vs Stage vs Phase):
- `docs/02_specs/glossary.md` — Product Vocabulary, Workflow
  Vocabulary, Delivery Vocabulary subsections.

## Codification status

This map codifies module names at **N=tentative**. Each module
above has at least one cross-reference to a canonical doc that
already exists, but module names themselves are amenable until
product evidence ratifies them (per the tentative-until-
evidenced rule). When a module graduates — for example, when
"Document Core" sees its first shipped feature in Phase 1 — the
module's status updates here in place; the rest of the map
stays as-is.
