-- Targeted Approved Revision History audit. MySQL 9.7.4 / DBeaver.
-- READ-ONLY: no application calls, storage access, session changes or repair.
-- Owner verifies connection identity. Select the Railway Development schema first.
-- STOP on any SQL error. Missing results are NOT a successful audit.
-- A document number is project-scoped, NOT a primary key. Audit ALL exact matches;
-- RS02 exposes multiple projects. Always retain project_id + document_id in CSV.
-- Snapshot NULL is expected for some historical rows; it is NOT proof of data loss.
-- AS-Built (workflow/storage) normalizes to As-Built (history display).
-- Current status, mutable revision_label and storage paths do NOT prove stage at upload.
-- This script exposes resolver inputs, NOT a parallel implementation of its algorithm.
-- Resolver requires actor-scoped bijections, strict sequence/order, revision windows,
-- unique history timestamps and preceding transitions when snapshots are unavailable.
-- Comments use explicit UTC in API; revision/history ordering uses the existing
-- database clock. Never correlate these clocks by nearest timestamp.
-- No physical R2 object or deployed commit is verified by SQL.
-- Run all result sets during a quiet window; separate SELECTs are not an atomic snapshot.
-- Sources: document.service.js:listDocumentRevisions; document.repository.js:
-- listDocumentRevisions/listApprovalRevisionEvents/listDocumentHistory;
-- utils/revisionHistoryStage.js:resolveRevisionHistoryStages.
-- A missing Approval A comment is not reconstructed as a new event by the resolver.
-- Export RS02..RS09, retaining NULLs, IDs, exact text and millisecond timestamps.

-- RS01: identity evidence only, owner must verify Development connection.
SELECT 'RS01_IDENTITY' AS result_set,DATABASE() AS selected_schema,VERSION() AS version,
  @@server_uuid AS server_uuid,@@hostname AS hostname,@@port AS port,
  @@session.sql_mode AS sql_mode,@@session.time_zone AS session_time_zone,
  'PENDING DATABASE EVIDENCE: owner must verify environment identity' AS audit_status;

-- RS02: exact number -> all internal IDs, including missing/ambiguous number matches.
WITH target_numbers(document_number) AS (
  SELECT 'PFD-EDMS-0003' UNION ALL SELECT 'PFD-EDMS-0004'
  UNION ALL SELECT 'PID-EDMS-0002' UNION ALL SELECT 'PID-EDMS-0001'
), targets AS (
  SELECT d.* FROM engineering_documents d JOIN target_numbers n
    ON CAST(d.document_number AS BINARY)=CAST(n.document_number AS BINARY)
)
SELECT 'RS02_TARGET_MAPPING' AS result_set,n.document_number,
  d.id AS document_id,d.project_id,d.workflow_status,d.revision_label AS current_submission,
  d.lifecycle_status,d.active_revision_id,d.active_file_id,d.created_at,d.updated_at,
  COUNT(d.id) OVER (PARTITION BY n.document_number) AS number_matches_across_projects,
  CASE WHEN d.id IS NULL THEN 'NOT_FOUND'
    WHEN COUNT(d.id) OVER (PARTITION BY n.document_number)>1 THEN 'MULTIPLE_PROJECT_MATCHES_REVIEW'
    ELSE 'FOUND' END AS mapping_status
FROM target_numbers n LEFT JOIN targets d ON CAST(d.document_number AS BINARY)=CAST(n.document_number AS BINARY)
ORDER BY n.document_number,d.project_id,d.id;

-- RS03: document summary; explicit evidence counts, never inferred stages.
WITH target_numbers(document_number) AS (
  SELECT 'PFD-EDMS-0003' UNION ALL SELECT 'PFD-EDMS-0004'
  UNION ALL SELECT 'PID-EDMS-0002' UNION ALL SELECT 'PID-EDMS-0001'
), targets AS (
  SELECT d.* FROM engineering_documents d JOIN target_numbers n
    ON CAST(d.document_number AS BINARY)=CAST(n.document_number AS BINARY)
)
SELECT 'RS03_DOCUMENT_SUMMARY' AS result_set,d.document_number,d.id AS document_id,d.project_id,
  d.workflow_status,d.revision_label AS current_submission,d.lifecycle_status,d.active_revision_id,d.active_file_id,
  IF(CAST(d.workflow_status AS BINARY)=CAST('Approved' AS BINARY),'CONFIRMED','NOT_APPROVED') AS approved_state,
  (SELECT COUNT(*) FROM document_revisions r WHERE r.document_id=d.id AND r.project_id=d.project_id) AS revision_count,
  (SELECT COUNT(*) FROM document_revisions r WHERE r.document_id=d.id AND r.project_id=d.project_id
    AND CAST(r.upload_stage_snapshot AS BINARY) IN (CAST('As-Built' AS BINARY),CAST('AS-Built' AS BINARY))) AS explicit_as_built_uploads,
  (SELECT COUNT(*) FROM workflow_comments c WHERE c.document_id=d.id AND c.project_id=d.project_id
    AND CAST(c.workflow_action AS BINARY)=CAST('Approval A' AS BINARY)) AS approval_a_comments,
  (SELECT COUNT(*) FROM document_history h WHERE h.document_id=d.id AND h.project_id=d.project_id
    AND CAST(h.workflow_event AS BINARY)=CAST('Approval A Completed' AS BINARY)
    AND CAST(h.activity AS BINARY)=CAST('Approval A' AS BINARY)
    AND CAST(h.workflow_status AS BINARY)=CAST('Approved' AS BINARY)) AS approval_a_completed_to_approved,
  (SELECT COUNT(*) FROM stored_files f WHERE f.document_id=d.id AND f.project_id=d.project_id
    AND (LOCATE(CAST('/revisions/AS-Built/' AS BINARY),CAST(f.storage_key AS BINARY))>0
      OR LOCATE(CAST('/revisions/AS-Built/' AS BINARY),CAST(f.relative_path AS BINARY))>0)) AS as_built_path_metadata_only,
  CASE WHEN ar.id IS NULL THEN 'UNVERIFIED_ACTIVE_REVISION_MISSING'
    WHEN NOT (CAST(ar.project_id AS BINARY)<=>CAST(d.project_id AS BINARY))
      OR NOT (CAST(ar.document_id AS BINARY)<=>CAST(d.id AS BINARY))
      OR NOT (CAST(ar.file_id AS BINARY)<=>CAST(d.active_file_id AS BINARY)) THEN 'ACTIVE_POINTER_SCOPE_MISMATCH'
    WHEN af.file_id IS NULL THEN 'UNVERIFIED_ACTIVE_FILE_METADATA_MISSING'
    WHEN NOT (CAST(af.project_id AS BINARY)<=>CAST(d.project_id AS BINARY))
      OR NOT (CAST(af.document_id AS BINARY)<=>CAST(d.id AS BINARY)) THEN 'ACTIVE_FILE_SCOPE_MISMATCH'
    ELSE 'ACTIVE_POINTER_METADATA_MATCH' END AS active_pointer_check
FROM targets d LEFT JOIN document_revisions ar ON ar.id=d.active_revision_id
LEFT JOIN stored_files af ON af.file_id=d.active_file_id ORDER BY d.project_id,d.document_number;

-- RS04: every revision; snapshot is authoritative, mutable labels are diagnostics.
WITH target_numbers(document_number) AS (
  SELECT 'PFD-EDMS-0003' UNION ALL SELECT 'PFD-EDMS-0004'
  UNION ALL SELECT 'PID-EDMS-0002' UNION ALL SELECT 'PID-EDMS-0001'
), targets AS (
  SELECT d.* FROM engineering_documents d JOIN target_numbers n
    ON CAST(d.document_number AS BINARY)=CAST(n.document_number AS BINARY)
)
SELECT 'RS04_REVISIONS' AS result_set,d.document_number,d.id AS document_id,d.project_id,
  r.id AS revision_id,r.project_id AS revision_project_id,r.revision_label,r.revision_sequence,
  r.upload_stage_snapshot,r.uploaded_by_username_snapshot,r.uploaded_by_role_snapshot,
  r.source_status,r.result_status,r.created_at,r.created_by_user_id,r.file_id,r.is_active,
  r.storage_path_legacy,r.active_document_id,
  LEAD(r.created_at) OVER (PARTITION BY d.id ORDER BY r.revision_sequence,r.id) AS next_revision_created_at,
  COUNT(*) OVER (PARTITION BY d.id,r.created_at) AS revisions_at_same_timestamp,
  ROW_NUMBER() OVER (PARTITION BY d.id ORDER BY r.revision_sequence,r.id) AS expected_contiguous_sequence,
  CASE WHEN CAST(r.upload_stage_snapshot AS BINARY)=CAST('AS-Built' AS BINARY) THEN 'As-Built'
    WHEN CAST(r.upload_stage_snapshot AS BINARY) IN (CAST('IFR-Submitted' AS BINARY),CAST('IFA-Submitted' AS BINARY),CAST('As-Built' AS BINARY))
      THEN r.upload_stage_snapshot ELSE NULL END AS resolver_snapshot_candidate_stage,
  CASE WHEN r.upload_stage_snapshot IS NULL THEN 'UNVERIFIED: inspect raw history; NULL alone is not DATA_MISSING'
    WHEN CAST(r.upload_stage_snapshot AS BINARY) IN (CAST('IFR-Submitted' AS BINARY),CAST('IFA-Submitted' AS BINARY),CAST('As-Built' AS BINARY),CAST('AS-Built' AS BINARY))
      THEN 'VALID_SNAPSHOT: resolver short-circuits historical reconstruction'
    ELSE 'UNVERIFIED: invalid snapshot requires historical evidence' END AS resolver_evidence_source,
  (r.id=d.active_revision_id AND r.file_id=d.active_file_id) AS active_pointer_candidate
FROM targets d JOIN document_revisions r ON r.document_id=d.id
ORDER BY d.project_id,d.document_number,r.revision_sequence,r.id;

-- RS05: all owned file metadata PLUS any files referenced by target revisions/pointer.
-- Includes unlinked owned files and out-of-scope references; paths are NOT R2 evidence.
WITH target_numbers(document_number) AS (
  SELECT 'PFD-EDMS-0003' UNION ALL SELECT 'PFD-EDMS-0004'
  UNION ALL SELECT 'PID-EDMS-0002' UNION ALL SELECT 'PID-EDMS-0001'
), targets AS (
  SELECT d.* FROM engineering_documents d JOIN target_numbers n
    ON CAST(d.document_number AS BINARY)=CAST(n.document_number AS BINARY)
)
SELECT 'RS05_STORED_FILES' AS result_set,d.document_number,d.id AS document_id,d.project_id,
  f.file_id,f.document_id AS file_document_id,f.project_id AS file_project_id,
  f.original_file_name,f.physical_file_name,f.storage_key,f.relative_path,f.file_category,
  f.is_active,f.uploaded_at,f.uploaded_by_user_id,f.file_size,f.checksum,
  (f.file_id=d.active_file_id) AS matches_active_file_pointer,
  (SELECT COUNT(*) FROM document_revisions r WHERE r.document_id=d.id AND r.project_id=d.project_id AND r.file_id=f.file_id) AS linked_revision_count,
  CASE WHEN CAST(f.project_id AS BINARY)=CAST(d.project_id AS BINARY) AND CAST(f.document_id AS BINARY)=CAST(d.id AS BINARY)
    THEN 'OWNERSHIP_METADATA_MATCH' ELSE 'OWNERSHIP_METADATA_MISMATCH' END AS scope_check,
  'UNVERIFIED: SQL cannot inspect physical R2 objects' AS physical_object_status
FROM targets d JOIN stored_files f ON
  (f.document_id=d.id AND f.project_id=d.project_id) OR f.file_id=d.active_file_id
  OR EXISTS(SELECT 1 FROM document_revisions r WHERE r.document_id=d.id AND r.file_id=f.file_id)
ORDER BY d.project_id,d.document_number,f.uploaded_at,f.file_id;

-- RS06: Approval A/B/C raw comments, including events excluded by repository INNER JOIN.
WITH target_numbers(document_number) AS (
  SELECT 'PFD-EDMS-0003' UNION ALL SELECT 'PFD-EDMS-0004'
  UNION ALL SELECT 'PID-EDMS-0002' UNION ALL SELECT 'PID-EDMS-0001'
), targets AS (
  SELECT d.* FROM engineering_documents d JOIN target_numbers n
    ON CAST(d.document_number AS BINARY)=CAST(n.document_number AS BINARY)
)
SELECT 'RS06_WORKFLOW_COMMENTS' AS result_set,d.document_number,d.id AS document_id,d.project_id,
  c.id AS comment_id,c.project_id AS comment_project_id,c.revision_id,c.workflow_action,
  c.created_at,DATE_FORMAT(c.created_at,'%Y-%m-%d %H:%i:%s.%f') AS api_timestamp_utc_input,
  c.created_by_user_id,c.created_by_username_snapshot,c.created_by_name_snapshot,
  c.created_by_official_role_snapshot,c.approval_target_stage_snapshot,c.workflow_comment,
  r.document_id AS associated_revision_document_id,r.project_id AS associated_revision_project_id,r.file_id AS revision_file_id,
  CASE WHEN CAST(c.workflow_action AS BINARY)<>CAST('Approval A' AS BINARY) THEN 'NOT_AN_APPROVAL_A_EVENT'
    WHEN r.id IS NULL OR NOT (CAST(r.document_id AS BINARY)<=>CAST(c.document_id AS BINARY))
      OR NOT (CAST(r.project_id AS BINARY)<=>CAST(c.project_id AS BINARY)) THEN 'EXCLUDED_BY_REVISION_SCOPE_JOIN'
    WHEN NOT (CAST(c.project_id AS BINARY)<=>CAST(d.project_id AS BINARY)) THEN 'EXCLUDED_BY_PROJECT_SCOPE'
    ELSE 'ELIGIBLE_APPROVAL_A_EVENT: final stage still requires resolver' END AS event_projection_eligibility,
  CASE WHEN CAST(c.approval_target_stage_snapshot AS BINARY)=CAST('AS-Built' AS BINARY) THEN 'As-Built'
    WHEN CAST(c.approval_target_stage_snapshot AS BINARY) IN (CAST('IFA-Submitted' AS BINARY),CAST('As-Built' AS BINARY))
      THEN c.approval_target_stage_snapshot ELSE NULL END AS normalized_snapshot_stage,
  'UNVERIFIED without running actual backend resolver; no historical stage inferred from role' AS historical_evidence_stage
FROM targets d JOIN workflow_comments c ON c.document_id=d.id
LEFT JOIN document_revisions r ON r.id=c.revision_id
ORDER BY d.project_id,d.document_number,c.created_at,c.id;

-- RS07: complete resolver timeline. document_history has NO revision_id column.
-- LAG columns aid inspection; ties are ambiguous, so this is NOT a resolver verdict.
WITH target_numbers(document_number) AS (
  SELECT 'PFD-EDMS-0003' UNION ALL SELECT 'PFD-EDMS-0004'
  UNION ALL SELECT 'PID-EDMS-0002' UNION ALL SELECT 'PID-EDMS-0001'
), targets AS (
  SELECT d.* FROM engineering_documents d JOIN target_numbers n
    ON CAST(d.document_number AS BINARY)=CAST(n.document_number AS BINARY)
)
SELECT 'RS07_WORKFLOW_TIMELINE' AS result_set,d.document_number,d.id AS document_id,d.project_id,
  h.id AS history_id,h.project_id AS history_project_id,h.workflow_event,h.activity,h.workflow_status,
  h.revision_label AS historical_transition_stage,h.lifecycle_status,h.created_at,
  h.created_by_user_id,h.created_by_name_snapshot,h.created_by_official_role_snapshot,h.reason,
  COUNT(*) OVER (PARTITION BY h.document_id,h.project_id,h.created_at) AS rows_at_same_timestamp,
  LAG(h.workflow_status) OVER (PARTITION BY h.document_id,h.project_id ORDER BY h.created_at,h.id) AS previous_recorded_status,
  LAG(h.id) OVER (PARTITION BY h.document_id,h.project_id ORDER BY h.created_at,h.id) AS previous_history_id
FROM targets d JOIN document_history h ON h.document_id=d.id
ORDER BY d.project_id,d.document_number,h.project_id,h.created_at,h.id;

-- RS08: raw cardinalities used by actor-scoped Approval A fallback; not a bijection verdict.
-- All actor events count, even those with valid snapshots, as the actual resolver does.
WITH target_numbers(document_number) AS (
  SELECT 'PFD-EDMS-0003' UNION ALL SELECT 'PFD-EDMS-0004'
  UNION ALL SELECT 'PID-EDMS-0002' UNION ALL SELECT 'PID-EDMS-0001'
), targets AS (
  SELECT d.* FROM engineering_documents d JOIN target_numbers n
    ON CAST(d.document_number AS BINARY)=CAST(n.document_number AS BINARY)
)
SELECT 'RS08_APPROVAL_ACTOR_EVIDENCE' AS result_set,d.document_number,d.id AS document_id,d.project_id,
  c.created_by_user_id AS actor_user_id,COUNT(*) AS scope_joined_approval_a_events,
  SUM(c.approval_target_stage_snapshot IS NULL) AS null_stage_snapshots,
  MIN(c.created_at) AS first_comment_timestamp,MAX(c.created_at) AS last_comment_timestamp,
  (SELECT COUNT(*) FROM document_history h WHERE h.project_id=d.project_id AND h.document_id=d.id
    AND h.created_by_user_id=c.created_by_user_id AND h.workflow_event='Approval A Completed' AND h.activity='Approval A') AS matching_history_candidates,
  'UNVERIFIED: also inspect strict ordering, timestamp ties, target stage, previous state and revision window' AS resolver_status
FROM targets d JOIN workflow_comments c ON c.project_id=d.project_id AND c.document_id=d.id AND c.workflow_action='Approval A'
JOIN document_revisions r ON r.id=c.revision_id AND r.project_id=c.project_id AND r.document_id=c.document_id
GROUP BY d.document_number,d.id,d.project_id,c.created_by_user_id
ORDER BY d.project_id,d.document_number,c.created_by_user_id;

-- RS09: up to 10 comparison documents, selected ONLY with explicit, linked As-Built
-- event snapshot + matching file ownership. No status-only, role-only or path inference.
-- A verified snapshot proves a historical stage input, not live API/R2 correctness.
WITH comparison AS (
 SELECT d.document_number,d.id AS document_id,d.project_id,d.workflow_status,d.revision_label AS current_submission,
   d.active_revision_id,d.active_file_id,r.id AS revision_id,r.file_id,
   CONCAT('UPLOAD:',r.id) AS entry_id,'UPLOAD' AS event_type,r.upload_stage_snapshot AS stored_stage,
   f.uploaded_at AS event_timestamp,f.original_file_name,f.storage_key
 FROM engineering_documents d JOIN document_revisions r ON r.document_id=d.id AND r.project_id=d.project_id
 JOIN stored_files f ON f.file_id=r.file_id AND f.document_id=d.id AND f.project_id=d.project_id
 WHERE CAST(d.workflow_status AS BINARY)=CAST('Approved' AS BINARY)
   AND CAST(r.upload_stage_snapshot AS BINARY) IN (CAST('As-Built' AS BINARY),CAST('AS-Built' AS BINARY))
 UNION ALL
 SELECT d.document_number,d.id,d.project_id,d.workflow_status,d.revision_label,d.active_revision_id,d.active_file_id,r.id,r.file_id,
   CONCAT('APPROVAL_A:',c.id),'APPROVAL_A',c.approval_target_stage_snapshot,c.created_at,f.original_file_name,f.storage_key
 FROM engineering_documents d JOIN workflow_comments c ON c.document_id=d.id AND c.project_id=d.project_id
 JOIN document_revisions r ON r.id=c.revision_id AND r.document_id=d.id AND r.project_id=d.project_id
 JOIN stored_files f ON f.file_id=r.file_id AND f.document_id=d.id AND f.project_id=d.project_id
 WHERE CAST(d.workflow_status AS BINARY)=CAST('Approved' AS BINARY)
   AND CAST(c.workflow_action AS BINARY)=CAST('Approval A' AS BINARY)
   AND CAST(c.approval_target_stage_snapshot AS BINARY) IN (CAST('As-Built' AS BINARY),CAST('AS-Built' AS BINARY))
), candidates AS (
 SELECT c.*,DENSE_RANK() OVER (ORDER BY c.project_id,c.document_id) AS document_rank
 FROM comparison c WHERE CAST(c.document_number AS BINARY) NOT IN
   (CAST('PFD-EDMS-0003' AS BINARY),CAST('PFD-EDMS-0004' AS BINARY),CAST('PID-EDMS-0002' AS BINARY),CAST('PID-EDMS-0001' AS BINARY))
)
SELECT 'RS09_COMPARISON_EXPLICIT_STAGE' AS result_set,c.*,
  'VERIFIED_SNAPSHOT_INPUT_ONLY; API deployment and R2 remain UNVERIFIED' AS evidence_status
FROM candidates c WHERE document_rank<=10 ORDER BY project_id,document_id,event_timestamp,entry_id;
