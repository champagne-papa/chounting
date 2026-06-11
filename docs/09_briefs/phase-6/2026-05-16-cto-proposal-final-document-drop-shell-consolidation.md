> **STATUS — SUPERSEDED 2026-05-16**
>
> This v2 proposal is superseded by v3 at:
> `docs/09_briefs/phase-6/2026-05-16-cto-proposal-v3-document-drop-shell-consolidation.md`
>
> v3 integrates four CTO sign-off edits (executive summary
> six-decision listing; Phase 7 / session-count estimate
> reconciliation; DocumentIntakeRail two-step removal
> clarification; chunk 1 rename) plus two Session A
> preserved-evidence refinements (phase_plan.md staleness
> annotation; Finding T no-chat_messages-table addition).
>
> CTO sign-off received 2026-05-16 with approval of
> Decisions 1/2/3/5/6 + conditional approval of Decision 4
> (resolved via Edit 2).
>
> This v2 document preserved as historical record per
> ADR-0022 §2 supersession discipline at proposal-document
> grain. All content below this header is unchanged.

# Final Proposal: Document-Drop + Bridge Shell Consolidation

**Date:** 2026-05-16
**Version:** v2 (final, post-verify-from-disk review)
**Status:** Awaiting final CTO sign-off
**Supersedes:** a9f1071 + initial proposal v1
**Operational state:** Phase 6 closed structurally at 625c7df
(2026-05-15); `origin/staging` at ed9820f post-Phase-6-close
baseline; WSL Claude standing by terminally for next operational
session.

---

## 1. Executive summary

The brainstorming arc (2026-05-15 → 2026-05-16) produced three
architectural reframes that make the original feature request
(a9f1071) substantively obsolete:

1. **Token-economy reframe.** AI agent invocation on document drop
   is backend-routing-driven (document type × extraction
   conviction × user text intent), not UI-selection-driven.

2. **Document-type discriminator seam reframe.** v1 ships billing
   only; v2 extends to T2/NOA/CRA letters/etc.

3. **Shell-consolidation reframe.** Four-zone Bridge shell
   consolidates to three-zone (consolidated left panel + chat +
   canvas) with Claude.ai-inspired workspace-as-module navigation
   + limited multi-tab canvas.

This proposal requests CTO sign-off on:
- Supersession of a9f1071 by a v2 scope-lock-input artifact
- Phase 6.5 amendment-cycle framing per Phase 2.5 precedent
- Path 2 multi-tab decision (limited at v1; full reserved post-v1)
- Sequencing path: artifact drafting → scope-lock → brief
  amendment cycle → Phase 6.5 chunks → Phase 5.1 amendments →
  Phase 7

The CTO's prior conditional sign-off conditions are integrated.
Two comprehensive verify-from-disk passes against the codebase
surfaced **19 substrate findings**; the proposal accounts for
all of them.

---

## 2. What two verify-from-disk passes revealed

The CTO's verification directive triggered two comprehensive
sweeps. Findings, ordered by impact:

### 2.1 Pass 1 findings (initial CTO-directed verification)

| # | Initial proposal framing | Verified reality |
|---|---|---|
| 1 | `document_type` substrate needs to be added at v1 | Shipped at Phase 2 chunk 1 (migration 143). `document_type` column on `document_cases` with full 18-value closed enum per ADR-0011 §6; v1-active CHECK = `(vendor_invoice, receipt, payment_confirmation, unknown)`. Ingestion writes `'unknown'`; Phase 7 classifier updates post-classification. Column is **mutable** per the column-immutability trigger (state, document_type, current_relationship_candidate_id, classification_confidence are workflow-mutable). |
| 2 | `documentRoutingService` is net-new Δ.4 work | Service shipped at Phase 4 chunks 1-3 (migrations 149/150/151). Three subsystems: `completeCandidate` (Subsystem 1 — Ledger-State Candidate Completion), `resolveCandidates` (Subsystem 2 — Ambiguity Resolution with 3-branch decision), `dispatchTrigger` (Subsystem 3 — T1/T3/T5/T8/T10 Re-Evaluation Logic). |
| 3 | Exception queue routing path needs to be specified | Fully shipped at chunk-6-Phase-2 + chunk-3-Phase-4 (migrations 148/151). Three atomic RPCs (`enqueue_exception_with_audit`, `resolve_exception_with_audit`, `cancel_exception_with_audit`); 18-value `resolution_action` enum; partial UNIQUE on (document_case_id, exception_status='open') for one-open-per-case. |
| 4 | Sequencing places Δ.4 before Phase 7 | Phase 4 closed; routing service exists. Pre-Phase-7 work for routing concerns is empty. |
| 5 | `triage_bucket_intake.md` is small supersession note | Ratified PRD in `docs/01_prd/`. PRD-grade supersession treatment required. |
| 6 | Region 7.4 chat history surface ships at v1 | `agent_sessions` substrate is one-row-per-(user, org). Chat history would list one item. Sub-Q13 multi-session substrate is genuine deferral. |
| 7 | Δ.2 multi-tab ~600-1000 lines | canvasContext lift from `{directive, selectedEntity}` singleton to `Array<{tabId, directive, selectedEntity, navigationHistory}> + activeTabId` is larger refactor. |
| 8 | Δ.3 PendingDocumentsView ~700-1000 lines | `document_cards_view` shipped at chunk-6.2b (migration 154). DocumentIntakeRail's `idle_with_recent_cards` state machine ports to PendingDocumentsView; existing GET endpoints serve. |

### 2.2 Pass 2 findings (CTO-directed cross-phase sweep)

| # | Finding | Source |
|---|---|---|
| H | Phase 5 closed 2026-05-12 with full AP/Spend services shipped: `billService` (post / approveForPayment / recordPayment / reverse), `vendorService`, `vendorPrepaymentService`, `apReportService` (8 endpoints including new per-bill `billDetail`). | `phase-5-retrospective.md` §1 |
| I | `ProposedMutation`, `ProposedMutationBundle`, `ProposedAttachment` are the three handoff vocabulary objects per ADR-0011 §7. Bundle envelope substrate per ADR-0012. Chat-drop UX must account for bundle rendering (existing ProposedEntryCard handles). | ADR-0011 §7 + ADR-0012 |
| J | Phase 5.1 amendments are still pending and named as carry-forward in Phase 6 retrospective §6. Phase 5.1 ships: INV-DOC-001 enforcement (evidence-completeness), `paymentService` introduction (currently `billService.recordPayment` handles), `vendor_credits` substrate ratification (currently reserved per Phase 2.5 Commit A). | Phase 6 retrospective §6 |
| K | Path A rate-limiting carve-out shipped 2026-05-01 at `apps/web/src/app/api/_helpers/rateLimit.ts`. Not in scope. | Post-MVP brief + file verification |
| L | Phase 1.3 was renamed "Reality Check" / Path C deployment-readiness phase. Not feature work; not in proposal scope. | `phase-1.3/` briefs |
| M | Phase 1.1 audit framework has 21 unified findings open including UF-001 (transaction atomicity), UF-002 (doc-reality divergence), UF-014 (OrgSwitcher Two-Laws exception). Per-chunk acceptance criteria must verify no new audit violations. | `audits/phase-1.1/` |
| N | `service-architecture` skill auto-loads every session for service-layer work. Two Laws + INV-SERVICE-001 wrapping discipline applies to Phase 6.5 chunk 3 (chat-drop). | `.claude/skills/service-architecture/SKILL.md` |
| O | Phase 2.5 amendment-cycle pattern is the closer precedent than F-J-θ cross-phase substrate-modification. Phase 2.5 shipped 2 ADR amendments + retrospective writeup. Phase 6.5 inherits this precedent. | Phase 2 retrospective §1 + `phase-2.5/` briefs |
| P | RI-10 brief amendment cycle threshold is N≥3 framings. Current count: ui_architecture.md supersession + triage_bucket_intake.md supersession + multi-tab Cut 9 + workspace-as-module Cut 5 = N=4. Brief amendment cycle mandatory. | Phase 4 retrospective RI-10 codification |
| Q | Phase 6 retrospective §6 names `a9f1071` as carry-forward. Superseding a9f1071 requires Phase 6 retrospective §6 amendment updating the carry-forward reference. | Phase 6 retrospective §6 |
| R | No multi-tab canvas precedent exists anywhere in the codebase. Greenfield. Adds Sub-Q19 (library choice: Radix UI Tabs / TanStack Router / build from scratch). | Codebase scan |
| S | `internal_sender_allowlist` substrate at migration 155 requires post-deploy operator UPDATE for real emails. Phase 6.5 chunk 3 must not regress forwarded_mailbox testing. | Migration 155 |

### 2.3 Net findings impact

**Δ.4 dissolves to zero net-new code.** Phase 7 wires existing
services (router + classifier + AP/Spend services) in the right
order. No pre-Phase-7 amendment cycle needed for document-type
routing.

**Phase 5.1 amendments inserted in sequencing.** Phase 6
retrospective named Phase 5.1 as carry-forward; the original v1
proposal missed this.

**Phase 6.5 naming replaces "Δ-cycle"** per Phase 2.5 precedent.

**Sub-Q19 (multi-tab library) added** to scope-lock cycle.

**Per-chunk Two Laws verification** added to acceptance criteria.

**Phase 6 retrospective §6 amendment** added to Session 1 outputs.

---

## 3. Locked-at-brainstorming-arc cuts

Nine substrate cuts emerged from the brainstorming arc, locked at
brainstorming-side grain pending scope-lock cycle ratification.

### 3.1 Substrate cuts

**Cut 1 — Substrate written on drop.** Always ingestion substrate
(`ingest_batch` + `source_documents` + `document_cases` +
`document_jobs`). Flow (a) substrate exclusively at v1. No
chat-message-with-attachments substrate at v1. Ingestion writes
`document_type='unknown'`; Phase 7 classifier updates post-
classification (existing pattern per ingestionService.ts).

**Cut 2 — Agent invocation on drop.** Driven by document-type ×
extraction-conviction × user-text-intent. Conviction discipline
inherits unmodified from ADR-0014 §6/§8 + ADR-0019 (forthcoming).
No per-flow split because only one flow at v1.

**Cut 3 — Chat-message representation of drop event.** Provisional
lock: 10.α (no chat-history representation; subtle inline
acknowledgment in chat panel as transient UI element, not a chat
turn).

### 3.2 Shell consolidation cuts

**Cut 4 — Three-zone shell.** Mainframe rail and intake rail both
removed. Consolidated left panel (Zone 1) hosts workspace tabs +
workspace-scoped navigation + persistent foundational footer.
Chat panel (Zone 2) and canvas (Zone 3) unchanged in structure
(except Cut 9 multi-tab).

**Cut 5 — Workspace-as-module framing.** Workspace tabs
correspond to product modules. v1 visible: Billing + Reports. v2
candidates: Tax. Future: Banking, Compliance, Payroll. Each
workspace surfaces module-relevant navigation items. Foundational
items (Chart of Accounts, Journal Entries, Recurring Journals)
live in cross-workspace footer.

**Cut 6 — Don't touch canvas (operational reading).** Existing
canvas view components, CanvasDirective discriminated union, and
canvas-internal behavior unchanged. ContextualCanvas wrapper
shell gains tab management (per Cut 9). Additive changes
permitted; existing flows remain unchanged.

### 3.3 Ergonomic cuts

**Cut 7 — Zone 1 collapsible.** Collapse target = rail-mode
(~48-64px, icons-only). Collapsed state structurally identical
to today's Mainframe rail (architectural continuity). Trigger:
keyboard shortcut + button (both). Persistence: user preference.

**Cut 8 — Zone 2 collapsible.** Collapse target = rail-mode
(~40-48px, with badge for new agent output + expand affordance).
AgentChatPanel `onCollapse` callback already exists in Props.

### 3.4 Multi-tab cut

**Cut 9 — Multi-tab canvas (Path 2: limited at v1).**
ContextualCanvas becomes tab-aware. Each tab holds directive +
back/forward navigation history + selection state. Source-driven
routing (Pattern γ at v1):
- Drop events open new tabs
- Agent canvas_directive opens new tabs
- Mainframe / Zone 1 navigation replaces current tab
- In-canvas drill-down stays in current tab; adds to that tab's
  back-history

v1 limitations (deferred to post-v1 pending usage evidence):
- Session-only persistence (no reload survival)
- No keyboard shortcuts
- No max-tab-count enforcement
- Open / close / switch only (no "close others", "duplicate", etc.)
- canvas_directive contract unchanged at v1 (no `target_tab` field)
- Library choice TBD at scope-lock (Sub-Q19)

Full architecture (Path 1) reserved as named-future-activation
per RI-1, conditional on usage evidence from v1.

---

## 4. Sub-question structure (final)

Thirteen substantive sub-questions for the scope-lock cycle; three
dissolve from a9f1071; four explicitly deferred pending usage
evidence; one deferred to v2.

### 4.1 Carried from a9f1071 (reframed)

| ID | Concern | Round target |
|---|---|---|
| Sub-Q1 | Phase assignment + cycle decomposition (Candidate D Phase 6.5) | Round 1-2 |
| Sub-Q4 | DocumentIntakeRail disposition (locked to 6.4.β remove entirely) | Round 2-3 |
| Sub-Q6 | Naming + governance trail (cross-phase substrate-modification at four-surface grain) | Round 6 |

### 4.2 Dissolved from a9f1071

| ID | Reason |
|---|---|
| Sub-Q2 | Flow-a-vs-Flow-b UI selection mechanism dissolves under Cut 1 (only one flow at v1) |
| Sub-Q3 | chat-message-with-attachments substrate moves to v2 scope (Flow b deferred) |
| Sub-Q5 | per-flow vs unified conviction check dissolves under Cut 1 |

### 4.3 Newly surfaced (Pass 1)

| ID | Concern | Round target |
|---|---|---|
| Sub-Q7 | Zone 1 design (workspace tabs, navigation regions, footer) | Round 3 |
| Sub-Q8 | Collapse/expand behavior (trigger, target, persistence) | Round 4 |
| Sub-Q9 | Staged-attachments behavior (immediate vs staged with ingest button) | Round 4 |
| Sub-Q10 | Chat acknowledgment of drop event (provisional 10.α) | Round 4 |
| Sub-Q11 | Multi-tab canvas (Cut 9 ratification; revised from a9f1071's don't-touch-canvas constraint) | Round 5 |
| Sub-Q12 | Document-type-routing substrate seam — RESOLVED post-verification (zero net code; Phase 7 wires existing services) | n/a |
| Sub-Q18 | Active-tab/chat-intent binding (CTO Condition 6) | Round 5 |

### 4.4 Newly surfaced (Pass 2)

| ID | Concern | Round target |
|---|---|---|
| Sub-Q19 | Multi-tab UI library choice (Radix UI Tabs / TanStack Router / build from scratch) | Round 5 |

### 4.5 Deferred pending usage evidence (explicit)

| ID | Concern | Usage evidence needed |
|---|---|---|
| Sub-Q14 | Tab routing override (Pattern γ vs δ; canvas_directive contract amendment) | Real usage reveals whether agent-emitted directives sometimes need to replace current tab |
| Sub-Q15 | Tab persistence (session-only vs persisted per-user/org) | Real usage reveals whether tab loss across reload is painful enough to justify substrate |
| Sub-Q16 | Tab management UX (keyboard shortcuts, max count, close-others, etc.) | Real usage reveals which management affordances are load-bearing |
| Sub-Q17 | canvas_directive contract amendment (target_tab field) | Coupled with Sub-Q14 |

### 4.6 Deferred to v2

| ID | Concern |
|---|---|
| Sub-Q13 | Multi-session chat substrate (chat_sessions table; per-session conversation_id). Currently single-row `agent_sessions` per (user, org). Multi-session candidate for Phase 1.x amendment cycle or v2 scope. |

### 4.7 Sub-Q19 sub-shapes (multi-tab library)

- **19.α — Build from scratch.** No dependency. ~300-400 lines of tab management.
- **19.β — Radix UI Tabs primitive (via shadcn/ui pattern).** Matches existing component library per agent_interface.md. ~50-100 lines integration.
- **19.γ — TanStack Router tabs.** Heavier dependency; brings routing semantics. ~200-300 lines integration.

Recommendation: **19.β** (Radix UI via shadcn/ui) — lightest, matches conventions.

### 4.8 Sub-Q12 resolution detail

Per Pass 2 findings, the routing substrate already exists across
three locations:

- `documentRouterService.ts` (Phase 4): Subsystems 1+2+3 fully
  shipped
- `document_cases.document_type` column (Phase 2 chunk 1):
  discriminator with 18-value ENUM, mutable for Phase 7
  classifier updates
- Domain services (Phase 5): `billService.post`, `recordPayment`,
  `reverse` consume `ProposedMutation` / `ProposedMutationBundle`
  per ADR-0011 §7

Phase 7's job is to wire these in pipeline order (extract →
classify → route → propose), not to ship new substrate. Sub-Q12
dissolves; no Δ.4 chunk required.

---

## 5. Phase assignment — Phase 6.5 amendment cycle

**Candidate D — Phase 6.5 amendment cycle per Phase 2.5
precedent.** Per Pass 2 Finding O, Phase 2.5's amendment-cycle
shape (closeout-grade amendment cycle attached to Phase 2, ships
2 ADR amendments + retrospective writeup) is the closer precedent
than Phase 4 chunk 2's F-J-θ cross-phase substrate-modification.

Phase 6.5 closeout artifacts live at `docs/09_briefs/phase-6.5/`
(parallel to existing `docs/09_briefs/phase-2.5/`).

### 5.1 Phase 6.5 chunk decomposition

**Phase 6.5 chunk 1 — Substrate + Zone 1 consolidated panel +
workspace switches.**

- Remove `MainframeRail.tsx` (14 navigation icons)
- Remove `DocumentIntakeRail.tsx` from `SplitScreenLayout`
- Restructure Bridge shell from four-zone to three-zone
- Zone 1: consolidated left panel
  - Region 7.1: Workspace tabs (Billing + Reports v1-active;
    Tax + others reserved)
  - Region 7.2: Workspace-scoped navigation items
  - Region 7.3: Persistent foundational footer (Chart of
    Accounts, Journal Entries, Recurring Journals)
  - Region 7.4: Chat history surface — SHIPS NOTHING IN V1 per
    Pass 1 Finding 6 (`agent_sessions` is single-row)
- Zone 1 collapsibility (Cut 7)
- Zone 2 collapsibility (Cut 8) — wire existing `onCollapse`
  callback

Volume: ~800-1100 lines.

**Phase 6.5 chunk 2 — Multi-tab canvas shell (Cut 9 limited).**

- ContextualCanvas gains tab management (Sub-Q19 library lock at
  scope-lock)
- Tab data model: `Array<{tabId, directive, selectedEntity,
  navigationHistory}> + activeTabId`
- canvasContext lift in SplitScreenLayout from singleton to
  array-with-active-pointer
- Tab routing logic (Pattern γ source-driven)
- Session-only persistence
- Open / close / switch UX
- All existing canvas views verified against tab-aware contract
  (no view-component changes)

Volume: **~1000-1300 lines** (Pass 2 Finding R — greenfield, no
prior pattern to inherit).

**Phase 6.5 chunk 3 — Chat-drop + staged attachments +
PendingDocumentsView + DocumentIntakeRail removal.**

- AgentChatPanel drop handler (drag-drop + paste + "+" button per
  brainstorming arc)
- Staged attachments tray above chat input (Sub-Q9 lock)
- POST to existing `/api/orgs/[orgId]/documents/ingest/drag-drop`
  endpoint (no route changes)
- New `PendingDocumentsView.tsx` canvas view — ports
  DocumentIntakeRail's `idle_with_recent_cards` state machine
  (mostly copy)
- New canvas directive `'pending_documents'` in
  `canvasDirective.ts`
- Wire ContextualCanvas to render PendingDocumentsView
- Drop opens new canvas tab with PendingDocumentsView (Cut 9
  source-driven routing)
- "Pending Documents" navigation item in Zone 1 Billing
  workspace with count badge

Volume: ~500-700 lines (Pass 1 Finding 8 — reads existing
`document_cards_view` + ports existing rail state machine).

**Phase 6.5 total: ~2300-3100 lines across 3 chunks.**

### 5.2 No Phase 6.5 chunk 4

Δ.4 (document-type-routing seam) dissolves per Pass 2 Finding H.
Phase 7 wires existing router + classifier + AP/Spend services;
no pre-Phase-7 substrate work needed.

---

## 6. Verify-from-disk targets (Round 1 of scope-lock cycle)

WSL Claude performs verification before Round 2 fires.

### 6.1 Architecture documents

- `docs/03_architecture/phase_plan.md` — phase ownership
- `docs/03_architecture/ui_architecture.md` — four-zone shell
  description; supersession scope
- `docs/03_architecture/system_overview.md` — orient cross-phase
  scope

### 6.2 Product documents (PRD-grade treatment per Pass 1 Finding 5)

- `docs/01_prd/triage_bucket_intake.md` — current intake-rail
  vision; supersession scope

### 6.3 Codebase

- `apps/web/src/components/bridge/SplitScreenLayout.tsx` lines 1-12 — four-zone layout
- `apps/web/src/components/bridge/MainframeRail.tsx` — 14-icon rail
- `apps/web/src/components/bridge/AgentChatPanel.tsx` Props + `onCollapse`
- `apps/web/src/components/bridge/ContextualCanvas.tsx` — single-directive canvas
- `apps/web/src/components/canvas/DocumentIntakeRail.tsx` — removal scope
- `apps/web/src/shared/types/canvasDirective.ts` — directive contract
- `apps/web/src/services/document-platform/documentRouterService.ts` — verify Phase 4 router scope
- `apps/web/src/services/document-platform/ingestionService.ts` — verify drop handling
- `apps/web/src/services/spend/billService.ts` — verify AP/Spend service surface (Pass 2 Finding H)
- `apps/web/src/app/api/_helpers/rateLimit.ts` — verify Path A shipped (Pass 2 Finding K)

### 6.4 ADRs

- ADR-0014 §6 + §8 — conviction semantics
- ADR-0019 (forthcoming) — confidence calibration governance
- ADR-0011 §1 + §3 + §6 + §7 — Document Platform substrate
- ADR-0011 §13 — exception queue resolution-action enum
- ADR-0010 — substrate-now-enforcement-later
- ADR-0012 — ProposedMutationBundle (Pass 2 Finding I)
- ADR-0018 — Relationship Router (verify Phase 4 closure)
- ADR-0022 §2 — supersession workflow

### 6.5 Substrate migrations (Pass 2 cross-phase findings)

- migration 121 — `agent_sessions` (single-row substrate)
- migration 143 — `document_cases` + `document_type` ENUM
- migration 148 — `exception_queue_entries`
- migrations 138-145 — Phase 5 + Phase 2 substrate
- migrations 149-151 — Phase 4 Router substrate
- migration 152 — Phase 6 ingestion substrate
- migration 154 — `document_cards_view` (read substrate for PendingDocumentsView)
- migration 155 — `internal_sender_allowlist` (Pass 2 Finding S)

### 6.6 Governance precedents

- F-J-θ at `docs/09_briefs/phase-4/chunks/2026-05-14-phase-4-chunk-2.md` — cross-phase substrate-modification first-instance
- Phase 2.5 retrospective + commits A/B/C — amendment-cycle precedent (Pass 2 Finding O)
- Phase 5 retrospective §6 — canonical phase sequencing; AP/Spend service surface
- Phase 4 retrospective — RI-1, RI-6, RI-7, RI-10 codifications
- Phase 6 retrospective §6 — Phase 5.1 amendments + a9f1071 named carry-forwards (Pass 2 Findings J + Q)

---

## 7. Sequencing path forward

Eleven-step sequence from current operational state to v1 close.

**Step 1 — Session 1: v2 artifact drafting + supersession (WSL Claude drafts).**

Three artifacts in single commit:
- v2 scope-lock-input artifact at
  `docs/09_briefs/phase-6/2026-05-16-document-drop-and-shell-consolidation-scope-lock-input.md`
  (~700-1100 lines)
- a9f1071 supersession header amendment (~10 lines)
- Phase 6 retrospective §6 amendment updating
  carry-forward reference (~5 lines) per Pass 2 Finding Q

Session count: 1.

**Step 2 — Sessions 2-3: Scope-lock cycle (7-8 rounds).**

Cycle adjudicates against v2 artifact. Adds Round 7 for per-chunk
acceptance criteria + rollback posture + test matrix (CTO
Condition 5). Adds Sub-Q18 (active-tab/chat-intent binding) +
Sub-Q19 (multi-tab library) per CTO Condition 6 + Pass 2.

Session count: 1-2.

**Step 3 — Session 4: PRD-grade amendment cycle.**

`ui_architecture.md` + `triage_bucket_intake.md` amendment per
Pass 1 Finding 5. Three-zone shell + multi-tab supersedes
four-zone description. Optional §S "Shell architecture history"
preserves four-zone description per ADR-0022 supersession
discipline.

Session count: 1.

**Step 4 — Sessions 5-7: Phase 6.5 chunk 1.**

Substrate + Zone 1 consolidated panel + workspace switches. Per
chunk-1-Phase-2 precedent: brief-drafting → scope-lock →
implementation.

Session count: 2-3.

**Step 5 — Sessions 8-10: Phase 6.5 chunk 2.**

Multi-tab canvas shell (Cut 9 limited).

Session count: 2-3.

**Step 6 — Sessions 11-13: Phase 6.5 chunk 3.**

Chat-drop + staged attachments + PendingDocumentsView + intake
rail removal.

Session count: 2-3.

**Step 7 — Sessions 14-15: Phase 5.1 amendments (Pass 2 Finding J).**

INV-DOC-001 enforcement (evidence-completeness invariant; bills
require attached primary document) + paymentService introduction
(currently `billService.recordPayment` handles payments;
dedicated service) + vendor_credits substrate ratification
(currently reserved per Phase 2.5 Commit A).

Session count: 1-2.

**Step 8 — Session 16: Phase 6 retrospective extension** (if RI candidates surface from Phase 6.5).

Optional; fires only if N≥3 framings surface from Phase 6.5
implementation.

Session count: 0-1.

**Step 9 — Sessions 17+: Phase 7 (Extraction).**

Phase 7 brief-drafting fires. Phase 7 ships orchestrator runtime
(`ingestDocument`), classifier (Tier A rule-based + Tier C AI
fallback per ADR-0014 §7), field extractor (per document type),
and writes through existing `documentRouterService` + AP/Spend
services. No router work; no document_type-add work.

Session count: not estimable from here.

**Step 10 — v1 close + structured usage-evidence gathering.**

End-to-end manual walkable demo: user drops vendor invoice on
chat input → ingestion → Phase 7 extraction (high conviction; no
AI) → classifier writes `document_type='vendor_invoice'` →
router produces `ProposedMutationBundle` → routes through
`billService.post` → bills row in draft → AP specialist reviews
in canvas (in a new tab opened by drop) → approves → payment
workflow proceeds.

Structured stress-testing session to surface multi-tab usage
evidence intentionally (audit letter walkthrough simulation,
drill-down + drop scenarios, etc.).

**Step 11 — Post-v1: Phase 1.x amendment cycles informed by
usage evidence.**

Sub-Q14/15/16/17 deferrals graduate to amendment cycles based on
real usage.

**Estimated total to v1 close: ~18-22 sessions** from current
state, with Phase 6.5 taking ~6-9 sessions, Phase 5.1 taking 1-2,
and Phase 7 taking the remainder.

---

## 8. Risks and unknowns

### 8.1 Path C invocation risk (RI-7)

Cross-phase substrate-modification at four-surface grain plus
multi-tab greenfield raises Path C invocation risk. Pass 2
Finding R (no multi-tab precedent) bumps chunk 2 estimate to
1000-1300 lines.

**Mitigation:** Round 1 verify-from-disk surfaces volume drift
early. Sub-Q19 library choice (recommendation: 19.β Radix UI)
keeps chunk 2 at lower bound of estimate.

### 8.2 ADR ratification dependencies

Sub-Q12 dissolves; no ADR-0014 amendment needed. ADR-0019 is
forthcoming; conviction semantics reference placeholder.

**Mitigation:** Round 1 verify-from-disk confirms ADR-0019
status. Cycle proceeds with placeholder if unratified.

### 8.3 Phase 5.1 timing risk (Pass 2 Finding J)

Phase 5.1 inserted between Phase 6.5 close and Phase 7 start.
Phase 5.1 may surface its own scope-lock complexity. If Phase 5.1
takes more than 2 sessions, Phase 7 slips proportionally.

**Mitigation:** Phase 5.1 scope-lock cycle fires standalone after
Phase 6.5 close; doesn't block Phase 6.5 chunks.

### 8.4 v1 multi-tab usage evidence uncertainty

Path 2 ships limited multi-tab on the theory that real usage will
reveal which Sub-Q14/15/16/17 decisions matter. If usage evidence
is insufficient at v1 close (3-user internal audience), post-v1
amendment cycles fire against insufficient evidence.

**Mitigation:** v1 close includes structured stress-testing
session per Step 10.

### 8.5 Brief amendment cycle scope creep

`ui_architecture.md` amendment touches canonical shell
architecture description. Risk: amendment cycle expands scope.

**Mitigation:** Brief amendment cycle scope bounded at Round 6
(Sub-Q6). Two documents touched; others out of scope.

### 8.6 Two Laws regression risk (Pass 2 Finding M)

Phase 1.1 audit framework has open findings including
INV-SERVICE-001 / INV-SERVICE-002 / INV-AUTH-001 compliance.
Phase 6.5 chunks 1 + 3 touch service-layer surfaces; chunk 2
touches React state only (no DB).

**Mitigation:** Per-chunk acceptance criteria include explicit
"no new Two Laws violations" verification. The
`service-architecture` skill auto-loads on chunks touching
services and enforces wrapper discipline.

---

## 9. Decision points requiring CTO sign-off

### 9.1 Required sign-off

**Decision 1: Approve a9f1071 supersession.**
Approve v2 scope-lock-input artifact superseding a9f1071 per
ADR-0022 §2. Phase 6 retrospective §6 carry-forward reference
updates in same Session 1 commit (Pass 2 Finding Q).

**Decision 2: Approve Phase 6.5 amendment-cycle framing.**
Approve closeout-grade amendment cycle per Phase 2.5 precedent
(Pass 2 Finding O). Phase 6.5 closeout artifacts live at
`docs/09_briefs/phase-6.5/`. Three chunks: chunk 1 (shell +
Zone 1), chunk 2 (multi-tab canvas), chunk 3 (chat-drop +
PendingDocumentsView).

**Decision 3: Approve Path 2 multi-tab decision.**
Approve limited multi-tab at v1 with full architecture reserved
post-v1 per RI-1. Sub-Q14/15/16/17 explicitly deferred pending
v1 usage evidence. Sub-Q19 library choice (recommendation: 19.β
Radix UI Tabs via shadcn/ui) ratifies at scope-lock cycle.

**Decision 4: Approve sequencing path with Phase 5.1 insertion.**
Approve eleven-step sequencing per §7. Phase 5.1 amendments
inserted between Phase 6.5 close and Phase 7 start (Pass 2
Finding J). ~18-22 sessions to v1 close.

**Decision 5: Approve per-chunk discipline.**
Per CTO Condition 5: each Phase 6.5 chunk brief includes
acceptance criteria + rollback posture + test matrix. Per Pass 2
Finding M: explicit Two Laws verification in acceptance criteria.

**Decision 6: Approve decision-class split.**
Per CTO Condition 7: governance-critical decisions land at
scope-lock cycle; product-discovery decisions (UX micro-choices,
copy, badges, etc.) land at implementation-brief review.

### 9.2 CTO discretion (no sign-off blocker; flag if concerns)

**Discretionary item 1: Artifact location.**
Recommendation: `docs/09_briefs/phase-6/2026-05-16-document-drop-and-shell-consolidation-scope-lock-input.md`
(same folder as a9f1071 for easy supersession reference; preamble
names cross-phase scope explicitly). Alternative: new
`docs/09_briefs/phase-6.5/` folder at scope-lock-input grain.

**Discretionary item 2: Sub-Q19 library lock timing.**
Recommendation: lock at scope-lock cycle Round 5 alongside
multi-tab Cut 9 ratification. Alternative: defer to Phase 6.5
chunk 2 brief-drafting if scope-lock cycle Round 5 needs more
adjudication territory.

**Discretionary item 3: Usage-evidence gathering at v1 close.**
Recommendation: structured stress-testing session at v1 close
per §7 Step 10. Alternative: organic usage exposure post-v1 with
amendment cycles fired on demand.

### 9.3 CTO veto opportunities

The CTO may veto and require rework on any of the following:

- **Cut 9 multi-tab scope.** If multi-tab is judged out of scope
  entirely for v1 (Path 3), proposal regresses to three-zone
  shell without canvas changes; Sub-Q11 reverts to "don't touch
  canvas at all"; PendingDocumentsView lives in Zone 1.

- **Phase 6.5 framing.** If the CTO judges shell consolidation +
  chat-drop must ship as separate cycles rather than a single
  Phase 6.5 amendment cycle, the work decomposes into two
  independent cycles fired in sequence.

- **Phase 5.1 sequencing position.** If the CTO judges Phase 7
  must fire immediately after Phase 6.5 (deferring Phase 5.1
  to post-Phase-7), the sequencing shifts. Per Phase 6
  retrospective §6, Phase 5.1 is named pre-Phase-7 carry-forward;
  veto requires retrospective amendment.

- **Sub-Q19 library recommendation.** If the CTO has a strong
  preference for 19.α (build from scratch) or 19.γ (TanStack
  Router) over the recommended 19.β (Radix UI), Sub-Q19 scope-
  lock adjudicates with the CTO preference as anchoring vote.

---

## 10. Companion artifacts (post-sign-off)

If CTO signs off, WSL Claude produces the following artifacts in
subsequent sessions:

| Artifact | Location | Session |
|---|---|---|
| v2 scope-lock-input artifact | `docs/09_briefs/phase-6/2026-05-16-...md` | Session 1 |
| a9f1071 supersession header | existing a9f1071 file | Session 1 (same commit) |
| Phase 6 retrospective §6 amendment | `docs/07_governance/retrospectives/phase-6-retrospective.md` | Session 1 (same commit) |
| Scope-lock cycle round records | `.coordination/` or per-round briefs | Sessions 2-3 |
| `ui_architecture.md` amendment | `docs/03_architecture/ui_architecture.md` | Session 4 |
| `triage_bucket_intake.md` supersession | `docs/01_prd/triage_bucket_intake.md` | Session 4 |
| Phase 6.5 chunk 1 brief | `docs/09_briefs/phase-6.5/chunks/` | Session 5 |
| Phase 6.5 chunk 2 brief | (same folder) | Session 8 |
| Phase 6.5 chunk 3 brief | (same folder) | Session 11 |
| Phase 6.5 retrospective | `docs/07_governance/retrospectives/phase-6.5-retrospective.md` | Session 13 (chunk 3 close) |
| Phase 5.1 amendment briefs | `docs/09_briefs/phase-5.1/` (new folder) | Session 14 |
| Phase 7 brief | `docs/09_briefs/phase-7/` | Session 17+ |

---

## 11. References

### 11.1 Conversation transcripts (brainstorming arc source)

- Session 1: "Document intake channel design patterns" (2026-05-15)
- Session 2: "Document intake optimization for AI agent" (2026-05-16)

### 11.2 Predecessor artifacts

- a9f1071: `docs/09_briefs/phase-6/2026-05-15-agent-conversation-document-drop-scope-input.md`
- CTO proposal v1 (this proposal supersedes): `cto-proposal-document-drop-shell-consolidation.md`

### 11.3 Governance precedents

- F-J-θ first-instance cross-phase substrate-modification: `docs/09_briefs/phase-4/chunks/2026-05-14-phase-4-chunk-2.md`
- Phase 2.5 amendment-cycle precedent (Pass 2 Finding O): `docs/09_briefs/phase-2.5/2026-05-13-phase-2-5-commit-a.md` + commit-b.md + Phase 2 retrospective
- Phase 4 retrospective RI-1/RI-6/RI-7/RI-10 codifications: `docs/07_governance/retrospectives/phase-4-retrospective.md`
- Phase 5 retrospective: `docs/07_governance/retrospectives/phase-5-retrospective.md`
- Phase 6 retrospective: `docs/07_governance/retrospectives/phase-6-retrospective.md`
- Phase 6 closeout: `origin/main` at 625c7df (2026-05-15)

### 11.4 Canonical ADRs

- ADR-0010 — substrate-now-enforcement-later
- ADR-0011 §1 + §3 + §6 + §7 — Document Platform substrate
- ADR-0011 §13 — exception queue resolution-action enum
- ADR-0012 — ProposedMutationBundle (Pass 2 Finding I)
- ADR-0014 §6/§8 — conviction semantics + AI fallback contract
- ADR-0018 — Relationship Router (Pass 1 Finding 2)
- ADR-0019 (forthcoming) — confidence calibration
- ADR-0022 §2 — supersession workflow

### 11.5 Code surfaces

- `apps/web/src/components/bridge/SplitScreenLayout.tsx`
- `apps/web/src/components/bridge/MainframeRail.tsx`
- `apps/web/src/components/bridge/AgentChatPanel.tsx`
- `apps/web/src/components/bridge/ContextualCanvas.tsx`
- `apps/web/src/components/canvas/DocumentIntakeRail.tsx`
- `apps/web/src/shared/types/canvasDirective.ts`
- `apps/web/src/services/document-platform/documentRouterService.ts` (Phase 4 router)
- `apps/web/src/services/document-platform/ingestionService.ts` (Phase 6 ingestion)
- `apps/web/src/services/spend/billService.ts` (Phase 5 AP/Spend)

### 11.6 Substrate migrations

- migration 121 — `agent_sessions`
- migrations 138-145 — Phase 5 + Phase 2 substrate
- migration 143 — `document_cases` + `document_type` ENUM
- migration 148 — `exception_queue_entries`
- migrations 149-151 — Phase 4 Router substrate
- migration 152 — Phase 6 ingestion substrate
- migration 154 — `document_cards_view`
- migration 155 — `internal_sender_allowlist`
