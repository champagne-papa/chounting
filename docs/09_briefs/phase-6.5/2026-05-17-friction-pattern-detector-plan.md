# Friction-Pattern-Detector Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a friction-journal pattern detector (tally script + subagent) that surfaces N≥3 ungraduated buckets, untagged-marker discipline gaps, and likely-missed pattern instances within an event-bounded window.

**Architecture:** Two-component split per design spec §Composition direction. `scripts/friction-journal-tally.sh` is a standalone bash+awk script that performs deterministic tier-1 and tier-1.5 tallies and a two-stage graduation check; it runs unwindowed and always exits 0. `.claude/agents/friction-pattern-detector.md` is a subagent that invokes the script, parses its stdout, computes the active window from retrospective glob, and layers tier-2 anchored-semantic and (gated) tier-3 unanchored-discovery scans over the recent journal slice. Output is consolidated to stdout for the caller to action.

**Tech Stack:** Bash 5.x + awk + grep (existing scripts/ precedent: `audit-friction-journal-citations.sh`). Markdown + YAML frontmatter for the subagent definition (existing precedent: `.claude/agents/ledger-reviewer.md`).

**Design spec:** `docs/09_briefs/phase-6.5/2026-05-17-friction-pattern-detector-design.md`

**Execution discipline (global):** If any Step 2 / Step 3 sanity check surfaces output that doesn't match the expected shape (count off by an order of magnitude, missing buckets a direct grep finds, malformed columns, etc.), STOP the task and surface for review before proceeding. Sanity checks exist to catch misfires before they propagate into later tasks.

---

## File Structure

**Create:**

- `scripts/friction-journal-tally.sh` — bash script. Reads `docs/07_governance/friction-journal.md`, emits T1 + T1.5 to stdout with graduation-check status. Always exits 0. Standalone-callable.
- `.claude/agents/friction-pattern-detector.md` — subagent definition. YAML frontmatter (name, description, tools, model) + body sections matching the ledger-reviewer convention.

**Modify:** None. No existing files require changes.

**Test substrate:** `docs/07_governance/friction-journal.md` (the live journal, used as smoke-test input throughout).

---

## Task 1: Tally script skeleton + sanity-check input file

**Files:**
- Create: `scripts/friction-journal-tally.sh`

- [ ] **Step 1: Create the script file with header, set options, and input validation**

```bash
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
```

- [ ] **Step 2: Make executable and smoke-test against the live journal**

```bash
chmod +x scripts/friction-journal-tally.sh
bash scripts/friction-journal-tally.sh
echo "exit: $?"
```

Expected: prints the placeholder header, exits 0.

- [ ] **Step 3: Sanity-check the missing-file path**

```bash
JOURNAL=/nonexistent bash scripts/friction-journal-tally.sh; echo "exit: $?"
```

Expected: stderr "ERROR: /nonexistent not found", exit 2.

- [ ] **Step 4: Commit**

```bash
git add scripts/friction-journal-tally.sh
git commit -m "feat(scripts): add friction-journal-tally.sh skeleton

Skeleton + input validation. Spec: §Components."
```

---

## Task 2: Instance-marker detection (collect lines with markers)

**Files:**
- Modify: `scripts/friction-journal-tally.sh`

- [ ] **Step 1: Replace the placeholder block with marker collection via awk**

Replace the `echo "(placeholder — implementation incoming)"` line and the section headers preceding it with the following block:

```bash
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
```

- [ ] **Step 2: Smoke-test against the live journal**

```bash
bash scripts/friction-journal-tally.sh
```

Expected: header with non-zero "Marker lines found" count. Empirically (grep findings 2026-05-18): ~741 markers total in the current journal (668 N=/N≥ + 73 bare Nth-instance), so the reported count should fall in the 500-2000 range. If the count is below 500, the marker regex is undercounting (most likely the bare-Nth-instance branch isn't matching) — stop here and investigate before continuing to Task 3. The tightened lower bound is deliberate: a count of 250 (which a wider band would accept) would mean roughly half the markers are missing, which is exactly the regex-bug signal we want to surface.

- [ ] **Step 3: Spot-check the marker regex directly + verify known sample lines**

Parity check (script's count should match a direct grep with the same regex):

```bash
grep -cE '\b(first|second|third|fourth|fifth)-instance\b|\bN[=≥][0-9]+\b' docs/07_governance/friction-journal.md
```

Expected: matches the script's reported count (confirms regex parity between script and direct grep).

Sample-line verification (catches the silent-undercount failure mode that pure parity check would miss):

```bash
grep -nE '\b(first|second|third|fourth|fifth)-instance\b' docs/07_governance/friction-journal.md \
  | awk -F: '{print $1}' \
  | grep -E '^(56|198|334|460|542)$'
```

Expected: prints all five line numbers (`56`, `198`, `334`, `460`, `542`). These are known qualitative samples from the 2026-05-18 grep audit (each contains a bare `Nth-instance` marker). If any of the five are missing from the output, the bare-Nth-instance branch of the marker regex is failing on lines we already know contain bare markers — stop and fix before continuing.

- [ ] **Step 4: Commit**

```bash
git add scripts/friction-journal-tally.sh
git commit -m "feat(scripts): add marker detection to friction-journal-tally

Marker ERE captures bare Nth-instance tags and bare N=/N≥ counts
(loosened from paren-required after 2026-05-18 grep audit found
zero parenthesized markers, 73 bare). Word-boundary anchors guard
against plural/prefix matches."
```

---

## Task 3: Bucket extraction (awk-driven, per spec §Bucket extraction)

**Files:**
- Modify: `scripts/friction-journal-tally.sh`

- [ ] **Step 1: Add the awk-based extraction logic**

Replace the T1 and T1.5 placeholder echos (and the lines that produce them) with the following block. The awk script does three jobs in one pass: tracks the current H2 date heading as context, splits each marker line into a +/- 50-char window around the marker, and runs three bucket regexes in priority order (paren-delimited → uppercase-code-like → phrasal) taking the first match as the primary bucket.

```bash
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
#   B1: \([^()[:space:]]{1,40}\)     — paren-delimited single-token bucket.
#       No spaces, no nested parens. Catches (cadence-β-i-a), (α),
#       (γ'), (RI-6) when parenthesized. Excludes prose asides like
#       (see also F-J-14) via the no-space discriminator; B2 then
#       catches F-J-14 cleanly. Locale-independent (byte negation,
#       not character class).
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

EXTRACTED=$(awk -v MARKER_ERE="$MARKER_ERE" '
function extract_bucket(win,    a) {
  # B1: paren-delimited single-token bucket (no spaces, no nested parens).
  # Locale-independent (byte negation, not character class) — Greek-letter
  # bytes (β, γ, α) pass naturally.
  if (match(win, /\([^()[:space:]]{1,40}\)/)) {
    return substr(win, RSTART+1, RLENGTH-2)
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

# Marker lines.
{
  if (match($0, MARKER_ERE)) {
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
echo "(awaiting aggregation)"
echo
echo "## T1.5 — Untagged instance markers (name-this candidates)"
echo "(awaiting aggregation)"
```

- [ ] **Step 2: Smoke-test and inspect a sample of extracted rows**

```bash
bash scripts/friction-journal-tally.sh
```

Expected: TAGGED_COUNT and UNTAGGED_COUNT are both non-zero, sum approximately equals MARKER_COUNT.

- [ ] **Step 3: Sanity-check the bucket extraction by inspecting raw rows**

Temporarily add `printf '%s\n' "$EXTRACTED" | head -20` after the EXTRACTED assignment, re-run the script, and verify:
- Most tagged rows show a recognizable bucket (cadence-β-i-a, F-J-14, Path C, RI-N, etc.)
- **Greek-letter buckets resolve correctly.** Specifically check that `cadence-β-i-a`, `β-1`, `γ'`, and bare `α` (where they appear in the journal) show up in extracted rows with the Greek letter intact. If Greek-letter buckets silently fall through to untagged when their parent line clearly tags one, the B1 regex isn't matching multi-byte sequences — investigate locale (`echo $LANG`, `locale`) or the regex shape before continuing. This was the known risk in the brainstorm review.
- A few untagged rows exist (lines with markers but no extractable bucket)
- The date column shows recent dates for recent journal entries

After inspection, remove the temporary `head -20` debug line.

- [ ] **Step 4: Commit**

```bash
git add scripts/friction-journal-tally.sh
git commit -m "feat(scripts): add bucket extraction to friction-journal-tally

Awk pass over the journal tracking H2 date context and extracting
bucket references with three-tier regex priority (paren-delimited,
uppercase-code-like, phrasal). Empty bucket field marks T1.5
candidates per design spec §Bucket extraction."
```

---

## Task 4: T1 aggregation (group by bucket, count, find latest date)

**Files:**
- Modify: `scripts/friction-journal-tally.sh`

- [ ] **Step 1: Replace the T1 placeholder with the aggregation block**

Replace `echo "(awaiting aggregation)"` under the T1 section heading with:

```bash
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
    print b "\t" count[b] "\t" latest[b] "\t?\t" lines[b]
  }
}' | sort -t$'\t' -k2,2 -n -r)

# Render T1 rows. Header line + rows, padded/aligned for readability.
printf "  %-32s  %5s  %-12s  %-10s  %s\n" "bucket_id" "count" "latest" "graduated" "source_lines"
printf "  %-32s  %5s  %-12s  %-10s  %s\n" "--------" "-----" "------" "---------" "------------"
printf '%s\n' "$T1_ROWS" | while IFS=$'\t' read -r bucket count latest graduated lines; do
  [[ -z "$bucket" ]] && continue
  printf "  %-32s  %5d  %-12s  %-10s  %s\n" "$bucket" "$count" "$latest" "$graduated" "$lines"
done
echo
```

- [ ] **Step 2: Smoke-test and inspect T1 output**

```bash
bash scripts/friction-journal-tally.sh | head -40
```

Expected: a T1 table with bucket_id, count, latest date, ? for graduated, and comma-separated line numbers. Counts sorted descending. Bucket IDs like `cadence-β-i-a`, `F-J-14`, `RI-6`, `Path C` should appear with multi-instance counts.

- [ ] **Step 3: Verify against a known bucket count**

Pick a bucket from the T1 output (e.g., `RI-6`). Spot-check by direct grep:

```bash
grep -nE '(\(RI-6\)|\bRI-6\b).*((first|second|third|fourth|fifth)-instance|N[=≥][0-9]+)' docs/07_governance/friction-journal.md | wc -l
```

The numbers should be close. Exact equality isn't required (the script's window-based extraction may catch slightly different lines than a strict adjacency grep), but order-of-magnitude agreement is.

- [ ] **Step 4: Commit**

```bash
git add scripts/friction-journal-tally.sh
git commit -m "feat(scripts): aggregate T1 rows in friction-journal-tally

Group tagged rows by bucket, count instances, find latest marker
date, collect source line numbers. Sorted by count desc. Graduated
column is placeholder until Tasks 6-7."
```

---

## Task 5: T1.5 collection (sort by latest_marker_date desc)

**Files:**
- Modify: `scripts/friction-journal-tally.sh`

- [ ] **Step 1: Replace the T1.5 placeholder with collection logic**

Replace `echo "(awaiting aggregation)"` under the T1.5 section heading with:

```bash
# T1.5 collection: untagged marker lines (no extractable bucket).
# Sort by date desc so stale entries sink to the bottom per design
# spec §Implementation handoff render rule.
#
# Output columns: line_no | date | line_text

T15_ROWS=$(printf '%s\n' "$EXTRACTED" | awk -F'\t' '
$1 == "" {
  print $2 "\t" $3 "\t" $4
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
```

- [ ] **Step 2: Smoke-test and inspect T1.5 output**

```bash
bash scripts/friction-journal-tally.sh | tail -40
```

Expected: a T1.5 table sorted by date descending. Recent untagged-marker lines appear at the top. The journal's discipline is high, so this table should be relatively sparse but non-empty.

- [ ] **Step 3: Verify the sort order**

Extract the T1.5 date column and confirm it equals its own descending sort (avoids platform-dependent `sort -c -r` semantics):

```bash
bash scripts/friction-journal-tally.sh \
  | awk '/^## T1\.5/,0' \
  | grep -E '^  [0-9]+ ' \
  | awk '{print $2}' > /tmp/t15-dates-actual.txt
sort -r /tmp/t15-dates-actual.txt > /tmp/t15-dates-expected.txt
diff /tmp/t15-dates-actual.txt /tmp/t15-dates-expected.txt && echo "sort: ok"
```

Expected: prints `sort: ok` (the date column matches its own descending sort). If `diff` shows any output, the T1.5 sort isn't in descending order — investigate the `sort -r` invocation in the script.

- [ ] **Step 4: Commit**

```bash
git add scripts/friction-journal-tally.sh
git commit -m "feat(scripts): add T1.5 collection to friction-journal-tally

Untagged-marker lines (markers without an extractable bucket)
collected separately, sorted by latest_marker_date descending so
stale entries sink to the bottom per spec §Implementation handoff."
```

---

## Task 6: Graduation check — Stage A (bare grep for ID-shaped buckets)

**Files:**
- Modify: `scripts/friction-journal-tally.sh`

- [ ] **Step 1: Add the Stage A graduation check before the T1 render**

Insert this block immediately after the `T1_ROWS=$(...)` assignment but before the `printf "  %-32s ..."` header line:

```bash
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
```

Then modify the T1 render loop to substitute the Stage A result for the `?` placeholder:

```bash
printf '%s\n' "$T1_ROWS" | while IFS=$'\t' read -r bucket count latest _ lines; do
  [[ -z "$bucket" ]] && continue
  if [[ "${GRADUATED_A[$bucket]:-0}" == "1" ]]; then
    graduated="Y(A)"
  else
    graduated="N"
  fi
  printf "  %-32s  %5d  %-12s  %-10s  %s\n" "$bucket" "$count" "$latest" "$graduated" "$lines"
done
```

- [ ] **Step 2: Smoke-test and verify graduation labels**

```bash
bash scripts/friction-journal-tally.sh | head -40
```

Expected: T1 rows now show `Y(A)` for buckets that appear in conventions/CLAUDE.md/skills, and `N` for those that don't. Most well-known buckets (cadence-β-i-a, RI-6) should show `Y(A)` because they're referenced in codification surfaces; novel buckets that haven't been codified yet should show `N`.

- [ ] **Step 3: Spot-check by grepping a known-codified bucket directly**

```bash
grep -rlF "cadence-β-i-a" CLAUDE.md docs/04_engineering/conventions/ .claude/skills/ 2>/dev/null
```

Expected: at least one hit (cadence-β-i-a is referenced in conventions and/or CLAUDE.md). The script's `Y(A)` for this bucket matches.

- [ ] **Step 4: Commit**

```bash
git add scripts/friction-journal-tally.sh
git commit -m "feat(scripts): add Stage A graduation check (bare ID grep)

For each T1 bucket, grep -F across CLAUDE.md, conventions/, and
.claude/skills/. ID-shaped buckets that appear verbatim in
codification surfaces flip from N to Y(A) in the rendered output."
```

---

## Task 7: Graduation check — Stage B (footer-grep for phrasal buckets)

**Files:**
- Modify: `scripts/friction-journal-tally.sh`

- [ ] **Step 1: Verify the codification-footer format before writing the check**

```bash
grep -rE '^(\*\*)?Promoted from(\*\*)?:' docs/04_engineering/conventions/ CLAUDE.md .claude/skills/ 2>/dev/null | head -5
```

Expected: at least one match, showing the actual surface form of the `Promoted from:` footer line per `.claude/rules/docs-codification.md` and v2.2 §5.3.

If zero matches are returned, the codification convention may not yet have shipped footers in this exact form — in that case, skip Stage B entirely (the rest of this task) and add a comment to the script stating that Stage B is awaiting first-instance footer adoption. Buckets that would otherwise need Stage B will surface as `N` from Stage A, which is the correct behavior in the absence of phrasal-bucket codifications.

- [ ] **Step 2: Add Stage B as a fall-through after Stage A**

Insert after the Stage A `while` loop:

```bash
# Stage B: footer-grep "Promoted from: <bucket>" for phrasal buckets
# Stage A cannot disambiguate. Only runs for Stage A's N rows.
# See spec §Graduation check (two stages) and .claude/rules/docs-codification.md.

declare -A GRADUATED_B

check_graduated_b() {
  local bucket="$1"
  # The bucket may contain regex metacharacters (e.g., "Path C", "Z1 #11").
  # Use grep -F on the constructed "Promoted from: <bucket>" string.
  local needle="Promoted from: $bucket"
  if grep -rqF -- "$needle" \
       CLAUDE.md \
       docs/04_engineering/conventions/ \
       .claude/skills/ \
       2>/dev/null; then
    return 0
  fi
  # Also accept bolded variant.
  local needle_bold="**Promoted from:** $bucket"
  if grep -rqF -- "$needle_bold" \
       CLAUDE.md \
       docs/04_engineering/conventions/ \
       .claude/skills/ \
       2>/dev/null; then
    return 0
  fi
  return 1
}

while IFS=$'\t' read -r bucket _ _ _ _; do
  [[ -z "$bucket" ]] && continue
  if [[ "${GRADUATED_A[$bucket]:-0}" == "0" ]] && check_graduated_b "$bucket"; then
    GRADUATED_B["$bucket"]=1
  else
    GRADUATED_B["$bucket"]=0
  fi
done < <(printf '%s\n' "$T1_ROWS")
```

Then update the T1 render loop to consult both stages:

```bash
printf '%s\n' "$T1_ROWS" | while IFS=$'\t' read -r bucket count latest _ lines; do
  [[ -z "$bucket" ]] && continue
  if [[ "${GRADUATED_A[$bucket]:-0}" == "1" ]]; then
    graduated="Y(A)"
  elif [[ "${GRADUATED_B[$bucket]:-0}" == "1" ]]; then
    graduated="Y(B)"
  else
    graduated="N"
  fi
  printf "  %-32s  %5d  %-12s  %-10s  %s\n" "$bucket" "$count" "$latest" "$graduated" "$lines"
done
```

- [ ] **Step 3: Smoke-test and verify**

```bash
bash scripts/friction-journal-tally.sh | head -40
```

Expected: T1 rows show one of `Y(A)`, `Y(B)`, or `N`. If at least one `Promoted from:` footer exists in the codified surfaces (verified in Step 1), at least one row may flip from `N` (Stage A miss) to `Y(B)` (Stage B hit) — particularly for phrasal buckets like `Path C`.

- [ ] **Step 4: Commit**

```bash
git add scripts/friction-journal-tally.sh
git commit -m "feat(scripts): add Stage B graduation check (footer grep)

Phrasal buckets too generic for bare grep are checked via
'Promoted from: <bucket>' footer field per v2.2 §5.3. Only runs
for buckets Stage A flagged as ungraduated."
```

---

## Task 8: Final output polish and always-0 exit verification

**Files:**
- Modify: `scripts/friction-journal-tally.sh`

- [ ] **Step 1: Add a closing summary section and verify exit semantics**

Append after the T1.5 block but before the `exit 0`:

```bash
echo "## Summary"
echo
T1_TOTAL=$(printf '%s\n' "$T1_ROWS" | grep -c . || true)
T1_UNGRADUATED=$(printf '%s\n' "$T1_ROWS" | while IFS=$'\t' read -r bucket count _ _ _; do
  [[ -z "$bucket" ]] && continue
  if [[ "${GRADUATED_A[$bucket]:-0}" == "0" ]] && [[ "${GRADUATED_B[$bucket]:-0}" == "0" ]] && [[ "$count" -ge 3 ]]; then
    echo "$bucket"
  fi
done | grep -c . || true)
echo "  T1 buckets total:               $T1_TOTAL"
echo "  T1 graduate-now candidates (N≥3, ungraduated): $T1_UNGRADUATED"
echo "  T1.5 untagged-marker lines:     $T15_COUNT"
echo
echo "  Exit: 0 (surfacing tool; counts above are the signal)"
```

- [ ] **Step 2: Smoke-test the full script**

```bash
bash scripts/friction-journal-tally.sh
echo "exit: $?"
```

Expected: full T1 table + T1.5 table + summary. Exit code 0.

- [ ] **Step 3: Verify always-0 even with edge inputs**

Create an empty journal substitute and verify exit 0:

```bash
JOURNAL=$(mktemp) bash scripts/friction-journal-tally.sh; echo "exit: $?"
rm -f /tmp/tmp.* 2>/dev/null || true
```

Expected: header + empty tables + exit 0. (The tempfile created by `mktemp` is empty, so no markers, but exit should still be 0.)

- [ ] **Step 4: Commit**

```bash
git add scripts/friction-journal-tally.sh
git commit -m "feat(scripts): add summary section and verify always-0 exit

Closing summary surfaces totals (T1 buckets, graduate-now candidates,
T1.5 line count). Script exits 0 in all paths per spec §Components."
```

---

## Task 9: Subagent file — frontmatter + structural skeleton

**Files:**
- Create: `.claude/agents/friction-pattern-detector.md`

- [ ] **Step 1: Create the file with the same frontmatter shape as ledger-reviewer.md**

```markdown
---
name: friction-pattern-detector
description: Surfaces friction-journal pattern candidates — graduate-now buckets (T1), untagged-marker discipline gaps (T1.5), and likely-missed instances (T2) within an event-bounded window. Invoke at retrospective scoping or when reviewing for codification candidates.
tools: Read, Grep, Glob, Bash
model: sonnet
---

# Friction-Pattern-Detector

When invoked, this subagent surfaces friction-journal pattern
candidates for human review and routing to `codify-convention`.
Read-only — produces findings, never modifies the journal or any
codification surface.

## When to invoke

- At retrospective scoping: "what's accumulated since the last
  retrospective that should graduate?"
- When reviewing for codification candidates: "what's at N≥3 and
  hasn't yet been routed through `codify-convention`?"
- When a discipline-gap suspicion arises: "have I been noticing
  something three times without naming it?"

## Canonical sources consulted (read-only)

- `docs/07_governance/friction-journal.md` — the war diary.
  Single substrate for T1/T1.5/T2 per design spec §Substrate scope.
- `docs/07_governance/retrospectives/` — globbed to compute the
  active window per design spec §Window.
- `MEMORY.md` and per-topic memory files — read **only** as a
  known-pattern dedup filter for T3 (gated). Never as substrate
  for counting.

## Invocation flow

(awaiting implementation — Tasks 10-13)

## Output shape

(awaiting implementation — Task 13)

## Handling T1.5 output

T1.5 may include false positives: methodology prose lines mentioning
"first-instance" / "second-instance" / etc. as a *concept* (e.g., a
section heading like "12 first-instance pattern observations")
rather than untagged observations needing a bucket name. The marker
regex matches bare `Nth-instance` because that's the dominant
tagging shape (grep audit 2026-05-18 found 73 bare vs 0
parenthesized), so prose mentions slip through and surface as T1.5
with no extractable bucket. Review the cited line before back-
tagging; methodology mentions are recognizable in 2 seconds and
should be discarded.

## What this subagent does NOT do

- Does not modify the journal (no auto-back-tagging of T1.5
  candidates).
- Does not invoke `codify-convention` directly — surfaces
  candidates for the operator to action.
- Does not perform cross-surface consistency checks (separate tool;
  see deferred `doc-sync-reconciler`).
- Does not include MEMORY.md as counting substrate (only as T3
  dedup filter).

## Design spec

`docs/09_briefs/phase-6.5/2026-05-17-friction-pattern-detector-design.md`
```

- [ ] **Step 2: Verify the frontmatter parses by checking the lint-rules-frontmatter script if available**

```bash
ls scripts/lint-rules-frontmatter.sh 2>/dev/null && bash scripts/lint-rules-frontmatter.sh || echo "lint script not present; skipping"
```

Expected: either the lint passes (script exists and finds no issues) or the script prints "lint script not present; skipping." Note: the existing lint script targets `.claude/rules/`; if it complains about the `.claude/agents/` directory not being in its scope, that's acceptable for this task — the file mirrors the ledger-reviewer.md frontmatter shape verified visually.

- [ ] **Step 3: Commit**

```bash
git add .claude/agents/friction-pattern-detector.md
git commit -m "feat(agents): add friction-pattern-detector subagent skeleton

YAML frontmatter (name, description, tools: Read/Grep/Glob/Bash,
model: sonnet) + structural sections (when-to-invoke, canonical
sources, what-this-does-not-do). Invocation flow and output shape
deferred to Tasks 10-13."
```

---

## Task 10: Subagent body — window computation + script invocation

**Files:**
- Modify: `.claude/agents/friction-pattern-detector.md`

- [ ] **Step 1: Replace the "awaiting implementation" placeholder under "Invocation flow"**

Replace `(awaiting implementation — Tasks 10-13)` under the `## Invocation flow` section with:

```markdown
1. **Compute the active window.**
   - Glob `docs/07_governance/retrospectives/*.md` for the most
     recently dated file (filename prefix `YYYY-MM-DD`).
   - If a most-recent retrospective exists, `window_start` =
     that date. The window spans from `window_start` to today,
     applied to T2 (and T3 if `--explore`).
   - If no retrospective exists in the glob, fall back to
     `window_start` = today minus 30 days.
   - If the caller passes `--since YYYY-MM-DD`, that date
     overrides both (manual window override).
   - Window applies only to T2 and T3. T1 and T1.5 from the tally
     script are unwindowed by design (per spec §Window) — the
     `latest_marker_date` column lets the caller filter visually.

2. **Invoke the tally script.**
   - Run `bash scripts/friction-journal-tally.sh` (no arguments).
   - Parse stdout into three sections: T1 table, T1.5 table,
     Summary. Keep the bucket-ID list from T1 — this is the
     anchor set for the T2 scan.
   - The script always exits 0; do not treat its exit code as a
     signal.

3. **Read the windowed journal slice.**
   - Use Read or Grep+Read to extract entries from
     `docs/07_governance/friction-journal.md` whose nearest H2
     date heading is on or after `window_start`.
   - This slice is the substrate for T2 and T3.

4. **(T2 scan — see body section below.)**

5. **(T3 scan if `--explore` — see body section below.)**

6. **Emit consolidated stdout report** (output shape section below).
```

- [ ] **Step 2: Re-read the file to confirm structure**

Open `.claude/agents/friction-pattern-detector.md` and verify the `## Invocation flow` section now contains the six-step list. Tasks 11-13 will populate the bodies of steps 4, 5, 6.

- [ ] **Step 3: Commit**

```bash
git add .claude/agents/friction-pattern-detector.md
git commit -m "feat(agents): wire window computation and script invocation into detector

Window computation: glob retrospectives/, fall back to 30 days,
honor --since override. Tally-script invocation: parse stdout for
T1/T1.5/Summary sections, treat exit code as non-signal."
```

---

## Task 11: Subagent body — T2 anchored-semantic scan

**Files:**
- Modify: `.claude/agents/friction-pattern-detector.md`

- [ ] **Step 1: Insert the T2 scan instructions as a new top-level section after "Invocation flow"**

Add this section between `## Invocation flow` and `## Output shape`:

```markdown
## T2 — Anchored-semantic scan

**Anchored, not exploratory.** T2 is asked a narrow question:
given the bucket-ID list extracted from T1, are there entries in
the active window that could plausibly belong to one of these
buckets but weren't tagged?

T2 is NOT asked to discover new buckets. New-bucket discovery is
T3 (gated, see next section).

### Procedure

1. Take the bucket-ID list from T1 (Tasks 4/6/7 output).
2. Read the windowed journal slice (from Invocation flow step 3).
3. For each entry in the window, consider whether the entry's
   content matches the pattern signature of any T1 bucket. The
   pattern signature is whatever the bucket's *existing tagged
   instances* in the journal have in common (verb-shape, context,
   subject).
4. If an entry plausibly matches a bucket but was not tagged with
   that bucket's instance marker, surface it as a T2 candidate.

### What counts as "plausibly matches"

- Same kind of friction (substrate-receipt drift, brief-amendment
  cycle, cross-phase reconciliation, etc.) as the bucket's prior
  instances.
- Same actor or surface (a `cadence-β-*` pattern is about cadence
  observations; a finding about substrate drift wouldn't count
  even if structurally similar).
- Reasonable confidence (≥70%) that a careful reader would tag
  the entry with this bucket if reviewing it now.

If confidence is below that threshold, do NOT surface as T2.
Low-confidence candidates contaminate the high-signal output and
defeat the purpose of anchoring.

### T2 output shape

For each candidate:

- **Bucket:** the existing bucket ID this entry plausibly belongs to.
- **Entry line range:** start–end line numbers in
  `friction-journal.md`.
- **Entry date:** the H2 date the entry sits under.
- **Why match:** one sentence linking the entry's content to the
  bucket's existing tagged instances.
- **Confidence:** high / medium (only surface ≥medium).
```

- [ ] **Step 2: Cross-check the section flow**

The file should now read: `## When to invoke` → `## Canonical sources consulted` → `## Invocation flow` → `## T2 — Anchored-semantic scan` → `## Output shape` (placeholder) → `## What this subagent does NOT do` → `## Design spec`.

If `## T3 — Possible new bucket (gated)` doesn't yet exist, that's expected — added in Task 12.

- [ ] **Step 3: Commit**

```bash
git add .claude/agents/friction-pattern-detector.md
git commit -m "feat(agents): add T2 anchored-semantic scan to friction-pattern-detector

T2 is narrowly scoped: given T1's bucket list as candidate space,
identify windowed entries that plausibly belong to a known bucket
but weren't tagged. Confidence floor ≥medium to avoid contaminating
high-signal output."
```

---

## Task 12: Subagent body — T3 unanchored discovery (gated)

**Files:**
- Modify: `.claude/agents/friction-pattern-detector.md`

- [ ] **Step 1: Add the T3 section after T2 and before "Output shape"**

```markdown
## T3 — Possible new bucket (gated, default off)

**Gated behind `--explore`.** Default invocations skip T3. T3 is
the only path that does unanchored pattern discovery, and its
output is intrinsically noisier — surface it only when the
operator is doing a deliberately exploratory pass (e.g., at
retrospective close with fresh eyes).

### Procedure

1. Check whether `--explore` was passed. If not, skip T3
   entirely.
2. Read the windowed journal slice.
3. Identify recurring patterns in the window that do NOT map to
   any existing T1 bucket. "Recurring" means appearing in 2+
   distinct entries with similar structure (verb, surface,
   friction type).
4. Before surfacing a candidate, **dedup against memory.** Read
   `MEMORY.md` and per-topic memory files at
   `/home/philc/.claude/projects/-home-philc-projects-chounting/memory/`.
   If the candidate pattern is already known by name in memory,
   do NOT surface it — memory acts as known-pattern registry.
5. Surface only patterns that pass the memory-dedup filter.

### Memory dedup is filter, not substrate

Memory is read here only to answer "is this already known by
name somewhere?" — never to count instances. Counting against
memory would double-count observations through a derivative
surface (spec §Substrate scope). If a pattern is in memory but
not yet codified in a convention file, that's a codify-
convention question, not a T3 question.

### T3 output shape

For each candidate:

- **Suggested name:** a tentative bucket label (operator may rename).
- **Instances:** 2+ line ranges from the journal where the pattern appears.
- **Pattern signature:** one sentence describing the shared structure.
- **Confidence:** low / medium / high.
- **Memory dedup status:** unique (passed filter) — or, if a
  near-match was found, "near-match: <memory pattern name>;
  surfacing for operator disambiguation."
```

- [ ] **Step 2: Verify the section ordering**

```bash
grep -nE '^## ' .claude/agents/friction-pattern-detector.md
```

Expected order: When to invoke → Canonical sources consulted → Invocation flow → T2 — Anchored-semantic scan → T3 — Possible new bucket (gated, default off) → Output shape → What this subagent does NOT do → Design spec.

- [ ] **Step 3: Commit**

```bash
git add .claude/agents/friction-pattern-detector.md
git commit -m "feat(agents): add T3 unanchored discovery (gated) to friction-pattern-detector

T3 behind --explore flag. Performs unanchored discovery of
recurring patterns absent from T1's bucket list, with memory-dedup
filter to avoid resurfacing already-known patterns. Memory is
filter, never counting substrate, per spec §Substrate scope."
```

---

## Task 13: Subagent body — consolidated output shape

**Files:**
- Modify: `.claude/agents/friction-pattern-detector.md`

- [ ] **Step 1: Replace the "awaiting implementation" placeholder under "Output shape"**

Replace `(awaiting implementation — Task 13)` under the `## Output shape` section with:

```markdown
Emit a single stdout report with the following structure:

```
# Friction-Pattern-Detector Report
# Window: <window_start> — <today>  (source: <retrospective | 30-day fallback | --since>)

## T1 — Graduate-now candidates
<table copied verbatim from the tally script's T1 section,
filtered to rows where graduated_yn=N AND instance_count≥3>

## T1.5 — Name-this candidates
<table copied verbatim from the tally script's T1.5 section,
already sorted by date desc>

## T2 — Likely-missed instances (anchored)
<one block per candidate, formatted per T2 output shape>

[## T3 — Possible new buckets   ← only if --explore]
<one block per candidate, formatted per T3 output shape>

## Action checklist
- For each T1 row above, invoke /codify-convention on that bucket.
- For each T1.5 row above, decide whether to back-tag with a
  bucket name in a follow-up commit.
- For each T2 candidate, decide whether to add the bucket's
  instance marker to the cited entry in a follow-up commit.
- [If T3:] For each T3 candidate, decide whether to tag the
  instances with a new bucket name, route through /codify-convention,
  or dismiss.
```

The action checklist is the load-bearing handoff to the operator.
Surface only the actionable rows (T1: ungraduated AND N≥3; T1.5:
all rows since they're already filtered by the tally script; T2/T3:
all surfaced candidates).
```

- [ ] **Step 2: Verify the section is complete**

The `## Output shape` section should now contain the full report template and the action-checklist explanation.

- [ ] **Step 3: Commit**

```bash
git add .claude/agents/friction-pattern-detector.md
git commit -m "feat(agents): add consolidated output shape to friction-pattern-detector

Stdout report with window header, T1 (graduate-now filtered),
T1.5 (already date-sorted), T2 (anchored candidates), optional
T3 (--explore). Action checklist closes the loop to codify-convention
per spec §Substrate scope and §Tier definitions."
```

---

## Task 14: End-to-end smoke test + worktree-resolution sanity check

**Files:**
- No file changes; verification only.

- [ ] **Step 1: Run the tally script standalone and capture output**

```bash
bash scripts/friction-journal-tally.sh > /tmp/tally-output.txt
echo "exit: $?"
wc -l /tmp/tally-output.txt
head -20 /tmp/tally-output.txt
echo "---"
tail -20 /tmp/tally-output.txt
```

Expected: exit 0, non-empty output, T1 table at top, summary at bottom, T1.5 table in between.

- [ ] **Step 2: Verify the subagent file is discovered from the project root**

```bash
ls -la .claude/agents/friction-pattern-detector.md
grep -E '^name:|^tools:' .claude/agents/friction-pattern-detector.md
```

Expected: file exists, `name: friction-pattern-detector`, `tools: Read, Grep, Glob, Bash`.

- [ ] **Step 3: Verify worktree resolution**

First, verify worktree shape — git worktree (separate root with its own `.claude/`) vs. directory inside root `.claude/`. The relative path for any symlink depends on this; do NOT hardcode `../../../../`.

```bash
pwd
for wt in .claude/worktrees/phase-0-governance .claude/worktrees/phase-1-storage-evidence-core; do
  if [[ -d "$wt" ]]; then
    echo "=== $wt ==="
    ls -la "$wt" | head -5
    echo "agents in worktree:"
    ls -la "$wt/.claude/agents/" 2>/dev/null || echo "(no $wt/.claude/agents/ directory)"
    echo "git-worktree marker?"
    [[ -f "$wt/.git" ]] && echo "yes — git worktree (separate working tree)" \
                       || echo "no — directory inside root"
  fi
done
```

Expected: each worktree's structure printed, with explicit yes/no on the `.git` file marker.

**Decision based on what Step 3 reveals:**

- **No `<worktree>/.claude/agents/` directory:** Subagent inherits from root. No action needed.
- **Local `<worktree>/.claude/agents/` exists, missing `friction-pattern-detector.md`:** Compute the correct relative path with `realpath --relative-to=<worktree>/.claude/agents/ .claude/agents/friction-pattern-detector.md` and use that for the symlink. The depth depends on whether the worktree is a git worktree or a plain directory.
- **Worktree resolution is ambiguous or untestable:** Leave it. Subagents only need to resolve where you'd invoke them. Document the decision.

Record the decision and the action taken (if any) so the worktree-resolution question raised during brainstorming is closed.

- [ ] **Step 4: Optionally invoke the subagent end-to-end and inspect the report**

Invoke `friction-pattern-detector` from the project root (via your normal subagent-dispatch path). Expected output structure:

- `# Friction-Pattern-Detector Report` header.
- `## T1` section with graduate-now candidates (some rows expected — the journal has known ungraduated N≥3 buckets).
- `## T1.5` section with name-this candidates (may be sparse but non-empty if there are untagged markers).
- `## T2` section with at least zero candidates (may be empty in a quiet window; that's fine).
- `## Action checklist` with concrete next steps.

If something looks off (regex misses a known bucket, T1.5 sort is wrong, etc.), file as a follow-up rather than blocking Task 14 closure — the design spec's "implementation-plan question, not a redesign of either" framing applies.

- [ ] **Step 5: Final commit consolidating any worktree-resolution action**

If Step 3 resulted in a symlink or copy, commit it:

```bash
git add .claude/worktrees/  # or wherever the linked artifact lives
git commit -m "chore(agents): wire friction-pattern-detector into worktrees

Resolved deferred worktree-resolution question raised during
brainstorm: <describe action taken: inherited / symlinked / copied>."
```

If no action was needed (both worktrees inherit from root), no commit for this step.

---

## Self-review checklist

After completing all tasks, run the following before declaring done:

- [ ] `bash scripts/friction-journal-tally.sh > /tmp/tally.txt && echo "exit: $?"` → exit 0, non-empty output.
- [ ] T1 table includes at least one row with `graduated=Y(A)` AND at least one row with `graduated=N` (otherwise the graduation check isn't differentiating).
- [ ] T1.5 sort order is date-descending (re-verify with the sort check from Task 5 Step 3).
- [ ] Subagent file passes the same structural shape as `.claude/agents/ledger-reviewer.md` (frontmatter fields, body sections).
- [ ] Each task's commit message references the design spec or the spec section, so future readers can trace decisions back.
- [ ] No `.env` files, secrets, or generated artifacts committed (the script reads the journal but writes nothing to disk).

---

## Design references

- Spec: `docs/09_briefs/phase-6.5/2026-05-17-friction-pattern-detector-design.md`
- Brainstorm thread: (in-conversation, 2026-05-17)
- Precedent agent: `.claude/agents/ledger-reviewer.md`
- Precedent bash script: `scripts/audit-friction-journal-citations.sh`
- Codification routing canonical: `docs/04_engineering/conventions/README.md`
- Codification footer convention: `.claude/rules/docs-codification.md` + v2.2 §5.3
