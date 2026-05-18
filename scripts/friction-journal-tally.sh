#!/usr/bin/env bash
# scripts/friction-journal-tally.sh
#
# Design spec: docs/09_briefs/phase-6.5/2026-05-17-friction-pattern-detector-design.md
#
# Deterministic tier-1 / tier-1.5 tally over the active friction
# journal. Emits a structured stdout report with graduation-check
# status. Always exits 0 (surfacing tool, not a linter — see spec
# §Components for the rationale).
#
# Standalone usage:
#   bash scripts/friction-journal-tally.sh
#
# Invoked by:
#   .claude/agents/friction-pattern-detector.md (subagent that layers
#   T2 anchored-semantic and T3 unanchored-discovery on top of this
#   script's output).

set -euo pipefail

JOURNAL="${JOURNAL:-docs/07_governance/friction-journal.md}"

if [[ ! -f "$JOURNAL" ]]; then
  echo "ERROR: $JOURNAL not found" >&2
  exit 2
fi

echo "# Friction-Journal Tally"
echo "# Source: $JOURNAL"
echo
echo "## T1 — Tagged instances (graduate-now candidates)"
echo "## T1.5 — Untagged instance markers (name-this candidates)"
echo
echo "(placeholder — implementation incoming)"

exit 0
