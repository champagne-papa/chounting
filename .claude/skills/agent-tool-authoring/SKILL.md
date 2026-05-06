---
name: agent-tool-authoring
description: Anti-hallucination rules for agent code — tool outputs as source of truth, dry-run confirmation, Zod-validated tool inputs, no canvas-context substitution. Load when touching agent orchestrator, tools, or prompts.
trigger: Work adding or modifying files under `src/agent/tools/`, `src/agent/orchestrator/`, or `src/agent/prompts/`.
---

# Agent Tool Authoring

**Canonical sources:**
- `docs/03_architecture/agent_interface.md` — durable, phase-agnostic interface patterns (one voice, typed tools, structured outputs, persona discipline, onboarding flow).
- `docs/09_briefs/phase-1.2/agent_architecture.md` — phase-specific architecture for the Double Entry Agent.
- `docs/02_specs/agent_autonomy_model.md` — autonomy policy (Agent Ladder, limit model, System vs. Policy boundary).

This skill summarizes the anti-hallucination rules and points.

## The six non-negotiable rules

All of the following hold in every agent code change:

1. **Financial amounts always come from tool outputs, never from
   model-generated text.** The agent proposes what to do; the
   service layer and database produce the numbers.
2. **Every mutating tool has a `dry_run: boolean` parameter.** The
   confirmation flow always calls dry-run first. Only the second
   call, after the user's Approve click, writes to
   `journal_entries`.
3. **No account codes, vendor names, or amounts that weren't
   retrieved in the current session.** If the agent hasn't
   retrieved it from the DB in this conversation, it can't
   reference it.
4. **Tool inputs are structured Zod-validated objects only.** No
   free-text journal entries. Validation at the tool boundary is
   in addition to the service layer's own Zod re-validation.
5. **Ask clarifying questions rather than guess.** If the agent
   cannot produce a valid typed value for a required field, it
   must ask — not infer.
6. **Canvas context is reference material, never a substitute
   for tool-retrieved data.** The canvas can describe what the
   user is looking at; it cannot substitute for a live tool call
   when the agent needs authoritative state.

## Interactions

- Rules 1, 3, and 6 together close the "agent made something up"
  loop. Rule 1 prevents hallucinated numbers, rule 3 prevents
  hallucinated identifiers, rule 6 prevents the canvas from
  becoming a back-channel for untyped state.
- Rule 2 (`dry_run`) is the confirmation primitive that makes the
  Double Entry Agent's "propose → approve → post" flow safe under
  retry. Combined with the idempotency-key rule
  (INV-IDEMPOTENCY-001, see the `service-architecture` skill), a
  re-click on Approve does not double-post.
- Rules 4 and 5 keep the agent's surface area small and typed.
  Every failure to produce a valid input is a clarifying question,
  not a fabricated payload.

## Agent autonomy is bounded by policy, not by code

The Agent Ladder (three rungs) and the limit model (four
dimensions) in `docs/02_specs/agent_autonomy_model.md` govern
*what* the agent is allowed to do. These six rules govern *how*
the agent does it safely. Both layers must be respected; neither
substitutes for the other.

## Future-facing reference

Phase 2+ will extend these rules for Tier 2 pipeline stages — see
the proposal at `docs/09_briefs/phase-2/agent_architecture_proposal.md`
for context. Informational only; no rule change today.

## Tool schema home (per ADR-0020)

ADR-0020 (2026-05-05) ratifies a forward-looking home for tool
input/output schemas at:

```
apps/web/src/contracts/agent-tools/<capability>/<tool>.contract.ts
```

Capability subdirectories per ADR-0020 Decision items 1 and 4:
`ledger/`, `onboarding/`, `document/`, `evidence/`, `reference/`.

**Migration rule.** Existing schemas at
`apps/web/src/agent/tools/schemas/` and
`apps/web/src/shared/schemas/accounting/` migrate to the new home
**only on edit, not pre-emptively** (ADR-0020 Decision item 6
opportunistic-migration discipline). When a tool is naturally
edited, its schema migrates with it; bulk pre-migration is
rejected.

The `contracts/agent-tools/` directory ships with a README in the
2026-05-05 substrate session; capability subdirectories are
created on first use. See
`docs/03_architecture/agent-tool-architecture.md` for the
canonical agent → contracts → services → core → db call chain
and `docs/03_architecture/folder-structure.md` for the full
source-tree layout.
