---
name: service-architecture
description: Rules for the service layer — the Two Laws, withInvariants wrapping, Zod boundary validation, trace_id / idempotency propagation. Load when touching src/services/, API route handlers, or mutating agent tools.
trigger: Work adding or modifying files under `src/services/`, API route handlers, or agent tools that mutate data.
---

# Service Architecture

**Canonical source:** `docs/02_specs/ledger_truth_model.md` (for
INV leaves) and `docs/02_specs/glossary.md` (for the Two Laws
framing). This skill summarizes and points.

## 1. The Two Laws of Service Architecture

Framing defined in `docs/02_specs/glossary.md` (Two Laws entry).
They are a framing layer on top of several INV leaves, not an INV
leaf themselves.

- **Law 1.** All database access goes through `src/services/`
  only. No route handler, no agent tool, no React server component
  reads or writes the database directly.
- **Law 2.** All journal entries are created by
  `journalEntryService.post()` only. No other function in the
  codebase may insert into `journal_entries` or `journal_lines`.

The Laws are enforced by the combination of INV-SERVICE-001
(`withInvariants` wrapping), INV-SERVICE-002 (`adminClient`
discipline), and INV-AUTH-001 (authorization). A PR that adds a
direct database call outside `src/services/` is rejected regardless
of urgency.

**Known exception.** `OrgSwitcher` currently makes a direct
browser-to-database membership query — logged as audit finding
UF-014 in `docs/07_governance/audits/phase-1.1/unified-findings.md`
with a fix slated for Phase 1.2 (`MT-07` in that phase's action
plan).

## 2. `withInvariants()` wraps every mutating service function (INV-SERVICE-001 + INV-AUTH-001)

Every mutating API route handler applies the wrapper at the call
site:

```typescript
await withInvariants(
  journalEntryService.post,
  { action: 'journal_entry.post' }
)(input, ctx);
```

A mutating service function called without `withInvariants` is a
**cross-tenant data breach risk** because the service-role client
bypasses RLS. The wrapper runs four pre-flight checks before the
function body: context shape, caller verified, org access, and
role-based authorization (see INV-AUTH-001 leaf for the matrix and
the exact check order).

Read functions (`list`, `get`) are intentionally not wrapped; they
handle authorization inline via `.includes()` / `.in()` patterns —
see INV-SERVICE-001 leaf "Asymmetry with read functions" for the
two sub-patterns.

**Enforcement today is code-review only.** There is no automated
lint catching unwrapped service mutations. A
`no-unwrapped-service-mutation` lint rule is a Phase 1.2 candidate
— see UF-002 in
`docs/07_governance/audits/phase-1.1/unified-findings.md`.

Full contract: `docs/02_specs/ledger_truth_model.md`
INV-SERVICE-001 and INV-AUTH-001 leaves.

## 3. The service layer uses `adminClient`, never `userClient` (INV-SERVICE-002)

Every file under `src/services/**` imports from
`@/db/adminClient`. `userClient` imports under `src/services/` are
rejected on review. The service-role client is required because
(a) `audit_log` has no INSERT policy for authenticated users, (b)
reads need explicit service-layer authorization rather than RLS's
ambiguous zero-rows-means-either-empty-or-denied behavior, and (c)
Phase 2 `events` writes will be adminClient-only by construction.

Full contract: `docs/02_specs/ledger_truth_model.md`
INV-SERVICE-002 leaf (including the interaction triangle with
INV-AUTH-001 and INV-RLS-001).

## 4. Zod validation at every boundary (defense-in-depth)

Three validation layers:

1. **API route** validates incoming request.
2. **Agent tool** validates tool arguments.
3. **Service function** re-validates input (belt and suspenders).

No inline types, no `any`, no untyped objects crossing the service
boundary. Full rule: the Service Communication Rules section of
`docs/02_specs/ledger_truth_model.md`.

## 5. `trace_id` propagates; agent sources carry `idempotency_key`

- `trace_id` generated at the entry point (API route or
  orchestrator) and carried through every layer: caller → service
  → database → `audit_log` → every pino log line. `withInvariants`
  enforces presence (INV-AUTH-001 pre-flight Invariant 1).
- `idempotency_key` is required for `source='agent'` mutations,
  both at the Zod layer (`PostJournalEntryInputSchema` refine) and
  as a DB CHECK constraint (`CHECK (source <> 'agent' OR
  idempotency_key IS NOT NULL)`). Missing means double-posting on
  retry.

Full contract: `docs/02_specs/ledger_truth_model.md`
INV-IDEMPOTENCY-001 leaf.

## 6. Source-tree boundary (per ADR-0020)

ADR-0020 (2026-05-05) codifies the agent-first authority-gradient
source architecture. The Two Laws, INV-SERVICE-001 (`withInvariants`
wrapping), and INV-SERVICE-002 (`adminClient` discipline) keep
their existing scope of `apps/web/src/services/**/*.ts`
unchanged. Service authority is not amended.

The only thing that leaves `services/` per ADR-0020 is **pure
logic extraction into `core/`**: when a service function or
helper is truly pure (no DB, no network, no agent imports, no
React), it migrates to `apps/web/src/core/<area>/` per the
opportunistic-migration rule (ADR-0020 Decision item 6). The
extraction is on-touch: when the surrounding service is
naturally edited, the pure portion lifts out. No bulk migration.

`core/` functions are unit-tested without Supabase. The service
calls into `core/` for pure rule predicates
(`balanceDebitsAndCredits`, `isPeriodLocked`,
`evidenceMetadataRules`); `core/` never calls back. See
`docs/03_architecture/folder-structure.md` for the canonical
layout and `docs/03_architecture/authority-gradient.md` for the
broader four-layer framing.
