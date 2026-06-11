#!/usr/bin/env bash
# scripts/audit-friction-journal-citations.sh
#
# Convention reference: docs/04_engineering/conventions/README.md
# Routing rule + Archival rule sections (relocated from the pre-
# v2.2-reorg `docs/04_engineering/conventions.md` ## Documentation
# Routing section by Commit A of the v2.2 reorg). Post-split,
# citations to the friction journal must point at archive paths
# (friction-journal/phase-X.md) or retrospective stubs, not at the
# bare friction-journal.md path. The active friction-journal.md is
# reserved for in-flight phase entries.
#
# Added per S16 C1-extension (citation-grep methodology gap;
# see phase-2/obligations.md §Documentation Routing refinement
# candidates fifth bullet).
#
# Whitelist logic: W1 (structural-adjacency check).
#
#   Pattern A — `friction-journal\.md` matches (regex requires
#   `.md` immediately after `friction-journal`, so archive paths
#   like `friction-journal/phase-X.md` are NOT matched here; they
#   are counted separately by the informational archive-path pass):
#     convention-rule → bare friction-journal.md inside the
#                       routing-rule section of the canonical
#                       conventions README (rules describing the
#                       file's role) (clean)
#     ARCHIVE-MISMATCH → bare friction-journal.md outside
#                        the canonical routing-rule body (violation)
#
#   Pattern B — `friction-journal section` matches:
#     convention-prose → inside the canonical routing-rule body
#                        (descriptive prose about phase sections)
#                        (clean)
#     historical-anchor → outside the canonical routing-rule body
#                         AND within +/- 5 lines of either
#                         `phase-1.2-retrospective.md` or
#                         `§<digit> Pattern` (clean — preserved
#                         archeology inside an already-rewritten
#                         retrospective-stub citation)
#     SHORTHAND-PATTERN → outside the canonical routing-rule body
#                         AND no retrospective adjacency (violation)
#
# Post-v2.2-reorg: the "canonical routing-rule body" is the entire
# `docs/04_engineering/conventions/README.md` file (which contains
# the routing rule + archival rule sections). Pre-v2.2-reorg, the
# canonical body was the `## Documentation Routing` section inside
# `docs/04_engineering/conventions.md`. CONVENTIONS env var
# defaults to the new path.
#
# TODO (future maintenance): the +/- 5 line structural-adjacency
# heuristic is not bracket-balanced. A historical-anchor inside
# a parenthetical that spans more than 5 lines from its
# retrospective pointer would falsely flag as SHORTHAND-PATTERN.
# If that false positive surfaces, upgrade to bracket-balanced
# scanning (find the enclosing parenthetical and check its full
# span for adjacency, regardless of line distance). Captured here
# alongside the W1 logic explanation so future maintenance has
# the context.
#
# Usage:
#   bash scripts/audit-friction-journal-citations.sh
#   bash scripts/audit-friction-journal-citations.sh --verbose
#
# Exit: 0 if no ARCHIVE-MISMATCH or SHORTHAND-PATTERN flagged,
#       1 otherwise.

set -euo pipefail

# CONVENTIONS path is env-overridable for negative-test harnesses
# and future tooling that runs the auditor against a temp file
# (e.g., a pre-commit hook validating a candidate edit before it
# lands in the real conventions.md).
CONVENTIONS="${CONVENTIONS:-docs/04_engineering/conventions/README.md}"
ADJACENCY_LINES=5
VERBOSE=0

while [[ $# -gt 0 ]]; do
  case "$1" in
    --verbose) VERBOSE=1; shift ;;
    *)
      echo "ERROR: unknown arg: $1" >&2
      echo "usage: audit-friction-journal-citations.sh [--verbose]" >&2
      exit 2
      ;;
  esac
done

if [[ ! -f "$CONVENTIONS" ]]; then
  echo "ERROR: $CONVENTIONS not found" >&2
  exit 2
fi

# --- Detect canonical routing-rule body bounds dynamically ---
# Post-v2.2-reorg: the canonical body is the entire CONVENTIONS
# file (which defaults to conventions/README.md). Pre-reorg, the
# canonical body was the `## Documentation Routing` H2 section
# inside the monolithic conventions.md. The detection logic handles
# both: if `## Documentation Routing` is found, use its section
# bounds; otherwise treat the entire file as the canonical body
# (the post-reorg case, where the README is itself the routing-rule
# canonical body).
DOCROUTING_START=$(awk '/^## Documentation Routing/{print NR; exit}' "$CONVENTIONS")
if [[ -z "$DOCROUTING_START" ]]; then
  # Post-v2.2-reorg path: the entire file is the canonical body.
  DOCROUTING_START=1
  DOCROUTING_END=$(wc -l < "$CONVENTIONS")
else
  DOCROUTING_END=$(awk -v start="$DOCROUTING_START" '
    NR > start && /^## / { print NR - 1; exit }
    END { if (!found) print NR }
    { found = 1 }
  ' "$CONVENTIONS")
fi

# Helper: is line N inside the ## Documentation Routing section?
in_docrouting() {
  local n="$1"
  [[ "$n" -ge "$DOCROUTING_START" && "$n" -le "$DOCROUTING_END" ]]
}

# Helper: structural-adjacency check around line N. Returns 0 if
# any line in [N-ADJACENCY_LINES, N+ADJACENCY_LINES] contains
# either a retrospective pointer or a §<digit> Pattern reference.
has_retrospective_adjacency() {
  local n="$1"
  local lo=$(( n - ADJACENCY_LINES ))
  local hi=$(( n + ADJACENCY_LINES ))
  [[ "$lo" -lt 1 ]] && lo=1
  if sed -n "${lo},${hi}p" "$CONVENTIONS" | \
       grep -qE 'phase-1\.2-retrospective\.md|§[0-9]+ Pattern'; then
    return 0
  fi
  return 1
}

# --- Counters ---
convention_rule=0
convention_prose=0
historical_anchor=0
archive_mismatch=0
shorthand_pattern=0

violations=""

# --- Informational pass: archive-path citations ---
# Grep for friction-journal/phase- (matches archive paths). These
# are correct post-S16 rewrites and are not audit targets, but the
# count serves as a regression baseline: a sudden drop signals
# that a future edit may have rewritten an archive-path citation
# back to bare friction-journal.md inside ## Documentation Routing
# (where it'd classify as convention-rule and silently pass).
archive_path=$(grep -cE 'friction-journal/phase-' "$CONVENTIONS" || true)

# --- Pattern A pass: `friction-journal\.md` ---
# Pattern A's regex requires `.md` immediately after `friction-
# journal`, so it never matches archive paths (which have
# /phase-X between the prefix and `.md`). All matches are either
# bare friction-journal.md references inside the Documentation
# Routing convention's body (clean) or violations.
while IFS= read -r line; do
  [[ -z "$line" ]] && continue
  lineno="${line%%:*}"
  text="${line#*:}"

  if in_docrouting "$lineno"; then
    convention_rule=$(( convention_rule + 1 ))
  else
    archive_mismatch=$(( archive_mismatch + 1 ))
    violations+="${CONVENTIONS}:${lineno}: ARCHIVE-MISMATCH — ${text}"$'\n'
  fi
done < <(grep -nE 'friction-journal\.md' "$CONVENTIONS" || true)

# --- Pattern B pass: `friction-journal section` ---
while IFS= read -r line; do
  [[ -z "$line" ]] && continue
  lineno="${line%%:*}"
  text="${line#*:}"

  if in_docrouting "$lineno"; then
    convention_prose=$(( convention_prose + 1 ))
  elif has_retrospective_adjacency "$lineno"; then
    historical_anchor=$(( historical_anchor + 1 ))
  else
    shorthand_pattern=$(( shorthand_pattern + 1 ))
    violations+="${CONVENTIONS}:${lineno}: SHORTHAND-PATTERN — ${text}"$'\n'
  fi
done < <(grep -nE 'friction-journal section' "$CONVENTIONS" || true)

# --- Output ---
if [[ "$VERBOSE" -eq 1 ]]; then
  echo "Documentation Routing section: lines $DOCROUTING_START–$DOCROUTING_END"
  echo "Archive-path citations (informational):"
  echo "  friction-journal/phase-X.md : $archive_path"
  echo "Pattern A (friction-journal.md):"
  echo "  convention-rule     : $convention_rule"
  echo "  ARCHIVE-MISMATCH    : $archive_mismatch"
  echo "Pattern B (friction-journal section):"
  echo "  convention-prose    : $convention_prose"
  echo "  historical-anchor   : $historical_anchor"
  echo "  SHORTHAND-PATTERN   : $shorthand_pattern"
fi

if [[ -n "$violations" ]]; then
  printf "%s" "$violations"
  exit 1
fi

exit 0
