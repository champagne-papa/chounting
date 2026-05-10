# Mobile Approval Remote — Phase 2 Brief

On mobile (phones, 6-inch-class screens), the product shifts to
an Approval Remote Control mode. The agent pings the user, the
mutation card renders full-screen, the user swipes to approve or
reject. Read-only canvas glance (P&L, dashboard) is available but
deep-work canvas views are not.

The canvas is useless for deep work on a 6-inch screen. Rather
than crippling the mobile experience or forcing accountants to
carry laptops for quick approvals, mobile repositions around the
one thing it is genuinely good for: in-the-moment notification +
approval. The founder checks their phone, sees a proposed entry,
approves it, and puts the phone away. Deep work stays on desktop.

**Status:** Phase 2 pattern, captured during the agent autonomy
design sprint (2026-04-16). Not yet scoped, not yet specified
beyond this stub.

## What this is NOT

- Not mobile parity with desktop. Deep canvas work, spec-heavy
  forms, and the Mainframe rail are explicitly desktop-only.
  Mobile is a subset path, not a complete product.
- Not a standalone mobile app in v1 — the mobile experience is
  a responsive layout of the same web product. Native apps are
  Phase 3+ if warranted by usage data.
- Not push notifications for every agent action — only actions
  requiring user approval (`required_action = 'approve'`)
  surface as notifications. Auto-posted entries do not notify
  mobile.

## Cross-references

- `docs/02_specs/mutation_lifecycle.md` §5 (the Lifecycle View
  on mobile is read-only; only Needs Attention mutations surface
  for action).
- `docs/03_architecture/ui_architecture.md` (Mainframe
  constraint — mobile is a subset of the Mainframe path, not a
  separate product).
- `docs/07_governance/friction-journal.md` entry 2026-04-16.
