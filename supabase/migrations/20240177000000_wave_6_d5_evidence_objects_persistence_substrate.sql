-- 20240177000000_wave_6_d5_evidence_objects_persistence_substrate.sql
--
-- Wave 6 D5 T1 (brief eeb9a9ed D-4/D-5; ADR-0033 D-0033.7 — "persistence
-- + the row-producer ... lands at Wave 6"). The producer substrate for
-- evidence_objects (shipped inert at Wave 2, migration 20240172):
--
--   §1 UNIQUE (org_id, subject_type, subject_id) — one canonical object
--      per committed posting (D-0033.1's "one stable, addressable row"
--      finally constraint-backed). The T2 producer upserts on this key
--      (idempotent crash-resume; refreshes status + trace_id only).
--   §2 DROP idx_evidence_objects_org_subject — redundant: the unique
--      index serves the same (org_id, subject_type, subject_id) lookup.
--      Zero-row table; no plan risk. idx_evidence_objects_trace stays.
--   §3 status CHECK broaden, drop-and-replace (the 20240172 comment's
--      own forecast: "broadens at the Wave-6 producer wave").
--      v1_active ('reserved') → wave_6_active
--      ('reserved','partial','complete') — behaviorally additive strict
--      superset; the enum already carries all three values (no enum
--      change). Successor name is first-instance for the _v1_active
--      family (the chunk_N suffix family is document_cases-specific);
--      keyed to the broadening wave per the D5 decomposition ask (c).
--
-- INERT-no-more boundary: this migration adds constraints only; the
-- row-producer (evidenceObjectService.persist + the approve→post route
-- seam) is T2. No INV annotation here — INV-EVIDENCE-001 is Layer-2
-- (registered at T3); the Layer-1 UNIQUE is described in the leaf and
-- control matrix, not separately grep-annotated (the INV-WORKFLOW-002
-- precedent).

BEGIN;

-- §1 One canonical evidence object per subject.
ALTER TABLE evidence_objects
  ADD CONSTRAINT evidence_objects_subject_unique
  UNIQUE (org_id, subject_type, subject_id);

-- §2 Redundant non-unique index dropped (the unique index above serves
-- the subject lookup).
DROP INDEX idx_evidence_objects_org_subject;

-- §3 Status CHECK: additive broaden for the Wave-6 producer
-- (descriptive completeness — 'partial' | 'complete'; 'reserved' stays
-- admitted as the strict-superset proof, though the producer never
-- writes it).
ALTER TABLE evidence_objects
  DROP CONSTRAINT evidence_objects_status_v1_active;

ALTER TABLE evidence_objects
  ADD CONSTRAINT evidence_objects_status_wave_6_active
  CHECK (status IN ('reserved', 'partial', 'complete'));

COMMENT ON CONSTRAINT evidence_objects_subject_unique ON evidence_objects IS
  'Wave 6 D5 (ADR-0033 D-0033.7 amendment): one canonical evidence object '
  'per committed posting. The producer upsert keys on this; INV-EVIDENCE-001''s '
  'Layer-1 uniqueness half.';

COMMIT;
