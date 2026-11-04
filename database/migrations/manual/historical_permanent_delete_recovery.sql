-- Historical Permanent Delete recovery: FAIL-CLOSED / NO SAFE SQL-ONLY BACKFILL.
-- MySQL 8.0.16+. One file for all environments; no runner/SSH/CLI required.
-- IMPORTANT: stored_files.checksum is expected metadata, NOT an R2 inspection.
-- Existing SQL schema contains no independent current exact-object proof for
-- unbound files. A registered bucket, another file's binding, path pattern, old
-- Delete manifest or completed Delete ledger is NOT authorization to bind them.
-- Therefore missing/incomplete provenance is BLOCKED, never invented here.
-- This file does NOT achieve historical recovery when every file lacks proof.
-- No INSERT/UPDATE/DELETE, DDL, audit-history change, R2 IO or automatic COMMIT.
-- Keep Permanent Delete safety gates unchanged. No claim of R2 existence.
--
-- DBEAVER (five steps):
-- 1. Select the correct dedicated fresh connection; no existing transaction.
--    Disable auto-reconnect, STOP ON FIRST ERROR. Do not execute against another
--    session's open business transaction. Choose EDMS environment below.
-- 2. Fill that environment's server UUID/schema/hostname/internal port/version
--    from its trusted connection identity. Run SECTION 1. STOP unless PASS.
-- 3. Run SECTION 2 in the SAME connection; inspect counts and blocked reasons.
--    These are current DB results, not the old Development artifact counts.
-- 4. Run SECTION 3. Owner issues COMMIT or ROLLBACK MANUALLY on this connection.
--    Both close this READ ONLY transaction; neither repairs any blocked file.
-- 5. Test Delete only for independently authorized, provenance-complete files.
--    BLOCKED records are NOT repaired/authorized. Do not retry a pending Delete.

-- SECTION 1: explicit environment configuration; no universal Development UUID.
SET @hpr_environment = 'development'; -- development | staging | production
SET @hpr_targets = JSON_OBJECT(
  'development', JSON_OBJECT('railwayEnvironment','production',
    'schema',NULL,'serverUuid',NULL,'hostname',NULL,'port',NULL,'versionPrefix',NULL),
  'staging', JSON_OBJECT('railwayEnvironment','staging',
    'schema',NULL,'serverUuid',NULL,'hostname',NULL,'port',NULL,'versionPrefix',NULL),
  'production', JSON_OBJECT('railwayEnvironment','real_production',
    'schema',NULL,'serverUuid',NULL,'hostname',NULL,'port',NULL,'versionPrefix',NULL)
);
SET @hpr_target = JSON_EXTRACT(@hpr_targets, CONCAT('$.',@hpr_environment));
SET @hpr_identity_ok = COALESCE(
  @hpr_environment IN ('development','staging','production')
  AND JSON_TYPE(JSON_EXTRACT(@hpr_target,'$.schema'))='STRING'
  AND JSON_TYPE(JSON_EXTRACT(@hpr_target,'$.serverUuid'))='STRING'
  AND JSON_TYPE(JSON_EXTRACT(@hpr_target,'$.hostname'))='STRING'
  AND JSON_TYPE(JSON_EXTRACT(@hpr_target,'$.port'))='INTEGER'
  AND JSON_TYPE(JSON_EXTRACT(@hpr_target,'$.versionPrefix'))='STRING'
  AND LENGTH(JSON_UNQUOTE(JSON_EXTRACT(@hpr_target,'$.versionPrefix')))>0
  AND CAST(DATABASE() AS BINARY)=CAST(JSON_UNQUOTE(JSON_EXTRACT(@hpr_target,'$.schema')) AS BINARY)
  AND CAST(@@server_uuid AS BINARY)=CAST(JSON_UNQUOTE(JSON_EXTRACT(@hpr_target,'$.serverUuid')) AS BINARY)
  AND CAST(@@hostname AS BINARY)=CAST(JSON_UNQUOTE(JSON_EXTRACT(@hpr_target,'$.hostname')) AS BINARY)
  AND @@port=CAST(JSON_UNQUOTE(JSON_EXTRACT(@hpr_target,'$.port')) AS UNSIGNED)
  AND LEFT(VERSION(),LENGTH(JSON_UNQUOTE(JSON_EXTRACT(@hpr_target,'$.versionPrefix'))))
    =JSON_UNQUOTE(JSON_EXTRACT(@hpr_target,'$.versionPrefix'))
  AND VERSION() NOT LIKE '%MariaDB%'
  AND (CAST(SUBSTRING_INDEX(VERSION(),'.',1) AS UNSIGNED)>8
    OR (CAST(SUBSTRING_INDEX(VERSION(),'.',1) AS UNSIGNED)=8
      AND (CAST(SUBSTRING_INDEX(SUBSTRING_INDEX(VERSION(),'.',2),'.',-1) AS UNSIGNED)>0
        OR CAST(SUBSTRING_INDEX(SUBSTRING_INDEX(VERSION(),'.',3),'.',-1) AS UNSIGNED)>=16))),0);
SET @hpr_schema_ok = (
  SELECT COUNT(*)=9 FROM information_schema.TABLES
  WHERE TABLE_SCHEMA=DATABASE() AND ENGINE='InnoDB' AND TABLE_NAME IN
    ('stored_files','engineering_documents','document_revisions','workflow_attachments',
     'projects','storage_namespaces','stored_file_namespace_bindings',
     'document_delete_operations','document_writer_operations')
);
SET @hpr_ok = (@hpr_identity_ok=1 AND @hpr_schema_ok=1);
SELECT IF(@hpr_ok,'PASS','STOP - TARGET OR SCHEMA NOT VERIFIED') AS preflight_verdict,
  @hpr_environment AS edms_environment,
  JSON_UNQUOTE(JSON_EXTRACT(@hpr_target,'$.railwayEnvironment')) AS railway_environment_label,
  DATABASE() AS actual_schema,@@server_uuid AS actual_server_uuid,
  @@hostname AS actual_hostname,@@port AS actual_internal_port,VERSION() AS actual_version,
  'Environment label is owner-supplied; UUID/schema/hostname/port/version are checked' AS identity_basis;
-- Invalid SQL deliberately fails PREPARE on a failed gate. Even if an operator
-- incorrectly ignores that error, every data query below is gated and no DML exists.
SET @hpr_assert_sql = IF(@hpr_ok,'SELECT 1 AS identity_and_schema_verified',
  'SELECT CAST(1 AS __HPR_STOP_TARGET_OR_SCHEMA_NOT_VERIFIED__)');
PREPARE hpr_assert FROM @hpr_assert_sql;
EXECUTE hpr_assert;
DEALLOCATE PREPARE hpr_assert;

-- SECTION 2: consistent read-only classification. No temporary schema objects.
SET TRANSACTION ISOLATION LEVEL REPEATABLE READ;
START TRANSACTION WITH CONSISTENT SNAPSHOT, READ ONLY;
SELECT COUNT(*) INTO @hpr_before_files FROM stored_files WHERE @hpr_ok;
SELECT COUNT(*) INTO @hpr_before_bindings FROM stored_file_namespace_bindings WHERE @hpr_ok;

WITH facts AS (
  SELECT f.file_id,f.project_id,f.document_id,f.storage_key,f.relative_path,f.checksum,f.file_size,
    d.id AS document_exists,d.project_id AS document_project,p.status AS project_status,
    b.file_id AS bound_file,b.namespace_id,b.storage_key_snapshot,
    n.id AS namespace_exists,n.provider,n.descriptor,
    IF(JSON_VALID(n.descriptor),n.descriptor,'{}') AS ns_json,
    IF(JSON_VALID(b.evidence),b.evidence,'{}') AS proof_json,
    EXISTS(SELECT 1 FROM document_delete_operations o
      WHERE o.project_id=f.project_id AND o.document_id=f.document_id) AS delete_reserved,
    EXISTS(SELECT 1 FROM document_writer_operations w
      WHERE w.project_id=f.project_id AND w.document_id=f.document_id
        AND (w.lifecycle_state<>'SETTLED' OR w.completion_evidence IS NULL
          OR w.db_outcome IS NULL OR w.db_outcome NOT IN ('COMMITTED','ROLLED_BACK','NOT_STARTED'))) AS writer_unsettled,
    EXISTS(SELECT 1 FROM document_revisions r WHERE r.file_id=f.file_id
      AND (r.project_id<>f.project_id OR NOT (r.document_id<=>f.document_id))) AS foreign_revision,
    EXISTS(SELECT 1 FROM workflow_attachments a WHERE a.file_id=f.file_id
      AND (a.project_id<>f.project_id OR NOT (a.document_id<=>f.document_id))) AS foreign_attachment,
    EXISTS(SELECT 1 FROM engineering_documents other WHERE other.active_file_id=f.file_id
      AND (other.project_id<>f.project_id OR NOT (other.id<=>f.document_id))) AS foreign_active_reference
  FROM stored_files f
  LEFT JOIN engineering_documents d ON d.id=f.document_id
  LEFT JOIN projects p ON p.id=f.project_id
  LEFT JOIN stored_file_namespace_bindings b ON b.file_id=f.file_id
  LEFT JOIN storage_namespaces n ON n.id=b.namespace_id
  WHERE @hpr_ok
), classified AS (
  SELECT facts.*,
    CASE
      WHEN bound_file IS NOT NULL AND provider='local' THEN 'SKIPPED_EXISTING_LOCAL_BINDING_OUT_OF_SCOPE'
      WHEN document_id IS NULL OR document_exists IS NULL OR document_project<>project_id THEN 'EXPLICIT_OWNERSHIP_UNVERIFIED'
      WHEN foreign_revision OR foreign_attachment OR foreign_active_reference THEN 'SHARED_FILE_REFERENCE'
      WHEN project_status IS NULL OR project_status<>'Active' THEN 'PROJECT_NOT_ACTIVE'
      WHEN delete_reserved THEN 'DELETE_OPERATION_EXISTS_DO_NOT_REPAIR_OR_RETRY'
      WHEN writer_unsettled THEN 'WRITER_NOT_SETTLED'
      WHEN storage_key='' OR CAST(storage_key AS BINARY)<>CAST(TRIM(REPLACE(storage_key,CHAR(92),'/')) AS BINARY)
        OR LOCATE(CAST(0x00 AS BINARY),CAST(storage_key AS BINARY))>0
        OR REGEXP_LIKE(storage_key,'[^A-Za-z0-9._/-]','c') OR LEFT(storage_key,1)='/'
        OR RIGHT(storage_key,1)='/' OR LOCATE('//',storage_key)>0
        OR REGEXP_LIKE(storage_key,'(^|/)[.]{1,2}(/|$)','c') THEN 'NONCANONICAL_STORAGE_KEY'
      WHEN bound_file IS NULL THEN 'EXACT_STORAGE_PROOF_REQUIRED'
      WHEN namespace_exists IS NOT NULL AND provider='r2'
        AND CAST(SHA2(descriptor,256) AS BINARY)=CAST(namespace_id AS BINARY)
        AND JSON_EXTRACT(ns_json,'$.version')=1 AND JSON_UNQUOTE(JSON_EXTRACT(ns_json,'$.provider'))='r2'
        AND JSON_TYPE(JSON_EXTRACT(ns_json,'$.account'))='STRING'
        AND JSON_TYPE(JSON_EXTRACT(ns_json,'$.endpoint'))='STRING'
        AND JSON_TYPE(JSON_EXTRACT(ns_json,'$.bucket'))='STRING'
        AND CAST(storage_key_snapshot AS BINARY)=CAST(storage_key AS BINARY)
        AND JSON_EXTRACT(proof_json,'$.version')=1
        AND JSON_UNQUOTE(JSON_EXTRACT(proof_json,'$.source')) IN ('UPLOAD_ADAPTER_SNAPSHOT','OWNER_REVIEWED_STORAGE_INVENTORY')
        AND REGEXP_LIKE(checksum,'^[A-Fa-f0-9]{64}$','c')
        AND CAST(JSON_UNQUOTE(JSON_EXTRACT(proof_json,'$.sha256')) AS BINARY)=CAST(LOWER(checksum) AS BINARY)
        AND JSON_TYPE(JSON_EXTRACT(proof_json,'$.size'))='INTEGER'
        AND JSON_EXTRACT(proof_json,'$.size')=file_size
        AND JSON_EXTRACT(proof_json,'$.localIdentity') IS NULL
        AND (JSON_EXTRACT(proof_json,'$.projectId') IS NULL
          OR CAST(JSON_UNQUOTE(JSON_EXTRACT(proof_json,'$.projectId')) AS BINARY)=CAST(project_id AS BINARY))
        AND (JSON_EXTRACT(proof_json,'$.documentId') IS NULL
          OR CAST(JSON_UNQUOTE(JSON_EXTRACT(proof_json,'$.documentId')) AS BINARY)=CAST(document_id AS BINARY))
        THEN 'SKIPPED_EXISTING_R2_BINDING_METADATA_NOT_REINSPECTED'
      ELSE 'EXISTING_BINDING_CONFLICT_OR_INCOMPLETE'
    END AS reason
  FROM facts
)
SELECT JSON_OBJECT('environment',@hpr_environment,'railwayEnvironment',JSON_EXTRACT(@hpr_target,'$.railwayEnvironment'),
  'totalFiles',COUNT(*),'legacyMissingBindings',COALESCE(SUM(bound_file IS NULL),0),
  'eligible',0,'updated',0,'skipped',COALESCE(SUM(LEFT(reason,8)='SKIPPED_'),0),
  'blocked',COALESCE(SUM(LEFT(reason,8)<>'SKIPPED_'),0),
  'verdict',IF(COUNT(*)=0,'NO FILES - NO CHANGES',
    IF(SUM(LEFT(reason,8)<>'SKIPPED_')=0,'NO REPAIR PERFORMED - EXISTING BINDINGS PRESERVED',
      'BLOCKED - SQL METADATA CANNOT PROVE MISSING R2 PROVENANCE')),
  'files',COALESCE(JSON_ARRAYAGG(JSON_OBJECT('fileId',file_id,'projectId',project_id,'documentId',document_id,
    'status',IF(LEFT(reason,8)='SKIPPED_','SKIPPED','BLOCKED'),'reason',reason)),JSON_ARRAY()))
INTO @hpr_report FROM classified;
SELECT @hpr_report AS recovery_summary_and_blocked_records;

-- SECTION 3: no writes occurred. Counts are from the same consistent snapshot,
-- not proof that another session has never written or that R2 bytes exist.
SELECT @hpr_before_files AS files_before,COUNT(*) AS files_after,
  @hpr_before_bindings AS bindings_before,
  (SELECT COUNT(*) FROM stored_file_namespace_bindings WHERE @hpr_ok) AS bindings_after,
  0 AS updated,0 AS eligible,
  'NO MUTATION EXECUTED - NOT A SUCCESSFUL LEGACY BACKFILL' AS verification_verdict,
  'Owner closes this read-only transaction with manual COMMIT or ROLLBACK' AS next_step
FROM stored_files WHERE @hpr_ok;
-- No COMMIT/ROLLBACK statement executed automatically.
-- Do not infer namespace from the sole storage_namespaces row or sibling files.
-- Do not insert UPLOAD_ADAPTER_SNAPSHOT to disguise uninspected historical files.
