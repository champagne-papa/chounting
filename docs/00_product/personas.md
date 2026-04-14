# The Three User Personas

Design every screen, agent response, and permission model with these
three personas in mind. They are equally first-class.

The role-permission mapping that drives `canUserPerformAction` lives
in `docs/02_specs/ledger_truth_model.md` (INV-AUTH-001), not here.
This document describes who the users are and what they need; the
specs describe what the system allows them to do.

Source: extracted from PLAN.md "The Three User Personas" during
Phase 1.1 closeout restructure.

---

## Persona 1: The Executive (CFO / Founder)

- Wants consolidated P&L across all entities, cash position, variance
  alerts.
- Asks the agent high-level questions: "What compressed my hotel
  division's margins last quarter?" or "What's my runway across all
  entities if revenue drops 20%?"
- Approves large or unusual transactions.
- Never wants to touch a journal entry manually.
- Default landing: Consolidated Dashboard.

## Persona 2: The Controller / Senior Accountant

- Manages month-end close, reviews AI-proposed entries, approves
  learned rules.
- Needs full access to Chart of Accounts, Manual Journals, Period
  Locking, Intercompany Eliminations, and the AI Action Review queue.
- Trusts the agent but verifies — wants to see the agent's reasoning,
  not just its answer.
- Default landing: The Bridge (agent + canvas) with controller-level
  tool access.

## Persona 3: The AP Specialist / Bookkeeper

- Primary daily loop (Phase 2+): process incoming bills, match bank
  transactions, reconcile.
- Protected from making mistakes by the agent's rule-based guardrails
  — they cannot post to locked periods, cannot override intercompany
  flags, cannot approve their own entries.
- The agent is their co-pilot: it pre-fills everything, they confirm.
- Default landing (Phase 2+): AP Queue (inbox of pending AI-proposed
  entries).
