-- 006_add_attachments.sql
-- Category A reservation. Empty in Phase 1.1.
-- Populated in Phase 2 by AP Agent.

CREATE TABLE journal_entry_attachments (
  attachment_id       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  journal_entry_id    uuid NOT NULL
    REFERENCES journal_entries(journal_entry_id) ON DELETE CASCADE,
  storage_path        text NOT NULL,
  original_filename   text NOT NULL,
  uploaded_by         uuid REFERENCES auth.users(id),
  uploaded_at         timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_je_attachments_entry
  ON journal_entry_attachments (journal_entry_id);

ALTER TABLE journal_entry_attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY je_attachments_select ON journal_entry_attachments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM journal_entries je
      WHERE je.journal_entry_id =
            journal_entry_attachments.journal_entry_id
        AND user_has_org_access(je.org_id)
    )
  );

COMMENT ON TABLE journal_entry_attachments IS
  'Populated in Phase 2 by AP Agent. Do not write to manually.';
