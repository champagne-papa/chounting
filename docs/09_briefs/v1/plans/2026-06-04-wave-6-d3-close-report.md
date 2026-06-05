# Wave 6 D3 — Close Report (T8)

**Status:** D3 implementation COMPLETE pending the T8 read-back.
**Commit ledger:** brief `2aa3c911` → decomposition `6cc54243` → T1
`531f1a65` → T2 `d7d2fc63` → T3 `3ea6d0d7` → T4 `b3e5d86e` → T5
`7117cf6f` → T6 `bea17821` → T7 `834bc879` → T8 (this commit).
**Charter check:** "Review/inbox UI (net-new) + approve→post (net-new)
under human identity (ctx.caller.user_id → created_by)" — shipped;
registers/amends nothing — **verified: `git diff 6cc54243..HEAD --
docs/02_specs docs/07_governance docs/06_audit` is EMPTY** (the scope
fences held; no ADR/invariant/control text touched by any impl commit).

## 1. Gates

| Gate | Result |
|---|---|
| D3 test surface (12 files) | **113/113** |
| `pnpm agent:validate` | ✓ (typecheck + URL check + Category A floor 26/26) |
| `pnpm typecheck` | ✓ |
| Scope fences | ✓ (empty diff over the impl range) |

## 2. Lint — scoped claim (per `conventions/lint-and-validation.md`)

D3's new files carry **5 errors in 2 debt classes, both named**:

- **Class A — app→db (`adminClient` in read routes), 4 errors across
  the list + approve-post routes:** byte-identical to the canonical
  cards endpoint's own 2 errors — the ratified read-route pattern's
  standing baseline debt, copied with the pattern. Not disabled
  (matching the cards precedent, which carries them bare).
- **Class B — agent-adminClient (`reviewPreview.ts`), 1 error:** the
  9th member of the orchestrator/extraction Q33 class (siblings:
  ingestDocument, dedupByHash, runOCR, …). Resolution rides Q33's own
  timing (`open_questions.md`).

**Corrected grounding error (T5→T8):** T5 asserted app→agent imports
were ADR-0020-legal — wrong; the rule's allow-set is `app → services,
contracts, shared`. The 3 resulting crossings (detail route,
approve-post route ×2) are resolved via the **established agent-entry
precedent** (`api/agent/message/route.ts:16` — inline
`eslint-disable-next-line architecture/agent-first-import-boundaries`
with rationale): the review routes are agent-entry surfaces driving
the orchestrator-layer rebuild. Explicit, reviewable, precedented —
not a new debt class.

## 3. Brief-vs-shipped (D-1 … D-6)

| Position | Shipped state |
|---|---|
| **D-1 IDOR** | FAITHFUL. In-service org checks at `transition()` (T3, read-row-derived, pre-mutation) + `resolveException()` (T3, pre-RPC probe — found WORSE than briefed: the write preceded any read); cards-pattern routes (T5/T6); foreign≡missing 404 (T5, structural); §5(A) superseded with provenance (T3 commit + code comments). IDOR-negative suites parts 1+2 (7+3 tests). |
| **D-2 rebuild-not-persist** | FAITHFUL + two grounded findings. `buildReviewPreview` (T5): persisted candidates verbatim, Tier-A-only re-extraction over persisted OCR, pure `buildProposal`, no AI on the review path. Findings: (1) **population mapping** — matched-candidate vendor_invoice → ATTACHMENT card (not post_bill); the postable population is the UNMATCHED entry card. **D-5's "parked-matched get Approve&Post" is hereby amended**: matched = attachment/NOT_POSTABLE, actions = resolve/reject. (2) **Tier-A number-amount** — a latent INV-MONEY-001 violation at the extractor (amount emitted as number), masked by the rebuild-boundary `toFixed(2)` normalization; the extractor-grain fix is carried forward. |
| **D-3 state mechanics** | FAITHFUL. chunk_9 CHECK (+committed only, T1); 4 Zod broadens in lockstep (T2); `approved→committed` edge automation-owned (T4), human-ctx marking with honest attribution; docstring + dead-end message updated (T4 fold-in). |
| **D-4 sequencing + double-post guard** | FAITHFUL, strengthened at read-backs. RPC amendment shipped (T1, confirmed change-set item); pass-through chain + constraint-name-keyed `DUPLICATE_SOURCE_EXTERNAL_ID` (T2); **state-aware resume** (the decomposition catch — `transition()` throws, never no-ops); post-first dup-catch (D-4.4 DB-as-authority taken literally — no read-side pre-skip); per-child uniform suffixing `${caseId}:bill|:payment` (T6 ruling) with both probes multi-JE-reconciled (ruling condition 3). Both crash classes proven recovery-safe (T6 tests: row-delta +1 exactly; 23505-recovery count-unchanged). |
| **D-5 populations** | AMENDED (above) + one deviation: **born-paid bundles are structurally unreachable under the Tier-A-only rebuild** (the dual-evidence field set only ever came from Tier C) → bundle → 409 `bundle_requires_manual_entry` (defensive gate + route backstop); per-child bundle POSTING is a carry-forward — the suffix scheme is live for both entry-card actions, so the T6 ruling's mechanism is in force. Exception population: wiring-only over chunk-6 `resolveException` (org-checked at T3). |
| **D-6 API + UI** | FAITHFUL minus one named simplification: ONE canvas directive (`review_inbox`), detail in-view via `selectedCaseId`; `review_case_detail` deep-linking deferred. All five endpoints shipped; Zone 1 nav after Pending Documents; both populations one list with exception + post-status badges (the D-4 stranding window operator-visible); NOT_POSTABLE steering. Component tests 9/9. |

## 4. Test deviations (named, not buried)

- **PERIOD_LOCKED not route-tested** — locking the shared seed period
  would break parallel suites; floored at the service grain by the
  Category A `lockedPeriodRejection.test.ts`; the route adds only the
  shared error-status mapping.
- **Bundle recovery test replaced** by the unreachability grounding +
  the 409 gate test (per the D-5 deviation above).

## 5. Carry-forward docket

1. **Sweep eligibility +`approved`** (posted-JE discriminator) — the
   post-then-crash window's automated recovery; operator-visible
   meanwhile via the inbox post-status badge (D-4, T5/T7).
2. **Bundle-at-review posting** (per-child `${caseId}:bill|:payment`
   two-child sequence) — returns with Tier-C-at-review or persisted
   proposals (post-V1).
3. **Tier-A number-amount** — latent INV-MONEY-001 violation at
   `vendorInvoiceExtractor` (~:84); the rebuild normalizes downstream;
   the real fix is extractor-grain (any future Tier-A consumer hits
   the same mismatch).
4. **`*TierA` additive-named-export codification candidate** — third
   fire at T5 (classifier eval → extractor eval → review rebuild);
   N=3 reached, routes through `codify-convention` at the wave
   retrospective.
5. **`review_case_detail` directive** — cross-tab deep-linking,
   deferred until it earns its keep.
6. **Brief D-5 textual amendment** — the population-mapping correction
   (this report §3 D-5 row is the record; the brief doc itself stays
   immutable per the amendment discipline, this close report is the
   provenance-preserving corrector).

## 6. UI closeout note

The UI-session screenshot gate applies at the WAVE's UI closeout
(per the standing CLAUDE.md discipline), not at D3's per-task grain —
D3's UI ships code-reviewed + component-tested; the founder capture
sequence lands at the Wave 6 arc close alongside D8.
