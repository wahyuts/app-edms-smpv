-- READ ONLY: MySQL 8.x/9.x InnoDB baseline inspection. NOT EXECUTED.
-- Run only after explicit approval, against the intended database.
-- Keep this connection open through verification; export all results as evidence.
SELECT DATABASE() AS active_database, VERSION() AS database_version,
  @@version_comment AS database_engine, @@sql_mode AS sql_mode,
  @@innodb_page_size AS innodb_page_size;
SHOW CREATE TABLE users;
SELECT COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE, COLUMN_DEFAULT, COLLATION_NAME,
  EXTRA, GENERATION_EXPRESSION
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users';
SELECT INDEX_NAME, NON_UNIQUE, SEQ_IN_INDEX, COLUMN_NAME, SUB_PART, INDEX_TYPE
FROM information_schema.STATISTICS
WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users';
SELECT TRIGGER_NAME, ACTION_TIMING, EVENT_MANIPULATION, ACTION_STATEMENT
FROM information_schema.TRIGGERS
WHERE EVENT_OBJECT_SCHEMA = DATABASE() AND EVENT_OBJECT_TABLE = 'users';
SELECT TABLE_NAME, COLUMN_NAME, CONSTRAINT_NAME
FROM information_schema.KEY_COLUMN_USAGE
WHERE REFERENCED_TABLE_SCHEMA = DATABASE()
  AND REFERENCED_TABLE_NAME = 'users' AND REFERENCED_COLUMN_NAME = 'email';

-- Invalid values or ANY whitespace require manual review, not automatic UPDATE.
SELECT id, email, HEX(email) AS email_bytes
FROM users
WHERE email IS NULL OR email = '' OR email REGEXP '[[:space:]]'
  OR email NOT REGEXP '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$';

-- Duplicate ordinary emails under the exact proposed key collation.
SELECT LOWER(TRIM(email)) COLLATE utf8mb4_unicode_ci AS normalized_email, COUNT(*) AS total
FROM users
WHERE LOWER(TRIM(email)) COLLATE utf8mb4_bin NOT IN ('wahyu.trisna100@gmail.com', 'beta.int100@gmail.com')
GROUP BY LOWER(TRIM(email)) COLLATE utf8mb4_unicode_ci
HAVING COUNT(*) > 1;

SELECT CASE WHEN
  VERSION() NOT LIKE '%MariaDB%' AND CAST(SUBSTRING_INDEX(VERSION(), '.', 1) AS UNSIGNED) >= 8
  AND @@innodb_page_size >= 8192
  AND (@@sql_mode LIKE '%STRICT_TRANS_TABLES%' OR @@sql_mode LIKE '%STRICT_ALL_TABLES%')
  AND EXISTS (SELECT 1 FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'users' AND ENGINE = 'InnoDB' AND ROW_FORMAT IN ('Dynamic', 'Compressed'))
  AND EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'users' AND COLUMN_NAME = 'email' AND DATA_TYPE = 'varchar'
    AND CHARACTER_MAXIMUM_LENGTH = 255 AND IS_NULLABLE = 'NO'
    AND COLLATION_NAME = 'utf8mb4_unicode_ci' AND EXTRA = '' AND COLUMN_DEFAULT IS NULL AND COLUMN_COMMENT = '')
  AND (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'users' AND INDEX_NAME = 'uq_users_email') = 1
  AND EXISTS (SELECT 1 FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'users' AND INDEX_NAME = 'uq_users_email' AND NON_UNIQUE = 0
    AND COLUMN_NAME = 'email' AND SUB_PART IS NULL AND INDEX_TYPE = 'BTREE')
  AND NOT EXISTS (SELECT 1 FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'users' AND NON_UNIQUE = 0 AND COLUMN_NAME = 'email' AND INDEX_NAME <> 'uq_users_email')
  AND NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'users' AND COLUMN_NAME = 'email_uniqueness_key')
  AND NOT EXISTS (SELECT 1 FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'users' AND INDEX_NAME IN ('uq_users_email_uniqueness_key', 'idx_users_email'))
  AND NOT EXISTS (SELECT 1 FROM information_schema.TRIGGERS WHERE EVENT_OBJECT_SCHEMA = DATABASE()
    AND EVENT_OBJECT_TABLE = 'users')
  AND NOT EXISTS (SELECT 1 FROM information_schema.KEY_COLUMN_USAGE WHERE REFERENCED_TABLE_SCHEMA = DATABASE()
    AND REFERENCED_TABLE_NAME = 'users' AND REFERENCED_COLUMN_NAME = 'email')
  AND NOT EXISTS (SELECT 1 FROM users WHERE email IS NULL OR email = '' OR email REGEXP '[[:space:]]'
    OR email NOT REGEXP '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$')
  AND NOT EXISTS (SELECT 1 FROM users
    WHERE LOWER(TRIM(email)) COLLATE utf8mb4_bin NOT IN ('wahyu.trisna100@gmail.com', 'beta.int100@gmail.com')
    GROUP BY LOWER(TRIM(email)) COLLATE utf8mb4_unicode_ci HAVING COUNT(*) > 1)
  THEN 'BASELINE PASS - approval, backup and maintenance window still required'
  ELSE 'STOP - baseline incompatible; do not execute migration' END AS readiness;

-- Session variables only; no persistent database write. Export id/email bytes as backup evidence.
SET @email_before_database = DATABASE();
SELECT COUNT(*), COALESCE(JSON_OBJECTAGG(CAST(id AS CHAR), HEX(email)), JSON_OBJECT())
INTO @email_before_count, @email_before_snapshot FROM users;
SELECT @email_before_count AS users_before;
SELECT id, HEX(email) AS email_bytes_before FROM users ORDER BY id;
