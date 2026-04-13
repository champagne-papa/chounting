# Phase 14B: Journal Entry List + Detail Views — Subagent Brief

## Part 1: Context and Goal

Create the journal entry list view (replacing an existing shell) and the
journal entry detail view (new component). Both consume the Phase 12B
journal-entries API routes and use the CanvasNavigateFn callback for
cross-component navigation established in Phase 14A.

The list view is the primary landing page for the "Journals" icon in the
Mainframe rail. The detail view renders when a user clicks a list row.
Together they complete the read side of the journal entry workflow.

Spec reference: `docs/specs/phase-1.1.md` §15.5 (list) and §15.6 (detail).

## Part 2: Files to Create and Modify

**Replace (full rewrite of existing shell):**
- `src/components/canvas/JournalEntryListView.tsx`

**Create:**
- `src/components/canvas/JournalEntryDetailView.tsx`

**Modify (surgically — one import + one switch case):**
- `src/components/bridge/ContextualCanvas.tsx`

## Part 3: Constraints

**Allow-list — you may create or modify ONLY:**
- `src/components/canvas/JournalEntryListView.tsx` (replace shell)
- `src/components/canvas/JournalEntryDetailView.tsx` (create)
- `src/components/bridge/ContextualCanvas.tsx` (one import + one switch case)

**Deny-list — you MUST NOT modify:**
- `src/services/` — service layer, locked
- `src/shared/` — types and schemas, locked
- `src/db/` — database clients, locked
- `src/app/api/` — API routes, locked (consume only)
- `supabase/` — migrations, locked
- `tests/` — test files, locked
- `CLAUDE.md`, `PLAN.md`, `docs/` — architectural docs, locked
- Any other file under `src/components/` besides the three specified above
- Specifically do NOT modify `JournalEntryForm.tsx` or `MainframeRail.tsx`

If you find a problem in any locked file, report it. Do not fix it.

## Part 4: Implementation Specifications

### CRITICAL: The `journal_entry` directive has a `mode: 'view' | 'edit'` field.

The detail view **ignores this field entirely** and renders view-only
content regardless of mode. Do NOT add conditional rendering based on
mode. The field is reserved for a future edit capability not in Task 14.

---

### 4a: JournalEntryListView (replace existing shell)

**Imports (literal):**

```typescript
'use client';

import { useEffect, useState } from 'react';
import type { CanvasNavigateFn } from '@/shared/types/canvasDirective';
import type { JournalEntryListItem } from '@/services/accounting/journalEntryService';
```

Note: Import the type from the service — single source of truth. The API
returns JSON at runtime, but the TypeScript type is shared between service
and client so they stay in sync.

`total_debit` and `total_credit` come from the API as branded MoneyAmount
strings (e.g., `"100.0000"`). The list view displays them as-is in
`font-mono` — no arithmetic needed.

**Props interface (literal):**

```typescript
interface Props {
  orgId: string;
  onNavigate: CanvasNavigateFn;
}
```

**State and data fetching (literal):**

```typescript
const [entries, setEntries] = useState<JournalEntryListItem[]>([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState<string | null>(null);

useEffect(() => {
  setLoading(true);
  setError(null);
  fetch(`/api/orgs/${orgId}/journal-entries`)
    .then((res) => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    })
    .then((data: { entries: JournalEntryListItem[]; count: number }) => {
      setEntries(data.entries ?? []);
    })
    .catch((err) => {
      setError(err instanceof Error ? err.message : 'Failed to load');
      setEntries([]);
    })
    .finally(() => setLoading(false));
}, [orgId]);
```

**Rendering (descriptive with literal navigation calls):**

Layout, top to bottom:

1. **Header:** title "Journal Entries" (left) + "+ New Entry" button
   (right-aligned):
   ```typescript
   onClick={() => onNavigate({ type: 'journal_entry_form', orgId })}
   ```
   Styling: `text-sm text-blue-600 hover:underline`

2. **Loading state:** `<div className="text-sm text-neutral-400">Loading journal entries...</div>`

3. **Error state:** `<div className="text-sm text-red-500">{error}</div>`

4. **Empty state:** `<div className="text-sm text-neutral-400">No journal entries yet. Click + New Entry to create one.</div>`

5. **Table** (when entries.length > 0):
   - Columns: # (entry_number), Date, Description, Type (entry_type),
     Debits (total_debit), Credits (total_credit)
   - Header: `text-sm font-medium text-neutral-500`, `border-b border-neutral-200`
   - Body rows: `text-sm`, `border-b border-neutral-100`, `hover:bg-neutral-50 cursor-pointer`
   - Amount columns: `text-right font-mono`
   - Entry number: `text-right`
   - Row click navigates to detail:
     ```typescript
     onClick={() => onNavigate({
       type: 'journal_entry',
       orgId,
       entryId: entry.journal_entry_id,
       mode: 'view',
     })}
     ```
     (Note: `orgId` is required by the directive type. `mode: 'view'`
     satisfies the type — the detail view ignores mode.)
   - If `entry.reverses_journal_entry_id` is non-null, show a small
     "Reversal" badge or indicator next to the description. Styling:
     `text-xs text-amber-600 ml-2` inline span.

**Styling conventions:** Match ChartOfAccountsView patterns (neutral palette,
table with border-collapse, hover states). Follow the same `w-full text-sm
border-collapse` table pattern.

---

### 4b: JournalEntryDetailView (new component)

**Imports (literal):**

```typescript
'use client';

import { useEffect, useMemo, useState } from 'react';
import type { CanvasNavigateFn } from '@/shared/types/canvasDirective';
import type { JournalEntryDetail } from '@/services/accounting/journalEntryService';
import {
  addMoney,
  zeroMoney,
  type MoneyAmount,
} from '@/shared/schemas/accounting/money.schema';
```

Note: Import `JournalEntryDetail` from the service — single source of
truth. The type includes `journal_lines` with nested `chart_of_accounts`.

**IMPORTANT:** `chart_of_accounts` within each line is an **array** per
Supabase's generated type convention for FK relationships (even for
many-to-one). Access account data via:
```typescript
line.chart_of_accounts[0]?.account_code
line.chart_of_accounts[0]?.account_name
```
It will always have exactly one element for valid data.

**Props interface (literal):**

```typescript
interface Props {
  orgId: string;
  entryId: string;
  onNavigate: CanvasNavigateFn;
}
```

**State and data fetching (literal):**

```typescript
const [entry, setEntry] = useState<JournalEntryDetail | null>(null);
const [loading, setLoading] = useState(true);
const [error, setError] = useState<string | null>(null);

useEffect(() => {
  setLoading(true);
  setError(null);
  fetch(`/api/orgs/${orgId}/journal-entries/${entryId}`)
    .then((res) => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    })
    .then((data: JournalEntryDetail) => {
      setEntry(data);
    })
    .catch((err) => {
      setError(err instanceof Error ? err.message : 'Failed to load');
      setEntry(null);
    })
    .finally(() => setLoading(false));
}, [orgId, entryId]);
```

Note: The detail endpoint returns the entry **directly** (not wrapped in
`{ entry: ... }`). The type annotation `data: JournalEntryDetail` reflects
this — it's the direct object, not destructured.

**Totals computation (literal — do NOT use parseFloat or raw arithmetic):**

```typescript
const totals = useMemo(() => {
  if (!entry) return { debit: zeroMoney(), credit: zeroMoney() };
  let debit: MoneyAmount = zeroMoney();
  let credit: MoneyAmount = zeroMoney();
  for (const line of entry.journal_lines) {
    debit = addMoney(debit, line.debit_amount as MoneyAmount);
    credit = addMoney(credit, line.credit_amount as MoneyAmount);
  }
  return { debit, credit };
}, [entry]);
```

**Rendering (descriptive with literal navigation calls):**

Layout, top to bottom:

1. **Header row:** "← Back to list" button (left) + title
   "Journal Entry #{entry.entry_number}" (right of button):
   ```typescript
   onClick={() => onNavigate({ type: 'journal_entry_list', orgId })}
   ```
   Styling: `text-sm text-blue-600 hover:underline`

2. **Loading state:** `<div className="text-sm text-neutral-400">Loading...</div>`
3. **Error state:** `<div className="text-sm text-red-500">{error}</div>`
4. **Not found:** If `!entry && !loading && !error`:
   `<div className="text-sm text-neutral-400">Journal entry not found.</div>`

5. **Entry metadata** (when entry is non-null) — a grid or definition list:
   - Entry Number: `{entry.entry_number}`
   - Date: `{entry.entry_date}`
   - Description: `{entry.description}`
   - Reference: `{entry.reference ?? '—'}`
   - Source: `{entry.source}`
   - Type: `{entry.entry_type}`
   - Created: `{new Date(entry.created_at).toLocaleString()}`
   - If `entry.reverses_journal_entry_id` is non-null:
     - Reverses Entry: `{entry.reverses_journal_entry_id}` (UUID — Task 15
       may enhance to show the entry number)
     - Reason: `{entry.reversal_reason ?? '—'}`

6. **Lines table:**
   - Columns: Account, Description, Debit, Credit, Currency
   - Account display: `{line.chart_of_accounts[0]?.account_code ?? '—'} — {line.chart_of_accounts[0]?.account_name ?? 'Unknown'}`
   - Debit/Credit: show the non-zero value, blank for zero. Font-mono,
     text-right. Example: if `debit_amount` is `"100.0000"` show `100.0000`;
     if `"0.0000"` show blank.
   - Description: `{line.description ?? '—'}`
   - Currency: `{line.currency}`
   - Header/body styling matches the list view's table conventions.

7. **Totals footer row** (below the lines table):
   - Two cells: total debits and total credits from the `totals` useMemo.
   - Styled bold (`font-semibold`). Should match for a balanced entry.

8. **Actions row:**
   - "Reverse this entry" button:
     ```typescript
     onClick={() => onNavigate({
       type: 'reversal_form',
       orgId,
       sourceEntryId: entry.journal_entry_id,
     })}
     ```
     Styling: `text-sm text-red-600 hover:underline` or a bordered button.
     Always enabled in Task 14 (Task 15 adds disabled-when-reversed).

---

### 4c: ContextualCanvas Modification (literal before/after diff)

**Add import:**
```typescript
import { JournalEntryDetailView } from '@/components/canvas/JournalEntryDetailView';
```

**Switch case change:**

Before (current state after Phase 14A.1):
```typescript
    case 'journal_entry_form':
      return <JournalEntryForm orgId={d.orgId} onNavigate={onNavigate} />;
    case 'proposed_entry_card':
      return <ProposedEntryCard card={d.card} />;
    case 'none':
      // ... existing

    // Phase 2+ directive types — render placeholder
    case 'journal_entry':    // <-- currently in Phase 2+ group
    case 'reversal_form':
    case 'ai_action_review_queue':
    // ...
      return <ComingSoonPlaceholder directiveType={d.type} />;
```

After (Phase 14B change):
```typescript
    case 'journal_entry_form':
      return <JournalEntryForm orgId={d.orgId} onNavigate={onNavigate} />;
    case 'journal_entry':                                              // <-- NEW: dedicated case
      return <JournalEntryDetailView                                   // <-- NEW: real component
        orgId={d.orgId}                                                // orgId added in Phase 14A.3
        entryId={d.entryId}
        onNavigate={onNavigate}
      />;
    case 'proposed_entry_card':
      return <ProposedEntryCard card={d.card} />;
    case 'none':
      // ... existing

    // Phase 2+ directive types — render placeholder
    // case 'journal_entry': REMOVED from this group
    case 'reversal_form':
    case 'ai_action_review_queue':
    // ...
      return <ComingSoonPlaceholder directiveType={d.type} />;
```

Do NOT modify any other case, import, or surrounding code.

---

## Part 5: Acceptance Criteria

1. `JournalEntryListView.tsx` exists and replaces the shell (no shell code
   remaining)
2. `JournalEntryDetailView.tsx` exists
3. `ContextualCanvas.tsx` modified with one import + one switch case only
4. `pnpm typecheck` — clean, zero errors
5. `pnpm test:integration` — all 18 tests still pass
6. `pnpm vitest run tests/unit/` — all 35 unit tests still pass
7. `git diff --name-only` shows EXACTLY:
   - `src/components/canvas/JournalEntryListView.tsx`
   - `src/components/canvas/JournalEntryDetailView.tsx`
   - `src/components/bridge/ContextualCanvas.tsx`
   (no other files)
8. No new dependencies added

### Part 5.5: Smoke Test

The subagent cannot run this smoke test (no browser access). Report in
Part 6 that the smoke test is pending user execution. The user will run
it in a real browser before commit.

**Smoke test steps (for user execution):**

Setup:
1. `pnpm dev` — note the port
2. Open browser to `http://localhost:${PORT}/en`
3. Sign in as `controller@thebridge.local` / `DevSeed!Controller#1`
4. Navigate to Bridge Holding Co: `/en/11111111-1111-1111-1111-111111111111`
5. Open browser dev tools (Console + Network tabs)

List view:
6. Click "journals" icon in Mainframe rail
7. Verify list renders with title "Journal Entries" and "+ New Entry" button
8. Verify entries appear in the table (from prior smoke tests)
9. Verify Network tab: GET `/api/orgs/.../journal-entries` returned 200
10. Verify Console: no new errors

New Entry button:
11. Click "+ New Entry" — canvas swaps to form
12. Navigate back via rail journals icon — returns to list

Row click → detail:
13. Click any entry row in the list
14. Verify detail view renders with "Journal Entry #N" title
15. Verify lines table shows account codes and names (not UUIDs)
16. Verify totals footer shows sum of debits and sum of credits
17. Verify "Reverse this entry" button is visible
18. Verify Network tab: GET `/api/orgs/.../journal-entries/${id}` returned 200

Back to list:
19. Click "← Back to list" — returns to list view
20. Verify data is still present (re-fetched on mount)

Reverse button:
21. Click a row to enter detail again
22. Click "Reverse this entry"
23. Verify canvas shows "Coming Soon" placeholder (reversal_form)
24. Navigate back via rail journals icon

Form → list success navigation:
25. Click "+ New Entry" from list
26. Fill balanced entry: period, description "Task 14 smoke", 100/100
27. Click "Post Entry"
28. Verify form submits, canvas navigates to list automatically
29. Verify new entry appears in the list
30. Click the new entry's row — verify detail shows correct data

If any step fails, report what happened and STOP.

## Part 6: Reporting

When done, report:
1. List of files created/modified (with full paths)
2. Output of `pnpm typecheck` (last 3 lines)
3. Output of `pnpm test:integration` (Test Files + Tests summary)
4. Output of `pnpm vitest run tests/unit/` (Test Files + Tests summary)
5. Output of `git diff --name-only`
6. Any decisions made that weren't specified in this brief
7. Any places where this brief was ambiguous
8. Confirm: list view uses `fetch` for data (not SWR or react-query)
9. Confirm: detail view totals use `addMoney`/`zeroMoney`, NOT `parseFloat`
10. Confirm: detail view accesses account data via
    `line.chart_of_accounts[0]?.account_code` (Supabase array convention)
11. Confirm: row click uses `onNavigate` with `mode: 'view'` (type
    compliance only — view ignores mode)
12. Confirm: "Reverse" button navigates to `reversal_form` directive
    (NOT `journal_entry_form`)
13. Confirm: ContextualCanvas modification is only one new import + one
    new switch case (no other changes)
