# Phase 6 retrospective — Document Platform Ingestion (chunks 6.1 → 6.3a)

**Status.** Closes Phase 6 at chunk-6.3b substrate complete (this
retrospective + ADR-0011 fourth amendment at Commit A `9ab5071` +
CLAUDE.md 8 codifications at Commit B `da5b666`) + merge-to-main
ceremony per Path C lock at chunk-6.3a brief Sub-Q1. Three Phase 6
retrospective commits sequenced A → B → C per surface-precedence
T3 > T4 > T1. 1114/1114 vitest; 26/26 agent:validate;
documentation-only batch.

**Surface-precedence note.** Three artifact surfaces ship from this
retrospective work: T3 (the ADR-0011 fourth amendment at Commit A);
T4 (the 8 CLAUDE.md codifications at Commit B); T1 (this
retrospective writeup at Commit C). The surface-precedence ordering
when a future reader needs the canonical statement of any Phase 6
codification is **T3 > T4 > T1** per the CLAUDE.md "When in doubt"
leaf-discipline (ADRs are tiebreakers for architectural questions;
CLAUDE.md is the standing-rules layer; retrospectives are the
war-diary layer). This note is positioned at the end of §7; the
writeup itself follows the seven-section sequence below.

## 1. Arc summary

Phase 6 ships the Document Platform Ingestion layer — the substrate
spine that brings external documents into the ledger system through
multiple channels, lands them under an atomic per-batch contract,
and surfaces them in operator-visible cards UI for downstream
classification + routing in Phase 7+. The arc shipped in four
implementation chunks plus this retrospective consolidation chunk:

- **Chunk 6.1** (commit `2c85ee6`, 2026-05-15): Ingestion substrate
  spine. Migration 152 introduces `ingest_batches` table + 6-param
  JSONB atomic RPC `create_ingest_batch_with_documents_with_audit`
  (variable-length `p_documents` / `p_case_sources` / `p_jobs`
  arrays) + `document_jobs` anticipatory schema +
  `source_documents.ingest_batch_id` column NULLABLE (per Sub-Q4 Step
  A+B, with Step C deferred-with-comments scaffolding for chunk
  6.2a). ADR-0011 §1 third amendment deferring `ingest_items` to
  Phase 7. 1065/1065 vitest. Five-framing RI-10 brief amendment
  cycle fired at Task 12 validation gate (Sub-Q4 Step C activation
  broke 57 cross-phase test callers; resolution Path α defers
  Step C/D to chunks 6.2/6.3 with consumer update). RI-6 fifth-grain
  codification candidate (existing-consumer-contract-conformance)
  surfaced; preserved as friction-journal entry pending observation-
  grain accumulation.

- **Chunk 6.2a** (commit `c6a7159`, 2026-05-15): Sub-Q4 Step C/D
  activation — `ALTER COLUMN ingest_batch_id SET NOT NULL` +
  `enforce_source_documents_column_immutability` trigger extension
  12→13 columns + Sub-Q5 `documentPlatformService.createSourceDocument`
  signature amendment (adds `ingest_batch_id` parameter) + 31-caller
  refactor across 11 invoking test files. 1069/1069 vitest. Path C
  invocation graduates to N=2 observation-grain (prospective at
  brief-draft vs Phase 4 chunk 3 reactive at impl; F-J-14 second-
  instance entry consolidates the prospective-vs-reactive sub-
  discipline). Migration 153 ships `create_ingest_batch_for_test`
  test-only RPC as `_for_test` suffix first-instance precedent.
  Three Grain-5 completeness gaps codified within the friction-
  journal entry: direct-RPC-invocation tests missed in initial
  enumeration; interim-period rows estimate gap (76 NULL rows
  accumulated; Statement 3a sentinel-batch backfill added at impl-
  time); cross-org orphan-blob fixture nuance.

- **Chunk 6.2b** (commit `5eb1fc5`, 2026-05-15): Drag-drop end-to-end
  shipped on staging. 14 files / 2662 insertions / 17 new tests /
  1086/1086 vitest. New service method
  `ingestionService.handleDragDropUpload` + multipart route handler
  at `/api/orgs/[orgId]/documents/ingest/drag-drop` (Next.js native
  `Request.formData()` first-instance precedent) +
  `DocumentIntakeRail` component (native HTML5 `onDragOver`/`onDrop`
  first-instance precedent) + Flag 6 / MF-3 resolution via Postgres
  view (migration 154 `document_cards_view` flattens
  `document_cases` × `document_jobs` × `source_documents` ×
  `ingest_batches` via INNER JOIN with sentinel filter baked into
  WHERE). Flag 16 volume-forecast drift first-instance at 97% above
  upper-bound forecast. Five impl-time discoveries: `withInvariants(...,
  { action })` dropped per CA-27 parity test cost; `document_cases` ↔
  `source_documents` link via `document_jobs` (no direct FK);
  `p_cases` requires `document_type='unknown'` + `trace_id`;
  `audit_log` PK is `audit_log_id` not `id`; vitest config has no
  React DOM environment (UI unit tests skipped). Flag 3 resolution:
  DocumentIntakeRail integrates at `SplitScreenLayout` (4th zone),
  not `ContextualCanvas`.

- **Chunk 6.3a** (commit `c612720`, 2026-05-15): Forwarded mailbox
  ingestion via Postmark inbound webhook + Layer 2 service-enforced
  allowlist + Sub-Q10 cards-UI mount-fetch extension. 1114/1114
  vitest. Migration 155: partial UNIQUE index on `(org_id,
  channel_metadata->>'message_id') WHERE
  ingest_channel='forwarded_mailbox'` for idempotency +
  `internal_sender_allowlist` table + 3 placeholder seed rows. Five
  first-instance precedents codified at chunk close: `/api/webhooks/
  <provider>-<event>/` route convention; Postmark-coupled service
  adapter shape (vendor lock-in by design at v1); system-actor route
  handler pattern (bypasses `withInvariants`); `SystemActorServiceContext`
  sister type (β-3 Approach B resolution; 111-site blast-radius
  alternative rejected); HMAC `crypto.timingSafeEqual` constant-time
  signature comparison. Four β reconciliations at impl-time: β-1
  (`channel` vs `ingest_channel` column name caught at write-time);
  β-2 (`organizations.slug` non-existent column; UUID-as-MailboxHash
  resolution); β-3/MF-2 (111-site `ServiceContext` blast radius →
  sister type Approach B); β-4 (chunk-6.1 RPC rollback test
  `message_id` staleness; broadening-event-test-staleness N=3
  graduation observation).

- **Chunk 6.3b** (this retrospective; Commits A/B/C on staging):
  Retrospective consolidation. ADR-0011 fourth amendment codifies
  the atomic-extension-via-JSONB-array channel-composition pattern
  (Commit A `9ab5071`). CLAUDE.md ships 8 codifications atomically
  (Commit B `da5b666`): substrate-mod-event test-staleness review;
  RI-6 Grain 1 reinforcement + Grain 5 wording extension;
  partial-information-recommendation-drift; verify-from-disk-at-non-
  standard-grain pattern; webhook route handler conventions sub-
  cluster; seed-data PII-shape placeholder convention; audit-action
  naming convention split; Zod strict-vs-passthrough convention.
  This retrospective writeup (Commit C) + retrospective-process F-J
  meta-observations entry close the drafting fire. Merge-to-main
  ceremony per `--no-ff` regular-merge with explicit commit message
  follows at Tasks 4-5; first merge-to-main since `cfcf2e7` (post-
  MVP era pre-Phase-4); 243-commit forward-merge magnitude.

**What Phase 6 closes.** Phase 6 closes here at chunk-6.3b substrate
complete: drag-drop + forwarded-mailbox channels operational end-to-
end; cards UI surface live; atomic-per-batch contract honored;
chunk-6.1 RPC body confirmed channel-agnostic via two independent
consumers (drag-drop at chunk 6.2b + forwarded-mailbox at chunk
6.3a). Phase 6's downstream consumers — Phase 7 (Tier 2 pipeline:
classification + extraction + vendor-matching), Phase 5.1
amendments (INV-DOC-001 enforcement + paymentService introduction +
vendor_credits substrate ratification), and the post-Phase-6 drag-
drop scope-lock cycle (scope-input artifact at `a9f1071`) — sit
downstream of this retrospective; named carry-forwards in §6 below.

The Phase 6 retrospective scope-lock cycle closed at 7 rounds (4
firing rounds + 3 sequential rounds). The round count matches the
Phase 4 retrospective scope-lock cycle round count exactly (also 7
rounds); N=2 round-count convergence at retrospective-scope-lock-
cycle grain anchors the 7-round expectation for Phase 7
retrospective volume forecasting. Codification carries through §6.d
as a named carry-forward observation.

## 2. Per-chunk learnings

### Chunk 6.1 — Ingestion substrate spine

Chunk 6.1 is the substrate-spine chunk of Phase 6. It introduces
`ingest_batches` + `document_jobs` substrate + the 6-param JSONB
atomic RPC body that all subsequent ingestion channels consume. The
brief-vs-implementation grain surfaced one substantial reconciliation
arc — the five-framing RI-10 brief amendment cycle fired at Task 12
validation gate when Sub-Q4 Step C (`SET NOT NULL` on `ingest_batch_id`)
broke 57 cross-phase test callers of `documentPlatformService.createSourceDocument`.
The resolution path α defers Step C+D to chunks 6.2a/6.3 (consumer-
update chunks); the amendment cycle codified the deferred-with-
comments scaffolding pattern that made chunk 6.2a's activation
mechanical.

The friction-journal entry codifies a **fifth-grain proposal** for
RI-6: existing-consumer-contract-conformance. RI-6's original four
grains (substrate-shape; per-trigger semantic coverage; per-trigger
× per-decision-outcome conformance; idempotency-and-side-effect-
contract conformance) verify what substrate IS shipped. The fifth
grain — chunk 6.1 origin — verifies how shipped substrate interacts
with existing CONSUMERS of the affected entity types. The mechanics:
for any chunk that adds a constraint (NOT NULL, CHECK, FK, UNIQUE) to
an existing column OR adds substrate that an existing service writes
to, enumerate existing callers and verify each survives the new
constraint at scope-lock-onset. The chunk 6.1 observation graduated
to consumer-application at chunk 6.2a (Grain 5 prospective scan as
scope-lock substrate); at chunk 6.3a Sub-Q10 firing the grain
extended again to UI-consumer-contract verification.

Sibling-to-related: the constraint-grain "land schema with consumer
code" pattern (Flag 10 at chunk 6.1 close) consolidates with Flag 4's
two existing grains into a three-grain framing — table grain (table
ships when first writer or reader exists), column grain (columns
ship NULL-able ahead of consumer code), constraint grain (NOT NULL /
CHECK / FK / UNIQUE defer until consumers exist that satisfy the
contract). The three-grain framing carries forward as a Phase 6
retrospective codification candidate consolidating Flag 4 + Flag 10
into the consolidated discipline statement; the candidate did not
graduate to CLAUDE.md at this retrospective (held below codification
threshold; tracked in §6.d carry-forward).

The 12 retrospective inventory candidates banked at chunk 6.1 close
carry forward into chunk 6.2a/6.2b/6.3a's continuing inventory; many
graduated at later chunks (Grain 5 at 6.2a + 6.3a; Path C at 6.2a;
Flag 16 LOC forecasting at 6.2b + 6.3a) and several stayed at N=1
observation-grain through Phase 6 close (now tracked at §6.d).

### Chunk 6.2a — Sub-Q4 Step C/D activation + consumer-conformance refactor

Chunk 6.2a is the substrate-consumer-conformance half of the Path C
split that chunk 6.1's brief-amendment cycle locked. The chunk ships
migration 153 with four statements (canonical at chunk 6.2a-close):
Statement 1 (`SET NOT NULL` on `ingest_batch_id`); Statement 2
(`create_ingest_batch_for_test` test-only RPC; `_for_test` suffix
first-instance precedent); Statement 3 (immutability trigger
extension 12→13 columns); Statement 3a (sentinel-batch backfill
added at impl-time per chunk-6.1 carry-forward). Statement 3a
backfilled 76 NULL `ingest_batch_id` rows accumulated since chunk
6.1 close — three-orders-of-magnitude more than the chunk 6.1
brief's "no interim-period rows expected" assumption (which
implicitly assumed inter-chunk window = single-session-grain).

The Path C codification graduates to N=2 observation-grain at chunk
6.2a — prospective at brief-draft (separate briefs per Path C half
via `Na/Nb` suffix at brief-grain) vs Phase 4 chunk 3's reactive at
implementation (brief amendment cycle absorbing five framings into
amended brief `c76d264`). The prospective-vs-reactive sub-discipline
distinction warrants codification at N=2 per CLAUDE.md candidate (e)
shape-refinement-via-within-arc-evidence-basis pathway. F-J-14
second-instance entry consolidates the sub-discipline.

The `_for_test` suffix convention is a first-instance precedent at
the database-RPC layer (sibling to the `_with_audit` suffix
convention from Phase 4 chunk 2 F-J-ε). The chunk 6.2a Sub-Q5 lock
chose the test-only RPC over composing chunk 6.1's 5-table atomic
RPC, eliminating the 5-table atomic-discipline coupling cascade
across 30 unrelated test fixtures. Codification at N=1 first-instance
precedent; future test-only RPC substrate (Phase 7 + post-v1
infrastructure) produces N=2+ observation-grain.

Three impl-time Grain 5 completeness gaps refined the prospective
scope-lock enumeration: (1) direct-RPC-invocation tests missed
(`createSourceDocumentRpcRollback.test.ts` invokes the RPC 4 times
via `db.rpc(...)`; the Grain 5 grep was scoped to service-layer
callers only); (2) interim-period rows estimate gap (76 NULL rows
accumulated; Statement 3a sentinel-batch backfill added at impl-
time); (3) cross-org orphan-blob fixture nuance (helper invocation
with `absentOrgId` would fail at the FK layer; resolved by using
`SEED.ORG_HOLDING` for batch creation + `absentOrgId` for the
source_document). The three sub-instances graduate to refined Grain
5 enumeration discipline at the Phase 6 retrospective; CLAUDE.md
codification at Commit B's Grain 5 wording extension carries the
refinement forward.

LOC came in at the lower bound of forecast (715 vs 700-1100); user
observation at chunk-close noted that 6.2a+6.2b combined band may
recalibrate to ~1500-1900 vs 1700-2300 at 6.2b brief-draft. Chunk
6.2b shipped at 2335 LOC (well above forecast); the recalibration
question carries to §4 codified patterns and §6.d carry-forward.

### Chunk 6.2b — Drag-drop end-to-end

Chunk 6.2b is the operator-visible-arrival chunk of Phase 6. It
ships the first ingestion channel end-to-end: `ingestionService.handleDragDropUpload`
(file → atomic RPC invocation with N source_documents + N
document_cases + N document_jobs + 0 case_sources), multipart route
handler at `/api/orgs/[orgId]/documents/ingest/drag-drop`,
`DocumentIntakeRail` component as the operator surface, and the
operator-visible cards UI list at `/api/orgs/[orgId]/documents/cases`.
Two distinct first-instance precedents shipped at the chunk: Next.js
native `Request.formData()` multipart parsing (zero existing
multipart routes pre-6.2b); native HTML5 `onDragOver`/`onDrop` UI
events (zero existing drag-drop UI components pre-6.2b). Grain 5
prospective scan returned zero existing consumers for both patterns
— zero-count IS the evidence basis (NOT the skip basis); both
codify as tier-1 first-instance precedents.

Flag 6 / MF-3 (cards endpoint sentinel-filter implementation shape;
brief flagged four viable shapes) resolved to option (ii) Postgres
view at impl-time. Migration 154 ships `document_cards_view`
flattening `document_cases` × `document_jobs` × `source_documents` ×
`ingest_batches` via INNER JOIN with the sentinel filter
`channel_metadata @> '{"sentinel": true}'` baked into the WHERE
clause. The same JSONB containment expression appears at BOTH the
Layer 2 Zod ingress (write-side rejection in `DragDropChannelMetadataSchema.strict()`
+ `.refine()`) and the view's WHERE clause (read-side filter):
single sentinel-shape definition, two enforcement sites,
symmetric-filter discipline preserved. The view is GRANTed SELECT to
both `service_role` and `authenticated` for future user-direct
access; the cards route uses `adminClient` (bypasses RLS) plus an
explicit `ctx.caller.org_ids.includes(orgId)` check before the SQL
query (the org-access gate for read endpoints without
`withInvariants`).

Flag 3 (DocumentIntakeRail integration site) resolved to
`SplitScreenLayout.tsx` (4th zone after MainframeRail +
AgentChatPanel + ContextualCanvas), NOT nested in
`ContextualCanvas.tsx`. The semantic rationale: `ContextualCanvas`
hosts directive-typed views (chart_of_accounts, journal_entry_list,
etc.); `DocumentIntakeRail` is a workflow primitive (always-on file
intake affordance), not a canvas directive. Mixing them would couple
canvas navigation history to the intake rail's drop-zone state;
keeping them as sibling layout zones preserves separation of
concerns.

Five impl-time discoveries shipped as friction-journal entries (none
fired single-finding-scale brief amendment cycles per RI-10):
**Discovery 1** — `withInvariants(..., { action })` dropped because
`ActionName` is a CA-27-parity-tested closed enum; adding
`ingest.drag_drop` would require ACTION_NAMES update + permissions
seeding + role_permissions rows; for v1 with no viewer role the
effective permission is "all roles can drag-drop" (Invariant 3 org-
access check covers the load-bearing gate). **Discovery 2** —
`document_cases` carries no direct FK to `source_documents`; the
Phase 6 link is via `document_jobs` (INNER JOIN through
`document_jobs` is the canonical Phase 6 per-card link). **Discovery
3** — `p_cases` payload requires `document_type` + `trace_id` (both
columns are required in the `document_cases` INSERT inside chunk
6.1's RPC); resolved via `document_type: 'unknown'` (pre-
classification; Phase 7 transitions to specific types) +
`trace_id: ctx.trace_id`. **Discovery 4** — `audit_log` PK is
`audit_log_id` not `id`; greppable lesson on schema-table-name vs
column-name conventions. **Discovery 5** — vitest config has no
React DOM environment + no `.test.tsx` glob + no jsdom /
@testing-library/react in dependencies; UI unit tests skipped
(coverage gap: drag-drop event handler state transitions in
`DocumentIntakeRail` are NOT unit-tested; integration tests cover
the wire behavior; Phase 6 retrospective candidate at §4 below).

**Flag 16 — volume-forecast drift first-instance.** Chunk 6.2b
shipped at 2335 LOC vs 785-1185 forecast — 97% above upper bound.
Drift drivers: migration 154 (+119 LOC; NOT in original forecast;
Flag 6 resolution selected the Postgres view shape); test files
heavier than forecast (+~600 LOC; 17 tests × ~53 LOC/test vs brief
estimate ~10-15 tests × ~30-40 LOC/test); heavy file-top comment
blocks (`ingestionService.ts` at 374 LOC; ~30-40% file-top comment
density). Codification candidate at Phase 6 retrospective: revise
per-chunk LOC forecast methodology to account for (a) test-LOC at
~50-60 LOC/test, (b) file-top comment blocks proportional to Sub-Q
count, (c) impl-time-discovered substrate additions (e.g., view
migrations). Carries forward to §4 and §6.d.

Pre-existing test pollution discovered: AP report tests hit "URI too
long" with accumulated rows; resolved via `pnpm db:reset && pnpm
db:seed:all`. Not a chunk 6.2b regression.

### Chunk 6.3a — Forwarded-mailbox ingestion via Postmark inbound

Chunk 6.3a is the second-channel chunk of Phase 6, demonstrating
that chunk 6.1's atomic-extension-via-JSONB-array RPC supports
backward-compatible channel addition via service-layer-only
composition. Where drag-drop ships N files → N source_documents + N
cases (1:1) + 0 case_sources + N jobs, forwarded-mailbox ships 1
email + N attachments → N+1 source_documents + 1 case (per-email
grain) + 1 case_sources (email_body role) + N+1 jobs. The chunk-6.1
RPC body is unchanged; chunk 6.3a's channel handler composes the
appropriate p-arrays for the new channel's row-multiplication shape.
ADR-0011 fourth amendment at Commit A codifies this pattern.

Five first-instance precedents shipped at chunk 6.3a close: (1)
`/api/webhooks/<provider>-<event>/` route convention (greppable
anchor `apps/web/src/app/api/webhooks/`; future webhook routes
inherit); (2) Postmark-coupled service adapter shape (vendor lock-in
by design at v1 per Sub-Q2 lock; Q41 / Phase 2.5+ multi-provider
expansion gets its own brief); (3) system-actor route handler
pattern (bypasses `withInvariants`; constructs
`SystemActorServiceContext` directly with
`caller: { user_id: null, system_actor: 'postmark_inbound_webhook' }`;
the runtime guarantee that `withInvariants` provides is replaced by
HMAC verification + provider-specific org-resolve at the route
handler boundary); (4) `SystemActorServiceContext` sister type (β-3
Approach B resolution; sister to `ServiceContext`, NOT a
discriminated-union extension; 111 existing `ctx.caller.user_id`
consumer sites remain untouched; `recordMutation` widens to accept
union; storage provider methods widen `ctx` to
`StorageProviderContext` same-union alias); (5) HMAC
`crypto.timingSafeEqual` constant-time signature comparison
discipline (direct `===` is an anti-pattern enabling timing-attack
reconstruction of the secret; `timingSafeEqual` is the canonical
Node.js stdlib primitive for constant-time digest comparison; the
helper pattern: compute expected digest → length-check → wrap in
`timingSafeEqual`).

Four β reconciliations surfaced at impl-time:

**β-1** — Migration 155 Statement 1 column name (`channel` vs
`ingest_channel`). Brief example SQL was authored from intuition;
verify-from-disk at migration-write-time surfaced the actual column
name. In-line single-finding-scale correction per RI-10; no brief
amendment cycle; caught before substrate apply.

**β-2** — Brief MailboxHash resolution depended on non-existent
`organizations.slug` column. Brief Sub-Q2 + Sub-Q6 walks + Walkable
proof all referenced `inbound+<org_slug>@inbound.chounting.com` +
`SELECT organizations WHERE slug = mailboxHash` without verify-from-
disk on the slug column. Disk evidence: no slug column. Brainstorming-
side adjudication selected Option 1 (UUID-as-MailboxHash; no
substrate change; ugly UX but bounded by v1 audience size) over
Option 2 (add slug column; substrate creep; slug-generation policy
questions out of chunk 6.3a scope). `resolveOrgFromMailboxHash`
parses MailboxHash as UUID and SELECTs WHERE `org_id = parsed`.
Walkable proof updated in-line to UUID-shape addresses. Q41+ Phase
2.5+ adds slug-based addresses when per-org inbound provisioning
becomes a thing. Compound observation: this is the second
brainstorming-side verify-from-disk miss in chunk 6.3a (β-2 + β-3);
both share the same underlying pattern (brief-scope-lock-without-
substrate-verify-from-disk); strengthens RI-6 Grain 1 codification.

**β-3 / MF-2** — `ServiceContext` discriminated-union 111-site blast
radius. Brief Sub-Q6 Artifact 3 proposed `ServiceContext.caller`
become a discriminated union with pre-drafted conditional MF-2
threshold "≤10 sites in-scope; >10 sites codify scope expansion."
Verify-from-disk at impl onset: 111 sites in `apps/web/src/services/`
reference `ctx.caller.user_id`. 11x threshold. Brainstorming-side
adjudication considered three approaches: A (union + per-site
narrowing; 111-site blast radius); B (sister type
`SystemActorServiceContext`; zero blast radius); D (union +
`withInvariants` narrows; still touches 111 annotations). Approach
B selected. Sister type is structurally distinct from
`ServiceContext`. Service methods that need to support both
invocation modes declare `ServiceContext | SystemActorServiceContext`
at parameter type (explicit signature, not implicit narrowing). The
"two ServiceContext types" cost is bounded; the alternative (111-
site narrowing for 1 new system-actor caller) is scope-
disproportionate.

**β-4** — chunk-6.1 RPC rollback test `message_id` staleness;
broadening-event-test-staleness N=3 graduation observation. Migration
155 Statement 1 (partial UNIQUE index on `(org_id,
channel_metadata->>'message_id') WHERE
ingest_channel='forwarded_mailbox'`) caused
`tests/integration/createIngestBatchWithDocumentsRpcRollback.test.ts`
Test 2 + Test 6 to fail. The test helper `buildBatch()` used a
hardcoded `<msg@example.com>` message_id that worked at chunk 6.1
(no idempotency constraint) but now collides across runs and tests.
Resolution: per-call `crypto.randomUUID()` injection in the helper.
The N=3 firing of the broadening-event-test-staleness pattern family
across cross-phase chunks (chunk-2-Phase-4 β-2; chunk-6-Phase-2 β-2c;
chunk 6.3a β-4) graduated the pattern to tier-2 codification
eligibility per the CLAUDE.md observation-grain N=3 convention. The
codification graduated at this retrospective Commit B as the
"Substrate-mod-event test-staleness review" CLAUDE.md convention.

**Sub-Q1 / Sub-Q10 disposition refinement.** Sub-Q1 lock at session
start scoped "server-only" to new affordances (no new drag-drop UI;
no new visual paradigm). Sub-Q10 walk surfaced that **cards-UI
discovery mechanism** required a Grain 5 fifth-grain extension via
cards endpoint optional `batch_id` + `DocumentIntakeRail` mount-
fetch (Option B). The Path C split holds; "server-only" refined at
Sub-Q10 grain to scope to **affordance-kind**, not discovery-
mechanism. Without the Grain 5 extension catching the existing-UI-
consumer gap, forwarded-mailbox would have shipped with cards
invisible in UI (operator-perceives-as-broken-despite-working-
correctly). The refinement graduated Grain 5 from "consumer scan
for new emitting code" to "consumer scan for new emitting code AND
existing-UI-consumer of affected entity types"; codification at
Commit B's Grain 5 wording extension carries the refinement
forward.

Volume came in at 2597 LOC (within the recalibrated 2000-3500 band
per Flag 16's post-overshoot widening); 28 new tests vs 15 forecast
(+11 over upper tolerance). The Flag 16 recalibration methodology
appears to work for the first validation instance (N=1 validation
instance against the recalibrated band). Test-count tolerance
methodology refinement candidate for Phase 7+ anchoring.

## 3. Centerpiece — Cross-phase consumer-application of Phase 4 codifications + scale-invariant disciplines parallel arc

Phase 6 is the first phase-arc test of Phase 4's codification
cluster (`Verify-forward-at-scope-lock for computational-shape
chunks` — RI-1 + RI-6 + RI-7 + RI-10 + observation-grain-vs-
application-grain) operating at consumer-application time. The
Phase 4 retrospective named Phase 5.1 + Phase 7 as the cross-phase
consumer surfaces at the time of its drafting; the 2026-05-15
post-close correction at the Phase 4 retrospective ratified Phase 6
as the actual canonical next-phase consumer per Phase 5
retrospective §6 sequencing (the original Round 7 scope-lock missed
Phase 6 entirely; the correction was provenance-preserving append).
Phase 6 thus operates as the **pure discipline-reference consumer**
shape from the Phase 4 retrospective Round 7 Q3 three-shape framing
— activation-trigger inventory empty (Phase 6 does not activate
chunk-3-Phase-4 reserved T2/T4/T6 dispatcher slots; does not
activate γ'-partial coverage gap; does not directly consume Phase 4
substrate beyond standing read-boundary access at ADR-0011 §1
documentation), discipline-reference inventory non-empty (RI-1 +
RI-6 four-grain + RI-7 + RI-10 all fire at Phase 6 chunks).

This §3 has two sub-sections per Round 5 Adjudication 1 refinement:
the primary arc (§3.a) traces per-chunk firings of the Phase 4
codifications; the parallel arc (§3.b) traces scale-invariant
disciplines observed at retrospective grain across three sub-
property observations with explicit inheritance relationships.

### 3.a Primary arc — Cross-phase consumer-application of Phase 4 codifications

The four Phase 4 codifications (RI-1 + RI-6 + RI-7 + RI-10) fired
multiply at Phase 6 chunks. Per-chunk inventory:

**Chunk 6.1 firings.** RI-6 fired as a **fifth-grain proposal** — the
chunk 6.1 brief amendment cycle surfaced that RI-6's four-grain
discipline was insufficient to catch the Sub-Q4 Step C consumer-
impact gap. The grain that was missing: existing-consumer-contract-
conformance. RI-10 fired at Task 12 validation gate as the five-
framing brief amendment cycle that absorbed the consumer-impact-gap
finding + four related findings (sentinel-batch fallback; column-
NOT-NULL deferral; Step C/D activation deferral; cross-chunk
activation trigger naming). The amendment cycle codified the
deferred-with-comments scaffolding pattern that made chunk 6.2a's
Step C activation mechanical. RI-1 fired implicitly at the brief-
amendment scope (`ingest_items` substrate held back per "no v1
consumer" reasoning; ADR-0011 §1 third amendment codifies the
deferral). RI-7 did not fire at chunk 6.1 (single-session reliable
delivery achieved; volume came in at forecast).

**Chunk 6.2a firings.** RI-7 + F-J-14 fired as a Path C invocation
graduating to N=2 observation-grain — prospective at brief-draft
(separate briefs per Path C half via `Na/Nb` suffix at brief-grain)
vs Phase 4 chunk 3's reactive at implementation. The prospective-
vs-reactive sub-discipline distinction is the chunk 6.2a-graduation-
eligible refinement; both invocation shapes share the underlying
RI-7 evidence-driven criteria (volume threshold AND framings
threshold each sufficient on its own; neither necessary if the
other fires). Sub-Q4 4-step shape ("Sub-Q locks at brief-drafting
with explicit cross-chunk activation trigger named") codifies the
constraint-activation-deferral pattern as a sibling to Path C —
both are arc-shape codifications at chunk-grain. Grain 5 fired
prospectively at brief-draft (the canonical 30-caller / 10-file
enumeration table); three impl-time completeness gaps refined the
enumeration discipline (direct-RPC-invocation tests missed;
interim-period rows estimate gap; cross-org orphan-blob fixture
nuance). The Grain 5 refinement graduated at this retrospective
Commit B's RI-6 Grain 5 wording extension.

**Chunk 6.2b firings.** Flag 16 RI-7 forecasting drift surfaced as
first-instance volume-forecast 97%-above-upper-bound observation.
The chunk 6.2b LOC drift exposed three forecast-methodology
assumptions: test-LOC-per-test undercount (~53 vs forecast ~30-40);
file-top comment block density undercount; impl-time-discovered
substrate additions (the migration 154 view; +119 LOC not in
forecast). RI-6 Grain 5 fired prospectively at brief-draft for the
two first-instance precedents (Next.js native multipart parser +
HTML5 drag-drop UI events); zero-count IS the evidence basis (NOT
the skip basis); both codify as tier-1. RI-10 did not fire at
chunk 6.2b (no brief amendment cycle; five impl-time discoveries
all single-finding-scale).

**Chunk 6.3a firings.** RI-1 fired at β-2 consumer-presence
reasoning (`organizations.slug` non-existent column; brainstorming-
side adjudication selected Option 1 UUID-as-MailboxHash over Option
2 add-slug-column to avoid substrate creep + slug-generation policy
question expansion). RI-6 fired at Sub-Q10 firing as the Grain 5
UI-consumer-contract extension — the canonical first instance of
existing-UI-consumer-contract verification at scope-lock-onset.
RI-7 was referenced operationally in the chunk-6.3a brief (Path C
context); did not fire as a new invocation. RI-10 fired at β-2 +
β-3 in-line single-finding-scale brief amendments AND at the
compound cluster consolidation between Flag 20 + β-2 + β-3 + Sub-
Q10 (four entries surface one underlying pattern; the RI-10
consolidation discipline). Codify-while-deciding fired reflexively
throughout — the chunk 6.3a brief Sub-Q-disposition refinements
(Sub-Q1 affordance-kind scope refinement; Sub-Q10 fifth-grain
firing) were codified at decision-time rather than deferred.

**Synthesis.** Phase 6 is the first phase-arc test of Phase 4
codifications operating at consumer-application time per Phase 4
§6.c named-future-feedback-loops. The codifications fire across
all four chunks; the fifth-grain extension (chunk 6.1 origin →
chunk 6.2a prospective application → chunk 6.3a UI-consumer-
contract extension) is the canonical evidence that the RI-6
four-grain framework operates as intended at downstream-consumer-
application time — the grain itself extends through use, refining
the framework's surface as it propagates. The Phase 4 §6.c
prediction ("does the four-grain checklist surface computational-
shape questions that scope-lock would otherwise miss?") returns a
clean affirmative: yes, with operational refinement at the fifth
grain.

### 3.b Parallel arc — Scale-invariant disciplines at retrospective grain

The Phase 6 retrospective drafting fire surfaced three observations
about disciplines operating scale-invariantly across grain
dimensions. These observations don't graduate at this retrospective
(N=1 or N=2 across the relevant dimensions); they're captured here
as parallel-arc body that future retrospectives may extend with
N=2+ evidence. The three observations carry explicit inheritance
relationships: Observation 1 is primary; Observation 2 is parallel
meta-discipline; Observation 3 is descendant of Observation 1.

#### Observation 1 — Brainstorming-side / execution-side split scale-invariance (primary)

The brainstorming-side / execution-side split — the discipline
distinction between sessions that produce framings + decisions
(brainstorming-side) vs sessions that consume framings + execute
substrate changes (execution-side) — operates scale-invariantly
across multiple grain dimensions observed in Phase 6:

- **Sub-dimension 1 — within-impl-session grain.** Chunk-6.3a
  impl-onset surfaced β-2 (`organizations.slug` non-existent) +
  β-3 (`ServiceContext` 111-site blast radius). Both findings
  required brainstorming-side adjudication mid-implementation
  before execution could proceed. The split fires at the boundary
  between "execution-side caught the gap" and "brainstorming-side
  adjudicates the resolution path."

- **Sub-dimension 2 — session-handoff-boundary grain.** The chunk-
  6.3a → chunk-6.3b session-handoff carried the retrospective
  consolidation handoff at `e0824c2`. The handoff prompt was
  brainstorming-side artifact (chunk-6.3a-close brainstorming
  output); chunk-6.3b session-onset state-verify (execution-side)
  caught a quantitative drift in the handoff prompt's "~20+
  commits" framing vs disk reality (243 commits). The split fires
  at the boundary between "brainstorming-side produced the handoff
  prompt" and "execution-side verifies-from-disk at substrate-
  receipt."

- **Sub-dimension 3 — subagent-dispatch-boundary grain (recursive
  level; N=1 at chunk-6.3b drafting fire).** Chunk-6.3b drafting
  fires under the Option-1-bundled-execution shape: Level α
  (founder ↔ orchestrator) operates at chunk-6.3b-overall grain;
  Level β (orchestrator ↔ subagents) operates at sub-task grain.
  The brainstorming-side / execution-side split fires at BOTH
  levels — orchestrator is the "execution-side" relative to founder
  brainstorming-side framings, AND orchestrator is the "brain-
  storming-side" relative to subagent execution-side dispatch. The
  split operates not only across sub-dimensions but **recursively
  at multi-level grain when execution-side dispatches subagents**.
  N=1 recursive-level instance at chunk-6.3b drafting fire; below
  codification threshold but explicit in parallel arc body.

**Status.** N=2 broad family across sub-dimensions 1+2; sub-
dimension 3 N=1 at chunk-6.3b drafting fire; T1 retrospective
writeup captures the observation. The observation does not graduate
at this retrospective; future retrospectives may surface N=2+
evidence per sub-dimension and consider promotion. The discipline-
shape candidate: brainstorming-side / execution-side split is
load-bearing at every grain where framings get produced (one side)
and substrate gets consumed (other side); the disciplines that
catch the split (verify-from-disk at substrate-receipt; codify-
while-deciding-not-while-implementing) operate at every such grain.

#### Observation 2 — RI-10 framing-interaction-tracing scale-invariance (parallel meta-discipline)

RI-10 (brief amendment cycle threshold + framing-interaction matrix
at N≥3) is the canonical Phase 4 codification for multi-finding-
shape-changing amendment cycles. Phase 6 surfaces evidence that
RI-10 operates **scale-invariantly across grain dimensions**, not
strictly at amendment-cycle grain. The refined framing per WSL-side
Round 7 + brainstorming-side terminal observation 1: **RI-10 fires
whenever consolidation-pressure is present at multi-framing scale,
regardless of grain dimension** (amendment-cycle grain; scope-lock-
round grain; cross-adjudication grain; cross-candidate grain).

**Positive-instance firings (N=3).**

1. Phase 4 chunk 3 amendment cycle at amended brief `c76d264` —
   N=5 framings (γ' re-eval primitive + γ'-partial per-trigger
   coverage + D-partial 6-rule discriminator + D-partial-no-
   idempotency + Path C split). The canonical RI-10 first-instance
   precedent at amendment-cycle grain.

2. Chunk-6.3b Round 3 within-scope-lock-round consolidation — N=4
   entries (Flag 20 slug column gap + β-2 MailboxHash resolution +
   β-3/MF-2 ServiceContext blast radius + Sub-Q10 cards-UI
   discovery-mechanism gap). The RI-10 consolidation discipline
   operated at scope-lock-round grain: four entries surface one
   underlying pattern (brief-scope-lock-without-substrate-verify-
   from-disk at varying sub-grains); the consolidation produces
   the RI-6 Grain 1 reinforcement entry shipped at Commit B.

3. Chunk-6.3b Round 5 within-adjudication consolidation — N=3
   candidates (candidate (b) RI-6 Grain 1 reinforcement +
   candidate (d) RI-6 Grain 5 wording extension + candidate (f)
   verify-from-disk-at-non-standard-grain pattern). The Round 5
   adjudication consolidated three codification candidates that
   each surface a sub-grain of the same underlying parent
   discipline (substrate-verify-from-disk at varying grains).

**Negative-instance non-firings (N=2).**

1. Chunk-6.3b Round 6 parallel-operation grain — operations 1+2+3+4
   ran in parallel (per-commit gate sequencing + merge ceremony
   shape + push-readiness three-condition gate + MEMORY.md anchor
   flip discipline). RI-10 did not fire at this grain — the four
   operations are domain-distinct sub-locks, not framings touching
   one underlying pattern. The negative instance confirms RI-10
   silent without consolidation pressure.

2. Chunk-6.3b Round 7 sequential-sub-op grain — Sub-ops 1+2+3+4+5+6
   ran sequentially (canonical Phase 6 next phase verification +
   drag-drop scope-lock-deferral + parallel arc body shape refinement
   + observation 2 refined framing + reserves verification + §6
   carry-forward 5-sub-section structure). RI-10 did not fire — the
   six sub-ops are sequential resolution items, not framings
   touching one underlying pattern. The negative instance confirms
   round-grain alone is not sufficient trigger; consolidation
   pressure is the load-bearing trigger.

**Discipline-shape evidence.** Positive instances confirm "RI-10
fires under consolidation pressure"; negative instances confirm
"RI-10 silent without consolidation pressure" (round-grain alone is
not sufficient trigger). The discipline operates at consolidation-
pressure grain, not round-grain. **Status:** N=3 positive + N=2
negative evidence basis; the framing refinement carries to Phase 7
retrospective per §6.d carry-forward as a Tier-3 candidate (positive
+ negative evidence as combined N-count basis for discipline-shape
codification). The observation is parallel-meta-discipline to
Observation 1 (brainstorming-side / execution-side split): both
observations describe discipline scale-invariance; Observation 1
describes the split at production / consumption boundary;
Observation 2 describes RI-10 firing at consolidation-pressure
trigger.

#### Observation 3 — Artifact-immutability discipline two-shape distinction (descendant of Observation 1)

Retrospective writeups and brief artifacts shipped through the
project have a "ship-then-don't-edit" discipline — once committed,
artifacts get amended via additive-provenance-preserving append
rather than in-place edits, preserving the chronological reading
trail. Phase 6 surfaces a two-shape distinction within this
discipline:

- **Shape α — same-side same-arc append-correction.** Phase 4
  retrospective post-close drift-fix at commit `18dd608`
  (2026-05-15): the Phase 4 retrospective writeup at Commit C
  shipped with "Phase 5.1 reviewer chunk" naming fabrication +
  missed Phase 6 in §6.b cross-phase consumer inventory; the post-
  close correction appends a "## Post-close correction" section at
  the end of the retrospective preserving original sections
  unchanged. Author = same side that produced the artifact;
  correction happens within the same arc (Phase 4 retrospective
  arc); write-access to the artifact preserved.

- **Shape β — cross-side cross-session downstream-correction-
  surface.** Chunk-6.3b handoff prompt at `e0824c2` (brainstorming-
  side artifact composed at chunk-6.3a close) carries quantitative
  drift ("~20+ commits" vs 243 actual). The drift gets caught at
  chunk-6.3b execution-side session-onset state-verify (Round 0
  catches); the correction surface is **not** an in-place edit to
  the handoff prompt (the handoff is now historical artifact of the
  chunk-6.3a close) but a downstream correction surface (the chunk-
  6.3b retrospective writeup + this F-J meta-observations entry).
  Author = opposite side from artifact's authoring side; correction
  happens cross-session; no write-access to the artifact at
  consumption-grain.

**Inheritance.** Observation 3 is a **descendant of Observation 1**
through the authorship-boundary structural property. Same-side
authoring → append-correction shape (write-access to artifact;
correction landed in-place within original document via append);
cross-side authoring → downstream-correction-surface shape (no
write-access at consumption-grain; correction lives in downstream
artifact). The two shapes are not symmetric: shape α preserves the
correction at the original artifact; shape β preserves the
correction at the downstream consumer; both honor the underlying
artifact-immutability discipline but at different write-surfaces.

**Status.** N=2 sub-shapes at this retrospective; T1 retrospective
writeup captures the distinction. The discipline does not graduate
to a new T4 codification at this retrospective; future
retrospectives may surface additional sub-shapes (e.g., three-side
sub-shape if multi-agent dispatch produces a third authorship
boundary) and consider promotion. The descendancy framing is
load-bearing: Observation 3's two-shape distinction emerges from
the brainstorming-side / execution-side split (Observation 1)
operating at the artifact-immutability discipline surface.

## 4. Codified patterns

Phase 6's codification graduation surface is structured per Round 5
+ Round 3 + Round 4 locks — patterns grouped by where they graduate
(T3 ADR amendment cluster / T4 CLAUDE.md cluster / memory-only-stays
cluster / carry-forward cluster).

### T3 cluster — graduated to ADR-0011 (Commit A)

- **Atomic-extension-via-JSONB-array channel-composition pattern.**
  Closes chunk-6.3a F-J entry 18. Evidence basis: chunk 6.1's atomic
  RPC body accepts variable-length JSONB array parameters; chunk
  6.2b drag-drop consumer + chunk 6.3a forwarded-mailbox consumer
  demonstrate channel-agnostic backward-compatible composition at
  the service layer. Future channel additions (api_ingest at Phase
  7+; direct_upload reserved per §1) land at the service-layer only;
  the chunk-6.1 RPC body is the canonical atomicity boundary;
  channel-specific shape lives outside. Discipline-rule statement:
  "Future channel additions land at the service-layer only."
  Codification graduation: chunk-6.3a + chunk-6.2b dual-consumer
  evidence at Phase 6 close. Cross-references: ADR-0011 §1; Commit
  A at `9ab5071`.

### T4 cluster — graduated to CLAUDE.md (Commit B)

The T4 cluster ships as 8 codifications atomically at Commit B,
inserted across existing clusters (`Verify-forward-at-scope-lock for
computational-shape chunks` + codify-while-deciding meta-discipline
+ new `## Project conventions` standalone H2). Each codification is
named below with its evidence basis + graduation pathway:

- **Substrate-mod-event test-staleness review (candidate (a); N=3
  graduation).** When shipping a substrate modification that
  broadens an enum, adds a partial UNIQUE constraint, renames a
  CHECK constraint, or otherwise changes a column-level invariant,
  audit dependent tests at substrate-mod commit time (not at
  downstream test-failure time) for assertion strings referencing
  constraint names + hardcoded values that the substrate-mod
  broadens or constrains + reserved-set assertions. N=3 evidence
  basis: chunk-2-Phase-4 β-2 (exception_status 'matched' broadening
  invalidated chunk-6 test assertion); chunk-6-Phase-2 β-2c (audit
  test regex hardcoded constraint name); chunk-6.3a β-4 (chunk-6.1
  RPC rollback test hardcoded message_id collided with migration
  155 partial UNIQUE index). Codification graduation: Phase 6
  retrospective Commit B (insertion site: new sibling section under
  `## Verify-forward-at-scope-lock` cluster, after
  Substrate-now-enforcement-later cross-pattern).

- **RI-6 Grain 1 reinforcement (candidate (b); chunk-6.3a evidence
  basis).** Four sub-instances at chunk-6.3a strengthen the Grain 1
  discipline — each fires the same underlying pattern (brief-scope-
  lock-without-substrate-verify-from-disk) at a distinct sub-grain:
  Flag 20 (column-existence sub-grain); β-2 (MailboxHash resolution
  same-surface caught at impl-onset grain); β-3/MF-2 (consumer-
  count sub-grain; 11x off); Sub-Q10 (UI-consumer-contract sub-
  grain). The discipline rule strengthens at chunk-6.3a evidence
  basis: cited substrate at scope-lock requires verify-from-disk
  at the cited-substrate's grain — column-existence for SQL
  references, consumer-count for blast-radius estimates,
  UI-consumer-contract for affordance-kind constraints.
  Codification graduation: Phase 6 retrospective Commit B
  (insertion site: amendment to existing RI-6 Grain 1 subsection
  within `## Verify-forward-at-scope-lock` cluster).

- **RI-6 Grain 5 wording extension (candidate (d); fifth-grain
  ratification).** Grains 1-4 verify what substrate IS shipped;
  Grain 5 verifies how shipped substrate interacts with existing
  CONSUMERS of the affected entity types. Sub-sub-grains:
  substrate-shape consumer-application (chunk-6.1 origin; cross-
  phase test failure surfaced consumer-contract gap); UI-consumer-
  contract (chunk-6.3a Sub-Q10 firing; forwarded-mailbox ingestion
  would have shipped with cards-UI invisibility without the
  extension). Discipline rule: scope-lock that ships substrate
  affecting an entity type MUST verify-from-disk against all current
  consumers of that entity type — services, agent tools, integration
  tests, AND existing UI components — to confirm consumer-contract
  conformance post-modification. Codification graduation: Phase 6
  retrospective Commit B (insertion site: amendment to existing
  Grain 5 subsection within RI-6).

- **Partial-information-recommendation-drift discipline (candidate
  (c); N=8 graduation with two-shape sub-discipline: retrospective
  + prospective).** When authoring a recommendation, brief, handoff
  prompt, or other substrate that frames decisions for downstream
  consumption, partial-information recommendations (recommendations
  made without disk-verify on cited substrate) introduce drift that
  surfaces at consumption time. Two firing-shapes: retrospective
  drift (recommendation references prior work without disk-verify;
  catch authority = reader of recommendation; codification surface
  = drift-fix entry post-discovery) + prospective drift
  (recommendation frames future work with quantitative anchors or
  substrate references without disk-verify at authoring time; catch
  authority = execution-side session-onset state-verify;
  codification surface = Round 0 state-verify ratification +
  downstream consumption surfaces). N=8 evidence basis: (1) Phase
  5.1 "reviewer chunk" naming drift at Phase 4 retrospective
  drafting (retrospective drift; caught at post-close drift-fix
  `18dd608`); (2) Reading A vs B scope-lock adjudication
  (retrospective drift; brainstorming-session-internal); (3) scope-
  observation framing on Postmark webhook scope vs Reading B lock
  (retrospective drift; brainstorming-session-internal); (4) chunk-
  6.3b handoff prompt "~20+" vs 243 commits magnitude drift
  (prospective drift; caught at WSL-side Round 0 state-verify); (5)
  chunk-6.3b Round 6 onset brainstorming-side Op 2 "first merge-to-
  main since pre-Phase-4 grain" framing drift (caught at Round 6
  verify-from-disk); (6) T4-1 drafting plan cited "Verify-forward-
  at-scope-lock cluster" but actual parent on disk is `## Session
  execution conventions` (prospective drift at plan-author cluster-
  anchor grain; caught at Commit B execution-side verify-from-disk);
  (7) T4-2 part 2 Grain 5 plan said "Replace existing prose" but no
  Grain 5 subsection existed in CLAUDE.md (chunk-6.1 F-J
  codification candidate never promoted; prospective drift at plan-
  author cluster-anchor grain; caught at Commit B execution-side
  verify-from-disk); (8) T4-7 + T4-8 plan cited parent clusters
  ("audit emission conventions" + "Layer 2 boundary validation")
  that don't exist in CLAUDE.md; subagent created new `## Project
  conventions` H2 to host T4-5/6/7/8 (prospective drift at plan-
  author cluster-anchor grain; caught at Commit B execution-side
  verify-from-disk). Instances (6)+(7)+(8) raise the candidate from
  N=5 at Round 7 scope-lock to N=8 at Commit C drafting; the three
  new sub-instances are Cluster-B-equivalent pattern at plan-author
  grain (drafting plan repeating the same pattern caught at chunk-
  6.3b handoff prompt drift; N=2 at Cluster-B grain). Both shapes
  inherit the broader Verify-from-disk-at-non-standard-grain
  pattern at recommendation-substrate-receipt grain.
  Codification graduation: Phase 6 retrospective Commit B
  (insertion site: new section under codify-while-deciding meta-
  discipline cluster).

- **Verify-from-disk-at-non-standard-grain pattern (candidate (f);
  grain-agnostic parent codification with 8 sub-grain instances +
  catch-direction-agnostic discipline rule).** Execution-side at
  substrate-receipt MUST disk-verify substrate before consuming,
  regardless of substrate-grain and regardless of substrate-
  authorship-provenance. Sub-grains observed to date: substrate-
  shape (chunk-6.3a β-2; inter-side catch); consumer-count (chunk-
  6.3a β-3; inter-side catch); context-gap (chunk-6.3a scope-input
  artifact; session-internal catch); handoff-receipt (chunk-6.3a→
  6.3b transition; inter-side catch); intra-handoff-quantitative-
  estimate (chunk-6.3b Round 0 catch #4; inter-side catch); intra-
  commit-message-entry-count (chunk-6.3b Round 0 catch #5; intra-
  side catch — NEW catch-direction sub-shape). Cross-grain
  instances at Phase 4: Round 3 retrospective-scoping naming drift;
  post-retrospective-close drift-fix at `18dd608`. Discipline rule:
  disk is the canonical source; substrate-receipt grain — wherever
  it lives (impl-onset, session-onset, retrospective-scoping,
  downstream-consumption) — requires disk-verify against the cited
  substrate's grain; the discipline operates catch-direction-
  agnostic (same-side substrate is not exempt from disk-verify-at-
  consumption). Codification graduation: Phase 6 retrospective
  Commit B (insertion site: new sibling section under `## Verify-
  forward-at-scope-lock` cluster).

- **Webhook route handler conventions sub-cluster (chunk-6.3a
  entries 1+3+4+5 consolidated).** Conventions for external-webhook
  routes — provider-invoked HTTP endpoints that receive substrate
  from third-party services. Four sub-conventions: directory
  convention (`/api/webhooks/<provider>-<event>/route.ts`); system-
  actor route handler pattern (bypasses `withInvariants`; constructs
  `SystemActorServiceContext` directly); `SystemActorServiceContext`
  sister type (NOT a discriminated-union extension; existing
  `ctx.caller.user_id` consumer sites unchanged); HMAC constant-
  time signature comparison (`crypto.timingSafeEqual` on equal-
  length hex digests; direct `===` is an anti-pattern). N=1 first-
  instance precedent at `apps/web/src/app/api/webhooks/postmark-
  inbound/route.ts`; future webhook routes inherit. Codification
  graduation: Phase 6 retrospective Commit B (insertion site: new
  section under `## Project conventions` standalone H2).

- **Seed-data PII-shape placeholder convention (chunk-6.3a Flag 18;
  N=1 first-instance precedent).** When migration-seeded data
  includes PII or near-PII (email addresses, phone numbers,
  personal identifiers), prefer placeholder-plus-post-deploy
  convention vs literal-values-in-migration. Pattern: migration
  ships placeholder rows; operator runs post-deploy UPDATE to
  substitute real values. Discipline-failure mode if forgotten:
  downstream consumer rejects all data as not-matching expected
  shape (loud, observable, not silent). Reason: git history is
  forever; v1 audience scope does not constrain future audience.
  N=1 evidence basis: migration 155 Statement 3 inserts 3
  allowlist seed rows with placeholder addresses for
  `internal_sender_allowlist`. Codification graduation: Phase 6
  retrospective Commit B (insertion site: new section under
  `## Project conventions` standalone H2; parallel to chunk-6.2a
  `_for_test` first-instance graduation precedent).

- **Audit-action naming convention split (chunk-6.3a entry 15;
  N=2 evidence dot-namespaced + underscored).** Audit action names
  split between two shapes: dot-namespaced (e.g.,
  `forwarded_mailbox.rejected_not_allowlisted`,
  `forwarded_mailbox.signature_invalid`) for new domain-event
  families with anticipated taxonomy expansion; underscored (e.g.,
  `document_case_transitioned`, `ingest_batch_created`) for
  established entity-state-transition events with stable taxonomy.
  N=2 evidence basis: chunk-6.3a forwarded_mailbox.* opens a new
  domain family (dot-namespaced); chunk-2-Phase-3
  `document_case_transitioned` is established entity-state-
  transition (underscored). Discipline rule: when introducing a new
  audit action, choose shape based on taxonomy stability — dot-
  namespaced if anticipating ≥3 related actions under the same
  domain umbrella; underscored if standalone or part of a stable
  event family. Codification graduation: Phase 6 retrospective
  Commit B (insertion site: new section under `## Project
  conventions` standalone H2).

- **Zod strict-mode-for-our-shape vs passthrough-for-third-party
  convention (chunk-6.3a entry 19; N=2 evidence).** Zod schemas
  split on `.strict()` / `.passthrough()` based on substrate
  origin: our-shape schemas use `.strict()` (typically with
  `.refine()` sentinel-rejection layer for defense-in-depth); third-
  party-payload schemas use `.passthrough()` (forward-compat with
  provider API additions). N=2 evidence basis:
  `DragDropChannelMetadataSchema` `.strict()` + `.refine()` for
  sentinel rejection (our-shape; chunk 6.2b);
  `PostmarkInboundWebhookSchema` `.passthrough()` for forward-
  compat with Postmark API additions like `ReplyTo`,
  `MessageStream`, `OriginalRecipient` (third-party-payload; chunk
  6.3a). Codification graduation: Phase 6 retrospective Commit B
  (insertion site: new section under `## Project conventions`
  standalone H2).

### Memory-only-stays cluster — sub-threshold codification candidates

Eight sub-threshold codification candidates surfaced at chunk-6.3a
close and remain in friction-journal entries at N=1 evidence within
Phase 6. Each carries one instance of evidence within Phase 6
context; codification graduates at the second or third instance
across future phases.

- **Flag 19 terminology hygiene** (`document_case_sources` vs
  `source_document_links`). Tier-3 codification at chunk-6.3a F-J
  entry; not graduated at Phase 6 retrospective (terminology
  hygiene is a localized discipline; CLAUDE.md graduation requires
  recurring confusion in cross-phase doc-work). Future memory
  entries / brief drafts / retrospective text must state the
  distinction explicitly when referencing either table.

- **β-1 column name notational drift** (`channel` vs `ingest_channel`
  in chunk-6.3a brief example SQL). Single-finding-scale; in-line
  correction; tier-3 codification at chunk-6.3a F-J entry. Sibling
  to RI-5's notational-drift catch family (which graduated at
  Phase 4 chunk-3 N=4). Phase 6 instance is additional evidence
  for the same family; not graduated separately.

- **Cascade-closed sub-Q folding convention** (chunk-6.3a Sub-Q3
  closes via Sub-Q2 lock; cascade-closed sub-Qs fold into the
  closing sub-Q's resolution rather than empty placeholder
  sections). Tier-3 codification at chunk-6.3a F-J entry; pre-
  empts retrospective noise from "decisions that say we didn't
  need to decide." N=1 at chunk-6.3a; future chunks with cascade-
  closed sub-Q patterns produce N=2+.

- **Migration bundling threshold convention** (bundle migration
  statements when all statements ship at the same chunk AND are
  logically related). Tier-3 codification at chunk-6.3a F-J entry.
  N=1 firing at chunk-6.3a (migration 155 bundles idempotency
  index + allowlist table + seed); Phase 6 internal observation
  across migrations 152/153/154/155 doesn't graduate (within-arc
  evidence; future cross-phase bundling produces N=2+).

- **Limit-default-50 anchor** (cards endpoint recent-N path; v1-
  anchor-pending-operator-feedback). Tier-3 codification at chunk-
  6.3a F-J entry. N=1 firing; Phase 7+ revises if 50 cards is too
  few or too many.

- **Email_body filename composition convention**
  (`composeEmailBodyFilename()` shape:
  `${subject_truncated_100chars_sanitized}.eml` with
  `email-body-${message_id_short}.eml` empty-subject fallback).
  Tier-3 codification at chunk-6.3a F-J entry. N=1 firing; future
  channels with synthetic-filename needs inherit this shape.

- **ADR-0008 vs ADR-0010 layer-placement cross-reference clarity**
  (chunk-6.3a Sub-Q2/Sub-Q4 walks surfaced ambiguity on which ADR
  covers which layer-placement question). Lighter-touch
  clarification candidate; not full ADR amendment; tier-3
  codification at chunk-6.3a F-J entry. Carry-forward to §6.d.

- **Server-only-constraint operational scope refinement** (chunk-
  6.3a Sub-Q1 + Sub-Q10 consolidated; entries 9 + 20). Refined
  framing: "server-only" applies per-affordance / per-discovery-
  mechanism / per-existing-UI-consumer separately, not as a single
  monolithic constraint. Tier-2 retro candidate consolidated with
  RI-6 Grain 5 wording extension (which graduates at Commit B);
  the refinement carries through Grain 5 graduation rather than
  requiring its own CLAUDE.md surface.

### Carry-forward cluster — items not graduating at Phase 6 retrospective

- **Sub-Q4 4-step ADR-0010 amendment candidate.** Sub-Q4 split-
  across-chunks shape (constraint-activation chunks defer until
  consumer chunks ship; chunks 6.1 + 6.2a together complete the
  Sub-Q4 sequence) is a specialization of ADR-0010's
  substrate-now-enforcement-later cross-pattern applied at
  constraint-grain. The codification at chunk-6.2a F-J entry
  captures the pattern; whether ADR-0010 should be amended to
  explicitly name the constraint-grain specialization (vs leaving
  it as friction-journal codification + memory-only) is the
  carry-forward question. Next ADR-0010 amendment cycle adjudicates.
  Named-future-trigger: next constraint-activation chunk that fires
  the Sub-Q4-style sequence at cross-phase grain.

- **ADR-0008 vs ADR-0010 cross-reference clarity.** Phase 6
  retrospective inherits the chunk-6.3a tier-3 carry-forward
  (chunk-6.3a F-J entry 24). Lighter-touch clarification candidate
  — not full ADR amendment; would be a §13-cross-reference
  amendment at one or both ADRs. Named-future-trigger: next ADR
  amendment cycle that touches either ADR.

- **F-J location decision deferral.** Round 5 Adjudication 3 (α)
  lock at chunk-6.3b scope-lock kept the friction-journal monolithic
  (continues append at bottom of file). The deferred adjudication:
  whether to split friction-journal by phase / by year / by
  codification-grain. Held at deferral; carry-forward to Phase 7
  retrospective with friction-journal volume-growth observation.

- **Three-grain "land schema with consumer code" consolidation.**
  Flag 4 (table-grain + column-grain) + Flag 10 (constraint-grain)
  consolidate into three-grain framing per chunk-6.1 F-J entry.
  Did not graduate to CLAUDE.md at this retrospective (held below
  codification threshold; tracked separately from RI-6 fifth-grain
  graduation). Named-future-trigger: next chunk where the three-
  grain framing fires as decision substrate at brief-draft.

- **React component test infrastructure.** Chunk-6.2b Discovery 5
  surfaced vitest config has no React DOM environment +
  no jsdom / @testing-library/react in dependencies; UI unit tests
  skipped at chunk-6.2b. Coverage gap: drag-drop event handler
  state transitions in `DocumentIntakeRail` are NOT unit-tested.
  Phase 6 retrospective candidate: add React component test
  infrastructure if Phase 7+ surfaces additional component-level
  work. Named-future-trigger: first Phase 7+ chunk introducing new
  React components beyond the chunk-6.2b drag-drop UI surface.

- **Test-count-anchor methodology refinement.** Chunk-6.3a forecast
  15 new tests; actual 28 new (+11 over upper tolerance ±2).
  Within +28, β reconciliations contributed extra test surface
  (sister-type widening added no test surface but unit tests for
  `composeEmailBodyFilename` + Zod schemas naturally split into
  many edge cases vs forecast 2 each). Refinement candidate: test-
  count tolerance methodology for Phase 7+ test-count anchoring.
  Named-future-trigger: Phase 7 first test-count-anchored chunk.

- **LOC-forecast-methodology recalibration ratification.** Flag 16
  codification at chunk-6.2b close (97% above forecast); chunk
  6.3a actual 2597 LOC validates recalibrated 2000-3500 band (N=1
  validation instance). Codification candidate: revise per-chunk
  LOC forecast methodology to account for test-LOC at ~50-60
  LOC/test + file-top comment block density + impl-time-discovered
  substrate additions. Did not graduate at Phase 6 retrospective
  (single-arc N=1 validation; Phase 7+ produces N=2+ for
  formal codification). Named-future-trigger: Phase 7 first LOC-
  forecasted chunk; revisit at chunk-close for methodology
  ratification.

## 5. Inventory documentation

### Sub-Q8 walk classification table for chunk-6.3a friction-journal entries

The chunk-6.3a F-J shipped 22 entries at the chunk-6.3a-close commit
message claim; verify-from-disk at chunk-6.3b Round 2 corrected the
count to 26 entries (1.18x off; sub-grain #6 intra-commit-message-
entry-count grain catch documented at the verify-from-disk-at-non-
standard-grain codification at Commit B). The Sub-Q8 walk produced
the classification table below grouping entries into T-clusters per
codification graduation surface:

**T3-graduated entries (ADR-0011 fourth amendment).**

| Entry | Pattern | Graduation surface |
|---|---|---|
| Tier-2 entry 18 — Atomic-extension-via-JSONB-array channel-composition pattern | Single atomic RPC accepts variable-row-count extensions via JSONB array parameters; channel-specific row composition at the service layer | ADR-0011 §1 fourth amendment (Commit A `9ab5071`) |

**T4-graduated entries (CLAUDE.md 8 codifications).**

| Entry | Pattern | Insertion site |
|---|---|---|
| β-4 broadening-event-test-staleness N=3 | Substrate-mod-event test-staleness review | New sibling section under `## Verify-forward-at-scope-lock` cluster |
| Flag 20 + β-2 + β-3/MF-2 + Sub-Q10 (4-entry consolidation) | RI-6 Grain 1 reinforcement (cited substrate at scope-lock requires verify-from-disk at sub-grain) | Amendment to existing RI-6 Grain 1 subsection |
| Sub-Q10 UI-consumer-contract firing | RI-6 Grain 5 wording extension (substrate-shape + UI-consumer-contract sub-sub-grains) | Amendment to existing RI-6 Grain 5 subsection |
| Cross-session candidate (c) | Partial-information-recommendation-drift discipline (N=8 with two-shape sub-discipline) | New section under codify-while-deciding meta-discipline cluster |
| Cross-session candidate (f) | Verify-from-disk-at-non-standard-grain pattern (grain-agnostic + catch-direction-agnostic) | New sibling section under `## Verify-forward-at-scope-lock` cluster |
| First-instance precedents 1+3+4+5 | Webhook route handler conventions sub-cluster (4 sub-conventions) | New section under `## Project conventions` standalone H2 |
| Flag 18 seed-data-PII-shape placeholder | Seed-data PII-shape placeholder convention | New section under `## Project conventions` |
| Tier-2 audit-action naming convention split | Audit-action naming convention split (dot-namespaced vs underscored) | New section under `## Project conventions` |
| Tier-2 Zod strict-vs-passthrough | Zod strict-mode-for-our-shape vs passthrough-for-third-party convention | New section under `## Project conventions` |

**Memory-only-stays entries (sub-threshold; preserved in friction-
journal but not graduated).**

| Entry | Codification grain | Rationale for memory-only |
|---|---|---|
| Flag 19 terminology hygiene | Tier-3 at chunk-6.3a | Terminology hygiene is localized; recurring confusion threshold not reached |
| β-1 column name notational drift | Tier-3 at chunk-6.3a | RI-5 family already graduated at Phase 4 chunk-3 N=4; this is additional evidence not separate graduation |
| Cascade-closed sub-Q folding | Tier-3 at chunk-6.3a | N=1 firing; future cascade patterns produce N=2+ |
| Migration bundling threshold | Tier-3 at chunk-6.3a | N=1 within-arc; future cross-phase produces N=2+ |
| Limit-default-50 anchor | Tier-3 at chunk-6.3a | N=1 firing; Phase 7+ revises against operational signal |
| Email_body filename composition | Tier-3 at chunk-6.3a | N=1 firing; future synthetic-filename channels produce N=2+ |
| ADR-0008 vs ADR-0010 cross-reference clarity | Tier-3 at chunk-6.3a | Lighter-touch clarification candidate; carry-forward to §6.d |
| Consolidated entries 9+20 (server-only refinement) | Tier-2 at chunk-6.3a | Refinement carries through RI-6 Grain 5 graduation; doesn't require separate surface |
| View-grain vs row-grain operational distinguishability | Tier-3 at chunk-6.3a | N=1 at chunk-6.3a (drag-drop 1:1 + forwarded-mailbox 1:N+1); future channels produce N=2+ |

**T1-only entries (this retrospective writeup; not codified
elsewhere).**

| Entry | Captured at | Status |
|---|---|---|
| Chunk-6.1 5-framing RI-10 brief amendment cycle | §2 chunk 6.1 + §3.a primary arc | War-diary record; codifications already at CLAUDE.md from Phase 4 |
| Chunk-6.2a Path C N=2 graduation | §2 chunk 6.2a + §3.a primary arc | War-diary record; F-J-14 second-instance F-J entry already captures |
| Chunk-6.2a `_for_test` suffix convention | §2 chunk 6.2a | First-instance precedent; future N=2+ graduates |
| Chunk-6.2b Flag 16 LOC-forecast drift | §2 chunk 6.2b + §4 carry-forward | First-instance + N=1 validation at chunk-6.3a; future N=2+ graduates |
| Chunk-6.2b Discoveries 1-5 | §2 chunk 6.2b | War-diary record; Discovery 5 (React test infra) carry-forward to §6.d |
| Chunk-6.3a five first-instance precedents | §2 chunk 6.3a + §4 T4 cluster | Precedents 1+3+4+5 graduate at Commit B as webhook conventions sub-cluster; Precedent 2 (Postmark vendor lock-in) war-diary only |
| Chunk-6.3a Sub-Q1 / Sub-Q10 affordance-kind refinement | §2 chunk 6.3a + §4 T4 cluster | Carries through Grain 5 graduation |

### Sub-Q8 walk classification for cross-session consolidation candidates

The chunk-6.3b session-onset handoff prompt at `e0824c2` §4 pre-
classified 6 cross-session consolidation candidates (a)-(f). Round
3 walk outcomes (per chunk-6.3b scope-lock cycle):

| Candidate | Pattern | Classification |
|---|---|---|
| (a) Substrate-mod-event test-staleness review | T4 — N=3 graduation across Phase 2/Phase 4/Phase 6 evidence | Graduated at Commit B |
| (b) RI-6 Grain 1 reinforcement | T4 — chunk-6.3a 4-sub-instance evidence basis | Graduated at Commit B (combined with (d) per Round 5 Adjudication) |
| (c) Partial-information-recommendation-drift | T4 — N=8 graduation with two-shape sub-discipline | Graduated at Commit B |
| (d) RI-6 Grain 5 wording extension | T4 — chunk-6.3a Sub-Q10 fifth-grain extension | Graduated at Commit B (combined with (b)) |
| (e) Memory-only candidate (iii) observation-grain-vs-application-grain shape-refinement | Memory-only — Phase 4 graduation already; no new evidence | Stays at memory-only |
| (f) Verify-from-disk-at-non-standard-grain pattern | T4 — grain-agnostic parent codification with 8 sub-grains + catch-direction-agnostic discipline rule | Graduated at Commit B |

The classification table inverts the Phase 4 retrospective pattern
(where most candidates stayed memory-only and few graduated):
Phase 6 retrospective graduates 5 of 6 cross-session candidates to
T4 — reflecting the higher codification density at chunk-6.3a's 26-
entry F-J corpus plus the chunk-6.3a + 6.2b cross-phase pattern
coincidence (broadening-event-test-staleness N=3 fired AT chunk-6.3a
β-4 against Phase 2 + Phase 4 prior precedents).

## 6. Carry-forwards

The carry-forward inventory at Phase 6 retrospective close has 5
sub-sections per Round 7 Sub-op 6 lock: (6.a) inventory
documentation cross-reference; (6.b) cross-phase consumer
inventory; (6.c) named-future-feedback-loops; (6.d) carry-forwards
to Phase 7 retrospective; (6.e) deferred operational sequencing.

### 6.a Inventory documentation

The Sub-Q8 walk classification tables for chunk-6.3a F-J entries +
cross-session candidates ship at §5 above. This sub-section cross-
references §5 for the inventory documentation grain; §6.b through
§6.e carry the forward-pointer inventory specifically. The
classification distinction: §5 documents what's IN the chunk-6.3a
F-J corpus + cross-session candidates; §6 documents what FORWARD-
POINTS to future surfaces.

### 6.b Cross-phase consumer inventory

Three named-future-consumers inherit Phase 6 substrate and
discipline. Each consumer carries the two-inventory shape per
Phase 4 retrospective §6.b Round 7 Q3 refinement: activation-
trigger inventory + discipline-reference inventory. Both
inventories may be non-empty.

#### Phase 7 — Tier 2 pipeline (canonical next phase per Phase 5 retro §6:380-381 sequencing)

**Activation-trigger inventory:**

- `ingest_items` substrate activation per ADR-0011 §1 third
  amendment (chunk-6.1; deferred-to-Phase-7). The substrate
  becomes Tier-2 pipeline-internal grain — classifier output +
  extracted fields land at `ingest_items` rows associated with
  `document_jobs.ingest_item_id` post-classification.
- Phase 7 multi-file POST handler may extend chunk-6.2b
  `Request.formData()` first-instance precedent; api_ingest channel
  per Phase 7 substrate reads through the chunk-6.1 RPC body's
  channel-agnostic atomicity boundary.
- Cards-UI surface extends per Phase 7 classification + extraction
  visibility (the cards row currently shows `document_type='unknown'`
  pending classification; Phase 7 transitions to specific types).
- Idempotency design at chunk-6.3a partial UNIQUE index per
  `(org_id, message_id)` is a starting point for cross-channel
  idempotency at Phase 7 (api_ingest channel will produce a
  different idempotency key per channel).

**Discipline-reference inventory:**

- RI-1 (consumer-presence verification before substrate addition)
  applies at Phase 7's own substrate additions.
- RI-6 four-grain + Grain 5 (existing-consumer-contract conformance;
  with sub-sub-grain refinement at substrate-shape + UI-consumer-
  contract) applies at Phase 7 scope-lock for any constraint
  modifications or shared-entity-type changes.
- RI-7 (session-budget-feasibility verification at scope-lock;
  Path C invocation conditions; prospective-vs-reactive sub-
  discipline) applies at Phase 7 scope-lock. Flag 16 LOC-forecast-
  methodology recalibration carry-forward applies at Phase 7
  forecasted-LOC anchoring.
- RI-10 (brief amendment cycle threshold + framing-interaction
  matrix at N≥3; firing-at-consolidation-pressure refined framing
  per §3.b Observation 2) applies if Phase 7 implementation
  surfaces multi-finding-shape-changing framings.
- Substrate-mod-event test-staleness review (Phase 6 retrospective
  Commit B graduation) applies at any Phase 7 substrate-mod chunk.
- Verify-from-disk-at-non-standard-grain pattern (Phase 6
  retrospective Commit B graduation) applies at every Phase 7
  substrate-receipt grain.
- Webhook route handler conventions sub-cluster (Phase 6
  retrospective Commit B graduation) applies if Phase 7 introduces
  additional webhook providers.

#### Phase 5.1 amendments — both-shapes consumer (interleaves per operational priority per Phase 2 retro §6:588)

**Activation-trigger inventory:**

- Chunk-3-Phase-4 reserved T2 dispatcher slot activates at
  `paymentService.record()` post-commit dispatch hook (per Phase 4
  retrospective §6.b cross-phase consumer inventory; Phase 5.1
  amendments territory).
- INV-DOC-001 enforcement wiring per Phase 2 retrospective §6:588
  parallel-candidate framing.
- `vendor_credits` substrate ratification per Phase 5 retrospective
  §6 reserved-schema-seats framing (vendor onboarding +
  vendor_credits operational rollout remain post-v1 contingent on
  founder + two real users hitting operational need).
- `services/evidence/` substrate-allocation realization (chunk-3-
  Phase-4 carry-forward; the directory ships with `.gitkeep` at v1;
  first realization at Phase 5.1 reviewer-side surface design).

**Discipline-reference inventory:**

- RI-1 + RI-6 four-grain + Grain 5 + RI-7 + RI-10 + Substrate-mod-
  event test-staleness review + Verify-from-disk-at-non-standard-
  grain pattern all apply at Phase 5.1 amendments scope-lock.
- Webhook route handler conventions sub-cluster does not apply at
  Phase 5.1 amendments grain (no new webhook surfaces anticipated).

#### Post-Phase-6 drag-drop scope-lock cycle — pure discipline-reference consumer (scope-input artifact at `a9f1071`)

**Activation-trigger inventory:**

- Empty at scope-input grain. The drag-drop scope-input artifact at
  `a9f1071` is reference-only at chunk 6.3b; framing-adjudication-
  deferred to fresh post-chunk-6.3b session per scope-input
  artifact §5 partial-information warning. The scope-input artifact
  carries forward-pointer rather than activation surface.

**Discipline-reference inventory:**

- RI-6 four-grain + Grain 5 applies at the drag-drop scope-lock
  cycle scope-lock (the cycle itself is a new scope-lock event;
  the chunk it produces will fire its own RI codification firings).
- Partial-information-recommendation-drift discipline (Commit B
  graduation) applies particularly at the drag-drop scope-lock
  cycle — the scope-input artifact §5 warns about partial-
  information shape explicitly.

### 6.c Named-future-feedback-loops

Chunk-6.3b retrospective drafting is the first-instance evidence of
Phase 4 codifications operating at consumer-application time per
§3.a primary arc. Phase 7 + Phase 5.1 are the next-instance
candidates:

- **Phase 7 scope-lock fires RI-6 four-grain + Grain 5 at
  consumer-application time.** Evidence to track: does the four-
  grain + fifth-grain checklist surface computational-shape
  questions OR consumer-contract questions that scope-lock would
  otherwise miss? If yes, RI-6 + Grain 5 are operating as designed;
  if no, the grain refinement may need consumer-context tightening.
  Carries Phase 4 §6.c equivalent prediction forward at Phase 6
  N=2 consumer-application instance.

- **Phase 5.1 amendments scope-lock fires RI-1 + RI-7 + RI-10 at
  consumer-application time.** Evidence to track: does session-
  budget-feasibility verification at scope-lock catch any Phase
  5.1 amendment-scope volume-vs-budget arithmetic? Does Path C
  invocation fire (reactively or prospectively)? Phase 5.1 is
  smaller-scope than Phase 7; RI-7 firing density should be
  lower; RI-10 firing depends on amendment-discovery shape.

- **Phase 6 chunk-6.3b drafting itself fires RI-6 + RI-7 + RI-10
  at consumer-application time (recursive-level firing per §3.b
  Observation 1 sub-dimension 3).** Evidence to track via the
  runtime observations log: did the 7-round scope-lock cycle +
  3-commit drafting fire produce drift catches at consumer-
  application time? Yes (3 prospective drift catches at plan-
  author cluster-anchor grain during Commit B execution; recorded
  at §6.d candidate (c) N=8 update). RI-10 fired at Round 3 + 5
  consolidation; did not fire at Round 6 + 7 (negative-instance
  evidence per §3.b Observation 2).

### 6.d Carry-forwards to Phase 7 retrospective

The following items did not graduate at Phase 6 retrospective; each
is named with codification statement + named-future-trigger.

- **Candidate (c) partial-information-recommendation-drift N=8.**
  The candidate graduated at Commit B but the N=8 extension carries
  framing-development surface for Phase 7 retrospective. Round 7
  documented N=5 (1 disk-confirmed retrospective drift + 3
  brainstorming-session-internal retrospective drifts + 1
  prospective drift at chunk-6.3b handoff). Commit B + Commit C
  drafting added three new sub-instances at the drafting plan's
  cluster anchors: T4-1 plan cited "Verify-forward-at-scope-lock
  cluster" but actual parent on disk is `## Session execution
  conventions`; T4-2 part 2 Grain 5 plan said "Replace existing
  prose" but no Grain 5 subsection existed in CLAUDE.md (was a
  chunk-6.1 F-J codification candidate never promoted); T4-7 +
  T4-8 plan cited parent clusters ("audit emission conventions" +
  "Layer 2 boundary validation") that don't exist in CLAUDE.md;
  subagent created new `## Project conventions` H2 to host
  T4-5/6/7/8. The three new sub-instances raise the candidate from
  N=5 at Round 7 scope-lock to N=8 at Commit C drafting; the three
  are Cluster-B-equivalent pattern at plan-author cluster-anchor
  grain (drafting plan repeating the same pattern caught at chunk-
  6.3b handoff prompt drift; N=2 at Cluster-B grain). Named-future-
  trigger: next retrospective-drafting cycle's verify-from-disk at
  cited substrate.

- **Parallel arc body shape inheritance.** §3.b parallel arc body
  with three sub-property observations + explicit inheritance
  relationships is a shape-inheritance candidate for Phase 7
  retrospective's own meta-discipline observations. Inheritance
  relationships (Observation 1 primary; Observation 2 parallel
  meta-discipline; Observation 3 descendant of Observation 1)
  carry the structural property forward. Named-future-trigger:
  Phase 7 retrospective drafting if Phase 7 surfaces N=2+ evidence
  per parallel-arc observation.

- **Positive + negative evidence as combined N-count basis for
  discipline-shape codification.** §3.b Observation 2 codifies
  RI-10 firing-at-consolidation-pressure framing with N=3 positive
  + N=2 negative evidence. The methodology — using both positive
  and negative instances to characterize discipline-shape — is
  itself a meta-codification candidate at Tier-3. Named-future-
  trigger: Phase 7 retrospective drafting if discipline-shape
  characterization fires again with positive + negative split.

- **F-J location decision deferral.** Round 5 Adjudication 3 (α)
  lock kept the friction-journal monolithic. The deferred
  adjudication: whether to split friction-journal by phase / by
  year / by codification-grain when volume reaches operational
  threshold. Phase 6 close friction-journal sits at ~12500 lines;
  split-threshold operational signal not surfaced at Phase 6
  scope. Named-future-trigger: friction-journal volume growth
  reaching operational threshold (file-read responsiveness;
  navigation friction; cross-reference resolution cost).

- **Fast-forward vs `--no-ff` merge discipline.** Round 6 Op 2
  observation: cfcf2e7 (post-MVP-merge precedent) + 9f0ebb3 (prior
  staging-merge ceremony) both used `--no-ff` regular-merge with
  explicit commit message; chunk-6.3b inherits the discipline. The
  three-commit drafting fire (A + B + C) + merge ceremony at the
  end fires the same `--no-ff` shape. Named-future-trigger: Phase
  7 close merge ceremony — does the discipline still hold at
  larger-volume drafting fire?

- **Validation gate runtime stability with drafting-fire-logging
  pre-commitment.** Round 6 reserve catch: chunk-6.3b drafting
  fire produces N=2 runtime evidence basis (chunk-6.3a-close
  baseline N=1; Phase 6 retrospective Commit A + B + C runtimes
  + post-merge runtime = additional data points). Current log
  entries: Task 0 baseline pre-Task-1 typecheck 3.542s +
  agent:validate 7.672s + test 0.953s; pre-Task-1 governance
  commit `850b881` 3.361s + 7.096s + 0.840s; Task 1 Commit A
  `9ab5071` 3.290s + 6.772s + 0.892s; Task 2 Commit B `da5b666`
  2.923s + 6.137s + 0.853s. Commit C runtime appended after
  Task 3 Step 10. The log captures evidence basis for Phase 7
  retrospective validation-gate-runtime-stability codification
  candidate. Named-future-trigger: Phase 7 retrospective scoping —
  is the runtime stable across the chunk-6.3b → Phase 7 close
  window?

- **243-commit-forward-merge magnitude observation (first-instance
  at chunk-6.3b grain).** Round 6 Op 2 magnitude property: chunk-
  6.3b merge ceremony is the first merge-to-main since `cfcf2e7`
  (post-MVP era pre-Phase-4); 243 commits forward-merge. The
  magnitude is unprecedented in the project's git history. The
  observation: large-volume forward-merges at `--no-ff` shape
  with explicit commit message preserve the cross-phase chronology
  in the merge commit body. Named-future-trigger: next merge-to-
  main ceremony at Phase 7 close (or earlier if Phase 5.1
  amendments interleave); compare magnitude + ceremony shape.

- **Sub-Q4 4-step ADR-0010 amendment candidate.** Per §4 carry-
  forward cluster. Named-future-trigger: next constraint-activation
  chunk that fires Sub-Q4-style sequence at cross-phase grain;
  candidate consolidation at ADR-0010 amendment cycle.

- **ADR-0008 vs ADR-0010 cross-reference clarity.** Per §4 carry-
  forward cluster. Named-future-trigger: next ADR amendment cycle
  that touches either ADR.

- **Three-grain "land schema with consumer code" consolidation.**
  Per §4 carry-forward cluster. Named-future-trigger: next chunk
  where the three-grain framing fires as decision substrate at
  brief-draft.

- **React component test infrastructure.** Per §4 carry-forward
  cluster (chunk-6.2b Discovery 5 coverage gap). Named-future-
  trigger: first Phase 7+ chunk introducing new React components.

- **Test-count-anchor methodology refinement.** Per §4 carry-
  forward cluster (chunk-6.3a +11 over tolerance). Named-future-
  trigger: Phase 7 first test-count-anchored chunk.

- **LOC-forecast-methodology recalibration ratification.** Per §4
  carry-forward cluster (chunk-6.2b 97% + chunk-6.3a N=1
  validation). Named-future-trigger: Phase 7 first LOC-forecasted
  chunk; revisit at chunk-close for methodology ratification.

- **7-round retrospective-scope-lock-cycle round-count
  convergence.** Round 7 brainstorming-side terminal observation 2:
  Phase 6 retrospective scope-lock cycle closed at 7 rounds
  matching Phase 4 retrospective scope-lock cycle round count
  exactly (also 7 rounds); N=2 round-count convergence at
  retrospective-scope-lock-cycle grain anchors the 7-round
  expectation for Phase 7 retrospective volume forecasting.
  Named-future-trigger: Phase 7 retrospective scope-lock cycle —
  does the round-count converge at 7 again? If yes, N=3 graduates
  the convergence to operational anchor; if no, N=2 was
  coincidence and the methodology refines downward.

### 6.e Deferred operational sequencing

The operational sequencing of Phase 7 + Phase 5.1 amendments + post-
Phase-6 drag-drop scope-lock cycle is **adjudicated at fresh post-
chunk-6.3b session** per Round 7 Sub-op 2 lean. The candidates:

- **Phase 7 (Tier 2 pipeline) substantive scope-lock as canonical
  next phase.** Per Phase 5 retrospective §6:380-381 sequencing
  (`Phase 5 → Phase 2 → Phase 3 → Phase 4 → Phase 6 → Phase 7 →
  Phase 8`). Phase 7's scope is larger than Phase 6's (envelope
  substrate + classification + extraction + vendor-matching);
  forecasted-LOC anchoring requires Flag 16 recalibration carry-
  forward.

- **Phase 5.1 amendments interleave.** Per Phase 2 retrospective
  §6:588 parallel-candidate framing. Could ship before, alongside,
  or after Phase 7 per operational priority; INV-DOC-001 enforcement
  + paymentService introduction + vendor_credits substrate
  ratification are the three known surfaces.

- **Post-Phase-6 drag-drop scope-lock cycle.** Scope-input artifact
  at `a9f1071`; framing-adjudication-deferred per artifact §5
  partial-information warning. Fresh-session Round 1 adjudicates
  against the scope-input + operational priority.

The fresh-session adjudication considers founder priority signal +
chunk-6.3b retrospective close substrate + operational urgency.
This retrospective does not pre-lock the sequencing.

### Post-close additions — 2026-05-16 supersession + SharePoint amendment

Two governance amendments shipped post-Phase-6-close that
affect §6's carry-forward registry:

1. **a9f1071 supersession (commit 7265f4f).**
   The drag-drop scope-lock cycle anchored at a9f1071 has
   been superseded by the v2 scope-lock-input artifact at
   `docs/09_briefs/phase-6/2026-05-16-document-drop-and-shell-consolidation-scope-lock-input.md`
   per CTO sign-off on v3 proposal 2026-05-16. The carry-
   forward reference in §6 to the "post-Phase-6 drag-drop
   scope-lock cycle (scope-input artifact at a9f1071)" should
   be read as referring to the v2 scope-lock-input artifact
   post-supersession. a9f1071 preserved with supersession
   header per ADR-0022 §2 discipline.

2. **SharePoint continuity-of-business amendment (commit
   01a0fa6).** A four-artifact ADR-0013 §13 amendment
   shipped 2026-05-15 introducing the product-vs-vendor
   availability split + `org_settings.sharepoint_durability_mode`
   substrate reservation. Doc-only governance amendment (no
   code, no migration); substrate reservation rides with the
   deferred `org_settings` cross-cutting sub-arc per migration
   135 anti-scope notes. Named in this section for
   retrospective completeness as a post-Phase-6-close
   governance event; sequencing belongs to post-v1
   activation-brief territory per ADR-0013's 2026-05-15
   Amendment §Activation-brief consumer.

### Cross-references

- v2 scope-lock-input artifact: `docs/09_briefs/phase-6/2026-05-16-document-drop-and-shell-consolidation-scope-lock-input.md`
- v3 proposal: `docs/09_briefs/phase-6/2026-05-16-cto-proposal-v3-document-drop-shell-consolidation.md`
- Session A preserved-evidence: `docs/09_briefs/phase-6/2026-05-16-session-a-preserved-evidence.md`
- ADR-0013 2026-05-15 Amendment + Phase 4 retrospective post-close additions items 6/7/8 (SharePoint forward-pointers)

## 7. Surface-precedence note (T3 > T4 > T1)

When future readers encounter a discrepancy across Phase 6 artifacts
— say, a CLAUDE.md description that drifts from ADR-0011's fourth
amendment, or this retrospective summary that drifts from the
CLAUDE.md description — the surface-precedence ordering is
**T3 > T4 > T1**:

- **T3 (ADR-0011 fourth amendment at Commit A `9ab5071`) wins** for
  any contract / invariant / substrate question. ADRs are the
  architectural-decision tiebreaker per CLAUDE.md "When in doubt"
  leaf-discipline. The atomic-extension-via-JSONB-array channel-
  composition pattern + the service-layer-only channel addition
  discipline rule + the chunk-6.1 RPC body's canonical atomicity
  boundary statement are the canonical statement of v1 ingestion
  contract.

- **T4 (CLAUDE.md 8 codifications at Commit B `da5b666`) wins** for
  process / discipline / scope-lock questions. The CLAUDE.md
  additions are the standing-rules layer for future chunks of
  substrate-mod / scope-lock / verify-from-disk / webhook-route /
  PII-seed / audit-action / Zod-schema scope. Substrate-mod-event
  test-staleness review + RI-6 Grain 1 reinforcement + RI-6 Grain 5
  wording extension + Partial-information-recommendation-drift
  discipline + Verify-from-disk-at-non-standard-grain pattern +
  Webhook route handler conventions sub-cluster + Seed-data PII-
  shape placeholder convention + Audit-action naming convention
  split + Zod strict-vs-passthrough convention are the canonical
  statement of v1+ project conventions.

- **T1 (this retrospective writeup at Commit C) is the war-diary
  layer.** The evidence basis + the codification reasoning + the
  carry-forward inventory live here; if the retrospective drifts
  from T3 or T4, T3 or T4 win. The retrospective preserves
  provenance but doesn't itself carry the canonical contract or
  the standing rule.

This precedent-ordering is positioned at the end of §7 (here) so
future readers see it legibly. It is also positioned in CLAUDE.md
"When in doubt" canonical-source-wins discipline. The two positions
are consistent: this retrospective's §7 names T3 > T4 > T1
explicitly for the Phase 6 artifacts; CLAUDE.md "When in doubt"
gives the general project-wide rule that ADRs and canonical specs
win over standing rules and retrospectives. Both apply.

---

**Retrospective shipped at Phase 6 retrospective Commit C
(2026-05-16).** Cross-references: Phase 6 retrospective Commit A
(`9ab5071`, ADR-0011 fourth amendment); Phase 6 retrospective Commit
B (`da5b666`, CLAUDE.md 8 codifications); Phase 6 retrospective
Commit C (this commit, retrospective writeup +
retrospective-process meta-observations F-J entry); chunk 6.1
commit `2c85ee6`; chunk 6.2a commit `c6a7159`; chunk 6.2b commit
`5eb1fc5`; chunk 6.3a commit `c612720`. Phase 4 retrospective shape
precedent at commits `e9a3cd5` (A) + `fc36c6e` (B) + `294f9e7` (C).
The Phase 6 retrospective extends the Phase 4 retrospective shape
with the parallel-arc body (§3.b three sub-property observations
with explicit inheritance relationships) + the 5-sub-section §6
carry-forward structure; both extensions reflect Phase 6's
consumer-application-time evidence basis against Phase 4
codifications.
