# ADR-0007: Three-Tier Agent Architecture (with Document Platform Reframe Amendment)

## Status

Ratified 2026-05-03 by CTO with named follow-ups applied in this
commit (Decision-section forward-pointer to Amendment; Tier 2 vs
Tier 2.5 read-boundary clarification covering reference data,
transactional state, and vendor control / payment-risk fields).
Items 3 (prohibition-list duplication) and 5 (Status convention)
accepted as-is per the D1 ratification package's recommended
path.

Amended 2026-05-08 (Phase 2 brief-creation arc-closeout cycle) —
§Tier 2 sense-disambiguation lead-in added (Candidate A inline
clarification distinguishing Tier 2 agent-tier-execution from
ADR-0011 §1's Tier 2 data-layer-entity-ownership sense).
Bundled with ADR-0011 §13 amendment per Stage 4 cross-enum-
consistency governance triage path (a) election. See sense-
disambiguation lead-in within §Tier 2 below.

Amended 2026-05-30 (V1 final-system-proposal reconciliation arc) — §Tier 2 Q78
V1-re-scoping block added. The system-actor auto-commit **authorization model**
resolved by Q78 (Option A, 2026-05-24) is correct and is preserved verbatim. V1
gates the **exercise** of auto-commit behind four prerequisites the auto-commit arc
shipped without — Agent Ladder rung + confidence-to-policy mapping + evaluation
harness + real coding. Until those land, the A-now hotfix routes matched proposals
to `document_cases.needs_review`; auto-commit returns per-rule thereafter. Additive
per ADR-0022; Q78's auth-model resolution unchanged. See the §Tier 2 "V1 re-scoping
of the Q78 auto-commit exercise" block.

## Date

2026-05-03

## Triggered by

Phase 0 governance plan Task C1, which carried ADR-0007 forward as
the Tier 1 (gating prerequisite) ADR for all Phase 1+ Document
Platform code. The ADR number 0007 had been reserved since
2026-04-19 — when `docs/09_briefs/phase-2/agent_architecture_proposal.md`
landed with a CTO approve-in-principle verdict and five
operational-specificity items (Q27–Q31) blocking the formal ADR.
Drafting was deferred per the proposal's §6 recommendation
("Draft ADR-0007 and `docs/02_specs/agent_architecture_policy.md`
during Phase 2 scoping, after Phase 1.3 triage"). The 2026-05-02
Document Platform reframe (per
`docs/09_briefs/phase-2/document_platform_reframe_design.md`) then
introduced the Relationship Router, which exceeded the original
Tier 2 safety contract and required an amendment to be drafted in
the same cycle as the original ADR. C1 collapses both into one
document so the relationship between the original architecture and
the reframe-driven amendment is preserved in a single record.

## Context

### Why the three-tier policy exists

Pre-Phase-2, the codebase committed to one user-facing voice per
ADR-0003 ("One-Voice Agent Architecture"), three internal personas
(AP specialist, controller, executive) sharing a session, and the
Authority Gradient (agents propose, services decide, DB enforces).
ADR-0003 and Simplification 3 of `phase_simplifications.md` both
anticipated that internal decomposition *may* appear in Phase 2+ as
the toolbox grows — but neither defined when, where, or under what
safety contract.

Phase 1 shipped one Double Entry Agent. Phase 2's first concrete
deliverable is the AP Agent. The architecture proposal landed
2026-04-19 to define the discipline that governs decomposition
between those two — preventing the failure mode where a future
contributor introduces multi-agent patterns without a safety
contract, while also avoiding a wholesale rejection of
decomposition that would block legitimate pipeline-shaped workflows
(document ingestion, audit scans, report commentary).

### The motivating problem

Stateful conversational agents can hallucinate. A naive multi-agent
handoff weakens the existing CLAUDE.md §4 anti-hallucination rule —
Agent A retrieves data, Agent B uses it, Agent B never retrieved.
Stateless typed pipelines do not have this failure mode (each
stage's output is structurally validated and the committing agent
re-verifies semantically) — but they need a different
commit-boundary contract than the one CLAUDE.md §4 articulates for
conversational agents.

The three-tier framework resolves this by reframing "single agent
vs. multi-agent" as orthogonal to the actual safety question. The
real rule is: never let any agent mutate state directly — all
commits flow through the Authority Gradient. Whether the path that
produces the proposal is a single LLM call or a multi-stage typed
pipeline does not change that commit-boundary contract, provided
the pipeline never writes and the committing agent re-verifies
field-level semantics before the commit.

### Five gating questions (Q27–Q31)

The proposal's CTO review (2026-04-19) approved the architecture in
principle but identified five operational-specificity items that
had to be resolved before ADR-0007 could be drafted. All five are
filed in `docs/02_specs/open_questions.md`:

- **Q27** — CLAUDE.md §4 amendment for Tier 2 stateless sub-agents
  (governance language, not reinterpretation).
- **Q28** — Re-verification matrix for the Tier 2 → Tier 1 boundary
  (concrete field-level specification).
- **Q29** — Tier 2 boundary enforcement mechanism (build-time lint,
  not convention).
- **Q30** — Logic Receipt reproducibility under Tier 2 pipelines
  (extend `justification` with `pipeline_trace` vs. accept
  step-level reproducibility loss).
- **Q31** — LLM-planned orchestration prohibition (verbatim rule
  for the safety contract).

This ADR closes Q27–Q31 (resolutions in the **Closes** section
below). The Document Platform reframe amendment additionally closes
Q66 and updates Q77 (per the **Amendment** section below).

## Decision

The three-tier framework defines architectural governance for any
agent-shaped work in the codebase. The amendment introduced by the
Document Platform reframe inserts a fourth tier (Tier 2.5) between
Tier 2 and Tier 1 to accommodate read-against-committed-state
workflows that the original Tier 2 contract did not authorize.

The Agent Ladder (`docs/02_specs/agent_autonomy_model.md`) and the
tier policy are **orthogonal**. The Agent Ladder governs autonomy
on the commit path ("how independently can the agent post?"). The
tier policy governs architecture on non-commit paths ("what
internal stages are permitted before a proposal reaches commit?").
They operate in different dimensions and do not interact.

### Tier 1 — Commit Path

**What runs here.** The single committing agent. Any action that
changes financial state runs in Tier 1. There is one Tier 1 agent
per user session; it is the only agent that proposes mutations
through the deterministic service layer (`withInvariants()`,
mutating service entry points, RLS-enforced inserts).

**What it owns.** The Agent Ladder rung policy
(`docs/02_specs/agent_autonomy_model.md`), the Logic Receipt
production (INV-AGENT-002), `withInvariants()` invocation,
`trace_id` / idempotency-key propagation, the user-facing
commit-time experience (ProposedEntryCard rendering, confirmation
flow per ADR-0003).

**What it MUST NOT do.** Tier 1 MUST NOT contain pipeline-shaped
sub-stages on the write path. A single deterministic service call
inside `withInvariants()` is the only legal commit-path shape. Tier
1 MAY consume Tier 2 / Tier 2.5 outputs (a `ProposedMutation` or a
`DocumentRelationshipCandidate`) and MUST re-verify those outputs
per the Q28 matrix before committing.

**Safety contract.** Tier 1 commits route through the Authority
Gradient unchanged: agent proposes → service decides (via
`withInvariants()`) → database enforces (RLS + CHECK + deferred
constraints). Re-verification of Tier 2 / Tier 2.5 inputs happens
inside the Tier 1 service call, not before — which preserves
atomicity (a stale-state check that fails inside `withInvariants()`
rolls back the same way an invariant violation does).

### Tier 2 — Proposal Path

**Sense disambiguation (added by 2026-05-08 amendment).** "Tier 2"
in this ADR refers to **agent-tier execution** — which agent
tier executes a write per the strict no-write rule below. This
is distinct from **Tier 2 (data-layer entity ownership)** per
ADR-0011 §1, which refers to where Document Platform entity
columns live in the data layer. Both senses appear in chounting
documentation; this disambiguation distinguishes them. NOT to be
confused with Tier 2 (data-layer entity ownership) per ADR-0011
§1. See arc-closeout retrospective entry at
`docs/07_governance/friction-journal.md` line 6668 for context;
amendment scope narrow per Phase 2 brief-creation arc-closeout
cycle's Stage 3a path (c) codification bundled with ADR-0011 §13
amendment per Stage 4 governance triage path (a) election.

**What runs here.** Stateless typed pipeline stages. Each stage is
a function `(typed_input) → typed_output` that may wrap an LLM
call, but is otherwise pure: separate system prompt, separate tool
set, no shared session with other stages, no conversation history.
Multiple stages chained by deterministic TypeScript orchestration
produce a `ProposedMutation` consumed by Tier 1.

**What it owns.** Document extraction (OCR, field extraction),
classification (vendor matching, account suggestion, document-type
classification), drafts and analyses whose output is never a state
change (audit-scan output, report commentary, tax research memos).
The first Tier 2 system is the AP Agent's ingestion pipeline (per
the Spend Initiative brief).

**Read boundary — reference data vs transactional state.** Tier 2
MAY read **reference / master data**: vendor identity-and-matching
fields (name, aliases, tax ID, email/domain, address, default
account mapping, historical template association), chart of
accounts, tax codes, classes / projects / departments. These are
the lookups vendor matching and account suggestion need; they are
reference, not state. Tier 2 MUST NOT read **transactional
committed state**: bills, payments, prepayments, credits, open
balances, period status, reconciliation candidates — those reads
require Tier 2.5. Tier 2 also MUST NOT read **vendor
control / payment-risk fields** (bank account, payment
instructions, bank-detail-confirmed flag, payment hold status,
blocked-vendor status) — those are Tier 2.5 territory because they
are payment-readiness state, and any extractor that reads them
risks overstepping into payment-risk logic. Tier 1 re-verifies all
vendor-control fields at commit.

**What it MUST NOT do.** Tier 2 stages MUST NOT call mutating
service entry points. MUST NOT INSERT / UPDATE / DELETE in any
table directly. MUST NOT read transactional committed state or
vendor control / payment-risk fields (per the Read boundary
above). MUST NOT participate in shared sessions. MUST NOT plan
their own orchestration via LLM coordination.

**Safety contract (inviolable).** Preserved verbatim from the
2026-04-19 architecture proposal:

1. **No direct writes. Tier 2 stages never call mutating services
   or insert into tables.** All commits route through Tier 1.
   Mechanical enforcement is per Q29 (resolved below): an ESLint
   rule on `src/agent/pipelines/**/*` derived from the existing
   `no-unwrapped-service-mutation` rule's allowlist.
2. **Structured handoffs only.** Stage-to-stage communication is
   typed Zod-validated JSON. Zod constrains structural telephone
   (the shape of the data cannot drift between stages); semantic
   telephone is constrained by contract item 3 and human visibility
   at the ProposedEntryCard.
3. **Re-verification at the commit boundary.** The committing
   Tier 1 agent re-fetches and re-validates data with financial
   semantics (amounts, accounts, entities, period-affecting dates)
   per the Q28 re-verification matrix. The framework matrix is
   defined here (see Q28 resolution below); the **expanded matrix**
   covering the four re-verification surfaces named in the
   amendment lands in `docs/02_specs/agent_architecture_policy.md`
   per Q77 before v1 ships.
4. **Trace propagation.** Every stage emits trace records linked by
   the existing `trace_id` per INV-AUDIT-001.
5. **Populate existing `ProposedMutation.justification.*` fields.**
   The Logic Receipt (INV-AGENT-002) is produced by Tier 1 as
   today. Per Q30 resolution below, `justification` extends with a
   `pipeline_trace: PipelineStageRecord[]` field (and a parallel
   `bundle_audit_trace: BundleAuditRecord[]` field per ADR-0012 §6,
   both codified as `ProposalJustificationSchema` at Phase 8 chunk 9)
   so step-level reproducibility is preserved under Tier 2 pipelines.

**System-actor service contexts at the invariant boundary (Phase 8
chunk 10 — PARTIAL).** The document-pipeline orchestrator
(`ingestDocument.ts`) runs as a *system actor*
(`SystemActorServiceContext`: `caller.user_id = null`,
`caller.system_actor = 'pipeline_orchestrator'`), not a verified human
caller. Chunk 10 widened the **router-path** consumer
`documentRouterService.completeCandidate` to accept
`ServiceContext | SystemActorServiceContext` directly, retiring the
`synthCtxForRouter` shim (extending the N=2 structural-union precedent
already shipped at `recordMutation.ts:144` + `vendorService.ts:124`).
This path does not run `withInvariants`, so no authorization semantics
change. The **commit-path** widening of `withInvariants` itself is
**deliberately NOT done here**: the surviving `synthCtxForCommit` shim
downgrades the system-actor context to a synthetic *verified* caller
whose `user_id` has no membership, so Invariant 4 (role authorization)
denies — which is currently the de-facto gate preventing the document
pipeline from auto-committing ledger mutations. **Open question:** does
a trusted system actor bypass Invariant 4 at `withInvariants`, or must
every auto-commit path carry an explicit grant? Admitting
`SystemActorServiceContext` at `withInvariants` is a ledger-authorization
**policy** decision deferred to a dedicated change with seeded
auto-commit tests; until then the pipeline does not auto-commit. The
"system_actor widening at withInvariants" framing is therefore only
partially discharged at chunk 10. See the friction-journal Phase 8
chunk 10 entry. **Resolved 2026-05-24 (Option A) — the open question
above is closed by the auth-model resolution block immediately below;
the PARTIAL framing is preserved per ADR-0022 additive discipline.**

**Auth-model resolution for system-actor commit paths (ratified
2026-05-24, Option A — closes Q78).** The chunk 10 PARTIAL open
question — *does a trusted system actor bypass Invariant 4 at
`withInvariants`, or must every auto-commit path carry an explicit
grant?* — is resolved in favor of **bypass (Option A)**, not
per-action grants. A `SystemActorServiceContext`
(`caller.user_id = null`, `caller.system_actor` set) is authenticated
**at the boundary that constructs it** (the route / job-queue / pipeline
orchestrator), not via role-based grants. `withInvariants` is widened to
`ServiceContext | SystemActorServiceContext`; the system-actor branch
**bypasses the identity-coupled invariants** — Invariant 1's `user_id`
presence check, Invariant 2 (`verified`), and Invariant 4 (role
authorization via `canUserPerformAction`). Invariant 3 (org consistency)
already self-skips for system actors (it guards on `caller.org_ids`,
absent on a system actor); the widened branch may instead assert
`ctx.org_id === input.org_id` as defense-in-depth. The `trace_id` and
context-presence checks still run.

*Precedent and trust-boundary discipline.* This extends the N=2
structural-union type pattern (`recordMutation.ts` + `vendorService.ts`
accept `ServiceContext | SystemActorServiceContext`), but note those two
sites perform **no authorization** — they read union-common fields only.
This resolution is therefore the **first** place a system actor crosses
an authorization boundary with invariants intentionally bypassed. The
trust boundary moves to the construction site: a `SystemActorServiceContext`
must only be constructed where the operation is intrinsically authorized
by the calling context. New system actors must be scoped narrowly;
`system_actor = 'pipeline_orchestrator'` is authorized for the document
pipeline's commit operations (`bill.post`, `payment.record`) by virtue of
the orchestrator's own route/job-queue authentication, not by a grant
list.

*Created-by + audit attribution — Path X (ratified 2026-05-24).* The
payment commit path carries a NOT-NULL actor column
(`bill_payment_allocations.created_by`); `journal_entries.created_by` and
`audit_log.user_id` are nullable, and `bills` / `payments` have no
`created_by` column. So a null-`user_id` system actor cannot complete a
payment commit (the allocation insert violates NOT NULL) — opening the gate
is necessary but not sufficient. Resolution: **one seeded service-account
`auth.users` row** (`SYSTEM_ACTOR_USER_ID`, `system_actor =
'pipeline_orchestrator'`) with **no memberships or roles** (auth is
bypassed, so it needs none). System actors carry its uuid as
`caller.system_user_id`; at the commit gate `withInvariants` bypasses the
identity invariants and **adapts** the system-actor context to a verified
`ServiceContext` whose `user_id` is that uuid, so `created_by` **and** audit
`user_id` resolve to it automatically downstream — **no ledger-service
changes** (`billService` / `paymentService` / `journalEntryService`
untouched). So an auto-committed bill/payment
is attributed to a real, joinable service-account identity — **no
`audit_log` schema change is required** (the service-account uuid in
`user_id` is the attribution; this supersedes an earlier draft that
proposed a nullable `audit_log.system_actor` column). `caller.user_id`
stays `null` for the authorization discriminant; the service-account uuid
is used only for attribution, never for authorization.

*Mechanics.* `synthCtxForCommit` (the de-facto gate) is retired;
`ingestDocument`'s four commit-path `withInvariants` sites pass the
orchestrator's real `SystemActorServiceContext` directly. With the gate
open, the document pipeline auto-commits ledger mutations for matched
candidates; `service-layer.md` Candidate #11 (commit-shim discipline) is
retired as structurally unnecessary post-widening.

**V1 re-scoping of the Q78 auto-commit exercise (ratified 2026-05-31 by CTO).**

Q78 (Option A, ratified 2026-05-24, immediately above) resolved the
**authorization model** — a trusted `SystemActorServiceContext` bypasses the
identity-coupled invariants at `withInvariants` and is attributed to a seeded
service-account identity (Path X). That resolution is correct and is **preserved
unchanged.** What Q78 did *not* establish — and what the auto-commit arc
(edb260f6, 8a6c9bc3) shipped without — is the **governance of the auto-commit
exercise**: which matched candidates *should* post without a human, under what
autonomy rung, at what confidence, coded to which account.

**Live posture at HEAD 11633dc6.** `ingestDocument` runs the Ring 2B shadow
rule/autonomy evaluation (`shadowEvaluateRules`, `ingestDocument.ts:445`), which is
gated (`RING2B_SHADOW_EVAL`, default off), fail-safe, and explicitly ordered
*before* the commit so it cannot influence it (A1a). The commit composite
(`switch (proposal.kind)`, `ingestDocument.ts:482`) then auto-posts every matched
`proposed_entry_card` / `proposed_mutation_bundle` via
`withInvariants(billService.post)` / `withInvariants(paymentService.record)`
(inside `commitProposedEntryCard`, `ingestDocument.ts:551`/`:560`). The de-facto
gate is therefore *"can a structurally valid bill be assembled?"* — matched vendor
+ amount + date + org defaults — **not** an autonomy decision. Coding is a single
hardcoded `default_expense_account_id` (`CAD`, `tax=0`); unmatched-vendor invoices
return `null` and are silently dropped (no review-queue entry).

**Why this re-scopes Q78 without contradicting it (auth model vs. exercise).** Q78
answered a question in **one dimension** — *may a trusted system actor cross the
`withInvariants` authorization boundary?* It did **not** answer the question in the
orthogonal dimension — *should an ungoverned matched candidate auto-post, and under
what autonomy controls?* Q78 resolved the authorization model; it
never reached the autonomy-governance question, so it could not have decided it.
V1 fills that second dimension — rung + confidence + evaluation + real coding — which
Q78's auth-model resolution neither provided nor displaced.

*(Preempting the supersession reading.)* The deliberate Q78 decision (2026-05-24)
postdates ADR-0007's calibration deferral. A reader might ask whether Q78 therefore
*overtook* that deferral. It did not: Q78 is silent on autonomy governance — opening
the authorization boundary is not a decision that ungoverned candidates should post.
So there is nothing for Q78 to have overridden in the calibration dimension.

*(Corroboration, referent-independent.)* Independently, ADR-0007 deferred auto-post
calibration ("to v1.5 or later" in the project's earlier phase-lifecycle numbering —
Phase 1 / 1.5 / 2 — a different referent from this proposal's "V1" system release;
the two are not equated here). The auto-commit arc shipped auto-commit **ahead of any such
calibration milestone under either numbering.** This is corroboration, not the
load-bearing argument — being pre-Q78, it is consistent with the re-scoping rather
than dispositive of it; the load-bearing argument is the auth-model/exercise
separation above. V1 therefore does not introduce a new constraint so much as
supply the autonomy governance the auto-commit *exercise* always required.

**V1 re-scoping — the four return-prerequisites.** The system-actor auto-commit
capability returns **per rule** only once all four hold:

1. **Rung.** The matched rule's `rule_autonomy_rung` permits auto-commit, decided
   by the Autonomy Gate **on the live commit path** (not in shadow).
2. **Confidence.** A confidence-to-policy mapping routes low-confidence proposals
   to review (ADR-0002; confidence is a policy input, never surfaced raw).
3. **Evaluation.** The V1 evaluation harness establishes a published
   match/extraction precision threshold on a golden set.
4. **Real coding.** The account is derived from the matched rule's
   `vendor_rules.default_account_id`, not a hardcoded default.

**Enacting change — the A-now hotfix.** Until the four prerequisites land, the
`ingestDocument` commit composite does **not** call the post sites for matched
candidates. It transitions the case to `document_cases.needs_review` (via
`update_document_case_state_with_audit`), where a human approves and the post fires
under the human's `ServiceContext` — not the system actor. Unmatched-vendor
invoices route to the review / exception queue rather than returning `null`. This
restores human-in-the-loop AP for V1 (the review-and-post posture).

**What this block does NOT change (additive per ADR-0022).** Q78's
authorization-model resolution — Option A invariant bypass + Path X
service-account attribution + the `synthCtxForCommit` retirement — is unchanged.
When auto-commit returns per-rule post-V1, it uses **exactly** the Q78 mechanism:
the system-actor `withInvariants` bypass and the seeded service-account
attribution. This block re-scopes *when the capability is exercised*, not *how the
auth model works*. No invariant is added, removed, or renumbered.

Cross-ref: V1 Final System Proposal (v2); this amendment is ordered as the first
Wave -1 change, ahead of the A-now hotfix it authorizes.

**Q31 — LLM-planned orchestration prohibition.** Verbatim rule:

> Orchestration between Tier 2 stages MUST be deterministic
> TypeScript. LLM-planned orchestration is prohibited. A stage's
> role is to produce a typed output from a typed input; a stage
> does not decide which stage runs next. The orchestrator module is
> a plain function that calls stages in a fixed sequence.

The orchestrator is a TypeScript function calling stages in a fixed
sequence — not an LLM coordinator, not a stage that decides which
stage runs next. The illustrative shape (from the 2026-04-19
proposal):

```typescript
async function ingestDocument(orgId: string, fileId: string, traceId: string) {
  const ocrText = await runOCR(fileId);
  const extracted = await extractFields(ocrText, traceId);
  const vendorMatch = await matchVendor(orgId, extracted.vendor, traceId);
  const accounts = await suggestAccounts(orgId, extracted.lines, traceId);
  return buildProposedMutation({ extracted, vendorMatch, accounts, traceId });
}
```

This rule prevents the failure mode where a future contributor
argues "my LLM coordinator is just a typed function" and reintroduces
the dynamic-dispatch / multi-agent-chat pattern the three-tier
policy is designed to prevent.

### Tier 2.5 — Read-Only Ledger-Aware Path (introduced by Document Platform reframe amendment)

The Tier 2.5 addition is introduced here as part of the Decision;
see the Amendment section below for the three-option deliberation
(Tier 2 amendment / Tier 2.5 / Tier 1 read-only pre-commit) that
led to this placement.

**What runs here.** Stateless typed pipeline stages that read
against committed ledger state to produce relationship-match
candidates and other ledger-state-aware proposals. The
load-bearing first consumer is the Relationship Router introduced
by the 2026-05-02 Document Platform reframe. The Router reads
open bills, vendor balances, vendor prepayment balances, and
vendor credit balances against committed accounting state to
produce `DocumentRelationshipCandidate` objects (receipt-to-bill
matches, vendor-prepayment-application proposals, credit-memo
applications).

**What it owns.** Relationship matching, domain-intent
classification (`DomainIntentCandidate`), and any future workflow
whose output depends on reading committed ledger state but whose
output is never a write.

**Read boundary — transactional state and vendor control fields.**
Tier 2.5 is the only tier authorized to read **transactional
committed state**: bills, payments, prepayments, credits, open
balances, period status, reconciliation candidates. Tier 2.5 also
reads **vendor control / payment-risk fields** (bank account,
payment instructions, bank-detail-confirmed flag, payment hold
status, blocked-vendor status) when producing relationship or
payment-readiness candidates — those fields are payment-state, not
matching reference data, and Tier 2 is prohibited from touching
them (see Tier 2's Read boundary above). Tier 2.5 may also read
the same reference data that Tier 2 reads (vendor matching fields,
chart of accounts, tax codes, classes / projects / departments) —
the reference data is not exclusive to Tier 2.

**What it MUST NOT do.** Tier 2.5 stages MUST NOT write. MUST NOT
INSERT / UPDATE / DELETE. MUST NOT call any mutating service. MUST
NOT plan their own orchestration via LLM coordination (the same
Q31 rule applies). MUST NOT make stage-to-stage handoffs that are
not Zod-validated.

**Safety contract.** Verbatim:

- Tier 2.5 stages MAY read from the committed ledger state and from
  `source_documents` / `document_artifacts`.
- Tier 2.5 stages MUST NOT write. No INSERT / UPDATE / DELETE /
  call to any mutating service.
- Tier 2.5 stages MUST be deterministic TypeScript orchestration.
  LLM-planned matching is prohibited (the same Q31 rule applies).
- Tier 2.5 stages produce Zod-validated output
  (`DocumentRelationshipCandidate`, `DomainIntentCandidate`).
- Tier 1 re-verifies every Tier 2.5 output at the commit boundary
  per the expanded Q28 matrix (see "Q28 expansion to four
  re-verification surfaces" in the Amendment section below).
- Idempotency: Tier 2.5 stages produce the same output for the same
  input across re-runs (ADR-0010 reserved-enum-states discipline
  applies for any new enums introduced).

The amendment block below records why this tier was introduced and
the three-option deliberation that produced the (b) Tier 2.5
choice.

### Tier 3 — Interface Path

**What runs here.** The user-facing voice. The user sees one agent
regardless of how many internal tiers contributed to a proposal —
ADR-0003's one-voice rule is preserved unchanged.

**What it owns.** The conversational copilot, support flows, policy
Q&A, onboarding, exception explanation. The persona-handling rules
in ADR-0006 (agent persona unnamed) govern what the user-facing
agent calls itself.

**What it MUST NOT do.** Tier 3 MUST NOT expose Tier 2 / Tier 2.5
internal complexity to the user surface. Internal pipeline stage
names, sub-agent identifiers, intermediate Zod outputs, and
pipeline trace records do not surface in the conversational UI.
The user sees a `ProposedEntryCard` produced by "the agent," not
"the AP Agent's vendor-matcher stage rev 3."

**Safety contract.** Governed by ADR-0003 (one-voice) and ADR-0006
(agent persona unnamed). Tier 3 is a façade over Tier 1 / Tier 2 /
Tier 2.5; the façade preserves the user-experience contract and is
the only place the user encounters agent output.

### Feature mapping

- **Tier 1:** journal posting, reversals, period close, payment
  execution, invoice finalization, tax calc, depreciation, rev rec
  posting, reconciliation commits, master data writes.
- **Tier 2:** document ingestion (OCR, field extraction), expense
  coding, audit scans, reconciliation match suggestions, report
  commentary, tax research memos, variance analysis, anomaly
  triage, contract interpretation.
- **Tier 2.5:** Relationship Router (receipt-to-bill matching,
  vendor-prepayment-application proposals, credit-memo
  applications), domain-intent classification.
- **Tier 3:** conversational copilot, support, policy Q&A,
  onboarding, exception explanation.

### Canonical-rule preservation

Per `intent_model.md`: *"No entry path has bespoke routing."* Tier
2 and Tier 2.5 are not new entry paths — they are
proposal-generating machinery whose output is a `ProposedMutation`
flowing through existing handlers. New routing surface: zero.

## Consequences

### What this enables

- The AP Agent (first Phase 2 Tier 2 system) ships with a
  pre-defined safety contract rather than a per-system improvisation.
  The pipeline shape is already the target of the existing Phase 2
  scope (`phase_plan.md`).
- The Relationship Router (first Tier 2.5 system) ships with a
  contract that authorizes its read-against-committed-state pattern
  while constraining its write-side to zero — closing the
  ledger-corruption failure mode for relationship-match systems.
- Logic Receipt reproducibility (INV-AGENT-002) survives the Tier 2
  introduction. The `pipeline_trace` field captures per-stage
  inputs, outputs, model versions, and timestamps so byte-for-byte
  replay is possible.
- The Tier 2 ESLint enforcement (Q29 resolution) makes the
  "no direct writes" rule mechanical rather than conventional.
  Future authors who try to import a mutating service entry point
  from `src/agent/pipelines/**/*` get a build-time failure with a
  crisp error message, not a code-review catch.
- Audit-trail cohesion: `trace_id` propagates across stages so a
  debugging session reads one trace, not N conversations.

### What this constrains

- Every future feature that introduces an LLM-shaped subsystem must
  declare which tier it ships in and must satisfy that tier's
  safety contract. A subsystem that does not fit cleanly in any
  tier requires either an ADR amendment or a new tier — not a
  freeform exception.
- LLM-planned orchestration is prohibited at every tier. Future
  proposals to introduce dynamic stage dispatch, LLM coordinators,
  or multi-agent chat handoffs are out-of-scope unless this ADR is
  amended or superseded.
- The Q28 matrix is load-bearing. If the matrix is not maintained
  as new document types or relationship patterns ship, the Tier 2 /
  Tier 2.5 → Tier 1 boundary loses its compensating control. The
  matrix expansion landing in `docs/02_specs/agent_architecture_policy.md`
  per Q77 is a v1-ship gate, not a v1-code gate — but failure to
  maintain it post-v1 reopens the semantic-telephone failure mode.
- No general pipeline framework abstraction lands until at least
  two real Tier 2 systems have shipped (per Simplification 3). The
  AP Agent is the first; the second has not yet been named. Until
  then, each Tier 2 pipeline ships its own orchestrator function
  and the shared shape is allowed to remain implicit.

### What this costs

- One additional `pipeline_trace` field on `ProposedMutation`
  (Q30 resolution) — schema change, type-regeneration, and Logic
  Receipt rendering UI update.
- One ESLint rule on `src/agent/pipelines/**/*` (Q29 resolution) —
  derived from the existing `no-unwrapped-service-mutation`
  allowlist, so the maintenance cost is shared with that rule.
- The Q28 matrix as a maintained artifact in
  `docs/02_specs/agent_architecture_policy.md`. The matrix is
  expected to grow as new document types and relationship patterns
  ship; Phase 0 governance plan Task E2 drafts the initial matrix.

## Closes

- **Q27** — CLAUDE.md §4 anti-hallucination wording. Resolution:
  option (b) — exception clause in ADR-0007 explicitly superseding
  §4 for Tier 2 / Tier 2.5 sub-agent calls. Verbatim text:

  > CLAUDE.md §4 item 3 ("No agent may reference an account code,
  > vendor name, or amount it has not first retrieved from the
  > database in the current session") applies to the Tier 1
  > committing agent's session. Tier 2 stateless stages produce
  > tool-like outputs that are re-verified by Tier 1 at the commit
  > boundary per the Q28 re-verification matrix.

  Option (b) is preferred over (a) because it consolidates the
  policy in this ADR rather than splitting governance across
  CLAUDE.md and ADR-0007. CLAUDE.md §4 itself is not edited; this
  ADR's exception clause is the authoritative reading for the
  stateless-pipeline case.

- **Q28 (initial scope)** — Tier 2 → Tier 1 re-verification matrix.
  Resolution: framework defined here; expanded matrix lands in
  `docs/02_specs/agent_architecture_policy.md` per Q77 (Phase 0
  governance plan Task E2). The framework matrix has the
  field-level shape from the original Q28:

  | Field | Source | Re-verification at Tier 1 | Failure mode |
  |---|---|---|---|
  | `amount` | LLM from document | Human confirms on ProposedEntryCard | User edit before approve |
  | `vendor_id` | Matcher stage | Re-call `getVendor(id)`; verify org scope | Reject if not found |
  | `account_code` | Account-suggest stage | Must exist in `listChartOfAccounts(org_id)` | Reject if absent |
  | `entry_date` | Document | Re-call `checkPeriod(entry_date)` before commit | Period-locked → reject |
  | `tax_code_id` | Document | Must exist in seeded `tax_codes` | Reject if absent |

  The expanded matrix (per the Document Platform reframe amendment
  below — four re-verification surfaces) lands in
  `docs/02_specs/agent_architecture_policy.md` before v1 ships;
  this ADR captures the framework.

- **Q29** — Tier 2 boundary enforcement mechanism. Resolution:
  ESLint rule that prevents files under
  `src/agent/pipelines/**/*` from importing mutating service entry
  points. The mutating set derives from the existing
  `no-unwrapped-service-mutation` rule's allowlist, so adding a
  new mutating service function automatically extends the Tier 2
  prohibition. Concrete lint design lands in
  `docs/02_specs/agent_architecture_policy.md` alongside the Q28
  matrix.

- **Q30** — Logic Receipt reproducibility under Tier 2 pipelines.
  Resolution: option (a) — extend `ProposedMutation.justification`
  with a `pipeline_trace: PipelineStageRecord[]` field. Each stage
  record carries `stage_name`, `input_hash`, `output_hash`,
  `model`, `timestamp`. Per-stage reproducibility is preserved.
  This is the choice the AP brief's §4 already mandated, and the
  Document Platform reframe spec preserves it. Schema extension
  lands with Tier 2's first system (the AP Agent).

  **Amendment (Phase 8 chunk 9, Layer 2 item #B) — RESOLVED in
  code.** The `justification` field is formally codified as
  `ProposalJustificationSchema` at
  `@/shared/schemas/accounting/proposalJustification.schema`,
  superseding the Phase 7 chunk 7.3b permissive placeholder
  (`z.record(z.string(), z.unknown()).optional()`) carried on
  ProposedMutation, ProposedAttachment, ProposedMutationBundle, and
  ProposedAttachmentCard. The schema carries the `pipeline_trace:
  PipelineStageRecord[]` field above **plus** a parallel
  `bundle_audit_trace: BundleAuditRecord[]` field for
  bundle-composition Logic Receipts per ADR-0012 §6 INV-AGENT-002
  (`bundle_id`, `composition_at`, `child_proposal_ids`,
  `invariant_class`). Both traces are required (possibly empty
  arrays); the remaining Logic-Receipt fields (`user_utterance`,
  `rule_id`, `input_features`, `historical_match_count`,
  `confidence_score`, `source_transactions`) are optional.

- **Q31** — LLM-planned orchestration prohibition. Resolution:
  verbatim rule (in the Tier 2 safety-contract subsection above).
  The rule applies to Tier 2 and Tier 2.5 equally.

- **Q66** — Relationship Router tier placement. Resolution:
  Tier 2.5 (option (b)) per the Document Platform reframe
  amendment below. The Router has read-only ledger access, is
  idempotent, uses no LLM-planned matching, and produces
  Zod-validated `DocumentRelationshipCandidate` reverified by
  Tier 1 before commit.

## Updates

- **Q77** — Q28 re-verification matrix expansion scope. This ADR
  defines the four expansion surfaces (document-type-aware fields,
  relationship-claim, stale-state TOCTOU, bundle); the detailed
  per-field matrix lands in `docs/02_specs/agent_architecture_policy.md`
  before v1 ships. Q77 stays open until that matrix ratifies (which
  gates v1 ship, not Phase 1 start).
- **Q78** — System-actor authorization at `withInvariants` (auto-commit
  auth model). Resolution (2026-05-24): **Option A** — a trusted system
  actor (`ctx.caller.user_id === null`, `caller.system_actor` set)
  bypasses the identity-coupled invariants (Inv 1 `user_id` presence,
  Inv 2 `verified`, Inv 4 role authorization) at `withInvariants`; the
  trust boundary is the route/job-queue/orchestrator that constructs the
  `SystemActorServiceContext`. Auto-committed ledger mutations are
  attributed to a seeded service-account `auth.users` identity (Path X)
  via `created_by` + audit `user_id` (resolved by the `withInvariants`
  service-account adaptation) — satisfying the one NOT-NULL actor column in
  the commit path (`bill_payment_allocations.created_by`) and preserving
  audit attribution with no `audit_log` schema change. Retires the `synthCtxForCommit`
  de-facto gate; closes the Phase 8 chunk 10 PARTIAL open question. See the
  §Tier 2 auth-model resolution block.
- **Q78 (V1 re-scoping, ratified 2026-05-31 by CTO).** The Option A authorization-model
  resolution above is **unchanged**. Q78 resolved *whether* a system actor may
  commit; it did not resolve *whether* an ungoverned candidate should auto-post —
  an orthogonal dimension it never reached. V1 supplies that governance: it gates
  the *exercise* of system-actor auto-commit behind four prerequisites (rung +
  confidence + evaluation + real coding); the A-now hotfix routes matched proposals
  to `document_cases.needs_review` until they land; auto-commit returns per-rule
  thereafter, using the unchanged Q78 mechanism. ADR-0007 independently deferred
  auto-post calibration ("v1.5 or later" in the project's earlier phase numbering,
  Phase 1 / 1.5 / 2 — not the proposal's "V1" referent); the auto-commit arc shipped
  ahead of any such milestone. See the §Tier 2 "V1 re-scoping of the Q78 auto-commit exercise" block.

## Amendment — Document Platform reframe (2026-05-03)

The 2026-05-02 reframe (per
`docs/09_briefs/phase-2/document_platform_reframe_design.md`)
introduced the Document Platform substrate, which contains a
**Relationship Router** that reads against committed ledger state
(open bills, vendor balances, vendor prepayment balances) to
produce relationship-match candidates. This read pattern was not
authorized by the Tier 2 safety contract above ("No direct writes"
permitted reads but the contract was framed for stateless
extraction stages, not for ledger-state-aware matching).

This amendment resolves the Tier-placement question for the
Relationship Router and the Q27 anti-hallucination wording
extension that the read pattern requires.

### Tier-placement decision

The reframe spec §9 named three options:

- **(a) Amend ADR-0007 to authorize Tier 2 reads against committed
  ledger state**, with the Q28 re-verification matrix expanded to
  cover relationship-match outcomes. Safety contract: same as
  current Tier 2 plus an authorization clause for ledger reads.
  Tradeoff: over-extends Tier 2's stateless contract — Tier 2 was
  framed for stateless extraction; allowing arbitrary ledger
  reads inside a Tier 2 stage blurs the contract and weakens the
  enforcement boundary (a future Tier 2 stage might justify a
  read-against-state pattern that is not actually idempotent or
  not actually deterministic).

- **(b) Introduce a Tier 2.5** specifically for the Relationship
  Router, with its own safety contract — read-only against ledger
  state, idempotent, no LLM-planned matching, output as
  Zod-validated `DocumentRelationshipCandidate`, reverified by
  Tier 1 before commit. Safety contract: a strict subset of
  Tier 1 (no writes, no commits) plus a strict superset of Tier 2
  (ledger reads permitted). Tradeoff: introduces a new tier in the
  framework, which adds documentation and ADR maintenance cost.

- **(c) Place the Relationship Router in Tier 1 as a read-only
  pre-commit proposal-shaping stage.** Safety contract: same as
  Tier 1; the Router becomes part of the commit-path service flow
  but produces no writes. Tradeoff: over-loads Tier 1 with shaping
  responsibilities. Tier 1 today is a single deterministic service
  call inside `withInvariants()`; conflating "shaping" (matching
  receipts to bills) with "committing" (posting the journal entry)
  inside Tier 1 pushes domain-knowing match logic into the commit
  path. The first time a Router bug produces a wrong match, the
  failure mode is a wrong commit rather than a wrong proposal.

**Decision: option (b) Tier 2.5.** Reason: the Router is not just
extraction (so (a) over-extends Tier 2's stateless contract) but
also should not be part of the write path (so (c) over-loads Tier 1
with shaping responsibilities). Tier 2.5 gives the Router the right
safety contract — read-only, idempotent, deterministic
orchestration, Zod-validated output, no direct writes, reverified
by Tier 1 at commit.

The Tier 2.5 safety contract is captured verbatim in the **Tier 2.5
— Read-Only Ledger-Aware Path** subsection of the **Decision**
section above. This Amendment section is the forward-pointer to
that subsection and the record of the reframe driver.

### Q27 wording extension for read-against-state

The original Q27 wording amended CLAUDE.md §4 to distinguish
stateful conversational agents from stateless pipeline stages.
Under this amendment, the Q27 wording extends to cover the
Relationship Router's read pattern: the Router **reads from
committed accounting state at request time** to produce match
candidates. This is **request-time context retrieval**, not session
memory — the data the Router uses comes from the database, freshly
read at the moment the Router runs, and is re-verified by Tier 1
before commit per the expanded Q28 matrix. The Q27 resolution above
covers Tier 2 stateless stages and Tier 2.5 read-only stages
equally.

### Q28 expansion to four re-verification surfaces

Per reframe spec §12, the Q28 matrix expands to four
re-verification surfaces. The detailed per-field matrix lands in
`docs/02_specs/agent_architecture_policy.md` (Phase 0 governance
plan Task E2 drafts it; ratification gates v1 ship per Q77). This
ADR names the four surfaces verbatim:

1. **Document-type-aware field re-verification.** Different fields
   matter for invoices vs receipts vs credit memos vs vendor
   statements. The matrix is per-document-type, not generic.

2. **Relationship-claim re-verification.** Was the receipt-to-bill
   match correct? The Router can produce plausible-but-wrong
   matches. Tier 1 re-verifies the match before commit.
   Specifically: (a) the receipt still matches the candidate
   Bill #N; (b) the candidate vendor_prepayment still has remaining
   balance sufficient for the application amount; (c) the candidate
   credit memo still applies to the selected bill; (d) the Tier-2
   vendor match still resolves to the same vendor at commit time
   (vendor master may have been merged or renamed).

3. **Stale-state re-verification (time-of-check / time-of-use).**
   Concurrency hazard. A proposal sits in the queue; underlying
   state may have changed: (a) Bill #N is still in `posted` state
   (not paid by another mutation); (b) the vendor_prepayment row
   still has the same remaining balance; (c) the vendor_credit row
   still has unapplied balance; (d) the ledger period containing
   the bill's accounting_date is still open; (e) the vendor's
   bank-detail-confirmation flag has not flipped. Stale-state
   checks fire at commit time inside `withInvariants()`; the matrix
   specifies which reads each commit path performs.

4. **Bundle re-verification.** Compound mutation balances to zero.
   A born-paid bundle that posts `Dr Expense $100 / Cr AP $100`
   then fails to post the matching `Dr AP $100 / Cr Bank $100` due
   to a downstream service error must roll back atomically per the
   ProposedMutationBundle ADR (ADR-0012).

Cross-references: Q66 (Tier-placement decision, resolved by this
amendment); Q77 (Q28 expansion scope, drafted in
`agent_architecture_policy.md`).

## Alternatives considered

### Tier-placement alternatives (reframe amendment)

**Option (a) — Amend Tier 2 to authorize ledger reads.** Rejected.
Over-extends Tier 2's stateless contract. Tier 2 was framed for
stateless extraction stages whose inputs are documents and whose
outputs are typed extractions. Authorizing arbitrary ledger reads
inside a Tier 2 stage blurs the contract — the next author who
wants to do something stateful but not extraction-shaped argues
"my stage reads ledger state, just like the Relationship Router,
so it fits in Tier 2." The boundary that prevents this drift is
the explicit Tier 2 / Tier 2.5 split.

**Option (c) — Place the Router in Tier 1 as a pre-commit shaping
stage.** Rejected. Over-loads Tier 1 with shaping responsibilities.
Tier 1 today is a single deterministic service call inside
`withInvariants()`; conflating "shaping" (matching receipts to
bills) with "committing" (posting the journal entry) inside Tier 1
pushes domain-knowing match logic into the commit path. The
first time a Router bug produces a wrong match, the failure mode
is a wrong commit rather than a wrong proposal — and the
compensating control for the Router's match logic (Q28
relationship-claim re-verification) was designed to fire at the
Tier 1 boundary, not inside Tier 1's commit flow.

### Original ADR alternatives

**Single-agent only, no decomposition permitted.** Rejected. The
original instinct rejected multi-agent wholesale, but the rejection
was too blunt — it conflated "naive conversational handoffs" with
"structured-output pipelines with typed handoffs," which are
different patterns with different risk characteristics. The
three-tier policy keeps the single-agent rule for commits (Tier 1)
and user interface (Tier 3) while permitting bounded pipelines for
proposals (Tier 2 / Tier 2.5).

**Multi-agent without a tier framework.** Rejected. Without an
explicit tier framework, every multi-agent pattern is a per-system
improvisation. The compensating control (commit-boundary
re-verification, no-direct-writes, deterministic orchestration)
becomes a thing every system has to derive independently, which
creates space for systems that ship without the controls.

**LLM-planned orchestration permitted in Tier 2.** Rejected — see
Q31 verbatim rule. LLM coordinators reintroduce the dynamic-dispatch
pattern the three-tier policy is designed to prevent. A future
author who wants this pattern must amend or supersede this ADR, not
add it to a Tier 2 system as a special case.

## Cross-references

- **`docs/09_briefs/phase-2/agent_architecture_proposal.md`** —
  the original architecture proposal (CTO-approve-in-principle
  2026-04-19). This ADR is drafted from §3 (the policy) and §2
  (the reasoning trail).
- **`docs/09_briefs/phase-2/document_platform_reframe_design.md`** —
  §9 (Tier 2 / Tier 2.5 / Tier 1-pre-commit dependency on ADR-0007),
  §12 (Q28 evolution — explicit dependency). The amendment scope
  is defined by these two sections.
- **`docs/02_specs/open_questions.md`** — Q27, Q28, Q29, Q30, Q31
  (closed by this ADR); Q66 (closed by the amendment); Q77
  (updated by this ADR; remains open until the expanded Q28 matrix
  ratifies).
- **`docs/02_specs/agent_architecture_policy.md`** — the
  authoritative re-verification matrix lands here (Phase 0
  governance plan Task E2). This ADR captures the framework; the
  matrix is the operational artifact.
- **`docs/02_specs/agent_autonomy_model.md`** — the Agent Ladder.
  Orthogonal to the tier policy.
- **ADR-0003** (`0003-one-voice-agent-architecture.md`) — the
  one-voice rule preserved by Tier 3. The architecture proposal
  operationalized ADR-0003's "may in Phase 2+ route tasks to
  specialized sub-orchestrators" clause.
- **ADR-0006** (`0006-agent-persona-unnamed.md`) — governs Tier 3's
  user-facing surface.
- **ADR-0010** (`0010-reserved-enum-states.md`) — applied to any
  new enums introduced by Tier 2.5 stages (per the Tier 2.5 safety
  contract idempotency clause).
- **ADR-0011** (`0011-document-platform.md`) — Document Platform
  spine. §1 entity ownership boundary uses Tier 2 in
  data-layer-entity-ownership sense (NOT to be confused with this
  ADR's agent-tier-execution sense per the sense-disambiguation
  lead-in within §Tier 2 above). Cross-referenced by 2026-05-08
  amendment (Phase 2 brief-creation arc-closeout cycle).
- **ADR-0012** (forthcoming, `ProposedMutationBundle`) — referenced
  by the bundle re-verification surface (Q28 surface 4).
- **ADR-0017** (forthcoming, vendor template autonomy) — the
  substrate-only portion (`clean_approval_count` column on
  `vendor_rules`) ships in v1 per the reframe spec §11; full
  enforcement is post-v1.
- **`docs/03_architecture/phase_simplifications.md`** —
  Simplification 3 ("agents-collapsed-to-services" until two real
  agents inform the shared shape) is operationalized by this ADR.
  No general pipeline platform abstraction lands until two real
  Tier 2 systems have shipped.
- **`CLAUDE.md`** §4 — the anti-hallucination rule extended by
  Q27's resolution above. CLAUDE.md §4 itself is not edited; this
  ADR's exception clause is the authoritative reading for the
  stateless-pipeline case.

## Notes for future ADR writers

- **ADR-0007 was drafted in the same cycle as the Document Platform
  reframe amendment because the two could not be cleanly separated
  in time.** Future readers may assume the Tier 2.5 was always part
  of the original architecture; it was not. Tier 2.5 was introduced
  specifically by the Relationship Router's
  read-against-committed-state requirement that surfaced in the
  2026-05-02 reframe. The Amendment section preserves that
  history. If a future reader sees the Tier 2.5 contract as
  "obvious" from first principles and wonders why it needed an
  amendment, the answer is: the reframe was the forcing function;
  before the reframe, no Tier 2 system needed to read against
  committed ledger state, and the original Tier 2 contract was
  sufficient.
- **The Q28 matrix's per-document-type-and-relationship expansion
  is the load-bearing safety control under this architecture.** If
  that matrix is not maintained as new document types or
  relationship patterns ship, the Tier 2 / Tier 2.5 → Tier 1
  boundary loses its compensating control. The matrix's home is
  `docs/02_specs/agent_architecture_policy.md`; the obligation to
  extend it lives with each new document type or relationship
  pattern brief, not with this ADR.
- **Vendor template autonomy enforcement (auto-post calibration)
  is post-v1** per the reframe spec §11. ADR-0017 covers the
  substrate-only portion (the `clean_approval_count` column on
  `vendor_rules`) in v1; full template-as-autonomy-rule
  enforcement is v1.5 or later.
- **Future tier additions (Tier 2.6, Tier 1.5, etc.) require an
  ADR amendment.** The pattern this ADR establishes — a tier is a
  named safety contract with read/write authorization, an
  enforcement mechanism, and a re-verification handoff — generalizes,
  but each new tier needs explicit ratification rather than implicit
  introduction. A subsystem that does not fit cleanly in any
  existing tier is the trigger for the amendment, not a freeform
  exception.
