# D3 Ratification Package — ADR-0012 + ADR-0013 + ADR-0014 (Tier 3 Combined)

**Status:** Awaiting CTO ratification + founder review.
**Date assembled:** 2026-05-03.
**Phase 0 plan reference:** Task D3 (gates Stream C Tier 4 — ADR-0015 AP/Spend Subdomain, ADR-0016 Document Relationship Graph, ADR-0017 Vendor Template substrate — and downstream Tier 5–6 ADR work).
**ADRs being ratified (3, jointly):**
- `docs/07_governance/adr/0012-proposed-mutation-bundle.md` (drafted; commits `933e46e` C3 draft, `b383f51` C3a cleanup) — 1034 lines.
- `docs/07_governance/adr/0013-storage-provider.md` (drafted; commit `d9b9d84`) — 1278 lines.
- `docs/07_governance/adr/0014-tier-2-document-pipeline.md` (drafted + C5a cleaned; commits `818a004` C5 draft, `e885b45` C5a cleanup) — 2003 lines.
**Drafted by:** Phase 0 governance plan execution, Session 2A combined closeout (Tasks C3 / C4 / C5).
**Source commits:** worktree branch `worktree-phase-0-governance` HEAD `e885b45`. ADR-0011 ratification at `94ef7eb`.

---

## 1. Summary

D3 is the combined Tier 3 ratification package per Phase 0 governance plan Tasks C3 / C4 / C5. The three ADRs are the substrate decisions for the source-document → artifact → run → proposal flow that ADR-0011 (D2-ratified) handed off to. They are drafted as parallel-within-tier (no inheritance among the three) and ratified jointly because the downstream Tier 4 work depends on all three landing together.

- **ADR-0012 ProposedMutationBundle.** Atomicity at the DB transaction layer, bundle lifecycle through the six canonical states from `mutation_lifecycle.md` plus terminal Rejected and Rejected-with-reversal, Logic Receipt at bundle level, Q28 surface 4 (bundle re-verification) authoritative source. Closes Q58. Forward-points Q60 → ADR-0015 + ADR-0017 and Q78 → ADR-0015 + ADR-0001.
- **ADR-0013 Storage Provider.** `storageProviderService` interface contract, provider selection / fetch resolution / drift detection / queue-and-retry / provider-unavailable / integrity-check / controller-override / `storage_status` enum / preview-and-download URL bounds. Closes Q73 storage-provider portion narrowly — the third piece of a four-piece Q73 closure pattern.
- **ADR-0014 Tier 2 Document Pipeline.** OCR engine (PaddleOCR v1 locked), Python sidecar topology (Modal v1 locked), classification strategy (Tier A rule-based + Tier C AI fallback + Tier D unknown for v1; Tier B small classifier reserved post-v1), AI fallback contract, replay operational policy, dedup-by-hash, vendor-matcher pipeline integration with ADR-0011 §11 read-boundary inheritance, orphan-blob garbage collection (carry-forward from ADR-0013). Closes Q65 (provisional values pending Q57 calibration governance ratification at v1 ship per the Q77 pattern), Q69, Q70, Q71, Q72, Q73 OCR/retention/language portion, Q74 OCR/pipeline rows portion.

Inheritance from D1 (ADR-0007 amendment ratified) and D2 (ADR-0011 ratified) is explicit across all three ADRs. **Ratification authority:** CTO ratifies; founder reviews (soft gate per Phase 0 governance plan Decision 3). Total artifact surface ~4315 lines for three ADRs (1034 + 1278 + 2003); ADR-0014's 2003-line length is calibration commentary, not enforcement — see §4 note 7 below.

CTO-loop count: this is turn 2 of the 3-turn cap for the Phase 0 ratification cycle. Headroom remains for one more loop if D3 lands a request-changes path.

## 2. Closes

The three ADRs collectively close eight question rows. Q73 closes in two of three rows (storage portion in ADR-0013; OCR/retention/language portion in ADR-0014) as the third and second pieces of a four-piece pattern. Q74 splits between ADR-0014 (OCR/pipeline rows) and a forward-pointer to ADR-0015 (AP/Spend domain rows).

| ADR | Q-number | Topic | Closure |
|---|---|---|---|
| ADR-0012 | Q58 | ProposedMutationBundle atomicity at the DB transaction layer | Single-DB-transaction enforcement. All children commit inside one Postgres transaction wrapped in `withInvariants()`; either the whole transaction commits or Postgres ROLLBACK leaves no trace. Saga is hard-rejected for v1 per Alternatives. Logic Receipt represents bundle children as an ordered array with per-child `input_hash` / `output_hash` / `pipeline_trace` / `ledger_operation_ids` / `invariant_results` inside one bundle-level INV-AGENT-002 event (preferred) or per-child events linked by `bundle_id` plus a bundle summary event (acceptable fallback). |
| ADR-0013 | Q73 (storage portion) | Per-org Document Platform configuration — storage knobs | Narrow closure on the storage-provider portion only. v1 system-fixed `supabase_storage`; per-org default storage provider, drift-detection cadence, queue-and-retry parameters, controller-override path enablement, integrity-check policy, and preview-URL TTL bounds reserved for post-v1 in `org_settings.*` columns per ADR-0010 reserved-enum-states discipline. Third piece of the Q73 four-piece pattern. |
| ADR-0014 | Q65 | Per-document-type classifier confidence thresholds | Per-type values portion only; **provisional in v1** pending Q57 calibration governance ratification at v1 ship per the Q77 pattern (drafted now, ratified at v1 ship). Provisional values: `vendor_invoice` 0.85, `receipt` 0.80, `payment_confirmation` 0.85, `unknown` always exception. Calibration governance forward-pointed to ADR-0019. |
| ADR-0014 | Q69 | Replayability operational policy | Auto-supersede when replay output is structurally similar AND the prior artifact has not been consumed; explicit promotion when output is structurally different OR the prior artifact has been consumed by a committed link or pending-case. Replay trigger: engine-version changes (or `current_version_id` updates). v1 cadence is manual or controller-triggered. |
| ADR-0014 | Q70 | OCR-layer idempotency (dedup-by-hash) | SHA-256 hash check against `source_documents.original_content_hash` within `org_id` scope before any new `source_documents` row inserts; match short-circuits the OCR sidecar entirely; reuses existing artifact rows for the duplicate-arrival proposal pipeline. v1: `ingestion_dedup_hit` audit event on second arrival; `link_role = 'duplicate_arrival'` reserved post-v1 per ADR-0016. |
| ADR-0014 | Q71 | Document-type classification strategy | v1 ships Tier A (rule-based) + Tier C (Claude Sonnet AI fallback) + Tier D (unknown). Tier B (small classifier) reserved post-v1 — requires labeled corpus that v1 generates. Fallback ordering system-fixed in v1. |
| ADR-0014 | Q72 | AI fallback contract | Input: `document_artifacts.lines` + `pages` + system prompt naming enum and field-extraction targets. Critical discipline: NEVER pass raw image bytes (preserves engine-agnostic boundary + Q30 byte-for-byte reproducibility). Output: Zod-validated JSON, two shapes (classification-only or field-extraction). Validation gate before pipeline entry. Re-verification cost budget: max 2 calls per document in v1. Q28 surface 1 integration: every AI-fallback-extracted field flows through human confirmation on the ProposedEntryCard. |
| ADR-0014 | Q73 (OCR/retention/language portion) | Per-org Document Platform configuration — OCR / retention / language knobs | Narrow closure on the OCR engine, replay cadence, dedup policy, classification fallback ordering, AI-fallback budget, vendor-match threshold, GC cadence + threshold, retention policies (source_documents / artifacts / runs), and language packs. All ship as reserved `org_settings.*` columns at v1 schema time per ADR-0010, NOT NULL DEFAULT to v1-fixed values; per-org configurability switches on post-v1. Second piece of the Q73 four-piece pattern. |
| ADR-0014 | Q74 (OCR/pipeline rows) | Receipt v1 path — OCR/pipeline rows | Image OCR extraction via PaddleOCR; receipt-as-payment-evidence (Scenario A) routed via `ProposedAttachment(attach_payment_evidence)`; single-high-confidence one-to-one bill matching via the match-against-existing-state engine. Multi-match disambiguation routes to the exception queue in v1 (Q56 / ADR-0018). Born-paid bundle (Scenario C) and AP/Spend domain rows (manual workflow, scenario A/B/C lifecycle) carry to ADR-0015. |

**Q73 four-piece closure callout.** Q73 closes in four narrow pieces by four ADRs. Each piece is owned by the ADR that controls the surface in question; the four narrow closures together resolve Q73's full decision space. A future contributor who attempts a single-ADR full closure of Q73 is misframing the question.

| Piece | Owning ADR | Status |
|---|---|---|
| Platform-surface portion (document types active, resolution actions active, ProposedAttachment approval policy, Domain Boundary Map cut) | ADR-0011 | Ratified at D2. |
| Storage-provider portion (storage default, drift cadence, queue-and-retry params, controller-override, integrity-check, preview-URL TTL) | ADR-0013 | Closing at D3. |
| OCR / retention / language portion (engine choice, replay cadence, dedup, classification ordering, AI budget, vendor-match threshold, GC cadence + threshold, retention, language packs) | ADR-0014 | Closing at D3. |
| Confidence-threshold portion (calibration governance + per-type-value calibration over time) | ADR-0019 | Closing at v1-ship gate (Session 2B drafting). |

**Q74 split callout.** ADR-0014 closes the OCR/pipeline rows of receipt v1 path. The AP/Spend domain rows (born-paid bundle workflow, manual workflow, scenario A/B/C lifecycle) are forward-pointed to ADR-0015 in Session 2B. The split pattern is the same shape as Q73's four-piece pattern: each ADR closes its own narrow piece.

## 3. Updates — none

The Updates table is empty for all three ADRs. None of ADR-0012 / ADR-0013 / ADR-0014 modifies a prior ADR or canonical doc — each introduces a new contract (bundle envelope; storage-provider service; Tier 2 pipeline) inherited rather than redrafted from existing artifacts. Two clarifying notes:

- **Q77 stays open** until E2's matrix in `agent_architecture_policy.md` ratifies (at v1 ship per Q77's "v1 ship gate, not Phase 1 start" pattern; this is the pattern Q65 also follows). ADR-0014 produces output that the matrix consumes (per-document-type field re-verification rows; relationship-claim re-verification rows for the match-against-existing-state subsystem) but does **not** extend the matrix itself. Q77 was already updated by the ADR-0007 amendment; ADR-0012 / ADR-0013 / ADR-0014 cite that update as a cross-reference and do not re-update.
- **The DOC prefix introduced by ADR-0011 still awaits Task E1 registration** in `docs/02_specs/invariants.md`. ADR-0014 cites `INV-DOC-001` reserved per ADR-0011 §15; the actual prefix registration is post-D3 closeout work and not gated by D3.

Schema deltas (the new `source_documents.original_storage_key` text column; the 12 reserved `org_settings.*` columns), audit-event delta (`bundle_voided` renamed to `bundle_rejected_with_reversal`, `bundle_finalized` added) and other source-material deltas surface in §4 below as discoverability notes — they do not create Updates entries because they live within the schema ownership ADR-0011 already authorized at the discriminator level.

## 4. Delta vs. source materials

Below are the items each ADR carries beyond what the reframe spec / B1 skeleton / D1 baseline / D2 baseline already captured. Each item is a genuine delta — verified against the source materials' existing treatment — surfaced for CTO discoverability.

### ADR-0012 deltas

1. **Lifecycle vocabulary alignment with `mutation_lifecycle.md` canonical states (C3a cleanup pass, commit `b383f51`).** The C3 draft introduced bundle-specific terminal labels (`voided`, `partially reversed`, `fully reversed`); the C3a cleanup pass renamed audit event `bundle_voided` → `bundle_rejected_with_reversal` and added `bundle_finalized` to align with `mutation_lifecycle.md`'s six canonical states plus terminal Rejected and Rejected-with-reversal. This is naming-alignment delta only — no new canonical lifecycle states are introduced; Voided / Reversed / Partially-reversed remain non-canonical derived display statuses computed from reversal-and-audit events. ADR-0012 does **not** amend `mutation_lifecycle.md` from this ADR; the bundle-specific `Approved → Needs Attention` transition path on commit-attempt failure is documented as a bundle-specific transition that is not currently in the canonical transitions table (§5 + Notes for future ADR writers).

### ADR-0013 deltas

2. **Reframe spec §7 stale Q47 / Q52 references for the Storage Provider ADR row.** Reframe spec §7's ADR table listed Q47 and Q52 as the questions the Storage Provider ADR closes. Those question numbers were retired with the Q35–Q52 range supersession (per the supersession note in `docs/02_specs/open_questions.md` line 737) and never filed against Storage-Provider scope. ADR-0013 does **not** close Q47 or Q52; it closes the Q73 storage portion narrowly per ADR-0011's forward-pointer. No reframe-spec amendment is required pre-D3; the reframe-spec correction is a Session 2B closeout hygiene task (alongside the bank-detail amendment brief and the Q66 hygiene gap).

3. **Schema delta vs ADR-0011 §2 — `source_documents.original_storage_key`** (text, immutable, not in ADR-0011 §2's enumeration). ADR-0011 §2 enumerated the immutable evidence anchor as `original_content_hash`, `original_byte_size`, `original_filename` but did not name a fourth `original_storage_key` field. The new column is a derivative inference required by the implicit-version-1 read-resolution path: when `current_version_id` is null (no separate version row exists yet — implicit version 1), the read-resolution path needs a storage key to dispatch storage I/O against. The alternative — forcing a `source_document_versions` row at ingestion — loses the implicit-version-1 optimization. ADR-0011 §2's hybrid model (original-anchor + current-pointer) is preserved verbatim; the new column extends the immutable anchor with the fourth derivative-inference field. **CTO call:** ratify-as-is, OR request a small ADR-0011 amendment in Session 2B that explicitly names the fourth `original_*` field. *Recommended:* ratify-as-is.

4. **Orphan-blob-on-rollback policy.** ADR-0013 specifies that `storageProviderService` runs at the data-access layer (not inside `withInvariants()`). For the ingestion path, the put-then-INSERT order means a failed INSERT after a successful put leaves orphan bytes at the storage_key. v1 accepts this orphan-blob risk in exchange for not inventing two-phase commit between Postgres and the storage backend. Garbage collection of orphan blobs is post-v1, owned by ADR-0014's pipeline. **CTO call:** ratify-as-is; OR request alternative (compensating delete on rollback / reverse the order / two-phase commit); OR surface as an explicit ADR-0014 task to file the GC mechanism alongside the pipeline. *Recommended:* ratify-as-is. The orphan-blob rate at v1 volume is bounded and the architectural alternatives are heavier than the disposal cost.

5. **`storageProviderService` / `withInvariants()` conceptual tightening (CTO follow-up captured).** Current wording could be misread as implying external storage participates in the Postgres transaction. CTO's suggested tightening, captured for D3 wording time or Session 2B application: "The storage write is sequenced by a document-platform service operation, but it is not transactionally rollbackable with Postgres. The Postgres INSERT happens inside the service transaction after the storage put. If the INSERT fails, the already-written bytes remain as orphan bytes." Tag: ratify-with-named-follow-up.

6. **Operator-drift caveat for the `supabase_storage` drift exemption.** Item 5's "drift impossible by construction" rationale holds for normal application workflows; out-of-band admin / operator changes (a Supabase staff intervention; a future operator with service-role access modifying bytes) remain operational incidents that the by-construction argument does not cover. Future-note item if CTO becomes control-sensitive on the exemption. Not a pre-D3 blocker.

### ADR-0014 deltas

7. **Length 2003 vs the 1100–1400 calibration target.** ADR-0014 lands at 2003 lines (post-C5a). The overage concentrates in items 5 / 7 / 8 / 12 (replay policy, classification strategy, AI fallback contract, failure-classification matrix). A compression pass would save only ~2–4% while removing load-bearing CTO-named inheritance content (PaddleOCR + Modal v1 locks; Tier C boundary; the AI-fallback-never-passes-raw-image-bytes invariant). *Recommended:* ratify-as-is. Length is calibration commentary, not enforcement; the density-over-length principle from D2 applies.

8. **AI-fallback `pipeline_trace` parent/child ambiguity.** ADR-0014 item 8 names `ai_fallback_classify` / `ai_fallback_extract` as `pipeline_trace` stage names. ADR-0014 item 13 lists 8 top-level orchestrator stages including `classify_document_type` / `extract_fields`. Ambiguity: does AI fallback emit child sub-stage records under the parent stage, or replace the parent stage record? **CTO call:** ratify-as-is with the sub-stage interpretation (CTO's preferred resolution: AI fallback emits a child sub-stage record in addition to the parent stage record — parent: `classify_document_type` or `extract_fields`; child: `ai_fallback_classify` or `ai_fallback_extract`); OR request one-paragraph clarification at D3 wording time. *Recommended:* ratify-as-is with the sub-stage interpretation.

9. **C5a cleanup applied — reserved `org_settings.*` columns reconciled across the ADR (commit `e885b45`).** The C5 draft enumerated reserved columns in three places — Closes Q73, Consequences "What this costs", and Cross-references > ADR-0010 — with three different incomplete lists. C5a reconciled to a single canonical authoritative list in Closes Q73; the other two locations cite by reference. Final canonical list (12 columns; all per ADR-0010 reserved-enum-states discipline; all NOT NULL DEFAULT to v1-fixed values; switch flips post-v1):

| Column | v1-fixed default |
|---|---|
| `org_settings.ocr_engine` | `'paddleocr'` |
| `org_settings.replay_cadence` | `'manual'` |
| `org_settings.dedup_policy` | system-fixed (every ingestion runs the org-scoped hash check) |
| `org_settings.classification_fallback_order` | system-fixed Tier A + Tier C + Tier D |
| `org_settings.ai_fallback_budget` | `2` |
| `org_settings.vendor_match_threshold` | `0.80` |
| `org_settings.gc_cadence` | `'daily'` |
| `org_settings.gc_threshold_hours` | `24` |
| `org_settings.retention_source_documents` | `'indefinite'` |
| `org_settings.retention_artifacts` | `'indefinite'` |
| `org_settings.retention_runs` | `'indefinite'` |
| `org_settings.language_packs` | `'en,fr'` |

10. **Q73 four-piece closure split confirmation.** ADR-0011 platform-surface (D2 ratified), ADR-0013 storage (D3), ADR-0014 OCR / retention / language (D3), ADR-0019 confidence-threshold (Session 2B v1-ship gate). Each ADR closes its own narrow piece; together the four narrow closures fully resolve Q73's decision space. The pattern is documented in each closing ADR's "Notes for future ADR writers" so a future contributor encountering one piece does not attempt to re-close the others. Pattern documented for future similar Q-splits (Q74's two-piece split follows the same shape).

11. **Q29 ESLint lint design still deferred.** ADR-0007 Q29 closure named ESLint as the boundary enforcement mechanism but deferred concrete lint specification to `docs/02_specs/agent_architecture_policy.md`. ADR-0014 cites compliance with the Q29 mechanism but does not draft the lint rule itself. The concrete ESLint specification must land in `agent_architecture_policy.md` before Tier 2 pipeline code ships in Phase 7. Separate near-term task; not a pre-D3 blocker.

12. **Schema-decision discipline held — zero new platform-owned columns.** ADR-0014 introduced **zero** new columns to platform-owned tables (`source_documents`, `source_document_versions`, `document_artifacts`, `ocr_runs`, `extraction_runs`). Reserved `org_settings.*` columns ship at v1 schema time per ADR-0010 discipline; they are not platform-table additions. This is positive confirmation that the C4 lesson (ADR-0013's `original_storage_key` surfaced as an explicit schema delta in this package) was successfully applied during C5 drafting — the discipline rule documented in ADR-0014's `## Updates` section ("Failing to surface a delta is a governance violation; ADR-0014 has zero such deltas at draft time") held.

13. **Orphan-blob GC ownership — carry-forward from ADR-0013 item 1.** ADR-0014 item 10 owns the GC mechanism that disposes orphan bytes left by ingestion-time failed INSERTs (per delta 4 above). v1 implementation: system-fixed daily scheduled job, 24-hour orphan-age threshold, scoped to `supabase_storage` only. Reserved providers ship per-provider GC in their respective post-v1 activation briefs.

## 5. Carry-forward items

### Discoverability notes (13)

The §4 deltas reproduced here as a tagging table for CTO review. The `Tag` column indicates the recommended ratification disposition.

| # | ADR | Note | Tag |
|---|---|---|---|
| 1 | ADR-0012 | Lifecycle vocabulary alignment (C3a applied) | ratify-as-is |
| 2 | ADR-0013 | Reframe spec §7 stale Q47 / Q52 references | future-note (Session 2B hygiene) |
| 3 | ADR-0013 | Schema delta — `source_documents.original_storage_key` | CTO call (ratify-as-is OR amend-Session-2B) |
| 4 | ADR-0013 | Orphan-blob-on-rollback policy | ratify-as-is |
| 5 | ADR-0013 | `storageProviderService` / `withInvariants()` wording tightening | ratify-with-named-follow-up (CTO wording captured) |
| 6 | ADR-0013 | Operator-drift caveat for `supabase_storage` exemption | future-note |
| 7 | ADR-0014 | Length 2003 vs 1100–1400 target | ratify-as-is |
| 8 | ADR-0014 | AI-fallback `pipeline_trace` parent/child ambiguity | CTO call (ratify-as-is with sub-stage interpretation OR clarification request) |
| 9 | ADR-0014 | C5a applied — reserved `org_settings.*` columns reconciled | ratify-as-is (C5a applied) |
| 10 | ADR-0014 | Q73 four-piece closure split confirmation | ratify-as-is |
| 11 | ADR-0014 | Q29 ESLint lint design still deferred | ratify-as-is |
| 12 | ADR-0014 | Schema-decision discipline held — zero new platform-owned columns | ratify-as-is |
| 13 | ADR-0014 | Orphan-blob GC ownership (carry-forward from ADR-0013) | ratify-as-is |

Disposition summary: 11 ratify-as-is, 2 CTO calls (notes 3 + 8), 1 ratify-with-named-follow-up (note 5), 2 future-notes (notes 2 + 6).

### Session 2B / Phase 7 carry-forwards (3)

Three substantive carry-forwards that ADR-0014 names for downstream work but does not own.

**A. Quality-gate implementation thresholds.** ADR-0014 `document_artifacts.quality_flags` exists as a structural slot (low resolution, skewed scans, partial page, noise threshold, language detection, OCR confidence, multi-page suspicion). Concrete numeric thresholds for each flag are partly Phase 7 implementation, partly ADR-0019 (calibration governance). CTO note: "do not let 'quality_flags exists' equal 'quality gate implemented' — the flag column is the structure, not the gate."

**B. Vendor + layout-template identity model.** ADR-0014's vendor matcher reads vendor identity-and-matching fields ONLY per ADR-0011 §11's three-category split (NOT bank/payment fields). Full vendor + layout-template identity model — `(vendor_id, document_type, layout_signature, language, version)` — needs ADR-0017 Vendor Template substrate. CTO note: "do not let the vendor matcher become 'vendor name only' — layout-template matching is ADR-0017 territory and is what produces robust matching for high-volume vendors with stable layouts."

**C. Governed learning loop.** Human correction → template candidate → shadow mode → approval/versioning → rollback. ADR-0014 owns replay and model-versioning; the full learning-governance model is ADR-0017 (template substrate) + ADR-0019 (calibration governance) territory. CTO note: "do not treat ADR-0014 as closing the learning-loop issue — ADR-0014 ships the runtime substrate the loop sits on top of, but the governance is downstream."

## 6. Recommended ratification path

Three options modeled on the D1 / D2 ratification-options pattern.

**Option 1 — Ratify-as-is.** Of the 13 discoverability notes, 11 ratify-as-is on the recommended path; 2 are CTO calls (notes 3 and 8) that can be tagged ratify-with-named-follow-up at D3 wording time without blocking ratification. Note 5 (`storageProviderService` / `withInvariants()` wording) is ratify-with-named-follow-up with CTO's exact tightening wording captured. Notes 2 and 6 are future-notes (Session 2B hygiene; operator-drift caveat) — neither requires action at D3.

**Option 2 — Ratify-with-named-revisions.** If the CTO requests:
- One-paragraph AI-fallback parent/child clarification (note 8) — small wording cleanup commit before D3 closes. Sub-stage interpretation gets explicit framing in ADR-0014 item 8.
- ADR-0011 amendment routing for `original_storage_key` (note 3) — Session 2B work; D3 ratifies ADR-0013 with the column as-is, ADR-0011 amendment follows in 2B.

A pre-D3 wording change (note 5 tightening or note 8 clarification) follows the cleanup-commit → re-pre-flight → closeout shape established by D2's Item C optional follow-up.

**Option 3 — Send-back-for-revision.** Reserved for cases where review reveals architectural ambiguity not surfaced in self-review. No send-back signals are present in the current draft — both CTO-call notes (3 and 8) are dispositions on documented architectural decisions, not unresolved ambiguities.

**Recommended path:** Option 1 (ratify-as-is) or Option 2 if the CTO prefers explicit clarification on note 8. No architectural ambiguity warranting Option 3.

## 7. Ratification ask

> Ratify ADR-0012, ADR-0013, ADR-0014 jointly per the recommended path?
>
> Two decision points called out for explicit answer:
>
> - **Note 3** (`source_documents.original_storage_key` schema delta): ratify-as-is, OR request an ADR-0011 amendment in Session 2B that explicitly names the fourth `original_*` field?
> - **Note 8** (AI-fallback `pipeline_trace` parent/child ambiguity): ratify-as-is with the CTO-preferred sub-stage interpretation (parent stage record + child sub-stage record), OR request a one-paragraph clarification commit before D3 closes?

On ratification:
- Status fields on ADR-0012 / ADR-0013 / ADR-0014 update to `Ratified 2026-05-03 by CTO with named follow-ups carried forward per D3 ratification package §5`.
- The Phase 0 governance plan's D3 task closes.
- Stream C Tier 4 (ADR-0015 AP/Spend Subdomain, ADR-0016 Document Relationship Graph, ADR-0017 Vendor Template substrate) becomes unblocked for Session 2B drafting.

Founder review is a soft gate (review, not ratify). **Founder-review focus areas:** §1 narrative summary; §4 deltas, especially notes 3, 4, 5, 7, 8, 9; §5 carry-forwards, especially the three Session 2B / Phase 7 items (quality-gate thresholds, vendor + layout identity model, governed learning loop). **CTO-review focus areas:** §2 Closes table (Q73 four-piece pattern, Q74 split, Q65 provisional values); §4 schema deltas (notes 3 + 9 + 12); §4 architectural decisions (notes 4 + 5 + 8); the three CTO-named C5 inheritance items confirmed in ADR-0014 (PaddleOCR v1 lock; Modal v1 lock; AI-fallback never passes raw image bytes).

(All section numbers above refer to this package's sections, not the ADRs' sections.)

## 8. Source materials

For CTO context, the C3 / C4 / C5 subagents and self-reviews read the following before drafting; D3 draft assembled from them. Commit SHAs are provided for current-state artifacts.

- `docs/07_governance/adr/0011-document-platform.md` (RATIFIED 2026-05-03 by CTO with named follow-ups; commits `94ef7eb` Status update, prior drafting `de63c01` C2 draft + `cc8c837` cleanup pass).
- `docs/07_governance/adr/0012-proposed-mutation-bundle.md` (drafted; commits `933e46e` C3 draft, `b383f51` C3a cleanup).
- `docs/07_governance/adr/0013-storage-provider.md` (drafted; commit `d9b9d84`).
- `docs/07_governance/adr/0014-tier-2-document-pipeline.md` (drafted + C5a cleaned; commits `818a004` C5 draft, `e885b45` C5a cleanup).
- `docs/02_specs/agent_architecture_policy.md` (drafted Q28 four-surface matrix; ratifies at v1 ship per Q77; commits `0152ca5` initial draft, `411f306` cleanup pass).
- `docs/09_briefs/phase-2/2026-05-03-d1-ratification-package.md` (D1 precedent — option-selection ratification pattern).
- `docs/09_briefs/phase-2/2026-05-03-d2-ratification-package.md` (D2 precedent — specification-closure ratification pattern; commit `3ae2779`).
- Cross-artifact citation pass — commit `4ad6c69` (purged stale `agent_autonomy_model.md §6 Item 2` positional citations across ADR-0007, ADR-0011, `agent_architecture_policy.md`, ADR-0012; replaced with the System-table label citation per the Session 2B amendment brief).
- `docs/09_briefs/phase-2/document_platform_reframe_design.md` (the canonical 21-section design spec).
- `docs/02_specs/intent_model.md` (`ProposedMutation` shape; Four Questions grammar; Logic Receipt).
- `docs/02_specs/ledger_truth_model.md` (Service Communication Rules; Reading B; canonical audit-log writer per INV-AUDIT-001).
- `docs/02_specs/mutation_lifecycle.md` (six canonical states; terminal Rejected and Rejected-with-reversal — verifies ADR-0012 lifecycle vocabulary alignment per delta 1).
- `docs/02_specs/agent_autonomy_model.md` System table (System ceiling concept; vendor bank-detail row pending registration per Session 2B amendment brief).
- `docs/02_specs/open_questions.md` Q53–Q78 (closure dispositions verified at brief time; Q73 four-piece pattern + Q74 two-piece pattern documented).
- `docs/07_governance/adr/0007-three-tier-agent-architecture.md` (D1 ratified; carried prerequisite for all Tier 3 ADRs — Tier 1 commit-path inheritance, Q28 framework, Q29 ESLint mechanism, Q30 `pipeline_trace`, Q31 LLM-orchestration prohibition, Tier 2 / Tier 2.5 safety contracts).
- `docs/07_governance/adr/0010-reserved-enum-states.md` (reserved-enum discipline applied to all Tier 3 closed enums — `bundle_type`, `storage_provider`, `capture_reason`, `storage_status`, `ocr_engine`, `replay_cadence`, `dedup_policy`, `classification_fallback_order`, language packs; the 12 reserved `org_settings.*` columns ship at v1 schema time per this discipline).
- `docs/07_governance/adr/README.md` (ADR-0012 / 0013 / 0014 number reservation per Decision 7 of the Phase 0 governance plan).

This list is here so the CTO can spot-check that the ADRs' claims about what existing artifacts say are accurate, and that the deltas surfaced in §4 are genuine deltas and not artifacts of misreading source materials.
