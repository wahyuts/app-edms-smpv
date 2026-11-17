-- Approval A event metadata; MariaDB 10.4.32 / MySQL 9.7.4.
-- MANUAL EXECUTION ONLY. No database is selected by this script.
-- Stop writers, verify target/version, trusted backup, and SHOW CREATE TABLE workflow_comments.
-- Both columns and the named CHECK must be absent. Stop on partial application; do not retry.
-- Apply once to the explicitly selected environment before deploying the new backend.
-- ALTER implicitly commits, may rebuild/lock the table, and is not transactionally reversible
-- on MariaDB 10.4. No automatic rollback, backfill, seed, storage IO or data changes.
-- Existing Approval A/B/C rows retain NULL metadata; existing role snapshot is reused.
ALTER TABLE workflow_comments
  ADD COLUMN created_by_username_snapshot VARCHAR(255) NULL DEFAULT NULL AFTER created_by_name_snapshot,
  ADD COLUMN approval_target_stage_snapshot VARCHAR(64) NULL DEFAULT NULL AFTER created_by_official_role_snapshot,
  ADD CONSTRAINT chk_workflow_comments_approval_target_stage
    CHECK (approval_target_stage_snapshot IS NULL OR
      (workflow_action = 'Approval A' AND approval_target_stage_snapshot IN ('IFA-Submitted', 'AS-Built')));
-- Verify column definitions/CHECK, unchanged row count/old data, and NULL new snapshots.
-- Preserve existing fullname/role, revision/upload snapshots, FKs, keys and active pointers.
