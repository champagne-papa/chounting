# Phase 2 Agent Architecture Proposal — Layered Tiers

**Status:** CTO-reviewed, approved in principle.
**Date:** 2026-04-19
**Resolution path:** ADR-0007 + `docs/02_specs/agent_architecture_policy.md` during Phase 2 scoping, after Phase 1.3 triage. Five open items to resolve before code: Q27–Q31 in `docs/02_specs/open_questions.md`.
**Relationship to existing architecture:** Operationalizes ADR-0003 and Simplification 3. Does not change the commit path, the Authority Gradient, the Agent Ladder, or any existing invariant.

---

## 1. Why this document exists

The question "single agent or multi-agent?" came up during recent architecture reading. The repo today commits to one user-facing voice (ADR-0003), three internal personas (AP specialist, controller, executive) that share a session, and the Authority Gradient (agents propose, services decide, DB enforces). ADR-0003 and Simplification 3 both anticipate that internal decomposition *may* appear in Phase 2+, but neither defines when, where, or under what safety contract.

Multi-agent discourse online pulls in a direction that would be wrong for accounting software. But rejecting that discourse wholesale would also be wrong — there are narrow places where decomposition genuinely helps. This document captures how we reasoned through the tradeoff and where we landed, so the eventual ADR-0007 has the reasoning trail preserved.

## 2. What we thought, in the order we thought it

### 2.1 Starting position: single-agent is right for Chounting

The initial instinct was that single-agent is the right default for transactional accounting. Three reasons:

1. **Accounting is stateful and irreversible.** Content pipelines (research → writer → reviewer) tolerate errors — the cost is a worse blog post. Accounting pipelines don't tolerate errors in the same way — the cost is a corrupted ledger that fails audit. "Telephone effect" between agents is a real risk when prose-based handoffs are involved.
2. **ADR-0003 is a deliberate choice.** The one-voice architecture was reached after two rounds of CTO review and is anchored in the bookkeeper analogy: a real bookkeeper doesn't narrate her internal collaborations.
3. **Anti-hallucination rules depend on "current session."** `CLAUDE.md` §4 forbids the agent from referencing data not retrieved in the current session. A naive multi-agent handoff weakens this rule — Agent A retrieves, Agent B uses, Agent B never retrieved.

This position was defensible but incomplete. It rejected multi-agent as a whole without distinguishing between patterns.

### 2.2 Pushback: the rejection was too blunt

Advisor feedback surfaced several legitimate points:

- **"Multi-agent" conflates multiple patterns.** Naive conversational handoffs are risky, but structured-output pipelines with typed handoffs are a different pattern with different risk characteristics.
- **"Agent topology" and "execution model" are separable.** A system can have one user-facing voice *and* internally use pipelines or sub-agents. These aren't contradictions.
- **Deterministic boundary enforcement is the actual safety mechanism.** The rule isn't "don't use multi-agent." It's "never let any agent mutate state directly — all commits go through deterministic services." Multi-agent doesn't break this if commits still flow through the same choke point.
- **Some features genuinely benefit from decomposition.** Document ingestion, audit scans, and report commentary are stage-based workflows where specialization helps. These are already shaped like pipelines.

### 2.3 The failure modes we had to resolve

Before landing on any layered model, we had to solve the specific problems multi-agent introduces:

**Problem 1: "Current session" becomes ambiguous across agents.**
Resolution: Sub-agents are stateless typed functions. No `session_id` across stages. The anti-hallucination rule applies to the *committing* agent's session — the single Tier 1 agent that presents the final proposal. Sub-agents don't have sessions; they're transformations, not conversational participants. This reading is a policy choice that supersedes the plain text of `CLAUDE.md` §4; the amendment is tracked in Q27 and will be resolved in ADR-0007.

**Problem 2: Prose handoffs introduce telephone effect.**
Resolution: Structured Zod-validated JSON only, with two honest caveats. Typed handoffs constrain *structural* telephone — the shape of the data can't drift between stages. They do **not** constrain *semantic* telephone — an LLM stage can extract `amount: "1200.00"` from a document where the real amount is `$1,250.00` and Zod passes cleanly. Zod validates schema, not semantic correctness. The semantic defense is two-layered: (a) commit-boundary re-verification of values with financial semantics (Q28), and (b) human visibility on the ProposedEntryCard, where the extracted amount is rendered alongside the source document for explicit approval. Typed handoffs are necessary but not sufficient.

**Problem 3: Narrative drift in analytical outputs (reports, memos).**
Resolution: Mandatory citations for claims. Critic/reviewer stages can help but are *not* a primary safety control — they can hallucinate too. Primary controls remain Zod, service invariants, DB constraints.

**Problem 4: Observability fragments across stages.**
Resolution: Extend existing `trace_id` propagation (API → service → DB) across sub-agent stages. Debugging reads one trace, not N conversations. Works because stages are stateless — no conversation histories to reconstruct.

**Problem 5: Where should commits be allowed?**
Resolution: Nowhere new. Tier 2 never writes. All commits route through Tier 1, which applies the Agent Ladder (`agent_autonomy_model.md`), `withInvariants()`, and existing DB constraints unchanged.

### 2.4 Discovery: the architecture already anticipates this

Two existing documents already commit to the discipline we were trying to articulate:

**ADR-0003 ("One-Voice Agent Architecture"):**
> *"The implementation-level decomposition is reasonable and may appear in Phase 2+ as the toolbox grows... may in Phase 2+ route tasks to specialized sub-orchestrators. None of this leaks to the user."*

**Simplification 3 (`phase_simplifications.md`):**
> *"Building six named agents with input/output contracts before any of them have been exercised against real workflows is premature design. You cannot generalize the right shape for an agent class until you have at least two real agents solving real problems. Phase 1 builds one (Double Entry) and proves it works. Phase 2 builds the second (AP) and learns from the comparison what the actual shared abstractions need to be."*

Both documents already commit to the core discipline: internal decomposition is permitted, no platform abstraction until two real systems inform the shape. The tier policy we landed on is not a new stance — it's the operational form of these existing commitments.

### 2.5 Where we landed: layered tiers with focused alignment

Three tiers, each with clear governance:

- **Tier 1 — Commit Path.** Single agent, deterministic services. Where autonomy (Agent Ladder) and invariants live.
- **Tier 2 — Proposal Path.** Bounded pipeline stages permitted. Never commits. Output is a `ProposedMutation` that enters Tier 1 through the existing pipeline.
- **Tier 3 — Interface Path.** User sees one agent. Governed by ADR-0003 and ADR-0006.

This resolves the single vs. multi-agent question by reframing it:
- "Single agent" is the right rule for commits (Tier 1) and user interface (Tier 3).
- "Bounded pipelines" are permitted for proposals, drafts, classification, analysis (Tier 2).
- The commit path stays absolutely single-agent; the user-facing surface stays one voice; internal decomposition is allowed only where output is never a state change.

Agent Ladder and tier policy are **orthogonal**. Ladder governs autonomy on the commit path ("how independently can the agent post?"). Tiers govern architecture on non-commit paths ("what internal stages are permitted before a proposal reaches commit?"). They operate in different dimensions.

## 3. The policy

### Three tiers

**Tier 1 — Commit Path.** Any action changing financial state uses a single agent proposing to deterministic services. No pipeline stages on the write path.

**Tier 2 — Proposal Path.** For tasks whose output is a proposal, draft, classification, or analysis — never a state change — bounded pipeline stages are permitted under the safety contract below. Tier 2 output enters the existing `ProposedMutation` pipeline at Tier 1.

**Tier 3 — Interface Path.** User sees one agent. Internal complexity does not leak to the user surface.

**Canonical rule preserved.** Per `intent_model.md`: *"No entry path has bespoke routing."* Tier 2 is not a new entry path — it is proposal-generating machinery whose output is a `ProposedMutation` flowing through existing handlers. New routing surface: zero.

### Feature mapping

- **Tier 1:** journal posting, reversals, period close, payment execution, invoice finalization, tax calc, depreciation, rev rec posting, reconciliation commits, master data writes.
- **Tier 2:** document ingestion, expense coding, audit scans, reconciliation match suggestions, report commentary, tax research memos, variance analysis, anomaly triage, contract interpretation.
- **Tier 3:** conversational copilot, support, policy Q&A, onboarding, exception explanation.

### Tier 2 safety contract (inviolable)

1. **No direct writes.** Tier 2 stages never call mutating services or insert into tables. All commits route through Tier 1. Mechanical enforcement (build-time lint preventing Tier 2 module paths from importing mutating service entry points) is tracked in Q29.
2. **Structured handoffs only.** Stage-to-stage communication is typed Zod-validated JSON. Zod constrains structural telephone; semantic telephone is constrained by contract item 3 and human visibility at the ProposedEntryCard.
3. **Re-verification at the commit boundary.** The committing Tier 1 agent re-fetches and re-validates data with financial semantics (amounts, accounts, entities, period-affecting dates). Structural transforms need not be re-verified. **This contract item is underspecified today.** The concrete field-level matrix (field → source → re-verification method → failure mode) is tracked in Q27 and Q28, and must land in `docs/02_specs/agent_architecture_policy.md` before any Tier 2 system codes.
4. **Trace propagation.** Every stage emits trace records linked by existing `trace_id` per INV-AUDIT-001.
5. **Populate existing `ProposedMutation.justification.*` fields.** The Logic Receipt (INV-AGENT-002) is produced by Tier 1 as today. Whether step-level reproducibility requires extending `justification` with a `pipeline_trace` field is tracked in Q30.

### What "sub-agent" means here

A sub-agent is a **stateless typed function that happens to wrap an LLM call** — `(typed_input) → typed_output`, separate system prompt, separate tool set, no shared session with other stages. Distinct from current personas, which are system-prompt variants of one conversational agent sharing a session.

Orchestration is deterministic TypeScript, not an LLM coordinator. The prohibition on LLM-planned orchestration is explicit and tracked in Q31:

```typescript
async function ingestDocument(orgId: string, fileId: string, traceId: string) {
  const ocrText = await runOCR(fileId);
  const extracted = await extractFields(ocrText, traceId);
  const vendorMatch = await matchVendor(orgId, extracted.vendor, traceId);
  const accounts = await suggestAccounts(orgId, extracted.lines, traceId);
  return buildProposedMutation({ extracted, vendorMatch, accounts, traceId });
}
```

## 4. Comparison to current design

| Dimension | Current | Proposed |
|---|---|---|
| Commit path safety | Strong | Identical — unchanged |
| Complexity | Low | Moderate; Tier 2 only |
| Observability | `trace_id` API → service → DB | Extends `trace_id` across stages (no new infrastructure) |
| Product leverage | Limited on batch/analytical surfaces | Enables AP Agent, ingestion, audit scans, richer analysis |

## 5. Relationship to Phase 2's committed architecture

`docs/09_briefs/phase-2/interaction_model_extraction.md` already commits Phase 2 to extracting the interaction model into five API primitives (`Proposal`, confirmation API, agent message endpoint, data directives, structured error-to-action mapping). The tier policy is compatible with all five:

- Tier 2 stages produce objects that map to Primitive 1 (`Proposal`).
- Tier 2 pipelines expose no new user-facing surface — Primitives 2 and 3 unaffected.
- Tier 2 stages may emit Primitive 4 data directives as pipeline outputs.
- Tier 2 errors flow through Primitive 5's structured error mapping unchanged.

Simplification 3 already commits to building the AP Agent in Phase 2 as the second real agent that informs what shared infrastructure is actually needed. The tier policy's "no platform abstraction until two systems prove the need" discipline is already repo policy via Simplification 3 — this document operationalizes it.

## 6. Recommendation

1. **Default remains single-agent.** Tier 1 and Tier 3 unchanged.
2. **Tier 2 is opt-in and proposal-only.** Never on commit paths.
3. **Draft ADR-0007 and `docs/02_specs/agent_architecture_policy.md` during Phase 2 scoping**, after Phase 1.3 triage produces the Phase 2 brief. Do not draft during Phase 1.2 closeout or during Phase 1.3 (which is a time-boxed learning phase, not a build phase). Conditional on Phase 1.3 producing a **go** or **soft-no** trust classification per `phase_plan.md` Phase 1.3 EC-11 — if hard-no, this work defers until the named blocker clears. If soft-no, Tier 2 work is scheduled after the named fixes (which become Phase 2 required items per EC-11).
4. **First Tier 2 system is the AP Agent**, by virtue of being the first Phase 2 agent in the existing plan (`phase_plan.md` Phase 2 scope: *"AP Agent: email ingestion → OCR → chart of accounts suggestion → ProposedEntryCard"*). This pipeline shape is already the target.
5. **Audit scan formalization is an optional lower-risk first exercise** of the pattern, not a gate. The 12 hand-orchestrated prompts in `docs/07_governance/audits/prompts/` are already ~80% of the pattern and produce advisory output. The remaining 20% (structured output schema per prompt, trace_id threading, Logic Receipt format for advisory output, storage location) would be specified when/if the rehearsal happens.
6. **No general pipeline platform abstraction** until AP Agent ships and a second Tier 2 system reveals the actually-needed shared infrastructure. This is the Simplification 3 discipline applied to Tier 2.

## 7. Open items blocking ADR-0007

Five items must be resolved in ADR-0007 or `docs/02_specs/agent_architecture_policy.md` before any Tier 2 code lands. All are logged in `docs/02_specs/open_questions.md`:

- **Q27** — CLAUDE.md §4 amendment for Tier 2 stateless sub-agents (governance language, not reinterpretation).
- **Q28** — Re-verification matrix for the Tier 2 → Tier 1 boundary (concrete field-level specification).
- **Q29** — Tier 2 boundary enforcement mechanism (build-time lint, not convention).
- **Q30** — Logic Receipt reproducibility under Tier 2 pipelines (extend `justification` with `pipeline_trace` vs. accept step-level reproducibility loss).
- **Q31** — LLM-planned orchestration prohibition (verbatim rule for the safety contract).

All five are operational specificity, not architectural disagreement. The architecture was approved in principle; these items sharpen its implementation.

## 8. What this document does NOT do

- Does not change Phase 1.2 scope, Phase 1.3 Reality Check plan, or the Phase 2 interaction extraction.
- Does not authorize building any Tier 2 system yet.
- Does not modify ADR-0001, ADR-0002, ADR-0003, ADR-0005, ADR-0006, the Agent Ladder, the Logic Receipt spec, `interaction_model_extraction.md`, or `phase_simplifications.md`.
- Does not amend `CLAUDE.md` §4 — the §4 amendment is governance work deferred to ADR-0007 per Q27.
- Does not replace or weaken the Authority Gradient, the Two Laws, `withInvariants()` guarantees, or existing anti-hallucination rules.
- Does not commit to a general pipeline framework.

## 9. Verification against canonical docs

Verified by direct read against: ADR-0001 (reversal semantics), ADR-0002 (confidence as policy input), ADR-0003 (one-voice agent architecture), ADR-0005 (three-path intent schema), ADR-0006 (agent persona unnamed), `agent_autonomy_model.md`, `intent_model.md`, `agent_interface.md`, `phase_plan.md`, `phase_simplifications.md`, `interaction_model_extraction.md`, `CURRENT_STATE.md`, `obligations.md` (Phase 1.2). No architectural conflicts found. `ProposedMutation.justification.*` already carries most provenance fields this proposal needs; whether a `pipeline_trace` extension is required is tracked in Q30. Simplification 3 already commits to the "no platform abstraction until two systems" discipline that this document operationalizes for Tier 2.

## 10. Review history

- **2026-04-19** — CTO review complete. Approve-in-principle verdict. Five conditional items before code, logged as Q27–Q31. No architectural disagreement; all feedback is operational specificity.

The full reasoning trail and revision history of this memo (v1 through v6, with iterative advisor feedback) exists in the authoring conversation and is summarized in §2 above. The §2 narrative is the reasoning trail preserved into the repo.
