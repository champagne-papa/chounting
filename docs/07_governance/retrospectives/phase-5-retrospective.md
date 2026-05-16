# Phase 5 Closeout Retrospective — Spend Initiative

Written: 2026-05-12, immediately after arc-closure prep
(PendingApprovalsView + PaymentApprovalCard substrate-correction)
shipped at HEAD `3f8d165`.

Audience: future-me starting Phase 2 (Document Core), the Phase 2
brief author, any future collaborator inheriting this codebase.

---

## 1. What Phase 5 actually built

The Bridge can post AP bills, approve them for payment, record
payments against them, reverse them at any of the four reversable
lifecycle states, and report on the resulting bill population
through five canonical read views plus two operational entry-path
views. Bill mutations write balanced journal entries through
`journalEntryService.post` exactly the way Phase 1.1's manual
journal entries do, and audit rows are emitted at bill grain with
`before_state` capture per ADR-0009. Reversal produces a mirrored
JE per INV-REVERSAL-001 / INV-REVERSAL-002. All four bill
lifecycle entry points (pending_approval, approved_for_payment,
partially_paid, fully_paid) have UI surfaces from which the user
can approve or reverse.

Concretely, Phase 5 shipped:

- **Substrate**: `bills`, `bill_lines`, `payments`,
  `bill_payment_allocations`, `vendor_prepayments`,
  `vendor_prepayment_applications`, `vendors`, `vendor_rules`
  tables; the seven-state `bill_lifecycle_state` enum; the
  `payment_purpose` and `payment_state` enums with the
  reserved-value discipline from ADR-0010.
- **Service layer**: `billService` (post / approveForPayment /
  recordPayment / reverse), `vendorService.listVendors`,
  `vendorPrepaymentService` (record / apply / refund — substrate
  only, no routes yet), `apReportService` (aging, openBills,
  paymentApprovalQueue, paidBillsHistory, activePayments,
  pendingApprovals, billDetail), `vendorReportService.balance`.
- **Routes**: POST routes for the four bill mutations; GET
  routes for the seven AP read surfaces and the per-bill detail
  endpoint.
- **Permissions**: four new `bill.*` ActionNames + permissions
  catalog rows + role grants (controller for all four;
  ap_specialist for `bill.post` and `bill.record_payment`
  only).
- **UI surfaces**: ManualBillForm, PaymentApprovalCard,
  RecordPaymentCard, BillReverseCard, PaymentApprovalQueueView,
  ActivePaymentsView, PaidBillsHistoryView, PendingApprovalsView,
  ApAgingView, OpenBillsView, VendorBalanceView. MainframeRail
  entries for each canvas view.

Test count at HEAD: **871/871** vitest passing, 26/26
agent:validate floor green. E2E specs for the new write-side
surfaces (billForm, recordPaymentCard, billReverseCard,
pendingApprovalsView) pass against a fresh `pnpm db:reset:clean`.

Phase 5 closes against the §2 "Locked v1 scope" of the Spend
brief. The §3 + §10 additions from the 2026-05-02 reframe
(vendor prepayments full surface, vendor credits, vendor
onboarding) are explicitly deferred to post-v1 — see §6 below.

## 2. The 9-chunk arc

Phase 5 ran 9 substantive chunks across roughly 5 calendar days
(2026-05-07 through 2026-05-12): B5-1 (vendor_prepayments
substrate), B5-2 (bill lifecycle substrate), B5-3-D1 through
B5-3-D6 (the AP write-side and read-side chunks), and the
arc-closure prep chunk that shipped PendingApprovalsView plus
the PaymentApprovalCard substrate-correction. The chunks were
not pre-planned as a 9-chunk sequence — D5 and D6 emerged when
the substrate-correction backlog forced their existence, and
the arc-closure prep chunk emerged when the prior turn's
sequencing conversation surfaced that pending_approval was the
last unwired lifecycle state.

The pivotal moments were not the chunks themselves but two
substrate-corrections that happened mid-arc:

- **The partially-paid disappearance bug → ActivePaymentsView.**
  The PaymentApprovalQueueView filters to `approved_for_payment`
  only, so `partially_paid` bills disappeared from the
  operator's view after their first payment. ActivePaymentsView
  shipped as the additive substrate-correction: a separate
  view for partially_paid bills. B5-3-D5 substrate. (Friction
  journal logs this as catch #57 if you need to find the
  original entry.)
- **The queue-endpoint-as-bill-lookup bug → per-bill
  bill-detail endpoint.** RecordPaymentCard was fetching the
  payment-approval-queue endpoint and client-side filtering to
  the bill it was supposed to render. When ActivePaymentsView's
  row-click sent it a partially_paid bill, the queue endpoint
  returned nothing for that bill (the queue filter excluded it)
  and the card errored "Bill not found." The fix was a new
  per-bill endpoint `GET /api/orgs/[orgId]/bills/[billId]` that
  returns bill detail regardless of lifecycle_state. B5-3-D5
  substrate. (Friction journal logs this as catch #69.)

These were the same bug shape twice. The third instance —
PaymentApprovalCard, which had the identical queue-post-filter
pattern — was caught at the arc-closure prep chunk by a
disk-grep audit at chunk-onset and fixed in the same commit.
The grep also confirmed there was no fourth instance. The
pattern was real but bounded.

The second pivotal moment was meta: at the close of B5-3-D5,
the founder named directly that the orchestration apparatus
(catch ledgers, sub-mechanism taxonomies, cumulative-N tallies,
two-LLM convergence rituals, cadence labels) might be doing
less substantive work than the dense vocabulary suggested. We
landed on four disciplines to keep — verify-from-disk before
citing, friction-journal as future-you note, chunk-bundling
commits, UX-flow screenshot gate — and let the rest fall away.
B5-3-D6 and the arc-closure prep chunk ran under the stripped-
down regime: single Claude, normal engineering brief, plain
English in the friction journal at the end. Both shipped clean.
See §5 for the process-calibration read on that change.

## 3. Patterns that emerged during the work

Seven lessons are load-bearing enough to carry forward. They
are listed plainly because that's the form they earn — none of
them need a numbered classification or a cumulative-fire-count
to be useful.

### Verify-from-disk before citing

The most load-bearing single discipline of the arc. Multiple
times across the arc, somebody cited a file path, line number,
schema column, role name, or function signature from memory
and was wrong. The fix every time was "go read the file." This
generalizes: precision where it's load-bearing, prose where it
isn't. The implementer types the precise things — file paths,
function signatures, schema columns. They just need to
understand the framing. Plan docs that worked were precise
about citations and prose about framing; plan docs that
performed precision in the framing (or vagueness in the
citations) produced worse output.

This was the discipline that caught catch #69 (the founder's
UX walkthrough was verify-from-running-system), caught the
PaymentApprovalCard bug at the arc-closure prep chunk (disk
grep at chunk-onset), and caught the Phase 1 chunk-completion
uncertainty in the arc-closure conversation (disk verification
showed all 6 chunks shipped, contradicting an in-memory belief
that "Phase 1 isn't done").

### Manual-first works

Phase 5 shipped AP foundation as manual entry and manual
reporting, with no ingestion (Phase 6), no extraction (Phase 7),
no proposal handoff (Phase 8). That was enough to put real
users on the system. The reframe argument that "you can't ship
anything until the substrate is perfect" would have meant zero
users for months longer while Document Platform Phases 2-4
shipped. Shipping manual-only is the right move when substrate
isn't ready and users need to start using the thing.

The cost of manual-first is real: the controller types every
bill by hand instead of dropping a PDF. The reframe will
amortize that cost over Phases 6-8. But the value of having
users on the system *now* — using it, hitting its rough edges,
producing real lessons — outweighed the cost of typing.

### Phase-done means end-to-end-walkable, not substrate-merged

`vendorPrepaymentService` has three methods on disk
(`record` / `apply` / `refund`) with Zod schemas and audit
plumbing. There are no route handlers. There are no UI
surfaces. A user cannot record a vendor prepayment through any
path. This was not noticed until the arc-closure conversation
surfaced the prepayment surface-map archaeology. The substrate
work happened, the service work happened, and then the surface
work didn't happen and nobody flagged it as a gap.

The discipline already exists — the UX-flow screenshot gate
walks every surface end-to-end before declaring a chunk done.
It just wasn't applied to the question "is this phase done?"
The lesson is to apply the existing discipline to the bigger
question: phase-done means end-to-end-walkable, not
substrate-merged. Walk every surface in scope as a user before
calling the phase finished.

### Data-source filter semantics is its own failure mode

Three instances of the same bug shape in Phase 5: a per-entity
card reusing a queue endpoint with post-filter semantics that
don't match the per-entity use case. The fix shape was
consistent: per-entity (per-bill) endpoint, lifecycle-state-
agnostic. Catch #57 was the first instance, #69 the second,
PaymentApprovalCard the third. The disk-grep audit at the
arc-closure prep chunk bounded the pattern at three consumers —
no fourth instance exists in the codebase.

When reusing a data source across consumers, check that the
source's filter semantics match every consumer's use case. The
substrate-corrective pattern (a separate per-entity endpoint
that doesn't filter) is the canonical fix. This will come back
the next time a per-entity card gets wired to a queue-shaped
data source, in any domain.

### The apparatus grows on its own

Catch numbers, sub-mechanism class taxonomies, graduation
watches, codification candidates, cadence labels — the
vocabulary multiplied across the arc without anyone explicitly
deciding it should. Some of it was useful as scaffolding in the
first few chunks, when nobody had a mental model of the work
yet. By the 5th chunk, the names were noise. The failure was
not pruning when it stopped earning. Actively prune the
apparatus on each new arc rather than carrying it forward.

This is the most consequential lesson of the arc. The
artifacts the apparatus produced (the friction journal across
Phase 5, the brief itself, the per-chunk retrospective entries)
have real value independent of the meta-bookkeeping around them.
The artifacts earned their keep; the ceremony around producing
them did not. "Drop the apparatus" doesn't mean "stop writing
things down" — it means "write the things down without the
ritual."

### Founder-ratification cycles for converged decisions are friction

"Standing by for founder ratification" cycles where both sides
had already converged and nothing new could happen until the
founder pressed a button — that pattern was honest about the
decision boundary but it created stop-and-wait moments. For
most substrate decisions, both sides converging is sufficient
signal that the decision is settled. Explicit ratification is
overhead unless there's actual disagreement to resolve.

### Playwright fixtures can't import server modules

Narrow and specific. `assertEnv` runs at module load time and
the Playwright test runner doesn't have the production env-
cascade Next loads for the webServer (`ANTHROPIC_API_KEY`,
`UPSTASH_REDIS_*`, etc.). Importing `billService` (or anything
in its transitive dependency chain) into a Playwright fixture
will trip the env-cascade and fail at test discovery, before
any test runs. The workaround is admin-client seeding only
inside Playwright fixtures: stand up rows directly via
`@supabase/supabase-js`, don't reach for the service layer.
Future Claudes will hit this; logging it once means they
don't have to discover it twice.

## 4. Architectural decisions and their rationale

**The per-bill endpoint pattern.** Per-entity cards
(RecordPaymentCard, BillReverseCard, PaymentApprovalCard) all
need lifecycle-state-agnostic bill data. The first instinct is
to reuse an existing read-side endpoint. That's the wrong
instinct because every existing read-side endpoint filters by
lifecycle state for its own valid use case (the queue filters
approved_for_payment because that's what the approve action
needs; ActivePaymentsView filters partially_paid because that's
what the partial-payment-followup needs). The right instinct
is a per-bill endpoint that returns the bill regardless of
state, and let each card render the state-specific UX on top.
This is the substrate-corrective pattern bounded by the
disk-grep audit at the arc-closure prep chunk.

**Pattern B service architecture (unwrapped).** The Spend
brief specified Pattern B per the service-architecture skill:
service methods are plain unwrapped functions; route handlers
wrap each method at the call site via `withInvariants(action:
'<verb>')`. This held across all four bill mutations and made
the test setup substantially cleaner — route integration tests
mock `buildServiceContext` and the route handler imports the
real service, exercising the same call chain a real request
would. Pattern A (service-wrapped) would have required mocking
`withInvariants` directly to test routes, which is awkward.
Pattern B's slight verbosity (every route repeats the wrap)
was worth the test ergonomics.

**vendor_id over vendor_name in read surfaces.** All seven AP
read surfaces display `vendor_id` as a `font-mono text-xs`
UUID. The Spend brief was silent on vendor display; the
default was vendor_id for consistency with the bill_id /
journal_entry_id rendering pattern from Phase 1.1. The
arc-closure conversation surfaced the option to break this
pattern at the PendingApprovalsView and add vendor_name. We
decided no — humanizing vendor display is its own arc, affects
every view, probably wants a shared formatter and possibly
vendor caching. Doing it once at the new view would have made
this view the pattern-breaker that future-me has to clean up.

**days_pending = today − created_at, not today − issue_date.**
The Spend brief didn't specify either. issue_date is the date
on the bill (which can be backdated or future-dated by the
vendor); created_at is when the bill was entered into the
system. days_pending should measure operational queue duration,
which is created_at. The schema description carries this note.

**Reverse from pending_approval allowed at the service layer
even though no UI existed until arc-closure prep.** The
4-state precondition in `billService.reverse` was specified
that way from the start. It would have been simpler to
restrict reverse to approved_for_payment / partially_paid /
fully_paid in v1 and add pending_approval later when the UI
existed. The decision to keep the broader precondition meant
the route was ready when the UI surfaced; it also meant the
integration test exercised pending_approval reverse from the
start, which caught one schema issue (audit `before_state`
shape verification at pending_approval state) before the UI
existed.

## 5. Process calibration data

**Chunk shape and commit discipline.** Every Phase 5 chunk
bundled into a single substantive commit: substrate +
service + routes + UI + tests + friction-journal paragraph.
The discipline was earned the hard way in Phase 1.1 (the Task
16 14-files-uncommitted incident); it held cleanly through
Phase 5. The substantive commits average ~900-1400 lines
each, which is at the high end of comfortable bundle size
but still reviewable as a single diff. The bundled-commit
pattern is the right default for chunks of this shape.

**Validation gate sequence.** The reliable order across all
Phase 5 chunks: `pnpm typecheck` first (cheapest, catches
most schema/import drift); `pnpm agent:validate` second (26/26
floor — catches integration regressions cheaply); `pnpm test`
third (full vitest, ~2 minutes); E2E spec for the new surface
last (informational, not in chunk-close gate per the Spend
brief). Running them in this order surfaces the cheap failures
first and saves the expensive runs for when the cheap signals
are clean.

**Apparatus-then-stripped-regime transition.** B5-3-D5 closed
under the apparatus regime: catch numbers, sub-mechanism class
labels, cumulative-N tracking, ratification cycles. B5-3-D6
and the arc-closure prep chunk ran under the stripped-down
regime: single Claude, normal engineering brief, plain English
in the friction journal at the end. Both shipped clean — 871/
871 tests, single bundled commits, UX walkthrough passed.

Did anything ship broken that the apparatus would have caught?
No. The bugs that surfaced across Phase 5 (catches #57, #69,
PaymentApprovalCard) were caught by verify-from-disk discipline
(UX walkthrough, disk-grep audit at chunk-onset) — not by
catch-ledger bookkeeping or two-LLM convergence rituals. The
apparatus retrospectively *logged* these catches but didn't
*cause* them to be caught.

Did I miss the apparatus? Briefly, at chunk-start. There was a
small impulse to wait for explicit "go" before proceeding, to
label the cadence, to record "session #1 of N." Suppressing
the impulse didn't make the work worse. By the validation
gate, I'd forgotten it was missing.

The most precise read on the apparatus question is not "it
never worked" but "**it overstayed**." It earned its keep as
scaffolding in early chunks when the work was unfamiliar; it
became cargo as the work became familiar; the failure was not
pruning when it stopped earning.

**UX walkthrough as the truth source.** The founder's
screenshot gate / UX walkthrough caught catch #69 (the actual
bug from B5-3-D5) when the test suite passed. Type checks,
integration tests, and E2E specs all green; the running flow
failed because the queue endpoint's filter semantics didn't
match RecordPaymentCard's use case. No automated check at any
layer would have caught this — the bug was in the composition
of correctly-typed parts. The UX walkthrough is the final
safety net that the rest of the validation gate is not.

**Session length and the "did I just narrate?" check.** Most
Phase 5 chunks ran in single working sessions of 2-4 hours.
The "stop" signal was not fatigue but the impulse to narrate
in the friction journal. When the friction-journal paragraph
started reading like a summary of what I did rather than a
specific surprise that future-me would want to know about,
that was the signal that I was producing apparatus rather
than information. The corrective was to either find the
specific surprise or write a shorter paragraph.

## 6. What Phase 2 (Document Core) needs that Phase 5 didn't provide

The sequencing is settled: **Phase 5 closes → Phase 2 →
Phase 3 → Phase 4 → Phase 6 → Phase 7 → Phase 8**. Canonical
per the reframe spec §2. Phase 1 (Storage / Evidence Core)
verified shipped: all six chunks from the migration header
map cleanly to disk artifacts.

Phase 2 (Document Core) needs to ship `document_cases`,
`document_case_sources`, and `document_artifacts` tables plus
the service layer that consumes them. Phase 6 (Ingestion)
will not be coherent without Phase 2 substrate because it
needs a place to land the documents it ingests.

Three things from Phase 5 that affect Phase 2 onset:

- **The Spend brief's §2-vs-§10 inconsistency.** §2 "Locked v1
  scope" doesn't include prepayments / credits / vendor
  onboarding; §10 "Phase sequencing" lists them in the Phase 5
  shipping list. The 2026-05-02 reframe added them via §3 but
  §2 was never updated. Phase 5 shipped against §2. The Phase
  2 brief author should know that "shipped against §2" is the
  operational truth, and that prepayments / credits / vendor
  onboarding are deferred to post-v1 — see "reserved schema
  seats" framing below.

- **The "reserved schema seats" framing for prepayments and
  credits.** `vendor_prepayments`, `vendor_prepayment_applications`,
  `vendor_credits`, `vendor_credit_applications` tables exist
  in the schema; `vendorPrepaymentService` has three of four
  methods. None of them are user-reachable through any UI.
  This is intentionally deferred — the founder and two real
  users haven't hit operational need for prepayments or
  credits in Phase 5's shakedown. If they hit need later,
  these become a B5-4 follow-on chunk; otherwise they remain
  reserved-seat substrate for whenever the operational signal
  arrives.

- **Substrate-correction backlog from the data-source filter
  semantics pattern.** Three instances bounded; no fourth in
  the current codebase. But Phase 6 will introduce new
  per-document cards that consume document-platform read
  endpoints, and the same shape will resurface there if the
  read endpoints are queue-shaped. Phase 2's read-endpoint
  design should default to lifecycle-state-agnostic
  per-entity endpoints from the start, not queue endpoints
  with post-filter semantics.

The Phase 2 brief author should also know: the Spend domain is
now a real consumer of Document Platform substrate. When Phase
2 ships `document_cases`, the Spend domain will eventually
consume them to attach source documents (PDFs, receipts) to
bills. The Spend-domain Pattern B service architecture and
the per-bill endpoint pattern should be the templates the
Document Platform's domain-facing surfaces match.

## 7. What I would do differently

1. **Prune the apparatus earlier — by the 3rd or 4th chunk,
   not by chunk 7.** B5-3-D6's stripped-down regime is the
   shape Phase 5 should have run under from the start, or at
   least from B5-3-D1. The cost of the apparatus was real
   (cycle time spent on cadence labels, ratification waits,
   cumulative-N tallies) and the value diminished fast once
   the work was familiar. Phase 2 should run under the
   stripped-down regime from chunk 1 unless something
   surfaces that genuinely needs more structure.

2. **Disk-grep audit at chunk-onset when a chunk's framing
   is "fix this kind of thing."** This worked at the
   arc-closure prep chunk for the PaymentApprovalCard
   substrate-correction. The grep audited the codebase for
   other instances of the queue-find-by-id pattern and
   confirmed there was no fourth. It's verify-from-disk
   extended one step: when fixing a bug class, verify the
   class is bounded before closing the chunk. Worth doing
   every time a chunk's framing is at the class grain, not
   just the instance grain.

3. **Apply the UX-walkthrough discipline to phase-completion,
   not just chunk-completion.** The prepayments-substrate-
   without-UI gap was invisible to chunk-completion gates
   because no chunk closeout said "did we walk the prepayment
   surface end-to-end as a user?" When declaring Phase 5
   done, the right question would have been "is every surface
   in the brief end-to-end-walkable for the two real users?"
   That question would have surfaced the gap earlier.

4. **Treat the Spend brief's §2-vs-§10 inconsistency as the
   first thing to resolve in any future arc that consumes a
   brief.** The inconsistency persisted across the entire
   arc and only surfaced in the arc-closure conversation. A
   chunk-zero pass that reconciled the inconsistency
   (or filed it as an explicit open question) would have
   saved confusion in every subsequent chunk about what was
   in scope.

5. **Run the bundled-commit pattern from chunk 1.** It held
   cleanly through Phase 5 and is the right default. No
   reason to revisit.

## 8. What I would keep exactly the same

**The four disciplines kept from the meta-conversation.**
Verify-from-disk before citing; friction-journal as future-you
note; chunk-bundling commits; UX-flow screenshot gate. These
earned their keep across both regimes — apparatus-on and
apparatus-off. They are not apparatus; they are how the work
actually happens.

**Pattern B service architecture.** Held across all four bill
mutations. The test ergonomics it produces (route integration
tests can mock `buildServiceContext` and exercise the real
service through the real route handler) is a substantial win
over Pattern A. Keep as the default for domain services.

**The validation gate sequence.** typecheck → agent:validate →
vitest → E2E. Cheap signals first, expensive signals last.
This order surfaced failures fast across every Phase 5 chunk.

**The friction journal as future-you note.** Not as
retrospective ceremony, not as cumulative-N tracking. As a
specific note about a specific surprise that future-me would
want to know about. The Phase 5 friction-journal entries are
short paragraphs, not classification trees. They read like
notes; they are useful.

**Manual-first as the default for shipping a domain
foundation.** Phase 5 proved this. Phase 6 + Phase 7 will
ship ingestion and extraction on top of the manual foundation,
which is the right order. Future domains (AR, Banking, Tax,
Assets, Procurement) should also ship manual-first.

**The disk-grep audit at chunk-onset when fixing a class.**
Codified above as a change to make; included here because the
practice itself (verify-from-disk extended to verify-the-class-
is-bounded) should be permanent.

## 9. Honest limitations of this retrospective

I orchestrated most of Phase 5 from the WSL side and shipped
the last two chunks (B5-3-D6 and arc-closure prep) under the
stripped-down regime that this retrospective then evaluates.
The self-audit bias is real: I am the one judging whether the
apparatus held up, and I am also the one who experienced the
relief of working without it. A reader with a different
perspective would probably notice:

(a) The "the apparatus overstayed" framing is generous to the
apparatus in one way (it grants the apparatus earned its keep
early) and harsh in another (it concludes the apparatus
deserved to be dismantled). Both could be wrong. The early
chunks may have shipped clean despite the apparatus rather
than because of it; the stripped-down regime's two chunks may
not be enough evidence to draw the conclusion I drew.

(b) The seven lessons in §3 are the ones I noticed and
remembered. There may be lessons I unconsciously downgraded
because they don't fit the pattern I'm constructing. The
clearest candidate: I have nothing to say about whether the
intent-type / ProposedMutation surface produced better agent
behavior than a simpler API would have, because Phase 5 didn't
exercise the agent path — that's Phase 6 work. Phase 6's
retrospective should revisit whether the intent-type framing
earned its keep when the agent actually used it.

(c) I have no baseline. I don't know whether Phase 5's chunk
cadence, bug density, or shipping velocity was good, average,
or poor relative to what another developer or another AI
session would have produced with the same spec. A second
reader should check whether the patterns I describe as
universal ("manual-first works," "apparatus grows on its
own") are genuinely universal or just the ones I noticed in
this arc.

(d) The retrospective itself is an artifact the apparatus
would have produced. The structure (numbered sections, "what
I'd do differently," "what I'd keep") is inherited from Phase
1.1's retrospective. The content tries to be plain English
rather than catch-ledger jargon, but the form is the form. If
this retrospective itself is apparatus, the antidote is that
future retrospectives keep getting shorter and more specific
until the only thing being captured is what genuinely needs to
be captured.
