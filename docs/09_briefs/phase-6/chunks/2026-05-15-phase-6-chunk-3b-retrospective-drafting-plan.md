# Phase 6 chunk 6.3b Retrospective Drafting Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Execute Phase 6 chunk-6.3b retrospective drafting per the 7-round scope-lock cycle outputs — produce 3 staging commits (T3 ADR-0011 amendment → T4 CLAUDE.md 8 codifications → T1 retrospective writeup + F-J entry) + merge-to-main ceremony per Path C lock at chunk-6.3a brief Sub-Q1.

**Architecture:** Surface-precedence-strict 3-commit sequence (T3 → T4 → T1) per Round 5 Adjudication 2 lock. Per-commit full validation gate per Round 6 Op 1 lock. `--no-ff` regular-merge with explicit commit message per Round 6 Op 2 lock + cfcf2e7 ceremony precedent. Post-merge MEMORY.md anchor flip (out-of-repo memory-write) per Round 6 Op 4 lock. Path-C-equivalent reserve at Commit C drafting boundary if T1 retrospective volume (~2200-2600 ins) surfaces session-budget pressure.

**Tech Stack:** TypeScript monorepo at `apps/web/`; pnpm package manager; vitest test framework (1114/1114 baseline); Supabase migrations; git workflow with staging + main branches; origin at `github.com:champagne-papa/chounting.git`.

**Authoritative substrate references** (engineer reads these as session-onset substrate; do not duplicate inline):
- Chunk-6.3b session-onset handoff prompt at commit `e0824c2` (`docs/09_briefs/phase-6/chunks/2026-05-15-phase-6-chunk-3b-retrospective-consolidation-handoff.md`)
- Chunk-6.3a F-J +506 lines / 22 entries at `docs/07_governance/friction-journal.md` (bottom of file at commit `c612720`)
- Phase 4 retrospective writeup at `docs/07_governance/retrospectives/phase-4-retrospective.md` (shape inheritance)
- Phase 4 retrospective post-close drift-fix at `18dd608` (append-correction shape precedent)
- Drag-drop scope-input artifact at `a9f1071` (`docs/09_briefs/phase-6/2026-05-15-agent-conversation-document-drop-scope-input.md`; reference-only at chunk 6.3b)

**Scope-lock cycle locked outputs** (this plan consumes; see scope-lock conversation for full detail):
- 7-section retrospective writeup structure (Round 5 Adjudication 1) with §3 two-arc body refinement
- 3-commit sequencing per surface-precedence T3 > T4 > T1 (Round 5 Adjudication 2)
- 8 T4 codifications with insertion-site assignments (Round 3 + Round 4)
- T3 ADR-0011 fourth amendment text draft (Round 4 Op 1)
- Per-commit full validation gate (Round 6 Op 1)
- `--no-ff` merge ceremony with explicit commit message (Round 6 Op 2)
- §6 5-sub-section carry-forward structure (Round 7 Sub-op 6)
- Final RI-7 volume: ~2900-3600 ins / 3 staging commits + 1 merge commit / 4 files / ~3-6 hours execution

---

## File Structure

Four files affected across 3 staging commits + 1 merge commit:

| File | Change | Commit | Notes |
|---|---|---|---|
| `docs/07_governance/adr/0011-document-platform.md` | Append amendment block at end-of-file (fourth amendment per ADR-0022 codified format; chronological after chunk-6.1 third amendment at lines 1627-1712) | Commit A (T3) | ~200-300 ins |
| `CLAUDE.md` | 8 codifications inserted at specified surfaces under verify-forward-at-scope-lock cluster + codify-while-deciding cluster + new standalone sections | Commit B (T4) | ~500-700 ins |
| `docs/07_governance/retrospectives/phase-6-retrospective.md` | NEW file with 7-section structure | Commit C (T1) | ~2000-2400 ins |
| `docs/07_governance/friction-journal.md` | Append retrospective-process meta-observations entry at bottom of file (continues chunk-6.3a precedent) | Commit C (T1 + F-J bundle) | ~150-250 ins |

Out-of-repo (post-merge memory-write; not part of any git commit):
- `/home/philc/.claude/projects/-home-philc-projects-chounting/memory/MEMORY.md` — Phase 6 closed anchor flip
- Memory topic file (`project_phase_6_retrospective_shipped.md` or similar)

---

## Task 0: Pre-flight verification

**Files:** None modified; verification-only.

- [ ] **Step 1: Verify origin/staging HEAD baseline**

Run:
```bash
git rev-parse HEAD
git rev-parse origin/staging
git rev-parse origin/main
git log origin/main..origin/staging --oneline | wc -l
git status --short
```

Expected:
- `HEAD` = `origin/staging` = `e0824c25954ababc11cbeda5358a8e2066cc1c2a`
- `origin/main` = `cfcf2e79b9ccab754e59a1bc51f5ce6a164f4945`
- Commits-ahead-of-main = 243
- Working tree clean modulo `apps/web/tests/e2e/.auth/` (pre-existing Playwright auth state)

- [ ] **Step 2: Validate baseline gates**

Run:
```bash
pnpm typecheck
pnpm agent:validate
pnpm test
```

Expected:
- typecheck: `tsc --noEmit` clean
- agent:validate: 26/26 tests pass across 5 floor test files
- test: 1114 / 1114 tests pass across 194 test files

If any gate fails baseline: STOP. Surface drift to founder. Do not proceed with drafting until baseline restored.

**Round 7 Sub-op 5 (b) pre-commitment:** Log runtime observations of `pnpm test` + `pnpm agent:validate` + `pnpm typecheck` for validation-gate-runtime-stability N=2 evidence basis (chunk-6.3a-close baseline is N=1).

---

## Task 1: Commit A — T3 ADR-0011 fourth amendment

**Files:**
- Modify: `docs/07_governance/adr/0011-document-platform.md` (append at end-of-file)

ADR-0011 currently has three amendments per `ADR-0022 codified format` (chunk-6.1 amendment at lines 1627-1712 is the third; legacy 2026-05-08 + 2026-05-13 amendments are first + second). This commit adds the fourth.

- [ ] **Step 1: Read ADR-0011 last 30 lines to confirm append-site**

Run:
```bash
tail -30 docs/07_governance/adr/0011-document-platform.md
```

Expected: Last content is the chunk-6.1 amendment block (third amendment) — lines describing `ingest_items` deferral cross-references at lines 1703-1712.

- [ ] **Step 2: Append fourth amendment block at end-of-file**

Append the following amendment block (locked text from Round 4 Op 1):

```markdown


### Amendment 4 (2026-05-15) — Atomic-extension-via-JSONB-array channel-composition pattern

**Status.** Added at chunk 6.3b retrospective Commit A per
codification graduation T3 surface assignment.

**Codification.** The chunk 6.1 atomic RPC
`create_ingest_batch_with_documents_with_audit` (migration 152)
accepts variable-length JSONB array parameters (`p_documents`,
`p_case_sources`, `p_jobs`) sized per ingestion channel. The RPC
body's `jsonb_array_elements` iteration handles arbitrary array
sizes; per-row INSERT semantics are channel-agnostic.

Channel-specific row composition lives at the service layer.
Each channel-handler method constructs its `p_documents` /
`p_case_sources` / `p_jobs` arrays per the channel's row-
multiplication shape:

- **drag-drop** (chunk 6.2b): N files → N source_documents + N
  cases (1:1) + 0 case_sources + N jobs
- **forwarded_mailbox** (chunk 6.3a): 1 email + N attachments →
  N+1 source_documents + 1 case (per-email grain) + 1
  case_sources (email_body role) + N+1 jobs

Backward-compatible channel addition is service-layer-only.
Adding a new channel (api_ingest at Phase 7+; direct_upload
reserved per §1) does NOT require RPC amendment. The new
`ingestionService` method composes the appropriate p-arrays for
the new channel's row-multiplication shape.

**Discipline rule.** Future channel additions land at the
service-layer only. The chunk 6.1 RPC body is the canonical
atomicity boundary; channel-specific shape lives outside.

**v1 consumers.** chunks 6.2 (drag-drop) + 6.3 (forwarded_mailbox)
shipped pre-amendment. Phase 7 `api_ingest` + Phase 5.1 amendments
are named-future consumers per Phase 6 retrospective §6.b
cross-phase consumer inventory.

**Cross-references.**
- `supabase/migrations/20240152000000_ingestion_substrate.sql`
  lines 470-611 — chunk 6.1 RPC body with `jsonb_array_elements`
  iteration
- `apps/web/src/services/document-platform/ingestionService.ts` —
  channel-handler methods (`handleDragDropUpload` + `handleForwardedMailbox`)
- `docs/07_governance/friction-journal.md` chunk-6.3a F-J entry 18
  (atomic-extension-via-JSONB-array channel-composition pattern) —
  codification origin
- `docs/07_governance/retrospectives/phase-6-retrospective.md` §4
  T3 cluster — codification graduation surface
```

- [ ] **Step 3: Run per-commit full validation gate**

Run:
```bash
pnpm typecheck && pnpm agent:validate && pnpm test
```

Expected: All three green at chunk-6.3a-close baseline (1114/1114; 26/26; typecheck clean). Docs-only change should not affect any gate.

If any gate fails: STOP. Investigate — TypeScript tsconfig glob patterns may include markdown via some non-default config; or upstream commit drift. Resolve before continuing.

- [ ] **Step 4: Stage + commit + push**

Run:
```bash
git add docs/07_governance/adr/0011-document-platform.md
git commit -m "$(cat <<'EOF'
docs(adr-0011): fourth amendment — atomic-extension-via-JSONB-array channel-composition pattern (Phase 6 retrospective Commit A)

Codifies the atomic-extension-via-JSONB-array channel-composition
pattern that chunks 6.1 (RPC body) + 6.2b (drag-drop consumer) +
6.3a (forwarded_mailbox consumer) shipped. The discipline:
single atomic RPC accepts variable-length JSONB array parameters;
channel-specific row composition at the service layer; backward-
compatible channel addition is service-layer-only.

Graduates Phase 6 chunk-6.3a F-J entry 18 from "T3 candidate
pending verify" to "T3 graduated per ADR-0011 §1 verify-from-disk
evidence" (Round 4 Op 1).

Phase 6 retrospective Commit A per surface-precedence T3 > T4 > T1
sequencing. Subsequent commits: Commit B (T4 CLAUDE.md 8
codifications); Commit C (T1 retrospective writeup + F-J entry);
merge-to-main ceremony per --no-ff regular-merge.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
git push origin staging
```

Expected:
- Commit hash captured
- `git log origin/staging..HEAD | wc -l` = 0 post-push

---

## Task 2: Commit B — T4 CLAUDE.md 8 codifications

**Files:**
- Modify: `CLAUDE.md` (8 codification insertions across two existing clusters + new standalone sections)

**Insertion-site map** (per Round 5 Adjudication 1 + Round 3 + Round 5):

| Codification | Insertion site |
|---|---|
| T4-1 Substrate-mod-event test-staleness review | New sibling section under `## Verify-forward-at-scope-lock for computational-shape chunks` cluster (after `Substrate-now-enforcement-later cross-pattern`) |
| T4-2 RI-6 Grain 1 + Grain 5 amendments | Amendment to existing RI-6 subsections within `## Verify-forward-at-scope-lock` cluster — Grain 1 reinforcement (chunk 6.3a evidence basis) + Grain 5 wording extension (sub-sub-grains) |
| T4-3 Partial-information-recommendation-drift | New section under codify-while-deciding meta-discipline cluster (currently lives at friction-journal 2026-05-14 entry; promoted to CLAUDE.md) |
| T4-4 Verify-from-disk-at-non-standard-grain pattern | New sibling section under `## Verify-forward-at-scope-lock` cluster |
| T4-5 Webhook route handler conventions sub-cluster | New section (consolidates entries 1+3+4+5: directory convention + system-actor pattern + ServiceContext sister type + HMAC discipline) |
| T4-6 Flag 18 seed-data-PII-shape placeholder convention | New section parallel to chunk-6.2a `_for_test` first-instance graduation precedent |
| T4-7 Audit-action naming convention split | New section under audit emission conventions |
| T4-8 Zod strict-vs-passthrough convention | New section under Layer 2 boundary validation |

- [ ] **Step 1: Read CLAUDE.md structure**

Run:
```bash
grep -n "^## \|^### " CLAUDE.md | head -50
```

Identify:
- Where `## Verify-forward-at-scope-lock for computational-shape chunks` cluster lives
- Where `Substrate-now-enforcement-later cross-pattern` section ends (T4-1 inserts after)
- Where existing RI-6 Grain 1 + Grain 5 subsections live (T4-2 amends these)
- Where codify-while-deciding meta-discipline cluster surface lives (T4-3 lands here)
- Where audit-related sections live (T4-7 lands here)
- Where Layer 2 boundary validation sections live (T4-8 lands here)

- [ ] **Step 2: Draft + insert T4-1 Substrate-mod-event test-staleness review**

Insert as new sibling section after `Substrate-now-enforcement-later cross-pattern`. Text per Round 3 (a) lock:

```markdown

### Substrate-mod-event test-staleness review

When shipping a substrate modification that broadens an enum, adds
a partial UNIQUE constraint, renames a CHECK constraint, or
otherwise changes a column-level invariant, audit dependent tests
at substrate-mod commit time (not at downstream test-failure time)
for:

- Assertion strings referencing constraint names (likely to drift)
- Hardcoded values that the substrate-mod broadens or constrains
  (likely to collide)
- Reserved-set assertions (likely to invalidate)

**Evidence basis (N=3 graduation).** chunk-2-Phase-4 β-2
(exception_status `'matched'` broadening invalidated chunk-6 test
assertion on still-reserved set); chunk-6-Phase-2 β-2c (audit test
regex hardcoded constraint name that broadening migration renamed);
chunk-6.3a β-4 (chunk-6.1 RPC rollback test hardcoded `message_id`
collided with migration 155 idempotency partial UNIQUE index).

**Trigger.** Any substrate-mod commit that touches CHECK
constraint suffixes, enum membership, UNIQUE indexes, or column-
level NOT NULL invariants. Discipline fires at the substrate-mod
commit grain, before substrate changes propagate to downstream
consumer tests.
```

- [ ] **Step 3: Amend RI-6 Grain 1 (T4-2 part 1)**

Locate existing RI-6 Grain 1 subsection within `## Verify-forward-at-scope-lock` cluster. Append reinforcement paragraph after existing Grain 1 prose. Text per Round 3 (b) lock:

```markdown

**Grain 1 reinforcement (chunk 6.3a evidence basis).** Four sub-
instances at chunk-6.3a strengthen the Grain 1 discipline. Each
fires the same underlying pattern (brief-scope-lock-without-
substrate-verify-from-disk) at a distinct sub-grain:

- **Flag 20** (`organizations.slug` column gap; column-existence
  sub-grain): brief Sub-Q2 + Sub-Q6 walks referenced
  `inbound+<org-slug>@inbound.chounting.com` +
  `SELECT organizations WHERE slug = mailboxHash` without
  disk-verify on `organizations.slug` column. Disk evidence: no
  slug column. β-2 in-line single-finding-scale brief amendment
  per RI-10.

- **β-2** (MailboxHash resolution at impl-onset; same surface as
  Flag 20 but caught at impl-onset grain rather than brief-draft
  grain): execution-side caught at substrate-receipt before
  consuming.

- **β-3 / MF-2** (`ServiceContext` 111-site blast radius;
  consumer-count sub-grain): brief Sub-Q6 Artifact 3 proposed
  discriminated-union extension with pre-drafted conditional MF-2
  threshold "≤10 sites in-scope; >10 sites codify scope expansion."
  Disk evidence: 111 sites. 11x off. Brainstorming-side adjudicated
  to sister-type Approach B at impl-onset.

- **Sub-Q10** (cards-UI discovery mechanism gap; UI-consumer-
  contract sub-grain): brief Sub-Q1 "server-only" constraint at
  session start scoped to affordance-kind; Sub-Q10 walk surfaced
  existing-UI-consumer-contract not verified. Cross-references
  RI-6 Grain 5 amendment.

**Pattern.** RI-10 framing-interaction-tracing operates as the
consolidation discipline: four entries surface one underlying
pattern. The discipline rule strengthens at chunk-6.3a evidence
basis: cited substrate at scope-lock requires verify-from-disk at
the cited-substrate's grain — **column-existence** for SQL
references, **consumer-count** for blast-radius estimates,
**UI-consumer-contract** for affordance-kind constraints.
```

- [ ] **Step 4: Amend RI-6 Grain 5 (T4-2 part 2)**

Locate existing RI-6 Grain 5 subsection (currently codified per chunk-6.1 F-J entry promotion path). Replace existing Grain 5 prose with extended version per Round 3 (d) lock:

```markdown

### Grain 5 — Consumer-application grain at scope-lock

Grains 1-4 verify what substrate IS shipped. Grain 5 verifies how
shipped substrate interacts with existing CONSUMERS of the affected
entity types. Sub-sub-grains:

- **Substrate-shape consumer-application.** When cross-phase
  consumers (services, agent tools, integration tests) read the
  affected entity types, do they continue to behave correctly
  post-modification? **Evidence basis:** chunk-6.1 origin —
  cross-phase test failure surfaced consumer-contract gap;
  Sub-Q4 4-step activation sequence codified.

- **UI-consumer-contract.** When existing UI components consume
  the affected entity types, does the scope-lock's affordance-kind
  constraint account for the UI consumer's contract requirements?
  **Evidence basis:** chunk-6.3a Sub-Q10 firing — forwarded_mailbox
  ingestion would have shipped with cards-UI invisibility (operator-
  perceives-as-broken-despite-working-correctly) without the Grain 5
  extension catching the existing-UI-consumer gap.

**Discipline rule.** Scope-lock that ships substrate affecting an
entity type MUST verify-from-disk against all current consumers of
that entity type — services, agent tools, integration tests, AND
existing UI components — to confirm consumer-contract conformance
post-modification.
```

- [ ] **Step 5: Insert T4-3 Partial-information-recommendation-drift**

Insert as new section under codify-while-deciding meta-discipline cluster. Text per Round 3 (c) lock:

```markdown

### Partial-information-recommendation-drift discipline

When authoring a recommendation, brief, handoff prompt, or other
substrate that frames decisions for downstream consumption,
partial-information recommendations (recommendations made without
disk-verify on cited substrate) introduce drift that surfaces at
consumption time. Two firing-shapes:

- **Retrospective drift.** Recommendation references *prior work*
  (citations to existing files / sections / decisions) without
  disk-verify. Catch authority = reader of recommendation.
  Discovery moment = post-recommendation reading. Codification
  surface = drift-fix entry post-discovery.

- **Prospective drift.** Recommendation frames *future work*
  (handoff prompts / brief drafts) with quantitative anchors or
  substrate references without disk-verify at authoring time. Catch
  authority = execution-side session-onset state-verify. Discovery
  moment = pre-execution at substrate-receipt. Codification surface
  = Round 0 state-verify ratification + downstream consumption
  surfaces.

**Discipline rule.** Recommendations that cite substrate (file
paths / section references / quantitative anchors / decision
precedents) MUST disk-verify at authoring time. When this discipline
fails-to-fire at authoring time, the catch is structurally located
at the consumption surface (retrospective or prospective). Both
shapes inherit the broader Verify-from-disk-at-non-standard-grain
pattern at recommendation-substrate-receipt grain — see
Verify-from-disk-at-non-standard-grain codification for the
grain-agnostic parent discipline.

**Evidence basis (N=4 graduation; N=5 with post-Round-3 evidence):**
(1) Phase 5.1 "reviewer chunk" naming drift at Phase 4 retrospective
drafting (retrospective drift; caught at post-close drift-fix
`18dd608`); (2) Reading A vs B scope-lock adjudication (retrospective
drift; brainstorming-session-internal); (3) scope-observation framing
on Postmark webhook scope vs Reading B lock (retrospective drift;
brainstorming-session-internal); (4) chunk-6.3b handoff prompt
"~20+" vs 243 commits magnitude drift (prospective drift; caught at
WSL-side Round 0 state-verify). (5) chunk-6.3b Round 6 onset
brainstorming-side Op 2 "first merge-to-main since pre-Phase-4
grain" framing drift (caught at Round 6 verify-from-disk; cfcf2e7 +
9f0ebb3 prior merge-to-main precedents exist).
```

- [ ] **Step 6: Insert T4-4 Verify-from-disk-at-non-standard-grain pattern**

Insert as new sibling section under `## Verify-forward-at-scope-lock` cluster. Text per Round 3 (f) lock:

```markdown

### Verify-from-disk-at-non-standard-grain pattern

Execution-side at substrate-receipt MUST disk-verify substrate before
consuming, regardless of substrate-grain and regardless of
substrate-authorship-provenance. The discipline is grain-agnostic
and catch-direction-agnostic.

**Sub-grains observed-to-date (chunk-6.3a → 6.3b conversation arc):**

1. **Substrate-shape grain** (chunk-6.3a β-2): cited schema column
   verified to not exist on disk. Inter-side catch.
2. **Consumer-count grain** (chunk-6.3a β-3): cited blast-radius
   estimate (≤10 sites) verified to be 111 on disk (11x off).
   Inter-side catch.
3. **Context-gap grain** (chunk-6.3a scope-input artifact): cited
   Q1-Q4 content verified to not exist in session record.
   Session-internal catch.
4. **Handoff-receipt grain** (chunk-6.3a→6.3b transition): handoff
   prompt at `e0824c2` verified against disk anchors at session-onset
   state-verify. Inter-side catch.
5. **Intra-handoff-quantitative-estimate grain** (chunk-6.3b Round 0
   catch #4): "~20+ commits" handoff body estimate verified to be 243
   on disk (~12x off). Inter-side catch.
6. **Intra-commit-message-entry-count grain** (chunk-6.3b Round 0
   catch #5): "22 entries" commit message claim verified to be 26 on
   disk (1.18x off). **Intra-side catch** (NEW catch-direction
   sub-shape).

**Cross-grain instances at Phase 4:** (7) Round 3
retrospective-scoping (Phase 5.1 "reviewer chunk" naming drift).
(8) Post-retrospective-close drift-fix at `18dd608`.

**Discipline rule.** Disk is the canonical source. Substrate-receipt
grain — wherever it lives (impl-onset, session-onset, retrospective-
scoping, downstream-consumption) — requires disk-verify against the
cited substrate's grain. The substrate-author may be opposite-side
(inter-side catch; sub-grains #1, #2, #4, #5; Phase 4 instances) or
same-side (intra-side catch; sub-grain #6). The discipline operates
catch-direction-agnostic — same-side substrate is not exempt from
disk-verify-at-consumption.

**Named sub-disciplines:** Partial-information-recommendation-drift
(firing at recommendation-substrate-receipt grain; see codification
for two-shape sub-discipline).
```

- [ ] **Step 7: Draft + insert T4-5 Webhook route handler conventions**

Consolidates chunk-6.3a F-J entries 1+3+4+5. Draft as a single CLAUDE.md section with 4 sub-bullets. Read source substrate first:

```bash
grep -A 20 "First-instance precedent 1 —" docs/07_governance/friction-journal.md | head -100
```

Locate the chunk-6.3a "First-instance precedents shipped at chunk 6.3a close" H2 section (added at chunk-6.3a close in commit `c612720`). Use Precedents 1+3+4+5 prose as substrate.

Insert section text:

```markdown

### Webhook route handler conventions

Conventions for external-webhook routes — provider-invoked HTTP
endpoints that receive substrate from third-party services (Postmark
inbound mail; future Stripe / auth callbacks / etc.).

**Directory convention.** Webhook routes live at
`apps/web/src/app/api/webhooks/<provider>-<event>/route.ts`. Frontend-
invoked routes stay at `/api/orgs/[orgId]/...`. The semantic
distinction is **who invokes** (third-party HMAC-verified vs.
user-session-authenticated) and **how `org_id` is derived** (resolver
helper vs. URL parameter). Future webhook routes inherit this
directory layout.

**System-actor route handler pattern.** Webhook route handlers bypass
`withInvariants` and construct `SystemActorServiceContext` directly
with `caller: { user_id: null, system_actor: '<source>' }`. The
discriminator is **invocation source**: third-party HMAC-verified
webhook (system-actor) vs. authenticated user session (user-session).
Future system-actor surfaces (cron, scheduled tasks, other webhook
providers) inherit this pattern. The runtime guarantee that
`withInvariants` normally provides (verified caller + memberships-vs-
input-org check) is replaced by HMAC verification + provider-specific
org-resolve at the route handler boundary.

**`SystemActorServiceContext` sister type.** Sister type to
`ServiceContext` (NOT a discriminated-union extension). Existing
`ctx.caller.user_id` consumer sites unchanged. `recordMutation`
widens its accepted ctx shape to `ServiceContext |
SystemActorServiceContext`; storage provider methods widen `ctx`
to `StorageProviderContext` (same union) to accept system-actor
invocation at storage put time. Service methods that need to support
**both** invocation modes declare the union at parameter type
(explicit signature, not implicit narrowing). The "two ServiceContext
types" cost is bounded; the alternative (consumer-site narrowing at
discriminated-union extension) is scope-disproportionate to the
value at one new system-actor caller grain.

**HMAC constant-time signature comparison.** Webhook handlers use
`crypto.timingSafeEqual` (node:crypto) on equal-length hex digests
for signature verification. Direct `===` string comparison on
signature digests is an anti-pattern (timing-attack reconstruction
of the secret); `timingSafeEqual` is the canonical Node.js stdlib
primitive for constant-time digest comparison. The helper pattern:
compute expected digest → length-check → wrap in `timingSafeEqual`.

**Cross-references.**
- `apps/web/src/app/api/webhooks/postmark-inbound/route.ts` — first
  instance precedent for all four sub-conventions at chunk 6.3a.
- `apps/web/src/services/middleware/serviceContext.ts` —
  `SystemActorServiceContext` sister type definition.
- `apps/web/src/services/audit/recordMutation.ts` — union-widening
  surface for system-actor audit emission.
```

- [ ] **Step 8: Draft + insert T4-6 Flag 18 seed-data-PII-shape placeholder convention**

Read chunk-6.3a F-J Flag 18 entry as substrate:

```bash
grep -B 2 -A 15 "Flag 18" docs/07_governance/friction-journal.md | head -30
```

Insert section text (parallel placement to chunk-6.2a `_for_test` graduation):

```markdown

### Seed-data PII-shape placeholder convention

When migration-seeded data includes PII or near-PII (email addresses,
phone numbers, personal identifiers), prefer placeholder-plus-post-
deploy convention vs. literal-values-in-migration.

**Pattern.** Migration ships placeholder rows (e.g.,
`placeholder-founder@chounting.com`); operator runs post-deploy
`UPDATE` to substitute real values. Discipline-failure mode if
forgotten: downstream consumer rejects all data as not-matching
expected shape (loud, observable, not silent).

**Reason.** Git history is forever; v1 audience scope (internal-only)
does not constrain future audience. Placeholder seeds keep PII out of
the git provenance trail.

**Evidence basis (N=1 first-instance precedent at chunk-6.3a;
load-bearing-for-future-PII-seed-migrations).** Migration 155
Statement 3 inserts 3 allowlist seed rows with placeholder addresses
for `internal_sender_allowlist`. Operator runs post-deploy `UPDATE`
for each placeholder.

**Cross-references.**
- `supabase/migrations/20240155000000_forwarded_mailbox_substrate.sql`
  Statement 3 — first-instance precedent.
- chunk-6.2a `_for_test` suffix convention (N=1 first-instance
  precedent) — parallel graduation pattern.
```

- [ ] **Step 9: Draft + insert T4-7 Audit-action naming convention split**

Read chunk-6.3a F-J entry 15 as substrate (in tier-2 retro carry-forwards H2 section).

Insert section text:

```markdown

### Audit-action naming convention split

Audit action names split between two shapes:

- **Dot-namespaced** (`forwarded_mailbox.rejected_not_allowlisted`,
  `forwarded_mailbox.signature_invalid`): for new domain-event
  families with anticipated taxonomy expansion. The namespace prefix
  groups related actions under a single domain umbrella; future
  taxonomy additions land as new sub-actions under the same prefix.

- **Underscored** (`document_case_transitioned`,
  `ingest_batch_created`): for established entity-state-transition
  events with stable taxonomy. The flat naming reflects the stable
  shape; no umbrella prefix needed.

**Evidence basis (N=2 graduation).** chunk-6.3a forwarded_mailbox.*
opens a new domain family (dot-namespaced); chunk-2-Phase-3
`document_case_transitioned` is established entity-state-transition
(underscored).

**Discipline rule.** When introducing a new audit action, choose
shape based on taxonomy stability: dot-namespaced if you anticipate
≥3 related actions under the same domain umbrella; underscored if
the action is standalone or part of a stable event family.
```

- [ ] **Step 10: Draft + insert T4-8 Zod strict-vs-passthrough convention**

Read chunk-6.3a F-J entry 19 as substrate.

Insert section text:

```markdown

### Zod strict-mode-for-our-shape vs passthrough-for-third-party

Zod schemas split on `.strict()` / `.passthrough()` based on
substrate origin:

- **Our-shape schemas** use `.strict()` — typically with `.refine()`
  sentinel-rejection layer for defense-in-depth. Detect drift early;
  symmetric Layer-2 write-side discipline.

- **Third-party-payload schemas** use `.passthrough()` — forward-
  compat with provider API additions (new fields silently dropped at
  our-shape construction). Sentinel-rejection NOT applied (third-
  party payload won't naturally emit our sentinel-shape;
  defense-in-depth marginal).

**Evidence basis (N=2 graduation).**
`DragDropChannelMetadataSchema` `.strict()` + `.refine()` for
sentinel rejection (our-shape; chunk 6.2b);
`PostmarkInboundWebhookSchema` `.passthrough()` for forward-compat
with Postmark API additions like `ReplyTo`, `MessageStream`,
`OriginalRecipient` (third-party-payload; chunk 6.3a).

**Discipline rule.** Authoring a new Zod schema requires
substrate-origin classification: our-shape gets `.strict()`; third-
party-payload gets `.passthrough()`. PascalCase field names at the
third-party-payload boundary transform to snake_case at our-shape
construction.
```

- [ ] **Step 11: Run per-commit full validation gate**

Run:
```bash
pnpm typecheck && pnpm agent:validate && pnpm test
```

Expected: All three green at baseline.

- [ ] **Step 12: Stage + commit + push**

Run:
```bash
git add CLAUDE.md
git commit -m "$(cat <<'EOF'
docs(claude-md): 8 codifications shipped at Phase 6 chunk-6.3b retrospective Commit B

Ships 8 CLAUDE.md codifications graduating from chunk-6.3a F-J
entries + cross-session consolidation candidates. Codifications:

- Substrate-mod-event test-staleness review (candidate a; N=3
  graduation across chunk-2-Phase-4 + chunk-6-Phase-2 + chunk-6.3a)
- RI-6 Grain 1 reinforcement + Grain 5 wording extension
  (candidates b + d combined per Round 5 lock; sub-sub-grain
  refinement for substrate-shape + UI-consumer-contract)
- Partial-information-recommendation-drift (candidate c; N=4-5
  graduation with two-shape sub-discipline: retrospective +
  prospective)
- Verify-from-disk-at-non-standard-grain pattern (candidate f;
  grain-agnostic parent codification with 8 sub-grain instances
  + catch-direction-agnostic discipline rule)
- Webhook route handler conventions sub-cluster (chunk-6.3a entries
  1+3+4+5; first-instance precedent at /api/webhooks/ directory)
- Seed-data PII-shape placeholder convention (chunk-6.3a Flag 18;
  N=1 first-instance precedent)
- Audit-action naming convention split (chunk-6.3a entry 15; N=2
  evidence dot-namespaced + underscored)
- Zod strict-mode-for-our-shape vs passthrough-for-third-party
  convention (chunk-6.3a entry 19; N=2 evidence)

Phase 6 retrospective Commit B per surface-precedence T3 > T4 > T1
sequencing. Single-commit per Phase 4 Commit C precedent
(5-RI-sub-section atomic ratification; chunk-6.3b ships 8
codifications atomically).

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
git push origin staging
```

Expected:
- Commit hash captured
- `git log origin/staging..HEAD | wc -l` = 0 post-push

---

## Task 3: Commit C — T1 retrospective writeup + F-J retrospective-process entry

**Files:**
- Create: `docs/07_governance/retrospectives/phase-6-retrospective.md` (new file, 7 sections)
- Modify: `docs/07_governance/friction-journal.md` (append retrospective-process meta-observations entry)

**Substrate references** (engineer reads these as prose-direction substrate; full prose generation at execution time):

- Scope-lock cycle outputs (7 rounds; full conversation in scope-lock-cycle handoff at `e0824c2` + scope-lock-cycle conversation history)
- chunk-6.3a F-J +506 lines / 22 entries (at `docs/07_governance/friction-journal.md` bottom of file at commit `c612720`)
- Phase 4 retrospective writeup at `docs/07_governance/retrospectives/phase-4-retrospective.md` (shape inheritance + surface-precedence note at §7)
- Phase 5 retrospective writeup at `docs/07_governance/retrospectives/phase-5-retrospective.md` §6:380-381 (canonical sequencing for §6.b)
- Phase 2 retrospective writeup at `docs/07_governance/retrospectives/phase-2-retrospective.md` §6:588 (Phase 5.1 parallel-candidate framing for §6.b)

**Path-C-equivalent reserve:** If Commit C drafting surfaces session-budget pressure (T1 ~2200-2600 ins + F-J entry ~150-250 ins = ~2350-2850 ins single-session ship), invoke Path-C-equivalent at commit-boundary fault line. Drafting can split at §-boundary fault line within Commit C if needed; reserve at execution time.

- [ ] **Step 1: Create retrospective file with 7-section skeleton**

Create `docs/07_governance/retrospectives/phase-6-retrospective.md` with:

```markdown
# Phase 6 retrospective — Document Platform Ingestion (chunks 6.1 → 6.3a)

**Status.** Closes Phase 6 at chunk-6.3b substrate complete (this
retrospective + ADR-0011 fourth amendment at Commit A `<hash>` +
CLAUDE.md 8 codifications at Commit B `<hash>`) + merge-to-main
ceremony per Path C lock at chunk-6.3a brief Sub-Q1. Three Phase 6
retrospective commits sequenced A → B → C per surface-precedence
T3 > T4 > T1. 1114/1114 vitest; 26/26 agent:validate;
documentation-only batch.

**Surface-precedence note.** Three artifact surfaces ship from this
retrospective work: T3 (the ADR-0011 fourth amendment at Commit A);
T4 (the 8 CLAUDE.md codifications at Commit B); T1 (this
retrospective writeup at Commit C). The surface-precedence ordering
when a future reader needs the canonical statement of any Phase 6
codification is **T3 > T4 > T1** per the CLAUDE.md "When in doubt"
leaf-discipline (ADRs are tiebreakers for architectural questions;
CLAUDE.md is the standing-rules layer; retrospectives are the
war-diary layer). This note is positioned at the end of §7; the
writeup itself follows the seven-section sequence below.

## 1. Arc summary

[Body per Step 2 — Arc summary]

## 2. Per-chunk learnings

[Body per Step 3 — Per-chunk learnings]

## 3. Centerpiece — Cross-phase consumer-application of Phase 4 codifications + scale-invariant disciplines parallel arc

[Body per Step 4 — Centerpiece + parallel arc]

## 4. Codified patterns

[Body per Step 5 — Codified patterns flat structure]

## 5. Inventory documentation

[Body per Step 6 — Inventory documentation]

## 6. Carry-forwards

[Body per Step 7 — Carry-forwards 5-sub-section structure]

## 7. Surface-precedence note (T3 > T4 > T1)

[Body per Step 8 — Surface-precedence note]
```

- [ ] **Step 2: Write §1 Arc summary**

Write §1 prose body. Include:
- 4-chunk arc enumeration (chunks 6.1 / 6.2a / 6.2b / 6.3a) with one-line summary + commit hash each
- Phase 6 closes structurally at chunk-6.3b substrate complete + merge-to-main per Path C lock
- Path C invocation at novel grain (implementation-vs-retrospective split at chunk 6.3 sequencing)
- 7-round scope-lock cycle convergence with Phase 4 (Round 7 terminal observation 2; brainstorming-side observation: "Phase 6 retrospective scope-lock cycle closed at 7 rounds; matches Phase 4 retrospective scope-lock cycle round-count; N=2 round-count convergence at retrospective-scope-lock-cycle grain anchors the 7-round expectation for Phase 7 retrospective volume forecasting") — incorporate as parenthetical or single sentence per WSL-side Round 7 lean
- 1114/1114 vitest baseline reference

Length target: ~80-120 lines. Phase 4 §1 (lines 1-93) is shape inheritance.

- [ ] **Step 3: Write §2 Per-chunk learnings**

Write §2 prose body with one subsection per chunk. Read per-chunk implementation notes for substrate (auto-memory topic files: `project_phase_6_chunk_1_implementation_notes`, `project_phase_6_chunk_2a_implementation_notes`, `project_phase_6_chunk_2b_implementation_notes`, `project_phase_6_chunk_2a_implementation_notes` for chunk-6.3a impl notes). Each subsection covers:
- Chunk substrate shipped (substrate + service + tests)
- Friction-journal entries shipped (per-chunk count + tier classification)
- β reconciliations + first-instance precedents (if any)
- Cross-references to ADR amendments + RI codification firings

Length target: ~150-300 lines. Phase 4 §2 (lines 95-200) is shape inheritance.

- [ ] **Step 4: Write §3 Centerpiece + parallel arc**

Write §3 prose body with two sub-sections per Round 5 Adjudication 1 refinement:

**§3.a Primary arc: Cross-phase consumer-application of Phase 4 codifications**

- Per-chunk RI-firings inventory (concrete codification firings at chunks 6.1 / 6.2a / 6.2b / 6.3a):
  - chunk 6.1: RI-6 fifth-grain F-J entry (substrate-shape Grain 5 origin)
  - chunk 6.2a: RI-7 + F-J-14 Path C N=2 graduation; Sub-Q4 4-step shape
  - chunk 6.2b: Flag 16 RI-7 forecasting drift (origin)
  - chunk 6.3a: RI-1 (β-2 consumer-presence) + RI-6 (Sub-Q10 Grain 5 UI-consumer-contract firing) + RI-7 (Path C reference) + RI-10 (β-2/β-3 in-line amendments + compound cluster consolidation) + codify-while-deciding (reflexive throughout)
- Synthesis: Phase 6 is the first phase-arc test of Phase 4 codifications operating at consumer-application time per Phase 4 §6.c named-future-feedback-loops.

**§3.b Parallel arc: Scale-invariant disciplines at retrospective grain**

Three sub-property observations with explicit inheritance relationships:

- **Observation 1: Brainstorming-side/execution-side split scale-invariance (primary).**
  - Sub-dimension within-impl-session (chunk-6.3a β-2 + β-3 + scope-input + screenshot gate)
  - Sub-dimension session-handoff-boundary (chunk-6.3a→6.3b handoff)
  - Status: N=2 broad family; T1 retrospective writeup

- **Observation 2: RI-10 framing-interaction-tracing scale-invariance (parallel meta-discipline).**
  - Refined framing per WSL-side Round 7 + brainstorming-side terminal observation 1: "RI-10 fires whenever consolidation-pressure is present at multi-framing scale, regardless of grain dimension (amendment-cycle, scope-lock-round, cross-adjudication, cross-candidate)."
  - Positive-instance firings (N=3): chunk-3-Phase-4 N=5 amendment cycle; chunk-6.3b Round 3 N=4 within-scope-lock-round; chunk-6.3b Round 5 N=3 within-adjudication
  - Negative-instance non-firings (N=2): chunk-6.3b Round 6 parallel-operation grain; chunk-6.3b Round 7 sequential-sub-op grain
  - Discipline-shape evidence: positive instances confirm "RI-10 fires under consolidation pressure"; negative instances confirm "RI-10 silent without consolidation pressure" (round-grain alone is not sufficient trigger). Operates at consolidation-pressure grain, not round-grain.

- **Observation 3: Artifact-immutability discipline two-shape distinction (DESCENDANT of Observation 1).**
  - Shape α: Phase 4 retro append-correction at `18dd608` (same-side same-arc)
  - Shape β: chunk-6.3b handoff downstream-correction-surface at `e0824c2` (cross-side cross-session)
  - Inheritance: descendant of brainstorming-side/execution-side split through authorship-boundary structural property. Same-side authoring → append-correction (write-access to artifact); cross-side authoring → downstream-correction-surface (no write-access at consumption-grain)
  - Status: N=2 sub-shapes; T1 retrospective writeup

Length target: ~250-400 lines. Phase 4 §3 (lines 201-380; framing-discovery arc centerpiece) is shape inheritance.

- [ ] **Step 5: Write §4 Codified patterns (flat structure)**

Write §4 with flat cluster structure per Phase 4 §4 shape:

- **T3 cluster — graduated to ADR-0011 (Commit A).** Entry 18 atomic-extension-via-JSONB-array channel-composition pattern. See Commit A at `<hash>`.
- **T4 cluster — graduated to CLAUDE.md (Commit B).** 8 codifications atomically ratified. Enumerate per Commit B's 8 codifications above.
- **Memory-only-stays cluster — sub-threshold codification candidates.** chunk-6.3a entries 7 (Flag 19 terminology hygiene), 11 (β-1 column name), 16 (cascade-closed sub-Q folding), 17 (migration bundling threshold), 21 (limit-default-50), 22 (email_body filename), 24 (ADR-0008 vs ADR-0010). Plus consolidated entries 9+20 (server-only-constraint refinement).
- **Carry-forward cluster — items not graduating at Phase 6 retrospective.** Sub-Q4 4-step ADR-0010 amendment candidate; ADR-0008 vs ADR-0010 cross-reference clarity; F-J location decision deferral.

Length target: ~250-400 lines. Phase 4 §4 (lines 381-580) is shape inheritance.

- [ ] **Step 6: Write §5 Inventory documentation**

Write §5 with the Sub-Q8 walk results table from Round 2:
- 26 chunk-6.3a entries (originally claimed as 22 per chunk-6.3a F-J commit message; verify-from-disk corrected to 26 at chunk-6.3b Round 2) with T-cluster classifications
- 6 cross-session candidates (a)-(f) with T-cluster classifications
- Memory-only-stays entries enumerated
- T1 entries enumerated

Length target: ~150-250 lines. Phase 4 §5 (lines 579-623) is shape inheritance.

- [ ] **Step 7: Write §6 Carry-forwards (5 sub-sections)**

Write §6 with 5 sub-sections per Round 7 Sub-op 6 lock:

**§6.a Inventory documentation** — Sub-Q8 walk classification table reference (consolidates with §5 if appropriate; or stands as cross-reference).

**§6.b Cross-phase consumer inventory** — Three named-future-consumers:
- Phase 7 (Tier 2 pipeline) per Phase 5 retro §6:380-381 sequencing
- Phase 5.1 amendments territory per Phase 2 retro §6:588 parallel-candidate framing
- Drag-drop scope-lock cycle pointer at `a9f1071`; framing-adjudication-deferred to fresh-session Round 1 per artifact §5 partial-information warning

**§6.c Named-future-feedback-loops** — chunk-6.3b first-instance evidence of Phase 4 codifications at consumer-application time per §3.a centerpiece; Phase 7 + Phase 5.1 next-instance candidates.

**§6.d Carry-forwards to Phase 7 retrospective:**
- F-J location decision deferral per Round 5 Adjudication 3 (α) lock
- Fast-forward vs `--no-ff` merge discipline (Round 6 Op 2 observation)
- Validation gate runtime stability with drafting-fire-logging pre-commitment (Round 6 reserve catch; chunk-6.3a-close N=1 + chunk-6.3b drafting N=2)
- 243-commit-forward-merge magnitude observation (Round 6 Op 2 magnitude property; first-instance at chunk-6.3b grain)
- Candidate (c) N=5 extension (Round 7 Sub-op 5 (d) observation)
- Sub-Q4 4-step ADR-0010 amendment candidate (Round 4 Op 2 sweep)
- ADR-0008 vs ADR-0010 cross-reference clarity (Round 4 memory-only-stays)
- **Parallel arc body shape inheritance** — Phase 7 retrospective writeup may inherit §3.b parallel arc body structure (sub-property observations + descendant relationships explicit) for its own meta-discipline observations
- Positive + negative evidence as combined N-count basis for discipline-shape codification (Round 7 brainstorming-side terminal observation 1; Tier-3 candidate)

**§6.e Deferred operational sequencing** — Phase 7 + Phase 5.1 + drag-drop operational sequence determined at fresh post-chunk-6.3b session per Sub-op 2 lean.

Length target: ~250-400 lines. Phase 4 §6 (lines 624-776) is shape inheritance.

- [ ] **Step 8: Write §7 Surface-precedence note (T3 > T4 > T1)**

Write §7 per Phase 4 §7 shape (lines 777-823). One paragraph stating the precedence + reasoning.

Length target: ~30-50 lines.

- [ ] **Step 9: Append F-J retrospective-process meta-observations entry**

Append entry to `docs/07_governance/friction-journal.md` (continues monolithic append per Round 5 Adjudication 3 (α) lock). Header: `## 2026-05-15 — Phase 6 chunk-6.3b retrospective-process meta-observations (Phase 6 chunk 6.3b)`.

Body covers:
- 7-round scope-lock cycle close (4 firing rounds + 3 sequential rounds)
- RI-10 firing-at-consolidation-pressure refined framing (positive + negative evidence basis)
- Codify-while-deciding-at-decision-time discipline firing at scope-lock-cycle-close grain (Round 7 brainstorming-side micro-observation; N=1 sub-grain)
- Round 0 catches resolution shape (3 closed + 1 held for Round 5 + 1 NEW at Round 4 verify-from-disk + 1 NEW at Round 6 verify-from-disk = 5 catches total)
- Parallel arc body shape inheritance carry-forward for Phase 7 retrospective writeup

Length target: ~150-250 lines. Phase 4 retrospective-process F-J entry (in `friction-journal.md`) is shape inheritance.

- [ ] **Step 10: Run per-commit full validation gate**

Run:
```bash
pnpm typecheck && pnpm agent:validate && pnpm test
```

Expected: All three green at baseline.

- [ ] **Step 11: Stage + commit + push**

Run:
```bash
git add docs/07_governance/retrospectives/phase-6-retrospective.md docs/07_governance/friction-journal.md
git commit -m "$(cat <<'EOF'
docs(retrospectives): Phase 6 retrospective writeup + retrospective-process F-J entry (Commit C)

Ships Phase 6 retrospective writeup at docs/07_governance/retrospectives/phase-6-retrospective.md
(7 sections per Phase 4 retrospective shape inheritance; §3 two-arc
body with three sub-property observations + descendant relationships
explicit) + retrospective-process meta-observations F-J entry at
docs/07_governance/friction-journal.md (continues monolithic append
per Round 5 Adjudication 3 (α) lock).

Centerpiece: Cross-phase consumer-application of Phase 4 codifications
(primary arc; chunk 6.1 + 6.2a + 6.2b + 6.3a per-chunk RI-firings
inventory) + Scale-invariant disciplines at retrospective grain
(parallel arc; three sub-property observations: brainstorming-side/
execution-side split scale-invariance + RI-10 framing-interaction-
tracing scale-invariance with positive+negative evidence basis +
artifact-immutability discipline two-shape distinction as descendant
of split).

Phase 6 retrospective Commit C per surface-precedence T3 > T4 > T1
sequencing. Closes scope-lock cycle (7 rounds locked) + drafting
fire complete. Pre-merge full gate next; merge-to-main ceremony per
--no-ff regular-merge with explicit commit message.

§6 carry-forwards to Phase 7 retrospective + Phase 5.1 amendments +
drag-drop scope-lock cycle. F-J location decision deferral; fast-
forward vs --no-ff merge discipline; validation gate runtime
stability; 243-commit-forward-merge magnitude observation; candidate
(c) N=5 extension; positive + negative evidence as combined N-count
basis for discipline-shape codification.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
git push origin staging
```

Expected:
- Commit hash captured
- `git log origin/staging..HEAD | wc -l` = 0 post-push

---

## Task 4: Pre-merge validation gate re-run

**Files:** None modified; verification-only.

- [ ] **Step 1: Verify staging HEAD is at Commit C**

Run:
```bash
git rev-parse HEAD
git log -1 --oneline HEAD
```

Expected: HEAD is the Commit C hash from Task 3 Step 11; commit subject is "docs(retrospectives): Phase 6 retrospective writeup ...".

- [ ] **Step 2: Run pre-merge full validation gate**

Run:
```bash
pnpm typecheck && pnpm agent:validate && pnpm test
```

Expected: All three green. If any fail: STOP. Investigate drift; do not proceed to merge.

- [ ] **Step 3: Verify pre-merge state checklist**

Run:
```bash
git status --short
git log origin/main..origin/staging --oneline | wc -l
```

Expected:
- Working tree clean modulo `apps/web/tests/e2e/.auth/`
- 246 commits staging-ahead-of-main (243 pre-chunk-6.3b + 3 chunk-6.3b commits A + B + C)

---

## Task 5: Merge-to-main ceremony

**Files:** None modified at file level; merge commit added to `main` branch.

- [ ] **Step 1: Switch to main + pull**

Run:
```bash
git checkout main
git pull origin main
git rev-parse HEAD
```

Expected: Local `main` HEAD = `origin/main` HEAD = `cfcf2e79b9ccab754e59a1bc51f5ce6a164f4945`.

- [ ] **Step 2: Run --no-ff merge with explicit commit message**

Run:
```bash
git merge --no-ff staging -m "$(cat <<'EOF'
Merge Phase 6 (Ingestion) staging → main at chunk-6.3b retrospective close

Phase 6 closes structurally at chunk-6.3b substrate complete + merge-to-main
ceremony per Path C lock at chunk-6.3a brief Sub-Q1. First merge-to-main
since cfcf2e7 (post-MVP era pre-Phase-4); 243-commit forward-merge
magnitude.

Phase 6 substantive shipped on staging:
- chunk 6.1 (2c85ee6): ingestion substrate + chunk-6.1 atomic RPC
  (migration 152) + ingest_batches + document_jobs substrate +
  ADR-0011 §1 amendment for ingest_items deferral
- chunk 6.2a (c6a7159): Sub-Q4 Step C/D activation + 31-caller refactor
  + source_documents.ingest_batch_id NOT NULL + _for_test suffix
  convention first-instance
- chunk 6.2b (5eb1fc5): drag-drop end-to-end (ingestionService.handleDragDropUpload
  + /api/orgs/[orgId]/documents/ingest/drag-drop route + DocumentIntakeRail
  + document_cards_view + Flag 16 forecast-recalibration origin)
- chunk 6.3a (c612720): forwarded_mailbox ingestion (Postmark inbound
  webhook + internal_sender_allowlist + SystemActorServiceContext sister
  type + cards-UI mount-fetch); 22 F-J codification candidates at chunk
  close
- chunk 6.3b (Commits A/B/C above): retrospective consolidation —
  ADR-0011 fourth amendment (entry 18 atomic-extension-via-JSONB-array)
  + CLAUDE.md 8 codifications + retrospective writeup with cross-phase
  consumer-application of Phase 4 codifications centerpiece + parallel
  arc on scale-invariant disciplines at retrospective grain

Path C invocation per chunk-3-Phase-4 precedent at novel grain
(implementation-vs-retrospective split at chunk-6.3 sequencing).
N=2 observation-grain Path C with novel grain at instance #2.

Validation gates green at staging HEAD pre-merge:
  pnpm test           1114/1114
  pnpm agent:validate 26/26
  pnpm typecheck      green

Phase 7 (Tier 2 pipeline) substantive scope-lock fires next per Phase 5
retrospective §6:380-381 sequencing. Phase 5.1 amendments interleave per
Phase 2 retrospective §6:588 parallel-candidate framing. Drag-drop
scope-lock cycle (post-Phase-6-close) reads a9f1071 scope-input
artifact as session-onset substrate.

Full retrospective at docs/07_governance/retrospectives/phase-6-retrospective.md.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

Expected: Merge commit created with the explicit message; no merge conflicts (staging is strict descendant of main; --no-ff forces explicit merge commit).

If conflicts surface: STOP. Investigate state drift; resolve conflicts manually; re-run.

- [ ] **Step 3: Push merge to origin/main**

Run:
```bash
git push origin main
git rev-parse origin/main
```

Expected: Push succeeds; `origin/main` HEAD = local main HEAD (the new merge commit hash).

If push rejected by branch protection rules: surface to founder. May need PR-flow merge instead of direct push. Hold at Step 3 + surface options.

- [ ] **Step 4: Run post-merge state ratification checklist**

Run:
```bash
git rev-parse origin/main
git rev-parse origin/staging
git log origin/main..origin/staging --oneline | wc -l
git log origin/main --merges --oneline | head -3
```

Expected:
- `origin/main` HEAD = new merge commit hash (different from `origin/staging` HEAD; the merge commit sits on top)
- `origin/staging` HEAD unchanged (still at Commit C state)
- `git log origin/main..origin/staging` shows 0 commits (main now contains all staging commits via merge)
- Most recent merge on `origin/main` is the chunk-6.3b merge commit; prior is `cfcf2e7 Merge branch 'staging'`

- [ ] **Step 5: Switch back to staging**

Run:
```bash
git checkout staging
git rev-parse HEAD
```

Expected: Local staging HEAD = origin/staging HEAD = Commit C hash from Task 3 Step 11.

---

## Task 6: Post-merge MEMORY.md anchor flip + drafting close observations

**Files:** None in git scope; out-of-repo memory writes only.

- [ ] **Step 1: Write Phase 6 closed anchor to MEMORY.md**

Add to `/home/philc/.claude/projects/-home-philc-projects-chounting/memory/MEMORY.md`:

```
- [Phase 6 CLOSED — Ingestion shipped 2026-05-15 at <merge_commit_hash>](project_phase_6_retrospective_shipped.md) — 5-chunk arc (6.1+6.2a+6.2b+6.3a impl + 6.3b retro) + merge-to-main per Path C lock. Phase 6 closes structurally; Phase 7 substantive scope-lock fires next.
```

Replace `<merge_commit_hash>` with the actual hash from Task 5 Step 3.

- [ ] **Step 2: Write memory topic file**

Create `/home/philc/.claude/projects/-home-philc-projects-chounting/memory/project_phase_6_retrospective_shipped.md` with frontmatter + body covering Phase 6 closure substrate per the auto-memory system's project memory shape (parallel to `project_phase_4_retrospective_shipped.md`).

- [ ] **Step 3: Log validation gate runtime observations**

Per Round 7 Sub-op 5 (b) pre-commitment: log the validation gate runtime observations captured at Tasks 0, 1, 2, 3, 4 + Tasks 1-3 per-commit gates. Compare against chunk-6.3a-close baseline (1114/1114 / 194 files; runtime baseline N=1).

If runtime materially differs from baseline: N=2 evidence at validation-gate-runtime-stability sub-grain → carry-forward observation for Phase 7 retrospective per §6.d carry-forward documentation. If runtime is stable: N=2 stable-runtime evidence → also carry-forward per §6.d.

Either outcome is N=2 evidence; logging is the discipline.

- [ ] **Step 4: Verify final state**

Run:
```bash
git rev-parse origin/main
git rev-parse origin/staging
git status --short
```

Expected:
- `origin/main` HEAD = merge commit hash
- `origin/staging` HEAD = Commit C hash (Phase 6 retrospective writeup commit)
- Working tree clean modulo `apps/web/tests/e2e/.auth/`

---

## Reserve handlers

**Reserve 1 — Path-C-equivalent at Commit C drafting boundary.** If Task 3 Step 4 (§3 centerpiece + parallel arc) or Step 7 (§6 5-sub-section structure) surfaces session-budget pressure, invoke Path-C-equivalent at §-boundary fault line:

- Stage what's drafted; commit partial; push partial
- Resume drafting in fresh session
- Engineer: read scope-lock cycle handoff at `e0824c2` + this plan + the partial Commit C state as fresh-session substrate

Re-running Step 10 + Step 11 (validation gate + commit + push) at the resumed-session-close requires the same gate discipline.

**Reserve 2 — Friction-journal entry on merge ceremony surfaces.** If Task 5 Step 2 or Step 3 surfaces unexpected merge ceremony substrate (branch protection encounters; CI/CD reconciliation; large-diff visualization issues), append a NEW F-J entry to `docs/07_governance/friction-journal.md` codifying the 243-commit-forward-merge experience. This is in-flight observation; not pre-drafted at scope-lock close.

If reserve fires: append F-J entry as separate post-merge commit on staging branch (after merge ceremony complete). Surface to founder before firing the post-merge commit.

---

## Self-Review

**Spec coverage check:**

Scope-lock cycle outputs (13 drafting carry-forward items) mapped to tasks:
- ✓ 7-section retrospective writeup structure → Task 3
- ✓ §3 two-arc body with three sub-property observations → Task 3 Step 4
- ✓ §4 codified patterns flat structure → Task 3 Step 5
- ✓ §6 5-sub-section carry-forward structure → Task 3 Step 7
- ✓ 3-commit sequencing per surface-precedence T3 > T4 > T1 → Tasks 1, 2, 3
- ✓ ADR-0011 fourth amendment text draft → Task 1 Step 2 (inline)
- ✓ 8 CLAUDE.md codification text drafts → Task 2 Steps 2-10 (inline for 4 of 8; substrate-reference for 4 of 8)
- ✓ Per-commit validation gate sequencing → Tasks 1, 2, 3 (gates per commit)
- ✓ Merge ceremony commit message draft + command sequence → Task 5 (inline)
- ✓ Pre-merge validation gate re-run → Task 4
- ✓ Post-merge state checklist + MEMORY.md anchor flip → Task 5 Step 4 + Task 6
- ✓ All Sub-Q8 walk classifications → Task 3 Step 6 (§5 inventory documentation)
- ✓ All Round 0 catches resolution → Task 3 Steps 2 + 7 (§1 arc summary + §6 carry-forwards)

Two terminal observation prose refinements:
- ✓ Observation 2 RI-10 firing-at-consolidation-pressure framing → Task 3 Step 4 (§3.b Observation 2)
- ✓ §1 arc summary 7-round convergence parenthetical → Task 3 Step 2

Two reserves documented:
- ✓ Path-C-equivalent at Commit C → Reserve handlers section
- ✓ F-J entry on merge ceremony → Reserve handlers section

**Placeholder scan:**

- ✓ No "TBD" / "TODO" / "implement later" / "fill in details"
- ✓ Code blocks present for every step with executable commands
- ✓ Commit messages drafted inline (Tasks 1, 2, 3, 5)
- ⚠ Task 3 Steps 2-8 (retrospective writeup §1-§7 prose) intentionally substrate-direction-only; the substantive prose generation IS the drafting work + would balloon the plan to ~5000+ lines if fully inlined. Acceptable trade-off: substrate references + length targets + Phase 4 retrospective shape inheritance suffice for the execution engineer.
- ⚠ Task 2 Steps 7-10 (CLAUDE.md T4-5/-6/-7/-8 codification text) drafted inline but reference chunk-6.3a F-J entries as substrate; the engineer reads the F-J substrate at execution time.

**Type consistency:**

- ✓ Commit A / B / C labels consistent across tasks
- ✓ Commit hashes referenced as `<hash>` placeholders to be filled at execution time (Tasks 3, 5, 6)
- ✓ T-cluster labels (T3 / T4 / T1) consistent
- ✓ Codification labels (T4-1 through T4-8) consistent

Three items deferred for execution-time judgment per "codify-while-deciding-at-decision-time" discipline:
1. Whether to include §1 7-round convergence as parenthetical or single sentence — engineer's prose-flow judgment
2. Whether validation gate runtime observation (Task 6 Step 3) shows N=2 stable or N=2 drift — execution-time empirical
3. Path-C-equivalent invocation timing — execution-time session-budget judgment

---

**Plan complete and saved to `docs/09_briefs/phase-6/chunks/2026-05-15-phase-6-chunk-3b-retrospective-drafting-plan.md`.**
