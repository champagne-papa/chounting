#!/usr/bin/env bash
# scripts/session-init.sh
#
# Creates .coordination/session-lock.json for the current
# session. Usage:
#   bash scripts/session-init.sh <label> [prompt_doc_path]
#
# If a foreign lock exists, prints the current lock's contents
# and exits non-zero (idempotent failure).
#
# See docs/04_engineering/conventions.md "Session Lock File
# Convention" for the mechanism's role.

set -euo pipefail

LABEL="${1:?usage: session-init.sh <label> [prompt_doc_path]}"
PROMPT_DOC="${2:-}"
LOCK=".coordination/session-lock.json"

if [[ -f "$LOCK" ]]; then
  echo "ERROR: session lock already exists:" >&2
  cat "$LOCK" >&2
  echo "" >&2
  echo "Resolve (remove via session-end.sh if it's stale, or" >&2
  echo "proceed under the existing lock) before re-initing." >&2
  exit 1
fi

mkdir -p .coordination

# Note: Linux/WSL date syntax; if porting to macOS, verify -u
# flag behavior.
cat > "$LOCK" <<EOF
{
  "session": "$LABEL",
  "started_at": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "pid": $$,
  "prompt_doc": "$PROMPT_DOC",
  "constraints": []
}
EOF

echo "Session lock created at $LOCK."
echo ""
echo "Next step: export COORD_SESSION in your shell so the"
echo "pre-commit hook recognizes this session:"
echo ""
echo "  export COORD_SESSION='$LABEL'"
echo ""
echo "Run at session end:  bash scripts/session-end.sh"
