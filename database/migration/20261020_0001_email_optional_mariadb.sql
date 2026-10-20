-- PHASE C1 / PREPARATION ONLY / NOT EXECUTED.
-- Explicit migration approval required. Target: local MariaDB 10.4.32 only.
-- Require MariaDB preflight BASELINE PASS and verified backup before this script.
-- Confirm local connection, edms_smpv_dev, same session; pause ALL application writers.
-- Do not use MySQL preflight/verification here. Never execute this on Railway.
-- One ALTER replaces indexes together: no separately committed DROP-only interval.
-- COPY + EXCLUSIVE deliberately rebuilds and blocks access; allow disk space/time.
-- MariaDB 10.4 DDL implicitly commits and is NOT crash-atomic like MariaDB 10.6.
-- On error/crash: STOP, inspect schema and use the approved recovery plan. No blind rerun.
ALTER TABLE edms_smpv_dev.users
  MODIFY COLUMN email VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,
  ADD COLUMN email_uniqueness_key VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
    GENERATED ALWAYS AS (
      CASE
        WHEN email IS NULL OR TRIM(email) = '' THEN NULL
        WHEN LOWER(TRIM(email)) COLLATE utf8mb4_bin IN ('wahyu.trisna100@gmail.com', 'beta.int100@gmail.com') THEN NULL
        ELSE LOWER(TRIM(email))
      END
    ) PERSISTENT,
  ADD UNIQUE KEY uq_users_email_uniqueness_key (email_uniqueness_key),
  ADD KEY idx_users_email (email),
  DROP INDEX uq_users_email,
  ALGORITHM=COPY,
  LOCK=EXCLUSIVE;
SHOW WARNINGS;
