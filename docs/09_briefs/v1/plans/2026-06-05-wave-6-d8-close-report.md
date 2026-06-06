# Wave 6 D8 Close Report — Governance Doc-Sync Close + Wave Close

**Deliverable:** D8, the ninth and final Wave 6 deliverable. Brief +
decomposition: `2026-06-05-wave-6-d8-governance-doc-sync-wave-close-brief.md`
(§6/§9 carry the advisor rulings: D-2(a), D-3(a), D-4 as-recorded, Q-1(i)
conditioned, Q-2(a), Q-3(a), Q-4(a)).

**Posture at drafting:** 59 banked-local on `staging` at `e2dd801b`,
`origin/staging` at `e571ceb5`, session lock `wave-6-ap-review` held, no push
before Phil's terminal ceremony. *(Commits at T6 as the 62nd; HEAD
`bc5c3bd8` at draft-final.)*

## 1. Commit ledger (D8 arc)

| Commit | Surface | Read-back |
|---|---|---|
| `b9023591` | Brief (+§6 ruling, §7 completeness sweep) | cleared 2026-06-05 |
| `ef849d9c` | Decomposition (+§9 Q-rulings) | cleared 2026-06-05 |
| `47e34ad1` | T1 — the 25→28 reconcile, 15 edits (incl. the two sweep-gap catches: step-5 "Expected output: empty" + the `:349` in-block comment) | cleared 2026-06-05 (held once on the 15th edit — gate-precedence) |
| `e2dd801b` | T2 — glossary ×2 + `CLAUDE.md:14` + `authority-gradient.md:17` | cleared 2026-06-05 |
| `186e6769` | T4 — screenshot staging script (dev-only; (B)-conditions cleared; committed per the condition-4 ruling) | cleared 2026-06-06 |
| `bc5c3bd8` | T5 — wave retrospective + journal close block + TWO codifications (`*TierA` N=3; commit-shell hygiene N≥3 on ratified testimony, F-1(i)) + F-2 cross-refs | cleared 2026-06-06 (§2 ledger held once, reconciled to 60 by hand-assignment) |
| *(this file)* | T3 close-report open + diff capture + T4/T6 evidence | committed at T6 pre-push per Q-4(a) — the last content commit |

## 2. Bidirectional reachability — the D8 capture (T3)

Command (canonical, from `invariants.md` / `control_matrix.md`):

```bash
diff <(grep -oE 'INV-[A-Z]+-[0-9]{3}' docs/02_specs/ledger_truth_model.md | sort -u) \
     <(grep -rho 'INV-[A-Z]\+-[0-9]\+' apps/web/src/ supabase/migrations/ | sort -u)
```

Run live at **`e2dd801b`** (post-T1/T2, 2026-06-05):

```
1a2,4
> INV-AGENT-002
> INV-AP-001
> INV-AP-002
5d7
< INV-CHECKPOINT-001
```

Forward 29 / reverse 31 / **intersection exactly the 28 registered INV-IDs**
(16 Layer-1a + 12 Layer-2) — both directions reach all 28, including
INV-WORKFLOW-001's forward side (closed at D6 T3 `aa85390c`, confirmed still
closed). The raw output is exactly the four named exceptions and nothing
else, matching the reconciled expectation in both files (D-2(a)):
`INV-CHECKPOINT-001` (doc-side; Phase-2 Layer-1b reserved, ADR-0008),
`INV-AGENT-002` (code-side; ADR-0029 reserved), `INV-AP-001`/`INV-AP-002`
(code-side; Phase-5 registration gap, carry-forward). Pre-existence
forensics: byte-identical output re-running at the Ring 2B close
(`11633dc6`) — not Wave-6 drift. Identical output observed at `c42a402f`
(pre-edit), post-T1, and post-T2: D8's doc-only edits sit outside both grep
scopes, as predicted in the brief.

## 3. Branch protection — the D6 §6.2 record (D-4)

Empirical answer, read-only GitHub API query, 2026-06-05,
`champagne-papa/chounting`:

- **`main`** — protected; `required_pull_request_reviews` present with
  `required_approving_review_count: 0`; `enforce_admins` disabled; **no
  `required_status_checks` configured**.
- **`staging`** — not protected (404 "Branch not protected").

Consequence: **INV-WORKFLOW-001's CI teeth sit advisory on both branches** —
a red `intent-producers` run does not block merge anywhere today. The leaf's
hedged headline ("a red CI run blocks merge only where branch protection
requires the check — operator-grain") covers exactly this state; no leaf
edit required or made. Whether to require the check on `main`/`staging` is
Phil's operator-grain decision, outside D8 — recorded here as the standing
residual. (Advisor verified the record's framing; the API result itself on
backstop — not queryable from the advisor seat.)

## 4. UI-screenshot closeout (T4)

Sequence drafted 2026-06-06 from the D3 close report §3 D-6 shipped-surface
enumeration, grounded to disk (`Zone1ConsolidatedPanel.tsx:85-91` — "Review
Inbox" 📋 after "Pending Documents", before "Open Bills"/"AP Aging";
`review_inbox` directive; in-view detail via `selectedCaseId`; exception +
post-status badges; NOT_POSTABLE steering). Fresh seed verified EMPTY of
review content (`dev.sql` seeds org/membership/CoA/fiscal-periods/profiles
only) — the populated shots require an explicit staging step (fork below).

**Setup:** `pnpm db:reset:clean` → `pnpm dev` → sign in as the controller
seed user → staging step per the fork ruling.

**Capture sequence (founder's hands; per-shot verifications):**

1. **Empty inbox + nav order.** Click Billing → Review Inbox on fresh seed.
   Verify: nav reads Pending Documents → Review Inbox → Open Bills →
   AP Aging; the `review_inbox` canvas renders its empty state; no badges;
   no console errors.
2. **Populated inbox (post-staging).** Verify: ONE list carrying both
   populations — at least one exception-class case with its exception badge
   and one `needs_review` postable case with its post-status badge; badges
   visibly discriminate the two.
3. **In-view detail.** Click the postable case. Verify: detail renders
   in-view (`selectedCaseId` — no route change); proposal fields visible;
   approve control present. If staging includes a NOT_POSTABLE case:
   steering message visible on it.
4. **Approve→post outcome.** Click Approve on the postable case. Verify:
   success state; the case's post-status badge reflects committed; the
   inbox row updates without manual refresh (or after re-entering the
   view — record which).
5. *(Optional)* **Pending Approvals.** Verify the posted bill appears —
   the ledger effect operator-visible. *(Corrected at capture, 2026-06-06:
   this shot originally named Open Bills — a §4 mis-specification, not a
   product defect. `billService.post` deliberately lands the bill in
   `lifecycle_state: 'pending_approval'` (the ratified D3 two-step:
   post_bill posts the JE; approveForPayment is the subsequent operator
   action), while `apReportService.openBills` filters
   `['approved_for_payment', 'partially_paid']` — so a freshly-posted
   bill's operator-visible home is the Pending Approvals queue
   (`apReportService.pendingApprovals`), and an empty Open Bills is
   correct. Grounded by the advisor against the actual query filters at
   STOP-and-surface — the gate catching its own spec, not the product.)*

**Staging fork (needs ruling before captures):**

- **(A) Live pipeline** — drag a fixture document into Pending Documents
  intake; Modal OCR + Tier A + routing produce the case. Truest
  end-to-end; requires the deployed Modal sidecar reachable from local;
  slower and timing-dependent; cannot deterministically produce the
  exception-class + NOT_POSTABLE shots.
- **(B) Service-layer staging script — RECOMMENDED.** Adapt the D7 test's
  `seedPostable`/`seedCase` (admin inserts: vendor, ocr_runs,
  extraction_runs, document_artifacts, source doc, case + candidates +
  proposal) into a one-shot dev script staging 2–3 cases in named states
  (postable `needs_review`; exception-class; NOT_POSTABLE). Deterministic,
  zero external calls, seconds to run. The evidence trade-off is honest:
  the UI is verified against staged rows rather than pipeline-produced
  rows — acceptable because the pipeline path itself is already
  test-verified (D7 row-delta; 6.2b/D2.1 e2e + integration), and this
  gate's purpose is the UI.

**Capture record (2026-06-06).** Shots 1–4 PASSED against their per-shot
verifications (founder-captured; advisor-verdicted):

- Shot 1 — "Review Inbox · 0 cases / Nothing awaiting review"; nav order
  exact (Pending Documents → Review Inbox → Open Bills → AP Aging); no
  badges. Self-confirmed the fresh-seed premise.
- Shot 2 — "Review Inbox · 3 cases," one list; `low_confidence_
  classification` exception badge on the exception case + needs_review
  post-status badges. **Live-retired both backstop items**: the enum
  value is valid (insert didn't throw) and the open-exception join
  (`route.ts:58/109`) renders the badge — the self-checking gate held.
- Shot 3 — in-view detail (tab unchanged): proposal fields (180.00,
  2026-06-05, CAD, vendor, "Vendor match: exact_name"), Approve & Post
  control; NOT_POSTABLE steering banner on the artifact-less case.
- Shot 4 — "Posted and committed"; the committed case correctly left the
  needs_review queue (inbox → 2 cases); Pending Documents re-badged the
  postable card COMMITTED while retaining all three cards — the expected
  re-badge-not-drain behavior.

Shot 5 (corrected view) — PASSED 2026-06-06, with a bonus end-to-end
lifecycle trace beyond the gate's ask: the $180 bill `INV-SHOT-a68bbbf8`
visible in Pending Approvals at `pending_approval`; founder then exercised
approve-for-payment live — Pending Approvals drained, and Open Bills
populated with the same bill at `approved_for_payment` / amount due
180.0000. The "Open Bills: No data" observation is thereby demonstrated
(not just code-grounded): Open Bills populates the instant a bill reaches
`approved_for_payment`, per the `loadBillsWithAmountDue` filter. The
two-step D3 lifecycle is empirically traced.

**GATE PASSED** — shots 1–4 passed, shot 5 corrected-and-passed, zero
product-code changes (the two §4 edits document the gate correcting its
own spec). Captures are the founder's, retained with the session record;
the staged data is wiped by T6's clean-reset `test:full` and carries no
downstream cost.

## 5. Carry-forwards assembled by D8 (feed the T5 retro enumeration)

1. **INV-AP-001/002 severity question** — enforced-but-unregistered vs
   cosmetic (pre-existing, hygiene-arc C2 provenance; surfaced again by the
   D8 reachability work).
2. **Push-readiness gate escape-clause generalization** (pinned at the T2
   read-back): Condition 2's "flagged exceptions documented **as Phase 2
   stubs**" predates the registration-gap exception class — AP-001/002 is
   documented but not that shape. T6 confirms Condition 2 **met-in-intent**
   (four documented, non-silent exceptions); the clause generalization to
   "documented, non-silent exceptions" touches CLAUDE.md §gate + the
   glossary Condition-2 entry (gate-definition surfaces) — a standing-rule
   change for the retro/follow-up, not a D8 count edit.
3. **Completeness-sweep shape lesson** (T1 read-back catch, advisor-named
   retro candidate): sweeps keyed only on canonical token shapes missed two
   bare-phrasing instances ("Expected output: empty"; "# … (must be
   empty)"); completeness came from the broadened grep and the line-by-line
   pass converging. Candidate: completeness sweeps must include
   bare-phrasing shapes. N-trail per friction-journal at T5.
4. **"Discipline backstops" intro says "Two database-level enforcement
   sites" but lists three rows** (both files; `reportService.trialBalance()`
   added later) — pre-existing, out of D8's count-reconcile scope
   (advisor-classified at the T1 read-back).
5. Wave-deliverable carry-forwards enumerated in the brief §1.6 (D1–D7) —
   the retro's §carry-forward section owns the full list.

## 6. Close ceremony record (T6)

Strict order per the decomposition + Q-1(i) conditions: this close-report
commit (last content commit) → push-readiness evidence at final HEAD
(`agent:validate` 26/26 · `test:full` from clean reset, which also wipes
the staged screenshot rows · `typecheck` · ahead-count · clean status
modulo the five pre-existing untracked paths) → advisor confirms the
three-condition gate green from disk (the advisor seat's last pre-push
act) → **Phil's terminal push** → post-push `intent-producers`
first-dynamic-execution confirmation (`gh run` evidence; D6 §6.1)
recorded below via the bounded doc-only addendum, advisor-verified, then
Phil's coda push (the regress terminates at the coda — its own green CI
needs no recursive recording) → **lock release last**
(`scripts/session-end.sh` + `unset COORD_SESSION` — mechanism verified
from disk at T6 onset).

**Three-condition gate status at this commit:**

- **Condition 3 (governance closeout): MET** at `bc5c3bd8` —
  retrospective written (`v1-wave-6-retrospective.md`), friction-journal
  wave-close block landed, two codifications shipped with provenance
  (`*TierA` → `conventions/testing.md`; commit-shell hygiene →
  `conventions/code.md`, N≥3 on ratified testimony per F-1(i)).
- **Condition 2 (doc-sync reconciled): MET-IN-INTENT** — the 25→28
  reconcile across all six live snapshot sites (T1 `47e34ad1` + T2
  `e2dd801b`); reachability verified at the registered-set grain with
  the four exceptions named, classified, documented — none silent. The
  gate's escape-clause wording ("documented as Phase 2 stubs") predates
  the registration-gap exception class; the clause generalization is the
  named standing-rule carry-forward (§5.2). No schema delta this
  deliverable ⇒ `types.ts` current by construction.
- **Condition 1 (test-suite health): evidence runs at final HEAD** —
  immediately after this commit; results surfaced live at the ceremony
  and confirmed by the advisor from disk before the push.

**Post-push addendum slot (Q-1(i)):** `intent-producers` run result +
`gh run` evidence land here after Phil's terminal push.
