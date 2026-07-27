# Charter B PROVEN-LIVE — retrospective

**Arc:** the live-transfer discharge of Charter B real-flow carry-forward #2.
**Closed:** 2026-07-27. **Main tip:** `2b327dcc` (PR #14 merged).
**Status:** carry-forward #2 **DISCHARGED** — `sharepoint_drive` is PROVEN LIVE.

Predecessors: `docs/07_governance/retrospectives/charter-b-real-flow-retrospective.md`
(the arc that filed carry-forward #2) and friction-journal 2026-06-08
"Charter B PROVEN-LIVE: harness body landed — READY, not PROVEN-LIVE" (`42fa8277`),
which landed the gated harness body and explicitly declined to claim a run.

## 1. The discharge

The clean re-fire is the citable evidence:

- **Scoped run**, verified before trusting: `Test Files 1 passed (1)`,
  `Tests 2 passed (2)`, 7.62s.
- **Dedicated throwaway org** `7306eb1e-d756-4111-810b-ce1d0ab3c2f4` — not a seed
  org — pointed at the CHOUnting library, and reverted to `supabase_storage`
  immediately after.
- **Both size paths exercised.** `charter-b-proven-live.pdf` at 58 B (`uploadSmall`)
  and `charter-b-large.pdf` at 4,194,305 B — exactly `4*1024*1024+1`, so
  `uploadLarge` genuinely ran rather than the small path covering for it.
- **Byte-faithful, not shape-faithful.** Both rows read `storage_status='available'`
  (so `put`'s download-re-read self-verify passed), and on top of that each test's
  own `computeHash(fetched.result.bytes) === created.content_hash` held — the
  recompute through the `byteFetch` dispatch-on-row seam, not the row's stored hash,
  which would false-green on corrupted bytes.
- **Cleanup succeeded.** No `log.error` surfaced, and the later presence pass
  confirmed both items gone from the library.

**Now proven live, first-hand:** app-only `Sites.Selected` certificate auth against
a real tenant; `uploadSmall` (`PUT …:/content`); `uploadLarge` addressing the **org**
drive via `uploadSessionURL` rather than the SDK's `/me/drive` default (`be0e3de5`);
`downloadBytes`; and `delete`. The two `graphIo` fixes — drive-addressing and
per-segment `encodeURIComponent` (`c2dfa1d1`) — are no longer unit-proven-only.

## 2. It came on the second attempt

The first firing used the runbook's documented command,
`pnpm test:integration <path>`, which does not scope: the script carries its own
`tests/integration` glob and the positional path is OR'd with it. The full 244-file
integration suite ran. Because the org pointed at `sharepoint_drive` was
`SEED.ORG_HOLDING` — shared by the whole suite — every document-creating test routed
through live Graph and **114 real files were written into a customer SharePoint
library.**

Remediation turned out to be nil. A presence pass over all 114 candidate driveItem
ids returned 404 on every one: the suite's own teardown deleted them on the way out,
because those tests' `delete` calls routed to Graph alongside their writes. **N = 0
of 114 still present.**

**That is luck of the pipeline's teardown, not a mitigation anyone designed.** Had
those tests lacked teardown, 114 orphans would have needed a hand sweep against a
customer library. The spill was real; the cleanup requirement was zero; the second
fact does not soften the first, and N=0 must not round the incident down to
"no harm done." What the record should say is "we got lucky on the cleanup," not
"the system was safe."

Two collateral test failures (`documentPlatformServiceIntegration`,
`storageProviderIntegration`, 7 tests) were not defects — they assert Supabase
signed-URL semantics and were handed SharePoint driveItem ids. They cleared on the
org revert.

## 3. Root cause — two layers

**Proximate:** the run was fired with two checkable facts unverified — that
`pnpm test:integration <path>` ORs rather than narrows, and that `11111111-…` is
the shared seed org rather than a throwaway. Both were seconds from being checked.

**Systemic, and the more important finding:** `conventions/testing.md` had
recommended the broken form as a "path-narrowed variant" for two months, contradicted
by `docs/09_briefs/phase-8/2026-05-24-needs-fixture-closeout.md` §"What we learned"
(2026-05-24), which documented the OR-not-AND mechanism after it silently widened a
**paid** Modal e2e run. The closeout never propagated to the canonical surface. Five
other surfaces carried the same command shape.

A wrong convention in an authority doc reproduces the error indefinitely regardless
of individual care. Codification routing is what converts a finding into a defense,
and here it did not fire. Full treatment: friction-journal 2026-07-27 "A wrong
convention in an authority doc reproduces the error indefinitely."

## 4. The corrections

- **`f1d687fc`** (merged to `main` at `2b327dcc`, PR #14) — four surfaces:
  `conventions/testing.md` (both instances + a new mechanism section),
  runbook step 5 (verified command, the trap named with its measurement, a
  `vitest list --filesOnly` pre-check, the `Test Files 1 passed (1)` gate),
  runbook step 4 (dedicated throwaway org with the blast-radius reason, the
  four-statement provisioning, `UPDATE` not `INSERT` because
  `organizations_create_org_settings` auto-creates the row, table-wide
  join-verified check, `db:reset` lifecycle, revert-when-done), and the harness
  header. This had to reach `main`: the broken command was live there and billed
  full-suite runs to people other than its author.
- **`acbb99ab`** (same PR #14, also merged to `main` at `2b327dcc`) — the pre-run
  gate: both DB pointers must resolve local. The code
  under test writes via `NEXT_PUBLIC_SUPABASE_URL` (`@/db/adminClient` →
  `env.SUPABASE_URL`), while the harness's own reads resolve
  `SUPABASE_TEST_URL ?? SUPABASE_URL`. If the two diverge, the config-sanity guard
  asserts against one database while writes land in another.

The runbook edits teach **verification, not assertion** — the failure mode is a
command that *looks* scoped, so the doc instructs checking the file count, not just
the pass count.

## 5. The thread — narrow-vs-broad

Three appearances in one session of proving a narrow claim and treating it as the
broad one:

| Narrow claim proved | Broad claim assumed |
|---|---|
| the four-way `skipIf` predicate will fire | the run is safe |
| `test:full` printed a pass | the suite executed |
| 114 candidate ids | 114 deletions needed |

The third is the one that went right, and only because the "candidate list, not
deletion list" framing was insisted on: treating the TSV as a deletion list would
have fired 114 deletes at an already-empty library.

## 6. Carry-forwards

1. **FLAGGED LIVE-MONEY HAZARD** — three gated Modal e2e headers still document the
   broken command (`documentPipeline.receipt.e2e.test.ts:16`,
   `…paymentConfirmation.e2e.test.ts:17`, `…vendorInvoice.e2e.test.ts:22`) plus
   `charter-b-proven-live-plan.md:71`. Following them bills an unintended full-suite
   run. Own reviewed pass per ratified-contract-scope; tracked as an active hazard.
2. **`pnpm test:full` turbo-cache staleness** — Condition-1 evidence is silently
   stale on a cache hit. Friction-journal 2026-07-27, own entry. N=1, not codified.
3. **UI dry-run readiness** — queued. Grounded deltas from the harness org: it needs
   a chart of accounts and an open fiscal period (a proposal card has nothing to
   propose against without them), and the ingest path has **two** live external
   surfaces (Modal OCR sidecar + model API), so it is dual live-money, not
   SharePoint-plus-a-config-check. **Overlap with carry-forward 1 — CONFIRMED, not
   suspected:** all three flagged Modal e2e files import `ingestPipelineHarness.ts`,
   which imports `ingestDocument` from
   `@/agent/orchestrator/extraction/ingestDocument`; the UI drag-drop route
   (`app/api/orgs/[orgId]/documents/ingest/drag-drop/route.ts:57,126`) calls the
   same `ingestDocument`. Same surface — so that hazard and this dry-run are **one
   investigation**, not two. (The `documentPipeline` name is the e2e filenames', not
   the module's.) This was one grep away and was initially left conditional; in a
   retrospective whose lesson is that two checkable facts sat one command from being
   checked, resolving it was the only consistent move.
4. **`CURRENT_STATE.md` §Charter B real-flow — stale claims, marked superseded
   rather than left standing.** An independent review of this close found the
   discharge had made three statements in that chapter false: the "throws until
   implemented" line (`:460-461`, already untrue since `77e4b520`), "no live
   SharePoint Graph transfer has occurred" (`:459`), and — the sharp one — a
   **bolded normative directive** instructing readers that the status "must carry
   … live transfer gated — it is not yet live" (`:472-473`), which after the
   discharge instructed the opposite of the truth. The first two now carry a dated
   SUPERSEDED marker; the directive is struck through and retired in place.
   Provenance preserved, not rewritten. The section header (`:454`) still reads
   "CLOSED (UNIT-PROVEN, live transfer gated)" and is left as a dated chapter
   heading. **Lesson in miniature:** flipping a status creates contradictions
   upstream of the flip, and the edit that creates them owns them — the original
   draft of this carry-forward named only one of the three.

## 7. Lane and accountability

The arc ran advisor + executor. Both halves are named plainly rather than smoothed.

The advisor gave "fire it" in its own voice with the two facts above unverified,
having spent the session insisting on grounding broad claims — the discipline was in
hand and not applied at the moment it was least convenient. The executor had the
shell; both facts were one command away from being checked, and treating "the gate
opens" as equivalent to "the command is scoped" is what turned an endorsement into a
spill. Neither is collateral of the other.

Verification provenance, kept distinct: `graphIo`'s transfer code, the harness gate,
and the two DB-pointer files were advisor-grounded first-hand; the commit/reachability
facts, schema reads, scoping measurements, and the presence pass were executor-grounded.
The per-site Graph grant was operator-grounded and taken as reported.

The discharge is real and the runbook is materially harder to fall into now. It got
there the hard way, and a retrospective that read as triumphant would be the least
useful version of it.
