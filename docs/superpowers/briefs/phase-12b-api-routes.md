# Phase 12B: Journal Entry API Routes — Subagent Brief

## Part 1: Context and Goal

Create three API route handlers (POST + GET for journal entries, GET for
single entry detail) that wrap the existing `journalEntryService` functions.
These routes are **thin adapters** — they parse requests, call services, and
format responses. No business logic lives in the routes.

This is Phase 12B of the Phase 1.1 closeout. Phase 12A (committed) added
`journalEntryService.list`, `journalEntryService.get`, and the
`serviceErrorToStatus` helper. This task consumes those — it does not
modify them.

## Part 2: Files to Create

1. `src/app/api/orgs/[orgId]/journal-entries/route.ts` — POST (create
   journal entry or reversal) and GET (list journal entries for the org)
2. `src/app/api/orgs/[orgId]/journal-entries/[entryId]/route.ts` — GET
   (single entry detail with lines)

**Directory creation:** `src/app/api/orgs/[orgId]/journal-entries/[entryId]/`
is a new nested directory structure. Create all intermediate directories.

## Part 3: Constraints (Do Not Modify)

**Allow-list** — you may create files ONLY under:
- `src/app/api/orgs/[orgId]/journal-entries/`
- `src/app/api/orgs/[orgId]/journal-entries/[entryId]/`

**Deny-list** — you MUST NOT modify any file under:
- `src/services/` (service layer — locked)
- `src/shared/` (schemas, types — locked)
- `src/db/` (database clients, types — locked)
- `src/components/` (UI — not this task)
- `src/app/api/_helpers/` (already created, consume only)
- `supabase/` (migrations — locked)
- `tests/` (test files — locked)
- `CLAUDE.md`, `PLAN.md`, `docs/specs/` (architectural docs — locked)

If you find a problem in any locked file, report it in your completion
message. Do not fix it.

## Part 4: Implementation Specifications

### CRITICAL: Next.js 15 params are Promises

This project uses **Next.js 15.5.15**. In Next.js 15, route handler
`params` is a **Promise** that must be awaited. This is a breaking change
from Next.js 14. Use this exact signature pattern:

```typescript
export async function GET(
  req: Request,
  { params }: { params: Promise<{ orgId: string }> }
) {
  const { orgId } = await params;
  // ...
}
```

Do NOT use the old synchronous pattern `{ params: { orgId: string } }`.
It will fail at runtime even if TypeScript doesn't catch it.

---

### Route 1: `src/app/api/orgs/[orgId]/journal-entries/route.ts`

Two handlers: POST and GET.

**Imports (use these exactly):**

```typescript
import { NextResponse } from 'next/server';
import { z } from 'zod';
import {
  PostJournalEntryInputSchema,
  ReversalInputSchema,
} from '@/shared/schemas/accounting/journalEntry.schema';
import { withInvariants } from '@/services/middleware/withInvariants';
import { journalEntryService } from '@/services/accounting/journalEntryService';
import { buildServiceContext } from '@/services/middleware/serviceContext';
import { ServiceError } from '@/services/errors/ServiceError';
import { serviceErrorToStatus } from '@/app/api/_helpers/serviceErrorToStatus';
```

**POST handler:**

```typescript
export async function POST(
  req: Request,
  { params }: { params: Promise<{ orgId: string }> }
) {
  try {
    const { orgId } = await params;
    const json = await req.json();

    // Discriminate on body shape, then parse with the correct schema.
    // This produces meaningful Zod errors (from the intended schema)
    // rather than confusing union-mismatch errors.
    const isReversal =
      json && typeof json === 'object' &&
      'reverses_journal_entry_id' in json &&
      json.reverses_journal_entry_id;

    const parsed = isReversal
      ? ReversalInputSchema.parse(json)
      : PostJournalEntryInputSchema.parse(json);

    // Validate URL orgId matches body org_id (prevent mismatch)
    if (parsed.org_id !== orgId) {
      return NextResponse.json(
        { error: 'org_id mismatch between URL and body' },
        { status: 400 }
      );
    }

    const ctx = await buildServiceContext(req);
    const result = await withInvariants(
      journalEntryService.post,
      { action: 'journal_entry.post' }
    )(parsed, ctx);

    // 201 Created — REST convention for resource creation.
    // Returns { journal_entry_id, entry_number }.
    return NextResponse.json(result, { status: 201 });
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

**GET handler (list — no withInvariants, reads aren't mutations):**

```typescript
export async function GET(
  req: Request,
  { params }: { params: Promise<{ orgId: string }> }
) {
  try {
    const { orgId } = await params;
    const url = new URL(req.url);
    const fiscalPeriodId = url.searchParams.get('fiscal_period_id') ?? undefined;

    const ctx = await buildServiceContext(req);
    const entries = await journalEntryService.list(
      { org_id: orgId, fiscal_period_id: fiscalPeriodId },
      ctx
    );

    return NextResponse.json({ entries, count: entries.length });
  } catch (err) {
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

---

### Route 2: `src/app/api/orgs/[orgId]/journal-entries/[entryId]/route.ts`

One handler: GET (detail).

**Imports (use these exactly):**

```typescript
import { NextResponse } from 'next/server';
import { journalEntryService } from '@/services/accounting/journalEntryService';
import { buildServiceContext } from '@/services/middleware/serviceContext';
import { ServiceError } from '@/services/errors/ServiceError';
import { serviceErrorToStatus } from '@/app/api/_helpers/serviceErrorToStatus';
```

**GET handler:**

```typescript
export async function GET(
  req: Request,
  { params }: { params: Promise<{ orgId: string; entryId: string }> }
) {
  try {
    const { orgId, entryId } = await params;
    const ctx = await buildServiceContext(req);

    const entry = await journalEntryService.get(
      { journal_entry_id: entryId },
      ctx
    );

    // URL/data consistency: verify the entry belongs to the org in the URL.
    // Prevents URL spoofing (/orgs/orgA/journal-entries/entryFromOrgB).
    // Returns 404 (not 403) to avoid leaking existence.
    if (entry.org_id !== orgId) {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: 'Journal entry not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(entry);
  } catch (err) {
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

## Part 5: Acceptance Criteria

1. Both route files exist at the specified paths
2. `pnpm typecheck` — clean, zero errors
3. `pnpm test:integration` — all 18 tests still pass (no regressions)
4. `git diff --name-only` shows EXACTLY these files (no others):
   - `src/app/api/orgs/[orgId]/journal-entries/route.ts`
   - `src/app/api/orgs/[orgId]/journal-entries/[entryId]/route.ts`
5. No imports from files outside the project (no new dependencies)

## Part 6: Reporting

When done, report:
1. List of files created (with full paths)
2. Output of `pnpm typecheck` (last 3 lines)
3. Output of `pnpm test:integration` (Test Files + Tests summary lines)
4. Output of `git diff --name-only` (should show only the two new route files)
5. Any decisions made that weren't specified in this brief
6. Any places where this brief was ambiguous and needed interpretation
7. Confirm that all route handlers use `await params` (Next.js 15
   Promise pattern) and NOT synchronous params destructuring
8. Confirm that all imports use `@/` path aliases as specified in
   this brief (no `../` relative imports)
