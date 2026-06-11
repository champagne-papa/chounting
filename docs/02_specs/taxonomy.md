# Docs Taxonomy

Canonical values for frontmatter fields used across ADRs, briefs,
and spec / architecture / engineering documents. **Single source of
truth.** The linter at `scripts/adr/lint.ts` reads this file;
future linters for briefs and for spec / architecture / engineering
frontmatter (round-2 docs reorganization Session 6) read the same
file.

This file enumerates allowed *values*; the
[glossary](./glossary.md) defines *terms*. The two are operationally
connected: a term in the glossary may have one or more values in
this taxonomy (e.g., the glossary defines "Phase" as a Workflow
Vocabulary concept; this taxonomy enumerates the active phase
values used in frontmatter).

## How to change this file

**Adding a value.** Add the row, run the linter, commit alongside
the first ADR or doc that uses the new value. Do not add
speculative values — the codification threshold is "first
consumer," matching the substrate-now-enforcement-later cross-
pattern from ADR-0010 and the codification thresholds in
[`conventions.md`](../04_engineering/conventions.md) §
"Documentation Routing."

**Removing a value.** Only when no existing ADR or doc references
it. The linter's reverse-reachability check catches dangling
references — if a frontmatter field cites a removed value, lint
fails.

**Renaming a value.** Write an ADR for the rename, then update
this file and every doc that references the old name in the same
commit. Do not stage the rename across commits — a half-renamed
state fails the linter and pollutes blame chains.

## Modules

Source: `apps/web/src/services/*` + `packages/*` + canonical
aggregates. Modules name areas of product capability or layered
infrastructure. A doc tagged with module `accounting` covers the
ledger / journal-entry / period domain; a doc tagged with module
`infra` covers cross-cutting repo / CI / tooling concerns.

| Value | Source | Description |
|---|---|---|
| accounting | `apps/web/src/services/accounting/` | Ledger, journal entries, posting, balance, periods, chart of accounts |
| agent | `apps/web/src/agent/` (cognitive layer) + `services/agent/` (cross-cutting agent concerns) | Orchestrator, tools, prompts, memory, ladder policies, persona |
| app-components | `apps/web/src/components/` | App-specific frontend components (canvas surfaces, bridge UI) consumed by app routes; below services in the authority gradient — HTTP is the only boundary to services (ADR-0020). Distinct from `ui` (packages/ui primitives). |
| audit | `apps/web/src/services/audit/` | Audit log, mutation traces, before-state capture, evidence preservation |
| auth | `apps/web/src/services/auth/` | Authentication, MFA, permissions, role-action authorization |
| contracts | `apps/web/src/contracts/` | Formal agent-tool / API / event contracts (Zod schemas, type envelopes) |
| core | `apps/web/src/core/` | Pure deterministic rules — no DB, no I/O, no agent (per ADR-0020) |
| db | aggregate — `apps/web/src/db/` + `supabase/` | Persistence boundary: admin client, generated types, repositories, migrations |
| document-platform | `apps/web/src/services/document-platform/` | Document Platform substrate per ADR-0011 (storage, classification, extraction, relationship graph) |
| evidence | `apps/web/src/services/evidence/` | Evidence artifacts, evidence metadata, evidence storage |
| infra | aggregate — `scripts/`, `.github/workflows/`, repo-root tooling | CI, deployment, repo conventions, scripts, hooks, generators, linters |
| middleware | `apps/web/src/services/middleware/` | Service middleware: `withInvariants`, error handling, request context |
| org | `apps/web/src/services/org/` | Organizations, org profile, MFA settings, org-level configuration |
| reporting | `apps/web/src/services/reporting/` | Reports: trial balance, P&L, balance sheet, period reports |
| rules | `apps/web/src/services/rules/` | Rule type core: rule registry, evaluation, track-records, vendor rules, authoring, branch/condition substrate; the Agent Ladder rule coordinator in `agent/policies/agent-ladder/` is tagged `agent` |
| shared | `apps/web/src/shared/` | Cross-layer primitives importable by every layer (core / services / agent / app): branded types, Zod schemas, shared evaluation/predicate types, money + logger helpers. |
| storage | `apps/web/src/services/storage/` | Storage abstraction layer per ADR-0013 (Supabase storage primary, multi-backend reserved) |
| tokens | `packages/tokens/` | Design tokens for the UI system |
| ui | `packages/ui/` | Reusable UI primitives (Button, Card, Dialog, etc.) |
| user | `apps/web/src/services/user/` | Users, invitations, user profile, role assignment |
| all | aggregate | Truly cross-cutting infrastructure decisions that span all modules |

## Features

Source: `docs/00_product/product-map.md`.

**Status: deferred.** The product map currently enumerates Product
Modules (Document Core, Double Entry, Client Core, Identity &
Access, Audit, Reporting, Agent Control Surface) under a
"tentative-until-evidenced" rule, but does not yield a flat list
of Features at the granularity that frontmatter requires. Per the
"do not guess" rule, this section ships with the header and this
status note rather than a guessed value list.

When `product-map.md` either (a) graduates to enumerating
Features under each module, or (b) the first ADR or brief needs
to cite a specific Feature value, the gap will surface and a
Feature taxonomy row addition lands at that time. Until then, ADR
frontmatter `features: []` is the correct empty-array shape;
frontmatter `features: [<guessed>]` is rejected by the linter
(the value won't exist in this section).

## Delivery phases

Source: `docs/09_briefs/phase-*/` directory listings + planning
context per `docs/09_briefs/CURRENT_STATE.md`. Each phase value
matches the folder name exactly.

| Value | Source folder | Status |
|---|---|---|
| phase-1.1 | `09_briefs/phase-1.1/` | closed |
| phase-1.2 | `09_briefs/phase-1.2/` | closed |
| phase-1.3 | `09_briefs/phase-1.3/` | active |
| phase-1.5 | `09_briefs/phase-1.5/` | closed |
| phase-2 | `09_briefs/phase-2/` | active (planning) |
| post-mvp | `09_briefs/post-mvp/` | active |

**Forthcoming phase values** that will land in this table when
their folders create:

- `phase-0` — governance arc work currently lives at
  `phase-2/2026-05-0*-*` files; lands at round-2 Session 5
  (Phase 0 governance file move from `phase-2/` to a new `phase-0/`).
- `phase-1` — Storage / Evidence Core delivery phase per
  ADR-0013 + ADR-0014 + ADR-0020 Sub-verification 1; folder
  creates when Phase 1 chunk 1 ships.
- `phase-5` — Spend Initiative implementation arc per
  `phase-2/spend_initiative.md`; folder creates when Phase 5
  chunk B5-1 ships substantive work.

This table reflects Session 3 commit-time state and updates in
place as new phase folders create.

## Concerns

Cross-cutting topical tags used by ADRs and (round-2 Session 6
onward) by spec / architecture / engineering frontmatter. Concerns
are descriptive (what does this doc cover?), not prescriptive
(which folder owns it?). A doc may carry multiple concerns.

| Value | Description |
|---|---|
| accounting | Ledger truth, money, FX, periods, double-entry rules |
| agent | Agent layer, tools, contracts, autonomy, ladder, persona |
| audit | Audit log, control matrix, before-state, evidence preservation |
| data-model | Schema, constraints, indexes, migrations, type generation |
| delivery | Branching, phases, worktrees, flags, ratification, merge rules |
| documentation | Doc routing, conventions, hygiene, taxonomy, linters |
| invariants | INV-ID rules, enforcement layers, bidirectional reachability |
| performance | Bulk operations, caching, indexes, N+1 avoidance |
| security | Auth, RLS, env handling, log redaction, secret hygiene |
| testing | Test strategy, coverage, mutation testing, floor tests |
| tooling | Scripts, CI, linters, generators, build tools |
| ui | Canvas, components, frontend architecture, design tokens |

## Audiences

Audience values used by Session 6 frontmatter (specs,
architecture, engineering). Used to filter generated indexes by
reader role.

| Value | Description |
|---|---|
| agent | WSL Claude or synthesis Claude consuming docs as context |
| auditor | External auditor or compliance reviewer |
| contributor | Human engineer working on the codebase |
| operator | Project operator (philc) for orchestration concerns |

## Cross-references

- [`docs/02_specs/glossary.md`](./glossary.md) — canonical
  vocabulary definitions. This taxonomy lists allowed values; the
  glossary defines what the underlying terms mean.
- [`docs/02_specs/invariants.md`](./invariants.md) — INV-ID
  rollup index. The linter cross-references this file to validate
  the `invariants` frontmatter field on ADRs.
- [`docs/00_product/product-map.md`](../00_product/product-map.md)
  — feature taxonomy source (currently deferred per the Features
  section above).
- [`docs/03_architecture/folder-structure.md`](../03_architecture/folder-structure.md)
  — module taxonomy source (the authority-layer source-tree per
  ADR-0020).
- [`docs/07_governance/adr/README.md`](../07_governance/adr/README.md)
  — ADR frontmatter schema; ADR-0021 documents the conventions.
- [`docs/09_briefs/README.md`](../09_briefs/README.md) — brief
  frontmatter schema (lands at round-2 Session 5).
- `scripts/adr/lint.ts` — primary linter consuming this file.
- `scripts/adr/generate-index.ts` — primary generator that uses
  this file's values to organize ADR index sections.
