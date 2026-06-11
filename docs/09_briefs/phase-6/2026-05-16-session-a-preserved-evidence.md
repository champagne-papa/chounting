# Session A — preserved-evidence closeout

**Date**: 2026-05-16
**Session**: Drag-drop scope-lock cycle Session A (Rounds 0-3
closed; Round 4 firing held at v2 supersession)
**Anchor artifact (at-rest in this session)**:
`docs/09_briefs/phase-6/2026-05-15-agent-conversation-document-
drop-scope-input.md` (a9f1071)
**Supersession trigger**: CTO sign-off 2026-05-16 on v2 scope-
lock-input artifact pending Session 1 drafting

## Preamble

Drag-drop scope-lock cycle anchored at a9f1071 fired Rounds 0-3
in Session A. Round 0 ratified post-Phase-6-close baseline
(HEAD = `ed9820f`; 1114/1114 vitest; 26/26 agent:validate;
typecheck green). Rounds 1-3 closed sub-question adjudications
against a9f1071's §6 structure (Sub-Q1 phase-assignment; Sub-Q2
Flow (a)/(b) UI selection mechanism; Sub-Q3 chat-message-with-
attachments substrate shape).

CTO sign-off 2026-05-16 ratified v2 supersession of a9f1071 per
ADR-0022 §2 supersession workflow. v2 Cut 1 locks Flow (a)
substrate exclusively at v1; Flow (b) substrate is deferred past
v1 (plausibly CRA-audit-letter workflow). Three sub-questions
dissolve at v1 under v2 Cut 1:

- Sub-Q2 (Flow (a)/(b) UI selection mechanism): no flow-
  selection mechanism required at v1 because no choice exists.
- Sub-Q3 (chat-message-with-attachments substrate): substrate
  deferred past v1.
- Sub-Q5 (per-flow vs unified conviction check): only one flow
  exists at v1 substrate; no per-flow split question.

Round 4 firing held. Session A closes via preservation closeout:
durable substrate-state evidence preserved in §A; framing-locks
against dissolved sub-questions preserved in §B as historical
record. a9f1071 stays at-rest in this session; supersession
header amendment lands at Session 1 alongside v2 artifact
drafting.

## §A — Class A evidence (durable, reusable for v2 cycle)

### §A.1 — Git state baseline at session-onset (Round 0)

- HEAD: `ed9820f5068f49714b9637bcd9293965cc137539` (Reserve 2
  F-J entry; post-Phase-6-close baseline)
- `origin/staging` = HEAD
- `origin/main`: `625c7df301f3c542d311f1a58505af36e705b197`
  (Phase 6 merge ceremony)
- Commits-ahead-of-main: 1
- Working tree: clean modulo `apps/web/tests/e2e/.auth/`
  (Playwright auth state)

### §A.2 — Validation gates baseline at session-onset (Round 0)

- `pnpm test`: 1114/1114 across 194 files
- `pnpm agent:validate`: 26/26 (typecheck + no-hardcoded-urls +
  5 floor test files — crossOrgRlsIsolation 20 +
  reversalMirror 3 + serviceMiddlewareAuthorization 1 +
  lockedPeriodRejection 1 + unbalancedJournalEntry 1)
- `pnpm typecheck`: green (tsc --noEmit, no errors)

No drift surfaced at Round 0. Post-Phase-6-close baseline
holds.

### §A.3 — phase_plan.md is structurally stale

**Source**: `docs/03_architecture/phase_plan.md`

Doc enumerates Phase 1.1 (closed) / Phase 1.2 / Phase 1.3 /
"Phase 2 (and beyond)" only. Phase 2 section (lines 295-322)
states: "Scope is **not** specified here. It is determined by
the Phase 1.3 triage." No Phase 4 / Phase 5 / Phase 6
references; no chunk-grain sequencing at any post-1.3 phase.

**Implication for v2 cycle**: phase_plan.md is a Phase-1.1-
closeout-grain historical snapshot, NOT a living phase-
tracking artifact. Cannot ratify or refute chunk-sequencing
eligibility on chunk-numbering grounds. Codification
observation banked at Round 1 (out-of-scope for drag-drop
scope-lock cycle; docs-hygiene pass territory).

### §A.4 — Retrospectives directory inventory

**Source**: `docs/07_governance/retrospectives/`

Present:
- `arc-A-retrospective.md`
- `phase-1.1-retrospective.md`
- `phase-1.2-retrospective.md`
- `phase-2-retrospective.md`
- `phase-4-retrospective.md`
- `phase-5-retrospective.md`
- `phase-6-retrospective.md`

Absent:
- No `phase-3-retrospective.md` (Phase 3 absorbed into chunk-5-
  Phase-2 per project memory; ratified at closeout-verify
  2026-05-15).
- No `phase-1.3-retrospective.md` (Reality Check phase only has
  briefs).

### §A.5 — F-J-θ cross-phase substrate-modification precedent shape

**Source**: `docs/09_briefs/phase-4/chunks/2026-05-14-phase-4-
chunk-2.md` (chunk-2-Phase-4 brief), lines 318+, 461, 559, 619,
643.

F-J-θ is "the first cross-phase substrate modification at
chunks-1-6: a Phase 4 chunk modifies Phase 2 substrate elements
originally shipped by chunk-1-Phase-2 (`document_cases` table
+ `current_relationship_candidate_id` column) and chunk-1-
Phase-4 (`document_relationship_candidates` table)."

Concrete grain — **chunk-grain × 2 substrate elements**:

1. Layer 1 CHECK constraint broaden: `document_cases.state`
   admits `'matched'`; constraint rename
   `document_cases_state_chunk_6_active` →
   `document_cases_state_chunk_7_active`.
2. Head-pointer FK activation: chunk-1-Phase-2 reserved bare
   column `current_relationship_candidate_id uuid` (migration
   `20240143000000_document_cases_substrate.sql` line 67);
   chunk-2-Phase-4 activates FK constraint `REFERENCES
   document_relationship_candidates(id) ON DELETE RESTRICT`.

Pattern: substrate-now-enforcement-later per ADR-0010 —
reserve early, enforce at consumer-chunk.

Sub-discriminators surfaced: CHECK suffix naming + FK naming
+ RESTRICT/CASCADE choice.

**Grain confirmation**: cross-phase via chunk-of-phase-N
modifying substrate-of-phase-M, single-chunk-touch. NOT
phase-cluster grain.

### §A.6 — AGENT panel substrate ownership = Phase 1.2 origin

**Source files verified at disk** (line counts at HEAD =
`ed9820f`):

- `apps/web/src/components/bridge/AgentChatPanel.tsx` — 788
  lines. Phase 1.2 origin per `phase_plan.md` Phase 1.2
  deliverable list ("AgentChatPanel with streaming response
  rendering").
- `apps/web/src/components/ProposedEntryCard.tsx` — Phase 1.2
  territory.
- `apps/web/src/components/bridge/SplitScreenLayout.tsx` — 145
  lines. Phase 1.1 territory ("The Bridge split-screen shell"
  per phase_plan.md Phase 1.1 deliverable list).
- `apps/web/src/components/canvas/DocumentIntakeRail.tsx` —
  311 lines. Phase 6 chunk-6.3a territory.
- `apps/web/src/agent/orchestrator/index.ts` — orchestrator
  entry point. Phase 1.2 territory.

### §A.7 — Chat-message substrate shape = JSONB-on-agent_sessions

**Source migrations**:
- `supabase/migrations/20240118000000_agent_session_wiring.sql`
  — Phase 1.2 agent session table.
- `supabase/migrations/20240121000000_agent_sessions_turns.sql`
  — `agent_sessions.turns` JSONB column addition.

**Key finding**: NO `chat_messages` table exists on disk. Grep
on `supabase/migrations/` for `chat_messages\b` returns empty.

Actual chat substrate:
- `agent_sessions` table — one row per agent session.
- `agent_sessions.conversation` JSONB — Anthropic-format
  messages, read by orchestrator as Claude's message context
  (unchanged contract).
- `agent_sessions.turns` JSONB — client-facing `PersistedTurn[]`
  array consumed by `/api/agent/conversation` GET endpoint.

Clean separation per migration 121 top-comment (lines 10-15):
"conversation for Claude, turns for the UI."

Migration 121 schema (lines 27-28):

```sql
ALTER TABLE agent_sessions
  ADD COLUMN turns jsonb NOT NULL DEFAULT '[]'::jsonb;
```

Per-turn substrate lives inside the JSONB array, not as
discrete table rows. No PK exists at turn grain (turn.id is a
string field within JSONB, not a DB PK target).

### §A.8 — ChatTurn canonical type shape

**Source**: `apps/web/src/shared/types/chatTurn.ts`

Discriminated union:

```typescript
export type ChatTurn = ChatTurnUser | ChatTurnAssistant;

export type ChatTurnUser = ChatTurnUserSent | ChatTurnUserPending;

export type ChatTurnUserSent = {
  role: 'user';
  id: string;
  text: string;
  timestamp: string;
  status: 'sent';
};

export type ChatTurnAssistant = {
  role: 'assistant';
  id: string;
  template_id: string;
  params: Record<string, unknown>;
  card?: ProposedEntryCard;
  card_resolution?: CardResolution;
  canvas_directive_pill?: CanvasDirective;
  timestamp: string;
  trace_id: string;
};
```

Persistence variants (lines 68-79):

- `PersistedUserTurn = ChatTurnUserSent` (client-ephemeral
  `'sending' | 'failed'` never persist).
- `PersistedAssistantTurn = Omit<ChatTurnAssistant,
  'card_resolution'>` (`card_resolution` derived server-side
  from `ai_actions.status` per Pre-decision 7).

### §A.9 — Chat-message substrate consumer inventory

**Source**: grep across `apps/web/src/` for
`agent_session_turns | agentSessionTurns | agent_sessions\b`.

Consumers:
- `apps/web/src/db/types.ts` — generated types
- `apps/web/src/services/agent/agentSessionService.ts` —
  service layer
- `apps/web/src/agent/orchestrator/index.ts` — orchestrator
- `apps/web/src/agent/orchestrator/loadOrCreateSession.ts` —
  session lifecycle
- `apps/web/src/agent/onboarding/state.ts` — onboarding state
- `apps/web/src/shared/types/chatTurn.ts` — canonical type
- `apps/web/src/app/[locale]/welcome/page.tsx` — welcome page
- `apps/web/src/app/api/agent/conversation/route.ts` —
  conversation API endpoint

### §A.10 — DocumentIntakeRail current state

**Source**: `apps/web/src/components/canvas/DocumentIntakeRail
.tsx` (311 lines).

Per Phase 6 chunk-6.3a screenshot gate ratification (a9f1071 §2
lines 56-62):

- State machine: `idle_with_recent_cards{cards: []}` /
  `idle_with_recent_cards{cards: [populated]}` /
  `showing_batch{cards: [multi-file]}`.
- Currently hosts drag-drop affordance for Phase 6 ingestion
  (Flow (a) territory).
- Section headers: "Recent" vs "Last drop".
- Renders DocumentCard.

### §A.11 — Migration neighborhood inventory (Phase 1.2 era)

**Source**: `supabase/migrations/2024011*.sql` and
`2024012*.sql` listings.

Phase 1.2-era migrations (118-121 + neighbors):
- `20240118000000_agent_session_wiring.sql` — agent_sessions
  table
- `20240119000000_journal_entry_form_fixes.sql`
- `20240120000000_ai_actions_edited_status.sql`
- `20240121000000_agent_sessions_turns.sql` — turns JSONB
  column

Useful for v2 cycle if substrate decisions touch agent_sessions
or its immediate neighborhood.

## §B — Class B framing-locks (SUPERSEDED, historical record)

### §B.1 — Sub-Q2 candidate walks + soft-leans (SUPERSEDED per v2 Cut 1 — Flow (b) substrate deferred past v1)

Round 2 Sub-Q2 five-sub-shape walk (a9f1071 §6.2):

- 6.2.α — modifier key (Shift+drop = Flow b)
- 6.2.β — two visually distinct drop zones
- 6.2.γ — pre-drop selection toggle on chat input
- 6.2.δ — post-drop disambiguation modal
- 6.2.ε — default-with-override (defaults Flow a; visible
  override to switch to Flow b)

WSL-side Round 2 initial classifications:
- 6.2.β: structurally weak (Q3 sole-affordance constraint
  conflicts with two-zones requirement).
- 6.2.γ: initially classified dominated-by-6.2.ε.
- 6.2.δ: anti-regression (modal-friction-tax-on-every-drop
  regresses Phase 6 chunk-6.3a UX).

Brainstorming-side push-back at Round 2 close: 6.2.γ
classification needs nuance. 6.2.γ sticky-mode outperforms
6.2.ε per-drop-override at bursty-Flow-(b)-distribution session
grain (workflow-batch use case: user has 30-min session
dropping 12 receipts as conversation context for Flow (b)).

WSL-side concession at Round 3 onset: 6.2.γ NOT structurally
dominated; competitive at bursty-distribution session grain.

Final Round 2 close shortlist: **6.2.α / 6.2.γ / 6.2.ε**.
6.2.β + 6.2.δ structurally-weak / anti-regression
classifications held.

Two-dimensional load-bearing founder input matrix surfaced at
Round 3 fire (awaiting founder input at v2 supersession
trigger time):

- Dimension 1: Flow (a) vs Flow (b) overall ratio (low /
  balanced / high Flow (b) percentage).
- Dimension 2: Flow (b) distribution (uniform / bursty).

2D matrix coverage:
- Low ratio + uniform → 6.2.ε
- Low ratio + bursty → 6.2.α OR 6.2.γ
- Balanced + uniform → matrix unclear (no dominant shortlist
  sub-shape; brief amendment candidate)
- Balanced + bursty → 6.2.γ strongest
- High ratio + any → Flow (a) default assumption itself becomes
  contestable

6.2.γ-specific design surface flagged for brief-drafting grain:
mode-confusion mitigation overhead (visible toggle state
ambient awareness, auto-reset semantics, differentiated visual
treatment of drop zone per mode). 6.2.ε does not carry this
design surface.

**SUPERSEDED per v2 Cut 1**: no flow-selection mechanism
required at v1 because no choice exists. Flow (a) is the v1
substrate. Sub-Q2 dissolved.

### §B.2 — Sub-Q3 candidate walks + soft-leans (SUPERSEDED per v2 Cut 1 — Flow (b) substrate deferred past v1)

Round 3 Sub-Q3 re-enumerated sub-shapes against actual chat-
substrate shape (per §A.7 verify-from-disk). a9f1071 §6.3
original sub-shapes (6.3.α / β / γ) assumed `chat_messages`
table that does not exist on disk; sub-shapes re-enumerated
against `agent_sessions.turns` JSONB substrate at Round 3 fire:

- **6.3.α' — Inline JSONB extension**: extend `PersistedUserTurn`
  with `attachments?: { source_document_id: string; filename:
  string; mime_type: string; }[]` inline. DB schema unchanged;
  Zod schema + TypeScript type modification only. Cross-table
  consistency at application grain. **Substrate-cost: lowest.**

- **6.3.β' — Cross-phase FK via source_document_links
  polymorphic spine**: extends Phase 2 chunk-5 substrate.
  Requires either (β'-i) extracting turns from JSONB into new
  `agent_session_turns` table (substantial Phase 1.2
  restructuring) OR (β'-ii) polymorphic links to JSONB-
  resident entities (architectural anti-pattern). ADR-0016
  amendment required. **Substrate-cost: highest.**

- **6.3.γ' — New attachments table**: new
  `agent_session_attachments` table with FK to `agent_sessions`
  + `source_documents` + turn_id text NOT NULL. Cross-table
  consistency at application grain (turn_id refers to JSONB-
  resident turn.id; no DB FK on turn_id). RLS via org_id.
  **Substrate-cost: medium.**

Ranking: 6.3.α' < 6.3.γ' < 6.3.β'.

WSL-side soft lean at Round 3 fire: **6.3.α' inline JSONB
extension** (lowest substrate cost; pure Phase 1.2 territory;
single-chunk decomposition viable). Brainstorming-side
adjudication not received (Round 3 held at v2 supersession).

Cross-phase grain implications flagged for (A-shape) chunk-
decomposition:
- 6.3.α' → single-chunk decomposition (A-shape-1) viable
- 6.3.γ' → single-chunk decomposition viable but adds migration
- 6.3.β'-i → (A-shape-2) multi-chunk OR (A-shape-3) new-
  convention surfaces

**SUPERSEDED per v2 Cut 1**: Flow (b) chat-message-with-
attachments substrate is deferred past v1. No Sub-Q3 substrate
shape adjudication required for v1 scope. Sub-Q3 dissolved.

### §B.3 — Sub-Q5 framing (SUPERSEDED per v2 Cut 1 — Flow (b) substrate deferred past v1)

a9f1071 §6.5 two sub-shapes (Round 3 did not fire substantive
walk; deferred to Round 4-5 per a9f1071 scheduling):

- **6.5.α — per-flow conviction check**: Flow (a) follows
  existing Phase 6 ingestion conviction semantics; Flow (b)
  applies conviction check at chat-message creation time with
  conviction-low firing AI agent invocation.
- **6.5.β — unified conviction check**: both flows apply
  identical conviction check at drop time before flow-specific
  substrate writes.

**SUPERSEDED per v2 Cut 1**: only one flow exists at v1
substrate; no per-flow split question. Sub-Q5 dissolved.

### §B.4 — (c-N9) candidate-firing dispositions (PARTIALLY SUPERSEDED — N=8 baseline + positive-shape sibling pattern N=1 observation DURABLE; (c-N9-D) firing question moot at v1)

**Round 1 (c-N9) adjudication on F-J-θ-grain-extension finding**:

Brainstorming-side proposed three framings:
- (c-N9-A) genuine candidate (c) N=9 firing at precedent-
  extension-shape sub-grain
- (c-N9-B) NEW candidate-c'-sibling at precedent-extension-
  shape-claim sub-grain (codification at N=1 with graduation
  pathway at N=2+)
- (c-N9-C) NOT a candidate (c) firing (discipline operated as
  designed per a9f1071 §5 explicit partial-information warning
  + named verify-from-disk substrate list)

Brainstorming-side soft lean: **(c-N9-C)** — not a candidate
(c) firing.

WSL-side adjudication at Round 2 close: **(c-N9-C) ratified**.
Reasoning preserved: prior 8 sub-grain candidate (c) instances
share "authoring-time silent confidence" property; a9f1071 §5
carries authoring-time explicit partial-information flag +
named verify-from-disk substrate list, which is the discipline
operating-as-designed, not failed-to-fire-at-authoring. **Candidate
(c) N stays at 8** per this adjudication.

**Positive-shape sibling pattern surfaced at adjudication**
(DURABLE — NOT superseded by v2 Cut 1):

Pattern is structurally inverse to candidate (c). Same
structural property (partial-information at authoring time →
resolution at consumption surface) but inverse discipline-fire
pattern (failed-discipline vs operating-as-designed-discipline).
Codification text framing may pair them as sub-disciplines
under broader "partial-information substrate-handoff discipline"
umbrella.

Provisional naming candidate (refines at retrospective scoping):
**"designed-partial-information-handoff with verify-substrate-
enumeration"**.

N=1 first-instance precedent at a9f1071 §5 (explicit textual
partial-information flag + named verify-from-disk substrate
list + flagged for ratify-or-replace-at-consumption posture).
Below codification threshold; banks at observation-only for
future graduation if pattern recurs at N=2+.

**Round 3 (c-N9-D) classification candidate** (SUPERSEDED — moot
at v1):

WSL-side fired (c-N9-D) classification candidate at Round 3
onset: a9f1071 §6.3 silently assumed `chat_messages` table that
does not exist on disk; substrate-shape mismatch caught at
consumption surface via verify-from-disk on migration / ChatTurn
type. WSL-side soft lean: **(c-N9-D-pro-firing)** — §6.3 lacks
the explicit textual partial-information flag that §5 carries;
§6.3's silent confidence about `chat_messages` table matches
the prior 8 sub-grain candidate (c) instance shape.

Brainstorming-side adjudication NOT received (Round 3 held at
v2 supersession). **SUPERSEDED per v2 Cut 1**: §6.3 sub-shape
framing dissolved with Sub-Q3 dissolution; the chat-message-
substrate-shape mismatch question is no longer load-bearing
for v1 scope adjudication. WSL-side (c-N9-D-pro-firing) soft
lean stays as historical record; brainstorming-side
adjudication not received and not required for v1.

### §B.5 — Lock 2 Sub-Q1 phase-assignment framing (PARTIALLY SUPERSEDED — territory lock + (A1) DURABLE; cross-phase substrate-modification framing narrowed)

**Round 1 Lock 2 closure**:

- Candidate A *territory* LOCKED: Phase 6 post-close-extension
  with cross-phase substrate-modification framing.
- Candidate B (Phase 5.1 amendments) rejected: substrate-domain
  grounds (Phase 5.1 is INV-DOC-001 enforcement / vendor_credits
  / paymentService territory; drag-drop is ingestion-entry-point
  + chat-message-with-attachments territory).
- Candidate C (new CPA-N convention) rejected: weaker on naming-
  convention-creation grounds.
- (A-shape) sub-question deferred to Round 6 OR earlier if
  substrate-density information sufficient (per codify-while-
  deciding-at-decision-time).
- (A1) post-close-extension soft-lean preserved at Round 1.

**Round 2 Lock 2.1 (A1)/(A2) formal adjudication**:

- **(A1) post-close-extension LOCKED**: Phase 6 stays closed at
  `625c7df` + `ed9820f`; chunk-6.4 (and any downstream chunks
  per (A-shape)) ship as post-close-extension under closed-phase
  umbrella.
- (A2) phase-reopen-after-close-marker rejected: would re-
  litigate close artifacts (substantive governance-trail noise)
  OR add ambiguous second close marker (two close markers per
  phase).
- Single canonical close marker per phase preserved.

Governance-trail implications carried at Round 2 Lock 2.1:
- chunk-N brief at `docs/09_briefs/phase-6/chunks/...` (post-
  close).
- Phase 6 retrospective NOT amended for post-close-extension
  chunk scope.
- F-J-θ-grain-extension framing documented in chunk brief top-
  comment + first commit body per chunk-2-Phase-4 precedent.

**PARTIALLY SUPERSEDED per v2 Cut 1**:

- **DURABLE**: Candidate A territory lock (Phase 6 chunk
  extension is the right phase territory for Flow (a)
  ingestion-entry-point work).
- **DURABLE**: (A1) post-close-extension framing precedent +
  single-canonical-close-marker-per-phase discipline +
  governance-trail implications shape.
- **NARROWED**: "cross-phase substrate-modification framing"
  justification is narrowed under v2 Cut 1 (Flow (a)-only at v1
  means no Phase 1.2 chat-substrate involvement; F-J-θ-grain-
  extension framing may no longer apply at v1).
- **DISSOLVED**: (A-shape) chunk-decomposition deferral —
  substrate density substantively reduced under v2 Cut 1; chunk
  decomposition surfaces against v2 scope at fresh cycle, not
  a9f1071 scope.

### §B.6 — RI-10 framing count (PARTIALLY SUPERSEDED — count effectively resets at v2 fresh cycle)

Round 1 surface: F-J-θ-grain-extension framing (N=1 toward
RI-10 brief amendment cycle threshold).

Round 3 onset surface: chat-message-substrate-shape-mismatch
framing (N=2; companion to (c-N9-D-pro-firing) WSL-side soft
lean per §B.4).

N=2 at Round 3 close. RI-10 fires at N≥3.

**PARTIALLY SUPERSEDED per v2 Cut 1**:

- Chat-message-substrate-shape-mismatch framing (N=2
  contributor) dissolves with Sub-Q3 dissolution.
- F-J-θ-grain-extension framing (N=1) MAY persist in narrowed
  v2 scope if cross-phase framing remains relevant at v2, but
  cross-phase framing is itself narrowed under v2 Flow (a)-only
  scope (per §B.5).
- RI-10 framing count effectively resets at v2 fresh cycle.

### §B.7 — Lock 1 scope-lock-cycle closure point framing (DURABLE — NOT superseded by v2 Cut 1)

Lock 1 (I): scope-lock cycle closes at scope-lock-cycle-close
marker + brief drafting carry-forward(s). Multi-brief if multi-
chunk decomposition surfaces at Round 6 (or equivalent late-
round Sub-Q6 naming + governance-trail adjudication).

Push-back surface (II) rejected at Round 1: collapsing scope-
lock + drafting + chunk implementation + retrospective under
single scope-lock cycle umbrella conflates session-shape
boundaries (decision-making cognitive shape vs artifact-
production cognitive shape vs code-writing cognitive shape).

Structural refinement at Round 1 close: drag-drop scope-lock
cycle's product is the brief OR briefs (plural). If multi-
chunk decomposition surfaces, product becomes N briefs for N
chunks. Each brief fires its own downstream drafting → chunk →
ceremony session sequence. Lock 1 (I)'s closure point survives
multi-chunk decomposition cleanly because product remains
"brief drafting carry-forward(s)" regardless of brief count.

**DURABLE — NOT superseded by v2 Cut 1**: Lock 1 is a meta-
framing about how scope-lock cycles close, NOT anchored to
a9f1071's dissolved sub-question structure. v2 fresh cycle
inherits Lock 1 (I) framing as ratified meta-process precedent
(unless v2 surfaces substantive contrary evidence).

## §C — Cross-references

- **v2 scope-lock-input artifact** — pending Session 1
  drafting; target path TBD (operator decision at Session 1
  open). Supersession header amendment to a9f1071 lands at
  Session 1 alongside v2 artifact drafting.
- **a9f1071** —
  `docs/09_briefs/phase-6/2026-05-15-agent-conversation-
  document-drop-scope-input.md` (this session's at-rest anchor).
- **ADR-0011** —
  `docs/07_governance/adr/0011-document-platform.md` (document
  platform; ingestion substrate; linked_entity_type enumeration
  governance per ADR-0016 cross-reference).
- **ADR-0014** —
  `docs/07_governance/adr/0014-tier-2-document-pipeline.md` (§6
  conviction semantics + §8 AI fallback contract; verify-from-
  disk source for Q4 conviction discipline; deferred at v2 Cut
  1 per Sub-Q5 dissolution).
- **ADR-0018** —
  `docs/07_governance/adr/0018-relationship-router.md`
  (relationship router; cross-reference for chunk-2-Phase-4
  F-J-θ precedent context).
- **ADR-0022** —
  `docs/07_governance/adr/0022-adr-lifecycle-workflows.md` (§2
  supersession workflow; CTO sign-off precedent for v2
  supersession of a9f1071).
- **F-J-θ precedent brief** —
  `docs/09_briefs/phase-4/chunks/2026-05-14-phase-4-chunk-2.md`
  (chunk-2-Phase-4 brief; first-instance cross-phase substrate
  modification precedent per §A.5).
- **chunk-6.3a brief** —
  `docs/09_briefs/phase-6/chunks/2026-05-15-phase-6-chunk-3a.md`
  (originating context for drag-drop feature request per
  a9f1071 §2).
- **Phase 6 retrospective** —
  `docs/07_governance/retrospectives/phase-6-retrospective.md`
  (Phase 6 close artifact at commit `9bace41`).
- **Phase 4 retrospective** —
  `docs/07_governance/retrospectives/phase-4-retrospective.md`
  (RI-1 / RI-6 / RI-7 / RI-10 codifications applied as
  discipline-reference inheritance at scope-lock cycle work
  per a9f1071 §7).
- **ChatTurn canonical type** —
  `apps/web/src/shared/types/chatTurn.ts` (per §A.8).
- **Migration 121 (agent_sessions.turns JSONB)** —
  `supabase/migrations/20240121000000_agent_sessions_turns.sql`
  (per §A.7).

## §D — Handoff note

Class A evidence in §A is durable substrate-state confirmation
against disk at HEAD = `ed9820f`. v2 scope-lock cycle's Round
1 verify-from-disk pass can reuse §A directly without re-
dispatching the same reads (substrate state has not changed
between Session A close and Session 1 open per single-commit-
ahead-of-main baseline). Specifically reusable: §A.5 F-J-θ
precedent grain confirmation; §A.6 AGENT panel substrate
ownership inventory; §A.7 chat-message substrate shape (load-
bearing IF v2 surfaces any Flow (b)-adjacent scope element);
§A.10 DocumentIntakeRail current state. §A.3 phase_plan.md
staleness observation persists as docs-hygiene candidate
independent of v2 cycle scope.

Class B framing-locks in §B are historical record only.
Several entries carry DURABLE annotations on meta-process
patterns (Lock 1 scope-lock-cycle closure shape per §B.7;
(A1) post-close-extension discipline per §B.5; positive-shape
sibling pattern N=1 observation per §B.4); these meta-process
inheritances apply at v2 fresh cycle unless v2 substantive
scope surfaces contrary evidence. All other §B entries are
SUPERSEDED at v1 scope grain per v2 Cut 1.

Next operational action (per founder direction): v3 proposal
amendment, then Session 1 (v2 scope-lock-input artifact
drafting + supersession header amendment to a9f1071). Session
A closes terminally at this preservation closeout commit.
