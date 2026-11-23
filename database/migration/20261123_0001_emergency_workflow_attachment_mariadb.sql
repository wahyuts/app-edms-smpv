-- PREPARED ONLY / NEVER EXECUTED BY CODEX. Target: MariaDB 10.4.32.
-- Select and independently verify the intended environment and DATABASE().
-- Stop all document/background writers; obtain and verify a full same-environment
-- backup and saved SHOW CREATE TABLE + row counts/content baseline before proceeding.
-- Requires prior Approval A and revision-history snapshot migrations.
-- DBeaver: execute as SCRIPT, stop on FIRST error. Run exactly once, never retry
-- partial DDL. This guard recognizes only explicit known baseline spellings.
-- Unknown CHECK representation = STOP; inspect raw/HEX, never loosen the guard.
-- One engine variant ONLY; never run both. No startup/deployment auto execution.
-- DDL implicitly commits; ordinary ROLLBACK cannot undo this migration.
SELECT DATABASE() AS selected_schema,VERSION() AS server_version,@@hostname AS hostname,
  @@port AS port,@@session.sql_mode AS sql_mode,@@foreign_key_checks AS fk_checks;
SHOW CREATE TABLE workflow_comments;
SELECT COUNT(*) AS preflight_comment_count FROM workflow_comments;
SELECT tc.CONSTRAINT_NAME,cc.CHECK_CLAUSE,HEX(cc.CHECK_CLAUSE) AS clause_hex
FROM information_schema.TABLE_CONSTRAINTS tc JOIN information_schema.CHECK_CONSTRAINTS cc
 ON cc.CONSTRAINT_SCHEMA=tc.CONSTRAINT_SCHEMA AND cc.CONSTRAINT_NAME=tc.CONSTRAINT_NAME
WHERE tc.CONSTRAINT_SCHEMA=DATABASE() AND tc.TABLE_NAME='workflow_comments' AND tc.CONSTRAINT_TYPE='CHECK';
SET @emergency_baseline_ok = (
  DATABASE() IS NOT NULL AND VERSION() LIKE '10.4.32-MariaDB%' AND @@foreign_key_checks=1 AND @@check_constraint_checks=1
  AND (SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA=DATABASE()
    AND TABLE_NAME='workflow_comments' AND ENGINE='InnoDB')=1
  AND (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='workflow_comments'
    AND COLUMN_NAME IN ('created_by_username_snapshot','approval_target_stage_snapshot'))=2
  AND (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='workflow_comments'
    AND COLUMN_NAME='request_fingerprint')=0
  AND (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS WHERE CONSTRAINT_SCHEMA=DATABASE()
    AND CONSTRAINT_NAME='chk_workflow_comments_emergency_request')=0
  AND (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS tc JOIN information_schema.CHECK_CONSTRAINTS cc
    ON cc.CONSTRAINT_SCHEMA=tc.CONSTRAINT_SCHEMA AND cc.CONSTRAINT_NAME=tc.CONSTRAINT_NAME
    WHERE tc.CONSTRAINT_SCHEMA=DATABASE() AND BINARY tc.TABLE_NAME=BINARY 'workflow_comments'
      AND BINARY tc.CONSTRAINT_NAME=BINARY 'chk_workflow_comments_workflow_action' AND tc.CONSTRAINT_TYPE='CHECK'
      AND BINARY cc.CHECK_CLAUSE IN (
        BINARY 'workflow_action IN (''Approval A'', ''Approval B'', ''Approval C'')',
        BINARY '(`workflow_action` in (''Approval A'',''Approval B'',''Approval C''))',
        BINARY '`workflow_action` in (''Approval A'',''Approval B'',''Approval C'')',
        BINARY '(`workflow_action` in (_utf8mb4''Approval A'',_utf8mb4''Approval B'',_utf8mb4''Approval C''))'
      ))=1
  AND (SELECT COUNT(*) FROM workflow_comments WHERE workflow_action NOT IN ('Approval A','Approval B','Approval C'))=0
);
-- Invalid baseline deliberately fails during PREPARE, before any DDL.
SET @emergency_ddl = IF(@emergency_baseline_ok,
 'ALTER TABLE workflow_comments
   ADD COLUMN request_fingerprint VARCHAR(64) NULL DEFAULT NULL AFTER approval_target_stage_snapshot,
   DROP CONSTRAINT chk_workflow_comments_workflow_action,
   ADD CONSTRAINT chk_workflow_comments_workflow_action CHECK (workflow_action IN (''Approval A'',''Approval B'',''Approval C'',''Emergency Workflow Attachment'')),
   ADD CONSTRAINT chk_workflow_comments_emergency_request CHECK (
     (workflow_action = ''Emergency Workflow Attachment'' AND request_fingerprint IS NOT NULL AND CHAR_LENGTH(request_fingerprint) = 64 AND revision_id IS NULL AND approval_target_stage_snapshot IS NULL)
     OR (workflow_action IN (''Approval A'',''Approval B'',''Approval C'') AND request_fingerprint IS NULL))',
 'SELECT * FROM information_schema.EMERGENCY_STOP_BASELINE_MISMATCH');
PREPARE emergency_migration FROM @emergency_ddl;
EXECUTE emergency_migration;
DEALLOCATE PREPARE emergency_migration;
-- Verification: compare saved baseline; counts alone do not prove content preservation.
SHOW CREATE TABLE workflow_comments;
SELECT COUNT(*) AS postflight_comment_count,
  SUM(request_fingerprint IS NOT NULL) AS unexpected_existing_fingerprints
FROM workflow_comments;
SELECT COLUMN_NAME,COLUMN_TYPE,IS_NULLABLE,COLUMN_DEFAULT FROM information_schema.COLUMNS
 WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='workflow_comments' AND COLUMN_NAME='request_fingerprint';
SELECT tc.CONSTRAINT_NAME,cc.CHECK_CLAUSE
FROM information_schema.TABLE_CONSTRAINTS tc JOIN information_schema.CHECK_CONSTRAINTS cc
 ON cc.CONSTRAINT_SCHEMA=tc.CONSTRAINT_SCHEMA AND cc.CONSTRAINT_NAME=tc.CONSTRAINT_NAME
WHERE tc.CONSTRAINT_SCHEMA=DATABASE() AND tc.TABLE_NAME='workflow_comments' AND tc.CONSTRAINT_TYPE='CHECK';
-- Required postflight: VARCHAR(64) NULL DEFAULT NULL; fingerprints all NULL before
-- writers resume; old rows unchanged; both new CHECK definitions match this DDL;
-- MySQL ENFORCED=YES / MariaDB check_constraint_checks=1; all original FK/indexes
-- and other CHECKs unchanged. New action accepted logically, invalid actions rejected.
-- Actual CHECK enforcement/insert tests: NOT VERIFIED - DATABASE RUNTIME REQUIRED.
-- Recovery: stop on error, inspect SHOW CREATE TABLE for partial application.
-- Do NOT DROP/recreate automatically. Keep flags OFF. Prefer rolling back code while
-- retaining additive schema. Removing schema later requires a separate owner-reviewed
-- plan: Emergency rows cannot satisfy old A/B/C CHECK, and removing fingerprints
-- destroys durable retry evidence. No historical row deletion/backfill is authorized.
-- Restore is a separately authorized full recovery using the verified backup.
