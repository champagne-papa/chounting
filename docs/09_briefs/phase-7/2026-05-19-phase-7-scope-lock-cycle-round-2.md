# Phase 7 Extraction Pipeline — Scope-Lock Cycle Round 2

**Session:** 29
**Date:** 2026-05-19
**Branch:** `staging`
**Local HEAD at session-onset:** `2d97efe` (Phase 7 scope-lock cycle Round 1)
**`origin/staging` HEAD:** `4aea7e2` (2 commits behind local; banks for Phase 7 terminal-close push)
**Validation gates at session-onset:** `pnpm agent:validate` 26/26 green (preserved through Round 1 docs-only commit).
**Predecessor:** Phase 7 scope-lock cycle Round 1 at `2d97efe` (`docs/09_briefs/phase-7/2026-05-19-phase-7-scope-lock-cycle-round-1.md`; 310 LOC).

---

## §1 — Preamble + cross-references

### §1.0 What this round is

This is **Round 2** of the Phase 7 extraction pipeline scope-lock cycle. Round 2 walks the **10-sub-question governance-critical batch** per Round 1 §6.2 prompt inputs in the walk-order Q16 → Q17 → Q1 → Q2 → Q5 → Q11 → Q14 → Q18 → Q24 → Q26 per the walk-order coupling discipline (§1.1 below). Round 2 produces per-sub-question dispositions (lock / partial-lock / split-to-Round-N / founder-decision-required) and surfaces one new sub-question (Sub-Q27) from Sub-Q26 column-shape contingency outcome.

### §1.1 Walk-order coupling discipline

Sub-Q16+Q17 commit-grade routing walked first (before Sub-Q1+Q2 cross-phase orchestration) per the directive's coupling discipline: commit-grade routing shape (orchestrator-direct vs Tier 1 committing agent intermediary) materially gates Sub-Q1 orchestrator-placement option space. The walk confirms: Sub-Q16+Q17 lock at orchestrator-direct (no Tier 1 committing agent code surface exists in v1; "Tier 1" in ADR-0007 is the commit-path shape, NOT a separate code-surface intermediary), which would seem to feed Sub-Q1's placement adjudication.

**However,** Sub-Q1 walk surfaces an empirical override against the directive's brainstorming-side lean: per ADR-0020 §1 canonical folder layout (verified on disk at `apps/web/src/agent/orchestrator/`), orchestrators live in the **agent/** authority layer regardless of commit-path shape. The directive's brainstorming-side lean at `services/document-platform/orchestrator/` (and the `services/extraction/` alternate) are ILLEGAL per ADR-0020 §3 import boundary rules: services/ may not host orchestrator-shaped code; agent/ owns Tier 2 pipeline coordination. See §2.3 Sub-Q1 walk for full evidence.

This is a directive-realignment surface — the walk-order coupling discipline operated as intended (commit-grade routing locks before placement walk), but Sub-Q1's option space at scope-input §4.1 was empirically wrong against ADR-0020 substrate. The verify-from-disk discipline at Round 2 caught the substrate divergence before Round 3 chunk decomposition could bake on the wrong lean. Bank as **brainstorming-side metafact drift** sub-shape under §6.3 carry-forward observations.

### §1.2 Sub-Q26 column-shape contingency outcome

Per directive Phase A step 4 verification: ADR-0014 §7 + §8 column-shape specification check.

**Outcome: ADR-0014 commits column existence + partial shape specification across 5 reserved columns** (NOT 2 as the directive framing assumed). Detail at §2.10 Sub-Q26 walk:

- **§7 `org_settings.classification_fallback_order`** — ships at v1 schema time; column-shape **NOT SPECIFIED** (no column type given).
- **§8 `org_settings.ai_fallback_budget`** — ships at v1 schema time; **NOT NULL DEFAULT 2** (implies integer column type but not explicitly typed).
- **§9 `org_settings.vendor_match_threshold`** — ships at v1 schema time; **NOT NULL DEFAULT `0.80`** (implies numeric column type but not explicitly typed).
- **§10 `org_settings.gc_cadence`** — ships at v1 schema time; **NOT NULL DEFAULT v1-fixed value** (cadence value not specified, "daily" implied).
- **§10 `org_settings.gc_threshold_hours`** — ships at v1 schema time; **NOT NULL DEFAULT 24** (implies integer column type).

**Substrate-scope expansion:** Sub-Q26's "single table + 2 columns + migration" framing at the directive was empirically wrong against ADR-0014's full enumeration. Substrate scope is 1 table + **5 columns** + migration. Sub-Q26 partial-locks at 26.α (chunk 7.2 substrate-placement); column-shape adjudication for the 5 reserved columns defers to Round 3 with new sub-question **Sub-Q27** surface. Detail at §2.10 + §5.

### §1.3 Sub-Q24 candidate #8 substrate verification outcome

Per directive Phase A step 12 verification sequence (a)/(b)/(c): Phase 6.5 retrospective Candidate #8 substrate.

**Outcome: Candidate #8 documented at step (a)** in `docs/09_briefs/phase-6.5/2026-05-17-phase-6-5-retrospective-drafting-plan.md` §913-962 (file is locally untracked per git status; multi-round drafting in progress).

**Candidate #8 framing (quoted):**

> "Floor-test absolute-count-assertion fragility (Phase 6.5 chunk 3 first-instance; banking entry pending post-Phase-6.5 remediation)"

Commits to:

- **Pattern:** Absolute-count assertions on accumulating tables (`audit_log`, `document_jobs`, etc.) are fragile under test ordering, parallel execution, and accumulated state.
- **Remediation candidate:** Replace with delta-assertion or relative-assertion shapes; "warrants dedicated investigation session rather than chunk-close codification pass."
- **Status:** N=1 first-instance; below N≥3 codification threshold; substrate-scope at floor-test-design grain.

Walk evidence at §2.9 Sub-Q24 holds: per-chunk-incremental remains the operationally clean path; Candidate #8 dedicated-session pattern remains banked at N=1 for floor-test-design grain (not test-infra-pipeline-grade; different surface). Phase 7 inheritance of the pattern is N=0 at pipeline-grade test infra. Sub-Q24 locks at per-chunk-incremental at Round 2.

### §1.4 Substrate-density-compresses-LOC observation continuation

Round 1 §1.3 N=2 banking (scope-input artifact 599 LOC + Round 1 artifact 310 LOC). Round 2 forecast at ~500-800 LOC per per-sub-question walk depth at 10 governance-critical sub-questions with locked-at-Round-2 disposition candidates. Sub-curve (b) substrate-fix-narrowness framing applies — Round 2 walks settled-substrate adjudication with substantive option-space narrowing rather than net-new substrate authorship. **N=3 banking candidate at compression trajectory continuation.**

### §1.5 Canonical cross-references

- **Round 1 artifact** at `docs/09_briefs/phase-7/2026-05-19-phase-7-scope-lock-cycle-round-1.md` (`2d97efe`) — predecessor; sub-question option space + §6.2 Round 2 prompt inputs.
- **Phase 7 onset scope-input artifact** at `docs/09_briefs/phase-7/2026-05-19-phase-7-extraction-scope-input.md` (`8ae3886`) — sub-question option-space framing inheritance.
- **ADR-0014 §7 + §8 + §9 + §10** — Sub-Q26 substrate-addition scope authoritative source; commits 5 reserved `org_settings` columns at v1 schema time per ADR-0010 discipline.
- **ADR-0014 §11** — Sub-Q17+Sub-Q18 commit-grade routing + ProposedAttachment v1 variants source.
- **ADR-0007 Q28 + Q30 + Q31** — Sub-Q16+Sub-Q17 commit-grade routing anchor; Tier 1 commit-path shape; LLM-orchestration prohibition.
- **ADR-0011 §6 + §11 + §15** — Sub-Q17 vendor_invoice routing + INV-DOC-001 enforcement source.
- **ADR-0018 §item 4 Phase 5.1 second amendment** (`83a5405`) — T1_new_bill + T2_new_payment v1-active-emission-wired post-commit dispatch.
- **ADR-0020 §1 canonical folder layout + §3 import boundary rules** — Sub-Q1 orchestrator placement authoritative source.
- **ADR-0010 substrate-now-enforcement-later discipline** — Sub-Q26 reserved-schema-seats-at-consumer-chunk pattern source.
- **Phase 5.1 chunk 5.1a brief + chunk 5.1b brief** at `docs/09_briefs/phase-5.1/chunks/` — Sub-Q16+Sub-Q17 commit-grade routing Pattern B precedent (orchestrator-direct via withInvariants at call site).
- **`paymentService.ts`** at `apps/web/src/services/spend/paymentService.ts` + **`billService.ts`** at `apps/web/src/services/spend/billService.ts` — Sub-Q16+Sub-Q17 signature verify.
- **Phase 6.5 retrospective drafting plan** at `docs/09_briefs/phase-6.5/2026-05-17-phase-6-5-retrospective-drafting-plan.md` — Sub-Q24 Candidate #8 substrate (locally untracked; in-progress drafting).

---

## §2 — Per-sub-question walk

Walk-order Q16 → Q17 → Q1 → Q2 → Q5 → Q11 → Q14 → Q18 → Q24 → Q26 per §1.1 coupling discipline. Per sub-question: substrate evidence summary + walk against option space + disposition.

### §2.1 Sub-Q16 — `payment_confirmation` → `paymentService.record()` routing

**Option space (scope-input §4.4):** orchestrator-direct vs Tier 1 committing agent intermediary.

**Substrate evidence:**

- ADR-0007 Q31: orchestration between Tier 2 stages MUST be deterministic TypeScript; LLM-planned orchestration prohibited; the orchestrator module is a plain function that calls stages in fixed sequence.
- ADR-0007 § Tier 1 commit shape (verbatim): "agent proposes → service decides (via `withInvariants()`) → database enforces (RLS + CHECK + deferred constraints). Re-verification of Tier 2 / Tier 2.5 inputs happens inside the Tier 1 service call, not before." And: "Tier 1 MUST NOT contain pipeline-shaped sub-stages on the write path. A single deterministic service call inside `withInvariants()` is the only legal commit-path shape."
- Phase 5.1 chunk 5.1b precedent: `paymentService.record()` exported unwrapped at `paymentService.ts` (Pattern B export contract); route handlers wrap via `withInvariants(action: 'payment.record')` at call site at route handler grain.
- T2_new_payment dispatcher activation at `paymentService.ts:336-357` post-commit body end (Pattern B external-wrap; best-effort isolation try/catch + log; never propagate).
- No "Tier 1 committing agent" code surface exists in v1 codebase — the framing in ADR-0007 is a commit-path SHAPE (route handler / caller wraps service via withInvariants()), not a separate agent-tier code intermediary.

**Walk:** The directive's option-space binary ("orchestrator-direct vs Tier 1 committing agent intermediary") collapses to a single legal shape at v1: orchestrator-direct via withInvariants() wrapping at orchestrator call site, parallel to Phase 5.1 chunk 5.1b route handler pattern. The "Tier 1 committing agent intermediary" alternate is structurally vacuous at v1 (no code surface exists; ADR-0007 prohibits pipeline-shaped sub-stages on write path; the only legal shape is `withInvariants()` wrapping a single service call). T2 dispatcher fires post-commit automatically (Pattern B inheritance) regardless of upstream caller identity.

**Disposition:** **Lock at orchestrator-direct.** Phase 7 stage 7 invokes `paymentService.record()` via `withInvariants(action: 'payment.record')` at the orchestrator call site (parallel to Phase 5.1 route handler pattern). T2_new_payment dispatcher fires post-commit at `paymentService.record()` site automatically. No Tier 1 committing agent intermediary at v1; post-v1 introduction reserved per ADR-0007 § Tier 1 safety contract amendment surface.

### §2.2 Sub-Q17 — `vendor_invoice` → `billService.post()` routing

**Option space (scope-input §4.4):** orchestrator-direct vs Tier 1 committing agent intermediary (mirror of Sub-Q16) + INV-DOC-001 enforcement coupling constraint.

**Substrate evidence:**

- Mirror of Sub-Q16 substrate evidence: ADR-0007 Q31 + Tier 1 commit-path shape + Pattern B precedent.
- Phase 5.1 chunk 5.1a precedent: INV-DOC-001 enforcement at `billService.ts:285-295` Layer 2 (post-Zod, pre-commit); `primary_document_id` field on `PostBillInputSchema` extension (optional uuid; required when not in override-mode).
- Route handler at `apps/web/src/app/api/orgs/[orgId]/bills/route.ts:47-50` wraps `billService.post()` directly via `withInvariants(action: 'bill.post')` at call site (Pattern B export contract; service unwrapped at export at `billService.ts:982`).
- When `primary_document_id` is provided to `billService.post()`, `documentLinkService.create()` is called atomically within the same transaction window (`billService.ts:404-412`) to insert the `source_document_links` row with `link_role='primary_invoice'` per ADR-0011 §15 INV-DOC-001 leaf.
- T1_new_bill dispatcher fires post-commit at `billService.post()` site automatically (Phase 4 chunk 3 + Phase 5.1 chunk 5.1a inheritance).

**Walk:** Mirror of Sub-Q16 walk — option-space binary collapses to orchestrator-direct as single legal shape. INV-DOC-001 enforcement constraint at `billService.post()` requires Phase 7 orchestrator to pass `primary_document_id = sourceDocumentId` at the call site (orchestrator owns the `sourceDocumentId` from upstream ingestion-commit Stage 0/1). The constraint is structural: any Phase 7 vendor_invoice commit path that does NOT pass `primary_document_id` will be rejected by Layer 2 enforcement at billService unless override-flag is set (which is a controller-grade decision, not a Phase 7 orchestrator concern).

**Disposition:** **Lock at orchestrator-direct + INV-DOC-001 constraint inheritance.** Phase 7 stage 7 invokes `billService.post()` via `withInvariants(action: 'bill.post')` at the orchestrator call site; orchestrator passes `primary_document_id = sourceDocumentId` per INV-DOC-001 enforcement at chunk 5.1a Layer 2. T1_new_bill dispatcher fires post-commit automatically.

### §2.3 Sub-Q1 — Orchestrator placement

**Option space (scope-input §4.1):** `apps/web/src/services/document-platform/orchestrator/` vs `apps/web/src/agent/pipelines/` vs new `apps/web/src/services/extraction/`.

**Substrate evidence:**

- ADR-0020 §1 canonical folder layout (verbatim from CTO Handoff v2 §3): `apps/web/src/agent/orchestrator/` is the canonical location for orchestrator-shaped code at the cognitive layer.
- ADR-0020 §3 import boundary rules (codified in Appendix A): `services/` may NOT host orchestrator-shaped code; `agent/` owns Tier 2 pipeline coordination; `agent/` may not import `db/` directly (calls services); `services/` may not import `agent/`.
- Verified on disk: `apps/web/src/agent/orchestrator/` directory exists at session-onset, hosting existing chat-orchestrator files (`buildSystemPrompt.ts`, `callClaude.ts`, `index.ts`, `loadOrCreateSession.ts`, `toolsForPersona.ts`).
- ADR-0014 §1 deterministic-TS orchestrator framing: pipeline orchestrator is plain TypeScript function calling stateless typed stages in fixed sequence; not LLM-planned per Q31.

**Walk:** The directive's brainstorming-side lean at `services/document-platform/orchestrator/` (and the `services/extraction/` alternate) are **ILLEGAL** per ADR-0020 §1 + §3. The scope-input artifact §4.1 option-space framing conflated "Tier 1 committing agent" framing (which IS a commit-path shape, not a code surface) with "agent/" source-tree authority layer (which IS a code surface; ADR-0020 puts orchestrators here regardless of commit-path shape). Sub-Q16+Sub-Q17 walk locked orchestrator-direct at the commit-grade routing surface, but this does NOT entail that the orchestrator itself lives in `services/`. Phase 7's `ingestDocument` orchestrator is a Tier 2 pipeline coordinator; per ADR-0020 §1, this lives in `agent/orchestrator/`. The orchestrator calls services (per ADR-0020 §3 agent rules: "agent calls services") via withInvariants() wrapping at the call site — preserving the orchestrator-direct commit shape from Sub-Q16+Sub-Q17 while placing the orchestrator at its canonical authority-layer location.

The directive's contingency note ("agent/pipelines/ candidate drops out under orchestrator-direct (no agent-tier intermediary)") was based on the same conflation. The correct framing: `agent/orchestrator/` is the canonical home regardless of commit-path shape; the commit-path shape is independently locked at Sub-Q16+Sub-Q17.

**Disposition:** **Lock at `apps/web/src/agent/orchestrator/`** per ADR-0020 §1 canonical folder layout. The scope-input §4.1 option space was empirically wrong against ADR-0020 substrate; the walk-order coupling discipline operated correctly and surfaced the override before Round 3 chunk decomposition could bake on the wrong lean.

**Module-structure subdivision (flat vs `agent/orchestrator/extraction/` subdirectory vs `agent/orchestrator/ingestDocument.ts` top-level file) deferred to Round 3** at the module-structure walk grade (parallels Sub-Q11 + Sub-Q6 module-structure adjudication). The existing `agent/orchestrator/` contents are chat-orchestrator files; whether extraction orchestrator co-resides at top-level or subdivides is a separate adjudication.

**Directive-realignment finding banked at §6.3 carry-forward observations:** brainstorming-side metafact drift sub-shape continuation — scope-input artifact §4.1 option space empirically wrong against ADR-0020 substrate; verify-from-disk discipline at Round 2 caught the divergence; Phase 5.1 Observation #19 parent-consolidation family graduates to **N=5 grain (sub-shape: option-space-framing-against-substrate)** at Phase 7 close per scope-input + Round 1 (5 divergences) + Round 2 (Sub-Q1 directive realignment) cumulative banking.

### §2.4 Sub-Q2 — Sync vs async invocation

**Option space (scope-input §4.1):** sync inline with ingestion commit vs async queue (BullMQ / Postgres queue / Modal sidecar callback).

**Substrate evidence:**

- Phase 6 `ingestionService.handleDragDropUpload` returns `DragDropUploadResult` synchronously (Phase 6 chunk 6.2b ship).
- Modal sidecar HTTP request/response is sync-on-the-wire regardless of orchestrator invocation shape (ADR-0014 §3 commits Modal HTTP request/response).
- ADR-0007 Q31 + ADR-0014 §1 deterministic-TS orchestrator framing — sync inline invocation is the simplest shape; async queue introduces orchestration state (job-status table; retry envelope; queue-backed dispatch).
- No queue substrate exists at v1 codebase (BullMQ not installed; no Postgres queue tables; no Modal callback substrate).
- Scope-input §4.1 brainstorming-side lean: sync v1 + queue substrate decision deferred to post-v1.

**Walk:** Sync v1 is the operationally simplest shape and aligns with scope-input lean. The async-queue alternate would require net-new substrate (queue table or BullMQ install + worker process model) before any orchestrator code could ship. Per ADR-0010 substrate-now-enforcement-later discipline, queue substrate could reserve at v1 schema time, but the operational complexity (worker process model; retry envelope; dead-letter handling) materially exceeds Phase 7 v1 scope. Sub-Q3 + Sub-Q4 (Round 3) adjudicate per-stage retry + timeout policy detail at the sync-inline shape.

**Disposition:** **Lock at sync v1.** Phase 7 orchestrator invocation fires synchronously inline with the upstream caller (route handler or chunk-decomposition-determined invocation site per Sub-Q21 at Round 4). Queue substrate decision deferred to post-v1 amendment; Modal sidecar HTTP timeout coordination addressed at Sub-Q4 Round 3.

### §2.5 Sub-Q5 — Modal sidecar deployment scope

**Option space (scope-input §4.1 + §8.2):** in-Phase-7 (chunk 7.1 includes Modal config + Python sidecar repo authorship + HMAC secret management + deployment pipeline) vs standalone infra session pre-chunk-7.1.

**Substrate evidence:**

- ADR-0014 §3 commits Modal deployment platform + HMAC auth + schema-bound TS↔Python boundary (Zod → JSON Schema → Pydantic).
- No Modal substrate exists on disk: no Python sidecar repo or folder; no Modal account config; no Pydantic schema substrate; no HMAC secret management.
- Scope-input §8.2 risk note: "If sidecar deployment proves substantial (Modal account setup; Python sidecar repo authorship; deployment pipeline; HMAC secret management), chunk 7.1 scope may exceed RI-7 single-session ceiling."
- Sub-Q23 (Modal sidecar chunk placement at Round 4) gates on this disposition.
- Brainstorming-side lean per scope-input §8.2: in-Phase-7 (chunk 7.1 includes Modal config) for end-to-end coherence.

**Walk:** The operational complexity is substantial: Modal account setup (external SaaS account creation + payment method + deployment quota) + Python sidecar repo authorship (PaddleOCR wrapper + Pydantic schemas + HMAC verification) + deployment pipeline (Modal CLI workflow + secret management + CI integration) + HMAC secret management (secret generation + .env propagation + rotation policy). The in-Phase-7 lean preserves end-to-end coherence but materially expands chunk 7.1 scope at the per-RI-7 single-session-ceiling grade.

**Walk also surfaces:** the operational call is fundamentally about budget allocation and infra-readiness rather than architectural shape. Both options preserve the substrate commitments (Modal deployment + HMAC auth + schema-bound boundary); the difference is **session-budget allocation** (one session vs two sessions; one chunk vs two chunks).

**Disposition:** **Founder-decision-required.** Surface to brainstorming-side adjudication. The walk evidence supports the in-Phase-7 lean operationally, but the operational complexity warrants explicit founder call on whether chunk 7.1 absorbs Modal substrate (single-chunk in-Phase-7 path) or splits to standalone infra session pre-chunk-7.1 (two-chunk path with separate infra-readiness session). Both options are walked at Round 2; founder selects per session-budget + infra-readiness preference.

If founder selects **in-Phase-7** → Sub-Q23 (Round 4) locks Modal sidecar at chunk 7.1; chunk 7.1 LOC forecast expands (chunk 7.1 → orchestrator skeleton + Modal sidecar + HMAC + Python repo; ~1400-2200 LOC) — Path C invocation candidate at chunk 7.1 grade.

If founder selects **standalone infra session** → Sub-Q23 (Round 4) locks Modal sidecar at chunk 7.0 (pre-chunk-7.1 micro-chunk) or as separate Phase 7 infra-prep session; chunk 7.1 LOC forecast preserves at scope-input §5.1 forecast (~800-1400 LOC).

### §2.6 Sub-Q11 — Per-document-type extractor module structure

**Option space (scope-input §4.3):** per-document-type module (`vendorInvoiceExtractor.ts` + `receiptExtractor.ts` + `paymentConfirmationExtractor.ts`) vs unified `extractor.ts` with internal dispatch.

**Substrate evidence:**

- ADR-0014 §1 Stage 4 signature: `extractFields(documentType, ocrArtifact, traceId)` accommodates per-document-type module OR unified dispatch.
- ADR-0014 §8 AI fallback output `fields` object shape is per-document-type per agent_architecture_policy.md §2.1 field rows.
- ADR-0011 §6 v1-active document_type subset: `vendor_invoice` + `receipt` + `payment_confirmation` + `unknown` — 3 substantive extractor surfaces needed at v1 (no extractor for unknown).
- Parallels Sub-Q6 (Tier A rule-set module structure; Round 3) + Sub-Q13 (per-document-type Zod schemas at `apps/web/src/shared/schemas/extraction/`; Round 3).
- Scope-input §4.3 brainstorming-side lean: per-document-type module.

**Walk:** Per-document-type module structure aligns with per-document-type Zod schema convention (Sub-Q13) and Tier A rule-set module structure (Sub-Q6, parallel decision). Unified dispatch with internal switch would centralize 3 extractor code surfaces in one file; harder to reason about per-document-type changes; harder to test per-extractor in isolation. The 3-substantive-extractor v1 surface count is small enough that either shape is viable, but per-document-type module structure better matches the per-document-type substrate elsewhere (Zod schemas at Sub-Q13; Tier A rules at Sub-Q6).

**Disposition:** **Lock at per-document-type module.** Three modules at v1: `vendorInvoiceExtractor.ts` + `receiptExtractor.ts` + `paymentConfirmationExtractor.ts`. Module placement (under `agent/orchestrator/` per Sub-Q1 lock; flat vs subdirectory like `agent/orchestrator/extractors/`) deferred to Round 3 module-structure walk (parallels Sub-Q1 subdivision deferral). Per-extractor implementation detail (signature alignment with ADR-0014 §1 Stage 4 contract; per-field Zod validation per Sub-Q13) at Round 3.

### §2.7 Sub-Q14 — Vendor matcher integration

**Option space (scope-input §4.3):** matcher location (existing `vendorService` extension vs new matcher module) + signature shape.

**Substrate evidence:**

- ADR-0011 §11 Tier 2 read boundary: matcher MAY read vendor identity-and-matching fields (name, aliases, tax ID, email/domain, address, default account mapping, historical template association); chart of accounts; tax codes; classes/projects/departments. MUST NOT read transactional state or vendor control fields.
- ADR-0014 §9: vendor matcher inherits ADR-0011 §11 read boundary verbatim; produces typed `VendorMatchResult` Zod-validated object: `{vendor_id: string | null, confidence: number, match_type: 'exact_name' | 'alias' | 'tax_id' | 'email' | 'domain' | 'fuzzy_name' | 'no_match', candidate_alternatives: VendorCandidate[]}`.
- ADR-0014 §9 ALSO commits reserved column `org_settings.vendor_match_threshold` NOT NULL DEFAULT `0.80` at v1 schema time (additional reserved column surface, captured at §1.2 / §2.10 Sub-Q26 substrate-scope expansion).
- Phase 5 vendors table consumer surface: vendors substrate at `migration 20240101000000_initial_schema.sql`; vendor lookups in existing AP services (Phase 5 substrate per scope-input §2.1 Phase 5 row).
- ADR-0020 §3 import boundary: matcher must live under `services/` (deterministic engine layer; reads vendors table via repository); `agent/` calls matcher via service interface; `services/` may NOT import `agent/`.

**Walk:** Matcher placement per ADR-0020 §3 is under `services/`. Two candidate locations:

- **services/spend/vendorService.ts extension** — existing service; Phase 5 vendor surface; matcher as new exported function (`matchVendor(input: VendorMatchInput, ctx: ServiceContext): Promise<VendorMatchResult>`).
- **services/extraction/vendorMatcher.ts (new module)** — Phase-7-isolated; cleaner separation between Phase 5 AP/Spend vendor operations and Phase 7 extraction-time vendor matching.

Walk evidence: ADR-0011 §11 + ADR-0014 §9 commit the matcher to read-only over vendor identity-and-matching fields — does not commit to a specific placement. Phase 5 vendorService (if exists) hosts Phase 5 vendor mutation surfaces (vendor CRUD; vendor identity-management); Phase 7 extraction-time vendor matching is read-only, a different operational concern. The split candidate (services/extraction/) better isolates Phase 7 extraction concerns from Phase 5 AP/Spend concerns but introduces a new top-level services subdirectory.

**Disposition:** **Lock at matcher signature + read-only contract per ADR-0014 §9; module-placement adjudication deferred to Round 3 module-structure walk.** Lock candidates for Round 3:

- **Candidate A:** existing `services/spend/vendorService.ts` extension (consistent neighbor surface; minimal new module overhead).
- **Candidate B:** new `services/extraction/vendorMatcher.ts` (cleaner Phase-7-isolation; new top-level services subdirectory).

Round 3 walk decides between A/B per neighbor-surface vs isolation tradeoff. Signature lock at Round 2 holds:

```typescript
async function matchVendor(
  input: VendorMatchInput,
  ctx: ServiceContext,
): Promise<VendorMatchResult>
```

Where `VendorMatchInput = { name?: string, aliases?: string[], tax_id?: string, email?: string, domain?: string, address?: string }` and `VendorMatchResult` per ADR-0014 §9 verbatim.

### §2.8 Sub-Q18 — Receipt routing v1 policy

**Option space (scope-input §4.4):** exception queue (v1) vs receiptService greenfield (post-v1).

**Substrate evidence:**

- ADR-0011 §6 v1-active: `receipt` is one of 3 substantive v1-active `document_type` values.
- Phase 5.1 close substrate: NO `receiptService` exists on disk; receipt-as-payment-evidence is ADR-0014 §11 Scenario A path (`attach_payment_evidence`).
- ADR-0014 §11 ProposedAttachment v1 variants enumeration: `attach_payment_evidence` — Scenario A per spec §15 (receipt is supporting evidence for an already-recorded payment).
- ADR-0014 §11 ProposedAttachment approval policy: Always Confirm except user-initiated direct-upload variant.
- Scope-input §4.4 brainstorming-side lean: exception queue at v1.

**Walk:** The brainstorming-side lean ("exception queue at v1") is correct in framing but incomplete in substrate evidence. ADR-0014 §11 actually commits a **bifurcated v1 receipt routing path**:

1. **Receipt has matching prior payment** (relationship-candidate stage finds existing payment row) → ADR-0014 §11 ProposedAttachment.attach_payment_evidence path. Receipt links to existing payment row via `documentLinkService.create()` with appropriate `link_role`. Always Confirm approval (Tier 1 commits the attachment).
2. **Receipt has no matching prior payment** (relationship-candidate stage produces zero candidates or all candidates rejected) → exception queue per `documentExceptionService.enqueueException` for manual operator review.

The two paths are NOT mutually exclusive — the relationship-candidate stage discriminator drives the routing. No greenfield `receiptService` at v1 (the attachment path uses existing `documentLinkService` + payment-row linking; the exception path uses existing `documentExceptionService`).

**Disposition:** **Lock at bifurcated routing per ADR-0014 §11.** v1 receipt routing:

- Matching prior payment → ProposedAttachment.attach_payment_evidence (Phase 4 router → existing documentLinkService).
- No matching prior payment → exception queue (Phase 2 chunk 6 documentExceptionService).

No greenfield `receiptService` at v1. Post-v1 amendment surface if receipt-driven payment workflows materialize sufficient volume to warrant dedicated service.

**Brainstorming-side lean refinement:** the directive's "exception queue at v1" framing absorbed into bifurcated routing. Sub-Q15 + Sub-Q19 + Sub-Q20 (Round 4 product-discovery) adjudicate the UX surface for both paths.

### §2.9 Sub-Q24 — Test infrastructure scope

**Option space (scope-input §4.7):** per-chunk test infra incremental vs dedicated test-infra-prep session pre-Phase-7-chunks.

**Substrate evidence:**

- Phase 6.5 retrospective Candidate #8 documented at retrospective drafting plan §913-962 (per §1.3 outcome): "Floor-test absolute-count-assertion fragility (Phase 6.5 chunk 3 first-instance; banking entry pending post-Phase-6.5 remediation)." N=1 first-instance; below codification threshold.
- Candidate #8 surface is floor-test-design grain (absolute-count assertions on accumulating tables); NOT test-infra-pipeline-grade.
- Phase 5.1 + Phase 6.5 precedent: per-chunk test infra incremental shape (each chunk authors its own test infra at chunk-close; AI fallback mock harnesses + service mock harnesses surfaced incrementally).
- Phase 7 net-new test infra surfaces: AI fallback mock harness (Tier C Claude Sonnet response mocking; chunk 7.2 grade) + Modal sidecar mock harness (chunk 7.1 grade) + per-stage unit test harness (chunk 7.3 grade).

**Walk:** Candidate #8 is N=1 at floor-test-design grain (different surface from pipeline-grade test infra). Extending Candidate #8 dedicated-session pattern to Phase 7 pipeline-grade test infra would be N=2 at a *different surface* (not the same pattern firing twice at the same grain) — does not graduate Candidate #8 codification threshold per N=3+ requirement. Per-chunk incremental shape aligns with Phase 5.1 + Phase 6.5 precedent and avoids a pre-Phase-7 budget allocation that the substrate evidence does not require.

**Disposition:** **Lock at per-chunk-incremental at Round 2.** Phase 7 test infra surfaces ship within respective chunks: chunk 7.1 ships Modal sidecar mock; chunk 7.2 ships AI fallback mock harness; chunk 7.3 ships per-stage unit test patterns. Candidate #8 dedicated-session pattern remains banked at N=1 for floor-test-design grain; Phase 7 test infra does NOT escalate to N=2 (different surface; pipeline-grade vs floor-test-grade).

Carry-forward observation: Candidate #8 graduation to codification threshold (N=3+) remains a Phase 6.5 retrospective close concern; Phase 7 inherits floor-test discipline per existing Phase 6.5 conventions (delta-assertion vs absolute-count guidance) regardless of dedicated-session adjudication.

### §2.10 Sub-Q26 — Substrate-addition scope for ADR-0014 §7+§8+§9+§10 reserved `org_settings` columns

**Option space pre-staged at directive (per Round 1 §3.8 + directive draft):**

- **26.α** ship at chunk 7.2 (classifier chunk; pair substrate with consumer).
- **26.β** ship at standalone substrate-fix micro-chunk (chunk 7.0 or pre-chunk-7.1).
- **26.γ** defer to post-v1 (re-amend ADR-0014 §7+§8 to drop v1-schema-time commitment).
- **26.δ** ship as Phase 5.1.5 mini-amendment cycle.

**Substrate evidence per Phase A step 4 ADR-0014 verbatim read:**

- §7 `org_settings.classification_fallback_order`: "The reserved column (`org_settings.classification_fallback_order`) ships at v1 schema time per ADR-0010 discipline." **Shape NOT specified** — no column type given (text[]? jsonb? jsonb array of strings? custom enum array?).
- §8 `org_settings.ai_fallback_budget`: "The reserved column (`org_settings.ai_fallback_budget`) ships at v1 schema time per ADR-0010 discipline with **NOT NULL DEFAULT to the v1-fixed value (2)**." **Shape implied integer** via DEFAULT value 2; not explicitly typed.
- §9 `org_settings.vendor_match_threshold`: "The reserved column (`org_settings.vendor_match_threshold`) ships at v1 schema time per ADR-0010 reserved-enum-states discipline with **NOT NULL DEFAULT to the v1-fixed value (`0.80`)**." **Shape implied numeric** via DEFAULT value 0.80; not explicitly typed.
- §10 `org_settings.gc_cadence`: "The reserved columns (`org_settings.gc_cadence`, `org_settings.gc_threshold_hours`) ship at v1 schema time per ADR-0010 discipline with NOT NULL DEFAULT to the v1-fixed values." **gc_cadence shape implied text or interval** (v1-fixed value "daily" implied); not explicitly typed.
- §10 `org_settings.gc_threshold_hours`: "(see §10 commitment)." **Shape implied integer** via "24" v1-fixed value (24 hours threshold); not explicitly typed.

**Substrate-scope expansion (CRITICAL FINDING):** ADR-0014 commits **5 reserved `org_settings` columns** total, NOT 2 as the directive framing assumed. Sub-Q26 substrate scope expands from "1 table + 2 columns + migration" to "1 table + 5 columns + migration."

**Walk:**

26.γ defer-to-post-v1 requires re-amending ADR-0014 §7 + §8 + §9 + §10 to drop the v1-schema-time commitment across **four ADR sections** — adjudication cost compounds 4x vs the directive's 2-section assumption. Re-amendment walks back substrate-now-enforcement-later discipline at 5 surfaces simultaneously. Disposition: 26.γ rejected at increased adjudication cost.

26.δ Phase 5.1.5 amendment-cycle shape overloads pre-Phase-7 amendment cycle with Phase-7-substantively-domain substrate (the 5 columns are all Phase 7 consumer columns: classifier-config + AI-fallback-config + vendor-matcher-config + GC-config — none have pre-Phase-7 consumers requiring earlier ship). Disposition: 26.δ rejected on substrate-domain ownership grounds.

26.α (chunk 7.2 substrate-placement) holds operationally: ADR-0010 reserved-schema-seats-at-consumer-chunk pattern (Phase 2.5 vendor_credits precedent + Phase 5.1 chunk 5.1a INV-DOC-001 substrate precedent) aligns substrate-ship with first-consumer chunk. Three of five columns (classification_fallback_order + ai_fallback_budget + vendor_match_threshold) are Phase 7 consumer-grade (classifier + AI fallback + vendor matcher); two of five columns (gc_cadence + gc_threshold_hours) are Phase 7 GC-stage consumer-grade. All five chunks ship at chunk 7.2 (classifier) OR chunk 7.3 (extractor + vendor matcher + GC stage — depending on Sub-Q21 chunk decomposition at Round 4) OR split between 7.2 and 7.3.

26.β standalone substrate-fix micro-chunk preserves chunk 7.1+7.2+7.3 substantive-scope discipline but adds an additional session at the substrate-fix-narrowness grade. Operationally clean but introduces session-budget overhead.

**Column-shape adjudication:** Per directive Phase A step 4 outcome, ADR-0014 commits column EXISTENCE + IMPLIED SHAPE (via DEFAULT values) for 4 of 5 columns; classification_fallback_order has no implied shape. Column-shape adjudication for the 5 reserved columns warrants its own walk:

- `classification_fallback_order`: text[] vs jsonb (array of strings) vs custom enum array — shape adjudication needed.
- `ai_fallback_budget`: integer vs smallint — shape adjudication needed (likely integer per DEFAULT 2).
- `vendor_match_threshold`: numeric(3,2) vs real vs double precision — shape adjudication needed (likely numeric(3,2) per DEFAULT 0.80).
- `gc_cadence`: text vs interval vs custom enum (`'daily'`, `'hourly'`, etc.) — shape adjudication needed.
- `gc_threshold_hours`: integer vs smallint — shape adjudication needed (likely integer per DEFAULT 24).

**Disposition:** **Partial-lock at 26.α (chunk 7.2 substrate-placement) per directive contingency framing.** Substrate-scope expansion banked (1 table + 5 columns + migration; NOT 2). Column-shape adjudication for 5 columns deferred to Round 3 with **new sub-question Sub-Q27** surface.

**Sub-Q27 surface (Round 3):** Column-shape specification for ADR-0014 §7+§8+§9+§10 reserved `org_settings` columns. Adjudicates per-column type (text[] vs jsonb; integer vs smallint; numeric(3,2) vs real; text vs interval; etc.). Coupled with ADR-0014 amendment surface (if amendment required to specify column shapes verbatim) OR Phase 7 chunk 7.2 brief-grade adjudication (if column shapes adjudicated at substrate-implementation grade without ADR amendment).

---

## §3 — Round 2 dispositions banked

| Sub-Q | Disposition | Lock detail |
|---|---|---|
| Sub-Q16 | **Lock at Round 2** | orchestrator-direct via `withInvariants(action: 'payment.record')` at orchestrator call site; T2 dispatcher fires post-commit per Pattern B precedent |
| Sub-Q17 | **Lock at Round 2** | orchestrator-direct via `withInvariants(action: 'bill.post')` at orchestrator call site; orchestrator passes `primary_document_id = sourceDocumentId` per INV-DOC-001; T1 dispatcher fires post-commit |
| Sub-Q1 | **Lock at Round 2 (placement) + Round 3 deferral (subdivision)** | `apps/web/src/agent/orchestrator/` per ADR-0020 §1; module-structure subdivision (flat vs subdirectory) deferred to Round 3. **Directive-realignment finding:** scope-input §4.1 option space empirically wrong against ADR-0020 — bank as brainstorming-side metafact drift sub-shape at §6.3 |
| Sub-Q2 | **Lock at Round 2** | sync v1 invocation; queue substrate deferred to post-v1; Modal sidecar HTTP timeout at Sub-Q4 (Round 3) |
| Sub-Q5 | **Founder-decision-required** | walk evidence supports in-Phase-7 lean operationally; founder selects between in-Phase-7 (chunk 7.1 absorbs Modal substrate; Path C invocation candidate at chunk 7.1) vs standalone infra session pre-chunk-7.1 |
| Sub-Q11 | **Lock at Round 2 (per-document-type module) + Round 3 deferral (placement)** | three modules at v1 (vendorInvoiceExtractor + receiptExtractor + paymentConfirmationExtractor); module path subdivision deferred to Round 3 (parallels Sub-Q1) |
| Sub-Q14 | **Lock at Round 2 (signature) + Round 3 deferral (placement)** | matcher signature per ADR-0014 §9 read-only; module placement between `services/spend/vendorService.ts` extension (Candidate A) vs `services/extraction/vendorMatcher.ts` new module (Candidate B) deferred to Round 3 |
| Sub-Q18 | **Lock at Round 2 (bifurcated routing)** | matching prior payment → ProposedAttachment.attach_payment_evidence; no matching prior payment → exception queue; no greenfield receiptService at v1 |
| Sub-Q24 | **Lock at Round 2** | per-chunk-incremental at v1; Phase 6.5 Candidate #8 banked at N=1 floor-test-design grain; Phase 7 pipeline-grade test infra does NOT escalate Candidate #8 (different surface) |
| Sub-Q26 | **Partial-lock at Round 2 (26.α placement) + Round 3 deferral (Sub-Q27 column-shape)** | substrate-scope expands to 5 reserved columns (NOT 2); 26.α chunk 7.2 placement holds; column-shape adjudication for 5 columns deferred to Round 3 via **new Sub-Q27** |

**Count:** 7 clean locks + 2 partial locks (Sub-Q1 placement-locked-subdivision-deferred; Sub-Q11 module-shape-locked-placement-deferred; Sub-Q14 signature-locked-placement-deferred; Sub-Q26 placement-locked-shape-deferred) + 1 founder-decision-required (Sub-Q5).

**Wait — clarify partial-lock count:** Sub-Q1 + Sub-Q11 + Sub-Q14 + Sub-Q26 = 4 partial locks (each locks a primary axis at Round 2 + defers a secondary axis to Round 3); Sub-Q5 = 1 founder-decision; Sub-Q16 + Sub-Q17 + Sub-Q2 + Sub-Q18 + Sub-Q24 = 5 clean locks at Round 2.

**Total Round 2 lock progress:**

- **5 clean locks** at Round 2 (Sub-Q16 + Sub-Q17 + Sub-Q2 + Sub-Q18 + Sub-Q24).
- **4 partial locks** at Round 2 with Round 3 deferral on secondary axis (Sub-Q1 + Sub-Q11 + Sub-Q14 + Sub-Q26).
- **1 founder-decision-required** (Sub-Q5; surfaces to brainstorming-side adjudication before Round 3 fire).

---

## §4 — Decision-class split disposition update

Per Round 1 §4 decision-class split (16 governance-critical + 6 mixed + 4 product-discovery = 26 sub-questions). Round 2 walks 10 governance-critical sub-questions; updated disposition state:

**Governance-critical sub-questions converted from "pending Round 2" status:**

- Sub-Q16 → **locked at Round 2**
- Sub-Q17 → **locked at Round 2**
- Sub-Q1 → **partial-locked at Round 2 (placement); Round 3 deferral on module-structure subdivision**
- Sub-Q2 → **locked at Round 2**
- Sub-Q5 → **founder-decision-required (returns to brainstorming-side before Round 3)**
- Sub-Q11 → **partial-locked at Round 2 (module structure); Round 3 deferral on module placement**
- Sub-Q14 → **partial-locked at Round 2 (signature); Round 3 deferral on module placement**
- Sub-Q18 → **locked at Round 2 (bifurcated routing refinement)**
- Sub-Q24 → **locked at Round 2**
- Sub-Q26 → **partial-locked at Round 2 (chunk 7.2 placement); Round 3 deferral on column-shape via Sub-Q27**

**Governance-critical sub-questions still pending Round 3+:**

- Sub-Q7 (Tier A rule precedence)
- Sub-Q8 (Tier A → Tier C threshold)
- Sub-Q12 (extraction-conviction semantics)
- Sub-Q21 (chunk count + boundaries; Round 4 per Phase 5.1 precedent)
- Sub-Q22 (chunk shipping order; Round 4)
- Sub-Q23 (Modal sidecar chunk placement; Round 4; gated by Sub-Q5 founder-decision)

**Sub-Q27 (new at Round 2):** column-shape adjudication for ADR-0014 §7+§8+§9+§10 reserved `org_settings` columns. **Decision class:** Governance-critical at column-type discipline (text[] vs jsonb; integer vs smallint; numeric(3,2) vs real). **Deferral round:** Round 3.

**Updated count: 16+1 = 17 governance-critical + 6 mixed + 4 product-discovery = 27 sub-questions** at Round 2 close.

---

## §5 — Round 3+ scope

### §5.1 Round 3 scope

Round 3 walks the remaining governance-critical Round 3-deferred sub-questions + the mixed-class sub-questions per Round 1 §5.2 forecast + new Sub-Q27:

**Module-placement + module-structure adjudication (Round 3):**

- Sub-Q1.b (orchestrator module subdivision: flat at `agent/orchestrator/` vs subdirectory like `agent/orchestrator/extraction/`)
- Sub-Q11.b (per-document-type extractor module placement: flat vs subdirectory; coupled to Sub-Q1.b)
- Sub-Q14.b (vendor matcher module placement: Candidate A `services/spend/vendorService.ts` extension vs Candidate B `services/extraction/vendorMatcher.ts` new module)

**Classifier + extractor detail (Round 3 per Round 1 §5.2):**

- Sub-Q3 (retry semantics per stage)
- Sub-Q4 (timeout handling)
- Sub-Q6 (Tier A rule-set definition + module structure)
- Sub-Q7 (Tier A rule precedence)
- Sub-Q8 (Tier A → Tier C threshold)
- Sub-Q9 (Tier C system prompt versioning)
- Sub-Q10 (Tier D exception payload)
- Sub-Q12 (extraction-conviction semantics)
- Sub-Q13 (AI fallback per-field schemas)

**Column-shape adjudication (Round 3 new):**

- Sub-Q27 (column-shape for 5 reserved `org_settings` columns)

**Round 3 forecast batch:** 9 sub-questions inherited from Round 1 §5.2 + 3 module-placement sub-questions (Sub-Q1.b + Sub-Q11.b + Sub-Q14.b) + 1 new Sub-Q27 = 13 sub-questions at Round 3 scope.

### §5.2 Round 4 scope (per Round 1 §5.2 forecast)

Final-lock per Phase 5.1 Round 4 precedent. Walks chunk decomposition + UI consumer detail + Modal sidecar chunk placement (gated by Sub-Q5 founder-decision):

- Sub-Q15 (extraction-result UI render)
- Sub-Q19 (canvasDirective new member shape)
- Sub-Q20 (PendingDocumentsView post-classification render)
- Sub-Q21 (Phase 7 chunk count + boundaries; final lock)
- Sub-Q22 (chunk shipping order; final lock)
- Sub-Q23 (Modal sidecar chunk placement; final lock per Sub-Q5 founder-decision)
- Sub-Q25 (logging + observability)

**Round 4 forecast batch:** 7 sub-questions per Round 1 §5.2.

### §5.3 Round 5+ scope (carry-forward from Round 1 §5.2)

Per Round 1 §5.2: brief drafting plan + cross-chunk validation matrix + Path C invocation final adjudication (Round 5) + cycle close + scope-lock ratification artifact (Round 6 if needed).

### §5.4 Updated round count forecast

Round 1 forecast: 5-7 rounds.

Round 2 close updates: 5-7 rounds remains valid; if Sub-Q5 founder-decision absorbs cleanly at Round 3 onset and Round 3 batch (13 sub-questions) walks without unforeseen substrate divergences, Round 4 final lock + Round 5 brief drafting plan + Round 6 cycle close = 6 rounds total at well-calibrated middle of forecast.

---

## §6 — Round 2 close

### §6.1 Round 2 dispositions banked summary

- **5 clean locks** at Round 2 (Sub-Q16 + Sub-Q17 + Sub-Q2 + Sub-Q18 + Sub-Q24).
- **4 partial locks** with Round 3 deferral on secondary axis (Sub-Q1 placement-locked; Sub-Q11 module-structure-locked; Sub-Q14 signature-locked; Sub-Q26 placement-locked-shape-deferred).
- **1 founder-decision-required** (Sub-Q5 Modal sidecar deployment scope).
- **1 new sub-question surfaced** (Sub-Q27 column-shape adjudication).
- **1 directive-realignment finding** (Sub-Q1 brainstorming-side lean empirically wrong against ADR-0020 substrate; verify-from-disk discipline at Round 2 caught the divergence).
- **1 substrate-scope expansion finding** (Sub-Q26 reserved columns 2 → 5 per ADR-0014 §7+§8+§9+§10 full enumeration).
- **1 bifurcation refinement** (Sub-Q18 receipt routing: matching-prior-payment → attachment; no-matching → exception).
- **Substrate-density-compresses-LOC observation:** Round 2 LOC TBD at session close; N=3 banking candidate.

### §6.2 Round 3 prompt inputs

Round 3 directive inputs from this Round 2 close:

**Founder-decision adjudication surface (must resolve before Round 3 fire):**

- **Sub-Q5 Modal sidecar deployment scope** — in-Phase-7 (chunk 7.1 absorbs Modal substrate; Path C invocation candidate) vs standalone infra session pre-chunk-7.1. Brainstorming-side adjudication required.

**Round 3 sub-question batch (13 sub-questions):**

- Module-placement sub-questions: Sub-Q1.b (orchestrator subdivision) + Sub-Q11.b (extractor module placement) + Sub-Q14.b (vendor matcher placement A vs B).
- Classifier + extractor detail: Sub-Q3 + Sub-Q4 + Sub-Q6 + Sub-Q7 + Sub-Q8 + Sub-Q9 + Sub-Q10 + Sub-Q12 + Sub-Q13.
- Column-shape adjudication: Sub-Q27 (5 reserved `org_settings` columns).

**Substrate citation corrections inherited:**

- VFD-2 `original_content_hash` column name (from Round 1 §1.1).
- VFD-5 `pipeline_trace` JSONB column on `document_artifacts` (from Round 1 §1.1).
- VFD-6 `org_settings` substrate gap (now expanded: 5 reserved columns per ADR-0014 §7+§8+§9+§10).
- VFD-11 `PendingDocumentsView` path at `components/canvas/` (from Round 1 §1.1).
- VFD-13 `SplitScreenLayout` path at `components/bridge/` (from Round 1 §1.1).

**Round 2 locks inherited (substrate constraints for Round 3 walks):**

- Sub-Q1: orchestrator placement at `agent/orchestrator/` per ADR-0020 §1.
- Sub-Q16+Sub-Q17: orchestrator-direct commit-path via withInvariants() at orchestrator call site.
- Sub-Q2: sync v1 invocation.
- Sub-Q11: per-document-type extractor modules.
- Sub-Q14: matcher read-only signature per ADR-0014 §9.
- Sub-Q18: bifurcated receipt routing (attachment vs exception).
- Sub-Q24: per-chunk-incremental test infra.
- Sub-Q26: chunk 7.2 substrate-placement.

### §6.3 Carry-forward observations

- **Candidate (c) catalog state at Session 29 close:** sp-auth sub-grain N=0 maintained at directive (single-execute Round 2 walk per directive scope; no sub-prompt authoring fired). Push-state-claim sub-shape N=4 maintained (7-session avoidance trajectory at Sessions 23+24+25+26+27+28+29 onset; codification at `b7ec879` empirically validated across 7 sessions; tier-1 stability evidence).
- **Brainstorming-side metafact drift family graduates to N=5 sub-shape catalog at scope-lock-cycle close** — Round 2 surfaces a Sub-Q1 directive-realignment finding (scope-input §4.1 option space empirically wrong against ADR-0020 substrate). The 5-sub-grain catalog established at Round 1 §1.1 (5 divergences across 16 VFDs) extends at Round 2 with a 6th sub-shape: **option-space-framing-against-substrate-grade** drift (the option-space itself was framed against a substrate-evidence-absent baseline; verify-from-disk discipline at Round 2 caught the divergence). Sub-shape catalog count at Round 2 close: scope-input-artifact-authoring + Round-1-VFD + Round-2-option-space-framing = 3 sub-shape grain instances at the discipline application surface. Codification threshold N=3+ per existing pattern; **codification candidate at Phase 7 retrospective**.
- **Substrate-density-compresses-LOC observation N=3 banking candidate** — Round 2 LOC trajectory (target ~500-800 LOC) at per-sub-question walk depth + dispositions. If LOC lands in or below band, N=3 banking holds at sub-curve (b) substrate-fix-narrowness extension. Three-grain consistency (scope-input + Round 1 + Round 2). **Codification candidate at Phase 7 retrospective exploratory framing extension.**
- **Directive-authoring multi-iteration refinement sub-grain N=1 banked at Session 28 (per Session 28 close)** — Round 2 walk evidence validates the 3-iteration refinement cycle approach: Sub-Q26 column-shape contingency (added at refinement iteration 3) caught the substrate-scope expansion at Round 2; Sub-Q24 Candidate #8 substrate verification (added at refinement iteration 3) caught the candidate #8 documented-vs-vapor adjudication at session-onset. Both contingencies fired as designed. Codification threshold N=3+; if subsequent directive cycles (Round 3 directive at Session 30 + Round 4 directive + chunk brief directives + chunk impl directives) surface analogous founder-mediated refinement patterns, candidate emerges at N=3+ for codification consideration at Phase 7 retrospective grade.
- **Sub-Q5 founder-decision surfaces operational discipline pattern** — Round 2's surface-to-founder disposition (vs lock or split-to-Round-3) is the first founder-decision-required disposition in Phase 7. Phase 5.1 cycle had 0 founder-decision dispositions (all 7 sub-questions adjudicated brainstorming-side or split-to-Round-N); Phase 7 cycle introduces founder-decision shape at the operational-budget grade (Modal sidecar in-Phase-7 vs standalone infra session is fundamentally a session-budget-allocation call rather than an architectural-shape call). Sub-shape codification candidate at Phase 7 retrospective if subsequent cycles surface analogous founder-decision shapes at operational-budget grades.
- **Local commits ahead of `origin/staging` post-session:** expected 3 (scope-input artifact at `8ae3886` + Round 1 artifact at `2d97efe` + this Round 2 artifact). No push; banks for Phase 7 terminal-close push per precedent.

---

**Round 2 status:** complete. 5 clean locks + 4 partial locks + 1 founder-decision-required + 1 new Sub-Q27 surface + 1 directive-realignment finding banked. Next operational fire: Sub-Q5 brainstorming-side adjudication, then Phase 7 scope-lock cycle Round 3 per §6.2 prompt inputs (13-sub-question batch covering module placement + classifier + extractor detail + column-shape).
