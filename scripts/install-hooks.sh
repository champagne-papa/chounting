#!/usr/bin/env bash
# scripts/install-hooks.sh
#
# One-time setup: installs .git/hooks/pre-commit for the session
# lock file convention. Must be run once per clone / worktree;
# git doesn't track hooks themselves.
#
# See docs/04_engineering/conventions.md "Session Lock File
# Convention" for the mechanism's role.

set -euo pipefail

HOOK_PATH=".git/hooks/pre-commit"

if [[ -f "$HOOK_PATH" ]]; then
  BACKUP="${HOOK_PATH}.pre-coordination"
  echo "Existing pre-commit hook found; backing up to $BACKUP"
  cp "$HOOK_PATH" "$BACKUP"
fi

cat > "$HOOK_PATH" <<'HOOK_EOF'
#!/usr/bin/env bash
# Installed by scripts/install-hooks.sh. Enforces the Session
# Lock File Convention. See conventions.md for rationale.

set -euo pipefail

LOCK=".coordination/session-lock.json"

if [[ ! -f "$LOCK" ]]; then
  # No lock: permissive mode, but warn so the bypass is visible.
  echo "[coordination] warning: no session lock in use;" >&2
  echo "consider running scripts/session-init.sh <label> before" >&2
  echo "starting new work." >&2
  exit 0
fi

LOCK_LABEL=$(grep -oE '"session":[[:space:]]*"[^"]+"' "$LOCK" | sed -E 's/.*"([^"]+)"$/\1/')

if [[ -z "${COORD_SESSION:-}" ]]; then
  echo "[coordination] error: session lock is held by '$LOCK_LABEL'" >&2
  echo "but COORD_SESSION is not set in your shell. If this commit" >&2
  echo "is from session '$LOCK_LABEL', run:" >&2
  echo "  export COORD_SESSION='$LOCK_LABEL'" >&2
  echo "and retry. If a different session holds the lock, stop and" >&2
  echo "resolve. Commit blocked." >&2
  exit 1
fi

if [[ "$COORD_SESSION" != "$LOCK_LABEL" ]]; then
  echo "[coordination] error: active lock is for session" >&2
  echo "'$LOCK_LABEL' but your shell's COORD_SESSION is" >&2
  echo "'$COORD_SESSION'. This looks like a foreign-session commit." >&2
  echo "Stop and resolve before retrying. Commit blocked." >&2
  exit 1
fi

# COORD_SESSION matches LOCK_LABEL — allow silently.
exit 0
HOOK_EOF

chmod +x "$HOOK_PATH"

echo "Pre-commit hook installed at $HOOK_PATH."
echo ""
echo "The hook reads .coordination/session-lock.json and refuses"
echo "commits whose COORD_SESSION env var doesn't match the"
echo "active lock's session label. Re-run this script in every"
echo "worktree/clone you commit from."
