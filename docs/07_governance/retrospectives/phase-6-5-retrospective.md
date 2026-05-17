# Phase 6.5 retrospective — Bridge shell consolidation + drag-drop ingestion entry-point (chunks 1 → 3)

**Status.** Closes Phase 6.5 at chunk-3 substrate complete (this
retrospective + ADR-0010 amendment + F-J-14 amendment at Commit A
`1752f06` + CLAUDE.md amendments + conventions.md new Phase 6.5
section at Commit B `82a4854` + friction-journal #8 banking entry
at this Commit C). Three Phase 6.5 retrospective commits sequenced
A → B → C per surface-precedence T3 > T4 > T1. 1148/1148 vitest;
26/26 agent:validate; documentation-only batch.

**Surface-precedence note.** Five artifact surfaces ship from this
retrospective work. T3 = ADR-0010 amendment + F-J-14 third-instance
entry at Commit A `1752f06`. T4 = CLAUDE.md amendments (Candidates
#5 + #11) + conventions.md new Phase 6.5 section (Candidates #3 +
#7 + #9 + #10) at Commit B `82a4854`. T1 = this retrospective
writeup + friction-journal #8 banking entry at this Commit C. The
surface-precedence ordering when a future reader needs the
canonical statement of any Phase 6.5 codification is **T3 > T4 >
T1**, inherited from the CLAUDE.md "When in doubt" leaf-discipline
(ADRs are tiebreakers for architectural questions; CLAUDE.md is
the standing-rules layer; conventions.md is the topical-convention
layer sitting at T4 alongside CLAUDE.md; retrospectives are the
war-diary layer). This note is positioned at the end of §7; the
writeup itself follows the seven-section sequence below.

## 1. Arc summary

Phase 6.5 ships the bridge layer between Phase 6's ingestion
substrate and Phase 7+ classification surfaces: a consolidated
three-zone UI shell + chat-input drag-drop ingestion entry-point +
multi-tab canvas + DocumentIntakeRail two-step removal. The arc
shipped in three implementation chunks plus this retrospective
consolidation chunk:

- **Chunk 1** (commit `5a9492b`, Session 7): three-zone shell
  consolidation (Mainframe rail + chat + canvas + DocumentIntakeRail
  → Zone 1 + Zone 2 + Zone 3). Zone 1 four-region layout (Region
  7.1 workspace tabs Billing | Reports + Region 7.2 workspace-
  scoped nav 8 Billing items + 3 Reports items + Region 7.3
  persistent footer 4 items + Region 7.4 hidden with structural
  reservation per Sub-Q7.4.α′). Zone 1 + Zone 2 collapsibility
  (Cmd+\ / Cmd+Shift+\) + localStorage persistence + SSR-safe
  hydration. MainframeRail.tsx deletion (98 LOC); DocumentIntakeRail
  mount detachment only (file retained for chunk 3 per Sub-Q4 two-
  step). ~850 net LOC (FAVORABLE vs 800-1100 forecast). Screenshot
  gate full 5/5 empirical pass.

- **Chunk 2** (commits `94b0411` substrate + `c5d7e89` complete;
  Sessions 10a + 10b Path C Arc β split): tab data model lift
  (`tabs: Array<Tab>` + `activeTabId` at SplitScreenLayout) +
  ContextualCanvas refactor (internal history state lifted to
  parent; prop-driven) + per-source callback decomposition
  (handleMainframeNavigate + handleAgentDirective +
  handleCanvasDrillDown; each routes via Pattern γ degenerate at
  v1) + CanvasTabStrip.tsx build-from-scratch (Sub-Q19.α; no
  Radix/shadcn/TanStack; ~300-400 LOC) + tabTitle.ts exhaustive
  38-member mapping + canvasTabRouting.ts six pure functions
  (routeStayInActive Rule 4 + routeReplaceActive Rule 3 +
  routeNewTab Rules 1+2 with optional focusExistingExactMatch +
  findExistingExactMatch EC2.β + closeTab + switchTab) + Pattern γ
  source-driven routing with EC1.β (always-prompt-on-replace via
  `window.confirm`) + EC2.β (focus-existing on exact match) +
  EC3.β (one-tab-per-batch). ~1258 net LOC (at-bound vs 1000-1300
  cycle forecast / 1000-1500 Path C brief forecast). Path C
  invoked at Grain 2 (Phase-A-close-prospective) at Session 10b.
  Screenshot gate partial 2/6 empirical + 4/6 deferred (agent
  orgId session-context bug; see §4.A).

- **Chunk 3** (commits `29e2ba1` Commit 1 + `eab3f5e` Commit 2;
  Session 13 two-commit ceremony): AgentChatPanel drag-drop +
  paste + "+" button affordance (three-part intake mechanism) +
  staged attachments tray + unified Send refactor (conditional
  paths ingest-only / send-with-attached-message / chat-only) +
  three-moment acknowledgment composite (tray + transient toast
  lifecycle + canvas-tab open via Pattern γ Rule 1 + EC3.β) +
  PendingDocumentsView.tsx port from DocumentIntakeRail (state-
  machine `idle_with_recent_cards` + `showing_batch`; minus drop
  affordance + section-header render) + `canvasDirective`
  `'pending_documents'` enum member + 4-consumer exhaustive
  coverage + Zone 1 Billing nav 9th item "Pending Documents" with
  count badge + onDropEvent consumer wave (Commit 1) +
  DocumentIntakeRail.tsx deletion (311 LOC single-file removal at
  Commit 2). ~520 Commit 1 + 311 Commit 2 = ~831 LOC activity
  (FAVORABLE vs revised 850-1300 brief band). Path C not invoked
  at brief-draft (Session 11 §1.1 negative). Screenshot gate full
  6/6 empirical at Commit 2 close + **dual-purpose verification
  RESOLVED chunk 2 deferred carry**.

**Operational-flex collapse pattern at Sessions 6 + 9 + 12.** Three
chunk scope-lock cycles convened during Phase 6.5; all three
collapsed cleanly (empty cycle; no sub-question adjudication; no
Path C invocation evaluation). The three-precedent track record
graduated to N=3 codification at Phase 6.5 close per Candidate
#11 (now codified at CLAUDE.md `### Operational-flex collapse
heuristic at chunk-grade decomposition` at Commit B `82a4854`).
Across the three chunks, Path C was invoked once at Grain 2 (Phase-
A-close-prospective at Session 10b chunk 2); Grain 1 evaluated
negative at chunks 1 + 3 brief-draft; Grain 3 reactive surface was
available throughout Phase 6.5 implementation but not invoked.
Candidate #6 catalogues all three grains at F-J-14 third-instance
entry (Commit A `1752f06`).

**What Phase 6.5 closes.** Phase 6.5 closes here at chunk-3 substrate
complete: three-zone shell operational; chat-input drag-drop
ingestion entry-point shipped; multi-tab canvas with Pattern γ
source-driven routing; DocumentIntakeRail two-step removal
complete. Phase 6.5's downstream consumers — Phase 7+ classification
+ extraction + vendor-matching surfaces that consume the multi-tab
canvas substrate; PendingDocumentsView consumer-contract available
for Phase 7+ classifier consumer wires; the `canvasDirective`
discriminated-union pattern (39 members post-chunk-3) ready for
Phase 7+ extensions per chunk 2 + chunk 3 precedent — sit
downstream of this retrospective; named carry-forwards in §6
below. Per v3 §10 retrospective directive (Sub-Q6.d separate
retrospective venue), this retrospective is the named drafting
surface. Per the founder operational reframe at Session 14 prompt,
Phase 5.1 amendments (INV-DOC-001 enforcement + paymentService
introduction + vendor_credits substrate ratification) move forward
to Sessions 15-16 in the renumbered sequence.

## 2. Chunk-by-chunk recapitulation

### 2.1 Chunk 1 — Three-zone shell consolidation

Chunk 1 is the substrate-spine chunk of Phase 6.5. It collapses
the legacy MainframeRail + chat + canvas + DocumentIntakeRail
four-surface layout into a consolidated three-zone shell (Zone 1
workspace nav + Zone 2 chat + Zone 3 canvas), with structural
reservation for a fourth zone slot (Region 7.4 hidden) preserving
post-v1 multi-session-chat capacity.

**Scope shipped:**

- Three-zone shell layout via SplitScreenLayout refactor;
  MainframeRail.tsx deletion (98 LOC; semantic role distributes
  to Zone 1 regions).
- Zone 1 four-region layout: Region 7.1 (workspace tabs Billing |
  Reports), Region 7.2 (workspace-scoped nav; 8 Billing items + 3
  Reports items), Region 7.3 (persistent footer 4 items: CoA +
  Journal Entries + Recurring Journals + AI Action Review),
  Region 7.4 (hidden with structural reservation per
  Sub-Q7.4.α′).
- Zone 1 + Zone 2 collapsibility: Zone 1 → 64px rail-mode; Zone 2
  → 44px rail-mode with badge; Cmd+\ / Cmd+Shift+\ keyboard
  triggers.
- localStorage persistence (`chounting:shell:zone1Collapsed` /
  `zone2Collapsed` / `activeWorkspace`); SSR-safe hook pattern via
  pure-helper extraction at
  `apps/web/src/shared/storage/shellStateStorage.ts` + thin React
  hooks.
- Framing 9 visual rhythm (workspace tabs > nav items > footer;
  progressive de-emphasis 14px/24px → 13px/16px → 13px/14px).
- DocumentIntakeRail mount detachment (file retained for chunk 3
  deletion per Sub-Q4 two-step).

**Brief commit:** Session 5 chunk 1 brief. **Ship commit:**
`5a9492b` (Session 7). **Forecast vs realized:** cycle §5.1
forecast 800-1100 LOC; realized ~850 net (1001 insertions / 151
deletions). **FAVORABLE direction** (Candidate #9; below upper
bound).

**Path C invocation:** not invoked. Session 5 chunk 1 brief
evaluated Path C at Grain 1 (brief-draft prospective); negative
(single-session delivery feasible).

**Screenshot gate disposition:** full 5/5 empirical pass.
Verification-shape independent of upstream broken substrate per
Candidate #10 first observation (default three-zone state + Zone
1 collapsed + Zone 2 collapsed with badge + Reports workspace
switch + Region 7.3 footer cross-workspace + AI Action Review
full-page route).

**Carry-forwards to chunk 2:**

- DocumentIntakeRail mount detachment two-step (file retained;
  deletion ride-along to chunk 3 per Sub-Q4).
- Sub-Q7.4.α′ Region 7.4 structural reservation per ADR-0010
  substrate-now-enforcement-later (Candidate #1 instance 1).
- Sub-Q8.c.α₁ localStorage persistence + SSR-safe hook pattern per
  ADR-0010 (Candidate #1 instance 2).
- A1-B vitest DOM environment gap disposition (Candidate #7 chunk
  1 instance).

**Notable patterns surfaced:**

- Candidate #1 instances 1 + 2 (ADR-0010 catalog seeding).
- Candidate #7 chunk 1 (vitest DOM gap; A1-B disposition; 11
  pure-helper unit tests + 5 E2E scenarios carry verification).
- Candidate #5 instance 7 (Phase B A4.1 volume estimate 985-1475
  → 850 FAVORABLE; partial-information-recommendation-drift at
  cycle-grade forecast surface).

### 2.2 Chunk 2 — Multi-tab canvas + Pattern γ source-driven routing

Chunk 2 is the routing-substrate chunk of Phase 6.5. It lifts the
canvas tab data model to SplitScreenLayout, builds CanvasTabStrip
from scratch, and ships Pattern γ source-driven routing with three
edge cases (EC1.β + EC2.β + EC3.β). Phase A close at Session 10b
invoked Path C at Grain 2 (Phase-A-close-prospective), splitting
chunk 2 into Arc β = chunks 2a (substrate + per-source callbacks)
+ 2b (Pattern γ routing + CanvasTabStrip + tests).

**Scope shipped:**

- Tab data model lift: `tabs: Array<Tab>` + `activeTabId` at
  SplitScreenLayout level.
- ContextualCanvas refactor: internal history state lifted to
  parent; component now prop-driven.
- Per-source callback decomposition:
  `handleMainframeNavigate` + `handleAgentDirective` +
  `handleCanvasDrillDown`; each routes via Pattern γ degenerate at
  v1 (single-tab in canvas → Rule 3 replace-active).
- `canvasContext` active-tab binding preserved (zero touch
  `canvasContext.ts` / `.schema.ts` / `canvasContextSuffix.ts`).
- CanvasTabStrip.tsx build-from-scratch per Sub-Q19.α (no Radix /
  shadcn / TanStack; ~300-400 LOC; native HTML primitives).
- tabTitle.ts exhaustive 38-member mapping (one entry per
  `canvasDirective` enum member; switch-statement exhaustiveness
  check).
- canvasTabRouting.ts six pure functions: `routeStayInActive`
  (Rule 4 same-card no-op) + `routeReplaceActive` (Rule 3 same-
  view-kind different-card) + `routeNewTab` (Rules 1+2 with
  optional `focusExistingExactMatch` flag) +
  `findExistingExactMatch` (EC2.β) + `closeTab` + `switchTab`.
- Pattern γ source-driven routing with EC1.β (always-prompt-on-
  replace via `window.confirm`) + EC2.β (focus-existing on exact
  match) + EC3.β (one-tab-per-batch).

**Brief commits:** Session 9 chunk 2 brief (clean collapse at
scope-lock); Path C brief at Session 10b. **Ship commits:**
`94b0411` (chunk 2a substrate + per-source callbacks; Sessions
10a) + `c5d7e89` (chunk 2b Pattern γ routing + CanvasTabStrip +
tests; Session 10b). **Forecast vs realized:** cycle §5.2
forecast 1000-1300 LOC; Path C brief forecast 1000-1500 LOC;
realized ~1258 net (1351 insertions / 93 deletions). **At-bound
direction** per Candidate #9 (within both forecast bands).

**Path C invocation:** invoked at Grain 2 (Phase-A-close-
prospective). Session 10b implementation-onset substrate-load
surfaced volume arithmetic crossing single-session reliable-
delivery bound; Arc β prospective split into 2a + 2b. F-J-14
second-instance graduation at Phase 6 chunk 6.2a (2026-05-15)
provided observation-grain N=1 precedent for the prospective-vs-
reactive sub-discipline; Phase 6.5 chunk 2's Grain-2 invocation is
the observation-grain N=2 instance outside Phase 6, consolidated
into the three-grain catalog at F-J-14 third-instance entry
(Commit A `1752f06`; Candidate #6).

**Screenshot gate disposition:** partial 2/6 empirical (Shot 1
single-tab default + Shot 6 close-to-1-tab) + 4/6 deferred (Shots
2-5 multi-tab states unreachable due to Finding A agent orgId
session-context bug; see §4.A). Verification-shape **dependent**
on upstream broken substrate per Candidate #10 second observation;
the gate's verification path required agent emissions to produce
multi-tab states, and the agent's tool construction was emitting
invalid orgId payloads.

**Carry-forwards to chunk 3:**

- `onDropEvent` prop reclassification from ADR-0010 substrate-now-
  enforcement-later candidate N=5 → RI-1 strict atomic ship (cosmetic-
  only without consumer; defer to chunk 3 atomic ship; Candidate
  #2).
- EC1.β `window.confirm` v1 default → React modal post-v1
  enforcement-later (Candidate #1 instance 4).
- Chunk 2 deferred Shots 2-5 (screenshot gate partial; resolution
  path TBD at chunk 3 close).
- A1-B vitest DOM environment gap inheritance (Candidate #7 chunk
  2 instance).

**Notable patterns surfaced:**

- Candidate #1 instance 4 (EC1.β `window.confirm` → React modal
  post-v1).
- Candidate #2 boundary refinement (`onDropEvent` prop chunk 2
  recognition as cosmetic-only; RI-1 strict atomic ship
  reclassification).
- Candidate #6 Grain 2 instance (Path C Phase-A-close-prospective
  at Session 10b — observation-grain N=2 outside Phase 6).
- Candidate #7 chunk 2 (A1-B inheritance; CanvasTabStrip DOM
  coverage routes through E2E specs + screenshot gate).
- Candidate #10 partial-pass observation (verification-shape
  dependent on upstream Finding A).
- Candidate #5 instance 3 (v3 §4.7 component-library claim verify-
  from-disk catch at Round 4; partial-information-recommendation-
  drift at cycle-grade brief surface).

### 2.3 Chunk 3 — Chat-input drag-drop + PendingDocumentsView + DocumentIntakeRail deletion

Chunk 3 is the entry-point chunk of Phase 6.5. It builds the chat-
input drag-drop ingestion entry-point (three-part intake
mechanism: drag-drop + paste + "+" button affordance), ports
PendingDocumentsView from DocumentIntakeRail as a `canvasDirective`
view, and completes the Sub-Q4 two-step DocumentIntakeRail removal
in a two-commit ceremony.

**Scope shipped (Commit 1 `29e2ba1`):**

- AgentChatPanel drag-drop + paste + "+" button affordance (three-
  part intake mechanism).
- Staged attachments tray (above form; max-height 144px scrolling;
  file-type icon + filename + size + hover × remove).
- Unified Send refactor (conditional paths: ingest-only / send-
  with-attached-message / chat-only).
- Three-moment acknowledgment composite (tray + transient toast
  lifecycle + canvas-tab open via Pattern γ Rule 1 + EC3.β one-
  tab-per-batch).
- PendingDocumentsView.tsx port from DocumentIntakeRail (state-
  machine carry `idle_with_recent_cards` + `showing_batch`; minus
  drop affordance + section-header render).
- `canvasDirective` `'pending_documents'` enum member +
  4-consumer exhaustive coverage (`ContextualCanvas.renderDirective`
  + `canvasContextSuffix.describeDirective` +
  `tabTitle.tabTitleForDirective` + the persistence layer).
- Zone 1 Billing nav 9th item "Pending Documents" with count badge
  (between New Bill + Open Bills).
- `onDropEvent` consumer wave (SplitScreenLayout
  `handleDropEvent` + AgentChatPanel `onDropEvent` prop) — prop
  signature + consumer at same commit per RI-1 atomic ship
  resolution from chunk 2 carry.

**Scope shipped (Commit 2 `eab3f5e`):**

- DocumentIntakeRail.tsx deletion (311 LOC single-file removal;
  Sub-Q4 two-step removal complete).

**Brief commit:** Session 11 chunk 3 brief (clean collapse at
scope-lock cycle Session 12). **Ship commits:** `29e2ba1` (Commit
1) + `eab3f5e` (Commit 2). **Forecast vs realized:** cycle §5.3
forecast 500-700 LOC; brief re-eval at A4.1 Phase-A forecast 985-
1475 LOC (later revised to 850-1300); realized ~520 Commit 1 + 311
Commit 2 = ~831 net LOC activity. **FAVORABLE direction** per
Candidate #9 (within revised band; FAVORABLE vs A4.1 Phase-A-
realized upper).

**Path C invocation:** not invoked at brief-draft (Session 11 §1.1
negative). Two-commit ceremony is a structural decomposition (Sub-
Q4 two-step removal), not a Path C volume-driven split.

**Screenshot gate disposition:** full 6/6 empirical at Commit 2
close + **dual-purpose verification RESOLVED chunk 2 deferred
carry**. Shots 1-5 chunk 3 surfaces + Shot 6 multi-batch dual-
purpose verification (chunk 3 multi-tab behavior + chunk 2
deferred Shots 2-5 incidentally verified through alternate path;
multi-batch drop flow exercises Pattern γ Rule 1 `routeNewTab`
independently of agent emissions). A6 verification-then-delete
gate 20-step operationalization (bash 8/8 + manual 16/16) +
founder explicit ratification at Step 20. Candidate #10 dual-
purpose RESOLVED observation.

**Carry-forwards to Phase 6.5 retrospective (this surface):**

- Sub-Q9.d.α→δ session-only in-memory attachments per ADR-0010
  substrate-now-enforcement-later (Candidate #1 instance 3).
- ADR-0010 N=4 catalog stable at chunk-3 close (Candidate #1
  consolidation; Commit A).
- A6 Check 7 reference-classification observation: 7 historical/
  provenance references preserved per ADR-0022 §5 (Candidate #3 +
  Candidate #12 both reference this surface).
- Audit_log count drift floor-test fragility first-fire observation
  (Candidate #8; banking entry at this Commit C).
- Test Deviation 3 Playwright DataTransfer synthesis skip
  (Candidate #7 chunk 3 instance).

**Notable patterns surfaced:**

- Candidate #1 instance 3 (Sub-Q9.d.α→δ session-only attachments).
- Candidate #2 atomic ship resolution (`onDropEvent` prop +
  consumer at same commit at Commit 1 close).
- Candidate #3 (A6 Check 7 grep: 7 historical/provenance
  references preserved).
- Candidate #4 instance 2 (target-state-vs-surface-shape grep-
  disposition grain).
- Candidate #7 chunk 3 (Playwright DataTransfer skip; Test
  Deviation 3).
- Candidate #8 banking observation (audit_log count drift first-
  fire; second-fire green after `db:reset:clean`).
- Candidate #10 dual-purpose RESOLVED (alternate path).
- Candidate #12 (ADR-0022 §5 systematic 7-reference preservation
  exemplar).

## 3. Patterns observed

The 12 candidates surfaced at chunk-3 close fan out across two
parent-pattern syntheses (Candidate #4 target-state-vs-surface-
shape parent + Candidate #12 ADR-0022 §5 systematic application
exemplar) + 10 atomic patterns, each routed to a final venue per
the founder-ratified routing rule (2026-05-17). Per-candidate
entries below state the pattern, anchor the empirical evidence at
named-commit grain, name the disposition + cross-reference, and
note adjacent patterns / consolidations.

### Candidate #1 — ADR-0010 catalog N=4

**Pattern.** The ADR-0010 substrate-now-enforcement-later cross-
pattern shipped at Phase 6.5 with four functionally-independent-
substrate UI-layer instances stable at chunk-3 close. Each carries
independent meaning at the storage / contract / persistence layer
regardless of whether a v1 consumer emits against the substrate;
each names a post-v1 upgrade path without blocking the v1 ship.

**Empirical evidence.**

- **Instance 1** (chunk 1 `5a9492b`): Sub-Q7.4.α′ Region 7.4
  hidden with structural reservation. Zero-render empty
  `<div data-region="7.4">` with `display: none` at v1; structural
  placeholder for post-v1 multi-session-chat. Single-row
  `agent_sessions` per ADR-0010.
- **Instance 2** (chunk 1 `5a9492b`): Sub-Q8.c.α₁ localStorage +
  SSR-safe hydration. Per-browser scope at v1; cross-browser sync
  (DB column) post-v1; pure-helper extraction at
  `apps/web/src/shared/storage/shellStateStorage.ts` + thin React
  hooks.
- **Instance 3** (chunk 3 Commit 1 `29e2ba1`): Sub-Q9.d.α→δ
  session-only in-memory attachments. Staged attachments session-
  only at v1; IndexedDB substrate-now-enforcement-later
  (localStorage infeasible for File objects); FileReader
  serialization deferred.
- **Instance 4** (chunk 2 `c5d7e89`): EC1.β v1-default
  `window.confirm()` → React modal post-v1. Pattern γ routing's
  edge case EC1 fires always-prompt-on-replace v1 default; per-
  form dirty-state detection + React modal substrate post-v1.

**Catalog disposition:** stable at N=4 post-chunk-3. The
`onDropEvent` prop proposed at chunk 2 brief as a candidate N=5
instance was reclassified out of this catalog at chunk 2
implementation (cosmetic-only without consumer; see Candidate #2).

**Disposition + cross-reference.** ADR-0010 amendment at Commit A
`1752f06` ratifies the N=4 catalog as a single block (alongside
the Candidate #2 boundary refinement). Catalog is canonical at
ADR-0010 surface; this retrospective preserves provenance.

**Adjacent patterns.** Parallel to ADR-0011 amendment 2026-05-15
(Phase 6 close; `ingest_items` deferral) as the substrate-grain
"land schema with consumer code" precedent at the substrate-now-
enforcement-later territory.

### Candidate #2 — ADR-0010 vs RI-1 boundary

**Pattern.** Discriminates "functionally-independent substrate
with forward-compatible upgrade" (ADR-0010 territory) from
"additive interface requiring consumer presence" (RI-1 territory).
The discriminator: ask whether the surface holds contract meaning
at the storage / schema / persistence layer in absence of any v1
consumer. If yes (DB column, enum value, RPC parameter, table
reservation, type definition, session-scoped persistence layer),
ADR-0010 territory. If no (function parameter, component prop,
callback signature whose contract is meaningless without
invocation), RI-1 strict atomic ship territory.

**Empirical evidence.**

- Chunk 2 brief proposed `onDropEvent` prop as ADR-0010 substrate-
  now-enforcement-later N=5 instance candidate.
- Chunk 2 implementation correctly recognized prop-without-consumer
  is **cosmetic-only** (a prop nothing reads is dead surface area,
  not deferred substrate; the prop's interface contract is
  meaningless without a v1 consumer wiring its invocation).
- Chunk 2 deferred `onDropEvent` to chunk 3 atomic shipping per
  RI-1.
- Chunk 3 Commit 1 (`29e2ba1`) shipped BOTH prop signature +
  consumer at same commit (Pattern γ Rule 1 `routeNewTab` without
  `focusExistingExactMatch` per EC3.β one-tab-per-batch).

**Disposition + cross-reference.** ADR-0010 amendment at Commit A
`1752f06` ratifies the boundary refinement as a sub-block of the
N=4 catalog amendment. Canonical statement of the discriminator
lives at ADR-0010; this retrospective preserves provenance.

**Adjacent patterns.** Sibling to CLAUDE.md `## Verify-forward-at-
scope-lock for computational-shape chunks` §RI-1 (Consumer-
presence verification before substrate addition); RI-1 was the
canonical landing-place for "additive interface requiring
consumer presence" before Phase 6.5; chunk 2's boundary surfacing
forced the discriminator-versus-RI-1 articulation.

### Candidate #3 — A6 reference-classification

**Pattern.** When grepping post-substantive-supersession for
remaining references, classify each hit: current-state (eliminate)
vs historical/provenance (preserve per ADR-0022 §5).

**Empirical evidence.**

- A6 verification gate Check 7 (residual import grep) at chunk 3
  Commit 1 (`29e2ba1`) close + post-Commit-2 (`eab3f5e`) close.
- Pre-Commit-2: 8 grep matches found (7 references + 1 deletion
  target itself).
- Post-Commit-2: 7 reference lines across 4 files (DocumentCard +
  `cases/route.ts` + types.ts + SplitScreenLayout); all 7
  correctly classified as historical/provenance + preserved per
  ADR-0022 §5 supersession discipline.

**Disposition + cross-reference.** conventions.md new Phase 6.5
section at Commit B `82a4854`, sub-section "Verification-gate
reference-classification (supersession-grep grain)". Convention
fires on verification-gate `grep` output of references-to-
canonical-state.

**Adjacent patterns.** Child instance of Candidate #4 target-
state-vs-surface-shape parent-pattern synthesis (this candidate is
the chunk-3-grain instance; Candidate #2 is the chunk-2-grain
instance). Companion to ADR-0022 §5 systematic application
documented at Candidate #12.

### Candidate #4 — Target-state-vs-surface-shape parent-synthesis (T1-only narrative)

**Pattern.** Phase 6.5 surfaced systematic discriminations between
target-state-shape and cosmetic-or-historical surface-shape.
Verification disciplines should classify reference/surface types
rather than apply uniform target-uniformity rules. Two child
instances codify atomically at distinct venues; this entry is the
parent-pattern synthesis at T1-only narrative grain.

**Empirical evidence.**

- **Instance 1** (chunk 2 grain): Candidate #2 ADR-0010
  functionally-independent-substrate vs RI-1 additive-interface-
  with-consumer. Disposition: ADR-0010 amendment at Commit A.
- **Instance 2** (chunk 3 grain): Candidate #3 A6 stale-current-
  state-reference vs ADR-0022 §5 historical/provenance-reference.
  Disposition: conventions.md Phase 6.5 section at Commit B.

**Disposition + cross-reference.** T1-only-narrative parent-
pattern synthesis. Both child instances codify atomically at
distinct venues (#2 → ADR-0010 amendment; #3 → conventions.md);
parent-pattern is observation-grain N=2 below codification
threshold N=3. Per founder ratification (2026-05-17), promoting
the parent-pattern to a separate conventions.md or CLAUDE.md
entry would be redundant given the child instances codify at
their own grain; T1-only-narrative preserves the synthesis without
creating pointer-duplication.

**Adjacent patterns.** Distinct from CLAUDE.md `### Codification
convention: observation-grain vs application-grain N count` (this
parent-pattern's observation grain is the synthesis grain, not
the application grain of either child). Carry-forward: if a third
target-state-vs-surface-shape instance surfaces at Phase 7+ or
Phase 5.1 amendments, the parent-pattern graduates to N=3
codification candidate.

### Candidate #5 — Partial-information-recommendation-drift N=11

**Pattern.** Recommendations / briefs / handoff prompts that cite
substrate (file paths / section references / quantitative anchors
/ decision precedents) MUST disk-verify at authoring time. When
this discipline fails-to-fire at authoring time, the catch is
structurally located at the consumption surface (retrospective or
prospective). N=11 evidence across brainstorming arc + cycle
execution + plan-authoring grains.

**Empirical evidence — N=11 instances:**

*Brainstorming arc (N=7):*

1. Δ.4 routing-substrate-add (pre-cycle observation).
2. `a9f1071` §6.3 chat_messages table assumption (actual substrate
   = `agent_sessions.turns` JSONB per migration 121).
3. v3 §4.7 component-library claim (Radix UI + shadcn/ui +
   TanStack absent from codebase).
4. Session 4 ui_architecture.md scope framing (single → four
   section).
5. Session 11 ingestionService path framing (ingestion/ →
   document-platform/ actual).
6. Session 11 A3.2 deletion scope estimate (1-3 test files → 0
   actual; FAVORABLE).
7. Phase B A4.1 volume estimate (985-1475 LOC → ~850 LOC realized;
   FAVORABLE).

*Cycle execution (N=3):*

8. Round 1 commits-count.
9. Round 4 v3 §4.7 catch.
10. Round 5 Phase 2.5 retrospective-absorption finding.

*Plan-authoring (N=1; new at this Session 14 onset):*

11. **ADR-path drift:** session prompt cited `docs/04_decisions/`
    for ADR location; disk reality is `docs/07_governance/adr/`.
    Caught at plan-authoring grain via
    `feedback_drift_discipline_prophylactic` +
    `feedback_verify_from_disk_at_brief_loop`. Plus brief offered
    "apps/web/CLAUDE.md (or root)"; only root `./CLAUDE.md` exists.

**Disposition + cross-reference.** CLAUDE.md `### Verify-from-
disk-at-non-standard-grain pattern` existing-section amendment at
Commit B `82a4854` adds **sub-grain #7 (session-prompt-authoring
grain)** to the numbered list (continuing the existing 1-6
catalog; renumbering pre-existing parenthetical cross-grain
instances from (7)+(8) → (8)+(9)). The N=11 evidence basis is
documented in the amendment; the new sub-grain #7 is the
categorical grain at which Session 14 prompt-authoring caught the
drift via prophylactic discipline application.

**Adjacent patterns.** Companion to CLAUDE.md `### Partial-
information-recommendation-drift discipline` (parent codification
of two firing-shapes: retrospective drift + prospective drift).
Phase 6.5 contribution adds N=11 evidence-instance basis to the
existing parent discipline; the new sub-grain #7 (session-prompt-
authoring) extends the grain catalog.

### Candidate #6 — Path C three-grain catalog

**Pattern.** Path C invocation observation at three distinct
grains, codifying as third-instance entry under F-J-14 canonical
Path C rule-of-record. Earlier-grain invocation preferred over
later-grain invocation (catches budget-overrun before substrate-
load + implementation effort spent).

**Empirical evidence.**

- **Grain 1 — Brief-draft prospective.** Path C evaluated at
  chunk-brief drafting grain when scope-lock surfaces volume +
  framing arithmetic crossing single-session-reliable-delivery
  bound. Session 5 chunk 1 brief evaluated Path C; negative
  (single-session delivery feasible). Session 11 chunk 3 brief
  evaluated Path C; negative.
- **Grain 2 — Phase-A-close-prospective.** Path C evaluated at
  Phase A close grain when implementation-onset substrate-load
  surfaces volume arithmetic crossing reliable-delivery bound.
  **Session 10b chunk 2 invocation — Arc β = chunks 2a + 2b
  prospective split at Phase A close (commit `94b0411` substrate
  + `c5d7e89` complete).** Path C second-instance graduation per
  F-J-14 second-instance entry (Phase 6 chunk 6.2a precedent).
- **Grain 3 — Mid-impl-reactive.** Path C evaluated mid-
  implementation when in-flight framing-revisits accumulate beyond
  single-session budget. Phase 4 chunk 3 first-instance Path C
  (F-J-14 canonical entry, 2026-05-14) — five framing-touching
  findings (Pause 2-5 amendment cycle + Path C as 5th finding).
  Available grain throughout Phase 6.5 implementation but not
  invoked.

**Phase 6.5 ratification:** invoked Path C at Grain 2 (chunk 2
Session 10b). Grain 1 evaluated negative at chunks 1+3 briefs.
Grain 3 reactive surface remained available throughout Phase 6.5
implementation but not invoked (operational-flex collapse + brief-
amendment-cycle-avoidance kept implementation within single-
session bounds for chunks 1 + 3).

**Disposition + cross-reference.** F-J-14 third-instance entry at
Commit A `1752f06` consolidates the three-grain catalog. Friction-
journal tier-1 codification grain per F-J-14's canonical status as
Path C rule-of-record (first-instance Phase 4 chunk 3 2026-05-14;
second-instance Phase 6 chunk 6.2a 2026-05-15; third-instance
Phase 6.5 retrospective 2026-05-17).

**Adjacent patterns.** Canonical RI-7 codification at CLAUDE.md
`## Verify-forward-at-scope-lock for computational-shape chunks`
§RI-7 (Session-budget-feasibility verification + Path C invocation
conditions) — the three-grain catalog implements RI-7 at
observation grain.

### Candidate #7 — Test-scope-pragmatic-reduction N=3

**Pattern.** When chunk-close validation surfaces test-
infrastructure friction that exceeds marginal verification value,
defer to dedicated test-infrastructure session as named-future-
trigger. Don't block chunk close on test-infra friction yielding
marginal verification incremental.

**Empirical evidence.**

- **Chunk 1** (`5a9492b`): vitest DOM environment gap; React
  component+hook unit tests deferred per A1-B disposition; 11
  pure-helper unit tests + 5 E2E scenarios carry verification.
- **Chunk 2** (`c5d7e89`): A1-B inheritance from chunk 1;
  CanvasTabStrip DOM coverage routes through E2E specs +
  screenshot gate; 21 pure unit tests at `canvasTabRouting.test.ts`
  + `tabTitle.test.ts` (node-env).
- **Chunk 3** (`29e2ba1`): Playwright DataTransfer synthesis non-
  trivial; Test Deviation 3 — failure-path drop-rejection-handling
  deferred to code-grade verification; empirical E2E fixture-based
  drop testing bypassed; verified via browser manual testing per
  friction-journal entry.

Adjacent Phase 6 evidence: chunk 6.2b vitest jsdom-config gap
(banked at Phase 6 retrospective).

**Disposition + cross-reference.** conventions.md new Phase 6.5
section at Commit B `82a4854`, sub-section "Test-scope-pragmatic-
reduction at chunk close". Convention fires at chunk-close
validation surface when test-infra friction exceeds marginal
verification value.

**Adjacent patterns.** Companion to Phase 6 retrospective's
parallel-arc body §3.b which captured chunk 6.2b's React component
test infrastructure gap. Phase 7+ first chunk introducing new React
components is the named-future-trigger for test-infrastructure
ship.

### Candidate #8 — Floor-test absolute-count fragility (banking)

**Pattern.** Absolute-count assertions on tables that accumulate
state across test runs (audit_log, document_jobs, others) are
fragile. Test ordering, parallel execution, and accumulated state
between runs invalidate the assertion under conditions outside test
author's control.

**Empirical evidence.**

- Chunk 3 Phase B `serviceMiddlewareAuthorization` first-fire
  produced count-drift failure (accumulated state across prior
  test runs invalidates absolute-count assertion); second-fire
  green after `db:reset:clean`.
- NOT chunk 3 regression — pre-existing fragility surfaced by
  test execution order at chunk 3 grain.

**Banking rationale:** N=1 first-instance precedent; below
observation-grain N=3 codification threshold per CLAUDE.md
`### Codification convention: observation-grain vs application-
grain N count`. Substrate scope is floor-test-design grain;
warrants dedicated investigation session rather than chunk-close
codification pass.

**Remediation candidate:** audit floor-test surface for absolute-
count assertions on accumulating tables. Replace with delta-
assertion shape (count before + count after; assert delta) OR
relative-assertion shape (count ≥ N; bound from below).

**Disposition + cross-reference.** Friction-journal new banking
entry at this Commit C (sub-task 7b). Banking shape (not
codification) per below-threshold N=1 + dedicated-investigation-
session-warranted classification.

**Adjacent patterns.** Phase 2 retrospective inventory item #5
(AccountLedgerService disposable-accounts test refactor) —
adjacent test-design remediation grain. Banking entry cross-
references this companion item.

### Candidate #9 — Volume-forecast Phase-A trumps cycle-grade

**Pattern.** For chunk-grade work with both cycle-level and Phase-
A-realized forecast, prefer Phase-A-realized forecast as empirical
anchor for chunk-grade decisions (commit-shape, Path C invocation,
scope-lock cycle planning). Phase-A-realized forecasts incorporate
substrate-load discoveries that cycle-grade forecasts cannot
capture at projection grain.

**Empirical evidence.**

| Chunk | v3 §5.1 cycle forecast | Phase-A-realized forecast | Realized | Direction |
|---|---|---|---|---|
| Chunk 1 | 800-1100 LOC | (not explicitly forecast at Phase A grain) | ~850 net LOC | FAVORABLE (below upper) |
| Chunk 2 | 1000-1300 LOC | 1000-1500 (Path C brief) | ~1258 net LOC | At-bound |
| Chunk 3 | 500-700 LOC | 985-1475 (A4.1 Phase-A; later revised 850-1300 at brief re-eval) | ~520 Commit 1 + 311 Commit 2 = ~831 net | FAVORABLE (within revised band) |

**N=4 evidence basis:** Phase 6.5 chunks 1+2+3 (3 instances) +
Phase 6 chunk 6.2b Flag 16 (97% above cycle-grade upper bound;
near Phase-A-realized at chunk-close grain). Two-arc independent
evidence.

**Disposition + cross-reference.** conventions.md new Phase 6.5
section at Commit B `82a4854`, sub-section "Volume-forecast —
Phase-A-realized forecast trumps cycle-grade forecast". Convention
fires on chunk-grade volume-vs-budget arithmetic.

**Adjacent patterns.** Companion to RI-7 session-budget-
feasibility verification at scope-lock (CLAUDE.md `## Verify-
forward-at-scope-lock for computational-shape chunks` §RI-7);
volume-forecast accuracy informs RI-7's volume estimator inputs.

### Candidate #10 — Screenshot-gate verification-shape independence

**Pattern.** When designing screenshot gate verification surface,
prefer verification-shape independence from upstream broken
substrate where possible. Verification paths that depend on broken
upstream substrate produce gate-noise (deferred shots, partial
passes) that erodes gate confidence.

**Empirical evidence.**

- **Chunk 1** (`5a9492b`): screenshot gate full 5/5 empirical pass
  — verification-shape independent of upstream issues.
- **Chunk 2** (`c5d7e89`): partial 2/6 empirical + 4/6 deferred
  pending agent orgId session-context bug fix (Finding A; §4.A).
  Verification-shape DEPENDENT on upstream broken substrate.
- **Chunk 3** (`eab3f5e`): dual-purpose RESOLVED — chunk 3 multi-
  batch drop flow exercises Pattern γ Rule 1 `routeNewTab`
  independently of agent emissions; chunk 2 deferred Shots 2-5
  incidentally verified at chunk 3 close. Verification-shape
  independent (alternate path).

**Disposition + cross-reference.** conventions.md new Phase 6.5
section at Commit B `82a4854`, sub-section "Screenshot-gate
verification-shape independence (gate design grain)". Convention
fires at screenshot gate design grain (typically during chunk
brief drafting or scope-lock cycle).

**Adjacent patterns.** Parent convention at CLAUDE.md `### UI-
session screenshot gate`. Phase 6.5 contribution refines the
parent convention with the verification-shape-independence
discipline at the gate-design grain.

### Candidate #11 — Operational-flex collapse N=3 (Sessions 6+9+12)

**Pattern.** Chunk scope-lock cycle may collapse cleanly (empty
cycle, no sub-question adjudication, no Path C invocation
evaluation) when three conditions hold: (1) all sub-questions
adjudicated at prior cycle close; (2) all partial-information
items operationalized at brief grain; (3) Path C evaluation belongs
at session-onset Phase A grain per F-J-14 three-grain catalog.

**Empirical evidence.**

- **Session 6** (chunk 1 scope-lock cycle) — clean collapse.
  Implementation in Session 7.
- **Session 9** (chunk 2 scope-lock cycle) — clean collapse. Phase
  A in Session 10 (Path C Arc β invocation at Phase A close per
  Grain 2).
- **Session 12** (chunk 3 scope-lock cycle) — clean collapse.
  Implementation in Session 13 (two-commit ceremony).

**N=3 graduation threshold met.** Three-precedent track record at
chunks-1-3-Phase-6.5 grain.

**Disposition + cross-reference.** CLAUDE.md new section at Commit
B `82a4854`, `### Operational-flex collapse heuristic at chunk-
grade decomposition`. Always-loaded session-onset orientation per
the CLAUDE.md standing-rules layer; condition (3) cross-references
F-J-14 three-grain Path C catalog (Commit A `1752f06`).

**Adjacent patterns.** Empty scope-lock cycles are a positive
signal — they indicate that pre-cycle adjudication discipline +
brief-grain operationalization discipline + Path-C-grain-catalog
discipline collectively absorbed the work upstream. Recognizing
the empty-cycle condition at session onset saves a meeting-shape
that produces no output.

### Candidate #12 — ADR-0022 §5 systematic application (T1-only exemplar)

**Pattern.** Exemplar documentation of existing ADR-0022 §5
supersession discipline systematic application. Pattern documents
that ADR-0022 §5 fires correctly across multiple Phase 6.5
deletion + supersession events. No new discipline articulation
warranted; ADR-0022 §5 already canonical at T3 surface.

**Empirical evidence.**

- **Chunk 3 Commit 1** (`29e2ba1`): 4 comment-reference updates
  ride-along (canvasContextSuffix + canvasDirective + tabTitle +
  ContextualCanvas — pre-Phase-6.5 four-zone description updated
  to three-zone post-Phase-6.5 description; SplitScreenLayout
  file-top comment).
- **Chunk 3 Commit 2** (`eab3f5e`): 7 historical/provenance
  preservation references across 4 files post-Commit-2
  (DocumentCard + `cases/route.ts` + types.ts + SplitScreenLayout).
  All 7 correctly classified per ADR-0022 §5 + preserved.

**Disposition + cross-reference.** T1-only-narrative as exemplar.
ADR-0022 §5 discipline already canonical at T3 surface; no new
discipline articulation warranted; Phase 6.5 application
demonstrates systematic firing. Per founder ratification (2026-05-
17), promoting to conventions.md would create pointer-duplication;
T1-only-narrative preserves the exemplar without redundancy.

**Adjacent patterns.** Companion to Candidate #3 conventions.md
entry (verification-gate reference-classification at supersession-
grep grain); Candidate #3 codifies the reference-classification
discipline at conventions.md, Candidate #12 documents ADR-0022 §5
systematic application as exemplar. Both candidates share the
chunk-3 grep-surface evidence basis; the disposition split reflects
the disciplinary status (Candidate #3 = new convention codifying
the classification step; Candidate #12 = exemplar of the existing
ADR-0022 §5 canonical rule's application).

## 4. Findings — adjacent-substrate

Four adjacent-substrate findings surfaced during Phase 6.5 work
but are NOT chunk territory; not codification candidates. Each
banks the description / status / post-Phase-6.5 attention queue
placement.

### §4.A — Agent orgId session-context bug (Phase-6.5-revealed pre-existing)

Recurring `canvas_directive.orgId: Invalid uuid` Zod failure at
`respondToUser` tool wrapper. Agent's tool construction produces
canvas_directive payloads with orgId failing Zod UUID validation.
Surfaced during chunk 2 screenshot gate firing; blocked empirical
verification of multi-tab states (Shots 2-5) via agent emission.

Chunk 2 deferred-empirical-verification carry RESOLVED via chunk
3 incidental verification (alternate path: drop-driven multi-batch
flow exercises Pattern γ Rule 1 `routeNewTab` independently of
agent emissions). **Underlying bug remains unfixed.** Not chunk
territory — resolution-path = agent-prompt / orchestrator
territory; not Phase 6.5 chunk work.

Post-Phase-6.5 attention: dedicated agent-prompt / orchestrator
investigation session candidate. Cross-references §3 Candidate #10
(verification-shape dependence on upstream broken substrate at
chunk 2 grain).

### §4.B — Hydration error in DevTools console

SSR/client hydration mismatch error with SignInPage in failing
tree; "Failed to load resource 127.0.0.1:54321/auth..." status
400 likely pre-existing dev-environment noise from initial auth
flow lifecycle. Surfaced at Step 14 manual verify firing during
chunk 3 close.

NOT chunk 3 regression — environment-level noise unrelated to
shell-consolidation or drag-drop substrate.

Post-Phase-6.5 attention: dev-environment cleanliness candidate.

### §4.C — EC1.β v1-default-window-confirm UX refinement

EC1.β prompt fires even when user navigates to directive that's
already active (same-directive-replace no-op visually). From user
perspective, accepting prompt that produces no visible change
feels like "nothing happened." ADR-0010 fourth UI-layer instance
(see Candidate #1 instance 4) ships at chunk 2 with this known
behavior.

Post-v1 React modal substrate refinement could add same-directive
detection (skip prompt; no-op silently). Adjacent to ADR-0010
substrate-now-enforcement-later upgrade path: the React modal
substrate that ships post-v1 is the natural surface for the UX
refinement.

Post-Phase-6.5 attention: post-v1 React modal substrate work
candidate.

### §4.D — Shadow indicator visual subtlety

Chunk 2 overflow shadow indicators (gradient mask from-neutral-50
to-transparent) on bg-neutral-50 tab strip background produce
subtle visual effect; may be barely distinguishable on
backgrounds matching the gradient origin.

NOT a chunk 3 regression; chunk 2 implementation matches design
intent. Pre-Phase-6.5 design framing did not anticipate the
matching-background subtlety.

Post-Phase-6.5 attention: post-v1 UX refinement queue (stronger
gradient color contrast).

## 5. Codifications shipped

The 12-candidate input pile ships across four canonical venues
per the founder-ratified routing rule (2026-05-17), staged into a
three-commit ceremony A → B → C per T3 > T4 > T1 surface-
precedence (Phase 6 retrospective precedent).

**T3 (Commit A `1752f06`):**

- ADR-0010 amendment covering Candidates #1 + #2:
  - N=4 catalog of functionally-independent-substrate UI-layer
    instances stable at chunk-3 close (Candidate #1).
  - Substrate-now-enforcement-later vs RI-1 strict atomic ship
    boundary refinement (Candidate #2).
- F-J-14 third-instance entry covering Candidate #6:
  - Path C three-grain catalog (Brief-draft prospective + Phase-
    A-close-prospective + Mid-impl-reactive).

**T4 (Commit B `82a4854`):**

- CLAUDE.md amendments:
  - `### Verify-from-disk-at-non-standard-grain pattern` existing-
    section sub-grain #7 addition (session-prompt-authoring
    grain; Candidate #5 N=11 evidence basis).
  - `### Operational-flex collapse heuristic at chunk-grade
    decomposition` new section (Candidate #11 N=3 graduation).
- conventions.md new Phase 6.5 section (Candidates #3 + #7 + #9 +
  #10):
  - Verification-gate reference-classification (supersession-grep
    grain) (#3).
  - Test-scope-pragmatic-reduction at chunk close (#7).
  - Volume-forecast — Phase-A-realized forecast trumps cycle-
    grade forecast (#9).
  - Screenshot-gate verification-shape independence (gate design
    grain) (#10).

**T1 (this Commit C):**

- This retrospective writeup at
  `docs/07_governance/retrospectives/phase-6-5-retrospective.md`:
  - Candidate #4 T1-only-narrative parent-pattern synthesis
    (target-state-vs-surface-shape; N=2 below codification
    threshold).
  - Candidate #12 T1-only-narrative exemplar (ADR-0022 §5
    systematic application).
  - Per-candidate dispositions + cross-references for all 12
    candidates at §3.
- friction-journal.md new banking entry for Candidate #8 (floor-
  test absolute-count fragility; N=1 first-instance precedent
  pending post-Phase-6.5 remediation session).

Note: a CLAUDE.md and conventions.md reorganization is queued for
post-Phase-6.5 execution per ongoing chat-side planning.
Codifications landing in this retrospective should be expected to
re-shelve under the new topical structure; origin attribution
preserved as footers per the reorg plan.

## 6. Forward-looking implications

Phase 6.5's downstream consumers inherit substrate + patterns +
banked findings. The carry-forwards below name the consumer + the
inherited surface + the inheritance grain.

**Pattern γ source-driven routing pattern.** Phase 7+
classification / routing UI work inherits the six pure-function
canvasTabRouting kit (`routeStayInActive` + `routeReplaceActive` +
`routeNewTab` + `findExistingExactMatch` + `closeTab` +
`switchTab`) + the three edge cases (EC1.β always-prompt-on-
replace + EC2.β focus-existing on exact match + EC3.β one-tab-per-
batch). Any Phase 7+ canvas-tab-emitting surface follows the
Pattern γ degenerate-at-v1 model; new edge cases extend the
catalog at EC4.β + EC5.β positions.

**Multi-tab canvas substrate.** Phase 7+ classification UI consumes
the multi-tab canvas: `tabs: Array<Tab>` + `activeTabId` at
SplitScreenLayout; ContextualCanvas as prop-driven view-host;
CanvasTabStrip as the visible strip surface. Classification +
extraction + vendor-matching surfaces ship as `canvasDirective`
discriminated-union members; the 38-member tabTitle.ts mapping +
4-consumer exhaustive coverage pattern at chunk 3 (39 members
post-chunk-3) extends naturally per Phase 7+ classifier consumer
wires.

**PendingDocumentsView consumer-contract.** Phase 7+ classifier
consumer wires inherit PendingDocumentsView's state-machine
(`idle_with_recent_cards` + `showing_batch`) + props-driven render
contract. The view ships as `canvasDirective: 'pending_documents'`
at chunk 3; Phase 7+ classification views extend the directive
catalog with their own enum members.

**`canvasDirective` discriminated-union pattern.** 39 members post-
chunk-3. Phase 7+ extensions follow chunk 2 + chunk 3 precedent:
add enum member → extend tabTitle.ts mapping → extend
canvasContextSuffix describeDirective → extend
ContextualCanvas renderDirective → extend the persistence layer.
4-consumer exhaustive coverage pattern enforced via TypeScript
exhaustiveness checks on the union.

**`ingestionService.handleDragDropUpload` service contract.**
Stable Phase 6 substrate consumed at Phase 6.5 chunk 3 grain;
contract holds for any Phase 7+ ingestion surface (e.g.,
forwarded-mailbox cards UI consumer at Phase 7+; alternative
ingestion channels at Phase 8+).

**Adjacent-findings A-D banked for post-Phase-6.5 attention queue
per §4.** Agent orgId session-context bug (dedicated investigation
session candidate); hydration error in DevTools console (dev-
environment cleanliness); EC1.β UX refinement (post-v1 React modal
substrate work); shadow indicator subtlety (post-v1 UX refinement
queue).

**Phase 6.5 codifications expected to re-shelve under post-Phase-
6.5 reorganization per §5 forward-pointer.** CLAUDE.md +
conventions.md reorganization queued post-Phase-6.5; the
codifications shipped at Commit B (T4) should anticipate
re-shelving under the new topical structure; origin attribution
preserved as footers per the reorg plan.

**Carry-forward: Candidate #4 N=3 graduation watch.** If a third
target-state-vs-surface-shape instance surfaces at Phase 7+ or
Phase 5.1 amendments, the parent-pattern graduates to N=3
codification candidate (conventions.md or CLAUDE.md depending on
trigger-scope vs always-loaded classification). Currently N=2
T1-only-narrative.

**Carry-forward: Candidate #8 dedicated remediation session.**
Floor-test absolute-count assertions remediation candidate at
banking-entry grain. Adjacent to Phase 2 retrospective inventory
item #5 (AccountLedgerService disposable-accounts test refactor) —
joint remediation session candidate per shared test-design grain.

## 7. Surface-precedence note (T3 > T4 > T1)

When future readers encounter a discrepancy across Phase 6.5
artifacts — say, a CLAUDE.md description that drifts from ADR-
0010's amendment, or this retrospective summary that drifts from
the conventions.md description — the surface-precedence ordering
is **T3 > T4 > T1**:

- **T3 (ADR-0010 amendment + F-J-14 third-instance entry at
  Commit A `1752f06`) wins** for any contract / invariant /
  substrate question. ADRs are the architectural-decision
  tiebreaker per CLAUDE.md "When in doubt" leaf-discipline. The
  N=4 functionally-independent-substrate UI-layer catalog +
  substrate-now-enforcement-later vs RI-1 boundary refinement at
  ADR-0010 are the canonical statement of Phase 6.5's ADR-0010
  territory; the Path C three-grain catalog at F-J-14 third-
  instance entry is the canonical Path C rule-of-record extension
  at observation grain.

- **T4 (CLAUDE.md amendments + conventions.md new Phase 6.5
  section at Commit B `82a4854`) wins** for process / discipline /
  scope-lock / convention questions. CLAUDE.md amendments are the
  always-loaded standing-rules layer; conventions.md sits at T4
  alongside CLAUDE.md as the topical-convention layer (trigger-
  scoped conventions belong at conventions.md per the routing
  principle the founder ratified 2026-05-17). Verify-from-disk-
  at-non-standard-grain sub-grain #7 (session-prompt-authoring) +
  Operational-flex collapse heuristic at chunk-grade decomposition
  are the standing-rule extensions. Verification-gate reference-
  classification + test-scope-pragmatic-reduction + volume-
  forecast Phase-A-realized + screenshot-gate verification-shape
  independence are the topical conventions for their respective
  trigger surfaces.

- **T1 (this retrospective writeup + friction-journal #8 banking
  entry at Commit C) is the war-diary layer.** The evidence basis
  + the codification reasoning + the carry-forward inventory live
  here; if the retrospective drifts from T3 or T4, T3 or T4 win.
  The retrospective preserves provenance but doesn't itself carry
  the canonical contract or the standing rule. Candidate #4 and
  Candidate #12 ship as T1-only-narrative entries (parent-pattern
  synthesis below N=3 codification threshold + exemplar of
  existing ADR-0022 §5 canonical rule) — these candidates intend
  to stay at T1 grain unless future evidence elevates them.

**Brief-drift correction acknowledgment.** The Session 14
retrospective drafting plan caught a brief-drift instance at plan-
authoring grain: the session prompt cited `docs/04_decisions/` for
ADR location; disk reality is `docs/07_governance/adr/`. Plus the
brief offered "apps/web/CLAUDE.md (or root)"; only root
`./CLAUDE.md` exists. This drift is **Candidate #5's N=11 evidence-
instance contribution** at the new sub-grain #7 (session-prompt-
authoring grain) codified at Commit B. The catch fired
prophylactically via `feedback_drift_discipline_prophylactic` +
`feedback_verify_from_disk_at_brief_loop` at plan-authoring grain;
the drift was caught before consumption (Task 0 pre-flight
verification) rather than at consumption surface (an implementer
walking a stale ADR path).

This precedent-ordering is positioned at the end of §7 (here) so
future readers see it legibly. It is also positioned in CLAUDE.md
"When in doubt" canonical-source-wins discipline. The two
positions are consistent: this retrospective's §7 names T3 > T4 >
T1 explicitly for Phase 6.5 artifacts; CLAUDE.md "When in doubt"
gives the general project-wide rule that ADRs and canonical specs
win over standing rules and retrospectives. Both apply.

---

**Retrospective shipped at Phase 6.5 retrospective Commit C
(2026-05-17).** Cross-references: Phase 6.5 retrospective Commit A
(`1752f06`, ADR-0010 amendment + F-J-14 third-instance entry);
Phase 6.5 retrospective Commit B (`82a4854`, CLAUDE.md amendments
+ conventions.md new Phase 6.5 section); Phase 6.5 retrospective
Commit C (this commit, retrospective writeup + friction-journal
#8 banking entry); chunk 1 commit `5a9492b`; chunk 2 commits
`94b0411` substrate + `c5d7e89` complete; chunk 3 commits
`29e2ba1` Commit 1 + `eab3f5e` Commit 2. Phase 6 retrospective
three-commit ceremony shape precedent at commits `9ab5071` (A) +
`da5b666` (B) + Commit C (T1; per Phase 6 retrospective).
