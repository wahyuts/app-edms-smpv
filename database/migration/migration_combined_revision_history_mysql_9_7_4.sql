-- PHASE E.2B - Railway MySQL 9.7.4 combined snapshot package. PREPARED ONLY.
-- File: migration_combined_revision_history_mysql_9_7_4.sql
-- Select the intended schema in DBeaver; no USE or hardcoded Railway identity.
-- Never run on XAMPP/MariaDB. No credentials, host assumptions or live access.
-- Save every result set. A SQL error/permission error/incomplete result is STOP,
-- never PASS. This file does not independently verify Railway service/environment.
-- Compare server UUID + endpoint + project/service/environment with trusted owner
-- records. No manual value substitution is needed, but identity review IS needed.
-- CHECK recognition is exact binary matching of reviewed source/MySQL forms only.
-- Identifier-only case-folded lookups detect name collisions; MATCH still
-- requires canonical name casing. CHECK expressions and stage values stay exact.
-- No character/whitespace stripping or collation-based literal equivalence.
-- An unfamiliar CHECK representation is UNVERIFIED -> UNEXPECTED -> STOP;
-- it may be equivalent, but requires manual review, never automatic acceptance.

-- MUTATING PACKAGE - OWNER-APPROVED MANUAL EXECUTION ONLY, NOT A PREFLIGHT.
-- MANUAL GATES: configure DBeaver to stop on the FIRST SQL error. Do not
-- continue past an error or treat missing/partial result sets as success.
-- 1. Verify the selected Railway MySQL 9.7.4 environment using trusted service/
--    environment/endpoint records plus reported UUID/hostname. No name-only proof.
-- 2. Save ALL preflight result sets. Both states must be NOT_APPLIED, every
--    relationship count zero, every new object ABSENT, every anchor/FK/index MATCH.
--    Review all existing CHECK clauses, generated expressions, defaults and indexes
--    against canonical schema; PRESENT_ENFORCED is NOT proof of clause equivalence.
--    UNVERIFIED/new-object mismatch/partial/mixed/APPLIED state => do NOT run.
-- 3. Owner explicitly approves results, verifies a fresh full restore-capable
--    backup, stops/drains ALL writers (HTTP, workers, schedulers, maintenance and
--    old admitted continuations), and rechecks preflight while quiescent.
-- 4. Keep writer quiescence through both ALTERs and verification.
-- Advisory READY never proves identity, backup availability or writer quiescence.
-- Metadata privileges and SELECT access to all referenced tables are required.
-- If a prerequisite table/anchor is absent, STOP after metadata review: dependent
-- count/relationship statements cannot execute safely on a missing baseline.
-- BOTH ALTERs implicitly commit; one SQL file is NOT one reversible transaction.
-- MySQL DDL atomicity of an individual ALTER does not span these two statements.
-- Metadata locks/table rebuilds and CHECK validation can block writers/readers.
-- No ALGORITHM/LOCK promise is made: assess on target before scheduling.
-- If A succeeds and B fails, preserve all evidence and run READ-ONLY preflight
-- again to inspect state. Do not rerun this combined file, DROP objects, restore
-- automatically, bypass CHECKs, or skip errors. Obtain an owner-approved plan.
-- If both are APPLIED, this file must NOT run again. No IF NOT EXISTS skip/retry.
-- No BEGIN/COMMIT wrapper, rollback, database selection, seed or backfill.
-- Stage casing is intentional: upload snapshot As-Built; approval target AS-Built.
-- Backend converts the canonical approval stage to public As-Built on read.
-- Deploy code that writes these columns only after migration verification.

-- PART A: exact DDL from 20261116_0001_revision_upload_snapshots.sql
ALTER TABLE document_revisions
  ADD COLUMN upload_stage_snapshot VARCHAR(64) NULL DEFAULT NULL AFTER revision_label,
  ADD COLUMN uploaded_by_username_snapshot VARCHAR(255) NULL DEFAULT NULL AFTER upload_stage_snapshot,
  ADD COLUMN uploaded_by_role_snapshot VARCHAR(64) NULL DEFAULT NULL AFTER uploaded_by_username_snapshot,
  ADD CONSTRAINT chk_document_revisions_upload_stage_snapshot
    CHECK (upload_stage_snapshot IS NULL OR upload_stage_snapshot IN ('IFR-Submitted', 'IFA-Submitted', 'As-Built')),
  ADD CONSTRAINT chk_document_revisions_uploaded_by_role_snapshot
    CHECK (uploaded_by_role_snapshot IS NULL OR uploaded_by_role_snapshot IN ('Admin', 'Document Owner', 'Team Process', 'Team Project', 'Viewer'));

-- PART B: exact DDL from 20261117_0001_approval_a_history_snapshots.sql
ALTER TABLE workflow_comments
  ADD COLUMN created_by_username_snapshot VARCHAR(255) NULL DEFAULT NULL AFTER created_by_name_snapshot,
  ADD COLUMN approval_target_stage_snapshot VARCHAR(64) NULL DEFAULT NULL AFTER created_by_official_role_snapshot,
  ADD CONSTRAINT chk_workflow_comments_approval_target_stage
    CHECK (approval_target_stage_snapshot IS NULL OR
      (workflow_action = 'Approval A' AND approval_target_stage_snapshot IN ('IFA-Submitted', 'AS-Built')));

-- PART C: READ-ONLY POSTFLIGHT. No automatic repair or rerun.
-- Expected: both states APPLIED, 5 exact nullable columns and 3 enforced CHECKs,
-- zero broken relationships, same preflight row counts, intact existing DDL/keys.
-- New snapshots on existing rows must remain NULL: compare per-column counts
-- below against saved preflight output. If a baseline was not NOT_APPLIED,
-- do NOT retroactively treat this check as proof the combined run was safe.
-- Compare full old DDL/constraints/indexes/FKs and row counts with saved output.
-- SQL metadata/counts do NOT prove existing values/file contents are unchanged.
-- Use independent trusted row-level integrity evidence/backup for that claim.
SELECT DATABASE() AS selected_database, VERSION() AS server_version,
  @@version_comment AS server_flavor, @@server_uuid AS server_uuid,
  @@hostname AS server_hostname, @@port AS server_port,
  @@session.sql_mode AS session_sql_mode, @@foreign_key_checks AS foreign_key_checks,
  CURRENT_USER() AS authenticated_account,
  CASE WHEN DATABASE() IS NOT NULL AND SUBSTRING_INDEX(VERSION(), '-', 1) = '9.7.4'
    AND VERSION() NOT LIKE '%MariaDB%' THEN 'VERSION_MATCH_ONLY' ELSE 'STOP_TARGET_MISMATCH' END AS version_gate,
  'UNVERIFIED - compare UUID, endpoint, environment/service identity with owner records; database name is insufficient' AS environment_identity,
  'UNVERIFIED - backup and writer quiescence require independent owner evidence' AS execution_prerequisites;
SELECT TABLE_NAME, TABLE_TYPE, ENGINE, TABLE_COLLATION
FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME IN ('document_revisions','workflow_comments','stored_files','engineering_documents','projects','users')
ORDER BY TABLE_NAME;
SELECT TABLE_NAME, COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE, COLUMN_DEFAULT, EXTRA,
  GENERATION_EXPRESSION, CHARACTER_SET_NAME, COLLATION_NAME, ORDINAL_POSITION
FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME IN ('document_revisions','workflow_comments','stored_files')
ORDER BY TABLE_NAME, ORDINAL_POSITION;
SELECT tc.TABLE_NAME, tc.CONSTRAINT_NAME, tc.CONSTRAINT_TYPE, tc.ENFORCED, cc.CHECK_CLAUSE
FROM information_schema.TABLE_CONSTRAINTS tc
LEFT JOIN information_schema.CHECK_CONSTRAINTS cc ON cc.CONSTRAINT_SCHEMA = tc.CONSTRAINT_SCHEMA
  AND CAST(cc.CONSTRAINT_NAME AS BINARY) = CAST(tc.CONSTRAINT_NAME AS BINARY)
WHERE tc.CONSTRAINT_SCHEMA = DATABASE() AND (tc.TABLE_NAME IN ('document_revisions','workflow_comments')
  OR tc.CONSTRAINT_NAME IN ('chk_document_revisions_upload_stage_snapshot',
    'chk_document_revisions_uploaded_by_role_snapshot','chk_workflow_comments_approval_target_stage'))
ORDER BY tc.TABLE_NAME, tc.CONSTRAINT_NAME;
SELECT TABLE_NAME, INDEX_NAME, NON_UNIQUE, SEQ_IN_INDEX, COLUMN_NAME, SUB_PART, IS_VISIBLE
FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME IN ('document_revisions','workflow_comments','stored_files')
ORDER BY TABLE_NAME, INDEX_NAME, SEQ_IN_INDEX;
SELECT TABLE_NAME, CONSTRAINT_NAME, COLUMN_NAME, REFERENCED_TABLE_SCHEMA, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME
FROM information_schema.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME IN ('document_revisions','workflow_comments','stored_files') AND REFERENCED_TABLE_NAME IS NOT NULL
ORDER BY TABLE_NAME, CONSTRAINT_NAME, ORDINAL_POSITION;
WITH
expected_columns (table_name, column_name, char_length, after_column) AS (
  SELECT 'document_revisions', 'upload_stage_snapshot', 64, 'revision_label'
  UNION ALL SELECT 'document_revisions', 'uploaded_by_username_snapshot', 255, 'upload_stage_snapshot'
  UNION ALL SELECT 'document_revisions', 'uploaded_by_role_snapshot', 64, 'uploaded_by_username_snapshot'
  UNION ALL SELECT 'workflow_comments', 'created_by_username_snapshot', 255, 'created_by_name_snapshot'
  UNION ALL SELECT 'workflow_comments', 'approval_target_stage_snapshot', 64, 'created_by_official_role_snapshot'
),
expected_checks (table_name, constraint_name, source_clause, mysql_plain_clause, mysql_utf8mb4_clause) AS (
  SELECT 'document_revisions', 'chk_document_revisions_upload_stage_snapshot', 'upload_stage_snapshot IS NULL OR upload_stage_snapshot IN (''IFR-Submitted'', ''IFA-Submitted'', ''As-Built'')', '((`upload_stage_snapshot` is null) or (`upload_stage_snapshot` in (''IFR-Submitted'',''IFA-Submitted'',''As-Built'')))', '((`upload_stage_snapshot` is null) or (`upload_stage_snapshot` in (_utf8mb4''IFR-Submitted'',_utf8mb4''IFA-Submitted'',_utf8mb4''As-Built'')))'
  UNION ALL SELECT 'document_revisions', 'chk_document_revisions_uploaded_by_role_snapshot', 'uploaded_by_role_snapshot IS NULL OR uploaded_by_role_snapshot IN (''Admin'', ''Document Owner'', ''Team Process'', ''Team Project'', ''Viewer'')', '((`uploaded_by_role_snapshot` is null) or (`uploaded_by_role_snapshot` in (''Admin'',''Document Owner'',''Team Process'',''Team Project'',''Viewer'')))', '((`uploaded_by_role_snapshot` is null) or (`uploaded_by_role_snapshot` in (_utf8mb4''Admin'',_utf8mb4''Document Owner'',_utf8mb4''Team Process'',_utf8mb4''Team Project'',_utf8mb4''Viewer'')))'
  UNION ALL SELECT 'workflow_comments', 'chk_workflow_comments_approval_target_stage', 'approval_target_stage_snapshot IS NULL OR (workflow_action = ''Approval A'' AND approval_target_stage_snapshot IN (''IFA-Submitted'', ''AS-Built''))', '((`approval_target_stage_snapshot` is null) or ((`workflow_action` = ''Approval A'') and (`approval_target_stage_snapshot` in (''IFA-Submitted'',''AS-Built''))))', '((`approval_target_stage_snapshot` is null) or ((`workflow_action` = _utf8mb4''Approval A'') and (`approval_target_stage_snapshot` in (_utf8mb4''IFA-Submitted'',_utf8mb4''AS-Built''))))'
),
expected_anchors (table_name, column_name, column_type, is_nullable) AS (
  SELECT 'document_revisions', 'id', 'varchar(64)', 'NO'
  UNION ALL SELECT 'document_revisions', 'project_id', 'varchar(64)', 'NO'
  UNION ALL SELECT 'document_revisions', 'document_id', 'varchar(64)', 'NO'
  UNION ALL SELECT 'document_revisions', 'revision_label', 'varchar(64)', 'NO'
  UNION ALL SELECT 'document_revisions', 'revision_sequence', 'bigint unsigned', 'NO'
  UNION ALL SELECT 'document_revisions', 'file_id', 'varchar(64)', 'NO'
  UNION ALL SELECT 'document_revisions', 'storage_path_legacy', 'varchar(1024)', 'YES'
  UNION ALL SELECT 'document_revisions', 'is_active', 'tinyint(1)', 'NO'
  UNION ALL SELECT 'document_revisions', 'active_document_id', 'varchar(64)', 'YES'
  UNION ALL SELECT 'document_revisions', 'source_status', 'varchar(64)', 'YES'
  UNION ALL SELECT 'document_revisions', 'result_status', 'varchar(64)', 'YES'
  UNION ALL SELECT 'document_revisions', 'created_at', 'datetime(3)', 'NO'
  UNION ALL SELECT 'document_revisions', 'created_by_user_id', 'bigint unsigned', 'NO'
  UNION ALL SELECT 'workflow_comments', 'id', 'varchar(64)', 'NO'
  UNION ALL SELECT 'workflow_comments', 'project_id', 'varchar(64)', 'NO'
  UNION ALL SELECT 'workflow_comments', 'document_id', 'varchar(64)', 'NO'
  UNION ALL SELECT 'workflow_comments', 'revision_id', 'varchar(64)', 'YES'
  UNION ALL SELECT 'workflow_comments', 'workflow_action', 'varchar(64)', 'NO'
  UNION ALL SELECT 'workflow_comments', 'workflow_comment', 'text', 'YES'
  UNION ALL SELECT 'workflow_comments', 'created_by_user_id', 'bigint unsigned', 'YES'
  UNION ALL SELECT 'workflow_comments', 'created_by_name_snapshot', 'varchar(255)', 'YES'
  UNION ALL SELECT 'workflow_comments', 'created_by_official_role_snapshot', 'varchar(64)', 'YES'
  UNION ALL SELECT 'workflow_comments', 'created_at', 'datetime(3)', 'NO'
),
expected_fks (table_name, constraint_name, column_name, parent_table, parent_column, delete_rule) AS (
  SELECT 'document_revisions', 'fk_document_revisions_project_id', 'project_id', 'projects', 'id', 'RESTRICT'
  UNION ALL SELECT 'document_revisions', 'fk_document_revisions_document_id', 'document_id', 'engineering_documents', 'id', 'RESTRICT'
  UNION ALL SELECT 'document_revisions', 'fk_document_revisions_file_id', 'file_id', 'stored_files', 'file_id', 'RESTRICT'
  UNION ALL SELECT 'document_revisions', 'fk_document_revisions_created_by_user_id', 'created_by_user_id', 'users', 'id', 'RESTRICT'
  UNION ALL SELECT 'workflow_comments', 'fk_workflow_comments_project_id', 'project_id', 'projects', 'id', 'RESTRICT'
  UNION ALL SELECT 'workflow_comments', 'fk_workflow_comments_document_id', 'document_id', 'engineering_documents', 'id', 'RESTRICT'
  UNION ALL SELECT 'workflow_comments', 'fk_workflow_comments_revision_id', 'revision_id', 'document_revisions', 'id', 'SET NULL'
  UNION ALL SELECT 'workflow_comments', 'fk_workflow_comments_created_by_user_id', 'created_by_user_id', 'users', 'id', 'SET NULL'
),
column_results AS (
  SELECT e.table_name, e.column_name,
    CASE WHEN c.COLUMN_NAME IS NULL THEN 'ABSENT'
      WHEN CAST(c.COLUMN_NAME AS BINARY) = CAST(e.column_name AS BINARY)
       AND c.DATA_TYPE = 'varchar' AND c.CHARACTER_MAXIMUM_LENGTH = e.char_length
       AND c.IS_NULLABLE = 'YES' AND c.COLUMN_DEFAULT IS NULL AND c.EXTRA = ''
       AND c.CHARACTER_SET_NAME = 'utf8mb4'
       AND CAST(c.COLLATION_NAME AS BINARY) = CAST(t.TABLE_COLLATION AS BINARY)
       AND c.ORDINAL_POSITION = a.ORDINAL_POSITION + 1
        THEN 'MATCH' ELSE 'MISMATCH' END AS result
  FROM expected_columns e
  LEFT JOIN information_schema.COLUMNS c ON c.TABLE_SCHEMA = DATABASE()
    AND CAST(c.TABLE_NAME AS BINARY) = CAST(e.table_name AS BINARY)
    AND CAST(LOWER(c.COLUMN_NAME) AS BINARY) = CAST(LOWER(e.column_name) AS BINARY)
  LEFT JOIN information_schema.COLUMNS a ON a.TABLE_SCHEMA = DATABASE()
    AND CAST(a.TABLE_NAME AS BINARY) = CAST(e.table_name AS BINARY)
    AND CAST(a.COLUMN_NAME AS BINARY) = CAST(e.after_column AS BINARY)
  LEFT JOIN information_schema.TABLES t ON t.TABLE_SCHEMA = DATABASE()
    AND CAST(t.TABLE_NAME AS BINARY) = CAST(e.table_name AS BINARY)
),
check_results AS (
  SELECT e.table_name, e.constraint_name,
    CASE WHEN tc.CONSTRAINT_NAME IS NULL THEN 'ABSENT'
      WHEN CAST(tc.CONSTRAINT_NAME AS BINARY) <> CAST(e.constraint_name AS BINARY)
        OR CAST(tc.TABLE_NAME AS BINARY) <> CAST(e.table_name AS BINARY)
      OR tc.CONSTRAINT_TYPE <> 'CHECK' OR COALESCE(tc.ENFORCED,'') <> 'YES' THEN 'MISMATCH'
      WHEN cc.CHECK_CLAUSE IS NULL THEN 'UNVERIFIED'
      WHEN CAST(cc.CHECK_CLAUSE AS BINARY) IN
        (CAST(e.source_clause AS BINARY), CAST(e.mysql_plain_clause AS BINARY), CAST(e.mysql_utf8mb4_clause AS BINARY))
        THEN 'MATCH' ELSE 'UNVERIFIED' END AS result
  FROM expected_checks e
  LEFT JOIN information_schema.TABLE_CONSTRAINTS tc ON tc.CONSTRAINT_SCHEMA = DATABASE()
    AND CAST(LOWER(tc.CONSTRAINT_NAME) AS BINARY) = CAST(LOWER(e.constraint_name) AS BINARY)
  LEFT JOIN information_schema.CHECK_CONSTRAINTS cc ON cc.CONSTRAINT_SCHEMA = tc.CONSTRAINT_SCHEMA
    AND CAST(cc.CONSTRAINT_NAME AS BINARY) = CAST(tc.CONSTRAINT_NAME AS BINARY)
),
anchor_results AS (
  SELECT e.table_name, e.column_name,
    CASE WHEN CAST(c.COLUMN_TYPE AS BINARY) = CAST(e.column_type AS BINARY)
      AND c.IS_NULLABLE = e.is_nullable THEN 'MATCH' ELSE 'MISMATCH' END AS result
  FROM expected_anchors e
  LEFT JOIN information_schema.COLUMNS c ON c.TABLE_SCHEMA = DATABASE()
    AND CAST(c.TABLE_NAME AS BINARY) = CAST(e.table_name AS BINARY)
    AND CAST(c.COLUMN_NAME AS BINARY) = CAST(e.column_name AS BINARY)
),
fk_results AS (
  SELECT e.table_name, e.constraint_name,
    CASE WHEN COUNT(k.COLUMN_NAME) = 1
      AND MAX(CAST(k.COLUMN_NAME AS BINARY) = CAST(e.column_name AS BINARY)
        AND CAST(k.REFERENCED_TABLE_NAME AS BINARY) = CAST(e.parent_table AS BINARY)
        AND CAST(k.REFERENCED_COLUMN_NAME AS BINARY) = CAST(e.parent_column AS BINARY)
        AND CAST(k.REFERENCED_TABLE_SCHEMA AS BINARY) = CAST(DATABASE() AS BINARY)
        AND rc.UPDATE_RULE = 'RESTRICT' AND rc.DELETE_RULE = e.delete_rule) = 1
      THEN 'MATCH' ELSE 'MISMATCH' END AS result
  FROM expected_fks e
  LEFT JOIN information_schema.KEY_COLUMN_USAGE k ON k.CONSTRAINT_SCHEMA = DATABASE()
    AND CAST(k.TABLE_NAME AS BINARY) = CAST(e.table_name AS BINARY)
    AND CAST(k.CONSTRAINT_NAME AS BINARY) = CAST(e.constraint_name AS BINARY)
  LEFT JOIN information_schema.REFERENTIAL_CONSTRAINTS rc ON rc.CONSTRAINT_SCHEMA = k.CONSTRAINT_SCHEMA
    AND CAST(rc.TABLE_NAME AS BINARY) = CAST(k.TABLE_NAME AS BINARY)
    AND CAST(rc.CONSTRAINT_NAME AS BINARY) = CAST(k.CONSTRAINT_NAME AS BINARY)
  GROUP BY e.table_name, e.constraint_name, e.column_name, e.parent_table, e.parent_column, e.delete_rule
),
expected_indexes (table_name,index_name,non_unique,seq_in_index,column_name) AS (
  SELECT 'document_revisions', 'PRIMARY', 0, 1, 'id'
  UNION ALL SELECT 'document_revisions', 'uq_document_revisions_document_revision_sequence', 0, 1, 'document_id'
  UNION ALL SELECT 'document_revisions', 'uq_document_revisions_document_revision_sequence', 0, 2, 'revision_sequence'
  UNION ALL SELECT 'document_revisions', 'uq_document_revisions_active_document_id', 0, 1, 'active_document_id'
  UNION ALL SELECT 'document_revisions', 'idx_document_revisions_project_id', 1, 1, 'project_id'
  UNION ALL SELECT 'document_revisions', 'idx_document_revisions_document_is_active', 1, 1, 'document_id'
  UNION ALL SELECT 'document_revisions', 'idx_document_revisions_document_is_active', 1, 2, 'is_active'
  UNION ALL SELECT 'document_revisions', 'idx_document_revisions_file_id', 1, 1, 'file_id'
  UNION ALL SELECT 'document_revisions', 'idx_document_revisions_created_by_user_id', 1, 1, 'created_by_user_id'
  UNION ALL SELECT 'workflow_comments', 'PRIMARY', 0, 1, 'id'
  UNION ALL SELECT 'workflow_comments', 'idx_workflow_comments_project_document', 1, 1, 'project_id'
  UNION ALL SELECT 'workflow_comments', 'idx_workflow_comments_project_document', 1, 2, 'document_id'
  UNION ALL SELECT 'workflow_comments', 'idx_workflow_comments_revision_id', 1, 1, 'revision_id'
  UNION ALL SELECT 'workflow_comments', 'idx_workflow_comments_created_at', 1, 1, 'created_at'
  UNION ALL SELECT 'workflow_comments', 'idx_workflow_comments_created_by_user_id', 1, 1, 'created_by_user_id'
),
index_results AS (
  SELECT e.table_name, e.index_name,
    CASE WHEN (SELECT COUNT(*) FROM information_schema.STATISTICS sx WHERE sx.TABLE_SCHEMA=DATABASE()
      AND CAST(sx.TABLE_NAME AS BINARY)=CAST(e.table_name AS BINARY)
      AND CAST(sx.INDEX_NAME AS BINARY)=CAST(e.index_name AS BINARY))=COUNT(*)
      AND SUM(CASE WHEN s.NON_UNIQUE=e.non_unique AND s.SEQ_IN_INDEX=e.seq_in_index
      AND CAST(s.COLUMN_NAME AS BINARY)=CAST(e.column_name AS BINARY)
      AND s.SUB_PART IS NULL AND s.IS_VISIBLE='YES' THEN 1 ELSE 0 END)=COUNT(*)
      THEN 'MATCH' ELSE 'MISMATCH' END AS result
  FROM expected_indexes e LEFT JOIN information_schema.STATISTICS s ON s.TABLE_SCHEMA=DATABASE()
    AND CAST(s.TABLE_NAME AS BINARY)=CAST(e.table_name AS BINARY)
    AND CAST(s.INDEX_NAME AS BINARY)=CAST(e.index_name AS BINARY) AND s.SEQ_IN_INDEX=e.seq_in_index
  GROUP BY e.table_name,e.index_name
),
expected_baseline_checks (table_name,constraint_name) AS (
  SELECT 'document_revisions', 'chk_document_revisions_revision_label'
  UNION ALL SELECT 'document_revisions', 'chk_document_revisions_is_active'
  UNION ALL SELECT 'document_revisions', 'chk_document_revisions_source_status'
  UNION ALL SELECT 'document_revisions', 'chk_document_revisions_result_status'
  UNION ALL SELECT 'workflow_comments', 'chk_workflow_comments_workflow_action'
  UNION ALL SELECT 'workflow_comments', 'chk_workflow_comments_created_by_official_role'
),
baseline_check_results AS (
  SELECT e.table_name,e.constraint_name,
    CASE WHEN tc.CONSTRAINT_TYPE='CHECK' AND tc.ENFORCED='YES' AND cc.CHECK_CLAUSE IS NOT NULL
      THEN 'PRESENT_ENFORCED_DEFINITION_REQUIRES_REVIEW' ELSE 'MISMATCH' END AS result
  FROM expected_baseline_checks e LEFT JOIN information_schema.TABLE_CONSTRAINTS tc
    ON tc.CONSTRAINT_SCHEMA=DATABASE() AND CAST(tc.TABLE_NAME AS BINARY)=CAST(e.table_name AS BINARY)
    AND CAST(tc.CONSTRAINT_NAME AS BINARY)=CAST(e.constraint_name AS BINARY)
  LEFT JOIN information_schema.CHECK_CONSTRAINTS cc ON cc.CONSTRAINT_SCHEMA=tc.CONSTRAINT_SCHEMA
    AND CAST(cc.CONSTRAINT_NAME AS BINARY)=CAST(tc.CONSTRAINT_NAME AS BINARY)
),
table_states AS (
  SELECT targets.table_name,
    CASE
      WHEN NOT EXISTS (SELECT 1 FROM information_schema.TABLES t WHERE t.TABLE_SCHEMA = DATABASE()
        AND CAST(t.TABLE_NAME AS BINARY) = CAST(targets.table_name AS BINARY) AND t.TABLE_TYPE = 'BASE TABLE'
        AND t.ENGINE = 'InnoDB' AND t.TABLE_COLLATION LIKE 'utf8mb4%')
        OR EXISTS (SELECT 1 FROM anchor_results a WHERE a.table_name = targets.table_name AND a.result <> 'MATCH')
        OR EXISTS (SELECT 1 FROM fk_results f WHERE f.table_name = targets.table_name AND f.result <> 'MATCH')
        OR EXISTS (SELECT 1 FROM index_results i WHERE i.table_name=targets.table_name AND i.result='MISMATCH')
        OR EXISTS (SELECT 1 FROM baseline_check_results b WHERE b.table_name=targets.table_name AND b.result='MISMATCH')
        OR EXISTS (SELECT 1 FROM column_results c WHERE c.table_name = targets.table_name AND c.result = 'MISMATCH')
        OR EXISTS (SELECT 1 FROM check_results c WHERE c.table_name = targets.table_name AND c.result IN ('MISMATCH','UNVERIFIED'))
        THEN 'UNEXPECTED'
      WHEN NOT EXISTS (SELECT 1 FROM column_results c WHERE c.table_name = targets.table_name AND c.result <> 'ABSENT')
        AND NOT EXISTS (SELECT 1 FROM check_results c WHERE c.table_name = targets.table_name AND c.result <> 'ABSENT')
        THEN 'NOT_APPLIED'
      WHEN NOT EXISTS (SELECT 1 FROM column_results c WHERE c.table_name = targets.table_name AND c.result <> 'MATCH')
        AND NOT EXISTS (SELECT 1 FROM check_results c WHERE c.table_name = targets.table_name AND c.result <> 'MATCH')
        THEN 'APPLIED'
      ELSE 'PARTIAL'
    END AS migration_state
  FROM (SELECT 'document_revisions' AS table_name UNION ALL SELECT 'workflow_comments') targets
)
SELECT 'COLUMN' AS check_kind,table_name,column_name AS object_name,result FROM column_results
UNION ALL SELECT 'CHECK',table_name,constraint_name,result FROM check_results
UNION ALL SELECT 'ANCHOR',table_name,column_name,result FROM anchor_results
UNION ALL SELECT 'FOREIGN_KEY',table_name,constraint_name,result FROM fk_results
UNION ALL SELECT 'INDEX',table_name,index_name,result FROM index_results
UNION ALL SELECT 'EXISTING_CHECK',table_name,constraint_name,result FROM baseline_check_results
UNION ALL SELECT 'MIGRATION_STATE',table_name,table_name,migration_state FROM table_states
ORDER BY check_kind,table_name,object_name;
SELECT 'document_revisions' AS table_name, COUNT(*) AS row_count FROM document_revisions
UNION ALL SELECT 'workflow_comments', COUNT(*) FROM workflow_comments
UNION ALL SELECT 'stored_files', COUNT(*) FROM stored_files;
SELECT 'REVISION_FILE_SCOPE' AS check_name, COUNT(*) AS broken_links
FROM document_revisions r LEFT JOIN stored_files f ON CAST(f.file_id AS BINARY) = CAST(r.file_id AS BINARY)
WHERE f.file_id IS NULL OR NOT (CAST(f.project_id AS BINARY) <=> CAST(r.project_id AS BINARY))
  OR NOT (CAST(f.document_id AS BINARY) <=> CAST(r.document_id AS BINARY))
UNION ALL
SELECT 'REVISION_DOCUMENT_SCOPE', COUNT(*) FROM document_revisions r
LEFT JOIN engineering_documents d ON CAST(d.id AS BINARY) = CAST(r.document_id AS BINARY)
WHERE d.id IS NULL OR NOT (CAST(d.project_id AS BINARY) <=> CAST(r.project_id AS BINARY))
UNION ALL
SELECT 'COMMENT_DOCUMENT_SCOPE', COUNT(*) FROM workflow_comments c
LEFT JOIN engineering_documents d ON CAST(d.id AS BINARY) = CAST(c.document_id AS BINARY)
WHERE d.id IS NULL OR NOT (CAST(d.project_id AS BINARY) <=> CAST(c.project_id AS BINARY))
UNION ALL
SELECT 'COMMENT_REVISION_SCOPE', COUNT(*) FROM workflow_comments c
LEFT JOIN document_revisions r ON CAST(r.id AS BINARY) = CAST(c.revision_id AS BINARY)
WHERE c.revision_id IS NOT NULL AND (r.id IS NULL
  OR NOT (CAST(r.project_id AS BINARY) <=> CAST(c.project_id AS BINARY))
  OR NOT (CAST(r.document_id AS BINARY) <=> CAST(c.document_id AS BINARY)))
UNION ALL
SELECT 'ACTIVE_REVISION_FILE_POINTER', COUNT(*) FROM engineering_documents d
LEFT JOIN document_revisions r ON CAST(r.id AS BINARY) = CAST(d.active_revision_id AS BINARY)
WHERE (d.active_revision_id IS NULL AND d.active_file_id IS NOT NULL)
  OR (d.active_revision_id IS NOT NULL AND (r.id IS NULL
    OR NOT (CAST(r.project_id AS BINARY) <=> CAST(d.project_id AS BINARY))
    OR NOT (CAST(r.document_id AS BINARY) <=> CAST(d.id AS BINARY))
    OR NOT (CAST(r.file_id AS BINARY) <=> CAST(d.active_file_id AS BINARY))))
UNION ALL
SELECT 'REVISION_UPLOADER_LINK',COUNT(*) FROM document_revisions r
LEFT JOIN users u ON u.id=r.created_by_user_id WHERE u.id IS NULL
UNION ALL
SELECT 'COMMENT_AUTHOR_LINK',COUNT(*) FROM workflow_comments c
LEFT JOIN users u ON u.id=c.created_by_user_id WHERE c.created_by_user_id IS NOT NULL AND u.id IS NULL
UNION ALL
SELECT 'REVISION_PROJECT_LINK',COUNT(*) FROM document_revisions r
LEFT JOIN projects p ON CAST(p.id AS BINARY)=CAST(r.project_id AS BINARY) WHERE p.id IS NULL
UNION ALL
SELECT 'COMMENT_PROJECT_LINK',COUNT(*) FROM workflow_comments c
LEFT JOIN projects p ON CAST(p.id AS BINARY)=CAST(c.project_id AS BINARY) WHERE p.id IS NULL;
SELECT 'document_revisions' AS table_name,COUNT(*) AS row_count,
  COALESCE(SUM(upload_stage_snapshot IS NOT NULL),0) AS stage_snapshot_nonnull,
  COALESCE(SUM(uploaded_by_username_snapshot IS NOT NULL),0) AS username_snapshot_nonnull,
  COALESCE(SUM(uploaded_by_role_snapshot IS NOT NULL),0) AS role_snapshot_nonnull
FROM document_revisions;
SELECT 'workflow_comments' AS table_name,COUNT(*) AS row_count,
  COALESCE(SUM(created_by_username_snapshot IS NOT NULL),0) AS username_snapshot_nonnull,
  COALESCE(SUM(approval_target_stage_snapshot IS NOT NULL),0) AS target_stage_snapshot_nonnull
FROM workflow_comments;
WITH
expected_columns (table_name, column_name, char_length, after_column) AS (
  SELECT 'document_revisions', 'upload_stage_snapshot', 64, 'revision_label'
  UNION ALL SELECT 'document_revisions', 'uploaded_by_username_snapshot', 255, 'upload_stage_snapshot'
  UNION ALL SELECT 'document_revisions', 'uploaded_by_role_snapshot', 64, 'uploaded_by_username_snapshot'
  UNION ALL SELECT 'workflow_comments', 'created_by_username_snapshot', 255, 'created_by_name_snapshot'
  UNION ALL SELECT 'workflow_comments', 'approval_target_stage_snapshot', 64, 'created_by_official_role_snapshot'
),
expected_checks (table_name, constraint_name, source_clause, mysql_plain_clause, mysql_utf8mb4_clause) AS (
  SELECT 'document_revisions', 'chk_document_revisions_upload_stage_snapshot', 'upload_stage_snapshot IS NULL OR upload_stage_snapshot IN (''IFR-Submitted'', ''IFA-Submitted'', ''As-Built'')', '((`upload_stage_snapshot` is null) or (`upload_stage_snapshot` in (''IFR-Submitted'',''IFA-Submitted'',''As-Built'')))', '((`upload_stage_snapshot` is null) or (`upload_stage_snapshot` in (_utf8mb4''IFR-Submitted'',_utf8mb4''IFA-Submitted'',_utf8mb4''As-Built'')))'
  UNION ALL SELECT 'document_revisions', 'chk_document_revisions_uploaded_by_role_snapshot', 'uploaded_by_role_snapshot IS NULL OR uploaded_by_role_snapshot IN (''Admin'', ''Document Owner'', ''Team Process'', ''Team Project'', ''Viewer'')', '((`uploaded_by_role_snapshot` is null) or (`uploaded_by_role_snapshot` in (''Admin'',''Document Owner'',''Team Process'',''Team Project'',''Viewer'')))', '((`uploaded_by_role_snapshot` is null) or (`uploaded_by_role_snapshot` in (_utf8mb4''Admin'',_utf8mb4''Document Owner'',_utf8mb4''Team Process'',_utf8mb4''Team Project'',_utf8mb4''Viewer'')))'
  UNION ALL SELECT 'workflow_comments', 'chk_workflow_comments_approval_target_stage', 'approval_target_stage_snapshot IS NULL OR (workflow_action = ''Approval A'' AND approval_target_stage_snapshot IN (''IFA-Submitted'', ''AS-Built''))', '((`approval_target_stage_snapshot` is null) or ((`workflow_action` = ''Approval A'') and (`approval_target_stage_snapshot` in (''IFA-Submitted'',''AS-Built''))))', '((`approval_target_stage_snapshot` is null) or ((`workflow_action` = _utf8mb4''Approval A'') and (`approval_target_stage_snapshot` in (_utf8mb4''IFA-Submitted'',_utf8mb4''AS-Built''))))'
),
expected_anchors (table_name, column_name, column_type, is_nullable) AS (
  SELECT 'document_revisions', 'id', 'varchar(64)', 'NO'
  UNION ALL SELECT 'document_revisions', 'project_id', 'varchar(64)', 'NO'
  UNION ALL SELECT 'document_revisions', 'document_id', 'varchar(64)', 'NO'
  UNION ALL SELECT 'document_revisions', 'revision_label', 'varchar(64)', 'NO'
  UNION ALL SELECT 'document_revisions', 'revision_sequence', 'bigint unsigned', 'NO'
  UNION ALL SELECT 'document_revisions', 'file_id', 'varchar(64)', 'NO'
  UNION ALL SELECT 'document_revisions', 'storage_path_legacy', 'varchar(1024)', 'YES'
  UNION ALL SELECT 'document_revisions', 'is_active', 'tinyint(1)', 'NO'
  UNION ALL SELECT 'document_revisions', 'active_document_id', 'varchar(64)', 'YES'
  UNION ALL SELECT 'document_revisions', 'source_status', 'varchar(64)', 'YES'
  UNION ALL SELECT 'document_revisions', 'result_status', 'varchar(64)', 'YES'
  UNION ALL SELECT 'document_revisions', 'created_at', 'datetime(3)', 'NO'
  UNION ALL SELECT 'document_revisions', 'created_by_user_id', 'bigint unsigned', 'NO'
  UNION ALL SELECT 'workflow_comments', 'id', 'varchar(64)', 'NO'
  UNION ALL SELECT 'workflow_comments', 'project_id', 'varchar(64)', 'NO'
  UNION ALL SELECT 'workflow_comments', 'document_id', 'varchar(64)', 'NO'
  UNION ALL SELECT 'workflow_comments', 'revision_id', 'varchar(64)', 'YES'
  UNION ALL SELECT 'workflow_comments', 'workflow_action', 'varchar(64)', 'NO'
  UNION ALL SELECT 'workflow_comments', 'workflow_comment', 'text', 'YES'
  UNION ALL SELECT 'workflow_comments', 'created_by_user_id', 'bigint unsigned', 'YES'
  UNION ALL SELECT 'workflow_comments', 'created_by_name_snapshot', 'varchar(255)', 'YES'
  UNION ALL SELECT 'workflow_comments', 'created_by_official_role_snapshot', 'varchar(64)', 'YES'
  UNION ALL SELECT 'workflow_comments', 'created_at', 'datetime(3)', 'NO'
),
expected_fks (table_name, constraint_name, column_name, parent_table, parent_column, delete_rule) AS (
  SELECT 'document_revisions', 'fk_document_revisions_project_id', 'project_id', 'projects', 'id', 'RESTRICT'
  UNION ALL SELECT 'document_revisions', 'fk_document_revisions_document_id', 'document_id', 'engineering_documents', 'id', 'RESTRICT'
  UNION ALL SELECT 'document_revisions', 'fk_document_revisions_file_id', 'file_id', 'stored_files', 'file_id', 'RESTRICT'
  UNION ALL SELECT 'document_revisions', 'fk_document_revisions_created_by_user_id', 'created_by_user_id', 'users', 'id', 'RESTRICT'
  UNION ALL SELECT 'workflow_comments', 'fk_workflow_comments_project_id', 'project_id', 'projects', 'id', 'RESTRICT'
  UNION ALL SELECT 'workflow_comments', 'fk_workflow_comments_document_id', 'document_id', 'engineering_documents', 'id', 'RESTRICT'
  UNION ALL SELECT 'workflow_comments', 'fk_workflow_comments_revision_id', 'revision_id', 'document_revisions', 'id', 'SET NULL'
  UNION ALL SELECT 'workflow_comments', 'fk_workflow_comments_created_by_user_id', 'created_by_user_id', 'users', 'id', 'SET NULL'
),
column_results AS (
  SELECT e.table_name, e.column_name,
    CASE WHEN c.COLUMN_NAME IS NULL THEN 'ABSENT'
      WHEN CAST(c.COLUMN_NAME AS BINARY) = CAST(e.column_name AS BINARY)
       AND c.DATA_TYPE = 'varchar' AND c.CHARACTER_MAXIMUM_LENGTH = e.char_length
       AND c.IS_NULLABLE = 'YES' AND c.COLUMN_DEFAULT IS NULL AND c.EXTRA = ''
       AND c.CHARACTER_SET_NAME = 'utf8mb4'
       AND CAST(c.COLLATION_NAME AS BINARY) = CAST(t.TABLE_COLLATION AS BINARY)
       AND c.ORDINAL_POSITION = a.ORDINAL_POSITION + 1
        THEN 'MATCH' ELSE 'MISMATCH' END AS result
  FROM expected_columns e
  LEFT JOIN information_schema.COLUMNS c ON c.TABLE_SCHEMA = DATABASE()
    AND CAST(c.TABLE_NAME AS BINARY) = CAST(e.table_name AS BINARY)
    AND CAST(LOWER(c.COLUMN_NAME) AS BINARY) = CAST(LOWER(e.column_name) AS BINARY)
  LEFT JOIN information_schema.COLUMNS a ON a.TABLE_SCHEMA = DATABASE()
    AND CAST(a.TABLE_NAME AS BINARY) = CAST(e.table_name AS BINARY)
    AND CAST(a.COLUMN_NAME AS BINARY) = CAST(e.after_column AS BINARY)
  LEFT JOIN information_schema.TABLES t ON t.TABLE_SCHEMA = DATABASE()
    AND CAST(t.TABLE_NAME AS BINARY) = CAST(e.table_name AS BINARY)
),
check_results AS (
  SELECT e.table_name, e.constraint_name,
    CASE WHEN tc.CONSTRAINT_NAME IS NULL THEN 'ABSENT'
      WHEN CAST(tc.CONSTRAINT_NAME AS BINARY) <> CAST(e.constraint_name AS BINARY)
        OR CAST(tc.TABLE_NAME AS BINARY) <> CAST(e.table_name AS BINARY)
      OR tc.CONSTRAINT_TYPE <> 'CHECK' OR COALESCE(tc.ENFORCED,'') <> 'YES' THEN 'MISMATCH'
      WHEN cc.CHECK_CLAUSE IS NULL THEN 'UNVERIFIED'
      WHEN CAST(cc.CHECK_CLAUSE AS BINARY) IN
        (CAST(e.source_clause AS BINARY), CAST(e.mysql_plain_clause AS BINARY), CAST(e.mysql_utf8mb4_clause AS BINARY))
        THEN 'MATCH' ELSE 'UNVERIFIED' END AS result
  FROM expected_checks e
  LEFT JOIN information_schema.TABLE_CONSTRAINTS tc ON tc.CONSTRAINT_SCHEMA = DATABASE()
    AND CAST(LOWER(tc.CONSTRAINT_NAME) AS BINARY) = CAST(LOWER(e.constraint_name) AS BINARY)
  LEFT JOIN information_schema.CHECK_CONSTRAINTS cc ON cc.CONSTRAINT_SCHEMA = tc.CONSTRAINT_SCHEMA
    AND CAST(cc.CONSTRAINT_NAME AS BINARY) = CAST(tc.CONSTRAINT_NAME AS BINARY)
),
anchor_results AS (
  SELECT e.table_name, e.column_name,
    CASE WHEN CAST(c.COLUMN_TYPE AS BINARY) = CAST(e.column_type AS BINARY)
      AND c.IS_NULLABLE = e.is_nullable THEN 'MATCH' ELSE 'MISMATCH' END AS result
  FROM expected_anchors e
  LEFT JOIN information_schema.COLUMNS c ON c.TABLE_SCHEMA = DATABASE()
    AND CAST(c.TABLE_NAME AS BINARY) = CAST(e.table_name AS BINARY)
    AND CAST(c.COLUMN_NAME AS BINARY) = CAST(e.column_name AS BINARY)
),
fk_results AS (
  SELECT e.table_name, e.constraint_name,
    CASE WHEN COUNT(k.COLUMN_NAME) = 1
      AND MAX(CAST(k.COLUMN_NAME AS BINARY) = CAST(e.column_name AS BINARY)
        AND CAST(k.REFERENCED_TABLE_NAME AS BINARY) = CAST(e.parent_table AS BINARY)
        AND CAST(k.REFERENCED_COLUMN_NAME AS BINARY) = CAST(e.parent_column AS BINARY)
        AND CAST(k.REFERENCED_TABLE_SCHEMA AS BINARY) = CAST(DATABASE() AS BINARY)
        AND rc.UPDATE_RULE = 'RESTRICT' AND rc.DELETE_RULE = e.delete_rule) = 1
      THEN 'MATCH' ELSE 'MISMATCH' END AS result
  FROM expected_fks e
  LEFT JOIN information_schema.KEY_COLUMN_USAGE k ON k.CONSTRAINT_SCHEMA = DATABASE()
    AND CAST(k.TABLE_NAME AS BINARY) = CAST(e.table_name AS BINARY)
    AND CAST(k.CONSTRAINT_NAME AS BINARY) = CAST(e.constraint_name AS BINARY)
  LEFT JOIN information_schema.REFERENTIAL_CONSTRAINTS rc ON rc.CONSTRAINT_SCHEMA = k.CONSTRAINT_SCHEMA
    AND CAST(rc.TABLE_NAME AS BINARY) = CAST(k.TABLE_NAME AS BINARY)
    AND CAST(rc.CONSTRAINT_NAME AS BINARY) = CAST(k.CONSTRAINT_NAME AS BINARY)
  GROUP BY e.table_name, e.constraint_name, e.column_name, e.parent_table, e.parent_column, e.delete_rule
),
expected_indexes (table_name,index_name,non_unique,seq_in_index,column_name) AS (
  SELECT 'document_revisions', 'PRIMARY', 0, 1, 'id'
  UNION ALL SELECT 'document_revisions', 'uq_document_revisions_document_revision_sequence', 0, 1, 'document_id'
  UNION ALL SELECT 'document_revisions', 'uq_document_revisions_document_revision_sequence', 0, 2, 'revision_sequence'
  UNION ALL SELECT 'document_revisions', 'uq_document_revisions_active_document_id', 0, 1, 'active_document_id'
  UNION ALL SELECT 'document_revisions', 'idx_document_revisions_project_id', 1, 1, 'project_id'
  UNION ALL SELECT 'document_revisions', 'idx_document_revisions_document_is_active', 1, 1, 'document_id'
  UNION ALL SELECT 'document_revisions', 'idx_document_revisions_document_is_active', 1, 2, 'is_active'
  UNION ALL SELECT 'document_revisions', 'idx_document_revisions_file_id', 1, 1, 'file_id'
  UNION ALL SELECT 'document_revisions', 'idx_document_revisions_created_by_user_id', 1, 1, 'created_by_user_id'
  UNION ALL SELECT 'workflow_comments', 'PRIMARY', 0, 1, 'id'
  UNION ALL SELECT 'workflow_comments', 'idx_workflow_comments_project_document', 1, 1, 'project_id'
  UNION ALL SELECT 'workflow_comments', 'idx_workflow_comments_project_document', 1, 2, 'document_id'
  UNION ALL SELECT 'workflow_comments', 'idx_workflow_comments_revision_id', 1, 1, 'revision_id'
  UNION ALL SELECT 'workflow_comments', 'idx_workflow_comments_created_at', 1, 1, 'created_at'
  UNION ALL SELECT 'workflow_comments', 'idx_workflow_comments_created_by_user_id', 1, 1, 'created_by_user_id'
),
index_results AS (
  SELECT e.table_name, e.index_name,
    CASE WHEN (SELECT COUNT(*) FROM information_schema.STATISTICS sx WHERE sx.TABLE_SCHEMA=DATABASE()
      AND CAST(sx.TABLE_NAME AS BINARY)=CAST(e.table_name AS BINARY)
      AND CAST(sx.INDEX_NAME AS BINARY)=CAST(e.index_name AS BINARY))=COUNT(*)
      AND SUM(CASE WHEN s.NON_UNIQUE=e.non_unique AND s.SEQ_IN_INDEX=e.seq_in_index
      AND CAST(s.COLUMN_NAME AS BINARY)=CAST(e.column_name AS BINARY)
      AND s.SUB_PART IS NULL AND s.IS_VISIBLE='YES' THEN 1 ELSE 0 END)=COUNT(*)
      THEN 'MATCH' ELSE 'MISMATCH' END AS result
  FROM expected_indexes e LEFT JOIN information_schema.STATISTICS s ON s.TABLE_SCHEMA=DATABASE()
    AND CAST(s.TABLE_NAME AS BINARY)=CAST(e.table_name AS BINARY)
    AND CAST(s.INDEX_NAME AS BINARY)=CAST(e.index_name AS BINARY) AND s.SEQ_IN_INDEX=e.seq_in_index
  GROUP BY e.table_name,e.index_name
),
expected_baseline_checks (table_name,constraint_name) AS (
  SELECT 'document_revisions', 'chk_document_revisions_revision_label'
  UNION ALL SELECT 'document_revisions', 'chk_document_revisions_is_active'
  UNION ALL SELECT 'document_revisions', 'chk_document_revisions_source_status'
  UNION ALL SELECT 'document_revisions', 'chk_document_revisions_result_status'
  UNION ALL SELECT 'workflow_comments', 'chk_workflow_comments_workflow_action'
  UNION ALL SELECT 'workflow_comments', 'chk_workflow_comments_created_by_official_role'
),
baseline_check_results AS (
  SELECT e.table_name,e.constraint_name,
    CASE WHEN tc.CONSTRAINT_TYPE='CHECK' AND tc.ENFORCED='YES' AND cc.CHECK_CLAUSE IS NOT NULL
      THEN 'PRESENT_ENFORCED_DEFINITION_REQUIRES_REVIEW' ELSE 'MISMATCH' END AS result
  FROM expected_baseline_checks e LEFT JOIN information_schema.TABLE_CONSTRAINTS tc
    ON tc.CONSTRAINT_SCHEMA=DATABASE() AND CAST(tc.TABLE_NAME AS BINARY)=CAST(e.table_name AS BINARY)
    AND CAST(tc.CONSTRAINT_NAME AS BINARY)=CAST(e.constraint_name AS BINARY)
  LEFT JOIN information_schema.CHECK_CONSTRAINTS cc ON cc.CONSTRAINT_SCHEMA=tc.CONSTRAINT_SCHEMA
    AND CAST(cc.CONSTRAINT_NAME AS BINARY)=CAST(tc.CONSTRAINT_NAME AS BINARY)
),
table_states AS (
  SELECT targets.table_name,
    CASE
      WHEN NOT EXISTS (SELECT 1 FROM information_schema.TABLES t WHERE t.TABLE_SCHEMA = DATABASE()
        AND CAST(t.TABLE_NAME AS BINARY) = CAST(targets.table_name AS BINARY) AND t.TABLE_TYPE = 'BASE TABLE'
        AND t.ENGINE = 'InnoDB' AND t.TABLE_COLLATION LIKE 'utf8mb4%')
        OR EXISTS (SELECT 1 FROM anchor_results a WHERE a.table_name = targets.table_name AND a.result <> 'MATCH')
        OR EXISTS (SELECT 1 FROM fk_results f WHERE f.table_name = targets.table_name AND f.result <> 'MATCH')
        OR EXISTS (SELECT 1 FROM index_results i WHERE i.table_name=targets.table_name AND i.result='MISMATCH')
        OR EXISTS (SELECT 1 FROM baseline_check_results b WHERE b.table_name=targets.table_name AND b.result='MISMATCH')
        OR EXISTS (SELECT 1 FROM column_results c WHERE c.table_name = targets.table_name AND c.result = 'MISMATCH')
        OR EXISTS (SELECT 1 FROM check_results c WHERE c.table_name = targets.table_name AND c.result IN ('MISMATCH','UNVERIFIED'))
        THEN 'UNEXPECTED'
      WHEN NOT EXISTS (SELECT 1 FROM column_results c WHERE c.table_name = targets.table_name AND c.result <> 'ABSENT')
        AND NOT EXISTS (SELECT 1 FROM check_results c WHERE c.table_name = targets.table_name AND c.result <> 'ABSENT')
        THEN 'NOT_APPLIED'
      WHEN NOT EXISTS (SELECT 1 FROM column_results c WHERE c.table_name = targets.table_name AND c.result <> 'MATCH')
        AND NOT EXISTS (SELECT 1 FROM check_results c WHERE c.table_name = targets.table_name AND c.result <> 'MATCH')
        THEN 'APPLIED'
      ELSE 'PARTIAL'
    END AS migration_state
  FROM (SELECT 'document_revisions' AS table_name UNION ALL SELECT 'workflow_comments') targets
),
integrity_rows AS (
SELECT 'REVISION_FILE_SCOPE' AS check_name, COUNT(*) AS broken_links
FROM document_revisions r LEFT JOIN stored_files f ON CAST(f.file_id AS BINARY) = CAST(r.file_id AS BINARY)
WHERE f.file_id IS NULL OR NOT (CAST(f.project_id AS BINARY) <=> CAST(r.project_id AS BINARY))
  OR NOT (CAST(f.document_id AS BINARY) <=> CAST(r.document_id AS BINARY))
UNION ALL
SELECT 'REVISION_DOCUMENT_SCOPE', COUNT(*) FROM document_revisions r
LEFT JOIN engineering_documents d ON CAST(d.id AS BINARY) = CAST(r.document_id AS BINARY)
WHERE d.id IS NULL OR NOT (CAST(d.project_id AS BINARY) <=> CAST(r.project_id AS BINARY))
UNION ALL
SELECT 'COMMENT_DOCUMENT_SCOPE', COUNT(*) FROM workflow_comments c
LEFT JOIN engineering_documents d ON CAST(d.id AS BINARY) = CAST(c.document_id AS BINARY)
WHERE d.id IS NULL OR NOT (CAST(d.project_id AS BINARY) <=> CAST(c.project_id AS BINARY))
UNION ALL
SELECT 'COMMENT_REVISION_SCOPE', COUNT(*) FROM workflow_comments c
LEFT JOIN document_revisions r ON CAST(r.id AS BINARY) = CAST(c.revision_id AS BINARY)
WHERE c.revision_id IS NOT NULL AND (r.id IS NULL
  OR NOT (CAST(r.project_id AS BINARY) <=> CAST(c.project_id AS BINARY))
  OR NOT (CAST(r.document_id AS BINARY) <=> CAST(c.document_id AS BINARY)))
UNION ALL
SELECT 'ACTIVE_REVISION_FILE_POINTER', COUNT(*) FROM engineering_documents d
LEFT JOIN document_revisions r ON CAST(r.id AS BINARY) = CAST(d.active_revision_id AS BINARY)
WHERE (d.active_revision_id IS NULL AND d.active_file_id IS NOT NULL)
  OR (d.active_revision_id IS NOT NULL AND (r.id IS NULL
    OR NOT (CAST(r.project_id AS BINARY) <=> CAST(d.project_id AS BINARY))
    OR NOT (CAST(r.document_id AS BINARY) <=> CAST(d.id AS BINARY))
    OR NOT (CAST(r.file_id AS BINARY) <=> CAST(d.active_file_id AS BINARY))))
UNION ALL
SELECT 'REVISION_UPLOADER_LINK',COUNT(*) FROM document_revisions r
LEFT JOIN users u ON u.id=r.created_by_user_id WHERE u.id IS NULL
UNION ALL
SELECT 'COMMENT_AUTHOR_LINK',COUNT(*) FROM workflow_comments c
LEFT JOIN users u ON u.id=c.created_by_user_id WHERE c.created_by_user_id IS NOT NULL AND u.id IS NULL
UNION ALL
SELECT 'REVISION_PROJECT_LINK',COUNT(*) FROM document_revisions r
LEFT JOIN projects p ON CAST(p.id AS BINARY)=CAST(r.project_id AS BINARY) WHERE p.id IS NULL
UNION ALL
SELECT 'COMMENT_PROJECT_LINK',COUNT(*) FROM workflow_comments c
LEFT JOIN projects p ON CAST(p.id AS BINARY)=CAST(c.project_id AS BINARY) WHERE p.id IS NULL
)
SELECT (SELECT migration_state FROM table_states WHERE table_name='document_revisions') AS revision_upload_state,
  (SELECT migration_state FROM table_states WHERE table_name='workflow_comments') AS approval_a_state,
  (SELECT COALESCE(SUM(broken_links),0) FROM integrity_rows) AS broken_relationship_count,
  CASE
    WHEN DATABASE() IS NULL OR SUBSTRING_INDEX(VERSION(),'-',1)<>'9.7.4' OR VERSION() LIKE '%MariaDB%'
      THEN 'STOP_TARGET_MISMATCH'
    WHEN @@foreign_key_checks<>1 THEN 'STOP_FOREIGN_KEY_CHECKS_DISABLED'
    WHEN (SELECT COALESCE(SUM(broken_links),0) FROM integrity_rows)<>0 THEN 'STOP_RELATIONSHIP_MISMATCH'
    WHEN (SELECT COUNT(*) FROM table_states WHERE migration_state='APPLIED')=2 THEN 'STRUCTURE_APPLIED_REVIEW_COUNTS_AND_INDEPENDENT_INTEGRITY_EVIDENCE'
    ELSE 'STOP_PARTIAL_UNEXPECTED_OR_MIXED_STATE'
  END AS combined_postflight_status,
  'UNVERIFIED - owner must verify Railway endpoint/service/environment against UUID/hostname' AS environment_identity_gate,
  'UNVERIFIED - compare saved preflight counts, DDL/index/FK/CHECK outputs and independent data evidence; metadata does not prove unchanged data' AS integrity_comparison_gate,
  'UNVERIFIED - owner must verify backup, writer quiescence, baseline CHECK clauses and generated expression' AS manual_execution_gate;
