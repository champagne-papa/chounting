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
| `/admin/orgs` | 1.1 | Org creation with industry CoA template selection |

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
