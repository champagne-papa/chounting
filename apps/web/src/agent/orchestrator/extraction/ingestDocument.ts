// src/agent/orchestrator/extraction/ingestDocument.ts
//
// Tier 2 document pipeline orchestrator entry function per ADR-0014 §1
// + ADR-0007 Q31 (deterministic TypeScript orchestration; LLM-planned
// orchestration prohibited).
//
// Calls Stages 0-7 in fixed sequence (ADR-0014 §1 canonical stage_names):
//   Stage 0 (dedup_by_hash)           → short-circuit on hash match
//   Stage 1 (byte_fetch)              → via storageProviderService.fetch
//   Stage 2 (run_ocr)                 → active at chunk 7.1b (Modal sidecar)
//   Stage 3 (classify_document_type)  → active at chunk 7.2 (Tier A/C/D)
//   Stage 4 (extract_fields)          → active at chunk 7.3a (per-document-type extractors)
//   Stage 5 (match_vendor)            → active at chunk 7.3a (vendorService.matchVendor)
//   Stage 6 (match_against_existing_state)  → active at chunk 7.3a (documentRouterService.completeCandidate per Phase 4 chunk 1 substrate)
//   Stage 7 (build_proposal)          → substrate + commit composite active at chunk 7.3b (proposalBuilder.ts produces 3-value ProposalResult union). Wave -1 A-now bleed-stop (ADR-0007 §Tier 2 Q78 V1-re-scoping): the orchestrator PARKS matched proposals (status='parked_unposted'); the withInvariants(billService.post/paymentService.record) auto-post is DISABLED (Q78 auth mechanism intact; preserved commit* fns re-wire per-rule post-V1)
//
// Per Iteration 2 Option γ ACTIVATED at chunk 7.3b: 5-route matrix active.
// ProposalResult.kind = 'proposed_entry_card' | 'proposed_attachment_card'
// | 'proposed_mutation_bundle'. IngestDocumentOutput.status preserves
// the deferred union member per ADR-0022 additive discipline
// (defined-but-not-emitted post-activation; JSDoc @deprecated annotation
// per Iteration 2 Note 4).
//
// Brief-task-naming vs ADR canonical reconciliation per Iteration 2 Step 21:
//   - Brief Task 7.3a.3 (vendorService.matchVendor extension) = ADR canonical Stage 5 match_vendor.
//   - Brief Task 7.3a.5 ("Stage 5 relationship-candidate") = ADR canonical Stage 6 match_against_existing_state via documentRouterService.completeCandidate (Subsystem 1 per ADR-0018 §item 2).
//   - Brief Task 7.3a.6 ("Stage 6 proposal builder") = ADR canonical Stage 7 build_proposal substrate.
//
// Per Service Communication Rule 5: trace_id propagates through
// internally-constructed SystemActorServiceContext.
//
// Per ADR-0014 §12 + failureClassification.ts: Stages 0+1+2+4+5+6+7
// wrapped with retry-on-transient + audit-event-emission discipline.
// Stage 3 + Stage 4 apply the wrap selectively per Step 20 Option (c):
// Tier A + Tier D paths wrap; Tier C path defers to callClaude.ts
// internal retry classification (avoids compounded retries).

import type {
  IngestDocumentInput,
  IngestDocumentOutput,
  PipelineStageRecord,
  PipelineFailureClass,
  RelationshipCandidate,
} from './types';
import type { SystemActorServiceContext } from '@/services/middleware/serviceContext';
import { dedupByHash } from './stages/dedupByHash';
import { byteFetch } from './stages/byteFetch';
import { runOCR } from './stages/runOCR';
import { classifyDocumentType } from './classifier';
import { extractOcrText } from './classifier/extractOcrText';
import { extractFields } from './extractFields';
import {
  looksMultiInvoice,
  runAiMultiExtract,
} from './multiInvoiceExtractor';
import { buildProposal } from './stages/proposalBuilder';
import { shadowEvaluateRules } from './stages/shadowRuleEvaluation';
import { recordAutonomyGateAttempt } from './stages/recordAutonomyGate';
import { withFailureClassification } from './failureClassification';
import { ServiceError } from '@/services/errors/ServiceError';
import { vendorService } from '@/services/spend/vendorService';
import {
  completeCandidate,
  resolveCandidates,
} from '@/services/document-platform/documentRouterService';
import { advanceCaseAutomation } from '@/services/document-platform/documentCaseService';
import { enqueueException } from '@/services/document-platform/documentExceptionService';
import {
  lookupBillCommitDefaults,
  lookupPaymentCommitDefaults,
} from '@/services/document-platform/commitDefaultsReadService';
import {
  lookupDocumentCaseId,
  findLiveBillByVendorAndNumber,
} from '@/services/document-platform/extractionReadService';
import { looksLikeBankDetailPresent } from './bankDetailScan';
import { looksLikeStatementNotInvoice } from './statementScan';
import { createExtractedInvoice } from '@/services/document-platform/extractedInvoiceWriteService';
import { resolveRuleDefaultAccount } from '@/services/rules/ruleOutcomeReadService';
import { loggerWith } from '@/shared/logger/pino';
import { withInvariants } from '@/services/middleware/withInvariants';
import { billService } from '@/services/spend/billService';
import { paymentService } from '@/services/spend/paymentService';
import { SYSTEM_ACTOR_USER_ID } from '@/services/middleware/serviceContext';
import type { PostBillInputRaw } from '@/shared/schemas/spend/bill.schema';
import type { RecordPaymentInputRaw } from '@/shared/schemas/spend/recordPayment.schema';
import crypto from 'crypto';

const SYSTEM_ACTOR = 'pipeline_orchestrator';

export async function ingestDocument(
  input: IngestDocumentInput,
): Promise<IngestDocumentOutput> {
  const ctx: SystemActorServiceContext = {
    trace_id: input.trace_id,
    caller: {
      user_id: null,
      system_actor: SYSTEM_ACTOR,
      // Service-account uuid the pipeline commits AS (created_by + audit)
      // per ADR-0007 Q78 Path X. withInvariants adapts to it at the commit
      // gate; caller.user_id stays null as the authorization discriminant.
      system_user_id: SYSTEM_ACTOR_USER_ID,
    },
    org_id: input.org_id,
  };

  const pipeline_trace: PipelineStageRecord[] = [];

  // Stage 0 — dedup-by-hash
  let dedup;
  try {
    dedup = await withFailureClassification(
      'dedup_by_hash',
      input.source_document_id,
      ctx,
      () =>
        dedupByHash({
          org_id: input.org_id,
          source_document_id: input.source_document_id,
          trace_id: input.trace_id,
        }),
    );
  } catch (err) {
    return {
      status: 'pipeline_failed',
      pipeline_trace,
      proposal_id: null,
      failure_class: classifyFailure(err),
    };
  }
  pipeline_trace.push(dedup.trace_record);

  if (dedup.result.shortCircuited) {
    return {
      status: 'dedup_short_circuit',
      pipeline_trace,
      proposal_id: null,
      failure_class: null,
    };
  }

  // Stage 1 — byte fetch
  let fetched;
  try {
    fetched = await withFailureClassification(
      'byte_fetch',
      input.source_document_id,
      ctx,
      () =>
        byteFetch({
          source_document_id: input.source_document_id,
          ctx,
        }),
    );
  } catch (err) {
    return {
      status: 'pipeline_failed',
      pipeline_trace,
      proposal_id: null,
      failure_class: classifyFailure(err),
    };
  }
  pipeline_trace.push(fetched.trace_record);

  // Stage 2 — OCR (active at chunk 7.1b per ADR-0014 §3 Modal sidecar;
  // wrapped in withFailureClassification per chunk 7.1a Stages 0+1
  // precedent. Per ADR-0014 §12.1 amendment 2026-05-20: Stage 2
  // per-stage wall-clock budget is ~30s exception per Modal cold-start.)
  let ocrResult;
  try {
    ocrResult = await withFailureClassification(
      'run_ocr',
      input.source_document_id,
      ctx,
      () =>
        runOCR({
          source_document_id: input.source_document_id,
          bytes: fetched.result.bytes,
          content_hash: fetched.result.content_hash,
          trace_id: input.trace_id,
          prior_trace: pipeline_trace,
        }),
    );
  } catch (err) {
    return {
      status: 'pipeline_failed',
      pipeline_trace,
      proposal_id: null,
      failure_class: classifyFailure(err),
    };
  }
  pipeline_trace.push(ocrResult.trace_record);

  // Stage 2.5 — multi-invoice segmentation (board #4 slice-2 T2c). Between OCR
  // and classify: if the OCR text looks like it holds more than one invoice
  // (permissive over-detect per T2b D-1 — a false positive degrades safely to
  // the single path), attempt an AI multi-extract. On a clean, arithmetically
  // reconciled split of TWO OR MORE invoices ({valid:true}, N≥2), write one
  // PENDING extracted_invoices (α) row per invoice and PARK the case at
  // needs_review (reason 'multi_invoice') for human review; Stages 3-7 are
  // skipped (no classify/extract/match/propose on a multi-invoice document —
  // per-invoice bills are a later task, T3).
  //
  // FALL THROUGH to the existing single-invoice path (Stages 3-7) UNTOUCHED on
  // EITHER a degrade ({valid:false} — budget/invocation/parse/Zod/reconciliation)
  // OR a {valid:true} result the AI resolved to a single invoice (the trigger
  // over-fired). In both cases nothing is written and the case stays at
  // 'received' — exactly the state Stage 3 expects on entry. This is the D (N=1
  // degrade) fallback, and the false-negative safety: a missed/garbled split
  // degrades to the normal path rather than mis-posting. That last guarantee
  // rests PARTLY on the Wave -1 auto-commit being DISABLED (the reconciliation
  // gate is the model-independent half; the disabled commit is the bleed-stop).
  // This branch parks; it does not itself assert auto-commit is off — the
  // guarantee MUST be re-verified when governed auto-commit returns post-V1.
  //
  // Routing (grounded STEP 1): the case is at 'received' here. enqueueException's
  // RPC requires the case at classified|matched, and advanceCaseAutomation
  // REFUSES a direct classified→needs_review advance (that segment is
  // Subsystem-2-owned). So parking is the two-step
  // advanceCaseAutomation('classified') → enqueueException, identical to the
  // shipped documentType==='unknown' short-circuit below.
  const ocrText = extractOcrText(ocrResult.artifact);
  if (looksMultiInvoice(ocrText)) {
    const multi = await runAiMultiExtract(
      {
        ocrText,
        source_document_id: input.source_document_id,
        trace_id: input.trace_id,
      },
      ctx,
    );
    // N≥2 only. A reconciling 1-invoice result means the trigger over-fired
    // (looksMultiInvoice needs 2+ tokens, but the AI resolved them to a single
    // invoice) — that is NOT a multi-invoice case, so it falls through to the
    // single path rather than parking a lone α under the 'multi_invoice' reason
    // (audit accuracy) and rather than skipping the richer classify→extract→
    // match→propose the reviewer benefits from. The reconciled 1-invoice
    // extraction is intentionally DISCARDED and re-derived by Stage 4 — the
    // single path is authoritative for single-invoice docs; this drop is
    // deliberate, not an oversight.
    if (multi.valid && multi.extraction.invoices.length > 1) {
      const multiCaseId = await lookupDocumentCaseId(
        input.org_id,
        input.source_document_id,
      );
      if (multiCaseId) {
        try {
          // One PENDING α per invoice, ordinal 1..N over the AI array order,
          // BEFORE advancing/parking. source_locator is stored twice by design:
          // region_ref is the typed soft-provenance the review/audit path reads
          // ({kind:'ai_soft', source_locator}); extracted_fields is the verbatim
          // AI payload. Do NOT dedupe — the two consumers differ.
          for (const [i, inv] of multi.extraction.invoices.entries()) {
            await createExtractedInvoice({
              document_case_id: multiCaseId,
              source_document_id: input.source_document_id,
              ordinal: i + 1,
              document_type: 'vendor_invoice',
              extracted_fields: inv,
              region_ref: {
                kind: 'ai_soft',
                source_locator: inv.source_locator,
              },
              trace_id: input.trace_id,
            });
          }
          // Two-step park: received→classified (owned automation chain), then
          // enqueue does the classified→needs_review hop the matrix refuses to
          // let advanceCaseAutomation do directly.
          await advanceCaseAutomation(
            { document_case_id: multiCaseId, target_state: 'classified' },
            ctx,
          );
          await enqueueException(
            {
              document_case_id: multiCaseId,
              trace_id: input.trace_id,
              exception_reason: 'multi_invoice',
            },
            ctx,
          );
        } catch (err) {
          // EXCEPTION_ALREADY_OPEN mirrors the unknown short-circuit's re-run
          // tolerance (one open exception per case). NOTE: unlike that path, the
          // α writes above are NOT re-run idempotent — a reprocess with fresh
          // bytes that dodged Stage-0 dedup would hit the (document_case_id,
          // ordinal) UNIQUE as POST_FAILED → pipeline_failed here. Identical-byte
          // re-ingestion short-circuits upstream at Stage 0, so this is off the
          // normal path (known residual; recorded in the T2c design doc).
          if (
            !(err instanceof ServiceError && err.code === 'EXCEPTION_ALREADY_OPEN')
          ) {
            return {
              status: 'pipeline_failed',
              pipeline_trace,
              proposal_id: null,
              failure_class: classifyFailure(err),
            };
          }
        }
      }
      return {
        status: 'parked_unposted',
        pipeline_trace,
        proposal_id: null,
        failure_class: null,
      };
    }
    // {valid:false} degrade, OR {valid:true} with a single invoice (trigger
    // over-fire), → fall through to Stage 3 (single path). No α written, case
    // untouched at 'received'; the single path re-derives the extraction.
  }

  // Stage 3 — classify (active at chunk 7.2 per ADR-0014 §7).
  // Invokes Tier A rule-based classifier, falls through to Tier C
  // Claude Sonnet AI fallback on no Tier A match, falls through to
  // Tier D ('unknown') on Tier C invalid / below threshold / budget
  // exhausted. Step 20 Option (c): coordinateTiers wraps Tier A +
  // Tier D paths in withFailureClassification internally; Tier C
  // defers to callClaude.ts internal retry classification.
  let classification;
  try {
    classification = await classifyDocumentType(
      {
        ocrArtifact: ocrResult.artifact,
        source_document_id: input.source_document_id,
        trace_id: input.trace_id,
      },
      ctx,
    );
  } catch (err) {
    return {
      status: 'pipeline_failed',
      pipeline_trace,
      proposal_id: null,
      failure_class: classifyFailure(err),
    };
  }
  for (const record of classification.trace_records) {
    pipeline_trace.push(record);
  }

  // Short-circuit on documentType='unknown' per ADR-0014 §7 ("unknown
  // always exception queue"). Stage 3 classifier already emitted
  // extraction_failed audit events via aiFallback.ts. Wave 6 D2.1 T4:
  // the §7 contract is now REALIZED — the case advances and routes to
  // needs_review via enqueueException('unknown_document_type', the
  // ratified v1 consumer), closing the unknown-route silent drop
  // (INV-WORKFLOW-002; pre-T4 this returned 'committed' with the case
  // stranded at received while the comment asserted the contract).
  // EXCEPTION_ALREADY_OPEN is re-run tolerance (one open exception per
  // case; the case is already routed). No value in Stages 4-7 for
  // unknown documents.
  if (classification.result.documentType === 'unknown') {
    const unknownCaseId = await lookupDocumentCaseId(input.org_id, input.source_document_id);
    if (unknownCaseId) {
      try {
        await advanceCaseAutomation(
          { document_case_id: unknownCaseId, target_state: 'classified' },
          ctx,
        );
        await enqueueException(
          {
            document_case_id: unknownCaseId,
            trace_id: input.trace_id,
            exception_reason: 'unknown_document_type',
          },
          ctx,
        );
      } catch (err) {
        if (!(err instanceof ServiceError && err.code === 'EXCEPTION_ALREADY_OPEN')) {
          return {
            status: 'pipeline_failed',
            pipeline_trace,
            proposal_id: null,
            failure_class: classifyFailure(err),
          };
        }
      }
    }
    return {
      status: 'parked_unposted',
      pipeline_trace,
      proposal_id: null,
      failure_class: null,
    };
  }

  // Stage 4 — extract_fields (active at chunk 7.3a per ADR-0014 §8).
  // Per-document-type extractor with Tier A rule-based baseline + Tier C
  // AI fallback (shared per-document budget via aiFallbackBudget.ts).
  // Step 20 Option (c): Tier C path defers to callClaude.ts internal
  // retry; orchestrator wraps Stage 4 entry for Tier A path failures.
  let extracted;
  try {
    extracted = await withFailureClassification(
      'extract_fields',
      input.source_document_id,
      ctx,
      () =>
        extractFields(
          {
            documentType: classification.result.documentType,
            ocrArtifact: ocrResult.artifact,
            source_document_id: input.source_document_id,
            trace_id: input.trace_id,
          },
          ctx,
        ),
    );
  } catch (err) {
    return {
      status: 'pipeline_failed',
      pipeline_trace,
      proposal_id: null,
      failure_class: classifyFailure(err),
    };
  }
  for (const record of extracted.trace_records) {
    pipeline_trace.push(record);
  }

  // Stage 5 — match_vendor per ADR-0014 §9 + §1 canonical (brief
  // Task 7.3a.3 brief-named "matchVendor extension"). Reads vendor
  // identity-and-matching fields ONLY per Q29 ESLint boundary.
  let vendorMatch;
  try {
    vendorMatch = await withFailureClassification(
      'match_vendor',
      input.source_document_id,
      ctx,
      () =>
        vendorService.matchVendor(
          {
            org_id: input.org_id,
            vendorField: extractVendorFields(extracted.fields),
            trace_id: input.trace_id,
          },
          ctx,
        ),
    );
  } catch (err) {
    return {
      status: 'pipeline_failed',
      pipeline_trace,
      proposal_id: null,
      failure_class: classifyFailure(err),
    };
  }
  pipeline_trace.push({
    stage_name: 'match_vendor',
    input_hash: crypto
      .createHash('sha256')
      .update(JSON.stringify(extractVendorFields(extracted.fields)))
      .digest('hex'),
    output_hash: crypto
      .createHash('sha256')
      .update(JSON.stringify(vendorMatch))
      .digest('hex'),
    model: null,
    timestamp: new Date().toISOString(),
  });

  // Look up document_case_id from document_jobs for Stage 6 invocation.
  // documentRouterService.completeCandidate consumer interface per Phase 4
  // chunk 1 substrate (Subsystem 1 Ledger-State Candidate Completion).
  const documentCaseId = await lookupDocumentCaseId(input.org_id, input.source_document_id);

  // Board #4 Fork C handler #2 — bank-detail / remittance PRESENCE tripwire.
  // Placed BEFORE the semantic-dup handler (below): both fire post-Stage-5 on
  // vendor_invoice and each RETURNS on trip, so only the first-placed one fires
  // on a document that trips both — a suspected payment redirect is the more
  // dangerous signal to surface, so it wins (and the cheap OCR scan runs before
  // the semantic-dup DB read).
  //
  // DELIBERATE PREEMPTION (documented design consequence): because this branch
  // returns, it preempts BOTH downstream routes for a vendor invoice carrying
  // coordinates — the semantic-dup check (a re-book that ALSO carries
  // coordinates parks as bank_detail_change_suspected ONLY; the duplicate signal
  // is not separately recorded, one open exception per case) AND the
  // unmatched_router_candidate route (an unmatched vendor whose invoice carries
  // coordinates parks here, not at branch c). Both are intended: coordinates-
  // present is the more dangerous signal to surface, and either reason routes to
  // the same human, who sees the full document. Whether the queue should
  // distinguish "coordinates present" from "coordinates present AND a known
  // duplicate" is a product judgment (fraud-first triage at v1).
  //
  // DETECT-AND-ROUTE only (ADR-0007 §Tier 2 read
  // boundary): scans the document's OWN OCR text (the function-scope `ocrText` —
  // the full artifact, the same string the multi-invoice scan uses) for
  // payment-coordinate-shaped content and routes to a human. It reads NO
  // vendor-master control field, extracts/persists NO coordinates (the enqueue
  // carries reason + case + trace only), classifies no fraud, and does NOT
  // discharge the Tier-1 Q28 3(e) bank-detail-change control — a coarse upstream
  // tripwire that grounds PRESENCE, not a proven change (no vendor bank-detail
  // baseline exists at Tier 2). Guard: vendor_invoice only. Two-step park +
  // EXCEPTION_ALREADY_OPEN catch mirror the other short-circuits; reprocess-safe
  // for the same reason (advanceCaseAutomation no-ops at/past target; the
  // re-enqueue is caught). Parks; does not assert auto-commit is off (Wave -1
  // safety note; re-verify when governed auto-commit returns, ADR-0007 §Tier 2 Q78).
  //
  // SEAM NOTE (design §4.2): this handler routes to a human even when the
  // document would ALSO legitimately attach to an existing bill — its trigger is
  // a claim about the document's own content (payment coordinates), true regardless
  // of a matching bill. It intentionally does NOT get the
  // dup handler's provenance gate. Cost: the attachment head pointer is not set
  // (convenience loss, not a wrong disposition) — recovery is deferred (design §7).
  if (
    documentCaseId &&
    classification.result.documentType === 'vendor_invoice' &&
    looksLikeBankDetailPresent(ocrText)
  ) {
    try {
      await advanceCaseAutomation(
        { document_case_id: documentCaseId, target_state: 'classified' },
        ctx,
      );
      await enqueueException(
        {
          document_case_id: documentCaseId,
          source_document_id: input.source_document_id,
          trace_id: input.trace_id,
          exception_reason: 'bank_detail_change_suspected',
        },
        ctx,
      );
    } catch (err) {
      if (
        !(err instanceof ServiceError && err.code === 'EXCEPTION_ALREADY_OPEN')
      ) {
        return {
          status: 'pipeline_failed',
          pipeline_trace,
          proposal_id: null,
          failure_class: classifyFailure(err),
        };
      }
    }
    return {
      status: 'parked_unposted',
      pipeline_trace,
      proposal_id: null,
      failure_class: null,
    };
  }

  // Board #4 Fork C handler #3 — statement-vs-invoice presence tripwire. Placed
  // AFTER the bank-detail handler (fraud-first precedence: coordinates-present is
  // the more dangerous signal) and BEFORE the semantic-dup handler (a statement
  // must not be dup-checked as a bookable bill at all). Fires when the document
  // classifies as vendor_invoice but reads as a STATEMENT — a summary of
  // already-invoiced charges / balance-forward that must not be booked as a single
  // new bill.
  //
  // WHY REACHABLE (grounded first-hand): the Tier A vendor_invoice classifier
  // matches /\bstatement\b/ as a positive header pattern (vendorInvoiceRules.ts:38,
  // "matches Invoice/Bill/Statement headers"), so a vendor statement classifies as
  // vendor_invoice and arrives here; this tripwire routes it to a human under
  // 'statement_not_invoice_suspected'.
  //
  // DETECT-AND-ROUTE only (ADR-0007 §Tier 2 read boundary): scans the document's
  // OWN OCR text (the function-scope `ocrText`) via looksLikeStatementNotInvoice
  // (presence-AND-weak-invoice-signal — a statement-exclusive marker present AND no
  // strong single-invoice identity). It reads NO vendor-master field, extracts /
  // persists nothing, and does NOT read the matcher's composed score (the logged
  // vendor-only scoring bug would make it meaningless). Guard: vendor_invoice only.
  //
  // COVERAGE BOUNDARY (documented): gated on the vendor_invoice label, so it
  // catches only statements that landed on that label. A statement misclassified
  // as receipt/payment_confirmation (Tier A non-invoice-outranks-invoice
  // precedence) sails past — acceptable, those labels do not book into AP.
  //
  // PRECEDENCE (three-wide, compounding drop): bank-detail → statement → dup. Each
  // RETURNS on trip and one-open-exception-per-case holds, so a document that trips
  // more than one parks under the FIRST-placed handler only (statement + bank-detail
  // → bank_detail_change_suspected; statement + dup → statement_not_invoice_suspected).
  // Dropped signals are not separately recorded — accept-for-v1 (fraud-first triage);
  // a secondary non-exception audit note is a scoped follow-up (product-call, mirrors
  // the both-trip ratification).
  //
  // Two-step park (received→classified, then enqueue does classified→needs_review)
  // + EXCEPTION_ALREADY_OPEN catch mirror the other short-circuits; reprocess-safe
  // (advanceCaseAutomation no-ops at/past target; the re-enqueue is caught). Writes
  // NOTHING before the enqueue → clean idempotent re-park. Parks; does not assert
  // auto-commit is off (Wave -1 safety; re-verify when governed auto-commit returns,
  // ADR-0007 §Tier 2 Q78).
  //
  // SEAM NOTE (design §4.2): this handler routes to a human even when the
  // document would ALSO legitimately attach to an existing bill — its trigger is
  // a claim about the document's own content (statement shape), true regardless
  // of a matching bill. It intentionally does NOT get the
  // dup handler's provenance gate. Cost: the attachment head pointer is not set
  // (convenience loss, not a wrong disposition) — recovery is deferred (design §7).
  if (
    documentCaseId &&
    classification.result.documentType === 'vendor_invoice' &&
    looksLikeStatementNotInvoice(ocrText)
  ) {
    try {
      await advanceCaseAutomation(
        { document_case_id: documentCaseId, target_state: 'classified' },
        ctx,
      );
      await enqueueException(
        {
          document_case_id: documentCaseId,
          source_document_id: input.source_document_id,
          trace_id: input.trace_id,
          exception_reason: 'statement_not_invoice_suspected',
        },
        ctx,
      );
    } catch (err) {
      if (
        !(err instanceof ServiceError && err.code === 'EXCEPTION_ALREADY_OPEN')
      ) {
        return {
          status: 'pipeline_failed',
          pipeline_trace,
          proposal_id: null,
          failure_class: classifyFailure(err),
        };
      }
    }
    return {
      status: 'parked_unposted',
      pipeline_trace,
      proposal_id: null,
      failure_class: null,
    };
  }

  // Board #4 Fork C handler #1 — semantic-duplicate detection. Between Stage 5
  // (vendor resolved) and Stage 6 (matcher): if the extracted invoice already
  // exists as a LIVE, DOCUMENT-SOURCED bill for the matched vendor — a re-book
  // of an already-booked invoice that Stage-0 dedupByHash (byte-identity)
  // misses — route to a human under 'duplicate_invoice_suspected' and SKIP
  // Stages 6-7. Fires EVEN under confident extraction: the danger is orthogonal
  // to extraction confidence (that is the handler's whole point). Guard: only
  // vendor_invoice docs, only when the vendor matched (an unmatched vendor
  // already routes to needs_review via router branch c), only when an invoice
  // number was extracted (a null number can't be a keyed duplicate), AND only
  // when the matched bill itself is document-sourced (a live primary_invoice
  // link) — see the provenance-gate comment at the `if (dup...)` check below.
  // A matching bill with no live link is manual/PO/override/voided origin, so
  // the incoming invoice is a legitimate first-arrival attachment that must
  // fall through to Stage 6 (INV-WORKFLOW-002 ATTACHMENT EXIT), not park as a
  // false-positive duplicate.
  //
  // Two-step park (received→classified, then enqueue does classified→needs_review)
  // mirrors the multi_invoice / unknown_document_type short-circuits: the case is
  // at 'received' here (Stage 6.5 owns the classified advance), enqueueException's
  // RPC requires classified|matched, and a direct classified→needs_review advance
  // is refused (Subsystem-2-owned). BOTH steps are reprocess-safe: on a re-run
  // (the different-bytes semantic duplicate that dodges Stage-0 dedup — this
  // handler's raison d'être) the case is already at needs_review, so
  // advanceCaseAutomation('classified') is an idempotent no-op (at/past target
  // per PIPELINE_ORDER, documentCaseService.ts:361 — it does NOT attempt, and get
  // refused for, a needs_review→classified back-advance), and the re-enqueue
  // throws EXCEPTION_ALREADY_OPEN (one open exception per case), caught below.
  // Unlike multi_invoice this handler writes NOTHING before the enqueue (no
  // α-UNIQUE reprocess residual), so a reprocessed duplicate re-parks cleanly
  // rather than stranding to pipeline_failed. (Proven: semanticDuplicatePipeline
  // Wiring reprocess case.)
  //
  // This branch PARKS; it does not assert auto-commit is off. The never-mis-post
  // guarantee rests partly on the Wave -1 bleed-stop being disabled and MUST be
  // re-verified when governed auto-commit returns post-V1 (ADR-0007 §Tier 2 Q78).
  const rawInvoiceNumber = (
    extracted.fields as { vendor_invoice_number?: unknown }
  ).vendor_invoice_number;
  const extractedInvoiceNumber =
    typeof rawInvoiceNumber === 'string' && rawInvoiceNumber.length > 0
      ? rawInvoiceNumber
      : null;
  if (
    documentCaseId &&
    classification.result.documentType === 'vendor_invoice' &&
    vendorMatch.vendor_id &&
    extractedInvoiceNumber
  ) {
    const dup = await findLiveBillByVendorAndNumber({
      org_id: input.org_id,
      vendor_id: vendorMatch.vendor_id,
      bill_number: extractedInvoiceNumber,
    });
    // Provenance gate (design §4.1): fire ONLY when the matched live bill is
    // itself document-sourced (a live primary_invoice link). A matching bill with
    // no live link is manual/PO/override/voided origin → the incoming invoice is a
    // legitimate first-arrival attachment → fall through to Stage 6 (INV-WORKFLOW-002
    // ATTACHMENT EXIT). Distinguishes re-book (fire) from attachment (defer).
    if (dup.matched_bill_id && dup.is_document_sourced) {
      try {
        await advanceCaseAutomation(
          { document_case_id: documentCaseId, target_state: 'classified' },
          ctx,
        );
        await enqueueException(
          {
            document_case_id: documentCaseId,
            source_document_id: input.source_document_id,
            trace_id: input.trace_id,
            exception_reason: 'duplicate_invoice_suspected',
          },
          ctx,
        );
      } catch (err) {
        if (
          !(err instanceof ServiceError && err.code === 'EXCEPTION_ALREADY_OPEN')
        ) {
          return {
            status: 'pipeline_failed',
            pipeline_trace,
            proposal_id: null,
            failure_class: classifyFailure(err),
          };
        }
      }
      return {
        status: 'parked_unposted',
        pipeline_trace,
        proposal_id: null,
        failure_class: null,
      };
    }
  }

  // Stage 6 — match_against_existing_state per ADR-0014 §1 canonical
  // (brief Task 7.3a.5 brief-named "Stage 5 relationship-candidate";
  // ADR canonical Stage 6 per Iteration 2 Step 21 RATIFIED).
  // documentRouterService.completeCandidate is Subsystem 1 per ADR-0018
  // §item 2.
  //
  // Phase 8 chunk 10: synthCtxForRouter shim retired. completeCandidate now
  // accepts SystemActorServiceContext directly (documentRouterService widened
  // to the ServiceContext | SystemActorServiceContext union), so the
  // orchestrator's system-actor ctx passes through unchanged. The router path
  // does not run withInvariants, so no authorization semantics change here.
  let relationshipCandidates: RelationshipCandidate[] = [];
  if (documentCaseId) {
    try {
      const candidates = await withFailureClassification(
        'match_against_existing_state',
        input.source_document_id,
        ctx,
        () =>
          completeCandidate(
            {
              document_case_id: documentCaseId,
              source_document_id: input.source_document_id,
              document_type: classification.result.documentType,
              classification_confidence: classification.result.confidence,
              extracted_fields: extracted.fields,
              vendor_match: vendorMatch.vendor_id
                ? {
                    vendor_id: vendorMatch.vendor_id,
                    confidence: vendorMatch.confidence,
                    match_type: vendorMatch.match_type,
                    candidate_alternatives: [],
                  }
                : null,
              trace_id: input.trace_id,
            },
            ctx,
          ),
      );
      relationshipCandidates = candidates.map((c) => ({
        id: c.id,
        document_case_id: c.document_case_id,
        source_document_id: c.source_document_id,
        linked_entity_type: c.linked_entity_type,
        linked_entity_id: c.linked_entity_id,
        link_role: c.link_role,
        confidence_score: c.confidence_score,
      }));
    } catch (err) {
      return {
        status: 'pipeline_failed',
        pipeline_trace,
        proposal_id: null,
        failure_class: classifyFailure(err),
      };
    }
  }
  pipeline_trace.push({
    stage_name: 'match_against_existing_state',
    input_hash: crypto
      .createHash('sha256')
      .update(JSON.stringify({ documentCaseId, vendorMatch }))
      .digest('hex'),
    output_hash: crypto
      .createHash('sha256')
      .update(JSON.stringify(relationshipCandidates))
      .digest('hex'),
    model: null,
    timestamp: new Date().toISOString(),
  });

  // Subsystem-1-grade audit trail per ADR-0018 §2 lines 492-504. Emitted
  // alongside the orchestrator-grade match_against_existing_state record
  // above (ADR-0014 §1 canonical stage name) per chunk 4 brief Task 1
  // partial-information value pick (a): both records ship in the same
  // pipeline_trace accumulator. input_hash captures classifier output
  // (document_type + classification_confidence + extracted_fields) plus
  // the domain-state snapshot fingerprint (vendor_match.vendor_id is the
  // Phase 5 substrate key under the document_case_id scope); output_hash
  // captures the candidate set. Subsystem 3 re-runs produce new records
  // per ADR-0011 §9 supersession discipline.
  pipeline_trace.push({
    stage_name: 'router_match_against_state',
    input_hash: crypto
      .createHash('sha256')
      .update(
        JSON.stringify({
          document_case_id: documentCaseId,
          document_type: classification.result.documentType,
          classification_confidence: classification.result.confidence,
          extracted_fields: extracted.fields,
          vendor_match: vendorMatch,
        }),
      )
      .digest('hex'),
    output_hash: crypto
      .createHash('sha256')
      .update(JSON.stringify(relationshipCandidates))
      .digest('hex'),
    model: null,
    timestamp: new Date().toISOString(),
  });

  // Stage 6.5 — route_to_review (Wave 6 D2.1 T3).
  //
  // INV-WORKFLOW-002 (terminal-disposition completeness / no silent
  // drops) — the enforcing routing block; leaf at ledger_truth_model.md.
  // Post-hoc at-decision advancement: the case advances
  // received→extracting→classified (advanceCaseAutomation, the
  // automation-owned chain), then Subsystem 2 (resolveCandidates) routes
  // classified→matched (branch a, clean match — head pointer + rich
  // decision-record audit) or classified→needs_review (branches b/c —
  // ambiguous/unmatched, via record_router_decision + the cross-service
  // enqueueException). Branch-(a) cases take the matched→needs_review
  // hand-off at the park exits below. Every decision outcome therefore
  // reaches needs_review — the pipeline's terminal hand-off to the human
  // (this realizes INV-5's human-review destination; INV-5 is
  // cross-referenced, not re-registered). A failure here returns
  // pipeline_failed and strands the case at its last persisted state —
  // the named sweep-recoverable residual (leaf Residual (iii)). No new
  // pipeline_trace record: pipeline_trace carries the ADR-0014 §1
  // extraction-stage canon; the routing is audited via audit_log + the
  // Subsystem-2 decision records.
  if (documentCaseId) {
    try {
      await advanceCaseAutomation(
        { document_case_id: documentCaseId, target_state: 'classified' },
        ctx,
      );
      await resolveCandidates(
        { document_case_id: documentCaseId, trace_id: input.trace_id },
        ctx,
      );
    } catch (err) {
      return {
        status: 'pipeline_failed',
        pipeline_trace,
        proposal_id: null,
        failure_class: classifyFailure(err),
      };
    }
  }

  // Stage 7 — build_proposal per ADR-0014 §1 canonical (brief Task
  // 7.3a.6 brief-named "Stage 6 proposal builder"; ADR canonical Stage 7).
  // Chunk 7.3a ships ProposedEntryCard-only routes; born-paid bundle +
  // receipt + payment_confirmation no-cited-bill routes defer to chunk
  // 7.3b per Iteration 2 Option γ.
  let proposal;
  try {
    proposal = await withFailureClassification(
      'build_proposal',
      input.source_document_id,
      ctx,
      async () =>
        buildProposal({
          source_document_id: input.source_document_id,
          classification: classification.result,
          extractedFields: extracted.fields,
          vendorMatch: vendorMatch.vendor_id ? vendorMatch : null,
          relationshipCandidates,
          trace_id: input.trace_id,
        }),
    );
  } catch (err) {
    return {
      status: 'pipeline_failed',
      pipeline_trace,
      proposal_id: null,
      failure_class: classifyFailure(err),
    };
  }
  pipeline_trace.push({
    stage_name: 'build_proposal',
    input_hash: crypto
      .createHash('sha256')
      .update(JSON.stringify(extracted.fields))
      .digest('hex'),
    output_hash: crypto
      .createHash('sha256')
      .update(JSON.stringify(proposal))
      .digest('hex'),
    model: null,
    timestamp: new Date().toISOString(),
  });

  // Ring 2B Seam-1 (ADR-0027 Decision 5/6): shadow rule evaluation. Diagnostic
  // only — gated (default off), fail-safe (never throws), transaction-isolated,
  // and BEFORE the live auto-commit below so it cannot influence it (A1a — no
  // auto-post). Card-only: bundles + attachment cards are skipped inside.
  await shadowEvaluateRules(
    {
      proposalKind: proposal.kind,
      vendorId: vendorMatch.vendor_id,
      org_id: input.org_id,
      source_document_id: input.source_document_id,
      trace_id: input.trace_id,
    },
    ctx,
  );

  // Stage 7 commit composite per chunk 7.3b Task 7.3b.5 + Step 18.
  //
  // Auto-commit arc (ADR-0007 Q78 Option A + Path X): the synthCtxForCommit
  // shim is RETIRED. The orchestrator's SystemActorServiceContext (ctx) is
  // passed directly to the commit-path withInvariants sites below;
  // withInvariants bypasses the identity invariants for the system actor and
  // adapts to the seeded service account (SYSTEM_ACTOR_USER_ID) so created_by
  // + audit resolve to a real auth.users identity. That Q78 mechanism is
  // intact, but its EXERCISE is disabled by the Wave -1 A-now bleed-stop: the
  // kind branches below do NOT call the commit* sites — matched proposals PARK
  // (status='parked_unposted'), no ledger write. Auto-commit returns per-rule
  // post-V1 (ADR-0007 §Tier 2 Q78 V1-re-scoping). See ADR-0007 §Tier 2 (Q78
  // resolution) + service-layer.md Candidate #11 (RETIRED).

  // Branch on ProposalResult.kind (post-chunk-7.3b activation 3-value
  // union). Per chunk 7.3 brief §3.5 Task 7.3b.5 + Step 18:
  //   - 'proposed_entry_card': commit via billService.post (post_bill)
  //     or paymentService.record (record_bill_payment) per discriminator.
  //   - 'proposed_attachment_card': NO service commit (ProposedAttachment
  //     is non-ledger per ADR-0011 §11); emit via canvasDirective at
  //     consumer boundary (outside chunk 7.3b scope).
  //   - 'proposed_mutation_bundle': sequential withInvariants per child
  //     mutation per Step 19 born_paid_bill bundle atomicity; on
  //     partial-commit, route second child to exception queue with
  //     manual_route reconciliation marker per Iteration 2 Note 2
  //     default disposition (bundle_partial_commit_reconciliation_pending
  //     absent from ExceptionReasonSchema per Phase A verification — (μ)
  //     sub-grain N=5 banking).

  if (proposal.kind === 'proposed_entry_card') {
    // Wave -1 A-now bleed-stop (ADR-0007 §Tier 2 "V1 re-scoping of the Q78
    // auto-commit exercise"): the ungoverned auto-post is DISABLED.
    // commitProposedEntryCard (preserved below) is intentionally NOT called —
    // no withInvariants(billService.post / paymentService.record), no ledger
    // write. The matched card is built and parked; the document_case stays
    // state='received'. Interim: parked cases are state-indistinguishable from
    // freshly-arrived ones until the Wave 6 review surface + matrix-advancement
    // + backlog sweep land (see the change-spec). Governed auto-commit returns
    // per-rule post-V1 (rung + confidence + eval + real coding), which re-wires
    // this branch back to commitProposedEntryCard.
    //
    // ADR-0032 R1 (Canonical Autonomy Gate Seam): record the autonomy-gate
    // disposition for this autonomous attempt, THEN park unconditionally.
    // recordAutonomyGateAttempt is fail-safe (never throws), so the park return
    // below is reached on every path — recording does not decide (D-0032.2).
    await recordAutonomyGateAttempt(
      {
        proposalKind: 'proposed_entry_card',
        vendorId: vendorMatch.vendor_id,
        org_id: input.org_id,
        source_document_id: input.source_document_id,
        trace_id: input.trace_id,
      },
      ctx,
    );
    // Wave 6 D2.1 T3 — the matched→needs_review hand-off
    // (INV-WORKFLOW-002). Reached only after a successful Stage-6.5
    // resolveCandidates, so the case is at matched (branch a → one hop)
    // or needs_review (branches b/c → idempotent no-op); never
    // classified (a Stage-6.5 failure returned pipeline_failed above),
    // so the single-ownership refusal cannot fire here. Plain
    // state-transition audit — the router decision-record was already
    // written by Subsystem 2.
    if (documentCaseId) {
      try {
        await advanceCaseAutomation(
          { document_case_id: documentCaseId, target_state: 'needs_review' },
          ctx,
        );
      } catch (err) {
        return {
          status: 'pipeline_failed',
          pipeline_trace,
          proposal_id: null,
          failure_class: classifyFailure(err),
        };
      }
    }
    return {
      status: 'parked_unposted',
      pipeline_trace,
      proposal_id: null,
      failure_class: null,
    };
  }

  if (proposal.kind === 'proposed_attachment_card') {
    // Non-ledger attach proposal per ADR-0011 §11. At V1 the card is
    // built but neither persisted nor surfaced (payload "structurally
    // available… not yet surfaced via IngestDocumentOutput"), so nothing
    // commits here — it is a pending attach-proposal. Wave 6 D2.1 T4:
    // the case takes the same matched→needs_review hand-off as the park
    // branches (INV-5: everything reviews at V1; the attach proposal is
    // confirmed at the D3 review surface — pre-T4 this exit had NO
    // hand-off and stranded branch-(a) cases at matched), and the status
    // is reconciled to 'parked_unposted'. 'committed' is reserved for
    // the post-V1 governed auto-commit re-wire; its appearance at V1 is
    // a bleed-stop-regression signal.
    if (documentCaseId) {
      try {
        await advanceCaseAutomation(
          { document_case_id: documentCaseId, target_state: 'needs_review' },
          ctx,
        );
      } catch (err) {
        return {
          status: 'pipeline_failed',
          pipeline_trace,
          proposal_id: null,
          failure_class: classifyFailure(err),
        };
      }
    }
    return {
      status: 'parked_unposted',
      pipeline_trace,
      proposal_id: null,
      failure_class: null,
    };
  }

  // proposal.kind === 'proposed_mutation_bundle'
  // Wave -1 A-now bleed-stop (see the proposed_entry_card branch above):
  // commitProposedMutationBundle (preserved below) is intentionally NOT called —
  // no ledger write; the born-paid bundle is parked. Re-wired post-V1 with
  // governed auto-commit.
  //
  // ADR-0032 R1 (Canonical Autonomy Gate Seam): record one autonomy-gate attempt
  // for this autonomous bundle (one row per bundle attempt — OQ-2; null disposition
  // — card-only deferral), THEN park unconditionally. Fail-safe (D-0032.2).
  await recordAutonomyGateAttempt(
    {
      proposalKind: 'proposed_mutation_bundle',
      vendorId: vendorMatch.vendor_id,
      org_id: input.org_id,
      source_document_id: input.source_document_id,
      trace_id: input.trace_id,
    },
    ctx,
  );
  // Wave 6 D2.1 T3 — matched→needs_review hand-off (INV-WORKFLOW-002);
  // see the proposed_entry_card hand-off above for the precondition
  // (post-resolveCandidates: matched → hop, needs_review → no-op,
  // classified unreachable).
  if (documentCaseId) {
    try {
      await advanceCaseAutomation(
        { document_case_id: documentCaseId, target_state: 'needs_review' },
        ctx,
      );
    } catch (err) {
      return {
        status: 'pipeline_failed',
        pipeline_trace,
        proposal_id: null,
        failure_class: classifyFailure(err),
      };
    }
  }
  return {
    status: 'parked_unposted',
    pipeline_trace,
    proposal_id: null,
    failure_class: null,
  };
}

/**
 * Stage 7 commit for proposed_entry_card. Branches on the card's
 * proposed_action discriminator. Returns the committed entity id
 * (bill_id or payment_id) on success; returns null on best-effort
 * failure (missing fields, lookup failures, service-level rejection).
 *
 * Per INV-DOC-001 propagation discipline: primary_document_id =
 * input.source_document_id is passed verbatim to billService.post so
 * the bill commit satisfies the evidence-completeness gate at
 * billService.ts:285+.
 *
 * PRESERVED FOR POST-V1 GOVERNED AUTO-COMMIT (ADR-0007 §Tier 2 "V1 re-scoping of
 * the Q78 auto-commit exercise", ratified 2026-05-31). Intentionally unreferenced
 * during the Wave -1 bleed-stop — the commit composite no longer calls it; re-wired
 * behind the gate when governed auto-commit returns (rung + confidence + eval +
 * real coding). Do not delete (refinement 2 of the change-spec).
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- preserved for post-V1 re-wire; see JSDoc above
async function commitProposedEntryCard(
  card: unknown,
  input: IngestDocumentInput,
  commitCtx: SystemActorServiceContext,
): Promise<string | null> {
  if (!card || typeof card !== 'object') return null;
  const c = card as Record<string, unknown>;
  const action = c.proposed_action;

  try {
    if (action === 'post_bill') {
      const billInput = await buildPostBillInput(c, input);
      if (!billInput) return null;
      const result = await withInvariants(billService.post, {
        action: 'bill.post',
      })(billInput, commitCtx);
      return result.bill_id;
    }

    if (action === 'record_bill_payment') {
      const paymentInput = await buildRecordPaymentInput(c, input);
      if (!paymentInput) return null;
      const result = await withInvariants(paymentService.record, {
        // ActionName binding: 'payment.record'. The dedicated permission is
        // seeded at Phase 8 chunk 8 (migration 20240162
        // role_permissions_payment_record; controller + ap_specialist).
        // Resolves the (μ) sub-grain N=8 placeholder where this site bound
        // 'bill.record_payment' because 'payment.record' was unseeded at
        // chunk 7.3b close.
        action: 'payment.record',
      })(paymentInput, commitCtx);
      return result.payment_id;
    }
  } catch {
    // Best-effort commit; service-level failures (EVIDENCE_INCOMPLETE,
    // POST_FAILED, lookup errors) are logged at the service layer and
    // result in proposal_id=null at the orchestrator boundary. The
    // pipeline_trace records the build_proposal stage; downstream
    // surfacing of commit failures is via service-level audit_log
    // emissions (recordMutation), not via IngestDocumentOutput.
    return null;
  }

  // Defensive guards (unknown_document_type / unmatched) return null.
  return null;
}

/**
 * Stage 7 commit for proposed_mutation_bundle (born_paid_bill). Per
 * ADR-0012 + Step 19 sequential best-effort: post_bill commits first;
 * if successful, record_bill_payment commits second. On partial-commit
 * (first child succeeds + second fails), the first child's commit
 * stands and the second routes to exception queue with manual_route +
 * reconciliation_context audit metadata (per Iteration 2 Note 2 default
 * disposition; reserved value 'bundle_partial_commit_reconciliation_
 * pending' absent from ExceptionReasonSchema per Phase A verification).
 *
 * PRESERVED FOR POST-V1 GOVERNED AUTO-COMMIT (ADR-0007 §Tier 2 "V1 re-scoping of
 * the Q78 auto-commit exercise", ratified 2026-05-31). Intentionally unreferenced
 * during the Wave -1 bleed-stop — the commit composite no longer calls it; re-wired
 * behind the gate when governed auto-commit returns. Do not delete (refinement 2).
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- preserved for post-V1 re-wire; see JSDoc above
async function commitProposedMutationBundle(
  bundle: unknown,
  input: IngestDocumentInput,
  commitCtx: SystemActorServiceContext,
): Promise<{ first_child_id: string | null; second_child_id: string | null }> {
  if (!bundle || typeof bundle !== 'object') {
    return { first_child_id: null, second_child_id: null };
  }
  const b = bundle as Record<string, unknown>;
  const children = b.child_mutations;
  if (!Array.isArray(children) || children.length !== 2) {
    return { first_child_id: null, second_child_id: null };
  }
  const [postBillChild, recordPaymentChild] = children as [
    Record<string, unknown>,
    Record<string, unknown>,
  ];

  // First child: post_bill.
  let billId: string | null = null;
  try {
    const billInput = await buildPostBillInputFromChildMutation(
      postBillChild,
      input,
    );
    if (billInput) {
      const result = await withInvariants(billService.post, {
        action: 'bill.post',
      })(billInput, commitCtx);
      billId = result.bill_id;
    }
  } catch {
    return { first_child_id: null, second_child_id: null };
  }

  if (!billId) {
    return { first_child_id: null, second_child_id: null };
  }

  // Second child: record_bill_payment. Best-effort; on failure post-
  // first-success, the first child's commit stands. Reconciliation
  // marker emission for partial-commit is deferred (Phase 7 retro
  // candidate: 'bundle_partial_commit_reconciliation_pending' enum
  // addition + audit metadata writer).
  let paymentId: string | null = null;
  try {
    const paymentInput = await buildRecordPaymentInputFromChildMutation(
      recordPaymentChild,
      input,
      billId,
    );
    if (paymentInput) {
      const result = await withInvariants(paymentService.record, {
        // ActionName binding: 'payment.record'. The dedicated permission is
        // seeded at Phase 8 chunk 8 (migration 20240162
        // role_permissions_payment_record; controller + ap_specialist).
        // Resolves the (μ) sub-grain N=8 placeholder where this site bound
        // 'bill.record_payment' because 'payment.record' was unseeded at
        // chunk 7.3b close.
        action: 'payment.record',
      })(paymentInput, commitCtx);
      paymentId = result.payment_id;
    }
  } catch {
    paymentId = null;
  }

  return { first_child_id: billId, second_child_id: paymentId };
}

/**
 * Build PostBillInput from a proposed_entry_card payload + orchestrator
 * input. Looks up fiscal_period_id (current open period) and
 * ap_control_account_id (first liability account named AP) from the
 * org's chart-of-accounts substrate. Returns null on lookup failure or
 * missing required extracted fields.
 *
 * Per INV-DOC-001: primary_document_id = input.source_document_id;
 * billService.post's evidence-completeness gate at billService.ts:285+
 * requires this OR override_evidence_completeness=true.
 */
// Wave 6 D3 T6: exported (additive named export, the extractVendorFields
// precedent) — the approve→post route reuses the SAME input builder the
// pipeline's preserved commit path uses; a copy would drift.
export async function buildPostBillInput(
  card: Record<string, unknown>,
  input: IngestDocumentInput,
): Promise<PostBillInputRaw | null> {
  const extracted = card.extracted_fields as Record<string, unknown> | undefined;
  const vendorMatch = card.vendor_match as
    | { vendor_id: string | null }
    | null
    | undefined;
  if (!extracted || !vendorMatch || !vendorMatch.vendor_id) return null;

  const amountStr =
    typeof extracted.amount === 'string' ? extracted.amount : null;
  if (!amountStr) return null;

  const issueDate =
    typeof extracted.accounting_date === 'string'
      ? extracted.accounting_date
      : typeof extracted.issue_date === 'string'
        ? extracted.issue_date
        : null;
  if (!issueDate) return null;

  const lookups = await lookupBillCommitDefaults(input.org_id);
  if (!lookups) return null;

  // Wave 6 D4 (brief D-1/D-4): the matched rule's default_account_id
  // when an active vendor rule resolves and validates; the org default
  // otherwise. Null on every fallback — strictly additive.
  const ruleAccountId = await resolveRuleDefaultAccount(
    input.org_id,
    vendorMatch.vendor_id,
    input.trace_id,
  );

  return {
    org_id: input.org_id,
    vendor_id: vendorMatch.vendor_id,
    bill_number:
      typeof extracted.vendor_invoice_number === 'string'
        ? extracted.vendor_invoice_number
        : null,
    issue_date: issueDate,
    due_date:
      typeof extracted.due_date === 'string' ? extracted.due_date : null,
    payment_terms_days: null,
    purchase_order_id: null,
    currency: 'CAD',
    amount_original: amountStr,
    amount_cad: amountStr,
    fx_rate: '1',
    tax_amount_total: '0',
    bill_lines: [
      {
        account_id: ruleAccountId ?? lookups.default_expense_account_id,
        description: 'Pipeline-committed bill line',
        amount: amountStr,
        amount_original: amountStr,
        amount_cad: amountStr,
        tax_code_id: null,
        line_number: 1,
      },
    ],
    fiscal_period_id: lookups.fiscal_period_id,
    entry_date: issueDate,
    ap_control_account_id: lookups.ap_control_account_id,
    primary_document_id: input.source_document_id,
    override_evidence_completeness: false,
  };
}

async function buildPostBillInputFromChildMutation(
  child: Record<string, unknown>,
  input: IngestDocumentInput,
): Promise<PostBillInputRaw | null> {
  const params = child.params as Record<string, unknown> | undefined;
  if (!params) return null;

  const amountStr =
    typeof params.amount === 'string' ? params.amount : null;
  if (!amountStr) return null;

  const vendorId =
    typeof params.vendor_id === 'string' ? params.vendor_id : null;
  if (!vendorId) return null;

  const lookups = await lookupBillCommitDefaults(input.org_id);
  if (!lookups) return null;

  const issueDate =
    typeof params.accounting_date === 'string'
      ? params.accounting_date
      : new Date().toISOString().slice(0, 10);

  return {
    org_id: input.org_id,
    vendor_id: vendorId,
    bill_number:
      typeof params.invoice_number === 'string'
        ? params.invoice_number
        : null,
    issue_date: issueDate,
    due_date: null,
    payment_terms_days: null,
    purchase_order_id: null,
    currency: 'CAD',
    amount_original: amountStr,
    amount_cad: amountStr,
    fx_rate: '1',
    tax_amount_total: '0',
    bill_lines: [
      {
        account_id: lookups.default_expense_account_id,
        description: 'Pipeline born-paid-bundle bill line',
        amount: amountStr,
        amount_original: amountStr,
        amount_cad: amountStr,
        tax_code_id: null,
        line_number: 1,
      },
    ],
    fiscal_period_id: lookups.fiscal_period_id,
    entry_date: issueDate,
    ap_control_account_id: lookups.ap_control_account_id,
    primary_document_id: input.source_document_id,
    override_evidence_completeness: false,
  };
}

// Wave 6 D3 T6: exported — same rationale as buildPostBillInput above.
export async function buildRecordPaymentInput(
  card: Record<string, unknown>,
  input: IngestDocumentInput,
): Promise<RecordPaymentInputRaw | null> {
  const extracted = card.extracted_fields as Record<string, unknown> | undefined;
  const matchedCandidate = card.matched_candidate as
    | { linked_entity_type: string; linked_entity_id: string | null }
    | null
    | undefined;
  if (!extracted) return null;

  // bill_id from matched candidate (linked_entity_type='bill', non-null
  // linked_entity_id) or from extracted.cited_bill_id if present.
  // Scenario A inferred-target candidates carry linked_entity_id=null;
  // they fall through to the cited_bill_id check, then to the null
  // early-return below if no bill_id source is available. Subsystem 3
  // T1 dispatch matures inferred-target candidates into bills via
  // billService.post at the orchestrator's Stage 7 commit composite
  // (separately from this helper).
  let billId: string | null = null;
  if (
    matchedCandidate &&
    matchedCandidate.linked_entity_type === 'bill' &&
    matchedCandidate.linked_entity_id !== null
  ) {
    billId = matchedCandidate.linked_entity_id;
  } else if (typeof extracted.cited_bill_id === 'string') {
    billId = extracted.cited_bill_id;
  }
  if (!billId) return null;

  const amountStr =
    typeof extracted.amount === 'string' ? extracted.amount : null;
  if (!amountStr) return null;

  const lookups = await lookupPaymentCommitDefaults(input.org_id);
  if (!lookups) return null;

  const paymentDate =
    typeof extracted.payment_date === 'string'
      ? extracted.payment_date
      : new Date().toISOString().slice(0, 10);

  return {
    org_id: input.org_id,
    bill_id: billId,
    payment_method: normalizePaymentMethod(extracted.payment_method),
    payment_date: paymentDate,
    amount_cad: amountStr,
    reference_number:
      typeof extracted.payment_reference === 'string'
        ? extracted.payment_reference
        : null,
    fiscal_period_id: lookups.fiscal_period_id,
    entry_date: paymentDate,
    ap_control_account_id: lookups.ap_control_account_id,
    cash_account_id: lookups.cash_account_id,
  };
}

async function buildRecordPaymentInputFromChildMutation(
  child: Record<string, unknown>,
  input: IngestDocumentInput,
  billId: string,
): Promise<RecordPaymentInputRaw | null> {
  const params = child.params as Record<string, unknown> | undefined;
  if (!params) return null;

  const amountStr =
    typeof params.amount === 'string' ? params.amount : null;
  if (!amountStr) return null;

  const lookups = await lookupPaymentCommitDefaults(input.org_id);
  if (!lookups) return null;

  const paymentDate =
    typeof params.payment_date === 'string'
      ? params.payment_date
      : new Date().toISOString().slice(0, 10);

  return {
    org_id: input.org_id,
    bill_id: billId,
    payment_method: normalizePaymentMethod(params.payment_method),
    payment_date: paymentDate,
    amount_cad: amountStr,
    reference_number:
      typeof params.payment_reference === 'string'
        ? params.payment_reference
        : null,
    fiscal_period_id: lookups.fiscal_period_id,
    entry_date: paymentDate,
    ap_control_account_id: lookups.ap_control_account_id,
    cash_account_id: lookups.cash_account_id,
  };
}

/**
 * Normalize a free-text payment_method from extracted fields into the
 * PaymentMethodSchema enum ('check' | 'eft' | 'wire' | 'cash' | 'other').
 * Unrecognized values default to 'other' per the catch-all convention.
 */
function normalizePaymentMethod(
  raw: unknown,
): 'check' | 'eft' | 'wire' | 'cash' | 'other' {
  if (typeof raw !== 'string') return 'other';
  const lower = raw.toLowerCase().trim();
  if (lower === 'check' || lower === 'cheque') return 'check';
  if (lower === 'eft' || lower === 'ach' || lower === 'transfer') return 'eft';
  if (lower === 'wire') return 'wire';
  if (lower === 'cash') return 'cash';
  return 'other';
}

// lookupBillCommitDefaults / resolveRuleDefaultAccount /
// lookupPaymentCommitDefaults / lookupDocumentCaseId hoisted to
// services (Arc 2 T4, ADR-0020 App. A): commitDefaultsReadService,
// ruleOutcomeReadService (D4 resolver, org-scoped, with its full
// D-1..D-4 commentary), extractionReadService (case-id lookup).
// First three: verbatim bodies, call sites unchanged. The case-id
// lookup was org-scoped at Class D T5 (2026-06-06) — required
// org_id first param; both call sites below pass input.org_id.

/**
 * Extract vendor identity fields from Stage 4 extraction output per
 * ADR-0007 §Tier 2 Read boundary: name + tax_id + email ONLY.
 */
// Wave 6 D3 T5: exported (additive named export, the *TierA-export
// pattern) so reviewPreview.ts reuses the SAME vendor-field projection
// the pipeline uses — a private copy would drift.
export function extractVendorFields(fields: Record<string, unknown>): {
  vendor_name?: string;
  vendor_text?: string;
  merchant_text?: string;
  tax_id?: string;
  email?: string;
} {
  return {
    vendor_name:
      typeof fields.vendor_name === 'string' ? fields.vendor_name : undefined,
    vendor_text:
      typeof fields.vendor_text === 'string' ? fields.vendor_text : undefined,
    merchant_text:
      typeof fields.merchant_text === 'string' ? fields.merchant_text : undefined,
    tax_id: typeof fields.tax_id === 'string' ? fields.tax_id : undefined,
    email: typeof fields.email === 'string' ? fields.email : undefined,
  };
}

function classifyFailure(err: unknown): PipelineFailureClass {
  if (err instanceof ServiceError) {
    if (err.code === 'PIPELINE_UNAVAILABLE') return 'unavailable';
    if (err.code === 'PIPELINE_TRANSIENT_EXHAUSTED') return 'transient_exhausted';
    if (err.code === 'NOT_FOUND') return 'permanent_malformed';
  }
  return 'transient_exhausted';
}
