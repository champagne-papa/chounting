---
name: ui-session-screenshot-gate
description: Use at UI-session arc/phase closeout to gate ratification on a screenshot capture sequence. Orchestrator drafts the sequence, founder captures, orchestrator spot-checks.
trigger: Arc/phase closeout when shipped work included UI changes (new canvas views, table structure, navigation paths, visual discriminators).
---

# UI-Session Screenshot Gate

## Purpose

Any step that ships UI changes requires a screenshot gate before
ratification. The gate blocks arc / phase closeout until an
orchestrator-drafted capture sequence has been founder-captured
against a fresh seed state and orchestrator spot-checked.

## When to invoke

Typical triggers: new canvas views, table structure changes,
new clickability or navigation paths, visual discriminators on
entry types. Steps that touch only non-visible surfaces
(service logic, API routes, server-side guards) skip the gate.

## Procedure

1. Orchestrator drafts a prescribed capture sequence (typically
   2–5 shots) with per-shot verifications.
2. Founder captures against a fresh `pnpm db:reset:clean && pnpm
   db:seed:all` state to eliminate accumulated test pollution.
3. Orchestrator spot-checks each shot against the prescribed
   verifications.
4. Gate blocks arc / phase closeout until passed.

## Precedent

Arc A used this pattern 6 times (Steps 7, 8a, 8b, 9b, 10b, 12b). See
`docs/07_governance/retrospectives/arc-A-retrospective.md` §3
Pattern 2 for mechanism details.
