# Charter — Charter B real-flow: PROVEN-LIVE discharge (live SharePoint e2e)

**Status:** CHARTER — ratified, committed under lock. Grounding-derived; both disk-vs-doc mismatches recorded with fix-direction. Cadence continues charter → spec → plan → execute.
**Anchored at:** `staging == origin/staging == 3796de62` (the Charter B real-flow close; all code reads `[disk]` first-hand this session).
**Coordination:** session lock `charter-b-proven-live`. Push + lock-release are Phil's alone (push-terminal-close).
**Role/loop:** two-seat cadence — WSL Claude implements under lock; Phil relays; a read-only verification advisor grounds every claim against disk and reads back each artifact before it hardens.
**Gated by:** the Charter B real-flow arc's carry-forward #2 (the PROVEN-LIVE discharge) — friction-journal 2026-06-08 "Charter B real-flow CLOSED" + retrospective `docs/07_governance/retrospectives/charter-b-real-flow-retrospective.md`.
**Provenance legend:** `[disk]` grounded first-hand this session; `[design]` decided here.

---

## 1. Goal

Discharge the live gate left open at the real-flow arc close (`3796de62`,
`sharepoint_drive` REACHABLE / UNIT-PROVEN / live transfer GATED): turn the
`RUN_SHAREPOINT_E2E` harness from throws-until-implemented into a **green run
against a real M365 tenant**, proving a real `sharepoint_drive` document
round-trips end-to-end through Microsoft Graph via the dispatch-on-row seam.
**PROVEN-LIVE = that green run.** It is Phil's discharge (see §3); the code
arc closes with the harness body correct-and-gated.

## 2. Disk baseline (grounded first-hand)

- **Provider** (`services/storage/providers/sharepointDriveProvider.ts`): 6
  methods. `put` → `resolveOrgDrive(org_id)` (← `org_settings.sharepoint_site_id`/
  `drive_id`) → `io.uploadSmall`/`uploadLarge` (4 MiB gate) → re-read +
  `verifyHash` → returns `{storage_key: driveItemId, content_hash, byte_size,
  provider}`. `fetch(source_document_id)` → `resolveCurrentRef` (row) →
  `io.downloadBytes` → returns `{bytes, content_hash: ref.content_hash
  (STORED, not recomputed), provider}`. `[disk]`
- **`graphIo`** (`…/graph/graphIo.ts`): `realGraphIo` is the default
  `createSharepointDriveProvider(io = realGraphIo)` wires in; real SDK calls
  (`@microsoft/microsoft-graph-client`), each `withRetry`-wrapped, `GRAPH_*`-
  gated via `getGraphClient()`. The live run uses real Graph — no mock
  injection (the spec makes this concrete by simply not mocking the resolver;
  the write-path unit test had to explicitly `vi.mock` it to avoid real
  Graph). `[disk]`
- **Selection seam (this arc exercises end-to-end):** `resolveStorageProvider`
  (ingest org default) → `getStorageProvider('sharepoint_drive')` →
  `provider.put`; `byteFetch` dispatch-on-row → `getStorageProvider(row.
  storage_provider)` → `provider.fetch`. `org_settings` storage columns live
  (migration 20240179). `[disk]`
- **Gated harness** (`tests/integration/e2e/sharepointDriveRealFlow.e2e.test.ts`):
  `describe.skipIf(!RUN_E2E)` on `GRAPH_* + RUN_SHAREPOINT_E2E`; body
  throws-until-implemented with a documented 3-step flow. `[disk]`

## 3. Operator-gated vs code-able split (explicit — do not conflate)

- **CODE-ABLE (WSL Claude's):** implement the harness body — `createSourceDocument`
  to the configured org → real Graph put → `byteFetch` dispatch-on-row →
  assertions (§4). ~30 lines, still `skipIf`-gated (skips in CI). This is
  necessary but **NOT** PROVEN-LIVE.
- **OPERATOR-GATED (Phil's — no agent can perform):** runbook steps 1–4 —
  Azure `Sites.Selected` app registration, client cert + `GRAPH_*` on the
  host, per-site grant, an org pointed at `sharepoint_drive` with real
  site/drive ids — **then** running `RUN_SHAREPOINT_E2E=1
  SHAREPOINT_E2E_ORG_ID=<org>`. **PROVEN-LIVE is the green run, which only
  happens after this.** "Harness body written" ≠ PROVEN-LIVE.

## 4. Disk-vs-doc mismatches (flagged; fix-direction binds the spec)

**Mismatch #1 (LOAD-BEARING) — the documented "content_hash round-trips"
assertion is a false-green.** `byteFetch.result.content_hash` is the row's
**stored** hash (`provider.fetch` returns `ref.content_hash`, not a recompute),
so comparing it to the put's `content_hash` compares two copies of the same
stored value — trivially true, and it would pass even if `io.downloadBytes`
returned corrupted bytes. `[disk]`

**Fix-direction (binds the spec) — the proof exercises the `byteFetch` seam
and recomputes; NOT a `verifyIntegrity` shortcut.** `verifyIntegrity` is a
*different provider code path* `byteFetch` never calls — proving it round-trips
would prove the integrity method works while **bypassing the dispatch-on-row
seam this arc exists to prove live.** The PROVEN-LIVE assertion is: `[design]`
1. call **`byteFetch`** (the live seam) →
2. assert `result.provider === 'sharepoint_drive'` — proves the seam selected
   the right provider *from the row*; AND
3. **recompute `SHA-256(result.bytes)`** and assert it equals the put's
   returned `content_hash` — proves the live Graph transfer was byte-faithful.

`provider.verifyIntegrity` is fine as a *supplementary* belt-and-suspenders
check via the purpose-built recompute path, but **cannot substitute** — the
proof must not quietly drop the seam. The asymmetry that makes the recompute
necessary: `put` already does its own re-read+verify at write (so the put hash
is trustworthy); the *fetch* side is the unproven half, and only recomputing
the fetched bytes closes it.

**Mismatch #2 — `byteFetch` ctx shape.** `byteFetch`'s input is
`{ source_document_id, ctx: SystemActorServiceContext }`; the harness's
documented step 1 uses `makeTestContext` (`ServiceContext`, `org_ids: []`).
`SystemActorServiceContext` is a different shape (carries a top-level `org_id`
that `emitPipelineAuditEvent` reads). The spec must resolve how the gated test
constructs a valid system-actor ctx so typecheck passes (the test is gated/
skipped but still compiles). `[disk]`

**Minor #3 (no mismatch — keeps the spec from over-scoping).** `previewUrl`/
`verifyIntegrity`/`fetchVersion`/`delete` remain zero-consumer (the D-3
forward-marker still binds their future callers); this arc exercises only the
put + fetch path. `[disk]`

## 5. Cadence

charter (this) → spec (mismatch #1 lands as concrete assertions; mismatch #2
ctx resolved; real-Graph-by-not-mocking made concrete) → plan → execute (the
harness body, still `skipIf`-gated). Each artifact ratified against disk;
advisor reads every claim back before it hardens. **The arc cannot reach
PROVEN-LIVE without Phil's ops + live run — the code part closes with the
harness body correct-and-gated; PROVEN-LIVE is Phil's discharge.** Push +
lock-release are Phil's at arc close.
