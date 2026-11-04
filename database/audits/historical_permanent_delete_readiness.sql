-- Historical Permanent Delete readiness / Railway Development / READ ONLY.
-- Baseline: documentDelete.repository.js inventory/lockOperation/readManifest,
-- documentFolder.js deriveFolderTargets, documentFolderCleanup.service.js,
-- storage.validator.js, storageNamespace.js and the two 20261102 MySQL migrations.
-- DBeaver: verify the Development connection manually, select schema railway,
-- run sections 01-03 first; STOP on missing columns or wrong engine/schema.
-- Then run 04-08 as a script (Alt+X) and retain every result set.
-- MySQL 8.0.16+ required. This is NOT a migration or permission to remove data.
-- No reliable historical/new marker exists. ALL surviving documents are assessed;
-- created_at/uploaded_at are evidence only, never an invented historical cutoff.
-- READY_CANDIDATE = metadata-only shortlist for owner review, NOT safe-to-delete.
-- R2 object existence/content, unknown objects/markers under prefixes, runtime
-- namespace, permissions and live lock ownership remain UNVERIFIED.
-- Run during low activity. Separate SELECTs are not one consistent snapshot;
-- findings can change with concurrent uploads, writers or administrative actions.
-- Full schema SELECT visibility is needed for cross-document/dependency checks.
-- Role-only/table-only grants are conservatively UNVERIFIED in section 05.
-- Do not share credentials, full namespace descriptors or inventory JSON in reports.

-- 01 / Target identity. A name alone does not prove Development rather than live.
SELECT '01_identity' AS section, DATABASE() AS active_schema, VERSION() AS mysql_version,
  @@version_comment AS version_comment, @@hostname AS server_hostname, @@port AS server_port,
  CONNECTION_ID() AS connection_id, CURRENT_USER() AS privilege_identity,
  CASE WHEN DATABASE() IS NULL OR DATABASE()<>'railway' THEN 'STOP - WRONG SCHEMA'
    WHEN VERSION() LIKE '%MariaDB%' OR @@version_comment NOT LIKE '%MySQL%' THEN 'STOP - VERIFY ORACLE MYSQL'
    WHEN CAST(SUBSTRING_INDEX(VERSION(),'.',1) AS UNSIGNED)<8
      OR (CAST(SUBSTRING_INDEX(VERSION(),'.',1) AS UNSIGNED)=8
        AND CAST(SUBSTRING_INDEX(SUBSTRING_INDEX(VERSION(),'.',2),'.',-1) AS UNSIGNED)=0
        AND CAST(SUBSTRING_INDEX(SUBSTRING_INDEX(VERSION(),'.',3),'.',-1) AS UNSIGNED)<16)
      THEN 'STOP - MYSQL 8.0.16+ REQUIRED'
    ELSE 'IDENTITY PREREQUISITE PASS - CONFIRM DEVELOPMENT CONNECTION' END AS result;

-- 02 / Privilege evidence. No privilege is granted or changed.
SHOW GRANTS;

-- 03 / Required column availability. This does not replace the existing full
-- Permanent Delete STRUCTURE MATCH preflight. No migration should be rerun.
WITH required AS (
  SELECT j.table_name,j.column_name FROM JSON_TABLE('[
    {"t":"projects","c":["id","project_code","status"]},
    {"t":"users","c":["id","full_name","status"]},
    {"t":"project_memberships","c":["project_id","user_id","official_role","status"]},
    {"t":"engineering_documents","c":["id","project_id","document_number","active_file_id","active_revision_id","created_at","workflow_status","lifecycle_status"]},
    {"t":"stored_files","c":["file_id","project_id","document_id","storage_key","relative_path","file_size","checksum","uploaded_at"]},
    {"t":"document_revisions","c":["id","project_id","document_id","file_id","storage_path_legacy","is_active"]},
    {"t":"workflow_comments","c":["id","project_id","document_id","revision_id"]},
    {"t":"workflow_attachments","c":["attachment_id","project_id","document_id","comment_id","file_id"]},
    {"t":"comment_read_receipts","c":["id","project_id","document_id","comment_id"]},
    {"t":"document_history","c":["id","project_id","document_id"]},
    {"t":"document_sla_evaluations","c":["id","project_id","document_id"]},
    {"t":"temporary_uploads","c":["id","temporary_file_id"]},
    {"t":"storage_namespaces","c":["id","provider","descriptor"]},
    {"t":"stored_file_namespace_bindings","c":["file_id","namespace_id","storage_key_snapshot","evidence"]},
    {"t":"document_admission_coordinators","c":["project_id","document_id","gate_state","delete_operation_id"]},
    {"t":"document_delete_operations","c":["id","project_id","document_id","status","initiated_by_user_id","created_at","pending_metadata"]},
    {"t":"document_writer_operations","c":["id","project_id","document_id","lifecycle_state","db_outcome","completion_evidence","temporary_file_id"]},
    {"t":"document_storage_io_steps","c":["id","writer_id","state"]},
    {"t":"document_delete_file_manifest","c":["id","delete_operation_id","file_reference","provider","exact_storage_key","storage_key_hash","ownership_evidence","cleanup_state"]},
    {"t":"document_delete_executions","c":["operation_id","phase","inventory","manifest_digest","completion_snapshot","pending_reason"]},
    {"t":"document_delete_attempts","c":["manifest_id","attempt_id","state","error_code"]}
  ]','$[*]' COLUMNS (table_name VARCHAR(64) PATH '$.t',
    NESTED PATH '$.c[*]' COLUMNS(column_name VARCHAR(64) PATH '$'))) j
)
SELECT '03_required_columns' AS section,r.table_name,r.column_name,
  IF(c.COLUMN_NAME IS NULL,'STOP - MISSING OR NOT VISIBLE','AVAILABLE') AS result,
  c.COLUMN_TYPE,c.IS_NULLABLE,c.COLLATION_NAME
FROM required r LEFT JOIN information_schema.COLUMNS c ON c.TABLE_SCHEMA=DATABASE()
  AND c.TABLE_NAME=r.table_name AND c.COLUMN_NAME=r.column_name
ORDER BY c.COLUMN_NAME IS NULL DESC,r.table_name,r.column_name;

-- 04 / Cohort overview: no document is asserted to be historical automatically.
SELECT '04_overview' AS section,'UNVERIFIED - HISTORICAL COHORT NOT IDENTIFIED' AS historical_cohort,
  (SELECT COUNT(*) FROM engineering_documents) AS surviving_documents,
  (SELECT COUNT(*) FROM document_revisions) AS revisions,
  (SELECT COUNT(*) FROM workflow_attachments) AS workflow_attachments,
  (SELECT COUNT(*) FROM stored_files) AS stored_files,
  (SELECT COUNT(*) FROM stored_file_namespace_bindings) AS bindings,
  (SELECT COUNT(*) FROM storage_namespaces) AS namespaces,
  (SELECT COUNT(*) FROM stored_files f LEFT JOIN stored_file_namespace_bindings b ON b.file_id=f.file_id
    WHERE b.file_id IS NULL) AS unbound_stored_files,
  (SELECT COUNT(*) FROM document_delete_operations) AS recorded_delete_operations,
  (SELECT COUNT(*) FROM document_delete_executions WHERE phase='COMPLETED') AS durable_completed_executions,
  (SELECT MIN(created_at) FROM engineering_documents) AS oldest_document_timestamp,
  (SELECT MAX(created_at) FROM engineering_documents) AS newest_document_timestamp;

-- 05 / Main assessment: SUMMARY, DOCUMENT (including READY_CANDIDATE shortlist),
-- GLOBAL_FINDING and FINDING rows. Read GLOBAL_FINDING before selecting any UAT
-- candidate. BLOCKED describes an obstacle at this snapshot, not authorization
-- for recovery. NEEDS_REVIEW is not a proven rejection by the R2 Delete adapter.
WITH
docs AS (
  SELECT d.*,p.project_code,p.status AS project_status FROM engineering_documents d
  LEFT JOIN projects p ON p.id=d.project_id
),
file_refs_raw AS (
  SELECT d.id document_id,d.project_id,d.active_file_id file_id FROM docs d WHERE d.active_file_id IS NOT NULL
  UNION ALL SELECT d.id,d.project_id,r.file_id FROM docs d JOIN document_revisions r ON r.document_id=d.id
  UNION ALL SELECT d.id,d.project_id,a.file_id FROM docs d JOIN workflow_attachments a ON a.document_id=d.id
  UNION ALL SELECT d.id,d.project_id,f.file_id FROM docs d JOIN stored_files f ON f.document_id=d.id
),
file_refs AS (
  SELECT DISTINCT CAST(document_id AS BINARY) AS document_id,CAST(project_id AS BINARY) AS project_id,
    CAST(file_id AS BINARY) AS file_id FROM file_refs_raw
),
keys_normalized AS (
  SELECT f.file_id,f.storage_key,
    REGEXP_REPLACE(REPLACE(f.storage_key,CHAR(92),'/'),'^[[:space:]]+|[[:space:]]+$','') AS normalized_key
  FROM stored_files f
),
file_data AS (
  SELECT r.document_id AS owner_document_id,r.project_id AS owner_project_id,r.file_id AS referenced_file_id,
    f.file_id,f.project_id AS file_project_id,f.document_id AS file_document_id,f.storage_key,
    f.relative_path,f.file_size,f.checksum,f.uploaded_at,k.normalized_key,
    b.file_id AS bound_file_id,b.namespace_id,b.storage_key_snapshot,b.evidence,
    n.id AS registered_namespace_id,n.provider AS namespace_provider,n.descriptor,
    IF(JSON_VALID(n.descriptor),n.descriptor,'{}') AS safe_descriptor,
    IF(JSON_VALID(b.evidence),b.evidence,'{}') AS safe_evidence
  FROM file_refs r LEFT JOIN stored_files f ON f.file_id=r.file_id
  LEFT JOIN keys_normalized k ON k.file_id=f.file_id
  LEFT JOIN stored_file_namespace_bindings b ON b.file_id=f.file_id
  LEFT JOIN storage_namespaces n ON n.id=b.namespace_id
),
children AS (
  SELECT 'document_revisions' object_type,id object_id,document_id,project_id FROM document_revisions
  UNION ALL SELECT 'workflow_comments',id,document_id,project_id FROM workflow_comments
  UNION ALL SELECT 'workflow_attachments',attachment_id,document_id,project_id FROM workflow_attachments
  UNION ALL SELECT 'comment_read_receipts',id,document_id,project_id FROM comment_read_receipts
  UNION ALL SELECT 'document_history',id,document_id,project_id FROM document_history
  UNION ALL SELECT 'document_sla_evaluations',id,document_id,project_id FROM document_sla_evaluations
),
privileges AS (
  SELECT PRIVILEGE_TYPE FROM information_schema.USER_PRIVILEGES
  WHERE GRANTEE=CONCAT(CHAR(39),SUBSTRING_INDEX(CURRENT_USER(),'@',1),CHAR(39),'@',CHAR(39),SUBSTRING_INDEX(CURRENT_USER(),'@',-1),CHAR(39))
  UNION ALL SELECT PRIVILEGE_TYPE FROM information_schema.SCHEMA_PRIVILEGES
  WHERE TABLE_SCHEMA=DATABASE() AND GRANTEE=CONCAT(CHAR(39),SUBSTRING_INDEX(CURRENT_USER(),'@',1),CHAR(39),'@',CHAR(39),SUBSTRING_INDEX(CURRENT_USER(),'@',-1),CHAR(39))
),
global_findings AS (
  SELECT 'UNVERIFIED' classification,'ENVIRONMENT_NOT_VERIFIED' reason,'schema' object_type,
    COALESCE(DATABASE(),'<NULL>') object_id
  WHERE DATABASE() IS NULL OR DATABASE()<>'railway' OR VERSION() LIKE '%MariaDB%' OR @@version_comment NOT LIKE '%MySQL%'
  UNION ALL SELECT 'UNVERIFIED','SCHEMA_METADATA_VISIBILITY_NOT_PROVEN','privilege','SELECT'
    WHERE NOT EXISTS(SELECT 1 FROM privileges WHERE PRIVILEGE_TYPE='SELECT')
  UNION ALL SELECT 'BLOCKED','UNREVIEWED_DOCUMENT_DEPENDENCY','table',c.TABLE_NAME
  FROM information_schema.COLUMNS c WHERE c.TABLE_SCHEMA=DATABASE() AND c.COLUMN_NAME='document_id'
    AND c.TABLE_NAME NOT IN ('engineering_documents','stored_files','document_revisions','workflow_comments',
      'workflow_attachments','document_history','comment_read_receipts','document_sla_evaluations',
      'document_admission_coordinators','document_delete_operations','document_writer_operations')
  UNION ALL SELECT 'BLOCKED','UNREVIEWED_DOCUMENT_DEPENDENCY','foreign key',k.CONSTRAINT_NAME
  FROM information_schema.KEY_COLUMN_USAGE k WHERE k.TABLE_SCHEMA=DATABASE()
    AND k.REFERENCED_TABLE_NAME IN ('engineering_documents','stored_files','document_revisions','workflow_comments',
      'workflow_attachments','document_history','comment_read_receipts','document_sla_evaluations')
    AND k.TABLE_NAME NOT IN ('engineering_documents','stored_files','document_revisions','workflow_comments',
      'workflow_attachments','document_history','comment_read_receipts','document_sla_evaluations')
  UNION ALL SELECT 'BLOCKED','UNREVIEWED_STORAGE_KEY_GLOBAL','stored_files',k.file_id
  FROM keys_normalized k WHERE OCTET_LENGTH(k.storage_key)=CHAR_LENGTH(k.storage_key)
    AND (NOT REGEXP_LIKE(k.normalized_key,'^[A-Za-z0-9._-]+(/[A-Za-z0-9._-]+)*$','c')
      OR REGEXP_LIKE(k.normalized_key,'(^|/)[.]{1,2}(/|$)','c') OR LOCATE(CAST(0x00 AS BINARY),CAST(k.normalized_key AS BINARY))>0)
  UNION ALL SELECT 'NEEDS_REVIEW','NON_ASCII_KEY_REQUIRES_JS_VALIDATOR_REVIEW','stored_files',k.file_id
    FROM keys_normalized k WHERE OCTET_LENGTH(k.storage_key)<>CHAR_LENGTH(k.storage_key)
),
findings AS (
  SELECT d.id document_id,'BLOCKED' classification,'PROJECT_NOT_ACTIVE_OR_MISSING' reason,'project' object_type,d.project_id object_id
    FROM docs d WHERE d.project_status IS NULL OR d.project_status<>'Active'
  UNION ALL SELECT d.id,'BLOCKED','NO_FILES_FOR_FOLDER_PROVENANCE','document',d.id FROM docs d
    WHERE NOT EXISTS(SELECT 1 FROM file_refs r WHERE r.document_id=d.id)
  UNION ALL SELECT d.id,'NEEDS_REVIEW','ACTIVE_POINTER_NOT_SET','document',d.id FROM docs d
    WHERE d.active_file_id IS NULL OR d.active_revision_id IS NULL
  UNION ALL SELECT d.id,'BLOCKED','FILE_RELATION_MISSING_ACTIVE_REVISION','revision',d.active_revision_id FROM docs d
    WHERE d.active_revision_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM document_revisions r
      WHERE CAST(r.id AS BINARY)=CAST(d.active_revision_id AS BINARY)
        AND CAST(r.document_id AS BINARY)=CAST(d.id AS BINARY) AND CAST(r.project_id AS BINARY)=CAST(d.project_id AS BINARY))
  UNION ALL SELECT d.id,'BLOCKED','ACTIVE_FILE_MISMATCH','revision',r.id FROM docs d
    JOIN document_revisions r ON r.id=d.active_revision_id
    WHERE NOT(CAST(r.file_id AS BINARY)<=>CAST(d.active_file_id AS BINARY))
  UNION ALL SELECT d.id,'NEEDS_REVIEW','ACTIVE_REVISION_FLAG_INCONSISTENT','revision',r.id FROM docs d
    JOIN document_revisions r ON r.id=d.active_revision_id WHERE r.is_active<>1
  UNION ALL SELECT d.id,'BLOCKED','CROSS_DOCUMENT_REFERENCE',c.object_type,c.object_id FROM docs d
    JOIN children c ON c.document_id=d.id WHERE NOT(CAST(c.project_id AS BINARY)<=>CAST(d.project_id AS BINARY))
      OR NOT(CAST(c.document_id AS BINARY)<=>CAST(d.id AS BINARY))
  UNION ALL SELECT d.id,'BLOCKED','CHILD_OWNERSHIP_AMBIGUOUS_REVISION','comment',c.id FROM docs d
    JOIN workflow_comments c ON c.document_id=d.id WHERE c.revision_id IS NOT NULL AND NOT EXISTS(
      SELECT 1 FROM document_revisions r WHERE CAST(r.id AS BINARY)=CAST(c.revision_id AS BINARY)
      AND CAST(r.document_id AS BINARY)=CAST(d.id AS BINARY) AND CAST(r.project_id AS BINARY)=CAST(d.project_id AS BINARY))
  UNION ALL SELECT d.id,'BLOCKED','CROSS_DOCUMENT_REFERENCE_FOREIGN_COMMENT','comment',c.id FROM docs d
    JOIN document_revisions r ON r.document_id=d.id JOIN workflow_comments c ON c.revision_id=r.id
    WHERE NOT(CAST(c.document_id AS BINARY)<=>CAST(d.id AS BINARY)) OR NOT(CAST(c.project_id AS BINARY)<=>CAST(d.project_id AS BINARY))
  UNION ALL SELECT d.id,'BLOCKED','CHILD_OWNERSHIP_AMBIGUOUS_COMMENT','attachment',a.attachment_id FROM docs d
    JOIN workflow_attachments a ON a.document_id=d.id LEFT JOIN workflow_comments c ON c.id=a.comment_id
    WHERE c.id IS NULL OR NOT(CAST(c.document_id AS BINARY)<=>CAST(d.id AS BINARY)) OR NOT(CAST(c.project_id AS BINARY)<=>CAST(d.project_id AS BINARY))
  UNION ALL SELECT d.id,'BLOCKED','CHILD_OWNERSHIP_AMBIGUOUS_RECEIPT','receipt',a.id FROM docs d
    JOIN comment_read_receipts a ON a.document_id=d.id LEFT JOIN workflow_comments c ON c.id=a.comment_id
    WHERE c.id IS NULL OR NOT(CAST(c.document_id AS BINARY)<=>CAST(d.id AS BINARY)) OR NOT(CAST(c.project_id AS BINARY)<=>CAST(d.project_id AS BINARY))
  UNION ALL SELECT d.id,'BLOCKED','CROSS_DOCUMENT_REFERENCE_FOREIGN_ATTACHMENT','attachment',a.attachment_id FROM docs d
    JOIN workflow_comments c ON c.document_id=d.id JOIN workflow_attachments a ON a.comment_id=c.id
    WHERE NOT(CAST(a.document_id AS BINARY)<=>CAST(d.id AS BINARY)) OR NOT(CAST(a.project_id AS BINARY)<=>CAST(d.project_id AS BINARY))
  UNION ALL SELECT d.id,'BLOCKED','CROSS_DOCUMENT_REFERENCE_FOREIGN_RECEIPT','receipt',a.id FROM docs d
    JOIN workflow_comments c ON c.document_id=d.id JOIN comment_read_receipts a ON a.comment_id=c.id
    WHERE NOT(CAST(a.document_id AS BINARY)<=>CAST(d.id AS BINARY)) OR NOT(CAST(a.project_id AS BINARY)<=>CAST(d.project_id AS BINARY))
  UNION ALL SELECT r.document_id,'BLOCKED','SHARED_FILE_REFERENCE_ACTIVE_REVISION','document',other.id FROM docs d
    JOIN document_revisions r ON r.document_id=d.id JOIN engineering_documents other ON other.active_revision_id=r.id
    WHERE NOT(CAST(other.id AS BINARY)<=>CAST(d.id AS BINARY)) OR NOT(CAST(other.project_id AS BINARY)<=>CAST(d.project_id AS BINARY))
  UNION ALL SELECT f.owner_document_id,'BLOCKED','FILE_RELATION_MISSING','file',f.referenced_file_id FROM file_data f WHERE f.file_id IS NULL
  UNION ALL SELECT f.owner_document_id,'BLOCKED','FILE_ID_CASE_MISMATCH','file',f.referenced_file_id FROM file_data f
    WHERE f.file_id IS NOT NULL AND NOT(CAST(f.file_id AS BINARY)<=>CAST(f.referenced_file_id AS BINARY))
  UNION ALL SELECT f.owner_document_id,'BLOCKED','SHARED_FILE_REFERENCE','file',f.file_id FROM file_data f WHERE f.file_id IS NOT NULL
    AND (NOT(CAST(f.file_project_id AS BINARY)<=>CAST(f.owner_project_id AS BINARY))
      OR (f.file_document_id IS NOT NULL AND CHAR_LENGTH(f.file_document_id)>0 AND NOT(CAST(f.file_document_id AS BINARY)<=>CAST(f.owner_document_id AS BINARY))))
  UNION ALL SELECT a.document_id,'BLOCKED','SHARED_FILE_REFERENCE_OTHER_DOCUMENT','file',a.file_id FROM file_refs a
    WHERE EXISTS(SELECT 1 FROM file_refs b WHERE b.file_id=a.file_id AND NOT(CAST(b.document_id AS BINARY)<=>CAST(a.document_id AS BINARY)))
  UNION ALL SELECT f.owner_document_id,'BLOCKED','FILE_NAMESPACE_UNVERIFIED_MISSING_BINDING','file',f.file_id FROM file_data f
    WHERE f.file_id IS NOT NULL AND f.bound_file_id IS NULL
  UNION ALL SELECT f.owner_document_id,'BLOCKED','FILE_NAMESPACE_UNVERIFIED_STALE_KEY','file',f.file_id FROM file_data f
    WHERE f.bound_file_id IS NOT NULL AND NOT(CAST(f.storage_key_snapshot AS BINARY)<=>CAST(f.storage_key AS BINARY))
  UNION ALL SELECT f.owner_document_id,'BLOCKED','NAMESPACE_INVALID_MISSING_OR_DIGEST','namespace',f.namespace_id FROM file_data f
    WHERE f.bound_file_id IS NOT NULL AND (f.registered_namespace_id IS NULL OR NOT(CAST(SHA2(CONVERT(f.descriptor USING utf8mb4),256) AS BINARY)<=>CAST(f.registered_namespace_id AS BINARY)))
  UNION ALL SELECT f.owner_document_id,'BLOCKED','NAMESPACE_INVALID_DESCRIPTOR','file',f.file_id FROM file_data f
    WHERE f.registered_namespace_id IS NOT NULL AND (JSON_VALID(f.descriptor)<>1 OR JSON_TYPE(f.safe_descriptor)<>'OBJECT'
      OR NOT(CAST(JSON_UNQUOTE(JSON_EXTRACT(f.safe_descriptor,'$.provider')) AS BINARY)<=>CAST(f.namespace_provider AS BINARY))
      OR CAST(f.namespace_provider AS BINARY) NOT IN (CAST('local' AS BINARY),CAST('r2' AS BINARY)))
  UNION ALL SELECT f.owner_document_id,'NEEDS_REVIEW','NAMESPACE_SHAPE_OR_VERSION_REQUIRES_REVIEW','file',f.file_id FROM file_data f
    WHERE f.registered_namespace_id IS NOT NULL AND (NOT(JSON_EXTRACT(f.safe_descriptor,'$.version')<=>CAST('1' AS JSON))
      OR (f.namespace_provider='r2' AND (COALESCE(JSON_UNQUOTE(JSON_EXTRACT(f.safe_descriptor,'$.account')),'')=''
        OR COALESCE(JSON_UNQUOTE(JSON_EXTRACT(f.safe_descriptor,'$.bucket')),'')=''
        OR COALESCE(JSON_UNQUOTE(JSON_EXTRACT(f.safe_descriptor,'$.endpoint')),'') NOT LIKE 'https://%')))
  UNION ALL SELECT f.owner_document_id,'BLOCKED','BINDING_EVIDENCE_INVALID_JSON_OR_NULL','file',f.file_id FROM file_data f
    WHERE f.bound_file_id IS NOT NULL AND (JSON_VALID(f.evidence)<>1 OR JSON_TYPE(f.safe_evidence)='NULL')
  UNION ALL SELECT f.owner_document_id,'NEEDS_REVIEW','PROVENANCE_EVIDENCE_INCOMPLETE_OR_CHECKSUM_MISMATCH','file',f.file_id FROM file_data f
    WHERE f.bound_file_id IS NOT NULL AND (JSON_TYPE(f.safe_evidence)<>'OBJECT'
      OR NOT(JSON_EXTRACT(f.safe_evidence,'$.version')<=>CAST('1' AS JSON))
      OR COALESCE(JSON_UNQUOTE(JSON_EXTRACT(f.safe_evidence,'$.source')),'')=''
      OR NOT REGEXP_LIKE(COALESCE(JSON_UNQUOTE(JSON_EXTRACT(f.safe_evidence,'$.sha256')),''),'^[a-fA-F0-9]{64}$','c')
      OR NOT REGEXP_LIKE(COALESCE(f.checksum,''),'^[a-fA-F0-9]{64}$','c')
      OR NOT(LOWER(JSON_UNQUOTE(JSON_EXTRACT(f.safe_evidence,'$.sha256')))<=>LOWER(f.checksum))
      OR JSON_TYPE(JSON_EXTRACT(f.safe_evidence,'$.size')) IS NULL
      OR JSON_TYPE(JSON_EXTRACT(f.safe_evidence,'$.size')) NOT IN ('INTEGER','UNSIGNED INTEGER')
      OR NOT(JSON_UNQUOTE(JSON_EXTRACT(f.safe_evidence,'$.size'))<=>CAST(f.file_size AS CHAR)))
  UNION ALL SELECT f.owner_document_id,'BLOCKED','LOCAL_FOLDER_ROOT_IDENTITY_MISSING','file',f.file_id FROM file_data f
    WHERE f.namespace_provider='local' AND (COALESCE(JSON_UNQUOTE(JSON_EXTRACT(f.safe_evidence,'$.localIdentity.rootIdentity')),'')=''
      OR COALESCE(JSON_UNQUOTE(JSON_EXTRACT(f.safe_evidence,'$.localIdentity.identity')),'')='')
  UNION ALL SELECT f.owner_document_id,'NEEDS_REVIEW','LOCAL_PROVIDER_ON_RAILWAY_REQUIRES_RUNTIME_SUPPORT_REVIEW','file',f.file_id FROM file_data f
    WHERE f.namespace_provider='local'
  UNION ALL SELECT f.owner_document_id,'NEEDS_REVIEW','STORAGE_KEY_USES_NORMALIZATION','file',f.file_id FROM file_data f
    WHERE f.file_id IS NOT NULL AND NOT(CAST(f.storage_key AS BINARY)<=>CAST(f.normalized_key AS BINARY))
  UNION ALL SELECT f.owner_document_id,'BLOCKED','SHARED_STORAGE_KEY','file',f.file_id FROM file_data f
    WHERE EXISTS(SELECT 1 FROM keys_normalized other WHERE NOT EXISTS(SELECT 1 FROM file_refs r
      WHERE r.document_id=f.owner_document_id AND r.file_id=other.file_id)
      AND (CAST(other.normalized_key AS BINARY)=CAST(f.normalized_key AS BINARY)
        OR ((f.bound_file_id IS NULL OR f.namespace_provider='local') AND LOWER(other.normalized_key)=LOWER(f.normalized_key))))
  UNION ALL SELECT f.owner_document_id,'BLOCKED','LEGACY_REFERENCE_AMBIGUOUS_RELATIVE_PATH','file',f.file_id FROM file_data f
    WHERE f.relative_path IS NOT NULL AND CHAR_LENGTH(f.relative_path)>0 AND NOT(CAST(REGEXP_REPLACE(REPLACE(f.relative_path,CHAR(92),'/'),
      '^[[:space:]]+|[[:space:]]+$','') AS BINARY)<=>CAST(f.normalized_key AS BINARY))
  UNION ALL SELECT f.owner_document_id,'BLOCKED','LEGACY_REFERENCE_AMBIGUOUS_REVISION_PATH','revision',r.id FROM file_data f
    JOIN document_revisions r ON r.file_id=f.file_id AND r.document_id=f.owner_document_id
    WHERE r.storage_path_legacy IS NOT NULL AND CHAR_LENGTH(r.storage_path_legacy)>0 AND NOT(CAST(REGEXP_REPLACE(REPLACE(r.storage_path_legacy,CHAR(92),'/'),
      '^[[:space:]]+|[[:space:]]+$','') AS BINARY)<=>CAST(f.normalized_key AS BINARY))
  UNION ALL SELECT f.owner_document_id,'BLOCKED','FOLDER_OWNERSHIP_OR_SCOPE_INVALID','file',f.file_id FROM file_data f
    JOIN docs d ON d.id=f.owner_document_id WHERE f.file_id IS NOT NULL AND (
      CHAR_LENGTH(f.normalized_key)-CHAR_LENGTH(REPLACE(f.normalized_key,'/',''))<4
      OR CAST(SUBSTRING_INDEX(f.normalized_key,'/',1) AS BINARY)<>CAST('projects' AS BINARY)
      OR CAST(SUBSTRING_INDEX(SUBSTRING_INDEX(f.normalized_key,'/',3),'/',-1) AS BINARY)<>CAST('documents' AS BINARY)
      OR NOT REGEXP_LIKE(SUBSTRING_INDEX(SUBSTRING_INDEX(f.normalized_key,'/',2),'/',-1),'^[A-Za-z0-9_-]+$','c')
      OR NOT REGEXP_LIKE(SUBSTRING_INDEX(SUBSTRING_INDEX(f.normalized_key,'/',4),'/',-1),'^[A-Za-z0-9_-]+$','c')
      OR NOT(CAST(SUBSTRING_INDEX(SUBSTRING_INDEX(f.normalized_key,'/',4),'/',-1) AS BINARY)<=>CAST(d.document_number AS BINARY)))
  UNION ALL SELECT f.owner_document_id,'NEEDS_REVIEW','STORAGE_PROJECT_CODE_DIFFERS_FROM_CURRENT_PROJECT','file',f.file_id FROM file_data f
    JOIN docs d ON d.id=f.owner_document_id WHERE NOT(CAST(SUBSTRING_INDEX(SUBSTRING_INDEX(f.normalized_key,'/',2),'/',-1) AS BINARY)<=>CAST(d.project_code AS BINARY))
  UNION ALL SELECT d.id,'NEEDS_REVIEW','NO_CURRENT_ACTIVE_ADMIN_WITH_NONEMPTY_FULL_NAME','project',d.project_id FROM docs d
    WHERE NOT EXISTS(SELECT 1 FROM project_memberships m JOIN users u ON u.id=m.user_id
      WHERE m.project_id=d.project_id AND m.status='Active' AND u.status='Active'
        AND CAST(m.official_role AS BINARY)=CAST('Admin' AS BINARY) AND CHAR_LENGTH(u.full_name)>0)
  UNION ALL SELECT d.id,'BLOCKED','EXISTING_DELETE_OPERATION_NOT_FRESH_UAT_CANDIDATE','operation',o.id FROM docs d
    JOIN document_delete_operations o ON o.project_id=d.project_id AND o.document_id=d.id
  UNION ALL SELECT d.id,'BLOCKED','CLOSED_GATE_REQUIRES_OWNER_REVIEW','gate',g.document_id FROM docs d
    JOIN document_admission_coordinators g ON g.project_id=d.project_id AND g.document_id=d.id WHERE g.gate_state<>'OPEN'
  UNION ALL SELECT d.id,IF(w.db_outcome='UNKNOWN' OR w.lifecycle_state='UNRESOLVED','BLOCKED','NEEDS_REVIEW'),
    'WRITER_NOT_SETTLED_AT_SNAPSHOT','writer',w.id FROM docs d JOIN document_writer_operations w ON w.project_id=d.project_id AND w.document_id=d.id
    WHERE w.lifecycle_state<>'SETTLED' OR w.completion_evidence IS NULL OR w.db_outcome NOT IN ('NOT_STARTED','COMMITTED','ROLLED_BACK')
  UNION ALL SELECT d.id,IF(s.state='UNKNOWN','BLOCKED','NEEDS_REVIEW'),'STORAGE_IO_NOT_SETTLED_AT_SNAPSHOT','io step',s.id FROM docs d
    JOIN document_writer_operations w ON w.project_id=d.project_id AND w.document_id=d.id
    JOIN document_storage_io_steps s ON s.writer_id=w.id WHERE s.state<>'SUCCEEDED'
  UNION ALL SELECT d.id,'BLOCKED','TEMPORARY_OWNERSHIP_UNRESOLVED','temporary upload',t.id FROM docs d
    JOIN document_writer_operations w ON w.project_id=d.project_id AND w.document_id=d.id
    JOIN temporary_uploads t ON t.temporary_file_id=w.temporary_file_id
),
assessment AS (
  SELECT d.id,d.project_id,d.document_number,
    CASE WHEN EXISTS(SELECT 1 FROM global_findings WHERE classification='BLOCKED')
        OR EXISTS(SELECT 1 FROM findings f WHERE f.document_id=d.id AND f.classification='BLOCKED') THEN 'BLOCKED'
      WHEN EXISTS(SELECT 1 FROM global_findings WHERE classification='UNVERIFIED') THEN 'UNVERIFIED'
      WHEN EXISTS(SELECT 1 FROM global_findings WHERE classification='NEEDS_REVIEW')
        OR EXISTS(SELECT 1 FROM findings f WHERE f.document_id=d.id AND f.classification='NEEDS_REVIEW') THEN 'NEEDS_REVIEW'
      ELSE 'READY_CANDIDATE' END AS classification,
    (SELECT COUNT(*) FROM file_refs r WHERE r.document_id=d.id) AS file_count,
    (SELECT COUNT(*) FROM document_revisions r WHERE r.document_id=d.id) AS revision_count,
    (SELECT COUNT(*) FROM workflow_attachments a WHERE a.document_id=d.id) AS attachment_count,
    (SELECT COUNT(*) FROM findings f WHERE f.document_id=d.id) AS finding_count
  FROM docs d
),
output_rows AS (
  SELECT 'SUMMARY' section,a.classification,CAST(NULL AS CHAR(64)) project_id,CAST(NULL AS CHAR(64)) document_id,
    CAST(NULL AS CHAR(255)) document_number,'cohort' object_type,CAST(NULL AS CHAR(128)) object_id,
    'ALL_DOCUMENTS_HISTORICAL_COHORT_UNVERIFIED' reason,CONCAT('documents=',COUNT(*)) details
  FROM assessment a GROUP BY a.classification
  UNION ALL SELECT 'GLOBAL_FINDING',g.classification,NULL,NULL,NULL,g.object_type,g.object_id,g.reason,
    'Applies to candidate selection; metadata visibility and source inventory rules must be reviewed' FROM global_findings g
  UNION ALL SELECT 'DOCUMENT',a.classification,a.project_id,a.id,a.document_number,'document',a.id,
    IF(a.classification='READY_CANDIDATE','METADATA_ONLY_UAT_SHORTLIST_NOT_DELETE_AUTHORIZATION','SEE_GLOBAL_AND_DOCUMENT_FINDINGS'),
    CONCAT('files=',a.file_count,'; revisions=',a.revision_count,'; attachments=',a.attachment_count,'; findings=',a.finding_count,
      '; R2/runtime/locks=UNVERIFIED; historical_cohort=UNVERIFIED') FROM assessment a
  UNION ALL SELECT 'FINDING',f.classification,d.project_id,f.document_id,d.document_number,f.object_type,f.object_id,f.reason,
    'Source-based metadata observation; no corrective action executed' FROM findings f JOIN docs d ON d.id=f.document_id
)
SELECT section,classification,CONVERT(project_id USING utf8mb4) AS project_id,
  CONVERT(document_id USING utf8mb4) AS document_id,document_number,object_type,
  CONVERT(object_id USING utf8mb4) AS object_id,reason,details
FROM output_rows ORDER BY FIELD(section,'SUMMARY','GLOBAL_FINDING','DOCUMENT','FINDING'),
  FIELD(classification,'BLOCKED','NEEDS_REVIEW','UNVERIFIED','READY_CANDIDATE'),project_id,document_number,object_type,object_id,reason;

-- 06 / Orphan metadata is reported independently of surviving document candidates.
-- A completed Delete intentionally retains technical evidence and is NOT an orphan
-- merely because its original document no longer exists (see section 07).
WITH orphans AS (
  SELECT 'revision' object_type,r.id object_id,r.project_id,r.document_id,
    'REVISION_DOCUMENT_MISSING' reason FROM document_revisions r LEFT JOIN engineering_documents d ON d.id=r.document_id WHERE d.id IS NULL
  UNION ALL SELECT 'attachment',a.attachment_id,a.project_id,a.document_id,'ATTACHMENT_DOCUMENT_OR_COMMENT_MISSING'
    FROM workflow_attachments a LEFT JOIN engineering_documents d ON d.id=a.document_id
    LEFT JOIN workflow_comments c ON c.id=a.comment_id WHERE d.id IS NULL OR c.id IS NULL
  UNION ALL SELECT 'comment',c.id,c.project_id,c.document_id,'COMMENT_DOCUMENT_MISSING'
    FROM workflow_comments c LEFT JOIN engineering_documents d ON d.id=c.document_id WHERE d.id IS NULL
  UNION ALL SELECT 'receipt',r.id,r.project_id,r.document_id,'RECEIPT_DOCUMENT_OR_COMMENT_MISSING'
    FROM comment_read_receipts r LEFT JOIN engineering_documents d ON d.id=r.document_id
    LEFT JOIN workflow_comments c ON c.id=r.comment_id WHERE d.id IS NULL OR c.id IS NULL
  UNION ALL SELECT 'file',f.file_id,f.project_id,f.document_id,'FILE_OWNER_DOCUMENT_MISSING'
    FROM stored_files f LEFT JOIN engineering_documents d ON d.id=f.document_id WHERE f.document_id IS NOT NULL AND d.id IS NULL
  UNION ALL SELECT 'file',f.file_id,f.project_id,f.document_id,'FILE_HAS_NO_DOCUMENT_REVISION_ATTACHMENT_REFERENCE'
    FROM stored_files f WHERE f.document_id IS NULL
      AND NOT EXISTS(SELECT 1 FROM engineering_documents d WHERE d.active_file_id=f.file_id)
      AND NOT EXISTS(SELECT 1 FROM document_revisions r WHERE r.file_id=f.file_id)
      AND NOT EXISTS(SELECT 1 FROM workflow_attachments a WHERE a.file_id=f.file_id)
  UNION ALL SELECT 'binding',b.file_id,NULL,NULL,'BINDING_FILE_OR_NAMESPACE_MISSING'
    FROM stored_file_namespace_bindings b LEFT JOIN stored_files f ON f.file_id=b.file_id
    LEFT JOIN storage_namespaces n ON n.id=b.namespace_id WHERE f.file_id IS NULL OR n.id IS NULL
  UNION ALL SELECT 'execution',e.operation_id,NULL,NULL,'EXECUTION_OPERATION_MISSING'
    FROM document_delete_executions e LEFT JOIN document_delete_operations o ON o.id=e.operation_id WHERE o.id IS NULL
  UNION ALL SELECT 'manifest',m.id,NULL,NULL,'MANIFEST_OPERATION_MISSING'
    FROM document_delete_file_manifest m LEFT JOIN document_delete_operations o ON o.id=m.delete_operation_id WHERE o.id IS NULL
  UNION ALL SELECT 'attempt',a.attempt_id,NULL,NULL,'ATTEMPT_MANIFEST_MISSING'
    FROM document_delete_attempts a LEFT JOIN document_delete_file_manifest m ON m.id=a.manifest_id WHERE m.id IS NULL
  UNION ALL SELECT 'io step',s.id,NULL,NULL,'IO_WRITER_MISSING'
    FROM document_storage_io_steps s LEFT JOIN document_writer_operations w ON w.id=s.writer_id WHERE w.id IS NULL
)
SELECT '06_orphan_review' section,'NEEDS_REVIEW' classification,o.* FROM orphans o ORDER BY object_type,object_id;

-- 07 / Existing operation details. Never retry/reserve/reset from this output.
-- Manifest digest is a SHA-256 over JS serialization of the sorted full manifest;
-- SQL does not pretend to reconstruct that encoding. It stays UNVERIFIED.
SELECT '07_existing_operations' section,o.project_id,o.document_id,o.id operation_id,o.status AS reservation_status,
  e.phase,d.id IS NOT NULL AS document_still_exists,g.gate_state,g.delete_operation_id AS gate_operation_id,
  e.pending_reason,JSON_VALID(o.pending_metadata) AS pending_metadata_json_valid,
  JSON_VALID(e.inventory) AS inventory_json_valid,JSON_VALID(e.completion_snapshot) AS completion_snapshot_json_valid,
  CASE WHEN e.phase='COMPLETED' AND d.id IS NULL AND JSON_VALID(e.completion_snapshot)=1
      THEN 'NEEDS_REVIEW - COMPLETED EVIDENCE RETAINED; NOT A FRESH UAT CANDIDATE'
    WHEN e.phase='COMPLETED' THEN 'BLOCKED - COMPLETION/DOCUMENT INCONSISTENCY'
    WHEN d.id IS NULL THEN 'BLOCKED - DOCUMENT_MISSING_WITHOUT_COMPLETION'
    WHEN g.gate_state IS NULL OR g.gate_state<>'CLOSED' OR NOT(CAST(g.delete_operation_id AS BINARY)<=>CAST(o.id AS BINARY))
      THEN 'BLOCKED - DELETE_GATE_INVALID'
    WHEN EXISTS(SELECT 1 FROM document_delete_attempts a JOIN document_delete_file_manifest m ON m.id=a.manifest_id
      WHERE m.delete_operation_id=o.id AND a.state IN ('UNKNOWN','IN_FLIGHT'))
      THEN 'BLOCKED - STORAGE_OUTCOME_UNRESOLVED'
    WHEN e.phase IS NOT NULL AND JSON_VALID(e.inventory)<>1 THEN 'BLOCKED - INVENTORY_JSON_INVALID'
    WHEN e.phase='MANIFEST_FINALIZED' AND JSON_EXTRACT(IF(JSON_VALID(e.inventory),e.inventory,'{}'),'$.folderCleanup') IS NULL
      THEN 'BLOCKED - FOLDER_PROVENANCE_REQUIRED'
    ELSE 'NEEDS_REVIEW - EXISTING NONTERMINAL OPERATION; NO AUTOMATIC RETRY' END AS classification,
  (SELECT COUNT(*) FROM document_delete_file_manifest m WHERE m.delete_operation_id=o.id) AS manifest_rows,
  (SELECT COUNT(*) FROM document_delete_file_manifest m WHERE m.delete_operation_id=o.id AND m.cleanup_state<>'DELETED') AS manifest_not_deleted,
  (SELECT COUNT(*) FROM document_delete_attempts a JOIN document_delete_file_manifest m ON m.id=a.manifest_id
    WHERE m.delete_operation_id=o.id AND a.state IN ('UNKNOWN','IN_FLIGHT')) AS unresolved_attempts,
  (SELECT COUNT(*) FROM document_delete_file_manifest m WHERE m.delete_operation_id=o.id AND
    (NOT(CAST(m.storage_key_hash AS BINARY)<=>CAST(SHA2(m.exact_storage_key,256) AS BINARY)) OR JSON_VALID(m.ownership_evidence)<>1)) AS manifest_hash_or_json_mismatches,
  JSON_UNQUOTE(JSON_EXTRACT(IF(JSON_VALID(e.inventory),e.inventory,'{}'),'$.folderCleanup.state')) AS folder_cleanup_state,
  'UNVERIFIED - JS MANIFEST/INVENTORY DIGEST, LIVE LOCK, PROVIDER OUTCOME AND PHYSICAL FILES' AS runtime_checks
FROM document_delete_operations o LEFT JOIN engineering_documents d ON d.id=o.document_id AND d.project_id=o.project_id
LEFT JOIN document_delete_executions e ON e.operation_id=o.id
LEFT JOIN document_admission_coordinators g ON g.project_id=o.project_id AND g.document_id=o.document_id
ORDER BY o.project_id,o.document_id,o.created_at;

-- 08 / Mandatory limits: these are not converted to PASS by metadata presence.
SELECT '08_external_checks' section,'UNVERIFIED' classification,
  'No trustworthy historical cutoff; owner must identify the historical cohort. READY_CANDIDATE covers only reviewed SQL metadata. Current runtime namespace must match the exact stored descriptor/digest. R2 object existence, bytes/checksum, unknown keys/markers below each prefix, list completeness, access permissions, live writer/worker locks, JS manifest/plan serialization and the actual initiating Admin must be checked separately. Missing checksum/provisional evidence is a review finding: the current R2 Delete path does not itself prove content integrity. No Delete, backfill, migration or R2 operation is authorized.' AS details;
