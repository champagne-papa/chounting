#!/usr/bin/env bash
# scripts/install-hooks.sh
#
# One-time setup: installs .git/hooks/pre-commit. Must be run once
# per clone / worktree; git doesn't track hooks themselves.
#
# The installed hook enforces:
#   1. Session Lock File Convention — identity (COORD_SESSION match)
#      + location (repo-root cwd via GIT_PREFIX) when the lock file
#      exists (see
#      docs/04_engineering/conventions/session/iterative-catching.md
#      and docs/04_engineering/conventions/code.md §Commit-shell
#      hygiene under a session lock).
#   2. ADR linting + index-regeneration check (per ADR-0021) when
#      the staged commit touches ADR-related files.
#   3. .claude/rules/ frontmatter lint (quoted globs per Claude Code
#      issue #13905) when .claude/rules/*.md files are staged.

set -euo pipefail

HOOK_PATH=".git/hooks/pre-commit"

# Write the new hook content to a temp file first so we can compare
# with the existing hook before deciding whether to back up + install.
TMP_HOOK=$(mktemp)
trap 'rm -f "$TMP_HOOK"' EXIT

cat > "$TMP_HOOK" <<'HOOK_EOF'
#!/usr/bin/env bash
# Installed by scripts/install-hooks.sh. Enforces:
#   1. Session Lock File Convention — identity (COORD_SESSION match)
#      + location (repo-root cwd via GIT_PREFIX) when the lock file
#      exists (see
#      docs/04_engineering/conventions/session/iterative-catching.md
#      and docs/04_engineering/conventions/code.md §Commit-shell
#      hygiene under a session lock).
#   2. ADR linting + index-regeneration check (per ADR-0021) when
#      the staged commit touches ADR-related files.
#   3. .claude/rules/ frontmatter lint (quoted globs per Claude Code
#      issue #13905) when .claude/rules/*.md files are staged.

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

  # ---- cwd guard (commit-shell hygiene; Wave-6 retro §3.2) ----
  if [[ -n "${GIT_PREFIX:-}" ]]; then
    echo "[coordination] error: commit invoked from subdirectory" >&2
    echo "'${GIT_PREFIX}', not the repo root, while session lock" >&2
    echo "'$LOCK_LABEL' is active. Commit-shell hygiene" >&2
    echo "(conventions/code.md) requires repo-root commits under a" >&2
    echo "lock. Run:" >&2
    echo "  cd \"\$(git rev-parse --show-toplevel)\"" >&2
    echo "and retry. Commit blocked. (--no-verify is the deliberate" >&2
    echo "exception path; record why in the commit body if used.)" >&2
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

# ---- .claude/rules/ frontmatter lint ----
RULES_CHANGED=$(git diff --cached --name-only --diff-filter=ACMR | grep -E '^\.claude/rules/.*\.md$' || true)

if [[ -n "$RULES_CHANGED" ]]; then
  echo "[rules-lint] .claude/rules/*.md files staged; running frontmatter lint..."
  if ! bash scripts/lint-rules-frontmatter.sh "$RULES_CHANGED"; then
    echo "[rules-lint] error: lint failed. Fix findings before committing." >&2
    exit 1
  fi
fi

exit 0
HOOK_EOF

# Content-equivalence short-circuit: if existing hook matches the
# new content byte-for-byte, skip backup + install + messaging.
if [[ -f "$HOOK_PATH" ]] && cmp -s "$TMP_HOOK" "$HOOK_PATH"; then
  echo "Pre-commit hook already installed at $HOOK_PATH (no action)."
  exit 0
fi

# Otherwise, back up existing hook (only when content differs) and
# install the new hook.
if [[ -f "$HOOK_PATH" ]]; then
  BACKUP="${HOOK_PATH}.pre-coordination"
  echo "Existing pre-commit hook differs from new content; backing up to $BACKUP"
  cp "$HOOK_PATH" "$BACKUP"
fi

mv "$TMP_HOOK" "$HOOK_PATH"
chmod +x "$HOOK_PATH"
trap - EXIT  # Disarm the cleanup since TMP_HOOK no longer exists.

echo "Pre-commit hook installed at $HOOK_PATH."
echo ""
echo "The hook enforces:"
echo "  1. Session Lock File Convention (.coordination/session-lock.json"
echo "     vs COORD_SESSION env var; repo-root cwd via GIT_PREFIX when"
echo "     the lock exists)."
echo "  2. ADR linting and index regeneration when ADR-related files"
echo "     are staged (docs/07_governance/adr/, docs/02_specs/taxonomy.md,"
echo "     docs/02_specs/invariants.md, scripts/adr/)."
echo "  3. .claude/rules/ frontmatter lint (quoted globs per Claude Code"
echo "     issue #13905) when .claude/rules/*.md files are staged."
echo ""
echo "Re-run this script in every worktree / clone you commit from,"
echo "and after any change to the hook content (e.g., when ADR-0021's"
echo "tooling discipline evolves)."
