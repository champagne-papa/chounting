-- Board #4 slice-2 T3 — post_extracted_invoice_with_audit RPC.
--
-- The post-phase α write the T1 substrate deliberately reserved for T3
-- (20240181000000 header "Anti-scope (NOT in T1) … the N-loop post +
-- post-phase UPDATE of posted_bill_id/post_status/idempotency_key — T3").
-- T2a's extractedInvoiceWriteService is create-only; this is the first
-- UPDATE path for extracted_invoices.
--
-- Atomic: UPDATE the α row (posted_bill_id + post_status='posted' +
-- idempotency_key) + INSERT the paired audit_log (INV-AUDIT-001). org_id is
-- derived INSIDE the RPC from the parent document_case (chunk-3 canonical;
-- single source of truth; no service-side double-read TOCTOU).
--
-- Write-once + coherence are enforced by the T1 substrate, NOT re-checked here:
--   - trg_extracted_invoices_immutability (20240181:163-205): posted_bill_id
--     and idempotency_key are write-once (NULL→value only). A SAME-value
--     re-write is NOT distinct → allowed, which is the recovery-safe idempotent
--     re-post (re-approving an already-posted α passes rather than tripping
--     feature_not_supported). A DIFFERENT-bill re-write is rejected
--     (feature_not_supported → service maps to a typed error).
--   - CHECK (post_status='posted') = (posted_bill_id IS NOT NULL)
--     (20240181:94-96): this RPC sets both together, satisfying it.
--
-- NOTE (T3 idempotency-key persistence, the coupling folded in from T5): the
-- caller passes the resolved per-invoice key
-- (`${caseId}:bill:${vendor_invoice_number-if-unique-in-case else ordinal}`,
-- build-spec §1.5.2) and it is persisted write-once here — never recomputed —
-- so crash-class recovery and re-run dedup agree on each α's key.

CREATE OR REPLACE FUNCTION post_extracted_invoice_with_audit(
  p_post  JSONB,
  p_audit JSONB
) RETURNS UUID AS $$
DECLARE
  v_id             UUID;
  v_case_id        UUID;
  v_org_id         UUID;
  v_before_status  extracted_invoice_post_status;
  v_before_bill_id UUID;
BEGIN
  v_id := (p_post->>'id')::uuid;

  -- Lock the α row FOR UPDATE; capture the before-state for the audit and
  -- derive the parent case id (the org-scoping root).
  SELECT document_case_id, post_status, posted_bill_id
    INTO v_case_id, v_before_status, v_before_bill_id
  FROM extracted_invoices
  WHERE id = v_id
  FOR UPDATE;

  IF v_case_id IS NULL THEN
    RAISE EXCEPTION 'extracted_invoice % not found', v_id
      USING ERRCODE = 'no_data_found';
  END IF;

  -- org_id derived from the parent document_case (chunk-3 canonical pattern).
  SELECT org_id INTO v_org_id FROM document_cases WHERE id = v_case_id;

  -- The post-phase write. posted_bill_id + idempotency_key write-once and the
  -- posted⇔bill CHECK are enforced by the T1 substrate; a same-value re-write
  -- (recovery) no-ops, a different-bill re-write is rejected.
  UPDATE extracted_invoices
  SET posted_bill_id  = (p_post->>'posted_bill_id')::uuid,
      post_status     = 'posted',
      idempotency_key = p_post->>'idempotency_key'
  WHERE id = v_id;

  -- Paired audit write, same transaction. org_id parent-derived. before_state
  -- captures the prior post_status + posted_bill_id (the write-once transition).
  -- audit_log.idempotency_key (uuid) is distinct from the α's text
  -- idempotency_key set above — left NULL here.
  INSERT INTO audit_log (
    org_id, user_id, trace_id, action, entity_type, entity_id,
    before_state, after_state_id, tool_name, idempotency_key, reason
  )
  VALUES (
    v_org_id,
    NULLIF(p_audit->>'user_id', '')::uuid,
    (p_audit->>'trace_id')::uuid,
    p_audit->>'action',
    p_audit->>'entity_type',
    v_id,
    jsonb_build_object(
      'post_status', v_before_status,
      'posted_bill_id', v_before_bill_id
    ),
    v_id,
    p_audit->>'tool_name',
    NULLIF(p_audit->>'idempotency_key', '')::uuid,
    p_audit->>'reason'
  );

  RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER;

GRANT EXECUTE ON FUNCTION post_extracted_invoice_with_audit(JSONB, JSONB)
  TO service_role;
