# Phase 5 Chunk B5-3-D4 Substantive Session #1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship session #1 substrate buildout per (cadence-β-i-b) 2-session bundled cadence ratified at chunk B5-3-D4 onset:

1. ACTION_NAMES + permissions migration (atomic; 1 entry `'bill.record_payment'`; role grants `ap_specialist + controller` per founder Item 2 ratification — operational accounting analogous to `bill.post`)
2. `POST /api/orgs/[orgId]/bills/[billId]/record-payment` mutation route (consumes `billService.recordPayment` via `withInvariants(action: 'bill.record_payment')`; status 200 state-transition per recurring-runs + B5-3-D3 approve precedent)
3. `RecordPaymentCard` canvas view (per-bill form-grain UX; form-schema separation per catch #46 + ManualBillForm precedent; payment_method enum picker + cash_account_id COA-asset picker with "Cash and Cash Equivalents" name-substring default + 4 other form fields + ap_control_account_id form-re-ask per Item 5 ratification)
4. `payment_record_card` canvas integration (4-file canonical touch-set per brainstorm-side Item 4 (β) naming convention parity with `payment_approval_card`)
5. Integration test for `POST /record-payment` route (5 Category A floor + INV-AP-001 allocation-sum + INV-AP-002 state-transition + JE side-effect verification — Dr ap_control + Cr cash + Reading B emit via journalEntryService.post + state transition assertion `partially_paid` OR `fully_paid` + recordMutation audit `'bill_payment_recorded'` per integration-test-rules skill §3.1+§3.2)

**Session #2 ships (OUT OF SCOPE this session per (cadence-β-i-b) closeout-absorbed precedent):** 5th-file `PaymentApprovalQueueView.tsx` row-click amendment **REVIVED with NEW target** `record_payment_card` (forward-progress B5-3-D2 substrate amendment; semantically valid per catch #57 sub-surface re-framing — record-payment's `approved_for_payment` entry-state matches existing queue filter canonically) + `recordPaymentCard.spec.ts` Playwright E2E spec + `bill.ts` fixture extension + **D2.7 incremental Shot #8 capture** (NEW surface only per founder Item 3 (a-ii) ratification) + closeout artifacts (friction-journal chunk-B5-3-D4 entry + push-readiness three-condition gate evaluation + chunk-completion bundled commit + push to origin/staging).

**Architecture:** State-transition mutation route + per-bill form-grain canvas view. Per service-architecture skill §2: mutation route wraps via `withInvariants(action: 'bill.record_payment')`; `billService.recordPayment` is unwrapped Pattern B (verified at billService.ts:488-489). Route URL mirrors verb-segment precedent at recurring-runs/[runId]/approve/route.ts + B5-3-D3 approve-for-payment route. RecordPaymentCard form-grain UX mirrors ManualBillForm form-schema separation (per catch #46) + PaymentApprovalCard per-bill discriminator shape (`{ orgId, billId, onNavigate }`).

**Tech Stack:** Next.js App Router, React 18+ (`'use client'`), TypeScript, Zod, react-hook-form + `@hookform/resolvers/zod`, Vitest (integration), Playwright (E2E session #2), supabase-js, Decimal.js.

**Locked-scope context (chunk B5-3-D4 onset triangulation ratifications 2026-05-12; convergent across WSL-side + brainstorm-side; founder ratified per items (1)-(5)):**

- **D4.1 cadence:** (cadence-β-i-b) 2-session bundled per cross-arc N=3 evidence basis (B5-2 + B5-3-D2 + B5-3-D3). Session #1 = substrate buildout (migration + route + RecordPaymentCard + canvas integration + integration test); session #2 = PaymentApprovalQueueView row-click amendment + E2E + D2.7 incremental Shot #8 + closeout.
- **D4.2 mutation-route shape:** recurring-runs + B5-3-D3 approve precedent (recon-verified). Static action `'bill.record_payment'` per billService.ts:488-489 canonical. Status **200** state-transition (NOT 201 — no new resource created at route grain; payment_id created internally as side-effect but route returns state transition).
- **D4.3 action name:** `'bill.record_payment'` (dot-notation withInvariants action) — DISTINCT from audit-name `'bill_payment_recorded'` (snake_case audit_log.action grain) per recon Target 1 step 12. Integration test queries `audit_log` with `'bill_payment_recorded'` (NOT action-name).
- **D4.4 role mapping (founder Item 2 ratification):** `bill.record_payment` → `ap_specialist + controller` per spend brief §3.1 mapping table grounding + §9.1 + §15 + ap_specialist description (mirrors `bill.post` precedent; record-payment is operational accounting analogous to bill creation; SoD axis preserved at `bill.approve` controller-only gate).
- **D4.5 RecordPaymentCard form-grain UX (founder Item 5 ratification):** Per-bill form. **Form-schema separation per catch #46** — `RecordPaymentFormSchema` (UI shape; string-money) + `formStateToServiceInput(state, orgId, billId): RecordBillPaymentInputRaw` typed transform + `resolver: zodResolver(RecordPaymentFormSchema)` in useForm. Form fields:
  - **User-facing required:** `payment_method` (enum picker: 5 values per `PaymentMethodSchema`), `payment_date` (date input; default today), `amount_cad` (numeric input — partial-payment allowed; INV-AP-001 enforced at service grain), `cash_account_id` (COA-asset picker with "Cash and Cash Equivalents" name-substring default per recon Target 4), `fiscal_period_id` (period picker; current-period default per JournalEntryForm + ManualBillForm precedent), `entry_date` (date input; default today), **`ap_control_account_id`** (COA-liability picker with "Accounts Payable" name-substring default; **form-re-asks per Item 5 ratification** — simpler than JE-line-traversal derivation; mirror ManualBillForm pattern)
  - **User-facing optional:** `reference_number` (text input; e.g. check number)
  - **Derived (NOT user-facing):** `org_id` (from route URL), `bill_id` (from canvas directive)
- **D4.6 canvas discriminator naming (brainstorm-side Item 4 sub-lean (β) ratification):** `payment_record_card` per `<process>_<entity>_card` convention parity with `payment_approval_card` (B5-3-D3 session #2 substrate).
- **D4.7 canvas integration touch-set:** 4-file canonical at session #1 (canvasDirective + ContextualCanvas + canvasContextSuffix + new RecordPaymentCard import). 5th-file PaymentApprovalQueueView amendment defers to session #2.
- **D4.8 test architecture grain:** Hybrid Vitest integration + Playwright E2E per B5-3-D3 precedent. Integration test at session #1 (this); E2E spec at session #2. **§3.2 JE accumulation discipline APPLIES** (recordPayment IS Reading-B-emitting — Dr ap_control + Cr cash JE via journalEntryService.post per recon Target 1 step 8); `afterAll` voids created journal_entry_ids (NO DELETE on append-only).
- **D4.9 D2.7 incremental gate at session #2 closeout (founder Item 3 (a-ii) ratification):** Capture **only NEW Shot #8** (RecordPaymentCard mounted); prior 6 user-accessible shots verified at B5-3-D3 gate (no regression-test rationale absent material change to those surfaces). Phase A scope expands from 7 → 8 surfaces; 7 user-accessible + 1 substrate-ship-only (PaymentApprovalCard deferred per Item 5).
- **D4.10 catch ledger continuity (founder Item 1 ratification):** Catch #61 logged (MEMORY.md edit-anchor under-specification grain; sibling cluster #33+#35+#36+#43+#53+#56+#58 → within-arc under-specification **N=8**). Cumulative entering implementation: **N=60** (was N=59; +#61).
- **D4.11 catch #57 sub-surface re-framing carry-forward:** PaymentApprovalQueueView filter `approved_for_payment` is semantically CORRECT relative to record-payment action (recon Target 1 step 4: INV-AP-002 `allowedStates = {approved_for_payment, partially_paid}`; queue filter matches first state canonically). Arc-closure substrate-correction scope re-framed — UX-naming-grain (queue rename per Option ii) + add-Pending-Approvals-view (Option i) rather than filter-change. Founder substrate-decision authority at arc-closure synthesis venue.

**Patterns inherited from chunk B5-3-D3 + canonical substrate (substrate-grounded against HEAD `6a99c2c`):**

- **recurring-runs approve route canonical shape** + **B5-3-D3 approve-for-payment route precedent** (`apps/web/src/app/api/orgs/[orgId]/bills/[billId]/approve-for-payment/route.ts`):
  - 7-import block: NextResponse + z + Schema + withInvariants + service + buildServiceContext + ServiceError + serviceErrorToStatus
  - POST handler signature: `(req: Request, { params }: { params: Promise<{ orgId: string; billId: string }> })`
  - Body parse with empty-fallback (`await req.json().catch(() => ({}))`)
  - Schema parse with URL params spread: `Schema.parse({ org_id: orgId, bill_id: billId, ...json })`
  - withInvariants wrap: `withInvariants(service.fn, { action })(parsed, ctx)`
  - Status 200 on success (state transition; NO new resource creation at route grain)
  - try/catch: ZodError → 400; ServiceError → mapped via serviceErrorToStatus; unknown → 500
- **ManualBillForm form-schema separation precedent** (`apps/web/src/components/canvas/ManualBillForm.tsx`, 630 lines; catch #46 applied):
  - `ManualBillFormSchema` (UI shape) DISTINCT from `PostBillInputSchema` (service shape)
  - `formStateToServiceInput(state, orgId): PostBillInputRaw` typed transform
  - `resolver: zodResolver(ManualBillFormSchema)` in useForm
  - 4 dropdown fetches with useEffect cancellation guards (fiscal-periods + COA-liability + COA-expense + tax-codes)
  - Name-substring default selection pattern (COA-liability "Accounts Payable" match)
  - useFieldArray for repeated fields (NOT applicable to RecordPaymentCard — single payment per call)
- **PaymentApprovalCard per-bill canvas view precedent** (`apps/web/src/components/canvas/PaymentApprovalCard.tsx`, 163 lines):
  - `'use client'` directive
  - Props: `{ orgId, billId, onNavigate }`
  - useEffect cancellation guard for bill detail fetch (reuses queue endpoint + client-side billId filter)
  - handleAction fetch POST with empty body + 401 redirect + error display + onNavigate post-success
  - Loading/error/missing-bill stencils
- **adminClient + ServiceContext + Zod boundary (Layer 2)** + **(γ-a) bundle pattern** + **§3.1+§3.2 integration-test-rules disciplines** + **CLAUDE.md §UI-session screenshot gate (Item 5 substrate-ship-only-exception ratified)**

**Prophylactic catch-lesson application (catches #34-#61):**

Apply at code-template grain (NOT just lesson-statement per catch #39):

- **#34** verbatim import paths: `CanvasNavigateFn` from `@/shared/types/canvasDirective` (NOT `@/components/canvas/types`)
- **#35** 4-file canvas integration canonical touch-set (this session ships 4 files; 5th-file PaymentApprovalQueueView amendment defers to session #2)
- **#36** TS-typing input parameter resolution: `RecordBillPaymentInputSchema` shape verified-on-disk + `PaymentMethodSchema` enum 5 v1-active values
- **#37** validation gate scope = `agent:validate + test + typecheck` ONLY (NOT `pnpm build`; NOT `pnpm test:e2e`)
- **#38** catch ledger count internal consistency
- **#39** prophylactic lesson application propagates lesson-statement → code-template grain
- **#40** action name `'bill.record_payment'` verbatim per billService.ts:488-489 canonical (DISTINCT from audit-name `'bill_payment_recorded'`)
- **#41** count-quantification grounded against full-file disk scan (line citations approximate; verify at task-start grain)
- **#42** implementer subagent dispatches enforce explicit mandate-scope boundaries
- **#43** canvas integration enumeration explicit (4-file this session; 5th-file at session #2)
- **#44** chunk-attribution grounded against disk-verified chunk-of-origin
- **#45** role_key citations grounded against disk-verified `roles` table (3 system roles: `controller + ap_specialist + executive`)
- **#46** form/service schema separation: `RecordPaymentFormSchema` (UI) + transform → `RecordBillPaymentInputRaw` (service)
- **#47** timestamp grounded against next-available migration timestamp at task-start (post-`20240140000000` from B5-3-D3 session #1 migration)
- **#48** schema-field-name grounded against disk-verified field
- **#49** endpoint-path grounded against disk-verified location
- **#50** `pnpm build` NOT cited as validation gate step
- **#51** column-name grounded against disk-verified table schema (e.g., `bills.lifecycle_state`)
- **#52** seed-data-assumption grounded — B5-3-D3 session #1 `seedTestVendor` E2E fixture helper already established for fixture-grain seeding
- **#53** hardcoded-count-asserting-file enumeration grounded (CA-28 + CA-37 BOTH must update with new permission entry)
- **#54** ESLint rule `services/withInvariants-wrap-or-annotate` pre-existing on 5 Phase 5 service files — non-blocking per CLAUDE.md §1 chunk-close gate; carry-forward to arc-closure venue
- **#55** PaymentApprovalQueueRow type-shape grounded (`MoneyAmount` branded; NOT `string`)
- **#56** amendment-site enumeration grounded (prop destructure + onClick BOTH required if amendment fires; defers to session #2)
- **#57** substrate-grain semantic drift at downstream-consumer — sub-surface re-framing per D4.11 (queue filter semantically correct relative to record-payment action)
- **#58** pre-seed dependency at gate-execution — session #1 doesn't fire D2.7 gate (defers to session #2)
- **#59** chain-of-drift through count-propagation — friction-journal venue
- **#60** substrate-grain capability gap at gate-execution — applies to RecordPaymentCard ONLY at D2.7 grain if agent-directive entry is canonical path; per Surface 7 row-click amendment is the canonical entry path → no capability gap surface at B5-3-D4 (row-click is browser-native)
- **#61** MEMORY.md edit-anchor under-specification grain (sibling cluster #33+#35+#36+#43+#53+#56+#58 → within-arc N=8 codification-candidate strengthens further)

**Out of scope this session:**

- **PaymentApprovalQueueView row-click amendment** — session #2 (per (cadence-β-i-b) closeout-absorbed precedent + workload distribution)
- **`recordPaymentCard.spec.ts` Playwright E2E spec + bill.ts fixture extension** — session #2
- **D2.7 incremental Shot #8 capture** — session #2 closeout
- **Closeout artifacts** — session #2 absorbs (friction-journal entry + retrospective inline per §Drift-C + push-readiness three-condition gate + chunk-completion bundled commit + push to origin/staging)
- **`billService.reverse` mutation route + UX** — out-of-chunk per Surface 1 scope-lock; defers to B5-3-D5 OR arc-closure substrate-correction venue
- **Phase 5 service-file header/per-property annotation amendments** — arc-closure carry-forward per founder Item 4 (B5-3-D3) + candidate 4 EXPANDED scope
- **B5-3-D3 substrate amendments** (closed; preserved per §Drift-B + δ-i)
- **Pending Approvals canvas view + apReportService.paymentApprovalQueue filter semantic-drift correction** — arc-closure substrate-amendment scope per founder Item 4 + sub-surface re-framing at D4.11
- **Agent canvas-directive emission capability wiring for `payment_approval_card`** — arc-closure substrate-amendment scope (catch #60 carry-forward; does NOT affect B5-3-D4 since RecordPaymentCard entry is browser-native row-click)
- **Bill detail endpoint** (new GET endpoint) — defer per Disposition (α) precedent at B5-3-D3 (reuse queue endpoint + client-side filter at card grain)
- **CA-37 count updates beyond 1-permission increment** — only `'bill.record_payment'` added this session

---

## Files

**Files to create (4):**

Migration (1):
- `supabase/migrations/<timestamp>_bill_record_payment_action_permission.sql` — atomic transaction; 1 permission row (`'bill.record_payment'`) + role grants (controller + ap_specialist) per founder Item 2 D4.4 disposition

API route (1):
- `apps/web/src/app/api/orgs/[orgId]/bills/[billId]/record-payment/route.ts` — POST handler; consumes `billService.recordPayment` via `withInvariants(billService.recordPayment, { action: 'bill.record_payment' })`; URL params spread into service input; status 200

Canvas component (1):
- `apps/web/src/components/canvas/RecordPaymentCard.tsx` — per-bill form-grain canvas view; form-schema separation per catch #46; 7 form fields (5 required + 1 optional + 1 form-re-ask); mirror ManualBillForm + PaymentApprovalCard precedent shapes

Integration test (1):
- `apps/web/tests/integration/recordBillPaymentRoute.test.ts` — Category A floor tests (5) + INV-AP-001 allocation-sum + INV-AP-002 state-transition + JE side-effect verification (Dr ap_control + Cr cash + Reading B preserved) + state transition assertion (`partially_paid` OR `fully_paid`) + bill_payment_allocations row inserted + payments row inserted + recordMutation audit `'bill_payment_recorded'` per §3.1+§3.2 disciplines

**Files to modify (5):**

ACTION_NAMES + CA-28 + CA-37 (3):
- `apps/web/src/services/auth/canUserPerformAction.ts` — extend `ACTION_NAMES` `as const` tuple with `'bill.record_payment'` entry (under existing "AP/Spend (Phase 5 B5-3-D3)" cluster OR new "AP/Spend (Phase 5 B5-3-D4)" cluster per implementer discretion)
- `apps/web/tests/integration/permissionCatalogSeed.test.ts` — bump CA-28 hardcoded counts: 27 → 28 total; controller 27 → 28; ap_specialist exact-set 5 → 6 with `'bill.record_payment'` inserted alphabetically (between `'ap_actions.read'` and `'bill.post'` OR per existing sort)
- `apps/web/tests/integration/crossOrgRlsIsolation.test.ts` — bump CA-37 hardcoded counts: permissions 27 → 28; role_permissions count increases by 2 (controller +1 + ap_specialist +1); verify current count first then increment by 2

Canvas integration 4-file canonical touch-set (3 of 4 in this list — the 4th is in "Files to create" above for RecordPaymentCard):
- `apps/web/src/shared/types/canvasDirective.ts` — add `{ type: 'payment_record_card'; orgId: string; billId: string }` discriminator at Phase 1.1 cluster (insert near `payment_approval_card` from B5-3-D3 per `<process>_<entity>_card` naming-convention parity)
- `apps/web/src/components/bridge/ContextualCanvas.tsx` — add import: `import { RecordPaymentCard } from '@/components/canvas/RecordPaymentCard';`; add `renderDirective` case: `case 'payment_record_card': return <RecordPaymentCard orgId={d.orgId} billId={d.billId} onNavigate={onNavigate} />;` (insert near `payment_approval_card` case cluster)
- `apps/web/src/agent/prompts/suffixes/canvasContextSuffix.ts` — add `describeDirective` case: `case 'payment_record_card': return 'the record payment card';` (exhaustive switch; no default — verify TS compilation post-add)

**Files NOT touched (preservation):**

B5-3-D3 substrate (closed; preserved per §Drift-B + δ-i):
- `apps/web/src/app/api/orgs/[orgId]/bills/route.ts` — POST /bills route (B5-3-D3 session #1 ship)
- `apps/web/src/app/api/orgs/[orgId]/bills/[billId]/approve-for-payment/route.ts` — approve route (B5-3-D3 session #2 ship)
- `apps/web/src/components/canvas/ManualBillForm.tsx` — consumed as form-schema separation precedent; not modified
- `apps/web/src/components/canvas/PaymentApprovalCard.tsx` — consumed as per-bill card precedent; not modified
- `apps/web/src/components/canvas/_shared/VendorPicker.tsx` — not consumed by RecordPaymentCard (no vendor selection in record-payment UX); preserved

B5-2 substrate (closed; preserved):
- `apps/web/src/services/spend/billService.ts` — consumed unmodified; `recordPayment` method at lines 488-691
- `apps/web/src/shared/schemas/spend/bill.schema.ts` — consumed unmodified; `RecordBillPaymentInputSchema` at lines 104-117 + `PaymentMethodSchema` at lines 67-68

B5-3-D2 substrate (closed; preserved EXCEPT PaymentApprovalQueueView per session #2 row-click amendment):
- `apps/web/src/components/canvas/PaymentApprovalQueueView.tsx` — preserved this session; session #2 ships row-click amendment with NEW target `payment_record_card`

B5-3-D1 read-side substrate (closed; arc-closure header drift carry-forward per founder Item 4):
- `apps/web/src/services/spend/reports/apReportService.ts` — NO HEADER AMENDMENT this chunk
- `apps/web/src/services/spend/reports/vendorReportService.ts` — NO HEADER AMENDMENT this chunk

---

## Tasks

### Task 1: Migration + ACTION_NAMES + CA-28 + CA-37 count update (atomic permission substrate)

**Goal:** Ship the permission substrate so `withInvariants(action: 'bill.record_payment')` (Task 2) can pass `canUserPerformAction` checks. CA-27 parity test passes automatically once ACTION_NAMES + migration ship in same commit. CA-28 + CA-37 hardcoded counts updated in same commit per Permission Catalog Count Drift convention.

**Files:**
- CREATE: `supabase/migrations/<timestamp>_bill_record_payment_action_permission.sql`
- MODIFY: `apps/web/src/services/auth/canUserPerformAction.ts`
- MODIFY: `apps/web/tests/integration/permissionCatalogSeed.test.ts`
- MODIFY: `apps/web/tests/integration/crossOrgRlsIsolation.test.ts`

**Steps:**

- [ ] **1a.** Read pre-migration counts (catch #47 + #53 lesson): verify CA-28 + CA-37 current baseline at task-start grain. Expected post-B5-3-D3: CA-28 `total=27 / controller=27 / ap_specialist=5 / executive=4`; CA-37 `permissions=27 / role_permissions=36`. If pre-task baseline differs, recompute increments.

- [ ] **1b.** Author migration `supabase/migrations/<timestamp>_bill_record_payment_action_permission.sql` (substitute timestamp; next-available after most-recent existing migration — verify via `ls supabase/migrations/`):

```sql
-- =============================================================
-- <timestamp>_bill_record_payment_action_permission.sql
-- Phase 5 chunk B5-3-D4 substantive session #1:
-- bill.record_payment permission for AP payment-execution write-side UI chunk
-- =============================================================
-- Adds 1 new permission per ADR-0015 Spend subdomain + chunk B5-3-D4
-- onset triangulation (founder Item 2 ratification per spend brief
-- §3.1 + §9.1 + §15 grounding + ap_specialist role description).
--
-- Role grants (operational accounting; mirrors bill.post precedent):
--   bill.record_payment  → ap_specialist + controller (payment-execution
--                          is operational accounting analogous to bill
--                          creation; SoD axis preserved at bill.approve
--                          controller-only gate)
--
-- Sort_order placement: Accounting, sort_order 20
--   (After bill.approve at 19 per B5-3-D3 session #1 migration
--   20240140000000. Implementer-subagent: verify next-available slot at
--   task-start grain if other migrations have shipped between B5-3-D3
--   ship and this implementation.)
--
-- Catalog count impact:
--   permissions:       27 → 28 (+1)
--   role_permissions:  36 → 38 (+2; controller +1 + ap_specialist +1)
--
-- Parity:
--   CA-27 (permissionParity.test.ts) passes automatically once
--   ACTION_NAMES carries 'bill.record_payment' alongside this seed
--   (added in the same commit; see canUserPerformAction.ts edit).
--   CA-28 (permissionCatalogSeed.test.ts) hardcoded counts bumped
--   from 27 to 28 in the same commit per the Permission Catalog
--   Count Drift convention (conventions.md).
--   CA-37 (crossOrgRlsIsolation.test.ts) hardcoded counts bumped
--   from 27/36 to 28/38 in the same commit.
--
-- Mirror pattern: 20240140000000_bill_action_permissions.sql (B5-3-D3
-- session #1 migration; bill.post + bill.approve atomic).
-- =============================================================

BEGIN;

INSERT INTO permissions (permission_key, display_name, category, sort_order) VALUES
  ('bill.record_payment', 'Record bill payments', 'Accounting', 20);

-- Controller + AP specialist (operational accounting; mirrors bill.post)
INSERT INTO role_permissions (role_id, permission_key)
SELECT r.role_id, p.permission_key
FROM roles r, permissions p
WHERE r.role_key IN ('controller', 'ap_specialist')
  AND p.permission_key = 'bill.record_payment';

COMMIT;
```

- [ ] **1c.** Extend `ACTION_NAMES` in `apps/web/src/services/auth/canUserPerformAction.ts` — add 1 entry `'bill.record_payment'` to the `as const` tuple. Placement: implementer discretion; suggest under existing "AP/Spend (Phase 5 B5-3-D3)" cluster (per B5-3-D3 session #1 cluster convention; OR new "Phase 5 B5-3-D4" sub-cluster) per category-grouping precedent.

- [ ] **1d.** Update `apps/web/tests/integration/permissionCatalogSeed.test.ts`:
  - Bump `expect(data).toHaveLength(27)` → `28` (total permissions assertion)
  - Bump controller `expect(perms).toHaveLength(27)` → `28`
  - Bump ap_specialist `expect(perms).toHaveLength(5)` → `6`
  - Update ap_specialist exact-set assertion: insert `'bill.record_payment'` in sorted position (alphabetical: between `'bill.post'` and `'chart_of_accounts.read'`)
  - Preserve executive 4 unchanged

- [ ] **1e.** Update `apps/web/tests/integration/crossOrgRlsIsolation.test.ts`:
  - CA-37 permissions: 27 → 28
  - CA-37 role_permissions: 36 → 38 (+2: controller +1 + ap_specialist +1)

- [ ] **1f.** Validation: `pnpm db:reset:clean && pnpm db:seed:all && pnpm test apps/web/tests/integration/permissionCatalogSeed.test.ts apps/web/tests/integration/permissionParity.test.ts apps/web/tests/integration/crossOrgRlsIsolation.test.ts` passes. CA-27 + CA-28 + CA-37 all green.

---

### Task 2: POST /api/orgs/[orgId]/bills/[billId]/record-payment route

**Goal:** Ship the state-transition mutation route. Wrap with `withInvariants(action: 'bill.record_payment')`; spread URL params into service input per recurring-runs + B5-3-D3 approve precedent. Status 200 (state transition; payment_id created as service-grain side-effect but route returns state-transition `{ payment_id, bill_id, journal_entry_id, new_lifecycle_state }`).

**Files:**
- CREATE: `apps/web/src/app/api/orgs/[orgId]/bills/[billId]/record-payment/route.ts`

**Steps:**

- [ ] **2a.** Verify substrate at task-start grain (catch #34 + #36 + #49 lessons applied):
  - `apps/web/src/app/api/orgs/[orgId]/bills/[billId]/approve-for-payment/route.ts` — canonical precedent shape (B5-3-D3 session #2 substrate)
  - `apps/web/src/shared/schemas/spend/bill.schema.ts` — `RecordBillPaymentInputSchema` shape at lines 104-117 (verify-from-disk; recon Target 2 grounded)
  - `apps/web/src/services/spend/billService.ts:488-498` — `recordPayment` signature (already grounded via recon)

- [ ] **2b.** Author route per template (mirrors B5-3-D3 approve route canonical):

```typescript
// src/app/api/orgs/[orgId]/bills/[billId]/record-payment/route.ts
//
// Phase 5 chunk B5-3-D4 substantive session #1: state-transition mutation
// route for bill payment recording. Consumes billService.recordPayment per
// service-architecture skill §2:
//   - billService is unwrapped Pattern B (verified at billService.ts:488-489)
//   - route layer wraps via withInvariants(action: 'bill.record_payment')
//   - bill.record_payment ActionName + permissions seeded at session #1
//     migration <timestamp>_bill_record_payment_action_permission.sql
//
// Mirror pattern: B5-3-D3 approve-for-payment route at
// apps/web/src/app/api/orgs/[orgId]/bills/[billId]/approve-for-payment/route.ts
// (verb-segment URL canonical at HEAD 6a99c2c). Returns 200 (state
// transition: approved_for_payment OR partially_paid → partially_paid OR
// fully_paid per allocation-sum logic; payment_id created as service-grain
// side-effect but route returns state-transition payload).

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { RecordBillPaymentInputSchema } from '@/shared/schemas/spend/bill.schema';
import { withInvariants } from '@/services/middleware/withInvariants';
import { billService } from '@/services/spend/billService';
import { buildServiceContext } from '@/services/middleware/serviceContext';
import { ServiceError } from '@/services/errors/ServiceError';
import { serviceErrorToStatus } from '@/app/api/_helpers/serviceErrorToStatus';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ orgId: string; billId: string }> }
) {
  try {
    const { orgId, billId } = await params;
    const json = await req.json();

    const parsed = RecordBillPaymentInputSchema.parse({
      org_id: orgId,
      bill_id: billId,
      ...json,
    });

    const ctx = await buildServiceContext(req);

    // INV-SERVICE-001 wrap site: billService.recordPayment is unwrapped
    // Pattern B; route handler wraps via withInvariants at the call site.
    const result = await withInvariants(
      billService.recordPayment,
      { action: 'bill.record_payment' }
    )(parsed, ctx);

    // 200 OK — state transition; returns { payment_id, bill_id,
    // journal_entry_id, new_lifecycle_state }.
    return NextResponse.json(result, { status: 200 });
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

- [ ] **2c.** Validation: `pnpm typecheck` green; route compiles. (Integration test verification at Task 4.)

---

### Task 3: RecordPaymentCard canvas view

**Goal:** Ship per-bill form-grain canvas view. Form-schema separation per catch #46 + ManualBillForm precedent + PaymentApprovalCard per-bill discriminator shape.

**Files:**
- CREATE: `apps/web/src/components/canvas/RecordPaymentCard.tsx`

**Steps:**

- [ ] **3a.** Verify substrate at task-start grain (catches #34 + #36 + #46 + #48 + #51 lessons applied):
  - `apps/web/src/components/canvas/ManualBillForm.tsx` (630 lines) — form-schema separation pattern + 4-dropdown-fetch + name-substring default-select pattern
  - `apps/web/src/components/canvas/PaymentApprovalCard.tsx` (163 lines) — per-bill discriminator + bill-detail-fetch via queue endpoint + fetch POST shape
  - `apps/web/src/shared/schemas/spend/bill.schema.ts:104-117` + `:67-68` — `RecordBillPaymentInputSchema` + `PaymentMethodSchema` (5 v1-active values)
  - Bill detail fetch shape: reuse `/api/orgs/${orgId}/reports/payment-approval-queue` per PaymentApprovalCard Disposition (α) precedent

- [ ] **3b.** Author `RecordPaymentCard.tsx` (target ~300-350 lines):

  Structural template (implementer fleshes JSX form fields):

```typescript
// src/components/canvas/RecordPaymentCard.tsx
'use client';
//
// Phase 5 chunk B5-3-D4 substantive session #1: RecordPaymentCard —
// per-bill form-grain canvas view for payment-execution action.
// Consumes POST /api/orgs/[orgId]/bills/[billId]/record-payment (Task 2
// route) which wraps billService.recordPayment via withInvariants(action:
// 'bill.record_payment'). Mirror pattern: ManualBillForm.tsx form-schema
// separation (catch #46) + PaymentApprovalCard.tsx per-bill discriminator.
//
// Reading B emit: recordPayment creates JE via journalEntryService.post
// (Dr ap_control + Cr cash; Sub-L CAD-only per billService.ts:516-523).
// State transition: approved_for_payment OR partially_paid → partially_paid
// (newSum < billAmount; partial payment) OR fully_paid (newSum >= billAmount;
// full payment).

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { RecordBillPaymentInputRaw } from '@/shared/schemas/spend/bill.schema';
import type { CanvasNavigateFn } from '@/shared/types/canvasDirective';
import type { PaymentApprovalQueueOutput, PaymentApprovalQueueRow } from '@/services/spend/reports/apReportService';

// ---------------------------------------------------------------------
// Form schema (UI-state shape; distinct from RecordBillPaymentInputSchema
// service boundary). String-typed money fields per ManualBillForm precedent.
// ---------------------------------------------------------------------

const RecordPaymentFormSchema = z.object({
  payment_method: z.enum(['check', 'eft', 'wire', 'cash', 'other']),
  payment_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Payment date required'),
  amount_cad: z.string().regex(/^\d+(\.\d{1,4})?$/, 'Amount required (numeric)'),
  reference_number: z.string(),
  fiscal_period_id: z.string().uuid('Period required'),
  entry_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Entry date required'),
  ap_control_account_id: z.string().uuid('AP control account required'),
  cash_account_id: z.string().uuid('Cash account required'),
});

type RecordPaymentFormState = z.infer<typeof RecordPaymentFormSchema>;

// ---------------------------------------------------------------------
// Form state → service input transform (mirror ManualBillForm
// formStateToServiceInput at line 217+ canonical). Empty reference_number
// maps to null per RecordBillPaymentInputSchema nullable shape.
// ---------------------------------------------------------------------

function formStateToServiceInput(
  state: RecordPaymentFormState,
  orgId: string,
  billId: string,
): RecordBillPaymentInputRaw {
  return {
    org_id: orgId,
    bill_id: billId,
    payment_method: state.payment_method,
    payment_date: state.payment_date,
    amount_cad: state.amount_cad,
    reference_number: state.reference_number || null,
    fiscal_period_id: state.fiscal_period_id,
    entry_date: state.entry_date,
    ap_control_account_id: state.ap_control_account_id,
    cash_account_id: state.cash_account_id,
  };
}

export type RecordPaymentCardProps = {
  orgId: string;
  billId: string;
  onNavigate: CanvasNavigateFn;
};

export function RecordPaymentCard({ orgId, billId, onNavigate }: RecordPaymentCardProps) {
  const [bill, setBill] = useState<PaymentApprovalQueueRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Bill detail fetch (reuse queue endpoint + client-side billId filter
  // per PaymentApprovalCard Disposition (α) precedent)
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch(`/api/orgs/${orgId}/reports/payment-approval-queue`)
      .then((res) => {
        if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
        return res.json() as Promise<PaymentApprovalQueueOutput>;
      })
      .then((body) => {
        if (cancelled) return;
        const found = body.bills.find((b) => b.bill_id === billId);
        if (!found) {
          setError(`Bill ${billId} not found in approval queue`);
        } else {
          setBill(found);
        }
        setLoading(false);
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
  }, [orgId, billId]);

  const form = useForm<RecordPaymentFormState>({
    resolver: zodResolver(RecordPaymentFormSchema),
    mode: 'onSubmit',
    defaultValues: {
      payment_method: 'check',  // implementer: consider empty default + disabled prompt
      payment_date: new Date().toISOString().slice(0, 10),
      amount_cad: '',
      reference_number: '',
      fiscal_period_id: '',
      entry_date: new Date().toISOString().slice(0, 10),
      ap_control_account_id: '',
      cash_account_id: '',
    },
  });

  // ----- Dropdown data fetches (implementer-subagent: useEffect cancellation
  // guards; mirror ManualBillForm precedent):
  //
  // 1. Fiscal periods: GET /api/orgs/[orgId]/fiscal-periods
  //    Default-select: current/first-open period per JournalEntryForm + ManualBillForm precedent.
  //
  // 2. COA-liability accounts: GET /api/orgs/[orgId]/chart-of-accounts
  //    filtered to account_type === 'liability'.
  //    Default-select: "Accounts Payable" name-substring match → ap_control_account_id.
  //
  // 3. COA-asset accounts: GET same endpoint filtered to account_type === 'asset'.
  //    Default-select: "Cash and Cash Equivalents" name-substring match → cash_account_id.
  //    Grounds: COA seed at supabase/migrations/20240101000000_initial_schema.sql:850+
  //    (account_code 1000 in holding_company + real_estate templates).

  const onSubmit = async (state: RecordPaymentFormState) => {
    setFormError(null);
    setSubmitting(true);
    try {
      const serviceInput = formStateToServiceInput(state, orgId, billId);
      const response = await fetch(
        `/api/orgs/${orgId}/bills/${billId}/record-payment`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(serviceInput),
        },
      );

      if (!response.ok) {
        const errorBody = await response.json();
        if (response.status === 400 && errorBody.details) {
          for (const issue of errorBody.details) {
            const path = issue.path.join('.');
            form.setError(path as Parameters<typeof form.setError>[0], {
              message: issue.message,
            });
          }
        } else if (response.status === 422 || response.status === 500) {
          setFormError(errorBody.message || errorBody.error || 'Payment recording failed');
        } else if (response.status === 401) {
          window.location.href = '/en/sign-in';
          return;
        } else {
          setFormError('An unexpected error occurred. Please try again.');
        }
        return;
      }

      await response.json();
      // On success: navigate back to queue (bill state transition surfaces in queue refetch)
      onNavigate({ type: 'report_payment_approval_queue', orgId });
    } catch {
      setFormError('An unexpected error occurred. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="text-sm text-neutral-400">Loading bill...</div>;
  if (error && !bill) return <div className="text-sm text-red-500">{error}</div>;
  if (!bill) return <div className="text-sm text-neutral-400">No bill data.</div>;

  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">
        Record Payment for Bill #{bill.bill_number ?? bill.bill_id.slice(0, 8)}
      </h2>
      {formError && (
        <div className="mb-4 p-3 border border-red-300 rounded bg-red-50 text-sm text-red-600">
          {formError}
        </div>
      )}

      {/* Bill detail summary — implementer fleshes:
          - Bill ID + bill_number + vendor + due_date + amount_cad + amount_due
          Use <dl> definition-list per PaymentApprovalCard precedent. */}

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* Payment fields — implementer fleshes per D4.5 UX:
            - payment_method * (<select> with 5 enum values)
            - payment_date * (<input type="date">; default today)
            - amount_cad * (numeric input; partial payment allowed)
            - cash_account_id * (COA-asset picker; "Cash and Cash Equivalents" default)
            - fiscal_period_id * (period picker; current-period default)
            - entry_date * (date input; default today)
            - ap_control_account_id * (COA-liability picker; "Accounts Payable" default)
            - reference_number (text input; optional)
            Use {...form.register(...)} bindings; loading stencils for dropdown data. */}

        <button
          type="submit"
          disabled={submitting}
          className="px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50"
        >
          {submitting ? 'Recording...' : 'Record Payment'}
        </button>
        <button
          type="button"
          onClick={() => onNavigate({ type: 'report_payment_approval_queue', orgId })}
          disabled={submitting}
          className="ml-2 px-4 py-2 bg-neutral-200 text-neutral-700 rounded text-sm hover:bg-neutral-300 disabled:opacity-50"
        >
          Cancel
        </button>
      </form>
    </div>
  );
}
```

  Implementer-subagent: flesh out the JSX form fields per D4.5 UX-scope (mechanical; mirror ManualBillForm form-field patterns). Bill detail summary section uses `<dl>` definition-list per PaymentApprovalCard precedent.

- [ ] **3c.** Validation: `pnpm typecheck` green.

---

### Task 4: Canvas integration 4-file touch-set (payment_record_card discriminator)

**Goal:** Ship 4 canonical canvas integration file modifications so RecordPaymentCard mounts via canvas-directive flow. 5th-file PaymentApprovalQueueView row-click amendment defers to session #2 per (cadence-β-i-b) workload distribution.

**Files (modify all 4):**
- `apps/web/src/shared/types/canvasDirective.ts`
- `apps/web/src/components/bridge/ContextualCanvas.tsx`
- `apps/web/src/agent/prompts/suffixes/canvasContextSuffix.ts`

(Plus `RecordPaymentCard.tsx` shipped at Task 3 = 4th file in the canonical touch-set.)

Note: `MainframeRail.tsx` NOT modified — `payment_record_card` is per-bill discriminator (requires billId; cannot invoke from MainframeRail which has no billId context).

**Steps:**

- [ ] **4a.** `canvasDirective.ts` — add `{ type: 'payment_record_card'; orgId: string; billId: string }` discriminator union member at Phase 1.1 cluster (insert near `payment_approval_card` from B5-3-D3 per `<process>_<entity>_card` naming-convention parity per brainstorm-side Item 4 (β) ratification).

- [ ] **4b.** `ContextualCanvas.tsx`:
  - Add import at top: `import { RecordPaymentCard } from '@/components/canvas/RecordPaymentCard';`
  - Add `renderDirective` case: `case 'payment_record_card': return <RecordPaymentCard orgId={d.orgId} billId={d.billId} onNavigate={onNavigate} />;` (insert near `payment_approval_card` case)

- [ ] **4c.** `canvasContextSuffix.ts` — add `describeDirective` case: `case 'payment_record_card': return 'the record payment card';` (exhaustive switch; no default — TS would error otherwise; verify compilation post-add).

- [ ] **4d.** Validation: `pnpm typecheck` green; exhaustive-switch enforces no missed case.

---

### Task 5: Integration test for POST /bills/[billId]/record-payment route

**Goal:** Ship Category A floor tests (5) + INV-AP-001 allocation-sum + INV-AP-002 state-transition + JE side-effect verification + state transition + audit assertion per integration-test-rules skill §3.1+§3.2. **§3.2 JE accumulation discipline APPLIES** (record-payment IS Reading-B-emitting; afterAll voids createdJeIds NO DELETE).

**Files:**
- CREATE: `apps/web/tests/integration/recordBillPaymentRoute.test.ts`

**Steps:**

- [ ] **5a.** Verify substrate at task-start grain:
  - `apps/web/tests/integration/postBillRoute.test.ts` (B5-3-D3 session #1; 5/5 Category A + JE side-effect + audit) — mirror pattern
  - `apps/web/tests/integration/billApproveForPaymentRoute.test.ts` (B5-3-D3 session #2; 5/5 Category A + state-transition + audit + Reading B NEGATIVE) — mirror state-transition assertion pattern (POSITIVE assertion for JE created at record-payment grain; opposite of approve's NEGATIVE)
  - `.claude/skills/integration-test-rules/SKILL.md` §3.1+§3.2 disciplines
  - `apps/web/src/services/spend/billService.ts:488-691` — recordPayment internals (already grounded via recon)

- [ ] **5b.** Author test with §3.1+§3.2 disciplines applied:
  - **§3.1 trace_id prefix:** `const traceId = uuidv4(); const prefix = 'T' + traceId.slice(0, 8) + '_';` on COA codes + bill_number + payment reference_number
  - **§3.2 JE accumulation:** `afterAll` voids `createdJeIds` (NO DELETE on `journal_entries` / `journal_lines` / `audit_log` — append-only)

  Category A floor tests (5):

  1. **200 success path — partial payment:** seed bill in `approved_for_payment` (amount_cad=200) → POST with amount_cad=100 → 200 + `{ payment_id, bill_id, journal_entry_id, new_lifecycle_state: 'partially_paid' }`; verify:
     - `bills.lifecycle_state` updated to `'partially_paid'`
     - `bill_payment_allocations` row inserted (allocation_id; bill_id; amount_cad=100)
     - `payments` row inserted (payment_id; payment_method; payment_date; reference_number)
     - `journal_entries` row inserted (entry_type='regular'; entry_date; description='Bill payment for {bill_id}')
     - `journal_lines` rows: 1 Dr (ap_control_account_id; debit=100; credit=0) + 1 Cr (cash_account_id; debit=0; credit=100); both in CAD; fx_rate=1
     - `audit_log` row emitted with `action: 'bill_payment_recorded'`, `entity_type: 'bill'`, `entity_id: bill_id`, `before_state.lifecycle_state: 'approved_for_payment'`

  2. **401 unauth:** POST without auth → 401

  3. **403 wrong-org:** POST with valid auth for org A but URL org B → 403 (withInvariants ORG_ACCESS_DENIED per session #2 approve route precedent)

  4. **400 Zod fail / 404 NOT_FOUND:** POST against non-existent bill_id → ServiceError `NOT_FOUND` → status 404 (per serviceErrorToStatus mapping; verified at B5-3-D3 session #2 test 4)

  5. **500 service-error / state-precondition mapping:** POST against bill NOT in `{approved_for_payment, partially_paid}` (e.g., `pending_approval`) → ServiceError `POST_FAILED` + `BILL_INVALID_STATE_TRANSITION` message → status 500 (per `serviceErrorToStatus('POST_FAILED')` = 500 mapping; verified at B5-3-D3 session #2 test 5)

  Additional substantive assertions:

  - **INV-AP-001 over-allocation:** seed bill (amount_cad=100) → POST with amount_cad=150 → ServiceError `POST_FAILED` + `BILL_OVER_ALLOCATION` message → status 500
  - **INV-AP-002 already-paid state:** seed bill in `fully_paid` → POST → ServiceError `POST_FAILED` + `BILL_INVALID_STATE_TRANSITION` (already covered by test 5 with different state)
  - **Full payment transition:** seed bill (amount_cad=100) in `approved_for_payment` → POST amount_cad=100 → expect `new_lifecycle_state: 'fully_paid'`; `bills.lifecycle_state === 'fully_paid'`
  - **Multiple partial payments accumulation:** seed bill (amount_cad=300) → POST amount_cad=100 (→ partially_paid) → POST amount_cad=100 again (→ partially_paid; cumulative=200<300) → POST amount_cad=100 (→ fully_paid; cumulative=300>=300); verify INV-AP-001 cumulative-sum logic
  - **Sub-L CAD-only precondition:** seed bill with currency='USD' (if Sub-L allows test path; otherwise skip) → POST → ServiceError `POST_FAILED` + `BILL_MULTI_CURRENCY_NOT_SUPPORTED`

- [ ] **5c.** Validation: `pnpm db:reset:clean && pnpm db:seed:all && pnpm test apps/web/tests/integration/recordBillPaymentRoute.test.ts` passes.

---

### Task 6: Validation gate (session #1 close)

**Goal:** Verify all session #1 changes pass the chunk-close gate per CLAUDE.md "What done means" §1.

**Steps:**

- [ ] **6a.** `pnpm agent:validate` — expect 26/26 (no new agent-floor tests at session #1).
- [ ] **6b.** `pnpm typecheck` — expect ZERO type errors.
- [ ] **6c.** `pnpm db:reset:clean && pnpm db:seed:all && pnpm test` — full vitest at clean DB; expect 826 (B5-3-D3 baseline) + new tests (estimate: +6-8 from recordBillPaymentRoute.test.ts; resulting baseline ~832-834).
- [ ] **6d.** **NOT run as gate:** `pnpm test:e2e` (catch #37) + `pnpm build` (catch #50).
- [ ] **6e.** Bundle-horizon check per Surface 5 framework: count session #1 file changes; if >25 files OR >2200 lines, surface flag to orchestrator. Estimate: ~9 files (4 modified + 5 new) / ~700-900 lines.

---

## Carry-forward inventory

**Active for session #2 firing (after this session ships):**
- 5th-file `PaymentApprovalQueueView.tsx` row-click amendment REVIVED with NEW target `payment_record_card`
- `recordPaymentCard.spec.ts` Playwright E2E spec
- `bill.ts` fixture extension (helpers for record-payment flow)
- **D2.7 incremental Shot #8 capture** (RecordPaymentCard mounted state per founder Item 3 (a-ii))
- Closeout artifacts: friction-journal chunk-B5-3-D4 entry + retrospective inline per §Drift-C + push-readiness three-condition gate evaluation + chunk-completion bundled commit + push to origin/staging

**Active for subsequent-chunk firing (2 items; preserved-deferred from prior chunks):**
- FT1 `clampTtl` NaN-guard at supabaseStorageProvider.ts:95-99 — storage-substrate-touching chunk
- Item 18 org_settings substrate-floor — (orgset-β) sub-arc

**Active for Phase 5 arc-closure retrospective (32+ candidates entering session #1):**
- All catches #1-#61 logged (cumulative N=60 per WSL-side count post-#61 ratification)
- 29 inherited + 3 new at B5-3-D3 close (cross-arc N=3 cadence; pre-existing-substrate-drift; D2.7-gate-with-substrate-ship-only-exception)
- Candidate 4 EXPANDED to 8 sub-surfaces (header text + per-property ESLint + apReportService filter semantic-drift + Pending Approvals view + agent capability wiring + PaymentApprovalQueueView row-click add-back + D2.7 Shot #7 fire + D2.7-gate-with-substrate-ship-only-exception codification)

---

## Plan-doc-grain dispositions surfaced during draft (RATIFIED per founder items (1)-(5))

1. **Catch #61 logging** ratified — under-specification sub-cluster N=8 codification-candidate strengthens
2. **Role-grant `bill.record_payment` → ap_specialist + controller** ratified per spend brief §3.1 + §9.1 + §15 grounding
3. **D2.7 incremental Shot #8 at session #2 closeout** ratified per (a-ii) (capture NEW surface only; prior 6 user-accessible shots verified at B5-3-D3 gate)
4. **Canvas integration touch-set 4-file canonical at session #1** + 5th-file PaymentApprovalQueueView amendment deferred to session #2; **discriminator naming `payment_record_card`** per brainstorm-side (β) `<process>_<entity>_card` convention parity
5. **RecordPaymentCard `ap_control_account_id` derivation: form-re-ask with default-select** per ManualBillForm precedent simplicity (NOT JE-line-traversal)

---

**Standing by for brainstorm-side parallel-surface verification + founder dispatch authorization. Per chunk-onset founder pattern: "Do NOT auto-progress to implementer dispatch."**
