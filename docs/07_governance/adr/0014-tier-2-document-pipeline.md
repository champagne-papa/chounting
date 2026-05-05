# ADR-0014: Tier 2 Document Pipeline — OCR Engine, Sidecar Topology, Classification, AI Fallback, Replay Policy, Dedup, Vendor Matcher, Orphan-Blob GC

## Status

Ratified 2026-05-03 by CTO with named follow-ups per D3
ratification package §5. Carry-forwards accepted on the recommended
path: Item 7 (length 2003 vs 1100–1400 calibration target) ratified
as-is — overage concentrated in load-bearing CTO-named inheritance
content; Item 8 (AI-fallback pipeline_trace parent/child ambiguity)
ratified as-is with sub-stage interpretation — AI fallback emits
a child sub-stage record under parent classify_document_type or
extract_fields (child names ai_fallback_classify or
ai_fallback_extract); Item 9 (C5a cleanup applied) ratified — 12
reserved org_settings.* columns reconciled with Closes Q73
canonical; Items 10-13 ratified as-is.

## Date

2026-05-03

## Triggered by

Phase 0 governance plan Task C5 (Tier 3 — depends on ADR-0011
ratification 2026-05-03 and ADR-0007 ratification 2026-05-03).
The 2026-05-02 Document Platform reframe spec
(`docs/09_briefs/phase-2/document_platform_reframe_design.md`)
named the Tier 2 Document Pipeline as the fourth ADR in the
eight-ADR Phase 0 set per §7. ADR-0011 ratified 2026-05-03 and
forward-pointed Q65 (per-document-type classifier confidence
thresholds), Q69 (replayability operational policy), Q70
(OCR-layer idempotency / dedup-by-hash), Q71 (document-type
classification strategy), Q72 (AI fallback contract), and the
OCR/retention/language portion of Q73 to this ADR per ADR-0011
§Forward-pointed and Cross-references entries. ADR-0013 (Storage
Provider) ratifies in parallel as a sibling Tier 3 ADR; this
ADR's pipeline reads bytes through `storageProviderService.fetch()`
per ADR-0013 item 1 and integrates with ADR-0013 item 5 (drift
detection), item 9 (integrity-check at write), and item 10
(source-of-truth discipline / dedup post-selection contract).

ADR-0014 carries one mechanism — the Tier 2 document pipeline —
and a small suite of specifications attached to that mechanism:
end-to-end pipeline architecture, OCR engine selection (v1
PaddleOCR), Python sidecar topology and language boundary (v1
Modal), model versioning and rollback, replay operational policy
(auto-supersede vs explicit promotion), dedup-by-hash idempotency,
document-type classification strategy (Tier A rule-based + Tier C
AI fallback active in v1; Tier B small classifier reserved
post-v1), AI fallback contract (input/output/validation/budget),
vendor-matcher pipeline integration with the ADR-0011 §11
read-boundary, orphan-blob garbage collection mechanism, pipeline
output → ProposedMutation/Bundle/Attachment routing, the
failure-classification matrix mirroring ADR-0013's storage-failure
classification, and Logic Receipt emission at proposal-creation
time per ADR-0007 Q30 + INV-AGENT-002.

## Context

### Why a Tier 2 Document Pipeline ADR exists

ADR-0011 §5 introduced the `document_artifacts` table as the
engine-agnostic interface that decouples OCR engine choice from
downstream consumers, and ADR-0011 §6 named the document-type
discriminator that downstream classification produces. Neither
specifies what the pipeline that fills those rows looks like —
which OCR engine runs, where the engine runs (TS process / Python
sidecar / external API), how the pipeline orchestrates its stages,
how AI fallback fits in, how replays handle prior artifacts, or
how dedup prevents duplicate processing. ADR-0011 forward-pointed
all of these to this ADR.

ADR-0007 (Three-Tier Agent Architecture) §Tier 2 establishes the
safety contract the pipeline runs under: stateless typed stages
chained by deterministic TypeScript orchestration, no direct
writes, structured Zod-validated handoffs, trace propagation,
re-verification at the commit boundary per the Q28 matrix in
`agent_architecture_policy.md`. ADR-0007 also fixed Q31 (no
LLM-planned orchestration) and Q30 (Logic Receipt
reproducibility — `pipeline_trace` field). ADR-0014 inherits both
verbatim.

This ADR codifies the Tier 2 contract for the document pipeline:
the stages, their inputs and outputs, the engine that powers OCR,
the platform that hosts the engine, the policy on replays, the
dedup logic, the classification strategy with AI fallback, the
vendor-matcher integration with the read boundary, the
orphan-blob GC carry-forward from ADR-0013, and the failure
classification mirroring ADR-0013's storage-failure matrix.

### Phase 0 dependency context and Reading B preservation

ADR-0014 sits in Tier 3 alongside ADR-0012 (ProposedMutationBundle)
and ADR-0013 (Storage Provider). All three depend on ADR-0011 (the
spine — entity ownership, `source_documents` schema, exception-
queue routing, audit-log writer boundary, lifecycle immutability,
vendor-matcher read boundary, document-type discriminator) and on
ADR-0007 (three-tier agent architecture) as a carried prerequisite.
ADR-0014 has direct integration with ADR-0013 (the pipeline calls
`storageProviderService.fetch()` for every OCR-input-bytes
operation); ADR-0014 and ADR-0012 are siblings under ADR-0011 and
do not inherit from each other, but ADR-0014's pipeline produces
ProposedMutationBundle objects when relationship-candidate output
requires atomic compound mutations (born-paid bundle is the v1
example), routing into ADR-0012's bundle envelope.

Per ADR-0011 §8 and ADR-0007 §Tier 2, the Document Platform
proposes; domain services produce ledger operations; the ledger
service is the sole writer of journal entries. The Tier 2 pipeline
runs entirely on the proposal side — every stage is a stateless
typed function `(typed_input) → typed_output`; no stage writes to
`journal_entries` or `journal_lines`; no stage calls a mutating
service entry point. The pipeline produces Zod-validated
proposals (`ProposedMutation`, `ProposedMutationBundle`,
`ProposedAttachment`) that the Tier 1 committing agent re-verifies
per the Q28 matrix in `agent_architecture_policy.md` before
commit. Reading B is preserved by construction.

### What ADR-0011 §5 already nailed down (do not redraft)

ADR-0011 §5 specified the `document_artifacts` engine-agnostic
contract. The columns (`engine`, `engine_version`, `pages`,
`lines`, `words`, `quality_flags`, `pipeline_trace`, `confidence`,
`ocr_run_id`, `extraction_run_id`, `source_document_id`,
`created_at`) are owned by ADR-0011 §5 and inherited verbatim
here. ADR-0014 does **not** add columns to `document_artifacts`,
`source_documents`, `source_document_versions`, `ocr_runs`, or
`extraction_runs` silently. If a future amendment of this ADR
proposes a new column, the schema-decision discipline (Notes for
future ADR writers) requires surfacing the addition as a D3
schema delta in the ratification package, not a silent
introduction. The pattern from ADR-0013's `original_storage_key`
(derivative inference surfaced explicitly at D3) is the precedent.

### What ADR-0013 already nailed down (do not redraft)

ADR-0013 specified the `storageProviderService` interface, the
provider-selection-at-write-time contract, the provider-resolution-
at-read-time contract, the failure-classification matrix
(transient retryable / provider-unavailable / permanent malformed),
the queue-and-retry parameters, the integrity-check policy at
write time, and the source-of-truth discipline (one provider per
document; dedup short-circuits the second-arriving channel's
storage write). ADR-0014 inherits the storage-fetch contract
verbatim. Every OCR stage that reads bytes calls
`storageProviderService.fetch(source_document_id, ctx)` (or
`fetchVersion` for explicit version reads); the pipeline does
not invent a parallel byte-fetch path. ADR-0013 item 5 specified
that drift detection is `supabase_storage`-exempt in v1
(impossible by construction); ADR-0014's replay policy interacts
with drift outcomes (when post-v1 reserved providers activate)
through the `source_document_versions` row's `current_version_id`
pointer per ADR-0011 §2.

## Decision

The Decision is presented as thirteen items, each of which is a
contract that downstream consumers cite. Items 1–3 establish the
pipeline architecture, OCR engine, and Python sidecar topology.
Item 4 covers model versioning and rollback. Items 5–7 cover the
operational policies (replay, dedup, classification strategy).
Item 8 covers AI fallback. Item 9 covers vendor-matcher integration.
Item 10 covers orphan-blob GC. Items 11–13 cover proposal routing,
failure classification, and Logic Receipt emission.

### 1. Pipeline architecture overview

End-to-end flow: bytes → OCR engine → `document_artifacts` row →
classifier → document-type discriminator → field-extractor (per
type) → ProposedMutation / ProposedMutationBundle / ProposedAttachment
proposal. Each stage is a stateless typed function per ADR-0007
Tier 2 safety contract. Orchestration is deterministic TypeScript
per ADR-0007 Q31 (LLM-planned orchestration is prohibited at
every tier; the orchestrator is a plain TypeScript function
calling stages in a fixed sequence). Inputs and outputs are
Zod-validated at every stage boundary per ADR-0007 § Tier 2
safety-contract item 2 (structured handoffs).

The illustrative orchestrator shape (consistent with ADR-0007's
`ingestDocument` shape):

```typescript
async function ingestDocument(orgId: string, sourceDocumentId: string, traceId: string) {
  // Stage 0: dedup-by-hash short-circuit (item 6) runs before any OCR.
  const dedup = await dedupByHash(orgId, sourceDocumentId, traceId);
  if (dedup.shortCircuited) return dedup.existingProposal;

  // Stage 1: byte fetch through storageProviderService per ADR-0013 item 1.
  const bytes = await storageProviderService.fetch(sourceDocumentId, ctx);

  // Stage 2: OCR via Python sidecar (item 2 / item 3).
  const ocrArtifact = await runOCR(bytes, traceId);

  // Stage 3: classification (item 7 — Tier A rule-based first; Tier C AI fallback).
  const classification = await classifyDocumentType(ocrArtifact, traceId);

  // Stage 4: field extraction (per document type).
  const extracted = await extractFields(classification.documentType, ocrArtifact, traceId);

  // Stage 5: vendor matcher (item 9) — reads vendor identity-and-matching fields ONLY.
  const vendorMatch = await matchVendor(orgId, extracted.vendor, traceId);

  // Stage 6: relationship candidate (match-against-existing-state subsystem only).
  const relCandidate = await matchAgainstExistingState(orgId, classification, extracted, vendorMatch, traceId);

  // Stage 7: proposal building (item 11 — routes to ProposedMutation, Bundle, or Attachment).
  return buildProposal({ classification, extracted, vendorMatch, relCandidate, traceId });
}
```

Each stage emits a `PipelineStageRecord` per ADR-0007 Q30:
`(stage_name, input_hash, output_hash, model, timestamp)`. The
records flow into `proposal.justification.pipeline_trace` (the
field ADR-0007 Q30 added to `ProposedMutation.justification`) so
the Logic Receipt produced at Tier 1 commit time (item 13) carries
the full per-stage trace. `trace_id` propagates through
`ServiceContext` per Service Communication Rule 5
(`docs/02_specs/ledger_truth_model.md`); the same `trace_id` flows
through to the Python sidecar (item 3) via the `X-Trace-Id` HTTP
header so cross-process tracing reconstructs as one trace.

The pipeline is **not** wrapped in `withInvariants()` — invariants
apply to ledger and domain mutations; the pipeline produces
proposals, not commits. Tier 1 (the committing agent) wraps the
commit step in `withInvariants()` and re-verifies the pipeline's
output per the Q28 matrix in `agent_architecture_policy.md` before
the commit lands.

### 2. OCR engine selection — v1 PaddleOCR (locked)

**v1 active OCR engine: PaddleOCR.** The `document_artifacts.engine`
column tags producing engine; v1 rows carry `engine = 'paddleocr'`
and `engine_version` populated with the deployed model version.
Replays under different engines produce new artifact rows per
ADR-0011 §9 immutability rules.

**Reserved engines per ADR-0010 reserved-enum-states discipline:**
`tesseract`, `claude_vision`, future engines named when their
activation briefs land. The full enum membership is enumerated at
v1 schema time per ADR-0010; v1 active value is `paddleocr`; the
remaining values are defined-but-not-emitted. Engine swap is a
routine activation per the engine-agnostic `document_artifacts`
contract (ADR-0011 §5) — switching engines requires a new
implementation behind the OCR stage's typed function signature
plus a deployment update; it does **not** require schema
migration.

**Rationale (PaddleOCR locked).** PaddleOCR's deterministic output
preserves Q30 Logic Receipt reproducibility — the byte-for-byte
reproducibility rule from `intent_model.md` §6 rule 4 ("Logic
Receipts are reproducible. Given the same rule version, input
features, and historical context at the time of the action, a
Logic Receipt can be re-computed byte-for-byte.") holds when the
OCR engine produces the same output for the same input bytes.
Claude Vision was considered and rejected as v1 default —
probabilistic vision-LLM output breaks byte-for-byte
reproducibility unless option (b) from
`agent_architecture_proposal.md` §2.3 is accepted (lose step-level
reproducibility), which `agent_architecture_proposal.md` §2.3 and
ADR-0007 Q30 explicitly rejected. Tesseract was considered and
rejected as v1 default — weaker French extraction relative to
PaddleOCR's bilingual capability, which matters for the v1
French-Canadian customer surface. Claude Vision and Tesseract
remain reserved for post-v1 swap-target activation when their
respective trade-offs become acceptable.

The detailed PaddleOCR rationale (deterministic output preserving
Q30 + bilingual French/English support) is preserved in Notes for
future ADR writers (item j) so a future engine-swap proposer can
weigh the trade-off without re-deriving it.

### 3. Python sidecar topology and language boundary — v1 Modal (locked)

**v1 deployment platform: Modal.** PaddleOCR is a Python library
with GPU-accelerated inference; it does not run as a TypeScript
in-process call. The pipeline's OCR stage is a separate Python
service — `document-pipeline-py` — deployed as a containerized
sidecar on Modal, exposed over HTTP. Modal manages container
lifecycle, GPU allocation, scaling, and logging; the platform
ships only the container image and the routing.

**Topology.** The TypeScript orchestrator (item 1) calls
`document-pipeline-py` over HTTP for the OCR stage. Communication
is request/response, not streaming — the orchestrator sends the
byte buffer (or a signed URL pointing to bytes the sidecar fetches
from `supabase_storage` directly), the sidecar runs PaddleOCR,
returns the structured output (`pages`, `lines`, `words`,
bounding boxes, confidence, `quality_flags`). The sidecar is
**stateless** — every request carries everything it needs; no
sidecar-side session state persists between requests; restarts
do not affect correctness.

**Language boundary discipline.** Cross-language schema is
TypeScript-as-source-of-truth: the input/output schemas are
defined in Zod on the TypeScript side, JSON Schema is generated
from Zod, and the Python sidecar consumes the JSON Schema via
Pydantic for its own input/output validation. The schema
synchronization is automated as part of the deploy pipeline so
TypeScript-side Zod changes never drift from Python-side Pydantic.
A schema mismatch surfaces at boundary validation time as a typed
`ServiceError` (`PIPELINE_SCHEMA_MISMATCH`); routes to the
exception queue per item 12.

**Authentication.** v1 uses shared-secret HMAC: every TS-to-sidecar
HTTP call carries an `X-Auth-HMAC` header signing the request
body with a shared secret rotated per the secret-management
policy in `docs/03_architecture/`. Production-hardened secret
rotation (key versioning, automatic rotation, multi-secret
overlap windows for zero-downtime rotation) is post-v1; v1 ships
manual rotation with a documented runbook.

**Trace propagation.** TS-side `trace_id` flows through the
`X-Trace-Id` HTTP header. The Python sidecar reads the header,
records the trace in structured logs (one log line per OCR
stage), and includes the `trace_id` in the response body for
defense in depth (so a logger that misses the inbound header
still associates the response). The pipeline_trace stage record
for the OCR stage references the same `trace_id` so cross-process
tracing reconstructs.

**Rationale (Modal locked).** Modal provides managed Python
deployment with GPU support, low ops burden, predictable cost,
and deployment-immutability that supports the rollback strategy
(item 4). Azure GPU VM was considered and rejected — more control,
more ops, sufficient managed surface available in Modal at v1's
"founder + 2 real users" scale. Self-hosted (own GPU box, own
Kubernetes) was considered and rejected — most control, most ops,
contradicts the v1 scale constraint and pulls infrastructure work
into the v1 critical path. Railway was considered and rejected —
cheaper but less GPU support, which matters for OCR throughput
at v1 latency targets. Modal is itself a swap-target post-v1
based on cost/ops experience; the sidecar architecture and the
schema-bound boundary make a deployment-platform swap a runbook
item, not an architecture change.

The detailed Modal rationale (managed Python with GPU, low ops,
predictable cost, deployment-immutability supports rollback,
alternatives considered) is preserved in Notes for future ADR
writers (item k).

### 4. Model versioning and rollback strategy

Every `document_artifacts` row carries `engine` and `engine_version`
columns per ADR-0011 §5. The `engine_version` value is a string
identifying the model + engine version (e.g., `paddleocr-2.7.0.3`,
incorporating the Modal-deployed image's PaddleOCR library version
and any model-weights revision identifier). Engine version changes
produce new artifact rows per ADR-0011 §9 immutability rules; old
artifacts are preserved.

**No silent column additions.** ADR-0014 does **not** introduce
new columns to `document_artifacts`, `source_documents`,
`source_document_versions`, `ocr_runs`, or `extraction_runs`
silently. The schema-decision discipline (Notes item e) requires
that any column the pipeline implementation wants to add — for
example, a per-artifact `model_weights_hash`, a per-artifact
`engine_config_id`, or a per-extraction-run `prompt_version` —
surfaces as a D3 schema delta in this ADR's ratification package,
not as a silent introduction. If the implementation surfaces a
genuine need for a new column at code-time, the discipline routes
the addition through an ADR amendment, not through silent schema
drift. The `engine_version` column already enumerated by ADR-0011
§5 is sufficient for the v1 PaddleOCR ship.

**Rollback strategy.** Rollback is a deployment-layer operation,
not a database operation. Two image versions are maintained on
Modal at any time: `current` (the version actively serving) and
`previous-stable` (the prior version retained for rapid
rollback). When a regression surfaces — degraded OCR quality on
a new model, latency spike, sidecar-crash signal — the operator
flips the routing to `previous-stable` via Modal's deployment
controls. The flip is fast (no rebuild), bounded (the
`previous-stable` window is two release cycles), and audited
(Modal logs the deployment switch).

The artifacts produced by the regressed version remain in the
database (immutability per ADR-0011 §9). Replays under the rolled-
back version produce new artifact rows per item 5; the regressed-
version artifacts are not deleted, but they may be auto-superseded
or controller-promoted as the replay policy dictates. Rollback
does **not** mutate the immutable artifact rows; it only changes
which engine version produces new artifacts going forward.

**Schema impact: zero.** A Modal-side rollback produces no
schema change. The next OCR call simply tags new artifacts with
the rolled-back `engine_version` value. The artifact-immutability
contract holds across rollback events.

### 5. Replay operational policy (Q69)

When the OCR engine improves or a model version ships, existing
`source_documents` may benefit from re-extraction. ADR-0011 §9
established the immutability contract: replays produce new
`ocr_runs` / `extraction_runs` rows that supersede prior rows via
dedicated supersession columns (`supersedes_ocr_run_id` for
`ocr_runs`; the `(source_document_id, ocr_run_id, extraction_version)`
tuple for `extraction_runs`). ADR-0014 owns the operational policy
for **when** replays auto-supersede vs **when** they require
explicit promotion. The split is structural: post-commit consumed
artifacts require human-reviewed promotion; pre-commit unconsumed
artifacts may auto-supersede when the replay output is structurally
similar.

#### 5.1 Auto-supersede path

A replay auto-supersedes the prior artifact when **both**
conditions hold:

1. **Structural similarity.** The replay's output classifies to
   the same `document_type`, the field-extraction shape matches
   the prior shape (same field names; values within tolerance per
   the field-by-field rules below), and the classification
   confidence falls within tolerance of the prior confidence (no
   confidence-band crossings between auto-acceptable and
   exception-routed).
2. **Prior artifact has not been consumed.** No committed
   `source_document_links` row references the prior artifact's
   `source_document_id` AND no `source_document.current_version_id`
   modification consumed the prior artifact for a still-pending
   case in `proposed` or later state.

**Field-tolerance shape.** For numeric fields (`amount`, `tax_amount`,
`subtotal`), tolerance is the rounding-tolerance value (zero in v1
— exact-match required; post-v1 calibration may relax this when
the calibration governance ratifies in ADR-0019). For string fields
(`vendor_invoice_number`, `merchant_text`), tolerance is exact
match. For date fields (`accounting_date`, `due_date`), tolerance
is exact match (the `date` itself, not a normalized comparison).
For confidence-band crossings: a prior confidence of 0.92 and a
new confidence of 0.78 crosses the receipt-band threshold (0.80
per item 7's locked Q65 values) and triggers explicit promotion
even if other fields match.

**Auto-supersede behavior.** A new `ocr_runs` row lands with
`supersedes_ocr_run_id` populated; a new `extraction_runs` row
lands per the `(source_document_id, ocr_run_id, extraction_version)`
tuple; `document_artifacts.current_relationship_candidate_id` (the
case-level pointer per ADR-0011 §9 rule 4) updates if the case is
pre-commit. Audit event: `extraction_replay_auto_superseded` with
fields `(source_document_id, prior_artifact_id, new_artifact_id,
prior_engine_version, new_engine_version, trace_id)`. The audit
event flows through the canonical audit-log writer per ADR-0011
§1.

#### 5.2 Explicit promotion path

A replay requires explicit promotion when **either** condition
holds:

1. **Structural difference.** Replay output classifies to a
   different `document_type` than the prior artifact, or
   field-extraction shape changed in a way tolerance cannot
   absorb, or classification confidence crossed a band (e.g.,
   from auto-acceptable into exception-routed).
2. **Prior artifact has been consumed.** A committed
   `source_document_links` row references the prior artifact, or
   the prior artifact is part of a pending-case-in-progress that
   the platform should not silently re-route.

**Explicit promotion behavior.** A new `ocr_runs` and
`extraction_runs` row pair lands as in the auto-supersede path,
but `document_artifacts.current_relationship_candidate_id` is
NOT updated automatically. The replay surfaces in the exception
queue as a `extraction_replay_pending_promotion` typed exception
per ADR-0011 §13; the controller reviews the prior and new
artifacts side-by-side (using `storageProviderService.previewUrl`
per ADR-0013 item 12 to render the original bytes) and approves
or rejects the promotion. Approval triggers the supersession with
an explicit `controller_approved_at` field on the new artifact's
audit event; rejection rolls back the new artifact's
candidate-pointer connection (the artifact rows themselves remain
per immutability rules, marked as `link_status =
'replay_rejected'` in the audit metadata). Audit event:
`extraction_replay_pending_promotion` (initial); resolution events
on approval / rejection are `extraction_replay_promoted` /
`extraction_replay_rejected` with `controller_user_id` and
`resolution_reason` fields.

#### 5.3 Replay trigger and cadence

Engine-version changes trigger replays for documents whose current
artifact was produced by an older engine version. The replay
scheduler runs at system-fixed cadence (post-v1 schedulable; v1
is **manual or controller-triggered** — per ADR-0013 item 5's
parallel constraint that v1 ships no scheduled-job stack). A
controller can trigger a replay for a single document, a filtered
set of documents (by engine version, by document type, by date
range), or all documents whose current artifact predates a named
engine version.

Per-org replay cadence configurability is post-v1 per Q73's OCR
portion narrow closure (item 5.4 below). The schedule itself is
system-fixed in v1; controller manual triggers are the only v1
replay entry point.

#### 5.4 `source_document_versions` replay behavior

When `source_document_versions.current_version_id` changes (vendor
re-uploads a corrected invoice; drift detection captures a new
version per ADR-0013 item 6), the platform's pipeline runs
extraction against the new version automatically. The old version's
artifact rows remain (immutability); the new version's artifact
rows land via the standard ingestion path, not via the replay
path; `current_version_id` change is the trigger, not engine-
version change. The auto-supersede vs explicit-promotion split
from items 5.1 / 5.2 applies: if the new version's extraction
output is structurally similar AND the prior version's artifact
has not been consumed, auto-supersede; otherwise, explicit
promotion. The schema ownership for `source_document_versions`
stays with ADR-0011 §2 / §9; ADR-0014 specifies what the pipeline
does when a version-capture-driven replay produces a new artifact
vs an artifact-row supersession. The audit-event vocabulary is
consistent with item 5.1 / 5.2 (the `replay_*` events fire with
a `trigger = version_capture` discriminator distinguishing them
from engine-version-driven replays).

### 6. Dedup-by-hash idempotency (Q70)

Before writing a new `source_document` row, the ingestion path
computes SHA-256 of the bytes and checks for an existing
`source_documents.original_content_hash` match within the same
`org_id` (ADR-0011 §2 specified the hash as the immutable evidence
anchor; this item specifies the dedup logic that consumes it).
The check fires at the OCR-pipeline ingest stage and short-circuits
the second-arriving channel's full pipeline run.

**Match-found behavior.**

1. **Skip OCR sidecar entirely.** No new `ocr_runs` or
   `extraction_runs` rows produced; the existing artifact rows
   are reused for the duplicate-arrival proposal pipeline. The
   pipeline orchestrator records a `pipeline_trace` stage with
   `stage_name = 'dedup_short_circuit'`, `input_hash = <SHA-256>`,
   `output_hash = <SHA-256>`, `model = null`, `timestamp =
   <now>`. The reuse preserves the byte-for-byte reproducibility
   contract — the dedup-driven proposal references the exact
   prior artifact, not a re-extraction.

2. **Same hash from different ingestion channel still
   short-circuits OCR.** The platform records duplicate-arrival
   metadata (the second-arriving channel's metadata, arrival
   timestamp, user-or-agent who triggered) for audit purposes,
   even though the `source_documents` row itself is not duplicated
   per ADR-0013 item 10's source-of-truth discipline (one
   `source_documents` row per logical document; second-arrival
   bytes discarded after dedup match). **v1 active behavior:** the
   second-arrival metadata is captured on the audit event but
   not stored as a separate row. **Post-v1 reserved:** capture as
   a `link_role = 'duplicate_arrival'` row on
   `source_document_links` per the link-role enum (full enum
   membership owned by ADR-0016) — the seat is reserved at v1
   schema time per ADR-0010 discipline; the v1 active subset of
   `link_role` does not include `duplicate_arrival` so no v1
   service write path emits the value.

3. **Audit trail.** Every dedup short-circuit emits an
   `ingestion_dedup_hit` audit event through the canonical
   audit-log writer per ADR-0011 §1, with fields
   `(org_id, original_source_document_id, duplicate_attempt_channel,
   duplicate_attempt_user_or_agent, duplicate_attempt_timestamp,
   trace_id)`. The audit event lives on the document layer (the
   second-arrival ingestion did not produce a `source_documents`
   row to audit, but the dedup decision itself is auditable
   activity).

**Match-not-found behavior.** Standard ingestion proceeds: the new
`source_documents` row inserts (per ADR-0013 item 1's transactional
discipline — storage put succeeds first, then the row INSERT runs
in the document-platform service's transaction; orphan-blob
cleanup is item 10 below); the OCR sidecar runs; the artifact rows
land; the proposal pipeline produces a `ProposedMutation`,
`ProposedMutationBundle`, or `ProposedAttachment` per item 11.

**Per-org configurability.** Dedup behavior is system-fixed in v1
— every ingestion runs the dedup check against the org-scoped
hash index. Per-org configurability (e.g., disabling dedup for an
org that legitimately re-uploads identical bytes through different
channels) is reserved post-v1 per Q73's OCR portion. The reserved
column (`org_settings.dedup_policy`) ships at v1 schema time per
ADR-0010 discipline with NOT NULL DEFAULT to the v1-fixed
behavior.

### 7. Document-type classification strategy (Q71)

A tiered classification strategy. Each tier's output is a
`(document_type, confidence, rationale)` tuple. The pipeline's
classifier stage runs the tiers in fixed order; each tier may
produce a confident answer that short-circuits subsequent tiers,
or hand off to the next tier on low confidence.

**Tier A — Rule-based classifier (active v1).** Heuristics on
`document_artifacts` content: presence of "Invoice" / "Bill" /
"Statement" / "Receipt" headers; payment-confirmation language
patterns ("payment received", "thank you for your payment");
receipt-shape patterns (terminal-style line layout, total at
bottom, payment-method line); filename heuristics (filename
contains "invoice", "receipt", "statement"). **High precision,
low recall** — when Tier A matches, the confidence is high; when
it doesn't, the document falls to subsequent tiers.

**Tier B — Small classifier (reserved post-v1).** Trained small
classifier (fastText or small transformer) over OCR'd text.
**Higher recall, moderate precision.** Trained on a labeled
corpus that v1 generates: every controller-resolved exception in
the queue (per ADR-0011 §13) produces a labeled example;
controller-confirmed Tier 1 commits also produce labeled examples.
The corpus is small initially but grows as v1 operates. Tier B is
post-v1 because the corpus does not exist at v1 ship time; it
ships when corpus size crosses a threshold the calibration
governance (ADR-0019) ratifies.

**Tier C — Claude Sonnet AI fallback (active v1).** When Tier A
doesn't match (no rule-based pattern fires), the pipeline calls
Claude Sonnet with the OCR'd text and a system prompt naming the
document-type enum and the field-extraction targets (per item 8's
contract). Output is Zod-validated; non-validating output rejects
the fallback and routes to exception with `unknown` type.

**Tier D — Unknown (active v1).** When all preceding tiers fail
to produce a confident answer (Tier A no match; Tier C output
non-validating or below confidence threshold; Tier B not yet
active in v1), the document classifies as `unknown` per ADR-0011
§6 v1 active set; routes to the exception queue per ADR-0011 §13.

**v1 ships Tier A + Tier C + Tier D.** Tier B is post-v1.
Fallback ordering is system-fixed in v1: Tier A first, Tier C if
Tier A no match, Tier D if both fail. Per-org configurability of
fallback ordering (e.g., an org that wants Tier C-only or Tier
A-only) is reserved post-v1 per Q73's OCR portion. The reserved
column (`org_settings.classification_fallback_order`) ships at v1
schema time per ADR-0010 discipline.

**Per-document-type confidence threshold values (Q65 — provisional v1 values).**

| Document type | Confidence threshold (v1 provisional) | Below-threshold path |
|---|---|---|
| `vendor_invoice` | 0.85 | Exception queue (`needs_review`) |
| `receipt` | 0.80 | Exception queue (`needs_review`) |
| `payment_confirmation` | 0.85 | Exception queue (`needs_review`) |
| `unknown` | N/A | Always exception queue |

**Provisional framing.** The values above are **provisional in
v1** per the Q77 v1-ship-gate pattern. ADR-0014 ships the values;
pipelines code against them; ADR-0019 (Confidence Calibration
Policy) ratifies them at v1 ship; if ratification adjusts values,
ADR-0014 amends to match. The same provisional-pending-v1-ship
pattern as Q77 + Q28 matrix: drafted now, ratified at ship.
Calibration governance for ongoing post-ratification adjustment
is forward-pointed to ADR-0019.

**Closure-venue rationale (for future ADR writers).** Q65's
per-type confidence threshold values close in this ADR (ADR-0014)
because the threshold values are an operational property of the
classifier — the values are what the pipeline codes against.
Q57 (calibration governance) closes in ADR-0019 because the
governance question is who calibrates, against what test set, how
often — a separate concern from the values themselves. ADR-0014's
provisional values + ADR-0019's calibration governance together
resolve Q65 + Q57; each ADR closes its own piece. The provisional
framing means an ADR-0019 ratification that adjusts values will
trigger an ADR-0014 amendment to match — a routine maintenance
step, not a re-litigation. The rationale for the provisional
framing is preserved in Notes for future ADR writers (item l).

### 8. AI fallback contract (Q72)

The Tier C AI fallback (item 7) calls Claude Sonnet to classify
documents that Tier A doesn't match. The fallback contract is
fully specified here so the Tier 2 safety contract holds at the
AI boundary.

**Input.** The fallback receives:

1. The `document_artifacts.lines` content — text extraction
   with bounding boxes — for the document.
2. The `document_artifacts.pages` structure — page-level layout.
3. A system prompt naming the document-type enum (the v1 active
   set: `vendor_invoice`, `receipt`, `payment_confirmation`,
   `unknown`) and the field-extraction targets per the v1 active
   types' field schemas.

**Critical discipline: NEVER pass raw image bytes.** The LLM
consumes OCR'd text only, preserving the engine-agnostic boundary
established by ADR-0011 §5. Raw image bytes routed to a
vision-LLM bypass the `document_artifacts` contract — the produced
output is no longer reproducible from `document_artifacts`
content, which breaks the byte-for-byte Logic Receipt
reproducibility rule (`intent_model.md` §6 rule 4). A future
contributor who proposes adding raw-image input to the AI fallback
is proposing a Q30 violation; the rule is preserved in Notes for
future ADR writers (item c).

**Output.** Zod-validated JSON object. Two output shapes are
supported:

1. **Classification-only:** `{document_type, confidence,
   rationale}` — used when Tier A produced no match and Tier C
   classifies but field extraction will run as a separate
   subsequent stage.
2. **Field-extraction:** `{document_type, fields: {...},
   confidence, rationale}` — used when the fallback produces
   classification + extraction in a single call (the typical
   path for v1 efficiency).

The `fields` object's shape is per-document-type and matches the
field-extraction schemas per the document-type-aware field rows
in `agent_architecture_policy.md` §2.1.

**Validation gate.** AI output enters the proposal pipeline only
after Zod validation. Non-validating output emits an
`ai_fallback_validation_failed` audit event through the canonical
audit-log writer per ADR-0011 §1 and routes the document to the
exception queue with `document_type = 'unknown'`. AI confidence
below the threshold for the proposed `document_type` (per item
7's locked Q65 provisional values) routes to the exception queue
even if Zod validates — confidence is a separate gate from
schema validity. The Zod-validation step is the structural
defense; the confidence-threshold step is the semantic defense;
both must pass for the AI output to enter the proposal pipeline.

**Re-verification cost budget.** Maximum **2 fallback calls per
source document** in v1 — one for classification and one for
field extraction (the typical path). Exceeding the budget — for
example, a third call to retry on validation failure or to
re-extract from a revised prompt — is rejected by the orchestrator
and routes the document to the exception queue. Per-org
configurability of the budget (e.g., an org that wants to allow
3 calls for higher accuracy at higher cost) is reserved post-v1
per Q73's OCR portion. The reserved column
(`org_settings.ai_fallback_budget`) ships at v1 schema time per
ADR-0010 discipline with NOT NULL DEFAULT to the v1-fixed value
(2).

**Q28 surface 1 integration.** AI-fallback-extracted fields flow
into proposals; the v1 contract is that **every AI-fallback-
extracted field flows through human confirmation on the
ProposedEntryCard** — the strictest Surface 1 re-verification
shape (same as the `amount` field in the framework matrix per
ADR-0007 § Closes Q28). The Tier 1 committing agent re-fetches
or re-validates each AI-fallback field per the per-document-type
rows in `agent_architecture_policy.md` §2.1. Per-AI-fallback-field
calibrated re-verification — for example, allowing `vendor_id`
matches above some confidence to skip human confirmation — is
reserved for Q28 matrix extension at v1 ship per Q77; no v1 path
relaxes the human-confirmation gate.

**Trace propagation.** Every fallback call carries the
`trace_id` through the Anthropic SDK request metadata. The
fallback's request and response payloads are NOT logged into
`pipeline_trace.input_hash` / `output_hash` directly (the prompts
themselves may contain extracted PII); instead, the
`pipeline_trace` records `(stage_name = 'ai_fallback_classify' |
'ai_fallback_extract', input_hash = SHA-256 of OCR text + system
prompt version, output_hash = SHA-256 of validated JSON output,
model = 'claude-sonnet-<version>', timestamp = <now>)`. The Logic
Receipt reproduces from the recorded hashes per ADR-0007 Q30; the
prompt-version is the rotating discriminator that the calibration
governance (ADR-0019) controls.

### 9. Vendor-matcher pipeline integration (ADR-0011 §11 inheritance)

The pipeline includes a vendor-matcher stage that resolves
extracted vendor-name / email / tax-ID to a `vendors.id`. The
matcher inherits the ADR-0007 / ADR-0011 §11 three-category split
verbatim:

> Tier 2 MAY read **reference / master data**: vendor
> identity-and-matching fields (name, aliases, tax ID,
> email/domain, address, default account mapping, historical
> template association), chart of accounts, tax codes, classes /
> projects / departments. These are the lookups vendor matching
> and account suggestion need; they are reference, not state.
>
> Tier 2 MUST NOT read **transactional committed state**: bills,
> payments, prepayments, credits, open balances, period status,
> reconciliation candidates — those reads require Tier 2.5.
>
> Tier 2 also MUST NOT read **vendor control / payment-risk
> fields** (bank account, payment instructions,
> bank-detail-confirmed flag, payment hold status,
> blocked-vendor status) — those are Tier 2.5 territory because
> they are payment-readiness state, and any extractor that reads
> them risks overstepping into payment-risk logic.
>
> Tier 1 re-verifies all vendor-control fields at commit.

**The matcher reads vendor identity-and-matching fields ONLY.**
Specifically, the matcher MAY read: name, aliases, tax ID,
email/domain, address, default account mapping, historical
template association, chart of accounts, tax codes, classes /
projects / departments. The matcher MUST NOT read transactional
state (bills, payments, prepayments, balances, period status)
and MUST NOT read vendor control / payment-risk fields (bank
account, payment instructions, bank-detail-confirmed flag,
payment hold, blocked-vendor status). The latter restriction is
the bank-detail fraud-control surface; the System-ceiling rule
for vendor bank-detail changes (INV-AGENT-006 /
`agent_autonomy_model.md` §6 row 7) governs vendor bank-detail
commits. Tier 1
re-verifies all vendor-control fields at commit per the System-
ceiling discipline; ADR-0014's matcher does not touch those
fields at the Tier 2 stage at all.

**Mechanical enforcement (Q29 ESLint rule).** ADR-0007 § Closes
Q29 selected an ESLint rule that prevents files under
`src/agent/pipelines/**/*` from importing mutating service entry
points; the same rule extends naturally to detect imports of
vendor-control field accessors from the matcher's source files.
The concrete lint rule design — the file-pattern filter, the
import-restriction list, the test fixtures, the failure-message
text — lives in `agent_architecture_policy.md` per ADR-0007 Q29
closure (separate near-term task). ADR-0014 cites the rule's
existence and the matcher's compliance; ADR-0014 does **not**
draft the lint specification. The rationale is preserved in
Notes for future ADR writers (item g).

**Matcher output.** The matcher produces a typed
`VendorMatchResult` Zod-validated object: `{vendor_id: string |
null, confidence: number, match_type: 'exact_name' | 'alias' |
'tax_id' | 'email' | 'domain' | 'fuzzy_name' | 'no_match',
candidate_alternatives: VendorCandidate[]}`. The `vendor_id` is
null when the matcher cannot resolve to a single vendor with
confidence above threshold; null routes the document to the
exception queue with `route_to_manual_entry` resolution per
ADR-0011 §13. The `candidate_alternatives` field surfaces in the
exception queue UI for controller selection. Per-org
configurability of the vendor-match threshold is reserved post-v1
per Q73's OCR portion. The reserved column
(`org_settings.vendor_match_threshold`) ships at v1 schema time
per ADR-0010 reserved-enum-states discipline with NOT NULL
DEFAULT to the v1-fixed value (`0.80`).

### 10. Orphan-blob garbage collection mechanism (CTO carry-forward from ADR-0013 item 1)

ADR-0013 item 1 specifies that storage put succeeds before the
`source_documents` INSERT runs in the document-platform service's
transaction; if the INSERT fails (RLS denial, FK miss, schema
mismatch, deferred-constraint trigger), the bytes already written
to the storage provider remain as orphan bytes. ADR-0013
acknowledged the orphan-blob risk and forward-pointed the GC
mechanism to ADR-0014. ADR-0014 owns the GC mechanism.

**v1 implementation.** A system-fixed scheduled job runs daily,
enumerates `supabase_storage` blobs without a corresponding
`source_documents` row (or whose row's INSERT pre-dates the
orphan window by more than the GC threshold), and deletes the
orphan blobs. The enumeration is a join between the storage-
provider blob index and the `source_documents` table on
`(storage_provider, storage_key)`; blobs without matching rows
that are older than the threshold are deleted.

**v1 cadence: daily.** Aligns with the post-v1 drift-detection
default cadence per ADR-0013 item 5 — the platform has a single
daily-cadence batch operation rather than multiple competing
batch windows.

**v1 GC threshold: 24 hours.** A blob's storage-provider creation
timestamp must be older than 24 hours before GC considers it for
deletion. The 24-hour buffer prevents the GC from racing against
in-flight ingestion transactions that may not have committed
their `source_documents` INSERT yet (a transaction that holds a
storage put for an extended period of time before its INSERT
lands). 24 hours is generous; the actual ingestion path's
`storageProviderService.put()` + `source_documents` INSERT
window is sub-second, so 24 hours is two orders of magnitude
more conservative than required.

**Audit event.** Every orphan-blob deletion emits an
`orphan_blob_collected` audit event through the canonical audit-
log writer per ADR-0011 §1, with fields `(storage_provider,
original_storage_key, byte_size, blob_created_at, gc_run_at,
trace_id)`. The audit event preserves enough metadata for forensic
reconstruction (the original storage key, the blob size, the
creation timestamp).

**Provider applicability.** v1 GC runs for `supabase_storage`
only — the only v1 active provider. Reserved providers
(`sharepoint_drive`, `s3_bucket`, `external_url`) ship their own
GC implementation in their respective activation briefs. Each
reserved provider's GC may differ — SharePoint uses Graph API
deletion; S3 uses bucket lifecycle rules in conjunction with the
service-level enumeration; external_URL has no platform-side
GC because the bytes live at the source. The activation briefs
own the per-provider implementation; ADR-0014 owns the v1
`supabase_storage` mechanism.

**Per-org configurability.** GC cadence and threshold are
system-fixed in v1. Per-org configurability is reserved post-v1
per Q73's OCR portion. The reserved columns
(`org_settings.gc_cadence`, `org_settings.gc_threshold_hours`)
ship at v1 schema time per ADR-0010 discipline with NOT NULL
DEFAULT to the v1-fixed values.

The orphan-blob GC ownership rationale (carry-forward from
ADR-0013 item 1's transactional-rollback note) is preserved in
Notes for future ADR writers (item d).

### 11. Pipeline output → ProposedMutation/Bundle/Attachment routing

The pipeline's terminal stage (per item 1's `buildProposal` step)
produces one of three proposal shapes per ADR-0011 §7 and the
Four Questions grammar from `intent_model.md` §5. The shape is
selected by the match-against-existing-state subsystem (per
reframe spec §8 — ADR-0014 owns this subsystem only;
ambiguity-resolution and re-evaluation logic are owned by
ADR-0018).

**ProposedMutation** — single ledger-touching operation. v1
examples: `record_bill_payment` (for receipt-as-payment-trigger
Scenario B per spec §15), `post_bill` (for vendor invoice with
no immediate payment).

**ProposedMutationBundle** — compound mutation per ADR-0012. v1
active bundle: `born_paid_bill` (`post_bill` +
`record_bill_payment` children). The match-against-existing-state
subsystem produces a bundle when the document evidence supports
a born-paid pattern (a receipt with both invoice and
payment-confirmation language; a vendor invoice with attached
payment receipt). The bundle's atomicity, lifecycle, and Logic
Receipt are owned by ADR-0012; ADR-0014 produces the bundle and
hands it to the bundle service for commit. Bundle classification
into the v1 active type vs reserved types (`final_invoice_with_applied_deposit`,
`vendor_credit_applied_to_bill` — both reserved per ADR-0012 §12
and ADR-0015) is per the bundle-type discriminator.

**ProposedAttachment** — non-ledger commit per ADR-0011 §7. v1
variants:

- `attach_payment_evidence` — Scenario A per spec §15 (receipt is
  supporting evidence for an already-recorded payment).
- `attach_invoice_to_existing_bill` — invoice arrives after a
  manual bill was created without evidence.
- `attach_supporting_document_to_bill` — secondary documents
  (correspondence, contracts, delivery notes).
- `attach_statement_to_vendor_reconciliation` — vendor statement
  attached to a vendor reconciliation flow.
- `attach_retainer_agreement_to_prepayment` — retainer agreement
  evidence for an existing `vendor_prepayment` row.

**Match-against-existing-state subsystem (ADR-0014 scope).** The
subsystem consumes the document-type + extracted fields and
produces a `DocumentRelationshipCandidate` driving proposal-shape
selection. The subsystem reads vendor master per item 9, reads
chart of accounts and tax codes per ADR-0011 §11 reference-data
allowance, and **does not** read transactional state — that's
Tier 2.5's territory. When the subsystem's output requires reading
committed accounting state (open bills, vendor balances), the
relationship candidate is an **incomplete candidate** that flows
into the Relationship Router (ADR-0018, Tier 2.5) for completion;
ADR-0014's subsystem produces the structural classification
(document type + extracted fields + vendor match) that the Router
consumes.

**Ambiguity resolution and re-evaluation are NOT in this ADR.**
The Relationship Router's three-subsystem decomposition (per
reframe spec §8) splits into match-against-existing-state (owned
by ADR-0014, this item), ambiguity resolution (owned by
ADR-0018), and re-evaluation logic (owned by ADR-0018). ADR-0014
owns the first subsystem only.

**Approval policy inheritance.** v1 ProposedAttachment approval
policy per ADR-0011 §7: Always Confirm, except the user-initiated
direct-upload variant (a user dragging a file into a specific
bill's attach slot is implicitly approving the attachment).
ProposedMutation and ProposedMutationBundle approval is always
Tier 1 commit-time confirmation per ADR-0007 (auto-post deferred
post-v1 per spec §11).

### 12. Failure-classification matrix (mirrors ADR-0013's shape)

Pipeline failures fall into the same three categories as
ADR-0013's storage-failure classification matrix (item 7 of
ADR-0013). Conflating the categories is a known drift mode
(treating an AI-API-rate-limit-exhausted error as a permanent
failure produces unnecessary exception-queue routing; treating a
classifier-model-unavailable error as transient produces useless
retries that mask a real configuration problem). The three-way
split is the load-bearing discipline; failure modes in distributed
pipelines are isomorphic.

#### 12.1 Transient retryable

Sidecar timeout (Modal cold-start exceeded budget); AI API rate
limit with `Retry-After` header; classifier service brief
unavailability; per-stage transient errors that the same operation
retried with exponential backoff is expected to succeed within.
Retry per ADR-0013 item 8 parameters: max 3 attempts, base 500ms,
exponential factor 2x, ±20% jitter, total budget ~3.5s wall-clock.
The retry budget is per-stage (not per-pipeline); a pipeline run
that retries OCR three times then needs to retry classification
budgets independently.

After max retries the operation surfaces typed `ServiceError` with
code `PIPELINE_TRANSIENT_EXHAUSTED`; the document routes to the
exception queue with a typed `pipeline_transient_failure` exception
(the resolution-action is `reprocess` per ADR-0011 §13 active
v1 set — the controller can manually trigger another pipeline run
when conditions change).

#### 12.2 Persistent / unavailable

AI API auth failure, sidecar service down, classifier model
unavailable (per-deployment regression), missing required
configuration (Modal endpoint not configured, HMAC secret missing),
schema mismatch between TS Zod and Python Pydantic. **No retry**;
retry on these failures wastes time and masks the underlying
configuration issue. Route to exception queue immediately with a
typed `pipeline_unavailable` exception.

**Resolution action: `resolve_pipeline_unavailable` (reserved per
ADR-0010 — added to exception-queue resolution-action enum
reserved set; ADR-0011 §13 owns the enum membership).** The action
is reserved at v1 schema time per ADR-0010 discipline; v1 active
exception-queue resolution actions (per ADR-0011 §13's narrow v1
subset) do not include `resolve_pipeline_unavailable`, so v1
controller resolution paths route through `route_to_manual_entry`
(an active v1 value) until the configuration issue resolves and
the document can be re-pipelined via `reprocess`. The reserved
action lights up post-v1 when the controller-administered
configuration UI ships.

#### 12.3 Permanent / malformed

Document corrupted (PDF cannot be parsed; image bytes invalid);
OCR produces empty output (no text extracted; document is blank
or image is below resolution threshold); AI fallback validation
fails (AI output non-validating per item 8); classifier produces
a confidence below the threshold for every candidate document
type (per item 7's locked Q65 provisional values). **No retry**
— the operation is broken in a way retry cannot fix; the document
needs human attention.

Route to the exception queue with a typed `extraction_failed`
exception. **Active v1 resolution actions per ADR-0011 §13:**
`route_to_manual_entry` (the operator manually creates a bill or
records a payment via the AP/Spend domain service form);
`mark_non_accounting` (the document is not accounting-relevant
— spam, marketing, irrelevant correspondence); `archive` (the
document is a duplicate or an old version; resolved without
manual entry). The three-way active v1 set lets the controller
handle the most common permanent-failure resolution paths without
exposing the reserved actions that activate post-v1.

#### 12.4 Failure-classification audit events

Each failure category emits an audit event through the canonical
audit-log writer per ADR-0011 §1:

- **Transient.** `pipeline_transient_retry` (per attempt) +
  `pipeline_transient_exhausted` (after max retries) with
  `(source_document_id, stage_name, retry_attempts, elapsed_ms,
  trace_id)`.
- **Persistent.** `pipeline_unavailable` with
  `(source_document_id, stage_name, error_code, error_message,
  trace_id)`. The error message is a typed enum value, not a
  free-form string, per Service Communication Rule 4 (no
  free-form data at the boundary).
- **Permanent.** `extraction_failed` with `(source_document_id,
  stage_name, failure_reason, trace_id)`. The
  `failure_reason` is a typed enum value with members
  `document_corrupted`, `ocr_empty_output`,
  `ai_fallback_validation_failed`, `confidence_below_threshold`.

Each event preserves enough metadata for forensic reconstruction
of the failure path and routes the document to the exception
queue with the appropriate typed exception per ADR-0011 §13.

### 13. Logic Receipt at proposal-creation time

Per INV-AGENT-002 and ADR-0007 § Closes Q30, the pipeline emits a
Logic Receipt at proposal creation time. Receipt content:

- **`rule_id`** — when a rule matched (Tier A rule-based
  classifier produced a confident answer; vendor matcher produced
  an exact-match), the receipt carries the rule's identifier;
  when no rule matched and the proposal is novel (Tier C AI
  fallback or a fuzzy vendor match), the receipt carries
  `'novel_pattern'` per `intent_model.md` §3 field-level rules.
- **`input_features`** — extracted fields from
  `document_artifacts` projected onto the proposal's domain shape
  (e.g., for a `record_bill_payment` proposal: `(vendor_id,
  amount, currency, payment_method, payment_date, last_4)`).
- **`historical_match_count`** — vendor-matcher-stage output:
  the number of historically-confirmed matches against the same
  vendor + same document type. Drives the "Track record" portion
  of the Four Questions per `intent_model.md` §5.
- **`confidence_score`** — internal-only per `intent_model.md`
  §3 field-level rules (`justification.confidence_score` is never
  surfaced to the user; the Logic Receipt records it for audit
  reproducibility, not display).
- **`source_transactions`** — empty for ingestion-driven proposals
  (the proposal originates from a document, not from prior
  transactions); populated for re-evaluation-driven proposals
  (the Tier 2.5 Router's re-evaluation triggered when new domain
  state lands; ADR-0018 owns the re-evaluation-driven path,
  ADR-0014 owns ingestion-driven).
- **`user_utterance`** — empty for agent-initiated proposals;
  populated for direct-upload proposals when the user typed a
  message alongside the upload (chat-with-attachment).
- **`pipeline_trace: PipelineStageRecord[]`** — the per-stage
  trace records per ADR-0007 Q30: `(stage_name, input_hash,
  output_hash, model, timestamp)` per stage (dedup_short_circuit,
  byte_fetch, run_ocr, classify_document_type, extract_fields,
  match_vendor, match_against_existing_state, build_proposal).
  Each stage's records flow through the orchestrator into the
  receipt at the proposal-creation step.

**Audit-log writer boundary.** The Logic Receipt is written
through the canonical audit-log writer per ADR-0011 §1 (the same
writer used for ledger and document-layer audit events). No
service inserts into `audit_log` directly. The receipt's
write-path is the same INV-AUDIT-002 (audit-log append-only)
boundary as ledger audit events; the receipt's content shape
follows INV-AGENT-002 (every auto-post produces a Logic Receipt)
plus INV-AGENT-002's pipeline-aware extension per ADR-0007 Q30.

**Bundle-level emission per ADR-0012.** When the pipeline
produces a `ProposedMutationBundle`, the Logic Receipt is bundle-
level (one INV-AGENT-002 event for the bundle with nested
per-child traces) per ADR-0012 § Logic Receipt for bundles. The
preferred shape is one bundle-level event with nested children
arrays; the fallback (per-child events linked by `bundle_id` plus
a bundle-summary event) is acceptable when the existing audit-log
shape forces it. ADR-0014 produces the bundle; the receipt's
emission shape is owned by ADR-0012.

## Consequences

### What this enables

- **The first Tier 2 system ships with a fully-specified pipeline
  contract.** OCR engine selection, sidecar deployment, replay
  policy, dedup, classification strategy, AI fallback, vendor
  matcher, orphan-blob GC — every operational concern attached
  to the pipeline lives here, in one ADR. Future Tier 2 systems
  (audit scans, report commentary, tax research) inherit the
  same Q31-deterministic-orchestration + Q30-pipeline-trace +
  ADR-0011-vendor-matcher discipline without re-deriving the
  contract.
- **OCR engine choice is a swap-target behind the
  `document_artifacts` contract.** When PaddleOCR ships an
  improved version, when a Tesseract regression is patched, when
  Claude Vision becomes byte-for-byte reproducible (option (a)
  per `agent_architecture_proposal.md` §2.3), the swap is a
  Modal deployment update plus an artifact-row engine-version
  rollover; no schema migration, no data-model change, no
  downstream consumer rewrite. The engine-agnostic contract from
  ADR-0011 §5 pays back here.
- **Replay operational policy splits cleanly.** Pre-commit
  unconsumed artifacts auto-supersede on structural similarity;
  post-commit consumed artifacts require explicit controller
  promotion. The split honors ADR-0011 §9's immutability
  contract (no in-place mutation; supersession via dedicated
  columns) while keeping the controller's reviewing burden
  proportional to the risk (only consumed artifacts require
  human review on replay).
- **Dedup-by-hash short-circuits duplicate processing without
  losing audit trail.** The same logical document arriving via
  multiple channels processes once at the OCR layer and routes
  the second-arriving metadata to the audit log; storage layer
  receives one set of bytes (per ADR-0013 item 10's source-of-
  truth discipline); the platform doesn't run OCR or AI fallback
  twice for the same input.
- **AI fallback ships with a Zod-validated boundary.** Every AI
  output passes structural validation before entering the
  proposal pipeline; non-validating output routes to the
  exception queue with `unknown` type. The validation gate is
  the load-bearing semantic-telephone defense for the AI
  fallback path, paired with the human-confirmation gate at
  Tier 1 commit time per the Q28 matrix.
- **Vendor-matcher integration mechanically respects the
  three-category read boundary.** ADR-0007 § Closes Q29 ESLint
  rule extends to detect vendor-control-field imports from the
  matcher's source files; the rule prevents a future contributor
  from quietly extending the matcher to read bank-detail fields
  for a "smarter" match decision. The bank-detail fraud-control
  surface is preserved by mechanical enforcement, not by
  convention.
- **Orphan-blob GC closes the transactional-rollback orphan
  risk.** ADR-0013 acknowledged the risk; ADR-0014 owns the
  cleanup. v1 daily cadence + 24-hour threshold is generous
  relative to the actual ingestion-window length, making race
  conditions essentially impossible.
- **Failure-classification matrix mirrors ADR-0013's storage
  matrix.** Three categories — transient retryable, persistent
  unavailable, permanent malformed — with the same retry / no-
  retry routing, the same exception-queue resolution actions
  (active v1 + reserved post-v1), the same audit-event
  vocabulary. Future contributors reading the pipeline's failure
  modes find the same shape they read in the storage layer; no
  per-system improvisation.

### What this constrains

- **Engine swap requires a schema-immutable contract surface.**
  No future ADR-0014 amendment may change the `document_artifacts`
  column set (that's owned by ADR-0011 §5); engine swaps are
  routine activations behind the column-shape contract. A future
  contributor proposing an engine-specific column on
  `document_artifacts` is proposing an ADR-0011 amendment, not an
  ADR-0014 operational change.
- **Tier 2 safety contract is non-negotiable.** A future
  contributor who proposes a vision-LLM that consumes raw image
  bytes for classification is proposing a Q30 violation (the
  byte-for-byte reproducibility rule from `intent_model.md` §6
  rule 4 breaks). The mitigation pattern (option (b) — accept
  step-level reproducibility loss) was rejected by ADR-0007
  Q30 closure; reopening that rejection requires an ADR-0007
  amendment.
- **Replay auto-supersede vs explicit-promotion split is
  mechanical.** A future contributor who proposes auto-superseding
  consumed artifacts to "make replays smoother" is proposing a
  silent mutation of the audit trail downstream of a controller-
  approved commit; the consumed-artifact case requires explicit
  promotion specifically because the controller's prior decision
  is the load-bearing record.
- **AI fallback budget is system-fixed in v1.** A future
  contributor who proposes increasing the budget per-document
  for "better accuracy" is increasing v1's cost surface beyond
  the founder + 2 real users scale; per-org configurability is
  the post-v1 path, not a v1 amendment.
- **Vendor-matcher read boundary is mechanical, not
  conventional.** A future contributor who needs to read a
  vendor's `payment_hold` flag for a "smarter" match decision is
  proposing a Tier 2.5 stage, not an ADR-0014 matcher extension.
  The Q29 lint rule mechanically prevents the violation.
- **Orphan-blob GC runs daily, not on-demand.** A future
  contributor who proposes synchronous orphan deletion at
  ingestion-failure time is fusing the failure path with the
  cleanup path — the failure path is the right place to surface
  the failure to the user; the cleanup path runs on its own
  cadence to avoid coupling.
- **Failure-classification matrix categories are exclusive.** A
  fourth category (transient + retried-then-categorized-as-
  permanent? "soft-permanent"? "transient-with-warning"?) is
  rejected; the three-way split is the minimum expressive matrix
  that distinguishes "retry helps" from "retry hurts" from
  "operation broken."

### What this costs

- **Schema scope.** ADR-0014 introduces no new columns to
  platform-owned tables (`source_documents`, `source_document_versions`,
  `document_artifacts`, `ocr_runs`, `extraction_runs`); the
  schema-decision discipline (Notes item e) requires any addition
  to surface as a D3 schema delta, not a silent introduction.
  Per-org configurability columns reserved at v1 schema time per
  ADR-0010 discipline; full list per the Closes Q73 closure scope
  above.
- **Implementation surface.** The pipeline ships in Phase 7
  (Extraction) with the full stage set: byte fetch (calls
  ADR-0013's `storageProviderService.fetch()`), OCR via Modal
  Python sidecar, classification (Tier A + Tier C), field
  extraction, vendor matcher, match-against-existing-state, AI
  fallback (Anthropic SDK call with prompt caching), proposal
  builder. The Modal-side Python service (`document-pipeline-py`)
  ships with the same release cadence as the TS-side
  orchestrator; deployment is the joint deploy of both. The
  rollback strategy depends on Modal's two-version deployment
  model (item 4); a deployment cadence that doesn't preserve
  `previous-stable` for at least two cycles loses the rollback
  capability.
- **AI fallback cost surface.** Two Claude Sonnet calls per
  document worst case (classification + extraction); the
  budget enforcement (item 8) caps the cost per document but the
  org-wide cost scales with document volume. Per-org budget
  configurability is post-v1; v1 ships at the system-fixed cost
  envelope.
- **Audit-log volume.** Every pipeline run emits per-stage
  `pipeline_trace` records into the proposal's Logic Receipt;
  every dedup short-circuit emits an `ingestion_dedup_hit`
  event; every failure emits a typed exception event; every
  replay emits a supersession event; every orphan-blob GC run
  emits per-blob events. Audit-log volume is bounded by document
  volume, but each document produces multiple events; capacity
  planning must account for the per-document event count.
- **Test surface.** Integration tests cover: dedup-before-
  ingestion ordering; OCR sidecar transient retry (max-attempts,
  jitter); AI fallback Zod validation (validating + non-validating
  outputs); per-document-type confidence threshold routing
  (above-threshold → proposal, below-threshold → exception);
  vendor-matcher read-boundary compliance (the Q29 lint rule's
  test fixtures); replay auto-supersede vs explicit-promotion
  paths; orphan-blob GC dry-run + delete; failure-classification
  matrix per category. Drift-detection-driven replay tests ship
  as reserved (skip-on-v1 markers; activate when reserved
  providers ship).
- **Cross-language schema maintenance.** Zod-on-TS as
  source-of-truth requires automated JSON Schema generation +
  Pydantic regeneration on every Zod change. The CI gate that
  catches drift is itself a maintained surface; a missed gate
  produces production-time `PIPELINE_SCHEMA_MISMATCH` errors.

## Closes

This ADR closes the following Tier 2 Document Pipeline scope
questions from `docs/02_specs/open_questions.md`:

- **Q65 — Per-document-type classifier confidence thresholds**
  (per-type values portion only; **provisional in v1** per the
  locked-decisions framing). Closed per item 7 above. Provisional
  values: `vendor_invoice` 0.85, `receipt` 0.80,
  `payment_confirmation` 0.85, `unknown` always exception.
  Calibration governance for ongoing post-ratification adjustment
  is forward-pointed to ADR-0019.

  *Closure-venue rationale (for future ADR writers):* Q65's
  per-type values close in this ADR (ADR-0014) because the values
  are an operational property of the classifier — the values are
  what the pipeline codes against. Q57 (calibration governance)
  closes in ADR-0019. The provisional v1 ratification pattern is
  the same as Q77 + Q28 matrix: drafted now, ratified at v1 ship.
  ADR-0019's ratification at v1 ship triggers an ADR-0014
  amendment if values adjust.

- **Q69 — Replayability operational policy.** Closed per item 5.
  Auto-supersede when replay output is structurally similar AND
  prior artifact has not been consumed; explicit promotion when
  output is structurally different OR prior artifact has been
  consumed by a committed link or pending-case. Replay trigger:
  engine-version changes (or `current_version_id` updates per
  item 5.4); v1 cadence is manual or controller-triggered; per-
  org cadence configurability is post-v1 per Q73's OCR portion.

- **Q70 — OCR-layer idempotency (dedup-by-hash).** Closed per
  item 6. SHA-256 hash check against `source_documents.original_content_hash`
  within `org_id` scope before any new `source_documents` row
  inserts; match short-circuits OCR sidecar entirely; reuses
  existing artifact rows for the duplicate-arrival proposal
  pipeline; second-arrival metadata captured on
  `ingestion_dedup_hit` audit event in v1 (`link_role =
  'duplicate_arrival'` row reserved post-v1 per ADR-0016).

- **Q71 — Document-type classification strategy.** Closed per
  item 7. v1 ships Tier A (rule-based) + Tier C (Claude Sonnet
  AI fallback) + Tier D (unknown). Tier B (small classifier) is
  reserved post-v1 — requires labeled corpus that v1 generates.
  Fallback ordering is system-fixed in v1; per-org configurability
  is reserved post-v1 per Q73's OCR portion.

- **Q72 — AI fallback contract.** Closed per item 8. Input:
  `document_artifacts.lines` + `pages` + system prompt naming
  enum and field-extraction targets. Critical discipline: NEVER
  pass raw image bytes (preserves engine-agnostic boundary +
  Q30 byte-for-byte reproducibility). Output: Zod-validated
  JSON, two shapes (classification-only or field-extraction).
  Validation gate before pipeline entry. Re-verification cost
  budget: max 2 calls per document in v1. Q28 surface 1
  integration: every AI-fallback-extracted field flows through
  human confirmation on the ProposedEntryCard.

- **Q73 — Per-org Document Platform configuration (OCR /
  retention / language portions only).** Closed per items 2, 5,
  6, 7, 8, 9, 10 above. Closure scope (canonical authoritative
  enumeration of reserved `org_settings.*` columns ADR-0014
  introduces; the Consequences §"What this costs" and
  Cross-references §ADR-0010 entry cite this list rather than
  re-enumerating):
  - **`org_settings.ocr_engine`** — per-org OCR engine choice
    (item 2); **v1-fixed default**: `'paddleocr'`. Per ADR-0010
    reserved-enum-states discipline, the column ships at v1
    schema time as NOT NULL with the v1-fixed default; per-org
    configurability switches on post-v1 by allowing the column
    value to vary per org.
  - **`org_settings.replay_cadence`** — per-org replay cadence
    when scheduled-job replay activates (item 5.3); **v1-fixed
    default**: `'manual'` (controller-triggered only; no
    scheduled job in v1). Per ADR-0010 reserved-enum-states
    discipline, the column ships at v1 schema time as NOT NULL
    with the v1-fixed default; per-org configurability switches
    on post-v1 by allowing the column value to vary per org.
  - **`org_settings.dedup_policy`** — per-org dedup-by-hash
    behavior (item 6); **v1-fixed default**: system-fixed (every
    ingestion runs the org-scoped hash check). Per ADR-0010
    reserved-enum-states discipline, the column ships at v1
    schema time as NOT NULL with the v1-fixed default; per-org
    configurability switches on post-v1 by allowing the column
    value to vary per org.
  - **`org_settings.classification_fallback_order`** — per-org
    classification tier ordering (item 7); **v1-fixed default**:
    system-fixed Tier A + Tier C + Tier D. Per ADR-0010
    reserved-enum-states discipline, the column ships at v1
    schema time as NOT NULL with the v1-fixed default; per-org
    configurability switches on post-v1 by allowing the column
    value to vary per org.
  - **`org_settings.ai_fallback_budget`** — per-org cap on AI
    fallback calls per source document (item 8); **v1-fixed
    default**: `2`. Per ADR-0010 reserved-enum-states discipline,
    the column ships at v1 schema time as NOT NULL with the
    v1-fixed default; per-org configurability switches on post-v1
    by allowing the column value to vary per org.
  - **`org_settings.vendor_match_threshold`** — per-org
    vendor-matcher confidence threshold (item 9); **v1-fixed
    default**: `0.80`. Per ADR-0010 reserved-enum-states
    discipline, the column ships at v1 schema time as NOT NULL
    with the v1-fixed default; per-org configurability switches
    on post-v1 by allowing the column value to vary per org.
  - **`org_settings.gc_cadence`** — per-org orphan-blob GC
    cadence (item 10); **v1-fixed default**: `'daily'`. Per
    ADR-0010 reserved-enum-states discipline, the column ships
    at v1 schema time as NOT NULL with the v1-fixed default;
    per-org configurability switches on post-v1 by allowing the
    column value to vary per org.
  - **`org_settings.gc_threshold_hours`** — per-org orphan-blob
    GC age threshold in hours (item 10); **v1-fixed default**:
    `24`. Per ADR-0010 reserved-enum-states discipline, the
    column ships at v1 schema time as NOT NULL with the v1-fixed
    default; per-org configurability switches on post-v1 by
    allowing the column value to vary per org.
  - **`org_settings.retention_source_documents`** — per-org
    retention policy for `source_documents` rows; **v1-fixed
    default**: `'indefinite'` (no automated deletion in v1). Per
    ADR-0010 reserved-enum-states discipline, the column ships
    at v1 schema time as NOT NULL with the v1-fixed default;
    per-org configurability switches on post-v1 by allowing the
    column value to vary per org.
  - **`org_settings.retention_artifacts`** — per-org retention
    policy for `document_artifacts` rows; **v1-fixed default**:
    `'indefinite'` (no automated deletion in v1). Per ADR-0010
    reserved-enum-states discipline, the column ships at v1
    schema time as NOT NULL with the v1-fixed default; per-org
    configurability switches on post-v1 by allowing the column
    value to vary per org.
  - **`org_settings.retention_runs`** — per-org retention policy
    for `ocr_runs` and `extraction_runs` rows; **v1-fixed
    default**: `'indefinite'` (no automated deletion in v1). Per
    ADR-0010 reserved-enum-states discipline, the column ships
    at v1 schema time as NOT NULL with the v1-fixed default;
    per-org configurability switches on post-v1 by allowing the
    column value to vary per org.
  - **`org_settings.language_packs`** — per-org PaddleOCR
    language-pack selection; **v1-fixed default**: `'en,fr'`
    (English + French). Per ADR-0010 reserved-enum-states
    discipline, the column ships at v1 schema time as NOT NULL
    with the v1-fixed default; per-org configurability switches
    on post-v1 by allowing the column value to vary per org.

  These reserved columns ship at v1 schema time per ADR-0010
  reserved-enum-states discipline; per-org configurability
  switches on post-v1. Consequences §"What this costs" and
  Cross-references §ADR-0010 cite this list rather than
  re-enumerating.

  *Closure-venue rationale (for future ADR writers):* Q73 closes
  in four pieces by four ADRs. ADR-0011 closed the platform-
  surface portion (which document types active, which resolution
  actions active, ProposedAttachment approval policy, Domain
  Boundary Map cut). ADR-0013 closed the storage-provider
  portion. ADR-0014 closes the OCR / retention / language portions
  per the items above. ADR-0019 closes the confidence threshold
  portion. Each ADR closes its own piece narrowly. The four narrow
  closures collectively resolve Q73's full decision space. A
  future contributor who wants to amend per-org OCR / retention
  / language configurability files an amendment to ADR-0014, not
  to ADR-0011, ADR-0013, or ADR-0019. The four-piece pattern is
  preserved in Notes for future ADR writers (item a).

- **Q74 — Receipt v1 path (OCR/pipeline rows only).** Closed per
  items 2, 5, 6, 7, 8, 11 above. Closure scope:
  - **Image ingestion.** ✓ per ADR-0013 (storage abstraction
    accepts all file types).
  - **OCR extraction.** ✓ via PaddleOCR per item 2.
  - **Receipt-as-payment-evidence (Scenario A).** ✓ via
    `ProposedAttachment(attach_payment_evidence)` per item 11.
  - **Single-high-confidence one-to-one bill matching.** ✓ via
    match-against-existing-state engine per item 11.
  - **Multi-match disambiguation.** Conditional on Q56 / Q68
    (per spec §15) — multi-match cases route to the exception
    queue in v1; ambiguity-resolution logic is owned by
    ADR-0018 (Relationship Router) and Q56 closure.
  - **Born-paid bundle (Scenario C).** Forward-pointed —
    AP/Spend domain rows of receipt v1 path are owned by
    ADR-0015. ADR-0014 produces the bundle when the
    match-against-existing-state subsystem identifies the
    born-paid pattern; ADR-0015 owns the bundle's domain logic
    and the manual workflow.

  *Closure-venue rationale (for future ADR writers):* Q74 splits
  in two pieces — ADR-0014 closes the OCR/pipeline rows;
  ADR-0015 closes the AP/Spend domain rows (born-paid bundle
  workflow, manual workflow, scenario A/B/C lifecycle). The
  same closure-split pattern as Q73's four-piece pattern. Each
  ADR closes its own piece narrowly. The shared-Q closure
  pattern is preserved in Notes for future ADR writers (item a).

## Forward-pointed (do NOT close in this ADR)

The following questions are pipeline-adjacent or are owned by
downstream ADRs; ADR-0014 cites them but does not close them:

- **Q56** (Relationship Router re-evaluation triggers) →
  **ADR-0018** (Relationship Router). ADR-0014's
  match-against-existing-state subsystem produces relationship
  candidates; ambiguity resolution and re-evaluation logic are
  owned by ADR-0018.
- **Q57** (Confidence calibration governance) → **ADR-0019**
  (Confidence Calibration Policy). ADR-0014 ships the per-type
  confidence threshold values (provisional in v1); calibration
  governance (who calibrates, against what test set, how often)
  is ADR-0019's.
- **Q74** (Receipt v1 path — AP/Spend domain rows) → **ADR-0015**
  (AP/Spend Subdomain). ADR-0014 closes the OCR/pipeline rows;
  ADR-0015 closes the born-paid bundle workflow, the manual
  workflow, and the scenario A/B/C lifecycle.
- **Q77** (Q28 expansion scope) — **already updated by ADR-0007**
  amendment ratification. ADR-0014 produces output that the
  matrix consumes (per-document-type field re-verification
  rows, relationship-claim re-verification rows for the
  match-against-existing-state subsystem); ADR-0014 does **not**
  extend the matrix itself. The matrix lives in
  `agent_architecture_policy.md` per ADR-0007 Q77 update; v1
  ship gate is the matrix's ratification.

## Already closed by ADR-0011 (cited as cross-reference)

- Q53 (Document-type enum active/reserved subsets).
- Q54 (Document case lifecycle states).
- Q67 (Domain ownership: bank_transactions / card_transactions).
- Q68 (Exception queue UX and resolution-action enum).
- Q73 (platform-surface portion — document types, resolution
  actions, ProposedAttachment approval policy, Domain Boundary
  Map cut).
- Q75 (Document case source cardinality).
- Q76 (Re-evaluation policy: immutability vs supersession
  boundary).

## Already closed by ADR-0013 (cited as cross-reference)

- Q73 (storage-provider portion — storage provider default,
  drift-detection cadence, queue-and-retry parameters,
  controller-override path, integrity-check policy, preview/
  download URL TTL bound).

## Already closed by ADR-0007 (cited as cross-reference)

- Q27 (CLAUDE.md §4 anti-hallucination wording for Tier 2 / Tier
  2.5 stages).
- Q28 (initial scope — Tier 2 → Tier 1 re-verification matrix
  framework).
- Q29 (Tier 2 boundary enforcement mechanism — ESLint rule).
- Q30 (Logic Receipt reproducibility — `pipeline_trace` field).
- Q31 (LLM-planned orchestration prohibition — verbatim rule).
- Q66 (Relationship Router tier placement — Tier 2.5 per option
  (b)).

## Updates

None. ADR-0014 introduces a new contract (the Tier 2 document
pipeline) and a small set of reserved `org_settings.*` columns
for post-v1 configurability per Q73's OCR portion narrow closure.
None of these modify a prior ADR or canonical doc beyond
inheriting them. ADR-0011 §5's `document_artifacts` schema is
inherited verbatim; ADR-0011 §11's vendor-matcher read boundary
is inherited verbatim; ADR-0007 Q30 / Q31 / Tier 2 safety
contract are inherited verbatim; ADR-0013's
`storageProviderService` interface is inherited verbatim.

**Schema-decision discipline.** If the implementation surfaces a
genuine need for a column on `source_documents`,
`source_document_versions`, `document_artifacts`, `ocr_runs`, or
`extraction_runs` that ADR-0011 §5 / §2 / §9 didn't enumerate,
the addition surfaces as a D3 schema delta in this ADR's
ratification package, not a silent introduction. The pattern
from ADR-0013's `original_storage_key` (derivative inference
surfaced explicitly at D3) is the precedent. Failing to surface
a delta is a governance violation; ADR-0014 has zero such
deltas at draft time.

## Alternatives considered

### Alternative 1 — In-process TypeScript OCR (no Python sidecar)

Rejected. PaddleOCR's TypeScript bindings are immature and the
GPU-accelerated inference path requires Python — running OCR
in-process on TS would force CPU-only inference with substantially
worse latency on the v1 PDF + image throughput targets. The
Python sidecar's HTTP boundary adds operational complexity (item
3) but the trade-off is unavoidable for v1's engine choice. A
future engine that runs efficiently in TS (a WASM-compiled OCR
engine, or an OCR API that treats the entire engine as an
external service) could collapse the sidecar; the swap-target
boundary makes that future change a routine activation, not an
architecture amendment.

### Alternative 2 — LLM-planned pipeline orchestration

Rejected — see ADR-0007 Q31 verbatim rule. LLM coordinators
reintroduce the dynamic-dispatch pattern the three-tier policy
is designed to prevent. A future contributor who proposes
"intelligent" stage routing — for example, an LLM that decides
whether to run OCR or skip directly to AI fallback based on
document characteristics — is proposing a Q31 violation. The
deterministic TypeScript orchestrator is the load-bearing
discipline; intelligence belongs in the per-stage logic, not in
the stage-selection logic.

### Alternative 3 — AI fallback consumes raw image bytes

Rejected. The byte-for-byte reproducibility rule from
`intent_model.md` §6 rule 4 breaks if the AI fallback consumes
raw image bytes; the Logic Receipt's `pipeline_trace.input_hash`
becomes a hash of bytes that cannot reproduce the same output
across two runs (vision-LLM probabilistic output). Option (b)
from `agent_architecture_proposal.md` §2.3 was rejected by
ADR-0007 Q30 closure — accepting step-level reproducibility loss
is not a v1 trade-off the architecture supports. The AI fallback
consumes OCR'd text only; the engine-agnostic boundary from
ADR-0011 §5 holds. A future contributor who proposes
vision-byte input is proposing an ADR-0007 Q30 amendment, not an
ADR-0014 operational change.

### Alternative 4 — Single classification tier (Tier C only, AI fallback as default classifier)

Rejected. AI fallback at every classification incident has two
failure modes: (a) cost — every document costs at least one
Claude Sonnet call, scaling linearly with document volume; (b)
reproducibility — the AI's probabilistic output requires the
prompt-version-as-rotating-discriminator (item 8) to preserve
Q30 reproducibility, which Tier A's rule-based deterministic
output doesn't need. The tiered strategy (Tier A first, Tier C
on no-match, Tier D on both fail) ships rule-based determinism
where it works (the high-precision common cases) and AI fallback
where it adds value (the harder edge cases). Tier B (small
classifier) is the post-v1 path that further narrows the AI
fallback's role as v1's labeled corpus grows.

### Alternative 5 — Synchronous orphan-blob deletion at ingestion-failure time

Rejected. Coupling the failure path to the cleanup path produces
two failure modes: (a) the cleanup itself can fail, leaving the
orphan blob AND surfacing a confusing dual-failure error to the
user; (b) the failure path's primary concern (telling the user
the ingestion failed) gets entangled with infrastructure cleanup
that should run on its own cadence. The daily scheduled GC
(item 10) decouples cleanup from the failure path; the failure
path surfaces a clean typed error to the user, and the orphan
blob is collected later without affecting the user-facing
experience. The 24-hour GC threshold is generous enough to
absorb any in-flight ingestion variance.

### Alternative 6 — Per-pipeline retry budget (instead of per-stage)

Rejected. A pipeline-wide retry budget conflates the budget
across stages with different transient-failure characteristics
— the OCR sidecar's transient failure rate is different from
the AI API's; pooling them produces under-retry on the OCR side
and over-retry on the AI side. Per-stage budgeting (item 12.1)
preserves the stage-isolation property: a flaky stage doesn't
exhaust the budget for the next stage's legitimate retry. The
mechanical surface — each stage tracks its own retry count
within the same `trace_id` context — adds modest complexity for
substantial isolation benefit.

## Cross-references

- **ADR-0001** (`0001-reversal-semantics.md`) — reversal-as-
  mirror semantics inherited indirectly: pipeline-produced
  proposals that subsequently commit and are reversed follow
  ADR-0001's reversal-entry discipline. ADR-0014 does not
  produce reversals directly; reversals fire post-commit.
- **ADR-0007** (`0007-three-tier-agent-architecture.md`) —
  carried prerequisite. Tier 2 safety contract inheritance
  (no direct writes; Zod-validated handoffs; deterministic
  TypeScript orchestration; trace propagation; pipeline_trace
  field per Q30; LLM-planned orchestration prohibition per Q31;
  vendor-matcher three-category read boundary). ADR-0014's
  pipeline runs entirely under ADR-0007's Tier 2 contract.
- **ADR-0010** (`0010-reserved-enum-states.md`) — discipline
  applied to every closed enum this ADR introduces or names:
  `engine` (carried from ADR-0011 §5; v1 active `paddleocr`;
  reserved `tesseract`, `claude_vision`, future engines);
  exception-queue resolution-action enum extension (reserved
  `resolve_pipeline_unavailable` per item 12.2; ADR-0011 §13
  owns enum membership); reserved `org_settings.*` columns
  enumerated per Closes Q73 closure scope above.
- **ADR-0011** (`0011-document-platform.md`) — the spine.
  ADR-0014 inherits §1 (entity ownership boundary), §5
  (`document_artifacts` engine-agnostic contract — verbatim, no
  redraft), §6 (document-type discriminator with v1 active set),
  §7 (handoff vocabulary — ProposedMutation, ProposedMutationBundle,
  ProposedAttachment), §8 (Reading B preservation), §9
  (lifecycle immutability rules — `ocr_runs` and `extraction_runs`
  immutable; supersession via dedicated columns), §11
  (vendor-matcher read boundary three-category split — verbatim),
  §12 (Q28 expansion forward-pointer; pipeline produces output
  that the matrix consumes; matrix lives in
  `agent_architecture_policy.md`), §13 (exception queue
  first-class deliverable; resolution-action enum membership).
- **ADR-0012** (`0012-proposed-mutation-bundle.md`) — sibling
  Tier 3. ADR-0014's match-against-existing-state subsystem
  produces ProposedMutationBundle objects when the document
  evidence supports a born-paid pattern; ADR-0012 owns bundle
  atomicity, lifecycle, and Logic Receipt shape; ADR-0014 hands
  the bundle to the bundle service and produces no commit
  itself. Per-bundle-type child composition is owned by
  ADR-0015.
- **ADR-0013** (`0013-storage-provider.md`) — sibling Tier 3.
  ADR-0014 inherits item 1 (`storageProviderService` interface;
  pipeline calls `fetch()` and `verifyIntegrity()`), item 5
  (drift detection — interacts with replay policy item 5; v1
  `supabase_storage`-exempt by construction), item 9
  (integrity-check at write — cited, not duplicated), item 10
  (source-of-truth discipline — dedup runs at the OCR-pipeline
  ingest stage and short-circuits the second-arriving channel's
  storage write), item 14 (per-provider implementation
  skeletons — pipeline must work across providers). Orphan-blob
  GC (ADR-0014 item 10) is the carry-forward from ADR-0013 item
  1's transactional-rollback note.
- **ADR-0015** (forthcoming, Tier 4 — `ap-spend-subdomain.md`)
  — receives Q74 AP/Spend domain rows deferral; receives the
  born-paid bundle workflow, manual workflow, and scenario A/B/C
  lifecycle. Pipeline-produced ProposedMutation /
  ProposedMutationBundle / ProposedAttachment objects flow into
  AP/Spend domain services for commit per Reading B.
- **ADR-0016** (forthcoming, Tier 4 —
  `document-relationship-graph.md`) — `link_role` enum
  membership including reserved `duplicate_arrival` (per item 6;
  v1 captures duplicate-arrival metadata on `ingestion_dedup_hit`
  audit event; post-v1 captures as a `link_role` row).
- **ADR-0017** (forthcoming, Tier 4 — vendor template substrate
  reservation) — auto-post calibration owns the post-v1 path
  for ProposedMutation / ProposedMutationBundle approval; v1
  ProposedAttachment + ProposedMutation + ProposedMutationBundle
  flow always Tier 1 confirm per ADR-0007 / ADR-0011 §7.
- **ADR-0018** (forthcoming, Tier 5 — `relationship-router.md`)
  — owns the Tier 2.5 ambiguity-resolution and re-evaluation
  subsystems. ADR-0014's match-against-existing-state subsystem
  produces relationship candidates that the Router consumes;
  ADR-0014 does not own ambiguity resolution or re-evaluation
  logic.
- **ADR-0019** (forthcoming, Tier 6 —
  `confidence-calibration-policy.md`) — owns the calibration
  governance for Q57 / Q65. ADR-0014 ships per-type confidence
  threshold values (provisional in v1); ADR-0019 ratifies the
  values at v1 ship; if ratification adjusts values, ADR-0014
  amends to match.
- **`docs/02_specs/intent_model.md`** — `ProposedMutation` shape
  (§3 — pipeline outputs verbatim); Four Questions grammar (§5
  — each proposal renders the four questions); Logic Receipt
  rules (§6 — pipeline emits one Receipt per proposal at
  creation time per the canonical INV-AGENT-002 path; rule 4
  byte-for-byte reproducibility is the load-bearing constraint
  for the AI fallback contract item 8).
- **`docs/02_specs/ledger_truth_model.md`** — Service
  Communication Rules. Specifically Rule 1 (typed input
  schemas), Rule 4 (no free-form data at the boundary —
  pipeline errors emit typed codes), Rule 5 (trace_id on every
  call — every pipeline stage propagates trace_id through
  ServiceContext into structured logs and audit rows; the
  trace_id flows through `X-Trace-Id` header to the Python
  sidecar per item 3).
- **`docs/02_specs/mutation_lifecycle.md`** — six canonical
  states (Pending, Needs Attention, Approved, Posted (auto),
  Posted (manual), Finalized) plus terminal Rejected and
  Rejected-with-reversal. Pipeline-produced proposals enter at
  Pending; transition rules unchanged from
  `mutation_lifecycle.md`.
- **`docs/02_specs/agent_autonomy_model.md`** §6 — System
  ceiling concept (System table; vendor bank-detail changes
  INV-AGENT-006 / row 7, registered at commit `84691d5`).
  Cited at item 9 — Tier 1 re-verifies all vendor-control
  fields at commit per the System-ceiling rule for vendor
  bank-detail changes; the matcher's Tier 2 read boundary
  preserves the surface.
- **`docs/02_specs/agent_architecture_policy.md`** — Q28 matrix
  authoritative source. ADR-0014 produces output that the
  matrix consumes (per-document-type field rows, relationship-
  claim rows for the match-against-existing-state subsystem);
  ADR-0014 does not extend the matrix itself.
- **`docs/02_specs/invariants.md`** — INV-LEDGER-001..006
  (per-child invariants fire inside any bundle transaction
  ADR-0014 produces; pipeline does not produce ledger writes
  directly), INV-AUDIT-001/002 (audit-log writer boundary;
  every pipeline event flows through the canonical writer),
  INV-AGENT-001 (no auto-post across System ceilings — pipeline
  produces proposals, not commits, but the Tier 1 commit path
  inherits the ceiling check), INV-AGENT-002 (every auto-post
  produces a Logic Receipt — pipeline emits the receipt at
  proposal-creation time per item 13; ADR-0007 Q30 extended the
  receipt with `pipeline_trace`), INV-DOC-001 (reserved candidate
  per ADR-0011 §15 — evidence-completeness; ADR-0014's
  pipeline produces the evidence linkage that the invariant
  consumes).
- **`docs/09_briefs/phase-2/document_platform_reframe_design.md`**
  §3.1 (extraction pipeline scope; Tier 2 stages — PDF probe →
  text extraction → OCR → field extraction → table extraction →
  validation → DocumentArtifact), §6 (polymorphic links —
  pipeline produces proposals that link via
  `source_document_links`), §8 (Relationship Router three-
  subsystem decomposition — ADR-0014 owns match-against-
  existing-state only), §9 (Tier 2 / Tier 2.5 dependency on
  ADR-0007), §11 (auto-post deferred past v1 — pipeline
  produces proposals that all flow Tier 1 confirm), §12 (Q28
  evolution — pipeline output feeds the matrix), §15 (receipt
  v1 decision matrix — pipeline ships single OCR engine, image
  ingestion + extraction + Scenario A/B/C routing per the
  matrix), §16 (lifecycle immutability rules — replay policy
  inherits).
- **`docs/09_briefs/phase-2/agent_architecture_proposal.md`**
  §2.3 — original Tier 2 framing; Zod boundary validation
  (problem 2); LLM-planned orchestration prohibition (problem
  3, Q31). The byte-for-byte reproducibility option (a) vs
  (b) trade-off is the load-bearing constraint for the AI
  fallback contract (item 8) and the OCR engine selection
  (item 2).
- **`docs/02_specs/open_questions.md`** — Q65, Q69, Q70, Q71,
  Q72, Q73 (OCR/retention/language portion), Q74 (OCR/pipeline
  rows portion) — closed by this ADR. Q56, Q57, Q74 (AP/Spend
  domain rows portion), Q77 — forward-pointed. Q53, Q54, Q67,
  Q68, Q73 (platform-surface), Q75, Q76 — already closed by
  ADR-0011. Q73 (storage-provider portion) — already closed by
  ADR-0013. Q27, Q28 (initial), Q29, Q30, Q31, Q66 — already
  closed by ADR-0007.

## Notes for future ADR writers

- **(a) Q65 / Q73 / Q74 four-piece-or-shared closure pattern.**
  Three of the questions ADR-0014 closes are split across multiple
  ADRs by design. Q65's per-type values close in ADR-0014; Q57's
  calibration governance closes in ADR-0019. Q73 closes in four
  pieces — ADR-0011 (platform-surface), ADR-0013 (storage),
  ADR-0014 (OCR/retention/language), ADR-0019 (confidence
  threshold). Q74 closes in two pieces — ADR-0014 (OCR/pipeline
  rows), ADR-0015 (AP/Spend domain rows). Each ADR closes its
  own narrow portion; the multi-ADR closures collectively resolve
  each question's full decision space. A future contributor who
  wants to amend per-type confidence threshold values files an
  ADR-0014 amendment (or, if the values move because of
  calibration, an ADR-0019 ratification triggers an ADR-0014
  amendment cascade); an amendment that touches retention
  policy belongs in ADR-0014; an amendment that touches Banking
  (post-v1) belongs in a future Banking ADR. The closure-venue
  rationale is the load-bearing discipline; misframing closure
  ownership produces ADR amendments in the wrong venue and
  drifts cross-references.

- **(b) OCR engine as swap-target behind `document_artifacts`
  contract.** The engine-agnostic contract from ADR-0011 §5 is
  load-bearing for v1's PaddleOCR ship + post-v1 swap path.
  Every consumer of OCR output reads `document_artifacts`, not
  raw engine output; the engine column tags producing engine
  for replay/audit; the engine_version column tags version for
  rollback. Future engine activations (Tesseract, Claude Vision,
  future engines) ship as routine activations behind this
  contract — one new implementation behind the OCR stage's
  typed function signature; one new active value in the engine
  enum; one deployment update on Modal. **No schema migration,
  no consumer rewrite.** A future contributor who proposes an
  engine-specific column on `document_artifacts` is proposing
  an ADR-0011 amendment, not an ADR-0014 operational change —
  the column-shape is owned by ADR-0011 §5.

- **(c) AI-fallback text-only discipline.** The AI fallback
  consumes OCR'd text only; **never raw image bytes**. The
  rule preserves the engine-agnostic boundary (raw bytes bypass
  `document_artifacts`) and the byte-for-byte reproducibility
  rule from `intent_model.md` §6 rule 4 (vision-LLM probabilistic
  output breaks reproducibility). Option (b) from
  `agent_architecture_proposal.md` §2.3 (accept step-level
  reproducibility loss) was rejected by ADR-0007 Q30 closure;
  re-opening that rejection requires an ADR-0007 amendment, not
  an ADR-0014 operational change. A future contributor who
  proposes vision-byte input to the AI fallback is proposing a
  Q30 violation; the discipline lives here so the violation is
  visible.

- **(d) Orphan-blob GC ownership (carry-forward from ADR-0013
  item 1).** ADR-0013 acknowledged the orphan-blob risk
  (storage put succeeds before the `source_documents` INSERT;
  INSERT failure leaves orphan bytes); ADR-0013 forward-pointed
  the GC mechanism to ADR-0014. ADR-0014 item 10 owns the
  mechanism. The GC is **not** at the failure path (item 10
  rejection of synchronous deletion) — it runs on its own daily
  cadence with a 24-hour threshold. Per-provider GC is the
  reserved providers' activation-brief responsibility; v1 GC
  runs for `supabase_storage` only. A future contributor who
  proposes synchronous orphan-deletion is fusing the failure
  path with the cleanup path — the failure path's concern is
  surfacing the failure to the user; the cleanup path runs
  independently.

- **(e) Schema-decision discipline.** ADR-0014 introduces no new
  columns to platform-owned tables (`source_documents`,
  `source_document_versions`, `document_artifacts`, `ocr_runs`,
  `extraction_runs`). If the implementation surfaces a genuine
  need for a column, the addition surfaces as a D3 schema delta
  in the ratification package, **not a silent introduction**.
  The pattern from ADR-0013's `original_storage_key` (derivative
  inference surfaced explicitly at D3) is the precedent. Failing
  to surface a delta is a governance violation; ADR-0014 has
  zero such deltas at draft time. A future contributor who
  finds themselves wanting a column should pause and check this
  note: silent additions drift schemas; explicit deltas preserve
  governance integrity.

- **(f) Pipeline failure-classification matrix mirrors
  ADR-0013's storage-failure classification.** Same three
  categories (transient retryable / persistent unavailable /
  permanent malformed), same retry parameters (max 3, base
  500ms, factor 2x, ±20% jitter, ~3.5s budget), same
  exception-queue routing pattern. **Failure modes in
  distributed pipelines are isomorphic** — the OCR sidecar's
  transient errors look like the storage provider's transient
  errors; the AI API's auth failures look like the storage
  provider's auth failures; the document-corrupted permanent
  failures look like the storage_key-malformed permanent
  failures. The shared shape lets future contributors read one
  failure-classification framework across both systems. Adding
  a fourth category, or merging two, requires re-evaluating the
  routing for every implementation; the three-way split is the
  minimum expressive matrix that distinguishes "retry helps"
  from "retry hurts" from "operation broken."

- **(g) Q29 ESLint rule lives in `agent_architecture_policy.md`
  per ADR-0007 closure.** The concrete lint rule design — the
  file-pattern filter, the import-restriction list, the test
  fixtures, the failure-message text — is a separate near-term
  task per ADR-0007 § Closes Q29. ADR-0014 cites the rule's
  existence and the matcher's compliance (item 9); ADR-0014
  does **not** draft the lint specification. A future
  contributor who needs the rule details reads
  `agent_architecture_policy.md`; ADR-0014 is the consumer of
  the rule, not the home of its design.

- **(h) D3 wording tightening for `storageProviderService`
  transactionality.** ADR-0013 item 1's wording about storage
  put succeeding before `source_documents` INSERT could be
  misread as implying external storage participates in the
  Postgres transaction. The CTO D3 follow-up is expected to
  tighten the wording: "The storage write is sequenced by a
  document-platform service operation, but it is not
  transactionally rollbackable with Postgres. The Postgres
  INSERT happens inside the service transaction after the
  storage put. If the INSERT fails, the already-written bytes
  remain as orphan bytes." ADR-0014 cites ADR-0013 item 1
  unchanged; if a future amendment tightens ADR-0013's wording
  per the D3 follow-up, ADR-0014's citations stay accurate —
  the GC mechanism (item 10) addresses the orphan bytes
  ADR-0013 acknowledges. The wording tightening doesn't
  invalidate the GC mechanism's design; it sharpens the
  orphan-creation explanation.

- **(i) Operator-drift caveat for `supabase_storage` exemption.**
  ADR-0013 item 5's "drift impossible by construction" exemption
  for `supabase_storage` holds for normal app workflows.
  Out-of-band admin/operator changes (e.g., a Supabase admin
  manually replacing a file via the dashboard) remain
  operational incidents that drift detection would catch but
  v1 cadence is manual-or-controller-triggered. ADR-0014's
  replay policy (item 5) interacts: an operator-drift event
  would produce a hash mismatch on next `verifyIntegrity`,
  which ADR-0013's drift-resolution paths handle and ADR-0014's
  replay policy consumes. **No ADR change required from C5;**
  a future-note item if the CTO becomes control-sensitive about
  operator-drift; for now, the v1 manual-trigger UI surface for
  drift detection (per ADR-0013 item 5) covers the operator-
  drift case if it arises. The exemption's "impossible by
  construction" framing is technically about the platform's own
  write paths; out-of-band admin actions are a separate surface
  that v1 absorbs through the same controller-trigger UI.

- **(j) PaddleOCR rationale.** Deterministic output preserves
  Q30 Logic Receipt reproducibility (`intent_model.md` §6 rule
  4: same input bytes → same OCR output → same `pipeline_trace`
  hash). Claude Vision was rejected as v1 default for breaking
  byte-for-byte reproducibility unless option (b) — accept
  step-level reproducibility loss — is accepted, which ADR-0007
  Q30 explicitly rejected. Tesseract was rejected for weaker
  French extraction relative to PaddleOCR's bilingual capability,
  which matters for the v1 French-Canadian customer surface.
  Both reserved engines remain swap-targets behind the
  `document_artifacts` contract; activation briefs ship per
  engine when the trade-offs become acceptable. A future
  contributor who proposes activating Claude Vision should
  weigh the Q30 trade-off explicitly — the reasoning trail is
  preserved here so the trade-off doesn't get re-derived from
  scratch.

- **(k) Modal rationale.** Managed Python deployment with GPU
  support, low ops burden, predictable cost,
  deployment-immutability that supports the rollback strategy
  (item 4 — two image versions maintained, deployment switch is
  fast and bounded). Azure GPU VM was considered and rejected
  — more control, more ops, sufficient managed surface in
  Modal at v1's "founder + 2 real users" scale. Self-hosted
  was considered and rejected — most control, most ops,
  contradicts v1 scale constraint. Railway was considered and
  rejected — cheaper but less GPU support, matters for OCR
  throughput at v1 latency targets. **Modal is itself a
  swap-target post-v1 based on cost/ops experience;** the
  sidecar architecture and the schema-bound boundary make a
  deployment-platform swap a runbook item, not an architecture
  change. A future contributor who proposes platform migration
  reads this note plus item 3 to understand the swap surface.

- **(l) Provisional Q65 values rationale.** The per-document-
  type confidence threshold values (`vendor_invoice` 0.85,
  `receipt` 0.80, `payment_confirmation` 0.85) are
  **provisional in v1** per the Q77 v1-ship-gate pattern.
  ADR-0014 ships the values; the pipeline codes against them;
  ADR-0019 ratifies them at v1 ship. If ratification adjusts
  values, ADR-0014 amends to match. The same provisional-
  pending-v1-ship pattern as Q77 + Q28 matrix: drafted now,
  ratified at ship. **Calibration governance for ongoing
  post-ratification adjustment is forward-pointed to ADR-0019;**
  ADR-0014 doesn't own the question of how the values get
  recalibrated as the system operates. A future contributor
  who finds the threshold values producing too many exceptions
  (or too few) files a calibration request to ADR-0019, not an
  ADR-0014 amendment — the values move via ADR-0019
  ratification, which then triggers an ADR-0014 amendment to
  match. The closure-venue rationale (item a) is the load-
  bearing discipline.
