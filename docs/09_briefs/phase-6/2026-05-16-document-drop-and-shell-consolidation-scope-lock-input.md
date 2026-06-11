# Document-Drop + Bridge Shell Consolidation — v2 scope-lock-input

**Date**: 2026-05-16
**Status**: Cycle-facing working document; downstream of v3
proposal CTO sign-off (2026-05-16); upstream of fresh scope-
lock cycle (Sessions 2-3 per v3 §7 Step 2)
**Supersedes**: a9f1071 scope-input artifact
(`docs/09_briefs/phase-6/2026-05-15-agent-conversation-
document-drop-scope-input.md`) per ADR-0022 §2 supersession
discipline
**Anchor decision substrate**: v3 proposal at
`docs/09_briefs/phase-6/2026-05-16-cto-proposal-v3-document-
drop-shell-consolidation.md` (commit b7cb081)

---

## 1. Preamble

This artifact is the **cycle-facing working document** for the
fresh scope-lock cycle that fires in Sessions 2-3 per v3 §7
Step 2. It is NOT another CTO-facing proposal. The CTO-facing
proposal is v3 (commit b7cb081); v3's six decisions are locked
per 2026-05-16 CTO sign-off. This artifact restates v3's locked
substance in working-document tone so the scope-lock cycle can
operate against a single cycle-grain document without
re-deriving v3's decisions.

The relationships among the four governance artifacts in this
lineage:

- **v3 proposal** = canonical decision substrate. Six decisions
  signed off; locked cuts and sub-question structure flow
  downstream. The proposal is forward-pointer for forward-
  readers; it does NOT operate as the cycle's working document.
- **This v2 scope-lock-input artifact** = cycle-facing working
  document. Inherits v3's locked cuts and sub-question
  structure; adds verify-from-disk inheritance from Session A
  §A; presents the substantive scope for cycle-side
  adjudication. Sub-question candidate walks, partial-
  information warnings, and per-round target framing in
  working-document tone.
- **a9f1071** = superseded scope-input artifact (commit
  a9f1071). Carries the original Flow (a) / Flow (b) framing
  that v3 reframes per Cut 1 (Flow (b) deferred past v1).
  a9f1071 stays preserved as historical record with
  supersession header at top.
- **Session A preserved-evidence** =
  `docs/09_briefs/phase-6/2026-05-16-session-a-preserved-
  evidence.md` (commit 7834a26). Class A durable substrate-
  state evidence reusable as Round 1 verify-from-disk
  inheritance per §D handoff note. Class B framing-locks
  against dissolved sub-questions preserved as historical
  record.

Scope-lock cycle inputs at session-onset: v3 (substantive
decisions) + this v2 scope-lock-input artifact (cycle working
document) + Session A §A (verify-from-disk evidence already on
disk). Cycle reads all three; Session A §A short-circuits
much of Round 1 verify-from-disk work.

---

## 2. Feature request (reframed)

The feature shipped under three reframes that emerged at the
brainstorming arc (2026-05-15 → 2026-05-16) and are ratified
at v3 §1:

### 2.1 Token-economy reframe

AI agent invocation on document drop is **backend-routing-
driven**, NOT UI-selection-driven. The decision to invoke the
AI agent on a dropped document follows from:

- Document type (vendor_invoice vs receipt vs unknown vs
  T2/NOA/CRA letter at v2+)
- Extraction conviction (per-document-type confidence threshold
  per ADR-0014 §6 + ADR-0019 forthcoming calibration)
- User text intent (user typed alongside drop — the chat
  message accompanying the drop event)

Dissolves the a9f1071 Flow (a) vs Flow (b) UI-selection
framing. No per-drop flow selection UI is needed because the
backend determines whether the agent fires.

### 2.2 Document-type discriminator seam reframe

v1 ships **billing only** — vendor_invoice + receipt +
payment_confirmation + unknown. The document_type column on
`document_cases` is the discriminator seam (Phase 2 chunk 1;
migration 143). v2+ extends the closed enum to T2 / NOA /
CRA-audit-letter / etc. without changing the v1 discriminator
shape. ADR-0011 §6's full 18-value closed enum is the forward-
compatible substrate; v1 CHECK constrains to the 4-value v1-
active set.

### 2.3 Shell-consolidation reframe

The Bridge shell consolidates from **four-zone to three-zone**:

- Mainframe rail (14 navigation icons) and Document Intake
  rail both removed
- Consolidated left panel (Zone 1) hosts workspace tabs +
  workspace-scoped navigation + persistent foundational footer
- Chat panel (Zone 2) unchanged in structure (gains
  collapsibility per Cut 8)
- Canvas (Zone 3) gains limited multi-tab per Cut 9

Workspace tabs correspond to product modules (Claude.ai-
inspired workspace-as-module framing per Cut 5).

### 2.4 Cumulative reframe outcome

The three reframes plus the verify-from-disk findings at v3 §2
collapse the original a9f1071 Δ.4 scope to zero net-new code
for routing substrate (Phase 7 wires existing services per v3
§2.3 + Pass 2 Finding H). The cycle's substantive scope is
shell consolidation + chat-drop entry-point + multi-tab canvas
+ PendingDocumentsView migration. Cross-phase substrate
modification is contained at chunk-grain within Phase 6.5;
phase-cluster grain is not required.

---

## 3. Locked cuts (inherited from v3 §3)

Nine cuts locked at brainstorming-arc grain; cycle ratifies
each at the appropriate round. Voice here is declarative
restatement; this section is inheritance, not adjudication.

### 3.1 Substrate cuts

**Cut 1 — Substrate written on drop.** Always ingestion
substrate (`ingest_batch` + `source_documents` +
`document_cases` + `document_jobs`). Flow (a) substrate
exclusively at v1. No chat-message-with-attachments substrate
at v1. Ingestion writes `document_type='unknown'`; Phase 7
classifier updates post-classification per existing
`ingestionService.ts` pattern.

**Cut 2 — Agent invocation on drop.** Driven by document-type
× extraction-conviction × user-text-intent. Conviction
discipline inherits unmodified from ADR-0014 §6/§8 + ADR-0019
(forthcoming). No per-flow split because only one flow at v1.

**Cut 3 — Chat-message representation of drop event.**
Provisional lock at 10.α — no chat-history representation;
subtle inline acknowledgment in chat panel as transient UI
element, not a chat turn. Cycle Round 4 ratifies 10.α or
adjusts.

### 3.2 Shell consolidation cuts

**Cut 4 — Three-zone shell.** Mainframe rail and intake rail
both removed. Consolidated left panel (Zone 1) hosts workspace
tabs + workspace-scoped navigation + persistent foundational
footer. Chat panel (Zone 2) and canvas (Zone 3) unchanged in
structure (except Cut 9 multi-tab).

**Cut 5 — Workspace-as-module framing.** Workspace tabs
correspond to product modules. v1 visible: Billing + Reports.
v2 candidates: Tax. Future: Banking, Compliance, Payroll. Each
workspace surfaces module-relevant navigation items.
Foundational items (Chart of Accounts, Journal Entries,
Recurring Journals) live in cross-workspace footer.

**Cut 6 — Don't touch canvas (operational reading).** Existing
canvas view components, CanvasDirective discriminated union,
and canvas-internal behavior unchanged. ContextualCanvas
wrapper shell gains tab management (per Cut 9). Additive
changes permitted; existing flows remain unchanged.

### 3.3 Ergonomic cuts

**Cut 7 — Zone 1 collapsible.** Collapse target = rail-mode
(~48-64px, icons-only). Collapsed state structurally identical
to today's Mainframe rail (architectural continuity). Trigger:
keyboard shortcut + button (both). Persistence: user
preference. Cycle Round 4 ratifies sub-shape.

**Cut 8 — Zone 2 collapsible.** Collapse target = rail-mode
(~40-48px, with badge for new agent output + expand
affordance). AgentChatPanel `onCollapse` callback already
exists in Props (Session A §A.6 confirms). Cycle Round 4
ratifies sub-shape.

### 3.4 Multi-tab cut

**Cut 9 — Multi-tab canvas (Path 2: limited at v1).**
ContextualCanvas becomes tab-aware. Each tab holds directive +
back/forward navigation history + selection state. Source-
driven routing (Pattern γ at v1):
- Drop events open new tabs
- Agent canvas_directive opens new tabs
- Mainframe / Zone 1 navigation replaces current tab
- In-canvas drill-down stays in current tab; adds to that
  tab's back-history

v1 limitations (deferred to post-v1 pending usage evidence):
- Session-only persistence (no reload survival)
- No keyboard shortcuts
- No max-tab-count enforcement
- Open / close / switch only (no "close others", "duplicate",
  etc.)
- canvas_directive contract unchanged at v1 (no `target_tab`
  field)
- Library choice TBD at scope-lock (Sub-Q19)

Full architecture (Path 1) reserved as named-future-activation
per RI-1, conditional on usage evidence from v1.

---

## 4. Cross-phase scope acknowledgment

This work is the **Phase 6.5 amendment cycle** per Phase 2.5
precedent (v3 §5 + Pass 2 Finding O). Closeout-grade amendment
cycle attached to Phase 6; ships ADR amendments + retrospective
writeup at cycle close per Phase 2.5 shape. Closeout artifacts
live at `docs/09_briefs/phase-6.5/` (parallel to existing
`docs/09_briefs/phase-2.5/`).

### 4.1 Chunk decomposition

Three chunks per v3 §5.1:

- **Phase 6.5 chunk 1** — Bridge shell consolidation + Zone 1
  consolidated panel + workspace switches. Volume ~800-1100
  lines. Removes `MainframeRail.tsx`; detaches
  `DocumentIntakeRail.tsx` from `SplitScreenLayout` (component
  deleted at chunk 3 after PendingDocumentsView state-machine
  port confirms green); restructures Bridge shell from four-
  zone to three-zone; ships Zone 1 four-region layout (7.1
  workspace tabs / 7.2 workspace-scoped navigation / 7.3
  persistent foundational footer / 7.4 chat history surface
  SHIPS NOTHING IN V1 per Pass 1 Finding 6); wires Zone 1 +
  Zone 2 collapsibility.
- **Phase 6.5 chunk 2** — Multi-tab canvas shell (Cut 9
  limited). Volume ~1000-1300 lines (greenfield per Pass 2
  Finding R). ContextualCanvas gains tab management;
  canvasContext lift from singleton to array-with-active-
  pointer; Pattern γ source-driven routing; session-only
  persistence; open/close/switch UX; verify all existing
  canvas views against tab-aware contract.
- **Phase 6.5 chunk 3** — Chat-drop + staged attachments +
  PendingDocumentsView + DocumentIntakeRail deletion. Volume
  ~500-700 lines (Pass 1 Finding 8 — reads existing
  `document_cards_view` + ports existing rail state machine).
  AgentChatPanel drop handler + staged attachments tray +
  POST to existing `/api/orgs/[orgId]/documents/ingest/drag-
  drop` endpoint; ports DocumentIntakeRail's
  `idle_with_recent_cards` state machine to new
  `PendingDocumentsView.tsx` canvas view; new canvas directive
  `'pending_documents'`; wires drop to open new canvas tab;
  deletes DocumentIntakeRail.tsx after port confirms green.

**Phase 6.5 total: ~2300-3100 lines across 3 chunks.**

### 4.2 No Phase 6.5 chunk 4

Δ.4 (document-type-routing seam) dissolves per v3 §5.2 + Pass
2 Finding H. Phase 7 wires existing router (Phase 4 chunks 1-3
— `documentRouterService.ts`) + classifier + AP/Spend services
(`billService` per Phase 5); no pre-Phase-7 substrate work
needed.

---

## 5. Codification inheritance

This cycle inherits discipline from prior phases and Session A.
Inheritances fire reflexively at each round per codify-while-
deciding-at-decision-time.

### 5.1 ADR inheritances

- **ADR-0010** — substrate-now-enforcement-later. Reserved-
  substrate / consumer-chunk-activation discipline applies at
  any substrate addition under Phase 6.5. Multi-tab v1
  limitations (Sub-Q14/15/16/17 deferrals) are ADR-0010-shape.
- **ADR-0022 §2** — supersession workflow. This v2 artifact's
  predecessor (a9f1071) is superseded per §2 discipline; the
  v3 proposal supersedes the v2 CTO proposal per §2
  discipline at proposal-document grain.

### 5.2 Phase 4 retrospective codifications (RI series)

- **RI-1** — consumer-presence verification before substrate
  addition. Every substrate addition in Phase 6.5 needs named
  v1 consumer. Sub-Q14/15/16/17 deferrals named with
  activation-trigger conditions; Sub-Q19 library choice at
  scope-lock provides a named v1 consumer for tab management
  substrate.
- **RI-6 four-grain** — read-substrate verification at scope-
  lock (substrate-shape; per-trigger semantic coverage; per-
  trigger × per-decision-outcome conformance; idempotency-and-
  side-effect-contract conformance). Plus the **Phase 6 chunk-
  6.1 fifth-grain candidate** (existing-consumer-contract
  conformance; F-J observation-grain). Applies at scope-lock
  for each chunk; chunk 2 (multi-tab canvas shell) carries the
  highest substrate-grain density and is the load-bearing RI-6
  test.
- **RI-7** — session-budget-feasibility verification at each
  round transition + Path C invocation conditions. Cycle
  re-evaluates session budget at round transitions; Path C
  invocation surfaces if cycle exceeds ~10 rounds OR a chunk's
  volume forecast exceeds upper-bound calibration.
- **RI-10** — brief amendment cycle threshold N≥3 framings.
  Current count **N=4** per v3 Pass 2 Finding P
  (ui_architecture.md supersession + triage_bucket_intake.md
  supersession + multi-tab Cut 9 + workspace-as-module Cut 5).
  Brief amendment cycle is **mandatory** at Step 3 (Session 4
  per v3 §7).

### 5.3 Phase 2.5 amendment-cycle precedent

Closeout-grade amendment cycle attached to a phase; ships ADR
amendments + retrospective writeup at cycle close. Phase 6.5
inherits this shape per v3 §5 + Pass 2 Finding O. Phase 6.5
closeout artifacts live at `docs/09_briefs/phase-6.5/`.

### 5.4 Phase 4 retrospective T3 > T4 > T1 surface-precedence

ADRs (T3) > CLAUDE.md (T4) > retrospectives (T1). When
codification destinations are ambiguous, ADR is the canonical
surface for architectural decisions; CLAUDE.md is the
canonical surface for session-execution conventions;
retrospectives are the canonical surface for phase-grain
narratives. Phase 6.5 chunk briefs follow this precedence at
codification-destination decisions.

### 5.5 Session A meta-process inheritances (DURABLE per §B)

Three meta-process inheritances from Session A's preserved-
evidence (commit 7834a26):

- **Positive-shape sibling pattern N=1 observation** (Session
  A §B.4): "designed-partial-information-handoff with verify-
  substrate-enumeration" — structurally inverse to candidate
  (c) partial-information-recommendation-drift. This v2
  artifact applies the pattern: every section that operates
  on partial-information explicitly flags it AND names verify-
  from-disk substrate.
- **(A1) post-close-extension discipline + single-canonical-
  close-marker-per-phase** (Session A §B.5): Phase 6 stays
  closed at 625c7df + ed9820f; Phase 6.5 chunks ship as post-
  close-extension under closed-phase umbrella. No phase
  reopen.
- **Lock 1 scope-lock-cycle closure shape** (Session A §B.7):
  cycle closes at scope-lock-cycle-close marker + chunk-brief
  drafting carry-forward(s). Multi-chunk decomposition →
  multi-brief; each chunk fires its own downstream drafting →
  implementation → ceremony session sequence.

### 5.6 Codify-while-deciding meta-discipline

Applies at decision-time within each round. Codification
candidates surfaced mid-cycle land at retrospective scoping;
candidates that fire at decision-time grain land at decision-
time. Don't defer to drafting-time or implementation-time.

---

## 6. Sub-questions

Per v3 §4. Thirteen substantive sub-questions plus four
explicitly deferred plus one v2-deferred. Each sub-question
gets a section with sub-question statement, sub-shapes,
round target, verify-from-disk inheritance, and partial-
information warnings.

### 6.1 Sub-Q1 — Phase assignment + cycle decomposition

**Statement**: ratify Candidate D (Phase 6.5 amendment cycle
per Phase 2.5 precedent) as locked at v3 §5; ratify 3-chunk
decomposition per v3 §5.1.

**Sub-shapes**: Candidate D locks per v3; cycle ratifies. Sub-
shape question is "do we accept the 3-chunk decomposition
as-is, or surface a 4-chunk or 2-chunk variant?"

**Round target**: Round 1-2.

**Verify-from-disk inheritance**: Session A §A.5 (F-J-θ
precedent shape — chunk-grain × 2 substrate elements); Session
A §A.3 (phase_plan.md staleness — not load-bearing for
chunk-grain decisions).

**Partial-information warning**: none expected; v3's
ratification covers this question. Cycle Round 1-2 is largely
acceptance + chunk-decomposition surface re-confirmation.

### 6.2 Sub-Q4 — DocumentIntakeRail disposition

**Statement**: ratify 6.4.β (remove entirely) as locked at v3
§5.1; ratify two-step removal sequence (chunk 1 detaches mount;
chunk 3 deletes component after PendingDocumentsView state-
machine port).

**Sub-shapes**: 6.4.α (display-only) was rejected at v3 grain;
6.4.β (remove entirely) is locked. Sub-shape question is "does
the two-step sequence operate cleanly across chunks 1 and 3,
or does it create cross-chunk dependency that needs
adjudication?"

**Round target**: Round 2-3.

**Verify-from-disk inheritance**: Session A §A.10
(DocumentIntakeRail current state — 311 lines;
`idle_with_recent_cards` / `showing_batch` state machine; Phase
6 chunk-6.3a territory).

**Partial-information warning**: PendingDocumentsView's exact
state-machine port shape is partial-information until chunk 3
brief drafting. Cycle Round 2-3 ratifies the disposition; chunk
3 brief operationalizes.

### 6.3 Sub-Q6 — Naming + governance trail

**Statement**: ratify Phase 6.5 naming + governance trail
shape; cross-phase substrate-modification at four-surface grain
(Bridge shell + canvas + chat input + DocumentIntakeRail).

**Sub-shapes**:
- 6.6.α — single Phase 6.5 cycle (locked at v3); cross-phase
  modification documented in chunk briefs per chunk-2-Phase-4
  F-J-θ precedent (Session A §A.5).
- 6.6.β — alternative naming convention (rejected at v3 §5;
  preserved here for cycle visibility).

**Round target**: Round 6.

**Verify-from-disk inheritance**: Session A §A.5 (F-J-θ
precedent shape) + §A.4 (retrospectives directory inventory —
no Phase 3 / Phase 1.3 retrospective; pattern of phase-grain
retrospective writeup).

**Partial-information warning**: Phase 6.5 retrospective
writeup shape carries forward to cycle close; not pre-
specified at this scope-lock-input grain.

### 6.4 Dissolved from a9f1071

**Sub-Q2 — Flow-a-vs-Flow-b UI selection mechanism**:
DISSOLVED per v3 Cut 1 (only one flow at v1). a9f1071's five
sub-shapes (6.2.α/β/γ/δ/ε) and Session A's three-way shortlist
(6.2.α / γ / ε) preserved as historical record at Session A
§B.1. No cycle adjudication needed.

**Sub-Q3 — chat-message-with-attachments substrate**:
DISSOLVED per v3 Cut 1 (Flow b deferred past v1).
**Strengthened by Session A §A.7 finding**: no `chat_messages`
table exists on disk; actual chat substrate is
`agent_sessions.turns` JSONB column (migration 121).
a9f1071's three sub-shapes (6.3.α/β/γ) and Session A's
re-enumerated three sub-shapes (6.3.α' / β' / γ') preserved as
historical record at Session A §B.2. No cycle adjudication
needed.

**Sub-Q5 — per-flow vs unified conviction check**: DISSOLVED
per v3 Cut 1 (only one flow at v1; no per-flow split).
a9f1071's two sub-shapes (6.5.α / β) preserved as historical
record at Session A §B.3. No cycle adjudication needed.

### 6.5 Sub-Q7 — Zone 1 design

**Statement**: adjudicate Zone 1 four-region layout (7.1
workspace tabs + 7.2 workspace-scoped navigation + 7.3
persistent foundational footer + 7.4 chat-history surface) per
v3 §5.1 chunk 1.

**Sub-shapes**: per v3 §5.1:
- Region 7.1 — workspace tabs (Billing + Reports v1-active;
  Tax + others reserved). Tab UI shape: horizontal tabs vs
  vertical tabs vs dropdown selector.
- Region 7.2 — workspace-scoped navigation items. Items per
  workspace listed at chunk 1 brief grain.
- Region 7.3 — persistent foundational footer (Chart of
  Accounts, Journal Entries, Recurring Journals). Footer
  shape: always-visible bottom bar vs collapsible drawer.
- Region 7.4 — chat history surface. **SHIPS NOTHING IN V1**
  per v3 Pass 1 Finding 6 (`agent_sessions` is single-row
  per (user, org); chat history would list one item).
  Sub-Q13 multi-session substrate is genuine deferral to v2.

**Round target**: Round 3.

**Verify-from-disk inheritance**: Session A §A.6 (AGENT panel
substrate ownership inventory; `SplitScreenLayout.tsx` at 145
lines).

**Partial-information warning**: workspace-scoped navigation
items per Billing + Reports workspaces — partial-information
until chunk 1 brief drafting. Cycle Round 3 ratifies region
layout; chunk 1 brief operationalizes per-region items.

### 6.6 Sub-Q8 — Collapse/expand behavior

**Statement**: adjudicate trigger + target + persistence for
Zone 1 + Zone 2 collapsibility per Cuts 7 + 8.

**Sub-shapes**:
- 8.α — keyboard shortcut only (no button)
- 8.β — button only (no keyboard shortcut)
- 8.γ — both keyboard + button (v3 Cut 7 lock — preserved
  here for cycle visibility)
- Persistence sub-shapes: 8.persist.α (session-only) vs
  8.persist.β (user preference persisted; v3 Cut 7 lock).

**Round target**: Round 4.

**Verify-from-disk inheritance**: Session A §A.6 — AGENT panel
`onCollapse` callback already exists in Props (Cut 8 wiring).

**Partial-information warning**: keyboard shortcut binding
(e.g., Cmd+1 / Cmd+2) — partial-information until chunk 1
brief drafting. Cycle Round 4 ratifies trigger shape; chunk 1
brief operationalizes specific binding.

### 6.7 Sub-Q9 — Staged-attachments behavior

**Statement**: adjudicate immediate-ingest vs staged-with-
ingest-button shape for drop event on AgentChatPanel.

**Sub-shapes**:
- 9.α — immediate ingest on drop (no staging; current Phase 6
  chunk-6.3a UX).
- 9.β — staged attachments tray above chat input; explicit
  "Ingest" button to commit (v3 chunk 3 lock — preserved here
  for cycle visibility).
- 9.γ — hybrid: single file = immediate; multi-file = staged.

**Round target**: Round 4.

**Verify-from-disk inheritance**: none beyond v3 chunk 3
volume estimate (~500-700 lines).

**Partial-information warning**: staged tray UX details
(remove buttons; reorder; preview) — partial-information until
chunk 3 brief drafting.

### 6.8 Sub-Q10 — Chat acknowledgment of drop event

**Statement**: adjudicate provisional 10.α lock (no chat-
history representation; subtle inline acknowledgment as
transient UI element, not a chat turn) per v3 Cut 3.

**Sub-shapes**:
- 10.α — transient inline acknowledgment; not a chat turn (v3
  Cut 3 provisional lock).
- 10.β — explicit chat turn (rejected at v3 Cut 3; preserved
  for cycle visibility).
- 10.γ — chat-history representation only (no transient UI;
  user sees drop event in scrollback).

**Round target**: Round 4.

**Verify-from-disk inheritance**: Session A §A.7-A.8 (chat
substrate shape — `agent_sessions.turns` JSONB; ChatTurn
discriminated union with `role: 'user'` and `role:
'assistant'`).

**Partial-information warning**: transient UI element exact
visual treatment — partial-information until chunk 3 brief
drafting.

### 6.9 Sub-Q11 — Multi-tab canvas (Cut 9 ratification)

**Statement**: ratify Cut 9 (Path 2 limited multi-tab) at
scope-lock cycle.

**Sub-shapes**: Cut 9 locks per v3 §3.4. Cycle ratifies. Sub-
shape questions: source-driven routing pattern (Pattern γ at
v1 — locked); v1 limitations preserved as named-future-
activation per RI-1; Path 1 (full architecture) reserved.

**Round target**: Round 5.

**Verify-from-disk inheritance**: Session A §A.6
(`ContextualCanvas.tsx` ownership — Phase 6 chunk-6.2b
territory per `document_cards_view` integration).

**Partial-information warning**: tab visual treatment +
keyboard-state interaction at session-only persistence —
partial-information until chunk 2 brief drafting.

### 6.10 Sub-Q12 — Document-type-routing substrate seam

**Statement**: ratify dissolution of Δ.4 per v3 §4.8 (Sub-Q12
resolves post-verification; zero net code; Phase 7 wires
existing services).

**Sub-shapes**: dissolved per v3. Cycle ratifies dissolution.

**Round target**: n/a (cycle ratifies dissolution; no chunk
work required).

**Verify-from-disk inheritance**: v3 Pass 1 Finding 2 (Phase
4 chunks 1-3 routing substrate at migrations 149/150/151;
service surface confirmed) + v3 Pass 2 Finding H (Phase 5
AP/Spend services confirmed).

### 6.11 Sub-Q18 — Active-tab/chat-intent binding

**Statement**: adjudicate how the active canvas tab informs
the chat panel's intent context (CTO Condition 6).

**Sub-shapes**:
- 18.α — active tab's directive injects into agent's canvas
  context (existing pattern at canvas-internal grain).
- 18.β — active tab's directive does NOT inject; chat panel
  operates context-free at multi-tab grain.
- 18.γ — explicit binding UI (user toggles "follow active
  tab" vs "context-free").

**Round target**: Round 5.

**Verify-from-disk inheritance**: existing canvas-context-
injection pattern at AgentChatPanel; ADR-0011 §7
ProposedMutationBundle envelope.

**Partial-information warning**: chat panel's active-tab
awareness shape — partial-information until chunk 2 brief
drafting. Cycle Round 5 ratifies binding shape; chunk 2
operationalizes.

### 6.12 Sub-Q19 — Multi-tab UI library choice

**Statement**: adjudicate library choice for multi-tab canvas
shell.

**Sub-shapes** (per v3 §4.7):
- 19.α — Build from scratch. No dependency. ~300-400 lines of
  tab management code.
- 19.β — Radix UI Tabs primitive (via shadcn/ui pattern).
  Matches existing component library per
  `agent_interface.md`. ~50-100 lines integration.
  **Recommendation** per v3 §4.7.
- 19.γ — TanStack Router tabs. Heavier dependency; brings
  routing semantics. ~200-300 lines integration.

**Round target**: Round 5 (alongside Sub-Q11).

**Verify-from-disk inheritance**: existing shadcn/ui usage
pattern (verify at Round 5 — exact component library
inventory).

**Partial-information warning**: TanStack Router footprint and
routing-semantics interaction with existing Next.js App Router
substrate — partial-information until Round 5 verify-from-disk
on existing routing surface.

### 6.13 Deferred pending usage evidence (per RI-1 named-future-activation)

Sub-Q14/15/16/17 deferred pending v1 usage evidence. Each
carries a named activation trigger at v3 §4.5:

- **Sub-Q14** — Tab routing override (Pattern γ vs δ). Activation:
  real usage reveals whether agent-emitted directives sometimes
  need to replace current tab.
- **Sub-Q15** — Tab persistence (session-only vs persisted per-
  user/org). Activation: real usage reveals whether tab loss
  across reload is painful enough to justify substrate.
- **Sub-Q16** — Tab management UX (keyboard shortcuts, max count,
  close-others, etc.). Activation: real usage reveals which
  management affordances are load-bearing.
- **Sub-Q17** — `canvas_directive` contract amendment
  (`target_tab` field). Activation: coupled with Sub-Q14.

These do NOT fire at this cycle. Post-v1 amendment cycles
adjudicate when usage evidence accumulates per v3 §7 Step 11.

### 6.14 Deferred to v2 (full feature substrate)

**Sub-Q13** — Multi-session chat substrate (chat_sessions
table; per-session conversation_id). Currently single-row
`agent_sessions` per (user, org). Multi-session candidate for
Phase 1.x amendment cycle or v2 scope. Activation: v2 scope-
lock cycle.

---

## 7. Verify-from-disk targets (Round 1 of scope-lock cycle)

Per v3 §6, with Session A §A inheritance noted explicitly.
**Session A §A evidence is reusable as Round 1 verify-from-
disk inheritance.** Cycle Round 1 re-fires verify-from-disk
only for substrate state Session A did NOT already confirm.

### 7.1 Architecture documents

Per v3 §6.1:

- `docs/03_architecture/phase_plan.md` — phase ownership
  (NOTE per Session A §A.3: this doc is a Phase-1.1-closeout-
  grain historical snapshot enumerating Phase 1.1 / 1.2 / 1.3
  / "Phase 2 and beyond" only; cannot ratify or refute chunk-
  sequencing on chunk-numbering grounds. Useful for shell-
  architecture ownership confirmation only, not phase-
  sequencing authority)
- `docs/03_architecture/ui_architecture.md` — four-zone shell
  description; supersession scope. **PRD-grade amendment fires
  at Step 3 (Session 4 per v3 §7).**
- `docs/03_architecture/system_overview.md` — orient cross-
  phase scope.

### 7.2 Product documents (PRD-grade treatment per Pass 1 Finding 5)

- `docs/01_prd/triage_bucket_intake.md` — current intake-rail
  vision; supersession scope. **PRD-grade amendment fires at
  Step 3 (Session 4).**

### 7.3 Codebase

Per v3 §6.3:

- `apps/web/src/components/bridge/SplitScreenLayout.tsx` lines
  1-12 — four-zone layout (Session A §A.6: 145 lines)
- `apps/web/src/components/bridge/MainframeRail.tsx` — 14-icon
  rail (chunk 1 removal target)
- `apps/web/src/components/bridge/AgentChatPanel.tsx` Props +
  `onCollapse` (Session A §A.6: 788 lines)
- `apps/web/src/components/bridge/ContextualCanvas.tsx` —
  single-directive canvas (chunk 2 tab management target)
- `apps/web/src/components/canvas/DocumentIntakeRail.tsx` —
  removal scope (Session A §A.10: 311 lines;
  `idle_with_recent_cards` state machine + Recent vs Last drop
  section headers)
- `apps/web/src/shared/types/canvasDirective.ts` — directive
  contract
- `apps/web/src/services/document-platform/documentRouterService.ts`
  — verify Phase 4 router scope (v3 Pass 1 Finding 2 confirms
  shipped)
- `apps/web/src/services/document-platform/ingestionService.ts`
  — verify drop handling
- `apps/web/src/services/spend/billService.ts` — verify AP/
  Spend service surface (v3 Pass 2 Finding H confirms shipped)
- `apps/web/src/app/api/_helpers/rateLimit.ts` — verify Path A
  shipped (v3 Pass 2 Finding K confirms shipped)

### 7.4 ADRs

Per v3 §6.4:

- **ADR-0014 §6 + §8** — conviction semantics + AI fallback
  contract
- **ADR-0019 (forthcoming)** — confidence calibration
  governance
- **ADR-0011 §1 + §3 + §6 + §7** — Document Platform substrate
- **ADR-0011 §13** — exception queue resolution-action enum
- **ADR-0010** — substrate-now-enforcement-later
- **ADR-0012** — ProposedMutationBundle (v3 Pass 2 Finding I)
- **ADR-0018** — Relationship Router (verify Phase 4 closure)
- **ADR-0022 §2** — supersession workflow

### 7.5 Substrate migrations

Per v3 §6.5, with Session A §A.7 + §A.11 inheritance:

- **migration 121** — `agent_sessions` (single-row substrate)
  (Session A §A.7 confirms shape — `conversation` JSONB for
  Claude + `turns` JSONB for UI)
- **migration 143** — `document_cases` + `document_type` ENUM
- **migration 148** — `exception_queue_entries`
- **migrations 138-145** — Phase 5 + Phase 2 substrate (Session
  A §A.11: Phase 1.2-era migration neighborhood inventory at
  118-121 reusable)
- **migrations 149-151** — Phase 4 Router substrate
- **migration 152** — Phase 6 ingestion substrate
- **migration 154** — `document_cards_view` (read substrate for
  PendingDocumentsView)
- **migration 155** — `internal_sender_allowlist` (v3 Pass 2
  Finding S)

### 7.6 Governance precedents

Per v3 §6.6, with Session A §A.5 inheritance:

- **F-J-θ at chunk-2-Phase-4 brief** — cross-phase substrate-
  modification first-instance (Session A §A.5: chunk-grain × 2
  substrate elements; precedent applies at chunk-grain in
  Phase 6.5 chunks)
- **Phase 2.5 retrospective + commits A/B/C** — amendment-
  cycle precedent (v3 Pass 2 Finding O)
- **Phase 5 retrospective §6** — canonical phase sequencing;
  AP/Spend service surface
- **Phase 4 retrospective** — RI-1 / RI-6 / RI-7 / RI-10
  codifications
- **Phase 6 retrospective §6** — Phase 5.1 amendments + a9f1071
  named carry-forwards (v3 Pass 2 Findings J + Q); **amended
  in this commit** to update a9f1071 carry-forward reference
  to the v2 scope-lock-input artifact + acknowledge SharePoint
  amendment at 01a0fa6

### 7.7 Session A §A reuse summary

Session A §A's eleven evidence subsections short-circuit a
substantial portion of Round 1 verify-from-disk. Reusable
inheritance:

- §A.1 — git state baseline at session-onset
- §A.2 — validation gates baseline (1114/1114 vitest; 26/26
  agent:validate; typecheck green)
- §A.3 — phase_plan.md staleness observation
- §A.4 — retrospectives directory inventory
- §A.5 — F-J-θ precedent shape (chunk-grain × 2 substrate
  elements)
- §A.6 — AGENT panel substrate ownership = Phase 1.2 origin
- §A.7 — chat-message substrate shape = JSONB-on-
  agent_sessions
- §A.8 — ChatTurn canonical type shape
- §A.9 — chat-message substrate consumer inventory
- §A.10 — DocumentIntakeRail current state
- §A.11 — migration neighborhood inventory (Phase 1.2 era)

Round 1 verify-from-disk should re-fire only against substrate
NOT in Session A §A scope. Cycle re-runs validation gates at
Round 0 to confirm baseline still holds (1 commit ahead of
main since Session A close; b7cb081 + the commit for this
artifact + the next-commit follow-on for SHA).

---

## 8. Per-chunk acceptance criteria surface (CTO Condition 5)

Three chunks per v3 §5.1. For each, the cycle adjudicates the
**surface** of acceptance criteria + rollback posture + test
matrix + Two Laws verification. Per-chunk briefs (Sessions
5/8/11 per v3 §7 Steps 4-6) operationalize the criteria
content.

This section is the cycle's input to per-chunk brief drafting;
the criteria themselves are partial-information until brief
drafting fires.

### 8.1 Phase 6.5 chunk 1 — Bridge shell consolidation + Zone 1 + workspace switches

**Acceptance criteria surface**:
- Three-zone shell layout renders correctly across viewport
  sizes (acceptance UI matrix per chunk 1 brief)
- Zone 1 four-region layout (7.1 / 7.2 / 7.3 / 7.4) per spec
- Zone 1 collapse to rail-mode (~48-64px) preserves icons-only
  visibility per Cut 7
- Zone 2 collapse to rail-mode (~40-48px) preserves badge +
  expand affordance per Cut 8
- User preference for collapse state persists across sessions
  per Cut 7 / Cut 8 persistence sub-shape
- Workspace tab switch updates Zone 1 navigation region (7.2)
  per workspace-as-module per Cut 5
- Foundational footer (7.3) renders Chart of Accounts +
  Journal Entries + Recurring Journals as workspace-
  independent
- `MainframeRail.tsx` removed from `SplitScreenLayout`
- `DocumentIntakeRail.tsx` detached from `SplitScreenLayout`
  (component remains on disk; chunk 3 deletion target)

**Rollback posture**: revertible at chunk close per chunk-1-
Phase-2 precedent. Three-zone shell reverts to four-zone via
SplitScreenLayout commit revert. Workspace state ephemeral at
v1 (no substrate to clean up).

**Test matrix scope**:
- Unit tests: Zone 1 region renders; workspace switch updates
  navigation
- Integration tests: collapse / expand behavior; user
  preference persistence; viewport responsiveness
- Visual regression: per Phase 6 chunk-6.3a screenshot gate
  discipline (UI-changes-require-screenshot-gate per
  CLAUDE.md)
- E2E: workspace switch + navigation click + collapse + expand
  golden path

**Two Laws verification** (per v3 Pass 2 Finding M):
- INV-SERVICE-001: any service-layer touch wrapped in
  `withInvariants` (likely zero touches in chunk 1; UI-only)
- INV-SERVICE-002: trace_id propagation (likely zero touches
  in chunk 1)
- INV-AUTH-001: RLS isolation (no DB writes in chunk 1; N/A)

### 8.2 Phase 6.5 chunk 2 — Multi-tab canvas shell

**Acceptance criteria surface**:
- ContextualCanvas accepts tab-aware contract; existing canvas
  views render unchanged within tabs (Cut 6 don't-touch-canvas)
- canvasContext lift from singleton to array-with-active-
  pointer; existing consumers updated
- Pattern γ source-driven routing: drop opens new tab; agent
  `canvas_directive` opens new tab; Zone 1 navigation replaces
  current tab; in-canvas drill-down stays in current tab
- Session-only persistence (tabs do NOT survive reload per
  Sub-Q15 deferral)
- Open / close / switch UX renders correctly
- All existing canvas view components verified against tab-
  aware contract (no view-component changes per Cut 6)
- Sub-Q19 library lock (likely 19.β Radix UI Tabs via
  shadcn/ui per v3 §4.7 recommendation)

**Rollback posture**: revertible at chunk close. Multi-tab
state ephemeral at v1 (no persistence substrate); tab UI
revert collapses to single-tab canvas via ContextualCanvas
revert.

**Test matrix scope**:
- Unit tests: tab data model (array + activeTabId); per-tab
  directive + selection state; navigation history per tab
- Integration tests: Pattern γ routing across all four
  trigger types (drop / agent directive / Zone 1 nav / drill-
  down); tab open/close/switch
- Visual regression: per screenshot gate discipline
- E2E: multi-file drop → multi-tab open; agent canvas
  directive → new tab; back/forward navigation within tab

**Two Laws verification**:
- chunk 2 touches React state only; no DB writes; INV-AUTH-001
  N/A
- INV-SERVICE-001 / INV-SERVICE-002 N/A (no service-layer
  touches)

**RI-6 load-bearing surface**: chunk 2 carries the highest
substrate-grain density. Four-grain verification at scope-lock
(substrate-shape; per-trigger semantic coverage; per-trigger ×
per-decision-outcome conformance; idempotency-and-side-effect-
contract conformance). Plus the fifth-grain candidate
(existing-consumer-contract conformance — every existing
canvas view's tab-aware contract conformance).

### 8.3 Phase 6.5 chunk 3 — Chat-drop + staged attachments + PendingDocumentsView + DocumentIntakeRail deletion

**Acceptance criteria surface**:
- AgentChatPanel drop handler accepts drag-drop + paste + "+"
  button inputs
- Staged attachments tray renders above chat input (Sub-Q9
  lock; likely 9.β staged-with-ingest-button per chunk 3
  brief)
- POST to existing `/api/orgs/[orgId]/documents/ingest/drag-
  drop` endpoint (no route changes; Session A §A.6 confirms
  the route exists per Phase 6 chunk-6.2b territory)
- `PendingDocumentsView.tsx` canvas view renders
  `idle_with_recent_cards` state machine (state-machine port
  from DocumentIntakeRail; mostly copy per v3 §5.1 chunk 3)
- New canvas directive `'pending_documents'` registered in
  `canvasDirective.ts`
- ContextualCanvas renders PendingDocumentsView on
  `'pending_documents'` directive
- Drop opens new canvas tab with PendingDocumentsView per Cut
  9 source-driven routing
- "Pending Documents" navigation item in Zone 1 Billing
  workspace with count badge
- Transient inline acknowledgment in chat panel on drop event
  per Sub-Q10 (10.α provisional)
- DocumentIntakeRail.tsx component deleted after
  PendingDocumentsView state-machine port confirms green

**Rollback posture**: revertible at chunk close. Drop handler
revert restores existing chunk-6.3a UX (drop into intake rail);
PendingDocumentsView removal restores DocumentIntakeRail
canvas surface; deletion is the irreversible step (chunk 3
final task — confirms green before delete).

**Test matrix scope**:
- Unit tests: drop handler accepts file types; staged tray
  state; transient acknowledgment rendering
- Integration tests: end-to-end drop → ingest → cards render
  (golden path); existing ingestion path regression
- Visual regression: per screenshot gate discipline
- E2E: drop multiple files → staged tray → ingest button →
  ingestion fires → PendingDocumentsView renders cards

**Two Laws verification**:
- INV-SERVICE-001: drop handler invokes existing
  ingestionService; `withInvariants` wrapping inherited from
  existing service surface
- INV-SERVICE-002: trace_id propagation from drop event to
  ingestionService call
- INV-AUTH-001: RLS isolation — drop handler operates on
  authenticated user session; ingestion writes scoped to
  user's active org

---

## 9. Risks and unknowns (inherited from v3 §8)

Six risks per v3 §8. Voice here is working-document tone; this
section is inheritance, not re-derivation.

### 9.1 Path C invocation risk (RI-7)

Cross-phase substrate-modification at four-surface grain plus
multi-tab greenfield raises Path C invocation risk. v3 Pass 2
Finding R (no multi-tab precedent) bumps chunk 2 estimate to
~1000-1300 lines.

**Mitigation**: Round 1 verify-from-disk (with Session A §A
inheritance) surfaces volume drift early. Sub-Q19 library
choice (19.β Radix UI recommendation) keeps chunk 2 at lower
bound of estimate. Cycle re-evaluates session budget at each
round transition per RI-7.

### 9.2 ADR ratification dependencies

Sub-Q12 dissolves; no ADR-0014 amendment needed. ADR-0019 is
forthcoming; conviction semantics reference placeholder at v1.

**Mitigation**: Round 1 verify-from-disk confirms ADR-0019
status. Cycle proceeds with placeholder if unratified.

### 9.3 Phase 5.1 timing risk (Pass 2 Finding J)

Phase 5.1 amendments inserted between Phase 6.5 close and Phase
7 start per v3 §7 Step 7. Phase 5.1 may surface its own scope-
lock complexity. If Phase 5.1 takes more than 2 sessions,
Phase 7 slips proportionally.

**Mitigation**: Phase 5.1 scope-lock cycle fires standalone
after Phase 6.5 close; doesn't block Phase 6.5 chunks.

### 9.4 v1 multi-tab usage evidence uncertainty

Path 2 ships limited multi-tab on the theory that real usage
will reveal which Sub-Q14/15/16/17 decisions matter. If usage
evidence is insufficient at v1 close (3-user internal
audience), post-v1 amendment cycles fire against insufficient
evidence.

**Mitigation**: v1 close includes structured stress-testing
session per v3 §7 Step 10.

### 9.5 Brief amendment cycle scope creep

`ui_architecture.md` amendment touches canonical shell
architecture description. Risk: amendment cycle expands scope.

**Mitigation**: Brief amendment cycle scope bounded at Round 6
(Sub-Q6). Two documents touched (`ui_architecture.md` +
`triage_bucket_intake.md`); others out of scope.

### 9.6 Two Laws regression risk (Pass 2 Finding M)

Phase 1.1 audit framework has open findings including
INV-SERVICE-001 / INV-SERVICE-002 / INV-AUTH-001 compliance.
Phase 6.5 chunks 1 + 3 touch service-layer surfaces; chunk 2
touches React state only (no DB).

**Mitigation**: per-chunk acceptance criteria include explicit
"no new Two Laws violations" verification per §8 above. The
`service-architecture` skill auto-loads on chunks touching
services and enforces wrapper discipline.

---

## 10. Cross-references

### 10.1 Anchor decision substrate

- **v3 proposal** —
  `docs/09_briefs/phase-6/2026-05-16-cto-proposal-v3-document-
  drop-shell-consolidation.md` (commit b7cb081). Canonical
  decision substrate. Six decisions locked per 2026-05-16 CTO
  sign-off. §12 records sign-off posture + four edits + two
  Session A refinements + three pre-resolved pushbacks.

### 10.2 Predecessor artifacts

- **a9f1071 (superseded)** —
  `docs/09_briefs/phase-6/2026-05-15-agent-conversation-
  document-drop-scope-input.md`. Preserved with supersession
  header at top per ADR-0022 §2.
- **v2 CTO proposal (superseded by v3)** —
  `docs/09_briefs/phase-6/2026-05-16-cto-proposal-final-
  document-drop-shell-consolidation.md` (committed at
  b7cb081 with supersession header).
- **Session A preserved-evidence** —
  `docs/09_briefs/phase-6/2026-05-16-session-a-preserved-
  evidence.md` (commit 7834a26). Class A durable evidence (§A)
  reusable as Round 1 verify-from-disk inheritance per §D
  handoff note. Class B framing-locks against dissolved sub-
  questions preserved as historical record.

### 10.3 Phase 6 retrospective (amended in this commit)

- `docs/07_governance/retrospectives/phase-6-retrospective.md`
  §6 — carry-forward registry; amended to update a9f1071
  reference to v2 scope-lock-input artifact + acknowledge
  SharePoint amendment at 01a0fa6 for retrospective
  completeness.

### 10.4 ADRs

- **ADR-0010** — substrate-now-enforcement-later
- **ADR-0011 §1 + §3 + §6 + §7** — Document Platform substrate
- **ADR-0011 §13** — exception queue resolution-action enum
- **ADR-0012** — ProposedMutationBundle (v3 Pass 2 Finding I)
- **ADR-0014 §6 + §8** — conviction semantics + AI fallback
  contract
- **ADR-0018** — Relationship Router (Phase 4 closure)
- **ADR-0019 (forthcoming)** — confidence calibration
- **ADR-0022 §2** — supersession workflow

### 10.5 Governance precedents

- F-J-θ first-instance cross-phase substrate-modification:
  `docs/09_briefs/phase-4/chunks/2026-05-14-phase-4-chunk-2.md`
  (Session A §A.5 inheritance: chunk-grain × 2 substrate
  elements)
- Phase 2.5 amendment-cycle precedent (v3 Pass 2 Finding O):
  `docs/09_briefs/phase-2.5/2026-05-13-phase-2-5-commit-a.md`
  + commit-b.md + Phase 2 retrospective
- Phase 4 retrospective RI-1/RI-6/RI-7/RI-10 codifications:
  `docs/07_governance/retrospectives/phase-4-retrospective.md`
- Phase 5 retrospective:
  `docs/07_governance/retrospectives/phase-5-retrospective.md`
- Phase 6 retrospective:
  `docs/07_governance/retrospectives/phase-6-retrospective.md`
- Phase 6 closeout: `origin/main` at 625c7df (2026-05-15)

### 10.6 Governance forward-pointers (out-of-scope for this cycle)

- **SharePoint continuity-of-business amendment** — commit
  01a0fa6 (2026-05-15). Four-artifact ADR-0013 §13 amendment
  introducing the product-vs-vendor availability split +
  `org_settings.sharepoint_durability_mode` substrate
  reservation. Doc-only governance amendment; substrate
  reservation rides with the deferred `org_settings` cross-
  cutting sub-arc per migration 135 anti-scope notes. Named
  here for cycle-side awareness; activation belongs to post-
  v1 activation-brief territory per ADR-0013's 2026-05-15
  Amendment §Activation-brief consumer. **NOT in cycle
  scope.**

### 10.7 Code surfaces

- `apps/web/src/components/bridge/SplitScreenLayout.tsx`
- `apps/web/src/components/bridge/MainframeRail.tsx`
- `apps/web/src/components/bridge/AgentChatPanel.tsx`
- `apps/web/src/components/bridge/ContextualCanvas.tsx`
- `apps/web/src/components/canvas/DocumentIntakeRail.tsx`
- `apps/web/src/shared/types/canvasDirective.ts`
- `apps/web/src/shared/types/chatTurn.ts` (Session A §A.8
  inheritance)
- `apps/web/src/services/document-platform/documentRouterService.ts`
  (Phase 4 router)
- `apps/web/src/services/document-platform/ingestionService.ts`
  (Phase 6 ingestion)
- `apps/web/src/services/spend/billService.ts` (Phase 5
  AP/Spend)

### 10.8 Substrate migrations

- migration 121 — `agent_sessions` (Session A §A.7 + §A.11
  inheritance)
- migrations 138-145 — Phase 5 + Phase 2 substrate (Session A
  §A.11 inheritance)
- migration 143 — `document_cases` + `document_type` ENUM
- migration 148 — `exception_queue_entries`
- migrations 149-151 — Phase 4 Router substrate
- migration 152 — Phase 6 ingestion substrate
- migration 154 — `document_cards_view`
- migration 155 — `internal_sender_allowlist`
