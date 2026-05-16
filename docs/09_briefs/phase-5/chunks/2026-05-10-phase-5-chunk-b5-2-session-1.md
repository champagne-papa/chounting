# Phase 5 Chunk B5-2 Substantive Session #1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Land Slice A (bill lifecycle) substrate + 4 mutations + 7 tests in a single (γ-a) bundled commit per (cadence-β-i-b) 2-session bundled cadence. Closeout artifacts (friction-journal entry + Spend brief amendment + open_questions.md Q-entry + CURRENT_STATE.md update + carry-forward reconciliation) ship at session #2.

**Architecture:** A single SQL migration creates the `payment_method` closed enum + `bill_payment_allocations` table (net-new) + column extensions on `bills` / `bill_lines` / `payments` (verified-from-disk gaps per audit), all per ADR-0010 reserved-enum-states discipline. A TypeScript Zod schema file (`bill.schema.ts`) establishes the Layer-2 boundary. Four mutation handlers in `billService.ts` encapsulate Slice A (`post_bill` / `approve_bill_for_payment` / `record_bill_payment` / `reverse_bill`); each routes through `journalEntryService.post()` for ledger writes (Reading B preservation), with `reverse_bill` calling `post()` with `reverses_journal_entry_id` input per Sub-E. Six integration tests + one unit test cover the (test-γ) hybrid asymmetric split (4 per-mutation + 2 per-criterion + 1 unit).

**Tech Stack:** Postgres (Supabase), TypeScript, Zod, Vitest, Decimal.js (via money.schema).

**Locked-scope context** (chunk B5-2 onset planning + audit-grounded re-ratification per founder bundled-accept 2026-05-10):

- **Cadence:** (cadence-β-i-b) 2-session bundled — substrate+mutations+tests bundled (this session); closeout artifacts at session #2
- **D1:** `bill_lifecycle_state` enum canonical = ADR-0015 + B5-1 migration 7-state (`draft`, `pending_approval`, `approved_for_payment`, `partially_paid`, `fully_paid`, `voided`, `cancelled`); already shipped at `20240138000000`. Spend brief amendment lands at session #2 closeout
- **D2:** `post_bill` specification projected from EC-A-1 inference + Spend brief framing; new Q-number entry in `open_questions.md` preserves underspec for post-v1 ADR formalization (lands at session #2)
- **D3:** `post_bill` approval gate = Always Confirm v1 per Spend brief §9 line 225
- **D4 + Sub-E + Integration 1+2:** `reverse_bill` thin wrapper calls `journalEntryService.post(input_with_reverses_journal_entry_id, ctx)` with caller-provided `reversal_reason` (per INV-REVERSAL-002); operation-order atomicity (state update AFTER `post()` succeeds); emits `bill_reversed` audit at bill grain via `recordMutation`
- **D5:** INV-AP-001 (allocation sums ≤ bill amount) + INV-AP-002 (state-transition path enforcement) activate at Layer 2 service in this chunk; pattern parity with INV-MONEY-001 (B5-1)
- **D6:** (test-γ) split = 4 per-mutation + 2 per-criterion (EC-A-1 + EC-A-2) + 1 unit = 7 tests; asymmetric per `approve_bill_for_payment` state-only
- **D7:** (cadence-β-i-b) first-instance at cadence-shape grain
- **Sub-D:** `reverse_bill` target = `voided` (canonical 7-state enum; D1 honored)
- **Sub-F:** Leave legacy `bills.status` text column untouched (no current readers per audit grep); defer cleanup
- **Sub-G:** Column extension list (audit-refined): bills += `payment_terms_days`, `purchase_order_id`, `tax_amount_total`; bill_lines += `tax_code_id`, `line_number`; payments += `payment_method`, `vendor_id`, `applied_to`, `reference_number`
- **Sub-H:** RESOLVED — no money column type mismatch (entire spend domain uses `numeric(20,4)` uniformly per audit; money.schema handles cast at service boundary)
- **Sub-I:** `bill_payment_allocations` is genuinely net-new (semantically distinct from `vendor_prepayment_applications`: payments→bills cardinality vs prepayments→bills cardinality)
- **Sub-J:** Atomicity follows B5-1 vendor_prepayment precedent (sequential service-layer calls; no new RPC); JE+JE-audit atomicity preserved by `write_journal_entry_atomic`; bill-grain audit emits separately via `recordMutation`
- **Sub-K:** `payment_method` enum membership: v1-active = `check`, `eft`, `wire`, `cash`, `other`; reserved = `credit_card`, `ach`, `bank_transfer`, `money_order`; Layer-1 CHECK restricts to v1-active subset
- **Sub-L:** `payments.amount` stays CAD-implicit for v1; column COMMENT documents deferral; service-layer enforces `bill.currency = 'CAD'` precondition for `record_bill_payment`; multi-currency triad deferred to post-v1
- **Sub-M:** Defer `bill_lines.fx_rate` column; rely on parent `bill.fx_rate` for currency conversion; multi-currency-per-line deferred to post-v1
- **Shape (i) for post_bill:** `post_bill` posts JE + sets `bills.lifecycle_state = 'pending_approval'`. Then `approve_bill_for_payment` transitions `pending_approval → approved_for_payment`. The "posting" moment is at `post_bill` (JE posted), not at `approve_bill_for_payment` (which is state-only)
- **Item 18 / FT1:** Neither fires this chunk (no `org_settings.*` consumption; no direct `storageProviderService` touch)
- **Reading B preservation (non-negotiable):** All bill mutations route through `journalEntryService.post()` for ledger writes; `approve_bill_for_payment` is state-only (no JE)

**Out of scope this session:**

- Closeout artifacts (friction-journal entry + Spend brief amendment + open_questions.md Q-entry + CURRENT_STATE.md update + carry-forward reconciliation) — session #2
- Slice C (vendor credit lifecycle) — separate chunk
- Slice D (vendor onboarding; Q50 unresolved) — separate chunk
- Slice F (born-paid bundle; Phase 8) — separate chunk
- Slice S7 (payment failure reversal Q78) — separate chunk
- Slice S6 (receipt v1 path Q74; depends on Router/Classifier) — separate chunk
- Slice H (AP read-side reporting views) — separate chunk
- AR invoices, multi-currency, multi-entity intercompany — post-v1 per Spend brief §15
- Item 18 org_settings sub-arc (S3 prerequisite)
- FT1 storage substrate touch
- Drop `bills.status` legacy text column (Sub-F (i) leaves it; defer cleanup)
- Add `bill_lines.fx_rate` (Sub-M defer)
- Add `payments.amount_original` / `amount_cad` / `fx_rate` triad (Sub-L defer)

---

## Files

**Files to create:**

- `supabase/migrations/20240139000000_phase5_bill_lifecycle_substrate.sql` — schema migration (single file per (mig-α))
- `apps/web/src/shared/schemas/spend/bill.schema.ts` — Zod schemas + TS types (Layer-2 boundary)
- `apps/web/src/services/spend/billService.ts` — 4 mutation handlers
- `apps/web/tests/integration/billPostBill.test.ts` — per-mutation: post_bill happy path + preconditions
- `apps/web/tests/integration/billApproveForPayment.test.ts` — per-mutation: approve_bill_for_payment state transition + preconditions
- `apps/web/tests/integration/billRecordPayment.test.ts` — per-mutation: record_bill_payment + allocations + status update
- `apps/web/tests/integration/billReverse.test.ts` — per-mutation: reverse_bill thin wrapper + EC-A-2 mirror invariants
- `apps/web/tests/integration/billEcA1.test.ts` — per-criterion: EC-A-1 full invariant exercise via post_bill + record_bill_payment
- `apps/web/tests/integration/billEcA2.test.ts` — per-criterion: EC-A-2 full invariant exercise via reverse_bill (mirror semantics)
- `apps/web/tests/unit/billSchema.test.ts` — Zod schema boundary unit test

**Files NOT touched (Reading B preservation; surface for next chunks/sessions):**

- `apps/web/src/services/accounting/journalEntryService.ts` (sole writer of journal_entries; called by bill mutations)
- `apps/web/src/services/spend/vendorPrepaymentService.ts` (B5-1 substrate; no overlap with bill lifecycle)
- `apps/web/src/services/spend/vendorPrepaymentStatus.ts` (B5-1 substrate)
- `apps/web/src/services/storage/providers/supabaseStorageProvider.ts` (FT1 deferred)
- `apps/web/src/services/audit/recordMutation.ts` (audit log writer; called by bill mutations; FT3 RESOLVED at B5-1)
- `apps/web/src/shared/schemas/spend/vendorPrepayment.schema.ts` (B5-1 substrate)
- Any other domain service or schema file outside `spend/`
- `bills.status` legacy text column (Sub-F (i) leaves untouched)

**Files to modify:** None this session. (Spend brief amendment / `open_questions.md` Q-entry / `CURRENT_STATE.md` update all defer to session #2 closeout per locked scope.)

---

## Task 1: Schema migration (single file per (mig-α))

**Context:** B5-1 already shipped `bill_lifecycle_state` enum (lines 111-119 of `20240138000000`) + `bills.lifecycle_state` column (lines 170-172). This migration adds the column extensions + new table + new enum that B5-1 deferred. Pattern mirror: `20240138000000_phase5_vendor_prepayment_substrate.sql` for closed enums, table CREATE, Layer-1 CHECK constraints, indexes, RLS policies.

**Files:**
- Create: `supabase/migrations/20240139000000_phase5_bill_lifecycle_substrate.sql`

- [ ] **Step 1: Create migration file with header block**

```sql
-- Phase 5 chunk B5-2 substantive session #1: bill lifecycle substrate
--
-- Per ADR-0015 §1 + §10 (bill lifecycle scope) and Spend brief §3.1
-- (mutation lifecycle table) + §5 (data model) + §11.1-11.3 (EC-A-1/2
-- + INV-AP-001/002 reserved invariants).
--
-- Locked scope (chunk B5-2 onset planning + 12-disposition substantive
-- surfacing per founder bundled-accept 2026-05-10):
--   - 4 mutations: post_bill, approve_bill_for_payment, record_bill_payment, reverse_bill
--   - 2 new tables: bill_payment_allocations (net-new); bill_lines column extensions only
--   - payment_method closed enum (v1 active: check/eft/wire/cash/other; reserved: credit_card/ach/bank_transfer/money_order)
--   - bills/bill_lines/payments column extensions per Sub-G ratified list
--   - INV-AP-001 + INV-AP-002 activation at Layer 2 service (D5)
--   - Reading B preservation (non-negotiable)
--   - bills.status legacy text column LEFT UNTOUCHED per Sub-F (i)
--   - bills/bill_lines/payments money columns stay numeric per Sub-H/L/M
--
-- Cross-references:
--   - bill_lifecycle_state enum + bills.lifecycle_state column shipped
--     at chunk B5-1 migration 20240138000000 lines 111-119, 170-172.
--     Reused as canonical per D1.
--   - vendor_prepayment_applications (B5-1) is semantically distinct
--     from bill_payment_allocations (this migration) per Sub-I.
```

- [ ] **Step 2: Add `payment_method` closed enum**

Per Sub-K membership; ADR-0010 reserved-enum-states discipline.

```sql
-- payment_method per Sub-K (v1 active: check/eft/wire/cash/other;
-- reserved: credit_card/ach/bank_transfer/money_order)
CREATE TYPE payment_method AS ENUM (
  -- v1 active subset
  'check',
  'eft',
  'wire',
  'cash',
  'other',
  -- Reserved (post-v1 method expansion)
  'credit_card',
  'ach',
  'bank_transfer',
  'money_order'
);
```

- [ ] **Step 3: Extend `bills` table**

Per Sub-G column list. Note: `purchase_order_id` ships nullable WITHOUT FK (purchase_orders table doesn't exist; Phase F deferral per Spend brief §15).

```sql
ALTER TABLE bills
  ADD COLUMN payment_terms_days int,
  ADD COLUMN purchase_order_id uuid,  -- nullable; no FK (Phase F deferral)
  ADD COLUMN tax_amount_total numeric(20,4) NOT NULL DEFAULT 0,
  ADD COLUMN posted_journal_entry_id uuid REFERENCES journal_entries(journal_entry_id);  -- per Sub-N (b); populated at post_bill time

COMMENT ON COLUMN bills.purchase_order_id IS
  'Reserved for Phase F PO module per Spend brief §15. Nullable; no FK constraint until purchase_orders table ships.';

COMMENT ON COLUMN bills.posted_journal_entry_id IS
  'FK to the journal_entry created when this bill was posted (post_bill mutation). Populated at post_bill time from journalEntryService.post() return value. Nullable for unposted bills (lifecycle_state = ''draft''). Used by reverse_bill mutation to identify the JE to reverse via journalEntryService.post(reverses_journal_entry_id=...).';

CREATE INDEX idx_bills_posted_journal_entry ON bills (posted_journal_entry_id) WHERE posted_journal_entry_id IS NOT NULL;
```

- [ ] **Step 4: Extend `bill_lines` table**

Per Sub-G column list. Note: NO `fx_rate` column (Sub-M defer; relies on parent `bill.fx_rate`).

```sql
ALTER TABLE bill_lines
  ADD COLUMN tax_code_id uuid REFERENCES tax_codes(tax_code_id),  -- nullable; lines without tax
  ADD COLUMN line_number int;

CREATE INDEX idx_bill_lines_tax_code ON bill_lines (tax_code_id) WHERE tax_code_id IS NOT NULL;
```

- [ ] **Step 5: Extend `payments` table**

Per Sub-G column list. Note: `payments.amount` stays CAD-implicit per Sub-L; service layer enforces `bill.currency = 'CAD'` for `record_bill_payment` v1.

```sql
ALTER TABLE payments
  ADD COLUMN payment_method payment_method NOT NULL DEFAULT 'other',
  ADD COLUMN vendor_id uuid REFERENCES vendors(vendor_id),
  ADD COLUMN applied_to text CHECK (applied_to IS NULL OR applied_to IN ('bill', 'invoice')),
  ADD COLUMN reference_number text;

-- Layer-1 CHECK: payment_method v1-active subset (per Sub-K)
ALTER TABLE payments
  ADD CONSTRAINT payments_method_v1_active CHECK (
    payment_method IN ('check', 'eft', 'wire', 'cash', 'other')
  );

COMMENT ON COLUMN payments.amount IS
  'CAD-implicit for v1 per Sub-L. Multi-currency triad (amount_original/amount_cad/fx_rate) deferred to post-v1 multi-currency arc. Service layer enforces bill.currency = ''CAD'' precondition for record_bill_payment.';

CREATE INDEX idx_payments_vendor ON payments (org_id, vendor_id) WHERE vendor_id IS NOT NULL;
```

- [ ] **Step 6: Create `bill_payment_allocations` table**

Per Sub-I (genuinely net-new; payments→bills cardinality, distinct from vendor_prepayment_applications).

```sql
-- bill_payment_allocations per Sub-I (Q60/Q74 substrate; partial-payment cardinality)
-- Many-to-many: one payment can split across N bills; one bill can be allocated from N payments.
-- Distinct from vendor_prepayment_applications (which links vendor_prepayments to bills, not payments).
CREATE TABLE bill_payment_allocations (
  bill_payment_allocation_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(org_id) ON DELETE CASCADE,
  payment_id uuid NOT NULL REFERENCES payments(payment_id),
  bill_id uuid NOT NULL REFERENCES bills(bill_id),
  amount_cad numeric(20,4) NOT NULL CHECK (amount_cad > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid NOT NULL REFERENCES auth.users(id),
  trace_id uuid NOT NULL
);

CREATE INDEX idx_bill_payment_allocations_payment ON bill_payment_allocations (payment_id);
CREATE INDEX idx_bill_payment_allocations_bill ON bill_payment_allocations (bill_id);
CREATE INDEX idx_bill_payment_allocations_org ON bill_payment_allocations (org_id);
```

- [ ] **Step 7: Add RLS policies for new table**

Mirror chunk B5-1 RLS policy shape (`20240138000000` lines 257-272 for `vendor_prepayment_applications`).

```sql
ALTER TABLE bill_payment_allocations ENABLE ROW LEVEL SECURITY;

CREATE POLICY bill_payment_allocations_tenant_select ON bill_payment_allocations
  FOR SELECT USING (user_has_org_access(org_id));

CREATE POLICY bill_payment_allocations_tenant_insert ON bill_payment_allocations
  FOR INSERT WITH CHECK (user_has_org_access(org_id));

CREATE POLICY bill_payment_allocations_tenant_update ON bill_payment_allocations
  FOR UPDATE USING (user_has_org_access(org_id));
```

- [ ] **Step 8: Verify migration applies cleanly**

Run: `pnpm db:reset:clean && pnpm db:seed:all`
Expected: no errors; all migrations apply through `20240139000000`.

Then confirm schema:
```bash
psql -h localhost -p 54322 -U postgres -d postgres -c "\d+ bills" | grep -E 'payment_terms_days|purchase_order_id|tax_amount_total'
psql -h localhost -p 54322 -U postgres -d postgres -c "\d+ bill_lines" | grep -E 'tax_code_id|line_number'
psql -h localhost -p 54322 -U postgres -d postgres -c "\d+ payments" | grep -E 'payment_method|vendor_id|applied_to|reference_number'
psql -h localhost -p 54322 -U postgres -d postgres -c "\d+ bill_payment_allocations"
```
Expected: all new columns present; bill_payment_allocations table exists with RLS enabled.

---

## Task 2: bill.schema.ts (Zod boundary, Layer-2)

**Context:** Mirror pattern from `apps/web/src/shared/schemas/spend/vendorPrepayment.schema.ts` lines 75-120 (per-mutation input schemas). Use existing money helpers from `apps/web/src/shared/schemas/accounting/money.schema.ts` (toMoneyAmount, toFxRate, MoneyString regex). 3-layer enum discipline per ADR-0010.

**Files:**
- Create: `apps/web/src/shared/schemas/spend/bill.schema.ts`

- [ ] **Step 1: Create file with header + imports**

```typescript
// Layer-2 boundary for Slice A bill lifecycle (chunk B5-2 substantive session #1).
//
// 3-layer enum discipline per ADR-0010 reserved-enum-states:
//   Layer 1: DB CHECK constraints in 20240139000000 migration
//   Layer 2: Zod rejects reserved values pre-service (THIS FILE)
//   Layer 3: Service code never emits reserved values (billService.ts)
//
// Money fields use existing money.schema.ts helpers (4-decimal MoneyString, 8-decimal FxRateString).
// Spend domain uniformly numeric(20,4) per Sub-H audit; service boundary casts via toMoneyAmount.

import { z } from 'zod';
import { MoneyAmountSchema, FxRateSchema, toMoneyAmount, toFxRate } from '@/shared/schemas/accounting/money.schema';
```

- [ ] **Step 2: Add closed-enum schemas**

```typescript
// bill_lifecycle_state per D1 canonical (B5-1 migration; reused). All 7 values v1-active.
export const BillLifecycleStateSchema = z.enum([
  'draft',
  'pending_approval',
  'approved_for_payment',
  'partially_paid',
  'fully_paid',
  'voided',
  'cancelled',
]);
export type BillLifecycleState = z.infer<typeof BillLifecycleStateSchema>;

// payment_method per Sub-K (v1-active subset only; Zod rejects reserved per Layer 2)
export const PaymentMethodSchema = z.enum(['check', 'eft', 'wire', 'cash', 'other']);
export type PaymentMethod = z.infer<typeof PaymentMethodSchema>;

// applied_to discriminator per Sub-G (v1-active: bill; reserved: invoice for Phase 3+)
export const AppliedToSchema = z.enum(['bill']);  // 'invoice' reserved at DB layer; Zod rejects pre-service
export type AppliedTo = z.infer<typeof AppliedToSchema>;
```

- [ ] **Step 3: Add bill_line input schema**

```typescript
export const BillLineInputSchema = z.object({
  account_id: z.string().uuid(),
  description: z.string().min(1),
  amount: MoneyAmountSchema,  // 4-decimal MoneyString
  amount_original: MoneyAmountSchema,
  amount_cad: MoneyAmountSchema,
  tax_code_id: z.string().uuid().nullable(),
  line_number: z.number().int().min(1),
});
export type BillLineInput = z.infer<typeof BillLineInputSchema>;
```

- [ ] **Step 4: Add `post_bill` mutation input schema**

```typescript
// post_bill per Shape (i): posts JE + sets bills.lifecycle_state = 'pending_approval'.
// Approval gate per D3 = Always Confirm v1 (controller approves via approve_bill_for_payment).
export const PostBillInputSchema = z.object({
  org_id: z.string().uuid(),
  vendor_id: z.string().uuid(),
  bill_number: z.string().nullable(),
  issue_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),  // YYYY-MM-DD
  due_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
  payment_terms_days: z.number().int().nullable(),
  purchase_order_id: z.string().uuid().nullable(),  // Phase F reserved
  currency: z.literal('CAD'),  // v1-CAD-only per Sub-L
  amount_original: MoneyAmountSchema,
  amount_cad: MoneyAmountSchema,
  fx_rate: FxRateSchema,
  tax_amount_total: MoneyAmountSchema,
  bill_lines: z.array(BillLineInputSchema).min(1),
  fiscal_period_id: z.string().uuid(),  // for journalEntryService.post period-lock check
  entry_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  ap_control_account_id: z.string().uuid(),  // Cr account in JE
});
export type PostBillInput = z.infer<typeof PostBillInputSchema>;
```

- [ ] **Step 5: Add `approve_bill_for_payment` input schema**

```typescript
// approve_bill_for_payment is state-only (no JE produced). Transitions pending_approval → approved_for_payment.
export const ApproveBillForPaymentInputSchema = z.object({
  org_id: z.string().uuid(),
  bill_id: z.string().uuid(),
});
export type ApproveBillForPaymentInput = z.infer<typeof ApproveBillForPaymentInputSchema>;
```

- [ ] **Step 6: Add `record_bill_payment` input schema**

```typescript
// record_bill_payment creates payment row + bill_payment_allocations + posts payment JE.
// INV-AP-001: allocation amount must be ≤ remaining bill balance (Layer 2 service enforcement).
// v1: bill.currency = 'CAD' precondition per Sub-L.
export const RecordBillPaymentInputSchema = z.object({
  org_id: z.string().uuid(),
  bill_id: z.string().uuid(),
  payment_method: PaymentMethodSchema,
  payment_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  amount_cad: MoneyAmountSchema,  // payments.amount is CAD-implicit per Sub-L
  reference_number: z.string().nullable(),
  fiscal_period_id: z.string().uuid(),
  entry_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  ap_control_account_id: z.string().uuid(),  // Dr account in payment JE
  cash_account_id: z.string().uuid(),  // Cr account in payment JE
});
export type RecordBillPaymentInput = z.infer<typeof RecordBillPaymentInputSchema>;
```

- [ ] **Step 7: Add `reverse_bill` input schema**

```typescript
// reverse_bill thin wrapper per D4 + Sub-E. Calls journalEntryService.post() with reverses_journal_entry_id.
// reversal_reason caller-provided per Integration 1 + INV-REVERSAL-002.
// INV-AP-002: precondition lifecycle_state ∈ {pending_approval, approved_for_payment, partially_paid, fully_paid} (Layer 2).
// Sub-D: target state = voided (canonical 7-state enum).
export const ReverseBillInputSchema = z.object({
  org_id: z.string().uuid(),
  bill_id: z.string().uuid(),
  reversal_reason: z.string().min(1),  // INV-REVERSAL-002 non-empty
  fiscal_period_id: z.string().uuid(),
  entry_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),  // reversal entry date
});
export type ReverseBillInput = z.infer<typeof ReverseBillInputSchema>;
```

---

## Task 3: billService.ts (4 mutation handlers)

**Context:** Mirror pattern from `apps/web/src/services/spend/vendorPrepaymentService.ts` lines 1-555. Plain unwrapped functions exported as service object; route-handler wraps via `withInvariants(action: 'bill.post' / 'bill.approve' / 'bill.record_payment' / 'bill.reverse')` per Pattern B INV-SERVICE-001 export contract. Pre-load helpers (loadBillOrThrow, loadVendorOrThrow); adminClient; loggerWith; ServiceError boundary.

**Files:**
- Create: `apps/web/src/services/spend/billService.ts`

- [ ] **Step 1: Create file with header + imports**

Mirror `vendorPrepaymentService.ts` lines 1-72 imports pattern. Add `journalEntryService` + `recordMutation` + `bill.schema` imports.

- [ ] **Step 2: Add pre-load helpers**

`loadBillOrThrow(db, ctx, bill_id, org_id)`, `loadVendorOrThrow(db, ctx, vendor_id, org_id)`, `loadFiscalPeriodOrThrow(db, ctx, fiscal_period_id, org_id)`, `loadAccountOrThrow(db, ctx, account_id, org_id)`. Mirror `vendorPrepaymentService.ts` lines 74-175 helpers pattern.

- [ ] **Step 3: Implement `post` (post_bill) mutation**

Shape (i): inserts bills row + bill_lines rows + posts JE via `journalEntryService.post()` + sets `bills.lifecycle_state = 'pending_approval'` + emits `bill_created` audit. JE shape: Dr expense (per bill_line.account_id) / Cr ap_control_account_id. Use `toMoneyAmount` helpers per money.schema.

Pseudo-shape:
```typescript
async function post(input: PostBillInput, ctx: ServiceContext): Promise<{ bill_id: string; journal_entry_id: string }> {
  const parsed = PostBillInputSchema.parse(input);
  const log = loggerWith({ trace_id: ctx.trace_id, user_id: ctx.caller.user_id });
  const db = adminClient();

  // Pre-load + validate vendor exists in org
  await loadVendorOrThrow(db, ctx, parsed.vendor_id, parsed.org_id);
  await loadFiscalPeriodOrThrow(db, ctx, parsed.fiscal_period_id, parsed.org_id);
  await loadAccountOrThrow(db, ctx, parsed.ap_control_account_id, parsed.org_id);
  for (const line of parsed.bill_lines) {
    await loadAccountOrThrow(db, ctx, line.account_id, parsed.org_id);
  }

  // INV-AP-001 precondition (sum of bill_lines.amount equals parsed.amount_original)
  // (validated against parsed amounts; idempotency via withInvariants at route)

  // Construct JE lines (Dr expense per bill_line; Cr ap_control aggregated)
  const drLines = parsed.bill_lines.map((line) => ({
    account_id: line.account_id,
    description: line.description,
    debit_amount: toMoneyAmount(line.amount_cad),
    credit_amount: zeroMoney(),
    currency: parsed.currency,
    amount_original: toMoneyAmount(line.amount_original),
    amount_cad: toMoneyAmount(line.amount_cad),
    fx_rate: toFxRate(parsed.fx_rate),
    tax_code_id: line.tax_code_id,
  }));
  const crLine = {
    account_id: parsed.ap_control_account_id,
    description: `Bill ${parsed.bill_number ?? '(no number)'} from vendor ${parsed.vendor_id}`,
    debit_amount: zeroMoney(),
    credit_amount: toMoneyAmount(parsed.amount_cad),
    currency: parsed.currency,
    amount_original: toMoneyAmount(parsed.amount_original),
    amount_cad: toMoneyAmount(parsed.amount_cad),
    fx_rate: toFxRate(parsed.fx_rate),
    tax_code_id: null,
  };

  // Reading B preserved: journalEntryService.post() is sole writer
  const { journal_entry_id } = await journalEntryService.post(
    {
      org_id: parsed.org_id,
      fiscal_period_id: parsed.fiscal_period_id,
      entry_date: parsed.entry_date,
      description: `Bill posting: ${parsed.bill_number ?? parsed.vendor_id}`,
      source: 'manual',
      lines: [...drLines, crLine],
    },
    ctx,
  );

  // Insert bill row + bill_lines rows
  const { data: insertedBill, error: billErr } = await db
    .from('bills')
    .insert({
      org_id: parsed.org_id,
      vendor_id: parsed.vendor_id,
      bill_number: parsed.bill_number,
      issue_date: parsed.issue_date,
      due_date: parsed.due_date,
      payment_terms_days: parsed.payment_terms_days,
      purchase_order_id: parsed.purchase_order_id,
      currency: parsed.currency,
      amount_original: parsed.amount_original,
      amount_cad: parsed.amount_cad,
      fx_rate: parsed.fx_rate,
      tax_amount_total: parsed.tax_amount_total,
      lifecycle_state: 'pending_approval',  // Shape (i): post_bill posts JE + sets pending_approval
      posted_journal_entry_id: journal_entry_id,  // Sub-N (b): canonical back-reference for reverse_bill lookup
      // Note: legacy `status` text column auto-defaults to 'draft' per Sub-F (i) leave-untouched
    })
    .select('bill_id')
    .single();
  if (billErr || !insertedBill) {
    throw new ServiceError('BILL_INSERT_FAILED', billErr?.message ?? 'no data');
  }

  const billLinesRows = parsed.bill_lines.map((line) => ({
    bill_id: insertedBill.bill_id,
    account_id: line.account_id,
    description: line.description,
    amount: line.amount,
    amount_original: line.amount_original,
    amount_cad: line.amount_cad,
    tax_code_id: line.tax_code_id,
    line_number: line.line_number,
  }));
  const { error: linesErr } = await db.from('bill_lines').insert(billLinesRows);
  if (linesErr) {
    throw new ServiceError('BILL_LINES_INSERT_FAILED', linesErr.message);
  }

  // Bill-grain audit emission (Sub-J: sequential per B5-1 vendor_prepayment precedent)
  await recordMutation(db, ctx, {
    org_id: parsed.org_id,
    action: 'bill_created',
    entity_type: 'bill',
    entity_id: insertedBill.bill_id,
  });

  log.info({ fn: 'billService.post', bill_id: insertedBill.bill_id, journal_entry_id }, 'Bill posted');
  return { bill_id: insertedBill.bill_id, journal_entry_id };
}
```

- [ ] **Step 4: Implement `approveForPayment` (approve_bill_for_payment) mutation**

State-only transition: pending_approval → approved_for_payment. INV-AP-002 precondition: current state must be 'pending_approval'. No JE produced. Audit: `bill_approved_for_payment`.

```typescript
async function approveForPayment(input: ApproveBillForPaymentInput, ctx: ServiceContext): Promise<{ bill_id: string }> {
  const parsed = ApproveBillForPaymentInputSchema.parse(input);
  const db = adminClient();

  const bill = await loadBillOrThrow(db, ctx, parsed.bill_id, parsed.org_id);

  // INV-AP-002 Layer 2: state-transition path enforcement
  if (bill.lifecycle_state !== 'pending_approval') {
    throw new ServiceError(
      'BILL_INVALID_STATE_TRANSITION',
      `Cannot approve_for_payment: bill lifecycle_state is '${bill.lifecycle_state}'; expected 'pending_approval'`,
    );
  }

  const before = { lifecycle_state: bill.lifecycle_state };

  const { error } = await db
    .from('bills')
    .update({ lifecycle_state: 'approved_for_payment' })
    .eq('bill_id', parsed.bill_id)
    .eq('org_id', parsed.org_id);
  if (error) throw new ServiceError('BILL_UPDATE_FAILED', error.message);

  await recordMutation(db, ctx, {
    org_id: parsed.org_id,
    action: 'bill_approved_for_payment',
    entity_type: 'bill',
    entity_id: parsed.bill_id,
    before_state: before,
  });

  return { bill_id: parsed.bill_id };
}
```

- [ ] **Step 5: Implement `recordPayment` (record_bill_payment) mutation**

Creates payment row + bill_payment_allocations row + posts payment JE (Dr ap_control / Cr cash) + updates bills.lifecycle_state to partially_paid or fully_paid based on allocation sum vs bill.amount_cad. INV-AP-001 Layer 2 enforcement: sum(allocations) ≤ bill.amount_cad. INV-AP-002 precondition: bill must be approved_for_payment OR partially_paid.

Pseudo-shape:
```typescript
async function recordPayment(input: RecordBillPaymentInput, ctx: ServiceContext): Promise<{ payment_id: string; bill_id: string; journal_entry_id: string; new_lifecycle_state: BillLifecycleState }> {
  const parsed = RecordBillPaymentInputSchema.parse(input);
  const db = adminClient();

  const bill = await loadBillOrThrow(db, ctx, parsed.bill_id, parsed.org_id);

  // v1 single-currency precondition per Sub-L
  if (bill.currency !== 'CAD') {
    throw new ServiceError('BILL_MULTI_CURRENCY_NOT_SUPPORTED', `Bill currency is '${bill.currency}'; v1 supports CAD only`);
  }

  // INV-AP-002 precondition
  if (!['approved_for_payment', 'partially_paid'].includes(bill.lifecycle_state)) {
    throw new ServiceError('BILL_INVALID_STATE_TRANSITION', `Cannot record_bill_payment: bill lifecycle_state is '${bill.lifecycle_state}'; expected 'approved_for_payment' or 'partially_paid'`);
  }

  // INV-AP-001 precondition: existing allocations + new amount ≤ bill.amount_cad
  const { data: existingAllocs } = await db
    .from('bill_payment_allocations')
    .select('amount_cad')
    .eq('bill_id', parsed.bill_id);
  const existingSum = (existingAllocs ?? []).reduce((s, a) => s + Number(a.amount_cad), 0);
  const newSum = existingSum + Number(parsed.amount_cad);
  const billAmount = Number(bill.amount_cad);
  if (newSum > billAmount) {
    throw new ServiceError('BILL_OVER_ALLOCATION', `Allocation sum (${newSum}) exceeds bill amount (${billAmount})`);
  }

  // Construct payment JE (Dr ap_control / Cr cash)
  const drLine = { /* ap_control_account_id, debit_amount = amount_cad, ... */ };
  const crLine = { /* cash_account_id, credit_amount = amount_cad, ... */ };

  const { journal_entry_id } = await journalEntryService.post(
    { org_id: parsed.org_id, fiscal_period_id: parsed.fiscal_period_id, entry_date: parsed.entry_date,
      description: `Bill payment for ${parsed.bill_id}`, source: 'manual', lines: [drLine, crLine] },
    ctx,
  );

  // Insert payment row
  const { data: payment, error: payErr } = await db
    .from('payments')
    .insert({
      org_id: parsed.org_id,
      payment_date: parsed.payment_date,
      amount: parsed.amount_cad,  // CAD-implicit per Sub-L
      currency: 'CAD',
      payment_method: parsed.payment_method,
      payment_purpose: 'bill_payment',
      payment_state: 'paid',
      vendor_id: bill.vendor_id,
      applied_to: 'bill',
      reference_number: parsed.reference_number,
    })
    .select('payment_id')
    .single();
  if (payErr || !payment) throw new ServiceError('PAYMENT_INSERT_FAILED', payErr?.message ?? 'no data');

  // Insert allocation
  const { error: allocErr } = await db
    .from('bill_payment_allocations')
    .insert({
      org_id: parsed.org_id,
      payment_id: payment.payment_id,
      bill_id: parsed.bill_id,
      amount_cad: parsed.amount_cad,
      created_by: ctx.caller.user_id,
      trace_id: ctx.trace_id,
    });
  if (allocErr) throw new ServiceError('ALLOCATION_INSERT_FAILED', allocErr.message);

  // Compute new lifecycle_state per allocation sum
  const newState: BillLifecycleState = newSum >= billAmount ? 'fully_paid' : 'partially_paid';
  const before = { lifecycle_state: bill.lifecycle_state };
  await db.from('bills').update({ lifecycle_state: newState }).eq('bill_id', parsed.bill_id).eq('org_id', parsed.org_id);

  await recordMutation(db, ctx, {
    org_id: parsed.org_id,
    action: 'bill_payment_recorded',
    entity_type: 'bill',
    entity_id: parsed.bill_id,
    before_state: before,
  });

  return { payment_id: payment.payment_id, bill_id: parsed.bill_id, journal_entry_id, new_lifecycle_state: newState };
}
```

- [ ] **Step 6: Implement `reverse` (reverse_bill) mutation per D4 + Sub-E + Sub-D + Integrations 1+2**

Thin wrapper. Calls `journalEntryService.post()` with `reverses_journal_entry_id` (the bill's posted JE) + `reversal_reason`. Operation-order atomicity per Integration 2: state update fires AFTER post() succeeds. INV-AP-002 precondition: bill.lifecycle_state ∈ {pending_approval, approved_for_payment, partially_paid, fully_paid}. Target state = 'voided' per Sub-D. Audit `bill_reversed`.

Pseudo-shape:
```typescript
async function reverse(input: ReverseBillInput, ctx: ServiceContext): Promise<{ bill_id: string; reversal_journal_entry_id: string }> {
  const parsed = ReverseBillInputSchema.parse(input);
  const db = adminClient();

  const bill = await loadBillOrThrow(db, ctx, parsed.bill_id, parsed.org_id);

  // INV-AP-002 precondition: 4-state reversal precondition per Integration 3
  if (!['pending_approval', 'approved_for_payment', 'partially_paid', 'fully_paid'].includes(bill.lifecycle_state)) {
    throw new ServiceError('BILL_INVALID_STATE_TRANSITION', `Cannot reverse_bill: bill lifecycle_state is '${bill.lifecycle_state}'; reversal requires post-JE-post state`);
  }

  // Look up the bill's posted JE via canonical back-reference (Sub-N (b) ratified).
  // bills.posted_journal_entry_id is populated at post_bill time from journalEntryService.post() return.
  if (!bill.posted_journal_entry_id) {
    throw new ServiceError('BILL_NO_POSTED_JE', `Cannot reverse bill ${parsed.bill_id}: no posted_journal_entry_id (bill never posted, or substrate gap)`);
  }
  const originalJournalEntryId = bill.posted_journal_entry_id;

  // Step 1: Call journalEntryService.post() with reverses_journal_entry_id input per Sub-E
  // post() detects reversal branch (line 86-87), validates mirror (line 241+), emits journal_entry.reverse audit at JE grain
  const { journal_entry_id: reversalJournalEntryId } = await journalEntryService.post(
    {
      org_id: parsed.org_id,
      fiscal_period_id: parsed.fiscal_period_id,
      entry_date: parsed.entry_date,
      description: `Bill reversal: ${parsed.bill_id}`,
      source: 'manual',
      reverses_journal_entry_id: originalJournalEntryId,
      reversal_reason: parsed.reversal_reason,
      lines: /* mirror lines computed from original JE; or post() may handle */
    },
    ctx,
  );

  // Step 2: Per Integration 2 atomicity, state update fires AFTER post() succeeds
  const before = { lifecycle_state: bill.lifecycle_state };
  await db.from('bills').update({ lifecycle_state: 'voided' }).eq('bill_id', parsed.bill_id).eq('org_id', parsed.org_id);

  // Step 3: Bill-grain audit per D4
  await recordMutation(db, ctx, {
    org_id: parsed.org_id,
    action: 'bill_reversed',
    entity_type: 'bill',
    entity_id: parsed.bill_id,
    before_state: before,
    reason: parsed.reversal_reason,
  });

  return { bill_id: parsed.bill_id, reversal_journal_entry_id: reversalJournalEntryId };
}
```

**Note for implementer:** Sub-N (b) ratified — `bills.posted_journal_entry_id` is the canonical back-reference. Migration Task 1 Step 3 adds the column with FK to `journal_entries(journal_entry_id)`. post_bill (Step 3) populates it from `journalEntryService.post()` return value at insert time. reverse_bill reads `bill.posted_journal_entry_id` directly (no audit_log mining; no helper function needed).

- [ ] **Step 7: Export the service object**

Mirror `vendorPrepaymentService` export pattern (lines 540+ of `vendorPrepaymentService.ts`):

```typescript
export const billService = {
  // withInvariants: skip-org-check (pattern-B: route-handler-wrapped via withInvariants(action: 'bill.post' | 'bill.approve' | 'bill.record_payment' | 'bill.reverse'))
  post,
  approveForPayment,
  recordPayment,
  reverse,
};
```

---

## Task 4: Per-mutation integration tests (4 files)

**Context:** Mirror pattern from `apps/web/tests/integration/vendorPrepaymentRecord.test.ts` (B5-1). Each test file = one mutation; covers happy path + key preconditions + audit emission. Use dedicated test-accounts pattern per skills/integration-test-rules SKILL.md §3 (Item 20 codified): per-run unique account_codes derived from traceId. beforeAll create accounts; afterAll delete after JE+lines cleanup.

**Files:**
- Create: `apps/web/tests/integration/billPostBill.test.ts`
- Create: `apps/web/tests/integration/billApproveForPayment.test.ts`
- Create: `apps/web/tests/integration/billRecordPayment.test.ts`
- Create: `apps/web/tests/integration/billReverse.test.ts`

- [ ] **Step 1: billPostBill.test.ts** — covers post_bill happy path (creates bill in pending_approval; posts JE; emits bill_created audit) + preconditions (rejects unknown vendor; rejects malformed Zod; rejects mismatched line/total amount). Uses dedicated test accounts (T${traceId.slice(0,8)}_AP, T${traceId.slice(0,8)}_EXP).

- [ ] **Step 2: billApproveForPayment.test.ts** — covers happy path (pending_approval → approved_for_payment; emits bill_approved_for_payment audit; no JE) + preconditions (rejects if bill in 'draft' / 'voided' / 'cancelled' state; rejects cross-org bill_id).

- [ ] **Step 3: billRecordPayment.test.ts** — covers happy path (creates payment + allocation; posts JE Dr AP / Cr cash; updates lifecycle_state to fully_paid for full-balance allocation; partial-payment scenario updates to partially_paid) + INV-AP-001 over-allocation rejection + INV-AP-002 wrong-state rejection + Sub-L bill.currency != CAD rejection.

- [ ] **Step 4: billReverse.test.ts** — covers happy path (calls journalEntryService.post() with reverses_journal_entry_id; updates bill to voided; emits bill_reversed audit at bill grain + journal_entry.reverse audit at JE grain) + INV-AP-002 wrong-state rejection (cannot reverse 'draft' or 'voided' or 'cancelled') + EC-A-2 mirror invariants exercised naturally + reversal_reason non-empty Zod boundary.

Each test file follows `vendorPrepaymentRecord.test.ts` structure (beforeAll setup, afterAll cleanup with reverse-order entity deletion + chart_of_accounts last after JE cleanup).

---

## Task 5: Per-criterion integration tests (2 files)

**Context:** Per-criterion tests exercise full INV-ID set per EC criterion. Mirror pattern from `apps/web/tests/integration/vendorPrepaymentApplyEcA1.test.ts` (B5-1).

**Files:**
- Create: `apps/web/tests/integration/billEcA1.test.ts`
- Create: `apps/web/tests/integration/billEcA2.test.ts`

- [ ] **Step 1: billEcA1.test.ts** — exercises EC-A-1 full invariant set (INV-LEDGER-001 balanced, INV-LEDGER-004 debit XOR credit, INV-LEDGER-005 non-zero, INV-LEDGER-006 non-negative, INV-MONEY-001 branded, INV-AUTH-001 authorization, INV-SERVICE-001/002 service+adminClient, INV-AUDIT-001 atomic audit, INV-IDEMPOTENCY-001 if applicable) via post_bill + record_bill_payment. Multi-line bill with tax_code_id per line.

- [ ] **Step 2: billEcA2.test.ts** — exercises EC-A-2 full invariant set (INV-REVERSAL-001 mirror lines, INV-REVERSAL-002 non-empty reason + inherited EC-A-1 invariants on the reversal entry itself) via reverse_bill against a posted bill.

Both files use dedicated test accounts pattern.

---

## Task 6: Unit test (bill.schema.ts Zod boundary)

**Files:**
- Create: `apps/web/tests/unit/billSchema.test.ts`

- [ ] **Step 1: Test BillLifecycleStateSchema** — accepts all 7 v1-active values; rejects unknown values.

- [ ] **Step 2: Test PaymentMethodSchema** — accepts 5 v1-active values; rejects 4 reserved values (credit_card, ach, bank_transfer, money_order); rejects unknown values.

- [ ] **Step 3: Test PostBillInputSchema** — happy parse with multi-line bill; rejects missing required fields; rejects malformed currency (non-CAD); rejects empty bill_lines array; rejects negative amounts.

- [ ] **Step 4: Test ApproveBillForPaymentInputSchema** — happy parse; rejects missing fields.

- [ ] **Step 5: Test RecordBillPaymentInputSchema** — happy parse; rejects malformed payment_method (e.g., 'credit_card' which is reserved); rejects missing fields.

- [ ] **Step 6: Test ReverseBillInputSchema** — happy parse; rejects empty reversal_reason (INV-REVERSAL-002 boundary); rejects missing fields.

---

## Task 7: Verification + bundled commit at session-close per (γ-a)

- [ ] **Step 1: Type check**

Run: `pnpm typecheck`
Expected: no errors.

- [ ] **Step 2: Run full test suite**

Run: `pnpm test`
Expected: full suite green (including 7 new tests added in tasks 4-6).

- [ ] **Step 3: Run agent:validate (push-readiness condition 1 gate)**

Run: `pnpm agent:validate`
Expected: 26/26 floor tests + typecheck + no-hardcoded-urls all GREEN.

- [ ] **Step 4: Verify migration applies on fresh DB**

Run: `pnpm db:reset:clean && pnpm db:seed:all`
Expected: clean apply through `20240139000000`.

- [ ] **Step 5: Single (γ-a) bundled commit**

Stage all created files (10 files: 1 migration + 1 schema + 1 service + 6 integration tests + 1 unit test).

Commit message:
```
feat(spend): chunk B5-2 substantive session #1 — bill lifecycle substrate + 4 mutations + 7 tests

Phase 5 chunk B5-2 (Slice A bill lifecycle) substantive session #1 ships under
(cadence-β-i-b) 2-session bundled cadence: substrate + mutations + integration
tests bundled in this single (γ-a) commit. Closeout artifacts (friction-journal
entry + Spend brief amendment + open_questions.md Q-entry + CURRENT_STATE.md
update + carry-forward reconciliation) ship at session #2.

Substrate (single migration per (mig-α)):
- payment_method closed enum (5 v1-active + 4 reserved per Sub-K + ADR-0010)
- bills column extensions: payment_terms_days, purchase_order_id (Phase F nullable
  no-FK), tax_amount_total
- bill_lines column extensions: tax_code_id (FK tax_codes), line_number
- payments column extensions: payment_method, vendor_id (FK vendors), applied_to
  CHECK, reference_number; payments.amount stays CAD-implicit per Sub-L
- bill_payment_allocations net-new table per Sub-I (semantically distinct from
  vendor_prepayment_applications; payments→bills cardinality)
- RLS policies for bill_payment_allocations
- bills.status legacy text column LEFT UNTOUCHED per Sub-F (i)

Mutations in billService.ts (4 handlers):
- post_bill — creates bill+lines + posts JE via journalEntryService.post() (Dr
  expense per line / Cr ap_control); sets lifecycle_state = 'pending_approval'
  per Shape (i); emits bill_created audit
- approve_bill_for_payment — state-only transition pending_approval →
  approved_for_payment; INV-AP-002 Layer 2 enforcement; emits bill_approved_for_payment
- record_bill_payment — creates payment + bill_payment_allocations + posts payment
  JE (Dr ap_control / Cr cash); updates lifecycle_state to partially_paid or
  fully_paid based on allocation sum vs bill.amount_cad; INV-AP-001 Layer 2 enforcement
  (sum ≤ bill.amount_cad); v1 CAD-only precondition per Sub-L
- reverse_bill — D4 thin wrapper per Sub-E corrected mechanism: calls
  journalEntryService.post() with reverses_journal_entry_id + caller-provided
  reversal_reason (INV-REVERSAL-002); operation-order atomicity (state update AFTER
  post() succeeds per Integration 2); transitions to 'voided' per Sub-D; emits
  bill_reversed audit at bill grain (JE-grain audit emitted by journalEntryService.post)

Tests under (test-γ) hybrid asymmetric split (D6 ratified):
- 4 per-mutation integration tests (one per mutation)
- 2 per-criterion integration tests (EC-A-1 via post_bill+record_bill_payment;
  EC-A-2 via reverse_bill mirror invariants)
- 1 unit test (bill.schema.ts Zod boundary)
- All integration tests use dedicated test-accounts pattern per Item 20 codified
  discipline (.claude/skills/integration-test-rules/SKILL.md §3)

Reading B preserved (non-negotiable): all bill mutations route through
journalEntryService.post() for ledger writes; approve_bill_for_payment is state-
only (no JE).

12-disposition substrate-decisions (D1-D7 + Sub-D/E/F/G/I/J/K/L/M; Sub-H dissolved
as false catch) ratified at chunk B5-2 onset planning (memory-writes-only Stage 6)
+ audit-grounded re-ratification at substantive session #1 Stage 0+. Cluster B B1
N=14 productive catches across chunk B5-2 to-date (operational test substantively
validated; many catches at process artifacts grain — see arc-closure retrospective).

Verification:
- pnpm typecheck: GREEN
- pnpm test: GREEN
- pnpm agent:validate: GREEN (26/26 floor + typecheck + no-hardcoded-urls)
- Migration applies cleanly on fresh DB

Push-readiness gate condition 1 (test-suite health) MET at session-grain;
conditions 2+3 accumulate to chunk-completion at session #2 closeout.

Files: 10 (1 migration + 1 schema + 1 service + 7 tests).
```

End commit with `Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>`.

- [ ] **Step 6: Stage 6 close per Item 17 standing rule (γ-a) bundle**

After commit lands, refresh memory pickup file + MEMORY.md pointer (chunk B5-2 SESSION-1 SHIPPED state; session #2 closeout next). 2 memory writes.

- [ ] **Step 7: Push to origin/staging (per push-readiness gate condition 1 grain)**

Run: `git push origin staging`
Expected: clean push.

- [ ] **Step 8: Verify branch alignment 0/0 post-push**

Run: `git rev-list --left-right --count origin/staging...HEAD`
Expected: `0	0`

---

**Session #1 ends here. Session #2 (closeout) follows per (cadence-β-i-b) cadence — friction-journal entry + Spend brief enum amendment (D1) + open_questions.md new Q-entry (D2) + CURRENT_STATE.md update (§Drift-1 option i) + carry-forward reconciliation + memory-writes Stage 6 close.**
