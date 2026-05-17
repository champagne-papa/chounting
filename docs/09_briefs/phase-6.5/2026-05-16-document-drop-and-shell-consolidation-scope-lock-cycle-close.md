# Document-Drop + Bridge Shell Consolidation — scope-lock cycle close

**Date**: 2026-05-16
**Cycle**: Fresh scope-lock cycle per v3 §7 Step 2; 7 rounds
across Sessions 2-3 in conversation substrate (Option C-light
cycle-output discipline)
**Status**: Cycle CLOSED terminally at Round 7 close; this
brief consolidates durable cycle outputs
**Successor**: Session 4 brief amendment cycle per v3 §7 Step 3
**Predecessor**: Session 1 v2 scope-lock-input artifact (commit
7265f4f + f2a430e)

---

## 1. Preamble

This cycle closeout brief is the durable cycle artifact for the
fresh scope-lock cycle fired against the v2 scope-lock-input
artifact across Sessions 2 (conversation substrate Rounds 1-6)
and Session 3 (conversation substrate Round 7 + this brief
drafting). The cycle adjudicates against v3 proposal's
locked decision substrate (commit b7cb081; CTO sign-off
2026-05-16) and seeds the Phase 6.5 amendment-cycle work.

**Lineage**:

```
v3 proposal (b7cb081, CTO sign-off 2026-05-16)
  ↓ canonical decision substrate
v2 scope-lock-input artifact (7265f4f, Session 1)
  ↓ cycle working document
Session A preserved-evidence §A (7834a26)
  ↓ Round 1 verify-from-disk inheritance
THIS cycle closeout brief
  ↓ durable cycle artifact
Session 4 brief amendment cycle (next operational fire)
```

**Option C-light cycle-output discipline**: per-round work
captured in conversation substrate at Rounds 1-7; no per-round
`.coordination/` artifacts shipped during the cycle. This
brief consolidates durable outputs from conversation-grain
adjudication into a single forward-reader-accessible artifact.
Conversation substrate provides round-level trajectory; this
brief carries cycle-grain disposition.

**Cycle pattern**: two-voice cycle per Session A precedent.
Brainstorming-side (operator) fired round-onset framing
(closure framing, locks-to-land, push-back surface). WSL-side
adjudicated with verify-from-disk + candidate classifications
+ structural adjudications. Brainstorming-side ratified /
refined / pushed back; next round fired from each exchange.
Round-grain conversation substrate IS the working notes.

**Phase 6.5 folder seeded by this brief.** Prior to this
commit, `docs/09_briefs/phase-6.5/` did not exist on disk.
This brief at `phase-6.5/2026-05-16-document-drop-and-shell-
consolidation-scope-lock-cycle-close.md` (Sub-Q6.a.β₂ lean)
initiates the new Phase-6.5-naming-era artifact set. Chunk
briefs (Sessions 5/8/11) land at `phase-6.5/chunks/`; Phase
6.5 retrospective lands at
`docs/07_governance/retrospectives/phase-6.5-retrospective.md`.

---

## 2. Cycle output index

Forward-reader navigation summary:

- **§3** — Sub-question leans (all locked; 20 total disposition
  coverage across ratified-clean / dissolved / resolved /
  deferred groups)
- **§4** — Framings catalog (N=10 with formal disposition
  table; framing 5 expanded with three-instance candidate (c)
  partial-information-recommendation-drift catalog)
- **§5** — Per-chunk acceptance criteria (chunks 1/2/3 × four
  surfaces; Round 6 checklists verbatim)
- **§6** — Inter-chunk dependency map (strict-sequence
  implementation; brief-drafting interleave; Path C risk
  surface)
- **§7** — Partial-information items inventory (chunk-scoped:
  chunk 1 + chunk 2 + chunk 3 carry-forward subsections)
- **§8** — Cycle metadata (rounds fired; substrate baseline;
  cumulative state catches with sibling-instance set to §4
  framing 5; verify-from-disk findings load-bearing for
  downstream work)
- **§9** — Handoff to Session 4 (next-step trigger; commit
  shape; cycle artifact provenance)
- **§10** — Cross-references (v3 proposal; v2 scope-lock-
  input; a9f1071 superseded; Session A preserved-evidence;
  Phase 6 retrospective §6 amendment; SharePoint amendment
  out-of-cycle; ADRs; code surfaces; substrate migrations)

---

## 3. Sub-question leans (all locked)

### §3.1 — Ratified-clean (11 sub-questions)

**Sub-Q1 — Phase assignment + cycle decomposition**. Ratify
Candidate D Phase 6.5 amendment cycle per Phase 2.5 precedent
+ 3-chunk decomposition (chunk 1 Bridge shell consolidation +
Zone 1 + workspace switches; chunk 2 multi-tab canvas Cut 9
limited; chunk 3 chat-drop + staged attachments +
PendingDocumentsView + DocumentIntakeRail deletion). Three-
chunk decomposition aligns with natural substrate boundaries;
F-J-θ chunk-grain × 2 substrate elements envelope preserved
per Session A §A.5. Adjudicated Round 1.

**Sub-Q4 — DocumentIntakeRail two-step removal**. Ratify
6.4.β (remove entirely) with two-step sequence: chunk 1
detaches `DocumentIntakeRail.tsx` mount from SplitScreenLayout
(component remains on disk); chunk 3 deletes the component
after PendingDocumentsView state-machine port confirms green.
Cross-chunk dependency one-directional + safe per Session A
§A.10 verify-from-disk; deletion is irreversible substantive
step gated on verification. Adjudicated Round 1.

**Sub-Q6.a — Cycle closeout brief location**. Ratify 6.a.β₂
— `phase-6.5/2026-05-16-document-drop-and-shell-consolidation-
scope-lock-cycle-close.md` (this brief). Seeds phase-6.5/
folder; descriptive feature naming maintains lineage with v2
scope-lock-input artifact. Adjudicated Round 5.

**Sub-Q6.b — Chunk brief naming + location**. Ratify 6.b.α
— `phase-6.5/chunks/YYYY-MM-DD-phase-6-5-chunk-N.md`.
Matches existing phase-N/chunks/ convention. Adjudicated
Round 5.

**Sub-Q6.c — Brief amendment cycle artifact (Session 4)**.
Ratify hybrid 6.c.α + 6.c.γ (inline amendments only + cycle
closeout brief catalogs Session 4 scope; no separate Session 4
closeout brief) with brainstorming-side refinement: two-
commit shape per Phase 2.5 precedent (one commit per document
amendment per per-amendment commit-grain governance trail).
Adjudicated Round 5; commit-shape refinement at Round 6 close.

**Sub-Q6.d — Phase 6.5 retrospective**. Ratify 6.d.α —
`docs/07_governance/retrospectives/phase-6.5-retrospective.md`
per v3 §10. Period in filename for sub-phase (mirrors phase-
1.1 / phase-1.2 convention). Diverges from Phase 2.5
precedent (no phase-2.5-retrospective.md file; Phase 2.5
absorbed into phase-2-retrospective.md); divergence
acknowledged per v3 §10 directive. Adjudicated Round 5.

**Sub-Q7.1.a — Workspace tab semantics**. Ratify 7.1.α two
parallel workspaces (Billing | Reports). Product-module
framing per Cut 5; asymmetric workspace sizes (Billing 9
items / Reports 3 items) acceptable; Reports as standalone
product surface. Adjudicated Round 2.

**Sub-Q7.1.b — Workspace tab UI affordance**. Ratify 7.1.b.β
vertical sidebar list. Scales N=2→N=10+ cleanly; matches
modern web-app convention (Claude.ai / Cursor / VSCode);
avoids v2 migration cost of horizontal-to-vertical tab strip.
Adjudicated Round 2; chunk-1-brief refinement at Round 6:
distinguish workspace items vs Region 7.2 navigation items
visually (module icons + bolder weight for workspaces).

**Sub-Q7.2.a — Region 7.2 navigation items per workspace**.
Ratify Billing 9-item enumeration (Pending Documents + New
Bill action button + Open Bills + AP Aging + Vendor Balance
+ Payment Approval Queue + Pending Approvals + Active
Payments + Paid Bills History) + Reports 3-item enumeration
(P&L + Trial Balance + Balance Sheet). (α) "New Bill" as
primary action button at top of Billing Region 7.2;
(β) "AI Action Review" → Region 7.3 footer (NOT Billing);
(γ) account drill-down (`report_account_ledger` /
`report_accounts_by_type`) stays under CoA. Adjudicated
Round 2; carry to usage-evidence-watch (AI Action Review
footer placement may surface friction).

**Sub-Q7.3.a — Region 7.3 foundational footer scope**.
Ratify 7.3.β 4-item footer (CoA + Journal Entries +
Recurring Journals + AI Action Review). Honors cross-cutting
nature of AI Action Review; footer growth bounded.
Adjudicated Round 2.

**Sub-Q7.4.a — Region 7.4 nullity at v1**. Ratify 7.4.α′
hidden with structural reservation. Zone 1 layout
structurally accommodates Region 7.4 without rendering at
v1; activates post-v1 multi-session chat substrate per
ADR-0010 substrate-now-enforcement-later. agent_sessions
single-row constraint (application-layer enforced per
orchestrator UPSERT) preserves v3 Pass 1 Finding 6 ground.
Adjudicated Round 2.

**Sub-Q8.a — Collapse/expand trigger (both zones)**. Ratify
8.a.α both keyboard + button for Zone 1 and Zone 2. v3 §3.3
Zone 1 lock + Zone 2 inheritance; existing AgentChatPanel
onCollapse Prop confirmed at Session A §A.6. Specific
keyboard binding deferred to chunk 1 brief drafting.
Adjudicated Round 2.

**Sub-Q8.b — Collapse target**. Ratify Zone 1 8.b.α (64px
exact match with existing MainframeRail `w-16`) +
Zone 2 8.b.α (~40-48px range; chunk 1 brief picks specific
px). Architectural continuity for Zone 1; tight collapsed
state for Zone 2 with badge + expand affordance.
Adjudicated Round 2.

**Sub-Q8.c — Persistence (both zones)**. Ratify 8.c.α₁
localStorage at v1 for both zones. Per-browser scope
acceptable at v1 3-user audience; cross-browser sync
deferred to post-v1 amendment if friction surfaces.
Substrate-now-enforcement-later per ADR-0010. Adjudicated
Round 2.

**Sub-Q9.a — Staged vs immediate ingest**. Ratify 9.a.β
staged-with-explicit-ingest at v1. Matches chat-input UX
convention (email/messenger staged-with-send pattern across
Gmail, Slack, iMessage, WhatsApp); enables drop + type
accompanying message UX; tray IS drop-event acknowledgment.
Adjudicated Round 3.

**Sub-Q9.b — Tray surface shape**. Ratify 9.b.α tray above
chat input (between chat history and input). Standard
email-attachment UX convention. Adjudicated Round 3.

**Sub-Q9.c — Ingest trigger**. Ratify 9.c.α unified Send
fires both ingest + chat message. Single primary verb;
extends AgentChatPanel Send disabled-rule to `(attachments
.length > 0 || input.trim().length > 0)`. Chunk-3-brief
operationalizes ingest-only-path (Send w/ empty text) and
send-with-attached-message-path. Adjudicated Round 3.

**Sub-Q9.d — Staged tray persistence**. Ratify 9.d.α
session-only in-memory. localStorage technically infeasible
(File objects not stringifiable); IndexedDB substrate-now-
enforcement-later candidate at post-v1 if "lost-files-on-
reload" surfaces as friction. beforeunload prompt for
staged-files-on-reload carries to chunk 3 brief. Adjudicated
Round 3.

**Sub-Q10.a — Drop acknowledgment UI shape**. Ratify hybrid
10.a.α + 10.a.δ composite. (I) Drop event → tray entry IS
acknowledgment (no separate UI; per 9.a.β); (II) Send fire
→ transient toast "Ingesting N documents..." (~3 sec fade);
(III) Ingest completion → new canvas tab opens with
PendingDocumentsView (per Cut 9 Pattern γ). 10.a.δ leg
resolution depends on Sub-Q11 Cut 9 ratification (cleared
Round 4). Adjudicated Round 3.

**Sub-Q10.b — Acknowledgment lifecycle**. Ratify composite
lifecycle: (I) 10.b.γ tray persists until user removes OR
Send fires; (II) 10.b.α toast transient ~3 sec fade for
success; (III) 10.b.γ canvas tab persists. **Failure-path
toast persists until user dismissed (10.b.γ; NOT transient)**
per brainstorming-side carry to chunk 3 brief. Adjudicated
Round 3.

**Sub-Q10.c — Multi-document drop handling**. Ratify
composite shape: per-file tray entries (10.c.α at tray
grain) + single batched toast (10.c.β at toast grain) +
single tab (10.c.β at tab grain). drop_session_id naturally
batches per DocumentIntakeRail precedent line 132.
Adjudicated Round 3.

**Sub-Q11.a — Pattern γ source-driven routing**. Ratify
Pattern γ + three edge case dispositions: EC1.β always-
prompt-on-replace (v1 default; per-form dirty-state
detection deferred per substrate-now-enforcement-later);
EC2.β focus-existing-on-exact-match (directive +
selectedEntity); EC3.β one-tab-per-batch (multi-file drop =
single tab; aligns with Sub-Q10.c.β). Adjudicated Round 4.

**Sub-Q11.b — Tab data model + state lift**. Ratify
11.b.α lift entirely into SplitScreenLayout. Pattern γ
routing decisions are shell-level; tab data model belongs
at the layer making the decisions. Per-source callbacks per
brainstorming-side disposition: `onAgentDirective` +
`onMainframeNavigate` + `onCanvasDrillDown` + `onDropEvent`.
TypeScript signatures distinguish routing intent at
callsite level. Adjudicated Round 4.

**Sub-Q11.c — Tab UI affordance**. Ratify 11.c.α tab strip
at top of canvas area (browser-tab-shape; above existing
back/forward header). Most discoverable; matches user
expectation for "multi-tab canvas." Each tab: truncated
title (~120-180px) + close button. Active tab visually
distinguished. Adjudicated Round 4.

**Sub-Q11.d — Open / close / switch semantics**. Ratify
11.d.open.α (opens focused; browser-tab convention) +
11.d.close.α (switches to adjacent-right or adjacent-left
if rightmost closed) + 11.d.switch.α (instant; no
animation overhead). Tabs-zero state: re-render
`{type: 'none'}` directive with canvas showing neutral
empty state. Adjudicated Round 4.

**Sub-Q18 — Active-tab/chat-intent binding**. Ratify
18.α active tab binds (canvasContext = active tab's
directive + selectedEntity; singleton-shape preserved at
TYPE level). **Zero touch to Phase 1.2 canvasContext.ts /
.schema.ts / canvasContextSuffix.ts**. Orchestrator prompt
unchanged. 18.β / 18.γ surface as post-v1 amendment
candidates if "agent doesn't know about my other tabs"
friction surfaces. Adjudicated Round 4.

**Sub-Q19 — Multi-tab UI library choice**. Ratify 19.α
build from scratch. **Reverses v3 §4.7's 19.β recommendation**
per disk-verified absence of shadcn/ui + Radix UI + TanStack
infrastructure in codebase (no `@radix-ui/*` /
`@tanstack/*` deps; no `components/ui/` directory; no
shadcn-pattern imports). No new dependency at v1; ~300-400
lines fits chunk 2 budget. Adjudicated Round 4. **See §4
framing 5 + R2 expansion** for candidate (c) partial-
information-recommendation-drift sub-grain firing
acknowledgment.

### §3.2 — Dissolved (3 sub-questions; historical record per ADR-0022 §2)

**Sub-Q2 — Flow-a-vs-Flow-b UI selection mechanism**.
**DISSOLVED** per v3 Cut 1 (only one flow at v1; Flow (b)
deferred past v1). a9f1071's five sub-shapes (6.2.α/β/γ/δ/ε)
and Session A's three-way shortlist (6.2.α / γ / ε)
preserved as historical record at Session A §B.1. No cycle
adjudication required.

**Sub-Q3 — chat-message-with-attachments substrate**.
**DISSOLVED** per v3 Cut 1 + Session A §A.7 verify-from-disk
finding: no `chat_messages` table exists on disk; actual
chat substrate is `agent_sessions.turns` JSONB column
(migration 121). a9f1071's three sub-shapes (6.3.α/β/γ)
and Session A's re-enumerated sub-shapes (6.3.α'/β'/γ')
preserved as historical record at Session A §B.2.

**Sub-Q5 — per-flow vs unified conviction check**.
**DISSOLVED** per v3 Cut 1 (only one flow exists at v1
substrate; no per-flow split question). a9f1071's two sub-
shapes (6.5.α / β) preserved as historical record at Session
A §B.3.

### §3.3 — Resolved (1 sub-question)

**Sub-Q12 — Document-type-routing substrate seam**.
**RESOLVED** per v3 §4.8 (Phase 7 wires existing services;
Δ.4 dissolves). Cycle Round 1 verify-from-disk confirmed at
`apps/web/src/services/document-platform/documentRouterService
.ts` (1,658 lines; three subsystem entry points exported):
`completeCandidate` (Subsystem 1; line 621) +
`resolveCandidates` (Subsystem 2; line 916) +
`dispatchTrigger` (Subsystem 3; line 1510). Phase 4 closure
confirmed at disk. No Phase 6.5 chunk 4 required.

### §3.4 — Deferred (5 sub-questions; named-future-trigger)

**Sub-Q13 — Multi-session chat substrate**. v2-deferred.
Named-future-trigger: v2 scope-lock cycle when multi-session
chat substrate becomes load-bearing. Currently single-row
`agent_sessions` per (user, org).

**Sub-Q14 — Tab routing override (Pattern γ vs δ)**.
Deferred-pending-usage-evidence. Named-future-trigger: v1
real usage reveals whether agent-emitted directives sometimes
need to replace current tab.

**Sub-Q15 — Tab persistence (session-only vs persisted)**.
Deferred-pending-usage-evidence. Named-future-trigger: v1
real usage reveals whether tab loss across reload is painful
enough to justify substrate.

**Sub-Q16 — Tab management UX**. Deferred-pending-usage-
evidence. Named-future-trigger: v1 real usage reveals which
management affordances (keyboard shortcuts, max count,
close-others, etc.) are load-bearing.

**Sub-Q17 — canvas_directive contract amendment**.
Deferred-pending-usage-evidence (coupled with Sub-Q14).
Named-future-trigger: same as Sub-Q14.

---

## 4. Framings catalog (N=10 disposition table)

| # | Framing | Surfaced at | Disposition |
|---|---|---|---|
| 1 | `ui_architecture.md` supersession | v3 Pass 2 Finding P | Session 4 brief amendment |
| 2 | `triage_bucket_intake.md` supersession | v3 Pass 2 Finding P | Session 4 brief amendment |
| 3 | multi-tab Cut 9 framing | v3 Pass 2 Finding P | Absorbed Round 4 |
| 4 | workspace-as-module Cut 5 framing | v3 Pass 2 Finding P | Absorbed Rounds 2-3 |
| 5 | Candidate (c) partial-information-recommendation-drift sub-grain firing at Sub-Q19 | Round 4 | Cycle closeout brief catalog + Phase 6.5 retrospective drafting input |
| 6 | EC1 form-dirty-state mechanism scope | Round 4 | Chunk 2 brief drafting |
| 7 | Routing-source detection scope | Round 4 | Chunk 2 brief drafting |
| 8 | ADR-0010 substrate-now-enforcement-later at UI-layer grain (Sub-Q7.4.α′ + Sub-Q8.c.α₁→α₂) | Round 2 cross-cutting | Cycle closeout brief catalog + Phase 6.5 retrospective drafting input |
| 9 | Region 7.2 + 7.3 + workspace tab visual rhythm unification | Round 2 cross-cutting | Chunk 1 brief drafting |
| 10 | Round 3 chunk 3 operational carries (cluster of 5: ingest-only-path vs send-with-message; Send disabled-rule extension; beforeunload prompt; toast/canvas-tab timing-overlap; failure-path 10.b.γ) | Round 3 operational carries | Chunk 3 brief drafting |

**Disposition summary**: Session 4 brief amendment cycle
fires for framings 1 + 2 only (the two document supersessions
per v3 §7 Step 3). Framings 3 + 4 absorbed at cycle adjudication
grain (Cut 9 + Cut 5 ratified in-cycle); no separate
disposition. Framings 5 + 8 land at Phase 6.5 retrospective
drafting input. Framings 6, 7, 9, 10 land at per-chunk brief
drafting.

### §4.5 — Framing 5 expansion (R2): three-instance candidate (c) brainstorming-arc catalog

Partial-information-recommendation-drift at substrate-claim-
grain across the brainstorming arc. Three instances:

**Instance 1 — Δ.4 routing-substrate-add at original
brainstorming arc.** v1 proposal claimed routing substrate
needed to be added (Δ.4 cycle scope). Verify-from-disk found
existing substrate already shipped (`documentRouterService.ts`
at Phase 4 chunks 1-3). v3 §2.3 captures the dissolution.

**Instance 2 — a9f1071 §6.3 chat_messages table assumption**.
Scope-input artifact assumed substrate that doesn't exist on
disk (no `chat_messages` table). Session A §A.7 verify-from-
disk caught: actual substrate is `agent_sessions.turns` JSONB
column (migration 121). Session A's (c-N9-D-pro-firing) soft
lean preserved as historical record at Session A §B.4 (cycle
note: superseded per v2 Cut 1 framing dissolution; finding
durable independent of supersession).

**Instance 3 — v3 §4.7 component-library claim**. v3 proposal
cited "Radix UI Tabs primitive (via shadcn/ui pattern) —
matches existing component library per `agent_interface.md`"
as Sub-Q19 sub-shape 19.β substrate. Cycle Round 4 disk-verify
found Radix UI + shadcn/ui + TanStack absent from codebase
(no `@radix-ui/*` / `@tanstack/*` deps in package.json; no
`components/ui/` directory; no shadcn-pattern imports). v3
§4.7's "matches existing component library" claim contradicted
at disk; Sub-Q19 reversed to 19.α build from scratch.

**Pattern statement**: partial-information-recommendation-
drift at substrate-claim-grain. N=3 within brainstorming arc;
each instance shares structural property of authoring-time
silent confidence about substrate state, caught at consumption-
time verify-from-disk. Phase 6.5 retrospective drafting input
for codification grain (sibling to Session A §B.4's positive-
shape sibling pattern N=1 observation).

---

## 5. Per-chunk acceptance criteria

### §5.1 — Chunk 1 — Bridge shell consolidation + Zone 1 + workspace switches

Volume forecast ~800-1100 lines per v3 §5.1.

**Surface A — Acceptance criteria**:

Visual:
- Three-zone shell renders (Zone 1 + Zone 2 + Zone 3) per Cut 4
- `MainframeRail.tsx` removed from SplitScreenLayout
- `DocumentIntakeRail.tsx` detached from SplitScreenLayout
  (component stays on disk for chunk 3 deletion)
- Zone 1 four-region layout: 7.1 vertical sidebar workspace
  tabs (Sub-Q7.1.b.β) + 7.2 workspace-scoped nav items + 7.3
  persistent footer (4 items per Sub-Q7.3.β: CoA + Journal
  Entries + Recurring Journals + AI Action Review) + 7.4
  hidden with structural reservation (Sub-Q7.4.α′)

Functional:
- Workspace switch (Billing ↔ Reports) fires per Sub-Q7.1.a
  7.1.α two-parallel lock
- Billing workspace = 9 nav items (with "New Bill" as primary
  action button per (α); account drill-down stays under CoA
  per (γ))
- Reports workspace = 3 nav items (P&L + Trial Balance +
  Balance Sheet)
- Region 7.3 footer = 4 cross-workspace items (AI Action
  Review located here per (β), NOT in Billing)
- Region 7.4 zero-render at v1

Behavioral:
- Zone 1 collapse to 64px rail-mode (Sub-Q8.b.α Zone 1;
  matches MainframeRail `w-16`)
- Zone 2 collapse to ~40-48px rail-mode with new-output badge
- Both zones: keyboard shortcut + button trigger (Sub-Q8.a.α;
  specific keyboard binding at chunk 1 brief)
- Both zones: localStorage persistence (Sub-Q8.c.α₁)

Substrate: No service-layer changes; no DB schema changes; no
migrations; no new dependencies.

Test: 1114/1114 vitest + 26/26 agent:validate baseline
preserved; new unit tests (Zone 1 regions; workspace switch;
collapse/expand; localStorage); new E2E test (golden-path
navigation); existing 12 E2E specs remain green.

Discipline: No Two Laws violations (UI-only); per-chunk
screenshot gate.

**Checklist**:
- [ ] Three-zone shell renders across viewport sizes
- [ ] Zone 1 four-region layout structurally present
- [ ] Workspace switch (Billing ↔ Reports) functional
- [ ] Billing workspace nav = 9 items (incl. New Bill primary
      action button)
- [ ] Reports workspace nav = 3 items
- [ ] Region 7.3 footer = 4 items (CoA + JE + Recurring + AI
      Action Review)
- [ ] Region 7.4 hidden at v1 with structural reservation
- [ ] Zone 1 collapse to 64px rail-mode
- [ ] Zone 2 collapse to ~40-48px rail-mode + new-output badge
- [ ] Keyboard + button triggers wired for both zones
- [ ] localStorage persistence for both zones
- [ ] `MainframeRail.tsx` removed from SplitScreenLayout
- [ ] `DocumentIntakeRail.tsx` detached from SplitScreenLayout
- [ ] 1114+ vitest + 26/26 agent:validate green
- [ ] Screenshot gate passes
- [ ] No Two Laws violations

**Surface B — Rollback posture**: HIGH reversibility. Chunk 1
commits revert cleanly to pre-chunk-1 four-zone shell. All
changes are React component / state mutations. Substrate
dependency: NONE. Forward-recovery alternative: forward-fix
tractable via additional commit.

**Surface C — Test matrix scope**: Floor preservation (1114/
1114 + 26/26 + 12 E2E specs); new unit tests (~10-15); new
E2E tests (~3-5 specs); no test infrastructure changes;
visual regression screenshot gate (~3-5 shots).

**Surface D — Two Laws verification scope**: All Two Laws
N/A (chunk 1 UI-only; no service-layer touches; no DB writes;
no RLS-sensitive surfaces). Phase 1.1 audit framework N/A.

### §5.2 — Chunk 2 — Multi-tab canvas Cut 9 limited

Volume forecast ~1000-1300 lines per v3 §5.1 (greenfield per
Pass 2 Finding R).

**Surface A — Acceptance criteria**:

Substrate:
- Tab data model at SplitScreenLayout per Sub-Q11.b.α:
  `tabs: Array<{tabId, directive, selectedEntity, history,
  historyIndex}> + activeTabId`
- ContextualCanvas pure render-from-Props (internal history
  state removed)
- Per-source callbacks: `onAgentDirective` +
  `onMainframeNavigate` + `onCanvasDrillDown` + `onDropEvent`
- No new dependency (Sub-Q19.α; reverses v3 §4.7's 19.β)

Functional:
- Pattern γ source-driven routing (4 rules per Sub-Q11.a):
  drop → new tab; agent → new tab (or focus-existing per
  EC2.β); Mainframe/Zone 1 → replace active (with EC1.β
  prompt if dirty); in-canvas drill-down → stays in active
- EC1.β always-prompt-on-replace (v1 default; per-form dirty-
  state detection deferred)
- EC3.β one-tab-per-batch

Visual:
- Tab strip at top of canvas area (Sub-Q11.c.α browser-tab-
  shape; above existing back/forward header)
- Each tab: truncated title (~120-180px) + close button;
  active tab visually distinguished
- Back/forward header per-active-tab

Behavioral:
- Open focused (11.d.open.α); close → adjacent (11.d.close.α);
  switch instant (11.d.switch.α)
- Tabs-zero state → re-render `{type: 'none'}` neutral empty

Persistence: Session-only (no localStorage per Cut 9 v1
limitations).

Active-tab/chat-intent binding (Sub-Q18.α): canvasContext =
active tab's directive + selectedEntity; singleton-shape
preserved. **Zero touch to Phase 1.2 canvasContext.ts /
.schema.ts / canvasContextSuffix.ts**.

Substrate: No DB schema changes; no migrations; React state
only.

Test: 1114/1114 + 26/26 baseline preserved; 12 existing E2E
specs remain green; new unit + E2E tests; new test
infrastructure (multiTabFixture helper + per-tab assertion
helpers at `tests/helpers/` per chunk 2 brief).

Discipline: No Two Laws violations (React-only); **RI-6 five-
grain at scope-lock** (existing-canvas-view-consumer-contract
conformance: render-every-view-in-tab-context + zero view-
component-changes + existing E2E green); per-chunk
screenshot gate.

**Checklist**:
- [ ] Tab data model lifted into SplitScreenLayout per Sub-Q11.b.α
- [ ] ContextualCanvas pure render-from-Props (internal history removed)
- [ ] Per-source callbacks (onAgentDirective + onMainframeNavigate + onCanvasDrillDown + onDropEvent)
- [ ] Pattern γ source-driven routing functional (4 rules)
- [ ] EC1.β always-prompt-on-replace
- [ ] EC2.β focus-existing-on-exact-match
- [ ] EC3.β one-tab-per-batch
- [ ] Tab strip UI per Sub-Q11.c.α
- [ ] Open / close / switch per 11.d
- [ ] Tabs-zero state renders `{type: 'none'}` neutral empty
- [ ] Session-only persistence (no localStorage)
- [ ] canvasContext singleton-shape preserved per Sub-Q18.α
- [ ] All 12 existing canvas-view E2E specs pass
- [ ] 1114+ vitest + 26/26 agent:validate green
- [ ] Screenshot gate passes
- [ ] No Two Laws violations
- [ ] RI-6 five-grain conformance verified

**Surface B — Rollback posture**: HIGH reversibility. Chunk 2
commits revert cleanly to chunk 1 post-shell-consolidation
(single-tab canvas). React state changes only. Substrate
dependency: NONE. Forward-recovery alternative: forward-fix
tractable.

**Surface C — Test matrix scope**: Floor preservation +
existing E2E suite green; new unit tests (~15-20); new E2E
tests (~5-8 specs); **NEW test infrastructure** —
multiTabFixture helper at `tests/helpers/` + per-tab
assertion helpers at `tests/e2e/fixtures/` (chunk 2 brief
enumerates explicit fixture-additions); visual regression
screenshot gate (~4-6 shots).

**Surface D — Two Laws verification scope**: INV-SERVICE-001
/ 002 / AUTH-001 all N/A (React-only). **RI-6 five-grain
load-bearing for chunk 2** (per cycle Round 5 §5.2): every
existing canvas view's tab-aware contract preserved per Cut 6
don't-touch-canvas. Verification: render every existing
canvas view in tab context; confirm zero view-component
changes; existing E2E specs pass without modification.

### §5.3 — Chunk 3 — Chat-drop + staged attachments + PendingDocumentsView + DocumentIntakeRail deletion

Volume forecast ~500-700 lines per v3 §5.1.

**Surface A — Acceptance criteria**:

Substrate:
- AgentChatPanel drop handler (drag-drop + paste + "+" button)
- Staged attachments tray above chat input (Sub-Q9.b.α)
- POST to existing `/api/orgs/[orgId]/documents/ingest/drag-
  drop` endpoint (no route changes)
- New `PendingDocumentsView.tsx` canvas view (ports
  DocumentIntakeRail's `idle_with_recent_cards` state machine;
  mostly copy)
- New `'pending_documents'` directive in `canvasDirective.ts`
- "Pending Documents" navigation item in Zone 1 Billing
  workspace with count badge
- **DocumentIntakeRail.tsx deleted** (chunk 1 detached mount;
  chunk 3 deletes component after PendingDocumentsView port
  confirms green per Sub-Q4)
- Cut 1 Flow (a) ingestion substrate unchanged

Functional:
- Drop event → file appears in staged tray
- Send button disabled-rule extended: enabled when
  `(attachments.length > 0 || input.trim().length > 0)`
- Unified Send fires both ingest + chat message (Sub-Q9.c.α)
- Ingest-only-path: drop + Send w/ empty text → ingest only,
  no chat turn
- Send-with-attached-message-path: drop + type + Send →
  ingest + chat turn
- Session-only persistence for staged tray (Sub-Q9.d.α)
- beforeunload prompt for staged-files-on-reload defensive UX

Acknowledgment (Sub-Q10 composite):
- (I) Drop event → tray entry (no separate UI)
- (II) Send fire → transient toast "Ingesting N documents..."
  (~3 sec fade)
- (III) Ingest completion → new canvas tab opens with
  PendingDocumentsView (10.a.δ leg)
- **Failure-path: toast persists until user dismissed**
  (10.b.γ; NOT transient)
- Toast/canvas-tab timing-overlap: if canvas tab opens within
  toast fade window, toast can early-fade or be suppressed

Multi-document: per-file tray entries (10.c.α at tray grain)
+ single batched toast (10.c.β at toast grain) + single tab
(10.c.β at tab grain).

**Two-commit shape** per brainstorming-side disposition at
Round 6 close:
- Commit 1 = PendingDocumentsView port + all functional
  surfaces (AgentChatPanel drop handler + staged tray +
  canvasDirective extension + Zone 1 nav item + acknowledgment
  UI)
- Commit 2 = DocumentIntakeRail.tsx deletion (fires only after
  commit 1 verification gate passes; rollback point between
  port and delete; verification-then-delete gate
  operationalized at commit-shape grain)

Test: 1114/1114 + 26/26 baseline preserved; new unit +
integration + E2E tests; DocumentIntakeRail test coverage
migrated to PendingDocumentsView during state-machine port.

Discipline: INV-SERVICE-001 (drop handler invokes existing
`ingestionService.handleDragDropUpload` which is
`withInvariants`-wrapped; inheritance preserved);
INV-SERVICE-002 (trace_id propagation from drop event);
INV-AUTH-001 (RLS isolation via authenticated session +
existing endpoint scoped to user's active org); per-chunk
screenshot gate.

**Checklist**:
- [ ] AgentChatPanel drop handler accepts drag-drop + paste + "+" button
- [ ] Staged attachments tray renders above chat input
- [ ] Send button disabled-rule extended (attachments OR text)
- [ ] Unified Send fires both ingest + chat message
- [ ] Ingest-only-path functional
- [ ] Send-with-attached-message-path functional
- [ ] Session-only in-memory persistence for staged tray
- [ ] beforeunload prompt for staged-files-on-reload
- [ ] Transient toast on Send fire (~3 sec fade)
- [ ] Failure-path toast persists until dismissed (10.b.γ)
- [ ] Canvas tab opens with PendingDocumentsView on ingest completion
- [ ] Multi-file batch → single tab + per-file tray entries + batched toast
- [ ] Toast/canvas-tab timing-overlap handled
- [ ] `PendingDocumentsView.tsx` ports `idle_with_recent_cards`
- [ ] `'pending_documents'` directive added to canvasDirective.ts
- [ ] Zone 1 Billing "Pending Documents" nav item with count badge
- [ ] **DocumentIntakeRail.tsx deleted** (after PendingDocumentsView port confirms green)
- [ ] Cut 1 Flow (a) ingestion substrate unchanged
- [ ] POST to /api/orgs/[orgId]/documents/ingest/drag-drop unchanged
- [ ] 1114+ vitest + 26/26 agent:validate green
- [ ] Screenshot gate passes
- [ ] No Two Laws violations
- [ ] INV-SERVICE-001 / INV-SERVICE-002 / INV-AUTH-001 verified

**Surface B — Rollback posture**: MEDIUM reversibility.
Multi-step revert tractable: re-add DocumentIntakeRail.tsx
(from git history) + re-mount + revert canvasDirective.ts +
revert Zone 1 nav item + revert AgentChatPanel additions.
**DocumentIntakeRail deletion is the irreversible substantive
step**; pre-deletion verification REQUIRED via two-commit
shape (commit 1 verifies; commit 2 deletes). Dependency on
later chunks: NONE (chunk 3 is terminal). Substrate
dependency: canvasDirective member addition (additive;
reversible); no DB schema changes.

**Surface C — Test matrix scope**: Floor preservation +
ingestion regression coverage; new unit tests (~12-18); new
integration tests (~5-8); new E2E tests (~3-5 specs); test
infrastructure additions (ingestion test fixture for chat-
input drop; DocumentIntakeRail test coverage migrated to
PendingDocumentsView during port); visual regression
screenshot gate (~4-6 shots).

**Surface D — Two Laws verification scope**:
- INV-SERVICE-001: drop handler invokes existing
  `ingestionService.handleDragDropUpload` (already
  `withInvariants`-wrapped); inheritance preserved
- INV-SERVICE-002: trace_id propagation from chat-input drop
  event → ingestionService call; existing trace_id mechanism
  extends
- INV-AUTH-001: RLS isolation; chat-input drop operates
  within authenticated session; existing endpoint scoped to
  user's active org
- INV-DOC-001: Phase 5.1 substrate; NOT chunk 3 scope (chunk
  3 substrate-shape forward-compatible with INV-DOC-001
  enforcement)
- Phase 1.1 audit framework UF-001 transaction atomicity:
  chunk 3 atomicity inherits from
  `ingestionService.handleDragDropUpload`'s existing
  transactional shape

---

## 6. Inter-chunk dependency map

**Strict-sequence implementation dependencies** (chunk N+1
depends on chunk N ship):

```
Chunk 1 (Bridge shell + Zone 1)
  ↓ provides
  - Three-zone shell structure (Zone 3 canvas exists for chunk 2 multi-tab target)
  - MainframeRail removed (chunk 2 routes Mainframe → Zone 1 nav)
  - Zone 2 AgentChatPanel context (chunk 3 drop handler lands here)
  - Zone 1 Billing workspace structure (chunk 3 adds Pending Documents nav item)
  - canvasDirective.ts unchanged (chunk 3 extends)

Chunk 2 (Multi-tab canvas)
  ↓ provides
  - Tab-aware ContextualCanvas (chunk 3 drop opens new tab)
  - Per-source callbacks at SplitScreenLayout (chunk 3 wires onDropEvent)
  - canvasContext active-tab binding (chunk 3 PendingDocumentsView renders in new tab)

Chunk 3 (Chat-drop + PendingDocumentsView + DocumentIntakeRail deletion)
  → terminal chunk; no downstream Phase 6.5 dependencies
```

**Reverse-flow constraints** (chunks N+1/N+2 don't constrain
chunk N implementation):
- Chunk 1's specific keyboard shortcut bindings don't
  constrain chunk 2/3
- Chunk 2's tab visual details don't constrain chunk 3
- Chunk 3's staged tray internal state doesn't affect chunk
  1 or 2

**Safe interleave possibilities**:
- Chunk 1 + Chunk 2 brief drafting CAN interleave at
  scope-lock + brief-drafting grain
- Chunk 3 brief drafting CAN fire after chunk 2 brief
  drafting (before chunk 2 implementation)
- Sessions 5/8/11 per v3 §7 are sequenced because
  **implementation strict-sequences**

**Cross-chunk drift mitigation discipline**:
- Per-chunk brief reads prior chunks' commit body to verify
  operational assumptions
- Chunk 2 brief reads chunk 1's commit body
- Chunk 3 brief reads chunk 1 + chunk 2's commit bodies
- Substrate-now-enforcement-later principle for any cross-
  chunk substrate drift caught at brief-drafting grain

**Path C invocation risk per RI-7**:
- Chunk 2 carries highest risk (~1000-1300 line forecast;
  greenfield; RI-6 five-grain load-bearing)
- **Mitigation**: brief drafting can split chunk 2 to chunk
  2a + 2b if substrate density exceeds single-session budget
  (matches `phase-6/chunks/2026-05-15-phase-6-chunk-2a.md +
  chunk-2b.md` precedent)
- Chunk 1 + Chunk 3 stay within single-session budget

---

## 7. Partial-information items inventory (chunk-scoped)

### §7.1 — Chunk 1 carry-forwards

From cycle Rounds 2 + 5 + 6:

- **Framing 9 — Region 7.2 + 7.3 + workspace tab visual
  rhythm unification** (Round 2 cross-cutting). Workspace
  items vs Region 7.2 navigation items distinguished visually
  (workspace items get module icons + bolder weight; nav
  items get smaller font + entity-shape icons per
  brainstorming-side Round 2 refinement).
- Reports workspace exact 3-item content (P&L + Trial Balance
  + Balance Sheet) ordering
- Workspace tab visual treatment (active-state highlighting;
  tab heights; icon presence)
- Billing workspace item ordering within Region 7.2
- Region 7.3 footer visual treatment (always-visible bottom
  bar vs collapsible vs adjacent)
- Region 7.4 structural reservation implementation shape
  (zero-height placeholder vs conditional render)
- Specific keyboard shortcut bindings + conflict-check
- Zone 2 specific collapsed px (~40-48px range)
- Badge design (color, animation, count indicator)
- localStorage key shape + default-state policy

### §7.2 — Chunk 2 carry-forwards

From cycle Rounds 4 + 6:

- **Framing 6 — EC1 form-dirty-state mechanism**. Chunk 2
  ships always-prompt-on-replace as v1 default; per-form
  dirty-state detection is substrate-now-enforcement-later
  for post-v1 selective prompting.
- **Framing 7 — Routing-source detection**. Chunk 2
  implements per-source callbacks (`onAgentDirective` +
  `onMainframeNavigate` + `onCanvasDrillDown` +
  `onDropEvent`) per brainstorming-side disposition.
  TypeScript signatures distinguish routing intent at
  callsite level.
- Tab title derivation per directive type
- Tab strip overflow behavior at N≥6 tabs (no max-count per
  Cut 9 v1 limitations) — scroll? wrap? truncate?
- canvasContext update timing on tab switch (React state
  propagation timing)
- Build-from-scratch tab component visual treatment (CSS /
  Tailwind classes)
- **`agent_interface.md` read at chunk 2 brief drafting** to
  understand intended component library direction (v3 §4.7's
  reference may have been forward-looking architecture
  statement vs current-state claim per framing 5 catalog)
- Chunk 2 test infrastructure scope: multiTabFixture helper
  at `tests/helpers/` + per-tab assertion helpers at
  `tests/e2e/fixtures/`

### §7.3 — Chunk 3 carry-forwards

From cycle Round 3 + Round 6:

- **Framing 10 cluster (5 items)**:
  1. Ingest-only-path vs send-with-attached-message-path UX
  2. Send disabled-rule extension (`attachments.length > 0 || input.trim().length > 0`)
  3. beforeunload prompt for staged-files-on-reload
     defensive UX
  4. Toast/canvas-tab timing-overlap handling (early-fade or
     suppress toast if canvas tab opens within fade window)
  5. Failure-path acknowledgment lifecycle = 10.b.γ persist-
     until-dismissed (NOT transient 10.b.α)
- Drag-drop-while-typing interaction details (drop interrupt
  typing? focus return to input post-drop?)
- Tray maximum height + scroll behavior at N=10+ attachments
- Tray visual treatment (file icons, thumbnails for images,
  remove buttons)
- Tray ordering for multi-file drop (most-recent-on-top vs
  preserve-drop-order)
- Tab title shape for multi-file batch (filename of first
  file vs "N documents" vs date)
- Failure-path acknowledgment shape (toast persistence
  visualization)
- Toast fade duration (3 sec / 5 sec / specific value)
- **Chunk 3 two-commit shape**: commit 1 = PendingDocumentsView
  port + all functional surfaces; commit 2 = DocumentIntakeRail
  deletion. Rollback point between port and delete;
  verification-then-delete gate operationalized at commit-
  shape grain per brainstorming-side Round 6 refinement.

---

## 8. Cycle metadata

### §8.1 — Rounds fired

1. **Round 1** — Verify-from-disk inheritance from Session A
   §A + new verify-from-disk (canvasDirective + ContextualCanvas
   + documentRouterService + billService + ingestionService +
   rateLimit + ADRs) + Sub-Q1 / Sub-Q4 ratification framing
2. **Round 2** — Sub-Q7 (5 sub-shapes: workspace tab semantics
   / UI affordance / Region 7.2 / 7.3 / 7.4) + Sub-Q8 (3
   sub-shapes × 2 zones: trigger / target / persistence)
3. **Round 3** — Sub-Q9 (4 sub-shapes: immediate-vs-staged /
   tray surface / ingest trigger / persistence) + Sub-Q10 (3
   sub-shapes with three-moment composite decomposition)
4. **Round 4** — Sub-Q11 (4 sub-shapes incl. 3 edge cases:
   Pattern γ ratification / state lift / UI affordance /
   open-close-switch) + Sub-Q18 (3 sub-shapes: active-tab
   binding) + Sub-Q19 (3 sub-shapes: library choice — REVERSAL
   from v3 §4.7)
5. **Round 5** — Sub-Q6 (4 sub-shapes: cycle closeout brief /
   chunk briefs / brief amendment / retrospective) + brief-
   amendment-cycle-scope confirmation (N=7 ratified; N+3 to
   N=10 cycle-side extension)
6. **Round 6** — Per-chunk acceptance criteria expansion (3
   chunks × 4 surfaces = 12 substantive items + inter-chunk
   dependency map meta-output = 13 items)
7. **Round 7** — Cycle closure framing (3 sub-surfaces:
   outputs consolidation / metadata capture / handoff naming
   + 3 closure-grain items: cycle close declaration / Session
   3 drafting scope / post-cycle operational state)

### §8.2 — Substrate baseline at cycle close

- **HEAD at cycle close**: this commit's SHA (capture at
  Session 3 commit landing)
- **`origin/staging` baseline**: `ed9820f` (post-Phase-6-close)
- **Commits-ahead-of-`ed9820f`**: 5 at cycle close (1 Session
  A + 1 Pre-action 2 + 2 Session 1 + 1 this Session 3)
- **Validation gate counts at Session 3 onset**:
  - `pnpm test`: 1114/1114 (turbo cache; no source changes
    since Round 1 firing)
  - `pnpm agent:validate`: 26/26 across 5 floor test files
  - `pnpm typecheck`: green (tsc --noEmit no errors)

### §8.3 — Cumulative state catches (sibling-instance set to §4 framing 5)

Three cycle-grain instances:

1. **Round 1 — commits-count correction (4 not 5)**.
   Brainstorming-side's count had a trailing ellipsis
   indicating uncertainty; cycle-side disk-verify produced
   the authoritative count. Informational.
2. **Round 4 — v3 §4.7 19.β recommendation contradicted at
   disk**. Sub-Q19 reversal to 19.α build from scratch. v3
   cited `agent_interface.md` substrate; cycle Round 4
   verify-from-disk found Radix UI + shadcn/ui + TanStack
   absent from codebase.
3. **Round 5 — Phase 2.5 precedent retrospective-absorption
   finding**. Phase 2.5 has no dedicated
   `phase-2.5-retrospective.md` file; absorbed into
   `phase-2-retrospective.md` per Phase 2.5 Commit C
   sequence. Sub-Q6.d diverges from precedent per v3 §10
   directive (dedicated `phase-6.5-retrospective.md`).

**Sibling-instance set to §4 framing 5**: these three cycle-
grain catches form a sibling N=3 set to the §4 framing 5
brainstorming-arc N=3 catalog. **Two-axis candidate (c)
pattern catalog**:

- **Axis 1 (brainstorming arc)**: N=3 instances per §4.5 (Δ.4
  routing-substrate-add + a9f1071 §6.3 chat_messages table
  assumption + v3 §4.7 component-library claim)
- **Axis 2 (cycle execution)**: N=3 instances per §8.3
  (commits-count correction + v3 §4.7 disk-contradiction +
  Phase 2.5 retrospective-absorption divergence)

Pattern fires at multiple substrate-discovery grains.
Brainstorming-arc grain operates at proposal-authoring
substrate-claim grain; cycle-execution grain operates at
in-cycle disk-verify grain. Both axes share the same
structural property — authoring-time silent confidence about
substrate state, caught at consumption-time verify-from-disk.

**Phase 6.5 retrospective codification input**: two-axis
pattern catalog is the substantive contribution to
retrospective drafting. Codification grain candidate:
"candidate (c) at brainstorming-arc grain + cycle-execution
grain" sub-disciplines. Phase 6.5 retrospective scoping
adjudicates codification shape (under candidate (c) extended
sub-grain enumeration OR new candidate-d sibling).

### §8.4 — Verify-from-disk findings load-bearing for downstream work

**Substrate-shape findings**:
- `documentRouterService.ts` 1,658 lines / three subsystems
  (completeCandidate line 621 + resolveCandidates line 916 +
  dispatchTrigger line 1510) — Sub-Q12 dissolution + Phase 7
  wiring substrate
- ContextualCanvas internal navigation history
  (`history: CanvasDirective[]` + `historyIndex` at lines
  67-68; useEffect sync lines 71-77) — Sub-Q11.b lift target
- `agent_sessions` application-layer single-row enforcement
  (no UNIQUE constraint at DB grain; orchestrator
  loadOrCreateSession UPSERT) — Sub-Q7.4 nullity ground
- CanvasContext singleton shape
  (`{ current_directive, selected_entity }` at SplitScreenLayout
  lines 97-100) — Sub-Q18 minimal-substrate-disturbance
- AgentChatPanel no existing drop handler — chunk 3 ships
  from scratch
- DocumentIntakeRail.handleDrop pattern (lines 122-144;
  drop-session-id + FormData + POST) — chunk 3 endpoint reuse
  + drop-session-id pattern inheritance

**Code-volume + visual findings**:
- `AgentChatPanel.tsx` 788 lines; `SplitScreenLayout.tsx` 145
  lines; `DocumentIntakeRail.tsx` 311 lines;
  `ContextualCanvas.tsx` 239 lines — chunk volume forecasts
- MainframeRail `w-16` = 64px — Zone 1 collapse target source
  of truth
- MainframeRail 14 icons enumerated — Zone 1 Region 7.2 +
  7.3 navigation item distribution
- ContextualCanvas imports + `canvasDirective.ts` directives
  — ≥10 canvas views with mutable internal state (EC1 form-
  dirty-state mechanism scope)

**Dependency state findings**:
- No Radix UI / shadcn/ui / TanStack Router in package.json
  — Sub-Q19 reversal substrate
- `components/ui/` directory absent — Sub-Q19 reversal
- No existing shadcn-pattern imports — Sub-Q19 reversal
- `rateLimit.ts` at `apps/web/src/app/api/_helpers/rateLimit.ts`
  (105 lines; Path A shipped) — v3 Pass 2 Finding K
  confirmation

**Test infrastructure findings**:
- E2E harness at `tests/e2e/` with 12 existing specs (incl.
  ec-19 agent-with-real-Claude at ~$0.02/scenario)
- Test helpers at `tests/helpers/`; fixtures at
  `tests/fixtures/` + `tests/e2e/fixtures/`
- Floor tests = 5 files / 26 tests (crossOrgRlsIsolation +
  reversalMirror + serviceMiddlewareAuthorization +
  lockedPeriodRejection + unbalancedJournalEntry)

**Folder convention findings**:
- `phase-6.5/` folder does not yet exist (this commit seeds)
- Phase 2.5 precedent absorbed retrospective into phase-2-
  retrospective.md (no dedicated phase-2.5-retrospective.md);
  Phase 6.5 diverges per v3 §10

---

## 9. Handoff to Session 4

### §9.1 — Next-step trigger

**Session 4 brief amendment cycle per v3 §7 Step 3**. Reads
this brief §4 framings 1 + 2 dispositions + §9 scope as input.

Session 4 scope: **framings 1 + 2 only** (the two document
supersessions; no other framings from N=10 list land at
Session 4 per Round 5 brief-amendment-cycle-scope
confirmation):

1. **`ui_architecture.md` amendment** at
   `docs/03_architecture/ui_architecture.md`. Three-zone
   shell + workspace-as-module + limited multi-tab supersedes
   four-zone description. Optional "Shell architecture
   history" section preserves four-zone description per
   ADR-0022 §2 supersession discipline.
2. **`triage_bucket_intake.md` supersession** at
   `docs/01_prd/triage_bucket_intake.md`. Per ADR-0022 §2;
   intake-rail vision superseded by chat-input drop entry-
   point.

### §9.2 — Cycle closeout brief commit shape

**Single commit at Session 3** (this commit). No SHA-
placeholder pattern; brief doesn't self-reference its own
commit SHA. References to prior commits (b7cb081, 7834a26,
7265f4f, f2a430e, 01a0fa6) are all known at draft time.

Commit body documents cycle scope + cycle close date + Round
count (7) + sub-question coverage (20 dispositions) + cycle
outputs summary.

### §9.3 — Cycle artifact provenance

Cycle closeout brief is the **durable cycle artifact per
Option C-light**. No per-round `.coordination/` artifacts
shipped during the cycle; conversation-substrate captured
Rounds 1-7 at conversation grain; this brief consolidates
durable outputs.

Forward-readers find Phase 6.5 work entry point at
`phase-6.5/` folder (this brief seeds the folder at cycle
close grain). Chunk briefs at `phase-6.5/chunks/` (Sessions
5/8/11); Phase 6.5 retrospective at
`docs/07_governance/retrospectives/phase-6.5-retrospective.md`
(Session 13 or 13+1).

### §9.4 — Session 4 commit shape

Two commits per Sub-Q6.c brainstorming-side disposition (one
per document amendment per Phase 2.5 precedent's per-
amendment commit-grain governance trail):

- **Commit 1**: `ui_architecture.md` amendment
- **Commit 2**: `triage_bucket_intake.md` supersession

Each commit body documents the amendment scope + ADR-0022 §2
supersession discipline + cross-reference to this cycle
closeout brief §4 framings 1 + 2.

### §9.5 — Downstream sequencing post-Session 4

Per v3 §7 + Sub-Q1 / Sub-Q4 ratification:

- Session 4 closes → Sessions 5-7 fire Phase 6.5 chunk 1
  (brief drafting → scope-lock → implementation per
  chunk-1-Phase-2 precedent)
- Sessions 8-10 fire chunk 2 (with Path C split-to-2a+2b
  potential per RI-7)
- Sessions 11-13 fire chunk 3 (two-commit shape per Sub-Q4
  + Sub-Q6.c refinement)
- Session 13 (or 13+1) ships Phase 6.5 retrospective per
  Sub-Q6.d
- Sessions 14-15 fire Phase 5.1 amendments per v3 §7 Step 7
- Sessions 16+ optional Phase 6 retrospective extension
- Sessions 17+ Phase 7 (Extraction)
- v3 §7 estimated total to Phase 7 start ~16 sessions; to
  v1 close ~18-22 sessions provisional

---

## 10. Cross-references

### §10.1 — Cycle lineage

- **v3 proposal** (canonical decision substrate; CTO sign-off
  2026-05-16): `docs/09_briefs/phase-6/2026-05-16-cto-
  proposal-v3-document-drop-shell-consolidation.md`
  (commit b7cb081)
- **v2 scope-lock-input artifact** (cycle working document):
  `docs/09_briefs/phase-6/2026-05-16-document-drop-and-shell-
  consolidation-scope-lock-input.md` (commit 7265f4f)
- **a9f1071 (superseded)**: `docs/09_briefs/phase-6/
  2026-05-15-agent-conversation-document-drop-scope-input.md`
  (preserved with supersession header at top per ADR-0022 §2)
- **Session A preserved-evidence** (Round 1 verify-from-disk
  inheritance): `docs/09_briefs/phase-6/2026-05-16-session-a-
  preserved-evidence.md` (commit 7834a26)
- **Phase 6 retrospective §6 amendment** (Session 1
  carry-forward update + SharePoint amendment
  acknowledgment):
  `docs/07_governance/retrospectives/phase-6-retrospective.md`
  (commit f2a430e SHA replacement of Session 1's
  `[SESSION_1_COMMIT_SHA]` placeholder)

### §10.2 — Governance forward-pointers

- **SharePoint continuity-of-business amendment** (commit
  `01a0fa6`, 2026-05-15). Four-artifact ADR-0013 §13
  amendment introducing product-vs-vendor availability split
  + `org_settings.sharepoint_durability_mode` substrate
  reservation. **Out-of-cycle**; named here for forward-
  reader awareness. Activation belongs to post-v1 activation-
  brief territory per ADR-0013's 2026-05-15 Amendment §
  Activation-brief consumer.

### §10.3 — ADRs

- **ADR-0010** — substrate-now-enforcement-later
- **ADR-0011** §1 (substrate ownership) + §3 + §6 (document_type
  closed enum) + §7 (handoff vocabulary: ProposedMutation /
  ProposedMutationBundle / ProposedAttachment) + §13
  (exception queue resolution-action enum)
- **ADR-0012** — ProposedMutationBundle (v3 Pass 2 Finding I)
- **ADR-0014** §6 (conviction semantics) + §8 (AI fallback
  contract)
- **ADR-0018** — Relationship Router (Phase 4 closure)
- **ADR-0019** (forthcoming) — confidence calibration
- **ADR-0022** §2 — supersession workflow

### §10.4 — Code surfaces

- `apps/web/src/components/bridge/SplitScreenLayout.tsx` (145 lines)
- `apps/web/src/components/bridge/MainframeRail.tsx` (14 icons; removal target)
- `apps/web/src/components/bridge/AgentChatPanel.tsx` (788 lines)
- `apps/web/src/components/bridge/ContextualCanvas.tsx` (239 lines)
- `apps/web/src/components/canvas/DocumentIntakeRail.tsx` (311 lines; deletion target)
- `apps/web/src/shared/types/canvasDirective.ts` (64 lines; extends with `'pending_documents'`)
- `apps/web/src/shared/types/canvasContext.ts` (singleton-shape preserved per Sub-Q18.α)
- `apps/web/src/shared/types/chatTurn.ts` (Session A §A.8)
- `apps/web/src/services/document-platform/documentRouterService.ts` (1,658 lines; Phase 4 router)
- `apps/web/src/services/document-platform/ingestionService.ts` (785 lines; Phase 6 ingestion; chunk 3 endpoint reuse)
- `apps/web/src/services/spend/billService.ts` (946 lines; Phase 5 AP/Spend)
- `apps/web/src/app/api/_helpers/rateLimit.ts` (105 lines; Path A)

### §10.5 — Substrate migrations

- migration 118 — `agent_sessions` ALTER (conversation JSONB + indexes)
- migration 121 — `agent_sessions.turns` JSONB column
- migrations 138-145 — Phase 5 + Phase 2 substrate
- migration 143 — `document_cases` + `document_type` ENUM
- migration 148 — `exception_queue_entries`
- migrations 149-151 — Phase 4 Router substrate
- migration 152 — Phase 6 ingestion substrate
- migration 154 — `document_cards_view`
- migration 155 — `internal_sender_allowlist`

### §10.6 — Governance precedents

- F-J-θ first-instance cross-phase substrate-modification:
  `docs/09_briefs/phase-4/chunks/2026-05-14-phase-4-chunk-2.md`
  (chunk-grain × 2 substrate elements; Session A §A.5
  inheritance)
- Phase 2.5 amendment-cycle precedent:
  `docs/09_briefs/phase-2.5/2026-05-13-phase-2-5-commit-a.md`
  + `commit-b.md` (per-amendment commit-grain governance trail;
  retrospective absorbed into `phase-2-retrospective.md`)
- Phase 4 retrospective RI-1 / RI-6 / RI-7 / RI-10:
  `docs/07_governance/retrospectives/phase-4-retrospective.md`
- Phase 5 retrospective:
  `docs/07_governance/retrospectives/phase-5-retrospective.md`
- Phase 6 retrospective:
  `docs/07_governance/retrospectives/phase-6-retrospective.md`
- Phase 6 closeout: `origin/main` at `625c7df` (2026-05-15)
- Cycle execution discipline: Option C-light cycle-output
  (Round 1 fire per operator confirmation; no per-round
  `.coordination/` artifacts; conversation-substrate captures
  trajectory; cycle closeout brief consolidates durable
  outputs)
