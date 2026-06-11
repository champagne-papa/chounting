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
import { withInvariants } from '@/services/middleware/withInvariants';
import { recordMutation } from '@/services/audit/recordMutation';
import { LINKED_ENTITY_TABLE_MAP } from '@/shared/schemas/document-platform/sourceDocumentLink.schema';
import type { Database } from '@/db/types';
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

// ---------------------------------------------------------------------------
// Wave 6 D5 T2 — the write half (ADR-0033 D-0033.7: "persistence; the
// row-producer ... lands at Wave 6"). persist = subject-ownership guard →
// assemble → upsert. Unlike read-only assemble (inline authz, not wrapped),
// persist is a MUTATION: withInvariants-wrapped, audited via recordMutation —
// the INV-SERVICE-001 asymmetry now exercised in both directions in this one
// service. Write rides service-role adminClient: the 20240172 migration's
// pinned write-posture (RLS-enabled-no-write-policy denies the user path).

type EvidenceObjectRow = Database['public']['Tables']['evidence_objects']['Row'];

export interface PersistEvidenceInput {
  subject_type: string;
  subject_id: string;
  org_id: string;
}

const persistImpl = async (
  input: PersistEvidenceInput,
  ctx: ServiceContext,
): Promise<EvidenceObjectRow> => {
  const log = loggerWith({ trace_id: ctx.trace_id, user_id: ctx.caller.user_id });
  const db = adminClient();

  // D-3 step 1 — SUBJECT-OWNERSHIP GUARD (the D5 IDOR centerpiece).
  // subject_id is a bare polymorphic uuid (no FK, not org-composite) and RLS
  // gives zero write-side protection here (service-role bypass, no write
  // policy) — so the subject is resolved IN ITS OWN TABLE, ORG-SCOPED, before
  // any write. Foreign ≡ missing: one code, one message shape, no existence
  // leak. Without this, a foreign subject would flow through assemble's
  // empty-facets→'partial' mapping into a spurious (verified-org,
  // foreign-subject) row that the UNIQUE constraint cannot catch.
  // LINKED_ENTITY_NOT_FOUND reused (decomposition ask (d): the established
  // code for a LINKED_ENTITY_TABLE_MAP resolution miss; documentLinkService's
  // verifyLinkedEntityExists is NOT reused — it checks bare existence, no org
  // scope, which is exactly the shape this guard exists to avoid).
  const mapEntry =
    LINKED_ENTITY_TABLE_MAP[input.subject_type as keyof typeof LINKED_ENTITY_TABLE_MAP];
  if (!mapEntry) {
    throw new ServiceError(
      'LINKED_ENTITY_NOT_FOUND',
      `subject ${input.subject_type}/${input.subject_id} not found`,
    );
  }
  const { data: subject, error: subjErr } = await db
    .from(mapEntry.table)
    .select(mapEntry.pkColumn)
    .eq(mapEntry.pkColumn, input.subject_id)
    .eq('org_id', input.org_id)
    .maybeSingle();
  if (subjErr) {
    throw new ServiceError(
      'READ_FAILED',
      `subject-ownership guard read against ${mapEntry.table} failed: ${subjErr.message}`,
    );
  }
  if (!subject) {
    // Same message shape as the unknown-type branch: foreign ≡ missing.
    throw new ServiceError(
      'LINKED_ENTITY_NOT_FOUND',
      `subject ${input.subject_type}/${input.subject_id} not found`,
    );
  }

  // D-3 step 2 — assemble (org-verified facets; the Wave-2 cross-tenant
  // guard) and map transient completeness to the row grain: 'complete' →
  // 'complete', else 'partial' (transient 'empty' collapses — brief D-5).
  const assembled = await assemble(input, ctx);
  const status: 'partial' | 'complete' =
    assembled.completeness.status === 'complete' ? 'complete' : 'partial';

  // D-3 step 3 — upsert on the unique triple, insert-first with the
  // constraint-name-keyed 23505 fallback (the D3 dup-catch pattern).
  // created_by is INSERT-ONLY; the conflict path refreshes status + trace_id
  // only (a crash-resume re-persist must never rewrite the creator).
  const { data: before, error: beforeErr } = await db
    .from('evidence_objects')
    .select('*')
    .eq('org_id', input.org_id)
    .eq('subject_type', input.subject_type)
    .eq('subject_id', input.subject_id)
    .maybeSingle();
  if (beforeErr) {
    throw new ServiceError('READ_FAILED', `evidence_objects read-before failed: ${beforeErr.message}`);
  }

  let row: EvidenceObjectRow;
  if (!before) {
    const { data: inserted, error: insErr } = await db
      .from('evidence_objects')
      .insert({
        org_id: input.org_id,
        subject_type: input.subject_type,
        subject_id: input.subject_id,
        trace_id: ctx.trace_id,
        status,
        domain_extension: null,
        created_by: ctx.caller.user_id,
      })
      .select('*')
      .single();
    if (insErr) {
      if (insErr.code === '23505' && insErr.message.includes('evidence_objects_subject_unique')) {
        // Insert raced a concurrent persist — fall through to the update
        // path against the now-existing row.
        row = await refreshExisting(db, input, status, ctx.trace_id);
      } else {
        throw new ServiceError('POST_FAILED', `evidence_objects insert failed: ${insErr.message}`);
      }
    } else {
      row = inserted as EvidenceObjectRow;
    }
  } else {
    row = await refreshExisting(db, input, status, ctx.trace_id);
  }

  await recordMutation(db, ctx, {
    org_id: input.org_id,
    action: 'evidence_object.persisted',
    entity_type: 'evidence_object',
    entity_id: row.id,
    before_state: (before as Record<string, unknown> | null) ?? undefined,
  });

  log.info(
    {
      fn: 'evidenceObjectService.persist',
      subject_type: input.subject_type,
      subject_id: input.subject_id,
      evidence_object_id: row.id,
      status,
      resumed: Boolean(before),
    },
    'canonical evidence object persisted',
  );
  return row;
};

/** The conflict/resume path: refresh status + trace_id ONLY (created_by is
 *  INSERT-only; the anchor becomes the successful-commit request's trace —
 *  brief D-4.2). */
async function refreshExisting(
  db: ReturnType<typeof adminClient>,
  input: PersistEvidenceInput,
  status: 'partial' | 'complete',
  trace_id: string,
): Promise<EvidenceObjectRow> {
  const { data, error } = await db
    .from('evidence_objects')
    .update({ status, trace_id })
    .eq('org_id', input.org_id)
    .eq('subject_type', input.subject_type)
    .eq('subject_id', input.subject_id)
    .select('*')
    .single();
  if (error || !data) {
    throw new ServiceError('POST_FAILED', `evidence_objects refresh failed: ${error?.message ?? 'no row'}`);
  }
  return data as EvidenceObjectRow;
}

export const evidenceObjectService = {
  // withInvariants: skip-org-check (pattern-G3: read; org access enforced by an inline caller.org_ids.includes(input.org_id) guard in the assemble() body, evidenceObjectService.ts:51)
  assemble,
  persist: withInvariants(persistImpl),
};
