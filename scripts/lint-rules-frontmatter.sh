#!/usr/bin/env bash
# scripts/lint-rules-frontmatter.sh
#
# Lints .claude/rules/*.md frontmatter for quoted glob patterns.
# Per Claude Code issue #13905, unquoted glob patterns starting with
# `*` silently fail YAML parsing — the rule file appears to land but
# rules never fire. This script catches the failure shape at
# pre-commit time.
#
# Invoked by .git/hooks/pre-commit (installed via scripts/install-hooks.sh)
# when .claude/rules/*.md files are staged. Can also be run directly:
#
#   bash scripts/lint-rules-frontmatter.sh
#
# Exit code: 0 if all rule files have quoted globs; 1 otherwise.

set -euo pipefail

FILES_TO_CHECK="${1:-}"

# If no argument provided, scan all .claude/rules/*.md files.
if [[ -z "$FILES_TO_CHECK" ]]; then
  if [[ ! -d .claude/rules ]]; then
    echo "[lint-rules-frontmatter] no .claude/rules/ directory; nothing to check."
    exit 0
  fi
  FILES_TO_CHECK=$(ls .claude/rules/*.md 2>/dev/null || true)
fi

if [[ -z "$FILES_TO_CHECK" ]]; then
  exit 0
fi

FAILURES=()

for file in $FILES_TO_CHECK; do
  # Check only the frontmatter (lines between the first two `---` lines).
  # An unquoted glob pattern looks like `  - **/*.ts` (no surrounding quotes).
  # Quoted forms: `  - "**/*.ts"` or `  - '**/*.ts'`.
  UNQUOTED=$(awk '
    /^---$/ { fm = !fm; next }
    fm && /^[[:space:]]+-[[:space:]]+[^"'\''[:space:]]/ {
      if ($0 ~ /[*{[]/) {
        print FILENAME ":" NR ": " $0
      }
    }
  ' "$file" || true)

  if [[ -n "$UNQUOTED" ]]; then
    FAILURES+=("$UNQUOTED")
  fi
done

if [[ ${#FAILURES[@]} -gt 0 ]]; then
  echo "[lint-rules-frontmatter] error: unquoted glob patterns found in" >&2
  echo "                          .claude/rules/*.md frontmatter. Per Claude" >&2
  echo "                          Code issue #13905, these silently fail YAML" >&2
  echo "                          parsing — the rule appears to land but rules" >&2
  echo "                          never fire. Quote each glob:" >&2
  echo "" >&2
  for failure in "${FAILURES[@]}"; do
    echo "  $failure" >&2
  done
  echo "" >&2
  echo "Fix: wrap each glob in double quotes (e.g., \"**/*.ts\")." >&2
  exit 1
fi

exit 0
