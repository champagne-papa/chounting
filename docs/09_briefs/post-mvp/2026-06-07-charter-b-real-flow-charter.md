# Charter — Charter B real-flow arc: make `sharepointDriveProvider` REACHABLE

**Status:** CHARTER — grounding-derived, decisions #1/#3/#4 settled, decision #2 riding OPEN. HOLD FOR ADVISOR READ-BACK before any spec/plan/code. Not ratified.
**Anchored at:** `origin/staging == HEAD == 1dc71bc9` (clean, re-baselined first-hand this session; all code/migration reads `[disk]` this session unless tagged otherwise).
**Coordination:** session lock `charter-b-real-flow`. Push + lock-release are Phil's alone.
**Role/loop:** two-seat cadence (same as Charter B (a)) — WSL Claude implements under lock; Phil relays; a read-only verification advisor grounds every claim against disk and reads back the charter before it hardens.
**Gated by:** the ADR-0013 **2026-06-07 universal-default amendment** (Option A — `sharepoint_drive` is the default for M365 orgs, `supabase_storage` fallback; `durability=none` v1-active). Already ratified, so **no new ADR is needed for the posture**; this charter + its downstream spec/plan are the arc's new artifacts. `[ADR]`
**Cadence:** charter (this) → advisor read-back → design spec (settles #2) → writing-plans → execute. No substrate or code lands before read-back clears.

**Provenance legend:** `[disk]` grounded first-hand from code/migration this session; `[ADR]` specified in a ratified ADR/amendment; `[design]` a decision proposed/settled here; `[relayed]` asserted but not yet independently re-verified by the advisor (flagged for read-back).

---

## 1. Goal and the two reachability gates

Charter B (a) shipped the provider **implemented and admitted, NOT YET REACHABLE**: the six `StorageProvider` methods, the Graph failure classification (incl. 404 → `provider_unavailable`), the `storage_provider` Layer-1 CHECK broadened `_v1_active → _v2_active` to admit `sharepoint_drive` (migration 20240178), and the resolver activated (`sharepoint_drive` returns the factory). All UNIT-proven against mocked io/resolver/rows — **never proven live**. `[disk]`

Two concrete gates keep it unreachable, both still true at `1dc71bc9`:

1. **Hardcoded write value.** Every `source_documents` write stamps `V1_STORAGE_PROVIDER = 'supabase_storage'`; no production path produces a `sharepoint_drive` row. `[disk]`
2. **Graph auth unconfigured.** `graphClient.ts` requires `GRAPH_TENANT_ID` / `GRAPH_CLIENT_ID` / `GRAPH_CLIENT_CERT_PATH`; unset → throws `"sharepoint_drive provider is not configured: missing …"`. `[disk]`

**This arc removes both gates and lands the three entangled carries**, so a real `sharepoint_drive` document flows end-to-end in production. The carries all gate on the same reachability change, which is why they belong in ONE arc. The arc's own honesty gate: the first live Graph integration (work item D) — see §8.

---

## 2. Disk-grounded baseline (the substrate the arc builds against)

The dominant failure mode for this arc is the banked **disk-vs-text-grain** lesson (fired twice in (a)): *a name in a comment/ADR is not an admission in substrate; the grounding is the migration, not the comment that names it.* Every "build-against" fact below was read first-hand this session.

- **`org_settings` (migration 20240158)** ships **11 columns** — 5 ADR-0014 (`classification_fallback_order`, `ai_fallback_budget`, `vendor_match_threshold`, `gc_cadence`, `gc_threshold_hours`) + 6 ADR-0019 (`confidence_threshold_*` ×4, `calibration_cadence`, `calibration_test_set_version`) — and **zero** storage/SharePoint columns. The slice (work item A) adds all of them. `[disk]`
- **`orgDriveResolver.ts`** already does a **forward-column** `.select('*')` read of `sharepoint_site_id` / `sharepoint_drive_id` and returns a clean "not provisioned" `ServiceError` until the slice lands. Those two are the de-facto column names the slice must provide. `[disk]`
- **`exception_reason` enum (migration 20240148)** = **8 values** (6 v1-active: `manual_route`, `low_confidence_classification`, `unknown_document_type`, `unmatched_router_candidate`, `multi_candidate_ambiguity`, `invariant_violation`; 2 reserved: `wrong_entity_exception`, `drift_detected`). The v1-active CHECK `exception_reason_chunk_6_active` admits the 6. **No `provider_unavailable` class exists at this grain.** `[disk]`
- **`resolution_action` enum (20240148)** = **18 values** (9 v1-active + 9 reserved). **No `resolve_provider_unavailable`** — confirming (a) Task 7 correctly killed that comment-only name. `[disk]`
- **`storage_status` enum (migration 20240135)** = **7 values** (`available`, `pending_initial_verify`, `permission_loss`, `missing_file`, `hash_mismatch`, `provider_unavailable`, `verification_pending_retry`); the v1-active CHECK pins to `IN ('available', 'pending_initial_verify')`. So **`provider_unavailable` already exists here as a reserved (CHECK-excluded) value.** This is the crux of decision #2 (§6). `[disk]`
- **`enqueue_exception_with_audit` (20240148)** does INSERT-then-atomic `UPDATE document_cases SET state='needs_review' WHERE id=… AND state IN ('classified','matched')`, raising `check_violation` on zero rows (→ `INVALID_TRANSITION`). A storage failure firing at an arbitrary lifecycle point will not generally satisfy that coupling — the **coupling wall** behind decision #2. `[disk]`
- **CHECK broaden (migration 20240178)** dropped `*_storage_provider_v1_active` and added `*_storage_provider_v2_active CHECK (storage_provider IN ('supabase_storage','sharepoint_drive'))` on both `source_documents` and `source_document_versions`. `[disk]`
- **Graph substrate already built:** `graphClient.ts` (Sites.Selected + client-cert, app-only), `graphIo.ts`, `sharepointRefResolver.ts`, `orgDriveResolver.ts` all present under `providers/graph/`. `[disk]`

---

## 3. The corrected spine (finding #1) — selection is a *seam*, not a write value

**Reframe (endorsed at read-back as a correctness fix, not a scope-widening):** the byte *put* at ingest and the byte *fetch* at extraction are **two independent provider selections**, both hardcoded today. If selection plumbing makes only the write dynamic, a `sharepoint_drive` row would have its bytes written to SharePoint but **fetched from supabase** — reachable-but-broken, silent cross-provider divergence. This is exactly the class of failure the "not yet reachable" qualifier was protecting. The corrected spine:

- **Pick-once at ingest** — the put and the row stamp must agree (one selection per ingest function).
- **Dispatch-on-row at fetch** — every consumer that fetches must read `storage_provider` from the row, never from a constant.

### 3.1 Complete dispatch-site enumeration (closed deliverable, not a TODO)

Reproduce at read-back with:

```
grep -rn "getStorageProvider" apps/web/src/ --include="*.ts" --include="*.tsx"
grep -rn "\.previewUrl(\|\.verifyIntegrity(\|\.fetchVersion(" apps/web/src/ --include="*.ts"
```

**Four live `getStorageProvider(...)` callers** (excluding the resolver definition + imports), all hardcoded to `V1_STORAGE_PROVIDER` today: `[disk]`

| Site | Role | Row-stamp paired at |
|---|---|---|
| `documentPlatformService.ts:119` | PUT (createSourceDocument) | `:156` |
| `ingestionService.ts:218` | PUT (drag-drop) | `:305` |
| `ingestionService.ts:622` | PUT (mailbox) | `:705` |
| `byteFetch.ts:32` | FETCH (extraction Stage 1) → `provider.fetch()` at `:36` | — |

So: **3 ingest functions** (pick-once / put / stamp — the Zod admit-set lands here) + **1 fetch function** (dispatch-on-row).

**`previewUrl` / `verifyIntegrity` / `fetchVersion` / `delete`: zero live callers.** `[disk]` Those provider methods are interface-complete but unconsumed (preview / drift-runner / delete consumers aren't built). So `byteFetch` is the only live fetch-dispatch site **by enumeration, not assumption**.

**Honest boundary:** the enumeration above is content-grep, which the advisor's glob-only tools cannot reproduce — hence the explicit grep commands for an independent first-hand re-run at read-back. The third write site (`documentPlatformService.ts:156`) and the full caller set are `[disk]` for WSL Claude this session; until the advisor re-runs the grep they remain `[relayed]` from the advisor's seat.

### 3.2 Forward-marker (plant the flag the next arc will hit)

When the unconsumed read-method consumers land in future arcs (preview surface; the §5-6 drift runner calling `verifyIntegrity`; a delete path), each **inherits the dispatch-on-row requirement**. The design spec must plant an explicit forward-marker — sibling to the safety-invariant comment that guarded `V1_STORAGE_PROVIDER` this arc — so a future editor cannot reintroduce a hardcoded provider constant the way `byteFetch` did.

---

## 4. Known work, re-grounded (A → B → C → D)

### A. `org_settings` slice `[ADR][disk]`
Add the columns the provider + amendment need, none of which exist on disk (20240158 shipped none): the SharePoint site/drive reference (`sharepoint_site_id` / `sharepoint_drive_id`, the names `orgDriveResolver` already reads), `default_storage_provider` (NOT NULL DEFAULT `supabase_storage`, per the amendment), `sharepoint_durability_mode` (default `'none'`, v1-active; `metadata_only` / `folder_organization` reserved per the 2026-05-15 amendment), and the text-grain-reserved `storage_retry_*` / `preview_url_*` (§8/§12 — individual names ADR-unspecified; the spec names them). **CHECK-broaden ⇒ Zod-broaden** applies to every new constrained column. Types regen against the post-slice schema. A is the hard precondition for B (the resolver read) and for the amendment's universal-default resolution.

### B. Selection plumbing (+ Zod admit-set) `[disk]`
Make `storage_provider` dynamic per §3: each ingest path resolves the org's `default_storage_provider` and picks-once (put + stamp agree); `byteFetch` dispatches on the row. **Carry #1 — the Layer-2 Zod admit-set `z.enum(['supabase_storage','sharepoint_drive'])` — lands in this same arc at the write boundary**, because B is its first real dynamic consumer (today the value is an unvalidated TS const). The safety-invariant comment at `V1_STORAGE_PROVIDER` names exactly this trigger. Plant the §3.2 forward-marker here.

**§4.B-1 — Where the org-default resolution lives (spec-stage design fork; do not presume per-site).** `[disk]` The three PUT/stamp pairs of §3.1 are **not** co-equal sites that should each independently re-resolve — that is three places a future change can diverge (the single-source-of-truth concern that drove the mailbox arc's resolver-as-sole-selection-truth decision). But the disk topology also rules out the naive "resolve once at the canonical writer" shortcut: there are **two distinct insert paths to `source_documents`, not one**, and `createSourceDocument` is not a chokepoint the ingestion paths pass through —

- `documentPlatformService.createSourceDocument` → `create_source_document_with_audit` RPC (single-doc); stamp at `:156`.
- `ingestionService` (drag-drop `:218`/`:305` **and** mailbox `:622`/`:705`) → `create_ingest_batch_with_documents_with_audit` RPC, which `INSERT INTO source_documents (… storage_provider …)` directly from `p_documents` (`20240152:507`, `(v_doc->>'storage_provider')::storage_provider`). The batch path is the production path for a dropped/forwarded `sharepoint_drive` invoice.

So the selection authority has a natural single home **as a shared selection helper** (e.g. `resolveStorageProvider(org_id, ctx)` in the storage layer) called by **both** insert paths — centralizing the resolution logic in one function while keeping put/stamp agreement automatic within each path — **not** at `createSourceDocument` (which the batch path bypasses). The spec must decide *one-shared-helper vs per-path resolution* explicitly; one-shared-helper is the single-source-of-truth shape and the recommended default. `[design]`

**Helper contract — the two paths supply the value at different layers.** `[disk]` In the single-doc path, resolution and stamp are co-located in `createSourceDocumentImpl` (TS resolves, TS puts, TS stamps the payload). In the batch path the stamp happens *inside* the plpgsql RPC reading `p_documents` — so the helper must run in `ingestionService` (TS), resolve **once**, and thread the resolved value into **both** the `put` call (`:218`/`:622`) **and** the `p_documents` payload (`:305`/`:705`) the RPC stamps from. The batch-path contract is therefore *resolve-in-TS-then-thread-to-both-put-and-payload*, **not** "call the helper at the put-site" — the put and the row-stamp are already split by the RPC boundary there. The spec must model the batch path's threading shape deliberately rather than as the single-doc path's co-located resolve. `[design]`

**§4.B-2 — `INV-SERVICE-001` header tension (doc-sync flag).** `[disk]` `documentPlatformService`'s header asserts `createSourceDocument` is *the* canonical writer and "No other service inserts to either table per ADR-0011 §1." Disk shows `ingestionService` causes a `source_documents` INSERT via the *separate* batch RPC. Likely an intended substrate-ownership nuance (both RPCs as document-platform-owned substrate, the boundary being "no direct service-layer `.insert()`"), but the "single canonical writer" claim does not hold at the function grain. The spec/doc-sync pass must reconcile the header with the two-RPC reality — relevant because §4.B-1's selection-home decision turns on exactly this topology.

### C. `provider_unavailable` routing + substrate (carry #2) `[disk]`
**Shape gated on decision #2 (§6, OPEN).** Whatever the routing surface, keep `provider_unavailable` (an inline put/fetch read failure) **distinct from `drift_detected`** (the §5-6 scheduled-drift-runner concern, out of provider-(a) scope, riding the GH-Actions cron) — they are different event classes and the reserved `drift_detected` value must not be co-opted as the `provider_unavailable` routing target.

### D. Task-8 ops + real-M365 e2e (carry #3) — the gated tail (decision #3) `[ADR][disk]`
Azure app registration (**Sites.Selected ONLY** — additive-permission discipline: the registration holds no broader `Files.*` / `Sites.*` scope, or the least-privilege is theater), client certificate, per-site grant onboarding, and the real-M365 e2e (`RUN_*`-opt-in gated, like Modal-e2e). The local-buildable parts (env wiring, runbook, the `RUN_*`-gated harness) land in-arc against fresh code; the live run + Azure registration are externally gated. See §8.

---

## 5. Settled decisions (#1, #3, #4) with named consequences

### Decision #1 — Selection-resolution policy: **operator onboarding** `[design]`
An admin/ops action sets each org's `default_storage_provider`; auto-detection and a config UI are deferred post-v1. Grounded on the reversibility/blast-radius asymmetry that has run through this whole arc: operator onboarding adds **zero new failure surface** (a human sets a column; worst case is a wrong provider, fixed by re-setting — fully reversible), where auto-detection would stack a new automated "did this org connect M365?" decision — whose wrong answer silently routes a customer's accounting bytes to the wrong store — on top of the first live Graph integration, concentrating two unproven things in one arc. A config surface is UI/API scope-creep into a plumbing arc.
**Consequence (named):** setting `default_storage_provider` per org is a **named gated-ops step** (sibling to the Postmark allowlist and the Sites.Selected per-site grant) — it joins the gated-ops tail, not free.
**Assumption (named):** manual per-org setting is acceptable friction at current onboarding scale. If near-term reality is many orgs onboarding fast with M365 ubiquitous, detection's value rises and this is revisited — as its own arc, provable in isolation.

### Decision #3 — D sequencing: **gated tail of this arc** `[design]`
A → B → C are unit/integration-provable against mocked Graph (bankable, pushable). D is the first live integration and depends on external provisioning (Azure tenant, app registration, cert, per-site grant) that is not code and not on disk. The `RUN_*`-gated e2e **harness + runbook + env wiring land in-arc** so the proof is authored against fresh code (most accurate now, not reconstructed later — the same staleness risk that lets a constant sneak back, one layer up); the **live run + Azure registration are gated** steps, like Modal-e2e.
**Consequence (named):** the arc closes **UNIT-PROVEN**, with the live gate explicit. "Charter B real-flow ✓" must carry: *selection + routing wired and unit/integration-proven; dynamic selection proven against mocked Graph; first live Graph transfer gated on Azure ops (D).* One notch further along than (a)'s "implemented + admitted, not yet reachable" — "reachable in principle, live transfer gated" — but still **not live**, and the closeout says so.

### Decision #4 — Channel (b) folder-watcher: **out of scope, separate arc** `[ADR][design]`
Confirming the ratified a/b fork (Charter B (a) design spec §1 + `post-v1-revisit-notes.md`): (b) composes (a) and is its own channel-specification arc. (b) is a consumer of (a)'s methods plus a net-new ingest channel (watch/poll semantics, change-detection, dedup, the multi-document picking question) — it cannot be built before (a) is reachable and is not needed for (a) to be reachable. Folding it in would bolt a third substantial unproven thing onto this arc.
**Consequence (named):** the charter records (b) as the **named next channel arc** that composes (a), so the boundary is a deliberate fork (b-waits-on-a-reachable), not a silent omission.

---

## 6. OPEN decision (#2) for read-back — the routing surface

Finding #2 reshaped this from "add an enum value" into a **routing-surface question**. A storage `provider_unavailable` failure can surface as:

- **(i) a `storage_status` flag + retry** — the `provider_unavailable` value already exists in the enum (reserved); v1-active CHECK relaxes to admit it; no new `exception_reason` and **no coupling-wall design** needed; OR
- **(ii) an `exception_queue` entry** — needs a net-new `provider_unavailable`-class `exception_reason` (`ALTER TYPE ADD VALUE` + `exception_reason_chunk_6_active → _chunk_7_active`) **and** a resolution to the coupling wall (§2: `enqueue_exception_with_audit` couples `classified|matched → needs_review`, which an arbitrary-lifecycle storage failure won't satisfy) — i.e. a distinct enqueue path or a documented state-coupling exemption; OR
- **(iii) both.**

**WSL lean `[design]`:** option (i) for this arc — add the `exception_reason` value but keep it **reserved** (in the enum, excluded from the v1-active CHECK), route v1 failures to `storage_status='provider_unavailable'` + retry, and defer the exception-queue path with its coupling-wall design. This is the same premature-substrate discipline that deferred the Zod (carry #1) and the Task-7 routing — it uses the already-reserved `storage_status` value (no coupling-wall design now) and keeps the wall off this arc's critical path.

**Named consequence to decide with eyes open (the reason #2 rides to read-back):** routing to `storage_status` + retry means a `provider_unavailable` failure becomes a **row flag with retry semantics and no human-visible queue entry in v1**. So the spec must answer: *what surfaces a stuck `provider_unavailable` document to an operator if it's only a row flag and retries exhaust?* If the answer is "nothing in v1 — it sits flagged until the drift/ops tooling lands," that may be acceptable for an arc whose live surface is gated anyway — but it must be a **named, eyes-open consequence**, not a side effect of choosing the lower-coupling path. This is precisely what spec-grain read-back is for.

---

## 7. Sequence and the local/gated split

`A → B(+Zod) → C → D(gated tail)`. A is the hard precondition for B. A/B/C are **local-executable** and unit/integration-provable against mocked Graph. D is **externally gated** (live Graph). The design spec and plan state this boundary explicitly per the honesty gate.

---

## 8. The honesty gate for this arc

This arc inherits the **first live integration** as its gate. A/B/C are unit/integration-provable against mocked Graph; a real `sharepoint_drive` row flowing end-to-end needs real Graph (D). The closeout must hold the **UNIT-PROVEN ≠ PROVEN** boundary the (a) arc held — see decision #3's named close qualifier. "Wired + unit-proven" must not read as "proven live."

---

## 9. Out of scope (named, separately tracked)

- **Channel (b) folder-watcher** — its own channel-spec arc; composes (a) (decision #4).
- **The scheduled drift runner** (§5-6) — rides the GH-Actions cron; `drift_detected` is its surface, kept distinct from `provider_unavailable` (§4.C).
- **Durability rungs beyond `none`** — `metadata_only` / `folder_organization` stay reserved.
- **Per-document provider override** — reserved post-v1 (ADR-0013 §2); no v1 channel exercises it.
- **Exception-queue routing for `provider_unavailable`** — deferred under WSL's #2 lean (pending read-back); becomes its own piece if (ii)/(iii) is chosen.

---

## 10. Next step

**Hold for advisor read-back.** Closest attention requested on: (a) the §3.1 dispatch-site enumeration completeness (re-run the greps first-hand) and the §3.2 forward-marker placement; (b) decision #2's routing-surface framing and its named consequence. After read-back clears and #2 settles, proceed to the design spec (settling #2) → writing-plans → execute. **No substrate or code before read-back clears.**
