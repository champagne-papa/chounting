# Phase 6 — Ingestion Execution Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> `superpowers:subagent-driven-development` (recommended) or
> `superpowers:executing-plans` to implement this plan chunk-by-chunk.
> Three chunks scope-locked: 6.1 substrate + RPC + ADR-0011 §1
> amendment; 6.2 drag-drop end-to-end; 6.3 forwarded_mailbox
> end-to-end + Phase 6 closeout.

**Goal:** Ship Phase 6 ingestion — substrate (`ingest_batches` +
`source_documents.ingest_batch_id` ALTER + `document_jobs`
anticipatory schema) + `ingestionService` for v1 channels
(`drag_drop_pdf` + `forwarded_mailbox`) + manual-walkable
per-document cards UI — so Phase 7 (Extraction) can activate the
orchestrator runtime over the substrate Phase 6 lands.

**Architecture:** Reading B per the Phase 6 / Phase 7 demarcation
(Option 2 of scope-lock). Phase 6 ships substrate + ingestion path;
no orchestrator runtime ships at Phase 6 per ADR-0014:1249 ("the
pipeline ships in Phase 7"). `document_jobs` queue rows wait for
Phase 7 orchestrator activation. Per-channel asymmetric write
composition: drag-drop = 1:1 file→case; forwarded_mailbox = 1:N
email→cases via per-email envelope.

**Tech Stack:** TypeScript service layer per Pattern B conventions
(Phase 5 precedent); Postgres + Supabase substrate per ADR-0010 /
0011 / 0013 / 0014; Next.js App Router routes; React UI components
for per-document cards. Mail receiver integration (chunk 6.3)
introduces one new external dependency — provider choice deferred
to chunk 6.3 scope-lock.

**Source spec:** This document. Brainstorming session 2026-05-15
anchored at the Phase 4 retrospective post-close correction
(2026-05-15 friction-journal entry) locating Phase 6 as canonical
next phase per Phase 5 retrospective §6:380-381 sequencing
(`Phase 5 → 2 → 3 → 4 → 6 → 7 → 8`).

**Source ADRs (existing; Phase 6 executes against):**

- **ADR-0011** — Document Platform substrate ownership boundary;
  case lifecycle; `source_documents` schema; lists `ingest_batches` +
  `ingest_items` + `document_jobs` as substrate.
- **ADR-0014** — Tier 2 Document Pipeline; orchestrator behavior
  contract; pipeline ships in Phase 7 per §1249.
- **ADR-0010** — Substrate-now-enforcement-later
  (closed-enum + reserved-value discipline; column-grain reservation
  pattern per chunk-1-Phase-2 precedent).
- **ADR-0013** — Storage abstraction
  (`storageProviderService.fetch` boundary; Phase 6 ingestion calls
  through this service).
- **ADR-0016** — Document relationship graph (`source_document_links`
  shape; Phase 7 territory at v1 — Phase 6 writes no
  source_document_links).
- **ADR-0018** — Relationship Router (Phase 4-shipped; Phase 6
  ingestion writes no Router substrate at v1).
- **ADR-0021** — ADR frontmatter and tooling (governs plans/ vs
  specs/ sub-bucket discipline; this doc lives in plans/ per the
  2026-05-15 adjudication).
- **ADR-0022** — ADR lifecycle workflows (governs amendment vs
  supersession; ADR-0011 §1 amendment for `ingest_items` deferral
  ships at chunk 6.1 commit per ADR-0022 §2 amendment-block format).

**Granularity note.** Phase 6 ships in 3 chunks. Each chunk follows
the chunk-1-Phase-2 brief-drafting → scope-lock → implementation
pattern. Per-chunk volume estimate ~800-1500 lines; well below
chunk-3-Phase-4 upper bound; Path C not invoked per RI-7.

---

## Scope-lock session record (2026-05-15)

Seven scope-lock rounds resolved seven substantive decisions plus
the chunk decomposition. Each lock was ratified against
verify-from-disk evidence; partial-information drift was corrected
at the verify gate before locking (e.g., Reading A vs B for stub
shape; v1 channels framing for substrate-level vs service-level
narrowing).

| Round | Decision | Lock |
|---|---|---|
| 1 | Phase 6 / Phase 7 demarcation | Option 2 — substrate + manual-walkable ingestion. Options 3/4 eliminated by ADR-0014:1249. |
| 2 | Stub runtime presence | Reading B — no orchestrator stub ships at Phase 6. RI-1 satisfied via named-activation (Phase 7 = trigger), per chunk-3-Phase-4 T2/T4/T6 reserved-substrate precedent. |
| 3 | v1 operational channels | `drag_drop_pdf` + `forwarded_mailbox`. Substrate accepts all 4 ENUM values (migration 135:152 "all values active in v1"); service-emission narrows to 2 per spend brief §2:69 + §8.6 (Layer-3 no-emit discipline). |
| 4 | `ingest_batch` semantics | Submission envelope (one batch per submission event; 1:N items). drag-drop event = 1 batch with N items; email = 1 batch with N+1 items (body + N attachments). |
| 5 | `ingest_items` table | DEFERRED to Phase 7 via ADR-0011 §1 amendment per "land schema with consumer code" discipline. Zero v1 consumers (no writer, no reader); `source_documents.ingest_batch_id` captures the 1:N relationship. |
| 6 | `document_jobs` schema | Ships at Phase 6 with anticipatory schema: 7 v1-active columns (id, org_id, source_document_id, document_case_id, ingest_batch_id, state, created_at) + 6 Phase 7-reserved NULL-able columns (attempt_count, started_at, completed_at, last_error_code, last_error_message, pipeline_trace_id). 5-value ENUM with v1-active CHECK = 'queued'. |
| 7 | `document_cases` creation at ingestion | Option 2 with 2c qualification — per-channel asymmetric. drag-drop: 1 case per source_document. forwarded_mailbox: 1 case per email; only `email_body` role written to `document_case_sources` at Phase 6 (the only unambiguous role; primary/supporting/payment_evidence land at Phase 7 post-classification). |
| — | Chunk decomposition | Approach A — 3 chunks (substrate → drag-drop → forwarded_mailbox + closeout). |

### Verify-from-disk evidence base

Five canonical-source verifications anchored the locks:

1. **ADR-0014:1249** — "Implementation surface. The pipeline ships in
   Phase 7 (Extraction) with the full stage set." Eliminated Options
   3/4 of the demarcation question. Locked pipeline = Phase 7.
2. **ADR-0014 §1:165-227** — orchestrator defined as integrated
   end-to-end `ingestDocument` function. No separable stub-shape
   exists at ADR authority. Locked Reading B (no Phase 6 stub).
3. **Migration 135 (`20240135000000_storage_substrate.sql`)** —
   `source_documents` + `source_document_versions` already shipped
   at Phase 1; `ingest_channel` ENUM all 4 values v1-active at DB
   level (no CHECK constraint narrowing). Substrate-citation correction:
   recon agent's claim of "v1 active = drag_drop_pdf + direct_upload"
   was inaccurate; actual state is "substrate accepts 4; service
   narrows."
4. **Spend brief `docs/09_briefs/phase-2/spend_initiative.md`** —
   §2:69 ("drag-drop and forwarded mailbox are the only v1 ingestion
   channels"), §8.6:548-556 (forwarded_mailbox v1 security: hardcoded
   internal-sender allowlist, founder + 2 real users), §10:681
   ("Phase 6 — Ingestion channels. Drag-drop + forwarded mailbox").
   Locked v1 operational channel subset.
5. **Migration 145 (`20240145000000_document_case_sources.sql`)** —
   `document_case_sources` fully immutable post-INSERT (no UPDATE, no
   DELETE per trigger). Role corrections route through chunk-6 detach
   + re-attach via exception queue. Drove the "only write unambiguous
   roles at Phase 6" discipline: `email_body` (unambiguous) is the
   only role Phase 6 writes; primary/supporting/payment_evidence
   land at Phase 7 post-classification.

### Substrate-citation gap surfaced

Verify-from-disk against `docs/09_briefs/phase-2/document_platform_initiative.md`:771-776
revealed: the file cites ADR-0014 as owning row shapes for
`ingest_batches`, `ingest_items`, and `document_jobs`, but
`grep -n "ingest_batch\|ingest_item\|document_jobs" docs/07_governance/adr/0014-tier-2-document-pipeline.md`
returns zero hits. ADR-0014 doesn't define column shapes for any of
these three tables. The citation points at substrate that doesn't
exist in the cited authority. Surfaced as a retrospective inventory
candidate; not a Phase 6 blocker (Phase 6 scope-lock defines the
row shapes; ADR-amendment-territory question deferred to retrospective).

---

## Locked architecture

### Per-channel write composition

**drag-drop event** (user drops N files in chat / canvas):

1. 1 `ingest_batches` row (channel=`drag_drop_pdf`, channel_metadata
   shape decided at chunk 6.1 scope-lock — jsonb vs typed columns
   open question).
2. N `source_documents` rows via `storageProviderService.put()` +
   `create_source_document_with_audit` RPC, each with
   `ingest_batch_id` populated, `ingest_channel=drag_drop_pdf`.
3. N `document_cases` rows at `state='received'` (1:1 with
   source_documents) via `create_document_case_with_audit` (existing
   from chunk-1-Phase-2).
4. **Zero `document_case_sources` rows at Phase 6.** Phase 7
   extraction writes primary role after classification (per chunk
   6.2 design — drag-drop primary role isn't unambiguous at Phase
   6 pre-classification because multi-document PDF split may
   reclassify).
5. N `document_jobs` rows at `state='queued'`, each linking
   source_document_id + document_case_id + ingest_batch_id.

**forwarded_mailbox event** (1 email arrives with 1 body + N
attachments):

1. 1 `ingest_batches` row (channel=`forwarded_mailbox`,
   channel_metadata containing sender_address, subject, message_id,
   raw_headers).
2. N+1 `source_documents` rows: 1 for email body + N for attachments.
   All with `ingest_batch_id` populated, `ingest_channel=forwarded_mailbox`.
3. 1 `document_cases` row at `state='received'` (per-email grain;
   not per-attachment).
4. 1 `document_case_sources` row linking email_body source_document
   → case with role=`email_body` (the only unambiguous role; Phase 7
   won't reclassify the email body).
5. N `document_jobs` rows for the N attachments, all pointing to
   the per-email document_case_id. (Attachments-to-case association
   lives in document_jobs at Phase 6, not in document_case_sources.
   document_case_sources gets attachment links at Phase 7
   post-classification.)

### Architectural cut

Two state-tracking tables operate at distinct grains:

- **`document_case_sources`** is the *post-classification semantic
  link*. Roles primary / supporting / payment_evidence land at
  Phase 7 after classification. Only `email_body` role lands at
  Phase 6 (unambiguous; immutable-safe).
- **`document_jobs`** is the *pre-classification per-attachment
  work-queue*. Phase 6 writes 'queued' rows; Phase 7 orchestrator
  reads + transitions. Carries per-attachment association to the
  per-email case for forwarded_mailbox.

### Substrate shape

| Table | Phase | Shape |
|---|---|---|
| `ingest_batches` | Ships at Phase 6 | id (uuid PK), org_id (RLS), ingest_channel (ENUM), received_at (timestamptz), channel_metadata (typing decided at chunk 6.1 scope-lock — jsonb vs typed columns), created_at (timestamptz), created_by (text). |
| `source_documents.ingest_batch_id` | ALTER NOT NULL at Phase 6 | Closes the "land schema with consumer code" deferral from migration 135 (where source_documents shipped without this FK because `ingest_batches` table didn't yet exist). |
| `document_jobs` | Ships at Phase 6 with anticipatory schema | v1-active: id (PK), org_id (RLS), source_document_id (FK), document_case_id (FK), ingest_batch_id (FK), state (ENUM), created_at. Phase 7-reserved NULL-able: attempt_count (DEFAULT 0), started_at, completed_at, last_error_code, last_error_message, pipeline_trace_id. |
| `document_job_state` ENUM | Ships with full membership; v1-active CHECK = 'queued' | Values: `queued` (v1-active), `in_flight`, `failed_retry`, `failed_permanent`, `completed` (all Phase 7-reserved). |
| `ingest_items` | DEFERRED to Phase 7 | ADR-0011 §1 amendment ships at chunk 6.1 commit. Activation trigger: Phase 7 brief-drafting if/when consumer crisps (most likely shape: channel-attested metadata per attachment for forwarded_mailbox). |

### Service architecture

Pattern B per Phase 5 conventions:

- **`ingestionService`** — channel-conditional entry point. Methods:
  - `handleDragDropUpload(orgId, files, traceId)` — drag-drop entry
    (chunk 6.2)
  - `handleForwardedMailbox(orgId, emailPayload, traceId)` —
    forwarded_mailbox entry (chunk 6.3)
  - Internal channel-handler helpers normalize each channel's input
    to the canonical write path.

- **Atomic RPC** `create_ingest_batch_with_documents_with_audit`
  (chunk 6.1) — the canonical write path. Single transaction writes
  ingest_batches + N source_documents (via inlined or composed call
  to `create_source_document_with_audit`) + N document_cases + N
  document_jobs + 0 or 1 document_case_sources (email_body role
  only). Mirrors chunk-1-Phase-2's `create_document_case_with_audit`
  pattern.

  Open at chunk 6.1 scope-lock: should the RPC be single-channel-aware
  (accepts channel discriminator + channel_metadata + variant args)
  or per-channel (separate `create_drag_drop_ingest_with_audit` +
  `create_mailbox_ingest_with_audit` RPCs)? Lean toward single RPC
  with channel discriminator for transactional uniformity.

### v1 operational channels (Layer-3 service-emission narrowing)

Substrate (Layer 1 DB CHECK): all 4 `ingest_channel` ENUM values
v1-active per migration 135:152. Service-emission (Layer 3):
`drag_drop_pdf` + `forwarded_mailbox` only at Phase 6.
`direct_upload` + `api_ingest` substrate-reserved, service-deferred.
Activation triggers (post-v1):
- `direct_upload` — first form-level non-drag-zone file upload (e.g.,
  manual bill creation form's file attach widget).
- `api_ingest` — programmatic batch API or linked OAuth ingestion.

---

## Per-chunk decomposition

### Chunk 6.1 — Substrate + RPC + ADR-0011 §1 amendment

**Walkable proof:** Service-walkable-via-RPC per chunk-1-Phase-2
precedent. Migration applies cleanly; atomic RPC executes
transactionally from psql (one batch + N source_documents + N cases
+ N jobs + 0-1 case_sources INSERT-with-audit); substrate is queryable
and the RPC's audit row lands in `audit_log`.

**Substrate ships:**
- `ingest_batches` table + RLS + audit triggers per Phase 2 chunk-1
  pattern.
- `source_documents.ingest_batch_id` ALTER NOT NULL.
  Backfill: Phase 1 likely shipped before any production
  `source_documents` rows; if any exist, backfill with a
  sentinel-batch (or assert empty; verify at brief-drafting). Set
  NOT NULL after backfill.
- `document_jobs` table with anticipatory schema (7 v1-active
  columns + 6 reserved NULL-able columns) + RLS + audit triggers.
- `document_job_state` ENUM with all 5 values; v1-active CHECK
  narrows to 'queued'.
- Atomic RPC `create_ingest_batch_with_documents_with_audit`.

**ADR amendment ships:** ADR-0011 §1 deferral of `ingest_items` per
"land schema with consumer code." Per ADR-0022 §2 amendment-block
format. Reading X (separate commit within chunk 6.1 session) vs
Reading Y (bundled with substrate commit) decided at brief-drafting.
Lean Reading X for provenance clarity.

**Brief-drafting flags:**
1. `ingest_batches.channel_metadata` typing — jsonb vs typed columns.
   Trade-off: jsonb (flexible; channel-specific shape varies; one
   column) vs typed columns (queryable; Zod-validatable; ADR-0010
   closed-discipline favors typed). Adjudicate at scope-lock.
2. `document_job_state` attempt_count v1-CHECK shape — explicit
   "DEFAULT 0, no v1-active narrowing" decision.
3. ADR-0011 §1 amendment commit shape — Reading X (separate) vs
   Reading Y (bundled).
4. Backfill plan for `source_documents.ingest_batch_id`. Verify
   production source_documents row count at scope-lock; sentinel
   row vs empty-assertion path decided then.
5. RPC channel-conditional shape — single RPC with discriminator
   vs per-channel RPCs.

**Test floor:**
- RPC atomicity: insert succeeds atomically across all 5 tables;
  failure mid-transaction rolls all back.
- RLS: org-scoped reads only; service-role write path documented.
- Audit emission: every INSERT path emits to audit_log via canonical
  writer (mirrors chunk-1-Phase-2 pattern).
- Reserved enum-value rejection: Layer 1 CHECK blocks
  `state IN (in_flight, failed_retry, failed_permanent, completed)`
  at v1.
- 26/26 Category A floor stays green.

**Volume estimate:** ~900-1200 lines (migration SQL + RPC + tests).

### Chunk 6.2 — Drag-drop end-to-end

**Walkable proof:** User drops PDF (or multiple files) in chat /
canvas surface; ingest_batches row + N source_documents rows + N
document_cases rows + N document_jobs rows land via the
chunk-6.1 RPC; per-document cards render in the UI showing
state='received' + ingest_batch context. Manual-first per Phase 5
precedent.

**Service ships:**
- `ingestionService.handleDragDropUpload(orgId, files, traceId)`.
  Composes `storageProviderService.put()` + RPC call. Returns
  ingest_batch_id + per-file outcomes.
- POST `/api/documents/ingest/drag-drop` route handler. Multipart
  form-data input; Zod-validated; calls ingestionService.
- Drag-drop UX surface — chat-only / canvas-only / both decided at
  chunk 6.2 brief-drafting per the Triage Bucket PRD framing.

**Read endpoints ship:**
- GET `/api/documents/cases?ingest_batch_id=X` — list cases by batch
  (per Phase 5 retro §6:416-424 "lifecycle-state-agnostic per-entity
  endpoints from the start, not queue endpoints with post-filter
  semantics").
- GET `/api/documents/cases/:id` — case detail with sources +
  ingest_batch context.

**UI components ship:**
- Drag-drop zone component (chat / canvas surface per UX scope lock).
- Per-document card component — renders case ID, state,
  ingest_batch context (drop_session_id or sender_address), source
  count.

**Brief-drafting flags:**
1. Drag-drop UX surface — chat-only, canvas-only, both. Adjudicate
   at scope-lock.
2. Per-document cards read endpoint scope — what columns the cards
   actually need; cascades into read endpoint shape.
3. Multipart form-data shape — single-file vs multi-file POST.

**Test floor:**
- Drag-drop end-to-end integration test (POST multipart →
  ingest_batches + N source_documents + N cases + N jobs land).
- Per-document cards render test (read endpoint returns expected
  shape).
- RLS verification (cross-org cards not visible).
- 26/26 Category A floor stays green.

**Volume estimate:** ~1000-1400 lines (service + routes + UI + tests).

### Chunk 6.3 — Forwarded_mailbox end-to-end + Phase 6 closeout

**Walkable proof:** Email from allowlisted internal sender arrives
at the mail-receiver endpoint; webhook handler parses email body +
N attachments; ingestionService.handleForwardedMailbox writes 1
ingest_batches + N+1 source_documents + 1 document_cases (per-email
grain) + 1 document_case_sources (email_body role) + N document_jobs;
per-document card renders the email-grain case with email_body link.

**Service ships:**
- `ingestionService.handleForwardedMailbox(orgId, emailPayload, traceId)`.
- Mail receiver webhook handler — signature verification per chosen
  provider (SES vs Mailgun vs Postmark vs Cloudflare; decided at
  chunk 6.3 scope-lock).
- Hardcoded internal-sender allowlist enforcement per spend §8.6;
  rejection path for non-allowlist senders (audit-logged + dropped;
  no user-visible side effect at v1 per spend §8.6's "founder + 2
  real users" framing).
- MIME parsing — extract body text/HTML + attachments per chosen
  parsing library.

**UI integration ships:**
- Per-document card extension: render email_body link via
  document_case_sources query when ingest_channel=forwarded_mailbox.
- Sender context (sender_address from ingest_batches.channel_metadata).

**Phase 6 closeout ships:**
- Phase 6 retrospective writeup at
  `docs/07_governance/retrospectives/phase-6-retrospective.md` —
  consolidates 8 RI candidate flags + any new flags from
  implementation.
- Friction-journal entries for any implementation-time deviations
  per ADR-0010 substrate-now-enforcement-later + chunks-1-6-Phase-2
  precedent.
- ADR amendments if N≥3 framings surfaced during implementation per
  RI-10; otherwise friction-journal-only divergence.

**Brief-drafting flags:**
1. Mail provider choice — SES / Mailgun / Postmark / Cloudflare Email
   Routing. Trade-offs: SES (heaviest setup, most features), Postmark
   (cleanest webhook + parsing), Mailgun (middle), Cloudflare
   (simplest webhook, limited features). Lean Postmark for cleanest
   developer surface; verify v1 requirements at scope-lock.
2. Email parsing library — mailparser / custom / provider-built-in.
3. Allowlist enforcement path — silent drop vs audit-log + drop vs
   quarantine. Spend §8.6 implies silent drop + audit-log; verify at
   scope-lock.
4. Email body rendering — store rendered HTML, plain-text, or both
   as source_documents content. Affects content_hash computation
   for the email_body source_documents row.

**Test floor:**
- Forwarded_mailbox end-to-end integration test (mock webhook
  payload → ingest_batches + N+1 source_documents + 1 case + 1
  case_source + N jobs).
- Allowlist enforcement test (allowlisted sender succeeds;
  non-allowlist rejected + audit-logged).
- email_body role linking test (case_sources row written with
  immutability-safe role).
- 26/26 Category A floor stays green.

**Volume estimate:** ~1000-1500 lines (service + webhook + parsing
+ UI integration + tests + retrospective).

---

## Phase 4 discipline cluster application

### RI-1 — Consumer-presence verification before substrate addition

Every substrate addition at Phase 6 has named v1 consumer or
named-future-activation trigger:

| Substrate | Consumer | Status |
|---|---|---|
| `ingest_batches` | ingestionService (writer at Phase 6) | Operational v1 consumer |
| `source_documents.ingest_batch_id` ALTER | ingestionService (writer) + Phase 7 orchestrator (reader) | Operational v1 consumer |
| `document_jobs` (v1-active columns) | ingestionService (writer at Phase 6) | Operational v1 consumer (writer-only; reader at Phase 7) |
| `document_jobs` (Phase 7-reserved columns) | Phase 7 orchestrator | Named-future-activation |
| `document_job_state` reserved values | Phase 7 orchestrator | Named-future-activation |
| `ingest_items` table | Phase 7 (if/when consumer crisps) | DEFERRED — ADR-0011 §1 amendment |
| `direct_upload` + `api_ingest` channel values | Post-v1 (RI-Phase6-α) | Service-emission deferred |

### RI-6 — Read-substrate verification at scope-lock, four grains

Applied at chunk 6.1 scope-lock; downstream chunks apply at their
own scope-lock against their substrate consumers:

- **Grain 1 (substrate-shape):** What tables / columns / RPCs / types
  exist? Verify-from-disk on every cited substrate. (Phase 6
  brainstorming already verified migration 135, 137, 143, 145 against
  the design decisions.)
- **Grain 2 (per-channel coverage):** For each ingestion channel
  (drag-drop, forwarded_mailbox), what is the per-channel write
  composition? Already locked in this plan; chunks 6.2 / 6.3 apply
  at implementation.
- **Grain 3 (per-channel × per-failure-outcome):** For each
  combination of (channel, failure-mode), what is the per-cell
  behavior? Examples: drag-drop file with invalid mime; email from
  non-allowlist sender; storage put failure mid-batch. Discriminator
  shape adjudicated at chunk scope-lock.
- **Grain 4 (idempotency-and-side-effect-contract):** For each cited
  contract, is it implemented at chunk close? Phase 6 implements:
  RPC atomicity (chunk 6.1), allowlist enforcement (chunk 6.3),
  document_case_sources email_body-only-at-Phase-6 discipline
  (chunks 6.2 + 6.3). Phase 6 defers: dedup (Phase 7 Stage 0),
  Phase 7 state transitions on document_jobs.

### RI-7 — Session-budget-feasibility verification

Volume estimate: 3 chunks × 800-1500 lines per chunk = ~2500-4500
lines total. Below chunk-3-Phase-4 upper bound calibration. Path C
not invoked. Single-session-per-chunk delivery feasible. Path C
invocation criteria (volume exceeding reliable single-session
delivery; N≥3 framings at scope-lock) NOT met by Phase 6.

### RI-10 — Brief amendment cycle threshold

Zero framings surfaced at this brainstorming session beyond
substrate-shape locks already made. Amendment cycle threshold (N≥3
framings) NOT reached. Single-finding-scale divergences during
implementation absorb via friction-journal entries per default
(chunks-1-6 + Phase 4 chunks-1-3 precedent). Trace second-order
consequences if N≥3 framings surface.

---

## Retrospective inventory carry-forward

Eight RI candidate flags surfaced during 2026-05-15 scope-lock (six
from scope-lock rounds + two from verify-from-disk side-channel).
Carry forward to Phase 6 retrospective (chunk 6.3 close) for
adjudication:

| # | Flag | Origin | Status |
|---|---|---|---|
| **RI-Phase6-α** | `drag_drop_pdf` vs `direct_upload` semantic gap — ADR-0011 §2 lists both but doesn't define the boundary | Round 3 scope-lock | tracking-only; activation trigger = first form-level non-drag-zone upload |
| **Flag 1** | "ADR-named-not-yet-shipped" substrate pattern — ADR text reserves the name; chunk/phase decides when migration ships | Round 5 scope-lock (ingest_items deferral) | codification candidate; sibling to substrate-now-enforcement-later |
| **Flag 2** | `document_jobs` ↔ `ingest_items` overlap at Phase 7 — both ADR-0011 §1 named, both at per-file grain, both work-queue-shaped; Phase 7 brief-drafting needs explicit boundary | Round 6 scope-lock (document_jobs schema) | Phase 7 scope-lock concern |
| **Flag 3** | `document_cases.state='extracting'` ↔ `document_jobs.state='in_flight'` overlap — Phase 7 brief-drafting needs explicit which-state-machine-triggers-which | Round 6 scope-lock | Phase 7 scope-lock concern |
| **Flag 4** | Column-grain vs table-grain "land schema with consumer code" discipline — distinct consumer-presence thresholds at each grain | Round 6 scope-lock (precedent reframe) | codification candidate |
| **Flag 5** | Phase 6 vs Phase 7 division-of-labor on `document_case_sources` writes — currently undocumented in ADR-0011 / migration 145 | Round 7 scope-lock (case creation) | surface in chunk 6.1 brief; codify at retrospective |
| **Flag 6** | Substrate-citation gap — `document_platform_initiative.md:771-776` cites ADR-0014 for row shapes that don't exist in ADR-0014 | Verify-from-disk pre-Round-6 | RI candidate; potentially codifies as new ADR-0023 or ADR-0014 amendment at Phase 6 retrospective |
| **Flag 7** | plans/ sub-bucket lifecycle undocumented at ADR-0021 §4 level — specs/ has explicit lifecycle; plans/ has implicit | Spec-path adjudication (2026-05-15) | sibling to Flag 1 — codification candidate at Phase 6 retrospective |

---

## Open sub-questions deferred to chunk-level scope-lock

These decisions intentionally NOT locked at the Phase 6 plan-grain;
each lands at the chunk where it has direct consumer:

| Decision | Chunk | Notes |
|---|---|---|
| `ingest_batches.channel_metadata` typing (jsonb vs typed columns) | 6.1 scope-lock | ADR-0010 closed-discipline favors typed; jsonb is lighter; trade-off decided then |
| ADR-0011 §1 amendment commit shape (Reading X separate vs Y bundled) | 6.1 brief-drafting | Lean Reading X for provenance clarity |
| `document_job_state.attempt_count` v1-CHECK shape | 6.1 brief | Explicit "DEFAULT 0, no v1-active narrowing" |
| `source_documents.ingest_batch_id` backfill plan | 6.1 scope-lock | Verify production source_documents row count; sentinel-batch vs empty-assertion path |
| RPC channel-conditional shape (single RPC with discriminator vs per-channel) | 6.1 scope-lock | Lean single RPC for transactional uniformity |
| Drag-drop UX surface (chat-only / canvas-only / both) | 6.2 brief-drafting | Triage Bucket PRD framing applies |
| Per-document cards read endpoint scope | 6.2 scope-lock | Touches multiple substrate tables; design read query at scope-lock |
| Mail provider choice (SES / Mailgun / Postmark / Cloudflare) | 6.3 scope-lock | Lean Postmark for cleanest webhook + parsing; verify at scope-lock |
| Email parsing library | 6.3 brief-drafting | mailparser / custom / provider-built-in |
| Allowlist enforcement path (silent drop / audit-log + drop / quarantine) | 6.3 brief-drafting | Spend §8.6 implies silent drop + audit-log |
| Email body rendering (HTML / text / both for content_hash) | 6.3 brief-drafting | Affects content_hash computation on email_body source_documents |

---

## Test floor (preliminary)

26/26 Category A floor tests stay green throughout Phase 6 (per
`pnpm agent:validate`). Full vitest suite stays green at each chunk
close.

Per-chunk new tests:

| Chunk | New tests |
|---|---|
| 6.1 | RPC atomicity (5-table single-transaction); RLS for new tables; audit-log emission; reserved-enum-value rejection; ENUM v1-active CHECK enforcement |
| 6.2 | drag-drop end-to-end (POST multipart → all rows land); per-document cards render; cross-org RLS verification; multi-file drop composition |
| 6.3 | forwarded_mailbox end-to-end (webhook payload → all rows land); allowlist enforcement (allow / reject paths); email_body case_sources linking; multi-attachment per-batch composition; non-allowlist sender drop + audit |

---

## Cross-references

- **ADR-0011** — `docs/07_governance/adr/0011-document-platform.md`
  §1 (substrate ownership), §2 (source_documents schema), §3
  (document_cases lifecycle).
- **ADR-0014** — `docs/07_governance/adr/0014-tier-2-document-pipeline.md`
  §1 (orchestrator definition), §1249 (pipeline ships in Phase 7).
- **ADR-0021** — `docs/07_governance/adr/0021-adr-frontmatter-and-tooling.md`
  §4 (specs/ sub-bucket discipline; plans/ home for this doc).
- **ADR-0022** — `docs/07_governance/adr/0022-adr-lifecycle-workflows.md`
  §2 (amendment-block format for ADR-0011 §1 amendment).
- **Phase 5 retrospective** —
  `docs/07_governance/retrospectives/phase-5-retrospective.md` §6
  (canonical phase sequencing; Phase 6 = Ingestion).
- **Phase 4 retrospective** —
  `docs/07_governance/retrospectives/phase-4-retrospective.md`
  (RI-1, RI-6, RI-7, RI-10 codifications applied at Phase 6
  scope-lock).
- **Phase 4 retrospective post-close correction (2026-05-15)** —
  CLAUDE.md `## Post-close correction (2026-05-15)` section; locates
  Phase 6 as canonical next phase per Phase 5 retrospective §6:380-381.
- **Spend brief** — `docs/09_briefs/phase-2/spend_initiative.md`
  §2:69 (v1 channels), §8.6:548-556 (forwarded_mailbox security).
- **Migration 135** —
  `supabase/migrations/20240135000000_storage_substrate.sql` (Phase
  1 source_documents shipped; ingest_channel ENUM defined).
- **Migration 137** —
  `supabase/migrations/20240137000000_create_source_document_with_audit_rpc.sql`
  (existing RPC Phase 6 ingestionService wires through).
- **Migration 143** —
  `supabase/migrations/20240143000000_document_cases_substrate.sql`
  (chunk-1-Phase-2 atomic RPC pattern Phase 6 mirrors).
- **Migration 145** —
  `supabase/migrations/20240145000000_document_case_sources.sql`
  (immutability constraint driving email_body-only-at-Phase-6
  discipline).
