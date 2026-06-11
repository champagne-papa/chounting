> **STATUS — SUPERSEDED 2026-05-16**
>
> This a9f1071 scope-input artifact is superseded by the v2
> scope-lock-input artifact at:
> `docs/09_briefs/phase-6/2026-05-16-document-drop-and-shell-consolidation-scope-lock-input.md`
>
> v2 reframes the original scope per CTO sign-off on the v3
> proposal (`docs/09_briefs/phase-6/2026-05-16-cto-proposal-v3-document-drop-shell-consolidation.md`):
>
> - Flow (a) substrate exclusively at v1; Flow (b) deferred
>   past v1 (Sub-Q2 / Sub-Q3 / Sub-Q5 dissolve)
> - Shell consolidation reframe: four-zone → three-zone with
>   Claude.ai-inspired workspace-as-module navigation + limited
>   multi-tab canvas
> - Cross-phase scope at Phase 6.5 amendment cycle grain per
>   Phase 2.5 precedent
>
> Session A (drag-drop scope-lock cycle Rounds 0-3 against this
> artifact) closeout shipped at commit 7834a26 with preserved-
> evidence artifact at:
> `docs/09_briefs/phase-6/2026-05-16-session-a-preserved-evidence.md`
>
> This a9f1071 document preserved as historical record per
> ADR-0022 §2 supersession discipline. All content below this
> header is unchanged.

# Agent-Conversation Document-Drop — scope-lock-input artifact

**Date**: 2026-05-15
**Originating context**: Phase 6 chunk-6.3a screenshot gate review;
feature request surfaced post-ratification, pre-commit at chunk-6.3a
chunk-close
**Status**: Scope-lock-input; pending fresh scope-lock cycle after
Phase 6 closes (chunk 6.3b retrospective consolidation + merge-to-main)
**Partial-information warning**: Q1 phase assignment recommendation
operates on partial information; verify-from-disk required at
scope-lock cycle onset (see §6 below)

## 1. Feature request — summary

Add drag-and-drop affordance to the AGENT panel's "Type a message…"
chat input. User can drop PDFs, PNGs, JPEGs, TIFFs onto the chat
input. Two flows are user-selectable at drop time:

- **Flow (a) — Pure-ingestion**: drop creates ingest_batch +
  DocumentCases + DocumentJobs identical to current Phase 6 chunk-6.3a
  ingestion path. No chat message created. Agent context incidental.
  This is the existing ingestion path with a new entry-point UI
  affordance.

- **Flow (b) — Agent-message-with-attachments**: drop creates a chat
  message with the PDFs attached as conversation context. Agent reads/
  processes them in conversation context (likely with conversational
  acknowledgment). Separate from ingestion path; or possibly integrated
  with ingestion path producing both an ingest_batch AND a referencing
  chat message.

- **Flow (c) — Hybrid (deferred)**: both ingestion AND chat-message
  with cross-reference. Out of scope at v1; future graduation if
  evidence forces.

User selects between Flow (a) and Flow (b) at drop time (UI selection
mechanism subject to scope-lock).

Existing INTAKE panel dropzone (DocumentIntakeRail's drop affordance)
is removed. AGENT panel chat-input becomes the sole document-entry
affordance. DocumentIntakeRail's idle_with_recent_cards + showing_batch
state machine + Recent vs Last drop section headers may stay as
*display-only* surface for already-ingested documents, or get removed
entirely (subject to scope-lock).

Conviction-triggers-AI-agent discipline applies: attachment does not
trigger AI agent immediately upon drop. Conviction-low cases trigger
AI agent invocation; conviction-high cases proceed without AI
invocation per existing ingestion conviction semantics (subject to
verify-from-disk against ADR-0014 §6 + §8 conviction thresholds + AI
fallback contract + ADR-0019 forthcoming calibration).

## 2. Originating context

Phase 6 chunk-6.3a (commit c612720, 2026-05-15) shipped "Forwarded
Mailbox Ingestion (Postmark Inbound)" — substrate + ingestion path +
forwarded_mailbox substrate + Postmark webhook + DocumentIntakeRail
UI work. Three screenshots ratified at screenshot gate:
- Shot 1: idle_with_recent_cards{cards: []} (zero-cards path)
- Shot 2: idle_with_recent_cards{cards: [Adobe_3445596117]} populated
- Shot 3: showing_batch{cards: [VICTOR + Apple + 604Company]} after
  multi-file drop

Feature request surfaced during screenshot gate review window
between screenshot ratification and chunk-6.3a chunk-close commit.
Adjudicated NOT to expand chunk-6.3a scope at that stage; chunk-6.3a
closed at c612720 with original brief scope intact. This artifact
captures the feature request for fresh scope-lock cycle that fires
after Phase 6 closes (chunk 6.3b retrospective consolidation +
merge-to-main).

## 3. Substantive scope characteristics

The feature is genuinely cross-phase. Three substrate surfaces:

(i) **Ingestion substrate (Phase 6 territory)**: drop creates
ingest_batch + DocumentCases + DocumentJobs identical to current
Phase 6 chunk-6.3a ingestion path. Flow (a) is exclusively
this. Flow (b) may or may not create ingestion substrate
depending on scope-lock cycle decision.

(ii) **Agent-conversation substrate (Phase 1 / Phase 1.x territory
plausibly)**: chat-message-with-attachments substrate that doesn't
currently exist. Flow (b) requires:
- chat-message-with-attachments substrate (relating chat_messages
  to source_documents or attached-binary substrate)
- agent-context-with-binary-attachments support (agent reads
  attached PDFs as conversation context)
- chat-message-with-attachments rendering (visual treatment of
  attached documents within a chat message)

(iii) **UI restructuring (DocumentIntakeRail removal + chat-input
drop affordance)**: AGENT panel's chat-input gets drag-and-drop;
INTAKE panel's dropzone is removed. DocumentIntakeRail's just-
shipped chunk-6.3a UI work (idle_with_recent_cards state machine
+ Recent/Last drop section headers + DocumentCard rendering) is
restructured: may stay as display-only surface, may be removed,
may migrate elsewhere. Subject to scope-lock.

Cross-phase substrate-modification at phase-cluster grain is
substantively novel. Chunk-2-Phase-4 first instantiated cross-phase
substrate-modification at chunk-grain (F-J-θ at chunk-2-Phase-4
brief modified chunk-1-Phase-2's CHECK + FK substrate). The new
feature operates at phase-cluster grain (Phase 6 ingestion + Phase 1
AGENT panel + cross-phase agent-context-with-attachments substrate
introduction).

## 4. Q1-Q4 founder-given answers (originating conversation)

**Q1 — Phase assignment.** Delegated back to scope-lock cycle
adjudication. Partial-information recommendation: see §5 below.

**Q2 — Flow shape.** Both Flow (a) pure-ingestion AND Flow (b)
agent-message-with-attachments. User selects at drop time. Flow (c)
hybrid deferred to post-v1 (or until evidence forces graduation).

**Q3 — Existing INTAKE panel dropzone.** Remove. AGENT panel
chat-input becomes sole document-entry affordance. DocumentIntakeRail
component's role restructured: scope-lock cycle adjudicates whether
display-only-surface or remove-entirely.

**Q4 — AI agent invocation discipline.** Same rules apply as
existing ingestion path: attachment does not trigger AI agent
immediately upon drop. Conviction-low cases trigger AI agent
invocation; conviction-high cases proceed without AI invocation.
Conviction semantics inherit from existing canonical sources
(ADR-0014 §6 per-document-type confidence thresholds + ADR-0014 §8
AI fallback contract + ADR-0019 forthcoming calibration). Verify-
from-disk at scope-lock cycle onset.

## 5. Partial-information Q1 recommendation (originating
brainstorming-side adjudication; verify-from-disk required)

Three candidate phase-assignments evaluated during originating
brainstorming:

**Candidate A — Phase 6 amendment cycle (chunk-6.4 or chunk-
6.amendment).** Phase 6 ingestion ownership is the substantive
entry point. Cross-phase substrate-modification framing per F-J-θ
chunk-2-Phase-4 precedent. Cross-phase aspect (Phase 1 AGENT panel
substrate) named in brief.

**Candidate B — Phase 5.1 amendments (parallel-candidate).** Phase
2 retrospective §6:588 framing parallel-candidate amendment cycle.
Pushback: feature isn't INV-DOC-001/paymentService amendment
territory; doesn't fit Phase 5.1 amendments shape.

**Candidate C — New cross-phase amendment cycle outside canonical
8-phase sequence.** CPA-N naming or feature-named-without-phase
convention. Pushback: doesn't fit existing naming conventions;
codification continuity preserved by using Phase 6's open chunk
sequence.

**Originating recommendation: Candidate A — Phase 6 chunk-6.4 with
cross-phase substrate-modification framing.** Three reasons:
- Phase 6 has open chunk sequence (no new naming convention
  required)
- Cross-phase substrate-modification is well-precedented
  (chunk-2-Phase-4 first instance)
- Phase 6's ingestion ownership is substantive entry point; AGENT
  panel substrate amendments are cross-phase modification surface

**Verify-from-disk required at scope-lock cycle onset against**:
- `docs/03_architecture/phase_plan.md` — canonical phase plan;
  verify Phase 1 / Phase 1.x AGENT panel scope ownership; verify
  chunk-6.4 sequencing
- AGENT panel substrate ownership (which phase owns chat input +
  chat_messages substrate; likely Phase 1 / Phase 1.x territory)
- Phase 1 / Phase 1.x retrospectives (if exist) — scope ownership
  for AGENT panel work
- F-J-θ at `docs/09_briefs/phase-4/chunks/2026-05-14-phase-4-chunk-2.md`
  — cross-phase substrate-modification first-instance precedent
- ADR-0014 §6 + §8 — conviction semantics + AI fallback contract
- ADR-0019 (forthcoming) — confidence calibration governance

Recommendation gets adjusted on evidence at scope-lock cycle Round 1
closure framing.

## 6. Open sub-questions for scope-lock cycle

Six sub-questions surface ahead of scope-lock cycle. Each requires
adjudication at appropriate round; sub-questions cluster by
scope-lock cycle dependencies.

### 6.1. Phase assignment (Round 1 candidate)

Per §5 partial-information recommendation. Round 1 verify-from-disk
ratifies or replaces Candidate A.

### 6.2. Flow (a) vs Flow (b) UI selection mechanism (Round 2-3
candidate)

User selects Flow (a) or Flow (b) at drop time. Candidate selection
mechanisms:

- **6.2.α — Modifier key**: drop with Shift held = Flow (b);
  drop without modifier = Flow (a). Pros: minimal UI surface; lets
  drop be primary action. Cons: discoverability low; keyboard-
  required interaction.

- **6.2.β — Two visually distinct drop zones**: one for Flow (a)
  (ingestion), one for Flow (b) (chat-message-with-attachments).
  Pros: discoverable; explicit. Cons: more UI surface; user has to
  pick before dropping.

- **6.2.γ — Pre-drop selection toggle**: a toggle UI element on
  the chat input that switches the drop semantic. Pros: minimal
  surface; explicit. Cons: state-machine complexity; multi-step
  interaction.

- **6.2.δ — Post-drop disambiguation**: drop fires; modal/dropdown
  asks "Send as message attachment? Or ingest as document?" before
  proceeding. Pros: clear; explicit. Cons: every drop has confirmation
  friction.

- **6.2.ε — Default-with-override**: drops default to Flow (a); a
  visible affordance lets user switch the just-dropped batch to Flow
  (b). Pros: low friction common case; explicit override. Cons: state-
  machine complexity for revert.

### 6.3. Flow (b) chat-message-with-attachments substrate shape
(Round 3-4 candidate)

Flow (b) requires chat-message-with-attachments substrate that
doesn't currently exist. Sub-shapes:

- **6.3.α — Native attachment column**: chat_messages table gains
  an attachments JSONB column or attachments table with FK to
  source_documents. Pros: simple; explicit. Cons: schema modification;
  cross-table consistency.

- **6.3.β — Reference via document_cases**: attachment is a
  document_case + chat_message references the document_case_id.
  Pros: reuses Phase 2 substrate; no new schema. Cons: semantic
  conflation (attachments and cases are different concepts).

- **6.3.γ — Standalone attachments table**: new table
  chat_message_attachments (or similar) referencing chat_messages
  + source_documents. Pros: clean separation. Cons: new table; new
  migration; substrate substrate-now-enforcement-later considerations.

### 6.4. DocumentIntakeRail restructuring (Round 4-5 candidate)

Q3 confirms removal of INTAKE panel dropzone. Two sub-shapes for
DocumentIntakeRail component:

- **6.4.α — Display-only**: DocumentIntakeRail keeps idle_with_recent_cards
  state machine + Recent + Last drop section headers + DocumentCard
  rendering as display-only surface. Drop affordance removed. Sub-Q1
  server-only-affordance-kind constraint preserved at display grain.
  Card-rendering surface lives in DocumentIntakeRail.

- **6.4.β — Remove entirely**: DocumentIntakeRail component
  removed; card rendering surface migrates elsewhere (canvas-level
  document card list? AGENT panel inline?). Subject to scope-lock.

If 6.4.β: where does card-rendering surface live? Subject to additional
sub-question.

### 6.5. Conviction-discipline application (Round 4-5 candidate)

Q4 conviction-triggers-AI-agent discipline applies. Two sub-shapes:

- **6.5.α — Per-flow conviction check**: Flow (a) follows existing
  Phase 6 ingestion conviction semantics (state='received'; AI
  invocation downstream at Phase 7 substrate). Flow (b) applies
  conviction check at chat-message creation time; conviction-low
  fires AI agent invocation immediately; conviction-high creates
  chat-message-with-attachments without AI invocation.

- **6.5.β — Unified conviction check**: both flows apply identical
  conviction check at drop time before flow-specific substrate
  writes. Conviction-low fires AI agent regardless of flow selection;
  conviction-high proceeds with selected flow.

Conviction substrate (per-document-type confidence thresholds +
AI-fallback contract) verify-from-disk against ADR-0014 §6 + §8 +
ADR-0019 (forthcoming) at Round 1 closure framing.

### 6.6. Naming + governance-trail (Round 6-7 candidate)

If §5 Candidate A locks (Phase 6 chunk-6.4), chunk-grain naming
inherits Phase 6 chunk-N sequencing. If Candidate B or C lock,
naming convention scope-lock adjudicates.

Cross-phase substrate-modification framing requires brief-level
documentation of:
- Phase 1 / Phase 1.x AGENT panel substrate modifications
- Phase 6 ingestion-path entry-point modifications
- DocumentIntakeRail component restructuring scope
- Conviction discipline application scope

Brief drafting at chunk-grain documents the cross-phase substrate
modifications per chunk-2-Phase-4 F-J-θ precedent.

## 7. Inheritance from Phase 4 codifications

Phase 4 codifications apply at scope-lock cycle work. The feature's
substantive scope-lock work is at-or-near chunk-3-Phase-4 grain
(N≥4 framings emerging at scope-lock per RI-10 amendment threshold
candidate; cross-phase substrate-modification framing; multi-round
scope-lock cycle).

- **RI-1 — Consumer-presence verification**: every substrate
  addition (chat-message-with-attachments substrate; DocumentIntakeRail
  restructuring; conviction-check substrate) needs named v1 consumer.
  Forward-application discipline applies at scope-lock cycle.

- **RI-6 — Read-substrate verification at scope-lock (four grains;
  possibly five per Sub-Q10 Grain 5 firing at chunk-6.3a)**: substrate-
  shape + per-trigger semantic-coverage + per-trigger × per-decision-
  outcome conformance + idempotency-and-side-effect-contract conformance
  + (possibly) UI-consumer-contract conformance. All grains apply at
  scope-lock cycle work.

- **RI-7 — Session-budget-feasibility verification**: scope-lock
  cycle volume estimation at Round 1 + at each round transition.
  Multi-round scope-lock cycle plausibly 6-10 rounds (substrate
  decomposition + flow-shape adjudication + UI restructuring +
  conviction-discipline application + cross-phase modification
  framing + chunk decomposition). Path-C-equivalent at scope-lock
  cycle stays evidence-forced.

- **RI-10 — Brief amendment cycle threshold + framing-interaction-
  tracing**: brief amendment fires at N≥3 framings emerging during
  scope-lock cycle. N≥4 framings plausibly surface; brief amendment
  cycle likely fires. Framing-interaction-tracing sub-discipline
  applied to cross-flow + cross-phase + cross-substrate interactions.

## 8. Operational sequencing context

This artifact lands in the governance trail at chunk-6.3a close +
pre-Phase-6-retrospective. Operational sequencing per the originating
recommendation:

1. ✓ Phase 6 chunk-6.3a chunk-close commit (c612720; 2026-05-15)
2. **This artifact captured** (current step) as scope-lock-input for
   fresh scope-lock cycle
3. **Phase 6 chunk 6.3b** (Phase 6 retrospective consolidation +
   merge-to-main) fires in fresh conversation as next session work
4. **Drag-drop-to-chat-input scope-lock cycle** fires in fresh
   conversation AFTER Phase 6 closes. Session-onset reads this
   artifact as authoritative substrate.
5. **Brief drafting + chunk implementation** downstream of scope-lock
   cycle close

## 9. Cross-references

- `docs/07_governance/retrospectives/phase-4-retrospective.md` —
  RI-1 / RI-6 / RI-7 / RI-10 codifications applied as discipline-
  reference inheritance at scope-lock cycle
- `docs/07_governance/friction-journal.md` 2026-05-14 entry —
  codify-while-deciding-not-while-implementing meta-discipline +
  three applied-discipline instances; applies reflexively to
  scope-lock cycle work
- `docs/07_governance/friction-journal.md` 2026-05-15 entry — drift-
  fix entry; partial-information-recommendation drift discipline
  applies to §5 partial-information recommendation
- `docs/09_briefs/phase-4/chunks/2026-05-14-phase-4-chunk-2.md` —
  F-J-θ first-instance cross-phase substrate-modification precedent
- `docs/09_briefs/phase-6/chunks/2026-05-15-phase-6-chunk-3a.md` —
  chunk-6.3a brief (commit 9fc831a); originating context for feature
  request surfacing
- `CLAUDE.md` § "Verify-forward-at-scope-lock for computational-shape
  chunks" — T4 codifications applied at scope-lock cycle work
- `docs/07_governance/adr/0014-tier-2-document-pipeline.md` §6 + §8
  — conviction semantics + AI fallback contract; verify-from-disk
  source for Q4 conviction discipline application
- ADR-0019 (forthcoming) — confidence calibration governance;
  verify-from-disk source for Q4 once ratified
