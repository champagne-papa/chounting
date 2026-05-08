#!/usr/bin/env bash
# scripts/install-hooks.sh
#
# One-time setup: installs .git/hooks/pre-commit. Must be run once
# per clone / worktree; git doesn't track hooks themselves.
#
# The installed hook enforces:
#   1. Session Lock File Convention (see conventions.md).
#   2. ADR linting + index-regeneration check (per ADR-0021) when
#      the staged commit touches ADR-related files.

set -euo pipefail

HOOK_PATH=".git/hooks/pre-commit"

if [[ -f "$HOOK_PATH" ]]; then
  BACKUP="${HOOK_PATH}.pre-coordination"
  echo "Existing pre-commit hook found; backing up to $BACKUP"
  cp "$HOOK_PATH" "$BACKUP"
fi

cat > "$HOOK_PATH" <<'HOOK_EOF'
#!/usr/bin/env bash
# Installed by scripts/install-hooks.sh. Enforces:
#   1. Session Lock File Convention (see conventions.md).
#   2. ADR linting + index-regeneration check (per ADR-0021) when
#      the staged commit touches ADR-related files.

set -euo pipefail

# ---- Session lock check ----
LOCK=".coordination/session-lock.json"

if [[ ! -f "$LOCK" ]]; then
  # No lock: permissive mode, but warn so the bypass is visible.
  echo "[coordination] warning: no session lock in use;" >&2
  echo "consider running scripts/session-init.sh <label> before" >&2
  echo "starting new work." >&2
else
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
fi

# ---- ADR check (only when ADR-related files have changed) ----
ADR_CHANGED=$(git diff --cached --name-only --diff-filter=ACMR | grep -E '^(docs/07_governance/adr/|docs/02_specs/taxonomy\.md|docs/02_specs/invariants\.md|scripts/adr/)' || true)

if [[ -n "$ADR_CHANGED" ]]; then
  echo "[adr] ADR-related files staged; running adr:lint and adr:index --check..."
  if ! pnpm adr:lint; then
    echo "[adr] error: lint failed. Fix findings before committing." >&2
    exit 1
  fi
  if ! pnpm adr:index --check; then
    echo "[adr] error: index out of sync. Run 'pnpm adr:index' and re-stage README.md." >&2
    exit 1
  fi
fi

exit 0
HOOK_EOF

chmod +x "$HOOK_PATH"

echo "Pre-commit hook installed at $HOOK_PATH."
echo ""
echo "The hook enforces:"
echo "  1. Session Lock File Convention (.coordination/session-lock.json"
echo "     vs COORD_SESSION env var)."
echo "  2. ADR linting and index regeneration when ADR-related files"
echo "     are staged (docs/07_governance/adr/, docs/02_specs/taxonomy.md,"
echo "     docs/02_specs/invariants.md, scripts/adr/)."
echo ""
echo "Re-run this script in every worktree / clone you commit from,"
echo "and after any change to the hook content (e.g., when ADR-0021's"
echo "tooling discipline evolves)."
