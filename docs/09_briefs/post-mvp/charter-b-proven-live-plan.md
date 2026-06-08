# Charter B PROVEN-LIVE — Implementation Plan (live SharePoint e2e harness body)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans (or subagent-driven-development) to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Replace the throws-until-implemented stub in the gated SharePoint
live-e2e harness with the real ingest→fetch flow + the PROVEN-LIVE assertions,
so the harness is one `RUN_SHAREPOINT_E2E=1` away from proving a real
`sharepoint_drive` document round-trips through Graph via the dispatch-on-row
seam.

**Architecture:** One gated test file. No production code changes — the
selection seam (`resolveStorageProvider`, `byteFetch`), the provider, and
`realGraphIo` all already exist; this realizes the test body that exercises
them live. The body stays `describe.skipIf(!RUN_E2E)`-gated: it skips in CI and
is typecheck-valid; it makes live Graph calls only when an operator sets
`GRAPH_*` + `RUN_SHAREPOINT_E2E=1` against a configured tenant.

**Tech Stack:** vitest (gated integration e2e), Microsoft Graph (live, gated),
`integrity.ts` `computeHash` (SHA-256), the pipeline's `SystemActorServiceContext`.

**Source spec:** `docs/09_briefs/post-mvp/specs/charter-b-proven-live-design.md`
(ratified `fe20a46b`). **Charter:** `…/charter-b-proven-live-charter.md`
(`eb9c431e`).

**THE HONESTY BOUNDARY (load-bearing):** executing this plan produces a
**correct-and-gated harness body — NOT PROVEN-LIVE.** PROVEN-LIVE is the green
run against a real tenant, which only Phil can produce (runbook steps 1–4 +
`RUN_SHAREPOINT_E2E=1`). The code arc closes at typecheck-clean + skips-by-default
+ no-regression. Do not let "body written" read as "proven live."

**Coordination:** commit under the `charter-b-proven-live` session lock
(`COORD_SESSION='charter-b-proven-live'` set in the shell, repo-root cwd).

---

## File Structure

**Modify (only):**
- `apps/web/tests/integration/e2e/sharepointDriveRealFlow.e2e.test.ts` — replace
  the stub `it` body (currently throws) with the real flow. Keep the file's gate
  (`RUN_E2E` on `GRAPH_* + RUN_SHAREPOINT_E2E`) and `describe.skipIf` exactly.

No other files. No production code, no migrations.

---

## Task 1 — Implement the gated harness body

**Files:**
- Modify: `apps/web/tests/integration/e2e/sharepointDriveRealFlow.e2e.test.ts`

- [ ] **Step 1: Replace the file with the real flow.**

Overwrite the file with this exact content (keeps the gate; replaces the
throwing stub with the spec §4 flow + §2 assertions + §3 ctx literals):

```ts
// tests/integration/e2e/sharepointDriveRealFlow.e2e.test.ts
//
// Charter B PROVEN-LIVE — the gated live-Graph e2e (the live gate's discharge).
// GATED: skips by default. PROVEN-LIVE is a GREEN RUN here against a real
// tenant — writing this body is NOT PROVEN-LIVE.
//
// Requires the onboarding runbook complete:
//   docs/09_briefs/post-mvp/runbooks/charter-b-sharepoint-onboarding.md
//   — Azure Sites.Selected app + client cert (GRAPH_* env) + per-site grant +
//     an org pointed at sharepoint_drive (default_storage_provider +
//     sharepoint_site_id/drive_id) via SHAREPOINT_E2E_ORG_ID.
// Then:
//   cd apps/web && RUN_SHAREPOINT_E2E=1 SHAREPOINT_E2E_ORG_ID=<org> \
//     pnpm test:integration tests/integration/e2e/sharepointDriveRealFlow.e2e
//
// Proof shape (charter §4 fix-direction): exercise the byteFetch SEAM and
// RECOMPUTE the fetched bytes — NOT a verifyIntegrity shortcut (a different
// provider path byteFetch never calls). put self-verifies at write, so its
// content_hash is trustworthy; the fetch side is the unproven half, closed
// only by recomputing the returned bytes.
import { describe, it, expect } from 'vitest';
import { adminClient } from '../../setup/testDb';
import { makeTestContext } from '../../setup/makeTestContext';
import { createIngestBatchForTest } from '../../helpers/createIngestBatchForTest';
import { documentPlatformService } from '@/services/document-platform/documentPlatformService';
import { byteFetch } from '@/agent/orchestrator/extraction/stages/byteFetch';
import { getStorageProvider } from '@/services/storage/resolver';
import { computeHash } from '@/services/storage/integrity';
import {
  SYSTEM_ACTOR_USER_ID,
  type SystemActorServiceContext,
} from '@/services/middleware/serviceContext';
import { loggerWith } from '@/shared/logger/pino';

const RUN_E2E = Boolean(
  process.env.GRAPH_TENANT_ID &&
    process.env.GRAPH_CLIENT_ID &&
    process.env.GRAPH_CLIENT_CERT_PATH &&
    process.env.RUN_SHAREPOINT_E2E,
);
const E2E_ORG_ID = process.env.SHAREPOINT_E2E_ORG_ID ?? '';
const GRAPH_TIMEOUT_MS = 120_000;

describe.skipIf(!RUN_E2E)(
  'Charter B real-flow — sharepoint_drive live e2e (gated: RUN_SHAREPOINT_E2E=1 + GRAPH_*)',
  () => {
    it(
      'ingests to a sharepoint_drive org and fetches back through the seam (byte-faithful round-trip)',
      async () => {
        const db = adminClient();
        const humanCtx = makeTestContext({ org_ids: [E2E_ORG_ID] });
        const log = loggerWith({ trace_id: humanCtx.trace_id });

        // 1. Config sanity — the runbook step-4 precondition (clear failure if
        //    the operator hasn't pointed the org at sharepoint_drive).
        const { data: settings } = await db
          .from('org_settings')
          .select('default_storage_provider, sharepoint_site_id, sharepoint_drive_id')
          .eq('org_id', E2E_ORG_ID)
          .single();
        expect(settings?.default_storage_provider).toBe('sharepoint_drive');
        expect(settings?.sharepoint_site_id).toBeTruthy();
        expect(settings?.sharepoint_drive_id).toBeTruthy();

        // 2. Ingest — real Graph put. NO vi.mock: getStorageProvider resolves
        //    the real createSharepointDriveProvider() whose default realGraphIo
        //    makes live Graph calls.
        const bytes = new TextEncoder().encode(
          `charter-b proven-live ${humanCtx.trace_id}`,
        );
        const { ingest_batch_id } = await createIngestBatchForTest(E2E_ORG_ID);
        const created = await documentPlatformService.createSourceDocument(
          {
            bytes,
            mime_type: 'application/pdf',
            org_id: E2E_ORG_ID,
            original_filename: 'charter-b-proven-live.pdf',
            ingest_channel: 'direct_upload',
            ingest_batch_id,
            received_at: new Date().toISOString(),
            created_by: SYSTEM_ACTOR_USER_ID,
          },
          humanCtx,
        );
        expect(created.provider).toBe('sharepoint_drive'); // put dispatched to Graph

        // 3. Fetch via the SEAM — system-actor ctx (real typed literal, no cast;
        //    SystemActorCaller.system_actor is REQUIRED).
        const systemCtx: SystemActorServiceContext = {
          trace_id: humanCtx.trace_id,
          caller: {
            user_id: null,
            system_actor: 'pipeline_orchestrator',
            system_user_id: SYSTEM_ACTOR_USER_ID,
          },
          org_id: E2E_ORG_ID,
        };
        const fetched = await byteFetch({
          source_document_id: created.id,
          ctx: systemCtx,
        });

        // 4. PROVEN-LIVE assertions (charter §4 fix-direction):
        //    (a) the dispatch-on-row seam selected the provider FROM THE ROW;
        //    (b) the live Graph transfer is BYTE-FAITHFUL — recompute SHA-256
        //        of the bytes byteFetch returned and compare to the put hash.
        //        (NOT fetched.result.content_hash, which is the row's STORED
        //        hash and would pass even on corrupted bytes.)
        expect(fetched.result.provider).toBe('sharepoint_drive');
        expect(computeHash(fetched.result.bytes)).toBe(created.content_hash);

        // 5. Best-effort cleanup (deliberate scope-note vs charter #3: delete's
        //    first test-only live exercise, hygiene only). Non-fatal; a failure
        //    is logged PROMINENTLY (delete has never run live → real info).
        try {
          await getStorageProvider('sharepoint_drive').delete(created.id, systemCtx);
        } catch (err) {
          log.error(
            { err, source_document_id: created.id },
            'PROVEN-LIVE cleanup: sharepoint delete FAILED (non-fatal; proof already passed)',
          );
        }
        await db.from('audit_log').delete().eq('trace_id', humanCtx.trace_id);
      },
      GRAPH_TIMEOUT_MS,
    );
  },
);
```

- [ ] **Step 2: Typecheck (the gated body must compile).**

Run: `pnpm typecheck`
Expected: clean. If `provider.delete(created.id, systemCtx)` errors on the ctx
type, note: `byteFetch` already passes a `SystemActorServiceContext` to
`provider.fetch` (same `StorageProviderContext` param), so this should compile;
if `StorageProviderContext` is narrower, pass `humanCtx` to `delete` instead (a
ServiceContext is equally valid for the bytes-removal step) — but confirm via
the type, not a cast.

- [ ] **Step 3: Confirm the harness skips by default.**

Run: `cd apps/web && pnpm exec vitest run tests/integration/e2e/sharepointDriveRealFlow.e2e.test.ts`
Expected: `↓ 1 skipped` (RUN_SHAREPOINT_E2E unset). The live run is NOT executed
here — that's Phil's discharge.

- [ ] **Step 4: Confirm no full-suite regression.**

Run: `pnpm test:full`
Expected: green, with the harness still skipped (gated e2e count unchanged). The
body is test-only and gated, so no production behavior changed.

- [ ] **Step 5: Commit.**

```bash
cd "$(git rev-parse --show-toplevel)"
git add apps/web/tests/integration/e2e/sharepointDriveRealFlow.e2e.test.ts
COORD_SESSION='charter-b-proven-live' git commit -m "feat(storage): Charter B PROVEN-LIVE — implement the gated live-Graph e2e harness body

Replaces the throws-until-implemented stub with the real ingest->fetch flow:
config-sanity -> createSourceDocument (real Graph put, no mock) -> byteFetch
(the dispatch-on-row seam, system-actor ctx) -> PROVEN-LIVE assertions
(provider==='sharepoint_drive' AND computeHash(fetched.result.bytes)===
created.content_hash, the byte-faithful recompute) -> best-effort cleanup.

Still skipIf-gated: skips in CI, typecheck-valid. This is the harness
READINESS, not PROVEN-LIVE — the green run against a real tenant
(RUN_SHAREPOINT_E2E=1 after runbook ops) is the discharge, and is Phil's.

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Final verification (the code arc's close — NOT PROVEN-LIVE)

- [ ] `pnpm typecheck` clean.
- [ ] Harness skips by default (`↓ 1 skipped`).
- [ ] `pnpm test:full` green (harness skipped, no regression).
- [ ] Closeout carries the honesty line: **harness body correct-and-gated; the
  live SharePoint round-trip is NOT proven by this arc — `RUN_SHAREPOINT_E2E=1`
  against a real tenant is the PROVEN-LIVE discharge, and is Phil's.**
- [ ] **Not done by this arc, by design:** the live run. No agent can perform
  the runbook ops; the green run is the operator's.

Push (`origin/staging`) + lock release are the operator's, at arc close per the
push-terminal-close pattern.
