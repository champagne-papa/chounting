# Charter B real-flow arc — design spec (`sharepoint_drive` reachable)

**Status:** Design spec. Settles charter decision #2 (routing surface) + the §4.B-1 helper shape; full technical design for the reachability change. For advisor read-back, then writing-plans. Not ratified.
**Anchored at:** `origin/staging == HEAD == 75becab3` (the ratified charter commit; all code/migration reads `[disk]` this session unless tagged).
**Coordination:** session lock `charter-b-real-flow`.
**Charter:** `docs/09_briefs/post-mvp/2026-06-07-charter-b-real-flow-charter.md` (ratified 75becab3). This spec realizes it; decisions #1/#3/#4 are settled there, #2 + helper shape settled here.
**Gated by:** ADR-0013 §13 + the 2026-06-07 universal-default amendment (ratified). No new ADR needed for the posture.
**Provenance legend:** `[disk]` grounded first-hand this session; `[ADR]` ratified ADR/amendment; `[design]` decided here; `[charter]` settled in the ratified charter.

---

## 1. Scope and non-scope

**In scope** — the reachability change and the v1-active portions of the three carries:
- **A.** `org_settings` slice (the v1-consumed columns — see D-1's flagged scope fork).
- **B.** Selection plumbing: the shared `resolveStorageProvider` helper (D-2), dispatch-on-row at fetch (D-3), the Layer-2 Zod admit-set (D-4).
- **C.** The two-layer masking fix + a reserved-not-active `provider_unavailable` `exception_reason` forward-hook (D-5) — decision #2 = option 1.
- **D.** Task-8 ops + real-M365 e2e as the **gated tail** (D-6) — decision #3.

**Non-scope** (named, separately tracked):
- Channel (b) folder-watcher — its own arc, composes (a). `[charter]`
- The scheduled drift runner (§5-6) — rides the GH-Actions cron; `drift_detected` is its surface, kept distinct from `provider_unavailable`. `[charter]`
- Durability rungs beyond `none` — reserved. `[ADR]`
- Per-document provider override — reserved post-v1. `[ADR]`
- **The `provider_unavailable` routing surface** (exception-queue entry or operator-visible flag) — deferred-with-its-consumer to the Phase-7 job-runner substrate (D-5). `[design]`
- The Phase-7 job-runner / `document_jobs` terminal-state machine (`in_flight`/`failed_*`/`completed` reserved). `[disk]`

---

## 2. Verification baseline (residuals closed first-hand this session)

Decision #2 rests on these; all `[disk]` with citations:

- **Two-layer masking.** `retry.ts:87-93` — `withRetry` throws the **catchall** `STORAGE_OPERATION_FAILED` on `provider_unavailable` (comment: "the calling layer owns post-v1 exception-queue routing; here we simply surface the catchall"). Then `byteFetch.ts:41-44` re-throws **everything** as `PIPELINE_TRANSIENT_EXHAUSTED`. So the typed `provider_unavailable` from `classifyStorageFailure` (`failureClassification.ts:132/144/162`) is destroyed at **two** layers before the orchestrator. `[disk]`
- **`storage_status` is write-only / zero UI.** No read in `apps/web/src/components/` or `apps/web/src/app/`; absent from `document_cards_view` (20240154); the only non-storage readers are the write sites + `evidenceObjectService` (internal evidence facet). Routing a failure to `storage_status` surfaces it to **no operator** today. `[disk]`
- **`exception_queue` is first-class visible.** Review Inbox (`/api/orgs/[orgId]/review/cases`) renders an exception badge per case + the 9-action resolve UI. `[disk]`
- **No v1 recovery machine.** `document_jobs.state` CHECK pins to `'queued'`; `in_flight`/`failed_retry`/`failed_permanent`/`completed` are Phase-7 reserved; nothing polls queued jobs; the ingest caller logs-and-swallows (HTTP 201). A failed doc rests at `queued`, case `received`, no error metadata. `[disk]`
- **Near-vestigial v1 surface.** The only live storage-read site is `byteFetch` at ingest; the `put` moments earlier already did a SHA-256 put-then-re-read of the same object (the §9 discharge). A genuine `provider_unavailable` at `byteFetch` needs auth/permission revocation in the put→fetch window. `previewUrl`/`verifyIntegrity`/`fetchVersion` (the later-read consumers that would realistically hit `provider_unavailable`) have **zero callers** (§3.1 enumeration). `[disk]`
- **Slice columns are text-grain-only.** `storage_provider` enum (20240135) has all 4 values; `sharepoint_durability_mode` enum type does **not** exist; `default_storage_provider` has **zero** substrate reference. The slice creates what it needs. `[disk]`

---

## 3. Design decisions

### D-1 — `org_settings` slice. Add the v1-consumed columns; reserve-and-name the rest. `[design]`

**The columns v1 actually consumes** (these must land for reachability):
- `default_storage_provider storage_provider NOT NULL DEFAULT 'supabase_storage'` — read by `resolveStorageProvider` (D-2). Layer-1 CHECK pins to the v1-active set: `CHECK (default_storage_provider IN ('supabase_storage','sharepoint_drive'))` (mirrors the `source_documents` `_v2_active` CHECK). **CHECK-broaden ⇒ Zod-broaden** (D-4). `[ADR][disk]`
- `sharepoint_site_id text` (nullable) and `sharepoint_drive_id text` (nullable) — the exact names `orgDriveResolver.ts` already forward-reads; null = "not provisioned" until per-org onboarding sets them. `[disk]`

**SCOPE DECISION (settled: add-consumed-only).** Charter §4.A said the slice "adds all" the reserved columns (`sharepoint_durability_mode`, `storage_retry_*`, `preview_url_*`). This spec proposes the disciplined alternative: **add only the v1-consumed columns above; reserve-and-name the rest as a deferred sub-slice**, because none of them is consumed in v1 —
- `sharepoint_durability_mode` — would need a **new enum type** (doesn't exist); the provider operates at the implicit `none` rung and does not branch on it in v1. Inert. `[disk]`
- `storage_retry_*` — `withRetry` uses hardcoded constants (`MAX_ATTEMPTS=3`, `BASE_DELAY_MS=500`); nothing reads per-org retry config. Inert. `[disk]`
- `preview_url_*` — `previewUrl` has zero callers. Inert. `[disk]`

This is the **same reserve-don't-build-inert discipline** the arc applied to decision #2 and that deferred the Zod (carry #1) and Task-7 routing.

**Charter §4.A supersession (append-only).** Charter §4.A's "the slice adds all of them" is **superseded** by this D-1: *the slice adds the v1-consumed columns; the inert reserved columns (`sharepoint_durability_mode`, `storage_retry_*`, `preview_url_*`) are named here as a deferred sub-slice, not built.* Recorded as a deliberate evolution — the same append-only-supersession discipline the ADR-0013 2026-06-07 amendment used — not a contradiction a future reader must reconcile. The charter itself delegated column-naming to the spec (§4.A: "individual names ADR-unspecified; the spec names them"), and the deviation is grounded in the disk-verified inertness above. The durability enum in particular cannot be shaped correctly until the durability rungs are designed, so a column created now would be a guess; an enum-type-created-but-unconstrained is the half-substrate the disk-vs-text-grain lesson warns reads as "done" when it isn't.

**Types regen** against the post-slice schema (`db/types.ts`), additive.

### D-2 — The shared selection helper `resolveStorageProvider`. (Helper shape = option 1.) `[design]`

**Placement.** A new `resolveStorageProvider(org_id, ctx)` in the storage layer (ADR-0020 Layer-2 data-access; reads via `adminClient`, like `orgDriveResolver`). It returns the **provider enum value** (`StorageProviderEnum`), not the instance — the caller passes that value to the existing `getStorageProvider(enum)` for the instance *and* stamps the same value on the row, so put/stamp agree by construction.

**Contract.** Reads `org_settings.default_storage_provider` for the org; returns it. **Fallback** to `'supabase_storage'` when no `org_settings` row exists or the column is null (the amendment's non-M365 fallback). `[ADR]`

**Single selection authority across BOTH insert paths** (§4.B-1, two-path topology `[disk]`):
- `documentPlatformService.createSourceDocument` (→ `create_source_document_with_audit`): resolve in TS, use for the `put` (`:119`) and stamp (`:156`) — co-located.
- `ingestionService` (drag-drop `:218`/`:305`, mailbox `:622`/`:705`, → `create_ingest_batch_with_documents_with_audit`): **resolve once in TS, thread the value into both the `put` call AND the `p_documents` payload** the RPC stamps from (`20240152:507`). The put and row-stamp are split by the RPC boundary, so the contract is *resolve-in-TS-then-thread-to-both*, not "call at the put-site." `[disk]`

**§4.B-2 doc-sync reconciliation.** The helper is the single named selection authority, which makes the accurate statement *"selection resolves through one helper; two document-platform-owned RPCs write"* — correcting `documentPlatformService`'s header claim of being the sole canonical writer (`INV-SERVICE-001`), which the two-RPC reality contradicts at the function grain. Reconcile the header text in this arc's doc-sync pass. `[disk]`

### D-3 — Dispatch-on-row at fetch (the correctness half of the seam). `[design]`

`byteFetch` (the only live fetch site) must select the provider from the **row**, not a constant: read the `source_documents` row's `storage_provider` and call `getStorageProvider(row.storage_provider)`. This is distinct from D-2: **ingest selects the org default; fetch selects the row's value** — a document written under one provider must always be fetched from that provider, even if the org default later changes. `resolveStorageProvider` is ingest-only; it must **not** be used at fetch. `[disk]`

**Forward-marker (charter §3.2).** `previewUrl`/`verifyIntegrity`/`fetchVersion`/`delete` have zero callers today; when their consumers land (preview surface, drift runner, delete path), each inherits the dispatch-on-row requirement. Plant an explicit marker — sibling to the `V1_STORAGE_PROVIDER` safety-invariant comment — so a future editor cannot reintroduce a hardcoded provider at a read site (the way `byteFetch` did). `[design]`

### D-4 — Layer-2 Zod admit-set at the write boundary (carry #1). `[design]`

`z.enum(['supabase_storage','sharepoint_drive'])` validates the provider value at the write boundary — the `resolveStorageProvider` output / the payload the helper feeds into each insert path. Today `storage_provider` is an unvalidated TS const; B is its first dynamic consumer, so the admit-set lands **in this arc, paired with the dynamic value** (CHECK-broaden ⇒ Zod-broaden; the D-1 CHECK and this Zod are the paired Layer-1/Layer-2 admit-sets). `[disk]`

### D-5 — Two-layer masking fix + reserved `provider_unavailable` forward-hook (decision #2 = option 1). `[design]`

**v1 deliverable = honest classification, no new active routing substrate.**

**The wire contract (load-bearing — both layers must change in agreement, or the fix half-lands).** Three points, **two edits, one pre-existing handler**:
- **(a) `withRetry` (`storage/retry.ts`) — EDIT.** Stop flattening `provider_unavailable` into the `STORAGE_OPERATION_FAILED` catchall; throw a **dedicated `STORAGE_PROVIDER_UNAVAILABLE` ServiceError code** (cleaner than carrying a classification kind — `byteFetch` then does a simple code check). Retry behavior unchanged (already no-retry for `provider_unavailable`). `[disk]`
- **(b) `byteFetch` (`extraction/stages/byteFetch.ts`) — EDIT.** Map `STORAGE_PROVIDER_UNAVAILABLE` → `throw new ServiceError('PIPELINE_UNAVAILABLE', …)`. Transient still maps to `PIPELINE_TRANSIENT_EXHAUSTED`. `[disk]`
- **(c) `classifyError` (extraction `failureClassification.ts`) — UNCHANGED.** It already routes `PIPELINE_UNAVAILABLE → failure_class 'unavailable'` and emits the distinct **`pipeline_unavailable`** audit event. No new failure-class, no new handler — the `'unavailable'` class and its audit emission pre-exist and are wired. `[disk]`

**Why both edits are load-bearing.** `classifyError`'s default branch returns `'transient_exhausted'` for any code it does not recognize — and it recognizes only `PIPELINE_UNAVAILABLE`, not the storage-layer codes. So if (a) ships without (b), the storage code falls through to default-transient and the masking just moves down a layer. The contract `STORAGE_PROVIDER_UNAVAILABLE → PIPELINE_UNAVAILABLE → (unchanged) 'unavailable'` is what makes the two-layer fix land whole; naming it is what stops a future implementer from half-fixing it. `[disk]`

**Correctness gain (not just a relabel).** Today a `provider_unavailable` masks to transient and emits `pipeline_transient_retry`×2 + `pipeline_transient_exhausted` — wasted retries on a no-retry class. The fix produces an honest `pipeline_unavailable` audit trail with **no wasted retries**. `[disk]`

**Then, the deferral substrate:**
1. **Reserve the `exception_reason` forward-hook.** `ALTER TYPE exception_reason ADD VALUE 'provider_unavailable'` **without** adding it to the v1-active CHECK (`exception_reason_chunk_6_active` stays as-is) — the same reserve-don't-activate shape used throughout the arc. No enqueue path, no coupling-wall design in v1. `[disk]`
2. **Defer the routing surface** (exception-queue entry / operator-visible flag) to the **Phase-7 job-runner substrate**, where the terminal states, the recovery machine, and the later-read consumers that actually exercise `provider_unavailable` all land together. `[design]`
3. **`drift_detected` stays distinct** — it is the §5-6 scheduled-drift surface (different event class); it must not be co-opted as the `provider_unavailable` routing target. `[charter]`

**Named consequence (eyes-open, not swept under).** A stuck `provider_unavailable` document is **dark in v1** — no operator surface (D-2 verification baseline). This is acceptable here **because the event is near-unreachable in v1** (the put-then-fetch window argument) and the visibility surface arrives *with its consumer* — when the later-read consumers and the Phase-7 job-runner land, they bring the surface. The disposition is **deferred-with-its-consumer, safe because near-unreachable**, not "dark but dark anyway." `[design]`

**Why not options 2/3** (recorded): option 2 (exception-queue, visible now) pays the hardest design cost in the arc — the `classified|matched` coupling exemption, made worse because an ingest failure leaves the case at `received` (pre-classification), which the coupling rejects outright — to route a near-vestigial event. Option 3 (`storage_status` flag) builds substrate and still goes dark (zero UI). Both are inert-substrate-ahead-of-consumer. `[disk]`

### D-6 — Task-8 ops + real-M365 e2e: the gated tail (decision #3). `[charter][ADR]`

**Local-buildable, lands in-arc against fresh code:** `GRAPH_*` env wiring (`graphClient.ts` already reads `GRAPH_TENANT_ID`/`GRAPH_CLIENT_ID`/`GRAPH_CLIENT_CERT_PATH`); the onboarding runbook; the `RUN_*`-opt-in-gated real-M365 e2e harness (authored now, against the fresh selection-seam code, like the Modal-e2e pattern). `[disk]`

**Externally gated (not arc-close blocking):** Azure app registration (**Sites.Selected ONLY** — the registration holds no broader `Files.*`/`Sites.*` scope, or least-privilege is theater), the client certificate, the per-site grant onboarding, and the live e2e run.

**Honesty gate.** The arc closes **UNIT-PROVEN**: selection + routing wired and unit/integration-proven against mocked Graph; dynamic selection proven; **first live Graph transfer gated on D**. The closeout qualifier reads *"reachable in principle, live transfer gated"* — one notch past (a)'s "implemented + admitted, not yet reachable," still not live. `[charter]`

---

## 4. Sequence and the local/gated split

`A(D-1) → B(D-2/D-3/D-4) → C(D-5) → D(D-6 gated tail)`. A is the hard precondition for B (the helper reads the slice's column). A/B/C are local-executable and unit/integration-provable against mocked Graph. D is externally gated. `[charter]`

---

## 5. Out of scope / forward-markers (consolidated)

- Channel (b); drift runner; durability rungs > `none`; per-document override — reserved, named-next.
- The `provider_unavailable` routing surface + coupling-wall design — deferred-with-consumer to Phase-7 (D-5).
- Read-method dispatch-on-row (preview/verify/delete) — forward-marker planted (D-3), inherited by their future consumers.
- The reserved `org_settings` columns (`sharepoint_durability_mode`, `storage_retry_*`, `preview_url_*`) — deferred sub-slice pending the D-1 read-back fork.

---

## 6. Read-back asks

Closest attention on:
1. **D-5 — the two-layer masking fix.** Confirm `withRetry` (not just `byteFetch`) is in the fix scope, and that mapping to the existing `PIPELINE_UNAVAILABLE`/`'unavailable'` failure-class is the right minimal honest-classification mechanism (vs a new failure-class).
2. **D-1 — settled add-consumed-only**, with the charter-§4.A supersession note (append-only). Confirming glance on the supersession framing — the one place the spec deliberately supersedes a ratified-charter line.
3. **D-2/D-3 — the ingest-vs-fetch selection split.** Confirm `resolveStorageProvider` is ingest-only (org default) and `byteFetch` dispatches on the row (the doc's own provider), and that the batch-path threading contract is modeled correctly.

After read-back clears, proceed to writing-plans. No substrate or code before then.
