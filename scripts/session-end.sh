#!/usr/bin/env bash
# scripts/session-end.sh
#
# Removes .coordination/session-lock.json.
#
# See docs/04_engineering/conventions.md "Session Lock File
# Convention" for the mechanism's role.

set -euo pipefail

LOCK=".coordination/session-lock.json"

if [[ ! -f "$LOCK" ]]; then
  echo "No session lock present. Nothing to remove."
  exit 0
fi

echo "Removing lock:"
cat "$LOCK"
rm "$LOCK"
echo ""
echo "Lock removed. Unset COORD_SESSION in your shell:"
echo "  unset COORD_SESSION"
