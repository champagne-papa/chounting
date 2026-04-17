# Pinned Views Strip — Phase 2 Brief

A strip of 3–5 pinned canvas views at the top of the canvas area,
user-chosen from Mainframe destinations or from any view the user
has navigated to. Clicking a pin activates that view. The canvas
remains single-pane (not split); pins are bookmarks, not
side-by-side panes.

Controllers and founders have 2–3 "home base" views (journal list,
P&L, AP queue) that they return to constantly. Navigating back
through the Mainframe for each return is slow. Pinned views close
the gap without introducing the complexity of a true split-pane
canvas — each pin stores a `CanvasDirective` and restores it on
click.

**Status:** Phase 2 pattern, captured during the agent autonomy
design sprint (2026-04-16). Not yet scoped, not yet specified
beyond this stub.

## What this is NOT

- Not split-pane / multi-canvas UI — the canvas stays
  single-pane; pins switch the active view, not add a second
  one.
- Not browser-tab semantics — pins are limited to 3–5 and
  user-curated, not unlimited and auto-accumulating.
- Not a replacement for canvas navigation history — back/forward
  still works within the active view. Pins are destination
  shortcuts, not history entries.

## Cross-references

- `docs/03_architecture/ui_architecture.md` (canvas navigation
  history section — pins coexist with but do not replace the
  history stack).
- `docs/02_specs/intent_model.md` §2 (navigation intents produce
  `CanvasDirective` — pins store directives).
- `docs/07_governance/friction-journal.md` entry 2026-04-16.
