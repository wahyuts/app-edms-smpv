-- Target: MariaDB 10.4.32 (XAMPP)
-- READ-ONLY PREFLIGHT: Document Revision History Phase B
-- No ALTER / INSERT / UPDATE / DELETE / migration execution.
-- Select the intended database BEFORE running this script.
-- Run against the intended database with SELECT-only credentials where possible.

SELECT DATABASE() AS selected_database, VERSION() AS server_version, @@version_comment AS server_flavor;
SELECT @@hostname AS server_hostname, @@port AS server_port, @@datadir AS data_directory,
  @@session.sql_mode AS session_sql_mode, @@session.check_constraint_checks AS check_constraints_enabled;

-- Confirm the table exists and inspect engine/collation.
SELECT table_schema, table_name, engine, table_collation
FROM information_schema.tables
WHERE table_schema = DATABASE() AND table_name = 'document_revisions';

-- Check columns required by the additive migration and existing anchors.
SELECT column_name, column_type, is_nullable, column_default, ordinal_position
FROM information_schema.columns
WHERE table_schema = DATABASE() AND table_name = 'document_revisions'
  AND column_name IN (
    'revision_label', 'upload_stage_snapshot',
    'uploaded_by_username_snapshot', 'uploaded_by_role_snapshot',
    'id', 'file_id', 'created_at'
  )
ORDER BY ordinal_position;

-- Detect possible constraint-name collisions and any existing CHECK constraints.
SELECT constraint_name, constraint_type
FROM information_schema.table_constraints
WHERE table_schema = DATABASE() AND table_name = 'document_revisions'
ORDER BY constraint_name;

SELECT table_name, constraint_name, check_clause
FROM information_schema.check_constraints
WHERE constraint_schema = DATABASE() AND table_name = 'document_revisions';

-- New names must not already be used elsewhere in this database.
SELECT table_name, constraint_name, constraint_type
FROM information_schema.table_constraints
WHERE constraint_schema = DATABASE() AND constraint_name IN (
  'chk_document_revisions_upload_stage_snapshot', 'chk_document_revisions_uploaded_by_role_snapshot');

-- Confirm table shape without fetching document contents.
SELECT COUNT(*) AS revision_row_count FROM document_revisions;

-- Confirm linked metadata table/column structure (not live object existence).
SELECT table_name, column_name, column_type, is_nullable
FROM information_schema.columns
WHERE table_schema = DATABASE()
  AND ((table_name = 'stored_files' AND column_name IN ('file_id', 'original_file_name', 'uploaded_at', 'uploaded_by_user_id'))
    OR (table_name = 'document_revisions' AND column_name IN ('file_id', 'created_by_user_id', 'revision_sequence')))
ORDER BY table_name, ordinal_position;

SELECT table_name, column_name, referenced_table_name, referenced_column_name
FROM information_schema.key_column_usage
WHERE table_schema = DATABASE() AND table_name IN ('document_revisions', 'stored_files')
  AND referenced_table_name IS NOT NULL;

SELECT COUNT(*) AS broken_revision_file_links
FROM document_revisions r LEFT JOIN stored_files f ON f.file_id = r.file_id
WHERE f.file_id IS NULL OR NOT (f.project_id <=> r.project_id) OR NOT (f.document_id <=> r.document_id);

SELECT CASE
  WHEN DATABASE() IS NULL OR DATABASE() <> 'edms_smpv_dev'
    OR VERSION() NOT LIKE '10.4.32-MariaDB%' THEN 'STOP - TARGET MISMATCH'
  WHEN NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = DATABASE()
    AND table_name = 'document_revisions' AND engine = 'InnoDB') THEN 'STOP - TABLE/ENGINE MISMATCH'
  WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE()
    AND table_name = 'document_revisions' AND column_name IN (
      'upload_stage_snapshot', 'uploaded_by_username_snapshot', 'uploaded_by_role_snapshot'))
    OR EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_schema = DATABASE()
      AND constraint_name IN ('chk_document_revisions_upload_stage_snapshot', 'chk_document_revisions_uploaded_by_role_snapshot'))
    THEN 'STOP - EXISTING SNAPSHOT OBJECTS, REVIEW FOR APPLIED/PARTIAL STATE'
  ELSE 'NOT APPLIED - REVIEW STRUCTURE, CONSTRAINTS AND RELATION RESULTS BEFORE APPROVAL'
END AS migration_state;

-- Optional follow-up after human review: inspect SHOW CREATE TABLE document_revisions
-- in an interactive SQL client; it is read-only but not embedded here.
