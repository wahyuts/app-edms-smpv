-- STAGING PERMANENT DELETE / TARGETED RECOVERY APPLY / 2026-11-04
-- GENERATION ONLY: NOT EXECUTED. Review before any manual DBeaver execution.
-- Collation compatibility: byte-exact string comparisons across JSON_TABLE,
-- metadata, local variables and temporary tables; no SET NAMES or collation DDL.
-- Target: Railway staging ONLY. Never real_production or Railway production.
--
-- REQUIRED ORDER:
-- 1. Owner-approved deploy of prevention+cancellation guards, through a separate process.
-- 2. Verify deployed commit and retire EVERY old backend/worker/retry process.
-- 3. Verified maintenance (including out-of-band storage writers) + trustworthy backup.
-- 4. Run PREFLIGHT, externally verify ALL exact R2 keys, size and historical SHA-256.
-- 5. Obtain explicit owner approval of the fresh snapshots + external evidence.
-- 6. Configure the NULL inputs below, use ONE fresh dedicated DBeaver connection.
-- 7. Execute CREATE / CALL / DROP sections with MySQL delimiter handling enabled.
--    DBeaver MUST stop on error; never select Ignore/Continue for this script.
-- 8. Verify markers, retained operations, three audits, business fingerprints and access.
--
-- REQUIREMENTS: Oracle MySQL 8.0.16+; SELECT/UPDATE/INSERT, CREATE ROUTINE,
-- EXECUTE and ALTER ROUTINE privileges. SQL SECURITY INVOKER; no privilege escalation.
-- No application rows/objects/bindings are created, deleted or rewritten.
-- The maintenance procedure is NOT a permanent schema change. There is no
-- CREATE TEMPORARY PROCEDURE in MySQL: explicit DROP at the end is mandatory.
-- CREATE/DROP PROCEDURE cause implicit commits: use a fresh connection with NO
-- unrelated transaction and autocommit ON. Routine DDL is outside recovery DML.
-- If DBeaver stops on an error, run section 04 cleanup manually after reviewing
-- the error and confirming this run created the routine. Do not drop an unknown
-- pre-existing routine; CREATE intentionally has no OR REPLACE or initial DROP.
-- If rollback/connection cleanup failed, close WITHOUT committing and use a NEW
-- independently verified Staging connection for routine cleanup. DROP is DDL.
-- Temporary tables are session-local, InnoDB, and removed by the procedure.
-- SQL cannot establish Railway service identity, actual R2 bytes, maintenance,
-- trustworthy backup, or deployed code: the operator must verify these externally.
-- No input is automatically TRUE. Unconfigured CALL fails before business writes.
-- On disconnect or lost COMMIT ACK: outcome UNKNOWN. Do not retry or unlock.
-- Reconnect read-only and inspect all three markers/gates/audits first.
-- If named-lock cleanup cannot be confirmed, close the dedicated connection.

-- 01: fill ONLY after the independently verified Staging preflight + approval.
SET @expected_staging_database = NULL; -- normally railway, but copy verified identity
SET @expected_staging_server_uuid = NULL; -- PREFLIGHT result, independently tied to staging
SET @verified_railway_service_id = NULL; -- Staging MySQL service ID, NOT a credential
SET @actor_user_id = NULL; -- active project Admin, existing user ID
SET @reviewed_preflight_utc = NULL; -- exact reviewed_utc from PREFLIGHT (UTC)
SET @approved_snapshot_json = NULL; -- entire approval_snapshot_json result, exactly 3 entries
SET @external_r2_evidence_sha256 = NULL; -- hash of saved external exact-object verification report
SET @verified_r2_namespace_id = NULL; -- verified Staging namespace ID (64 hex), not fabricated
SET @verified_guards_git_commit = NULL; -- actual deployed 40-hex commit containing all guards
SET @verified_backup_reference = NULL; -- verified backup record reference; no secrets/credentials
SET @environment_confirmation = NULL; -- exact: VERIFIED_RAILWAY_STAGING_ONLY
SET @guards_confirmation = NULL; -- exact: DEPLOYED_GUARDS_AND_NO_OLD_WORKERS
SET @maintenance_confirmation = NULL; -- exact: ALL_DATABASE_AND_STORAGE_WRITERS_STOPPED
SET @r2_confirmation = NULL; -- exact: ALL_INVENTORY_FILES_MATCH_SIZE_AND_SHA256
SET @owner_confirmation = NULL; -- exact: RECOVER_THREE_STAGING_RESERVATIONS

-- 02: create this one-use maintenance procedure only on verified Staging.
DELIMITER $$
CREATE PROCEDURE edms_staging_recovery_3_20261104(
  IN p_database VARCHAR(64), IN p_server_uuid VARCHAR(64), IN p_service_id VARCHAR(128),
  IN p_actor BIGINT UNSIGNED, IN p_reviewed_utc DATETIME(3), IN p_snapshots JSON,
  IN p_external_sha VARCHAR(64), IN p_namespace_id VARCHAR(64), IN p_guards_commit VARCHAR(40),
  IN p_backup_reference VARCHAR(255), IN p_environment VARCHAR(64), IN p_guards VARCHAR(64),
  IN p_maintenance VARCHAR(64), IN p_r2 VARCHAR(64), IN p_owner VARCHAR(64)
)
SQL SECURITY INVOKER
recovery: BEGIN
  DECLARE v_i INT DEFAULT 0;
  DECLARE v_count BIGINT DEFAULT 0;
  DECLARE v_generation BIGINT UNSIGNED;
  DECLARE v_gate VARCHAR(16);
  DECLARE v_pointer VARCHAR(64);
  DECLARE v_status VARCHAR(32);
  DECLARE v_project VARCHAR(64);
  DECLARE v_document VARCHAR(64);
  DECLARE v_operation VARCHAR(64);
  DECLARE v_number VARCHAR(255);
  DECLARE v_identity VARCHAR(255);
  DECLARE v_actor_name VARCHAR(255);
  DECLARE v_department VARCHAR(255);
  DECLARE v_digest CHAR(64);
  DECLARE v_tx BOOLEAN DEFAULT FALSE;
  DECLARE v_commit_started BOOLEAN DEFAULT FALSE;
  DECLARE v_committed BOOLEAN DEFAULT FALSE;
  DECLARE v_targets_created BOOLEAN DEFAULT FALSE;
  DECLARE v_snapshots_created BOOLEAN DEFAULT FALSE;
  DECLARE v_lock1 INT DEFAULT 0;
  DECLARE v_lock2 INT DEFAULT 0;
  DECLARE v_lock3 INT DEFAULT 0;
  DECLARE v_release INT DEFAULT 0;
  DECLARE v_cleanup_failed BOOLEAN DEFAULT FALSE;
  DECLARE v_saved_metadata LONGTEXT;

  DECLARE EXIT HANDLER FOR SQLEXCEPTION, SQLWARNING, NOT FOUND
  BEGIN
    -- Preserve the original error; cleanup errors must not imply rollback succeeded.
    BEGIN
      DECLARE CONTINUE HANDLER FOR SQLEXCEPTION, SQLWARNING, NOT FOUND SET v_cleanup_failed=TRUE;
      IF v_tx THEN ROLLBACK; END IF;
      -- After failed COMMIT this only closes any still-uncommitted work; it cannot
      -- undo an already applied COMMIT and does NOT resolve an unknown outcome.
      DO RELEASE_LOCK(CONCAT('edms-del:',LEFT(SHA2('d1b06c71-ccf1-4d85-abbb-9f7f61a5d197',256),48)));
      DO RELEASE_LOCK(CONCAT('edms-del:',LEFT(SHA2('86135cc8-923b-451a-abb3-4a21729cba4c',256),48)));
      DO RELEASE_LOCK(CONCAT('edms-del:',LEFT(SHA2('012e8f62-a55a-4b2f-bbbb-f7f95e95bf0b',256),48)));
      IF v_snapshots_created THEN DROP TEMPORARY TABLE tmp_edms_staging_recovery_snapshots; END IF;
      IF v_targets_created THEN DROP TEMPORARY TABLE tmp_edms_staging_recovery_targets; END IF;
    END;
    SELECT CASE WHEN v_committed THEN 'COMMITTED - POST-COMMIT ERROR; VERIFY, DO NOT RETRY'
      WHEN v_commit_started THEN 'UNKNOWN COMMIT OUTCOME - READ-BACK REQUIRED'
      WHEN v_cleanup_failed THEN 'ERROR - CLEANUP/ROLLBACK NOT CONFIRMED; CLOSE CONNECTION'
      ELSE 'STOP - NO RECOVERY COMMIT' END AS recovery_outcome;
    RESIGNAL SQLSTATE '45000';
  END;

  -- Identity and all external attestations default to NULL at the caller.
  IF p_database IS NULL OR p_server_uuid IS NULL OR p_service_id IS NULL
    OR CHAR_LENGTH(TRIM(p_service_id))=0 OR NOT (CAST(DATABASE() AS BINARY) <=> CAST(p_database AS BINARY))
    OR NOT (CAST(@@server_uuid AS BINARY) <=> CAST(p_server_uuid AS BINARY))
    OR NOT (CAST(p_environment AS BINARY) <=> CAST('VERIFIED_RAILWAY_STAGING_ONLY' AS BINARY))
    OR NOT (CAST(p_guards AS BINARY) <=> CAST('DEPLOYED_GUARDS_AND_NO_OLD_WORKERS' AS BINARY))
    OR NOT (CAST(p_maintenance AS BINARY) <=> CAST('ALL_DATABASE_AND_STORAGE_WRITERS_STOPPED' AS BINARY))
    OR NOT (CAST(p_r2 AS BINARY) <=> CAST('ALL_INVENTORY_FILES_MATCH_SIZE_AND_SHA256' AS BINARY))
    OR NOT (CAST(p_owner AS BINARY) <=> CAST('RECOVER_THREE_STAGING_RESERVATIONS' AS BINARY))
    OR p_actor IS NULL OR p_actor=0 OR p_backup_reference IS NULL OR CHAR_LENGTH(TRIM(p_backup_reference))=0
    OR p_external_sha IS NULL OR NOT REGEXP_LIKE(p_external_sha,'^[0-9a-fA-F]{64}$','c')
    OR p_namespace_id IS NULL OR NOT REGEXP_LIKE(p_namespace_id,'^[0-9a-fA-F]{64}$','c')
    OR p_guards_commit IS NULL OR NOT REGEXP_LIKE(p_guards_commit,'^[0-9a-fA-F]{40}$','c')
  THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='STOP: verified Staging identity, evidence and explicit owner approval required'; END IF;
  IF VERSION() LIKE '%MariaDB%' OR @@version_comment NOT LIKE '%MySQL%'
    OR CAST(SUBSTRING_INDEX(VERSION(),'.',1) AS UNSIGNED)<8
    OR (CAST(SUBSTRING_INDEX(VERSION(),'.',1) AS UNSIGNED)=8 AND CAST(SUBSTRING_INDEX(SUBSTRING_INDEX(VERSION(),'.',2),'.',-1) AS UNSIGNED)=0
      AND CAST(SUBSTRING_INDEX(SUBSTRING_INDEX(VERSION(),'.',3),'.',-1) AS UNSIGNED)<16)
    OR @@autocommit<>1
  THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='STOP: Oracle MySQL 8.0.16+ and fresh autocommit session required'; END IF;
  IF p_snapshots IS NULL OR CAST(JSON_TYPE(p_snapshots) AS BINARY)<>CAST('ARRAY' AS BINARY) OR JSON_LENGTH(p_snapshots)<>3
    OR p_reviewed_utc IS NULL OR p_reviewed_utc>UTC_TIMESTAMP(3)
    OR TIMESTAMPDIFF(MICROSECOND,p_reviewed_utc,UTC_TIMESTAMP(3))>300000000
  THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='STOP: exactly three fresh reviewed snapshots required (five minutes)'; END IF;

  -- Canonical columns are hashed below; extra/missing columns require review.
  WITH expected AS (
    SELECT j.* FROM JSON_TABLE('[{"table":"projects","column":"id"},{"table":"projects","column":"project_code"},{"table":"projects","column":"project_name"},{"table":"projects","column":"description"},{"table":"projects","column":"status"},{"table":"projects","column":"created_by_user_id"},{"table":"projects","column":"created_at"},{"table":"projects","column":"updated_at"},{"table":"projects","column":"updated_by_user_id"},{"table":"projects","column":"closed_at"},{"table":"projects","column":"closed_by_user_id"},{"table":"engineering_documents","column":"id"},{"table":"engineering_documents","column":"project_id"},{"table":"engineering_documents","column":"document_type_id"},{"table":"engineering_documents","column":"document_number"},{"table":"engineering_documents","column":"description"},{"table":"engineering_documents","column":"drawing"},{"table":"engineering_documents","column":"area"},{"table":"engineering_documents","column":"days_until_validation"},{"table":"engineering_documents","column":"workflow_status"},{"table":"engineering_documents","column":"lifecycle_status"},{"table":"engineering_documents","column":"revision_label"},{"table":"engineering_documents","column":"responsible_role"},{"table":"engineering_documents","column":"current_assignee_user_id"},{"table":"engineering_documents","column":"active_revision_id"},{"table":"engineering_documents","column":"active_file_id"},{"table":"engineering_documents","column":"created_by_user_id"},{"table":"engineering_documents","column":"created_at"},{"table":"engineering_documents","column":"updated_at"},{"table":"engineering_documents","column":"updated_by_user_id"},{"table":"engineering_documents","column":"archived_at"},{"table":"engineering_documents","column":"archived_by_user_id"},{"table":"engineering_documents","column":"archive_reason"},{"table":"engineering_documents","column":"restored_at"},{"table":"engineering_documents","column":"restored_by_user_id"},{"table":"engineering_documents","column":"sla_started_at"},{"table":"engineering_documents","column":"sla_stopped_at"},{"table":"engineering_documents","column":"sla_assignee_name_snapshot"},{"table":"stored_files","column":"file_id"},{"table":"stored_files","column":"project_id"},{"table":"stored_files","column":"document_id"},{"table":"stored_files","column":"original_file_name"},{"table":"stored_files","column":"physical_file_name"},{"table":"stored_files","column":"file_extension"},{"table":"stored_files","column":"mime_type"},{"table":"stored_files","column":"file_size"},{"table":"stored_files","column":"storage_key"},{"table":"stored_files","column":"relative_path"},{"table":"stored_files","column":"file_category"},{"table":"stored_files","column":"checksum"},{"table":"stored_files","column":"uploaded_by_user_id"},{"table":"stored_files","column":"uploaded_at"},{"table":"stored_files","column":"is_active"},{"table":"document_revisions","column":"id"},{"table":"document_revisions","column":"project_id"},{"table":"document_revisions","column":"document_id"},{"table":"document_revisions","column":"revision_label"},{"table":"document_revisions","column":"revision_sequence"},{"table":"document_revisions","column":"file_id"},{"table":"document_revisions","column":"storage_path_legacy"},{"table":"document_revisions","column":"is_active"},{"table":"document_revisions","column":"active_document_id"},{"table":"document_revisions","column":"source_status"},{"table":"document_revisions","column":"result_status"},{"table":"document_revisions","column":"created_at"},{"table":"document_revisions","column":"created_by_user_id"},{"table":"workflow_comments","column":"id"},{"table":"workflow_comments","column":"project_id"},{"table":"workflow_comments","column":"document_id"},{"table":"workflow_comments","column":"revision_id"},{"table":"workflow_comments","column":"workflow_action"},{"table":"workflow_comments","column":"workflow_comment"},{"table":"workflow_comments","column":"created_by_user_id"},{"table":"workflow_comments","column":"created_by_name_snapshot"},{"table":"workflow_comments","column":"created_by_official_role_snapshot"},{"table":"workflow_comments","column":"created_at"},{"table":"workflow_attachments","column":"attachment_id"},{"table":"workflow_attachments","column":"comment_id"},{"table":"workflow_attachments","column":"project_id"},{"table":"workflow_attachments","column":"document_id"},{"table":"workflow_attachments","column":"file_id"},{"table":"workflow_attachments","column":"uploaded_by_user_id"},{"table":"workflow_attachments","column":"uploaded_at"},{"table":"document_history","column":"id"},{"table":"document_history","column":"project_id"},{"table":"document_history","column":"document_id"},{"table":"document_history","column":"workflow_event"},{"table":"document_history","column":"activity"},{"table":"document_history","column":"workflow_status"},{"table":"document_history","column":"revision_label"},{"table":"document_history","column":"lifecycle_status"},{"table":"document_history","column":"reason"},{"table":"document_history","column":"created_at"},{"table":"document_history","column":"created_by_user_id"},{"table":"document_history","column":"created_by_name_snapshot"},{"table":"document_history","column":"created_by_official_role_snapshot"},{"table":"comment_read_receipts","column":"id"},{"table":"comment_read_receipts","column":"project_id"},{"table":"comment_read_receipts","column":"document_id"},{"table":"comment_read_receipts","column":"comment_id"},{"table":"comment_read_receipts","column":"user_id"},{"table":"comment_read_receipts","column":"read_at"},{"table":"document_sla_evaluations","column":"id"},{"table":"document_sla_evaluations","column":"project_id"},{"table":"document_sla_evaluations","column":"document_id"},{"table":"document_sla_evaluations","column":"cycle_id"},{"table":"document_sla_evaluations","column":"current_state"},{"table":"document_sla_evaluations","column":"notified_states"},{"table":"document_sla_evaluations","column":"updated_at"},{"table":"document_admission_coordinators","column":"project_id"},{"table":"document_admission_coordinators","column":"document_id"},{"table":"document_admission_coordinators","column":"gate_state"},{"table":"document_admission_coordinators","column":"generation"},{"table":"document_admission_coordinators","column":"delete_operation_id"},{"table":"document_admission_coordinators","column":"created_at"},{"table":"document_admission_coordinators","column":"updated_at"},{"table":"document_delete_operations","column":"id"},{"table":"document_delete_operations","column":"project_id"},{"table":"document_delete_operations","column":"document_id"},{"table":"document_delete_operations","column":"document_number_snapshot"},{"table":"document_delete_operations","column":"initiated_by_user_id"},{"table":"document_delete_operations","column":"reason"},{"table":"document_delete_operations","column":"request_identity"},{"table":"document_delete_operations","column":"status"},{"table":"document_delete_operations","column":"pending_metadata"},{"table":"document_delete_operations","column":"created_at"},{"table":"document_delete_operations","column":"updated_at"},{"table":"storage_namespaces","column":"id"},{"table":"storage_namespaces","column":"provider"},{"table":"storage_namespaces","column":"descriptor"},{"table":"storage_namespaces","column":"created_at"},{"table":"stored_file_namespace_bindings","column":"file_id"},{"table":"stored_file_namespace_bindings","column":"namespace_id"},{"table":"stored_file_namespace_bindings","column":"storage_key_snapshot"},{"table":"stored_file_namespace_bindings","column":"evidence"},{"table":"stored_file_namespace_bindings","column":"created_at"}]', '$[*]' COLUMNS(
      table_name VARCHAR(64) PATH '$.table', column_name VARCHAR(64) PATH '$.column')) j
  )
  SELECT (SELECT COUNT(*) FROM expected e LEFT JOIN information_schema.COLUMNS c
      ON CAST(c.TABLE_SCHEMA AS BINARY)=CAST(DATABASE() AS BINARY) AND CAST(c.TABLE_NAME AS BINARY)=CAST(e.table_name AS BINARY) AND CAST(c.COLUMN_NAME AS BINARY)=CAST(e.column_name AS BINARY) WHERE c.COLUMN_NAME IS NULL)
    + (SELECT COUNT(*) FROM information_schema.COLUMNS c LEFT JOIN expected e
      ON CAST(e.table_name AS BINARY)=CAST(c.TABLE_NAME AS BINARY) AND CAST(e.column_name AS BINARY)=CAST(c.COLUMN_NAME AS BINARY) WHERE CAST(c.TABLE_SCHEMA AS BINARY)=CAST(DATABASE() AS BINARY)
      AND c.TABLE_NAME IN ('projects','engineering_documents','stored_files','document_revisions','workflow_comments','workflow_attachments','document_history','comment_read_receipts','document_sla_evaluations','document_admission_coordinators','document_delete_operations','storage_namespaces','stored_file_namespace_bindings') AND e.column_name IS NULL)
    INTO v_count;
  IF v_count<>0 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='STOP: canonical column coverage mismatch'; END IF;
  SELECT COUNT(*) INTO v_count FROM information_schema.TABLES WHERE CAST(TABLE_SCHEMA AS BINARY)=CAST(DATABASE() AS BINARY)
    AND TABLE_NAME IN ('projects','engineering_documents','stored_files','document_revisions','workflow_comments','workflow_attachments','document_history','comment_read_receipts','document_sla_evaluations','document_admission_coordinators','document_delete_operations','storage_namespaces','stored_file_namespace_bindings','audit_trail','users','project_memberships') AND CAST(ENGINE AS BINARY)=CAST('InnoDB' AS BINARY);
  IF v_count<>16 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='STOP: missing or non-InnoDB recovery dependency'; END IF;
  SELECT COUNT(*) INTO v_count FROM information_schema.TRIGGERS WHERE CAST(TRIGGER_SCHEMA AS BINARY)=CAST(DATABASE() AS BINARY)
    AND EVENT_OBJECT_TABLE IN ('document_delete_operations','document_admission_coordinators','audit_trail');
  IF v_count<>0 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='STOP: unreviewed trigger on mutation tables'; END IF;

  -- Never overwrite a pre-existing temporary table. A failed CREATE is a STOP.
  CREATE TEMPORARY TABLE tmp_edms_staging_recovery_targets (
    seq INT PRIMARY KEY, project_id VARCHAR(64) NOT NULL, document_id VARCHAR(64) NOT NULL UNIQUE,
    operation_id VARCHAR(64) NOT NULL UNIQUE, document_number VARCHAR(255) NOT NULL,
    generation DECIMAL(20,0) NOT NULL, business_digest CHAR(64) NOT NULL, control_digest CHAR(64) NOT NULL,
    UNIQUE(project_id,document_id)
  ) CAST(ENGINE AS BINARY)=CAST(InnoDB AS BINARY) DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  SET v_targets_created=TRUE;
  INSERT INTO tmp_edms_staging_recovery_targets
  WITH targets AS (
  SELECT j.* FROM JSON_TABLE('[{"seq":1,"documentNumber":"COBA-1","documentId":"DOC-PID-5f6ea1c2-3f53-432d-a0e5-f738be2911b0","operationId":"d1b06c71-ccf1-4d85-abbb-9f7f61a5d197","projectId":"PRJ-5cd0a5a3-3ce6-4cf2-b297-73e6ee9e520c"},{"seq":2,"documentNumber":"PROJECT-1","documentId":"DOC-PID-2fe931bb-dac7-4c90-afa9-3addf4351e1f","operationId":"86135cc8-923b-451a-abb3-4a21729cba4c","projectId":"PRJ-5cd0a5a3-3ce6-4cf2-b297-73e6ee9e520c"},{"seq":3,"documentNumber":"PROJECT-2","documentId":"DOC-PID-e2823245-4e10-47d4-bc91-14254f05cd9f","operationId":"012e8f62-a55a-4b2f-bbbb-f7f95e95bf0b","projectId":"PRJ-5cd0a5a3-3ce6-4cf2-b297-73e6ee9e520c"}]', '$[*]' COLUMNS (
    seq INT PATH '$.seq', documentNumber VARCHAR(255) PATH '$.documentNumber',
    documentId VARCHAR(64) PATH '$.documentId', operationId VARCHAR(64) PATH '$.operationId',
    projectId VARCHAR(64) PATH '$.projectId'
  )) AS j
)
  SELECT t.seq,t.projectId,t.documentId,t.operationId,t.documentNumber,j.generation,j.businessDigest,j.controlDigest
  FROM targets t JOIN JSON_TABLE(p_snapshots,'$[*]' COLUMNS(
    documentId VARCHAR(64) PATH '$.documentId' ERROR ON EMPTY ERROR ON ERROR,
    operationId VARCHAR(64) PATH '$.operationId' ERROR ON EMPTY ERROR ON ERROR,
    generation DECIMAL(20,0) PATH '$.generation' ERROR ON EMPTY ERROR ON ERROR,
    businessDigest CHAR(64) PATH '$.businessDigest' ERROR ON EMPTY ERROR ON ERROR,
    controlDigest CHAR(64) PATH '$.controlDigest' ERROR ON EMPTY ERROR ON ERROR
  )) j ON CAST(j.documentId AS BINARY)=CAST(t.documentId AS BINARY) AND CAST(j.operationId AS BINARY)=CAST(t.operationId AS BINARY);
  SET v_count=ROW_COUNT();
  IF v_count<>3 OR EXISTS(SELECT 1 FROM tmp_edms_staging_recovery_targets
    WHERE generation<1 OR generation>=18446744073709551615
      OR NOT REGEXP_LIKE(business_digest,'^[0-9a-fA-F]{64}$','c')
      OR NOT REGEXP_LIKE(control_digest,'^[0-9a-fA-F]{64}$','c'))
  THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='STOP: exact allowlist/snapshot/generation mismatch'; END IF;
  CREATE TEMPORARY TABLE tmp_edms_staging_recovery_snapshots (
    phase VARCHAR(8) NOT NULL,document_id VARCHAR(64) NOT NULL,business_digest CHAR(64) NOT NULL,
    control_digest CHAR(64) NOT NULL,PRIMARY KEY(phase,document_id)
  ) CAST(ENGINE AS BINARY)=CAST(InnoDB AS BINARY) DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  SET v_snapshots_created=TRUE;

  -- Same names as Delete engine; no other session can resume these operations.
  SET v_lock1=GET_LOCK(CONCAT('edms-del:',LEFT(SHA2('d1b06c71-ccf1-4d85-abbb-9f7f61a5d197',256),48)),0);
  IF COALESCE(v_lock1,0)<>1 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='STOP: COBA-1 worker busy'; END IF;
  SET v_lock2=GET_LOCK(CONCAT('edms-del:',LEFT(SHA2('86135cc8-923b-451a-abb3-4a21729cba4c',256),48)),0);
  IF COALESCE(v_lock2,0)<>1 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='STOP: PROJECT-1 worker busy'; END IF;
  SET v_lock3=GET_LOCK(CONCAT('edms-del:',LEFT(SHA2('012e8f62-a55a-4b2f-bbbb-f7f95e95bf0b',256),48)),0);
  IF COALESCE(v_lock3,0)<>1 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='STOP: PROJECT-2 worker busy'; END IF;

  START TRANSACTION;
  SET v_tx=TRUE;
  -- Lock all three coordinators, then their operation/document, in stable order.
  -- No consistent data read precedes these locks in this transaction.
  SET v_i=0;
  WHILE v_i<3 DO
    SELECT project_id,document_id,operation_id,document_number INTO v_project,v_document,v_operation,v_number
      FROM tmp_edms_staging_recovery_targets ORDER BY CAST(document_id AS BINARY) LIMIT v_i,1;
    SELECT gate_state,delete_operation_id,generation INTO v_gate,v_pointer,v_generation
      FROM document_admission_coordinators WHERE CAST(project_id AS BINARY)=CAST(v_project AS BINARY) AND CAST(document_id AS BINARY)=CAST(v_document AS BINARY) FOR UPDATE;
    IF CAST(v_gate AS BINARY)<>CAST('CLOSED' AS BINARY) OR NOT (CAST(v_pointer AS BINARY)<=>CAST(v_operation AS BINARY))
      OR v_generation<>(SELECT generation FROM tmp_edms_staging_recovery_targets WHERE CAST(document_id AS BINARY)=CAST(v_document AS BINARY))
    THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='STOP: gate or generation changed'; END IF;
    SELECT status,pending_metadata,document_number_snapshot,document_id,project_id
      INTO v_status,v_saved_metadata,v_identity,v_pointer,v_project
      FROM document_delete_operations WHERE CAST(id AS BINARY)=CAST(v_operation AS BINARY) FOR UPDATE;
    IF CAST(v_status AS BINARY)<>CAST('QUIESCENCE_CONFIRMED' AS BINARY) OR NOT (CAST(v_identity AS BINARY)<=>CAST(v_number AS BINARY))
      OR NOT (CAST(v_pointer AS BINARY)<=>CAST(v_document AS BINARY))
      OR NOT (CAST(v_project AS BINARY)<=>CAST('PRJ-5cd0a5a3-3ce6-4cf2-b297-73e6ee9e520c' AS BINARY))
      OR (v_saved_metadata IS NOT NULL AND JSON_VALID(v_saved_metadata)=0)
    THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='STOP: operation identity/state/JSON mismatch'; END IF;
    IF JSON_CONTAINS_PATH(COALESCE(v_saved_metadata,'{}'),'one','$.reservationRecovery')=1
    THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='STOP: prior/conflicting cancellation; inspect, do not reapply'; END IF;
    SELECT document_number INTO v_identity FROM engineering_documents
      WHERE CAST(id AS BINARY)=CAST(v_document AS BINARY) AND CAST(project_id AS BINARY)=CAST(v_project AS BINARY) FOR UPDATE;
    IF NOT (CAST(v_identity AS BINARY)<=>CAST(v_number AS BINARY))
    THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='STOP: document number changed'; END IF;
    SET v_i=v_i+1;
  END WHILE;

  -- Strict incident baseline: not even settled writer/IO records are accepted.
  WITH targets AS (
    SELECT j.* FROM JSON_TABLE('[{"seq":1,"documentNumber":"COBA-1","documentId":"DOC-PID-5f6ea1c2-3f53-432d-a0e5-f738be2911b0","operationId":"d1b06c71-ccf1-4d85-abbb-9f7f61a5d197","projectId":"PRJ-5cd0a5a3-3ce6-4cf2-b297-73e6ee9e520c"},{"seq":2,"documentNumber":"PROJECT-1","documentId":"DOC-PID-2fe931bb-dac7-4c90-afa9-3addf4351e1f","operationId":"86135cc8-923b-451a-abb3-4a21729cba4c","projectId":"PRJ-5cd0a5a3-3ce6-4cf2-b297-73e6ee9e520c"},{"seq":3,"documentNumber":"PROJECT-2","documentId":"DOC-PID-e2823245-4e10-47d4-bc91-14254f05cd9f","operationId":"012e8f62-a55a-4b2f-bbbb-f7f95e95bf0b","projectId":"PRJ-5cd0a5a3-3ce6-4cf2-b297-73e6ee9e520c"}]', '$[*]' COLUMNS (
      seq INT PATH '$.seq', documentNumber VARCHAR(255) PATH '$.documentNumber',
      documentId VARCHAR(64) PATH '$.documentId', operationId VARCHAR(64) PATH '$.operationId',
      projectId VARCHAR(64) PATH '$.projectId'
    )) AS j
  )
  SELECT
    (SELECT COUNT(*) FROM document_delete_executions e JOIN targets t ON CAST(t.operationId AS BINARY)=CAST(e.operation_id AS BINARY))
    +(SELECT COUNT(*) FROM document_delete_file_manifest m JOIN targets t ON CAST(t.operationId AS BINARY)=CAST(m.delete_operation_id AS BINARY))
    +(SELECT COUNT(*) FROM document_delete_attempts a JOIN document_delete_file_manifest m ON CAST(m.id AS BINARY)=CAST(a.manifest_id AS BINARY) JOIN targets t ON CAST(t.operationId AS BINARY)=CAST(m.delete_operation_id AS BINARY))
    +(SELECT COUNT(*) FROM document_writer_operations w JOIN targets t ON CAST(t.projectId AS BINARY)=CAST(w.project_id AS BINARY) AND CAST(t.documentId AS BINARY)=CAST(w.document_id AS BINARY))
    +(SELECT COUNT(*) FROM document_storage_io_steps s JOIN document_writer_operations w ON CAST(w.id AS BINARY)=CAST(s.writer_id AS BINARY) JOIN targets t ON CAST(t.projectId AS BINARY)=CAST(w.project_id AS BINARY) AND CAST(t.documentId AS BINARY)=CAST(w.document_id AS BINARY))
    INTO v_count;
  IF v_count<>0 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='STOP: execution/manifest/attempt/writer/IO evidence exists'; END IF;
  SELECT COUNT(*) INTO v_count FROM tmp_edms_staging_recovery_targets t
    JOIN engineering_documents d ON CAST(d.id AS BINARY)=CAST(t.document_id AS BINARY) AND CAST(d.project_id AS BINARY)=CAST(t.project_id AS BINARY)
    JOIN document_revisions r ON CAST(r.id AS BINARY)=CAST(d.active_revision_id AS BINARY) AND CAST(r.file_id AS BINARY)=CAST(d.active_file_id AS BINARY) AND CAST(r.document_id AS BINARY)=CAST(d.id AS BINARY) AND CAST(r.project_id AS BINARY)=CAST(d.project_id AS BINARY);
  IF v_count<>3 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='STOP: active file/revision ownership incomplete'; END IF;

  -- All inventory files must have exact metadata and historical hashes.
  WITH targets AS (
  SELECT j.* FROM JSON_TABLE('[{"seq":1,"documentNumber":"COBA-1","documentId":"DOC-PID-5f6ea1c2-3f53-432d-a0e5-f738be2911b0","operationId":"d1b06c71-ccf1-4d85-abbb-9f7f61a5d197","projectId":"PRJ-5cd0a5a3-3ce6-4cf2-b297-73e6ee9e520c"},{"seq":2,"documentNumber":"PROJECT-1","documentId":"DOC-PID-2fe931bb-dac7-4c90-afa9-3addf4351e1f","operationId":"86135cc8-923b-451a-abb3-4a21729cba4c","projectId":"PRJ-5cd0a5a3-3ce6-4cf2-b297-73e6ee9e520c"},{"seq":3,"documentNumber":"PROJECT-2","documentId":"DOC-PID-e2823245-4e10-47d4-bc91-14254f05cd9f","operationId":"012e8f62-a55a-4b2f-bbbb-f7f95e95bf0b","projectId":"PRJ-5cd0a5a3-3ce6-4cf2-b297-73e6ee9e520c"}]', '$[*]' COLUMNS (
    seq INT PATH '$.seq', documentNumber VARCHAR(255) PATH '$.documentNumber',
    documentId VARCHAR(64) PATH '$.documentId', operationId VARCHAR(64) PATH '$.operationId',
    projectId VARCHAR(64) PATH '$.projectId'
  )) AS j
), file_ids AS (
  SELECT t.documentId, f.file_id FROM targets t JOIN stored_files f ON CAST(f.document_id AS BINARY)=CAST(t.documentId AS BINARY)
  UNION SELECT t.documentId,d.active_file_id FROM targets t JOIN engineering_documents d ON CAST(d.id AS BINARY)=CAST(t.documentId AS BINARY) WHERE d.active_file_id IS NOT NULL
  UNION SELECT t.documentId,r.file_id FROM targets t JOIN document_revisions r ON CAST(r.document_id AS BINARY)=CAST(t.documentId AS BINARY)
  UNION SELECT t.documentId,a.file_id FROM targets t JOIN workflow_attachments a ON CAST(a.document_id AS BINARY)=CAST(t.documentId AS BINARY)
)
  SELECT COUNT(*) INTO v_count FROM file_ids i JOIN targets t ON CAST(t.documentId AS BINARY)=CAST(i.documentId AS BINARY)
    JOIN projects p ON CAST(p.id AS BINARY)=CAST(t.projectId AS BINARY) LEFT JOIN stored_files f ON CAST(f.file_id AS BINARY)=CAST(i.file_id AS BINARY)
    LEFT JOIN stored_file_namespace_bindings b ON CAST(b.file_id AS BINARY)=CAST(f.file_id AS BINARY)
    LEFT JOIN storage_namespaces n ON CAST(n.id AS BINARY)=CAST(b.namespace_id AS BINARY)
  WHERE f.file_id IS NULL OR NOT (CAST(f.project_id AS BINARY)<=>CAST(t.projectId AS BINARY))
    OR NOT (CAST(f.document_id AS BINARY)<=>CAST(t.documentId AS BINARY))
    OR f.checksum IS NULL OR NOT REGEXP_LIKE(f.checksum,'^[0-9a-fA-F]{64}$','c')
    OR f.file_size<0 OR LOCATE(CHAR(0),f.storage_key)>0 OR LOCATE(CHAR(92),f.storage_key)>0
    OR LOCATE('//',f.storage_key)>0 OR REGEXP_LIKE(f.storage_key,'(^|/)[.]{1,2}(/|$)','c')
    OR NOT (CAST(LEFT(f.storage_key,CHAR_LENGTH(CONCAT('projects/',CONVERT(p.project_code USING utf8mb4) COLLATE utf8mb4_bin,'/documents/',t.documentNumber,'/'))) AS BINARY)
      <=>CAST(CONCAT('projects/',CONVERT(p.project_code USING utf8mb4) COLLATE utf8mb4_bin,'/documents/',t.documentNumber,'/') AS BINARY))
    OR (f.relative_path IS NOT NULL AND CAST(f.relative_path AS BINARY)<>CAST('' AS BINARY) AND NOT (CAST(f.relative_path AS BINARY)<=>CAST(f.storage_key AS BINARY)))
    OR (b.file_id IS NOT NULL AND (NOT (CAST(b.storage_key_snapshot AS BINARY)<=>CAST(f.storage_key AS BINARY))
      OR n.id IS NULL OR CAST(n.provider AS BINARY)<>CAST('r2' AS BINARY) OR NOT (CAST(n.id AS BINARY)<=>CAST(p_namespace_id AS BINARY))
      OR NOT (CAST(SHA2(n.descriptor,256) AS BINARY)<=>CAST(n.id AS BINARY))));
  IF v_count<>0 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='STOP: missing checksum/file or scope/key/namespace mismatch'; END IF;
  WITH targets AS (
  SELECT j.* FROM JSON_TABLE('[{"seq":1,"documentNumber":"COBA-1","documentId":"DOC-PID-5f6ea1c2-3f53-432d-a0e5-f738be2911b0","operationId":"d1b06c71-ccf1-4d85-abbb-9f7f61a5d197","projectId":"PRJ-5cd0a5a3-3ce6-4cf2-b297-73e6ee9e520c"},{"seq":2,"documentNumber":"PROJECT-1","documentId":"DOC-PID-2fe931bb-dac7-4c90-afa9-3addf4351e1f","operationId":"86135cc8-923b-451a-abb3-4a21729cba4c","projectId":"PRJ-5cd0a5a3-3ce6-4cf2-b297-73e6ee9e520c"},{"seq":3,"documentNumber":"PROJECT-2","documentId":"DOC-PID-e2823245-4e10-47d4-bc91-14254f05cd9f","operationId":"012e8f62-a55a-4b2f-bbbb-f7f95e95bf0b","projectId":"PRJ-5cd0a5a3-3ce6-4cf2-b297-73e6ee9e520c"}]', '$[*]' COLUMNS (
    seq INT PATH '$.seq', documentNumber VARCHAR(255) PATH '$.documentNumber',
    documentId VARCHAR(64) PATH '$.documentId', operationId VARCHAR(64) PATH '$.operationId',
    projectId VARCHAR(64) PATH '$.projectId'
  )) AS j
), file_ids AS (
  SELECT t.documentId, f.file_id FROM targets t JOIN stored_files f ON CAST(f.document_id AS BINARY)=CAST(t.documentId AS BINARY)
  UNION SELECT t.documentId,d.active_file_id FROM targets t JOIN engineering_documents d ON CAST(d.id AS BINARY)=CAST(t.documentId AS BINARY) WHERE d.active_file_id IS NOT NULL
  UNION SELECT t.documentId,r.file_id FROM targets t JOIN document_revisions r ON CAST(r.document_id AS BINARY)=CAST(t.documentId AS BINARY)
  UNION SELECT t.documentId,a.file_id FROM targets t JOIN workflow_attachments a ON CAST(a.document_id AS BINARY)=CAST(t.documentId AS BINARY)
)
  SELECT COUNT(*) INTO v_count FROM file_ids i JOIN stored_files f ON CAST(f.file_id AS BINARY)=CAST(i.file_id AS BINARY)
  WHERE EXISTS(SELECT 1 FROM document_revisions r WHERE CAST(r.file_id AS BINARY)=CAST(f.file_id AS BINARY) AND
      (NOT (CAST(r.document_id AS BINARY)<=>CAST(i.documentId AS BINARY)) OR NOT (CAST(r.project_id AS BINARY)<=>CAST(f.project_id AS BINARY))
       OR (r.storage_path_legacy IS NOT NULL AND CAST(r.storage_path_legacy AS BINARY)<>CAST('' AS BINARY) AND NOT (CAST(r.storage_path_legacy AS BINARY)<=>CAST(f.storage_key AS BINARY)))))
    OR EXISTS(SELECT 1 FROM workflow_attachments a WHERE CAST(a.file_id AS BINARY)=CAST(f.file_id AS BINARY) AND
      (NOT (CAST(a.document_id AS BINARY)<=>CAST(i.documentId AS BINARY)) OR NOT (CAST(a.project_id AS BINARY)<=>CAST(f.project_id AS BINARY))))
    OR EXISTS(SELECT 1 FROM engineering_documents d WHERE CAST(d.active_file_id AS BINARY)=CAST(f.file_id AS BINARY) AND CAST(d.id AS BINARY)<>CAST(i.documentId AS BINARY))
    OR EXISTS(SELECT 1 FROM stored_files other_file WHERE CAST(other_file.file_id AS BINARY)<>CAST(f.file_id AS BINARY) AND CAST(LOWER(other_file.storage_key) AS BINARY)=CAST(LOWER(f.storage_key) AS BINARY))
    OR EXISTS(SELECT 1 FROM document_delete_file_manifest m WHERE CAST(m.file_reference AS BINARY)=CAST(f.file_id AS BINARY) OR CAST(m.exact_storage_key AS BINARY)=CAST(f.storage_key AS BINARY)
      OR JSON_CONTAINS(CASE WHEN JSON_VALID(m.ownership_evidence) THEN m.ownership_evidence ELSE '{}' END,JSON_QUOTE(f.file_id),'$.fileIds')=1);
  IF v_count<>0 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='STOP: shared, stale or existing manifest file reference'; END IF;

  INSERT INTO tmp_edms_staging_recovery_snapshots
WITH RECURSIVE
targets AS (
  SELECT j.* FROM JSON_TABLE('[{"seq":1,"documentNumber":"COBA-1","documentId":"DOC-PID-5f6ea1c2-3f53-432d-a0e5-f738be2911b0","operationId":"d1b06c71-ccf1-4d85-abbb-9f7f61a5d197","projectId":"PRJ-5cd0a5a3-3ce6-4cf2-b297-73e6ee9e520c"},{"seq":2,"documentNumber":"PROJECT-1","documentId":"DOC-PID-2fe931bb-dac7-4c90-afa9-3addf4351e1f","operationId":"86135cc8-923b-451a-abb3-4a21729cba4c","projectId":"PRJ-5cd0a5a3-3ce6-4cf2-b297-73e6ee9e520c"},{"seq":3,"documentNumber":"PROJECT-2","documentId":"DOC-PID-e2823245-4e10-47d4-bc91-14254f05cd9f","operationId":"012e8f62-a55a-4b2f-bbbb-f7f95e95bf0b","projectId":"PRJ-5cd0a5a3-3ce6-4cf2-b297-73e6ee9e520c"}]', '$[*]' COLUMNS (
    seq INT PATH '$.seq', documentNumber VARCHAR(255) PATH '$.documentNumber',
    documentId VARCHAR(64) PATH '$.documentId', operationId VARCHAR(64) PATH '$.operationId',
    projectId VARCHAR(64) PATH '$.projectId'
  )) AS j
),
file_ids AS (
  SELECT t.documentId, f.file_id FROM targets t JOIN stored_files f ON CAST(f.document_id AS BINARY)=CAST(t.documentId AS BINARY)
  UNION SELECT t.documentId,d.active_file_id FROM targets t JOIN engineering_documents d ON CAST(d.id AS BINARY)=CAST(t.documentId AS BINARY) WHERE d.active_file_id IS NOT NULL
  UNION SELECT t.documentId,r.file_id FROM targets t JOIN document_revisions r ON CAST(r.document_id AS BINARY)=CAST(t.documentId AS BINARY)
  UNION SELECT t.documentId,a.file_id FROM targets t JOIN workflow_attachments a ON CAST(a.document_id AS BINARY)=CAST(t.documentId AS BINARY)
),
snapshot_rows AS (
  SELECT DISTINCT t.documentId, 0 AS domain, 1 AS kind, CAST(p.id AS CHAR(255) CHARACTER SET utf8mb4) AS rid,
    SHA2(CAST(JSON_ARRAY('projects',p.id,p.project_code,p.project_name,p.description,p.status,p.created_by_user_id,p.created_at,p.updated_at,p.updated_by_user_id,p.closed_at,p.closed_by_user_id) AS CHAR CHARACTER SET utf8mb4),256) AS part_hash
  FROM targets t JOIN projects p ON CAST(p.id AS BINARY)=CAST(t.projectId AS BINARY)
  UNION ALL
  SELECT DISTINCT t.documentId, 0 AS domain, 2 AS kind, CAST(d.id AS CHAR(255) CHARACTER SET utf8mb4) AS rid,
    SHA2(CAST(JSON_ARRAY('engineering_documents',d.id,d.project_id,d.document_type_id,d.document_number,d.description,d.drawing,d.area,d.days_until_validation,d.workflow_status,d.lifecycle_status,d.revision_label,d.responsible_role,d.current_assignee_user_id,d.active_revision_id,d.active_file_id,d.created_by_user_id,d.created_at,d.updated_at,d.updated_by_user_id,d.archived_at,d.archived_by_user_id,d.archive_reason,d.restored_at,d.restored_by_user_id,d.sla_started_at,d.sla_stopped_at,d.sla_assignee_name_snapshot) AS CHAR CHARACTER SET utf8mb4),256) AS part_hash
  FROM targets t JOIN engineering_documents d ON CAST(d.id AS BINARY)=CAST(t.documentId AS BINARY)
  UNION ALL
  SELECT DISTINCT t.documentId, 0 AS domain, 3 AS kind, CAST(f.file_id AS CHAR(255) CHARACTER SET utf8mb4) AS rid,
    SHA2(CAST(JSON_ARRAY('stored_files',f.file_id,f.project_id,f.document_id,f.original_file_name,f.physical_file_name,f.file_extension,f.mime_type,f.file_size,f.storage_key,f.relative_path,f.file_category,f.checksum,f.uploaded_by_user_id,f.uploaded_at,f.is_active) AS CHAR CHARACTER SET utf8mb4),256) AS part_hash
  FROM targets t JOIN file_ids i ON CAST(i.documentId AS BINARY)=CAST(t.documentId AS BINARY) JOIN stored_files f ON CAST(f.file_id AS BINARY)=CAST(i.file_id AS BINARY)
  UNION ALL
  SELECT DISTINCT t.documentId, 0 AS domain, 4 AS kind, CAST(r.id AS CHAR(255) CHARACTER SET utf8mb4) AS rid,
    SHA2(CAST(JSON_ARRAY('document_revisions',r.id,r.project_id,r.document_id,r.revision_label,r.revision_sequence,r.file_id,r.storage_path_legacy,r.is_active,r.active_document_id,r.source_status,r.result_status,r.created_at,r.created_by_user_id) AS CHAR CHARACTER SET utf8mb4),256) AS part_hash
  FROM targets t JOIN document_revisions r ON CAST(r.document_id AS BINARY)=CAST(t.documentId AS BINARY)
  UNION ALL
  SELECT DISTINCT t.documentId, 0 AS domain, 5 AS kind, CAST(w.id AS CHAR(255) CHARACTER SET utf8mb4) AS rid,
    SHA2(CAST(JSON_ARRAY('workflow_comments',w.id,w.project_id,w.document_id,w.revision_id,w.workflow_action,w.workflow_comment,w.created_by_user_id,w.created_by_name_snapshot,w.created_by_official_role_snapshot,w.created_at) AS CHAR CHARACTER SET utf8mb4),256) AS part_hash
  FROM targets t JOIN workflow_comments w ON CAST(w.document_id AS BINARY)=CAST(t.documentId AS BINARY)
  UNION ALL
  SELECT DISTINCT t.documentId, 0 AS domain, 6 AS kind, CAST(a.attachment_id AS CHAR(255) CHARACTER SET utf8mb4) AS rid,
    SHA2(CAST(JSON_ARRAY('workflow_attachments',a.attachment_id,a.comment_id,a.project_id,a.document_id,a.file_id,a.uploaded_by_user_id,a.uploaded_at) AS CHAR CHARACTER SET utf8mb4),256) AS part_hash
  FROM targets t JOIN workflow_attachments a ON CAST(a.document_id AS BINARY)=CAST(t.documentId AS BINARY)
  UNION ALL
  SELECT DISTINCT t.documentId, 0 AS domain, 7 AS kind, CAST(h.id AS CHAR(255) CHARACTER SET utf8mb4) AS rid,
    SHA2(CAST(JSON_ARRAY('document_history',h.id,h.project_id,h.document_id,h.workflow_event,h.activity,h.workflow_status,h.revision_label,h.lifecycle_status,h.reason,h.created_at,h.created_by_user_id,h.created_by_name_snapshot,h.created_by_official_role_snapshot) AS CHAR CHARACTER SET utf8mb4),256) AS part_hash
  FROM targets t JOIN document_history h ON CAST(h.document_id AS BINARY)=CAST(t.documentId AS BINARY)
  UNION ALL
  SELECT DISTINCT t.documentId, 0 AS domain, 8 AS kind, CAST(r.id AS CHAR(255) CHARACTER SET utf8mb4) AS rid,
    SHA2(CAST(JSON_ARRAY('comment_read_receipts',r.id,r.project_id,r.document_id,r.comment_id,r.user_id,r.read_at) AS CHAR CHARACTER SET utf8mb4),256) AS part_hash
  FROM targets t JOIN comment_read_receipts r ON CAST(r.document_id AS BINARY)=CAST(t.documentId AS BINARY)
  UNION ALL
  SELECT DISTINCT t.documentId, 0 AS domain, 9 AS kind, CAST(s.id AS CHAR(255) CHARACTER SET utf8mb4) AS rid,
    SHA2(CAST(JSON_ARRAY('document_sla_evaluations',s.id,s.project_id,s.document_id,s.cycle_id,s.current_state,s.notified_states,s.updated_at) AS CHAR CHARACTER SET utf8mb4),256) AS part_hash
  FROM targets t JOIN document_sla_evaluations s ON CAST(s.document_id AS BINARY)=CAST(t.documentId AS BINARY)
  UNION ALL
  SELECT DISTINCT t.documentId, 0 AS domain, 10 AS kind, CAST(b.file_id AS CHAR(255) CHARACTER SET utf8mb4) AS rid,
    SHA2(CAST(JSON_ARRAY('stored_file_namespace_bindings',b.file_id,b.namespace_id,b.storage_key_snapshot,b.evidence,b.created_at) AS CHAR CHARACTER SET utf8mb4),256) AS part_hash
  FROM targets t JOIN file_ids i ON CAST(i.documentId AS BINARY)=CAST(t.documentId AS BINARY) JOIN stored_file_namespace_bindings b ON CAST(b.file_id AS BINARY)=CAST(i.file_id AS BINARY)
  UNION ALL
  SELECT DISTINCT t.documentId, 0 AS domain, 11 AS kind, CAST(n.id AS CHAR(255) CHARACTER SET utf8mb4) AS rid,
    SHA2(CAST(JSON_ARRAY('storage_namespaces',n.id,n.provider,n.descriptor,n.created_at) AS CHAR CHARACTER SET utf8mb4),256) AS part_hash
  FROM targets t JOIN file_ids i ON CAST(i.documentId AS BINARY)=CAST(t.documentId AS BINARY) JOIN stored_file_namespace_bindings b ON CAST(b.file_id AS BINARY)=CAST(i.file_id AS BINARY) JOIN storage_namespaces n ON CAST(n.id AS BINARY)=CAST(b.namespace_id AS BINARY)
  UNION ALL
  SELECT DISTINCT t.documentId, 1 AS domain, 12 AS kind, CAST(c.document_id AS CHAR(255) CHARACTER SET utf8mb4) AS rid,
    SHA2(CAST(JSON_ARRAY('document_admission_coordinators',c.project_id,c.document_id,c.gate_state,c.generation,c.delete_operation_id,c.created_at,c.updated_at) AS CHAR CHARACTER SET utf8mb4),256) AS part_hash
  FROM targets t JOIN document_admission_coordinators c ON CAST(c.project_id AS BINARY)=CAST(t.projectId AS BINARY) AND CAST(c.document_id AS BINARY)=CAST(t.documentId AS BINARY)
  UNION ALL
  SELECT DISTINCT t.documentId, 1 AS domain, 13 AS kind, CAST(o.id AS CHAR(255) CHARACTER SET utf8mb4) AS rid,
    SHA2(CAST(JSON_ARRAY('document_delete_operations',o.id,o.project_id,o.document_id,o.document_number_snapshot,o.initiated_by_user_id,o.reason,o.request_identity,o.status,o.pending_metadata,o.created_at,o.updated_at) AS CHAR CHARACTER SET utf8mb4),256) AS part_hash
  FROM targets t JOIN document_delete_operations o ON CAST(o.id AS BINARY)=CAST(t.operationId AS BINARY)
),
ordered_rows AS (
  SELECT documentId,domain,part_hash,
    ROW_NUMBER() OVER(PARTITION BY documentId,domain ORDER BY kind,CAST(rid AS BINARY)) AS rn,
    COUNT(*) OVER(PARTITION BY documentId,domain) AS total
  FROM snapshot_rows
),
chains(documentId,domain,rn,total,row_digest) AS (
  SELECT documentId,domain,rn,total,CAST(SHA2(CONCAT('STAGING-RECOVERY-v1|',part_hash),256) AS CHAR(64))
  FROM ordered_rows WHERE rn=1
  UNION ALL
  SELECT r.documentId,r.domain,r.rn,r.total,SHA2(CONCAT(c.row_digest,'|',r.part_hash),256)
  FROM chains c JOIN ordered_rows r ON CAST(r.documentId AS BINARY)=CAST(c.documentId AS BINARY) AND r.domain=c.domain AND r.rn=c.rn+1
),
fingerprints AS (
  SELECT documentId,MAX(CASE WHEN domain=0 THEN row_digest END) AS businessDigest,
    MAX(CASE WHEN domain=1 THEN row_digest END) AS controlDigest
  FROM chains WHERE rn=total GROUP BY documentId
)

  SELECT 'BEFORE',documentId,businessDigest,controlDigest FROM fingerprints;
  SET v_count=ROW_COUNT();
  IF v_count<>3 OR EXISTS(SELECT 1 FROM tmp_edms_staging_recovery_targets t
    LEFT JOIN tmp_edms_staging_recovery_snapshots s ON CAST(s.phase AS BINARY)=CAST('BEFORE' AS BINARY) AND CAST(s.document_id AS BINARY)=CAST(t.document_id AS BINARY)
    WHERE s.document_id IS NULL OR NOT (CAST(s.business_digest AS BINARY)<=>CAST(t.business_digest AS BINARY))
      OR NOT (CAST(s.control_digest AS BINARY)<=>CAST(t.control_digest AS BINARY)))
  THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='STOP: data changed since approved preflight'; END IF;

  -- Validate actor and freeze the Admin membership during all writes.
  SELECT u.full_name,u.department_name_snapshot INTO v_actor_name,v_department
    FROM users u JOIN project_memberships m ON m.user_id=u.id JOIN projects p ON CAST(p.id AS BINARY)=CAST(m.project_id AS BINARY)
    WHERE u.id=p_actor AND CAST(m.project_id AS BINARY)=CAST('PRJ-5cd0a5a3-3ce6-4cf2-b297-73e6ee9e520c' AS BINARY)
      AND CAST(u.status AS BINARY)=CAST('Active' AS BINARY) AND CAST(m.status AS BINARY)=CAST('Active' AS BINARY) AND CAST(m.official_role AS BINARY)=CAST('Admin' AS BINARY) AND CAST(p.status AS BINARY)=CAST('Active' AS BINARY) FOR UPDATE;
  IF v_actor_name IS NULL OR CHAR_LENGTH(TRIM(v_actor_name))=0
  THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='STOP: active project Admin required'; END IF;
  SELECT COUNT(*) INTO v_count FROM audit_trail a JOIN tmp_edms_staging_recovery_targets t
    ON CAST(a.identity_key AS BINARY)=CAST(CONCAT('reservation-recovery:',SHA2(t.operation_id,256)) AS BINARY);
  IF v_count<>0 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='STOP: recovery audit already exists; inspect previous outcome'; END IF;
  SET v_digest=SHA2(CAST(JSON_OBJECT('version',1,'database',p_database,'serverUuid',p_server_uuid,
    'serviceId',p_service_id,'snapshots',p_snapshots,'reviewedUtc',p_reviewed_utc,
    'externalR2EvidenceSha256',p_external_sha,'namespaceId',p_namespace_id,'guardsCommit',p_guards_commit,
    'backupReference',p_backup_reference) AS CHAR CHARACTER SET utf8mb4),256);
  IF TIMESTAMPDIFF(MICROSECOND,p_reviewed_utc,UTC_TIMESTAMP(3))>300000000
  THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='STOP: reviewed evidence expired during validation'; END IF;

  UPDATE document_delete_operations o JOIN tmp_edms_staging_recovery_targets t
    ON CAST(o.id AS BINARY)=CAST(t.operation_id AS BINARY) AND CAST(o.project_id AS BINARY)=CAST(t.project_id AS BINARY) AND CAST(o.document_id AS BINARY)=CAST(t.document_id AS BINARY)
  SET o.pending_metadata=JSON_SET(COALESCE(o.pending_metadata,'{}'),'$.reservationRecovery',
    JSON_OBJECT('state','CANCELLED_BEFORE_IO','operationId',o.id,'approvalDigest',v_digest,
      'actorUserId',p_actor,'recoveredAt',DATE_FORMAT(UTC_TIMESTAMP(3),'%Y-%m-%dT%H:%i:%s.%fZ'),
      'snapshotDigest',SHA2(CONCAT(t.business_digest,t.control_digest),256),
      'source','OWNER_REVIEWED_DBEAVER_RECOVERY','externalEvidenceSha256',p_external_sha)),
    o.updated_at=UTC_TIMESTAMP(3)
  WHERE CAST(o.status AS BINARY)=CAST('QUIESCENCE_CONFIRMED' AS BINARY) AND CAST(o.document_number_snapshot AS BINARY)=CAST(t.document_number AS BINARY)
    AND JSON_CONTAINS_PATH(COALESCE(o.pending_metadata,'{}'),'one','$.reservationRecovery')=0;
  SET v_count=ROW_COUNT();
  IF v_count<>3 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='STOP: operation affected rows must be exactly three'; END IF;
  UPDATE document_admission_coordinators c JOIN tmp_edms_staging_recovery_targets t
    ON CAST(c.project_id AS BINARY)=CAST(t.project_id AS BINARY) AND CAST(c.document_id AS BINARY)=CAST(t.document_id AS BINARY)
  SET c.gate_state='OPEN',c.delete_operation_id=NULL,c.generation=c.generation+1,c.updated_at=UTC_TIMESTAMP(3)
  WHERE CAST(c.gate_state AS BINARY)=CAST('CLOSED' AS BINARY) AND CAST(c.delete_operation_id AS BINARY)=CAST(t.operation_id AS BINARY) AND c.generation=t.generation;
  SET v_count=ROW_COUNT();
  IF v_count<>3 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='STOP: generation-guarded gate affected rows must be three'; END IF;
  INSERT INTO audit_trail (id,identity_key,project_id,actor_user_id,actor_name,department,official_role,
    action,business_event,detail,resource_type,resource_id,reference,metadata,occurred_at)
  SELECT UUID(),CONCAT('reservation-recovery:',SHA2(t.operation_id,256)),t.project_id,p_actor,v_actor_name,v_department,'Admin',
    'Delete Reservation Cancelled','Staging Document Recovery','Reservation cancelled before storage deletion.',
    'Document',t.document_id,t.document_number,JSON_EXTRACT(o.pending_metadata,'$.reservationRecovery'),UTC_TIMESTAMP(3)
  FROM tmp_edms_staging_recovery_targets t JOIN document_delete_operations o ON CAST(o.id AS BINARY)=CAST(t.operation_id AS BINARY);
  SET v_count=ROW_COUNT();
  IF v_count<>3 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='STOP: recovery audit affected rows must be three'; END IF;

  -- Re-hash business data: recovery may change control rows, never business/file rows.
  INSERT INTO tmp_edms_staging_recovery_snapshots
WITH RECURSIVE
targets AS (
  SELECT j.* FROM JSON_TABLE('[{"seq":1,"documentNumber":"COBA-1","documentId":"DOC-PID-5f6ea1c2-3f53-432d-a0e5-f738be2911b0","operationId":"d1b06c71-ccf1-4d85-abbb-9f7f61a5d197","projectId":"PRJ-5cd0a5a3-3ce6-4cf2-b297-73e6ee9e520c"},{"seq":2,"documentNumber":"PROJECT-1","documentId":"DOC-PID-2fe931bb-dac7-4c90-afa9-3addf4351e1f","operationId":"86135cc8-923b-451a-abb3-4a21729cba4c","projectId":"PRJ-5cd0a5a3-3ce6-4cf2-b297-73e6ee9e520c"},{"seq":3,"documentNumber":"PROJECT-2","documentId":"DOC-PID-e2823245-4e10-47d4-bc91-14254f05cd9f","operationId":"012e8f62-a55a-4b2f-bbbb-f7f95e95bf0b","projectId":"PRJ-5cd0a5a3-3ce6-4cf2-b297-73e6ee9e520c"}]', '$[*]' COLUMNS (
    seq INT PATH '$.seq', documentNumber VARCHAR(255) PATH '$.documentNumber',
    documentId VARCHAR(64) PATH '$.documentId', operationId VARCHAR(64) PATH '$.operationId',
    projectId VARCHAR(64) PATH '$.projectId'
  )) AS j
),
file_ids AS (
  SELECT t.documentId, f.file_id FROM targets t JOIN stored_files f ON CAST(f.document_id AS BINARY)=CAST(t.documentId AS BINARY)
  UNION SELECT t.documentId,d.active_file_id FROM targets t JOIN engineering_documents d ON CAST(d.id AS BINARY)=CAST(t.documentId AS BINARY) WHERE d.active_file_id IS NOT NULL
  UNION SELECT t.documentId,r.file_id FROM targets t JOIN document_revisions r ON CAST(r.document_id AS BINARY)=CAST(t.documentId AS BINARY)
  UNION SELECT t.documentId,a.file_id FROM targets t JOIN workflow_attachments a ON CAST(a.document_id AS BINARY)=CAST(t.documentId AS BINARY)
),
snapshot_rows AS (
  SELECT DISTINCT t.documentId, 0 AS domain, 1 AS kind, CAST(p.id AS CHAR(255) CHARACTER SET utf8mb4) AS rid,
    SHA2(CAST(JSON_ARRAY('projects',p.id,p.project_code,p.project_name,p.description,p.status,p.created_by_user_id,p.created_at,p.updated_at,p.updated_by_user_id,p.closed_at,p.closed_by_user_id) AS CHAR CHARACTER SET utf8mb4),256) AS part_hash
  FROM targets t JOIN projects p ON CAST(p.id AS BINARY)=CAST(t.projectId AS BINARY)
  UNION ALL
  SELECT DISTINCT t.documentId, 0 AS domain, 2 AS kind, CAST(d.id AS CHAR(255) CHARACTER SET utf8mb4) AS rid,
    SHA2(CAST(JSON_ARRAY('engineering_documents',d.id,d.project_id,d.document_type_id,d.document_number,d.description,d.drawing,d.area,d.days_until_validation,d.workflow_status,d.lifecycle_status,d.revision_label,d.responsible_role,d.current_assignee_user_id,d.active_revision_id,d.active_file_id,d.created_by_user_id,d.created_at,d.updated_at,d.updated_by_user_id,d.archived_at,d.archived_by_user_id,d.archive_reason,d.restored_at,d.restored_by_user_id,d.sla_started_at,d.sla_stopped_at,d.sla_assignee_name_snapshot) AS CHAR CHARACTER SET utf8mb4),256) AS part_hash
  FROM targets t JOIN engineering_documents d ON CAST(d.id AS BINARY)=CAST(t.documentId AS BINARY)
  UNION ALL
  SELECT DISTINCT t.documentId, 0 AS domain, 3 AS kind, CAST(f.file_id AS CHAR(255) CHARACTER SET utf8mb4) AS rid,
    SHA2(CAST(JSON_ARRAY('stored_files',f.file_id,f.project_id,f.document_id,f.original_file_name,f.physical_file_name,f.file_extension,f.mime_type,f.file_size,f.storage_key,f.relative_path,f.file_category,f.checksum,f.uploaded_by_user_id,f.uploaded_at,f.is_active) AS CHAR CHARACTER SET utf8mb4),256) AS part_hash
  FROM targets t JOIN file_ids i ON CAST(i.documentId AS BINARY)=CAST(t.documentId AS BINARY) JOIN stored_files f ON CAST(f.file_id AS BINARY)=CAST(i.file_id AS BINARY)
  UNION ALL
  SELECT DISTINCT t.documentId, 0 AS domain, 4 AS kind, CAST(r.id AS CHAR(255) CHARACTER SET utf8mb4) AS rid,
    SHA2(CAST(JSON_ARRAY('document_revisions',r.id,r.project_id,r.document_id,r.revision_label,r.revision_sequence,r.file_id,r.storage_path_legacy,r.is_active,r.active_document_id,r.source_status,r.result_status,r.created_at,r.created_by_user_id) AS CHAR CHARACTER SET utf8mb4),256) AS part_hash
  FROM targets t JOIN document_revisions r ON CAST(r.document_id AS BINARY)=CAST(t.documentId AS BINARY)
  UNION ALL
  SELECT DISTINCT t.documentId, 0 AS domain, 5 AS kind, CAST(w.id AS CHAR(255) CHARACTER SET utf8mb4) AS rid,
    SHA2(CAST(JSON_ARRAY('workflow_comments',w.id,w.project_id,w.document_id,w.revision_id,w.workflow_action,w.workflow_comment,w.created_by_user_id,w.created_by_name_snapshot,w.created_by_official_role_snapshot,w.created_at) AS CHAR CHARACTER SET utf8mb4),256) AS part_hash
  FROM targets t JOIN workflow_comments w ON CAST(w.document_id AS BINARY)=CAST(t.documentId AS BINARY)
  UNION ALL
  SELECT DISTINCT t.documentId, 0 AS domain, 6 AS kind, CAST(a.attachment_id AS CHAR(255) CHARACTER SET utf8mb4) AS rid,
    SHA2(CAST(JSON_ARRAY('workflow_attachments',a.attachment_id,a.comment_id,a.project_id,a.document_id,a.file_id,a.uploaded_by_user_id,a.uploaded_at) AS CHAR CHARACTER SET utf8mb4),256) AS part_hash
  FROM targets t JOIN workflow_attachments a ON CAST(a.document_id AS BINARY)=CAST(t.documentId AS BINARY)
  UNION ALL
  SELECT DISTINCT t.documentId, 0 AS domain, 7 AS kind, CAST(h.id AS CHAR(255) CHARACTER SET utf8mb4) AS rid,
    SHA2(CAST(JSON_ARRAY('document_history',h.id,h.project_id,h.document_id,h.workflow_event,h.activity,h.workflow_status,h.revision_label,h.lifecycle_status,h.reason,h.created_at,h.created_by_user_id,h.created_by_name_snapshot,h.created_by_official_role_snapshot) AS CHAR CHARACTER SET utf8mb4),256) AS part_hash
  FROM targets t JOIN document_history h ON CAST(h.document_id AS BINARY)=CAST(t.documentId AS BINARY)
  UNION ALL
  SELECT DISTINCT t.documentId, 0 AS domain, 8 AS kind, CAST(r.id AS CHAR(255) CHARACTER SET utf8mb4) AS rid,
    SHA2(CAST(JSON_ARRAY('comment_read_receipts',r.id,r.project_id,r.document_id,r.comment_id,r.user_id,r.read_at) AS CHAR CHARACTER SET utf8mb4),256) AS part_hash
  FROM targets t JOIN comment_read_receipts r ON CAST(r.document_id AS BINARY)=CAST(t.documentId AS BINARY)
  UNION ALL
  SELECT DISTINCT t.documentId, 0 AS domain, 9 AS kind, CAST(s.id AS CHAR(255) CHARACTER SET utf8mb4) AS rid,
    SHA2(CAST(JSON_ARRAY('document_sla_evaluations',s.id,s.project_id,s.document_id,s.cycle_id,s.current_state,s.notified_states,s.updated_at) AS CHAR CHARACTER SET utf8mb4),256) AS part_hash
  FROM targets t JOIN document_sla_evaluations s ON CAST(s.document_id AS BINARY)=CAST(t.documentId AS BINARY)
  UNION ALL
  SELECT DISTINCT t.documentId, 0 AS domain, 10 AS kind, CAST(b.file_id AS CHAR(255) CHARACTER SET utf8mb4) AS rid,
    SHA2(CAST(JSON_ARRAY('stored_file_namespace_bindings',b.file_id,b.namespace_id,b.storage_key_snapshot,b.evidence,b.created_at) AS CHAR CHARACTER SET utf8mb4),256) AS part_hash
  FROM targets t JOIN file_ids i ON CAST(i.documentId AS BINARY)=CAST(t.documentId AS BINARY) JOIN stored_file_namespace_bindings b ON CAST(b.file_id AS BINARY)=CAST(i.file_id AS BINARY)
  UNION ALL
  SELECT DISTINCT t.documentId, 0 AS domain, 11 AS kind, CAST(n.id AS CHAR(255) CHARACTER SET utf8mb4) AS rid,
    SHA2(CAST(JSON_ARRAY('storage_namespaces',n.id,n.provider,n.descriptor,n.created_at) AS CHAR CHARACTER SET utf8mb4),256) AS part_hash
  FROM targets t JOIN file_ids i ON CAST(i.documentId AS BINARY)=CAST(t.documentId AS BINARY) JOIN stored_file_namespace_bindings b ON CAST(b.file_id AS BINARY)=CAST(i.file_id AS BINARY) JOIN storage_namespaces n ON CAST(n.id AS BINARY)=CAST(b.namespace_id AS BINARY)
  UNION ALL
  SELECT DISTINCT t.documentId, 1 AS domain, 12 AS kind, CAST(c.document_id AS CHAR(255) CHARACTER SET utf8mb4) AS rid,
    SHA2(CAST(JSON_ARRAY('document_admission_coordinators',c.project_id,c.document_id,c.gate_state,c.generation,c.delete_operation_id,c.created_at,c.updated_at) AS CHAR CHARACTER SET utf8mb4),256) AS part_hash
  FROM targets t JOIN document_admission_coordinators c ON CAST(c.project_id AS BINARY)=CAST(t.projectId AS BINARY) AND CAST(c.document_id AS BINARY)=CAST(t.documentId AS BINARY)
  UNION ALL
  SELECT DISTINCT t.documentId, 1 AS domain, 13 AS kind, CAST(o.id AS CHAR(255) CHARACTER SET utf8mb4) AS rid,
    SHA2(CAST(JSON_ARRAY('document_delete_operations',o.id,o.project_id,o.document_id,o.document_number_snapshot,o.initiated_by_user_id,o.reason,o.request_identity,o.status,o.pending_metadata,o.created_at,o.updated_at) AS CHAR CHARACTER SET utf8mb4),256) AS part_hash
  FROM targets t JOIN document_delete_operations o ON CAST(o.id AS BINARY)=CAST(t.operationId AS BINARY)
),
ordered_rows AS (
  SELECT documentId,domain,part_hash,
    ROW_NUMBER() OVER(PARTITION BY documentId,domain ORDER BY kind,CAST(rid AS BINARY)) AS rn,
    COUNT(*) OVER(PARTITION BY documentId,domain) AS total
  FROM snapshot_rows
),
chains(documentId,domain,rn,total,row_digest) AS (
  SELECT documentId,domain,rn,total,CAST(SHA2(CONCAT('STAGING-RECOVERY-v1|',part_hash),256) AS CHAR(64))
  FROM ordered_rows WHERE rn=1
  UNION ALL
  SELECT r.documentId,r.domain,r.rn,r.total,SHA2(CONCAT(c.row_digest,'|',r.part_hash),256)
  FROM chains c JOIN ordered_rows r ON CAST(r.documentId AS BINARY)=CAST(c.documentId AS BINARY) AND r.domain=c.domain AND r.rn=c.rn+1
),
fingerprints AS (
  SELECT documentId,MAX(CASE WHEN domain=0 THEN row_digest END) AS businessDigest,
    MAX(CASE WHEN domain=1 THEN row_digest END) AS controlDigest
  FROM chains WHERE rn=total GROUP BY documentId
)

  SELECT 'AFTER',documentId,businessDigest,controlDigest FROM fingerprints;
  SET v_count=ROW_COUNT();
  IF v_count<>3 OR EXISTS(SELECT 1 FROM tmp_edms_staging_recovery_targets t
    LEFT JOIN tmp_edms_staging_recovery_snapshots s ON CAST(s.phase AS BINARY)=CAST('AFTER' AS BINARY) AND CAST(s.document_id AS BINARY)=CAST(t.document_id AS BINARY)
    WHERE s.document_id IS NULL OR NOT (CAST(s.business_digest AS BINARY)<=>CAST(t.business_digest AS BINARY)))
  THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='STOP: business/file snapshot changed; entire recovery rolled back'; END IF;
  SELECT COUNT(*) INTO v_count FROM tmp_edms_staging_recovery_targets t
    JOIN document_admission_coordinators c ON CAST(c.project_id AS BINARY)=CAST(t.project_id AS BINARY) AND CAST(c.document_id AS BINARY)=CAST(t.document_id AS BINARY)
    JOIN document_delete_operations o ON CAST(o.id AS BINARY)=CAST(t.operation_id AS BINARY) AND CAST(o.project_id AS BINARY)=CAST(t.project_id AS BINARY) AND CAST(o.document_id AS BINARY)=CAST(t.document_id AS BINARY)
    JOIN audit_trail a ON CAST(a.identity_key AS BINARY)=CAST(CONCAT('reservation-recovery:',SHA2(t.operation_id,256)) AS BINARY)
  WHERE CAST(c.gate_state AS BINARY)=CAST('OPEN' AS BINARY) AND c.delete_operation_id IS NULL AND c.generation=t.generation+1
    AND CAST(JSON_UNQUOTE(JSON_EXTRACT(o.pending_metadata,'$.reservationRecovery.state')) AS BINARY)=CAST('CANCELLED_BEFORE_IO' AS BINARY)
    AND CAST(JSON_UNQUOTE(JSON_EXTRACT(o.pending_metadata,'$.reservationRecovery.operationId')) AS BINARY)=CAST(o.id AS BINARY)
    AND CAST(JSON_UNQUOTE(JSON_EXTRACT(o.pending_metadata,'$.reservationRecovery.approvalDigest')) AS BINARY)=CAST(v_digest AS BINARY)
    AND CAST(a.project_id AS BINARY)=CAST(t.project_id AS BINARY) AND CAST(a.resource_id AS BINARY)=CAST(t.document_id AS BINARY) AND a.actor_user_id=p_actor;
  IF v_count<>3 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='STOP: final marker/gate/audit count must be three'; END IF;

  SET v_commit_started=TRUE;
  COMMIT;
  SET v_tx=FALSE;
  SET v_committed=TRUE;
  SET v_release=RELEASE_LOCK(CONCAT('edms-del:',LEFT(SHA2('d1b06c71-ccf1-4d85-abbb-9f7f61a5d197',256),48)));
  IF COALESCE(v_release,0)<>1 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='COMMITTED: close connection, lock release unconfirmed'; END IF;
  SET v_release=RELEASE_LOCK(CONCAT('edms-del:',LEFT(SHA2('86135cc8-923b-451a-abb3-4a21729cba4c',256),48)));
  IF COALESCE(v_release,0)<>1 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='COMMITTED: close connection, lock release unconfirmed'; END IF;
  SET v_release=RELEASE_LOCK(CONCAT('edms-del:',LEFT(SHA2('012e8f62-a55a-4b2f-bbbb-f7f95e95bf0b',256),48)));
  IF COALESCE(v_release,0)<>1 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='COMMITTED: close connection, lock release unconfirmed'; END IF;
  SELECT 'RECOVERED - EXACTLY THREE; EXTERNAL ACCESS UAT STILL REQUIRED' AS result,v_digest AS approval_digest;
  SELECT t.document_number,t.document_id,o.id AS retained_operation_id,c.gate_state,c.delete_operation_id,c.generation,
    JSON_EXTRACT(o.pending_metadata,'$.reservationRecovery') AS cancellation,
    a.identity_key AS retained_audit_identity,s.business_digest AS unchanged_business_digest
  FROM tmp_edms_staging_recovery_targets t
    JOIN document_admission_coordinators c ON CAST(c.project_id AS BINARY)=CAST(t.project_id AS BINARY) AND CAST(c.document_id AS BINARY)=CAST(t.document_id AS BINARY)
    JOIN document_delete_operations o ON CAST(o.id AS BINARY)=CAST(t.operation_id AS BINARY)
    JOIN audit_trail a ON CAST(a.identity_key AS BINARY)=CAST(CONCAT('reservation-recovery:',SHA2(t.operation_id,256)) AS BINARY)
    JOIN tmp_edms_staging_recovery_snapshots s ON CAST(s.phase AS BINARY)=CAST('AFTER' AS BINARY) AND CAST(s.document_id AS BINARY)=CAST(t.document_id AS BINARY) ORDER BY t.seq;
  DROP TEMPORARY TABLE tmp_edms_staging_recovery_snapshots;
  SET v_snapshots_created=FALSE;
  DROP TEMPORARY TABLE tmp_edms_staging_recovery_targets;
  SET v_targets_created=FALSE;
END$$
DELIMITER ;

-- 03: this CALL fails closed with the shipped NULL inputs. No manual COMMIT follows.
CALL edms_staging_recovery_3_20261104(
  @expected_staging_database,@expected_staging_server_uuid,@verified_railway_service_id,
  @actor_user_id,@reviewed_preflight_utc,@approved_snapshot_json,@external_r2_evidence_sha256,
  @verified_r2_namespace_id,@verified_guards_git_commit,@verified_backup_reference,
  @environment_confirmation,@guards_confirmation,@maintenance_confirmation,@r2_confirmation,@owner_confirmation
);

-- 04: mandatory routine cleanup; execute separately if DBeaver stopped at CALL.
-- Only if this run successfully created this exact routine; never drop an unknown object.
DROP PROCEDURE edms_staging_recovery_3_20261104;
SELECT COUNT(*) AS maintenance_routine_remaining FROM information_schema.ROUTINES
  WHERE CAST(ROUTINE_SCHEMA AS BINARY)=CAST(DATABASE() AS BINARY) AND CAST(ROUTINE_NAME AS BINARY)=CAST('edms_staging_recovery_3_20261104' AS BINARY);
-- Expected 0. Routine DDL is not transactional; clean up even after a rolled-back CALL.
-- Do not rerun APPLY on recovered targets. Verify the persisted marker and audit instead.
-- Sources: MySQL 8.0 manual /declare-handler.html /create-procedure.html /implicit-commit.html.
-- Integration execution against actual MySQL: NOT VERIFIED by script generation.
