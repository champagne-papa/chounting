# Charter B real-flow arc — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make a real `sharepoint_drive` document flow end-to-end by removing the two reachability gates (hardcoded provider write value; provider selection masked at fetch) and landing the v1-active portions of the three carries.

**Architecture:** A single selection authority (`resolveStorageProvider`) picks the org's default provider at ingest; both insert paths put-and-stamp the resolved value; `byteFetch` dispatches on the *row's* provider at read. Storage `provider_unavailable` failures are un-masked through a two-layer wire contract into the pre-existing `'unavailable'` failure-class; the routing surface is reserved-not-built. Azure ops + live e2e are the gated tail — the arc closes UNIT-PROVEN.

**Tech Stack:** TypeScript, Next.js (custom build — see `AGENTS.md`), Supabase/Postgres migrations, Zod (Layer-2 boundary), vitest (unit + integration), Microsoft Graph (gated).

**Source spec:** `docs/09_briefs/post-mvp/specs/2026-06-07-charter-b-real-flow-design.md` (ratified `4a5e8b27`). **Charter:** `…/2026-06-07-charter-b-real-flow-charter.md` (ratified `75becab3`).

**Sequence (spec §4):** `A(Task 1) → B(Tasks 2–4) → C(Tasks 5–6) → D(Task 7, gated tail)`. **A is a hard precondition for B** (the helper reads the slice's column). Do not run B before Task 1's migration is applied.

**Coordination:** all commits under the `charter-b-real-flow` session lock — `COORD_SESSION='charter-b-real-flow'` set in the shell, repo-root cwd.

---

## File Structure

**Create:**
- `supabase/migrations/20240179000000_charter_b_org_settings_storage_slice.sql` — the add-consumed-only `org_settings` slice (A/D-1).
- `supabase/migrations/20240180000000_charter_b_exception_reason_provider_unavailable_reserve.sql` — reserve the `provider_unavailable` `exception_reason` value, not-active (C/D-5).
- `apps/web/src/services/storage/resolveStorageProvider.ts` — the ingest-time org-default selection authority (B/D-2).
- `apps/web/src/shared/schemas/storage/storageProvider.schema.ts` — the Layer-2 Zod admit-set (B/D-4).
- `apps/web/tests/unit/resolveStorageProvider.test.ts` — helper unit tests.
- `apps/web/tests/integration/charterBRealFlow.integration.test.ts` — slice + helper + dispatch integration tests.
- `apps/web/tests/integration/providerUnavailableClassification.integration.test.ts` — the two-layer wire-contract test.
- `tests/e2e/sharepointDriveRealFlow.e2e.test.ts` (or the repo's e2e home) — RUN_*-gated live-Graph harness (D/D-6, local-authored, gated run).
- `docs/09_briefs/post-mvp/runbooks/charter-b-sharepoint-onboarding.md` — the Azure/Sites.Selected/per-site-grant onboarding runbook (D/D-6).

**Modify:**
- `apps/web/src/services/errors/ServiceError.ts` — add `STORAGE_PROVIDER_UNAVAILABLE` code (C/D-5).
- `apps/web/src/services/storage/retry.ts` — `withRetry` throws the new typed code on `provider_unavailable` (C/D-5).
- `apps/web/src/agent/orchestrator/extraction/stages/byteFetch.ts` — dispatch-on-row (D-3) + catch-mapping to `PIPELINE_UNAVAILABLE` (D-5) + forward-marker.
- `apps/web/src/services/document-platform/documentPlatformService.ts` — single-doc path: resolve via helper; `INV-SERVICE-001` header reconciliation (D-2/§4.B-2).
- `apps/web/src/services/document-platform/ingestionService.ts` — both batch paths: resolve-in-TS-then-thread (D-2).
- `apps/web/src/db/types.ts` — regenerated after each migration (not hand-edited).

---

## Task 1 — A / D-1: `org_settings` storage slice (add-consumed-only)

**Files:**
- Create: `supabase/migrations/20240179000000_charter_b_org_settings_storage_slice.sql`
- Test: `apps/web/tests/integration/charterBRealFlow.integration.test.ts`
- Regenerate: `apps/web/src/db/types.ts`

- [ ] **Step 1: Write the failing integration test (columns + CHECK + default).**

**FIRST (disk-verify the seed shape — do this before writing the test):** read `apps/web/tests/setup/testDb.ts` and the seed SQL (`supabase/seed*.sql` / `pnpm db:seed:all` sources) to confirm whether `SEED.ORG_HOLDING` has an `org_settings` row. `org_settings` is a sparse settings table and the D-2 helper is explicitly built for the no-row case — so do **not** assume a row exists. If a seed row exists, after the migration its new column is backfilled to `'supabase_storage'` (ADD COLUMN NOT NULL DEFAULT) and `.single()` works. If **no** seed row exists, the test must ensure one — `INSERT INTO org_settings (org_id) VALUES (<seed org>)` applies all column DEFAULTs including `default_storage_provider='supabase_storage'` — or read via `.maybeSingle()` and assert the helper-fallback path instead. Pick the variant that matches the seed shape you find; otherwise Step 1 fails on `.single()` (no rows) rather than on the intended missing-column error.

Create `apps/web/tests/integration/charterBRealFlow.integration.test.ts` (the `.single()` form below assumes a seed row was confirmed in the FIRST step; switch to the ensure-row variant if not):

```typescript
import { describe, it, expect, afterAll } from 'vitest';
import { adminClient, SEED } from '../setup/testDb';

describe('Charter B real-flow — org_settings storage slice (D-1)', () => {
  const db = adminClient();

  it('default_storage_provider exists, defaults to supabase_storage', async () => {
    // Seed orgs have an org_settings row; read it back.
    const { data, error } = await db
      .from('org_settings')
      .select('default_storage_provider, sharepoint_site_id, sharepoint_drive_id')
      .eq('org_id', SEED.ORG_HOLDING)
      .single();
    expect(error).toBeNull();
    expect(data!.default_storage_provider).toBe('supabase_storage');
    expect(data!.sharepoint_site_id).toBeNull();
    expect(data!.sharepoint_drive_id).toBeNull();
  });

  it('default_storage_provider CHECK admits sharepoint_drive, rejects s3_bucket', async () => {
    const ok = await db
      .from('org_settings')
      .update({ default_storage_provider: 'sharepoint_drive' })
      .eq('org_id', SEED.ORG_HOLDING);
    expect(ok.error).toBeNull();

    const bad = await db
      .from('org_settings')
      .update({ default_storage_provider: 's3_bucket' })
      .eq('org_id', SEED.ORG_HOLDING);
    expect(bad.error).not.toBeNull(); // check_violation (23514)
  });

  afterAll(async () => {
    // Restore the seed default so later tests/files see supabase_storage.
    await db
      .from('org_settings')
      .update({ default_storage_provider: 'supabase_storage' })
      .eq('org_id', SEED.ORG_HOLDING);
  });
});
```

- [ ] **Step 2: Run it to confirm it fails (column absent).**

Run: `cd apps/web && pnpm exec vitest run tests/integration/charterBRealFlow.integration.test.ts`
Expected: FAIL — `column org_settings.default_storage_provider does not exist`.

- [ ] **Step 3: Write the slice migration.**

Create `supabase/migrations/20240179000000_charter_b_org_settings_storage_slice.sql`:

```sql
-- 20240179000000_charter_b_org_settings_storage_slice.sql
--
-- Charter B real-flow arc — D-1: org_settings storage slice (add-consumed-only).
--
-- Adds the v1-CONSUMED columns the reachability change needs:
--   - default_storage_provider — read by resolveStorageProvider (D-2).
--   - sharepoint_site_id / sharepoint_drive_id — read by orgDriveResolver
--     (forward-column read; null = not provisioned until per-org onboarding).
--
-- SCOPE — supersedes charter §4.A "adds all" (append-only): the inert
-- reserved columns (sharepoint_durability_mode / storage_retry_* /
-- preview_url_*) are NOT added here. They are unconsumed in v1 (the
-- provider never branches on durability at the 'none' rung; withRetry uses
-- hardcoded constants; previewUrl has zero callers) and are named as a
-- deferred sub-slice in spec D-1. Same reserve-don't-build-inert discipline
-- as the deferred Zod (carry #1) and the deferred provider_unavailable
-- routing surface (D-5). See spec 2026-06-07-charter-b-real-flow-design.md.
--
-- CHECK naming: default_storage_provider uses the _v1_active scheme (first
-- constraint on a new column), admitting the same v1-active provider set as
-- source_documents._v2_active. Paired with the D-4 Zod admit-set
-- (CHECK-broaden => Zod-broaden).

ALTER TABLE org_settings
  ADD COLUMN default_storage_provider storage_provider
    NOT NULL DEFAULT 'supabase_storage';

ALTER TABLE org_settings
  ADD COLUMN sharepoint_site_id text;

ALTER TABLE org_settings
  ADD COLUMN sharepoint_drive_id text;

ALTER TABLE org_settings
  ADD CONSTRAINT org_settings_default_storage_provider_v1_active
    CHECK (default_storage_provider IN ('supabase_storage', 'sharepoint_drive'));
```

- [ ] **Step 4: Apply the migration and regenerate types.**

Run: `pnpm db:reset:clean` (applies all migrations **and** seeds dev data — bare `pnpm db:reset` does NOT seed, so integration tests reading `SEED.*` would fail on missing data), then `pnpm db:generate-types`.
Expected: reset+seed completes; `apps/web/src/db/types.ts` `org_settings.Row` now includes `default_storage_provider`, `sharepoint_site_id`, `sharepoint_drive_id`.
> Post-execution note: Task 1 was originally run with bare `pnpm db:reset` + a manual seed tail (`docker restart supabase_kong_chounting && sleep 3 && pnpm db:seed:all`) to course-correct; this step is corrected forward-looking. Task 1 need not be re-run.

- [ ] **Step 5: Run the test to confirm it passes.**

Run: `cd apps/web && pnpm exec vitest run tests/integration/charterBRealFlow.integration.test.ts`
Expected: PASS (both cases).

- [ ] **Step 6: Commit.**

```bash
cd "$(git rev-parse --show-toplevel)"
git add supabase/migrations/20240179000000_charter_b_org_settings_storage_slice.sql \
        apps/web/src/db/types.ts \
        apps/web/tests/integration/charterBRealFlow.integration.test.ts
COORD_SESSION='charter-b-real-flow' git commit -m "feat(storage): Charter B real-flow D-1 — org_settings storage slice (add-consumed-only)

Adds default_storage_provider (NOT NULL DEFAULT supabase_storage, v1-active
CHECK) + sharepoint_site_id/drive_id. Supersedes charter §4.A 'adds all'
(append-only): inert reserved columns deferred per spec D-1.

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 2 — B / D-2 + D-4: `resolveStorageProvider` helper + Zod admit-set

**Files:**
- Create: `apps/web/src/shared/schemas/storage/storageProvider.schema.ts`
- Create: `apps/web/src/services/storage/resolveStorageProvider.ts`
- Test: `apps/web/tests/unit/resolveStorageProvider.test.ts` + append to `charterBRealFlow.integration.test.ts`

- [ ] **Step 1: Write the Zod admit-set schema (D-4).**

Create `apps/web/src/shared/schemas/storage/storageProvider.schema.ts`:

```typescript
// Layer-2 admit-set for the dynamic storage_provider value (ADR-0013 §2,
// Charter B real-flow D-4). Pairs with the org_settings + source_documents
// v1-active CHECKs (CHECK-broaden => Zod-broaden). This is the validation
// boundary the safety-invariant comment at the former V1_STORAGE_PROVIDER
// constant named: it must travel with the value going dynamic (D-2).
import { z } from 'zod';

export const StorageProviderAdmitSchema = z.enum([
  'supabase_storage',
  'sharepoint_drive',
]);

export type StorageProviderAdmit = z.infer<typeof StorageProviderAdmitSchema>;
```

- [ ] **Step 2: Write the failing unit test for the helper.**

Create `apps/web/tests/unit/resolveStorageProvider.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';

const maybeSingle = vi.fn();
vi.mock('@/db/adminClient', () => ({
  adminClient: () => ({
    from: () => ({ select: () => ({ eq: () => ({ maybeSingle }) }) }),
  }),
}));

import { resolveStorageProvider } from '@/services/storage/resolveStorageProvider';

describe('resolveStorageProvider (D-2, ingest-only)', () => {
  beforeEach(() => maybeSingle.mockReset());

  it('returns the org default when set to sharepoint_drive', async () => {
    maybeSingle.mockResolvedValue({ data: { default_storage_provider: 'sharepoint_drive' }, error: null });
    await expect(resolveStorageProvider('org-1')).resolves.toBe('sharepoint_drive');
  });

  it('falls back to supabase_storage when no org_settings row', async () => {
    maybeSingle.mockResolvedValue({ data: null, error: null });
    await expect(resolveStorageProvider('org-1')).resolves.toBe('supabase_storage');
  });

  it('falls back to supabase_storage when the column is null', async () => {
    maybeSingle.mockResolvedValue({ data: { default_storage_provider: null }, error: null });
    await expect(resolveStorageProvider('org-1')).resolves.toBe('supabase_storage');
  });
});
```

- [ ] **Step 3: Run it to confirm it fails (module not found).**

Run: `cd apps/web && pnpm exec vitest run tests/unit/resolveStorageProvider.test.ts`
Expected: FAIL — cannot find `@/services/storage/resolveStorageProvider`.

- [ ] **Step 4: Implement the helper.**

Create `apps/web/src/services/storage/resolveStorageProvider.ts`:

```typescript
// src/services/storage/resolveStorageProvider.ts
//
// Charter B real-flow D-2 — the single ingest-time storage-provider
// selection authority. Returns the org's default_storage_provider ENUM
// value (NOT the instance); callers pass it to getStorageProvider(enum) for
// the put AND stamp it on the source_documents row, so put/stamp agree.
//
// INGEST-ONLY. Fetch must NOT use this — a document is fetched from the
// provider it was WRITTEN under (byteFetch dispatches on the row's
// storage_provider, D-3), even if the org default later changes.
//
// Per ADR-0020: Layer-2 data-access; reads via adminClient like
// orgDriveResolver. Fallback to supabase_storage for orgs with no
// org_settings row or a null default (the amendment's non-M365 fallback).
import { adminClient } from '@/db/adminClient';
import { StorageProviderAdmitSchema } from '@/shared/schemas/storage/storageProvider.schema';
import type { StorageProviderEnum } from './types';

export async function resolveStorageProvider(
  org_id: string,
): Promise<StorageProviderEnum> {
  const db = adminClient();
  const { data } = await db
    .from('org_settings')
    .select('default_storage_provider')
    .eq('org_id', org_id)
    .maybeSingle();

  const raw = data?.default_storage_provider ?? null;
  if (raw === null) return 'supabase_storage';

  // D-4 admit-set: the resolved value must be in the v1-active set before it
  // is used for the put or stamped on the row. The DB CHECK already pins it,
  // so this is the paired Layer-2 guard (CHECK-broaden => Zod-broaden).
  return StorageProviderAdmitSchema.parse(raw);
}
```

- [ ] **Step 5: Run the unit test to confirm it passes.**

Run: `cd apps/web && pnpm exec vitest run tests/unit/resolveStorageProvider.test.ts`
Expected: PASS (3 cases).

- [ ] **Step 6: Add an integration case (real org_settings row).**

Append to `apps/web/tests/integration/charterBRealFlow.integration.test.ts` a new `describe('resolveStorageProvider (integration)')` that sets `org_settings.default_storage_provider = 'sharepoint_drive'` for `SEED.ORG_HOLDING`, calls `resolveStorageProvider(SEED.ORG_HOLDING)`, asserts `'sharepoint_drive'`, and restores `'supabase_storage'` in `afterAll`.

Run: `cd apps/web && pnpm exec vitest run tests/integration/charterBRealFlow.integration.test.ts`
Expected: PASS.

- [ ] **Step 7: Commit.**

```bash
cd "$(git rev-parse --show-toplevel)"
git add apps/web/src/shared/schemas/storage/storageProvider.schema.ts \
        apps/web/src/services/storage/resolveStorageProvider.ts \
        apps/web/tests/unit/resolveStorageProvider.test.ts \
        apps/web/tests/integration/charterBRealFlow.integration.test.ts
COORD_SESSION='charter-b-real-flow' git commit -m "feat(storage): Charter B real-flow D-2/D-4 — resolveStorageProvider helper + Zod admit-set

Single ingest-time selection authority; returns the org default enum,
fallback supabase_storage; output validated through the paired Layer-2
admit-set z.enum(['supabase_storage','sharepoint_drive']).

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 3 — B / D-2: wire the helper into the three ingest paths (+ §4.B-2 header)

**Files:**
- Modify: `apps/web/src/services/document-platform/documentPlatformService.ts` (single-doc: `:119` put, `:156` stamp; header `:3–6`)
- Modify: `apps/web/src/services/document-platform/ingestionService.ts` (drag-drop: `:218` put, `:305` stamp; mailbox: `:622` put, `:705` stamp; const `:174`)

- [ ] **Step 1: Single-doc path (documentPlatformService) — resolve via helper.**

In `createSourceDocumentImpl`, replace the use of the hardcoded `V1_STORAGE_PROVIDER` constant. Resolve once at the top of the function, then use the resolved value for both the put and the stamp:

```typescript
// near the top of createSourceDocumentImpl, after org_id is in scope:
const storage_provider = await resolveStorageProvider(input.org_id);
// :119 put — use the resolved instance:
const storageProvider = getStorageProvider(storage_provider);
// :156 stamp — stamp the SAME resolved value:
storage_provider, // (was V1_STORAGE_PROVIDER)
```

Add the import: `import { resolveStorageProvider } from '@/services/storage/resolveStorageProvider';`. Delete the file-local `const V1_STORAGE_PROVIDER = 'supabase_storage' as const;`.

- [ ] **Step 2: §4.B-2 header reconciliation (documentPlatformService).**

Edit the `INV-SERVICE-001` header (lines 3–6) so the "single canonical writer" claim reads accurately against the two-RPC reality:

```
// INV-SERVICE-001 export contract: createSourceDocument is A canonical
// writer of source_documents via create_source_document_with_audit. The
// ingestion batch path (ingestionService → create_ingest_batch_with_
// documents_with_audit) is the OTHER document-platform-owned writer. The
// real boundary is "no direct service-layer .insert() to these tables; all
// writes go through owned RPCs." Provider selection for BOTH writers
// resolves through one authority (resolveStorageProvider, Charter B
// real-flow D-2). Per ADR-0011 §1 entity ownership boundary.
```

- [ ] **Step 3: Batch paths (ingestionService) — resolve-in-TS-then-thread-to-both.**

In each of the two batch builders (drag-drop around `:218`/`:305`, mailbox around `:622`/`:705`), resolve once in TS and thread the value into both the put and the `p_documents` payload:

```typescript
// once, before the put loop (org id is `parsed.org_id` / `input.org_id`):
const storage_provider = await resolveStorageProvider(/* org id in scope */);
// at the put:
const storageProvider = getStorageProvider(storage_provider);
// in the p_documents map (was storage_provider: V1_STORAGE_PROVIDER):
storage_provider,
```

Add the import; delete the file-local `const V1_STORAGE_PROVIDER = 'supabase_storage' as const;`. Keep the SAFETY-INVARIANT comment block but update it to point at the now-landed dynamic selection + D-4 Zod (it is no longer "deferred").

- [ ] **Step 4: Run the existing ingestion + document-platform integration suites.**

Run: `cd apps/web && pnpm exec vitest run tests/integration` (the existing drag-drop, mailbox, and createSourceDocument integration tests must stay green — seed orgs default to `supabase_storage`, so behavior is unchanged).
Expected: PASS (no regressions). If any test hardcoded `V1_STORAGE_PROVIDER`, update it to assert the resolved value.

- [ ] **Step 5: Add the write-path integration assertion (the end-to-end-at-write proof).**

This is the proof the seam works at write: a `sharepoint_drive`-defaulted org must stamp `sharepoint_drive` on the row. Make it concrete — assert the **stamped row value**, not just no-throw. In `charterBRealFlow.integration.test.ts`:

```typescript
it('a sharepoint_drive-defaulted org stamps sharepoint_drive on the written row', async () => {
  // mock the sharepoint provider instance so no real Graph is touched:
  // vi.mock('@/services/storage/resolver', () => ({ getStorageProvider: vi.fn(() => mockProvider) }))
  // where mockProvider.put resolves a fake { storage_key, content_hash, byte_size, provider:'sharepoint_drive' }.
  await db.from('org_settings')
    .update({ default_storage_provider: 'sharepoint_drive' })
    .eq('org_id', SEED.ORG_HOLDING);

  const { source_document_id } = await documentPlatformService.createSourceDocument(/* …input for SEED.ORG_HOLDING… */, ctx);

  const { data } = await db
    .from('source_documents')
    .select('storage_provider')
    .eq('id', source_document_id)
    .single();
  expect(data!.storage_provider).toBe('sharepoint_drive');        // the stamped value
  expect(getStorageProvider).toHaveBeenCalledWith('sharepoint_drive'); // the put dispatched there
});
```

Restore `default_storage_provider='supabase_storage'` for `SEED.ORG_HOLDING` in `afterAll`.

Run: `cd apps/web && pnpm exec vitest run tests/integration/charterBRealFlow.integration.test.ts`
Expected: PASS.

- [ ] **Step 6: Commit.**

```bash
cd "$(git rev-parse --show-toplevel)"
git add apps/web/src/services/document-platform/documentPlatformService.ts \
        apps/web/src/services/document-platform/ingestionService.ts \
        apps/web/tests/integration/charterBRealFlow.integration.test.ts
COORD_SESSION='charter-b-real-flow' git commit -m "feat(storage): Charter B real-flow D-2 — wire resolveStorageProvider into all three ingest paths

Single-doc (co-located resolve/put/stamp) + both batch paths (resolve-in-TS-
then-thread-to-both put and p_documents). §4.B-2 header reconciled to the
two-RPC reality. storage_provider now dynamic; V1_STORAGE_PROVIDER constants
removed.

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 4 — B / D-3: `byteFetch` dispatch-on-row + forward-marker

**Files:**
- Modify: `apps/web/src/agent/orchestrator/extraction/stages/byteFetch.ts` (`:25` const, `:32` dispatch)
- Test: `apps/web/tests/integration/charterBRealFlow.integration.test.ts` (or a byteFetch unit test)

- [ ] **Step 1: Write the failing test — fetch dispatches on the row's provider.**

Add a case asserting that for a `source_documents` row written with `storage_provider='sharepoint_drive'`, `byteFetch` selects the sharepoint provider (mock `getStorageProvider` and assert it was called with `'sharepoint_drive'`, not `'supabase_storage'`):

```typescript
import { vi } from 'vitest';
const getStorageProvider = vi.fn();
vi.mock('@/services/storage/resolver', () => ({ getStorageProvider }));
// ...seed a source_documents row with storage_provider='sharepoint_drive',
// stub the returned provider's fetch, call byteFetch({source_document_id, ctx}),
// then:
expect(getStorageProvider).toHaveBeenCalledWith('sharepoint_drive');
```

Run: `cd apps/web && pnpm exec vitest run <this test>`
Expected: FAIL — `getStorageProvider` called with `'supabase_storage'` (the hardcoded constant).

- [ ] **Step 2: Implement dispatch-on-row.**

In `byteFetch.ts`, replace the hardcoded provider selection. Read the row's `storage_provider` first, then dispatch:

```typescript
import { adminClient } from '@/db/adminClient';
// ...delete: const V1_STORAGE_PROVIDER = 'supabase_storage' as const;

// inside byteFetch, before the fetch:
const { data: row, error: rowErr } = await adminClient()
  .from('source_documents')
  .select('storage_provider')
  .eq('id', input.source_document_id)
  .single();
if (rowErr || !row) {
  throw new ServiceError('NOT_FOUND', `[byteFetch] source_document ${input.source_document_id} not found`);
}
// DISPATCH-ON-ROW (D-3): a document is fetched from the provider it was
// WRITTEN under, never an org default or a constant.
const provider = getStorageProvider(row.storage_provider);
```

- [ ] **Step 3: Plant the forward-marker (D-3 §3.2).**

Add this comment immediately above the dispatch, so future read-method consumers inherit the rule:

```typescript
// FORWARD-MARKER (Charter B real-flow D-3 §3.2): EVERY storage read site
// must dispatch getStorageProvider on the ROW's storage_provider, never a
// constant or the org default. byteFetch is the only live fetch-dispatch
// today; previewUrl/verifyIntegrity/fetchVersion/delete have zero callers —
// when their consumers land, each inherits THIS rule. Do not reintroduce a
// hardcoded provider constant at a read site (the bug this arc fixed).
```

- [ ] **Step 4: Run the test to confirm it passes.**

Run: `cd apps/web && pnpm exec vitest run <this test>`
Expected: PASS — `getStorageProvider` called with `'sharepoint_drive'`.

- [ ] **Step 5: Commit.**

```bash
cd "$(git rev-parse --show-toplevel)"
git add apps/web/src/agent/orchestrator/extraction/stages/byteFetch.ts \
        apps/web/tests/integration/charterBRealFlow.integration.test.ts
COORD_SESSION='charter-b-real-flow' git commit -m "feat(storage): Charter B real-flow D-3 — byteFetch dispatch-on-row + forward-marker

Fetch selects the provider from the row's storage_provider (the provider the
doc was written under), not the hardcoded constant. Forward-marker planted
for the future preview/verify/delete read-method consumers.

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 5 — C / D-5: the two-layer masking wire contract (ONE coordinated task)

> **Critical (spec D-5 + read-back):** both edits land together. `classifyError`'s default branch returns `'transient_exhausted'` for any code it does not recognize, so `withRetry` (a) without `byteFetch` (b) just relocates the mask. `classifyError` is UNCHANGED.

**Files:**
- Modify: `apps/web/src/services/errors/ServiceError.ts` (union `:3–142`)
- Modify: `apps/web/src/services/storage/retry.ts` (`:87–93`)
- Modify: `apps/web/src/agent/orchestrator/extraction/stages/byteFetch.ts` (catch block)
- Test: `apps/web/tests/integration/providerUnavailableClassification.integration.test.ts`

- [ ] **Step 1: Write the failing wire-contract test.**

Create `apps/web/tests/integration/providerUnavailableClassification.integration.test.ts`: stub a provider whose `fetch` throws a Graph-shaped 403 (so `classifyStorageFailure` → `provider_unavailable`); run `byteFetch` for a `sharepoint_drive` row; assert the thrown `ServiceError.code === 'PIPELINE_UNAVAILABLE'` (NOT `'PIPELINE_TRANSIENT_EXHAUSTED'`). Add a second assertion that `withRetry` directly throws `STORAGE_PROVIDER_UNAVAILABLE` for the same error.

Run: `cd apps/web && pnpm exec vitest run tests/integration/providerUnavailableClassification.integration.test.ts`
Expected: FAIL — today the code is `PIPELINE_TRANSIENT_EXHAUSTED` (masked at both layers).

- [ ] **Step 2: Add the `STORAGE_PROVIDER_UNAVAILABLE` ServiceError code.**

In `ServiceError.ts`, add to the union (near the other storage codes, ~`:89`):

```typescript
  | 'STORAGE_PROVIDER_UNAVAILABLE'         // ADR-0013 §7/§8 — provider unreachable (no-retry); Charter B real-flow D-5
```

- [ ] **Step 3: Edit `withRetry` (layer a) — stop flattening to the catchall.**

In `retry.ts`, replace the `provider_unavailable` branch (`:87–93`):

```typescript
      if (classification.kind === 'provider_unavailable') {
        // Charter B real-flow D-5: propagate the TYPED classification so the
        // calling layer (byteFetch) can map it to PIPELINE_UNAVAILABLE. No
        // retry (correct — a 401/403/404 won't recover by retrying).
        throw new ServiceError(
          'STORAGE_PROVIDER_UNAVAILABLE',
          err instanceof Error ? err.message : String(err),
          err,
        );
      }
```

- [ ] **Step 4: Edit `byteFetch` catch (layer b) — map the typed code to `PIPELINE_UNAVAILABLE`.**

Replace the blanket catch so it distinguishes the provider-unavailable code:

```typescript
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    // Charter B real-flow D-5 wire contract:
    //   STORAGE_PROVIDER_UNAVAILABLE -> PIPELINE_UNAVAILABLE -> classifyError
    //   routes to failure_class 'unavailable' + emits pipeline_unavailable
    //   audit (classifyError UNCHANGED). Everything else stays transient.
    if (err instanceof ServiceError && err.code === 'STORAGE_PROVIDER_UNAVAILABLE') {
      throw new ServiceError('PIPELINE_UNAVAILABLE', `[byteFetch] provider unavailable: ${message}`);
    }
    throw new ServiceError('PIPELINE_TRANSIENT_EXHAUSTED', `[byteFetch] storage fetch failed: ${message}`);
  }
```

- [ ] **Step 5: Run the wire-contract test to confirm it passes.**

Run: `cd apps/web && pnpm exec vitest run tests/integration/providerUnavailableClassification.integration.test.ts`
Expected: PASS — code is `PIPELINE_UNAVAILABLE`; `withRetry` throws `STORAGE_PROVIDER_UNAVAILABLE`.

- [ ] **Step 6: Run the storage + extraction suites for no regressions.**

Run: `cd apps/web && pnpm exec vitest run tests/unit/storageResolver.test.ts tests/integration` (transient still maps to `PIPELINE_TRANSIENT_EXHAUSTED`; `classifyError` unchanged).
Expected: PASS.

- [ ] **Step 7: Commit (single coordinated commit — both layers together).**

```bash
cd "$(git rev-parse --show-toplevel)"
git add apps/web/src/services/errors/ServiceError.ts \
        apps/web/src/services/storage/retry.ts \
        apps/web/src/agent/orchestrator/extraction/stages/byteFetch.ts \
        apps/web/tests/integration/providerUnavailableClassification.integration.test.ts
COORD_SESSION='charter-b-real-flow' git commit -m "feat(storage): Charter B real-flow D-5 — two-layer provider_unavailable wire contract

STORAGE_PROVIDER_UNAVAILABLE (withRetry) -> PIPELINE_UNAVAILABLE (byteFetch)
-> classifyError UNCHANGED ('unavailable' + pipeline_unavailable audit).
Both edits together — (a) without (b) half-lands (classifyError default-to-
transient). Replaces wasted retries with an honest pipeline_unavailable trail.

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 6 — C / D-5: reserve the `provider_unavailable` `exception_reason` (not-active)

**Files:**
- Create: `supabase/migrations/20240180000000_charter_b_exception_reason_provider_unavailable_reserve.sql`
- Test: append to `charterBRealFlow.integration.test.ts`
- Regenerate: `apps/web/src/db/types.ts`

- [ ] **Step 1: Write the failing test (enum has the value; active CHECK rejects it).**

Add a case: attempt to insert an `exception_queue_entries` row with `exception_reason='provider_unavailable'` (via the seed/admin client against a seed case in `classified` state) and assert it fails with `check_violation` (the value is reserved, not in `exception_reason_chunk_6_active`). Also assert the enum type *accepts* the value at the type level (a cast `'provider_unavailable'::exception_reason` succeeds — no `invalid_input_value`).

Run: `cd apps/web && pnpm exec vitest run tests/integration/charterBRealFlow.integration.test.ts`
Expected: FAIL — the cast errors today (`invalid input value for enum exception_reason`).

- [ ] **Step 2: Write the reserve migration.**

Create `supabase/migrations/20240180000000_charter_b_exception_reason_provider_unavailable_reserve.sql`:

```sql
-- 20240180000000_charter_b_exception_reason_provider_unavailable_reserve.sql
--
-- Charter B real-flow arc — D-5: reserve a provider_unavailable-class
-- exception_reason value, NOT-active.
--
-- The value is added to the enum as a named forward-hook for the Phase-7
-- routing surface, but is deliberately NOT added to the v1-active CHECK
-- (exception_reason_chunk_6_active stays as-is). The v1 deliverable is the
-- honest-classification wire contract (D-5 Task 5), not exception-queue
-- routing — the routing surface + the enqueue coupling-wall design are
-- deferred-with-their-consumer to Phase-7 (the case at byte-fetch time is
-- 'received', pre-classification, which the enqueue path's classified|matched
-- coupling rejects). See spec D-5. drift_detected stays DISTINCT — it is the
-- §5-6 scheduled-drift surface, not this inline-read-failure class.
--
-- Postgres ALTER TYPE ADD VALUE cannot be referenced by name in the same
-- transaction; this migration adds NO CHECK reference, so it is safe solo.

ALTER TYPE exception_reason ADD VALUE IF NOT EXISTS 'provider_unavailable';
```

- [ ] **Step 3: Apply and regenerate types.**

Run: `pnpm db:reset:clean` (reset + seed — bare `pnpm db:reset` does NOT seed) then `pnpm db:generate-types`.
Expected: `exception_reason` enum in `db/types.ts` now includes `'provider_unavailable'`.

- [ ] **Step 4: Run the test to confirm it passes.**

Run: `cd apps/web && pnpm exec vitest run tests/integration/charterBRealFlow.integration.test.ts`
Expected: PASS — cast succeeds; the active CHECK still rejects an insert (reserved-not-active).

- [ ] **Step 5: Commit.**

```bash
cd "$(git rev-parse --show-toplevel)"
git add supabase/migrations/20240180000000_charter_b_exception_reason_provider_unavailable_reserve.sql \
        apps/web/src/db/types.ts \
        apps/web/tests/integration/charterBRealFlow.integration.test.ts
COORD_SESSION='charter-b-real-flow' git commit -m "feat(storage): Charter B real-flow D-5 — reserve provider_unavailable exception_reason (not-active)

Named forward-hook for the Phase-7 routing surface; NOT in the v1-active
CHECK. Routing + coupling-wall deferred-with-consumer. drift_detected stays
distinct.

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 7 — D / D-6: the gated tail (local parts in-arc; live run gated)

> **Honesty gate (spec D-6):** the arc closes **UNIT-PROVEN**. This task lands the local-buildable parts and the gated harness; it does **not** run the live integration. "Wired" must not read as "proven live."

**Files:**
- Create: `docs/09_briefs/post-mvp/runbooks/charter-b-sharepoint-onboarding.md`
- Create: `apps/web/tests/e2e/sharepointDriveRealFlow.e2e.test.ts` (RUN_*-gated)
- Verify (no edit unless needed): env handling of `GRAPH_TENANT_ID`/`GRAPH_CLIENT_ID`/`GRAPH_CLIENT_CERT_PATH`

- [ ] **Step 1: Confirm env wiring (read-only).**

Run: `grep -n "GRAPH_" apps/web/src/env.ts apps/web/src/services/storage/providers/graph/graphClient.ts`
Expected: `GRAPH_*` are optional-at-boot (NOT in `REQUIRED_SERVER`); `graphClient` throws "not configured" when unset. No code change needed — document the required vars in the runbook (Step 2). If `env.ts` does not declare them as optional reads, add them as optional (no `REQUIRED_SERVER` entry).

- [ ] **Step 2: Write the onboarding runbook.**

Create `docs/09_briefs/post-mvp/runbooks/charter-b-sharepoint-onboarding.md` documenting: (1) Azure app registration with **`Sites.Selected` ONLY** (additive-permission discipline — no broader `Files.*`/`Sites.*`); (2) client-certificate generation + `GRAPH_CLIENT_CERT_PATH`; (3) per-site grant (`New-MgSitePermission` / SharePoint admin center) for each customer site; (4) setting the org's `org_settings.default_storage_provider='sharepoint_drive'` + `sharepoint_site_id`/`sharepoint_drive_id` (the operator-onboarding step, decision #1); (5) running the gated e2e (Step 3).

- [ ] **Step 3: Write the RUN_*-gated live-Graph e2e harness (authored now, gated run).**

Create `apps/web/tests/e2e/sharepointDriveRealFlow.e2e.test.ts`, gated like the Modal e2e:

```typescript
import { describe, it } from 'vitest';
const RUN = process.env.RUN_SHAREPOINT_E2E === '1';
describe.skipIf(!RUN)('SharePoint real-flow live e2e (gated: RUN_SHAREPOINT_E2E=1)', () => {
  it('ingests a doc to a sharepoint_drive org and fetches it back through the provider', async () => {
    // Against a real Graph-configured tenant (GRAPH_* set, per the runbook):
    // 1. set org_settings.default_storage_provider='sharepoint_drive' + site/drive ids
    // 2. run the ingest path -> bytes land in SharePoint, row stamped sharepoint_drive
    // 3. run byteFetch -> bytes fetched back via the sharepoint provider (dispatch-on-row)
    // 4. assert content_hash round-trips (the §9 integrity discharge)
  });
});
```

- [ ] **Step 4: Confirm the harness skips by default (no creds).**

Run: `cd apps/web && pnpm exec vitest run tests/e2e/sharepointDriveRealFlow.e2e.test.ts`
Expected: SKIPPED (RUN_SHAREPOINT_E2E unset). The live run is the gated step — NOT executed at arc close.

- [ ] **Step 5: Commit.**

```bash
cd "$(git rev-parse --show-toplevel)"
git add docs/09_briefs/post-mvp/runbooks/charter-b-sharepoint-onboarding.md \
        apps/web/tests/e2e/sharepointDriveRealFlow.e2e.test.ts
COORD_SESSION='charter-b-real-flow' git commit -m "feat(storage): Charter B real-flow D-6 — gated tail (runbook + RUN_*-gated live-Graph e2e)

Local-buildable parts land in-arc; Azure Sites.Selected registration + cert +
per-site grant + live run are gated steps (RUN_SHAREPOINT_E2E). Arc closes
UNIT-PROVEN: wired and unit/integration-proven, first live transfer gated.

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Final verification (before arc-close / push-readiness)

- [ ] `pnpm agent:validate` green (typecheck + no-hardcoded-URLs + Category A floor).
- [ ] `pnpm test:full` green (Condition 1 evidence) — note the gated e2e is SKIPPED, by design.
- [ ] `pnpm typecheck` green.
- [ ] Doc-sync: the spec's §4.B-2 header reconciliation landed; `db/types.ts` regenerated against the post-slice + post-reserve schema; the charter §4.A supersession is recorded in the slice migration header.
- [ ] **Doc-sync sweep of touched-file headers** (named step — header behavioral comments lagged the code edits twice during execution: documentPlatformService preamble at Task 3, retry.ts disposition matrix at Task 5). Re-read the file-header/disposition/preamble comments of every touched source file (documentPlatformService.ts, ingestionService.ts, resolver.ts, retry.ts, byteFetch.ts, failureClassification.ts) and confirm each describes the post-arc behavior — not a pre-arc claim. The code edits have been clean; the lag is in the prose that documents them.
- [ ] Closeout carries the **UNIT-PROVEN** qualifier: "reachable in principle, dynamic selection + classification proven against mocked Graph; first live Graph transfer gated on D."

Push (origin/staging) + lock-release are the operator's, at arc-close per the push-terminal-close pattern.
