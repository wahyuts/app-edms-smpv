-- Standalone final postflight: Railway MySQL 9.7.4, Development OR Production.
-- READ-ONLY. Select the intended connection/schema in DBeaver. No database writes.
-- Run while writers remain quiescent, immediately after the additive migration.
-- Configure DBeaver to STOP on the first error. Any SQL/permission/recursion error,
-- missing result set, or incomplete execution is NOT verification success.
-- Run RS01/RS02 first. If prerequisites are MISSING, STOP before RS11.
-- Owner must compare UUID + endpoint + service/environment against trusted records.
-- Neither DATABASE() nor this script establishes the Railway environment.
-- RS11 contains ONE baseline_input CTE. Copy its NULL placeholders from the saved,
-- independently verified PRE-migration preflight for THIS SAME server UUID/schema.
-- Never use current counts as the baseline. No Development counts are embedded.
-- Leaving the baseline absent intentionally yields POSTFLIGHT_UNVERIFIED.
-- Even POSTFLIGHT_PASS is automated SQL verification ONLY, NOT release approval.
-- Row counts/NULL snapshots do not prove unchanged old row contents or file bytes.
--
-- CHECK audit: the old validator recognizes only three byte-for-byte spellings.
-- A different valid spelling becomes UNVERIFIED -> UNEXPECTED -> STOP. The precise
-- cause on Railway is not confirmed without raw CHECK_CLAUSE/HEX evidence (RS03).
-- New matching is a bounded, quote-aware lexer plus a finite grammar allowlist.
-- Ignore whitespace ONLY outside quotes; preserve identifier/literal bytes and all
-- operators, parentheses, operand order and list membership/order. Fold ONLY SQL
-- keywords. Unquote simple backticked identifiers without changing their bytes.
-- _utf8mb4 is accepted ONLY before a quoted literal; all referenced text columns
-- must independently match canonical utf8mb4/utf8mb4_unicode_ci. Literals remain
-- byte-exact, so As-Built and AS-Built never collapse. Column collation has higher
-- coercibility precedence than a plain/introduced literal; no COLLATE is removed.
-- Only canonical source/MySQL grouping, plus 0..2 WHOLE-expression wrappers, match.
-- Unknown introducers, escapes, JSON-escaped text, comments, operators or grouping
-- remain UNVERIFIED. Never unescape a DBeaver display representation as SQL text.
-- Expressions over 768 characters, malformed tokens or unbalanced grouping are
-- UNVERIFIED. The read-only recursive CTE uses at most 768 iterations; insufficient
-- session cte_max_recursion_depth causes an SQL error, NOT a PASS. Do not change it
-- merely to force success. No regex stripping inside identifiers/string literals.
-- Official references: https://dev.mysql.com/doc/refman/9.7/en/with.html
-- https://dev.mysql.com/doc/refman/9.7/en/information-schema-check-constraints-table.html
-- https://dev.mysql.com/doc/refman/9.7/en/charset-collation-coercibility.html

-- RS01: connection identity (evidence, not an environment authorization).
SELECT 'RS01_IDENTITY' AS result_set, DATABASE() AS selected_database,
  VERSION() AS server_version, @@version_comment AS version_comment,
  @@server_uuid AS server_uuid, @@hostname AS server_hostname, @@port AS server_port,
  @@session.sql_mode AS session_sql_mode, @@foreign_key_checks AS foreign_key_checks,
  CURRENT_USER() AS authenticated_account, CONNECTION_ID() AS connection_id,
  @@session.cte_max_recursion_depth AS cte_max_recursion_depth,
  CASE WHEN DATABASE() IS NOT NULL AND SUBSTRING_INDEX(VERSION(),'-',1)='9.7.4'
    AND VERSION() NOT LIKE '%MariaDB%' THEN 'MATCH' ELSE 'MISMATCH' END AS version_status,
  'UNVERIFIED: independently compare connection identity with trusted Railway environment records' AS environment_identity;

-- RS02: required tables and dependency columns; STOP here if any are absent.
WITH required_tables(table_name) AS (
  SELECT 'document_revisions' UNION ALL SELECT 'workflow_comments' UNION ALL SELECT 'stored_files'
  UNION ALL SELECT 'engineering_documents' UNION ALL SELECT 'projects' UNION ALL SELECT 'users'
), required_columns(table_name,column_name) AS (
  SELECT 'document_revisions', 'id'
  UNION ALL SELECT 'document_revisions', 'project_id'
  UNION ALL SELECT 'document_revisions', 'document_id'
  UNION ALL SELECT 'document_revisions', 'revision_label'
  UNION ALL SELECT 'document_revisions', 'upload_stage_snapshot'
  UNION ALL SELECT 'document_revisions', 'uploaded_by_username_snapshot'
  UNION ALL SELECT 'document_revisions', 'uploaded_by_role_snapshot'
  UNION ALL SELECT 'document_revisions', 'revision_sequence'
  UNION ALL SELECT 'document_revisions', 'file_id'
  UNION ALL SELECT 'document_revisions', 'storage_path_legacy'
  UNION ALL SELECT 'document_revisions', 'is_active'
  UNION ALL SELECT 'document_revisions', 'active_document_id'
  UNION ALL SELECT 'document_revisions', 'source_status'
  UNION ALL SELECT 'document_revisions', 'result_status'
  UNION ALL SELECT 'document_revisions', 'created_at'
  UNION ALL SELECT 'document_revisions', 'created_by_user_id'
  UNION ALL SELECT 'workflow_comments', 'id'
  UNION ALL SELECT 'workflow_comments', 'project_id'
  UNION ALL SELECT 'workflow_comments', 'document_id'
  UNION ALL SELECT 'workflow_comments', 'revision_id'
  UNION ALL SELECT 'workflow_comments', 'workflow_action'
  UNION ALL SELECT 'workflow_comments', 'workflow_comment'
  UNION ALL SELECT 'workflow_comments', 'created_by_user_id'
  UNION ALL SELECT 'workflow_comments', 'created_by_name_snapshot'
  UNION ALL SELECT 'workflow_comments', 'created_by_username_snapshot'
  UNION ALL SELECT 'workflow_comments', 'created_by_official_role_snapshot'
  UNION ALL SELECT 'workflow_comments', 'approval_target_stage_snapshot'
  UNION ALL SELECT 'workflow_comments', 'created_at'
  UNION ALL SELECT 'stored_files', 'file_id'
  UNION ALL SELECT 'stored_files', 'project_id'
  UNION ALL SELECT 'stored_files', 'document_id'
  UNION ALL SELECT 'stored_files', 'original_file_name'
  UNION ALL SELECT 'stored_files', 'physical_file_name'
  UNION ALL SELECT 'stored_files', 'file_extension'
  UNION ALL SELECT 'stored_files', 'mime_type'
  UNION ALL SELECT 'stored_files', 'file_size'
  UNION ALL SELECT 'stored_files', 'storage_key'
  UNION ALL SELECT 'stored_files', 'relative_path'
  UNION ALL SELECT 'stored_files', 'file_category'
  UNION ALL SELECT 'stored_files', 'checksum'
  UNION ALL SELECT 'stored_files', 'uploaded_by_user_id'
  UNION ALL SELECT 'stored_files', 'uploaded_at'
  UNION ALL SELECT 'stored_files', 'is_active'
  UNION ALL SELECT 'engineering_documents', 'id'
  UNION ALL SELECT 'engineering_documents', 'project_id'
  UNION ALL SELECT 'engineering_documents', 'active_revision_id'
  UNION ALL SELECT 'engineering_documents', 'active_file_id'
  UNION ALL SELECT 'projects', 'id'
  UNION ALL SELECT 'users', 'id'
)
SELECT 'RS02_PREREQUISITES' AS result_set, 'TABLE' AS object_kind, r.table_name,
  r.table_name AS object_name, CASE WHEN EXISTS(SELECT 1 FROM information_schema.TABLES t
    WHERE t.TABLE_SCHEMA=DATABASE() AND CAST(t.TABLE_NAME AS BINARY)=CAST(r.table_name AS BINARY)
      AND t.TABLE_TYPE='BASE TABLE') THEN 'PRESENT' ELSE 'MISSING' END AS status
FROM required_tables r
UNION ALL
SELECT 'RS02_PREREQUISITES','COLUMN',r.table_name,r.column_name,
  CASE WHEN EXISTS(SELECT 1 FROM information_schema.COLUMNS c WHERE c.TABLE_SCHEMA=DATABASE()
    AND CAST(c.TABLE_NAME AS BINARY)=CAST(r.table_name AS BINARY)
    AND CAST(c.COLUMN_NAME AS BINARY)=CAST(r.column_name AS BINARY)) THEN 'PRESENT' ELSE 'MISSING' END
FROM required_columns r ORDER BY object_kind,table_name,object_name;

-- RS03: preserve raw CHECK text and its byte/display representations for review.
SELECT 'RS03_CHECK_DIAGNOSTICS' AS result_set, tc.TABLE_NAME,tc.CONSTRAINT_NAME,
  tc.CONSTRAINT_TYPE,tc.ENFORCED,cc.CHECK_CLAUSE,
  HEX(cc.CHECK_CLAUSE) AS clause_hex, JSON_QUOTE(cc.CHECK_CLAUSE) AS clause_json_quoted,
  CHAR_LENGTH(cc.CHECK_CLAUSE) AS clause_characters
FROM information_schema.TABLE_CONSTRAINTS tc
LEFT JOIN information_schema.CHECK_CONSTRAINTS cc ON cc.CONSTRAINT_SCHEMA=tc.CONSTRAINT_SCHEMA
  AND CAST(cc.CONSTRAINT_NAME AS BINARY)=CAST(tc.CONSTRAINT_NAME AS BINARY)
WHERE tc.CONSTRAINT_SCHEMA=DATABASE() AND tc.TABLE_NAME IN ('document_revisions','workflow_comments','stored_files')
  AND tc.CONSTRAINT_TYPE='CHECK' ORDER BY tc.TABLE_NAME,tc.CONSTRAINT_NAME;

-- RS04: complete relevant column/default/charset/generation metadata.
SELECT 'RS04_COLUMN_METADATA' AS result_set,TABLE_NAME,COLUMN_NAME,COLUMN_TYPE,
  IS_NULLABLE,COLUMN_DEFAULT,EXTRA,ORDINAL_POSITION,CHARACTER_SET_NAME,COLLATION_NAME,
  DATETIME_PRECISION,GENERATION_EXPRESSION,COLUMN_COMMENT
FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE()
  AND TABLE_NAME IN ('document_revisions','workflow_comments','stored_files')
ORDER BY TABLE_NAME,ORDINAL_POSITION;

-- RS05: full index definition, including order/prefix/expression/visibility.
SELECT 'RS05_INDEX_METADATA' AS result_set,TABLE_NAME,INDEX_NAME,NON_UNIQUE,
  SEQ_IN_INDEX,COLUMN_NAME,SUB_PART,COLLATION,INDEX_TYPE,IS_VISIBLE,EXPRESSION
FROM information_schema.STATISTICS WHERE TABLE_SCHEMA=DATABASE()
  AND TABLE_NAME IN ('document_revisions','workflow_comments','stored_files')
ORDER BY TABLE_NAME,INDEX_NAME,SEQ_IN_INDEX;

-- RS06: foreign-key definitions and update/delete/match rules.
SELECT 'RS06_FOREIGN_KEYS' AS result_set,k.TABLE_NAME,k.CONSTRAINT_NAME,k.ORDINAL_POSITION,
  k.COLUMN_NAME,k.REFERENCED_TABLE_SCHEMA,k.REFERENCED_TABLE_NAME,k.REFERENCED_COLUMN_NAME,
  r.UPDATE_RULE,r.DELETE_RULE,r.MATCH_OPTION
FROM information_schema.KEY_COLUMN_USAGE k
LEFT JOIN information_schema.REFERENTIAL_CONSTRAINTS r ON r.CONSTRAINT_SCHEMA=k.CONSTRAINT_SCHEMA
  AND CAST(r.TABLE_NAME AS BINARY)=CAST(k.TABLE_NAME AS BINARY)
  AND CAST(r.CONSTRAINT_NAME AS BINARY)=CAST(k.CONSTRAINT_NAME AS BINARY)
WHERE k.TABLE_SCHEMA=DATABASE() AND k.TABLE_NAME IN ('document_revisions','workflow_comments','stored_files')
  AND k.REFERENCED_TABLE_NAME IS NOT NULL ORDER BY k.TABLE_NAME,k.CONSTRAINT_NAME,k.ORDINAL_POSITION;

-- RS07: generated expressions; behavior is NOT tested by inserting sample rows.
SELECT 'RS07_GENERATED_EXPRESSIONS' AS result_set,TABLE_NAME,COLUMN_NAME,EXTRA,
  GENERATION_EXPRESSION,HEX(GENERATION_EXPRESSION) AS expression_hex,
  JSON_QUOTE(GENERATION_EXPRESSION) AS expression_json_quoted
FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE()
  AND TABLE_NAME IN ('document_revisions','workflow_comments','stored_files')
  AND COALESCE(GENERATION_EXPRESSION,'')<>'' ORDER BY TABLE_NAME,ORDINAL_POSITION;

-- RS08/RS09/RS10: independent DDL diagnostics, not migration statements.
SHOW CREATE TABLE document_revisions;
SHOW CREATE TABLE workflow_comments;
SHOW CREATE TABLE stored_files;

-- RS11: consolidated per-object results, data checks and fail-closed final status.
WITH RECURSIVE
baseline_input AS (
  SELECT CAST(NULL AS CHAR(64)) AS baseline_server_uuid,
    CAST(NULL AS CHAR(64)) AS baseline_schema,
    CAST(NULL AS CHAR(32)) AS baseline_version,
    CAST(NULL AS DATETIME(6)) AS baseline_captured_at_utc,
    CAST(NULL AS CHAR(255)) AS baseline_evidence_reference,
    CAST(NULL AS UNSIGNED) AS revision_count,
    CAST(NULL AS UNSIGNED) AS comment_count,
    CAST(NULL AS UNSIGNED) AS file_count
),
expected_columns(table_name,column_name,column_type,is_nullable,default_value,extra_value,ordinal_position) AS (
  SELECT 'document_revisions', 'id', 'varchar(64)', 'NO', NULL, '', 1
  UNION ALL SELECT 'document_revisions', 'project_id', 'varchar(64)', 'NO', NULL, '', 2
  UNION ALL SELECT 'document_revisions', 'document_id', 'varchar(64)', 'NO', NULL, '', 3
  UNION ALL SELECT 'document_revisions', 'revision_label', 'varchar(64)', 'NO', NULL, '', 4
  UNION ALL SELECT 'document_revisions', 'upload_stage_snapshot', 'varchar(64)', 'YES', NULL, '', 5
  UNION ALL SELECT 'document_revisions', 'uploaded_by_username_snapshot', 'varchar(255)', 'YES', NULL, '', 6
  UNION ALL SELECT 'document_revisions', 'uploaded_by_role_snapshot', 'varchar(64)', 'YES', NULL, '', 7
  UNION ALL SELECT 'document_revisions', 'revision_sequence', 'bigint unsigned', 'NO', NULL, '', 8
  UNION ALL SELECT 'document_revisions', 'file_id', 'varchar(64)', 'NO', NULL, '', 9
  UNION ALL SELECT 'document_revisions', 'storage_path_legacy', 'varchar(1024)', 'YES', NULL, '', 10
  UNION ALL SELECT 'document_revisions', 'is_active', 'tinyint(1)', 'NO', '1', '', 11
  UNION ALL SELECT 'document_revisions', 'active_document_id', 'varchar(64)', 'YES', NULL, 'STORED GENERATED', 12
  UNION ALL SELECT 'document_revisions', 'source_status', 'varchar(64)', 'YES', NULL, '', 13
  UNION ALL SELECT 'document_revisions', 'result_status', 'varchar(64)', 'YES', NULL, '', 14
  UNION ALL SELECT 'document_revisions', 'created_at', 'datetime(3)', 'NO', 'CURRENT_TIMESTAMP(3)', 'DEFAULT_GENERATED', 15
  UNION ALL SELECT 'document_revisions', 'created_by_user_id', 'bigint unsigned', 'NO', NULL, '', 16
  UNION ALL SELECT 'workflow_comments', 'id', 'varchar(64)', 'NO', NULL, '', 1
  UNION ALL SELECT 'workflow_comments', 'project_id', 'varchar(64)', 'NO', NULL, '', 2
  UNION ALL SELECT 'workflow_comments', 'document_id', 'varchar(64)', 'NO', NULL, '', 3
  UNION ALL SELECT 'workflow_comments', 'revision_id', 'varchar(64)', 'YES', NULL, '', 4
  UNION ALL SELECT 'workflow_comments', 'workflow_action', 'varchar(64)', 'NO', NULL, '', 5
  UNION ALL SELECT 'workflow_comments', 'workflow_comment', 'text', 'YES', NULL, '', 6
  UNION ALL SELECT 'workflow_comments', 'created_by_user_id', 'bigint unsigned', 'YES', NULL, '', 7
  UNION ALL SELECT 'workflow_comments', 'created_by_name_snapshot', 'varchar(255)', 'YES', NULL, '', 8
  UNION ALL SELECT 'workflow_comments', 'created_by_username_snapshot', 'varchar(255)', 'YES', NULL, '', 9
  UNION ALL SELECT 'workflow_comments', 'created_by_official_role_snapshot', 'varchar(64)', 'YES', NULL, '', 10
  UNION ALL SELECT 'workflow_comments', 'approval_target_stage_snapshot', 'varchar(64)', 'YES', NULL, '', 11
  UNION ALL SELECT 'workflow_comments', 'created_at', 'datetime(3)', 'NO', 'CURRENT_TIMESTAMP(3)', 'DEFAULT_GENERATED', 12
  UNION ALL SELECT 'stored_files', 'file_id', 'varchar(64)', 'NO', NULL, '', 1
  UNION ALL SELECT 'stored_files', 'project_id', 'varchar(64)', 'NO', NULL, '', 2
  UNION ALL SELECT 'stored_files', 'document_id', 'varchar(64)', 'YES', NULL, '', 3
  UNION ALL SELECT 'stored_files', 'original_file_name', 'varchar(255)', 'NO', NULL, '', 4
  UNION ALL SELECT 'stored_files', 'physical_file_name', 'varchar(255)', 'NO', NULL, '', 5
  UNION ALL SELECT 'stored_files', 'file_extension', 'varchar(64)', 'NO', NULL, '', 6
  UNION ALL SELECT 'stored_files', 'mime_type', 'varchar(255)', 'NO', NULL, '', 7
  UNION ALL SELECT 'stored_files', 'file_size', 'bigint unsigned', 'NO', NULL, '', 8
  UNION ALL SELECT 'stored_files', 'storage_key', 'varchar(255)', 'NO', NULL, '', 9
  UNION ALL SELECT 'stored_files', 'relative_path', 'varchar(1024)', 'YES', NULL, '', 10
  UNION ALL SELECT 'stored_files', 'file_category', 'varchar(64)', 'NO', NULL, '', 11
  UNION ALL SELECT 'stored_files', 'checksum', 'varchar(255)', 'YES', NULL, '', 12
  UNION ALL SELECT 'stored_files', 'uploaded_by_user_id', 'bigint unsigned', 'NO', NULL, '', 13
  UNION ALL SELECT 'stored_files', 'uploaded_at', 'datetime(3)', 'NO', 'CURRENT_TIMESTAMP(3)', 'DEFAULT_GENERATED', 14
  UNION ALL SELECT 'stored_files', 'is_active', 'tinyint(1)', 'NO', '1', '', 15
),
parent_anchors(table_name,column_name,column_type,is_nullable) AS (
  SELECT 'engineering_documents','id','varchar(64)','NO'
  UNION ALL SELECT 'engineering_documents','project_id','varchar(64)','NO'
  UNION ALL SELECT 'engineering_documents','active_revision_id','varchar(64)','YES'
  UNION ALL SELECT 'engineering_documents','active_file_id','varchar(64)','YES'
  UNION ALL SELECT 'projects','id','varchar(64)','NO'
  UNION ALL SELECT 'users','id','bigint unsigned','NO'
),
expected_fks(table_name,constraint_name,column_name,parent_table,parent_column,delete_rule) AS (
  SELECT 'document_revisions', 'fk_document_revisions_project_id', 'project_id', 'projects', 'id', 'RESTRICT'
  UNION ALL SELECT 'document_revisions', 'fk_document_revisions_document_id', 'document_id', 'engineering_documents', 'id', 'RESTRICT'
  UNION ALL SELECT 'document_revisions', 'fk_document_revisions_file_id', 'file_id', 'stored_files', 'file_id', 'RESTRICT'
  UNION ALL SELECT 'document_revisions', 'fk_document_revisions_created_by_user_id', 'created_by_user_id', 'users', 'id', 'RESTRICT'
  UNION ALL SELECT 'workflow_comments', 'fk_workflow_comments_project_id', 'project_id', 'projects', 'id', 'RESTRICT'
  UNION ALL SELECT 'workflow_comments', 'fk_workflow_comments_document_id', 'document_id', 'engineering_documents', 'id', 'RESTRICT'
  UNION ALL SELECT 'workflow_comments', 'fk_workflow_comments_revision_id', 'revision_id', 'document_revisions', 'id', 'SET NULL'
  UNION ALL SELECT 'workflow_comments', 'fk_workflow_comments_created_by_user_id', 'created_by_user_id', 'users', 'id', 'SET NULL'
  UNION ALL SELECT 'stored_files', 'fk_stored_files_project_id', 'project_id', 'projects', 'id', 'RESTRICT'
  UNION ALL SELECT 'stored_files', 'fk_stored_files_document_id', 'document_id', 'engineering_documents', 'id', 'RESTRICT'
  UNION ALL SELECT 'stored_files', 'fk_stored_files_uploaded_by_user_id', 'uploaded_by_user_id', 'users', 'id', 'RESTRICT'
),
expected_indexes(table_name,index_name,non_unique,seq_in_index,column_name) AS (
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
  UNION ALL SELECT 'stored_files', 'PRIMARY', 0, 1, 'file_id'
  UNION ALL SELECT 'stored_files', 'uq_stored_files_storage_key', 0, 1, 'storage_key'
  UNION ALL SELECT 'stored_files', 'idx_stored_files_project_id', 1, 1, 'project_id'
  UNION ALL SELECT 'stored_files', 'idx_stored_files_document_id', 1, 1, 'document_id'
  UNION ALL SELECT 'stored_files', 'idx_stored_files_file_category', 1, 1, 'file_category'
  UNION ALL SELECT 'stored_files', 'idx_stored_files_uploaded_by_user_id', 1, 1, 'uploaded_by_user_id'
),
expected_expressions(table_name,object_name,object_kind,source_expression,mysql_expression) AS (
  SELECT 'document_revisions', 'chk_document_revisions_revision_label', 'CHECK', 'revision_label IN (''IFR-Submitted'', ''IFA-Submitted'', ''AS-Built'')', '(`revision_label` in (''IFR-Submitted'', ''IFA-Submitted'', ''AS-Built''))'
  UNION ALL SELECT 'document_revisions', 'chk_document_revisions_upload_stage_snapshot', 'CHECK', 'upload_stage_snapshot IS NULL OR upload_stage_snapshot IN (''IFR-Submitted'', ''IFA-Submitted'', ''As-Built'')', '((`upload_stage_snapshot` is null) or (`upload_stage_snapshot` in (''IFR-Submitted'', ''IFA-Submitted'', ''As-Built'')))'
  UNION ALL SELECT 'document_revisions', 'chk_document_revisions_uploaded_by_role_snapshot', 'CHECK', 'uploaded_by_role_snapshot IS NULL OR uploaded_by_role_snapshot IN (''Admin'', ''Document Owner'', ''Team Process'', ''Team Project'', ''Viewer'')', '((`uploaded_by_role_snapshot` is null) or (`uploaded_by_role_snapshot` in (''Admin'', ''Document Owner'', ''Team Process'', ''Team Project'', ''Viewer'')))'
  UNION ALL SELECT 'document_revisions', 'chk_document_revisions_is_active', 'CHECK', 'is_active IN (0, 1)', '(`is_active` in (0, 1))'
  UNION ALL SELECT 'document_revisions', 'chk_document_revisions_source_status', 'CHECK', 'source_status IS NULL OR source_status IN (''Process Review'', ''Process Comment'', ''Process Reject'', ''Project Review'', ''Project Comment'', ''Project Reject'', ''Approved'')', '((`source_status` is null) or (`source_status` in (''Process Review'', ''Process Comment'', ''Process Reject'', ''Project Review'', ''Project Comment'', ''Project Reject'', ''Approved'')))'
  UNION ALL SELECT 'document_revisions', 'chk_document_revisions_result_status', 'CHECK', 'result_status IS NULL OR result_status IN (''Process Review'', ''Process Comment'', ''Process Reject'', ''Project Review'', ''Project Comment'', ''Project Reject'', ''Approved'')', '((`result_status` is null) or (`result_status` in (''Process Review'', ''Process Comment'', ''Process Reject'', ''Project Review'', ''Project Comment'', ''Project Reject'', ''Approved'')))'
  UNION ALL SELECT 'workflow_comments', 'chk_workflow_comments_workflow_action', 'CHECK', 'workflow_action IN (''Approval A'', ''Approval B'', ''Approval C'')', '(`workflow_action` in (''Approval A'', ''Approval B'', ''Approval C''))'
  UNION ALL SELECT 'workflow_comments', 'chk_workflow_comments_approval_target_stage', 'CHECK', 'approval_target_stage_snapshot IS NULL OR (workflow_action = ''Approval A'' AND approval_target_stage_snapshot IN (''IFA-Submitted'', ''AS-Built''))', '((`approval_target_stage_snapshot` is null) or ((`workflow_action` = ''Approval A'') and (`approval_target_stage_snapshot` in (''IFA-Submitted'', ''AS-Built''))))'
  UNION ALL SELECT 'workflow_comments', 'chk_workflow_comments_created_by_official_role', 'CHECK', 'created_by_official_role_snapshot IS NULL OR created_by_official_role_snapshot IN (''Admin'', ''Document Owner'', ''Team Process'', ''Team Project'', ''Viewer'')', '((`created_by_official_role_snapshot` is null) or (`created_by_official_role_snapshot` in (''Admin'', ''Document Owner'', ''Team Process'', ''Team Project'', ''Viewer'')))'
  UNION ALL SELECT 'stored_files', 'chk_stored_files_file_size', 'CHECK', 'file_size >= 0', '(`file_size` >= 0)'
  UNION ALL SELECT 'stored_files', 'chk_stored_files_file_category', 'CHECK', 'file_category IN (''Active Document File'', ''Revision File'', ''Workflow Attachment'')', '(`file_category` in (''Active Document File'', ''Revision File'', ''Workflow Attachment''))'
  UNION ALL SELECT 'stored_files', 'chk_stored_files_is_active', 'CHECK', 'is_active IN (0, 1)', '(`is_active` in (0, 1))'
  UNION ALL SELECT 'document_revisions', 'active_document_id', 'GENERATED', 'CASE WHEN is_active = 1 THEN document_id ELSE NULL END', 'case when (`is_active` = 1) then `document_id` else NULL end'
),
observed_checks AS (
  SELECT e.*,
    (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS tc WHERE tc.CONSTRAINT_SCHEMA=DATABASE()
      AND CAST(LOWER(tc.CONSTRAINT_NAME) AS BINARY)=CAST(LOWER(e.object_name) AS BINARY)) AS found_count,
    (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS tc WHERE tc.CONSTRAINT_SCHEMA=DATABASE()
      AND CAST(tc.TABLE_NAME AS BINARY)=CAST(e.table_name AS BINARY)
      AND CAST(tc.CONSTRAINT_NAME AS BINARY)=CAST(e.object_name AS BINARY)
      AND tc.CONSTRAINT_TYPE='CHECK' AND tc.ENFORCED='YES') AS valid_attribute_count,
    (SELECT MAX(cc.CHECK_CLAUSE) FROM information_schema.CHECK_CONSTRAINTS cc
      WHERE cc.CONSTRAINT_SCHEMA=DATABASE()
        AND CAST(LOWER(cc.CONSTRAINT_NAME) AS BINARY)=CAST(LOWER(e.object_name) AS BINARY)) AS actual_expression
  FROM expected_expressions e WHERE e.object_kind='CHECK'
),
expression_inputs(input_id,table_name,object_name,object_kind,input_kind,expression_text) AS (
  SELECT CONCAT('A|',table_name,'|',object_name),table_name,object_name,object_kind,'ACTUAL',
    CONVERT(actual_expression USING utf8mb4) COLLATE utf8mb4_bin FROM observed_checks
  UNION ALL
  SELECT CONCAT('A|',e.table_name,'|',e.object_name),e.table_name,e.object_name,e.object_kind,'ACTUAL',
    CONVERT(c.GENERATION_EXPRESSION USING utf8mb4) COLLATE utf8mb4_bin
  FROM expected_expressions e LEFT JOIN information_schema.COLUMNS c ON c.TABLE_SCHEMA=DATABASE()
    AND CAST(c.TABLE_NAME AS BINARY)=CAST(e.table_name AS BINARY)
    AND CAST(c.COLUMN_NAME AS BINARY)=CAST(e.object_name AS BINARY)
  WHERE e.object_kind='GENERATED'
  UNION ALL
  SELECT CONCAT('S|',table_name,'|',object_name),table_name,object_name,object_kind,'EXPECTED',
    CONVERT(source_expression USING utf8mb4) COLLATE utf8mb4_bin FROM expected_expressions
  UNION ALL
  SELECT CONCAT('M|',table_name,'|',object_name),table_name,object_name,object_kind,'EXPECTED',
    CONVERT(mysql_expression USING utf8mb4) COLLATE utf8mb4_bin FROM expected_expressions
),
positions(n) AS (
  SELECT 1 UNION ALL SELECT n+1 FROM positions WHERE n<768
),
lexical_characters AS (
  SELECT i.input_id,p.n AS pos,i.expression_text,
    SUBSTRING(i.expression_text,p.n) AS tail,SUBSTRING(i.expression_text,p.n,1) AS ch
  FROM expression_inputs i JOIN positions p ON p.n<=CHAR_LENGTH(i.expression_text)
  WHERE CHAR_LENGTH(i.expression_text)<=768
),
lexical_raw AS (
  SELECT c.*,
    CASE WHEN REGEXP_LIKE(ch,'^[[:space:]]$','c') THEN REGEXP_SUBSTR(tail,'^[[:space:]]+',1,1,'c')
      WHEN ch=CHAR(39) THEN SUBSTRING(tail,1,LOCATE(CHAR(39),tail,2))
      WHEN ch=CHAR(96) THEN SUBSTRING(tail,1,LOCATE(CHAR(96),tail,2))
      WHEN REGEXP_LIKE(ch,'^[A-Za-z_]$','c') THEN REGEXP_SUBSTR(tail,'^[A-Za-z_][A-Za-z_0-9]*',1,1,'c')
      WHEN REGEXP_LIKE(ch,'^[0-9]$','c') THEN REGEXP_SUBSTR(tail,'^[0-9]+',1,1,'c')
      WHEN ch IN ('(',')',',','=','>','<') THEN ch
      ELSE NULL END AS raw_token
  FROM lexical_characters c
),
lexical_steps AS (
  SELECT input_id,pos,CHAR_LENGTH(raw_token) AS step_size,
    CASE WHEN raw_token IS NULL OR raw_token='' THEN NULL
      WHEN REGEXP_LIKE(ch,'^[[:space:]]$','c') THEN ''
      WHEN ch=CHAR(39) THEN CONCAT('s',HEX(SUBSTRING(raw_token,2,CHAR_LENGTH(raw_token)-2)),';')
      WHEN ch=CHAR(96) AND REGEXP_LIKE(SUBSTRING(raw_token,2,CHAR_LENGTH(raw_token)-2),'^[A-Za-z_][A-Za-z_0-9]*$','c')
        THEN CONCAT('i',HEX(SUBSTRING(raw_token,2,CHAR_LENGTH(raw_token)-2)),';')
      WHEN ch=CHAR(96) THEN NULL
      WHEN LOWER(raw_token)='_utf8mb4' AND REGEXP_LIKE(SUBSTRING(expression_text,pos+CHAR_LENGTH(raw_token)),CONCAT('^[[:space:]]*',CHAR(39)),'c') THEN ''
      WHEN LOWER(raw_token) IN ('is','null','or','and','in','case','when','then','else','end') THEN CONCAT('k',LOWER(raw_token),';')
      WHEN REGEXP_LIKE(raw_token,'^[A-Za-z_][A-Za-z_0-9]*$','c') THEN CONCAT('i',HEX(raw_token),';')
      WHEN REGEXP_LIKE(raw_token,'^[0-9]+$','c') THEN CONCAT('n',raw_token,';')
      WHEN raw_token IN ('(',')',',','=','>','<') THEN CONCAT('p',raw_token,';')
      ELSE NULL END AS normalized_token,
    CASE WHEN raw_token='(' THEN 1 WHEN raw_token=')' THEN -1 ELSE 0 END AS depth_delta
  FROM lexical_raw
),
lexer(input_id,pos,normalized,depth,bad) AS (
  SELECT input_id,1,CAST('' AS CHAR(8192) CHARACTER SET utf8mb4),0,
    CASE WHEN expression_text IS NULL OR CHAR_LENGTH(expression_text)=0 OR CHAR_LENGTH(expression_text)>768 THEN 1 ELSE 0 END
  FROM expression_inputs
  UNION ALL
  SELECT l.input_id,l.pos+COALESCE(NULLIF(s.step_size,0),1),CONCAT(l.normalized,COALESCE(s.normalized_token,'')),
    l.depth+s.depth_delta,
    CASE WHEN s.normalized_token IS NULL OR l.depth+s.depth_delta<0 THEN 1 ELSE 0 END
  FROM lexer l JOIN lexical_steps s ON CAST(s.input_id AS BINARY)=CAST(l.input_id AS BINARY) AND s.pos=l.pos
  WHERE l.bad=0
),
normalized_expressions AS (
  SELECT i.*,l.normalized,
    CASE WHEN l.bad=0 AND l.depth=0 AND l.pos>CHAR_LENGTH(i.expression_text) AND l.normalized<>''
      THEN 'MATCHABLE' ELSE 'UNVERIFIED' END AS lexical_status
  FROM expression_inputs i JOIN lexer l ON CAST(l.input_id AS BINARY)=CAST(i.input_id AS BINARY)
  WHERE l.bad=1 OR l.pos>CHAR_LENGTH(i.expression_text)
),
wrappers(n) AS (SELECT 0 UNION ALL SELECT 1 UNION ALL SELECT 2),
expression_matches AS (
  SELECT e.table_name,e.object_name,e.object_kind,
    CASE WHEN EXISTS(SELECT 1 FROM normalized_expressions a
      JOIN normalized_expressions b ON CAST(b.table_name AS BINARY)=CAST(a.table_name AS BINARY)
        AND CAST(b.object_name AS BINARY)=CAST(a.object_name AS BINARY) AND b.input_kind='EXPECTED'
      CROSS JOIN wrappers w WHERE a.input_kind='ACTUAL' AND a.lexical_status='MATCHABLE' AND b.lexical_status='MATCHABLE'
        AND CAST(a.table_name AS BINARY)=CAST(e.table_name AS BINARY)
        AND CAST(a.object_name AS BINARY)=CAST(e.object_name AS BINARY)
        AND CAST(a.normalized AS BINARY)=CAST(CONCAT(REPEAT('p(;',w.n),b.normalized,REPEAT('p);',w.n)) AS BINARY))
      THEN 'MATCH' ELSE 'UNVERIFIED' END AS result
  FROM expected_expressions e
),
table_results AS (
  SELECT 'TABLE' AS check_kind,t.table_name,t.table_name AS object_name,
    CASE WHEN a.TABLE_NAME IS NULL THEN 'MISSING'
      WHEN BINARY a.TABLE_NAME<>BINARY t.table_name OR a.TABLE_TYPE<>'BASE TABLE'
        OR (a.ENGINE='InnoDB' AND a.TABLE_COLLATION='utf8mb4_unicode_ci') IS NOT TRUE THEN 'MISMATCH' ELSE 'MATCH' END AS status,
    JSON_OBJECT('engine',a.ENGINE,'collation',a.TABLE_COLLATION,'type',a.TABLE_TYPE) AS evidence
  FROM (SELECT 'document_revisions' AS table_name UNION ALL SELECT 'workflow_comments' UNION ALL SELECT 'stored_files') t
  LEFT JOIN information_schema.TABLES a ON a.TABLE_SCHEMA=DATABASE() AND BINARY LOWER(a.TABLE_NAME)=BINARY LOWER(t.table_name)
),
column_results AS (
  SELECT 'COLUMN' AS check_kind,e.table_name,e.column_name AS object_name,
    CASE WHEN c.COLUMN_NAME IS NULL THEN 'MISSING'
      WHEN (BINARY c.COLUMN_NAME=BINARY e.column_name AND BINARY c.TABLE_NAME=BINARY e.table_name
        AND BINARY LOWER(c.COLUMN_TYPE)=BINARY e.column_type AND c.IS_NULLABLE=e.is_nullable
        AND (BINARY UPPER(c.COLUMN_DEFAULT) <=> BINARY e.default_value)
        AND BINARY c.EXTRA=BINARY e.extra_value AND c.ORDINAL_POSITION=e.ordinal_position
        AND (CASE WHEN e.column_type LIKE 'varchar%' OR e.column_type='text'
          THEN c.CHARACTER_SET_NAME='utf8mb4' AND c.COLLATION_NAME='utf8mb4_unicode_ci'
          ELSE c.CHARACTER_SET_NAME IS NULL AND c.COLLATION_NAME IS NULL END)
        AND (e.column_type<>'datetime(3)' OR c.DATETIME_PRECISION=3)
        AND (e.extra_value='STORED GENERATED' OR COALESCE(c.GENERATION_EXPRESSION,'')='')) IS NOT TRUE THEN 'MISMATCH'
      ELSE 'MATCH' END AS status,
    JSON_OBJECT('type',c.COLUMN_TYPE,'nullable',c.IS_NULLABLE,'default',c.COLUMN_DEFAULT,'extra',c.EXTRA,
      'ordinal',c.ORDINAL_POSITION,'charset',c.CHARACTER_SET_NAME,'collation',c.COLLATION_NAME,
      'expectedType',e.column_type,'expectedOrdinal',e.ordinal_position) AS evidence
  FROM expected_columns e LEFT JOIN information_schema.COLUMNS c ON c.TABLE_SCHEMA=DATABASE()
    AND BINARY LOWER(c.TABLE_NAME)=BINARY LOWER(e.table_name) AND BINARY LOWER(c.COLUMN_NAME)=BINARY LOWER(e.column_name)
),
parent_results AS (
  SELECT 'PARENT_ANCHOR' AS check_kind,e.table_name,e.column_name AS object_name,
    CASE WHEN c.COLUMN_NAME IS NULL THEN 'MISSING'
      WHEN BINARY c.TABLE_NAME<>BINARY e.table_name OR BINARY c.COLUMN_NAME<>BINARY e.column_name
        OR BINARY LOWER(c.COLUMN_TYPE)<>BINARY e.column_type OR c.IS_NULLABLE<>e.is_nullable
        OR (e.column_type LIKE 'varchar%' AND (c.CHARACTER_SET_NAME='utf8mb4' AND c.COLLATION_NAME='utf8mb4_unicode_ci') IS NOT TRUE)
        THEN 'MISMATCH' ELSE 'MATCH' END AS status,
    JSON_OBJECT('type',c.COLUMN_TYPE,'nullable',c.IS_NULLABLE,'collation',c.COLLATION_NAME) AS evidence
  FROM parent_anchors e LEFT JOIN information_schema.COLUMNS c ON c.TABLE_SCHEMA=DATABASE()
    AND BINARY LOWER(c.TABLE_NAME)=BINARY LOWER(e.table_name) AND BINARY LOWER(c.COLUMN_NAME)=BINARY LOWER(e.column_name)
),
check_results AS (
  SELECT 'CHECK' AS check_kind,c.table_name,c.object_name,
    CASE WHEN c.found_count=0 THEN 'MISSING' WHEN c.found_count<>1 OR c.valid_attribute_count<>1 THEN 'MISMATCH'
      ELSE m.result END AS status,
    JSON_OBJECT('found',c.found_count,'enforcedExactName',c.valid_attribute_count,'actual',c.actual_expression,
      'actualHex',HEX(c.actual_expression),'expectedSource',c.source_expression,'expectedMySQL',c.mysql_expression) AS evidence
  FROM observed_checks c JOIN expression_matches m ON BINARY m.table_name=BINARY c.table_name AND BINARY m.object_name=BINARY c.object_name
),
generated_results AS (
  SELECT 'GENERATED' AS check_kind,table_name,object_name,result AS status,
    JSON_OBJECT('note','Finite expression grammar; inspect RS07 if UNVERIFIED') AS evidence
  FROM expression_matches WHERE object_kind='GENERATED'
),
fk_results AS (
  SELECT 'FOREIGN_KEY' AS check_kind,e.table_name,e.constraint_name AS object_name,
    CASE WHEN NOT EXISTS(SELECT 1 FROM information_schema.REFERENTIAL_CONSTRAINTS r
      WHERE r.CONSTRAINT_SCHEMA=DATABASE() AND BINARY LOWER(r.CONSTRAINT_NAME)=BINARY LOWER(e.constraint_name)) THEN 'MISSING'
    WHEN (SELECT COUNT(*) FROM information_schema.KEY_COLUMN_USAGE k
      WHERE k.CONSTRAINT_SCHEMA=DATABASE() AND BINARY LOWER(k.CONSTRAINT_NAME)=BINARY LOWER(e.constraint_name))<>1 THEN 'MISMATCH'
    WHEN NOT EXISTS(SELECT 1 FROM information_schema.KEY_COLUMN_USAGE k JOIN information_schema.REFERENTIAL_CONSTRAINTS r
      ON r.CONSTRAINT_SCHEMA=k.CONSTRAINT_SCHEMA AND BINARY r.CONSTRAINT_NAME=BINARY k.CONSTRAINT_NAME
      AND BINARY r.TABLE_NAME=BINARY k.TABLE_NAME
      WHERE k.CONSTRAINT_SCHEMA=DATABASE() AND BINARY k.TABLE_NAME=BINARY e.table_name
      AND BINARY k.CONSTRAINT_NAME=BINARY e.constraint_name AND k.ORDINAL_POSITION=1 AND k.POSITION_IN_UNIQUE_CONSTRAINT=1
      AND BINARY k.COLUMN_NAME=BINARY e.column_name AND BINARY k.REFERENCED_TABLE_SCHEMA=BINARY DATABASE()
      AND BINARY k.REFERENCED_TABLE_NAME=BINARY e.parent_table AND BINARY k.REFERENCED_COLUMN_NAME=BINARY e.parent_column
      AND r.UPDATE_RULE='RESTRICT' AND r.DELETE_RULE=e.delete_rule AND r.MATCH_OPTION='NONE') THEN 'MISMATCH'
    ELSE 'MATCH' END AS status,
    JSON_OBJECT('column',e.column_name,'parent',e.parent_table,'parentColumn',e.parent_column,'deleteRule',e.delete_rule,
      'updateRule','RESTRICT','actualDetails','RS06_FOREIGN_KEYS') AS evidence
  FROM expected_fks e
),
index_results AS (
  SELECT 'INDEX' AS check_kind,e.table_name,e.index_name AS object_name,
    CASE WHEN NOT EXISTS(SELECT 1 FROM information_schema.STATISTICS s WHERE s.TABLE_SCHEMA=DATABASE()
      AND BINARY LOWER(s.TABLE_NAME)=BINARY LOWER(e.table_name) AND BINARY LOWER(s.INDEX_NAME)=BINARY LOWER(e.index_name)) THEN 'MISSING'
    WHEN (SELECT COUNT(*) FROM information_schema.STATISTICS s WHERE s.TABLE_SCHEMA=DATABASE()
      AND BINARY LOWER(s.TABLE_NAME)=BINARY LOWER(e.table_name) AND BINARY LOWER(s.INDEX_NAME)=BINARY LOWER(e.index_name))<>COUNT(*) THEN 'MISMATCH'
    WHEN SUM(CASE WHEN EXISTS(SELECT 1 FROM information_schema.STATISTICS s WHERE s.TABLE_SCHEMA=DATABASE()
      AND BINARY s.TABLE_NAME=BINARY e.table_name AND BINARY s.INDEX_NAME=BINARY e.index_name
      AND s.SEQ_IN_INDEX=e.seq_in_index AND BINARY s.COLUMN_NAME=BINARY e.column_name AND s.NON_UNIQUE=e.non_unique
      AND s.SUB_PART IS NULL AND s.COLLATION='A' AND s.INDEX_TYPE='BTREE' AND s.IS_VISIBLE='YES' AND s.EXPRESSION IS NULL)
      THEN 1 ELSE 0 END)<>COUNT(*) THEN 'MISMATCH' ELSE 'MATCH' END AS status,
    JSON_OBJECT('expectedParts',COUNT(*),'actualDetails','RS05_INDEX_METADATA') AS evidence
  FROM expected_indexes e GROUP BY e.table_name,e.index_name
),
extra_objects AS (
  SELECT 'UNEXPECTED_COLUMN' AS check_kind,c.TABLE_NAME AS table_name,c.COLUMN_NAME AS object_name,'UNVERIFIED' AS status,
    JSON_OBJECT('note','Outside reviewed canonical baseline') AS evidence
  FROM information_schema.COLUMNS c WHERE c.TABLE_SCHEMA=DATABASE() AND c.TABLE_NAME IN ('document_revisions','workflow_comments','stored_files')
    AND NOT EXISTS(SELECT 1 FROM expected_columns e WHERE BINARY e.table_name=BINARY c.TABLE_NAME AND BINARY e.column_name=BINARY c.COLUMN_NAME)
  UNION ALL
  SELECT DISTINCT 'UNEXPECTED_INDEX',s.TABLE_NAME,s.INDEX_NAME,'UNVERIFIED',JSON_OBJECT('note','Outside reviewed canonical baseline')
  FROM information_schema.STATISTICS s WHERE s.TABLE_SCHEMA=DATABASE() AND s.TABLE_NAME IN ('document_revisions','workflow_comments','stored_files')
    AND NOT EXISTS(SELECT 1 FROM expected_indexes e WHERE BINARY e.table_name=BINARY s.TABLE_NAME AND BINARY e.index_name=BINARY s.INDEX_NAME)
  UNION ALL
  SELECT 'UNEXPECTED_CONSTRAINT',t.TABLE_NAME,t.CONSTRAINT_NAME,'UNVERIFIED',JSON_OBJECT('type',t.CONSTRAINT_TYPE)
  FROM information_schema.TABLE_CONSTRAINTS t WHERE t.CONSTRAINT_SCHEMA=DATABASE() AND t.TABLE_NAME IN ('document_revisions','workflow_comments','stored_files')
    AND t.CONSTRAINT_TYPE IN ('CHECK','FOREIGN KEY')
    AND NOT EXISTS(SELECT 1 FROM expected_expressions e WHERE e.object_kind='CHECK' AND BINARY e.table_name=BINARY t.TABLE_NAME AND BINARY e.object_name=BINARY t.CONSTRAINT_NAME)
    AND NOT EXISTS(SELECT 1 FROM expected_fks e WHERE BINARY e.table_name=BINARY t.TABLE_NAME AND BINARY e.constraint_name=BINARY t.CONSTRAINT_NAME)
),
baseline_state AS (
  SELECT CASE WHEN baseline_server_uuid IS NULL OR baseline_schema IS NULL OR baseline_version IS NULL
    OR baseline_captured_at_utc IS NULL OR NULLIF(TRIM(baseline_evidence_reference),'') IS NULL
    OR revision_count IS NULL OR comment_count IS NULL OR file_count IS NULL THEN 'UNVERIFIED'
    WHEN BINARY baseline_server_uuid<>BINARY @@server_uuid OR BINARY baseline_schema<>BINARY DATABASE()
      OR BINARY baseline_version<>BINARY VERSION() OR baseline_captured_at_utc>UTC_TIMESTAMP(6) THEN 'MISMATCH'
    ELSE 'MATCH' END AS status FROM baseline_input
),
actual_counts AS (
  SELECT 'document_revisions' AS table_name,COUNT(*) AS actual_count FROM document_revisions
  UNION ALL SELECT 'workflow_comments',COUNT(*) FROM workflow_comments
  UNION ALL SELECT 'stored_files',COUNT(*) FROM stored_files
),
expected_counts AS (
  SELECT 'document_revisions' AS table_name,revision_count AS expected_count FROM baseline_input
  UNION ALL SELECT 'workflow_comments',comment_count FROM baseline_input
  UNION ALL SELECT 'stored_files',file_count FROM baseline_input
),
snapshot_counts AS (
  SELECT 'document_revisions' AS table_name,'upload_stage_snapshot' AS object_name,COUNT(*) AS nonnull_count FROM document_revisions WHERE upload_stage_snapshot IS NOT NULL
  UNION ALL SELECT 'document_revisions','uploaded_by_username_snapshot',COUNT(*) FROM document_revisions WHERE uploaded_by_username_snapshot IS NOT NULL
  UNION ALL SELECT 'document_revisions','uploaded_by_role_snapshot',COUNT(*) FROM document_revisions WHERE uploaded_by_role_snapshot IS NOT NULL
  UNION ALL SELECT 'workflow_comments','created_by_username_snapshot',COUNT(*) FROM workflow_comments WHERE created_by_username_snapshot IS NOT NULL
  UNION ALL SELECT 'workflow_comments','approval_target_stage_snapshot',COUNT(*) FROM workflow_comments WHERE approval_target_stage_snapshot IS NOT NULL
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
),
structure_results AS (
  SELECT * FROM table_results UNION ALL SELECT * FROM column_results UNION ALL SELECT * FROM parent_results
  UNION ALL SELECT * FROM check_results UNION ALL SELECT * FROM generated_results UNION ALL SELECT * FROM fk_results
  UNION ALL SELECT * FROM index_results UNION ALL SELECT * FROM extra_objects
),
all_results AS (
  SELECT * FROM structure_results
  UNION ALL SELECT 'ENVIRONMENT','', 'MYSQL_VERSION',CASE WHEN DATABASE() IS NOT NULL AND BINARY SUBSTRING_INDEX(VERSION(),'-',1)=BINARY '9.7.4'
    AND VERSION() NOT LIKE '%MariaDB%' THEN 'MATCH' ELSE 'MISMATCH' END,JSON_OBJECT('actual',VERSION(),'expected','9.7.4')
  UNION ALL SELECT 'ENVIRONMENT','','FOREIGN_KEY_CHECKS',IF(@@foreign_key_checks=1,'MATCH','MISMATCH'),JSON_OBJECT('actual',@@foreign_key_checks)
  UNION ALL SELECT 'BASELINE','','SAME_ENVIRONMENT_PREFLIGHT',s.status,JSON_OBJECT('uuid',b.baseline_server_uuid,'schema',b.baseline_schema,
    'version',b.baseline_version,'capturedUTC',b.baseline_captured_at_utc,'evidence',b.baseline_evidence_reference,'authenticity','Owner verification required')
    FROM baseline_state s CROSS JOIN baseline_input b
  UNION ALL SELECT 'ROW_COUNT',a.table_name,a.table_name,CASE WHEN s.status<>'MATCH' THEN s.status
    WHEN a.actual_count=e.expected_count THEN 'MATCH' ELSE 'MISMATCH' END,
    JSON_OBJECT('actual',a.actual_count,'expected',e.expected_count,'proofLimit','Counts alone do not verify row contents')
    FROM actual_counts a JOIN expected_counts e ON BINARY e.table_name=BINARY a.table_name CROSS JOIN baseline_state s
  UNION ALL SELECT 'SNAPSHOTS_NULL',table_name,object_name,IF(nonnull_count=0,'MATCH','MISMATCH'),
    JSON_OBJECT('nonnullCount',nonnull_count,'scope','Immediate post-migration, before writers resume; not a universal operational invariant') FROM snapshot_counts
  UNION ALL SELECT 'RELATIONSHIP','',check_name,IF(broken_links=0,'MATCH','MISMATCH'),JSON_OBJECT('brokenLinks',broken_links) FROM integrity_rows
),
table_states AS (
  SELECT t.table_name,
    CASE WHEN EXISTS(SELECT 1 FROM structure_results r WHERE BINARY r.table_name=BINARY t.table_name AND r.status='MISMATCH') THEN 'STRUCTURE_MISMATCH'
      WHEN EXISTS(SELECT 1 FROM structure_results r WHERE BINARY r.table_name=BINARY t.table_name AND r.status='MISSING') THEN 'MISSING_OR_PARTIALLY_APPLIED'
      WHEN EXISTS(SELECT 1 FROM structure_results r WHERE BINARY r.table_name=BINARY t.table_name AND r.status<>'MATCH') THEN 'UNVERIFIED'
      ELSE 'APPLIED / STRUCTURE MATCH' END AS migration_state
  FROM (SELECT 'document_revisions' AS table_name UNION ALL SELECT 'workflow_comments') t
),
summary AS (
  SELECT COUNT(*) AS checks_total,SUM(status='MATCH') AS matched,
    SUM(status IN ('MISSING','MISMATCH')) AS failed,SUM(status NOT IN ('MATCH','MISSING','MISMATCH')) AS unverified,
    CASE WHEN SUM(status IN ('MISSING','MISMATCH'))>0 THEN 'POSTFLIGHT_FAIL'
      WHEN SUM(status<>'MATCH')>0 OR COUNT(*)=0 THEN 'POSTFLIGHT_UNVERIFIED' ELSE 'POSTFLIGHT_PASS' END AS automated_status
  FROM all_results
)
SELECT 'RS11_CHECK' AS result_set,check_kind,table_name,object_name,status,CAST(evidence AS CHAR CHARACTER SET utf8mb4) AS evidence
FROM all_results
UNION ALL SELECT 'RS11_TABLE_STATE','MIGRATION_STATE',table_name,table_name,migration_state,
  'Per-object diagnostics above; no schema change is performed' FROM table_states
UNION ALL SELECT 'RS11_FINAL','AUTOMATED_SQL','','AUTOMATED_SQL_VERIFICATION',automated_status,
  CAST(JSON_OBJECT('checks',checks_total,'matched',matched,'failed',failed,'unverified',unverified,
    'runtimeErrors','Any SQL error or incomplete output invalidates this status') AS CHAR CHARACTER SET utf8mb4) FROM summary
UNION ALL SELECT 'RS11_MANUAL','MANUAL_GATE','','ENVIRONMENT_IDENTITY','UNVERIFIED','Owner: compare RS01 UUID and endpoint with trusted Railway service/environment configuration'
UNION ALL SELECT 'RS11_MANUAL','MANUAL_GATE','','BACKUP_VERIFICATION','UNVERIFIED','Owner: verify correct environment backup completeness, integrity and restore evidence'
UNION ALL SELECT 'RS11_MANUAL','MANUAL_GATE','','WRITER_QUIESCENCE','UNVERIFIED','Owner: independently verify application/background writers stayed stopped throughout migration and verification'
UNION ALL SELECT 'RS11_MANUAL','MANUAL_GATE','','INDEPENDENT_DATA_INTEGRITY','UNVERIFIED','Owner: compare saved same-environment preflight; counts do not prove unchanged row contents or physical file bytes'
UNION ALL SELECT 'RS11_MANUAL','MANUAL_GATE','','OVERALL_RELEASE_READINESS','UNVERIFIED','Automated SQL PASS is not release approval; all independent manual gates require evidence'
ORDER BY result_set,check_kind,table_name,object_name;
