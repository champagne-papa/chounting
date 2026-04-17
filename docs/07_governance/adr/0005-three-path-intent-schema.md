# ADR-0005: Three-Path Entry Model with Canonical Intent Schema

## Status

Accepted

## Date

2026-04-16

## Triggered by

The agent autonomy design sprint (see
`docs/07_governance/friction-journal.md` entry dated 2026-04-16,
"Agent Autonomy Design Sprint"). External CTO review #1 identified
"three-path fragmentation" as a load-bearing concern: without a
unifying abstraction, chat, palette, and Mainframe will each grow
bespoke routing logic and the product will be rewriting itself in
12–18 months. The canonical Intent Schema is the architectural
response.

## Context

The Bridge has three entry paths to the canvas:

1. **Mainframe** icons — deterministic navigation. The user knows
   where they want to go and clicks the icon.
2. **Agent chat** — ambiguous/exploratory. The user describes what
   they want in natural language; the agent interprets.
3. **Command palette** (Cmd+K) — high-velocity power use. The user
   types a fragment and the palette routes by prefix/context.

Each path is first-class. Agent-first is the default invitation
but every capability is reachable without the agent, including
the graceful-degradation path when the Claude API is unavailable
(the Mainframe constraint in
`docs/03_architecture/ui_architecture.md`).

### The fragmentation risk

Each path developing its own routing logic, validation, and error
handling is the default outcome if no architectural decision is
made. Chat's "create an invoice" flow subtly differs from the
palette's "create invoice" action differs from the form-based
invoice UI. Every bug report becomes a three-way reproduction.
Every new feature has three places it might need to be added.
Every test matrix triples.

The cost is not hypothetical. CTO review #1 identified this as
the single architectural concern most likely to cause a rewrite
in 12–18 months — not because any one path is wrong, but because
three independently-evolved routing layers produce irreconcilable
divergence once the feature surface grows past the initial three
tools.

## Decision

Every entry point in The Bridge produces one of three canonical
intent types:

1. **Navigation intent** → produces a `CanvasDirective` (existing
   type at `src/shared/types/canvasDirective.ts`).
2. **Mutation intent** → produces a `ProposedMutation` (defined in
   `docs/02_specs/intent_model.md` §3).
3. **Query intent** → produces a transient canvas view or in-chat
   structured response. `QuerySpec` is reserved for Phase 2
   formalization.

The handlers for each intent type are **singular and shared**.
Chat, palette, Mainframe, form submission, and file import all
produce these same three shapes, and the shared handlers consume
them. No path has bespoke routing.

The full specification lives in `docs/02_specs/intent_model.md`.
This ADR formalizes the architectural commitment to that
specification.

## Consequences

### What this enables

- A new entry path (a future mobile app, a CLI, an API-only
  client, another agent) produces the same three Intent objects
  and the existing handlers work without modification. The
  interaction model is pluggable.
- Every mutation flows through the same confirmation-first
  pipeline regardless of origin. The Four Questions grammar
  renders consistently from `ProposedMutation` fields.
- Audit artifacts are consistent: a mutation's
  `ProposedMutation` is the same shape whether it originated in
  chat, palette, or form. The Logic Receipt format is unified.
- Phase 2's "zero-UI interaction model extraction" (see
  `docs/09_briefs/phase-2/interaction_model_extraction.md`)
  becomes straightforward: the `Proposal` API primitive is the
  API-level slice of `ProposedMutation`.
- The CTO fragmentation concern is architecturally neutralized.
  There is no place for a path to grow bespoke routing — every
  path must produce an Intent.

### What this constrains

- **Every new feature must be expressible as one of the three
  intent types.** Features that do not fit must either decompose
  into intent-compatible pieces or extend the Intent union via a
  new ADR. Drift is prevented by the type system — a path that
  produces something other than `Intent` fails at compile time.
- **Parser complexity moves to the per-path front-end.** The
  chat agent's utterance-to-intent translation, the palette's
  prefix parsing, and the form's submit-to-mutation conversion
  are all path-specific. The handlers are unified; the translation
  is path-specific. This is the right split but it is a split:
  each new path requires its own intent-construction layer.
- **Phase 1.1 form submissions need typing.** The existing form
  submissions produce intent-shaped data but are not formally
  typed as `Intent`. Phase 1.2 work includes the typing.
- **New intent types require an ADR.** The union is load-bearing
  and cannot grow casually. Adding a fourth variant
  (e.g., `subscription` or `notification`) requires formal
  architectural consideration, not a feature PR.

### What this does NOT change

- The three paths as user-facing entry points. Mainframe, chat,
  and palette all remain first-class. This ADR unifies their
  backend plumbing, not their frontend presentation.
- The Phase 2 `Proposal` primitive. It remains as specified in
  `interaction_model_extraction.md` — the API-level projection of
  `ProposedMutation`. This ADR does not rewrite that Phase 2
  brief.

## Alternatives considered

### Alternative 1: Chat-primary entry, palette and Mainframe as fallbacks

Corresponds to the early "AI-forward" framing that the design
sprint corrected. Rejected because:

- The Mainframe is the graceful-degradation fallback when the
  Claude API is unavailable. A chat-primary architecture
  implicitly treats the fallback as second-class, which risks the
  fallback atrophying. When the agent goes down, the product must
  still work — and a second-class fallback is a fallback that has
  not been tested.
- Power users typing Cmd+K expect to beat the chat path in
  speed. Making the palette a "fallback" to chat rewards the
  slower path over the faster one. The palette exists because
  known-intent use cases deserve zero-LLM-latency resolution.
- The three-path model is the architectural expression of "the
  product is the control surface over the AI" — not "the product
  is AI-first with rescue paths."

### Alternative 2: Mainframe-primary, chat as optional feature

Rejected. This defeats the thesis. The agent is not optional for
the product's positioning — "AI-mediated accounting" requires the
chat path to be first-class. Making it optional positions the
product as a traditional accounting app with an AI bolt-on, which
is the category The Bridge is explicitly not. The thesis requires
the interface half to be as load-bearing as the engine half.

### Alternative 3: Two paths only — drop the command palette

Considered. The appeal: fewer paths to maintain, fewer intent
constructors. Rejected because the palette serves a specific user
state that neither chat nor Mainframe serves well:

- Chat is too slow for known intent (LLM round-trip for "go to
  chart of accounts" is wasted time).
- Mainframe navigation requires icon-hunting for less-common
  destinations.
- The palette is the third point of a triangle that covers three
  user states: exploratory (chat), known-destination (Mainframe),
  known-intent-fast (palette). Dropping any point leaves a gap
  in the user-state coverage.

### Alternative 4: Allow each path to have its own routing — no Intent unification

This is the status quo if no architectural decision is made. The
CTO fragmentation concern is the direct consequence: three
divergent routing layers, three sets of validation, three error
paths, three places to modify for every feature. Within 12–18
months the product becomes a multi-headed beast where "fix the
chat bug" and "fix the Mainframe bug" require separate
implementations of the same fix.

The Intent Schema is the architectural prevention of this outcome.
The cost of the Schema is parser complexity per path (each path
must construct `Intent` objects from its own input format). The
cost of no schema is routing divergence that compounds with every
feature addition.

## Cross-references

- `docs/02_specs/intent_model.md` — the full Intent specification.
- `docs/03_architecture/ui_architecture.md` — three-path entry
  model section and the Mainframe constraint.
- `docs/09_briefs/phase-2/interaction_model_extraction.md` — the
  `Proposal` primitive is the API projection of
  `ProposedMutation`.
- `src/shared/types/canvasDirective.ts` — the existing
  Navigation intent payload type.
- ADR-0001 — reversal semantics (the reversal mutation flows
  through the same `ProposedMutation` pipeline as other
  mutations).
- `docs/07_governance/friction-journal.md` entry dated 2026-04-16.
