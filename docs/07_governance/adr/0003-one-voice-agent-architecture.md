# ADR-0003: One-Voice Agent Architecture (No User-Facing Sub-Agents)

## Status

Accepted

## Date

2026-04-16

## Triggered by

The agent autonomy design sprint (see
`docs/07_governance/friction-journal.md` entry dated 2026-04-16,
"Agent Autonomy Design Sprint"). The founder initially proposed an
explicit multi-agent delegation chain surfaced to the user ("Main
Head Agent → Invoice Agent → Vendor Agent"). The correction to
one-voice-many-tools emerged from the bookkeeper analogy: when you
delegate to a bookkeeper, she handles the work — she does not
narrate her internal collaborations with the filing clerk.

## Context

In LLM-based systems, it is technically natural to decompose the
agent into specialized sub-agents — an invoice agent, a vendor
agent, a reconciliation agent. The implementation-level
decomposition is reasonable and may appear in Phase 2+ as the
toolbox grows beyond three tools.

The question this ADR resolves is whether that internal
decomposition is exposed to the user as a first-class UX concept.

Three pressures drove the decision:

1. **Cognitive load on users is unnecessary.** The user does not
   care which internal tool handled their task. Surfacing the
   internal structure adds information the user cannot act on.
2. **The bookkeeper analogy breaks if the user sees internal
   delegation.** A real bookkeeper does not narrate "let me ask
   my colleague the filing clerk to check the archive." She says
   "I'll look that up." The analogy requires a single accountable
   voice.
3. **Failure attribution gets harder.** When the Vendor Agent
   fails, whose fault is it? Does the Main Head Agent apologize?
   Does the Vendor Agent? Who resumes the flow? These are
   implementation questions the user should never reason about.

The existing `docs/09_briefs/phase-1.2/agent_architecture.md`
already specifies one orchestrator with a typed tool toolbox.
This ADR formalizes the user-facing side of that architecture as
a permanent rule, not a Phase 1 simplification.

## Decision

The user interacts with a **single agent**. There is no
user-facing sub-agent hierarchy in chat messages, UI copy,
notification text, error messages, audit log strings visible to
users, or any other surface.

Internally, the orchestrator dispatches typed tool calls
(`listChartOfAccounts`, `postJournalEntry`, `createVendor`, etc.)
and may in Phase 2+ route tasks to specialized sub-orchestrators.
None of this leaks to the user. When the agent needs information,
it asks in its own voice:

> "I don't have Therapy X on file yet — what's their email and
> billing address?"

Not:

> "The Vendor Agent needs more info."

This extends to error language. When an internal tool fails, the
user-facing message describes the outcome in the agent's voice,
not the tool's identity:

> "I wasn't able to create the vendor — the address format wasn't
> valid. Could you check the postal code?"

Not:

> "Vendor Agent error: INVALID_POSTAL_CODE."

## Consequences

### What this enables

- The user's mental model is simple: one agent, one voice, one
  point of accountability.
- Sub-agent architecture can evolve in Phase 2+ without
  user-facing disruption. The internal decomposition is free to
  change; the user sees only its effects.
- Error attribution is clean: failures are "the agent couldn't do
  X," not a graph of which sub-agent failed and how they relate.
- Onboarding copy is simpler. The user learns "the agent" once,
  not a taxonomy of agents.

### What this constrains

- **Voice consistency discipline.** Internal implementation must
  maintain voice consistency across all tools. A developer adding
  a new tool cannot expose a tool-specific error message to the
  user — the message must be rewritten in the agent's voice by
  the orchestrator layer. This is an ongoing discipline cost.
- **Audit log layering.** Audit logs have two layers: the internal
  layer (records which tool ran, with `tool_name` on
  `audit_log`) for engineers, and the user-facing layer (records
  "the agent did X") for the user-visible audit trail. The two
  must stay consistent.
- **Phase 2 naming discipline.** Phase 2 sub-orchestrator design
  cannot use user-facing names. An "AP Agent" or "Reconciliation
  Agent" can exist in code as an internal module name but not in
  UI copy, chat messages, or user-visible audit strings.

### What this does NOT change

- The internal agent architecture. The Phase 1.2 brief specifies
  one orchestrator with a typed toolbox — this ADR formalizes the
  user-facing presentation but does not alter the implementation.
- The trust model. The Agent Ladder and policy engine operate on
  rules, which exist below the user-voice layer.

## Alternatives considered

### Alternative 1: Visible sub-agent delegation chain

The founder initially proposed explicit agent handoffs visible to
the user ("Main Head Agent asked Vendor Agent to lookup the vendor;
Vendor Agent asked you for their address"). Rejected because:

- Users do not benefit from knowing the internal architecture. The
  information is pure implementation leakage.
- It breaks the bookkeeper analogy explicitly. Real bookkeepers do
  not narrate internal collaborations; the analogy requires a single
  accountable voice.
- Failure handling becomes a user problem. When the Vendor Agent
  fails, the user has to reason about which agent failed, what that
  agent's capability boundary is, and whether to address the failure
  to the Main Head Agent or the Vendor Agent. These are
  implementation questions with no user-visible answers.
- The presentation invites confusion about capability boundaries.
  "Why can't the Invoice Agent look up the vendor directly?" is a
  question with no good answer for the user and a complicated
  implementation answer the user should never need.

### Alternative 2: Named lead agent with named specialists

The lead agent has a product-aligned name ("Bridge" or similar)
and the specialists have functional names visible to the user.
Rejected because it combines the worst of both directions: it
anthropomorphizes (Q25 rejects naming — see ADR-0006) AND exposes
internal architecture. Users would build a mental model of a team
of AI characters, which is precisely the anti-pattern the product
is positioned against. "Bridge asked the Vendor Agent" is not a
better user experience than "the agent asked you" — it is a worse
one with more proper nouns.

### Alternative 3: Transparent internal architecture surfaced as "tool use" disclosure

Show tool calls inline in chat ("🔧 using tool:
listChartOfAccounts") the way some LLM interfaces do for
debugging. Rejected because:

- It surfaces implementation details to users who do not need them.
  The tool name `listChartOfAccounts` is a code identifier, not a
  user-facing concept.
- Tool inventory changes across phases. Every Phase 2 tool addition
  becomes a user-visible change — new tool names appearing in the
  chat with no context. The user has to learn a tool taxonomy they
  never asked for.
- It distracts from the Four Questions grammar. The user should be
  reading "what changed / why / track record / what if I reject,"
  not "what tool did the agent just call." The tool disclosure
  competes for attention with the information that actually matters.

### Alternative 4: One voice for routine tasks, explicit sub-agent voices for specialized workflows

Considered: routine tasks use the one-voice model, but specialized
workflows like month-end close surface a specialized "Close Agent"
voice. Rejected because once sub-agent voices appear anywhere, the
discipline breaks. There is no natural line between "routine" and
"specialized" that survives feature growth — every new workflow
can argue it is special enough to warrant its own voice. The hard
rule (never expose sub-agents) is the only rule that holds because
it has no exception path.

## Cross-references

- `docs/03_architecture/agent_interface.md` §1 (One Voice, Many
  Tools).
- `docs/09_briefs/phase-1.2/agent_architecture.md` (internal
  orchestrator architecture — the implementation this ADR governs
  the presentation of).
- `CLAUDE.md` Rule 4 (anti-hallucination rules — one-voice
  discipline extends anti-hallucination to voice identity).
- ADR-0006 (agent persona — unnamed; this ADR specifies that the
  one voice exists; ADR-0006 specifies what it sounds like).
- `docs/07_governance/friction-journal.md` entry dated 2026-04-16.
