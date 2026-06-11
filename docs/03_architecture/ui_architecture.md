# UI Architecture — The Bridge

The Bridge UI is a persistent split-screen layout: AI agent chat on
the left, a live Contextual Canvas on the right, with a Mainframe
icon rail for direct navigation. This document covers the shell
structure, the canvas directive contract, component shapes, routing,
and the reversal UI flow.

Source: extracted from PLAN.md §4a-§4f and §4h during Phase 1.1
closeout restructure. Canvas context injection (§4g) is a Phase 1.2
concern and lives in
`docs/09_briefs/phase-1.2/canvas_context_injection.md`.

---

## The Split-Screen Layout

> **Amended 2026-05-16 by Phase 6.5 amendment cycle.** Original
> four-zone description (Left Panel — Agent Chat + Right Panel
> — Contextual Canvas + Top Nav + Mainframe rail) preserved in
> § "Shell architecture history (pre-Phase-6.5)" at end of
> document per ADR-0022 §2 supersession discipline. Cross-
> reference: cycle closeout brief at
> `docs/09_briefs/phase-6.5/2026-05-16-document-drop-and-shell-consolidation-scope-lock-cycle-close.md`.

Three zones. The split-screen shell shipped as four-zone at Phase
1.1; consolidated to three-zone at Phase 6.5 amendment cycle
(cycle closeout 2026-05-16) per Cuts 4-8. Canvas views are added
per phase.

1. **Zone 1 — Consolidated Left Panel** (~280-320px expanded;
   ~64px collapsed to rail-mode per Cut 7; collapsibility
   triggered via keyboard shortcut + button per Sub-Q8.a;
   localStorage persistence per Sub-Q8.c.α₁). Four regions per
   Sub-Q7 cycle leans:
   - Region 7.1 — Workspace tabs (vertical sidebar list per
     Sub-Q7.1.b.β; v1-active Billing | Reports per Sub-Q7.1.a
     7.1.α two parallel; v2+ candidates Tax / Banking / Payroll)
   - Region 7.2 — Workspace-scoped navigation items (Billing
     9-item list / Reports 3-item list per Sub-Q7.2.a; "New
     Bill" as primary action button per refinement; account
     drill-down stays under CoA)
   - Region 7.3 — Persistent foundational footer (4 items per
     Sub-Q7.3.β: Chart of Accounts + Journal Entries +
     Recurring Journals + AI Action Review; cross-workspace)
   - Region 7.4 — Chat history surface (hidden at v1 with
     structural reservation per Sub-Q7.4.α′; activates post-v1
     multi-session chat substrate per ADR-0010)

2. **Zone 2 — Agent Chat Panel** (~380px expanded; collapsible
   to ~40-48px rail-mode with new-output badge per Sub-Q8.b
   Zone 2; collapsibility wiring inherits existing
   AgentChatPanel `onCollapse` Prop). Conversation history;
   message input with drag-drop + paste + "+" button
   affordances per Phase 6.5 chunk 3 (Sub-Q9.a.β staged-with-
   explicit-ingest); persona-specific suggested prompts on
   empty state; agent messages may contain inline
   ProposedEntryCards with Approve / Reject buttons.

3. **Zone 3 — Contextual Canvas** (fills remaining width).
   Renders the active tab's directive content. **Multi-tab
   structure per Phase 6.5 chunk 2 Cut 9 (Path 2 limited at
   v1)**: canvas holds N tabs each with its own directive +
   per-tab navigation history (back/forward arrows per active
   tab; tab strip at top of canvas area per Sub-Q11.c.α);
   Pattern γ source-driven routing (drop event → new tab; agent
   canvas_directive → new tab or focus-existing per EC2.β;
   Zone 1 navigation → replace active tab per EC1.β prompt
   if dirty; in-canvas drill-down → stays in active tab).

**Top Nav** (unchanged from pre-Phase-6.5). Org switcher
(role-aware — AP specialist sees assigned orgs only, CFO sees
all + consolidated), global search stub, notification bell
(count of pending AI actions), user menu.

**Mainframe-constraint successor (post-Phase-6.5):** No canvas
component is allowed to require the agent to function. Every
canvas view (Chart of Accounts, Journal Entry form, Journal
list, basic P&L, AI Action Review, PendingDocumentsView per
chunk 3, etc.) must work fully when accessed directly via Zone
1 navigation items. The agent is a composer that can also load
these views; the views themselves are standalone. The
Mainframe rail (pre-Phase-6.5 fallback navigation surface) is
removed at Phase 6.5 chunk 1; its semantic role transfers to
Zone 1's Region 7.2 + 7.3 navigation surfaces.

---

## The `canvas_directive` Contract (Agent-to-UI Protocol)

> **Amended 2026-05-16 by Phase 6.5 amendment cycle.** Phase
> 6.5 chunk 2 introduces multi-tab structure at canvas level
> (Cut 9 Path 2 limited at v1). The `canvas_directive` contract
> preserves its singleton shape at TYPE level (per Sub-Q18.α
> active-tab binding); the canvas itself holds N tabs each
> with its own directive + per-tab navigation history (per
> Sub-Q11.b.α state lift into SplitScreenLayout). canvasContext
> reads the active tab's directive + selectedEntity;
> orchestrator prompt-suffix unchanged. Cross-reference: cycle
> closeout brief at
> `docs/09_briefs/phase-6.5/2026-05-16-document-drop-and-shell-consolidation-scope-lock-cycle-close.md`.

The most important interface in The Bridge. Defined as a TypeScript
discriminated union in `src/shared/types/canvasDirective.ts`. Every
agent tool response (and every API route response that affects what
the canvas should show) includes a `canvas_directive`. The frontend
reads the directive and renders the appropriate canvas component.
**The agent never produces HTML. It produces structured data. The UI
renders it.**

```typescript
// src/shared/types/canvasDirective.ts

import type { ProposedEntryCard } from '@/shared/types/proposedEntryCard';
import type { PostJournalEntryInput } from '@/shared/schemas/accounting/journalEntry.schema';

export type CanvasDirective =
  // Phase 1.1 — built fully:
  | { type: 'chart_of_accounts'; orgId: string; }
  | { type: 'journal_entry'; entryId: string; mode: 'view' | 'edit'; }
  | { type: 'journal_entry_form'; orgId: string; prefill?: Partial<PostJournalEntryInput>; }
  | { type: 'journal_entry_list'; orgId: string; }
  | { type: 'proposed_entry_card'; card: ProposedEntryCard; }
  | { type: 'ai_action_review_queue'; orgId: string; }
  | { type: 'report_pl'; orgId: string; from: string; to: string; }
  | { type: 'none'; }  // agent responded with text only, no canvas update

  // Phase 2+ stubs — directive type defined now, canvas component is a
  // "Coming Soon" placeholder until the phase that builds it:
  | { type: 'ap_queue'; orgId: string; }
  | { type: 'vendor_detail'; vendorId: string; orgId: string; }
  | { type: 'bank_reconciliation'; accountId: string; }
  | { type: 'ar_aging'; orgId: string; }
  | { type: 'consolidated_dashboard'; }
  ;
```

The canvas renderer switches on `directive.type` and renders the
matching component or a "Coming Soon" placeholder for Phase 2+ types.
New tools added in later phases must add their directive type here
first.

**Bidirectional state — stub in Phase 1, implement in Phase 2.** When
the user interacts with the canvas (clicks a P&L line, selects a
vendor), that action should eventually be communicated back to the
agent as context. In Phase 1, this is a commented interface in
`AgentSession`. Phase 1.2 introduces a minimal version — see
`docs/09_briefs/phase-1.2/canvas_context_injection.md`. Phase 2
implements the full bidirectional UX.

---

## The Proposed Entry Card — Data Shape

Every AI-initiated mutation surfaces this card before anything is
written. The TypeScript type is inferred from the Zod schema.

The UI renders this as a card with: **Approve** button (primary),
**Reject** button with optional free-text reason, and an **"Edit
before approving"** link that fires a `journal_entry_form` canvas
directive with the data pre-filled.

**Important Phase 1 constraint:** `confidence` and `routing_path`
are **display only** in Phase 1. The card shows them, but they do not
influence which queue the entry goes to or who must approve it.
Routing logic (where medium-confidence entries require controller
approval and novel patterns escalate to CFO) is Phase 2. The fields
exist on the type now (Category A reservation) so the Phase 2 wiring
is mechanical.

**Reasoning text is a structured template, not free prose.** The UI
builds the localized "why I made this choice" string from a template
ID and parameters returned by the agent — never from raw English
from Claude. This is what makes i18n possible without retranslating
every agent response.

---

## Canvas Phasing Table

| Canvas Feature | Phase 1.1 | Phase 1.2 | Phase 2 | Phase 3 |
|---|---|---|---|---|
| Split-screen layout (chat + canvas + Mainframe) | Build | | | |
| Canvas navigation history (back/forward) | Build | | | |
| Chart of Accounts canvas view | Build | | | |
| Manual Journal Entry form in canvas | Build | | | |
| Journal Entry list canvas view | Build | | | |
| Basic P&L canvas view (read-only) | Build | | | |
| AI Action Review queue (controller) | Build (empty in 1.1, populated in 1.2) | | | |
| Suggested prompts on empty state | | Build (static, persona-aware) | | |
| ProposedEntryCard component | | Build | | |
| Agent transparency ("What I did") | | Build (collapsed disclosure) | | |
| Canvas context injection (minimal) | | Build | | |
| Canvas tabs (multiple views open) | Stub interface only | | Build | |
| Bidirectional canvas-agent state (full) | Stub interface only | | Build | |
| Contextual action bar on hover | | | Build | |
| AP Queue canvas view | | | Build | |
| Bank reconciliation canvas view | Stub (placeholder) | | Build | |
| Consolidated dashboard canvas view | Stub (placeholder) | | | Build |
| Mobile responsive layout | Defer | | | Build |
| Multi-pane comparison view | Defer | | | Build |

"Stub interface only" means: the TypeScript interface and the canvas
directive type exist; the renderer shows "Coming Soon" for that type.
Phase 2 fills in the implementation. Phase 2 is an extension, not a
rewrite.

> **Amended 2026-05-16 by Phase 6.5 amendment cycle.** Three
> rows have Phase 6.5 implications:
>
> - **"Split-screen layout (chat + canvas + Mainframe)"** —
>   The "(chat + canvas + Mainframe)" four-zone parenthetical
>   superseded by three-zone consolidation per Cuts 4-8 at
>   Phase 6.5 chunk 1. See § The Split-Screen Layout above.
> - **"Canvas navigation history (back/forward)"** — Phase
>   1.1 shipped single canvas navigation history stack; Phase
>   6.5 chunk 2 (Sub-Q11.b.α state lift) makes navigation
>   history per-tab. Each tab carries its own back/forward
>   history.
> - **"Canvas tabs (multiple views open)"** — table reads
>   "Phase 1.1 Stub interface only + Phase 2 Build." Phase 6.5
>   chunk 2 (Cut 9 Path 2 limited at v1) IS the multi-tab
>   build, fired before Phase 7. Phase 2 column reading is
>   superseded.
>
> Cross-reference: cycle closeout brief at
> `docs/09_briefs/phase-6.5/2026-05-16-document-drop-and-shell-consolidation-scope-lock-cycle-close.md`.

---

## Suggested Prompts (Empty State)

Phase 1.2 implements a basic version with static arrays per role.
Phase 2 makes it data-driven (context-aware: if today is the 1st of
the month, a controller sees close-related suggestions).

- **AP Specialist:** *(Phase 2+)* "Process today's incoming bills" /
  "Show me the AP queue" / "Find bills missing a GL code"
- **Controller:** "Review pending AI actions" / "Show me last month's
  P&L" / "Make a journal entry"
- **Executive:** "Show consolidated cash position" / "What's my
  runway if revenue drops 20%?" *(Most CFO prompts return placeholder
  responses in Phase 1; the suggested prompts exist for UI shape
  only.)*

---

## Traditional UI Screens Required in Phase 1

Both the agent path and the manual path are first-class. Every canvas
view must also be reachable via the Mainframe — not only by asking
the agent.

| Route | Phase | Notes |
|---|---|---|
| `/[locale]/sign-in` | 1.1 | Supabase Auth |
| `/[locale]/[orgId]/accounting/chart-of-accounts` | 1.1 | CoA list and detail |
| `/[locale]/[orgId]/accounting/journals` | 1.1 | Journal entry list |
| `/[locale]/[orgId]/accounting/journals/new` | 1.1 | Manual journal entry form |
| `/[locale]/[orgId]/accounting/journals/[entryId]` | 1.1 | Journal entry detail |
| `/[locale]/[orgId]/agent/actions` | 1.2 | AI Action Review queue |
| `/[locale]/[orgId]/reports/pl` | 1.1 | Basic P&L (read-only) |
| `/[locale]/consolidated/dashboard` | Stub in 1.1 | Role-gated |
| `/[locale]/[orgId]/` | 1.2 | Post-auth main-app destination (Session 5 `resolveSignInDestination` + master §14.5). Replaces the old `/admin/orgs` claim in this table. |
| `/[locale]/settings/profile` | 1.2 | User profile editor (Session 6 §12.1 form-escape) |
| `/[locale]/[orgId]/settings/org` | 1.2 | Org profile editor, controller-only (Session 6 §12.2) |
| `/[locale]/invitations/accept` | 1.2 | Invitation accept page, 5-state branching (Session 6 §12.5) |

> `/[locale]/admin/orgs/` still exists as a Phase 1.1 historical
> directory (see `src/app/[locale]/admin/orgs/`). It is no longer
> the post-auth destination; the routing-table row above reflects
> the landed behavior. The legacy directory is left in place — code
> removal is out of Session 6 scope.

---

## Reversal UI (Phase 1.1)

The `journal_entries` table is append-only by RLS: `FOR UPDATE USING
(false)` and `FOR DELETE USING (false)`. Corrections are made via
reversal entries, which is IFRS-correct. Phase 1.1 ships a manual
reversal flow because the moment a real user posts a wrong entry in
Phase 1.3, reversal is the only legal correction path.

**Launch point.** The journal entry detail canvas view
(`/[locale]/[orgId]/accounting/journals/[entryId]`) has a "Reverse
this entry" button, visible to users whose role permits posting to
the entry's org (controller and ap_specialist). The Executive persona
cannot reverse entries, same as it cannot post them.

**Prefill.** Clicking the button launches a `journal_entry_form`
canvas directive with prefill data that:

- Copies every line from the original entry, swapping `debit_amount`
  and `credit_amount` per line. `amount_original`, `amount_cad`,
  `currency`, `fx_rate`, and `tax_code_id` are unchanged — only
  which side they appear on flips.
- Populates `reverses_journal_entry_id` with the original entry's ID.
- Auto-assigns `fiscal_period_id` to the **current open period for
  the entry's org**, which may or may not be the original entry's
  period.
- Sets `description` to `"Reversal of #{original.reference ??
  original.journal_entry_id}"` as a starting point. The user is
  expected to edit this and add the `reversal_reason`.

**Period gap banner — mandatory.** When the auto-assigned reversal
period differs from the original entry's period, the reversal form
surfaces an inline banner at the top of the canvas, in the form's
header zone, with this shape:

> **You are reversing a {original_period_name} entry into
> {current_period_name}.** The reversal will appear in
> **{current_period_name}**, not in the original period, because
> {original_period_name} is closed. Verify this is the behaviour you
> want before posting.

Banner rules:

- Visible by default. Cannot be dismissed. Disappears only when the
  user manually changes `fiscal_period_id` (if another period is
  open) or when the original and reversal periods are the same.
- Restates both period names by their human label (e.g., "March 2026"
  and "April 2026"), not by UUID.
- Styled as a warning, not an error — the action is legal. The
  banner exists because a user reversing a March entry from April
  needs to understand the reversal posts to April, not back into
  March. Without this surfacing, P&L anomalies appear in the wrong
  month and the user spends an afternoon finding out why.

**Reversal reason field — mandatory.** The reversal form adds one
required field that original journal entries do not have:
`reversal_reason` (text, multiline). This is the story of *why* the
reversal is being posted — "vendor misclassified," "duplicate of
entry #12345," "wrong amount, FX rate corrected." The DB CHECK
constraint enforces non-empty `reversal_reason` whenever
`reverses_journal_entry_id` is populated — three layers of
protection (form, service, database). An auditor asking "why was
this posted?" must always get an answer.

**Service-layer enforcement.** The service layer verifies the mirror
before the transaction begins — see
`docs/02_specs/ledger_truth_model.md` INV-REVERSAL-001 for the full
procedure. The UI is the ergonomic surface; the service layer is what
prevents a tampered reversal form from posting a non-mirror.

**Explicitly deferred to Phase 2:**

- **Partial reversals** — reversing only some lines of a multi-line
  entry. The Phase 1.1 mirror check assumes full mirror and the UI
  offers no partial-selection affordance.
- **Reversal-of-reversal UI affordances.** Phase 1.1 permits
  reversing a reversal (the schema allows it), but the UI does not
  visualize the chain. Phase 2 adds a reversal-chain view.
- **Automatic period-end reversals** (the accrual accounting pattern
  where an accrual posted on the last day of a period is
  auto-reversed on the first day of the next period). Phase 2
  introduces the schedule.

**Agent integration (Phase 1.2).** Phase 1.2 adds a
`reverseJournalEntry` agent tool that wraps the same
`journalEntryService.post` call with `reverses_journal_entry_id`
pre-populated from conversation context. The Phase 1.1 deliverable
is the manual form path only.

---

## Canvas ↔ Chat State Model

The canvas and chat panels maintain **separate state timelines**.
The canvas has a navigation history stack (back/forward); the
chat has a conversation transcript. The two are connected by
context injection, not by shared history.

**Inbound (canvas → chat).** The existing brief
`docs/09_briefs/phase-1.2/canvas_context_injection.md` specifies
the inbound half: canvas state is injected into the system prompt
as subordinate context every turn. The subordinate-framing rule
and the over-anchoring test are specified there; this section
does not restate them.

**Outbound (chat → canvas).** When an agent response or a palette
action produces a new `CanvasDirective`, the following rules
apply:

1. The directive is pushed onto the **canvas navigation history
   stack**, not the chat transcript. The canvas back button
   navigates this stack.
2. The chat transcript remains a **pure conversation log**.
   Navigation events are not recorded as chat turns. A user
   scrolling back through chat history sees messages, not page
   transitions.
3. When chat pushes a canvas change, the chat message renders an
   **inline bookmark pill** (e.g., "↗ AWS spend detail") so the
   user can re-trigger that view later. The pill is a
   convenience — it fires the same `CanvasDirective` again,
   pushing a new entry onto the canvas stack.
4. The canvas back button **never** navigates the chat
   transcript. A user who navigates canvas-back from view C to
   view B sees their chat history unchanged — the conversation
   is still at the same scroll position, with the same messages
   visible.

**The separation rule.** Chat is the conversation. Canvas is the
workspace. They share context (via injection) but they do not
share history. This prevents the disorienting behavior where
"going back" in the canvas un-says something the agent said.

### Amendment 2026-05-16 (Phase 6.5 amendment cycle) — multi-tab canvas

Phase 6.5 chunk 2 introduces multi-tab canvas (Cut 9 Path 2
limited at v1). Two substrate changes affect this section's
rules:

1. **Canvas navigation history is per-tab, not single-stack.**
   The "canvas navigation history stack (back/forward)"
   referenced in the section opener is one stack per tab at v1.
   Sub-Q11.b.α state lift moves tab data model
   (`Array<{tabId, directive, selectedEntity, history,
   historyIndex}> + activeTabId`) into SplitScreenLayout.
   ContextualCanvas becomes pure render-from-Props for active
   tab. The separation rule (chat ≠ canvas history) is
   preserved per-tab; each tab's canvas-back navigates only
   that tab's stack.

2. **Bookmark pill rule (Outbound rule #3) follows Pattern γ
   source-driven routing.** Original rule: pill "fires the
   same `CanvasDirective` again, pushing a new entry onto the
   canvas stack." Phase 6.5 amendment: pill firing follows
   Pattern γ — agent-emitted canvas_directive opens a new tab
   (per Sub-Q11.a Pattern γ) OR focuses an existing tab on
   exact directive + selectedEntity match (per EC2.β). The
   pill remains a convenience affordance; its effect at multi-
   tab grain is "open or focus a tab for this directive," not
   "push onto the active tab's history stack."

Outbound rules #1, #2, #4 unchanged (the directive still does
not navigate the chat transcript; chat history remains a pure
conversation log; canvas back never navigates chat). The
separation rule unchanged.

Cross-reference: cycle closeout brief at
`docs/09_briefs/phase-6.5/2026-05-16-document-drop-and-shell-consolidation-scope-lock-cycle-close.md`.

---

## The Three-Path Entry Model

Every user action that produces work for the system enters through
one of three paths. All three converge on `Intent` objects (see
`docs/02_specs/intent_model.md`). No path has bespoke routing.

### Path 1: Zone 1 (post-Phase-6.5)

> **Amended 2026-05-16 by Phase 6.5 amendment cycle.** Original
> Path 1 Mainframe description (collapsed icon rail on the far
> left) preserved in § "Shell architecture history (pre-Phase-
> 6.5)" at end of document per ADR-0022 §2 supersession
> discipline.

Zone 1 — Consolidated Left Panel — per Phase 6.5 chunk 1 (Cut 4
three-zone consolidation). Workspace tabs (vertical sidebar list
per Sub-Q7.1.b.β; v1-active Billing | Reports) + workspace-
scoped navigation items per workspace (Region 7.2) + persistent
foundational footer (Region 7.3 — CoA + Journal Entries +
Recurring Journals + AI Action Review) + chat history surface
(Region 7.4 — hidden at v1 with structural reservation).
Produces **Navigation intents only** — Zone 1 is a navigation
surface, not a mutation surface. Every Zone 1 navigation click
fires a `CanvasDirective` that replaces the active tab's
directive per Cut 9 Pattern γ source-driven routing (with
EC1.β always-prompt-on-replace if active tab is dirty).

Cross-reference: cycle closeout brief at
`docs/09_briefs/phase-6.5/2026-05-16-document-drop-and-shell-consolidation-scope-lock-cycle-close.md`.

### Path 2: Chat

The AI agent panel. The user types a natural-language message;
the agent interprets it and produces **any of the three intent
types**: navigation ("show me the CoA"), mutation ("post this
journal entry"), or query ("what's my cash position?"). Chat is
the most expressive path — it can do anything the other two can,
plus handle ambiguity.

> **Amended 2026-05-16 by Phase 6.5 amendment cycle.** Phase
> 6.5 chunk 3 adds drag-drop + paste + "+" button affordances
> to AgentChatPanel — users can drop documents directly into
> chat input as staged attachments (per Sub-Q9.a.β staged-with-
> explicit-ingest; tray above input per Sub-Q9.b.α); unified
> Send fires both ingest + chat message per Sub-Q9.c.α; canvas
> tab opens with PendingDocumentsView on ingest completion per
> Sub-Q11 Cut 9 Pattern γ source-driven routing. Document drop
> at Path 2 is the v1 ingestion entry-point per Cut 1 (Flow (a)
> substrate exclusively at v1); Flow (b) chat-message-with-
> attachments substrate deferred past v1. Cross-reference:
> cycle closeout brief at
> `docs/09_briefs/phase-6.5/2026-05-16-document-drop-and-shell-consolidation-scope-lock-cycle-close.md`.

### Path 3: Command Palette

A keyboard-invoked overlay (Cmd+K / Ctrl+K). Three sub-layers:

- **Navigation sub-layer:** fuzzy-match canvas targets.
  "Chart of Accounts" → navigation intent.
- **Action sub-layer:** scoped mutation commands.
  "New journal entry" → mutation intent with form pre-fill.
- **Query sub-layer:** quick lookups.
  "AWS spend Q4" → query intent with transient result.

The palette routes based on prefix/context — it does not call the
LLM for every keystroke. Simple navigation and action commands
are handled by a deterministic prefix router; only genuinely
ambiguous inputs fall through to the agent.

### The No-Modes Rule

No basic-vs-advanced toggle. No "simple mode" vs "power mode."
Features appear when they are needed (progressive revelation
through use). A user who has never used the palette discovers it
through a keyboard shortcut hint; a user who has never used bulk
operations sees the multi-select affordance only when they select
a second row. Mode-switching software dies — the single UI
adapts to the user's behavior.

---

## Confirmation-First Mutation as UI Contract

Every mutation path — agent-initiated or manual, one-off or bulk,
form submission or chat-originated — flows through a confirmation
surface before any ledger write. The confirmation surface uses
the Four Questions grammar from
`docs/02_specs/intent_model.md` §5:

1. What changed?
2. Why?
3. Track record?
4. What if I reject?

This contract applies to:

- ProposedEntryCard (agent-proposed journal entries)
- Manual journal entry form submission
- Bulk approve dialog (multiple mutations approved at once)
- Reversal form submission
- Period close confirmation
- Promotion ceremonies (agent rule promotion)
- Limit change confirmation (controller proposes, owner approves)

No mutation surface is exempt. The Four Questions grammar is a
product-wide UI contract, not a component decision.

---

## Agent Voice Standard

The agent is unnamed (Q25 default in
`docs/02_specs/open_questions.md`). UI copy refers to "the agent"
or, when persona context matters, "your bookkeeper-style agent."
No proper name. No personality flourishes.

**Voice principles:**

- **Neutral and professional.** Tone closer to a senior
  bookkeeper answering a question than to an assistant trying
  to be helpful.
- **Understated.** The agent does not celebrate its own actions
  ("Great news! I posted the entry!") or apologize effusively
  ("I'm so sorry, I couldn't find that vendor").
- **Concrete.** Never filler phrases: "I'd be happy to help,"
  "That's a great question," "Let me look into that for you."
  These are trust liabilities in accounting software.
- **No emoji.** No exclamation marks in agent output. No
  anthropomorphic phrasing ("I think," "I feel," "I believe").
  The agent is a tool. The voice signals this by not being a
  character.

**Error behavior.** When the agent cannot do something, it says
plainly what it cannot do and why, then offers the alternative:
"I can't post to March — that period is locked. You can post to
April instead, or ask a controller to reopen March."

The persona's job is to **not leak personality.** Personality is
a trust liability in accounting software. See
`docs/03_architecture/agent_interface.md` for the full persona
specification.

---

## Ghost Rows Visual Contract

When an agent-proposed entry appears in a ledger view before
posting (the "Pending" or "Needs Attention" lifecycle state from
`docs/02_specs/mutation_lifecycle.md`), it uses **four
independent visual signals** (defense in depth — if CSS fails to
load one signal, the others still distinguish ghost rows from
posted rows):

1. **Italic text.** All text in the row is italicized.
2. **Muted/lower-contrast color.** Row text uses a lower-opacity
   variant of the standard text color.
3. **Persistent left-border stripe** in a reserved color (neutral
   gray, not semantic red/green/yellow — draft status is not an
   error, warning, or success).
4. **Inline "Draft" pill.** A small label adjacent to the row's
   primary identifier.

**Schema-level exclusion.** Ghost rows are excluded from all
exports and all reports via schema-level filtering, not UI
filtering. A report that includes draft rows is a **bug**, not a
configuration choice. The filtering predicate is part of the
report query (e.g., `WHERE lifecycle_state = 'finalized'`), not
a front-end toggle.

**The animation contract.** The transition from draft to posted
is a discrete UI event with a one-time satisfying animation —
the ghost row "solidifies" (opacity and font-weight transition
from muted/italic to normal over ~300ms). This is the single
place motion is permitted in ledger views. All other ledger view
interactions are instant (no loading spinners on row actions, no
animated table re-sorts).

---

## Rejected Patterns

Patterns considered during the design sprint and explicitly
killed. Documented here so future contributors do not re-propose
them without re-evaluating the rationale.

- **Node-and-edge cash flow diagrams.** Don't reconcile, don't
  tie back to journal entries, unreadable at real transaction
  volume.
- **Flying nodes / spatial clustering of transactions.**
  Unserious for controllers; accountants want confidence, not
  choreography.
- **Multi-cursor from text editors.** Superseded by multi-select
  + scoped Cmd+K; same result without teaching a novel
  interaction pattern.
- **Figma-style real-time multiplayer presence.** Phase 3+ at
  earliest; simple row-level lock + "edited by X" is enough for
  v1. The user count (~100 across ~50 orgs) does not justify
  the complexity.
- **Mode toggles (basic vs advanced).** Use progressive
  revelation through use instead. Mode-switching software dies
  — users get stuck in one mode and never discover the other.
- **Spatial reconciliation with confidence tethers as primary
  UI.** Reconciliation ships as list + keyboard + AI-suggested
  matches first. Spatial is progressive enhancement conditional
  on the list form proving insufficient in use. Shipping spatial
  first is premature optimization of a surface that may never
  need it.

---

## Shell architecture history (pre-Phase-6.5)

The following text describes the four-zone Bridge shell as
shipped at Phase 1.1 close, plus the Path 1 Mainframe entry-
point description from § The Three-Path Entry Model.

Phase 6.5 amendment cycle (cycle closeout 2026-05-16 at commit
79a6ceb) consolidated the four-zone shell to three-zone per
Cuts 4-8 and removed the Mainframe rail (semantic role
transferred to Zone 1's Region 7.2 + 7.3 navigation surfaces).
This section preserves the pre-Phase-6.5 architecture as
historical record per ADR-0022 §2 supersession discipline.

Cross-reference: cycle closeout brief at
`docs/09_briefs/phase-6.5/2026-05-16-document-drop-and-shell-consolidation-scope-lock-cycle-close.md`.

### § The Split-Screen Layout (pre-Phase-6.5)

Three zones, plus the Mainframe rail. The split-screen shell is built
fully in Phase 1.1; canvas views are added per phase.

1. **Left Panel — Agent Chat** (~380px fixed, collapsible via keyboard
   shortcut). Conversation history; message input with file drop zone
   (drop zone is inactive in Phase 1, the upload pipeline is Phase 2);
   persona-specific suggested prompts on empty state. Agent messages
   may contain inline ProposedEntryCards with Approve / Reject buttons.

2. **Right Panel — Contextual Canvas** (fills remaining width). A
   blank stage that renders whatever the agent last directed it to
   show. Has its own independent navigation history (back/forward
   arrows in the canvas header) so the user can drill down through
   multiple levels and return without disrupting the conversation.

3. **Top Nav.** Org switcher (role-aware — AP specialist sees assigned
   orgs only, CFO sees all + consolidated), global search stub,
   notification bell (count of pending AI actions), user menu.

**The Mainframe** — A collapsed icon rail on the far left, narrower
than the chat panel, always visible. Direct-launch icons for the most
common canvas views: Chart of Accounts, Journal Entry, AP Queue
(Phase 2+), P&L Report. Clicking any icon bypasses the agent entirely
and loads that canvas view directly. **This is the fallback navigation
when the user knows where they want to go, AND the graceful
degradation path when the Claude API is unavailable.** Label it
"Mainframe" in the UI — lean into the Star Trek metaphor.

**Mainframe constraint:** No Phase 1 canvas component is allowed to
require the agent to function. Every Phase 1 canvas view (Chart of
Accounts, Journal Entry form, Journal list, basic P&L, AI Action
Review) must work fully when accessed directly via the Mainframe.
The agent is a composer that can also load these views; the views
themselves are standalone.

### § The Three-Path Entry Model — Path 1 Mainframe (pre-Phase-6.5)

The collapsed icon rail on the far left. Direct-launch icons for
common canvas views. Produces **Navigation intents only** — the
Mainframe is a navigation surface, not a mutation surface. Every
Mainframe click fires a `CanvasDirective` pushed onto the canvas
stack.
