# ADR-0019 Confidence Calibration Policy — Design Spec

**Phase 0 governance plan Task C11 (Tier 6).** Authored 2026-05-04 in Session 2D after the brainstorming phase locked 8 design sections + 3 deferred-verification surfaces + Z1 #12 fire log + candidate-codification observations.

**Source context inheritance:** Session 2D opening prompt at `docs/09_briefs/phase-2/2026-05-04-session-2d-opening-prompt.md` (committed at `17b43cd`); Session 2C closeout state (D5 ratification of ADR-0018 at `cf8fd74` + D5 package at `93efce8` + D5 plan at `c79ecfc`); cumulative Phase 0 ratification corpus D1 / D2 / D3 / D4 / D5 + bank-detail amendment + mini-decision Option 1C + 2A + Cleanup Commits 1–7.

---

## §0 Purpose and Scope

ADR-0019 Confidence Calibration Policy is the Tier 6 algorithmic-apex calibration governance ADR. Single-ADR scope. Closes Q57 (calibration governance) + Q73's confidence-threshold portion (per the four-piece closure pattern from ADR-0014 Notes for future ADR writers item (a)). Ratifies (per Q77 v1-ship-gate pattern) ADR-0014's per-document-type confidence threshold values + ADR-0018 Subsystem 2's ambiguity-margin threshold value at v1 ship + 6 months.

**Four substantive surfaces ADR-0019 owns:**

1. **Q57 — Confidence calibration governance** (substantive in v1 per Path A bounded-substantive-in-v1).
2. **Q73 — Confidence-threshold configurability portion** (Path γ system-fixed-only-at-v1 + per-org substrate reserved per ADR-0010 + per-org operational activation forward-pointed to post-v1 amendment-or-new-ADR per ADR-0017 §4 framing).
3. **Q65 — ADR-0014 v1 provisional confidence threshold values** (`vendor_invoice` 0.85 / `receipt` 0.80 / `payment_confirmation` 0.85 / `unknown` always-exception per ADR-0014 Decision item 7 "Per-document-type confidence threshold values"); ratified at v1 ship + 6 months. If values move, ADR-0014 amendment cascade fires.
4. **ADR-0018 ambiguity-margin threshold value** (provisional Router-implementation default per Q77 v1-ship-gate pattern; ratified at v1 ship + 6 months alongside Q65 values). If value moves, ADR-0018 amendment cascade fires.

**Vendor-template post-v1 enforcement calibration is NOT ADR-0019 scope** — separate post-Phase-0 ADR (a future amendment to ADR-0017 or a new ADR depending on scope at draft time) per ADR-0017 Decision item 4 forward-pointer.

---

## §1 Context

ADR-0019 sits at Tier 6 of Phase 0's eight-ADR architecture. Depended on by ADR-0014's classifier confidence threshold values (Q65), ADR-0018's Subsystem 2 ambiguity-margin threshold, and ADR-0011's `org_settings.*` table-existence boundary. Depending in turn on ADR-0007's Tier 2.5 timing contract, ADR-0010's reserved-enum-states discipline, and ADR-0017's substrate-now-enforcement-later precedent.

**Why governance-level, not engineering-only:** the threshold values themselves are operational properties of the classifier (ADR-0014) and Router (ADR-0018) — code paths branch on them. The *governance* of those values is a distinct concern: who has authority to calibrate, what data informs the calibration, what audit trail records the calibration, what immutability boundary applies when values move post-commit. ADR-0019 owns the meta-governance; ADR-0014 / ADR-0018 own the values themselves.

**Q57's filed framing cross-references Q23 + Q24:** Q23 ("agent ladder thresholds — fixed at the system level for v1") supports Path γ's system-fixed-only-at-v1 shape; Q24 ("limit change authorization: controller-direct vs controller-proposes/owner-approves vs owner-only") informs the post-v1 per-org-activation authorization pattern (forward-pointed; not ratified in v1). ADR-0019 *completes* Q23 by specifying the system-level update authority Q23 left unspecified.

**Reading B preservation — refined Framing 2 (no new service):** ADR-0019 introduces NO new write service. Calibration governance operates through (a) the canonical audit-log writer per ADR-0011 §1 for the 3 new audit-event types; (b) the existing `org_settings.*` writer (Sub-verification 1 deferred to Phase 0 closure verification surface); (c) a platform-team-executed cycle process (runbook + script) at month 6 + post-v1 cadence. The four prior single-writer-rule applications stand unchanged at four (`ledgerService` / `documentLinkService` / `vendorRuleService` / Router for `document_relationship_candidates`).

---

## §2 Decision Summary

Five locked decisions:

| # | Decision | v1 shape | Post-v1 evolution path |
|---|---|---|---|
| 1 | **Path A: Bounded substantive in v1** (Q57 governance + Q65/ambiguity-margin ratification) | Bounded operational governance; first cycle at v1 ship + 6 months; cadence framework ratified at v1 ship | Subsequent cycles run on cadence; amendment cascades fire to ADR-0014 / ADR-0018 if values move |
| 2 | **Path γ: System-fixed-only-at-v1** (threshold-change authorization) | System-fixed thresholds; per-org `org_settings.*` substrate reserved per ADR-0010 | Per-org operational activation via amendment-or-new-ADR (deferred to draft time per ADR-0017 §4) |
| 3 | **N = 6 months** (first-cycle timing) | One-shot wall-clock value; 6 calendar months from v1 ship | N consumed after first cycle |
| 4 | **Post-v1 cadence = 6 months** (independently named from N) | Recurring 6-month period | Independently amendable post-first-cycle if data informs |
| 5 | **Q73 confidence-threshold portion closure** (complete closure with substrate-extension pattern) | System-fixed-only-at-v1 + per-org-reserved-with-forward-pointer | Per-org operational closure via Path γ post-v1 path |

Decision 2 is the **fifth Phase 0 application** of the substrate-now-enforcement-later pattern (after ADR-0011 reserved exception-resolution-actions; ADR-0014 Tier B classifier reserved post-v1; ADR-0014 reserved `org_settings.*` columns; ADR-0017 enforcement).

Decision 5 closes Q73's confidence-threshold portion **completely** (not partially) — the closure shape addresses both system-fixed-only-at-v1 operational behavior AND per-org-reserved-substrate-with-forward-pointer deferred-activation behavior. Structurally identical to ADR-0017's Q60 closure pattern (substrate + forward-pointer = complete closure of the question's decision space at Phase 0).

---

## §3 Calibration Surfaces

ADR-0019 governs calibration of confidence-threshold values across **two distinct subsystem domains** with five named threshold surfaces.

**Subsystem domain 1 — ADR-0014 classifier per-document-type confidence thresholds (4 surfaces; 3 active calibration + 1 structural always-exception).**

| Surface | Document type | v1-fixed default (Q65) | Calibration semantics |
|---|---|---|---|
| 3.1 | `vendor_invoice` | 0.85 | Above → proposal path; below → exception queue |
| 3.2 | `receipt` | 0.80 | Above → proposal path; below → exception queue |
| 3.3 | `payment_confirmation` | 0.85 | Above → proposal path; below → exception queue |
| 3.4 | `unknown` | always-exception (no threshold) | Always routes to exception queue regardless of confidence; structural per ADR-0014 Decision item 7; NOT threshold-calibrated |

**Subsystem domain 2 — ADR-0018 Router Subsystem 2 ambiguity-margin threshold (1 surface).**

| Surface | Subsystem | v1-fixed default | Calibration semantics |
|---|---|---|---|
| 3.5 | Router Subsystem 2 ambiguity-margin | Router-implementation default (Q77-pattern provisional) | Numeric threshold in `[0, 1]` applied to (top candidate confidence − runner-up confidence). Margin ≥ threshold → propose-the-best; margin < threshold → propose-with-ambiguity-flag (or route-to-exception if cluster large) |

**Reserved post-v1 per-org override seats (6 reserved seats per ADR-0010 reserved-enum-states discipline).**

| Reserved seat | Maps to surface | v1 runtime behavior |
|---|---|---|
| `org_settings.confidence_threshold_vendor_invoice` | 3.1 | NULL-default; runtime falls through to system-fixed default |
| `org_settings.confidence_threshold_receipt` | 3.2 | NULL-default; runtime falls through to system-fixed default |
| `org_settings.confidence_threshold_payment_confirmation` | 3.3 | NULL-default; runtime falls through to system-fixed default |
| `org_settings.confidence_threshold_ambiguity_margin` | 3.5 | NULL-default; runtime falls through to ADR-0018-implementation-default |
| `org_settings.calibration_cadence` | (governance config) | NULL-default; runtime falls through to system-fixed cadence (6 months); per-org cadence override is reserved only in v1, NOT operationally active |
| `org_settings.calibration_test_set_version` | (governance config) | NULL-default; runtime falls through to platform-shipped test-set version |

The 6 reserved columns are disjoint from ADR-0014's 12 OCR/retention/language reserved columns from Q73's other portion.

**Cross-domain calibration coupling:** the 4 active surfaces (3.1–3.3 + 3.5) are calibrated as a coupled set per first cycle, NOT independently. A Subsystem 2 ambiguity-margin calibrated against post-classification candidate distributions WILL shift if upstream classifier thresholds shift; coordinated calibration prevents the second cycle from running against shifted upstream distributions.

The `confidence_threshold_calibrated` audit event's `amendment_cascades_fired` field is an enum array (Option A from brainstorming) with values `ADR_0014_DOCUMENT_TYPE_THRESHOLDS` and `ADR_0018_AMBIGUITY_MARGIN`, allowing both cascades to fire from one cycle.

---

## §4 First Calibration Cycle

### 4.1 Cycle trigger and timing

The cycle triggers at **`v1_ship_at` + 6 calendar months** (Decision 3 N=6). `v1_ship_at` is anchored to the production-deployment commit and recorded as `v1_ship_at` in a platform-config artifact at v1 deployment.

Platform team has ±2-week execution discretion for quarter-end alignment; the audit event `calibration_run_completed` records both `scheduled_at` (target) and `executed_at` (actual).

**Cycle execution authority:** platform team only (per Section 5 Authority shape).

### 4.2 Test-set composition

Test set is **pooled cross-org v1 production data**, NOT per-org cohorts. The `org_set` field records contributing orgs.

| Property | v1-ratified value | Rationale |
|---|---|---|
| Test-set size per active document type | 100 documents (or all eligible if fewer; underpowered-surface fallback) | Standard calibration sample size at family-office volume |
| Sampling source | Controller-confirmed exception-queue resolutions from v1 production traffic | Natural ground-truth labels |
| Sampling strategy | Stratified random sampling within each document type, stratified by classifier confidence-score bucket | Covers full distribution proportionally |
| Stratification bucket boundaries | `[0.0, 0.6, 0.7, 0.8, 0.9, 1.0]` (5 buckets) | Oversamples 0.6–0.9 boundary region |
| Source-org eligibility floor | ≥ 50 controller-confirmed resolutions per active type | Prevents low-volume orgs from dominating |
| Test-set version artifact | Versioned, hash-verifiable, immutable, JSON format v1 | Q30 byte-for-byte reproducibility |
| Underpowered-surface fallback | Use all eligible documents; mark surface as underpowered; threshold-LOWERING for underpowered surfaces requires explicit CTO + Controller approval | Particularly relevant for `payment_confirmation` |
| Ambiguity-margin test fixture | Same test set + paired Subsystem 1 candidate set per document (Sub-verification 3 deferred to Phase 0 closure) | Subsystem 2 calibration requires candidate distribution |

### 4.3 Calibration computation methodology

For each active classifier surface (3.1 / 3.2 / 3.3): compute operating curve (precision-recall vs threshold) over the test set; identify operating point that minimizes controller-review burden subject to **precision floor 0.95**; recommend threshold at operating point.

For ambiguity-margin (3.5): compute operating curve (propose-the-best correctness vs propose-with-ambiguity-flag controller-review-burden vs margin); identify operating point that minimizes controller-review burden subject to **correctness floor 0.98**; recommend margin at operating point.

**Adjustment-rule floor: 0.02 absolute-delta.** If `|recommended_value − current_value| < 0.02`, current value ratified as-is (no cascade). Above 0.02, amendment cascade fires.

The 0.02 floor is a **governance amendment threshold, NOT a statistical truth claim** — it prevents amendment churn from sub-noise movements. Post-cycle data may inform refinement of this floor via a future ADR-0019 amendment.

**Precision floor 0.95 rationale (vs financial-controls 0.99 convention):** ADR-0014's classifier is a **routing classifier** (route to proposal path with downstream Tier 1 commit-time confirmation gate per ADR-0011 §7, vs route to exception queue with downstream controller resolution per ADR-0011 §13), NOT a terminal-decision classifier. Both routes have downstream controller review; the classifier's precision determines which review surface receives more burden. Proposal-path-confirmation is the more efficient controller surface (one click); exception-queue-resolution requires explicit decision-making (higher per-document cognitive cost). 0.95 is operationally preferable.

### 4.4 Cycle outcome recording

Audit events emitted through canonical audit-log writer per ADR-0011 §1:

1. `calibration_test_set_published` — emitted at test-set publication time, BEFORE cycle execution.
2. `calibration_run_completed` — emitted at cycle completion, AFTER computation, BEFORE threshold-change ratification.
3. `confidence_threshold_calibrated` — emitted **per surface that crossed the 0.02 floor** (zero-to-four events per cycle), AFTER `calibration_run_completed`, AFTER CTO + Controller threshold-change ratification, BEFORE the corresponding ADR amendment cascade single-purpose commit.

If no surface crosses the 0.02 floor, **no `confidence_threshold_calibrated` event is emitted**; the empty `amendment_cascades_fired` array on `calibration_run_completed` is the canonical no-change record. The cycle still emits Event 1 + Event 2; only Event 3 is conditional.

### 4.5 Amendment cascade

If `amendment_cascades_fired` array is non-empty, platform team prepares the corresponding ADR amendment(s) per single-purpose-commit discipline:

- **ADR-0014 amendment** (if 3.1 / 3.2 / 3.3 moved): updates Decision item 7's "Per-document-type confidence threshold values" table.
- **ADR-0018 amendment** (if 3.5 moved): updates Decision item 3's documented Router-implementation default.

The amendment cascades are independent per surface; both can fire from same cycle; both reference same `calibration_run_completed` event as ratification provenance via **Framing α** (audit-event ID + hash citation, NOT content embedding).

**Threshold-change approval:** CTO + Controller jointly ratify before amendment cascade fires (per Section 5 Authority).

### 4.6 Subsequent cycles

Subsequent cycles run **every 6 months** after the first cycle (cycle 2 at month 12; cycle 3 at month 18; etc.) with same test-set composition + computation + outcome-recording shape. `cycle_number ≥ 2` for subsequent cycles.

`org_settings.calibration_cadence` is **reserved only in v1**; no per-org cadence override is operationally active. Substrate-now-enforcement-later: same pattern as ADR-0017's vendor_rules.

---

## §5 Authority

### 5.1 Two-layer authority split

| Authority | Holder | Scope |
|---|---|---|
| **Cycle-execution authority** | Platform team (only) | Initiates calibration runbook; prepares test set; runs computation; emits audit events |
| **Threshold-change ratification authority** | **CTO + Controller** (joint) | Reviews `confidence_threshold_calibrated` events; ratifies or rejects recommended movements; if ratified, authorizes ADR-0014 / ADR-0018 amendment-cascade single-purpose commits |
| **Product-shape review** | Founder (only when threshold behavior materially affects user workflow) | Reviewed by CTO + Controller before threshold-change ratification if material user-workflow impact |

**Computation = evidence-gathering; threshold amendment = governance.** Authority follows that split.

ADR-0019 *completes* Q23 by specifying the system-level update authority Q23 left unspecified. Path γ + CTO+Controller ratification preserves the system-fixed framing while ensuring governance accountability for value changes.

### 5.2 Post-v1 per-org override authority pathway forward-pointer

Per-org override authority is forward-pointed to post-v1 ADR amendment-or-new-ADR per the ADR-0017 §4 deferred-to-draft-time framing. The activation ADR will need to specify per-org threshold-change authorization (Q24-pattern controller-proposes/owner-approves analog), per-org calibration-cycle execution authority, and `org_settings.*` columns' runtime-consumption contracts.

### 5.3 Cycle-execution-authority post-v1 amendment pathway

If post-first-cycle data informs a need for controller-approval-gate before computation, an ADR-0019 amendment can add a controller-approval-gate at the cycle-execution-authority layer. v1 ships platform-team-only at the execution layer; the amendment pathway is named.

### 5.4 Ratified-at-v1-ship parameter list (15 parameters)

| # | Parameter | v1-ratified value | Source |
|---|---|---|---|
| 1 | Stratification bucket boundaries | `[0.0, 0.6, 0.7, 0.8, 0.9, 1.0]` (5 buckets) | §4.2 |
| 2 | Test-set size per active document type | 100 documents | §4.2 |
| 3 | Source-org eligibility floor | ≥ 50 controller-confirmed resolutions per active type | §4.2 |
| 4 | Underpowered-surface fallback policy | Use all eligible; mark underpowered; threshold-lowering requires CTO + Controller approval | §4.2 |
| 5 | Precision floor (3.1 / 3.2 / 3.3) | 0.95 | §4.3 |
| 6 | Correctness floor (3.5) | 0.98 | §4.3 |
| 7 | Adjustment-rule floor | 0.02 absolute-delta | §4.3 |
| 8 | First-cycle timing N | 6 calendar months from v1 ship | §2 Decision 3 |
| 9 | Post-v1 cadence | Every 6 calendar months after first cycle | §2 Decision 4 |
| 10 | Cycle-execution authority | Platform team only | §5.1 |
| 11 | Threshold-change ratification authority | CTO + Controller (joint) | §5.1 |
| 12 | Product-shape review trigger | Founder approval requested for material user-workflow impact | §5.1 |
| 13 | `amendment_cascades_fired` enum values | `ADR_0014_DOCUMENT_TYPE_THRESHOLDS`, `ADR_0018_AMBIGUITY_MARGIN` | §4.5 |
| 14 | Calibration test-set artifact format-version | v1 | §6.2 |
| 15 | Calibration audit-event schema-version | v1 | §6.1 |

### 5.5 Anti-overscope discipline applied to authority

ADR-0019 owns the calibration-cycle authority shapes + the ratified-parameter list. Does NOT own: Q23 agent-ladder threshold authorization (owned by `agent_autonomy_model.md`); Q24 limit-change authorization (owned by `agent_autonomy_model.md`); ADR-0014 / ADR-0018 amendment authoring (owned by their respective ADRs' amendment processes); founder-level Phase 0 governance authority (owned by Phase 0 governance plan).

---

## §6 Audit + Reproducibility

### 6.1 Three audit events

All three flow through canonical audit-log writer per ADR-0011 §1; durable per INV-AUDIT-002 append-only. All three events carry `schema_version: "v1"` field.

**Event 1 — `calibration_test_set_published` (13 fields)**

`event_id`, `event_type`, `event_emitted_at`, `cycle_number`, `test_set_version`, `test_set_hash`, `sampling_parameters` (JSON), `document_count_per_type` (JSON), `org_set` (array), `underpowered_surfaces` (array), `published_by` (platform_team_member_id per §5.1), `trace_id`, `schema_version`.

**Event 2 — `calibration_run_completed` (16 fields)**

`event_id`, `event_type`, `event_emitted_at`, `cycle_number`, `scheduled_at`, `executed_at`, `test_set_version`, `test_set_published_event_id`, `prior_value_set` (JSON), `recommended_value_set` (JSON, UN-rounded operating-curve recommendations), `new_value_set` (JSON, after 0.02 floor), `amendment_cascades_fired` (enum array), `operating_curve_summary` (JSON), `executed_by`, `trace_id`, `schema_version`.

**Event 3 — `confidence_threshold_calibrated` (18 fields)**

`event_id`, `event_type`, `event_emitted_at`, `cycle_number`, `surface_id` (enum), `prior_value` (numeric), `recommended_value` (numeric, UN-rounded), `new_value` (numeric, ratified), `amendment_cascade_target` (enum: `ADR_0014` or `ADR_0018`), `cto_ratifier_id`, `controller_ratifier_id`, `founder_review_requested` (boolean), `founder_ratifier_id` (nullable), `justification` (text), `calibration_run_completed_event_id`, `deployment_at` (nullable; populated by deployment system after runtime picks up new value), `trace_id`, `schema_version`.

### 6.2 Calibration test-set artifact format (v1)

Versioned JSON document persisted in canonical artifact storage layer (same storage abstraction family as ADR-0013, but **calibration test-set artifacts are NOT `source_documents`, do NOT create `document_cases`, and do NOT participate in `source_document_links`** — they are governance artifacts stored through the storage abstraction for operational consistency).

**A published calibration test-set artifact is immutable.** Corrections publish a new `test_set_version`; prior versions remain addressable and hash-verifiable.

JSON schema (v1):

```json
{
  "test_set_version": "v1-{date}-{seq}",
  "test_set_format_version": "v1",
  "published_at": "ISO-8601",
  "published_by": "platform_team_member_id",
  "trace_id": "UUID",
  "sampling_parameters": {
    "test_set_size_per_type": 100,
    "source_org_eligibility_floor": 50,
    "stratification_bucket_boundaries": [0.0, 0.6, 0.7, 0.8, 0.9, 1.0],
    "sampling_strategy": "stratified_random_per_org_pooled"
  },
  "document_count_per_type": { "vendor_invoice": 100, "receipt": 100, "payment_confirmation": 73 },
  "underpowered_surfaces": ["payment_confirmation"],
  "org_set": ["org_id_1", "org_id_2", "..."],
  "documents": [
    {
      "document_id": "UUID",
      "document_type_classification": "vendor_invoice",
      "controller_confirmed_correct_label": "vendor_invoice",
      "classifier_confidence_score": 0.87,
      "stratification_bucket": "0.8-0.9",
      "subsystem_1_candidate_set": [...],
      "controller_confirmed_correct_target_candidate_id": "UUID"
    }
  ]
}
```

### 6.3 ADR amendment commit citation discipline (Framing α)

ADR-0014 / ADR-0018 amendment commits triggered by calibration-cycle ratifications follow **Framing α**: citation by audit-event ID + hash, NOT content embedding. Amendment commit body cites:

```
This amendment ratifies the threshold change from calibration cycle {cycle_number}.

Ratification provenance:
- calibration_run_completed event ID: {event_id}
- calibration_run_completed event content hash: {SHA-256}
- confidence_threshold_calibrated event ID (this surface): {event_id}
- confidence_threshold_calibrated event content hash: {SHA-256}
- Cycle scheduled_at: {timestamp}
- Cycle executed_at: {timestamp}
- CTO ratifier: {cto_ratifier_id}
- Controller ratifier: {controller_ratifier_id}
- Founder ratifier (if review requested): {founder_ratifier_id | not_requested}
- Prior value: {prior_value}
- New value: {new_value}
- 0.02 floor decision: {applied | not_applied}
```

Audit log is single source of truth; the citation references canonical state.

### 6.4 Cycle-wide trace_id discipline

All three audit events for a cycle share `trace_id` (UUID). Generated at cycle start when `calibration_test_set_published` emits; propagated to all subsequent events. Allows querying full cycle's event chain by `trace_id`. Structurally parallel to ADR-0012's `bundle_id` and ADR-0018's Subsystem 3 dispatcher `trace_id`.

### 6.5 Q30 byte-for-byte reproducibility

8-step replay procedure:

1. Query `calibration_test_set_published` event by `trace_id` → retrieve `test_set_version` + `test_set_hash`.
2. Fetch test-set artifact by `test_set_version`; verify content hash.
3. Run the test-set documents through the v1 production classifier + Router pipeline **at the version-pinned engine + model versions captured in `pipeline_trace` at proposal time** (per ADR-0014 item 8 AI fallback's `prompt_version` + ADR-0014 item 2 PaddleOCR engine-pinning + ADR-0018 Tier 2.5 deterministic-output contract).
4. Compute operating curves; verify match `operating_curve_summary` in `calibration_run_completed`.
5. Apply operating-curve methodology + ratified floors per §5.4; verify recommended values match `recommended_value_set`.
6. Apply 0.02 adjustment-rule floor; verify `new_value_set`.
7. Cross-reference `confidence_threshold_calibrated` events; verify per-surface `new_value`.
8. Verify ADR-0014 / ADR-0018 amendment commits' `audit_event_content_hash` citations match audit log.

Sub-verification 2 (3-audit-event reproducibility sufficiency for Q30) closes via this 8-step procedure.

---

## §7 Immutability and Retroactivity

### 7.1 Threshold-change effective-time contracts (governance + operational anchors)

Threshold change has **two distinct timestamps**:

- **Governance effective-time anchor:** amendment commit timestamp (when ADR-0014 / ADR-0018 locked values change in repo).
- **Operational effective-time anchor:** deployment timestamp (when running pipeline picks up new values).

Documents classified/routed between the two timestamps use the prior threshold (running code hasn't picked up the change); after the operational anchor, the new threshold applies. Both timestamps recorded in audit trail.

### 7.2 Prior pre-commit candidates: untouched

Pre-commit `document_relationship_candidates` rows generated under prior thresholds are **NOT re-evaluated by the threshold change**. ADR-0018 Subsystem 3 re-evaluation triggers (T1–T10 per Decision item 4) do NOT include "calibrated threshold value moved" as a v1-active trigger.

### 7.3 Post-commit ledger state: untouched

Post-commit `journal_entries` / `journal_lines` / `source_document_links` rows committed under prior thresholds remain immutable per ADR-0011 §9 + ADR-0016 §6. **Prospective-not-retroactive principle holds for both threshold drops AND threshold rises** — controller-confirmed prior decisions are binding regardless of new threshold's hypothetical re-routing.

### 7.4 T11 reserved-trigger forward-pointer (post-v1 reserved)

| Reserved trigger | Activation condition | Effect |
|---|---|---|
| **T11 — Threshold-move re-evaluation** (post-v1 reserved; NEW trigger requiring ADR-0018 amendment to closed list T1–T10, NOT activation of existing reserved seat T7/T9) | Calibration cycle's amendment cascade fires AND post-v1 ADR-0018 amendment introducing T11 is ratified | Re-runs Subsystem 1 against pre-commit candidates; emits `pre_commit_link_rerouted` per ADR-0016 §6 |

T11 reserved-not-active-v1 per substrate-now-enforcement-later pattern. Operational cost of re-evaluating thousands of pending candidates on every threshold movement is high and architectural value is uncertain; post-v1 data may inform whether T11 activation is warranted.

### 7.5 Audit-trail invariance

Audit log invariant under threshold changes per INV-AUDIT-002 append-only. Existing `pipeline_trace` events from prior threshold periods are NOT modified. Sub-verification 4 (whether `pipeline_trace` records explicitly capture threshold values used at classification/routing time, OR values are inferred from timestamp cross-referenced against ADR amendment commit chain) deferred to Phase 0 closure.

---

## §8 Anti-overscope

### 8.1 Eleven-area boundary callout

1. `agent_autonomy_model.md` Q23 agent-ladder threshold authorization
2. `agent_autonomy_model.md` Q24 limit-change authorization
3. ADR-0014 per-document-type confidence threshold values (Q65)
4. ADR-0018 ambiguity-margin algorithmic placement
5. ADR-0017 vendor-template post-v1 enforcement calibration (separate post-Phase-0 ADR per ADR-0017 §4)
6. ADR-0011 §1 entity ownership (`org_settings.*` table-existence boundary)
7. ADR-0011 §7 ProposedAttachment primitive
8. ADR-0011 §9 + ADR-0016 §6 lifecycle immutability
9. ADR-0007 Tier 2.5 calibration-consumption timing
10. ADR-0010 reserved-enum-states discipline
11. Founder-level Phase 0 governance authority

Boundaries 1–10 are ADR-and-spec-anchored; Boundary 11 is governance-process-anchored (foundation boundary).

### 8.2 Out-of-scope items (12 explicit non-closure claims)

ADR-0019 explicitly does NOT close: **Q28** (matrix expansion landing in `agent_architecture_policy.md` per Q77 v1-ship gate); **Q29** (ESLint lint design for Tier 2 / Tier 2.5); **Q56** (Relationship Router re-evaluation triggers T1–T10 closed list — already closed by ADR-0018 Decision item 4 D5; ADR-0019 inherits, does NOT re-close or amend; T11 in §7.4 is a NEW trigger, NOT an amendment of T1–T10's closed list); **Q66** (Router tier placement — already closed by ADR-0007 §Amendment 2026-05-03); **Q76** (immutability boundary — owned by ADR-0011 §9 + ADR-0016 §6); **Q77** (Q28 matrix expansion scope — still open); **Q79** (INV-DOC-001 shape — Phase 0 closure accounting); **vendor-template post-v1 enforcement** (separate post-Phase-0 ADR per ADR-0017 §4); **OCR / extraction / classification implementation** (owned by ADR-0014 Decision items 1–9); **Relationship Router algorithm** (owned by ADR-0018 Decision items 1–7); **E2 / Q28 matrix ratification** (gates v1 ship per Q77); **Threshold-move re-evaluation trigger T11 activation** (reserved-not-active-v1 per §7.4).

### 8.3 Cross-ADR boundary harmonization (deferred to draft time)

Three candidate-harmonization surfaces with the post-Phase-0 vendor-template-enforcement-calibration ADR:

- Test-set composition methodology → §4 (First Calibration Cycle)
- Audit-event taxonomy → §6 (Audit + Reproducibility)
- Ratification-authority shape → §5 (Authority)

The post-Phase-0 ADR may mirror these patterns or diverge based on vendor-template-specific considerations; harmonization is deferred to draft time of the post-Phase-0 ADR per ADR-0017 §4 framing.

### 8.4 Five Phase 0 governance lessons (Notes for future ADR writers)

1. **Path A bounded-substantive-in-v1 framing** — operational governance with bounded design-by-prediction surface; reduces v1 design risk without sacrificing operational obligation.
2. **Path γ system-fixed-only-at-v1 + per-org-substrate-reserved framing** — fifth Phase 0 application of substrate-now-enforcement-later pattern.
3. **N ≠ post-v1 cadence framing** — independently-named timing parameters preserve the degree-of-freedom for post-first-cycle adjustment.
4. **Cross-domain calibration coupling** — calibrating classifier + Router thresholds as a coupled set per cycle; transfers to other multi-stage pipelines.
5. **Framing α audit-event ID + hash citation discipline for ADR amendment commits** — preserves audit log as single source of truth; transfers to any future audit-event-anchored governance event-driven ADR amendment cascade. **Strong codification candidate for Z1 captures at Session 2D closeout.**

---

## §9 Z1 #12 Fire Log (Session 2D Brainstorming)

Z1 #12 (count-metric authorship discipline) fired the following times during Session 2D ADR-0019 brainstorming:

| # | Authoring layer | Drift surface | Caught at |
|---|---|---|---|
| 7 | Session 2D opening prompt | "ADR-0014 §6" (actual: Decision item 7) | Discovery step 2 |
| 8 | Session 2D opening prompt | "ADR-0017 §6" (actual: Decision item 4) | Discovery step 4 |
| 9 | Section 2 design presentation | Missing 5th row in cross-decision summary table | Brainstorm-side review |
| 10 | Section 5.4 design presentation | "13 ratified parameters" but table rendered duplicate row | Brainstorm-side review |
| 11 | Section 6.1 design presentation | Event 2 asserted "13 fields" (actual: 15) | Brainstorm-side review |
| 12 | Section 6.1 design presentation | Event 3 asserted "13 fields" (actual: 16) | Brainstorm-side review |

Cumulative Z1 #12 fire count across Session 2C arc + Session 2D arc combined: **12 fires across 5 distinct authoring contexts** (cleanup briefs, ratification packages, execution plans, session-handoff prompts, design-presentation sections). Discipline robustly validated.

---

## §10 Deferred-Verification List (3 surfaces for C11 drafting brief)

| # | Verification surface | Status | Rationale |
|---|---|---|---|
| 1 | `org_settings.*` writer ownership | Deferred to Phase 0 closure | Section 1 refined Framing 2: ADR-0019 introduces no new service; existing org-administration writer handles `org_settings.*` writes. Verification confirms the existing-writer assumption against `ledger_truth_model.md` Service Communication Rules + ADR-0011 §1 entity ownership boundary. |
| 2 | 3-audit-event reproducibility sufficiency for Q30 | **Closed** at Section 6.5 | 8-step replay procedure provides complete state. |
| 3 | ADR-0018 audit-recording sufficiency for `subsystem_1_candidate_set` reconstruction | Deferred to Phase 0 closure | Section 6.2 calibration test-set artifact carries `subsystem_1_candidate_set` for Subsystem 2 ambiguity-margin calibration; verification determines whether the candidate set can be reconstructed from existing ADR-0018 audit logs OR requires an ADR-0018 amendment to capture it. |
| 4 | `pipeline_trace` threshold-value capture sufficiency | Deferred to Phase 0 closure | Section 7.5 audit-trail invariance assumes pipeline_trace records carry threshold values used at classification/routing time. Verification determines whether values are explicitly captured OR inferred from timestamp cross-referenced against ADR amendment commit chain. |

3 active deferred-verification surfaces (1 + 3 + 4); 1 closed (2).

---

## §11 Candidate-Codification Observations for Session 2D Closeout

- **Candidate A** (cross-ADR section-number citation verification): subsumed under Z1 #12 at Session 2D opening per founder direction. 5 fires across Session 2C arc; subsumption locked.
- **Candidate C** (cross-ADR ownership-claim verification): held in candidate state for Session 2D closeout. 2 fires (C10b Subsystem 1 vs ADR-0014 §11 conflict; opening prompt's omission of Q73 confidence-threshold portion from ADR-0019 ratifies-scope).
- **Lesson 5 Framing α citation discipline** (§8.4 governance lesson 5): newly surfaced as strong Z1 codification candidate for Session 2D closeout. The pattern (audit-event ID + hash citation in ADR amendment commits) generalizes to any future audit-event-anchored governance event-driven ADR amendment cascade.

Final adjudication of candidates A / C / Lesson 5 happens at Session 2D closeout per the standing held disposition.

---

## §12 Length Calibration Target

ADR-0019 inherits the broader-scope Z1 #9 target band (1400–2000 lines) per Tier 5/Tier 6 algorithm-apex framing. The four-surface scope (Q57 governance + Q73 portion + Q65 ratification + ambiguity-margin ratification) leans toward the upper band but density beats raw line count per Z1 #9. Lower-band density preferred where compatible with substantive coverage of all 8 sections.

---

## §13 Transition to Implementation Plan

After founder spec review approves this design, the next step is to invoke `/superpowers:writing-plans` for the C11 drafting + D6 ratification execution plan. The execution plan structures:

- Pre-dispatch verification (Phase 0 closure verification surfaces 1, 3, 4 status; Q-number range Q53–Q79 reconciliation per Z1 #12 discipline).
- C11 drafting subagent dispatch with calibrated brief mapping the 8 design sections to the ADR's substantive structure.
- Brainstorm-side draft review + possible C11a / C11b / C11c hygiene revision passes per the C10/C10a/C10b/C10c precedent.
- D6 ratification package authoring (single-ADR scope per D5 precedent).
- Founder D6 ratification verdict.
- Post-ratification commits (ADR-0019 + D6 package + execution plan + Session 2D closeout artifacts) per the Session 2C 4-commit precedent.

This design spec is the authoritative input to `/superpowers:writing-plans`.
