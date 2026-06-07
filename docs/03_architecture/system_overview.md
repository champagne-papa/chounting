# System Overview

What the system is, what its major components are, and how the
source code is organized. The day-one document for a new engineer.

> **Provenance (ADR-0022 §2 lineage).** Body rewritten 2026-06-07 at
> the post-V1 doc-refresh arc, superseding the Phase-1.1-vintage
> body whose full rewrite the 2026-06-01 Wave-0 banner deferred
> (chartered at the V1 Wave-0 retrospective §5). The original body
> was extracted from PLAN.md §1/§1a at the Phase 1.1 closeout
> restructure; the "Model Context" section was added 2026-04-21
> after the external CTO architecture review and is carried forward
> below with its roadmap claims updated. The superseded body —
> including the Phase-1 single-app folder tree — is preserved in
> git history (last pre-rewrite state at `b30c5ae0`).

---

## What the system is

**CHOUnting** (working shell name: **The Bridge**) is a
multi-tenant, agent-first accounts-payable control system built on
an invariant-enforced double-entry ledger core. Humans and AI
agents share one posting path; the core's job is to make that path
safe regardless of who drives it.

The **V1 wedge is live end-to-end**: documents enter through the
ingestion channels, the Tier 2 pipeline classifies and extracts
them, matched proposals park at `status='parked_unposted'` and the
case advances to `needs_review` — the pipeline's terminal hand-off
to a human, who approves→posts from the review inbox with evidence
objects persisted. Ungoverned auto-commit is disabled (ADR-0007
§Tier 2 Q78 V1 re-scoping); governed per-rule autonomy is the
post-V1 re-wire, gated by the Agent Ladder.

---

## Model Context — Ledger Infrastructure vs. ERP

A reader coming from a traditional accounting system will notice
that chounting looks unusually *narrow* compared to products like
LedgerSMB, NetSuite, SAP, or QuickBooks. That is not an accident
of early-phase scope — it reflects a deliberate architectural
positioning. Two dominant models exist for accounting software,
and chounting is explicitly building the first of them on a
trajectory to the third.

**Model A — Traditional ERP** (LedgerSMB, NetSuite, SAP,
Dynamics). Broad domain coverage baked into one product: AR, AP,
payroll, fixed assets, tax modules, inventory, recurring
transactions, cost-center dimensions, vouchers, batched
approvals, cash reconciliation. Rigor is distributed across the
application, the database, and operator discipline. Integrity
properties are commonly enforced by periodic *audit queries* that
detect violations after the fact (the `write then audit` model).
This was a sound tradeoff when human operators controlled every
posting through a restricted application UI, SQL access was
privileged, and systems were single-tenant.

**Model B — Modern ledger infrastructure** (Stripe Ledger, Modern
Treasury, Square Ledger, chounting). A minimal, invariant-enforced
core that treats the ledger as a safety-critical substrate.
Debits-equal-credits at commit time. Immutable posted entries.
Idempotency keys on mutating calls. Fixed-precision money.
Structured errors. Multi-tenant by construction via RLS. Domain
features are *not* bundled — they are expected to layer on top
through separate modules. This is the right model when the
posting path will be driven by APIs and AI agents rather than
careful human operators, when concurrency matters, and when
multi-tenancy is a first-class requirement.

**Hybrid (production target) — Ledger core + domain modules +
reporting layer.** A strict Model-B core, with Model-A-style
domain modules layered on top, and a separate reporting layer
(materialized views, checkpoint snapshots, scheduled audits) to
support financial statements and period-close rituals. This is
the shape of the production system chounting is aiming at. Phase
1.1 shipped the core; the May 2026 run layered the first domain
modules (the AP domain, the document platform) and the
rules/decision substrate on top.

### Where chounting sits today

chounting is **Model B core, on a Hybrid trajectory — with the
first modules now layered on.** The invariant-enforced core
carries **28 invariants (16 L1a + 12 L2)** as of the V1 Wave-6
governance reconcile — see `docs/02_specs/invariants.md` (the
canonical index) and `docs/02_specs/ledger_truth_model.md` (the
full leaves). Phase 1.1 shipped 18; the INV-RULE family landed
through Ring 2B; INV-WORKFLOW-001/002 and INV-EVIDENCE-001
registered at Wave 6.

A "missing" feature compared to Model-A systems (payroll, fixed
assets, AR subledgers, recurring transactions, cost-center
dimensions) is not a defect of the Model B core — it is a module
that has not yet been layered on. The Model B core does not need
to change to accommodate these modules; the core's job is to be
the safety substrate they post through. The roadmap is the
schedule for layering them on.

### How to read the roadmap through this lens

Work in this codebase falls into three categories once you know
which model the project is building to:

- **Core hardening (Model B).** Work that strengthens or extends
  the invariant-enforced core itself. Shipped examples: the
  Layer 1a / Layer 2 split; the INV-RULE family (Ring 2B); the
  Wave-6 INV-WORKFLOW / INV-EVIDENCE registrations; `withInvariants`
  admitting governed system actors. Ahead: checkpoint invariants,
  subledger tie-outs.
- **Domain modules (Model A, layered on Model B).** Work that adds
  accounting-domain features through separate modules that post
  through the core. Shipped examples: the AP domain
  (bills, payments, vendor substrate — Phases 5/5.1), the document
  platform (Phases 2/4/6/7/8). Ahead: payroll, fixed assets, AR
  subledgers, recurring transactions, dimensions.
- **Reporting layer.** Work that supports financial statements,
  period-close rituals, and audit queries. Shipped examples: P&L /
  Trial Balance RPCs, AP aging. Ahead: `account_checkpoint` and
  checkpoint-based trial balance, the Layer 1b audit runner for
  the prompts under `docs/07_governance/audits/`.

The categories overlap — checkpointing is both a reporting-layer
component and a core-hardening invariant — but the mental model
helps when deciding whether a new piece of work belongs in the
ledger core or as a module that sits on top of it. **Changes to
the ledger core bear a heavier review burden than module
additions**, because the core's job is to be stable. A new domain
module should not require changes to `ledger_truth_model.md`
beyond adding a named invariant; if a module needs the core to
change, that is a signal worth examining before the change is
made.

### Why this framing matters for contributors

1. **Don't re-derive Model A features unasked.** A customer
   asking for "something like LedgerSMB's payroll module" is
   asking for a Model A module layered on the Model B core, not
   for chounting to become a Model A system. The core stays
   strict.
2. **The scheduled-audit pattern is not a fallback; it is a
   category.** See ADR-0008 and the Layer 1b paragraph in
   `ledger_truth_model.md`. An invariant that cannot be checked
   synchronously is a first-class audit-scan invariant, not a
   compromise.
3. **Gaps relative to Model A systems are expected.** A reader
   listing "what LedgerSMB has that chounting doesn't" will find
   a long list. Every entry on that list is either (a) a domain
   module on the roadmap, or (b) a reporting-layer component on
   the roadmap. Neither class indicates the core is wrong; both
   indicate the core is narrow *on purpose*.

---

## The system today (as of 2026-06-07)

The major components, each with its canonical doc. This section
is a map; the pointed-at docs are the truth.

- **Ledger core.** Journal entries, chart of accounts, fiscal
  periods, reversals; `withInvariants` service wrapper; the Two
  Laws (all DB access through services; all journal entries via
  `journalEntryService.post()`). 28 invariants (16 L1a + 12 L2).
  → `docs/02_specs/ledger_truth_model.md`,
  `docs/02_specs/invariants.md`.
- **Document platform.** Cases, sources, artifacts, polymorphic
  source-document links, exception queue (Phase 2); relationship
  router (Phase 4); ingestion substrate and channels — drag-drop,
  forwarded mailbox — with batches and jobs (Phase 6).
  → the Phase 2/4/6 retrospectives under
  `docs/07_governance/retrospectives/`.
- **Tier 2 document pipeline.** Stages 0–7 orchestration
  (`ingestDocument`): OCR (Modal sidecar), Tier A deterministic
  classification with Tier C Claude fallback, per-document-type
  extraction, candidate matching and per-feature scoring,
  proposal building, autonomy gate, pipeline trace. Matched
  proposals park `parked_unposted`; the case advances to
  `needs_review`. → ADR-0014 (stage names §1 canonical), the
  Phase 7/8 retrospectives.
- **AP domain + the V1 wedge.** Bills, payments, vendor
  substrate, AP reporting (Phases 5/5.1); review inbox with human
  approve→post, real coding, evidence-object persistence, live
  routing with no silent drops (V1 Waves 1–6, closed 2026-06-06).
  → `docs/09_briefs/v1/plans/2026-05-31-v1-governance-plan.md`,
  the Wave-0/5/6 retrospectives.
- **Rules and decisions.** Rule-type core substrate with
  class-table registry (ADR-0023); rule evaluator, agent-ladder
  gate, append-only `rule_evaluation_log` (ADR-0024,
  INV-RULE-001); shadow rule evaluation wired into the pipeline
  (Ring 2B, substrate-only); decision-modules composition and the
  Autonomy Ladder on a single `rule_autonomy_rung` (ADR-0029,
  ADR-0030). → those four ADRs +
  `docs/02_specs/agent_autonomy_model.md`.
- **Workflow Core (Layer 2.5).** `workflow_instances` +
  `workflow_events` substrate (ADR-0028, migration `20240171`) —
  **still inert**: no runtime writer exists (the only `src/`
  reference is generated `db/types.ts`); a consumer wave activates
  it. Not to be conflated with the **live document-case workflow**:
  the Wave-6 D2.1 routing hand-off writes `document_cases`, and the
  Wave-6 workflow invariants govern that machine and the
  intent-producer registry — INV-WORKFLOW-002 on the case state
  machine, INV-WORKFLOW-001 on `core/intent/producers.ts` via the
  `intent-producers` CI job — not the ADR-0028 tables.
  → ADR-0028, the Wave-6 retrospective.
- **Agent layer.** Orchestrator, tools, persona prompts, session
  persistence, canvas-context injection; the conversational
  Double Entry Agent (journal entries by chat) and the pipeline's
  system-actor path. Governance: the Agent Ladder (three rungs)
  and the four-dimension limit model.
  → `docs/02_specs/agent_autonomy_model.md`,
  `docs/02_specs/agent_interface.md`.
- **UI shell.** The Bridge: three-zone shell (nav rail / chat /
  contextual canvas), multi-tab canvas with source-driven routing,
  chat-input drag-drop ingestion (Phase 6.5); full-page routes
  render without shell zones. → the Phase 6.5 retrospective.

---

## How the source is organized

A pnpm/turbo monorepo:

```
apps/web/        # the product (Next.js App Router) — all source below
apps/demo/       # demo shell
packages/ui/     # design-system primitives
packages/tokens/ # design tokens
supabase/        # migrations + local stack
sidecar-ocr/     # Modal OCR sidecar (Tier 2 pipeline Stage 1)
docs/            # specs, architecture, governance — see docs/INDEX.md
scripts/         # session tooling (locks, hooks, seeds)
```

Inside `apps/web/src/`, code sits in **authority layers** ratified
by ADR-0020 (Agent-First Authority-Gradient Source Architecture).
The canonical request/source traversal:

```
app/ → agent/ → contracts/ → services/ → core/ → db/
```

- **`app/`** — workflow-shaped routes; thin adapters only.
- **`agent/`** — the cognitive layer: orchestrator, tools,
  prompts, policies. Probabilistic; may not reach the DB directly.
- **`contracts/`** — Zod boundary artifacts at the agent ↔
  services seam.
- **`services/`** — the deterministic engine; the only layer that
  touches the DB (Law 1); `withInvariants` wraps mutations.
- **`core/`** — pure deterministic rules (no DB, no network, no UI).
- **`db/`** — persistence boundary: admin client, generated types,
  repositories.
- Cross-cutting: `components/`, `hooks/`, `shared/`,
  `middleware/`. Tests live at `apps/web/tests/`
  (unit / integration / e2e).

The full tree with per-folder semantics and import rules is
canonical at **`docs/03_architecture/folder-structure.md`**
(layout) and **`docs/03_architecture/authority-gradient.md`**
(the four-layer framing) — not duplicated here; the previous
body's copy of the tree drifted exactly once, which is why this
doc now points instead. The import boundaries are enforced by the
`agent-first-import-boundaries` ESLint rule, active at
`'error'` (`apps/web/eslint.config.mjs`). Known minor drift in
the layout doc at this writing, named for its own refresh:
it lists a `lib/` folder that never materialized, and places
`tests/` at the repo top level (they live under `apps/web/tests/`).

---

## Where to go next (day-one reading order)

1. Root `CLAUDE.md` — the standing rules; `docs/INDEX.md` — the
   one-line map of everything.
2. `docs/02_specs/ledger_truth_model.md` +
   `docs/02_specs/invariants.md` — what the core promises.
3. `docs/02_specs/agent_autonomy_model.md` — how agents are
   governed.
4. `docs/03_architecture/authority-gradient.md` +
   `docs/03_architecture/folder-structure.md` — where code goes
   and why.
5. `docs/02_specs/glossary.md` ("V1 workflow-native vocabulary")
   — the words.
6. `docs/09_briefs/CURRENT_STATE.md` — where the project is right
   now, newest section first.
