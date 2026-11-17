-- Historical upload metadata, independent of mutable revision_label and REV.
-- MariaDB 10.4.32 / MySQL 9.7.2. Manual execution only, once per environment.
-- Select the intended database and verify a trusted backup before executing.
-- DDL implicitly commits; re-execution/partial application requires inspection.
-- Deploy this additive migration before code that writes the new snapshots.
-- Existing rows remain NULL: no speculative legacy backfill, seed or file IO.
ALTER TABLE document_revisions
  ADD COLUMN upload_stage_snapshot VARCHAR(64) NULL DEFAULT NULL AFTER revision_label,
  ADD COLUMN uploaded_by_username_snapshot VARCHAR(255) NULL DEFAULT NULL AFTER upload_stage_snapshot,
  ADD COLUMN uploaded_by_role_snapshot VARCHAR(64) NULL DEFAULT NULL AFTER uploaded_by_username_snapshot,
  ADD CONSTRAINT chk_document_revisions_upload_stage_snapshot
    CHECK (upload_stage_snapshot IS NULL OR upload_stage_snapshot IN ('IFR-Submitted', 'IFA-Submitted', 'As-Built')),
  ADD CONSTRAINT chk_document_revisions_uploaded_by_role_snapshot
    CHECK (uploaded_by_role_snapshot IS NULL OR uploaded_by_role_snapshot IN ('Admin', 'Document Owner', 'Team Process', 'Team Project', 'Viewer'));
