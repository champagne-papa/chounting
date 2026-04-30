# Docs Index

One-line-per-file guide to `docs/`. Skim this first; open the
specific file you need second. Grouped by the existing numbered
directories; the tree is preserved as-is.

`CLAUDE.md` at the repo root carries the always-loaded standing
rules and points here for everything else.

## Top-level

- `README.md` — orientation for new contributors: reading order plus a compact reference list.
- `restructure-plan.md` — Phase 1.1 closeout working plan for the docs reorganization itself; historical context for why the tree is numbered this way. Moves to `99_archive/` when fully retired.

## 00_product — vision and people

- `product_vision.md` — the thesis ("deterministic financial engine with a probabilistic interface"), product boundaries, non-negotiable constraints, locked-in stack.
- `personas.md` — the three equal-class user personas (Executive, Controller, AP Specialist) and what each needs from the product.

## 01_prd — product requirements

Folder ships empty through Phase 1.2 close (2026-04-26). First
candidate is a Phase 2 PRD if scope warrants a product-level doc
separate from the execution brief. See the folder README for the
deletion criterion.

## 02_specs — the rules (enforcement-backed)

- `ledger_truth_model.md` — the canonical 18 invariants with full leaves, Phase 2 evolution notes, and interactions. Tiebreaker for "is X legal in the ledger."
- `agent_autonomy_model.md` — Layer 4 governance: the Agent Ladder (three rungs), limit model (four dimensions), System vs. Policy boundary, policy decision tree.
- `intent_model.md` — the canonical `Intent` discriminated union (Navigation / Mutation / Query), `ProposedMutation` shape, Four Questions grammar, Logic Receipts spec.
- `mutation_lifecycle.md` — the six states a proposed mutation passes through, Needs Attention prioritization triggers, the 24-hour reversible window.
- `data_model.md` — table-by-table schema reference: columns, named CHECK constraints, triggers, indexes, RLS policies.
- `invariants.md` — contributor-facing rollup index: every INV-ID, its layer, its leaf anchor, its code enforcement site. Carries the bidirectional-reachability proof.
- `glossary.md` — vocabulary reference for terms with project-specific meanings (`adminClient`, `MoneyAmount`, Two Laws, canvas directive, etc.). Does not redefine GAAP/IFRS or generic software terms. Includes the `## Workflow Vocabulary` section (Arc / Phase / Session / Sub-session hierarchy + supporting terms; codified 2026-04-26).
- `open_questions.md` — unresolved questions across founder data, architectural defaults, closeout surfacings, and formalization candidates. Current leading entry: Q32 (reversal-mirror step-order discrepancy).

## 03_architecture — how the pieces fit

- `system_overview.md` — major components and folder tree. Day-one document for a new engineer.
- `monorepo.md` — Pattern 3 monorepo layout (apps/web + apps/demo + packages/tokens + packages/ui), the demo → ui → web component migration path, and the new-component decision tree. Also flags the 7 pre-existing `@/db/adminClient` lint violations excluded from CI gating.
- `phase_plan.md` — scope boundaries, exit criteria, and governing principles for each phase.
- `phase_simplifications.md` — the eight places Phase 1 deliberately diverges from the long-term target and exactly how Phase 2 corrects each one. The single most important architecture doc.
- `request_lifecycle.md` — the three request paths (manual / agent / confirmation) from browser to DB and back.
- `agent_interface.md` — durable, phase-agnostic agent contract: one voice, typed tools, structured outputs, persona discipline, onboarding flow. Phase-specific mechanics live under `09_briefs/`.
- `ui_architecture.md` — split-screen shell (chat + Contextual Canvas + Mainframe rail), `canvas_directive` contract, component shapes, reversal UI flow.

## 04_engineering — from clone to running

- `developer_setup.md` — prerequisites, local setup, seed flow, troubleshooting recipes.
- `conventions.md` — branch/commit naming, contribution rules, coding conventions (camelCase API ↔ snake_case DB, permission/audit key naming, etc.). Also carries the Phase 1.5A and Phase 1.2 codified-convention catalogs and the `## Documentation Routing` convention (routing rule, write-time tripwires including the 10-second rule and `[ROUTE?]` fallback, codification thresholds, hygiene cadence, archival rule, deprecation model; codified 2026-04-26).
- `testing_strategy.md` — what to test and how; Category A floor table; env-var cascade for test DB URLs.
- `security.md` — Canadian-region hosting constraint, env var handling, logging hygiene rules.

## 05_operations — runbooks

Folder ships empty in Phase 1.1. First candidate is a Phase 1.3
deployment runbook or backup procedure. See the folder README
for the deletion criterion.

## 06_audit — invariant evidence

- `control_matrix.md` — auditor-facing evidence table: each INV-ID → spec leaf + test coverage + specific enforcement mechanism + failure mode.

## 07_governance — institutional memory

- `friction-journal.md` — append-only war diary for the **active phase only**. `WANT` / `CLUNKY` / `WRONG` / `NOTE` entries recording what surprised us and why. 10-second rule: each entry readable in ~10 seconds. Closed phases archive to `friction-journal/phase-X.md` per the Documentation Routing convention's archival rule. Agents may append here; other files in this folder require explicit human approval.
- `friction-journal/phase-1.1.md` — archived terse-entry journal for Phase 1.1 (~42KB).
- `friction-journal/phase-1.5.md` — archived terse-entry journal for Phase 1.5A (~4.5KB).
- `friction-journal/phase-1.2.md` — archived journal for Phase 1.2 (~335KB). Sections (a) through (q) preserve original lettering across three independent sequences (Phase C / Phase D / Phase E). Long-prose subsections (o) "C7 EC-13 closeout deliverables" and (p) "C11 retrospective on C7 EC-13" stubbed with one-line pointers to `phase-1.2-retrospective.md` §3 Pattern 6.
- `friction-journal/arc-A.md` — archived terse-entry journal for Arc A (Phase 0–1.1 Control Foundations, 2026-04-24 closeout, ~9.2KB). Cross-arc work spanning Phase 0–1.1; companion to `arc-A-retrospective.md`.
- `retrospectives/phase-1.1-retrospective.md` — closeout retrospective (2026-04-13): what shipped, what surprised, lessons for Phase 1.2.
- `retrospectives/phase-1.2-retrospective.md` — closeout retrospective (2026-04-26): wins / frictions / conventions / scope. Inheritance-artifact map at §2; cross-session patterns at §3 (Pattern 1–8).
- `retrospectives/arc-A-retrospective.md` — Arc A closeout retrospective (2026-04-24): 12-step execution arc, 9 patterns, three-role workflow meta-observations.

### 07_governance/adr — Architecture Decision Records

- `adr/README.md` — ADR format, when-to-write rules, supersession process, current ADR index.
- `adr/0001-reversal-semantics.md` — reversal entries are normal `journal_entries` rows with self-FK + non-empty reason; three-layer enforcement. Tiebreaker for `reversal_reason` column placement.
- `adr/0002-confidence-as-policy-input.md` — confidence scores drive routing internally; never displayed as a number in the UI.
- `adr/0003-one-voice-agent-architecture.md` — the user sees one agent, always. No user-facing sub-agent delegation.
- `adr/0004-ghost-rows-visual-contract.md` — four-signal defense-in-depth for ghost rows (proposed-but-unapproved mutations); prevents "transient overlay mistaken for posted data."
- `adr/0005-three-path-intent-schema.md` — chat / palette / Mainframe all produce the same `Intent` object; single intent schema prevents three bespoke routers.
- `adr/0006-agent-persona-unnamed.md` — the agent is a senior bookkeeper, unnamed. No anthropomorphization in UI copy.
- `adr/0008-layer-1-enforcement-modes.md` — Layer 1 invariant enforcement modes (CHECK constraint vs deferred constraint vs trigger).
- `adr/0009-before-state-capture-convention.md` — `before_state` capture convention for `audit_log` rows; locked to Phase 1.5A's six-service rollout.
- `adr/0010-reserved-enum-states.md` — reserved enum states with Phase 2 corrections; Phase 1 simplifications use placeholder values that Phase 2 fills.

### 07_governance/audits — audit framework

- `audits/README.md` — how to read an audit, framework summary, completed-audits index.
- `audits/DESIGN.md` — audit framework: four-phase execution (Orientation → Category Scans → Synthesis → Write), session boundaries, category collapse rules, findings format.
- `audits/prompts/orientation.md` — Phase 1 prompt. Reads codebase cold, produces 10–15 cross-cutting hypotheses.
- `audits/prompts/scan-architecture-fit.md` — Phase 2 category scan. Also serves as the template for the other nine scan prompts.
- `audits/prompts/scan-backend-design.md` — Phase 2 category scan: backend design & API.
- `audits/prompts/scan-code-quality.md` — Phase 2 category scan: code quality & maintainability.
- `audits/prompts/scan-data-layer.md` — Phase 2 category scan: data layer & database design.
- `audits/prompts/scan-frontend-architecture.md` — Phase 2 category scan: frontend architecture.
- `audits/prompts/scan-infrastructure-devops.md` — Phase 2 category scan; sparse at Phase 1.1 (no custom CI/CD).
- `audits/prompts/scan-observability-reliability.md` — Phase 2 category scan; sparse at Phase 1.1 (Pino only, no metrics/tracing/alerting).
- `audits/prompts/scan-performance-scalability.md` — Phase 2 category scan; sparse at Phase 1.1 (no prod traffic or load testing).
- `audits/prompts/scan-security-compliance.md` — Phase 2 category scan: security & compliance.
- `audits/prompts/synthesis.md` — Phase 3 prompt. Deduplicates, merges, cross-references findings; verifies hypotheses.
- `audits/prompts/write.md` — Phase 4 prompt. Composes the final `audit-report.md` and `action-plan.md`.
- `audits/phase-1.1/audit-report.md` — first audit report. 21 unified findings (1 Critical, 5 High, 8 Medium, 7 Low). Executive summary flags UF-001 (transaction atomicity) and UF-002 (doc-reality divergence).
- `audits/phase-1.1/action-plan.md` — prioritized follow-ups from the audit, referencing findings by ID. Quick Wins, Medium-Term, Long-Term, explicit "Do Not Do" list.
- `audits/phase-1.1/unified-findings.md` — synthesis output: 21 deduplicated findings with severity, cross-refs, and hypothesis verification.
- `audits/phase-1.1/hypotheses.md` — orientation output: cross-cutting search targets that guided the category scanners.
- `audits/phase-1.1/known-concerns.md` — pre-execution risk injections from build-time friction evidence.
- `audits/phase-1.1/audit-metadata.md` — execution details, session configuration, known limitations (self-audit bias acknowledged).
- `audits/phase-1.1/findings/architecture-fit.md` — scanner log: architecture fit angle, 5 hypotheses investigated.
- `audits/phase-1.1/findings/backend-design.md` — scanner log: backend design & API, 8 hypotheses investigated.
- `audits/phase-1.1/findings/code-quality.md` — scanner log: code quality & maintainability, 4 hypotheses investigated.
- `audits/phase-1.1/findings/data-layer.md` — scanner log: data layer & DB design, 7 hypotheses investigated.
- `audits/phase-1.1/findings/frontend-architecture.md` — scanner log: frontend architecture, 5 hypotheses investigated.
- `audits/phase-1.1/findings/infrastructure-devops.md` — scanner log (sparse baseline; local dev only).
- `audits/phase-1.1/findings/observability-reliability.md` — scanner log (sparse baseline; Pino only).
- `audits/phase-1.1/findings/performance-scalability.md` — scanner log (sparse baseline; no load testing).
- `audits/phase-1.1/findings/security-compliance.md` — scanner log: security & compliance, 6 hypotheses investigated.

## 08_releases — changelog

- `CHANGELOG.md` — PLAN.md version history (v0.5.0 through v0.5.6). Single source of truth for spec-level release history.

## 09_briefs — per-phase execution

- `CURRENT_STATE.md` — where the project is right now. Living doc updated as phases/sessions close out.

### 09_briefs/phase-1.1 — closed

- `phase-1.1/brief.md` — Phase 1.1 execution brief (closed 2026-04-13). Preserved as historical reference.
- `phase-1.1/exit_criteria_matrix.md` — 42 MET / 6 DEFERRED / 3 N/A / 0 MISSED at Phase 1.1 closeout.
- `phase-1.1/schema_reconciliation.md` — three-source reconciliation (migrations, generated types, Zod schemas) across 24 tables.
- `phase-1.1/test_coverage_catalog.md` — catalog of 26 integration tests + 49 unit tests with gap notes.

### 09_briefs/phase-1.2 — closed 2026-04-26 (Double Entry Agent)

- `phase-1.2/brief.md` — Phase 1.2 master execution brief. Frozen at SHA aae547a; never modified during execution.
- `phase-1.2/agent_architecture.md` — phase-specific agent internals: orchestrator, tools, session persistence, institutional memory. Companion to the durable `03_architecture/agent_interface.md`.
- `phase-1.2/canvas_context_injection.md` — minimal bidirectional chat ↔ canvas context for Phase 1.2 (full bidirectional UX is Phase 2).
- `phase-1.2/journal_entry_form_gaps.md` — Zoho Books comparison; schema and UX deltas the Phase 1.2 form should close.
- `phase-1.2/obligations.md` — inherited must-do / elevated-pattern list from Phase 1.1 closeout.
- `phase-1.2/session-1-brief.md` — Session 1: foundational groundwork. Status in `CURRENT_STATE.md`.
- `phase-1.2/session-2-brief.md` — Session 2: orchestrator skeleton. Status in `CURRENT_STATE.md`.
- `phase-1.2/session-3-brief.md` — Session 3: system prompts + i18n. Status in `CURRENT_STATE.md`.
- `phase-1.2/session-4-brief.md` — Session 4: real API + routes + OrgContext (first paid-API session). Status in `CURRENT_STATE.md`.
- `phase-1.2/session-5-brief.md` — Session 5: onboarding state machine + welcome page + sign-in redirect. Status in `CURRENT_STATE.md`.
- `phase-1.2/session-6-brief.md` — Session 6: form-escape surfaces + canvas directive extensions (master §12 and §15). Status in `CURRENT_STATE.md`.
- `phase-1.2/session-7-brief.md` — Session 7: orchestrator + tools execution. Status in `CURRENT_STATE.md`.
- `phase-1.2/session-7-1-brief.md` — Session 7.1 sub-session: design pass (carved mid-thread when scope expanded).
- `phase-1.2/session-7-1-1-brief.md` — Session 7.1.1: design-pass continuation.
- `phase-1.2/session-7-1-2-brief.md` — Session 7.1.2: EC-19 run.
- `phase-1.2/session-8-brief.md` — Session 8: paid-API verification + C6/C7 stack.
- `phase-1.2/session-8-c6-prereq-o2-org-id-injection-plan.md` — Session 8 C6 prereq: OI-2 org-id injection fix-stack plan.
- `phase-1.2/session-8-c6-prereq-o2-v2-pre-zod-injection-plan.md` — Session 8 C6 prereq: OI-2 v2 pre-Zod injection plan (revision after prior plan superseded).
- `phase-1.2/session-8-c6-prereq-o3-agent-date-context.md` — Session 8 C6 prereq: OI-3 agent date-context preparation.
- `phase-1.2/session-8-c6-prereq-o3-execution-plan.md` — Session 8 C6 prereq: OI-3 execution plan.
- `phase-1.2/oi-3-class-2-fix-stack-scoping.md` — OI-3 / Class 2 fix-stack scoping doc (mechanism identified, fix surface bounded, methodology partitioned, hypothesis treatment authored; first concrete application of Meta A and Meta B at scoping time). Phase 2 carry-forward.
- `phase-1.2/ec-matrix.md` — Phase 1.2 EC matrix (codified at C10, updated at C12). 27 ECs + 3 shipping line items across 6 sections; post-C12 totals: 21 MET / 7 DEFERRED / 2 PARTIAL / 0 MISSED.
- `phase-1.2/session-15-brief.md` — Session 15 brief: Documentation Routing convention + Workflow Vocabulary ratification. Authority for the friction-journal split.
- `phase-1.2/session-16-brief.md` — Session 16 brief: friction-journal split + INDEX update (this commit). First concrete application of Documentation Routing convention's archival rule.

### 09_briefs/phase-1.5 — closed (org profile, users/MFA, permissions)

- `phase-1.5/brief.md` — Phase 1.5A execution brief (organization profile expansion). Complete.
- `phase-1.5/exit-criteria-matrix.md` — Phase 1.5A exit criteria: 21/21 MET (109 tests).
- `phase-1.5/1.5B-brief.md` — Phase 1.5B execution brief (users, invitations, MFA enforcement). Complete.
- `phase-1.5/1.5B-exit-criteria-matrix.md` — Phase 1.5B exit criteria (134 tests).
- `phase-1.5/1.5C-brief.md` — Phase 1.5C execution brief (permissions refactor: TypeScript map → table-driven catalog). Complete.
- `phase-1.5/1.5C-exit-criteria-matrix.md` — Phase 1.5C exit criteria (162 tests).

### 09_briefs/phase-2 — forward-looking planning

- `phase-2/README.md` — folder rules; protection note for `interaction_model_extraction.md`.
- `phase-2/obligations.md` — Phase 2 carry-forward queue from Phase 1.2 closeout: named workstreams (OI-3 / Class 2), deferred ECs, investigation queue, sensible-accounting candidates, COA gaps, architectural follow-ups, convention split-trigger watch, Documentation Routing refinement candidates.
- `phase-2/agent_architecture_proposal.md` — three-tier agent architecture (commit / proposal / interface paths). CTO-reviewed, approved in principle 2026-04-19. Resolution path: ADR-0007 + `02_specs/agent_architecture_policy.md` during Phase 2 scoping after Phase 1.3 triage. Five open items Q27–Q31 block ADR drafting. Operationalizes ADR-0003 and Simplification 3; changes no existing invariant.
- `phase-2/interaction_model_extraction.md` — human-authored architectural statement (five interaction primitives). Preserved verbatim from the commit-4b prelude; do not modify without explicit approval.
- `phase-2/cmd_z_as_reversal.md` — keyboard-undo-that-posts-a-reversal pattern (the ledger is append-only per ADR-0001).
- `phase-2/contextual_annotations.md` — inline hover markers attaching narrative "why" to P&L variances via Logic Receipts.
- `phase-2/institutional_memory_view.md` — "Learned Rules" canvas view; lets controllers inspect / edit / disable rules the agent has learned.
- `phase-2/mini_map_large_ledgers.md` — heat-map scroll bar for long ledger and bank-feed views (uncategorized / error / draft rows).
- `phase-2/mirror_cards_intercompany.md` — two-sided Proposed Mutation Card for intercompany entries; atomic dual-post with due-to / due-from integrity.
- `phase-2/mobile_approval_remote.md` — mobile repositions around approval, not deep work: full-screen mutation card, swipe-to-approve.
- `phase-2/peek_drill_down.md` — Shift+Click on a P&L row opens an inline Peek panel listing contributing transactions; Escape collapses.
- `phase-2/pinned_views_strip.md` — 3–5 user-pinned canvas views at the top of the canvas area; bookmarks, not split-panes.
- `phase-2/triage_bucket_intake.md` — drag-and-drop intake rail; OCR'd files visually migrate from Bucket → Pending column of the Mutation Lifecycle.

## 99_archive

Superseded documents preserved for historical reference only.
**Not consulted for current rules.** If you're reading a file
here to understand a current rule, the canonical version has
moved — check `02_specs/` or `03_architecture/`. Contents are
deliberately not enumerated in this index.
