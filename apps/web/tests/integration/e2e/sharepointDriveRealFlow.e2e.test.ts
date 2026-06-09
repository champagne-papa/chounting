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
