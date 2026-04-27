#!/usr/bin/env bash
# scripts/detect-journal-headings.sh
#
# Convention reference: docs/04_engineering/conventions.md
# "Documentation Routing" §Write-time tripwires #2 (no embedded
# retrospectives in the journal). H3/H4 headings inside
# friction-journal.md signal that retrospective content has
# overshot its container and should be routed to a retrospective.
#
# Scope: active friction-journal.md only. Archives under
# friction-journal/*.md are exempt per §Archival rule clause 2 —
# archived sections preserve their original lettering, including
# H3 markers like "### (a) ...".
#
# Usage:
#   bash scripts/detect-journal-headings.sh
#
# Exit: 0 if no H3/H4 found, 1 if any match.

set -euo pipefail

JOURNAL="docs/07_governance/friction-journal.md"

if [[ ! -f "$JOURNAL" ]]; then
  echo "ERROR: $JOURNAL not found" >&2
  exit 2
fi

matches=$(grep -nE '^####? ' "$JOURNAL" || true)

if [[ -z "$matches" ]]; then
  exit 0
fi

while IFS= read -r entry; do
  printf "%s:%s\n" "$JOURNAL" "$entry"
done <<< "$matches"

exit 1
