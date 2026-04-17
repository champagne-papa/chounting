# Product Vision

What this product is, who it's for, why it's different, and the
constraints it operates under.

Source: extracted from PLAN.md "The Product," "Who This Is For,"
"Non-Negotiable Constraints," and "Locked-In Stack" sections during
Phase 1.1 closeout restructure. The Thesis section below was added
during the commit-4b prelude based on external architectural review.
The thesis was extended with a companion framing line during the
agent autonomy design sprint of 2026-04-16; see the "Thesis
extension" subsection below and `docs/07_governance/friction-
journal.md` for the sprint entry.

---

## The Thesis

> **This system is not an accounting UI with AI assistance. It is a
> deterministic financial engine with a probabilistic interface.**
>
> Agents interpret intent and propose actions. Services execute
> domain logic deterministically. The database enforces invariants
> absolutely. Authority flows down; structured errors flow up.

This is the one-sentence statement of what The Bridge is. Every
architectural decision in this project is evaluated against it.

The two halves of the thesis are doing different work:

- **"Deterministic financial engine"** — The accounting core
  (`src/services/`, `supabase/migrations/`, the database constraints)
  is strictly typed, fully testable, and absolutely correct. It has
  no natural language in it, no probabilistic reasoning, no model
  calls on the critical path of a journal entry. Double-entry math
  is enforced by Postgres constraints. Authorization is enforced by
  middleware. The ledger is append-only by RLS. None of this depends
  on an LLM being right.

- **"Probabilistic interface"** — The user-facing layer is an AI
  agent that reads messy human input, interprets intent, suggests
  actions, and explains outcomes. It is probabilistic because it has
  to be: real accounting workflows are ambiguous, contextual, and
  human. The agent layer is allowed to be wrong because the engine
  catches it. Authority never flows the other way — the agent cannot
  bypass the engine, cannot write to the database directly, cannot
  invent amounts or account codes.

The authority gradient — **agents propose, services decide, the
database enforces** — is the mechanical implementation of the
thesis. See `docs/02_specs/ledger_truth_model.md` for how each layer
of the gradient is specified and enforced. See
`docs/03_architecture/phase_simplifications.md` for why Phase 1
collapses the Layer 1 / Layer 2 "agents" from the v0.4.0 design into
deterministic service functions — that collapse is what makes the
engine half of the thesis actually hold.

**What the thesis requires in practice.** Three disciplines, all
non-negotiable, that prevent the system from drifting back into
"normal software with AI on top":

1. **No logic in agents.** Agents select rules and produce
   parameters; they never own business logic. Debit/credit math,
   period enforcement, FX calculation, and ledger writes happen in
   services, never in agents.
2. **No ambiguity in services.** Services accept strictly-typed
   inputs (Zod schemas at every boundary) and produce strictly-typed
   outputs including structured errors. No free-form strings cross a
   service boundary. No "agent thinks this is right" values.
3. **Strict error contracts.** When a service rejects a call, it
   returns a typed `ServiceError` with a code the agent can act on
   programmatically (`PERIOD_LOCKED`, `REVERSAL_NOT_MIRROR`,
   `PERMISSION_DENIED`, etc.), not a natural-language explanation
   the agent has to interpret.

These three disciplines are what make the system meaningfully
distinct from "AI bolted onto QuickBooks." Without them, the
architecture drifts back into a UI with AI assistance — correct on
paper but indistinguishable from competitors in practice.

**A forward-looking note.** Phase 1.1 and Phase 1.2 implement the
engine half of the thesis in full. The interface half is
UI-coupled in Phase 1.2 — the Proposed Entry Card is a React
component, confirmation is a button click, the agent's outputs
include `canvas_directive` render instructions. Phase 2 extracts the
interaction model (proposal, confirmation, session flow) into
API-level primitives so the system can run headless, with any
interface (UI, CLI, another agent, a script) driving it. See
`docs/09_briefs/phase-2/interaction_model_extraction.md` for the
Phase 2 extraction plan.

### Thesis extension — the control surface

The agent autonomy design sprint of 2026-04-16 extended the thesis
above with a companion framing line that sharpens the interface
half without changing the engine half:

> **The product is not the AI. The product is the control surface
> over the AI.**

The agent is a managed actor in a trust system. The control
surface — the autonomy model, the limits, the promotion
ceremonies, the demotion paths, the audit artifacts — is the
product. The LLM underneath is an implementation detail that
could be replaced; the governance layer is what the controller
trusts and the auditor audits.

The shift this extension names is from "AI as a feature" to
"AI as a managed workforce." A bookkeeper has a signing limit.
A new employee earns autonomy on routine tasks after
demonstrating competence; certain tasks stay under controller
oversight regardless of tenure. The agent inherits the same
model: trust is scoped per rule, revocable at any time, earned
per-task, and never uncappable on sensitive classes. The
governance layer that implements this is documented in
`docs/02_specs/agent_autonomy_model.md` §2 (Authority Gradient
Extended), §4 (The Agent Ladder), and §6 (System vs. Policy
boundary).

This extension does not contradict or replace the original
thesis. Both thesis statements hold simultaneously: the system
is a deterministic engine with a probabilistic interface
(architecture), and the product is the control surface over
that interface (positioning). The first statement names what the
system is; the second names what the product is.

---

## Who This Is For

A **non-developer founder** building an internal accounting platform
for a Canadian family office. Strong product vision but will need
explicit, step-by-step guidance — especially around environment
setup, folder structure, and where every piece of logic lives.

---

## The Product: What This Is and Why It Is Different

### Name (working title): **The Bridge**

Inspired by the command bridge of the Starship Enterprise — the
central place where the captain (the user) has total situational
awareness and can issue commands carried out by a trained crew (the
AI agents).

### What existing software gets wrong

Puzzle.io and Pennylane are modern-looking wrappers around the same
paradigm as QuickBooks and Xero. They added an AI chatbot on top of
a traditional accounting system. That is a UI-led system with an AI
assistance layer — the AI is a helper, not an actor, and the primary
surface is still forms and screens the user clicks through.

The Bridge is the inverse, but not in the shallow "AI-first UI" sense
— it's inverse in the architectural sense named in the Thesis above.
The engine is a deterministic financial engine that can in principle
run headless (agent + API, no UI). The interface is a probabilistic
agent that translates messy human intent into structured service
calls. The UI is one possible renderer of that interaction model,
and explicitly not the only one.

The philosophical difference:
- In Xero, you open a screen, fill in a form, click Save. The AI is
  a helper.
- In The Bridge, the AI agent is the primary actor in the
  interaction layer. It reads your email, sees the invoice, proposes
  the journal entry, shows you a confirmation card, and you approve.
  The traditional screen exists as a fallback (the Mainframe) and a
  power-user tool — not the default path.
- The engine underneath is the same in both cases (double-entry,
  period locks, audit trail, IFRS). What differs is that The Bridge
  treats the engine as the product's core and the interface as
  pluggable, where Xero treats the screens as the product and the
  engine as plumbing.

### What genuinely differentiates this product

1. **The Bridge UI pattern** — A persistent split-screen layout: AI
   agent chat on the left, a live Contextual Canvas on the right.
   When the agent references an invoice, P&L, reconciliation batch,
   or vendor record, it renders immediately in the canvas. The user
   never has to scroll back through chat history to find a table or
   graph. The canvas is stateful — drill-downs happen inside it
   without leaving the conversation.

2. **Agent Institutional Memory** — The agent builds an `org_context`
   knowledge store per organization: known vendors and their default
   GL mappings, recurring transaction patterns, seasonal expense
   rhythms, intercompany relationship maps, and approval rules. This
   memory is rule-based (stored as auditable records, not opaque
   model weights) so junior users are protected and controllers can
   review, edit, or override any learned rule. Trust is earned
   incrementally — the agent starts in "always confirm" mode and can
   be promoted to "auto-categorize with notification" for specific
   rule types after a controller explicitly unlocks that.

3. **Multi-entity consolidation as a first-class concept** — 50
   organizations across healthcare, real estate, hotels, NYSE
   trading, global export, private equity, and restaurants. The
   platform must support: role-based org switching (CFO sees
   consolidated view; AP specialist sees their assigned entities),
   intercompany transaction detection and reciprocal entry matching,
   consolidated P&L with elimination entries, and entity-level
   roll-ups. No competitor handles this well for a family office
   context.

4. **AP Automation as the primary Phase 2 workflow** — The single
   most painful daily task is Accounts Payable. The AP Agent owns
   this workflow end-to-end beginning Phase 2: email ingestion → OCR
   → proposed journal entry with intercompany flag → confirmation
   card → post. Phase 1 does not include the AP Agent. Phase 1
   proves the agent stack works for manual journal entries first.

5. **Confirmation-first mutation model** — Every AI-initiated
   financial write produces a structured **Proposed Entry Card**
   before anything touches the ledger. The card shows: entity name,
   vendor, amount, debit/credit lines, intercompany flag, matched
   rule from institutional memory, and a plain-English explanation of
   why the agent made this choice. One-click Approve or a free-text
   rejection reason. This is the trust layer that makes the system
   auditable. In Phase 1.2 the card is a React component and the
   confirmation loop lives in the UI; Phase 2 extracts proposal,
   confirmation, and session state into API-level primitives so the
   same trust layer works for any interface, not just the UI (see
   `docs/09_briefs/phase-2/interaction_model_extraction.md`).

6. **Industry-specific Chart of Accounts templates** — On org
   creation, the user selects an industry (healthcare, real estate,
   hospitality, trading, restaurant, holding company) and gets a
   pre-built IFRS-compliant CoA template. Phase 1.1 seeds only the
   templates the founder will actually use first (holding company +
   real estate).

7. **Trilingual interface** — English, French (fr-CA), and
   Traditional Mandarin (zh-Hant). All UI strings and report labels
   support i18n from day one. Agent responses are structured data,
   not English prose — the UI layer renders the localized text from
   the structured output.

---

## Non-Negotiable Constraints

- **Accounting standard:** IFRS (International Financial Reporting
  Standards)
- **Jurisdiction:** Canada — flag GST/HST implications throughout;
  Flinks is the preferred bank feed provider for Canadian institutions
  (not Plaid)
- **Languages:** English, French (fr-CA), Traditional Mandarin
  (zh-Hant)
- **Users:** ~100 across three personas (see
  `docs/00_product/personas.md`)
- **Entities:** ~50 organizations, multi-industry
- **Developer profile:** Solo non-developer founder using AI-assisted
  coding

---

## Locked-In Stack

| Layer | Choice | Notes |
|---|---|---|
| Language | TypeScript (strict mode, no `any` without justification) | End-to-end |
| Application | **Single Next.js app (Phase 1)** | API routes handle backend; no separate Express |
| Database & Auth | Supabase (PostgreSQL + Supabase Auth) | |
| AI Model | Claude (Anthropic) via `@anthropic-ai/sdk` | Model-agnostic abstraction layer |
| Repo | **Single Next.js repo (Phase 1)**, monorepo deferred to Phase 2 | |
| Deploy | Vercel | |
| Version Control | Git / GitHub | |
| IDE | VS Code | |
| API Testing | Postman | Deliver a collection per phase |
| Bank Feeds | Flinks (Canada-first) | Phase 2 |
| i18n | `next-intl` | English, fr-CA, zh-Hant |
| Background Jobs | **None in Phase 1** — pg-boss deferred to Phase 2 | |
| Logging | **`pino` with redact list** | |

Phase 1 ships as a single Next.js app with Next.js API routes
serving as the backend. The folder structure inside `src/` mirrors
the future monorepo layout so the Phase 2 split is mechanical. See
`docs/03_architecture/phase_simplifications.md` for the full
Phase 1 → Phase 2 correction path.
