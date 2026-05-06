# Folder Structure

The canonical `apps/web/src/` tree with one-line semantic
descriptions. Ratified by ADR-0020 (Agent-First Authority-Gradient
Source Architecture, 2026-05-05) per CTO Handoff v2 §3.

## Top-level (canonical layout)

```
apps/web/src/
├── app/                # workflow-shaped routes and surfaces
├── agent/              # cognitive layer
├── contracts/          # formal agent / API / event contracts
├── services/           # deterministic engine
├── core/               # pure deterministic rules
├── db/                 # persistence boundary
├── components/         # CHOUnting-specific shared UI
├── hooks/              # cross-cutting React hooks
├── lib/                # cross-cutting non-React utilities
├── shared/             # shared primitives (env, logging, types)
└── middleware/         # Next.js middleware (auth, locale, etc.)
```

Runtime authority layers are **DB**, **Services**, **Agent**,
and **Governance**. The source tree also contains `contracts/`
as a **boundary artifact** (formal Zod / TypeScript schemas at
the agent ↔ services seam) and `core/` as a **pure-rule library**
called by services. Neither `contracts/` nor `core/` is an
authority layer.

The canonical request / source traversal is:

```
app/ → agent/ → contracts/ → services/ → core/ → db/
```

This traversal crosses authority layers (Agent → Services → DB)
and passes through boundary / library nodes (`contracts/`,
`core/`), but the traversal itself is **not** the authority
gradient. `components/`, `hooks/`, `lib/`, `shared/`, and
`middleware/` are cross-cutting and outside the traversal.

## `app/` — workflow-shaped routes and surfaces

The human-facing route layer; a Next.js App Router tree. Routes
should be thin: they call services, server actions, or
module-level surfaces; they do NOT own accounting rules or agent
policy.

```
app/
├── layout.tsx                          # root shell
├── globals.css                         # global styles
├── not-found.tsx                       # 404
├── error.tsx                           # root segment error boundary
├── global-error.tsx                    # true root/global error fallback (renders own <html>/<body>)
├── [locale]/                           # i18n routing (en / fr-CA / zh-Hant)
│   ├── layout.tsx                      # locale-specific shell
│   ├── error.tsx
│   ├── loading.tsx
│   └── [orgId]/                        # multi-tenant routing
│       ├── error.tsx
│       ├── loading.tsx
│       ├── (workflows)/                # workflow-arc-shaped route group (Phase 1+)
│       │   ├── intake/
│       │   ├── ledger/
│       │   ├── review/
│       │   └── reporting/
│       ├── (settings)/                 # org / user settings route group
│       └── (admin)/                    # admin-tier route group
└── api/                                # API route handlers (route.ts files)
```

The `(workflows)/` route group is **forward-applying**: routes
are added inside it as workflow arcs ship per
`docs/03_architecture/product-workflow-delivery-mapping.md`. The
group does not exist as an empty placeholder in v1; it
materializes when its first workflow surface ships.

**Client/server boundary inside `app/`.** Per ADR-0020
Appendix A, **client components** (`'use client'` files under
`app/` or `components/`) must NOT import from `services/`,
`agent/`, `db/`, or server-only contracts. Client components
interact with the server through server actions, route handlers,
or typed UI-safe props/contracts. The full rule lives in
ADR-0020 Appendix A's App rules block; the ESLint rule scaffold
at `eslint-rules/agent-first-import-boundaries.js` carries the
constraint and enforces it when the rule activates at Phase 1
chunk 1.

## `agent/` — cognitive layer

The probabilistic interface. Owns orchestration, tool dispatch,
prompts, persona resolution, and policy gates. Per ADR-0020
Appendix A, agent code may import `contracts/`, `services/`,
`shared/`, `packages/flags`; agent code may NOT import
`db/adminClient`, db repositories directly, app routes, or React
components (excepting canvas / surface integration).

```
agent/
├── orchestrator/                # session resolution, persona, tool eligibility
├── tools/                       # tool definitions organized by capability
│   ├── ledger/                  # journal entry operations
│   ├── onboarding/              # first-run org setup
│   ├── document/                # document-level operations
│   ├── evidence/                # evidence-handling operations
│   └── reference/               # read-only lookups
├── policies/                    # cognitive policy layer
│   └── agent-ladder/            # autonomy model implementation (empty home; Phase 2)
├── prompts/                     # system prompt construction
├── memory/                      # context loading; org_context per agent_interface.md
├── date-resolution/             # date-string → typed-date resolution
└── canvas/                      # canvas-context injection (per Phase 1.2)
```

Capability subdirectories under `agent/tools/` (`ledger/`,
`onboarding/`, `document/`, `evidence/`, `reference/`) are
**forward-looking**. They appear when their first tool is
authored or an existing tool is naturally edited; the substrate
session does **not** reorganize `agent/tools/`. The
`policies/agent-ladder/` home is created in the 2026-05-05
substrate session with a README only; concrete implementation
begins Phase 2 per ADR-0020 Decision item 5.

## `contracts/` — formal contracts

Zod schemas that bridge agent-tool surfaces, API surfaces, and
event surfaces. Per ADR-0020 Decision item 4,
`contracts/agent-tools/<capability>/` is the canonical home for
tool input / output / result envelope schemas. Per ADR-0020
Appendix A, contracts may import zod and primitive types only;
contracts may NOT import services, agent, app, or db.

```
contracts/
├── agent-tools/                 # tool input / output / approval metadata
│   ├── ledger/                  # capability subdirs created on first use
│   ├── onboarding/
│   ├── document/
│   ├── evidence/
│   └── reference/
├── api/                         # external API contracts (REST / webhook surfaces)
├── events/                      # event-bus contracts (audit events; Phase 2 events table)
└── public/                      # public-API contracts (forward-looking)
```

The `agent-tools/` subdirectory ships with a README in the
2026-05-05 substrate session; capability subdirs appear when
their first contract is authored.

## `services/` — deterministic engine

The Layer 2 deterministic-engine home. Per the Two Laws
(Law 1: all DB access through `services/`; Law 2: all journal
entries via `journalEntryService.post()`). Subdirectory naming
follows ADR-0011 §14 Domain Boundary Map.

```
services/
├── accounting/                  # journal entries, periods, posting (Double Entry domain)
├── evidence/                    # evidence storage, hashing, metadata
├── audit/                       # audit-log writer; recordMutation
├── auth/                        # authorization checks; canUserPerformAction
├── org/                         # organization mutations and lookups
├── user/                        # user lifecycle, MFA, invitations
├── storage/                     # storage provider abstraction (Phase 1 chunk 1)
└── middleware/                  # withInvariants and supporting middleware
```

`services/storage/`, `services/evidence/`, and the existing
`services/accounting/` are visible at v1 ratification time;
other subdirectories materialize as their first service is
authored. The empty `services/storage/` and `services/evidence/`
ship with `.gitkeep` placeholders in the 2026-05-05 substrate
session.

Per ADR-0020 Appendix A: services may import `core/`, `db/`,
`contracts/`, `shared/`, `packages/flags`; services may NOT
import `agent/`, `app/`, or React components.

## `core/` — pure deterministic rules

Pure deterministic logic — math, validation helpers, rule
predicates, and types. No database, no network, no agent, no UI.
Per ADR-0020 Decision item 2, the chosen name is `core/` (not
`domain/`) to avoid reopening DDD framing.

```
core/
├── ledger/                      # posting rules, balance math, reversal lines
├── period/                      # period-lock predicates, boundary rules
├── chart/                       # chart-of-accounts predicates
├── money/                       # Money type, currency, rounding, FX rules
├── tax/                         # tax-period rules, GST/HST predicates
└── evidence/                    # hashing, metadata validation, evidence rules
```

Files live here only when extracted from existing services per
the opportunistic-migration rule (ADR-0020 Decision item 6).
First population candidate: `core/evidence/` per Phase 1 chunk 1
(`storageProviderService` from ADR-0013). The `core/` and
`core/evidence/` directories ship with READMEs in the 2026-05-05
substrate session; concrete pure-logic files appear as services
are naturally edited and pure portions extract.

Per ADR-0020 Appendix A: `core/` may import `shared/` primitives
only; `core/` may NOT import `db/`, `services/`, `agent/`, `app/`,
contracts that imply transport concerns, or React.

## `db/` — persistence boundary

The Layer 1 persistence boundary. Owns the Supabase admin client,
generated types, and typed query helpers. Per the Two Laws
(Law 1), no other layer reaches the database except through
`services/`.

```
db/
├── adminClient.ts               # service-role client; the only client services import
├── types.ts                     # generated DB types from supabase
└── repositories/                # typed query helpers (entity-shaped)
    ├── journalEntriesRepository.ts        # Phase 1+
    ├── fiscalPeriodsRepository.ts          # Phase 1+
    ├── evidenceRepository.ts               # Phase 1 chunk 1 first consumer
    └── orgRepository.ts                    # Phase 1+
```

The empty `repositories/` directory ships with a `.gitkeep`
placeholder in the 2026-05-05 substrate session; concrete
repository files appear when their first consumer is authored
(opportunistic per ADR-0020 Decision item 6).

Per ADR-0020 Appendix A: `db/` may import generated types,
low-level config, `shared/env`; `db/` should NOT import
`services/` business orchestration, `agent/`, or `app/`.

## `components/` — CHOUnting-specific shared UI

Reusable UI for the Bridge product itself. **Not** the design
system — design-system primitives (Button, Input, Dialog, Modal,
Toast, Table, Card, Dropdown) live in `packages/ui/` per v2 §4.
`components/` carries CHOUnting-specific shared UI:

```
components/
├── layout/                      # AppShell, Sidebar, PageHeader
├── shared/                      # OrgSwitcher, EmptyState
├── canvas/                      # CanvasPanel and contextual-canvas widgets
└── bridge/                      # BridgeView and split-screen primitives
```

Feature-specific UI may live near workflow routes under
`app/[locale]/[orgId]/(workflows)/<workflow>/_components/` or
under `components/` if shared across routes. Per the v2
acceptance, feature UI is NOT forced into a `modules/<feature>/ui`
folder.

## Cross-cutting

- **`hooks/`** — cross-cutting React hooks. Phase 1 has a small
  set; expands as UI grows.
- **`lib/`** — cross-cutting non-React utilities (formatting,
  parsing, etc.). Smaller than `shared/`.
- **`shared/`** — shared primitives: env loading, logging
  configuration, type primitives. Imported by every layer per
  ADR-0020 Appendix A.
- **`middleware/`** — Next.js middleware (auth, locale, MFA
  enforcement). Distinct from `services/middleware/` which holds
  the `withInvariants` wrapper.

## What does NOT live under `apps/web/src/`

- **`packages/flags/`** — feature flag names and config (per
  v2 §10). Forward-looking; created when Phase 2 needs the
  shared package. Per ADR-0020 Out of Scope.
- **`packages/ui/`** — design-system primitives (existing).
- **`packages/tokens/`** — design tokens (existing).
- **`supabase/migrations/`** — DB migrations (top-level).
- **`docs/`** — product / architecture / governance docs
  (top-level).
- **`tests/`** — integration + e2e tests (top-level per the
  monorepo layout).

## Phase folders are NOT source folders

Per ADR-0020 Out of Scope and CTO Handoff v2 §10, **delivery
phases are NOT source folders.** There is no
`apps/web/src/phase-1/`, `phase-2/`, etc. Phase folders live in
`docs/09_briefs/phase-1/`, `docs/09_briefs/phase-1.2/`,
`docs/09_briefs/phase-2/` as planning artifacts; source code
sits under the authority-layer folders above.

A delivery phase touches the authority layers it needs. Phase 1
(Storage / Evidence Core) touches `services/storage/`,
`services/evidence/`, `core/evidence/`,
`db/repositories/evidenceRepository.ts`,
`contracts/agent-tools/evidence/`, `agent/tools/evidence/`,
`app/[locale]/[orgId]/(workflows)/intake/`,
`packages/flags/src/evidence.ts` (when packages/flags ships), and
`supabase/migrations/`. The phase is a slice through the layers,
not a folder of its own.

## Cross-references

- ADR-0020 — Agent-First Authority-Gradient Source Architecture
  (the ratifying ADR for this layout).
- `docs/03_architecture/authority-gradient.md` — the four-layer
  framing each top-level folder maps to.
- `docs/03_architecture/agent-tool-architecture.md` — the
  call chain that traverses these folders at runtime.
- `docs/03_architecture/branching-and-feature-flag-strategy.md` —
  how phase branches and feature flags relate to this layout.
- `docs/03_architecture/product-workflow-delivery-mapping.md` —
  the four-maps matrix that links product modules / workflow
  arcs / delivery phases / runtime flags to source slices.
- `docs/07_governance/CTO_HANDOFF_V2.md` §3 — the canonical v2
  layout (verbatim source for this doc).
