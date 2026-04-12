-- 003_seed_tax_codes.sql
-- Seeds GST and PST_BC for British Columbia.
-- org_id IS NULL = shared codes visible to all orgs (§2c hybrid RLS).
-- No historical rows per PLAN.md §18a.2 RESOLVED.

INSERT INTO tax_codes (code, rate, jurisdiction, effective_from, org_id)
VALUES
  ('GST', 0.0500, 'CA', '2024-01-01', NULL),
  ('PST_BC', 0.0700, 'CA-BC', '2024-01-01', NULL)
ON CONFLICT DO NOTHING;
