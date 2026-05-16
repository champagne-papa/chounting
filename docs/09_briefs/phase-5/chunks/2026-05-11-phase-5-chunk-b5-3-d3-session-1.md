# Phase 5 Chunk B5-3-D3 Substantive Session #1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship session #1 substrate buildout per (cadence-β-i-b) 2-session bundled cadence ratified at chunk B5-3-D3 onset:

1. ACTION_NAMES + permissions migration (atomic; both `'bill.post'` + `'bill.approve'` ActionName entries; role grants per founder Item 1 ratification + plan-doc-grain role-key disposition)
2. `POST /api/orgs/[orgId]/bills` mutation route (consumes `billService.post` via `withInvariants(action: 'bill.post')`)
3. `VendorPicker` thin abstraction (Path X per Surface 2 + plan-doc-grain S2 finding: payment approval card is vendor-display-only; abstraction amortizes against future spend-domain consumers)
4. `ManualBillForm` canvas view (first write-side UI mutation consumer at codebase grain)
5. `bill_form` canvas integration (4-file canonical touch-set: canvasDirective + MainframeRail + ContextualCanvas + canvasContextSuffix per catch #35)
6. Integration test for `POST /bills` route (Category A floor tests + INV-AP-001 + JE side-effects + recordMutation audit per `integration-test-rules` skill §3.1+§3.2)
7. NEW `bill.ts` E2E fixture (first write-side fixture; substrate-novel; helpers: `gotoBillForm` + `fillBillForm` + `submitBillForm` + `assertBillCreated`)
8. `billForm.spec.ts` Playwright E2E smoke

**Session #2 ships (OUT OF SCOPE this session):** `POST /api/orgs/[orgId]/bills/[billId]/approve-for-payment` route + `PaymentApprovalCard` canvas view + `payment_approval_card` discriminator + 5th-file `PaymentApprovalQueueView.tsx` row-click amendment per founder Item 2 (a) ratification + integration test for approve route + E2E spec + **D2.7 screenshot gate (γ) firing** for all 7 Phase A UI surfaces + closeout artifacts (friction-journal entry + retrospective inline + push-readiness three-condition gate + chunk-completion bundled commit).

**Architecture:** Mutation route + write-side canvas view. Per service-architecture skill §2: mutation routes wrap via `withInvariants(action: '<verb>')`; the service (`billService.ts`) is unwrapped Pattern B (verified at B5-2 substrate). Route shape mirrors `journal-entries/route.ts` canonical at HEAD `4abd387` (verified verbatim at recon). `ManualBillForm` mirrors `JournalEntryForm.tsx` canonical (393 lines; useForm + zodResolver + useFieldArray + fetch POST + onNavigate post-success).

**Tech Stack:** Next.js App Router, React 18+ (`'use client'` canvas components), TypeScript, Zod (Layer 2 boundary validation), react-hook-form + `@hookform/resolvers/zod`, Vitest (integration), Playwright (E2E), supabase-js (DB access via adminClient), Decimal.js (via money.schema for MoneyAmount + FxRate branded types).

**Locked-scope context (chunk B5-3-D3 onset triangulation ratifications 2026-05-11; convergent across WSL-side + brainstorm-side; founder ratified):**

- **D3.1 cadence:** (cadence-β-i-b) 2-session bundled per Surface 5; session #1 = substrate + bill form; session #2 = approve route + card + PaymentApprovalQueueView amendment + screenshot gate + closeout. Bundle-horizon-risk flag: if session #1 file count >25 OR line count >2200, reconsider 1+1+1 fork at plan-doc-review grain.
- **D3.2 mutation-route shape:** journal-entries precedent at `apps/web/src/app/api/orgs/[orgId]/journal-entries/route.ts:15-108` (verbatim shape in Task 2 template). Static action `'bill.post'` (no body-shape discrimination needed; single mutation per route file).
- **D3.3 action names:** `'bill.post'` per `billService.ts:11` + `:406` canonical (Surface 3 verified). `'bill.approve'` (NOT `'bill.approve_for_payment'`) — same canonical source. Session #1 migration ships BOTH ActionName entries atomically; session #2's approve route consumes `'bill.approve'` from already-seeded permission row.
- **D3.4 role mapping (founder Item 1 + (a) + (b) ratifications):**
  - **Founder Item 1 ratified:** `bill.post` = accountant + controller; `bill.approve` = controller only.
  - **Plan-doc-grain finding (catch #45 logged per (a) (d) hybrid):** Disk-grounded `roles` table (verified at `supabase/migrations/20240116000000_permission_catalog.sql:92-95`) has 3 system roles: `controller`, `ap_specialist`, `executive`. **NO `accountant` role exists.** Catch #45 = chain-of-drift through founder-ratification surface (NEW sub-shape: brainstorm-side preliminary lean cited unverified role_key → founder ratification → WSL-side plan-doc-grain disk verification catch). Classification: brainstorm-side substrate-citation drift sibling (#27+#29) + NEW chain-of-drift through founder-ratification surface sub-shape (hybrid per (a) (d)).
  - **Founder (b) ratification:** Map `accountant` semantically → `ap_specialist`. Per disk-grounded role description: ap_specialist = "Posts journal entries, reads chart of accounts and AI actions" — closest operational-accounting role analog.
  - **Resolved mapping (founder (b) ratified):** `bill.post` → `ap_specialist + controller`; `bill.approve` → `controller` only.
- **D3.5 VendorPicker (D2.4 deferral resolution, Surface 2 converged + plan-doc-grain S2 finding):**
  - Path (X) thin abstraction per converged disposition.
  - **Plan-doc-grain S2 verification finding:** Payment approval card is **vendor-display-only** (per-bill directive `{ orgId, billId }`; bill carries `vendor_id`; card displays vendor name as derived field, no selection UX). VendorPicker has 1 immediate consumer (bill form) at B5-3-D3 scope; amortizes against future cross-feature consumers (vendor prepayment form at Phase 5 future chunks; AR domain consumers).
  - **Shape:** Internally wraps `vendorService.listVendors` fetch via useEffect cancellation guard + native `<select>` rendering. No search, no infinite scroll, no modal — just dropdown. v1-thin acceptable per YAGNI discipline.
- **D3.6 test architecture (Surface 6 + brainstorm-side §3.1+§3.2 supplementation):**
  - Hybrid grain: Vitest integration for route-invariant layered verification + Playwright E2E for form-fill UX.
  - **§3.1+§3.2 integration-test-rules disciplines apply** (skill at `.claude/skills/integration-test-rules/SKILL.md`):
    - §3.1 trace_id prefix: `T${traceId.slice(0,8)}_*` prefix on COA codes + bill_number for cross-test isolation
    - §3.2 JE append-only triggers: void created `journal_entry_id`s in `afterAll`; **NO DELETE attempts** on `journal_entries`/`journal_lines`/`recordMutation` audit rows
  - **NEW bill.ts E2E fixture** = substrate-novel substrate ratification (first write-side E2E fixture; sibling-pattern to existing `journalEntry.ts` navigation-only fixture).
- **D3.7 canvas discriminators:** 2 new discriminators total this chunk; session #1 ships `bill_form` only; `payment_approval_card` defers to session #2 per session-scope split. `bill_form` 4-file canonical touch-set (catch #35 lesson; `canvasContextSuffix.ts` has exhaustive `describeDirective` switch with no default case — 4th file required).
- **D3.8 D2.7 screenshot gate (γ):** Fires at session #2 closeout (NOT this session). 7-shot sequence (5 B5-3-D2 read-side + 2 B5-3-D3 write-side) per Surface 8.
- **D3.9 substrate-amendment timing (founder Item 4 ratification):** B5-3-D1 read-side service header drift (apReportService.ts + vendorReportService.ts; N=11 loci verified in apReportService.ts alone) carry-forward to Phase 5 arc-closure per §Drift-B narrow-scope methodology + catch #32 precedent. **This chunk does NOT amend B5-3-D1 service file headers.**
- **D3.10 catch ledger continuity (founder Item 3 + (a) + (d) ratifications):** Catches #40-#44 logged separately at chunk-onset; **cumulative N=43** entering implementation. NEW 4th grain-axis bucket (dispatch-mandate-violation; catch #42 standalone). Catch #45 logged per (a) (d) hybrid classification: brainstorm-side substrate-citation drift sibling (#27+#29) + NEW chain-of-drift through founder-ratification surface sub-shape. Catch #46 logged per (d) ratification: WSL-side substrate-citation drift at code-template grain (sibling #34+#39+#40+#41+#44; form-schema citation drift surfaced during plan-doc draft). **Cumulative N=45** post-ratifications. **31 arc-closure retrospective candidates** active (was 30; +1 for chain-of-drift-through-founder-ratification-surface sub-shape).

- **D3.11 UX-scope ratifications (founder (e) ratification per brainstorm-side leans + COA template seed verification):**
  - **Derived fields (NOT user-facing):** `currency` = `'CAD'` literal; `fx_rate` = `'1'`; `amount_original` = `amount_cad` (CAD-only); per-line `line_number` = array index + 1; per-line `amount_original` + `amount_cad` = single per-line `amount` (CAD-only)
  - **User-facing required:** `vendor_id` (VendorPicker); `issue_date` (date input); `amount_cad` (single bill amount input); `fiscal_period_id` (period picker); `entry_date` (default today); `ap_control_account_id` (COA-liability picker)
  - **User-facing optional:** `bill_number` (text); `due_date` (date input); `tax_amount_total` (default `'0'`)
  - **Phase F reserved (always null):** `payment_terms_days`; `purchase_order_id`
  - **`fiscal_period_id` UX:** Period picker via `/api/orgs/[orgId]/fiscal-periods` fetch; **current-period default-select** per JournalEntryForm precedent (sub-surface flagged for implementer-subagent verification against JournalEntryForm canonical at task-implementation grain)
  - **`ap_control_account_id` UX:** COA picker filtered to liability-type accounts + **"Accounts Payable" name-substring default** (case-insensitive match) + operator override via picker. Grounds: COA template seed convention verified (holding_company + real_estate templates both seed `account_code = '2000'` + `account_name = 'Accounts Payable'` consistent across industries).
  - **`bill_lines` per-line UX:** `account_id` via COA picker filtered to expense-type accounts; `description` text input; `amount` single user-facing numeric input (transform derives original/cad); `tax_code_id` picker via `tax_codes` table fetch (nullable optional)
  - **`bill_lines` array shape:** useFieldArray; minimum 1 line enforced via `ManualBillFormSchema.bill_lines.min(1)`; user can add/remove lines via buttons

**Patterns inherited from chunk B5-2 + B5-3-D2 + canonical substrate (substrate-grounded against HEAD `4abd387`):**

- **journal-entries/route.ts canonical mutation-route shape** (`apps/web/src/app/api/orgs/[orgId]/journal-entries/route.ts:15-108`):
  - Import block: `NextResponse` + `z` + schemas + `withInvariants` + service + `buildServiceContext` + `ServiceError` + `serviceErrorToStatus` + `logger`
  - POST handler signature: `export async function POST(req: Request, { params }: { params: Promise<{ orgId: string }> })`
  - Body parse → URL-orgId-vs-body-org_id mismatch validation (400) → `buildServiceContext(req)` → `withInvariants(service.fn, { action })(parsed, ctx)` → `NextResponse.json(result, { status: 201 })`
  - try/catch: `ZodError` → 400 with `{ error: 'Invalid request', details: err.issues }`; `ServiceError` → `{ error: err.code, message: err.message }` with `serviceErrorToStatus(err.code)`; unknown → 500 `{ error: 'Internal server error' }`
- **JournalEntryForm.tsx canonical manual-form shape** (`apps/web/src/components/canvas/JournalEntryForm.tsx`, 393 lines):
  - Header comment lines 1-5 + `'use client'` at line 6 (after multi-line header)
  - Import block (lines 8-21): `useEffect/useMemo/useState` from React + `useForm/useFieldArray/useWatch` + `zodResolver` + `z` + money helpers + `CanvasNavigateFn` from `@/shared/types/canvasDirective` + `LineEditor`
  - Props: `{ orgId: string; onNavigate: CanvasNavigateFn; prefill?: Record<string, unknown> }`
  - `useForm({ resolver: zodResolver(...), mode: 'onSubmit', defaultValues: {...} })`
  - `useFieldArray({ control: form.control, name: 'lines' })` for dynamic lines
  - onSubmit: `fetch('/api/...', { method: 'POST', headers: {...}, body: JSON.stringify(serviceInput) })`; on 400 ZodError → per-field `form.setError`; on 422 ServiceError → `setFormError(errorBody.message)`; on 401 → `window.location.href = '/en/sign-in'`; on success → `form.reset()` + `onNavigate({ type: '<list-or-detail>', orgId })`
  - Loading stencil: `<div className="text-sm text-neutral-400">Loading...</div>`
  - Error stencil: `<div className="mb-4 p-3 border border-red-300 rounded bg-red-50 text-sm text-red-600">{formError}</div>`
- **ApAgingView.tsx canonical canvas-view import shape (catch #34 lesson grounding)** (`apps/web/src/components/canvas/ApAgingView.tsx:1-12`):
  - `'use client'` at line 2 (immediately after single-line path comment)
  - `import type { CanvasNavigateFn } from '@/shared/types/canvasDirective';` — verbatim path
  - `import type { SelectedEntity } from '@/shared/types/canvasContext';` — verbatim path (SEPARATE module from CanvasNavigateFn)
  - `import type { <ServiceOutput> } from '@/services/...';`
  - **ManualBillForm does NOT need SelectedEntity import** (no `onSelectEntity` prop per JournalEntryForm precedent at lines 113-117)
- **Migration canonical shape** (per `supabase/migrations/20240130000000_add_journal_entry_adjust_permission.sql` + `20240132000000_add_recurring_journal_permissions.sql`):
  - `BEGIN; ... COMMIT;` transaction
  - `INSERT INTO permissions (permission_key, display_name, category, sort_order) VALUES (...)`
  - `INSERT INTO role_permissions (role_id, permission_key) SELECT r.role_id, p.permission_key FROM roles r, permissions p WHERE r.role_key = '<role>' AND p.permission_key IN (...)`
  - Header comment block with category + count impact + parity-test reference + same-commit-update requirement for CA-27 (ACTION_NAMES set-equality) + CA-28 (hardcoded counts)
- **adminClient discipline (INV-SERVICE-002):** all DB access via `@/db/adminClient`
- **Zod boundary validation (Layer 2):** route parses `await req.json()` via `PostBillInputSchema.parse(json)`; throws ZodError on validation failure (route maps to 400)
- **ServiceContext + trace_id propagation:** `await buildServiceContext(req)` at route handler grain produces `{ trace_id, caller: { user_id, email, verified, org_ids }, locale? }`
- **(γ-a) bundle pattern:** implementer subagents do NOT commit per-task; working-tree accumulates; bundled commit at session-close
- **Reading B preservation (ADR-0011 §1, ADR-0007 §Tier 2):** Only `journalEntryService.post()` inserts into `journal_entries`/`journal_lines`. `billService.post` composes JE input + delegates (verified at billService.ts:30-44 + body); no direct ledger writes
- **4-file canonical canvas-integration touch-set (catch #35 lesson; verified at recon):** `canvasDirective.ts` + `MainframeRail.tsx` + `ContextualCanvas.tsx` + `canvasContextSuffix.ts`. The 4th file is required because `canvasContextSuffix.ts:describeDirective` has exhaustive switch with no default case.

**Prophylactic catch-lesson application (catches #34-#44; founder Item 3 ratified for separate logging):**

Apply at code-template grain (NOT just lesson-statement grain per catch #39 lesson):

- **#34** — `CanvasNavigateFn` from `@/shared/types/canvasDirective`; `SelectedEntity` from `@/shared/types/canvasContext` (SEPARATE module paths; verified verbatim at ApAgingView.tsx:10-11). NOT `@/components/canvas/types` (module does NOT exist).
- **#35** — 4-file canvas integration touch-set explicitly enumerated; `canvasContextSuffix.ts` is 4th file (exhaustive switch, no default).
- **#36** — TS-typing input parameter resolution upfront. Bill form input shape verified against `PostBillInputSchema` (Zod) at task draft grain: `org_id` (uuid) + `vendor_id` (uuid) + bill metadata + `bill_lines` (array, min 1) + JE-input fields (`fiscal_period_id`, `entry_date`, `ap_control_account_id`). MoneyAmountSchema branded types.
- **#37** — validation gate scope = `pnpm agent:validate` + `pnpm test` (vitest) + `pnpm typecheck` ONLY per CLAUDE.md "What done means" §1. **E2E is informational** (founder-review-workflow grain), NOT part of chunk-close gate. Do NOT cite `pnpm test:e2e` as validation gate step.
- **#38** — catch ledger count internal consistency. When citing cumulative N or sub-mechanism distributions, verify parent total = sum of sub-buckets.
- **#39** — prophylactic lesson application propagates from lesson-statement grain to code-template grain. Code templates (Task 2, Task 4) encode catch lessons; verify templates encode correctly (do NOT rely on inline comments alone).
- **#40** — action name `'bill.approve'` (NOT `'bill.approve_for_payment'`) per billService.ts:11 + :406 canonical. Verbatim in ACTION_NAMES + migration + future approve route.
- **#41** — count quantification grounded against full-file disk scan, not partial-range. Recon Target A2 N=1 was undercount at lines 1-50 only; actual N=11 in apReportService.ts whole-file scan. Future count claims ground against full-file or explicit-range citation.
- **#42** — implementer subagent dispatches enforce explicit mandate-scope boundaries. Subagent prompts say "Do NOT make recommendations" when recon is purely-disk-grounded; subagent enforcement of mandate scope is part of dispatch shape.
- **#43** — canvas integration enumeration grounded against verified-on-disk navigation pattern. This session enumerates 4-file touch-set explicitly (no PaymentApprovalCard navigation; that's session #2 territory with 5th-file extension).
- **#44** — chunk-attribution grounded against disk-verified chunk-of-origin. B5-3-D1 read-side service headers were authored at B5-3-D1 chunk (apReportService.ts + vendorReportService.ts); billService.ts (B5-2) is canonical-correct mutation service.
- **#45** (logged per (a) (d) hybrid; chain-of-drift through founder-ratification surface) — role_key citations grounded against disk-verified `roles` table (3 system roles: `controller`, `ap_specialist`, `executive`). NO `accountant` role exists; brainstorm-side preliminary lean cited unverified role_key → founder ratified verbatim → WSL-side caught at plan-doc-grain disk verification. Sub-shape: chain-of-drift propagation through founder-ratification surface (sibling-mechanism to #38 but NEW propagation path).
- **#46** (logged per (d); WSL-side substrate-citation drift at code-template grain) — form schema separated from service schema per JournalEntryForm precedent; verify-from-disk against existing form schema patterns before citing `zodResolver(<ServiceInputSchema>)`. Task 4b template uses `ManualBillFormSchema` for form-grain UI validation + `formStateToServiceInput` typed transform → `PostBillInputRaw`; `PostBillInputSchema.parse(json)` at route grain provides defense-in-depth at service boundary. Sub-mechanism class: WSL-side substrate-citation drift at code-template grain (sibling #34+#39+#40+#41+#44).

**Out of scope this session:**

- **POST /api/orgs/[orgId]/bills/[billId]/approve-for-payment route** — session #2
- **PaymentApprovalCard canvas view** — session #2
- **`payment_approval_card` discriminator + 5th-file `PaymentApprovalQueueView.tsx` row-click amendment** — session #2 (per founder Item 2 (a) ratification; B5-3-D2 substrate amendment as forward-progress, not retrospective edit)
- **D2.7 screenshot gate (γ) firing** — session #2 closeout (7-shot sequence)
- **Closeout artifacts** — session #2 absorbs per (cadence-β-i-b) 2-session bundled cadence: friction-journal entry + retrospective inline + push-readiness three-condition gate + chunk-grain push to origin/staging
- **`billService.recordPayment` + `billService.reverse` mutations** — out-of-chunk (Surface 1 scope-lock; recordPayment substrate-novelty exceeds 2-session bundle horizon; reverse is agent-grain not UI-grain at v1)
- **`vendorPrepaymentService.{record,apply,refund}` mutation routes** — out-of-chunk (B5-1 service substrate exists but no mutation routes; Surface 1 restricts to bills)
- **ServiceErrorCode bill-specific additions** (e.g., `BILL_OVER_ALLOCATION`, `BILL_INVALID_STATE_TRANSITION`) — out-of-arc per `billService.ts:59-68` dispositive (generic codes + rich discriminator-bearing message text)
- **Item 18 org_settings substrate-floor** — preserved-deferred per (orgset-β); not firing on B5-3-D3 write-side UI scope
- **FT1 `clampTtl` NaN-guard at `supabaseStorageProvider.ts:95-99`** — preserved-deferred to storage-substrate-touching chunk
- **vendorReportService.ts / apReportService.ts header drift correction** — Phase 5 arc-closure carry-forward per founder Item 4 ratification + §Drift-B narrow-scope methodology
- **B5-2 substrate amendments** (`billService.ts` canonical preserved unmodified)
- **CA-28 test counts beyond the +2 increment** — only update for the 2 new ActionNames; do NOT reorganize or refactor unrelated assertions
- **Page route shells at `/[locale]/[orgId]/...`** — canvas-only per Q1-i precedent (B5-3-D2 ratification carries forward)

---

## Files

**Files to create (8):**

Migration (1):
- `supabase/migrations/<timestamp>_bill_action_permissions.sql` — atomic transaction: 2 permissions rows (`bill.post` + `bill.approve`) + role grants per D3.4 disposition; header comment block following 20240132000000 precedent (count impact + CA-27/CA-28 same-commit-update note)

API route (1):
- `apps/web/src/app/api/orgs/[orgId]/bills/route.ts` — POST handler; consumes `billService.post` via `withInvariants(billService.post, { action: 'bill.post' })`; mirrors journal-entries/route.ts canonical shape (verbatim template in Task 2)

Canvas components (2):
- `apps/web/src/components/canvas/_shared/VendorPicker.tsx` — thin abstraction over `vendorService.listVendors` + native `<select>`; props `{ orgId, value, onChange, disabled? }`; useEffect cancellation guard for vendor list fetch
- `apps/web/src/components/canvas/ManualBillForm.tsx` — bill form canvas view (`'use client'`; useForm + zodResolver(`PostBillInputSchema`) + useFieldArray for `bill_lines`; VendorPicker for vendor_id; native filter UI for dates/period; POST `/api/orgs/${orgId}/bills`; on success → `onNavigate({ type: 'report_open_bills', orgId })` per Surface-7 canvas-view-navigation parity)

Tests (3):
- `apps/web/tests/integration/postBillRoute.test.ts` — Category A floor tests + INV-AP-001 allocation sum + JE side-effects (verify `journal_entries` + `journal_lines` rows inserted) + `recordMutation` audit row assertion; §3.1 `T${traceId.slice(0,8)}_*` prefix on COA codes + bill_number; §3.2 afterAll voids created JE IDs (NO DELETE)
- `apps/web/tests/e2e/fixtures/bill.ts` — NEW write-side E2E fixture; helpers: `gotoBillForm(page, orgId)` + `fillBillForm(page, fixture)` + `submitBillForm(page)` + `assertBillCreated(page, expected)`
- `apps/web/tests/e2e/billForm.spec.ts` — Playwright smoke: navigate via MainframeRail → fill form → submit → assert 201 + canvas navigation post-submit

**Files to modify (6):**

ACTION_NAMES + CA-28 (2):
- `apps/web/src/services/auth/canUserPerformAction.ts` — extend `ACTION_NAMES` `as const` tuple with 2 entries (`'bill.post'`, `'bill.approve'`); maintain alphabetical-or-grouped placement parity per existing convention (verified at recon Target 6 — current 25 entries; new ordering at implementer-subagent discretion per locality)
- `apps/web/tests/integration/permissionCatalogSeed.test.ts` — bump hardcoded counts (25 → 27 total; controller 25 → 27; ap_specialist exact-set 4 → 5 with `'bill.post'` added); preserve executive 4 unchanged. Per Permission Catalog Count Drift convention: same-commit-update requirement

Canvas integration 4-file touch-set (4):
- `apps/web/src/shared/types/canvasDirective.ts` — add `{ type: 'bill_form'; orgId: string }` discriminator member at the Phase 1.1 cluster (insert near `recurring_template_form` / `journal_entry_form` form-shape neighbors per naming-convention parity)
- `apps/web/src/components/bridge/MainframeRail.tsx` — extend `ICONS` array with `{ id: 'bill_form', label: 'New Bill', icon: '...' }` (single-char unicode emoji at implementer discretion per existing precedent, e.g. `'\u{1F4C4}'` 📄 or similar invoice-shaped glyph); extend `handleClick` switch with `case 'bill_form'` calling `onNavigate({ type: 'bill_form', orgId })`
- `apps/web/src/components/bridge/ContextualCanvas.tsx` — extend `renderDirective` switch with `case 'bill_form': return <ManualBillForm orgId={d.orgId} onNavigate={onNavigate} />;` (insert in form-shape case cluster); add import for `ManualBillForm` at top of file
- `apps/web/src/agent/prompts/suffixes/canvasContextSuffix.ts` — extend `describeDirective` switch with `case 'bill_form': return 'the new bill form';` (exhaustive switch, no default — required else TS errors)

**Files NOT touched (preservation):**

B5-2 substrate (closed; preserved per founder Item 4 § §Drift-B narrow-scope):
- `apps/web/src/services/spend/billService.ts` — consumed unmodified; header convention canonical
- `apps/web/src/shared/schemas/spend/bill.schema.ts` — consumed unmodified

B5-3-D1 read-side substrate (closed; preserved; arc-closure header drift carry-forward per founder Item 4):
- `apps/web/src/services/spend/reports/apReportService.ts` — **NO HEADER AMENDMENT this chunk** (despite N=11 aspirational mention loci verified; arc-closure venue per §Drift-B)
- `apps/web/src/services/spend/reports/vendorReportService.ts` — **NO HEADER AMENDMENT this chunk** (same disposition)

B5-3-D2 substrate (closed; preserved):
- `apps/web/src/services/spend/vendorService.ts` — VendorPicker consumes `listVendors` unmodified
- 5 read-side canvas view components — preserved
- `apps/web/src/components/canvas/PaymentApprovalQueueView.tsx` — row-click amendment **defers to session #2** (5th-file canvas integration extension per founder Item 2 (a))

---

## Tasks

### Task 1: Migration + ACTION_NAMES + CA-28 count update (atomic permission substrate)

**Goal:** Ship the permission substrate so `withInvariants(action: 'bill.post')` (Task 2) and `withInvariants(action: 'bill.approve')` (session #2) can both pass `canUserPerformAction` checks. CA-27 parity test passes automatically once ACTION_NAMES + migration ship in same commit. CA-28 hardcoded counts updated in same commit per Permission Catalog Count Drift convention.

**Files:**
- CREATE: `supabase/migrations/<timestamp>_bill_action_permissions.sql`
- MODIFY: `apps/web/src/services/auth/canUserPerformAction.ts` (extend `ACTION_NAMES`)
- MODIFY: `apps/web/tests/integration/permissionCatalogSeed.test.ts` (bump hardcoded counts)

**Steps:**

- [ ] **1a.** Read pre-migration counts. At task-start grain, verify pre-migration baseline: `apps/web/tests/integration/permissionCatalogSeed.test.ts` asserts current total permissions count + controller count + ap_specialist exact set + executive exact set. If pre-task baseline differs from this plan's projection (25 / 25 / 4 / 4), surface to orchestrator and recompute post-migration counts.

- [ ] **1b.** Author migration `supabase/migrations/<timestamp>_bill_action_permissions.sql` with the following template (substitute timestamp; verify role_key disposition per D3.4 — `ap_specialist` for `bill.post`):

  ```sql
  -- =============================================================
  -- <timestamp>_bill_action_permissions.sql
  -- Phase 5 chunk B5-3-D3 substantive session #1:
  -- bill.post + bill.approve permissions for AP write-side UI chunk
  -- =============================================================
  -- Adds 2 new permissions per ADR-0015 Spend subdomain + chunk B5-3-D3
  -- onset triangulation (founder Item 1 ratification + plan-doc-grain
  -- role-key disposition D3.4: 'accountant' semantic mapped to disk-grounded
  -- 'ap_specialist' role_key).
  --
  -- Role grants (separation-of-duties posture per spend brief §11):
  --   bill.post     → ap_specialist + controller (operational accounting)
  --   bill.approve  → controller only (separation: who-posts ≠ who-approves)
  --
  -- Sort_order placement:
  --   bill.post     — Accounting, sort_order 18
  --   bill.approve  — Accounting, sort_order 19
  --   (After recurring_run.reject at 17; before any subsequent Accounting
  --   additions. Implementer-subagent: verify next-available slot at task-
  --   start grain if other migrations have shipped between this plan and
  --   implementation.)
  --
  -- Catalog count impact:
  --   permissions:       25 → 27 (+2)
  --   role_permissions:  N → N+3 (controller: +2; ap_specialist: +1)
  --
  -- Parity:
  --   CA-27 (permissionParity.test.ts) passes automatically once
  --   ACTION_NAMES carries 'bill.post' + 'bill.approve' alongside
  --   this seed (added in the same commit; see canUserPerformAction.ts
  --   edit in this commit).
  --   CA-28 (permissionCatalogSeed.test.ts) hardcoded counts bumped
  --   from 25 to 27 in the same commit per the Permission Catalog
  --   Count Drift convention (conventions.md).
  --
  -- Mirror pattern: 20240130000000_add_journal_entry_adjust_permission.sql
  -- + 20240132000000_add_recurring_journal_permissions.sql (inline seed
  -- alongside the chunk that consumes the ActionName).
  -- =============================================================

  BEGIN;

  INSERT INTO permissions (permission_key, display_name, category, sort_order) VALUES
    ('bill.post',    'Post bills',               'Accounting', 18),
    ('bill.approve', 'Approve bills for payment','Accounting', 19);

  -- Controller gets both (full access role)
  INSERT INTO role_permissions (role_id, permission_key)
  SELECT r.role_id, p.permission_key
  FROM roles r, permissions p
  WHERE r.role_key = 'controller'
    AND p.permission_key IN ('bill.post', 'bill.approve');

  -- AP specialist gets bill.post only (separation-of-duties: operational
  -- accounting can create bills; only controller approves for payment)
  INSERT INTO role_permissions (role_id, permission_key)
  SELECT r.role_id, p.permission_key
  FROM roles r, permissions p
  WHERE r.role_key = 'ap_specialist'
    AND p.permission_key = 'bill.post';

  COMMIT;
  ```

- [ ] **1c.** Extend `ACTION_NAMES` in `apps/web/src/services/auth/canUserPerformAction.ts` — add 2 entries (`'bill.post'`, `'bill.approve'`) to the `as const` tuple. Placement at implementer discretion; suggest grouped under an "AP/Spend" comment cluster per category-grouping precedent (verify current grouping convention at task-start grain).

- [ ] **1d.** Update `apps/web/tests/integration/permissionCatalogSeed.test.ts`:
  - Bump `expect(data).toHaveLength(25)` → `27` (total permissions assertion)
  - Bump controller `expect(perms).toHaveLength(25)` → `27`
  - Bump ap_specialist `expect(perms).toHaveLength(4)` → `5`
  - Update ap_specialist exact-set assertion: insert `'bill.post'` in sorted position (alphabetical: between `'ai_actions.read'` and `'chart_of_accounts.read'`)
  - Preserve executive 4 unchanged

- [ ] **1e.** Validation: `pnpm db:reset:clean && pnpm db:seed:all && pnpm test apps/web/tests/integration/permissionCatalogSeed.test.ts apps/web/tests/integration/permissionParity.test.ts` passes. Both CA-27 + CA-28 green.

---

### Task 2: POST /api/orgs/[orgId]/bills route

**Goal:** Ship the canonical mutation route for `billService.post`. Wrap with `withInvariants(action: 'bill.post')` per service-architecture skill §2; mirror journal-entries/route.ts canonical shape verbatim.

**Files:**
- CREATE: `apps/web/src/app/api/orgs/[orgId]/bills/route.ts`

**Steps:**

- [ ] **2a.** Author `apps/web/src/app/api/orgs/[orgId]/bills/route.ts` mirroring journal-entries/route.ts canonical (single-mutation variant; no body-shape discrimination since bills has only one POST path):

  ```typescript
  // src/app/api/orgs/[orgId]/bills/route.ts
  //
  // Phase 5 chunk B5-3-D3 substantive session #1: POST /bills mutation
  // route — first AP write-side UI mutation consumer at codebase grain.
  // Consumes billService.post per service-architecture skill §2:
  //   - billService is unwrapped Pattern B (verified at billService.ts:11)
  //   - route layer wraps via withInvariants(action: 'bill.post')
  //   - bill.post ActionName + permissions seeded at
  //     supabase/migrations/<timestamp>_bill_action_permissions.sql
  //
  // Mirror pattern: journal-entries/route.ts canonical (HEAD 4abd387);
  // single-mutation variant (no reversal/adjustment body discrimination).

  import { NextResponse } from 'next/server';
  import { z } from 'zod';
  import { PostBillInputSchema } from '@/shared/schemas/spend/bill.schema';
  import { withInvariants } from '@/services/middleware/withInvariants';
  import { billService } from '@/services/spend/billService';
  import { buildServiceContext } from '@/services/middleware/serviceContext';
  import { ServiceError } from '@/services/errors/ServiceError';
  import { serviceErrorToStatus } from '@/app/api/_helpers/serviceErrorToStatus';

  export async function POST(
    req: Request,
    { params }: { params: Promise<{ orgId: string }> }
  ) {
    try {
      const { orgId } = await params;
      const json = await req.json();

      const parsed = PostBillInputSchema.parse(json);

      // URL/body org_id mismatch guard (prevent client spoofing)
      if (parsed.org_id !== orgId) {
        return NextResponse.json(
          { error: 'org_id mismatch between URL and body' },
          { status: 400 }
        );
      }

      const ctx = await buildServiceContext(req);

      // INV-SERVICE-001 wrap site: billService.post is unwrapped Pattern B;
      // route handler wraps via withInvariants at the call site. Skipping
      // this wrap would bypass the four INV-AUTH-001 pre-flight checks
      // (context shape, caller verification, org-access, role authorization).
      const result = await withInvariants(
        billService.post,
        { action: 'bill.post' }
      )(parsed, ctx);

      // 201 Created — REST convention for resource creation.
      // Returns { bill_id, journal_entry_id }.
      return NextResponse.json(result, { status: 201 });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return NextResponse.json(
          { error: 'Invalid request', details: err.issues },
          { status: 400 }
        );
      }
      if (err instanceof ServiceError) {
        return NextResponse.json(
          { error: err.code, message: err.message },
          { status: serviceErrorToStatus(err.code) }
        );
      }
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  }
  ```

- [ ] **2b.** Validation: `pnpm typecheck` green; route compiles. (Integration test verification happens at Task 6.)

---

### Task 3: VendorPicker thin abstraction

**Goal:** Ship the thin VendorPicker component (Path X per Surface 2) as substrate-novel abstraction. v1-thin shape: `vendorService.listVendors` fetch + native `<select>` + cancellation guard. Single immediate consumer at B5-3-D3 (ManualBillForm at Task 4); amortizes against future spend-domain consumers.

**Files:**
- CREATE: `apps/web/src/components/canvas/_shared/VendorPicker.tsx`

**Steps:**

- [ ] **3a.** Verify directory exists: `apps/web/src/components/canvas/_shared/` — if not, create it. Naming convention `_shared/` per Next.js underscore-prefix-NOT-routable convention (canvas subdirectory; not a route segment).

- [ ] **3b.** Author `VendorPicker.tsx`:

  ```typescript
  // src/components/canvas/_shared/VendorPicker.tsx
  'use client';
  //
  // Phase 5 chunk B5-3-D3 substantive session #1: thin VendorPicker
  // abstraction per Surface 2 Path (X) converged disposition.
  // Wraps vendorService.listVendors fetch + native <select>; single-
  // immediate-consumer at this chunk (ManualBillForm); amortizes against
  // future cross-feature consumers (vendor prepayment form, AR consumers).
  //
  // v1 thin shape: no search, no infinite scroll, no modal. Native dropdown
  // with cancellation guard. Loading/empty/error stencils mirror
  // BasicTrialBalanceView read-side conventions.

  import { useEffect, useState } from 'react';

  interface VendorListRow {
    vendor_id: string;
    display_name: string;
  }

  export interface VendorPickerProps {
    orgId: string;
    value: string | null;
    onChange: (vendor_id: string) => void;
    disabled?: boolean;
  }

  export function VendorPicker({ orgId, value, onChange, disabled }: VendorPickerProps) {
    const [vendors, setVendors] = useState<VendorListRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
      let cancelled = false;
      setLoading(true);
      setError(null);
      fetch(`/api/orgs/${orgId}/vendors`)
        .then((res) => {
          if (!res.ok) throw new Error(`Vendors fetch failed: ${res.status}`);
          return res.json();
        })
        .then((body: { vendors: VendorListRow[] }) => {
          if (!cancelled) {
            setVendors(body.vendors);
            setLoading(false);
          }
        })
        .catch((err: Error) => {
          if (!cancelled) {
            setError(err.message);
            setLoading(false);
          }
        });
      return () => {
        cancelled = true;
      };
    }, [orgId]);

    if (loading) {
      return <div className="text-sm text-neutral-400">Loading vendors...</div>;
    }
    if (error) {
      return <div className="text-sm text-red-500">{error}</div>;
    }
    if (vendors.length === 0) {
      return <div className="text-sm text-neutral-400">No vendors available.</div>;
    }

    return (
      <select
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="w-full px-2 py-1 border border-neutral-300 rounded text-sm"
      >
        <option value="" disabled>
          Select vendor...
        </option>
        {vendors.map((v) => (
          <option key={v.vendor_id} value={v.vendor_id}>
            {v.display_name}
          </option>
        ))}
      </select>
    );
  }
  ```

- [ ] **3c.** Validation: `pnpm typecheck` green.

---

### Task 4: ManualBillForm canvas view

**Goal:** Ship the first write-side UI canvas view. Mirror JournalEntryForm.tsx canonical shape (verbatim recon template at HEAD 4abd387). Consumes VendorPicker (Task 3) for vendor_id; uses useForm + zodResolver(`PostBillInputSchema`) + useFieldArray for `bill_lines`; POSTs to `/api/orgs/${orgId}/bills` (Task 2 route); on 201 success navigates to `report_open_bills` canvas view.

**Files:**
- CREATE: `apps/web/src/components/canvas/ManualBillForm.tsx`

**Steps:**

- [ ] **4a.** Verify substrate citations at task-start grain (catch #34 + #39 lessons applied at code-template grain):
  - `CanvasNavigateFn` import path: `@/shared/types/canvasDirective` (NOT `@/components/canvas/types`; that module does NOT exist)
  - `PostBillInputSchema` import path: `@/shared/schemas/spend/bill.schema`
  - `MoneyAmountSchema` / `FxRateSchema` import paths: `@/shared/schemas/accounting/money.schema`
  - `VendorPicker` import path: `@/components/canvas/_shared/VendorPicker` (Task 3 substrate)

- [ ] **4b.** Author `ManualBillForm.tsx` per JournalEntryForm.tsx canonical (~500-600 lines target post-catch-#46 amendment; mirrors `useForm + zodResolver(ManualBillFormSchema) + useFieldArray + formStateToServiceInput transform + fetch POST + error-handling`):

  **Per catch #46 (logged per (d) ratification):** form schema SEPARATED from service schema. `ManualBillFormSchema` for UI-state validation; `formStateToServiceInput` typed transform → `PostBillInputRaw`; `PostBillInputSchema.parse(json)` at route grain (defense-in-depth at service boundary). Mirror JournalEntryForm pattern at `formStateToServiceInput` (line 217+ canonical).

  Structural template (implementer-subagent fleshes JSX form fields per D3.11 UX-scope ratifications):

  ```typescript
  // src/components/canvas/ManualBillForm.tsx
  'use client';
  //
  // Phase 5 chunk B5-3-D3 substantive session #1: ManualBillForm — first
  // write-side UI mutation consumer at codebase grain.
  // Consumes POST /api/orgs/[orgId]/bills (Task 2 route) which wraps
  // billService.post via withInvariants(action: 'bill.post').
  // Mirror pattern: JournalEntryForm.tsx canonical (HEAD 4abd387);
  // separated form schema (UI shape) + service schema (PostBillInputRaw);
  // formStateToServiceInput transform builds branded MoneyAmount/FxRate
  // from string-money form fields per JournalEntryForm precedent.

  import { useEffect, useMemo, useState } from 'react';
  import { useForm, useFieldArray, useWatch } from 'react-hook-form';
  import { zodResolver } from '@hookform/resolvers/zod';
  import { z } from 'zod';
  import type { PostBillInputRaw } from '@/shared/schemas/spend/bill.schema';
  import type { CanvasNavigateFn } from '@/shared/types/canvasDirective';
  import { VendorPicker } from '@/components/canvas/_shared/VendorPicker';

  // ---------------------------------------------------------------------
  // Form schema (UI-state shape; distinct from PostBillInputSchema service
  // boundary). String-typed money fields per JournalEntryForm precedent;
  // formStateToServiceInput transforms to PostBillInputRaw at submit grain.
  // Derived fields (currency, fx_rate, amount_original, line_number) omitted
  // from form state per D3.11 UX-scope ratification — set in transform.
  // ---------------------------------------------------------------------

  const ManualBillFormSchema = z.object({
    vendor_id: z.string().uuid('Vendor required'),
    bill_number: z.string(),
    issue_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Issue date required'),
    due_date: z.string(),
    amount_cad: z.string().regex(/^\d+(\.\d{1,4})?$/, 'Amount required (numeric)'),
    tax_amount_total: z.string(),
    fiscal_period_id: z.string().uuid('Period required'),
    entry_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Entry date required'),
    ap_control_account_id: z.string().uuid('AP control account required'),
    bill_lines: z
      .array(
        z.object({
          account_id: z.string().uuid('Expense account required'),
          description: z.string().min(1, 'Description required'),
          amount: z.string().regex(/^\d+(\.\d{1,4})?$/, 'Amount required'),
          tax_code_id: z.string(),
        }),
      )
      .min(1, 'At least one line required'),
  });

  type ManualBillFormState = z.infer<typeof ManualBillFormSchema>;

  // ---------------------------------------------------------------------
  // Form state → service input transform (mirror JournalEntryForm
  // formStateToServiceInput at line 217+ canonical). String-typed form
  // money fields → PostBillInputRaw string-money fields (PostBillInputSchema
  // parses to branded MoneyAmount/FxRate via boundary at service grain).
  // Derived fields (currency='CAD', fx_rate='1', amount_original=amount_cad,
  // per-line amount_original/amount_cad=line.amount, line_number=index+1)
  // set per D3.11 UX-scope ratifications.
  // ---------------------------------------------------------------------

  function formStateToServiceInput(
    state: ManualBillFormState,
    orgId: string,
  ): PostBillInputRaw {
    return {
      org_id: orgId,
      vendor_id: state.vendor_id,
      bill_number: state.bill_number || null,
      issue_date: state.issue_date,
      due_date: state.due_date || null,
      payment_terms_days: null, // Phase F reserved per billService.ts
      purchase_order_id: null, // Phase F reserved per billService.ts
      currency: 'CAD', // Sub-L v1 CAD-only literal
      amount_original: state.amount_cad, // CAD-only: original = cad
      amount_cad: state.amount_cad,
      fx_rate: '1', // CAD-only: fx_rate = 1
      tax_amount_total: state.tax_amount_total || '0',
      bill_lines: state.bill_lines.map((l, idx) => ({
        account_id: l.account_id,
        description: l.description,
        amount: l.amount,
        amount_original: l.amount, // CAD-only: original = line.amount
        amount_cad: l.amount, // CAD-only: cad = line.amount
        tax_code_id: l.tax_code_id || null,
        line_number: idx + 1, // Auto-derived from array index
      })),
      fiscal_period_id: state.fiscal_period_id,
      entry_date: state.entry_date,
      ap_control_account_id: state.ap_control_account_id,
    };
  }

  export type ManualBillFormProps = {
    orgId: string;
    onNavigate: CanvasNavigateFn;
  };

  export function ManualBillForm({ orgId, onNavigate }: ManualBillFormProps) {
    const [submitting, setSubmitting] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);

    const form = useForm<ManualBillFormState>({
      resolver: zodResolver(ManualBillFormSchema),
      mode: 'onSubmit',
      defaultValues: {
        vendor_id: '',
        bill_number: '',
        issue_date: new Date().toISOString().slice(0, 10),
        due_date: '',
        amount_cad: '',
        tax_amount_total: '0',
        fiscal_period_id: '',
        entry_date: new Date().toISOString().slice(0, 10),
        ap_control_account_id: '',
        bill_lines: [
          { account_id: '', description: '', amount: '', tax_code_id: '' },
        ],
      },
    });

    const { fields, append, remove } = useFieldArray({
      control: form.control,
      name: 'bill_lines',
    });

    // ----- Dropdown data fetches (implementer-subagent: useEffect
    // cancellation guards; mirror JournalEntryForm fetchDropdownData pattern)
    //
    // 1. Fiscal periods: GET /api/orgs/[orgId]/fiscal-periods
    //    D3.11 UX: current-period default-select per JournalEntryForm
    //    precedent (verify against JournalEntryForm canonical at task grain).
    //
    // 2. COA-liability accounts: GET /api/orgs/[orgId]/chart-of-accounts
    //    filtered to liability-type accounts.
    //    D3.11 UX: "Accounts Payable" name-substring match (case-
    //    insensitive) → preselect first match into ap_control_account_id.
    //    Grounds: COA template seed convention (account_code 2000 +
    //    account_name "Accounts Payable" consistent across holding_company
    //    + real_estate templates).
    //
    // 3. COA-expense accounts: same COA endpoint filtered to expense-type.
    //    Per-line account_id picker; no default selection.
    //
    // 4. Tax codes: GET /api/orgs/[orgId]/tax-codes (if endpoint exists;
    //    implementer verifies at task-start grain).

    const onSubmit = async (state: ManualBillFormState) => {
      setFormError(null);
      setSubmitting(true);
      try {
        const serviceInput = formStateToServiceInput(state, orgId);

        const response = await fetch(`/api/orgs/${orgId}/bills`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(serviceInput),
        });

        if (!response.ok) {
          const errorBody = await response.json();
          if (response.status === 400 && errorBody.details) {
            for (const issue of errorBody.details) {
              const path = issue.path.join('.');
              form.setError(path as Parameters<typeof form.setError>[0], {
                message: issue.message,
              });
            }
          } else if (response.status === 422) {
            setFormError(errorBody.message || 'Unable to post bill');
          } else if (response.status === 401) {
            window.location.href = '/en/sign-in';
            return;
          } else {
            setFormError('An unexpected error occurred. Please try again.');
          }
          return;
        }

        await response.json();
        form.reset();
        onNavigate({ type: 'report_open_bills', orgId });
      } catch {
        setFormError('An unexpected error occurred. Please try again.');
      } finally {
        setSubmitting(false);
      }
    };

    return (
      <div>
        <h2 className="text-lg font-semibold mb-4">New Bill</h2>
        {formError && (
          <div className="mb-4 p-3 border border-red-300 rounded bg-red-50 text-sm text-red-600">
            {formError}
          </div>
        )}
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Vendor — VendorPicker (Task 3) */}
          <label className="block">
            <span className="text-sm font-medium">Vendor *</span>
            <VendorPicker
              orgId={orgId}
              value={form.watch('vendor_id') || null}
              onChange={(vid) => form.setValue('vendor_id', vid)}
              disabled={submitting}
            />
            {form.formState.errors.vendor_id && (
              <span className="text-xs text-red-500">
                {form.formState.errors.vendor_id.message}
              </span>
            )}
          </label>

          {/* Bill metadata — implementer-subagent: render per D3.11 UX-scope
              ratifications:
              - bill_number (text, optional)
              - issue_date * (<input type="date">; default today)
              - due_date (<input type="date">, optional)
              - amount_cad * (numeric input; single user-facing amount)
              - tax_amount_total (numeric input; default '0')
              - fiscal_period_id * (period picker; current-period default)
              - entry_date * (<input type="date">; default today)
              - ap_control_account_id * (COA-liability picker;
                "Accounts Payable" name-substring default + operator override)
              Use {...form.register(...)} bindings; loading stencils for
              dropdown data per JournalEntryForm precedent. */}

          {/* bill_lines — useFieldArray; render line rows. Per-line fields:
              - account_id * (COA-expense picker; no default)
              - description * (text input)
              - amount * (numeric input; transform derives original/cad)
              - tax_code_id (tax_codes picker, optional)
              "Add line" + "Remove line" buttons; min 1 line enforced
              via ManualBillFormSchema.bill_lines.min(1). */}

          <button
            type="submit"
            disabled={submitting}
            className="px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50"
          >
            {submitting ? 'Posting...' : 'Post Bill'}
          </button>
        </form>
      </div>
    );
  }
  ```

  Implementer-subagent: flesh out the JSX form fields per D3.11 UX-scope ratifications. The structural shape (form schema separation + transform + useForm-with-resolver + useFieldArray + fetch POST + error handling + dropdown UX patterns) is encoded in the template; the per-field JSX + dropdown-data-fetching useEffect blocks are mechanical (mirror JournalEntryForm precedent at fetchDropdownData pattern).

- [ ] **4c.** Validation: `pnpm typecheck` green.

---

### Task 5: Canvas integration 4-file touch-set (bill_form discriminator)

**Goal:** Ship the 4-file canonical touch-set so ManualBillForm mounts via canvas-directive flow. `payment_approval_card` defers to session #2 (separate touch-set + 5th-file extension at PaymentApprovalQueueView.tsx).

**Files (modify all 4):**
- `apps/web/src/shared/types/canvasDirective.ts`
- `apps/web/src/components/bridge/MainframeRail.tsx`
- `apps/web/src/components/bridge/ContextualCanvas.tsx`
- `apps/web/src/agent/prompts/suffixes/canvasContextSuffix.ts`

**Steps:**

- [ ] **5a.** `canvasDirective.ts` — add `{ type: 'bill_form'; orgId: string }` union member at the Phase 1.1 cluster (insert near `journal_entry_form` / `reversal_form` / `adjustment_form` / `recurring_template_form` form-shape neighbors per naming-convention parity).

- [ ] **5b.** `MainframeRail.tsx`:
  - Add ICONS entry: `{ id: 'bill_form', label: 'New Bill', icon: '\u{1F4C4}' }` (or analogous glyph at implementer discretion; verify uniqueness against current 11 entries)
  - Add `handleClick` case: `case 'bill_form': onNavigate({ type: 'bill_form', orgId }); break;`

- [ ] **5c.** `ContextualCanvas.tsx`:
  - Add import at top: `import { ManualBillForm } from '@/components/canvas/ManualBillForm';`
  - Add `renderDirective` case in form-shape cluster: `case 'bill_form': return <ManualBillForm orgId={d.orgId} onNavigate={onNavigate} />;`

- [ ] **5d.** `canvasContextSuffix.ts` — add `describeDirective` case: `case 'bill_form': return 'the new bill form';` (exhaustive switch; no default; TS would error otherwise).

- [ ] **5e.** Validation: `pnpm typecheck` green; `pnpm build` succeeds (catches exhaustive-switch + import errors).

---

### Task 6: Integration test for POST /bills route

**Goal:** Ship Category A floor tests (5 tests per integration-test-rules skill §3.2) + INV-AP-001 allocation sum + JE side-effects + recordMutation audit assertion. §3.1+§3.2 disciplines applied at template grain.

**Files:**
- CREATE: `apps/web/tests/integration/postBillRoute.test.ts`

**Steps:**

- [ ] **6a.** Verify substrate at task-start grain:
  - `apps/web/tests/integration/__helpers/` shape (existing helpers for buildServiceContext + adminClient setup)
  - Test-account-isolation pattern at `.claude/skills/integration-test-rules/SKILL.md` §3.1+§3.2

- [ ] **6b.** Author test with §3.1+§3.2 disciplines:
  - **§3.1 trace_id prefix:** `const traceId = uuidv4(); const prefix = 'T' + traceId.slice(0, 8) + '_';` — COA codes + bill_number created in test use `${prefix}*` to isolate from concurrent test data
  - **§3.2 JE append-only triggers:** `afterAll` voids `createdJeIds`; **NO DELETE attempts** on `journal_entries` / `journal_lines` / `recordMutation` audit rows (append-only triggers reject)

  Category A floor tests (5):
  1. **200 success path** (technically 201 for resource creation): POST valid bill input → 201 + `{ bill_id, journal_entry_id }`; verify bills row + bill_lines rows inserted + journal_entries row inserted with Dr expense / Cr ap_control shape + journal_lines rows inserted + recordMutation audit row emitted (`bill_created` action)
  2. **401 unauth**: POST without auth → 401
  3. **403 wrong-org**: POST with valid auth for org A but URL org B → 403 (or 400 if mismatch detected at route grain pre-withInvariants; verify which fires first)
  4. **422 Zod fail / 400**: POST with invalid input (e.g., negative `amount_cad`, missing `vendor_id`, etc.) → 400 with `{ error: 'Invalid request', details: [...] }`
  5. **500 service-error mapping**: POST that triggers ServiceError → status from `serviceErrorToStatus`

  Additional substantive assertions:
  - INV-AP-001 layer: post a bill, verify `sum(bill_lines.amount_cad) === bill.amount_cad` (allocation sum consistency)
  - JE side-effects: verify `journal_entries.posted` row + `journal_lines` with Dr expense accounts (per bill_line.account_id) + Cr ap_control_account_id; `journal_entries.entry_date` matches `parsed.entry_date`
  - `bills.posted_journal_entry_id` back-reference populated correctly (Sub-N(b) substrate)
  - `recordMutation` audit row emitted with `action: 'bill_created'` (verify via direct `audit_log` query)

- [ ] **6c.** Validation: `pnpm db:reset:clean && pnpm db:seed:all && pnpm test apps/web/tests/integration/postBillRoute.test.ts` passes.

---

### Task 7: bill.ts E2E fixture + billForm.spec.ts

**Goal:** Ship the first write-side E2E fixture (substrate-novel; sibling-pattern to existing `journalEntry.ts` navigation-only fixture) + Playwright E2E smoke spec for bill form.

**Files:**
- CREATE: `apps/web/tests/e2e/fixtures/bill.ts`
- CREATE: `apps/web/tests/e2e/billForm.spec.ts`

**Steps:**

- [ ] **7a.** Author `bill.ts` fixture mirroring `journalEntry.ts` shape (navigate via MainframeRail title click; submit via form button click; assert via expect+toBeVisible patterns). Helpers:
  - `gotoBillForm(page, orgId)` — navigate to org root + click MainframeRail "New Bill" title + wait for heading
  - `fillBillForm(page, fixture)` — fill all required form fields per fixture object (vendor selection via VendorPicker; bill_lines via add-line button + per-line field fills)
  - `submitBillForm(page)` — click submit + wait for either canvas-view-navigation OR error display
  - `assertBillCreated(page, expected)` — verify post-submit navigation to `report_open_bills` (per ManualBillForm onNavigate target) + new bill visible in open-bills table

- [ ] **7b.** Author `billForm.spec.ts`:
  - Single test: navigate to bill form → fill form with test fixture → submit → assert navigation to open-bills canvas + new bill visible
  - Use `CONTROLLER_ORG_ID` from `tests/e2e/fixtures/auth.ts` (operating user has controller role; satisfies both `bill.post` permission grants)

- [ ] **7c.** Validation: `pnpm typecheck` green. **E2E execution itself is informational (per catch #37 lesson; founder-review-workflow grain, NOT chunk-close gate).** Do NOT cite `pnpm test:e2e` as validation gate step.

---

### Task 8: Validation gate

**Goal:** Verify all changes pass the chunk-close gate per CLAUDE.md "What done means" §1.

**Steps:**

- [ ] **8a.** Run `pnpm agent:validate` — must pass (26/26 currently; should remain 26/26 — no new agent-validate-tracked tests added this session).
- [ ] **8b.** Run `pnpm test` (full vitest suite) — must pass; new tests at `postBillRoute.test.ts` + updated `permissionCatalogSeed.test.ts` green.
- [ ] **8c.** Run `pnpm typecheck` — must pass; ZERO type errors.
- [ ] **8d.** Run `pnpm db:reset:clean && pnpm db:seed:all && pnpm test` — full suite at clean DB baseline; vitest count should be 816 + new tests (estimate: +5-8 from postBillRoute.test.ts; resulting baseline 821-824).
- [ ] **8e.** **NOT run as gate:** `pnpm test:e2e` (informational only per catch #37; founder-review-workflow grain).
- [ ] **8f.** Surface results to orchestrator. Bundle-horizon-risk check: count session-grain file changes; if >25 files OR >2200 lines, surface flag to orchestrator for 1+1+1 fork reconsideration per Surface 5.

---

## Carry-forward inventory

**Active for session #2 firing (after this session ships):**
- `POST /api/orgs/[orgId]/bills/[billId]/approve-for-payment` route
- `PaymentApprovalCard` canvas view
- `payment_approval_card` canvas discriminator
- `PaymentApprovalQueueView.tsx` row-click amendment (5th canvas integration file)
- Integration test for approve route (Category A floor + INV-AP-002 state transition)
- `paymentApprovalCard.spec.ts` Playwright E2E
- **D2.7 screenshot gate (γ) firing** — 7-shot sequence
- Closeout artifacts (friction-journal entry + retrospective inline + push-readiness three-condition gate + chunk-completion bundled commit + push to origin/staging)

**Active for subsequent-chunk firing:**
- FT1 `clampTtl` NaN-guard — preserved-deferred to storage-substrate-touching chunk
- Item 18 org_settings substrate-floor — preserved-deferred per (orgset-β)

**Active for Phase 5 arc-closure retrospective (32 candidates entering implementation post-(a) (d) ratifications + brainstorm-side parallel-surface 32nd candidate ratification):**
- All catches #1-#46 logged per founder Item 3 + (a) + (d) ratifications (cumulative N=45)
- B5-3-D1 read-side header drift correction (apReportService.ts + vendorReportService.ts; N=11 loci in apReportService.ts alone) per founder Item 4 ratification
- Chain-of-drift propagation pattern (#38 + #45-candidate at different propagation shapes)
- Substrate-citation-metadata drift sub-pattern (#39 + #44 cross-classification evidence basis)
- Within-arc under-specification sub-cluster (N=4 if #43 logs)
- Within-arc WSL-side substrate-citation drift sub-pattern (N=4-5 depending on #44/#45 logging)
- NEW dispatch-mandate-violation 4th grain-axis bucket (#42)

---

## Plan-doc-grain dispositions surfaced during draft (RATIFIED by founder per (a)-(g))

1. **D3.4 role-key mapping resolution** — disk-grounded `roles` table has 3 system roles (`controller`, `ap_specialist`, `executive`); NO `accountant` role. **Founder (b) ratified:** map "accountant" → `ap_specialist`. **Catch #45 logged per (a) (d) hybrid** at chain-of-drift through founder-ratification surface (NEW sub-shape).

2. **D3.5 Path X conditional resolution** — payment approval card is vendor-display-only (per-bill directive carries billId; bill carries vendor_id). VendorPicker has 1 immediate consumer at B5-3-D3; Path (X) thin abstraction ships per future-cross-feature-consumer amortization argument. **Ratified.**

3. **Session-scope split** — session #1 ships migration with BOTH ActionName entries atomically; session #2 ships approve route + card consumer. Migration ships once with `bill.approve` permission row already seeded; session #2 wraps without additional migration. **Ratified.**

4. **Bundle-horizon estimate (post-catch-#46 amendment):** session #1 projected file count: 8 create + 6 modify = 14 files; projected line count: ~1350-1500 lines (migration ~50; route ~70; VendorPicker ~80; ManualBillForm **~500-600** post-form-schema-separation + transform + dropdown UX patterns; tests ~400; canvas integration ~30; ACTION_NAMES ~5; CA-28 ~20). Under 25-file / 2200-line threshold per Surface 5 flag; (cadence-β-i-b) 2-session bundled cadence safe.

5. **Catch #46 logged per (d)** — WSL-side substrate-citation drift at code-template grain; form schema separated from service schema per JournalEntryForm precedent. Task 4b template AMENDED with `ManualBillFormSchema` + `formStateToServiceInput` typed transform → `PostBillInputRaw` + `resolver: zodResolver(ManualBillFormSchema)` in useForm. Brainstorm-side catch-characterization framing sub-grain drift (item g) NOT logged per founder discretion.

6. **D3.11 UX-scope ratifications (item e)** — 17 field dispositions ratified; `ap_control_account_id` UX uses COA-template-seed-grounded "Accounts Payable" name-substring default with operator override; `fiscal_period_id` UX uses current-period default per JournalEntryForm precedent. Per-line `account_id` (COA-expense filter) + `tax_code_id` (tax_codes picker) ratified.

7. **Catch classification framework (item f)** — defer to Phase 5 arc-closure retrospective synthesis. Cumulative N=45 entering implementation; **32 arc-closure retrospective candidates** active (32nd ratified per brainstorm-side parallel-surface observation: hybrid catch classification model precision — sub-bucket totals can exceed cumulative N for hybrid-classified catches; framing convention codification candidate for arc-closure).

---

**Plan doc amendments complete per founder ratifications (a)-(g). Surfacing for brainstorm-side parallel-surface convergence verification before founder dispatch authorization.** Per founder directive: "Do NOT auto-progress to implementer dispatch."
