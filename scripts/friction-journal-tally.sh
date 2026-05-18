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

# Run awk over the journal, tracking H2 date headings as context and
# extracting bucket references from each marker line.
#
# H2 date heading shape (per journal convention):
#   ## 2026-04-30 — Q33 partial-resolution arc
#   ## Phase 2
# We capture the YYYY-MM-DD prefix when present; for phase-style H2s
# (no date), retain the previous date until the next dated H2.
#
# Bucket regex priorities (first match in the window wins):
#   B1: \([^()[:space:]]+\)          — paren-delimited single-token bucket
#       + shape rejects + heuristic discriminator. Permissive matching
#       captures the bucket-ID-shaped span; two filters in series determine
#       whether to return the candidate or fall through to B2/B3.
#
#       Length cap removed 2026-05-19 (ARC 2.5) per empirical audit of
#       parenthesized-token length distribution in the journal: real
#       buckets and non-bucket tokens (file paths, code refs) overlap
#       across 27-65+ chars, so no length value cleanly separates them.
#       Shape rejects carry the discrimination instead. See friction-journal
#       2026-05-19 ARC 2.5 banking for the audit findings table.
#
#       Shape rejects (fall through to B2/B3 if any fire):
#         - candidate starts or ends with backtick (`)  →  code/path ref
#           wrapped in `...` (e.g., `docs/...md`, `service.method`)
#         - candidate contains slash (/)                →  file path
#       Heuristic discriminator (ARC 2, 2026-05-19): candidate must
#       contain at least one of {digit, hyphen, non-ASCII byte}. Rejects
#       all-lowercase status annotations, enumeration markers, prose
#       asides. Accepts (cadence-β-i-a), (α), (γ'), (RI-6), (β-1), (Z1),
#       (D2.7-gate-with-substrate-ship-only-exception), and the longer
#       kebab-case bucket families.
#
#       Locale-independent (byte negation, not character class).
#   B2: \b([A-Z][A-Z0-9-]+[A-Z0-9])\b — uppercase code-like
#       (catches F-J-14, RI-6, Z1 when unparenthesized)
#   B3: \b((Path|Framing|Approach|Method) [A-Z][A-Za-z']*)\b
#       — phrasal (catches Path C, Framing B')
#
# Window construction: marker bytes are STRUCTURALLY EXCLUDED from the
# search window. The window = left_part " | " right_part where left_part
# is up to 50 chars before the marker and right_part is up to 50 chars
# after. The " | " separator prevents B1 from merging tokens across the
# seam (without it, a half-token on the left edge could concatenate with
# a half-token on the right edge into a phantom bucket). Priority:
# left-first — the empirical dominant journal pattern (grep audit
# 2026-05-18) is "(bucket) Nth-instance" with bucket parenthesized
# immediately left-adjacent to a bare marker.
#
# Output TSV: bucket<TAB>line_no<TAB>date<TAB>full_line
# Empty bucket field => T1.5 candidate (untagged marker).

EXTRACTED=$(awk '
function extract_bucket(win,    candidate, copy) {
  # B1: paren-delimited single-token bucket + shape rejects + heuristic.
  # Length cap removed 2026-05-19 (ARC 2.5); shape rejects + heuristic
  # carry discrimination. See outer comment block above for full rationale
  # and audit reference.
  # Fall-through: if any shape reject fires OR the heuristic rejects,
  # control flows past the if-block to B2/B3.
  if (match(win, /\([^()[:space:]]+\)/)) {
    candidate = substr(win, RSTART+1, RLENGTH-2)
    # Shape rejects (ARC 2.5):
    #   - backtick at start/end → code/path reference wrapped in `...`
    #   - slash anywhere        → file path
    if (substr(candidate, 1, 1) != "`" && \
        substr(candidate, length(candidate), 1) != "`" && \
        index(candidate, "/") == 0) {
      # Heuristic (ARC 2): candidate must contain at least one of
      # {digit, hyphen, non-ASCII byte}. Non-ASCII detection uses
      # gsub-strip-ASCII-printable-and-check-residual because gawk regex
      # character classes do not accept \xHH or \NNN byte-value escapes;
      # the literal printable-range [!-~] (0x21..0x7E) approach is portable.
      if (match(candidate, /[0-9-]/)) {
        return candidate
      }
      copy = candidate
      gsub(/[!-~]/, "", copy)
      if (length(copy) > 0) {
        return candidate
      }
    }
    # shape-rejected OR heuristic-rejected — fall through to B2/B3
  }
  # B2: uppercase code-like
  if (match(win, /[A-Z][A-Z0-9-]+[A-Z0-9]/)) {
    return substr(win, RSTART, RLENGTH)
  }
  # B3: phrasal
  if (match(win, /(Path|Framing|Approach|Method) [A-Z][A-Za-z'\'']*/)) {
    return substr(win, RSTART, RLENGTH)
  }
  return ""
}

# Track current H2 date as we scan.
/^## [0-9]{4}-[0-9]{2}-[0-9]{2}/ {
  match($0, /[0-9]{4}-[0-9]{2}-[0-9]{2}/)
  current_date = substr($0, RSTART, RLENGTH)
  next
}
/^## / {
  # Non-dated H2 (e.g., "## Phase 2"); keep previous date.
  next
}

# Marker lines. Regex is embedded as a literal (not passed via -v)
# because awk -v escape-processes \b into a literal backspace; gawk
# also does not recognize \b inside EREs. The bash MARKER_ERE variable
# above uses \b for grep (which DOES support \b); the equivalent inside
# awk uses \< and \> (gawk word-boundary anchors).
{
  if (match($0, /\<(first|second|third|fourth|fifth)-instance\>|\<N[=≥][0-9]+\>/)) {
    marker_start = RSTART
    marker_len = RLENGTH

    # Build the search window EXCLUDING the marker bytes themselves.
    # Prevents B1 from ever capturing the marker substring as if it
    # were a bucket. Left side: up to 50 chars before the marker.
    # Right side: up to 50 chars after the marker. " | " separator
    # prevents B1 from merging tokens across the seam.

    left_end = marker_start - 1
    left_start = (left_end >= 50) ? left_end - 49 : 1
    if (left_end >= left_start) {
      left_part = substr($0, left_start, left_end - left_start + 1)
    } else {
      left_part = ""
    }
    right_part = substr($0, marker_start + marker_len, 50)

    # Left-first priority: dominant journal pattern is "(bucket)
    # Nth-instance" per 2026-05-18 grep audit. awk match() returns
    # the earliest match in win, so left_part being first gives it
    # priority while still falling through to right_part if absent.
    win = left_part " | " right_part

    bucket = extract_bucket(win)
    print bucket "\t" NR "\t" current_date "\t" $0
  }
}
' "$JOURNAL")

# How many T1 vs T1.5 lines did we extract?
TAGGED_COUNT=$(printf '%s\n' "$EXTRACTED" | awk -F'\t' '$1 != "" {n++} END {print n+0}')
UNTAGGED_COUNT=$(printf '%s\n' "$EXTRACTED" | awk -F'\t' '$1 == "" {n++} END {print n+0}')

echo "# Friction-Journal Tally"
echo "# Source: $JOURNAL"
echo "# Marker lines found: $MARKER_COUNT (tagged: $TAGGED_COUNT, untagged: $UNTAGGED_COUNT)"
echo
echo "## T1 — Tagged instances (graduate-now candidates)"

# T1 aggregation: group tagged rows by bucket, count instances,
# find latest_marker_date, collect source line numbers.
#
# Output columns: bucket_id | instance_count | latest_marker_date | source_lines
#
# At this stage graduated_yn is unknown — populated by Tasks 6-7.
# Use a placeholder "?" for now so the column structure is stable.

T1_ROWS=$(printf '%s\n' "$EXTRACTED" | awk -F'\t' '
$1 != "" {
  bucket = $1
  count[bucket]++
  # latest_date: lexicographic compare works because dates are YYYY-MM-DD.
  if ($3 > latest[bucket]) latest[bucket] = $3
  lines[bucket] = (lines[bucket] == "") ? $2 : lines[bucket] "," $2
}
END {
  for (b in count) {
    # Sentinel "-" for empty latest date: bash IFS=$'"'"'\t'"'"' read collapses
    # consecutive tabs (tab is a whitespace IFS char), so empty fields between
    # tabs vanish on the read side and shift downstream columns. Substituting
    # "-" preserves the column position. This also reads more clearly in the
    # rendered table than blank.
    latest_out = (latest[b] == "" ? "-" : latest[b])
    print b "\t" count[b] "\t" latest_out "\t?\t" lines[b]
  }
}' | sort -t$'\t' -k2,2 -n -r)

# Stage A: bare grep across CLAUDE.md, conventions/, .claude/skills/.
# See spec §Graduation check (two stages) + §Decisions #1.

declare -A GRADUATED_A

check_graduated_a() {
  local bucket="$1"
  # Use grep -F (fixed string) for ID-shaped buckets to avoid regex
  # metachar issues with characters like α, β. -r searches the tree.
  if grep -rqF -- "$bucket" \
       CLAUDE.md \
       docs/04_engineering/conventions/ \
       .claude/skills/ \
       2>/dev/null; then
    return 0
  fi
  return 1
}

# Compute graduation for every T1 bucket up front so the render step
# doesn't repeat the grep work per row.
while IFS=$'\t' read -r bucket _ _ _ _; do
  [[ -z "$bucket" ]] && continue
  if check_graduated_a "$bucket"; then
    GRADUATED_A["$bucket"]=1
  else
    GRADUATED_A["$bucket"]=0
  fi
done < <(printf '%s\n' "$T1_ROWS")

# Stage B: footer-grep "Promoted from: <bucket>" for phrasal buckets
# Stage A cannot disambiguate. Only runs for Stage A's N rows.
# See spec §Graduation check (two stages) and .claude/rules/docs-codification.md.
#
# DEFERRED at first implementation (2026-05-18): the codification footer
# convention exists in some conventions/*.md files but uses descriptive
# provenance phrases like "Phase 1.5A convention codification batch" or
# "chunk-6.3a implementation notes" — not single-token bucket IDs.
# Stage B as designed greps for a bucket-id-shaped value in the footer,
# which the current footers do not carry. Until codification footers
# start carrying single-token bucket IDs, Stage B would return zero
# matches for every phrasal bucket and provide no signal. Reactivate
# when the codification convention evolves to include bucket-id-style
# provenance.

# Render T1 rows. Header line + rows, padded/aligned for readability.
printf "  %-32s  %5s  %-12s  %-10s  %s\n" "bucket_id" "count" "latest" "graduated" "source_lines"
printf "  %-32s  %5s  %-12s  %-10s  %s\n" "--------" "-----" "------" "---------" "------------"
printf '%s\n' "$T1_ROWS" | while IFS=$'\t' read -r bucket count latest _ lines; do
  [[ -z "$bucket" ]] && continue
  if [[ "${GRADUATED_A[$bucket]:-0}" == "1" ]]; then
    graduated="Y(A)"
  else
    graduated="N"
  fi
  printf "  %-32s  %5d  %-12s  %-10s  %s\n" "$bucket" "$count" "$latest" "$graduated" "$lines"
done
echo
echo
echo "## T1.5 — Untagged instance markers (name-this candidates)"

# T1.5 collection: untagged marker lines (no extractable bucket).
# Sort by date desc so stale entries sink to the bottom per design
# spec §Implementation handoff render rule.
#
# Output columns: line_no | date | line_text

T15_ROWS=$(printf '%s\n' "$EXTRACTED" | awk -F'\t' '
$1 == "" {
  # Sentinel "-" for empty date (same reason as T1: prevents IFS=$'"'"'\t'"'"'
  # read collapse of empty fields).
  date_out = ($3 == "" ? "-" : $3)
  print $2 "\t" date_out "\t" $4
}' | sort -t$'\t' -k2,2 -r)

T15_COUNT=$(printf '%s\n' "$T15_ROWS" | grep -c . || true)
echo "  Total untagged-marker lines: $T15_COUNT"
echo
printf "  %-6s  %-12s  %s\n" "line" "date" "text"
printf "  %-6s  %-12s  %s\n" "----" "----" "----"
printf '%s\n' "$T15_ROWS" | while IFS=$'\t' read -r line_no date text; do
  [[ -z "$line_no" ]] && continue
  # Truncate long lines for readability — full line stays in the journal at the cited line number.
  if [[ ${#text} -gt 120 ]]; then
    text="${text:0:117}..."
  fi
  printf "  %-6s  %-12s  %s\n" "$line_no" "$date" "$text"
done
echo

echo "## Summary"
echo
T1_TOTAL=$(printf '%s\n' "$T1_ROWS" | grep -c . || true)
T1_UNGRADUATED=$(printf '%s\n' "$T1_ROWS" | while IFS=$'\t' read -r bucket count _ _ _; do
  [[ -z "$bucket" ]] && continue
  if [[ "${GRADUATED_A[$bucket]:-0}" == "0" ]] && [[ "$count" -ge 3 ]]; then
    echo "$bucket"
  fi
done | grep -c . || true)
echo "  T1 buckets total:                              $T1_TOTAL"
echo "  T1 graduate-now candidates (N≥3, ungraduated): $T1_UNGRADUATED"
echo "  T1.5 untagged-marker lines:                    $T15_COUNT"
echo
echo "  Exit: 0 (surfacing tool; counts above are the signal)"

exit 0
