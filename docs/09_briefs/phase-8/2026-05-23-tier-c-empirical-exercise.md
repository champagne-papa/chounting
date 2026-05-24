# Tier C empirical exercise — 3 abstaining docs through full ingestDocument

*Phase 8 §3 closeout, 2026-05-23. First end-to-end exercise of Tier C
(Claude Sonnet AI fallback) — implemented at Phase 7 chunk 7.2 but never
invoked with a live Claude call. Session 72: Tier A handled the entire
10-doc real-OCR corpus; the 3 abstaining docs fell through to Tier C, but
the corpus capture asserted Tier A abstention, not a live Tier C run.*

## What was run

Three abstaining documents (the docs Tier A declined to classify in
Session 72), each run **solo** through the full `ingestDocument()` pipeline
against the **real Modal OCR sidecar** + **real `claude-sonnet-4-5`** Tier C
fallback, on the **local** Supabase stack (`127.0.0.1`):

1. **adobe_invoice** — Adobe subscription invoice (public SaaS brand), PDF.
2. **founder_receipt** — founder-vendor receipt, PDF.
3. **founder_payment** — founder-vendor payment confirmation, **PNG**.

Runner: `apps/web/scripts/tier-c-empirical-exercise.ts` — a parameterized,
PII-free adaptation of the Session 42 `phase-7-v1-close-demo.ts` (filenames
passed as CLI args; raw extracted fields print to stdout only, never
committed). The source documents are gitignored real founder documents.

Authorization: operator-approved at the spend gate (estimated `<~$0.25`;
actual Claude cost `~$0.04` total — see *What we learned*). Run order:
adobe solo first (verify clean), then the two founder docs.

## What happened per doc

All three traversed the **full 11-record `pipeline_trace`** — empirically
confirming the runtime stage set reconciled into ADR-0014 §1 this same
session (Item 4, commit `f3cc0e78`):

```
dedup_no_match → byte_fetch → run_ocr [paddleocr-2.7-pp-ocrv4]
→ classify_document_type → ai_fallback_classify [claude-sonnet-4-5]
→ extract_fields → ai_fallback_extract [claude-sonnet-4-5]
→ match_vendor → match_against_existing_state → router_match_against_state
→ build_proposal
```

| Doc | Tier A | Tier C classify | Tier C extract | Downstream | Terminal |
|---|---|---|---|---|---|
| adobe_invoice | abstain | `vendor_invoice` (live Claude) | succeeded | match_vendor: no match → Subsystem 1 skipped → build_proposal | `committed`, `proposal_id=null` |
| founder_receipt | abstain | succeeded (type not captured — see *Limitations*) | succeeded (no validation-failed audit) | same | `committed`, `proposal_id=null` |
| founder_payment | abstain | `payment_confirmation` (live Claude) | **Zod-rejected (array vs object)** | same | `committed`, `proposal_id=null` |

- **Tier A abstained on all three** — Tier C fired with a live
  `claude-sonnet-4-5` call on each (confirmed by the `model` field on the
  `ai_fallback_*` trace records). Expected; these are the abstaining set.
- **`proposal_id=null` on all three is the documented behavior, not a
  finding.** The `synthCtxForCommit` auth gate (Session 78 / retrospective
  §2) yields `proposal_id=null`; `status=committed` is the pipeline's
  terminal enum, not a real ledger mutation. **No document reached a real
  ledger commit** — the auth gate held, exactly as the Session 74 e2e
  assertions document.
- **Latency:** adobe 131s (Modal cold-start dominated the OCR stage),
  founder_receipt 11s, founder_payment 17s (Modal warm).

## The finding — Tier C payment-confirmation extract returned a top-level array

On founder_payment, Tier C **classified** correctly (`payment_confirmation`)
but the Tier C **extract** call returned a top-level JSON **array**, which the
extract Zod schema rejected:

```
ai_fallback_validation_failed → extraction_failed
zod: { code: invalid_type, expected: "object", received: "array", path: [] }
```

The payment_confirmation prompt explicitly instructs *"Output a single JSON
object matching this schema exactly"* and *"Output the JSON object and
nothing else"* — yet live Claude returned an array for this particular real
input.

**Half success, half finding:**

- *Success:* the Zod structural-defense gate (ADR-0014 §8) caught the
  non-conforming output and the pipeline **degraded gracefully** — no crash;
  the run traversed all 11 stages to `build_proposal` and terminated at
  `committed` / `proposal_id=null`; the `extraction_failed` audit event fired
  (which in a real flow routes to the exception queue per ADR-0011 §13).
- *Finding:* the extraction is silently lost when Claude wraps output in an
  array, despite an explicit single-object instruction. Real Tier C output is
  less predictable than the v1 single-object contract assumes.

**Scoped follow-up (not this session):** Tier C extract robustness —
tolerate/unwrap a single-element array, reinforce the prompt, or formalize
the exception-route as the intended behavior. Candidate for the auto-commit
arc's Tier C hardening, or a standalone Tier C extract-robustness item.
Friction-journal entry: 2026-05-23.

## What we learned

- **Tier C works end-to-end.** The implemented-but-unexercised fallback path
  runs: Tier A abstain → live Claude classify → extract → downstream stages →
  proposal building → gated commit. 2 of 3 docs ran fully clean; the 3rd
  surfaced a graceful-degradation finding.
- **The ADR-0014 §1 reconciliation (Item 4) is empirically grounded** — all
  three runs emit exactly the 11-record stage set enumerated in the
  amendment, including `dedup_no_match`, both AI-fallback child sub-stages,
  and the `match_against_existing_state` + `router_match_against_state`
  relationship split.
- **The Zod structural gate earns its keep** — it caught real malformed LLM
  output on the first live payment doc.
- **Cost:** ~$0.015/doc Claude (2 calls each: classify + extract, ~2.7K in /
  ~0.4K out at Sonnet list prices) → **~$0.04 total Claude** for the exercise.
  Well under the ~$0.25 ceiling. Modal OCR runs on the project's Modal
  account (separate; 1 cold-start + 2 warm).

### Limitations / housekeeping

- **founder_receipt's exact Tier C classification type was not captured** (an
  output-filter mistake during the run; the type is not persisted — cases
  stay `received`/`unknown` and `proposal_id=null` persists no proposal). Its
  extract succeeded (no validation-failed audit). Not re-run, to avoid
  re-spend.
- The exercise left 3 seeded `source_documents` + cases + storage blobs on
  the **local** Supabase stack (resettable via `db:reset`).
- Per-classification confidence scores were not surfaced by the runner
  (internal-only; would need log/DB instrumentation).

---

*Closes Phase 8 retrospective §3 item 3 (Tier C empirical exercise). Runner:
`apps/web/scripts/tier-c-empirical-exercise.ts`. Finding: friction-journal
2026-05-23.*
