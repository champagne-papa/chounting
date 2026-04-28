# Frontend Architecture — Findings Log

**Scanner:** Frontend Architecture Category  
**Phase:** End of Phase 1.1 / Phase 1.2 Integration  
**Date:** 2026-04-27  
**Hypotheses investigated:** H-03, H-11, H-15, H-16, H-18

---

## Hypothesis Responses

### H-03: Canvas_directive schema vs persisted directive shape mismatch

- **Status:** Inconclusive
- **Evidence:** 
  - `src/shared/schemas/canvas/canvasDirective.schema.ts:21-112` uses discriminated union with `.strict()` on every variant, rejecting unknown fields.
  - `src/shared/types/canvasDirective.ts:6-39` defines TS type with Phase 1.2 additions (user_profile, org_profile, org_users, invite_user, welcome at lines 27-31) and Phase 2 stubs (ap_queue, vendor_detail, etc. at lines 35-39).
  - Schema variants added incrementally: base Phase 1.1 directives (lines 23-90), Session 6 form-escape surfaces (lines 92-97), Phase 2 stubs (lines 99-111).
  - No `.passthrough()` exists; schema enforces exact field match.
  - Cannot confirm whether older persisted directives exist or whether migration/backfill occurred, as no integration tests were examined that read/replay directives from `ai_actions.canvas_directive`.
- **Notes for other scanners:** Backend Design & API and Data Layer & Schema scanners should verify: (1) whether `ai_actions.canvas_directive` rows exist with older schema shapes, (2) whether migrations backfilled existing rows when schema evolved, (3) whether load-time validation provides downgrade-safe parsing.

### H-11: MFA enforcement middleware exists but is unwired to the request path

- **Status:** Confirmed
- **Evidence:**
  - `src/middleware.ts` (checked via grep) performs i18n routing only.
  - `src/middleware/mfaEnforcement.ts` exists and exports `enforceMfa` (external review C1 confirms).
  - Search results show no import of `enforceMfa` in `middleware.ts` or any production code path.
  - Test at `tests/integration/mfaEnforcementMiddleware.test.ts` header explicitly states "the actual redirect behavior is verified manually in the browser."
- **Notes for other scanners:** Test Coverage & Gaps should verify whether the test suite covers only column-flip semantics or whether any programmatic redirect verification exists elsewhere.

### H-15: Agent tool selection hints insufficient for disambiguating cross-org access in Mode B

- **Status:** Inconclusive (relates to backend gap H-04)
- **Evidence:**
  - Frontend component AgentChatPanel (`src/components/bridge/AgentChatPanel.tsx:72-466`) sends canvas_context alongside user message (line 204-205) when grounding context is available.
  - ProposedEntryCard (`src/components/ProposedEntryCard.tsx:46-200+`) renders card and calls `/api/agent/confirm` (line 58), `/api/agent/reject` (line 129) with org_id from the card.
  - Form handling in JournalEntryForm routes to `/api/orgs/${orgId}/journal-entries` (line 223), passing orgId from props.
  - Frontend cannot independently verify whether the backend service methods (chartOfAccountsService.get, periodService.isOpen) enforce org membership checks; Backend Design & API scanner must confirm whether the service-layer gaps remain.
- **Notes for other scanners:** Cross-reference Backend Design & API hypothesis H-04 findings. Frontend assumes the service layer guards correctly.

### H-16: User-controlled strings interpolated into system prompts without length limits or escaping

- **Status:** Inconclusive (out of Frontend Architecture scope)
- **Evidence:**
  - Frontend components (JournalEntryForm, ProposedEntryCard, AgentChatPanel) accept user input from form fields and user messages.
  - JournalEntryForm (`src/components/canvas/JournalEntryForm.tsx:36-44`) defines form schema with `description: z.string().min(1, ...)` and `reference: z.string().optional()` — no maxLength constraint.
  - ProposedEntryLineSchema (`src/shared/schemas/accounting/proposedEntryCard.schema.ts:26-28`) allows `account_name: z.string()` and `description: z.string().optional()` with no length limit.
  - Frontend validation is form-level only; interpolation of user strings into system prompts happens at the backend/agent layer, not in these components.
  - Cannot assess prompt injection risk from frontend alone — Backend Design & API and Authorization & Access Control scanners must check agent prompt construction sites.
- **Notes for other scanners:** H-16 is a backend finding. Frontend can support it by adding form-level maxLength constraints on fields that flow into agent context (account names, descriptions, memos, displayName).

### H-18: Test coverage hole on malformed agent response shapes under context pressure

- **Status:** Confirmed (frontend component layer)
- **Evidence:**
  - AgentChatPanel (`src/components/bridge/AgentChatPanel.tsx:236-270`) expects response shape: `{ session_id, response: { template_id, params }, canvas_directive?, trace_id, onboarding_complete? }`.
  - Line 236-242 parses response and constructs card/pill/assistantTurn without explicit validation that the response matches the expected shape.
  - No try/catch wrapping the JSON parse (line 236) that would catch structurally invalid responses.
  - Frontend has no safeguard for AGENT_STRUCTURED_RESPONSE_INVALID or oversized responses; error handling stops at HTTP status checks (lines 213-233).
- **Notes for other scanners:** Test Coverage & Gaps should verify whether integration tests exist that mock structurally invalid agent responses. Frontend readiness depends on backend returning well-formed JSON.

---

## Findings

### FRONTEND-001: Canvas data-refresh mechanism absent post-mutation

- **Severity:** High
- **Description:**
  The canvas (via ContextualCanvas.tsx) maintains local navigation history and renders directives, but when the agent triggers a mutation via ProposedEntryCard (approve/reject/edit), there is no mechanism to invalidate or refresh the underlying data for list views or reports that may be displayed. After an approval, if the user navigates back to a journal_entry_list view, the list state is not refreshed from the server; it retains stale data from the initial mount fetch.
  
  JournalEntryListView and other data-displaying canvas components fetch data via useEffect at mount time (e.g., `src/components/canvas/JournalEntryForm.tsx:129-147`), but neither the canvas orchestrator nor the bridge shell has a data-invalidation API. When ProposedEntryCard calls onNavigate to switch directives (line 75-80), it does not signal a cache invalidation to sibling views.
  
  In Phase 1.2, this is acceptable because mutations are sparse and the session lifetime is short. In Phase 2, with more agent-driven mutations and longer sessions, stale data will accumulate.

- **Evidence:**
  - `src/components/bridge/ContextualCanvas.tsx:55-113` — history state is local; no invalidation hook.
  - `src/components/ProposedEntryCard.tsx:75-80` — onNavigate callback fires after approval but does not trigger data refresh.
  - `src/components/canvas/JournalEntryForm.tsx:129-147` — data fetch runs only at mount; no revalidate or refresh trigger.
  - `src/components/canvas/JournalEntryListView.tsx` (inferred from pattern) — likely uses same mount-time fetch pattern.
  - No grep hits for "revalidate", "invalidate", or "refresh" in bridge components.

- **Consequence:**
  Users may see stale list views or report data after agent mutations. During Phase 1.2, manual navigation (user clicking back) refreshes the view on re-render. Phase 2 will require either a proper cache invalidation layer or explicit full-page refresh signals.

- **Cross-references:**
  - Related to Backend Design & API (the mutation endpoints should return updated state for optimistic updates, but frontend architecture doesn't support it yet).
  - Phase 1.2 obligations may include designing a data-invalidation pattern.

---

### FRONTEND-002: Error handling lacks structured type mirroring ServiceError backend pattern

- **Severity:** Medium
- **Description:**
  Frontend components handle API errors as ad-hoc string messages or HTTP status codes. JournalEntryForm (`src/components/canvas/JournalEntryForm.tsx:229-256`) handles 400 (validation details), 422 (generic message), 401 (redirect), and other statuses, but each component improvises its error schema. There is no frontend analog to the backend's ServiceError type that standardizes error codes, context, and retry-ability.
  
  ProposedEntryCard and AgentChatPanel similarly catch and display errors as strings. When the backend emits a structured error code (e.g., "PERIOD_LOCKED", "CROSS_ORG_ACCESS_DENIED"), the frontend cannot parse it because no shared error schema exists. This limits the ability to surface context-aware error messages or implement retry logic that depends on error categorization.

- **Evidence:**
  - `src/components/canvas/JournalEntryForm.tsx:230-245` — status-based if/else chain; errorBody.message extracted as string.
  - `src/components/ProposedEntryCard.tsx:67-68` — `detail.message ?? 'Confirm failed (${res.status})'` — no error code parsing.
  - `src/components/bridge/AgentChatPanel.tsx:213-233` — error handling dispatched on HTTP status; no error code extraction.
  - No shared error type definition in `src/shared/types/` or `src/shared/schemas/` for API error responses.

- **Consequence:**
  Error UX is brittle. Backend changes to error messages or codes break client-side error handling silently. Phase 1.2 can work around this with generic error messages, but Phase 2 will require finer error handling for multi-step workflows (approvals, rejections, intercompany flows).

- **Cross-references:**
  - Backend Design & API should define a shared error schema and document it in an OpenAPI or ADR.
  - Related to the fourth boundary-bug hunt (type mismatch at fetch boundary).

---

### FRONTEND-003: Form-to-API serialization preserves money-as-string discipline but lacks inline validation

- **Severity:** Low
- **Description:**
  JournalEntryForm correctly uses MoneyAmountSchema (branded string type) throughout form state and converts via formStateToServiceInput (`src/components/canvas/JournalEntryForm.tsx:79-107`). Lines 84-95 build debit_amount/credit_amount as MoneyAmount strings. The form balancing check (lines 175-213) uses addMoney and eqMoney helpers, which work on the branded strings directly, so no floating-point arithmetic creeps in.
  
  However, the form relies on Zod client-side validation of MoneyAmountSchema (line 32, 181), which is correct, but there is no visual feedback (red underline, error message) if the user enters an amount that fails the schema during entry. The error only surfaces on submit. For a financial form, this is suboptimal UX.

- **Evidence:**
  - `src/components/canvas/JournalEntryForm.tsx:32` — MoneyAmountSchema validation is part of the schema but errors don't surface until form.handleSubmit.
  - `src/components/canvas/LineEditor.tsx` (referenced at import) likely handles individual line editing; without seeing it, the pattern is unclear.
  - No real-time validation feedback in the visible JournalEntryForm snippet.

- **Consequence:**
  Users may not discover invalid amount formats until they submit, causing friction. The discipline of money-as-string is maintained, so the risk is UX-only, not data correctness.

- **Cross-references:**
  - UI/UX improvement, not a blocking issue for Phase 1.2.

---

### FRONTEND-004: ProposedEntryCard schema allows arbitrary string fields without length bounds

- **Severity:** Medium
- **Description:**
  ProposedEntryCardSchema (`src/shared/schemas/accounting/proposedEntryCard.schema.ts:44-64`) defines account_name, description, and other fields as bare `z.string()` with no maxLength constraint. These fields are rendered in the UI (ProposedEntryCard.tsx shows lines, descriptions) and can originate from agent generation or user import. If an attacker or misbehaving agent generates a 10MB description field, the frontend will attempt to render it, causing browser memory/performance issues.
  
  The schema is strict (rejecting extra keys), but does not constrain the size of string fields that are displayed. This is a low-severity concern in Phase 1.2 (controlled agent, trusted org members) but becomes a vector in Phase 2 if Bill/Payment cards are imported from external data sources.

- **Evidence:**
  - `src/shared/schemas/accounting/proposedEntryCard.schema.ts:26-32` — ProposedEntryLineSchema has `account_code: z.string()`, `account_name: z.string()`, `description: z.string().optional()` with no .max().
  - `src/shared/schemas/accounting/proposedEntryCard.schema.ts:47-50` — similarly, `org_name: z.string()`, `description: z.string()` with no bounds.
  - Frontend components (ProposedEntryCard.tsx) render these directly to the DOM without truncation or length checks.

- **Consequence:**
  DoS-able via oversized string fields. Not an immediate Phase 1.2 issue but should be addressed before Phase 2 external-import flows.

- **Cross-references:**
  - Related to Data Layer & Schema (schema design should include sensible bounds).
  - Concern 15 (prompt injection) is related but distinct — this is about rendering large strings, not escaping.

---

### FRONTEND-005: AgentChatPanel response shape assumed without validation

- **Severity:** Medium
- **Description:**
  AgentChatPanel (line 236) destructures the response as `{ session_id, response: { template_id, params }, canvas_directive?, trace_id, onboarding_complete? }` without Zod validation or runtime type guards. If the backend emits an unexpected shape (e.g., missing trace_id, or response is null), the component will silently produce undefined values and render incorrect state.
  
  Line 254 constructs an assistantTurn assuming response.template_id exists; if the backend omits it, template_id will be undefined, causing renderAssistantText (line 370) to fail silently and render the template_id string itself instead of the interpolated message.

- **Evidence:**
  - `src/components/bridge/AgentChatPanel.tsx:236-270` — JSON parse followed by destructuring, no validation.
  - `src/shared/types/chatTurn.ts` (not read) likely defines the ChatTurnAssistant type, but no runtime schema exists to catch shape mismatches at the fetch boundary.
  - Related to the fourth boundary-bug hunt pattern: external systems (backend API) lie to the type system because TypeScript types are compile-time only.

- **Consequence:**
  Silent rendering errors if the API response shape changes. The component won't throw; it will render gracefully but with wrong data. In Phase 2, with more complex response shapes, this becomes a maintenance hazard.

- **Cross-references:**
  - Fourth boundary-bug hunt (compile-time types vs runtime data).
  - Should add a Zod schema for the agent response shape and validate at fetch time.

---

### FRONTEND-006: Hardcoded locale fallback in JournalEntryForm submit error

- **Severity:** Low
- **Description:**
  JournalEntryForm line 240 contains `window.location.href = '/en/sign-in'` — a hardcoded locale assumption. If the user's active locale is 'fr-CA' or 'zh-Hant', they are redirected to the English sign-in page instead of their language variant. The locale is available in the component's context (params.locale in AgentChatPanel line 121), but JournalEntryForm does not receive it as a prop.

- **Evidence:**
  - `src/components/canvas/JournalEntryForm.tsx:240` — hardcoded '/en/sign-in'.
  - `src/components/bridge/AgentChatPanel.tsx:120-121` — locale is extracted from params but not passed down to child components that need it.
  - `src/app/[locale]/layout.tsx:23-24` — the locale is validated against LOCALES allowlist in the layout, confirming the framework supports multiple locales.

- **Consequence:**
  User experience regression if the auth session expires during form submission. Low-priority bug; locale enforcement is per-path, so even the hardcoded link will work functionally (it redirects, then i18n routes based on browser Accept-Language). But user-facing text will be in the wrong language.

- **Cross-references:**
  - Related to Internationalization category (i18n wiring).
  - Should pass locale as a prop or use useParams hook (which AgentChatPanel already does).

---

### FRONTEND-007: AiActionReviewTable state rendering matches schema but lacks stale-row invalidation

- **Severity:** Low
- **Description:**
  AiActionReviewTable (`src/components/canvas/AiActionReviewTable.tsx:46-100`) is a server component that renders ai_actions rows with status indicators (confirmed, rejected, pending, stale, edited). The status pill rendering (lines 27-33) correctly maps each status to a visual style. However, the component receives a static rows array passed from the server; there is no client-side polling or WebSocket subscription to refresh the status when a row's status changes on the backend.
  
  This is acceptable for the current read-only agent-actions page, but if Phase 2 adds interactive approval flows (approve/reject buttons directly in the table), the row state will become stale without a refresh mechanism.

- **Evidence:**
  - `src/components/canvas/AiActionReviewTable.tsx:46-100` — pure render, no state updates or data-fetching hooks.
  - Status mapping at lines 27-33 covers confirmed, rejected, pending, stale, edited — aligns with the agent's ai_actions.status enum.
  - Component interface (line 21-24) accepts rows and orgId; rows are static.

- **Consequence:**
  Phase 2 approval workflows will require adding polling or pub/sub to keep the table state in sync. Current Phase 1.2 use is safe because the page is read-only.

- **Cross-references:**
  - Related to the data-refresh finding (FRONTEND-001). This is a specific instance of the canvas refresh problem applied to a server component.

---

### FRONTEND-008: Form layout nesting and routing structure align cleanly but lack error boundaries

- **Severity:** Low
- **Description:**
  The routing structure (`src/app/[locale]/layout.tsx` → `[locale]/[orgId]/layout.tsx` → various pages) correctly nests route segments, and the bridge/canvas component split mirrors the information architecture (rail on left, agent panel, canvas on right). The ContextualCanvas directive switch (src/components/bridge/ContextualCanvas.tsx:115-199) uses a discriminated union to route to the correct component, and all branches are covered (with ComingSoonPlaceholder for Phase 2 stubs).
  
  However, there is no error boundary wrapping the canvas or the agent panel. If a child component throws, the error bubbles to the root layout with no graceful fallback. The component-level error handling (try/catch in fetch callbacks) protects against async errors, but synchronous render errors will crash the shell.

- **Evidence:**
  - `src/components/bridge/ContextualCanvas.tsx:115-199` — exhaustive switch with all types; no error boundary.
  - `src/components/bridge/AgentChatPanel.tsx:376-465` — try/catch wraps fetch, but component render errors would propagate.
  - `src/app/layout.tsx` — no ErrorBoundary wrapper around children.
  - `src/components/bridge/SplitScreenLayout.tsx:74` — single try/catch for a useEffect (auth fetch), not component-level.

- **Consequence:**
  A rendering error in any canvas component or the agent panel will crash the entire shell, forcing a full-page reload. Phase 1.2 is stable enough that this is rare, but Phase 2 with more components increases the surface area. Best practice would add an error boundary at the SplitScreenLayout level.

- **Cross-references:**
  - UI/UX robustness improvement, not a blocking issue.
  - Can be addressed as a Phase 2 hardening task.

---

## Category Summary

Frontend architecture is well-structured: the bridge/canvas split is clean, component boundaries are clear, and form handling respects the money-as-string invariant end-to-end. The primary gap is the absence of a data-refresh/cache-invalidation mechanism for when the agent mutates data — this will become critical in Phase 2 when mutations are more frequent and session lifetimes extend. Secondary gaps are type safety at fetch boundaries (missing Zod schemas for API responses) and error display (lack of structured error types mirroring the backend's ServiceError pattern). Three findings are inherited from Phase 1.1 (H-11 MFA middleware unwired, form-level i18n, error boundaries) and confirm prior analysis. Schema strictness and money-handling discipline are strong. The audit did not discover new fourth-boundary-bug instances in this category, though AgentChatPanel's unvalidated response shape and ProposedEntryCardSchema's unbounded string fields are mild instances of the pattern.

**Self-audit bias note:** The reviewer helped author Phase 1.2 code and sessions 5–8 agent integration. Familiarity may have softened assessments of the component split and canvas directive routing. Independent code review of the mutation paths (ProposedEntryCard approval flow, JournalEntryForm submission) during Phase 3 synthesis is recommended to verify no subtle state-machine gaps exist.

