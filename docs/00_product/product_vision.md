# Product Vision

What this product is, who it's for, why it's different, and the
constraints it operates under.

Source: extracted from PLAN.md "The Product," "Who This Is For,"
"Non-Negotiable Constraints," and "Locked-In Stack" sections during
Phase 1.1 closeout restructure.

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
a traditional accounting system. That is the wrong direction. **The
Bridge is an AI agent system that happens to have a traditional
accounting UI underneath it — not the reverse.**

The philosophical difference:
- In Xero, you open a screen, fill in a form, click Save. The AI is
  a helper.
- In The Bridge, the AI agent is the primary actor. It reads your
  email, sees the invoice, proposes the journal entry, shows you a
  confirmation card, and you approve with one click. The traditional
  screen exists as a fallback and a power-user tool — not the default
  path.

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
   auditable.

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
