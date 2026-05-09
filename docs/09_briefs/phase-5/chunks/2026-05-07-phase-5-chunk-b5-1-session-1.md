# Phase 5 Chunk B5-1 Substantive Session #1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Land foundational substrate (schema migration + state-machine substrate + FT2 ride-alongside) for the vendor prepayment lifecycle slice (slice-B-prepay) so session #2 can land mutation handlers + integration tests on top.

**Architecture:** A single SQL migration creates 5 closed enums + 2 new tables (`vendor_prepayments` + `vendor_prepayment_applications`) + column extensions on `payments` / `bills` / `org_settings`, all with Layer-1 DB CHECK constraints per ADR-0010 reserved-enum-states discipline. A TypeScript Zod schema file establishes the Layer-2 boundary (rejects reserved enum values). A pure status-computation function establishes the Layer-3 service-layer foundation that mutation handlers (session #2) will build on. FT2 ride-alongside corrects an ADR-0013 §16 misattribution in an adjacent migration's comment header.

**Tech Stack:** Postgres (Supabase), TypeScript, Zod (schema validation), Vitest (unit tests).

**Locked-scope context** (from chunk B5-1 onset planning + 7-item substantive surfacing per founder bundled-accept):
- Migration shape: (mig-α) single migration file
- Lifecycle implementation: (approval-α) service-layer encapsulated bifurcated approval gate (handlers land session #2; substrate lands here)
- Q1 enforcement: 3-layer joint (Layer-1 DB CHECK + Layer-2 Zod boundary + Layer-3 service no-emit; Layer-4 ESLint defers to Q29)
- Q2 tax timing: synchronous proposal-time evaluation
- Q3 status computation: Layer-2 service-layer (pure function this session)
- Q5 Reading B enforcement: service-guard primary; ESLint defers to Q29 firing-point
- Reading B preservation (non-negotiable): vendorPrepaymentService never writes journal_entries / journal_lines directly; mutation handlers (session #2) call ledgerService.post inside withInvariants
- Single bundled commit at scope-level under (cadence-β-i-a) session #1 framing
- FT2 ride-alongside: ADR-0013 §16 misattribution → correct citation is `ledger_truth_model.md` INV-AUDIT-001 leaf

**Out of scope this session:**
- 4 mutation service handlers (`record_vendor_prepayment` / `apply_vendor_prepayment_to_bill` / `record_vendor_prepayment_refund` / `write_off_vendor_prepayment`) — session #2
- Integration tests against the schema (per-mutation + per-criterion under (test-γ) hybrid) — session #2
- (test-fix-α) item 13 fix at `crossOrgRlsIsolation.test.ts` — session #2
- FT3 ride-alongside (`recordMutation.ts:122-127` atomicity-claim docstring) — session #2 (fires at recordMutation.ts touch scope when audit-event emissions land)
- FT1 ride-alongside (`clampTtl` NaN-guard) — defer to subsequent chunk per dispatch dispositive evidence (chunk B5-1 does NOT call storageProviderService directly)
- Closeout entry (first Phase 5 friction-journal entry + arc observations) — session #3

---

## Files

**Files to create:**
- `supabase/migrations/20240138000000_phase5_vendor_prepayment_substrate.sql` — schema migration (single file)
- `apps/web/src/shared/schemas/spend/vendorPrepayment.schema.ts` — Zod schemas + TS types (Layer-2 boundary)
- `apps/web/src/shared/schemas/spend/vendorPrepayment.schema.test.ts` — Zod schema unit tests
- `apps/web/src/services/spend/vendorPrepaymentStatus.ts` — pure status-computation function (Layer-3 substrate)
- `apps/web/src/services/spend/vendorPrepaymentStatus.test.ts` — status function unit tests

**Files to modify:**
- `supabase/migrations/20240137000000_create_source_document_with_audit_rpc.sql` lines 13-16 — FT2 citation correction

**Files NOT touched** (Reading B preservation; surface for next chunks):
- Any `journal_entries` / `journal_lines` reader or writer
- `ledgerService` / `journalEntryService`
- `storageProviderService` (FT1 deferred)
- `recordMutation.ts` (FT3 deferred to session #2)

---

## Task 1: FT2 ride-alongside — correct ADR-0013 §16 misattribution

**Context:** The migration comment at `supabase/migrations/20240137000000_create_source_document_with_audit_rpc.sql:13-16` cites "ADR-0013 §16" for the audit-event-in-same-transaction discipline. Pre-flight Probe 9 confirmed the quoted text does NOT appear in ADR-0013 §16. The actual source is `docs/02_specs/ledger_truth_model.md` INV-AUDIT-001 leaf.

**Files:**
- Modify: `supabase/migrations/20240137000000_create_source_document_with_audit_rpc.sql:13-16`

- [ ] **Step 1: Read the current comment block to confirm exact bytes (Z1 #11.a multi-line Edit anchor confirmation discipline)**

Run: Read tool on lines 10-20 of the file.
Expected verbatim text at lines 13-16:
```
-- Per ADR-0013 §16 verbatim:
--   "source_document_created audit event fires in the same transaction
--    as the source_documents INSERT."
```

- [ ] **Step 2: Apply the citation correction**

Use Edit tool. Replace:

```
-- Per ADR-0013 §16 verbatim:
--   "source_document_created audit event fires in the same transaction
--    as the source_documents INSERT."
```

With:

```
-- Per docs/02_specs/ledger_truth_model.md INV-AUDIT-001 leaf:
--   "Every service function that writes to a tenant-scoped table also
--    writes a row to `audit_log` inside the same database transaction."
-- The source_document_created audit event lives in this RPC so it
-- commits atomically with the source_documents INSERT (parallel
-- pattern to 20240134000000_write_journal_entry_atomic_rpc.sql:45-52).
```

- [ ] **Step 3: Verify the edit applied correctly**

Run: `grep -n -A 6 'INV-AUDIT-001 leaf' supabase/migrations/20240137000000_create_source_document_with_audit_rpc.sql`
Expected: matches the new text starting around line 13.

Run: `grep -n 'ADR-0013 §16' supabase/migrations/20240137000000_create_source_document_with_audit_rpc.sql`
Expected: no matches in the citation context (the misattribution is gone).

---

## Task 2: Create schema migration with new enums

**Context:** ADR-0015 §1 + §10 + §11 specifies 5 closed enums for vendor prepayment workflows. Per ADR-0010 reserved-enum-states discipline, all enums declare full membership (v1 active + reserved values); the v1-active subset is enforced via Layer-1 DB CHECK constraint on the columns that use the enum.

**Files:**
- Create: `supabase/migrations/20240138000000_phase5_vendor_prepayment_substrate.sql` (will grow across Tasks 2-5)

- [ ] **Step 1: Create the migration file with header block**

Use Write tool to create `supabase/migrations/20240138000000_phase5_vendor_prepayment_substrate.sql` with:

```sql
-- Phase 5 chunk B5-1 substantive session #1: vendor prepayment substrate
--
-- Per ADR-0015 §1 (Q59 closure — vendor prepayment object shape),
-- §3 (Q61 closure — bifurcated approval gate),
-- §4 (Q62 closure — deposit/retainer tax timing),
-- §10 (schema deltas portion for vendor_prepayments + applications),
-- §11 (reserved enums for prepayment workflows).
--
-- Locked scope (chunk B5-1 onset planning + 7-item substantive surfacing):
--   Migration shape: (mig-α) single migration file.
--   Q1 enforcement: 3-layer joint per ADR-0010 reserved-enum-states.
--     Layer 1 (this file): CHECK constraints on closed-enum columns
--       restricting to v1-active subsets.
--     Layer 2: Zod boundary at apps/web/src/shared/schemas/spend/
--       vendorPrepayment.schema.ts rejects reserved values at service
--       entry points.
--     Layer 3: service code never emits reserved values; pure status
--       function at apps/web/src/services/spend/vendorPrepaymentStatus.ts
--       throws if reserved values are encountered (defensive).
--   Reading B preservation (ADR-0011 §1, ADR-0007 §Tier 2): the schema
--     introduced here will be consumed by mutation handlers in session #2;
--     handlers MUST call ledgerService.post inside withInvariants and
--     never write journal_entries / journal_lines directly.
--
-- FT2 ride-alongside (item 1 fix target 2): the citation correction in
-- 20240137000000_create_source_document_with_audit_rpc.sql lines 13-16
-- ships in the same chunk-grain commit as this migration per chunk B5-1
-- substantive surfacing item 4 lock.
```

- [ ] **Step 2: Add CREATE TYPE statements for the 5 closed enums**

Append to the migration file:

```sql

-- ===========================================================================
-- Closed enums (ADR-0015 §11)
-- ===========================================================================
-- Each enum declares FULL membership (v1 active + reserved). The v1-active
-- subset is enforced via Layer-1 CHECK constraint on the column using the
-- enum (declared inline with the column below). Reserved values exist in
-- the type so future migrations can activate them without an enum-altering
-- migration; they are NEVER emitted by v1 write paths (Layer-3 service
-- discipline).

CREATE TYPE vendor_prepayment_type AS ENUM (
  -- v1 active subset
  'retainer',
  'deposit',
  'advance',
  'other',
  -- Reserved (post-v1 activation per ADR-0010)
  'security_deposit',
  'prepaid_service',
  'inventory_deposit',
  'fixed_asset_deposit'
);

CREATE TYPE vendor_prepayment_status AS ENUM (
  -- v1 active subset
  'open',
  'partially_applied',
  'fully_applied',
  'refunded',
  -- Reserved (post-v1 activation; v1 cases route through manual ledger
  -- entries with controller-stamped audit reasons)
  'written_off',
  'forfeited'
);

CREATE TYPE tax_timing_choice AS ENUM (
  -- v1 active subset
  'at_payment',
  'at_final_invoice',
  'review_required',
  -- Reserved (post-v1 controller-per-invoice workflow)
  'controller_chooses_per_invoice'
);

CREATE TYPE payment_purpose AS ENUM (
  -- v1 active subset
  'bill_payment',
  'vendor_prepayment',
  'vendor_refund',
  'other',
  -- Reserved (post-v1 expansion of payment purposes)
  'customer_payment',
  'employee_reimbursement',
  'owner_reimbursement',
  'tax_payment'
);

CREATE TYPE payment_state AS ENUM (
  -- v1 active subset
  'pending',
  'paid',
  'failed',
  -- Reserved (post-v1 partial/refund state expansion)
  'partially_returned',
  'refunded'
);
```

- [ ] **Step 3: Save the file and verify enum block**

Run: `grep -c '^CREATE TYPE' supabase/migrations/20240138000000_phase5_vendor_prepayment_substrate.sql`
Expected: `5`

Run: `grep -E "^  '[a-z_]+'" supabase/migrations/20240138000000_phase5_vendor_prepayment_substrate.sql | wc -l`
Expected: `25` (8 + 6 + 4 + 8 + 5 = 31 enum values total — adjust expected count based on actual values; the goal is "all enum values present").

Note: If the count differs from 31, re-read the file and verify each enum has the full membership listed above.

---

## Task 3: Add `vendor_prepayments` + `vendor_prepayment_applications` tables

**Context:** ADR-0015 §1 + §10 specify the 18-column `vendor_prepayments` table and the 8-column linking `vendor_prepayment_applications` table. RLS policies use `org_id` scoping per chounting convention; immutability is NOT enforced via triggers at v1 (status transitions happen at the service layer per Q3 lock).

**Files:**
- Modify (append): `supabase/migrations/20240138000000_phase5_vendor_prepayment_substrate.sql`

- [ ] **Step 1: Append `vendor_prepayments` table definition**

```sql

-- ===========================================================================
-- vendor_prepayments table (ADR-0015 §1, §10)
-- ===========================================================================
-- AP/Spend-owned record of cash paid to vendors before a final invoice exists.
-- Load-bearing primitive for retainers, deposits, and advances.
-- Status is computed at service layer (Layer 2 service code, ADR-0015 §1
-- "transition rules are Layer 2"); schema only holds the value.

CREATE TABLE vendor_prepayments (
  id uuid PRIMARY KEY,
  org_id uuid NOT NULL REFERENCES orgs(org_id),
  legal_entity_id uuid REFERENCES legal_entities(legal_entity_id),
  vendor_id uuid NOT NULL REFERENCES vendors(vendor_id),
  prepayment_type vendor_prepayment_type NOT NULL,
  status vendor_prepayment_status NOT NULL,
  payment_id uuid NOT NULL REFERENCES payments(payment_id),
  amount_original money_amount NOT NULL,
  amount_cad money_amount NOT NULL,
  fx_rate fx_rate,
  currency text NOT NULL,
  recognized_at date NOT NULL,
  expected_application_date date,
  tax_timing_choice tax_timing_choice NOT NULL,
  tax_amount_at_payment money_amount,
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by text NOT NULL,
  trace_id uuid NOT NULL,

  -- Layer-1 CHECK: restrict v1-active subset of closed enums per ADR-0010
  CONSTRAINT vendor_prepayments_type_v1_active CHECK (
    prepayment_type IN ('retainer', 'deposit', 'advance', 'other')
  ),
  CONSTRAINT vendor_prepayments_status_v1_active CHECK (
    status IN ('open', 'partially_applied', 'fully_applied', 'refunded')
  ),
  CONSTRAINT vendor_prepayments_tax_timing_v1_active CHECK (
    tax_timing_choice IN ('at_payment', 'at_final_invoice', 'review_required')
  )
);

CREATE INDEX vendor_prepayments_org_id_idx ON vendor_prepayments (org_id);
CREATE INDEX vendor_prepayments_vendor_id_idx ON vendor_prepayments (vendor_id);
CREATE INDEX vendor_prepayments_payment_id_idx ON vendor_prepayments (payment_id);
CREATE INDEX vendor_prepayments_status_idx ON vendor_prepayments (status)
  WHERE status IN ('open', 'partially_applied');
```

Note: this assumes `money_amount` and `fx_rate` are existing PostgreSQL domain types (created in earlier migrations). Verify with `grep -r "CREATE DOMAIN money_amount\|CREATE DOMAIN fx_rate" supabase/migrations/` before applying. If they do not exist, the plan needs adjustment to use `numeric` with a CHECK + a precision spec.

- [ ] **Step 2: Append `vendor_prepayment_applications` table definition**

```sql

-- ===========================================================================
-- vendor_prepayment_applications table (ADR-0015 §1, §10)
-- ===========================================================================
-- Links a vendor_prepayment to a bill that consumes (part of) it. Status of
-- the parent vendor_prepayment is computed at service layer from the sum of
-- application amount_originals.

CREATE TABLE vendor_prepayment_applications (
  id uuid PRIMARY KEY,
  org_id uuid NOT NULL REFERENCES orgs(org_id),
  vendor_prepayment_id uuid NOT NULL REFERENCES vendor_prepayments(id),
  bill_id uuid NOT NULL REFERENCES bills(bill_id),
  amount_original money_amount NOT NULL,
  amount_cad money_amount NOT NULL,
  applied_at date NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by text NOT NULL,
  trace_id uuid NOT NULL
);

CREATE INDEX vendor_prepayment_applications_org_id_idx
  ON vendor_prepayment_applications (org_id);
CREATE INDEX vendor_prepayment_applications_vendor_prepayment_id_idx
  ON vendor_prepayment_applications (vendor_prepayment_id);
CREATE INDEX vendor_prepayment_applications_bill_id_idx
  ON vendor_prepayment_applications (bill_id);
```

- [ ] **Step 3: Append RLS policies for both tables (org-scoped)**

```sql

-- ===========================================================================
-- RLS policies (org-scoped per chounting convention)
-- ===========================================================================
ALTER TABLE vendor_prepayments ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_prepayment_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY vendor_prepayments_org_scoped ON vendor_prepayments
  FOR ALL
  USING (
    org_id IN (
      SELECT org_id FROM user_org_roles
      WHERE user_id = (auth.uid())::uuid
    )
  );

CREATE POLICY vendor_prepayment_applications_org_scoped
  ON vendor_prepayment_applications
  FOR ALL
  USING (
    org_id IN (
      SELECT org_id FROM user_org_roles
      WHERE user_id = (auth.uid())::uuid
    )
  );
```

Note: verify `user_org_roles` is the correct membership table (chounting convention from `20240135000000_storage_substrate.sql`). If a different table provides org-membership info, adjust.

- [ ] **Step 4: Verify the file builds correctly so far**

Run: `wc -l supabase/migrations/20240138000000_phase5_vendor_prepayment_substrate.sql`
Expected: > 130 lines (header block + 5 enums + 2 tables + RLS).

Run: `grep -c '^CREATE TABLE' supabase/migrations/20240138000000_phase5_vendor_prepayment_substrate.sql`
Expected: `2`

---

## Task 4: Add column extensions to `payments`, `bills`, `org_settings`

**Context:** ADR-0015 §10 introduces new columns on three existing tables. `payments.payment_purpose` is **immutable post-insert** per Layer-1 CHECK (Subagent A verbatim). `org_settings.deposit_tax_timing_default` defaults to `review_required` per Subagent A's tax-timing 3-layer resolution rule.

**Files:**
- Modify (append): `supabase/migrations/20240138000000_phase5_vendor_prepayment_substrate.sql`

- [ ] **Step 1: Append `payments` extensions**

```sql

-- ===========================================================================
-- payments table extensions (ADR-0015 §10)
-- ===========================================================================

ALTER TABLE payments
  ADD COLUMN payment_state payment_state NOT NULL DEFAULT 'pending',
  ADD COLUMN payment_purpose payment_purpose NOT NULL DEFAULT 'other',
  ADD COLUMN bank_or_card_last4 text,
  ADD COLUMN merchant_identifier text,
  ADD COLUMN authorization_reference text,
  ADD COLUMN statement_appearance_date date;

-- Layer-1 CHECK: v1-active subset for payment_state + payment_purpose
ALTER TABLE payments
  ADD CONSTRAINT payments_state_v1_active CHECK (
    payment_state IN ('pending', 'paid', 'failed')
  ),
  ADD CONSTRAINT payments_purpose_v1_active CHECK (
    payment_purpose IN ('bill_payment', 'vendor_prepayment', 'vendor_refund', 'other')
  );

-- payment_purpose immutability (ADR-0015 §1; Subagent A verbatim:
-- "immutable post-insert (Layer 1 CHECK)"). Reclassification requires
-- reversal + new payment with corrected purpose per Reading B preservation.
CREATE OR REPLACE FUNCTION payments_payment_purpose_immutable()
RETURNS trigger AS $$
BEGIN
  IF OLD.payment_purpose IS DISTINCT FROM NEW.payment_purpose THEN
    RAISE EXCEPTION 'payment_purpose is immutable post-insert (ADR-0015 §1)'
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER payments_payment_purpose_immutable_trigger
  BEFORE UPDATE ON payments
  FOR EACH ROW
  EXECUTE FUNCTION payments_payment_purpose_immutable();
```

Note: `DEFAULT 'other'` for `payment_purpose` is conservative — existing rows pre-Phase-5 carry no semantic purpose. Service-layer code MUST set the purpose explicitly on new inserts; the default is for backfill safety only.

- [ ] **Step 2: Append `bills` extensions**

```sql

-- ===========================================================================
-- bills table extensions (ADR-0015 §10)
-- ===========================================================================
-- bills.lifecycle_state: canonical AP states per ADR-0010
-- bills.override_evidence_completeness: reserved Phase 2 stub (INV-DOC-001
-- enforcement deferred per substrate-now-enforcement-later D6 §6.8 cross-pattern)

CREATE TYPE bill_lifecycle_state AS ENUM (
  'draft',
  'pending_approval',
  'approved_for_payment',
  'partially_paid',
  'fully_paid',
  'voided',
  'cancelled'
);

ALTER TABLE bills
  ADD COLUMN lifecycle_state bill_lifecycle_state NOT NULL DEFAULT 'draft',
  ADD COLUMN override_evidence_completeness boolean NOT NULL DEFAULT false;
```

Note: All bill_lifecycle_state values are v1-active (no reserved values per Subagent B), so no CHECK constraint is needed beyond the type itself.

- [ ] **Step 3: Append `org_settings` extension**

```sql

-- ===========================================================================
-- org_settings table extension (ADR-0015 §4, §10)
-- ===========================================================================
-- deposit_tax_timing_default: per-org default for tax_timing_choice resolution.
-- v1 default is 'review_required' (Canadian-only; multi-jurisdiction deferred
-- post-v1 per Subagent A §4 verbatim).

ALTER TABLE org_settings
  ADD COLUMN deposit_tax_timing_default tax_timing_choice
    NOT NULL DEFAULT 'review_required',
  ADD CONSTRAINT org_settings_deposit_tax_timing_v1_active CHECK (
    deposit_tax_timing_default IN ('at_payment', 'at_final_invoice', 'review_required')
  );
```

- [ ] **Step 4: Verify total file shape**

Run: `wc -l supabase/migrations/20240138000000_phase5_vendor_prepayment_substrate.sql`
Expected: > 200 lines.

Run: `grep -E '^ALTER TABLE|^CREATE TABLE|^CREATE TYPE|^CREATE TRIGGER|^CREATE FUNCTION|^CREATE POLICY' supabase/migrations/20240138000000_phase5_vendor_prepayment_substrate.sql | wc -l`
Expected: ~16 (5 CREATE TYPE + 2 CREATE TABLE + 2 CREATE POLICY + 2 ALTER TABLE for payments + 1 CREATE FUNCTION + 1 CREATE TRIGGER + 1 ALTER TABLE for bills + 1 ALTER TABLE for org_settings + 1 CREATE TYPE for bill_lifecycle_state).

---

## Task 5: Apply migration to local DB and verify it runs cleanly

**Context:** Before writing any TypeScript that depends on the schema, verify the migration applies without error. Per CLAUDE.md "What 'done' means" §1, `pnpm agent:validate` is the satisfaction gate.

**Files:** none modified in this task.

- [ ] **Step 1: Reset local DB to a clean state and apply all migrations**

Run: `pnpm db:reset:clean`
Expected: command succeeds; output shows the new migration `20240138000000_phase5_vendor_prepayment_substrate` applied.

If the command name differs in chounting, find it: `cat package.json | grep -A 30 '"scripts"' | head -40` and use the appropriate db-reset command. Common chounting commands include `pnpm db:reset:clean` and `pnpm db:seed:all`.

- [ ] **Step 2: Spot-check that new tables exist**

Run (adjust for chounting's psql wrapper if any):
```bash
psql "$DATABASE_URL" -c "\d vendor_prepayments" 2>&1 | head -40
```
Expected: column listing shows all 18 columns + 3 CHECK constraints + indexes.

Run:
```bash
psql "$DATABASE_URL" -c "\d vendor_prepayment_applications" 2>&1 | head -20
```
Expected: column listing shows all 8 columns + indexes.

If `psql` isn't directly accessible, use `pnpm` script or Supabase CLI equivalent.

- [ ] **Step 3: Spot-check enum types exist**

Run:
```bash
psql "$DATABASE_URL" -c "\dT+ vendor_prepayment_type vendor_prepayment_status tax_timing_choice payment_purpose payment_state bill_lifecycle_state"
```
Expected: 6 enum types listed with their full membership.

If any type is missing or has wrong membership, fix the migration and re-apply with `pnpm db:reset:clean`.

---

## Task 6: Write Zod schema tests (TDD)

**Context:** Layer-2 of the 3-layer enforcement: the Zod boundary at the service entry point rejects reserved enum values before they reach service logic. Tests come first per TDD discipline.

**Files:**
- Create: `apps/web/src/shared/schemas/spend/vendorPrepayment.schema.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `apps/web/src/shared/schemas/spend/vendorPrepayment.schema.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import {
  VendorPrepaymentTypeSchema,
  VendorPrepaymentStatusSchema,
  TaxTimingChoiceSchema,
  PaymentPurposeSchema,
  PaymentStateSchema,
} from './vendorPrepayment.schema';

describe('VendorPrepaymentTypeSchema (Layer-2 boundary; ADR-0010)', () => {
  it('accepts v1-active values', () => {
    expect(() => VendorPrepaymentTypeSchema.parse('retainer')).not.toThrow();
    expect(() => VendorPrepaymentTypeSchema.parse('deposit')).not.toThrow();
    expect(() => VendorPrepaymentTypeSchema.parse('advance')).not.toThrow();
    expect(() => VendorPrepaymentTypeSchema.parse('other')).not.toThrow();
  });

  it('rejects reserved values', () => {
    expect(() => VendorPrepaymentTypeSchema.parse('security_deposit')).toThrow();
    expect(() => VendorPrepaymentTypeSchema.parse('prepaid_service')).toThrow();
    expect(() => VendorPrepaymentTypeSchema.parse('inventory_deposit')).toThrow();
    expect(() => VendorPrepaymentTypeSchema.parse('fixed_asset_deposit')).toThrow();
  });

  it('rejects unknown values', () => {
    expect(() => VendorPrepaymentTypeSchema.parse('bogus')).toThrow();
    expect(() => VendorPrepaymentTypeSchema.parse('')).toThrow();
  });
});

describe('VendorPrepaymentStatusSchema (Layer-2 boundary; ADR-0010)', () => {
  it('accepts v1-active values', () => {
    expect(() => VendorPrepaymentStatusSchema.parse('open')).not.toThrow();
    expect(() => VendorPrepaymentStatusSchema.parse('partially_applied')).not.toThrow();
    expect(() => VendorPrepaymentStatusSchema.parse('fully_applied')).not.toThrow();
    expect(() => VendorPrepaymentStatusSchema.parse('refunded')).not.toThrow();
  });

  it('rejects reserved values', () => {
    expect(() => VendorPrepaymentStatusSchema.parse('written_off')).toThrow();
    expect(() => VendorPrepaymentStatusSchema.parse('forfeited')).toThrow();
  });
});

describe('TaxTimingChoiceSchema (Layer-2 boundary; ADR-0010)', () => {
  it('accepts v1-active values', () => {
    expect(() => TaxTimingChoiceSchema.parse('at_payment')).not.toThrow();
    expect(() => TaxTimingChoiceSchema.parse('at_final_invoice')).not.toThrow();
    expect(() => TaxTimingChoiceSchema.parse('review_required')).not.toThrow();
  });

  it('rejects reserved values', () => {
    expect(() => TaxTimingChoiceSchema.parse('controller_chooses_per_invoice')).toThrow();
  });
});

describe('PaymentPurposeSchema (Layer-2 boundary; ADR-0010)', () => {
  it('accepts v1-active values', () => {
    expect(() => PaymentPurposeSchema.parse('bill_payment')).not.toThrow();
    expect(() => PaymentPurposeSchema.parse('vendor_prepayment')).not.toThrow();
    expect(() => PaymentPurposeSchema.parse('vendor_refund')).not.toThrow();
    expect(() => PaymentPurposeSchema.parse('other')).not.toThrow();
  });

  it('rejects reserved values', () => {
    expect(() => PaymentPurposeSchema.parse('customer_payment')).toThrow();
    expect(() => PaymentPurposeSchema.parse('employee_reimbursement')).toThrow();
    expect(() => PaymentPurposeSchema.parse('owner_reimbursement')).toThrow();
    expect(() => PaymentPurposeSchema.parse('tax_payment')).toThrow();
  });
});

describe('PaymentStateSchema (Layer-2 boundary; ADR-0010)', () => {
  it('accepts v1-active values', () => {
    expect(() => PaymentStateSchema.parse('pending')).not.toThrow();
    expect(() => PaymentStateSchema.parse('paid')).not.toThrow();
    expect(() => PaymentStateSchema.parse('failed')).not.toThrow();
  });

  it('rejects reserved values', () => {
    expect(() => PaymentStateSchema.parse('partially_returned')).toThrow();
    expect(() => PaymentStateSchema.parse('refunded')).toThrow();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail (no schema file yet)**

Run: `pnpm --filter @chounting/web test -- vendorPrepayment.schema.test`
Expected: FAIL with "Cannot find module './vendorPrepayment.schema'" or equivalent.

(If chounting's vitest filter syntax differs, use `pnpm --filter @chounting/web vitest run apps/web/src/shared/schemas/spend/vendorPrepayment.schema.test.ts`.)

---

## Task 7: Implement Zod schemas (Layer-2 boundary)

**Files:**
- Create: `apps/web/src/shared/schemas/spend/vendorPrepayment.schema.ts`

- [ ] **Step 1: Implement the schema file**

Create `apps/web/src/shared/schemas/spend/vendorPrepayment.schema.ts`:

```typescript
import { z } from 'zod';

/**
 * Closed-enum Zod schemas for vendor prepayment lifecycle (ADR-0015 §11).
 *
 * Layer-2 of the 3-layer ADR-0010 reserved-enum-states discipline:
 *   Layer 1: DB CHECK constraint (in supabase/migrations/20240138000000_phase5_vendor_prepayment_substrate.sql)
 *   Layer 2: this file — Zod schema rejects reserved enum values at service entry
 *   Layer 3: service code never emits reserved values (apps/web/src/services/spend/)
 *
 * Schemas list ONLY v1-active values. Reserved values defined in the DB enum
 * type but rejected at the Zod boundary before reaching service logic.
 */

export const VendorPrepaymentTypeSchema = z.enum([
  'retainer',
  'deposit',
  'advance',
  'other',
]);

export type VendorPrepaymentType = z.infer<typeof VendorPrepaymentTypeSchema>;

export const VendorPrepaymentStatusSchema = z.enum([
  'open',
  'partially_applied',
  'fully_applied',
  'refunded',
]);

export type VendorPrepaymentStatus = z.infer<typeof VendorPrepaymentStatusSchema>;

export const TaxTimingChoiceSchema = z.enum([
  'at_payment',
  'at_final_invoice',
  'review_required',
]);

export type TaxTimingChoice = z.infer<typeof TaxTimingChoiceSchema>;

export const PaymentPurposeSchema = z.enum([
  'bill_payment',
  'vendor_prepayment',
  'vendor_refund',
  'other',
]);

export type PaymentPurpose = z.infer<typeof PaymentPurposeSchema>;

export const PaymentStateSchema = z.enum([
  'pending',
  'paid',
  'failed',
]);

export type PaymentState = z.infer<typeof PaymentStateSchema>;
```

- [ ] **Step 2: Run tests to verify they pass**

Run: `pnpm --filter @chounting/web test -- vendorPrepayment.schema.test`
Expected: all tests PASS (5 describe blocks, ~12 it cases).

If any test fails, re-read the schema file + test file to find the mismatch and fix.

---

## Task 8: Write status function tests (TDD)

**Context:** Per Q3 lock + Subagent A verbatim, `vendor_prepayment_status` is computed at service layer (Layer 2 of service architecture) from the sum of `vendor_prepayment_applications.amount_original` against the parent `vendor_prepayments.amount_original`. Refunded state is set when a refund payment is recorded (separate signal, not derived from applications).

**Files:**
- Create: `apps/web/src/services/spend/vendorPrepaymentStatus.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `apps/web/src/services/spend/vendorPrepaymentStatus.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { computeVendorPrepaymentStatus } from './vendorPrepaymentStatus';

describe('computeVendorPrepaymentStatus (Layer-2 service-layer; ADR-0015 §1)', () => {
  it('returns "open" when no applications and not refunded', () => {
    const result = computeVendorPrepaymentStatus({
      amount_original: '100.00',
      applications: [],
      is_refunded: false,
    });
    expect(result).toBe('open');
  });

  it('returns "partially_applied" when sum of applications < amount_original', () => {
    const result = computeVendorPrepaymentStatus({
      amount_original: '100.00',
      applications: [{ amount_original: '40.00' }],
      is_refunded: false,
    });
    expect(result).toBe('partially_applied');
  });

  it('returns "partially_applied" when multiple applications sum to less than amount_original', () => {
    const result = computeVendorPrepaymentStatus({
      amount_original: '100.00',
      applications: [
        { amount_original: '30.00' },
        { amount_original: '40.00' },
      ],
      is_refunded: false,
    });
    expect(result).toBe('partially_applied');
  });

  it('returns "fully_applied" when sum of applications equals amount_original', () => {
    const result = computeVendorPrepaymentStatus({
      amount_original: '100.00',
      applications: [
        { amount_original: '60.00' },
        { amount_original: '40.00' },
      ],
      is_refunded: false,
    });
    expect(result).toBe('fully_applied');
  });

  it('returns "refunded" when is_refunded is true (overrides applications)', () => {
    const result = computeVendorPrepaymentStatus({
      amount_original: '100.00',
      applications: [{ amount_original: '40.00' }],
      is_refunded: true,
    });
    expect(result).toBe('refunded');
  });

  it('returns "refunded" when is_refunded is true with no applications', () => {
    const result = computeVendorPrepaymentStatus({
      amount_original: '100.00',
      applications: [],
      is_refunded: true,
    });
    expect(result).toBe('refunded');
  });

  it('throws when sum of applications exceeds amount_original (defensive guard)', () => {
    expect(() => computeVendorPrepaymentStatus({
      amount_original: '100.00',
      applications: [{ amount_original: '150.00' }],
      is_refunded: false,
    })).toThrow(/exceeds/i);
  });

  it('handles zero-amount original gracefully', () => {
    const result = computeVendorPrepaymentStatus({
      amount_original: '0.00',
      applications: [],
      is_refunded: false,
    });
    expect(result).toBe('open');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm --filter @chounting/web test -- vendorPrepaymentStatus.test`
Expected: FAIL with "Cannot find module './vendorPrepaymentStatus'" or equivalent.

---

## Task 9: Implement the status computation function

**Files:**
- Create: `apps/web/src/services/spend/vendorPrepaymentStatus.ts`

- [ ] **Step 1: Implement the function**

Create `apps/web/src/services/spend/vendorPrepaymentStatus.ts`:

```typescript
import { addMoney } from '@/shared/schemas/accounting/money.schema';
import type { VendorPrepaymentStatus } from '@/shared/schemas/spend/vendorPrepayment.schema';

/**
 * Computes vendor_prepayment_status from amount_original + applications + refund signal.
 *
 * Per ADR-0015 §1: status transitions are Layer-2 service-layer logic; the schema
 * holds the value but the rules live here. Status semantics:
 *   - 'refunded': set when a refund payment has been recorded against this prepayment;
 *      overrides application-derived status.
 *   - 'fully_applied': sum of application amount_originals equals amount_original.
 *   - 'partially_applied': sum > 0 but < amount_original.
 *   - 'open': no applications and not refunded.
 *
 * Layer-3 defensive: throws if sum of applications exceeds amount_original. This
 * scenario indicates upstream invariant violation; service callers must reject
 * the application before invoking this function. Throwing ensures the bug surfaces
 * immediately rather than producing a silently-incorrect status value.
 *
 * @param input - Pure inputs; no side effects, no DB access.
 * @returns A v1-active vendor_prepayment_status value.
 * @throws Error if applications sum exceeds amount_original.
 */
export function computeVendorPrepaymentStatus(input: {
  amount_original: string;
  applications: Array<{ amount_original: string }>;
  is_refunded: boolean;
}): VendorPrepaymentStatus {
  if (input.is_refunded) {
    return 'refunded';
  }

  if (input.applications.length === 0) {
    return 'open';
  }

  const appliedSum = input.applications.reduce(
    (acc, app) => addMoney(acc, app.amount_original),
    '0.00',
  );

  // Compare as numeric (money_amount is stored as string per chounting
  // convention; addMoney returns string sum). Compare via numeric coercion
  // is acceptable here because we only care about </=/> against amount_original
  // which lives in the same money_amount domain.
  const original = Number(input.amount_original);
  const applied = Number(appliedSum);

  if (applied > original) {
    throw new Error(
      `Vendor prepayment applications sum (${appliedSum}) exceeds amount_original (${input.amount_original}); ` +
      `upstream invariant violation — service callers must reject the application before this function is invoked.`,
    );
  }

  if (applied === original) {
    return 'fully_applied';
  }

  return 'partially_applied';
}
```

Note: `addMoney` is assumed to exist at `@/shared/schemas/accounting/money.schema` per the reconnaissance subagent's report ("balance check via `addMoney()` helpers"). If the actual import path or helper name differs, adjust the import. If `addMoney` is not exported from there, find the helper with `grep -rn 'export.*addMoney' apps/web/src/`.

- [ ] **Step 2: Run tests to verify they pass**

Run: `pnpm --filter @chounting/web test -- vendorPrepaymentStatus.test`
Expected: all 8 tests PASS.

If any test fails, re-read the function + test file to identify the mismatch. Common issues: floating-point comparison precision (use the money helpers, not raw `Number`), sign of comparison, refund-overrides-applications ordering.

---

## Task 10: Run full validation per push-readiness three-condition gate

**Context:** Per CLAUDE.md push-readiness three-condition gate condition 1, `pnpm test` (full suite) must be green at HEAD before push. This task verifies all chunk B5-1 session #1 code passes plus the existing test suite remains green.

**Files:** none modified.

- [ ] **Step 1: Run typecheck**

Run: `pnpm typecheck`
Expected: 0 errors.

If errors surface in chunk B5-1 code (`vendorPrepayment.schema.ts` or `vendorPrepaymentStatus.ts`), fix them. If errors surface elsewhere (existing code), they are pre-existing and must be documented per push-readiness gate's documented-deviation provision (rare — typecheck has been green at `ac1ff11`).

- [ ] **Step 2: Run agent:validate (typecheck + grep + Category A floor tests)**

Run: `pnpm agent:validate`
Expected: passes. Note that `crossOrgRlsIsolation.test.ts` may fail per item 13 carry-forward observation — this is the pre-existing failure documented at item 13. If it fails, that is the documented-deviation; this session does NOT fix it (item 13 fix lands at session #2).

- [ ] **Step 3: Run full test suite**

Run: `pnpm test`
Expected: all tests pass EXCEPT `crossOrgRlsIsolation.test.ts` Integration Test 3 (item 13 documented deviation).

If any other test fails, investigate. New failures in chunk B5-1 code must be fixed before push. Pre-existing failures other than item 13 trigger founder-domain election on whether to apply documented-deviation provision again or fix in this session.

---

## Task 11: Stage all changes + single bundled commit + push (Stage 6 session-close)

**Context:** Per founder bundled-accept on chunk B5-1 onset planning (Anchor 3): per-action §5.7 + (C-ii) bundled-explicit available. Single bundled commit at scope-level under "Phase 5 chunk B5-1 substantive session #1" framing.

**Files:** all 5 created/modified files staged together.

- [ ] **Step 1: Verify working-tree state**

Run: `git status --short`
Expected output:
```
 M supabase/migrations/20240137000000_create_source_document_with_audit_rpc.sql
?? apps/web/src/services/spend/
?? apps/web/src/shared/schemas/spend/
?? supabase/migrations/20240138000000_phase5_vendor_prepayment_substrate.sql
```

(Or with files listed individually if untracked content differs.)

- [ ] **Step 2: Stage exactly the chunk B5-1 session #1 files**

```bash
git add \
  supabase/migrations/20240137000000_create_source_document_with_audit_rpc.sql \
  supabase/migrations/20240138000000_phase5_vendor_prepayment_substrate.sql \
  apps/web/src/shared/schemas/spend/vendorPrepayment.schema.ts \
  apps/web/src/shared/schemas/spend/vendorPrepayment.schema.test.ts \
  apps/web/src/services/spend/vendorPrepaymentStatus.ts \
  apps/web/src/services/spend/vendorPrepaymentStatus.test.ts
```

- [ ] **Step 3: Verify staged diff matches expectation**

Run: `git diff --cached --stat`
Expected: 6 files changed (5 new + 1 modified for FT2). Line counts roughly: migration ~210 lines, schema file ~50 lines, schema test ~80 lines, status function ~50 lines, status test ~80 lines, FT2 fix ~6 lines net.

- [ ] **Step 4: Create the commit with chunk-grain message**

```bash
git commit -m "$(cat <<'EOF'
feat(spend): chunk B5-1 substantive session #1 — vendor prepayment substrate + state machine + FT2 ride-alongside

Phase 5 chunk B5-1 substantive session #1 lands foundational substrate for the
vendor prepayment lifecycle slice (slice-B-prepay) per ADR-0015 §1, §3, §4, §10,
§11. Mutation handlers + integration tests land at session #2 per (cadence-β-i-a).

Schema migration (single file per (mig-α)):
- 5 closed enums: vendor_prepayment_type, vendor_prepayment_status,
  tax_timing_choice, payment_purpose, payment_state (full membership; v1-active
  subset enforced via Layer-1 CHECK per ADR-0010).
- 2 new tables: vendor_prepayments (18 columns + 4 indexes + RLS) and
  vendor_prepayment_applications (8 columns + 3 indexes + RLS).
- Column extensions: payments (payment_state, payment_purpose with immutability
  trigger, reconciliation metadata), bills (lifecycle_state with new bill_lifecycle_state
  enum, override_evidence_completeness reserved-Phase-2 stub), org_settings
  (deposit_tax_timing_default with v1 default review_required).

State-machine substrate:
- Zod schemas at apps/web/src/shared/schemas/spend/vendorPrepayment.schema.ts
  (Layer-2 boundary; rejects reserved enum values).
- Pure status-computation function at apps/web/src/services/spend/vendorPrepaymentStatus.ts
  (Layer-3 service-layer foundation; defensive throw on application sum
  exceeding amount_original).

FT2 ride-alongside: corrects ADR-0013 §16 misattribution at
20240137000000_create_source_document_with_audit_rpc.sql lines 13-16; correct
citation is ledger_truth_model.md INV-AUDIT-001 leaf.

Reading B preservation (non-negotiable): no journal_entries / journal_lines
writers introduced; mutation handlers (session #2) call ledgerService.post inside
withInvariants per ADR-0011 §1.

Push-readiness three-condition gate: condition 1 (test-suite health) — item 13
(crossOrgRlsIsolation.test.ts duplicate-key) carries forward as documented
deviation; resolution scheduled at session #2 via (test-fix-α) pre-insert cleanup.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

- [ ] **Step 5: Push to origin/staging**

```bash
git push origin staging
```

Expected: push succeeds with `[hash..hash] staging -> staging`.

A `[coordination] warning: no session lock in use` warning is expected at commit time per item 10 state-divergence carry-forward observation — this is consistent with the (β-i) framework continue-carry-forward lock and does NOT block the push.

- [ ] **Step 6: Verify post-push state**

Run:
```bash
git status --short
git log --oneline -2
git rev-list --left-right --count origin/staging...HEAD
```

Expected:
- `git status --short`: clean (no output).
- `git log --oneline -2`: top commit shows `feat(spend): chunk B5-1 substantive session #1 ...` followed by `ac1ff11`.
- `git rev-list --left-right --count`: `0	0`.

If any of these don't match, the push did not complete cleanly — investigate before reporting Task 11 complete.

---

## Plan complete. Next steps after execution:

1. Update pickup file at `~/.claude/projects/-home-philc-projects-chounting/memory/project_phase_5_spend_initiative_pending.md` with session #1 completion state + carry-forward inventory adjustments (item 1 sub-decomposition: FT2 fired; FT1 still deferred; FT3 pending session #2).
2. Update MEMORY.md entry pointer at line 9 with session #1 completion framing.
3. Stage 6 session-close acknowledgment under (firing-β) (C-ii) bundled-explicit at stage-grain.

Session #2 plan covers: 4 mutation handlers + 7 integration test files per (test-γ) hybrid + (test-fix-α) pre-insert cleanup pattern at all 8 integration test files (1 existing crossOrgRlsIsolation + 7 new) + FT3 ride-alongside (recordMutation.ts:122-127 atomicity-claim docstring rephrasing) + item 13 fix (crossOrgRlsIsolation.test.ts pre-insert cleanup at beforeAll). Push-readiness gate condition 1 expected to transition from documented-deviation to met at session #2 push.

Session #3 covers: closeout entry (first Phase 5 friction-journal entry) + arc-grain observations + chunk B5-1 completion state recorded across pickup file + MEMORY.md.
