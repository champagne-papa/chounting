# Phase 1.2 Session 7 Sub-Brief

**Drafted:** 2026-04-19
**Anchor SHA:** 2b22529 (Convention #8 fifth category + staging operational note)
**Master brief:** docs/09_briefs/phase-1.2/brief.md (frozen at aae547a)
**Predecessor sessions:** 1, 2, 3, 4, 4.5, 5, 5.1, 5.2, 6 — all complete (288/288 tests green)
**Status:** DRAFT v4 — grep-pass verified + founder review gate surgical corrections applied, ready for commit

---

## 1. Session goal

Session 7 ships **the production chat UI and its supporting infrastructure**. This is the last feature session of Phase 1.2; Session 8 is verification + closeout. Everything that Phase 1.2 ships as user-visible behavior must land in Session 7 or be explicitly deferred to Phase 2 with named rationale.

Seven scope items map to five feature commits + one docs-closeout commit. Item 4 (SplitScreenLayout onboarding mode) is reframed as verification-only — no build LOC — under Pre-decision 12; it is preserved in the count for roadmap-bookkeeping continuity (the EC-20 closeout gap rationale referenced it as a build item, and zeroing it from the count risks losing track of "why we considered a build and decided not to"). The chat-card-prompt trinity (Commits 1-3) is the shipping-blocking work; shell polish (Commit 4) and canvas context (Commit 5) close concrete gaps. A pre-declared split-point at end of Commit 3 defers Commits 4-5 to Session 7.1 if execution runs long — see §7.

---

## 2. Prerequisites

- **Anchor SHA:** 2b22529. Working tree clean. 288/288 tests green. `pnpm agent:validate` passes.
- **Convention #8 at codified fifth category.** Identity-assertion discipline applies throughout drafting and execution (see 2b22529 commit).
- **ADR-0002** (confidence as policy input) — Commit 2 migrates `ProposedEntryCard` rendering to `policy_outcome` framing.
- **ADR-0003** (one-voice agent architecture) — the chat surfaces the agent as "the agent," no persona label, no proper name (ADR-0006).
- **Master §14.2, §14.4, §14.6** — UI architecture definitions for canvas context, onboarding layout, top-nav dropdown.
- **`docs/09_briefs/phase-1.2/canvas_context_injection.md`** — pre-existing design brief for click-handler behavior (Commit 5).

---

## 3. Pre-decisions

Pre-decisions are the non-obvious design commitments from the Phase 2 Q&A brainstorm (2026-04-19) that execution must honor without re-deliberation. Numbered for reference.

### Pre-decision 1 — Commit structure is pre-declared

Five feature commits in fixed order:
1. **Params-shape enumeration + locale keys** — everything the agent is allowed to say, validated
2. **ProposedEntryCard real render + schema tightening + reject endpoint + migration 120**
3. **AgentChatPanel production rewrite + conversation resumption + error UI**
4. **Shell polish** — avatar dropdown + Activity icon + placeholder review queue page
5. **Canvas context click handlers + EC-19 tests**

Plus Commit 6 (docs closeout + Session 8 handoff). Execution may split within a commit as needed (e.g., landing the schema file in a pre-commit during Commit 2 before wiring the card render) without waiting on the review gates for intra-commit structure, but commit *boundaries* are pre-declared — the five numbered commits are the review gates.

### Pre-decision 2 — Split-point at end of Commit 3

If execution reaches end of Commit 3 **at or past day 2** (wall-clock; the 2-day boundary is from Session 7 kickoff, not from Commit 1 kickoff), pause and declare Session 7 complete with Commits 4-5 deferred to Session 7.1. Commit 3's end-state is the chat+card+prompt trinity shipped and tested — this is a viable Phase 1.2 deliverable on its own.

If execution clears through Commit 5 in under 5 days: Session 8 proceeds as originally planned. Session 7.1 is not needed.

If the split fires: Session 7.1 is a short tactical session (~1 day) covering Commits 4-5 with their own cadence. Session 8 remains verification + closeout. Phase 1.2 becomes 9 numbered sessions instead of 8.

### Pre-decision 3 — Migration 120 is the Agent-Ladder-correctness scoped exception

Session 7's "no migrations" discipline (inherited from Session 6) is overridden for migration 120:

```sql
-- supabase/migrations/20240120000000_ai_actions_edited_status.sql
BEGIN;
ALTER TYPE ai_action_status ADD VALUE IF NOT EXISTS 'edited';
ALTER TABLE ai_actions RENAME COLUMN rejection_reason TO resolution_reason;
COMMIT;
```

**Rationale:** `docs/02_specs/agent_autonomy_model.md` §Promotion defines `approval_rate = approved / (approved + not_approved)` with a ≥95% threshold. Phase 1.3 is trust calibration; without distinguishable outcomes for rejection vs. edit-and-replace, the denominator is undefined and rule promotion cannot compute. The migration is two ALTER statements, purely additive, fully backward-compatible.

**Blast radius (grep-verified at draft):** the `rejection_reason` column is referenced in 1 code file (`src/db/types.ts`, 3 type references in one file). Zero tests, zero production consumers. Rename is safer than the original ≤5-site ceiling.

### Pre-decision 4 — Card rendering is inline in the transcript

When the agent returns a `proposed_entry_card` canvas directive, the card renders as the assistant turn's content, below any text bubble, in the transcript scroll. Subsequent turns push it up the scroll. No pinned "currently proposed" panel.

Rationale: matches `docs/03_architecture/ui_architecture.md` line 25 verbatim ("may contain inline ProposedEntryCards with Approve / Reject buttons"), matches the bookmark-pill precedent from Canvas↔Chat rule 3 (structured content attached to assistant turns renders inline), matches ADR-0002's policy_outcome framing of the card as the agent's reasoning output.

### Pre-decision 5 — Error UI: three treatments for six raw modes

Three UI treatments:

| Raw failure mode | UI treatment |
|---|---|
| Claude API unavailable (Q11) | **Banner + Retry** at top of chat |
| Mid-conversation API fail (orchestrator aborts) | **Banner + Retry** (folds in) |
| Tool validation retry exhausted (Q13) — agent emits `agent.error.tool_validation_failed` | **Normal assistant turn** |
| Structured response missing — agent emits `agent.error.structured_response_missing` | **Normal assistant turn** |
| Network failure (fetch throws) | **Inline retry** on user turn |
| Malformed response payload (200 but schema miss) | **Inline retry** on user turn + `console.error` |

Agent-emitted errors ride the normal template-id renderer via their `agent.error.*` template_ids. Per-mode bespoke copy is explicitly NOT built. Offline pre-flight check is explicitly NOT built (folds into fetch failure).

### Pre-decision 6 — Client-ephemeral failed user turns

Failed user turns (network/fetch-throw) live in client memory with `status: 'failed'` and retry affordance. Refresh loses failed turns. No `message_id`-based idempotency on `/api/agent/message`.

**Known accepted cost — duplicate-exchange on response-side network failure.** The client-ephemeral pattern has one failure window: server processes message and persists both turns successfully, then the response network-fails en route to the client. User sees "failed," retries. Server now holds two user turns with identical text plus two distinct assistant responses. No financial correctness issue (confirm idempotency is per-card, unaffected). Transcript tidiness only. The duplicate can be identified in Phase 1.3 friction journaling by comparing conversation timestamps to client-side retry events. Server-side mitigation would require an `idempotency_key` on `/api/agent/message`, deferred as a Phase 2 item if Phase 1.3 surfaces the pattern frequently enough to warrant it.

### Pre-decision 7 — Card resolution state is server-derived read-only on the ChatTurn

Card resolution state (`approved` | `rejected` | `edited` | `stale`) is derived server-side in the conversation-load endpoint (from `ai_actions.status`) and lands on the assistant turn as a **read-only field** (`card_resolution?: CardResolution` on the `ChatTurn` type). The client never independently mutates or tracks this field — a subsequent Approve/Reject/Edit user action triggers a refresh cycle (re-fetch the turn's resolution from the server after the mutation), not a local mutation of the field.

During the confirm/reject fetch round-trip, a per-card **ephemeral `isSubmitting` state** lives in local React state (not on the ChatTurn). Buttons disabled during submission; "Confirming..." spinner. Not persisted, not part of the turn data model.

### Pre-decision 8 — Conversation resumes on AgentChatPanel mount

Production mode's `AgentChatPanel` fetches the current session's conversation on mount and renders its turns. Returning users see their chat history. Scroll position on rehydration is the bottom (most recent turn); scroll restoration across refreshes is Phase 2.

### Pre-decision 9 — Canvas context state lives in SplitScreenLayout (React useState)

**Footnote 1 — genuine deviation from `canvas_context_injection.md`.** The brief names Zustand as the state store; Session 7 uses React `useState` in `SplitScreenLayout`. Rationale: scope discipline (no new runtime deps — grep-verified: no Zustand in package.json) + state-already-colocated-with-directive (SplitScreenLayout already holds canvas directive state via useState). Behavior contract preserved: client-ephemeral, built at send time, auto-clears on directive change. The brief's "Zustand selector" wording is treated as evocative of the state-store pattern, not prescriptive of the specific library.

### Pre-decision 10 — Row clicks do both navigation and selection

**Footnote 2 — specification of an under-specified brief rule, not a deviation.** `canvas_context_injection.md` says the selection is "rebuilt from scratch on canvas navigation." Under Session 7's click-does-both interaction model, the forward-navigation case that created the selection IS the navigation — "rebuild from scratch" produces a state equivalent to keeping the selection. The brief is silent on back/sideways navigations because its implicit model was separate click targets. Session 7 specifies the rule completely:

> The selection survives directive changes where the new directive is type-compatible with the selection (e.g., `selected_entity.type === 'journal_entry'` and new directive is `journal_entry` or `journal_entry_list`). The selection drops when the new directive is type-incompatible.

This is the complete rule implementation; the brief's wording is honored for the cases it did address.

### Pre-decision 11 — Onboarding → production transition stays router-push

Session 5's `router.push(href)` on `onboarding_complete` is preserved unchanged. Full page navigation, production `SplitScreenLayout` mounts, Pre-decision 8's conversation-resume picks up the onboarding session's transcript. The production chat shows the full onboarding conversation on first mount post-onboarding.

### Pre-decision 11b — Onboarding completion looks up target org_id and updates session

At onboarding-complete transition in `src/agent/orchestrator/index.ts` (the `if (onboardingComplete) { ... }` branch before the final `return response`), the orchestrator queries memberships for the user's first active membership, then updates `agent_sessions.org_id` from `null` to the returned org_id **before** returning `onboarding_complete: true` to the client. This ensures the production chat's mount-time conversation fetch (Pre-decision 8), keyed on `(user_id, org_id)`, finds the session that just carried the onboarding conversation.

**Rationale:** UX continuity — the user just had a conversation with the agent; losing that context at the onboarding boundary feels like the agent forgot. Server-side session scoping by `(user_id, org_id)` is otherwise correct; updating `org_id` at the moment the user acquires one is semantically accurate (the session is now "about this org").

**Why the query is needed:** at the moment `onboardingComplete = true` fires, the orchestrator doesn't have the target org_id in scope. For invited users, the membership already existed pre-onboarding. For fresh users, `createOrganization` executed earlier in the session and created a membership, so it now exists. Either way, a "first active membership for user" query returns the right org.

**Implementation shape (~10 LOC using the orchestrator's existing privileged client — `adminClient()`, not a new RLS-scoped client):**

```typescript
if (onboardingComplete) {
  const { data: m } = await adminClient()
    .from('memberships')
    .select('org_id')
    .eq('user_id', input.user_id)
    .eq('status', 'active')
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();
  if (m?.org_id) {
    await adminClient()
      .from('agent_sessions')
      .update({ org_id: m.org_id })
      .eq('session_id', session.session_id);
  }
  response.onboarding_complete = true;
}
```

The exact `adminClient()` import and the `session.session_id` / `input.user_id` variable names follow what's already in scope at the onboardingComplete branch — grep at execution time for the exact identifiers.

**Scope:** ~10 LOC (query + guard + update + existing flag set). Ships in Commit 3 as part of the conversation-resumption correctness Commit 3 is responsible for.

### Pre-decision 12 — Welcome page layout stays separate from SplitScreenLayout

**Item 4 is redefined from "SplitScreenLayout onboarding mode" to "welcome page compatibility verification."** The master brief's §14.4 description of onboarding-mode layout (hide Mainframe rail, expand chat, hide canvas until directive) is achieved via page-level layout choice — the welcome page owns its own layout; SplitScreenLayout stays production-only. No `mode` prop added to SplitScreenLayout.

Agent canvas directives emitted during onboarding are recorded in the persisted turn but not rendered during onboarding. They become visible once the user completes onboarding and enters the production shell.

**Verified at draft (grep-verified):** the three persona prompts at `src/agent/prompts/personas/{controller,ap_specialist,executive}.ts` (plus shared sections in `_sharedSections.ts` and `_identityAndTools.ts`) don't contain any instructions to attach `canvas_directive` objects to `respondToUser` calls during onboarding steps. Grep for `canvas_directive` in `src/agent/prompts/personas/` returned zero matches. If a future prompt change adds such instructions, the welcome-page `AgentChatPanel` path ignores the directive field in its render path — no rendering surface exists for it during onboarding.

---

## 4. Scope detail — commit by commit

### Commit 1 — Params-shape enumeration + locale keys + orchestrator-boundary validation

**Job:** everything the agent is allowed to say, validated at three layers (closure, params shape, locale placeholder parity). Orchestrator boundary calls the shared validation helper against the agent's emitted `respondToUser` params — same pattern Session 5.1 established for the template_id closure.

**Files touched:**
- `src/agent/prompts/validTemplateIds.ts` — convert `VALID_RESPONSE_TEMPLATE_IDS` from flat array to `TEMPLATE_ID_PARAMS` object mapping each template_id to a Zod schema. `Object.keys(TEMPLATE_ID_PARAMS)` yields the array for existing consumers (closure test, system-prompt renderer).
- Extend `UI_ONLY_AGENT_KEYS` with seven suggestion keys.
- New helper `validateParamsAgainstTemplate(template_id, params): Result<T, ZodError>` colocated with `TEMPLATE_ID_PARAMS`. Discriminated-result shape (`{ok: true, params: T} | {ok: false, error: ZodError}`) — no throws.
- System-prompt renderer `validTemplateIdsSection` (currently at `validTemplateIds.ts:63`) renders each template_id's params shape verbatim including "Additional fields are not permitted" so Claude's instruction-following respects the `.strict()` Zod behavior rather than triggering avoidable retries.
- `messages/en.json`, `messages/fr-CA.json`, `messages/zh-Hant.json` — add 21 entries (2 response templates × 3 locales + 7 UI keys × 3 locales).
- **Orchestrator boundary** (the `respondToUser` Zod-validation path from Session 5.1 at `src/agent/tools/respondToUser.ts` + usage in `src/agent/orchestrator/index.ts`) — add `validateParamsAgainstTemplate(template_id, params)` call. Zod failure triggers the Q13 retry budget (same existing path); exhausted budget emits `agent.error.tool_validation_failed` as a normal turn. This is the **primary** consumer of the helper; Commit 2's `reason_params` call site is a secondary consumer using the same helper.

**New response template_ids:**
- `agent.entry.posted` — params shape derived from confirm endpoint's return (likely `{ entry_number: number }`; confirm at execution)
- `agent.entry.rejected` — params `{}` (empty strict schema)

**New UI-only keys (seven):**
- `agent.suggestions.controller.pl` / `.new_entry` / `.ai_actions`
- `agent.suggestions.ap_specialist.queue` / `.incoming`
- `agent.suggestions.executive.cash` / `.runway`

**Schema strictness:** all `TEMPLATE_ID_PARAMS` entries use `z.object({...}).strict()`. System-prompt text for each entry explicitly states "Additional fields are not permitted."

**Tests:**
- `tests/integration/agentTemplateIdSetClosure.test.ts` — update to use `Object.keys(TEMPLATE_ID_PARAMS)`.
- **New:** `tests/integration/agentTemplateParamsClosure.test.ts` — for each template_id, parse `messages/en.json`'s value for `{placeholder}` tokens and verify against the schema's `.shape` keys. Bidirectional — schema-declared fields must appear as placeholders; every locale placeholder must have a schema field. `en.json` is authoritative; `fr-CA.json` and `zh-Hant.json` are English-fallback placeholders and are not separately parity-tested in Phase 1.2.

**Estimated size:** ~0.5 day.

---

### Commit 2 — ProposedEntryCard real render + schema tightening + reject endpoint + migration 120

**Job:** the card renders, the card validates, the card can be approved/rejected/edited. Migration 120 lands alongside so the endpoint has its target schema.

**Files touched:**

*Schema + migration:*
- **New:** `src/shared/schemas/accounting/proposedEntryCard.schema.ts` — Zod mirror of the existing TypeScript type at `src/shared/types/proposedEntryCard.ts`. Imports `MoneyAmountSchema` from `src/shared/schemas/accounting/money.schema.ts`. No canvas imports.
- `src/shared/schemas/canvas/canvasDirective.schema.ts` — replace `proposedEntryCardPlaceholder = z.unknown()` (currently at line 17) with import of `ProposedEntryCardSchema`.
- `reciprocal_entry_preview`: `z.unknown().optional()`. No speculation about Phase 2's intercompany shape.
- `policy_outcome.reason_params`: `z.record(z.string(), z.unknown())` at schema level (loose). Strict validation happens in orchestrator via `validateParamsAgainstTemplate(policy_outcome.reason_template_id, policy_outcome.reason_params)` — the secondary call site of Commit 1's helper.
- **New migration:** `supabase/migrations/20240120000000_ai_actions_edited_status.sql` — shape per Pre-decision 3.

*Endpoint:*
- **New:** `src/app/api/agent/reject/route.ts` — accepts `{ org_id, idempotency_key, outcome: 'rejected' | 'edited', reason?: string }`. Writes `status` + `resolution_reason` to `ai_actions`. Returns existing state on idempotent replay.

**Service-layer decision:** the `/api/agent/reject` endpoint follows the inline pattern of `/api/agent/confirm` at `src/app/api/agent/confirm/route.ts` — `adminClient` DB operations directly in the route handler, no service-layer abstraction. No `src/services/ai_actions/` directory is introduced. Matches the existing `ai_actions` handling pattern. Refactoring `/api/agent/confirm` to use a service layer is Phase 2 cleanup, out of scope here.

*Component:*
- `src/components/ProposedEntryCard.tsx` (not under `bridge/` — this is a top-level canvas component per existing layout) — replace placeholder with real render. The existing file already has a `TODO(session-7)` comment at line 25 marking the migration point. Policy-outcome prose via `useTranslations()` on `reason_template_id` + `reason_params`. Lines as a debit/credit table. Approve / Reject / Edit buttons with the interaction shapes below.

*Interaction shapes:*
- **Approve** → POST `/api/agent/confirm` with `{ org_id, idempotency_key }`. On success: new assistant turn with `agent.entry.posted` template; canvas directive pushed to `{ type: 'journal_entry', entryId, mode: 'view' }`. Per-card `isSubmitting` state during fetch; buttons disabled.
- **Reject** → two-step inline. First click reveals a "Why? (optional)" textarea + Confirm button below the card. Confirm fires POST `/api/agent/reject` with `outcome: 'rejected', reason: <textarea or empty>`. Card resolves; assistant ack turn with `agent.entry.rejected` template.
- **Edit** → fires POST `/api/agent/reject` with `outcome: 'edited', reason: 'edited_and_replaced'` (system-set constant, not user text) AND dispatches canvas directive to pre-filled journal-entry form.

**Tests:**
- **New:** `tests/integration/proposedEntryCardSchemaAcceptance.test.ts` — valid card passes, strict fields reject extras, loose `reason_params` accepts any record, `reciprocal_entry_preview: undefined` passes.
- **New:** `tests/integration/apiAgentRejectEndpoint.test.ts` — happy path (outcome: rejected), edit path (outcome: edited), idempotent replay, RLS authorization, invalid outcome value.
- Existing `tests/integration/canvasDirectiveSchemaExtensions.test.ts` (CA-74) — extend to cover the tightened card shape.

**Estimated size:** ~1.0 day.

---

### Commit 3 — AgentChatPanel production rewrite + conversation resumption + error UI

**Job:** the production chat works end-to-end — unified shell, server-round-trip conversation load, three error UI treatments, suggested-prompts empty state, onboarding→production session org_id transition.

**Files touched:**

*Component rewrite:*
- `src/components/bridge/AgentChatPanel.tsx` — major rewrite. Keep the two-subcomponent pattern: `OnboardingChat` (Session 5, unchanged) + new `ProductionChat` (replaces `StubChat`). Top-level wrapper does the runtime branch on `initialOnboardingState` presence.
- `ProductionChat` implements:
  - Mount effect: fetch conversation (see "Conversation load endpoint" below). Render at scroll bottom.
  - `ChatTurn` type with three variants per Pre-decisions 5 / 6 / 7:
    ```typescript
    type ChatTurn =
      | { role: 'user'; id: string; text: string; timestamp: string; status: 'sent' }
      | { role: 'user'; id: string; text: string; timestamp: string; status: 'sending' | 'failed'; error_detail?: string }
      | {
          role: 'assistant';
          id: string;
          template_id: string;
          params: Record<string, unknown>;
          card?: ProposedEntryCard;
          card_resolution?: CardResolution;  // server-derived; read-only on client (Pre-decision 7)
          canvas_directive_pill?: CanvasDirective;
          timestamp: string;
          trace_id: string;
        };
    ```
  - Render: text bubble (if any) → card (if any, with Four Questions + buttons) → pill (if any). Resolution state consumed from the server-side join at load time; buttons replaced by resolved indicator when populated.
  - Send flow: append user turn with `status: 'sending'`, POST to `/api/agent/message` with `canvas_context` built from SplitScreenLayout state (see Commit 5), await response, append assistant turn, flip user turn to `'sent'`. On error: flip to `'failed'` with inline retry affordance.
  - Error UI: banner renders when a Q11-class error is returned; inline retry renders per-turn; agent-emitted errors ride normal rendering.
  - Empty-state suggested prompts: visible iff `turns.length === 0`, persona-aware (read current user role via existing mechanism), one-click-fires.

*Conversation-load endpoint:*
- **New:** `src/app/api/agent/conversation/route.ts` — GET endpoint. Returns `{ turns: ChatTurn[], session_id: string | null }`. Server-side: fetches the current `agent_sessions` row for `(user, org)`, parses the `conversation` JSONB array, joins against `ai_actions` for any turn carrying a card (by `idempotency_key` inside the card), returns the hydrated shape. One query, one loading state, one RLS check. Grep-verified: no existing route by this name; new file.

*Onboarding session org_id update (Pre-decision 11b):*
- `src/agent/orchestrator/index.ts` at the `onboardingComplete = true` branch — add the membership lookup + session org_id update per Pre-decision 11b's implementation shape. ~10 LOC.

*Empty-state suggestions:*
- `src/components/bridge/SuggestedPrompts.tsx` — replace hardcoded English strings with `useTranslations('agent.suggestions.<persona>')` lookup. Click handler calls `onSelect(text)` which the parent `ProductionChat` wires to its send path (same code path as text-input Send).

**Tests:**
- **New:** `tests/integration/conversationLoadEndpoint.test.ts` — happy path (populated session), empty session, card with approved status, card with rejected status, card with no matching ai_actions row (stale or unknown key), cross-org RLS, onboarding-session-claimed-by-production (org_id transition case from Pre-decision 11b).
- **New:** `tests/integration/suggestedPromptsOneClickFire.test.ts` — pure function test of the prompt-click → synthesized-send handler.
- **Error UI not separately tested:** error-state behavior is verified manually during the Commit 3 founder review via dev-server browser check against a deliberately-broken API call, not via an automated test. The reducer logic for "did the network fail → set status to failed" is a one-liner; extracting it as a pure function and testing adds ceremony without meaningful coverage gain.

**Estimated size:** ~1.25 day (realistic).

---

### Commit 4 — Shell polish: avatar dropdown + Activity icon + placeholder review queue page

**Job:** close the EC-20 sign-out affordance gap, ship the full §14.6 dropdown, add the Mainframe Activity icon, stand up a placeholder target page so the icon doesn't navigate to a 404.

**Master brief drift note (grep-surfaced at draft).** Master brief §14.6 asserts the route `/<locale>/<orgId>/agent/actions` exists from Phase 1.1. Verification at draft found that `src/app/[locale]/[orgId]/agent/actions/` exists as a directory but is empty — no `page.tsx`. Phase 1.1 shipped the directory slot without the page (Phase 1.1's "what is not included" list names "the AI Action Review queue" as out of scope but the master brief's Phase 1.2 text over-remembers this as existing). Session 7 closes the 404 gap with a minimal placeholder page; Session 8 ships the functional queue as part of EC-8 preparation (see §9).

**Files touched:**
- **New:** `src/components/bridge/AvatarDropdown.tsx` — button + popover. Four items: Profile (Link to `/<locale>/settings/profile`), Org settings (Link to `/<locale>/<orgId>/settings/org`, conditionally rendered for controllers via existing permission check), Team (fires `onTeamClick` callback from parent), Sign out (Supabase `signOut()` + `router.push('/<locale>/sign-in')`).
- `AvatarDropdown` accepts a callback prop `onTeamClick: () => void`. `SplitScreenLayout` owns the `setDirective` call; dropdown is directive-agnostic and receives no canvas state. This is the one coupling point between items 4 and 5 — item 4's dropdown requires item 5's `SplitScreenLayout` state lift to wire the callback, but the coupling is unidirectional.
- `src/components/bridge/SplitScreenLayout.tsx` — top-nav strip gains right-aligned `<AvatarDropdown onTeamClick={() => setDirective({ type: 'org_users', orgId })} />`. OrgSwitcher stays top-left.
- `src/components/bridge/MainframeRail.tsx` — add Activity icon below existing nav icons. Click fires navigation to `/<locale>/<orgId>/agent/actions`.
- **New:** `src/app/[locale]/[orgId]/agent/actions/page.tsx` — minimal placeholder. Server component. Renders "No AI actions yet — this page will show the agent's proposed entries once you start using the system." Authenticated-only (the app's existing layout enforces auth at this route prefix); no role gate. Session 8 adds the query + role gate when it replaces this with the functional queue. ~15 LOC.

**Welcome page:** no changes expected. Compatibility verification only — the AgentChatPanel rewrite from Commit 3 must continue to work correctly inside the welcome page's custom layout. If the rewrite breaks welcome-page behavior, the breakage is a Commit 3 bug, not a Commit 4 scope item.

**Tests:**
- **New:** `tests/integration/avatarDropdownMenuBehavior.test.ts` — controller sees all 4 items; non-controller sees 3 (no Org settings); sign-out fires Supabase call + navigation.
- Placeholder page is not separately tested — it's 15 LOC of static render behind the existing route-prefix auth layout (covered by existing auth integration tests from prior sessions).

**Estimated size:** ~0.5 day.

---

### Commit 5 — Canvas context click handlers + EC-19 tests

**Job:** bidirectional canvas state minimal pattern. Two click surfaces, one pure reducer, one request-body field, two automated tests + three manual EC scenarios.

**Pre-existing server-side support (for context):** master §5.1 already defines `canvas_context?: CanvasContext` as part of `handleUserMessage` input. The orchestrator already accepts it. `canvasContextSuffix` at `src/agent/prompts/suffixes/canvasContextSuffix.ts` already renders the subordinate-framing suffix verbatim from `canvas_context_injection.md`. Session 3 landed the suffix; Session 5 threaded it through `buildSystemPrompt`. The client-side plumbing is the remaining work — building the `CanvasContext` object at message-send time and including it in the `/api/agent/message` request body.

**Files touched:**
- `src/components/canvas/JournalEntryListView.tsx` — extend existing row onClick to ALSO call `setSelectedEntity({ type: 'journal_entry', id, display_name })` before firing the navigation directive.
- `src/components/canvas/ChartOfAccountsView.tsx` — add row onClick that calls `setSelectedEntity({ type: 'account', id, display_name })`. No existing navigation on account rows (verify at execution), so this is selection-only.
- **New:** `src/agent/canvas/reduceSelection.ts` — pure function `reduceSelection(current: SelectedEntity | undefined, event: CanvasEvent): SelectedEntity | undefined`. Events: `{ type: 'select', entity }`, `{ type: 'directive_change', new_directive }`, `{ type: 'clear' }`. Implements Pre-decision 10's type-compatibility rule.
- `src/components/bridge/SplitScreenLayout.tsx` — extend state to include `selectedEntity`. Dispatch events through `reduceSelection`. Pass `selectedEntity` + `setSelectedEntity` to children.
- `src/components/bridge/AgentChatPanel.tsx` — in `send()`, build `canvas_context: { current_directive, selected_entity }` from props and include in request body.

**Tests:**
- **New:** `tests/integration/canvasContextReducer.test.ts` — pure-function tests covering: select on empty, select with existing (overrides), directive change compatible (keeps), directive change incompatible (clears), explicit clear. ~6 it-blocks.
- **New:** `tests/integration/apiAgentMessageCanvasContextPassthrough.test.ts` — POST to `/api/agent/message` with populated canvas_context; mock orchestrator; assert orchestrator was called with matching `canvas_context` shape. With empty canvas_context: assert orchestrator was called without the field (or with `undefined`).
- **Existing** CA-50 at `tests/integration/buildSystemPromptCanvas.test.ts` already covers the prompt-injection layer. No new test needed there.

**EC-19 coverage split (per canvas_context_injection.md §Over-Anchoring Test):**
- **Client-side contract** (automated, above): shape, reducer, passthrough. Covers the "does the client promise to the orchestrator what it says it does" surface.
- **Agent-side behavior** (manual, logged in friction-journal): the three scenarios (a) under-anchored, (b) over-anchored, (c) clarification — run against real Claude per the brief's scenario specifications. Same class as EC-20's smoke scenarios.
- **Both required** for EC-19 pass; the 27-EC matrix in Session 8's closeout should row-break them as "EC-19a (automated): <pass>" + "EC-19b (manual): <pass>" for clarity.

**Estimated size:** ~0.5 day.

---

### Commit 6 — Docs + closeout + Session 8 handoff

Standard closeout commit. Includes:
- Session 7 retrospective entry in `docs/07_governance/friction-journal.md`.
- Updates to `docs/09_briefs/CURRENT_STATE.md` with Session 7 completion.
- **Session 8 handoff note naming the scope carried forward:** Session 8 gains a scope item beyond its original verification-and-closeout framing — the functional AI Action Review queue page at `src/app/[locale]/[orgId]/agent/actions/page.tsx`, required for EC-8 ("the 20 Phase 1.2 agent entries all appear correctly in the AI Action Review queue") to pass. Commit 4's placeholder is a temporary landing pad; Session 8 replaces it with a real query-backed page (~80-120 LOC + any needed `ai_actions` query service). Session 8 planning should account for this alongside the 27-EC matrix, 20-entry gate, and adversarial test.
- Any convention candidates staged (not codified — codification requires founder discipline and typically happens at Session 8 retrospective).
- No feature changes.

---

## 5. Exit criteria covered

| EC | Source | Covered by |
|---|---|---|
| EC-14 | master §20 line 1303 | Commit 2 (ProposedEntryCard renders all fields on a real entry; partially manual via screenshot commit + partially automated via field-rendering tests) |
| EC-16 | master §20 line 1305 | Commit 3 (mid-conversation API failure: banner treatment + server-side stale marking from prior sessions) |
| EC-17 | master §20 line 1306 | Commit 1 strengthens (params validation at orchestrator boundary); already passing from Session 5, ship-verified |
| EC-19 | master §20 line 1308 / canvas_context_injection.md | Commit 5 (EC-19a automated client-side + EC-19b manual agent-side) |
| EC-27 | master §20 line 1321 | Commit 2 (ProposedEntryCard migration: confidence chip removed, policy_outcome rendered, MoneyAmount strings) |

**Note:** the avatar dropdown / sign-out affordance (Commit 4), the Activity icon (Commit 4), and the placeholder review queue page (Commit 4) do not have master-level EC numbers. Master §14.6 names them as UI additions; the EC-20 closeout's production-readiness gap flagged the sign-out affordance as Session 7 scope. These are Session 7 deliverables without exit-gate status. Session 8's 27-EC matrix should list them as unnumbered shipping items for bookkeeping completeness.

EC-8 (the 20-entry review queue) is explicitly NOT a Session 7 deliverable — its satisfaction requires the functional queue page deferred to Session 8 (see §9) plus the 20 real entries that Phase 1.3 produces.

---

## 6. Test coverage addition summary

- Commit 1: 1 new test file (params closure), 1 existing test file updated (template id closure shape)
- Commit 2: 2 new test files (schema acceptance, reject endpoint), 1 existing test extended (`canvasDirectiveSchemaExtensions.test.ts` / CA-74)
- Commit 3: 2 new test files (conversation load, suggested prompts). Error UI verified manually during founder review.
- Commit 4: 1 new test file (avatar dropdown behavior). Placeholder page not separately tested.
- Commit 5: 2 new test files (reducer, API passthrough)

**Total:** 8 new test files. Category A floor tests remain unchanged from Session 6's list (the five-test `agent:floor` script is stable).

---

## 7. Commit cadence + split-point

1. Commit 1 → verify `pnpm agent:validate` → founder review → Commit 1 lands
2. Commit 2 → verify → founder review → migration 120 blast-radius grep (re-run at execution to catch any new references since draft) → Commit 2 lands
3. Commit 3 → verify → founder review → **split-point check**: if wall-clock past day 2, declare Session 7 complete with Commits 4-5 deferred to Session 7.1; otherwise continue
4. Commit 4 → verify → founder review → Commit 4 lands
5. Commit 5 → verify → EC-19 manual scenarios run → founder review → Commit 5 lands
6. Commit 6 → retrospective + CURRENT_STATE update + Session 8 handoff note → lands

Each commit has a founder review gate per the Session 6 pattern. Review gates cover: diff review, test-pass verification, Convention #8 identity-assertion spot-check for the commit's claims.

---

## 8. Stop conditions

- `pnpm test` fails at any commit boundary: fix before proceeding.
- Migration 120 blast-radius grep returns > 5 sites at execution: fall back to naming-preservation option per Pre-decision 3. (Draft grep found 1 site; execution grep is a sanity-check repeat.)
- Convention #8 pre-commit grep surfaces any identity-assertion drift in a commit's scope: correct before commit.
- AgentChatPanel rewrite breaks the welcome page (Commit 3): investigate as a Commit 3 bug; do not punt to Commit 4.
- EC-19 manual scenarios fail on agent-side behavior: STOP, investigate as a prompt-engineering issue. System-prompt text in `canvasContextSuffix` is the likely cause. Do not ship Commit 5 without all three scenarios passing.
- Wall-clock past day 2 at end of Commit 3: this is the split-point signal, not a hard stop. Founder-discretion call to fire the split.

---

## 9. Open items / deferred

**Shipped in Session 8, not Session 7:**
- **Functional AI Action Review queue page** (`src/app/[locale]/[orgId]/agent/actions/page.tsx` — replacing Commit 4's placeholder). Query `ai_actions` for the current org, render rows with `status` + `timestamp` + `idempotency_key` + cross-link to the journal entry when `status = 'confirmed'`. Required for EC-8 ("the 20 Phase 1.2 agent entries all appear correctly in the AI Action Review queue"). Session 8 scope, ~80-120 LOC + any needed `ai_actions` query service. Named in Commit 6's handoff note.

**Not shipped in Session 7, named for Phase 2 triage:**
- Scroll position restoration across page refreshes (Phase 2 UX enhancement).
- Optimistic UI for card resolution (Pre-decision 7 pure-derivation + per-card isSubmitting is the Phase 1.2 answer; optimistic is Phase 2 if Phase 1.3 friction surfaces it).
- Pinned "currently proposed" panel for long transcripts — additive when scroll-past becomes a real problem.
- Context-aware post-turn suggestions — Phase 2, tied to data-driven suggestion infrastructure.
- Rich canvas_context interaction (pills, debouncing, persistence across navigation) — Phase 2 canvas design pass.
- Intercompany `reciprocal_entry_preview` schema — Phase 2, when AP Agent produces them.
- Resend-invitation UI — Session 7 polish backlog observation from Session 6; pairs naturally with Phase 2 "Pending invitations list."
- Session cleanup cron for stale `agent_sessions` rows (Q15 — 30-day TTL still manual).
- Streaming responses (Q14 — confirmed batch for Phase 1.2).
- Message-endpoint idempotency (Pre-decision 6's deferred mitigation if duplicate-exchange friction surfaces in Phase 1.3).
- Service-layer refactor of `/api/agent/confirm` + `/api/agent/reject` into `src/services/ai_actions/` (Phase 2 cleanup if other consumers emerge).
- `fr-CA.json` / `zh-Hant.json` placeholder parity tests against `en.json` (Commit 1 tests against `en.json` only; cross-locale parity is Phase 2 if translation work begins in earnest).

---

## 10. Pre-freeze verification results

Convention #8 grep pass completed at draft time (2026-04-19, session transcript). **33 identity assertions verified** against shipped code at anchor SHA 2b22529. Summary:

**Clean verifications (27):**
- File paths: `validTemplateIds.ts`, `proposedEntryCard.ts` (type), `canvasDirective.schema.ts`, `money.schema.ts`, all three locale files, `AgentChatPanel.tsx`, `SplitScreenLayout.tsx`, `MainframeRail.tsx`, `SuggestedPrompts.tsx`, `agentTemplateIdSetClosure.test.ts`, `buildSystemPromptCanvas.test.ts` (CA-50), `contextualCanvasDirectiveDispatch.test.ts` (CA-80), `canvas_context_injection.md`.
- Constants: `VALID_RESPONSE_TEMPLATE_IDS`, `UI_ONLY_AGENT_KEYS`, `proposedEntryCardPlaceholder = z.unknown()` at line 17, `MoneyAmountSchema`, `canvasContextSuffix` function at `canvasContextSuffix.ts:22`, `validTemplateIdsSection` function at `validTemplateIds.ts:63`.
- Routes: `/api/agent/confirm` exists (inline pattern), `/api/agent/message` exists, `/api/agent/conversation` does not exist (new file expected), `/api/agent/reject` does not exist (new file expected).
- EC numbers: EC-14 (line 1303), EC-16 (line 1305), EC-17 (line 1306), EC-19 (line 1308), EC-27 (line 1321) — all in master §20.
- Schema: `ai_action_status` enum values `pending`, `confirmed`, `rejected`, `auto_posted`, `stale` (5 values; `edited` is migration 120's add). `ai_actions.rejection_reason` column exists. `agent_sessions.conversation` is JSONB NOT NULL DEFAULT `'[]'::jsonb`. `agent_sessions.org_id` is nullable (migration 20240118000000 drops NOT NULL).
- Behavior: no Zustand dep in package.json. Welcome page at `src/app/[locale]/welcome/page.tsx` doesn't import SplitScreenLayout. Onboarding persona prompts don't emit `canvas_directive`. Onboarding-complete code path at `src/agent/orchestrator/index.ts:505-507` (the `if (onboardingComplete)` branch). `ui_architecture.md` line 25 quoted verbatim.
- `rejection_reason` rename blast radius: 1 code file (`src/db/types.ts`, 3 type references), 0 tests, 0 production consumers. Trivial rename.

**Path corrections applied (6):**
- Persona prompts: `src/agent/prompts/personas/` (not `personaPrompts/`) — files: `controller.ts`, `ap_specialist.ts`, `executive.ts`, plus `_sharedSections.ts` and `_identityAndTools.ts`.
- `ProposedEntryCard.tsx`: `src/components/` (not `src/components/bridge/`).
- `JournalEntryListView.tsx`: `src/components/canvas/` (not `src/components/bridge/`).
- `ChartOfAccountsView.tsx`: `src/components/canvas/` (not `src/components/bridge/`).
- `canvasContextSuffix` now specified at `src/agent/prompts/suffixes/canvasContextSuffix.ts` (previously unspecified).
- CA-74 now specified as `tests/integration/canvasDirectiveSchemaExtensions.test.ts` (previously vague).

**Material gap resolved (1):**
- `src/app/[locale]/[orgId]/agent/actions/` exists as empty directory (Phase 1.1 shipped slot, not page). Resolution: Commit 4 scope expanded to include a ~15 LOC placeholder page. Functional AI Action Review queue deferred to Session 8 as EC-8 preparation (see §9 and Commit 6 handoff).

**Scope estimate refinement (1):**
- Pre-decision 11b: orchestrator onboarding-complete patch refined from "~5 LOC" to "~10 LOC" after grep of the actual code path. The orchestrator doesn't have the target org_id in scope at completion time; it must be queried from memberships. Implementation shape included in Pre-decision 11b.

---

**End of draft v3. Ready for founder commit gate.**
