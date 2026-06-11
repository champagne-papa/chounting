# Plan — graphClient cert-from-env (Phase 1)

**Status:** RATIFIED 2026-06-09 (advisor-cleared; ratify + commit-under-lock delegated to the
executor). Committed under lock `graphclient-cert-from-env`. Push + lock-release Phil's.
**Realizes:** spec `749b2f8e` (charter → spec → **plan** → execute). Anchored at `3e0130b1`;
charter `7dbdb046`.

---

## One task, one green commit (TDD)

The change is tightly coupled (env rename + `readGraphConfig` read/decode + the test all reference
the var), so it lands atomically. TDD: write the test → RED → implement → GREEN, with the runbook
doc-sync.

**Step 1 — test → RED.** Add `apps/web/tests/unit/graphClient.test.ts` (or extend an existing unit
file) exercising the exported `readGraphConfig`:
- missing `GRAPH_CLIENT_CERT_PEM` (and/or tenant/client) → typed `ServiceError` with the right
  `missing` list;
- valid base64-encoded PEM → returns the decoded PEM string;
- malformed (non-base64-noise that decodes to non-PEM, or a non-PEM string) → clear typed
  `ServiceError` (not a cryptic crash).
RED because `readGraphConfig` isn't exported yet and still reads `GRAPH_CLIENT_CERT_PATH`.

**Step 2 — implement → GREEN.**
- `env.ts:79` — rename export property **+** `process.env` key `GRAPH_CLIENT_CERT_PATH` →
  `GRAPH_CLIENT_CERT_PEM` (both flip; optional-at-boot); update the `:68-74` comment.
- `graphClient.ts` — `readGraphConfig` reads `env.GRAPH_CLIENT_CERT_PEM`, base64-decodes,
  validates PEM-shape (`-----BEGIN`…`-----END`) → typed `ServiceError` on failure, returns
  `{ tenantId, clientId, certificatePem }`; **export** `readGraphConfig`; `getGraphClient` calls the
  pinned `:51` overload `new ClientCertificateCredential(tenantId, clientId, { certificate:
  certificatePem })`; correct the `:79-80` disk-path comment. **No `node:fs`** (in-memory PEM; the
  disk read goes away with the path overload).
- `apps/web/.env.example:52` — rename key + placeholder; comment notes base64 + **Sensitive**.
  (`.env.local` has no GRAPH_* — no edit.)

**Step 3 — doc-sync both runbooks** to `GRAPH_CLIENT_CERT_PEM` (base64, Sensitive):
`runbooks/charter-b-sharepoint-onboarding.md` step 2 + `runbooks/mailbox-sharepoint-onboarding.md`
§A.

**Verify gate:** `pnpm typecheck` clean (closes §1 — `{ certificate }` must resolve to the `:51`
overload); the new graphClient test green (missing / valid / malformed); `pnpm test:full` green;
grep confirms no `GRAPH_CLIENT_CERT_PATH` / `node:fs` left in `graphClient.ts`/`env.ts`. **Commit.**

## Per-task read-back focus (mirrors the advisor's)

typecheck passes specifically on the `{ certificate }` overload; the `readGraphConfig` test covers
missing / valid-base64 / malformed-with-typed-error; the env rename is atomic (property + key, no
half-rename); the disk-path call site + its `:79-80` comment are gone; both runbooks doc-synced; no
`node:fs` crept in.

## Boundary

Code + test + doc-sync in-arc. Live Graph auth is the operator discharge (UNIT-PROVEN ≠ PROVEN).
No boot-fatal (optional-at-boot var). Push + lock-release Phil's at arc close.
