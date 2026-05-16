# Phase 5 Chunk B5-3-D2 Substantive Session #1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship 3 read-side AP report UI canvas views (EC-A-3 AP aging + EC-A-5 vendor balance + EC-A-4 open bills) + new `vendorService.ts` with `listVendors()` method + Zod input schemas + 1 unit test + 3 Playwright E2E smoke tests per (cadence-β-i-b) 2-session bundled cadence ratified at chunk B5-3-D2 onset. Session #1 ships 3 of 5 v1-deliverable view UI surfaces (EC-A-3 + EC-A-5 + EC-A-4); session #2 ships remaining 2 (EC-A-6 payment approval queue + EC-A-7 paid bills history) + closeout artifacts.

**Architecture:** Canvas-only view shape (Q1 ratification: no page route shells). 3 new canvas view components under `apps/web/src/components/canvas/` consume 4 new API routes: 3 read-side report routes under `apps/web/src/app/api/orgs/[orgId]/reports/` (ap-aging + open-bills + vendor-balance) + 1 vendors list route under `apps/web/src/app/api/orgs/[orgId]/vendors/` (Q2 ratification: sibling to reports/). New `vendorService.ts` ships listVendors method per EC-A-5 Path (Y) ratification (Two Laws Law 1 dispositive — no inline route DB access). Pattern (b) Canvas view + API route per D2.2 ratification: route calls service, view client-fetches via `useEffect` + `fetch()`. All routes read-only — no `withInvariants()` wrapping per service-architecture skill §2 canonical (drift disposition: new file headers do NOT replicate aspirational wrapping claim from B5-3-D1 apReportService.ts + vendorReportService.ts headers).

**Canvas integration extension (disposition (A) auto-resolve at session #1 implementer-grain):** 3 coordinated substrate touches required for new views to mount via existing canvas-directive flow + Playwright E2E trigger pattern (`page.getByTitle('...').click()` per `apps/web/tests/e2e/fixtures/journalEntry.ts:15-17`). Each view's task extends 3 files at the per-view grain (canvasDirective.ts discriminator + MainframeRail.tsx ICONS entry/handleClick switch + ContextualCanvas.tsx renderDirective switch case) per established trial-balance/journal-entry-list/recurring-template-list precedent. New discriminator types named per `report_*` convention parity: `report_ap_aging` + `report_open_bills` + `report_vendor_balance`.

**Tech Stack:** Next.js App Router, React 18+ (`'use client'` canvas components), TypeScript, Zod (Layer 2 boundary validation), Vitest (unit test), Playwright (E2E smoke tests), supabase-js (DB access via adminClient), Decimal.js (via money.schema for MoneyAmount).

**Locked-scope context** (chunk B5-3-D2 onset + session #1 ratifications 2026-05-11):

- **D2.1 cadence:** (cadence-β-i-b) 2-session bundled — session #1 ships 3 views; session #2 ships 2 views + closeout
- **D2.2 data-fetching:** Pattern (b) Canvas view + API route per trial-balance/route.ts canonical
- **D2.3 UI organization:** Canvas-view-driven — 3 view components in `/components/canvas/` + 4 API routes
- **D2.4 vendor_id handling:** Native `<select>`; VendorPicker abstraction DEFERRED to B5-3-D3 write-side UI chunk
- **D2.5 filter UI:** Native HTML (`<input type="date">` + `<select>`) per BasicTrialBalanceView precedent
- **D2.6 test architecture:** Playwright E2E grain (smoke render + click + table-shape assertion); SKIP component-grain unit tests v1; new test-grain distinct from B5-3-D1 Vitest integration grain
- **D2.7 screenshot gate:** (γ) DEFERRED to B5-3-D3 closeout (captures all 7 Phase A UI surfaces together at single fixture state)
- **D2.8 EC-A-8:** (δ) scope-removal symmetry preserved per §11.5 Document-Platform ownership
- **Session-allocation:** session #1 = EC-A-3 + EC-A-5 + EC-A-4 (substrate-novelty-clustering); session #2 = EC-A-6 + EC-A-7 + closeout
- **EC-A-5 vendor-selector substrate:** Path (Y) new `vendorService.ts` with `listVendors()` method (Two Laws Law 1 dispositive)
- **Q1 page route shell:** (i) Canvas-only — NO page route shells at `/[locale]/[orgId]/reports/`; views mount via agent canvas integration
- **Q2 vendor list endpoint:** (a) `/api/orgs/[orgId]/vendors/route.ts` (sibling to reports/) — reusable by B5-3-D3 consumers
- **Canvas integration disposition (A):** auto-resolve at session #1 implementer-grain per pattern parity with existing canvas views; 3 coordinated file modifications at `canvasDirective.ts` + `MainframeRail.tsx` + `ContextualCanvas.tsx`; new discriminator types `report_ap_aging` + `report_open_bills` + `report_vendor_balance` per `report_*` convention parity; each view's task extends all 3 files at per-view grain (working tree accumulates via (γ-a) bundle pattern)
- **Drift disposition:** new file headers do NOT replicate aspirational `withInvariants(action: '<verb>.read')` claim from B5-3-D1 apReportService.ts + vendorReportService.ts headers (N=10+ mentions across 2 files; arc-closure retrospective carry-forward per §Drift-B + δ-i)

**Patterns inherited from chunk B5-3-D1 + accounting-domain Pattern (b) (substrate-grounded against HEAD `9aafabe`):**

- **trial-balance/route.ts canonical route shape** (`apps/web/src/app/api/orgs/[orgId]/reports/trial-balance/route.ts:1-37`):
  - 5-line header comment: file path + GET description + "No withInvariants — reads call service directly per CLAUDE.md Rule 2"
  - 5-import block: NextResponse + service + buildServiceContext + ServiceError + serviceErrorToStatus
  - GET function: extract orgId from params + extract query params + buildServiceContext + service call + NextResponse.json
  - try/catch with ServiceError → serviceErrorToStatus mapping; generic 500 fallback
- **vendorReportService.ts read-side service shape** (`apps/web/src/services/spend/reports/vendorReportService.ts:1-100`):
  - Pattern B unwrapped functions exported as service object
  - Top-of-file comment shape: path + phase context + use-case spec + mirror pattern + disposition + Reading B preservation + INV-SERVICE-001/002 contract + ServiceErrorCode usage note
  - Import block: adminClient + ServiceContext + loggerWith + ServiceError + schema + money helpers (where applicable)
  - Function body: parse input via schema → adminClient queries → JS aggregation → return result; try/catch with `ServiceError('READ_FAILED', msg)` on Zod ValidationError
- **BasicTrialBalanceView dual useEffect + native filter UI** (`apps/web/src/components/canvas/BasicTrialBalanceView.tsx:1-178`):
  - Props: `{ orgId, onNavigate, onSelectEntity? }`
  - State: `useState<T | null>(null)` for primary data; `useState<T[]>([])` for filter options; loading/error state
  - useEffect cancellation guard: `let cancelled = false; ... if (!cancelled) ...; return () => { cancelled = true; }`
  - Native `<select>` filter UI with className conventions
  - Table render: raw HTML `<table>` + semantic `<thead>/<tbody>/<tfoot>`; `text-xs uppercase tracking-wide text-neutral-500` headers; `font-mono` numeric columns
  - Loading/empty/error stencil: `<div className="text-sm text-neutral-400">Loading...</div>` / `<div className="text-sm text-red-500">{error}</div>` / `<div className="text-sm text-neutral-400">No data.</div>`
- **supabase-js JOIN-side aggregation** (per B5-3-D1 D1.3 ratification): `.from().select().eq()` + JS `.reduce()`; no Postgres RPCs except atomicity-required writes
- **adminClient discipline (INV-SERVICE-002):** all DB access via `@/db/adminClient`
- **Zod boundary validation (Layer 2):** service re-validates input via `schema.parse(input)`; throw `ServiceError('READ_FAILED', msg)` on ValidationError
- **ServiceContext + trace_id propagation:** `buildServiceContext(req)` at route grain produces `{ trace_id, caller: { user_id, email, verified, org_ids }, locale? }`
- **READ-only discipline:** no `journalEntryService.post()` calls; no INSERT/UPDATE writes; no `recordMutation` audits; Reading B preserved by construction
- **ServiceError READ_FAILED:** generic read-side error code per billService.ts / vendorReportService.ts precedent

**Out of scope this session:**

- **EC-A-6 payment approval queue + EC-A-7 paid bills history** — session #2 territory
- **Closeout artifacts** — session #2 absorbs per (cadence-β-i-b) 2-session bundled cadence: friction-journal entry + push-readiness three-condition gate + chunk-grain push + (cadence-β-i-b) within-arc N=2 graduation evaluation
- **Page route shells** at `/[locale]/[orgId]/reports/...` — Q1 (i) canvas-only ratified
- **VendorPicker UI abstraction** — D2.4 deferred to B5-3-D3 write-side UI chunk
- **Manual bill form + payment approval card UI** — B5-3-D3 candidate territory
- **Screenshot gate firing** — D2.7 (γ) deferred to B5-3-D3 closeout
- **Item 18 org_settings substrate-floor** — preserved-deferred; not firing on canvas-only read-side views
- **FT1 clampTtl NaN-guard** — preserved-deferred; no storage substrate consumption in this session
- **New mutations or migrations** — read-only session per Reading B preservation
- **New ActionName entries in `ACTION_NAMES` array** — read-side routes don't wrap with `withInvariants()` per service-architecture skill §2 canonical; no permission-key migration this session
- **vendorReportService.ts header drift correction** — arc-closure retrospective carry-forward per §Drift-B + δ-i; this session does NOT amend B5-3-D1 closed substrate
- **vendor.list / ap_aging.read / open_bills.read / vendor_balance.read as ActionName entries** — drift disposition: aspirational claim in B5-3-D1 headers; this session's new routes do NOT add these

---

## Files

**Files to create (13):**

Service layer (3):
- `apps/web/src/services/spend/vendorService.ts` — new service file; exports `vendorService` object with `listVendors({ org_id }, ctx)` method returning `{ vendors: VendorListRow[] }`
- `apps/web/src/shared/schemas/spend/listVendors.schema.ts` — Zod input schema (`org_id` UUID only) + InputRaw / Input / Output TS types
- `apps/web/tests/unit/listVendorsSchema.test.ts` — Vitest unit test for Zod boundary parse + invalid org_id rejection

API routes (4):
- `apps/web/src/app/api/orgs/[orgId]/vendors/route.ts` — GET vendors list (consumes `vendorService.listVendors`)
- `apps/web/src/app/api/orgs/[orgId]/reports/ap-aging/route.ts` — GET EC-A-3 (consumes `apReportService.aging`; optional `?as_of_date=YYYY-MM-DD` query)
- `apps/web/src/app/api/orgs/[orgId]/reports/open-bills/route.ts` — GET EC-A-4 (consumes `apReportService.openBills`)
- `apps/web/src/app/api/orgs/[orgId]/reports/vendor-balance/route.ts` — GET EC-A-5 (consumes `vendorReportService.balance`; required `?vendor_id=UUID` query)

Canvas view components (3):
- `apps/web/src/components/canvas/ApAgingView.tsx` — EC-A-3 canvas view (`'use client'`; native `<input type="date">` for as_of_date filter; 4-bucket aging table + total row)
- `apps/web/src/components/canvas/OpenBillsView.tsx` — EC-A-4 canvas view (`'use client'`; bills list table; no filter UI in v1)
- `apps/web/src/components/canvas/VendorBalanceView.tsx` — EC-A-5 canvas view (`'use client'`; dual fetch: vendors list + balance for selected vendor; native `<select>` vendor picker; 4-component balance display)

Playwright E2E tests (3):
- `apps/web/tests/e2e/apAgingView.spec.ts` — smoke render + filter interaction + table-shape assertion
- `apps/web/tests/e2e/openBillsView.spec.ts` — smoke render + table-shape assertion
- `apps/web/tests/e2e/vendorBalanceView.spec.ts` — smoke render + vendor select + balance display + 4-component shape assertion

**Files to modify (3 — canvas integration extension; verified-from-disk at plan-doc-draft grain):**

- `apps/web/src/shared/types/canvasDirective.ts` — extend `CanvasDirective` discriminated union type with 3 new discriminator types: `{ type: 'report_ap_aging'; orgId: string }` + `{ type: 'report_open_bills'; orgId: string }` + `{ type: 'report_vendor_balance'; orgId: string }`. Insert at the existing `report_*` cluster (lines 14-18) per naming convention parity with `report_pl` / `report_trial_balance` / `report_balance_sheet` / `report_account_ledger` / `report_accounts_by_type`. NOT in the Phase 2+ placeholder cluster (lines 35-39 — `ap_queue` / `vendor_detail` / `ar_aging` are different semantic discriminators retained as Phase 2+ deferred slots).
- `apps/web/src/components/bridge/MainframeRail.tsx` — extend `ICONS` array (lines 23-29) with 3 new entries (`{ id: 'ap_aging', label: 'AP Aging', icon: '...' }` + similar for `open_bills` + `vendor_balance`); extend `handleClick` switch (lines 35+) with 3 new cases calling `onNavigate({ type: 'report_ap_aging' | 'report_open_bills' | 'report_vendor_balance', orgId })`. Icon glyphs at implementer-subagent discretion per existing precedent (single-char unicode emoji).
- `apps/web/src/components/bridge/ContextualCanvas.tsx` — extend `renderDirective` switch (lines 120-200) with 3 new cases mounting the 3 new view components: `case 'report_ap_aging': return <ApAgingView orgId={d.orgId} onNavigate={onNavigate} />;` + similar for `report_open_bills` / `report_vendor_balance`. Insert at the existing `report_*` case cluster per parity. Imports for `ApAgingView` / `OpenBillsView` / `VendorBalanceView` added at top of file.

Each view's task (Task 2 / Task 3 / Task 4) extends these 3 files at per-view grain. Working tree accumulates per (γ-a) bundle pattern; single bundled commit at session-close coalesces all 9 modifications (3 discriminators + 3 ICONS entries + 3 handleClick cases + 3 renderDirective cases).

**Files NOT touched (preservation):**

B5-3-D1 substrate (closed; preserved):
- `apps/web/src/services/spend/reports/apReportService.ts` — read-side service consumed; not modified
- `apps/web/src/services/spend/reports/vendorReportService.ts` — read-side service consumed; not modified
- `apps/web/src/shared/schemas/spend/reports/{aging,openBills,vendorBalance,paymentApprovalQueue,paidBillsHistory}.schema.ts` — B5-3-D1 schemas; consumed via service signatures
- `apps/web/tests/integration/{apAging,openBills,vendorBalance,paymentApprovalQueue,paidBillsHistory}.test.ts` — B5-3-D1 integration tests
- `apps/web/tests/unit/{aging,openBills,vendorBalance,paymentApprovalQueue,paidBillsHistory}Schema.test.ts` — B5-3-D1 unit tests

Mutation substrate (B5-1 + B5-2; preserved):
- `apps/web/src/services/spend/vendorPrepaymentService.ts` (B5-1)
- `apps/web/src/services/spend/billService.ts` (B5-2)
- `apps/web/src/services/accounting/journalEntryService.ts` (Reading B preservation)

Other (preserved):
- All migration files (`supabase/migrations/*.sql`) — no schema changes; vendors table already shipped
- All `.claude/skills/*/SKILL.md` files — service-architecture canonical; no skill amendments this session
- All ADRs — no architectural amendments this session
- `.gitignore` — no scope changes
- `package.json` — no new dependencies
- `apps/web/eslint.config.mjs` — no rule changes
- `CLAUDE.md` — no convention amendments this session

**Files to modify (governance):** None this session. Friction-journal entry + chunk-grain push fire at session #2 closeout per (cadence-β-i-b) cadence shape.

---

## Task 1: vendorService.ts substrate foundation

Pattern parity with `vendorReportService.ts` (B5-3-D1 read-side service precedent). New file under existing `apps/web/src/services/spend/` directory (sibling to `vendorPrepaymentService.ts` and `billService.ts`; sibling to `reports/` subfolder). `listVendors` is NOT a report — it's a general-entity-list method; thus lives at `services/spend/vendorService.ts` (not `services/spend/reports/`).

### Task 1a: listVendors.schema.ts Zod schema

**Files:**
- Create: `apps/web/src/shared/schemas/spend/listVendors.schema.ts`

- [ ] **Step 1: Create file with Zod schema for listVendors input.**

```typescript
// src/shared/schemas/spend/listVendors.schema.ts
//
// Layer-2 boundary schema for vendorService.listVendors (Phase 5 chunk
// B5-3-D2 session #1; EC-A-5 vendor-selector substrate per Path (Y)
// ratification). Single required org_id UUID filter; returns vendor list
// for UI dropdown consumers (EC-A-5 vendor balance view at this chunk
// grain; B5-3-D3 manual bill form + payment approval card downstream).

import { z } from 'zod';

export const ListVendorsInputSchema = z.object({
  org_id: z.string().uuid(),
});

export type ListVendorsInputRaw = z.input<typeof ListVendorsInputSchema>;
export type ListVendorsInput = z.output<typeof ListVendorsInputSchema>;

export interface VendorListRow {
  vendor_id: string;
  name: string;
  is_active: boolean;
}

export interface ListVendorsOutput {
  vendors: VendorListRow[];
}
```

### Task 1b: vendorService.ts with listVendors method

**Files:**
- Create: `apps/web/src/services/spend/vendorService.ts`

- [ ] **Step 1: Create vendorService.ts following vendorReportService.ts structural template.**

```typescript
// src/services/spend/vendorService.ts
//
// Phase 5 chunk B5-3-D2 substantive session #1: general-entity vendor list
// service per EC-A-5 Path (Y) ratification (Two Laws Law 1 dispositive:
// all DB access through src/services/; route handlers must not query
// vendors table directly).
//
// Mirror pattern: vendorReportService.ts (B5-3-D1) for structural
// discipline (imports, ServiceContext, adminClient, ServiceError,
// loggerWith, plain unwrapped functions exported as service object).
//
// Reading B preservation (ADR-0011 §1, ADR-0007 §Tier 2): READ-ONLY.
// No journalEntryService.post(); no INSERT/UPDATE; no recordMutation.
//
// INV-SERVICE-001 export contract (structural): plain unwrapped function
// (Pattern B). Route handlers do NOT wrap via withInvariants() — read
// functions are intentionally not wrapped per service-architecture skill
// §2 canonical; authorization via RLS on vendors table (vendors_select
// policy gates by user_has_org_access(org_id)).
// INV-SERVICE-002 adminClient discipline: all DB access via adminClient.
//
// ServiceErrorCode usage: generic 'READ_FAILED' per vendorReportService
// precedent; rich discriminator message text carries specifics.
//
// Consumer surface: EC-A-5 vendor balance view (this chunk) + B5-3-D3
// manual bill form + payment approval card (downstream). Centralized
// vendor-list pattern eliminates substrate-fragmentation across 3
// consumers (per chunk B5-3-D2 onset Path (X) vs (Y) substantive
// disposition).

import { adminClient } from '@/db/adminClient';
import type { ServiceContext } from '@/services/middleware/serviceContext';
import { loggerWith } from '@/shared/logger/pino';
import { ServiceError } from '@/services/errors/ServiceError';
import {
  ListVendorsInputSchema,
  type ListVendorsInput,
  type ListVendorsInputRaw,
  type ListVendorsOutput,
} from '@/shared/schemas/spend/listVendors.schema';

async function listVendors(
  input: ListVendorsInputRaw,
  ctx: ServiceContext,
): Promise<ListVendorsOutput> {
  let parsed: ListVendorsInput;
  try {
    parsed = ListVendorsInputSchema.parse(input);
  } catch (err) {
    if (err instanceof Error) {
      throw new ServiceError(
        'READ_FAILED',
        `list_vendors input validation failed: ${err.message}`,
      );
    }
    throw err;
  }

  const log = loggerWith({
    trace_id: ctx.trace_id,
    user_id: ctx.caller.user_id,
  });

  const db = adminClient();
  const { data, error } = await db
    .from('vendors')
    .select('vendor_id, name, is_active')
    .eq('org_id', parsed.org_id)
    .order('name', { ascending: true });

  if (error) {
    log.error({ err: error.message }, 'list_vendors query failed');
    throw new ServiceError(
      'READ_FAILED',
      `list_vendors query failed: ${error.message}`,
    );
  }

  return {
    vendors: (data ?? []).map((row) => ({
      vendor_id: row.vendor_id,
      name: row.name,
      is_active: row.is_active,
    })),
  };
}

export const vendorService = {
  listVendors,
};
```

### Task 1c: listVendorsSchema.test.ts unit test

**Files:**
- Create: `apps/web/tests/unit/listVendorsSchema.test.ts`

- [ ] **Step 1: Create Vitest unit test for Zod boundary.**

Pattern parity with `apps/web/tests/unit/openBillsSchema.test.ts` (B5-3-D1 minimal `{ org_id }` schema precedent). Test cases: (1) valid org_id parses; (2) missing org_id rejects; (3) non-UUID org_id rejects.

```typescript
// src/tests/unit/listVendorsSchema.test.ts
//
// Vitest unit test for ListVendorsInputSchema Zod boundary
// (Phase 5 chunk B5-3-D2 session #1; vendorService.listVendors input).

import { describe, it, expect } from 'vitest';
import { ListVendorsInputSchema } from '@/shared/schemas/spend/listVendors.schema';

describe('ListVendorsInputSchema', () => {
  it('accepts valid org_id UUID', () => {
    const result = ListVendorsInputSchema.safeParse({
      org_id: '00000000-0000-4000-8000-000000000001',
    });
    expect(result.success).toBe(true);
  });

  it('rejects missing org_id', () => {
    const result = ListVendorsInputSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it('rejects non-UUID org_id', () => {
    const result = ListVendorsInputSchema.safeParse({
      org_id: 'not-a-uuid',
    });
    expect(result.success).toBe(false);
  });

  it('rejects null org_id', () => {
    const result = ListVendorsInputSchema.safeParse({ org_id: null });
    expect(result.success).toBe(false);
  });
});
```

- [ ] **Step 2: Run Vitest unit test.**

```
pnpm test apps/web/tests/unit/listVendorsSchema.test.ts
```

Expected: 4/4 tests pass.

---

## Task 2: EC-A-3 AP aging view (API route + canvas component + E2E test)

### Task 2a: ap-aging/route.ts API route

**Files:**
- Create: `apps/web/src/app/api/orgs/[orgId]/reports/ap-aging/route.ts`

Pattern parity with `apps/web/src/app/api/orgs/[orgId]/reports/trial-balance/route.ts:1-37`. Header comment matches canonical 3-line shape: file path + GET description + "No withInvariants — reads call service directly per CLAUDE.md Rule 2."

- [ ] **Step 1: Create route file.**

```typescript
// src/app/api/orgs/[orgId]/reports/ap-aging/route.ts
// GET — AP aging report with 4-bucket breakdown (current / 30 / 60 / 90+).
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
    const url = new URL(req.url);
    const asOfDate = url.searchParams.get('as_of_date') ?? undefined;
    const ctx = await buildServiceContext(req);
    const result = await apReportService.aging(
      { org_id: orgId, as_of_date: asOfDate },
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

### Task 2b: ApAgingView.tsx canvas component

**Files:**
- Create: `apps/web/src/components/canvas/ApAgingView.tsx`

Pattern parity with `BasicTrialBalanceView.tsx` (B5-3-D1 era precedent for canvas view with native filter UI). Dual useEffect not needed (no separate filter-options fetch — `as_of_date` is freely-entered date input, not a fetched list).

- [ ] **Step 1: Create canvas view component.**

```typescript
// src/components/canvas/ApAgingView.tsx
'use client';
//
// EC-A-3 AP aging canvas view (Phase 5 chunk B5-3-D2 session #1).
// Consumes /api/orgs/[orgId]/reports/ap-aging via client-side fetch
// per Pattern (b) ratification. 4-bucket aging breakdown with optional
// as_of_date filter (defaults to today server-side if omitted).

import { useEffect, useState } from 'react';
import type { CanvasNavigateFn, SelectedEntity } from '@/components/canvas/types';
import type { ApAgingOutput } from '@/services/spend/reports/apReportService';

export interface ApAgingViewProps {
  orgId: string;
  onNavigate: CanvasNavigateFn;
  onSelectEntity?: (entity: SelectedEntity) => void;
}

export function ApAgingView({ orgId }: ApAgingViewProps) {
  const [data, setData] = useState<ApAgingOutput | null>(null);
  const [asOfDate, setAsOfDate] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    const url = asOfDate
      ? `/api/orgs/${orgId}/reports/ap-aging?as_of_date=${asOfDate}`
      : `/api/orgs/${orgId}/reports/ap-aging`;

    fetch(url)
      .then(async (r) => {
        if (!r.ok) {
          const body = await r.json().catch(() => ({}));
          throw new Error(body.error || 'Failed to load AP aging');
        }
        return r.json();
      })
      .then((data: ApAgingOutput) => {
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
  }, [orgId, asOfDate]);

  return (
    <div className="p-6">
      <h2 className="text-lg font-semibold mb-4">AP Aging</h2>

      <div className="mb-6">
        <label className="block text-xs text-neutral-500 mb-1">As of date</label>
        <input
          type="date"
          value={asOfDate ?? ''}
          onChange={(e) => setAsOfDate(e.target.value || undefined)}
          className="border border-neutral-300 rounded px-2 py-1 text-sm"
        />
      </div>

      {loading && <div className="text-sm text-neutral-400">Loading...</div>}
      {error && <div className="text-sm text-red-500">{error}</div>}
      {!loading && !error && data && (
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs uppercase tracking-wide text-neutral-500 border-b border-neutral-200">
              <th className="py-2 pr-4 text-left">Bucket</th>
              <th className="py-2 pr-4 text-right">Bill count</th>
              <th className="py-2 pr-4 text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {data.buckets.map((b) => (
              <tr key={b.bucket} className="border-b border-neutral-100">
                <td className="py-2 pr-4">{b.bucket}</td>
                <td className="py-2 pr-4 text-right">{b.bill_count}</td>
                <td className="py-2 pr-4 text-right font-mono">{b.amount}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="font-semibold border-t-2 border-neutral-300">
              <td className="py-2 pr-4">Total</td>
              <td className="py-2 pr-4"></td>
              <td className="py-2 pr-4 text-right font-mono">{data.total}</td>
            </tr>
          </tfoot>
        </table>
      )}
    </div>
  );
}
```

NOTE: `ApAgingOutput` type import path verify against actual export from `apReportService.ts`. If type is not re-exported, inline the shape OR add export at the consumed end. Implementer subagent: verify import shape; if type isn't exported at the cited path, surface for adjustment before substantive work fires.

### Task 2c: Canvas integration extension for report_ap_aging

**Files:**
- Modify: `apps/web/src/shared/types/canvasDirective.ts` — add discriminator type
- Modify: `apps/web/src/components/bridge/MainframeRail.tsx` — extend ICONS array + handleClick switch
- Modify: `apps/web/src/components/bridge/ContextualCanvas.tsx` — extend renderDirective switch + import

- [ ] **Step 1: Extend canvasDirective.ts.**

Insert new discriminator at the `report_*` cluster (after `report_accounts_by_type` at line ~18):

```typescript
| { type: 'report_ap_aging'; orgId: string }
```

- [ ] **Step 2: Extend MainframeRail.tsx ICONS array + handleClick switch.**

Add new entry to ICONS array (after `actions` at line ~28):

```typescript
{ id: 'ap_aging', label: 'AP Aging', icon: '\u{1F4B0}' },
```

(Implementer-subagent discretion on icon glyph; unicode emoji per existing pattern.)

Add new case to handleClick switch:

```typescript
case 'ap_aging':
  return onNavigate({ type: 'report_ap_aging', orgId });
```

- [ ] **Step 3: Extend ContextualCanvas.tsx renderDirective switch + import.**

Add import at top of file:

```typescript
import { ApAgingView } from '@/components/canvas/ApAgingView';
```

Add new case to renderDirective switch (within the `report_*` cluster, after `report_accounts_by_type`):

```typescript
case 'report_ap_aging':
  return <ApAgingView orgId={d.orgId} onNavigate={onNavigate} onSelectEntity={onSelectEntity} />;
```

### Task 2d: apAgingView.spec.ts Playwright E2E

**Files:**
- Create: `apps/web/tests/e2e/apAgingView.spec.ts`

Pattern parity with `apps/web/tests/e2e/fixtures/journalEntry.ts` canvas-mounting trigger. Use `page.getByTitle('AP Aging').click()` after navigating to org root to trigger canvas-directive mounting.

- [ ] **Step 1: Create E2E test file.**

Smoke assertions:
1. Navigate to org root + click "AP Aging" MainframeRail button
2. AP aging view renders (assert `<h2>AP Aging</h2>` visible via `page.getByRole('heading', { name: /ap aging/i })`)
3. Table renders with 4 buckets + total row (assert table structure visible)
4. Date filter interaction: enter date → table re-renders (assert refetch fires; can verify via network request or via filter input value reflection)
5. Empty state if applicable (org with no bills → "No data" or zero-bucket rows)

Reference pattern: `apps/web/tests/e2e/fixtures/journalEntry.ts:15-17` for navigation helper shape.

- [ ] **Step 2: Run Playwright E2E test.**

```
pnpm test:e2e apps/web/tests/e2e/apAgingView.spec.ts
```

Expected: smoke assertions pass.

---

## Task 3: EC-A-4 Open bills view (API route + canvas component + E2E test)

### Task 3a: open-bills/route.ts API route

**Files:**
- Create: `apps/web/src/app/api/orgs/[orgId]/reports/open-bills/route.ts`

Pattern parity with Task 2a + trial-balance/route.ts canonical. No optional query parameters (input is `{ org_id }` only per `apReportService.openBills` signature).

- [ ] **Step 1: Create route file.**

Same structural shape as Task 2a. Service call: `apReportService.openBills({ org_id: orgId }, ctx)`.

### Task 3b: OpenBillsView.tsx canvas component

**Files:**
- Create: `apps/web/src/components/canvas/OpenBillsView.tsx`

Pattern parity with `ApAgingView.tsx`. Differences:
- No filter UI (no optional input fields on openBills service signature)
- Single useEffect (fetch on mount + orgId change only)
- Table columns: bill_number / vendor_id / due_date / lifecycle_state / amount_due
- Display total at footer: total_amount_due

- [ ] **Step 1: Create canvas view component following Task 2b shape with OpenBillsOutput consumption.**

### Task 3c: Canvas integration extension for report_open_bills

**Files:**
- Modify: `apps/web/src/shared/types/canvasDirective.ts` — add discriminator type
- Modify: `apps/web/src/components/bridge/MainframeRail.tsx` — extend ICONS array + handleClick switch
- Modify: `apps/web/src/components/bridge/ContextualCanvas.tsx` — extend renderDirective switch + import

Pattern parity with Task 2c. Add:
- canvasDirective.ts: `| { type: 'report_open_bills'; orgId: string }`
- MainframeRail.tsx ICONS: `{ id: 'open_bills', label: 'Open Bills', icon: '\u{1F4DD}' }` + handleClick case
- ContextualCanvas.tsx: import OpenBillsView + renderDirective case mounting `<OpenBillsView orgId={d.orgId} onNavigate={onNavigate} onSelectEntity={onSelectEntity} />`

### Task 3d: openBillsView.spec.ts Playwright E2E

**Files:**
- Create: `apps/web/tests/e2e/openBillsView.spec.ts`

Pattern parity with Task 2d. Use `page.getByTitle('Open Bills').click()` canvas-mounting trigger. Smoke assertions:
1. Navigate to org root + click "Open Bills" MainframeRail button
2. Open bills view renders (assert `<h2>Open Bills</h2>` visible)
3. Table renders with bill rows + total row
4. Empty state: org with no open bills → "No data" stencil

```
pnpm test:e2e apps/web/tests/e2e/openBillsView.spec.ts
```

---

## Task 4: EC-A-5 Vendor balance view (API routes + canvas component + E2E test)

This task is substantively novel — first consumer of `vendorService.listVendors()` (Task 1 substrate) + first 2-service-composition canvas view in B5-3-D2.

### Task 4a: vendors/route.ts API route

**Files:**
- Create: `apps/web/src/app/api/orgs/[orgId]/vendors/route.ts`

Sibling to `reports/` per Q2 ratification (general-entity endpoint; reusable by B5-3-D3 consumers). Pattern parity with Task 2a header + structure. Service call: `vendorService.listVendors({ org_id: orgId }, ctx)`.

- [ ] **Step 1: Create route file.**

```typescript
// src/app/api/orgs/[orgId]/vendors/route.ts
// GET — Vendor list for org (used by EC-A-5 vendor balance view selector
// + B5-3-D3 manual bill form + payment approval card downstream consumers).
// No withInvariants — reads call service directly per CLAUDE.md Rule 2.

import { NextResponse } from 'next/server';
import { vendorService } from '@/services/spend/vendorService';
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
    const result = await vendorService.listVendors({ org_id: orgId }, ctx);
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

### Task 4b: vendor-balance/route.ts API route

**Files:**
- Create: `apps/web/src/app/api/orgs/[orgId]/reports/vendor-balance/route.ts`

Pattern parity with Task 2a. Required `?vendor_id=UUID` query parameter (vendor balance is per-vendor, not org-aggregate). Service call: `vendorReportService.balance({ org_id: orgId, vendor_id }, ctx)`.

- [ ] **Step 1: Create route file with vendor_id required query parsing.**

If `vendor_id` query param is missing or non-UUID, return 400 via `ServiceError('READ_FAILED', '...')` from service (which validates via Zod) — the service handles validation; route just passes through.

### Task 4c: VendorBalanceView.tsx canvas component

**Files:**
- Create: `apps/web/src/components/canvas/VendorBalanceView.tsx`

Substantively novel — dual fetch composition:
1. Mount: fetch `/api/orgs/${orgId}/vendors` → populate vendor `<select>` options
2. On vendor selection: fetch `/api/orgs/${orgId}/reports/vendor-balance?vendor_id=${selectedVendorId}` → display 4-component balance + net_balance + as_of

Default vendor selection: none on mount (empty `<select value="">`); user picks from dropdown to trigger balance fetch.

- [ ] **Step 1: Create canvas view component with dual fetch pattern.**

Two `useState` slots: `vendors` (list for `<select>`) + `balance` (VendorBalanceOutput | null for current selection). Two `useEffect` blocks: (1) fetch vendors on mount + orgId change; (2) fetch balance on vendor selection change. Cancellation guard on both per BasicTrialBalanceView precedent.

Render:
- `<h2>Vendor Balance</h2>`
- Native `<select>` with vendors list; empty option "Select a vendor..."
- If no vendor selected: empty-state message
- If vendor selected: 4-component balance display:
  - open_AP (positive)
  - unapplied_vendor_credits (zero by construction in v1)
  - open_vendor_deposits_and_retainers (negative contribution per ADR-0015 §5)
  - accrued_unbilled (zero by construction in v1 per catch #20)
  - Net balance (sum of 4 components; computed by service)
- As-of timestamp display

NOTE: `VendorBalanceOutput` type import path verify against actual export from `vendorReportService.ts`. Implementer subagent: verify import shape; if type isn't exported at cited path, surface for adjustment.

### Task 4d: Canvas integration extension for report_vendor_balance

**Files:**
- Modify: `apps/web/src/shared/types/canvasDirective.ts` — add discriminator type
- Modify: `apps/web/src/components/bridge/MainframeRail.tsx` — extend ICONS array + handleClick switch
- Modify: `apps/web/src/components/bridge/ContextualCanvas.tsx` — extend renderDirective switch + import

Pattern parity with Task 2c. Add:
- canvasDirective.ts: `| { type: 'report_vendor_balance'; orgId: string }`
- MainframeRail.tsx ICONS: `{ id: 'vendor_balance', label: 'Vendor Balance', icon: '\u{1F4B5}' }` + handleClick case
- ContextualCanvas.tsx: import VendorBalanceView + renderDirective case mounting `<VendorBalanceView orgId={d.orgId} onNavigate={onNavigate} onSelectEntity={onSelectEntity} />`

### Task 4e: vendorBalanceView.spec.ts Playwright E2E

**Files:**
- Create: `apps/web/tests/e2e/vendorBalanceView.spec.ts`

Pattern parity with Task 2d. Use `page.getByTitle('Vendor Balance').click()` canvas-mounting trigger. Smoke assertions:
1. Navigate to org root + click "Vendor Balance" MainframeRail button
2. Vendor balance view renders (assert `<h2>Vendor Balance</h2>` visible)
3. Vendor dropdown populates from /api/orgs/[orgId]/vendors response (assert options count > 0 OR empty-state message if test org has no vendors)
4. Select vendor → balance fetch fires → 4-component shape renders
5. Empty state: no vendor selected → "Select a vendor..." message

```
pnpm test:e2e apps/web/tests/e2e/vendorBalanceView.spec.ts
```

---

## Task 5: Validation gate

- [ ] **Step 1: Type check.**

```
pnpm typecheck
```

Expected: green.

- [ ] **Step 2: Full Vitest suite.**

```
pnpm test
```

Expected: all prior tests pass + new listVendorsSchema test (4 new tests) → cumulative 816/816 at clean DB baseline.

- [ ] **Step 3: Playwright E2E.**

```
pnpm test:e2e
```

Expected: existing E2E tests pass + 3 new view E2E tests pass.

- [ ] **Step 4: agent:validate.**

```
pnpm agent:validate
```

Expected: 26/26 green (typecheck + no-hardcoded-URLs grep + Category A floor tests).

- [ ] **Step 5: Manual smoke (optional — founder discretion).**

Local dev server + manual canvas trigger of each new view. Founder discretion on whether to manually smoke at session #1 close or defer to D2.7 screenshot-gate firing at session #2 closeout.

---

## Task 6: Session #1 close (Item 17 session-grain Stage 6)

Per Item 17 graduated standing rule: session-grain Stage 6 fires WITH substantive commit. (γ-a) bundle pattern: implementer subagents do NOT commit per-task; working-tree accumulates; single bundled commit at session-close.

- [ ] **Step 1: Verify working tree state.**

```
git status
git diff --stat
```

Expected: ~13 new files + 0-2 modified files (canvas integration if needed).

- [ ] **Step 2: Stage all session #1 files.**

```
git add apps/web/src/services/spend/vendorService.ts
git add apps/web/src/shared/schemas/spend/listVendors.schema.ts
git add apps/web/src/app/api/orgs/[orgId]/vendors/route.ts
git add apps/web/src/app/api/orgs/[orgId]/reports/ap-aging/route.ts
git add apps/web/src/app/api/orgs/[orgId]/reports/open-bills/route.ts
git add apps/web/src/app/api/orgs/[orgId]/reports/vendor-balance/route.ts
git add apps/web/src/components/canvas/ApAgingView.tsx
git add apps/web/src/components/canvas/OpenBillsView.tsx
git add apps/web/src/components/canvas/VendorBalanceView.tsx
git add apps/web/tests/unit/listVendorsSchema.test.ts
git add apps/web/tests/e2e/apAgingView.spec.ts
git add apps/web/tests/e2e/openBillsView.spec.ts
git add apps/web/tests/e2e/vendorBalanceView.spec.ts
# + any canvas integration modifications
```

- [ ] **Step 3: Single bundled commit per (γ-a) pattern.**

Commit message template:

```
feat(spend): chunk B5-3-D2 substantive session #1 — AP read-side UI (3 of 5 views) + new vendorService

Phase 5 chunk B5-3-D2 substantive session #1 ships 3 read-side AP report
UI canvas views (EC-A-3 AP aging + EC-A-5 vendor balance + EC-A-4 open
bills) + new vendorService.ts with listVendors method per EC-A-5 Path (Y)
ratification (Two Laws Law 1 dispositive). Pattern (b) Canvas view + API
route per D2.2 + canvas-only Q1 ratification (no page route shells). 4
new API routes (3 reports/ + 1 vendors sibling). 1 new service file +
1 new Zod schema + 1 unit test + 3 Playwright E2E smoke tests.

Architecture:
- vendorService.ts: Pattern B unwrapped function; adminClient discipline;
  Zod boundary validation; ServiceError READ_FAILED; reads called
  directly from route handlers per service-architecture skill §2 canonical
- 4 API routes: 3-line header per trial-balance/route.ts canonical; no
  withInvariants wrapping; new file headers do NOT replicate aspirational
  withInvariants/ActionName claim from B5-3-D1 service file headers
  (drift carry-forward to arc-closure per §Drift-B + δ-i)
- 3 canvas view components: 'use client'; useState + useEffect with
  cancellation guard per BasicTrialBalanceView precedent; raw HTML
  <table> + native filter UI; raw money/date string display + font-mono
  numerics
- Playwright E2E: smoke render + interaction + table-shape assertions
  per D2.6 ratification (skip component-grain unit tests v1)

Reading B preservation: all 4 routes + 1 service are READ-ONLY; no JE
writes; no recordMutation; Reading B preserved by construction.

Item 17 session-grain Stage 6 fires with this commit (bundled (γ-a)
pattern); pickup file + MEMORY.md refresh follow.

Session #2 ships EC-A-6 + EC-A-7 + closeout per (cadence-β-i-b) cadence.
```

- [ ] **Step 4: Push to origin/staging.**

```
git push origin staging
```

- [ ] **Step 5: Item 17 session-grain Stage 6 memory writes.**

Refresh:
1. Pickup file at `~/.claude/projects/-home-philc-projects-chounting/memory/project_phase_5_spend_initiative_pending.md` — reflect session #1 SHIPPED state with HEAD anchor; carry-forward inventory updated
2. MEMORY.md index entry — same refresh

---

## Operational hygiene notes for implementer subagents

- **Verify-from-disk discipline:** before citing any substrate (path, line number, type name, method signature, table column, schema field) in code OR comments, verify against on-disk state. Brainstorm-side semantic-memory drift caught at orchestrator-grain has been observable pattern (chunk B5-3-D2 onset catches #27 + #29); discipline applies at implementer-grain too.
- **Pattern inheritance:** when in doubt, mirror existing precedent (trial-balance/route.ts for routes; BasicTrialBalanceView.tsx for canvas views; vendorReportService.ts for read-side service shape). Do NOT invent new shapes mid-implementation; surface for orchestrator triangulation.
- **No aspirational header claims:** new file top-of-file comments do NOT replicate the aspirational `withInvariants(action: '<verb>.read')` claim from B5-3-D1 apReportService.ts + vendorReportService.ts headers. Drift disposition: read-side routes do NOT wrap with `withInvariants()`; do NOT add ActionName entries; do NOT cite a wrap-action in route headers.
- **Reading B preservation:** all read-side surfaces in this session are READ-ONLY. No `journalEntryService.post()` calls; no INSERT/UPDATE/DELETE writes; no `recordMutation()` audit emission; no closeable-fixture-state mutations.
- **Drift discipline applied prophylactically:** verify against canonical sources at write-time; don't project counts/sequences/forbidden-lists from memory in code OR comments OR commit messages.

---

**Chunk B5-3-D2 substantive session #1 ships 3 of 5 v1-deliverable read-side AP report UI views + new vendor list service substrate. (cadence-β-i-b) 2-session cadence; session #2 ships remaining 2 views + closeout artifacts. Phase A UI surface delivery continues at session #2 + B5-3-D3 (write-side UI surfaces).**
