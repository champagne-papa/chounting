# D1 Ratification Package — ADR-0007

**Status:** Awaiting CTO ratification.
**Date assembled:** 2026-05-03.
**Phase 0 plan reference:** Task D1 (gates Stream C Tier 2 — ADR-0011 Document Platform — and all downstream Tier 3–6 ADR work).
**Drafted by:** Phase 0 governance plan execution, Session 1 (Task C1).
**Source ADR file:** `docs/07_governance/adr/0007-three-tier-agent-architecture.md` (worktree branch `worktree-phase-0-governance`, commits `fdf0608` + `500d4af`).

---

## 1. Summary

ADR-0007 formalizes the three-tier agent architecture proposed in `docs/09_briefs/phase-2/agent_architecture_proposal.md` (2026-04-19, CTO-approved-in-principle), and adds an amendment introduced by the 2026-05-02 Document Platform reframe that inserts a new Tier 2.5 (read-only ledger-aware path) between Tier 2 and Tier 1 to accommodate the Relationship Router's read-against-committed-state pattern.

The ADR is one document covering both the original three-tier policy and the reframe-driven amendment. C1 collapsed both into a single record because the original ADR-0007 starter file did not exist (the number was reserved 2026-04-19 but never drafted), and drafting them together preserves the architectural narrative in one place.

**Length:** 696 lines / 34 KB. Longer than typical ADRs because it covers original-plus-amendment in one record. The `Decision`, `Consequences`, and `Closes` sections cover the original three-tier policy (Tier 1 / Tier 2 / Tier 3); the `Amendment` section adds Tier 2.5 and the four-surface Q28 expansion.

## 2. Closes — six questions, with chosen options

| Question | Topic | Chosen option | Where in ADR | Brief justification |
|---|---|---|---|---|
| Q27 | CLAUDE.md §4 anti-hallucination wording for Tier 2 stateless sub-agents | **Option (b)** — exception clause in ADR-0007 explicitly superseding §4 for the stateless-pipeline case; CLAUDE.md §4 itself is not edited | `Closes` § Q27 | Consolidates the policy in one place rather than splitting governance across CLAUDE.md and ADR-0007. The exception clause is verbatim in the ADR; CLAUDE.md remains untouched as a source. |
| Q28 | Tier 2 → Tier 1 re-verification matrix | **Framework defined in ADR; expanded matrix lands in `agent_architecture_policy.md`** per Q77 (gates v1 ship, not Phase 1 start) | `Closes` § Q28 + `Amendment` § "Q28 expansion to four re-verification surfaces" | The ADR captures the framework with five field-level rows (amount, vendor_id, account_code, entry_date, tax_code_id). The amendment expands to four re-verification surfaces (document-type-aware fields, relationship-claim, stale-state TOCTOU, bundle). Detailed per-document-type matrix is too long for the ADR; lives in `agent_architecture_policy.md` per Phase 0 plan Task E2. |
| Q29 | Tier 2 boundary enforcement mechanism | **ESLint rule** on `src/agent/pipelines/**/*` derived from the existing `no-unwrapped-service-mutation` allowlist | `Closes` § Q29 | Mechanical (build-time) rather than conventional (code-review). Reuses the existing allowlist so adding a new mutating service automatically extends the Tier 2 prohibition. Concrete lint design lives in `agent_architecture_policy.md`. |
| Q30 | Logic Receipt reproducibility under Tier 2 pipelines | **Option (a)** — extend `ProposedMutation.justification` with `pipeline_trace: PipelineStageRecord[]` (per-stage `stage_name`, `input_hash`, `output_hash`, `model`, `timestamp`) | `Closes` § Q30 | Preserves byte-for-byte replay across Tier 2 stages. The AP brief's §4 already mandated this; the reframe spec preserves it. Schema extension lands with Tier 2's first system (the AP Agent). |
| Q31 | LLM-planned orchestration prohibition | **Verbatim rule** stating orchestration MUST be deterministic TypeScript; LLM coordinators prohibited; applies to Tier 2 and Tier 2.5 equally | `Closes` § Q31 + Tier 2 safety contract subsection | Prevents the failure mode where a future contributor argues "my LLM coordinator is just a typed function" and reintroduces dynamic-dispatch / multi-agent-chat patterns. |
| Q66 | Relationship Router tier placement (introduced by reframe spec §9) | **Option (b)** — Tier 2.5 (new tier inserted between Tier 2 and Tier 1) | `Amendment` section + Tier 2.5 safety contract subsection | The Router has read-only ledger access, is idempotent, uses no LLM-planned matching, and produces Zod-validated `DocumentRelationshipCandidate` reverified by Tier 1 before commit. Option (a) (amend Tier 2 to authorize state reads) was rejected because it weakens the original Tier 2 contract; option (c) (Router in Tier 1 as read-only pre-commit stage) was rejected because it conflates classification logic with commit logic. |

## 3. Updates — one question

| Question | Topic | Update | Where in ADR |
|---|---|---|---|
| Q77 | Q28 re-verification matrix expansion scope | This ADR defines the four expansion surfaces; the detailed per-field matrix lands in `agent_architecture_policy.md` before v1 ships. Q77 stays open until that matrix ratifies (gates v1 ship, not Phase 1 start). | `Updates` section + `Amendment` § "Q77 update" |

## 4. Delta vs. the 2026-04-19 agent_architecture_proposal.md

The original architecture proposal landed CTO-approved-in-principle 2026-04-19 with five gating questions (Q27–Q31). The ADR closes those five. The reframe-driven amendment makes four substantive changes beyond the original proposal:

| Element | 2026-04-19 proposal | ADR-0007 (this ratification) | Why changed |
|---|---|---|---|
| **Tier count** | Three tiers (Tier 1 commit, Tier 2 proposal, Tier 3 interface) | Four tiers (adds Tier 2.5 between Tier 2 and Tier 1) | The Document Platform reframe introduced the Relationship Router, which reads against committed ledger state to produce relationship-match candidates. That pattern exceeds the original Tier 2 contract ("stateless sub-agents... no shared session... typed transformations only"). Tier 2.5 gives it the right safety contract. |
| **Q28 framing** | Three problems framed at proposal level (current-session ambiguity, telephone effect, narrative drift) | Four re-verification surfaces (document-type-aware fields, relationship-claim, stale-state TOCTOU, bundle) | The Relationship Router introduces relationship-match outputs that need re-verification beyond field-level. Stale-state TOCTOU (proposal sits in queue while underlying state changes) is a concurrency hazard not addressed in the proposal. Bundle re-verification (compound mutations like born-paid bundles) is a new surface introduced by ProposedMutationBundle. |
| **Q29 mechanism** | "Build-time lint" without specifying | ESLint rule on `src/agent/pipelines/**/*` derived from the existing `no-unwrapped-service-mutation` allowlist | The proposal said the mechanism would be specified before code; the ADR specifies it. Reuses an existing rule's allowlist so maintenance cost is shared. |
| **Reading B clarification** | Not separated — proposal said "deterministic services" without distinguishing domain services from ledger service | Domain services produce ledger operations; the ledger service is the only writer of journal entries. Both run inside `withInvariants()`. | The Document Platform reframe's lede explicitly separates domain-service authority (the AP/Spend domain decides whether a `record_bill_payment` is valid) from ledger-service authority (the ledger service is the only writer of journal-entry rows). The original proposal didn't distinguish these; the ADR does. |

## 5. Carry-forward code-quality items needing CTO call

Four items surfaced during C1 self-review that the agent author flagged but did not change in the draft, on the grounds that they are CTO-decision items rather than draft-quality items. The CTO can decide ratify-as-is, ratify-with-follow-up-amendments, or request-changes-pre-D1 for any subset.

**Item 2 — Tier 2 vs. Tier 2.5 master-data boundary.**
The Tier 2 safety contract says "MUST NOT call any mutating service." The Tier 2.5 safety contract says "MAY read from committed ledger state and from `source_documents` / `document_artifacts`." The boundary is clear for accounting state (bills, payments, prepayments — Tier 2.5 reads them) and for source documents (both tiers read them). The ambiguity is around **vendor master data**: is `vendors.read` a Tier 2 capability (since vendor-matcher in the AP pipeline already needs it) or a Tier 2.5 capability (since it's committed state)? The current draft is silent. The CTO call: clarify the rule that vendor master is readable from Tier 2 as well as Tier 2.5, since it's reference data not transactional state.

*Recommended resolution:* clarify in the Tier 2 safety contract subsection that vendor master, chart-of-accounts, and tax-code reference data are readable from Tier 2 (they are reference, not state); transactional state (bills, payments, prepayments, credits) is readable only from Tier 2.5. Follow-up amendment, not pre-D1 fix.

**Item 3 — Tier 2.5 prohibition list duplication.**
The Tier 2.5 safety contract reproduces four prohibitions verbatim from the Tier 2 contract (no writes, no mutating service calls, no LLM-planned orchestration, no non-Zod-validated handoffs). DRY would say reference Tier 2's prohibitions and only state Tier 2.5's additions (read-against-committed-state authorization, idempotency requirement). The draft duplicates. The CTO call: keep the duplication for clarity (each tier's contract is self-contained) or refactor to reference?

*Recommended resolution:* keep the duplication. ADR safety contracts benefit from being readable in isolation; "see Tier 2's prohibitions" forces readers to context-switch. Ratify as-is.

**Item 4 — Decision-section forward-pointer to Amendment.**
The `Decision` section introduces Tier 2.5 in a single paragraph but doesn't forward-point to the `Amendment` section where the deliberation that produced the (b) choice is recorded. A reader of the `Decision` section alone may miss why Tier 2.5 exists. The CTO call: add a forward-pointer ("see Amendment section below for the three-option deliberation") or rely on document order?

*Recommended resolution:* add the forward-pointer. One-line addition; improves navigability. Pre-D1 fix or follow-up amendment, either is fine.

**Item 5 — Status field convention.**
The ADR Status field reads "Drafted 2026-05-03. Not yet ratified. CTO ratifies per Phase 0 governance plan Decision 3." Existing ADRs (per the ADR README index added in Session 1's E5-partial) use a more compact convention like "Ratified" or "Proposed." The CTO call: keep the verbose status (helpful for governance traceability) or normalize to existing convention?

*Recommended resolution:* keep verbose during the Phase 0 ratification cycle (it provides traceability for which governance task gated this ADR); on ratification, the CTO updates Status to "Ratified 2026-MM-DD by CTO" matching existing convention. Pre-D1 fix not needed; status updates as part of ratification.

## 6. Recommended ratification path

**Ratify with named follow-up amendments.** Specifically:
- Item 4 (forward-pointer): include in this ratification as a one-line edit; the amendment is mechanical and improves the document immediately.
- Item 2 (Tier 2 reference-data clarification): track as a follow-up amendment to land before Session 2A starts (so ADR-0011 Document Platform can cite the clarified rule).
- Item 3 (prohibition list duplication): accept as ratified-with-known-tradeoff; do not amend.
- Item 5 (Status convention): update Status to "Ratified 2026-MM-DD by CTO" as part of ratification action; no separate amendment needed.

The CTO can:
- accept this recommendation (ratify with named follow-ups);
- ratify as-is and let all four items become tracked amendments;
- request changes pre-D1 for any subset of items 2–5.

## 7. Ratification ask

CTO selects one of three paths above (or proposes a fourth). On ratification, the CTO updates the ADR's `Status` field to `Ratified YYYY-MM-DD by CTO` with their handle, and the Phase 0 governance plan's D1 task closes. Stream C Tier 2 (ADR-0011 Document Platform) becomes unblocked; Session 2A may start.

If pre-D1 changes are requested, the agent author re-drafts the ADR per the requested changes, runs another C1 self-review, and re-handoffs.

## 8. Source materials read during C1 drafting

For CTO context, the C1 subagent read the following before drafting:
- `docs/09_briefs/phase-2/agent_architecture_proposal.md` (the 2026-04-19 proposal)
- `docs/09_briefs/phase-2/document_platform_reframe_design.md` §9 (Tier 2 / 2.5 / Tier 1 deliberation), §12 (Q28 four-surface expansion)
- `docs/02_specs/open_questions.md` Q27, Q28, Q29, Q30, Q31, Q66, Q77 (the questions being closed/updated)
- `docs/02_specs/agent_autonomy_model.md` (Agent Ladder; orthogonality claim)
- `docs/02_specs/intent_model.md` (`ProposedMutation` shape; canonical-rule preservation)
- `docs/02_specs/ledger_truth_model.md` (Service Communication Rules; Reading B framing)
- `docs/03_architecture/phase_simplifications.md` Simplification 3 (preservation claim)
- `docs/07_governance/adr/0001-...md` through `0010-...md` (existing ADR conventions; ADR-0010 reserved-enum-states discipline)

This list is here so the CTO can spot-check that the ADR's claims about what existing artifacts say are accurate.
