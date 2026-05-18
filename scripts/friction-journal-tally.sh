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

# Marker regex (ERE): bare Nth-instance tags or bare N=/N≥ counts.
# Word-boundary anchors (\b) protect against prefix/suffix matches
# (e.g., "instances" plural). Grep findings 2026-05-18: the journal's
# dominant pattern is bare Nth-instance (73 occurrences) rather than
# parenthesized (zero occurrences); bare N=/N≥ totals 668. Captures:
#   third-instance, fourth-instance, ...
#   N=2, N=3, N=4, ...
#   N≥2, N≥3, ...
MARKER_ERE='\b(first|second|third|fourth|fifth)-instance\b|\bN[=≥][0-9]+\b'

# Collect every line containing a marker, with line numbers.
# Output format (TSV): line_number<TAB>line_text
MARKER_LINES=$(grep -nE "$MARKER_ERE" "$JOURNAL" || true)

# Sanity check: ensure we got matches. Empty result is a real
# possibility (empty/new journal) and is not an error — print 0 and
# continue.
MARKER_COUNT=$(printf '%s' "$MARKER_LINES" | grep -c . || true)

echo "# Friction-Journal Tally"
echo "# Source: $JOURNAL"
echo "# Marker lines found: $MARKER_COUNT"
echo
echo "## T1 — Tagged instances (graduate-now candidates)"
echo "(awaiting bucket extraction)"
echo
echo "## T1.5 — Untagged instance markers (name-this candidates)"
echo "(awaiting bucket extraction)"

exit 0
