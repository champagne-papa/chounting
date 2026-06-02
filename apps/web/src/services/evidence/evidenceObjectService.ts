// services/evidence/evidenceObjectService.ts
//
// ADR-0033 (Canonical Evidence Object Model, V1 Wave 2). The assembly/read
// service: assembles a TRANSIENT canonical evidence object from the live,
// fragmented evidence substrate by reference (D-0033.1/.3, assemble-on-read).
//
// READ service (no mutation): not withInvariants-wrapped; inline org-authz
// (ctx.caller.org_ids), adminClient (INV-SERVICE-002). It writes NO
// evidence_objects row (the table is inert at Wave 2; persistence + the
// row-producer + the write-posture are Wave 6). It never writes the ledger.
//
// Facet scoping (Wave-2 first slice):
//  - documents/extractions are SUBJECT-scoped (source_document_links.
//    linked_entity_id = subject_id), robust.
//  - decisions/approvals are REFERENCED by the trace_ids on the subject's
//    links (the evidence trace) — by-reference, not deeply re-validated. The
//    Wave-6 producer refines subject↔trace scoping when persistence lands.

import { adminClient } from '@/db/adminClient';
import { ServiceError } from '@/services/errors/ServiceError';
import { loggerWith } from '@/shared/logger/pino';
import type { ServiceContext } from '@/services/middleware/serviceContext';
import { assessCompleteness } from '@/core/evidence/completeness';
import {
  CanonicalEvidenceObjectSchema,
  type CanonicalEvidenceObject,
  type EvidenceDocumentRef,
  type EvidenceExtractionRef,
  type EvidenceDecisionRef,
  type EvidenceApprovalRef,
} from '@/shared/schemas/evidence/canonicalEvidenceObject.schema';

export interface AssembleEvidenceInput {
  subject_type: string;
  subject_id: string;
  org_id: string;
}

async function assemble(
  input: AssembleEvidenceInput,
  ctx: ServiceContext,
): Promise<CanonicalEvidenceObject> {
  const log = loggerWith({ trace_id: ctx.trace_id });

  // Inline read-authz (read functions are not withInvariants-wrapped; INV-SERVICE-001
  // asymmetry). adminClient bypasses RLS, so the caller's org access is checked here.
  if (!ctx.caller.org_ids.includes(input.org_id)) {
    throw new ServiceError('ORG_ACCESS_DENIED', `caller lacks access to org ${input.org_id}`);
  }

  const db = adminClient();

  // --- Document facet: subject-scoped links -> source_documents ---
  const { data: links, error: linksErr } = await db
    .from('source_document_links')
    .select('source_document_id, link_role, trace_id, link_status')
    .eq('linked_entity_type', input.subject_type)
    .eq('linked_entity_id', input.subject_id);
  if (linksErr) {
    throw new ServiceError('READ_FAILED', `source_document_links read failed: ${linksErr.message}`);
  }

  const activeLinks = (links ?? []).filter((l) => l.link_status !== 'reversed');
  const candidateDocIds = [...new Set(activeLinks.map((l) => l.source_document_id))];
  const roleByDoc = new Map(activeLinks.map((l) => [l.source_document_id, l.link_role]));

  // CROSS-TENANT GUARD (IDOR). source_document_links carries no org_id (polymorphic)
  // and subject_id is caller-supplied, so the raw link ids may reference another org's
  // documents; adminClient bypasses RLS. EVERY downstream facet derives from the
  // org-verified source_documents below — never the raw link ids — or the extraction
  // facet (document_artifacts has no org_id column of its own) would leak cross-tenant.
  let documents: EvidenceDocumentRef[] = [];
  let orgScopedDocIds: string[] = [];
  if (candidateDocIds.length > 0) {
    const { data: docs, error } = await db
      .from('source_documents')
      .select('id, original_content_hash, original_filename, storage_status')
      .in('id', candidateDocIds)
      .eq('org_id', input.org_id);
    if (error) {
      throw new ServiceError('READ_FAILED', `source_documents read failed: ${error.message}`);
    }
    orgScopedDocIds = (docs ?? []).map((d) => d.id);
    documents = (docs ?? []).map((d) => ({
      source_document_id: d.id,
      link_role: roleByDoc.get(d.id) ?? 'supporting',
      content_hash: d.original_content_hash,
      original_filename: d.original_filename,
      storage_status: d.storage_status ?? null,
    }));
  }

  // Trace correlation derives ONLY from links whose document passed the org filter,
  // so a cross-org subject contributes no trace ids (and thus no decision/approval
  // facets) even though decisions/approvals are themselves org-filtered below.
  const orgScopedDocIdSet = new Set(orgScopedDocIds);
  const traceIds = [
    ...new Set(
      activeLinks
        .filter((l) => orgScopedDocIdSet.has(l.source_document_id))
        .map((l) => l.trace_id),
    ),
  ];

  // --- Extraction facet: document_artifacts for the ORG-SCOPED source documents ---
  let extractions: EvidenceExtractionRef[] = [];
  if (orgScopedDocIds.length > 0) {
    const { data: arts, error } = await db
      .from('document_artifacts')
      .select('id, source_document_id, engine, confidence')
      .in('source_document_id', orgScopedDocIds);
    if (error) {
      throw new ServiceError('READ_FAILED', `document_artifacts read failed: ${error.message}`);
    }
    extractions = (arts ?? []).map((a) => ({
      artifact_id: a.id,
      source_document_id: a.source_document_id,
      engine: a.engine,
      confidence: a.confidence ?? null,
    }));
  }

  // --- Decision facet: rule_evaluation_log referenced by the evidence trace ---
  let decisions: EvidenceDecisionRef[] = [];
  if (traceIds.length > 0) {
    const { data: evals, error } = await db
      .from('rule_evaluation_log')
      .select('id, rule_id, effective_action, disposition')
      .in('trace_id', traceIds)
      .eq('org_id', input.org_id);
    if (error) {
      throw new ServiceError('READ_FAILED', `rule_evaluation_log read failed: ${error.message}`);
    }
    decisions = (evals ?? []).map((e) => ({
      rule_evaluation_log_id: e.id,
      rule_id: e.rule_id,
      effective_action: e.effective_action ?? null,
      disposition: e.disposition ?? null,
    }));
  }

  // --- Approval/actor facet: audit_log rows for this subject on the evidence trace ---
  let approvals: EvidenceApprovalRef[] = [];
  if (traceIds.length > 0) {
    const { data: audits, error } = await db
      .from('audit_log')
      .select('audit_log_id, action, user_id')
      .in('trace_id', traceIds)
      .eq('org_id', input.org_id)
      .eq('entity_type', input.subject_type)
      .eq('entity_id', input.subject_id);
    if (error) {
      throw new ServiceError('READ_FAILED', `audit_log read failed: ${error.message}`);
    }
    approvals = (audits ?? []).map((a) => ({
      audit_log_id: a.audit_log_id,
      action: a.action,
      user_id: a.user_id ?? null,
    }));
  }

  const completeness = assessCompleteness({
    documents: documents.length,
    extractions: extractions.length,
    decisions: decisions.length,
    approvals: approvals.length,
  });

  const assembled: CanonicalEvidenceObject = {
    subject_type: input.subject_type,
    subject_id: input.subject_id,
    org_id: input.org_id,
    trace_ids: traceIds,
    documents,
    extractions,
    decisions,
    approvals,
    completeness,
    domain_extension: null,
  };

  log.info(
    {
      fn: 'evidenceObjectService.assemble',
      subject_type: input.subject_type,
      subject_id: input.subject_id,
      completeness: completeness.status,
    },
    'canonical evidence object assembled (transient; no row written at Wave 2)',
  );

  // Belt-and-suspenders: validate the assembled shape before returning.
  return CanonicalEvidenceObjectSchema.parse(assembled);
}

export const evidenceObjectService = { assemble };
