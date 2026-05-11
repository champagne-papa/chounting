# Phase 5 Chunk B5-3-D1 Substantive Session #1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Land 3 AP read-side reporting views (EC-A-3 AP aging + EC-A-4 open bills + EC-A-5 vendor balance composition) data-side service surfaces + integration tests + Zod input schemas + unit tests in a single (γ-a) bundled commit per (cadence-β-i-a) 3-session split. Session #2 ships remaining 2 views (EC-A-6 + EC-A-7) + 3 EC-A-8 behavioral tests; session #3 ships closeout artifacts.

**Architecture:** Two service files (`vendorReportService.ts` + `apReportService.ts`) under `apps/web/src/services/spend/reports/` (new subfolder per D1.3 ratified directory structure; read-side surfaces structurally distinct from mutation services). `vendorReportService.balance(vendor_id)` (1 method this session) implements ADR-0015 §5 4-component vendor balance composition; `apReportService.aging()` + `apReportService.openBills()` (2 methods this session; +2 in session #2) implement EC-A-3 + EC-A-4. Two Zod input schemas (`aging.schema.ts` + `vendorBalance.schema.ts`) under `apps/web/src/shared/schemas/spend/reports/` (Layer-2 boundary). Three integration tests co-locate per-view + per-criterion tests (one file per view). Two unit tests cover Zod input schema boundaries. `open_AP` computation uses subquery/JOIN against `bill_payment_allocations` per catch #20 column-existence finding (`bills.amount_due` is NOT a literal column). Reading B preserved (no ledger writes; read-only surfaces).

**Tech Stack:** Postgres (Supabase), TypeScript, Zod, Vitest, Decimal.js (via money.schema).

**Locked-scope context** (chunk B5-3-D1 onset planning + D1.1–D1.6 substrate-decisions ratified 2026-05-10):

- **Cadence (D1.1):** (cadence-β-i-a) 3-session split — substantive #1 (this session) ships 3 views; substantive #2 ships 2 views + 3 EC-A-8 behavioral tests; closeout #3 ships friction-journal + catch #20 forward-pointer + carry-forward reconciliation
- **(test-γ) split (D1.2):** 5+4+3+3=15 tests across chunk (revised from initial 5+4+3+0=12 at scope-lock; checkpoint #1 review added `org_id` parameter to `openBills()` for pattern parity with `.aging()` + `.balance()`, widening chunk unit-test count from 0 → 3 — one unit test per Zod input schema); **session #1 ships 3 per-view + 3 per-criterion + 3 unit = 9 tests** (per-criterion test sub-shape uses 1-test-multi-assertion per AC-EC-A-3-1)
- **Service organization (D1.3):** entity-grain split — `vendorReportService.balance()` (ADR-0015 §5 canonical naming preserved) + consolidated `apReportService` (4 methods 1 file; 2 this session, 2 in session #2); service files under `apps/web/src/services/spend/reports/` subfolder per ratified directory structure
- **EC-A-8 placement (D1.4):** hybrid (a') — 3 behavioral integration tests at Spend-domain grain (NOT this session; ships session #2); no Spend-domain UI service surface
- **Vendors substrate (D1.5):** sufficient as-shipped at initial schema migration (`CREATE TABLE vendors` in initial schema); no extensions for D1 scope
- **Stage 6 (D1.6):** session-grain Stage 6 fires with substantive commit at session-close per Item 17 standing rule (session #1 commit + 2 memory writes at close)
- **Catch #20 (logged at chunk-onset; forward-pointer at D1 closeout session #3):** ADR-0015 §5 accrued_unbilled component has two-axis spec drift (bill-state filter "Posted/Posted (manual)" terminology vs canonical 7-state `bill_lifecycle_state` enum; `bill_lines.matched_to_vendor_invoice_at` column does NOT exist in v1 schema). **D1 operational disposition:** accrued_unbilled = 0 by construction in v1 per ADR-0015 §5 spec text; no implementation path opens
- **Reading B preservation (non-negotiable):** All view services are READ-ONLY; no `journalEntryService.post()` calls; no ledger writes
- **`bills.amount_due` is NOT a literal column** (catch #20 column-existence finding): `open_AP` MUST compute as `bills.amount_cad − COALESCE(SUM(bill_payment_allocations.amount_cad), 0)` (or equivalent subquery/JOIN); applies to EC-A-3 + EC-A-4 + EC-A-5 open_AP component

**Conditional dispositions ratified at scope-lock 2026-05-10:**

| Disposition | Ratification | Grounds |
|---|---|---|
| (a) EC-A-4 pagination | DEFER post-v1 | v1 scale doesn't require; reduces session #1 unit test count |
| (b) AC-EC-A-3-1 test sub-shape | 1 test with multi-assertion (4 boundary transitions) | Preserves D1.2 ratified per-criterion count framing |
| (c) `reports/` subfolder | YES (vs flat) | Read-side structurally distinct from mutation services; precedent for D2 + future reporting |

**Out of scope this session:**

- EC-A-6 payment approval queue + EC-A-7 paid bills history (session #2)
- EC-A-8 behavioral tests (3 tests; session #2)
- Closeout artifacts: friction-journal entry + catch #20 forward-pointer + carry-forward reconciliation (session #3)
- D2 UI screenshot-gated surfaces (deferred subsequent chunk per D1/D2 split)
- Item 18 org_settings substrate-floor (deferred per verify-from-disk gate)
- FT1 storage substrate touch (no storage substrate consumption)
- ADR-0015 §5 amendment (catch #20 formal disposition deferred to post-v1 accrual workflow chunk)
- Vendor credit lifecycle (deferred v1 per Spend brief §8.3; zero schema impact)
- Born-paid bundle (`post_bill_with_payment`) — Phase 8 per Spend brief §10
- `attach_payment_evidence` ProposedAttachment — Phase 6+ ingestion
- Pagination on `openBills()` (deferred post-v1 per conditional disposition (a))
- New mutations or migrations (read-only chunk; no substrate extension expected)

---

## Files

**Files to create:**

- `apps/web/src/services/spend/reports/vendorReportService.ts` — `vendorReportService.balance(vendor_id, ctx)` 1 method; ADR-0015 §5 4-component composition
- `apps/web/src/services/spend/reports/apReportService.ts` — `apReportService.aging(input, ctx)` + `apReportService.openBills(input, ctx)` (2 methods this session; +2 methods session #2 extending same file)
- `apps/web/src/shared/schemas/spend/reports/aging.schema.ts` — Zod input schema for EC-A-3 `aging()` (`org_id` + `as_of_date` optional ISO date) + TS types
- `apps/web/src/shared/schemas/spend/reports/vendorBalance.schema.ts` — Zod input schema for EC-A-5 `balance()` (`org_id` + `vendor_id` UUID) + TS types
- `apps/web/src/shared/schemas/spend/reports/openBills.schema.ts` — Zod input schema for EC-A-4 `openBills()` (`org_id` UUID) + TS types (added at checkpoint #1 review per founder verdict on pattern parity)
- `apps/web/tests/integration/apAging.test.ts` — per-view EC-A-3 happy path + per-criterion AC-EC-A-3-1 aging bucket boundary correctness (1 test with multi-assertion covering 4 boundaries per disposition (b))
- `apps/web/tests/integration/openBills.test.ts` — per-view EC-A-4 happy path + per-criterion AC-EC-A-4-1 lifecycle_state filter correctness
- `apps/web/tests/integration/vendorBalance.test.ts` — per-view EC-A-5 happy path + per-criterion AC-EC-A-5-1 4-component composition correctness
- `apps/web/tests/unit/agingSchema.test.ts` — Zod boundary unit test for `aging.schema.ts` (org_id required + UUID format; as_of_date parsing + default behavior)
- `apps/web/tests/unit/vendorBalanceSchema.test.ts` — Zod boundary unit test for `vendorBalance.schema.ts` (org_id + vendor_id required + UUID format)
- `apps/web/tests/unit/openBillsSchema.test.ts` — Zod boundary unit test for `openBills.schema.ts` (org_id required + UUID format)

**Files NOT touched (Reading B preservation + scope boundaries):**

- `apps/web/src/services/accounting/journalEntryService.ts` (read-side surfaces do NOT call ledger writes)
- `apps/web/src/services/spend/billService.ts` (B5-2 substrate; mutation surface; no overlap)
- `apps/web/src/services/spend/vendorPrepaymentService.ts` (B5-1 substrate; mutation surface; no overlap)
- `apps/web/src/services/spend/vendorPrepaymentStatus.ts` (B5-1 substrate)
- `apps/web/src/services/storage/providers/supabaseStorageProvider.ts` (FT1 deferred)
- `apps/web/src/services/audit/recordMutation.ts` (audit log writer; read surfaces do NOT emit mutation audit)
- `apps/web/src/shared/schemas/spend/bill.schema.ts` (B5-2 substrate)
- `apps/web/src/shared/schemas/spend/vendorPrepayment.schema.ts` (B5-1 substrate)
- `.claude/skills/integration-test-rules/SKILL.md` (B5-2 §3.1 + §3.2 substrate; no revision this chunk)
- All migration files (no schema changes this session)

**Files to modify:** None this session. (All write surfaces accumulate to session-close (γ-a) bundled commit; no per-task commits.)

---

## Task 1: Zod input schemas (2 files; Layer-2 boundary)

**Files:**
- Create: `apps/web/src/shared/schemas/spend/reports/aging.schema.ts`
- Create: `apps/web/src/shared/schemas/spend/reports/vendorBalance.schema.ts`

### Task 1a: aging.schema.ts

- [ ] **Step 1: Create file with Zod schema for EC-A-3 input.**

```typescript
import { z } from 'zod';

/**
 * AP aging view input schema.
 *
 * EC-A-3 acceptance criterion per Spend brief §11.4 row table.
 * Aging buckets are inline literals (current / 30 / 60 / 90+) per §11.4 row text;
 * no configurability (Item 18 deferred per chunk B5-3-D1 onset gate).
 */
export const apAgingInputSchema = z.object({
  as_of_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'as_of_date must be ISO date YYYY-MM-DD')
    .optional(),
});

export type ApAgingInput = z.infer<typeof apAgingInputSchema>;
```

- [ ] **Step 2: Verify the schema exports parse correctly via TypeScript compile.**

Run: `pnpm typecheck`
Expected: PASS

### Task 1b: vendorBalance.schema.ts

- [ ] **Step 1: Create file with Zod schema for EC-A-5 input.**

```typescript
import { z } from 'zod';

/**
 * Vendor balance view input schema.
 *
 * EC-A-5 acceptance criterion per Spend brief §11.4 row table;
 * 4-component composition spec at ADR-0015 §5.
 */
export const VendorBalanceInputSchema = z.object({
  org_id: z.string().uuid(),
  vendor_id: z.string().uuid(),
});

export type VendorBalanceInput = z.infer<typeof VendorBalanceInputSchema>;
export type VendorBalanceInputRaw = z.input<typeof VendorBalanceInputSchema>;
```

- [ ] **Step 2: Verify typecheck PASSES.**

Run: `pnpm typecheck`
Expected: PASS

### Task 1c: openBills.schema.ts

Added at checkpoint #1 review per founder verdict — `openBills()` takes `org_id` input for pattern parity with `.aging()` + `.balance()`; resolves catch #22 (orchestrator-dispatch-grain `ctx.caller.org_ids[0]` semantic-memory propagation) by widening service input surface to explicit org_id.

- [ ] **Step 1: Create file with Zod schema for EC-A-4 input.**

```typescript
import { z } from 'zod';

/**
 * Open bills view input schema.
 *
 * EC-A-4 acceptance criterion per Spend brief §11.4 row table.
 * Pagination DEFERRED post-v1 per conditional disposition (a);
 * v1 dataset size assumed bounded by org operating shape.
 */
export const OpenBillsInputSchema = z.object({
  org_id: z.string().uuid(),
});

export type OpenBillsInput = z.infer<typeof OpenBillsInputSchema>;
export type OpenBillsInputRaw = z.input<typeof OpenBillsInputSchema>;
```

- [ ] **Step 2: Verify typecheck PASSES.**

Run: `pnpm typecheck`
Expected: PASS

---

## Task 2: vendorReportService.ts (EC-A-5 vendor balance composition; 1 method)

**Files:**
- Create: `apps/web/src/services/spend/reports/vendorReportService.ts`

ADR-0015 §5 4-component vendor balance composition. Service surface canonical name `vendorReportService.balance(vendor_id, ctx)` preserved per ADR-0015 §5 spec text. Read-only; no ledger writes (Reading B preserved).

- [ ] **Step 1: Create file with `balance()` method.**

```typescript
import { type ServiceContext } from '@/services/shared/serviceContext';
import { withInvariants } from '@/services/shared/withInvariants';
import { vendorBalanceInputSchema, type VendorBalanceInput } from '@/shared/schemas/spend/reports/vendorBalance.schema';
import { type MoneyAmount, zeroMoney, addMoney, subtractMoney, toMoneyAmount } from '@/shared/schemas/money.schema';

/**
 * Vendor balance composition output per ADR-0015 §5.
 *
 * The result returns the 4 component sums, the net total, and the
 * as-of timestamp. Per ADR-0015 §5 canonical: v1 surfaces breakdown
 * (partial_balances); net_balance reserved for post-v1 dashboard.
 *
 * v1 component dispositions:
 * - open_AP: computed from bills + bill_payment_allocations subquery/JOIN
 *   (bills.amount_due is NOT a literal column per catch #20 column-existence finding)
 * - unapplied_vendor_credits: 0 by construction (vendor credits deferred per Spend brief §8.3)
 * - open_vendor_deposits_and_retainers: computed from vendor_prepayments minus vendor_prepayment_applications
 *   (negative contribution per ADR-0015 §5 spec)
 * - accrued_unbilled: 0 by construction (per catch #20; ADR-0015 §5 spec text explicit deferral
 *   "if Phase 5 ships before the accrual workflow lands, this component is zero by construction")
 */
export interface VendorBalanceOutput {
  vendor_id: string;
  partial_balances: {
    open_AP: MoneyAmount;
    unapplied_vendor_credits: MoneyAmount; // negative contribution; zero in v1
    open_vendor_deposits_and_retainers: MoneyAmount; // negative contribution
    accrued_unbilled: MoneyAmount; // zero in v1
  };
  net_balance: MoneyAmount;
  as_of: string; // ISO timestamp
}

export const vendorReportService = {
  async balance(
    input: VendorBalanceInput,
    ctx: ServiceContext
  ): Promise<VendorBalanceOutput> {
    return withInvariants(ctx, async (db) => {
      const parsed = vendorBalanceInputSchema.parse(input);

      // Component 1: open_AP via subquery/JOIN
      // bills.amount_cad MINUS SUM(bill_payment_allocations.amount_cad) per bill,
      // SUMMED across bills where vendor_id matches and lifecycle_state in committed states
      const { data: openApRows, error: openApErr } = await db.rpc(
        'compute_open_ap_by_vendor',
        { p_vendor_id: parsed.vendor_id, p_org_id: ctx.org_id }
      );
      if (openApErr) {
        throw new Error(`open_AP query failed: ${openApErr.message}`);
      }
      const open_AP = toMoneyAmount(openApRows?.[0]?.amount_cad ?? '0');

      // Component 2: unapplied_vendor_credits — 0 by construction (vendor credits deferred per §8.3)
      const unapplied_vendor_credits = zeroMoney();

      // Component 3: open_vendor_deposits_and_retainers
      // SUM(vendor_prepayments.amount_original) MINUS SUM(vendor_prepayment_applications.amount_original)
      // per vendor, where vendor_prepayments.status IN ('open', 'partially_applied')
      // Reported as NEGATIVE contribution (deposit reduces vendor balance)
      const { data: prepayRows, error: prepayErr } = await db.rpc(
        'compute_open_vendor_deposits',
        { p_vendor_id: parsed.vendor_id, p_org_id: ctx.org_id }
      );
      if (prepayErr) {
        throw new Error(`open_vendor_deposits query failed: ${prepayErr.message}`);
      }
      const deposits_positive = toMoneyAmount(prepayRows?.[0]?.amount_cad ?? '0');
      const open_vendor_deposits_and_retainers = subtractMoney(zeroMoney(), deposits_positive);

      // Component 4: accrued_unbilled — 0 by construction in v1 (per catch #20; ADR-0015 §5 spec)
      const accrued_unbilled = zeroMoney();

      // Net balance = open_AP + unapplied_vendor_credits + open_vendor_deposits_and_retainers + accrued_unbilled
      const net_balance = addMoney(
        addMoney(addMoney(open_AP, unapplied_vendor_credits), open_vendor_deposits_and_retainers),
        accrued_unbilled
      );

      return {
        vendor_id: parsed.vendor_id,
        partial_balances: {
          open_AP,
          unapplied_vendor_credits,
          open_vendor_deposits_and_retainers,
          accrued_unbilled,
        },
        net_balance,
        as_of: new Date().toISOString(),
      };
    });
  },
};
```

**Aggregation pattern: supabase-js JOIN-side (RATIFIED 2026-05-10 at scope-lock).** The placeholder `db.rpc(...)` calls above are PLACEHOLDERS for the canonical supabase-js JOIN-side pattern; replace with `db.from('table').select(...).eq(...)` chains + JS-side aggregation via `.reduce()`. Canonical reference: `apps/web/src/services/spend/billService.ts` INV-AP-001 enforcement (pattern: `.from('bill_payment_allocations').select('amount_cad').eq('bill_id', ...).eq('org_id', ...)` followed by JS `.reduce((s, a) => s + Number(a.amount_cad), 0)`). Substrate grounds: B5-1 + B5-2 precedent is unambiguous — Postgres RPCs reserved for atomicity-required writes (`journalEntryService.post` → `write_journal_entry_atomic`); reads use supabase-js fetch + JS aggregation. D1 is read-only with no atomicity requirement; no new RPCs needed; no migration this chunk; D1.5 clean-defer preserved. Apply same pattern across `vendorReportService.balance()` + `apReportService.aging()` + `apReportService.openBills()`.

- [ ] **Step 2: Run typecheck.**

Run: `pnpm typecheck`
Expected: PASS

---

## Task 3: apReportService.ts (EC-A-3 aging + EC-A-4 open bills; 2 methods this session)

**Files:**
- Create: `apps/web/src/services/spend/reports/apReportService.ts`

Consolidated apReportService per D1.3 ratification (4 methods, 1 file across chunk; 2 methods this session; +2 in session #2). Service-grain consolidation precedent per B5-1 `vendorPrepaymentService.ts` + B5-2 `billService.ts`.

- [ ] **Step 1: Create file with `aging()` + `openBills()` methods.**

```typescript
import { type ServiceContext } from '@/services/shared/serviceContext';
import { withInvariants } from '@/services/shared/withInvariants';
import { apAgingInputSchema, type ApAgingInput } from '@/shared/schemas/spend/reports/aging.schema';
import { type MoneyAmount, toMoneyAmount } from '@/shared/schemas/money.schema';

/**
 * AP aging output per EC-A-3 (Spend brief §11.4 row table).
 * Aging buckets are inline literals per §11.4 row text (current / 30 / 60 / 90+).
 */
export interface ApAgingBucket {
  bucket: 'current' | '30' | '60' | '90+';
  amount: MoneyAmount;
  bill_count: number;
}

export interface ApAgingOutput {
  as_of_date: string; // ISO date
  buckets: ApAgingBucket[];
  total: MoneyAmount;
}

/**
 * Open bills output per EC-A-4 (Spend brief §11.4 row table).
 * List form; pagination DEFERRED post-v1 per conditional disposition (a) at chunk B5-3-D1 onset.
 */
export interface OpenBillRow {
  bill_id: string;
  vendor_id: string;
  bill_number: string;
  due_date: string;
  amount_due: MoneyAmount; // computed = bills.amount_cad - SUM(bill_payment_allocations.amount_cad)
  lifecycle_state: 'approved_for_payment' | 'partially_paid';
}

export interface OpenBillsOutput {
  bills: OpenBillRow[];
  total_amount_due: MoneyAmount;
}

export const apReportService = {
  async aging(
    input: ApAgingInput,
    ctx: ServiceContext
  ): Promise<ApAgingOutput> {
    return withInvariants(ctx, async (db) => {
      const parsed = apAgingInputSchema.parse(input);
      const asOfDate = parsed.as_of_date ?? new Date().toISOString().slice(0, 10);

      // Filter bills.lifecycle_state IN ('approved_for_payment', 'partially_paid') per canonical 7-state
      // Compute per-bill amount_due via subquery/JOIN (bills.amount_due is NOT a literal column per catch #20)
      // Bucket by (asOfDate − due_date) into (current / 30 / 60 / 90+)
      // Return per-bucket aggregations + total

      // Implementation pattern: supabase-js query OR Postgres RPC (implementer decision at scope-lock;
      // brainstorm-side lean: supabase-js JOIN-side computation per lean-onset-substrate-surface).

      // PLACEHOLDER — implementer fills in concrete query per scope-lock decision:
      throw new Error('aging() implementation pending scope-lock decision (supabase-js JOIN vs RPC)');
    });
  },

  async openBills(
    input: OpenBillsInputRaw,
    ctx: ServiceContext
  ): Promise<OpenBillsOutput> {
    // Per checkpoint #1 review: openBills takes org_id input (pagination deferred per conditional disposition (a), but org_id required for pattern parity + cross-org access discipline)
    // Parse input via OpenBillsInputSchema; use parsed.org_id (NOT ctx.caller.org_ids[0])
    // Filter bills.lifecycle_state IN ('approved_for_payment', 'partially_paid')
    // Compute per-bill amount_due via subquery/JOIN per catch #20
    // Return list + total

    // PLACEHOLDER — implementer fills in concrete supabase-js JOIN-side query.
    throw new Error('openBills() implementation pending');
  },
};
```

**Implementation note:** apply the supabase-js JOIN-side pattern ratified in Task 2 (canonical reference: `apps/web/src/services/spend/billService.ts` INV-AP-001 enforcement; `.from('table').select(...).eq(...)` + JS `.reduce()` aggregation). Replace the `throw new Error(...)` placeholders with concrete supabase-js query chains + JS-side bucketing/aggregation logic.

- [ ] **Step 2: Run typecheck.**

Run: `pnpm typecheck`
Expected: PASS

---

## Task 4: Per-view + per-criterion integration tests (3 files; co-located)

Co-located shape: each integration test file contains the per-view happy-path test AND the per-criterion invariant test for that view. Reduces file fragmentation given lightweight per-criterion shape (1 test with multi-assertion per founder ratification (b)).

**Per-file structure:**
- per-view happy path: end-to-end exercise of the service surface returning expected shape
- per-criterion invariant test: specific invariant assertion for the EC-A-N acceptance criterion

### Task 4a: apAging.test.ts

**Files:**
- Create: `apps/web/tests/integration/apAging.test.ts`

- [ ] **Step 1: Per-view EC-A-3 happy path test.**

```typescript
it('aging() returns per-bucket aggregations + total for approved/partially_paid bills', async () => {
  // Setup: create 4 bills with due_dates spanning current / 30 / 60 / 90+ buckets
  // Setup: post payments against some to test mixed states
  // Execute: apReportService.aging({})
  // Verify: 4 buckets present; amounts match expected; total matches sum
});
```

- [ ] **Step 2: Per-criterion AC-EC-A-3-1 aging bucket boundary correctness (1 test, 4 sub-assertions).**

```typescript
it('aging buckets enforce boundary transitions at current/30/60/90+ thresholds', async () => {
  // Setup: bills with due_dates exactly at boundary (asOfDate − due_date = 0, 30, 60, 90 days)
  // Execute: apReportService.aging({ as_of_date: fixedDate })
  // Verify (4 sub-assertions in single test):
  //   - bill at 0 days overdue: bucket = 'current'
  //   - bill at 30 days overdue: bucket = '30'
  //   - bill at 60 days overdue: bucket = '60'
  //   - bill at 90 days overdue: bucket = '90+'
});
```

- [ ] **Step 3: Apply §3.1 + §3.2 test pollution disciplines** (per Item 20 SKILL.md):
  - beforeAll: per-run COA isolation with `T${traceId.slice(0,8)}_*` codes if any seeded accounts needed
  - afterAll: `void createdJeIds` (no DELETE on JE/JL; per §3.2)
  - Read-side filter on T-prefix if any test counts COA

- [ ] **Step 4: Run targeted test.**

Run: `pnpm vitest run tests/integration/apAging`
Expected: PASS

### Task 4b: openBills.test.ts

**Files:**
- Create: `apps/web/tests/integration/openBills.test.ts`

- [ ] **Step 1: Per-view EC-A-4 happy path test.**

```typescript
it('openBills() returns list of bills with amount_due > 0', async () => {
  // Setup: create bills in various lifecycle_states (draft, pending_approval, approved_for_payment, partially_paid, fully_paid, voided)
  // Execute: apReportService.openBills()
  // Verify: only approved_for_payment + partially_paid bills returned; total_amount_due matches sum
});
```

- [ ] **Step 2: Per-criterion AC-EC-A-4-1 lifecycle_state filter correctness.**

```typescript
it('openBills filter excludes non-committed, fully_paid, and terminal states', async () => {
  // Setup: bills across all 7 canonical states
  // Execute: apReportService.openBills()
  // Verify: returned bills.lifecycle_state IN ('approved_for_payment', 'partially_paid');
  //         draft / pending_approval / fully_paid / voided / cancelled excluded
});
```

- [ ] **Step 3: Apply §3.1 + §3.2 test pollution disciplines** (per Item 20 SKILL.md).

- [ ] **Step 4: Run targeted test.**

Run: `pnpm vitest run tests/integration/openBills`
Expected: PASS

### Task 4c: vendorBalance.test.ts

**Files:**
- Create: `apps/web/tests/integration/vendorBalance.test.ts`

- [ ] **Step 1: Per-view EC-A-5 happy path test.**

```typescript
it('balance() returns 4-component partial_balances + net_balance + as_of', async () => {
  // Setup: vendor with bills (some posted/partially-paid) + vendor_prepayments (some open/partially_applied)
  // Execute: vendorReportService.balance({ vendor_id })
  // Verify shape: { vendor_id, partial_balances: { open_AP, unapplied_vendor_credits, open_vendor_deposits_and_retainers, accrued_unbilled }, net_balance, as_of }
});
```

- [ ] **Step 2: Per-criterion AC-EC-A-5-1 4-component composition correctness.**

```typescript
it('balance() composition: open_AP positive + open_vendor_deposits_and_retainers negative + 2 components zero', async () => {
  // Setup: known-state vendor with:
  //   - 1 bill at approved_for_payment, amount $1000, no payments → open_AP = $1000
  //   - 1 vendor_prepayment at 'open', amount $500 → open_vendor_deposits_and_retainers = -$500
  // Execute: vendorReportService.balance({ vendor_id })
  // Verify (4-component sub-assertions):
  //   - partial_balances.open_AP = $1000
  //   - partial_balances.unapplied_vendor_credits = 0 (by construction in v1)
  //   - partial_balances.open_vendor_deposits_and_retainers = -$500
  //   - partial_balances.accrued_unbilled = 0 (by construction in v1)
  //   - net_balance = $1000 − $500 = $500
});
```

- [ ] **Step 3: Apply §3.1 + §3.2 test pollution disciplines** (per Item 20 SKILL.md).

- [ ] **Step 4: Run targeted test.**

Run: `pnpm vitest run tests/integration/vendorBalance`
Expected: PASS

---

## Task 5: Unit tests (2 files; Zod boundary)

### Task 5a: agingSchema.test.ts

**Files:**
- Create: `apps/web/tests/unit/agingSchema.test.ts`

- [ ] **Step 1: Unit test for aging.schema.ts boundary.**

```typescript
describe('apAgingInputSchema', () => {
  it('accepts valid ISO date for as_of_date', () => {
    expect(apAgingInputSchema.parse({ as_of_date: '2026-05-10' })).toEqual({ as_of_date: '2026-05-10' });
  });

  it('rejects non-ISO date format', () => {
    expect(() => apAgingInputSchema.parse({ as_of_date: '05/10/2026' })).toThrow();
  });

  it('accepts undefined as_of_date (defaults applied service-side)', () => {
    expect(apAgingInputSchema.parse({})).toEqual({});
  });

  it('rejects non-string as_of_date', () => {
    expect(() => apAgingInputSchema.parse({ as_of_date: 12345 })).toThrow();
  });
});
```

- [ ] **Step 2: Run targeted test.**

Run: `pnpm vitest run tests/unit/agingSchema`
Expected: PASS (4 test cases)

### Task 5c: openBillsSchema.test.ts

**Files:**
- Create: `apps/web/tests/unit/openBillsSchema.test.ts`

Mirror the Task 5a/5b pattern (4 test cases: accepts valid UUID + rejects non-UUID + rejects missing field + rejects null).

```typescript
describe('OpenBillsInputSchema', () => {
  it('accepts valid UUID for org_id', () => {
    const uuid = '11111111-2222-3333-4444-555555555555';
    expect(OpenBillsInputSchema.parse({ org_id: uuid })).toEqual({ org_id: uuid });
  });

  it('rejects non-UUID org_id', () => {
    expect(() => OpenBillsInputSchema.parse({ org_id: 'not-a-uuid' })).toThrow();
  });

  it('rejects missing org_id', () => {
    expect(() => OpenBillsInputSchema.parse({})).toThrow();
  });

  it('rejects null org_id', () => {
    expect(() => OpenBillsInputSchema.parse({ org_id: null })).toThrow();
  });
});
```

- [ ] **Step 2: Run targeted test.**

Run: `pnpm vitest run tests/unit/openBillsSchema`
Expected: PASS (4 test cases)

### Task 5b: vendorBalanceSchema.test.ts

**Files:**
- Create: `apps/web/tests/unit/vendorBalanceSchema.test.ts`

- [ ] **Step 1: Unit test for vendorBalance.schema.ts boundary.**

```typescript
describe('vendorBalanceInputSchema', () => {
  it('accepts valid UUID for vendor_id', () => {
    const uuid = '11111111-2222-3333-4444-555555555555';
    expect(vendorBalanceInputSchema.parse({ vendor_id: uuid })).toEqual({ vendor_id: uuid });
  });

  it('rejects non-UUID string', () => {
    expect(() => vendorBalanceInputSchema.parse({ vendor_id: 'not-a-uuid' })).toThrow();
  });

  it('rejects missing vendor_id', () => {
    expect(() => vendorBalanceInputSchema.parse({})).toThrow();
  });

  it('rejects null vendor_id', () => {
    expect(() => vendorBalanceInputSchema.parse({ vendor_id: null })).toThrow();
  });
});
```

- [ ] **Step 2: Run targeted test.**

Run: `pnpm vitest run tests/unit/vendorBalanceSchema`
Expected: PASS (4 test cases)

---

## Task 6: Verification + bundled commit at session-close per (γ-a)

Per (γ-a) bundle pattern: implementer subagents do NOT commit per-task; working tree accumulates. Single bundled commit at session-close.

- [ ] **Step 1: Run full validation.**

Run: `pnpm agent:validate`
Expected: 26/26 floor tests PASS + typecheck PASS + no-hardcoded-URLs PASS

- [ ] **Step 2: Run full vitest suite.**

Run: `pnpm test`
Expected: 777 prior + 8 new = 785/785 PASS

- [ ] **Step 3: Run targeted tests on session #1 surface.**

Run: `pnpm vitest run tests/integration/apAging tests/integration/openBills tests/integration/vendorBalance tests/unit/agingSchema tests/unit/vendorBalanceSchema`
Expected: 8 tests PASS

- [ ] **Step 4: Verify git state pre-commit.**

Run: `git status --short`
Expected: 9 new files staged (2 schemas + 2 services + 3 integration tests + 2 unit tests)

- [ ] **Step 5: Stage files explicitly (per safety discipline; no `git add -A`).**

```bash
git add .gitignore \
        apps/web/src/shared/schemas/spend/reports/aging.schema.ts \
        apps/web/src/shared/schemas/spend/reports/vendorBalance.schema.ts \
        apps/web/src/shared/schemas/spend/reports/openBills.schema.ts \
        apps/web/src/services/spend/reports/vendorReportService.ts \
        apps/web/src/services/spend/reports/apReportService.ts \
        apps/web/tests/integration/apAging.test.ts \
        apps/web/tests/integration/openBills.test.ts \
        apps/web/tests/integration/vendorBalance.test.ts \
        apps/web/tests/unit/agingSchema.test.ts \
        apps/web/tests/unit/vendorBalanceSchema.test.ts \
        apps/web/tests/unit/openBillsSchema.test.ts \
        docs/09_briefs/phase-5/chunks/2026-05-10-phase-5-chunk-b5-3-d1-session-1.md
```

- [ ] **Step 6: Bundled commit at session-close per (γ-a).**

Commit message shape (HEREDOC):

```
feat(spend): chunk B5-3-D1 substantive session #1 — AP read-side reporting (3 of 5 views) + 8 tests

3 views shipped this session under (cadence-β-i-a) 3-session split:
- EC-A-3 AP aging (apReportService.aging())
- EC-A-4 open bills (apReportService.openBills(); pagination deferred per (a))
- EC-A-5 vendor balance composition (vendorReportService.balance(); ADR-0015 §5)

Session #2 ships EC-A-6 + EC-A-7 + 3 EC-A-8 behavioral tests.
Session #3 ships closeout artifacts + catch #20 forward-pointer.

Files:
- 2 service files: vendorReportService.ts (1 method) + apReportService.ts (2 methods this session; 4 total at chunk-completion)
- 2 Zod schemas: aging.schema.ts (as_of_date) + vendorBalance.schema.ts (vendor_id)
- 3 integration tests (per-view + per-criterion co-located per file)
- 2 unit tests (Zod boundaries)

Substrate: read-only across bills + bill_payment_allocations + vendor_prepayments + vendor_prepayment_applications + vendors. No new tables, no new migrations, no new mutations.

Reading B preserved: all view services read-only; no journalEntryService calls.

Catch #20 operational note: open_AP computes via subquery/JOIN against bill_payment_allocations (bills.amount_due is NOT a literal column). accrued_unbilled = 0 by construction in v1 per ADR-0015 §5 spec. Formal disposition deferred to post-v1 accrual workflow chunk; forward-pointer at D1 closeout (session #3).

Validation: pnpm agent:validate 26/26 + pnpm test 785/785 + typecheck clean.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
```

- [ ] **Step 7: Verify post-commit clean state.**

Run: `git status --short && git log --oneline -1`
Expected: clean tree; new HEAD on staging.

- [ ] **Step 8: Stage 6 close per Item 17 (γ-a) session-grain bundle.**

Per Item 17 session-grain firing-shape: substantive commit (above) + 2 memory writes:
- Pickup file refresh: chunk B5-3-D1 session #1 SHIPPED state; session #2 pending
- MEMORY.md refresh: dense one-liner update

- [ ] **Step 9: Push session-grain per condition 1 (test-suite health) MET.**

Run: `git push origin staging`
Expected: clean push; branch alignment 0/0 post-push.

Per push-readiness three-condition gate: condition 1 (test-suite health) MET at session-grain push; conditions 2+3 accumulate to chunk-completion at session #3 closeout.

---

## Cluster B B1 dispatch shape (preventive verify-from-disk at scope-lock)

Per Cluster B B1 graduated discipline (N=19 cumulative entering D1; load-bearing), implementer should dispatch verify-from-disk subagent at scope-lock against:

1. `bill_payment_allocations` columns (B5-2 substrate; for amount_cad aggregation surface in open_AP computation)
2. `bills.lifecycle_state` enum values (canonical 7-state per D1 amendment; for EC-A-3 + EC-A-4 filters)
3. `vendor_prepayments` + `vendor_prepayment_applications` columns (B5-1 substrate; for open_vendor_deposits_and_retainers computation)
4. `vendors` table columns (for EC-A-5 display fields; D1.5 gate confirmed sufficient as-shipped)

Section-name citation preferred over line-number citation per founder's citation-shape preference at scope-lock dispatch (line numbers drift across file edits; section names robust).

Catch #20 forward-pointer reminder for implementer: `open_AP` MUST compute via subquery/JOIN; `bills.amount_due` is NOT a literal column. `accrued_unbilled` = 0 by construction in v1 (ADR-0015 §5 spec text). No implementation path opens for accrued_unbilled this chunk; component is hard-coded zero.

---

**End of Phase 5 Chunk B5-3-D1 Substantive Session #1 plan doc.**

Cross-arc graduation watches armed under session #1 ship:
- (cadence-β-i-a) N=1 → N=2 graduation evaluation fires per candidate (e) cross-arc pathway
- (test-γ) within-arc N=2 → N=3 ratchet (advancing toward within-arc N≥3 candidate (e) shape-refinement trigger; full evaluation at D1 closeout session #3)
- (cadence-β-i-b) stays at N=1 (B5-2 first-instance; not firing this chunk)

Process-overhead-vs-deliverable-velocity hypothesis tracking: D1 entering with lean-onset-substrate-surface (6 D1 dispositions vs B5-2's 12); 0 new Cluster B B1 catches surfaced at chunk-onset (cumulative N=19 unchanged). Session #1 catch yield observable at session-close; correlate at chunk B5-3 arc-closure retrospective per Surface 6 observation framework (variables: onset substrate-surface size + chunk-grain catch yield).
