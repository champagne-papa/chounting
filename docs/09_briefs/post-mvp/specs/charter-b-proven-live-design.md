# Charter B PROVEN-LIVE — design spec (live SharePoint e2e harness body)

**Status:** Design spec — **ratified, committed under lock** at `fe20a46b` (read-back caught + folded the §3 required-`system_actor` fix). Realizes the ratified charter (`eb9c431e`); lands mismatch #1 as concrete assertions and resolves mismatch #2.
**Anchored at:** `staging == origin/staging == 3796de62` + the charter at `eb9c431e` (all code reads `[disk]` first-hand this session).
**Coordination:** session lock `charter-b-proven-live`.
**Charter:** `docs/09_briefs/post-mvp/charter-b-proven-live-charter.md`.
**Provenance legend:** `[disk]` grounded first-hand; `[design]` decided here; `[charter]` fixed by the ratified charter.

---

## 1. Scope and non-scope

**In scope (code-able, mine):** implement the gated harness body in
`tests/integration/e2e/sharepointDriveRealFlow.e2e.test.ts` — replace the
throws-until-implemented stub with the real ingest→fetch flow + the
PROVEN-LIVE assertions. The harness stays `describe.skipIf(!RUN_E2E)`-gated;
it skips in CI and is typecheck-valid.

**Non-scope (operator-gated, Phil's — `[charter]` §3):** Azure `Sites.Selected`
registration, client cert + `GRAPH_*` on the host, per-site grant, an org
pointed at `sharepoint_drive` with real site/drive ids, and the
`RUN_SHAREPOINT_E2E=1` green run. **PROVEN-LIVE is that green run, not this
body.** The spec must not let "harness body written" drift toward a
PROVEN-LIVE claim — the body's existence is the *readiness*, the green run is
the *discharge*.

**Out of scope (no over-scoping, charter minor #3):** the read methods
`previewUrl`/`verifyIntegrity`/`fetchVersion`/`delete` (zero-consumer; the D-3
forward-marker binds their future callers). This harness exercises only the
**put + fetch** path.

## 2. The PROVEN-LIVE assertion design (mismatch #1, `[charter]`-bound)

The proof exercises the **`byteFetch` seam** and **recomputes** — never a
`verifyIntegrity` shortcut (a different provider code path `byteFetch` never
calls; using it would prove the integrity method works while bypassing the
dispatch-on-row seam this arc exists to prove live). The asymmetry: `put`
self-verifies at write (re-read + `verifyHash`), so the put's returned
`content_hash` is trustworthy; the *fetch* side is the unproven half, closed
only by recomputing the fetched bytes. `[charter]`

Concrete assertions (in order):

```ts
// after createSourceDocument(...) → `put` (real Graph) returns `created`:
expect(created.provider).toBe('sharepoint_drive');           // put dispatched to Graph
// after byteFetch({ source_document_id: created.id, ctx: systemCtx }) → `fetched`:
expect(fetched.result.provider).toBe('sharepoint_drive');    // (a) the SEAM selected the
                                                             //     provider FROM THE ROW
expect(computeHash(fetched.result.bytes)).toBe(created.content_hash); // (b) the live Graph
                                                             //     transfer is BYTE-FAITHFUL
```

- Assertion **(a)** proves the dispatch-on-row seam: `byteFetch` read the row,
  called `getStorageProvider(row.storage_provider)`, and reached the sharepoint
  provider. `[design]`
- Assertion **(b)** is the load-bearing one: `computeHash` (the same
  `integrity.ts` function the provider uses) is recomputed over the **bytes
  `byteFetch` actually returned from Graph** and compared to the put's hash.
  This is what `fetched.result.content_hash` (the row's STORED hash) cannot
  prove — it would pass even on corrupted bytes. `[disk][design]`
- **Supplementary (optional, not a substitute):** a `provider.verifyIntegrity`
  call MAY be added as belt-and-suspenders via the purpose-built recompute
  path, but the spec forbids it replacing (a)+(b) — the proof must not drop
  the seam. `[charter]`

## 3. The ctx resolution (mismatch #2, `[disk]`-grounded, no cast)

Two distinct ctx shapes, both real typed literals — **no `as any` cast**:

- **`createSourceDocument`** takes a `ServiceContext` (human caller): use
  `makeTestContext({ org_ids: [E2E_ORG_ID] })` (the write-path-test pattern).
  `[disk]`
- **`byteFetch`** takes a `SystemActorServiceContext`: construct the literal
  exactly as `autoCommitGate.integration.test.ts` does. `SystemActorCaller` is
  `{ user_id: null; system_actor: string (REQUIRED); system_user_id?: string
  (optional) }` — `system_actor` is required and MUST be present or the literal
  fails typecheck. `[disk]`

```ts
const systemCtx: SystemActorServiceContext = {
  trace_id: humanCtx.trace_id,
  caller: {
    user_id: null,
    system_actor: 'pipeline_orchestrator',   // REQUIRED; matches autoCommitGate
    system_user_id: SYSTEM_ACTOR_USER_ID,     // optional service-account uuid
  },
  org_id: E2E_ORG_ID,
};
```

`system_actor: 'pipeline_orchestrator'` is the value `autoCommitGate` uses and
is accurate here — the e2e drives the same pipeline-orchestrator seam.
`SYSTEM_ACTOR_USER_ID` and the type are imported from
`@/services/middleware/serviceContext`. This is the pipeline's own system-actor
shape (top-level `org_id`, `caller.user_id: null`, required `system_actor`) — a
genuine construction that typechecks, not a shape-papering cast. `[disk]`

## 4. Harness body structure

`E2E_ORG_ID = process.env.SHAREPOINT_E2E_ORG_ID ?? ''` (the operator-configured
org from runbook step 4). Within the `skipIf(!RUN_E2E)` block, the single
`it`:

1. **Config sanity** — read `org_settings` for `E2E_ORG_ID`; assert
   `default_storage_provider === 'sharepoint_drive'` and
   `sharepoint_site_id`/`sharepoint_drive_id` are set (the runbook step-4
   precondition; a clear failure if the operator hasn't completed it). `[design]`
2. **Ingest (real Graph put)** — `createIngestBatchForTest(E2E_ORG_ID)` →
   `documentPlatformService.createSourceDocument({ bytes, mime_type:
   'application/pdf', org_id: E2E_ORG_ID, original_filename, ingest_channel:
   'direct_upload', ingest_batch_id, received_at, created_by:
   SYSTEM_ACTOR_USER_ID }, humanCtx)`. **No `vi.mock`** — `getStorageProvider`
   resolves the real `createSharepointDriveProvider()` whose default
   `realGraphIo` makes live Graph calls (the write-path unit test had to mock
   the resolver precisely to avoid this; the e2e must not). `[disk]`
3. **Fetch (real Graph download via the seam)** — `byteFetch({
   source_document_id: created.id, ctx: systemCtx })`. `[disk]`
4. **Assert** — §2's (a)+(b). `[charter]`
5. **Cleanup (kept; deliberate scope-note).** Best-effort
   `getStorageProvider('sharepoint_drive').delete(created.id, systemCtx)` (real
   Graph bytes-removal) so repeated live runs don't litter the customer's
   SharePoint library; then delete the `audit_log` rows by `humanCtx.trace_id`
   (standard test hygiene, no scope concern). **Scope-note vs charter minor #3:**
   this gives the otherwise-zero-consumer `delete` method its first (test-only,
   live) exercise. It is cleanup hygiene, NOT a production consumer — no
   production substrate is built ahead of a consumer, so the D-3 forward-marker's
   spirit holds — but it touches the charter's literal "put + fetch only" scope
   line, so it is recorded here deliberately, not absorbed silently. **A cleanup
   `delete` failure is logged PROMINENTLY** (`delete` has never run live, so a
   failure there is real information) but is **non-fatal** — the §2 proof has
   already passed by this point. `[design]`

Timeout `GRAPH_TIMEOUT_MS = 120_000` (Graph round-trips; mirrors the existing
gate value).

## 5. Gating + honesty discipline

- The `RUN_E2E` gate (`GRAPH_* + RUN_SHAREPOINT_E2E`) and `skipIf` are
  **unchanged** — the body skips in CI; `test:full` still reports it skipped.
  `[disk]`
- The committed deliverable is **harness-body-correct-and-gated**, explicitly
  NOT PROVEN-LIVE. The arc's status stays "reachable, unit-proven, live
  transfer gated" until Phil's green run. The closeout (whenever the body
  lands) must carry this — the body landing is *readiness*, the green run is
  the *discharge*. `[charter]`

## 6. Verification (what the code arc can prove)

- `pnpm typecheck` clean (the gated body compiles — both ctx literals are
  typecheck-valid; `computeHash`/imports resolve).
- The harness **skips by default** (`RUN_SHAREPOINT_E2E` unset) — confirmed by
  running the file and seeing `1 skipped`.
- `pnpm test:full` green with the harness skipped (no regression).
- **Not provable by the code arc, by design:** the live Graph round-trip.
  Running `RUN_SHAREPOINT_E2E=1` against a real tenant is Phil's discharge.

## 7. Read-back asks

Closest attention on: (1) §2's assertions match the charter's pinned
fix-direction (the `byteFetch` call + `provider === 'sharepoint_drive'` +
`computeHash(result.bytes) === created.content_hash`; `verifyIntegrity` only
ever supplementary); (2) §3's system-actor ctx is a real literal, not a cast;
(3) §1/§5 keep the live run gated and don't let "body written" read as
PROVEN-LIVE.
