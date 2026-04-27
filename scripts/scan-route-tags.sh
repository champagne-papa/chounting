#!/usr/bin/env bash
# scripts/scan-route-tags.sh
#
# Convention reference: docs/04_engineering/conventions.md
# "Documentation Routing" §Write-time tripwires (Fallback rule)
# and §Hygiene cadence step 1.
#
# Lists [ROUTE?] tags (unresolved routing decisions) in the active
# friction journal. Resolved [ROUTE: stays-in-journal] tags are
# also surfaced in --list mode but never count as violations.
#
# Modes:
#   --list (default)   print each match as
#                      "<status>: <path>:<line>: <text>"
#   --count            print integer count of unresolved [ROUTE?]
#   --phase-end        list mode + exit 1 if unresolved count > 0
#                      (for phase-end hygiene cadence enforcement)
#
# Exit:
#   --list: 0 regardless of count
#   --count: 0 regardless of count
#   --phase-end: 0 if unresolved count == 0, 1 otherwise

set -euo pipefail

JOURNAL="docs/07_governance/friction-journal.md"
MODE="list"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --list)      MODE="list"; shift ;;
    --count)     MODE="count"; shift ;;
    --phase-end) MODE="phase-end"; shift ;;
    *)
      echo "ERROR: unknown arg: $1" >&2
      echo "usage: scan-route-tags.sh [--list|--count|--phase-end]" >&2
      exit 2
      ;;
  esac
done

if [[ ! -f "$JOURNAL" ]]; then
  echo "ERROR: $JOURNAL not found" >&2
  exit 2
fi

# Two passes: unresolved [ROUTE?] and resolved [ROUTE: ...].
# grep -n emits "<line>:<text>"; we prefix status and path.
unresolved=$(grep -nE '\[ROUTE\?\]' "$JOURNAL" || true)
resolved=$(grep -nE '\[ROUTE: ' "$JOURNAL" || true)

unresolved_count=0
if [[ -n "$unresolved" ]]; then
  unresolved_count=$(printf "%s\n" "$unresolved" | wc -l)
fi

case "$MODE" in
  count)
    echo "$unresolved_count"
    exit 0
    ;;
  list|phase-end)
    if [[ -n "$unresolved" ]]; then
      while IFS= read -r entry; do
        printf "UNRESOLVED: %s:%s\n" "$JOURNAL" "$entry"
      done <<< "$unresolved"
    fi
    if [[ -n "$resolved" ]]; then
      while IFS= read -r entry; do
        printf "RESOLVED:   %s:%s\n" "$JOURNAL" "$entry"
      done <<< "$resolved"
    fi
    if [[ "$MODE" == "phase-end" ]]; then
      if [[ "$unresolved_count" -gt 0 ]]; then
        echo "" >&2
        echo "Phase-end hygiene violation: $unresolved_count unresolved [ROUTE?] tag(s) survive (convention §Hygiene cadence step 1)." >&2
        exit 1
      fi
    fi
    exit 0
    ;;
esac
