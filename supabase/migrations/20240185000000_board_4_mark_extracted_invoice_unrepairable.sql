-- Board #4 slice-2 T6a — mark_extracted_invoice_unrepairable_with_audit RPC.
--
-- The G3 crash-class write path: sets extracted_invoices.post_status =
-- 'unrepairable' for an α whose JE landed but whose bill did not
-- (POSTING_RECOVERY_UNREPAIRABLE, raised by
-- billService.getRecoveryBillIdByJournalEntry). Completes the build-plan Task-3
-- locked-but-unshipped behavior ("mark α.post_status='unrepairable' and continue
-- the loop"); shipped 3b (9597dc45) implemented per-invoice-independence only for
-- the not-postable / missing-required-fields cases, never the crash-class. The
-- route wiring that CALLS this (the ~:431 recovery sub-call catch + the
-- top-of-loop skip) is T6b; this migration is the substrate write path only,
-- proven in isolation like 3a.
--
-- Mirrors post_extracted_invoice_with_audit (20240184000000): atomic UPDATE of
-- the α row + paired audit_log INSERT (INV-AUDIT-001) in one transaction; org_id
-- derived INSIDE the RPC from the parent document_case (chunk-3 canonical; single
-- source of truth; no service-side double-read TOCTOU).
--
-- THE LOAD-BEARING DIFFERENCE FROM 20240184 — the UPDATE sets post_status ONLY,
-- leaving posted_bill_id and idempotency_key UNTOUCHED. This is the mechanism,
-- not tidiness (T6a brief §2):
--   - pending α (bill NULL) → unrepairable: bill stays NULL; the T1 write-once
--     guards (20240181:184-196) are dormant (OLD ... IS NOT NULL is false); the
--     CHECK (post_status='posted') = (posted_bill_id IS NOT NULL)
--     (20240181:94-96) evaluates FALSE = FALSE → TRUE. Legal; succeeds.
--   - posted α (bill non-NULL): the UPDATE leaves the bill unchanged, so the
--     write-once trigger PASSES (NEW IS DISTINCT FROM OLD is false); then the
--     CHECK evaluates FALSE = TRUE → FALSE → 23514 (check_violation). The service
--     (markExtractedInvoiceUnrepairable) maps 23514 → INVALID_TRANSITION — a NEW
--     mapping, distinct from 3a's 0A000 handler, because this reject is a CHECK
--     violation, not a write-once trigger violation. A posted α can NEVER be
--     silently reclassified as a crash-failure.
--   - unrepairable α → unrepairable (re-mark): no-op UPDATE; CHECK
--     FALSE = FALSE → TRUE. Idempotent no-op success (recovery-safe).
--
-- The wrong alternative — setting posted_bill_id = NULL to "force" a CHECK-legal
-- state — would trip the write-once trigger on a posted α (0A000, the wrong
-- error) and un-link a real bill. Rejected by design: UPDATE post_status only.

CREATE OR REPLACE FUNCTION mark_extracted_invoice_unrepairable_with_audit(
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

  -- Lock the α row FOR UPDATE; capture the before-state for the audit and derive
  -- the parent case id (the org-scoping root). Mirrors 20240184.
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

  -- The G3 mark. post_status ONLY — posted_bill_id + idempotency_key untouched
  -- (see header). The T1 CHECK admits unrepairable+NULL and rejects a posted α
  -- (23514, mapped to INVALID_TRANSITION in the service); a same-value re-mark
  -- no-ops.
  UPDATE extracted_invoices
  SET post_status = 'unrepairable'
  WHERE id = v_id;

  -- Paired audit write, same transaction. org_id parent-derived. before_state
  -- captures the prior post_status + posted_bill_id (the pending→unrepairable
  -- transition; before_state.post_status='pending' is the load-bearing test
  -- assertion). audit_log.idempotency_key (uuid) is distinct from the α's text
  -- idempotency_key (untouched here) — left NULL.
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

GRANT EXECUTE ON FUNCTION mark_extracted_invoice_unrepairable_with_audit(JSONB, JSONB)
  TO service_role;
