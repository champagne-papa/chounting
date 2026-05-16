# Phase 5 Chunk B5-3-D3 Substantive Session #2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the chunk-completion session per (cadence-β-i-b) 2-session bundled cadence + (γ-a) bundle pattern. Session #2 ships:

1. POST `/api/orgs/[orgId]/bills/[billId]/approve-for-payment` route (consumes `billService.approveForPayment` via `withInvariants(action: 'bill.approve')`; permission row pre-seeded at session #1 migration)
2. `PaymentApprovalCard` canvas view (per-bill display + approve button; consumes the approve-for-payment route)
3. `payment_approval_card` canvas discriminator + 5-file canvas integration touch-set (4 canonical + 5th-file `PaymentApprovalQueueView.tsx` row-click amendment per founder Item 2 (a))
4. Integration test for approve route (Category A floor tests + state-transition + INV-AP-002 + audit + Reading B preservation — NO JE side-effect)
5. `paymentApprovalCard.spec.ts` Playwright E2E spec (+ `bill.ts` fixture extension)

Then **chunk-completion artifacts:**
6. D2.7 screenshot gate (γ) firing — 7-shot prescribed sequence (5 read-side B5-3-D2 + 2 write-side B5-3-D3); founder-grain capture against fresh `pnpm db:reset:clean && pnpm db:seed:all` state; orchestrator spot-check per CLAUDE.md §UI-session screenshot gate convention
7. Validation gate per CLAUDE.md "What done means" §1 (`agent:validate` + `pnpm test` + `pnpm typecheck`)
8. Closeout artifacts: friction-journal chunk-B5-3-D3 entry + retrospective inline per §Drift-C + push-readiness three-condition gate evaluation
9. Chunk-completion Stage 6 per Item 17 graduated standing rule: chunk-completion bundled commit + push to `origin/staging` + 2 memory writes (pickup file refresh + MEMORY.md refresh)

**Architecture:** State-only mutation route + per-bill canvas view. Per service-architecture skill §2: mutation route wraps via `withInvariants(action: 'bill.approve')`; `billService.approveForPayment` is unwrapped Pattern B (verified at billService.ts:405-406). Route URL mirrors verb-segment precedent at `recurring-runs/[runId]/approve/route.ts` (recon-verified). Card view mirrors `JournalEntryDetailView.tsx` canonical (per-entity discriminator shape with `{ orgId, billId }` parallel to `{ orgId, entryId }`).

**Tech Stack:** Next.js App Router, React 18+ (`'use client'`), TypeScript, Zod, Vitest (integration), Playwright (E2E), supabase-js, Decimal.js.

**Locked-scope context (carry-forward from chunk-onset ratifications + session #1 close):**

- **D3.1 cadence:** (cadence-β-i-b) 2-session bundled per Surface 5. Session #1 SHIPPED at HEAD `1844f9e`; session #2 = chunk-completion (closeout-absorbed).
- **D3.2 mutation-route shape:** journal-entries precedent + recurring-runs approve/reject precedent (recon-verified). Static action `'bill.approve'` per billService.ts:11 + :406 canonical.
- **D3.3 action name:** `'bill.approve'` (NOT `'bill.approve_for_payment'`) per Surface 3 + catch #40 verification. **Permission row pre-seeded at session #1 migration `20240140000000_bill_action_permissions.sql`** — no new migration this session.
- **D3.4 role mapping:** `bill.approve` → controller only (separation-of-duties; pre-seeded at session #1).
- **D3.5 VendorPicker:** Path (X) thin abstraction shipped at session #1. NOT consumed by PaymentApprovalCard (D3.5 plan-doc-grain finding: card is vendor-display-only; bill carries vendor_id; card displays vendor name as derived field).
- **D3.6 test architecture (carry-forward + sub-variant):** Hybrid Vitest integration + Playwright E2E. Integration test at ROUTE grain (`billApproveForPaymentRoute.test.ts`); distinct from existing SERVICE-grain test (`billApproveForPayment.test.ts` from B5-2). §3.1+§3.2 integration-test-rules disciplines apply. Approve mutation is **state-only** (Reading B preserved by construction — NO JE assertions; no `§3.2` JE accumulation concern at this route).
- **D3.7 canvas discriminators (this session ships `payment_approval_card`):** `{ type: 'payment_approval_card'; orgId: string; billId: string }`. **4-file canonical canvas integration touch-set** (chunk-onset 5-file ratification reverted per (iii-b) at post-Task-5 checkpoint; see catch #57 disposition addendum below). PaymentApprovalCard accessible via agent canvas directive only at v1; row-click UX deferred to arc-closure UX-architecture reconciliation.
- **D3.8 D2.7 screenshot gate (γ):** Fires at session #2 closeout (this session). 7-shot prescribed sequence (5 read-side + 2 write-side); per-shot verifications per CLAUDE.md §UI-session screenshot gate convention.
- **D3.9 substrate-amendment timing:** B5-3-D1 + Phase 5 service-file header/per-property annotation drift carry-forward to **Phase 5 arc-closure** venue per §Drift-B + δ-i + founder Item 4. **This session does NOT amend prior-chunk substrate** (NOT B5-3-D1 read-side service headers; NOT B5-2 billService.ts; NOT B5-1 vendorPrepaymentService.ts; NOT B5-3-D2 vendorService.ts). Per-property ESLint annotation amendments included in candidate 4 EXPANDED scope per catch #54.
- **D3.10 catch ledger continuity (founder Item 3 + (a) + (d) + (γ) ratifications):** Cumulative N=53 entering session #2. Implementation-grain catches at session #2 implementer-grain (#55+) accumulate to running cumulative N. Catch #54 sub-surface within arc-closure candidate 4.
- **D3.11 UX-scope ratifications (session #1 anchored; session #2 carries forward + minor additions):** PaymentApprovalCard UX scope:
  - **Display fields (per-bill data fetched via `/api/orgs/[orgId]/bills/[billId]` IF route exists OR via reuse of `PaymentApprovalQueueQueueOutput` row shape from queue):** vendor display name + bill_number + due_date + amount_cad + bill_lines summary
  - **Approve button:** primary action; on-click POSTs to `/api/orgs/${orgId}/bills/${billId}/approve-for-payment` (200 success → onNavigate back to `report_payment_approval_queue` per UX flow)
  - **State-aware rendering:** if bill lifecycle_state ≠ `pending_approval`, disable approve button + show state badge
  - **Loading/error stencils:** mirror BasicTrialBalanceView read-side conventions + JournalEntryDetailView precedent

**Patterns inherited from chunk-onset + session #1 + canonical substrate (grounded against HEAD `1844f9e`):**

- **journal-entries route + recurring-runs verb-segment precedent** (mutation route canonical shape):
  - File pattern: `apps/web/src/app/api/orgs/[orgId]/<entity>/<id>/<verb>/route.ts`
  - Status code: **200** for state-transition (NO new resource); recurring-runs approve at `route.ts:35` uses `status: 200`
  - URL params Promise shape: `{ params: Promise<{ orgId: string; billId: string }> }`
  - withInvariants spread pattern: route spreads URL params into service input: `withInvariants(service.fn, { action })( { bill_id: billId, org_id: orgId, ...parsed }, ctx )`
- **JournalEntryDetailView.tsx per-bill canvas view canonical** (`apps/web/src/components/canvas/JournalEntryDetailView.tsx`, 243 lines):
  - `'use client'` directive at line 1
  - Props: `{ orgId, entryId, onNavigate }` — per-bill parallels with `{ orgId, billId, onNavigate }`
  - useEffect cancellation guard for data fetch
  - Fetch URL: `/api/orgs/${orgId}/journal-entries/${entryId}` — parallel: `/api/orgs/${orgId}/reports/payment-approval-queue` (consume queue endpoint with billId post-filter) OR new per-bill endpoint
- **PaymentApprovalQueueView.tsx row-click amendment site** (recon-verified at line 77):
  - Current: `<tr key={b.bill_id} className="border-b border-neutral-100">`
  - Amendment: add `onClick={() => onNavigate({ type: 'payment_approval_card', orgId, billId: b.bill_id })}` + `className` extension for hover/cursor (e.g., `'border-b border-neutral-100 cursor-pointer hover:bg-neutral-50'`)
- **adminClient + ServiceContext + Zod boundary (Layer 2)** patterns
- **(γ-a) bundle pattern:** working-tree accumulates; bundled commit at session-close (this session = chunk-completion commit + push)
- **§3.1+§3.2 integration-test-rules disciplines** — apply at integration test grain
- **CLAUDE.md §UI-session screenshot gate** (verbatim at lines 112-133): 4-step gate; orchestrator drafts → founder captures → orchestrator spot-checks → gate blocks closeout

**Prophylactic catch-lesson application (catches #34-#54; logged per founder Item 3 + (a) + (d) + (γ) ratifications):**

Apply at code-template grain (NOT just lesson-statement per catch #39):

- **#34** verbatim import paths from canvas types (`CanvasNavigateFn` from `@/shared/types/canvasDirective`; `SelectedEntity` from `@/shared/types/canvasContext`)
- **#35** 4-file canvas integration canonical touch-set (this session extends to 5 files per founder Item 2 (a) — 5th-file PaymentApprovalQueueView amendment)
- **#36** TS-typing input parameter resolution upfront (ApproveBillForPaymentInputSchema = `{ org_id, bill_id }` UUID fields)
- **#37** validation gate scope = `agent:validate + test + typecheck` ONLY (NOT `pnpm build`; NOT `pnpm test:e2e`)
- **#38** catch ledger count internal consistency
- **#39** prophylactic lesson application propagates lesson-statement → code-template grain
- **#40** action name `'bill.approve'` verbatim (NOT `'bill.approve_for_payment'`)
- **#41** count-quantification grounded against full-file disk scan
- **#42** implementer subagent dispatches enforce explicit mandate-scope boundaries (recon-grain dispatches say "Do NOT make recommendations")
- **#43** canvas integration enumeration explicit (5-file touch-set this session; verified each at task-start grain)
- **#44** chunk-attribution grounded against disk-verified chunk-of-origin
- **#45** role_key citations grounded against disk-verified `roles` table
- **#46** form/service schema separation discipline (NOT directly applicable here — approve has minimal input `{ org_id, bill_id }` from URL params; no form-state-vs-service-input transform needed)
- **#47** timestamp grounded against next-available migration timestamp (NOT applicable here — no new migration this session)
- **#48** schema-field-name grounded against disk-verified field (verify `PaymentApprovalQueueRow` shape if PaymentApprovalCard reuses queue endpoint)
- **#49** endpoint-path grounded against disk-verified location (per-bill endpoint TBD per Task 2 design decision)
- **#50** `pnpm build` NOT cited as validation gate step (CLAUDE.md §1 doesn't include build; non-blocking ESLint failures on pre-existing Phase 5 service files persist per Item 4)
- **#51** column-name grounded against disk-verified table schema (`bills.lifecycle_state` for state assertion in audit test; verify against disk)
- **#52** seed-data-assumption grounded — `bill.ts` fixture's `seedTestVendor` already established at session #1; session #2 E2E uses it via `seedBillPendingApproval` helper extension
- **#53** hardcoded-count-asserting-file enumeration grounded (CA-37 already updated at session #1; no new permission additions this session)
- **#54** ESLint rule `services/withInvariants-wrap-or-annotate` pre-existing on 5 Phase 5 service files — non-blocking per CLAUDE.md §1 chunk-close gate; carry-forward to arc-closure venue (candidate 4 EXPANDED scope)

**Out of scope this session:**

- **New ActionName migration** — `bill.approve` + `bill.post` already seeded at session #1 migration `20240140000000_bill_action_permissions.sql`
- **`billService.recordPayment` + `billService.reverse` mutations** — out-of-chunk per Surface 1 scope-lock
- **`vendorPrepaymentService.*` mutation routes** — out-of-chunk
- **Phase 5 service-file header/per-property annotation amendments** — arc-closure carry-forward per Item 4 + candidate 4 EXPANDED scope + catch #54 sub-surface
- **B5-2 substrate amendments** (`billService.ts` canonical preserved unmodified)
- **B5-3-D1 substrate amendments** (`apReportService.ts` + `vendorReportService.ts` headers preserved per §Drift-B)
- **VendorPicker consumption by PaymentApprovalCard** — card is vendor-display-only (D3.5 plan-doc-grain finding)
- **Bill detail endpoint** (if PaymentApprovalCard needs per-bill data not in `PaymentApprovalQueueRow`, defer to Task 2 design decision: reuse queue endpoint + client-side filter OR new per-bill GET endpoint)
- **Page route shells** at `/[locale]/[orgId]/...` — canvas-only per Q1-i precedent
- **CA-37 / CA-28 count updates beyond session #1** — no permission additions this session

---

## Files

**Files to create (5):**

API route (1):
- `apps/web/src/app/api/orgs/[orgId]/bills/[billId]/approve-for-payment/route.ts` — POST handler; consumes `billService.approveForPayment` via `withInvariants(billService.approveForPayment, { action: 'bill.approve' })`; URL params spread into service input

Canvas component (1):
- `apps/web/src/components/canvas/PaymentApprovalCard.tsx` — per-bill canvas view; props `{ orgId, billId, onNavigate }`; mirrors JournalEntryDetailView canonical; useEffect cancellation guard for data fetch; approve button POST → onNavigate back to queue

Tests (2):
- `apps/web/tests/integration/billApproveForPaymentRoute.test.ts` — Category A floor tests (200 success + 401 unauth + 403 wrong-org + 400 Zod + 404 NOT_FOUND mapping for non-existent bill_id + state-precondition mapping) + INV-AP-002 state-transition assertion + audit `'bill_approved_for_payment'` emission + **NO JE side-effect assertion** (Reading B preserved by construction)
- `apps/web/tests/e2e/paymentApprovalCard.spec.ts` — Playwright smoke spec; navigate via PaymentApprovalQueueView row-click → assert card renders → click approve → assert state transition + back-to-queue navigation

Closeout artifacts (1):
- Friction-journal chunk-B5-3-D3 entry at `docs/07_governance/friction-journal.md` — chunk-grain retrospective inline per §Drift-C; includes catch #40-#54 enumeration + within-arc prophylactic-application + arc-closure carry-forward inventory

**Files to modify (6):**

Canvas integration 5-file touch-set (per founder Item 2 (a); catch #35 lesson + extension per founder ratification):
- `apps/web/src/shared/types/canvasDirective.ts` — add `{ type: 'payment_approval_card'; orgId: string; billId: string }` discriminator member at Phase 1.1 cluster
- `apps/web/src/components/bridge/ContextualCanvas.tsx` — extend `renderDirective` switch with `case 'payment_approval_card': return <PaymentApprovalCard orgId={d.orgId} billId={d.billId} onNavigate={onNavigate} />;`; add import at top
- `apps/web/src/agent/prompts/suffixes/canvasContextSuffix.ts` — extend `describeDirective` switch with `case 'payment_approval_card': return 'the payment approval card';` (exhaustive switch; no default)
- **5th file (B5-3-D2 substrate forward-progress amendment per founder Item 2 (a)):** `apps/web/src/components/canvas/PaymentApprovalQueueView.tsx` — add row-click handler at line 77 `<tr>` tag: `onClick={() => onNavigate({ type: 'payment_approval_card', orgId, billId: b.bill_id })}` + className extension `cursor-pointer hover:bg-neutral-50`

Note: `MainframeRail.tsx` is NOT modified — PaymentApprovalCard is not a MainframeRail entry per Surface 7 chunk-onset ratification (per-bill access via row-click from queue; not general entry point).

E2E fixture extension (1):
- `apps/web/tests/e2e/fixtures/bill.ts` — add helper `seedBillPendingApproval(orgId)` (creates a bill in `pending_approval` state for the card to approve); reuse `seedTestVendor` from session #1

**Files NOT touched (preservation per Item 4):**

B5-2 substrate (closed; preserved):
- `apps/web/src/services/spend/billService.ts` — consumed unmodified
- `apps/web/src/shared/schemas/spend/bill.schema.ts` — consumed unmodified

B5-3-D1 read-side substrate (closed; arc-closure header drift carry-forward per Item 4):
- `apps/web/src/services/spend/reports/apReportService.ts` — NO HEADER AMENDMENT this chunk (arc-closure venue)
- `apps/web/src/services/spend/reports/vendorReportService.ts` — NO HEADER AMENDMENT this chunk

B5-3-D2 substrate (closed; preserved EXCEPT PaymentApprovalQueueView per founder Item 2 (a) forward-progress amendment):
- `apps/web/src/services/spend/vendorService.ts` — preserved
- 4 of 5 read-side canvas view components — preserved
- `PaymentApprovalQueueView.tsx` — **amended** (5th-file row-click handler per Item 2 (a); forward-progress, not retrospective edit; δ-i preserved)

Session #1 substrate (closed; consumed unmodified):
- `20240140000000_bill_action_permissions.sql` — migration preserved; `bill.approve` permission row consumed via withInvariants
- `apps/web/src/app/api/orgs/[orgId]/bills/route.ts` — preserved
- `apps/web/src/components/canvas/_shared/VendorPicker.tsx` — preserved; not consumed by card
- `apps/web/src/components/canvas/ManualBillForm.tsx` — preserved

---

## Tasks

### Task 1: POST /api/orgs/[orgId]/bills/[billId]/approve-for-payment route

**Goal:** Ship the state-transition mutation route. Wrap with `withInvariants(action: 'bill.approve')`; spread URL params into service input per recurring-runs precedent. Status 200 (state transition; no new resource).

**Files:**
- CREATE: `apps/web/src/app/api/orgs/[orgId]/bills/[billId]/approve-for-payment/route.ts`

**Steps:**

- [ ] **1a.** Verify substrate at task-start grain:
  - `apps/web/src/app/api/orgs/[orgId]/recurring-runs/[runId]/approve/route.ts` — canonical verb-segment route precedent
  - `apps/web/src/shared/schemas/spend/bill.schema.ts` — `ApproveBillForPaymentInputSchema` shape (`{ org_id: uuid, bill_id: uuid }`) per recon
  - `apps/web/src/services/spend/billService.ts:407-410` — `approveForPayment` signature

- [ ] **1b.** Author route per template (mirrors recurring-runs approve canonical):

```typescript
// src/app/api/orgs/[orgId]/bills/[billId]/approve-for-payment/route.ts
//
// Phase 5 chunk B5-3-D3 substantive session #2: state-only mutation route
// for bill approval. Consumes billService.approveForPayment per service-
// architecture skill §2:
//   - billService is unwrapped Pattern B
//   - route layer wraps via withInvariants(action: 'bill.approve')
//   - bill.approve ActionName + permissions seeded at session #1
//     migration 20240140000000_bill_action_permissions.sql
//
// Mirror pattern: recurring-runs/[runId]/approve/route.ts (verb-segment
// URL canonical at HEAD 4abd387). Returns 200 (state transition; no new
// resource created). Reading B preserved by construction — approve
// produces NO journal entry (state-only mutation per billService.ts:400-403).

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { ApproveBillForPaymentInputSchema } from '@/shared/schemas/spend/bill.schema';
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
    // Body parse may be empty (no client-side fields needed beyond URL params);
    // tolerate empty body per recurring-runs precedent.
    const json = await req.json().catch(() => ({}));

    const parsed = ApproveBillForPaymentInputSchema.parse({
      org_id: orgId,
      bill_id: billId,
      ...json,
    });

    const ctx = await buildServiceContext(req);

    // INV-SERVICE-001 wrap site: billService.approveForPayment is unwrapped
    // Pattern B; route handler wraps via withInvariants at the call site.
    const result = await withInvariants(
      billService.approveForPayment,
      { action: 'bill.approve' }
    )(parsed, ctx);

    // 200 OK — state transition (NOT 201; no new resource created).
    // Returns { bill_id }.
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

- [ ] **1c.** Validation: `pnpm typecheck` green; route compiles. (Integration test verification at Task 4.)

---

### Task 2: PaymentApprovalCard canvas view

**Goal:** Ship per-bill canvas view that displays bill + approve action. Mirror JournalEntryDetailView canonical (243-line per-bill precedent).

**Files:**
- CREATE: `apps/web/src/components/canvas/PaymentApprovalCard.tsx`

**Steps:**

- [ ] **2a.** Verify substrate at task-start grain:
  - `apps/web/src/components/canvas/JournalEntryDetailView.tsx` (243 lines) — canonical per-bill canvas view shape
  - Data fetch endpoint decision: option (α) reuse `/api/orgs/${orgId}/reports/payment-approval-queue` + client-side filter to `billId`; option (β) new per-bill GET endpoint at `/api/orgs/${orgId}/bills/${billId}/route.ts` (GET handler).
  - **WSL-side lean: (α)** — minimal substrate addition; queue endpoint already returns `PaymentApprovalQueueRow` with all needed fields (bill_id, vendor_id, bill_number, due_date, amount_cad, amount_due). YAGNI on new endpoint. Flag for brainstorm-side verification.

- [ ] **2b.** Author `PaymentApprovalCard.tsx` per JournalEntryDetailView canonical (target ~200 lines):

  Structural template (implementer fleshes JSX + dropdown patterns):

```typescript
// src/components/canvas/PaymentApprovalCard.tsx
'use client';
//
// Phase 5 chunk B5-3-D3 substantive session #2: PaymentApprovalCard —
// per-bill canvas view for payment-approval action.
// Consumes POST /api/orgs/[orgId]/bills/[billId]/approve-for-payment (Task 1
// route) which wraps billService.approveForPayment via withInvariants(action:
// 'bill.approve'). Data fetch: reuses queue endpoint + client-side billId
// filter (no new per-bill endpoint per Task 2a lean).
//
// Mirror pattern: JournalEntryDetailView.tsx canonical (HEAD 4abd387);
// per-entity canvas view with { orgId, billId } discriminator.

import { useEffect, useState } from 'react';
import type { CanvasNavigateFn } from '@/shared/types/canvasDirective';
import type { PaymentApprovalQueueOutput } from '@/services/spend/reports/apReportService';

interface BillRow {
  bill_id: string;
  vendor_id: string;
  bill_number: string | null;
  due_date: string | null;
  amount_cad: string;
  amount_due: string;
}

export interface PaymentApprovalCardProps {
  orgId: string;
  billId: string;
  onNavigate: CanvasNavigateFn;
}

export function PaymentApprovalCard({ orgId, billId, onNavigate }: PaymentApprovalCardProps) {
  const [bill, setBill] = useState<BillRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

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

  const handleApprove = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/orgs/${orgId}/bills/${billId}/approve-for-payment`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}),
        },
      );
      if (!response.ok) {
        const errorBody = await response.json();
        if (response.status === 401) {
          window.location.href = '/en/sign-in';
          return;
        }
        setError(errorBody.message || errorBody.error || 'Approval failed');
        return;
      }
      await response.json();
      // On success: navigate back to queue (bill no longer in pending_approval state)
      onNavigate({ type: 'report_payment_approval_queue', orgId });
    } catch {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="text-sm text-neutral-400">Loading bill...</div>;
  }
  if (error && !bill) {
    return <div className="text-sm text-red-500">{error}</div>;
  }
  if (!bill) {
    return <div className="text-sm text-neutral-400">No bill data.</div>;
  }

  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">Approve Bill for Payment</h2>
      {error && (
        <div className="mb-4 p-3 border border-red-300 rounded bg-red-50 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Bill detail display — implementer fleshes per UX:
          - Bill Number: {bill.bill_number ?? '—'}
          - Vendor ID: {bill.vendor_id} (display name fetch optional v2 enhancement)
          - Due Date: {bill.due_date ?? '—'}
          - Amount (CAD): {bill.amount_cad}
          - Amount Due: {bill.amount_due}
          Use definition-list or table layout per JournalEntryDetailView precedent. */}

      <button
        type="button"
        onClick={handleApprove}
        disabled={submitting}
        className="px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50"
      >
        {submitting ? 'Approving...' : 'Approve for Payment'}
      </button>
      <button
        type="button"
        onClick={() => onNavigate({ type: 'report_payment_approval_queue', orgId })}
        disabled={submitting}
        className="ml-2 px-4 py-2 bg-neutral-200 text-neutral-700 rounded text-sm hover:bg-neutral-300 disabled:opacity-50"
      >
        Back to Queue
      </button>
    </div>
  );
}
```

- [ ] **2c.** Validation: `pnpm typecheck` green.

---

### Task 3: Canvas integration 5-file touch-set (payment_approval_card discriminator + PaymentApprovalQueueView row-click amendment)

**Goal:** Ship 4 canonical canvas integration file modifications + 5th-file forward-progress amendment to B5-3-D2 substrate per founder Item 2 (a) ratification.

**Files (modify all 5):**
- `apps/web/src/shared/types/canvasDirective.ts`
- `apps/web/src/components/bridge/ContextualCanvas.tsx`
- `apps/web/src/agent/prompts/suffixes/canvasContextSuffix.ts`
- `apps/web/src/components/canvas/PaymentApprovalQueueView.tsx` (B5-3-D2 substrate; **5th-file forward-progress amendment per founder Item 2 (a)**)

Note: `MainframeRail.tsx` NOT modified — payment_approval_card is per-bill (requires billId; cannot invoke from MainframeRail which has no billId context).

**Steps:**

- [ ] **3a.** `canvasDirective.ts` — add `{ type: 'payment_approval_card'; orgId: string; billId: string }` discriminator union member at Phase 1.1 cluster (insert near `bill_form` from session #1; both are write-side/action discriminators).

- [ ] **3b.** `ContextualCanvas.tsx`:
  - Add import at top: `import { PaymentApprovalCard } from '@/components/canvas/PaymentApprovalCard';`
  - Add `renderDirective` case: `case 'payment_approval_card': return <PaymentApprovalCard orgId={d.orgId} billId={d.billId} onNavigate={onNavigate} />;`

- [ ] **3c.** `canvasContextSuffix.ts` — add `describeDirective` case: `case 'payment_approval_card': return 'the payment approval card';` (exhaustive switch; no default — verify TS compilation post-add).

- [ ] **3d.** **5th-file amendment per founder Item 2 (a):** `PaymentApprovalQueueView.tsx` at line 77 — extend `<tr>` element:
  - **Before (verified at recon line 77):** `<tr key={b.bill_id} className="border-b border-neutral-100">`
  - **After:** `<tr key={b.bill_id} onClick={() => onNavigate({ type: 'payment_approval_card', orgId, billId: b.bill_id })} className="border-b border-neutral-100 cursor-pointer hover:bg-neutral-50">`
  - Substrate-amendment scope: 1-line change to existing `<tr>` element + className extension; B5-3-D2 substrate forward-progress amendment (NOT retrospective edit; δ-i preserved)

- [ ] **3e.** Validation: `pnpm typecheck` green.

---

### Task 4: Integration test for POST /bills/[billId]/approve-for-payment route

**Goal:** Ship Category A floor tests + INV-AP-002 state-transition + audit assertion + Reading B preservation verification (NO journal_entry created).

**Files:**
- CREATE: `apps/web/tests/integration/billApproveForPaymentRoute.test.ts`

**Steps:**

- [ ] **4a.** Verify substrate at task-start grain:
  - `apps/web/tests/integration/postBillRoute.test.ts` (session #1; 5 Category A floor tests + audit assertion) — mirror pattern
  - `apps/web/tests/integration/billApproveForPayment.test.ts` (B5-2 service-grain test; existing) — read for audit-query pattern + bill seeding helpers
  - `.claude/skills/integration-test-rules/SKILL.md` §3.1+§3.2 — disciplines

- [ ] **4b.** Author test with §3.1+§3.2 disciplines:
  - **§3.1 trace_id prefix:** `T${traceId.slice(0,8)}_*` on COA codes + bill_number
  - **§3.2 NO DELETE** on `audit_log` (append-only). **NOTE:** Approve is state-only — does NOT create `journal_entries` or `journal_lines` rows. Skip JE-cleanup mechanism for this test (Reading B preserved by construction at this route).

  Category A floor tests (5):
  1. **200 success path:** seed bill in `pending_approval` → POST → 200 + `{ bill_id }`; verify `bills.lifecycle_state` updated to `'approved_for_payment'`; verify `recordMutation` audit row emitted with `action: 'bill_approved_for_payment'` + `entity_type: 'bill'` + `before_state.lifecycle_state: 'pending_approval'`; **verify NO new journal_entries / journal_lines rows created** (Reading B preserved by construction)
  2. **401 unauth:** POST without auth → 401
  3. **403 wrong-org:** POST with valid auth for org A but URL org B → 403 (per session #1 catch — withInvariants org-access fires; URL/body mismatch unlikely since body is empty for approve route; verify which path fires)
  4. **400 Zod fail / 404 NOT_FOUND:** POST against non-existent bill_id → ServiceError `NOT_FOUND` → status `serviceErrorToStatus('NOT_FOUND')` = 404
  5. **500 service-error / state-precondition mapping:** POST against bill NOT in `pending_approval` (e.g., already `approved_for_payment` or `fully_paid`) → ServiceError `POST_FAILED` + `BILL_INVALID_STATE_TRANSITION` message → status `serviceErrorToStatus('POST_FAILED')` = 422 OR 500 (verify mapping)

  Additional substantive assertions:
  - INV-AP-002 layer: state-transition enforcement — already covered by test 5
  - Audit query pattern (mirror billApproveForPayment.test.ts at lines 119-126):
    ```typescript
    const { data: audit } = await db
      .from('audit_log')
      .select('*')
      .eq('trace_id', traceId)
      .eq('action', 'bill_approved_for_payment')
      .eq('entity_id', billId);
    expect(audit).toHaveLength(1);
    expect(audit![0].entity_type).toBe('bill');
    ```
  - Reading B preservation: `db.from('journal_entries').select('journal_entry_id').eq('trace_id', traceId)` → expect `toHaveLength(0)` (NO JE emitted by approve)

- [ ] **4c.** Validation: `pnpm db:reset:clean && pnpm db:seed:all && pnpm test apps/web/tests/integration/billApproveForPaymentRoute.test.ts` passes.

---

### Task 5: paymentApprovalCard.spec.ts + bill.ts fixture extension

**Goal:** Ship E2E smoke spec for the row-click → card → approve flow. Extend `bill.ts` fixture with `seedBillPendingApproval` helper.

**Files:**
- CREATE: `apps/web/tests/e2e/paymentApprovalCard.spec.ts`
- MODIFY: `apps/web/tests/e2e/fixtures/bill.ts` — add `seedBillPendingApproval(orgId)` helper

**Steps:**

- [ ] **5a.** Verify substrate at task-start grain:
  - `apps/web/tests/e2e/fixtures/bill.ts` (session #1; 5 helpers: seedTestVendor + gotoBillForm + fillBillForm + submitBillForm + assertBillCreated)
  - `apps/web/tests/e2e/billForm.spec.ts` (session #1; smoke spec pattern)

- [ ] **5b.** Extend `bill.ts` fixture:
  - Add `seedBillPendingApproval(orgId, vendorId): Promise<{ billId, cleanup }>` — creates bill in `pending_approval` state via Supabase admin client (similar shape to `seedTestVendor`)
  - Add `gotoPaymentApprovalQueue(page, orgId)` — navigate via MainframeRail "Payment Approval Queue" title click
  - Add `clickQueueRow(page, billId)` — click the queue row matching bill_id (locator pattern: row text contains bill_number or row data-attribute)
  - Add `assertApprovalCardRendered(page, billId)` — verify card heading + bill details visible
  - Add `clickApproveButton(page)` — click "Approve for Payment" button

- [ ] **5c.** Author `paymentApprovalCard.spec.ts`:
  - Single test: seed bill in pending_approval → navigate to PaymentApprovalQueueView → click row → assert card renders with bill details → click approve → assert navigation back to queue + bill no longer in queue (state transitioned to approved_for_payment)

- [ ] **5d.** Validation: `pnpm typecheck` green. **E2E execution itself is informational per catch #37** (NOT chunk-close gate). Do NOT run `pnpm test:e2e` as validation gate step.

---

### Task 6: D2.7 screenshot gate (γ) firing

**Goal:** Per CLAUDE.md §UI-session screenshot gate convention: orchestrator drafts prescribed sequence; founder captures against fresh seed; orchestrator spot-checks; gate blocks chunk closeout until passed.

**Steps:**

- [ ] **6a.** Orchestrator drafts prescribed 7-shot capture sequence (5 read-side from B5-3-D2 + 2 write-side from B5-3-D3):

| Shot | Surface | Per-shot verification |
|---|---|---|
| 1 | ApAgingView (B5-3-D2 EC-A-3) | 4-bucket aging table populated; total row in tfoot; as_of_date filter input visible |
| 2 | OpenBillsView (B5-3-D2 EC-A-4) | Bills list table populated; "open bills" header visible |
| 3 | VendorBalanceView (B5-3-D2 EC-A-5) | Vendor selected via dropdown; 4-component balance display visible |
| 4 | PaymentApprovalQueueView (B5-3-D2 EC-A-6; **row-click amendment REVERTED per (iii-b)**) | Queue rows visible; per-row display: bill_number + vendor + due_date + amount_due (rows NOT clickable; row-click UX deferred per catch #57) |
| 5 | PaidBillsHistoryView (B5-3-D2 EC-A-7) | History rows visible (post-payment bills) |
| 6 | **NEW: ManualBillForm (B5-3-D3 session #1)** | Form mounted via MainframeRail "New Bill"; VendorPicker dropdown populated; ≥1 bill line item; Bill Amount input filled; AP Control Account preselected to "2000 — Accounts Payable" |
| 7 | **NEW: PaymentApprovalCard (B5-3-D3 session #2)** | Card mounted via **agent canvas directive** (founder invokes agent → agent emits `{type: 'payment_approval_card', orgId, billId}` directive against bill in `pending_approval` state; row-click entry-path deferred per (iii-b)); bill details visible (bill_number + vendor_id + due_date + amount_cad + amount_due); Approve button enabled (functional against pending_approval bill); Cancel button visible |

- [ ] **6b.** Founder captures shots against fresh `pnpm db:reset:clean && pnpm db:seed:all` state (Item 2 b convention). Shots saved to founder's review folder (path TBD per founder workflow).

- [ ] **6c.** Orchestrator spot-checks each shot against prescribed verifications. Surface gate verdict (PASS / FAIL per shot) to founder.

- [ ] **6d.** If any shot FAILS verification, halt chunk-completion — implementer-grain fix dispatch + re-capture cycle. If all 7 PASS, proceed to Task 7.

---

### Task 7: Validation gate

**Goal:** Verify all changes pass chunk-close gate per CLAUDE.md "What done means" §1.

**Steps:**

- [ ] **7a.** `pnpm agent:validate` — expect 26/26 (no new agent-floor tests).
- [ ] **7b.** `pnpm typecheck` — expect ZERO type errors.
- [ ] **7c.** `pnpm db:reset:clean && pnpm db:seed:all && pnpm test` — full vitest at clean DB; expect 821 + new tests (estimate: +3-5 from billApproveForPaymentRoute.test.ts; resulting baseline ~824-826).
- [ ] **7d.** **NOT run as gate:** `pnpm test:e2e` (catch #37 + catch #50 lessons; informational only).
- [ ] **7e.** **NOT run as gate:** `pnpm build` (catch #50 lesson; CLAUDE.md §1 doesn't include build; pre-existing ESLint failures persist per Item 4 arc-closure carry-forward).

---

### Task 8: Closeout artifacts

**Goal:** Ship chunk-completion governance artifacts per §Drift-C (retrospective venue: inline-in-friction-journal) + push-readiness three-condition gate evaluation per CLAUDE.md.

**Files:**
- MODIFY: `docs/07_governance/friction-journal.md` — chunk-B5-3-D3 retrospective entry

**Steps:**

- [ ] **8a.** Author friction-journal chunk-B5-3-D3 retrospective entry per §Drift-C inline-in-friction-journal convention. Sections:
  - **Chunk shape:** (cadence-β-i-b) 2-session bundled cadence; cross-arc N=2 (B5-2 + B5-3-D2 + B5-3-D3); graduation evaluation defers to Phase 5 arc-closure per §Drift-B
  - **Catches at chunk B5-3-D3:** chunk-onset #40-#46 (7) + session #1 implementation #47-#54 (8) + session #2 implementation #55+ (TBD); cumulative N=53 at session #1 close; session #2 increment surfaced post-implementation
  - **Sub-mechanism distribution:** WSL-side substrate-citation drift N=10 (codification-candidate evidence basis); WSL-side scope-projection under-specification N=5 (codification-candidate strengthens); over-specification N=2; NEW pre-existing-rule-firing surface bucket N=1; etc.
  - **Within-arc prophylactic-application-grain:** N=14 successful preventive catches across B5-3-D2 + B5-3-D3 implementation; substantively load-bearing for arc-closure synthesis
  - **Within-arc cross-subagent grain-axis:** N=12 (B5-3-D2 N=5 + B5-3-D3 N=7)
  - **Drift dispositions preserved:** §Drift-A + §Drift-B + §Drift-C; Item 4 B5-3-D1 substrate-amendment timing carry-forward to arc-closure venue
  - **Carry-forward inventory:** 32 arc-closure retrospective candidates (candidate 4 EXPANDED scope per catch #54); 2 subsequent-chunk-firing items (FT1 + Item 18 org_settings)
  - **Chunk-completion bundle:** files + lines + validation gate state + cumulative N
  - **Plan-doc-grain dispositions:** all chunk-onset surfaces ratified; session #2 plan-doc dispositions (D3.x carry-forward + Task 2 data-fetch endpoint decision)

- [ ] **8b.** Push-readiness three-condition gate evaluation (per CLAUDE.md "Push readiness three-condition gate" convention):
  1. **Test-suite health:** MET (821+/821+ vitest + 26/26 agent:validate + typecheck clean at clean DB baseline at chunk-B5-3-D3 close)
  2. **Doc-sync reconciled:** Verify `invariants.md` ↔ `control_matrix.md` ↔ `ledger_truth_model.md` ↔ shipped code consistency. Bidirectional reachability diff clean (or document flagged exceptions). `types.ts` regenerated against post-chunk schema if needed. Per chunk B5-3-D3 scope (no ledger-truth-model amendments; no new INVs; canvas integration is type-level only) — likely **trivially MET** like B5-3-D2.
  3. **Governance closeout:** MET via friction-journal chunk-B5-3-D3 entry (8a above) + retrospective inline per §Drift-C + within-arc cumulative state documentation

- [ ] **8c.** Pre-push sanity sequence (from CLAUDE.md):
  ```bash
  git log --oneline origin/staging..HEAD | wc -l  # expect 2 (session #1 + session #2)
  git status --short  # expect clean
  pnpm agent:validate  # 26/26 green
  pnpm test  # baseline
  pnpm typecheck  # green
  ```

---

### Task 9: Chunk-completion Stage 6

**Goal:** Per Item 17 (γ-a) graduated standing rule: chunk-completion Stage 6 = chunk-completion bundled commit + push to `origin/staging` + 2 memory writes (pickup file refresh + MEMORY.md refresh).

**Steps:**

- [ ] **9a.** Stage all session #2 working-tree changes per (γ-a) bundle pattern.

- [ ] **9b.** Create chunk-completion bundled commit with comprehensive message:
  - Title: `feat(spend): chunk B5-3-D3 SHIPPED — AP write-side UI completion + chunk closeout`
  - Body: chunk-completion summary; cumulative state; catch ledger; carry-forward inventory; validation gate state; push-readiness three-condition gate met
  - Co-Authored-By trailer per CLAUDE.md commit conventions

- [ ] **9c.** Push to `origin/staging`. Pre-push sanity sequence per Task 8c. Per (cadence-β-i-b) precedent: push fires at chunk-completion (NOT session #1 close).

- [ ] **9d.** Memory writes (2):
  - Refresh `project_phase_5_spend_initiative_pending.md` pickup file: change name to "Phase 5 chunk B5-3-D3 SHIPPED (terminal); next-chunk onset pending"; document chunk-completion state + cumulative N + carry-forward inventory
  - Refresh `MEMORY.md` index entry: single-line update reflecting chunk-completion

- [ ] **9e.** Verify push lands clean: `git status --short` shows clean working tree; `git log --oneline -3` shows chunk-completion commit as HEAD; alignment 0/0 with `origin/staging`.

---

## Carry-forward inventory (post-chunk-completion)

**Active for subsequent-chunk firing (2 items; preserved-deferred):**

1. FT1 `clampTtl` NaN-guard at `supabaseStorageProvider.ts:95-99` — storage-substrate-touching chunk
2. Item 18 org_settings substrate-floor — (orgset-β) sub-arc

**Active for Phase 5 arc-closure retrospective (32 candidates entering arc-closure):**

- All catches #1-#54+ logged (cumulative N at chunk-B5-3-D3 close; session #2 implementation catches accumulate to running total)
- Within-arc-prophylactic-application-grain codification candidate (N=14+ successful preventive catches; substantively load-bearing)
- Within-arc cross-subagent grain-axis codification candidate (N=12+)
- Candidate 4 EXPANDED scope (header-text + per-property annotation amendments across 5 Phase 5 service files per catch #54)
- (cadence-β-i-b) cross-arc N=3 evaluation (B5-2 + B5-3-D2 + B5-3-D3); graduation evaluation per candidate (e)
- Chain-of-drift propagation patterns (#38 bilateral meta + #45 founder-ratification-surface)
- Hybrid catch classification model precision (32nd candidate)
- ESLint rule `services/withInvariants-wrap-or-annotate` per-property annotation pattern emergence (sub-surface within candidate 4)

**Subsequent chunk election (post-B5-3-D3):**

Per (decomp-γ) hybrid by domain-slice methodology — next-chunk onset triangulation owns substrate-decision authority for chunk selection. Candidates:
- B5-3-E (AR domain slice)
- B5-3-D4+ (continue Spend with recordPayment + reverse mutations)
- Alternative phase-grain election

---

## Plan-doc-grain dispositions surfaced during draft (FLAGGED for brainstorm-side parallel-surface verification)

1. **Task 2 data-fetch endpoint decision (α vs β):**
   - (α) **WSL-side lean:** Reuse `/api/orgs/${orgId}/reports/payment-approval-queue` endpoint + client-side filter by billId. Substantive grounds: queue endpoint already returns `PaymentApprovalQueueRow` shape with all needed fields; YAGNI on new per-bill endpoint; minimal substrate addition.
   - (β) Alternative: New per-bill GET endpoint at `/api/orgs/${orgId}/bills/${billId}/route.ts`. Substantive grounds: cleaner separation; future re-use. Counter-grounds: substrate-novelty exceeds session-scope; not required for v1 card UX.
   - **WSL-side ratification at plan-doc grain: (α)** — defer (β) to future chunk if per-bill endpoint demand emerges.

2. **Approve route URL structure:**
   - **WSL-side ratification at plan-doc grain:** `/api/orgs/[orgId]/bills/[billId]/approve-for-payment/route.ts` per chunk-onset Surface 3 (a) verb-explicit nested URL + recurring-runs verb-segment precedent (recon-verified at `/api/orgs/[orgId]/recurring-runs/[runId]/approve/route.ts`).
   - Note: URL segment uses `approve-for-payment` (descriptive); action name in withInvariants uses `bill.approve` (canonical short form per billService.ts:11 + :406).

3. **Approve route returns 200 (NOT 201):**
   - **WSL-side ratification at plan-doc grain:** State transition (NO new resource created); aligns with recurring-runs approve precedent at `route.ts:35` (status 200).

4. **PaymentApprovalQueueView amendment scope (forward-progress vs retrospective):**
   - **WSL-side ratification at plan-doc grain per founder Item 2 (a):** Forward-progress amendment (NOT retrospective edit). B5-3-D2 substrate is closed but adding new functionality (row-click navigation) is forward-progress — δ-i discipline preserved (no closed-substrate retrospective text amendment).

5. **MainframeRail NOT modified this session:**
   - **WSL-side ratification at plan-doc grain:** PaymentApprovalCard is per-bill (requires billId; cannot invoke from MainframeRail which has no billId context). Access pattern: row-click from PaymentApprovalQueueView. Per chunk-onset Surface 7 ratification.

6. **D2.7 screenshot gate 7-shot prescribed sequence:**
   - **WSL-side ratification at plan-doc grain:** 7 shots = 5 read-side B5-3-D2 + 2 write-side B5-3-D3. Matches Phase A scope-lock (post-EC-A-8 (δ) scope-removal per §11.5).

7. **(cadence-β-i-b) cross-arc N=3 evaluation at chunk-completion:**
   - **WSL-side observation:** B5-2 + B5-3-D2 + B5-3-D3 = N=3 instances of (cadence-β-i-b) 2-session bundled cadence. Cross-arc N=3 evidence basis for arc-closure graduation evaluation. Per §Drift-B narrow-scope methodology: graduation evaluation DEFERS to Phase 5 arc-closure venue (NOT chunk-completion).

---

**Standing by for brainstorm-side parallel-surface verification + founder dispatch authorization. Per founder directive at chunk-onset: "Do NOT auto-progress to implementer dispatch."**

---

## ADDENDUM: Catch #57 disposition + (iii-b) execution (post-Task-5 checkpoint, 2026-05-12)

**Catch #57 discovered at Task 5 implementation grain.** Substantive UX-architecture surface: `apReportService.paymentApprovalQueue` (B5-3-D1 substrate at HEAD `1844f9e`) filters `lifecycle_state === 'approved_for_payment'` post-fetch (verified at apReportService.ts:489-491 + per-method docstring line 461-462). PaymentApprovalCard consumes `bill.approve` mutation which transitions `pending_approval → approved_for_payment`. **Logical contradiction:** the card's primary action requires `pending_approval` state, but bills entering via queue-row-click are already `approved_for_payment`.

**Spec intent vs B5-3-D1 substrate-grain implementation drift:** Spend brief §3.1 mapping table cites `approve_bill_for_payment` produces `bill: posted → approved_for_payment` — using legacy term `posted` for pre-state. The canonical 7-state enum predecessor for `approved_for_payment` is `pending_approval`. So the spec INTENT for "Payment approval queue" (EC-A-6 / §11.4) is bills awaiting approval (`pending_approval`), NOT bills awaiting payment execution (`approved_for_payment`). The B5-3-D1 implementation encoded the post-state filter, contradicting spec §11.4 EC-A-6 intent.

**Founder ratification (2026-05-12): option (iii-b) executed.** Revert chunk-onset Item 2 (a) 5-file canvas integration ratification at session-grain. Substrate-decision rollback grounded by catch #57 new disk-grounded information. PaymentApprovalCard accessible via agent canvas directive only at v1.

**Reverts executed at post-Task-5 checkpoint:**
- `apps/web/src/components/canvas/PaymentApprovalQueueView.tsx` — `git restore` to pre-session-#2 state (drops line 20 prop destructuring + line 77 row-click amendment)
- `apps/web/tests/e2e/fixtures/bill.ts` — `git restore` to session #1 state (drops 5 helpers added at Task 5)
- `apps/web/tests/e2e/paymentApprovalCard.spec.ts` — DELETED (E2E spec authored against queue→row-click→card flow which doesn't exist under (iii-b))

**Post-revert working tree (effective Tasks 1-5 scope under (iii-b)):**
- NEW (3): approve route + PaymentApprovalCard + integration test
- MODIFIED (3): canvasContextSuffix.ts + ContextualCanvas.tsx + canvasDirective.ts (4-file canonical canvas integration; `payment_approval_card` discriminator preserved for agent-directive entry)
- Typecheck clean

**Catch #57 sub-mechanism classification (per founder ratification of brainstorm-side lean):** NEW sub-mechanism bucket — substrate-grain semantic drift discovered at downstream-consumer implementation grain. Sibling-class to catch #54 (pre-existing-substrate-drift surface).

**Cumulative catch ledger post-session-#2-implementation:**

| Catch | Class | Sub-grain |
|---|---|---|
| #55 | WSL-side substrate-citation drift | type-shape grain (`PaymentApprovalQueueRow` `MoneyAmount` branded vs template's local `BillRow` with `string`) |
| #56 | WSL-side scope-projection under-specification | amendment-site enumeration grain (plan cited line 77 but missed line 20 prop destructure) |
| #57 | **NEW sub-mechanism bucket: substrate-grain semantic drift at downstream-consumer grain** | queue-filter-semantic grain (B5-3-D1 substrate `approved_for_payment` filter vs spec §11.4 intent `pending_approval`) |

**Cumulative N=56** post-session-#2-implementation. Sub-mechanism distribution: WSL-side substrate-citation drift N=11 (+#55) + WSL-side scope-projection under-specification N=6 (+#56; codification-candidate strengthens further) + NEW substrate-grain semantic drift at downstream-consumer grain N=1 (#57).

**Arc-closure carry-forward EXPANDED per catch #57:** Candidate 4 (header-text + per-property ESLint annotation per catch #54) now includes additional sub-surface — B5-3-D1 `apReportService.paymentApprovalQueue` filter semantic-drift correction (filter should be `pending_approval` per spec §11.4 EC-A-6 intent OR rename queue per UX-architecture reconciliation) + PaymentApprovalQueueView row-click UX add-back after substrate semantic-fix lands.

**UX-completeness trade-off accepted at v1:** PaymentApprovalCard functional via agent canvas directive only at chunk-B5-3-D3 ship. Row-click UX from PaymentApprovalQueueView reintroduces when substrate semantic-fix lands (arc-closure or substrate-correction sub-chunk).

**(iii-b) execution preserves §Drift-B + δ-i discipline:** B5-3-D2 substrate (PaymentApprovalQueueView.tsx) restored to closed state via revert; no closed-substrate amendment at session-grain. Substrate amendment defers to arc-closure venue per Item 4 framing.

---

**Task 5 effectively complete under (iii-b) scope. Proceed to Task 6 (D2.7 screenshot gate; orchestrator drafts → founder captures → orchestrator spot-checks).**
