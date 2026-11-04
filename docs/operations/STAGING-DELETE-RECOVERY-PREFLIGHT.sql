-- STAGING PERMANENT DELETE RECOVERY / READ-ONLY PREFLIGHT / 2026-11-04
-- Target: Railway 'staging' ONLY. 'production' is EDMS Development;
-- 'real_production' is explicitly excluded. A schema named railway proves no environment.
-- Execute in a dedicated DBeaver Staging connection, under verified maintenance.
-- Statements here are SELECT/SHOW only. No session variables, locks or writes.
-- Save ALL result sets. Re-run if any writer/DDL/operator activity occurs.
-- This file checks metadata, NOT physical R2 content or deployed backend guards.
-- Never treat a displayed metadata checksum as proof of the current object SHA-256.
-- Deployment order: approve/deploy prevention+cancellation guards separately;
-- stop/remove every old worker; establish maintenance and backup; run this file;
-- externally verify ALL exact R2 files; obtain owner approval; only then APPLY.
-- All apply inputs default NULL. No permission to run APPLY is implied by this file.
-- MySQL 8.0.16+ only; recursive hash chain fails rather than truncates at server limits.
-- Collation compatibility: string comparisons use CAST(... AS BINARY), including
-- JSON_TABLE/CTE joins. This is byte-exact and changes no stored collation/data.

-- 01: independently match Railway environment/service and this server UUID.
SELECT DATABASE() AS database_name,VERSION() AS mysql_version,@@version_comment AS engine,
  @@server_uuid AS server_uuid,@@hostname AS server_hostname,@@port AS server_port,
  CONNECTION_ID() AS connection_id,@@autocommit AS autocommit,@@session.sql_mode AS sql_mode,
  @@cte_max_recursion_depth AS snapshot_row_limit,UTC_TIMESTAMP(3) AS observed_utc;
SHOW GRANTS;

-- 02: exact target matrix. Any missing row, nonzero evidence count or prior marker => STOP.
WITH targets AS (
  SELECT j.* FROM JSON_TABLE('[{"seq":1,"documentNumber":"COBA-1","documentId":"DOC-PID-5f6ea1c2-3f53-432d-a0e5-f738be2911b0","operationId":"d1b06c71-ccf1-4d85-abbb-9f7f61a5d197","projectId":"PRJ-5cd0a5a3-3ce6-4cf2-b297-73e6ee9e520c"},{"seq":2,"documentNumber":"PROJECT-1","documentId":"DOC-PID-2fe931bb-dac7-4c90-afa9-3addf4351e1f","operationId":"86135cc8-923b-451a-abb3-4a21729cba4c","projectId":"PRJ-5cd0a5a3-3ce6-4cf2-b297-73e6ee9e520c"},{"seq":3,"documentNumber":"PROJECT-2","documentId":"DOC-PID-e2823245-4e10-47d4-bc91-14254f05cd9f","operationId":"012e8f62-a55a-4b2f-bbbb-f7f95e95bf0b","projectId":"PRJ-5cd0a5a3-3ce6-4cf2-b297-73e6ee9e520c"}]', '$[*]' COLUMNS (
    seq INT PATH '$.seq', documentNumber VARCHAR(255) PATH '$.documentNumber',
    documentId VARCHAR(64) PATH '$.documentId', operationId VARCHAR(64) PATH '$.operationId',
    projectId VARCHAR(64) PATH '$.projectId'
  )) AS j
)
SELECT t.*,p.project_code,d.workflow_status,d.revision_label,d.lifecycle_status,
  d.active_file_id,d.active_revision_id,c.gate_state,c.generation,c.delete_operation_id,
  o.status AS operation_status,o.document_number_snapshot,o.pending_metadata,
  (SELECT COUNT(*) FROM document_delete_executions e WHERE CAST(e.operation_id AS BINARY)=CAST(t.operationId AS BINARY)) AS executions,
  (SELECT COUNT(*) FROM document_delete_file_manifest m WHERE CAST(m.delete_operation_id AS BINARY)=CAST(t.operationId AS BINARY)) AS manifests,
  (SELECT COUNT(*) FROM document_delete_attempts a JOIN document_delete_file_manifest m ON CAST(m.id AS BINARY)=CAST(a.manifest_id AS BINARY) WHERE CAST(m.delete_operation_id AS BINARY)=CAST(t.operationId AS BINARY)) AS attempts,
  (SELECT COUNT(*) FROM document_writer_operations w WHERE CAST(w.project_id AS BINARY)=CAST(t.projectId AS BINARY) AND CAST(w.document_id AS BINARY)=CAST(t.documentId AS BINARY)) AS writers,
  (SELECT COUNT(*) FROM document_storage_io_steps s JOIN document_writer_operations w ON CAST(w.id AS BINARY)=CAST(s.writer_id AS BINARY) WHERE CAST(w.project_id AS BINARY)=CAST(t.projectId AS BINARY) AND CAST(w.document_id AS BINARY)=CAST(t.documentId AS BINARY)) AS storage_io,
  CASE WHEN d.id IS NULL OR o.id IS NULL OR c.document_id IS NULL OR p.id IS NULL THEN 'STOP - TARGET MISSING'
    WHEN NOT (CAST(d.project_id AS BINARY)=CAST(t.projectId AS BINARY) AND CAST(d.document_number AS BINARY)=CAST(t.documentNumber AS BINARY)
      AND CAST(o.project_id AS BINARY)=CAST(t.projectId AS BINARY) AND CAST(o.document_id AS BINARY)=CAST(t.documentId AS BINARY)
      AND CAST(o.document_number_snapshot AS BINARY)=CAST(t.documentNumber AS BINARY)) THEN 'STOP - TARGET MISMATCH'
    WHEN CAST(c.gate_state AS BINARY)<>CAST('CLOSED' AS BINARY) OR NOT (CAST(c.delete_operation_id AS BINARY)<=>CAST(o.id AS BINARY)) OR CAST(o.status AS BINARY)<>CAST('QUIESCENCE_CONFIRMED' AS BINARY) THEN 'STOP - STATE MISMATCH'
    WHEN o.pending_metadata IS NOT NULL AND JSON_VALID(o.pending_metadata)=0 THEN 'STOP - INVALID METADATA'
    ELSE 'REVIEW COUNTS / FILES / SNAPSHOT / EXTERNAL EVIDENCE' END AS target_assessment
FROM targets t LEFT JOIN projects p ON CAST(p.id AS BINARY)=CAST(t.projectId AS BINARY)
LEFT JOIN engineering_documents d ON CAST(d.id AS BINARY)=CAST(t.documentId AS BINARY)
LEFT JOIN document_admission_coordinators c ON CAST(c.project_id AS BINARY)=CAST(t.projectId AS BINARY) AND CAST(c.document_id AS BINARY)=CAST(t.documentId AS BINARY)
LEFT JOIN document_delete_operations o ON CAST(o.id AS BINARY)=CAST(t.operationId AS BINARY) ORDER BY t.seq;

-- 03: full file inventory (direct, active, revisions and attachments).
-- Check each key against the VERIFIED Staging R2 account/endpoint/bucket externally.
-- Download/read every object and compare exact key, bytes, size and full SHA-256.
-- Missing historical checksum => STOP; no fallback is authorized in APPLY.
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
SELECT t.documentNumber,i.file_id,f.project_id,f.document_id,f.file_category,
  f.original_file_name,f.storage_key,f.relative_path,f.file_size,f.checksum,f.uploaded_at,
  (CAST(f.file_id AS BINARY)=CAST(d.active_file_id AS BINARY)) AS active_file,b.namespace_id,b.storage_key_snapshot,
  n.provider,n.descriptor AS bound_namespace_descriptor,
  CASE WHEN f.file_id IS NULL THEN 'STOP - FILE REFERENCE MISSING'
    WHEN f.checksum IS NULL OR NOT REGEXP_LIKE(f.checksum,'^[0-9A-Fa-f]{64}$','c') THEN 'STOP - HISTORICAL CHECKSUM REQUIRED'
    WHEN CAST(f.project_id AS BINARY)<>CAST(t.projectId AS BINARY) OR NOT (CAST(f.document_id AS BINARY)<=>CAST(t.documentId AS BINARY)) THEN 'STOP - FILE OWNERSHIP'
    ELSE 'SQL METADATA ONLY - R2 NOT VERIFIED' END AS evidence_assessment
FROM targets t JOIN file_ids i ON CAST(i.documentId AS BINARY)=CAST(t.documentId AS BINARY)
LEFT JOIN engineering_documents d ON CAST(d.id AS BINARY)=CAST(t.documentId AS BINARY) LEFT JOIN stored_files f ON CAST(f.file_id AS BINARY)=CAST(i.file_id AS BINARY)
LEFT JOIN stored_file_namespace_bindings b ON CAST(b.file_id AS BINARY)=CAST(i.file_id AS BINARY)
LEFT JOIN storage_namespaces n ON CAST(n.id AS BINARY)=CAST(b.namespace_id AS BINARY) ORDER BY t.seq,i.file_id;

-- 04: unreviewed triggers can write outside the allowlist; APPLY rejects them.
SELECT TRIGGER_NAME,EVENT_OBJECT_TABLE,ACTION_TIMING,EVENT_MANIPULATION
FROM information_schema.TRIGGERS WHERE CAST(TRIGGER_SCHEMA AS BINARY)=CAST(DATABASE() AS BINARY)
AND EVENT_OBJECT_TABLE IN ('document_delete_operations','document_admission_coordinators','audit_trail');
SELECT TABLE_NAME,ENGINE FROM information_schema.TABLES WHERE CAST(TABLE_SCHEMA AS BINARY)=CAST(DATABASE() AS BINARY)
AND TABLE_NAME IN ('projects','engineering_documents','stored_files','document_revisions','workflow_comments','workflow_attachments','document_history','comment_read_receipts','document_sla_evaluations','document_admission_coordinators','document_delete_operations','storage_namespaces','stored_file_namespace_bindings','audit_trail','users','project_memberships');
SELECT ROUTINE_NAME FROM information_schema.ROUTINES WHERE CAST(ROUTINE_SCHEMA AS BINARY)=CAST(DATABASE() AS BINARY)
AND CAST(ROUTINE_NAME AS BINARY)=CAST('edms_staging_recovery_3_20261104' AS BINARY);
-- Existing routine name => STOP, inspect it; never overwrite an unknown routine.

-- 05: approved snapshot input. This hashes all canonical columns of the scoped
-- business rows and the coordinator/operation rows separately. No GROUP_CONCAT
-- truncation: recursion-limit errors are STOP, never evidence PASS.
-- JSON output is an INPUT for review, not automatic approval or an R2 proof.
-- Retain reviewed_utc + approval_snapshot_json for APPLY (five-minute freshness).
-- Run under the same stable maintenance as external object verification.
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

SELECT UTC_TIMESTAMP(3) AS reviewed_utc,COUNT(*) AS exact_snapshot_targets,
  JSON_ARRAYAGG(JSON_OBJECT('documentId',t.documentId,'operationId',t.operationId,
    'businessDigest',f.businessDigest,'controlDigest',f.controlDigest,'generation',c.generation)) AS approval_snapshot_json,
  'UNVERIFIED - EXTERNAL R2 AND DEPLOYED GUARDS REQUIRE OPERATOR VERIFICATION' AS live_evidence
FROM targets t JOIN fingerprints f ON CAST(f.documentId AS BINARY)=CAST(t.documentId AS BINARY)
JOIN document_admission_coordinators c ON CAST(c.project_id AS BINARY)=CAST(t.projectId AS BINARY) AND CAST(c.document_id AS BINARY)=CAST(t.documentId AS BINARY);
-- Expect exactly 3 entries, non-NULL digests. No SQL result here means READY by itself.
