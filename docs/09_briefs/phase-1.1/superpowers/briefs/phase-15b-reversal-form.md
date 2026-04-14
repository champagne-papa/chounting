# Phase 15B: Reversal Form — Subagent Brief

## Part 1: Context and Goal

Create the ReversalForm component that allows a user to reverse an
existing journal entry. This is a new component file, plus a surgical
modification to ContextualCanvas to move the `reversal_form` case out
of the Phase 2+ placeholder group.

The reversal form fetches a source journal entry, computes the mirrored
lines (debits and credits swapped) via the `mirrorLines` helper from
`@/shared/schemas/accounting/journalEntry.schema`, renders those mirrored
lines as a read-only preview, and collects three user-editable fields
(fiscal period, entry date, reversal reason) before posting to the
journal entries endpoint. The service handles the reversal path via
discriminated union routing on `reverses_journal_entry_id`.

Spec reference: `docs/specs/phase-1.1.md` §15.7.

## Part 2: Files to Create and Modify

**Create:**
- `src/components/canvas/ReversalForm.tsx`

**Modify (surgically — one import + one switch case move):**
- `src/components/bridge/ContextualCanvas.tsx`

## Part 3: Constraints

**Allow-list — you may create or modify ONLY:**
- `src/components/canvas/ReversalForm.tsx` (create)
- `src/components/bridge/ContextualCanvas.tsx` (one import + one switch case)

**Deny-list — you MUST NOT modify:**
- `src/services/` — service layer, locked
- `src/shared/` — types and schemas, locked
- `src/db/` — database clients, locked
- `src/app/api/` — API routes, locked (consume only)
- `supabase/` — migrations, locked
- `tests/` — test files, locked
- `CLAUDE.md`, `PLAN.md`, `docs/` — architectural docs, locked
- Any other file under `src/components/` besides the two specified above
- Specifically do NOT modify `JournalEntryForm.tsx`,
  `JournalEntryListView.tsx`, `JournalEntryDetailView.tsx`,
  or `MainframeRail.tsx`

If you find a problem in any locked file, report it. Do not fix it.

Do not add any new npm dependencies. All needed packages are already
installed: react-hook-form, @hookform/resolvers, zod.

## Part 4: Implementation Specifications

### CRITICAL: Two categories of state

The reversal form has two fundamentally different kinds of state.
Do NOT mix them.

**1. Read-only derived state** (useState + useEffect, NOT react-hook-form):
- `sourceEntry: JournalEntryDetail | null` — fetched on mount
- `openPeriods: FiscalPeriodListItem[]` — fetched on mount
- `mirroredLines: MirrorableLine[]` — computed via `useMemo`
- `loading`, `loadError`, `submitting`, `formError`

**2. User-editable form state** (react-hook-form with zodResolver):
- `fiscal_period_id` — dropdown
- `entry_date` — date input
- `reversal_reason` — textarea

Do NOT put sourceEntry or mirroredLines in form state.
Do NOT put editable fields in useState.

---

### 4a: Imports (literal)

```typescript
'use client';

import { useEffect, useMemo, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import type { CanvasNavigateFn } from '@/shared/types/canvasDirective';
import type { JournalEntryDetail } from '@/services/accounting/journalEntryService';
import type { FiscalPeriodListItem } from '@/services/accounting/periodService';
import {
  mirrorLines,
  type MirrorableLine,
} from '@/shared/schemas/accounting/journalEntry.schema';
import type { MoneyAmount, FxRate } from '@/shared/schemas/accounting/money.schema';
```

---

### 4b: ReversalFormSchema (inline, literal)

```typescript
const ReversalFormSchema = z.object({
  fiscal_period_id: z.string().uuid({ message: 'Fiscal period is required' }),
  entry_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'Invalid date format' }),
  reversal_reason: z.string().min(1, { message: 'Reversal reason is required' }),
});

type ReversalFormStateInput = z.input<typeof ReversalFormSchema>;
type ReversalFormState = z.infer<typeof ReversalFormSchema>;
```

Note: Defined INSIDE ReversalForm.tsx. Do NOT export. Do NOT move
to journalEntry.schema.ts.

---

### 4c: Props (literal)

```typescript
interface Props {
  orgId: string;
  sourceEntryId: string;
  onNavigate: CanvasNavigateFn;
}
```

---

### 4d: Component state (literal)

```typescript
const [sourceEntry, setSourceEntry] = useState<JournalEntryDetail | null>(null);
const [openPeriods, setOpenPeriods] = useState<FiscalPeriodListItem[]>([]);
const [loading, setLoading] = useState(true);
const [loadError, setLoadError] = useState<string | null>(null);
const [submitting, setSubmitting] = useState(false);
const [formError, setFormError] = useState<string | null>(null);

const form = useForm<ReversalFormStateInput>({
  resolver: zodResolver(ReversalFormSchema),
  defaultValues: {
    fiscal_period_id: '',
    entry_date: new Date().toISOString().slice(0, 10),
    reversal_reason: '',
  },
});
```

---

### 4e: Data fetching on mount (literal)

```typescript
useEffect(() => {
  let cancelled = false;
  setLoading(true);
  setLoadError(null);

  Promise.all([
    fetch(`/api/orgs/${orgId}/journal-entries/${sourceEntryId}`).then((res) => {
      if (!res.ok) throw new Error(`Failed to load source entry: HTTP ${res.status}`);
      return res.json() as Promise<JournalEntryDetail>;
    }),
    fetch(`/api/orgs/${orgId}/fiscal-periods`).then((res) => {
      if (!res.ok) throw new Error(`Failed to load fiscal periods: HTTP ${res.status}`);
      return res.json() as Promise<{ periods: FiscalPeriodListItem[]; count: number }>;
    }),
  ])
    .then(([entry, periodsResponse]) => {
      if (cancelled) return;
      setSourceEntry(entry);
      setOpenPeriods(periodsResponse.periods);

      // Default: source entry's period if still open, else first open period
      const sourcePeriodStillOpen = periodsResponse.periods.find(
        (p) => p.period_id === entry.fiscal_period_id,
      );
      const defaultPeriodId =
        sourcePeriodStillOpen?.period_id ?? periodsResponse.periods[0]?.period_id ?? '';

      form.setValue('fiscal_period_id', defaultPeriodId);
    })
    .catch((err) => {
      if (cancelled) return;
      setLoadError(err instanceof Error ? err.message : 'Failed to load data');
    })
    .finally(() => {
      if (!cancelled) setLoading(false);
    });

  return () => { cancelled = true; };
}, [orgId, sourceEntryId, form]);
```

Note: Detail endpoint returns `JournalEntryDetail` directly (NOT wrapped).
Fiscal-periods endpoint returns `{ periods: [...], count: N }` (wrapped).
The `cancelled` flag prevents state updates after unmount.

---

### 4f: Mirrored lines (literal)

```typescript
const mirroredLines = useMemo<MirrorableLine[]>(() => {
  if (!sourceEntry) return [];
  return mirrorLines(
    sourceEntry.journal_lines.map((line) => ({
      account_id: line.account_id,
      debit_amount: line.debit_amount as MoneyAmount,
      credit_amount: line.credit_amount as MoneyAmount,
      currency: line.currency,
      amount_original: line.amount_original as MoneyAmount,
      amount_cad: line.amount_cad as MoneyAmount,
      fx_rate: line.fx_rate as FxRate,
      tax_code_id: line.tax_code_id,
    })),
  );
}, [sourceEntry]);
```

The `.map` strips `journal_line_id`, `description`, and `chart_of_accounts`
from the detail lines to match the `MirrorableLine` shape that `mirrorLines`
expects. The `as MoneyAmount`/`as FxRate` casts are needed because branded
types are erased over JSON.

---

### 4g: Period gap detection (literal)

```typescript
const selectedPeriodId = useWatch({ control: form.control, name: 'fiscal_period_id' });

const periodGap = useMemo(() => {
  if (!sourceEntry || !selectedPeriodId) return null;
  if (selectedPeriodId === sourceEntry.fiscal_period_id) return null;

  const selectedPeriod = openPeriods.find((p) => p.period_id === selectedPeriodId);
  const sourcePeriodName = sourceEntry.fiscal_periods?.name ?? '(unknown period)';
  const selectedPeriodName = selectedPeriod?.name ?? '(unknown period)';

  return { sourcePeriodName, selectedPeriodName };
}, [sourceEntry, openPeriods, selectedPeriodId]);
```

**CRITICAL:** Use `useWatch` — NOT `form.watch`. The `useWatch` hook
triggers re-renders; `form.watch` does not reliably work for `useMemo`
dependencies. This is the Phase 13B.1 lesson.

---

### 4h: Transform function (literal)

```typescript
function buildReversalInput(
  form: ReversalFormState,
  mirroredLines: MirrorableLine[],
  sourceEntry: JournalEntryDetail,
  orgId: string,
) {
  return {
    org_id: orgId,
    fiscal_period_id: form.fiscal_period_id,
    entry_date: form.entry_date,
    description: `Reversal of entry #${sourceEntry.entry_number}`,
    // reference is optional — omit (Zod .optional() accepts undefined, NOT null)
    source: 'manual' as const,
    reverses_journal_entry_id: sourceEntry.journal_entry_id,
    reversal_reason: form.reversal_reason,
    lines: mirroredLines.map((line) => ({
      account_id: line.account_id,
      debit_amount: line.debit_amount,
      credit_amount: line.credit_amount,
      currency: line.currency,
      amount_original: line.amount_original,
      amount_cad: line.amount_cad,
      fx_rate: line.fx_rate,
      tax_code_id: line.tax_code_id,
      // description omitted — z.string().optional() accepts undefined, not null
    })),
  };
}
```

**CRITICAL:** Do NOT set `entry_type`. The service sets it programmatically.
**CRITICAL:** Do NOT set `reference` or line `description` to `null`.
Zod `.optional()` accepts `undefined`, not `null`. Omit these fields.

---

### 4i: Submit handler (literal)

```typescript
const onSubmit = form.handleSubmit(async (formValues) => {
  if (!sourceEntry) {
    setFormError('Source entry not loaded yet');
    return;
  }

  setSubmitting(true);
  setFormError(null);

  try {
    const input = buildReversalInput(formValues, mirroredLines, sourceEntry, orgId);

    const response = await fetch(`/api/orgs/${orgId}/journal-entries`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });

    if (response.status === 401) {
      window.location.href = '/en/sign-in';
      return;
    }

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({ error: 'Unknown error' }));
      setFormError(errorBody.message ?? errorBody.error ?? `HTTP ${response.status}`);
      return;
    }

    const result = (await response.json()) as {
      journal_entry_id: string;
      entry_number: number;
    };

    // Success: navigate to detail view of the NEW reversal entry
    onNavigate({
      type: 'journal_entry',
      orgId,
      entryId: result.journal_entry_id,
      mode: 'view',
    });
  } catch (err) {
    setFormError(err instanceof Error ? err.message : 'An unexpected error occurred');
  } finally {
    setSubmitting(false);
  }
});
```

**CRITICAL:** On success, navigate to the NEW reversal entry's detail
view (`result.journal_entry_id`), NOT back to the list.

---

### 4j: Rendering (descriptive with literal navigation and banner)

Layout, top to bottom:

1. **Loading:** `<div className="text-sm text-neutral-400">Loading...</div>`
2. **Load error:** `<div className="text-sm text-red-500">{loadError}</div>`
3. **Not found:** `<div className="text-sm text-neutral-400">Source entry not found.</div>`

4. **Main form** (when sourceEntry loaded): `<form onSubmit={onSubmit}>`

   **Title:** `<h2>Reverse Journal Entry #{sourceEntry.entry_number}</h2>`

   **Source context (read-only):**
   - Original Date: `{sourceEntry.entry_date}`
   - Original Description: `{sourceEntry.description}`

   **Period gap banner** (conditional, yellow, non-dismissible):
   ```tsx
   {periodGap && (
     <div className="bg-yellow-50 border border-yellow-300 text-yellow-900 p-3 text-sm rounded">
       You are reversing a {periodGap.sourcePeriodName} entry into{' '}
       {periodGap.selectedPeriodName}. The reversal will appear in{' '}
       {periodGap.selectedPeriodName}, not in the original period, because{' '}
       {periodGap.sourcePeriodName} is closed. Verify this is the behaviour
       you want before posting.
     </div>
   )}
   ```
   **CRITICAL:** Banner text is literal from spec §15.7. Do NOT paraphrase.
   Yellow styling, NOT red. No close/dismiss button.

   **Mirrored lines preview** (read-only table):
   - Columns: Account, Debit, Credit
   - Account: `sourceLine.chart_of_accounts?.account_code` — NOT `[0]?.`
   - Amounts: `mirroredLines[i].debit_amount` / `.credit_amount`
   - Show non-zero only: `!== '0.0000'` (canonical zeroMoney format)
   - Comment: `// mirrorLines preserves order (verified in mirrorLines.test.ts)`

   **Editable fields** (match JournalEntryForm.tsx styling):
   - Fiscal Period `<select>` from `openPeriods`, value=`period_id`, display=`name`
   - Reversal Date `<input type="date">`
   - Reversal Reason `<textarea rows={3}>`
   - Each with field-level error display in `text-sm text-red-500`

   **Form error:** `{formError && <div className="text-sm text-red-500">...`

   **Actions:**
   - Submit: "Post Reversal" button, disabled when submitting
   - Cancel: navigates back to source entry detail:
     ```typescript
     onNavigate({ type: 'journal_entry', orgId, entryId: sourceEntryId, mode: 'view' })
     ```

---

### 4k: ContextualCanvas modification (literal before/after)

**Add import:**
```typescript
import { ReversalForm } from '@/components/canvas/ReversalForm';
```

**Before** (current):
```typescript
    // Phase 2+ directive types — render placeholder
    case 'reversal_form':     // <-- in Phase 2+ group
    case 'ai_action_review_queue':
```

**After** (Phase 15B):
```typescript
    case 'reversal_form':                                        // <-- NEW: dedicated
      return <ReversalForm
        orgId={d.orgId}
        sourceEntryId={d.sourceEntryId}
        onNavigate={onNavigate}
      />;
    // ... (existing cases unchanged)

    // Phase 2+ directive types — render placeholder
    // case 'reversal_form': REMOVED from this group
    case 'ai_action_review_queue':
```

Place the new case after `journal_entry` and before `proposed_entry_card`.
Do NOT modify any other case.

---

## Part 5: Acceptance Criteria

1. `ReversalForm.tsx` exists in `src/components/canvas/`
2. `ContextualCanvas.tsx`: one new import + `reversal_form` moved to
   dedicated case with `<ReversalForm>` and three props
3. `pnpm typecheck` — clean
4. `pnpm test:integration` — all 18 tests pass
5. `pnpm vitest run tests/unit/` — all 41 tests pass
6. `git diff --name-only` shows EXACTLY:
   - `src/components/canvas/ReversalForm.tsx`
   - `src/components/bridge/ContextualCanvas.tsx`
   (no other files)
7. No new dependencies
8. No `parseFloat`, `Number()`, or `parseInt` in the new file
9. `reference` field NOT set in `buildReversalInput`
10. `entry_type` field NOT set in `buildReversalInput`
11. Line `description` NOT set to `null` (omitted instead)
12. Account display uses `?.account_code` (NOT `[0]?.account_code`)
13. Period gap uses `useWatch` (NOT `form.watch`)
14. Banner text is literal from spec (not paraphrased)

### Part 5.5: Smoke Test

The subagent cannot run this smoke test. Report in Part 6 that
it is pending user execution.

**Setup:**
1. `pnpm dev` — note the port
2. Browser → `http://localhost:${PORT}/en`
3. Sign in: `controller@thebridge.local` / `DevSeed!Controller#1`
4. Navigate to Bridge Holding Co: `/en/11111111-1111-1111-1111-111111111111`
5. Open dev tools (Console + Network)

**Navigate to reversal form:**
6. Click "journals" → list view
7. If no entries, post one via "+ New Entry" first
8. Click an unreversed entry → detail view
9. Click "Reverse this entry" → reversal form

**Verify initial render:**
10. Title: "Reverse Journal Entry #N"
11. Source context: original date + description
12. Lines preview: debits/credits swapped, account codes visible
13. Period dropdown populated, defaults to source period if open
14. Date defaults to today
15. Reason textarea empty
16. Network: two 200 responses (entry + periods)
17. Console: no new errors

**Period gap banner (if 2+ open periods exist):**
18. Switch period → yellow banner appears with literal spec text
19. Switch back → banner disappears
20. (If only 1 open period, skip 18-19)

**Validation:**
21. Clear reason, click "Post Reversal" → error message
22. Enter reason "Smoke test reversal"

**Submit:**
23. Click "Post Reversal"
24. Verify canvas navigates to NEW reversal entry's detail view
25. Verify reversal entry shows correct mirrored lines
26. Verify header shows "Reverses Entry: [UUID]" + reason
27. Click "← Back to list"
28. Verify original entry now shows "Reversed" + dimmed
29. Click original entry → detail shows "Reversed by Entry #N"

**Cancel:**
30. From list, click unreversed entry → detail → "Reverse" → form
31. Click "Cancel"
32. Verify: navigates back to source entry detail (not list)

If any step fails, STOP and report. Debugging hints:
- If step 28 fails (original not dimmed): check Network tab for the
  list API response — does the original entry have `reversed_by` populated?
  If not, the Phase 15A.2 separate-query logic may not be picking up the
  new reversal. If yes, the list view's rendering logic may not be reading
  `reversed_by` correctly.
- If step 25 fails (wrong lines on reversal): check whether mirrorLines
  correctly swapped debits/credits by comparing the preview in step 12
  with the actual posted lines.

## Part 6: Reporting

1. Files created/modified (full paths)
2. `pnpm typecheck` output (last 3 lines)
3. `pnpm test:integration` summary
4. `pnpm vitest run tests/unit/` summary
5. `git diff --name-only`
6. Decisions made not in brief
7. Ambiguities encountered
8. Confirm: `useForm` with `zodResolver(ReversalFormSchema)`
9. Confirm: `ReversalFormSchema` inline in form file, not exported
10. Confirm: `Promise.all` parallel fetches (entry + periods)
11. Confirm: `mirroredLines` via `useMemo` + `mirrorLines` import
12. Confirm: `useWatch` for period gap (NOT `form.watch`)
13. Confirm: `buildReversalInput` omits `entry_type` and `reference`
14. Confirm: line `description` omitted (NOT set to null)
15. Confirm: `?.account_code` (NOT `[0]?.account_code`)
16. Confirm: success → NEW reversal entry detail (NOT list)
17. Confirm: cancel → source entry detail (NOT list)
18. Confirm: ContextualCanvas = one import + one case move
19. Confirm: smoke test pending user execution
