# Phase 7 v1 close demo close report — Session 42 HALT at substrate-fix close

*Drafted at Session 42 close, 2026-05-20. Path 3 ratification per
brainstorming-side adjudication (HALT + Phase 8 inheritance) — substrate-
fix cascade fired N=11 sub-instances; 1-of-3 doc-type demo success
demonstrates v1-walkable shape; chunk 7.3 brief §6 close gate 19 strict
reading NOT satisfied at Session 42 due to N=11 ratified-design-vs-
production-reality calibration gap requiring ADR-0014 §12.1 second
amendment at Phase 8 grade.*

---

## §1 Session 42 cycle phase + HALT framing

Session 42 fired v1 close demo cycle per Iteration 3 directive (Path γ
manual orchestrator invocation). Two-condition observation gate
(Modal env vars + 3 real-world PDF fixtures) satisfied at session
onset after founder action sequence. Smoke test cascade fired 8 attempts
to reach 200 OK on canary; demo runner subsequently fired 3 invocations
against real PDF fixtures with 1-of-3 success.

**HALT trigger:** F-J-14 Grain 3 (mid-impl reactive) — substrate density
at v1 close demo grade materially exceeded Session 42 single-session
bound. Continuing substrate-fix iteration produces governance debt
(ADR-substrate drift if N=11 fixed without ADR amendment) OR session-
budget overrun (ADR amendment + re-fire inline). Phase 8 inheritance
absorbs both cleanly per Path 3 framing.

---

## §2 Substrate-fix cascade (N=11 sub-instances)

Chunk-7.1b-impl-grade local-deploy-substrate-gap sub-pattern fired N=11
times in Session 42 across two distinct sub-categories per Finding A
adjudication:

### §2.1 Substrate-staleness sub-cluster (N=1-N=10; sidecar-ocr/ deployment scaffolding)

Chunk 7.1b authored against then-current Modal/Python/PaddleOCR tooling;
tooling evolved between chunk 7.1b ship (~2026-05-15) and Session 42
deployment (2026-05-20). Substrate didn't track.

| # | File | Edit | Provenance |
|---|---|---|---|
| 1 | sidecar-ocr/deploy.sh | `modal token current` → `modal token info` (CLI rename) | Founder pre-Session-42 |
| 2 | sidecar-ocr/main.py (pip install) | pydantic pipx inject for local env | Founder pre-Session-42 (operational) |
| 3 | sidecar-ocr/main.py | `@modal.web_endpoint` → `@modal.fastapi_endpoint` (SDK API rename) | Founder pre-Session-42 |
| 4 | sidecar-ocr/requirements.txt | added `fastapi[standard]>=0.110.0` | Founder pre-Session-42 |
| 5 | sidecar-ocr/main.py | `.add_local_python_source("middleware", "schemas")` image config | WSL Session 42 |
| 6 | sidecar-ocr/README.md | `value=<secret>` → `MODAL_OCR_HMAC_SECRET=<secret>` × 2 locations | WSL Session 42 |
| 7 | sidecar-ocr/deploy.sh | `value=<secret>` → `MODAL_OCR_HMAC_SECRET=<secret>` | WSL Session 42 |
| 8 | sidecar-ocr/schemas/extraction.py | `bytes_b64: bytes` → `bytes_b64: str` (Pydantic 2 strict mode) | WSL Session 42 |
| 9 | sidecar-ocr/requirements.txt | `paddleocr` + `paddlepaddle` upper-bounded `<3.0.0` (PIR/oneDNN incompatibility) | WSL Session 42 |
| 10 | sidecar-ocr/requirements.txt | added `pymupdf>=1.23.0` (transitive dep for PDF rasterization) | WSL Session 42 |

### §2.2 Ratified-design-vs-production-reality sub-cluster (N=11; apps/web/src/ orchestrator substrate)

Per Finding A: N=11 is structurally distinct from N=1-N=10. Substrate
is contract (ratified at ADR-0014 §12.1 Amendment 2026-05-20 at chunk
7.1b ship), not plumbing.

| # | File | Edit (NOT APPLIED at Session 42) | Provenance |
|---|---|---|---|
| 11 | apps/web/src/agent/orchestrator/extraction/sidecar/client.ts:25 | `PER_REQUEST_TIMEOUT_MS = 10_000` → `60_000` calibration | DEFERRED to Phase 8 ADR-0014 §12.1 second amendment |

The 10s per-request timeout was ratified at ADR-0014 §12.1 Amendment as
chunk 7.1b design choice. Empirical observation at Session 42 demo:
warm-state PaddleOCR inference on real PDFs (~25-28KB vendor invoice /
receipt) exceeds 10s consistently. payment_confirmation succeeded at
16.5s warm OCR (succeeded on retry within 30s budget); vendor_invoice +
receipt exceeded 10s × 3 retries → transient_exhausted ceiling.

ADR amendment cycle deferred to Phase 8 per Path 3 ratification.

### §2.3 Layer-peeling diagnostic discipline

8-attempt smoke test cascade demonstrated structural convergence
(N=1 attempt → N=1 layer peeled). Each fix addresses exactly the next
unfixed layer on the request handling stack:

| Attempt | Layer reached | Outcome | Time |
|---|---|---|---|
| 1 | Module import | 303 (middleware/schemas not mounted; N=5 fix) | 752s |
| 2 | Secret check | 503 (wrong KEY name; N=6 fix) | 4.2s |
| 3 | Function reference | 303 (stale ref after secret delete; founder redeploy) | 751s |
| 4 | HMAC verify | 401 (secret VALUE mismatch; N=7 fix bracket-strip) | 0.69s |
| 5 | Pydantic validation | 400 (bytes_b64 strict mode; N=8 fix) | 4.46s |
| 6 | PaddleOCR inference | 500 (PaddlePaddle 3.x PIR/oneDNN; N=9 fix) | 17.62s |
| 7 | PDF rasterization | 500 (missing pymupdf; N=10 fix) | 68.24s |
| **8** | **OCRResponse return** | **200 OK** | **79.43s** |

Diagnostic-by-evidence discipline strengthened mid-cascade (attempts 3-4
had inference component; attempt 5+ used response-body grounded fixes).

§1.3.B cold-start latency banked: **79.43s on first PaddleOCR cold-load**
— validates ADR-0014 §12.1 30-180s budget at N=1 empirical anchor.

---

## §3 Demo execution outcomes (Tasks 1-5)

3 fixture invocations fired via demo runner at
`apps/web/scripts/phase-7-v1-close-demo.ts` (Path γ standalone script,
not e2e assertion-body authoring per Iteration 2 §B). Full results JSON
at `docs/09_briefs/phase-7/2026-05-20-phase-7-v1-close-demo-results.json`.

### §3.1 Per-fixture outcomes

| Fixture | Trace ID | Status | Stages Reached | Elapsed |
|---|---|---|---|---|
| vendor_invoice.pdf | `bf42882b-8c8f-43c9-b20b-38ef5e2989f6` | `pipeline_failed` / `transient_exhausted` | dedup → byte_fetch → (run_ocr crash) | 30.5s |
| receipt.pdf | `f1dbf16e-357f-47ef-94be-66dc5faa92d1` | `pipeline_failed` / `transient_exhausted` | dedup → byte_fetch → (run_ocr crash) | 29.9s |
| **payment_confirmation.pdf** | **`def3f808-385f-4d32-a37d-6f7719b51353`** | **`committed`** | **dedup → byte_fetch → run_ocr → classify → extract_fields → ai_fallback_extract → match_vendor → match_against_existing_state → build_proposal** | **19.3s** |

### §3.2 v1-walkable shape demonstration at payment_confirmation

payment_confirmation invocation validates v1-walkable shape at one
document type (all 9 active stages fired correctly):

- **Stage 0 dedup_by_hash**: short-circuit check; no prior hash match → continued
- **Stage 1 byte_fetch**: retrieved 24982 bytes from Supabase storage; content_hash verified
- **Stage 2 run_ocr**: Modal sidecar invocation succeeded (~16.5s warm OCR with pymupdf rasterization + PaddleOCR PP-OCRv4 inference)
- **Stage 3 classify_document_type**: Tier C AI fallback fired (Anthropic Claude call) — classified as `vendor_invoice` (interesting cross-class fire; the payment confirmation PDF resembled invoice shape to classifier)
- **Stage 4 extract_fields**: Tier C AI fallback continued for field extraction
- **Stage 5 match_vendor**: no vendor_id match found (no matching vendor in dev DB ORG_HOLDING)
- **Stage 6 match_against_existing_state**: skipped per "no vendor_match.vendor_id; cannot match against Phase 5 substrate"
- **Stage 7 build_proposal**: proposalBuilder fired

Output: `status='committed'`, `proposal_id=null` (no actual commit; classifier mis-route + no vendor match → defensive guard branch).

Fixture provenance: real-world founder-provided PDFs (per Iteration 2 §C
preferred path); 24-28KB sizes.

### §3.3 Failure analysis for vendor_invoice + receipt

Both fixtures crashed at Stage 2 run_ocr with `transient_exhausted`
failure class. Empirical pattern:
- Elapsed time: ~30s (matches `MAX_ATTEMPTS=3` × `PER_REQUEST_TIMEOUT_MS=10_000`)
- pipeline_trace ends after byte_fetch (run_ocr trace not pushed; stage didn't complete)
- Modal sidecar IS reachable (smoke test attempt 8 + payment_confirmation invocation both succeeded)

Root cause per Finding A diagnosis: 10s per-request `AbortController`
timeout at `client.ts:25` fires before PaddleOCR completes inference on
larger/more-complex PDFs. The 10s budget was ratified at ADR-0014 §12.1
Amendment but empirically miscalibrated for warm-state real-PDF inference.

---

## §4 Close-gate verification disposition

Per chunk 7.3 brief §6 close gates 14-19 + Iteration 2 §D ratification:

| Gate | Description | Disposition |
|---|---|---|
| 14 | Stage 7 commit composite verified | NOT EXERCISED at demo (no `proposed_entry_card` route fired across 3 doc types) — banks at chunk 7.3b structural verification (existing test suite); regression watch only |
| 15 | Stage 6 receipt-as-payment-evidence routing activation | NOT EXERCISED at demo (no `proposed_attachment_card` route fired; only `defensive_guard` discriminator on payment_confirmation) — banks at chunk 7.3b structural verification |
| 16 | End-to-end integration (Stages 0-7 active against Modal sidecar) | **PARTIALLY SATISFIED** — verified for 1-of-3 doc types (payment_confirmation full pipeline) |
| 17 | pipeline_trace JSONB column writes for Stage 7 | NOT VERIFIED at demo (build_proposal trace_record present in payment_confirmation result; SQL persistence not queried) |
| 18 | Failure-class audit events at Stage 7 per ADR-0014 §12 | NOT EXERCISED at demo (no Stage 7 commit failure scenarios fired) |
| **19** | **v1-walkable end-to-end demo across 3 document types** | **NOT SATISFIED at strict reading** (1-of-3 vs required 3-of-3) — **partial demonstration** of v1-walkable shape at payment_confirmation only |

Close gate 19 strict reading verbatim from chunk 7.3 brief: *"v1-walkable
end-to-end demo across 3 document types verified at chunk 7.3b close
per cycle-close §5.4 + scope-input §7 Step 10 v1-ship-readiness
framing: vendor_invoice → post_bill via ProposedEntryCard; receipt →
attach_payment_evidence via ProposedAttachmentCard; payment_confirmation
→ attach_payment_evidence via ProposedAttachmentCard."*

Not satisfied: vendor_invoice + receipt didn't reach proposal-builder
stage due to N=11 calibration gap; payment_confirmation reached
proposal-builder but mis-classified as vendor_invoice → defensive_guard
route fired instead of expected attach_payment_evidence.

Phase 8 inheritance fires the 3-of-3 demo after N=11 fix lands per Path 3
framing.

---

## §5 Banking surfaces at Session 42 close

### §5.1 chunk-7.1b-impl-grade local-deploy-substrate-gap N=11 cumulative

**Codification graduation lock at Phase 8+ retrospective grade.** N=11
sub-instances split into two sub-categories per Finding A:
- Substrate-staleness sub-cluster (N=1-N=10): plumbing-grade tooling drift
- Ratified-design-vs-production-reality sub-cluster (N=11): contract-grade calibration gap

Phase 8 retrospective convention codification candidate at convention-
extension grade.

### §5.2 NEW substantive Phase 7 retrospective findings (7 total)

Inheriting from prior session findings + adding Session 42 grade:

1. (Prior) env-var-gated integration tests silently mask substrate gaps (N=11 evidence consolidated)
2. (Prior) Schema-translation-discipline gap at manual sync grade (Pydantic 2 strict mode)
3. (Prior) Loose `>=` version pins in requirements.txt (paddlepaddle 3.x breaking change masked)
4. (Prior) Transitive dep-discovery gap (pymupdf not declared in chunk 7.1b authoring)
5. (Prior) Diagnostic-by-evidence discipline strengthening mid-cascade
6. (Prior) README placeholder template drift ((μ) sub-grain N=10 → N=11 with cross-shape evidence)
7. **(NEW at Session 42 N=11) Ratified-design-vs-production-reality calibration gap**: ADR-0014 §12.1 Amendment's 10s per-request timeout empirically miscalibrated for warm-state real-PDF PaddleOCR inference. Phase 8 candidate for ADR-0014 §12.1 second amendment + client.ts calibration update.

### §5.3 F-J-14 Grain 3 fired at Session 42

First firing of F-J-14 Grain 3 (mid-impl reactive) at Phase 7 substrate
grade. Trigger: N=11 firing + cumulative substrate density + ADR-
amendment-grade governance question + Session 42 cumulative wall-clock
(~3-4 hours). Substrate density materially exceeded single-session bound;
continuing inline produces governance debt or session-budget overrun.

Path 3 HALT discipline preserves cleaner Phase 8 inheritance shape.

### §5.4 Codification-+-execution-coincident pattern N=2 NOT FIRED at Session 42

Session 42 close does NOT fire codification-+-execution-coincident
pattern N=2 candidate (anticipated at directive §G Iteration 3 Additional
Consideration). Reason: Session 42 closes at HALT-grade per Path 3
without inline codification of the "phase close push" grain refinement
(Candidate #13 refinement observation). The refinement was banked at
Session 41 retrospective inventory; Session 42 doesn't fire a NEW
codification during the same commit ceremony as a NEW execution.

Push-terminal-close N=4 banking continues (Phase 5.1 + 6.5 + 7-retro +
7-substrate-fix at this commit), but the codification-+-execution-
coincident pattern doesn't graduate to N=2 at Session 42.

### §5.5 Cross-grade floor-bias-generalization evidence N=3 banking watch

Demo runner script + close report at Session 42 land at modest LOC
(~370 LOC demo runner + ~600 LOC this close report = ~970 LOC). Not
strictly comparable to chunk-impl or retrospective-drafting grades
because Session 42 is a separate grade (demo execution grade with
substrate-fix overhead).

Cross-grade floor-bias-generalization N=3 banking surface DEFERRED to
future demo execution sessions (Phase 8 onset + future v1 demos) where
the pattern can accrue evidence at consistent demo-execution grade.

---

## §6 Phase 8 inheritance inventory (extended to 8 items)

Per Session 41 close report §5 6-item inventory + Session 42 additions:

### §6.1 Substrate-grade deferrals (items #1-#7; Phase 8 / post-v1)

1. `bundle_partial_commit_reconciliation_pending` ENUM extension + audit metadata writer (Session 41 carry-forward).
2. Logic Receipt bundle-level INV-AGENT-002 event composition + ProposalJustificationSchema formal codification (Session 41 carry-forward; paired with Candidate #12 deferral discipline).
3. `payment.record` ActionName addition + role_permissions migration (Session 41 carry-forward).
4. React DOM test env (jsdom + @testing-library/react) for UI component tests (Session 41 carry-forward).
5. Post-v1 ADR amendment for system_actor widening at withInvariants (Session 41 carry-forward; paired with Candidate #11 substrate-shim framing).
6. E2E assertion body authoring (~600-1050 LOC across 3 e2e test files at apps/web/tests/integration/e2e/) (Session 41 Iteration 2 §B carry-forward; paired with item #4 React DOM test env).
7. **(NEW Session 42)** Sidecar deployment validation harness — fixture-mocked equivalents that exercise the deploy substrate WITHOUT requiring real Modal. Would catch all N=1-N=10 sub-instances at chunk-ship rather than at first real deployment. Convention candidate at testing.md extension grade.

### §6.2 NEW Session 42 substrate-grade deferral (item #8)

8. **ADR-0014 §12.1 second amendment + apps/web/src/agent/orchestrator/extraction/sidecar/client.ts:25 calibration update**: raise `PER_REQUEST_TIMEOUT_MS` from `10_000` to `60_000` (or analogous warm-state-PaddleOCR-inference-fit value). ADR amendment ratifies the new per-request timeout + retains the 30-180s Stage 2 budget framing; client.ts update aligns substrate to ratified design. Activation trigger: Phase 8 first chunk (substrate-fix-narrowness candidate per Phase 5.1 sub-curve (b) calibration). Demo re-fire at 3-of-3 success grade fires post-fix.

### §6.3 Demo gate (item #9; founder action; Phase 8 onset)

9. **(NEW Session 42)** Phase 7 v1 close demo re-fire at 3-of-3 success grade — after item #8 ADR amendment + client.ts fix + re-deploy. Should be a single demo session (warm Modal + calibrated timeout + same fixture set + same demo runner script). Banks 3-of-3 evidence + closes chunk 7.3 brief §6 close gate 19 verbatim.

---

## §7 Phase 7 → Phase 8 transition push (Task 7)

Per Session 41 Candidate #13 codification at CLAUDE.md Push-readiness
section + Iteration 2 §E ratification: push-terminal-close pattern fires
at "phase close" grain. Session 42 closes Phase 7 substrate (at HALT
grade) with conclusive Phase 7 → Phase 8 transition framing.

**Pre-push verification:**
- `pnpm typecheck` green at HEAD (substrate edits are docs + scripts + sidecar; no src/ TS changes)
- `pnpm agent:validate` 26/26 green baseline preserved
- 1-of-3 demo evidence + close report at canonical path
- Working tree: 10 files staged (5 sidecar-ocr edits + demo runner + demo results JSON + this close report + 2 inherited founder edits)

**Push command:**
```bash
git push origin staging
```

**Push state pre-push:** 1 commit ahead of origin/staging (Session 42
single commit per Path γ; prior Session 41 retrospective ceremony's 3
commits already pushed at `4aea7e2..97f86ed` per Session 41 §6 close
report).

**Banking:**
- push-terminal-close N=4 cumulative cross-phase (Phase 5.1 + 6.5 + 7-retro + 7-substrate-fix at Session 42 close).
- Candidate #13 refinement observation banked at retrospective inventory item via this close report §5.4 (NOT inline codification per HALT framing).

---

## §8 Codification candidate state at Session 42 close + next operational fire

**Phase 7 substrate close: PARTIAL** at HALT grade — substrate-fix
cascade complete at N=10 sub-staleness; N=11 calibration gap banked for
Phase 8 ADR amendment; 1-of-3 demo evidence at payment_confirmation
validates v1-walkable shape but doesn't satisfy strict close gate 19.

**Phase 7 retrospective cycle: TERMINAL at Session 41** (unchanged).

**Phase 7 implementation cycle: TERMINAL at Session 40** (unchanged).

**Next operational fire (Session 43+):** Phase 8 scope-lock-cycle-round
opens with first chunk candidate being the v1 close demo completion +
sidecar substrate refresh chunk (per §6 inventory items #7-#9). Phase 8
absorbs:
- ADR-0014 §12.1 second amendment (item #8)
- client.ts calibration fix (item #8)
- Re-deployed Modal sidecar with calibrated timeout
- Demo re-fire at 3-of-3 success grade (item #9)
- Sidecar deployment validation harness (item #7)
- E2E assertion body authoring (item #6, paired with React DOM env item #4)
- 6+ convention codifications from Session 42 banking surfaces

Phase 8's first chunk is structurally the "Phase 7 substrate close
completion + Phase 8 onset" chunk per Phase 5.1 sub-curve (b) substrate-
fix-narrowness calibration.

---

*Session 42 closes Phase 7 substrate at HALT-grade per Path 3
ratification. Phase 7 implementation + retrospective cycles TERMINAL;
Phase 7 substrate close PARTIAL with conclusive Phase 8 inheritance
framing. Co-Authored-By: Claude Opus 4.7 (1M context).*
