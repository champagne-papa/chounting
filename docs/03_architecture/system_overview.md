# System Overview

What the system is, what its major components are, and how the
source code is organized. The day-one document for a new engineer.

Source: extracted from PLAN.md §1 and §1a during Phase 1.1 closeout
restructure. The docs/ tree has been updated to reflect the
post-restructure folder structure. The "Model Context" section
below was added 2026-04-21 following the external CTO
architecture review (see
`docs/07_governance/friction-journal.md` entry for that date).

---

## Model Context — Ledger Infrastructure vs. ERP

A reader coming from a traditional accounting system will notice
that chounting looks unusually *narrow* compared to products like
LedgerSMB, NetSuite, SAP, or QuickBooks. That is not an accident
of Phase 1 scope — it reflects a deliberate architectural
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
1.1 ships the core; Phase 2 and later phases add the domain
modules and reporting layer.

### Where chounting sits today

chounting is **Model B core, on a Hybrid trajectory.** Phase
1.1 delivered the invariant-enforced core (see
`docs/02_specs/ledger_truth_model.md` for the 17 invariants that
make up the core). Every Phase 2+ brief under `docs/09_briefs/`
adds either a domain module, a reporting-layer component, or a
Model-B primitive chounting has not yet needed.

A "missing" feature compared to Model-A systems (payroll, fixed
assets, tax modules, recurring transactions, cost-center
dimensions) is not a defect of the Model B core — it is a module
that has not yet been layered on. The Model B core does not need
to change to accommodate these modules; the core's job is to be
the safety substrate they post through. The Phase 2+ roadmap is
the schedule for layering them on.

### How to read the Phase 2 backlog through this lens

The Phase 2 backlog under `docs/09_briefs/phase-2/` (and the
priority ordering recorded in the 2026-04-21 friction-journal
entry) has three categories once you know which model the
project is building to:

- **Core hardening (Model B).** Work that strengthens or extends
  the invariant-enforced core itself. Examples:
  - Layer 1a / Layer 1b split in the truth model (ADR-0008).
  - New invariant stubs (INV-CHECKPOINT-001,
    INV-SUBLEDGER-LINK-001, INV-SUBLEDGER-TIEOUT-001).
  - Multi-stage approval state machine generalizing `ai_actions.status`.
  - Simplification 1 and 2 corrections (events-projection, pg-boss audit write).
- **Domain modules (Model A, layered on Model B).** Work that
  adds accounting-domain features through separate modules that
  post through the core. Examples: account-purpose tagging, source↔JE
  linkage, effective-date / accrual model, batch / voucher abstraction,
  dimensions (cost centers / projects), year-end closing, journal
  taxonomy, subsidiary ledgers for AR/AP, fixed assets, payroll,
  recurring transactions.
- **Reporting layer.** Work that supports financial statements,
  period-close rituals, and audit queries. Examples:
  `account_checkpoint` and checkpoint-based trial balance, P&L
  and balance-sheet report services, the Layer 1b audit runner
  that executes prompts under `docs/07_governance/audits/`.

The categories overlap — checkpointing is both a reporting-layer
component and a core-hardening invariant — but the mental
model helps when deciding whether a new piece of work belongs in
the ledger core or as a module that sits on top of it. **Changes
to the ledger core bear a heavier review burden than module
additions**, because the core's job is to be stable. A new
domain module should not require changes to
`ledger_truth_model.md` beyond adding a named invariant; if a
module needs the core to change, that is a signal worth
examining before the change is made.

### Why this framing matters for contributors

1. **Don't re-derive Model A features unasked.** A customer
   asking for "something like LedgerSMB's payroll module" is
   asking for a Model A module layered on the Model B core, not
   for chounting to become a Model A system. The core stays
   strict.
2. **The scheduled-audit pattern is not a fallback; it is a
   category.** See ADR-0008 and the Layer 1b paragraph in
   `ledger_truth_model.md`. A Phase 2 invariant that cannot be
   checked synchronously is a first-class audit-scan invariant,
   not a compromise.
3. **Gaps relative to Model A systems are expected.** A reader
   listing "what LedgerSMB has that chounting doesn't" will
   find a long list. Every entry on that list is either (a) a
   domain module scheduled for Phase 2+, or (b) a reporting-layer
   component scheduled for Phase 2+. Neither class indicates the
   core is wrong; both indicate the core is narrow *on purpose*.

---

## Phase 1 Folder Tree (single Next.js app)

The Phase 1 folder structure inside `src/` mirrors the future
monorepo layout so that the Phase 2 split is mechanical (move
folders out of `src/` into `packages/`), not a rewrite.

```
the-bridge/                    # single Next.js app, single repo, no pnpm workspaces
  src/
    app/                       # Next.js App Router
      layout.tsx               # root layout
      page.tsx                 # root redirect
      [locale]/
        layout.tsx             # locale layout (next-intl provider)
        page.tsx               # locale root
        [orgId]/
          page.tsx             # org dashboard — catch-all for org-scoped routes
          accounting/
            chart-of-accounts/
            journals/
          agent/
            actions/
          reports/
            pl/
        consolidated/
          dashboard/
        admin/
          orgs/
            page.tsx           # Org creation with industry CoA template selection
        sign-in/
          page.tsx
        sign-out/
          page.tsx
      api/                     # Next.js API routes — thin adapters over src/services/
        _helpers/
          serviceErrorToStatus.ts  # maps ServiceError codes to HTTP status
        health/
          route.ts             # GET health check
        org/
          route.ts             # POST org creation
        orgs/
          [orgId]/
            chart-of-accounts/
              route.ts         # GET list chart of accounts
            fiscal-periods/
              route.ts         # GET list open fiscal periods
            journal-entries/
              route.ts         # GET list / POST create journal entry
              [entryId]/
                route.ts       # GET journal entry detail
            reports/
              pl/
                route.ts       # GET P&L report
              trial-balance/
                route.ts       # GET Trial Balance report
        tax-codes/
          route.ts             # GET tax codes
      test/
        page.tsx               # dev-only test page
    services/                  # ALL business logic — INV-SERVICE-001, single source of truth
      auth/
        canUserPerformAction.ts
        getMembership.ts
      accounting/
        journalEntryService.ts          # journalEntryService.post() — INV-SERVICE-002
        chartOfAccountsService.ts
        periodService.ts                # periodService.isOpen()
        taxCodeService.ts
      org/
        orgService.ts
        membershipService.ts
        generateFiscalPeriods.ts
      audit/
        recordMutation.ts               # synchronous audit_log write — Simplification 1
      errors/
        ServiceError.ts                 # typed service error class
      middleware/
        withInvariants.ts               # the universal service wrapper — INV-AUTH-001
        serviceContext.ts               # ServiceContext type with trace_id, org_id, caller
        errors.ts                       # middleware error utilities
      reporting/
        reportService.ts                # P&L and Trial Balance via Postgres RPC
    agent/                              # the agent layer — empty stubs in Phase 1.1, populated in Phase 1.2
      orchestrator/
        systemPrompts/                  # empty — persona prompts added in Phase 1.2
      tools/                            # empty — tool definitions added in Phase 1.2
      session/                          # empty — AgentSession persistence added in Phase 1.2
      memory/                           # empty — org context manager added in Phase 1.2
      canvas/                           # empty — CanvasDirective moved to src/shared/types/ in Phase 1.1
    contracts/                          # reserved for Phase 1.2 — .gitkeep only
    db/
      adminClient.ts                    # service-role Supabase client (server-only)
      userClient.ts                     # user-scoped Supabase client (RLS-respecting)
      types.ts                          # generated by `supabase gen types typescript`
      seed/
        dev.sql                         # orgs + memberships + fiscal periods
    shared/
      env.ts                            # runtime environment validation
      schemas/                          # Zod primitives shared across services and UI
        accounting/
          journalEntry.schema.ts        # the canonical schema, imported by service + tool + form
          money.schema.ts               # MoneyAmount/FxRate branded types, arithmetic helpers
      types/
        canvasContext.ts                # CanvasContext type — created in Phase 1.1, consumed in Phase 1.2
        canvasDirective.ts              # CanvasDirective discriminated union
        proposedEntryCard.ts
        userRole.ts
      i18n/
        config.ts                       # next-intl config — en, fr-CA, zh-Hant
        request.ts                      # next-intl request configuration
      logger/
        pino.ts                         # structured logger with redact list
    components/
      ProposedEntryCard.tsx             # rendered when directive.type === 'proposed_entry_card'
      bridge/
        SplitScreenLayout.tsx           # the main shell — chat panel + canvas panel + Mainframe rail
        AgentChatPanel.tsx
        ApiStatusDot.tsx                # Mainframe API status indicator
        ContextualCanvas.tsx
        MainframeRail.tsx
        OrgSwitcher.tsx
        SuggestedPrompts.tsx            # persona-aware empty-state prompts
      canvas/
        BasicPLView.tsx                 # standalone P&L report view
        BasicTrialBalanceView.tsx        # standalone Trial Balance view
        ChartOfAccountsView.tsx         # standalone — does not require the agent
        ComingSoonPlaceholder.tsx        # renders for Phase 2+ canvas directive types
        JournalEntryDetailView.tsx       # journal entry detail
        JournalEntryForm.tsx            # manual journal entry form
        JournalEntryListView.tsx         # journal entry list
        ReversalForm.tsx                # reversal entry form with period gap banner
  supabase/
    migrations/                         # Supabase CLI timestamp-prefixed migrations
      20240101000000_initial_schema.sql
      20240102000000_add_reversal_reason.sql
      20240103000000_seed_tax_codes.sql
      20240104000000_add_entry_number.sql
      20240105000000_add_entry_type.sql
      20240106000000_add_attachments.sql
      20240107000000_report_rpc_functions.sql
  messages/                             # next-intl translation files
    en.json                             # populated in Phase 1.1
    fr-CA.json                          # placeholder structure (English fallback)
    zh-Hant.json                        # placeholder structure (English fallback)
  docs/                                 # documentation — see docs/README.md for index
    00_product/                         # product vision, personas, glossary
    01_prd/                             # feature-level PRDs (empty in Phase 1.1)
    02_specs/                           # system truth — invariants, data model, ledger rules
    03_architecture/                    # system design — this file, phase simplifications, lifecycle
    04_engineering/                     # developer setup, conventions, security, testing strategy
    05_operations/                      # runbooks (empty in Phase 1.1)
    06_audit/                           # control matrix
    07_governance/                      # ADRs, friction journal, audits, retrospectives
    08_releases/                        # CHANGELOG
    09_briefs/                          # per-phase execution briefs and working documents
    99_archive/                         # superseded documents
  tests/
    setup/
      testDb.ts                         # parameterized SUPABASE_TEST_URL fallback chain — no hardcoded localhost
      loadEnv.ts                        # loads .env.test.local for integration tests
      globalSetup.ts                    # Vitest global setup — migrations + seed
      test_helpers.sql                  # SQL helper functions for test fixtures
    integration/                        # 7 files, 26 tests
      unbalancedJournalEntry.test.ts              # Category A floor #1 — deferred constraint
      lockedPeriodRejection.test.ts               # Category A floor #2 — period-lock trigger
      crossOrgRlsIsolation.test.ts                # Category A floor #3 — RLS
      serviceMiddlewareAuthorization.test.ts      # Category A floor #4 — INV-AUTH-001
      reversalMirror.test.ts                      # Category A floor #5 — INV-REVERSAL-001
      reportProfitAndLoss.test.ts                 # P&L report correctness
      reportTrialBalance.test.ts                  # Trial Balance report correctness
    unit/                               # 4 files, 49 tests
      generateFiscalPeriods.test.ts
      journalEntrySchema.test.ts
      mirrorLines.test.ts
      moneySchema.test.ts
  scripts/
    seed-auth-users.ts                  # tsx — creates Supabase Auth users via admin API
  .env.example
  .nvmrc
  next.config.ts
  package.json
  tsconfig.json
```

**The Phase 2 monorepo migration is mechanical:**
`src/services/` → `packages/services/`, `src/agent/` →
`packages/agent/`, `src/db/` → `packages/db/`, `src/contracts/` →
`packages/contracts/`, `src/shared/` → `packages/shared/`. The
Next.js app becomes `apps/web/`. A new `apps/api/` is created. No
business logic moves. No agent logic moves. The seams are already in
the right places.
