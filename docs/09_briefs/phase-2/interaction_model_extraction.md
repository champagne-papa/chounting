# Phase 2 Interaction Model Extraction

**Status:** Phase 2 architecture brief. Not yet implemented. No
Phase 1.1 or Phase 1.2 code lives in this shape.

**Source:** Written during the commit-4b prelude in response to an
external architectural test: *"Can your system function correctly
with zero UI, only agent + API?"* This document is the founder's
answer to that test, preserved as a Phase 2 architectural statement
rather than rewritten as committee prose. The five primitives below
are the specification the Phase 2 Execution Brief will turn into
concrete tasks when it is written.

**Related:** The product thesis this brief exists to uphold is in
`docs/00_product/product_vision.md` (The Thesis section). Phase 1
engine correctness is specified in `docs/02_specs/ledger_truth_model.md`.
The Phase 1.2 UI-coupled interaction model this brief extracts from
is described in `docs/03_architecture/ui_architecture.md` and
`docs/09_briefs/phase-1.2/agent_architecture.md`.

---

## What Does Work Headless

Layers 1-2 are clean.

- The ledger is append-only, deterministic, and self-validating.
- Services enforce all invariants (double-entry, period locks,
  authorization, reversal mirror, etc.).
- Inputs are structured and schema-bound.
- Outputs can be made fully structured (including errors).

If I bypass the UI entirely and call service endpoints directly,
the system will:

- produce correct journal entries
- reject invalid operations deterministically
- maintain financial integrity

This means the engine is already UI-independent.

That's a strong signal the foundation is right.

---

## Where It Breaks (Today)

The break is not in correctness. It's in interaction flow.

Specifically:

### 1. Confirmation Is UI-Dependent

The Confirmation-First model currently assumes:

- a Proposed Entry Card
- a human reviewing a visual representation
- an explicit approve/reject interaction

This is not abstracted.

There is no canonical API equivalent of:

```
propose → review → confirm
```

Right now, that loop exists in UI components, not in system
primitives.

### 2. `canvas_directive` Is Not an API Contract

The agent produces `canvas_directive` outputs that:

- assume rendering
- assume layout
- assume human-readable formatting

These are not:

- normalized data structures
- stable contracts
- machine-first representations

So an API-only client would not know:

- what is being proposed
- how to confirm it
- how to modify it

### 3. No Explicit Agent Session Model

There is no defined:

- `/api/agent/message` endpoint
- session state model
- conversation memory contract
- multi-step workflow handling

Right now, the "agent" exists implicitly inside the UI runtime.

Without UI, there is no clear:

- state continuity
- step tracking
- retry logic

### 4. Error Loop Is Only Half-Complete

Structured errors exist (good), but:

- there is no formal mapping from `ServiceError` → agent action
- no retry protocol
- no standardized "next possible actions" payload

So while errors flow up, they are not yet actionable in a headless
loop.

---

## What This Means

The system today is:

> **Headless at the engine level, UI-dependent at the interaction
> level.**

That's an important distinction.

It means:

- correctness is decoupled from UI (good)
- orchestration is not yet decoupled from UI (gap)

---

## What Is Missing to Make It Fully Agent+API

To pass the "zero UI" test, we need to formalize the interaction
layer as APIs.

### Primitive 1 — Proposal as a First-Class Object

Introduce a canonical structure:

```typescript
Proposal {
  id
  type
  payload (structured, not visual)
  status (pending / confirmed / rejected)
  created_by
}
```

This replaces "Proposed Entry Card" as a UI concept.

### Primitive 2 — Confirmation API

```
POST /proposals/:id/confirm
POST /proposals/:id/reject
POST /proposals/:id/modify
```

This abstracts the confirmation loop out of the UI.

### Primitive 3 — Agent Message Endpoint With Session Primitives

```
POST /agent/message
{
  session_id,
  message,
  context
}
```

Returns:

- structured response
- optional proposal
- next actions

### Primitive 4 — Replace `canvas_directive` With Data Directives

Instead of:

```
canvas_directive: render_journal_entry_card
```

You get:

```typescript
directive: {
  type: "PROPOSE_JOURNAL_ENTRY",
  data: {...}
}
```

UI becomes just one renderer of this.

### Primitive 5 — Structured Error → Action Mapping

Errors should return:

```typescript
{
  code: "PERIOD_LOCKED",
  message: "...",
  possible_actions: [
    "SELECT_DIFFERENT_DATE",
    "REQUEST_PERIOD_REOPEN"
  ]
}
```

This enables a closed-loop agent system without UI.

---

## Final Answer

The system can run correctly without a UI at the engine level today.

It cannot yet operate as a complete product without a UI because the
interaction model (proposal, confirmation, session flow) is not yet
expressed as API primitives.

---

## Framing This Correctly

This is not a failure.

This is clarity.

- Phase 1.1 proves the engine
- Phase 1.2 proves the interaction via UI
- Phase 2 must extract the interaction model into APIs

---

## The Real Insight

The zero-UI test is not about removing the UI.

It's about forcing you to answer:

> **Is the interaction model part of the product, or just part of
> the interface?**

Right now, parts of your interaction model live in the interface.

Phase 2 is where you pull them down into the system.

---

## Conclusion

Accurate answer is **partially** — with a clear path to **yes**
through formalizing proposals, confirmation, sessions, and
directives as API-level constructs.
