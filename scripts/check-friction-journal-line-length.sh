#!/usr/bin/env bash
# scripts/check-friction-journal-line-length.sh
#
# Convention reference: docs/04_engineering/conventions.md
# "Documentation Routing" §Write-time tripwires #1 (10-second
# rule). A single friction-journal entry must be readable in
# roughly 10 seconds. Format:
#   [date] [category] [one-line description]
# with optional 2-3 line elaboration; entries longer than ~10
# lines are signal that content belongs elsewhere.
#
# Usage:
#   bash scripts/check-friction-journal-line-length.sh
#   bash scripts/check-friction-journal-line-length.sh --max-lines 12
#
# Exits 0 if all bullets are <= MAX_LINES, 1 if any exceed.

set -euo pipefail

JOURNAL="docs/07_governance/friction-journal.md"
MAX_LINES=10

while [[ $# -gt 0 ]]; do
  case "$1" in
    --max-lines)
      MAX_LINES="${2:?--max-lines requires an integer}"
      shift 2
      ;;
    *)
      echo "ERROR: unknown arg: $1" >&2
      echo "usage: check-friction-journal-line-length.sh [--max-lines N]" >&2
      exit 2
      ;;
  esac
done

if [[ ! -f "$JOURNAL" ]]; then
  echo "ERROR: $JOURNAL not found" >&2
  exit 2
fi

# Awk state machine: track each top-level bullet's span. A bullet
# starts at ^-  (dash + space). Continuation lines are blank lines
# or lines starting with 2+ spaces. Anything else flushes the
# current bullet.
#
# On flush, if the span exceeds MAX_LINES, emit a violation line.
violations=$(awk -v max="$MAX_LINES" -v path="$JOURNAL" '
  function flush() {
    if (in_bullet && span > max) {
      printf("%s:%d: bullet spans %d lines (>%d — convention §10-second rule)\n",
             path, start, span, max)
      found = 1
    }
    in_bullet = 0
    span = 0
    start = 0
  }
  /^- / {
    flush()
    in_bullet = 1
    start = NR
    span = 1
    next
  }
  in_bullet && (/^  / || /^$/) {
    span++
    next
  }
  {
    flush()
  }
  END {
    flush()
    exit found ? 1 : 0
  }
' "$JOURNAL") && status=0 || status=$?

if [[ -n "$violations" ]]; then
  printf "%s\n" "$violations"
fi

exit "$status"
