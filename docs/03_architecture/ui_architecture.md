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

---

## The `canvas_directive` Contract (Agent-to-UI Protocol)

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

---

## The Three-Path Entry Model

Every user action that produces work for the system enters through
one of three paths. All three converge on `Intent` objects (see
`docs/02_specs/intent_model.md`). No path has bespoke routing.

### Path 1: Mainframe

The collapsed icon rail on the far left. Direct-launch icons for
common canvas views. Produces **Navigation intents only** — the
Mainframe is a navigation surface, not a mutation surface. Every
Mainframe click fires a `CanvasDirective` pushed onto the canvas
stack.

### Path 2: Chat

The AI agent panel. The user types a natural-language message;
the agent interprets it and produces **any of the three intent
types**: navigation ("show me the CoA"), mutation ("post this
journal entry"), or query ("what's my cash position?"). Chat is
the most expressive path — it can do anything the other two can,
plus handle ambiguity.

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
