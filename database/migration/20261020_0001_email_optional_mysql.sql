-- PREPARED ONLY / NOT EXECUTED. Requires explicit database execution approval.
-- Target: MySQL 8.x/9.x, InnoDB, utf8mb4_unicode_ci, verified baseline.
-- Run 20261020_0001_email_optional_preflight.sql first. STOP unless BASELINE PASS.
-- Back up users and schema; pause user/profile writes until verification completes.
-- Single ALTER installs replacement uniqueness and removes old uniqueness together.
-- DDL implicitly commits; do not wrap this in a transaction or rerun blindly.
-- STORED generated column may rebuild/lock the table. Schedule a maintenance window.
ALTER TABLE users
  MODIFY COLUMN email VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,
  ADD COLUMN email_uniqueness_key VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
    GENERATED ALWAYS AS (
      CASE
        WHEN email IS NULL OR TRIM(email) = '' THEN NULL
        WHEN LOWER(TRIM(email)) COLLATE utf8mb4_bin IN ('wahyu.trisna100@gmail.com', 'beta.int100@gmail.com') THEN NULL
        ELSE LOWER(TRIM(email))
      END
    ) STORED,
  ADD UNIQUE KEY uq_users_email_uniqueness_key (email_uniqueness_key),
  ADD KEY idx_users_email (email),
  DROP INDEX uq_users_email;
