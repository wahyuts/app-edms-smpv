-- Optional user-managed REV. metadata; unrelated to revision_label.
-- MariaDB 10.4.32 / Oracle MySQL 9.7.2. Manual execution only, once per environment.
-- Select the intended database and verify a trusted backup before executing.
-- DDL implicitly commits; do not wrap in a business transaction.
-- Re-execution fails if rev already exists: inspect metadata, do not retry blindly.
-- No backfill, seed, identity change or workflow/storage mutation.
ALTER TABLE engineering_documents
  ADD COLUMN rev VARCHAR(50) NULL DEFAULT NULL AFTER area;
