// tests/integration/e2e/sharepointDriveRealFlow.e2e.test.ts
//
// Charter B real-flow D-6 — the gated live-Graph e2e (the honesty gate's
// discharge). GATED: skips by default (mirrors the RUN_MODAL_E2E pattern).
//
// Requires the onboarding runbook complete (no live run at arc close):
//   docs/09_briefs/post-mvp/runbooks/charter-b-sharepoint-onboarding.md
//   — Azure Sites.Selected app + client cert (GRAPH_* env) + per-site grant +
//     an org pointed at sharepoint_drive (default_storage_provider +
//     sharepoint_site_id/drive_id) via SHAREPOINT_E2E_ORG_ID.
// Then:
//   cd apps/web && RUN_SHAREPOINT_E2E=1 SHAREPOINT_E2E_ORG_ID=<org> \
//     pnpm test:integration tests/integration/e2e/sharepointDriveRealFlow.e2e
//
// HONESTY GATE: the arc closes UNIT-PROVEN. This harness is authored now, while
// the selection-seam code is fresh, so the live proof is "one RUN_SHAREPOINT_E2E=1
// away" once Azure ops land — but the live run is NOT executed at close, and this
// body intentionally throws (not a trivial pass) until the concrete flow is
// written against a real tenant, so a gated run can never false-green as
// "proven live."
import { describe, it } from 'vitest';

const RUN_E2E = Boolean(
  process.env.GRAPH_TENANT_ID &&
    process.env.GRAPH_CLIENT_ID &&
    process.env.GRAPH_CLIENT_CERT_PATH &&
    process.env.RUN_SHAREPOINT_E2E,
);

const GRAPH_TIMEOUT_MS = 120_000;

describe.skipIf(!RUN_E2E)(
  'Charter B real-flow — sharepoint_drive live e2e (gated: RUN_SHAREPOINT_E2E=1 + GRAPH_*)',
  () => {
    it(
      'ingests a doc to a sharepoint_drive org and fetches it back through the provider (content_hash round-trips)',
      async () => {
        // Concrete flow to implement against a real tenant (runbook complete):
        //   1. ctx = makeTestContext({ org_ids: [SHAREPOINT_E2E_ORG_ID] });
        //      assert org_settings.default_storage_provider === 'sharepoint_drive'
        //      and sharepoint_site_id/drive_id are set (the runbook step-4 config).
        //   2. createSourceDocument(...) to that org → real Graph put; assert the
        //      persisted source_documents.storage_provider === 'sharepoint_drive'
        //      (resolveStorageProvider picked the org default; put went to Graph).
        //   3. byteFetch(source_document_id) → real Graph fetch via dispatch-on-row;
        //      assert fetched.result.content_hash === the put's content_hash
        //      (the §9 put-then-re-read integrity discharge round-trips) and
        //      fetched.result.provider === 'sharepoint_drive'.
        throw new Error(
          'sharepoint_drive live e2e not yet implemented — complete the onboarding ' +
            'runbook then write the flow above. This RED is intentional: the arc ' +
            'closed UNIT-PROVEN with live transfer gated (D-6). Implementing this ' +
            'body against a real tenant is the PROVEN-LIVE discharge.',
        );
      },
      GRAPH_TIMEOUT_MS,
    );
  },
);
