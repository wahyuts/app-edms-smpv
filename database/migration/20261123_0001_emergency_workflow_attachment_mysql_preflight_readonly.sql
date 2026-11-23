-- Emergency Workflow Attachment MySQL migration: STANDALONE READ-ONLY PREFLIGHT.
-- Reference: 20261123_0001_emergency_workflow_attachment_mysql.sql (not executed).
-- Target guard requires VERSION() exactly '9.7.4', not MariaDB.
-- Select the intended Railway connection/schema manually. No schema is selected here.
-- Run RS01/RS02 FIRST. Verify identity against trusted Railway environment records;
-- a database name alone cannot identify Development, Staging or Production.
-- If identity/version, table or required columns fail, STOP before RS03..RS11.
-- Configure the client to STOP ON FIRST SQL ERROR. Missing/error result sets are
-- NOT a PASS. Missing table/columns cannot be queried conditionally without dynamic
-- SQL; this file deliberately does not hide those errors or use dynamic execution.
-- RS11 mirrors the existing migration guard, not a broader schema certification.
-- Unknown CHECK text is MANUAL_REVIEW_REQUIRED, never a normalized/assumed match.
-- PASS does NOT authorize migration, prove backup readiness or writer quiescence.
-- Queries are separate snapshots: capture evidence while writers are quiescent.
-- Save all result sets before any separately approved migration. Counts are NOT
-- proof that all old contents are unchanged, and this SQL does not inspect storage.
-- No business comment text, usernames, full names, or fingerprint values are read.
-- Existing canonical schema is the POST-migration target: its Emergency action,
-- request_fingerprint and emergency CHECK must NOT already exist in this baseline.
-- Prerequisites reviewed: 20261024_0001_approval_a_comments_mysql.sql,
-- 20261116_0001_revision_upload_snapshots.sql,
-- 20261117_0001_approval_a_history_snapshots.sql. Revision upload snapshots belong
-- to document_revisions; the Emergency migration guard checks the two comment
-- snapshot column names only. Column/FK/index definitions below remain review evidence.
-- RS11 additionally checks FK compatibility for the statically reviewed MySQL CHECK
-- columns: workflow_action, request_fingerprint, approval_target_stage_snapshot.
-- revision_id must be excluded from that CHECK, not from the existing FK.
-- SQL cannot inspect the local migration file: source verification remains MANUAL.
-- Technical PASS is conditional on using the matching statically validated file.

-- RS01: environment identity and the exact engine/version/session requirements.
SELECT 'RS01_ENVIRONMENT' AS result_set,
  DATABASE() AS selected_schema, VERSION() AS server_version,
  @@server_uuid AS server_uuid, @@hostname AS hostname, @@port AS port,
  @@session.sql_mode AS sql_mode, @@foreign_key_checks AS foreign_key_checks,
  CASE WHEN DATABASE() IS NOT NULL AND VERSION()='9.7.4'
    AND VERSION() NOT LIKE '%MariaDB%' THEN 'PASS' ELSE 'STOP' END AS identity_version_gate,
  'MANUAL_REVIEW_REQUIRED: verify endpoint/service/environment, backup and stopped writers independently' AS operator_gate;

-- RS02: safe metadata-only gate. Do not continue if any required object is missing.
SELECT 'RS02_TABLE_AND_COLUMN_GATE' AS result_set, t.TABLE_NAME,t.TABLE_TYPE,t.ENGINE,t.TABLE_COLLATION,
  CASE WHEN t.TABLE_NAME IS NOT NULL AND t.TABLE_TYPE='BASE TABLE' AND t.ENGINE='InnoDB'
    AND (SELECT COUNT(*) FROM information_schema.COLUMNS c WHERE c.TABLE_SCHEMA=DATABASE()
      AND c.TABLE_NAME='workflow_comments' AND c.COLUMN_NAME IN (
        'workflow_action','created_by_name_snapshot','created_by_official_role_snapshot',
        'created_by_username_snapshot','approval_target_stage_snapshot'))=5
    THEN 'PASS' ELSE 'STOP' END AS data_query_prerequisites,
  (SELECT COUNT(*) FROM information_schema.COLUMNS c WHERE c.TABLE_SCHEMA=DATABASE()
    AND c.TABLE_NAME='workflow_comments' AND c.COLUMN_NAME='request_fingerprint') AS existing_request_fingerprint_columns,
  (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS tc WHERE tc.CONSTRAINT_SCHEMA=DATABASE()
    AND tc.CONSTRAINT_NAME='chk_workflow_comments_emergency_request') AS existing_emergency_constraint_names,
  'Existing fingerprint/constraint means STOP: already or partially applied, not a rerun candidate' AS migration_state_note
FROM (SELECT 1 AS singleton) seed
LEFT JOIN information_schema.TABLES t ON t.TABLE_SCHEMA=DATABASE() AND t.TABLE_NAME='workflow_comments';

-- RS03: all column definitions, including snapshot types/defaults and ordering.
-- Expected prerequisite snapshots: username VARCHAR(255), target stage VARCHAR(64),
-- both nullable/default NULL. Guard itself tests their existence, not these types.
SELECT 'RS03_COLUMNS' AS result_set,TABLE_NAME,COLUMN_NAME,ORDINAL_POSITION,
  COLUMN_TYPE,IS_NULLABLE,COLUMN_DEFAULT,EXTRA,CHARACTER_SET_NAME,COLLATION_NAME,
  GENERATION_EXPRESSION
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='workflow_comments'
ORDER BY ORDINAL_POSITION;

-- RS04: raw CHECKs, enforcement and HEX. Include same-name emergency collisions
-- elsewhere in the selected schema, because the migration absence guard is schema-wide.
SELECT 'RS04_CHECK_CONSTRAINTS' AS result_set,tc.TABLE_NAME,tc.CONSTRAINT_NAME,
  tc.CONSTRAINT_TYPE,tc.ENFORCED,cc.CHECK_CLAUSE,HEX(cc.CHECK_CLAUSE) AS check_clause_hex,
  JSON_QUOTE(cc.CHECK_CLAUSE) AS check_clause_json,
  CASE WHEN BINARY tc.CONSTRAINT_NAME<>BINARY 'chk_workflow_comments_workflow_action'
    THEN 'MANUAL_REVIEW_REQUIRED'
    WHEN BINARY tc.TABLE_NAME<>BINARY 'workflow_comments' OR tc.CONSTRAINT_TYPE<>'CHECK' OR tc.ENFORCED<>'YES'
    THEN 'FAIL'
    WHEN BINARY cc.CHECK_CLAUSE IN (
      BINARY 'workflow_action IN (''Approval A'', ''Approval B'', ''Approval C'')',
      BINARY '(`workflow_action` in (''Approval A'',''Approval B'',''Approval C''))',
      BINARY '`workflow_action` in (''Approval A'',''Approval B'',''Approval C'')',
      BINARY '(`workflow_action` in (_utf8mb4''Approval A'',_utf8mb4''Approval B'',_utf8mb4''Approval C''))',
      -- Verified Railway metadata: 93 bytes, including six backslash-quote pairs.
      X'2860776F726B666C6F775F616374696F6E6020696E20285F757466386D62345C27417070726F76616C20415C272C5F757466386D62345C27417070726F76616C20425C272C5F757466386D62345C27417070726F76616C20435C272929'
    ) THEN 'PASS' ELSE 'MANUAL_REVIEW_REQUIRED' END AS supported_workflow_action_baseline
FROM information_schema.TABLE_CONSTRAINTS tc
LEFT JOIN information_schema.CHECK_CONSTRAINTS cc ON cc.CONSTRAINT_SCHEMA=tc.CONSTRAINT_SCHEMA
  AND cc.CONSTRAINT_NAME=tc.CONSTRAINT_NAME
WHERE tc.CONSTRAINT_SCHEMA=DATABASE() AND tc.CONSTRAINT_TYPE='CHECK'
  AND (tc.TABLE_NAME='workflow_comments' OR tc.CONSTRAINT_NAME='chk_workflow_comments_emergency_request')
ORDER BY tc.TABLE_NAME,tc.CONSTRAINT_NAME;

-- RS05: primary/unique/foreign key columns plus referenced schema and FK rules.
SELECT 'RS05_KEYS_AND_FOREIGN_KEYS' AS result_set,tc.TABLE_NAME,tc.CONSTRAINT_NAME,
  tc.CONSTRAINT_TYPE,k.ORDINAL_POSITION,k.COLUMN_NAME,k.POSITION_IN_UNIQUE_CONSTRAINT,
  k.REFERENCED_TABLE_SCHEMA,k.REFERENCED_TABLE_NAME,k.REFERENCED_COLUMN_NAME,
  r.UPDATE_RULE,r.DELETE_RULE,r.MATCH_OPTION
FROM information_schema.TABLE_CONSTRAINTS tc
LEFT JOIN information_schema.KEY_COLUMN_USAGE k ON k.CONSTRAINT_SCHEMA=tc.CONSTRAINT_SCHEMA
  AND k.TABLE_NAME=tc.TABLE_NAME AND k.CONSTRAINT_NAME=tc.CONSTRAINT_NAME
LEFT JOIN information_schema.REFERENTIAL_CONSTRAINTS r ON r.CONSTRAINT_SCHEMA=tc.CONSTRAINT_SCHEMA
  AND r.TABLE_NAME=tc.TABLE_NAME AND r.CONSTRAINT_NAME=tc.CONSTRAINT_NAME
WHERE tc.CONSTRAINT_SCHEMA=DATABASE() AND tc.TABLE_NAME='workflow_comments'
  AND tc.CONSTRAINT_TYPE IN ('PRIMARY KEY','UNIQUE','FOREIGN KEY')
ORDER BY tc.CONSTRAINT_NAME,k.ORDINAL_POSITION;

-- RS06: every index part, not only index-name presence.
SELECT 'RS06_INDEXES' AS result_set,TABLE_NAME,INDEX_NAME,NON_UNIQUE,SEQ_IN_INDEX,
  COLUMN_NAME,SUB_PART,COLLATION,INDEX_TYPE,IS_VISIBLE,EXPRESSION
FROM information_schema.STATISTICS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='workflow_comments'
ORDER BY INDEX_NAME,SEQ_IN_INDEX;

-- RS07: actual DDL; SHOW is diagnostic, not a schema modification.
SHOW CREATE TABLE workflow_comments;

-- RS08: data baseline. Preserve the original guard's collation-dependent NOT IN
-- exactly; byte-exact text/HEX diagnostics are separate and do not replace that rule.
SELECT 'RS08_ROW_BASELINE' AS result_set,COUNT(*) AS total_workflow_comments,
  COALESCE(SUM(workflow_action NOT IN ('Approval A','Approval B','Approval C')),0) AS unexpected_action_rows,
  COALESCE(SUM(workflow_action='Emergency Workflow Attachment'),0) AS existing_emergency_rows,
  COALESCE(SUM(workflow_action IS NULL),0) AS null_action_rows
FROM workflow_comments;

-- HEX keeps case/space variants separate even under a case-insensitive collation.
SELECT 'RS09_ACTION_COUNTS' AS result_set,workflow_action,HEX(workflow_action) AS action_hex,COUNT(*) AS row_count,
  CASE WHEN workflow_action NOT IN ('Approval A','Approval B','Approval C') THEN 'FAIL'
    WHEN workflow_action IS NULL THEN 'MANUAL_REVIEW_REQUIRED' ELSE 'PASS' END AS baseline_action_status
FROM workflow_comments GROUP BY workflow_action,HEX(workflow_action)
ORDER BY action_hex;

-- RS10: aggregate snapshot availability only; NULL historical snapshots are allowed.
SELECT 'RS10_SNAPSHOT_COUNTS' AS result_set,COUNT(*) AS total_rows,
  COALESCE(SUM(created_by_username_snapshot IS NULL),0) AS username_snapshot_null,
  COALESCE(SUM(created_by_username_snapshot IS NOT NULL),0) AS username_snapshot_nonnull,
  COALESCE(SUM(approval_target_stage_snapshot IS NULL),0) AS target_stage_snapshot_null,
  COALESCE(SUM(approval_target_stage_snapshot IS NOT NULL),0) AS target_stage_snapshot_nonnull,
  COALESCE(SUM(created_by_name_snapshot IS NULL),0) AS fullname_snapshot_null,
  COALESCE(SUM(created_by_name_snapshot IS NOT NULL),0) AS fullname_snapshot_nonnull,
  COALESCE(SUM(created_by_official_role_snapshot IS NULL),0) AS official_role_snapshot_null,
  COALESCE(SUM(created_by_official_role_snapshot IS NOT NULL),0) AS official_role_snapshot_nonnull
FROM workflow_comments;

-- RS11: migration guard facts and conservative readiness, independent of session variables.
-- Definitions are the same four original strings plus one verified 93-byte HEX literal.
-- Missing/unenforced constraint = FAIL; unknown text = manual review, not PASS.
-- NULL/unknown guard facts cannot fall through to PASS.
-- Additional conservative data check: NULL actions are incompatible with the
-- canonical NOT NULL column, even though the migration's NOT IN predicate omits NULL.
-- Dedicated FK compatibility assessment: inspect outgoing and incoming FK columns.
-- Known revision SET NULL is expected but would be incompatible IF referenced by
-- the CHECK. Any FK on a reviewed CHECK column is conservatively blocked/reviewed.
WITH relevant_fk_columns AS (
  SELECT k.CONSTRAINT_SCHEMA,k.CONSTRAINT_NAME,k.TABLE_SCHEMA,k.TABLE_NAME,k.COLUMN_NAME,
    k.REFERENCED_TABLE_SCHEMA,k.REFERENCED_TABLE_NAME,k.REFERENCED_COLUMN_NAME,
    r.UPDATE_RULE,r.DELETE_RULE,
    (k.TABLE_SCHEMA=DATABASE() AND BINARY k.TABLE_NAME=BINARY 'workflow_comments') AS outgoing,
    ((k.TABLE_SCHEMA=DATABASE() AND BINARY k.TABLE_NAME=BINARY 'workflow_comments'
      AND BINARY k.COLUMN_NAME IN (BINARY 'workflow_action',BINARY 'request_fingerprint',BINARY 'approval_target_stage_snapshot'))
      OR (k.REFERENCED_TABLE_SCHEMA=DATABASE() AND BINARY k.REFERENCED_TABLE_NAME=BINARY 'workflow_comments'
      AND BINARY k.REFERENCED_COLUMN_NAME IN (BINARY 'workflow_action',BINARY 'request_fingerprint',BINARY 'approval_target_stage_snapshot'))) AS check_column
  FROM information_schema.KEY_COLUMN_USAGE k
  LEFT JOIN information_schema.REFERENTIAL_CONSTRAINTS r ON r.CONSTRAINT_SCHEMA=k.CONSTRAINT_SCHEMA
    AND r.TABLE_NAME=k.TABLE_NAME AND r.CONSTRAINT_NAME=k.CONSTRAINT_NAME
  WHERE k.REFERENCED_TABLE_NAME IS NOT NULL AND
    ((k.TABLE_SCHEMA=DATABASE() AND BINARY k.TABLE_NAME=BINARY 'workflow_comments')
      OR (k.REFERENCED_TABLE_SCHEMA=DATABASE() AND BINARY k.REFERENCED_TABLE_NAME=BINARY 'workflow_comments'))
), fk_counts AS (
  SELECT
    COALESCE(SUM(outgoing AND BINARY CONSTRAINT_NAME=BINARY 'fk_workflow_comments_revision_id'
      AND BINARY COLUMN_NAME=BINARY 'revision_id' AND REFERENCED_TABLE_SCHEMA=DATABASE()
      AND BINARY REFERENCED_TABLE_NAME=BINARY 'document_revisions' AND BINARY REFERENCED_COLUMN_NAME=BINARY 'id'
      AND UPDATE_RULE='RESTRICT' AND DELETE_RULE='SET NULL'),0) AS expected_revision_fk_count,
    COALESCE(SUM(outgoing AND BINARY COLUMN_NAME=BINARY 'revision_id'),0) AS revision_fk_column_count,
    COALESCE(SUM(outgoing AND BINARY CONSTRAINT_NAME=BINARY 'fk_workflow_comments_revision_id'),0) AS named_revision_fk_column_count,
    COALESCE(SUM(check_column),0) AS check_column_fk_count,
    COALESCE(SUM(check_column AND (UPDATE_RULE NOT IN ('RESTRICT','NO ACTION')
      OR DELETE_RULE NOT IN ('RESTRICT','NO ACTION'))),0) AS incompatible_check_fk_count,
    COALESCE(SUM(UPDATE_RULE IS NULL OR DELETE_RULE IS NULL),0) AS unknown_fk_rule_count
  FROM relevant_fk_columns
), fk_compatibility AS (
  SELECT fk_counts.*,
    CASE WHEN expected_revision_fk_count<>1 OR revision_fk_column_count<>1
      OR named_revision_fk_column_count<>1 OR incompatible_check_fk_count>0 THEN 'STOP'
      WHEN check_column_fk_count=0 AND unknown_fk_rule_count=0 THEN 'PASS'
      ELSE 'MANUAL_REVIEW_REQUIRED' END AS mysql_check_fk_compatibility
  FROM fk_counts
)
SELECT 'RS11_READINESS' AS result_set,selected_schema,server_version,
  IF(version_match=1,'PASS','FAIL') AS engine_version_ok,
  IF(table_count=1,'PASS','FAIL') AS table_exists,
  IF(innodb_count=1,'PASS','FAIL') AS engine_ok,
  IF(prerequisite_count=2,'PASS','FAIL') AS prerequisites_ok,
  IF(fingerprint_count=0,'PASS','FAIL') AS request_fingerprint_absent,
  IF(emergency_constraint_count=0,'PASS','FAIL') AS emergency_constraint_absent,
  CASE WHEN named_action_constraint_count<>1 OR enforced_action_constraint_count<>1 THEN 'FAIL'
    WHEN supported_action_constraint_count=1 THEN 'PASS'
    ELSE 'MANUAL_REVIEW_REQUIRED' END AS workflow_action_constraint_ok,
  IF(unexpected_action_count=0 AND null_action_count=0,'PASS','FAIL') AS existing_actions_ok,
  IF(foreign_key_checks=1,'PASS','FAIL') AS foreign_key_checks_ok,
  mysql_check_fk_compatibility,expected_revision_fk_count,revision_fk_column_count,
  named_revision_fk_column_count,check_column_fk_count,incompatible_check_fk_count,unknown_fk_rule_count,
  'Expected revision_id FK: RESTRICT / SET NULL; incompatible only if used in CHECK' AS revision_fk_note,
  'workflow_action,request_fingerprint,approval_target_stage_snapshot; revision_id excluded' AS reviewed_mysql_check_columns,
  'MANUAL_REVIEW_REQUIRED: SQL cannot inspect local migration source; use statically validated corrected file' AS migration_source_verification,
  total_comment_count,unexpected_action_count,existing_emergency_count,null_action_count,
  CASE WHEN selected_schema IS NULL OR version_match=0 OR table_count<>1 OR innodb_count<>1
    OR prerequisite_count<>2 OR fingerprint_count<>0 OR emergency_constraint_count<>0
    OR named_action_constraint_count<>1 OR enforced_action_constraint_count<>1
    OR unexpected_action_count<>0 OR null_action_count<>0 OR foreign_key_checks<>1
    OR mysql_check_fk_compatibility='STOP' THEN 'STOP'
    WHEN (selected_schema IS NOT NULL AND version_match=1 AND table_count=1 AND innodb_count=1
      AND prerequisite_count=2 AND fingerprint_count=0 AND emergency_constraint_count=0
      AND supported_action_constraint_count=1 AND unexpected_action_count=0 AND null_action_count=0 AND foreign_key_checks=1
      AND mysql_check_fk_compatibility='PASS') IS TRUE
      THEN 'PASS'
    ELSE 'MANUAL_REVIEW_REQUIRED' END AS migration_readiness,
  'Technical guard match only; no migration authorization, backup proof, writer proof, or complete schema/data attestation' AS readiness_scope
FROM (
  SELECT DATABASE() AS selected_schema,VERSION() AS server_version,
    (VERSION()='9.7.4' AND VERSION() NOT LIKE '%MariaDB%') AS version_match,
    @@foreign_key_checks AS foreign_key_checks,
    (SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA=DATABASE()
      AND TABLE_NAME='workflow_comments') AS table_count,
    (SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA=DATABASE()
      AND TABLE_NAME='workflow_comments' AND ENGINE='InnoDB') AS innodb_count,
    (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='workflow_comments'
      AND COLUMN_NAME IN ('created_by_username_snapshot','approval_target_stage_snapshot')) AS prerequisite_count,
    (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='workflow_comments'
      AND COLUMN_NAME='request_fingerprint') AS fingerprint_count,
    (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS WHERE CONSTRAINT_SCHEMA=DATABASE()
      AND CONSTRAINT_NAME='chk_workflow_comments_emergency_request') AS emergency_constraint_count,
    (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS tc WHERE tc.CONSTRAINT_SCHEMA=DATABASE()
      AND BINARY tc.TABLE_NAME=BINARY 'workflow_comments'
      AND BINARY tc.CONSTRAINT_NAME=BINARY 'chk_workflow_comments_workflow_action') AS named_action_constraint_count,
    (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS tc WHERE tc.CONSTRAINT_SCHEMA=DATABASE()
      AND BINARY tc.TABLE_NAME=BINARY 'workflow_comments'
      AND BINARY tc.CONSTRAINT_NAME=BINARY 'chk_workflow_comments_workflow_action'
      AND tc.CONSTRAINT_TYPE='CHECK' AND tc.ENFORCED='YES') AS enforced_action_constraint_count,
    (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS tc JOIN information_schema.CHECK_CONSTRAINTS cc
      ON cc.CONSTRAINT_SCHEMA=tc.CONSTRAINT_SCHEMA AND cc.CONSTRAINT_NAME=tc.CONSTRAINT_NAME
      WHERE tc.CONSTRAINT_SCHEMA=DATABASE() AND BINARY tc.TABLE_NAME=BINARY 'workflow_comments'
        AND BINARY tc.CONSTRAINT_NAME=BINARY 'chk_workflow_comments_workflow_action'
        AND tc.CONSTRAINT_TYPE='CHECK' AND tc.ENFORCED='YES'
        AND BINARY cc.CHECK_CLAUSE IN (
          BINARY 'workflow_action IN (''Approval A'', ''Approval B'', ''Approval C'')',
          BINARY '(`workflow_action` in (''Approval A'',''Approval B'',''Approval C''))',
          BINARY '`workflow_action` in (''Approval A'',''Approval B'',''Approval C'')',
          BINARY '(`workflow_action` in (_utf8mb4''Approval A'',_utf8mb4''Approval B'',_utf8mb4''Approval C''))',
          -- Verified Railway metadata: 93 bytes, including six backslash-quote pairs.
          X'2860776F726B666C6F775F616374696F6E6020696E20285F757466386D62345C27417070726F76616C20415C272C5F757466386D62345C27417070726F76616C20425C272C5F757466386D62345C27417070726F76616C20435C272929'
        )) AS supported_action_constraint_count,
    (SELECT COUNT(*) FROM workflow_comments WHERE workflow_action NOT IN ('Approval A','Approval B','Approval C')) AS unexpected_action_count,
    (SELECT COUNT(*) FROM workflow_comments WHERE workflow_action='Emergency Workflow Attachment') AS existing_emergency_count,
    (SELECT COUNT(*) FROM workflow_comments WHERE workflow_action IS NULL) AS null_action_count,
    (SELECT COUNT(*) FROM workflow_comments) AS total_comment_count
) facts CROSS JOIN fk_compatibility;
