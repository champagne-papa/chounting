# Phase 13B: Journal Entry Form Component — Subagent Brief

## Part 1: Context and Goal

Create the journal entry form component and wire it into the canvas.
The form fetches dropdown data from three existing API routes, manages
dynamic journal lines via react-hook-form's `useFieldArray`, computes
a running balance using branded `MoneyAmount` types, and submits via
POST to the journal entries API. This is the first UI component that
exercises the Phase 12A/12B service and route layers at runtime.

Spec reference: `docs/specs/phase-1.1.md` §15.4.

## Part 2: Files to Create and Modify

**Create:**
- `src/components/canvas/JournalEntryForm.tsx` — the form component

**Modify (surgically — one specific change each):**
- `src/components/bridge/ContextualCanvas.tsx` — change the
  `journal_entry_form` switch case from `ComingSoonPlaceholder` to the
  real `JournalEntryForm`

## Part 3: Constraints

**Allow-list — you may create or modify ONLY:**
- `src/components/canvas/JournalEntryForm.tsx` (create)
- `src/components/bridge/ContextualCanvas.tsx` (modify: one import +
  one switch case only)

**Deny-list — you MUST NOT modify:**
- `src/services/` — service layer, locked
- `src/shared/` — schemas and types, locked
- `src/db/` — database clients, locked
- `src/app/api/` — API routes, locked (consume only)
- `supabase/` — migrations, locked
- `tests/` — test files, locked
- `CLAUDE.md`, `PLAN.md`, `docs/` — architectural docs, locked
- Any other file under `src/components/` besides the two specified above

If you find a problem in any locked file, report it in your completion
message. Do not fix it.

**Specific constraint for ContextualCanvas.tsx:**
- Add ONE import line: `import { JournalEntryForm } from ...`
- Move `case 'journal_entry_form':` OUT of the Phase 2+ grouped cases
- Add it as a dedicated case rendering `<JournalEntryForm orgId={d.orgId} />`
- Do NOT modify any other case statement or import

## Part 4: Implementation Specifications

### 4a: Form Schema (literal — define inline at top of file)

```typescript
import { z } from 'zod';
import { MoneyAmountSchema, type MoneyAmount } from '@/shared/schemas/accounting/money.schema';

// UI shape — what the form holds in state.
// Intentionally different from PostJournalEntryInputSchema:
// - debit_or_credit + amount (UI) vs separate debit_amount + credit_amount (service)
// - no currency, fx_rate, amount_original, amount_cad (computed on submit)
// - no source, no dry_run (not user-facing)
// formStateToServiceInput transforms one shape into the other on submit.

const JournalEntryFormLineSchema = z.object({
  account_id: z.string().uuid({ message: 'Account is required' }),
  debit_or_credit: z.enum(['debit', 'credit'], {
    message: 'Select debit or credit',
  }),
  amount: MoneyAmountSchema,
  tax_code_id: z.union([z.string().uuid(), z.literal('')]).optional().transform((v) => v || undefined),
});

export const JournalEntryFormSchema = z.object({
  fiscal_period_id: z.string().uuid({ message: 'Period is required' }),
  entry_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'Date must be YYYY-MM-DD' }),
  description: z.string().min(1, { message: 'Description is required' }),
  reference: z.string().optional(),
  lines: z.array(JournalEntryFormLineSchema).min(2, {
    message: 'At least 2 lines are required',
  }),
});

export type JournalEntryFormState = z.infer<typeof JournalEntryFormSchema>;
export type JournalEntryFormStateInput = z.input<typeof JournalEntryFormSchema>;
```

Notes:
- The `tax_code_id` transform (`z.union([z.string().uuid(), z.literal('')]).optional().transform(...)`)
  handles dropdown "No tax" option whose value is empty string. Converts
  `''` to `undefined` so the service receives the right type.
- Export both `z.infer<>` and `z.input<>` types — react-hook-form's
  `useForm<T>` should use the input type (pre-parse). Same lesson as
  Phase 9A's z.input vs z.infer discovery.

---

### 4b: Component Shape (literal interfaces, descriptive behavior)

**Imports (literal — use these exactly):**

```typescript
'use client';

import { useEffect, useMemo, useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  MoneyAmountSchema,
  addMoney,
  eqMoney,
  zeroMoney,
  oneRate,
  type MoneyAmount,
} from '@/shared/schemas/accounting/money.schema';
```

**Component signature (literal):**

```typescript
type JournalEntryFormProps = {
  orgId: string;
  prefill?: Record<string, unknown>; // Reserved for Task 15 reversal; ignored in Task 13
};

export function JournalEntryForm({ orgId }: JournalEntryFormProps) {
  // ...
}
```

**Data-fetching types and state (literal):**

```typescript
type FiscalPeriod = {
  period_id: string;
  name: string;
  start_date: string;
  end_date: string;
  is_locked: boolean;
};
type Account = {
  account_id: string;
  account_code: string;
  account_name: string;
  account_type: string;
  is_intercompany_capable: boolean;
  is_active: boolean;
};
type TaxCode = {
  tax_code_id: string;
  code: string;
  rate: string;
  jurisdiction: string;
};

const [periods, setPeriods] = useState<FiscalPeriod[]>([]);
const [accounts, setAccounts] = useState<Account[]>([]);
const [taxCodes, setTaxCodes] = useState<TaxCode[]>([]);
const [loading, setLoading] = useState(true);
const [formError, setFormError] = useState<string | null>(null);
const [submitting, setSubmitting] = useState(false);
```

**Data-fetching useEffect (literal — URLs and response shapes are
load-bearing):**

```typescript
useEffect(() => {
  setLoading(true);
  Promise.all([
    fetch(`/api/orgs/${orgId}/fiscal-periods`).then((r) => r.json()),
    fetch(`/api/orgs/${orgId}/chart-of-accounts`).then((r) => r.json()),
    fetch(`/api/tax-codes`).then((r) => r.json()),
  ])
    .then(([periodsData, accountsData, taxCodesData]) => {
      setPeriods(periodsData.periods ?? []);
      setAccounts(accountsData.accounts ?? []);
      setTaxCodes(taxCodesData.taxCodes ?? []);
    })
    .catch(() => {
      setPeriods([]);
      setAccounts([]);
      setTaxCodes([]);
    })
    .finally(() => setLoading(false));
}, [orgId]);
```

**Edge cases:**
- If `periods` is empty after loading: render "No open fiscal periods.
  Contact your administrator to create or unlock a period." in place of
  the period dropdown. Disable the submit button.
- If `accounts` is empty after loading: render "No accounts available.
  Contact your administrator." in the account dropdown areas. Disable
  the submit button.
- If loading: render "Loading..." in `text-sm text-neutral-400` matching
  ChartOfAccountsView pattern.

---

### 4c: Form Rendering (descriptive — subagent makes JSX decisions)

Layout, top to bottom:

1. **Title:** `<h2 className="text-lg font-semibold mb-4">New Journal Entry</h2>`
2. **Form-level error banner** (only when `formError` is non-null):
   red text in a bordered box above the form fields
3. **Header fields section** (can be 2-column grid or stacked):
   - `fiscal_period_id` — `<select>` from `periods`, value is `period_id`,
     display is period `name`
   - `entry_date` — `<input type="date">`, defaults to today
   - `description` — `<input type="text">`, required
   - `reference` — `<input type="text">`, optional, labeled "Reference (optional)"
4. **Lines section header:** "Lines" label with "Add Line" button right-aligned
5. **Lines table/rows:** Each line from `useFieldArray` renders:
   - Account `<select>` from `accounts`, option `value={account.account_id}`,
     display text `{account_code} — {account_name}`
   - Debit/Credit `<select>` with options value="debit" text="Debit" and
     value="credit" text="Credit"
   - Amount `<input type="text">` (NOT type="number" — branded strings)
   - Tax Code `<select>` from `taxCodes`, first option value="" text="— No tax —",
     then option `value={taxCode.tax_code_id}` text `{code} ({rate})`
   - Remove button (disabled when `fields.length <= 2`)
6. **Balance indicator** (literal code in Part 4g)
7. **Submit button:** "Post Entry", disabled when
   `submitting || loading || periods.length === 0 || accounts.length === 0`

**Styling conventions (match existing codebase):**
- Tailwind utility classes with neutral color palette
- Form inputs: `border border-neutral-300 rounded px-2 py-1 text-sm`
- Labels: `text-sm font-medium text-neutral-600`
- Error text: `text-sm text-red-500`
- Follow ChartOfAccountsView patterns for general styling

**Field errors:** Each field renders its react-hook-form error message
below the input when present, using `form.formState.errors.{field}?.message`
in `text-sm text-red-500`.

---

### 4d: Validation Behavior (literal setup, descriptive rules)

**react-hook-form setup (literal):**

```typescript
const form = useForm<JournalEntryFormStateInput>({
  resolver: zodResolver(JournalEntryFormSchema),
  mode: 'onSubmit',
  defaultValues: {
    fiscal_period_id: '',
    entry_date: new Date().toISOString().slice(0, 10),
    description: '',
    reference: '',
    lines: [
      { account_id: '', debit_or_credit: 'debit', amount: '', tax_code_id: '' },
      { account_id: '', debit_or_credit: 'credit', amount: '', tax_code_id: '' },
    ],
  },
});

const { fields, append, remove } = useFieldArray({
  control: form.control,
  name: 'lines',
});
```

**Validation rules (descriptive):**
- Form-level validation fires on submit via zodResolver. Errors display
  inline below each field in `text-sm text-red-500`.
- Running balance uses `watch` + `MoneyAmountSchema.safeParse` to
  validate amounts on every change WITHOUT triggering form errors.
  See Part 4g for the literal computation.
- Server errors from the POST response:
  - 400 with `details` array: map to field-level errors via
    `form.setError(path, { message })`
  - 422: set `formError` state with the server's message
  - 401: redirect to login via `window.location.href = '/en/sign-in'`
  - 500 / unknown: set formError to "An unexpected error occurred"

---

### 4e: Submit Flow (literal)

**The `onSubmit` handler:**

```typescript
const onSubmit = async (formData: JournalEntryFormStateInput) => {
  setFormError(null);
  setSubmitting(true);
  try {
    const serviceInput = formStateToServiceInput(formData, orgId);

    const response = await fetch(`/api/orgs/${orgId}/journal-entries`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(serviceInput),
    });

    if (!response.ok) {
      const errorBody = await response.json();

      if (response.status === 400 && errorBody.details) {
        for (const issue of errorBody.details) {
          const path = issue.path.join('.');
          form.setError(path as any, { message: issue.message });
        }
      } else if (response.status === 422) {
        setFormError(errorBody.message || 'Unable to post entry');
      } else if (response.status === 401) {
        window.location.href = '/en/sign-in';
        return;
      } else {
        setFormError('An unexpected error occurred. Please try again.');
      }
      return;
    }

    const result = await response.json();
    console.log('Journal entry posted:', result);
    // TODO: navigate canvas to journal_entry_list after Task 14 exists
  } catch (err) {
    setFormError('An unexpected error occurred. Please try again.');
  } finally {
    setSubmitting(false);
  }
};
```

**The `formStateToServiceInput` transform (literal — do not modify
the arithmetic):**

```typescript
function formStateToServiceInput(
  formState: JournalEntryFormStateInput,
  orgId: string,
): Record<string, unknown> {
  const lines = formState.lines.map((line) => {
    const amount = line.amount as MoneyAmount;
    const isDebit = line.debit_or_credit === 'debit';
    return {
      account_id: line.account_id,
      debit_amount: isDebit ? amount : zeroMoney(),
      credit_amount: isDebit ? zeroMoney() : amount,
      currency: 'CAD',
      amount_original: amount,
      amount_cad: amount,
      fx_rate: oneRate(),
      tax_code_id: line.tax_code_id || undefined,
    };
  });

  return {
    org_id: orgId,
    fiscal_period_id: formState.fiscal_period_id,
    entry_date: formState.entry_date,
    description: formState.description,
    reference: formState.reference || undefined,
    source: 'manual' as const,
    lines,
  };
}
```

Wire it into the form's `<form>` tag:
```tsx
<form onSubmit={form.handleSubmit(onSubmit)}>
```

---

### 4f: Line Management (literal setup, descriptive rendering)

**Add Line button:**

```tsx
<button
  type="button"
  onClick={() => append({ account_id: '', debit_or_credit: 'debit', amount: '', tax_code_id: '' })}
  className="text-sm text-blue-600 hover:underline"
>
  + Add Line
</button>
```

**Remove Line button (per line row):**

```tsx
<button
  type="button"
  onClick={() => remove(index)}
  disabled={fields.length <= 2}
  className="text-sm text-red-600 hover:underline disabled:text-neutral-400 disabled:no-underline"
>
  Remove
</button>
```

The `disabled` state when `fields.length <= 2` enforces the min-2-lines
constraint without Zod errors.

Each line row iterates over `fields` from `useFieldArray`:

```tsx
{fields.map((field, index) => (
  <div key={field.id}>
    {/* account_id select, debit_or_credit select, amount input, tax_code_id select, remove button */}
    {/* Register fields using form.register(`lines.${index}.account_id`) etc. */}
  </div>
))}
```

Use `field.id` as the React key (react-hook-form generates stable IDs).

---

### 4g: Running Balance Computation (literal — do not modify arithmetic)

```typescript
const watchedLines = form.watch('lines');

const balanceState = useMemo(() => {
  let totalDebit: MoneyAmount = zeroMoney();
  let totalCredit: MoneyAmount = zeroMoney();
  let allValid = true;

  for (const line of watchedLines) {
    const amountResult = MoneyAmountSchema.safeParse(line.amount);
    if (!amountResult.success) {
      allValid = false;
      break;
    }

    if (line.debit_or_credit === 'debit') {
      totalDebit = addMoney(totalDebit, amountResult.data);
    } else {
      totalCredit = addMoney(totalCredit, amountResult.data);
    }
  }

  if (!allValid) {
    return {
      display: '—',
      totalDebit: null,
      totalCredit: null,
      balanced: false,
      hasInput: false,
    };
  }

  const isInitial = eqMoney(totalDebit, zeroMoney()) && eqMoney(totalCredit, zeroMoney());

  return {
    display: `Debits: ${totalDebit} / Credits: ${totalCredit}`,
    totalDebit,
    totalCredit,
    balanced: !isInitial && eqMoney(totalDebit, totalCredit),
    hasInput: !isInitial,
  };
}, [watchedLines]);
```

**Do NOT use `parseFloat`, `Number()`, or any raw arithmetic on money
strings.** Use `addMoney` and `eqMoney` exclusively. This is the
branded-type discipline that prevents P&L corruption.

**Balance indicator render:**

```tsx
<div className="mt-4 p-3 rounded border border-neutral-200">
  <div className="text-sm text-neutral-500">Balance</div>
  <div
    className={`text-base font-mono ${
      balanceState.hasInput
        ? balanceState.balanced
          ? 'text-green-600'
          : 'text-red-600'
        : 'text-neutral-400'
    }`}
  >
    {balanceState.display}
  </div>
</div>
```

---

### 4h: ContextualCanvas Modification (literal before/after diff)

In `src/components/bridge/ContextualCanvas.tsx`:

**Add import** at the top with the other canvas imports:
```typescript
import { JournalEntryForm } from '@/components/canvas/JournalEntryForm';
```

**The switch case change — literal before/after:**

Before (current state):
```typescript
    case 'journal_entry_list':
      return <JournalEntryListView orgId={d.orgId} />;
    case 'proposed_entry_card':
      return <ProposedEntryCard card={d.card} />;
    case 'none':
      return (
        <div className="text-neutral-400 text-sm">
          Use the Mainframe rail on the left to choose a view.
        </div>
      );

    // Phase 2+ directive types — render placeholder
    case 'journal_entry':
    case 'journal_entry_form':    // <-- currently grouped here
    case 'ai_action_review_queue':
    case 'report_pl':
    case 'report_trial_balance':
    case 'ap_queue':
    // ... more Phase 2+ cases
      return <ComingSoonPlaceholder directiveType={d.type} />;
```

After (Task 13B change):
```typescript
    case 'journal_entry_list':
      return <JournalEntryListView orgId={d.orgId} />;
    case 'journal_entry_form':                          // <-- NEW: dedicated case
      return <JournalEntryForm orgId={d.orgId} />;      // <-- NEW: real component
    case 'proposed_entry_card':
      return <ProposedEntryCard card={d.card} />;
    case 'none':
      return (
        <div className="text-neutral-400 text-sm">
          Use the Mainframe rail on the left to choose a view.
        </div>
      );

    // Phase 2+ directive types — render placeholder
    case 'journal_entry':
    // case 'journal_entry_form': REMOVED from this group
    case 'ai_action_review_queue':
    case 'report_pl':
    case 'report_trial_balance':
    case 'ap_queue':
    // ... more Phase 2+ cases
      return <ComingSoonPlaceholder directiveType={d.type} />;
```

Do NOT modify any other case statement, import, or surrounding code.

---

## Part 5: Acceptance Criteria

1. `src/components/canvas/JournalEntryForm.tsx` exists
2. `src/components/bridge/ContextualCanvas.tsx` modified with one import
   + one switch case change only
3. `pnpm typecheck` — clean, zero errors
4. `pnpm test:integration` — all 18 tests still pass
5. `pnpm vitest run tests/unit/` — all 35 unit tests still pass
6. `git diff --name-only` shows EXACTLY:
   - `src/components/canvas/JournalEntryForm.tsx`
   - `src/components/bridge/ContextualCanvas.tsx`
   (no other files)
7. No new dependencies added (react-hook-form already installed)
8. **Manual smoke test passed** (see below)

### Smoke Test (required before reporting)

After typecheck and tests pass, verify the form renders without runtime
errors. The form is reachable via the `journal_entry_form` canvas
directive, which currently has no UI trigger (Task 14 adds the button).

To test:
1. Start the dev server: `pnpm dev`
2. Open a browser to `http://localhost:3000/en` and sign in as
   `controller@thebridge.local` / `DevSeed!Controller#2`
3. Open the browser's dev console
4. In the console, temporarily dispatch the directive by modifying
   React state or by navigating directly. Alternatively, add a
   temporary one-line button in the page component that sets the
   canvas directive to `{ type: 'journal_entry_form', orgId: '11111111-1111-1111-1111-111111111111' }`
5. Verify the form renders without console errors
6. Verify the three dropdowns populate (fiscal periods, accounts,
   tax codes)
7. Type amounts in the two default lines — verify the running
   balance indicator updates
8. **Remove any temporary debug code before committing.** The
   `git diff --name-only` must still show exactly the two files
   from acceptance criterion 6.

If you cannot complete the smoke test (dev server fails, auth blocks
access, etc.), report this in Part 6 and STOP. Do not commit work
that hasn't been runtime-verified.

## Part 6: Reporting

When done, report:
1. List of files created/modified (with full paths)
2. Output of `pnpm typecheck` (last 3 lines)
3. Output of `pnpm test:integration` (Test Files + Tests summary)
4. Output of `pnpm vitest run tests/unit/` (Test Files + Tests summary)
5. Output of `git diff --name-only`
6. Any decisions made that weren't specified in this brief
7. Any places where this brief was ambiguous
8. Confirm: react-hook-form `useForm` + `useFieldArray` used (not raw
   `useState` for form fields)
9. Confirm: `zodResolver(JournalEntryFormSchema)` used as resolver
10. Confirm: running balance uses `addMoney`/`eqMoney`, NOT `parseFloat`
    or raw arithmetic
11. Confirm: `formStateToServiceInput` is the only place producing the
    service-shape object
12. Confirm: ContextualCanvas modification is only the new switch case +
    the new import (no other changes)
