# Phase 5 Chunk B5-3-D2 Substantive Session #2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship remaining 2 read-side AP report UI canvas views (EC-A-6 payment approval queue + EC-A-7 paid bills history) + canvas integration extension for 2 new discriminator types + 2 Playwright E2E smoke tests + chunk B5-3-D2 closeout artifacts (friction-journal entry + push-readiness three-condition gate + chunk-grain push + Item 17 chunk-completion Stage 6) per (cadence-β-i-b) 2-session bundled cadence. Session #2 closes chunk B5-3-D2 with 5 of 5 v1-deliverable view UI surfaces shipped (3 from session #1 + 2 from session #2; EC-A-8 scope-removed under (δ) per §11.5 Document-Platform ownership).

**Architecture:** Pattern parity with session #1 minus service-substrate scope. Canvas-only view shape (Q1 ratification). 2 new canvas view components under `apps/web/src/components/canvas/` consume 2 new API routes under `apps/web/src/app/api/orgs/[orgId]/reports/`. NO new service files (consumes existing `apReportService.paymentApprovalQueue` + `apReportService.paidBillsHistory` shipped at B5-3-D1 session #2). NO new Zod schemas (consumer schemas shipped at B5-3-D1 session #2). Pattern (b) Canvas view + API route per D2.2 ratification: route calls service, view client-fetches via `useEffect` + `fetch()`. All routes read-only — no `withInvariants()` wrapping per service-architecture skill §2 canonical.

**Canvas integration extension (session #2 grain):** 4-file extension at `canvasDirective.ts` + `MainframeRail.tsx` + `ContextualCanvas.tsx` + `canvasContextSuffix.ts` for 2 new discriminator types: `report_payment_approval_queue` + `report_paid_bills_history` per `report_*` naming convention parity. Same 4-file pattern as session #1 ratified per catch #35 disposition.

**Tech Stack:** Next.js App Router, React 18+ (`'use client'` canvas components), TypeScript, Playwright (E2E smoke tests). NO new dependencies; NO new migrations.

**Locked-scope context** (chunk B5-3-D2 onset + session #2 ratifications inherited):

- **D2.1 cadence:** (cadence-β-i-b) 2-session bundled — session #2 ships 2 views + closeout
- **D2.2 data-fetching:** Pattern (b) Canvas view + API route (consume existing service methods)
- **D2.3 UI organization:** Canvas-view-driven — 2 view components in `/components/canvas/` + 2 API routes
- **D2.5 filter UI:** Native HTML — no filter UI in v1 (both EC-A-6 + EC-A-7 take only `{ org_id }` input; no filter parameters)
- **D2.6 test architecture:** Playwright E2E grain (smoke render + table-shape assertion); SKIP component-grain unit tests v1
- **D2.7 screenshot gate:** (γ) DEFERRED to B5-3-D3 closeout — captures all 7 Phase A UI surfaces at single fixture state
- **D2.8 EC-A-8:** (δ) scope-removal symmetry preserved
- **Q1 page route shell:** (i) Canvas-only — NO page route shells; views mount via agent canvas integration (MainframeRail title-button trigger per `journalEntry.ts:15-17` precedent)
- **Drift disposition:** new file headers do NOT replicate aspirational `withInvariants(action: '<verb>.read')` claim from B5-3-D1 apReportService.ts + vendorReportService.ts headers; arc-closure retrospective carry-forward per §Drift-B + δ-i

**Prophylactic lessons from session #1 catches applied (codification candidate at within-arc-prophylactic-application grain):**

- **Catch #34 lesson:** canvas view component imports cite `CanvasNavigateFn` from `@/shared/types/canvasDirective` + `SelectedEntity` from `@/shared/types/canvasContext` per BasicTrialBalanceView precedent. NOT `@/components/canvas/types` (module does NOT exist).
- **Catch #35 lesson:** Files-to-modify enumerates 4 canvas integration files explicitly (canvasDirective.ts + MainframeRail.tsx + ContextualCanvas.tsx + canvasContextSuffix.ts). The 4th file is required because canvasContextSuffix.ts has exhaustive `describeDirective` switch with no default case.
- **Catch #36 lesson:** Both EC-A-6 + EC-A-7 service signatures take only `{ org_id }` input (verified-from-disk at apReportService.ts:450 + :516); no UUID-typed parameter requires TS-typing explicit resolution. No catch #36 sub-grain instance anticipated.
- **Catch #37 lesson:** Validation gate scope = `pnpm agent:validate` + `pnpm test` (vitest) + `pnpm typecheck` ONLY per CLAUDE.md "What done means" §1. E2E is informational/founder-review-workflow grain, NOT part of chunk-close gate. Plan doc Task 4 validation gate does NOT cite `pnpm test:e2e` as gate step.

**Patterns inherited from chunk B5-3-D1 + session #1 (substrate-grounded against HEAD `e143792`):**

- **trial-balance/route.ts canonical route shape** + 3-line header (line 1-3); no withInvariants for reads
- **vendorReportService.ts / apReportService.ts read-side service shape** — Pattern B unwrapped functions; existing methods consumed without modification
- **ApAgingView.tsx / OpenBillsView.tsx / VendorBalanceView.tsx** (session #1 ship) — canonical canvas view template for session #2 views; mirror pattern shape
- **journalEntry.ts E2E fixture trigger pattern** — `page.getByTitle('<Label>').click()` per `apps/web/tests/e2e/fixtures/journalEntry.ts:15-17`
- **adminClient discipline (INV-SERVICE-002)** + **Zod boundary validation** + **ServiceContext + trace_id propagation** + **READ-only discipline + Reading B preservation**

**Out of scope this session:**

- **NEW service files** — Pattern (b) consumes existing apReportService methods; no new service substrate
- **NEW Zod schemas** — consumer schemas shipped at B5-3-D1 session #2; no new schema files
- **Page route shells** at `/[locale]/[orgId]/reports/...` — Q1 (i) canvas-only ratified
- **VendorPicker UI abstraction** — D2.4 deferred to B5-3-D3 write-side UI chunk
- **Manual bill form + payment approval card UI** — B5-3-D3 candidate territory
- **Screenshot gate firing** — D2.7 (γ) deferred to B5-3-D3 closeout
- **Item 18 org_settings substrate-floor** — preserved-deferred; not firing
- **FT1 clampTtl NaN-guard** — preserved-deferred; no storage substrate consumption
- **B5-3-D1 service file header drift correction** — arc-closure retrospective carry-forward per §Drift-B + δ-i; this session does NOT amend B5-3-D1 closed substrate
- **Cross-arc retrospective synthesis** — (cadence-β-i-a) cross-arc N=2 + (cadence-β-i-b) cross-arc N=2 + (test-γ) grain definition + chain-of-drift propagation pattern + other cross-arc graduation evaluations all DEFER to Phase 5 arc-closure per §Drift-B narrow-scope methodology; chunk-B5-3-D2 closeout limits to chunk-grain reconciliation

---

## Files

**Files to create (4):**

API routes (2):
- `apps/web/src/app/api/orgs/[orgId]/reports/payment-approval-queue/route.ts` — GET EC-A-6 (consumes `apReportService.paymentApprovalQueue`; input `{ org_id }`)
- `apps/web/src/app/api/orgs/[orgId]/reports/paid-bills-history/route.ts` — GET EC-A-7 (consumes `apReportService.paidBillsHistory`; input `{ org_id }`)

Canvas view components (2):
- `apps/web/src/components/canvas/PaymentApprovalQueueView.tsx` — EC-A-6 canvas view (`'use client'`; single useEffect on mount; bills awaiting payment table; total amount due footer)
- `apps/web/src/components/canvas/PaidBillsHistoryView.tsx` — EC-A-7 canvas view (`'use client'`; single useEffect on mount; paid bills history table; total amount paid footer)

Playwright E2E tests (2):
- `apps/web/tests/e2e/paymentApprovalQueueView.spec.ts` — smoke render + table-shape assertion
- `apps/web/tests/e2e/paidBillsHistoryView.spec.ts` — smoke render + table-shape assertion

**Files to modify (4) — canvas integration extension per catch #35 disposition:**

- `apps/web/src/shared/types/canvasDirective.ts` — extend `CanvasDirective` discriminated union with 2 new types: `{ type: 'report_payment_approval_queue'; orgId: string }` + `{ type: 'report_paid_bills_history'; orgId: string }`. Insert at the `report_*` cluster after `report_vendor_balance` (line 21 post-session-#1) per naming convention parity.
- `apps/web/src/components/bridge/MainframeRail.tsx` — extend ICONS array (post-session-#1 at lines ~23-32) with 2 new entries: `{ id: 'payment_approval_queue', label: 'Payment Approval Queue', icon: '\u{1F4B3}' }` + `{ id: 'paid_bills_history', label: 'Paid Bills History', icon: '\u{1F4DC}' }`. Extend `handleClick` switch with 2 new cases calling `onNavigate({ type: 'report_payment_approval_queue' | 'report_paid_bills_history', orgId })`. Implementer-subagent discretion on icon glyphs per existing pattern.
- `apps/web/src/components/bridge/ContextualCanvas.tsx` — extend `renderDirective` switch with 2 new cases mounting the 2 view components: `case 'report_payment_approval_queue': return <PaymentApprovalQueueView orgId={d.orgId} onNavigate={onNavigate} onSelectEntity={onSelectEntity} />;` + similar for `report_paid_bills_history`. Add 2 imports at top of file.
- `apps/web/src/agent/prompts/suffixes/canvasContextSuffix.ts` — extend `describeDirective` exhaustive switch with 2 new cases (per catch #35 4th-file requirement): `case 'report_payment_approval_queue': return 'the payment approval queue';` + `case 'report_paid_bills_history': return 'the paid bills history';`. Insert at existing `report_*` cluster post-session-#1.

Each view's task (Task 1 + Task 2) extends these 4 files at per-view grain; working tree accumulates per (γ-a) bundle pattern; single bundled commit at session-close coalesces all modifications.

**Files NOT touched (preservation):**

Session #1 + B5-3-D1 ship (closed; preserved):
- All B5-3-D1 service files (apReportService.ts + vendorReportService.ts) — methods consumed; not modified
- All session #1 view components (ApAgingView, OpenBillsView, VendorBalanceView) — pattern-precedent; not modified
- All session #1 API routes (ap-aging, open-bills, vendor-balance, vendors)
- All B5-3-D1 schemas — consumer schemas; not modified
- All B5-3-D1 + session #1 tests
- `vendorService.ts` (session #1 ship) — preserved
- Mutation substrate (B5-1 + B5-2 + journalEntryService) — preserved
- All migration files — no schema changes
- All ADRs + SKILL files — no governance amendments this session
- `CLAUDE.md` + `.gitignore` + `package.json` — no convention amendments

**Files to modify (governance) — at session-#2-close:**

- `docs/07_governance/friction-journal.md` — chunk-B5-3-D2 closeout entry per §Drift-B narrow-scope methodology (chunk-grain catches enumeration + drift dispositions + carry-forward inventory; arc-closure synthesis DEFERS to Phase 5 arc-closure retrospective)

---

## Task 1: EC-A-6 Payment approval queue view

### Task 1a: payment-approval-queue/route.ts API route

**Files:**
- Create: `apps/web/src/app/api/orgs/[orgId]/reports/payment-approval-queue/route.ts`

Pattern parity with session #1 Task 2a (`ap-aging/route.ts`). Canonical 3-line header per trial-balance/route.ts; no withInvariants wrapping; standard try/catch + ServiceError handling.

- [ ] **Step 1: Create route file.**

```typescript
// src/app/api/orgs/[orgId]/reports/payment-approval-queue/route.ts
// GET — Payment approval queue: bills in approved_for_payment lifecycle_state.
// No withInvariants — reads call service directly per CLAUDE.md Rule 2.

import { NextResponse } from 'next/server';
import { apReportService } from '@/services/spend/reports/apReportService';
import { buildServiceContext } from '@/services/middleware/serviceContext';
import { ServiceError } from '@/services/errors/ServiceError';
import { serviceErrorToStatus } from '@/app/api/_helpers/serviceErrorToStatus';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ orgId: string }> },
) {
  try {
    const { orgId } = await params;
    const ctx = await buildServiceContext(req);
    const result = await apReportService.paymentApprovalQueue(
      { org_id: orgId },
      ctx,
    );
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof ServiceError) {
      return NextResponse.json(
        { error: err.code, message: err.message },
        { status: serviceErrorToStatus(err.code) },
      );
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
```

### Task 1b: PaymentApprovalQueueView.tsx canvas component

**Files:**
- Create: `apps/web/src/components/canvas/PaymentApprovalQueueView.tsx`

Pattern parity with `OpenBillsView.tsx` (session #1 ship; single useEffect; no filter UI; table render with bill rows + footer total). Differences: column shape per `PaymentApprovalQueueRow` (bill_id, vendor_id, bill_number, due_date, amount_cad, amount_due).

- [ ] **Step 1: Create canvas view component.**

```typescript
// src/components/canvas/PaymentApprovalQueueView.tsx
'use client';
//
// EC-A-6 Payment approval queue canvas view (Phase 5 chunk B5-3-D2 session #2).
// Consumes /api/orgs/[orgId]/reports/payment-approval-queue via client-side
// fetch per Pattern (b) ratification. Bills in approved_for_payment lifecycle
// state awaiting payment execution.

import { useEffect, useState } from 'react';
import type { CanvasNavigateFn } from '@/shared/types/canvasDirective';
import type { SelectedEntity } from '@/shared/types/canvasContext';
import type { PaymentApprovalQueueOutput } from '@/services/spend/reports/apReportService';

export interface PaymentApprovalQueueViewProps {
  orgId: string;
  onNavigate: CanvasNavigateFn;
  onSelectEntity?: (entity: SelectedEntity) => void;
}

export function PaymentApprovalQueueView({ orgId }: PaymentApprovalQueueViewProps) {
  const [data, setData] = useState<PaymentApprovalQueueOutput | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetch(`/api/orgs/${orgId}/reports/payment-approval-queue`)
      .then(async (r) => {
        if (!r.ok) {
          const body = await r.json().catch(() => ({}));
          throw new Error(body.error || 'Failed to load payment approval queue');
        }
        return r.json();
      })
      .then((data: PaymentApprovalQueueOutput) => {
        if (!cancelled) {
          setData(data);
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

  return (
    <div className="p-6">
      <h2 className="text-lg font-semibold mb-4">Payment Approval Queue</h2>

      {loading && <div className="text-sm text-neutral-400">Loading...</div>}
      {error && <div className="text-sm text-red-500">{error}</div>}
      {!loading && !error && data && data.bills.length === 0 && (
        <div className="text-sm text-neutral-400">No data.</div>
      )}
      {!loading && !error && data && data.bills.length > 0 && (
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs uppercase tracking-wide text-neutral-500 border-b border-neutral-200">
              <th className="py-2 pr-4 text-left">Bill #</th>
              <th className="py-2 pr-4 text-left">Vendor</th>
              <th className="py-2 pr-4 text-left">Due date</th>
              <th className="py-2 pr-4 text-right">Amount due</th>
            </tr>
          </thead>
          <tbody>
            {data.bills.map((b) => (
              <tr key={b.bill_id} className="border-b border-neutral-100">
                <td className="py-2 pr-4">{b.bill_number ?? '—'}</td>
                <td className="py-2 pr-4 font-mono text-xs">{b.vendor_id}</td>
                <td className="py-2 pr-4">{b.due_date ?? '—'}</td>
                <td className="py-2 pr-4 text-right font-mono">{b.amount_due}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="font-semibold border-t-2 border-neutral-300">
              <td className="py-2 pr-4" colSpan={3}>Total amount due</td>
              <td className="py-2 pr-4 text-right font-mono">{data.total_amount_due}</td>
            </tr>
          </tfoot>
        </table>
      )}
    </div>
  );
}
```

NOTE: `PaymentApprovalQueueOutput` type import path: verify-from-disk at implementation. Reference: session #1 `ApAgingView.tsx` imports `ApAgingOutput` from `@/services/spend/reports/apReportService`. Same path for EC-A-6 + EC-A-7 if type exported there. If type isn't exported at cited path, surface for orchestrator triangulation.

### Task 1c: Canvas integration extension for report_payment_approval_queue

**Files:**
- Modify: `apps/web/src/shared/types/canvasDirective.ts` — add discriminator type
- Modify: `apps/web/src/components/bridge/MainframeRail.tsx` — extend ICONS + handleClick
- Modify: `apps/web/src/components/bridge/ContextualCanvas.tsx` — extend renderDirective + import
- Modify: `apps/web/src/agent/prompts/suffixes/canvasContextSuffix.ts` — extend describeDirective

Pattern parity with session #1 Task 2c (canvas integration for `report_ap_aging`). 4-file extension per catch #35 disposition.

- [ ] **Step 1: Extend canvasDirective.ts.**

Insert new discriminator at the `report_*` cluster after `report_vendor_balance` (currently at line ~21 post-session-#1):

```typescript
| { type: 'report_payment_approval_queue'; orgId: string }
```

- [ ] **Step 2: Extend MainframeRail.tsx ICONS array + handleClick switch.**

Add new entry to ICONS array (after `vendor_balance` at line ~30 post-session-#1):

```typescript
{ id: 'payment_approval_queue', label: 'Payment Approval Queue', icon: '\u{1F4B3}' },
```

Add new case to handleClick switch:

```typescript
case 'payment_approval_queue':
  return onNavigate({ type: 'report_payment_approval_queue', orgId });
```

- [ ] **Step 3: Extend ContextualCanvas.tsx renderDirective switch + import.**

Add import at top of file:

```typescript
import { PaymentApprovalQueueView } from '@/components/canvas/PaymentApprovalQueueView';
```

Add new case to renderDirective switch (within `report_*` cluster):

```typescript
case 'report_payment_approval_queue':
  return <PaymentApprovalQueueView orgId={d.orgId} onNavigate={onNavigate} onSelectEntity={onSelectEntity} />;
```

- [ ] **Step 4: Extend canvasContextSuffix.ts describeDirective switch.**

Add new case (per catch #35 disposition — exhaustive switch with no default; required for typecheck):

```typescript
case 'report_payment_approval_queue':
  return 'the payment approval queue';
```

### Task 1d: paymentApprovalQueueView.spec.ts Playwright E2E

**Files:**
- Create: `apps/web/tests/e2e/paymentApprovalQueueView.spec.ts`

Pattern parity with session #1 Task 2d (`apAgingView.spec.ts`). Use `page.getByTitle('Payment Approval Queue').click()` canvas-mounting trigger per `journalEntry.ts:15-17` fixture precedent. Smoke assertions:

1. Navigate to org root + click "Payment Approval Queue" MainframeRail button
2. View renders (assert `<h2>Payment Approval Queue</h2>` visible via `page.getByRole('heading', { name: /payment approval queue/i })`)
3. Either table renders with bill rows + total row OR empty-state "No data" stencil visible

```
cd apps/web && pnpm exec playwright test tests/e2e/paymentApprovalQueueView.spec.ts
```

Expected: smoke assertions pass.

---

## Task 2: EC-A-7 Paid bills history view

Pattern parity with Task 1 structure. 4 sub-tasks: 2a route + 2b view + 2c canvas integration + 2d E2E.

### Task 2a: paid-bills-history/route.ts API route

**Files:**
- Create: `apps/web/src/app/api/orgs/[orgId]/reports/paid-bills-history/route.ts`

Pattern parity with Task 1a + trial-balance/route.ts canonical. Service call: `apReportService.paidBillsHistory({ org_id: orgId }, ctx)`.

- [ ] **Step 1: Create route file following Task 1a template.**

Header comment: `// GET — Paid bills history: bills in fully_paid lifecycle_state.`

### Task 2b: PaidBillsHistoryView.tsx canvas component

**Files:**
- Create: `apps/web/src/components/canvas/PaidBillsHistoryView.tsx`

Pattern parity with Task 1b. Output type: `PaidBillsHistoryOutput` (rows: `{ bill_id, vendor_id, bill_number, due_date, amount_cad }`; footer: `total_amount_paid`).

- [ ] **Step 1: Create canvas view component following Task 1b template; adapt to PaidBillsHistoryOutput shape.**

Heading text: "Paid Bills History". Footer label: "Total amount paid". Column shape: Bill # / Vendor / Due date / Amount paid.

### Task 2c: Canvas integration extension for report_paid_bills_history

**Files:**
- Modify: 4 canvas integration files per catch #35 disposition (same 4 files as Task 1c)

Pattern parity with Task 1c. Add:
- canvasDirective.ts: `| { type: 'report_paid_bills_history'; orgId: string }`
- MainframeRail.tsx ICONS: `{ id: 'paid_bills_history', label: 'Paid Bills History', icon: '\u{1F4DC}' }` + handleClick case
- ContextualCanvas.tsx: import PaidBillsHistoryView + renderDirective case
- canvasContextSuffix.ts: `case 'report_paid_bills_history': return 'the paid bills history';`

### Task 2d: paidBillsHistoryView.spec.ts Playwright E2E

**Files:**
- Create: `apps/web/tests/e2e/paidBillsHistoryView.spec.ts`

Pattern parity with Task 1d. Use `page.getByTitle('Paid Bills History').click()` canvas-mounting trigger. Smoke assertions per Task 1d shape adapted to EC-A-7.

```
cd apps/web && pnpm exec playwright test tests/e2e/paidBillsHistoryView.spec.ts
```

---

## Task 3: Validation gate

Per CLAUDE.md "What done means" §1 chunk-close convention (catch #37 lesson applied: gate scope = agent:validate + vitest + typecheck ONLY; E2E informational, NOT in gate).

- [ ] **Step 1: Type check.**

```
pnpm typecheck
```

Expected: green.

- [ ] **Step 2: Full Vitest suite.**

```
pnpm test
```

Expected: 816/816 clean DB baseline (NO new vitest tests at session #2 — no new Zod schemas to validate; consumer schemas already covered at B5-3-D1 unit tests).

If `accountLedgerService.test.ts` pollution-driven flake fires mid-suite (per session #1 observation), document as known carry-forward; non-blocking.

- [ ] **Step 3: agent:validate.**

```
pnpm agent:validate
```

Expected: 26/26 green (typecheck + no-hardcoded-URLs + Category A floor tests).

- [ ] **Step 4: Informational — Playwright E2E (NOT chunk-close gate; founder-review-workflow grain per CLAUDE.md).**

```
cd apps/web && pnpm exec playwright test tests/e2e/paymentApprovalQueueView.spec.ts tests/e2e/paidBillsHistoryView.spec.ts
```

Expected: 2 new E2E tests pass. Pre-existing ec-19.spec.ts a + b failures continue (not-regression per session #1 stash-regression-check verification).

---

## Task 4: Chunk B5-3-D2 closeout — friction-journal entry

Per §Drift-B narrow-scope methodology: chunk-closeout limits to chunk-grain reconciliation; arc-closure synthesis defers.

- [ ] **Step 1: Draft chunk-B5-3-D2 closeout entry at `docs/07_governance/friction-journal.md`.**

Newer-at-top ordering. Entry scope:

**Chunk-grain catches enumeration (11 catches at chunk B5-3-D2; #27 through #38; cumulative N=25 entering chunk → N=37 exiting):**

- Chunk-onset catches (#27-#33; 7 catches at scope-lock + plan doc draft grain): substantive grounds per session #1 onset triangulation
- Session #1 implementation catches (#34-#37; 4 catches at implementer-subagent grain + validation-gate-execution grain): substantive grounds per session #1 ship
- Catch #38 (chain-of-drift bilateral meta-grain; logged post-session-#1 ship at handoff-document review): substantive grounds per chain-of-drift propagation pattern from WSL-side commit/memory drift cascade through brainstorm-side handoff partial-correction

**Drift dispositions resolved at chunk-B5-3-D2 closeout:**

- (No new §Drift labels at this chunk; chunk-grain dispositions handled inline)
- B5-3-D1 header-comment aspirational withInvariants/ActionName drift: carry-forward to arc-closure retrospective per §Drift-B + δ-i (NOT amended at this chunk)
- New file headers at B5-3-D2 (8 new files including 2 routes + 2 views at session #2) do NOT replicate aspirational claim (drift disposition prophylactically applied)

**Sub-mechanism distribution post-chunk-B5-3-D2 (cumulative within-arc):**

- WSL-side projection-drift N=7 (#28 + #30 + #31 + #33 + #35 + #36 + #37); under-specification sub-cluster N=3 (#33 + #35 + #36); over-specification N=1 (#37); other N=3 (#28 + #30 + #31)
- WSL-side substrate-citation drift N=1 (#34)
- Brainstorm-side substrate-citation drift N=2 (#27 + #29)
- Brainstorm-side grain-discrimination scope-projection N=1 (#32)
- Chain-of-drift bilateral meta-grain N=1 (#38; NEW bucket at chunk-B5-3-D2)

**Cross-arc graduation triggers FIRED at chunk-B5-3-D2 (evaluation DEFERRED to Phase 5 arc-closure per §Drift-B):**

- (cadence-β-i-b) cross-arc N=2 FIRES at this chunk-close (B5-2 first-instance + B5-3-D2 second-instance) per candidate (e) graduation pathway
- (test-γ) within-arc N≥3 ratchet continues; grain definition clarification candidate remains open
- Chain-of-drift propagation pattern (NEW): meta-grain candidate codification at arc-closure

**Carry-forward inventory (B5-3-D2 SHIPPED → subsequent chunks + arc-closure):**

Active for subsequent-chunk firing (2 items; verified NOT-firing on B5-3-D2):
- FT1 (clampTtl NaN-guard) — defer to storage-substrate chunk
- Item 18 (org_settings substrate-floor) — defer per (orgset-β) sub-arc

Active for subsequent-chunk firing (1 NEW from chunk-B5-3-D2):
- D2.7 screenshot gate (γ) — fires at B5-3-D3 closeout (captures all 7 Phase A UI surfaces at single fixture state: 5 read-side from D2 + 2 write-side from D3)

Active for Phase 5 arc-closure retrospective (28 items; +1 new at chunk-B5-3-D2 closeout):
- Items 1-23 inherited from prior chunks + chunk-onset
- 24: ec-19.spec.ts pre-existing E2E failure (carry-forward observation)
- 25: accountLedgerService counting-grain ambiguity ((test-γ) instance)
- 26: cross-subagent-grain catch-grain axis recognition (session #1)
- 27: under-specification sub-pattern N=3 codification candidate (session #1)
- 28: chain-of-drift propagation pattern (NEW at chunk-B5-3-D2 closeout per catch #38; meta-grain candidate)

- [ ] **Step 2: Verify friction-journal entry against canonical template** (B5-3-D1 closeout entry at `docs/07_governance/friction-journal.md` precedent).

- [ ] **Step 3: Verify §Drift-B narrow-scope methodology compliance** — chunk-closeout entry limits to chunk-grain; arc-closure synthesis defers.

---

## Task 5: Push-readiness three-condition gate + chunk-grain push + Item 17 chunk-completion Stage 6

Per CLAUDE.md "Push readiness three-condition gate" convention.

- [ ] **Step 1: Condition 1 — Test-suite health.**

Verify: pnpm agent:validate 26/26 + pnpm test 816/816 at clean DB baseline + typecheck clean.

If accountLedgerService pollution flake fires, document as (a) mechanism (pollution-driven; cross-arc N evaluation deferred to arc-closure (test-γ)) + (b) fix shape (per-test-account isolation OR fresh-fixture setup; deferred) + (c) explicit carry-forward framing (arc-closure retrospective candidate). Condition 1 MET on acceptable baseline framing if documented.

- [ ] **Step 2: Condition 2 — Doc-sync reconciled.**

Per chunk-B5-3-D2 scope: no INV updates; no control_matrix updates; no ADR-0015 amendments (the apparent aspirational header drift in B5-3-D1 service files is carry-forward, not amendment). Doc-sync trivially MET (no new substrate at INV / control_matrix / ADR grain this chunk).

- [ ] **Step 3: Condition 3 — Governance closeout.**

Verify: friction-journal chunk-B5-3-D2 closeout entry shipped (Task 4 above). Push-readiness three-condition gate MET.

- [ ] **Step 4: Stage chunk-completion files + bundled commit.**

```
git status
```

Expected: 8 new files (2 routes + 2 views + 2 E2E tests + 2 plan docs) + 4 modified files (canvas integration extension) + 1 modified friction-journal entry.

Stage explicitly (do NOT include `.auth/` Playwright session state):

```
git add \
  apps/web/src/app/api/orgs/[orgId]/reports/payment-approval-queue/route.ts \
  apps/web/src/app/api/orgs/[orgId]/reports/paid-bills-history/route.ts \
  apps/web/src/components/canvas/PaymentApprovalQueueView.tsx \
  apps/web/src/components/canvas/PaidBillsHistoryView.tsx \
  apps/web/tests/e2e/paymentApprovalQueueView.spec.ts \
  apps/web/tests/e2e/paidBillsHistoryView.spec.ts \
  apps/web/src/shared/types/canvasDirective.ts \
  apps/web/src/components/bridge/MainframeRail.tsx \
  apps/web/src/components/bridge/ContextualCanvas.tsx \
  apps/web/src/agent/prompts/suffixes/canvasContextSuffix.ts \
  docs/09_briefs/phase-5/chunks/2026-05-11-phase-5-chunk-b5-3-d2-session-2.md \
  docs/07_governance/friction-journal.md
```

- [ ] **Step 5: Bundled commit per (γ-a) pattern + chunk-completion grain commit body.**

Commit message template:

```
feat(spend): chunk B5-3-D2 SHIPPED — AP read-side UI completion (2 of 5 views in session #2) + chunk closeout

Phase 5 chunk B5-3-D2 substantive session #2 + closeout ships remaining
2 read-side AP report UI canvas views (EC-A-6 payment approval queue +
EC-A-7 paid bills history) + canvas integration extension for 2 new
discriminator types + 2 Playwright E2E smoke tests + chunk-B5-3-D2
friction-journal closeout entry per §Drift-B narrow-scope methodology.

Chunk B5-3-D2 closes 5 of 5 v1-deliverable view UI surfaces shipped:
- EC-A-3 AP aging (session #1; commit e143792)
- EC-A-4 open bills (session #1; commit e143792)
- EC-A-5 vendor balance (session #1; commit e143792)
- EC-A-6 payment approval queue (session #2; this commit)
- EC-A-7 paid bills history (session #2; this commit)

EC-A-8 (δ) scope-removed per §11.5 Document-Platform ownership; Phase
6+ cross-phase dependency persists.

[Substantive grounds; validation; catches; sub-mechanism distribution;
arc-closure carry-forward inventory; etc. per established commit body
template.]

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
```

- [ ] **Step 6: Push to origin/staging.**

```
git push origin staging
```

Verify alignment 0/0 post-push.

- [ ] **Step 7: Item 17 chunk-completion Stage 6 — memory writes.**

Refresh pickup file at `~/.claude/projects/-home-philc-projects-chounting/memory/project_phase_5_spend_initiative_pending.md` to reflect chunk-B5-3-D2 SHIPPED state:
- Cumulative N=37 (including catch #38)
- WSL-side projection-drift sub-mechanism N=7 (correction from prior N=6 drift; per catch #38 chain-of-drift bilateral meta-grain disposition)
- 28 arc-closure retrospective candidates
- All cross-arc graduation watches updated
- Chunk B5-3-D2 SHIPPED; next chunk onset pending (B5-3-D3 write-side UI candidate territory)

Refresh MEMORY.md index entry accordingly.

---

## Operational hygiene notes for implementer subagents

Inherited from session #1 + prophylactic application per catches #34/#35/#36/#37 lessons. Brief recap:

- **Verify-from-disk discipline:** before citing any substrate (path, line number, type name, method signature, table column, schema field) in code OR comments OR commit body, verify against on-disk state. Brainstorm-side + WSL-side substrate-citation drifts caught at multiple grain-axes (catches #27 + #29 + #34 + #38 chain-of-drift); discipline applies at implementer-grain too.
- **Pattern inheritance:** mirror session #1 view components (ApAgingView, OpenBillsView, VendorBalanceView) as canonical precedent; mirror session #1 route templates; mirror session #1 E2E test shapes.
- **NO aspirational header claims:** new file top-of-file comments do NOT replicate aspirational `withInvariants(action: '<verb>.read')` claim from B5-3-D1 service file headers. Drift disposition: read-side routes do NOT wrap with `withInvariants()`; do NOT add ActionName entries.
- **Canvas integration 4-file touch-set:** ALWAYS extend all 4 files per catch #35 disposition (canvasDirective + MainframeRail + ContextualCanvas + canvasContextSuffix). The 4th file (canvasContextSuffix) is mandatory due to exhaustive switch with no default case.
- **Canvas view component imports:** `CanvasNavigateFn` from `@/shared/types/canvasDirective` + `SelectedEntity` from `@/shared/types/canvasContext` per catch #34 lesson. NOT `@/components/canvas/types` (nonexistent).
- **Reading B preservation:** all read-side surfaces in this session are READ-ONLY. No `journalEntryService.post()`; no INSERT/UPDATE/DELETE writes; no `recordMutation()` audit emission.
- **(γ-a) bundle pattern:** implementer subagents do NOT commit per-task; working tree accumulates; single bundled commit at session-close orchestrated by orchestrator (WSL-side).

---

**Chunk B5-3-D2 substantive session #2 ships remaining 2 of 5 v1-deliverable view UI surfaces + chunk-closeout artifacts (friction-journal entry + push-readiness gate + chunk-grain push + Item 17 chunk-completion Stage 6 memory writes). (cadence-β-i-b) 2-session bundled cadence closes. Phase A UI surface delivery completes at this chunk for read-side surfaces; B5-3-D3 ships write-side UI surfaces + screenshot gate (γ) firing.**
