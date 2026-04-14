# Frontend Architecture — Findings Log

Scanner: Frontend Architecture
Phase: End of Phase 1.1
Date: 2026-04-13
Hypotheses investigated: H-05, H-07, H-12, H-13, H-15

## Hypothesis Responses

### H-05: Inconsistent response.ok checks in frontend fetch chains — frontend angle

- **Status:** Confirmed (the frontend architectural concern is the absence of a shared fetch wrapper)
- **Evidence:** Scan 1 (BACKEND-004) partially confirmed the hypothesis: reference data fetches (periods, accounts, tax codes in `JournalEntryForm.tsx:131-133`; period fetches in `BasicPLView.tsx:40-41` and `BasicTrialBalanceView.tsx:29-30`) use `.then((r) => r.json())` without checking `response.ok`. Primary data fetches and all POST submissions do check `response.ok`. The frontend architectural concern is that each component independently decides whether to check `response.ok`, with no shared fetch utility enforcing it. There are 14 `fetch()` calls across 8 canvas/bridge components, each with its own error handling approach. The three patterns are: (a) check `response.ok` and throw on failure (detail views, list view, P&L/TB data fetches), (b) parse without checking (reference data dropdowns), (c) POST-specific error mapping (form submissions). A shared fetch wrapper would enforce consistent error handling and eliminate the ad-hoc pattern.
- **Notes for other scanners:** Already covered by BACKEND-004. The frontend angle is about the missing abstraction, not individual fetch calls.

### H-07: JournalEntryDetail uses plain string instead of branded MoneyAmount — frontend angle

- **Status:** Confirmed (type casts required at ReversalForm boundary)
- **Evidence:** `ReversalForm.tsx:149-158` casts `sourceEntry.journal_lines[].debit_amount` (plain `string`) to `MoneyAmount` via `as MoneyAmount`. The same pattern applies to `credit_amount`, `amount_original`, `amount_cad`, and `fx_rate as FxRate`. These casts are safe at runtime because `journalEntryService.get()` coerces values through `toMoneyAmount`/`toFxRate` at lines 415-422. But the compiler cannot verify this — the `JournalEntryDetail` type declares these fields as `string`, not `MoneyAmount`. Similarly, `JournalEntryDetailView.tsx:46` uses `line.debit_amount as MoneyAmount` for the `addMoney` call in the totals computation. The frontend trusts that the API response contains canonical money strings, and TypeScript cannot enforce this trust at compile time.
- **Notes for other scanners:** Already covered by BACKEND-008. The fix is in the service layer (use `MoneyAmount` in the `JournalEntryDetail` type), not in the frontend.

### H-12: Hardcoded 'CAD' currency in JournalEntryForm

- **Status:** Confirmed (known deferral, architecturally localized)
- **Evidence:** `JournalEntryForm.tsx:89-93` hardcodes `currency: 'CAD'`, `amount_original: amount`, `amount_cad: amount`, and `fx_rate: oneRate()` in `formStateToServiceInput`. Multi-currency is deferred to Phase 4 per PLAN.md Section 8b, and `phase-1.2-obligations.md` lists "Multi-currency FX wiring (Phase 4 per PLAN.md §8b)" under Phase 2+ deferrals. The hardcoding is localized to the form's transform function — the service layer, Zod schemas, and database all accept arbitrary currencies and FX rates. When Phase 4 arrives, the form needs a currency dropdown and an FX rate input, and `formStateToServiceInput` needs to stop hardcoding. The change is self-contained.
- **Notes for other scanners:** Documented deferral. No new finding.

### H-13: Client components import service-layer types — secret exposure risk

- **Status:** Refuted (all imports are `import type`, confirmed by Scan 3)
- **Evidence:** Scan 3 (SECURITY H-13 response) verified all imports from `@/services/` in `src/components/` use `import type` syntax. Frontend components that import from service files: `ReversalForm.tsx:13-14` (`import type { JournalEntryDetail }`), `JournalEntryListView.tsx:5` (`import type { JournalEntryListItem }`), `BasicPLView.tsx:6` (`import type { PLRow }`), `BasicTrialBalanceView.tsx:5-6` (`import type { TrialBalanceRow }`), `JournalEntryDetailView.tsx:5` (`import type { JournalEntryDetail }`). All are `import type`, erased at compile time. The `'use client'` directive is correctly applied to all canvas and bridge components, and Next.js server/client boundary enforcement would produce a build error if any value import from a server module occurred.

  From the broader client/server boundary perspective: no `'use client'` directive is missing. All components that use hooks, browser APIs, or event handlers have the directive. The server components (`OrgPage`, `LocaleLayout`, `RootLayout`) correctly avoid client-only features. No hydration mismatch risk detected — `OrgPage` passes `orgId` as a prop to `SplitScreenLayout`, which is a client component, and the data is fetched client-side via `useEffect`.
- **Notes for other scanners:** Clean. No architectural concern.

### H-15: Date serialization across boundaries — frontend angle

- **Status:** Inconclusive (no evidence of current breakage, frontend is consistent)
- **Evidence:** The `entry_date` field flows as follows: (1) HTML `<input type="date">` produces `YYYY-MM-DD` via native browser date picker, (2) Zod validates `z.string().regex(/^\d{4}-\d{2}-\d{2}$/)` in both `JournalEntryFormSchema` (line 37) and `ReversalFormSchema` (lines 27-29), (3) the API receives the string and passes it to the service, (4) PostgreSQL stores it as a `date` type, (5) PostgREST returns it as `YYYY-MM-DD`. The round-trip is consistent across all layers.

  The `ReversalForm` populates `entry_date` from `new Date().toISOString().slice(0, 10)` (line 97), not from the fetched entry's `entry_date`. This is correct — the reversal gets today's date by default, not the original entry's date. The source entry's `entry_date` is displayed read-only (line 250).

  The `JournalEntryForm` defaults `entry_date` to `new Date().toISOString().slice(0, 10)` (line 155). Both forms produce `YYYY-MM-DD` strings that match the Zod regex and the PostgreSQL `date` format. No layer transforms dates to ISO 8601 timestamps. The boundary is clean today.
- **Notes for other scanners:** Scan 2 (DATALAYER H-15) was also inconclusive from the data-layer side. No evidence of breakage from either direction.

## Findings

### FRONTEND-001: No canvas refresh mechanism after mutations — Phase 1.2 agent integration gap

- **Severity:** High
- **Description:** After a successful journal entry POST or reversal POST, the forms navigate away from themselves using `onNavigate` — `JournalEntryForm.tsx:249` navigates to `journal_entry_list`, and `ReversalForm.tsx:214-218` navigates to the new entry's detail view. This works for manual mutations because the navigation triggers a fresh `useEffect` fetch in the target component.

  However, there is no mechanism for a mutation in one part of the UI to trigger a refresh in another. The `SplitScreenLayout` manages canvas state via a single `useState<CanvasDirective>` (line 26). When the agent chat panel posts a journal entry in Phase 1.2, the canvas (which may be showing the journal entry list or a P&L report) has no way to know that data has changed. There is no event bus, no React context for mutation notifications, no query cache invalidation (no React Query / SWR / TanStack Query), and no Zustand or other global state store.

  The canvas components fetch data in `useEffect` keyed on `orgId` (and sometimes `selectedPeriodId`). A mutation from the chat panel doesn't change either key, so the data doesn't refresh. The user would see stale data until they manually navigate away and back.

  Phase 1.2 will need one of: (a) a lightweight event bus that canvas components subscribe to, (b) a state management library with cache invalidation (React Query is the natural fit for this fetch pattern), (c) a `refreshKey` counter in `SplitScreenLayout` that increments on mutation and is passed as a prop to canvas components. Option (c) is simplest and matches the existing architecture.

- **Evidence:**
  - `src/components/bridge/SplitScreenLayout.tsx:26` — single `useState<CanvasDirective>`, no mutation notification mechanism
  - `src/components/canvas/JournalEntryListView.tsx:17-33` — `useEffect` keyed on `[orgId]` only
  - `src/components/canvas/BasicPLView.tsx:54-87` — `useEffect` keyed on `[orgId, selectedPeriodId]`
  - `src/components/bridge/AgentChatPanel.tsx` — no mutation callback or event bus prop
  - No React Query, SWR, TanStack Query, or Zustand in `package.json` dependencies
- **Consequence:** Phase 1.2 agent-driven mutations will leave the canvas showing stale data. The user must manually navigate away and back to see the effect of an agent action. For an "AI-native" accounting platform where the agent is the primary interaction surface, stale-after-mutation is a trust-breaking UX failure.
- **Cross-references:**
  - Architecture Fit — ARCHFIT-003 noted agent extension points are clean but undocumented; this is the specific gap in the frontend extension point

### FRONTEND-002: ProposedEntryCard type uses `number` for money fields, violating CLAUDE.md Rule 3

- **Severity:** Medium
- **Description:** The `ProposedEntryCard` type in `src/shared/types/proposedEntryCard.ts:9-10` declares `debit: number` and `credit: number` in `ProposedEntryLine`. CLAUDE.md Rule 3 states: "Every field that represents money or an FX rate is a `z.string()` matching a strict decimal regex at the service boundary." The `ProposedEntryCard` is the type the agent will produce in Phase 1.2 to display proposed journal entries for user approval. If the agent generates these values as JavaScript numbers, they are subject to floating-point precision loss.

  The `ProposedEntryCard` component (`src/components/ProposedEntryCard.tsx`) is a Phase 1.1 placeholder shell — it renders `card.confidence` and `card.org_name` but doesn't display the money fields. The type was defined early (pre-v0.5.3, before the money-as-string rule was established) and hasn't been updated. The Zod schema that validates this type is listed as "Phase 1.2" in the file comment (line 4), so it hasn't been created yet.

  When Phase 1.2 creates the Zod schema, the `debit` and `credit` fields should use `MoneyAmountSchema` (string), not `z.number()`. But the existing TypeScript type will compile with either, because `number` and `string` are both valid — the mismatch will only surface if someone reads the type definition and follows it literally.

- **Evidence:**
  - `src/shared/types/proposedEntryCard.ts:9` — `debit: number` in `ProposedEntryLine`
  - `src/shared/types/proposedEntryCard.ts:10` — `credit: number` in `ProposedEntryLine`
  - CLAUDE.md Rule 3 — "Every field that represents money or an FX rate is a `z.string()`"
  - `src/shared/schemas/accounting/money.schema.ts:11-17` — `MoneyAmountSchema` is `z.string().regex(...)`
- **Consequence:** The Phase 1.2 agent implementation may follow this type definition and produce money values as JavaScript numbers, introducing floating-point precision loss into the proposed entry display. The fix is a one-line change (`debit: string` or `debit: MoneyAmount`), but it must happen before the Phase 1.2 Zod schema is written, or the schema may be designed around the wrong type.
- **Cross-references:**
  - BACKEND-002 (Scan 1) — same CLAUDE.md Rule 3 violation pattern (Number() instead of decimal.js)
  - Architecture Fit — ARCHFIT-003 noted agent extension points are undocumented; this type is one that needs updating

### FRONTEND-003: Reference data fetch errors are silently swallowed in JournalEntryForm

- **Severity:** Medium
- **Description:** `JournalEntryForm.tsx:128-145` fetches fiscal periods, chart of accounts, and tax codes in a `Promise.all`. The individual fetch calls use `.then((r) => r.json())` without checking `response.ok` (Scan 1 H-05). The outer `.catch()` on line 140 handles network errors by setting all three arrays to empty. But between these two error paths, there is a gap: if one of the three fetches returns a non-2xx response (e.g., 401 for expired session), `.json()` parses the error body, and the destructuring (`periodsData.periods ?? []`) produces an empty array. No error is displayed to the user. The form renders with empty dropdowns and no indication of what went wrong.

  This contrasts with the `ReversalForm.tsx:110-116`, which correctly checks `response.ok` on both fetch calls and throws an error that's caught and displayed as `loadError`. The JournalEntryForm's loading state manages a `loading` boolean but no `loadError` — the only error display is `formError`, which is set only during submission, not during initial data fetch.

  The user experience: on an expired session, the journal entry form shows empty period and account dropdowns with no error message. The "Post Entry" button is disabled (because `periods.length === 0`), but the user has no explanation for why periods are empty. The ReversalForm, by contrast, would show "Failed to load source entry: HTTP 401."

- **Evidence:**
  - `src/components/canvas/JournalEntryForm.tsx:131-133` — three fetches without `response.ok` check
  - `src/components/canvas/JournalEntryForm.tsx:140-144` — `.catch()` silently sets empty arrays
  - `src/components/canvas/JournalEntryForm.tsx:123` — `formError` state exists but is only set during submission (line 218+), never during data fetch
  - `src/components/canvas/ReversalForm.tsx:110-116` — comparison: checks `response.ok`, stores `loadError`
- **Consequence:** Expired sessions or API errors during form initialization produce silent empty dropdowns with no user feedback. The form appears functional but has no data — the user cannot post an entry and receives no explanation. Not data-corrupting, but confusing and a reportable UX gap beyond what's documented in `phase-1.2-obligations.md`.
- **Cross-references:**
  - BACKEND-004 (Scan 1) — identified the same inconsistency from the backend API error contract angle
  - H-05 — partially confirmed by Scan 1, fully confirmed from the frontend angle here

### FRONTEND-004: Inconsistent form submission error handling between JournalEntryForm and ReversalForm

- **Severity:** Medium
- **Description:** The two write-path forms handle server errors differently after POST submission:

  **JournalEntryForm** (`JournalEntryForm.tsx:228-253`):
  - 400 with `details`: maps Zod field errors to specific form fields via `form.setError()` (line 232-234). This is the most sophisticated error handling in the codebase.
  - 422: displays `errorBody.message` as a generic form error banner (line 237).
  - 401: redirects to sign-in (line 239).
  - Other: displays generic "An unexpected error occurred" (line 241).

  **ReversalForm** (`ReversalForm.tsx:196-204`):
  - 401: redirects to sign-in (line 198).
  - Any non-ok: displays `errorBody.message ?? errorBody.error ?? HTTP ${response.status}` as a generic form error banner (line 204).
  - No field-level error mapping at all — even a 400 Zod validation error is displayed as a generic banner.

  The inconsistency means that a Zod validation error on a reversal form (e.g., missing `reversal_reason`) produces a field-level error only if caught client-side by the zodResolver. If the server-side Zod parse catches a field error that the client-side resolver didn't, the user sees a generic error message like "Required" with no field context.

  This is unlikely in the current forms (client and server validate the same fields with the same Zod schemas), but will become more relevant in Phase 1.2 when agent-generated inputs may skip client-side validation.

- **Evidence:**
  - `src/components/canvas/JournalEntryForm.tsx:230-234` — field-level error mapping from server 400 response
  - `src/components/canvas/ReversalForm.tsx:202-204` — generic error banner for all non-ok responses
  - `src/app/api/orgs/[orgId]/journal-entries/route.ts:51-56` — server returns structured `{ error: 'Invalid request', details: err.issues }` for Zod errors
- **Consequence:** Reversal form server errors are less informative than journal entry form errors. For Phase 1.1, this is minor because client-side validation catches most issues. For Phase 1.2, if agent-generated reversal inputs bypass client validation, the user may see unhelpful error messages.
- **Cross-references:**
  - Backend Design — the API returns structured Zod error details, but only JournalEntryForm uses them

### FRONTEND-005: Canvas directive system is well-typed but uses an unexhaustive switch without default fallback

- **Severity:** Low
- **Description:** The `renderDirective` function in `ContextualCanvas.tsx:86-118` uses a `switch` on `d.type` to render the appropriate canvas component. The `CanvasDirective` type (`canvasDirective.ts:6-25`) is a discriminated union with 15 type variants. The switch handles all 15 without a `default` case.

  TypeScript's exhaustiveness checking ensures this function handles every variant — adding a new type to the `CanvasDirective` union without adding a case to the switch would cause a compile error (the function's implicit return type would include `undefined`, which doesn't match the JSX return expectation). This is the correct pattern for a discriminated union switch.

  However, the compile-time safety doesn't cover runtime scenarios. If an agent in Phase 1.2 generates a directive with a type string that doesn't match any union variant (e.g., a typo like `'journal_entries'` instead of `'journal_entry_list'`), the Zod validation at the agent → canvas boundary would catch it — but only if such validation exists. Currently, `SplitScreenLayout.tsx:26` sets the directive via `useState<CanvasDirective>`, and `MainframeRail.tsx:27-39` constructs directives inline. No Zod validation is applied to directives at any boundary.

  For Phase 1.2, the agent → directive path should validate directive payloads with a Zod schema before setting them as the canvas state. The type system alone is insufficient because agent output is external input.

- **Evidence:**
  - `src/components/bridge/ContextualCanvas.tsx:86-118` — switch on `d.type`, no `default` case
  - `src/shared/types/canvasDirective.ts:6-25` — 15-variant discriminated union
  - `src/components/bridge/SplitScreenLayout.tsx:26` — `useState<CanvasDirective>`, no runtime validation
- **Consequence:** No current risk — all directive sources are compile-time-checked. Phase 1.2 must add Zod validation at the agent → directive boundary to prevent malformed directives from reaching the canvas.
- **Cross-references:**
  - Architecture Fit — ARCHFIT-003 noted clean extension points but undocumented agent integration path

### FRONTEND-006: OrgSwitcher creates a Supabase browser client with un-typed environment variables

- **Severity:** Low
- **Description:** `OrgSwitcher.tsx:30-33` creates a Supabase browser client using `process.env.NEXT_PUBLIC_SUPABASE_URL!` and `process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!` with non-null assertions. The rest of the codebase uses `env.SUPABASE_URL` and `env.SUPABASE_ANON_KEY` from `src/shared/env.ts`, which presumably validates these values exist at startup.

  The `OrgSwitcher` is the only component that constructs a Supabase client directly from `process.env` instead of using the shared `env` module. This creates two concerns: (1) if the environment variables are undefined, the non-null assertion silently produces `undefined` cast as `string`, which causes a runtime error in `createBrowserClient` with an unhelpful error message; (2) the `NEXT_PUBLIC_` prefix means these are client-side environment variables baked into the JavaScript bundle, which is correct for the anon key but worth noting — this is the expected pattern for Supabase browser clients.

  The deeper question is whether the `OrgSwitcher` should be creating its own Supabase client at all, or whether it should fetch memberships from an API route like every other component. The current pattern bypasses the service layer: it queries `memberships` directly via the browser Supabase client, relying on RLS for authorization. This works because the `memberships_select` policy returns rows where `user_id = auth.uid()`, so users can only see their own memberships. But it's the only component that directly queries the database from the browser, breaking the "all DB access through services" convention (CLAUDE.md Law 1).

- **Evidence:**
  - `src/components/bridge/OrgSwitcher.tsx:30-33` — `createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, ...)`
  - `src/components/bridge/OrgSwitcher.tsx:36-38` — direct `.from('memberships').select(...)` query from the browser
  - CLAUDE.md Law 1 — "All database access goes through `src/services/` only"
- **Consequence:** Minor pattern divergence from Law 1. The direct DB query works correctly via RLS, but it's the only frontend component that bypasses the service layer. If CLAUDE.md Law 1 is enforced strictly, this should route through an API endpoint. Practically, this is low-risk because the query is a read on the user's own memberships.
- **Cross-references:**
  - Architecture Fit — CLAUDE.md Law 1 enforcement
  - Security & Compliance — the RLS-based authorization in the browser client is correct for this specific query

## Category Summary

The Phase 1.1 frontend is architecturally sound for a minimal manual-entry application. The split-screen layout (Mainframe rail + agent chat + contextual canvas) is cleanly implemented. Canvas components are self-contained, fetch their own data, and communicate via a well-typed directive system. Form handling uses react-hook-form with Zod resolvers consistently. Money values flow as strings from form input through API submission, respecting CLAUDE.md Rule 3 everywhere except the `ProposedEntryCard` type (a pre-v0.5.3 artifact). The single most important thing for the synthesis agent to know: **the frontend has no mechanism for cross-component state invalidation after mutations (FRONTEND-001), which is a Phase 1.2 blocker because agent-driven mutations from the chat panel cannot trigger canvas refreshes**. This gap requires introducing either a state management library, an event bus, or a simple refresh-key pattern before agent integration. Self-audit note: as the same instance that helped build Phase 1.1, I may have been too generous in rating the OrgSwitcher's Law 1 violation as Low — the browser-direct-to-DB query is a genuine layering break, though a pragmatic one.
