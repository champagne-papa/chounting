# Documentation Restructure Plan

Phase 1.1 closeout deliverable. Working artifact, not polished doc.
After execution, this file moves to /99_archive/restructure-plan.md.

## Migration Notes

Read these before starting each commit. They capture decisions from
the planning conversation that aren't encoded elsewhere in the plan.

- **Pacing:** four sessions across 2-3 days. Commit 2 alone (1 hr).
  Commit 3 alone. Commit 4 alone on a fresh day (riskiest). Commit 5
  can follow 4 or be its own session. Stop when you start re-reading
  files you've already read in the same session.
- **Session-start ritual:** `git status --short` (expect empty) then
  `git log --oneline -5`. Write down the starting commit hash
  outside the repo before touching anything.
- **Don't move this file until commit 5.** restructure-plan.md stays
  at docs/restructure-plan.md through commits 2-4. It moves to
  /99_archive/ in commit 5 alongside the PLAN.md archive.
- **Commit-4 check #1 (§3b-§3d placement):** when extracting the
  worked example, ask whether it reads as tutorial or rule. Tutorial
  → developer_setup.md. Rule → conventions.md.
- **Commit-4 check #2 (§11 structured-response rule):** the rule
  "agent responses are template_id + params, not English prose" is
  agent-specific. Prefer agent_architecture.md over conventions.md.
  Don't duplicate.
- **Commit-4 check #3 (§10 performance conventions):** grep the new
  /04_engineering/ files for "bulk," "N+1," "transactional," "cache."
  If zero hits, write a 10-line "Performance conventions" section into
  conventions.md: (1) bulk ops must be transactional, (2) list
  endpoints eager-load to avoid N+1, (3) no caching in Phases 1-2,
  (4) new service queries checked against index plan in data_model.md.
- **§4 coherence check during commit 4:** if ui_architecture.md
  feels incoherent because §4g/§4h are too Phase-1.2-flavored, split
  them out to briefs. If it reads as one doc, leave it.

---

## Part 1 — Philosophy

Documents are organized by function — intent, truth, design, execution,
governance — not by type. Each layer has a distinct audience: product
vision speaks to stakeholders and agents; specs speak to implementers;
architecture speaks to new engineers; briefs speak to the current-phase
executor. The numbered folder structure makes these audience boundaries
visible in `ls` output and enforces reading order during onboarding.

Code enforces truth. Tests verify invariants. Specs define truth. ADRs
record decisions. Docs comprehend. When artifacts conflict, the higher
level wins: a database constraint overrides a spec claim; a spec
overrides a prose explanation. The restructure makes this hierarchy
explicit by separating specs (/02_specs/) from architecture
(/03_architecture/) from governance (/07_governance/), so that
documentation cannot silently become more authoritative than the code
it describes. The spec-without-enforcement rule (convention 6) is
the operational expression of this principle.

---

## Part 2 — Target Structure

### /docs/00_product/

**Purpose:** Product intent — why we build this, for whom, with what constraints.

**Day-one status:** Populated (3 files extracted from PLAN.md + 1 new file).

**README content:**
```
# Product

Product-level documents: vision, personas, constraints, glossary.

What goes here: documents that answer "what is this product and who
is it for?" These are read by stakeholders, new team members, and
AI agents needing product context. They change rarely.

What does NOT go here: feature specs (→ /01_prd/), system design
(→ /03_architecture/), execution plans (→ /09_briefs/).

Source: extracted from PLAN.md "The Product," "Who This Is For,"
"Non-Negotiable Constraints," "Locked-In Stack," and "Three User
Personas" sections during Phase 1.1 closeout restructure.
```

### /docs/01_prd/

**Purpose:** Feature-level product requirements documents.

**Day-one status:** EMPTY.

**Deletion criterion:** Archive to /99_archive/ if no active content
by end of Phase 1.3.

**README content:**
```
# Product Requirements Documents

Feature-level intent documents — the bridge between product vision
(/00_product/) and system specs (/02_specs/).

This folder ships empty in Phase 1.1. PRDs go here when features
need product-level intent docs separate from architecture and
execution. The agent integration in Phase 1.2 may be the first
candidate — the "what should the agent do and why" document that
precedes the technical spec.

Expected first occupant: Phase 1.2 agent integration PRD, if the
scope warrants a product-level document separate from the execution
brief.

Deletion criterion: archive this folder to /99_archive/ if it has
no active content by end of Phase 1.3.
```

### /docs/02_specs/

**Purpose:** System truth — the constitution. Invariants, data model,
ledger rules.

**Day-one status:** Populated (3 files: ledger_truth_model.md,
data_model.md, invariants.md).

**README content:**
```
# Specs

System truth documents — the constitution of the codebase.

What goes here: invariants, data model definitions, ledger rules,
and any rule that has enforcement in code today. Each invariant
carries a stable INV-DOMAIN-NNN ID and a bidirectional pointer to
its enforcement in code.

What does NOT go here: architectural decisions about *why* a rule
exists (→ /07_governance/adr/), system design and component
relationships (→ /03_architecture/), or rules that lack enforcement
in code today (→ /09_briefs/phase-1.2/obligations.md as gaps).

The spec-without-enforcement rule: an invariant only appears in
invariants.md if it has corresponding enforcement in code TODAY.
```

### /docs/03_architecture/

**Purpose:** System design — how the system is structured, why it
looks the way it does in Phase 1 vs Phase 2.

**Day-one status:** Populated (3 files: system_overview.md,
phase_simplifications.md, request_lifecycle.md).

**README content:**
```
# Architecture

System design documents — how the pieces fit together.

What goes here: system overview, component relationships, request
lifecycle diagrams, phase simplifications (the most important doc
in this folder — explains why Phase 1 looks different from Phase 2).

What does NOT go here: invariant definitions (→ /02_specs/),
implementation setup (→ /04_engineering/), or UI/agent architecture
details that are phase-specific (→ /09_briefs/).
```

### /docs/04_engineering/

**Purpose:** Implementation — developer setup, conventions, tooling.

**Day-one status:** Populated (2 files: developer_setup.md,
conventions.md).

**README content:**
```
# Engineering

Implementation documents — from git clone to running dev server.

What goes here: developer setup guide, scripts reference, coding
conventions, branch naming, contribution rules.

What does NOT go here: system design (→ /03_architecture/),
invariant definitions (→ /02_specs/), per-phase execution
instructions (→ /09_briefs/).
```

### /docs/05_operations/

**Purpose:** Runbooks and operational procedures.

**Day-one status:** EMPTY.

**Deletion criterion:** Archive to /99_archive/ if no active content
by end of Phase 2.

**README content:**
```
# Operations

Runbooks and operational procedures for deployed environments.

This folder ships empty in Phase 1.1 because there is no deployment
target. Phase 1.3 introduces the first remote Supabase environment
and may produce the first runbook (deployment checklist, backup
procedure, incident response).

Expected first occupant: Phase 1.3 deployment runbook or backup
procedure.

Deletion criterion: archive this folder to /99_archive/ if it has
no active content by end of Phase 2.
```

### /docs/06_audit/

**Purpose:** Controls and integrity — the Control Matrix.

**Day-one status:** Populated (1 file: control_matrix.md).

**README content:**
```
# Audit

Controls and integrity documents.

What goes here: the Control Matrix (mapping invariant IDs to their
spec definitions, tests, and code enforcement), and any future
audit-related reference material.

What does NOT go here: audit scan findings and reports from the
audit framework (→ /07_governance/audits/), ADRs
(→ /07_governance/adr/).
```

### /docs/07_governance/

**Purpose:** Decision records, friction journal, retrospectives, audit
findings — the project's institutional memory.

**Day-one status:** Populated (multiple files across subdirectories).

**README content:**
```
# Governance

The project's institutional memory: decisions, friction, audits,
retrospectives.

Subdirectories:
- adr/ — Architecture Decision Records. Written in anger, not
  preemptively. See adr/README.md for the format and rules.
- audits/ — Audit framework findings from technical audits.
  Preserves subdirectory structure from Phase 1.1 audit.
- retrospectives/ — Per-phase retrospectives.
- open_questions.md — Extracted from PLAN.md §18.
- friction-journal.md — Append-only war diary.

AI agents may append to friction-journal.md. All other files in
this folder require explicit human approval to create or modify.
```

### /docs/08_releases/

**Purpose:** Changelog and release notes.

**Day-one status:** Populated (1 file: CHANGELOG.md).

**README content:**
```
# Releases

Changelog and release notes.

What goes here: CHANGELOG.md (version history extracted from
PLAN.md during Phase 1.1 closeout), and future release notes.

What does NOT go here: execution briefs (→ /09_briefs/),
retrospectives (→ /07_governance/retrospectives/).
```

### /docs/09_briefs/

**Purpose:** Execution briefs and AI/Claude task layer — per-phase
subfolders.

**Day-one status:** Populated (multiple files across phase subfolders).

**README content:**
```
# Briefs

Execution briefs and phase-specific working documents.

Organized by phase: phase-1.1/, phase-1.2/, etc. Each phase
subfolder contains the execution brief, exit criteria, closeout
artifacts, and any working documents produced during execution.

AI agents may create new files in /09_briefs/[current-phase]/.

- CURRENT_STATE.md — where the project is right now.
- phase-1.1/ — closed Phase 1.1 brief and closeout artifacts.
- phase-1.2/ — Phase 1.2 obligations and forward-looking notes.
```

### /docs/99_archive/

**Purpose:** Superseded documents preserved for historical reference.

**Day-one status:** Populated (PLAN_v0.5.6.md, PLAN_v1.md,
README_nextjs_scaffold.md).

**README content:**
```
# Archive

Superseded documents. Preserved for historical reference only.

Nothing in this folder is canonical. If you find yourself reading
a file here to understand a current rule, the canonical version
has moved — check /02_specs/ or /03_architecture/.

Naming convention: original filename with version suffix where
applicable (e.g., PLAN_v0.5.6.md, PLAN_v1.md).
```

---

## Part 3 — Migration Map

### 3A. Existing files that move verbatim

| # | Current path | New path | Confidence |
|---|---|---|---|
| 1 | docs/decisions/0001-reversal-semantics.md | docs/07_governance/adr/0001-reversal-semantics.md | confident |
| 2 | docs/decisions/README.md | docs/07_governance/adr/README.md | confident |
| 3 | docs/friction-journal.md | docs/07_governance/friction-journal.md | confident |
| 4 | docs/CURRENT_STATE.md | docs/09_briefs/CURRENT_STATE.md | confident |
| 5 | docs/specs/phase-1.1.md | docs/09_briefs/phase-1.1/brief.md | confident — add closed/historical header during commit 3 |
| 6 | docs/phase-1.1-exit-criteria-matrix.md | docs/09_briefs/phase-1.1/exit_criteria_matrix.md | confident |
| 7 | docs/phase-1.1-test-coverage-catalog.md | docs/09_briefs/phase-1.1/test_coverage_catalog.md | confident |
| 8 | docs/phase-1.1-schema-reconciliation.md | docs/09_briefs/phase-1.1/schema_reconciliation.md | confident |
| 9 | docs/phase-1.1-retrospective.md | docs/07_governance/retrospectives/phase-1.1-retrospective.md | confident |
| 10 | docs/phase-1.2-obligations.md | docs/09_briefs/phase-1.2/obligations.md | confident |
| 11 | docs/phase-1.2/journal-entry-form-gaps.md | docs/09_briefs/phase-1.2/journal_entry_form_gaps.md | confident |
| 12 | docs/prompt-history/CHANGELOG.md | docs/08_releases/CHANGELOG.md | confident |

**Phase 1.1 brief closed/historical header** (added during commit 3):
```
> **Phase 1.1 closed on 2026-04-13.** This brief is preserved as
> historical reference. Current obligations are in
> /docs/09_briefs/phase-1.2/obligations.md.
```

### 3B. Directories that move with preserved subdirectory structure

| # | Current path | New path | Contents | Confidence |
|---|---|---|---|---|
| 13 | docs/audits/ | docs/07_governance/audits/ | 2 top-level files (DESIGN.md, README.md), prompts/ (11 files), phase-1.1/ (7 files + findings/ with 9 files) = 29 files total | confident |
| 14 | docs/superpowers/ | docs/09_briefs/phase-1.1/superpowers/ | briefs/ (4 files), plans/ (1 file) = 5 files total | confident |
| 15 | docs/archive/Planv1.md | docs/99_archive/PLAN_v1.md | 1 file, 279KB | confident — Planv1.md has no version number in its name; renaming to PLAN_v1.md follows the archive naming convention |

### 3C. PLAN.md extraction map

PLAN.md version: **v0.5.6** (confirmed from line 4: "Version: v0.5.6").
Archived as: docs/99_archive/PLAN_v0.5.6.md

| # | Destination file | PLAN.md source sections | Notes |
|---|---|---|---|
| 16 | docs/02_specs/ledger_truth_model.md | Critical Architectural Invariants (lines 291-416): Invariants 1-6; §1d (lines 1021-1162): deferred constraint, period lock trigger, events append-only; §2b (lines 1380-1394): key database invariants table; §15 (lines 3883-3937): core rule, five rules of service communication; §15e (lines 3969-4050): behavioral invariants layers 1-3; §3a (lines 1718-1803): money handling rule, branded types, arithmetic helpers [verify — confirm §3a scope during extraction]; parts of §2a relevant to CHECK constraints on journal_lines | Each rule gets an INV-DOMAIN-NNN ID. Money handling incorporated as a section. Reversal mirror incorporated as a section. Only rules with enforcement in code today. |
| 17 | docs/02_specs/data_model.md | §2a (lines 1187-1378): core tables; §2e (lines 1680-1703): index plan [verify]; §2c (lines 1396-1667): RLS policies [verify — this is 270 lines; confirm whether RLS belongs in data_model or a separate rls_policies section within data_model] | Schema reference only; rules operate on schema live in ledger_truth_model.md |
| 18 | docs/03_architecture/system_overview.md | §1 (lines 706-707): header; §1a (lines 708-895): Phase 1 folder tree [verify — 187 lines, confirm actual content ends before §1b] | Day-one doc for new engineers |
| 19 | docs/03_architecture/phase_simplifications.md | §0 (lines 78-124): Phase 1 Reality vs Long-Term Architecture (the 8-row table); Phase 1 Simplifications section (lines 419-614): Simplifications 1-3 + "What is NOT simplified" [verify — confirm line range] | Single most important architectural doc |
| 20 | docs/03_architecture/request_lifecycle.md | §1c (lines 949-1020): ASCII diagrams for manual path, agent path, confirmation commit path | 3 diagrams, ~70 lines |
| 21 | docs/04_engineering/developer_setup.md | §12 (lines 3737-3815): prerequisites, step-by-step setup, troubleshooting; §1b (lines 896-948): package.json scripts block [verify — §1b is ~52 lines; folded into developer_setup rather than a separate scripts_reference.md because the content is too small for its own file] | From git clone to pnpm dev running |
| 22 | docs/04_engineering/conventions.md | §12 "Contribution Conventions" (lines 3817-3828): branch naming, commit conventions, file-creation patterns, "direct database calls outside src/services/ rejected" rule | ~12 lines of source; expand slightly during extraction with examples |
| 23 | docs/00_product/product_vision.md | "The Product" (lines 141-215): name, what existing software gets wrong, what differentiates; "Who This Is For" (lines 126-138); "Non-Negotiable Constraints" (lines 218-228); "Locked-In Stack" (lines 263-288) | ~160 lines extracted |
| 24 | docs/00_product/personas.md | "The Three User Personas" (lines 230-260): Executive, Controller, AP Specialist | ~30 lines. Add note that role-permission mapping lives in /03_architecture/ or /02_specs/ |
| 25 | docs/07_governance/open_questions.md | §18 (lines 4185-end): 20 questions across 4 categories; 10 resolved, 10 open [verify — read §18d question 20 and confirm the full extent] | Resolved questions: inline the resolution, mark RESOLVED. Open questions: status, impact, owner. |

### 3D. New files created from scratch

| # | New path | Description | Source |
|---|---|---|---|
| 26 | docs/00_product/glossary.md | Agent-facing definitions specific to how THIS system uses each term. Not generic accounting definitions. Terms: posting (inserting via journalEntryService.post, no UI confirmation step), journal entry (a balanced set of debit/credit lines), reversal (new entry with swapped debits/credits linked via reverses_journal_entry_id), period close (setting is_locked=true on a fiscal_period), intercompany (transactions between two orgs in the family office, tracked via intercompany_batch_id), functional currency (CAD for all entities in Phase 1 — schema-enforced), audit trail vs audit log (trail = broader concept including journal_entries columns; log = the audit_log table specifically — see ADR-001 placement rationale), source (manual/agent/import enum on journal_entries), idempotency key (UUID preventing double-posting on retry, required for agent source per DB CHECK), trace_id (UUID generated at entry point, propagated through every layer), invariant (a rule with enforcement in code, carrying an INV-DOMAIN-NNN ID), control matrix (index mapping each invariant to its spec, test, and enforcement). | Written from scratch. Each definition references the code or spec where the term is enforced. |
| 27 | docs/02_specs/invariants.md | Consolidated invariants index table. Columns: INV ID, short description, spec definition (file:section), enforcement mechanism (file:line or constraint name), test (file:test_name). See §3E below for the draft initial set. | Synthesized from PLAN.md §2b, Critical Architectural Invariants, §15e, and code grep results. |
| 28 | docs/06_audit/control_matrix.md | Hand-maintained narrative table mapping invariant IDs to enforcement evidence. Each row: INV ID, spec location (file:section), test that verifies (file:test_name), database constraint or service check (file:line). Rows with incomplete enforcement are visible gaps. Manual maintenance; automation deferred indefinitely until friction-triggered. | Written from scratch using invariants.md as input. The control matrix adds the "is this actually enforced?" verification layer that invariants.md defines. |
| 29 | docs/07_governance/open_questions.md | See extraction #25 above — content extracted from PLAN.md §18. | Extracted, not written from scratch. |

### 3E. Draft invariant ID set

Only invariants with enforcement in code TODAY. Each entry lists
the proposed ID, description, and enforcement location.

**INV-LEDGER-001: Credits must equal Debits per journal entry**
- Enforcement: `supabase/migrations/20240101000000_initial_schema.sql` — deferred constraint trigger `trg_enforce_journal_entry_balance`
- Test: `tests/integration/unbalancedJournalEntry.test.ts`

**INV-LEDGER-002: Period must not be locked when posting**
- Enforcement: `supabase/migrations/20240101000000_initial_schema.sql` — trigger `trg_enforce_period_not_locked` with FOR UPDATE row lock
- Test: `tests/integration/lockedPeriodRejection.test.ts`

**INV-LEDGER-003: Events table is append-only**
- Enforcement: `supabase/migrations/20240101000000_initial_schema.sql` — triggers `trg_events_no_update`, `trg_events_no_delete`, `trg_events_no_truncate`
- Test: none (triggers verified manually during closeout; exit criteria #12 confirms existence)

**INV-LEDGER-004: Journal line is debit XOR credit, never both**
- Enforcement: `supabase/migrations/20240101000000_initial_schema.sql` — CHECK `line_is_debit_xor_credit`
- Test: implicit (Zod schema rejects at boundary; no dedicated integration test for this CHECK)

**INV-LEDGER-005: Journal line is never all-zero**
- Enforcement: `supabase/migrations/20240101000000_initial_schema.sql` — CHECK `line_is_not_all_zero`
- Test: implicit (Zod schema `.refine()` mirrors this; no dedicated integration test)

**INV-LEDGER-006: Line amounts are non-negative**
- Enforcement: `supabase/migrations/20240101000000_initial_schema.sql` — CHECK `line_amounts_nonneg`
- Test: implicit

**INV-MONEY-001: Money crosses service boundaries as string, never JS Number**
- Enforcement: `src/shared/schemas/accounting/money.schema.ts` — `MoneyAmountSchema` (z.string().regex), `FxRateSchema` (z.string().regex), branded types `MoneyAmount`, `FxRate`
- Test: `tests/unit/moneySchema.test.ts` (21 tests)

**INV-MONEY-002: amount_original = debit_amount + credit_amount**
- Enforcement: `supabase/migrations/20240101000000_initial_schema.sql` — CHECK `line_amount_original_matches_base`
- Test: implicit (Zod `.refine()` mirrors; no dedicated integration test for this CHECK)

**INV-MONEY-003: amount_cad = ROUND(amount_original * fx_rate, 4)**
- Enforcement: `supabase/migrations/20240101000000_initial_schema.sql` — CHECK `line_amount_cad_matches_fx`
- Test: implicit

**INV-RLS-001: Cross-org data isolation via RLS**
- Enforcement: `supabase/migrations/20240101000000_initial_schema.sql` — RLS policies on all tenant-scoped tables [verify — confirm policy names during extraction]
- Test: `tests/integration/crossOrgRlsIsolation.test.ts` (12 tests covering 6 tables)

**INV-AUTH-001: Every mutating service call is authorized via withInvariants()**
- Enforcement: `src/services/middleware/withInvariants.ts` — calls `canUserPerformAction()` unconditionally
- Test: `tests/integration/serviceMiddlewareAuthorization.test.ts`

**INV-REVERSAL-001: Reversal entries must mirror the original**
- Enforcement: `src/services/accounting/journalEntryService.ts` — mirror check before BEGIN (REVERSAL_NOT_MIRROR, REVERSAL_CROSS_ORG, REVERSAL_PARTIAL_NOT_SUPPORTED)
- Test: `tests/integration/reversalMirror.test.ts` (3 tests)

**INV-REVERSAL-002: Reversal reason is required and non-empty**
- Enforcement: `supabase/migrations/20240102000000_add_reversal_reason.sql` — CHECK `reversal_reason_required_when_reversing`; also validated at Zod layer and service layer
- Test: `tests/integration/reversalMirror.test.ts` (empty-reason rejection test)

**INV-IDEMPOTENCY-001: Agent-source entries require idempotency_key**
- Enforcement: `supabase/migrations/20240101000000_initial_schema.sql` — CHECK `idempotency_required_for_agent`
- Test: none (Phase 1.1 has no agent path; Phase 1.2 obligation)

**INV-AUDIT-001: Every mutation writes an audit_log row inside the transaction**
- Enforcement: `src/services/audit/recordMutation.ts` — called inside journalEntryService.post transaction
- Test: implicit (audit_log rows not asserted in tests — Phase 1.2 obligation to add assertions)

**INV-SERVICE-001: All database access goes through src/services/ (Law 1)**
- Enforcement: code review (no automated enforcement)
- Test: none (no lint rule; the `no-unwrapped-service-mutation` rule does not exist in code — see Drift section)

**INV-SERVICE-002: All journal entries created via journalEntryService.post() (Law 2)**
- Enforcement: code review + `withInvariants()` middleware
- Test: implicit (all integration tests go through the service)

### 3F. Invariants documented in PLAN.md/CLAUDE.md that LACK enforcement — NOT promoted to specs

These go into docs/09_briefs/phase-1.2/obligations.md as gaps, per
the spec-without-enforcement rule (convention 6).

1. **`no-unwrapped-service-mutation` lint rule** — CLAUDE.md Rule 2
   claims "A build-time lint rule (`no-unwrapped-service-mutation`)
   catches this — do not disable it." Grep of src/ returns zero
   hits. The retrospective (§7 item 4) explicitly flags: "CLAUDE.md
   claims it exists. It doesn't." Phase 1.2 must implement the rule
   before adding new mutation paths (agent tools).

2. **CI grep-fail check for hardcoded localhost:54321** — CLAUDE.md
   Rule 8 and PLAN.md §10a reference a CI grep-fail check. No CI
   pipeline exists (Phase 1.1 is local-only, no GitHub Actions
   workflow). The parameterization discipline IS followed in test
   code, but the automated enforcement does not exist. Phase 1.2/1.3
   obligation when CI is set up.

3. **Audit_log content assertions in tests** — Phase 1.2 obligations
   doc item: "audit_log content assertions in mutation tests."
   recordMutation is called but no test asserts the audit_log rows.
   INV-AUDIT-001 has enforcement in code (the function runs) but no
   test verification of output correctness.

4. **Pino redaction verification** — Exit criteria #20 DEFERRED.
   Pino logger has redaction config but no verification script or
   test. Phase 1.2 obligation.

5. **Read-path authorization on chartOfAccountsService.get()** —
   Audit finding BACKEND-006/SECURITY-005. The get function was
   flagged for missing org authorization check. [verify — confirm
   whether Phase 12A friction journal entry about read-function
   auth fixes addressed this]

### 3G. Root-level file changes

**README.md** — Replace current Next.js scaffold content with:
```markdown
# The Bridge

Family Office AI-Forward Accounting Platform.

## Quick start

See [docs/04_engineering/developer_setup.md](docs/04_engineering/developer_setup.md).

## Documentation

See [docs/README.md](docs/README.md) for the documentation index.

## Standing rules

See [CLAUDE.md](CLAUDE.md) for session rules loaded by Claude Code.
```

Current README.md content archived to docs/99_archive/README_nextjs_scaffold.md.

**docs/README.md** — NEW file, documentation index:
```markdown
# Documentation Index

## Reading order for new contributors

1. [Product vision](00_product/product_vision.md) — what and why
2. [System overview](03_architecture/system_overview.md) — how it's structured
3. [Phase simplifications](03_architecture/phase_simplifications.md) — why Phase 1 looks different
4. [Developer setup](04_engineering/developer_setup.md) — from git clone to running

## Reference

- [Ledger truth model](02_specs/ledger_truth_model.md) — invariants and rules
- [Data model](02_specs/data_model.md) — table-by-table schema reference
- [Invariants index](02_specs/invariants.md) — all INV-DOMAIN-NNN IDs
- [Control matrix](06_audit/control_matrix.md) — invariant enforcement evidence
- [ADRs](07_governance/adr/) — architectural decision records
- [Friction journal](07_governance/friction-journal.md) — the war diary

## Current phase

- [Current state](09_briefs/CURRENT_STATE.md) — where we are
- [Phase 1.2 obligations](09_briefs/phase-1.2/obligations.md) — what's next
```

### 3H. CLAUDE.md update plan

**New Navigation section** (replaces current lines 14-32):
```markdown
## Navigation

- **`docs/02_specs/ledger_truth_model.md`** — the ledger rules and
  invariants. The *what must always be true*. If the code and the
  truth model disagree, file a friction journal entry — the truth
  model is the spec, not the behavior.
- **`docs/03_architecture/phase_simplifications.md`** — Phase 1
  Reality vs Long-Term Architecture. The eight-row tiebreaker for
  Phase 1 simplifications. If two docs seem to contradict each
  other about how the system works, this document resolves it.
- **`docs/09_briefs/phase-1.2/obligations.md`** — current phase
  obligations. The *what* and *how* for the active phase.
- **`docs/07_governance/adr/`** — Architecture Decision Records.
  The first is `0001-reversal-semantics.md`. ADRs are written in
  anger, not preemptively. See `docs/07_governance/adr/README.md`
  for the rule.
- **`docs/02_specs/invariants.md`** — consolidated invariant index
  with INV-DOMAIN-NNN IDs. Each entry points to its spec definition
  and its code enforcement.
- **`AGENTS.md`** — imported above via `@AGENTS.md`. Carries the
  Next.js version-mismatch warning.
```

**New CLAUDE.md rule** — added as Rule 11 under "The non-negotiable
rules" section (after current Rule 10):

```markdown
### 11. AI write restrictions on documentation

The agent may create new files only in `docs/09_briefs/[current-phase]/`
and may append to `docs/07_governance/friction-journal.md`. The agent
may NOT create new files in the following directories without explicit
human approval in the conversation:

- `docs/00_product/`
- `docs/01_prd/`
- `docs/02_specs/`
- `docs/03_architecture/`
- `docs/04_engineering/`
- `docs/05_operations/`
- `docs/06_audit/`
- `docs/07_governance/adr/`
- `docs/07_governance/audits/`
- `docs/07_governance/retrospectives/`
- `docs/08_releases/`
- `docs/99_archive/`

This rule prevents LLM-context-contamination: the failure mode where
the agent helpfully generates documentation that becomes noise. Specs,
architecture, and governance docs are human-authored artifacts that
the agent reads but does not write without permission.
```

**Other CLAUDE.md changes in commit 5:**

- Update "What done means" item 3: replace "Every relevant PLAN.md
  section you touched is still internally consistent" with references
  to the new spec docs.
- Update "When in doubt" section: replace PLAN.md §18 reference with
  `docs/07_governance/open_questions.md`.
- Update all `See PLAN.md §X` references in rules 1-10 to point to
  the new file locations. Specifically:
  - Rule 1: "See PLAN.md Invariants 1 and 2 and §15" →
    "See docs/02_specs/ledger_truth_model.md"
  - Rule 2: "See PLAN.md §15e Layer 2" →
    "See docs/02_specs/ledger_truth_model.md INV-AUTH-001"
  - Rule 3: "See PLAN.md §3a" →
    "See docs/02_specs/ledger_truth_model.md §Money and
    src/shared/schemas/accounting/money.schema.ts"
  - Rule 4: "See PLAN.md §5c" →
    "See docs/09_briefs/phase-1.2/obligations.md (agent rules)"
    [verify — §5c is Phase 1.2+ content]
  - Rule 5: "Invariant 6. See PLAN.md §15b Rule 4" →
    "See docs/02_specs/ledger_truth_model.md INV-SERVICE-001"
  - Rule 7: "See PLAN.md §2b, §15e Layer 2, §4h, and ADR-001" →
    "See docs/02_specs/ledger_truth_model.md INV-REVERSAL-001 and
    docs/07_governance/adr/0001-reversal-semantics.md"
  - Rule 8: "See PLAN.md §10a (Q18 rule)" →
    "See docs/04_engineering/conventions.md" [verify — confirm
    Q18 test parameterization rule is extracted to conventions]
  - Rule 9: "See PLAN.md Section 0 row 6 and Section 14" →
    "See docs/03_architecture/phase_simplifications.md"
  - Rule 10: "See PLAN.md Phase 1 Simplifications..." →
    "See docs/03_architecture/phase_simplifications.md"

**Verification step:** Before committing, run:
```bash
grep -oP '(?:docs/|PLAN\.md|docs/specs/|docs/decisions/)[^\s\)\"]+' CLAUDE.md
```
and verify every path resolves to an existing file in the new tree.

### 3I. docs/decisions/README.md internal reference updates

The ADR README (moving to docs/07_governance/adr/README.md)
references:
- `PLAN.md` (lines 100-101, 103-105)
- `CLAUDE.md` (line 103)
- `docs/specs/` (line 105)

Update during commit 3 or commit 5:
- `PLAN.md` references → appropriate new spec docs
- `docs/specs/` → `docs/09_briefs/`
- `CLAUDE.md` stays (it's at repo root, unchanged path)

---

## Execution Sequence

### Commit 1 — Write the plan

This file (docs/restructure-plan.md) committed. No file moves.
The plan is the hypothesis; subsequent commits test it.

### Commit 2 — Empty structure

Create all folders under docs/:
```
docs/00_product/
docs/01_prd/
docs/02_specs/
docs/03_architecture/
docs/04_engineering/
docs/05_operations/
docs/06_audit/
docs/07_governance/
docs/07_governance/adr/
docs/07_governance/audits/
docs/07_governance/retrospectives/
docs/08_releases/
docs/09_briefs/
docs/09_briefs/phase-1.1/
docs/09_briefs/phase-1.1/superpowers/
docs/09_briefs/phase-1.2/
docs/99_archive/
```

Create README.md in every folder with the exact text from Part 2
above. Create docs/README.md (documentation index).

Run: `pnpm typecheck && pnpm test:integration`
Expected: pass (no code changed).

### Commit 3 — File moves in groups

All moves use `git mv` to preserve history. After each group, grep
for broken references within the moved files and fix them.

**Group A — Governance moves:**
```bash
git mv docs/decisions/0001-reversal-semantics.md docs/07_governance/adr/
git mv docs/decisions/README.md docs/07_governance/adr/
git mv docs/friction-journal.md docs/07_governance/
git mv docs/phase-1.1-retrospective.md docs/07_governance/retrospectives/phase-1.1-retrospective.md
# Move audits directory preserving structure:
git mv docs/audits/DESIGN.md docs/07_governance/audits/
git mv docs/audits/README.md docs/07_governance/audits/
git mv docs/audits/prompts docs/07_governance/audits/prompts
git mv docs/audits/phase-1.1 docs/07_governance/audits/phase-1.1
```

**Group B — Briefs moves:**
```bash
git mv docs/CURRENT_STATE.md docs/09_briefs/
git mv docs/specs/phase-1.1.md docs/09_briefs/phase-1.1/brief.md
# Add closed/historical header to brief.md after move
git mv docs/phase-1.1-exit-criteria-matrix.md docs/09_briefs/phase-1.1/exit_criteria_matrix.md
git mv docs/phase-1.1-test-coverage-catalog.md docs/09_briefs/phase-1.1/test_coverage_catalog.md
git mv docs/phase-1.1-schema-reconciliation.md docs/09_briefs/phase-1.1/schema_reconciliation.md
git mv docs/phase-1.2-obligations.md docs/09_briefs/phase-1.2/obligations.md
git mv docs/phase-1.2/journal-entry-form-gaps.md docs/09_briefs/phase-1.2/journal_entry_form_gaps.md
# Move superpowers preserving structure:
git mv docs/superpowers/briefs docs/09_briefs/phase-1.1/superpowers/briefs
git mv docs/superpowers/plans docs/09_briefs/phase-1.1/superpowers/plans
```

**Group C — Release moves:**
```bash
git mv docs/prompt-history/CHANGELOG.md docs/08_releases/CHANGELOG.md
```

**Group D — Archive moves:**
```bash
git mv docs/archive/Planv1.md docs/99_archive/PLAN_v1.md
```

After all groups: add the closed/historical header to
docs/09_briefs/phase-1.1/brief.md.

Run: `pnpm typecheck && pnpm test:integration`

Clean up empty directories left behind by git mv:
```bash
rmdir docs/decisions docs/specs docs/phase-1.2 docs/prompt-history docs/archive docs/superpowers docs/audits
```
[verify — confirm these are empty after moves; if docs/specs/ has
other files, flag them]

### Commit 4 — Extract from PLAN.md and add INV IDs

This is the riskiest step. Each extraction reads the specified
PLAN.md sections and produces a standalone document.

**Extraction order:**
1. docs/03_architecture/phase_simplifications.md (§0 + Simplifications section + §14 Event Sourcing decision + §15f ordering rules side-by-side)
2. docs/03_architecture/system_overview.md (§1, §1a)
3. docs/03_architecture/request_lifecycle.md (§1c)
4. docs/03_architecture/ui_architecture.md (§4a-§4h) — NEW per D8
5. docs/03_architecture/phase_plan.md (§7) — NEW per D8
6. docs/02_specs/data_model.md (§2a, §2c, §2e)
7. docs/02_specs/ledger_truth_model.md (Invariants 1-6, §1d, §2b, §3a, §10c, §15, §15e)
8. docs/04_engineering/developer_setup.md (§12 + §1b scripts)
9. docs/04_engineering/conventions.md (§12 Contribution Conventions + §3b-§3d worked example appendix + §11 i18n section)
10. docs/04_engineering/security.md (§9a.0-§9e) — NEW per D8
11. docs/04_engineering/testing_strategy.md (§10a) — NEW per D8
12. docs/00_product/product_vision.md ("The Product," "Who This Is For," etc.)
13. docs/00_product/personas.md ("Three User Personas")
14. docs/09_briefs/phase-1.2/agent_architecture.md (§5a-§5g + §15c-§15d) — NEW per D8
15. docs/09_briefs/phase-1.2/obligations.md — APPEND §17 as "Deferred Decisions" section

**Bidirectional code comments** — add after extracting
ledger_truth_model.md. Format: `// INV-DOMAIN-NNN: description`

Files receiving comments:
```
supabase/migrations/20240101000000_initial_schema.sql:
  - Above trg_enforce_journal_entry_balance: // INV-LEDGER-001
  - Above trg_enforce_period_not_locked: // INV-LEDGER-002
  - Above trg_events_no_update: // INV-LEDGER-003
  - Above line_is_debit_xor_credit CHECK: // INV-LEDGER-004
  - Above line_is_not_all_zero CHECK: // INV-LEDGER-005
  - Above line_amounts_nonneg CHECK: // INV-LEDGER-006
  - Above line_amount_original_matches_base CHECK: // INV-MONEY-002
  - Above line_amount_cad_matches_fx CHECK: // INV-MONEY-003
  - Above idempotency_required_for_agent CHECK: // INV-IDEMPOTENCY-001
  - [verify — confirm these are SQL comments using -- not //]

supabase/migrations/20240102000000_add_reversal_reason.sql:
  - Above reversal_reason_required_when_reversing CHECK: -- INV-REVERSAL-002

src/shared/schemas/accounting/money.schema.ts:
  - Above MoneyAmountSchema: // INV-MONEY-001

src/services/middleware/withInvariants.ts:
  - Above canUserPerformAction call: // INV-AUTH-001

src/services/accounting/journalEntryService.ts:
  - Above mirror check: // INV-REVERSAL-001

tests/integration/unbalancedJournalEntry.test.ts:
  - In describe block: // INV-LEDGER-001

tests/integration/lockedPeriodRejection.test.ts:
  - In describe block: // INV-LEDGER-002

tests/integration/crossOrgRlsIsolation.test.ts:
  - In describe block: // INV-RLS-001

tests/integration/serviceMiddlewareAuthorization.test.ts:
  - In describe block: // INV-AUTH-001

tests/integration/reversalMirror.test.ts:
  - In describe block: // INV-REVERSAL-001, INV-REVERSAL-002
```

**Verification:** After adding comments:
```bash
grep -rn "INV-" src/ supabase/ tests/ | sort
grep -rn "INV-" docs/02_specs/ | sort
```
Every INV ID should appear in both greps.

Run: `pnpm typecheck && pnpm test:integration`

### Commit 5 — New files, CLAUDE.md rewrite, archive PLAN.md, final sweep

**Create new files:**
1. docs/02_specs/invariants.md (the consolidated table from §3E)
2. docs/06_audit/control_matrix.md (maps INV IDs to enforcement evidence)
3. docs/00_product/glossary.md (agent-facing definitions)
4. docs/07_governance/open_questions.md (extracted from PLAN.md §18)

**CLAUDE.md rewrite:**
- Replace Navigation section per §3H above
- Add Rule 11 (AI write restrictions) per §3H above
- Update all PLAN.md references in Rules 1-10 per §3H above
- Update "What done means" and "When in doubt" sections per §3H above

**Archive PLAN.md:**
```bash
git mv PLAN.md docs/99_archive/PLAN_v0.5.6.md
```

**Replace root README.md** with minimal version per §3G above.
Archive current to docs/99_archive/README_nextjs_scaffold.md.

**Update ADR README** internal references per §3I above.

**Final reference sweep:**
```bash
# Should return zero matches outside /99_archive/:
grep -rn "PLAN\.md" docs/ CLAUDE.md --include="*.md" | grep -v "99_archive" | grep -v "PLAN_v"
grep -rn "docs/specs/phase-1.1" docs/ CLAUDE.md --include="*.md" | grep -v "99_archive"
grep -rn "docs/decisions/" docs/ CLAUDE.md --include="*.md" | grep -v "99_archive"
```

**Source code PLAN.md references** — these files reference PLAN.md
in code comments:
```
src/shared/schemas/accounting/money.schema.ts
src/services/accounting/journalEntryService.ts
src/shared/schemas/accounting/journalEntry.schema.ts
```
Update to reference the new spec doc locations. [verify — read
each file to determine exact comment text to update]

Run: `pnpm typecheck && pnpm test:integration`

---

## Drift Found During Reading

### D1. `no-unwrapped-service-mutation` lint rule does not exist

CLAUDE.md Rule 2 (line 59): "A build-time lint rule
(`no-unwrapped-service-mutation`) catches this — do not disable it."
PLAN.md §15e (line 3994): "enforced by a lint rule
(`no-unwrapped-service-mutation`)."

`grep -rn "no-unwrapped-service-mutation" src/` returns zero hits.
`grep -rn "no-unwrapped" src/` returns zero hits. The lint rule is
referenced in 9 documentation files and zero source files.

The retrospective (§7 item 4) explicitly states: "CLAUDE.md claims
it exists. It doesn't. Phase 1.2 adds agent tools as new mutation
paths — the rule should exist before those paths are built."

**Impact:** CLAUDE.md Rule 2 is currently making a false claim about
enforcement. During commit 5 CLAUDE.md rewrite, the claim should be
changed to acknowledge the rule is planned for Phase 1.2, not
currently active. The invariant (INV-AUTH-001) covers the
`withInvariants()` middleware which DOES exist and is tested; the
lint rule is the belt-and-suspenders layer that doesn't exist yet.

### D2. CLAUDE.md references to non-existent future briefs

CLAUDE.md line 22-23: "`docs/specs/phase-1.2.md`, `phase-1.3.md` —
future briefs, written one at a time..."

These files don't exist. After restructure, this entire Navigation
section is rewritten, so this is cosmetic — but flagged for
completeness.

### D3. Three source files contain PLAN.md section references in comments

`grep -rn "PLAN.md" src/` found references in:
- `src/shared/schemas/accounting/money.schema.ts` — references PLAN.md §3a
- `src/services/accounting/journalEntryService.ts` — references PLAN.md sections
- `src/shared/schemas/accounting/journalEntry.schema.ts` — references PLAN.md

These must be updated in commit 5 to point to the new spec locations.

### D4. docs/specs/ directory may have other contents

The plan assumes docs/specs/phase-1.1.md is the only file in
docs/specs/. `ls docs/specs/` confirmed only phase-1.1.md is
present. The directory can be safely removed after git mv.

### D5. docs/audits/ internal cross-references

The audit files (29 files) contain internal references to PLAN.md,
CLAUDE.md, docs/friction-journal.md, and docs/specs/phase-1.1.md.
These references are in historical audit findings and should NOT be
updated — they describe what was true at audit time. The audit files
move as-is; internal references are frozen historical artifacts.

### D6. §1b scripts block is too small for standalone file

PLAN.md §1b (package.json scripts block) is ~52 lines including
prose explanation. This is insufficient content for a standalone
scripts_reference.md. Decision: fold into developer_setup.md as a
"Scripts" section. The prompt anticipated this possibility.

### D7. PLAN.md §18 extent is larger than expected

§18 starts at line 4185 and the file is 4660 lines total. The
section is ~475 lines covering 20 questions across 4 categories.
10 are RESOLVED with inline resolutions that are substantial (some
are 30+ lines each). The extraction to open_questions.md needs to
decide: do resolved questions stay inline or get moved to the spec
doc they informed? Recommendation: resolved questions stay in
open_questions.md marked RESOLVED with a cross-reference to where
their resolution landed (e.g., "RESOLVED — see ADR-001 and
INV-REVERSAL-001"). This preserves the Q&A history.

### D8. Sections of PLAN.md not previously mapped — resolved destinations

Each unmapped section now has a specific destination. Sections marked
"extract in commit 4" are added to the commit 4 extraction list.
Sections marked "archive-only" stay in PLAN_v0.5.6.md with explicit
justification.

**§3b-§3d: Zod Output Schema, Three Consumers, Service Function Sketch**
→ Fold into docs/04_engineering/conventions.md as a "Worked Example"
appendix section. These ~160 lines demonstrate how schemas, services,
and consumers wire together — that's a conventions/patterns document,
not a spec. The code itself (money.schema.ts, journalEntry.schema.ts,
journalEntryService.ts) is the living version; the worked example is
an onboarding narrative. Extract in commit 4.

**§4: UI Architecture (§4a-§4h)**
→ Extract to docs/03_architecture/ui_architecture.md. This is
~400 lines covering the split-screen layout (§4a), canvas_directive
contract (§4b), ProposedEntryCard shape (§4c), canvas phasing table
(§4d), suggested prompts (§4e), routes (§4f), canvas context
injection (§4g), and reversal UI (§4h). The content is a mix of
Phase 1.1 (built) and Phase 1.2+ (not yet built), but it's
architectural — it defines the UI system's contracts and component
boundaries, not phase-specific execution steps. §4g and §4h are
actively referenced by Phase 1.2 work and need to be findable.
Extract in commit 4.

**§5: Agent Architecture (§5a-§5g)**
→ Extract to docs/09_briefs/phase-1.2/agent_architecture.md. This
is Phase 1.2 execution material — the orchestrator sketch (§5b),
tool definitions (§5a), anti-hallucination rules (§5c), autonomy
model (§5d), institutional memory (§5e), session persistence (§5f),
and the "no Layer 3 stubs" decision (§5g). It belongs in the
Phase 1.2 briefs folder because it will be actively consumed during
Phase 1.2 execution and is not yet validated by implementation.
The anti-hallucination rules (§5c) are already captured in CLAUDE.md
Rule 4; the extraction preserves the full context. Extract in
commit 4.

**§7: Phase Plan (Phase 1.1, 1.2, 1.3, Phase 2+, Timeline)**
→ Extract to docs/03_architecture/phase_plan.md. The phase plan is
architectural — it defines the scope boundaries, exit criteria, and
the governing principles ("build foundation before features," "use
the system before scoping the next phase"). Phase 1.1 exit criteria
are historical reference (already verified in exit_criteria_matrix.md).
Phase 1.2 exit criteria (19 items) are the active verification
target. Phase 1.3 exit criteria and the Phase 2 expectations are
forward-looking architectural commitments. The timeline reality
section is calibration data. All of this is system-level, not
phase-specific. Extract in commit 4.

**§8: Hard Problems (§8a-§8f)**
→ Archive-only. Each subsection is a 5-15 line stub documenting a
deferred problem (bank feeds, multi-currency, tax compliance,
reconciliation UX, bulk review, idempotency). The content is either
(a) already captured in the data model (§2a schema reservations now
in data_model.md), (b) already captured in Phase 1.2 obligations
(§8f idempotency wiring), or (c) Phase 2+ scope that will be
designed fresh in Phase 2 briefs with real implementation experience.
Extracting these stubs to a standalone file creates a document that
is neither actionable nor referenceable — it's a list of "we'll
figure this out later" items already tracked elsewhere. The archive
preserves them if needed.

**§9: Security and Secrets Management (§9a.0-§9e)**
→ Extract to docs/04_engineering/security.md. This is implementation
guidance: env var table (§9a), .env file strategy (§9b), production
secrets (§9c), key rotation (§9d), pino redaction config (§9e), and
the hosting region pinning rule (§9a.0). All are actively in use in
Phase 1.1 and will remain load-bearing through Phase 1.2+. The env
var table and redaction config are reference material consulted
during development. Extract in commit 4.

**§10a: Testing Strategy**
→ Extract to docs/04_engineering/testing_strategy.md. This is ~80
lines of implementation guidance: what to unit-test, what not to
mock, parameterization rules, coverage targets, test file layout,
naming conventions. Actively referenced by the "tests pass" exit
criterion and by anyone adding new tests. Extract in commit 4.

**§10c: Transaction Isolation Level**
→ Fold into docs/02_specs/ledger_truth_model.md as a section. The
isolation level decision (READ COMMITTED + targeted row locks) is
a ledger truth rule — it determines how concurrent mutations
interact with the deferred constraint and period lock trigger.
It's ~30 lines and directly supports INV-LEDGER-001 and
INV-LEDGER-002. Extract in commit 4 alongside the other
ledger_truth_model content.

**§10, §10b: Performance/Scale Notes, Unit Economics**
→ Archive-only. §10 is 20 lines of general principles (index plan
reference, bulk operations, N+1 avoidance, caching deferral) that
are either already captured in conventions (index plan → data_model,
transactional writes → ledger_truth_model) or are Phase 2+ guidance.
§10b is 40 lines of cost model guidance that is Phase 1.3 scoping
input, not a referenceable spec. Both are preserved in the archive
and will be pulled forward if Phase 1.3 scoping needs them.

**§11: Internationalization**
→ Fold into docs/04_engineering/conventions.md as an "i18n" section.
The content is ~40 lines: next-intl setup, structured agent response
rule (template_id + params, not English prose), placeholder locale
strategy. This is implementation convention, not architecture. Short
enough to be a section, not a standalone file. Extract in commit 4.

**§13: What Not to Build**
→ Archive-only. This is a 15-row build-vs-buy table that was
decision scaffolding during v0.4.0 architecture. The decisions it
records (build: accounting logic, agent orchestration, memory,
consolidation, UI; buy: OCR, bank feeds, tax tables, e-invoicing)
are implicit in the architecture and phase plan. A standalone
"what not to build" doc has no ongoing audience — nobody consults
it during implementation. The archive preserves the reasoning.

**§14: Event Sourcing vs CRUD + Audit**
→ Fold into docs/03_architecture/phase_simplifications.md as a
section. This is ~30 lines explaining the resolved decision: Phase 1
uses CRUD + audit, Phase 2 migrates to hybrid event sourcing. It
directly supports Simplification 1 (sync audit log) and
Simplification 2 (reserved-seat events table), which are already
the core content of phase_simplifications.md. Putting the decision
and its simplifications in the same document eliminates a cross-
reference hop. Extract in commit 4.

**§15c-§15d: Contract file, Confidence routing**
→ Fold into docs/09_briefs/phase-1.2/agent_architecture.md alongside
§5. §15c defines the one real contract file
(doubleEntry.contract.ts) — that's Phase 1.2 execution context.
§15d defines confidence routing (Phase 2, display-only in Phase 1)
— also agent-layer context. Both are short (~30 lines combined) and
belong with the agent architecture they support. Extract in commit 4.

**§15f: Ordering rules side-by-side**
→ Already captured. The Phase 1 vs Phase 2 ordering diagrams are the
operational expression of Simplifications 1 and 2. Fold into
docs/03_architecture/phase_simplifications.md alongside §14. The
side-by-side diff is the clearest illustration of what the
simplifications actually change. Extract in commit 4.

**§16: Documentation and Decision Tracking**
→ Archive-only. This is ~25 lines that describe the ADR philosophy
("written in anger, not in advance") and what Phase 1.1 creates
(CHANGELOG, decisions/README, friction journal). The ADR philosophy
is already in docs/07_governance/adr/README.md (which is richer and
more specific). The "what Phase 1.1 creates" list is historical.
The archive preserves both.

**§17: Phase 1.2 Decisions Deferred**
→ Fold into docs/09_briefs/phase-1.2/obligations.md as a
"Deferred Decisions" section. §17 lists seven implementation-detail
decisions the Bible deliberately does not pre-resolve — they are
Phase 1.2 brief-writing inputs. That is exactly what obligations.md
is: the list of things Phase 1.2 inherits. Adding §17's items as a
section rather than leaving them in the archive ensures the Phase
1.2 brief writer sees them. ~30 lines. Extract in commit 4.

**Summary of D8 resolutions:**

| Section | Destination | Commit |
|---|---|---|
| §3b-§3d | docs/04_engineering/conventions.md (appendix) | 4 |
| §4 | docs/03_architecture/ui_architecture.md (NEW) | 4 |
| §5 | docs/09_briefs/phase-1.2/agent_architecture.md (NEW) | 4 |
| §6 | archive-only (schema reservations already in data_model.md) | — |
| §7 | docs/03_architecture/phase_plan.md (NEW) | 4 |
| §8 | archive-only (stubs tracked elsewhere) | — |
| §9 | docs/04_engineering/security.md (NEW) | 4 |
| §10a | docs/04_engineering/testing_strategy.md (NEW) | 4 |
| §10c | docs/02_specs/ledger_truth_model.md (section) | 4 |
| §10, §10b | archive-only (general principles + cost model) | — |
| §11 | docs/04_engineering/conventions.md (section) | 4 |
| §13 | archive-only (build-vs-buy scaffolding) | — |
| §14 | docs/03_architecture/phase_simplifications.md (section) | 4 |
| §15c-§15d | docs/09_briefs/phase-1.2/agent_architecture.md (section) | 4 |
| §15f | docs/03_architecture/phase_simplifications.md (section) | 4 |
| §16 | archive-only (ADR philosophy already in adr/README.md) | — |
| §17 | docs/09_briefs/phase-1.2/obligations.md (section) | 4 |

**Archive-only sections (§6, §8, §10/10b, §13, §16)** remain in
docs/99_archive/PLAN_v0.5.6.md. No extraction needed.

**Action:** During commit 5, add a note at the top of
docs/99_archive/PLAN_v0.5.6.md:
```
> **Archived.** Canonical versions of extracted content live in
> docs/02_specs/, docs/03_architecture/, docs/04_engineering/,
> docs/00_product/, and docs/09_briefs/. Sections not extracted
> (§6 Intercompany, §8 Hard Problems, §10/10b Performance/Cost,
> §13 What Not to Build, §16 Documentation Tracking) remain here
> as reference material — they are either scaffolding that served
> its purpose or Phase 2+ content that will be designed fresh.
```

---

## File Count Verification

**Files moved verbatim:** 12 individual files + 29 audit files + 5 superpowers files + 1 archive file = 47

**PLAN.md extractions:** 14 destination files:
- Original 9: phase_simplifications, system_overview, request_lifecycle, data_model, ledger_truth_model, developer_setup, conventions, product_vision, personas
- D8 additions (5 new files): ui_architecture, phase_plan, security, testing_strategy, agent_architecture
- D8 fold-ins (no new files): §10c → ledger_truth_model, §14/§15f → phase_simplifications, §3b-§3d/§11 → conventions, §15c-§15d → agent_architecture, §17 → obligations.md

**New files created from scratch:** 4 (glossary, invariants, control_matrix, open_questions)

**New READMEs:** 11 (one per folder) + docs/README.md = 12

**Root-level changes:** 1 (README.md replaced; archive copy = 1 file in /99_archive/)

**Archive additions:** PLAN_v0.5.6.md (1) + PLAN_v1.md (moved, counted above) + README_nextjs_scaffold.md (1)

**Total distinct files in new structure:** 47 (moved) + 14 (extracted) + 4 (new) + 12 (READMEs) + 2 (archive additions) = **79 files** under docs/ (excluding CLAUDE.md and AGENTS.md which stay at root and are edited in place, not counted as new files)
