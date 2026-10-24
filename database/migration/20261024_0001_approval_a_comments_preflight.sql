-- PREPARED ONLY - NOT EXECUTED
-- Read-only data/schema queries plus connection-local snapshot variables.
-- Keep this connection alive through migration and verification; snapshots are NOT backups.
-- Never print/store row-level user data. GROUP_CONCAT truncation means STOP.
-- Do not silently change group_concat_max_len. Any session adjustment needs reviewed approval.
SELECT DATABASE(), VERSION(), @@hostname, @@port, CONNECTION_ID(), @@sql_mode, @@group_concat_max_len;
SHOW CREATE TABLE workflow_comments;
SHOW INDEX FROM workflow_comments;
SELECT tc.CONSTRAINT_NAME, tc.CONSTRAINT_TYPE, cc.CHECK_CLAUSE
FROM information_schema.TABLE_CONSTRAINTS tc
LEFT JOIN information_schema.CHECK_CONSTRAINTS cc ON cc.CONSTRAINT_SCHEMA = tc.CONSTRAINT_SCHEMA AND cc.CONSTRAINT_NAME = tc.CONSTRAINT_NAME
WHERE tc.CONSTRAINT_SCHEMA = DATABASE() AND tc.TABLE_NAME = 'workflow_comments'
ORDER BY tc.CONSTRAINT_NAME;

SELECT workflow_action, COUNT(*) AS total FROM workflow_comments GROUP BY workflow_action;
SELECT COUNT(*) AS invalid_rows FROM workflow_comments
WHERE workflow_action IS NULL OR workflow_action NOT IN ('Approval B', 'Approval C');
SET @aac_before_database = DATABASE(), @aac_before_connection = CONNECTION_ID();
SELECT COUNT(*), COALESCE(GROUP_CONCAT(SHA2(JSON_ARRAY(id, project_id, document_id, revision_id, workflow_action, workflow_comment, created_by_user_id, created_by_name_snapshot, created_by_official_role_snapshot, DATE_FORMAT(created_at, '%Y-%m-%d %H:%i:%s.%f')), 256) ORDER BY id SEPARATOR ''), '')
INTO @aac_before_count, @aac_before_rows FROM workflow_comments;
SET @aac_before_rows_complete = OCTET_LENGTH(@aac_before_rows) = 64 * @aac_before_count;
SELECT COUNT(*), COALESCE(GROUP_CONCAT(SHA2(payload, 256) ORDER BY payload SEPARATOR ''), '')
INTO @aac_before_meta_count, @aac_before_meta FROM (
SELECT JSON_ARRAY('column', ORDINAL_POSITION, COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE, COLUMN_DEFAULT, EXTRA, CHARACTER_SET_NAME, COLLATION_NAME) AS payload
FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'workflow_comments'
UNION ALL
SELECT JSON_ARRAY('index', INDEX_NAME, NON_UNIQUE, SEQ_IN_INDEX, COLUMN_NAME, SUB_PART, COLLATION, INDEX_TYPE)
FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'workflow_comments'
UNION ALL
SELECT JSON_ARRAY('foreign-key', CONSTRAINT_NAME, ORDINAL_POSITION, COLUMN_NAME, REFERENCED_TABLE_SCHEMA, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME)
FROM information_schema.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'workflow_comments' AND REFERENCED_TABLE_NAME IS NOT NULL
UNION ALL
SELECT JSON_ARRAY('reference-rules', CONSTRAINT_NAME, UPDATE_RULE, DELETE_RULE, REFERENCED_TABLE_NAME)
FROM information_schema.REFERENTIAL_CONSTRAINTS WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'workflow_comments'
UNION ALL
SELECT JSON_ARRAY('constraint', tc.CONSTRAINT_NAME, tc.CONSTRAINT_TYPE, cc.CHECK_CLAUSE)
FROM information_schema.TABLE_CONSTRAINTS tc
LEFT JOIN information_schema.CHECK_CONSTRAINTS cc ON cc.CONSTRAINT_SCHEMA = tc.CONSTRAINT_SCHEMA AND cc.CONSTRAINT_NAME = tc.CONSTRAINT_NAME
WHERE tc.CONSTRAINT_SCHEMA = DATABASE() AND tc.TABLE_NAME = 'workflow_comments'
AND tc.CONSTRAINT_NAME <> 'chk_workflow_comments_workflow_action'
) AS metadata_rows;
SET @aac_before_meta_complete = OCTET_LENGTH(@aac_before_meta) = 64 * @aac_before_meta_count;

SELECT @aac_before_count AS comment_count, @aac_before_rows_complete AS rows_snapshot_complete,
       @aac_before_meta_complete AS metadata_snapshot_complete;
-- Manual gate: confirm correct environment/engine, InnoDB, actual named CHECK exactly B/C,
-- enforcement enabled, invalid_rows=0, both snapshots complete, backup ready and writers stopped.
-- These queries DO NOT grant permission to execute the migration.
