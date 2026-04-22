# .coordination/

Session coordination for concurrent Claude Code / operator
sessions working the same repo. See
`docs/04_engineering/conventions.md` "Session Labeling
Convention" and "Session Lock File Convention" for the
load-bearing rules.

## What lives here

- `session-lock.json` (gitignored) — the currently-active
  session's identity and constraints. Present when a session is
  in flight; absent when no session holds the lock.
- `.gitkeep` — tracked so the directory exists on fresh clones.
- `README.md` (this file) — documentation.

## Lifecycle

1. **Session start:** operator or agent runs
   `bash scripts/session-init.sh <label>` to create
   `session-lock.json`. Operator exports the reported
   `COORD_SESSION` env var in their shell.
2. **During session:** every agent's Step 2 gate checks the
   lock. Every `git commit` passes through the pre-commit hook
   (installed one-time via `bash scripts/install-hooks.sh`);
   the hook compares `$COORD_SESSION` to the lock's label and
   refuses foreign-session commits.
3. **Session end:** operator or agent runs
   `bash scripts/session-end.sh` to remove the lock. Unsets
   `COORD_SESSION` from the shell.

## Stale-lock recovery

A lock is considered stale if:
- `started_at` is more than 6 hours old, AND
- No process matches the lock's `pid`, AND
- No recent commits carry a matching `Session:` trailer.

Manually inspect `session-lock.json`; if stale, remove with
`rm .coordination/session-lock.json` and re-run
`session-init.sh` for the current session.
