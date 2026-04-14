# Request Lifecycle

How requests flow through the system, from browser to database and
back. Three paths: manual (user fills out a form), agent (user sends
a chat message), and confirmation (user clicks Approve on a proposed
entry card).

Source: extracted from PLAN.md §1c during Phase 1.1 closeout
restructure.

---

## Manual Path

User fills out a form, submits:

```
Browser
  → Next.js page (server component) — gets session from Supabase Auth cookie
  → User submits form → POST to /api/orgs/[orgId]/journal-entries
  → Next.js API route handler (thin adapter)
      → withInvariants(journalEntryService.post)(input, ctx)
          → Zod parse input against journalEntry.schema.ts
          → ServiceContext built with trace_id, org_id, caller
          → canUserPerformAction() — Auth check (INV-AUTH-001)
          → periodService.isOpen() — Period check
          → BEGIN transaction
            → INSERT journal_entries
            → INSERT journal_lines (deferred constraint validates debit=credit at COMMIT — INV-LEDGER-001)
            → recordMutation() → INSERT audit_log (Simplification 1)
          → COMMIT (deferred constraint runs here; ROLLBACK on failure)
      → Returns typed result
  → Next.js API route returns JSON
  → Browser renders updated journal entry list
```

RLS applies as defense-in-depth: the service-role Supabase client
(used by service functions) bypasses RLS, but any Next.js server
component that reads data directly uses the user-scoped client which
respects RLS.

## Agent Path (Phase 1.2 — Double Entry only)

User types a message in the agent chat panel:

```
User types message in agent chat panel
  → POST to /api/agent/message with user_id, org_id, locale
  → Orchestrator (src/agent/orchestrator/index.ts)
      → Generates trace_id (UUID) — propagated through every downstream call
      → Loads AgentSession from Postgres (or creates new on org switch)
      → Loads OrgContext via orgContextManager
      → Builds system prompt (persona-aware) + conversation history
      → Calls Claude API with available tools (Phase 1: postJournalEntry, listChartOfAccounts, checkPeriod)
  → Claude returns a tool_use call: postJournalEntry with structured arguments
  → Orchestrator validates tool_use args against doubleEntry.contract.ts
      → If invalid: bounded retry (max 2) with validation error fed back to Claude
      → If still invalid: return error to user with clarification request
  → Orchestrator invokes the tool in DRY-RUN mode
      → withInvariants(journalEntryService.post)(input with dry_run=true, ctx)
          → All checks run, transaction begins, writes happen, ROLLBACK at end
          → Returns the ProposedEntryCard with dry_run_entry_id
  → Orchestrator wraps result with canvas_directive { type: 'proposed_entry_card', card }
  → API response streams back to UI
  → AgentChatPanel renders agent message inline
  → ContextualCanvas renders ProposedEntryCard
```

## Confirmation Commit Path

User clicks Approve on a ProposedEntryCard:

```
User clicks Approve
  → POST to /api/agent/confirm with idempotency_key, dry_run_entry_id
  → Orchestrator
      → Looks up the dry-run result by dry_run_entry_id
      → Calls journalEntryService.post() AGAIN with dry_run=false and idempotency_key
          → Idempotency check: SELECT from ai_actions WHERE idempotency_key = ?
              → If found and Confirmed: return existing result (no work done)
              → If found and Pending: return existing card
              → If not found: proceed
          → BEGIN transaction
            → INSERT journal_entries
            → INSERT journal_lines (deferred constraint validates at COMMIT — INV-LEDGER-001)
            → INSERT audit_log (Simplification 1)
            → INSERT ai_actions row with confirming_user_id, journal_entry_id, status='Confirmed'
          → COMMIT
  → Returns success + canvas_directive { type: 'journal_entry', entryId, mode: 'view' }
  → ContextualCanvas swaps from ProposedEntryCard to JournalEntryDetail view
```
