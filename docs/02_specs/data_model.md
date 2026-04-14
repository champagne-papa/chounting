# Data Model

The Phase 1.1 database schema: tables, columns, named constraints,
indexes, and row-level security policies. This file answers "what
shape is this table?" The companion file
`docs/02_specs/ledger_truth_model.md` answers "what rules does this
schema enforce, and why?"

**Source:** extracted from PLAN.md §2a, §2c, and §2e during Phase 1.1
closeout restructure. Constraint and trigger names verified against
`supabase/migrations/20240101000000_initial_schema.sql` and
`supabase/migrations/20240102000000_add_reversal_reason.sql`.

**Part 1** (this file) covers core tables, named CHECK constraints,
triggers, and the index plan.
**Part 2** (appended in a follow-up commit) covers RLS policies and
helper functions.

**Cross-references:**
- Rules and invariants: `docs/02_specs/ledger_truth_model.md`
- Architectural framing (Phase 1.1 service layer, authority gradient):
  `docs/00_product/product_vision.md` (The Thesis section)
- Phase 1 → Phase 2 schema reservations:
  `docs/03_architecture/phase_simplifications.md`
- ADR-001 (reversal semantics, seed material for the
  `journal_entries.reversal_reason` rationale below):
  `docs/07_governance/adr/0001-reversal-semantics.md`

**On CHECK and trigger references.** Named database constraints
(`CONSTRAINT name CHECK (...)`) and triggers are mentioned by exact
name on the table they belong to, with a one-line description and an
INV-ID cross-reference where applicable. The full SQL body of each
constraint and trigger function lives in
`ledger_truth_model.md` under the invariant that owns it, not here.
RLS policies are the exception: their full SQL is preserved in
Part 2 of this file, not in the truth model, because RLS is
data-scoping infrastructure rather than a ledger rule.

---

## Part 1 — Core Tables

This section covers all 24 tables in the current Phase 1.1 schema,
in the order they appear across
`supabase/migrations/20240101000000_initial_schema.sql` and its
follow-up migrations (002 through 007 — schema dependency order,
with follow-up migrations extending the initial schema).

Tables are documented in one of two treatment tiers:

- **Phase 1.1 active (full treatment, 11 tables):** `organizations`,
  `memberships`, `chart_of_accounts_templates`, `chart_of_accounts`,
  `fiscal_periods`, `journal_entries`, `journal_lines`, `tax_codes`,
  `audit_log`, `ai_actions`, `events`. These tables receive full
  column lists, named CHECK constraints with INV cross-references,
  trigger references, operational notes, and index rationales.
- **Phase 2+ reserved (terse treatment, 13 tables):** `customers`,
  `vendors`, `vendor_rules`, `invoices`, `invoice_lines`, `bills`,
  `bill_lines`, `payments`, `bank_accounts`, `bank_transactions`,
  `intercompany_relationships`, `agent_sessions`,
  `journal_entry_attachments`. These tables exist in the schema
  with columns, constraints, and RLS policies, but nothing writes
  to most of them in Phase 1.1. They receive column lists and a
  short Phase 2 note, without the full operational commentary.

---

### `organizations`

The root tenant table. Every other table with an `org_id` column
scopes to a row here. In the Phase 1.1 authority gradient,
`organizations` defines the tenancy boundary that RLS policies
enforce via `user_has_org_access(org_id)` helper function calls.

```sql
CREATE TABLE organizations (
  org_id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name                text NOT NULL,
  legal_name          text,
  industry            org_industry NOT NULL,
  functional_currency char(3) NOT NULL DEFAULT 'CAD',
  fiscal_year_start_month smallint NOT NULL DEFAULT 1
    CHECK (fiscal_year_start_month BETWEEN 1 AND 12),
  created_at          timestamptz NOT NULL DEFAULT now(),
  created_by          uuid REFERENCES auth.users(id)
);
```

An inline CHECK ensures `fiscal_year_start_month` is between 1 and
12. This is a local consistency constraint with no INV attribution.

**`functional_currency`** defaults to `'CAD'`. This is the entity's
base currency — the currency it reports in. Multi-currency
transactions convert to this currency via `journal_lines.amount_cad`
(see the `line_amount_cad_matches_fx` CHECK in the `journal_lines`
section). Phase 1.1 hard-codes all orgs to CAD; Phase 2 opens this
up.

**`industry`** drives Chart of Accounts template selection at org
creation. The industry enum includes healthcare, real_estate,
hospitality, trading, restaurant, and holding_company. Phase 1.1
seeds templates for two of these (`holding_company` and
`real_estate`) — see the seed block at the end of the migration.

**No named CHECKs, no triggers, no INV cross-references.** Indexes:
none — reads are by `org_id` primary key, no secondary index
needed.

---

### `memberships`

The user-to-org mapping. A user has a `role` within each org they
belong to, and a user can belong to multiple orgs. The `UNIQUE
(user_id, org_id)` constraint ensures exactly one role per user per
org.

```sql
CREATE TABLE memberships (
  membership_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id        uuid NOT NULL REFERENCES organizations(org_id) ON DELETE CASCADE,
  role          user_role NOT NULL,
  created_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, org_id)
);
```

**`role`** is the `user_role` enum: `executive`, `controller`, or
`ap_specialist`. Each role has different permissions — see
`docs/00_product/personas.md` for the authorization matrix. The RLS
helper `user_is_controller(org_id)` checks this column on
tenant-write policies that require elevated permissions (e.g.,
`fiscal_periods_insert`).

**`ON DELETE CASCADE` on both `user_id` and `org_id`.** The cascade
behavior is load-bearing for seed script reliability: when a test
tears down by deleting an auth user or an organization, the
membership rows clean up automatically. Without the cascade, seed
cleanup would leave orphaned `memberships` rows that violate the
foreign key on the next test run.

**Indexes:**

- `idx_memberships_user_org` on `(user_id, org_id)` — supports
  `user_has_org_access()` helper function lookups during RLS
  evaluation.
- `idx_memberships_org` on `(org_id)` — supports membership list
  queries (e.g., "list all users in this org").

**No named CHECKs, no triggers, no INV cross-references.**

---

### `chart_of_accounts_templates`

Pre-built IFRS-compliant Chart of Accounts templates, one per
industry. Seeded at migration time from the seed block at the end
of `20240101000000_initial_schema.sql`. This is the only table in
Phase 1.1 that is **not** tenant-scoped — the data is global
reference material available to all authenticated users.

```sql
CREATE TABLE chart_of_accounts_templates (
  template_id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  industry                 org_industry NOT NULL,
  account_code             text NOT NULL,
  account_name             text NOT NULL,
  account_type             account_type NOT NULL,
  parent_account_code      text,
  is_intercompany_capable  boolean NOT NULL DEFAULT false,
  sort_order               integer NOT NULL DEFAULT 0,
  UNIQUE (industry, account_code)
);
```

**Purpose.** When a new organization is created, the org creation
flow copies rows from this table (filtered by
`industry = org.industry`) into the tenant-scoped `chart_of_accounts`
table, stamping each copied row with the new `org_id`. This gives
every org a pre-populated CoA matching its industry without
requiring the user to build one from scratch.

**RLS exception.** Unlike tenant-scoped tables, the RLS policy for
this table is `FOR SELECT TO authenticated USING (true)` — any
authenticated user can read templates. This is intentional: the org
creation flow needs to read templates before the user has any
`memberships` row to grant org access. There is no INSERT / UPDATE /
DELETE policy because templates are seed-only; modifying them
requires a migration.

**Phase 1.1 seeded industries:** only `holding_company` and
`real_estate` are populated. The other four enum values
(`healthcare`, `hospitality`, `trading`, `restaurant`) exist in the
enum but have no template rows. Phase 2 seeds additional templates
as new industries onboard.

**No named CHECKs, no triggers, no INV cross-references. No indexes
beyond the primary key and the UNIQUE constraint.**

---

### `chart_of_accounts`

The per-org Chart of Accounts. Each row is an account code (e.g.,
`1000` = Cash, `4000` = Revenue) with a name, type, and optional
parent account for hierarchy. Rows are initially copied from
`chart_of_accounts_templates` at org creation, but orgs may add,
deactivate, or rename accounts after that.

```sql
CREATE TABLE chart_of_accounts (
  account_id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id                   uuid NOT NULL REFERENCES organizations(org_id) ON DELETE CASCADE,
  account_code             text NOT NULL,
  account_name             text NOT NULL,
  account_type             account_type NOT NULL,
  parent_account_id        uuid REFERENCES chart_of_accounts(account_id),
  is_intercompany_capable  boolean NOT NULL DEFAULT false,
  is_active                boolean NOT NULL DEFAULT true,
  created_at               timestamptz NOT NULL DEFAULT now(),
  UNIQUE (org_id, account_code)
);
```

**Self-referential foreign key.** `parent_account_id` references
this same table, creating a hierarchy (e.g., `1410 Accumulated
Depreciation - Buildings` is a child of `1400 Buildings`). The
hierarchy supports roll-up reporting — a P&L for the parent account
sums itself plus all descendants. Phase 1.1 installs the self-FK
and seeds parent-child relationships in the real_estate template,
but the roll-up query (recursive CTE or materialized path) is a
Phase 2 obligation — see
`docs/09_briefs/phase-1.2/obligations.md`.

**`account_type`** is the `account_type` enum: `asset`, `liability`,
`equity`, `revenue`, `expense`. This drives normal-balance behavior
(assets and expenses normally debit; liabilities, equity, and
revenue normally credit) and report classification.

**`is_active`** lets an org "archive" an account without deleting
it. Historical journal entries referencing the account remain
valid; new entries cannot target it. The `listChartOfAccounts`
agent tool filters `is_active = true` by default and
`postJournalEntry` service validates that the target account is
active — see `docs/09_briefs/phase-1.2/agent_architecture.md`.

**`is_intercompany_capable`** flags accounts that can participate in
intercompany transactions (e.g., "Intercompany Receivables"). The
flag drives Phase 2 intercompany matching but has no Phase 1.1
enforcement behavior.

**Indexes:**

- `idx_coa_org` on `(org_id, account_code)` — supports the common
  lookup "find account by code within an org" used by the manual
  journal entry form and agent tools.

**No named CHECKs, no triggers, no INV cross-references.**

---

### `fiscal_periods`

The monthly accounting windows for each org. One row per month per
org. The `is_locked` flag is the enforcement hook for
INV-LEDGER-002 — once a period is locked, no new journal entries
can post to it.

```sql
CREATE TABLE fiscal_periods (
  period_id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id             uuid NOT NULL REFERENCES organizations(org_id) ON DELETE CASCADE,
  name               text NOT NULL,
  start_date         date NOT NULL,
  end_date           date NOT NULL,
  is_locked          boolean NOT NULL DEFAULT false,
  locked_at          timestamptz,
  locked_by_user_id  uuid REFERENCES auth.users(id),
  CHECK (end_date >= start_date),
  UNIQUE (org_id, start_date, end_date)
);
```

An inline CHECK ensures `end_date >= start_date`. This is a local
consistency constraint with no INV attribution.

**The lock mechanism.** `is_locked` is `false` by default. A
controller can lock a period via `periodService.lock()` (which
writes `is_locked = true`, `locked_at = now()`, and
`locked_by_user_id = ctx.caller.user_id` inside a transaction that
also writes an audit_log entry). Once locked, the
`trg_enforce_period_not_locked` trigger on `journal_lines` (see
that table's section) rejects any new line insert whose parent
`journal_entry.fiscal_period_id` resolves to a locked period.

The lock is enforced at the **database** layer (via trigger) rather
than at the service layer. The service layer's `periodService.isOpen()`
is a pre-flight optimization — it lets the service return a clean
`ServiceError('PERIOD_LOCKED', ...)` before `BEGIN` instead of
catching the trigger exception at `COMMIT`. But the authoritative
enforcement is the trigger, because an attacker bypassing the
service layer would still hit the trigger at commit time. The
trigger uses `SELECT ... FOR UPDATE` to prevent the race where two
transactions both see "open" and both commit around a concurrent
lock. **INV-LEDGER-002** — see `docs/02_specs/ledger_truth_model.md`.

**Generation.** Fiscal periods are created by
`generateFiscalPeriods()` (in `src/services/org/`) at org creation
time. The function generates 24 monthly periods starting from the
org's fiscal year start month and working forward. See
`tests/unit/generateFiscalPeriods.test.ts`.

**Indexes:**

- `idx_fiscal_periods_org_dates` on `(org_id, start_date, end_date)`
  — supports the common lookup "find the open period for this
  entry_date" used by `periodService.isOpen()`.

---

### `intercompany_relationships`

*Phase 2+ reserved — terse treatment.*

```sql
CREATE TABLE intercompany_relationships (
  relationship_id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_a_id                     uuid NOT NULL REFERENCES organizations(org_id),
  org_b_id                     uuid NOT NULL REFERENCES organizations(org_id),
  org_a_due_to_account_id      uuid REFERENCES chart_of_accounts(account_id),
  org_b_due_from_account_id    uuid REFERENCES chart_of_accounts(account_id),
  created_at                   timestamptz NOT NULL DEFAULT now(),
  CHECK (org_a_id <> org_b_id),
  UNIQUE (org_a_id, org_b_id)
);
```

An inline CHECK ensures `org_a_id <> org_b_id` (a relationship
cannot self-reference). No INV attribution — local consistency
constraint. The dual FK to `organizations` makes this table a
pure junction table between two tenant rows.

**Phase 1.1 status:** empty. The table carries a
`COMMENT ON TABLE intercompany_relationships IS 'Populated in Phase
2 by AP Agent. Do not write to manually.'` — the AP Agent learns
intercompany relationships from real transactions and populates
this table in Phase 2. Phase 1.1 creates the schema so Phase 2
wiring is mechanical.

---

### `journal_entries`

The header row of a financial transaction. One journal entry owns
one or more journal lines. In the Phase 1.1 authority gradient,
journal entries are written by `journalEntryService.post()` (Layer 2)
inside a transaction that the deferred constraint on `journal_lines`
(Layer 1) validates at COMMIT.

```sql
CREATE TABLE journal_entries (
  journal_entry_id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id                    uuid NOT NULL REFERENCES organizations(org_id) ON DELETE RESTRICT,
  fiscal_period_id          uuid NOT NULL REFERENCES fiscal_periods(period_id),
  entry_number              bigint NOT NULL,                -- added by migration 004
  entry_date                date NOT NULL,
  description               text NOT NULL,
  reference                 text,
  source                    journal_entry_source NOT NULL,  -- 'manual' | 'agent' | 'import'
  entry_type                entry_type NOT NULL DEFAULT 'regular',  -- added by migration 005
  intercompany_batch_id     uuid,                           -- reserved for Phase 2
  reverses_journal_entry_id uuid REFERENCES journal_entries(journal_entry_id),
  idempotency_key           uuid,
  reversal_reason           text,                           -- added by migration 002
  created_at                timestamptz NOT NULL DEFAULT now(),
  created_by                uuid REFERENCES auth.users(id)
);
```

**Named CHECK constraints on this table:**

- `idempotency_required_for_agent` — `source <> 'agent' OR idempotency_key IS NOT NULL`. Enforces that any journal entry originating from the agent layer carries an idempotency key. Manual and import sources may omit it. **INV-IDEMPOTENCY-001** — see `docs/02_specs/ledger_truth_model.md`.
- `reversal_reason_required_when_reversing` — `reverses_journal_entry_id IS NULL OR (reversal_reason IS NOT NULL AND length(trim(reversal_reason)) > 0)`. Added by migration `20240102000000_add_reversal_reason.sql`. Enforces that any journal entry reversing another carries a non-empty explanation. **INV-REVERSAL-002** — see `docs/02_specs/ledger_truth_model.md`.

**Named UNIQUE constraint on this table:**

- `unique_entry_number_per_org_period` — `UNIQUE (org_id, fiscal_period_id, entry_number)`. Added by migration `20240104000000_add_entry_number.sql`. Enforces sequential entry numbering within each (org, period) pair for audit traceability — auditors expect to see entry numbers 1, 2, 3... within a period with no gaps. `journalEntryService.post()` populates `entry_number` by computing `MAX(entry_number) + 1` within the target (org, period) scope at post time. Local consistency constraint with no INV attribution — the audit-traceability rule is enforced by this UNIQUE alone, not by any INV.

**`entry_type` enum (added by migration 005).** The `entry_type` enum has four values: `'regular'` (the default — ordinary business transactions), `'adjusting'` (period-end adjustments), `'closing'` (year-end closing entries), and `'reversing'` (reversal entries with `reverses_journal_entry_id` populated). Phase 1.1 posts all entries with `entry_type = 'regular'` by default and sets `entry_type = 'reversing'` automatically when `reverses_journal_entry_id` is populated. Adjusting and closing workflows are Phase 2+ scope.

**Triggers:** none directly attached to `journal_entries`. The deferred balance constraint and the period-lock trigger attach to `journal_lines` (see below).

**Service-layer enforcement:** the reversal mirror check — verifying that a reversal's lines are the mirror of the original entry's lines with sides swapped — runs in `src/services/accounting/journalEntryService.ts` before `BEGIN`. This rule is not enforced by a database constraint. **INV-REVERSAL-001** — see `docs/02_specs/ledger_truth_model.md`.

**Append-only in practice:** `journal_entries` has RLS policies `journal_entries_no_update` and `journal_entries_no_delete` that use `USING (false)`, making the table write-once through any user-scoped client. The service-role client (used by `journalEntryService`) bypasses RLS but is only called by `withInvariants()`-wrapped service functions that do not issue UPDATE or DELETE. Corrections happen via reversal entries, not updates.

**Self-referential foreign key.** The `reverses_journal_entry_id` column references `journal_entries(journal_entry_id)`, creating a self-FK. Phase 1.1 allows reversing a reversal (the schema permits the chain) but the UI does not visualize reversal chains — see `docs/03_architecture/ui_architecture.md` Reversal UI section.

**On the placement of `reversal_reason`.** The `reversal_reason` column lives on `journal_entries`, not on `audit_log`. This is the single placement decision this section carries in full because the reasoning was contested during v0.5.5 development and any future reader considering moving the column needs to see the full trade-off before touching it. The rationale is preserved verbatim below; it is also the seed material for ADR-001.

> **Why `reversal_reason` lives on `journal_entries` and not `audit_log`:**
>
> The initial instinct was to put the reversal reason in `audit_log` — "the reason is metadata about the correction, not part of the entry itself." This is wrong for three reasons:
>
> **First, the audit_log is a write-once event stream.** A reader querying "why was this entry reversed?" would have to join `journal_entries` to `audit_log` on `entity_id = journal_entry_id AND action = 'reverse'`, filter for the audit row with the matching trace_id, and pull `before_state.reversal_reason` out of a JSON blob. This is indirection that makes the reason invisible in every journal entry query a controller writes. The reason needs to live where the query lives.
>
> **Second, a reversal without a reason is not a legal reversal.** The rule that "every reversal must explain itself" is a ledger rule, not an audit rule. It belongs in the same enforcement layer as "every reversal must mirror the original" — the database, not the log. Putting it in `audit_log` would mean the rule is enforced by the application writing the audit row, which is exactly the kind of rule-in-application-code the Two Laws prohibit. Putting it on `journal_entries` with a CHECK constraint (`reversal_reason_required_when_reversing`) makes the rule a schema fact.
>
> **Third, it survives reversal-of-reversal.** If entry A is reversed by entry B with reason "misclassified vendor" and later entry B itself is reversed by entry C with reason "was actually the right classification after all," the reason history is visible as two rows in `journal_entries`, not as a nested JSON blob in `audit_log`. Each link in the chain carries its own reason in the same query surface.
>
> The cost of putting it here is one nullable text column on every journal entry, with a CHECK constraint that only activates for rows where `reverses_journal_entry_id` is populated. That is a small cost. The benefit is that "show me every reversal in the last month and its reason" is a single SELECT from a single table.

**Indexes:**

- `idx_je_org_period` on `(org_id, fiscal_period_id)` — supports period-scoped P&L queries and the AI Action Review queue.
- `idx_je_org_intercompany` on `(org_id, intercompany_batch_id) WHERE intercompany_batch_id IS NOT NULL` — partial index for intercompany batch lookups. Empty in Phase 1.1 but installed for Phase 2 mechanical use.
- `idx_je_reverses` on `(reverses_journal_entry_id) WHERE reverses_journal_entry_id IS NOT NULL` — partial index supporting the reversal chain queries (the Phase 2 reversal-chain view uses this).

---

### `tax_codes`

Per-jurisdiction tax rates (GST, HST, PST, VAT, etc.). Seeded at
migration time from `20240103000000_seed_tax_codes.sql`.

```sql
CREATE TABLE tax_codes (
  tax_code_id     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          uuid REFERENCES organizations(org_id) ON DELETE CASCADE,
  code            text NOT NULL,
  rate            numeric(6,4) NOT NULL,
  jurisdiction    text NOT NULL,
  effective_from  date NOT NULL,
  effective_to    date,
  CHECK (effective_to IS NULL OR effective_to >= effective_from)
);
```

An inline CHECK ensures `effective_to IS NULL OR effective_to >=
effective_from`. This is a local consistency constraint enforcing
that a tax code's effective end date (if present) is not before its
start date. No INV attribution.

**Nullable `org_id`.** Unlike other tenant-scoped tables, `org_id`
is nullable here. A NULL `org_id` means "global tax code available
to all orgs" — used for the Canada-wide GST + PST_BC seed rates. A
non-NULL `org_id` means "org-specific tax code" — Phase 2 allows
orgs to define custom tax codes (e.g., a municipal tax not in the
seed set).

**RLS exception.** The RLS policy is
`FOR SELECT USING (org_id IS NULL OR user_has_org_access(org_id))`
— any authenticated user sees global codes plus codes scoped to
their orgs. This is the second of the standard-pattern exceptions to
tenant RLS (the first being `chart_of_accounts_templates`).

**Phase 1.1 seed.** The seed in migration
`20240103000000_seed_tax_codes.sql` populates exactly two rows:
federal **GST** at 5% (jurisdiction `CA`, effective from
`2024-01-01`) and British Columbia **PST_BC** at 7% (jurisdiction
`CA-BC`, effective from `2024-01-01`). Both are seeded with
`org_id = NULL` to make them visible to every org via the
nullable-org RLS exception. **BC uses GST + PST as two separate
taxes, not HST** — BC had HST briefly but reverted to the
GST + PST split. Other provincial codes (HST_ON, HST_NS, HST_NB,
QST_QC, PST_SK, PST_MB) are Phase 2+ additions as new orgs onboard
in those provinces. No historical rate rows are seeded — when
provincial rates change, a Phase 2+ migration adds a new row with
the new `effective_from` date, and `effective_to` is set on the
prior row so that historical entries continue to reference the
rate in effect when they were created.

**Indexes:**

- `idx_tax_codes_jurisdiction` on `(jurisdiction, effective_from)` —
  supports the common lookup "find the active tax code for this
  jurisdiction on this date."

**Foreign key from `journal_lines`:** `journal_lines.tax_code_id`
references `tax_codes(tax_code_id)`. Every journal line may
optionally carry a tax code. Line-level tax attribution is the
Phase 1.1 approach; Phase 2+ may add bill-level and invoice-level
tax aggregation for reporting.

**No named CHECKs, no triggers, no INV cross-references.**

---

### `journal_lines`

The debit and credit lines that make up a journal entry. Every line belongs to exactly one `journal_entries` row via `journal_entry_id`, and the set of lines for a given entry must balance (sum of debits = sum of credits) at COMMIT. This is the single most constraint-dense table in the schema, because it is where the ledger rules are mechanically enforced.

```sql
CREATE TABLE journal_lines (
  journal_line_id    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  journal_entry_id   uuid NOT NULL REFERENCES journal_entries(journal_entry_id) ON DELETE CASCADE,
  account_id         uuid NOT NULL REFERENCES chart_of_accounts(account_id),
  description        text,
  debit_amount       numeric(20,4) NOT NULL DEFAULT 0,
  credit_amount      numeric(20,4) NOT NULL DEFAULT 0,
  tax_code_id        uuid REFERENCES tax_codes(tax_code_id),
  currency           char(3) NOT NULL DEFAULT 'CAD',
  amount_original    numeric(20,4) NOT NULL DEFAULT 0,
  amount_cad         numeric(20,4) NOT NULL DEFAULT 0,
  fx_rate            numeric(20,8) NOT NULL DEFAULT 1.0
);
```

**On money columns.** All monetary values use `numeric(20,4)` at the database level. The service layer and API boundary carry money as Zod-validated strings, never as JavaScript `Number`, to prevent floating-point drift across the boundary. **INV-MONEY-001** — see `docs/02_specs/ledger_truth_model.md`.

**Named CHECK constraints on this table:**

- `line_amounts_nonneg` — `debit_amount >= 0 AND credit_amount >= 0`. Neither column can be negative; debits and credits are always non-negative values with direction expressed by column choice. **INV-LEDGER-006** — see `docs/02_specs/ledger_truth_model.md`.
- `line_is_debit_xor_credit` — `(debit_amount = 0) OR (credit_amount = 0)`. A line is either a debit or a credit, never both. **INV-LEDGER-004** — see `docs/02_specs/ledger_truth_model.md`.
- `line_is_not_all_zero` — `debit_amount > 0 OR credit_amount > 0`. A line must have a non-zero amount on one side. Combined with `line_is_debit_xor_credit`, exactly one of the two is positive. **INV-LEDGER-005** — see `docs/02_specs/ledger_truth_model.md`.
- `line_amount_original_matches_base` — `amount_original = debit_amount + credit_amount`. The original-currency amount equals whichever of debit or credit is populated (the other is zero per the XOR rule). Ties the multi-currency view to the functional-currency view at the row level. **INV-MONEY-002** — see `docs/02_specs/ledger_truth_model.md`.
- `line_amount_cad_matches_fx` — `amount_cad = ROUND(amount_original * fx_rate, 4)`. The CAD amount must match the FX-adjusted original, rounded to four decimal places. Enforces that `fx_rate` is a real multiplier, not decoration. **INV-MONEY-003** — see `docs/02_specs/ledger_truth_model.md`.

**Triggers on this table:**

- `trg_enforce_journal_entry_balance` — `CONSTRAINT TRIGGER`, `DEFERRABLE INITIALLY DEFERRED`, fires `AFTER INSERT OR UPDATE OR DELETE` on each row. Aggregates `SUM(debit_amount)` and `SUM(credit_amount)` for the parent `journal_entry_id` and raises `check_violation` if they differ. Because the trigger is `DEFERRABLE INITIALLY DEFERRED`, the check runs at `COMMIT` rather than at statement time, allowing a service function to insert multiple lines within a single transaction without a transient imbalance failing the first insert. **INV-LEDGER-001** — the deferred constraint is one of the five Category A floor invariants. See `docs/02_specs/ledger_truth_model.md` and `tests/integration/unbalancedJournalEntry.test.ts`.
- `trg_enforce_period_not_locked` — `BEFORE INSERT OR UPDATE` on each row. Looks up the parent `journal_entries.fiscal_period_id`, then does `SELECT is_locked FROM fiscal_periods WHERE period_id = ? FOR UPDATE`. The `FOR UPDATE` row lock is essential: it serializes the period-lock read against any concurrent period-lock transaction, preventing the race where two transactions both see "period is open" and both commit while the period is being locked. **INV-LEDGER-002** — one of the five Category A floor invariants. See `docs/02_specs/ledger_truth_model.md` and `tests/integration/lockedPeriodRejection.test.ts`.

**On the absence of an explicit multi-line insertion guard.** The service layer relies on the deferred constraint alone to enforce balance. `journalEntryService.post()` does not re-check debit = credit in application code before `BEGIN` — the deferred constraint at `COMMIT` is the single source of truth. An application-layer check would be duplicate enforcement that can drift from the database truth. See `docs/03_architecture/phase_simplifications.md` for the discipline of "one enforcement point per rule."

**Indexes:**

- `idx_jl_entry` on `(journal_entry_id)` — supports loading all lines for a journal entry (the common read pattern for detail views and P&L aggregation).
- `idx_jl_account` on `(account_id)` — supports account-level aggregation (the common pattern for trial balance and P&L reports).

**Cascade behavior.** `ON DELETE CASCADE` on `journal_entry_id` means that deleting a `journal_entries` row (which the RLS policies currently prevent via `journal_entries_no_delete USING (false)`) would cascade to remove its lines. This is defense in depth: even if the no-delete RLS is ever weakened, the line cleanup remains automatic rather than leaving orphaned rows. Phase 1.1 never exercises the cascade because no path deletes journal entries.

---

### `vendors`

*Phase 2+ reserved — terse treatment.*

```sql
CREATE TABLE vendors (
  vendor_id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id                     uuid NOT NULL REFERENCES organizations(org_id) ON DELETE CASCADE,
  name                       text NOT NULL,
  email                      text,
  tax_id                     text,
  default_currency           char(3) NOT NULL DEFAULT 'CAD',
  is_intercompany_entity_id  uuid REFERENCES organizations(org_id),
  is_active                  boolean NOT NULL DEFAULT true,
  created_at                 timestamptz NOT NULL DEFAULT now()
);
```

**`is_intercompany_entity_id`** is a nullable self-referential FK
back to `organizations` — when populated, it means "this vendor is
actually another organization in this family office." The AP Agent
(Phase 2) uses this to surface intercompany transactions for
reciprocal entry proposal.

**Phase 1.1 status:** empty. The AP Agent populates this table in
Phase 2. **Indexes:** `idx_vendors_org` on `(org_id)`.

---

### `vendor_rules`

*Phase 2+ reserved — terse treatment.*

```sql
CREATE TABLE vendor_rules (
  rule_id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id              uuid NOT NULL REFERENCES organizations(org_id) ON DELETE CASCADE,
  vendor_id           uuid NOT NULL REFERENCES vendors(vendor_id) ON DELETE CASCADE,
  default_account_id  uuid REFERENCES chart_of_accounts(account_id),
  autonomy_tier       autonomy_tier NOT NULL DEFAULT 'always_confirm',
  created_at          timestamptz NOT NULL DEFAULT now(),
  created_by          uuid REFERENCES auth.users(id),
  approved_at         timestamptz,
  approved_by         uuid REFERENCES auth.users(id)
);
```

**`autonomy_tier`** is the `autonomy_tier` enum:
`always_confirm`, `notify_auto`, or `silent`. Phase 1.1 reserves
this column but does not act on it — every mutating action is
always-confirm in Phase 1. Phase 2+ allows a controller to promote
specific vendor rules to `notify_auto` (the Phase 2+ trust
escalation path). See
`docs/09_briefs/phase-1.2/agent_architecture.md` Agent Autonomy
Model section.

**Phase 1.1 status:** empty. **Indexes:** `idx_vendor_rules_org_vendor`
on `(org_id, vendor_id)`.

---

### `customers`

*Phase 2+ reserved — terse treatment.*

```sql
CREATE TABLE customers (
  customer_id  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id       uuid NOT NULL REFERENCES organizations(org_id) ON DELETE CASCADE,
  name         text NOT NULL,
  email        text,
  tax_id       text,
  is_active    boolean NOT NULL DEFAULT true,
  created_at   timestamptz NOT NULL DEFAULT now()
);
```

**Phase 1.1 status:** empty. Customer management lands in Phase 2+
alongside the Accounts Receivable workflow (which is later than AP
per the Phase 2 priority order). **Indexes:** `idx_customers_org`
on `(org_id)`.

---

### `invoices`

*Phase 2+ reserved — terse treatment.*

```sql
CREATE TABLE invoices (
  invoice_id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id            uuid NOT NULL REFERENCES organizations(org_id) ON DELETE CASCADE,
  customer_id       uuid NOT NULL REFERENCES customers(customer_id),
  invoice_number    text NOT NULL,
  issue_date        date NOT NULL,
  due_date          date,
  status            text NOT NULL DEFAULT 'draft',
  currency          char(3) NOT NULL DEFAULT 'CAD',
  amount_original   numeric(20,4) NOT NULL DEFAULT 0,
  amount_cad        numeric(20,4) NOT NULL DEFAULT 0,
  fx_rate           numeric(20,8) NOT NULL DEFAULT 1.0,
  created_at        timestamptz NOT NULL DEFAULT now()
);
```

**Phase 1.1 status:** empty. **Indexes:** `idx_invoices_org_customer`
on `(org_id, customer_id, status)`.

---

### `invoice_lines`

*Phase 2+ reserved — terse treatment.*

```sql
CREATE TABLE invoice_lines (
  invoice_line_id  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id       uuid NOT NULL REFERENCES invoices(invoice_id) ON DELETE CASCADE,
  description      text NOT NULL,
  quantity         numeric(20,4) NOT NULL DEFAULT 1,
  unit_price       numeric(20,4) NOT NULL DEFAULT 0,
  amount_original  numeric(20,4) NOT NULL DEFAULT 0,
  amount_cad       numeric(20,4) NOT NULL DEFAULT 0
);
```

**Phase 1.1 status:** empty. No indexes beyond the primary key.

---

### `bills`

*Phase 2+ reserved — terse treatment.*

```sql
CREATE TABLE bills (
  bill_id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id            uuid NOT NULL REFERENCES organizations(org_id) ON DELETE CASCADE,
  vendor_id         uuid NOT NULL REFERENCES vendors(vendor_id),
  bill_number       text,
  issue_date        date NOT NULL,
  due_date          date,
  status            text NOT NULL DEFAULT 'draft',
  currency          char(3) NOT NULL DEFAULT 'CAD',
  amount_original   numeric(20,4) NOT NULL DEFAULT 0,
  amount_cad        numeric(20,4) NOT NULL DEFAULT 0,
  fx_rate           numeric(20,8) NOT NULL DEFAULT 1.0,
  created_at        timestamptz NOT NULL DEFAULT now()
);
```

**Phase 1.1 status:** empty. The AP Agent populates bills in Phase 2
from email ingestion + OCR. **Indexes:** `idx_bills_org_vendor`
on `(org_id, vendor_id, status)`.

---

### `bill_lines`

*Phase 2+ reserved — terse treatment.*

```sql
CREATE TABLE bill_lines (
  bill_line_id     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bill_id          uuid NOT NULL REFERENCES bills(bill_id) ON DELETE CASCADE,
  account_id       uuid REFERENCES chart_of_accounts(account_id),
  description      text NOT NULL,
  amount           numeric(20,4) NOT NULL CHECK (amount > 0),
  amount_original  numeric(20,4) NOT NULL DEFAULT 0,
  amount_cad       numeric(20,4) NOT NULL DEFAULT 0
);
```

An inline CHECK ensures `amount > 0` (bill line amounts must be
positive). Local consistency constraint, no INV attribution.

**Phase 1.1 status:** empty. No indexes beyond the primary key.

---

### `payments`

*Phase 2+ reserved — terse treatment.*

```sql
CREATE TABLE payments (
  payment_id    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id        uuid NOT NULL REFERENCES organizations(org_id) ON DELETE CASCADE,
  payment_date  date NOT NULL,
  amount        numeric(20,4) NOT NULL,
  currency      char(3) NOT NULL DEFAULT 'CAD',
  created_at    timestamptz NOT NULL DEFAULT now()
);
```

**Phase 1.1 status:** empty. Minimal schema — Phase 2 extends with
bill-matching and allocation columns once the real workflow is
clear. No indexes beyond the primary key.

---

### `bank_accounts`

*Phase 2+ reserved — terse treatment.*

```sql
CREATE TABLE bank_accounts (
  bank_account_id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id                    uuid NOT NULL REFERENCES organizations(org_id) ON DELETE CASCADE,
  name                      text NOT NULL,
  institution               text,
  account_number_last_four  text,
  currency                  char(3) NOT NULL DEFAULT 'CAD',
  is_active                 boolean NOT NULL DEFAULT true
);
```

**Phase 1.1 status:** empty. Bank feeds are a Phase 2 feature via
Flinks (Canadian institutions). No indexes beyond the primary key.

---

### `bank_transactions`

*Phase 2+ reserved — terse treatment.*

```sql
CREATE TABLE bank_transactions (
  bank_transaction_id  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id               uuid NOT NULL REFERENCES organizations(org_id) ON DELETE CASCADE,
  bank_account_id      uuid NOT NULL REFERENCES bank_accounts(bank_account_id),
  posted_at            timestamptz NOT NULL,
  description          text,
  currency             char(3) NOT NULL DEFAULT 'CAD',
  amount_original      numeric(20,4) NOT NULL DEFAULT 0,
  amount_cad           numeric(20,4) NOT NULL DEFAULT 0,
  fx_rate              numeric(20,8) NOT NULL DEFAULT 1.0
);
```

**Phase 1.1 status:** empty. Populated by Flinks bank feed
integration in Phase 2. **Indexes:** `idx_bank_tx_org` on
`(org_id, bank_account_id, posted_at)`.

---

### `audit_log`

The immutable log of every mutation in the system. Written
synchronously by `recordMutation()` (in `src/services/audit/`)
inside the same transaction as the mutation it logs.

```sql
CREATE TABLE audit_log (
  audit_log_id     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id           uuid NOT NULL REFERENCES organizations(org_id) ON DELETE CASCADE,
  user_id          uuid REFERENCES auth.users(id),
  session_id       uuid,
  trace_id         uuid NOT NULL,
  action           text NOT NULL,
  entity_type      text NOT NULL,
  entity_id        uuid,
  before_state     jsonb,
  after_state_id   uuid,
  tool_name        text,
  idempotency_key  uuid,
  created_at       timestamptz NOT NULL DEFAULT now()
);
```

**Phase 1 synchronous write.** `audit_log` is written synchronously
inside the service transaction — every mutating service function
calls `recordMutation()` before `COMMIT`, and the audit row lives
or dies with the mutation's transaction. This is **Simplification
1** from `docs/03_architecture/phase_simplifications.md`: in Phase
2, `events` becomes the source of truth for "what happened" and
`audit_log` becomes a projection derived from the event stream. In
Phase 1.1, `audit_log` is the direct source of truth because the
projection infrastructure doesn't exist yet.

**Service-layer enforcement.** Every mutating call through
`withInvariants()` must write an `audit_log` row inside its
transaction. This is a service-layer discipline, not a database
constraint — the rule is enforced by the `recordMutation()` helper
being called from every mutating service function, verified by
code review. **INV-AUDIT-001** — see
`docs/02_specs/ledger_truth_model.md`.

**`trace_id`** ties the audit row to the pino log entries for the
same request. A controller asking "what happened in this request?"
can grep pino logs by `trace_id` and find the full call chain
(orchestrator → tool → service → mutation → audit).

**`before_state`** is a JSONB snapshot of the entity pre-mutation.
`after_state_id` is the entity ID post-mutation (not the full
state — the caller joins to the entity table for current state).
This asymmetry is deliberate: the before-state is needed for
forensics on reversed entries, but the after-state lives in the
entity table where queries naturally look.

**Indexes:**

- `idx_audit_org_trace` on `(org_id, trace_id)` — supports the
  common lookup "all audit rows for this request."
- `idx_audit_org_created` on `(org_id, created_at)` — supports the
  AI Action Review queue's chronological display.

**No named CHECKs, no triggers.**

---

### `ai_actions`

Tracks every AI-initiated action: the prompt, the tool input, the
proposed output, the user's confirmation or rejection, and the
resulting journal entry (if confirmed). This is the table that
makes agent actions auditable and the idempotency check path
deterministic.

```sql
CREATE TABLE ai_actions (
  ai_action_id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id              uuid NOT NULL REFERENCES organizations(org_id) ON DELETE CASCADE,
  user_id             uuid REFERENCES auth.users(id),
  session_id          uuid,
  trace_id            uuid NOT NULL,
  tool_name           text NOT NULL,
  prompt              text,
  tool_input          jsonb,
  status              ai_action_status NOT NULL DEFAULT 'pending',
  confidence          confidence_level,
  routing_path        text,
  journal_entry_id    uuid REFERENCES journal_entries(journal_entry_id),
  confirming_user_id  uuid REFERENCES auth.users(id),
  rejection_reason    text,
  idempotency_key     uuid NOT NULL,
  response_payload    jsonb,
  staled_at           timestamptz,
  created_at          timestamptz NOT NULL DEFAULT now(),
  confirmed_at        timestamptz,
  UNIQUE (org_id, idempotency_key),
  CONSTRAINT stale_status_has_timestamp
    CHECK ((status = 'stale') = (staled_at IS NOT NULL))
);
```

**Named CHECK constraint on this table:**

- `stale_status_has_timestamp` — `(status = 'stale') = (staled_at IS NOT NULL)`. A state machine consistency rule: if and only if `status` is `stale`, then `staled_at` must be populated. Prevents rows in the stale state without a timestamp and prevents rows with a staled_at timestamp that are not in the stale state. Tier 2 local consistency constraint — no INV attribution, not in `ledger_truth_model.md`.

**State machine.** An `ai_actions` row progresses through these states:

- **`pending`** — initial state when the agent produces a proposal (dry-run) but the user has not yet confirmed. `response_payload` contains the ProposedEntryCard; `journal_entry_id` is NULL.
- **`confirmed`** — terminal state reached when the user clicks Approve. `journal_entry_id` is populated with the ID of the posted journal entry; `confirming_user_id` and `confirmed_at` are set.
- **`rejected`** — terminal state reached when the user clicks Reject. `rejection_reason` is populated; `journal_entry_id` remains NULL.
- **`auto_posted`** — reserved for Phase 2+ `notify_auto` tier. In Phase 1 this status is never set.
- **`stale`** — terminal state reached when a pending row is abandoned (session timeout, org switch, or an idempotency slot needs to be freed). `staled_at` is populated; `journal_entry_id` remains NULL. The `stale_status_has_timestamp` CHECK enforces this pairing.

**Idempotency enforcement.** `UNIQUE (org_id, idempotency_key)`
ensures that within an org, the same `idempotency_key` can only
produce one `ai_actions` row. The idempotency check path in
`journalEntryService.post()` does
`SELECT ... FROM ai_actions WHERE org_id = ? AND idempotency_key = ?`
before proceeding. If a row exists with `status = 'confirmed'`, the
service returns the existing result without rewriting. If a row
exists with `status = 'pending'`, the service returns the existing
card. If no row exists, the service proceeds. This is the
mechanism that makes agent actions safe to retry and prevents
duplicate journal entry posting from a double-click.

Phase 1.1 installs this path (the query runs in the manual
journal-entry flow too, although manual entries have NULL
`idempotency_key` and never hit the lookup branch). Phase 1.2
populates this table via the agent confirmation flow. The
interaction between `ai_actions.idempotency_key` (this column) and
`journal_entries.idempotency_key` (the column with
`INV-IDEMPOTENCY-001`) is that the ai_actions row stores the slot,
and the journal entry references it back. **INV-IDEMPOTENCY-001**
— see `docs/02_specs/ledger_truth_model.md`.

**RLS policy pair.** `ai_actions_select` allows a user to see their
own rows plus all rows if they are a controller (this is how the
AI Action Review queue works). `ai_actions_insert` allows any
org-member to create rows; in practice only the orchestrator writes
here via the service-role client.

**Indexes:**

- `idx_ai_actions_org_status` on `(org_id, status, created_at DESC)`
  — supports the AI Action Review queue's filtered chronological
  display.

**No triggers.**

---

### `agent_sessions`

*Phase 2+ reserved — terse treatment.*

```sql
CREATE TABLE agent_sessions (
  session_id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id            uuid NOT NULL REFERENCES organizations(org_id) ON DELETE CASCADE,
  locale            text NOT NULL DEFAULT 'en',
  started_at        timestamptz NOT NULL DEFAULT now(),
  last_activity_at  timestamptz NOT NULL DEFAULT now(),
  state             jsonb NOT NULL DEFAULT '{}'::jsonb
);
```

**Phase 1.1 status:** empty. Populated in Phase 1.2 by the agent
orchestrator when a user starts a conversation. Org switch closes
the current session and creates a new one — see
`docs/09_briefs/phase-1.2/agent_architecture.md` AgentSession
Persistence section. **Indexes:** `idx_agent_sessions_user_org` on
`(user_id, org_id)`, `idx_agent_sessions_last_activity` on
`(last_activity_at)`.

---

### `events`

The append-only event stream. In Phase 1.1, this table is the
canonical **reserved seat** — the schema exists, the append-only
triggers are installed, but nothing writes to it. Phase 2 begins
writing events as the source of truth for mutations, with
`audit_log` becoming a projection derived from this stream.

```sql
CREATE TABLE events (
  event_id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type       text NOT NULL,
  org_id           uuid NOT NULL REFERENCES organizations(org_id),
  aggregate_id     uuid NOT NULL,
  aggregate_type   text NOT NULL,
  payload          jsonb NOT NULL,
  occurred_at      timestamptz NOT NULL,
  recorded_at      timestamptz NOT NULL DEFAULT now(),
  trace_id         uuid NOT NULL,
  _event_version   text NOT NULL DEFAULT '1.0.0',
  sequence_number  bigserial NOT NULL
);
```

**Named triggers on this table:**

- `trg_events_no_update` — `BEFORE UPDATE ON events FOR EACH ROW EXECUTE FUNCTION reject_events_mutation()`. Raises `feature_not_supported` on any UPDATE attempt. **INV-LEDGER-003** — see `docs/02_specs/ledger_truth_model.md`.
- `trg_events_no_delete` — `BEFORE DELETE ON events FOR EACH ROW EXECUTE FUNCTION reject_events_mutation()`. Raises `feature_not_supported` on any DELETE attempt. **INV-LEDGER-003** — see `docs/02_specs/ledger_truth_model.md`.
- `trg_events_no_truncate` — `BEFORE TRUNCATE ON events FOR EACH STATEMENT EXECUTE FUNCTION reject_events_mutation()`. Raises `feature_not_supported` on any TRUNCATE attempt. **INV-LEDGER-003** — see `docs/02_specs/ledger_truth_model.md`.

Additionally, the migration runs
`REVOKE TRUNCATE ON events FROM PUBLIC, authenticated, anon` as
defense in depth. The trigger catches what the REVOKE misses and
vice versa.

**On the `sequence_number` column (operational note).**
`sequence_number` is a `bigserial` — monotonically increasing but
**not gap-free**. When a transaction obtains a sequence value via
`nextval()` and then rolls back, the value is consumed but no row
is inserted, leaving a gap. Phase 2 replay and projection logic
must not assume density. If you need to detect "did I miss events
N through M?" query by `sequence_number` range and compare result
count to `M - N + 1`; a shortfall indicates gaps from rolled-back
transactions, not data loss.

**On the `_event_version` column.** `_event_version` starts at
`'1.0.0'` and is stamped on every row. When the event schema
changes (Phase 2 or later), new writers stamp `'2.0.0'` and the
projection layer branches on version. This is why the column has
a leading underscore — it's metadata, not a domain field.

**Reserved seat rationale.** The schema and the append-only
triggers are installed in Phase 1.1 so that (a) Phase 2 wiring is
mechanical (no migration at Phase 2 start, no trigger to install,
no permission grant), and (b) the *rule* that events are
append-only is enforceable from day one — there's no window in
which code can accidentally UPDATE the table because "we'll add
the trigger later." This is **Simplification 2** from
`docs/03_architecture/phase_simplifications.md` — the only Phase 1
simplification to `events` is that no writes happen yet, not that
the table is absent.

**Indexes:**

- `idx_events_org_aggregate` on `(org_id, aggregate_id, sequence_number)`
  — supports aggregate replay (reconstruct an aggregate's state by
  replaying events in sequence order).
- `idx_events_trace` on `(trace_id)` — supports trace-based queries
  ("show all events for this request").
- `idx_events_type_recorded` on `(event_type, recorded_at)` —
  supports event-type filtering (e.g., "all `journal_entry.posted`
  events in the last hour").

**No CHECKs.**

---

### `journal_entry_attachments`

*Phase 2+ reserved — terse treatment.*

```sql
CREATE TABLE journal_entry_attachments (
  attachment_id       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  journal_entry_id    uuid NOT NULL
    REFERENCES journal_entries(journal_entry_id) ON DELETE CASCADE,
  storage_path        text NOT NULL,
  original_filename   text NOT NULL,
  uploaded_by         uuid REFERENCES auth.users(id),
  uploaded_at         timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_je_attachments_entry
  ON journal_entry_attachments (journal_entry_id);
```

Added by migration `20240106000000_add_attachments.sql`. No
`org_id` column — the table joins to its parent `journal_entries`
row for org access (same junction-shape pattern as
`journal_lines`). `storage_path` points at a Supabase Storage
bucket object; Phase 1.1 installs the schema but no upload
pipeline yet writes to storage or this table.

**Phase 1.1 status:** empty. The table carries a
`COMMENT ON TABLE journal_entry_attachments IS 'Populated in Phase
2 by AP Agent. Do not write to manually.'` — Phase 2's email
ingestion + OCR pipeline uploads the source PDF for each bill and
writes the attachment row that links the stored file back to the
journal entry the agent proposed. **Indexes:**
`idx_je_attachments_entry` on `(journal_entry_id)` supports
"show me the attachments for this entry" detail-view queries.

---

## Index Plan

A summary of the query patterns that the Phase 1.1 indexes support.
Every new service function query should be checked against this
table before merging — see `docs/04_engineering/conventions.md`
Performance Conventions.

| Table | Index | Query pattern |
|---|---|---|
| `memberships` | `idx_memberships_user_org` | RLS helper `user_has_org_access(org_id)` lookup |
| `memberships` | `idx_memberships_org` | List all users in an org |
| `chart_of_accounts` | `idx_coa_org` | Find account by code within an org |
| `fiscal_periods` | `idx_fiscal_periods_org_dates` | Find open period for an entry_date |
| `journal_entries` | `idx_je_org_period` | Period-scoped P&L query, AI Action Review queue |
| `journal_entries` | `idx_je_org_intercompany` (partial) | Intercompany batch lookup (Phase 2) |
| `journal_entries` | `idx_je_reverses` (partial) | Reversal chain query (Phase 2) |
| `journal_lines` | `idx_jl_entry` | Load all lines for a journal entry |
| `journal_lines` | `idx_jl_account` | Account-level aggregation (trial balance, P&L) |
| `tax_codes` | `idx_tax_codes_jurisdiction` | Active tax code by jurisdiction and date |
| `vendors` | `idx_vendors_org` | List vendors for an org (Phase 2) |
| `vendor_rules` | `idx_vendor_rules_org_vendor` | Vendor rule lookup (Phase 2) |
| `customers` | `idx_customers_org` | List customers for an org (Phase 2) |
| `invoices` | `idx_invoices_org_customer` | Invoice list by customer and status (Phase 2) |
| `bills` | `idx_bills_org_vendor` | Bill list by vendor and status (Phase 2) |
| `bank_transactions` | `idx_bank_tx_org` | Transaction list by account and date (Phase 2) |
| `audit_log` | `idx_audit_org_trace` | All audit rows for a request |
| `audit_log` | `idx_audit_org_created` | AI Action Review queue chronological display |
| `ai_actions` | `idx_ai_actions_org_status` | AI Action Review queue filtered display |
| `agent_sessions` | `idx_agent_sessions_user_org` | User's active sessions |
| `agent_sessions` | `idx_agent_sessions_last_activity` | Session cleanup (30-day inactivity) |
| `events` | `idx_events_org_aggregate` | Aggregate replay (Phase 2) |
| `events` | `idx_events_trace` | Trace-based event query (Phase 2) |
| `events` | `idx_events_type_recorded` | Event-type filtering (Phase 2) |
| `journal_entry_attachments` | `idx_je_attachments_entry` | Attachments for a journal entry (Phase 2) |

**Partial indexes** (`idx_je_org_intercompany` and `idx_je_reverses`)
cover only rows where the indexed column is non-NULL. This keeps
the index small in Phase 1.1 (where most journal entries have no
intercompany batch and no reversal reference) while still supporting
efficient lookup when those columns are populated.

**No caching in Phase 1.** Per
`docs/04_engineering/conventions.md` Performance Conventions: no
Redis, no query cache, no materialized views. Phase 1 relies on
Postgres query performance with these indexes, and Phase 3 revisits
caching if report generation becomes slow.

---

## Part 2 — RLS Policies and Helper Functions

Row-level security is the tenant-isolation enforcement mechanism for
every table with an `org_id` column. Part 2 documents the full RLS
policy SQL verbatim from
`supabase/migrations/20240101000000_initial_schema.sql`, along with
the helper functions the policies call and the operational rules
that make RLS comprehensible at the application layer.

Unlike named CHECK constraints and triggers (which are rules first
and appear only as cross-references in Part 1 with their full SQL
in `ledger_truth_model.md`), RLS policies are data-scoping
infrastructure and their full SQL lives here. See
`docs/02_specs/ledger_truth_model.md` INV-RLS-001 for the single
architectural invariant ("cross-org data is never visible to a
user outside the org") that all of the policies below collectively
enforce.

---

## The Two-Client Rule

Every RLS policy in this file applies to one of two Supabase
clients. Understanding which client is being used is the
prerequisite to understanding what RLS actually enforces.

**`userClient`** (`src/db/userClient.ts`) — a Supabase client
created with the anon key and the user's JWT. Every query through
this client runs under the user's auth context (`auth.uid()`
returns the user's ID) and respects RLS policies. This is the
client used by Next.js server components that read data for
display, and by any code that needs RLS-enforced isolation for
defense in depth.

**`adminClient`** (`src/db/adminClient.ts`) — a Supabase client
created with the service-role key. Queries through this client
**bypass RLS entirely**. `auth.uid()` returns NULL because there
is no user session. This is the client used by every service
function in `src/services/` because service functions are
authoritative and must be able to write across RLS boundaries
(e.g., writing an `audit_log` row for an action the user took on
their own org).

**The rule.** Never use `adminClient` from Next.js route handlers
or React components. Route handlers call service functions, and
service functions use `adminClient` internally. The user-scoped
view of the database (from a component reading for display) goes
through `userClient`; the authoritative write path (from a service
function) goes through `adminClient`. This split is what makes
RLS defense-in-depth for reads without making it the primary
enforcement for writes.

**Why RLS still matters when writes go through `adminClient`.** The
service layer is authoritative — `withInvariants()` enforces
`canUserPerformAction()` before any mutation runs (INV-AUTH-001),
and the service layer is the only path that writes to the
database. RLS is not the primary enforcement for writes; the
service layer is. RLS matters for two reasons:

1. **Read defense-in-depth.** Any read from a `userClient` —
   including the Supabase-generated query builder that a React
   component might use directly — is scoped to rows the user can
   see. If a developer accidentally exposes a query that shouldn't
   be visible cross-org, RLS stops the leak before it becomes a
   data exposure.
2. **Append-only enforcement on `journal_entries` and
   `journal_lines`.** The `USING (false)` policies on UPDATE and
   DELETE apply to *any* client that respects RLS — including any
   future read-only reporting client or a downstream service that
   somehow obtains anon-key credentials. Even if a bug in the
   service layer tried to UPDATE a journal entry, the RLS policy
   would reject it *if* the call went through anything other than
   `adminClient`.

---

## Helper Functions

Two `SECURITY DEFINER` helper functions do the heavy lifting for
every RLS policy. They are installed in the public schema with
`STABLE` volatility (so the planner can inline them) and
`SET search_path = ''` (so the function body resolves tables by
fully-qualified name, preventing search-path attacks).

### `user_has_org_access(target_org_id uuid) → boolean`

```sql
CREATE OR REPLACE FUNCTION public.user_has_org_access(target_org_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.memberships
    WHERE user_id = auth.uid() AND org_id = target_org_id
  );
$$;

REVOKE ALL ON FUNCTION public.user_has_org_access(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.user_has_org_access(uuid) TO authenticated;
```

Returns `true` if the calling user has any membership row for the
target org. Used as the default tenant-scoping predicate in
policies like `journal_entries_select`, `chart_of_accounts_select`,
and most other tenant tables.

**Why `SECURITY DEFINER`.** The function runs with the privileges
of its definer (the migration-time superuser), not the caller.
Without this, a non-privileged user running a SELECT against
`memberships` would hit the `memberships_select` policy and get a
recursive RLS evaluation. `SECURITY DEFINER` breaks the recursion
by letting the function read `memberships` directly without
policy evaluation. The `REVOKE ALL ... FROM PUBLIC` and explicit
`GRANT EXECUTE ... TO authenticated` ensure only logged-in users
can call the function.

### `user_is_controller(target_org_id uuid) → boolean`

```sql
CREATE OR REPLACE FUNCTION public.user_is_controller(target_org_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.memberships
    WHERE user_id = auth.uid()
      AND org_id = target_org_id
      AND role = 'controller'
  );
$$;

REVOKE ALL ON FUNCTION public.user_is_controller(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.user_is_controller(uuid) TO authenticated;
```

Returns `true` if the calling user has a `controller` role
membership in the target org. Used as the tenant-scoping predicate
in policies that require elevated permissions (locking a fiscal
period, managing vendor rules, viewing all AI actions rather than
just one's own).

---

## Standard Tenant Pattern

Most tables with an `org_id` column follow the same three-policy
pattern for their SELECT/INSERT/UPDATE access:

```sql
CREATE POLICY <table>_select ON <table>
  FOR SELECT USING (user_has_org_access(org_id));
CREATE POLICY <table>_insert ON <table>
  FOR INSERT WITH CHECK (user_has_org_access(org_id));
CREATE POLICY <table>_update ON <table>
  FOR UPDATE USING (user_has_org_access(org_id));
```

This is the default for: `chart_of_accounts`, `vendors`,
`customers`. These three tables follow the pattern exactly and have
no deviations.

Many other tables use a variation of this pattern — same
`user_has_org_access(org_id)` scoping but collapsed into a single
`FOR ALL` policy, or with the scoping adapted for junction tables.
The per-table section below documents each.

**Tables deviating from this pattern** are cataloged in the
"Standard-Pattern Exceptions" section at the end of Part 2, with
the reason for each deviation.

**INV-RLS-001.** The collective effect of every RLS policy in this
file is the single architectural invariant *cross-org data is
never visible to a user outside the org*. See
`docs/02_specs/ledger_truth_model.md` for the full invariant
statement and `tests/integration/crossOrgRlsIsolation.test.ts` for
the test coverage.

---

## Enable RLS Block

Before any policies are defined, the migration enables RLS on
every tenant-scoped table plus `chart_of_accounts_templates` and
`tax_codes`. A table without RLS enabled has no policy enforcement,
so the `ENABLE ROW LEVEL SECURITY` statement is as load-bearing as
the policies themselves.

```sql
ALTER TABLE organizations                ENABLE ROW LEVEL SECURITY;
ALTER TABLE memberships                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE chart_of_accounts            ENABLE ROW LEVEL SECURITY;
ALTER TABLE chart_of_accounts_templates  ENABLE ROW LEVEL SECURITY;
ALTER TABLE fiscal_periods               ENABLE ROW LEVEL SECURITY;
ALTER TABLE intercompany_relationships   ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entries              ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_lines                ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendors                      ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_rules                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers                    ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices                     ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_lines                ENABLE ROW LEVEL SECURITY;
ALTER TABLE bills                        ENABLE ROW LEVEL SECURITY;
ALTER TABLE bill_lines                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments                     ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_accounts                ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_transactions            ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_codes                    ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log                    ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_actions                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_sessions               ENABLE ROW LEVEL SECURITY;
ALTER TABLE events                       ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entry_attachments    ENABLE ROW LEVEL SECURITY;
```

Every table that exists in the schema has RLS enabled. There is
no unprotected table. (The attachments table is enabled from its
own migration `20240106000000_add_attachments.sql` rather than
the initial schema, but the effect is identical.)

---

## Per-Table Policies

Policies are presented in schema order (matching Part 1's table
order) so a reader walking from a table definition to its policies
follows the same navigation.

### `organizations`

```sql
CREATE POLICY organizations_select ON organizations
  FOR SELECT USING (user_has_org_access(org_id));
```

Standard SELECT-only tenant pattern. `organizations` rows are
created via `orgService.create()` through `adminClient`; no RLS
policy for INSERT exists because orgs are not user-writable from
the client side.

### `memberships`

```sql
CREATE POLICY memberships_select ON memberships
  FOR SELECT USING (
    user_id = auth.uid() OR user_is_controller(org_id)
  );
```

**Deviation from standard pattern.** Users see their own memberships
(the `user_id = auth.uid()` branch — "what orgs am I in?") and
controllers see all memberships in their orgs (the
`user_is_controller(org_id)` branch — "who is in this org I
administer?"). No INSERT/UPDATE/DELETE policies — memberships are
created via `membershipService` through `adminClient`.

### `chart_of_accounts`

```sql
CREATE POLICY chart_of_accounts_select ON chart_of_accounts
  FOR SELECT USING (user_has_org_access(org_id));
CREATE POLICY chart_of_accounts_insert ON chart_of_accounts
  FOR INSERT WITH CHECK (user_has_org_access(org_id));
CREATE POLICY chart_of_accounts_update ON chart_of_accounts
  FOR UPDATE USING (user_has_org_access(org_id));
```

Standard tenant pattern — three policies, one per write action,
using `user_has_org_access`. No DELETE policy; accounts are
archived via `is_active = false`, not deleted.

### `chart_of_accounts_templates`

```sql
CREATE POLICY coa_templates_select ON chart_of_accounts_templates
  FOR SELECT TO authenticated USING (true);
```

**Deviation from standard pattern.** No org scoping — any
authenticated user can read any template. See Part 1 for the
reasoning (the org creation flow needs to read templates before
the user has an `org_id` to scope to). There is no
INSERT/UPDATE/DELETE policy because templates are seed-only and
modifying them requires a migration.

### `fiscal_periods`

```sql
CREATE POLICY fiscal_periods_select ON fiscal_periods
  FOR SELECT USING (user_has_org_access(org_id));
CREATE POLICY fiscal_periods_insert ON fiscal_periods
  FOR INSERT WITH CHECK (user_is_controller(org_id));
CREATE POLICY fiscal_periods_update ON fiscal_periods
  FOR UPDATE USING (user_is_controller(org_id));
```

**Deviation from standard pattern.** SELECT uses
`user_has_org_access` (any org member can see fiscal periods), but
INSERT and UPDATE require `user_is_controller` — only controllers
can create periods or lock them. Locking a period is the
controller-only action that drives INV-LEDGER-002 enforcement via
`trg_enforce_period_not_locked` on `journal_lines`.

### `intercompany_relationships`

```sql
CREATE POLICY intercompany_relationships_select ON intercompany_relationships
  FOR SELECT USING (
    user_has_org_access(org_a_id) OR user_has_org_access(org_b_id)
  );
```

**Deviation from standard pattern.** The predicate is a dual
`user_has_org_access` check — the user sees the relationship row
if they have access to *either* org involved. This makes sense for
an intercompany relationship: a user in org A should see "org A has
an intercompany relationship with org B" even if they don't have
access to org B. Phase 1.1 has only SELECT; Phase 2 adds
INSERT/UPDATE policies when the AP Agent populates the table.

### `journal_entries`

```sql
CREATE POLICY journal_entries_select ON journal_entries
  FOR SELECT USING (user_has_org_access(org_id));
CREATE POLICY journal_entries_insert ON journal_entries
  FOR INSERT WITH CHECK (user_has_org_access(org_id));
CREATE POLICY journal_entries_no_update ON journal_entries
  FOR UPDATE USING (false);
CREATE POLICY journal_entries_no_delete ON journal_entries
  FOR DELETE USING (false);
```

**Deviation from standard pattern.** SELECT and INSERT follow the
standard tenant pattern, but UPDATE and DELETE use `USING (false)`
— the append-only RLS enforcement. Any UPDATE or DELETE attempt
through a `userClient` is rejected by RLS. As noted in Part 1,
`adminClient` bypasses RLS, but no service function issues
UPDATE/DELETE on journal_entries by construction; corrections
happen via reversal entries.

### `journal_lines`

```sql
CREATE POLICY journal_lines_select ON journal_lines
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM journal_entries je
      WHERE je.journal_entry_id = journal_lines.journal_entry_id
        AND user_has_org_access(je.org_id)
    )
  );
CREATE POLICY journal_lines_insert ON journal_lines
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM journal_entries je
      WHERE je.journal_entry_id = journal_lines.journal_entry_id
        AND user_has_org_access(je.org_id)
    )
  );
CREATE POLICY journal_lines_no_update ON journal_lines
  FOR UPDATE USING (false);
CREATE POLICY journal_lines_no_delete ON journal_lines
  FOR DELETE USING (false);
```

**Deviation from standard pattern.** `journal_lines` has no
`org_id` column directly — it joins to its parent `journal_entries`
row for org access. The `EXISTS` subquery pattern is the standard
RLS approach for junction-shape tables. Like `journal_entries`,
journal_lines is append-only via `USING (false)` for UPDATE and
DELETE.

### `vendors`

```sql
CREATE POLICY vendors_select ON vendors
  FOR SELECT USING (user_has_org_access(org_id));
CREATE POLICY vendors_insert ON vendors
  FOR INSERT WITH CHECK (user_has_org_access(org_id));
CREATE POLICY vendors_update ON vendors
  FOR UPDATE USING (user_has_org_access(org_id));
```

Standard tenant pattern. Phase 1.1: empty.

### `vendor_rules`

```sql
CREATE POLICY vendor_rules_select ON vendor_rules
  FOR SELECT USING (user_has_org_access(org_id));
CREATE POLICY vendor_rules_cud ON vendor_rules
  FOR ALL USING (user_is_controller(org_id))
  WITH CHECK (user_is_controller(org_id));
```

**Deviation from standard pattern.** SELECT uses `user_has_org_access`
(any org member can see vendor rules), but a single `FOR ALL`
policy requires `user_is_controller` for create/update/delete.
Only controllers can define or modify autonomy tiers and default
account mappings for vendors. Phase 1.1: empty.

### `customers`

```sql
CREATE POLICY customers_select ON customers
  FOR SELECT USING (user_has_org_access(org_id));
CREATE POLICY customers_insert ON customers
  FOR INSERT WITH CHECK (user_has_org_access(org_id));
CREATE POLICY customers_update ON customers
  FOR UPDATE USING (user_has_org_access(org_id));
```

Standard tenant pattern. Phase 1.1: empty.

### `invoices`

```sql
CREATE POLICY invoices_tenant ON invoices FOR ALL
  USING (user_has_org_access(org_id))
  WITH CHECK (user_has_org_access(org_id));
```

Single `FOR ALL` policy variant of the standard tenant pattern.
Phase 1.1: empty.

### `invoice_lines`

```sql
CREATE POLICY invoice_lines_tenant ON invoice_lines FOR ALL
  USING (
    EXISTS (SELECT 1 FROM invoices i
            WHERE i.invoice_id = invoice_lines.invoice_id
              AND user_has_org_access(i.org_id))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM invoices i
            WHERE i.invoice_id = invoice_lines.invoice_id
              AND user_has_org_access(i.org_id))
  );
```

Junction-shape EXISTS subquery pattern (same shape as
`journal_lines`) in a single `FOR ALL` policy. Phase 1.1: empty.

### `bills`

```sql
CREATE POLICY bills_tenant ON bills FOR ALL
  USING (user_has_org_access(org_id))
  WITH CHECK (user_has_org_access(org_id));
```

Single `FOR ALL` policy, standard tenant pattern. Phase 1.1: empty.

### `bill_lines`

```sql
CREATE POLICY bill_lines_tenant ON bill_lines FOR ALL
  USING (
    EXISTS (SELECT 1 FROM bills b
            WHERE b.bill_id = bill_lines.bill_id
              AND user_has_org_access(b.org_id))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM bills b
            WHERE b.bill_id = bill_lines.bill_id
              AND user_has_org_access(b.org_id))
  );
```

Junction-shape EXISTS subquery pattern. Phase 1.1: empty.

### `payments`

```sql
CREATE POLICY payments_tenant ON payments FOR ALL
  USING (user_has_org_access(org_id))
  WITH CHECK (user_has_org_access(org_id));
```

Single `FOR ALL` policy, standard tenant pattern. Phase 1.1: empty.

### `bank_accounts`

```sql
CREATE POLICY bank_accounts_tenant ON bank_accounts FOR ALL
  USING (user_has_org_access(org_id))
  WITH CHECK (user_has_org_access(org_id));
```

Single `FOR ALL` policy, standard tenant pattern. Phase 1.1: empty.

### `bank_transactions`

```sql
CREATE POLICY bank_transactions_tenant ON bank_transactions FOR ALL
  USING (user_has_org_access(org_id))
  WITH CHECK (user_has_org_access(org_id));
```

Single `FOR ALL` policy, standard tenant pattern. Phase 1.1: empty.

### `tax_codes`

```sql
CREATE POLICY tax_codes_select ON tax_codes
  FOR SELECT USING (
    org_id IS NULL OR user_has_org_access(org_id)
  );
```

**Deviation from standard pattern.** The nullable-org exception —
any authenticated user sees global tax codes (NULL `org_id`) plus
codes scoped to their orgs. There is no INSERT/UPDATE/DELETE policy
because tax codes are seed-only in Phase 1.1; Phase 2 adds write
policies when org-specific tax codes become editable.

### `audit_log`

```sql
CREATE POLICY audit_log_select ON audit_log
  FOR SELECT USING (user_has_org_access(org_id));
```

SELECT-only tenant pattern. Writes happen through `adminClient`
from `recordMutation()` — no INSERT policy is needed because no
user-scoped client should ever write to the audit log directly.
The absence of a write policy combined with RLS being enabled
means a `userClient` INSERT would fail with "new row violates RLS
policy" — defense in depth against accidental user-side writes.

### `ai_actions`

```sql
CREATE POLICY ai_actions_select ON ai_actions
  FOR SELECT USING (
    user_id = auth.uid() OR user_is_controller(org_id)
  );
CREATE POLICY ai_actions_insert ON ai_actions
  FOR INSERT WITH CHECK (user_has_org_access(org_id));
```

**Deviation from standard pattern.** SELECT uses the same
user-or-controller pattern as `memberships` (users see their own
actions; controllers see all actions in their orgs — this is how
the AI Action Review queue works). INSERT uses the standard
`user_has_org_access` pattern, though in practice only the
orchestrator writes via `adminClient`.

### `agent_sessions`

```sql
CREATE POLICY agent_sessions_select ON agent_sessions
  FOR SELECT USING (user_id = auth.uid());
```

**Deviation from standard pattern.** User-scoped only — not
org-scoped. A user sees only their own sessions, and even
controllers do not see other users' sessions. Sessions contain
conversation state that is considered user-private.

### `events`

```sql
CREATE POLICY events_select ON events
  FOR SELECT USING (user_has_org_access(org_id));
```

SELECT-only tenant pattern. No INSERT policy because events are
written only from `adminClient` by Phase 2 code (Phase 1.1 installs
the schema but writes nothing). The append-only triggers
(`trg_events_no_update`, `trg_events_no_delete`, `trg_events_no_truncate`)
enforce the append-only rule regardless of client.

### `journal_entry_attachments`

```sql
CREATE POLICY je_attachments_select ON journal_entry_attachments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM journal_entries je
      WHERE je.journal_entry_id =
            journal_entry_attachments.journal_entry_id
        AND user_has_org_access(je.org_id)
    )
  );
```

**Deviation from standard pattern.** Junction-shape EXISTS subquery
through `journal_entries` for org access — same shape as
`journal_lines_select`. SELECT-only in Phase 1.1; Phase 2 adds
INSERT policies when the AP Agent populates the table from OCR'd
attachments.

---

## RPC Functions

Two Postgres RPC functions support the Phase 1.1 reporting
pathway. Both are called from `src/services/reporting/reportService.ts`
via `adminClient().rpc()` — they cannot be expressed through the
Supabase PostgREST query builder because they use `FILTER` clauses
that are not in the builder's surface.

Both functions:

- Use `amount_cad` exclusively for multi-currency correctness.
- Accept `NULL` for `p_period_id` to mean "all periods."
- Include reversed entries and their reversals; reversals net
  naturally via aggregation per the Q21 decision (reversals are
  not excluded from the aggregate).
- Use `LANGUAGE sql` (single SELECT, planner can inline).
- Use `SECURITY INVOKER` (respect RLS, run under the caller's
  permissions — but since the service layer calls them through
  `adminClient`, RLS is bypassed in practice).
- Grant `EXECUTE` to `service_role` only — not to `authenticated`
  — so only the service layer (not user-scoped clients) can call
  them.

Added by migration `20240107000000_report_rpc_functions.sql`.

### `get_profit_and_loss(p_org_id uuid, p_period_id uuid)`

Returns per-account-type aggregates for the P&L and Balance Sheet
summary. One row per account type (`asset`, `liability`, `equity`,
`revenue`, `expense`) with `debit_total_cad` and
`credit_total_cad` columns. Net income is computed UI-side as
`revenue.credit_total_cad - expense.debit_total_cad`.

```sql
CREATE OR REPLACE FUNCTION get_profit_and_loss(
  p_org_id uuid,
  p_period_id uuid
)
RETURNS TABLE (
  account_type text,
  debit_total_cad numeric,
  credit_total_cad numeric
)
LANGUAGE sql
SECURITY INVOKER
AS $$
  SELECT
    coa.account_type::text AS account_type,
    COALESCE(SUM(jl.amount_cad) FILTER (WHERE jl.debit_amount > 0), 0) AS debit_total_cad,
    COALESCE(SUM(jl.amount_cad) FILTER (WHERE jl.credit_amount > 0), 0) AS credit_total_cad
  FROM chart_of_accounts coa
  LEFT JOIN journal_lines jl ON jl.account_id = coa.account_id
  LEFT JOIN journal_entries je ON je.journal_entry_id = jl.journal_entry_id
    AND je.org_id = p_org_id
    AND (p_period_id IS NULL OR je.fiscal_period_id = p_period_id)
  WHERE coa.org_id = p_org_id
  GROUP BY coa.account_type
  ORDER BY
    CASE coa.account_type::text
      WHEN 'asset' THEN 1
      WHEN 'liability' THEN 2
      WHEN 'equity' THEN 3
      WHEN 'revenue' THEN 4
      WHEN 'expense' THEN 5
    END;
$$;

GRANT EXECUTE ON FUNCTION get_profit_and_loss(uuid, uuid) TO service_role;
```

### `get_trial_balance(p_org_id uuid, p_period_id uuid)`

Returns per-account balance totals. Uses `LEFT JOIN` to ensure
zero-balance accounts still appear in the output — a Trial Balance
must show every account the org has, not only those with activity
in the period. Returns `account_id`, `account_code`,
`account_name`, `account_type`, `debit_total_cad`, and
`credit_total_cad`.

```sql
CREATE OR REPLACE FUNCTION get_trial_balance(
  p_org_id uuid,
  p_period_id uuid
)
RETURNS TABLE (
  account_id uuid,
  account_code text,
  account_name text,
  account_type text,
  debit_total_cad numeric,
  credit_total_cad numeric
)
LANGUAGE sql
SECURITY INVOKER
AS $$
  SELECT
    coa.account_id,
    coa.account_code,
    coa.account_name,
    coa.account_type::text AS account_type,
    COALESCE(SUM(jl.amount_cad) FILTER (WHERE jl.debit_amount > 0), 0) AS debit_total_cad,
    COALESCE(SUM(jl.amount_cad) FILTER (WHERE jl.credit_amount > 0), 0) AS credit_total_cad
  FROM chart_of_accounts coa
  LEFT JOIN journal_lines jl ON jl.account_id = coa.account_id
  LEFT JOIN journal_entries je ON je.journal_entry_id = jl.journal_entry_id
    AND je.org_id = p_org_id
    AND (p_period_id IS NULL OR je.fiscal_period_id = p_period_id)
  WHERE coa.org_id = p_org_id
  GROUP BY coa.account_id, coa.account_code, coa.account_name, coa.account_type
  ORDER BY coa.account_code;
$$;

GRANT EXECUTE ON FUNCTION get_trial_balance(uuid, uuid) TO service_role;
```

**Why RPC and not a query builder.** PostgREST's generated query
builder cannot express `FILTER (WHERE ...)` clauses on aggregates,
and the P&L aggregation requires filtering SUM by
`debit_amount > 0` vs `credit_amount > 0` within a single row
output. An attempt to build this in the TypeScript service layer
would require multiple round trips (one per account type) and
client-side aggregation — which would produce slower reports and
reintroduce the JS-number money-precision risk
(`INV-MONEY-001`) that the service boundary otherwise rules out.
The RPC does the aggregation in Postgres where `numeric` precision
is exact, and returns already-aggregated rows the service layer
consumes directly.

---

## Standard-Pattern Exceptions Summary

The following tables deviate from the default
`user_has_org_access(org_id)` SELECT/INSERT/UPDATE pattern. The
reason for each deviation is noted inline above; this summary
exists so a reader can find the deviations at a glance:

- **`chart_of_accounts_templates`** — global SELECT for authenticated
  users (no org scoping); seed-only, no writes.
- **`memberships`** — user-scoped SELECT (own rows) plus
  controller-scoped SELECT (all rows in the org); no policies for
  writes.
- **`fiscal_periods`** — `user_has_org_access` SELECT but
  `user_is_controller` INSERT/UPDATE (controller-only period
  management).
- **`intercompany_relationships`** — dual-org SELECT
  (`access(org_a) OR access(org_b)`).
- **`journal_entries`** — append-only (`USING (false)` on UPDATE
  and DELETE).
- **`journal_lines`** — junction-shape EXISTS subquery for parent
  org access, plus append-only.
- **`vendor_rules`** — `user_has_org_access` SELECT but
  `user_is_controller` for all writes.
- **`tax_codes`** — nullable-org SELECT (`org_id IS NULL OR
  user_has_org_access(org_id)`); seed-only, no writes in Phase 1.1.
- **`ai_actions`** — user-or-controller SELECT (same pattern as
  `memberships`).
- **`agent_sessions`** — user-scoped only (no org dimension; even
  controllers cannot see other users' sessions).
- **`journal_entry_attachments`** — junction-shape EXISTS subquery
  for parent org access (same shape as `journal_lines`);
  SELECT-only in Phase 1.1.

Every other tenant table (`chart_of_accounts`, `vendors`, `customers`,
`invoices`, `invoice_lines`, `bills`, `bill_lines`, `payments`,
`bank_accounts`, `bank_transactions`, `events`) follows the
standard tenant pattern either directly or as a `FOR ALL` single-
policy variant with the same `user_has_org_access(org_id)` predicate.

**On `organizations` and `audit_log`.** These are tenant-scoped
tables that follow the standard pattern for SELECT but have no
user-side write policy at all. Writes happen through service
functions via `adminClient`, which bypasses RLS. This is neither
a deviation (the SELECT is standard) nor a full standard (the
INSERT/UPDATE policies are absent). It is a "read-through-RLS,
write-through-services" posture — the same posture every
tenant-scoped table could adopt if it chose to, but these two do
so explicitly because user-side writes to them would be
operationally incorrect regardless of access control.
