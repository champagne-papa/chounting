# Session S-config-cleanup-0430 — `.claude/` permissions cleanup (project-layer write + local-layer prune)

> **For agentic workers:** Use `superpowers:executing-plans` to work this brief stage-by-stage. Steps use checkbox (`- [ ]`) syntax for tracking. **No paid-API spend in this session** (config-file editing only; no orchestrator request fires). **Editing-only session** — no schema changes, no service-layer changes, no test changes beyond an added smoke-probe scratch file that is deleted before commit staging.

**Goal:** Finish the `.claude/` cleanup begun in the prior session (`chat/2673b008`) and left at Step 1 / 7. Two deliverables, one per layer:

1. **Project layer** — write committed `chounting/.claude/settings.json` (does not exist today). Models on the chounting-flavored block in `~/.claude/templates/project-settings-template.md` plus monorepo-shape promotions surfaced post-restructure. Establishes `defaultMode: "default"` for high-blast-radius repo gating, `git commit:*` to ask for push-readiness commit-shape discipline, `db:reset*` / `db:seed:*` to ask for destructive-shape discipline, and `tests/e2e/.auth/**` / `.mcp.json` to deny for credential-shape discipline.

2. **Local layer** — prune `chounting/.claude/settings.local.json` from 252 rules (~13.6 KB) to under 30 rules. Most current entries are sprawl (one-off `sed -n '...' file` invocations, ~25 `export COORD_SESSION='...'` lines, file-path-bound rules invalidated by the monorepo restructure), some are redundant with the global at `~/.claude/settings.json`, and three categories are **security regressions** that override stricter global behavior and need explicit deletion.

**Architecture (V1 minimal scope):**

- **Stage 0** — operator pre-flight gates (cp-from-clean-cwd, dangerously-skip-permissions). May be marked subsumed-by-prior-rollback per pre-decision (a).
- **Stage 1** — substrate audit. Fresh categorization of all 252 current rules into A/B/C/D buckets against monorepo-current paths and the post-S32 script surface. Halts for operator approval.
- **Stage 2** — write `chounting/.claude/settings.json`. Template chounting-flavored block + Bucket B promotions; alphabetically sorted within `allow` / `ask` / `deny` for diffability.
- **Stage 3** — prune `chounting/.claude/settings.local.json`. Bucket C entries only; alphabetically sorted; preserves `enableAllProjectMcpServers` and `enabledMcpjsonServers` shape.
- **Stage 4** — layered-behavior smoke test against four named scenarios (project ASK fires, project default-mode prompts on edit, global deny still applies, global allow still silent under project default).
- **Stage 5** — stage but do not commit. Second-reviewer gate per `~/.claude/README.md` "Review discipline" section.

**Tech stack:** JSON files only. No runtime code. Smoke-test surface is operator-side (real Claude Code session against the new layered config). No new dependencies. No test additions to the vitest / Playwright suites. No paid-API spend.

---

**Anchor SHA:** `bf153fc` — `docs(open_questions): add Q33 — service-layer placement for 7 adminClient sites`. Verify HEAD at Task 1 Step 1. Working tree must be clean before Stage 1 opens.

Chain (chronological, oldest → newest, post-prior-cleanup-session):

```
ee35abf chore(gitignore): allow committing .claude/settings.json with explanatory comment   ← Step 1 of prior session, shipped
 ... S32 onboarding work ...
b2bf9f3 docs(governance): S32 onboarding-posture session closeout
a8f5c89 chore(monorepo): add workspace skeleton (Pattern 3, Step 2)
4ac1f88 chore(monorepo): move production app into apps/web/ (Pattern 3, Step 3)
28d255a feat(tokens): add @chounting/tokens design-token package (Step 4)
000d6f7 feat(ui): add empty @chounting/ui package with cn utility (Step 5)
553e92d feat(demo): scaffold apps/demo/ Next.js 15 design surface (Step 6)
956bc56 feat(web): wire apps/web to consume @chounting/tokens (Step 7)
f50a529 chore(lint): preserve pre-monorepo lint baseline (Step 8 follow-up)
e7cb8b5 ci+docs: monorepo CI workflow + Pattern 3 docs (Steps 9, 10)
bf153fc docs(open_questions): add Q33 — service-layer placement for 7 adminClient sites   ← this brief's anchor
```

71 commits total since `ee35abf` (the un-ignore). All are local-only — `0	71` from `git rev-list --left-right --count origin/staging...HEAD`. Push-readiness gate applies to those 71 separately; **NOT in scope of this brief**.

---

**Upstream authority:**

- **`~/.claude/settings.json`** — the global config. **Substrate caveat:** the Claude Code Read tool has been observed returning an effective-config-merged-with-defaults projection of this path that differs materially from on-disk bytes (see `docs/07_governance/friction-journal.md` 2026-05-02 Read-tool-consistency-bug NOTE). Stage 1 substrate-reads against this path MUST use shell-side `cat`, NOT the Read tool. Whatever permission lists, `defaultMode`, and `disableBypassPermissionsMode` settings the on-disk file actually carries are the inputs to the local-layer prune (delete rules already covered) and to the project-layer write (which may not contradict global denies). **Stage 4 is the load-bearing runtime-behavior verification** of effective permission state under the layered config; the file-level inspection captured in Stage 1 is audit substrate, not source-of-truth, under this bug class.
- **`~/.claude/templates/project-settings-template.md`** — the chounting-flavored block (lines ~95–141) is the starting shape for `chounting/.claude/settings.json`. Rationale (template lines 135–141) names four high-blast-radius criteria (migrations, middleware, IaC-via-Supabase, governance-as-prod-config) — chounting hits all four, justifying `defaultMode: "default"` override.
- **`~/.claude/README.md`** — four-layer model (managed-settings → user-global → project → local). "The rule" (lines 11–17) governs which command goes where: repo-independent risk → global; risk varies by repo → project; per-machine sprawl → local. "Review discipline" (line 19) requires second reviewer for project-layer changes (this brief explicitly stages but does not commit; operator commits after diff review).
- **`~/.gitignore_global`** — registered via `git config --global core.excludesfile`; contains `.claude/settings.local.json`. Confirms local-layer file stays out of version control regardless of repo-side `.gitignore` shape.
- **`chounting/.gitignore`** — line 49 has `.claude/*` (contents-style, not directory-style) + line 50 has `!.claude/settings.json` un-ignore. Shipped at `ee35abf`. Substrate-confirms `git add .claude/settings.json` works once the file exists; `.claude/settings.local.json` stays gitignored.
- **`chounting/CLAUDE.md`** — push-readiness three-condition gate (lines 87–125). Justifies `Bash(git commit:*)` in project-layer ASK: silent commits drift away from the gate's commit-shape requirements (audit rows, ADR refs, friction-journal cross-links).
- **`chounting/package.json`** (root, post-monorepo) — script surface that drives Bucket B promotion candidates. `pnpm typecheck`, `pnpm agent:floor`, `pnpm agent:validate`, `pnpm test:no-hardcoded-urls`, `pnpm verify-audit-coverage`, `pnpm db:start|stop|migrate|generate-types|seed:auth|seed:all|reset|reset:clean` all live at root and now wrap into `pnpm --filter @chounting/web ...`. The wrappers preserve script names, so chounting-template rules from upstream remain valid as-is.
- **Prior session reference** — `chat/2673b008-ef76-46d5-ad3f-72f5783903d9`. Audit-table draft produced; never approved; never acted on. Treat as **stale precedent**, not authoritative input — file has grown by 36 rules and monorepo paths have shifted since.

---

## Session label

`s-config-cleanup-0430-brief` (brief-creation session label) → `S-config-cleanup-0430` (execution session label, applied at Stage 1 Step 1).

---

## Pre-flight findings (substrate-grounded reference at HEAD `bf153fc`)

### File state at brief-creation

| File | State at `bf153fc` | Disposition |
|---|---|---|
| `chounting/.gitignore` | `.claude/*` + `!.claude/settings.json` shipped at `ee35abf`; verified untracked-allowed via `git status --untracked-files=all .claude/` showing `?? .claude/settings.json` when probed | DONE |
| `chounting/.claude/settings.json` | does not exist | TBD — Stage 2 writes |
| `chounting/.claude/settings.local.json` | 252 rules / 13612 bytes / mtime 2026-04-30 12:52 | TBD — Stage 3 prunes to ≤30 |
| `chounting/.claude/settings.local.json.bak.20260430T225519Z` | 13612 bytes / fresh backup taken at brief-pre-flight | rollback target if Stages 2–3 misbehave |

### Rule-count drift since prior session

| Snapshot | Rule count | File size | Notes |
|---|---|---|---|
| Prior session start (`chat/2673b008`, 2026-04-29) | 216 | 11614 B | original audit-table input |
| Prior session end | 216 | 11614 B | un-ignore shipped; pruning never executed |
| Mid-S32 / monorepo-restructure accumulation | ~252 | 13612 B | +36 rules over ~24 hours |
| **This brief's anchor** | **252** | **13612 B** | substrate at `bf153fc` |

The 36-rule growth is the **sprawl-without-tripwire** pattern firing again — the same one CLAUDE.md "Personal overrides" guidance cites the >30-rule threshold for. Stage 1 audit must catch the underlying drivers, not just the rules themselves.

### New rule categories surfaced post-prior-session (substrate at `bf153fc`)

#### Category A — monorepo workspace command cluster (10 rules)

```
Bash(rm -rf node_modules apps/web/node_modules packages/*/node_modules)   ← SECURITY REGRESSION: shadows global Bash(rm -rf:*) deny
Bash(pnpm install *)
Bash(pnpm --filter @chounting/ui typecheck)
Bash(pnpm --filter @chounting/demo typecheck)
Bash(pnpm --filter @chounting/demo build)
Bash(pnpm --filter @chounting/web typecheck)
Bash(pnpm -r typecheck)
Bash(pnpm --filter @chounting/web build)
Bash(pnpm --filter @chounting/web exec sh -c "next lint --no-cache 2>&1 | tail -5")
Bash(pnpm --filter @chounting/web lint)
Bash(pnpm --filter @chounting/demo lint)
```

Substrate decision Stage 1 must address: are workspace `--filter` commands stable enough to warrant a `Bash(pnpm --filter @chounting/web:*)` Bucket B promotion, or do they stay sprawl in C? Default lean: B promotion under `Bash(pnpm --filter:*)` (broad) or per-package shape `Bash(pnpm --filter @chounting/web:*)` / `Bash(pnpm --filter @chounting/demo:*)` (narrow). Pre-decision (b).

#### Category B — broad Read paths (4 rules)

```
Read(//home/philc/.config/**)
Read(//home/philc/.claude/**)
Read(//etc/**)
Read(//usr/local/share/**)
```

The global already allows `Read` (the tool, blanket). These specific path allows are redundant under the blanket. Two readings:

- (i) Each was approved one-at-a-time when blanket Read was scoped narrower than today; rules are stale and should be deleted (Bucket A — covered by global blanket Read).
- (ii) Operator deliberately approves broad paths that the global blanket policy will eventually narrow away from; rules are forward-defensive (Bucket C — keep).

Substrate-confirm at Stage 1: the global today (`~/.claude/settings.json` line 28) has `"Read"` in `allow` as the blanket — readings outside specifically denied paths (`Read(./.env)`, `Read(**/*.kubeconfig)`, etc.) flow without gate. (i) is correct. **Stage 1 disposition: A (delete).**

#### Category C — gh CLI + tee + bwrap (3 rules)

```
Bash(gh run *)
Bash(tee /tmp/full_test.log)
Bash(bwrap --version)
```

`gh run *` likely supports CI-watching workflow; `tee` is benign-shape; `bwrap` is the sandbox tool, version-probe only. Three options:

- (a) Promote `Bash(gh:*)` to **global** allow (gh is universal-stack like jq) — **out of scope for this brief** (no global changes per scope discipline).
- (b) Promote `Bash(gh run:*)` to project allow (Bucket B).
- (c) Keep as Bucket C (per-machine until pattern stabilizes).

Default lean: (c). Single-instance entries don't yet earn project-layer membership; if `gh run *` recurs across sessions, promote later.

#### Category D — malformed entries (2 rules)

```
Bash(org_id)             ← appears to be a malformed paste; literal token "org_id" as command name
Bash(date -u +%Y%m%dT%H%M%SZ echo "=== sql tooling: psql + DATABASE_URL ===")   ← malformed compound
```

Both look like accidental approve-once events on commands that aren't shaped right. Bucket D (delete outright). Stage 1 verifies by attempting `command -v org_id` — substrate-confirm no command of that name exists.

### Confirmed-stale entries from prior audit-table

The prior session's audit-table (chat/2673b008) listed file-path-bound rules referencing `src/services/...`. Post-monorepo, those files moved to `apps/web/src/services/...`. The rules in settings.local.json still reference the old paths — they are doubly stale:

- (a) The original rules were one-off `sed -n '...' file` Bucket D entries — already slated for deletion.
- (b) The paths they bound to no longer exist at the recorded location.

Both reasons compound to: Bucket D, delete. Stage 1 confirms ≥30 such entries are present and bulk-deletes.

### Lint / typecheck / test floor

| Check | Result | Disposition |
|---|---|---|
| `pnpm typecheck` (root → wraps `pnpm --filter @chounting/web typecheck`) | not directly queried at brief-creation | Stage 4 smoke-test scenario 4 substrate-confirms global `Bash(pnpm:*)` allow still fires silently under project `defaultMode: "default"` |
| `git status` | clean | required for Stage 1 entry |
| `git rev-list --left-right --count origin/staging...HEAD` | `0	71` | local 71 ahead; out of scope for this brief but flag in closeout |

### Existing chounting-block template substrate (at `~/.claude/templates/project-settings-template.md` lines ~95–141)

```json
{
  "permissions": {
    "defaultMode": "default",
    "allow": [
      "Bash(pnpm test:*)",
      "Bash(pnpm typecheck:*)",
      "Bash(pnpm agent:floor)",
      "Bash(pnpm agent:validate)",
      "Bash(pnpm test:no-hardcoded-urls)",
      "Bash(pnpm verify-audit-coverage:*)",
      "Bash(pnpm db:start)",
      "Bash(pnpm db:stop)",
      "Bash(pnpm db:migrate)",
      "Bash(pnpm db:generate-types)",
      "Bash(supabase status:*)",
      "Bash(supabase migration list:*)"
    ],
    "ask": [
      "Bash(git commit:*)",
      "Bash(pnpm db:reset)",
      "Bash(pnpm db:reset:clean)",
      "Bash(pnpm db:seed:*)",
      "Bash(supabase db reset:*)",
      "Bash(supabase migration:*)"
    ],
    "deny": [
      "Read(.mcp.json)",
      "Read(**/supabase/.branches/**)",
      "Read(**/supabase/.temp/**)",
      "Read(tests/e2e/.auth/**)"
    ]
  }
}
```

Stage 2 starts here. Stage 1's Bucket B output extends `allow` / `ask` only where promotion is justified. The chounting block's four denies are **non-negotiable** per the rationale at template lines 135–141 (e2e auth cookies are credentials; .mcp.json may carry tokens; supabase .branches/.temp are build artifacts).

---

## Pre-decisions enumerated

What's decided at brief-write time. Do not re-litigate at execution unless explicitly flagged as OPEN below.

### Pre-decision (a) — Stage 0 pre-flight gates: subsumption check vs re-run

The prior cleanup-arc framing called for two operator-side pre-flight gates:

1. **cp-from-clean-cwd test** — verify global config behavior under a fresh shell, by `cp ~/.claude/settings.json /tmp/probe.json` from a clean cwd, confirming the global is readable and well-formed before the project-layer write that depends on its semantics.
2. **dangerously-skip-permissions probe** — confirm `disableBypassPermissionsMode: "disable"` is taking effect by attempting `claude --dangerously-skip-permissions` in a sandbox session and observing refusal.

These gates exist to verify "the global config works before pruning the local config that's been compensating for it."

**Stage 0 disposition (operator-decision-point at execution-kickoff):**

- (a-i) **Operator confirms gates are subsumed by the rollback session** where the Stage 1 curl-deny-restoration test was run (i.e., `Bash(curl:*)` was tested and confirmed denied once `Bash(*)` was removed from a transitively-allow path — that test exercised the global deny path and is sufficient evidence the global is intact). Stage 0 marks "subsumed by [rollback session ref]; not re-run." Brief notes the subsumption in Stage 5 closeout.
- (a-ii) **Operator chooses to re-run the gates** — runs both, pastes results into the closeout NOTE. Stage 1 does not open until both gates green.

Default at brief-write: **(a-i)** — the rollback session's curl test gave equivalent confidence; re-running the cp + dangerously-skip probes does not surface new information at this state. Operator may override at Stage 0 entry.

### Pre-decision (b) — Monorepo workspace `--filter` command shape

10 entries in current settings.local.json reference `pnpm --filter @chounting/...`. Three shapes available:

- (b-i) **Bucket C keep, narrow per-package**: each `Bash(pnpm --filter @chounting/web typecheck)` / `... lint` / `... build` stays in local allow as-is. Rules are per-machine; local sprawl absorbs them.
- (b-ii) **Bucket B promote, narrow per-package**: extract `Bash(pnpm --filter @chounting/web:*)` and `Bash(pnpm --filter @chounting/demo:*)` to project allow. Project-layer documents the workspace-shape commands recur.
- (b-iii) **Bucket B promote, broad**: extract `Bash(pnpm --filter:*)` to project allow. Single rule covers all current and future workspace commands.

**Default at brief-write: (b-ii)** — narrow-per-package promotion. Reasoning: (b-i) leaves current sprawl in local file; (b-iii) is too broad and may approve future workspace packages (e.g., a `@chounting/admin-tools` added later) without separate review. (b-ii) gates per-package while documenting the recurring workspace shape. Operator may override at Stage 1.

### Pre-decision (c) — Security-regression triage protocol

Three classes of security regression are present at HEAD `bf153fc`:

- **Class 1 — global-deny override**: `Bash(curl:*)` and `Bash(rm -rf node_modules apps/web/node_modules packages/*/node_modules)` (the latter shadows the global `Bash(rm -rf:*)` deny pattern). The global deny status of `Bash(curl:*)` and `Bash(rm -rf:*)` is to be verified at Stage 4 Scenario 4.3 via runtime curl probe (and an analogous probe for the rm-rf class if Stage 4 elects to add one); file-level inspection alone is insufficient per the Read-tool-bug discipline (see `docs/07_governance/friction-journal.md` 2026-05-02 NOTE). Local allow does **not** override global deny in Claude Code's permission model — denies always win — so the practical impact is bounded to confusing audit reads. But the rules' presence signals approve-once-and-forget on commands that should never have been approved. **Disposition: Bucket D, delete outright.**

- **Class 2 — global-ask downgrade**: `Bash(git add:*)`, `Bash(git checkout:*)`, `Bash(git commit:*)`, `Bash(git commit -m ':*)`, `Bash(COORD_SESSION='vercel-deploy-fix' git add ...)`. Local allow **does** override global ask (allow wins over ask in the resolution order), so these rules silently bypass intentional gates. **Disposition: Bucket D, delete outright.**

- **Class 3 — broad-shell injection vectors**: `Bash(bash *)`, `Bash(awk *)`, `Bash(python3 *)`, `Bash(python3 -c ' *)`, `Bash(xargs cat *)`, `Bash(xargs basename *)`, `Bash(xargs -I {} sh -c '...')` — these are over-broad allows on commands whose argument structure makes them de facto shell-injection surfaces (xargs+sh -c is the textbook pattern). **Disposition: Bucket D, delete outright.**

Stage 1 inventories all three classes verbatim with rule-text-quoted reasoning so Stage 5's diff review is self-documenting.

### Pre-decision (d) — `Bash(psql:*)` and `Bash(PGPASSWORD=postgres psql *)`

Direct postgres CLI; can run any SQL. Three options:

- (d-i) **Bucket B project ALLOW** as `Bash(PGPASSWORD=postgres psql:*)` — workflow approval; trusted local-only postgres with hardcoded password.
- (d-ii) **Bucket B project ASK** — prompt every time; psql can drop tables.
- (d-iii) **Bucket C local-allow** — per-machine, not in committed config.

**Default at brief-write: (d-ii)** — project ASK. psql is destructive-shape, postgres CLI is the surface where mistakes are silent and irreversible. Friction is justified. Operator may override at Stage 1.

### Pre-decision (e) — `Bash(pnpm add *)`

Installs npm packages — supply-chain shape. Already covered by global `Bash(pnpm:*)` allow.

- (e-i) **Bucket A delete** (already covered).
- (e-ii) **Bucket B project ASK** — re-gate at project layer because chounting is high-blast-radius and dependency drift is a known-shape failure mode.

**Default at brief-write: (e-ii)** — project ASK. Catches surprise installs in a governance-heavy repo. Operator may override.

### Pre-decision (f) — `pnpm typecheck:*` etc. listed in template chounting block

The template chounting-flavored block lists `Bash(pnpm test:*)`, `Bash(pnpm typecheck:*)`, etc. in project allow. Under `defaultMode: "default"`, the global `Bash(pnpm:*)` allow still applies — these are technically **redundant** at the project layer.

**Default at brief-write: keep redundant entries in project block as the template prescribes.** Reasoning: cheap belt-and-suspenders; signals to future readers which workflows the chounting project formally relies on; survives a hypothetical future global tightening that scopes `Bash(pnpm:*)` narrower. Project-layer cost is one line per script name. Operator may override.

### Pre-decision (g) — Sort order within `allow` / `ask` / `deny`

**Alphabetical, case-sensitive ASCII sort** within each list. Reasoning: diffability under future amendments; deterministic ordering under regen; matches the template chounting block's existing shape. No semantic clustering (no "all pnpm together, all supabase together") — alphabetical absorbs that ordering naturally for the chounting command set.

### Pre-decision (h) — `enableAllProjectMcpServers` and `enabledMcpjsonServers` preservation

`settings.local.json` currently has:

```json
"enableAllProjectMcpServers": true,
"enabledMcpjsonServers": ["supabase"]
```

These are **per-machine MCP server enablement** flags; they belong in local, not project. Stage 3 preserves both verbatim in the pruned local file. Stage 2 does NOT include these in the project file (they would be machine-leaking if committed).

### Pre-decision (i) — Out-of-scope hooks

The prior session called out hooks as a separate session. **Confirmed out-of-scope here.** This session does not author, modify, or audit hooks. If during Stage 1 audit a rule is found that exists only because a hook would replace it, flag in closeout NOTE for the future hooks session.

### Pre-decision (j) — Out-of-scope skills audit

`chounting/.claude/skills/` audit is **out-of-scope**. The directory contains skill summaries (journal-entry-rules, service-architecture, etc.) that point at canonical leaves. They are not permission rules. Out-of-scope per scope discipline; flag if a skill's existence affects bucket categorization (none expected).

---

## Stages enumerated

Each stage is a Task with sub-steps. Task numbering aligns with TodoWrite items at execution.

### Stage 0 — Operator pre-flight gates (decision-point + conditional execution)

- [ ] **Step 0.1** — Operator decides per Pre-decision (a): subsumption (a-i) or re-run (a-ii). Default (a-i). Record decision in execution-session opening message.
- [ ] **Step 0.2** — IF (a-ii) chosen: run cp-from-clean-cwd probe (`cp ~/.claude/settings.json /tmp/probe.json` from `/tmp` cwd; verify file copied + JSON-validates with `jq . /tmp/probe.json`).
- [ ] **Step 0.3** — IF (a-ii) chosen: run dangerously-skip probe (attempt `claude --dangerously-skip-permissions --version` in throwaway shell; expect refusal or no-op per `disableBypassPermissionsMode: "disable"` semantics).
- [ ] **Step 0.4** — Record outcome. (a-i) → "Stage 0 subsumed by rollback session, not re-run." (a-ii) → paste both probe outputs into execution journal.

Stage 0 gate clears when 0.4 records. Stage 1 does not open before 0.4 records.

### Stage 1 — Substrate audit (re-bucket all 252 rules)

- [ ] **Step 1.1** — Verify HEAD at `bf153fc`. Verify working tree clean. Verify `.claude/settings.local.json` size 13612 bytes. Verify backup at `.claude/settings.local.json.bak.20260430T225519Z` present.
- [ ] **Step 1.2** — Run `cat ~/.claude/settings.json` from a fresh shell (NOT via Read tool) and capture stdout into the audit. Run `cat chounting/.claude/settings.local.json` similarly. The Read tool's view of these files has been observed unreliable per `docs/07_governance/friction-journal.md` 2026-05-02 Read-tool-consistency-bug NOTE; on-disk bytes via shell are the source of truth for substrate reads. Bucket categorization in Step 1.3 is grounded in the shell-captured content, not in any Read tool projection.
- [ ] **Step 1.3** — Categorize each of the 252 rules into Bucket A / B / C / D per:
  - **A** — already covered by global; delete from local.
  - **B** — promote to committed project config; chounting-specific workflow approval.
  - **C** — keep in local; per-machine ergonomics or single-instance approval that doesn't yet warrant project-layer membership.
  - **D** — delete outright; security regression (Pre-decision (c) Classes 1/2/3), one-off sprawl (sed/grep/cp specific-path), or malformed (Category D from pre-flight).
- [ ] **Step 1.4** — Resolve open Pre-decisions (b)/(d)/(e) — operator confirms or overrides defaults.
- [ ] **Step 1.5** — Produce A/B/C/D table with rule-text-quoted reasoning. Bucket counts reported. Bucket C target ≤30 (per CLAUDE.md "Personal overrides" guidance). Halts.
- [ ] **Step 1.6** — Operator approves or adjusts categorization. Stage 2 does not open before 1.6 records.

**Stage 1 exit criterion:** A/B/C/D table approved by operator; Bucket counts logged; Bucket C ≤30 entries.

### Stage 2 — Write `chounting/.claude/settings.json`

- [ ] **Step 2.1** — Start from chounting-flavored block at `~/.claude/templates/project-settings-template.md` lines ~99–132.
- [ ] **Step 2.2** — Layer in Bucket B promotions from Stage 1 (workspace `--filter` shape per Pre-decision (b); `pnpm add` ASK per Pre-decision (e); `psql` ASK per Pre-decision (d); any operator-override surfaces from Step 1.4).
- [ ] **Step 2.3** — Sort alphabetically within `allow` / `ask` / `deny` (Pre-decision (g)).
- [ ] **Step 2.4** — Validate: `jq . chounting/.claude/settings.json` must succeed.
- [ ] **Step 2.5** — Verify the four non-negotiable denies present: `Read(.mcp.json)`, `Read(**/supabase/.branches/**)`, `Read(**/supabase/.temp/**)`, `Read(tests/e2e/.auth/**)`.
- [ ] **Step 2.6** — Verify `defaultMode: "default"` present and at top of `permissions` block.
- [ ] **Step 2.7** — Verify `Bash(git commit:*)` in `ask` (push-readiness gate dependency).

**Stage 2 exit criterion:** valid JSON; four denies present; defaultMode override present; git commit gated to ask.

### Stage 3 — Prune `chounting/.claude/settings.local.json`

- [ ] **Step 3.1** — Reduce file to Bucket C entries only. Sort `allow` alphabetically.
- [ ] **Step 3.2** — Preserve `enableAllProjectMcpServers: true` and `enabledMcpjsonServers: ["supabase"]` (Pre-decision (h)).
- [ ] **Step 3.3** — Validate: `jq . chounting/.claude/settings.local.json` must succeed.
- [ ] **Step 3.4** — Confirm rule count under threshold. Target ≤30; if Bucket C is bigger, re-open Stage 1 for tighter categorization.

**Stage 3 exit criterion:** valid JSON; ≤30 allow entries; MCP-enablement keys preserved.

### Stage 4 — Load-bearing runtime-behavior verification

Four scenarios, all run from inside `chounting/`. Operator-side execution (real Claude Code session against the new layered config). Halt if any scenario behaves differently than expected; investigate before proceeding. **Stage 4 is the authoritative source-of-truth for whether the layered config behaves as designed; Stage 1's file reads provide audit substrate but the Read-tool consistency bug (per `docs/07_governance/friction-journal.md` 2026-05-02 NOTE) means file content alone is insufficient.** Specific-line citations against `~/.claude/settings.json` elsewhere in this brief are advisory; the runtime probes below settle effective behavior.

- [ ] **Scenario 4.1 — Project ASK fires.** Attempt `pnpm db:reset` (do NOT actually run it; only attempt the invocation). Expected: Claude Code prompts for permission. Confirm prompt fires, decline, observe nothing destructive happens. Records: prompt fired Y/N.
- [ ] **Scenario 4.2 — Project default-mode prompts on edit.** Create `docs/.scratch-probe.txt` (in-repo path) and edit it. Expected: prompt fires (because project `defaultMode: "default"` overrides global `acceptEdits` for in-repo edits). Confirm prompt, approve, then delete the probe file. Records: prompt fired Y/N.
- [ ] **Scenario 4.3 — Global deny still applies.** Attempt `curl https://example.com`. Expected: refusal (global deny at `~/.claude/settings.json:109`). Records: refused Y/N.
- [ ] **Scenario 4.4 — Global allow still silent under project default.** Attempt `pnpm typecheck`. Expected: runs silently (global `Bash(pnpm:*)` allow survives project `defaultMode: "default"` because explicit allow rules override the default). Records: silent Y/N + exit code.

**Stage 4 exit criterion:** all four scenarios behave as expected; any divergence halts and triggers investigation.

### Stage 5 — Stage but do not commit

- [ ] **Step 5.1** — `git add chounting/.claude/settings.json` (only the new committed file; .gitignore was shipped at `ee35abf`; settings.local.json stays gitignored).
- [ ] **Step 5.2** — `git status` and `git diff --staged`. Confirm exactly one file staged. Confirm diff reads cleanly.
- [ ] **Step 5.3** — Halt. Do not commit. Surface staged diff for operator review per `~/.claude/README.md` "Review discipline".

**Stage 5 exit criterion:** one file staged (`chounting/.claude/settings.json`); operator has reviewed the staged diff; commit deferred to operator's own commit invocation with audit-row + push-readiness-gate-shape commit-message.

---

## Out of scope

- **Hooks** — separate session per prior-session-end note (Pre-decision (i)).
- **Skills audit** — `chounting/.claude/skills/` not in scope (Pre-decision (j)).
- **Global config changes** — `~/.claude/settings.json` is read-only input. If Stage 1 surfaces a candidate-for-global promotion (e.g., `gh:*` in Pre-decision (c) Category C), flag in closeout NOTE for a future cross-cutting global session; do not edit global here.
- **The 71 unpushed commits** — this brief's anchor is `bf153fc` and the brief stages but does not commit. Push-readiness for the broader 71-commit run is its own gate (per `CLAUDE.md` Session execution conventions § Push readiness three-condition gate); not in scope here.
- **`settings.local.json.bak.*` cleanup beyond what Stage 0 does** — backups created during this session stay in `.claude/` until operator explicitly deletes; they're gitignored anyway.

---

## Exit criteria

| ID | Criterion | Evidence at Stage 5 |
|---|---|---|
| EC-1 | `chounting/.claude/settings.json` exists, JSON-valid, conforms to template chounting-block + Bucket B promotions | `jq . chounting/.claude/settings.json` exit 0; staged in git |
| EC-2 | `defaultMode: "default"` present; four denies present; `Bash(git commit:*)` in ask | grep / visual diff confirm |
| EC-3 | `chounting/.claude/settings.local.json` has ≤30 allow entries; preserves `enableAllProjectMcpServers` + `enabledMcpjsonServers` | `jq '.permissions.allow | length' chounting/.claude/settings.local.json` ≤ 30 |
| EC-4 | All four Stage 4 smoke-test scenarios behave as expected | scenario records logged in execution journal |
| EC-5 | Bucket D deletes documented per security-regression class (Pre-decision (c)) | Stage 1 audit table includes class column |
| EC-6 | One file staged (`chounting/.claude/settings.json`); commit deferred | `git status` output in Stage 5 close |
| EC-7 | Closeout NOTE captures: Stage 0 disposition (subsumed vs re-run), pre-decision overrides if any, any flagged-for-future-session items (hooks, skills, global) | friction-journal entry at session close |

---

## Rollback

Local-layer rollback path:

```bash
cp /home/philc/projects/chounting/.claude/settings.local.json.bak.20260430T225519Z \
   /home/philc/projects/chounting/.claude/settings.local.json
```

Project-layer rollback: `chounting/.claude/settings.json` is brand-new and uncommitted at session end. Roll back via `git restore --staged .claude/settings.json && rm .claude/settings.json` if Stage 5's staged file needs to disappear before the operator's review.

`.gitignore` rollback: not applicable; `ee35abf` shipped before this brief opened and the un-ignore is on origin/staging path-independently of this session's outcome.

If smoke-test Scenarios 4.1–4.4 diverge in ways suggesting the project-layer write is producing wrong behavior, restore both `.claude/` files from backup, surface diff between produced-and-rolled-back project file in closeout, and treat the session as a learning fire — re-attempt only after diagnosing the divergence.

---

## Closeout artifacts

- **Friction-journal entry** at `docs/07_governance/friction-journal.md` covering: Stage 0 disposition, the 36-rule drift since prior session as confirmed sprawl-without-tripwire firing, any pre-decision overrides, any flagged future-session items.
- **CURRENT_STATE.md** update: terse "S-config-cleanup-0430 — Complete" sub-section if the session closes clean, naming the project-layer write + local-layer prune deliverables and the Stage 4 smoke-test outcomes.
- **Sub-skills consulted**: none required at execution beyond `superpowers:executing-plans` for stage-by-stage discipline. Brief is self-contained.
