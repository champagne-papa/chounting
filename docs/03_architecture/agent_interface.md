# Agent Interface

The durable, phase-agnostic interface patterns for the agent. This
document covers the user-facing contract: one voice, typed tools,
structured outputs, persona discipline, and the onboarding flow.
Phase-specific agent mechanics (the orchestrator, tool inventory,
session persistence) live in
`docs/09_briefs/phase-1.2/agent_architecture.md`.

This document earns its place in `docs/03_architecture/` (not
`docs/09_briefs/`) because it describes how the agent fits into
the system as a permanent architectural element, not how a
specific phase implements the agent. The patterns here survive
across phases; the Phase 1.2 brief's contents change as
implementation evolves.

**Source:** design-sprint decisions captured in
`docs/07_governance/friction-journal.md` (entry dated 2026-04-16).

**Cross-references:**
- Agent autonomy model: `docs/02_specs/agent_autonomy_model.md`
- Intent model: `docs/02_specs/intent_model.md`
- Phase 1.2 agent architecture:
  `docs/09_briefs/phase-1.2/agent_architecture.md`
- Canvas context injection:
  `docs/09_briefs/phase-1.2/canvas_context_injection.md`
- CLAUDE.md Rule 4 (agent anti-hallucination rules)
- UI architecture: `docs/03_architecture/ui_architecture.md`

---

## One Voice, Many Tools

The user interacts with a **single agent**. There is no
user-facing sub-agent hierarchy. No "Main Agent → Invoice Agent →
Vendor Agent" language in chat, UI copy, notification text, or
error messages, ever.

Internally, the orchestrator dispatches typed tool calls
(`listChartOfAccounts`, `postJournalEntry`, `createVendor`, etc.)
and may in Phase 2+ route certain tasks to specialized
sub-orchestrators. None of this internal structure leaks to the
user.

When the agent needs information it does not have — a vendor's
address, a missing account code, a clarification about which
period the user means — it asks in its own voice:

> "I don't have Therapy X on file yet — what's their email and
> billing address?"

Not:

> "The Vendor Agent needs more info."

The user's mental model is: **I am talking to the agent.** The
agent is the only actor in the conversation. Everything else is
implementation.

Internal sub-agents, specialized orchestrators, or routing layers
(if they exist in Phase 2+) stay in the internal codebase. They
do not produce user-facing messages. They do not appear in audit
log `action` values that users see. They do not appear in error
messages. ADR-003 (to be drafted in Phase D) will formalize this
rule.

---

## Agent Persona

The agent is unnamed (Q25 default in
`docs/02_specs/open_questions.md`). In UI copy:

- Refer to "the agent" in product documentation and settings.
- Refer to "your bookkeeper-style agent" when persona context
  matters (e.g., onboarding copy).
- Never use a proper name, never anthropomorphize.

### Tone Principles

1. **Neutral and professional.** Like a senior bookkeeper
   answering a question. Not an assistant trying to be helpful.
   Not a friend. Not a brand voice.
2. **Understated.** The agent does not celebrate its own actions
   or apologize effusively. A posted entry gets "Posted." not
   "Great job! The entry has been posted successfully! 🎉"
3. **Concrete.** Never filler phrases: "I'd be happy to help,"
   "That's a great question," "Let me look into that for you."
   Every sentence does work. If removing a sentence leaves the
   meaning unchanged, remove it.
4. **Silent by default.** The agent does not narrate what it is
   doing ("Now I'm looking up the chart of accounts...") unless
   the user asks or the user needs to know. Progress indicators
   are UI elements (loading states), not chat messages.
5. **Error behavior.** When the agent cannot do something, it
   says plainly what it cannot do, why, and offers the
   alternative. "I can't post to March — that period is locked.
   You can post to April instead, or ask a controller to reopen
   March." No hedging, no apologizing, no speculating about
   workarounds the system doesn't support.

**The persona's job is to not leak personality.** Personality is a
trust liability in accounting software. A "friendly" accounting
agent invites the same skepticism as a "friendly" tax auditor.
Trust comes from competence and transparency, not from warmth.

---

## Onboarding Flow

Conversational first, with form-escape at every step.

The agent walks the user through four steps:

1. **User profile** — name, role, preferences.
2. **Organization profile** — company name, industry, address.
3. **Industry selection** — for CoA template loading (connects to
   Phase 1.5A's industries table).
4. **First task invitation** — "Want to try posting a journal
   entry?" or "Want to see your Chart of Accounts?"

### Escape Hatches

At every step, a **"Skip — I know what I're doing"** link is
visible. Clicking it drops the user into the equivalent
form-based surface (the Mainframe path). The user can switch back
to conversational at any time by typing into the chat.

### First Message

The agent does not introduce itself by name (Q25). The first chat
message is functional:

> "Let's get your profile set up. What's your name and role?"

No introductory marketing copy. No "Welcome to The Bridge!" No
tutorials. No feature tours. The first thing the user sees is
the first question.

### What Onboarding Is Not

- Not a tutorial. The system is learnable through use.
- Not a demo. The user is doing real work from message one.
- Not skippable-only-once. A user who skips can re-enter the
  conversational flow at any time by asking the agent.

---

## Tool-Call Model

The Phase 1.2 brief (`docs/09_briefs/phase-1.2/agent_architecture.md`)
specifies the concrete tool inventory for Phase 1.2 (three tools:
`postJournalEntry`, `listChartOfAccounts`, `checkPeriod`). This
section specifies the durable rules that apply to every tool in
every phase.

### Durable Rules

1. **All agent tools are typed Zod-validated objects.** No
   free-text inputs. No natural-language tool parameters. The
   agent produces structured data; the service layer validates
   it at the boundary.

2. **Every mutating tool has a `dry_run: boolean` parameter.**
   The confirmation flow always calls dry-run first. Only the
   second call (after the user's Approve click) writes to the
   ledger. This is the mechanical implementation of the
   confirmation-first model.

3. **The agent never invents financial data.** All amounts,
   account codes, and vendor names come from tool outputs, not
   from model-generated text. This is CLAUDE.md Rule 4 item 1.
   The rule is non-negotiable — an agent that invents an amount
   is an agent that corrupts the ledger.

4. **Clarify, don't guess.** When the agent cannot produce a
   valid typed value for a required field, it asks the user a
   clarifying question rather than guessing. A wrong guess that
   passes Zod validation produces a semantically incorrect entry
   that passes every mechanical check — the most dangerous
   failure mode.

5. **Tool outputs are structured data.** The UI renders localized
   text from structured outputs via `next-intl` templates, not
   from model prose. This is what makes the agent trilingual
   without retranslating every Claude response. See the
   Structured-Response Contract in
   `docs/09_briefs/phase-1.2/agent_architecture.md`.

### What the Tool-Call Model Prevents

The tool-call model, combined with the anti-hallucination rules
in CLAUDE.md Rule 4, prevents the failure mode that makes AI
accounting tools untrustable: the agent producing a plausible-
looking but fabricated journal entry that passes every constraint
check because the constraints are about structure, not about
whether the vendor name or amount is real.

The prevention is mechanical: the agent cannot produce amounts
without calling tools that return them from the database. The
tools return real data. The agent assembles the real data into
a `ProposedMutation`. The confirmation surface shows the assembly
to the user. The user approves or rejects based on reality, not
on the model's assertion.

---

## Onboarding modes

The agent supports two onboarding modes, distinguishable by
`OnboardingState.invited_user`. The **Commissioning flow** is
for users with no existing memberships; they pass through all
four canonical stages — Recognition (sign-in), Registration
(profile capture), Commissioning (org + industry), and Arrival
(landing in the org). The **Joining flow** is for users invited
to an existing organization (`invited_user === true`,
`completed_steps: [2, 3]` pre-set); they pass through only
Recognition, Registration, and Arrival — Commissioning was
performed by whoever created the org. The state-machine shape is
unchanged across modes; what differs is the agent's posture (a
user joining an existing workspace is not in commissioning
posture) and the welcome-page stage indicator (which suppresses
Commissioning in the Joining flow). The four stage names are
durable structural framing, not user-facing copy.

Mode distinction codified at S32 (`docs/09_briefs/phase-1.3/session-32-onboarding-posture-brief.md`).

---

## Cross-References

- **Agent autonomy model** — governance rules for when the agent
  acts alone: `docs/02_specs/agent_autonomy_model.md`
- **Intent model** — the `ProposedMutation` and `Intent` types
  the agent produces: `docs/02_specs/intent_model.md`
- **Phase 1.2 agent architecture** — the orchestrator, tool
  definitions, session persistence, and Phase 1.2-specific
  mechanics: `docs/09_briefs/phase-1.2/agent_architecture.md`
- **Canvas context injection** — how canvas state flows into the
  agent's system prompt:
  `docs/09_briefs/phase-1.2/canvas_context_injection.md`
- **CLAUDE.md Rule 4** — the non-negotiable anti-hallucination
  rules that are enforced in every session
- **UI architecture** — the shell, canvas directive contract,
  and UI-level patterns:
  `docs/03_architecture/ui_architecture.md`
