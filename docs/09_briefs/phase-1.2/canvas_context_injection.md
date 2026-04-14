# Canvas Context Injection — Phase 1.2 Brief

This brief specifies the Phase 1.2 canvas context injection feature:
the minimal bidirectional pattern that connects the chat panel to
what the user is looking at in the canvas. The Phase 1.1 UI shell
and the `canvas_directive` contract are described in
`docs/03_architecture/ui_architecture.md`. This brief extends that
contract with agent-driven context injection.

The full bidirectional UX (hover states, contextual action bar,
multi-selection, canvas tabs, persistent-across-navigation selection,
P&L drill-down) is Phase 2. This brief covers only the minimal
version that will land in Phase 1.2 alongside the initial agent
build.

Source: extracted from PLAN.md §4g (v0.5.4) during Phase 1.1
closeout restructure.

---

## Why This Ships in Phase 1.2, Not Phase 2

The Bridge's core metaphor is a chat panel that knows what the user
is looking at in the canvas. Without that, the split-screen layout is
two unconnected panes sitting next to each other — the exact problem
Pennylane and Puzzle never solved and which The Bridge is supposed to
solve structurally. A disconnected UI in Phase 1.3 real-user testing
would produce a hard-no trust classification for UX reasons, which is
the wrong reason to fail Phase 1.3.

---

## Three Components, Nothing More

1. A `CanvasContext` TypeScript type.
2. A Zustand selector that will build a `CanvasContext` snapshot from
   the current canvas state.
3. Click handlers on exactly two selectable row types: journal entry
   rows in the journal entry list view, and chart-of-accounts rows
   in the CoA view.

Plus two downstream wirings:

4. `canvas_context?: CanvasContext` will be added as an optional
   field on `handleUserMessage` input.
5. A subordinate canvas-context section will be appended to the
   system prompt, labeled as *"context only, do not assume the user
   is asking about this unless their message refers to it."*

---

## The Type

```typescript
// src/shared/types/canvasContext.ts — created empty in Phase 1.1, populated in Phase 1.2.

import type { CanvasDirective } from './canvasDirective';

export type SelectedEntity =
  | { type: 'journal_entry'; id: string; display_name: string }
  | { type: 'account';       id: string; display_name: string };

export type CanvasContext = {
  /** The directive currently rendered by ContextualCanvas, verbatim. */
  current_directive: CanvasDirective;

  /**
   * The entity the user has clicked on, if any. Undefined means the user
   * is looking at the canvas but has not clicked any specific row.
   * Phase 1.2 supports exactly two selection types: journal_entry and
   * account. Additional types (P&L line drill-down, multi-select, etc.)
   * are Phase 2.
   */
  selected_entity?: SelectedEntity;
};
```

---

## The Client-Ephemeral Rule

`CanvasContext` will be built by the Zustand selector at the moment
the user sends a message, sent as part of the `/api/agent/message`
request body, and **not persisted server-side** in
`agent_sessions.state`. The server will not try to guess what the
user has clicked; the client will always tell it. This is the right
choice because (a) the server cannot know what the user clicked,
(b) it avoids a staleness window when the canvas navigates, and
(c) it keeps `agent_sessions.state` focused on conversation-turn
state, not UI state.

---

## The Two Selection Types, Exactly

| Selection type | Selectable in | `id` references | Phase |
|---|---|---|---|
| `journal_entry` | Journal entry list view row click | `journal_entries.journal_entry_id` | 1.2 |
| `account` | Chart of Accounts view row click | `chart_of_accounts.account_id` | 1.2 |
| ~~P&L line~~ | P&L canvas view | Aggregation, not a table row | **Phase 2** |
| ~~Period~~ | Period picker | `fiscal_periods.period_id` | Phase 2 |
| ~~Vendor~~ | Vendor detail view | `vendors.vendor_id` | Phase 2 |

**Why P&L drill-down is not in Phase 1.2 even though it is the most
compelling demo:** a P&L line is an aggregation (account x period x
org), not a row in any table. Its `id` has no clean shape — it would
need to be a synthetic key encoding the dimensions, or a period range
plus an account ID, and either choice has Phase 2-era data-model
implications (intercompany rollup, consolidated view across orgs).
The cost of designing the aggregation-selection schema in Phase 1.2
exceeds the cost of deferring the demo until Phase 2. The two
row-based selection types (journal entry, account) both map cleanly
to existing table primary keys and have no open data-model questions.

---

## System Prompt Framing — Explicitly Subordinate

The canvas-context block will be appended to the system prompt with
this exact framing:

```
## Current canvas context (reference only)

The user is currently looking at: {current_directive.description}

{#if selected_entity}
The user has clicked on: {selected_entity.display_name}
({selected_entity.type}, id: {selected_entity.id})
{/if}

This context is reference material only. Use it when the user's
message is ambiguous ("this", "here", "why is it so high") to
resolve which entity they mean. **Do not assume the user is asking
about the selected entity or the current canvas unless their message
refers to it.** If the user sends a message that explicitly names a
different entity, follow the explicit reference and ignore the
selection. If the user sends a message with no clear referent and
nothing is selected, ask a clarifying question rather than guessing
from a stale selection.
```

---

## Over-Anchoring Test (Phase 1.2 Exit Criterion #19)

The risk of canvas context injection is that the agent over-anchors
on what is in the canvas and ignores what the user actually typed.
The subordinate-framing instructions above are the mitigation. The
test that proves they work is Phase 1.2 exit criterion #19 (see
`docs/03_architecture/phase_plan.md`), which requires three
scenarios to pass on the same system-prompt configuration:

**(a) Clicked entry + ambiguous question → agent uses the
selection.** Navigate to the journal entry list view. Click any
posted journal entry row. Ask an ambiguous follow-up like *"why was
this posted?"*. The agent's response should reference the selected
entry by its description, date, or amount. If the agent asks a
clarification question despite a clear selection, that is
**under-anchored**.

**(b) Clicked entry + explicit reference to a different entry →
agent follows the explicit reference.** With the same journal entry
still selected, send a message that explicitly names a *different*
entry by reference number or date. The agent's response should be
about the entry named in the message, not the selected one. **Over-
anchoring on this scenario is a hard failure for Phase 1.2.**

**(c) No click + ambiguous question → agent asks a clarification
question.** Clear the selection. Without clicking any row, send an
ambiguous message like *"what's going on with this?"*. The agent
should ask a clarification question rather than guessing from a
stale or missing selection. If the agent returns a confident answer
about a ghost selection, that is **over-anchored**.

---

## What Phase 1.2 Implementation Will Touch in Phase 1.1 Code

The two canvas components (`JournalEntryListView.tsx`,
`ChartOfAccountsView.tsx`) will get click handlers added in
Phase 1.2. This is an edit to Phase 1.1 components, not an addition.
Phase 1.2 also converts `AgentChatPanel.tsx` from empty-state to
streaming rendering. Canvas context injection joins that list of
in-place edits.

---

## What Phase 2 Still Owns After This Lands

- Hover states and a contextual action bar on hover
- Multi-selection (ctrl-click, shift-click)
- Canvas tabs with per-tab context
- P&L line drill-down (the aggregation-selection problem)
- Persistent-across-navigation selection (the Zustand selector will
  be rebuilt from scratch on canvas navigation in Phase 1.2; Phase 2
  will thread selection through navigation events)
- Additional selection types beyond `journal_entry` and `account`
