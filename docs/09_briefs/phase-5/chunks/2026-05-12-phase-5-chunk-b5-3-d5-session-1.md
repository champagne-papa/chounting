# Phase 5 Chunk B5-3-D5 Substantive Session #1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship Candidate 4 (i-α) `ActivePaymentsView` per (cadence-β-i-a) single-session cadence ratified at chunk B5-3-D5 onset triangulation. Closes catch #57 sub-surface expansion UX gap at partial-payment-followup grain (`partially_paid` bills disappear from `PaymentApprovalQueueView` queue per post-filter `approved_for_payment` only; operator has NO v1 UX entry path for subsequent partial-payment-followup actions). ActivePaymentsView is the additive-substrate solution preserving B5-3-D2 PaymentApprovalQueueView semantic canonical-for-approve-action grain (per Surface 2 (i-α) δ-i discipline alignment).

1. `apReportService.activePayments()` method (NEW read-side report method; sibling pattern to existing `paymentApprovalQueue` per Surface 2 (i-α) helper-reuse pattern parity — same `loadBillsWithAmountDue` helper, post-filter to `partially_paid` only)
2. `GET /api/orgs/[orgId]/reports/active-payments/route.ts` (NEW read-side endpoint mirroring existing reports endpoints)
3. `ActivePaymentsView.tsx` canvas view (per-org table render; row-click navigation to `payment_record_card` for subsequent partial-payment-followup entry; mirrors `PaymentApprovalQueueView` shape per pattern parity)
4. `report_active_payments` canvas discriminator + 5-file canvas integration (4-file canonical substrate touch-set per catch #35 + 5th-file MainframeRail entry-path enabler per per-org view convention)
5. Integration test for GET route (Category A floor + filter assertion: returns `partially_paid` bills only)
6. Unit test for ActivePaymentsRow schema (analogous to existing `paymentApprovalQueueSchema.test.ts`)
7. E2E smoke spec (mount + render verification per B5-3-D2 read-side view precedent)

**Architecture:** Read-side query method + per-org canvas view. Per service-architecture skill §2: GET routes do NOT wrap via `withInvariants` (read-only; no ActionName); auth via ServiceContext + RLS. `apReportService.activePayments` is unwrapped read-only method consuming `loadBillsWithAmountDue` helper (lines 186-248 per recon) and post-filtering to `partially_paid` only (sibling pattern to `paymentApprovalQueue` post-filter to `approved_for_payment` at lines 463-465 per recon). Route URL mirrors existing reports endpoint precedent at `/api/orgs/[orgId]/reports/payment-approval-queue/route.ts`. ActivePaymentsView mirrors `PaymentApprovalQueueView` per-org table-render shape.

**Tech Stack:** Next.js App Router, React 18+ (`'use client'`), TypeScript, Zod, Vitest (integration + unit), Playwright (E2E smoke), supabase-js, Decimal.js.

**Locked-scope context (chunk B5-3-D5 onset triangulation ratifications 2026-05-12; convergent across WSL-side + brainstorm-side; founder ratified per 8-surface convergence):**

- **D5.1 scope-lock:** Surface 1 (b) split — B5-3-D5 ships Candidate 4 (i-α) `ActivePaymentsView` ONLY. Reverse mutation (`billService.reverse` + `BillReverseCard`) defers to chunk B5-3-D6 per substrate-novelty isolation + within-arc evidence basis preservation + bundle-horizon discipline. Spend v1 functional-completion achieves at B5-3-D6 close (post-Spend-functional-completion = (γ-1) Phase 5 arc-closure firing condition per Surface 8 ratification).
- **D5.2 UX shape (Surface 2 (i-α)):** NEW `ActivePaymentsView` canvas view exposing `partially_paid` bills via helper-reuse pattern (same `loadBillsWithAmountDue` helper as paymentApprovalQueue; post-filter to `partially_paid` only). Additive substrate per δ-i discipline alignment; preserves B5-3-D2 `PaymentApprovalQueueView` semantic canonical-for-approve-action grain. Pattern consistency with Candidate 4 (d) "Pending Approvals view" additive framing.
- **D5.3 row-click navigation:** ActivePaymentsView row-click → `onNavigate({ type: 'payment_record_card', orgId, billId })` — same navigation target as PaymentApprovalQueueView post-B5-3-D4 row-click amendment. Operator clicking partially_paid bill in ActivePaymentsView lands on RecordPaymentCard with computed amount_due pre-fill for subsequent partial-payment.
- **D5.4 cadence:** (cadence-β-i-a) single-session per Surface 4 ratification. Cross-arc N=3 instance at (cadence-β-i-a) graduation evaluation (after B5-1 + B5-3-D1 + B5-3-D5); evaluation deferred to Phase 5 arc-closure synthesis venue per §Drift-B narrow-scope methodology.
- **D5.5 canvas integration touch-set:** 5-file canonical per per-org view convention — 4-file canonical substrate touch-set (canvasDirective + ContextualCanvas + canvasContextSuffix + ActivePaymentsView component) + 5th-file MainframeRail entry-path enabler (NEW "Active Payments" entry button). Per-org pattern parity with B5-3-D2 EC-A read-side views.
- **D5.6 test architecture grain:** read-side integration test (no §3.2 — read-only; no JE side-effect) + unit test for schema + E2E smoke per B5-3-D2 precedent. §3.2 JE accumulation discipline NOT APPLICABLE (no JE write at read-side method).
- **D5.7 D2.7 incremental Shot #9 at chunk close per (a-ii) incremental gate-firing framing:** Capture ActivePaymentsView mounted with `partially_paid` bills visible. Phase A scope canonical expansion 8 → 9 surfaces ratified at chunk-grain. Prior 8 user-accessible shots verified at chunks B5-3-D2 + B5-3-D4 gates; no regression-test rationale per (a-ii).
- **D5.8 EC-A-8 firing-condition surface (Surface 8) ratified disposition:** (α) stand-alone substrate-decision authority surface with (γ-1) substantive lean (Phase 5 arc-closure synthesis fires at Spend v1 functional-completion post-B5-3-D6). Independent of B5-3-D5 chunk-grain substrate-decisions; preserved at next-chunk election retrospective venue.
- **D5.9 catch ledger continuity entering B5-3-D5:** N=62 baseline; no chunk-onset catches logged per founder Item ratification at this onset (all 8 surfaces converged without catch-grade surfaces emerging at onset triangulation). New catches accumulate to running tally per catch #38 ledger continuity discipline at chunk close.

**Patterns inherited from chunks B5-3-D2 + B5-3-D3 + B5-3-D4 + canonical substrate (substrate-grounded against HEAD `13c3a53`):**

- **paymentApprovalQueue method canonical shape** (`apReportService.ts` lines 450-491): helper-reuse + post-filter post-fetch pattern. ActivePayments method mirrors structure — same helper, different post-filter (`partially_paid` not `approved_for_payment`).
- **PaymentApprovalQueueView canonical shape** (`apps/web/src/components/canvas/PaymentApprovalQueueView.tsx`; post-B5-3-D4 amendment): per-org canvas view + table render + row-click navigation + useEffect cancellation guard for client-side fetch. ActivePaymentsView mirrors shape with discriminator difference (`report_active_payments` vs `report_payment_approval_queue`).
- **MainframeRail entry-path enablement pattern**: NEW "Active Payments" entry button dispatching `{ type: 'report_active_payments', orgId }` directive per B5-3-D2 EC-A read-side view precedent.
- **Read-side GET endpoint pattern** (`apps/web/src/app/api/orgs/[orgId]/reports/payment-approval-queue/route.ts`): NextResponse + buildServiceContext + apReportService method invocation + GET handler with `{ params }: { params: Promise<{ orgId: string }> }` signature.
- **Unit schema test pattern** (`apps/web/tests/unit/paymentApprovalQueueSchema.test.ts`): 4-test pattern (valid parse + invalid type rejection + nullable/optional field handling + boundary case).
- **adminClient + ServiceContext + Zod boundary (Layer 2)** + **(γ-a) bundle pattern** + **§3.1 trace_id prefix integration-test-rules discipline** + **CLAUDE.md §UI-session screenshot gate (Item 5 substrate-ship-only-exception sustained)**

**Prophylactic catch-lesson application (catches #34-#63):**

Apply at code-template grain (NOT just lesson-statement per catch #39):

- **#34** verbatim import paths: `CanvasNavigateFn` from `@/shared/types/canvasDirective` (NOT `@/components/canvas/types`)
- **#35** canvas integration canonical touch-set: 5-file at this session (per-org view convention with MainframeRail entry-path enabler)
- **#36** TS-typing input parameter resolution: verify ActivePaymentsRowSchema shape against disk + helper signature
- **#37** validation gate scope = `agent:validate + test + typecheck` ONLY (NOT `pnpm build`; NOT `pnpm test:e2e`)
- **#38** catch ledger count internal consistency
- **#39** prophylactic lesson application propagates lesson-statement → code-template grain
- **#40** N/A — no new ActionName at session #1 (read-only; no withInvariants action wrap)
- **#41** count-quantification grounded against full-file disk scan
- **#42** implementer subagent dispatches enforce explicit mandate-scope boundaries
- **#43** canvas integration enumeration explicit (5-file this session per per-org view convention)
- **#44** chunk-attribution grounded against disk-verified chunk-of-origin
- **#45** role_key citations N/A (read-side; no role grants this session)
- **#46** form/service schema separation N/A (read-side; no form schema)
- **#47** timestamp grain N/A (no migration this session)
- **#48** schema-field-name grounded against disk-verified field names (ActivePaymentsRow vs PaymentApprovalQueueRow shape parity verification)
- **#49** endpoint-path grounded against disk-verified location (`/api/orgs/[orgId]/reports/active-payments` mirrors existing reports endpoints)
- **#50** `pnpm build` NOT cited as validation gate step
- **#51** column-name grounded against disk-verified table schema (bills.lifecycle_state + bill_payment_allocations columns)
- **#52** seed-data-assumption grounded — no new seed data this session; existing dev.sql + B5-3-D3 seedTestVendor fixture suffice
- **#53** hardcoded-count-asserting-file enumeration grounded N/A (no permission count changes this session)
- **#54** ESLint pre-existing-rule-firing surface persists; non-blocking per CLAUDE.md §1 chunk-close gate; carry-forward to arc-closure venue
- **#55** type-shape grounded against `MoneyAmount` branded type for amount fields per PaymentApprovalQueueRow precedent
- **#56** amendment-site enumeration grounded — MainframeRail entry-path requires prop + button + onClick BOTH
- **#57** substrate-grain semantic drift at downstream-consumer — this chunk ADDRESSES catch #57 sub-surface expansion (partial-payment-followup UX gap) at chunk-grain per founder Option 1 ratification; substrate-correction work at chunk-grain via additive substrate (i-α) preserves δ-i discipline
- **#58** pre-seed dependency at gate-execution — D2.7 Shot #9 requires `partially_paid` bill in seed; pre-seed prescription surfaces at Task 5 D2.7 prep
- **#59** chain-of-drift through count-propagation — friction-journal venue at chunk close
- **#60** substrate-grain capability gap N/A this session (entry from MainframeRail is browser-native)
- **#61** MEMORY.md edit-anchor under-specification — verify edit anchors precisely before MEMORY.md amendments
- **#62** column-name grain N/A this session (no new column-name citations)
- **#63** orchestrator-grain task-description editorial drift — verify subagent-mandate framing against disk before implementer dispatch (apply at Task 1 dispatch grain)

**Out of scope this session:**

- **`billService.reverse` mutation + BillReverseCard UX** — chunk B5-3-D6 per Surface 1 (b) split ratification
- **paidBillsHistoryView row-click amendment for fully_paid reverse entry** — chunk B5-3-D6 per Surface 3 reverse entry-path scope
- **Pending Approvals canvas view + pending_approval reverse entry** — arc-closure substrate-correction venue (Candidate 4 (d))
- **Phase 5 service-file header/per-property annotation amendments** — arc-closure carry-forward
- **EC-A-8 firing-condition formal ratification** — (α) stand-alone substrate-decision authority surface; founder discretion timing
- **B5-3-D4 substrate amendments** (closed; preserved per §Drift-B + δ-i)

---

## Files

**Files to create (5):**

API route (1):
- `apps/web/src/app/api/orgs/[orgId]/reports/active-payments/route.ts` — GET handler; consumes `apReportService.activePayments`; returns `ActivePaymentsOutput`; mirrors payment-approval-queue route shape

Canvas component (1):
- `apps/web/src/components/canvas/ActivePaymentsView.tsx` — per-org canvas view; table render with row-click navigation to `payment_record_card`; mirrors `PaymentApprovalQueueView` shape

Integration test (1):
- `apps/web/tests/integration/activePaymentsReportRoute.test.ts` — Category A floor tests (5) + filter assertion (returns `partially_paid` bills only) + amount_due computation verification per catch #20 helper

Unit test (1):
- `apps/web/tests/unit/activePaymentsSchema.test.ts` — 4-test pattern per `paymentApprovalQueueSchema.test.ts` precedent (valid parse + invalid type rejection + boundary cases)

E2E spec (1):
- `apps/web/tests/e2e/activePaymentsView.spec.ts` — smoke spec; navigate to Active Payments via MainframeRail → ActivePaymentsView mounts → table renders (or empty state)

**Files to modify (5):**

Service substrate (1):
- `apps/web/src/services/spend/reports/apReportService.ts` — add `activePayments(input: ActivePaymentsInput, ctx: ServiceContext)` method (sibling to `paymentApprovalQueue` at lines 450-491); add `ActivePaymentsRow` + `ActivePaymentsOutput` schema exports

Canvas integration 5-file canonical touch-set (4 of 4 in this list — the 5th is in "Files to create" above for ActivePaymentsView):
- `apps/web/src/shared/types/canvasDirective.ts` — add `{ type: 'report_active_payments'; orgId: string }` discriminator at Phase 1.1 cluster
- `apps/web/src/components/bridge/ContextualCanvas.tsx` — add import + `renderDirective` case for `report_active_payments`
- `apps/web/src/agent/prompts/suffixes/canvasContextSuffix.ts` — add `describeDirective` case: `case 'report_active_payments': return 'the active payments view';`
- `apps/web/src/components/canvas/MainframeRail.tsx` — add "Active Payments" entry button dispatching `{ type: 'report_active_payments', orgId }` directive

**Files NOT touched (preservation):**

B5-3-D4 substrate (closed; preserved per §Drift-B + δ-i):
- `apps/web/src/components/canvas/PaymentApprovalQueueView.tsx` — closed at B5-3-D4 SHIPPED; NOT amended; ActivePaymentsView is parallel additive surface
- `apps/web/src/components/canvas/RecordPaymentCard.tsx` — consumed as row-click navigation target via existing payment_record_card discriminator
- `apps/web/src/app/api/orgs/[orgId]/bills/[billId]/record-payment/route.ts` — not modified
- `apps/web/src/services/auth/canUserPerformAction.ts` — no new ActionName (read-only)
- `apps/web/tests/integration/permissionCatalogSeed.test.ts` + `crossOrgRlsIsolation.test.ts` — no count updates (no new permissions)

B5-2 substrate (closed; preserved):
- `apps/web/src/services/spend/billService.ts` — not consumed at session #1 (reverse mutation defers to B5-3-D6)

B5-3-D1 + D2 substrate (closed; preserved):
- `apps/web/src/services/spend/reports/apReportService.ts` — MODIFIED only by ADDING `activePayments` method + schemas (no header amendments per arc-closure carry-forward; existing methods untouched)

---

## Tasks

### Task 1: apReportService.activePayments method + ActivePaymentsRow schema

**Goal:** Ship the read-side query method that exposes `partially_paid` bills via helper-reuse pattern. Mirror `paymentApprovalQueue` shape with `partially_paid` post-filter.

**Files:**
- MODIFY: `apps/web/src/services/spend/reports/apReportService.ts`

**Steps:**

- [ ] **1a.** Verify substrate at task-start grain: `loadBillsWithAmountDue` helper signature at lines 186-248 (per recon Target 3); `paymentApprovalQueue` method shape at lines 450-491; existing exports for `PaymentApprovalQueueRow` + `PaymentApprovalQueueOutput`.
- [ ] **1b.** Author `ActivePaymentsRow` schema + `ActivePaymentsOutput` type exports (mirror `PaymentApprovalQueueRow` shape; `MoneyAmount` branded for amount fields per catch #55).
- [ ] **1c.** Author `activePayments` method: call `loadBillsWithAmountDue(db, org_id)`; post-filter to `lifecycle_state === 'partially_paid'` only; return `{ bills, total_amount_due }` per output shape.
- [ ] **1d.** Validation: `pnpm typecheck` green; service compiles.

### Task 2: GET /api/orgs/[orgId]/reports/active-payments route

**Goal:** Ship the read-side endpoint consuming `apReportService.activePayments`.

**Files:**
- CREATE: `apps/web/src/app/api/orgs/[orgId]/reports/active-payments/route.ts`

**Steps:**

- [ ] **2a.** Verify substrate at task-start grain: existing route shape at `payment-approval-queue/route.ts` (read-only GET pattern; buildServiceContext; apReportService method invocation; NextResponse return).
- [ ] **2b.** Author GET handler: signature `(req: Request, { params }: { params: Promise<{ orgId: string }> })`; parse + buildServiceContext + invoke service method + return NextResponse with `{ status: 200 }`; error mapping (ServiceError → status; unknown → 500).
- [ ] **2c.** Validation: `pnpm typecheck` green.

### Task 3: ActivePaymentsView canvas view component

**Goal:** Ship per-org canvas view rendering `partially_paid` bills with row-click navigation to RecordPaymentCard for partial-payment-followup entry.

**Files:**
- CREATE: `apps/web/src/components/canvas/ActivePaymentsView.tsx`

**Steps:**

- [ ] **3a.** Verify substrate at task-start grain: `PaymentApprovalQueueView.tsx` post-B5-3-D4 amendment shape (line 20 destructure + line 76-81 row-click pattern).
- [ ] **3b.** Author ActivePaymentsView component: `'use client'`; props `{ orgId: string; onNavigate: CanvasNavigateFn }`; useEffect with cancellation guard for fetch to `/api/orgs/${orgId}/reports/active-payments`; table render mirroring PaymentApprovalQueueView shape; row-click handler `onClick={() => onNavigate({ type: 'payment_record_card', orgId, billId: b.bill_id })}` with `cursor-pointer hover:bg-neutral-50` className per B5-3-D4 amendment pattern.
- [ ] **3c.** Heading: "Active Payments" (operator clarity per Surface 2 (i-α) semantic distinction).
- [ ] **3d.** Empty state: "No bills currently in partial-payment state." (operator clarity).
- [ ] **3e.** Validation: `pnpm typecheck` green.

### Task 4: Canvas integration 5-file touch-set

**Goal:** Ship 5-file canonical canvas integration so ActivePaymentsView is reachable via MainframeRail.

**Files (modify all 4 + ActivePaymentsView from Task 3):**
- `apps/web/src/shared/types/canvasDirective.ts`
- `apps/web/src/components/bridge/ContextualCanvas.tsx`
- `apps/web/src/agent/prompts/suffixes/canvasContextSuffix.ts`
- `apps/web/src/components/canvas/MainframeRail.tsx`

**Steps:**

- [ ] **4a.** `canvasDirective.ts` — add `{ type: 'report_active_payments'; orgId: string }` discriminator at Phase 1.1 cluster (insert near `report_payment_approval_queue` per semantic adjacency).
- [ ] **4b.** `ContextualCanvas.tsx` — add import + `renderDirective` case: `case 'report_active_payments': return <ActivePaymentsView orgId={d.orgId} onNavigate={onNavigate} />;`.
- [ ] **4c.** `canvasContextSuffix.ts` — add `describeDirective` case: `case 'report_active_payments': return 'the active payments view';` (exhaustive switch).
- [ ] **4d.** `MainframeRail.tsx` — add "Active Payments" entry button (verify at task-start grain whether button-cluster grouping pattern exists; insert near "Payment Approval Queue" per semantic adjacency). Dispatch directive `{ type: 'report_active_payments', orgId }` on click.
- [ ] **4e.** Validation: `pnpm typecheck` green; exhaustive-switch enforces no missed case.

### Task 5: Integration test + unit test + E2E smoke

**Goal:** Ship test coverage per Surface 6 disposition.

**Files:**
- CREATE: `apps/web/tests/integration/activePaymentsReportRoute.test.ts`
- CREATE: `apps/web/tests/unit/activePaymentsSchema.test.ts`
- CREATE: `apps/web/tests/e2e/activePaymentsView.spec.ts`

**Steps:**

- [ ] **5a.** Author integration test per §3.1 trace_id prefix discipline:
  - Category A floor (5 tests): 200 success + 401 unauth + 403 wrong-org + 400 (if any input validation) + 500 service-error mapping
  - Filter assertion: seed bill in `partially_paid` + bill in `approved_for_payment` + bill in `fully_paid` → GET → response.bills contains ONLY the `partially_paid` bill
  - Amount_due computation verification: seed bill (amount_cad=300) + 1 allocation (amount_cad=100) → bill lifecycle_state set to `partially_paid` → GET → response.bills[0].amount_due === '200.0000' per catch #20 helper
- [ ] **5b.** Author unit test for ActivePaymentsRow schema (4-test pattern per paymentApprovalQueueSchema.test.ts precedent).
- [ ] **5c.** Author E2E smoke spec: sign in → navigate to MainframeRail "Active Payments" entry → ActivePaymentsView mounts → heading "Active Payments" visible → table OR empty state visible.
- [ ] **5d.** Validation: `pnpm db:reset:clean && pnpm db:seed:all && pnpm test apps/web/tests/integration/activePaymentsReportRoute.test.ts apps/web/tests/unit/activePaymentsSchema.test.ts` passes.

### Task 6: Chunk-completion validation gate + D2.7 Shot #9 + closeout

**Goal:** Single-session chunk-completion grain (no separate session #2). Run validation gate per CLAUDE.md §"What done means" §1. Capture D2.7 incremental Shot #9 per (a-ii). Author friction-journal chunk-B5-3-D5 retrospective entry. Push-readiness three-condition gate. Bundled commit + push + 2 memory writes per Item 17 (γ-a) chunk-completion Stage 6.

**Steps:**

- [ ] **6a.** `pnpm agent:validate` — expect 26/26.
- [ ] **6b.** `pnpm typecheck` — clean.
- [ ] **6c.** `pnpm db:reset:clean && pnpm db:seed:all && pnpm test` — expect 835 baseline + new tests from this chunk (~+5 from integration test + ~+4 from unit test = ~844-845 total).
- [ ] **6d.** D2.7 Shot #9 pre-seed prescription + founder capture + orchestrator spot-check:
  - Pre-seed: vendor + bill posted + approved + partially-paid (or DB-direct seed for speed per Path β precedent at B5-3-D4)
  - Navigation: MainframeRail → "Active Payments" → ActivePaymentsView mounts → table shows partially_paid bill
  - Per-shot verifications: heading "Active Payments" visible + table row(s) with bill_number + vendor + due_date + amount_due + total amount_due row
- [ ] **6e.** Friction-journal entry at `docs/07_governance/friction-journal.md` (prepend; ~150 lines per §Drift-B narrow-scope methodology; smaller than B5-3-D4's 137 lines per single-session scope).
- [ ] **6f.** Push-readiness three-condition gate evaluation (test-suite health + doc-sync reconciled + governance closeout).
- [ ] **6g.** Stage files + bundled commit + push to origin/staging.
- [ ] **6h.** Pickup file refresh (post-chunk-close state) + MEMORY.md refresh.

---

## Carry-forward inventory

**Active for chunk B5-3-D6 firing (next-chunk):**
- `billService.reverse` mutation write-side UX (reversal_reason free-text + INV-AP-002 4-state precondition + Sub-D 'voided' terminal state + mirror-line JE construction)
- BillReverseCard per-bill canvas view (3-field form-grain; mirror PaymentApprovalCard + RecordPaymentCard per-bill pattern)
- POST /api/orgs/[orgId]/bills/[billId]/reverse/route.ts (mirror approve-for-payment + record-payment shape)
- bill.reverse ActionName + permission migration (likely controller-only per SoD axis)
- 5-file canvas integration + paidBillsHistoryView row-click amendment for fully_paid reverse entry
- D2.7 incremental Shot #10 (BillReverseCard mounted)

**Active for subsequent-chunk firing (2 items; preserved-deferred):**
- FT1 `clampTtl` NaN-guard at `supabaseStorageProvider.ts:95-99` — storage-substrate-touching chunk
- Item 18 org_settings substrate-floor — (orgset-β) sub-arc

**Active for Phase 5 arc-closure retrospective (32+ candidates; potential 33rd + 34th at chunk B5-3-D5 close):**
- All inherited candidates per B5-3-D4 SHIPPED state
- Potential 33rd: sub-catch-ledger analytical-observation classification framework codification (within-arc N=5 evidence basis from B5-3-D4)
- **Potential 34th (NEW at B5-3-D5)**: cadence-cluster symmetry observation at chunk-cluster grain — (b) split disposition surfaces substantively elegant cadence-cluster shape where both (cadence-β-i-a) cross-arc N=3 + (cadence-β-i-b) cross-arc N=5 reach graduation thresholds simultaneously at Spend v1 functional-completion (γ-1) firing condition

---

## Plan-doc-grain dispositions surfaced during draft (RATIFIED per founder 8-surface convergence)

1. **8 onset triangulation surfaces converged** across WSL-side + brainstorm-side post-engagement (Surface 1 substantive divergence collapsed to (b) split; all others convergent on first surfacing)
2. **Founder Option 1 (B5-3-D5 Spend continuation) ratification + 8-surface ratification**
3. **(γ-1) Phase 5 arc-closure firing condition substantive lean**: Spend v1 functional-completion at post-B5-3-D6 close (not in B5-3-D5 scope; surfaces at B5-3-D6 close OR arc-closure synthesis venue)
4. **Cadence-cluster symmetry observation** (brainstorm-side surfaced at convergence): chunk-cluster B5-3-D5 + B5-3-D6 reaches both (cadence-β-i-a) N=3 + (cadence-β-i-b) N=5 graduation thresholds simultaneously — carry as analytical observation at friction-journal venues + arc-closure synthesis venue
5. **Discriminator naming convention amendment** (brainstorm-side surfaced at plan-doc parallel-surface review): initial plan doc citation `active_payments_view` violated MainframeRail-anchored `report_<entity>` convention enumeration; amended to `report_active_payments` per disk-grounded canonical naming. WSL-side plan-doc-authoring editorial drift; sibling-class to catch #63 at subagent-mandate-framing grain but at plan-doc-authoring grain. Catch candidate #65 surfaces at chunk close for founder disposition (log-separately vs carry-as-analytical per "would this cause a bug?" threshold — discriminator naming is more substantive than JSDoc comment grain at #64 precedent but functionally non-blocking; both substantively defensible)
6. **Aspirational header drift propagation observation** (brainstorm-side surfaced at plan-doc parallel-surface review): new `activePayments` method's header comment will continue the aspirational `withInvariants(action: 'active_payments.read')` claim shape that's part of catch #54 + Candidate 4 (a) arc-closure correction scope. NOT a δ-i violation (forward-progress at NEW code); but grows arc-closure substrate-correction scope by N=1 method (apReportService extending from 4 → 5 methods with aspirational header comments at chunk B5-3-D5 close). Candidate 4 (a) sub-surface scope enrichment carry-forward at arc-closure synthesis venue

---

**Standing by for founder dispatch authorization. Per chunk-onset founder pattern: "Do NOT auto-progress to implementer dispatch."**
